/**
 * refactoring-split-preview probe (P-2026-10-24-2320). Read-only on sources: it writes only to the throwaway
 * browser profile and to the lane folder.
 *
 * Question: does the split Refactoring tab plan as you type, preview on the metamodel and apply as one undo? A
 * project with a metamodel, a model of it whose objects hold values of one attribute, and an M2 Refactoring. Type a
 * script with an unresolved superclass and a delete of the filled attribute: gutter dots, the wavy underline on the
 * unresolved name, the list under the editor and the warnings counter. Preview: ghost classes, struck features and
 * dashed generalizations on the right pane, the bar with chips and the slot loss. Apply: the metamodel changed, one
 * undo entry; one Cmd+Z restores it. Also: the editor at 600 px and its resize persisted, no Save or «Run on» in the
 * header, Jjodie's launcher on the window side. No page errors.
 *
 * Fixture: fixtures/jjscript-m1-esm.jjodel (as jjodie-rf2-run-from-tab.ts), plus one model of its metamodel created
 * through the Navbar's createM1 and filled through JjScriptService. Real app, own dev server (never 3000, 3001,
 * 3003), light theme. Crops: the editor with its diagnostics, the preview pane with the bar, the whole tab.
 *
 * Run:  ~/.local/bin/node frontend/scripts/lane-run.mjs probe <worktree> \
 *         frontend/scripts/probe/refactoring-split-preview.ts --port 3010 --id P-2026-10-24-2320
 * Env:  RFA_OUT  crop directory (default ~/.jjodel-lanes/P-2026-10-24-2320)
 *
 * Exit code: number of failed checks.
 */
