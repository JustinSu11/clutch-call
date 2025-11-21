# Production Deployment Guide

## Running in Production (Recommended)

For production deployments on platforms like Render, Railway, or any other hosting service, use the production server script that leverages Gunicorn with Uvicorn workers for better stability and performance.

### Starting the Production Server

```bash
python run_server_prod.py
```

### Configuration

The production server can be configured via environment variables:

- **HOST**: Host to bind to (default: `0.0.0.0`)
- **PORT**: Port to bind to (default: `8000`)
- **WORKERS**: Number of worker processes (default: `4`)

### Why Gunicorn + Uvicorn Workers?

The production server uses Gunicorn as a process manager with Uvicorn workers. This combination provides:

1. **Better Stability**: Avoids threading issues with `asgiref.wsgi.WsgiToAsgi` adapter that can occur under heavy load when using Uvicorn directly (`RuntimeError: CurrentThreadExecutor already quit or is broken`)
2. **Process Management**: Gunicorn manages multiple worker processes for better resource utilization
3. **Graceful Restarts**: Allows zero-downtime deployments
4. **Production-Ready**: Industry standard for serving ASGI applications

### Render Configuration

For Render deployments, set the following:

**Build Command:**
```bash
pip install -r requirements.txt
```

**Start Command:**
```bash
python run_server_prod.py
```

**Environment Variables:**
- `PORT`: Automatically set by Render
- `WORKERS`: Set to `4` (or adjust based on your instance size)
- `HOST`: Set to `0.0.0.0` (already default)

### Development vs Production

- **Development** (`run_server.py`): Uses Uvicorn directly with reload capability for local development
- **Production** (`run_server_prod.py`): Uses Gunicorn with Uvicorn workers for production stability

## Health Check

The `/api/v1/health` endpoint is available for health checks and returns:

```json
{"status": "healthy"}
```

This endpoint supports both GET and OPTIONS methods and is CORS-enabled for cross-origin requests.
