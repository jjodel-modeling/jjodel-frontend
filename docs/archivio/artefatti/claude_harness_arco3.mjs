/**
 * Harness arco 3 — il form dell'inspector.
 *
 * Derivato da harness_rail_visivo.mjs (sessione 2026-08-12), stessa ricostruzione
 * deterministica dello scenario, misure diverse: la griglia 84px, le altezze di riga,
 * l'allineamento delle label, il controllo negativo sui `.jj-field` fuori perimetro,
 * e il conteggio dei controlli visibili senza scroll (definition of done del design).
 *
 * Uso:  node harness_arco3.mjs <label> [light|dark]
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

await page.getByRole('button', { name: /new project/i }).first().click();
await page.waitForTimeout(1500); await clean();
await page.locator('input.form-input').first().fill('Harness');
await page.getByRole('button', { name: /create project/i }).click();
await page.waitForTimeout(4000); await clean();
await page.locator('[class*=gallery-card]').filter({ hasText: 'Harness' }).first().click();
await page.waitForTimeout(6000); await clean();
await page.getByRole('button', { name: /create your first metamodel/i }).first().click();
await page.waitForTimeout(5000); await clean();

async function dropOnCanvas(paletteLabel, x, y) {
    await page.evaluate(({ paletteLabel, x, y }) => {
        const src = Array.from(document.querySelectorAll('[draggable="true"]'))
            .find(e => (e.textContent || '').trim().toLowerCase().startsWith(paletteLabel.toLowerCase()));
        if (!src) throw new Error('palette item not found: ' + paletteLabel);
        const canvas = document.querySelector('.react-flow__pane') || document.querySelector('.react-flow');
        if (!canvas) throw new Error('canvas not found');
        const dt = new DataTransfer();
        const mk = (type, target) => target.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: dt, clientX: x, clientY: y }));
        mk('dragstart', src); mk('dragover', canvas); mk('drop', canvas); mk('dragend', src);
    }, { paletteLabel, x, y });
    await page.waitForTimeout(1800);
}
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
        mk('dragstart', src); mk('dragover', target); mk('drop', target); mk('dragend', src);
    }, { paletteLabel, x: box.x + box.width / 2, y: box.y + box.height / 2 });
    await page.waitForTimeout(1500);
}

await dropOnCanvas('Class', 520, 260);
await dropOnCanvas('Abstract Class', 520, 480);
await dropOnCanvas('Enumeration', 850, 260);
await clean();
await dropOnNode('Attribute', 0);
await dropOnNode('Attribute', 0);
await dropOnNode('Operation', 0);
await dropOnNode('Literal', 2);
await clean();

// ── misure specifiche dell'arco 3 ────────────────────────────────────────────
const probe = async () => page.evaluate(() => {
    const R = el => (({ width, height, x, y }) => ({ w: Math.round(width), h: Math.round(height), x: Math.round(x), y: Math.round(y) }))(el.getBoundingClientRect());
    const cs = (sel, props, root = document) => {
        const el = root.querySelector(sel);
        if (!el) return null;
        const s = getComputedStyle(el);
        const o = { _rect: R(el) };
        for (const p of props) o[p] = s.getPropertyValue(p);
        return o;
    };

    const fields = Array.from(document.querySelectorAll('.properties-with-tree-view--rail .properties-fields .jj-field'));
    const rows = fields.map(f => {
        const label = f.querySelector('.jj-field-label');
        const control = Array.from(f.children).find(c => c !== label && !c.classList.contains('jj-field-hint'));
        const hint = f.querySelector('.jj-field-hint');
        const fs_ = getComputedStyle(f);
        return {
            label: label ? (label.textContent || '').trim().slice(0, 24) : null,
            display: fs_.display,
            cols: fs_.gridTemplateColumns,
            gap: fs_.gap,
            fieldRect: R(f),
            labelRect: label ? R(label) : null,
            labelFont: label ? getComputedStyle(label).fontSize : null,
            labelColor: label ? getComputedStyle(label).color : null,
            labelAlign: label ? getComputedStyle(label).textAlign : null,
            controlTag: control ? control.tagName.toLowerCase() + '.' + String(control.className).slice(0, 30) : null,
            controlRect: control ? R(control) : null,
            controlH: control ? getComputedStyle(control).height : null,
            hintCol: hint ? getComputedStyle(hint).gridColumnStart : null,
            hintRect: hint ? R(hint) : null,
        };
    });

    // controllo negativo: i `.jj-field` che NON stanno in `.properties-fields` non devono
    // essere diventati griglie. Se il conteggio e' zero, il controllo NON ha segnale.
    const outside = Array.from(document.querySelectorAll('.jj-field'))
        .filter(f => !f.closest('.properties-fields'))
        .map(f => ({ display: getComputedStyle(f).display, where: (f.closest('[class*=panel],[class*=authoring],[class*=edit-panel]') || {}).className || 'n/a' }));

    // definition of done: controlli visibili senza scroll nel corpo dell'inspector
    const body = document.querySelector('.properties-with-tree-view--rail .properties-tab')
        || document.querySelector('.properties-with-tree-view--rail .properties-panel-body');
    let visibleControls = null, bodyRect = null, hScroll = null;
    if (body) {
        bodyRect = R(body);
        const br = body.getBoundingClientRect();
        const sel = 'input:not([type=hidden]), select, textarea, button, [role=switch], [role=radio], [role=checkbox], .jj-select';
        const seen = new Set();
        visibleControls = Array.from(body.querySelectorAll(sel)).filter(c => {
            const r = c.getBoundingClientRect();
            if (r.width < 4 || r.height < 4) return false;
            if (r.top < br.top || r.bottom > br.bottom) return false;
            const key = Math.round(r.x) + ':' + Math.round(r.y);
            if (seen.has(key)) return false;
            seen.add(key); return true;
        }).length;
        hScroll = body.scrollWidth - body.clientWidth;
    }

    // controlli veri, senza i bottoni: i CollapsibleSection header sono <button> e
    // gonfierebbero il conteggio della definition of done.
    let realControls = null;
    if (body) {
        const br = body.getBoundingClientRect();
        const sel2 = 'input:not([type=hidden]), select, textarea, [role=switch], [role=radio], [role=radiogroup] button, .jj-select';
        const seen2 = new Set();
        realControls = Array.from(body.querySelectorAll(sel2)).filter(c => {
            const r = c.getBoundingClientRect();
            if (r.width < 4 || r.height < 4) return false;
            if (r.top < br.top || r.bottom > br.bottom) return false;
            const key = Math.round(r.x) + ':' + Math.round(r.y);
            if (seen2.has(key)) return false;
            seen2.add(key); return true;
        }).length;
    }

    // passo C e D: flag e disclosure
    const flagEls = Array.from(document.querySelectorAll('.properties-fields .jj-flag'));
    const f0 = flagEls[0] ? getComputedStyle(flagEls[0]) : null;
    const onEl = flagEls.find(e => e.classList.contains('is-on'));
    const flags = {
        count: flagEls.length,
        labels: flagEls.map(e => (e.querySelector('.jj-flag__label') || {}).textContent || ''),
        summary: (document.querySelector('.jj-flags__summary') || {}).textContent || null,
        chipH: f0 && f0.height,
        chipRadius: f0 && f0.borderRadius,
        chipBg: f0 && f0.backgroundColor,
        chipFg: f0 && f0.color,
        onBg: onEl ? getComputedStyle(onEl).backgroundColor : null,
        hintDisplay: document.querySelector('.jj-flag__hint') ? getComputedStyle(document.querySelector('.jj-flag__hint')).display : null,
        trackDisplay: document.querySelector('.jj-flag__track') ? getComputedStyle(document.querySelector('.jj-flag__track')).display : null,
        groupWraps: (() => { const g = document.querySelector('.jj-flags__group'); return g ? Math.round(g.getBoundingClientRect().height) : null; })(),
        checked: flagEls.map(e => e.getAttribute('aria-checked')),
    };
    const disc = document.querySelector('.jj-disclosure');
    const discProbe = disc ? {
        title: (disc.querySelector('.props-section__title') || {}).textContent || null,
        summary: (disc.querySelector('.jj-disclosure__summary') || {}).textContent || '',
        headerH: getComputedStyle(disc.querySelector('.props-section__header')).height,
        chevronOrder: getComputedStyle(disc.querySelector('.props-section__chevron')).order,
    } : null;

    const rail = document.querySelector('.properties-with-tree-view--rail');
    const selName = document.querySelector('.props-header__name, .props-header h1, .props-header');
    return {
        flags, discProbe,
        selected: selName ? (selName.textContent || '').trim().slice(0, 40) : null,
        realControls,
        railPresent: !!rail,
        railRect: rail ? R(rail) : null,
        railFocus: !!document.querySelector('.properties-with-tree-view--rail-focus'),
        fieldsCount: fields.length,
        rows,
        outsideCount: outside.length,
        outsideGrid: outside.filter(o => o.display === 'grid').length,
        outsideSample: outside.slice(0, 6),
        fieldsContainer: cs('.properties-with-tree-view--rail .properties-fields', ['padding', 'display']),
        selectControl: cs('.properties-with-tree-view--rail .properties-fields .jj-select > div', ['height', 'min-height', 'border-radius']),
        selectWrap: cs('.properties-with-tree-view--rail .properties-fields .jj-select', ['height', 'margin', 'padding', 'display']),
        treeRows: Array.from(document.querySelectorAll('.tree-view-panel-body [class*=tree-row]')).slice(0, 30).map(r => (r.textContent || '').trim().slice(0, 26)),
        boundsRow: cs('.properties-with-tree-view--rail .jj-bounds-row', ['display']),
        visibleControls, bodyRect, hScroll,
    };
});

const shoot = async (name) => {
    const rail = page.locator('.properties-with-tree-view--rail').first();
    if (await rail.count()) await rail.screenshot({ path: `${OUT}_${name}.png` }).catch(() => {});
    else await page.screenshot({ path: `${OUT}_${name}.png` });
};

const clickTreeRow = async (name) => {
    const row = page.locator('.tree-view-panel-body [class*=tree-row]').filter({ hasText: name }).first();
    if (await row.count()) { await row.click({ timeout: 4000 }).catch(() => {}); await page.waitForTimeout(1200); }
};

const result = { label: LABEL, theme: THEME, steps: {} };

await clickTreeRow('NewClass');
result.steps.class = await probe();
await shoot('1_class');

await clickTreeRow('attr_0');
result.steps.attribute = await probe();
await shoot('2_attribute');

// ── passo B: il segmentato multiplicity, end to end ──────────────────────────
await clickTreeRow('attr_0');
const multState = async () => page.evaluate(() => {
    const segs = Array.from(document.querySelectorAll('.jj-mult__seg'));
    const row = Array.from(document.querySelectorAll('.tree-view-panel-body [class*=tree-row]'))
        .map(r => (r.textContent || '').trim()).find(t => t.startsWith('attr_0'));
    const s0 = segs[0] ? getComputedStyle(segs[0]) : null;
    const sel = segs.find(b => b.getAttribute('aria-checked') === 'true');
    const selS = sel ? getComputedStyle(sel) : null;
    return {
        count: segs.length,
        labels: segs.map(b => (b.textContent || '').trim()),
        selected: sel ? (sel.textContent || '').trim() : null,
        treeSuffix: row || null,
        offBg: s0 && s0.backgroundColor, offFg: s0 && s0.color, offBorder: s0 && s0.borderTopColor,
        onBg: selS && selS.backgroundColor, onFg: selS && selS.color,
        segH: s0 && s0.height, segFont: s0 && s0.fontFamily.slice(0, 22),
        widths: segs.map(b => Math.round(b.getBoundingClientRect().width)),
        customVisible: !!document.querySelector('.jj-mult__custom'),
        rowOverflow: (() => { const r = document.querySelector('.jj-mult__segments'); return r ? r.scrollWidth - r.clientWidth : null; })(),
    };
});
const clickSeg = async (label) => {
    const b = page.locator('.jj-mult__seg').filter({ hasText: label }).first();
    if (await b.count()) { await b.click().catch(() => {}); await page.waitForTimeout(1000); }
};
result.steps.mult = { initial: await multState() };
await shoot('5_mult_initial');
await clickSeg('[1..*]');
result.steps.mult.afterOneToMany = await multState();
await shoot('6_mult_1toN');
await clickSeg('[0..1]');
result.steps.mult.afterZeroToOne = await multState();
await clickSeg('Custom');
result.steps.mult.afterCustom = await multState();
await shoot('7_mult_custom');
// alza l'upper con lo stepper: prova che gli stepper sopravvivono e scrivono
// selettore stretto: i bottoni del wrapper di NumberInput, non tutti quelli della riga.
const steppers = page.locator('.jj-mult__custom div:has(> button + input) button');
if (await steppers.count()) {
    await steppers.nth(1).click().catch(() => {});   // Lower +
    await page.waitForTimeout(900);
    result.steps.mult.afterLowerPlus = await multState();
    await steppers.nth(3).click().catch(() => {});   // Upper +
    await page.waitForTimeout(900);
}
result.steps.mult.afterStepper = await multState();
await shoot('8_mult_stepper');

await clickTreeRow('attr_1');
result.steps.attribute2 = await probe();
await shoot('3_attr2');

await clickTreeRow('NewAbstractClass');
result.steps.abstractClass = await probe();
await shoot('4_abstract');


// il metamodello: la riga radice del tree
const rootRow = page.locator('.tree-view-panel-body [class*=tree-row]').first();
if (await rootRow.count()) { await rootRow.click().catch(() => {}); await page.waitForTimeout(1200); }
result.steps.metamodel = await probe();
await shoot('5_metamodel');

// ── modalita' Advanced: i flag gated e la disclosure esistono solo qui ───────
// Si passa dal comando vero (`.mode-indicator` in BottomBar.tsx:70), non scrivendo in
// localStorage: cosi' il percorso esercitato e' quello dell'utente.
const modeBtn = page.locator('.mode-indicator').first();
if (await modeBtn.count()) { await modeBtn.click().catch(() => {}); await page.waitForTimeout(1800); await clean(); }
result.advancedOn = await page.evaluate(() => !!document.querySelector('.mode-indicator.advanced-mode'));

await clickTreeRow('NewClass');
result.steps.advClass = await probe();
await shoot('9_adv_class');

await clickTreeRow('attr_0');
result.steps.advAttribute = await probe();
await shoot('10_adv_attribute');

// in postura Focus i flag devono rendersi come righe switch: la postura arriva dal guscio
result.focusPosture = await page.evaluate(() => !!document.querySelector('.properties-with-tree-view--rail-focus'));

await page.keyboard.press('Escape');
await page.waitForTimeout(900);
result.steps.advAttributeBrowse = await probe();
await shoot('11_adv_attribute_browse');

result.errors = errors.slice(0, 10);
fs.writeFileSync(`${OUT}_probe.json`, JSON.stringify(result, null, 1));

const brief = { mult: result.steps.mult };
for (const [k, v] of Object.entries(result.steps)) {
    if (k === 'mult') continue;
    brief[k] = v ? {
        selected: v.selected,
        fields: v.fieldsCount,
        labels: v.rows.map(r => r.label),
        realControls: v.realControls,
        display: v.rows[0]?.display,
        cols: v.rows[0]?.cols,
        labelAlign: v.rows[0]?.labelAlign,
        labelFont: v.rows[0]?.labelFont,
        ctrlH: v.rows.map(r => r.controlH).slice(0, 5),
        selectH: v.selectControl?.height,
        visibleControls: v.visibleControls,
        hScroll: v.hScroll,
        outside: v.outsideCount + ' (grid: ' + v.outsideGrid + ')',
    } : null;
}
console.log(JSON.stringify({ theme: THEME, brief, errors: result.errors }, null, 1));
await browser.close();
