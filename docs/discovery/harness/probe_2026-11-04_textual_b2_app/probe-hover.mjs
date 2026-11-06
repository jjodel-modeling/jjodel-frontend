// P-2026-11-04-0005 run 4: what the app's Monaco (0.52.2) allows for a hover card that stays open and carries actions.
// Setup (direct calls, not keystrokes): the demoESM project imported and its Text tab opened (common.mjs); a language
// `probe-b2` registered with a definition, a reference and a hover provider, globally per language as B1 registers its
// own; two commands registered with monaco.editor.registerCommand. Part A runs on a detached editor (900x300, fixed,
// on top) holding the demoESM print, so the text scrolls. Part B runs on the Text tab's own editor, its model switched
// to `probe-b2` (no text change), for F12, Shift+F12, Alt+F12, Cmd+click and the context menu. Mouse and keys are real
// Playwright input. Everything is removed and the tab's model goes back to `plaintext` at the end.
import { setup, note, check, failures, ED, CROPS } from './common.mjs';

const { browser, page, errors, wait } = await setup();
const ev = (fn, arg) => page.evaluate(fn, arg);
try {
    // ---- setup in the page ----
    const info = await ev((ED) => {
        const monaco = window.monaco;
        const tab = (0, eval)(ED);
        const text = tab.getModel().getValue();
        const lines = text.split('\n');
        const P = window.__p = { calls: [], monaco, tab, text, lines, disposables: [] };
        P.useLine = lines.findIndex(l => /^\s*event coin$/.test(l)) + 1;
        P.useCol = lines[P.useLine - 1].indexOf('coin') + 2;
        P.declLine = lines.findIndex(l => l.startsWith('Event coin')) + 1;
        P.pushLine = lines.findIndex(l => /^\s*event push$/.test(l)) + 1;
        P.pushCol = lines[P.pushLine - 1].indexOf('push') + 2;
        const word = (m, pos) => m.getWordAtPosition(pos);
        const decl = (w) => lines.findIndex(l => l === `Event ${w} {}`) + 1;
        const uses = (w) => lines.map((l, i) => [l.trim(), i + 1]).filter(([l]) => l === `event ${w}`).map(x => x[1]);
        P.disposables.push(monaco.languages.register({ id: 'probe-b2' }) ?? { dispose() {} });
        P.disposables.push(monaco.languages.registerDefinitionProvider('probe-b2', {
            provideDefinition(m, pos) {
                const w = word(m, pos); if (!w || !decl(w.word)) return null;
                P.calls.push(['definition', pos.lineNumber]);
                const d = decl(w.word);
                return { uri: m.uri, range: new monaco.Range(d, 7, d, 7 + w.word.length) };
            },
        }));
        P.disposables.push(monaco.languages.registerReferenceProvider('probe-b2', {
            provideReferences(m, pos, ctx) {
                const w = word(m, pos); if (!w || !decl(w.word)) return null;
                P.calls.push(['references', pos.lineNumber, ctx.includeDeclaration]);
                const out = uses(w.word).map(l => ({ uri: m.uri, range: new monaco.Range(l, lines[l - 1].indexOf(w.word) + 1, l, lines[l - 1].indexOf(w.word) + 1 + w.word.length) }));
                if (ctx.includeDeclaration) out.unshift({ uri: m.uri, range: new monaco.Range(decl(w.word), 7, decl(w.word), 7 + w.word.length) });
                return out;
            },
        }));
        P.disposables.push(monaco.languages.registerHoverProvider('probe-b2', {
            provideHover(m, pos) {
                const w = word(m, pos); if (!w || !decl(w.word)) return null;
                P.calls.push(['hover', pos.lineNumber]);
                const arg = (x) => encodeURIComponent(JSON.stringify([x]));
                return {
                    range: new monaco.Range(pos.lineNumber, w.startColumn, pos.lineNumber, w.endColumn),
                    contents: [
                        { value: `PROBE-HOVER **Event ${w.word}** · reference \`event\`` },
                        { value: `[Go to definition](command:probe.goto?${arg(decl(w.word))})  \nUsed at: ${uses(w.word).map(l => `[line ${l}](command:probe.reveal?${arg(l)})`).join(', ')}`, isTrusted: true },
                        { value: `[untrusted link](command:probe.untrusted)` },
                    ],
                };
            },
        }));
        P.disposables.push(monaco.editor.registerCommand('probe.goto', (_a, line) => { P.calls.push(['cmd-goto', line]); P.active?.setPosition({ lineNumber: line, column: 7 }); P.active?.revealLineInCenter(line); }));
        P.disposables.push(monaco.editor.registerCommand('probe.reveal', (_a, line) => { P.calls.push(['cmd-reveal', line]); }));
        P.disposables.push(monaco.editor.registerCommand('probe.untrusted', () => { P.calls.push(['cmd-untrusted']); }));
        // The detached editor.
        const host = document.createElement('div');
        host.id = 'probe-host';
        host.style.cssText = 'position:fixed;left:300px;top:120px;width:900px;height:300px;z-index:100000;border:1px solid #cbd5e1;background:#fff';
        document.body.appendChild(host);
        const model = monaco.editor.createModel(text, 'probe-b2');
        const E = monaco.editor.create(host, { model, minimap: { enabled: false }, fontSize: 13, scrollBeyondLastLine: false, lineNumbers: 'on' });
        P.E = E; P.model = model; P.host = host; P.active = E;
        // Helpers.
        P.at = (ed, line, col) => { const p = ed.getScrolledVisiblePosition({ lineNumber: line, column: col }); const r = ed.getDomNode().getBoundingClientRect(); return p ? { x: Math.round(r.left + p.left + 3), y: Math.round(r.top + p.top + p.height / 2) } : null; };
        const shown = (e) => { const r = e.getBoundingClientRect(); if (!(r.width > 0 && r.height > 0)) return false; for (let n = e; n; n = n.parentElement) { if (n.classList?.contains('hidden')) return false; const cs = getComputedStyle(n); if (cs.visibility === 'hidden' || cs.display === 'none') return false; } return true; };
        P.hover = () => { const e = [...document.querySelectorAll('.monaco-hover')].filter(x => x.textContent.includes('PROBE-HOVER') && shown(x)); return e.length ? e[0].textContent.match(/Event (\w+)/)?.[1] ?? '?' : null; };
        P.link = (label) => { const e = [...document.querySelectorAll('.monaco-hover a')].find(a => a.textContent === label && shown(a)); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), href: e.getAttribute('href'), dataHref: e.getAttribute('data-href') }; };
        P.hoverBox = () => { const e = [...document.querySelectorAll('.monaco-hover')].find(x => x.textContent.includes('PROBE-HOVER') && shown(x)); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), top: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) }; };
        P.shown = shown;
        return { useLine: P.useLine, useCol: P.useCol, declLine: P.declLine, pushLine: P.pushLine, pushCol: P.pushCol, lines: lines.length };
    }, ED);
    note('setup', info);

    const at = (line, col, ed = 'E') => ev(([l, c, e]) => window.__p.at(window.__p[e], l, c), [line, col, ed]);
    const hover = () => ev(() => window.__p.hover());
    const calls = () => ev(() => window.__p.calls.map(c => [].concat(c).join(':')));
    const clearCalls = () => ev(() => { window.__p.calls.length = 0; });
    const pos = (ed = 'E') => ev((e) => window.__p[e].getPosition().lineNumber, ed);
    const away = async () => { await page.mouse.move(1500, 950); await wait(400); };
    const showOn = async (line = info.useLine, col = info.useCol) => {
        await away();
        await ev(() => window.__p.E.setScrollTop(0)); await wait(100);
        const p = await at(line, col);
        await page.mouse.move(p.x - 6, p.y); await wait(50); await page.mouse.move(p.x, p.y);
        for (let i = 0; i < 20 && !(await hover()); i++) await wait(100);
        return hover();
    };
    const sample = async (ms) => { const out = []; let t = 0; for (const s of ms) { await wait(s - t); t = s; out.push(`${s}ms:${(await hover()) ?? '-'}`); } return out.join(' '); };

    // ---- Part A1: the default hover (sticky true, hidingDelay 300) ----
    await ev(() => window.__p.E.updateOptions({ hover: { enabled: true, sticky: true, delay: 300, hidingDelay: 300 } }));
    check('A1 hover shows on the reference', (await showOn()) === 'coin', await hover());
    await page.screenshot({ path: `${CROPS}/hover-monaco-links.png`, clip: { x: 300, y: 120, width: 900, height: 300 } });
    const links = await ev(() => ({ go: window.__p.link('Go to definition'), line: window.__p.link(`line ${window.__p.useLine}`), untrusted: window.__p.link('untrusted link') }));
    note('A1 links rendered', links);
    { const b = await ev(() => window.__p.hoverBox()); await page.mouse.move(b.x, b.y); note('A1 mouse inside the hover', await sample([500, 1500])); }
    await clearCalls();
    { const l = await ev(() => window.__p.link('Go to definition')); if (l) await page.mouse.click(l.x, l.y); await wait(500); }
    note('A1 click «Go to definition»', { calls: await calls(), cursorLine: await pos(), hoverAfter: await hover() });
    await showOn(); await clearCalls();
    { const b = await ev(() => window.__p.hoverBox()); if (b) { await page.mouse.move(b.x, b.y); await wait(200); } const l = await ev(() => window.__p.link('untrusted link')); const t = await ev(() => { const e = [...document.querySelectorAll('.monaco-hover')].find(x => x.textContent.includes('PROBE-HOVER')); const u = e && [...e.querySelectorAll('*')].find(x => x.children.length === 0 && x.textContent.includes('untrusted link')); return u ? { tag: u.tagName.toLowerCase(), href: u.getAttribute('href'), dataHref: u.getAttribute('data-href') } : null; }); if (l) await page.mouse.click(l.x, l.y); await wait(500); note('A1 the untrusted command link', { anchor: l, rendered: t, calls: await calls() }); }
    await showOn();
    { const p = await at(1, 40); await page.mouse.move(p.x, p.y); note('A1 mouse onto empty text', await sample([150, 600, 1500])); }
    await showOn();
    { const p = await at(2, 3); await page.mouse.click(p.x, p.y); note('A1 click on the text', await sample([200])); }
    await showOn(); await page.keyboard.press('Shift'); note('A1 Shift alone', await sample([300]));
    await showOn(); await page.keyboard.press('ArrowDown'); note('A1 ArrowDown', await sample([300]));
    await showOn(); await ev(() => window.__p.E.setScrollTop(19)); note('A1 scroll by one line', await sample([300]));
    await ev(() => window.__p.E.setScrollTop(0)); await wait(200);
    await showOn(); await page.mouse.move(250, 500); note('A1 mouse out of the editor', await sample([300, 1000]));
    await showOn(); { const p = await at(info.pushLine, info.pushCol); await page.mouse.move(p.x, p.y); note('A1 move onto another reference', await sample([200, 800, 1500])); }

    // ---- Part A2: hidingDelay at its clamp (600000 ms) ----
    await ev(() => window.__p.E.updateOptions({ hover: { enabled: true, sticky: true, delay: 300, hidingDelay: 600000 } }));
    await showOn(); { const p = await at(1, 40); await page.mouse.move(p.x, p.y); note('A2 mouse onto empty text', await sample([600, 2000, 4000])); }
    { const p = await at(info.pushLine, info.pushCol); await page.mouse.move(p.x, p.y); note('A2 then onto another reference', await sample([800, 2000])); }
    { const p = await at(2, 3); await page.mouse.click(p.x, p.y); note('A2 click on the text', await sample([200])); }
    await showOn(); await page.mouse.move(250, 500); note('A2 mouse out of the editor', await sample([300, 1500]));
    await showOn(); await page.keyboard.press('ArrowDown'); note('A2 ArrowDown', await sample([300]));
    await showOn(); await ev(() => window.__p.E.setScrollTop(19)); note('A2 scroll by one line', await sample([300]));
    await ev(() => window.__p.E.setScrollTop(0));
    // A2 with a marker on another line: is its hover blocked while the card is up?
    await ev(() => window.__p.monaco.editor.setModelMarkers(window.__p.model, 'probe', [{ startLineNumber: 3, startColumn: 5, endLineNumber: 3, endColumn: 15, message: 'PROBE-MARKER', severity: 8 }]));
    await showOn(); { const p = await at(1, 40); await page.mouse.move(p.x, p.y); await wait(300); const q = await at(3, 8); await page.mouse.move(q.x, q.y); await wait(1500); note('A2 marker hover while the card is up', { card: await hover(), marker: await ev(() => [...document.querySelectorAll('.monaco-hover')].some(x => x.textContent.includes('PROBE-MARKER') && window.__p.shown(x))) }); }
    await ev(() => window.__p.monaco.editor.setModelMarkers(window.__p.model, 'probe', []));
    await ev(() => window.__p.E.updateOptions({ hover: { enabled: true, sticky: true, delay: 300, hidingDelay: 300 } }));

    // ---- Part A3: the hover shown from the keyboard, focused ----
    await away();
    await ev(() => { const E = window.__p.E; E.focus(); E.setPosition({ lineNumber: window.__p.useLine, column: window.__p.useCol }); E.trigger('probe', 'editor.action.showHover', { focus: true }); });
    await wait(800);
    const focusIn = () => ev(() => { const a = document.activeElement; return a ? `${a.tagName.toLowerCase()}${a.closest('.monaco-hover') ? ' in hover' : ''}${a.textContent && a.tagName === 'A' ? ` «${a.textContent}»` : ''}` : null; });
    note('A3 keyboard hover', { hover: await hover(), focus: await focusIn() });
    { const p = await at(info.pushLine, info.pushCol); await page.mouse.move(p.x, p.y); note('A3 mouse onto another reference', await sample([800, 1500])); }
    await page.keyboard.press('Tab'); note('A3 Tab', { focus: await focusIn(), hover: await hover() });
    await clearCalls(); await page.keyboard.press('Enter'); await wait(400); note('A3 Enter', { calls: await calls(), hover: await hover() });
    await ev(() => { const E = window.__p.E; E.focus(); E.setPosition({ lineNumber: window.__p.useLine, column: window.__p.useCol }); E.trigger('probe', 'editor.action.showHover', { focus: true }); }); await wait(600);
    await page.mouse.move(250, 500); note('A3 mouse out of the editor', await sample([300, 1000]));
    await ev(() => { const E = window.__p.E; E.focus(); E.setPosition({ lineNumber: window.__p.useLine, column: window.__p.useCol }); E.trigger('probe', 'editor.action.showHover', { focus: true }); }); await wait(600);
    await page.keyboard.press('Escape'); note('A3 Escape', await sample([300]));

    // ---- Part A4: a content widget card ----
    const card = await ev(() => {
        const P = window.__p, monaco = P.monaco, E = P.E;
        const node = document.createElement('div');
        node.className = 'probe-card';
        node.style.cssText = 'background:#fff;border:1px solid #94a3b8;border-radius:6px;padding:8px 10px;font:12px sans-serif;color:#0f172a;box-shadow:0 4px 12px rgba(15,23,42,.15);width:260px';
        node.innerHTML = `<div style="display:flex;justify-content:space-between"><b>PROBE-CARD Event coin</b><button class="x" aria-label="Close">×</button></div><div>reference <code>event</code> of Transition</div><button class="go">Go to definition</button><div>Used at: <a href="#" class="l">line ${P.useLine}</a></div>`;
        node.querySelector('.go').addEventListener('click', () => { P.calls.push('card-go'); E.setPosition({ lineNumber: P.declLine, column: 7 }); E.revealLineInCenter(P.declLine); });
        node.querySelector('.l').addEventListener('click', (e) => { e.preventDefault(); P.calls.push('card-line'); });
        node.querySelector('.x').addEventListener('click', () => { P.calls.push('card-close'); E.removeContentWidget(P.widget); });
        node.addEventListener('keydown', (e) => { if (e.key === 'Escape') { P.calls.push('card-escape'); E.removeContentWidget(P.widget); E.focus(); } });
        P.cardNode = node;
        P.widget = { getId: () => 'probe.card', getDomNode: () => node, getPosition: () => ({ position: { lineNumber: P.useLine, column: P.useCol }, preference: [monaco.editor.ContentWidgetPositionPreference.BELOW, monaco.editor.ContentWidgetPositionPreference.ABOVE] }), allowEditorOverflow: true };
        E.addContentWidget(P.widget);
        P.card = () => { const r = node.getBoundingClientRect(); return node.isConnected && P.shown(node) ? { top: Math.round(r.top), left: Math.round(r.left), h: Math.round(r.height) } : null; };
        return true;
    });
    await wait(300);
    const cardAt = () => ev(() => window.__p.card());
    note('A4 card added', await cardAt());
    await page.screenshot({ path: `${CROPS}/hover-content-widget.png`, clip: { x: 300, y: 120, width: 900, height: 300 } });
    await showOn(info.pushLine, info.pushCol); note('A4 Monaco hover on another reference while the card is up', { hover: await hover(), card: await cardAt() });
    await away(); await clearCalls();
    const before = await pos();
    { const b = await ev(() => { const r = window.__p.cardNode.querySelector('.go').getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; }); await page.mouse.click(b.x, b.y); await wait(300); }
    note('A4 click «Go to definition» in the card', { calls: await calls(), cursorBefore: before, cursorAfter: await pos(), card: await cardAt(), editorFocus: await ev(() => window.__p.E.hasTextFocus()) });
    await ev(() => window.__p.E.setScrollTop(0)); await wait(200);
    const c0 = await cardAt();
    await ev(() => window.__p.E.setScrollTop(38)); await wait(300);
    note('A4 scroll by two lines', { before: c0, after: await cardAt() });
    await ev(() => window.__p.E.setScrollTop(400)); await wait(300);
    note('A4 its line scrolled out of view', { card: await cardAt() });
    await ev(() => window.__p.E.setScrollTop(0)); await wait(300);
    { const p = await at(2, 3); await page.mouse.click(p.x, p.y); await wait(200); note('A4 click on the text (no close handler)', { card: await cardAt() }); }
    await page.keyboard.type('x'); await wait(200); note('A4 typing in the text', { card: await cardAt() });
    await ev(() => window.__p.E.trigger('probe', 'undo'));
    await ev(() => window.__p.cardNode.querySelector('.go').focus()); await clearCalls();
    await page.keyboard.press('Enter'); await wait(200); note('A4 keyboard: Enter on the focused button', { calls: await calls() });
    await ev(() => window.__p.cardNode.querySelector('.go').focus()); await page.keyboard.press('Escape'); await wait(200);
    note('A4 keyboard: Escape in the card', { calls: await calls(), card: await cardAt(), editorFocus: await ev(() => window.__p.E.hasTextFocus()) });

    // ---- Part A5: an overlay widget at the reference's coordinates ----
    await ev(() => window.__p.E.setScrollTop(0));
    await ev(() => {
        const P = window.__p, E = P.E;
        const node = document.createElement('div');
        node.style.cssText = 'background:#fff;border:1px solid #94a3b8;padding:6px;font:12px sans-serif;width:220px';
        node.textContent = 'PROBE-OVERLAY';
        const p = E.getScrolledVisiblePosition({ lineNumber: P.useLine, column: P.useCol });
        P.overlay = { getId: () => 'probe.overlay', getDomNode: () => node, getPosition: () => ({ preference: { top: p.top + p.height, left: p.left } }) };
        P.overlayNode = node;
        E.addOverlayWidget(P.overlay);
        P.ov = () => { const r = node.getBoundingClientRect(); return node.isConnected ? { top: Math.round(r.top), left: Math.round(r.left) } : null; };
    });
    await wait(200);
    const o0 = await ev(() => window.__p.ov());
    await ev(() => window.__p.E.setScrollTop(38)); await wait(300);
    note('A5 overlay widget, scroll by two lines', { before: o0, after: await ev(() => window.__p.ov()), lineMovedBy: -38 });
    await ev(() => { window.__p.E.removeOverlayWidget(window.__p.overlay); window.__p.E.setScrollTop(0); });

    // ---- Part A6: a card outside the editor (a React card would sit here), placed from the editor's coordinates ----
    await ev(() => {
        const P = window.__p, E = P.E;
        const node = document.createElement('div');
        node.style.cssText = 'position:fixed;z-index:100001;background:#fff;border:1px solid #94a3b8;padding:6px;font:12px sans-serif;width:220px';
        node.innerHTML = '<span>PROBE-PAGECARD</span> <button class="go">Go</button>';
        node.querySelector('.go').addEventListener('click', () => P.calls.push('pagecard-go'));
        const place = () => { const r = E.getDomNode().getBoundingClientRect(); const p = E.getScrolledVisiblePosition({ lineNumber: P.useLine, column: P.useCol }); node.style.left = `${r.left + p.left}px`; node.style.top = `${r.top + p.top + p.height}px`; };
        place();
        document.body.appendChild(node);
        P.pageCard = node;
        P.pageCardSub = E.onDidScrollChange(place);
        P.pc = () => { const r = node.getBoundingClientRect(); return { top: Math.round(r.top) }; };
    });
    const p0 = await ev(() => window.__p.pc());
    await ev(() => window.__p.E.setScrollTop(38)); await wait(300);
    const p1 = await ev(() => window.__p.pc());
    await clearCalls(); const pb = await pos();
    { const b = await ev(() => { const r = window.__p.pageCard.querySelector('.go').getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; }); await page.mouse.click(b.x, b.y); await wait(200); }
    note('A6 page card, scroll by two lines and a click on it', { before: p0, after: p1, calls: await calls(), cursorBefore: pb, cursorAfter: await pos(), editorFocus: await ev(() => window.__p.E.hasTextFocus()) });
    await ev(() => { window.__p.pageCardSub.dispose(); window.__p.pageCard.remove(); window.__p.E.setScrollTop(0); });

    // ---- Part B: the Text tab's own editor, providers registered per language ----
    await ev(() => { const P = window.__p; P.E.removeContentWidget(P.widget); P.host.style.display = 'none'; P.monaco.editor.setModelLanguage(P.tab.getModel(), 'probe-b2'); P.active = P.tab; });
    await away();
    const tabAt = (l, c) => at(l, c, 'tab');
    const placeTab = () => ev(() => { const P = window.__p; P.tab.focus(); P.tab.setPosition({ lineNumber: P.useLine, column: P.useCol }); });
    await placeTab(); await clearCalls(); await page.keyboard.press('F12'); await wait(600);
    note('B F12', { calls: await calls(), cursorLine: await pos('tab'), expected: info.declLine });
    await placeTab(); await clearCalls(); await page.keyboard.press('Shift+F12'); await wait(1200);
    const peek = () => ev(() => { const z = [...document.querySelectorAll('.peekview-widget')].filter(w => window.__p.tab.getDomNode().contains(w) && window.__p.shown(w)); return z.length ? { rows: z[0].querySelectorAll('.monaco-list-row').length, title: z[0].querySelector('.peekview-title')?.textContent ?? null } : null; });
    note('B Shift+F12', { calls: await calls(), peek: await peek() });
    await page.screenshot({ path: `${CROPS}/tab-references-peek.png`, clip: { x: 0, y: 0, width: 1600, height: 1000 } });
    await page.keyboard.press('Escape'); await wait(300);
    await placeTab(); await clearCalls(); await page.keyboard.press('Alt+F12'); await wait(1200);
    note('B Alt+F12', { calls: await calls(), peek: await peek() });
    await page.keyboard.press('Escape'); await wait(300);
    await placeTab();
    { const p = await tabAt(info.useLine, info.useCol); await clearCalls(); await page.keyboard.down('Meta'); await page.mouse.move(p.x, p.y); await wait(300); await page.mouse.click(p.x, p.y); await page.keyboard.up('Meta'); await wait(600); note('B Cmd+click', { calls: await calls(), cursorLine: await pos('tab') }); }
    await placeTab();
    const menuItems = () => ev(() => {
        const roots = [document, ...[...document.querySelectorAll('*')].filter(e => e.shadowRoot).map(e => e.shadowRoot)];
        const items = roots.flatMap(r => [...r.querySelectorAll('.monaco-menu .action-label')]).filter(e => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0; });
        return items.map(e => e.textContent.trim()).filter(Boolean);
    });
    { const p = await tabAt(info.useLine, info.useCol); await page.mouse.click(p.x, p.y, { button: 'right' }); await wait(600); note('B context menu', { items: await menuItems() }); }
    await page.screenshot({ path: `${CROPS}/tab-context-menu.png`, clip: { x: 0, y: 0, width: 1600, height: 1000 } });
    {
        const clicked = await ev(() => {
            const roots = [document, ...[...document.querySelectorAll('*')].filter(e => e.shadowRoot).map(e => e.shadowRoot)];
            const it = roots.flatMap(r => [...r.querySelectorAll('.monaco-menu .action-label')]).find(e => e.textContent.trim() === 'Go to Definition');
            if (!it) return false; const b = it.getBoundingClientRect(); return { x: Math.round(b.left + b.width / 2), y: Math.round(b.top + b.height / 2) };
        });
        await clearCalls();
        if (clicked) { await page.mouse.click(clicked.x, clicked.y); await wait(600); }
        note('B context menu «Go to Definition»', { found: !!clicked, calls: await calls(), cursorLine: await pos('tab') });
    }
    // A hover on the tab's editor with the same provider: the links and one command.
    await away();
    { const p = await tabAt(info.useLine, info.useCol); await page.mouse.move(p.x - 6, p.y); await wait(50); await page.mouse.move(p.x, p.y); for (let i = 0; i < 20 && !(await hover()); i++) await wait(100); }
    note('B hover on the tab', { hover: await hover() });
    await page.screenshot({ path: `${CROPS}/tab-hover.png`, clip: { x: 0, y: 0, width: 1600, height: 1000 } });
    { const b = await ev(() => window.__p.hoverBox()); if (b) { await page.mouse.move(b.x, b.y); await wait(200); } const l = await ev(() => window.__p.link('Go to definition')); await clearCalls(); if (l) { await page.mouse.click(l.x, l.y); await wait(500); } note('B hover «Go to definition» on the tab', { calls: await calls(), cursorLine: await pos('tab') }); }
    const status = await ev(() => document.querySelector('.textual-tab .textual-tab__status')?.textContent ?? null);
    note('B tab status at the end', { status, textUnchanged: await ev(() => window.__p.tab.getModel().getValue() === window.__p.text) });
} finally {
    await ev(() => { const P = window.__p; if (!P) return; try { P.monaco.editor.setModelLanguage(P.tab.getModel(), 'plaintext'); } catch {} try { P.E.dispose(); P.model.dispose(); P.host.remove(); } catch {} for (const d of P.disposables) try { d.dispose(); } catch {} }).catch(() => {});
    note('errors', errors.slice(0, 6));
    console.log(`FAILURES ${failures}`);
    await browser.close();
}
