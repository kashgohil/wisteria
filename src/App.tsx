import { useMemo, useRef, useState } from 'react'
import './App.css'

type Message = {
  id: string
  role: 'user' | 'assistant'
  text: string
  timestamp: number
}

function App() {
  const initialMessages = useMemo<Message[]>(
    () => [
      {
        id: 'welcome',
        role: 'assistant',
        text: "Hi! I'm a local, offline chat. No network, no database—just running inside Electron.",
        timestamp: Date.now(),
      },
    ],
    [],
  )

  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)

  const sendMessage = () => {
    const text = input.trim()
    if (!text) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsThinking(true)

    // Simulate an offline assistant response
    setTimeout(() => {
      const response: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: `Local assistant here. You said: "${text}". (All offline)`,
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, response])
      setIsThinking(false)
    }, 650)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <div className="eyebrow">Offline demo</div>
          <h1>Electron Local Chat</h1>
          <p className="subtitle">Runs entirely on your machine. No auth. No DB.</p>
        </div>
        <div className="status">{isThinking ? 'Thinking…' : 'Ready'}</div>
      </header>

      <main className="chat-panel">
        <div className="messages" aria-live="polite">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`message ${msg.role === 'assistant' ? 'assistant' : 'user'}`}
            >
              <div className="meta">
                <span className="role">{msg.role === 'assistant' ? 'Assistant' : 'You'}</span>
                <span className="time">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="bubble">{msg.text}</div>
            </div>
          ))}
        </div>

        <div className="composer">
          <label htmlFor="chat-input" className="sr-only">
            Chat input
          </label>
          <textarea
            id="chat-input"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message and hit Enter…"
            rows={3}
          />
          <div className="actions">
            <button onClick={sendMessage} disabled={!input.trim() || isThinking}>
              {isThinking ? 'Working…' : 'Send'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
