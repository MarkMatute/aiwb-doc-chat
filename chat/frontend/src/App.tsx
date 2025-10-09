import { useState, useEffect, useRef } from 'react'
import type { Message, CustomerInfo } from './types/chat'
import chatService from './services/chatService'
import LoadingScreen from './components/LoadingScreen'
import CustomerPanel from './components/CustomerPanel'
import MessageBubble from './components/MessageBubble'
import MessageInput from './components/MessageInput'
import ChatHeader from './components/ChatHeader'

export default function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const initChat = async () => {
      try {
        const conversationData = await chatService.connect('customer_123')
        setMessages(conversationData.messages)
        setCustomerInfo(conversationData.customerInfo)
        setIsLoading(false)
      } catch (error) {
        console.error('Failed to connect:', error)
        setIsLoading(false)
      }
    }

    initChat()

    const unsubscribeMessage = chatService.onMessage((message: Message) => {
      setMessages(prev => [...prev, message])
    })

    const unsubscribeConnection = chatService.onConnectionChange((connected: boolean) => {
      setIsConnected(connected)
    })

    return () => {
      unsubscribeMessage()
      unsubscribeConnection()
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!inputValue.trim()) return

    try {
      await chatService.sendMessage(inputValue)
      setInputValue('')
      inputRef.current?.focus()
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-100 font-sans">
      {/* Customer Info Panel (component) */}
      <CustomerPanel customerInfo={customerInfo} isConnected={isConnected} />

      {/* Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'white' }}>
        {/* Chat Header (hidden on mobile, visible on md+) */}
        <div className="hidden md:block">
          <ChatHeader customerInfo={customerInfo} />
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', backgroundColor: '#fafafa' }}>
          {messages.map(m => (
            <div key={m.id}>
              <MessageBubble message={m} formatTime={formatTime} />
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>

        {/* Message Input (component) */}
        <MessageInput
          ref={inputRef}
          inputValue={inputValue}
          onInputChange={(v) => setInputValue(v)}
          onSubmit={handleSendMessage}
          isConnected={isConnected}
        />
      </div>

      {/* Keyframes are defined in src/index.css */}
    </div>
  )
}
