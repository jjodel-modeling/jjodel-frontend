/**
 * templates-mode-restore (P-2026-10-22-1150): the app bar mode survives the page change to Templates.
 *
 * A page change runs `U.resetState()` (PathChecker.tsx:14), whose LOAD of `DState.new()` sets Redux `advanced` to
 * false after the new page's Navbar has mounted. With Advanced persisted, Templates must still read Advanced:
 *   - Basic persisted, All projects, the app bar's Advanced → `#/templates` in the page; Advanced persisted, a reload
 *     on All projects → `#/templates`; All projects → the sidebar's Templates: each time `dataset.mode === 'advanced'`,
 *     the active option is Advanced, at least one visible `.tpl-card__id` (R-LIB-15), held over 3 s;
 *   - the app bar's Basic, reload, Templates: `dataset.mode === 'basic'`, the active option is Basic, no `.tpl-card__id`
 *     (the negative direction).
 * The mode is seeded once (only when absent), so a reload keeps what the app bar last wrote.
 *
 * Run:  ~/.local/bin/node frontend/scripts/lane-run.mjs probe <worktree> frontend/scripts/probe/templates-mode-restore.ts \
 *         --port 3110 --id P-2026-10-22-1150
 */
import { chromium, type Page } from '@playwright/test';
import { OFFLINE_USER } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3110/').replace(/\/$/, '');
if (/:(3000|3001|3003)$/.test(URL)) throw new Error('never 3000, 3001 or 3003');

let failures = 0;
const check = (label: string, ok: boolean, detail: unknown) => {
    if (!ok) failures++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`);
};

const STATE = String.raw`(() => ({
  mode: document.documentElement.dataset.mode || null,
  redux: !!window.windoww.store.getState().advanced,
  stored: localStorage.getItem('jjodel.interfaceMode'),
  active: (document.querySelector('.appbar-mode-switch__opt--active') || {}).textContent || null,
  ids: [...document.querySelectorAll('.tpl-card__id')].filter((e) => e.getBoundingClientRect().width > 0).length,
  cards: document.querySelectorAll('.templates-card').length,
  hash: location.hash,
}))()`;
type State = { mode: string | null; redux: boolean; stored: string | null; active: string | null; ids: number; cards: number; hash: string };
const state = (page: Page) => page.evaluate(STATE) as Promise<State>;

/** The page settled: the app bar is there, the reset's re-initialisation is over, and on Templates the cards are in. */
async function settle(page: Page, templates: boolean) {
    await page.waitForSelector('.appbar-mode-switch', { timeout: 120000 });
    if (templates) await page.waitForSelector('.templates-card', { timeout: 60000 });
    await page.waitForTimeout(1500);
}

/** Advanced on Templates, sampled over 3 s so a late reset cannot pass unseen. */
async function expectAdvanced(page: Page, how: string) {
    let worst: State | null = null;
    for (let i = 0; i < 7; i++) {
        const s = await state(page);
        if (!worst || s.mode !== 'advanced' || s.ids === 0) worst = s;
        await page.waitForTimeout(500);
    }
    const s = worst!;
    check(`${how}: dataset.mode advanced`, s.mode === 'advanced', s);
    check(`${how}: app bar active option Advanced`, s.active === 'Advanced', s.active);
    check(`${how}: a visible .tpl-card__id`, s.ids >= 1, { ids: s.ids, cards: s.cards });
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript((user: typeof OFFLINE_USER) => {
    localStorage.setItem('offline', 'true');
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('jjodel_welcome_3_seen', '1');
    localStorage.setItem('jjodel_welcome_3_1_seen', '1');
    if (!localStorage.getItem('jjodel.interfaceMode')) localStorage.setItem('jjodel.interfaceMode', 'basic');
}, OFFLINE_USER);
const page = await ctx.newPage();
try {
    await page.goto(`${URL}/#/allProjects`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await settle(page, false);
    const s0 = await state(page);
    check('All projects starts in Basic', s0.mode === 'basic' && s0.stored === 'basic', s0);

    // The first switch to Advanced opens a tutorial overlay (AdvancedModeTutorial.tsx) that swallows clicks; set
    // after boot, since Storage.reset (data/storage.ts) clears the keys it does not preserve.
    await page.evaluate(() => localStorage.setItem('jjodel_advanced_mode_tutorial_seen', 'true'));
    await page.click('.appbar-mode-switch__opt:has-text("Advanced")');
    await page.waitForTimeout(800);
    const s1 = await state(page);
    check('All projects: Advanced selected', s1.mode === 'advanced' && s1.stored === 'advanced' && s1.redux, s1);

    // In-page, as the chat measured it: the hash changes, PathChecker resets the state, the Navbar remounts.
    await page.evaluate(() => { location.hash = '#/templates'; });
    await settle(page, true);
    await expectAdvanced(page, 'All projects → #/templates');

    // Advanced persisted from an earlier session, restored at boot on All projects, then the in-page change.
    await page.goto(`${URL}/#/allProjects`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 300000 });
    await settle(page, false);
    const s4 = await state(page);
    check('reload, All projects: Advanced restored', s4.mode === 'advanced' && s4.redux, s4);
    await page.evaluate(() => { location.hash = '#/templates'; });
    await settle(page, true);
    await expectAdvanced(page, 'reload, All projects → #/templates');

    // The sidebar item (R.navigate, a reload of the page on #/templates).
    await page.evaluate(() => { location.hash = '#/allProjects'; });
    await settle(page, false);
    await page.getByText('Templates', { exact: true }).first().click();
    await page.waitForFunction(() => location.hash.startsWith('#/templates'), undefined, { timeout: 30000 });
    await settle(page, true);
    await expectAdvanced(page, 'sidebar → Templates');

    await page.click('.appbar-mode-switch__opt:has-text("Basic")');
    await page.waitForTimeout(800);
    const s2 = await state(page);
    check('Templates: Basic selected', s2.mode === 'basic' && s2.stored === 'basic' && !s2.redux && s2.ids === 0, s2);

    await page.goto(`${URL}/#/allProjects`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 300000 });
    await settle(page, false);
    await page.evaluate(() => { location.hash = '#/templates'; });
    await settle(page, true);
    await page.waitForTimeout(1500);
    const s3 = await state(page);
    check('reload, Templates: dataset.mode basic', s3.mode === 'basic', s3);
    check('reload, Templates: app bar active option Basic', s3.active === 'Basic', s3.active);
    check('reload, Templates: no .tpl-card__id', s3.ids === 0 && s3.cards > 0, { ids: s3.ids, cards: s3.cards });
} finally {
    await browser.close();
}
console.log(failures ? `FAILURES ${failures}` : 'ALL GREEN');
process.exit(failures ? 1 : 0);
