# Image Divider

Divide images vertically into equal parts and optionally add extra rows.

## Requirements
- Python 3.x
- Pillow (`pip install Pillow`)

## Scripts

### divider.py
Divide a single image into N vertical parts:
```pwsh
python divider.py --input path/to/image.png --parts 4 --output-dir path/to/output
```
- `-i, --input`: Path to input image.
- `-p, --parts`: Number of parts.
- `-o, --output-dir`: Output directory (default: `./output`).

### mass_divider.py
Batch process all images in a directory:
```pwsh
python mass_divider.py --input-dir path/to/in --output-dir path/to/out --parts 4
```
- `--input-dir`: Directory with input images.
- `--output-dir`: Directory to save parts.
- `--parts`: Number of parts per image.

### add_row.py
Add a transparent row at the bottom of a single image:
```pwsh
python add_row.py
```
Edit the script to set `input.png` before running.

## License
GPL-3.0
