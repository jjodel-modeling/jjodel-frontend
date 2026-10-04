/**
 * jjscript-m1-containment probe (P-2026-10-04-0946).
 *
 * Question: what JjScript does today, at M1, with a state machine whose transitions are contained by
 * their source state (ESM: `State.transitions` composition 0..* of `Transition`, `Transition.nextState`
 * 0..1 `State`, `Transition.event` 0..1 `Event`), and what the write path of a `create instance ... in
 * <Parent>.<ref>` would meet in the D-layer.
 *
 * Drives the real app on its own dev server (never 3001), 1440x900, light. The ESM metamodel is seeded
 * by JjScript at M2 (MODE=seed, the default; JSM1_WRITE_FIXTURE=1 saves it as the fixture) or imported
 * from the fixture (MODE=fixture). Every experiment then runs in a fresh M1 model of it, created by the
 * function the «New model» entry calls (`Navbar.tsx` `createM1`):
 *
 *   E1  Q7, the microwave script as an LLM writes it today (`create instance` at the root, the
 *       containment `set ... += ...` lines before the transition they attach, the events after the
 *       lines that link them), run through Jjodie's Run: a scoped M1 reply injected in the chat, «Run as
 *       JjScript», «Run», the summary read from the DOM. Then the D-layer: every DObject of the model
 *       with its father, whether `model.objects` lists it, and its slots; the tree, every node expanded.
 *   E2  Q7, the same machine in the form decision (b) proposes (`create instance of Transition "t" in
 *       s.transitions`), one parent created after its child line: what today's parser and executor
 *       make of a syntax they do not know.
 *   E3  Q2, `set <Parent>.transitions += <child>` on a child at the root, one command at a time through
 *       `JjScriptService.execute` with the M1 scope (the call Jjodie's Run makes per line): first attach,
 *       the same attach again, a move to another state, `=` instead of `+=`, a State into the Transition
 *       slot.
 *   E4  Q3/Q4, the write path of (b) prototyped with the calls the executor would make
 *       (`DObject.new(metaclass, <DValue of the slot>, DValue, name, true)`, as `LValue.addObject` does
 *       for a containment slot): is the parent's slot reachable right after its `create instance`
 *       returns, after a macrotask, after the Run's 20 ms; where the child lands; whether a later
 *       command finds it by name inside the same run (handle registered) and in a new run (registry
 *       cleared), and what the dependency wait costs in each case.
 *   E5  Q6, what the Run summary would read: `projectFigures` instances against the DObjects of the
 *       model, and `topLevelReason` of each class of the metamodel.
 *
 * Phase 2 (JSM1_TAG=after…): the same experiments assert the fix. E1, the script as written today:
 * no `not found` left after the retry passes. E2, the machine with `in`: 0 errors, every Transition
 * in the `transitions` slot of its source State and not in `model.objects`, the same in the tree;
 * E2b, a second reply renames a contained Transition (found model-wide in a new run). E4: the nested
 * child found by name in a new run, and without the 500 ms wait in the same run. Crops of the tree
 * and of the canvas of E1 and E2, at most 600 px wide.
 *
 * Run:  ~/.local/bin/node frontend/scripts/lane-run.mjs probe <worktree> \
 *         frontend/scripts/probe/jjscript-m1-containment.ts --port 3096 --id P-2026-10-04-0946
 * Env:  JSM1_MODE           seed | fixture (default seed)
 *       JSM1_FIXTURE        fixture path (default frontend/scripts/probe/fixtures/jjscript-m1-esm.jjodel)
 *       JSM1_WRITE_FIXTURE  "1": in seed mode, save the project with the metamodel alone and write it
 *       JSM1_TAG            label of the run (default before); files are named after it
 *       JSM1_OUT            JSON output (default ~/.jjodel-lanes/P-2026-10-04-0946/probe_<tag>.json)
 *       JSM1_CROPS          crop directory (default ~/.jjodel-lanes/P-2026-10-04-0946/crops)
 */
