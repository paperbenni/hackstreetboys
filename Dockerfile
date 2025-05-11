# Use Node.js as the base image
FROM node:20-slim AS base

# Install Python and pip
RUN apt-get update && apt-get install -y \
    python3 \
    python3-venv \
    python3-pip \
    build-essential \
    pkg-config \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user and group
RUN groupadd -r appuser && useradd -m -r -g appuser appuser

# Set the working directory
WORKDIR /app

# Create and activate a virtual environment for Python
RUN python3 -m venv /app/venv
ENV PATH="/app/venv/bin:$PATH"

# Install markitdown Python package in the virtual environment
RUN pip3 install --no-cache-dir 'markitdown[all]'

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY --chown=appuser:appuser . .

# Build the application
RUN npm run build

# Set ownership of the application directory to the non-root user
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose the port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]