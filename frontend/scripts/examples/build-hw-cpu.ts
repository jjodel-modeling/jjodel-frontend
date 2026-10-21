/**
 * build-hw-cpu (P-2026-10-21-1036, slice S-A1 of the hardware demonstrator plan,
 * docs/discovery/discovery_2026-10-21_hw_demonstrator_plan.md §10.1): builds the `HwDesign` metamodel and the CPU model
 * `cpu` in a running app and saves them as the project file frontend/public/examples/hw/hw-cpu.jjodel.
 *
 * The file is written by the app's own export, not by hand (R9 of the plan). Nothing is imported: no base scene holds
 * this metamodel, so the build starts from nothing, in a fresh browser context, with the helpers of
 * scripts/probe/bpmn-lanes-fixture.ts:
 *   - New Project on the dashboard, «New metamodel», then the metamodel of the spec through the L-API: every DClass of
 *     the spec (`pkg.addClass`, `abstract`, `extends`), every DAttribute (`addAttribute` with its primitive pointer) and
 *     DReference (`addReference`, `composition`), with the spec's bounds;
 *   - a new model (`buildModelShell`), named as the spec's model, its objects created through the canvas
 *     (`syncCreateObject`, `buildObjects`), the containment slots appended by the canvas write path
 *     (`syncCreateCompositionLink`, `buildLinks`), the other references by `syncSetReferenceValue`, the attribute
 *     slots through the L proxy (`o.$f.values`);
 *   - the store read back and compared with the spec, element by element, by name;
 *   - the project renamed (`HW CPU`), the model opened once so its layout is stored, and Navbar's File → «Download
 *     Project» clicked (`ProjectsApi.save`, `buildProjectExportJson`, `U.download`): the browser's download is the file.
 * The spec, src/codegen/examples/hw-cpu/hw-cpu.json, is the truth the node tests read (importable.test.ts). Default
 * viewpoints only: the three views of the plan are slice S-A2; the simulation roles, the program and the scenario
 * are slice S-B.
 *
 * Run:  ~/.local/bin/node frontend/scripts/lane-run.mjs probe <worktree> frontend/scripts/examples/build-hw-cpu.ts \
 *         --port 3097 --id P-2026-10-21-1100
 * Env:  HWB_DIR  the output folder (default frontend/public/examples/hw)
 */
import { chromium, type Page } from '@playwright/test';
import { mkdirSync, readFileSync, statSync } from 'node:fs';
import { seed } from '../smoke/states.ts';
import { buildModelShell, buildObjects, createProject, ev } from '../probe/bpmn-lanes-fixture.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3097/').replace(/\/$/, '');
if (/:(3000|3001|3003)$/.test(URL)) throw new Error('never 3000, 3001 or 3003');
const DIR = process.env.HWB_DIR || new globalThis.URL('../../public/examples/hw', import.meta.url).pathname;
const NAME = 'hw-cpu';
/** The project name the file carries; an import shows it with the app's ` copy` suffix. */
const PROJECT = 'HW CPU';
const PRIMITIVES = new Set(['Pointer_EINT', 'Pointer_ESTRING', 'Pointer_EBOOLEAN', 'Pointer_EXPRESSION', 'Pointer_ACTION']);
mkdirSync(DIR, { recursive: true });

type Entry = Record<string, any>;
const spec: { lookup: Record<string, Entry> } = JSON.parse(readFileSync(new globalThis.URL(`../../src/codegen/examples/${NAME}/${NAME}.json`, import.meta.url), 'utf8'));
const lookup = spec.lookup;
const of = (className: string) => Object.values(lookup).filter(d => d.className === className);
const MM = lookup.MM, M = lookup.M;

