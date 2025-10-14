# Quick Start Guide

Get your Khaos Tauri app up and running in minutes!

## 🚀 Quick Setup (3 Steps)

### Step 1: Install Dependencies

Using **Bun** (recommended):
```bash
bun install
```

Or using **npm**:
```bash
npm install
```

### Step 2: Run the App

```bash
bun run tauri:dev
# or
npm run tauri:dev
```

That's it! The app will open automatically.

## 📦 What You Get

- ✅ Hot-reload development environment
- ✅ Dark/Light theme switcher
- ✅ Example Tauri command (greet function)
- ✅ TypeScript + Svelte configured
- ✅ DaisyUI + Tailwind CSS ready
- ✅ Rust backend with Tauri

## 🎯 Next Steps

### 1. Add a New Tauri Command

**Backend** (`src-tauri/src/commands.rs`):
```rust
#[tauri::command]
pub fn add_numbers(a: i32, b: i32) -> i32 {
    a + b
}
```

**Register** (`src-tauri/src/main.rs`):
```rust
.invoke_handler(tauri::generate_handler![
    greet,
    add_numbers,  // Add this line
])
```

**Frontend** (`src/lib/utils/tauri.ts`):
```typescript
export async function addNumbers(a: number, b: number): Promise<number> {
  return await invoke('add_numbers', { a, b });
}
```

### 2. Create a New Svelte Component

`src/lib/components/Counter.svelte`:
```svelte
<script lang="ts">
  let count = 0;
</script>

<div class="card bg-base-200">
  <div class="card-body">
    <h2 class="card-title">Counter: {count}</h2>
    <button class="btn btn-primary" on:click={() => count++}>
      Increment
    </button>
  </div>
</div>
```

### 3. Add a New Store

`src/lib/stores/counter.ts`:
```typescript
import { writable } from 'svelte/store';

export const count = writable(0);
```

## 🎨 Using DaisyUI Components

DaisyUI provides pre-styled components. Example:

```svelte
<!-- Button -->
<button class="btn btn-primary">Click me</button>

<!-- Card -->
<div class="card bg-base-200">
  <div class="card-body">
    <h2 class="card-title">Card Title</h2>
    <p>Card content</p>
  </div>
</div>

<!-- Alert -->
<div class="alert alert-success">
  <span>Success message!</span>
</div>

<!-- Input -->
<input type="text" class="input input-bordered" />
```

See all components: https://daisyui.com/components/

## 🐛 Troubleshooting

### Port 5173 Already in Use
```bash
# Kill the process using port 5173
# Windows:
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Linux/Mac:
lsof -ti:5173 | xargs kill
```

### Rust Compilation Errors
```bash
# Update Rust
rustup update

# Clean and rebuild
cd src-tauri
cargo clean
cargo build
```

### Node Modules Issues
```bash
# Remove and reinstall
rm -rf node_modules
bun install  # or npm install
```

## 📚 Learn More

- **Tauri**: https://tauri.app/v1/guides/
- **Svelte**: https://svelte.dev/tutorial
- **DaisyUI**: https://daisyui.com/
- **Tailwind**: https://tailwindcss.com/docs

## 💡 Pro Tips

1. **Use the theme store**: Import `theme` from `$lib/stores/theme` to access/modify theme
2. **Type safety**: Always add TypeScript types for Tauri commands
3. **Component organization**: Keep components small and focused
4. **Use DaisyUI classes**: Don't write custom CSS unless necessary
5. **Hot reload**: Save files to see changes instantly (no manual refresh needed)

Happy coding! 🎉

