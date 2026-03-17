// Diff display module

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };

  return text.replace(/[&<>"']/g, function (m) {
    return map[m];
  });
}

function isDiffEmpty(diff: string): boolean {
  // Check if diff contains only header lines (index, ---, +++)
  const lines = diff.split('\n');
  const contentLines = lines.filter(
    (line) =>
      !line.startsWith('index ') &&
      !line.startsWith('--- ') &&
      !line.startsWith('+++ ') &&
      line.trim() !== ''
  );
  return contentLines.length === 0;
}

async function displayFileContent(content: string) {
  const diffContent = document.getElementById('diff-content');
  if (!diffContent) return;

  if (!content.trim()) {
    diffContent.innerHTML = 'File is empty';
    return;
  }

  if (window.hljs) {
    // Apply syntax highlighting
    const highlightedContent = window.hljs.highlightAuto(content);

    // Split highlighted content into lines
    const lines = highlightedContent.value.split('\n');
    const formattedLines = lines.map((line: string, index: number) => {
      // Add line numbers (1-indexed) with a class instead of inline style
      return `<div class="diff-line"><span class="line-number">${index + 1}</span>${line}</div>`;
    });

    diffContent.innerHTML = formattedLines.join('');
  } else {
    // Fallback to basic escaping if highlight.js fails to load
    const lines = content.split('\n');
    const formattedLines = lines.map((line: string, index: number) => {
      // Add line numbers (1-indexed) with a class instead of inline style
      return `<div class="diff-line"><span class="line-number">${index + 1}</span>${escapeHtml(line)}</div>`;
    });

    diffContent.innerHTML = formattedLines.join('');
  }
}

async function displayFileWithInlineDiff(fileContent: string, diff: string) {
  const diffContent = document.getElementById('diff-content');
  if (!diffContent) return;

  // Parse the diff to extract changes
  const diffLines = diff.split('\n');
  const changes = parseDiff(diffLines);

  // Get the original file lines
  const fileLines = fileContent.split('\n');

  if (window.hljs) {
    // Apply changes to create the display with syntax highlighting
    const formattedLines = fileLines.map((line: string, index: number) => {
      const lineNumber = index + 1;

      // Check if this line was added or removed
      if (changes.added.has(lineNumber)) {
        // This is an added line
        const addedLine = changes.added.get(lineNumber) || '';
        const highlightedAddedLine = window.hljs.highlightAuto(addedLine).value;
        return `<div class="diff-line added"><span class="line-number">${lineNumber}</span>${highlightedAddedLine}</div>`;
      } else if (changes.removed.has(lineNumber)) {
        // This line was removed (show as removed)
        const highlightedLine = window.hljs.highlightAuto(line).value;
        return `<div class="diff-line removed"><span class="line-number">${lineNumber}</span>${highlightedLine}</div>`;
      } else {
        // Unchanged line
        const highlightedLine = window.hljs.highlightAuto(line).value;
        return `<div class="diff-line"><span class="line-number">${lineNumber}</span>${highlightedLine}</div>`;
      }
    });

    diffContent.innerHTML = formattedLines.join('');
  } else {
    // Fallback to basic escaping if highlight.js fails to load
    const formattedLines = fileLines.map((line: string, index: number) => {
      const lineNumber = index + 1;

      // Check if this line was added or removed
      if (changes.added.has(lineNumber)) {
        // This is an added line
        return `<div class="diff-line added"><span class="line-number">${lineNumber}</span>${escapeHtml(changes.added.get(lineNumber) || '')}</div>`;
      } else if (changes.removed.has(lineNumber)) {
        // This line was removed (show as removed)
        return `<div class="diff-line removed"><span class="line-number">${lineNumber}</span>${escapeHtml(line)}</div>`;
      } else {
        // Unchanged line
        return `<div class="diff-line"><span class="line-number">${lineNumber}</span>${escapeHtml(line)}</div>`;
      }
    });

    diffContent.innerHTML = formattedLines.join('');
  }
}

