# syntax=docker/dockerfile:1

# Backend Dockerfile for Flask (ASGI via Uvicorn)
# Uses Python 3.12 slim base to keep image small and compatible with popular wheels.

FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# System deps (optional). Uncomment if you hit build issues with scientific libs.
# RUN apt-get update \
#     && apt-get install -y --no-install-recommends build-essential \
#     && rm -rf /var/lib/apt/lists/*

# Install Python dependencies first for better layer caching
COPY requirements.txt ./

# If you face issues installing torch, consider pinning a CPU wheel, e.g.:
# RUN pip install --no-cache-dir --index-url https://download.pytorch.org/whl/cpu torch
# and remove `torch` from requirements.txt, or keep as-is and let pip resolve.
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose the app port
EXPOSE 8000

# Default environment
ENV HOST=0.0.0.0 \
    PORT=8000 \
    API_PREFIX=/api/v1 \
    CORS_ORIGINS=http://localhost:3000

# Run with Uvicorn in production mode (no reload)
CMD ["uvicorn", "asgi:app", "--host", "0.0.0.0", "--port", "8000"]
