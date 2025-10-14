# Khaos League Profile Tool - Features

This document describes all the features available in the Khaos League Profile Tool.

## Overview

Khaos is a desktop application built with Tauri, Svelte, and Rust that allows you to customize your League of Legends profile in ways the official client doesn't expose directly. It connects to the League Client API (LCU) to make changes to your profile.

## Prerequisites

- **League of Legends client must be running** for the app to connect
- The app reads the LCU credentials from the lockfile at: `C:\Riot Games\League of Legends\lockfile`

## Features

### 1. Custom Status Message
**Path:** `/status`

Set a custom status message that appears in your profile and chat.

**Features:**
- Custom text input (up to 200 characters)
- Emoji support 🎮
- Quick preset messages
- Real-time character counter

**Usage:**
1. Enter your desired status message
2. Click "Set Status"
3. Your status will update immediately

---

### 2. Profile Background
**Path:** `/background`

Change your profile background to any champion skin, even ones you don't own.

**Features:**
- Browse all League of Legends champions
- View all available skins for each champion
- Search functionality to find champions quickly
- High-quality skin preview images
- Set any skin as your background

**Usage:**
1. Select a champion from the grid
2. Browse through available skins
3. Click on any skin to set it as your background
4. Changes appear immediately in your profile

---

### 3. Summoner Icon
**Path:** `/icon`

Set any summoner icon, including unreleased or unavailable ones.

**Features:**
- Browse icon gallery with popular icon ranges
- Set icon by ID directly
- Search functionality
- Preview icons before setting

**Usage:**
- **Method 1:** Enter an icon ID and click "Set Icon"
- **Method 2:** Browse the gallery and click any icon to set it
- Icon IDs typically range from 0 to 5000+

---

### 4. Chat Rank Display
**Path:** `/chatrank`

Display a custom rank in your chat profile.

**Features:**
- Choose from all rank tiers (Iron to Challenger)
- Select division (I-IV) for ranks below Master
- Choose queue type (Ranked Solo/Duo or TFT)
- Live preview of selected rank
- Color-coded rank display

**Available Ranks:**
- Iron, Bronze, Silver, Gold, Platinum, Diamond
- Master, Grandmaster, Challenger (no divisions)

**Usage:**
1. Select queue type
2. Choose your desired rank
3. Select division (if applicable)
4. Click "Apply Chat Rank"

**Note:** This only changes the displayed rank in chat, not your actual MMR or rank.

---

### 5. Chibi Icon (TFT Companion)
**Path:** `/chibi`

Set your TFT companion/chibi icon.

**Features:**
- Set any profile icon as chibi
- Quick preset selections
- Uses same ID system as summoner icons

**Usage:**
1. Enter a profile icon ID
2. Click "Set Chibi"
3. The chibi will appear in your TFT games and profile

---

### 6. Practice Tool Lobby
**Path:** `/practice`

Quickly create a practice tool lobby with one click.

**Features:**
- Instant lobby creation
- Custom lobby names
- Quick preset names
- Automatic configuration for practice mode

**Practice Tool Benefits:**
- ⚡ Instant level up
- 💰 Unlimited gold
- 🔄 Reset cooldowns
- 🎯 Spawn practice dummies
- Perfect for learning combos and mechanics

**Usage:**
1. Optionally enter a custom lobby name
2. Click "Create Practice Lobby"
3. The lobby will be created instantly

---

### 7. Champion Information
**Path:** `/champions`

Comprehensive champion information and management tools.

**Features:**
- Retrieve detailed champion information
- Check champion mastery levels
- View owned skins
- Explore champion roles and availability

**Usage:**
- View your owned champions
- Check mastery levels for specific champions
- Explore detailed champion information
- Manage champion-related data

---

### 8. Queue Management
**Path:** `/queues`

Advanced queue type and availability management.

**Features:**
- Check current game queue type
- Verify queue availability
- Support for all League of Legends queue types
  - Ranked Solo/Duo
  - Flex
  - ARAM
  - TFT Variants
  - Practice Tool
  - And more!

**Usage:**
- Quickly check which queue types are currently available
- Get detailed information about current game mode
- Plan your gaming session with queue insights

