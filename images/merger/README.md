# Image Merger

Merge multiple images into one image via CLI or GUI.

## Requirements
- Python 3.x
- Pillow (`pip install Pillow`)
- Tkinter (standard in most Python installs)

## Scripts

### Command Line (mergerCLI.py)
Merge all images in a folder:
```pwsh
python mergerCLI.py --input path/to/images --output path/to/output.png [--horizontal]
```
- `--input`: Folder containing images.
- `--output`: Output file (defaults to `output.png`).
- `--horizontal`: Merge images side-by-side. Default stacks vertically.

### GUI (mergerGUI.py)
Launch a simple GUI:
```pwsh
python mergerGUI.py
```
Use the interface to select input folder, output folder, file name, and orientation.

## License
GPL-3.0
