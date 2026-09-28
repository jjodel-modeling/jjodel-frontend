/**
 * probe_2026-09-09_pallino_freschezza — il pallino sulle istanze che violano, e la
 * regola che non lo lascia invecchiare (R-VAL-18, spec §8.5), sull'app vera.
 *
 * ── Che cosa misura, e perche' ciascun blocco esiste ─────────────────────────
 *
 *  A. LA FIXTURE. Un metamodello di macchine a stati con `State.isInitial`, un modello
 *     con tre istanze — una iniziale e due no — e una regola `isInitial` su `State`.
 *     Due violazioni attese, e una terza istanza che NON viola: senza quella, «tutti i
 *     pallini spariscono» sarebbe indistinguibile da «i pallini non compaiono mai».
 *     Il modello si apre sul canvas, perche' il soggetto e' il canvas.
 *
 *  B. IL PALLINO C'E'. Dopo Validate, le due istanze che violano portano il pallino, e
 *     la terza no. Si misura sull'id del NODO React Flow, che e' il DVertex: e'
 *     esattamente l'ancoraggio che mancava, e leggerlo sull'id dell'oggetto darebbe un
 *     verde per la ragione sbagliata.
 *
 *  C. LA DICHIARAZIONE C'E', e dice il numero. E' la meta' che conta di R-VAL-18: senza,
 *     l'assenza di pallini sarebbe indistinguibile da un modello validato e pulito.
 *
 *  D. IL MODELLO CAMBIA -> I PALLINI SPARISCONO TUTTI, e la dichiarazione lo dice. La
 *     modifica scelta e' una RINOMINA di un'istanza che NON viola: non ripara niente,
 *     quindi i pallini sarebbero ancora «giusti» se restassero. E' il caso che distingue
 *     la regola («non si garantisce, quindi non c'e'») da una semplice riparazione.
 *
 *  E. UNA REGOLA CAMBIA -> stesso esito. La modifica scelta e' il MESSAGGIO della
 *     regola, che non cambia nessun verdetto: solo una firma che copre anche le regole
 *     la vede. E' il controllo che separa questa implementazione da una firma sul solo
 *     modello (R-VAL-17 un piano piu' in la').
 *
 *  F. IL CONTROLLO CHE DISCRIMINA (P12). Spostare un nodo NON invalida: i pallini
 *     restano e la dichiarazione resta «2 violations». Senza questo blocco, un ritiro
 *     che scatta a ogni azione qualunque passerebbe tutti i test precedenti.
 *
 * ── Che cosa NON prova ───────────────────────────────────────────────────────
 *
 * Niente sulla rivalutazione automatica, che e' la destinazione di §9 e non questa
 * fetta. Niente sull'istanza resa come edge sintetico, che non ha `ObjectNode` e non si
 * accende per costruzione: limite dichiarato. Niente sulle righe M1 dell'albero, che non
 * consumano `useNodeProblems`.
 *
 * Con il dev server su (P8: porta 3000, non 3001):
 *   cd frontend && npx tsx ../docs/discovery/harness/probe_2026-09-09_pallino_freschezza.mts
 */
import playwright from '../../../frontend/node_modules/@playwright/test/index.js';
const { chromium } = playwright as unknown as typeof import('@playwright/test');
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { BASE_URL, NAV_MS, SETTLE_MS, createProject, seed } from '../../../frontend/scripts/smoke/states.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const shot = (n: string) => resolve(HERE, `_tmp_r18_${n}.png`);

let pass = 0, fail = 0;
const check = (label: string, ok: boolean, detail: string) => {
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}\n        ${detail}`);
    ok ? pass++ : fail++;
};
const note = (label: string, d: unknown) =>
    console.log(`  MISURA  ${label}\n        ${typeof d === 'string' ? d : JSON.stringify(d)}`);
const h = (s: string) => console.log('\n' + s + '\n' + '─'.repeat(s.length));

const VP_ID = 'Pointer_ValidationViewpointDefault';
const COMMIT_MS = 1200;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1500, height: 950 } });
await ctx.addInitScript(() => { (window as any).__name = (f: any) => f; });
await seed(ctx, true);
const page = await ctx.newPage();
const errors: string[] = [];
page.on('pageerror', (e) => errors.push(e.message));

await page.goto(`${BASE_URL}/all-projects`, { waitUntil: 'domcontentloaded', timeout: NAV_MS });
await page.waitForTimeout(SETTLE_MS);
const pid = await createProject(page, `Smoke_R18_${Date.now()}`);
if (!pid) { console.log('FIXTURE FAILED: createProject'); await browser.close(); process.exit(1); }
await page.goto(`${BASE_URL}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(NAV_MS + SETTLE_MS);

