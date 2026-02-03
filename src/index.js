require('dotenv').config();

const BOT_NAME = process.env.BOT_NAME || 'EXPLORABOT';
// Railway provides PORT, fallback to BOT_PORT, then 8080
const BOT_PORT = process.env.PORT || process.env.BOT_PORT || 8080;

console.log(`🤖 ${BOT_NAME} - AI Assistant Bot`);
console.log(`📦 Version: ${require('../package.json').version}`);
console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🚀 Starting bot on port ${BOT_PORT}...`);

// Simple HTTP server for health checks and status
const http = require('http');

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'healthy', 
      bot: BOT_NAME,
      timestamp: new Date().toISOString()
    }));
  } else if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${BOT_NAME}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              max-width: 800px;
              margin: 50px auto;
              padding: 20px;
              background: #f5f5f5;
            }
            .container {
              background: white;
              padding: 30px;
              border-radius: 10px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1 { color: #333; }
            .status { color: #28a745; font-weight: bold; }
            code {
              background: #f4f4f4;
              padding: 2px 6px;
              border-radius: 3px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🤖 ${BOT_NAME}</h1>
            <p class="status">✓ Bot is running</p>
            <h2>Available Endpoints:</h2>
            <ul>
              <li><code>GET /</code> - This status page</li>
              <li><code>GET /health</code> - Health check endpoint</li>
            </ul>
            <p><em>Clawdbot-inspired AI assistant deployment system</em></p>
          </div>
        </body>
      </html>
    `);
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(BOT_PORT, () => {
  console.log(`✅ Bot server is running on http://localhost:${BOT_PORT}`);
  console.log(`📡 Health check: http://localhost:${BOT_PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('👋 Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('📴 Received SIGINT, shutting down gracefully...');
  server.close(() => {
    console.log('👋 Server closed');
    process.exit(0);
  });
});
