import { BrowserWindow } from 'electron';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  getSavedWindowState,
  restoreWindowState,
  saveWindowState,
} from './windowStateKeeper.mjs';

// Export BrowserWindow type for use in return type
export type { BrowserWindow };

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Create the main application window
 */
export async function createWindow(): Promise<BrowserWindow> {
  // Get saved window state
  const savedState = await getSavedWindowState();

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    height: savedState.height,
    webPreferences: {
      preload: join(__dirname, '../preload.mjs'),
      nodeIntegration: true,
      contextIsolation: true,
    },
    width: savedState.width,
    x: savedState.x,
    y: savedState.y,
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 15, y: 15 }, // Vertically center in 40px header
  });

  // Restore window position and maximized state
  restoreWindowState(mainWindow, savedState);

  // Save window state on close
  mainWindow.on('close', () => {
    void saveWindowState(mainWindow);
  });

  // and load the index.html of the app.
  void mainWindow.loadFile(join(__dirname, '../renderer/index/index.html'));

  return mainWindow;
}
