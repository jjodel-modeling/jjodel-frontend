/**
 * probe_2026-09-04_rdmv_sliceC_singleton_read — R-DMV slice C:
 * il Data Manager legge dal SINGLETON, non dal viewpoint attivo.
 *
 * Sorella di `probe_2026-09-03_rvp_slice1_manager_columns.mts`, di cui riusa la
 * fixture e le due lezioni misurate li' (viewpoint attivo da attivare a mano;
 * `Literal` e non stringa nuda nei predicati). Qui la domanda e' diversa e piu'
 * stretta: la stessa chiave `table.columns`, scritta in DUE viewpoint diversi,
 * deve avere effetto da uno solo.
 *
 * ── I tre blocchi ─────────────────────────────────────────────────────────────
 *
 *  A. SINGLETON ASSENTE — la tabella e' identica a oggi (R-VP-4). E' il controllo
 *     che ogni progetto salvato si apre invariato: nessuno ha mai scritto la chiave.
 *
 *  B. LA VIEW STA NEL VIEWPOINT ATTIVO — e NON deve piu' ordinare niente. Prima di
 *     questa slice ordinava: e' esattamente la lettura che R-DMV-1 toglie. Il blocco
 *     e' un NEGATIVO, e da solo non distinguerebbe «legge dal singleton» da «non
 *     legge piu' niente» — per questo esiste C.
 *
 *  C. LA VIEW STA NEL SINGLETON — e ordina. Con B rosso e C verde la catena e'
 *     dimostrata in entrambe le direzioni; con B verde e C verde non si sarebbe
 *     misurato nulla.
 *
 * Il singleton si crea A MANO, come lo creera' la slice D alla prima scrittura:
 * `DViewPoint.newVP(nome, cb, true, 'Pointer_ViewPointDataManager')` con
 * `viewpointType = 'dataManager'` nel callback, senza TRANSACTION esterna
 * (CLAUDE.md §3.3) e senza passare per lo switch di `handleCreateViewpoint`, che
 * spegnerebbe `isExclusiveView`. Che resti acceso e' asserito in C0.
 *
 * Con il dev server su (P8: porta 3000, non 3001):
 *   cd frontend && npx tsx ../docs/discovery/harness/probe_2026-09-04_rdmv_sliceC_singleton_read.mts
 *
 * Gli screenshot finiscono accanto alla sonda (`_tmp_*`), non committati.
 */
import playwright from '../../../frontend/node_modules/@playwright/test/index.js';
const { chromium } = playwright as unknown as typeof import('@playwright/test');
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { BASE_URL, NAV_MS, SETTLE_MS, createProject, seed } from '../../../frontend/scripts/smoke/states.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const shot = (n: string) => resolve(HERE, `_tmp_rdmvC_${n}.png`);

let pass = 0, fail = 0;
const check = (label: string, ok: boolean, detail: string) => {
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}\n        ${detail}`);
    ok ? pass++ : fail++;
};
const note = (label: string, d: unknown) =>
    console.log(`  MISURA  ${label}\n        ${typeof d === 'string' ? d : JSON.stringify(d)}`);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1700, height: 1000 } });
await ctx.addInitScript(() => { (window as any).__name = (f: any) => f; });
await seed(ctx, true);
const page = await ctx.newPage();
const errors: string[] = [];
const warns: string[] = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'warning') warns.push(m.text()); });

await page.goto(`${BASE_URL}/all-projects`, { waitUntil: 'domcontentloaded', timeout: NAV_MS });
await page.waitForTimeout(SETTLE_MS);
const pid = await createProject(page, `Smoke_RDMVC_${Date.now()}`);
if (!pid) { console.log('FIXTURE FAILED: createProject'); await browser.close(); process.exit(1); }
await page.goto(`${BASE_URL}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(NAV_MS + SETTLE_MS);

