require('dotenv').config();
const http = require('http');
const { WebSocketServer } = require('ws');
const NLPProcessor = require('./nlp-processor');

// =============================================================================
// CONFIGURATION
// =============================================================================
const BOT_NAME = process.env.BOT_NAME || 'EXPLORABOT';
const BOT_PORT = process.env.PORT || process.env.BOT_PORT || 8080;
const NODE_ENV = process.env.NODE_ENV || 'development';
const DEBUG_MODE = process.env.DEBUG === 'true' || NODE_ENV === 'development';
const MAX_REQUEST_BODY_SIZE = parseInt(process.env.MAX_REQUEST_BODY_SIZE, 10) || 1024 * 1024; // 1MB default

// =============================================================================
// ADVANCED LOGGING SYSTEM
// =============================================================================
const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

const currentLogLevel = DEBUG_MODE ? LogLevel.DEBUG : LogLevel.INFO;

/**
 * Advanced logger with structured output and context
 */
const logger = {
  _format(level, message, context = {}) {
    const timestamp = new Date().toISOString();
    const contextStr = Object.keys(context).length > 0 ? ` | ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level}] ${message}${contextStr}`;
  },
  
  debug(message, context = {}) {
    if (currentLogLevel <= LogLevel.DEBUG) {
      console.log(this._format('DEBUG', message, context));
    }
  },
  
  info(message, context = {}) {
    if (currentLogLevel <= LogLevel.INFO) {
      console.log(this._format('INFO', message, context));
    }
  },
  
  warn(message, context = {}) {
    if (currentLogLevel <= LogLevel.WARN) {
      console.warn(this._format('WARN', message, context));
    }
  },
  
  error(message, error = null, context = {}) {
    if (currentLogLevel <= LogLevel.ERROR) {
      const errorContext = error ? {
        ...context,
        errorMessage: error.message,
        errorStack: DEBUG_MODE ? error.stack : undefined,
        errorCode: error.code,
      } : context;
      console.error(this._format('ERROR', message, errorContext));
    }
  },
};

// =============================================================================
// STARTUP LOGGING
// =============================================================================
logger.info(`🤖 ${BOT_NAME} - AI Assistant Bot`);
logger.info(`📦 Version: ${require('../package.json').version}`);
logger.info(`🌍 Environment: ${NODE_ENV}`);
logger.info(`🔧 Debug Mode: ${DEBUG_MODE ? 'ENABLED' : 'DISABLED'}`);
logger.info(`🚀 Starting bot on port ${BOT_PORT}...`);

// =============================================================================
// GLOBAL ERROR HANDLERS
// =============================================================================
let isShuttingDown = false;
let serverStartTime = null;
let requestCount = 0;
let errorCount = 0;
let wsConnectionCount = 0;

/**
 * Handle uncaught exceptions
 */
process.on('uncaughtException', (error) => {
  errorCount++;
  logger.error('💥 Uncaught Exception - Server may be unstable', error, {
    type: 'uncaughtException',
  });
  
  // In production, we might want to restart gracefully
  if (NODE_ENV === 'production' && !isShuttingDown) {
    logger.warn('🔄 Attempting graceful restart due to uncaught exception');
    gracefulShutdown('uncaughtException');
  }
});

/**
 * Handle unhandled promise rejections
 */
process.on('unhandledRejection', (reason, promise) => {
  errorCount++;
  const error = reason instanceof Error ? reason : new Error(String(reason));
  logger.error('💥 Unhandled Promise Rejection', error, {
    type: 'unhandledRejection',
  });
});

// =============================================================================
// NLP PROCESSOR INITIALIZATION WITH ERROR HANDLING
// =============================================================================
let nlp;
try {
  nlp = new NLPProcessor();
  logger.info('✅ NLP Processor initialized successfully');
} catch (error) {
  logger.error('❌ Failed to initialize NLP Processor', error);
  process.exit(1);
}

