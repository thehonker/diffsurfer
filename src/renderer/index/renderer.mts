'use strict';

import { initializeApp } from '../modules/app.mjs';

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initializeApp().catch((error) => {
    console.error('Failed to initialize application:', error);
  });
});
