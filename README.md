# EXPLORABOT 🤖

A Clawdbot-inspired AI assistant deployment bot with containerized deployment support.

## Features

- 🚀 Easy deployment with Docker and Docker Compose
- 🔄 CI/CD pipeline with GitHub Actions
- 💚 Health check endpoints
- 🌐 Web interface for status monitoring
- 🐳 Production-ready containerization

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

## API Endpoints

- `GET /` - Status page with bot information
- `GET /health` - Health check endpoint (returns JSON)

## Configuration

Edit the `.env` file to configure the bot:

```env
BOT_NAME=EXPLORABOT
BOT_PORT=8080
NODE_ENV=production
```

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

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.