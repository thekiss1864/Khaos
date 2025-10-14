# 🎨 Icons Setup - TODO

## Current Status
The icon configuration has been temporarily removed from `tauri.conf.json` to allow the app to build and run during initial development.

## What You Need to Do (Before Production Build)

### Option 1: Use Tauri's Icon Generator (Recommended)

1. **Create a high-resolution icon** (1024x1024 PNG with transparent background)
   - Save it as `app-icon.png` in the project root

2. **Install Tauri CLI** (if not already installed):
   ```bash
   cargo install tauri-cli
   ```

3. **Generate all required icons**:
   ```bash
   cargo tauri icon app-icon.png
   ```
   
   This automatically creates:
   - `icons/32x32.png`
   - `icons/128x128.png`
   - `icons/128x128@2x.png`
   - `icons/icon.icns` (macOS)
   - `icons/icon.ico` (Windows)
   - `icons/icon.png` (Linux)

4. **Update `tauri.conf.json`**:
   ```json
   "bundle": {
     "active": true,
     "targets": "all",
     "identifier": "com.khaos.app",
     "icon": [
       "icons/32x32.png",
       "icons/128x128.png",
       "icons/128x128@2x.png",
       "icons/icon.icns",
       "icons/icon.ico"
     ]
   }
   ```

### Option 2: Use Placeholder Icons

For quick testing, you can use placeholder icons:

1. **Create icons directory**:
   ```bash
   mkdir src-tauri/icons
   ```

2. **Download a placeholder or use an online tool** to create simple icons
   - Windows: `icon.ico` (multiple sizes: 256, 128, 64, 48, 32, 16)
   - macOS: `icon.icns`
   - Linux: PNG files (32x32, 128x128, etc.)

### Option 3: Skip Icons for Development

The current configuration works for development! Icons are only required for:
- Production builds
- Creating installers (.msi, .dmg, .deb, etc.)

## Development vs Production

### Development (Current State)
✅ **Works without icons** - App runs fine with `bun run tauri:dev`
- Tauri will use default system icon
- Perfect for development and testing

### Production Build
❌ **Requires icons** - Won't build without proper icons
- Run `bun run tauri:build`
- Must have icons in place

## Quick Fix for Production

If you need to build NOW without custom icons:

1. **Download Tauri's default icons**:
   ```bash
   curl -o src-tauri/icons/icon.png https://raw.githubusercontent.com/tauri-apps/tauri/dev/tooling/cli/templates/app/app-icon.png
   ```

2. **Generate from the default**:
   ```bash
   cargo tauri icon src-tauri/icons/icon.png
   ```

## Icon Design Tips

When creating your custom icon:
- **Size**: 1024x1024 pixels minimum
- **Format**: PNG with transparency
- **Style**: Simple, recognizable at small sizes
- **Colors**: Use your brand colors
- **Background**: Transparent (for modern look)
- **Testing**: View at 32x32 to ensure clarity

## Current Workaround

The app is currently configured to run in development mode without icons. This is intentional and allows you to:
- Start development immediately
- Test all features
- Build the UI and functionality
- Add icons later before production release

## Need Help?

- [Tauri Icon Guide](https://tauri.app/v1/guides/features/icons)
- [Icon Generator Tools](https://icon.kitchen/) - Online tool
- Check `DEPLOYMENT.md` for production build details

---

**For now, just focus on building your app!** Icons can be added anytime before your production release. 🚀