import { chromium, type Page } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { seed, VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3096/').replace(/\/$/, '');
if (/:3001$/.test(URL)) throw new Error('never 3001');
const LANE = `${process.env.HOME}/.jjodel-lanes/P-2026-10-04-0946`;
const MODE = process.env.JSM1_MODE || 'seed';
const FIXTURE = process.env.JSM1_FIXTURE || new globalThis.URL('./fixtures/jjscript-m1-esm.jjodel', import.meta.url).pathname;
const TAG = process.env.JSM1_TAG || 'before';
const AFTER = TAG.startsWith('after');
const OUT = process.env.JSM1_OUT || `${LANE}/probe_${TAG}.json`;
const CROPS = (process.env.JSM1_CROPS || `${LANE}/crops`).replace(/\/$/, '');

let failures = 0;
const check = (label: string, ok: boolean, detail: unknown) => {
    if (!ok) failures++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  ${typeof detail === 'string' ? detail : JSON.stringify(detail).slice(0, 1500)}`);
};
const meas = (label: string, v: unknown) => console.log(`MEAS  ${label}  ${typeof v === 'string' ? v : JSON.stringify(v).slice(0, 4000)}`);

/** The ESM metamodel, seeded at M2. */
const ESM = [
    'create class State',
    'create class Initial extends State',
    'create class Terminal extends State',
    'create class Transition',
    'create class Event',
    'create composition transitions in State type Transition [0..*]',
    'create reference nextState in Transition type State [0..1]',
    'create reference event in Transition type Event [0..1]',
];

/**
 * E1, Q7: the microwave as an LLM writes it under today's prompt when it does not keep «create before
 * link». Each state names its transitions before they exist; each transition names its event before
 * it exists. 24 commands.
 */
const MICROWAVE_TODAY = [
    '# Microwave oven',
    'create instance of Initial "idle"',
    'set idle.transitions += tStart',
    'create instance of State "cooking"',
    'set cooking.transitions += tOpen',
    'set cooking.transitions += tDone',
    'create instance of State "doorOpen"',
    'set doorOpen.transitions += tClose',
    'create instance of Terminal "stopped"',
    'create instance of Transition "tStart"',
    'set tStart.nextState = cooking',
    'set tStart.event = evStart',
    'create instance of Transition "tOpen"',
    'set tOpen.nextState = doorOpen',
    'set tOpen.event = evOpen',
    'create instance of Transition "tClose"',
    'set tClose.nextState = idle',
    'set tClose.event = evClose',
    'create instance of Transition "tDone"',
    'set tDone.nextState = stopped',
    'set tDone.event = evTimer',
    'create instance of Event "evStart"',
    'create instance of Event "evOpen"',
    'create instance of Event "evClose"',
    'create instance of Event "evTimer"',
].join('\n');

/**
 * E2: the same machine in the form decision (b) proposes. `tClose` names its parent `doorOpen` before
 * `doorOpen` exists; `tOpen` writes the name before `in`, `tDone` after the parent. 20 commands.
 */
const MICROWAVE_NESTED = [
    '# Microwave oven, transitions born inside their source state',
    'create instance of Initial "idle"',
    'create instance of State "cooking"',
    'create instance of Terminal "stopped"',
    'create instance of Transition "tStart" in idle.transitions',
    'set tStart.nextState = cooking',
    'set tStart.event = evStart',
    'create instance of Transition "tOpen" in cooking.transitions',
    'set tOpen.nextState = doorOpen',
    'set tOpen.event = evOpen',
    'create instance of Transition in cooking.transitions "tDone"',
    'set tDone.nextState = stopped',
    'set tDone.event = evTimer',
    'create instance of Transition "tClose" in doorOpen.transitions',
    'set tClose.nextState = idle',
    'set tClose.event = evClose',
    'create instance of State "doorOpen"',
    'create instance of Event "evStart"',
    'create instance of Event "evOpen"',
    'create instance of Event "evClose"',
    'create instance of Event "evTimer"',
].join('\n');

// ── Page helpers ──────────────────────────────────────────────────────────────────────────────────────

const JODIE_HOOK = `(() => {
  const root = document.querySelector('.jodie-root');
  const k = root && Object.keys(root).find(k => k.startsWith('__reactFiber$'));
  let f = k && root[k];
  while (f && !(f.type && f.type.name === 'Jodie')) f = f.return;
  let h = f && f.memoizedState;
  while (h) { const s = h.memoizedState; if (s && typeof s === 'object' && Array.isArray(s.messages) && 'isOpen' in s && 'isWaiting' in s) return h; h = h.next; }
  return null;
})()`;

/** Every DObject whose father chain ends in the model, with its container and its slots. */
const READ_MODEL = (modelId: string) => `(() => {
  const L = (window.store || window.windoww.store).getState().idlookup;
  const m = L[${JSON.stringify(modelId)}];
  const nm = (id) => (L[id] && L[id].name !== undefined) ? L[id].name : id;
  const modelOf = (o) => { let f = L[o.father], n = 0; while (f && f.className !== 'DModel' && n++ < 50) f = L[f.father]; return f && f.id; };
  const ownerOf = (o) => {
    const f = L[o.father];
    if (!f) return { kind: 'none' };
    if (f.className === 'DModel') return { kind: 'DModel' };
    if (f.className === 'DValue') return { kind: 'DValue', owner: nm(f.father), slot: f.name || nm(f.instanceof) };
    return { kind: f.className };
  };
  const objects = (m && m.objects) || [];
  const dobjects = Object.values(L).filter(d => d && d.className === 'DObject' && modelOf(d) === ${JSON.stringify(modelId)}).map(o => ({
    id: o.id, name: o.name, cls: nm(o.instanceof), owner: ownerOf(o), inObjects: objects.includes(o.id),
    slots: Object.fromEntries((o.features || []).map(fid => [L[fid] ? (L[fid].name || nm(L[fid].instanceof)) : fid, ((L[fid] && L[fid].values) || []).map(v => (L[v] && L[v].name !== undefined) ? L[v].name : v)])),
  }));
  return { objects: objects.map(nm), dobjects };
})()`;

async function readModel(page: Page, modelId: string): Promise<any> {
    return page.evaluate(READ_MODEL(modelId));
}

/** One line per object: `name:Class @owner.slot|root [objects]`. */
function brief(state: any): string[] {
    return state.dobjects.map((o: any) => {
        const where = o.owner.kind === 'DModel' ? 'root' : o.owner.kind === 'DValue' ? `${o.owner.owner}.${o.owner.slot}` : o.owner.kind;
        const slots = Object.entries(o.slots).filter(([, v]: any) => v.length).map(([k, v]: any) => `${k}=[${v.join(',')}]`).join(' ');
        return `${o.name}:${o.cls} @${where}${o.inObjects ? ' [objects]' : ''}${slots ? ' ' + slots : ''}`;
    });
}

async function project(page: Page): Promise<{ id: string; mm: { id: string; name: string }; models: Array<{ id: string; name: string }> }> {
    return page.evaluate(`(async () => {
      const j = await import('/src/joiner/index.ts');
      const p = j.L.fromPointer(j.DUser.current).project;
      const mm = (p.metamodels || [])[0];
      return { id: p.id, mm: mm ? { id: mm.id, name: mm.name } : null, models: (p.models || []).filter(m => !m.isMetamodel).map(m => ({ id: m.id, name: m.name })) };
    })()`) as any;
}

/** A new M1 model of the metamodel, through the function the «New model» entry calls, not opened. */
async function newModel(page: Page): Promise<{ id: string; name: string }> {
    const r: any = await page.evaluate(`(async () => {
      const j = await import('/src/joiner/index.ts');
      const nav = await import('/src/pages/components/Navbar.tsx');
      const p = j.L.fromPointer(j.DUser.current).project;
      const before = new Set((p.models || []).map(m => m.id));
      nav.createM1(p, p.metamodels[0], false);
      for (let i = 0; i < 50; i++) {
        await new Promise(r => setTimeout(r, 100));
        const m = (j.L.fromPointer(j.DUser.current).project.models || []).find(m => !before.has(m.id) && !m.isMetamodel);
        if (m) return { id: m.id, name: m.name };
      }
      return null;
    })()`);
    if (!r) throw new Error('createM1: no new model');
    return r;
}

async function openModel(page: Page, id: string): Promise<void> {
    await page.evaluate(`(async () => {
      const j = await import('/src/joiner/index.ts');
      const dm = await import('/src/components/abstract/DockManager.tsx');
      await dm.default.open2(j.L.fromPointer(${JSON.stringify(id)}));
    })()`);
    await page.waitForTimeout(5000);
}

/** The instance rows of the tree, every node expanded first; each with the instance row it sits under. */
async function readTree(page: Page): Promise<Array<{ name: string; parent: string | null; depthPx: string }>> {
    for (let round = 0; round < 6; round++) {
        const n: number = await page.evaluate(`(() => {
          const closed = [...document.querySelectorAll('.tree-row--feature > button.tree-node__toggle')].filter(b => b.querySelector('.bi-chevron-right'));
          closed.forEach(b => b.click());
          return closed.length;
        })()`) as number;
        await page.waitForTimeout(400);
        if (n === 0) break;
    }
    return page.evaluate(`(() => [...document.querySelectorAll('.tree-row--feature')].map(r => {
      const node = r.closest('.tree-node');
      const up = node && node.parentElement && node.parentElement.closest('.tree-node');
      const prow = up && up.querySelector(':scope > .tree-row--feature');
      const name = (el) => (el && el.querySelector('.tree-feature__name') || {}).textContent || null;
      return { name: name(r), parent: prow ? name(prow) : null, depthPx: r.style.paddingLeft };
    }))()`) as any;
}

async function cropTree(page: Page, file: string): Promise<string | null> {
    const el = page.locator('.tree-view-content').first();
    if (!(await el.count())) return null;
    mkdirSync(CROPS, { recursive: true });
    const path = `${CROPS}/${file}`;
    await el.screenshot({ path }).catch(() => null);
    return path;
}

/**
 * Crop of what the chat checks, at most 600 px wide: the M1 instance rows of the tree (scrolled
 * into view), or the nodes of the model's canvas, with the Jjodie window hidden while shooting.
 */
async function cropShown(page: Page, kind: 'tree' | 'canvas', modelId: string, file: string): Promise<{ path: string; size: string; rect: any } | null> {
    const rect: any = await page.evaluate(`(async () => {
      const j = document.querySelector('.jodie-root');
      if (j) j.style.visibility = 'hidden';
      const els = ${JSON.stringify(kind)} === 'tree'
        ? [...document.querySelectorAll('.tree-row--feature')]
        : [...document.querySelectorAll(${JSON.stringify(`[id="${modelId}"].dock-tabpane-active .react-flow__node`)})];
      if (!els.length) return null;
      if (${JSON.stringify(kind)} === 'tree') els[0].scrollIntoView({ block: 'start' });
      await new Promise(r => setTimeout(r, 300));
      const bs = els.map(e => e.getBoundingClientRect()).filter(b => b.width && b.height);
      const pad = 16;
      const x = Math.max(0, Math.min(...bs.map(b => b.left)) - pad), y = Math.max(0, Math.min(...bs.map(b => b.top)) - pad);
      const r = Math.min(innerWidth, Math.max(...bs.map(b => b.right)) + pad), b = Math.min(innerHeight, Math.max(...bs.map(b => b.bottom)) + pad);
      return { x, y, width: r - x, height: b - y };
    })()`);
    let out: { path: string; size: string; rect: any } | null = null;
    if (rect && rect.width > 0 && rect.height > 0) {
        mkdirSync(CROPS, { recursive: true });
        const path = `${CROPS}/${file}`;
        await page.screenshot({ path, clip: rect });
        const dims = (): string => execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', path], { encoding: 'utf8' })
            .split('\n').map((l) => l.trim().split(': ')[1]).filter(Boolean).join('x');
        if (Number(dims().split('x')[0]) > 600) execFileSync('sips', ['--resampleWidth', '600', path], { stdio: 'ignore' });
        out = { path, size: dims(), rect };
    }
    await page.evaluate(`(() => { const j = document.querySelector('.jodie-root'); if (j) j.style.visibility = ''; })()`);
    return out;
}

async function openJodie(page: Page): Promise<void> {
    if ((await page.locator('.jodie-window').count()) === 0) {
        await page.locator('.jodie-minimized').click();
        await page.waitForTimeout(1500);
    }
}

/** Jjodie's Run on a scoped M1 reply: inject, «Run as JjScript», «Run», wait for the summary, read it. */
async function jodieRun(page: Page, n: number, body: string, scope: any): Promise<any> {
    const content = 'Here is the script:\n\n```jjscript\n' + body + '\n```\n';
    const inj = await page.evaluate(`(() => {
      const h = ${JODIE_HOOK};
      if (!h) return 'no chat hook';
      const msg = { id: 'msg_jsm1_${n}', kind: 'chat', role: 'assistant', timestamp: Date.now(), content: ${JSON.stringify(content)}, jjodieScope: ${JSON.stringify(scope)} };
      h.queue.dispatch(prev => ({ ...prev, isOpen: true, messages: [msg] }));
      return 'ok';
    })()`);
    if (inj !== 'ok') return { error: String(inj) };
    await page.waitForTimeout(700);
    await page.evaluate(`(() => { const b = [...document.querySelectorAll('.md-code-jjscript')].pop(); if (b) b.click(); })()`);
    await page.waitForTimeout(500);
    const r: any = await page.evaluate(`(async () => {
      const known = document.querySelectorAll('.run-summary').length;
      const btn = [...document.querySelectorAll('.script-block__btn--run')].pop();
      if (!btn || btn.disabled) return { error: 'no enabled run button' };
      const t0 = performance.now();
      btn.click();
      await new Promise((res, rej) => {
        const to = setTimeout(() => { obs.disconnect(); rej(new Error('no .run-summary in 180 s')); }, 180000);
        const obs = new MutationObserver(() => { if (document.querySelectorAll('.run-summary').length > known) { clearTimeout(to); obs.disconnect(); res(); } });
        obs.observe(document.body, { childList: true, subtree: true });
      });
      return { wallMs: Math.round(performance.now() - t0) };
    })()`);
    if (r.error) return r;
    await page.waitForTimeout(400);
    const summary: any = await page.evaluate(`(() => {
      const s = [...document.querySelectorAll('.run-summary')].pop();
      const t = (el, sel) => ((el.querySelector(sel) || {}).textContent || '').trim();
      return {
        text: (s.querySelector('.run-summary__content') || s).innerText,
        title: t(s, '.exec-error-header'),
        stats: t(s, '.exec-error-stats'),
        figures: [...s.querySelectorAll('.run-summary__figures tr')].map(tr => tr.textContent.trim().replace(/\\s+/g, ' ')),
        errors: [...s.querySelectorAll('.run-summary__error')].map(e => ({ line: t(e, '.run-summary__line'), command: t(e, '.run-summary__command'), message: t(e, '.run-summary__message') })),
        superseded: [...s.querySelectorAll('.run-summary__superseded')].map(e => t(e, '.run-summary__row-head')),
      };
    })()`);
    await page.locator('.run-summary .exec-error-btn--primary').last().click().catch(() => {});
    await page.waitForTimeout(600);
    return { ...r, summary };
}

/** One command through `JjScriptService.execute` with the M1 scope, as Jjodie's Run calls it per line. */
async function exec(page: Page, line: string, scope: any): Promise<any> {
    return page.evaluate(`(async () => {
      const svc = await import('/src/jjscript/services/JjScriptService.ts');
      const t0 = performance.now();
      const r = await svc.JjScriptService.execute(${JSON.stringify(line)}, ${JSON.stringify(scope)});
      return { line: ${JSON.stringify(line)}, ms: Math.round(performance.now() - t0), success: r.success, code: r.errors && r.errors[0] && r.errors[0].code, message: r.message };
    })()`);
}

/** The run boundary of Jjodie's Run: `EXECUTION_START`, which clears the M1 handle registry. */
async function newRunBoundary(page: Page): Promise<void> {
    await page.evaluate(`(async () => {
      const ev = await import('/src/events/registry.ts');
      window.dispatchEvent(new CustomEvent(ev.JjScriptEvents.EXECUTION_START, { detail: { script: '', mode: 'run-all', commandCount: 0 } }));
    })()`);
}

// ── Main ──────────────────────────────────────────────────────────────────────────────────────────────

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT } });
await seed(ctx, false);
const page: Page = await ctx.newPage();
const pageErrors: string[] = [];
const consoleErrors: string[] = [];
page.on('pageerror', (e: Error) => pageErrors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 300)); });
const result: any = { url: URL, mode: MODE, tag: TAG, experiments: {} };
const save = () => { mkdirSync(dirname(OUT), { recursive: true }); writeFileSync(OUT, JSON.stringify(result, null, 1)); };

await page.goto(`${URL}/#/allProjects`, { waitUntil: 'domcontentloaded', timeout: 300000 });
await page.waitForTimeout(5000);
if (MODE === 'fixture') {
    const text = readFileSync(FIXTURE, 'utf8');
    const pid = await page.evaluate(`(async () => {
      const api = await import('/src/api/persistance/projects.ts');
      const count = () => JSON.parse(localStorage.getItem('projects') || '[]').length;
      const before = count();
      await api.ProjectsApi.importFromText(${JSON.stringify(text)});
      for (let i = 0; i < 75 && count() <= before; i++) await new Promise(r => setTimeout(r, 200));
      const a = JSON.parse(localStorage.getItem('projects') || '[]');
      return a.length > before ? a[a.length - 1].id : null;
    })()`) as string | null;
    check('fixture imported', !!pid, String(pid));
    await page.goto(`${URL}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await page.waitForTimeout(9000);
} else {
    await page.locator('button', { hasText: 'New Project' }).first().click();
    await page.waitForTimeout(1500);
    await page.locator('input[type="text"]').first().fill('JjsM1Esm');
    await page.locator('button', { hasText: /^Create/ }).last().click();
    await page.waitForTimeout(6000);
    const pid = await page.evaluate(`(() => { const a = JSON.parse(localStorage.getItem('projects') || '[]'); return a.length ? a[a.length - 1].id : null; })()`);
    check('project created', !!pid, String(pid));
    await page.goto(`${URL}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await page.waitForTimeout(9000);
    await page.getByText('New metamodel', { exact: true }).first().click();
    await page.waitForTimeout(9000);
    const seeded: any = await page.evaluate(`(async () => {
      const j = await import('/src/joiner/index.ts');
      const svc = await import('/src/jjscript/services/JjScriptService.ts');
      const mm = j.L.fromPointer(j.DUser.current).project.metamodels[0];
      const out = [];
      for (const line of ${JSON.stringify(ESM)}) {
        const r = await svc.JjScriptService.execute(line, { level: 'M2', metamodelId: mm.id, metamodelName: mm.name });
        out.push(r.success ? 'ok' : (line + ' -> ' + r.message));
        await new Promise(r => setTimeout(r, 600));
      }
      return out;
    })()`);
    check('ESM seeded at M2', seeded.every((s: string) => s === 'ok'), seeded);
}

const pr = await project(page);
check('metamodel present', !!pr.mm, pr.mm);
const mmShape: any = await page.evaluate(`(async () => {
  const j = await import('/src/joiner/index.ts');
  const mm = j.L.fromPointer(${JSON.stringify(pr.mm.id)});
  return (mm.classes || []).map(c => ({ name: c.name, extends: (c.extends || []).map(s => s.name), rootable: c.rootable,
    refs: (c.references || []).map(r => ({ name: r.name, type: r.type && r.type.name, composition: r.composition, containment: r.containment, lower: r.lowerBound, upper: r.upperBound })) }));
})()`);
meas('metamodel', mmShape);
const shapeOk = (() => {
    const by = Object.fromEntries(mmShape.map((c: any) => [c.name, c]));
    const t = by.State?.refs.find((r: any) => r.name === 'transitions');
    const n = by.Transition?.refs.find((r: any) => r.name === 'nextState');
    const e = by.Transition?.refs.find((r: any) => r.name === 'event');
    return !!(t && t.type === 'Transition' && t.composition && t.upper === -1 && n && n.type === 'State' && !n.composition && n.upper === 1 && e && e.type === 'Event' && e.upper === 1
        && by.Initial?.extends.includes('State') && by.Terminal?.extends.includes('State'));
})();
check('ESM shape: transitions composition 0..* Transition, nextState 0..1 State, event 0..1 Event, Initial/Terminal extend State', shapeOk, '');
result.metamodel = mmShape;

if (MODE === 'seed' && process.env.JSM1_WRITE_FIXTURE === '1') {
    const saved: any = await page.evaluate(`(async () => {
      const j = await import('/src/joiner/index.ts');
      const api = await import('/src/api/persistance/projects.ts');
      const pr = j.L.fromPointer(j.DUser.current).project;
      await api.ProjectsApi.save(pr, { silent: true });
      await new Promise(r => setTimeout(r, 1500));
      const a = JSON.parse(localStorage.getItem('projects') || '[]');
      const p = a.find(x => x.id === pr.id);
      return p ? JSON.stringify(p) : null;
    })()`);
    check('fixture saved', !!saved, saved ? `${saved.length} bytes` : 'null');
    if (saved) { mkdirSync(dirname(FIXTURE), { recursive: true }); writeFileSync(FIXTURE, saved); meas('fixture', FIXTURE); }
}

const scopeOf = (m: { id: string }) => ({ level: 'M1', metamodelId: pr.mm.id, metamodelName: pr.mm.name, modelId: m.id });

// ── E1: the microwave as written today, through Jjodie's Run ─────────────────────────────────────────
{
    const m = await newModel(page);
    await openModel(page, m.id);
    await openJodie(page);
    check('E1 Jjodie chat hook found', (await page.evaluate(`!!${JODIE_HOOK}`)) === true, '');
    const run = await jodieRun(page, 1, MICROWAVE_TODAY, scopeOf(m));
    await page.waitForTimeout(1500);
    const st = await readModel(page, m.id);
    const tree = await readTree(page);
    const crop = await cropTree(page, `${TAG}_E1_tree.png`);
    const crops = { tree: await cropShown(page, 'tree', m.id, `${TAG}_E1_tree_600.png`), canvas: await cropShown(page, 'canvas', m.id, `${TAG}_E1_canvas_600.png`) };
    meas('E1 crops', crops);
    result.experiments.E1 = { model: m, run, state: st, tree, crop, crops };
    meas('E1 run', { wallMs: run.wallMs, title: run.summary?.title, stats: run.summary?.stats, figures: run.summary?.figures });
    for (const e of run.summary?.errors ?? []) meas('E1 final error', `${e.line} | ${e.command} | ${e.message}`);
    for (const l of brief(st)) meas('E1 object', l);
    meas('E1 tree', tree.map((r: any) => `${r.name}${r.parent ? ' < ' + r.parent : ''}`));
    const transitions = st.dobjects.filter((o: any) => o.cls === 'Transition');
    meas('E1 summary text', run.summary?.text ?? '');
    check(`E1 (${TAG}) four Transitions exist`, transitions.length === 4, transitions.map((o: any) => o.name));
    if (!AFTER) {
        check('E1 (before) every Transition at the model root (father DModel)', transitions.every((o: any) => o.owner.kind === 'DModel'), transitions.map((o: any) => `${o.name}:${o.owner.kind}`));
        check('E1 (before) final errors on the 4 containment and 4 event lines', (run.summary?.errors ?? []).length === 8, (run.summary?.errors ?? []).map((e: any) => e.line));
    } else {
        const notFound = (run.summary?.errors ?? []).filter((e: any) => /not found/i.test(e.message));
        check('E1 (after) no `not found` left after the retry passes', notFound.length === 0, notFound);
        check('E1 (after) zero final errors', (run.summary?.errors ?? []).length === 0, run.summary?.errors ?? []);
        const events = Object.fromEntries(transitions.map((o: any) => [o.name, o.slots.event]));
        check('E1 (after) every event linked once', ['tStart', 'tOpen', 'tClose', 'tDone'].every((n) => (events[n] ?? []).length === 1), events);
    }
    save();
}

// ── E2: the nested form, unknown to today's grammar ──────────────────────────────────────────────────
{
    const m = await newModel(page);
    await openModel(page, m.id);
    const parsed: any = await page.evaluate(`(async () => {
      const p = await import('/src/jjscript/parser/parser.ts');
      const out = {};
      for (const line of ${JSON.stringify(MICROWAVE_NESTED.split('\n').filter(l => / in /.test(l)))}) {
        const r = p.parse(line);
        const s = p.parse(line, { strict: true });
        out[line] = { success: r.success, parent: r.ast && r.ast.args.parent ? r.ast.args.parent : null, name: r.ast && r.ast.args.name,
          instanceName: r.ast && r.ast.args.options && r.ast.args.options.defaultValue ? r.ast.args.options.defaultValue.value : null,
          strict: s.success, strictError: s.errors && s.errors[0] && s.errors[0].message };
      }
      return out;
    })()`);
    for (const [line, p] of Object.entries(parsed)) meas('E2 parse', `${line} -> ${JSON.stringify(p)}`);
    const run = await jodieRun(page, 2, MICROWAVE_NESTED, scopeOf(m));
    await page.waitForTimeout(1500);
    const st = await readModel(page, m.id);
    const tree = await readTree(page);
    const crop = await cropTree(page, `${TAG}_E2_tree.png`);
    const crops = { tree: await cropShown(page, 'tree', m.id, `${TAG}_E2_tree_600.png`), canvas: await cropShown(page, 'canvas', m.id, `${TAG}_E2_canvas_600.png`) };
    meas('E2 crops', crops);
    result.experiments.E2 = { model: m, parsed, run, state: st, tree, crop, crops };
    meas('E2 run', { wallMs: run.wallMs, title: run.summary?.title, stats: run.summary?.stats, figures: run.summary?.figures });
    for (const e of run.summary?.errors ?? []) meas('E2 final error', `${e.line} | ${e.command} | ${e.message}`);
    for (const l of brief(st)) meas('E2 object', l);
    meas('E2 tree', tree.map((r: any) => `${r.name}${r.parent ? ' < ' + r.parent : ''}`));
    const transitions = st.dobjects.filter((o: any) => o.cls === 'Transition');
    meas('E2 summary text', run.summary?.text ?? '');
    const SOURCE: Record<string, string> = { tStart: 'idle', tOpen: 'cooking', tDone: 'cooking', tClose: 'doorOpen' };
    if (!AFTER) {
        check('E2 (before) the `in <Parent>.<ref>` clause is dropped: every Transition at the root', transitions.length === 4 && transitions.every((o: any) => o.owner.kind === 'DModel'), transitions.map((o: any) => `${o.name}:${o.owner.kind}`));
    } else {
        check('E2 (after) zero final errors', (run.summary?.errors ?? []).length === 0, run.summary?.errors ?? []);
        check('E2 (after) every Transition in the transitions slot of its source State', transitions.length === 4
            && transitions.every((o: any) => o.owner.kind === 'DValue' && o.owner.owner === SOURCE[o.name] && o.owner.slot === 'transitions'),
            transitions.map((o: any) => `${o.name}@${o.owner.owner}.${o.owner.slot}`));
        check('E2 (after) no Transition in model.objects', transitions.every((o: any) => !o.inObjects), transitions.map((o: any) => `${o.name}:${o.inObjects}`));
        check('E2 (after) the tree shows every Transition under its source State', Object.entries(SOURCE).every(([t, s]) => tree.some((r: any) => r.name === t && r.parent === s))
            && !tree.some((r: any) => SOURCE[r.name] && r.parent === null), tree.map((r: any) => `${r.name}${r.parent ? ' < ' + r.parent : ''}`));
        const linked = Object.fromEntries(transitions.map((o: any) => [o.name, [o.slots.nextState, o.slots.event]]));
        check('E2 (after) nextState and event linked once each', transitions.every((o: any) => o.slots.nextState.length === 1 && o.slots.event.length === 1), linked);
    }
    // E2b: a later reply (a new Run, handles cleared) addresses a contained Transition by name.
    // Two lines: Jjodie offers «Run as JjScript» on multi-line blocks only (MarkdownRenderer.tsx:93).
    const run2 = await jodieRun(page, 21, '# a later reply\nrename instance tClose to tCloseDoor', scopeOf(m));
    await page.waitForTimeout(1000);
    const st2 = await readModel(page, m.id);
    const renamed = st2.dobjects.find((o: any) => o.name === 'tCloseDoor');
    meas('E2b later reply', { errors: run2.summary?.errors, renamed: renamed && { owner: renamed.owner, inObjects: renamed.inObjects } });
    if (AFTER) check('E2b (after) a later reply renames a contained Transition by name', (run2.summary?.errors ?? []).length === 0 && !!renamed && renamed.owner.owner === 'doorOpen', { errors: run2.summary?.errors, renamed });
    result.experiments.E2.later = { run: run2, renamed };
    save();
}

// ── E3: Q2, `set <Parent>.transitions += <child>` on a child at the root ─────────────────────────────
{
    const m = await newModel(page);
    await openModel(page, m.id);
    const scope = scopeOf(m);
    await newRunBoundary(page);
    const steps: any[] = [];
    const step = async (label: string, line: string) => {
        const r = await exec(page, line, scope);
        await page.waitForTimeout(500);
        const st = await readModel(page, m.id);
        const t1 = st.dobjects.filter((o: any) => o.name === 't1');
        const s1 = st.dobjects.find((o: any) => o.name === 's1');
        const s2 = st.dobjects.find((o: any) => o.name === 's2');
        const rec = { label, r, t1: t1.map((o: any) => ({ owner: o.owner, inObjects: o.inObjects })), t1Count: t1.length,
            s1transitions: s1?.slots.transitions, s2transitions: s2?.slots.transitions, s2owner: s2?.owner, s2inObjects: s2?.inObjects, objects: st.objects };
        steps.push(rec);
        meas(`E3 ${label}`, rec);
        return rec;
    };
    for (const line of ['create instance of State "s1"', 'create instance of State "s2"', 'create instance of Transition "t1"']) {
        const r = await exec(page, line, scope);
        check(`E3 setup ${line}`, r.success, r);
    }
    await page.waitForTimeout(500);
    const a = await step('attach', 'set s1.transitions += t1');
    const b = await step('attach again', 'set s1.transitions += t1');
    const c = await step('move to s2', 'set s2.transitions += t1');
    const d = await step('= instead of +=', 'set s1.transitions = t1');
    const e = await step('a State into the Transition slot', 'set s1.transitions += s2');
    const tree = await readTree(page);
    meas('E3 tree', tree.map((r: any) => `${r.name}${r.parent ? ' < ' + r.parent : ''}`));
    result.experiments.E3 = { model: m, steps, tree };
    check('E3 attach: father becomes s1.transitions', a.t1[0]?.owner.kind === 'DValue' && a.t1[0]?.owner.owner === 's1', a.t1);
    meas('E3 verdicts', {
        attach: { stillInObjects: a.t1[0]?.inObjects, copies: a.t1Count },
        again: { s1transitions: b.s1transitions },
        move: { owner: c.t1[0]?.owner, s1transitions: c.s1transitions, s2transitions: c.s2transitions },
        assign: { owner: d.t1[0]?.owner, s1transitions: d.s1transitions, s2transitions: d.s2transitions },
        wrongType: { ok: e.r.success, code: e.r.code, s2owner: e.s2owner, s2inObjects: e.s2inObjects, s1transitions: e.s1transitions },
    });
    save();
}

// ── E4: Q3/Q4, the write path of (b) prototyped ──────────────────────────────────────────────────────
{
    const m = await newModel(page);
    await openModel(page, m.id);
    const scope = scopeOf(m);
    await newRunBoundary(page);
    // The parent is created by the executor; the child is written with the call (b) would make, at once
    // after the create returns (no macrotask), so the slot read is the one a next command in the same
    // pass would get without the Run's 20 ms delay; then after a macrotask and after 20 ms.
    const timing: any = await page.evaluate(`(async () => {
      const j = await import('/src/joiner/index.ts');
      const svc = await import('/src/jjscript/services/JjScriptService.ts');
      const reg = await import('/src/jjscript/executor/handleRegistry.ts');
      const store = (window.store || window.windoww.store);
      const read = (id) => {
        const L = j.LPointerTargetable.fromPointer(id);
        const slot = L && L.$transitions;
        const model = store.getState().idlookup[${JSON.stringify(m.id)}];
        return { inStore: !!store.getState().idlookup[id], lResolves: !!(L && L.id), features: L && L.__raw ? (L.__raw.features || []).length : null,
          slotId: slot ? slot.id : null, slotInStore: slot ? !!store.getState().idlookup[slot.id] : null, inObjects: !!(model && (model.objects || []).includes(id)) };
      };
      const out = {};
      const r = await svc.JjScriptService.execute('create instance of State "p1"', ${JSON.stringify(scope)});
      const id = reg.getHandleId('p1');
      out.create = { success: r.success, id };
      out.atReturn = read(id);
      await new Promise(r => setTimeout(r, 0));
      out.afterMacrotask = read(id);
      await new Promise(r => setTimeout(r, 20));
      out.after20ms = read(id);
      await new Promise(r => setTimeout(r, 400));
      out.after420ms = read(id);
      return out;
    })()`);
    meas('E4 parent slot timing', timing);
    result.experiments.E4 = { model: m, timing };

    // Same, with the child written AT RETURN into the slot of a freshly created parent.
    const atOnce: any = await page.evaluate(`(async () => {
      const j = await import('/src/joiner/index.ts');
      const svc = await import('/src/jjscript/services/JjScriptService.ts');
      const reg = await import('/src/jjscript/executor/handleRegistry.ts');
      const r = await svc.JjScriptService.execute('create instance of State "p2"', ${JSON.stringify(scope)});
      const pid = reg.getHandleId('p2');
      const lp = j.LPointerTargetable.fromPointer(pid);
      const slot = lp && lp.$transitions;
      if (!slot) return { created: r.success, slot: null };
      const mm = j.LPointerTargetable.fromPointer(${JSON.stringify(pr.mm.id)});
      const tr = (mm.classes || []).find(c => c.name === 'Transition');
      const d = j.DObject.new(tr.id, slot.id, j.DValue, 'tAtOnce', true);
      d.initialName = 'tAtOnce';
      reg.registerHandle('tAtOnce', d.id);
      return { created: r.success, slot: slot.id, child: d.id };
    })()`);
    await page.waitForTimeout(600);
    let st = await readModel(page, m.id);
    meas('E4 child written at return', { atOnce, objects: brief(st) });
    result.experiments.E4.atOnce = { atOnce, state: st };

    // The (b) write after the Run's delay: parent committed, child into its slot.
    const proto: any = await page.evaluate(`(async () => {
      const j = await import('/src/joiner/index.ts');
      const reg = await import('/src/jjscript/executor/handleRegistry.ts');
      const pid = reg.getHandleId('p1');
      const lp = j.LPointerTargetable.fromPointer(pid);
      const slot = lp.$transitions;
      const mm = j.LPointerTargetable.fromPointer(${JSON.stringify(pr.mm.id)});
      const tr = (mm.classes || []).find(c => c.name === 'Transition');
      const before = { values: (slot.__raw.values || []).length };
      const d = j.DObject.new(tr.id, slot.id, j.DValue, 'tNested', true);
      d.initialName = 'tNested';
      reg.registerHandle('tNested', d.id);
      return { slot: slot.id, before, child: d.id, typeOk: tr.isExtending(slot.instanceof.type), upper: slot.instanceof.upperBound, containment: slot.instanceof.containment };
    })()`);
    await page.waitForTimeout(600);
    st = await readModel(page, m.id);
    meas('E4 prototype write', { proto, objects: brief(st) });
    const child = st.dobjects.find((o: any) => o.name === 'tNested');
    check('E4 prototype: the child is born in p1.transitions (father DValue), not listed in model.objects', !!child && child.owner.kind === 'DValue' && child.owner.owner === 'p1' && !child.inObjects, child);
    result.experiments.E4.proto = { proto, state: st };

    // Same run (handle registered): a later `set` on the nested child, and its dependency wait.
    const sameRun = await exec(page, 'set tNested.nextState = p1', scope);
    meas('E4 same run, set on the nested child', sameRun);
    const rootMade = await exec(page, 'create instance of Transition "tRoot"', scope);
    await page.waitForTimeout(500);
    // A new run (registry cleared): the same child by name.
    await newRunBoundary(page);
    const newRun = await exec(page, 'set tNested.nextState = p2', scope);
    meas('E4 new run, set on the nested child', newRun);
    // Control: a root instance by name in the same new run, same command shape.
    const control = await exec(page, 'set tRoot.nextState = p2', scope);
    meas('E4 new run, set on a root instance (control)', { rootMade, control });
    if (AFTER) {
        check('E4 (after) the nested child is found by name in a new run', newRun.success, newRun);
        check('E4 (after) the same-run set on the nested child no longer waits the 500 ms cap', sameRun.success && sameRun.ms < 450, sameRun);
    }
    check('E4 control: a root instance resolves by name in a new run', rootMade.success && control.success, control);
    result.experiments.E4.lookups = { sameRun, newRun, rootMade, control };
    const tree = await readTree(page);
    meas('E4 tree', tree.map((r: any) => `${r.name}${r.parent ? ' < ' + r.parent : ''}`));
    result.experiments.E4.tree = tree;
    await cropTree(page, `${TAG}_E4_tree.png`);

    // E5: what the Run summary would read for this model, and the rootable verdict per class.
    const e5: any = await page.evaluate(`(async () => {
      const j = await import('/src/joiner/index.ts');
      const rf = await import('/src/jjscript/components/runFigures.ts');
      const ec = await import('/src/joiner/environmentConfig.ts');
      const p = j.L.fromPointer(j.DUser.current).project;
      const fig = rf.projectFigures(p).find(x => x.id === ${JSON.stringify(m.id)});
      const mm = j.LPointerTargetable.fromPointer(${JSON.stringify(pr.mm.id)});
      return { instancesFigure: fig && fig.instances, reasons: Object.fromEntries((mm.classes || []).map(c => [c.name, ec.topLevelReason(c)])) };
    })()`);
    st = await readModel(page, m.id);
    meas('E5', { ...e5, dobjects: st.dobjects.length });
    result.experiments.E5 = { ...e5, dobjects: st.dobjects.length };
    save();
}

// ── E6: Q4, when the slots of a fresh instance exist ─────────────────────────────────────────────────
// After `create instance` returns, poll every 10 ms: the DObject in the store, its `instanceof`, its
// `features`, the named slot, its entry in `model.objects`. Then the M1 `set` handler called directly
// at return, below the executor's dependency wait, to isolate what a registry hit meets before the
// slots exist (the executor path is E1 and E4).
{
    const m = await newModel(page);
    await openModel(page, m.id);
    const scope = scopeOf(m);
    await newRunBoundary(page);
    const tl: any = await page.evaluate(`(async () => {
      const j = await import('/src/joiner/index.ts');
      const svc = await import('/src/jjscript/services/JjScriptService.ts');
      const reg = await import('/src/jjscript/executor/handleRegistry.ts');
      const store = (window.store || window.windoww.store);
      const out = {};
      for (const [name, line, slot] of [['q1', 'create instance of State "q1"', '$transitions'], ['q2', 'create instance of Transition "q2"', '$nextState']]) {
        await svc.JjScriptService.execute(line, ${JSON.stringify(scope)});
        const id = reg.getHandleId(name);
        const t0 = performance.now();
        const first = { store: null, instanceof: null, features: null, slot: null, objects: null };
        while (performance.now() - t0 < 2000) {
          const t = Math.round(performance.now() - t0);
          const d = store.getState().idlookup[id];
          const model = store.getState().idlookup[${JSON.stringify(m.id)}];
          const L = j.LPointerTargetable.fromPointer(id);
          if (first.store === null && d) first.store = t;
          if (first.instanceof === null && d && d.instanceof) first.instanceof = t;
          if (first.features === null && d && (d.features || []).length) first.features = t;
          if (first.slot === null && L && L[slot]) first.slot = t;
          if (first.objects === null && model && (model.objects || []).includes(id)) first.objects = t;
          if (Object.values(first).every(v => v !== null)) break;
          await new Promise(r => setTimeout(r, 10));
        }
        out[name] = first;
      }
      // A child written into q1's slot (ready by now) with the call (b) would make: when the slot
      // lists it, and when the child itself gets its metaclass and its slots.
      {
        const slot = j.LPointerTargetable.fromPointer(reg.getHandleId('q1')).$transitions;
        const mm = j.LPointerTargetable.fromPointer(${JSON.stringify(pr.mm.id)});
        const tr = (mm.classes || []).find(c => c.name === 'Transition');
        const d = j.DObject.new(tr.id, slot.id, j.DValue, 'q4', true);
        d.initialName = 'q4';
        const t0 = performance.now();
        const first = { store: null, inSlotValues: null, instanceof: null, features: null, objects: null };
        while (performance.now() - t0 < 2000) {
          const t = Math.round(performance.now() - t0);
          const st = store.getState().idlookup;
          const c = st[d.id], v = st[slot.id], model = st[${JSON.stringify(m.id)}];
          if (first.store === null && c) first.store = t;
          if (first.inSlotValues === null && v && (v.values || []).includes(d.id)) first.inSlotValues = t;
          if (first.instanceof === null && c && c.instanceof) first.instanceof = t;
          if (first.features === null && c && (c.features || []).length) first.features = t;
          if (first.objects === null && model && (model.objects || []).includes(d.id)) first.objects = t;
          if (['store', 'inSlotValues', 'instanceof', 'features'].every(k => first[k] !== null) && t > 1000) break;
          await new Promise(r => setTimeout(r, 10));
        }
        out.childInSlot = first;
      }
      // The handler at return, no wait: a registry hit on an instance created by the line before.
      const inst = await import('/src/jjscript/executor/commands/instance.ts');
      const parser = await import('/src/jjscript/parser/parser.ts');
      const p = j.L.fromPointer(j.DUser.current).project;
      await svc.JjScriptService.execute('create instance of Transition "q3"', ${JSON.stringify(scope)});
      const ctx = { projectId: p.id, modelId: ${JSON.stringify(m.id)}, targetMetamodelId: ${JSON.stringify(pr.mm.id)}, level: 'M1', scopeBound: true, history: [], variables: new Map() };
      const h = await inst.executeSetInstance(parser.parse('set q3.nextState = q1').ast.args, ctx, p);
      out.handlerAtReturn = { success: h.success, code: h.errors && h.errors[0] && h.errors[0].code, message: h.message };
      return out;
    })()`);
    meas('E6 first ms after create returns', tl);
    result.experiments.E6 = { model: m, timeline: tl };
    save();
}

// ── E7: two `set <s>.transitions += <x>` lines in a row (the legacy attach) ─────────────────────────
// The M1 link reads the slot's committed values and writes them back plus the new id
// (`instance.ts` link branch): when does a link land in the store, and does a second link 20 ms
// later keep the first? Measured on the Run path; the `create … in` path appends instead.
{
    const m = await newModel(page);
    await openModel(page, m.id);
    const scope = scopeOf(m);
    await newRunBoundary(page);
    for (const line of ['create instance of State "s"', 'create instance of Transition "a"', 'create instance of Transition "b"', 'create instance of Transition "c"']) await exec(page, line, scope);
    await page.waitForTimeout(800);
    const listed: any = await page.evaluate(`(async () => {
      const svc = await import('/src/jjscript/services/JjScriptService.ts');
      const reg = await import('/src/jjscript/executor/handleRegistry.ts');
      const j = await import('/src/joiner/index.ts');
      const store = (window.store || window.windoww.store);
      await svc.JjScriptService.execute('set s.transitions += a', ${JSON.stringify(scope)});
      const slot = j.LPointerTargetable.fromPointer(reg.getHandleId('s')).$transitions;
      const a = reg.getHandleId('a');
      const t0 = performance.now();
      while (performance.now() - t0 < 2000) {
        const v = store.getState().idlookup[slot.id];
        if (v && (v.values || []).includes(a)) return { listedMs: Math.round(performance.now() - t0) };
        await new Promise(r => setTimeout(r, 5));
      }
      return { listedMs: null };
    })()`);
    meas('E7 first link listed in the store after', listed);
    await page.waitForTimeout(600);
    await openJodie(page);
    const run = await jodieRun(page, 7, 'set s.transitions += b\nset s.transitions += c', scope);
    await page.waitForTimeout(1500);
    const st = await readModel(page, m.id);
    const sObj = st.dobjects.find((o: any) => o.name === 's');
    meas('E7 two links in a row through Run', { errors: run.summary?.errors, sTransitions: sObj?.slots.transitions, objects: brief(st) });
    result.experiments.E7 = { model: m, listed, run, state: st };
    save();
}

result.pageErrors = pageErrors;
result.consoleErrors = consoleErrors;
meas('page errors', pageErrors);
meas('console errors', consoleErrors.length + ' ' + JSON.stringify(consoleErrors.slice(0, 12)));
save();
console.log(`OUT ${OUT}`);
console.log(failures === 0 ? 'ALL GREEN' : `${failures} FAILURE(S)`);
await browser.close();
process.exit(failures === 0 ? 0 : 1);
