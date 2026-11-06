/*
 * Plugin sandbox harness: the worker (P-2026-10-31-1800). Started by the plugin page twice, from a blob: URL
 * and from the same-server URL /worker.js. It stands for the plugin's code: every attempt below is what an
 * untrusted plugin would try. `echo` relays a payload back for the latency measure, `load` imports code
 * delivered by postMessage through a blob: URL (the channel a real host would use to deliver a plugin).
 */
const violations = [];
self.addEventListener('securitypolicyviolation', (e) => violations.push({ thread: 'worker', uri: e.blockedURI, dir: e.effectiveDirective }));

const withTimeout = (p, ms) => Promise.race([p, new Promise((r) => setTimeout(() => r('timeout'), ms || 1500))]);
async function attempt(fn) {
    try {
        const r = await withTimeout(Promise.resolve().then(fn));
        return typeof r === 'string' ? r : 'ok';
    } catch (e) {
        return 'threw:' + ((e && e.name) || String(e));
    }
}

function vectors(SELF, EXT, P) {
    const u = (base, v) => `${base}/hit/${P}-${v}`;
    return {
        fetchSelf: () => fetch(u(SELF, 'fetchSelf')).then((r) => 'ok:' + r.status),
        fetchExt: () => fetch(u(EXT, 'fetchExt'), { mode: 'no-cors' }).then((r) => 'ok:' + r.type),
        xhr: () => new Promise((res) => {
            const x = new XMLHttpRequest();
            x.open('GET', u(EXT, 'xhr'));
            x.onload = () => res('ok:' + x.status);
            x.onerror = () => res('error');
            x.send();
        }),
        websocket: () => new Promise((res) => {
            const w = new WebSocket(u(EXT, 'websocket').replace('http:', 'ws:'));
            w.onopen = () => res('open');
            w.onerror = () => res('error');
        }),
        eventsource: () => new Promise((res) => {
            const es = new EventSource(u(EXT, 'eventsource'));
            es.onopen = () => { es.close(); res('open'); };
            es.onerror = () => { es.close(); res('error'); };
        }),
        beacon: () => (typeof navigator.sendBeacon === 'function' ? (navigator.sendBeacon(u(EXT, 'beacon'), 'x') ? 'queued' : 'refused') : 'absent'),
        importScripts: () => { importScripts(u(EXT, 'importScripts') + '.js'); return 'ok'; },
        importExt: () => import(u(EXT, 'importExt') + '.js').then(() => 'ok'),
        nestedWorker: () => new Promise((res) => {
            const w = new Worker(u(EXT, 'nestedWorker') + '.js');
            w.onerror = () => res('error');
            setTimeout(() => res('created'), 800);
        }),
        indexedDB: () => new Promise((res) => {
            const r = indexedDB.open('hostdb');
            r.onsuccess = () => res('open:stores=' + [...r.result.objectStoreNames].join(','));
            r.onerror = () => res('error:' + (r.error && r.error.name));
        }),
        caches: () => caches.open('x').then(() => 'open'),
        localStorage: () => (typeof localStorage === 'undefined' ? 'absent' : 'present'),
        webrtc: () => (typeof RTCPeerConnection === 'undefined' ? 'absent' : 'present'),
        selfNav: () => { self.location.href = u(EXT, 'selfNav'); return 'assigned:' + String(self.location.href).slice(0, 12); },
    };
}

self.onmessage = async (ev) => {
    const m = ev.data || {};
    if (m.cmd === 'echo') return self.postMessage(m);
    if (m.cmd === 'load') {
        const out = await attempt(() => {
            importScripts(URL.createObjectURL(new Blob([m.code], { type: 'text/javascript' })));
            return 'loaded:' + self.__pluginLoaded;
        });
        return self.postMessage({ cmd: 'load', out });
    }
    if (m.cmd === 'attack') {
        const results = [];
        for (const [name, fn] of Object.entries(vectors(m.SELF, m.EXT, m.prefix))) {
            results.push({ vector: name, js: await attempt(fn) });
        }
        await new Promise((r) => setTimeout(r, 300));
        return self.postMessage({ cmd: 'attack', results, violations, origin: self.origin });
    }
};
self.postMessage({ cmd: 'hello', origin: self.origin, href: String(self.location.href).slice(0, 40) });