// =============================================================================
// CORS CONFIGURATION
// =============================================================================
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Request-ID',
};

// =============================================================================
// REQUEST UTILITIES
// =============================================================================

/**
 * Generate unique request ID for tracing
 */
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Safely parse JSON with error handling
 */
function safeParseJSON(str, context = {}) {
  try {
    return { data: JSON.parse(str), error: null };
  } catch (error) {
    logger.warn('Failed to parse JSON', { ...context, rawLength: str?.length });
    return { data: null, error };
  }
}

/**
 * Send JSON response with proper error handling
 */
function sendJSONResponse(res, statusCode, data, requestId = null) {
  try {
    const headers = { 
      'Content-Type': 'application/json', 
      ...corsHeaders 
    };
    if (requestId) {
      headers['X-Request-ID'] = requestId;
    }
    res.writeHead(statusCode, headers);
    res.end(JSON.stringify(data));
  } catch (error) {
    logger.error('Failed to send JSON response', error);
    res.writeHead(500);
    res.end('Internal Server Error');
  }
}

/**
 * Send error response with structured format
 */
function sendErrorResponse(res, statusCode, message, details = null, requestId = null) {
  errorCount++;
  const errorResponse = {
    error: {
      message,
      code: statusCode,
      timestamp: new Date().toISOString(),
      ...(details && DEBUG_MODE ? { details } : {}),
      ...(requestId ? { requestId } : {}),
    }
  };
  sendJSONResponse(res, statusCode, errorResponse, requestId);
}

// =============================================================================
// HTTP SERVER WITH ADVANCED ERROR HANDLING
// =============================================================================
const server = http.createServer((req, res) => {
  const requestId = generateRequestId();
  const startTime = Date.now();
  requestCount++;
  
  logger.debug(`📨 Incoming request`, { 
    requestId, 
    method: req.method, 
    url: req.url,
    userAgent: req.headers['user-agent']?.substring(0, 100),
  });

  // Handle connection errors
  req.on('error', (error) => {
    logger.error('Request error', error, { requestId });
    sendErrorResponse(res, 500, 'Request processing error', error.message, requestId);
  });

  res.on('error', (error) => {
    logger.error('Response error', error, { requestId });
  });

  // Log response completion
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.debug(`📤 Response sent`, { 
      requestId, 
      statusCode: res.statusCode, 
      duration: `${duration}ms` 
    });
  });

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders);
    res.end();
    return;
  }

  // Route handling with error boundaries
  try {
    routeRequest(req, res, requestId);
  } catch (error) {
    logger.error('Unhandled route error', error, { requestId, url: req.url });
    sendErrorResponse(res, 500, 'Internal server error', error.message, requestId);
  }
});

/**
 * Route requests to appropriate handlers
 */
function routeRequest(req, res, requestId) {
  const url = req.url.split('?')[0]; // Remove query params for routing

  switch (url) {
    case '/health':
      handleHealthCheck(req, res, requestId);
      break;
    case '/api/chat':
      if (req.method === 'POST') {
        handleChatAPI(req, res, requestId);
      } else {
        sendErrorResponse(res, 405, 'Method not allowed', `${req.method} not supported for /api/chat`, requestId);
      }
      break;
    case '/api/debug':
      if (DEBUG_MODE) {
        handleDebugEndpoint(req, res, requestId);
      } else {
        sendErrorResponse(res, 404, 'Not found', null, requestId);
      }
      break;
    case '/demo':
      handleDemoPage(req, res, requestId);
      break;
    case '/':
      handleMainPage(req, res, requestId);
      break;
    default:
      sendErrorResponse(res, 404, 'Not found', `Route ${url} not found`, requestId);
  }
}

/**
 * Enhanced health check with diagnostics
 */
