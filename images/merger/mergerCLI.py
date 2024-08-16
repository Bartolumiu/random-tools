# Simple Image Merger
# Version: 1.0
# Author: https://github.com/Bartolumiu
# GitHub repository: https://github.com/Bartolumiu/random-tools

import argparse
import os
from PIL import Image


def merge_images(input_folder, output_folder, output_file="output.png", horizontal=False):
    try:
        images = []
        total_width = 0
        total_height = 0
        count = 1

        # Open and process each image
        for filename in sorted(os.listdir(input_folder)):
            if filename.endswith(('.png', '.jpg', '.jpeg')):
                print(f"Processing image: {filename} ", count)
                image_path = os.path.join(input_folder, filename)
                image = Image.open(image_path)
                images.append(image)
                count += 1

        # Calculate total dimensions
        for img in images:
            if horizontal:
                total_width += img.width
                total_height = max(total_height, img.height)
            else:
                total_height += img.height
                total_width = max(total_width, img.width)

        # Create a new blank image with adjusted dimensions
        merged_image = Image.new("RGBA", (total_width, total_height))

        # Paste each image into the new image
        position = (0, 0)
        for img in images:
            merged_image.paste(img, position)
            if horizontal:
                position = (position[0] + img.width, 0)
            else:
                position = (0, position[1] + img.height)

        # Save the merged image
        output_path = os.path.join(output_folder, output_file)
        merged_image.save(output_path)
        print(f"Merged images saved as {output_file}\nOutput folder: {output_folder}")
    except Exception as e:
        print(f"An error occurred during image merging: {str(e)}")


def parse_arguments():
    parser = argparse.ArgumentParser(description="Merge images from a folder into a single image")
    parser.add_argument("--input", required=True, help="Input folder containing images")
    parser.add_argument("--output", default="output.png", help="Output file name")
    parser.add_argument("--horizontal", action="store_true", help="Merge horizontally instead of vertically")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_arguments()
    input_folder = args.input
    output_folder = os.path.dirname(args.output)
    output_file = os.path.basename(args.output)
    merge_images(input_folder, output_folder, output_file, args.horizontal)
