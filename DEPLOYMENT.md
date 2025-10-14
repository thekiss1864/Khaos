# Deployment Guide

Complete guide for building and distributing your Khaos Tauri application.

## 🏭 Building for Production

### Quick Build

```bash
bun run tauri:build
# or
npm run tauri:build
```

This will create platform-specific installers in `src-tauri/target/release/bundle/`

### Build Configuration

Edit `src-tauri/tauri.conf.json` to customize:

```json
{
  "package": {
    "productName": "Khaos",
    "version": "0.1.0"
  },
  "tauri": {
    "bundle": {
      "identifier": "com.khaos.app",
      "icon": [
        "icons/32x32.png",
        "icons/128x128.png",
        "icons/icon.icns",
        "icons/icon.ico"
      ],
      "active": true,
      "targets": "all"
    }
  }
}
```

## 🖼️ Creating Icons

### Required Icon Formats

- **Windows**: `.ico` (256x256, 128x128, 64x64, 48x48, 32x32, 16x16)
- **macOS**: `.icns` (1024x1024, 512x512, 256x256, 128x128, 64x64, 32x32, 16x16)
- **Linux**: `.png` (512x512, 256x256, 128x128, 64x64, 32x32)

### Icon Generation

1. Create a high-resolution PNG (1024x1024)
2. Use Tauri's icon generator:

```bash
cargo install tauri-cli
cargo tauri icon path/to/your/icon.png
```

This automatically generates all required formats in `src-tauri/icons/`

## 📦 Platform-Specific Builds

### Windows

**Outputs**:
- `.msi` - Windows Installer
- `.exe` - Standalone executable

**Location**: `src-tauri/target/release/bundle/msi/`

**Requirements**:
- WiX Toolset v3 (for `.msi`)

**Install WiX**:
```bash
# Download from: https://wixtoolset.org/releases/
```

### macOS

**Outputs**:
- `.dmg` - Disk Image
- `.app` - Application Bundle

**Location**: `src-tauri/target/release/bundle/dmg/`

**Code Signing** (optional but recommended):
1. Get an Apple Developer Certificate
2. Configure in `tauri.conf.json`:

```json
{
  "tauri": {
    "bundle": {
      "macOS": {
        "signingIdentity": "Developer ID Application: Your Name (TEAM_ID)",
        "entitlements": null,
        "exceptionDomain": null
      }
    }
  }
}
```

### Linux

**Outputs**:
- `.deb` - Debian package
- `.AppImage` - Portable application
- `.rpm` - Red Hat package (if configured)

**Location**: `src-tauri/target/release/bundle/`

**Requirements**:
```bash
# Ubuntu/Debian
sudo apt install libwebkit2gtk-4.0-dev build-essential curl wget libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev

# Fedora
sudo dnf install webkit2gtk3-devel openssl-devel curl wget libappindicator-gtk3 librsvg2-devel
```

## 🔐 Code Signing

### Windows Code Signing

1. Obtain a code signing certificate
2. Configure in `tauri.conf.json`:

```json
{
  "tauri": {
    "bundle": {
      "windows": {
        "certificateThumbprint": "YOUR_CERT_THUMBPRINT",
        "digestAlgorithm": "sha256",
        "timestampUrl": "http://timestamp.digicert.com"
      }
    }
  }
}
```

### macOS Code Signing & Notarization

1. Get certificates from Apple Developer:
   - Developer ID Application
   - Developer ID Installer

2. Configure signing:
```bash
export APPLE_CERTIFICATE="Developer ID Application: Your Name"
export APPLE_CERTIFICATE_PASSWORD="cert-password"
export APPLE_SIGNING_IDENTITY="Your Name"
```

3. Notarize:
```bash
xcrun notarytool submit app.dmg \
  --apple-id "your-email@example.com" \
  --team-id "TEAM_ID" \
  --password "app-specific-password"
```

## 🚀 Distribution Strategies

### 1. Direct Download

**Pros**: Simple, full control
**Cons**: Manual updates

1. Build the app
2. Upload to your website/CDN
3. Provide download links

### 2. GitHub Releases

**Pros**: Free hosting, version tracking
**Cons**: Requires GitHub account

```yaml
# .github/workflows/release.yml
name: Release
on:
  push:
    tags:
      - 'v*'
jobs:
  release:
    strategy:
      matrix:
        platform: [macos-latest, ubuntu-latest, windows-latest]
    runs-on: ${{ matrix.platform }}
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - uses: dtolnay/rust-toolchain@stable
      - run: npm install
      - run: npm run tauri build
      - uses: softprops/action-gh-release@v1
        with:
          files: src-tauri/target/release/bundle/**/*
```

