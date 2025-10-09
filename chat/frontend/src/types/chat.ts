export interface Message {
  id: string;
  sender: 'customer' | 'ai' | 'owner';
  content: string;
  timestamp: Date;
  isFromAI: boolean;
}

export interface CustomerInfo {
  id: string;
  name: string;
  email: string;
  company?: string;
  isLead: boolean;
  leadScore: number;
  conversationStartTime: Date;
  lastActiveTime: Date;
}

export interface ConversationData {
  customerId: string;
  messages: Message[];
  customerInfo: CustomerInfo;
}

export interface ChatState {
  messages: Message[];
  customerInfo: CustomerInfo | null;
  isConnected: boolean;
  isTyping: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
}