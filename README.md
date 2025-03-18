# Schema

### Work with SQLite and LibSQL databases

Effortlessly explore, query, and manage your SQLite and LibSQL databases with Schema.
This app provides a user-friendly interface for viewing database schemas, executing SQL queries, and managing your data

## Development Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

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
- Builds installers for Windows, macOS, and Linux
- Creates a draft GitHub release with all installation files
- Generates release notes

After the workflow completes, review the draft release on GitHub and publish it when ready.

## Manual Release

To build the app manually for your current platform:

```bash
deno task tauri build
```

The built installers will be available in `src-tauri/target/release/bundle/`.
