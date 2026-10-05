/**
 * console-errors-demo probe (P-2026-10-04-1025, discovery of two console errors on the demo scenes).
 *
 * E1  «Invalid action path 0»       Log.eDevv in deepCopyButOnlyFollowingPath (redux/reducer/reducer.ts).
 * E2  «Cannot serialize in ecore…»  Log.exx in a generateEcoreJson_impl (model/logicWrapper/LModelElement.tsx).
 *
 * Questions: who dispatches E1 (the action object, its creation stack, the batch it rolls back) and who calls E2
 * (the call stack, the element where the visited set fires, the reference that closes the loop); when, per scene
 * and per step of docs/demo/models_2026_simulator_demo.md; what each costs (a lost write, an incomplete save or
 * export); whether anything shows on screen.
 *
 * Hooks, installed by an init script before the app boots: console.error, window 'error', 'unhandledrejection'.
 * Error.stackTraceLimit is raised to 60 so that the action's own creation stack (Action.stack) reaches its origin;
 * this lengthens a string the app keeps on every action and changes nothing else. Stacks are mapped back to source
 * lines through the inline source maps the dev server serves.
 *
 * Two open modes, five fresh browser contexts per scene in each:
 *   load  a fresh document on `/#/project?id=` (deep link, reload, and the dashboard's card click, which reloads:
 *         R.navigate, U.tsx). Then the demo's steps: configure (in the page, as the panel's Apply writes it, the
 *         route io-board-lane1.ts uses), the model tab, the Simulation chip, Reset, the script's presses, the I/O
 *         board, Cmd+S. On rep 1 of PEST and ESM also: the Ecore and XMI exports compared field by field with the
 *         store, the legacy Ecore JSON getters, the M1 cycle walker, and the save round trip (snapshot, reload,
 *         snapshot, diff).
 *   hash  the in-page open from the dashboard (`page.goto` changes the hash only, the route of the earlier probes):
 *         open only.
 *
 * Run:  ~/.local/bin/node frontend/scripts/lane-run.mjs probe <worktree> frontend/scripts/probe/console-errors-demo.ts \
 *         --port 3084 --id P-2026-10-04-1025
 * Env:  CE_REPS    fresh pages per scene and mode (default 5)
 *       CE_MODES   load,hash (default both)
 *       CE_SCENES  PEST,Petri,ESM,FlowB (default all)
 *       CE_OUT     JSON output (default frontend/scripts/smoke/_tmp_console-errors-demo.json, gitignored)
 */
import { chromium, type BrowserContext, type Page } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { seed } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3084/').replace(/\/$/, '');
if (/:(3000|3001|3003)$/.test(URL)) throw new Error('never 3000, 3001 or 3003');
const REPS = Number(process.env.CE_REPS || 5);
const MODES = (process.env.CE_MODES || 'load,hash').split(',');
const ONLY = (process.env.CE_SCENES || 'PEST,Petri,ESM,FlowB').split(',');
const OUT = process.env.CE_OUT || new globalThis.URL('../smoke/_tmp_console-errors-demo.json', import.meta.url).pathname;
const fixture = (name: string) => new globalThis.URL(`./fixtures/${name}.jjodel`, import.meta.url).pathname;

