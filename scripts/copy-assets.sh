#!/bin/bash

# Create dist directory if it doesn't exist
mkdir -p dist

# Read from assets.csv and copy files
while IFS=, read -r src dest
do
  # Create destination directory
  mkdir -p "$(dirname "$dest")"
  
  # Copy files
  if [[ $src == *"*" ]]; then
    cp $src "$dest" 2>/dev/null || true
  else
    cp -r "$src" "$dest" 2>/dev/null || true
  fi
done < assets.csv