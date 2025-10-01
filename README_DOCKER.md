# Clutch Call - Docker Setup

This repo contains a Python (Flask via ASGI) backend and a Next.js frontend. This guide shows how to build and run both with Docker on Windows (cmd).

## Prerequisites
- Docker Desktop installed and running
- Optional: Git for Windows

## Services
- Backend: Python 3.12, Uvicorn, exposed on port 8000
- Frontend: Next.js 15, exposed on port 3000

## Quick start (local dev with hot reload)
This uses docker-compose and a dev target for the frontend with file mounting.

```cmd
REM From the repo root
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend: http://localhost:8000

The frontend container is started with `NEXT_PUBLIC_API_BASE_URL=http://backend:8000/api/v1` and the code volume-mounted for live reload. The backend exposes CORS for localhost and the frontend service host.

## Production-style images
Build standalone images without mounts.

Backend:
```cmd
cd backend
docker build -t clutch-call-backend:prod .
```
Run:
```cmd
docker run --rm -p 8000:8000 ^
  -e HOST=0.0.0.0 -e PORT=8000 -e API_PREFIX=/api/v1 ^
  -e CORS_ORIGINS=http://localhost:3000 clutch-call-backend:prod
```

Frontend (builder/runner stages use Next standalone output):
```cmd
cd frontend
docker build -t clutch-call-frontend:prod .
```
Run:
```cmd
docker run --rm -p 3000:3000 ^
  -e NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1 clutch-call-frontend:prod
```

## Notes on Torch
Installing `torch` on slim images can require specific wheels. If the generic install fails, either:
- Pin a CPU wheel via PyPI/extra index and remove `torch` from requirements.txt, or
- Uncomment a dedicated torch install step in `backend/Dockerfile`.

## Environment variables
- Backend: HOST, PORT, API_PREFIX, CORS_ORIGINS
- Frontend: NEXT_PUBLIC_API_BASE_URL

## Troubleshooting
- If you see CORS errors, confirm `CORS_ORIGINS` includes the domain of your frontend (localhost:3000).
- If frontend fails to fetch, verify `NEXT_PUBLIC_API_BASE_URL` and that the backend is reachable from the frontend container (service name `backend`, port 8000).
- Rebuild after dependency changes: `docker compose build --no-cache`.

```
Repo structure reference:
- backend/ (Flask app exposed via ASGI)
- frontend/ (Next.js app)
- docker-compose.yml (dev orchestrator)
```
