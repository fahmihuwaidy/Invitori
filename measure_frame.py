from PIL import Image

def measure():
    try:
        img = Image.open('src/assets/frame phone.png').convert("RGBA")
        width, height = img.size
        pixels = img.load()

        center_x, center_y = width // 2, height // 2
        
        # Scan left
        min_x = center_x
        while min_x > 0 and pixels[min_x, center_y][3] < 128:
            min_x -= 1
            
        # Scan right
        max_x = center_x
        while max_x < width - 1 and pixels[max_x, center_y][3] < 128:
            max_x += 1
            
        # Scan top
        min_y = center_y
        while min_y > 0 and pixels[center_x, min_y][3] < 128:
            min_y -= 1
            
        # Scan bottom
        max_y = center_y
        while max_y < height - 1 and pixels[center_x, max_y][3] < 128:
            max_y += 1

        print(f"Original Size: {width}x{height}")
        print(f"Inner Mask Bounds: Left={min_x}, Top={min_y}, Right={max_x}, Bottom={max_y}")
        
        # padding in pixels
        pad_top_px = min_y
        pad_bottom_px = height - max_y
        pad_left_px = min_x
        pad_right_px = width - max_x
        
        # calculate percentage based on width and height
        pad_left = (pad_left_px / width) * 100
        pad_top = (pad_top_px / height) * 100
        pad_right = (pad_right_px / width) * 100
        pad_bottom = (pad_bottom_px / height) * 100
        
        print(f"Padding Percentages: top={pad_top:.2f}%, right={pad_right:.2f}%, bottom={pad_bottom:.2f}%, left={pad_left:.2f}%")
        print(f"Padding px: top={pad_top_px}, right={pad_right_px}, bottom={pad_bottom_px}, left={pad_left_px}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    measure()
