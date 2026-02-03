# Code Quality Expectations

## Overview

This document defines the code quality expectations for EXPLORABOT, ensuring that all code contributions meet high standards of excellence, maintainability, and performance, particularly for mobile-first AI applications on platforms like Samsung Galaxy S24 FE.

## Code Quality Pillars

### 1. Readability

**Principle**: Code is read far more often than it is written.

#### Guidelines
- Use clear, descriptive variable and function names
- Keep functions small and focused (ideally <50 lines)
- Use consistent formatting throughout the codebase
- Add comments only when necessary to explain "why", not "what"
- Organize imports logically (built-in, third-party, local)

#### Examples

```javascript
// ❌ Bad: Unclear names, no context
function calc(a, b) {
  return a * b * 0.1;
}

// ✅ Good: Clear names, obvious purpose
function calculateTaxAmount(subtotal, taxRate) {
  return subtotal * taxRate;
}

// ❌ Bad: Too complex, hard to follow
function processData(data) {
  return data.filter(x => x.active).map(x => ({...x, score: x.views * 2 + x.likes * 5})).sort((a, b) => b.score - a.score);
}

// ✅ Good: Broken down, easy to understand
function processData(data) {
  const activeItems = data.filter(item => item.active);
  const scoredItems = calculateScores(activeItems);
  return sortByScore(scoredItems);
}

function calculateScores(items) {
  return items.map(item => ({
    ...item,
    score: calculateEngagementScore(item),
  }));
}

function calculateEngagementScore(item) {
  const VIEW_WEIGHT = 2;
  const LIKE_WEIGHT = 5;
  return item.views * VIEW_WEIGHT + item.likes * LIKE_WEIGHT;
}

function sortByScore(items) {
  return items.sort((a, b) => b.score - a.score);
}
```

### 2. Maintainability

**Principle**: Code should be easy to modify and extend.

#### Guidelines
- Follow SOLID principles
- Use design patterns appropriately
- Minimize coupling between modules
- Maximize cohesion within modules
- Avoid premature optimization
- Refactor regularly to reduce technical debt

#### Examples

```javascript
// ❌ Bad: Tightly coupled, hard to test
class UserService {
  saveUser(user) {
    const db = new Database('mongodb://localhost');
    db.connect();
    db.users.insert(user);
    db.close();
    
    const email = new EmailService('smtp.example.com');
    email.send(user.email, 'Welcome!');
  }
}

// ✅ Good: Loose coupling, dependency injection
class UserService {
  constructor(database, emailService) {
    this.database = database;
    this.emailService = emailService;
  }
  
  async saveUser(user) {
    await this.database.insert('users', user);
    await this.emailService.sendWelcomeEmail(user.email);
  }
}

// Usage with dependency injection
const database = new Database(config.databaseUrl);
const emailService = new EmailService(config.smtpConfig);
const userService = new UserService(database, emailService);
```

### 3. Testability

**Principle**: Code should be designed to be easily testable.

#### Guidelines
- Write small, focused functions with single responsibilities
- Avoid global state and side effects
- Use dependency injection
- Separate business logic from infrastructure
- Make asynchronous code testable

#### Examples

```javascript
// ❌ Bad: Hard to test due to hidden dependencies
function getUserData(userId) {
  const response = fetch(`https://api.example.com/users/${userId}`);
  return response.json();
}

// ✅ Good: Easy to test with mocked dependencies
class UserRepository {
  constructor(apiClient) {
    this.apiClient = apiClient;
  }
  
  async getUserData(userId) {
    return await this.apiClient.get(`/users/${userId}`);
  }
}

