export interface GetBranchesResult {
  success: boolean;
  branches?: string[];
  error?: string;
}

export interface GetCurrentBranchResult {
  success: boolean;
  branch?: string;
  error?: string;
}

export interface CheckoutBranchResult {
  success: boolean;
  error?: string;
}

export interface LoadRepositoryResult {
  success: boolean;
  repoPath?: string;
  error?: string;
}

interface Commit {
  hash: string;
  message: string;
  author: string;
  email: string;
  date: string;
}

export interface GetCommitHistoryResult {
  success: boolean;
  commits?: Commit[];
  error?: string;
}

export interface GetCommitFileChangesResult {
  success: boolean;
  files?: string[];
  error?: string;
}

export interface GetFileDiffResult {
  success: boolean;
  diff?: string;
  error?: string;
}

export interface GetFileContentResult {
  success: boolean;
  content?: string;
  error?: string;
}

export interface GetAllFilesResult {
  success: boolean;
  files?: string[];
  error?: string;
}

export interface GetCommitStatsResult {
  success: boolean;
  stats?: { additions: number; deletions: number };
  error?: string;
}

export interface GetFileStatsResult {
  success: boolean;
  stats?: { additions: number; deletions: number };
  error?: string;
}

export interface GetDefaultRemoteResult {
  success: boolean;
  remoteUrl?: string;
  error?: string;
}

export interface GetUserThemesDirResult {
  success: boolean;
  themesDir?: string;
  error?: string;
}

export interface ListUserThemesResult {
  success: boolean;
  themes?: string[];
  error?: string;
}

export interface SelectDirectoryResult {
  success: boolean;
  path?: string;
}

export interface OpenUrlResult {
  success: boolean;
  error?: string;
}

export interface OpenDirectoryResult {
  success: boolean;
  error?: string;
}

export interface SetTitlebarThemeResult {
  success: boolean;
  error?: string;
}

export interface GetThemesPathResult {
  success: boolean;
  themesPath?: string;
  error?: string;
}

export interface ElectronAPI {
  sendMessage: (message: string) => void;
  loadRepository: (url: string) => Promise<LoadRepositoryResult>;
  getCommitHistory: (repoPath: string) => Promise<GetCommitHistoryResult>;
  selectDirectory: () => Promise<SelectDirectoryResult>;
  getCommitFileChanges: (
    repoPath: string,
    commitHash: string
  ) => Promise<GetCommitFileChangesResult>;
  getFileDiff: (
    repoPath: string,
    commitHash: string,
    filePath: string
  ) => Promise<GetFileDiffResult>;
  getFileContent: (
    repoPath: string,
    commitHash: string,
    filePath: string
  ) => Promise<GetFileContentResult>;
  getAllFiles: (repoPath: string) => Promise<GetAllFilesResult>;
  getCommitStats: (
    repoPath: string,
    commitHash: string
  ) => Promise<GetCommitStatsResult>;
  getFileStats: (
    repoPath: string,
    commitHash: string,
    filePath: string
  ) => Promise<GetFileStatsResult>;
  getDefaultRemote: (repoPath: string) => Promise<GetDefaultRemoteResult>;
  getBranches: (repoPath: string) => Promise<GetBranchesResult>;
  getCurrentBranch: (repoPath: string) => Promise<GetCurrentBranchResult>;
  checkoutBranch: (
    repoPath: string,
    branchName: string
  ) => Promise<CheckoutBranchResult>;
  getUserThemesDir: () => Promise<GetUserThemesDirResult>;
  listUserThemes: () => Promise<ListUserThemesResult>;
  openUrl: (url: string) => Promise<OpenUrlResult>;
  openDirectory: (path: string) => Promise<OpenDirectoryResult>;
  setTitlebarTheme: (
    theme: 'light' | 'dark'
  ) => Promise<SetTitlebarThemeResult>;
  getThemesPath: () => Promise<GetThemesPathResult>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
    hljs: typeof import('highlight.js').default;
  }
}
