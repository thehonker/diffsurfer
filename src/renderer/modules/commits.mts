// Commit handling module

import type { ElectronAPI } from '../../types/electronAPI.d.mjs';

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

interface Commit {
  hash: string;
  message: string;
  author: string;
  email: string;
  date: string;
}

let commits: Commit[] = [];
let selectedCommitHash: string | null = null;
const commitStats: Map<string, { additions: number; deletions: number }> =
  new Map();

function getCommits(): Commit[] {
  return commits;
}

function getSelectedCommitHash(): string | null {
  return selectedCommitHash;
}

function setSelectedCommitHash(hash: string): void {
  selectedCommitHash = hash;
}

async function loadCommitHistory(repoPath: string) {
  const loadingSpinner = document.getElementById('loading-spinner');
  const loadingText = document.getElementById('loading-text');

  // Show loading indicator and hide loaded indicator
  if (loadingSpinner) loadingSpinner.style.display = 'block';
  if (loadingText) loadingText.style.display = 'block';
  const loadedText = document.getElementById('loaded-text');
  if (loadedText) loadedText.style.display = 'none';

  try {
    const historyResult = await window.electronAPI.getCommitHistory(repoPath);

    if (!historyResult.success) {
      throw new Error(historyResult.error || 'Unknown error occurred');
    }

    commits = historyResult.commits || [];

    // Select the first commit by default
    if (commits.length > 0) {
      selectedCommitHash = commits[0].hash;
    }

    return commits;
  } finally {
    // Hide loading indicator
    if (loadingSpinner) loadingSpinner.style.display = 'none';
    if (loadingText) loadingText.style.display = 'none';
  }
}

function getCommitStats(hash: string) {
  return commitStats.get(hash);
}

export {
  Commit,
  getCommits,
  getSelectedCommitHash,
  setSelectedCommitHash,
  loadCommitHistory,
  getCommitStats,
};
