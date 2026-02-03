# EXPLORABOT 🤖

A Clawdbot-inspired AI assistant deployment bot with containerized deployment support, optimized for mobile-first platforms like Samsung Galaxy S24 FE.

## 📚 Documentation

**New to EXPLORABOT?** Start with our comprehensive documentation:

- **[Documentation Index](./docs/README.md)** - Complete guide to the project
- **[Senior AI Architect Persona](./docs/AI_ARCHITECT_PERSONA.md)** - Technical leadership and expertise
- **[Implementation Standards](./docs/IMPLEMENTATION_STANDARDS.md)** - Coding standards and best practices
- **[Design Practices Guide](./docs/DESIGN_PRACTICES.md)** - UI/UX design guidelines for mobile
- **[Code Quality Expectations](./docs/CODE_QUALITY_EXPECTATIONS.md)** - Quality standards and metrics
- **[Mobile-First Platform Guidelines](./docs/MOBILE_PLATFORM_GUIDELINES.md)** - Samsung Galaxy S24 FE optimization

## Features

- 🚀 Easy deployment with Docker and Docker Compose
- 🚂 One-click deployment to Railway
- 🔄 CI/CD pipeline with GitHub Actions
- 💚 Health check endpoints
- 🌐 Web interface for status monitoring
- 🐳 Production-ready containerization
- 📱 Mobile-first design optimized for Samsung Galaxy S24 FE
- 🤖 Advanced AI capabilities with on-device optimization
- ⚡ High-performance architecture for 120Hz displays
- 🔋 Battery-efficient AI processing

## Quick Start

### Prerequisites

- Node.js 18+ (for local development)
- Docker and Docker Compose (for containerized deployment)

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/NobPolish/EXPLORABOT.git
cd EXPLORABOT
```

2. Install dependencies:
```bash
npm install
```

3. Create environment configuration:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start the bot:
```bash
npm start
```

The bot will be available at `http://localhost:8080`

### Docker Deployment

#### Using Docker Compose (Recommended)

1. Create your `.env` file:
```bash
cp .env.example .env
```

2. Start the bot:
```bash
docker-compose up -d
```

3. Check status:
```bash
docker-compose ps
docker-compose logs -f
```

4. Stop the bot:
```bash
docker-compose down
```

#### Using Docker directly

```bash
# Build the image
docker build -t explorabot .

# Run the container
docker run -d \
  --name explorabot \
  -p 8080:8080 \
  --env-file .env \
  --restart unless-stopped \
  explorabot
```

### Railway Deployment

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/new?template=https://github.com/NobPolish/EXPLORABOT)

Railway provides one-click deployment with automatic HTTPS and monitoring.

#### Deploy to Railway

1. Click the "Deploy on Railway" button above or visit [Railway](https://railway.app)
2. Connect your GitHub account
3. Select this repository
4. Configure environment variables:
   - `PORT` (automatically set by Railway, no need to configure)
   - `BOT_NAME` (optional, defaults to EXPLORABOT)
   - Add any additional API keys as needed
5. Deploy!

Railway will automatically:
- Build the Docker image
- Deploy to a production environment
- Provide a public URL with HTTPS
- Monitor health via the `/health` endpoint
- Auto-restart on failures

#### Railway Configuration

The repository includes a `railway.json` configuration file that specifies:
- Docker-based build process
- Health check endpoint at `/health`
- Automatic restart policy on failures

#### Updating Your Railway Deployment

Railway automatically redeploys when you push to your connected branch. You can also manually trigger deployments from the Railway dashboard.

## API Endpoints

- `GET /` - Status page with bot information
- `GET /health` - Health check endpoint (returns JSON)

## Configuration

Edit the `.env` file to configure the bot:

```env
BOT_NAME=EXPLORABOT
BOT_PORT=8080  # For local development (Railway uses PORT automatically)
NODE_ENV=production
```

**Note for Railway:** Railway automatically sets the `PORT` environment variable. The application will prioritize `PORT` over `BOT_PORT`, so you don't need to configure it when deploying to Railway.

## GitHub Actions

This repository includes two workflows:

- **CI** (`.github/workflows/ci.yml`) - Runs tests and builds on push/PR
- **Deploy** (`.github/workflows/deploy.yml`) - Deploys to Docker Hub on tagged releases

### Setting up deployment

1. Add Docker Hub credentials as GitHub secrets:
   - `DOCKER_USERNAME`
   - `DOCKER_PASSWORD`

2. Create a release tag to trigger deployment:
```bash
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

## Production Deployment

### Railway (Recommended for Quick Deployment)

Railway offers the easiest deployment experience with automatic scaling and built-in monitoring:

1. Click the "Deploy on Railway" button in the README
2. Connect your GitHub account
3. Configure environment variables
4. Your bot will be live with HTTPS in minutes!

Railway provides:
- Automatic HTTPS certificates
- Built-in monitoring and logs
- Easy environment variable management
- Automatic deployments from GitHub
- Free tier available

### On a VPS or Cloud Server

1. SSH into your server
2. Install Docker and Docker Compose
3. Clone the repository
4. Configure the `.env` file
5. Run `docker-compose up -d`

### Health Monitoring

The bot includes a health check endpoint at `/health` that returns:
```json
{
  "status": "healthy",
  "bot": "EXPLORABOT",
  "timestamp": "2026-02-03T09:00:00.000Z"
}
```

Use this endpoint for monitoring and load balancer health checks.

## Development

### Scripts

- `npm start` - Start the bot
- `npm run dev` - Start with auto-reload (Node.js 18+)
- `npm test` - Run tests

## Development Standards

EXPLORABOT follows strict development standards for quality and performance:

- **Code Quality**: 80%+ test coverage, <10 cyclomatic complexity
- **Performance**: <2s app launch, <100ms API response, 60fps+ rendering
- **Mobile-First**: Optimized for Samsung Galaxy S24 FE and similar devices
- **Security**: No hardcoded secrets, input validation, regular audits
- **Testing**: Comprehensive unit, integration, and E2E tests

See the [Implementation Standards](./docs/IMPLEMENTATION_STANDARDS.md) for complete details.

## License

MIT

## Contributing

Contributions are welcome! Before contributing:

1. Read the [Documentation Index](./docs/README.md) to understand the project
2. Follow [Implementation Standards](./docs/IMPLEMENTATION_STANDARDS.md) for code style
3. Ensure [Code Quality Expectations](./docs/CODE_QUALITY_EXPECTATIONS.md) are met
4. Apply [Design Practices](./docs/DESIGN_PRACTICES.md) for UI changes
5. Optimize per [Mobile-First Platform Guidelines](./docs/MOBILE_PLATFORM_GUIDELINES.md)

Please open an issue or submit a pull request.