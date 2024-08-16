from PIL import Image

# Open the existing image file (assuming it's a PNG with transparency)
input_image = Image.open('input.png')

# Get dimensions of the original image
width, height = input_image.size

# Create a new image with one extra row at the bottom, and make it transparent
output_image = Image.new('RGBA', (width, height + 1), (0, 0, 0, 0))

# Copy pixels row by row
for y in range(height):
    for x in range(width):
        pixel = input_image.getpixel((x, y))
        output_image.putpixel((x, y), pixel)

# Save the modified image with the transparent row
output_image.save('output.png')

# Display the modified image (optional)
output_image.show()
