/**
 * jjodie-m2-preview probe (P-2026-10-24-1520, run by P-2026-10-24-1600).
 *
 * Question: does an M2 script get the script card, the ghost preview on the metamodel canvas and an
 * Apply that is one undo step (R-JJD-2, R-JJD-6)? The metamodel of the ESM fixture is opened, a Jjodie
 * reply with an M2 scope and a fixed metamodel script is injected through the chat hook of the S2 probe;
 * the card's chips must equal `scriptCardChips` of the planner, the bar must show the planned creations,
 * the canvas must draw one ghost node per planned classifier and one ghost edge per planned reference and
 * generalization; Apply must create the planned elements per kind (no mismatch warning) and one Cmd+Z
 * must remove all of them.
 *
 * Run:  ~/.local/bin/node frontend/scripts/lane-run.mjs probe <worktree> \
 *         frontend/scripts/probe/jjodie-m2-preview.ts --port 3014 --id P-2026-10-24-1600
 * Env:  M2P_OUT  crop directory (default ~/.jjodel-lanes/P-2026-10-24-1600)
 *
 * Exit code: 1 when a check fails.
 */
import { chromium, type Page } from '@playwright/test';
import { mkdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { seed, VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3014/').replace(/\/$/, '');
if (/:(3000|3001|3002|3003)$/.test(URL)) throw new Error('never 3000, 3001, 3002, 3003');
const FIXTURE = new globalThis.URL('./fixtures/jjscript-m1-esm.jjodel', import.meta.url).pathname;
const OUT = process.env.M2P_OUT || join(homedir(), '.jjodel-lanes', 'P-2026-10-24-1600');
mkdirSync(OUT, { recursive: true });

const SCRIPT = [
    '// M2 probe script',
    'create class M2pA',
    'create class M2pB extends M2pA',
    'create attribute size in M2pA type EInt',
    'create reference peer in M2pB type M2pA',
    'create enumeration M2pKind',
    'create literal ONE in M2pKind',
].join('\n');
const NAMES = ['M2pA', 'M2pB', 'size', 'peer', 'M2pKind', 'ONE'];
const GHOST_NODES = 3; // M2pA, M2pB, M2pKind
const GHOST_EDGES = 2; // peer M2pB -> M2pA, M2pB extends M2pA

let failures = 0;
const check = (label: string, ok: boolean, detail: unknown) => {
    if (!ok) failures++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  ${typeof detail === 'string' ? detail : JSON.stringify(detail).slice(0, 800)}`);
};
const meas = (label: string, v: unknown) => console.log(`MEAS  ${label}  ${typeof v === 'string' ? v : JSON.stringify(v).slice(0, 800)}`);
const wait = (page: Page, ms: number) => page.waitForTimeout(ms);

const JODIE_HOOK = `(() => {
  const root = document.querySelector('.jodie-root');
  const k = root && Object.keys(root).find(k => k.startsWith('__reactFiber$'));
  let f = k && root[k];
  while (f && !(f.type && f.type.name === 'Jodie')) f = f.return;
  let h = f && f.memoizedState;
  while (h) { const s = h.memoizedState; if (s && typeof s === 'object' && Array.isArray(s.messages) && 'isOpen' in s && 'isWaiting' in s) return h; h = h.next; }
  return null;
})()`;

/** The script's metamodel elements present, per kind, and the user's undo/redo lengths. */
async function read(page: Page, mmId: string): Promise<{ kinds: Record<string, number>; names: string[]; undo: number; redo: number }> {
    return page.evaluate(`(async () => {
      const j = await import('/src/joiner/index.ts');
      const pw = await import('/src/jjscript/executor/planWorld.ts');
      const w = pw.buildPlanWorld(j.store.getState().idlookup, ${JSON.stringify(mmId)});
      const els = ((w.m2 && w.m2.elements) || []).filter(e => ${JSON.stringify(NAMES)}.includes(e.name));
      const kinds = {};
      for (const e of els) kinds[e.kind] = (kinds[e.kind] || 0) + 1;
      const h = window.statehistory[j.DUser.current] || { undoable: [], redoable: [] };
      return { kinds, names: els.map(e => e.name).sort(), undo: h.undoable.length, redo: h.redoable.length };
    })()`) as any;
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT }, deviceScaleFactor: 1 });
await seed(ctx, false);
await ctx.addInitScript(() => { (globalThis as any).__name = (f: any) => f; });
const page: Page = await ctx.newPage();
const pageErrors: string[] = [];
const warnings: string[] = [];
page.on('pageerror', (e: Error) => pageErrors.push(e.message));
page.on('console', (m) => { if (m.type() === 'warning' && m.text().includes('[PreviewBar]')) warnings.push(m.text()); });

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

const mm: any = await page.evaluate(`(async () => {
  const j = await import('/src/joiner/index.ts');
  const p = j.L.fromPointer(j.DUser.current).project;
  const m = (p.metamodels || [])[0];
  return m ? { id: m.id, name: m.name } : null;
})()`);
check('metamodel found', !!mm, mm);
await page.evaluate(`(async () => {
  const j = await import('/src/joiner/index.ts');
  const dm = await import('/src/components/abstract/DockManager.tsx');
  await dm.default.open2(j.LModel.fromPointer(${JSON.stringify(mm.id)}));
})()`).catch(() => {});
await wait(page, 4000);
await page.evaluate((x: string) => {
    const b = [...document.querySelectorAll('.dock-tab-btn')].find((e) => e.id.endsWith(`-tab-${x}`)) as HTMLElement | undefined;
    b?.click();
}, mm.id);
await wait(page, 4000);
const paneSel = `[id="${mm.id}"].dock-tabpane-active`;
check('metamodel canvas drawn', await page.evaluate((sel: string) => !!document.querySelector(sel + ' .react-flow__renderer'), paneSel), paneSel);
// A user click: the reducer keeps no undo entry before the first interaction (`isRelevantChangeCheck`).
await page.locator(`${paneSel} .react-flow__pane`).first().click({ position: { x: 600, y: 500 } }).catch(() => {});
await wait(page, 800);
const s0 = await read(page, mm.id);
meas('before preview', s0);

if ((await page.locator('.jodie-window').count()) === 0) {
    await page.locator('.jodie-minimized').first().click().catch(() => {});
    await wait(page, 1500);
}
check('Jjodie window open', (await page.locator('.jodie-window').count()) === 1, '');

const want: any = await page.evaluate(`(async () => {
  const j = await import('/src/joiner/index.ts');
  const pw = await import('/src/jjscript/executor/planWorld.ts');
  const pl = await import('/src/jjscript/executor/effectsPlanner.ts');
  const cm = await import('/src/components/Jodie/scriptCardModel.ts');
  const plan = await pl.planEffects(${JSON.stringify(SCRIPT)}, pw.buildPlanWorld(j.store.getState().idlookup, ${JSON.stringify(mm.id)}));
  return { level: plan.level, chips: cm.scriptCardChips(plan).map(c => c.label), created: plan.created.length, warnings: plan.warnings, errors: plan.errors, generalizations: (plan.generalizations || []).length };
})()`);
meas('planner', want);
check('planner reads M2, no warning, no error', want.level === 'M2' && want.warnings.length === 0 && want.errors.length === 0, want);

const injected = await page.evaluate(`(() => {
  const h = ${JODIE_HOOK};
  if (!h) return 'no chat hook';
  const m = { kind: 'chat', role: 'assistant', timestamp: Date.now(), id: 'msg_m2p_card',
    content: 'Here is the metamodel script:\\n\\n\`\`\`jjscript\\n' + ${JSON.stringify(SCRIPT)} + '\\n\`\`\`',
    jjodieScope: { level: 'M2', metamodelId: ${JSON.stringify(mm.id)}, metamodelName: ${JSON.stringify(mm.name)} } };
  h.queue.dispatch(prev => ({ ...prev, isOpen: true, messages: [...prev.messages, m] }));
  return 'ok';
})()`);
check('reply injected', injected === 'ok', injected);
await wait(page, 3000);

const card: any = await page.evaluate(`(() => {
  const card = [...document.querySelectorAll('.jodie-window .jj-script-card')].pop();
  if (!card) return { count: 0 };
  return { count: 1, status: card.getAttribute('data-status'), chips: [...card.querySelectorAll('.jj-script-card__chip')].map(c => c.textContent),
    runInCard: !!card.querySelector('.md-code-jjscript'), previewing: card.classList.contains('jj-script-card--previewing') };
})()`);
meas('card', card);
check('an M2 reply gets the script card', card.count === 1, card);
check('chips equal the planner', JSON.stringify(card.chips) === JSON.stringify(want.chips), { card: card.chips, planner: want.chips });

const bar = page.locator('.jj-preview-bar');
await bar.waitFor({ state: 'visible', timeout: 15000 }).catch(() => undefined);
const ghosts: any = await page.evaluate((sel: string) => ({
    bar: document.querySelector('.jj-preview-bar')?.textContent?.replace(/\s+/g, ' ').trim() ?? null,
    nodes: document.querySelectorAll(`${sel} .react-flow__node.jj-preview-node`).length,
    edges: document.querySelectorAll(`${sel} .react-flow__edge.jj-preview-edge`).length,
    labels: [...document.querySelectorAll(`${sel} .react-flow__node.jj-preview-node`)].map((n) => (n as HTMLElement).innerText),
}), paneSel);
meas('preview', ghosts);
check(`preview bar shows +${want.created} objects`, !!ghosts.bar && ghosts.bar.includes(`+${want.created} objects`), ghosts.bar);
check(`${GHOST_NODES} ghost nodes on the canvas`, ghosts.nodes === GHOST_NODES, ghosts.nodes);
check(`${GHOST_EDGES} ghost edges on the canvas`, ghosts.edges === GHOST_EDGES, ghosts.edges);

const cb = await page.locator('.jodie-window .jj-script-card').last().boundingBox();
if (cb) await page.screenshot({ path: join(OUT, 'm2-card.png'), clip: { x: cb.x - 8, y: cb.y - 8, width: cb.width + 16, height: cb.height + 16 } });
const pane = await page.locator(paneSel).boundingBox();
if (pane) await page.screenshot({ path: join(OUT, 'm2-canvas-preview.png'), clip: { x: pane.x, y: pane.y, width: pane.width, height: Math.min(pane.height, 700) } });

const t0 = Date.now();
await bar.locator('button', { hasText: 'Apply' }).click().catch(() => {});
await bar.waitFor({ state: 'detached', timeout: 30000 }).catch(() => undefined);
meas('apply ms (click to bar gone)', Date.now() - t0);
await wait(page, 1500);
const s1 = await read(page, mm.id);
meas('after apply', s1);
check('apply created the planned elements per kind', JSON.stringify(s1.kinds) === JSON.stringify({ Class: 2, Attribute: 1, Reference: 1, Enumeration: 1, Literal: 1 }), s1);
check('apply added exactly one undo entry', s1.undo === s0.undo + 1, { before: s0.undo, after: s1.undo });
check('no planned/real mismatch warning', warnings.length === 0, warnings);
const real: any = await page.evaluate(`(async () => {
  const j = await import('/src/joiner/index.ts');
  const L = j.store.getState().idlookup;
  const find = (n, c) => Object.values(L).find(d => d && d.name === n && (!c || d.className === c));
  const a = find('M2pA', 'DClass'), b = find('M2pB', 'DClass'), peer = find('peer', 'DReference');
  return { bExtendsA: !!(a && b && (b.extends || []).includes(a.id)), peerType: peer ? (L[peer.type] || {}).name : null };
})()`);
meas('real elements', real);
check('real generalization and reference type match the plan', real.bExtendsA && real.peerType === 'M2pA', real);

await page.evaluate(`document.querySelector(${JSON.stringify(paneSel + ' .editor-v2')})?.focus() ?? document.querySelector('.editor-v2')?.focus()`);
await wait(page, 400);
await page.keyboard.press('Meta+z');
await wait(page, 2500);
const s2 = await read(page, mm.id);
meas('after one Cmd+Z', s2);
check('one Cmd+Z removes all the script elements', s2.names.length === 0, s2.names);
check('the Apply entry moved to the redo stack', s2.undo === s1.undo - 1 && s2.redo >= 1, { undo: s2.undo, redo: s2.redo });

// A crop of the ghosts themselves: they sit one column right of the drawn classes, under the
// properties rail at 80%. Re-request the preview and shift the viewport; nothing is asserted after this point.
await page.evaluate(`window.dispatchEvent(new CustomEvent('jjodel:script-preview-request', { detail: { script: ${JSON.stringify(SCRIPT)}, modelId: ${JSON.stringify(mm.id)} } }))`);
await bar.waitFor({ state: 'visible', timeout: 15000 }).catch(() => undefined);
// The pane drag selects in this editor: shift the drawn viewport 700px left for the crop only.
await page.evaluate((sel: string) => {
    const vp = document.querySelector(`${sel} .react-flow__viewport`) as HTMLElement | null;
    if (vp) vp.style.transform = vp.style.transform.replace(/translate\(([-\d.]+)px/, (_m, x) => `translate(${parseFloat(x) - 700}px`);
}, paneSel);
await wait(page, 800);
const pane2 = await page.locator(paneSel).boundingBox();
if (pane2) await page.screenshot({ path: join(OUT, 'm2-canvas-ghosts.png'), clip: { x: pane2.x, y: pane2.y, width: pane2.width, height: Math.min(pane2.height, 700) } });
meas('ghost boxes after the shift', await page.evaluate((sel: string) => [...document.querySelectorAll(`${sel} .react-flow__node.jj-preview-node`)].map((n) => {
    const r = n.getBoundingClientRect();
    return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)];
}), paneSel));

meas('page errors', pageErrors.slice(0, 5));
console.log(failures ? `PROBE: ${failures} FAIL` : 'PROBE: ALL PASS');
await browser.close();
process.exit(failures ? 1 : 0);