// ── A ────────────────────────────────────────────────────────────────────────
h('A. La fixture: tre stati, due dei quali violano');

const m2 = await page.evaluate(() => {
    const w = window as any;
    const project = w.LProject.getProject();
    if (!project) return { ok: false as const, error: 'no project' };
    const dM2 = w.DModel.new('SM', undefined, true);
    const lM2 = w.LModel.fromD(dM2);
    w.SetFieldAction.new(project.id, 'metamodels', lM2.id, '+=', true);
    const lPkg = w.LPackage.fromD(lM2.addChild('package'));
    lPkg.name = 'sm';
    const lState = w.LClass.fromD(lPkg.addClass('State'));
    return { ok: true as const, m2: dM2.id, stateClass: lState.id };
});
if (!m2.ok) { console.log('FIXTURE FAILED: ' + (m2 as any).error); await browser.close(); process.exit(1); }
await page.waitForTimeout(COMMIT_MS);

await page.evaluate((st: string) => {
    (window as any).LPointerTargetable.fromPointer(st).addAttribute('isInitial', 'Pointer_EBOOLEAN');
}, m2.stateClass);
await page.waitForTimeout(COMMIT_MS);

const modelId = await page.evaluate((mm: string) => {
    const w = window as any;
    const project = w.LProject.getProject();
    const m = w.DModel.new('SM_1', mm, false);
    w.SetFieldAction.new(project.id, 'models', m.id, '+=', true);
    return m.id;
}, m2.m2);
await page.waitForTimeout(COMMIT_MS);

await page.evaluate(([m, cls]: string[]) => {
    const w = window as any;
    const lCls = w.LPointerTargetable.fromPointer(cls);
    const lm = w.LPointerTargetable.fromPointer(m);
    lm.addObject({}, lCls); lm.addObject({}, lCls); lm.addObject({}, lCls);
}, [modelId, m2.stateClass] as any);
await page.waitForTimeout(COMMIT_MS * 2);

// Scritto ESPLICITAMENTE su tutte e tre: uno slot mai scritto vale `null`, non `false`.
const objects = await page.evaluate((m: string) => {
    const w = window as any;
    const lm = w.LPointerTargetable.fromPointer(m);
    const objs = (lm?.allSubObjects ?? lm?.objects ?? []) as any[];
    const names = ['Sano', 'Rotto1', 'Rotto2'];
    const iniziale = [true, false, false];
    const out: Record<string, string> = {};
    objs.forEach((o: any, i: number) => {
        if (i > 2) return;
        o.name = names[i];
        o['$isInitial'].value = iniziale[i];
        out[names[i]] = o.id;
    });
    return out;
}, modelId);
await page.waitForTimeout(COMMIT_MS);
note('le tre istanze', objects);

const rules = await page.evaluate(([vp, st]: string[]) => {
    const w = window as any;
    w.DValidationViewpoint.new();
    const r = w.DValidationRule.new(vp, 'deveEssereIniziale', st, 'isInitial',
        'questo stato non e\' iniziale');
    return { viola: r.id };
}, [VP_ID, m2.stateClass] as any);
await page.waitForTimeout(COMMIT_MS);

await page.evaluate(async (m: string) => {
    const w = window as any;
    await w.DockManager.open2(w.LPointerTargetable.fromPointer(m));
}, modelId);
await page.waitForTimeout(NAV_MS + SETTLE_MS);

/** Da id di DObject a id del DVertex del grafo aperto: e' la stessa traduzione che il
 *  produttore fa, letta qui dallo store per poter interrogare il DOM per data-id. */