// Test
describe('UserRepository', () => {
  it('should fetch user data', async () => {
    const mockApiClient = {
      get: jest.fn().mockResolvedValue({ id: 1, name: 'John' }),
    };
    
    const repo = new UserRepository(mockApiClient);
    const user = await repo.getUserData(1);
    
    expect(mockApiClient.get).toHaveBeenCalledWith('/users/1');
    expect(user).toEqual({ id: 1, name: 'John' });
  });
});
```

### 4. Performance

**Principle**: Optimize for mobile devices without sacrificing code quality.

#### Guidelines
- Profile before optimizing
- Use appropriate data structures and algorithms
- Minimize memory allocations
- Implement lazy loading and code splitting
- Cache expensive computations
- Avoid unnecessary re-renders (React) or DOM manipulations

#### Examples

```javascript
// ❌ Bad: Inefficient, O(n²) complexity
function findDuplicates(array) {
  const duplicates = [];
  for (let i = 0; i < array.length; i++) {
    for (let j = i + 1; j < array.length; j++) {
      if (array[i] === array[j] && !duplicates.includes(array[i])) {
        duplicates.push(array[i]);
      }
    }
  }
  return duplicates;
}

// ✅ Good: Efficient, O(n) complexity
function findDuplicates(array) {
  const seen = new Set();
  const duplicates = new Set();
  
  for (const item of array) {
    if (seen.has(item)) {
      duplicates.add(item);
    } else {
      seen.add(item);
    }
  }
  
  return Array.from(duplicates);
}

// ❌ Bad: Unnecessary computation on every call
function expensiveCalculation(data) {
  const processed = data.map(/* expensive operation */);
  return processed.reduce(/* expensive reduction */);
}

// ✅ Good: Memoization for expensive computations
const memoize = (fn) => {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};

const expensiveCalculation = memoize((data) => {
  const processed = data.map(/* expensive operation */);
  return processed.reduce(/* expensive reduction */);
});
```

### 5. Security

**Principle**: Security is not optional, it's fundamental.

#### Guidelines
- Never trust user input - always validate and sanitize
- Use parameterized queries to prevent SQL injection
- Implement proper authentication and authorization
- Store sensitive data securely (encryption at rest)
- Use HTTPS for all communications
- Keep dependencies updated
- Follow the principle of least privilege

#### Examples

```javascript
// ❌ Bad: SQL injection vulnerability
function getUser(userId) {
  const query = `SELECT * FROM users WHERE id = ${userId}`;
  return database.query(query);
}

// ✅ Good: Parameterized query
function getUser(userId) {
  const query = 'SELECT * FROM users WHERE id = ?';
  return database.query(query, [userId]);
}

// ❌ Bad: Storing sensitive data in plain text
function saveApiKey(userId, apiKey) {
  return database.insert('api_keys', { userId, apiKey });
}

// ✅ Good: Encrypting sensitive data
const crypto = require('crypto');

function encryptData(data, key) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return { encrypted, iv: iv.toString('hex') };
}

function saveApiKey(userId, apiKey) {
  const { encrypted, iv } = encryptData(apiKey, process.env.ENCRYPTION_KEY);
  return database.insert('api_keys', { userId, apiKey: encrypted, iv });
}

// ❌ Bad: Exposing sensitive info in errors
app.post('/api/login', (req, res) => {
  try {
    const user = authenticate(req.body);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.stack });
  }
});

