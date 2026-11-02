"""Generate the extension's own notebook icon with Python's standard library."""
import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "extension" / "icons"
ROOT.mkdir(exist_ok=True)


def pixel(x, y):
    if not (0 <= x < 128 and 0 <= y < 128):
        return (0, 0, 0, 0)
    # Rounded green tile.
    cx, cy = min(max(x, 25), 103), min(max(y, 25), 103)
    if (x - cx) ** 2 + (y - cy) ** 2 > 25 ** 2:
        return (0, 0, 0, 0)
    green, paper = (52, 120, 75, 255), (251, 253, 247, 255)
    if 35 <= x <= 92 and 25 <= y <= 103:
        if x < 41:
            return (210, 232, 208, 255)
        if 51 <= x <= 77 and (45 <= y <= 50 or 61 <= y <= 66 or 77 <= y <= 82):
            return green
        return paper
    return green


for size in (16, 32, 48, 128):
    rows = []
    for row in range(size):
        pixels = bytearray()
        for col in range(size):
            samples = [pixel((col + (sx + .5) / 4) * 128 / size, (row + (sy + .5) / 4) * 128 / size) for sy in range(4) for sx in range(4)]
            pixels.extend(round(sum(p[k] for p in samples) / 16) for k in range(4))
        rows.append(b"\0" + pixels)

    def chunk(kind, data):
        return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)

    png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)) + chunk(b"IDAT", zlib.compress(b"".join(rows), 9)) + chunk(b"IEND", b"")
    (ROOT / f"{size}.png").write_bytes(png)
print("Icons generated: 16, 32, 48, 128 px")
