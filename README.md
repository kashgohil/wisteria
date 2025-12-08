<div align="center">
  <img src="./src/app/wisteria.svg" alt="Wisteria Logo" width="120" height="120">
  
  # Wisteria
  
  **A modern AI chat workspace for seamless multi-model conversations**
  
  [![Next.js](https://img.shields.io/badge/Next.js-15.3-black?style=flat&logo=next.js)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
  [![Convex](https://img.shields.io/badge/Convex-Backend-orange?style=flat)](https://convex.dev/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
  
  [Features](#-features) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [Project Structure](#-project-structure)
</div>

---

## 🌸 Overview

Wisteria is an elegant AI chat application that brings together multiple AI
models in one unified interface. Built with modern web technologies, it offers a
seamless experience for managing conversations, organizing projects, and
leveraging the power of various AI models through OpenRouter.

### Why Wisteria?

- **🎯 Multi-Model Access**: Switch between GPT-4o, Claude, Gemini, Llama, and
  more
- **📁 Project Organization**: Group related chats with custom system prompts
- **💾 Persistent History**: All conversations saved and searchable
- **🔐 Secure Authentication**: User isolation with Clerk
- **✨ Beautiful UI**: Modern, responsive design with dark theme
- **⚡ Real-time Streaming**: Fast, streaming responses powered by Vercel AI SDK

---

## ✨ Features

### 🤖 Multi-Model Support

- Access 20+ AI models via OpenRouter integration
- Switch models mid-conversation
- Automatic title generation for new chats
- Support for reasoning models with thinking blocks

### 📂 Project-Based Organization

- Create projects with custom system prompts
- Organize chats by project or keep them standalone
- Move chats between projects
- Per-project context management

### 💬 Rich Chat Experience

- **Streaming responses** with real-time updates
- **Markdown rendering** with GitHub-flavored markdown support
- **Syntax highlighting** for code blocks with copy functionality
- **Message persistence** with Convex database
- **Auto-generated chat titles** using AI

### 🎨 Modern Interface

- Clean, minimalist design with Wisteria purple accent
- Responsive sidebar with collapsible navigation
- Keyboard shortcuts for quick actions
- Dark theme optimized for extended use
- Smooth animations and transitions

### 🔒 Authentication & Security

- Secure authentication via Clerk
- Per-user data isolation
- Anonymous mode support for unauthenticated users
- JWT-based API security

---

## 🛠️ Tech Stack

### Frontend

- **[Next.js 15.3](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://react.dev/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first styling
- **[shadcn/ui](https://ui.shadcn.com/)** - Beautiful component library
- **[Lucide React](https://lucide.dev/)** - Icon system

### Backend & Database

- **[Convex](https://convex.dev/)** - Real-time backend and database
- **[Clerk](https://clerk.com/)** - Authentication and user management

### AI & Streaming

- **[Vercel AI SDK](https://sdk.vercel.ai/)** - AI streaming and chat utilities
- **[OpenRouter](https://openrouter.ai/)** - Multi-model AI gateway

### Additional Libraries

- **[React Markdown](https://github.com/remarkjs/react-markdown)** - Markdown
  rendering
- **[Rehype Highlight](https://github.com/rehypejs/rehype-highlight)** - Code
  syntax highlighting
- **[TanStack Query](https://tanstack.com/query)** - Data fetching and caching
- **[Sonner](https://sonner.emilkowal.ski/)** - Toast notifications

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ or Bun
- OpenRouter API key
- Clerk account
- Convex account

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/wisteria.git
   cd wisteria
   ```

2. **Install dependencies**

   ```bash
   bun install
   # or
   npm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file:

   ```env
   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key

   # Convex
   NEXT_PUBLIC_CONVEX_URL=your_convex_url
   CONVEX_DEPLOYMENT=your_convex_deployment

   # OpenRouter
   OPENROUTER_API_KEY=your_openrouter_api_key
   ```

4. **Configure Convex**

   Set up Clerk JWT in Convex Dashboard:
   - Go to your Convex Dashboard → Settings → Environment Variables
   - Add: `CLERK_JWT_ISSUER_DOMAIN` = your Clerk issuer domain
   - Find your domain in Clerk Dashboard → Configure → JWT Templates

5. **Run the development server**

   ```bash
   bun run dev
   # or
   npm run dev
   ```

6. **Open your browser**

   Navigate to [http://localhost:3004](http://localhost:3004)

---

## 📁 Project Structure

```
wisteria/
├── convex/                 # Convex backend
│   ├── chats.ts           # Chat CRUD operations
│   ├── messages.ts        # Message management
│   ├── projects.ts        # Project organization
│   ├── schema.ts          # Database schema
│   └── auth.config.ts     # Authentication config
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── api/
│   │   │   └── chat/      # Chat API endpoint
│   │   ├── chat/          # Chat pages
│   │   └── project/       # Project pages
│   ├── components/
│   │   ├── chat/          # Chat-specific components
│   │   ├── providers/     # React context providers
│   │   └── ui/            # shadcn/ui components
│   ├── hooks/             # Custom React hooks
│   └── lib/               # Utilities
└── package.json
```

### Key Components

- **`ChatProvider`**: Manages chat state, messages, and streaming
- **`ChatPage`**: Main chat interface with message display
- **`AppSidebar`**: Navigation with chat history and projects
- **`ModelSelector`**: AI model selection dropdown
- **`ThinkingBlock`**: Displays reasoning for compatible models

---

## 🎯 Usage

### Creating a New Chat

1. Click the "New Chat" button in the sidebar
2. Start typing your message
3. Select an AI model from the dropdown
4. Press Enter or click Send

### Organizing with Projects

1. Create a new project from the sidebar
2. Add a name, description, and optional system prompt
3. Create chats within the project or move existing chats
4. All chats in a project share the same system prompt

### Managing Chats

- **Rename**: Click on a chat title to edit
- **Delete**: Use the delete button in chat options
- **Move**: Drag and drop chats between projects

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📝 License

This project is open source and available under the MIT License.

---

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- AI powered by [OpenRouter](https://openrouter.ai/)
- Backend by [Convex](https://convex.dev/)

---

<div align="center">
  Made with 💜 by the Wisteria team
</div>
