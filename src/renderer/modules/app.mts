// Main application module

import type { ElectronAPI } from '../../types/electronAPI.d.mjs';

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

import { initializeTheme } from './theme.mjs';
import {
  loadBranches,
  handleBranchChange,
  getCurrentBranch,
} from './branches.mjs';
import {
  getCommits,
  getSelectedCommitHash,
  setSelectedCommitHash,
  loadCommitHistory,
  getCommitStats,
  type Commit,
} from './commits.mjs';
import {
  getAllFiles,
  setAllFiles,
  getSelectedFilePath,
  setSelectedFilePath,
  getExpandedDirs,
  getFileChangeHistory,
  getFileStats,
  buildFileTree,
  renderFileTree,
  updateChangedFiles,
} from './fileTree.mjs';
import { displayFileDiff, abortCurrentOperation } from './diff.mjs';
import {
  displayTimeline,
  setupTimelineClickHandler,
  setupTimelineNavigation,
  initializeTimelineBlur,
  cancelPendingNavigation,
  updateCommitStats,
  updateVisualSelection,
} from './timeline.mjs';

// Application state
let currentRepoPath: string | null = null;

// Persistent commit stats cache to avoid reloading data we already fetched
const commitStatsCache = new Map<
  string,
  { additions: number; deletions: number }
>();

// Function to load commit stats for all commits in the background
async function loadAllCommitStats(
  repoPath: string,
  commits: Commit[],
  initialStatsMap: Map<string, { additions: number; deletions: number }>
) {
  // Create a copy of the initial stats map to update as we load more stats
  const updatedStatsMap = new Map(initialStatsMap);

  // Update the timeline with initial stats
  displayTimeline(commits, getSelectedCommitHash(), updatedStatsMap);

  // Load stats for all commits that don't already have stats
  for (const commit of commits) {
    // Skip if we already have stats for this commit
    if (initialStatsMap.has(commit.hash)) {
      continue;
    }

    try {
      const statsResult = await window.electronAPI.getCommitStats(
        repoPath,
        commit.hash
      );

      if (statsResult.success && statsResult.stats) {
        // Add to cache
        commitStatsCache.set(commit.hash, statsResult.stats);

        // Add to our updated stats map
        updatedStatsMap.set(commit.hash, statsResult.stats);

        // Update only the specific commit stats without rebuilding the entire timeline
        updateCommitStats(commit.hash, statsResult.stats);
      }
    } catch (error) {
      console.warn(`Failed to get stats for commit ${commit.hash}:`, error);
    }
  }
}

// Helper function to refresh file display
async function refreshFileDisplay(
  repoPath: string,
  commits: Commit[],
  selectedCommitHash: string
) {
  try {
    // Update file tree with changed files for this commit
    await updateChangedFiles(repoPath, commits, selectedCommitHash);

    // Re-render the file tree
    const allFiles = getAllFiles();
    const fileTreeRoot = buildFileTree(allFiles);
    const treeView = document.getElementById('tree-view');
    if (treeView) {
      treeView.innerHTML = renderFileTree(fileTreeRoot);
      // Attach event listeners to the file tree
      attachFileTreeEventListeners(treeView, repoPath);
    }

    // If a file was already selected, refresh its content for the new commit
    const previouslySelectedFilePath = getSelectedFilePath();
    if (previouslySelectedFilePath) {
      // Re-highlight the file in the tree
      // Need to query the treeView again after innerHTML update to get new DOM elements
      const updatedFileItems =
        treeView?.querySelectorAll('.tree-item.file') || [];
      updatedFileItems.forEach((item: Element) => {
        if (item.getAttribute('data-path') === previouslySelectedFilePath) {
          item.classList.add('selected');
        } else {
          item.classList.remove('selected');
        }
      });

      // Refresh the file diff for the new commit
      await displayFileDiff(
        repoPath,
        selectedCommitHash,
        previouslySelectedFilePath
      );
    } else {
      // Clear any previously displayed diff if no file is selected
      const diffContent = document.getElementById('diff-content');
      if (diffContent) {
        diffContent.textContent = 'Select a file to view its diff';
      }
    }
  } catch (error) {
    console.warn(
      `Failed to refresh file display for commit ${selectedCommitHash}:`,
      error
    );
  }
}

