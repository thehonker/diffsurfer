// Timeline display module

interface Commit {
  hash: string;
  message: string;
  author: string;
  email: string;
  date: string;
}

let timelineCallback: ((hash: string) => Promise<void>) | null = null;
let timelineCommits: Commit[] = [];
let navigationTimeout: NodeJS.Timeout | null = null;
let pendingNavigationHash: string | null = null;
let storedCommitStats: Map<string, { additions: number; deletions: number }> =
  new Map();
let resizeObserver: ResizeObserver | null = null;

function updateBlurPosition() {
  const container = document.getElementById('timeline-container');
  const blurElement = document.querySelector('.timeline-blur') as HTMLElement;
  if (container && blurElement) {
    const rect = container.getBoundingClientRect();
    blurElement.style.position = 'fixed';
    blurElement.style.bottom = '0px';
    blurElement.style.left = rect.left + 'px';
    blurElement.style.width = rect.width + 'px';
    blurElement.style.height = '140px';
  }
}

// Update blur element position on window resize
window.addEventListener('resize', updateBlurPosition);

// Initialize the timeline blur element
function initializeTimelineBlur() {
  const timelineContainer = document.getElementById('timeline-container');
  if (!timelineContainer) return;

  // Create blur element if it doesn't exist
  let blurElement = document.querySelector('.timeline-blur') as HTMLElement;
  if (!blurElement) {
    blurElement = document.createElement('div');
    blurElement.className = 'timeline-blur';
    document.body.appendChild(blurElement);
  }

  // Set initial position
  updateBlurPosition();

  // Set up ResizeObserver to update blur element when timeline container resizes
  if (resizeObserver) {
    resizeObserver.disconnect();
  }

  resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      if (entry.target === timelineContainer) {
        updateBlurPosition();
      }
    }
  });

  resizeObserver.observe(timelineContainer);
}

function displayTimeline(
  commits: Commit[],
  selectedCommitHash: string | null,
  commitStats: Map<string, { additions: number; deletions: number }>
) {
  const timeline = document.getElementById('timeline');
  if (!timeline) return;

  // Store commits for navigation
  timelineCommits = commits;

  // Store commit stats for visual updates
  storedCommitStats = commitStats;

  if (commits.length === 0) {
    timeline.innerHTML = '<div style="margin: 20px;">No commits found</div>';
    return;
  }

  // Determine if any commit is selected
  const hasSelection = !!selectedCommitHash;

  // Add or remove the has-selection class on the timeline container
  const timelineContainer = document.getElementById('timeline-container');
  if (timelineContainer) {
    if (hasSelection) {
      timelineContainer.classList.add('has-selection');
    } else {
      timelineContainer.classList.remove('has-selection');
    }
  }

  // Create commit nodes for each commit
  timeline.innerHTML = commits
    .map((commit) => {
      const isSelected = commit.hash === selectedCommitHash;
      const stats = commitStats.get(commit.hash);

      if (isSelected) {
        // Show full card for selected commit
        return `
            <div class="commit-node selected" data-hash="${commit.hash}">
              <div class="commit-card">
                <div class="commit-hash">${commit.hash.substring(0, 8)}</div>
                <div class="commit-message">${commit.message.substring(0, 30)}${commit.message.length > 30 ? '...' : ''}</div>
                <div class="commit-date">${new Date(commit.date).toLocaleDateString()}</div>
                ${
                  stats
                    ? `
                  <div class="commit-stats">
                    <div class="additions">+${stats.additions}</div>
                    <div class="deletions">-${stats.deletions}</div>
                  </div>
                `
                    : ''
                }
              </div>
            </div>
          `;
      } else {
        // Show collapsed card for non-selected commits
        return `
            <div class="commit-node" data-hash="${commit.hash}">
              <div class="commit-card collapsed">
                ${
                  stats
                    ? `
                  <div class="additions">+${stats.additions}</div>
                  <div class="deletions">-${stats.deletions}</div>
                `
                    : `
                  <div class="no-stats">No stats</div>
                `
                }
              </div>
            </div>
          `;
      }
    })
    .join('');

  // Scroll to center the selected commit if there is one
  if (selectedCommitHash && timelineContainer) {
    const selectedNode = timeline.querySelector(
      `.commit-node.selected`
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
        behavior: 'smooth',
      });
    }
  }
}

function setupTimelineClickHandler(callback: (hash: string) => Promise<void>) {
  // Store callback for navigation
  timelineCallback = callback;

  // Use event delegation - add click handler to the timeline element
  const timeline = document.getElementById('timeline');
  if (timeline) {
    timeline.addEventListener('click', function (event) {
      // Find the closest commit node ancestor
      const commitNode = (event.target as HTMLElement).closest('.commit-node');
      if (commitNode) {
        const hash = commitNode.getAttribute('data-hash');
        if (hash) {
          void callback(hash);
        }
      }
    });
  }
}