const built = await page.evaluate(async () => {
    const w = window as any;
    try {
        const project = w.LProject.getProject();
        if (!project) return { ok: false, error: 'no project' };
        const dM2 = w.DModel.new('DmvM2', undefined, true);
        const lM2 = w.LModel.fromD(dM2);
        const dG2 = w.DGraph.new(0, dM2.id);
        w.SetFieldAction.new(project.id, 'metamodels', lM2.id, '+=', true);
        w.SetFieldAction.new(project.id, 'graphs', dG2.id, '+=', true);
        w.SetFieldAction.new(dG2.id, 'graphStyle', 'v2-flow', '', false);

        const dPkg = lM2.addChild('package');
        const lPkg = w.LPackage.fromD(dPkg);
        lPkg.name = 'dmv';
        const lSensor = w.LClass.fromD(lPkg.addClass('Sensor'));
        for (const a of ['name', 'tint', 'threshold', 'tags']) lSensor.addAttribute(a, 'Pointer_ESTRING');
        w.DVertex.new(lSensor.id, dG2.id);

        const dM1 = w.DModel.new('DmvM1', dM2.id, false, true);
        const dG1 = w.DGraph.new(0, dM1.id);
        w.SetFieldAction.new(dG1.id, 'graphStyle', 'v2-flow', '', false);
        w.SetFieldAction.new(project.id, 'models', dM1.id, '+=', true);
        w.SetRootFieldAction.new('graphs', dG1.id, '+=', true);
        w.SetFieldAction.new(project.id, 'graphs', dG1.id, '+=', true);
        return { ok: true, m1: dM1.id, cls: lSensor.id };
    } catch (e) { return { ok: false, error: e instanceof Error ? `${e.message}\n${e.stack}` : String(e) }; }
});
if (!built.ok) { console.log('FIXTURE FAILED: ' + built.error); await browser.close(); process.exit(1); }
await page.waitForTimeout(2500);

const made = await page.evaluate(async (a: { m1: string; cls: string }) => {
    const w = window as any;
    try {
        for (const n of ['Alpha', 'Beta']) w.DObject.new(a.cls, a.m1, w.DModel, n, true);
        await new Promise(r => setTimeout(r, 2000));
        const lModel = w.LPointerTargetable.fromD(a.m1);
        for (const n of ['Alpha', 'Beta']) {
            const o = lModel.objects.find((x: any) => x.name === n);
            if (!o) return `oggetto ${n} non trovato`;
            for (const attr of ['tint', 'threshold', 'tags']) o['$' + attr].value = `${attr}-${n}`;
        }
        return 'ok';
    } catch (e) { return e instanceof Error ? e.message : String(e); }
}, { m1: built.m1, cls: built.cls });
if (made !== 'ok') { console.log('FIXTURE FAILED (objects): ' + made); await browser.close(); process.exit(1); }
await page.waitForTimeout(2500);

/** Attiva un viewpoint diagrammatico, come fa `activateViewpoint` (funzione di
 *  modulo, non su window). Serve a B: senza viewpoint attivo il negativo di B
 *  sarebbe verde perche' non c'e' nessun viewpoint, non perche' non lo si legge. */
const activateSomeViewpoint = () => page.evaluate(() => {
    const w = window as any; const W: any = w.windoww ?? w;
    try {
        const state = W.store.getState();
        if (state.viewpoint) return `gia' attivo: ${state.viewpoint}`;
        const l = state.idlookup;
        const vp = Object.keys(l).find(id => l[id]?.className === 'DViewPoint'
            && id !== 'Pointer_ViewPointDataManager');
        if (!vp) return 'nessun viewpoint';
        const projectId = w.LProject.getProject()?.__raw?.id;
        if (projectId) W.SetFieldAction.new(projectId, 'activeViewpoint', vp, '', true);
        W.SetRootFieldAction.new('viewpoint', vp, '', true);
        return `attivato ${vp}`;
    } catch (e) { return e instanceof Error ? e.message : String(e); }
});

/** Il singleton, creato come lo creera' `ensureDataManagerViewpoint`. */
const makeSingleton = () => page.evaluate(() => {
    const w = window as any; const W: any = w.windoww ?? w;
    try {
        const existing = W.store.getState().idlookup['Pointer_ViewPointDataManager'];
        if (existing) return { made: false, type: existing.viewpointType, excl: existing.isExclusiveView };
        w.DViewPoint.newVP('Data Manager', (vp: any) => {
            vp.viewpointType = 'dataManager';
            vp.isValidation = false;
        }, true, 'Pointer_ViewPointDataManager');
        const d = W.store.getState().idlookup['Pointer_ViewPointDataManager'];
        return { made: true, type: d?.viewpointType, excl: d?.isExclusiveView, active: W.store.getState().viewpoint };
    } catch (e) { return { error: e instanceof Error ? `${e.message}\n${e.stack}` : String(e) }; }
});

