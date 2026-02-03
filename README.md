# EXPLORABOT 🤖

A Clawdbot-inspired AI assistant deployment bot with containerized deployment support.

## Features

- 🚀 Easy deployment with Docker and Docker Compose
- 🚂 One-click deployment to Railway
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

### Railway Deployment

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/new?template=https://github.com/NobPolish/EXPLORABOT)

Railway provides one-click deployment with automatic HTTPS and monitoring.

#### Deploy to Railway

#### Quick Deploy to Railway (Recommended)

1. Click the "Deploy on Railway" button above
2. Authorize Railway to access your GitHub account
3. Railway will automatically:
   - Fork/connect the repository
   - Detect the Dockerfile
   - Build and deploy the application
   - Generate a public HTTPS URL
   - Set up automatic redeployments on Git push
4. Once deployed, visit your app URL to see it running!

**Note:** The template button creates a new Railway project linked to this repository. For existing forks or custom configurations, see the manual deployment steps below.

Railway will automatically:
- Build the Docker image
- Deploy to a production environment
- Provide a public URL with HTTPS
- Monitor health via the `/health` endpoint
- Auto-restart on failures

#### Railway Configuration

The repository includes Railway configuration files that specify:
- `railway.toml` and `railway.json` - Railway service configuration
- `Procfile` - Process startup command
- `Dockerfile` - Container build instructions
- Docker-based build process
- Health check endpoint at `/health`
- Automatic restart policy on failures

#### Manual Railway Deployment Steps

If you prefer to deploy manually instead of using the button:

1. **Sign up/Login to Railway**
   - Visit [railway.app](https://railway.app) and sign in with your GitHub account

2. **Create a New Project**
   - Click "New Project" from your Railway dashboard
   - Select "Deploy from GitHub repo"
   - Choose the `NobPolish/EXPLORABOT` repository (or your fork)

3. **Configure Environment Variables** (Optional)
   - Railway automatically sets the `PORT` variable
   - You can add custom variables like:
     - `BOT_NAME` - Custom bot name (defaults to EXPLORABOT)
     - `NODE_ENV` - Set to "production"
     - Any API keys your bot needs

4. **Deploy**
   - Railway will automatically detect the Dockerfile and deploy
   - Your app will be built and deployed in seconds
   - Railway provides a public URL (e.g., `https://your-app.railway.app`)

5. **Monitor Your Deployment**
   - View logs in real-time from the Railway dashboard
   - Check the health endpoint: `https://your-app.railway.app/health`
   - Monitor resource usage and metrics

#### Updating Your Railway Deployment

Railway automatically redeploys when you push to your connected branch. You can also manually trigger deployments from the Railway dashboard.

#### Railway Deployment Troubleshooting

**Build Fails:**
- Check the Railway build logs for specific error messages
- Ensure all dependencies are listed in `package.json`
- Verify the Dockerfile builds locally: `docker build -t test .`

**App Not Starting:**
- Check that the PORT environment variable is being used correctly
- Review application logs in the Railway dashboard
- Verify the health check endpoint is responding: `/health`

**Can't Access the App:**
- Ensure your Railway service has a public domain assigned
- Check that the application is listening on `0.0.0.0` (not just `localhost`)
- Verify the PORT environment variable is correctly set

**Need Help?**
- Check Railway's [documentation](https://docs.railway.app/)
- Visit Railway's [Discord community](https://discord.gg/railway)
- Review the deployment logs in your Railway dashboard

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

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.