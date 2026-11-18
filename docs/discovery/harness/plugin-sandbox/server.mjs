/**
 * Plugin sandbox harness: throwaway static server (P-2026-10-31-1800, discovery only, not product code).
 *
 * Three listeners on 127.0.0.1:
 *   - main  (port P):   the host page and the plugin page, as the app's own server would serve them;
 *   - ext   (port P+1): a different origin standing for an external host; every request is logged;
 *   - udp   (port P+2): a UDP socket standing for a STUN server, to observe WebRTC ICE egress.
 * Every request whose path starts with `/hit/<tag>` is logged on either TCP server, WebSocket upgrades
 * included, so egress is measured where it lands and not only from what the plugin's JS observes.
 *
 * CSP modes of the plugin page (`/plugin.html?mode=...`):
 *   none   - no policy (positive control: the vectors must leak here, or the probe measures nothing);
 *   header - the policy in a `Content-Security-Policy` response header, on the page and on `/worker.js`;
 *   meta   - the same policy in a `<meta http-equiv>` tag of the page; `/worker.js` gets no header.
 *
 * Standalone:  node docs/discovery/harness/plugin-sandbox/server.mjs 3061
 */
import http from 'node:http';
import dgram from 'node:dgram';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const BOOT = readFileSync(join(HERE, 'plugin-boot.js'), 'utf8');
const BOOT_HASH = createHash('sha256').update(BOOT, 'utf8').digest('base64');

/**
 * The policy under test. `script-src` admits the inline bootstrap by its hash and the blob: plugin code, nothing
 * else. Run 1 admitted the bootstrap by a nonce (`<script nonce src=/plugin-boot.js>`): a dynamic `import()` from
 * that script inherited the nonce and reached the external origin (CSP3 nonce propagation to module fetches). A
 * hash does not propagate, which is what run 2 measures.
 */
export const CSP_DIRECTIVES = [
    "default-src 'none'",
    `script-src 'sha256-${BOOT_HASH}' blob:`,
    "worker-src 'self' blob:",
    "connect-src 'none'",
    "img-src 'none'",
    "style-src 'none'",
    "font-src 'none'",
    "media-src 'none'",
    "object-src 'none'",
    "frame-src 'none'",
    "child-src 'none'",
    "manifest-src 'none'",
    "form-action 'none'",
    "base-uri 'none'",
];
export const CSP = CSP_DIRECTIVES.join('; ');

function assertPort(port) {
    if (!Number.isInteger(port) || port < 3020 || port > 3097) throw new Error(`port ${port} outside 3020..3097`);
    if ([3000, 3001, 3003].includes(port) || [3000, 3001, 3003].includes(port + 1)) throw new Error('reserved port');
}

function pluginPage(mode, workerSource) {
    const meta = mode === 'meta' ? `<meta http-equiv="Content-Security-Policy" content="${CSP}">` : '';
    if (workerSource.includes('</script') || BOOT.includes('</script')) throw new Error('source cannot be inlined');
    return `<!doctype html><html><head><meta charset="utf-8">${meta}<title>plugin</title></head><body>
<script type="text/plain" id="wsrc">${workerSource}</script>
<script>${BOOT}</script>
</body></html>`;
}

export async function startHarness(port) {
    assertPort(port);
    const hits = [];
    const udpPackets = [];
    const read = (f) => readFileSync(join(HERE, f), 'utf8');

    const logHit = (server, req) => {
        const m = /^\/hit\/([A-Za-z0-9_.-]+?)(\.js)?(\?.*)?$/.exec(req.url || '');
        if (m) hits.push({ server, tag: m[1], method: req.method, origin: req.headers.origin ?? null, t: Date.now() });
        return !!m;
    };

    const main = http.createServer((req, res) => {
        const url = new URL(req.url || '/', `http://127.0.0.1:${port}`);
        const mode = url.searchParams.get('mode') || 'none';
        const csp = mode === 'header' ? { 'Content-Security-Policy': CSP } : {};
        if (logHit('main', req)) {
            res.writeHead(200, { 'Content-Type': 'text/javascript', 'Access-Control-Allow-Origin': '*' });
            return res.end('/* hit */');
        }
        if (url.pathname === '/host.html') {
            res.writeHead(200, { 'Content-Type': 'text/html', 'Set-Cookie': 'hostSecret=cookie-secret; Path=/' });
            return res.end(read('host.html'));
        }
        if (url.pathname === '/plugin.html') {
            res.writeHead(200, { 'Content-Type': 'text/html', ...csp });
            return res.end(pluginPage(mode, read('worker.js')));
        }
        if (url.pathname === '/worker.js') {
            res.writeHead(200, { 'Content-Type': 'text/javascript', ...csp });
            return res.end(read('worker.js'));
        }
        res.writeHead(404);
        res.end();
    });

    const ext = http.createServer((req, res) => {
        logHit('ext', req);
        if ((req.headers.accept || '').includes('text/event-stream')) {
            res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Access-Control-Allow-Origin': '*' });
            return res.end('data: x\n\n');
        }
        res.writeHead(200, { 'Content-Type': 'text/javascript', 'Access-Control-Allow-Origin': '*' });
        res.end('/* external */');
    });
    for (const [name, srv] of [['main', main], ['ext', ext]]) {
        srv.on('upgrade', (req, socket) => { logHit(name, req); socket.destroy(); });
    }

    const udp = dgram.createSocket('udp4');
    udp.on('message', (msg, rinfo) => udpPackets.push({ bytes: msg.length, from: rinfo.address, t: Date.now() }));

    await new Promise((r) => main.listen(port, '127.0.0.1', r));
    await new Promise((r) => ext.listen(port + 1, '127.0.0.1', r));
    await new Promise((r) => udp.bind(port + 2, '127.0.0.1', r));

    return {
        origin: `http://127.0.0.1:${port}`,
        ext: `http://127.0.0.1:${port + 1}`,
        udpPort: port + 2,
        hits,
        udpPackets,
        close: async () => {
            main.closeAllConnections?.();
            ext.closeAllConnections?.();
            await Promise.all([
                new Promise((r) => main.close(r)),
                new Promise((r) => ext.close(r)),
                new Promise((r) => udp.close(r)),
            ]);
        },
    };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
    const h = await startHarness(Number(process.argv[2] || 3061));
    console.log(`host: ${h.origin}/host.html?mode=header   ext: ${h.ext}   udp: ${h.udpPort}`);
}
