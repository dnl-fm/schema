#!/bin/bash
set -e  # Exit on error

echo "Schema - Local Build Test"
echo "========================="
echo

# Check OS
if [[ "$(uname -s)" != "Linux" ]]; then
  echo "This script is designed for Linux. Your OS is $(uname -s)."
  echo "The script will still run, but dependency installation may fail."
  read -p "Continue? (y/n): " confirm
  if [[ "$confirm" != "y" ]]; then
    exit 1
  fi
fi

# Check dependencies
echo "Checking dependencies..."
MISSING_DEPS=()
DEPS=(
  "libgtk-3-dev"
  "libwebkit2gtk-4.0-dev"
  "libwebkit2gtk-4.1-dev" 
  "libappindicator3-dev"
  "librsvg2-dev"
  "patchelf"
  "libsoup-3.0-dev"
  "libjavascriptcoregtk-4.1-dev"
)

for dep in "${DEPS[@]}"; do
  dpkg -s "$dep" &> /dev/null || MISSING_DEPS+=("$dep")
done

if [ ${#MISSING_DEPS[@]} -gt 0 ]; then
  echo "The following dependencies are missing:"
  for dep in "${MISSING_DEPS[@]}"; do
    echo "  - $dep"
  done
  echo
  echo "Install them with:"
  echo "sudo apt-get update"
  echo "sudo apt-get install -y ${DEPS[*]}"
  read -p "Do you want to install them now? (y/n): " install
  if [[ "$install" == "y" ]]; then
    sudo apt-get update
    sudo apt-get install -y "${DEPS[@]}"
  else
    echo "Please install the dependencies manually."
    exit 1
  fi
fi

# Clean previous dependencies
echo "Cleaning previous dependencies..."
rm -rf node_modules || true
rm -f deno.lock || true

# Install frontend dependencies
echo "Installing frontend dependencies..."
deno install
deno cache --reload vite.config.ts
deno cache --reload src/main.tsx

# Build the app
echo "Building the app..."
deno task build
deno task tauri build

# Check for build artifacts
echo "Looking for build artifacts..."
find src-tauri/target/release/bundle -type f -name "*.*" | sort

echo
echo "Build completed successfully!"
echo "Check the artifacts above to see if they match what you expect." 