### 3. Auto-Updater

Enable in `tauri.conf.json`:

```json
{
  "tauri": {
    "updater": {
      "active": true,
      "endpoints": [
        "https://your-domain.com/updates/{{target}}/{{current_version}}"
      ],
      "dialog": true,
      "pubkey": "YOUR_PUBLIC_KEY"
    }
  }
}
```

Generate update keys:
```bash
cargo tauri signer generate
```

### 4. App Stores

#### Microsoft Store
1. Create a Microsoft Partner Center account
2. Package as MSIX
3. Submit through Partner Center

#### Mac App Store
1. Apple Developer account required
2. Configure entitlements
3. Submit via App Store Connect

#### Snap Store (Linux)
1. Create snapcraft.yaml
2. Build snap package
3. Publish to Snap Store

## 🔄 Update Workflow

### Semantic Versioning

Use semantic versioning (semver):
- **Major**: Breaking changes (1.0.0 → 2.0.0)
- **Minor**: New features (1.0.0 → 1.1.0)
- **Patch**: Bug fixes (1.0.0 → 1.0.1)

### Update `package.json` & `Cargo.toml`

```bash
# Update version in package.json
npm version patch  # or minor, major

# Update version in src-tauri/Cargo.toml
# [package]
# version = "0.1.1"

# Update version in src-tauri/tauri.conf.json
# "package": { "version": "0.1.1" }
```

### Tag and Release

```bash
git add .
git commit -m "Release v0.1.1"
git tag v0.1.1
git push origin main --tags
```

## 📊 Size Optimization

### Frontend Optimization

1. **Tree-shaking**: Automatically handled by Vite
2. **Code splitting**: Use dynamic imports
```typescript
const Component = () => import('$lib/components/Heavy.svelte');
```

3. **Asset optimization**:
```bash
# Install image optimization
bun add -D vite-plugin-imagemin
```

### Backend Optimization

1. **Strip debug symbols**:
```toml
# Cargo.toml
[profile.release]
strip = true
opt-level = "z"
lto = true
codegen-units = 1
```

2. **Reduce binary size**:
```bash
# Install UPX
upx --best --lzma src-tauri/target/release/khaos-tauri-app
```

## 🔍 Pre-Release Checklist

- [ ] Update version numbers
- [ ] Test on all target platforms
- [ ] Run security audit: `cargo audit`
- [ ] Check for linter warnings
- [ ] Test installer/uninstaller
- [ ] Verify auto-update works
- [ ] Update CHANGELOG.md
- [ ] Create release notes
- [ ] Sign binaries (if applicable)
- [ ] Test on clean system
- [ ] Backup database/config migrations

## 📝 Release Notes Template

```markdown
## v0.1.1 (2024-01-15)

### Features
- Added new theme switcher animation
- Implemented user preferences persistence

### Bug Fixes
- Fixed theme not persisting on restart
- Resolved memory leak in data store

### Performance
- Reduced bundle size by 20%
- Improved startup time by 30%

### Breaking Changes
None

### Download
- [Windows (.msi)](link)
- [macOS (.dmg)](link)
- [Linux (.AppImage)](link)
```

## 🛡️ Security Best Practices

1. **Keep dependencies updated**:
```bash
cargo update
bun update
```

2. **Security audit**:
```bash
cargo audit
npm audit
```

3. **Minimize allowlist**:
Only enable needed Tauri APIs in `tauri.conf.json`

4. **CSP (Content Security Policy)**:
```json
{
  "tauri": {
    "security": {
      "csp": "default-src 'self'; script-src 'self'"
    }
  }
}
```

## 📞 Support & Troubleshooting

### Build Errors

**"WebKit2GTK not found"** (Linux):
```bash
sudo apt install libwebkit2gtk-4.0-dev
```

**"WiX not found"** (Windows):
Install WiX Toolset from https://wixtoolset.org/

**"Code signing failed"** (macOS):
Verify certificate with:
```bash
security find-identity -v -p codesigning
```

### Bundle Size Issues

Check what's taking space:
```bash
cd src-tauri/target/release
ls -lh
```

## 🎯 Next Steps

1. Set up CI/CD pipeline
2. Configure auto-updates
3. Plan beta testing
4. Prepare marketing materials
5. Create user documentation

---

Ready to ship! 🚢

