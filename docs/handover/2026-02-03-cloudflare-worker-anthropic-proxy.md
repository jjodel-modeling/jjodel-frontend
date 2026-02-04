# HANDOVER DOCUMENT
## Cloudflare Worker Proxy per Anthropic API
**Data:** 2026-02-03
**Branch:** alfonso-frontend-dev

---

## 1. PROBLEMA RISOLTO

### Contesto
Nella Settings page, il test di connessione per Claude (Anthropic API) falliva con errore CORS:
```
Access to fetch at 'https://api.anthropic.com/v1/messages' from origin 'http://localhost:3000'
has been blocked by CORS policy
```

### Causa
L'API di Anthropic non supporta CORS per chiamate dirette dal browser. A differenza di OpenAI che permette chiamate client-side, Anthropic richiede che le chiamate vengano fatte da un server.

### Soluzione
Creato un Cloudflare Worker che funge da proxy:
1. Il frontend chiama il Worker
2. Il Worker inoltra la richiesta ad Anthropic
3. Il Worker aggiunge gli header CORS alla risposta
4. Il frontend riceve la risposta con CORS valido

---

## 2. FILE CREATI

### Cloudflare Worker (nuova directory)

| File | Descrizione |
|------|-------------|
| `cloudflare-worker/package.json` | Configurazione npm con wrangler e TypeScript |
| `cloudflare-worker/tsconfig.json` | Configurazione TypeScript per Workers |
| `cloudflare-worker/wrangler.toml` | Configurazione deploy Cloudflare (nome, origini CORS) |
| `cloudflare-worker/src/index.ts` | Codice principale del proxy |
| `cloudflare-worker/README.md` | Documentazione setup e testing |

### Struttura del Worker

```typescript
// Endpoints disponibili
GET  /health                    → Health check
POST /v1/anthropic/messages     → Proxy per Anthropic Messages API

// Headers CORS aggiunti
Access-Control-Allow-Origin: [origin richiedente se in whitelist]
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, x-api-key, anthropic-version
```

---

## 3. FILE MODIFICATI

### Frontend

| File | Modifiche |
|------|-----------|
| `frontend/src/types/jodie.ts` | Aggiunti `PROXY_ENDPOINTS`, `PROXY_ENDPOINTS_DEV`, `getProxyEndpoint()` |
| `frontend/src/services/AIProviderService.ts` | `chatClaude()` e `testClaude()` ora usano il proxy invece dell'endpoint diretto |

### Dettaglio modifiche jodie.ts

```typescript
// Proxy endpoints per provider che non supportano CORS
export const PROXY_ENDPOINTS = {
    anthropic: 'https://jjodel-ai-proxy.alfonso99.workers.dev/v1/anthropic/messages',
} as const;

// Per sviluppo locale
export const PROXY_ENDPOINTS_DEV = {
    anthropic: 'http://localhost:8787/v1/anthropic/messages',
} as const;

// Helper per ottenere URL corretto
export function getProxyEndpoint(provider: 'anthropic'): string {
    const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost';
    return isDev ? PROXY_ENDPOINTS_DEV[provider] : PROXY_ENDPOINTS[provider];
}
```

### Dettaglio modifiche AIProviderService.ts

```typescript
// Prima (falliva per CORS)
const response = await fetch(PROVIDER_ENDPOINTS.claude, { ... });

// Dopo (usa proxy)
import { getProxyEndpoint } from '../types/jodie';
const response = await fetch(getProxyEndpoint('anthropic'), { ... });
```

---

## 4. CONFIGURAZIONE CORS

### Origini consentite (wrangler.toml)

```toml
[vars]
ALLOWED_ORIGINS = "https://jjodel.io,https://www.jjodel.io,http://localhost:3000,http://localhost:5173"
```

### Logica CORS nel Worker

1. Se l'origin della richiesta e' in `ALLOWED_ORIGINS`, viene usato come `Access-Control-Allow-Origin`
2. Se non e' in lista, viene restituito 403 Forbidden
3. Preflight OPTIONS viene gestito automaticamente

---

## 5. DEPLOYMENT

### Prerequisiti
- Account Cloudflare (free tier sufficiente)
- Wrangler CLI (`npm install -g wrangler`)

### Comandi

```bash
# Prima volta
cd cloudflare-worker
npm install
npx wrangler login    # Apre browser per autenticazione

# Deploy
npm run deploy        # Deploy su Cloudflare

# Sviluppo locale
npm run dev           # Avvia worker su localhost:8787
```

### Dopo il deploy

1. Copiare l'URL del worker deployato (es. `https://jjodel-ai-proxy.YOUR_SUBDOMAIN.workers.dev`)
2. Aggiornare `PROXY_ENDPOINTS.anthropic` in `frontend/src/types/jodie.ts`

---

## 6. TESTING CHECKLIST

### Test locale
- [ ] Avviare worker locale: `cd cloudflare-worker && npm run dev`
- [ ] Avviare frontend: `cd frontend && npm run dev`
- [ ] Andare su Settings > AI Assistant
- [ ] Selezionare provider "Claude"
- [ ] Inserire API key valida
- [ ] Cliccare "Test Connection"
- [ ] Verificare che il test passi (status 200)

### Test produzione
- [ ] Deployare worker: `cd cloudflare-worker && npm run deploy`
- [ ] Aggiornare URL in `jodie.ts` se necessario
- [ ] Testare su `https://jjodel.io`
- [ ] Verificare che il test connessione funzioni

### Verifica CORS
```bash
# Health check
curl https://jjodel-ai-proxy.YOUR_SUBDOMAIN.workers.dev/health

# Test proxy (sostituire sk-ant-xxx con API key reale)
curl -X POST https://jjodel-ai-proxy.YOUR_SUBDOMAIN.workers.dev/v1/anthropic/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: sk-ant-xxx" \
  -H "anthropic-version: 2023-06-01" \
  -d '{"model":"claude-sonnet-4-20250514","max_tokens":10,"messages":[{"role":"user","content":"Hi"}]}'
```

---

## 7. SICUREZZA

### Implementato
- API key passate attraverso il proxy ma MAI salvate/loggate
- CORS restringe l'accesso alle sole origini autorizzate
- Rate limiting disponibile via Cloudflare dashboard

### Note
- Le API key sono responsabilita' dell'utente finale
- Il worker non salva ne' logga alcun dato sensibile
- Solo le origini in whitelist possono usare il proxy

---

## 8. COSTI

- Cloudflare Workers free tier: 100,000 richieste/giorno
- Sufficiente per sviluppo e uso moderato
- Per alto traffico: Workers Paid plan ($5/mese per 10M richieste)

---

## 9. ESTENSIBILITA'

Per aggiungere altri provider AI che non supportano CORS:

1. Aggiungere endpoint in `cloudflare-worker/src/index.ts`:
   ```typescript
   router.post('/v1/newprovider/endpoint', handleNewProviderProxy);
   ```

2. Aggiungere in `frontend/src/types/jodie.ts`:
   ```typescript
   export const PROXY_ENDPOINTS = {
       anthropic: '...',
       newprovider: 'https://jjodel-ai-proxy.../v1/newprovider/endpoint',
   } as const;
   ```

3. Modificare `getProxyEndpoint()` per supportare il nuovo provider

---

*Ultimo aggiornamento: 2026-02-03*
