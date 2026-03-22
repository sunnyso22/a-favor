# Docker Build & Deployment Guide

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed
- A `.env` file next to `docker-compose.yml` for Compose **build-arg** substitution and **`env_file`** at runtime

## How this repo builds the image

- **`.dockerignore` excludes `.env*`**, so `.env` is **not** copied into the build context. `next build` only sees variables from the Dockerfile **`ARG` / `ENV`** (and repo files).
- The **Dockerfile** builder stage sets **`NEXT_PUBLIC_METAMASK_API_KEY`** and **`NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`** before `RUN bun run build` (inlined into the client bundle).
- **`docker-compose.yml`** passes those two as **`build.args`** from the host `.env` (or shell).
- **Public app URL (Better Auth / SIWE)** is **not** a `NEXT_PUBLIC_*` build variable here. Set **`BETTER_AUTH_URL`** at **container runtime** (e.g. `env_file` / `environment:`) to the full origin users use (`https://app.example.com`, `http://host:3000`, etc.). **`lib/auth.ts`** reads `process.env.BETTER_AUTH_URL` when the server starts; **`SignInButton`** builds the SIWE message from **`window.location`**, so the browser host must match **`BETTER_AUTH_URL`**.
- If **`BETTER_AUTH_URL`** is missing or wrong, SIWE verification fails because the server’s expected domain will not match the message.

## Build-time vs runtime

**At `next build` (inside the image):** `NEXT_PUBLIC_METAMASK_API_KEY`, `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` (and any other `NEXT_PUBLIC_*` you add to the Dockerfile the same way).

**At container runtime:** `BETTER_AUTH_SECRET`, `DATABASE_URL`, **`BETTER_AUTH_URL`**, etc. Runtime `NEXT_PUBLIC_*` in Compose does **not** change code already compiled at build time.

After changing wallet-related `NEXT_PUBLIC_*`, **rebuild** the image. Changing **`BETTER_AUTH_URL`** only requires **restarting** the container (no rebuild).

## Environment variables

Example **`.env`** next to `docker-compose.yml`:

```env
# Build args (Compose → Dockerfile)
NEXT_PUBLIC_METAMASK_API_KEY=your_metamask_api_key
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id

# Runtime (container)
BETTER_AUTH_SECRET=your_better_auth_secret
BETTER_AUTH_URL=http://localhost:3000
DATABASE_URL="postgresql://user:password@host:port/database"
```

For production, set **`BETTER_AUTH_URL`** to the real public origin (scheme + host, port if not 80/443). Example: `https://app.example.com`.

Do not commit secrets; use CI or a private env file on the host.

## Build and run with Docker Compose

```bash
docker compose build
docker compose up -d
docker compose logs -f
docker compose down
```

## Build and run with Docker directly

```bash
docker build \
  --build-arg NEXT_PUBLIC_METAMASK_API_KEY=your_metamask_api_key \
  --build-arg NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id \
  -t sunnyso22/trexe .

docker run -p 3000:3000 --env-file .env sunnyso22/trexe
```

`--env-file` must include **`BETTER_AUTH_URL`**, **`BETTER_AUTH_SECRET`**, **`DATABASE_URL`**, etc.

## Multi-platform build (Apple Silicon → linux/amd64 VM)

```bash
docker buildx create --name multiplatform --use

docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --build-arg NEXT_PUBLIC_METAMASK_API_KEY=your_metamask_api_key \
  --build-arg NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id \
  -t sunnyso22/trexe:latest \
  --push .
```

Set **`BETTER_AUTH_URL`** (and secrets) on the machine that **runs** the container, not in the build command.

## Push to Docker Hub

```bash
docker login
docker tag trexe-app sunnyso22/trexe:latest
docker push sunnyso22/trexe:latest
```

## Pull and run on a VM

```bash
docker pull sunnyso22/trexe:latest
docker run -d -p 3000:3000 --env-file .env --restart unless-stopped sunnyso22/trexe:latest
```

Ensure **`.env`** on the VM sets **`BETTER_AUTH_URL`** to that server’s public URL.

### Example server Compose (pre-built `image` only)

```yaml
services:
    app:
        image: sunnyso22/trexe:latest
        container_name: app
        ports:
            - "3000:3000"
        environment:
            - BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
            - BETTER_AUTH_URL=${BETTER_AUTH_URL}
            - DATABASE_URL=${DATABASE_URL}
```

Optional: add wallet `NEXT_PUBLIC_*` at runtime only if some server code reads them from `process.env`; they do **not** change the client bundle baked at **`next build`**.
