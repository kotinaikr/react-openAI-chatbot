import React, { useState } from 'react'
import { LuBot, LuSendHorizontal } from 'react-icons/lu'
import useChatbot from '../hooks/useChatbot'

const chatComponent: React.FunctionComponent = () => {
  const [input, setInput] = useState('')
  const { messages, sendMessage, isLoading } = useChatbot()

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      sendMessage(input.trim())
      setInput('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-[80vh] bg-white">
      <h1 className="p-4 font-semibold text-lg text-center bg-blue-100 flex text-blue-800 justify-center items-center gap-2 shrink-0">
        React + OpenAI Chatbot <LuBot size={25} />
      </h1>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 min-h-0">
        {messages.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">
            Start a conversation…
          </p>
        ) : (
          messages.map((msg, index) => (
            <div
              key={`${msg.sender}-${index}-${msg.text.slice(0, 20)}`}
              className={`p-3 rounded-lg max-w-[85%] whitespace-pre-wrap break-words ${
                msg.sender === 'user'
                  ? 'bg-blue-500 text-white self-end'
                  : 'bg-gray-200 text-gray-800 self-start'
              }`}
            >
              {msg.text}
            </div>
          ))
        )}
        {isLoading ? (
          <p className="text-gray-400 text-sm self-start">Thinking…</p>
        ) : null}
      </div>

      <div className="flex items-center gap-2 p-4 bg-gray-50 shrink-0 border-t border-gray-100">
        <input
          type="text"
          placeholder="Type your message here..."
          className="flex-1 p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-60"
          value={input}
          disabled={isLoading}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          className="bg-blue-500 text-white p-2 rounded-lg disabled:opacity-50 shrink-0"
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
        >
          <LuSendHorizontal size={25} />
        </button>
      </div>
    </div>
  )
}

export default chatComponent