const vertices = await page.evaluate((objIds: Record<string, string>) => {
    const w = window as any;
    const lookup = w.windoww?.store?.getState?.()?.idlookup ?? w.store?.getState?.()?.idlookup ?? {};
    const byObject = new Map<string, string>();
    for (const id in lookup) {
        const e = lookup[id];
        if (e?.className === 'DVertex' && e.model) byObject.set(e.model, id);
    }
    const out: Record<string, string | null> = {};
    for (const [name, oid] of Object.entries(objIds)) out[name] = byObject.get(oid) ?? null;
    return out;
}, objects);
note('i vertici sul canvas', vertices);

const nodeCount = await page.locator('.react-flow__node:visible').count();
check('la fixture e\' sul canvas: tre nodi e tre vertici risolti',
    nodeCount >= 3 && Object.values(vertices).every(v => !!v),
    `nodi visibili = ${nodeCount}, vertici = ${JSON.stringify(vertices)}`);
if (!Object.values(vertices).every(v => !!v)) {
    console.log('FIXTURE FAILED: senza vertici non c\'e\' niente da misurare');
    await browser.close(); process.exit(1);
}

// ── gli strumenti di lettura ─────────────────────────────────────────────────

const btn = page.locator('button[title="Validate the open model against the active rules"]:visible');
if (await btn.count() !== 1) {
    console.log('FIXTURE FAILED: bottoni Validate visibili = ' + await btn.count());
    await browser.close(); process.exit(1);
}
const closeModal = async () => {
    const x = page.locator('.validation-results__close:visible');
    if (await x.count()) { await x.first().click(); await page.waitForTimeout(SETTLE_MS); }
};
const validate = async () => { await btn.first().click(); await page.waitForTimeout(SETTLE_MS); await closeModal(); };

/** I pallini, per id di NODO React Flow. E' il solo id che accende il canvas. */
const dots = () => page.evaluate((v: Record<string, string>) => {
    const out: Record<string, number> = {};
    for (const [name, vid] of Object.entries(v)) {
        const node = document.querySelector(`.react-flow__node[data-id="${CSS.escape(vid)}"]`);
        out[name] = node ? node.querySelectorAll('.node-problem-dot').length : -1;
    }
    out['__totale_canvas'] = document.querySelectorAll('.react-flow__node .node-problem-dot').length;
    return out;
}, vertices as any);

/** LA dichiarazione: una sola, e si legge per testo. */
const declaration = () => page.evaluate(() => {
    const el = document.querySelector('.validation-freshness');
    return el ? {
        text: (el.textContent ?? '').replace(/\s+/g, ' ').trim(),
        cls: Array.from(el.classList).filter(c => c.startsWith('validation-freshness--')).join(','),
        quante: document.querySelectorAll('.validation-freshness').length,
    } : null;
});

// ── B, C ─────────────────────────────────────────────────────────────────────
h('B. Il pallino c\'e\', e solo dove serve — C. la dichiarazione dice il numero');

const prima = await declaration();
note('la dichiarazione prima di ogni giro', prima);
check('prima di validare la dichiarazione dice «mai validato», che non e\' «pulito»',
    prima?.cls === 'validation-freshness--never' && /Not validated/.test(prima?.text ?? ''),
    JSON.stringify(prima));
check('e non c\'e\' nessun pallino di validazione',
    (await dots())['__totale_canvas'] === 0, JSON.stringify(await dots()));

await validate();
const d1 = await dots();
const dec1 = await declaration();
note('i pallini dopo Validate', d1);
note('la dichiarazione dopo Validate', dec1);
await page.screenshot({ path: shot('a_dopo_validate') });

check('le due istanze che violano portano il pallino',
    d1['Rotto1'] === 1 && d1['Rotto2'] === 1, JSON.stringify(d1));
check('l\'istanza che NON viola non lo porta — senza questo, «tutti spariscono» non direbbe niente',
    d1['Sano'] === 0, `Sano = ${d1['Sano']}`);
check('sul canvas ci sono esattamente due pallini',
    d1['__totale_canvas'] === 2, `totale = ${d1['__totale_canvas']}`);
