#!/bin/bash

# Create dist directory if it doesn't exist
mkdir -p dist

# Read from assets.csv and copy files
while IFS=, read -r src dest
do
  echo "Copying $src to $dest"
  # Create destination directory
  mkdir -p "$(dirname "$dest")"
  
  # Copy files
  echo "Direct copy: cp -r $src $dest"
  cp -r "$src" "$dest" 2>/dev/null || echo "Failed to copy $src"
done < assets.csv