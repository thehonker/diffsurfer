# diffsurfer

A GUI commit history timeline viewer for Git repositories.

## Features

- Visual timeline of Git commits with addition/deletion statistics
- File tree view showing changed files across commits
- Inline diff visualization for file changes
- Support for both local and remote Git repositories
- Dark and light theme options
- Branch switching capability

## Installation

1. Clone the repository:

   ```
   bash
   git clone <repository-url>
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Build the application:
   ```bash
   npm run build
   ```

## Usage

### Running the Application

Start the application in development mode:

```bash
npm run dev
```

Or run the built application:

```bash
npm run start
```

### Loading a Repository

1. When the application starts, you'll see a repository loading screen
2. Enter a file:// URL pointing to a local Git repository, or a git:// URL for a remote repository
3. Alternatively, click "Load Repository" without entering a URL to browse for a local directory
4. The application will load the commit history and display it in a timeline view

### Navigation

- Click on commits in the timeline to view details
- Use mouse wheel or arrow keys to navigate through commits
- Select files in the sidebar to view their diffs
- Switch branches using the branch selector dropdown
- Change themes using the theme selector

## Development

### Building

Build the application:

```bash
npm run build
```

This will:

1. Run ESLint to check for code issues
2. Compile TypeScript files
3. Copy static assets to the dist directory

### Running Tests

Run theing checks:

```bash
npm test
```

### Server Mode

Run the application in server mode to serve the UI over HTTP:

```bash
npm run server
```

The server will be available at http://localhost:3000

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

Attribution-NonCommercial-ShareAlike 4.0 International