/** Installa una view di classe con `table.columns` DENTRO il viewpoint indicato. */
const setView = (opts: { id: string; vp: 'active' | 'singleton'; columns?: string[] }) =>
    page.evaluate((o: any) => {
        const w = window as any; const W: any = w.windoww ?? w;
        try {
            const state = W.store.getState();
            const vp = o.vp === 'singleton' ? 'Pointer_ViewPointDataManager' : state.viewpoint;
            if (!vp) return 'nessun viewpoint di destinazione';
            const ir: any = {
                irVersion: 'ir-1.2', kind: 'vertex', metaclasses: ['Sensor'],
                priority: 50, exclusive: true,
                shape: { form: 'rect', fill: '#ffffff',
                         border: { color: '#334155', width: 1, style: 'solid' },
                         labels: [{ position: 'center', source: { from: 'path', expr: '$name.value' } }] },
            };
            if (o.columns) ir.table = { columns: o.columns };
            const existing = state.idlookup[o.id];
            if (existing) { W.SetFieldAction.new(o.id, 'ir', ir, '', true); return `riscritta in ${vp}`; }
            // `new2` prende il PADRE, un `DViewElement`, non il suo id. Passando la
            // stringa, `father.viewpoint` e' `undefined` e il fallback la installa in
            // `Defaults.viewpoints[0]` — `Pointer_ViewPointDefault` — in silenzio: al
            // primo giro C1 leggeva «il manager non segue il singleton» dove il fatto
            // era «la view non e' mai entrata nel singleton». CLAUDE.md §5, lo stato
            // che non si e' formato letto come comportamento. Il ritorno dichiara dove
            // e' finita DAVVERO, misurato dopo la scrittura e non prima.
            const father = state.idlookup[vp];
            if (!father) return `padre ${vp} non in idlookup`;
            w.DViewElement.new2(`DMVC ${o.id}`, '', father, (dd: any) => {
                dd.appliableToClasses = ['DObject'];
                dd.appliableTo = 'Vertex';
                dd.ir = ir;
            }, true, o.id);
            const landed = W.store.getState().idlookup[o.id]?.viewpoint;
            return `installata in ${landed}${landed === vp ? '' : ` (CHIESTO ${vp})`}`;
        } catch (e) { return e instanceof Error ? e.message : String(e); }
    }, opts);

