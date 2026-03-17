import simpleGit from 'simple-git';
import type { SimpleGit } from 'simple-git';
import { fileURLToPath } from 'node:url';
import * as fs from 'node:fs';
import * as os from 'node:os';
import { join } from 'node:path';

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
export async function loadRepository(url: string): Promise<string> {
  try {
    const parsedUrl = new URL(url);

    switch (parsedUrl.protocol) {
      case 'file:':
        return loadLocalRepository(parsedUrl);
      case 'git:':
        return loadRemoteRepository(parsedUrl);
      default:
        throw new Error(`Unsupported protocol: ${parsedUrl.protocol}`);
    }
  } catch (error) {
    throw new Error(
      `Failed to load repository: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Load a local Git repository
 * @param url file:// URL pointing to a local repository
 * @returns Path to the repository
 */
async function loadLocalRepository(url: URL): Promise<string> {
  const path = fileURLToPath(url);

  // Check if the path exists and is a directory
  if (!fs.existsSync(path)) {
    throw new Error(`Path does not exist: ${path}`);
  }

  if (!fs.statSync(path).isDirectory()) {
    throw new Error(`Path is not a directory: ${path}`);
  }

  // Check if it's a Git repository
  const gitPath = join(path, '.git');
  if (!fs.existsSync(gitPath)) {
    throw new Error(`Not a Git repository: ${path}`);
  }

  return path;
}

/**
 * Get the platform-specific cache directory for the application
 * @returns Path to the cache directory
 */
function getAppCacheDir(): string {
  const appName = 'diffsurfer';
  let cacheDir: string;

  switch (os.platform()) {
    case 'win32':
      // Windows: Use LOCALAPPDATA or APPDATA
      cacheDir = process.env.LOCALAPPDATA || process.env.APPDATA || os.tmpdir();
      break;
    case 'darwin':
      // macOS: ~/Library/Caches
      cacheDir = join(os.homedir(), 'Library', 'Caches');
      break;
    default:
      // Linux and others: Use XDG_CACHE_HOME or ~/.cache
      cacheDir = process.env.XDG_CACHE_HOME || join(os.homedir(), '.cache');
      break;
  }

  // Create app-specific directory
  const appCacheDir = join(cacheDir, appName);
  if (!fs.existsSync(appCacheDir)) {
    fs.mkdirSync(appCacheDir, { recursive: true });
  }

  return appCacheDir;
}

/**
 * Clone and load a remote Git repository
 * @param url git:// URL pointing to a remote repository
 * @returns Path to the cloned repository
 */
async function loadRemoteRepository(url: URL): Promise<string> {
  // Create a deterministic directory name based on the repository URL (without timestamp)
  const sanitizedUrl =
    url.hostname + url.pathname.replace(/[^a-zA-Z0-9]/g, '_');
  const repoDir = `repo-${sanitizedUrl}`;
  const cacheDir = getAppCacheDir();
  const repoPath = join(cacheDir, repoDir);

  try {
    // Check if repository already exists
    if (fs.existsSync(repoPath)) {
      // Repository exists, fetch updates instead of cloning
      const git: SimpleGit = simpleGit(repoPath);
      await git.fetch('origin');
      console.log(`Fetched updates for existing repository: ${url.href}`);
    } else {
      // Clone the repository
      const git: SimpleGit = simpleGit();
      await git.clone(url.href, repoPath);
      console.log(`Cloned new repository: ${url.href}`);
    }

    return repoPath;
  } catch (error) {
    // If fetching fails on an existing repo, we can still use the existing data
    // If cloning fails on a new repo, clean up the directory
    if (!fs.existsSync(repoPath) || fs.readdirSync(repoPath).length === 0) {
      if (fs.existsSync(repoPath)) {
        fs.rmSync(repoPath, { recursive: true, force: true });
      }
      throw new Error(
        `Failed to clone repository: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    // If we have an existing repo with data, use it even if fetch failed
    console.warn(
      `Failed to fetch updates, using existing repository data: ${error instanceof Error ? error.message : String(error)}`
    );
    return repoPath;
  }
}

/**
 * Clean up cloned repository directories that are older than 24 hours
 */
export function cleanupOldRepositories(): void {
  try {
    const cacheDir = getAppCacheDir();
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    if (!fs.existsSync(cacheDir)) {
      return;
    }

    const items = fs.readdirSync(cacheDir);

    for (const item of items) {
      // Only clean up directories that start with 'repo-'
      if (item.startsWith('repo-')) {
        const itemPath = join(cacheDir, item);
        const stats = fs.statSync(itemPath);

        // Check if it's a directory and older than 24 hours
        if (stats.isDirectory() && stats.mtime.getTime() < oneDayAgo) {
          fs.rmSync(itemPath, { recursive: true, force: true });
          console.log(`Cleaned up old repository: ${item}`);
        }
      }
    }
  } catch (error) {
    console.warn(
      `Failed to cleanup old repositories: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Get commit history from a repository
 * @param repoPath Path to the repository
 * @returns Array of commit objects
 */
export async function getCommitHistory(repoPath: string): Promise<Commit[]> {
  try {
    const git: SimpleGit = simpleGit(repoPath);

    // Get commit history
    const log = await git.log(['--max-count=100']); // Limit to 100 commits for performance

    return log.all.map((commit) => ({
      hash: commit.hash,
      message: commit.message,
      author: commit.author_name,
      email: commit.author_email,
      date: commit.date,
    }));
  } catch (error) {
    throw new Error(
      `Failed to get commit history: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Get file changes for a specific commit
 * @param repoPath Path to the repository
 * @param commitHash Hash of the commit
 * @returns Array of file paths that were changed in the commit
 */
export async function getCommitFileChanges(
  repoPath: string,
  commitHash: string
): Promise<string[]> {
  try {
    const git: SimpleGit = simpleGit(repoPath);

    // Get the list of files changed in this commit
    const diff = await git.diff(['--name-only', `${commitHash}~1`, commitHash]);

    // Split the output into lines and filter out empty lines
    return diff.split('\n').filter((file) => file.trim() !== '');
  } catch (error) {
    // If the commit is the first commit, we need to handle it differently
    try {
      const git: SimpleGit = simpleGit(repoPath);
      const diff = await git.diff(['--name-only', '--root', commitHash]);
      return diff.split('\n').filter((file) => file.trim() !== '');
    } catch {
      throw new Error(
        `Failed to get file changes for commit ${commitHash}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

/**
 * Get the diff for a specific file in a specific commit
 * @param repoPath Path to the repository
 * @param commitHash Hash of the commit
 * @param filePath Path to the file
 * @returns Diff content for the file
 */
export async function getFileDiff(
  repoPath: string,
  commitHash: string,
  filePath: string
): Promise<string> {
  try {
    const git: SimpleGit = simpleGit(repoPath);

    // Get the diff for this file in this commit
    // We compare the file in this commit with the file in the previous commit
    return await git.diff([`${commitHash}~1`, commitHash, '--', filePath]);
  } catch (error) {
    // If the commit is the first commit, we need to handle it differently
    try {
      const git: SimpleGit = simpleGit(repoPath);
      return await git.diff(['--root', commitHash, '--', filePath]);
    } catch {
      throw new Error(
        `Failed to get diff for file ${filePath} in commit ${commitHash}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

/**
 * Get the full content of a file at a specific commit
 * @param repoPath Path to the repository
 * @param commitHash Hash of the commit
 * @param filePath Path to the file
 * @returns Full content of the file
 */
export async function getFileContent(
  repoPath: string,
  commitHash: string,
  filePath: string
): Promise<string> {
  try {
    const git: SimpleGit = simpleGit(repoPath);

    // Get the full content of the file at the specified commit
    return await git.show([`${commitHash}:${filePath}`]);
  } catch (error) {
    throw new Error(
      `Failed to get content for file ${filePath} at commit ${commitHash}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Get all files in the repository
 * @param repoPath Path to the repository
 * @returns Array of all file paths in the repository
 */
export async function getAllFiles(repoPath: string): Promise<string[]> {
  try {
    const git: SimpleGit = simpleGit(repoPath);

    // Get all files in the repository
    const ls = await git.raw(['ls-files']);

    // Split the output into lines and filter out empty lines
    return ls.split('\n').filter((file) => file.trim() !== '');
  } catch (error) {
    throw new Error(
      `Failed to get all files in repository: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Get line change statistics for a specific commit
 * @param repoPath Path to the repository
 * @param commitHash Hash of the commit
 * @returns CommitStats object with additions and deletions counts
 */
export async function getCommitStats(
  repoPath: string,
  commitHash: string
): Promise<CommitStats> {
  try {
    const git: SimpleGit = simpleGit(repoPath);

    // Get shortstat for the commit
    const shortstat = await git.raw(['show', '--shortstat', commitHash]);

    // Parse the shortstat output to extract additions and deletions
    // Example output: " 1 file changed, 3 insertions(+), 4 deletions(-)"
    const additionsMatch = shortstat.match(/(\d+) insertion/);
    const deletionsMatch = shortstat.match(/(\d+) deletion/);

    return {
      additions: additionsMatch ? parseInt(additionsMatch[1], 10) : 0,
      deletions: deletionsMatch ? parseInt(deletionsMatch[1], 10) : 0,
    };
  } catch (error) {
    console.warn(
      `Failed to get commit stats for ${commitHash}: ${error instanceof Error ? error.message : String(error)}`
    );
    // Return default values if stats can't be retrieved
    return {
      additions: 0,
      deletions: 0,
    };
  }
}

/**
 * Get line change statistics for a specific file in a specific commit
 * @param repoPath Path to the repository
 * @param commitHash Hash of the commit
 * @param filePath Path to the file
 * @returns CommitStats object with additions and deletions counts
 */
export async function getFileStats(
  repoPath: string,
  commitHash: string,
  filePath: string
): Promise<CommitStats> {
  try {
    const git: SimpleGit = simpleGit(repoPath);

    // Get numstat for the specific file in the commit
    // This gives us exact line counts for additions and deletions
    const numstat = await git.raw([
      'show',
      '--numstat',
      commitHash,
      '--',
      filePath,
    ]);

    // Parse the numstat output to extract additions and deletions
    // Example output: "3\t4\tpath/to/file.js"
    const lines = numstat.trim().split('\n');
    const fileLine = lines.find((line) => line.includes(filePath));

    if (fileLine) {
      const parts = fileLine.split('\t');
      if (parts.length >= 2) {
        const additions = parseInt(parts[0], 10) || 0;
        const deletions = parseInt(parts[1], 10) || 0;
        return { additions, deletions };
      }
    }

    return {
      additions: 0,
      deletions: 0,
    };
  } catch (error) {
    console.warn(
      `Failed to get file stats for ${filePath} in commit ${commitHash}: ${error instanceof Error ? error.message : String(error)}`
    );
    // Return default values if stats can't be retrieved
    return {
      additions: 0,
      deletions: 0,
    };
  }
}

/**
 * Get the default remote URL for a repository
 * @param repoPath Path to the repository
 * @returns The default remote URL or null if not found
 */
export async function getDefaultRemote(
  repoPath: string
): Promise<string | null> {
  try {
    const git: SimpleGit = simpleGit(repoPath);

    // Get the default remote (usually 'origin')
    const remotes = await git.getRemotes(true);

    // Look for 'origin' first, then fall back to the first remote
    const origin = remotes.find((remote) => remote.name === 'origin');
    if (origin) {
      return origin.refs.push || origin.refs.fetch || null;
    }

    // If no 'origin', use the first remote
    if (remotes.length > 0) {
      return remotes[0].refs.push || remotes[0].refs.fetch || null;
    }

    return null;
  } catch (error) {
    console.warn(
      `Failed to get default remote for repository ${repoPath}: ${error instanceof Error ? error.message : String(error)}`
    );
    return null;
  }
}

/**
 * Get all branches in a repository
 * @param repoPath Path to the repository
 * @returns Array of branch names
 */
export async function getBranches(repoPath: string): Promise<string[]> {
  try {
    const git: SimpleGit = simpleGit(repoPath);

    // Get all branches (local and remote)
    const branches = await git.branch(['-a']);

    // Return all branch names
    return [...branches.all];
  } catch (error) {
    console.warn(
      `Failed to get branches for repository ${repoPath}: ${error instanceof Error ? error.message : String(error)}`
    );
    return [];
  }
}

/**
 * Get the current branch in a repository
 * @param repoPath Path to the repository
 * @returns Current branch name
 */
export async function getCurrentBranch(repoPath: string): Promise<string> {
  try {
    const git: SimpleGit = simpleGit(repoPath);

    // Get current branch
    const branchSummary = await git.branch();

    return branchSummary.current;
  } catch (error) {
    console.warn(
      `Failed to get current branch for repository ${repoPath}: ${error instanceof Error ? error.message : String(error)}`
    );
    return 'main'; // Default fallback
  }
}

/**
 * Checkout a branch in a repository
 * @param repoPath Path to the repository
 * @param branchName Name of the branch to checkout
 * @returns Success status
 */
export async function checkoutBranch(
  repoPath: string,
  branchName: string
): Promise<boolean> {
  try {
    const git: SimpleGit = simpleGit(repoPath);

    // Checkout the branch
    await git.checkout(branchName);

    return true;
  } catch (error) {
    console.warn(
      `Failed to checkout branch ${branchName} in repository ${repoPath}: ${error instanceof Error ? error.message : String(error)}`
    );
    return false;
  }
}
