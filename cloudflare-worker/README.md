# Jjodel AI Proxy (Cloudflare Worker)

This folder is the source of the Cloudflare Worker `jjodel-ai-proxy`, deployed at
`https://jjodel-ai-proxy.alfonso99.workers.dev`. The frontend calls it for the AI
providers that need a server in front of the browser: today Claude's connection test, and the
model-list routes as a fallback when a direct browser call fails on network or CORS.
It stores nothing: the user's API key travels with each request and is forwarded upstream.

**Do not delete or move this folder.** It is the only copy of the deployed Worker's source.
In April 2026 the folder was removed from the repo together with a committed `node_modules`, and
by October 2026 the deployed Worker had disappeared too (NXDOMAIN), so Claude stopped working until
the source was recovered from git history and redeployed on 2026-10-18.

## Routes

| Route | Upstream |
|---|---|
| `POST /v1/anthropic/messages` | `https://api.anthropic.com/v1/messages` |
| `GET /v1/anthropic/models?limit=&after_id=` | `https://api.anthropic.com/v1/models` |
| `GET /v1/gemini/models?pageSize=&pageToken=` | `https://generativelanguage.googleapis.com/v1beta/models` |
| `POST /v1/gemini/:model/:action` | `https://generativelanguage.googleapis.com/v1beta/models/:model::action` |
| `GET /health` | none: status and the route list |

Auth headers passed through: `x-api-key` and `anthropic-version` for Anthropic, `x-goog-api-key`
(or `?key=`) for Gemini.

## Allowed origins

`ALLOWED_ORIGINS` in `wrangler.toml` lists the exact production origins. On top of them, any
`http://` or `https://` origin whose hostname is `localhost` or `127.0.0.1` is allowed on any port
(Jjodel's dev servers run on 3000, 3001, 3003 and on lane probe ports). A refused origin gets
`403 {"error":"Origin not allowed"}` with no `Access-Control-Allow-Origin` header. Requests with no
`Origin` header (curl, servers) are allowed.

## Deploy

```bash
cd cloudflare-worker
npm ci
npx wrangler login        # once per machine, opens the browser
npx wrangler deploy --dry-run   # bundles without uploading
npm run deploy            # = wrangler deploy
```

Only the account owner deploys. `node_modules/` and `.wrangler/` are gitignored and must never be
committed.

## Which Worker the frontend calls

`AI.getEndpoint()` in `frontend/src/types/jodie.ts` uses the production Worker in every mode,
development included, so `npm start` needs no local Worker. To test changes to this folder
against a local Worker instead:

```bash
cd cloudflare-worker && npm run dev          # wrangler dev on http://localhost:8787
echo 'VITE_AI_PROXY_URL=http://localhost:8787' >> ../frontend/.env.development.local
```

`frontend/.env.development.local` is gitignored. Restart the Vite dev server after changing it,
and remove the line to go back to the production Worker.

## Checks after a deploy

```bash
W=https://jjodel-ai-proxy.alfonso99.workers.dev

# Health: status ok and the route list
curl -s $W/health

# Allowed origin: 401 for the missing key, with Access-Control-Allow-Origin echoed
curl -s -i $W/v1/anthropic/models -H 'Origin: https://app.jjodel.io' | grep -i 'HTTP/\|access-control-allow-origin'

# Local origin on any port: allowed
curl -s -i -X OPTIONS $W/v1/anthropic/models -H 'Origin: http://127.0.0.1:3001' | grep -i 'HTTP/\|access-control-allow-origin'

# Look-alike origin: 403 and no Access-Control-Allow-Origin
curl -s -i $W/v1/anthropic/models -H 'Origin: https://localhost.evil.example' | grep -i 'HTTP/\|access-control-allow-origin'

# With a real key (do not paste keys into shared logs)
curl -s "$W/v1/anthropic/models?limit=5" -H "x-api-key: $ANTHROPIC_API_KEY" -H 'anthropic-version: 2023-06-01'
curl -s "$W/v1/gemini/models?pageSize=5" -H "x-goog-api-key: $GEMINI_API_KEY"
```