import { chromium, type Page } from '@playwright/test';
import { mkdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { seed } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3010/').replace(/\/$/, '');
if (/:(3000|3001|3003)$/.test(URL)) throw new Error('never 3000, 3001, 3003');
const FIXTURE = new globalThis.URL('./fixtures/jjscript-m1-esm.jjodel', import.meta.url).pathname;
const OUT = process.env.RFA_OUT || join(homedir(), '.jjodel-lanes', 'P-2026-10-24-2320');
mkdirSync(OUT, { recursive: true });

let failures = 0;
const check = (name: string, ok: boolean, detail: unknown) => { if (!ok) failures++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ${String(JSON.stringify(detail)).slice(0, 800)}`); };
const meas = (name: string, v: unknown) => console.log(`MEAS  ${name}  ${typeof v === 'string' ? v : String(JSON.stringify(v)).slice(0, 1500)}`);
const wait = (page: Page, ms: number) => page.waitForTimeout(ms);

const TAB = '.dock-tabpane-active .script-tab';

const READ_TAB = `(() => {
  const t = document.querySelector(${JSON.stringify(TAB)});
  if (!t) return null;
  const n = (s) => t.querySelectorAll(s).length;
  const left = t.querySelector('.script-tab__left');
  const bar = t.querySelector('.rfa-bar');
  return {
    buttons: [...t.querySelectorAll('.script-tab__toolbar button')].map(b => b.textContent.trim()),
    of: t.querySelector('.script-tab__of')?.textContent?.trim() || null,
    dirty: !!t.querySelector('.script-tab__dirty'),
    leftWidth: left ? Math.round(left.getBoundingClientRect().width) : null,
    glyphWarn: n('.script-tab__glyph--warning'), glyphErr: n('.script-tab__glyph--error'),
    squiggles: n('.squiggly-warning') + n('.squiggly-error'),
    problems: [...t.querySelectorAll('.script-tab__problem')].map(li => li.innerText.replace(/\\s+/g, ' ').trim()),
    counter: Number(t.querySelector('.script-tab__warnings')?.getAttribute('data-warnings')),
    counterText: t.querySelector('.script-tab__warnings')?.textContent?.trim() || null,
    previewing: t.querySelector('.rfa-pane')?.getAttribute('data-previewing'),
    boxes: n('.rfa-box'), boxesAdded: n('.rfa-box--added'), boxesRemoved: n('.rfa-box--removed'),
    featAdded: n('.rfa-feature--added'), featRemoved: n('.rfa-feature--removed'),
    edgesAdded: n('.rfa-edge--added'), edges: n('.rfa-edge'),
    struck: [...t.querySelectorAll('.rfa-feature--removed .rfa-feature__name')].map(e => getComputedStyle(e).textDecorationLine),
    addedBorder: (() => { const b = t.querySelector('.rfa-box--added'); return b ? getComputedStyle(b).borderTopStyle + ' ' + getComputedStyle(b).borderTopColor : null; })(),
    bar: bar ? bar.innerText.replace(/\\s+/g, ' ').trim() : null,
  };
})()`;

/** The planner's markers on the tab's model, as the text they underline. */
const READ_MARKERS = `(() => {
  const m = window.monaco;
  if (!m) return null;
  return m.editor.getModelMarkers({ owner: 'jjscript-plan' }).map(k => {
    const model = m.editor.getModel(k.resource);
    return { code: typeof k.code === 'string' ? k.code : k.code?.value, text: model ? model.getValueInRange(k) : null, line: k.startLineNumber, severity: k.severity };
  });
})()`;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
await seed(ctx, true);
await ctx.addInitScript(() => { (globalThis as any).__name = (f: any) => f; });
const page: Page = await ctx.newPage();
const errors: Array<{ phase: string; text: string }> = [];
let phase = 'setup';
page.on('pageerror', (e: Error) => errors.push({ phase, text: 'pageerror: ' + e.message }));
page.on('console', (m) => { if (m.type() === 'error') errors.push({ phase, text: m.text().slice(0, 200) }); });

await page.goto(`${URL}/#/allProjects`, { waitUntil: 'domcontentloaded', timeout: 300000 });
await wait(page, 5000);
const pid = await page.evaluate(`(async () => {
  const api = await import('/src/api/persistance/projects.ts');
  const count = () => JSON.parse(localStorage.getItem('projects') || '[]').length;
  const before = count();
  await api.ProjectsApi.importFromText(${JSON.stringify(readFileSync(FIXTURE, 'utf8'))});
  for (let i = 0; i < 75 && count() <= before; i++) await new Promise(r => setTimeout(r, 200));
  const a = JSON.parse(localStorage.getItem('projects') || '[]');
  return a.length > before ? a[a.length - 1].id : null;
})()`) as string | null;
check('fixture imported', !!pid, String(pid));
await page.goto(`${URL}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded', timeout: 300000 });
await wait(page, 9000);
await page.addStyleTag({ content: '.notification-widget, .notification-content, .donation-banner { pointer-events: none !important; display: none !important; }' }).catch(() => {});

// The scene: a model of the metamodel whose objects hold values of one attribute.
phase = 'scene';
const scene: any = await page.evaluate(`(async () => {
  const j = await import('/src/joiner/index.ts');
  const nav = await import('/src/pages/components/Navbar.tsx');
  const pw = await import('/src/jjscript/executor/planWorld.ts');
  const js = await import('/src/jjscript/index.ts');
  const project = () => j.L.fromPointer(j.DUser.current).project;
  const settle = async (find) => { for (let i = 0; i < 50; i++) { await new Promise(r => setTimeout(r, 100)); const x = find(); if (x) return x; } return null; };
  const esm = project().metamodels[0];
  const concreteAttr = (els) => els.find(e => e.kind === 'Attribute' && els.some(c => c.id === e.father && c.kind === 'Class' && !c.abstract));
  // The fixture's metamodel has references only: give its first concrete class one attribute.
  if (!concreteAttr(pw.buildPlanWorld(j.store.getState().idlookup, esm.id).m2.elements)) {
    const host = pw.buildPlanWorld(j.store.getState().idlookup, esm.id).m2.elements.find(e => e.kind === 'Class' && !e.abstract && e.father && !/^E[A-Z]/.test(e.name));
    if (host) await js.JjScriptService.execute('create attribute rfaLabel in ' + host.name + ' type EString', { level: 'M2', metamodelId: esm.id, metamodelName: esm.name });
    await settle(() => concreteAttr(pw.buildPlanWorld(j.store.getState().idlookup, esm.id).m2.elements));
  }
  const L0 = j.store.getState().idlookup;
  const w0 = pw.buildPlanWorld(L0, esm.id);
  const els = w0.m2.elements;
  const attr = concreteAttr(els);
  if (!attr) return { error: 'no attribute on a concrete class' };
  const cls = els.find(c => c.id === attr.father);
  const typeName = (attr.type && L0[attr.type] && L0[attr.type].name) || 'EString';
  const val = (i) => /int|long|short|double|float|byte|real|number/i.test(typeName) ? String(i + 1) : /bool/i.test(typeName) ? 'true' : '"rfaV' + i + '"';
  const ids0 = new Set(project().models.map(m => m.id));
  nav.createM1(project(), esm, false, 'rfaOrg');
  const m = await settle(() => project().models.find(x => !ids0.has(x.id) && !x.isMetamodel));
  if (!m) return { error: 'no model' };
  const scope = { level: 'M1', metamodelId: esm.id, modelId: m.id };
  const replies = [];
  for (let i = 0; i < 3; i++) {
    replies.push((await js.JjScriptService.execute('create instance of ' + cls.name + ' "rfaP' + i + '"', scope)).success);
    await new Promise(r => setTimeout(r, 150));
    replies.push((await js.JjScriptService.execute('set rfaP' + i + '.' + attr.name + ' = ' + val(i), scope)).success);
    await new Promise(r => setTimeout(r, 150));
  }
  await new Promise(r => setTimeout(r, 800));
  const w1 = pw.buildPlanWorld(j.store.getState().idlookup, esm.id);
  const slot = (w1.m2.slotValues || {})[attr.id] || [];
  return { esm: esm.id, esmName: esm.name, model: m.id, modelName: m.name, cls: cls.name, attr: attr.name, attrId: attr.id, typeName, replies, slot };
})()`);
meas('scene', scene);
const filled = (scene.slot || []).find((s: any) => s.modelId === scene.model);
check('scene: the model holds values of the attribute', !!filled && filled.count >= 1, scene.slot);

// The M2 Refactoring, empty, on the metamodel.
phase = 'tab';
const entry: any = await page.evaluate(`(async () => {
  const sf = await import('/src/components/scripts/scriptFiles.ts');
  const e = sf.createProjectRefactoring({ level: 'M2', name: 'rfa probe' });
  return e ? { id: e.id, name: e.name } : null;
})()`);
await wait(page, 3000);
let tab: any = await page.evaluate(READ_TAB);
meas('tab, empty', tab);
check('Refactoring tab opened', !!entry && !!tab, entry);
check('editor at 600 px', tab?.leftWidth === 600, tab?.leftWidth);
check('header: no Save, no «Run on», Preview present', !!tab && !tab.buttons.some((b: string) => /^Save$|^Run/.test(b)) && tab.buttons.includes('Preview'), tab?.buttons);
check('header: «Refactoring of» with the selector', /^Refactoring of/.test(tab?.of || ''), tab?.of);
check('read-only pane draws the metamodel', (tab?.boxes || 0) > 0 && tab?.previewing === 'false', { boxes: tab?.boxes, previewing: tab?.previewing });
const selected = await page.locator(`${TAB} .script-tab__model`).inputValue().catch(() => null);
check('target is the metamodel', selected === scene.esm, { selected, esm: scene.esm });

// Type the script: a superclass that does not resolve, an added class and feature, a delete of the filled attribute.
const LINES = [
    `create class RfaNew extends ${scene.cls}`,
    `create attribute rfaExtra in ${scene.cls}`,
    `delete attribute ${scene.cls}.${scene.attr}`,
    'create class RfaBad extends Nopeclass',
];
const SCRIPT = LINES.join('\n');
meas('monaco width vs left pane', await page.evaluate(`(() => { const t = document.querySelector(${JSON.stringify(TAB)}); const r = (s) => { const e = t && t.querySelector(s); return e ? Math.round(e.getBoundingClientRect().width) : null; }; return { left: r('.script-tab__left'), editor: r('.script-tab__editor'), monaco: r('.script-tab__editor .monaco-editor'), lines: r('.script-tab__editor .view-lines') }; })()`));
await page.locator(`${TAB} .script-tab__editor .monaco-editor`).first().click({ position: { x: 80, y: 12 } });
// The click alone left the focus outside Monaco in the first green run: focus the tab's editor through its API.
const focused = await page.evaluate(`(() => { const t = document.querySelector(${JSON.stringify(TAB)}); const m = window.monaco; const ed = m && m.editor.getEditors ? m.editor.getEditors().find(e => t && t.contains(e.getContainerDomNode())) : null; if (ed) ed.focus(); const a = document.activeElement; return { editor: !!ed, active: a ? a.tagName + '.' + String(a.className).slice(0, 60) : null }; })()`);
meas('focus before typing', focused);
for (let i = 0; i < LINES.length; i++) {
    await page.keyboard.type(LINES[i], { delay: 5 });
    await page.keyboard.press('Escape');
    if (i < LINES.length - 1) await page.keyboard.press('Enter');
}
await wait(page, 300);
let typed = await page.evaluate(`(() => { const m = window.monaco; const ms = m ? m.editor.getModels().filter(x => x.getLanguageId() === 'jjscript') : []; return ms.map(x => x.getValue()); })()`) as string[];
if (!typed.includes(SCRIPT)) {
    meas('typed text differed, set through the model', typed);
    await page.evaluate(`(() => { const m = window.monaco; const x = m.editor.getModels().filter(x => x.getLanguageId() === 'jjscript').pop(); x.setValue(${JSON.stringify(SCRIPT)}); })()`);
}
await wait(page, 1200);
tab = await page.evaluate(READ_TAB);
const markers = await page.evaluate(READ_MARKERS) as any[];
meas('diagnostics', { tab, markers });
check('dirty dot after typing', tab?.dirty === true, tab?.dirty);
check('gutter: amber dots on the two warned lines', tab?.glyphWarn === 2 && tab?.glyphErr === 0, { warn: tab?.glyphWarn, err: tab?.glyphErr });
check('underline: one marker, on «Nopeclass»', markers?.length === 1 && markers[0].text === 'Nopeclass' && markers[0].line === 4, markers);
check('underline drawn', (tab?.squiggles || 0) >= 1, tab?.squiggles);
check('list: the slot loss on L3, the unresolved name on L4:29-37',
    (tab?.problems || []).some((p: string) => /^L3 rfaOrg loses \d+ slot values?$/.test(p) || new RegExp(`^L3 ${scene.modelName} loses \\d+ slot`).test(p))
    && (tab?.problems || []).some((p: string) => p.startsWith('L4:29-37 ') && /Nopeclass/.test(p)), tab?.problems);
check('warnings counter', tab?.counter === (tab?.problems || []).length && tab?.counter >= 2, { counter: tab?.counter, text: tab?.counterText });
const edBox = await page.locator(`${TAB} .script-tab__left`).first().boundingBox();
if (edBox) {
    await page.screenshot({ path: join(OUT, 'rfa_editor_diagnostics.png'), clip: { x: edBox.x, y: edBox.y - 44, width: edBox.width, height: Math.min(edBox.height + 44, 420) } });
    const listBox = await page.locator(`${TAB} .script-tab__problems`).first().boundingBox();
    if (listBox) await page.screenshot({ path: join(OUT, 'rfa_problem_list.png'), clip: listBox });
    meas('crops', [join(OUT, 'rfa_editor_diagnostics.png'), join(OUT, 'rfa_problem_list.png')]);
}

// The undo baseline: one user click in the editor counted as interaction above.
const readMm = `(async () => {
  const j = await import('/src/joiner/index.ts');
  const L = j.store.getState().idlookup;
  const im = await import('/src/components/abstract/tabs/instanceManagerModel.ts');
  const classes = Object.values(L).filter(d => d && d.className === 'DClass' && im.modelIdOfObject(L, d.id) === ${JSON.stringify(scene.esm)}).map(d => d.name);
  const attrs = Object.values(L).filter(d => d && d.className === 'DAttribute' && im.modelIdOfObject(L, d.id) === ${JSON.stringify(scene.esm)}).map(d => d.name);
  const h = window.statehistory[j.DUser.current] || { undoable: [], redoable: [] };
  return { hasNew: classes.includes('RfaNew'), hasBad: classes.includes('RfaBad'), hasExtra: attrs.includes('rfaExtra'), hasAttr: !!L[${JSON.stringify(scene.attrId)}], undo: h.undoable.length };
})()`;
const s0 = await page.evaluate(readMm) as any;
meas('metamodel before', s0);

// Preview.
phase = 'preview';
await page.locator(`${TAB} .script-tab__toolbar button`, { hasText: 'Preview' }).click();
await wait(page, 800);
tab = await page.evaluate(READ_TAB);
meas('preview', tab);
check('preview: one ghost class (RfaNew)', tab?.previewing === 'true' && tab?.boxesAdded === 1, { previewing: tab?.previewing, added: tab?.boxesAdded });
check('preview: ghost dashed cyan', /^dashed rgb\(6, 182, 212\)$/.test(tab?.addedBorder || ''), tab?.addedBorder);
check('preview: one added feature, one struck feature', tab?.featAdded === 1 && tab?.featRemoved === 1 && (tab?.struck || []).every((d: string) => d === 'line-through'), { added: tab?.featAdded, removed: tab?.featRemoved, struck: tab?.struck });
check('preview: one dashed generalization', tab?.edgesAdded === 1, { added: tab?.edgesAdded, all: tab?.edges });
check('preview bar: chips, slot loss, Discard and Apply', /\+1 class/.test(tab?.bar || '') && /\+1 feature/.test(tab?.bar || '') && /\+1 generalization/.test(tab?.bar || '')
    && /−1 element/.test(tab?.bar || '') && /loses \d+ slot value/.test(tab?.bar || '') && /Discard/.test(tab?.bar || '') && /Apply/.test(tab?.bar || ''), tab?.bar);
const sP = await page.evaluate(readMm) as any;
check('nothing runs before Apply', !sP.hasNew && sP.hasAttr && sP.undo === s0.undo, sP);
const rightBox = await page.locator(`${TAB} .script-tab__right`).first().boundingBox();
if (rightBox) {
    await page.screenshot({ path: join(OUT, 'rfa_preview_pane.png'), clip: rightBox });
    meas('crop', join(OUT, 'rfa_preview_pane.png'));
}
const tabBox = await page.locator(TAB).first().boundingBox();
if (tabBox) {
    await page.screenshot({ path: join(OUT, 'rfa_tab.png'), clip: tabBox });
    meas('crop', join(OUT, 'rfa_tab.png'));
}

// Editing while previewing re-plans: drop the last line, the counter loses its warning.
await page.evaluate(`(() => { const m = window.monaco; const x = m.editor.getModels().filter(x => x.getLanguageId() === 'jjscript').pop(); x.setValue(${JSON.stringify(LINES.slice(0, 3).join('\n'))}); })()`);
await wait(page, 1000);
const tabR: any = await page.evaluate(READ_TAB);
meas('after edit while previewing', tabR);
check('editing while previewing re-plans', tabR?.previewing === 'true' && tabR?.counter === (tab?.counter || 0) - 1 && !!tabR?.bar, { before: tab?.counter, after: tabR?.counter });

// Apply.
phase = 'apply';
await page.locator(`${TAB} .rfa-bar button`, { hasText: 'Apply' }).click();
await page.locator(`${TAB} .rfa-bar`).waitFor({ state: 'detached', timeout: 30000 }).catch(() => undefined);
await wait(page, 1500);
const s1 = await page.evaluate(readMm) as any;
meas('metamodel after Apply', s1);
check('Apply changed the metamodel', s1.hasNew && s1.hasExtra && !s1.hasAttr && !s1.hasBad, s1);
check('Apply is one undo entry', s1.undo === s0.undo + 1, { before: s0.undo, after: s1.undo });
check('Apply cleared the preview', (await page.evaluate(READ_TAB) as any)?.previewing === 'false', null);

// One Cmd+Z, the focus out of the editor.
phase = 'undo';
await page.evaluate(`document.activeElement && document.activeElement.blur && document.activeElement.blur()`);
await page.mouse.click(5, 990).catch(() => undefined);
await wait(page, 300);
await page.keyboard.press('Meta+z');
await wait(page, 2500);
const s2 = await page.evaluate(readMm) as any;
meas('metamodel after one Cmd+Z', s2);
check('one Cmd+Z restores the metamodel', !s2.hasNew && !s2.hasExtra && s2.hasAttr && s2.undo === s1.undo - 1, s2);

// Resize: +100 px, persisted on pointer-up.
phase = 'resize';
const h = await page.locator(`${TAB} .script-tab__handle`).first().boundingBox();
if (h) {
    await page.mouse.move(h.x + h.width / 2, h.y + 200);
    await page.mouse.down();
    await page.mouse.move(h.x + h.width / 2 + 60, h.y + 200, { steps: 4 });
    await page.mouse.move(h.x + h.width / 2 + 100, h.y + 200, { steps: 4 });
    await page.mouse.up();
}
await wait(page, 300);
const width = await page.evaluate(`({ dom: Math.round(document.querySelector(${JSON.stringify(TAB)} + ' .script-tab__left').getBoundingClientRect().width), stored: localStorage.getItem('jjodel.refactoring.editorWidth') })`) as any;
meas('resize', width);
check('resize to 700 px, persisted', width.dom === 700 && width.stored === '700', width);

// Jjodie's launcher on this page: on the window side, not over the sidebar.
const launcher = await page.locator('.jodie-minimized').first().boundingBox().catch(() => null);
meas('launcher', launcher);
check('launcher on the window side', !!launcher && launcher.x + launcher.width >= 1600 - 24 && launcher.x > 800, launcher);

// The launcher rule holds only while the Refactoring tab is the active one: switch to another tab of the dock.
phase = 'other tab';
const other = await page.evaluate(`(() => { const tabs = [...document.querySelectorAll('.dock-tab')]; const o = tabs.find(t => !t.classList.contains('dock-tab-active') && !/rfa probe/.test(t.textContent)); if (!o) return null; (o.querySelector('.dock-tab-btn') || o).dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); (o.querySelector('.dock-tab-btn') || o).click(); return o.textContent.trim(); })()`);
await wait(page, 1200);
const offTab = await page.evaluate(`(() => { const l = document.querySelector('.jodie-minimized'); const r = l ? l.getBoundingClientRect() : null; return { scriptActive: !!document.querySelector(${JSON.stringify(TAB)}), launcher: r ? { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width) } : null, right: l ? getComputedStyle(l).right : null }; })()`) as any;
meas('launcher on another tab', { other, ...offTab });
check('launcher rule off on another tab', !!other && !offTab.scriptActive && !!offTab.launcher && !(offTab.launcher.x === Math.round(launcher?.x ?? -1) && offTab.launcher.y === Math.round(launcher?.y ?? -1)), { other, ...offTab });
await page.screenshot({ path: join(OUT, 'rfa_other_tab_launcher.png') });
meas('crop', join(OUT, 'rfa_other_tab_launcher.png'));

check('no page errors', errors.filter(e => e.text.startsWith('pageerror')).length === 0, errors.slice(0, 6));
meas('console errors', errors.slice(0, 6));
await browser.close();
console.log(`${failures === 0 ? 'ALL PASS' : failures + ' FAILED'}`);
process.exit(failures);
