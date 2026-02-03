/**
 * NLP Processor for EXPLORABOT
 * Handles natural language understanding and intent recognition
 * Zero-code interface for non-technical users
 */

class NLPProcessor {
  constructor() {
    // Define intents and patterns for zero-code interaction
    this.intents = {
      greeting: {
        patterns: [
          /^(hi|hello|hey|greetings)/i,
          /^good (morning|afternoon|evening)/i,
        ],
        responses: [
          "Hello! 👋 I'm EXPLORABOT, your AI assistant. How can I help you today?",
          "Hi there! I'm here to help you build and deploy applications without writing code. What would you like to create?",
          "Hey! Ready to explore? Ask me anything or describe what you'd like to build!",
        ]
      },
      help: {
        patterns: [
          /\b(help|assist|guide|support|what can you do)\b/i,
          /how\s+to/i,
          /^what/i,
        ],
        responses: [
          `🤖 **I can help you with:**

• **Deploy Applications** - "Deploy a web app" or "Set up Docker container"
• **Generate Code** - "Create a REST API" or "Build a login form"
• **Explain Concepts** - "What is CI/CD?" or "Explain microservices"
• **Configure Services** - "Set up database" or "Configure environment"
• **Best Practices** - "Mobile optimization tips" or "Security guidelines"

Just describe what you need in plain English!`,
        ]
      },
      deploy: {
        patterns: [
          /\b(deploy|deployment|launch|publish|release)\b/i,
        ],
        responses: [
          `🚀 **Deployment Options:**

1. **Docker** - Containerize and deploy locally
2. **Railway** - One-click cloud deployment
3. **Docker Compose** - Multi-service orchestration

Tell me: "Deploy with Docker" or "Set up Railway deployment"`,
        ]
      },
      code: {
        patterns: [
          /\b(code|generate|create|build|make|develop)\b.*(app|api|form|page|component)/i,
        ],
        responses: [
          `💻 **Code Generation:**

I can help you create:
• Web pages and UI components
• REST APIs and endpoints
• Database schemas
• Authentication systems
• Mobile-responsive layouts

What would you like me to generate?`,
        ]
      },
      docker: {
        patterns: [
          /\b(docker|container|dockerfile|image)\b/i,
        ],
        responses: [
          `🐳 **Docker Commands:**

\`\`\`bash
# Build container
docker build -t explorabot .

# Run container
docker run -p 8080:8080 explorabot

# Or use Docker Compose
docker-compose up -d
\`\`\`

Need help with a specific Docker task?`,
        ]
      },
      mobile: {
        patterns: [
          /\b(mobile|responsive|phone|tablet|samsung|galaxy)/i,
        ],
        responses: [
          `📱 **Mobile Optimization:**

EXPLORABOT is optimized for Samsung Galaxy S24 FE:
• 120Hz smooth animations
• AMOLED dark theme
• Touch-optimized controls
• Offline support
• Battery efficient

See our [Mobile Platform Guidelines](/docs/MOBILE_PLATFORM_GUIDELINES.md)`,
        ]
      },
      ai: {
        patterns: [
          /\b(ai|artificial intelligence|machine learning|ml|model|neural)\b/i,
        ],
        responses: [
          `🧠 **AI Capabilities:**

• On-device AI inference
• Model optimization for mobile
• Natural language processing
• Context-aware responses
• Zero-code AI integration

Learn more in our [AI Architect Persona](/docs/AI_ARCHITECT_PERSONA.md)`,
        ]
      },
      status: {
        patterns: [
          /\b(status|health|running|online|check)\b/i,
        ],
        responses: [
          `✅ **System Status:**

🟢 Bot is online and healthy
📊 Version: 1.0.0
🌍 Environment: ${process.env.NODE_ENV || 'development'}
⚡ Ready to assist you!`,
        ]
      }
    };

    // Conversation context
    this.context = {
      lastIntent: null,
      conversationHistory: [],
    };
  }

  /**
   * Process user input and return intelligent response
   */
  process(userInput) {
    if (!userInput || typeof userInput !== 'string') {
      return this.getDefaultResponse();
    }

    const input = userInput.trim();
    
    // Store in conversation history
    this.context.conversationHistory.push({
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    });

    // Detect intent
    const intent = this.detectIntent(input);
    
    if (intent) {
      this.context.lastIntent = intent;
      const response = this.getResponse(intent);
      
      this.context.conversationHistory.push({
        role: 'assistant',
        content: response,
        intent: intent,
        timestamp: new Date().toISOString(),
      });
      
      return response;
    }

    // Fallback to intelligent response
    return this.getIntelligentFallback(input);
  }

  /**
   * Detect user intent from input
   */
  detectIntent(input) {
    for (const [intentName, intentData] of Object.entries(this.intents)) {
      for (const pattern of intentData.patterns) {
        if (pattern.test(input)) {
          return intentName;
        }
      }
    }
    return null;
  }

  /**
   * Get response for detected intent
   */
  getResponse(intent) {
    const intentData = this.intents[intent];
    if (!intentData || !intentData.responses) {
      return this.getDefaultResponse();
    }

    // Randomly select a response variant
    const responses = intentData.responses;
    const response = responses[Math.floor(Math.random() * responses.length)];
    
    return response;
  }

  /**
   * Intelligent fallback when no intent is detected
   */
  getIntelligentFallback(input) {
    const keywords = {
      question: ['what', 'how', 'why', 'when', 'where', 'who', '?'],
      technical: ['api', 'database', 'server', 'config', 'setup'],
      action: ['create', 'make', 'build', 'generate', 'show', 'explain'],
    };

    let responseType = 'general';
    
    if (keywords.question.some(kw => input.toLowerCase().includes(kw))) {
      responseType = 'question';
    } else if (keywords.technical.some(kw => input.toLowerCase().includes(kw))) {
      responseType = 'technical';
    } else if (keywords.action.some(kw => input.toLowerCase().includes(kw))) {
      responseType = 'action';
    }

    const fallbacks = {
      question: `🤔 Great question! I'm still learning about "${input}". 

Try asking about:
• Deployment ("How do I deploy?")
• Code generation ("Create a REST API")
• Docker ("Help with Docker")
• Mobile optimization ("Mobile best practices")`,
      
      technical: `🔧 I can help with technical tasks!

For "${input}", try being more specific:
• "Deploy with Docker"
• "Create API endpoint"
• "Set up database connection"
• "Configure CI/CD pipeline"`,
      
      action: `⚡ I'm ready to help you with that!

To better assist with "${input}", please provide more details:
• What type of application?
• What features do you need?
• Any specific requirements?`,
      
      general: `💭 I understand you mentioned "${input}".

I can help you with:
• Deploying applications 🚀
• Generating code 💻
• Docker configuration 🐳
• Mobile optimization 📱
• AI integration 🧠

Type "help" to see all my capabilities!`,
    };

    return fallbacks[responseType];
  }

  /**
   * Get default/welcome response
   */
  getDefaultResponse() {
    return `👋 Welcome to EXPLORABOT!

I'm your AI assistant for building and deploying applications **without writing code**.

**Try saying:**
• "Help me deploy an app"
• "Create a REST API"
• "Show me Docker commands"
• "Mobile optimization tips"

Just describe what you need in plain English! 🚀`;
  }

  /**
   * Get conversation history
   */
  getHistory() {
    return this.context.conversationHistory;
  }

  /**
   * Clear conversation context
   */
  clearContext() {
    this.context = {
      lastIntent: null,
      conversationHistory: [],
    };
  }
}

module.exports = NLPProcessor;
