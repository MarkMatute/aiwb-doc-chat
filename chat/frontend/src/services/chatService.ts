import type { Message, ConversationData, CustomerInfo } from '../types/chat';

class ChatService {
  private listeners: ((message: Message) => void)[] = [];
  private connectionListeners: ((isConnected: boolean) => void)[] = [];

  connect(customerId: string): Promise<ConversationData> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.notifyConnectionChange(true);
        resolve({
          customerId: customerId,
          messages: [],
          customerInfo: {
            id: customerId,
            name: 'Unknown Customer',
            email: '',
            company: '',
            isLead: false,
            leadScore: 0,
            conversationStartTime: new Date(),
            lastActiveTime: new Date(),
          } as CustomerInfo
        });
      }, 1000);
    });
  }

  disconnect(): void {
    this.notifyConnectionChange(false);
  }

  sendMessage(content: string): Promise<void> {
    return new Promise((resolve) => {
      const message: Message = {
        id: Date.now().toString(),
        sender: 'owner',
        content: content,
        timestamp: new Date(),
        isFromAI: false
      };

      setTimeout(() => {
        this.notifyNewMessage(message);
        resolve();
      }, 500);
    });
  }

  onMessage(callback: (message: Message) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  onConnectionChange(callback: (isConnected: boolean) => void): () => void {
    this.connectionListeners.push(callback);
    return () => {
      this.connectionListeners = this.connectionListeners.filter(l => l !== callback);
    };
  }

  private notifyNewMessage(message: Message): void {
    this.listeners.forEach(listener => listener(message));
  }

  private notifyConnectionChange(isConnected: boolean): void {
    this.connectionListeners.forEach(listener => listener(isConnected));
  }
}

export default new ChatService();