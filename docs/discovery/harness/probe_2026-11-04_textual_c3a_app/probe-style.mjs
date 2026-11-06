// P-2026-11-04-0412, step C3a in the app: the Text tab's style picker.
// Setup (direct calls, not user input): the project imported and its Text tab opened (common.mjs); the caret placed with
// editor.setPosition and the editor focused with editor.focus() before typing; the store and the record read back.
// User input (real Playwright input): the picks in the native select (page.selectOption, a pick with its change event),
// the clicks on the EBNF and Text mode buttons, the typed characters (keyboard.type) and Cmd+Z (keyboard.press).
// CASE=library also types a line break into a string, as `'#10'` (D4).
import { setup, closeTip, check, note, failures, ED, PRINT, CROPS } from './common.mjs';

const CASE = process.env.CASE || 'demoesm';
const { browser, page, errors, wait, poll, ids } = await setup();
const ev = (fn, arg) => page.evaluate(fn, arg);
const text = () => ev(`${ED}?.getValue() ?? null`);
const record = () => ev(`(async () => { const s = await import('/src/codegen/textual/syntaxRecord.ts'); const L = window.windoww.store.getState().idlookup; return { base: s.styleBaseOf(s.readSyntax(L, ${JSON.stringify(ids.mm)})), raw: s.storedSyntax(L, ${JSON.stringify(ids.mm)}) ?? null }; })()`);
const picker = () => ev(`(() => { const s = document.querySelector('.textual-tab__style-select'); return s ? { value: s.value, disabled: s.disabled, options: [...s.options].map(o => o.value + ':' + o.textContent) } : null; })()`);
const status = () => ev(`document.querySelector('.textual-tab__status')?.textContent ?? null`);
const crop = async (name, selector, height) => {
    const box = await page.locator(selector).first().boundingBox();
    if (!box) { check(`crop ${name}`, false, 'no box'); return; }
    await page.screenshot({ path: `${CROPS}/c3a-${CASE}-${name}.png`, clip: { x: box.x, y: box.y, width: box.width, height: height ?? box.height } });
};
const caretAt = async (offset) => ev(`(() => { const e = ${ED}; const p = e.getModel().getPositionAt(${offset}); e.setPosition(p); e.focus(); return p; })()`);
const undo = async () => { await ev(`${ED}.focus()`); await page.keyboard.press('Meta+z'); };

