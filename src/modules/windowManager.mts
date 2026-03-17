import { BrowserWindow } from 'electron';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Export BrowserWindow type for use in return type
export type { BrowserWindow };

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Create the main application window
 */
export function createWindow(): BrowserWindow {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    height: 900,
    webPreferences: {
      preload: join(__dirname, '../preload.mjs'),
      nodeIntegration: true,
      contextIsolation: true,
    },
    width: 1600,
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 15, y: 15 }, // Vertically center in 40px header
  });

  // and load the index.html of the app.
  void mainWindow.loadFile(join(__dirname, '../renderer/index/index.html'));

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  return mainWindow;
}
