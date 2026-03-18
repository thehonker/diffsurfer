# Packaging Documentation

## Overview

This document describes the packaging process for Diffsurfer across different platforms.

## Supported Platforms

1. **macOS**
   - DMG installer (drag-and-drop)
   - ZIP archive for manual extraction
   - Homebrew cask formula (personal tap)

2. **Windows**
   - NSIS installer with customizable installation path
   - ZIP archive for manual extraction

3. **Linux**
   - AppImage with embedded Node.js runtime
   - TAR.GZ archive for manual extraction

## Automated Builds

GitHub Actions automatically builds and packages the application when a new git tag is pushed:

1. Create a new tag: `git tag v1.2.3`
2. Push the tag: `git push origin v1.2.3`
3. GitHub Actions will:
   - Build the application on macOS, Windows, and Linux
   - Create platform-specific packages
   - Create a GitHub release with all packages attached

## Manual Packaging

To manually create packages, use the following npm scripts:

```bash
# Build packages for specific platforms
npm run dist:mac
npm run dist:win
npm run dist:linux
```

## Homebrew Tap

This repository can be used directly as a Homebrew tap for macOS users:

```bash
brew tap thehonker/diffsurfer
brew install --cask diffsurfer
```

The tap is located in the `homebrew-diffsurfer` directory and contains the cask formula that points to the GitHub releases.
