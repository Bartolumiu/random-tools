'''
Author: https://github.com/Bartolumiu
License: GPL-3.0
Description:
    Generate files in a specified directory using threading.
    This script is used to generate test files for the padding.py script, so it may not be useful on its own.
Usage:
    python generate.py
Arguments:
    None
'''

import os
import concurrent.futures

# Function to generate filenames for the first format: 1, 2, 3, ..., 100, etc.
def generate_filenames_first_format(start=1, end=100):
    return [str(i) for i in range(start, end + 1)]

# Function to generate filenames for the second format: 1a, 1b, ..., 2a, ..., 2z, etc.
def generate_filenames_second_format(start=1, end=100):
    import string
    filenames = []
    for i in range(start, end + 1):
        for letter in string.ascii_lowercase:
            filenames.append(f"{i}{letter}")
    return filenames

# Function to generate filenames for the third format: 01, 02, ..., 100, etc.
def generate_filenames_third_format(start=1, end=100):
    return [f"{i:02}" for i in range(start, end + 1)]

# Folder path
folder_path = './test'

# Create the folder if it doesn't exist
os.makedirs(folder_path, exist_ok=True)

# Generate filenames for all three formats
filenames_first = generate_filenames_first_format(1, 100)
filenames_second = generate_filenames_second_format(1, 10000)
filenames_third = generate_filenames_third_format(1, 10000)

# Function to create empty files based on the list of filenames
def create_file(filename, folder_path):
    file_path = os.path.join(folder_path, f"{filename}.txt")
    with open(file_path, 'w') as f:
        f.write("")  # Create empty file

def create_files_from_filenames(filenames, folder_path):
    # Use ThreadPoolExecutor for concurrent file creation
    with concurrent.futures.ThreadPoolExecutor() as executor:
        executor.map(lambda filename: create_file(filename, folder_path), filenames)

# Create files for the first format
# create_files_from_filenames(filenames_first, folder_path)

# Create files for the second format
create_files_from_filenames(filenames_second, folder_path)

# Create files for the third format
# create_files_from_filenames(filenames_third, folder_path)