// Store the current event listener to prevent duplicates
let currentFileTreeListener: ((event: Event) => Promise<void>) | null = null;

// Attach event listeners to file tree items
function attachFileTreeEventListeners(treeView: HTMLElement, repoPath: string) {
  // Remove existing listener if present
  if (currentFileTreeListener) {
    treeView.removeEventListener(
      'click',
      currentFileTreeListener as EventListener
    );
  }

  // Create new listener
  currentFileTreeListener = async (event: Event) => {
    const target = event.target as HTMLElement;

    // Handle file clicks
    if (target.classList.contains('file')) {
      const filePath = target.getAttribute('data-path');
      if (filePath) {
        setSelectedFilePath(filePath);

        // Highlight selected file
        const fileItems = treeView.querySelectorAll('.tree-item.file');
        fileItems.forEach((item: Element) => item.classList.remove('selected'));
        target.classList.add('selected');

        // Display the file diff
        const selectedCommit = getSelectedCommitHash();
        if (selectedCommit) {
          // Abort any ongoing file diff operations
          abortCurrentOperation();
          await displayFileDiff(repoPath, selectedCommit, filePath);
        }
      }
      return;
    }

    // Handle directory clicks (toggle expand/collapse)
    if (target.classList.contains('dir')) {
      const dirPath = target.getAttribute('data-path') || '';
      const expandedDirs = getExpandedDirs();

      // Toggle the expanded state in the set
      if (expandedDirs.has(dirPath)) {
        expandedDirs.delete(dirPath);
        target.classList.remove('expanded');
        target.classList.add('collapsed');
      } else {
        expandedDirs.add(dirPath);
        target.classList.remove('collapsed');
        target.classList.add('expanded');
      }

      // Find and toggle the corresponding children container
      const childrenContainer = treeView.querySelector(
        `.tree-children[data-parent-path="${dirPath}"]`
      );
      if (childrenContainer) {
        if (expandedDirs.has(dirPath)) {
          childrenContainer.classList.remove('collapsed');
          childrenContainer.classList.add('expanded');
        } else {
          childrenContainer.classList.remove('expanded');
          childrenContainer.classList.add('collapsed');
        }
      }

      return;
    }
  };

  // Attach the new listener
  treeView.addEventListener('click', currentFileTreeListener);
}

