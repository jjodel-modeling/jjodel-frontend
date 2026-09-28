/**
 * probe_2026-09-18_ir_vs_native_object_style — real getComputedStyle numbers for an M1
 * object-instance node rendered two ways (native ObjectNode default branch vs a fresh
 * IR-native vertex view seeded exactly as `defaultObjectViewIR()`), in light and dark theme.
 *
 * Throwaway measurement probe, not a regression test: no assertions, only MISURA lines.
 * Pattern copied from `probe_2026-09-03_rvp_slice1_manager_columns.mts` (Playwright default
 * import trick, states.ts bootstrap, viewpoint-activation gotcha, DViewElement.new2 call
 * shape) and from `probe_2026-09-09_book53_conformance.mts` (DockManager.open2, the
 * DVertex-by-object-id scan via idlookup).
 *
 * Run (dev server up, from frontend/):
 *   cd frontend && npx tsx ../docs/discovery/harness/probe_2026-09-18_ir_vs_native_object_style.mts
 */
import playwright from '../../../frontend/node_modules/@playwright/test/index.js';
const { chromium } = playwright as unknown as typeof import('@playwright/test');
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { NAV_MS, SETTLE_MS, BOOT_MS, seed } from '../../../frontend/scripts/smoke/states.ts';

// states.ts's own BASE_URL is hardcoded to :3000, and :3000 in this session belongs to a
// DIFFERENT worktree's dev server (another repo state entirely) — port 3000 was occupied
// when this probe's server started, so vite bound :3001 instead (confirmed via its own
// stdout: "Port 3000 is in use, trying another one... Local: http://localhost:3001/").
// Using the imported BASE_URL (or the imported createProject, which closes over it) would
// silently drive the WRONG process. Local override instead, states.ts left untouched.
const BASE = 'http://localhost:3001';

/** states.ts createProject(), parameterized on BASE instead of closing over its own constant. */
async function myCreateProject(page: any, name: string): Promise<string | null> {
    await page.goto(`${BASE}/#/allProjects`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(BOOT_MS);
    await page.locator('button', { hasText: 'New Project' }).first().click();
    await page.waitForTimeout(1200);
    await page.locator('input[type="text"]').first().fill(name);
    await page.locator('button', { hasText: /^Create/ }).last().click();
    await page.waitForTimeout(5000);
    return await page.evaluate(() => {
        const raw = localStorage.getItem('projects');
        if (!raw) return null;
        const arr = JSON.parse(raw) as Array<{ id: string }>;
        return arr.length ? arr[arr.length - 1].id : null;
    });
}

const HERE = dirname(fileURLToPath(import.meta.url));
const shot = (n: string) => resolve(HERE, `_tmp_irstyle_${n}.png`); // non committati

const note = (label: string, d: unknown) =>
    console.log(`  MISURA  ${label}\n        ${typeof d === 'string' ? d : JSON.stringify(d)}`);
const fail = (label: string, d: unknown) => {
    console.log(`  BLOCCO  ${label}\n        ${typeof d === 'string' ? d : JSON.stringify(d)}`);
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1700, height: 1000 } });
await ctx.addInitScript(() => { (window as any).__name = (f: any) => f; });
await seed(ctx, true);
const page = await ctx.newPage();
const errors: string[] = [];
page.on('pageerror', (e) => errors.push(e.message));

