/**
 * probe_2026-09-03_rvp_slice1_manager_columns — R-VP slice 1, commit 1:
 * `TableSpec.columns` (nata come `ManagerSpec`, rinominata in `b7f069389`) ordina le colonne.
 *
 * Committata qui e NON in `frontend/scripts/smoke/`: le sonde `_tmp_*` sono ignorate
 * (`.gitignore:66`) e sparirebbero con la sessione. Questa resta perche' i due errori
 * che ha attraversato valgono piu' del suo verde.
 *
 * Estensione `.mts` e non `.ts`: `frontend/package.json` dichiara `"type": "module"`,
 * la root del repo NON ha un `package.json` affatto, e un `.ts` qui sotto viene
 * compilato come CJS — «Top-level await is currently not supported with the "cjs"
 * output format», 42 errori e nessuna riga eseguita. `.mts` e' ESM per estensione,
 * indipendentemente dal pacchetto, ed e' la stessa scelta dei `.mjs` gia' in questa
 * cartella.
 *
 * ── DUE MISURE CHE NON MISURAVANO, e come si riconoscono ──────────────────────
 *
 *  1. IL VIEWPOINT NON ATTIVO. In un progetto appena creato `state.viewpoint` e' la
 *     STRINGA VUOTA, non `null` e non un id. `getIRIndex` filtra le view con
 *     `d.viewpoint !== vp`, quindi la view si installava e non entrava MAI nell'indice.
 *     Il primo giro leggeva «il prodotto non ordina» dove il fatto era «la view non
 *     c'e'»: B1, C1 e D2 rossi, e nessuno dei tre per la ragione che dicevano. Il
 *     rimedio non e' un'attesa piu' lunga: sono le due scritture di
 *     `utils/lastViewpoint.activateViewpoint`, fatte a mano perche' quella e' una
 *     funzione di modulo e non sta su `window`.
 *
 *  2. IL PREDICATO CHE NON COMPILA. `right: 'Alpha'` — una stringa nuda dove il
 *     `Predicate` vuole un `Literal` — e' letta come PathExpr, `compileView` MUORE e
 *     `getIRIndex` scarta la view con un `[ir] compile failed`. Il blocco D risultava
 *     «view predicata correttamente ignorata» mentre la view non esisteva: D1 VERDE per
 *     la ragione sbagliata. Da qui **D0**, che asserisce zero `compile failed` PRIMA di
 *     D1: senza quel gradino il verde di D1 non distingue «ignorata come vuole R-VP-11»
 *     da «mai arrivata».
 *
 * Le due hanno la stessa forma: uno stato che non si e' mai formato, letto come un
 * comportamento. E' il modo di guasto di CLAUDE.md §5, due volte nello stesso file.
 *
 * ── Cosa misura ──────────────────────────────────────────────────────────────
 *
 * Tre cose che il test unitario non puo' dire, perche' sono la catena intera e non la
 * funzione pura:
 *
 *   1. che senza `manager` in nessuna view il manager sia IDENTICO a oggi;
 *   2. che con `manager.columns` le citate vadano in testa **e nessuna sparisca** — cioe'
 *      che `orderColumns` stia davvero PRIMA della riduzione automatica e che quella
 *      riduzione misuri lo stesso insieme di prima (R-VP-10);
 *   3. che una view con `predicate` che porta `manager` sia ignorata e DETTA (R-VP-11).
 *
 * Il confronto e' DENTRO il giro, non fra due giri su sorgenti diversi: lo stesso
 * progetto, la stessa metaclasse, la stessa sessione, con la view installata e poi
 * modificata a caldo. E' piu' forte di un before/after su `git show`, perche' toglie di
 * mezzo ogni differenza di fixture: quello che cambia e' solo l'ir.
 *
 * Con il dev server su (P8: porta 3000, non 3001):
 *   cd frontend && npx tsx ../docs/discovery/harness/probe_2026-09-03_rvp_slice1_manager_columns.mts
 *
 * Gli screenshot finiscono accanto alla sonda, in `docs/discovery/harness/`, e NON sono
 * committati: si rigenerano rieseguendola.
 */
