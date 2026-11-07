/*
 * Plugin sandbox harness: the plugin page's bootstrap (P-2026-10-31-1800). Runs in
 * <iframe sandbox="allow-scripts"> (opaque origin). On `run` from the host it tries every main-thread vector,
 * then starts the worker from a blob: URL and from /worker.js and has each try the worker vectors. It relays
 * `echo` between host and the blob worker for the latency measure. With `?only=<vector>` it runs that one
 * vector alone: the ones that would navigate or replace the frame (selfNav, formSubmit, metaRefresh, topNav,
 * windowOpen) each run in a fresh frame.
 */
(() => {
    const q = new URLSearchParams(location.search);
    const only = q.get('only');
    const violations = [];
    document.addEventListener('securitypolicyviolation', (e) => violations.push({ thread: 'main', uri: e.blockedURI, dir: e.effectiveDirective }));
    const toHost = (m) => parent.postMessage(m, '*');

    const withTimeout = (p, ms) => Promise.race([p, new Promise((r) => setTimeout(() => r('timeout'), ms || 1500))]);
    async function attempt(fn) {
        try {
            const r = await withTimeout(Promise.resolve().then(fn));
            return typeof r === 'string' ? r : 'ok';
        } catch (e) {
            return 'threw:' + ((e && e.name) || String(e));
        }
    }
    const el = (tag, attrs, events) => new Promise((res) => {
        const e = document.createElement(tag);
        for (const k of Object.keys(events || {})) e.addEventListener(k, () => res(events[k]));
        for (const k of Object.keys(attrs)) e.setAttribute(k, attrs[k]);
        document.body.appendChild(e);
        setTimeout(() => res('appended'), 1200);
    });

    function mainVectors(SELF, EXT, P, UDP) {
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
            beacon: () => (navigator.sendBeacon(u(EXT, 'beacon'), 'x') ? 'queued' : 'refused'),
            importExt: () => import(u(EXT, 'importExt') + '.js').then(() => 'ok'),
            img: () => el('img', { src: u(EXT, 'img') }, { load: 'load', error: 'error' }),
            linkCss: () => el('link', { rel: 'stylesheet', href: u(EXT, 'linkCss') }, { load: 'load', error: 'error' }),
            linkPrefetch: () => el('link', { rel: 'prefetch', href: u(EXT, 'linkPrefetch') }, { load: 'load', error: 'error' }),
            script: () => el('script', { src: u(EXT, 'script') + '.js' }, { load: 'load', error: 'error' }),
            nestedIframe: () => el('iframe', { src: u(EXT, 'nestedIframe') }, { load: 'load', error: 'error' }),
            webrtc: async () => {
                const pc = new RTCPeerConnection({ iceServers: [{ urls: `stun:127.0.0.1:${UDP}` }] });
                pc.createDataChannel('x');
                await pc.setLocalDescription(await pc.createOffer());
                await new Promise((r) => {
                    pc.onicegatheringstatechange = () => pc.iceGatheringState === 'complete' && r();
                    setTimeout(r, 1300);
                });
                const state = pc.iceGatheringState;
                pc.close();
                return 'gathering:' + state;
            },
            parentLocalStorage: () => 'read:' + parent.localStorage.getItem('hostSecret'),
            ownLocalStorage: () => 'read:' + localStorage.getItem('hostSecret'),
            indexedDB: () => new Promise((res) => {
                const r = indexedDB.open('hostdb');
                r.onsuccess = () => res('open:stores=' + [...r.result.objectStoreNames].join(','));
                r.onerror = () => res('error:' + (r.error && r.error.name));
            }),
            cookie: () => 'read:' + JSON.stringify(document.cookie),
            parentDocument: () => 'read:' + parent.document.title,
        };
    }

    function frameKillers(EXT, P) {
        const u = (v) => `${EXT}/hit/${P}-${v}`;
        return {
            selfNav: () => { location.href = u('selfNav'); return 'assigned'; },
            formSubmit: () => {
                const f = document.createElement('form');
                f.action = u('formSubmit');
                f.method = 'GET';
                document.body.appendChild(f);
                f.submit();
                return 'submitted';
            },
            metaRefresh: () => {
                const m = document.createElement('meta');
                m.httpEquiv = 'refresh';
                m.content = `0;url=${u('metaRefresh')}`;
                document.head.appendChild(m);
                return 'appended';
            },
            topNav: () => { top.location.href = u('topNav'); return 'assigned'; },
            windowOpen: () => { const w = window.open(u('windowOpen')); return w ? 'opened' : 'null'; },
        };
    }

    const workers = {};
    function startWorker(kind) {
        return new Promise((res) => {
            let w;
            try {
                const src = document.getElementById('wsrc').textContent;
                const url = kind === 'blob'
                    ? URL.createObjectURL(new Blob([src], { type: 'text/javascript' }))
                    : `/worker.js?mode=${q.get('mode') || 'none'}`;
                w = new Worker(url);
            } catch (e) {
                return res({ started: false, why: 'threw:' + ((e && e.name) || String(e)) });
            }
            const t = setTimeout(() => res({ started: false, why: 'no hello in 3000 ms' }), 3000);
            w.addEventListener('error', (e) => { clearTimeout(t); res({ started: false, why: 'error event' + (e.message ? ': ' + e.message : '') }); });
            w.addEventListener('message', (e) => {
                if (e.data && e.data.cmd === 'hello') { clearTimeout(t); workers[kind] = w; res({ started: true, origin: e.data.origin }); }
            });
        });
    }
    const ask = (w, msg, cmd) => new Promise((res) => {
        const h = (e) => { if (e.data && e.data.cmd === cmd) { w.removeEventListener('message', h); res(e.data); } };
        w.addEventListener('message', h);
        w.postMessage(msg);
        setTimeout(() => res({ cmd, timeout: true }), 25000);
    });

    window.addEventListener('message', async (ev) => {
        if (ev.source !== parent) return;
        const m = ev.data || {};
        if (m.cmd === 'run') {
            const P = `${m.mode}-main`;
            if (only) {
                const js = await attempt(frameKillers(m.EXT, P)[only]);
                return toHost({ type: 'only', vector: only, js });
            }
            const main = [];
            for (const [name, fn] of Object.entries(mainVectors(m.SELF, m.EXT, P, m.UDP))) {
                main.push({ vector: name, js: await attempt(fn) });
            }
            const worker = {};
            for (const kind of ['blob', 'url']) {
                const start = await startWorker(kind);
                worker[kind] = { start };
                if (!start.started) continue;
                const r = await ask(workers[kind], { cmd: 'attack', SELF: m.SELF, EXT: m.EXT, prefix: `${m.mode}-w${kind}` }, 'attack');
                const load = await ask(workers[kind], { cmd: 'load', code: 'self.__pluginLoaded = 42;' }, 'load');
                worker[kind] = { start, results: r.results, violations: r.violations, load: load.out };
            }
            await new Promise((r) => setTimeout(r, 300));
            return toHost({ type: 'run', origin: String(self.origin), main, worker, violations });
        }
        if (m.cmd === 'echo') {
            const w = workers.blob;
            if (!w) return toHost({ type: 'echo', id: m.id, error: 'no blob worker' });
            const back = await ask(w, m, 'echo');
            return toHost({ type: 'echo', id: m.id, payload: back.payload });
        }
        if (m.cmd === 'startEcho') {
            const start = await startWorker('blob');
            return toHost({ type: 'startEcho', start });
        }
    });
    toHost({ type: 'ready' });
})();
