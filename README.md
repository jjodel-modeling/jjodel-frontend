🌐 The application is publicly accessible at [this link.](https://app.jjodel.io/)

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
npm i

# Install react-json-view (requires --force)
npm i react-json-view --force --no-save
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
npm i react-json-view --force --legacy-peer-deps --no-save
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

# Utilities
npm run ii             # Install dependencies (including react-json-view)
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

- **Main website** https://www.jjodel.io/
- **Public deployment**: https://app.jjodel.io
- **Local development**: http://localhost:3000
- **Local Docker**: http://localhost:3000 (or configured port)


## 🎨 Recent UI/UX Improvements

**Latest Update**: January 24, 2026

The Jjodel frontend has undergone significant UI/UX improvements following a modern design system:

### Design System
- **Color Palette**: Slate base (#475569) with Cyan accents (#06b6d4)
- **Typography**: Inter Variable font family with consistent sizing
- **Spacing**: Systematic 8px-based spacing scale
- **Components**: Production-ready UI component library

### Key Features
- ✅ **10 Reusable UI Components** - Button, Input, Select, Textarea, Toggle, Field, FormSection, Label, HelpText, ErrorText
- ✅ **Design Tokens** - Complete CSS custom properties system
- ✅ **Accessibility** - WCAG AA compliant with keyboard navigation
- ✅ **TypeScript** - Fully typed with strict mode
- ✅ **Responsive** - Mobile-first, adaptive layouts

### Documentation
For detailed UI/UX documentation, see:
- [`/docs/handover/HANDOVER-UI-REDESIGN-2026-01-24.md`](/docs/handover/HANDOVER-UI-REDESIGN-2026-01-24.md) - Latest improvements
- [`/docs/CHANGELOG.md`](/docs/CHANGELOG.md) - Complete change history
- [`/docs/redesign/implementation-log.md`](/docs/redesign/implementation-log.md) - Technical implementation details
- [`/CLAUDE.md`](/CLAUDE.md) - Complete design system specification

### Development Methodology
This project uses **Agentic Conversational Development (ACD)** - a collaborative methodology where humans work with AI agents through iterative dialogue:
- [`/docs/AGENTIC-CONVERSATIONAL-DEVELOPMENT.md`](/docs/AGENTIC-CONVERSATIONAL-DEVELOPMENT.md) - Full methodology documentation

## 📖 Additional Documentation

- `README.md` - General project information
- `DOCKER_README.md` - Docker-specific details
- `frontend/package.json` - Dependencies and scripts configuration
- `/docs/` - Complete project documentation

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

## ✉️Contact us
[Mail](mailto:info@jjodel.io)
---

**Document version**: 2.0
**Last updated**: January 24, 2026
