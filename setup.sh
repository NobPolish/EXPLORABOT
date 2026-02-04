#!/bin/bash

# EXPLORABOT Setup Script
# Automates the installation and startup of EXPLORABOT
# Usage: ./setup.sh [local|docker|help]

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Bot name
BOT_NAME="EXPLORABOT"

# Docker compose command (set during check)
DOCKER_COMPOSE_CMD=""

# Print colored message
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Print header
print_header() {
    echo ""
    print_message "$BLUE" "╔════════════════════════════════════════════════════════╗"
    print_message "$BLUE" "║                    🤖 $BOT_NAME                         ║"
    print_message "$BLUE" "║        AI Assistant with NLP Zero-Code Interface        ║"
    print_message "$BLUE" "╚════════════════════════════════════════════════════════╝"
    echo ""
}

# Check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Show help
show_help() {
    print_header
    echo "Usage: ./setup.sh [OPTION]"
    echo ""
    echo "Options:"
    echo "  local     Set up and run locally with Node.js"
    echo "  docker    Set up and run with Docker"
    echo "  help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./setup.sh local    # Run locally with npm"
    echo "  ./setup.sh docker   # Run with Docker Compose"
    echo ""
}

# Setup environment file
setup_env() {
    if [ ! -f .env ]; then
        print_message "$YELLOW" "📝 Creating .env file from template..."
        cp .env.example .env
        print_message "$GREEN" "✅ .env file created"
    else
        print_message "$GREEN" "✅ .env file already exists"
    fi
}

# Check Node.js version
check_node() {
    if ! command_exists node; then
        print_message "$RED" "❌ Node.js is not installed."
        print_message "$YELLOW" "Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    fi

    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_message "$RED" "❌ Node.js version 18+ is required (current: $(node -v))"
        exit 1
    fi

    print_message "$GREEN" "✅ Node.js $(node -v) detected"
}

# Check Docker
check_docker() {
    if ! command_exists docker; then
        print_message "$RED" "❌ Docker is not installed."
        print_message "$YELLOW" "Please install Docker from https://docs.docker.com/get-docker/"
        exit 1
    fi
    print_message "$GREEN" "✅ Docker detected"

    # Determine which docker compose command to use
    if docker compose version >/dev/null 2>&1; then
        DOCKER_COMPOSE_CMD="docker compose"
    elif command_exists docker-compose; then
        DOCKER_COMPOSE_CMD="docker-compose"
    else
        print_message "$RED" "❌ Docker Compose is not installed."
        print_message "$YELLOW" "Please install Docker Compose from https://docs.docker.com/compose/install/"
        exit 1
    fi
    print_message "$GREEN" "✅ Docker Compose detected"
}

# Install Node.js dependencies
install_dependencies() {
    print_message "$YELLOW" "📦 Installing dependencies..."
    npm install || {
        print_message "$RED" "❌ Failed to install dependencies"
        print_message "$YELLOW" "Please check your npm configuration and try again"
        exit 1
    }
    print_message "$GREEN" "✅ Dependencies installed"
}

# Run locally with Node.js
run_local() {
    print_header
    print_message "$BLUE" "🚀 Starting EXPLORABOT locally..."
    echo ""

    check_node
    setup_env
    install_dependencies

    echo ""
    print_message "$GREEN" "╔════════════════════════════════════════════════════════╗"
    print_message "$GREEN" "║                   EXPLORABOT is ready!                  ║"
    print_message "$GREEN" "╚════════════════════════════════════════════════════════╝"
    echo ""
    print_message "$BLUE" "📡 Starting server..."
    print_message "$YELLOW" "   Web Interface: http://localhost:8080"
    print_message "$YELLOW" "   Health Check:  http://localhost:8080/health"
    print_message "$YELLOW" "   Demo Page:     http://localhost:8080/demo"
    echo ""
    print_message "$BLUE" "Press Ctrl+C to stop the server"
    echo ""

    npm start || {
        print_message "$RED" "❌ Server failed to start"
        exit 1
    }
}

# Run with Docker
run_docker() {
    print_header
    print_message "$BLUE" "🐳 Starting EXPLORABOT with Docker..."
    echo ""

    check_docker
    setup_env

    print_message "$YELLOW" "📦 Building Docker image..."

    # Use the detected docker compose command
    $DOCKER_COMPOSE_CMD up --build -d || {
        print_message "$RED" "❌ Failed to start Docker containers"
        exit 1
    }

    echo ""
    print_message "$GREEN" "╔════════════════════════════════════════════════════════╗"
    print_message "$GREEN" "║           EXPLORABOT is running in Docker!             ║"
    print_message "$GREEN" "╚════════════════════════════════════════════════════════╝"
    echo ""
    print_message "$YELLOW" "   Web Interface: http://localhost:8080"
    print_message "$YELLOW" "   Health Check:  http://localhost:8080/health"
    print_message "$YELLOW" "   Demo Page:     http://localhost:8080/demo"
    echo ""
    print_message "$BLUE" "Useful Docker commands:"
    echo "   View logs:     $DOCKER_COMPOSE_CMD logs -f"
    echo "   Stop:          $DOCKER_COMPOSE_CMD down"
    echo "   Restart:       $DOCKER_COMPOSE_CMD restart"
    echo ""
}

# Main entry point
main() {
    case "${1:-local}" in
        local)
            run_local
            ;;
        docker)
            run_docker
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_message "$RED" "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
}

main "$@"