function handleHealthCheck(req, res, requestId) {
  const uptime = serverStartTime ? Math.floor((Date.now() - serverStartTime) / 1000) : 0;
  const memoryUsage = process.memoryUsage();
  
  const healthData = {
    status: 'healthy',
    bot: BOT_NAME,
    version: require('../package.json').version,
    timestamp: new Date().toISOString(),
    uptime: `${uptime}s`,
    environment: NODE_ENV,
    metrics: {
      requestCount,
      errorCount,
      activeWebSocketConnections: wsConnectionCount,
      memoryUsedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
    },
    ...(DEBUG_MODE ? {
      debug: {
        nodeVersion: process.version,
        platform: process.platform,
        memoryDetails: {
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          external: memoryUsage.external,
          rss: memoryUsage.rss,
        }
      }
    } : {})
  };
  
  sendJSONResponse(res, 200, healthData, requestId);
}

/**
 * Debug endpoint for troubleshooting (only available in debug mode)
 */
function handleDebugEndpoint(req, res, requestId) {
  const debugInfo = {
    environment: {
      NODE_ENV,
      DEBUG_MODE,
      BOT_PORT,
      BOT_NAME,
    },
    server: {
      uptime: serverStartTime ? Math.floor((Date.now() - serverStartTime) / 1000) : 0,
      requestCount,
      errorCount,
      wsConnectionCount,
    },
    process: {
      pid: process.pid,
      version: process.version,
      platform: process.platform,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
    },
    nlpStatus: {
      initialized: !!nlp,
      historyLength: nlp?.getHistory?.()?.length || 0,
    },
    timestamp: new Date().toISOString(),
  };
  
  sendJSONResponse(res, 200, debugInfo, requestId);
}

/**
 * Handle chat API with comprehensive validation
 */
function handleChatAPI(req, res, requestId) {
  let body = '';
  let bodySize = 0;

  req.on('data', (chunk) => {
    bodySize += chunk.length;
    
    // Prevent body size attacks
    if (bodySize > MAX_REQUEST_BODY_SIZE) {
      logger.warn('Request body too large', { requestId, size: bodySize });
      sendErrorResponse(res, 413, 'Request body too large', `Max size: ${MAX_REQUEST_BODY_SIZE} bytes`, requestId);
      req.destroy();
      return;
    }
    
    body += chunk;
  });

  req.on('end', () => {
    // Validate content type
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('application/json')) {
      sendErrorResponse(res, 415, 'Unsupported Media Type', 'Content-Type must be application/json', requestId);
      return;
    }

    // Parse JSON safely
    const { data: parsedBody, error: parseError } = safeParseJSON(body, { requestId });
    if (parseError) {
      sendErrorResponse(res, 400, 'Invalid JSON', parseError.message, requestId);
      return;
    }

    // Validate message field
    const { message } = parsedBody;
    if (typeof message !== 'string') {
      sendErrorResponse(res, 400, 'Invalid request', 'message field must be a string', requestId);
      return;
    }

    if (message.trim().length === 0) {
      sendErrorResponse(res, 400, 'Invalid request', 'message cannot be empty', requestId);
      return;
    }

    if (message.length > 10000) {
      sendErrorResponse(res, 400, 'Invalid request', 'message too long (max 10000 characters)', requestId);
      return;
    }

    // Process message with NLP
    try {
      const response = nlp.process(message);
      sendJSONResponse(res, 200, { 
        response,
        requestId,
        timestamp: new Date().toISOString(),
      }, requestId);
    } catch (nlpError) {
      logger.error('NLP processing error', nlpError, { requestId, messageLength: message.length });
      sendErrorResponse(res, 500, 'Failed to process message', nlpError.message, requestId);
    }
  });

  req.on('error', (error) => {
    logger.error('Chat API request error', error, { requestId });
    sendErrorResponse(res, 500, 'Request error', error.message, requestId);
  });
}

/**
 * Handle demo page with error handling
 */
