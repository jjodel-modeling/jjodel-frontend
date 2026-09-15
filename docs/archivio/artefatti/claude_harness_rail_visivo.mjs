/**
 * Harness di verifica visiva del rail destro.
 *
 * Ricostruisce lo scenario deterministico: progetto nuovo, un metamodello, due classi
 * (una concreta e una astratta) con un attributo sulla concreta, e poi misura.
 * Gira interamente in container: build di produzione servita da `vite preview`,
 * app in modalita' Offline, Playwright su Chromium.
 *
 * Uso:  node _harness_rail.mjs <label> [light|dark]
 * Produce: /root/harness/shots/<label>_<tema>_*.png  e  <label>_<tema>_probe.json
 */
import { chromium } from 'playwright';
import fs from 'fs';

const URL = 'http://localhost:3002';
const LABEL = process.argv[2] || 'run';
const THEME = process.argv[3] || 'light';
const DIR = '/root/harness/shots';
const OUT = `${DIR}/${LABEL}_${THEME}`;
fs.mkdirSync(DIR, { recursive: true });

const browser = await chromium.launch({ headless: true, executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push('pageerror: ' + e.message.slice(0, 160)));

const clean = async () => { await page.evaluate(() => document.querySelectorAll('.wm-backdrop').forEach(e => e.remove())); };

// ── 1. apri l'app in Offline mode, col tema richiesto ────────────────────────
// Il modale «what's new» monta un `.wm-backdrop` che intercetta i click anche quando i
// suoi bottoni sono visibili, e puo' comparire in ritardo: un osservatore lo toglie
// appena appare, invece di sperare che una pulizia a tempo fisso lo prenda.
await page.addInitScript(theme => {
    try { localStorage.setItem('theme', theme); } catch { /* ignore */ }
    const kill = () => document.querySelectorAll('.wm-backdrop').forEach(e => e.remove());
    const start = () => { kill(); new MutationObserver(kill).observe(document.documentElement, { childList: true, subtree: true }); };
    if (document.documentElement) start(); else document.addEventListener('readystatechange', start, { once: true });
}, THEME);
await page.goto(URL, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500); await clean();
await page.getByText(/offline mode/i).first().click();
await page.waitForTimeout(3500); await clean();

// ── 2. progetto e metamodello ────────────────────────────────────────────────
await page.getByRole('button', { name: /new project/i }).first().click();
await page.waitForTimeout(1500); await clean();
await page.locator('input.form-input').first().fill('Harness');
await page.getByRole('button', { name: /create project/i }).click();
await page.waitForTimeout(4000); await clean();
await page.locator('[class*=gallery-card]').filter({ hasText: 'Harness' }).first().click();
await page.waitForTimeout(6000); await clean();
await page.getByRole('button', { name: /create your first metamodel/i }).first().click();
await page.waitForTimeout(5000); await clean();

// ── 3. due classi sul canvas, via HTML5 drag-and-drop ────────────────────────
// La palette usa dnd nativo (PalettePanel.tsx): servono DragEvent sintetici con un
// DataTransfer condiviso, e clientX/clientY passati al costruttore (sono getter).
async function dropOnCanvas(paletteLabel, x, y) {
    await page.evaluate(({ paletteLabel, x, y }) => {
        const src = Array.from(document.querySelectorAll('[draggable="true"]'))
            .find(e => (e.textContent || '').trim().toLowerCase().startsWith(paletteLabel.toLowerCase()));
        if (!src) throw new Error('palette item not found: ' + paletteLabel);
        const canvas = document.querySelector('.react-flow__pane') || document.querySelector('.react-flow');
        if (!canvas) throw new Error('canvas not found');
        const dt = new DataTransfer();
        const mk = (type, target) => target.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: dt, clientX: x, clientY: y }));
        mk('dragstart', src);
        mk('dragover', canvas);
        mk('drop', canvas);
        mk('dragend', src);
    }, { paletteLabel, x, y });
    await page.waitForTimeout(1800);
}

await dropOnCanvas('Class', 520, 260);
await dropOnCanvas('Abstract Class', 520, 480);
await dropOnCanvas('Enumeration', 850, 260);
await clean();

// Le feature si droppano SUL nodo, non sul canvas: servono per coprire i kind che
// la sola coppia di classi non produce (attribute, operation, literal).
async function dropOnNode(paletteLabel, nodeIndex) {
    const box = await page.locator('.react-flow__node').nth(nodeIndex).boundingBox().catch(() => null);
    if (!box) return;
    await page.evaluate(({ paletteLabel, x, y }) => {
        const src = Array.from(document.querySelectorAll('[draggable="true"]'))
            .find(e => (e.textContent || '').trim().toLowerCase().startsWith(paletteLabel.toLowerCase()));
        const target = document.elementFromPoint(x, y);
        if (!src || !target) return;
        const dt = new DataTransfer();
        const mk = (type, t) => t.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: dt, clientX: x, clientY: y }));
        mk('dragstart', src);
        mk('dragover', target);
        mk('drop', target);
        mk('dragend', src);
    }, { paletteLabel, x: box.x + box.width / 2, y: box.y + box.height / 2 });
    await page.waitForTimeout(1500);
}

await dropOnNode('Attribute', 0);
await dropOnNode('Attribute', 0);   // due fratelli: senza il secondo lo stepper non ha dove andare
await dropOnNode('Operation', 0);
await dropOnNode('Literal', 2);
await clean();