async function loadRepository(url: string) {
  const loadingSpinner = document.getElementById('loading-spinner');
  const loadingText = document.getElementById('loading-text');
  const loadedText = document.getElementById('loaded-text');

  // Show loading indicator and hide loaded indicator
  if (loadingSpinner) loadingSpinner.style.display = 'block';
  if (loadingText) loadingText.style.display = 'block';
  if (loadedText) loadedText.style.display = 'none';

  try {
    // Load the repository
    const result = await window.electronAPI.loadRepository(url);

    if (!result.success) {
      throw new Error(result.error || 'Unknown error occurred');
    }

    currentRepoPath = result.repoPath!;

    // Load commit history and branches
    if (currentRepoPath) {
      // Load branches
      await loadBranches(currentRepoPath);

      // Load commit history
      await loadCommitHistory(currentRepoPath);

      // Load commit stats for all commits
      const commits = getCommits();
      const commitStatsMap = new Map<
        string,
        { additions: number; deletions: number }
      >();

      // Load stats for each commit
      for (const commit of commits) {
        try {
          const statsResult = await window.electronAPI.getCommitStats(
            currentRepoPath,
            commit.hash
          );

          if (statsResult.success && statsResult.stats) {
            commitStatsMap.set(commit.hash, statsResult.stats);
          }
        } catch (error) {
          console.warn(`Failed to get stats for commit ${commit.hash}:`, error);
        }
      }

      // Display commits in timeline with stats
      displayTimeline(commits, getSelectedCommitHash(), commitStatsMap);

      // Populate commit selector dropdown
      const commitSelect = document.getElementById(
        'commit-select'
      ) as HTMLSelectElement;
      if (commitSelect) {
        commitSelect.innerHTML = commits
          .map(
            (commit) =>
              `<option value="${commit.hash}" ${commit.hash === getSelectedCommitHash() ? 'selected' : ''}>
                ${commit.hash.substring(0, 8)} - ${commit.message.substring(0, 50)}${commit.message.length > 50 ? '...' : ''}
              </option>`
          )
          .join('');
      }

      // Lazy load commit stats for all commits in the background
      void loadAllCommitStats(currentRepoPath, commits, commitStatsMap);

      // Set up timeline click handlers
      setupTimelineClickHandler(async (hash: string) => {
        // Cancel any pending navigation from scroll/arrow keys
        cancelPendingNavigation();

        // Abort any ongoing file diff operations
        abortCurrentOperation();

        setSelectedCommitHash(hash);

        // Get the updated commits
        const commits = getCommits();

        // Update visual selection immediately without rebuilding the entire timeline
        updateVisualSelection(hash);

        // Update commit selector to match selected commit
        const commitSelect = document.getElementById(
          'commit-select'
        ) as HTMLSelectElement;
        if (commitSelect) {
          commitSelect.value = hash;
        }

        // Load file changes for selected commit
        if (currentRepoPath) {
          await refreshFileDisplay(currentRepoPath, commits, hash);
        }

        // Load commit stats for the selected commit if not already cached
        if (!commitStatsCache.has(hash)) {
          try {
            const statsResult = await window.electronAPI.getCommitStats(
              currentRepoPath!,
              hash
            );

            if (statsResult.success && statsResult.stats) {
              // Cache the stats for future use
              commitStatsCache.set(hash, statsResult.stats);
              // Update only the specific commit stats without rebuilding the entire timeline
              updateCommitStats(hash, statsResult.stats);
            }
          } catch (error) {
            console.warn(`Failed to get stats for commit ${hash}:`, error);
          }
        }
      });

      // Set up timeline navigation (scroll and arrow keys)
      setupTimelineNavigation();

      // Set up branch change handler
      await handleBranchChange(async () => {
        // Reload commit history when branch changes
        if (currentRepoPath) {
          await loadCommitHistory(currentRepoPath);

          // Clear commit stats cache when branch changes since commit hashes will be different
          commitStatsCache.clear();

          // Get the updated commits
          const updatedCommits = getCommits();

          // Select the first commit by default
          let newCommitHash = null;
          if (updatedCommits.length > 0) {
            newCommitHash = updatedCommits[0].hash;
            setSelectedCommitHash(newCommitHash);

            // Load commit stats for all commits
            const updatedCommitStatsMap = new Map<
              string,
              { additions: number; deletions: number }
            >();

            // Load stats for each commit
            for (const commit of updatedCommits) {
              try {
                const statsResult = await window.electronAPI.getCommitStats(
                  currentRepoPath,
                  commit.hash
                );

                if (statsResult.success && statsResult.stats) {
                  updatedCommitStatsMap.set(commit.hash, statsResult.stats);
                  // Cache the stats for future use
                  commitStatsCache.set(commit.hash, statsResult.stats);
                }
              } catch (error) {
                console.warn(
                  `Failed to get stats for commit ${commit.hash}:`,
                  error
                );
              }
            }

            // Display commits in timeline with stats
            displayTimeline(
              updatedCommits,
              getSelectedCommitHash(),
              updatedCommitStatsMap
            );

            // Update commit selector dropdown
            const commitSelect = document.getElementById(
              'commit-select'
            ) as HTMLSelectElement;
            if (commitSelect) {
              commitSelect.innerHTML = updatedCommits
                .map(
                  (commit) =>
                    `<option value="${commit.hash}" ${commit.hash === getSelectedCommitHash() ? 'selected' : ''}>
                      ${commit.hash.substring(0, 8)} - ${commit.message.substring(0, 50)}${commit.message.length > 50 ? '...' : ''}
                    </option>`
                )
                .join('');
            }

            // Lazy load commit stats for all commits in the background
            void loadAllCommitStats(
              currentRepoPath,
              updatedCommits,
              updatedCommitStatsMap
            );

            // Update file tree with changed files for the new commit
            await refreshFileDisplay(
              currentRepoPath,
              updatedCommits,
              newCommitHash
            );
          }
        }
      });

      // Display remote URL if available
      try {
        const remoteResult =
          await window.electronAPI.getDefaultRemote(currentRepoPath);
        if (remoteResult.success && remoteResult.remoteUrl) {
          const repoRemote = document.getElementById('repo-remote');
          if (repoRemote) {
            repoRemote.textContent = remoteResult.remoteUrl;
            // Make the remote URL clickable
            repoRemote.addEventListener('click', async () => {
              await window.electronAPI.openUrl(remoteResult.remoteUrl!);
            });
          }
        }
      } catch (error) {
        console.warn('Failed to get remote URL:', error);
      }

      // Display local path
      const repoLocalPath = document.getElementById('repo-local-path');
      if (repoLocalPath) {
        repoLocalPath.textContent = currentRepoPath;
        // Make the local path clickable
        repoLocalPath.addEventListener('click', async () => {
          await window.electronAPI.openDirectory(currentRepoPath!);
        });
      }

      // Load all files for the repository and build initial file tree
      try {
        const filesResult =
          await window.electronAPI.getAllFiles(currentRepoPath);
        if (filesResult.success && filesResult.files) {
          setAllFiles(filesResult.files);

          // If we have a selected commit, update the file tree for that commit
          const selectedCommit = getSelectedCommitHash();
          if (selectedCommit) {
            await updateChangedFiles(currentRepoPath, commits, selectedCommit);
          }

          // Build and render the file tree
          const fileTreeRoot = buildFileTree(filesResult.files);
          const treeView = document.getElementById('tree-view');
          if (treeView) {
            treeView.innerHTML = renderFileTree(fileTreeRoot);
            // Attach event listeners to the file tree
            attachFileTreeEventListeners(treeView, currentRepoPath);
          }
        }
      } catch (error) {
        console.warn('Failed to load file tree:', error);
      }
    }

    return currentRepoPath;
  } finally {
    // Hide loading indicator and show loaded indicator
    if (loadingSpinner) loadingSpinner.style.display = 'none';
    if (loadingText) loadingText.style.display = 'none';
    if (loadedText) loadedText.style.display = 'block';
  }
}

