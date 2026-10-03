/**
 * undo-inline-edit probe (P-2026-10-03-1632).
 *
 * Question: why does one Cmd+Z not restore an attribute written inline on the canvas
 * (`canvasToJjom.syncUpdateFeatureValue`), and does Cmd+Shift+Z reapply it?
 *
 * Scene: DemoPetri imported from `fixtures/scene_2_DemoPetri.jjodel` (byte copy of
 * `~/jjodel-demo-exports/scene_2_DemoPetri.jjodel`), M1 `demoNet` open in editor-v2. Built in the page before the
 * recorder starts, declared because the demo has no string attribute and no IR viewpoint:
 *   - an attribute `note : EString` on `Place` (a path label edits EString only, R-IRN-41), `p1.note = 'alpha'`;
 *   - an IR viewpoint `UndoProbe` with one view for `Place`: top label the intrinsic name (rename, the control),
 *     centre label `$note.value` with `editable: true` (the path label), and the attribute rows.
 *
 * Cases, each: read, write, settle, read, click an empty pane point, Cmd+Z, read, Cmd+Shift+Z, read.
 *   row      IR row value edit, `p1.tokens` 2 -> 7 (dblclick `.ir-row__value--editable`, type, Enter)
 *   label    IR path label edit, `p1.note` alpha -> beta (dblclick `.ir-label`, type, Enter)
 *   direct   `syncUpdateFeatureValue(vertex(p2), 'note', 'gamma')` called from the page
 *   proxy    `L(p3).$note.value = 'delta'` from the page: the slot write without the outer TRANSACTION
 *   object   default-view node (ObjectNode) value cell edit, `t2.guard` -> 'x > 0'
 *   rename   control: IR name label edit, `lock` -> 'lockX' (`syncNodeLabel`, no slot)
 *   batch-noop    the reducer alone: one TRANSACTION with `lock.tokens` `isMirage = false` (already false, a no-op)
 *                 then `values.0 = 5`, the shape `setValueAtPosition` emits
 *   batch-single  the same write without the no-op: one TRANSACTION with `values.0 = 9` only
 * Per case also the identity evidence: whether the write replaced `idlookup` and the written element, and whether
 * the element of the state BEFORE the write now reads the new value (an in-place write into the previous state).
 * Instrument (page): `store.subscribe`; per dispatch the action that reached the reducer (tail of
 * `window.jjactions`), the delta of that dispatch computed as the reducer computes it
 * (`Uobj.objectDelta(next, prev)`), the user's undo and redo depth, and the top entry (identity, keys, the
 * idlookup ids it holds, `mergeCounter`).
 * Checks (Phase 2 acceptance, red on the defect): after Cmd+Z the value is the one before the write; after
 * Cmd+Shift+Z the written one; the control does both today.
 *
 * Run:  ~/.local/bin/node frontend/scripts/lane-run.mjs probe <worktree> \
 *         frontend/scripts/probe/undo-inline-edit.ts --port 3077 --id P-2026-10-03-1632
 * Env:  UI_CASES   comma list of the cases above (default all, in that order)
 *       UI_PATCH   none | fix-reducer: rewrites the served `reducer.ts` (Playwright route) so that the copy-on-write
 *                  of `CompositeActionReducer` takes as previous action the last one that changed the state; FAILs
 *                  unless each rewrite matched exactly once. Phase 1 evidence for the proposed fix, tree untouched.
 *       UI_CROPS   directory: PNG crops of the edited node before, after the write, after undo, after redo
 *       UI_SETTLE  ms after a write or an undo before reading (default 2500)
 *       UI_OUT     JSON output (default /tmp/undo-inline-edit.json)
 */