/* Playwright per path relativo e con import DI DEFAULT, due deviazioni e una ragione
   ciascuna.
     - Per path: le dipendenze stanno in `frontend/node_modules`, e Node risolve uno
       specificatore nudo risalendo dalla cartella del file — `docs/discovery/harness`
       -> `docs/discovery` -> `docs` -> root, dove un `node_modules` non c'e'.
       `states.ts` invece si importa per nome senza problemi: le SUE dipendenze le
       risolve dalla propria cartella, che sta dentro `frontend/`.
     - Di default: entrando per path si scavalca la mappa `exports` del pacchetto, e
       `index.js` e' CommonJS — «does not provide an export named 'chromium'». Il
       namespace CJS arriva come default, e `chromium` si prende da li'. */
import playwright from '../../../frontend/node_modules/@playwright/test/index.js';
const { chromium } = playwright as unknown as typeof import('@playwright/test');
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { BASE_URL, NAV_MS, SETTLE_MS, createProject, seed } from '../../../frontend/scripts/smoke/states.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const shot = (n: string) => resolve(HERE, `_tmp_rvp1_${n}.png`);   // non committati

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
const pid = await createProject(page, `Smoke_RVP1_${Date.now()}`);
if (!pid) { console.log('FIXTURE FAILED: createProject'); await browser.close(); process.exit(1); }
await page.goto(`${BASE_URL}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(NAV_MS + SETTLE_MS);

/** Metaclasse con QUATTRO attributi, perche' un riordino su due colonne non
 *  distinguerebbe «portate in testa» da «scambiate». */
const built = await page.evaluate(async () => {
    const w = window as any;
    try {
        const project = w.LProject.getProject();
        if (!project) return { ok: false, error: 'no project' };
        const dM2 = w.DModel.new('RvpM2', undefined, true);
        const lM2 = w.LModel.fromD(dM2);
        const dG2 = w.DGraph.new(0, dM2.id);
        w.SetFieldAction.new(project.id, 'metamodels', lM2.id, '+=', true);
        w.SetFieldAction.new(project.id, 'graphs', dG2.id, '+=', true);
        w.SetFieldAction.new(dG2.id, 'graphStyle', 'v2-flow', '', false);

        const dPkg = lM2.addChild('package');
        const lPkg = w.LPackage.fromD(dPkg);
        lPkg.name = 'rvp1';
        const lSensor = w.LClass.fromD(lPkg.addClass('Sensor'));
        for (const a of ['name', 'tint', 'threshold', 'tags']) lSensor.addAttribute(a, 'Pointer_ESTRING');
        w.DVertex.new(lSensor.id, dG2.id);

        const dM1 = w.DModel.new('RvpM1', dM2.id, false, true);
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

/** Le istanze devono avere OGNI attributo valorizzato: una colonna interamente vuota
 *  sparisce da se' (`emptyColumnKeys`) e falserebbe il conteggio dell'insieme. */
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

/** Il manager che DIPINGE, non il primo del DOM: i tab inattivi restano montati. */
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

/** Le intestazioni delle colonne di feature, nell'ordine in cui la tabella le stampa.
 *  Escluse le fisse (`pick`, `name`, `refs`, `del`, `chev`), che non sono colonne di
 *  `tableColumns` e che `TableSpec` non governa. */
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

/** Installa (o riscrive) la view IR della metaclasse. `manager` `undefined` = la chiave
 *  non c'e' affatto, che e' lo stato di ogni progetto salvato oggi. */
const setView = (opts: { manager?: unknown; predicate?: unknown; id: string }) => page.evaluate((o: any) => {
    const w = window as any;
    try {
        const W: any = w.windoww ?? w;
        const state = W.store.getState();
        let vp = state.viewpoint;
        if (!vp) {
            // Misurato: nel progetto appena creato `state.viewpoint` e' la STRINGA VUOTA,
            // e l'indice filtra le view con `d.viewpoint !== vp`. Senza attivare il
            // viewpoint la view si installa e non entra mai nell'indice: la sonda
            // misurerebbe un ordine che non cambia, e leggerebbe come «il prodotto non
            // ordina» cio' che e' «la view non c'e'». Le due scritture sono quelle di
            // `utils/lastViewpoint.activateViewpoint`, che e' una funzione di modulo e
            // non e' su `window`.
            const l = state.idlookup;
            vp = Object.keys(l).find(id => l[id]?.className === 'DViewPoint') ?? null;
            if (!vp) return 'nessun viewpoint';
            const projectId = w.LProject.getProject()?.__raw?.id;
            if (projectId) W.SetFieldAction.new(projectId, 'activeViewpoint', vp, '', true);
            W.SetRootFieldAction.new('viewpoint', vp, '', true);
        }
        if (!vp) return 'nessun viewpoint';
        const existing = W.store.getState().idlookup[o.id];
        const ir: any = {
            irVersion: 'ir-1.2', kind: 'vertex', metaclasses: ['Sensor'],
            priority: 50, exclusive: true,
            shape: { form: 'rect', fill: '#ffffff',
                     border: { color: '#334155', width: 1, style: 'solid' },
                     labels: [{ position: 'center', source: { from: 'path', expr: '$name.value' } }] },
        };
        if (o.manager !== undefined) ir.manager = o.manager;
        if (o.predicate !== undefined) ir.predicate = o.predicate;
        if (existing) { W.SetFieldAction.new(o.id, 'ir', ir, '', true); return 'riscritta'; }
        W.DViewElement.new2(`RVP1 ${o.id}`, '', vp, (dd: any) => {
            dd.appliableToClasses = ['DObject'];
            dd.appliableTo = 'Vertex';
            dd.ir = ir;
        }, true, o.id);
        return 'installata';
    } catch (e) { return e instanceof Error ? e.message : String(e); }
}, opts);

const dropView = (id: string) => page.evaluate((vid: string) => {
    const w = window as any;
    const W: any = w.windoww ?? w;
    try { W.DeleteElementAction.new(vid); return 'rimossa'; } catch (e) { return String(e); }
}, id);

console.log('\n== R-VP slice 1 / commit 1 ====================================');
note('openManager', await openManager(built.m1));
note('markVisible', await markVisible());
note('pick(Sensor)', await pick('Sensor'));

// ── A. nessuna view con `manager`: lo stato di ogni progetto di oggi ──────────
console.log('\n-- A. nessun `manager`: il manager di oggi -------------------');
const a = await headers();
await page.screenshot({ path: shot('a_default') });
note('colonne', a);
// `name` NON c'e', ed e' corretto: l'attributo omonimo ripete la colonna fissa dei nomi
// su ogni riga, e `duplicateNameColumnKeys` lo toglie da se'. E' anche il controllo che
// serve a B2 — se `orderColumns` filtrasse, l'insieme cambierebbe rispetto a questo.
check('A1 la tabella si legge, e sono le colonne derivate dal tipo meno il doppione `name`',
    !!a && a.join(',') === 'tint,threshold,tags',
    `lette ${JSON.stringify(a)}`);
check('A2 nessun avviso di manager a riposo',
    warns.filter(w => w.includes('[manager]')).length === 0,
    `avvisi: ${JSON.stringify(warns.filter(w => w.includes('[manager]')))}`);

// ── B. `manager.columns`: ordina, e non toglie ───────────────────────────────
console.log('\n-- B. `manager.columns` -------------------------------------');
note('view', await setView({ id: 'Pointer_RVP1_VIEW', manager: { columns: ['threshold', 'tint'] } }));
await page.waitForTimeout(3000);
await markVisible();
const b = await headers();
await page.screenshot({ path: shot('b_ordered') });
note('colonne', b);
check('B1 le citate sono in TESTA, nell\'ordine dato',
    !!b && b[0] === 'threshold' && b[1] === 'tint',
    `lette ${JSON.stringify(b)}`);
check('B2 NESSUNA colonna e\' sparita: stesso insieme di A, ordine diverso',
    !!a && !!b && b.length === a.length && [...b].sort().join(',') === [...a].sort().join(','),
    `A ${JSON.stringify([...(a ?? [])].sort())} vs B ${JSON.stringify([...(b ?? [])].sort())}`);
check('B3 le non citate seguono nell\'ordine di prima',
    !!a && !!b && b.slice(2).join(',') === (a ?? []).filter(k => k !== 'threshold' && k !== 'tint').join(','),
    `coda B ${JSON.stringify((b ?? []).slice(2))}`);

// ── C. un nome che non esiste: ignorato, e il resto ordina lo stesso ─────────
console.log('\n-- C. nome sconosciuto nello spec ---------------------------');
note('view', await setView({ id: 'Pointer_RVP1_VIEW', manager: { columns: ['nonesiste', 'tags'] } }));
await page.waitForTimeout(3000);
await markVisible();
const c = await headers();
note('colonne', c);
check('C1 il nome sconosciuto e\' ignorato, `tags` va in testa, niente si rompe',
    !!c && c[0] === 'tags' && c.length === (a ?? []).length
    && [...c].sort().join(',') === [...(a ?? [])].sort().join(',') && errors.length === 0,
    `lette ${JSON.stringify(c)}, pageerror ${errors.length}`);

// ── D. view con predicato: ignorata, e DETTA ─────────────────────────────────
console.log('\n-- D. `manager` su una view con `predicate` -----------------');
warns.length = 0;
note('view', await setView({
    id: 'Pointer_RVP1_VIEW',
    manager: { columns: ['tags', 'threshold'] },
    // Il lato destro e' un `Literal`, non una stringa nuda: una stringa la' e' letta
    // come PathExpr e `compileView` MUORE, la view esce dall'indice e la sonda misura
    // «nessun ordinamento» credendo di aver misurato «view ignorata per il predicato».
    // Misurato al primo giro: due `[ir] compile failed`, D1 verde per la ragione
    // sbagliata e D2 rosso perche' non c'era niente da saltare.
    predicate: { op: 'eq', left: '$name.value', right: { kind: 'string', value: 'Alpha' } },
}));
await page.waitForTimeout(3500);
await markVisible();
const d = await headers();
await page.screenshot({ path: shot('c_predicated') });
const managerWarns = warns.filter(w => w.includes('[manager]'));
note('colonne', d);
note('avvisi [manager]', managerWarns);
note('avvisi non-[manager]', warns.filter(w => !w.includes('[manager]')).map(w => w.split('\n')[0]));
note('la view e\' ancora nell\'indice?', await page.evaluate(() => {
    const W: any = (window as any).windoww ?? window;
    const s = W.store.getState();
    const v = s.idlookup['Pointer_RVP1_VIEW'];
    return { hasIr: !!v?.ir, predicate: v?.ir?.predicate ?? null, manager: v?.ir?.manager ?? null,
             inList: (s.viewelements ?? []).includes('Pointer_RVP1_VIEW'), activeVp: s.viewpoint ?? null,
             viewVp: v?.viewpoint ?? null };
}));
check('D0 la view e\' COMPILATA e nell\'indice: senza questo D1 sarebbe verde a vuoto',
    warns.filter(w => w.includes('compile failed')).length === 0,
    `«compile failed»: ${warns.filter(w => w.includes('compile failed')).length}`);
check('D1 l\'ordine e\' quello di A: la view predicata NON ha ordinato',
    !!d && !!a && d.join(',') === a.join(','),
    `A ${JSON.stringify(a)} vs D ${JSON.stringify(d)}`);
check('D2 l\'autore lo viene a sapere: un avviso che nomina la view e R-VP-11',
    managerWarns.length >= 1 && managerWarns[0].includes('Pointer_RVP1_VIEW') && managerWarns[0].includes('R-VP-11'),
    `avvisi ${JSON.stringify(managerWarns)}`);

// ── E. tolta la view, si torna esattamente a com'era ─────────────────────────
console.log('\n-- E. ritorno allo stato di partenza ------------------------');
note('view', await dropView('Pointer_RVP1_VIEW'));
await page.waitForTimeout(3000);
await markVisible();
const e = await headers();
note('colonne', e);
check('E1 senza view il manager e\' IDENTICO ad A: la slice non lascia residui',
    !!e && !!a && e.join(',') === a.join(','), `A ${JSON.stringify(a)} vs E ${JSON.stringify(e)}`);

console.log(`\n== ${pass} PASS / ${fail} FAIL, errori di pagina: ${errors.length} ==`);
if (errors.length) for (const x of errors) console.log('  PAGE ERROR  ' + x);
await browser.close();
process.exit(fail > 0 ? 1 : 0);
