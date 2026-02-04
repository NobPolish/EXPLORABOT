# EXPLORABOT - GitHub Copilot Instructions

This file provides context and guidelines for GitHub Copilot when working on this repository.

## Project Overview

EXPLORABOT is a Clawdbot-inspired AI assistant deployment bot with:
- **Natural Language Processing (NLP)** capabilities
- **Zero-code interface** for non-technical users
- **Mobile-first design** optimized for Samsung Galaxy S24 FE
- Easy deployment via Docker, Docker Compose, and Railway

## Tech Stack

- **Runtime**: Node.js 18+
- **Core Dependencies**: 
  - `dotenv` (environment configuration)
  - `ws` (WebSocket support)
- **Deployment**: Docker, Docker Compose, Railway
- **CI/CD**: GitHub Actions
- **Target Platform**: Mobile-first (Samsung Galaxy S24 FE optimization)

## Project Structure

```
EXPLORABOT/
├── .github/          # GitHub configuration and workflows
├── docs/             # Comprehensive documentation
├── src/              # Source code
│   ├── index.js      # Main application entry point
│   └── nlp-processor.js # NLP processing logic
├── package.json      # Node.js dependencies and scripts
├── Dockerfile        # Container build configuration
├── docker-compose.yml # Docker Compose configuration
└── setup.sh          # Automated setup script
```

## Key Commands

### Development
```bash
npm install           # Install dependencies
npm start            # Start the bot
npm run dev          # Start with auto-reload (Node.js 18+)
npm test             # Run tests
```

### Docker
```bash
docker-compose up -d # Start with Docker Compose
docker-compose down  # Stop containers
docker-compose logs -f # View logs
```

### Setup Script
```bash
./setup.sh local     # Local development setup
./setup.sh docker    # Docker-based setup
./setup.sh help      # Show all options
```

## Development Standards

### Code Quality
- Keep cyclomatic complexity under 10
- Follow existing code style and patterns
- Write clear, maintainable code with minimal comments
- Test changes manually when test infrastructure is not yet established
- Target 80%+ test coverage when test framework is implemented

### Performance Requirements
- App launch time: < 2 seconds
- API response time: < 100ms
- UI rendering: 60fps+
- Optimize for mobile devices and battery efficiency

### Security
- Never commit secrets or API keys
- Always validate user input
- Use environment variables for sensitive data
- Follow security best practices

### Mobile-First Design
- Optimize for Samsung Galaxy S24 FE and similar devices
- Ensure responsive UI across different screen sizes
- Consider battery efficiency in implementation
- Test on mobile devices when possible

## Important Files - DO NOT MODIFY

When making changes, avoid modifying these critical files unless absolutely necessary:

- `.github/workflows/*.yml` - CI/CD pipelines (only modify if specifically requested)
- `package-lock.json` - Dependency lock file (let npm manage this)
- `Dockerfile` - Production container config (only modify for deployment changes)
- `setup.sh` - Automated setup script (only modify for setup logic changes)

## Documentation Structure

The project has comprehensive documentation in `/docs/`:
- `README.md` - Documentation index
- `NLP_ZERO_CODE_GUIDE.md` - Natural language interface usage
- `AI_ARCHITECT_PERSONA.md` - Technical leadership guidance
- `IMPLEMENTATION_STANDARDS.md` - Coding standards
- `DESIGN_PRACTICES.md` - UI/UX design guidelines
- `CODE_QUALITY_EXPECTATIONS.md` - Quality standards
- `MOBILE_PLATFORM_GUIDELINES.md` - Mobile optimization

**Always reference and follow these guides** when making changes to the respective areas.

## API Endpoints

Current endpoints:
- `GET /` - Status page with bot information
- `GET /health` - Health check endpoint (returns JSON)
- `POST /api/chat` - NLP chat endpoint

When adding new endpoints, ensure they:
- Follow RESTful conventions
- Include proper error handling
- Return appropriate HTTP status codes
- Are documented in the README.md

## Testing Guidelines

**Note**: This project does not yet have a formal test framework. Current testing approach:
- Manually test all changes locally using `npm start`
- Test with Docker using `docker-compose up`
- Verify endpoints using curl or browser
- Check logs for errors and warnings

When implementing a test framework:
- Write tests for all new features
- Ensure tests are consistent with existing project structure
- Choose an appropriate framework (e.g., Jest, Mocha)
- Aim for 80%+ test coverage

## Environment Configuration

The bot uses environment variables configured in `.env`:
- `BOT_NAME` - Bot name (default: EXPLORABOT)
- `BOT_PORT` - Port for local development (default: 8080)
- `NODE_ENV` - Environment mode (development/production)

**Railway deployment**: Railway automatically sets `PORT`, which overrides `BOT_PORT`.

## Contribution Workflow

1. Understand the existing code and documentation
2. Follow the implementation standards
3. Make minimal, focused changes
4. Test thoroughly (local and Docker)
5. Update relevant documentation
6. Ensure all checks pass in CI/CD

## Best Practices for AI Agents

When working on this repository:
- Read existing documentation before making changes
- Follow the established code style and patterns
- Make minimal changes to achieve the goal
- Test changes in both development and Docker environments
- Update documentation when adding features or changing behavior
- Consider mobile performance and battery efficiency
- Never hardcode sensitive information
- Validate user inputs and handle errors gracefully

## Common Tasks

### Adding a New Feature
1. Review relevant documentation in `/docs/`
2. Implement the feature following coding standards
3. Add or update tests
4. Update README.md with usage examples
5. Test locally and with Docker

### Fixing a Bug
1. Reproduce the issue
2. Identify the root cause
3. Implement the fix with minimal changes
4. Add tests to prevent regression
5. Verify the fix in multiple environments

### Updating Dependencies
1. Check for security vulnerabilities
2. Test compatibility with existing code
3. Update package.json and run `npm install`
4. Test thoroughly before committing
5. Document any breaking changes

## Contact and Resources

- Repository: https://github.com/NobPolish/EXPLORABOT
- Documentation: See `/docs/` directory
- Issues: GitHub Issues tab
- License: MIT