check('la dichiarazione e\' UNA, dice «2 violations» ed e\' quella dello stato violato',
    dec1?.quante === 1 && dec1?.cls === 'validation-freshness--violated' && /2 violations/.test(dec1?.text ?? ''),
    JSON.stringify(dec1));

// ── F (prima di D, perche' e' il controllo che non deve invalidare) ──────────
h('F. Il controllo che discrimina: spostare un nodo NON invalida');

await page.evaluate((v: Record<string, string>) => {
    const w = window as any;
    w.SetFieldAction.new(v['Sano'], 'x', 640, '', true);
    w.SetFieldAction.new(v['Sano'], 'y', 240, '', true);
}, vertices as any);
await page.waitForTimeout(COMMIT_MS);

const dF = await dots();
const decF = await declaration();
note('dopo aver spostato un nodo', { dots: dF, dec: decF });
check('i pallini restano: la posizione sul canvas non e\' un ingresso del verdetto',
    dF['__totale_canvas'] === 2 && dF['Rotto1'] === 1 && dF['Rotto2'] === 1, JSON.stringify(dF));
check('e la dichiarazione resta «2 violations»',
    decF?.cls === 'validation-freshness--violated' && /2 violations/.test(decF?.text ?? ''),
    JSON.stringify(decF));

// ── D ────────────────────────────────────────────────────────────────────────
h('D. Il MODELLO cambia: i pallini spariscono TUTTI e la dichiarazione lo dice');

// Una rinomina su un\'istanza che NON viola: non ripara niente, quindi i pallini
// sarebbero ancora «giusti» se restassero. E' il caso in cui la regola morde.
await page.evaluate((oid: string) => {
    (window as any).LPointerTargetable.fromPointer(oid).name = 'Sano_rinominato';
}, objects['Sano']);
await page.waitForTimeout(COMMIT_MS);

const d2 = await dots();
const dec2 = await declaration();
note('dopo la rinomina', { dots: d2, dec: dec2 });
await page.screenshot({ path: shot('b_dopo_modifica_modello') });

check('spariscono TUTTI, non solo quello dell\'istanza toccata',
    d2['__totale_canvas'] === 0 && d2['Rotto1'] === 0 && d2['Rotto2'] === 0, JSON.stringify(d2));
check('e la dichiarazione dice «Changed since validation» — senza, il silenzio sarebbe indistinguibile da un modello pulito',
    dec2?.cls === 'validation-freshness--stale' && /Changed since validation/.test(dec2?.text ?? ''),
    JSON.stringify(dec2));

// ── E ────────────────────────────────────────────────────────────────────────
h('E. Una REGOLA cambia: stesso esito, e solo una firma che le copre lo vede');

await validate();
const d3 = await dots();
check('rilanciato il comando, i due pallini tornano',
    d3['__totale_canvas'] === 2, JSON.stringify(d3));

// Il MESSAGGIO della regola: non cambia nessun verdetto. Una firma sul solo modello
// lascerebbe in piedi due pallini che rispondono a una regola diversa da quella scritta.
await page.evaluate((rid: string) => {
    (window as any).SetFieldAction.new(rid, 'message', 'testo nuovo del messaggio', '', true);
}, rules.viola);
await page.waitForTimeout(COMMIT_MS);

const d4 = await dots();
const dec4 = await declaration();
note('dopo la modifica alla regola', { dots: d4, dec: dec4 });
await page.screenshot({ path: shot('c_dopo_modifica_regola') });

check('i pallini spariscono anche quando a cambiare e\' la REGOLA e non il modello',
    d4['__totale_canvas'] === 0, JSON.stringify(d4));
check('e la dichiarazione lo dice allo stesso modo',
    dec4?.cls === 'validation-freshness--stale' && /Changed since validation/.test(dec4?.text ?? ''),
    JSON.stringify(dec4));

// ── esito ────────────────────────────────────────────────────────────────────
h('Esito');
if (errors.length) note('errori di pagina', errors.slice(0, 5));
console.log(`\n  ${pass} PASS  ${fail} FAIL\n`);
await browser.close();
process.exit(fail === 0 ? 0 : 1);
