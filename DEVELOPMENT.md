# Development Guide

Comprehensive guide for developing the Khaos Tauri application.

## 🏗️ Architecture Overview

### Frontend (Svelte + TypeScript)
- **Component-based**: Modular Svelte components
- **Reactive Stores**: Svelte stores for state management
- **Type-safe**: Full TypeScript support
- **Styled**: DaisyUI + Tailwind CSS

### Backend (Rust + Tauri)
- **Commands**: Rust functions exposed to frontend
- **Security**: Tauri's allowlist security model
- **Performance**: Native Rust performance
- **Cross-platform**: Single codebase for all platforms

## 📋 Development Workflow

### 1. Planning a Feature

Before coding:
1. Define the feature requirements
2. Decide if it needs backend (Rust) or frontend only
3. Plan the data flow
4. Design the UI components

### 2. Creating Backend Commands

**Location**: `src-tauri/src/commands.rs`

#### Simple Command
```rust
#[tauri::command]
pub fn calculate_sum(numbers: Vec<i32>) -> i32 {
    numbers.iter().sum()
}
```

#### Command with Error Handling
```rust
#[tauri::command]
pub fn divide(a: f64, b: f64) -> Result<f64, String> {
    if b == 0.0 {
        return Err("Division by zero".to_string());
    }
    Ok(a / b)
}
```

#### Async Command
```rust
#[tauri::command]
pub async fn fetch_data(url: String) -> Result<String, String> {
    // Async operations
    tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;
    Ok("Data fetched".to_string())
}
```

#### Command with Complex Types
```rust
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct User {
    pub name: String,
    pub age: u32,
}

#[tauri::command]
pub fn create_user(name: String, age: u32) -> User {
    User { name, age }
}
```

**Don't forget to register in `main.rs`:**
```rust
.invoke_handler(tauri::generate_handler![
    calculate_sum,
    divide,
    fetch_data,
    create_user,
])
```

### 3. Creating Frontend Utilities

**Location**: `src/lib/utils/tauri.ts`

```typescript
import { invoke } from '@tauri-apps/api/tauri';

export async function calculateSum(numbers: number[]): Promise<number> {
  return await invoke('calculate_sum', { numbers });
}

export async function divide(a: number, b: number): Promise<number> {
  try {
    return await invoke('divide', { a, b });
  } catch (error) {
    console.error('Division error:', error);
    throw error;
  }
}

// With type safety
interface User {
  name: string;
  age: number;
}

export async function createUser(name: string, age: number): Promise<User> {
  return await invoke<User>('create_user', { name, age });
}
```

### 4. Creating Svelte Components

**Location**: `src/lib/components/YourComponent.svelte`

#### Basic Component
```svelte
<script lang="ts">
  export let title: string;
  export let description: string = '';
</script>

<div class="card bg-base-200">
  <div class="card-body">
    <h2 class="card-title">{title}</h2>
    {#if description}
      <p>{description}</p>
    {/if}
  </div>
</div>
```

#### Component with Tauri Integration
```svelte
<script lang="ts">
  import { calculateSum } from '$lib/utils/tauri';
  
  let numbers = [1, 2, 3, 4, 5];
  let result = 0;
  
  async function calculate() {
    result = await calculateSum(numbers);
  }
</script>

<div class="card bg-base-200">
  <div class="card-body">
    <button class="btn btn-primary" on:click={calculate}>
      Calculate Sum
    </button>
    <p>Result: {result}</p>
  </div>
</div>
```

#### Component with Store
```svelte
<script lang="ts">
  import { theme } from '$lib/stores/theme';
  
  $: currentTheme = $theme;
</script>

<div>
  Current theme: {currentTheme}
</div>
```

### 5. Creating Stores

**Location**: `src/lib/stores/yourStore.ts`

#### Writable Store
```typescript
import { writable } from 'svelte/store';

export const count = writable(0);

// With methods
function createCounter() {
  const { subscribe, set, update } = writable(0);
  
  return {
    subscribe,
    increment: () => update(n => n + 1),
    decrement: () => update(n => n - 1),
    reset: () => set(0)
  };
}

export const counter = createCounter();
```

#### Derived Store
```typescript
import { writable, derived } from 'svelte/store';

export const count = writable(0);
export const doubled = derived(count, $count => $count * 2);
```

#### Async Store
```typescript
import { writable } from 'svelte/store';
import { invoke } from '@tauri-apps/api/tauri';

function createDataStore() {
  const { subscribe, set } = writable<string[]>([]);
  
  return {
    subscribe,
    load: async () => {
      const data = await invoke<string[]>('get_data');
      set(data);
    }
  };
}

export const dataStore = createDataStore();
```

## 🎨 Styling Guidelines

### Using DaisyUI Classes

