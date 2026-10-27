/**
 * Jjodel AI Proxy - Cloudflare Worker
 *
 * Multi-provider proxy for AI APIs called from the browser.
 * Supports: Anthropic (Claude), Google Gemini
 *
 * Routes:
 *   POST /v1/anthropic/messages      → api.anthropic.com/v1/messages
 *   GET  /v1/anthropic/models        → api.anthropic.com/v1/models (limit, after_id passed through)
 *   GET  /v1/gemini/models           → generativelanguage.googleapis.com/v1beta/models (pageSize, pageToken passed through)
 *   POST /v1/gemini/:model/:action   → generativelanguage.googleapis.com/v1beta/models/:model:action
 *   GET  /health                     → Health check, lists the routes
 *
 * Security:
 * - CORS restricted to the listed origins, plus http(s)://localhost and 127.0.0.1 on any port
 * - A refused origin gets 403 and no Access-Control-Allow-Origin
 * - Rate limiting via Cloudflare (configure in dashboard)
 * - No API keys stored - passed through from client
 *
 * Deploy: wrangler deploy
 */

export interface Env {
    ALLOWED_ORIGINS: string;
}

// Provider configurations
const PROVIDERS = {
    anthropic: {
        baseUrl: 'https://api.anthropic.com',
    },
    gemini: {
        baseUrl: 'https://generativelanguage.googleapis.com',
    },
} as const;

const ROUTES = [
    'POST /v1/anthropic/messages',
    'GET /v1/anthropic/models',
    'GET /v1/gemini/models',
    'POST /v1/gemini/:model/:action',
    'GET /health',
];

const LOCAL_HOSTNAMES = ['localhost', '127.0.0.1'];

function getAllowedOrigins(env: Env): string[] {
    return env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean);
}

// An origin is allowed when it is listed exactly, or when its hostname is a local one
// (any port). The hostname is parsed, so "https://localhost.example.com" is refused.
function isOriginAllowed(origin: string, allowedOrigins: string[]): boolean {
    if (!origin) return true; // Allow no-origin requests (e.g., from server)
    if (allowedOrigins.includes(origin)) return true;
    try {
        const url = new URL(origin);
        return (url.protocol === 'http:' || url.protocol === 'https:') && LOCAL_HOSTNAMES.includes(url.hostname);
    } catch {
        return false;
    }
}

// CORS headers helper: no Access-Control-Allow-Origin unless the origin is allowed.
function getCorsHeaders(origin: string, allowedOrigins: string[]): Record<string, string> {
    const headers: Record<string, string> = {
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-api-key, anthropic-version, x-goog-api-key',
        'Access-Control-Max-Age': '86400',
        'Vary': 'Origin',
    };
    if (origin && isOriginAllowed(origin, allowedOrigins)) {
        headers['Access-Control-Allow-Origin'] = origin;
    }
    return headers;
}

// JSON response helper
function jsonResponse(
    data: object,
    status: number,
    corsHeaders: HeadersInit
): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
        },
    });
}

/**
 * Forward a request upstream and return its body and status with CORS headers.
 */
