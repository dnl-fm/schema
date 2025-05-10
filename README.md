# Schema - SQLite Database Explorer

![Version](https://img.shields.io/badge/version-0.1.1-blue)
![Made with Tauri](https://img.shields.io/badge/Made%20with-Tauri-purple)
![Platform](https://img.shields.io/badge/platform-Linux%20%7C%20macOS-lightgrey)

## Introduction

Schema is a modern, lightweight SQLite database explorer built with Tauri - a
framework for building tiny, blazingly fast binaries for all major desktop
platforms. Unlike many Electron-based alternatives, Schema offers superior
performance and a smaller footprint.

This project was created to demonstrate the capabilities of Tauri for desktop
application development and to provide a focused, purpose-built tool for SQLite
databases. As more developers recognize that SQLite is often sufficient for
their prototyping and small-to-medium application needs, Schema fills the gap
for a dedicated, native-feeling SQLite client.

## Features

- **Database Connection** - Open and connect to SQLite databases
- **Schema Exploration** - Browse tables, indexes, and database structure
- **SQL Query Interface** - Execute custom SQL queries with a clean editor
- **Results Visualization** - View query results in a sortable table format
- **Dark/Light Theme Support** - Customizable UI preferences
- **Modern UI** - Built with SolidJS and Tailwind CSS

## Tech Stack

- **Frontend**: SolidJS, TypeScript, Tailwind CSS, Vite
- **Backend**: Tauri, SQLite, Deno
- **Plugins**: tauri-plugin-sql, tauri-plugin-dialog

## Installation for Development

### Prerequisites

- [Deno](https://deno.land/) (v2.2.x or higher)
- [Rust toolchain](https://www.rust-lang.org/tools/install)
- [SQLite development libraries](https://www.sqlite.org/download.html)

### Linux Dependencies

```bash
sudo apt-get update
sudo apt-get install -y libgtk-3-dev libwebkit2gtk-4.0-dev libwebkit2gtk-4.1-dev \
libappindicator3-dev librsvg2-dev patchelf libsoup-3.0-dev libjavascriptcoregtk-4.1-dev
```

### Setup and Development

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/schema.git
   cd schema
   ```

2. Install dependencies:
   ```bash
   deno cache vite.config.ts
   deno cache src/main.tsx
   ```

3. Run in development mode:
   ```bash
   deno task dev
   ```

4. Add packages (if needed):
   ```bash
   # For Deno packages
   deno add <package>

   # For npm packages
   deno add npm:<package>
   ```

## Building for Production

To build Schema for your current platform:

```bash
deno task build
deno task tauri build
```

The built installers will be available in `src-tauri/target/release/bundle/`.

## Installing a Release

### Linux

- Download the `.deb` package or `.AppImage` file from the releases page
- Install the `.deb` package with: `sudo dpkg -i schema_0.1.1_amd64.deb`
- Or make the AppImage executable and run it:
  `chmod +x Schema_0.1.1_amd64.AppImage && ./Schema_0.1.1_amd64.AppImage`

### macOS

- Download the macOS app bundle (`.app.zip`) from the releases page
- Extract and move to your Applications folder

## Limitations

- Currently supports single database connections at a time
- Limited to SQLite databases
- No query history feature yet
- Large result sets may impact performance
- Windows release needs more testing

## License

This project is licensed under the Mozilla Public License 2.0 (MPL-2.0) - see
the LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
