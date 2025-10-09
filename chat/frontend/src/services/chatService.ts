import type { Message, ConversationData, CustomerInfo } from '../types/chat';

// shape of message items sent by the server
type ServerMessageHistoryItem = {
  id: string;
  text?: string;
  content?: string;
  timestamp: string;
  [key: string]: unknown;
};

class ChatService {
  private listeners: ((message: Message) => void)[] = [];
  private connectionListeners: ((isConnected: boolean) => void)[] = [];
  private ws: WebSocket | null = null;
  private clientId: string | null = null;

  connect(customerId: string): Promise<ConversationData> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket('ws://localhost:3001');

        this.ws.onopen = () => {
          this.notifyConnectionChange(true);
        };

        this.ws.onmessage = (event: MessageEvent) => {
          try {
            const data = JSON.parse(event.data);

            switch (data.type) {
              case 'connection': {
                // server sends clientId, username and messageHistory
                this.clientId = data.clientId || null;

                const messages: Message[] = (data.messageHistory as ServerMessageHistoryItem[] || []).map((m) => ({
                  id: m.id,
                  sender: m.clientId && m.clientId === data.clientId ? 'owner' : 'customer',
                  content: m.text || m.content || '',
                  timestamp: new Date(m.timestamp),
                  isFromAI: false
                }));

                const conversation: ConversationData = {
                  customerId: customerId,
                  messages,
                  customerInfo: {
                    id: customerId,
                    name: data.username || 'Customer',
                    email: '',
                    company: '',
                    isLead: false,
                    conversationStartTime: new Date(),
                    lastActiveTime: new Date()
                  } as CustomerInfo
                };

                // reference clientId to avoid unused warning (future use)
                void this.clientId;
                resolve(conversation);
                break;
              }

              case 'message': {
                // ignore server echoes for our own clientId (we already optimistically displayed the message)
                if (data.clientId && data.clientId === this.clientId) {
                  break;
                }

                const mapped: Message = {
                  id: data.id,
                  sender: 'customer',
                  content: data.text || data.content || '',
                  timestamp: new Date(data.timestamp),
                  isFromAI: false
                };
                this.notifyNewMessage(mapped);
                break;
              }

              case 'userLeft': {
                const sys: Message = {
                  id: Date.now().toString(),
                  sender: 'customer',
                  content: `${data.username} left the chat`,
                  timestamp: new Date(data.timestamp || Date.now()),
                  isFromAI: false
                };
                this.notifyNewMessage(sys);
                break;
              }

              case 'usernameChanged': {
                const sys: Message = {
                  id: Date.now().toString(),
                  sender: 'customer',
                  content: `${data.oldUsername} changed their name to ${data.newUsername}`,
                  timestamp: new Date(data.timestamp || Date.now()),
                  isFromAI: false
                };
                this.notifyNewMessage(sys);
                break;
              }

              default:
                // ignore unknown types
                break;
            }
          } catch (err) {
            console.error('Error parsing WS message:', err);
          }
        };

        this.ws.onclose = () => {
          this.ws = null;
          this.notifyConnectionChange(false);
          // do not auto-reconnect here; caller can decide
        };

        this.ws.onerror = (err) => {
          console.error('WebSocket error', err);
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.notifyConnectionChange(false);
  }

  sendMessage(content: string): Promise<void> {
    return new Promise((resolve, reject) => {
  type OutgoingChatPayload = { type: 'chat'; text: string; clientId?: string };
  const msgPayload: OutgoingChatPayload = { type: 'chat', text: content };
  if (this.clientId) msgPayload.clientId = this.clientId;

      // optimistic local echo: owner message
      const localMsg: Message = {
        id: Date.now().toString(),
        sender: 'owner',
        content,
        timestamp: new Date(),
        isFromAI: false,
        // attach clientId so we can correlate server echoes (if any)
  clientId: this.clientId as unknown as string
      } as unknown as Message;
      this.notifyNewMessage(localMsg);

      try {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify(msgPayload));
          resolve();
        } else {
          // if not connected, still resolve (message echoed locally)
          resolve();
        }
      } catch (err) {
        reject(err);
      }
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