// ✅ Good: Generic error messages
app.post('/api/login', (req, res) => {
  try {
    const user = authenticate(req.body);
    res.json(user);
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
});
```

## Code Review Checklist

### Functionality
- [ ] Does the code do what it's supposed to do?
- [ ] Are edge cases handled properly?
- [ ] Is error handling comprehensive?
- [ ] Are there any obvious bugs?

### Design
- [ ] Is the code well-organized and modular?
- [ ] Does it follow SOLID principles?
- [ ] Are there any code smells (long methods, large classes, etc.)?
- [ ] Could the design be simplified?

### Performance
- [ ] Are there any performance bottlenecks?
- [ ] Is the algorithm complexity appropriate?
- [ ] Is memory usage optimized?
- [ ] Are database queries efficient?

### Security
- [ ] Is user input validated and sanitized?
- [ ] Are there any security vulnerabilities?
- [ ] Is sensitive data properly protected?
- [ ] Are API endpoints properly secured?

### Testing
- [ ] Are there adequate unit tests?
- [ ] Do tests cover edge cases?
- [ ] Are integration tests needed?
- [ ] Do all tests pass?

### Documentation
- [ ] Is the code self-documenting with clear names?
- [ ] Are complex algorithms explained?
- [ ] Is API documentation updated?
- [ ] Are there inline comments where necessary?

### Mobile Optimization
- [ ] Is the code optimized for mobile performance?
- [ ] Are network requests minimized?
- [ ] Is lazy loading implemented where appropriate?
- [ ] Are bundle sizes kept small?

## Code Metrics

### Quantitative Metrics

1. **Test Coverage**
   - Target: 80% overall
   - Critical paths: 100%
   - Measure with: Jest coverage reports

2. **Cyclomatic Complexity**
   - Target: <10 per function
   - Maximum: 20 per function
   - Measure with: ESLint complexity rule

3. **Lines of Code per File**
   - Target: <300 lines
   - Maximum: 500 lines
   - Refactor if exceeded

4. **Code Duplication**
   - Target: <3% duplication
   - Measure with: jscpd or similar tools

5. **Technical Debt Ratio**
   - Target: <5%
   - Measure with: SonarQube or Code Climate

### Qualitative Metrics

1. **Code Review Feedback**
   - Track recurring issues
   - Measure time to approval
   - Monitor number of review iterations

2. **Bug Density**
   - Bugs per 1000 lines of code
   - Target: <1 bug per 1000 LOC

3. **Time to Fix Issues**
   - Measure from report to resolution
   - Target: <24 hours for critical, <1 week for medium

## Quality Gates

### Pre-commit
```bash
# Run before committing
npm run lint          # Check code style
npm run test          # Run unit tests
npm run type-check    # Type checking (if using TypeScript)
```

### Pre-push
```bash
# Run before pushing
npm run test:all      # Run all tests
npm run build         # Ensure code builds
npm run security-check # Check for vulnerabilities
```

### Pull Request Requirements
- All tests passing ✓
- Code review approved ✓
- Coverage maintained or improved ✓
- No security vulnerabilities ✓
- Documentation updated ✓
- Build succeeds ✓

## Common Code Smells and Solutions

### Long Methods

**Problem**: Methods with more than 50 lines are hard to understand and maintain.

```javascript
// ❌ Bad: Long method doing too much
function processOrder(order) {
  // Validate order (10 lines)
  // Calculate totals (15 lines)
  // Apply discounts (20 lines)
  // Process payment (25 lines)
  // Send confirmation (10 lines)
  // Update inventory (15 lines)
}

// ✅ Good: Extracted methods
function processOrder(order) {
  validateOrder(order);
  const totals = calculateTotals(order);
  const finalAmount = applyDiscounts(totals, order.discounts);
  const payment = processPayment(finalAmount, order.paymentMethod);
  sendConfirmation(order, payment);
  updateInventory(order.items);
}
```

### Large Classes

**Problem**: Classes with many responsibilities violate Single Responsibility Principle.

```javascript
// ❌ Bad: God object doing everything
class UserManager {
  createUser() { }
  deleteUser() { }
  sendEmail() { }
  generateReport() { }
  calculateMetrics() { }
  exportData() { }
}

// ✅ Good: Separated concerns
class UserService {
  createUser() { }
  deleteUser() { }
}

class EmailService {
  sendEmail() { }
}

class ReportService {
  generateReport() { }
  calculateMetrics() { }
}

class DataExporter {
  exportData() { }
}
```

### Primitive Obsession

**Problem**: Using primitives instead of small objects for domain concepts.

```javascript
// ❌ Bad: Using primitives
function processPayment(amount, currency, cardNumber, cvv, expiryDate) {
  // Process payment
}

// ✅ Good: Using value objects
class Money {
  constructor(amount, currency) {
    this.amount = amount;
    this.currency = currency;
  }
}

class CreditCard {
  constructor(number, cvv, expiryDate) {
    this.number = number;
    this.cvv = cvv;
    this.expiryDate = expiryDate;
  }
}

function processPayment(money, creditCard) {
  // Process payment
}
```

### Callback Hell

**Problem**: Nested callbacks make code hard to read.

```javascript
// ❌ Bad: Callback hell
function fetchUserData(userId, callback) {
  fetchUser(userId, (user) => {
    fetchOrders(user.id, (orders) => {
      fetchOrderDetails(orders[0].id, (details) => {
        callback(details);
      });
    });
  });
}

// ✅ Good: Using async/await
async function fetchUserData(userId) {
  const user = await fetchUser(userId);
  const orders = await fetchOrders(user.id);
  const details = await fetchOrderDetails(orders[0].id);
  return details;
}
```

## Mobile-Specific Quality Standards

### Battery Efficiency

```javascript
// ❌ Bad: Continuous polling
setInterval(() => {
  checkForUpdates();
}, 1000);

// ✅ Good: Efficient update strategy
// Use WebSocket for real-time updates
const ws = new WebSocket('wss://api.example.com/updates');
ws.onmessage = (event) => {
  handleUpdate(event.data);
};

// Fallback to exponential backoff polling
let pollInterval = 5000;
function pollForUpdates() {
  checkForUpdates().then((hasUpdates) => {
    if (!hasUpdates) {
      pollInterval = Math.min(pollInterval * 2, 60000); // Max 1 minute
    } else {
      pollInterval = 5000; // Reset on update
    }
    setTimeout(pollForUpdates, pollInterval);
  });
}
```

### Memory Management

```javascript
// ❌ Bad: Memory leaks
class ImageGallery {
  constructor() {
    this.images = [];
    window.addEventListener('scroll', () => this.loadMore());
  }
  
  loadMore() {
    // Load more images
    this.images.push(...newImages);
  }
}

// ✅ Good: Proper cleanup
class ImageGallery {
  constructor() {
    this.images = [];
    this.scrollHandler = this.loadMore.bind(this);
    window.addEventListener('scroll', this.scrollHandler);
  }
  
  loadMore() {
    // Load more images with limit
    if (this.images.length < 100) {
      this.images.push(...newImages);
    }
  }
  
  destroy() {
    window.removeEventListener('scroll', this.scrollHandler);
    this.images = [];
  }
}
```

### Network Efficiency

```javascript
// ❌ Bad: Multiple separate requests
async function loadUserDashboard(userId) {
  const user = await fetch(`/api/users/${userId}`);
  const orders = await fetch(`/api/orders?userId=${userId}`);
  const notifications = await fetch(`/api/notifications?userId=${userId}`);
  return { user, orders, notifications };
}

// ✅ Good: Batch request
async function loadUserDashboard(userId) {
  // Single request with all needed data
  const response = await fetch(`/api/dashboard/${userId}`);
  return response.json();
}

// Or use GraphQL for flexible data fetching
const query = `
  query UserDashboard($userId: ID!) {
    user(id: $userId) { name, email }
    orders(userId: $userId) { id, total }
    notifications(userId: $userId) { id, message }
  }
`;
```

## Continuous Improvement

### Regular Refactoring

- Schedule refactoring time in sprints
- Address technical debt proactively
- Update dependencies regularly
- Remove unused code and dependencies

### Learning from Mistakes

- Document post-mortems for production issues
- Share lessons learned with the team
- Update standards based on real-world experience
- Conduct regular retrospectives

### Code Quality Tools

```json
// package.json
{
  "scripts": {
    "lint": "eslint src/**/*.js",
    "lint:fix": "eslint src/**/*.js --fix",
    "test": "jest",
    "test:coverage": "jest --coverage",
    "test:watch": "jest --watch",
    "complexity": "complexity-report src/",
    "security": "npm audit",
    "duplicates": "jscpd src/"
  },
  "devDependencies": {
    "eslint": "^8.0.0",
    "jest": "^29.0.0",
    "complexity-report": "^2.0.0",
    "jscpd": "^3.5.0"
  }
}
```

### ESLint Configuration

```javascript
// .eslintrc.js
module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true,
  },
  extends: ['eslint:recommended'],
  rules: {
    'complexity': ['error', 10],
    'max-lines': ['warn', 300],
    'max-depth': ['error', 3],
    'max-params': ['error', 4],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
};
```

## Conclusion

Maintaining high code quality is essential for EXPLORABOT's success, especially given the performance and resource constraints of mobile platforms like the Samsung Galaxy S24 FE. These expectations provide a framework for writing code that is readable, maintainable, testable, performant, and secure.

By consistently applying these standards, we ensure that EXPLORABOT delivers a high-quality, reliable experience to users while remaining easy to evolve and maintain over time.
