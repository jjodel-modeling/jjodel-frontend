/**
 * refactoring-side-by-side probe (P-2026-10-25-0020). Read-only on sources: it writes only to the throwaway browser
 * profile and to the lane folder.
 *
 * Question: does the Refactoring tab show the target metamodel's own tab beside it and draw its preview on that real
 * canvas? A project with a metamodel of at least 8 classes, two of them moved by hand on the canvas, a model of it
 * whose objects hold values of one attribute, and an M2 Refactoring. Measured: the metamodel tab in a dock panel
 * right of the Refactoring tab (two visible panels, disjoint x ranges, editor about 40 %), one instance of the tab;
 * after Preview the ghosts on the real canvas (an added class dashed cyan, a struck-through removal, a dashed
 * generalization), no canvas bar, the bar in the tab, the class positions unchanged and no ghost over a class;
 * editing re-plans; Apply then one Cmd+Z; a new target moves the beside tab; closing the tab clears the ghosts and
 * leaves the metamodel open; a 1000 px window falls back to the tab's own pane. No page errors.
 *
 * Fixture: fixtures/jjscript-m1-esm.jjodel, plus classes and one attribute added through JjScriptService, a model made
 * by the Navbar's createM1 and a second metamodel by createM2. Real app, own dev server (never 3000..3003).
 *
 * Run:  ~/.local/bin/node frontend/scripts/lane-run.mjs probe <worktree> \
 *         frontend/scripts/probe/refactoring-side-by-side.ts --port 3010 --id P-2026-10-25-0020
 * Env:  SBS_OUT  crop directory (default ~/.jjodel-lanes/P-2026-10-25-0020)
 *
 * Exit code: number of failed checks.
 */
