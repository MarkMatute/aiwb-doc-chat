import React, { forwardRef } from 'react'
import { Send } from 'lucide-react'

interface MessageInputProps {
  inputValue: string
  onInputChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  isConnected: boolean
}

const MessageInput = forwardRef<HTMLInputElement, MessageInputProps>(
  ({ inputValue, onInputChange, onSubmit, isConnected }, ref) => {
    return (
      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={onSubmit} className="flex gap-3">
          <input
            ref={ref}
            type="text"
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            disabled={!isConnected}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || !isConnected}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium transition-colors"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </form>
      </div>
    )
  }
)

MessageInput.displayName = 'MessageInput'

export default MessageInput