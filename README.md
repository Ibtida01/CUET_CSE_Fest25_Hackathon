# Hackathon Challenge

Your challenge is to take this simple e-commerce backend and turn it into a fully containerized microservices setup using Docker and solid DevOps practices.

## Problem Statement

The backend setup consisting of:

- A service for managing products
- A gateway that forwards API requests

The system must be containerized, secure, optimized, and maintain data persistence across container restarts.

## Architecture

```
                    ┌─────────────────┐
                    │   Client/User   │
                    └────────┬────────┘
                             │
                             │ HTTP (port 5921)
                             │
                    ┌────────▼────────┐
                    │    Gateway      │
                    │  (port 5921)    │
                    │   [Exposed]     │
                    └────────┬────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
         ┌──────────▼──────────┐      │
         │   Private Network   │      │
         │  (Docker Network)   │      │
         └──────────┬──────────┘      │
                    │                 │
         ┌──────────┴──────────┐      │
         │                     │      │
    ┌────▼────┐         ┌──────▼──────┐
    │ Backend │         │   MongoDB   │
    │(port    │◄────────┤  (port      │
    │ 3847)   │         │  27017)     │
    │[Not     │         │ [Not        │
    │Exposed] │         │ Exposed]    │
    └─────────┘         └─────────────┘
```

**Key Points:**
- Gateway is the only service exposed to external clients (port 5921)
- All external requests must go through the Gateway
- Backend and MongoDB should not be exposed to public network

## Project Structure

**DO NOT CHANGE THE PROJECT STRUCTURE.** The following structure must be maintained:

```
.
├── backend/
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   └── src/
├── gateway/
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   └── src/
├── docker/
│   ├── compose.development.yaml
│   └── compose.production.yaml
├── Makefile
└── README.md
```

## Environment Variables

Create a `.env` file in the root directory with the following variables (do not commit actual values):

```env
MONGO_INITDB_ROOT_USERNAME=
MONGO_INITDB_ROOT_PASSWORD=
MONGO_URI=
MONGO_DATABASE=
BACKEND_PORT=3847 # DO NOT CHANGE
GATEWAY_PORT=5921 # DO NOT CHANGE 
NODE_ENV=
```

## Expectations (Open ended, DO YOUR BEST!!!)

- Separate Dev and Prod configs
- Data Persistence
- Follow security basics (limit network exposure, sanitize input) 
- Docker Image Optimization
- Makefile CLI Commands for smooth dev and prod deploy experience (TRY TO COMPLETE THE COMMANDS COMMENTED IN THE Makefile)

**ADD WHAT EVER BEST PRACTICES YOU KNOW**

## Testing

Use the following curl commands to test your implementation.

### Health Checks

Check gateway health:
```bash
curl http://localhost:5921/health
```

Check backend health via gateway:
```bash
curl http://localhost:5921/api/health
```

### Product Management

Create a product:
```bash
curl -X POST http://localhost:5921/api/products \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test Product","price":99.99}'
```

Get all products:
```bash
curl http://localhost:5921/api/products
```

### Security Test

Verify backend is not directly accessible (should fail or be blocked):
```bash
curl http://localhost:3847/api/products
```

## Features & Enhancements
### Docker Optimization
- Multi-stage builds for smaller images
- Exclude dev dependencies in production images
- Non-root user execution
- Minimal base images (alpine / slim)

## Security
- Non-root containers
- Environment variables for secrets; no secrets in git
- CI/CD pipeline scans
- Resource limits (cpu, memory)
- Data Persistence
- MongoDB volumes for dev/prod
- Dev/Prod Separation
- compose.development.yaml → hot reload, volume mounts
- compose.production.yaml → immutable containers, auth enabled
- Separate .env files for dev/prod
- CI/CD & Security Scanning