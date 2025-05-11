# Docker deployment for HackStreetBoys

This document provides instructions for deploying the HackStreetBoys application using Docker.

## Prerequisites

- Docker installed on your system
- Docker Compose installed on your system
- An OpenRouter API key (for PDF processing functionality)

## Quick Start

The easiest way to run the application is to use the provided helper script:

```bash
./docker-run.sh
```

This script will:
1. Check for a `.env` file and create one from the example if needed
2. Build the Docker image if it doesn't exist
3. Start the application with Docker Compose

## Manual Setup

### Environment Variables

1. Copy the example environment file to create your own:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file and add your OpenRouter API key:
   ```
   OPENAI_KEY=your_openrouter_api_key_here
   ```

### Building and Running

To build and run the application with Docker Compose:

```bash
# Build the image
docker compose build

# Run the containers
docker compose up

# Or run in detached mode
docker compose up -d
```

## Development Mode

For development with hot reloading:

```bash
# Using the helper script
./docker-run.sh --dev

# Or manually
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

## Customization

### Ports

The default port is 3000. To change it, modify the ports mapping in `docker-compose.yml` or add a PORT environment variable.

### Image Rebuilding

To force a rebuild of the Docker image:

```bash
# Using the helper script
./docker-run.sh --build

# Or manually
docker compose build --no-cache
```

## Troubleshooting

### PDF Processing Issues

If you experience issues with PDF processing:

1. Verify that the `markitdown` package was installed correctly in the container:
   ```bash
   docker compose exec hackstreetboys-app pip3 list | grep markitdown
   ```

2. Test the `markitdown` CLI tool inside the container:
   ```bash
   docker compose exec hackstreetboys-app markitdown --help
   ```

### Connection Issues

If you can't connect to the application:

1. Verify the container is running:
   ```bash
   docker compose ps
   ```

2. Check the container logs:
   ```bash
   docker compose logs
   ```

## Technical Details

### Container Components

The application container includes:

- Node.js 20 for the Next.js application
- Python 3 with the `markitdown[all]` package for PDF processing
- Required system libraries for PDF handling and image processing

### Volume Mounts

The following volumes are mounted:

- In production mode: A temporary volume for `/tmp`
- In development mode: The local directory is mounted to enable hot reloading

## Security Considerations

- The application container runs as a non-root user
- Sensitive information like API keys should be provided through environment variables
- The `.env` file should never be committed to version control

## Cleanup

To stop and remove the containers:

```bash
docker compose down
```

To also remove the volumes:

```bash
docker compose down -v
```
