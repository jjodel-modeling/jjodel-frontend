🌐 The application is publicly accessible at [this link.](https://app.jjodel.io/)

# Installation Guide - JJodel

This guide provides complete instructions for installing and running JJodel in different modes.

## 📋 Prerequisites

### For local development:
- **Node.js** 22.12 or higher (use [nvm](https://github.com/nvm-sh/nvm) to manage versions)
- **npm** 10+ (included with Node.js)
- **Git**

### For Docker deployment:
- **Docker** and **Docker Compose**
- **Git**

## 🚀 Quick Installation with Docker

### Option 1: Pre-built image from Docker Hub

```bash
# Standalone (no backend required)
docker run --rm -p 3000:80 --name jjodel \
  md2manoppello/jjodel-standalone:latest

# Open browser at http://localhost:3000
```

### Option 2: Local build from source
```bash
# Clone the repository
git clone https://github.com/MDEGroup/jjodel.git
cd jjodel

# Build the image
docker build -t jjodel:latest .

# Start the container
docker run --rm -p 3000:80 jjodel:latest

# Open browser at http://localhost:3000
```

## 💻 Development Installation

### 1. Clone the repository
```bash
git clone https://github.com/MDEGroup/jjodel.git
cd jjodel/frontend
```

### 2. Check Node.js version
Vite 7 requires Node.js **22.12+** or **20.19+**. If you use nvm:

```bash
nvm install 22
nvm use 22
node --version  # should be v22.12.0 or higher
```

### 3. Install dependencies
```bash
npm i
```

### 4. Start in development mode
```bash
npm start
```

The application will be available at http://localhost:3000

### 5. Build for production
```bash
CI='' npm run build

# Preview the production build locally
npm run serve
```

## 🐳 Deploy with Docker Compose

```yaml
# docker-compose.yml
version: '3.8'
services:
  jjodel:
    image: md2manoppello/jjodel-standalone:latest
    ports:
      - "3000:80"
    restart: unless-stopped
```

```bash
docker-compose up -d
```

## 🔧 Troubleshooting

### npm dependency errors
```bash
# Clean and reinstall
rm -rf node_modules package-lock.json
npm i
```

### Node.js version error (Vite 7 requirement)
If you see `Vite requires Node.js version 20.19+ or 22.12+`:
```bash
nvm install 22        # installs latest Node 22
nvm use 22
npm start
```

### Build errors
```bash
CI='' npm run build
```

### Docker issues
```bash
# Verify Docker is running
docker --version

# On macOS, start Docker Desktop
open -a Docker
```

## 📚 Available Scripts

From the `frontend/` directory:

```bash
npm start          # Start dev server at http://localhost:3000
npm run build      # Build for production (output: frontend/dist/)
npm run serve      # Preview production build locally
npm run ii         # Clean install (npm i)
npm run dev        # Docker Compose dev environment
```

## 🌐 Automated Deployment

### GitHub Actions Workflows

| Workflow | Trigger branch | Target |
|----------|---------------|--------|
| `staging_test-jjodel(staging).yml` | `staging` | Azure Web App (staging slot) |
| `dotnet-backend-integration_test-jjodel.yml` | `dotnet-backend-integration` | Azure Web App (production slot) |
| `docker-staging.yml` | `staging` | Docker Hub → `jjodel-standalone-staging:latest` |
| `docker.yml` | `dotnet-backend-integration` | Docker Hub → `jjodel-standalone:latest` |
| `docker-microserices.yml` | `dotnet-backend-integration` | Docker Hub → `jjodel-microservices:latest` |

### Required GitHub Secrets

| Secret | Used by |
|--------|---------|
| `DOCKERHUB_USERNAME` | Docker workflows |
| `DOCKERHUB_TOKEN` | Docker workflows |
| `AZUREAPPSERVICE_CLIENTID_*` | Azure deploy workflows |
| `AZUREAPPSERVICE_TENANTID_*` | Azure deploy workflows |
| `AZUREAPPSERVICE_SUBSCRIPTIONID_*` | Azure deploy workflows |

## 🔗 Access URLs

| Environment | URL |
|-------------|-----|
| Main website | https://www.jjodel.io/ |
| Production app | https://app.jjodel.io |
| Local dev | http://localhost:3000 |
| Local Docker | http://localhost:3000 |

## 🎨 Design System

The application uses a custom design system documented in [`CLAUDE.md`](CLAUDE.md):

- **Color Palette**: Slate base (`#0f172a`) with Cyan accents (`#0ea5e9`)
- **Typography**: System fonts + IBM Plex Mono for code
- **Icons**: Bootstrap Icons (`bi bi-*`) exclusively
- **Spacing**: 8px grid base

For full design system reference: [`docs/DESIGN-SYSTEM.md`](docs/DESIGN-SYSTEM.md)

## ⚠️ Important Notes

- **Build output**: Vite outputs to `frontend/dist/` (not `build/`)
- **CI variable**: Set `CI=''` for production builds to suppress warnings-as-errors
- **Ports**: Make sure port 3000 is available for local development

## 🆘 Support

If you encounter issues:
1. Check Node.js version (`node --version`, must be 22.12+)
2. Delete `node_modules` and run `npm i` again
3. Open an issue at [github.com/MDEGroup/jjodel](https://github.com/MDEGroup/jjodel/issues)

## ✉️ Contact

[Mail](mailto:info@jjodel.io)

---

**Last updated**: April 2026
