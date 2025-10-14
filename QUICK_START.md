# Quick Start Guide - Khaos League Profile Tool

## 🎮 For Users

### Prerequisites
1. **League of Legends** must be installed and running
2. Download the latest release from the releases page

### First Time Setup
1. Extract the downloaded files to a folder
2. Run `Khaos.exe` (Windows) or the appropriate executable for your OS
3. **Launch League of Legends client** if not already running
4. The app will automatically detect and connect to your client

### Using the Features

#### 1️⃣ Check Connection
- Open the app while League is running
- The home page shows connection status
- If disconnected, click "Refresh Connection"

#### 2️⃣ Set Custom Status
1. Click "Set Status Message" on home or navigate to Status
2. Type your custom message (up to 200 characters)
3. Click "Set Status"
4. Your status appears immediately in chat and profile

#### 3️⃣ Change Profile Background
1. Navigate to Background
2. Browse or search for a champion
3. Click a champion to see their skins
4. Click any skin to set it as your background

#### 4️⃣ Change Summoner Icon
1. Navigate to Custom Icon
2. Enter an icon ID directly, or
3. Browse the gallery and click any icon

#### 5️⃣ Set Chat Rank
1. Navigate to Chat Rank
2. Select queue type (Solo/Duo or TFT)
3. Choose your desired rank and division
4. Click "Apply Chat Rank"

#### 6️⃣ Quick Practice Tool
1. Navigate to Practice Tool
2. Optionally enter a lobby name
3. Click "Create Practice Lobby"
4. Lobby is created instantly!

### Troubleshooting

**"Could not connect to League Client"**
- ✅ Make sure League of Legends is running
- ✅ Check if League is installed in the default location
- ✅ Try restarting both the app and League client

**Changes not showing**
- ✅ Wait a few seconds for the API to process
- ✅ Close and reopen your profile
- ✅ Some changes may require a client restart

**Icons/Skins not loading**
- ✅ Check your internet connection
- ✅ Try refreshing the page
- ✅ Some IDs might not exist

---

## 💻 For Developers

### Prerequisites
- **Node.js** v18+ or **Bun**
- **Rust** (latest stable)
- **Tauri Prerequisites**: [Installation Guide](https://tauri.app/v1/guides/getting-started/prerequisites)
- **League of Legends** (for testing)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd Khaos
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Run in development mode**
   ```bash
   bun run tauri:dev
   ```
   
   This will:
   - Start Vite dev server
   - Compile Rust backend
   - Launch the app with hot-reload

### Project Commands

```bash
# Development
bun run dev              # Frontend only (Vite)
bun run tauri:dev        # Full app with Tauri

# Building
bun run build            # Build frontend
bun run tauri:build      # Build complete app

# Type checking
bun run check            # Svelte type checking
```

### Making Changes

#### Adding a New Feature Page
1. Create `src/lib/pages/YourFeature.svelte`
2. Add route in `src/App.svelte`:
   ```typescript
   const routes = {
     // ... existing routes
     "/your-feature": YourFeature,
   };
   ```
3. Add navigation link in Home page

#### Adding a New Tauri Command
1. Define in `src-tauri/src/commands.rs`:
   ```rust
   #[tauri::command]
   pub async fn your_command(param: String) -> Result<LcuResponse, String> {
       // Your logic here
   }
   ```

2. Register in `src-tauri/src/main.rs`:
   ```rust
   .invoke_handler(tauri::generate_handler![
       // ... existing commands
       your_command,
   ])
   ```

3. Call from frontend in `src/lib/services/lcuService.ts`:
   ```typescript
   async yourCommand(param: string): Promise<LcuResponse> {
     return await invoke<LcuResponse>("your_command", { param });
   }
   ```

#### Adding LCU Endpoints
Edit `src-tauri/src/lcu_connection.rs`:
```rust
pub fn get_endpoint(name: &str) -> Result<String, String> {
    match name {
        // ... existing endpoints
        "your_endpoint" => Ok("/your/lcu/endpoint".to_string()),
        _ => Err(format!("Unknown endpoint: {}", name)),
    }
}
```

### Testing

1. **Start League Client** in the background
2. **Run the app** with `bun run tauri:dev`
3. **Test each feature** manually:
   - Check connection status
   - Try setting status message
   - Browse champions and skins
   - Test icon selection
   - Verify notifications appear
   - Check error handling

### Project Structure Highlights

```
src/
├── lib/
│   ├── components/       # Reusable UI components
│   ├── pages/           # Feature pages (one per route)
│   ├── services/        # API communication
│   └── stores/          # Svelte stores for state
└── App.svelte           # Main app with router

src-tauri/src/
├── main.rs              # Tauri app entry
├── commands.rs          # Command handlers
└── lcu_connection.rs    # LCU API client
```

### Debugging Tips

**Rust Backend:**
```bash
# Check for errors
cargo check --manifest-path=src-tauri/Cargo.toml

# View logs
# In dev mode, console shows Rust println! and errors
```

**Frontend:**
```bash
# Open browser console in the app (DevTools)
# Check for TypeScript errors
bun run check
```

**LCU Connection:**
- Check lockfile exists: `C:\Riot Games\League of Legends\lockfile`
- Verify port and token in console output
- Test endpoint with curl or Postman

### Building for Release

```bash
bun run tauri:build
```

Output location:
- Windows: `src-tauri/target/release/bundle/msi/`
- Executable: `src-tauri/target/release/Khaos.exe`

### Common Issues

**Build fails on Windows:**
- Install Visual Studio Build Tools
- Install WebView2 Runtime

**Rust compilation errors:**
```bash
cd src-tauri
cargo clean
cargo build
```

**Frontend not updating:**
```bash
# Clear cache
rm -rf node_modules
bun install
```

---

## 📚 Additional Resources

- [Tauri Docs](https://tauri.app/)
- [Svelte Tutorial](https://svelte.dev/tutorial)
- [LCU API Documentation](https://riot-api-libraries.readthedocs.io/en/latest/lcu.html)
- [Riot Data Dragon](https://developer.riotgames.com/docs/lol#data-dragon)

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Test thoroughly with League client
4. Submit a pull request

