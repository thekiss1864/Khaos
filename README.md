# 🎮 Khaos - League of Legends Profile Tool

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://github.com/yourusername/khaos/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/github/actions/workflow/status/yourusername/khaos/ci.yml)](https://github.com/yourusername/khaos/actions)
[![Rust](https://img.shields.io/badge/rust-%23000000.svg?style=flat&logo=rust&logoColor=white)](https://www.rust-lang.org/)
[![Svelte](https://img.shields.io/badge/svelte-%23f1413d.svg?style=flat&logo=svelte&logoColor=white)](https://svelte.dev/)
[![Tauri](https://img.shields.io/badge/tauri-%2324C8DB.svg?style=flat&logo=tauri&logoColor=%23FFFFFF)](https://tauri.app/)

A modern desktop application built with **Tauri**, **Svelte**, **TypeScript**, and **Rust** that allows you to customize your League of Legends profile in ways the official client doesn't expose. Connect directly to the League Client API (LCU) to unlock powerful profile customization features.

## 🚀 Tech Stack

- **Backend**: Rust + Tauri
- **Frontend**: Svelte + TypeScript
- **UI Framework**: DaisyUI + Tailwind CSS
- **Build Tool**: Vite
- **Package Manager**: Bun
- **APIs**: League Client API (LCU) + Riot Data Dragon

## 📸 Screenshots

<!-- Add screenshots here when available -->
<!-- ![Khaos Main Interface](screenshots/main-interface.png) -->
<!-- ![Profile Customization](screenshots/profile-customization.png) -->
<!-- ![Champion Select Automation](screenshots/champion-select.png) -->

*Screenshots will be added soon after the first stable release.*

## ✨ Features

### 🎨 League Profile Customization

#### 💬 Custom Status Messages
Set personalized status messages that appear in your profile and chat.
- **Custom text input** (up to 200 characters)
- **Emoji support** 🎮
- **Quick preset messages**
- **Real-time character counter**

#### 🎨 Profile Backgrounds
Transform your profile with any champion skin, even those you don't own.
- **Browse all champions** with high-quality previews
- **Search functionality** to find champions quickly
- **All skins available** - no restrictions
- **Instant application** to your profile

#### 🖼️ Summoner Icons
Access every summoner icon in the game, including unreleased ones.
- **Icon gallery** with popular ranges
- **Direct ID input** for precise selection
- **Search functionality**
- **Preview before setting**

#### 🏆 Chat Rank Display
Show off any rank tier in your chat profile.
- **All rank tiers** (Iron to Challenger)
- **Division selection** (I-IV for applicable ranks)
- **Queue type support** (Ranked Solo/Duo, TFT)
- **Live preview** with color coding
- **Note**: Visual only - doesn't affect actual MMR

#### 🐾 Chibi Icons (TFT Companion)
Customize your Teamfight Tactics companion icon.
- **Any profile icon** as chibi
- **Quick presets** available
- **Same ID system** as summoner icons

#### 🎯 Practice Tool Lobby
Create practice lobbies instantly for training and testing.
- **One-click creation**
- **Custom lobby names**
- **Practice benefits**: Instant level up, unlimited gold, reset cooldowns
- **Perfect for learning** combos and mechanics

### ⚙️ Advanced Tools

#### 🤖 Champion Select Automation
Powerful automation features for champion select phase.
- **⚡ Auto-accept** matchmaking queue
- **🎯 Instalock** champion with customizable delay
- **🚫 Auto-ban** with timing control
- **💬 Auto-messaging** in champ select
- **🔇 Instant mute** all players
- **🔍 Multi-search** players (OP.GG, U.GG, etc.)
- **📊 Auto-import runes** from OP.GG
- **🚪 Quick dodge** without client restart
- **🔄 Backup picks** if main champion unavailable
- **📍 Side notifications** (Blue/Red)
- **🎮 Role selection**
- **⚠️ Dodge on ban** protection

#### 🏗️ Loot & Settings Manager
Mass disenchant loot and customize game settings.
- **🔥 Mass disenchant** by type:
  - Champion shards → Blue Essence
  - Skin shards → Orange Essence
  - Eternals → Orange Essence
  - Ward skins → Ward Essence
  - Emotes, Icons, Companions
- **🗺️ Minimap scale** customization (0-350%)
- **⚡ One-click disenchant all**
- **⚠️ Permanent action** - cannot be undone

#### 📊 Champion Information
Comprehensive champion data and mastery tools.
- **Detailed champion information**
- **Mastery level checking**
- **Owned skins viewer**
- **Role and availability data**

#### 🎮 Queue Management
Advanced queue type monitoring and management.
- **Current queue status**
- **Available queue types**
- **Support for all modes**: Ranked Solo/Duo, Flex, ARAM, TFT, Practice Tool

### 🎯 Key Benefits

- **🎨 Unlimited Customization**: Break free from official client limitations
- **⚡ Instant Results**: Changes apply immediately
- **🔒 Secure & Local**: No data sent to external servers
- **🆓 Completely Free**: No purchases required
- **🚀 Performance Optimized**: Built with Rust for maximum speed

- 🎨 **Beautiful**: Modern UI with DaisyUI and Tailwind CSS
- 🌓 **Theme Support**: Dark mode (softextreme) and Light mode (lemonade)

## 📖 Documentation

- **[FEATURES.md](FEATURES.md)** - Detailed feature documentation and usage guide
- **[START_HERE.md](START_HERE.md)** - Quick start guide for development

## 🔧 How It Works

Khaos leverages the **League Client Update (LCU) API** - Riot Games' official local REST API that powers their client applications. This API is exposed on your local machine when the League of Legends client is running, allowing direct communication for profile customization and game management.

### 🏗️ Technical Architecture

#### Frontend Layer
- **Svelte 4** with TypeScript for reactive, component-based UI
- **Svelte SPA Router** for seamless navigation between features
- **DaisyUI + Tailwind CSS** for modern, responsive design
- **Theme system** with automatic localStorage persistence

#### Backend Layer
- **Rust with Tauri** for high-performance desktop application
- **Async request handling** using tokio and reqwest
- **Direct LCU API communication** with secure authentication
- **Self-signed certificate handling** for HTTPS connections

### 🔌 API Integration

#### League Client API (LCU)
- **Local REST API** exposed by the League client at `https://127.0.0.1:<port>`
- **Authentication** via Basic Auth using credentials from lockfile
- **Real-time communication** for instant profile updates
- **Secure HTTPS** with certificate validation

#### Riot Data Dragon API
- **Public game data API** at `https://ddragon.leagueoflegends.com`
- **Champion, skin, and icon information** without authentication
- **High-quality images** and metadata for UI previews
- **Version management** for accurate data retrieval

### 🔐 Security & Authentication

#### Lockfile Authentication
Khaos reads the League client's lockfile (typically at `C:\Riot Games\League of Legends\lockfile`) to obtain:
- **Port number** for API connection
- **Authentication token** for API access
- **No credential storage** - tokens are used immediately and discarded

#### Connection Security
- **HTTPS-only communication** with proper certificate handling
- **Local-only operation** - all data stays on your machine
- **No external data transmission** - your profile information never leaves your computer
- **Open source transparency** - all code is auditable

### ⚙️ Requirements & Setup

#### System Requirements
- **League of Legends client must be running** for API access
- **Node.js v18+** or **Bun** for development
- **Rust toolchain** for building
- **Windows/macOS/Linux** support via Tauri

#### Connection Process
1. **Client Detection**: App scans for running League client
2. **Lockfile Parsing**: Securely reads authentication credentials
3. **API Connection**: Establishes HTTPS connection to local LCU API
4. **Feature Access**: Enables all customization and automation features

### 🎯 Feature Implementation

#### Profile Customization
- **Direct API calls** to LCU endpoints for instant changes
- **Data validation** and error handling for reliability
- **Preview systems** for user feedback before applying changes

#### Automation Features
- **Event monitoring** for champion select phase detection
- **Timing controls** for delayed actions and spam prevention
- **State management** for complex automation sequences

#### Data Management
- **Local storage** for user preferences and settings
- **Cache management** for Data Dragon API responses
- **Error recovery** for network and API failures

### ⚠️ Important Disclaimer

**This project is not endorsed by Riot Games and does not reflect the views or opinions of Riot Games or anyone officially involved in producing or managing League of Legends. League of Legends and Riot Games are trademarks or registered trademarks of Riot Games, Inc.**

Use at your own discretion. While these features use the official LCU API for cosmetic changes, Riot's policies regarding third-party tools can change. This tool is provided as-is for educational and personal use.

## 🔧 Troubleshooting

### "Could not connect to League Client"
**Solution:** Make sure the League of Legends client is running before using the app.

### "Failed to read lockfile"
**Solution:** Check if League is installed at:
- `C:\Riot Games\League of Legends\` (default)
- `C:\Program Files\Riot Games\League of Legends\`
- `C:\Program Files (x86)\Riot Games\League of Legends\`

### Changes not appearing
**Solution:** Some changes may require:
- Closing and reopening your profile
- Restarting the League client
- Waiting a few seconds for the API to process

### Icons/Skins not loading
**Solution:**
- Check your internet connection (needed for Data Dragon API)
- Some icon IDs may not exist
- Try a different ID or refresh the page

### Automation features not working
**Solution:**
- Ensure you're in champion select when using these features
- Check that the League client window is active
- Verify automation settings are enabled

### Rate limiting errors
**Solution:**
- Wait a few seconds between requests
- The LCU API has rate limits to prevent spam
- Reduce automation frequency if needed

## 📁 Project Structure

```
Khaos/
├── src-tauri/
│   ├── src/
│   │   ├── main.rs              # Rust backend entry
│   │   ├── commands.rs          # Tauri command handlers (LCU features)
│   │   └── lcu_connection.rs   # LCU connection & authentication
│   ├── Cargo.toml               # Rust dependencies
│   ├── tauri.conf.json          # Tauri configuration
│   └── build.rs                 # Build script
├── src/
│   ├── lib/
│   │   ├── components/          # Svelte components
│   │   │   ├── ThemeSwitcher.svelte
│   │   │   ├── Card.svelte
│   │   │   └── Notification.svelte
│   │   ├── pages/               # Feature pages
│   │   │   ├── Home.svelte
│   │   │   ├── Status.svelte
│   │   │   ├── Background.svelte
│   │   │   ├── CustomIcon.svelte
│   │   │   ├── ChatRank.svelte
│   │   │   ├── Chibi.svelte
│   │   │   └── PracticeTool.svelte
│   │   ├── services/            # API services
│   │   │   ├── lcuService.ts    # LCU API wrapper
│   │   │   └── riotApi.ts       # Riot Data Dragon API
│   │   └── stores/              # Svelte stores
│   │       ├── theme.ts
│   │       └── notification.ts
│   ├── App.svelte               # Main app with routing
│   ├── main.ts                  # TypeScript entry point
│   ├── app.css                  # Global styles (Tailwind)
│   └── vite-env.d.ts            # Vite type definitions
├── source-codes/                # Reference implementations
│   └── league-profile-tool-master/  # Original Angular app
├── FEATURES.md                  # Detailed feature documentation
├── index.html                   # HTML entry
├── package.json                 # Node dependencies
└── ...config files
```

## 📥 Installation

### Prerequisites

- **Node.js** (v18 or higher) or **Bun**
- **Rust** (latest stable version)
- **League of Legends** client installed and running
- **Tauri Prerequisites**: Follow the [Tauri prerequisites guide](https://tauri.app/v1/guides/getting-started/prerequisites)

### Quick Install

1. **Clone and install dependencies**
   ```bash
   git clone <your-repo-url>
   cd khaos
   bun install  # or npm install
   ```

2. **Run the application**
   ```bash
   bun run tauri:dev  # or npm run tauri:dev
   ```

> **Note**: First run may take longer as Rust dependencies are compiled.

## 🚀 Development

### Run Development Server

Using Bun:
```bash
bun run tauri:dev
```

Or using npm:
```bash
npm run tauri:dev
```

This will:
- Start the Vite dev server on `http://localhost:5173`
- Launch the Tauri app with hot-reload enabled
- Watch for changes in both frontend and backend

### Frontend Only Development

To run just the frontend (without Tauri):

```bash
bun run dev
# or
npm run dev
```

## 🏗️ Building for Production

### Build the app

Using Bun:
```bash
bun run tauri:build
```

Or using npm:
```bash
npm run tauri:build
```

The built application will be available in `src-tauri/target/release/bundle/`

### Build Output

- **Windows**: `.msi` and `.exe` installers
- **macOS**: `.dmg` and `.app` bundle
- **Linux**: `.deb`, `.AppImage`, and other formats

## 🎨 Themes

### Default Theme (Dark Mode): softextreme
- Base colors optimized for dark environments
- High contrast for readability
- Modern, sleek appearance

### Light Theme: lemonade
- Bright, fresh color palette
- Easy on the eyes in well-lit environments
- Professional look

### Switching Themes

Click the theme switcher button in the top-right corner of the app to toggle between themes. The theme preference is automatically saved to localStorage.

## 🔧 Customization

### Adding Tauri Commands

1. **Define the command in Rust** (`src-tauri/src/commands.rs`):
   ```rust
   #[tauri::command]
   pub fn my_command(input: String) -> Result<String, String> {
       Ok(format!("Processed: {}", input))
   }
   ```

2. **Register the command** in `src-tauri/src/main.rs`:
   ```rust
   .invoke_handler(tauri::generate_handler![
       greet,
       my_command,  // Add here
   ])
   ```

3. **Call from frontend** (`src/lib/utils/tauri.ts`):
   ```typescript
   import { invoke } from '@tauri-apps/api/tauri';
   
   export async function myCommand(input: string): Promise<string> {
     return await invoke('my_command', { input });
   }
   ```

### Adding Svelte Components

1. Create a new component in `src/lib/components/YourComponent.svelte`
2. Import and use it in your pages or other components
3. Use DaisyUI classes for consistent styling

### Adding Stores

1. Create a new store in `src/lib/stores/yourStore.ts`
2. Use Svelte's `writable`, `readable`, or `derived` stores
3. Import and subscribe to it in your components

## 📚 Resources

- [Tauri Documentation](https://tauri.app/)
- [Svelte Documentation](https://svelte.dev/)
- [DaisyUI Components](https://daisyui.com/components/)
- [Tailwind CSS](https://tailwindcss.com/)
- [TypeScript](https://www.typescriptlang.org/)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for detailed information.

### Quick Start for Contributors

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/yourusername/khaos.git
   cd khaos
   ```

2. **Set up development environment**
   ```bash
   bun install
   bun run tauri:dev
   ```

3. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **Make your changes and test thoroughly**

5. **Submit a pull request** with a clear description of your changes

### Development Guidelines

- **Code Style**: Follow the existing TypeScript/Rust code style
- **Testing**: Test your changes with League client running
- **Documentation**: Update documentation for new features
- **Commits**: Use descriptive commit messages
- **Issues**: Check for existing issues before creating new ones

### Areas for Contribution

- 🐛 **Bug fixes** - Help improve stability
- ✨ **New features** - Add more LCU API integrations
- 🎨 **UI/UX improvements** - Enhance the user interface
- 📚 **Documentation** - Improve guides and examples
- 🧪 **Testing** - Add automated tests
- 🌐 **Localization** - Add support for multiple languages

### Reporting Issues

When reporting bugs, please include:
- Your operating system and version
- League of Legends client version
- Steps to reproduce the issue
- Expected vs actual behavior
- Any error messages or logs

## 🙏 Acknowledgments

- **Riot Games** for the League Client API that makes this project possible
- **Tauri Team** for the amazing desktop app framework
- **Svelte Team** for the reactive UI framework
- **DaisyUI & Tailwind CSS** for the beautiful component system
- **Open source community** for the tools and libraries used

## 📊 Project Status

- **Current Version**: 0.1.0 (Pre-release)
- **Development Status**: Active development
- **License**: MIT
- **Platform Support**: Windows, macOS, Linux

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

---

## 📞 Support & Community

- **Issues**: [GitHub Issues](https://github.com/yourusername/khaos/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/khaos/discussions)
- **Discord**: *Coming soon*

## 🔗 Links

- **Repository**: [GitHub](https://github.com/yourusername/khaos)
- **Releases**: [GitHub Releases](https://github.com/yourusername/khaos/releases)
- **Documentation**: [Wiki](https://github.com/yourusername/khaos/wiki)

---

<div align="center">

**Built with ❤️ using Tauri + Svelte + TypeScript**

*Show your support by starring ⭐ the repository!*

</div>

