import { User, Bot, CheckCircle } from 'lucide-react'
import type { Message } from '../types/chat'

interface MessageBubbleProps {
  message: Message
  formatTime: (date: Date) => string
}

export default function MessageBubble({ message, formatTime }: MessageBubbleProps) {
  const getMessageIcon = (sender: string, isFromAI: boolean) => {
    if (sender === 'customer') {
      return <User className="w-4 h-4" />
    } else if (isFromAI) {
      return <Bot className="w-4 h-4" />
    } else {
      return <CheckCircle className="w-4 h-4" />
    }
  }

  const isOwner = message.sender === 'owner'

  return (
    <div className={`flex gap-3 ${isOwner ? 'flex-row-reverse' : 'flex-row'} mb-4`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isOwner
          ? 'bg-blue-500 text-white'
          : message.isFromAI
          ? 'bg-purple-500 text-white'
          : 'bg-gray-500 text-white'
      }`}>
        {getMessageIcon(message.sender, message.isFromAI)}
      </div>

      {/* Message Content */}
      <div className={`max-w-xs lg:max-w-md ${isOwner ? 'text-right' : 'text-left'}`}>
        <div className={`inline-block px-4 py-2 rounded-lg ${
          isOwner
            ? 'bg-blue-500 text-white'
            : message.isFromAI
            ? 'bg-purple-50 text-purple-900 border border-purple-200'
            : 'bg-gray-100 text-gray-900'
        }`}>
          <p className="text-sm leading-relaxed">{message.content}</p>
        </div>
        
        {/* Timestamp and metadata */}
        <div className={`mt-1 text-xs text-gray-500 flex items-center gap-1 ${
          isOwner ? 'justify-end' : 'justify-start'
        }`}>
          <span>{formatTime(message.timestamp)}</span>
          {message.isFromAI && !isOwner && (
            <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
              AI
            </span>
          )}
        </div>
      </div>
    </div>
  )
}