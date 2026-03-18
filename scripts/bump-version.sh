#!/bin/bash

# Version bumping script for Diffsurfer
# Usage: ./scripts/bump-version.sh [major|minor|patch|<version>]

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[STATUS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [[ ! -f "package.json" ]]; then
    print_error "This script must be run from the project root directory"
    exit 1
fi

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
print_status "Current version: $CURRENT_VERSION"

# Determine new version
if [[ $# -eq 0 ]]; then
    print_error "Please specify version bump type: major, minor, patch, or a specific version number"
    exit 1
fi

BUMP_TYPE=$1

if [[ "$BUMP_TYPE" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    # Specific version provided
    NEW_VERSION=$BUMP_TYPE
    print_status "Setting version to: $NEW_VERSION"
else
    # Parse current version
    IFS='.' read -ra VERSION_PARTS <<< "$CURRENT_VERSION"
    MAJOR=${VERSION_PARTS[0]}
    MINOR=${VERSION_PARTS[1]}
    PATCH=${VERSION_PARTS[2]}
    
    case $BUMP_TYPE in
        major)
            NEW_VERSION="$((MAJOR + 1)).0.0"
            ;;
        minor)
            NEW_VERSION="${MAJOR}.$((MINOR + 1)).0"
            ;;
        patch)
            NEW_VERSION="${MAJOR}.${MINOR}.$((PATCH + 1))"
            ;;
        *)
            print_error "Invalid bump type. Use: major, minor, patch, or a specific version (e.g., 1.2.3)"
            exit 1
            ;;
    esac
    
    print_status "Bumping $BUMP_TYPE version to: $NEW_VERSION"
fi

# Confirm with user
read -p "Do you want to proceed with bumping version from $CURRENT_VERSION to $NEW_VERSION? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Version bump cancelled"
    exit 0
fi

# Bump version in package.json
print_status "Updating package.json..."
npm version $NEW_VERSION --no-git-tag-version
npm install --save

# Update Casks/diffsurfer.rb
print_status "Updating Casks/diffsurfer.rb..."
# Update version line
sed -i '' "s/version \".*\"/version \"$NEW_VERSION\"/" Casks/diffsurfer.rb

# Show changes
print_status "Changes made:"
git diff package.json Casks/diffsurfer.rb

# Commit changes
print_status "Committing changes..."
git add package.json package-lock.json Casks/diffsurfer.rb
git commit -m "chore: bump version to $NEW_VERSION"

# Create tag
print_status "Creating tag v$NEW_VERSION..."
git tag -a "v$NEW_VERSION" -m "Version $NEW_VERSION"

# Push changes and tag
print_status "Pushing changes and tag..."
git push
git push origin "v$NEW_VERSION"

print_status "Version bump complete! New version is $NEW_VERSION"