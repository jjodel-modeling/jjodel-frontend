/**
 * probe_2026-09-09_ritiro_transitorio_verde — il ritiro delle voci di validazione passa
 * per il transitorio verde? (R-VAL-18)
 *
 * ── La domanda ───────────────────────────────────────────────────────────────
 *
 * R-VAL-18 ha escluso `markResolved` perche' il verde direbbe «l'hai sistemata» quando la
 * verita' e' «non l'ho piu' controllata». Se pero' il RITIRO attraversa lo stesso
 * transitorio, la decisione e' violata in pratica: il diagramma direbbe quella cosa falsa
 * per via grafica, per cinque secondi, e per di piu' sui nodi che violavano davvero.
 *
 * ── Come si misura, e perche' cosi' ──────────────────────────────────────────
 *
 * SI MISURA IL PIXEL, non il codice del registro (P11). Un campionatore installato nella
 * pagina PRIMA della modifica legge ogni 30 ms il colore calcolato di ogni pallino e le
 * sue classi, per sei secondi e mezzo, cioe' oltre i 5 s di `RESOLVED_TTL_MS`. La
 * finestra interessante e' fra la modifica e lo spegnimento, e campionare dopo non
 * proverebbe niente.
 *
 * IL CONTROLLO POSITIVO E' OBBLIGATORIO. «Nessun verde» e «il campionatore non ha mai
 * girato» producono la stessa uscita. Il controllo usa l'altro produttore del registro,
 * la conformance, che `markResolved` lo chiama davvero: si crea una violazione di
 * cardinalita', la si ripara, e lo STESSO campionatore sullo STESSO DOM deve vedere il
 * verde. Se non lo vede li', non ha visto niente nemmeno prima.
 *
 * Con il dev server su (P8: porta 3000, non 3001):
 *   cd frontend && npx tsx ../docs/discovery/harness/probe_2026-09-09_ritiro_transitorio_verde.mts
 */
import playwright from '../../../frontend/node_modules/@playwright/test/index.js';
const { chromium } = playwright as unknown as typeof import('@playwright/test');
import { BASE_URL, NAV_MS, SETTLE_MS, createProject, seed } from '../../../frontend/scripts/smoke/states.ts';

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
const CONFORMANCE_MS = 1600;
/** Oltre `RESOLVED_TTL_MS` (5000 ms) piu' un margine: la finestra da coprire per intero. */
const WINDOW_MS = 6500;
const SAMPLE_MS = 30;

/** Il verde del transitorio: `#22c55e` in `NodeProblemIndicator.scss`. */
const GREEN = 'rgb(34, 197, 94)';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1500, height: 950 } });
await ctx.addInitScript(() => {
    (window as any).__name = (f: any) => f;
    try {
        localStorage.setItem('jjodel_donation_banner',
            JSON.stringify({ lastShown: Date.now(), showCount: 4 }));
    } catch { /* niente */ }
});
await seed(ctx, true);
const page = await ctx.newPage();
const errors: string[] = [];
page.on('pageerror', (e) => errors.push(e.message));

