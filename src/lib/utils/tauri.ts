import { invoke } from '@tauri-apps/api/tauri';

/**
 * Invoke the Tauri 'greet' command
 * @param name - The name to greet
 * @returns A greeting message
 */
export async function greet(name: string): Promise<string> {
  return await invoke('greet', { name });
}

/**
 * Example utility for invoking Tauri commands with error handling
 * @param command - The command name
 * @param args - Command arguments
 * @returns The command result or throws an error
 */
export async function invokeTauri<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  try {
    return await invoke<T>(command, args);
  } catch (error) {
    console.error(`Error invoking Tauri command '${command}':`, error);
    throw error;
  }
}

