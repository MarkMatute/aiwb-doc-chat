import { useState, useEffect, useRef } from 'react'
import type { Message, CustomerInfo } from './types/chat'
import chatService from './services/chatService'

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
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid #e2e8f0',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#334155', margin: '0 0 8px' }}>
            Connecting to Customer
          </h3>
          <p style={{ color: '#64748b', margin: 0 }}>Preparing seamless handoff from AI...</p>
        </div>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      backgroundColor: '#f1f5f9',
      fontFamily: 'system-ui, sans-serif'
    }}>
      {/* Customer Info Panel */}
      <div style={{
        width: '320px',
        backgroundColor: 'white',
        borderRight: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        padding: '24px'
      }}>
        {/* Connection Status */}
        <div style={{
          marginBottom: '24px',
          padding: '16px',
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: isConnected ? '#10b981' : '#ef4444',
              animation: isConnected ? 'pulse 2s infinite' : 'none'
            }}></div>
            <span style={{
              fontSize: '14px',
              fontWeight: '500',
              color: isConnected ? '#059669' : '#dc2626'
            }}>
              {isConnected ? 'Live Connection' : 'Disconnected'}
            </span>
          </div>
        </div>

        {customerInfo && (
          <div>
            {/* Customer Header */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                backgroundColor: '#3b82f6',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '24px',
                fontWeight: 'bold',
                margin: '0 auto 12px'
              }}>
                {customerInfo.name.charAt(0).toUpperCase()}
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', margin: '0 0 4px' }}>
                {customerInfo.name}
              </h2>
              <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
                {customerInfo.email}
              </p>
            </div>

            {/* Lead Status */}
            <div style={{
              background: 'linear-gradient(to right, #dbeafe, #e0e7ff)',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #bfdbfe',
              marginBottom: '24px'
            }}>
              <div style={{ marginBottom: '8px' }}>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: '600',
                  backgroundColor: customerInfo.isLead ? '#10b981' : '#6b7280',
                  color: 'white'
                }}>
                  {customerInfo.isLead ? '🎯 High Quality Lead' : '👤 Prospect'}
                </span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2563eb' }}>
                  {customerInfo.leadScore}%
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>Lead Score</div>
              </div>
            </div>

            {/* Company Info */}
            {customerInfo.company && (
              <div style={{
                backgroundColor: '#f8fafc',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '16px'
              }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', margin: '0 0 8px' }}>
                  Company
                </h3>
                <p style={{ color: '#1f2937', margin: 0 }}>{customerInfo.company}</p>
              </div>
            )}

            {/* Session Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{
                backgroundColor: '#f8fafc',
                padding: '12px',
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                  Conversation Started
                </div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>
                  {formatTime(customerInfo.conversationStartTime)}
                </div>
              </div>
              <div style={{
                backgroundColor: '#f8fafc',
                padding: '12px',
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                  Last Active
                </div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>
                  {formatTime(customerInfo.lastActiveTime)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'white' }}>
        {/* Chat Header */}
        <div style={{
          backgroundColor: 'white',
          borderBottom: '1px solid #e2e8f0',
          padding: '16px 24px',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', margin: '0 0 4px' }}>
                Chat with {customerInfo?.name || 'Customer'}
              </h1>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                Seamless handoff from AI assistant
              </p>
            </div>
            {customerInfo && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>Lead Score</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2563eb' }}>
                  {customerInfo.leadScore}%
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
          backgroundColor: '#fafafa'
        }}>
          {messages.map((message) => {
            const isOwner = message.sender === 'owner'
            return (
              <div
                key={message.id}
                style={{
                  display: 'flex',
                  gap: '12px',
                  marginBottom: '16px',
                  flexDirection: isOwner ? 'row-reverse' : 'row'
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  color: 'white',
                  flexShrink: 0,
                  backgroundColor: isOwner
                    ? '#3b82f6'
                    : message.isFromAI
                    ? '#8b5cf6'
                    : '#6b7280'
                }}>
                  {isOwner ? '👤' : message.isFromAI ? '🤖' : '👤'}
                </div>

                {/* Message Content */}
                <div style={{ maxWidth: '400px' }}>
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    backgroundColor: isOwner
                      ? '#3b82f6'
                      : message.isFromAI
                      ? '#f3f4f6'
                      : '#e5e7eb',
                    color: isOwner ? 'white' : '#1f2937',
                    border: message.isFromAI && !isOwner ? '1px solid #d1d5db' : 'none'
                  }}>
                    <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5' }}>
                      {message.content}
                    </p>
                  </div>
                  
                  {/* Timestamp */}
                  <div style={{
                    marginTop: '4px',
                    fontSize: '12px',
                    color: '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    justifyContent: isOwner ? 'flex-end' : 'flex-start'
                  }}>
                    <span>{formatTime(message.timestamp)}</span>
                    {message.isFromAI && !isOwner && (
                      <span style={{
                        backgroundColor: '#ede9fe',
                        color: '#7c3aed',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '500'
                      }}>
                        AI
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div style={{
          backgroundColor: 'white',
          borderTop: '1px solid #e2e8f0',
          padding: '24px'
        }}>
          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '12px' }}>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your message..."
              disabled={!isConnected}
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: isConnected ? 'white' : '#f9fafb'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6'
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db'
                e.target.style.boxShadow = 'none'
              }}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || !isConnected}
              style={{
                padding: '12px 24px',
                backgroundColor: (!inputValue.trim() || !isConnected) ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: (!inputValue.trim() || !isConnected) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                if (inputValue.trim() && isConnected) {
                  e.currentTarget.style.backgroundColor = '#2563eb'
                }
              }}
              onMouseLeave={(e) => {
                if (inputValue.trim() && isConnected) {
                  e.currentTarget.style.backgroundColor = '#3b82f6'
                }
              }}
            >
              <span>📤</span>
              Send
            </button>
          </form>
        </div>
      </div>

      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          @keyframes bounce {
            0%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-10px); }
          }
        `}
      </style>
    </div>
  )
}
