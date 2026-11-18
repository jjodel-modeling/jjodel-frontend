// P-2026-11-03-2300 phase 1: measures the finding of P-2026-11-03-2152 (run 2): after a truncation (Meta+c, Backspace)
// and its paste back (Meta+v), does a comment-only edit stop at «confirm below», and do the carried spans of the pasted
// region survive? Same setup as P-2026-11-03-2152 (demoESM, import through ProjectsApi, tab through openTextualTab, caret
// through the editor API); every edit is a keystroke. CONTROL=1 skips the truncation and paste.
import { setup, check, note, failures } from './common.mjs';
const { browser, page, wait, poll } = await setup();

const ED = `((window.monaco?.editor?.getEditors?.() || []).find(e => { const t = e.getDomNode()?.closest('.textual-tab');
    return t && !t.querySelector('.textual-tab__model-name') && e.getDomNode().offsetParent !== null && !e.getRawOptions().readOnly; }))`;
const TAB = `[...document.querySelectorAll('.textual-tab')].find(t => !t.querySelector('.textual-tab__model-name') && t.offsetParent !== null)`;
const text = () => page.evaluate(`${ED}.getValue()`);
const at = (o) => page.evaluate(`(() => { const e = ${ED}; const m = e.getModel(); e.setPosition(m.getPositionAt(${o})); e.focus(); })()`);
const select = (a, b) => page.evaluate(`(() => { const e = ${ED}; const m = e.getModel(); const x = m.getPositionAt(${a}), y = m.getPositionAt(${b});
    e.setSelection({ startLineNumber: x.lineNumber, startColumn: x.column, endLineNumber: y.lineNumber, endColumn: y.column }); e.focus(); })()`);
// The tab's decorations carry no class (TextualTab.tsx setDecorations): every other decoration has one.
const spans = () => page.evaluate(`(() => { const m = ${ED}.getModel(); return m.getAllDecorations().filter(d => !d.options.className && !d.options.inlineClassName && !d.options.glyphMarginClassName && !d.options.linesDecorationsClassName)
    .map(d => [m.getOffsetAt(d.range.getStartPosition()), m.getOffsetAt(d.range.getEndPosition())]).sort((a, b) => a[0] - b[0] || a[1] - b[1]); })()`);
const FINAL = /^(Applied|Up to date|No change|Not applied|Cut|\d+ problem)/;
const settle = async () => { await wait(1200); return poll(`(() => { const s = ${TAB}?.querySelector('.textual-tab__status')?.textContent || ''; return ${FINAL}.test(s) ? s : null; })()`, 20000); };
const CONTROL = process.env.CONTROL === '1';

try {
    await poll(`(() => { const v = ${ED}?.getValue() || ''; return v.includes('Event stop') ? true : null; })()`, 20000);
    await wait(1000);
    const t0 = await text();
    const s0 = await spans();
    note('control', CONTROL);
    note('0 decorations (start, end)', s0);
    note('0 empty decorations', s0.filter(([a, b]) => a === b).length);
    if (!CONTROL) {
        const cut = t0.indexOf('guard "model.[paid]"');
        note('cut offset', cut);
        await select(cut, t0.length);
        await page.keyboard.press('Meta+c');
        await page.keyboard.press('Backspace');
        note('1 truncated: status', await settle());
        const s1 = await spans();
        note('1 decorations', s1);
        await at(cut);
        await page.keyboard.press('Meta+v');
        note('2 pasted back: status', await settle());
        const t2 = await text();
        const s2 = await spans();
        note('2 text = print', t2 === t0);
        note('2 decorations', s2);
        note('2 empty decorations', s2.filter(([a, b]) => a === b).length);
        note('2 decorations unchanged from 0', JSON.stringify(s2) === JSON.stringify(s0));
    }
    const term = t0.indexOf('Terminal {}');
    await at(term);
    await page.keyboard.press('Enter');
    await at(term);
    await page.keyboard.type('// a comment only');
    await page.keyboard.press('Escape');
    const st = await settle();
    note('3 comment typed: status', st);
    note('3 comment typed: panel', await page.evaluate(`[...${TAB}.querySelectorAll('.textual-tab__confirm-rows tbody tr')].map(r => [...r.children].map(c => c.textContent).join(' | '))`));
    note('3 decorations', await spans());
    check(CONTROL ? 'control: the comment-only edit asks nothing' : 'finding reproduced: the comment-only edit stops at confirm', CONTROL ? !/confirm/i.test(st ?? '') : /confirm/i.test(st ?? ''), st);
} catch (e) {
    check('probe ran', false, String(e && e.stack || e).slice(0, 400));
} finally {
    await browser.close();
    console.log(failures ? `FAILURES ${failures}` : 'ALL PASS');
    process.exit(failures ? 1 : 0);
}
