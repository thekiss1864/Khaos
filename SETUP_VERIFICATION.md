# 🔍 Setup Verification Guide

Use this checklist to verify your Khaos project is correctly set up.

## ✅ File Structure Verification

### Root Directory Files
- [x] `package.json` - Node dependencies
- [x] `vite.config.ts` - Vite configuration
- [x] `svelte.config.js` - Svelte configuration
- [x] `tailwind.config.js` - Tailwind + DaisyUI config
- [x] `postcss.config.js` - PostCSS configuration
- [x] `tsconfig.json` - TypeScript configuration
- [x] `tsconfig.node.json` - Node TypeScript config
- [x] `index.html` - HTML entry point
- [x] `.gitignore` - Git ignore rules
- [x] `.gitattributes` - Git line ending rules

### Documentation Files
- [x] `README.md` - Main documentation
- [x] `QUICKSTART.md` - Quick start guide
- [x] `DEVELOPMENT.md` - Development guide
- [x] `DEPLOYMENT.md` - Deployment guide
- [x] `PROJECT_SUMMARY.md` - Project overview
- [x] `CHANGELOG.md` - Version history
- [x] `CONTRIBUTING.md` - Contribution guidelines
- [x] `LICENSE` - MIT License

### Source Directory (`src/`)
- [x] `main.ts` - TypeScript entry
- [x] `app.css` - Global styles with themes
- [x] `App.svelte` - Main component
- [x] `vite-env.d.ts` - Vite types

### Components (`src/lib/components/`)
- [x] `ThemeSwitcher.svelte` - Theme toggle
- [x] `Card.svelte` - Reusable card

### Stores (`src/lib/stores/`)
- [x] `theme.ts` - Theme management

### Utils (`src/lib/utils/`)
- [x] `tauri.ts` - Tauri command wrappers

### Tauri Backend (`src-tauri/`)
- [x] `Cargo.toml` - Rust dependencies
- [x] `tauri.conf.json` - Tauri config
- [x] `build.rs` - Build script
- [x] `src/main.rs` - Rust entry
- [x] `src/commands.rs` - Tauri commands

### VSCode Configuration (`.vscode/`)
- [x] `settings.json` - Editor settings
- [x] `extensions.json` - Recommended extensions

## 🧪 Dependency Check

### Check Node Version
```bash
node --version
# Should be v18 or higher
```

### Check Bun/npm
```bash
bun --version
# or
npm --version
```

### Check Rust
```bash
rustc --version
cargo --version
# Should have latest stable Rust
```

### Install Node Dependencies
```bash
bun install
# or
npm install
```

Expected output:
```
✓ Dependencies installed
✓ No vulnerabilities found
```

## 🏗️ Build Verification

### 1. TypeScript Check
```bash
bun run check
# or
npm run check
```

Expected: ✅ No TypeScript errors

### 2. Frontend Build
```bash
bun run build
# or
npm run build
```

Expected:
- ✅ Build completes successfully
- ✅ `dist/` directory created
- ✅ No errors or warnings

### 3. Backend Build
```bash
cd src-tauri
cargo build
cd ..
```

Expected:
- ✅ Rust compilation succeeds
- ✅ `src-tauri/target/debug/` created
- ✅ Executable built successfully

### 4. Full App Build (Production)
```bash
bun run tauri:build
# or
npm run tauri:build
```

Expected:
- ✅ Frontend builds
- ✅ Backend builds
- ✅ Installer created in `src-tauri/target/release/bundle/`

## 🚀 Runtime Verification

### 1. Start Development Server
```bash
bun run tauri:dev
# or
npm run tauri:dev
```

### 2. Visual Checks

#### ✅ App Window Opens
- [ ] App window appears
- [ ] Window is 1200x800 pixels
- [ ] Title is "Khaos"

#### ✅ Theme (Dark Mode Default)
- [ ] Dark background color (softextreme theme)
- [ ] Text is readable
- [ ] Colors match theme specification

#### ✅ Header/Navbar
- [ ] "Khaos Tauri App" text visible
- [ ] Theme switcher in top-right
- [ ] Navbar has proper styling

#### ✅ Main Content
- [ ] "Welcome to Khaos" heading
- [ ] Subtitle text visible
- [ ] Demo card with input field
- [ ] "Greet" button works

#### ✅ Theme Switcher
- [ ] Click theme button
- [ ] Theme changes to light mode (lemonade)
- [ ] All colors update correctly
- [ ] Theme persists on reload

#### ✅ Tauri Backend
- [ ] Enter a name in input field
- [ ] Click "Greet" button
- [ ] Success alert appears
- [ ] Message shows "Hello, [name]! Welcome to Khaos."

#### ✅ Feature Grid
- [ ] Three cards visible
- [ ] "Fast", "Beautiful", "Secure" text
- [ ] Icons/emojis display correctly

