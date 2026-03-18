import { BrowserWindow } from 'electron';
import { app } from 'electron';
import { join } from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';

interface WindowState {
  x?: number;
  y?: number;
  width: number;
  height: number;
  isMaximized: boolean;
}

const WINDOW_STATE_FILE = 'window-state.json';

/**
 * Get the path to the window state file
 */
function getWindowStateFilePath(): string {
  return join(app.getPath('userData'), WINDOW_STATE_FILE);
}

/**
 * Get saved window state from file or return defaults
 */
export async function getSavedWindowState(): Promise<WindowState> {
  try {
    const statePath = getWindowStateFilePath();
    const data = await readFile(statePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    // Return default state if file doesn't exist or is invalid
    console.debug('No saved window state found, using defaults', err);
  }

  // Default window state
  return {
    width: 1600,
    height: 900,
    isMaximized: false,
  };
}

/**
 * Save current window state to file
 */
export async function saveWindowState(window: BrowserWindow): Promise<void> {
  try {
    const bounds = window.getBounds();
    const state: WindowState = {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      isMaximized: window.isMaximized(),
    };

    const statePath = getWindowStateFilePath();
    await writeFile(statePath, JSON.stringify(state, null, 2));
  } catch (err) {
    console.warn('Failed to save window state:', err);
  }
}

/**
 * Restore window state from saved data
 */
export function restoreWindowState(
  window: BrowserWindow,
  savedState: WindowState
): void {
  if (savedState.x !== undefined && savedState.y !== undefined) {
    window.setBounds({
      x: savedState.x,
      y: savedState.y,
      width: savedState.width,
      height: savedState.height,
    });
  } else {
    // Just set the size if position isn't available
    window.setSize(savedState.width, savedState.height);
  }

  if (savedState.isMaximized) {
    window.maximize();
  }
}