function setupTimelineNavigation() {
  const timelineContainer = document.getElementById('timeline-container');
  if (!timelineContainer) return;

  // Handle horizontal scroll events to refresh blur effect
  timelineContainer.addEventListener('scroll', () => {
    const timeline = document.getElementById('timeline');
    if (timeline) {
      // Force the browser to recalculate the layout
      timeline.style.transform = 'translateZ(0)';
      // Reset the transform after a short delay
      setTimeout(() => {
        timeline.style.transform = '';
      }, 0);
    }
  });

  // Handle vertical scroll events
  timelineContainer.addEventListener(
    'wheel',
    (event) => {
      // Only handle vertical scroll (deltaY) and ignore horizontal scroll (deltaX)
      if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
        event.preventDefault();

        if (!timelineCallback || timelineCommits.length === 0) return;

        const currentIndex = timelineCommits.findIndex(
          (commit) => commit.hash === getSelectedCommitHash()
        );

        let newIndex = currentIndex;

        // Scroll up -> move to newer commit (lower index)
        if (event.deltaY < 0 && currentIndex > 0) {
          newIndex = currentIndex - 1;
        }
        // Scroll down -> move to older commit (higher index)
        else if (
          event.deltaY > 0 &&
          currentIndex < timelineCommits.length - 1
        ) {
          newIndex = currentIndex + 1;
        }

        // If we found a new index, select that commit with debouncing
        if (
          newIndex !== currentIndex &&
          newIndex >= 0 &&
          newIndex < timelineCommits.length
        ) {
          const newHash = timelineCommits[newIndex].hash;

          // Update visual selection immediately
          updateVisualSelection(newHash);

          // Cancel any pending navigation
          if (navigationTimeout) {
            clearTimeout(navigationTimeout);
          }

          // Store the pending navigation hash
          pendingNavigationHash = newHash;

          // Delay navigation by 100ms
          navigationTimeout = setTimeout(() => {
            // Check if this is still the pending navigation
            if (pendingNavigationHash === newHash && timelineCallback) {
              pendingNavigationHash = null;
              void timelineCallback(newHash);
            }
          }, 100);
        }
      }
    },
    { passive: false }
  ); // passive: false to allow preventDefault()

  // Handle arrow key events
  timelineContainer.addEventListener('keydown', (event) => {
    if (!timelineCallback || timelineCommits.length === 0) return;

    const currentIndex = timelineCommits.findIndex(
      (commit) => commit.hash === getSelectedCommitHash()
    );

    let newIndex = currentIndex;

    // Left arrow -> move to newer commit (lower index)
    if (event.key === 'ArrowLeft' && currentIndex > 0) {
      newIndex = currentIndex - 1;
    }
    // Right arrow -> move to older commit (higher index)
    else if (
      event.key === 'ArrowRight' &&
      currentIndex < timelineCommits.length - 1
    ) {
      newIndex = currentIndex + 1;
    }

    // If we found a new index, select that commit with debouncing
    if (
      newIndex !== currentIndex &&
      newIndex >= 0 &&
      newIndex < timelineCommits.length
    ) {
      event.preventDefault();
      const newHash = timelineCommits[newIndex].hash;

      // Update visual selection immediately
      updateVisualSelection(newHash);

      // Cancel any pending navigation
      if (navigationTimeout) {
        clearTimeout(navigationTimeout);
      }

      // Store the pending navigation hash
      pendingNavigationHash = newHash;

      // Delay navigation by 100ms
      navigationTimeout = setTimeout(() => {
        // Check if this is still the pending navigation
        if (pendingNavigationHash === newHash && timelineCallback) {
          pendingNavigationHash = null;
          void timelineCallback(newHash);
        }
      }, 100);
    }
  });

  // Make sure the timeline container can receive focus
  timelineContainer.setAttribute('tabindex', '0');

  // Focus the timeline container when clicked
  timelineContainer.addEventListener('click', () => {
    timelineContainer.focus();
  });
}

function getSelectedCommitHash(): string | null {
  // Find the currently selected commit in the DOM
  const selectedNode = document.querySelector('.commit-node.selected');
  if (selectedNode) {
    return selectedNode.getAttribute('data-hash');
  }
  return null;
}

function cancelPendingNavigation(): void {
  if (navigationTimeout) {
    clearTimeout(navigationTimeout);
    navigationTimeout = null;
    pendingNavigationHash = null;
  }
}

