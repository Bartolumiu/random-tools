import argparse
import os
from PIL import Image

def divide_image_vertically(input_image_path, output_directory, num_parts):
    # Open the input image
    input_image = Image.open(input_image_path)
    
    # Get dimensions of the original image
    width, height = input_image.size
    
    # Calculate height of each part
    part_height = height // num_parts
    
    # Iterate through each part
    for i in range(num_parts):
        # Calculate coordinates for cropping each part
        left = 0
        upper = i * part_height
        right = width
        lower = (i + 1) * part_height
        
        # Crop the image to extract the part
        cropped_image = input_image.crop((left, upper, right, lower))
        
        # Generate output filename with sequential numbering like '001.png', '002.png', ..., '999.png'
        output_filename = f"{i+1:03d}.png"
        output_path = os.path.join(output_directory, output_filename)
        
        # Save each part with a unique name
        cropped_image.save(output_path)
        print(f"Saved part {i+1} to {output_path}")
    
    print(f"Image divided into {num_parts} parts.")

if __name__ == "__main__":
    # Setup argument parser
    parser = argparse.ArgumentParser(description='Divide an image vertically into specified number of parts.')
    parser.add_argument('-p', '--parts', type=int, help='Number of parts to divide the image into', required=True)
    parser.add_argument('-i', '--input', type=str, help='Path to the input image file', required=True)
    parser.add_argument('--output-dir', '-o', '--output', type=str, default='./output', help='Directory to save output parts (default: ./output)')
    
    # Parse arguments
    args = parser.parse_args()
    
    # Check if output directory exists, create if not
    os.makedirs(args.output_dir, exist_ok=True)
    
    # Call function to divide the image
    divide_image_vertically(args.input, args.output_dir, args.parts)