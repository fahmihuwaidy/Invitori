from PIL import Image
img = Image.open('src/assets/frame phone.png').convert("RGBA")
width, height = img.size
pixels = img.load()

# Find the bounding box of transparent or near-transparent pixels
min_x, max_x = width, 0
min_y, max_y = height, 0

for y in range(height):
    for x in range(width):
        r, g, b, a = pixels[x, y]
        # if alpha is very low, it's the screen cutout
        if a < 50:
            if x < min_x: min_x = x
            if x > max_x: max_x = x
            if y < min_y: min_y = y
            if y > max_y: max_y = y

if min_x <= max_x and min_y <= max_y:
    print(f"Screen mask bounds: Left={min_x}, Top={min_y}, Right={max_x}, Bottom={max_y}")
    print(f"Width={max_x-min_x}, Height={max_y-min_y}")
else:
    print("No transparent pixels found!")
