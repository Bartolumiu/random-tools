# Mass Rename Tools

Utilities for bulk file creation and renaming.

## Requirements
- Python 3.x

## Scripts

### file_nuker.py
Delete all files in a directory:
```pwsh
python file_nuker.py path/to/directory
```

### generate.py
Generate test files in `./test` folder:
```pwsh
python generate.py
```

### padding.py
Add numeric padding to filenames:
```pwsh
python padding.py path/to/directory [-p PADDING] [-w WORKERS]
```
- `-p`, `--padding`: Number of digits.
- `-w`, `--workers`: Number of threads.

## License
GPL-3.0
