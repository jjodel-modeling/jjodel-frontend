# Jjodel AI Proxy

Cloudflare Worker proxy for AI APIs that don't support browser CORS.

## Supported Providers

| Provider | Route | Target |
|----------|-------|--------|
| **Anthropic (Claude)** | `POST /v1/anthropic/messages` | `api.anthropic.com/v1/messages` |
| **Google Gemini** | `POST /v1/gemini/:model/:action` | `generativelanguage.googleapis.com/v1beta/models/:model:action` |

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Login to Cloudflare:
   ```bash
   npx wrangler login
   ```

3. Deploy:
   ```bash
   npm run deploy
   ```

4. Note the deployed URL (e.g., `https://jjodel-ai-proxy.YOUR_SUBDOMAIN.workers.dev`)

5. Update the frontend `PROXY_ENDPOINTS` in `frontend/src/types/jodie.ts` with your worker URL.

## Local Development

```bash
npm run dev
```

This starts the worker locally at `http://localhost:8787`.

## Configuration

Edit `wrangler.toml` to update allowed origins:

```toml
[vars]
ALLOWED_ORIGINS = "http://localhost:3000,http://localhost:5173,https://jjodel.io"
```

## API Usage

### Anthropic (Claude)

```bash
curl -X POST https://jjodel-ai-proxy.YOUR_SUBDOMAIN.workers.dev/v1/anthropic/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: sk-ant-YOUR_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-sonnet-4-20250514",
    "max_tokens": 100,
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

### Google Gemini

```bash
curl -X POST "https://jjodel-ai-proxy.YOUR_SUBDOMAIN.workers.dev/v1/gemini/gemini-1.5-flash/generateContent?key=YOUR_GEMINI_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{"parts": [{"text": "Hello!"}]}]
  }'
```

### Health Check

```bash
curl https://jjodel-ai-proxy.YOUR_SUBDOMAIN.workers.dev/health
```

Response:
```json
{
  "status": "ok",
  "service": "jjodel-ai-proxy",
  "providers": ["anthropic", "gemini"],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Security

- **CORS**: Only allowed origins can make requests
- **Rate Limiting**: Configure in Cloudflare dashboard
- **No Key Storage**: API keys are passed through from client, never stored

## Costs

Cloudflare Workers free tier includes 100,000 requests/day.