function handleDemoPage(req, res, requestId) {
  const fs = require('fs');
  const path = require('path');
  const demoPath = path.join(__dirname, '..', 'demo.html');
  
  fs.readFile(demoPath, 'utf8', (err, data) => {
    if (err) {
      logger.warn('Demo page not found', { requestId, path: demoPath });
      sendErrorResponse(res, 404, 'Demo page not found', err.message, requestId);
    } else {
      res.writeHead(200, { 'Content-Type': 'text/html', ...corsHeaders });
      res.end(data);
    }
  });
}

/**
 * Handle main page
 */
function handleMainPage(req, res, requestId) {
  try {
    res.writeHead(200, { 'Content-Type': 'text/html', ...corsHeaders });
    res.end(getChatUI());
  } catch (error) {
    logger.error('Failed to generate chat UI', error, { requestId });
    sendErrorResponse(res, 500, 'Failed to load page', error.message, requestId);
  }
}

// =============================================================================
// WEBSOCKET SERVER WITH ADVANCED ERROR HANDLING
// =============================================================================
const wss = new WebSocketServer({ server });

// WebSocket error handler
wss.on('error', (error) => {
  errorCount++;
  logger.error('WebSocket Server error', error, { type: 'wssError' });
});

wss.on('connection', (ws, req) => {
  const clientId = `ws_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  const clientIP = req.socket.remoteAddress || 'unknown';
  wsConnectionCount++;
  
  logger.info('👤 New client connected', { 
    clientId, 
    clientIP,
    totalConnections: wsConnectionCount,
  });
  
  // Set up client-specific error handling
  ws.isAlive = true;
  
  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('error', (error) => {
    errorCount++;
    logger.error('WebSocket client error', error, { clientId });
  });
  
  // Send welcome message with error handling
  try {
    ws.send(JSON.stringify({
      type: 'message',
      content: nlp.getDefaultResponse(),
      timestamp: new Date().toISOString(),
      clientId,
    }));
  } catch (error) {
    logger.error('Failed to send welcome message', error, { clientId });
  }

  ws.on('message', (data) => {
    const messageId = `msg_${Date.now()}`;
    
    try {
      // Validate message size
      if (data.length > 100000) {
        logger.warn('WebSocket message too large', { clientId, size: data.length });
        ws.send(JSON.stringify({
          type: 'error',
          content: 'Message too large. Please send shorter messages.',
          messageId,
        }));
        return;
      }

      // Parse message
      const { data: message, error: parseError } = safeParseJSON(data.toString(), { clientId });
      if (parseError) {
        logger.warn('Failed to parse WebSocket message', { clientId, error: parseError.message });
        ws.send(JSON.stringify({
          type: 'error',
          content: 'Invalid message format. Please send valid JSON.',
          messageId,
        }));
        return;
      }

      // Validate message content
      if (!message.content || typeof message.content !== 'string') {
        ws.send(JSON.stringify({
          type: 'error',
          content: 'Message must include a "content" field.',
          messageId,
        }));
        return;
      }

      const content = message.content.trim();
      if (content.length === 0) {
        ws.send(JSON.stringify({
          type: 'error',
          content: 'Message cannot be empty.',
          messageId,
        }));
        return;
      }

      logger.debug(`📨 Received message`, { clientId, messageId, contentLength: content.length });
      
      // Process with NLP
      const response = nlp.process(content);
      
      // Send response
      ws.send(JSON.stringify({
        type: 'message',
        content: response,
        timestamp: new Date().toISOString(),
        messageId,
      }));
      
      logger.debug(`📤 Sent response`, { clientId, messageId });
      
    } catch (error) {
      errorCount++;
      logger.error('Error processing WebSocket message', error, { clientId, messageId });
      
      try {
        ws.send(JSON.stringify({
          type: 'error',
          content: 'Sorry, I encountered an error processing your message. Please try again.',
          messageId,
          ...(DEBUG_MODE ? { debug: error.message } : {}),
        }));
      } catch (sendError) {
        logger.error('Failed to send error response to client', sendError, { clientId });
      }
    }
  });

  ws.on('close', (code, reason) => {
    wsConnectionCount = Math.max(0, wsConnectionCount - 1);
    logger.info('👋 Client disconnected', { 
      clientId, 
      code, 
      reason: reason.toString() || 'No reason provided',
      remainingConnections: wsConnectionCount,
    });
  });
});

// Heartbeat interval to detect broken connections
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const heartbeatInterval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      logger.debug('Terminating inactive WebSocket connection');
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
  });
}, HEARTBEAT_INTERVAL);

wss.on('close', () => {
  clearInterval(heartbeatInterval);
});

// =============================================================================
// SERVER STARTUP
// =============================================================================
const HOST = '0.0.0.0';

server.on('error', (error) => {
  errorCount++;
  if (error.code === 'EADDRINUSE') {
    logger.error(`❌ Port ${BOT_PORT} is already in use`, error);
  } else if (error.code === 'EACCES') {
    logger.error(`❌ Permission denied to use port ${BOT_PORT}`, error);
  } else {
    logger.error('❌ Server error', error);
  }
  process.exit(1);
});

server.listen(BOT_PORT, HOST, () => {
  serverStartTime = Date.now();
  logger.info(`✅ Bot server is running on port ${BOT_PORT} (accepting connections on all interfaces)`);
  logger.info(`📡 Health check: http://localhost:${BOT_PORT}/health`);
  logger.info(`💬 Chat interface: http://localhost:${BOT_PORT}/`);
  if (DEBUG_MODE) {
    logger.info(`🔧 Debug endpoint: http://localhost:${BOT_PORT}/api/debug`);
  }
});

