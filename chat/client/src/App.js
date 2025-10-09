import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [username, setUsername] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [clientId, setClientId] = useState('');
  const [currentUsername, setCurrentUsername] = useState('');
  const [showUsernameModal, setShowUsernameModal] = useState(true);
  
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // WebSocket connection
  useEffect(() => {
    const connectWebSocket = () => {
      const ws = new WebSocket('ws://localhost:3001');
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Connected to WebSocket');
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'connection':
            setClientId(data.clientId);
            setCurrentUsername(data.username);
            setMessages(data.messageHistory || []);
            break;
          case 'message':
            setMessages(prev => [...prev, data]);
            break;
          case 'userLeft':
            setMessages(prev => [...prev, {
              id: Math.random().toString(36).substr(2, 9),
              type: 'system',
              text: `${data.username} left the chat`,
              timestamp: data.timestamp
            }]);
            break;
          case 'usernameChanged':
            setMessages(prev => [...prev, {
              id: Math.random().toString(36).substr(2, 9),
              type: 'system',
              text: `${data.oldUsername} changed their name to ${data.newUsername}`,
              timestamp: data.timestamp
            }]);
            break;
        }
      };

      ws.onclose = () => {
        console.log('Disconnected from WebSocket');
        setIsConnected(false);
        // Attempt to reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const sendMessage = () => {
    if (inputMessage.trim() && wsRef.current && isConnected) {
      wsRef.current.send(JSON.stringify({
        type: 'chat',
        text: inputMessage.trim()
      }));
      setInputMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  const updateUsername = () => {
    if (username.trim() && wsRef.current && isConnected) {
      wsRef.current.send(JSON.stringify({
        type: 'username',
        username: username.trim()
      }));
      setCurrentUsername(username.trim());
      setShowUsernameModal(false);
      setUsername('');
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="App">
      <div className="chat-container">
        <div className="chat-header">
          <h1>💬 Simple Chat</h1>
          <div className="connection-status">
            <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}></span>
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>

        <div className="messages-container">
          {messages.map((message) => (
            <div key={message.id} className={`message ${message.type === 'system' ? 'system-message' : ''}`}>
              {message.type !== 'system' && (
                <div className="message-header">
                  <span className="username">{message.username}</span>
                  <span className="timestamp">{formatTime(message.timestamp)}</span>
                </div>
              )}
              <div className="message-content">{message.text}</div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-container">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={!isConnected}
          />
          <button onClick={sendMessage} disabled={!isConnected || !inputMessage.trim()}>
            Send
          </button>
        </div>
      </div>

      {showUsernameModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Welcome to Chat!</h2>
            <p>Enter your username to start chatting:</p>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && updateUsername()}
              placeholder="Your username"
              maxLength={20}
            />
            <button onClick={updateUsername} disabled={!username.trim()}>
              Join Chat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;