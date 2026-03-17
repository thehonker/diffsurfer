import electronSquirrelStartup from 'electron-squirrel-startup';
import { app } from 'electron';
import { join } from 'node:path';
import { readdir } from 'node:fs/promises';

/**
 * Handle creating/removing shortcuts on Windows when installing/uninstalling.
 * @returns true if the app should quit due to squirrel startup
 */
export function handleSquirrelStartup(): boolean {
  if (electronSquirrelStartup) {
    return true;
  }
  return false;
}

/**
 * Get the platform-specific themes directory for the application
 * @returns Path to the themes directory
 */
export function getUserThemesDir(): string {
  // Get the user themes directory based on the platform
  if (process.platform === 'win32') {
    // Windows: Use APPDATA directory
    return join(app.getPath('appData'), 'diffsurfer', 'themes');
  } else {
    // macOS/Linux: Use ~/.config/diffsurfer
    return join(app.getPath('home'), '.config', 'diffsurfer', 'themes');
  }
}

/**
 * List all user themes in the themes directory
 * @returns Array of theme names
 */
export async function listUserThemes(): Promise<string[]> {
  try {
    const themesDir = getUserThemesDir();

    // Read the directory and filter for .css files
    const files = await readdir(themesDir);
    return files
      .filter((file) => file.endsWith('.css'))
      .map((file) => file.slice(0, -4));
  } catch {
    // Directory doesn't exist or is inaccessible, return empty array
    return [];
  }
}