import { chromium, type Page } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { seed, setTheme } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3077/').replace(/\/$/, '');
if (/:(3000|3001|3003)$/.test(URL)) throw new Error('never 3000, 3001 or 3003');
const FIXTURE = new globalThis.URL('./fixtures/scene_2_DemoPetri.jjodel', import.meta.url).pathname;
const ALL = ['row', 'label', 'direct', 'proxy', 'object', 'rename', 'batch-noop', 'batch-single'];
const PATCH = process.env.UI_PATCH || 'none';
// The served module is esbuild output: types stripped, `actions[i-1]` printed as `actions[i - 1]`.
const REWRITES: Record<string, Array<[RegExp, string]>> = {
    'fix-reducer': [
        [/const prevAction = actions\[i - 1\];/g, 'const prevAction = actions.__lastApplied;'],
        [/newState = tmp;/g, 'if (tmp !== newState) actions.__lastApplied = action;\n        newState = tmp;'],
    ],
};
const CASES = (process.env.UI_CASES || ALL.join(',')).split(',').map((s) => s.trim()).filter(Boolean);
const CROPS = process.env.UI_CROPS || '';
const SETTLE = Number(process.env.UI_SETTLE || 2500);
const OUT = process.env.UI_OUT || '/tmp/undo-inline-edit.json';