```svelte
<!-- Buttons -->
<button class="btn">Default</button>
<button class="btn btn-primary">Primary</button>
<button class="btn btn-secondary">Secondary</button>
<button class="btn btn-accent">Accent</button>
<button class="btn btn-ghost">Ghost</button>

<!-- Cards -->
<div class="card bg-base-200 shadow-xl">
  <div class="card-body">
    <h2 class="card-title">Card Title</h2>
    <p>Card content</p>
    <div class="card-actions justify-end">
      <button class="btn btn-primary">Action</button>
    </div>
  </div>
</div>

<!-- Alerts -->
<div class="alert alert-info">Info message</div>
<div class="alert alert-success">Success message</div>
<div class="alert alert-warning">Warning message</div>
<div class="alert alert-error">Error message</div>

<!-- Forms -->
<div class="form-control">
  <label class="label">
    <span class="label-text">Email</span>
  </label>
  <input type="email" class="input input-bordered" />
</div>

<!-- Loading -->
<span class="loading loading-spinner loading-lg"></span>
```

### Custom Tailwind Classes

```svelte
<div class="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-primary to-secondary">
  <!-- Content -->
</div>
```

### Responsive Design

```svelte
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <!-- Grid items -->
</div>
```

## 🔧 Best Practices

### 1. Error Handling

Always handle errors from Tauri commands:

```typescript
try {
  const result = await invoke('risky_operation');
  // Handle success
} catch (error) {
  console.error('Operation failed:', error);
  // Show user-friendly error message
}
```

### 2. Type Safety

Use TypeScript interfaces for complex data:

```typescript
interface TodoItem {
  id: number;
  title: string;
  completed: boolean;
}

export async function getTodos(): Promise<TodoItem[]> {
  return await invoke<TodoItem[]>('get_todos');
}
```

### 3. Component Props

Always type component props:

```svelte
<script lang="ts">
  export let title: string;
  export let items: string[] = [];
  export let onSelect: (item: string) => void;
</script>
```

### 4. Store Subscriptions

Use reactive declarations for store subscriptions:

```svelte
<script lang="ts">
  import { count } from '$lib/stores/counter';
  
  // Good: Reactive declaration
  $: currentCount = $count;
  
  // Or: Use $ directly in template
</script>

<p>Count: {$count}</p>
```

### 5. File Organization

```
src/lib/
├── components/
│   ├── common/          # Reusable components
│   ├── features/        # Feature-specific components
│   └── layout/          # Layout components
├── stores/
│   ├── theme.ts
│   ├── user.ts
│   └── app.ts
├── utils/
│   ├── tauri.ts         # Tauri command wrappers
│   ├── formatting.ts    # Formatting utilities
│   └── validation.ts    # Validation utilities
└── types/
    └── index.ts         # Shared TypeScript types
```

## 🧪 Testing

### Frontend Tests (Future)
```bash
bun test
# or
npm test
```

### Backend Tests
```bash
cd src-tauri
cargo test
```

## 🐛 Debugging

### Frontend Debugging
1. Open DevTools in the Tauri app: Right-click → Inspect Element
2. Use `console.log()` for debugging
3. Check the Network tab for API calls

### Backend Debugging
1. Add print statements:
   ```rust
   println!("Debug: {:?}", variable);
   ```
2. Run with debug output:
   ```bash
   RUST_LOG=debug bun run tauri:dev
   ```

### Rust Debugging in VSCode
Add to `.vscode/launch.json`:
```json
{
  "type": "lldb",
  "request": "launch",
  "name": "Tauri Development Debug",
  "cargo": {
    "args": [
      "build",
      "--manifest-path=./src-tauri/Cargo.toml",
      "--no-default-features"
    ]
  }
}
```

## 📦 Adding Dependencies

### Frontend Dependencies
```bash
bun add package-name
# or
npm install package-name
```

### Backend Dependencies
Edit `src-tauri/Cargo.toml`:
```toml
[dependencies]
serde = { version = "1.0", features = ["derive"] }
tokio = { version = "1", features = ["full"] }
```

Then:
```bash
cd src-tauri
cargo build
```

## 🚀 Performance Optimization

### Frontend
1. Use `{#key}` blocks for efficient re-rendering
2. Lazy load components with dynamic imports
3. Minimize store subscriptions

### Backend
1. Use async for I/O operations
2. Cache frequently accessed data
3. Profile with `cargo flamegraph`

## 📖 Additional Resources

- [Tauri Guides](https://tauri.app/v1/guides/)
- [Svelte Tutorial](https://svelte.dev/tutorial)
- [Rust Book](https://doc.rust-lang.org/book/)
- [DaisyUI Components](https://daisyui.com/components/)

---

Happy developing! 🚀

