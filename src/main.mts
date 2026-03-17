import { app, BrowserWindow } from 'electron';
import { handleSquirrelStartup } from './modules/utils.mjs';
import { createWindow } from './modules/windowManager.mjs';
import {
  registerGitIpcHandlers,
  registerDialogIpcHandlers,
  registerThemeIpcHandlers,
  registerOpenIpcHandlers,
  registerWindowThemeIpcHandler,
} from './modules/ipcHandlers.mjs';
import { startServer } from './modules/server.mjs';
import { cleanupOldRepositories } from './services/gitService.mjs';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (handleSquirrelStartup()) {
  app.quit();
}

// Check if we're running in server mode
const isServerMode = process.argv.includes('--server');

if (isServerMode) {
  // Start HTTP server in server mode
  void startServer().catch((error) => {
    console.error('Failed to start server:', error);
    app.quit();
  });
} else {
  // Register all IPC handlers
  registerGitIpcHandlers();
  registerDialogIpcHandlers();
  registerThemeIpcHandlers();
  registerOpenIpcHandlers();

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  void app.whenReady().then(() => {
    // Clean up old repositories on startup
    cleanupOldRepositories();

    const mainWindow = createWindow();

    // Register IPC handler for window theme updates
    registerWindowThemeIpcHandler(mainWindow);

    app.on('activate', () => {
      // On OS X it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    app.quit();
  });
}
