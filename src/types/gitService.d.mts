interface Commit {
    hash: string;
    message: string;
    author: string;
    email: string;
    date: string;
}
interface CommitStats {
    additions: number;
    deletions: number;
}
/**
 * Load a Git repository from a URL (file:// or git://)
 * @param url The URL to the repository
 * @returns Promise resolving to the path of the repository
 */
export declare function loadRepository(url: string): Promise<string>;
/**
 * Clean up cloned repository directories that are older than 24 hours
 */
export declare function cleanupOldRepositories(): void;
/**
 * Get commit history from a repository
 * @param repoPath Path to the repository
 * @returns Array of commit objects
 */
export declare function getCommitHistory(repoPath: string): Promise<Commit[]>;
/**
 * Get file changes for a specific commit
 * @param repoPath Path to the repository
 * @param commitHash Hash of the commit
 * @returns Array of file paths that were changed in the commit
 */
export declare function getCommitFileChanges(repoPath: string, commitHash: string): Promise<string[]>;
/**
 * Get the diff for a specific file in a specific commit
 * @param repoPath Path to the repository
 * @param commitHash Hash of the commit
 * @param filePath Path to the file
 * @returns Diff content for the file
 */
export declare function getFileDiff(repoPath: string, commitHash: string, filePath: string): Promise<string>;
/**
 * Get the full content of a file at a specific commit
 * @param repoPath Path to the repository
 * @param commitHash Hash of the commit
 * @param filePath Path to the file
 * @returns Full content of the file
 */
export declare function getFileContent(repoPath: string, commitHash: string, filePath: string): Promise<string>;
/**
 * Get all files in the repository
 * @param repoPath Path to the repository
 * @returns Array of all file paths in the repository
 */
export declare function getAllFiles(repoPath: string): Promise<string[]>;
/**
 * Get line change statistics for a specific commit
 * @param repoPath Path to the repository
 * @param commitHash Hash of the commit
 * @returns CommitStats object with additions and deletions counts
 */
export declare function getCommitStats(repoPath: string, commitHash: string): Promise<CommitStats>;
/**
 * Get line change statistics for a specific file in a specific commit
 * @param repoPath Path to the repository
 * @param commitHash Hash of the commit
 * @param filePath Path to the file
 * @returns CommitStats object with additions and deletions counts
 */
export declare function getFileStats(repoPath: string, commitHash: string, filePath: string): Promise<CommitStats>;
/**
 * Get the default remote URL for a repository
 * @param repoPath Path to the repository
 * @returns The default remote URL or null if not found
 */
export declare function getDefaultRemote(repoPath: string): Promise<string | null>;
/**
 * Get all branches in a repository
 * @param repoPath Path to the repository
 * @returns Array of branch names
 */
export declare function getBranches(repoPath: string): Promise<string[]>;
/**
 * Get the current branch in a repository
 * @param repoPath Path to the repository
 * @returns Current branch name
 */
export declare function getCurrentBranch(repoPath: string): Promise<string>;
/**
 * Checkout a branch in a repository
 * @param repoPath Path to the repository
 * @param branchName Name of the branch to checkout
 * @returns Success status
 */
export declare function checkoutBranch(repoPath: string, branchName: string): Promise<boolean>;
export {};
