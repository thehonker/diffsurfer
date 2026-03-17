// File tree module

interface FileTreeNode {
  isDir: boolean;
  path?: string; // For files
  children?: Record<string, FileTreeNode>; // For directories
}

// Track file changes across multiple commits for highlighting
const fileChangeHistory: Map<string, number> = new Map(); // filePath -> commit distance
// Track file stats for the current commit
const fileStats: Map<string, { additions: number; deletions: number }> =
  new Map();
// Track expanded/collapsed state of directories
const expandedDirs = new Set<string>(['']);

let allFiles: string[] = [];
let selectedFilePath: string | null = null;

function getAllFiles(): string[] {
  return allFiles;
}

function setAllFiles(files: string[]): void {
  allFiles = files;
}

function getSelectedFilePath(): string | null {
  return selectedFilePath;
}

function setSelectedFilePath(path: string | null): void {
  selectedFilePath = path;
}

function getExpandedDirs(): Set<string> {
  return expandedDirs;
}

function getFileChangeHistory(): Map<string, number> {
  return fileChangeHistory;
}

function getFileStats(): Map<string, { additions: number; deletions: number }> {
  return fileStats;
}

// Build a hierarchical file structure from the flat file list
function buildFileTree(files: string[]): FileTreeNode {
  const root: FileTreeNode = { isDir: true, children: {} };

  files.forEach((filePath) => {
    const parts = filePath.split('/');
    let current = root;

    parts.forEach((part, index) => {
      if (!current.children) {
        current.children = {};
      }

      if (index === parts.length - 1) {
        // This is a file
        current.children[part] = { isDir: false, path: filePath };
      } else {
        // This is a directory
        if (!current.children[part]) {
          current.children[part] = { isDir: true, children: {} };
        }
        current = current.children[part];
      }
    });
  });

  return root;
}

// Count changes in a directory subtree
function countChangesInSubtree(node: FileTreeNode): {
  current: number;
  prev1: number;
  prev2: number;
  prev3: number;
  next1: number;
  next2: number;
  next3: number;
} {
  const counts = {
    current: 0,
    prev1: 0,
    prev2: 0,
    prev3: 0,
    next1: 0,
    next2: 0,
    next3: 0,
  };

  if (node.isDir && node.children) {
    // Process children
    Object.entries(node.children).forEach(([, child]) => {
      if (child.isDir) {
        // Recursively count changes in subdirectory
        const childCounts = countChangesInSubtree(child);
        counts.current += childCounts.current;
        counts.prev1 += childCounts.prev1;
        counts.prev2 += childCounts.prev2;
        counts.prev3 += childCounts.prev3;
        counts.next1 += childCounts.next1;
        counts.next2 += childCounts.next2;
        counts.next3 += childCounts.next3;
      } else if (child.path) {
        // This is a file, check its change status
        const distance = fileChangeHistory.get(child.path);
        if (distance !== undefined) {
          if (distance === 0) {
            counts.current++;
          } else if (distance === 1) {
            counts.prev1++;
          } else if (distance === 2) {
            counts.prev2++;
          } else if (distance === 3) {
            counts.prev3++;
          } else if (distance === -1) {
            counts.next1++;
          } else if (distance === -2) {
            counts.next2++;
          } else if (distance === -3) {
            counts.next3++;
          }
        }
      }
    });
  }

  return counts;
}

