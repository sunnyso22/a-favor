# Docker Build & Deployment Guide

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed
- A `.env` file in the project root (see [Environment Variables](#environment-variables))

## Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Metamask
NEXT_PUBLIC_METAMASK_API_KEY=your_metamask_api_key

# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id

# Better Auth
BETTER_AUTH_SECRET=your_better_auth_secret
BETTER_AUTH_URL=http://localhost:3000

# Supabase
DATABASE_URL="postgresql://user:password@host:port/database"

# Twitter
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret
```

## Build & Run with Docker Compose

```bash
# Build the image
docker compose build

# Start the container (detached)
docker compose up -d

# View logs
docker compose logs -f

# Stop the container
docker compose down
```

The app will be available at `http://localhost:3000`.

## Build & Run with Docker Directly

```bash
# Build the image
docker build -t sunnyso22/a-favor .

# Run the container
docker run -p 3000:3000 --env-file .env sunnyso22/a-favor
```

## Multi-Platform Build (for deploying to amd64 VMs from Apple Silicon)

If you're building on an Apple Silicon Mac and deploying to a linux/amd64 VM, you need a multi-platform build:

```bash
# Create a buildx builder (one-time setup)
docker buildx create --name multiplatform --use

# Build and push for both architectures
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t sunnyso22/a-favor:latest \
  --push .
```

## Push to Docker Hub

```bash
# Log in to Docker Hub
docker login

# If you built with docker compose, tag the image first
docker tag a-favor-app sunnyso22/a-favor:latest

# Push
docker push sunnyso22/a-favor:latest
```

## Pull & Run on a VM

```bash
# Pull the image
docker pull sunnyso22/a-favor:latest

# Run with an env file
docker run -d -p 3000:3000 --env-file .env --restart unless-stopped sunnyso22/a-favor:latest
```
