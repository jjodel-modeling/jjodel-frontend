/**
 * io-board-lane1 probe (P-2026-10-03-1845, Phase 2 Lane 1, `sim-io-board-model`).
 *
 * Two parts, chosen by IOB_PART:
 *
 *   scenes  The four demo scenes, read through the panel's own builders, before and after the lane, so a diff of the
 *           two JSON files says whether the run's readings stayed byte-identical (report §8). Each scene is imported
 *           from its export (`fixtures/scene_*.jjodel`, byte copies of `~/jjodel-demo-exports/`), configured as the
 *           demo script configures it, but in the page, not through the UI: `simEnabled` and the preset through
 *           `profileBindings`, the bound proposal and `profilePatch` (the panel's Apply), the model's globals where
 *           the script declares them (ESM `coins`, `paid`; Flow B `count`). The run is started with `startRun` (seed
 *           12345) and every press goes through `pressInput`, a choice list answered by the transition the script
 *           names. Per step: «Last step» and its title, the list, the status, the marking line and chips, Watch, the
 *           events on and their reasons, the stop reason, the halt, the status line. Ids are never recorded: the
 *           import renews them.
 *   editor  The board editor (SimBoardEditor.tsx), mounted through the dev server by the harness module
 *           `io-board-editor-harness.tsx` on DemoESM (Extended state machine, the script's two globals plus an IVAR
 *           `power` for the Switch). Drives the palette, the binding inspector and Apply; reads the written `ioBoard`
 *           key, the undo and redo, `runSignature`; crops in IOB_CROPS, light and dark.
 *
 * Run:  ~/.local/bin/node frontend/scripts/lane-run.mjs probe <worktree> frontend/scripts/probe/io-board-lane1.ts \
 *         --port 3079 --id P-2026-10-03-1845      (with IOB_PART and IOB_TAG in the environment)
 * Env:  IOB_PART   scenes | editor (default scenes)
 *       IOB_TAG    scenes: the name of the JSON written under frontend/scripts/smoke/ (default after)
 *       IOB_CROPS  editor: the directory of the crops (default ~/.jjodel-lanes/P-2026-10-03-1845)
 */
import { chromium, type Page } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { seed, setTheme } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3079/').replace(/\/$/, '');
if (/:(3000|3001|3003)$/.test(URL)) throw new Error('never 3000, 3001 or 3003');
const PART = process.env.IOB_PART || 'scenes';
const TAG = process.env.IOB_TAG || 'after';
const CROPS = process.env.IOB_CROPS || `${homedir()}/.jjodel-lanes/P-2026-10-03-1845`;
const fixture = (name: string) => new globalThis.URL(`./fixtures/${name}.jjodel`, import.meta.url).pathname;
const smokeOut = (name: string) => new globalThis.URL(`../smoke/${name}`, import.meta.url).pathname;

