import type { CustomerInfo } from '../types/chat'

interface ChatHeaderProps {
  customerInfo: CustomerInfo | null
}

export default function ChatHeader({ customerInfo }: ChatHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Chat with {customerInfo?.name || 'Customer'}
          </h1>
          <p className="text-sm text-gray-500">
            Seamless handoff from AI assistant
          </p>
        </div>
        {customerInfo && (
          <div className="text-right">
            <div className="text-xs text-gray-500">Lead Score</div>
            <div className="text-lg font-bold text-blue-600">{customerInfo.leadScore}%</div>
          </div>
        )}
      </div>
    </div>
  )
}