# Installation Guide - JJodel

This guide provides complete instructions for installing and running JJodel in different modes.

## 📋 Prerequisites

### For local development:
- **Node.js** 22.x or higher
- **npm** (included with Node.js)
- **Git**

### For Docker deployment:
- **Docker** and **Docker Compose**
- **Git**

## 🚀 Quick Installation with Docker

### Option 1: Pre-built image
```bash
# Download and run the image from Docker Hub
docker pull md2manoppello/jjodel:latest
docker run -p 3000:80 md2manoppello/jjodel:latest

# Open browser at http://localhost:3000
```

### Option 2: Local build
```bash
# Clone the repository
git clone https://github.com/MDEGroup/jjodel.git
cd jjodel

# Build the image
docker build -t jjodel:latest .

# Start the container
docker run -p 3000:80 jjodel:latest

# Open browser at http://localhost:3000
```

## 💻 Development Installation

### 1. Clone the repository
```bash
git clone https://github.com/MDEGroup/jjodel.git
cd jjodel/frontend
```

### 2. Install dependencies
```bash
# Install main dependencies
npm i --legacy-peer-deps

# Install react-json-view (requires --force)
npm i react-json-view --force --legacy-peer-deps
```

### 3. Configure environment
```bash
# Set Node.js options for compatibility
export NODE_OPTIONS=--openssl-legacy-provider
```

### 4. Start in development mode
```bash
npm run start
```

The application will be available at http://localhost:3000

### 5. Build for production
```bash
# Set CI variable
CI='' npm run build

# Serve static files
npm run serve
```

## 🐳 Deploy with Docker Compose

### 1. Create docker-compose.yml
```yaml
version: '3.8'
services:
  jjodel:
    image: md2manoppello/jjodel:latest
    ports:
      - "3000:80"
    restart: unless-stopped
    environment:
      - NGINX_ENVSUBST_TEMPLATE_SUFFIX=.template
```

### 2. Start services
```bash
docker-compose up -d
```

## 🔧 Troubleshooting

### npm dependency errors
If you encounter errors during dependency installation:

```bash
# Clean npm cache
npm cache clean --force

# Remove node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall with correct options
npm i --legacy-peer-deps
npm i react-json-view --force --legacy-peer-deps
```

### Build errors
For build issues:

```bash
# Make sure to set environment variables
export NODE_OPTIONS=--openssl-legacy-provider
export CI=''

# Try building
npm run build
```

### Docker issues
If Docker won't start:

```bash
# Verify Docker is running
docker --version

# On macOS, start Docker Desktop
open -a Docker
```

## 📚 Available Scripts

In the `package.json` file, these scripts are available:

```bash
# Development
npm run start          # Start in development mode
npm run build          # Build for production
npm run serve          # Serve production build
npm run test           # Run tests

# Utilities
npm run ii             # Install dependencies (includes react-json-view)
npm run dev            # Docker compose for development
```

## 🌐 Automated Deployment

### GitHub Actions
The project includes automatic workflows for:
- **Docker build and push** on push to `master` branch
- **Azure deploy** on push to `dotnet-backend-integration` branch

### Secrets Configuration
For automatic deployment, configure these secrets in GitHub:
- `DOCKER_HUB_USERNAME`
- `DOCKER_HUB_PASSWORD`

## 🔗 Access URLs

- **Local development**: http://localhost:3000
- **Local Docker**: http://localhost:3000 (or configured port)
- **Public deployment**: https://mdegroup.github.io/jjodel/build

## 📖 Additional Documentation

- `README.md` - General project information
- `DOCKER_README.md` - Docker-specific details
- `frontend/package.json` - Dependencies and scripts configuration

## ⚠️ Important Notes

1. **Node.js Legacy**: The project requires `--openssl-legacy-provider` for compatibility
2. **React JSON View**: Requires installation with `--force` due to dependency conflicts
3. **CI Variable**: Set `CI=''` for production builds
4. **Ports**: Make sure port 3000 is available

## 🆘 Support

If you encounter issues:
1. Check prerequisites
2. Verify environment variables
3. Review error logs
4. Open an issue in the GitHub repository

---

**Document version**: 1.0  
**Last updated**: September 18, 2025
