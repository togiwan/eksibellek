"""Package only extension assets, with deterministic ZIP metadata."""
import json
import zipfile
from pathlib import Path

root = Path(__file__).resolve().parents[1]
source = root / "extension"
version = json.loads((source / "manifest.json").read_text())["version"]
target = root / "dist" / f"eksibellek-{version}.zip"
target.parent.mkdir(exist_ok=True)
with zipfile.ZipFile(target, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    for path in sorted(source.rglob("*")):
        if path.is_file() and path.suffix in {".json", ".js", ".css", ".html", ".png", ".txt"}:
            info = zipfile.ZipInfo(path.relative_to(source).as_posix(), (2026, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            archive.writestr(info, path.read_bytes())
print(target)
