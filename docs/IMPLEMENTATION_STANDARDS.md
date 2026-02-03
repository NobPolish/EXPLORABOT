# Implementation Standards

## Overview

This document defines the implementation standards for EXPLORABOT, ensuring consistency, quality, and maintainability across the codebase. These standards are specifically tailored for mobile-first AI applications targeting platforms like Samsung Galaxy S24 FE.

## Code Organization

### Directory Structure

```
EXPLORABOT/
├── docs/                    # Documentation
├── src/                     # Source code
│   ├── api/                # API endpoints and handlers
│   ├── services/           # Business logic and services
│   ├── models/             # Data models
│   ├── utils/              # Utility functions
│   ├── config/             # Configuration files
│   ├── middleware/         # Express/HTTP middleware
│   └── index.js            # Application entry point
├── tests/                   # Test files
│   ├── unit/               # Unit tests
│   ├── integration/        # Integration tests
│   └── e2e/                # End-to-end tests
├── scripts/                 # Build and deployment scripts
├── .github/                 # GitHub Actions workflows
└── public/                  # Static assets
```

### Module Structure

- Each module should be self-contained and have a single responsibility
- Use clear, descriptive names for files and directories
- Group related functionality together
- Keep files focused and under 300 lines when possible

## Coding Standards

### JavaScript/Node.js Style Guide

#### General Principles
1. **Clarity over cleverness**: Write code that is easy to understand
2. **Consistency**: Follow established patterns throughout the codebase
3. **Simplicity**: Prefer simple solutions over complex ones
4. **DRY (Don't Repeat Yourself)**: Extract common functionality into reusable functions

#### Naming Conventions

```javascript
// Constants: UPPER_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;
const API_BASE_URL = 'https://api.example.com';

// Variables and functions: camelCase
const userName = 'John';
function getUserData() { }

// Classes: PascalCase
class UserService { }

// Private methods/properties: prefix with underscore
class ApiClient {
  _privateMethod() { }
}

// Boolean variables: use is/has/should prefixes
const isActive = true;
const hasPermission = false;
const shouldRetry = true;
```

#### Code Formatting

- **Indentation**: 2 spaces (no tabs)
- **Line Length**: Maximum 100 characters
- **Semicolons**: Always use semicolons
- **Quotes**: Use single quotes for strings
- **Trailing Commas**: Use trailing commas in multi-line objects/arrays

```javascript
// Good
const config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
  retries: 3,
};

// Bad
const config = {
  apiUrl: "https://api.example.com",
  timeout: 5000,
  retries: 3
}
```

#### Function Guidelines

```javascript
// Use arrow functions for callbacks and small functions
const numbers = [1, 2, 3].map(n => n * 2);

// Use regular functions for methods and larger functions
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// Use async/await for asynchronous operations
async function fetchUserData(userId) {
  try {
    const response = await fetch(`/api/users/${userId}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch user data:', error);
    throw error;
  }
}
```

#### Error Handling

```javascript
// Always use try-catch for async operations
async function processData(data) {
  try {
    const result = await validateData(data);
    return result;
  } catch (error) {
    // Log the error with context
    console.error('Data processing failed:', {
      error: error.message,
      data: data,
      timestamp: new Date().toISOString(),
    });
    
    // Re-throw or handle appropriately
    throw new Error(`Processing failed: ${error.message}`);
  }
}

// Use custom error classes for specific error types
class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}
```

### Mobile-First Implementation Standards

#### Performance Optimization

1. **Lazy Loading**: Load resources only when needed
```javascript
// Lazy load heavy modules
const loadAIModel = async () => {
  const { AIModel } = await import('./ai/model');
  return new AIModel();
};
```

2. **Code Splitting**: Split code into smaller chunks
```javascript
// Dynamic imports for route-based code splitting
app.get('/ai', async (req, res) => {
  const { handleAIRequest } = await import('./routes/ai');
  return handleAIRequest(req, res);
});
```

3. **Caching Strategy**: Implement aggressive caching for mobile
```javascript
// Cache static resources
const cache = new Map();
function getCachedData(key) {
  if (cache.has(key)) {
    return cache.get(key);
  }
  const data = fetchData(key);
  cache.set(key, data);
  return data;
}
```

4. **Resource Optimization**
- Minimize bundle size (target: <500KB initial load)
- Compress responses (gzip/brotli)
- Optimize images (WebP format, responsive images)
- Use CDN for static assets

#### Mobile-Specific Considerations

```javascript
// Detect mobile device
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

// Optimize for slow networks
const fetchWithTimeout = async (url, timeout = 5000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

// Battery-aware operations
if ('getBattery' in navigator) {
  const battery = await navigator.getBattery();
  if (battery.level < 0.2 && !battery.charging) {
    // Reduce AI processing intensity
    console.log('Low battery mode enabled');
  }
}
```

## API Design Standards

### RESTful API Guidelines

1. **URL Structure**
```
GET    /api/v1/users           # List users
GET    /api/v1/users/:id       # Get specific user
POST   /api/v1/users           # Create user
PUT    /api/v1/users/:id       # Update user
DELETE /api/v1/users/:id       # Delete user
```

2. **Response Format**
```javascript
// Success response
{
  "success": true,
  "data": { /* response data */ },
  "timestamp": "2026-02-03T10:29:00.000Z"
}

// Error response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "field": "email"
  },
  "timestamp": "2026-02-03T10:29:00.000Z"
}
```

3. **HTTP Status Codes**
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error
- 503: Service Unavailable

### Rate Limiting

```javascript
// Implement rate limiting for API endpoints
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.',
});

