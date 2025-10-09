import type { CustomerInfo } from '../types/chat'

interface CustomerPanelProps {
  customerInfo: CustomerInfo | null
  isConnected: boolean
}

export default function CustomerPanel({ customerInfo, isConnected }: CustomerPanelProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <div className="w-80 bg-white shadow-xl border-r border-gray-100">
      <div className="p-6">
        {/* Connection Status */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className={`text-sm font-medium ${isConnected ? 'text-green-700' : 'text-red-700'}`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {customerInfo && (
          <div className="space-y-6">
            {/* Customer Header */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-3">
                {customerInfo.name.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-xl font-bold text-gray-900">{customerInfo.name}</h2>
              <p className="text-gray-600 text-sm">{customerInfo.email}</p>
            </div>

            {/* Lead Status */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  customerInfo.isLead 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-400 text-white'
                }`}>
                  {customerInfo.isLead ? '🎯 High Quality Lead' : '👤 Prospect'}
                </span>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{customerInfo.leadScore}%</div>
                <div className="text-xs text-gray-600">Lead Score</div>
              </div>
            </div>

            {/* Company Info */}
            {customerInfo.company && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Company</h3>
                <p className="text-gray-900">{customerInfo.company}</p>
              </div>
            )}

            {/* Session Details */}
            <div className="space-y-3">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Conversation Started</div>
                <div className="text-sm font-medium text-gray-900">
                  {formatTime(customerInfo.conversationStartTime)}
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Last Active</div>
                <div className="text-sm font-medium text-gray-900">
                  {formatTime(customerInfo.lastActiveTime)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}