#### ✅ Footer
- [ ] Footer at bottom
- [ ] "Built with ❤️" text visible

#### ✅ Responsive Design
- [ ] Resize window
- [ ] Layout adjusts appropriately
- [ ] Minimum size respected (800x600)

### 3. Browser DevTools Check
Right-click → Inspect Element

#### Console Tab
- [ ] No errors in console
- [ ] No warnings (or expected warnings only)

#### Network Tab
- [ ] Resources load successfully
- [ ] No 404 errors

#### Elements Tab
- [ ] `data-theme="softextreme"` on `<html>`
- [ ] DaisyUI classes applied
- [ ] Styles render correctly

## 🔧 Configuration Verification

### Tauri Config (`src-tauri/tauri.conf.json`)
```bash
cat src-tauri/tauri.conf.json
```

Check:
- [ ] `productName: "Khaos"`
- [ ] `identifier: "com.khaos.app"`
- [ ] `devPath: "http://localhost:5173"`
- [ ] `beforeDevCommand: "npm run dev"`

### Tailwind Config (`tailwind.config.js`)
```bash
cat tailwind.config.js
```

Check:
- [ ] DaisyUI plugin included
- [ ] Themes: `['softextreme', 'lemonade']`
- [ ] `darkTheme: 'softextreme'`

### Package.json Scripts
```bash
cat package.json | grep scripts -A 10
```

Check:
- [ ] `dev`: "vite"
- [ ] `build`: "vite build"
- [ ] `tauri:dev`: "tauri dev"
- [ ] `tauri:build`: "tauri build"
- [ ] `check`: "svelte-check"

## 🧹 Clean Build Test

### 1. Clean Everything
```bash
# Remove node_modules
rm -rf node_modules
rm -rf dist

# Clean Rust build
cd src-tauri
cargo clean
cd ..
```

### 2. Fresh Install
```bash
bun install
# or
npm install
```

### 3. Fresh Build
```bash
bun run tauri:dev
```

Expected: ✅ App builds and runs without issues

## 🔍 Code Quality Checks

### TypeScript Errors
```bash
bun run check
```
Expected: ✅ 0 errors

### Rust Warnings
```bash
cd src-tauri
cargo clippy
```
Expected: ✅ No warnings or fixable warnings only

### File Permissions
```bash
ls -la src-tauri/src/
```
Expected: ✅ All files readable/writable

## 📦 VSCode Integration

### 1. Open in VSCode
```bash
code .
```

### 2. Install Recommended Extensions
When prompted:
- [ ] Click "Install All"
- [ ] Wait for installation

### 3. Extensions Installed
- [ ] Svelte for VS Code
- [ ] Tauri
- [ ] rust-analyzer
- [ ] Tailwind CSS IntelliSense

### 4. IntelliSense Works
- [ ] Open `src/App.svelte`
- [ ] Type `class="btn ` - Tailwind suggestions appear
- [ ] TypeScript autocomplete works
- [ ] Rust analyzer works in `.rs` files

## 🎯 Final Verification

### Checklist
- [ ] All files created
- [ ] All dependencies installed
- [ ] TypeScript compiles without errors
- [ ] Rust compiles without errors
- [ ] App runs in development mode
- [ ] Theme switcher works
- [ ] Tauri backend responds
- [ ] UI looks correct in both themes
- [ ] No console errors
- [ ] Production build succeeds
- [ ] Documentation is readable

## ✅ Success Criteria

If you can answer YES to all:
- ✅ `bun run tauri:dev` starts the app
- ✅ App window opens with correct UI
- ✅ Theme switcher changes themes
- ✅ "Greet" button shows success message
- ✅ No errors in console
- ✅ Production build completes

**Your setup is VERIFIED! 🎉**

## 🐛 Common Issues & Fixes

### Issue: "Cannot find module '@tauri-apps/api'"
```bash
bun install
```

### Issue: "Rust compiler not found"
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### Issue: "Port 5173 already in use"
```bash
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5173 | xargs kill
```

### Issue: "WebKit2GTK not found" (Linux)
```bash
sudo apt install libwebkit2gtk-4.0-dev
```

### Issue: Theme not persisting
- Clear browser storage
- Check browser console for errors
- Verify localStorage permissions

### Issue: TypeScript errors in Svelte files
```bash
bun run check
```
Then fix reported issues

## 📞 Still Having Issues?

1. Check `QUICKSTART.md` → Troubleshooting
2. Check `DEVELOPMENT.md` → Debugging
3. Open a GitHub Issue
4. Review Tauri prerequisites: https://tauri.app/v1/guides/getting-started/prerequisites

---

**Verification Complete!** 🚀

You're ready to start building amazing features!

