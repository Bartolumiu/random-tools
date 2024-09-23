'''
Author: https://github.com/Bartolumiu
License: GPL-3.0
Description:
    Rename files in a directory by adding padding to numerical filenames.
    By default, the script will determine the largest padding needed and use all available CPU cores for parallel processing.
Usage:
    python padding.py directory [-p PADDING] [-w WORKERS]
Arguments:
    directory: The directory containing the files to rename.
    -p, --padding: Number of digits to pad the filenames to.
    -w, --workers: Number of threads to use for parallel processing.
Examples:
    python padding.py images
    python padding.py images -p 3
    python padding.py images -w 4
    python padding.py images -p 2 -w 2
Testing results:
    For the test folder with 260000 files, the script took the following time to rename the files:
    - Single-threaded: 3m 25s
    - Multi-threaded (6 threads): 1m 35s
    - Multi-threaded (12 threads): 1m 08s (best performance, but not a really big difference for this amount of files, due to the GIL in Python)
'''

import argparse
import os
import re
import concurrent.futures
import logging
from functools import partial

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def get_largest_padding(filenames, pattern):
    # Precompiled pattern, finding the maximum length of numbers at the beginning of filenames
    return max((len(match.group(1)) for filename in filenames 
                if (match := pattern.match(filename))), default=0)

def pad_and_rename_file(filename, directory, padding, pattern):
    match = pattern.match(filename)
    if match:
        number, rest = match.groups()
        new_filename = f"{number.zfill(padding)}{rest}"
        if filename != new_filename:
            old_path = os.path.join(directory, filename)
            new_path = os.path.join(directory, new_filename)
            os.rename(old_path, new_path)
            logging.info(f"Renamed: '{filename}' to '{new_filename}'")  # Log successful rename
            return (filename, new_filename)
    return None

def process_filenames(directory, padding=None, workers=None):
    # List all filenames once, minimize filesystem calls
    filenames = os.listdir(directory)

    # Compile regex pattern for efficiency
    pattern = re.compile(r'^(\d+)(.*)')

    # Determine the largest padding only if not provided
    if padding is None:
        padding = get_largest_padding(filenames, pattern)

    logging.info(f"Using padding: {padding}")

    # Use concurrent.futures for parallel renaming
    if workers is None:
        workers = os.cpu_count()  # Default to the number of available CPU cores
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as executor:
        rename_func = partial(pad_and_rename_file, directory=directory, padding=padding, pattern=pattern)
        results = list(executor.map(rename_func, filenames))

    # Report renamed files
    renamed_files = [result for result in results if result]
    logging.info(f"Renamed {len(renamed_files)} files.")

def main():
    parser = argparse.ArgumentParser(description="Add padding to numerical filenames.")
    parser.add_argument("directory", help="Directory containing the files to rename.", default=".", type=str)
    parser.add_argument("-p", "--padding", help="Number of digits to pad the filenames to.", type=int)
    parser.add_argument("-w", "--workers", help="Number of threads to use for parallel processing. Default value is the amount of cores on the system.", type=int)

    args = parser.parse_args()

    # Pass workers as None if not provided, so it defaults to the number of CPU cores
    process_filenames(args.directory, args.padding, args.workers)

if __name__ == "__main__":
    main()