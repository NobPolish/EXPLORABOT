FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy application files
COPY src/ ./src/

# Accept PORT as a build argument (Railway provides this)
ARG PORT
ENV PORT=${PORT:-8080}

# Expose port (dynamically set by Railway)
EXPOSE ${PORT}

# Set environment
ENV NODE_ENV=production

# Health check (using PORT variable)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const port = process.env.PORT || 8080; require('http').get('http://localhost:' + port + '/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Run the application
CMD ["npm", "start"]
