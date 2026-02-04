require('dotenv').config();
const http = require('http');
const { WebSocketServer } = require('ws');
const NLPProcessor = require('./nlp-processor');

const BOT_NAME = process.env.BOT_NAME || 'EXPLORABOT';
const BOT_PORT = process.env.PORT || process.env.BOT_PORT || 8080;

console.log(`🤖 ${BOT_NAME} - AI Assistant Bot`);
console.log(`📦 Version: ${require('../package.json').version}`);
console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🚀 Starting bot on port ${BOT_PORT}...`);

// Initialize NLP processor
const nlp = new NLPProcessor();

// CORS headers for cross-origin requests (needed for Railway and other cloud platforms)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// HTTP server with chat UI
const server = http.createServer((req, res) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders);
    res.end();
    return;
  }

  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
    res.end(JSON.stringify({ 
      status: 'healthy', 
      bot: BOT_NAME,
      timestamp: new Date().toISOString()
    }));
  } else if (req.url === '/api/chat' && req.method === 'POST') {
    // Handle REST API chat requests
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { message } = JSON.parse(body);
        const response = nlp.process(message);
        res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
        res.end(JSON.stringify({ response }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json', ...corsHeaders });
        res.end(JSON.stringify({ error: 'Invalid request' }));
      }
    });
  } else if (req.url === '/demo') {
    // Serve the demo page
    const fs = require('fs');
    const path = require('path');
    const demoPath = path.join(__dirname, '..', 'demo.html');
    fs.readFile(demoPath, 'utf8', (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Demo page not found');
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data);
      }
    });
  } else if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(getChatUI());
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

// WebSocket server for real-time chat
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('👤 New client connected');
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'message',
    content: nlp.getDefaultResponse(),
    timestamp: new Date().toISOString(),
  }));

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      console.log(`📨 Received: ${message.content}`);
      
      // Process with NLP
      const response = nlp.process(message.content);
      
      // Send response
      ws.send(JSON.stringify({
        type: 'message',
        content: response,
        timestamp: new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Error processing message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        content: 'Sorry, I had trouble understanding that. Could you rephrase?',
      }));
    }
  });

  ws.on('close', () => {
    console.log('👋 Client disconnected');
  });
});

// Bind to 0.0.0.0 to accept connections from all network interfaces
// This is required for Railway and other container platforms
const HOST = '0.0.0.0';

server.listen(BOT_PORT, HOST, () => {
  console.log(`✅ Bot server is running on port ${BOT_PORT} (accepting connections on all interfaces)`);
  console.log(`📡 Health check: http://localhost:${BOT_PORT}/health`);
  console.log(`💬 Chat interface: http://localhost:${BOT_PORT}/`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 Received SIGTERM, shutting down gracefully...');
  wss.close();
  server.close(() => {
    console.log('👋 Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('📴 Received SIGINT, shutting down gracefully...');
  wss.close();
  server.close(() => {
    console.log('👋 Server closed');
    process.exit(0);
  });
});

/**
 * Generate modern chat UI
 */
function getChatUI() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="theme-color" content="#0066cc">
  <title>${BOT_NAME} - AI Assistant</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    :root {
      --primary: #0066cc;
      --primary-dark: #0052a3;
      --secondary: #00d9ff;
      --background: #000000;
      --surface: #121212;
      --surface-elevated: #1e1e1e;
      --text-primary: #ffffff;
      --text-secondary: #b0b0b0;
      --success: #28a745;
      --error: #dc3545;
      --border: #333;
      --shadow: rgba(0, 0, 0, 0.3);
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: var(--background);
      color: var(--text-primary);
      height: 100vh;
      overflow: hidden;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    .app-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      max-width: 100vw;
      margin: 0 auto;
    }

    /* Header */
    .header {
      background: var(--surface-elevated);
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 10;
      box-shadow: 0 2px 8px var(--shadow);
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .bot-avatar {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }

    .bot-info h1 {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 2px;
    }

    .bot-status {
      font-size: 12px;
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      background: var(--success);
      border-radius: 50%;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    /* Chat Container */
    .chat-container {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      scroll-behavior: smooth;
    }

    .chat-container::-webkit-scrollbar {
      width: 8px;
    }

    .chat-container::-webkit-scrollbar-track {
      background: var(--surface);
    }

    .chat-container::-webkit-scrollbar-thumb {
      background: var(--border);
      border-radius: 4px;
    }

    /* Messages */
    .message {
      display: flex;
      gap: 12px;
      animation: slideIn 0.3s ease-out;
      max-width: 85%;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .message.user {
      align-self: flex-end;
      flex-direction: row-reverse;
    }

    .message-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
    }

    .message.bot .message-avatar {
      background: linear-gradient(135deg, var(--primary), var(--secondary));
    }

    .message.user .message-avatar {
      background: var(--surface-elevated);
      border: 2px solid var(--border);
    }

    .message-content {
      background: var(--surface-elevated);
      padding: 12px 16px;
      border-radius: 18px;
      line-height: 1.5;
      word-wrap: break-word;
    }

    .message.user .message-content {
      background: var(--primary);
      border-radius: 18px 18px 4px 18px;
    }

    .message.bot .message-content {
      border-radius: 18px 18px 18px 4px;
    }

    .message-content pre {
      background: var(--background);
      padding: 12px;
      border-radius: 8px;
      overflow-x: auto;
      margin: 8px 0;
      border: 1px solid var(--border);
    }

    .message-content code {
      background: var(--background);
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 13px;
    }

    .message-content pre code {
      background: none;
      padding: 0;
    }

    .message-time {
      font-size: 11px;
      color: var(--text-secondary);
      margin-top: 4px;
      text-align: right;
    }

    /* Typing Indicator */
    .typing-indicator {
      display: flex;
      gap: 12px;
      padding: 12px;
      display: none;
    }

    .typing-indicator.active {
      display: flex;
    }

    .typing-dots {
      display: flex;
      gap: 4px;
      padding: 12px 16px;
      background: var(--surface-elevated);
      border-radius: 18px;
    }

    .typing-dots span {
      width: 8px;
      height: 8px;
      background: var(--text-secondary);
      border-radius: 50%;
      animation: bounce 1.4s infinite;
    }

    .typing-dots span:nth-child(2) {
      animation-delay: 0.2s;
    }

    .typing-dots span:nth-child(3) {
      animation-delay: 0.4s;
    }

    @keyframes bounce {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-10px); }
    }

    /* Input Area */
    .input-area {
      padding: 16px 20px;
      background: var(--surface-elevated);
      border-top: 1px solid var(--border);
      display: flex;
      gap: 12px;
      align-items: flex-end;
    }

    .input-wrapper {
      flex: 1;
      position: relative;
    }

    .message-input {
      width: 100%;
      padding: 12px 16px;
      background: var(--surface);
      border: 2px solid var(--border);
      border-radius: 24px;
      color: var(--text-primary);
      font-size: 16px;
      font-family: inherit;
      resize: none;
      max-height: 120px;
      transition: border-color 0.2s;
    }

    .message-input:focus {
      outline: none;
      border-color: var(--primary);
    }

    .message-input::placeholder {
      color: var(--text-secondary);
    }

    .send-button {
      width: 48px;
      height: 48px;
      background: var(--primary);
      border: none;
      border-radius: 50%;
      color: white;
      font-size: 20px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      flex-shrink: 0;
    }

    .send-button:hover {
      background: var(--primary-dark);
      transform: scale(1.05);
    }

    .send-button:active {
      transform: scale(0.95);
    }

    .send-button:disabled {
      background: var(--border);
      cursor: not-allowed;
      transform: scale(1);
    }

    /* Quick Actions */
    .quick-actions {
      display: flex;
      gap: 8px;
      padding: 12px 20px;
      overflow-x: auto;
      scrollbar-width: none;
    }

    .quick-actions::-webkit-scrollbar {
      display: none;
    }

    .quick-action {
      padding: 8px 16px;
      background: var(--surface-elevated);
      border: 1px solid var(--border);
      border-radius: 20px;
      color: var(--text-primary);
      font-size: 14px;
      white-space: nowrap;
      cursor: pointer;
      transition: all 0.2s;
    }

    .quick-action:hover {
      background: var(--primary);
      border-color: var(--primary);
      transform: translateY(-2px);
    }

    /* Responsive */
    @media (min-width: 768px) {
      .app-container {
        max-width: 1200px;
      }

      .message {
        max-width: 70%;
      }
    }

    /* Connection Status */
    .connection-status {
      position: fixed;
      top: 80px;
      right: 20px;
      padding: 8px 16px;
      background: var(--error);
      color: white;
      border-radius: 20px;
      font-size: 14px;
      display: none;
      z-index: 100;
    }

    .connection-status.show {
      display: block;
      animation: slideIn 0.3s;
    }
  </style>
</head>
<body>
  <div class="app-container">
    <!-- Header -->
    <div class="header">
      <div class="header-content">
        <div class="bot-avatar">🤖</div>
        <div class="bot-info">
          <h1>${BOT_NAME}</h1>
          <div class="bot-status">
            <span class="status-dot"></span>
            <span id="status-text">Online</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Connection Status -->
    <div class="connection-status" id="connectionStatus">
      Reconnecting...
    </div>

    <!-- Quick Actions -->
    <div class="quick-actions" id="quickActions">
      <button class="quick-action" data-message="help">💡 Help</button>
      <button class="quick-action" data-message="deploy with docker">🐳 Deploy with Docker</button>
      <button class="quick-action" data-message="create a REST API">⚡ Create API</button>
      <button class="quick-action" data-message="mobile optimization tips">📱 Mobile Tips</button>
      <button class="quick-action" data-message="show me the status">📊 Status</button>
    </div>

    <!-- Chat Container -->
    <div class="chat-container" id="chatContainer">
      <!-- Messages will be inserted here -->
    </div>

    <!-- Typing Indicator -->
    <div class="typing-indicator" id="typingIndicator">
      <div class="message-avatar">🤖</div>
      <div class="typing-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>

    <!-- Input Area -->
    <div class="input-area">
      <div class="input-wrapper">
        <textarea 
          id="messageInput" 
          class="message-input" 
          placeholder="Type your message... (or use voice commands)"
          rows="1"
        ></textarea>
      </div>
      <button id="sendButton" class="send-button" title="Send message">
        ➤
      </button>
    </div>
  </div>

  <script>
    // WebSocket connection
    let ws;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;

    function connect() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      ws = new WebSocket(\`\${protocol}//\${window.location.host}\`);

      ws.onopen = () => {
        console.log('Connected to EXPLORABOT');
        reconnectAttempts = 0;
        updateConnectionStatus('Online', true);
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        hideTypingIndicator();
        addMessage(data.content, 'bot');
      };

      ws.onclose = () => {
        console.log('Disconnected from EXPLORABOT');
        updateConnectionStatus('Offline', false);
        
        if (reconnectAttempts < maxReconnectAttempts) {
          setTimeout(() => {
            reconnectAttempts++;
            connect();
          }, 2000 * reconnectAttempts);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    }

    connect();

    // DOM elements
    const chatContainer = document.getElementById('chatContainer');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const typingIndicator = document.getElementById('typingIndicator');
    const quickActions = document.querySelectorAll('.quick-action');

    // Send message
    function sendMessage() {
      const message = messageInput.value.trim();
      if (!message || ws.readyState !== WebSocket.OPEN) return;

      addMessage(message, 'user');
      
      ws.send(JSON.stringify({
        content: message,
        timestamp: new Date().toISOString()
      }));

      messageInput.value = '';
      messageInput.style.height = 'auto';
      showTypingIndicator();
    }

    // Add message to chat
    function addMessage(content, sender) {
      const messageDiv = document.createElement('div');
      messageDiv.className = \`message \${sender}\`;
      
      const avatar = document.createElement('div');
      avatar.className = 'message-avatar';
      avatar.textContent = sender === 'bot' ? '🤖' : '👤';
      
      const messageContent = document.createElement('div');
      messageContent.className = 'message-content';
      
      // Convert markdown-style code blocks and formatting
      const formattedContent = formatMessage(content);
      messageContent.innerHTML = formattedContent;
      
      const time = document.createElement('div');
      time.className = 'message-time';
      time.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      messageDiv.appendChild(avatar);
      const contentWrapper = document.createElement('div');
      contentWrapper.appendChild(messageContent);
      contentWrapper.appendChild(time);
      messageDiv.appendChild(contentWrapper);
      
      chatContainer.appendChild(messageDiv);
      scrollToBottom();
    }

    // Format message with markdown-like syntax
    function formatMessage(text) {
      // Convert code blocks
      text = text.replace(/\`\`\`([\s\S]*?)\`\`\`/g, '<pre><code>$1</code></pre>');
      // Convert inline code
      text = text.replace(/\`([^\`]+)\`/g, '<code>$1</code>');
      // Convert bold
      text = text.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');
      // Convert line breaks
      text = text.replace(/\n/g, '<br>');
      // Convert bullets
      text = text.replace(/^• /gm, '&bull; ');
      
      return text;
    }

    // Show/hide typing indicator
    function showTypingIndicator() {
      typingIndicator.classList.add('active');
      scrollToBottom();
    }

    function hideTypingIndicator() {
      typingIndicator.classList.remove('active');
    }

    // Scroll to bottom
    function scrollToBottom() {
      setTimeout(() => {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }, 100);
    }

    // Update connection status
    function updateConnectionStatus(status, connected) {
      document.getElementById('status-text').textContent = status;
      const connectionStatus = document.getElementById('connectionStatus');
      
      if (!connected) {
        connectionStatus.classList.add('show');
      } else {
        connectionStatus.classList.remove('show');
      }
    }

    // Event listeners
    sendButton.addEventListener('click', sendMessage);

    messageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    // Auto-resize textarea
    messageInput.addEventListener('input', () => {
      messageInput.style.height = 'auto';
      messageInput.style.height = messageInput.scrollHeight + 'px';
    });

    // Quick actions
    quickActions.forEach(action => {
      action.addEventListener('click', () => {
        const message = action.dataset.message;
        messageInput.value = message;
        sendMessage();
      });
    });

    // Focus input on load
    messageInput.focus();
  </script>
</body>
</html>`;
}

