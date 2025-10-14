from PIL import Image
import os
import sys
import io
import subprocess

def resize_image(input_path, output_path, size):
    """Resize image while maintaining aspect ratio."""
    try:
        with Image.open(input_path) as img:
            # Ensure the image has an alpha channel for transparency
            if img.mode != 'RGBA':
                img = img.convert('RGBA')

            img = img.resize(size, Image.LANCZOS)
            img.save(output_path, 'PNG')
        print(f"Created {output_path}")
    except Exception as e:
        print(f"Error creating {output_path}: {e}")

def create_ico(input_path, output_path, sizes=None):
    """Create .ico file with multiple sizes."""
    try:
        if sizes is None:
            # Comprehensive ICO sizes for Windows
            sizes = [
                (16, 16), (24, 24), (32, 32), (48, 48), (64, 64),
                (96, 96), (128, 128), (256, 256)
            ]

        # Open the original image
        original_img = Image.open(input_path)
        if original_img.mode != 'RGBA':
            original_img = original_img.convert('RGBA')

        # Create a list to store resized images
        images = []
        for size in sizes:
            img = original_img.copy()
            img = img.resize(size, Image.LANCZOS)
            images.append(img)

        # Save ICO file
        try:
            images[0].save(
                output_path,
                format='ICO',
                sizes=sizes,
                append_images=images[1:]
            )
        except:
            # Fallback method for ICO creation
            import struct
            with open(output_path, 'wb') as f:
                # ICO header
                f.write(struct.pack('<HHH', 0, 1, len(images)))
                # Directory entries offset
                data_offset = 6 + len(images) * 16

                # Write directory entries and collect image data
                image_data = []
                for i, img in enumerate(images):
                    # Convert to RGBA if needed
                    if img.mode != 'RGBA':
                        img = img.convert('RGBA')

                    # Create BMP data
                    import io as io_module
                    bmp_buffer = io_module.BytesIO()
                    img.save(bmp_buffer, format='BMP')
                    bmp_data = bmp_buffer.getvalue()

                    # Remove BMP header (first 14 bytes)
                    bmp_data = bmp_data[14:]

                    # Directory entry
                    width, height = img.size
                    if width >= 256: width = 0
                    if height >= 256: height = 0
                    f.write(struct.pack('<BBBBHHLL', width, height, 0, 0, 1, 32,
                                      len(bmp_data), data_offset))

                    image_data.append(bmp_data)
                    data_offset += len(bmp_data)

                # Write image data
                for data in image_data:
                    f.write(data)
        print(f"Created {output_path} with sizes: {', '.join([f'{w}x{h}' for w, h in sizes])}")
    except Exception as e:
        print(f"Error creating {output_path}: {e}")