await page.goto(`${BASE}/all-projects`, { waitUntil: 'domcontentloaded', timeout: NAV_MS });
await page.waitForTimeout(SETTLE_MS);
const pid = await myCreateProject(page, `Smoke_IRStyle_${Date.now()}`);
if (!pid) { console.log('FIXTURE FAILED: createProject'); await browser.close(); process.exit(1); }
await page.goto(`${BASE}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(NAV_MS + SETTLE_MS);

/** M2: una classe, UN attributo (il compartimento sparisce del tutto a zero attributi —
 *  misurato in un giro precedente). M1: un'istanza di quella classe. */
const built = await page.evaluate(async () => {
    const w = window as any;
    try {
        const project = w.LProject.getProject();
        if (!project) return { ok: false, error: 'no project' };
        const dM2 = w.DModel.new('ProbeM2', undefined, true);
        const lM2 = w.LModel.fromD(dM2);
        const dG2 = w.DGraph.new(0, dM2.id);
        w.SetFieldAction.new(project.id, 'metamodels', lM2.id, '+=', true);
        w.SetFieldAction.new(project.id, 'graphs', dG2.id, '+=', true);
        w.SetFieldAction.new(dG2.id, 'graphStyle', 'v2-flow', '', false);

        const dPkg = lM2.addChild('package');
        const lPkg = w.LPackage.fromD(dPkg);
        lPkg.name = 'probe';
        const lWidget = w.LClass.fromD(lPkg.addClass('Widget'));
        lWidget.addAttribute('label', 'Pointer_ESTRING');
        w.DVertex.new(lWidget.id, dG2.id);

        const dM1 = w.DModel.new('ProbeM1', dM2.id, false, true);
        const dG1 = w.DGraph.new(0, dM1.id);
        w.SetFieldAction.new(dG1.id, 'graphStyle', 'v2-flow', '', false);
        w.SetFieldAction.new(project.id, 'models', dM1.id, '+=', true);
        w.SetRootFieldAction.new('graphs', dG1.id, '+=', true);
        w.SetFieldAction.new(project.id, 'graphs', dG1.id, '+=', true);
        return { ok: true, m1: dM1.id, cls: lWidget.id, g1: dG1.id };
    } catch (e) { return { ok: false, error: e instanceof Error ? `${e.message}\n${e.stack}` : String(e) }; }
});
if (!built.ok) { fail('fixture M2/M1', built); await browser.close(); process.exit(1); }
note('fixture M2/M1', built);
await page.waitForTimeout(2500);

const made = await page.evaluate(async (a: { m1: string; cls: string }) => {
    const w = window as any;
    try {
        w.DObject.new(a.cls, a.m1, w.DModel, 'w1', true);
        await new Promise(r => setTimeout(r, 2000));
        const lModel = w.LPointerTargetable.fromD(a.m1);
        const o = lModel.objects.find((x: any) => x.name === 'w1');
        if (!o) return { ok: false, error: 'oggetto w1 non trovato' };
        o['$label'].value = 'hello';
        return { ok: true, objId: o.id as string };
    } catch (e) { return { ok: false, error: e instanceof Error ? e.message : String(e) }; }
}, { m1: built.m1, cls: built.cls });
if (!made.ok) { fail('creazione istanza', made); await browser.close(); process.exit(1); }
note('istanza creata', made);
await page.waitForTimeout(2500);

// ── apre il canvas del modello M1 (v2-flow), cosi' useJjomSync monta e crea il DVertex ──
await page.evaluate(async (m: string) => {
    const w = window as any;
    await w.DockManager.open2(w.LPointerTargetable.fromPointer(m));
}, built.m1);
await page.waitForTimeout(NAV_MS + SETTLE_MS);

const autoLayout = async () => {
    const b = page.locator('button[title="Auto layout"]:visible');
    if (await b.count()) { await b.first().click(); await page.waitForTimeout(SETTLE_MS * 2); }
};
await autoLayout();

const vertexOf = (objId: string) => page.evaluate((oid: string) => {
    const lookup = (window as any).store.getState().idlookup ?? {};
    for (const id in lookup) {
        const e = lookup[id];
        if (e?.className === 'DVertex' && e.model === oid) return id;
    }
    return null;
}, objId);

let vid = await vertexOf(made.objId);
if (!vid) {
    // seconda chance: forse il sync non aveva ancora scritto al primo giro
    await page.waitForTimeout(3000);
    vid = await vertexOf(made.objId);
}
if (!vid) {
    const dumpLookup = await page.evaluate(() => {
        const lookup = (window as any).store.getState().idlookup ?? {};
        return Object.keys(lookup).filter(id => lookup[id]?.className === 'DVertex').map(id => ({ id, model: lookup[id].model }));
    });
    fail('nessun DVertex trovato per l\'oggetto', { objId: made.objId, vertices: dumpLookup });
    await browser.close();
    process.exit(1);
}
note('vertice trovato', { vid, objId: made.objId });

// ── conferma live del DOM (non si indovina il selettore) ────────────────────────────
const dumpNode = (sel: string) => page.evaluate((s: string) => {
    const el = document.querySelector(s);
    return el ? el.outerHTML : null;
}, sel);

const html = await dumpNode(`.react-flow__node[data-id="${vid}"]`);
if (!html) {
    fail('nessun nodo React Flow per il vertice', { vid });
    await page.screenshot({ path: shot('no_rf_node') });
    await browser.close();
    process.exit(1);
}
note('nodo React Flow (Case A, prima misura)', html);

// ── helper di misura ─────────────────────────────────────────────────────────────────
type StyleDump = Record<string, any> | { error: string; html?: string };

const measureCaseA = (v: string): Promise<StyleDump> => page.evaluate((vid: string) => {
    const scope = document.querySelector(`.react-flow__node[data-id="${vid}"]`);
    if (!scope) return { error: 'no react-flow node' };
    const container = scope.querySelector('.mm-node.mm-object');
    const name = scope.querySelector('.mm-object__name');
    const header = scope.querySelector('.mm-object__header');
    const compartment = scope.querySelector('.mm-object__compartment');
    if (!container || !name || !header || !compartment) {
        return { error: 'missing element', html: scope.outerHTML };
    }
    const cs = (el: Element) => getComputedStyle(el);
    const c = cs(container), n = cs(name), h = cs(header), k = cs(compartment);
    return {
        container: {
            borderTopWidth: c.borderTopWidth, borderRightWidth: c.borderRightWidth,
            borderBottomWidth: c.borderBottomWidth, borderLeftWidth: c.borderLeftWidth,
            borderTopColor: c.borderTopColor, borderColor: c.borderColor,
            borderRadius: c.borderRadius, backgroundColor: c.backgroundColor,
            paddingTop: c.paddingTop, paddingRight: c.paddingRight, paddingBottom: c.paddingBottom, paddingLeft: c.paddingLeft,
        },
        name: {
            fontSize: n.fontSize, fontWeight: n.fontWeight,
            textDecorationLine: n.textDecorationLine, textDecorationColor: n.textDecorationColor,
            textDecorationStyle: n.textDecorationStyle, textDecorationThickness: n.textDecorationThickness,
            textUnderlineOffset: n.textUnderlineOffset,
        },
        header: { borderBottomWidth: h.borderBottomWidth, borderBottomColor: h.borderBottomColor },
        compartment: {
            minHeight: k.minHeight, rectHeight: compartment.getBoundingClientRect().height,
            backgroundColor: k.backgroundColor,
            paddingTop: k.paddingTop, paddingRight: k.paddingRight, paddingBottom: k.paddingBottom, paddingLeft: k.paddingLeft,
        },
    };
}, v);

const measureCaseB = (v: string): Promise<StyleDump> => page.evaluate((vid: string) => {
    const scope = document.querySelector(`.react-flow__node[data-id="${vid}"]`);
    if (!scope) return { error: 'no react-flow node' };
    const container = scope.querySelector('.ir-node-content');
    const name = scope.querySelector('.ir-label--top');
    const compartment = scope.querySelector('.ir-compartment');
    if (!container || !name || !compartment) {
        return { error: 'missing element', html: scope.outerHTML };
    }
    const cs = (el: Element) => getComputedStyle(el);
    const c = cs(container), n = cs(name), k = cs(compartment);
    return {
        container: {
            borderTopWidth: c.borderTopWidth, borderRightWidth: c.borderRightWidth,
            borderBottomWidth: c.borderBottomWidth, borderLeftWidth: c.borderLeftWidth,
            borderTopColor: c.borderTopColor, borderColor: c.borderColor,
            borderRadius: c.borderRadius, backgroundColor: c.backgroundColor,
            paddingTop: c.paddingTop, paddingRight: c.paddingRight, paddingBottom: c.paddingBottom, paddingLeft: c.paddingLeft,
        },
        name: {
            fontSize: n.fontSize, fontWeight: n.fontWeight,
            textDecorationLine: n.textDecorationLine, textDecorationColor: n.textDecorationColor,
            textDecorationStyle: n.textDecorationStyle, textDecorationThickness: n.textDecorationThickness,
            textUnderlineOffset: n.textUnderlineOffset,
        },
        // niente header separato per la IR branch: la riga di separazione e' il border-top
        // del compartimento stesso (irStyle.ts riga 52) — misurata qui, non su un div a parte.
        header: { borderTopWidth: k.borderTopWidth, borderTopColor: k.borderTopColor },
        compartment: {
            minHeight: k.minHeight, rectHeight: compartment.getBoundingClientRect().height,
            backgroundColor: k.backgroundColor,
            paddingTop: k.paddingTop, paddingRight: k.paddingRight, paddingBottom: k.paddingBottom, paddingLeft: k.paddingLeft,
        },
    };
}, v);

// ThemeService.apply() (services/ThemeService.ts) does THREE things: set the attribute,
// write localStorage, AND dispatch 'jjodel:theme-changed' (JjodelEvents.THEME_CHANGED).
// EditorV2.tsx reads theme via useTheme(), which updates React state ONLY on that event
// (data-theme attribute alone does not re-render it), and feeds it into the
// `editor-v2 theme-${theme} ...` className (EditorV2.tsx:4222) that gates the SCSS-map
// tokens in _themes.scss (--node-bg / --border-default among them, D-UI-10 comment at
// _themes.scss:9-16). Replicating only the first two statements (first pass of this probe)
// left that class frozen at mount, so Case B's --node-bg/--border-default never switched —
// a probe artifact, not a product bug. All three replicated here.
const setTheme = (theme: 'light' | 'dark') => page.evaluate((t: string) => {
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('theme', t);
    window.dispatchEvent(new CustomEvent('jjodel:theme-changed', { detail: t }));
}, theme);

// ── Case A: light poi dark ────────────────────────────────────────────────────────────
await setTheme('light');
await page.waitForTimeout(400);
const aLight = await measureCaseA(vid);
note('Case A light', aLight);
await page.screenshot({ path: shot('a_light') });

await setTheme('dark');
await page.waitForTimeout(400);
const aDark = await measureCaseA(vid);
note('Case A dark', aDark);
await page.screenshot({ path: shot('a_dark') });

// ── installa la view IR (fresca, senza migratedFrom: niente delega a isMigratedDefaultView) ──
const viewResult = await page.evaluate(async (a: { cls: string }) => {
    const w = window as any;
    const W: any = w.windoww ?? w;
    try {
        const state = W.store.getState();
        let vp = state.viewpoint;
        if (!vp) {
            const l = state.idlookup;
            vp = Object.keys(l).find((id: string) => l[id]?.className === 'DViewPoint') ?? null;
            if (!vp) return { ok: false, error: 'nessun viewpoint' };
            const projectId = w.LProject.getProject()?.__raw?.id;
            if (projectId) W.SetFieldAction.new(projectId, 'activeViewpoint', vp, '', true);
            W.SetRootFieldAction.new('viewpoint', vp, '', true);
        }
        const ir: any = {
            irVersion: 'ir-1.2', kind: 'vertex', metaclasses: '*', priority: 0, exclusive: true,
            label: 'Object (IR default)',
            shape: { form: 'rect', labels: [{ position: 'top', source: { from: 'intrinsic', prop: 'qualifiedName' } }] },
            fieldCompartments: [{
                id: 'attributes', source: { from: 'attributes' },
                rowFormat: { segments: [{ kind: 'name' }, { kind: 'literal', text: ' = ' }, { kind: 'value' }] },
                separator: true,
            }],
        };
        const vid2 = 'Pointer_ProbeIRObjectView';
        const existing = W.store.getState().idlookup[vid2];
        if (existing) { W.SetFieldAction.new(vid2, 'ir', ir, '', true); return { ok: true, mode: 'riscritta' }; }
        W.DViewElement.new2('Probe IR Object View', '', vp, (dd: any) => {
            dd.appliableToClasses = ['DObject'];
            dd.appliableTo = 'Vertex';
            dd.ir = ir;
        }, true, vid2);
        return { ok: true, mode: 'installata' };
    } catch (e) { return { ok: false, error: e instanceof Error ? `${e.message}\n${e.stack}` : String(e) }; }
}, { cls: built.cls });
note('installazione view IR', viewResult);
if (!viewResult.ok) { fail('installazione view IR', viewResult); await browser.close(); process.exit(1); }
await page.waitForTimeout(3000);

const htmlAfterIR = await dumpNode(`.react-flow__node[data-id="${vid}"]`);
note('nodo React Flow dopo installazione view IR', htmlAfterIR);

// ── Case B: light poi dark ────────────────────────────────────────────────────────────
await setTheme('light');
await page.waitForTimeout(400);
const bLight = await measureCaseB(vid);
note('Case B light', bLight);
await page.screenshot({ path: shot('b_light') });

await setTheme('dark');
await page.waitForTimeout(400);
const bDark = await measureCaseB(vid);
note('Case B dark', bDark);
await page.screenshot({ path: shot('b_dark') });

note('page errors', errors);
console.log('\n== FINE MISURA ==');
await browser.close();
process.exit(0);
