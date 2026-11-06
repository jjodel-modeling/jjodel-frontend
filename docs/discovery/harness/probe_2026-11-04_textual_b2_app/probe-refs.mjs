// P-2026-11-04-0005 run 5: Shift+F12 on the Text tab's editor with a reference provider registered per language, on a
// reference with one use (`coin`) and one with two (`push`); the actions bound to references, and the peek's rows.
// Setup as in probe-hover.mjs part B (direct calls); keys are real Playwright input.
import { setup, note, failures, ED, CROPS } from './common.mjs';

const { browser, page, errors, wait } = await setup();
const ev = (fn, arg) => page.evaluate(fn, arg);
try {
    const info = await ev((ED) => {
        const monaco = window.monaco;
        const tab = (0, eval)(ED);
        const lines = tab.getModel().getValue().split('\n');
        const P = window.__p = { calls: [], monaco, tab, lines, disposables: [] };
        const decl = (w) => lines.findIndex(l => l === `Event ${w} {}`) + 1;
        const uses = (w) => lines.map((l, i) => [l.trim(), i + 1]).filter(([l]) => l === `event ${w}`).map(x => x[1]);
        monaco.languages.register({ id: 'probe-b2r' });
        P.disposables.push(monaco.languages.registerDefinitionProvider('probe-b2r', { provideDefinition(m, pos) { const w = m.getWordAtPosition(pos); if (!w || !decl(w.word)) return null; const d = decl(w.word); return { uri: m.uri, range: new monaco.Range(d, 7, d, 7 + w.word.length) }; } }));
        P.disposables.push(monaco.languages.registerReferenceProvider('probe-b2r', {
            provideReferences(m, pos, ctx) {
                const w = m.getWordAtPosition(pos); if (!w || !decl(w.word)) return null;
                const out = uses(w.word).map(l => ({ uri: m.uri, range: new monaco.Range(l, lines[l - 1].indexOf(w.word) + 1, l, lines[l - 1].indexOf(w.word) + 1 + w.word.length) }));
                if (ctx.includeDeclaration) out.unshift({ uri: m.uri, range: new monaco.Range(decl(w.word), 7, decl(w.word), 7 + w.word.length) });
                P.calls.push(`references:${pos.lineNumber}:${ctx.includeDeclaration}:${out.length}`);
                return out;
            },
        }));
        monaco.editor.setModelLanguage(tab.getModel(), 'probe-b2r');
        P.shown = (e) => { const r = e.getBoundingClientRect(); if (!(r.width > 0 && r.height > 0)) return false; for (let n = e; n; n = n.parentElement) { const cs = getComputedStyle(n); if (cs.visibility === 'hidden' || cs.display === 'none') return false; } return true; };
        const coin = lines.findIndex(l => /^\s*event coin$/.test(l)) + 1;
        const push = lines.findIndex(l => /^\s*event push$/.test(l)) + 1;
        const actions = tab.getSupportedActions().filter(a => /reference|definition|peek/i.test(a.id)).map(a => `${a.id} «${a.label}»`);
        return { coin, push, col: lines[coin - 1].indexOf('coin') + 2, actions };
    }, ED);
    note('setup', info);
    const peek = () => ev(() => { const z = [...document.querySelectorAll('.peekview-widget, .zone-widget')].filter(w => window.__p.shown(w)); return z.map(w => ({ cls: w.className.split(' ').slice(0, 3).join(' '), rows: w.querySelectorAll('.monaco-list-row').length, title: (w.querySelector('.peekview-title')?.textContent ?? '').slice(0, 60), inTab: window.__p.tab.getDomNode().contains(w) })); });
    const run = async (label, line, key) => {
        await ev(([l, c]) => { const P = window.__p; P.calls.length = 0; P.tab.focus(); P.tab.setPosition({ lineNumber: l, column: c }); }, [line, info.col]);
        if (key) await page.keyboard.press(key); else await ev(() => window.__p.tab.getAction('editor.action.goToReferences')?.run());
        await wait(1500);
        note(label, { calls: await ev(() => window.__p.calls.slice()), cursorLine: await ev(() => window.__p.tab.getPosition().lineNumber), peek: await peek() });
        if (label.includes('push')) await page.screenshot({ path: `${CROPS}/tab-references-peek-push.png`, clip: { x: 240, y: 50, width: 1360, height: 700 } });
        await page.keyboard.press('Escape'); await wait(400);
    };
    await run('Shift+F12 on coin (one use)', info.coin, 'Shift+F12');
    await run('Shift+F12 on push (two uses)', info.push, 'Shift+F12');
    await run('goToReferences action on coin', info.coin, null);
} finally {
    await ev(() => { const P = window.__p; if (!P) return; try { P.monaco.editor.setModelLanguage(P.tab.getModel(), 'plaintext'); } catch {} for (const d of P.disposables) try { d.dispose(); } catch {} }).catch(() => {});
    note('errors', errors.slice(0, 6));
    console.log(`FAILURES ${failures}`);
    await browser.close();
}
