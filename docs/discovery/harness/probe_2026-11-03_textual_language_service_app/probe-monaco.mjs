// P-2026-11-03-2300 phase 1: Monaco's own cost at the size of 1,000 objects, in the app's Monaco (0.52.2), on a detached
// 900x600 editor with a synthetic text of N objects of 5 lines, ~8 classified tokens each: (a) inline-class decorations
// for every token, set and replaced; (b) a DocumentSemanticTokensProvider with the same tokens: delay from a keystroke
// (an edit) to the provider's call, and from its result to two animation frames. Median of 5.
import { setup, note, failures, check } from './common.mjs';
const { browser, page } = await setup();
try {
    for (const N of [1000, 6000]) {
        const r = await page.evaluate(async (N) => {
            const monaco = window.monaco;
            const med = xs => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
            const lines = [];
            for (let i = 0; i < N; i++) lines.push(`Book book${i} {`, `  genre FICTION`, `  year ${1900 + (i % 120)}`, `  borrowedBy reader${i % 200}`, `}`);
            const text = lines.join('\n');
            const toks = []; // [line, col, len, type]
            lines.forEach((l, li) => { const re = /[A-Za-z_][A-Za-z0-9_]*|\d+/g; let m; while ((m = re.exec(l))) toks.push([li, m.index, m[0].length, toks.length % 6]); });
            const host = document.createElement('div'); host.style.cssText = 'position:fixed;left:0;top:0;width:900px;height:600px;z-index:-1'; document.body.appendChild(host);
            const id = 'probe-sem-' + N;
            monaco.languages.register({ id });
            const data = []; let pl = 0, pc = 0;
            for (const [l, c, len, t] of toks) { data.push(l - pl, l === pl ? c - pc : c, len, t, 0); pl = l; pc = c; }
            const encoded = new Uint32Array(data);
            let calls = 0, calledAt = 0, resolvedAt = 0;
            monaco.languages.registerDocumentSemanticTokensProvider(id, {
                getLegend: () => ({ tokenTypes: ['keyword', 'type', 'variable', 'property', 'enumMember', 'number'], tokenModifiers: [] }),
                provideDocumentSemanticTokens: () => { calls++; calledAt = performance.now(); const out = { data: encoded }; resolvedAt = performance.now(); return out; },
                releaseDocumentSemanticTokens: () => {},
            });
            const model = monaco.editor.createModel(text, id);
            const editor = monaco.editor.create(host, { model, 'semanticHighlighting.enabled': true, minimap: { enabled: false } });
            const frames = () => new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res)));
            const until = async (p, ms = 5000) => { const t0 = performance.now(); while (!p() && performance.now() - t0 < ms) await new Promise(r => setTimeout(r, 5)); };
            await until(() => calls > 0); await frames();
            const sem = [];
            for (let k = 0; k < 5; k++) {
                const before = calls; const t0 = performance.now();
                model.applyEdits([{ range: new monaco.Range(1, 1, 1, 1), text: k % 2 ? '' : ' ' }].filter(e => e.text || k % 2));
                if (k % 2) model.applyEdits([{ range: new monaco.Range(1, 1, 1, 2), text: '' }]);
                await until(() => calls > before);
                const asked = calledAt - t0; await frames(); const painted = performance.now() - resolvedAt;
                sem.push([asked, painted]);
            }
            const decs = toks.map(([l, c, len, t]) => ({ range: new monaco.Range(l + 1, c + 1, l + 1, c + 1 + len), options: { inlineClassName: 'probe-tok-' + t } }));
            const col = editor.createDecorationsCollection([]);
            const set = [];
            for (let k = 0; k < 5; k++) { const t0 = performance.now(); col.set(decs); await frames(); set.push(performance.now() - t0); }
            const delta = [];
            for (let k = 0; k < 5; k++) { const t0 = performance.now(); col.set(decs.map(d => d)); delta.push(performance.now() - t0); }
            editor.dispose(); model.dispose(); host.remove();
            return { N, chars: text.length, tokens: toks.length, semanticAskedAfterEditMs: +med(sem.map(s => s[0])).toFixed(1), semanticResultToPaintMs: +med(sem.map(s => s[1])).toFixed(1),
                decorationsSetAndPaintMs: +med(set).toFixed(1), decorationsReplaceSyncMs: +med(delta).toFixed(1) };
        }, N);
        note('monaco cost', r);
    }
    check('probe ran', true, null);
} catch (e) { check('probe ran', false, String(e && e.stack || e).slice(0, 400)); }
finally { await browser.close(); console.log(failures ? `FAILURES ${failures}` : 'ALL PASS'); process.exit(failures ? 1 : 0); }
