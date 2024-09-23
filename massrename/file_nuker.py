'''
Author: https://github.com/Bartolumiu
License: GPL-3.0
Description:
    Delete all files in a specified directory using threading.
Usage:
    python file_nuker.py directory
Arguments:
    directory: Directory containing the files to delete.
Examples:
    python file_nuker.py test
'''

import argparse
import os
import glob
import concurrent.futures

def delete_file(file_path):
    """Delete a single file and print the result."""
    try:
        os.remove(file_path)  # Remove the file
        print(f"Deleted: {file_path}")
    except Exception as e:
        print(f"Error deleting {file_path}: {e}")

def delete_files(directory):
    """Delete all files in the specified directory using threading."""
    # Use glob to match all files in the directory
    files = glob.glob(os.path.join(directory, '*'))  # Matches all files in the directory

    # Use ThreadPoolExecutor for parallel deletion of files
    with concurrent.futures.ThreadPoolExecutor() as executor:
        executor.map(delete_file, files)  # Map the delete_file function to all files

def main():
    parser = argparse.ArgumentParser(description="Delete all files in a specified directory using threading.")
    parser.add_argument("directory", help="Directory containing the files to delete.", type=str)

    args = parser.parse_args()

    delete_files(args.directory)

if __name__ == "__main__":
    main()