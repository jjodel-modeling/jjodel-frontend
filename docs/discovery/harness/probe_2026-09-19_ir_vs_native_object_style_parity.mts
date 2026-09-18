/**
 * probe_2026-09-19_ir_vs_native_object_style_parity — verification probe for Fase 2/S2
 * (P-2026-09-18-2219): real getComputedStyle numbers for TWO M1 object-instance nodes
 * (one metaclass WITH an attribute, one WITHOUT any), each rendered two ways (native
 * ObjectNode default branch vs a fresh IR-native vertex view seeded exactly as the
 * CURRENT `defaultObjectViewIR()` — cornerRadius, border, label style, separator-color
 * reuse), in light and dark theme.
 *
 * Adapted from `probe_2026-09-18_ir_vs_native_object_style.mts` (Fase 1). Two differences:
 *   1. the `ir` literal installed here matches the seed AFTER this segment's three edits,
 *      not the Fase 1 seed (which had no cornerRadius/border/label style);
 *   2. a second metaclass with zero attributes is built and measured alongside the
 *      one-attribute metaclass, so the zero-attribute compartment-suppression parity
 *      (Finding 2, corrected) is re-confirmed on the current code, not assumed.
 *
 * Throwaway measurement probe, not a regression test: no assertions, only MISURA lines.
 *
 * Run (dev server up on :3001, from frontend/):
 *   cd frontend && npx tsx ../docs/discovery/harness/probe_2026-09-19_ir_vs_native_object_style_parity.mts
 */
import playwright from '../../../frontend/node_modules/@playwright/test/index.js';
const { chromium } = playwright as unknown as typeof import('@playwright/test');
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { NAV_MS, SETTLE_MS, BOOT_MS, seed } from '../../../frontend/scripts/smoke/states.ts';

