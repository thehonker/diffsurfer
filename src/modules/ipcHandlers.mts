import { ipcMain, dialog, shell, BrowserWindow } from 'electron';
import {
  loadRepository,
  getCommitHistory,
  getCommitFileChanges,
  getFileDiff,
  getFileContent,
  getAllFiles,
  getCommitStats,
  getFileStats,
  getDefaultRemote,
  getBranches,
  getCurrentBranch,
  checkoutBranch,
} from '../services/gitService.mjs';
import { getUserThemesDir, listUserThemes } from './utils.mjs';

/**
 * Register all IPC handlers for Git operations
 */
export function registerGitIpcHandlers(): void {
  ipcMain.handle('git:load-repository', async (_event, url: string) => {
    try {
      const repoPath = await loadRepository(url);
      return { success: true, repoPath };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  ipcMain.handle('git:get-commit-history', async (_event, repoPath: string) => {
    try {
      const commits = await getCommitHistory(repoPath);
      return { success: true, commits };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  ipcMain.handle(
    'git:get-commit-file-changes',
    async (_event, repoPath: string, commitHash: string) => {
      try {
        const files = await getCommitFileChanges(repoPath, commitHash);
        return { success: true, files };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }
  );

  ipcMain.handle(
    'git:get-file-diff',
    async (_event, repoPath: string, commitHash: string, filePath: string) => {
      try {
        const diff = await getFileDiff(repoPath, commitHash, filePath);
        return { success: true, diff };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }
  );

  ipcMain.handle(
    'git:get-file-content',
    async (_event, repoPath: string, commitHash: string, filePath: string) => {
      try {
        const content = await getFileContent(repoPath, commitHash, filePath);
        return { success: true, content };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }
  );

  ipcMain.handle('git:get-all-files', async (_event, repoPath: string) => {
    try {
      const files = await getAllFiles(repoPath);
      return { success: true, files };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  ipcMain.handle(
    'git:get-commit-stats',
    async (_event, repoPath: string, commitHash: string) => {
      try {
        const stats = await getCommitStats(repoPath, commitHash);
        return { success: true, stats };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }
  );

  ipcMain.handle(
    'git:get-file-stats',
    async (_event, repoPath: string, commitHash: string, filePath: string) => {
      try {
        const stats = await getFileStats(repoPath, commitHash, filePath);
        return { success: true, stats };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }
  );

  ipcMain.handle('git:get-default-remote', async (_event, repoPath: string) => {
    try {
      const remoteUrl = await getDefaultRemote(repoPath);
      return { success: true, remoteUrl };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  ipcMain.handle('git:get-branches', async (_event, repoPath: string) => {
    try {
      const branches = await getBranches(repoPath);
      return { success: true, branches };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  ipcMain.handle('git:get-current-branch', async (_event, repoPath: string) => {
    try {
      const branch = await getCurrentBranch(repoPath);
      return { success: true, branch };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  ipcMain.handle(
    'git:checkout-branch',
    async (_event, repoPath: string, branchName: string) => {
      try {
        const success = await checkoutBranch(repoPath, branchName);
        return { success };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }
  );
}

/**
 * Register IPC handler for directory selection dialog
 */
export function registerDialogIpcHandlers(): void {
  ipcMain.handle('dialog:select-directory', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    });

    if (result.canceled) {
      return { success: false, path: '' };
    }

    return { success: true, path: result.filePaths[0] };
  });
}

/**
 * Register all IPC handlers for theme operations
 */
export function registerThemeIpcHandlers(): void {
  ipcMain.handle('theme:get-user-themes-dir', async () => {
    try {
      const themesDir = getUserThemesDir();
      return { success: true, themesDir };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  });

  ipcMain.handle('theme:list-user-themes', async () => {
    try {
      const themes = await listUserThemes();
      return { success: true, themes };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  });

  ipcMain.handle('theme:get-themes-path', async () => {
    try {
      // Get the path to the themes directory relative to the app resources
      const { app } = await import('electron');
      const { join } = await import('node:path');
      const themesPath = join(app.getAppPath(), 'dist', 'themes');
      return { success: true, themesPath };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  });

  ipcMain.handle('theme:get-css-content', async (_event, themeName: string) => {
    try {
      const { app } = await import('electron');
      const { join } = await import('node:path');
      const { readFile } = await import('node:fs/promises');

      // Construct the path to the CSS file
      const cssPath = join(
        app.getAppPath(),
        'dist',
        'themes',
        `${themeName}.css`
      );

      // Read the CSS file content
      const cssContent = await readFile(cssPath, 'utf8');
      return { success: true, cssContent };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  });
}

/**
 * Register IPC handlers for opening URLs and directories
 */
export function registerOpenIpcHandlers(): void {
  ipcMain.handle('open:url', async (_event, url: string) => {
    try {
      // Validate and convert SSH URLs to HTTPS URLs if needed
      let openUrl = url;
      if (url.startsWith('git@')) {
        // Convert git@github.com:user/repo.git to https://github.com/user/repo
        const match = url.match(/^git@([^:]+):(.+)\/(.+)\.git$/);
        if (match) {
          const [, domain, user, repo] = match;
          openUrl = `https://${domain}/${user}/${repo}`;
        }
      } else if (url.startsWith('http')) {
        // Remove .git suffix if present
        openUrl = url.replace(/\.git$/, '');
      }

      await shell.openExternal(openUrl);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  ipcMain.handle('open:directory', async (_event, path: string) => {
    try {
      await shell.openPath(path);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });
}

/**
 * Register IPC handler for updating window theme
 */
export function registerWindowThemeIpcHandler(mainWindow: BrowserWindow): void {
  ipcMain.handle(
    'window:set-titlebar-theme',
    async (_event, theme: 'light' | 'dark') => {
      try {
        // Update the window's vibrancy and background color based on theme
        if (theme === 'dark') {
          mainWindow.setBackgroundColor('#1e1e1e');
        } else {
          mainWindow.setBackgroundColor('#f0f0f0');
        }
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }
  );
}
