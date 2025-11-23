# Wisteria

Wisteria is a modern AI chat workspace built with Next.js. It lets you:

- **Chat with multiple AI models** via OpenRouter (Llama, Gemini, GPT‑4o,
  Claude, etc.).
- **Organize conversations into projects** with custom system prompts.
- **Persist chats and messages** in a database for later review.
- **Authenticate securely** using Clerk.
- **Enjoy a clean, focused UI** with a side navigation for history and projects.

> Status: Early-stage, experimental AI assistant interface.

## Features

- **Multi-model support**

  - Select from a list of models (Llama, Gemini, GPT‑4o, Claude and more).
  - Easily switch between models per chat.

- **Project-based organization**

  - Create projects with name, description, and system prompt.
  - Attach chats to projects to keep context and experiments grouped.

- **Chat history & management**

  - View your recent chats in the sidebar.
  - Rename (auto-named) chats and delete chats you no longer need.
  - Move chats between projects.

- **Rich chat experience**

  - Streaming responses with the `ai` SDK.
  - Markdown rendering with code blocks.
  - Syntax highlighting for code snippets.

- **Authentication**

  - User accounts and sessions handled via Clerk.
  - Per-user isolation of projects and chats.

- **Modern UI**
  - Clean dark theme with Wisteria branding.
  - Responsive layout suitable for desktop.
  - Keyboard-friendly form and buttons.
