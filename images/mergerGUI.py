# Simple Image Merger
# Version: 1.0
# Author: https://github.com/Bartolumiu
# GitHub repository: https://github.com/Bartolumiu/random-tools

import os
import tkinter as tk
import webbrowser
from tkinter import filedialog, messagebox
from PIL import Image

def merge_images_vertically(input_folder, output_folder, output_file="output.png", merge_vertically=True):
    try:
        images = []
        total_width = 0
        total_height = 0

        # Open and process each image
        for filename in sorted(os.listdir(input_folder)):
            if filename.endswith(('.png', '.jpg', '.jpeg')):
                image_path = os.path.join(input_folder, filename)
                image = Image.open(image_path)
                images.append(image)

        # Calculate total dimensions
        for img in images:
            if merge_vertically:
                total_height += img.height
                total_width = max(total_width, img.width)
            else:
                total_width += img.width
                total_height = max(total_height, img.height)

        # Create a new blank image with adjusted dimensions
        merged_image = Image.new("RGBA", (total_width, total_height))

        # Paste each image into the new image
        position = (0, 0)
        for img in images:
            merged_image.paste(img, position)
            if merge_vertically:
                position = (0, position[1] + img.height)
            else:
                position = (position[0] + img.width, 0)

        # Save the merged image
        output_path = os.path.join(output_folder, output_file)
        merged_image.save(output_path)
        messagebox.showinfo("Success", f"Merged images saved as {output_file}\nOutput folder: {output_folder}")
    except Exception as e:
        messagebox.showerror("Error", f"An error occurred during image merging: {str(e)}")

def browse_folder(entry):
    folder_path = filedialog.askdirectory()
    entry.delete(0, tk.END)
    entry.insert(0, folder_path)

def merge_images():
    input_folder = input_folder_entry.get()
    output_folder = output_folder_entry.get() or os.getcwd()
    output_file = output_file_entry.get()
    merge_vertically = merge_orientation.get() == "Vertical"
    
    # Merge images sequentially
    merge_images_vertically(input_folder, output_folder, output_file, merge_vertically)

# GUI Setup
root = tk.Tk()
root.title("Image Merger v1.0")

# Title
title_label = tk.Label(root, text="Image Merger v1.0", font=("Arial", 16))
title_label.grid(row=0, column=0, columnspan=3, padx=5, pady=0)

# Author
author_label = tk.Label(root, text="by Bartolumiu", font=("Arial", 8, "underline"), cursor="hand2")
author_label.grid(row=0, column=2, padx=5, pady=0)
author_label.bind("<Button-1>", lambda e: webbrowser.open_new("https://github.com/Bartolumiu"))

# Description
description_label = tk.Label(root, text="Merge images from a folder into a single image", font=("Arial", 12))
description_label.grid(row=1, column=0, columnspan=3, padx=5, pady=0)

# Input Folder Selection
input_folder_label = tk.Label(root, text="Input Folder:")
input_folder_label.grid(row=2, column=0, padx=5, pady=5)
input_folder_entry = tk.Entry(root, width=40)
input_folder_entry.grid(row=2, column=1, padx=5, pady=5)
browse_button = tk.Button(root, text="Browse", command=lambda: browse_folder(input_folder_entry))
browse_button.grid(row=2, column=2, padx=5, pady=5)

# Output Folder Selection
output_folder_label = tk.Label(root, text="Output Folder:")
output_folder_label.grid(row=3, column=0, padx=5, pady=5)
output_folder_entry = tk.Entry(root, width=40)
output_folder_entry.grid(row=3, column=1, padx=5, pady=5)
browse_button = tk.Button(root, text="Browse", command=lambda: browse_folder(output_folder_entry))
browse_button.grid(row=3, column=2, padx=5, pady=5)

# Output File Entry
output_file_label = tk.Label(root, text="Output File:")
output_file_label.grid(row=4, column=0, padx=5, pady=5)
output_file_entry = tk.Entry(root, width=40)
output_file_entry.grid(row=4, column=1, padx=5, pady=5)
output_file_entry.insert(0, "output.png")

# Merge Orientation Dropdown
merge_orientation_label = tk.Label(root, text="Merge Orientation:")
merge_orientation_label.grid(row=5, column=0, padx=5, pady=5)
merge_orientation_options = [("Vertical"), ("Horizontal")]
merge_orientation = tk.StringVar(root)
merge_orientation.set("Vertical")  # Default: merge vertically
merge_orientation_dropdown = tk.OptionMenu(root, merge_orientation, *merge_orientation_options)
merge_orientation_dropdown.grid(row=5, column=2, padx=5, pady=5)

# Merge Button
merge_button = tk.Button(root, text="Merge Images", command=merge_images)
merge_button.grid(row=6, column=0, columnspan=3, padx=5, pady=5)

root.mainloop()