// ── 4. misure ────────────────────────────────────────────────────────────────
const probeOf = async (what) => page.evaluate(() => {
    const cs = (sel, props) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const s = getComputedStyle(el);
        const o = { _rect: (({ width, height, x, y }) => ({ width: Math.round(width), height: Math.round(height), x: Math.round(x), y: Math.round(y) }))(el.getBoundingClientRect()) };
        for (const p of props) o[p] = s.getPropertyValue(p);
        return o;
    };
    const box = ['color', 'background-color', 'font-size', 'font-weight', 'font-style', 'font-family', 'padding', 'height', 'border-radius'];
    return {
        railPresent: !!document.querySelector('.properties-with-tree-view--rail'),
        railFocus: !!document.querySelector('.properties-with-tree-view--rail-focus'),
        focusBar: cs('.rail-focusbar', box),
        focusBarBack: cs('.rail-focusbar__back', box),
        focusBarCurrent: cs('.rail-focusbar__current', box),
        stepPrev: cs('.rail-focusbar__step--prev', box),
        stepNext: cs('.rail-focusbar__step--next', box),
        treePane: cs('.properties-with-tree-view--rail .tree-view-panel-container', ['height', 'opacity', 'border-bottom-width']),
        identityBadge: cs('.props-header__glyph', box),
        identityKind: cs('.props-header__kind', box),
        identitySig: cs('.props-header__signature', box),
        identitySigChip: cs('.props-header__signature--chip', box),
        propsHeader: cs('.props-header', box),
        propsHeaderName: cs('.props-header__name', box),
        typeBadge: cs('.props-header .jj-type-badge', box),
        contextBar: cs('.properties-panel-container .jj-context-bar', box),
        formBody: cs('.properties-tab', ['padding']),
        formFields: cs('.properties-fields', ['padding', 'margin']),
        firstInput: cs('.properties-panel-container input', ['padding']),
        treeIcons: Array.from(document.querySelectorAll('.tree-view-panel-body .tree-node__icon')).slice(0, 30).map(el => {
            const s = getComputedStyle(el);
            const i = el.querySelector('i');
            return { cls: el.className, color: s.color, bg: s.backgroundColor, glyph: i ? getComputedStyle(i).color : null };
        }),
        treeRows: Array.from(document.querySelectorAll('.tree-view-panel-body [class*=tree-row]')).slice(0, 24).map(r => (r.textContent || '').trim().slice(0, 30)),
        toggles: Array.from(document.querySelectorAll('.properties-panel-container [class*=toggle-wrapper], .properties-panel-container [class*=jj-toggle]')).slice(0, 10).map(el => {
            const s = getComputedStyle(el);
            const r = el.getBoundingClientRect();
            return { cls: el.className.toString().slice(0, 48), justify: s.justifyContent, ml: s.marginLeft, x: Math.round(r.x), w: Math.round(r.width) };
        }),
    };
});

const shoot = async (name) => {
    const rail = page.locator('.properties-with-tree-view--rail').first();
    if (await rail.count()) await rail.screenshot({ path: `${OUT}_${name}.png` }).catch(() => {});
    else await page.screenshot({ path: `${OUT}_${name}.png` });
};

const result = { label: LABEL, theme: THEME, steps: {} };

// (a) niente selezionato / metamodello selezionato
result.steps.initial = await probeOf();
await shoot('1_initial');

// (b) seleziona la classe concreta dal tree
const clickTreeRow = async (name) => {
    const row = page.locator('.tree-view-panel-body [class*=tree-row]').filter({ hasText: name }).first();
    if (await row.count()) { await row.click({ timeout: 4000 }).catch(() => {}); await page.waitForTimeout(1200); }
};
await clickTreeRow('NewClass');
result.steps.classSelected = await probeOf();
await shoot('2_class');

// (c) seleziona una foglia (attributo): in preset 2a deve passare in Focus
await clickTreeRow('attr_0');
result.steps.leafSelected = await probeOf();
await shoot('3_leaf');

// (c2) stepper dei fratelli: bottone "next", poi la tastiera "k"
const nameNow = () => page.evaluate(() => document.querySelector('.rail-focusbar__current')?.textContent || '');
result.steps.stepper = { before: await nameNow() };
const stepBtns = page.locator('.rail-focusbar__step');
if (await stepBtns.count() === 2) {
    await stepBtns.nth(1).click().catch(() => {});
    await page.waitForTimeout(900);
    result.steps.stepper.afterNextClick = await nameNow();
    await page.keyboard.press('k');
    await page.waitForTimeout(900);
    result.steps.stepper.afterPrevKey = await nameNow();
    await shoot('3b_stepper');
}

// (d) Escape torna a Browse
await page.keyboard.press('Escape');
await page.waitForTimeout(900);
result.steps.afterEscape = await probeOf();
await shoot('4_after_escape');

result.headerHtml = await page.evaluate(() => {
    const h = document.querySelector('.props-header');
    return h ? h.outerHTML.slice(0, 700) : 'NO .props-header';
});
result.errors = errors.slice(0, 10);
fs.writeFileSync(`${OUT}_probe.json`, JSON.stringify(result, null, 1));
console.log(JSON.stringify({
    rail: result.steps.initial.railPresent,
    rowsClass: result.steps.classSelected.treeRows.slice(0, 14),
    focusAfterLeaf: result.steps.leafSelected.railFocus,
    focusAfterEscape: result.steps.afterEscape.railFocus,
    errors: result.errors,
    stepper: result.steps.stepper,
}, null, 1));
await browser.close();
