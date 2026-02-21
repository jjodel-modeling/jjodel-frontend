/**
 * Jjodel AI Proxy - Cloudflare Worker
 *
 * Multi-provider proxy for AI APIs that don't support browser CORS.
 * Supports: Anthropic (Claude), Google Gemini
 *
 * Routes:
 *   POST /v1/anthropic/messages  → api.anthropic.com/v1/messages
 *   POST /v1/gemini/:model/:action → generativelanguage.googleapis.com/v1beta/models/:model:action
 *   GET  /health                 → Health check
 *
 * Security:
 * - CORS restricted to allowed origins
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

// CORS headers helper
function getCorsHeaders(origin: string, allowedOrigins: string[]): HeadersInit {
    const isAllowed = allowedOrigins.some(
        (allowed) => origin === allowed || (allowed.includes('localhost') && origin.includes('localhost'))
    );

    return {
        'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-api-key, anthropic-version, x-goog-api-key',
        'Access-Control-Max-Age': '86400',
    };
}

// Check if origin is allowed
function isOriginAllowed(origin: string, allowedOrigins: string[]): boolean {
    if (!origin) return true; // Allow no-origin requests (e.g., from server)
    return allowedOrigins.some(
        (allowed) => origin === allowed || (allowed.includes('localhost') && origin.includes('localhost'))
    );
}

// Handle preflight requests
function handleOptions(request: Request, env: Env): Response {
    const origin = request.headers.get('Origin') || '';
    const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());

    return new Response(null, {
        status: 204,
        headers: getCorsHeaders(origin, allowedOrigins),
    });
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
 * Proxy request to Anthropic
 */
async function handleAnthropicProxy(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin') || '';
    const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());
    const corsHeaders = getCorsHeaders(origin, allowedOrigins);

    // Validate origin
    if (!isOriginAllowed(origin, allowedOrigins)) {
        return jsonResponse({ error: 'Origin not allowed' }, 403, corsHeaders);
    }

    // Get API key from request header
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey) {
        return jsonResponse({ error: 'Missing x-api-key header' }, 401, corsHeaders);
    }

    // Get anthropic-version header
    const anthropicVersion = request.headers.get('anthropic-version') || '2023-06-01';

    try {
        // Get request body
        const body = await request.text();

        // Forward request to Anthropic
        const anthropicResponse = await fetch(`${PROVIDERS.anthropic.baseUrl}/v1/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': anthropicVersion,
            },
            body: body,
        });

        // Get response
        const responseBody = await anthropicResponse.text();

        // Return response with CORS headers
        return new Response(responseBody, {
            status: anthropicResponse.status,
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
 * Proxy request to Google Gemini
 *
 * Routes:
 *   POST /v1/gemini/:model/generateContent → generativelanguage.googleapis.com/v1beta/models/:model:generateContent
 *   POST /v1/gemini/:model/streamGenerateContent → streaming version
 */
async function handleGeminiProxy(request: Request, url: URL, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin') || '';
    const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());
    const corsHeaders = getCorsHeaders(origin, allowedOrigins);

    // Validate origin
    if (!isOriginAllowed(origin, allowedOrigins)) {
        return jsonResponse({ error: 'Origin not allowed' }, 403, corsHeaders);
    }

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

    // Get API key from query param or header
    let apiKey = url.searchParams.get('key');
    if (!apiKey) {
        apiKey = request.headers.get('x-goog-api-key');
    }
    if (!apiKey) {
        return jsonResponse(
            { error: 'Missing API key. Pass as ?key= query param or x-goog-api-key header' },
            401,
            corsHeaders
        );
    }

    try {
        // Get request body
        const body = await request.text();

        // Build target URL
        const targetUrl = `${PROVIDERS.gemini.baseUrl}/v1beta/models/${model}:${action}?key=${apiKey}`;

        // Forward request to Gemini
        const geminiResponse = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: body,
        });

        // Get response
        const responseBody = await geminiResponse.text();

        // Return response with CORS headers
        return new Response(responseBody, {
            status: geminiResponse.status,
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

// Main request handler
export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url);
        const origin = request.headers.get('Origin') || '';
        const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());
        const corsHeaders = getCorsHeaders(origin, allowedOrigins);

        // Health check endpoint
        if (url.pathname === '/health') {
            return jsonResponse(
                {
                    status: 'ok',
                    service: 'jjodel-ai-proxy',
                    providers: ['anthropic', 'gemini'],
                    timestamp: new Date().toISOString()
                },
                200,
                corsHeaders
            );
        }

        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return handleOptions(request, env);
        }

        // Route: Anthropic
        if (url.pathname === '/v1/anthropic/messages' && request.method === 'POST') {
            return handleAnthropicProxy(request, env);
        }

        // Route: Gemini (pattern: /v1/gemini/:model/:action)
        if (url.pathname.startsWith('/v1/gemini/') && request.method === 'POST') {
            return handleGeminiProxy(request, url, env);
        }

        // 404 for unknown routes
        return jsonResponse(
            {
                error: 'Not found',
                availableRoutes: [
                    'POST /v1/anthropic/messages',
                    'POST /v1/gemini/:model/:action',
                    'GET /health'
                ]
            },
            404,
            corsHeaders
        );
    },
};
