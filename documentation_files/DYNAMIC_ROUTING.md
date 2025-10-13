# Dynamic API Routing Configuration

This application now supports dynamic API routing based on the production environment.

## Environment Configuration

The application uses the `NEXT_PUBLIC_PRODUCTION` environment variable to determine which API endpoints to use:

- **Development**: `NEXT_PUBLIC_PRODUCTION=false` → Uses `http://127.0.0.1:8000/api/v1`
- **Production**: `NEXT_PUBLIC_PRODUCTION=true` → Uses `https://clutch-call.onrender.com/api/v1`

## Configuration Files

### Frontend Environment Variables
Create or update `frontend/.env.local`:
```
NEXT_PUBLIC_PRODUCTION=false
```

### Root Environment Variables
The root `.env` file contains:
```
PRODUCTION=false
NEXT_PUBLIC_PRODUCTION=false
```