// states.ts's own BASE_URL is hardcoded to :3000; :3000 belongs to a different worktree's
// dev server in this session, so this worktree's vite bound :3001 instead. Confirmed live
// (curl 200) immediately before writing this probe.
const BASE = 'http://localhost:3001';

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
const shot = (n: string) => resolve(HERE, `_tmp_irparity_${n}.png`); // non committati

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
const pid = await myCreateProject(page, `Smoke_IRParity_${Date.now()}`);
if (!pid) { console.log('FIXTURE FAILED: createProject'); await browser.close(); process.exit(1); }
await page.goto(`${BASE}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(NAV_MS + SETTLE_MS);

/** M2: DUE classi — Widget (un attributo) ed Empty (zero attributi). M1: un'istanza per ciascuna. */
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
        const lEmpty = w.LClass.fromD(lPkg.addClass('Empty'));
        w.DVertex.new(lEmpty.id, dG2.id);

        const dM1 = w.DModel.new('ProbeM1', dM2.id, false, true);
        const dG1 = w.DGraph.new(0, dM1.id);
        w.SetFieldAction.new(dG1.id, 'graphStyle', 'v2-flow', '', false);
        w.SetFieldAction.new(project.id, 'models', dM1.id, '+=', true);
        w.SetRootFieldAction.new('graphs', dG1.id, '+=', true);
        w.SetFieldAction.new(project.id, 'graphs', dG1.id, '+=', true);
        return { ok: true, m1: dM1.id, clsWidget: lWidget.id, clsEmpty: lEmpty.id, g1: dG1.id };
    } catch (e) { return { ok: false, error: e instanceof Error ? `${e.message}\n${e.stack}` : String(e) }; }
});
if (!built.ok) { fail('fixture M2/M1', built); await browser.close(); process.exit(1); }
note('fixture M2/M1', built);
await page.waitForTimeout(2500);

const made = await page.evaluate(async (a: { m1: string; clsWidget: string; clsEmpty: string }) => {
    const w = window as any;
    try {
        w.DObject.new(a.clsWidget, a.m1, w.DModel, 'w1', true);
        w.DObject.new(a.clsEmpty, a.m1, w.DModel, 'e1', true);
        await new Promise(r => setTimeout(r, 2000));
        const lModel = w.LPointerTargetable.fromD(a.m1);
        const ow = lModel.objects.find((x: any) => x.name === 'w1');
        const oe = lModel.objects.find((x: any) => x.name === 'e1');
        if (!ow) return { ok: false, error: 'oggetto w1 non trovato' };
        if (!oe) return { ok: false, error: 'oggetto e1 non trovato' };
        ow['$label'].value = 'hello';
        return { ok: true, widgetObjId: ow.id as string, emptyObjId: oe.id as string };
    } catch (e) { return { ok: false, error: e instanceof Error ? e.message : String(e) }; }
}, { m1: built.m1, clsWidget: built.clsWidget, clsEmpty: built.clsEmpty });
if (!made.ok) { fail('creazione istanze', made); await browser.close(); process.exit(1); }
note('istanze create', made);
await page.waitForTimeout(2500);

// ── apre il canvas del modello M1 (v2-flow), cosi' useJjomSync monta e crea i DVertex ──
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

async function findVertex(objId: string, label: string): Promise<string> {
    let vid = await vertexOf(objId);
    if (!vid) {
        await page.waitForTimeout(3000);
        vid = await vertexOf(objId);
    }
    if (!vid) {
        const dumpLookup = await page.evaluate(() => {
            const lookup = (window as any).store.getState().idlookup ?? {};
            return Object.keys(lookup).filter(id => lookup[id]?.className === 'DVertex').map(id => ({ id, model: lookup[id].model }));
        });
        fail(`nessun DVertex trovato per ${label}`, { objId, vertices: dumpLookup });
        await browser.close();
        process.exit(1);
    }
    return vid;
}

const vidWidget = await findVertex(made.widgetObjId, 'w1 (Widget)');
const vidEmpty = await findVertex(made.emptyObjId, 'e1 (Empty)');
note('vertici trovati', { vidWidget, vidEmpty });

// ── helper di misura — tollerano compartimento assente (Empty non ne ha) ───────────────
type StyleDump = Record<string, any> | { error: string; html?: string };

const measureCaseA = (v: string): Promise<StyleDump> => page.evaluate((vid: string) => {
    const scope = document.querySelector(`.react-flow__node[data-id="${vid}"]`);
    if (!scope) return { error: 'no react-flow node' };
    const container = scope.querySelector('.mm-node.mm-object');
    const name = scope.querySelector('.mm-object__name');
    const header = scope.querySelector('.mm-object__header');
    const compartment = scope.querySelector('.mm-object__compartment');
    if (!container || !name || !header) return { error: 'missing element', html: scope.outerHTML };
    const cs = (el: Element) => getComputedStyle(el);
    const c = cs(container), n = cs(name), h = cs(header);
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
        compartmentPresent: !!compartment,
        compartment: compartment ? (() => {
            const k = cs(compartment);
            return {
                minHeight: k.minHeight, rectHeight: compartment.getBoundingClientRect().height,
                backgroundColor: k.backgroundColor,
                paddingTop: k.paddingTop, paddingRight: k.paddingRight, paddingBottom: k.paddingBottom, paddingLeft: k.paddingLeft,
            };
        })() : null,
    };
}, v);

const measureCaseB = (v: string): Promise<StyleDump> => page.evaluate((vid: string) => {
    const scope = document.querySelector(`.react-flow__node[data-id="${vid}"]`);
    if (!scope) return { error: 'no react-flow node' };
    const container = scope.querySelector('.ir-node-content');
    const name = scope.querySelector('.ir-label--top');
    const compartment = scope.querySelector('.ir-compartment');
    if (!container || !name) return { error: 'missing element', html: scope.outerHTML };
    const cs = (el: Element) => getComputedStyle(el);
    const c = cs(container), n = cs(name);
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
        // del compartimento stesso — assente quando il compartimento e' assente (Empty).
        compartmentPresent: !!compartment,
        header: compartment ? (() => {
            const k = cs(compartment);
            return { borderTopWidth: k.borderTopWidth, borderTopColor: k.borderTopColor };
        })() : null,
        compartment: compartment ? (() => {
            const k = cs(compartment);
            return {
                minHeight: k.minHeight, rectHeight: compartment.getBoundingClientRect().height,
                backgroundColor: k.backgroundColor,
                paddingTop: k.paddingTop, paddingRight: k.paddingRight, paddingBottom: k.paddingBottom, paddingLeft: k.paddingLeft,
            };
        })() : null,
    };
}, v);

const setTheme = (theme: 'light' | 'dark') => page.evaluate((t: string) => {
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('theme', t);
    window.dispatchEvent(new CustomEvent('jjodel:theme-changed', { detail: t }));
}, theme);

// ── Case A (nativo): Widget e Empty, light poi dark ─────────────────────────────────────
await setTheme('light');
await page.waitForTimeout(400);
note('Case A / Widget / light', await measureCaseA(vidWidget));
note('Case A / Empty / light', await measureCaseA(vidEmpty));
await page.screenshot({ path: shot('a_light') });

await setTheme('dark');
await page.waitForTimeout(400);
note('Case A / Widget / dark', await measureCaseA(vidWidget));
note('Case A / Empty / dark', await measureCaseA(vidEmpty));
await page.screenshot({ path: shot('a_dark') });

// ── installa la view IR corrente (cornerRadius + border + label style) ─────────────────
const viewResult = await page.evaluate(async () => {
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
            shape: {
                form: 'rect',
                cornerRadius: 8,
                border: { color: 'var(--color-inode-border)', width: 1, style: 'solid' },
                labels: [{
                    position: 'top',
                    source: { from: 'intrinsic', prop: 'qualifiedName' },
                    style: { fontSize: 14, underline: true },
                }],
            },
            fieldCompartments: [{
                id: 'attributes', source: { from: 'attributes' },
                rowFormat: { segments: [{ kind: 'name' }, { kind: 'literal', text: ' = ' }, { kind: 'value' }] },
                separator: true,
            }],
        };
        const vid2 = 'Pointer_ProbeIRObjectViewParity';
        const existing = W.store.getState().idlookup[vid2];
        if (existing) { W.SetFieldAction.new(vid2, 'ir', ir, '', true); return { ok: true, mode: 'riscritta' }; }
        W.DViewElement.new2('Probe IR Object View Parity', '', vp, (dd: any) => {
            dd.appliableToClasses = ['DObject'];
            dd.appliableTo = 'Vertex';
            dd.ir = ir;
        }, true, vid2);
        return { ok: true, mode: 'installata' };
    } catch (e) { return { ok: false, error: e instanceof Error ? `${e.message}\n${e.stack}` : String(e) }; }
});
note('installazione view IR', viewResult);
if (!viewResult.ok) { fail('installazione view IR', viewResult); await browser.close(); process.exit(1); }
await page.waitForTimeout(3000);

// ── Case B (IR): Widget e Empty, light poi dark ─────────────────────────────────────────
await setTheme('light');
await page.waitForTimeout(400);
note('Case B / Widget / light', await measureCaseB(vidWidget));
note('Case B / Empty / light', await measureCaseB(vidEmpty));
await page.screenshot({ path: shot('b_light') });

await setTheme('dark');
await page.waitForTimeout(400);
note('Case B / Widget / dark', await measureCaseB(vidWidget));
note('Case B / Empty / dark', await measureCaseB(vidEmpty));
await page.screenshot({ path: shot('b_dark') });

note('page errors', errors);
console.log('\n== FINE MISURA ==');
await browser.close();
process.exit(0);
