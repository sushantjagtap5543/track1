#!/bin/bash

# GeoSurePath Permission Fixer
# Anti-Gravity Friction Removal Tool

echo "Fixing permissions for GeoSurePath volumes..."

# Directories to fix
DIRS=("logs" "data" "deploy/volumes" "backups")

for dir in "${DIRS[@]}"; do
  if [ -d "$dir" ]; then
    echo "Fixing $dir..."
    chmod -R 777 "$dir" # Open for non-root containers safely
  else
    echo "Creating and fixing $dir..."
    mkdir -p "$dir"
    chmod -R 777 "$dir"
  fi
done

echo "Permissions fixed."