async function forward(targetUrl: string, init: RequestInit, corsHeaders: HeadersInit): Promise<Response> {
    try {
        const upstream = await fetch(targetUrl, init);
        const responseBody = await upstream.text();
        return new Response(responseBody, {
            status: upstream.status,
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
            },
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return jsonResponse({ error: `Proxy error: ${errorMessage}` }, 500, corsHeaders);
    }
}

/**
 * Copy the named query parameters, when present, onto the target URL.
 */
function passQuery(source: URL, target: URL, names: string[]): void {
    for (const name of names) {
        const value = source.searchParams.get(name);
        if (value !== null) target.searchParams.set(name, value);
    }
}

/**
 * Proxy request to Anthropic: POST /v1/anthropic/messages
 */
async function handleAnthropicProxy(request: Request, corsHeaders: HeadersInit): Promise<Response> {
    // Get API key from request header
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey) {
        return jsonResponse({ error: 'Missing x-api-key header' }, 401, corsHeaders);
    }

    // Get anthropic-version header
    const anthropicVersion = request.headers.get('anthropic-version') || '2023-06-01';

    return forward(`${PROVIDERS.anthropic.baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': anthropicVersion,
        },
        body: await request.text(),
    }, corsHeaders);
}

/**
 * List Anthropic models: GET /v1/anthropic/models?limit=&after_id=
 */
async function handleAnthropicModels(request: Request, url: URL, corsHeaders: HeadersInit): Promise<Response> {
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey) {
        return jsonResponse({ error: 'Missing x-api-key header' }, 401, corsHeaders);
    }
    const anthropicVersion = request.headers.get('anthropic-version') || '2023-06-01';

    const target = new URL(`${PROVIDERS.anthropic.baseUrl}/v1/models`);
    passQuery(url, target, ['limit', 'after_id']);

    return forward(target.toString(), {
        method: 'GET',
        headers: {
            'x-api-key': apiKey,
            'anthropic-version': anthropicVersion,
        },
    }, corsHeaders);
}

// Gemini API key from the x-goog-api-key header or the ?key= query param
function getGeminiKey(request: Request, url: URL): string | null {
    return request.headers.get('x-goog-api-key') || url.searchParams.get('key');
}

/**
 * List Gemini models: GET /v1/gemini/models?pageSize=&pageToken=
 */
async function handleGeminiModels(request: Request, url: URL, corsHeaders: HeadersInit): Promise<Response> {
    const apiKey = getGeminiKey(request, url);
    if (!apiKey) {
        return jsonResponse(
            { error: 'Missing API key. Pass as x-goog-api-key header or ?key= query param' },
            401,
            corsHeaders
        );
    }

    const target = new URL(`${PROVIDERS.gemini.baseUrl}/v1beta/models`);
    passQuery(url, target, ['pageSize', 'pageToken']);

    return forward(target.toString(), {
        method: 'GET',
        headers: {
            'x-goog-api-key': apiKey,
        },
    }, corsHeaders);
}

/**
 * Proxy request to Google Gemini
 *
 * Routes:
 *   POST /v1/gemini/:model/generateContent → generativelanguage.googleapis.com/v1beta/models/:model:generateContent
 *   POST /v1/gemini/:model/streamGenerateContent → streaming version
 */
async function handleGeminiProxy(request: Request, url: URL, corsHeaders: HeadersInit): Promise<Response> {
    // Parse path: /v1/gemini/:model/:action
    const pathParts = url.pathname.split('/').filter(Boolean);
    // Expected: ['v1', 'gemini', 'model-name', 'generateContent']
    if (pathParts.length < 4) {
        return jsonResponse(
            { error: 'Invalid path. Expected: /v1/gemini/:model/:action' },
            400,
            corsHeaders
        );
    }

    const model = pathParts[2];
    const action = pathParts[3];

    const apiKey = getGeminiKey(request, url);
    if (!apiKey) {
        return jsonResponse(
            { error: 'Missing API key. Pass as ?key= query param or x-goog-api-key header' },
            401,
            corsHeaders
        );
    }

    return forward(`${PROVIDERS.gemini.baseUrl}/v1beta/models/${model}:${action}?key=${apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: await request.text(),
    }, corsHeaders);
}

// Main request handler
export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url);
        const origin = request.headers.get('Origin') || '';
        const allowedOrigins = getAllowedOrigins(env);
        const corsHeaders = getCorsHeaders(origin, allowedOrigins);

        // Refused origin: 403 without Access-Control-Allow-Origin, on every route
        if (!isOriginAllowed(origin, allowedOrigins)) {
            return jsonResponse({ error: 'Origin not allowed' }, 403, corsHeaders);
        }

        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: corsHeaders });
        }

        // Health check endpoint
        if (url.pathname === '/health') {
            return jsonResponse(
                {
                    status: 'ok',
                    service: 'jjodel-ai-proxy',
                    providers: ['anthropic', 'gemini'],
                    routes: ROUTES,
                    timestamp: new Date().toISOString()
                },
                200,
                corsHeaders
            );
        }

        // Routes: Anthropic
        if (url.pathname === '/v1/anthropic/messages' && request.method === 'POST') {
            return handleAnthropicProxy(request, corsHeaders);
        }
        if (url.pathname === '/v1/anthropic/models' && request.method === 'GET') {
            return handleAnthropicModels(request, url, corsHeaders);
        }

        // Routes: Gemini (list, then pattern /v1/gemini/:model/:action)
        if (url.pathname === '/v1/gemini/models' && request.method === 'GET') {
            return handleGeminiModels(request, url, corsHeaders);
        }
        if (url.pathname.startsWith('/v1/gemini/') && request.method === 'POST') {
            return handleGeminiProxy(request, url, corsHeaders);
        }

        // 404 for unknown routes
        return jsonResponse(
            {
                error: 'Not found',
                availableRoutes: ROUTES,
            },
            404,
            corsHeaders
        );
    },
};
