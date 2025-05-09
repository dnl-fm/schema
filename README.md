# Schema

### Work with SQLite and LibSQL databases

Effortlessly explore, query, and manage your SQLite and LibSQL databases with Schema.
This app provides a user-friendly interface for viewing database schemas, executing SQL queries, and managing your data

## Development Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

### Linux Dependencies

If you're developing on Linux, you'll need to install the following dependencies:

```bash
sudo apt-get update
sudo apt-get install -y libgtk-3-dev libwebkit2gtk-4.0-dev libappindicator3-dev librsvg2-dev patchelf libsoup-3.0-dev libjavascriptcoregtk-4.1-dev
```

## Development Commands

```bash
# Install dependencies
deno cache vite.config.ts
deno cache src/main.tsx

# Run in development mode
deno task dev

# Build for production
deno task build
deno task tauri build
```

## Releasing

The app is configured with GitHub Actions for automatic releases. To create a new release:

1. Update the version in `src-tauri/tauri.conf.json`
2. Commit all changes
3. Tag the release: `git tag v0.1.0` (using the same version)
4. Push with tags: `git push && git push --tags`

This will trigger the GitHub Actions workflow that:
- Builds installers for Linux only (Windows and macOS builds are currently disabled)
- Creates a GitHub release with all installation files automatically attached
- Generates release notes
- Publishes the release automatically

The workflow will build and attach the following files to the release:
- Linux: `.deb` package and `.AppImage` file

## Manual Release

To build the app manually for your current platform:

```bash
deno task tauri build
```

The built installers will be available in `src-tauri/target/release/bundle/`.