// Handle load repository button click
async function handleLoadRepoClick(repoUrlInput: HTMLInputElement) {
  const url = repoUrlInput.value.trim();
  if (url) {
    try {
      await loadRepository(url);
      // Hide the project loader and show the main content
      document
        .getElementById('project-loader-container')
        ?.classList.add('hidden');
      document.getElementById('main-content')?.classList.remove('hidden');
      document.getElementById('repo-info')?.classList.remove('hidden');
    } catch (error) {
      console.error('Failed to load repository:', error);
      showError(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  } else {
    // Open file selector dialog if no URL is provided
    try {
      const result = await window.electronAPI.selectDirectory();
      if (result.success && result.path) {
        const fileUrl = `file://${result.path}`;
        repoUrlInput.value = fileUrl;
        await loadRepository(fileUrl);
        // Hide the project loader and show the main content
        document
          .getElementById('project-loader-container')
          ?.classList.add('hidden');
        document.getElementById('main-content')?.classList.remove('hidden');
        document.getElementById('repo-info')?.classList.remove('hidden');
      }
    } catch (error) {
      console.error('Failed to select directory:', error);
      showError(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }
}

// Handle clear repository button click
function handleClearRepoClick(repoUrlInput: HTMLInputElement | null) {
  // Reset the app state
  currentRepoPath = null;

  // Clear input fields
  if (repoUrlInput) {
    repoUrlInput.value = '';
  }

  // Hide main content and show project loader
  document.getElementById('main-content')?.classList.add('hidden');
  document.getElementById('repo-info')?.classList.add('hidden');
  document
    .getElementById('project-loader-container')
    ?.classList.remove('hidden');

  // Clear branch and commit selectors
  const branchSelect = document.getElementById(
    'branch-select'
  ) as HTMLSelectElement;
  const commitSelect = document.getElementById(
    'commit-select'
  ) as HTMLSelectElement;
  if (branchSelect) branchSelect.innerHTML = '';
  if (commitSelect) commitSelect.innerHTML = '';

  // Clear tree view and diff content
  const treeView = document.getElementById('tree-view');
  const diffContent = document.getElementById('diff-content');
  if (treeView) treeView.innerHTML = '';
  if (diffContent) diffContent.textContent = 'Select a file to view its diff';

  // Clear timeline
  const timeline = document.getElementById('timeline');
  if (timeline) timeline.innerHTML = '';
}

// Handle commit selector change
async function handleCommitSelectChange(
  commitSelect: HTMLSelectElement,
  selectedHash: string
) {
  if (!selectedHash || !currentRepoPath) return;

  // Cancel any pending navigation from scroll/arrow keys
  cancelPendingNavigation();

  // Abort any ongoing file diff operations
  abortCurrentOperation();

  setSelectedCommitHash(selectedHash);

  // Get the updated commits
  const commits = getCommits();

  // Update visual selection immediately without rebuilding the entire timeline
  updateVisualSelection(selectedHash);

  // Scroll to the selected commit to ensure proper positioning
  const timelineContainer = document.getElementById('timeline-container');
  const timeline = document.getElementById('timeline');
  if (timelineContainer && timeline) {
    const selectedNode = timeline.querySelector(
      `.commit-node[data-hash="${selectedHash}"]`
    ) as HTMLElement;
    if (selectedNode) {
      // Calculate the position to center the selected node
      const containerWidth = timelineContainer.offsetWidth;
      const nodeOffsetLeft = selectedNode.offsetLeft;
      const nodeWidth = selectedNode.offsetWidth;

      // Calculate scroll position to center the node
      const scrollPosition =
        nodeOffsetLeft - containerWidth / 2 + nodeWidth / 2;

      // Scroll to the calculated position
      timelineContainer.scrollTo({
        left: scrollPosition,
        behavior: 'instant', // Use instant scroll to avoid animation delays
      });
    }
  }

  // Load commit stats for the selected commit if not already cached
  if (!commitStatsCache.has(selectedHash)) {
    try {
      const statsResult = await window.electronAPI.getCommitStats(
        currentRepoPath,
        selectedHash
      );

      if (statsResult.success && statsResult.stats) {
        // Cache the stats for future use
        commitStatsCache.set(selectedHash, statsResult.stats);
        // Update only the specific commit stats without rebuilding the entire timeline
        updateCommitStats(selectedHash, statsResult.stats);
      }
    } catch (error) {
      console.warn(`Failed to get stats for commit ${selectedHash}:`, error);
    }
  }

  // Update commit selector to match selected commit (in case of programmatic changes)
  commitSelect.value = selectedHash;

  // Load file changes for selected commit
  await refreshFileDisplay(currentRepoPath, commits, selectedHash);
}

// Handle jump to diff button click
async function handleJumpToDiffClick() {
  if (!currentRepoPath) return;

  const selectedCommit = getSelectedCommitHash();
  if (!selectedCommit) return;

  const selectedFile = getSelectedFilePath();
  const diffContent = document.getElementById('diff-content');
  const commits = getCommits();

  if (!diffContent) return;

  // Case 1: If no file is selected, open the first diff'd file in current commit
  if (!selectedFile) {
    // Find the first file with changes in the current commit
    try {
      const result = await window.electronAPI.getCommitFileChanges(
        currentRepoPath,
        selectedCommit
      );

      if (result.success && result.files && result.files.length > 0) {
        const firstChangedFile = result.files[0];

        // Select this file
        setSelectedFilePath(firstChangedFile);

        // Update UI to show selected file
        const treeView = document.getElementById('tree-view');
        if (treeView) {
          const fileItems = treeView.querySelectorAll('.tree-item.file');
          fileItems.forEach((item: Element) =>
            item.classList.remove('selected')
          );

          const targetItem = treeView.querySelector(
            `.tree-item.file[data-path="${firstChangedFile}"]`
          );
          if (targetItem) {
            targetItem.classList.add('selected');
          }
        }

        // Display the file diff
        abortCurrentOperation();
        await displayFileDiff(
          currentRepoPath,
          selectedCommit,
          firstChangedFile
        );

        // Scroll to first diff
        setTimeout(() => {
          const firstDiff = diffContent.querySelector(
            '.diff-line.added, .diff-line.removed'
          );
          if (firstDiff) {
            firstDiff.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
            });
          }
        }, 100);
      }
    } catch (error) {
      console.warn('Failed to get commit file changes:', error);
    }
    return;
  }

  // Case 2: If a file is selected, check if it has diffs in current commit
  try {
    const diffResult = await window.electronAPI.getFileDiff(
      currentRepoPath,
      selectedCommit,
      selectedFile
    );

    if (diffResult.success && diffResult.diff) {
      // Check if diff is empty
      const isDiffEmpty = (() => {
        const lines = diffResult.diff.split('\n');
        const contentLines = lines.filter(
          (line) =>
            !line.startsWith('index ') &&
            !line.startsWith('--- ') &&
            !line.startsWith('+++ ') &&
            line.trim() !== ''
        );
        return contentLines.length === 0;
      })();

      if (!isDiffEmpty) {
        // File has diffs in current commit, scroll to first diff
        setTimeout(() => {
          const firstDiff = diffContent.querySelector(
            '.diff-line.added, .diff-line.removed'
          );
          if (firstDiff) {
            firstDiff.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
            });
          }
        }, 100);
        return;
      }
    }

    // Case 3: File has no diffs in current commit, look for nearby commits
    const selectedIndex = commits.findIndex((c) => c.hash === selectedCommit);
    if (selectedIndex === -1) return;

    // Look for the file in nearby commits (up to 3 in either direction)
    for (let distance = 1; distance <= 3; distance++) {
      // Check previous commits (future in timeline)
      const prevIndex = selectedIndex + distance;
      if (prevIndex < commits.length) {
        try {
          const prevCommit = commits[prevIndex];
          const prevDiffResult = await window.electronAPI.getFileDiff(
            currentRepoPath,
            prevCommit.hash,
            selectedFile
          );

          if (prevDiffResult.success && prevDiffResult.diff) {
            const isPrevDiffEmpty = (() => {
              const lines = prevDiffResult.diff.split('\n');
              const contentLines = lines.filter(
                (line) =>
                  !line.startsWith('index ') &&
                  !line.startsWith('--- ') &&
                  !line.startsWith('+++ ') &&
                  line.trim() !== ''
              );
              return contentLines.length === 0;
            })();

            if (!isPrevDiffEmpty) {
              // Found a commit with diffs for this file, jump to it
              setSelectedCommitHash(prevCommit.hash);

              // Update timeline display
              // Preserve existing commit stats to prevent losing stats when jumping
              const preservedCommitStatsMap = new Map(commitStatsCache);
              const stats = getCommitStats(prevCommit.hash);
              if (stats) {
                preservedCommitStatsMap.set(prevCommit.hash, stats);
              }
              displayTimeline(
                commits,
                prevCommit.hash,
                preservedCommitStatsMap
              );

              // Refresh file display for the new commit
              await refreshFileDisplay(
                currentRepoPath,
                commits,
                prevCommit.hash
              );

              // Scroll to first diff after a short delay to allow rendering
              setTimeout(() => {
                const firstDiff = diffContent.querySelector(
                  '.diff-line.added, .diff-line.removed'
                );
                if (firstDiff) {
                  firstDiff.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                  });
                }
              }, 100);
              return;
            }
          }
        } catch (error) {
          console.warn(`Failed to get diff for commit ${prevIndex}:`, error);
        }
      }

      // Check next commits (past in timeline)
      const nextIndex = selectedIndex - distance;
      if (nextIndex >= 0) {
        try {
          const nextCommit = commits[nextIndex];
          const nextDiffResult = await window.electronAPI.getFileDiff(
            currentRepoPath,
            nextCommit.hash,
            selectedFile
          );

          if (nextDiffResult.success && nextDiffResult.diff) {
            const isNextDiffEmpty = (() => {
              const lines = nextDiffResult.diff.split('\n');
              const contentLines = lines.filter(
                (line) =>
                  !line.startsWith('index ') &&
                  !line.startsWith('--- ') &&
                  !line.startsWith('+++ ') &&
                  line.trim() !== ''
              );
              return contentLines.length === 0;
            })();

            if (!isNextDiffEmpty) {
              // Found a commit with diffs for this file, jump to it
              setSelectedCommitHash(nextCommit.hash);

              // Update timeline display
              // Preserve existing commit stats to prevent losing stats when jumping
              const preservedCommitStatsMap = new Map(commitStatsCache);
              const stats = getCommitStats(nextCommit.hash);
              if (stats) {
                preservedCommitStatsMap.set(nextCommit.hash, stats);
              }
              displayTimeline(
                commits,
                nextCommit.hash,
                preservedCommitStatsMap
              );

              // Refresh file display for the new commit
              await refreshFileDisplay(
                currentRepoPath,
                commits,
                nextCommit.hash
              );

              // Scroll to first diff after a short delay to allow rendering
              setTimeout(() => {
                const firstDiff = diffContent.querySelector(
                  '.diff-line.added, .diff-line.removed'
                );
                if (firstDiff) {
                  firstDiff.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                  });
                }
              }, 100);
              return;
            }
          }
        } catch (error) {
          console.warn(`Failed to get diff for commit ${nextIndex}:`, error);
        }
      }
    }

    // If we get here, no nearby commits have diffs for this file
    console.log(
      'No diffs found for this file in the current or nearby commits'
    );
  } catch (error) {
    console.warn('Failed to check file diffs:', error);
  }
}

