'''
WebP to PNG
Mass converts files from WebP to PNG format
Author: https://github.com/Bartolumiu
License: GPL-3.0
'''
from PIL import Image
import os

def convert_webp_to_png(input_folder, output_folder):
    # Create the output folder if it doesn't exist
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    # Loop through all files in the input folder
    for filename in os.listdir(input_folder):
        if filename.endswith('.webp'):
            # Open the .webp image
            with Image.open(os.path.join(input_folder, filename)) as img:
                # Create the output filename by replacing .webp with .png
                output_filename = os.path.splitext(filename)[0] + '.png'
                # Save the image as .png in the output folder
                img.save(os.path.join(output_folder, output_filename), 'PNG')

input_folder = 'in'
output_folder = 'out'

convert_webp_to_png(input_folder, output_folder)