app.use('/api/', apiLimiter);
```

## Testing Standards

### Unit Testing

```javascript
// Use descriptive test names
describe('UserService', () => {
  describe('createUser', () => {
    it('should create a new user with valid data', async () => {
      const userData = { name: 'John Doe', email: 'john@example.com' };
      const user = await userService.createUser(userData);
      
      expect(user).toBeDefined();
      expect(user.name).toBe(userData.name);
      expect(user.email).toBe(userData.email);
    });
    
    it('should throw ValidationError for invalid email', async () => {
      const userData = { name: 'John Doe', email: 'invalid-email' };
      
      await expect(userService.createUser(userData))
        .rejects
        .toThrow(ValidationError);
    });
  });
});
```

### Test Coverage Requirements

- **Minimum Coverage**: 80% overall
- **Critical Paths**: 100% coverage for authentication, payment, data validation
- **Unit Tests**: All business logic and utility functions
- **Integration Tests**: API endpoints and service interactions
- **E2E Tests**: Critical user flows

### Testing Guidelines

1. **AAA Pattern**: Arrange, Act, Assert
2. **Isolation**: Tests should not depend on each other
3. **Mocking**: Use mocks for external dependencies
4. **Performance**: Tests should run quickly (<5 seconds per suite)
5. **Clarity**: Test names should describe the scenario and expected outcome

## Security Standards

### Authentication and Authorization

```javascript
// Use secure authentication tokens
const jwt = require('jsonwebtoken');

function generateToken(userId) {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
}

// Middleware for protected routes
function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

### Input Validation

```javascript
// Always validate and sanitize user input
function validateUserInput(data) {
  const errors = [];
  
  if (!data.email || !isValidEmail(data.email)) {
    errors.push({ field: 'email', message: 'Valid email is required' });
  }
  
  if (!data.name || data.name.length < 2) {
    errors.push({ field: 'name', message: 'Name must be at least 2 characters' });
  }
  
  if (errors.length > 0) {
    throw new ValidationError('Validation failed', errors);
  }
}
```

### Secure Coding Practices

1. **No Hardcoded Secrets**: Use environment variables
2. **HTTPS Only**: Enforce HTTPS in production
3. **CORS Configuration**: Restrict origins appropriately
4. **SQL Injection Prevention**: Use parameterized queries
5. **XSS Prevention**: Sanitize user input, escape output
6. **CSRF Protection**: Implement CSRF tokens for state-changing operations

## Environment Configuration

### Environment Variables

```bash
# Required
NODE_ENV=production
PORT=8080
JWT_SECRET=your-secret-key

# Optional
BOT_NAME=EXPLORABOT
LOG_LEVEL=info
MAX_REQUEST_SIZE=10mb
```

### Configuration Management

```javascript
// config/index.js
require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '8080', 10),
  jwtSecret: process.env.JWT_SECRET,
  
  // Feature flags
  features: {
    aiProcessing: process.env.ENABLE_AI === 'true',
    analytics: process.env.ENABLE_ANALYTICS === 'true',
  },
  
  // Validate required config
  validate() {
    if (!this.jwtSecret && this.env === 'production') {
      throw new Error('JWT_SECRET is required in production');
    }
  },
};

config.validate();
module.exports = config;
```

## Documentation Standards

### Code Comments

```javascript
/**
 * Calculates the total price including tax and discounts
 * 
 * @param {number} basePrice - The base price before calculations
 * @param {number} taxRate - Tax rate as decimal (e.g., 0.1 for 10%)
 * @param {number} discount - Discount amount in currency units
 * @returns {number} The final price
 * @throws {ValidationError} If inputs are invalid
 * 
 * @example
 * const total = calculateTotal(100, 0.1, 5); // Returns 105
 */
function calculateTotal(basePrice, taxRate, discount) {
  if (basePrice < 0 || taxRate < 0 || discount < 0) {
    throw new ValidationError('Values must be non-negative');
  }
  
  return (basePrice - discount) * (1 + taxRate);
}
```

### README Requirements

Every module/package should include:
1. **Purpose**: What the module does
2. **Usage**: How to use it with examples
3. **API**: Public interface documentation
4. **Dependencies**: Required packages and versions
5. **Configuration**: Environment variables and settings

## Continuous Integration

### Pre-commit Checks

1. Linting: ESLint
2. Formatting: Prettier
3. Tests: Unit tests must pass
4. Type checking: If using TypeScript

### CI Pipeline

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build
```

## Performance Budgets

### Mobile Performance Targets

- **First Contentful Paint**: <1.5s
- **Time to Interactive**: <3s
- **Total Bundle Size**: <500KB
- **API Response Time**: <100ms (p95)
- **Memory Usage**: <100MB
- **Battery Impact**: Minimal (measure with Android Battery Historian)

### Monitoring

```javascript
// Track performance metrics
performance.mark('operation-start');
await performOperation();
performance.mark('operation-end');

performance.measure('operation', 'operation-start', 'operation-end');
const measure = performance.getEntriesByName('operation')[0];
console.log(`Operation took ${measure.duration}ms`);
```

## Deployment Standards

### Docker Best Practices

```dockerfile
# Use specific versions
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first (better caching)
COPY package*.json ./

# Install production dependencies only
RUN npm ci --production

# Copy application code
COPY . .

# Run as non-root user
USER node

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD node healthcheck.js

# Start application
CMD ["node", "src/index.js"]
```

### Release Process

1. **Version Bump**: Update version in package.json
2. **Changelog**: Document changes
3. **Tag**: Create git tag (e.g., v1.0.0)
4. **Build**: Create production build
5. **Test**: Run full test suite
6. **Deploy**: Deploy to staging, then production
7. **Monitor**: Watch metrics for issues

## Conclusion

These implementation standards ensure that EXPLORABOT maintains high quality, performance, and maintainability while optimizing for mobile-first platforms. All team members should follow these standards consistently and suggest improvements as the project evolves.
