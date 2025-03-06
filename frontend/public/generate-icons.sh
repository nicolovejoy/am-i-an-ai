#!/bin/bash

# Make sure we have the SVG file
if [ ! -f logo.svg ]; then
  echo "Error: logo.svg not found"
  exit 1
fi

# Generate favicon.ico (multi-resolution icon file)
svgexport logo.svg favicon.ico 16:16 32:32 48:48 64:64

# Generate various PNG sizes for different devices
svgexport logo.svg logo192.png 192:192
svgexport logo.svg logo512.png 512:512
svgexport logo.svg apple-touch-icon.png 180:180

echo "Icon generation complete!"
echo "Generated: favicon.ico, logo192.png, logo512.png, apple-touch-icon.png" 