let failures = 0;
const check = (label: string, ok: boolean, detail: unknown) => {
    if (!ok) failures++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  ${typeof detail === 'string' ? detail : JSON.stringify(detail).slice(0, 1500)}`);
};

async function poll<T>(page: Page, expr: string, ms: number): Promise<T | null> {
    const end = Date.now() + ms;
    while (Date.now() < end) {
        const v = await page.evaluate(expr).catch(() => null) as T | null;
        if (v) return v;
        await page.waitForTimeout(250);
    }
    return null;
}

// ── The spec, read as the build needs it ─────────────────────────────────────────────────────────────────────────

/** Class name of a class id of the spec. */
const cname = (cid: string) => lookup[cid].name as string;
/** Every feature of a class of the spec, inherited ones first, as the objects' `features` list them. */
const featuresOf = (cid: string): Entry[] => [
    ...(lookup[cid].extends as string[]).flatMap(featuresOf),
    ...Object.values(lookup).filter(d => (d.className === 'DAttribute' || d.className === 'DReference') && d.father === cid),
];
/** Per object: its class name and every slot, a reference's values as object names (the spec's ids are its names). */
function expected(): Record<string, { cls: string; f: Record<string, unknown[]> }> {
    const out: Record<string, { cls: string; f: Record<string, unknown[]> }> = {};
    for (const o of of('DObject')) {
        const f: Record<string, unknown[]> = {};
        for (const vid of o.features) {
            const v = lookup[vid];
            f[lookup[v.instanceof].name] = v.values.map((x: unknown) => (lookup[v.instanceof].className === 'DReference' ? lookup[x as string].name : x));
        }
        out[o.name] = { cls: cname(o.instanceof), f: Object.fromEntries(Object.entries(f).sort(([a], [b]) => (a < b ? -1 : 1))) };
    }
    return out;
}

/** The canvas positions: one band of rows per group, eight vertices a row, in the spec's order. */
function layout(): Array<[string, string, string, number, number, null]> {
    const groups: Array<(o: Entry) => boolean> = [
        o => ['Format', 'Field', 'Instruction'].includes(cname(o.instanceof)),
        o => ['Register', 'Alu', 'Mux', 'Memory'].includes(cname(o.instanceof)),
        o => cname(o.instanceof) === 'Port',
        o => cname(o.instanceof) === 'Wire',
        o => ['State', 'InitialState', 'FinalState'].includes(cname(o.instanceof)),
        o => cname(o.instanceof) === 'Transition',
        o => cname(o.instanceof) === 'Cell',
    ];
    const out: Array<[string, string, string, number, number, null]> = [];
    let row = 0;
    for (const g of groups) {
        const members = of('DObject').filter(g);
        members.forEach((o, i) => out.push([o.name, cname(o.instanceof), o.name, 40 + (i % 8) * 220, 40 + (row + Math.floor(i / 8)) * 120, null]));
        row += Math.ceil(members.length / 8) + 1;
    }
    return out;
}

// ── Page side ────────────────────────────────────────────────────────────────────────────────────────────────────

const PKG = `const pkg = w.LProject.getProject().metamodels[0].packages[0]; const cls = (n) => pkg.classes.find((c) => c.name === n);`;

async function buildMetamodel(page: Page): Promise<string[]> {
    const nm = page.getByText('New metamodel', { exact: true });
    if (await nm.count()) { await nm.first().click(); await page.waitForTimeout(2500); }
    await page.waitForTimeout(1500);
    await ev(page, `const mm = w.LProject.getProject().metamodels[0]; mm.name = a; mm.packages[0].name = a; return 1;`, MM.name);
    const classes = of('DClass');
    for (const c of classes) await ev(page, `${PKG} pkg.addClass(a); return 1;`, c.name, 250);
    for (const c of classes) {
        if (c.abstract) await ev(page, `${PKG} cls(a).abstract = true; return 1;`, c.name, 200);
        if (c.extends.length) await ev(page, `${PKG} cls(a[0]).extends = a[1].map((s) => cls(s).id); return 1;`, [c.name, c.extends.map(cname)], 250);
    }
    // A feature is added in one call and looked up in the next, after the pause: right after the add, the class's
    // forward collection does not list it yet (the split of uml-class-object-fixture.ts).
    const errors: string[] = [];
    for (const f of of('DAttribute')) {
        if (!PRIMITIVES.has(f.type)) { errors.push(`${f.id}: type ${f.type}`); continue; }
        await ev(page, `${PKG} cls(a.owner).addAttribute(a.name, a.type); return 1;`, { owner: cname(f.father), name: f.name, type: f.type }, 400);
        const r = await ev<string>(page, `${PKG} const at = cls(a.owner).attributes.find((x) => x.name === a.name); if (!at) return 'missing';
            at.lowerBound = a.lower; at.upperBound = a.upper; return 'ok';`,
            { owner: cname(f.father), name: f.name, lower: f.lowerBound, upper: f.upperBound }, 200);
        if (r !== 'ok') errors.push(`${f.id}: ${r}`);
    }
    for (const f of of('DReference')) {
        await ev(page, `${PKG} cls(a.owner).addReference(a.name, cls(a.type).id); return 1;`, { owner: cname(f.father), name: f.name, type: cname(f.type) }, 400);
        const r = await ev<string>(page, `${PKG} const x = cls(a.owner).references.find((y) => y.name === a.name); if (!x) return 'missing';
            if (a.comp) x.composition = true; x.lowerBound = a.lower; x.upperBound = a.upper; return 'ok';`,
            { owner: cname(f.father), name: f.name, comp: f.composition, lower: f.lowerBound, upper: f.upperBound }, 250);
        if (r !== 'ok') errors.push(`${f.id}: ${r}`);
    }
    return errors;
}

/** The metamodel as the store holds it, in the spec's terms: one line per class and per feature. */
const READ_METAMODEL = `const idl = w.store.getState().idlookup; const pkg = w.LProject.getProject().metamodels[0].packages[0];
    return { mm: w.LProject.getProject().metamodels[0].name, lines: pkg.classes.flatMap((c) => [
        'class ' + c.name + (c.abstract ? ' abstract' : '') + ' extends [' + c.extends.map((e) => e.name).join(',') + ']',
        ...[...c.attributes, ...c.references].map((f) => c.name + '.' + f.name + ' : ' + (idl[f.id].type ?? '?') + ' '
            + idl[f.id].lowerBound + '..' + idl[f.id].upperBound + (idl[f.id].composition ? ' contains' : '')),
    ]) };`;

function expectedMetamodel(): string[] {
    const classId = (n: string) => `@${n}`;
    return of('DClass').flatMap(c => [
        `class ${c.name}${c.abstract ? ' abstract' : ''} extends [${c.extends.map(cname).join(',')}]`,
        ...Object.values(lookup).filter(d => (d.className === 'DAttribute' || d.className === 'DReference') && d.father === c.id)
            .map(f => `${c.name}.${f.name} : ${f.className === 'DReference' ? classId(cname(f.type)) : f.type} ${f.lowerBound}..${f.upperBound}${f.composition ? ' contains' : ''}`),
    ]);
}

/** Every object of the model with its class and slots, from the D-layer, references as object names. */
const READ_MODEL = `const idl = w.store.getState().idlookup; const m = w.LProject.getProject().models[0];
    const under = (id) => { let d = idl[id]; for (let i = 0; d && i < 40; i++) { if (d.id === m.id) return true; d = idl[d.father]; } return false; };
    const out = {};
    for (const o of Object.values(idl).filter((d) => d && d.className === 'DObject' && under(d.id))) {
        const f = {};
        for (const vid of o.features || []) {
            const d = idl[vid]; const fd = idl[d.instanceof];
            f[fd.name] = (d.values || []).filter((x) => x !== undefined && x !== null && x !== '').map((x) => fd.className === 'DReference' ? (idl[x] ? idl[x].name : '?' + x) : x);
        }
        out[o.name] = { cls: idl[o.instanceof].name, f: Object.fromEntries(Object.entries(f).sort(([a], [b]) => (a < b ? -1 : 1))) };
    }
    return { model: m.name, objects: out };`;

/** Navbar's File → «Download Project», the entry a user clicks (Navbar.tsx, `name: 'Download Project'`). */
const DOWNLOAD_ENTRY = String.raw`(() => {
  const li = [...document.querySelectorAll('li')].find((l) => { const s = l.querySelector(':scope > label span span'); return s && s.textContent.trim() === 'Download Project'; });
  if (!li) return false;
  li.click();
  return true;
})()`;

async function build(): Promise<void> {
    const browser = await chromium.launch();
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, acceptDownloads: true });
    await ctx.addInitScript(() => { (globalThis as any).__name = (f: any) => f; });
    await seed(ctx, true);
    const page = await ctx.newPage();
    const errors: string[] = [];
    page.on('pageerror', (e: Error) => errors.push('pageerror: ' + e.message));
    try {
        const pid = await createProject(page, PROJECT);
        check('a new project', !!pid, String(pid));
        if (!pid) return;
        await page.goto(`${URL}/?open=${encodeURIComponent(pid)}#/project?id=${pid}`, { waitUntil: 'domcontentloaded', timeout: 300000 });
        await poll(page, `!!(window.windoww && window.windoww.store && window.LProject && window.LProject.getProject())`, 120000);
        await page.waitForTimeout(4000);
        await page.addStyleTag({ content: '.notification-widget, .notification-content, .donation-banner { pointer-events: none !important; display: none !important; }' }).catch(() => {});

        const mmErrors = await buildMetamodel(page);
        check('every class and feature of the spec is created', mmErrors.length === 0, mmErrors);
        const mm = await ev<{ mm: string; lines: string[] }>(page, READ_METAMODEL);
        const ids = await ev<Record<string, string>>(page, `const pkg = w.LProject.getProject().metamodels[0].packages[0];
            return Object.fromEntries(pkg.classes.map((c) => [c.id, '@' + c.name]));`);
        const got = mm.lines.map(l => l.replace(/ : (\S+) /, (_s, t: string) =>` : ${ids[t] ?? t} `)).sort();
        check(`the metamodel ${MM.name} is the spec's, class by class and feature by feature`,
            mm.mm === MM.name && JSON.stringify(got) === JSON.stringify(expectedMetamodel().sort()),
            { name: mm.mm, extra: got.filter(l => !expectedMetamodel().includes(l)), missing: expectedMetamodel().filter(l => !got.includes(l)) });

        const shell = await buildModelShell(page);
        check('a model with its v2-flow graph', !!shell.graphId, shell);
        if (!shell.graphId) return;
        await ev(page, `w.LProject.getProject().models[0].name = a; return 1;`, M.name);
        const plan = layout();
        const made = await buildObjects(page, shell.graphId, plan);
        check(`every object of the spec is created with its vertex (${plan.length})`, Object.keys(made).length === plan.length,
            plan.map(o => o[0]).filter(k => !made[k]));

        // The containment slots by the canvas write path, then the other references, then the attribute slots.
        const want = expected();
        const slots = (kind: 'contains' | 'refers' | 'attr') => of('DValue').filter(v => {
            const f = lookup[v.instanceof];
            if (kind === 'attr') return f.className === 'DAttribute' && v.values.length > 0;
            return f.className === 'DReference' && !!f.composition === (kind === 'contains') && v.values.length > 0;
        });
        // The write path appends to the slot it reads: the next append waits until the store lists this child, or it
        // reads the slot without it and the child is lost (measured: `PC.ports` kept `PC_q` alone).
        const linkErrors: string[] = [];
        for (const v of slots('contains')) for (const child of v.values) {
            const r = await ev<string>(page, `const c2j = await import('/src/components/editor-v2/sync/canvasToJjom.ts');
                if (!c2j.syncCreateCompositionLink(a.pv, a.cv, a.ref)) return 'no edge';
                const has = () => { const idl = w.store.getState().idlookup;
                    const d = (idl[a.po].features || []).map((id) => idl[id]).find((x) => x && idl[x.instanceof].name === a.ref);
                    return !!d && (d.values || []).includes(a.co); };
                for (let i = 0; i < 80 && !has(); i++) await new Promise((res) => setTimeout(res, 50));
                return has() ? 'ok' : 'not in the slot';`,
                { pv: made[v.father].vertex, cv: made[child].vertex, po: made[v.father].obj, co: made[child].obj, ref: lookup[v.instanceof].name }, 250);
            if (r !== 'ok') linkErrors.push(`${v.father}.${lookup[v.instanceof].name} += ${child}: ${r}`);
        }
        check('every containment child is appended to its slot', linkErrors.length === 0, linkErrors);
        for (const v of slots('refers')) for (const target of v.values) {
            const f = lookup[v.instanceof];
            await ev(page, `const c2j = await import('/src/components/editor-v2/sync/canvasToJjom.ts');
                c2j.syncSetReferenceValue(a[0], a[1], a[2], a[3]); return 1;`, [made[v.father].vertex, f.name, made[target].obj, f.upperBound === 1 ? 'replace' : 'append'], 200);
        }
        const attrErrors: string[] = [];
        for (const v of slots('attr')) {
            const r = await ev<string>(page, `try { w.LPointerTargetable.fromPointer(a.obj)['$' + a.f].values = a.values; return 'ok'; }
                catch (e) { return String(e && e.message || e); }`, { obj: made[v.father].obj, f: lookup[v.instanceof].name, values: v.values }, 120);
            if (r !== 'ok') attrErrors.push(`${v.id}: ${r}`);
        }
        check('every attribute slot is written', attrErrors.length === 0, attrErrors);
        await page.waitForTimeout(2000);

        const model = await ev<{ model: string; objects: Record<string, { cls: string; f: Record<string, unknown[]> }> }>(page, READ_MODEL);
        const diff = Object.keys({ ...want, ...model.objects }).filter(n => JSON.stringify(want[n]) !== JSON.stringify(model.objects[n]));
        check(`the model ${M.name} is the spec's, object by object and slot by slot (${Object.keys(want).length} objects)`,
            model.model === M.name && diff.length === 0,
            diff.slice(0, 4).map(n => ({ n, want: want[n], got: model.objects[n] })));

        const renamed = await ev<string>(page, `w.LPointerTargetable.fromPointer(a[0]).name = a[1]; await new Promise((r) => setTimeout(r, 500));
            return w.store.getState().idlookup[a[0]].name;`, [pid, PROJECT]);
        check(`the project is named ${PROJECT}`, renamed === PROJECT, String(renamed));

        // The model's editor once, so its layout is in the store the export serializes.
        await page.evaluate(String.raw`(async () => { const dm = await import('/src/components/abstract/DockManager.tsx'); await dm.default.open2(window.LPointerTargetable.fromPointer(${JSON.stringify(shell.modelId)})); })()`);
        const pane = `(document.querySelector('[role="tabpanel"][aria-labelledby$="-tab-${shell.modelId}"]'))`;
        const nodes = await poll<number>(page, `(() => { const p = ${pane}; return p ? p.querySelectorAll('.react-flow__node').length : 0; })()`, 60000);
        check(`the model's editor shows its nodes`, (nodes ?? 0) > 0, String(nodes));
        await page.waitForTimeout(3000);

        // File → «Download Project»: the app saves the project, then downloads it.
        const download = page.waitForEvent('download', { timeout: 120000 });
        const clicked = await page.evaluate(DOWNLOAD_ENTRY) as boolean;
        check('the Download Project entry of the File menu is clicked', clicked, '');
        if (!clicked) return;
        const file = await download;
        const out = `${DIR}/${NAME}.jjodel`;
        await file.saveAs(out);
        const text = readFileSync(out, 'utf8');
        let parsed: Record<string, any> | null = null;
        try { parsed = JSON.parse(text); } catch { parsed = null; }
        check(`the download, ${file.suggestedFilename()}, is a project file`,
            !!parsed && typeof parsed.state === 'string' && parsed.state.length > 0 && parsed.name === PROJECT && file.suggestedFilename().endsWith('.jjodel'),
            `${out} ${statSync(out).size} bytes`);
        check('no page error', errors.length === 0, errors.slice(0, 3));
    } finally {
        await ctx.close();
        await browser.close();
    }
}

await build();
console.log(`${failures === 0 ? 'ALL GREEN' : `${failures} FAILED`}  (${DIR})`);
process.exit(failures === 0 ? 0 : 1);