try {
    await closeTip(page, (e, ms) => poll(e, ms), wait);
    note('ids', ids);
    const p0 = await picker();
    check('the picker shows C-like, enabled, with the catalog', p0 && p0.value === 'clike' && !p0.disabled && p0.options.join() === 'clike:C-like,pascal:Pascal/Ada', p0);
    const r0 = await record();
    const t0 = await text();
    check('the text is the model print', t0 === await ev(PRINT(ids)), { len: t0?.length });
    await crop('bar-clike', '.textual-tab__bar');

    // ---- switch to Pascal ----
    await page.selectOption('.textual-tab__style-select', 'pascal');
    const tp = await poll(`(() => { const v = ${ED}?.getValue(); return v && v !== ${JSON.stringify(t0)} ? v : null; })()`, 10000);
    const rp = await record();
    check('Pascal: the record names the base', rp.base === 'pascal', rp);
    check('Pascal: the text reprints in Pascal, the print of the model', !!tp && /\bbegin\n/.test(tp) && /\bend;/.test(tp) && tp === await ev(PRINT(ids)), { head: tp?.split('\n').slice(0, 6) });
    check('Pascal: no pending edit, the picker stays free', (await status()) !== 'Editing' && !(await picker()).disabled, { status: await status() });
    await crop('text-pascal', '.textual-tab', 420);

    // ---- the EBNF follows ----
    await page.locator('.textual-tab__mode', { hasText: 'EBNF' }).click();
    const ebnf = await poll(`(() => { const e = (window.monaco?.editor?.getEditors?.() || []).find(x => document.querySelector('.textual-tab')?.contains(x.getDomNode()) && x.getRawOptions().readOnly); const v = e?.getValue(); return v && v.includes('":="') ? v : null; })()`, 10000);
    check('EBNF: the grammar is the Pascal one', !!ebnf && ebnf.includes('"begin"'), { head: ebnf?.split('\n').slice(0, 4) });
    await crop('ebnf-pascal', '.textual-tab', 420);
    await page.locator('.textual-tab__mode', { hasText: 'Text' }).click();
    await wait(800);

    // ---- an edit applies (keystrokes) ----
    let edited;
    if (CASE === 'library') {
        const m = /:= '([^'\n]*)';/.exec(tp);
        check('library: a string feature in the Pascal print', !!m, m?.[0]);
        const close = m.index + m[0].length - 2; // before the closing quote
        await caretAt(close);
        await page.keyboard.type(`'#10'x`);
        edited = `'${m[1]}'#10'x'`;
    } else {
        const m = /'([^'\n]*)'/.exec(tp);
        check('demoESM: a string in the Pascal print', !!m, m?.[0]);
        await caretAt(m.index + m[0].length - 1);
        await page.keyboard.type(' ');
        edited = `'${m[1]} '`;
    }
    const dis = await picker();
    check('while the edit is pending the picker is disabled', dis.disabled, dis);
    await crop('bar-pending', '.textual-tab__bar');
    const applied = await poll(`(() => { const s = document.querySelector('.textual-tab__status')?.textContent ?? ''; return /Applied/.test(s) ? s : null; })()`, 15000);
    const t1 = await text();
    check('the edit applies', !!applied, { status: await status() });
    check('the applied text holds the edit and is the model print', t1.includes(edited) && t1 === await ev(PRINT(ids)), { edited });
    check('after Applied the picker is free again', !(await picker()).disabled, await picker());
    if (CASE === 'library') {
        const nl = await ev(`Object.values(window.windoww.store.getState().idlookup).some(o => o && o.className === 'DValue' && Array.isArray(o.values) && o.values.some(v => typeof v === 'string' && v.endsWith('\\nx')))`);
        check('library: the store holds the line break', nl, nl);
        await crop('text-newline', '.textual-tab', 420);
    }

    // ---- one Undo: the edit goes, the style stays ----
    await undo();
    const tu = await poll(`(() => { const v = ${ED}?.getValue(); return v === ${JSON.stringify(tp)} ? v : null; })()`, 10000);
    check('one Cmd+Z undoes the edit: the Pascal text as it was', !!tu, { now: (await text())?.split('\n').slice(0, 4) });
    check('after the Undo the record still names Pascal', (await record()).base === 'pascal', await record());

    // ---- switch back ----
    await page.selectOption('.textual-tab__style-select', 'clike');
    const tb = await poll(`(() => { const v = ${ED}?.getValue(); return v === ${JSON.stringify(t0)} ? v : null; })()`, 10000);
    const rb = await record();
    check('back to C-like: the text before the switch, byte for byte', !!tb, { head: (await text())?.split('\n').slice(0, 4) });
    // With no record before, the switch writes one, and the switch back leaves it empty: `{"v":1}`, which prints as none.
    check('back to C-like: the record string before the switch, or the empty record when there was none', rb.base === 'clike' && (rb.raw === r0.raw || (r0.raw === null && rb.raw === '{"v":1}')), { before: r0.raw, after: rb.raw });

    // ---- the switch is one undo step ----
    await undo();
    const tz = await poll(`(() => { const v = ${ED}?.getValue(); return v === ${JSON.stringify(tp)} ? v : null; })()`, 10000);
    check('one Cmd+Z undoes the switch back: Pascal again, text and record', !!tz && (await record()).base === 'pascal', await record());
    await page.selectOption('.textual-tab__style-select', 'clike');
    await poll(`(() => { const v = ${ED}?.getValue(); return v === ${JSON.stringify(t0)} ? v : null; })()`, 10000);
    await crop('bar-clike-end', '.textual-tab__bar');
    check('no page error', errors.filter(e => !/favicon|ERR_|404/.test(e)).length === 0, errors.slice(0, 5));
} catch (e) {
    check('probe ran', false, String(e?.stack || e).slice(0, 400));
} finally {
    console.log(`${failures === 0 ? 'ALL PASS' : `${failures} FAIL`}  case ${CASE}`);
    await browser.close();
}