import { chromium, type Page } from '@playwright/test';
import { mkdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { seed } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3010/').replace(/\/$/, '');
const FIXTURE = new globalThis.URL('./fixtures/jjscript-m1-esm.jjodel', import.meta.url).pathname;
const OUT = process.env.SBS_OUT || join(homedir(), '.jjodel-lanes', 'P-2026-10-25-0020');
mkdirSync(OUT, { recursive: true });

let failures = 0;
const check = (name: string, ok: boolean, detail: unknown) => { if (!ok) failures++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ${String(JSON.stringify(detail)).slice(0, 800)}`); };
const meas = (name: string, v: unknown) => console.log(`MEAS  ${name}  ${typeof v === 'string' ? v : String(JSON.stringify(v)).slice(0, 1500)}`);
const wait = (page: Page, ms: number) => page.waitForTimeout(ms);

const TAB = '.dock-tabpane-active .script-tab';

/** The dock: its top-level panels with their tabs, where the script tab and the target tab sit, their DOM boxes. */
const READ_DOCK = (scriptTabId: string, targetId: string) => `(async () => {
  const dm = (await import('/src/components/abstract/DockManager.tsx')).default;
  const layout = dm.dock.getLayout();
  const panels = layout.dockbox.children.map(c => ({ id: c.id, size: c.size, tabs: (c.tabs || []).map(t => t.id), active: c.activeId }));
  let instances = 0;
  const walk = (b) => { for (const c of b.children || []) { if (c.tabs) instances += c.tabs.filter(t => t.id === ${JSON.stringify(targetId)}).length; else walk(c); } };
  walk(layout.dockbox); walk(layout.floatbox || {}); walk(layout.maxbox || {});
  const box = (p) => { const e = p && document.querySelector('.dock-panel[data-dockid="' + p.id + '"]'); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.x), right: Math.round(r.right), width: Math.round(r.width), height: Math.round(r.height) }; };
  const sp = panels.find(p => p.tabs.includes(${JSON.stringify(scriptTabId)}));
  const tp = panels.find(p => p.tabs.includes(${JSON.stringify(targetId)}));
  return { panels, instances, script: sp ? { id: sp.id, active: sp.active, box: box(sp) } : null, target: tp ? { id: tp.id, active: tp.active, box: box(tp) } : null,
    layoutAttr: document.querySelector(${JSON.stringify(TAB)})?.getAttribute('data-layout') || null };
})()`;

/** The canvas in the panel `panelId`: drawn node positions (flow space, from the transform), ghosts, bars. */
const READ_CANVAS = (panelId: string) => `(() => {
  const p = document.querySelector('.dock-panel[data-dockid="' + ${JSON.stringify(panelId)} + '"] .dock-tabpane-active');
  if (!p) return null;
  const pos = {};
  const rects = [];
  for (const n of p.querySelectorAll('.react-flow__node')) {
    const id = n.getAttribute('data-id') || '';
    if (id.startsWith('jjpreview:')) continue;
    const m = /translate\\(([-\\d.]+)px,\\s*([-\\d.]+)px\\)/.exec(n.style.transform || '');
    if (m) pos[id] = [Math.round(+m[1]), Math.round(+m[2])];
    const r = n.getBoundingClientRect(); if (r.width > 0 && !n.closest('.react-flow__node[data-id] .react-flow__node')) rects.push({ x: r.x, y: r.y, w: r.width, h: r.height });
  }
  const ghosts = [...p.querySelectorAll('.react-flow__node.jj-preview-node')].map(n => { const c = getComputedStyle(n); const r = n.getBoundingClientRect(); return { id: n.getAttribute('data-id'), text: n.innerText.trim(), cls: n.className, border: c.borderTopStyle + ' ' + c.borderTopColor, deco: c.textDecorationLine, rect: { x: r.x, y: r.y, w: r.width, h: r.height } }; });
  return { pos, rects, ghosts, ghostEdges: p.querySelectorAll('.react-flow__edge.jj-preview-edge').length, canvasBar: !!p.querySelector('.jj-preview-bar'), nodes: Object.keys(pos).length };
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

// The scene: at least 8 classes, one attribute on a concrete class, a model holding values of it, a second metamodel.
phase = 'scene';
const scene: any = await page.evaluate(`(async () => {
  const j = await import('/src/joiner/index.ts');
  const nav = await import('/src/pages/components/Navbar.tsx');
  const pw = await import('/src/jjscript/executor/planWorld.ts');
  const js = await import('/src/jjscript/index.ts');
  const project = () => j.L.fromPointer(j.DUser.current).project;
  const settle = async (find) => { for (let i = 0; i < 50; i++) { await new Promise(r => setTimeout(r, 100)); const x = find(); if (x) return x; } return null; };
  const esm = project().metamodels[0];
  const m2 = { level: 'M2', metamodelId: esm.id, metamodelName: esm.name };
  const els = () => pw.buildPlanWorld(j.store.getState().idlookup, esm.id).m2.elements;
  const classes = () => els().filter(e => e.kind === 'Class');
  for (let i = 0; classes().length < 8 && i < 8; i++) { await js.JjScriptService.execute('create class RsbC' + i, m2); await new Promise(r => setTimeout(r, 150)); }
  const host = classes().find(e => !e.abstract && !/^E[A-Z]/.test(e.name));
  if (!host) return { error: 'no concrete class' };
  await js.JjScriptService.execute('create attribute rsbLabel in ' + host.name + ' type EString', m2);
  const attr = await settle(() => els().find(e => e.kind === 'Attribute' && e.father === host.id && e.name === 'rsbLabel'));
  if (!attr) return { error: 'no attribute' };
  const ids0 = new Set(project().models.map(m => m.id));
  nav.createM1(project(), esm, false, 'rsbOrg');
  const m = await settle(() => project().models.find(x => !ids0.has(x.id) && !x.isMetamodel));
  if (!m) return { error: 'no model' };
  const scope = { level: 'M1', metamodelId: esm.id, modelId: m.id };
  for (let i = 0; i < 2; i++) {
    await js.JjScriptService.execute('create instance of ' + host.name + ' "rsbP' + i + '"', scope);
    await new Promise(r => setTimeout(r, 150));
    await js.JjScriptService.execute('set rsbP' + i + '.rsbLabel = "v' + i + '"', scope);
    await new Promise(r => setTimeout(r, 150));
  }
  const mm0 = new Set(project().metamodels.map(x => x.id));
  nav.createM2(project(), 'rsbOther');
  const other = await settle(() => project().metamodels.find(x => !mm0.has(x.id)));
  await new Promise(r => setTimeout(r, 500));
  const slot = (pw.buildPlanWorld(j.store.getState().idlookup, esm.id).m2.slotValues || {})[attr.id] || [];
  return { esm: esm.id, esmName: esm.name, classes: classes().length, cls: host.name, attr: attr.name, attrId: attr.id, model: m.id, other: other ? other.id : null, slot };
})()`);
meas('scene', scene);
check('scene: 8 classes or more, a filled attribute, a second metamodel', scene.classes >= 8 && (scene.slot || []).some((s: any) => s.modelId === scene.model && s.count >= 1) && !!scene.other, { classes: scene.classes, slot: scene.slot, other: scene.other });

// The metamodel's tab, full width; two classes moved by hand.
phase = 'layout';
await page.evaluate(`(async () => { const dm = (await import('/src/components/abstract/DockManager.tsx')).default; const j = await import('/src/joiner/index.ts'); await dm.open2(j.L.fromPointer(${JSON.stringify(scene.esm)})); })()`);
await wait(page, 4000);
const fullPanel: any = await page.evaluate(`(async () => { const dm = (await import('/src/components/abstract/DockManager.tsx')).default; const l = dm.dock.getLayout(); const p = l.dockbox.children.find(c => (c.tabs || []).some(t => t.id === ${JSON.stringify(scene.esm)})); return p ? p.id : null; })()`);
const nodeBoxes = await page.locator('.dock-tabpane-active .react-flow__node').evaluateAll((ns) => ns.map((n) => { const r = n.getBoundingClientRect(); return { id: n.getAttribute('data-id'), x: r.x, y: r.y, w: r.width, h: r.height }; }).filter((b) => b.w > 60 && b.h > 30));
meas('class nodes on the full-width canvas', nodeBoxes.length);
for (const b of nodeBoxes.slice(0, 2)) {
    await page.mouse.move(b.x + b.w / 2, b.y + 8);
    await page.mouse.down();
    await page.mouse.move(b.x + b.w / 2 + 70, b.y + 8 + 45, { steps: 8 });
    await page.mouse.up();
    await wait(page, 600);
}
await page.mouse.click(5, 990).catch(() => undefined);
await wait(page, 1500);
const before: any = await page.evaluate(READ_CANVAS(fullPanel));
meas('positions before', before?.pos);
check('the metamodel canvas draws 8 classes or more', (before?.nodes || 0) >= 8, before?.nodes);

// The M2 Refactoring: the metamodel's tab beside it.
phase = 'beside';
const entry: any = await page.evaluate(`(async () => {
  localStorage.removeItem('jjodel.refactoring.splitRatio');
  const sf = await import('/src/components/scripts/scriptFiles.ts');
  const e = sf.createProjectRefactoring({ level: 'M2', name: 'rsb probe' });
  return e ? { id: e.id, name: e.name } : null;
})()`);
const tabId = `jjs_${entry?.id}`;
await wait(page, 3500);
await page.locator(`${TAB} .script-tab__model`).selectOption(scene.esm).catch(() => undefined);
await wait(page, 2500);
let dock: any = await page.evaluate(READ_DOCK(tabId, scene.esm));
meas('dock, idle', dock);
const disjoint = (a: any, b: any) => !!a && !!b && a.width > 200 && b.width > 200 && (a.right <= b.x + 1 || b.right <= a.x + 1);
check('two visible panels, the metamodel right of the Refactoring tab, x ranges disjoint',
    !!dock.script && !!dock.target && dock.script.id !== dock.target.id && disjoint(dock.script.box, dock.target.box) && dock.target.box.x >= dock.script.box.right - 1 && dock.target.active === scene.esm,
    { script: dock.script, target: dock.target });
const share = dock.script?.box && dock.target?.box ? dock.script.box.width / (dock.script.box.width + dock.target.box.width) : null;
check('editor about 40 % of the split', share !== null && Math.abs(share - 0.4) <= 0.03, share);
check('one instance of the metamodel tab', dock.instances === 1, dock.instances);
check('the tab holds the editor only (no pane, no handle)', dock.layoutAttr === 'beside' && (await page.locator(`${TAB} .rfa-pane`).count()) === 0 && (await page.locator(`${TAB} .script-tab__handle`).count()) === 0, dock.layoutAttr);
let canvas: any = await page.evaluate(READ_CANVAS(dock.target?.id || ''));
const samePos = (a: any, b: any) => !!a && !!b && Object.keys(a).length > 0 && Object.keys(a).every((k) => b[k] && b[k][0] === a[k][0] && b[k][1] === a[k][1]);
check('class positions unchanged by the move beside', samePos(before?.pos, canvas?.pos), { before: before?.pos, after: canvas?.pos });
await page.screenshot({ path: join(OUT, 'sbs_idle.png') });

// Preview on the real canvas.
phase = 'preview';
const SCRIPT = [`create class RsbNew extends ${scene.cls}`, `create attribute rsbExtra in ${scene.cls}`, `delete attribute ${scene.cls}.${scene.attr}`].join('\n');
await page.evaluate(`(() => { const m = window.monaco; const x = m.editor.getModels().filter(x => x.getLanguageId() === 'jjscript').pop(); x.setValue(${JSON.stringify(SCRIPT)}); })()`);
await wait(page, 1200);
const readMm = `(async () => {
  const j = await import('/src/joiner/index.ts');
  const L = j.store.getState().idlookup;
  const im = await import('/src/components/abstract/tabs/instanceManagerModel.ts');
  const of = (cn) => Object.values(L).filter(d => d && d.className === cn && im.modelIdOfObject(L, d.id) === ${JSON.stringify(scene.esm)}).map(d => d.name);
  const h = window.statehistory[j.DUser.current] || { undoable: [] };
  return { hasNew: of('DClass').includes('RsbNew'), hasExtra: of('DAttribute').includes('rsbExtra'), hasAttr: !!L[${JSON.stringify(scene.attrId)}], undo: h.undoable.length };
})()`;
const s0 = await page.evaluate(readMm) as any;
await page.locator(`${TAB} .script-tab__toolbar button`, { hasText: 'Preview' }).click();
await wait(page, 2000);
dock = await page.evaluate(READ_DOCK(tabId, scene.esm));
canvas = await page.evaluate(READ_CANVAS(dock.target?.id || ''));
meas('ghosts', canvas?.ghosts);
const added = (canvas?.ghosts || []).find((g: any) => /class RsbNew/.test(g.text));
const removed = (canvas?.ghosts || []).find((g: any) => /jj-preview-node--removed/.test(g.cls));
check('ghost class on the real canvas, dashed cyan', !!added && /^dashed rgb\(6, 182, 212\)$/.test(added.border), added);
check('removal struck through on the real canvas', !!removed && removed.deco === 'line-through' && removed.text.includes(scene.attr), removed);
check('ghost edges drawn (generalization, rows)', (canvas?.ghostEdges || 0) >= 2, canvas?.ghostEdges);
check('no canvas bar; the bar in the tab with Discard and Apply', canvas?.canvasBar === false && (await page.locator(`${TAB} .rfa-bar button`, { hasText: 'Apply' }).count()) === 1 && (await page.locator(`${TAB} .rfa-bar button`, { hasText: 'Discard' }).count()) === 1, canvas?.canvasBar);
check('class positions unchanged by the preview', samePos(before?.pos, canvas?.pos), null);
const hit = (a: any, b: any) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const overlapping = (canvas?.ghosts || []).filter((g: any) => (canvas?.rects || []).some((r: any) => hit(g.rect, r)));
check('no ghost over a class', overlapping.length === 0, overlapping.map((g: any) => g.text));
const sP = await page.evaluate(readMm) as any;
check('nothing runs before Apply', !sP.hasNew && sP.hasAttr && sP.undo === s0.undo, sP);
await page.screenshot({ path: join(OUT, 'sbs_previewing.png') });

// Editing while previewing re-plans: drop the delete, the struck ghost goes.
await page.evaluate(`(() => { const m = window.monaco; const x = m.editor.getModels().filter(x => x.getLanguageId() === 'jjscript').pop(); x.setValue(${JSON.stringify(SCRIPT.split('\n').slice(0, 2).join('\n'))}); })()`);
await wait(page, 1500);
let canvasR: any = await page.evaluate(READ_CANVAS(dock.target?.id || ''));
check('editing while previewing re-plans on the canvas', !!canvasR && !(canvasR.ghosts || []).some((g: any) => /--removed/.test(g.cls)) && (canvasR.ghosts || []).some((g: any) => /RsbNew/.test(g.text)), canvasR?.ghosts?.map((g: any) => g.text));
await page.evaluate(`(() => { const m = window.monaco; const x = m.editor.getModels().filter(x => x.getLanguageId() === 'jjscript').pop(); x.setValue(${JSON.stringify(SCRIPT)}); })()`);
await wait(page, 1500);

// Apply, then one Cmd+Z.
phase = 'apply';
await page.locator(`${TAB} .rfa-bar button`, { hasText: 'Apply' }).click();
await page.locator(`${TAB} .rfa-bar`).waitFor({ state: 'detached', timeout: 30000 }).catch(() => undefined);
await wait(page, 1500);
const s1 = await page.evaluate(readMm) as any;
meas('metamodel after Apply', s1);
check('Apply changed the metamodel, one undo entry', s1.hasNew && s1.hasExtra && !s1.hasAttr && s1.undo === s0.undo + 1, { s0, s1 });
canvasR = await page.evaluate(READ_CANVAS(dock.target?.id || ''));
check('Apply cleared the ghosts', (canvasR?.ghosts || []).length === 0, canvasR?.ghosts?.length);
phase = 'undo';
await page.evaluate(`document.activeElement && document.activeElement.blur && document.activeElement.blur()`);
await page.mouse.click(5, 990).catch(() => undefined);
await wait(page, 300);
await page.keyboard.press('Meta+z');
await wait(page, 2500);
const s2 = await page.evaluate(readMm) as any;
check('one Cmd+Z restores the metamodel', !s2.hasNew && !s2.hasExtra && s2.hasAttr && s2.undo === s1.undo - 1, s2);

// A new target closes the preview and moves the beside tab.
phase = 'target';
await page.locator(`${TAB} .script-tab__toolbar button`, { hasText: 'Preview' }).click();
await wait(page, 1500);
await page.locator(`${TAB} .script-tab__model`).selectOption(scene.other);
await wait(page, 2500);
const dockT: any = await page.evaluate(READ_DOCK(tabId, scene.other));
const dockOld: any = await page.evaluate(READ_DOCK(tabId, scene.esm));
check('the new target beside, active; the old one still open', !!dockT.target && dockT.target.id !== dockT.script?.id && dockT.target.active === scene.other && dockT.instances === 1 && dockOld.instances === 1, { target: dockT.target, oldInstances: dockOld.instances });
check('a new target closes the preview', (await page.locator(`${TAB} .rfa-bar`).count()) === 0 && (await page.locator('.react-flow__node.jj-preview-node').count()) === 0, null);

// Closing the tab clears its preview; the metamodel stays open.
phase = 'close';
await page.locator(`${TAB} .script-tab__model`).selectOption(scene.esm);
await wait(page, 2500);
await page.locator(`${TAB} .script-tab__toolbar button`, { hasText: 'Preview' }).click();
await wait(page, 1500);
const ghostsOpen = await page.locator('.react-flow__node.jj-preview-node').count();
await page.evaluate(`(async () => { const dm = (await import('/src/components/abstract/DockManager.tsx')).default; dm.closeTab(${JSON.stringify(tabId)}); })()`);
await wait(page, 1500);
const dockC: any = await page.evaluate(READ_DOCK(tabId, scene.esm));
check('closing the tab clears its ghosts, the metamodel stays open', ghostsOpen > 0 && (await page.locator('.react-flow__node.jj-preview-node').count()) === 0 && dockC.instances === 1 && !dockC.script, { ghostsOpen, instances: dockC.instances });

// A narrow window: the tab's own pane.
phase = 'narrow';
await page.setViewportSize({ width: 1000, height: 1000 });
await wait(page, 800);
await page.evaluate(`(async () => { const dm = (await import('/src/components/abstract/DockManager.tsx')).default; dm.openScript(${JSON.stringify(entry?.id)}); })()`);
await wait(page, 3000);
const narrow = { layout: await page.locator(TAB).getAttribute('data-layout').catch(() => null), boxes: await page.locator(`${TAB} .rfa-box`).count(), handle: await page.locator(`${TAB} .script-tab__handle`).count() };
check('a 1000 px window falls back to the tab\'s own pane', narrow.layout === 'pane' && narrow.boxes > 0 && narrow.handle === 1, narrow);

check('no page errors', errors.filter((e) => e.text.startsWith('pageerror')).length === 0, errors.slice(0, 6));
await browser.close();
console.log(`\n${failures === 0 ? 'ALL GREEN' : `${failures} FAILED`}`);
process.exit(failures);