const note = (label: string, d: unknown) => console.log(`MEAS  ${label}  ${typeof d === 'string' ? d : JSON.stringify(d)}`);
let failures = 0;
const check = (label: string, ok: boolean, detail: string) => {
    if (!ok) failures++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  ${detail}`);
};
const wait = (page: Page, ms: number) => page.waitForTimeout(ms);

// ── Page-side recorder (a plain string: no transform) ──────────────────────────────────────────
const RECORDER = String.raw`(async () => {
  const w = window;
  if (w.__ur) return 'already';
  const U = await import('/src/common/UObj.ts');
  const R = w.__ur = { on: false, log: [], n: 0, t0: performance.now() };
  const ids = new WeakMap();
  const uid = (o) => { if (!o || typeof o !== 'object') return null; if (!ids.has(o)) ids.set(o, ++R.n); return ids.get(o); };
  const short = (v) => { try { const s = typeof v === 'string' ? v : JSON.stringify(v); return s === undefined ? 'undefined' : s.slice(0, 48); } catch (e) { return '?'; } };
  const fields = (v) => v && typeof v === 'object' ? Object.keys(v).filter((x) => x !== 'clonedCounter') : short(v);
  R.hist = () => {
    const h = w.statehistory[w.DUser.current];
    const top = h && h.undoable && h.undoable[h.undoable.length - 1];
    return { u: h ? h.undoable.length : null, r: h ? h.redoable.length : null,
      top: top ? { id: uid(top), keys: Object.keys(top).filter((k) => !k.startsWith('timestamp')),
        idl: top.idlookup ? Object.fromEntries(Object.entries(top.idlookup).filter(([k]) => k !== 'clonedCounter').map(([k, v]) => [k, fields(v)])) : null,
        merge: top.mergeCounter === undefined ? null : top.mergeCounter, title: top.action_title === undefined ? null : top.action_title } : null };
  };
  const store = w.windoww.store;
  let prev = store.getState();
  store.subscribe(() => {
    const cur = store.getState();
    if (R.on) {
      const acts = w.jjactions || [];
      const a = acts[acts.length - 1] || {};
      const subs = (a.actions || [a]).map((x) => (x.field || x.type) + (x.accessModifier || '') + '=' + short(x.value));
      let delta = null;
      if (cur !== prev) {
        const d = U.Uobj.objectDelta(cur, prev, true, false);
        delta = { keys: Object.keys(d).filter((k) => !k.startsWith('timestamp')),
          idl: d.idlookup ? Object.fromEntries(Object.entries(d.idlookup).filter(([k]) => k !== 'clonedCounter').map(([k, v]) => [k, fields(v)])) : null };
      }
      R.log.push({ t: Math.round(performance.now() - R.t0), type: a.type, title: (a.descriptor && a.descriptor.path) || null,
        subs: subs.slice(0, 6), nsubs: subs.length, same: cur === prev, delta, hist: R.hist() });
    }
    prev = cur;
  });
  return 'installed';
})()`;

// ── Main ──────────────────────────────────────────────────────────────────────────────────────
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2 });
await ctx.addInitScript(() => { (globalThis as any).__name = (f: any) => f; });
await seed(ctx, false);
const patched: Record<string, number> = {};
if (PATCH !== 'none') {
    const rewrites = REWRITES[PATCH];
    if (!rewrites) throw new Error('unknown UI_PATCH ' + PATCH);
    await ctx.route((u: any) => u.toString().includes('/src/redux/reducer/reducer.ts'), async (route: any) => {
        const resp = await route.fetch();
        let body = await resp.text();
        for (const [re, to] of rewrites) {
            const n = (body.match(re) || []).length;
            patched[String(re)] = (patched[String(re)] || 0) + n;
            body = body.replace(re, to);
        }
        await route.fulfill({ response: resp, body });
    });
}
const page: Page = await ctx.newPage();
const errors: string[] = [];
page.on('pageerror', (e: Error) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 200)); });
const result: any = { url: URL, patch: PATCH, cases: {}, setup: {} };
const save = () => writeFileSync(OUT, JSON.stringify(result, null, 1));

await page.goto(`${URL}/#/allProjects`, { waitUntil: 'domcontentloaded', timeout: 300000 });
await wait(page, 6000);
const fixtureText = readFileSync(FIXTURE, 'utf8');
const project = await page.evaluate(`(async () => {
  const api = await import('/src/api/persistance/projects.ts');
  const count = () => JSON.parse(localStorage.getItem('projects') || '[]').length;
  const before = count();
  await api.ProjectsApi.importFromText(${JSON.stringify(fixtureText)});
  for (let i = 0; i < 75 && count() <= before; i++) await new Promise(r => setTimeout(r, 200));
  const a = JSON.parse(localStorage.getItem('projects') || '[]');
  return a.length > before ? a[a.length - 1].id : null;
})()`) as string | null;
check('fixture imported', !!project, String(project));
await page.goto(`${URL}/#/project?id=${project}`, { waitUntil: 'domcontentloaded', timeout: 300000 });
await wait(page, 10000);
await setTheme(page, 'light');

// Open the M1, add the string attribute, write p1.note, build and activate the IR viewpoint.
const setup: any = await page.evaluate(`(async () => {
  const w = window;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const L = (x) => w.LPointerTargetable.fromPointer(x);
  const idl = () => w.windoww.store.getState().idlookup;
  const all = () => Object.values(idl()).filter((d) => d && typeof d === 'object');
  const m1 = all().find((d) => d.className === 'DModel' && d.name === 'demoNet');
  const place = all().find((d) => d.className === 'DClass' && d.name === 'Place');
  const obj = (n) => all().find((d) => d.className === 'DObject' && d.name === n && d.father === m1.id);
  const dm = await import('/src/components/abstract/DockManager.tsx');
  await dm.default.open2(L(m1.id));
  await wait(6000);
  const noteAttr = L(place.id).addAttribute('note', 'Pointer_ESTRING');
  await wait(2500);
  const slotOf = (o, f) => (idl()[o.id].features || []).find((s) => idl()[idl()[s] && idl()[s].instanceof] && idl()[idl()[s].instanceof].name === f);
  const p1 = obj('p1');
  const missing = ['p1', 'p2', 'p3'].filter((n) => !slotOf(obj(n), 'note'));
  L(p1.id)['$note'].value = 'alpha';
  await wait(2000);
  const j = await import('/src/joiner/index.ts');
  const tpl = await import('/src/utils/defaultViewTemplate.ts');
  const comp = await import('/src/components/editor-v2/viewpoint/ir/irCompile.ts');
  const vpId = 'Pointer_UndoProbeVP';
  const vp = j.DViewPoint.newVP('UndoProbe', undefined, true, vpId);
  j.DViewElement.new2('UP Place', tpl.DEFAULT_VIEW_JSX_STRING, vp, (d) => {
    d.appliableToClasses = ['DObject'];
    d.appliableTo = 'Vertex';
    d.ir = {
      irVersion: 'ir-1.0', kind: 'vertex', metaclasses: ['Place'], priority: 1, exclusive: true, label: 'UP Place',
      shape: { form: 'rect', fill: '#f8fafc', border: { color: '#334155', width: 1, style: 'solid' }, labels: [
        { position: 'top', source: { from: 'intrinsic', prop: 'name' } },
        { position: 'center', source: { from: 'path', expr: '$note.value' }, editable: true },
      ] },
      fieldCompartments: [{ id: 'attrs', source: { from: 'attributes' }, rowFormat: { segments: [{ kind: 'name' }, { kind: 'literal', text: ' = ' }, { kind: 'value' }] }, separator: true }],
    };
  }, true, 'Pointer_UndoProbeView_Place');
  comp.clearCompileCache();
  await wait(1500);
  const lv = await import('/src/utils/lastViewpoint.ts');
  lv.activateViewpoint(vpId);
  await wait(5000);
  const vertexOf = (oid) => { const v = all().find((d) => String(d.className).includes('Vertex') && d.model === oid); return v ? v.id : null; };
  const names = ['p1', 'p2', 'p3', 'lock', 't2'];
  return { m1: m1.id, place: place.id, noteAttr: noteAttr && noteAttr.id, missingNoteSlot: missing,
    objects: Object.fromEntries(names.map((n) => [n, obj(n).id])),
    vertices: Object.fromEntries(names.map((n) => [n, vertexOf(obj(n).id)])),
    slots: { p1tokens: slotOf(p1, 'tokens'), p1note: slotOf(p1, 'note'), p2note: slotOf(obj('p2'), 'note'), p3note: slotOf(obj('p3'), 'note'), t2guard: slotOf(obj('t2'), 'guard'), lockTokens: slotOf(obj('lock'), 'tokens') },
    user: w.DUser.current, vp: vpId };
})()`);
result.setup = setup;
note('setup', setup);
save();

const paneSel = `[id="${setup.m1}"].dock-tabpane-active`;
const nodeSel = (name: string) => `${paneSel} .react-flow__node[data-id="${setup.vertices[name]}"]`;

/** Reads the store value of one case and the visible text of its node. */
async function read(kind: 'slot' | 'name', obj: string, feat: string, nodeName: string) {
    return page.evaluate(([k, o, f, sel]) => {
        const w = window as any;
        const idl = w.windoww.store.getState().idlookup;
        let value: unknown = null;
        if (k === 'name') value = idl[o]?.name ?? null;
        else {
            const s = (idl[o]?.features ?? []).find((x: string) => idl[idl[x]?.instanceof]?.name === f);
            value = s ? (idl[s].values ?? null) : 'no slot';
        }
        const el = document.querySelector(sel) as HTMLElement | null;
        return { value, text: el ? el.innerText.replace(/\s+/g, ' ').trim().slice(0, 120) : null };
    }, [kind, obj, feat, nodeSel(nodeName)] as [string, string, string, string]);
}
const hist = () => page.evaluate(() => (window as any).__ur.hist());

async function clickEmptyPane() {
    const pt = await page.evaluate((sel: string) => {
        for (let y = 160; y < 940; y += 20) for (let x = 300; x < 1560; x += 20) {
            const e = document.elementFromPoint(x, y);
            if (e && e.classList.contains('react-flow__pane') && e.closest(sel)) return { x, y };
        }
        return null;
    }, paneSel);
    if (pt) { await page.mouse.click(pt.x, pt.y); await wait(page, 600); }
    return pt;
}

async function crop(tag: string, nodeName: string) {
    if (!CROPS) return;
    mkdirSync(CROPS, { recursive: true });
    const loc = page.locator(nodeSel(nodeName)).first();
    if (await loc.count()) await loc.screenshot({ path: `${CROPS}/${tag}.png` }).catch(() => {});
}

if (PATCH !== 'none') {
    for (const [re, n] of Object.entries(patched)) check(`patch ${PATCH}: ${re} matched once`, n === 1, String(n));
}
// The undo gate (isRelevantChangeCheck): `statehistory.globalcanundostate` is raised by a document mouseup
// (reducer.ts setDocumentEvents) and a pane click never delivers one (React Flow's d3 handlers stop it at the
// window, capture phase), so the probe clicks the top bar, as a user's first click outside the canvas does.
await page.mouse.click(800, 20);
await wait(page, 800);
await clickEmptyPane();
note('recorder', await page.evaluate(RECORDER));
note('flags', await page.evaluate(() => { const w = window as any; return { interacted: w.windoww.U.userHasInteracted, canUndo: w.statehistory.globalcanundostate, depth: w.__ur.hist() }; }));

type Spec = { kind: 'slot' | 'name'; obj: string; feat: string; node: string; to: string; vp?: string; write: () => Promise<void> };
let activeVp = setup.vp as string;
async function useViewpoint(vp: string) {
    if (vp === activeVp) return;
    await page.evaluate(async (x: string) => { const m = await import('/src/utils/lastViewpoint.ts' as any); m.activateViewpoint(x); }, vp);
    await wait(page, 5000);
    activeVp = vp;
}
const specs: Record<string, Spec> = {
    row: { kind: 'slot', obj: setup.objects.p1, feat: 'tokens', node: 'p1', to: '7', write: async () => {
        await page.locator(nodeSel('p1')).locator('.ir-row').filter({ hasText: /^\s*tokens/ }).locator('.ir-row__value--editable').first().dblclick();
        await wait(page, 800);
        await page.locator(`${nodeSel('p1')} input.ir-row__input`).first().fill('7');
        await page.keyboard.press('Enter');
    } },
    label: { kind: 'slot', obj: setup.objects.p1, feat: 'note', node: 'p1', to: 'beta', write: async () => {
        await page.locator(nodeSel('p1')).locator('.ir-label').filter({ hasText: /^\s*alpha\s*$/ }).first().dblclick();
        await wait(page, 800);
        await page.locator(`${nodeSel('p1')} input.ir-label__input`).first().fill('beta');
        await page.keyboard.press('Enter');
    } },
    direct: { kind: 'slot', obj: setup.objects.p2, feat: 'note', node: 'p2', to: 'gamma', write: async () => {
        await page.evaluate(async (v: string) => { const m = await import('/src/components/editor-v2/sync/canvasToJjom.ts' as any); m.syncUpdateFeatureValue(v, 'note', 'gamma'); }, setup.vertices.p2);
    } },
    proxy: { kind: 'slot', obj: setup.objects.p3, feat: 'note', node: 'p3', to: 'delta', write: async () => {
        await page.evaluate((o: string) => { (window as any).LPointerTargetable.fromPointer(o)['$note'].value = 'delta'; }, setup.objects.p3);
    } },
    object: { kind: 'slot', obj: setup.objects.t2, feat: 'guard', node: 't2', to: 'x > 0', vp: 'Pointer_ViewPointDefault', write: async () => {
        await page.locator(nodeSel('t2')).locator('.mm-object__slot-value--editable').first().dblclick();
        await wait(page, 800);
        await page.locator(`${nodeSel('t2')} input.mm-object__input`).first().fill('x > 0');
        await page.keyboard.press('Enter');
    } },
    rename: { kind: 'name', obj: setup.objects.lock, feat: 'name', node: 'lock', to: 'lockX', write: async () => {
        await page.locator(nodeSel('lock')).locator('.ir-label').filter({ hasText: /^\s*lock\s*$/ }).first().dblclick();
        await wait(page, 800);
        await page.locator(`${nodeSel('lock')} input.ir-label__input`).first().fill('lockX');
        await page.keyboard.press('Enter');
    } },
    'batch-noop': { kind: 'slot', obj: setup.objects.lock, feat: 'tokens', node: 'lock', to: '5', write: async () => {
        await page.evaluate((s: string) => {
            const w = window as any;
            w.TRANSACTION('probe noop-prefix', () => {
                w.SetFieldAction.new(s, 'isMirage', false, '', false);
                w.SetFieldAction.new(s, 'values.0', 5, '', false);
            });
        }, setup.slots.lockTokens);
    } },
    'batch-single': { kind: 'slot', obj: setup.objects.lock, feat: 'tokens', node: 'lock', to: '9', write: async () => {
        await page.evaluate((s: string) => {
            const w = window as any;
            w.TRANSACTION('probe single', () => { w.SetFieldAction.new(s, 'values.0', 9, '', false); });
        }, setup.slots.lockTokens);
    } },
};
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const asWritten = (spec: Spec, v: unknown) => spec.kind === 'name' ? v === spec.to : (Array.isArray(v) && String(v[0]) === spec.to);

for (const name of CASES) {
    const spec = specs[name];
    if (!spec) throw new Error('unknown case ' + name);
    const c: any = { steps: {} };
    result.cases[name] = c;
    try {
        await useViewpoint(spec.vp ?? setup.vp);
        await clickEmptyPane();
        await wait(page, 800);
        c.steps.before = { ...(await read(spec.kind, spec.obj, spec.feat, spec.node)), hist: await hist() };
        await crop(`${name}_1_before`, spec.node);
        const target = spec.kind === 'name' ? spec.obj : await page.evaluate(([o, f]) => {
            const idl = (window as any).windoww.store.getState().idlookup;
            return (idl[o]?.features ?? []).find((x: string) => idl[idl[x]?.instanceof]?.name === f) ?? null;
        }, [spec.obj, spec.feat] as [string, string]);
        await page.evaluate((t: string) => {
            const w = window as any; const R = w.__ur;
            R.s0 = w.windoww.store.getState(); R.e0 = R.s0.idlookup[t]; R.j0 = JSON.stringify(R.e0);
            R.log = []; R.on = true;
        }, target);
        await spec.write();
        await wait(page, SETTLE);
        c.identity = await page.evaluate((t: string) => {
            const w = window as any; const R = w.__ur; const s1 = w.windoww.store.getState();
            return { stateReplaced: s1 !== R.s0, idlookupReplaced: s1.idlookup !== R.s0.idlookup, elementReplaced: s1.idlookup[t] !== R.e0,
                previousStateElementChanged: JSON.stringify(R.s0.idlookup[t]) !== R.j0, previousElementObjectChanged: JSON.stringify(R.e0) !== R.j0 };
        }, target);
        c.steps.written = { ...(await read(spec.kind, spec.obj, spec.feat, spec.node)), hist: await hist() };
        await crop(`${name}_2_written`, spec.node);
        c.writeLog = await page.evaluate(() => { const R = (window as any).__ur; const l = R.log; R.log = []; return l; });
        await clickEmptyPane();
        c.steps.beforeUndo = { ...(await read(spec.kind, spec.obj, spec.feat, spec.node)), hist: await hist() };
        c.clickLog = await page.evaluate(() => { const R = (window as any).__ur; const l = R.log; R.log = []; return l; });
        await page.keyboard.press('ControlOrMeta+z');
        await wait(page, SETTLE);
        c.steps.undone = { ...(await read(spec.kind, spec.obj, spec.feat, spec.node)), hist: await hist() };
        await crop(`${name}_3_undone`, spec.node);
        c.undoLog = await page.evaluate(() => { const R = (window as any).__ur; const l = R.log; R.log = []; return l; });
        await page.keyboard.press('ControlOrMeta+Shift+z');
        await wait(page, SETTLE);
        c.steps.redone = { ...(await read(spec.kind, spec.obj, spec.feat, spec.node)), hist: await hist() };
        await crop(`${name}_4_redone`, spec.node);
        c.redoLog = await page.evaluate(() => { const R = (window as any).__ur; const l = R.log; R.log = []; R.on = false; return l; });
    } catch (e: any) {
        c.error = String(e?.message || e).slice(0, 400);
        c.nodeHtml = await page.locator(nodeSel(spec.node)).first().evaluate((el) => el.outerHTML.replace(/style="[^"]*"/g, '').slice(0, 1500)).catch(() => null);
        note(`${name}: node html`, c.nodeHtml);
        await page.evaluate(() => { (window as any).__ur.on = false; });
    }
    for (const [k, v] of Object.entries(c.steps)) note(`${name}: ${k}`, v);
    note(`${name}: identity`, c.identity ?? null);
    for (const k of ['writeLog', 'clickLog', 'undoLog', 'redoLog']) note(`${name}: ${k}`, c[k] ?? null);
    if (c.error) note(`${name}: error`, c.error);
    const s = c.steps;
    check(`${name}: the write leaves the state before it untouched`, !!c.identity && !c.identity.previousStateElementChanged && !c.identity.previousElementObjectChanged, JSON.stringify(c.identity ?? null));
    check(`${name}: the write lands`, !!s.written && asWritten(spec, s.written.value), JSON.stringify({ before: s.before?.value, written: s.written?.value }));
    check(`${name}: one Cmd+Z restores the value before the write`, !!s.undone && same(s.undone.value, s.before.value), JSON.stringify({ before: s.before?.value, undone: s.undone?.value, depth: [s.beforeUndo?.hist?.u, s.undone?.hist?.u] }));
    check(`${name}: Cmd+Shift+Z reapplies the write`, !!s.redone && asWritten(spec, s.redone.value), JSON.stringify({ redone: s.redone?.value, redo: [s.undone?.hist?.r, s.redone?.hist?.r] }));
    save();
}

result.errors = errors;
note('page errors', errors.slice(0, 12));
save();
note('out', OUT);
console.log(failures ? `FAILURES ${failures}` : 'ALL GREEN');
await browser.close();
process.exit(failures ? 1 : 0);