// Render the file tree recursively
function renderFileTree(
  node: FileTreeNode,
  path: string = '',
  depth: number = 0
): string {
  if (!node.isDir) {
    // This is a file
    if (!node.path) return ''; // Safety check

    const distance = fileChangeHistory.get(node.path);
    const stats = fileStats.get(node.path);
    let className = 'tree-item file';

    // Add class based on distance from current commit
    if (distance !== undefined) {
      if (distance === 0) {
        className += ' changed-current'; // Current commit
      } else if (distance > 0) {
        className += ` changed-prev-${distance}`; // Previous commits (1, 2, 3)
      } else {
        className += ` changed-next-${Math.abs(distance)}`; // Next commits (1, 2, 3)
      }
    }

    // Create the stats display
    let statsDisplay = '';
    if (distance === 0 && stats) {
      // Current commit with changes - show additions/deletions in green/red
      if (stats.additions > 0 || stats.deletions > 0) {
        statsDisplay = ` <span class="file-stats current"><span class="additions">+${stats.additions}</span>/<span class="deletions">-${stats.deletions}</span></span>`;
      }
    } else if (distance !== undefined && distance !== 0) {
      // Nearby commit with changes - show commit distance
      // Positive distance = future commits (orange with -), negative distance = past commits (orange with +)
      if (distance > 0) {
        // Future commits - show in orange with minus sign
        statsDisplay = ` <span class="file-stats future">-${distance}</span>`;
      } else {
        // Past commits - show in orange with plus sign
        statsDisplay = ` <span class="file-stats past">+${Math.abs(distance)}</span>`;
      }
    }

    // Adjust file indentation to match directory indentation
    // Files need slightly less padding to account for the visual difference between
    // directory icons (▼/▶) and file placeholders (two spaces)
    const filePadding = Math.max(0, depth * 20 - 4); // Reduce by 4px to compensate
    return `<div class="${className}" data-path="${node.path}" style="padding-left: ${filePadding}px;">
      ${path.split('/').pop()}${statsDisplay}
    </div>`;
  } else {
    // This is a directory
    const isRoot = path === '';
    const dirName = isRoot ? 'root' : path.split('/').pop() || '';
    const isExpanded = expandedDirs.has(path);
    const counts = countChangesInSubtree(node);

    // Create aggregated stats display
    let statsDisplay = '';
    if (
      counts.current > 0 ||
      counts.prev1 > 0 ||
      counts.prev2 > 0 ||
      counts.prev3 > 0 ||
      counts.next1 > 0 ||
      counts.next2 > 0 ||
      counts.next3 > 0
    ) {
      const parts = [];
      if (counts.current > 0)
        parts.push(`<span class="file-stats current">${counts.current}</span>`);
      if (counts.prev1 > 0)
        parts.push(
          `<span class="file-stats changed-prev-1">${counts.prev1}</span>`
        );
      if (counts.prev2 > 0)
        parts.push(
          `<span class="file-stats changed-prev-2">${counts.prev2}</span>`
        );
      if (counts.prev3 > 0)
        parts.push(
          `<span class="file-stats changed-prev-3">${counts.prev3}</span>`
        );
      if (counts.next1 > 0)
        parts.push(
          `<span class="file-stats changed-next-1">${counts.next1}</span>`
        );
      if (counts.next2 > 0)
        parts.push(
          `<span class="file-stats changed-next-2">${counts.next2}</span>`
        );
      if (counts.next3 > 0)
        parts.push(
          `<span class="file-stats changed-next-3">${counts.next3}</span>`
        );
      statsDisplay = ` <span class="dir-stats">(${parts.join(', ')})</span>`;
    }

    let html = `<div class="tree-item dir ${isExpanded ? 'expanded' : 'collapsed'}" data-path="${path}" style="padding-left: ${depth * 20}px;">
      ${isRoot ? '(root)' : dirName}${statsDisplay}
    </div>`;

    // Always render children but wrap in a container that can be shown/hidden with CSS
    if (node.children) {
      // Sort children: directories first, then files, both alphabetically
      const sortedChildren = Object.entries(node.children).sort(
        ([aName, aNode], [bName, bNode]) => {
          // If both are directories or both are files, sort alphabetically
          if (aNode.isDir === bNode.isDir) {
            return aName.localeCompare(bName);
          }
          // If a is directory and b is file, a comes first
          if (aNode.isDir && !bNode.isDir) {
            return -1;
          }
          // If a is file and b is directory, b comes first
          return 1;
        }
      );

      // Wrap children in a container div with a class for CSS targeting
      html += `<div class="tree-children ${isExpanded ? 'expanded' : 'collapsed'}" data-parent-path="${path}">`;

      sortedChildren.forEach(([name, child]) => {
        const childPath = isRoot ? name : `${path}/${name}`;
        html += renderFileTree(child, childPath, depth + 1);
      });

      html += '</div>';
    }

    return html;
  }
}

