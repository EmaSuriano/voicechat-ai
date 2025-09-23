# VoiceChat AI Assets

This directory contains application icons and assets.

## Required Icon Files

To properly build the application, you'll need the following icon files:

### macOS

- `icon.icns` - macOS application icon (512x512 recommended)

### Windows

- `icon.ico` - Windows application icon (256x256 recommended)

### Linux

- `icon.png` - Linux application icon (512x512 recommended)

## Creating Icons

You can create these icons from a high-resolution PNG (1024x1024) using:

1. **Online converters**:
   - PNG to ICO: https://convertio.co/png-ico/
   - PNG to ICNS: https://cloudconvert.com/png-to-icns

2. **Command line tools**:

   ```bash
   # For macOS ICNS
   iconutil -c icns icon.iconset/

   # For Windows ICO (using ImageMagick)
   convert icon.png -resize 256x256 icon.ico
   ```

## Temporary Setup

Currently, the icon paths in `forge.config.ts` are commented out to allow building without icons. Once you add the icon files, uncomment the icon configuration lines.