---

## Technical Details

### Architecture

**Frontend:**
- Svelte 4 with TypeScript
- Svelte SPA Router for navigation
- DaisyUI for UI components
- Tailwind CSS for styling

**Backend:**
- Rust with Tauri
- Async request handling with tokio and reqwest
- Direct LCU API communication
- Self-signed certificate handling

### API Integration

The app integrates with two main APIs:

1. **League Client API (LCU)**
   - Local API exposed by League of Legends client
   - Requires authentication via lockfile
   - Runs on `https://127.0.0.1:<port>`

2. **Riot Data Dragon API**
   - Public API for game data
   - Used for champion, skin, and icon information
   - No authentication required
   - Base URL: `https://ddragon.leagueoflegends.com`

### Security

- All LCU communication uses HTTPS (with self-signed cert acceptance)
- Authentication via Basic Auth with credentials from lockfile
- No data is sent to external servers
- All operations are local

---

## Troubleshooting

### "Could not connect to League Client"
**Solution:** Make sure the League of Legends client is running before using the app.

### "Failed to read lockfile"
**Solution:** Check if League is installed at:
- `C:\Riot Games\League of Legends\`
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

---

## Limitations

1. **Client must be running**: The app can only work when League of Legends is open
2. **Visual changes only**: Most changes are cosmetic and don't affect gameplay
3. **Temporary changes**: Some settings may reset when you restart the client
4. **Rate limiting**: Making too many requests too quickly might temporarily fail

---

## Disclaimer

**IMPORTANT:** This project isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing League of Legends. League of Legends and Riot Games are trademarks or registered trademarks of Riot Games, Inc.

Use at your own discretion. While these are just cosmetic changes using the official LCU API, Riot's stance on third-party tools can change.

---

## Tips & Best Practices

1. **Always check connection status** on the home page before making changes
2. **Save your favorite settings** - note down icon IDs you like
3. **Experiment safely** - all changes can be reverted
4. **Use practice tool** to test new champions risk-free
5. **Be creative** with status messages and profile customization

---

### 9. Champion Select Automation
**Path:** `/champ-select`

Advanced champion select automation tools inspired by KBot.

**Features:**
- ⚡ Auto-accept matchmaking queue
- 🎯 Instalock champion (with customizable delay)
- 🚫 Auto-ban champion (with customizable delay)
- 💬 Instant message in champ select (configurable times & delays)
- 🔇 Instant mute all players
- 🔍 Multi-search players (OP.GG, U.GG, PORO.GG, Porofessor)
- 📊 Auto-import runes from OP.GG
- 🚪 Quick dodge without restarting client
- 🔄 Backup pick (if main champion is banned/picked)
- 📍 Blue/Red side notification
- 🎮 Role selection (Primary/Secondary)
- ⚠️ Dodge on ban option

**Usage:**
1. Enable desired automation features
2. Select champions for instalock/ban/backup
3. Configure delays and messages
4. Features activate automatically in champion select

**Note:** These are automation features that work during champion select phase.

---

### 10. Loot & Settings Manager
**Path:** `/loot`

Mass disenchant loot and customize in-game settings.

**Features:**
- 🔥 Mass disenchant by loot type:
  - Champion shards → Blue Essence
  - Skin shards → Orange Essence
  - Eternals → Orange Essence
  - Ward skins → Ward Essence
  - Emotes, Icons, Companions
- 🗺️ Minimap scale customization (0-350%)
- ⚡ One-click disenchant all

**Usage:**
1. Select loot type to disenchant
2. Click "Disenchant All" button
3. Confirm action
4. Adjust minimap scale with slider

**Warning:** Disenchanting is permanent and cannot be undone!

---

## Future Features (Potential)

- Save/load profile presets
- History of used icons/skins
- Random icon/background selector
- Export/import settings
- More LCU endpoint integrations
- Auto-connect on League client launch
- Rune page manager
- Champion name to ID lookup
- Riot ID changer integration

---

## Support

If you encounter issues or have suggestions:
1. Check this documentation first
2. Verify League client is running
3. Check the console for error messages
4. Report issues with detailed descriptions