const openManager = async (mid: string) => {
    await page.goto(`${BASE_URL}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(NAV_MS);
    const r = await page.evaluate((m: string) => {
        const w = window as any;
        try { return !!w.DockManager.openManager(w.LModel.fromPointer(m)); } catch (e) { return String(e); }
    }, mid);
    await page.waitForTimeout(6000);
    return String(r);
};

const markVisible = () => page.evaluate(() => {
    const paints = (el: Element) => {
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) return false;
        const cx = Math.min(Math.max(r.left + r.width / 2, 1), window.innerWidth - 1);
        const cy = Math.min(Math.max(r.top + r.height / 2, 1), window.innerHeight - 1);
        const hit = document.elementFromPoint(cx, cy);
        return !!hit && (el === hit || el.contains(hit));
    };
    const roots = Array.from(document.querySelectorAll('.instance-manager'));
    for (const r of roots) r.removeAttribute('data-probe-visible');
    const root = roots.find(paints) ?? null;
    if (root) root.setAttribute('data-probe-visible', '1');
    return { managers: roots.length, found: !!root };
});

const headers = () => page.evaluate(() => {
    const root = document.querySelector('[data-probe-visible="1"]');
    if (!root) return null;
    const ths = Array.from(root.querySelectorAll('thead th')) as HTMLElement[];
    return ths
        .filter(th => !th.className.includes('instance-manager__th-'))
        .map(th => (th.firstChild?.textContent ?? th.textContent ?? '').trim());
});

const pick = async (name: string) => {
    await markVisible();
    const rail = page.locator('[data-probe-visible="1"] .instance-manager__pane--classes');
    const row = rail.locator('.instance-manager__row').filter({
        has: page.locator('.instance-manager__row-name', { hasText: new RegExp(`^${name}$`) }),
    }).first();
    if (await row.count() === 0) return `riga «${name}» non trovata`;
    await row.click();
    await page.waitForTimeout(1800);
    return 'ok';
};

console.log('\n== R-DMV slice C ==============================================');
note('openManager', await openManager(built.m1));
note('markVisible', await markVisible());
note('pick(Sensor)', await pick('Sensor'));

// ── A. singleton assente ─────────────────────────────────────────────────────
console.log('\n-- A. singleton assente: la tabella di oggi (R-VP-4) ---------');
const a = await headers();
await page.screenshot({ path: shot('a_no_singleton') });
note('colonne', a);
const singletonAbsent = await page.evaluate(() =>
    !(window as any).windoww.store.getState().idlookup['Pointer_ViewPointDataManager']);
check('A0 il singleton NON esiste: nessuno lo ha creato aprendo il manager (R-DMV-6)',
    singletonAbsent, `idlookup['Pointer_ViewPointDataManager'] assente: ${singletonAbsent}`);
check('A1 le colonne sono quelle derivate dal tipo, meno il doppione `name`',
    !!a && a.join(',') === 'tint,threshold,tags', `lette ${JSON.stringify(a)}`);
check('A2 nessun avviso `[table]` a riposo',
    warns.filter(w => w.includes('[table]')).length === 0,
    `avvisi: ${JSON.stringify(warns.filter(w => w.includes('[table]')))}`);

// ── B. la view sta nel viewpoint ATTIVO: non ordina piu' ─────────────────────
console.log('\n-- B. `table.columns` nel viewpoint ATTIVO: NON ordina -------');
note('activateViewpoint', await activateSomeViewpoint());
await page.waitForTimeout(1500);
note('view', await setView({ id: 'Pointer_DMVC_ACTIVE', vp: 'active', columns: ['threshold', 'tint'] }));
await page.waitForTimeout(3000);
await markVisible();
const b = await headers();
await page.screenshot({ path: shot('b_in_active_vp') });
note('colonne', b);
check('B0 controllo positivo: il viewpoint attivo esiste e la view ci e\' dentro',
    !!(await page.evaluate(() => {
        const W: any = (window as any).windoww; const s = W.store.getState();
        const v = s.idlookup['Pointer_DMVC_ACTIVE'];
        return !!s.viewpoint && !!v && v.viewpoint === s.viewpoint;
    })),
    'state.viewpoint valorizzato e view.viewpoint === state.viewpoint');
check('B1 la tabella e\' INVARIATA rispetto ad A: il manager non legge piu\' l\'attivo',
    !!a && !!b && a.join(',') === b.join(','),
    `A ${JSON.stringify(a)} vs B ${JSON.stringify(b)}`);

// ── C. la view sta nel SINGLETON: ordina ────────────────────────────────────
console.log('\n-- C. `table.columns` nel SINGLETON: ordina ------------------');
const sing = await makeSingleton();
note('makeSingleton', sing);
await page.waitForTimeout(1500);
check('C0 il singleton nasce con `viewpointType: dataManager` e `isExclusiveView: true`',
    (sing as any).type === 'dataManager' && (sing as any).excl === true,
    `type ${(sing as any).type}, isExclusiveView ${(sing as any).excl}`);
check('C0-bis il singleton NON e\' il viewpoint attivo',
    !!(await page.evaluate(() =>
        (window as any).windoww.store.getState().viewpoint !== 'Pointer_ViewPointDataManager')),
    `state.viewpoint = ${await page.evaluate(() => (window as any).windoww.store.getState().viewpoint)}`);
note('view', await setView({ id: 'Pointer_DMVC_SINGLE', vp: 'singleton', columns: ['tags', 'threshold'] }));
await page.waitForTimeout(3500);
await markVisible();
const c = await headers();
await page.screenshot({ path: shot('c_in_singleton') });
note('colonne', c);
check('C1 le citate vanno in TESTA, nell\'ordine dato: il manager legge dal singleton',
    !!c && c[0] === 'tags' && c[1] === 'threshold',
    `lette ${JSON.stringify(c)}`);
check('C2 NESSUNA colonna sparisce: stesso insieme di A, ordine diverso (R-VP-10)',
    !!a && !!c && c.length === a.length && [...c].sort().join(',') === [...a].sort().join(','),
    `A ${JSON.stringify([...(a ?? [])].sort())} vs C ${JSON.stringify([...(c ?? [])].sort())}`);
check('C3 nessun errore di pagina in tutto il giro',
    errors.length === 0, `pageerror: ${JSON.stringify(errors.slice(0, 3))}`);

console.log(`\n== ${pass} PASS, ${fail} FAIL ===================================\n`);
await browser.close();
process.exit(fail === 0 ? 0 : 1);
