# AGENTS.md

This file contains essential information for agentic coding assistants working with this codebase.

## Project Overview

This is a desktop application built with Electron that provides a GUI for viewing commit history timelines. The project uses TypeScript with ES modules.

## Build/Lint/Test Commands

### Build Commands

```bash
# Build the project (runs lint, compiles TypeScript, copies assets)
npm run build

# Development mode (builds and runs the app)
npm run dev

# Run the built application
npm run start

# Copy static assets to dist directory
npm run copy-assets
```

### Lint Commands

```bash
# Run ESLint on source files
npm run test
```

Note: The "test" script actually runs linting, not tests. There are currently no dedicated test files in the project.

### TypeScript Compilation

```bash
# Compile TypeScript (handled by build command)
npx tsc
```

## Code Style Guidelines

### Formatting

- Use Prettier for code formatting with the following settings:
  - Single quotes for strings
  - Semicolons at the end of statements
  - Trailing commas where valid in ES5 (objects, arrays, etc.)
  - 2-space indentation
  - Tab width of 2 spaces

### Imports

- Use ES module imports (`import`) rather than CommonJS (`require`)
- Group imports in the following order:
  1. External dependencies
  2. Internal modules
  3. Type imports (use `import type` syntax)
- Use named imports when possible: `import { something } from 'module';`
- Place imports at the top of the file

### Types

- Use TypeScript for all source files (`.mts` extension)
- Enable strict type checking as configured in `tsconfig.json`
- Prefer explicit type annotations for function parameters and return types
- Use `interface` for object shapes and `type` for other type aliases
- Avoid using `any` type unless absolutely necessary

### Naming Conventions

- Use camelCase for variables and functions
- Use PascalCase for classes, interfaces, and types
- Use UPPER_SNAKE_CASE for constants
- Use descriptive names that convey purpose rather than implementation details

### Error Handling

- Handle errors appropriately with try/catch blocks
- Use specific error types when possible
- Log errors with appropriate context for debugging
- Avoid silent error swallowing

### Project Structure

- Source files use `.mts` extension for ES modules
- Main process files are in `src/`
- Renderer process files are in `src/renderer/`
- Preload script is in `src/preload.mts`
- Entry point is `src/main.mts`
