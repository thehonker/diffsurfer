// Theme handling module

import type { ElectronAPI } from '../../types/electronAPI.d.mjs';

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

// Detect platform
const isMac = navigator.userAgent.includes('Macintosh');
const isWindows = navigator.userAgent.includes('Windows');
const isLinux = !isMac && !isWindows;

async function initializeTheme() {
  const themeSelector = document.getElementById(
    'theme-selector'
  ) as HTMLSelectElement;

  // Load saved theme from localStorage or default to light
  const savedTheme = localStorage.getItem('theme') || 'light';

  // Populate theme selector with built-in themes
  themeSelector.innerHTML = `
    <option value="light">Light</option>
    <option value="dark">Dark</option>
  `;

  // Load user themes
  try {
    const result = await window.electronAPI.listUserThemes();
    if (result.success && result.themes) {
      result.themes.forEach((themeName: string) => {
        const option = document.createElement('option');
        option.value = themeName;
        option.textContent =
          themeName.charAt(0).toUpperCase() + themeName.slice(1);
        themeSelector.appendChild(option);
      });
    }
  } catch (error) {
    console.warn('Failed to load user themes:', error);
  }

  // Set the current theme
  themeSelector.value = savedTheme;
  updateThemeLink(savedTheme);

  // Notify main process to update window titlebar theme
  window.electronAPI
    .setTitlebarTheme(savedTheme as 'light' | 'dark')
    .catch((error) => {
      console.warn('Failed to update window titlebar theme:', error);
    });

  // Add platform-specific class to body
  if (isMac) {
    document.body.classList.add('platform-mac');
  } else if (isWindows) {
    document.body.classList.add('platform-windows');
  } else if (isLinux) {
    document.body.classList.add('platform-linux');
  }

  // Add event listener for theme changes
  themeSelector.addEventListener('change', () => {
    const selectedTheme = themeSelector.value;
    updateThemeLink(selectedTheme);
    localStorage.setItem('theme', selectedTheme);

    // Notify main process to update window titlebar theme
    window.electronAPI
      .setTitlebarTheme(selectedTheme as 'light' | 'dark')
      .catch((error) => {
        console.warn('Failed to update window titlebar theme:', error);
      });
  });
}

function updateThemeLink(themeName: string) {
  const themeLink = document.getElementById('theme-link') as HTMLLinkElement;
  // Check if it's a built-in theme or user theme
  if (themeName === 'light' || themeName === 'dark') {
    themeLink.href = `../../themes/${themeName}.css`;
  } else {
    console.log('user themes not yet supported!');
  }
}

export { initializeTheme, updateThemeLink };
