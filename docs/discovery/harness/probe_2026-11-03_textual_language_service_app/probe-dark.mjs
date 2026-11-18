// P-2026-11-03-2300 phase 1: the Text tab and its Monaco under html[data-theme="dark"] today, and the Monaco theme in use.
import { setup, note, failures, check } from './common.mjs';
const { browser, page, wait, poll } = await setup();
const TAB = `[...document.querySelectorAll('.textual-tab')].find(t => !t.querySelector('.textual-tab__model-name') && t.offsetParent !== null)`;
try {
    await poll(`(() => document.querySelector('.textual-tab .monaco-editor') ? true : null)()`, 20000);
    await wait(1000);
    for (const theme of ['light', 'dark']) {
        await page.evaluate(`theme => { if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark'); else document.documentElement.removeAttribute('data-theme'); }`.replace(/^theme => /, `(theme => `) + `)(${JSON.stringify(theme)})`);
        await wait(500);
        note(theme + ': monaco background', await page.evaluate(`getComputedStyle(${TAB}.querySelector('.monaco-editor-background')).backgroundColor`));
        note(theme + ': tab bar background', await page.evaluate(`getComputedStyle(${TAB}.querySelector('.textual-tab__bar')).backgroundColor`));
        note(theme + ': monaco theme class', await page.evaluate(`${TAB}.querySelector('.monaco-editor').className`));
        const el = (await page.evaluateHandle(TAB)).asElement();
        await el.screenshot({ path: `/Users/alfonso/.jjodel-lanes/P-2026-11-03-2300/phase1-${theme}-today.png` });
    }
    check('probe ran', true, null);
} catch (e) { check('probe ran', false, String(e && e.stack || e).slice(0, 400)); }
finally { await browser.close(); console.log(failures ? `FAILURES ${failures}` : 'ALL PASS'); process.exit(failures ? 1 : 0); }