interface Commit {
  hash: string;
  message: string;
  author: string;
  email: string;
  date: string;
}

async function updateChangedFiles(
  repoPath: string,
  commits: Commit[],
  commitHash: string
) {
  const loadingSpinner = document.getElementById('loading-spinner');
  const loadingText = document.getElementById('loading-text');

  // Show loading indicator and hide loaded indicator
  if (loadingSpinner) loadingSpinner.style.display = 'block';
  if (loadingText) loadingText.style.display = 'block';
  const loadedText = document.getElementById('loaded-text');
  if (loadedText) loadedText.style.display = 'none';

  try {
    // Clear previous change history and file stats
    fileChangeHistory.clear();
    fileStats.clear();

    // Find the index of the selected commit
    const selectedIndex = commits.findIndex(
      (c: Commit) => c.hash === commitHash
    );
    if (selectedIndex === -1) return;

    // Check changes in the current commit (distance 0)
    try {
      const result = await window.electronAPI.getCommitFileChanges(
        repoPath,
        commitHash
      );

      if (result.success) {
        // Mark files changed in current commit with distance 0
        (result.files || []).forEach((file) => {
          fileChangeHistory.set(file, 0);
        });

        // Fetch stats for all files changed in current commit
        await Promise.all(
          (result.files || []).map(async (file) => {
            try {
              const statsResult = await window.electronAPI.getFileStats(
                repoPath,
                commitHash,
                file
              );
              if (statsResult.success && statsResult.stats) {
                fileStats.set(file, statsResult.stats);
              }
            } catch (error) {
              console.warn(`Failed to get stats for file ${file}:`, error);
            }
          })
        );
      }
    } catch (error) {
      console.warn(`Failed to get file changes for current commit:`, error);
    }

    // Check changes in previous commits (distances 1, 2, 3)
    for (let i = 1; i <= 3; i++) {
      const prevIndex = selectedIndex + i;
      if (prevIndex < commits.length) {
        try {
          const prevCommit = commits[prevIndex];
          const result = await window.electronAPI.getCommitFileChanges(
            repoPath,
            prevCommit.hash
          );

          if (result.success) {
            (result.files || []).forEach((file) => {
              // Only set if not already set (prioritize closer commits)
              if (!fileChangeHistory.has(file)) {
                fileChangeHistory.set(file, i);
              }
            });
          }
        } catch (error) {
          console.warn(
            `Failed to get file changes for commit ${prevIndex}:`,
            error
          );
        }
      }
    }

    // Check changes in next commits (distances -1, -2, -3)
    for (let i = 1; i <= 3; i++) {
      const nextIndex = selectedIndex - i;
      if (nextIndex >= 0) {
        try {
          const nextCommit = commits[nextIndex];
          const result = await window.electronAPI.getCommitFileChanges(
            repoPath,
            nextCommit.hash
          );

          if (result.success) {
            (result.files || []).forEach((file) => {
              // Only set if not already set (prioritize closer commits)
              if (!fileChangeHistory.has(file)) {
                fileChangeHistory.set(file, -i);
              }
            });
          }
        } catch (error) {
          console.warn(
            `Failed to get file changes for commit ${nextIndex}:`,
            error
          );
        }
      }
    }
  } finally {
    // Hide loading indicator and show loaded indicator
    if (loadingSpinner) loadingSpinner.style.display = 'none';
    if (loadingText) loadingText.style.display = 'none';
    const loadedText = document.getElementById('loaded-text');
    if (loadedText) loadedText.style.display = 'block';
  }
}

export {
  FileTreeNode,
  getAllFiles,
  setAllFiles,
  getSelectedFilePath,
  setSelectedFilePath,
  getExpandedDirs,
  getFileChangeHistory,
  getFileStats,
  buildFileTree,
  countChangesInSubtree,
  renderFileTree,
  updateChangedFiles,
};
