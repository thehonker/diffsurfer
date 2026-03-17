// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';
import hljs from 'highlight.js';

// As an example, here we use the exposeInMainWorld API to expose the ipcRenderer
// to the renderer process. This allows us to send messages from the renderer
// to the main process without exposing full Node.js functionality.
contextBridge.exposeInMainWorld('electronAPI', {
  sendMessage: (message: string) => ipcRenderer.send('message', message),
  loadRepository: (url: string) =>
    ipcRenderer.invoke('git:load-repository', url),
  getCommitHistory: (repoPath: string) =>
    ipcRenderer.invoke('git:get-commit-history', repoPath),
  selectDirectory: () => ipcRenderer.invoke('dialog:select-directory'),
  getCommitFileChanges: (repoPath: string, commitHash: string) =>
    ipcRenderer.invoke('git:get-commit-file-changes', repoPath, commitHash),
  getFileDiff: (repoPath: string, commitHash: string, filePath: string) =>
    ipcRenderer.invoke('git:get-file-diff', repoPath, commitHash, filePath),
  getFileContent: (repoPath: string, commitHash: string, filePath: string) =>
    ipcRenderer.invoke('git:get-file-content', repoPath, commitHash, filePath),
  getAllFiles: (repoPath: string) =>
    ipcRenderer.invoke('git:get-all-files', repoPath),
  getCommitStats: (repoPath: string, commitHash: string) =>
    ipcRenderer.invoke('git:get-commit-stats', repoPath, commitHash),
  getFileStats: (repoPath: string, commitHash: string, filePath: string) =>
    ipcRenderer.invoke('git:get-file-stats', repoPath, commitHash, filePath),
  getDefaultRemote: (repoPath: string) =>
    ipcRenderer.invoke('git:get-default-remote', repoPath),
  getBranches: (repoPath: string) =>
    ipcRenderer.invoke('git:get-branches', repoPath),
  getCurrentBranch: (repoPath: string) =>
    ipcRenderer.invoke('git:get-current-branch', repoPath),
  checkoutBranch: (repoPath: string, branchName: string) =>
    ipcRenderer.invoke('git:checkout-branch', repoPath, branchName),
  getUserThemesDir: () => ipcRenderer.invoke('theme:get-user-themes-dir'),
  listUserThemes: () => ipcRenderer.invoke('theme:list-user-themes'),
  openUrl: (url: string) => ipcRenderer.invoke('open:url', url),
  openDirectory: (path: string) => ipcRenderer.invoke('open:directory', path),
  setTitlebarTheme: (theme: 'light' | 'dark') =>
    ipcRenderer.invoke('window:set-titlebar-theme', theme),
});

// Expose highlight.js to the renderer process
contextBridge.exposeInMainWorld('hljs', hljs);
