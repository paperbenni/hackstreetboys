#!/bin/bash
# docker-run.sh - Script to build and run the application with Docker

set -e  # Exit immediately if a command exits with a non-zero status

# Display script banner
echo "===================================="
echo "  HackStreetBoys Docker Deployment  "
echo "===================================="
echo ""

# Check for .env file
if [ ! -f .env ]; then
    echo "No .env file found. Creating one from .env.example..."
    cp .env.example .env
    echo "Please edit .env with your actual API keys before continuing."
    echo "Press Enter to continue after editing, or Ctrl+C to exit now."
    read
fi

# Function to display help message
show_help() {
    echo "Usage: ./docker-run.sh [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -b, --build    Force rebuild of the Docker image"
    echo "  -d, --dev      Run in development mode (with hot reloading)"
    echo "  -h, --help     Display this help message"
    echo ""
    echo "Examples:"
    echo "  ./docker-run.sh          # Run with existing image"
    echo "  ./docker-run.sh --build  # Force rebuild image"
    echo ""
}

# Default values
FORCE_BUILD=false
DEV_MODE=false

# Parse command line arguments
while [ "$1" != "" ]; do
    case $1 in
        -b | --build )    FORCE_BUILD=true
                          ;;
        -d | --dev )      DEV_MODE=true
                          ;;
        -h | --help )     show_help
                          exit
                          ;;
        * )               echo "Unknown option: $1"
                          show_help
                          exit 1
    esac
    shift
done

# Check if Docker is installed and running
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed or not in PATH."
    echo "Please install Docker and try again."
    exit 1
fi

if ! docker info &> /dev/null; then
    echo "Error: Docker daemon is not running."
    echo "Please start Docker and try again."
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker compose &> /dev/null; then
    echo "Docker Compose v2 not found. Checking for docker-compose..."
    
    if ! command -v docker-compose &> /dev/null; then
        echo "Error: Neither Docker Compose v2 nor docker-compose is installed."
        echo "Please install Docker Compose and try again."
        exit 1
    else
        # Using legacy docker-compose
        COMPOSE_CMD="docker-compose"
    fi
else
    # Using Docker Compose v2
    COMPOSE_CMD="docker compose"
fi

# Set development mode if requested
if [ "$DEV_MODE" = true ]; then
    echo "Running in development mode with hot reloading..."
    export NODE_ENV=development
    COMPOSE_FILE="-f docker-compose.yml -f docker-compose.dev.yml"
else
    COMPOSE_FILE=""
fi

# Build the Docker image if it doesn't exist or rebuild is forced
if [ "$FORCE_BUILD" = true ]; then
    echo "Forcing rebuild of the Docker image..."
    ${COMPOSE_CMD} ${COMPOSE_FILE} build --no-cache
else
    # Check if image exists
    if ! docker images | grep -q "hackstreetboys-app"; then
        echo "Docker image not found. Building..."
        ${COMPOSE_CMD} ${COMPOSE_FILE} build
    fi
fi

# Run the Docker container
echo "Starting HackStreetBoys application..."
${COMPOSE_CMD} ${COMPOSE_FILE} up

echo "Done. HackStreetBoys application is now running in Docker."