# Simple Chat App

A real-time chat application built with Node.js WebSockets and React.

## Features

- Real-time messaging using WebSockets
- Modern, responsive UI with beautiful gradients
- Username customization
- Message history
- Connection status indicator
- Auto-reconnection
- System notifications for user actions

## Prerequisites

- Node.js (v14 or higher)
- npm

## Installation

1. Install server dependencies:
```bash
npm install
```

2. Install client dependencies:
```bash
cd client
npm install
cd ..
```

## Running the Application

### Development Mode

Run both server and client concurrently:
```bash
npm run dev
```

This will start:
- WebSocket server on port 3001
- React development server on port 3000

### Production Mode

1. Build the React app:
```bash
npm run build
```

2. Start the server:
```bash
npm start
```

The server will serve the built React app and handle WebSocket connections on port 3001.

## Usage

1. Open your browser and navigate to `http://localhost:3000`
2. Enter your username when prompted
3. Start chatting!

## Project Structure

```
hk/
├── server.js          # WebSocket server
├── package.json        # Server dependencies
├── client/             # React application
│   ├── src/
│   │   ├── App.js      # Main React component
│   │   ├── App.css     # Styling
│   │   └── index.js    # React entry point
│   └── package.json    # Client dependencies
└── README.md
```

## Technologies Used

- **Backend**: Node.js, Express, WebSocket (ws library)
- **Frontend**: React, CSS3
- **Real-time Communication**: WebSockets
- **Styling**: Modern CSS with gradients and animations

## API Endpoints

- `GET /api/users` - Get list of connected users
- `WebSocket ws://localhost:3001` - Real-time messaging

## WebSocket Message Types

- `connection` - Initial connection with client ID and message history
- `chat` - Chat message from client
- `username` - Username change request
- `message` - Broadcast chat message to all clients
- `userLeft` - Notification when user disconnects
- `usernameChanged` - Notification when user changes username