const note = (label: string, d: unknown) => console.log(`MEAS  ${label}  ${typeof d === 'string' ? d : JSON.stringify(d)}`);
let failures = 0;
const check = (label: string, ok: boolean, detail: string) => {
    if (!ok) failures++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  ${detail}`);
};
const wait = (page: Page, ms: number) => page.waitForTimeout(ms);

// ── Scenes (docs/demo/models_2026_simulator_demo.md §2; the encoding of io-board-lane1.ts) ─────────────────────
type Press = { event?: string; choose?: string };
const SCENES = [
    { name: 'PEST', fixture: 'scene_1_DemoPEST', mm: 'DemoPEST', m1: 'demoSM', profile: 'stateMachine', decls: [] as unknown[],
        presses: ['push', 'coin', 'coin', 'push', 'coin', 'push', 'push', 'coin', 'push', 'stop'].map((event) => ({ event })) as Press[],
        last: 'stop: t5 (locked → off) fired', roundTrip: true },
    { name: 'Petri', fixture: 'scene_2_DemoPetri', mm: 'DemoPetri', m1: 'demoNet', profile: 'petri', decls: [],
        presses: [{ choose: 't1' }, { choose: 't3' }, { choose: 't2' }, {}] as Press[],
        last: 'ε: t1 (p1 → p2 ×2) fired', roundTrip: false },
    { name: 'ESM', fixture: 'scene_3_DemoESM', mm: 'DemoESM', m1: 'demoESM', profile: 'extendedStateMachine',
        decls: [
            { name: 'coins', metaclass: null, space: 'semantic', domain: { kind: 'range', min: 0, max: 3 }, initial: '0' },
            { name: 'paid', metaclass: null, space: 'semantic', domain: { kind: 'boolean' }, initial: '', equation: 'model.[coins] >= 2' },
        ],
        presses: ['push', 'coin', 'push', 'coin', 'push', 'push', 'coin', 'coin', 'coin', 'coin'].map((event) => ({ event })) as Press[],
        last: 'coin: tc (locked → locked) halted the run', roundTrip: true },
    { name: 'FlowB', fixture: 'scene_4_DemoFlowB', mm: 'DemoFlowB', m1: 'demoFlowB', profile: 'flowchart',
        decls: [{ name: 'count', metaclass: null, space: 'semantic', domain: { kind: 'range', min: 0, max: 3 }, initial: '0' }],
        presses: [{}, {}, {}, {}, {}, {}] as Press[],
        last: 'ε: jn (left, right → fin) fired', roundTrip: false },
].filter((s) => ONLY.includes(s.name));

// ── Page side (plain strings: no transform) ────────────────────────────────────────────────────
const INIT = String.raw`(() => {
  const w = window;
  w.__name = (f) => f;
  Error.stackTraceLimit = 60;
  const ce = w.__ce = { step: location.hash.indexOf('/project') >= 0 ? 'open' : 'boot', t0: Date.now(), events: [], other: {} };
  const sum = (v) => {
    try {
      if (v === undefined) return 'undefined';
      if (v === null) return 'null';
      if (typeof v === 'string') return JSON.stringify(v.length > 80 ? v.slice(0, 80) + '…' : v);
      if (typeof v !== 'object') return String(v);
      if (Array.isArray(v)) return '[' + v.slice(0, 6).map(sum).join(',') + (v.length > 6 ? ',…' + v.length : '') + ']';
      if (v.className) return '<' + v.className + ' ' + (v.name !== undefined ? v.name : v.id) + '>';
      const k = Object.keys(v); return '{' + k.slice(0, 8).join(',') + (k.length > 8 ? ',…' + k.length : '') + '}';
    } catch (e) { return '?'; }
  };
  const live = () => { try { return w.windoww.store.getState(); } catch (e) { return null; } };
  const nameOf = (st, id) => { try { const d = st && st.idlookup && st.idlookup[id]; return d ? (d.className + ':' + (d.name !== undefined ? d.name : '')) : null; } catch (e) { return null; } };
  const brief = (a) => a ? ({ type: a.type, className: a.className, field: a.field, am: a.accessModifier, value: sum(a.value),
    me: typeof a.me === 'string' ? a.me : (a.me && a.me.id) }) : null;
  const readPath = (st, field) => {
    let cur = st;
    for (const k of field.split('.')) { if (cur == null || typeof cur !== 'object') return { missing: k }; cur = cur[k.trim()]; }
    return { value: cur };
  };
  const record = (args, via) => {
    const iE1 = args.findIndex((a) => typeof a === 'string' && a.indexOf('Invalid action path') === 0);
    const iE2 = args.findIndex((a) => typeof a === 'string' && a.indexOf('Cannot serialize in ecore') === 0);
    const t = Date.now() - ce.t0;
    const callStack = String(new Error().stack || '').split('\n').slice(2, 50).join('\n');
    if (iE1 >= 0) {
      const info = args[iE1 + 1] || {}; const a = info.action || {}; const st = info.state; const key = info.key;
      const batchRaw = w.jjactions && w.jjactions[w.jjactions.length - 1];
      const acts = batchRaw ? (Array.isArray(batchRaw.actions) ? batchRaw.actions : [batchRaw]) : [];
      const ev = { kind: 'E1', msg: args[iE1], step: ce.step, t, via, key,
        path: Array.isArray(info.path) ? info.path.join('.') : String(info.path),
        action: brief(a), isPointer: a.isPointer, me_field: a.me_field, sender: a.sender,
        actionStack: Array.isArray(a.stack) ? a.stack.slice(0, 45).join('\n') : String(a.stack || ''),
        keyInReducedState: !!(st && st.idlookup && key && st.idlookup[key]),
        keyInLiveState: !!(live() && key && live().idlookup[key]),
        keyNameLive: nameOf(live(), key),
        reducedIdlookupSize: st && st.idlookup ? Object.keys(st.idlookup).length : null,
        liveIdlookupSize: live() && live().idlookup ? Object.keys(live().idlookup).length : null,
        reducedProjects: st && st.idlookup ? Object.values(st.idlookup).filter((d) => d && d.className === 'DProject').map((d) => d.id + ':' + d.name) : null,
        batch: batchRaw ? { title: batchRaw.descriptor ? batchRaw.descriptor.path : null, n: acts.length, actions: acts.slice(0, 40).map(brief) } : null,
        callStack };
      ce.events.push(ev);
      setTimeout(() => {
        const s = live();
        ev.after = acts.slice(0, 40).map((x) => {
          if (!x || typeof x.field !== 'string') return { type: x && x.type };
          const r = readPath(s, x.field);
          let applied = null;
          if (!('missing' in r)) {
            const am = x.accessModifier || '';
            if (am === '') applied = JSON.stringify(r.value) === JSON.stringify(x.value);
            else if (am === '+=' || am === '[]') applied = Array.isArray(r.value) && (Array.isArray(x.value) ? x.value : [x.value]).every((i) => r.value.indexOf(i) >= 0);
          }
          return { field: x.field, am: x.accessModifier, intended: sum(x.value), live: 'missing' in r ? ('missing at ' + r.missing) : sum(r.value), applied };
        });
      }, 2500);
      return;
    }
    if (iE2 >= 0) {
      const info = args[iE2 + 1] || {}; const lo = info.loopDetectionObj || {}; const c = info.c || {};
      const visited = Object.keys(lo).map((id) => { const d = lo[id] || {}; return (d.className || '?') + ':' + (d.name !== undefined ? d.name : id); });
      const at = c.data ? (c.data.className + ':' + (c.data.name !== undefined ? c.data.name : c.data.id)) : '?';
      let sel = null; try { const s = live(); sel = s && s._lastSelected ? { me: nameOf(s, s._lastSelected.modelElement), node: s._lastSelected.node || null } : null; } catch (e) {}
      ce.events.push({ kind: 'E2', step: ce.step, t, via, at, visitedCount: visited.length, visitedHead: visited.slice(0, 4), visitedTail: visited.slice(-12), selected: sel, callStack });
      return;
    }
    const text = args.filter((a) => typeof a === 'string').join(' ').replace(/\s+/g, ' ').slice(0, 160);
    const k = ce.step + ' | ' + text;
    ce.other[k] = (ce.other[k] || 0) + 1;
  };
  const orig = console.error;
  console.error = function (...args) { try { record(args, 'console.error'); } catch (e) {} return orig.apply(this, args); };
  const uncaught = (m, stack, via) => {
    const k = ce.step + ' | ' + via + ': ' + String(m).slice(0, 160);
    ce.other[k] = (ce.other[k] || 0) + 1;
    if (/Invalid action path|Cannot serialize in ecore/.test(String(m))) ce.events.push({ kind: 'uncaught', via, step: ce.step, msg: String(m).slice(0, 300), callStack: String(stack || '') });
  };
  w.addEventListener('error', (e) => { try { uncaught(e.message, e.error && e.error.stack, 'onerror'); } catch (x) {} });
  w.addEventListener('unhandledrejection', (e) => { try { uncaught(e.reason && (e.reason.message || e.reason), e.reason && e.reason.stack, 'unhandledrejection'); } catch (x) {} });
})();`;

const IMPORT = (text: string) => String.raw`(async () => {
  const api = await import('/src/api/persistance/projects.ts');
  const count = () => JSON.parse(localStorage.getItem('projects') || '[]').length;
  const before = count();
  await api.ProjectsApi.importFromText(${JSON.stringify(text)});
  for (let i = 0; i < 75 && count() <= before; i++) await new Promise(r => setTimeout(r, 200));
  const a = JSON.parse(localStorage.getItem('projects') || '[]');
  return a.length > before ? a[a.length - 1].id : null;
})()`;

const LOADED = (mm: string, m1: string) => String.raw`(() => {
  const w = window;
  try {
    const all = Object.values(w.windoww.store.getState().idlookup).filter((d) => d && typeof d === 'object');
    const a = all.find((d) => d.className === 'DModel' && d.isMetamodel && d.name === ${JSON.stringify(mm)});
    const b = all.find((d) => d.className === 'DModel' && !d.isMetamodel && d.name === ${JSON.stringify(m1)});
    return a && b && document.querySelectorAll('.dock-tab').length > 0 ? { mm: a.id, m1: b.id } : null;
  } catch (e) { return null; }
})()`;

/** The panel's Apply, written in the page (io-board-lane1.ts SETUP): simEnabled, the preset's patch, the model's globals. */
const CONFIGURE = (mmId: string, m1Id: string, profileId: string, decls: unknown[]) => String.raw`(async () => {
  const w = window;
  const idl = () => w.windoww.store.getState().idlookup;
  const all = () => Object.values(idl()).filter((d) => d && typeof d === 'object');
  const L = (x) => w.LPointerTargetable.fromPointer(x);
  const RS = await import('/src/components/editor-v2/sim/simRoleStatus.ts');
  const SK = await import('/src/components/editor-v2/sim/metamodelSketch.ts');
  const MK = await import('/src/components/editor-v2/sim/modelMarkings.ts');
  const PR = await import('/src/model/simulation/simProfiles.ts');
  const C = await import('/src/model/simulation/stateAttributesCodec.ts');
  const mm = ${JSON.stringify(mmId)}, m1 = ${JSON.stringify(m1Id)};
  L(mm).state = { simEnabled: true };
  await new Promise((r) => setTimeout(r, 300));
  const lookup = idl();
  const bag = lookup[mm]._state || {};
  const profile = PR.systemProfile(${JSON.stringify(profileId)});
  const bindings = RS.profileBindings(profile, SK.sketchOfMetamodel(lookup, mm), bag);
  const boundBag = RS.boundProposalInputs(profile, bag, bindings) ? RS.boundProposalBag(profile, bag, bindings) : null;
  const largest = boundBag ? MK.boundEstimate(lookup, mm, boundBag) : null;
  const classIds = all().filter((d) => d.className === 'DClass' && !d.abstract).map((d) => d.id);
  const res = RS.profilePatch(profile, bag, bindings, lookup, classIds, largest);
  if (res.kind !== 'write') return { error: 'profile refused' };
  L(mm).state = res.patch;
  await new Promise((r) => setTimeout(r, 300));
  const decls = ${JSON.stringify(decls)};
  if (decls.length > 0) { L(m1).state = { simStateAttributes: C.encodeStateAttributes(decls) }; await new Promise((r) => setTimeout(r, 300)); }
  return { patch: Object.keys(res.patch).sort() };
})()`;

const PANE = (m1Id: string) => `(document.querySelector('[role="tabpanel"][aria-labelledby$="-tab-${m1Id}"]'))`;

const SELECTED = String.raw`(() => {
  const s = window.windoww.store.getState(); const ls = s._lastSelected || {};
  const nm = (id) => { const d = id && s.idlookup[id]; return d ? d.className + ':' + (d.name !== undefined ? d.name : '') : (id || null); };
  return { modelElement: nm(ls.modelElement), node: nm(ls.node), view: nm(ls.view) };
})()`;

/** Clicks an element found by a page-side expression; the handler runs inside the click, so its time is measured. */
const CLICK = (expr: string) => String.raw`(() => {
  const el = ${expr};
  if (!el) return { found: false };
  const t0 = performance.now(); el.click(); return { found: true, ms: Number((performance.now() - t0).toFixed(1)) };
})()`;

const STATUS = (m1Id: string) => String.raw`(() => {
  const pane = ${PANE(m1Id)};
  if (!pane) return null;
  return [...pane.querySelectorAll('.sim-panel__status-line')].map((e) => (e.getAttribute('title') || e.textContent || '').trim());
})()`;

const VISIBLE = String.raw`(() => {
  const toasts = [...document.querySelectorAll('[class*="toast" i], [class*="alert" i], [role="alert"]')]
    .filter((e) => e.offsetParent !== null && (e.textContent || '').trim()).map((e) => (e.textContent || '').trim().slice(0, 120));
  const errorBoundary = document.querySelectorAll('[class*="error-boundary" i], [class*="ErrorBoundary"]').length;
  return { toasts: [...new Set(toasts)].slice(0, 8), errorBoundary, theme: document.documentElement.getAttribute('data-theme') };
})()`;

/** A name-keyed copy of what the user saved: metamodels, models, bags, views, graph vertices. */
const SNAP = (pid: string) => String.raw`(() => {
  const w = window; const s = w.windoww.store.getState(); const idl = s.idlookup;
  const L = (x) => w.LPointerTargetable.fromPointer(x);
  const nm = (id) => { const d = idl[id]; return d ? (d.name !== undefined ? d.name : d.className) : ('?' + id); };
  const proj = idl[${JSON.stringify(pid)}];
  if (!proj) return { error: 'project not in idlookup' };
  const out = { project: { name: proj.name, metamodels: proj.metamodels.map(nm), models: proj.models.map(nm), viewpoints: (proj.viewpoints || []).map(nm), graphs: (proj.graphs || []).length }, m2: {}, m1: {} };
  for (const id of proj.metamodels) {
    const mm = L(id); const m = out.m2[mm.name] = { bag: mm.__raw._state || {}, classes: {}, enums: {} };
    for (const c of mm.classes) m.classes[c.name] = { abstract: !!c.abstract, interface: !!c.interface, ext: (c.extends || []).map((x) => x.name).sort(),
      attributes: c.attributes.map((a) => ({ name: a.name, type: a.type && a.type.name, lower: a.lowerBound, upper: a.upperBound })),
      references: c.references.map((r) => ({ name: r.name, type: r.type && r.type.name, containment: !!r.containment, composition: !!r.__raw.composition, lower: r.lowerBound, upper: r.upperBound })) };
    for (const e of mm.enumerators) m.enums[e.name] = e.literals.map((l) => l.name);
  }
  for (const id of proj.models) {
    const m1 = L(id); const m = out.m1[m1.name] = { bag: m1.__raw._state || {}, objects: {} };
    for (const o of (m1.objects || [])) {
      if (!o) continue;
      let key = String(o.name); while (m.objects[key]) key += "'";
      const features = {};
      for (const f of (o.features || [])) { if (!f) continue; features[f.name] = (f.__raw.values || []).map((v) => (typeof v === 'string' && idl[v]) ? '@' + nm(v) : v); }
      m.objects[key] = { class: o.instanceof ? o.instanceof.name : null, father: nm(o.__raw.father), features };
    }
  }
  out.views = Object.values(idl).filter((d) => d && /^DView/.test(d.className)).map((d) => d.className + ' ' + d.name + ' @' + nm(d.viewpoint) + ' jsx ' + String(d.jsxString || '').length).sort();
  out.primitiveTypes = (s.primitiveTypes || []).map(nm).sort();
  out.idlookupClasses = Object.values(idl).reduce((acc, d) => { if (d && d.className) acc[d.className] = (acc[d.className] || 0) + 1; return acc; }, {});
  out.vertices = Object.values(idl).filter((d) => d && /^D(Graph)?Vertex$|^DVoidVertex$/.test(d.className))
    .map((d) => nm(d.model) + ' ' + d.className + ' ' + [d.x, d.y, d.w, d.h].map((n) => typeof n === 'number' ? Math.round(n) : n).join(',')).sort();
  out.edges = Object.values(idl).filter((d) => d && /^D(Void)?Edge$/.test(d.className)).length;
  return out;
})()`;

/** The user's exports compared with the store, field by field; then the legacy Ecore JSON getters and the cycle walker. */
const EXPORTS = (mmId: string, m1Id: string) => String.raw`(async () => {
  const w = window; const L = (x) => w.LPointerTargetable.fromPointer(x);
  const idl = w.windoww.store.getState().idlookup;
  const ES = (await import('/src/services/export/EcoreService.ts')).EcoreService;
  const XS = (await import('/src/services/export/XMIService.ts')).XMIService;
  const SM = (await import('/src/components/topbar/SaveManager.ts')).SaveManager;
  const mm = L(${JSON.stringify(mmId)}), m1 = L(${JSON.stringify(m1Id)});
  const XSI = 'http://www.w3.org/2001/XMLSchema-instance';
  const xsiType = (el) => el.getAttributeNS(XSI, 'type') || el.getAttribute('xsi:type') || '';
  const tail = (s) => (s || '').split(' ').filter(Boolean).map((x) => x.replace(/^.*\/\//, '')).sort();
  const res = { ecore: { mismatches: [] }, xmi: { mismatches: [] }, legacy: {}, timing: {} };
  // .ecore
  let xml = null; try { xml = ES.exportToXML(mm); } catch (e) { res.ecore.error = String(e && e.message); }
  if (xml) {
    res.ecore.bytes = xml.length;
    const doc = new DOMParser().parseFromString(xml, 'text/xml');
    res.ecore.parseError = doc.getElementsByTagName('parsererror').length;
    const cls = {};
    for (const el of doc.getElementsByTagName('eClassifiers')) {
      if (!/EClass$/.test(xsiType(el))) continue;
      cls[el.getAttribute('name')] = { abstract: el.getAttribute('abstract') === 'true', ext: tail(el.getAttribute('eSuperTypes')),
        feats: Object.fromEntries([...el.children].filter((c) => c.tagName === 'eStructuralFeatures').map((f) => [f.getAttribute('name'), {
          kind: xsiType(f).replace(/^.*:/, ''), type: tail(f.getAttribute('eType'))[0] || null, containment: f.getAttribute('containment') === 'true',
          upper: f.getAttribute('upperBound'), lower: f.getAttribute('lowerBound') }])) };
    }
    res.ecore.classesStore = mm.classes.length; res.ecore.classesFile = Object.keys(cls).length;
    let fields = 0;
    for (const c of mm.classes) {
      const f = cls[c.name];
      if (!f) { res.ecore.mismatches.push(c.name + ': class missing'); continue; }
      if (f.abstract !== !!c.abstract) res.ecore.mismatches.push(c.name + '.abstract ' + c.abstract + ' vs ' + f.abstract);
      const ext = (c.extends || []).map((x) => x.name).sort();
      if (JSON.stringify(ext) !== JSON.stringify(f.ext)) res.ecore.mismatches.push(c.name + '.eSuperTypes ' + ext + ' vs ' + f.ext);
      for (const a of c.attributes) { fields++; const g = f.feats[a.name];
        if (!g) res.ecore.mismatches.push(c.name + '.' + a.name + ': attribute missing');
        else if (g.kind !== 'EAttribute') res.ecore.mismatches.push(c.name + '.' + a.name + ': kind ' + g.kind); }
      for (const r of c.references) { fields++; const g = f.feats[r.name];
        if (!g) { res.ecore.mismatches.push(c.name + '.' + r.name + ': reference missing'); continue; }
        if (g.kind !== 'EReference') res.ecore.mismatches.push(c.name + '.' + r.name + ': kind ' + g.kind);
        if (g.type !== (r.type && r.type.name)) res.ecore.mismatches.push(c.name + '.' + r.name + '.eType ' + (r.type && r.type.name) + ' vs ' + g.type);
        if (g.containment !== !!(r.containment || r.__raw.composition)) res.ecore.mismatches.push(c.name + '.' + r.name + '.containment ' + !!(r.containment || r.__raw.composition) + ' vs ' + g.containment);
        const up = String(r.upperBound); if (g.upper !== null && g.upper !== up) res.ecore.mismatches.push(c.name + '.' + r.name + '.upperBound ' + up + ' vs ' + g.upper); }
      const extra = Object.keys(f.feats).filter((n) => !c.attributes.some((a) => a.name === n) && !c.references.some((r) => r.name === n));
      if (extra.length) res.ecore.mismatches.push(c.name + ': extra features ' + extra);
    }
    res.ecore.featuresCompared = fields;
  }
  // .xmi
  let xmi = null; try { xmi = XS.exportToXML(m1, { includeMetamodel: false }); } catch (e) { res.xmi.error = String(e && e.message); }
  if (xmi) {
    res.xmi.bytes = xmi.length;
    const doc = new DOMParser().parseFromString(xmi, 'text/xml');
    res.xmi.parseError = doc.getElementsByTagName('parsererror').length;
    const byId = {};
    for (const el of doc.getElementsByTagName('*')) {
      const id = el.getAttribute('xmi:id'); if (!id) continue;
      const attrs = {}; for (const a of el.attributes) if (!/^(xmi|xsi|xmlns)/.test(a.name)) attrs[a.name] = a.value;
      const kids = {}; for (const k of el.children) { const kid = k.getAttribute('xmi:id'); if (kid) (kids[k.tagName] = kids[k.tagName] || []).push(kid); }
      byId[id] = { tag: el.tagName, xsi: xsiType(el), attrs, kids };
    }
    const map = (m1.__raw.metadata && m1.__raw.metadata.xmiIdMap) || {}; const mapId = (p) => map[p] || p;
    const objs = (m1.objects || []).filter(Boolean);
    res.xmi.objectsStore = objs.length; res.xmi.objectsFile = Object.keys(byId).length;
    let slots = 0;
    for (const o of objs) {
      const e = byId[mapId(o.id)]; const cn = o.instanceof ? o.instanceof.name : 'Object';
      if (!e) { res.xmi.mismatches.push(o.name + ': object missing'); continue; }
      if ((e.xsi || e.tag) !== cn && e.tag !== cn) res.xmi.mismatches.push(o.name + ': class ' + cn + ' vs ' + (e.xsi || e.tag));
      for (const f of (o.features || [])) {
        if (!f) continue; const meta = f.instanceof; const vals = f.__raw.values || []; if (vals.length === 0) continue; slots++;
        const fname = (meta && meta.name) || f.name;
        if (meta && meta.className === 'DReference') {
          const ids = vals.filter((v) => typeof v === 'string' && v).map(mapId);
          if (meta.containment || meta.__raw.composition) { if (JSON.stringify(e.kids[fname] || []) !== JSON.stringify(ids)) res.xmi.mismatches.push(o.name + '.' + fname + ' contained ' + ids.length + ' vs ' + (e.kids[fname] || []).length); }
          else if ((e.attrs[fname] || '') !== ids.join(' ')) res.xmi.mismatches.push(o.name + '.' + fname + ' ref ' + ids.map((i) => (idl[i] || {}).name).join(' ') + ' vs ' + e.attrs[fname]);
        } else {
          const want = vals.map((v) => (typeof v === 'string' && idl[v] && idl[v].className === 'DEnumLiteral') ? idl[v].name : String(v)).join(' ');
          if ((e.attrs[fname] || '') !== want) res.xmi.mismatches.push(o.name + '.' + fname + ' ' + want + ' vs ' + e.attrs[fname]);
        }
      }
    }
    res.xmi.slotsCompared = slots;
  }
  // The legacy Ecore JSON getters (where E2 throws), each timed; then SaveManager.exportEcore.
  for (const [label, el] of [['M2 ' + mm.name, mm], ['M1 ' + m1.name, m1]]) {
    for (const k of ['ecore', 'eCore', 'crossEcore', 'ownEcore', 'deepCrossEcore', 'deepOwnEcore', 'shallowCrossEcore', 'shallowOwnEcore']) {
      const t0 = performance.now();
      try { const j = el[k]; res.legacy[label + '.' + k] = { ok: true, bytes: JSON.stringify(j).length, ms: Number((performance.now() - t0).toFixed(2)) }; }
      catch (e) { res.legacy[label + '.' + k] = { ok: false, error: String(e && e.message).replace(/\s+/g, ' ').slice(0, 90), ms: Number((performance.now() - t0).toFixed(2)) }; }
    }
  }
  try { const j = SM.exportEcore(m1); res.legacy['SaveManager.exportEcore(M1)'] = { returned: JSON.stringify(j).slice(0, 160) }; }
  catch (e) { res.legacy['SaveManager.exportEcore(M1)'] = { threw: String(e && e.message).replace(/\s+/g, ' ').slice(0, 160) }; }
  // The walk generateEcoreJson_impl does on M1 (LModel roots, LObject features, LValue values), with the path kept.
  const visited = new Set(); const onStack = new Set(); const path = []; let first = null; let lastPath = []; const containedVia = {};
  const visit = (o) => {
    visited.add(o.id); onStack.add(o.id);
    for (const f of (o.features || [])) {
      if (!f || first) continue;
      const meta = f.instanceof; if (meta && meta.volatile) continue;
      const kind = meta && meta.className === 'DReference' ? ((meta.containment || meta.__raw.composition) ? 'containment' : 'non-containment') : 'attribute';
      if (kind !== 'containment') continue; // LValue.generateEcoreJson_impl pushes non-containment targets as pointers (measured: no DObject after a DValue:nextState in the visited set)
      let vals; try { vals = f.values; } catch (e) { vals = []; }
      for (const v of (Array.isArray(vals) ? vals : [vals])) {
        if (first) break;
        if (!v || !v.__isProxy || v.className !== 'DObject') continue;
        path.push(o.name + '.' + f.name + ' (' + kind + ') -> ' + v.name); containedVia[v.id] = o.name + '.' + f.name;
        if (visited.has(v.id)) { first = { revisited: v.name, onCurrentPath: onStack.has(v.id), closingKind: kind, path: [...path] }; break; }
        visit(v); path.pop();
      }
    }
    onStack.delete(o.id);
  };
  for (const r of (m1.roots || [])) {
    if (first) break;
    if (visited.has(r.id)) { first = { revisited: r.name, onCurrentPath: false, closingKind: 'root: LModel.roots lists it again', rootIsRoot: r.isRoot, father: r.father && (r.father.className + ':' + r.father.name), path: [...lastPath, '(root loop) ' + r.name] }; break; }
    lastPath = [];
    visit(r);
  }
  const refs = []; // the non-containment slots a correct serializer would write as references
  for (const o of (m1.objects || []).filter(Boolean)) for (const f of (o.features || [])) {
    const meta = f && f.instanceof; if (!meta || meta.className !== 'DReference' || meta.containment || meta.__raw.composition) continue;
    for (const v of (f.__raw.values || [])) if (typeof v === 'string' && idl[v]) refs.push(o.name + '.' + f.name + ' -> ' + idl[v].name);
  }
  if (first && containedVia[(m1.roots || []).find((r) => r.name === first.revisited)?.id]) first.firstVisitedAs = 'contained in ' + containedVia[(m1.roots || []).find((r) => r.name === first.revisited).id];
  res.walker = { roots: (m1.roots || []).map((r) => r.name), trueRoots: (m1.roots || []).filter((r) => r.isRoot).map((r) => r.name), first, nonContainmentSlots: refs.length, nonContainmentSample: refs.slice(0, 12) };
  return res;
})()`;

// ── Source maps: the dev server inlines one per module; frames are mapped back to source lines ─────────────────────
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const B64MAP: Record<string, number> = Object.fromEntries([...B64].map((c, i) => [c, i]));
function vlq(seg: string): number[] {
    const out: number[] = [];
    let val = 0, shift = 0;
    for (const ch of seg) {
        let d = B64MAP[ch];
        const cont = d & 32;
        d &= 31;
        val += d << shift;
        if (cont) shift += 5;
        else { out.push(val & 1 ? -(val >> 1) : val >> 1); val = 0; shift = 0; }
    }
    return out;
}
type SrcMap = { sources: string[]; lines: number[][][] };
const maps = new Map<string, SrcMap | null>();
async function srcMap(url: string): Promise<SrcMap | null> {
    if (maps.has(url)) return maps.get(url)!;
    let m: SrcMap | null = null;
    try {
        const text = await (await fetch(url)).text();
        const hit = /\/\/# sourceMappingURL=data:application\/json;(?:charset=utf-8;)?base64,([A-Za-z0-9+/=]+)\s*$/.exec(text);
        if (hit) {
            const j = JSON.parse(Buffer.from(hit[1], 'base64').toString('utf8'));
            const lines: number[][][] = [];
            let src = 0, sl = 0, sc = 0;
            for (const line of String(j.mappings).split(';')) {
                const segs: number[][] = [];
                let gc = 0;
                if (line) for (const s of line.split(',')) {
                    const v = vlq(s);
                    gc += v[0];
                    if (v.length >= 4) { src += v[1]; sl += v[2]; sc += v[3]; segs.push([gc, src, sl, sc]); }
                }
                lines.push(segs);
            }
            m = { sources: j.sources, lines };
        }
    } catch { m = null; }
    maps.set(url, m);
    return m;
}
const FRAME = /^\s*at (?:(.*?) \()?(https?:\/\/[^\s)]+?):(\d+):(\d+)\)?\s*$/;
async function mapStack(stack: string | undefined): Promise<string[]> {
    const out: string[] = [];
    for (const line of String(stack || '').split('\n')) {
        const f = FRAME.exec(line);
        if (!f) { if (line.trim()) out.push(line.trim().slice(0, 140)); continue; }
        const [, fn, url, l, c] = f;
        const path = url.replace(/^https?:\/\/[^/]+/, '').replace(/\?.*$/, '');
        if (!path.startsWith('/src/') && !path.startsWith('/scripts/')) { out.push(`${fn || '<anon>'} @ ${path.replace(/^.*node_modules\//, 'nm/')}`); continue; }
        const m = await srcMap(url);
        const segs = m?.lines[Number(l) - 1] || [];
        let best: number[] | null = null;
        for (const s of segs) { if (s[0] <= Number(c) - 1) best = s; else break; }
        out.push(`${fn || '<anon>'} @ ${path.slice(1)}:${best ? best[2] + 1 : '?' + l}`);
    }
    return out;
}

// ── Node side ──────────────────────────────────────────────────────────────────────────────────
async function newPage(browser: any): Promise<{ ctx: BrowserContext; page: Page }> {
    const ctx: BrowserContext = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
    await ctx.addInitScript(INIT);
    await seed(ctx, true);
    const page = await ctx.newPage();
    return { ctx, page };
}
async function poll<T>(page: Page, expr: string, ms: number): Promise<T | null> {
    const end = Date.now() + ms;
    while (Date.now() < end) {
        const v = await page.evaluate(expr).catch(() => null) as T | null;
        if (v) return v;
        await wait(page, 250);
    }
    return null;
}
const setStep = (page: Page, step: string) => page.evaluate(`window.__ce && (window.__ce.step = ${JSON.stringify(step)})`);
async function harvest(page: Page): Promise<{ events: any[]; other: Record<string, number> }> {
    const h = await page.evaluate(`(() => { const c = window.__ce || { events: [], other: {} }; const r = { events: c.events, other: c.other }; c.events = []; c.other = {}; return JSON.parse(JSON.stringify(r)); })()`)
        .catch(() => ({ events: [], other: {} })) as any;
    return h;
}
async function boot(page: Page): Promise<boolean> {
    await page.goto(`${URL}/#/allProjects`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    const ok = await poll<boolean>(page, `!!(window.windoww && window.windoww.store && window.LPointerTargetable)`, 60000);
    await wait(page, 2500);
    return !!ok;
}

const result: any = { url: URL, reps: REPS, modes: MODES, runs: [], exports: {}, roundTrips: {}, openSnaps: {} };
function deepDiff(a: any, b: any, limit = 60): string[] {
    const diffs: string[] = [];
    const walk = (x: any, y: any, p: string) => {
        if (diffs.length >= limit) return;
        if (x && y && typeof x === 'object' && typeof y === 'object') {
            for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) walk(x[k], y[k], p ? `${p}.${k}` : k);
        } else if (JSON.stringify(x) !== JSON.stringify(y)) diffs.push(`${p}: ${JSON.stringify(x)?.slice(0, 80)} -> ${JSON.stringify(y)?.slice(0, 80)}`);
    };
    walk(a, b, '');
    return diffs;
}
const save = () => writeFileSync(OUT, JSON.stringify(result, null, 1));

async function runLoad(browser: any, s: typeof SCENES[number], rep: number) {
    const run: any = { mode: 'load', scene: s.name, rep, steps: {}, events: [], other: {} };
    const { ctx, page } = await newPage(browser);
    const take = async (label: string) => { const h = await harvest(page); run.events.push(...h.events); for (const [k, v] of Object.entries(h.other)) run.other[k] = (run.other[k] || 0) + v; return h; };
    try {
        check(`${s.name} load #${rep} boot`, await boot(page), '');
        const pid = await page.evaluate(IMPORT(readFileSync(fixture(s.fixture), 'utf8'))) as string | null;
        check(`${s.name} load #${rep} imported`, !!pid, String(pid));
        await wait(page, 800);
        await take('boot');
        await page.goto('about:blank');
        const t0 = Date.now();
        await page.goto(`${URL}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded', timeout: 300000 });
        const ids = await poll<{ mm: string; m1: string }>(page, LOADED(s.mm, s.m1), 60000);
        run.openMs = Date.now() - t0;
        check(`${s.name} load #${rep} opened`, !!ids, JSON.stringify(ids));
        if (!ids) return run;
        await wait(page, 3500);
        run.steps.open = { selected: await page.evaluate(SELECTED) };
        if (rep === 1) result.openSnaps[`load ${s.name}`] = await page.evaluate(SNAP(pid!));
        await setStep(page, 'configure');
        run.steps.configure = await page.evaluate(CONFIGURE(ids.mm, ids.m1, s.profile, s.decls));
        await wait(page, 1200);
        await setStep(page, 'model tab');
        run.steps.modelTab = await page.evaluate(CLICK(`[...document.querySelectorAll('.dock-tab')].find((t) => t.textContent.trim() === ${JSON.stringify(s.m1)})`));
        run.steps.modelTab.tabs = await page.evaluate(`[...document.querySelectorAll('.dock-tab')].map((t) => t.textContent.trim().slice(0, 40))`);
        if (!run.steps.modelTab.found) {
            // Not open at load: open it as the tree and the Data manager do (DockManager.open2).
            run.steps.modelTab.via = await page.evaluate(String.raw`(async () => { const dm = await import('/src/components/abstract/DockManager.tsx'); await dm.default.open2(window.LPointerTargetable.fromPointer(${JSON.stringify(ids.m1)})); return 'DockManager.open2'; })()`).catch((e: any) => 'open2 failed: ' + e?.message);
        }
        await wait(page, 2000);
        run.steps.modelTab.pane = await page.evaluate(`!!${PANE(ids.m1)}`);
        await setStep(page, 'panel');
        run.steps.panel = await page.evaluate(CLICK(`${PANE(ids.m1)} && ${PANE(ids.m1)}.querySelector('.sim-panel__chip')`));
        await wait(page, 1500);
        await setStep(page, 'reset');
        run.steps.reset = { selected: await page.evaluate(SELECTED), ...(await page.evaluate(CLICK(`${PANE(ids.m1)} && ${PANE(ids.m1)}.querySelector('button.sim-panel__btn[title="Reset"]')`)) as any) };
        await wait(page, 1500);
        await setStep(page, 'step');
        const presses: any[] = [];
        for (const p of s.presses) {
            const c: any = p.event
                ? await page.evaluate(CLICK(`${PANE(ids.m1)} && [...${PANE(ids.m1)}.querySelectorAll('button.sim-panel__event')].find((b) => (b.querySelector('span') || b).textContent.trim() === ${JSON.stringify(p.event)})`))
                : await page.evaluate(CLICK(`${PANE(ids.m1)} && ${PANE(ids.m1)}.querySelector('button.sim-panel__btn[title^="Step"]')`));
            await wait(page, 500);
            if (p.choose) {
                c.choice = await page.evaluate(CLICK(`${PANE(ids.m1)} && [...${PANE(ids.m1)}.querySelectorAll('.sim-panel__choice')].find((b) => b.textContent.trim().startsWith(${JSON.stringify(p.choose + ' ')}))`));
                await wait(page, 500);
            }
            presses.push(c);
        }
        const status = await page.evaluate(STATUS(ids.m1)) as string[] | null;
        run.steps.step = { presses, status };
        const reached = !!status && status.some((t) => t.includes(s.last));
        check(`${s.name} load #${rep} the run reaches the script's last step`, reached, JSON.stringify(status));
        await setStep(page, 'board');
        run.steps.board = await page.evaluate(CLICK(`${PANE(ids.m1)} && ${PANE(ids.m1)}.querySelector('button.sim-panel__expand[title^="Open the I/O board"]')`));
        await wait(page, 1500);
        run.steps.board.open = await page.evaluate(`!!document.querySelector('.sim-board, [class*="sim-board"]')`);
        await page.evaluate(CLICK(`document.querySelector('button.sim-panel__expand[title="Close the I/O board"]')`));
        await wait(page, 800);
        run.visible = await page.evaluate(VISIBLE);
        let before: any = null;
        if (rep === 1 && s.roundTrip) {
            await take('pre-export');
            await setStep(page, 'export (probe-induced)');
            const ex = await page.evaluate(EXPORTS(ids.mm, ids.m1));
            result.exports[s.name] = ex;
            const h = await take('export');
            result.exports[s.name].e2DuringExport = h.events.filter((e: any) => e.kind === 'E2').length;
            before = await page.evaluate(SNAP(pid!));
        }
        await setStep(page, 'save');
        const lm = `(() => { const p = JSON.parse(localStorage.getItem('projects') || '[]').find((x) => x.id === ${JSON.stringify(pid)}); return p ? p.lastModified : null; })()`;
        const lm0 = await page.evaluate(lm);
        await page.evaluate(`document.activeElement && document.activeElement.blur && document.activeElement.blur()`);
        await page.keyboard.press('Meta+s');
        let saved = await poll<boolean>(page, `(${lm}) !== ${JSON.stringify(lm0)}`, 4000);
        run.steps.save = { via: saved ? 'Cmd+S' : null };
        if (!saved) {
            await page.evaluate(String.raw`(async () => { const api = await import('/src/api/persistance/projects.ts'); await api.ProjectsApi.save(window.LPointerTargetable.fromPointer(${JSON.stringify(pid)})); })()`);
            saved = await poll<boolean>(page, `(${lm}) !== ${JSON.stringify(lm0)}`, 4000);
            run.steps.save.via = saved ? 'ProjectsApi.save' : 'not saved';
        }
        await wait(page, 1500);
        run.steps.save.visible = await page.evaluate(VISIBLE);
        check(`${s.name} load #${rep} saved`, !!saved, run.steps.save.via);
        await take('end');
        if (before) {
            await setStep(page, 'reload');
            await page.reload({ waitUntil: 'domcontentloaded', timeout: 300000 });
            await poll(page, LOADED(s.mm, s.m1), 60000);
            await wait(page, 3500);
            const after = await page.evaluate(SNAP(pid!));
            await take('reload');
            const diffs = deepDiff(before, after);
            const objects = (x: any) => Object.values(x?.m1 || {}).reduce((n: number, m: any) => n + Object.keys(m.objects).length, 0);
            result.roundTrips[s.name] = { diffs, objectsBefore: objects(before), objectsAfter: objects(after), viewsBefore: before.views?.length, viewsAfter: after.views?.length,
                verticesBefore: before.vertices?.length, verticesAfter: after.vertices?.length, edgesBefore: before.edges, edgesAfter: after.edges, before, after };
            check(`${s.name} save round trip identical`, diffs.length === 0, diffs.slice(0, 6).join(' | '));
        }
    } catch (e: any) {
        failures++;
        console.log(`FAIL  ${s.name} load #${rep} exception  ${e?.message ?? String(e)}`);
        await take('exception');
    } finally {
        await ctx.close();
    }
    return run;
}

async function runHash(browser: any, s: typeof SCENES[number], rep: number) {
    const run: any = { mode: 'hash', scene: s.name, rep, steps: {}, events: [], other: {} };
    const { ctx, page } = await newPage(browser);
    try {
        check(`${s.name} hash #${rep} boot`, await boot(page), '');
        const pid = await page.evaluate(IMPORT(readFileSync(fixture(s.fixture), 'utf8'))) as string | null;
        await wait(page, 800);
        const h0 = await harvest(page);
        run.events.push(...h0.events);
        for (const [k, v] of Object.entries(h0.other)) run.other[k] = (run.other[k] || 0) + v;
        await setStep(page, 'open');
        const t0 = Date.now();
        await page.goto(`${URL}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded', timeout: 300000 });
        const ids = await poll<{ mm: string; m1: string }>(page, LOADED(s.mm, s.m1), 60000);
        run.openMs = Date.now() - t0;
        run.sameDocument = await page.evaluate(`window.__ce && window.__ce.step === 'open' && performance.getEntriesByType('navigation').length === 1`);
        check(`${s.name} hash #${rep} opened`, !!ids, JSON.stringify(ids));
        await wait(page, 4000);
        run.steps.open = { selected: await page.evaluate(SELECTED) };
        run.visible = await page.evaluate(VISIBLE);
        // What the open left in the store, name-keyed, against the load-mode open of the same scene (E1's consequence).
        result.openSnaps[`hash ${s.name} #${rep}`] = await page.evaluate(SNAP(pid!));
        const h = await harvest(page);
        run.events.push(...h.events);
        for (const [k, v] of Object.entries(h.other)) run.other[k] = (run.other[k] || 0) + v;
    } catch (e: any) {
        failures++;
        console.log(`FAIL  ${s.name} hash #${rep} exception  ${e?.message ?? String(e)}`);
    } finally {
        await ctx.close();
    }
    return run;
}

const browser = await chromium.launch();
try {
    for (const mode of MODES) for (const s of SCENES) for (let rep = 1; rep <= REPS; rep++) {
        const run = mode === 'load' ? await runLoad(browser, s, rep) : await runHash(browser, s, rep);
        for (const e of run.events) {
            if (e.callStack) e.callStackMapped = await mapStack(e.callStack);
            e.dup = (e.callStackMapped || []).some((x: string) => x.startsWith('new MyError')); // the second console line of one Log.exx: MyError's constructor logs too (joiner/classes.ts)
            if (e.actionStack) e.actionStackMapped = await mapStack(e.actionStack);
            delete e.callStack; delete e.actionStack;
        }
        result.runs.push(run);
        const by: Record<string, number> = {};
        for (const e of run.events) { if (e.dup) continue; const k = `${e.kind}@${e.step}`; by[k] = (by[k] || 0) + 1; }
        note(`${mode} ${s.name} #${rep}`, { openMs: run.openMs, events: by, resetMs: run.steps.reset?.ms, selectedAtReset: run.steps.reset?.selected?.modelElement, save: run.steps.save?.via });
        save();
    }
    // Summary: per mode, scene and step, the number of runs with the error and the occurrences.
    const table: Record<string, { runs: number; withE1: number; e1: number; withE2: number; e2: number }> = {};
    for (const run of result.runs) {
        const steps = new Set<string>(['open', ...run.events.map((e: any) => e.step)]);
        for (const st of steps) {
            const k = `${run.mode} ${run.scene} ${st}`;
            const t = table[k] = table[k] || { runs: 0, withE1: 0, e1: 0, withE2: 0, e2: 0 };
            t.runs++;
            const e1 = run.events.filter((e: any) => e.step === st && e.kind === 'E1' && !e.dup).length;
            const e2 = run.events.filter((e: any) => e.step === st && e.kind === 'E2' && !e.dup).length;
            t.e1 += e1; t.e2 += e2; if (e1) t.withE1++; if (e2) t.withE2++;
        }
    }
    result.table = table;
    for (const [k, v] of Object.entries(table)) note(`count ${k}`, v);
    const e1s = result.runs.flatMap((r: any) => r.events.filter((e: any) => e.kind === 'E1').map((e: any) => ({ mode: r.mode, scene: r.scene, ...e })));
    const groups: Record<string, number> = {};
    for (const e of e1s) { const k = `${e.msg} | ${e.action?.className} ${e.action?.field} | key in state ${e.keyInReducedState} live ${e.keyInLiveState} | batch ${e.batch?.n} «${e.batch?.title}»`; groups[k] = (groups[k] || 0) + 1; }
    for (const [k, v] of Object.entries(groups)) note('E1 group', `${v}×  ${k}`);
    const e2s = result.runs.flatMap((r: any) => r.events.filter((e: any) => e.kind === 'E2' && !e.dup).map((e: any) => ({ mode: r.mode, scene: r.scene, ...e })));
    const g2: Record<string, number> = {};
    for (const e of e2s) {
        const app = (e.callStackMapped || []).filter((f: string) => / @ src\//.test(f) && !/LModelElement\.tsx|Log\.ts|U\.tsx|proxy|Proxy/.test(f)).slice(0, 4).map((f: string) => f.split(' @ ')[0]).join(' < ');
        const k = `${e.step} | at ${e.at} | ${app}`;
        g2[k] = (g2[k] || 0) + 1;
    }
    for (const [k, v] of Object.entries(g2)) note('E2 group', `${v}×  ${k}`);
    for (const [k, v] of Object.entries(result.exports)) note(`exports ${k}`, { ecore: { ...(v as any).ecore }, xmi: { ...(v as any).xmi }, walker: (v as any).walker, legacy: (v as any).legacy });
    // E1's consequence: the store after a hash open against the store after a fresh load, same scene, by name.
    result.openCompare = {};
    for (const sc of SCENES) {
        const base = result.openSnaps[`load ${sc.name}`];
        if (!base) continue;
        for (let rep = 1; rep <= REPS; rep++) {
            const h = result.openSnaps[`hash ${sc.name} #${rep}`];
            if (!h) continue;
            const strip = (x: any) => { const { project, ...rest } = x; return { ...rest, project: { ...project, name: undefined } }; };
            const d = deepDiff(strip(base), strip(h));
            result.openCompare[`${sc.name} #${rep}`] = d;
            note(`open hash vs load ${sc.name} #${rep}`, d.length === 0 ? 'identical' : d.slice(0, 8));
        }
    }
    for (const [k, v] of Object.entries(result.roundTrips)) note(`round trip ${k}`, { diffs: (v as any).diffs, objects: [(v as any).objectsBefore, (v as any).objectsAfter], views: [(v as any).viewsBefore, (v as any).viewsAfter], vertices: [(v as any).verticesBefore, (v as any).verticesAfter], edges: [(v as any).edgesBefore, (v as any).edgesAfter] });
} catch (e: any) {
    failures++;
    console.log(`FAIL  exception  ${e?.message ?? String(e)}`);
} finally {
    save();
    await browser.close();
    console.log(`${failures === 0 ? 'ALL GREEN' : `${failures} FAILED`}  out ${OUT}`);
    process.exit(failures === 0 ? 0 : 1);
}