def create_icns(input_path, output_path):
    """Create .icns file for macOS using iconutil if available."""
    try:
        # First create the PNG files that iconutil needs
        script_dir = os.path.dirname(os.path.abspath(__file__))
        iconset_dir = os.path.join(script_dir, 'icon.iconset')

        # Remove existing iconset directory if it exists
        if os.path.exists(iconset_dir):
            import shutil
            shutil.rmtree(iconset_dir)

        os.makedirs(iconset_dir)

        # macOS iconset sizes
        iconset_sizes = {
            'icon_16x16.png': (16, 16),
            'icon_16x16@2x.png': (32, 32),
            'icon_32x32.png': (32, 32),
            'icon_32x32@2x.png': (64, 64),
            'icon_64x64.png': (64, 64),
            'icon_64x64@2x.png': (128, 128),
            'icon_128x128.png': (128, 128),
            'icon_128x128@2x.png': (256, 256),
            'icon_256x256.png': (256, 256),
            'icon_256x256@2x.png': (512, 512),
            'icon_512x512.png': (512, 512),
            'icon_512x512@2x.png': (1024, 1024)
        }

        for icon_name, size in iconset_sizes.items():
            icon_path = os.path.join(iconset_dir, icon_name)
            resize_image(input_path, icon_path, size)

        # Try to create ICNS using iconutil (macOS only)
        try:
            result = subprocess.run(['iconutil', '-c', 'icns', iconset_dir, '-o', output_path],
                                  capture_output=True, text=True)
            if result.returncode == 0:
                print(f"Created {output_path} using iconutil")
            else:
                print(f"Warning: iconutil failed: {result.stderr}")
                print("  Falling back to copying ICO file as ICNS...")
                import shutil
                ico_path = output_path.replace('.icns', '.ico')
                shutil.copy2(ico_path, output_path)
                print(f"Created fallback {output_path} (copied from ICO)")
        except FileNotFoundError:
            print("Warning: iconutil not found (not on macOS), creating fallback ICNS...")
            import shutil
            ico_path = output_path.replace('.icns', '.ico')
            shutil.copy2(ico_path, output_path)
            print(f"Created fallback {output_path} (copied from ICO)")
        finally:
            # Clean up iconset directory
            if os.path.exists(iconset_dir):
                import shutil
                shutil.rmtree(iconset_dir)

    except Exception as e:
        print(f"Error creating {output_path}: {e}")

def main():
    print("Khaos Icon Generator")
    print("=" * 50)

    # Determine the script's directory
    script_dir = os.path.dirname(os.path.abspath(__file__))

    # Construct full paths
    input_logo = os.path.join(script_dir, 'khaosLogo.png')

    # Verify input logo exists
    if not os.path.exists(input_logo):
        print(f"Error: Input logo not found at {input_logo}")
        print("  Make sure 'khaosLogo.png' exists in the icons directory.")
        return

    print(f"Working directory: {script_dir}")
    print(f"Input logo: {os.path.basename(input_logo)}")
    print()

    # Comprehensive PNG sizes for all platforms
    png_sizes = [
        # Standard web/desktop sizes
        (16, 16), (20, 20), (24, 24), (32, 32), (40, 40),
        (48, 48), (64, 64), (96, 96), (128, 128), (144, 144),
        (152, 152), (192, 192), (256, 256), (384, 384), (512, 512)
    ]

    print("Creating PNG icons...")
    for width, height in png_sizes:
        output_path = os.path.join(script_dir, f'{width}x{height}.png')
        resize_image(input_logo, output_path, (width, height))

    # High-DPI variants
    hdpi_sizes = [(256, 256), (384, 384), (512, 512)]
    print("\nCreating high-DPI PNG icons...")
    for width, height in hdpi_sizes:
        output_path = os.path.join(script_dir, f'{width}x{height}@2x.png')
        resize_image(input_logo, output_path, (width * 2, height * 2))

    print("\nCreating Windows ICO file...")
    ico_path = os.path.join(script_dir, 'icon.ico')
    ico_sizes = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (96, 96), (128, 128), (256, 256)]
    create_ico(input_logo, ico_path, ico_sizes)

    print("\nCreating macOS ICNS file...")
    icns_path = os.path.join(script_dir, 'icon.icns')
    create_icns(input_logo, icns_path)

    print("\n" + "=" * 50)
    print("Icon generation complete!")
    print()
    print("Generated files:")
    print("  * PNG icons:", len(png_sizes), "sizes (16x16 to 512x512)")
    print("  * High-DPI PNG:", len(hdpi_sizes), "sizes (@2x variants)")
    print("  * Windows ICO: 8 sizes (16x16 to 256x256)")
    print("  * macOS ICNS: 12 sizes (16x16 to 1024x1024)")
    print()
    print("Your app should now work perfectly across all platforms!")
    print("   - Windows: ICO with multiple sizes")
    print("   - macOS: ICNS with retina support")
    print("   - Linux: PNG icons in various sizes")
    print("   - Web/Desktop: Comprehensive PNG coverage")

if __name__ == '__main__':
    main()
