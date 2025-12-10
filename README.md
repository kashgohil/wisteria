# Wisteria 🌸

A modern, privacy-focused desktop application for interacting with any LLM of
your choice. Built with Electron, React, and TypeScript, Wisteria gives you
complete control over your AI conversations with support for multiple providers
and BYOK (Bring Your Own Key).

## Screenshots

### Light Mode

![Wisteria Light Mode](public/screenshot-light.png)

### Dark Mode

![Wisteria Dark Mode](public/screenshot-dark.png)

## Features

- **Multi-Provider Support**: Connect to OpenAI, Anthropic, Google, Groq, and
  more
- **Bring Your Own Key**: Use your own API keys for complete control and privacy
- **Local-First**: All conversations and data stored locally using SQLite
- **Project Organization**: Organize your chats into projects for better
  workflow management
- **Modern UI**: Beautiful, responsive interface built with React and Tailwind
  CSS
- **Markdown Support**: Rich text rendering with syntax highlighting for code
  blocks
- **Cross-Platform**: Available for macOS, Windows, and Linux

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Desktop**: Electron
- **Styling**: Tailwind CSS 4 + shadcn/ui components
- **Database**: better-sqlite3 for local data persistence
- **Markdown**: react-markdown with GitHub Flavored Markdown support
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- npm, yarn, or bun package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/wisteria.git
cd wisteria

# Install dependencies
npm install
# or
bun install

# Run in development mode
npm run dev
# or
bun run dev
```

### Building

To create a standalone executable application that can be distributed and
installed:

```bash
# Build for production
npm run build
# or
bun run build
```

This command will:

1. Compile TypeScript and bundle the React application
2. Package everything with Electron
3. Create platform-specific installers/executables

**Output locations:**

The build artifacts will be created in the `dist` directory:

- **macOS**: `dist/Wisteria-{version}.dmg` - Drag-and-drop installer
- **Windows**: `dist/Wisteria Setup {version}.exe` - Standard Windows installer
- **Linux**: `dist/Wisteria-{version}.AppImage` - Portable executable

**Platform-specific builds:**

By default, the build command creates executables for your current platform. To
build for specific platforms:

```bash
# Build for macOS only
npm run build -- --mac

# Build for Windows only
npm run build -- --win

# Build for Linux only
npm run build -- --linux

# Build for all platforms (requires platform-specific dependencies)
npm run build -- --mac --win --linux
```

**Installing the executable:**

- **macOS**: Open the `.dmg` file and drag Wisteria to your Applications folder
- **Windows**: Run the `.exe` installer and follow the installation wizard
- **Linux**: Make the `.AppImage` executable (`chmod +x Wisteria-*.AppImage`)
  and run it

**Note**: Cross-platform builds may require additional setup. For example,
building Windows executables on macOS requires Wine.

## Usage

1. **Add API Keys**: Open Settings and add your API keys for the providers you
   want to use
2. **Create a Project**: Organize your work by creating projects (optional)
3. **Start Chatting**: Select a model and provider, then start your conversation
4. **Manage Chats**: All your conversations are saved locally and organized by
   project

## Database

Wisteria stores all data locally in a SQLite database located at:

- **macOS**: `~/Library/Application Support/Wisteria/wisteria.db`
- **Windows**: `%APPDATA%/Wisteria/wisteria.db`
- **Linux**: `~/.config/Wisteria/wisteria.db`

You can access the database directly using:

```bash
npm run db
```

## Future Plans

### 🚀 Upcoming Features

#### Model Context Protocol (MCP) Support

- Integration with MCP servers for extended capabilities
- Support for custom tools and resources
- Enhanced context management across conversations

#### Terminal Access

- Built-in terminal for executing commands
- Integration with chat interface for AI-assisted command execution
- Support for multiple shell environments

#### Code Execution Sandbox

- Safe, isolated environment for running code snippets
- Support for multiple programming languages
- Real-time execution results within chat interface
- Integration with AI for debugging and code assistance

### Other Planned Enhancements

- **Multi-modal Support**: Image and file uploads
- **Custom Prompts**: Save and reuse prompt templates
- **Export/Import**: Backup and share conversations
- **Themes**: Additional theme options and customization
- **Plugins**: Extensible plugin system for community contributions

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file
for details.

## Author

**Kash Gohil**

---