const note = (label: string, d: unknown) => console.log(`MEAS  ${label}  ${typeof d === 'string' ? d : JSON.stringify(d)}`);
let failures = 0;
const check = (label: string, ok: boolean, detail: string) => {
    if (!ok) failures++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  ${detail}`);
};
const wait = (page: Page, ms: number) => page.waitForTimeout(ms);

// ── Page side (plain strings: no transform) ────────────────────────────────────────────────────
const IMPORT = (text: string) => String.raw`(async () => {
  const api = await import('/src/api/persistance/projects.ts');
  const count = () => JSON.parse(localStorage.getItem('projects') || '[]').length;
  const before = count();
  await api.ProjectsApi.importFromText(${JSON.stringify(text)});
  for (let i = 0; i < 75 && count() <= before; i++) await new Promise(r => setTimeout(r, 200));
  const a = JSON.parse(localStorage.getItem('projects') || '[]');
  return a.length > before ? a[a.length - 1].id : null;
})()`;

/** Loads the modules, finds the two models, applies the preset as the panel's Apply does, declares the model's globals. */
const SETUP = (mmName: string, m1Name: string, profileId: string, decls: unknown[]) => String.raw`(async () => {
  const w = window;
  const idl = () => w.windoww.store.getState().idlookup;
  const all = () => Object.values(idl()).filter((d) => d && typeof d === 'object');
  const L = (x) => w.LPointerTargetable.fromPointer(x);
  const M = w.__iob = {
    RS: await import('/src/components/editor-v2/sim/simRoleStatus.ts'),
    SK: await import('/src/components/editor-v2/sim/metamodelSketch.ts'),
    MK: await import('/src/components/editor-v2/sim/modelMarkings.ts'),
    PR: await import('/src/model/simulation/simProfiles.ts'),
    B: await import('/src/components/editor-v2/sim/simBridge.ts'),
    R: await import('/src/components/editor-v2/sim/simRunState.ts'),
    VP: await import('/src/components/editor-v2/sim/simViewerPrefs.ts'),
    C: await import('/src/model/simulation/stateAttributesCodec.ts'),
    NS: await import('/src/model/simulation/netStep.ts'),
    RC: await import('/src/model/simulation/roleCatalog.ts'),
    JS: await import('/src/jjscript/index.ts'),
    J: await import('/src/joiner/index.ts'),
  };
  const mm = all().find((d) => d.className === 'DModel' && d.isMetamodel && d.name === ${JSON.stringify(mmName)});
  const m1 = all().find((d) => d.className === 'DModel' && !d.isMetamodel && d.name === ${JSON.stringify(m1Name)});
  M.mm = mm && mm.id; M.m1 = m1 && m1.id;
  M.projectId = (() => { try { return L(M.J.DUser.current).project.id; } catch (e) { return null; } })();
  if (!M.mm || !M.m1) return { error: 'models not found' };
  L(M.mm).state = { simEnabled: true };
  await new Promise((r) => setTimeout(r, 300));
  const lookup = idl();
  const bag = lookup[M.mm]._state || {};
  const profile = M.PR.systemProfile(${JSON.stringify(profileId)});
  const bindings = M.RS.profileBindings(profile, M.SK.sketchOfMetamodel(lookup, M.mm), bag);
  const boundBag = M.RS.boundProposalInputs(profile, bag, bindings) ? M.RS.boundProposalBag(profile, bag, bindings) : null;
  const largest = boundBag ? M.MK.boundEstimate(lookup, M.mm, boundBag) : null;
  const classIds = all().filter((d) => d.className === 'DClass' && !d.abstract).map((d) => d.id);
  const res = M.RS.profilePatch(profile, bag, bindings, lookup, classIds, largest);
  if (res.kind !== 'write') return { error: 'profile refused' };
  L(M.mm).state = res.patch;
  await new Promise((r) => setTimeout(r, 300));
  const decls = ${JSON.stringify(decls)};
  if (decls.length > 0) {
    L(M.m1).state = { simStateAttributes: M.C.encodeStateAttributes(decls) };
    await new Promise((r) => setTimeout(r, 300));
  }
  const raw = idl()[M.mm]._state || {};
  return { patch: Object.keys(res.patch).sort(), bound: raw.simBound || null, model: idl()[M.m1].name };
})()`;

/** Reset and the presses, each read through the panel's builders. */
const RUN = (presses: Array<{ event?: string; choose?: string }>) => String.raw`(async () => {
  const w = window; const M = w.__iob;
  const idl = () => w.windoww.store.getState().idlookup;
  const lookup0 = idl();
  const raw = lookup0[M.mm]._state || {};
  const guards = M.RC.roleValues(raw.simGuard);
  const features = { actions: M.RC.roleValues(raw.simAction), entries: M.RC.roleValues(raw.simEntry), exits: M.RC.roleValues(raw.simExit) };
  const nameOf = (id) => (idl()[id] && idl()[id].name) || '?';
  const label = (e) => (e === null ? 'ε' : nameOf(e));
  const started = M.B.startRun(idl(), M.m1, M.mm, M.projectId, M.JS.buildEvalContext, 12345);
  if (started.kind !== 'started') return { refused: started.reason };
  M.R.simReset(M.m1, started.run);
  let last = { text: 'Reset', title: 'Reset' };
  const read = (pressed) => {
    const run = M.R.getSimRun(M.m1); const lookup = idl(); const st = run.config.state;
    const status = M.B.runStatus(run);
    const step = (run.trace || []).length;
    const prev = step > 0 ? (M.R.configAt(run, step - 1) || {}).state || null : null;
    const inputs = M.B.panelInputs(status, M.NS.structuralInputs(run.net, st));
    const pins = M.VP.defaultSimPins(run.net.attributes).filter((p) => p.metaclass === null);
    const reasons = {};
    for (const e of [null, ...run.alphabet]) {
      const why = M.B.inputReason(run, e, lookup, label, guards);
      const asks = M.B.inputAsks(run, e).map((a) => M.B.inputLabel(a, run.net, lookup));
      reasons[label(e)] = { why: why ? why.full : null, asks };
    }
    const stop = status === 'Deadlock' ? M.B.stopReason(run, lookup, label, guards) : null;
    return {
      pressed: pressed ? {
        lastStep: pressed.lastStep, lastStepTitle: pressed.lastStepTitle || null,
        pending: pressed.pending ? pressed.pending.map((c) => M.B.candidateLabel(run.net, c.transition, lookup)) : null,
        asks: pressed.asks ? pressed.asks.map((a) => M.B.inputLabel(a, run.net, lookup)) : null,
      } : null,
      status, step,
      marking: M.B.markingLine(st, run.net, lookup),
      chips: M.B.markingChips(st, lookup).map((c) => c.text),
      watch: M.B.watchRows(run.net, st, prev, pins, lookup, step > 0 ? (run.trace[step - 1].inputs || []) : [])
        .map((r) => ({ name: r.name, kind: r.kind, value: r.value, before: r.before === undefined ? '-' : r.before, changed: r.changed, space: r.space })),
      output: M.B.outputLine(st, run.net, lookup),
      accepting: M.B.acceptingMark(run.net, st),
      halt: run.halt ? M.B.haltMessage(run.halt, lookup, features) : null,
      epsilon: inputs.epsilon,
      eventsOn: [...inputs.events].map(nameOf).sort(),
      reasons,
      stop: stop ? { line: stop.line, title: stop.title } : null,
      statusLine: M.B.statusLine(step, undefined, last),
    };
  };
  const rows = [{
    press: 'Reset', reset: {
      defects: M.B.defectsLine(started.run.net, idl(), started.compileDefects),
      undeclared: M.B.undeclaredGlobals(started.compileDefects || [], idl(), M.m1),
      compileDefects: (started.compileDefects || []).map((d) => d.short || d.detail),
    }, ...read(null),
  }];
  for (const p of ${JSON.stringify(presses)}) {
    const ev = p.event ? Object.values(idl()).find((d) => d && d.className === 'DObject' && d.name === p.event && d.father === M.m1) : null;
    const input = ev ? p.event : 'ε';
    let pressed = M.B.pressInput(M.m1, ev ? ev.id : null, undefined, idl(), input);
    const offered = pressed.pending ? pressed.pending.map((c) => M.B.candidateLabel(M.R.getSimRun(M.m1).net, c.transition, idl())) : null;
    if (pressed.pending && p.choose) {
      const run = M.R.getSimRun(M.m1);
      const c = pressed.pending.find((x) => M.B.candidateLabel(run.net, x.transition, idl()).startsWith(p.choose + ' ('));
      pressed = M.B.pressInput(M.m1, ev ? ev.id : null, c ? c.transition : undefined, idl(), input);
    }
    if (pressed.lastStep !== null) last = { text: pressed.lastStep, title: pressed.lastStepTitle || pressed.lastStep };
    rows.push({ press: p.event || ('▶' + (p.choose ? ' ' + p.choose : '')), offered, ...read(pressed) });
  }
  M.R.simClear(M.m1);
  return { rows };
})()`;

const SCENES = [
    {
        name: 'PEST', fixture: 'scene_1_DemoPEST', mm: 'DemoPEST', m1: 'demoSM', profile: 'stateMachine', decls: [],
        presses: ['push', 'coin', 'coin', 'push', 'coin', 'push', 'push', 'coin', 'push', 'stop'].map((event) => ({ event })),
        lines: ['push: t3 (locked → locked) fired', 'coin: t1 (locked → unlocked) fired', 'coin: t4 (unlocked → unlocked) fired',
            'push: t2 (unlocked → locked) fired', 'coin: t1 (locked → unlocked) fired', 'push: t2 (unlocked → locked) fired',
            'push: t3 (locked → locked) fired', 'coin: t1 (locked → unlocked) fired', 'push: t2 (unlocked → locked) fired',
            'stop: t5 (locked → off) fired'],
        final: 'Terminated',
    },
    {
        name: 'Petri', fixture: 'scene_2_DemoPetri', mm: 'DemoPetri', m1: 'demoNet', profile: 'petri', decls: [],
        presses: [{ choose: 't1' }, { choose: 't3' }, { choose: 't2' }, {}],
        lines: ['ε: t1 (p1 → p2 ×2) fired', 'ε: t3 (lock → ∅) fired', 'ε: t2 (p2 ×2 → p3) fired', 'ε: t1 (p1 → p2 ×2) fired'],
        final: 'Deadlock',
    },
    {
        name: 'ESM', fixture: 'scene_3_DemoESM', mm: 'DemoESM', m1: 'demoESM', profile: 'extendedStateMachine',
        decls: [
            { name: 'coins', metaclass: null, space: 'semantic', domain: { kind: 'range', min: 0, max: 3 }, initial: '0' },
            { name: 'paid', metaclass: null, space: 'semantic', domain: { kind: 'boolean' }, initial: '', equation: 'model.[coins] >= 2' },
        ],
        presses: ['push', 'coin', 'push', 'coin', 'push', 'push', 'coin', 'coin', 'coin', 'coin'].map((event) => ({ event })),
        lines: ['push: discarded, tp guard false', 'coin: tc (locked → locked) fired', 'push: discarded, tp guard false',
            'coin: tc (locked → locked) fired', 'push: tp (locked → unlocked) fired', 'push: tu (unlocked → locked) fired',
            'coin: tc (locked → locked) fired', 'coin: tc (locked → locked) fired', 'coin: tc (locked → locked) fired',
            'coin: tc (locked → locked) halted the run'],
        final: 'Halted',
    },
    {
        name: 'FlowB', fixture: 'scene_4_DemoFlowB', mm: 'DemoFlowB', m1: 'demoFlowB', profile: 'flowchart',
        decls: [{ name: 'count', metaclass: null, space: 'semantic', domain: { kind: 'range', min: 0, max: 3 }, initial: '0' }],
        presses: [{}, {}, {}, {}, {}, {}],
        lines: ['ε: f1 (i0 → work) fired', 'ε: f2 (work → d1) fired', 'ε: f3 (d1 → work) fired', 'ε: f2 (work → d1) fired',
            'ε: fk (d1 → left, right) fired', 'ε: jn (left, right → fin) fired'],
        final: 'Terminated',
    },
];

async function openFixture(page: Page, name: string): Promise<string | null> {
    await page.goto(`${URL}/#/allProjects`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await wait(page, 5000);
    const project = await page.evaluate(IMPORT(readFileSync(fixture(name), 'utf8'))) as string | null;
    if (!project) return null;
    await page.goto(`${URL}/#/project?id=${project}`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await wait(page, 9000);
    return project;
}

async function scenes(page: Page, result: any) {
    for (const s of SCENES) {
        const project = await openFixture(page, s.fixture);
        check(`${s.name} imported`, !!project, String(project));
        const setup: any = await page.evaluate(SETUP(s.mm, s.m1, s.profile, s.decls));
        check(`${s.name} configured`, !setup.error, JSON.stringify(setup));
        const run: any = await page.evaluate(RUN(s.presses));
        result.scenes[s.name] = { setup, ...run };
        if (run.refused) { check(`${s.name} run`, false, run.refused); continue; }
        const lines = run.rows.slice(1).map((r: any) => r.pressed?.lastStep);
        check(`${s.name} lines as the script`, JSON.stringify(lines) === JSON.stringify(s.lines), JSON.stringify(lines));
        const lastRow = run.rows[run.rows.length - 1];
        check(`${s.name} ends ${s.final}`, lastRow.status === s.final, `${lastRow.status} · ${lastRow.marking.line}`);
        note(`${s.name} reset`, run.rows[0].reset);
    }
    const out = smokeOut(`_tmp_ioboard_scenes_${TAG}.json`);
    writeFileSync(out, JSON.stringify(result.scenes, null, 1));
    note('scenes written', out);
}

// ── Editor part ───────────────────────────────────────────────────────────────────────────────
const MOUNT = String.raw`(async () => {
  const w = window; const M = w.__iob;
  const h = await import('/scripts/probe/io-board-editor-harness.tsx');
  w.__iobHarness = h;
  const idl = () => w.windoww.store.getState().idlookup;
  h.mountBoardEditor({ modelId: M.m1, modelName: idl()[M.m1].name, boardRaw: (idl()[M.m1]._state || {}).ioBoard ?? null });
  await new Promise((r) => setTimeout(r, 800));
  return !!document.querySelector('.sim-board-editor');
})()`;

async function editor(page: Page, result: any) {
    mkdirSync(CROPS, { recursive: true });
    const project = await openFixture(page, 'scene_3_DemoESM');
    check('ESM imported', !!project, String(project));
    // The history records only after a user's interaction (`U.userHasInteracted`), as the simulator's walks set it
    // (probe kit simgate, `_tmp_simgate_common.ts`): the setup below is then three undo steps, as the demo's is.
    await page.mouse.click(800, 20);
    await page.evaluate(() => { (window as any).windoww.U.userHasInteracted = true; });
    await wait(page, 600);
    const decls = [
        { name: 'coins', metaclass: null, space: 'semantic', domain: { kind: 'range', min: 0, max: 3 }, initial: '0' },
        { name: 'paid', metaclass: null, space: 'semantic', domain: { kind: 'boolean' }, initial: '', equation: 'model.[coins] >= 2' },
        { name: 'power', metaclass: null, space: 'semantic', domain: { kind: 'boolean' }, initial: '', input: true },
    ];
    const setup: any = await page.evaluate(SETUP('DemoESM', 'demoESM', 'extendedStateMachine', decls));
    check('ESM configured', !setup.error, JSON.stringify(setup));
    const sigBefore: string = await page.evaluate(`(() => { const M = window.__iob; return M.B.runSignature(window.windoww.store.getState().idlookup, M.m1, M.mm); })()`);
    // The undo gate (reducer.ts setDocumentEvents): a change is an undo step once a document mouseup raised
    // `statehistory.globalcanundostate`; the dialog stops its own mouseups, as SimDataModal does, so the probe clicks
    // the top bar first, as a user's earlier click does (undo-inline-edit.ts, P-2026-10-03-1632).
    const hist = () => page.evaluate(`(() => { const w = window; const h = w.statehistory[w.DUser.current];
      return { u: h ? h.undoable.length : null, r: h ? h.redoable.length : null, canUndo: !!w.statehistory.globalcanundostate }; })()`);
    for (const theme of ['light', 'dark'] as const) {
        await setTheme(page, theme);
        await page.mouse.click(800, 20);
        await wait(page, 600);
        const mounted = await page.evaluate(MOUNT);
        check(`editor mounted (${theme})`, mounted === true, String(mounted));
        const dialog = page.locator('.sim-board-editor');
        await dialog.screenshot({ path: `${CROPS}/_tmp_ioboard_editor_open_${theme}.png` });
        if (theme === 'light') {
            // Palette: one device of each kind.
            const kinds = ['Button', 'Switch', 'Slider', 'Keypad', 'LED', 'Pulse LED', '7-segment', 'Text display', 'Gauge'];
            for (const k of kinds) await dialog.locator('.sim-board-editor__palette-item', { hasText: new RegExp(`^\\s*${k.replace(/[-]/g, '\\-')}\\s*$`) }).first().click();
            const tiles = await dialog.locator('.sim-board-editor__tile').count();
            check('nine tiles after the palette', tiles === 9, String(tiles));
            // Bind four of them through the inspector: d1 Button coin, d2 Switch power, d5 LED locked marked, d7 7-segment coins.
            const bind = async (id: string, select: string, value: string) => {
                await dialog.locator(`.sim-board-editor__tile[data-device="${id}"]`).click();
                await dialog.locator(`select[aria-label="${select}"]`).selectOption({ label: value });
            };
            await bind('d1', 'Event', 'coin');
            await bind('d2', 'Input variable', 'power');
            await bind('d5', 'State', 'locked');
            await dialog.locator('.sim-board-editor__tile[data-device="d7"]').click();
            await dialog.locator('input[aria-label="Expression"]').fill('model.[coins]');
            await dialog.locator('input[aria-label="Expression"]').press('Enter');
            await bind('d8', 'Binding', 'Expression over σ');
            await dialog.locator('input[aria-label="Expression"]').fill('model.[nope]');
            await dialog.locator('input[aria-label="Expression"]').press('Enter');
            await dialog.locator('.sim-board-editor__tile[data-device="d1"]').click();
            const flags: any = await dialog.evaluate((el) => [...el.querySelectorAll('.sim-board-editor__tile')].map((t) => ({
                id: t.getAttribute('data-device'), flagged: t.classList.contains('sim-board-editor__tile--flagged'), title: t.getAttribute('title'),
            })));
            result.editor.flags = flags;
            note('tiles', flags);
            const flagOf = (id: string) => flags.find((f: any) => f.id === id)?.flagged;
            check('bound devices not flagged', flagOf('d1') === false && flagOf('d2') === false && flagOf('d5') === false && flagOf('d7') === false, JSON.stringify(flags));
            check('undeclared expression flagged', flagOf('d8') === true, JSON.stringify(flags.find((f: any) => f.id === 'd8')));
            const table: any = await dialog.evaluate((el) => [...el.querySelectorAll('.sim-board-editor__table tbody tr')].map((tr) => [...tr.querySelectorAll('td')].map((td) => td.textContent)));
            result.editor.table = table;
            note('table', table);
            await dialog.screenshot({ path: `${CROPS}/_tmp_ioboard_editor_bound_light.png` });
            // Apply: one state write; the key decodes to nine devices; the signature does not move.
            const histBefore: any = await hist();
            await dialog.locator('.sim-roles-modal__btn--primary', { hasText: 'Apply' }).click();
            await wait(page, 800);
            const after: any = await page.evaluate(`(async () => {
              const w = window; const M = w.__iob; const idl = () => w.windoww.store.getState().idlookup;
              const BC = await import('/src/model/simulation/boardCodec.ts');
              const raw = (idl()[M.m1]._state || {}).ioBoard;
              const d = BC.decodeBoard(raw);
              return { raw, devices: d.devices.length, defects: d.defects, sig: M.B.runSignature(idl(), M.m1, M.mm), open: !!document.querySelector('.sim-board-editor') };
            })()`);
            result.editor.after = after;
            check('Apply wrote ioBoard with nine devices', after.devices === 9 && after.defects.length === 0, JSON.stringify({ devices: after.devices, defects: after.defects }));
            check('runSignature unchanged by the board', after.sig === sigBefore, `${after.sig.length} vs ${sigBefore.length}`);
            await page.evaluate(`window.__iobHarness.unmountBoardEditor()`);
            const histAfter: any = await hist();
            result.editor.history = { before: histBefore, after: histAfter };
            note('undo history around Apply', result.editor.history);
            check('Apply is one undo step', histAfter.u === histBefore.u + 1, JSON.stringify(result.editor.history));
            // Undo: one step takes the key back.
            await page.mouse.click(800, 20);
            await wait(page, 600);
            await page.keyboard.press('ControlOrMeta+z');
            await wait(page, 1200);
            const undone: any = await page.evaluate(`(() => { const M = window.__iob; return (window.windoww.store.getState().idlookup[M.m1]._state || {}).ioBoard ?? null; })()`);
            result.editor.undone = undone;
            check('one undo removes the board', undone === null, String(undone).slice(0, 80));
            await page.keyboard.press('ControlOrMeta+Shift+z');
            await wait(page, 1200);
            const redone: any = await page.evaluate(`(() => { const M = window.__iob; return (window.windoww.store.getState().idlookup[M.m1]._state || {}).ioBoard ?? null; })()`);
            check('redo brings it back', redone === after.raw, String(redone).slice(0, 80));
        } else {
            await dialog.locator('.sim-board-editor__tile').first().click().catch(() => undefined);
            await dialog.screenshot({ path: `${CROPS}/_tmp_ioboard_editor_bound_dark.png` });
            await page.evaluate(`window.__iobHarness.unmountBoardEditor()`);
        }
    }
    const geometry: any = await page.evaluate(String.raw`(async () => {
      const M = window.__iob; const idl = () => window.windoww.store.getState().idlookup;
      window.__iobHarness.mountBoardEditor({ modelId: M.m1, modelName: idl()[M.m1].name, boardRaw: (idl()[M.m1]._state || {}).ioBoard ?? null });
      await new Promise((r) => setTimeout(r, 800));
      const el = document.querySelector('.sim-board-editor'); const r = el.getBoundingClientRect();
      const body = el.querySelector('.sim-roles-modal__body');
      return { width: Math.round(r.width), height: Math.round(r.height), bodyScroll: body ? [body.clientHeight, body.scrollHeight] : null };
    })()`);
    result.editor.geometry = geometry;
    note('editor geometry', geometry);
    await page.locator('.sim-board-editor').screenshot({ path: `${CROPS}/_tmp_ioboard_editor_reopened_dark.png` });
    await setTheme(page, 'light');
    await wait(page, 500);
    await page.locator('.sim-board-editor').screenshot({ path: `${CROPS}/_tmp_ioboard_editor_reopened_light.png` });
}

// ── Main ──────────────────────────────────────────────────────────────────────────────────────
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2 });
await ctx.addInitScript(() => { (globalThis as any).__name = (f: any) => f; });
await seed(ctx, true);
const page: Page = await ctx.newPage();
const errors: string[] = [];
page.on('pageerror', (e: Error) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 200)); });
const result: any = { url: URL, part: PART, scenes: {}, editor: {} };
try {
    if (PART === 'scenes') await scenes(page, result);
    else if (PART === 'editor') await editor(page, result);
    else throw new Error(`unknown IOB_PART ${PART}`);
} catch (e: any) {
    failures++;
    console.log(`FAIL  exception  ${e?.message ?? String(e)}`);
} finally {
    result.errors = errors;
    result.failures = failures;
    writeFileSync(smokeOut(`_tmp_ioboard_lane1_${PART}_${TAG}.result.json`), JSON.stringify(result, null, 1));
    const kinds: Record<string, number> = {};
    for (const e of errors) kinds[e.slice(0, 60)] = (kinds[e.slice(0, 60)] ?? 0) + 1;
    note('page errors', kinds);
    await browser.close();
    console.log(`${failures === 0 ? 'ALL GREEN' : `${failures} FAILED`}  part ${PART} tag ${TAG}`);
    process.exit(failures === 0 ? 0 : 1);
}
