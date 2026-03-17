// Branch management module

import type { ElectronAPI } from '../../types/electronAPI.d.mjs';

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

let branches: string[] = [];
let currentBranch: string | null = null;
let currentRepoPath: string | null = null;

async function loadBranches(repoPath: string) {
  currentRepoPath = repoPath;

  if (!currentRepoPath) return;

  try {
    // Get all branches
    const branchesResult =
      await window.electronAPI.getBranches(currentRepoPath);
    if (branchesResult.success) {
      branches = branchesResult.branches || [];
    }

    // Get current branch
    const currentBranchResult =
      await window.electronAPI.getCurrentBranch(currentRepoPath);
    if (currentBranchResult.success) {
      currentBranch = currentBranchResult.branch || null;
    }

    // Display branches in selector
    displayBranches();
  } catch (error) {
    console.warn('Failed to load branches:', error);
  }
}

function displayBranches() {
  const branchSelect = document.getElementById(
    'branch-select'
  ) as HTMLSelectElement;
  if (!branchSelect) return;

  if (branches.length === 0) {
    branchSelect.innerHTML = '<option>No branches found</option>';
    return;
  }

  // Filter out remote branches for display (keep only local branches)
  const localBranches = branches.filter(
    (branch) => !branch.startsWith('remotes/')
  );

  branchSelect.innerHTML = localBranches
    .map(
      (branch) =>
        `<option value="${branch}" ${branch === currentBranch ? 'selected' : ''}>
          ${branch}
        </option>`
    )
    .join('');
}

async function handleBranchChange(
  callback: (newCommitHash: string) => Promise<void>
) {
  const branchSelect = document.getElementById(
    'branch-select'
  ) as HTMLSelectElement;
  const loadingSpinner = document.getElementById('loading-spinner');
  const loadingText = document.getElementById('loading-text');

  if (branchSelect && currentRepoPath) {
    branchSelect.addEventListener('change', async () => {
      const selectedBranch = branchSelect.value;
      if (selectedBranch && currentRepoPath) {
        // Show loading indicator and hide loaded indicator
        if (loadingSpinner) loadingSpinner.style.display = 'block';
        if (loadingText) loadingText.style.display = 'block';
        const loadedText = document.getElementById('loaded-text');
        if (loadedText) loadedText.style.display = 'none';

        try {
          // Checkout the selected branch
          const result = await window.electronAPI.checkoutBranch(
            currentRepoPath,
            selectedBranch
          );

          if (result.success) {
            currentBranch = selectedBranch;
            // Notify caller to reload commit history
            await callback(selectedBranch);
          } else {
            throw new Error(
              `Failed to checkout branch ${selectedBranch}: ${result.error || 'Unknown error'}`
            );
          }
        } finally {
          // Hide loading indicator and show loaded indicator
          if (loadingSpinner) loadingSpinner.style.display = 'none';
          if (loadingText) loadingText.style.display = 'none';
          const loadedText = document.getElementById('loaded-text');
          if (loadedText) loadedText.style.display = 'block';
        }
      }
    });
  }
}

function getCurrentBranch(): string | null {
  return currentBranch;
}

export { loadBranches, displayBranches, handleBranchChange, getCurrentBranch };