async function initializeApp() {
  // Initialize theme
  await initializeTheme();

  // Initialize timeline blur effect
  initializeTimelineBlur();

  // Set up event listeners for UI elements
  const loadRepoBtn = document.getElementById('load-repo-btn');
  const repoUrlInput = document.getElementById('repo-url') as HTMLInputElement;

  if (loadRepoBtn && repoUrlInput) {
    // Handle load repository button click
    loadRepoBtn.addEventListener('click', async () => {
      await handleLoadRepoClick(repoUrlInput);
    });

    // Also handle Enter key in the input field
    repoUrlInput.addEventListener('keypress', async (event) => {
      if (event.key === 'Enter') {
        await handleLoadRepoClick(repoUrlInput);
      }
    });
  }

  // Set up clear repository button
  const clearRepoBtn = document.getElementById('clear-repo-btn');
  if (clearRepoBtn) {
    clearRepoBtn.addEventListener('click', () => {
      handleClearRepoClick(repoUrlInput);
    });
  }

  // Set up commit selector change handler
  const commitSelect = document.getElementById(
    'commit-select'
  ) as HTMLSelectElement;
  if (commitSelect) {
    commitSelect.addEventListener('change', async () => {
      const selectedHash = commitSelect.value;
      await handleCommitSelectChange(commitSelect, selectedHash);
    });
  }

  // Set up jump to diff button
  const jumpToDiffBtn = document.getElementById('jump-to-diff-btn');
  if (jumpToDiffBtn) {
    jumpToDiffBtn.addEventListener('click', async () => {
      await handleJumpToDiffClick();
    });
  }

  // Example of using the exposed API from preload script
  if (window.electronAPI) {
    // Send a message to the main process
    window.electronAPI.sendMessage('Hello from renderer!');
  }
}

function getCurrentRepoPath(): string | null {
  return currentRepoPath;
}

function showError(message: string) {
  const errorMessage = document.getElementById('error-message');
  if (errorMessage) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
  }
}

export {
  initializeApp,
  loadRepository,
  getCurrentRepoPath,
  getCurrentBranch,
  getCommits,
  getSelectedCommitHash,
  setSelectedCommitHash,
  getAllFiles,
  setAllFiles,
  getSelectedFilePath,
  setSelectedFilePath,
  getExpandedDirs,
  getFileChangeHistory,
  getFileStats,
  buildFileTree,
  renderFileTree,
  updateChangedFiles,
  displayFileDiff,
  displayTimeline,
  setupTimelineClickHandler,
  loadBranches,
  handleBranchChange,
  loadCommitHistory,
  getCommitStats,
  showError,
  loadAllCommitStats,
};
