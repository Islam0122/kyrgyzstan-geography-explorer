"""Convert an original photo into the files expected by src/data/images.ts.

    python3 scripts/prepare_photos.py <original.jpg> <photo-id>

Writes public/photos/<folder>/<id>.webp (1920 px) + <id>-1280.webp + <id>-640.webp and prints
width/height to copy into images.ts (then set status: 'ready', responsive: true and fill the
photographer / source / sourceUrl / license fields from the original page).
"""
import re
import sys
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SIZES = [(1920, ''), (1280, '-1280'), (640, '-640')]


def folder_of(photo_id: str) -> str:
    src = (ROOT / 'src/data/images.ts').read_text(encoding='utf-8')
    m = re.search(r"id: '" + re.escape(photo_id) + r"',\s*folder: '(\w+)'", src)
    if not m:
        sys.exit(f'unknown photo id: {photo_id}')
    return m.group(1)


def main() -> None:
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    original, photo_id = Path(sys.argv[1]), sys.argv[2]
    out_dir = ROOT / 'public/photos' / folder_of(photo_id)
    out_dir.mkdir(parents=True, exist_ok=True)
    img = ImageOps.exif_transpose(Image.open(original)).convert('RGB')
    if img.width < 1200:
        print(f'warning: original is only {img.width}px wide')
    master = None
    for width, suffix in SIZES:
        w = min(width, img.width)
        im = img.resize((w, round(img.height * w / img.width)), Image.LANCZOS)
        path = out_dir / f'{photo_id}{suffix}.webp'
        im.save(path, 'WEBP', quality=80 if width > 640 else 76, method=6)
        print(f'{path.relative_to(ROOT)}  {im.width}x{im.height}  {path.stat().st_size // 1024} KB')
        master = master or im
    print(f'\nimages.ts → width: {master.width}, height: {master.height}, responsive: true, status: \'ready\'')


if __name__ == '__main__':
    main()