await page.goto(`${BASE_URL}/all-projects`, { waitUntil: 'domcontentloaded', timeout: NAV_MS });
await page.waitForTimeout(SETTLE_MS);
const pid = await createProject(page, `Verde_${Date.now()}`);
if (!pid) { console.log('FIXTURE FAILED: createProject'); await browser.close(); process.exit(1); }
await page.goto(`${BASE_URL}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(NAV_MS + SETTLE_MS);

// ── il campionatore ──────────────────────────────────────────────────────────

/** Installa il campionatore. Da chiamare PRIMA del gesto che si vuole osservare. */
const armSampler = () => page.evaluate((ms: number) => {
    const w = window as any;
    if (w.__sampler) clearInterval(w.__sampler);
    w.__samples = [];
    const t0 = Date.now();
    w.__sampler = setInterval(() => {
        const dots = Array.from(document.querySelectorAll('.react-flow__node .node-problem-dot'));
        w.__samples.push({
            t: Date.now() - t0,
            dots: dots.map(d => ({
                bg: getComputedStyle(d as Element).backgroundColor,
                cls: Array.from((d as Element).classList).filter(c => c.startsWith('node-problem-dot--')).join(','),
            })),
        });
    }, ms);
}, SAMPLE_MS);

/** Ferma il campionatore e restituisce cio' che ha visto, gia' aggregato. */
const readSampler = (greenRgb: string) => page.evaluate((green: string) => {
    const w = window as any;
    if (w.__sampler) { clearInterval(w.__sampler); w.__sampler = null; }
    const samples = (w.__samples ?? []) as Array<{ t: number; dots: Array<{ bg: string; cls: string }> }>;
    const colours = new Set<string>();
    const classes = new Set<string>();
    let greenSamples = 0, firstGreenAt: number | null = null, lastNonEmptyAt: number | null = null;
    let maxDots = 0;
    for (const s of samples) {
        if (s.dots.length) lastNonEmptyAt = s.t;
        maxDots = Math.max(maxDots, s.dots.length);
        for (const d of s.dots) {
            colours.add(d.bg);
            if (d.cls) classes.add(d.cls);
            if (d.bg === green || /resolved/.test(d.cls)) {
                greenSamples++;
                if (firstGreenAt === null) firstGreenAt = s.t;
            }
        }
    }
    return {
        campioni: samples.length,
        durataMs: samples.length ? samples[samples.length - 1].t : 0,
        maxPallini: maxDots,
        coloriVisti: Array.from(colours),
        classiViste: Array.from(classes),
        campioniVerdi: greenSamples,
        primoVerdeMs: firstGreenAt,
        ultimoPallinoMs: lastNonEmptyAt,
    };
}, greenRgb);

// ── A. La fixture ────────────────────────────────────────────────────────────
h('A. La fixture: due istanze che violano una regola, e una transizione per il controllo');

const m2 = await page.evaluate(() => {
    const w = window as any;
    const project = w.LProject.getProject();
    if (!project) return { ok: false as const, error: 'no project' };
    const dM2 = w.DModel.new('SM', undefined, true);
    const lM2 = w.LModel.fromD(dM2);
    w.SetFieldAction.new(project.id, 'metamodels', lM2.id, '+=', true);
    const lPkg = w.LPackage.fromD(lM2.addChild('package'));
    lPkg.name = 'sm';
    const state = w.LClass.fromD(lPkg.addClass('State'));
    const transition = w.LClass.fromD(lPkg.addClass('Transition'));
    return { ok: true as const, m2: dM2.id, state: state.id, transition: transition.id };
});
if (!m2.ok) { console.log('FIXTURE FAILED: ' + (m2 as any).error); await browser.close(); process.exit(1); }
await page.waitForTimeout(COMMIT_MS);

await page.evaluate((ids: any) => {
    const w = window as any;
    const L = (id: string) => w.LPointerTargetable.fromPointer(id);
    L(ids.state).addAttribute('isInitial', 'Pointer_EBOOLEAN');
    // `nextState` [1] serve al CONTROLLO POSITIVO: e' la violazione di conformance che
    // la riparazione fa passare per `markResolved`.
    const next = L(ids.transition).addReference('nextState', ids.state);
    next.lowerBound = 1; next.upperBound = 1;
}, m2);
await page.waitForTimeout(COMMIT_MS * 2);

const modelId = await page.evaluate((mm: string) => {
    const w = window as any;
    const project = w.LProject.getProject();
    const m = w.DModel.new('SM_1', mm, false);
    w.SetFieldAction.new(project.id, 'models', m.id, '+=', true);
    return m.id;
}, m2.m2);
await page.waitForTimeout(COMMIT_MS);

await page.evaluate((ids: any) => {
    const w = window as any;
    const lm = w.LPointerTargetable.fromPointer(ids.model);
    const S = w.LPointerTargetable.fromPointer(ids.state);
    for (let i = 0; i < 3; i++) lm.addObject({}, S);
}, { model: modelId, state: m2.state });
await page.waitForTimeout(COMMIT_MS * 2);

const m1 = await page.evaluate((mid: string) => {
    const w = window as any;
    const lm = w.LPointerTargetable.fromPointer(mid);
    const objs = ((lm?.allSubObjects ?? lm?.objects ?? []) as any[])
        .filter((o: any) => { try { return o.instanceof?.name === 'State'; } catch { return false; } });
    const names = ['Sano', 'Rotto1', 'Rotto2'];
    objs.forEach((o: any, i: number) => { o.name = names[i]; o['$isInitial'].value = i === 0; });
    return objs.map((o: any) => o.id);
}, modelId);
await page.waitForTimeout(COMMIT_MS);
note('le tre istanze', m1);

await page.evaluate(([vp, st]: string[]) => {
    const w = window as any;
    w.DValidationViewpoint.new();
    w.DValidationRule.new(vp, 'deveEssereIniziale', st, 'isInitial', 'questo stato non e\' iniziale');
}, [VP_ID, m2.state] as any);
await page.waitForTimeout(COMMIT_MS);

await page.evaluate(async (m: string) => {
    const w = window as any;
    await w.DockManager.open2(w.LPointerTargetable.fromPointer(m));
}, modelId);
await page.waitForTimeout(NAV_MS + SETTLE_MS);

const btn = page.locator('button[title="Validate the open model against the active rules"]:visible');
const closeModal = async () => {
    const x = page.locator('.validation-results__close:visible');
    if (await x.count()) { await x.first().click(); await page.waitForTimeout(SETTLE_MS); }
};
const dotsNow = () => page.evaluate(() =>
    document.querySelectorAll('.react-flow__node .node-problem-dot').length);

await btn.first().click();
await page.waitForTimeout(SETTLE_MS);
await closeModal();
const dopoValidate = await dotsNow();
note('pallini dopo Validate', dopoValidate);
check('la fixture e\' pronta: due pallini di violazione sul diagramma',
    dopoValidate === 2, `pallini = ${dopoValidate}`);
if (dopoValidate !== 2) { console.log('FIXTURE FAILED: senza pallini non c\'e\' finestra da campionare'); await browser.close(); process.exit(1); }

// ── B. LA MISURA ─────────────────────────────────────────────────────────────
h('B. Il ritiro: si campiona la finestra fra la modifica e lo spegnimento');

await armSampler();
await page.waitForTimeout(200);   // qualche campione PRIMA della modifica: i pallini rossi
await page.evaluate((oid: string) => {
    (window as any).LPointerTargetable.fromPointer(oid).name = 'Sano_rinominato';
}, m1[0]);
await page.waitForTimeout(WINDOW_MS);
const ritiro = await readSampler(GREEN);
note('la finestra del RITIRO', ritiro);

check('il campionatore ha davvero girato sulla finestra intera',
    ritiro.campioni > 150 && ritiro.durataMs > 6000,
    `${ritiro.campioni} campioni in ${ritiro.durataMs} ms`);
check('e ha visto i pallini prima che sparissero: la finestra non e\' vuota per costruzione',
    ritiro.maxPallini === 2, `pallini al massimo = ${ritiro.maxPallini}`);

const verdeNelRitiro = ritiro.campioniVerdi > 0;
check('IL RITIRO NON PASSA PER IL VERDE: nessun pallino verde e nessuna classe --resolved',
    !verdeNelRitiro,
    `campioni verdi = ${ritiro.campioniVerdi}, colori = ${JSON.stringify(ritiro.coloriVisti)}, classi = ${JSON.stringify(ritiro.classiViste)}`);
note('quando i pallini sono spariti (ms dall\'armamento)', ritiro.ultimoPallinoMs);

// ── C. IL CONTROLLO POSITIVO ─────────────────────────────────────────────────
h('C. Controllo positivo: lo stesso campionatore, su un ritiro che il verde lo usa');

// La conformance chiama `markResolved` quando una violazione e' riparata. Se il
// campionatore non vedesse il verde nemmeno qui, non avrebbe visto niente nemmeno sopra.
const before = await page.evaluate((mid: string) => {
    const lm = (window as any).LPointerTargetable.fromPointer(mid);
    return ((lm?.allSubObjects ?? lm?.objects ?? []) as any[]).map((o: any) => o.id);
}, modelId);
await page.evaluate((ids: any) => {
    const w = window as any;
    const lm = w.LPointerTargetable.fromPointer(ids.model);
    lm.addObject({}, w.LPointerTargetable.fromPointer(ids.transition));
}, { model: modelId, transition: m2.transition });
await page.waitForTimeout(COMMIT_MS * 2 + CONFORMANCE_MS);

const after = await page.evaluate((mid: string) => {
    const lm = (window as any).LPointerTargetable.fromPointer(mid);
    return ((lm?.allSubObjects ?? lm?.objects ?? []) as any[]).map((o: any) => o.id);
}, modelId);
const nuovi = after.filter((id: string) => !before.includes(id));
if (nuovi.length !== 1) { console.log('CONTROLLO FALLITO: transizione nuova non identificabile'); await browser.close(); process.exit(1); }
const tNew = nuovi[0];
await page.waitForTimeout(CONFORMANCE_MS);

const dotsConformance = await dotsNow();
note('pallini di conformance (transizione senza nextState)', dotsConformance);
check('il controllo ha il suo pallino da riparare',
    dotsConformance >= 1, `pallini = ${dotsConformance}`);

await armSampler();
await page.waitForTimeout(200);
await page.evaluate((d: any) => {
    (window as any).LPointerTargetable.fromPointer(d.t)['$nextState'].values = [d.state];
}, { t: tNew, state: m1[0] });
await page.waitForTimeout(WINDOW_MS);
const controllo = await readSampler(GREEN);
note('la finestra del CONTROLLO POSITIVO', controllo);

check('CONTROLLO POSITIVO: il campionatore VEDE il verde quando c\'e\'',
    controllo.campioniVerdi > 0,
    `campioni verdi = ${controllo.campioniVerdi}, primo a ${controllo.primoVerdeMs} ms, colori = ${JSON.stringify(controllo.coloriVisti)}, classi = ${JSON.stringify(controllo.classiViste)}`);

// ── esito ────────────────────────────────────────────────────────────────────
h('Esito');
if (errors.length) note('errori di pagina', errors.slice(0, 5));
console.log(`\n  RISPOSTA: il ritiro delle voci di validazione ${verdeNelRitiro ? 'PASSA' : 'NON passa'} per il transitorio verde.`);
console.log(`  ${pass} PASS  ${fail} FAIL\n`);
await browser.close();
process.exit(fail === 0 ? 0 : 1);
