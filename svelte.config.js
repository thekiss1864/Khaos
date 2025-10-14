import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  preprocess: vitePreprocess(),
  compilerOptions: {
    // Enable runtime checks in dev
    dev: process.env.NODE_ENV === 'development'
  }
};