// =============================================================================
// GRACEFUL SHUTDOWN
// =============================================================================
const SHUTDOWN_TIMEOUT = 30000; // 30 seconds

function gracefulShutdown(signal) {
  if (isShuttingDown) {
    logger.warn('Shutdown already in progress, ignoring signal', { signal });
    return;
  }
  
  isShuttingDown = true;
  logger.info(`📴 Received ${signal}, shutting down gracefully...`);
  
  // Set a timeout for forceful shutdown
  const forceShutdownTimer = setTimeout(() => {
    logger.error('⚠️ Forced shutdown due to timeout');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT);
  
  // Clear heartbeat interval
  clearInterval(heartbeatInterval);
  
  // Close WebSocket server - notify clients
  wss.clients.forEach((client) => {
    try {
      client.send(JSON.stringify({
        type: 'system',
        content: 'Server is shutting down. Please reconnect shortly.',
      }));
      client.close(1001, 'Server shutdown');
    } catch (error) {
      // Ignore errors during shutdown
    }
  });
  
  wss.close((err) => {
    if (err) {
      logger.error('Error closing WebSocket server', err);
    } else {
      logger.info('✅ WebSocket server closed');
    }
    
    // Close HTTP server
    server.close((err) => {
      clearTimeout(forceShutdownTimer);
      
      if (err) {
        logger.error('Error closing HTTP server', err);
        process.exit(1);
      }
      
      logger.info('✅ HTTP server closed');
      logger.info('👋 Shutdown complete', {
        uptime: serverStartTime ? Math.floor((Date.now() - serverStartTime) / 1000) : 0,
        requestsServed: requestCount,
        errors: errorCount,
      });
      
      process.exit(0);
    });
  });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

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
    // ==========================================================================
    // CONFIGURATION
    // ==========================================================================
    const CONFIG = {
      maxReconnectAttempts: 10,
      reconnectBaseDelay: 1000,
      maxReconnectDelay: 30000,
      connectionTimeout: 10000,
      messageTimeout: 30000,
      maxMessageLength: 10000,
      debug: ${DEBUG_MODE},
    };

    // ==========================================================================
    // LOGGING UTILITY
    // ==========================================================================
    const log = {
      debug: (...args) => CONFIG.debug && console.log('[DEBUG]', ...args),
      info: (...args) => console.log('[INFO]', ...args),
      warn: (...args) => console.warn('[WARN]', ...args),
      error: (...args) => console.error('[ERROR]', ...args),
    };

    // ==========================================================================
    // CONNECTION STATE
    // ==========================================================================
    let ws = null;
    let reconnectAttempts = 0;
    let reconnectTimer = null;
    let connectionTimer = null;
    let isManualDisconnect = false;
    let pendingMessages = new Map();
    let clientId = null;

    // ==========================================================================
    // WEBSOCKET CONNECTION WITH ADVANCED ERROR HANDLING
    // ==========================================================================
    function connect() {
      // Clear any existing timers
      clearTimeout(reconnectTimer);
      clearTimeout(connectionTimer);
      
      // Check if already connected
      if (ws && ws.readyState === WebSocket.OPEN) {
        log.debug('Already connected');
        return;
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = \`\${protocol}//\${window.location.host}\`;
      
      log.info('Connecting to', wsUrl);
      updateConnectionStatus('Connecting...', false);

      try {
        ws = new WebSocket(wsUrl);
      } catch (error) {
        log.error('Failed to create WebSocket:', error);
        handleConnectionFailure('Failed to create connection');
        return;
      }

      // Set connection timeout
      connectionTimer = setTimeout(() => {
        if (ws && ws.readyState === WebSocket.CONNECTING) {
          log.warn('Connection timeout');
          ws.close();
          handleConnectionFailure('Connection timeout');
        }
      }, CONFIG.connectionTimeout);

      ws.onopen = () => {
        clearTimeout(connectionTimer);
        log.info('Connected to EXPLORABOT');
        reconnectAttempts = 0;
        isManualDisconnect = false;
        updateConnectionStatus('Online', true);
        
        // Re-enable send button
        document.getElementById('sendButton').disabled = false;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          log.debug('Received message:', data.type);
          
          // Store client ID if provided
          if (data.clientId) {
            clientId = data.clientId;
            log.debug('Client ID:', clientId);
          }

          // Handle different message types
          switch (data.type) {
            case 'message':
              hideTypingIndicator();
              addMessage(data.content, 'bot');
              // Clear pending message if messageId matches
              if (data.messageId && pendingMessages.has(data.messageId)) {
                clearTimeout(pendingMessages.get(data.messageId));
                pendingMessages.delete(data.messageId);
              }
              break;
              
            case 'error':
              hideTypingIndicator();
              addSystemMessage(data.content, 'error');
              if (data.messageId && pendingMessages.has(data.messageId)) {
                clearTimeout(pendingMessages.get(data.messageId));
                pendingMessages.delete(data.messageId);
              }
              break;
              
            case 'system':
              addSystemMessage(data.content, 'info');
              break;
              
            default:
              log.warn('Unknown message type:', data.type);
              hideTypingIndicator();
              if (data.content) {
                addMessage(data.content, 'bot');
              }
          }
        } catch (error) {
          log.error('Failed to parse message:', error);
          hideTypingIndicator();
          addSystemMessage('Received malformed message from server', 'error');
        }
      };

      ws.onclose = (event) => {
        clearTimeout(connectionTimer);
        log.info('Disconnected from EXPLORABOT', { code: event.code, reason: event.reason });
        
        // Disable send button while disconnected
        document.getElementById('sendButton').disabled = true;
        
        // Clear pending messages
        pendingMessages.forEach((timer) => clearTimeout(timer));
        pendingMessages.clear();
        
        if (isManualDisconnect) {
          updateConnectionStatus('Disconnected', false);
          return;
        }
        
        // Determine if we should reconnect based on close code
        const shouldReconnect = event.code !== 1000 && event.code !== 1001;
        
        if (shouldReconnect && reconnectAttempts < CONFIG.maxReconnectAttempts) {
          handleReconnect();
        } else if (reconnectAttempts >= CONFIG.maxReconnectAttempts) {
          updateConnectionStatus('Connection failed', false);
          addSystemMessage('Unable to connect to server. Please refresh the page.', 'error');
        } else {
          updateConnectionStatus('Offline', false);
        }
      };

      ws.onerror = (error) => {
        log.error('WebSocket error:', error);
        // onclose will be called after this, so we don't need to handle reconnection here
      };
    }

    function handleConnectionFailure(reason) {
      log.warn('Connection failure:', reason);
      updateConnectionStatus('Connection failed', false);
      
      if (reconnectAttempts < CONFIG.maxReconnectAttempts) {
        handleReconnect();
      } else {
        addSystemMessage(\`Failed to connect: \${reason}. Please refresh the page.\`, 'error');
      }
    }

    function handleReconnect() {
      reconnectAttempts++;
      // Exponential backoff with jitter
      const baseDelay = Math.min(
        CONFIG.reconnectBaseDelay * Math.pow(2, reconnectAttempts - 1),
        CONFIG.maxReconnectDelay
      );
      const jitter = baseDelay * 0.2 * Math.random();
      const delay = Math.floor(baseDelay + jitter);
      
      log.info(\`Reconnecting in \${delay}ms (attempt \${reconnectAttempts}/\${CONFIG.maxReconnectAttempts})\`);
      updateConnectionStatus(\`Reconnecting (\${reconnectAttempts}/\${CONFIG.maxReconnectAttempts})...\`, false);
      
      reconnectTimer = setTimeout(connect, delay);
    }

    function disconnect() {
      isManualDisconnect = true;
      if (ws) {
        ws.close(1000, 'User disconnect');
      }
    }

    // ==========================================================================
    // DOM ELEMENTS
    // ==========================================================================
    const chatContainer = document.getElementById('chatContainer');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const typingIndicator = document.getElementById('typingIndicator');
    const quickActions = document.querySelectorAll('.quick-action');

    // ==========================================================================
    // MESSAGE HANDLING WITH ERROR HANDLING
    // ==========================================================================
    function sendMessage() {
      const message = messageInput.value.trim();
      
      // Validate message
      if (!message) {
        log.debug('Empty message, not sending');
        return;
      }
      
      if (message.length > CONFIG.maxMessageLength) {
        addSystemMessage(\`Message too long. Maximum \${CONFIG.maxMessageLength} characters allowed.\`, 'error');
        return;
      }
      
      // Check connection state
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        addSystemMessage('Not connected to server. Attempting to reconnect...', 'error');
        connect();
        return;
      }

      const messageId = \`msg_\${Date.now()}_\${Math.random().toString(36).slice(2, 11)}\`;
      
      // Add user message to UI
      addMessage(message, 'user');
      
      try {
        ws.send(JSON.stringify({
          content: message,
          timestamp: new Date().toISOString(),
          messageId,
        }));
        
        log.debug('Message sent:', messageId);
        
        // Set timeout for response
        const timeoutId = setTimeout(() => {
          log.warn('Message timeout:', messageId);
          pendingMessages.delete(messageId);
          hideTypingIndicator();
          addSystemMessage('Response timeout. Please try again.', 'error');
        }, CONFIG.messageTimeout);
        
        pendingMessages.set(messageId, timeoutId);
        
        // Clear input and show typing indicator
        messageInput.value = '';
        messageInput.style.height = 'auto';
        showTypingIndicator();
        
      } catch (error) {
        log.error('Failed to send message:', error);
        addSystemMessage('Failed to send message. Please try again.', 'error');
      }
    }

    // Add message to chat
    function addMessage(content, sender) {
      if (!content) {
        log.warn('Attempted to add empty message');
        return;
      }

      try {
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
      } catch (error) {
        log.error('Failed to add message to UI:', error);
      }
    }

    // Add system message (errors, info)
    function addSystemMessage(content, type = 'info') {
      try {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'system-message';
        messageDiv.style.cssText = \`
          text-align: center;
          padding: 8px 16px;
          margin: 8px auto;
          max-width: 80%;
          border-radius: 12px;
          font-size: 14px;
          background: \${type === 'error' ? 'var(--error)' : 'var(--surface-elevated)'};
          color: \${type === 'error' ? 'white' : 'var(--text-secondary)'};
          opacity: 0.9;
        \`;
        messageDiv.textContent = content;
        
        chatContainer.appendChild(messageDiv);
        scrollToBottom();
        
        // Auto-remove info messages after 10 seconds
        if (type === 'info') {
          setTimeout(() => {
            messageDiv.style.transition = 'opacity 0.3s';
            messageDiv.style.opacity = '0';
            setTimeout(() => messageDiv.remove(), 300);
          }, 10000);
        }
      } catch (error) {
        log.error('Failed to add system message:', error);
      }
    }

    // Format message with markdown-like syntax
    function formatMessage(text) {
      if (!text || typeof text !== 'string') return '';
      
      try {
        // Convert code blocks
        text = text.replace(/\\\`\\\`\\\`([\\s\\S]*?)\\\`\\\`\\\`/g, '<pre><code>$1</code></pre>');
        // Convert inline code
        text = text.replace(/\\\`([^\\\`]+)\\\`/g, '<code>$1</code>');
        // Convert bold
        text = text.replace(/\\*\\*([^\\*]+)\\*\\*/g, '<strong>$1</strong>');
        // Convert line breaks
        text = text.replace(/\\n/g, '<br>');
        // Convert bullets
        text = text.replace(/^• /gm, '&bull; ');
        
        return text;
      } catch (error) {
        log.error('Failed to format message:', error);
        return text;
      }
    }

    // ==========================================================================
    // UI HELPERS
    // ==========================================================================
    function showTypingIndicator() {
      typingIndicator.classList.add('active');
      scrollToBottom();
    }

    function hideTypingIndicator() {
      typingIndicator.classList.remove('active');
    }

    function scrollToBottom() {
      setTimeout(() => {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }, 100);
    }

    function updateConnectionStatus(status, connected) {
      const statusText = document.getElementById('status-text');
      const statusDot = document.querySelector('.status-dot');
      const connectionStatus = document.getElementById('connectionStatus');
      
      if (statusText) statusText.textContent = status;
      
      if (statusDot) {
        statusDot.style.background = connected ? 'var(--success)' : 'var(--error)';
      }
      
      if (connectionStatus) {
        connectionStatus.textContent = status;
        if (!connected) {
          connectionStatus.classList.add('show');
        } else {
          connectionStatus.classList.remove('show');
        }
      }
    }

    // ==========================================================================
    // EVENT LISTENERS
    // ==========================================================================
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
        if (message) {
          messageInput.value = message;
          sendMessage();
        }
      });
    });

    // Handle page visibility changes (reconnect when page becomes visible)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        if (!ws || ws.readyState !== WebSocket.OPEN) {
          log.info('Page visible, checking connection...');
          reconnectAttempts = 0; // Reset attempts on visibility change
          connect();
        }
      }
    });

    // Handle online/offline events
    window.addEventListener('online', () => {
      log.info('Browser online, reconnecting...');
      reconnectAttempts = 0;
      connect();
    });

    window.addEventListener('offline', () => {
      log.warn('Browser offline');
      updateConnectionStatus('No internet connection', false);
    });

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      isManualDisconnect = true;
      if (ws) {
        ws.close(1000, 'Page unload');
      }
    });

    // ==========================================================================
    // INITIALIZATION
    // ==========================================================================
    log.info('EXPLORABOT client initializing...');
    messageInput.focus();
    connect();
  </script>
</body>
</html>`;
}

