# Scripts Documentation

## Version Bump Script

The `bump-version.sh` script automates the process of bumping the application version across multiple files, committing the changes, tagging the release, and pushing to the repository.

### Usage

```bash
./scripts/bump-version.sh [major|minor|patch|<version>]
```

Or using npm:

```bash
npm run bump [major|minor|patch|<version>]
```

### Parameters

- `major` - Increments the major version (1.0.0 → 2.0.0)
- `minor` - Increments the minor version (1.0.0 → 1.1.0)
- `patch` - Increments the patch version (1.0.0 → 1.0.1)
- `<version>` - Sets a specific version (e.g., `1.2.3`)

### What it does

1. Updates the version in `package.json`
2. Updates the version in `Formula/diffsurfer.rb`
3. Commits the changes with a standard commit message
4. Creates a git tag for the new version
5. Pushes both the commit and tag to the remote repository

### Example

```bash
# Bump patch version (1.0.7 → 1.0.8)
./scripts/bump-version.sh patch

# Set specific version
./scripts/bump-version.sh 2.0.0
```