function updateVisualSelection(hash: string): void {
  // Update the visual selection immediately without rebuilding the entire timeline
  const timeline = document.getElementById('timeline');
  if (!timeline) return;

  // Remove selected class from all commit nodes
  const selectedNodes = timeline.querySelectorAll('.commit-node.selected');
  selectedNodes.forEach((node) => node.classList.remove('selected'));

  // Add selected class to the new selected commit node
  const newSelectedNode = timeline.querySelector(
    `.commit-node[data-hash="${hash}"]`
  );
  if (newSelectedNode) {
    newSelectedNode.classList.add('selected');

    // Also update the card content to show full details for selected commit
    const card = newSelectedNode.querySelector('.commit-card');
    if (card) {
      const commit = timelineCommits.find((c) => c.hash === hash);
      if (commit) {
        const stats = storedCommitStats.get(hash);
        card.className = 'commit-card'; // Remove collapsed class
        card.innerHTML = `
          <div class="commit-hash">${commit.hash.substring(0, 8)}</div>
          <div class="commit-message">${commit.message.substring(0, 30)}${commit.message.length > 30 ? '...' : ''}</div>
          <div class="commit-date">${new Date(commit.date).toLocaleDateString()}</div>
          ${
            stats
              ? `
            <div class="commit-stats">
              <div class="additions">+${stats.additions}</div>
              <div class="deletions">-${stats.deletions}</div>
            </div>
          `
              : ''
          }
        `;
      }
    }
  }

  // Update collapsed cards for non-selected commits
  const nonSelectedNodes = timeline.querySelectorAll(
    '.commit-node:not(.selected)'
  );
  nonSelectedNodes.forEach((node) => {
    const card = node.querySelector('.commit-card');
    if (card) {
      card.className = 'commit-card collapsed';
      const nodeHash = node.getAttribute('data-hash');
      if (nodeHash) {
        const stats = storedCommitStats.get(nodeHash);
        card.innerHTML = stats
          ? `
          <div class="additions">+${stats.additions}</div>
          <div class="deletions">-${stats.deletions}</div>
        `
          : `
          <div class="no-stats">No stats</div>
        `;
      }
    }
  });

  // Update has-selection class on timeline container
  const timelineContainer = document.getElementById('timeline-container');
  if (timelineContainer) {
    if (hash) {
      timelineContainer.classList.add('has-selection');
    } else {
      timelineContainer.classList.remove('has-selection');
    }
  }

  // Scroll to center the selected commit
  scrollToSelectedCommit(hash);
}

function scrollToSelectedCommit(hash: string): void {
  const timelineContainer = document.getElementById('timeline-container');
  const timeline = document.getElementById('timeline');
  if (timelineContainer && timeline) {
    const selectedNode = timeline.querySelector(
      `.commit-node[data-hash="${hash}"]`
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
        behavior: 'smooth',
      });
    }
  }
}

function updateCommitStats(
  commitHash: string,
  stats: { additions: number; deletions: number } | null
): void {
  // Update commit stats without rebuilding the entire timeline
  const timeline = document.getElementById('timeline');
  if (!timeline) return;

  // Update the stored stats
  if (stats) {
    storedCommitStats.set(commitHash, stats);
  } else {
    storedCommitStats.delete(commitHash);
  }

  // Find the commit node for this hash
  const commitNode = timeline.querySelector(
    `.commit-node[data-hash="${commitHash}"]`
  );
  if (!commitNode) return;

  // Update the card content based on whether it's selected or not
  const card = commitNode.querySelector('.commit-card');
  if (!card) return;

  const isSelected = commitNode.classList.contains('selected');

  if (isSelected) {
    // For selected commits, we need to show full details
    const commit = timelineCommits.find((c) => c.hash === commitHash);
    if (commit) {
      card.className = 'commit-card'; // Remove collapsed class
      card.innerHTML = `
        <div class="commit-hash">${commit.hash.substring(0, 8)}</div>
        <div class="commit-message">${commit.message.substring(0, 30)}${commit.message.length > 30 ? '...' : ''}</div>
        <div class="commit-date">${new Date(commit.date).toLocaleDateString()}</div>
        ${
          stats
            ? `
          <div class="commit-stats">
            <div class="additions">+${stats.additions}</div>
            <div class="deletions">-${stats.deletions}</div>
          </div>
        `
            : ''
        }
      `;
    }
  } else {
    // For non-selected commits, update just the stats in collapsed view
    card.className = 'commit-card collapsed';
    card.innerHTML = stats
      ? `
        <div class="additions">+${stats.additions}</div>
        <div class="deletions">-${stats.deletions}</div>
      `
      : `
        <div class="no-stats">No stats</div>
      `;
  }
}

function getVisibleCommits(): string[] {
  const timelineContainer = document.getElementById('timeline-container');
  const timeline = document.getElementById('timeline');

  if (!timelineContainer || !timeline) {
    return [];
  }

  const containerRect = timelineContainer.getBoundingClientRect();
  const commitNodes = timeline.querySelectorAll('.commit-node');
  const visibleCommitHashes: string[] = [];

  commitNodes.forEach((node) => {
    const rect = node.getBoundingClientRect();
    // Check if the commit node is visible within the container
    if (rect.right > containerRect.left && rect.left < containerRect.right) {
      const hash = node.getAttribute('data-hash');
      if (hash) {
        visibleCommitHashes.push(hash);
      }
    }
  });

  return visibleCommitHashes;
}

export {
  displayTimeline,
  setupTimelineClickHandler,
  setupTimelineNavigation,
  initializeTimelineBlur,
  getSelectedCommitHash,
  cancelPendingNavigation,
  updateVisualSelection,
  getVisibleCommits,
  updateCommitStats,
  scrollToSelectedCommit,
};
