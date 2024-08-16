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

        # Create a new subdirectory for each input image with the same name
        part_output_directory = os.path.join(output_directory, os.path.splitext(os.path.basename(input_image_path))[0])
        os.makedirs(part_output_directory, exist_ok=True)
        
        # Generate output filename with sequential numbering like '001.png', '002.png', ..., '999.png'
        output_filename = f"{i+1:03d}.png"
        output_path = os.path.join(part_output_directory, output_filename)
        
        # Save each part with a unique name
        cropped_image.save(output_path)
        print(f"Saved part {i+1} to {output_path}")
    
    print(f"Image divided into {num_parts} parts.")

def run(input_dir, output_dir, num_parts):
    # Iterate through each file in the input directory
    for filename in os.listdir(input_dir):
        # Check if the file is an image
        if filename.endswith(".png") or filename.endswith(".jpg"):
            # Generate the full path to the input image
            input_image_path = os.path.join(input_dir, filename)
            
            # Call the divide_image_vertically function
            divide_image_vertically(input_image_path, output_dir, num_parts)
        else:
            print(f"Skipping non-image file: {filename}")

if __name__ == "__main__":
    # Setup argument parser
    parser = argparse.ArgumentParser(description='Divide an image vertically into specified number of parts.')
    parser.add_argument('-p', '--parts', type=int, help='Number of parts to divide the image into', required=True)
    parser.add_argument('--input-dir', '-i', '--input', type=str, default='./in', help='Path to the input directory (default: ./in)')
    parser.add_argument('--output-dir', '-o', '--output', type=str, default='./out', help='Directory to save output parts (default: ./out)')
    
    # Parse arguments
    args = parser.parse_args()
    
    # Check if output directory exists, create if not
    os.makedirs(args.input_dir, exist_ok=True)
    os.makedirs(args.output_dir, exist_ok=True)
    
    # Call function to divide the image
    run(args.input_dir, args.output_dir, args.parts)