function parseDiff(diffLines: string[]): {
  added: Map<number, string>;
  removed: Map<number, string>;
} {
  const added = new Map<number, string>();
  const removed = new Map<number, string>();

  let currentLineInNewFile = 0;
  let currentLineInOldFile = 0;

  for (let i = 0; i < diffLines.length; i++) {
    const line = diffLines[i];

    // Skip header lines
    if (
      line.startsWith('diff ') ||
      line.startsWith('index ') ||
      line.startsWith('--- ') ||
      line.startsWith('+++ ')
    ) {
      continue;
    }

    // Process hunk headers (@@ -old_start,old_count +new_start,new_count @@)
    if (line.startsWith('@@')) {
      // Extract line numbers from hunk header
      const match = line.match(/@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@/);
      if (match) {
        currentLineInOldFile = parseInt(match[1], 10);
        currentLineInNewFile = parseInt(match[3], 10);
      }
      continue;
    }

    // Process line content
    if (line.startsWith('+') && !line.startsWith('+++')) {
      // Added line
      added.set(currentLineInNewFile, line.substring(1));
      currentLineInNewFile++;
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      // Removed line
      removed.set(currentLineInOldFile, line.substring(1));
      currentLineInOldFile++;
    } else {
      // Unchanged line
      currentLineInNewFile++;
      currentLineInOldFile++;
    }
  }

  return { added, removed };
}

// Keep track of the current abort controller
let currentAbortController: AbortController | null = null;

async function displayFileDiff(
  repoPath: string,
  selectedCommitHash: string,
  filePath: string
) {
  const diffContent = document.getElementById('diff-content');
  const loadingSpinner = document.getElementById('loading-spinner');
  const loadingText = document.getElementById('loading-text');

  if (!diffContent) return;

  // Abort any ongoing operation
  if (currentAbortController) {
    currentAbortController.abort();
  }

  // Create a new abort controller for this operation
  currentAbortController = new AbortController();
  const { signal } = currentAbortController;

  // Show loading indicator and hide loaded indicator
  if (loadingSpinner) loadingSpinner.style.display = 'block';
  if (loadingText) loadingText.style.display = 'block';
  const loadedText = document.getElementById('loaded-text');
  if (loadedText) loadedText.style.display = 'none';

  try {
    // Get both the full file content and the diff
    const [contentResult, diffResult] = await Promise.all([
      window.electronAPI.getFileContent(repoPath, selectedCommitHash, filePath),
      window.electronAPI.getFileDiff(repoPath, selectedCommitHash, filePath),
    ]);

    // Check if operation was aborted before proceeding
    if (signal.aborted) {
      return;
    }

    if (contentResult.success) {
      const fileContent = contentResult.content || '';

      // If we have a diff, display the file with inline diff highlighting
      if (
        diffResult.success &&
        diffResult.diff &&
        !isDiffEmpty(diffResult.diff)
      ) {
        await displayFileWithInlineDiff(fileContent, diffResult.diff);
      } else {
        // No changes or diff unavailable, show plain file content
        await displayFileContent(fileContent);
      }
    } else {
      if (!signal.aborted) {
        diffContent.innerHTML = `Error loading file content: ${contentResult.error || 'Unknown error'}`;
      }
    }
  } catch (error) {
    // Only show error if not aborted
    if (!signal.aborted) {
      // Keep the current content visible on error
      diffContent.innerHTML = `Error loading file: ${error instanceof Error ? error.message : String(error)}`;
    }
  } finally {
    // Hide loading indicator and show loaded indicator if operation wasn't aborted
    if (!signal.aborted) {
      if (loadingSpinner) loadingSpinner.style.display = 'none';
      if (loadingText) loadingText.style.display = 'none';
      const loadedText = document.getElementById('loaded-text');
      if (loadedText) loadedText.style.display = 'block';
    }
    // Clear the abort controller reference
    currentAbortController = null;
  }
}

function abortCurrentOperation(): void {
  if (currentAbortController) {
    currentAbortController.abort();
    currentAbortController = null;
  }
}

export {
  escapeHtml,
  isDiffEmpty,
  displayFileContent,
  displayFileWithInlineDiff,
  parseDiff,
  displayFileDiff,
  abortCurrentOperation,
};
