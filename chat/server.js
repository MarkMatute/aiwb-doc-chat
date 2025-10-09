const WebSocket = require('ws');
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'frontend/dist')));

// Create HTTP server
const server = require('http').createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Store connected clients
const clients = new Map();
let messageHistory = [];

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  console.log('New client connected');
  
  // Generate unique client ID
  const clientId = Math.random().toString(36).substr(2, 9);
  clients.set(clientId, {
    ws,
    id: clientId,
    username: `User${clientId.substr(0, 4)}`
  });

  // Send client their ID and username
  ws.send(JSON.stringify({
    type: 'connection',
    clientId,
    username: clients.get(clientId).username,
    messageHistory
  }));

  // Handle incoming messages
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      
      switch (message.type) {
        case 'chat':
          handleChatMessage(clientId, message);
          break;
        case 'username':
          handleUsernameChange(clientId, message.username);
          break;
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  // Handle client disconnect
  ws.on('close', () => {
    console.log(`Client ${clientId} disconnected`);
    clients.delete(clientId);
    
    // Notify other clients about the disconnect
    broadcast({
      type: 'userLeft',
      username: clients.get(clientId)?.username || 'Unknown',
      timestamp: new Date().toISOString()
    }, clientId);
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Handle chat messages
function handleChatMessage(clientId, message) {
  const client = clients.get(clientId);
  if (!client) return;

  const chatMessage = {
    id: Math.random().toString(36).substr(2, 9),
    username: client.username,
    text: message.text,
    timestamp: new Date().toISOString(),
    clientId
  };

  // Add to message history
  messageHistory.push(chatMessage);
  
  // Keep only last 100 messages
  if (messageHistory.length > 100) {
    messageHistory = messageHistory.slice(-100);
  }

  // Broadcast to all clients
  broadcast({
    type: 'message',
    ...chatMessage
  });
}

// Handle username changes
function handleUsernameChange(clientId, newUsername) {
  const client = clients.get(clientId);
  if (!client) return;

  const oldUsername = client.username;
  client.username = newUsername;

  // Notify all clients about username change
  broadcast({
    type: 'usernameChanged',
    oldUsername,
    newUsername,
    timestamp: new Date().toISOString()
  });
}

// Broadcast message to all connected clients
function broadcast(message, excludeClientId = null) {
  const messageStr = JSON.stringify(message);
  
  clients.forEach((client, clientId) => {
    if (clientId !== excludeClientId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(messageStr);
    }
  });
}

// API endpoint to get connected users
app.get('/api/users', (req, res) => {
  const users = Array.from(clients.values()).map(client => ({
    id: client.id,
    username: client.username
  }));
  res.json(users);
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist', 'index.html'));
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server ready`);
});
