/**
 * probe_2026-09-09_estensione_perimetro_validato — `X.instances` dentro una regola vede
 * il modello che si sta validando, o il progetto? (R-VAL-15, spec §8.2)
 *
 * VERIFICA BLOCCANTE prima dello Step 4, e READ-ONLY: nessun file di codice toccato.
 * La domanda ha una risposta sola e un caso di prova solo, quello che la spec §8.2
 * prescrive — due modelli della stessa lingua nello stesso progetto, uno stato iniziale
 * ciascuno, e la prima invariante della Tabella 7.5 del libro:
 *
 *     (forall s in State.instances such that s.isInitial).size == 1
 *
 * Se l'estensione che la quantificazione attraversa e' il PROGETTO, quella regola conta
 * due stati iniziali su due macchine a stati sane e dichiara violate entrambe. Non e' un
 * caso di laboratorio: il progetto di prova su beta contiene undici modelli target.
 *
 * ── Che cosa misura, e perche' ciascun blocco esiste ─────────────────────────
 *
 *  A. LA FIXTURE, DUE MACCHINE SANE. Due modelli M1 dello stesso metamodello, due stati
 *     ciascuno, uno iniziale per modello. Costruita a tappe con un'attesa fra l'una e
 *     l'altra: misurato allo Step 3 che scrivendola in un `evaluate` solo il commit
 *     differito rende `addObject` inerte (CLAUDE.md §9.2).
 *
 *  B. L'ESTENSIONE, MISURATA DIRETTAMENTE. Una regola il cui corpo e' `State.instances.size
 *     == 2` risponde alla domanda con un numero invece che con un'inferenza: due e'
 *     l'estensione del modello aperto, quattro e' quella del progetto. Sta prima della
 *     verifica della spec perche' se questa cade, il perche' della prossima e' gia'
 *     spiegato.
 *
 *  C. LA VERIFICA DELLA SPEC. La prima invariante del libro, sul modello aperto. Deve NON
 *     violare. E' l'enunciato che R-VAL-15 chiede di misurare, alla lettera.
 *
 *  E. CHE COSA UNA CORREZIONE NON DEVE ROMPERE. `buildEvalContext` lega le classi per
 *     nome e fa in modo che `self.instanceOf == State` sia vero PER IDENTITA' di
 *     riferimento: la shell della classe legata al nome e' lo stesso oggetto che
 *     l'handle dell'istanza punta. Qualunque restrizione dell'estensione che ricostruisca
 *     le shell invece di modificarle sul posto romperebbe quell'uguaglianza in silenzio.
 *     La misura sta qui, PRIMA della correzione, perche' un invariante misurato solo dopo
 *     non dice se era vero prima.
 *
 *  D. IL CONTROLLO POSITIVO, e DISCRIMINA (P12). Una terza regola, `isInitial`, che DEVE
 *     violare su uno dei due stati del modello aperto — quello non iniziale — e su
 *     nessun altro. Senza, «zero violazioni» al blocco C sarebbe indistinguibile da un
 *     comando che non ha valutato niente, e da regole che non si applicano a nessuna
 *     istanza. Il controllo dice tre cose in una: il comando ha girato, ha visto le
 *     istanze del modello aperto, e NON ha visto quelle dell'altro (altrimenti le
 *     violazioni sarebbero due).
 *
 * ── Che cosa NON prova ───────────────────────────────────────────────────────
 *
 * Non prova niente sul resto del contesto — le classi del metamodello, la risoluzione dei
 * nomi — che la spec lascia esplicitamente di progetto. Il soggetto e' l'ESTENSIONE, cioe'
 * l'insieme che una quantificazione attraversa, e nient'altro. E non corregge niente: se
 * la misura e' rossa, la correzione tocca `buildEvalContext`, che e' condiviso con la
 * console, JjScript e Jjodie, e si decide fuori da qui.
 *
 * Con il dev server su (P8: porta 3000, non 3001):
 *   cd frontend && npx tsx ../docs/discovery/harness/probe_2026-09-09_estensione_perimetro_validato.mts
 */
import playwright from '../../../frontend/node_modules/@playwright/test/index.js';
const { chromium } = playwright as unknown as typeof import('@playwright/test');
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { BASE_URL, NAV_MS, SETTLE_MS, createProject, seed } from '../../../frontend/scripts/smoke/states.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const shot = (n: string) => resolve(HERE, `_tmp_ext_${n}.png`);

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
const pid = await createProject(page, `Smoke_EXT_${Date.now()}`);
if (!pid) { console.log('FIXTURE FAILED: createProject'); await browser.close(); process.exit(1); }
await page.goto(`${BASE_URL}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(NAV_MS + SETTLE_MS);

// ── A ────────────────────────────────────────────────────────────────────────
h('A. Due macchine a stati sane nello stesso progetto');

const s1 = await page.evaluate(() => {
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
if (!s1.ok) { console.log('FIXTURE FAILED: ' + (s1 as any).error); await browser.close(); process.exit(1); }
await page.waitForTimeout(COMMIT_MS);

await page.evaluate((cls: string) => {
    (window as any).LPointerTargetable.fromPointer(cls).addAttribute('isInitial', 'Pointer_EBOOLEAN');
}, s1.stateClass);
await page.waitForTimeout(COMMIT_MS);

const models = await page.evaluate((m2: string) => {
    const w = window as any;
    const project = w.LProject.getProject();
    const a = w.DModel.new('SM_A', m2, false);
    const b = w.DModel.new('SM_B', m2, false);
    w.SetFieldAction.new(project.id, 'models', a.id, '+=', true);
    w.SetFieldAction.new(project.id, 'models', b.id, '+=', true);
    return { a: a.id, b: b.id };
}, s1.m2);
await page.waitForTimeout(COMMIT_MS);

await page.evaluate(([a, b, cls]: string[]) => {
    const w = window as any;
    const lCls = w.LPointerTargetable.fromPointer(cls);
    for (const m of [a, b]) {
        const lm = w.LPointerTargetable.fromPointer(m);
        lm.addObject({}, lCls);
        lm.addObject({}, lCls);
    }
}, [models.a, models.b, s1.stateClass] as any);
await page.waitForTimeout(COMMIT_MS * 2);

// Uno stato iniziale per modello, scritto ESPLICITAMENTE su tutti e quattro: uno slot
// mai scritto vale `null` e non `false` (misurato allo Step 3), e un `null` in mezzo
// renderebbe il conto ambiguo proprio dove il conto e' il soggetto.
await page.evaluate(([a, b]: string[]) => {
    const w = window as any;
    for (const m of [a, b]) {
        const lm = w.LPointerTargetable.fromPointer(m);
        const objs = (lm?.allSubObjects ?? lm?.objects ?? []) as any[];
        if (objs[0]) objs[0]['$isInitial'].value = true;
        if (objs[1]) objs[1]['$isInitial'].value = false;
    }
}, [models.a, models.b] as any);
await page.waitForTimeout(COMMIT_MS);

const fixture = await page.evaluate(([a, b]: string[]) => {
    const w = window as any;
    const read = (m: string) => {
        const lm = w.LPointerTargetable.fromPointer(m);
        const objs = (lm?.allSubObjects ?? lm?.objects ?? []) as any[];
        return objs.map((o: any) => { try { return o['$isInitial']?.value ?? null; } catch { return 'throw'; } });
    };
    return { SM_A: read(a), SM_B: read(b) };
}, [models.a, models.b] as any);
note('isInitial per modello', fixture);
check('due modelli, due stati ciascuno, ESATTAMENTE uno iniziale per modello',
    JSON.stringify(fixture.SM_A) === JSON.stringify([true, false]) &&
    JSON.stringify(fixture.SM_B) === JSON.stringify([true, false]),
    JSON.stringify(fixture));

// ── Le tre regole ────────────────────────────────────────────────────────────
await page.evaluate(([VP_ID, cls]: string[]) => {
    const w = window as any;
    w.DValidationViewpoint.new();
    // B — l'estensione, misurata come numero.
    w.DValidationRule.new(VP_ID, 'extentIsTheModel', cls, 'State.instances.size == 2',
        'State.instances non ha la cardinalita\' del modello aperto');
    // C — la verifica della spec: la prima invariante della Tabella 7.5.
    w.DValidationRule.new(VP_ID, 'oneInitialState', cls,
        '(forall s in State.instances such that s.isInitial).size == 1',
        'esattamente uno stato iniziale');
    // D — il controllo positivo: deve violare su UNO solo dei due stati del modello aperto.
    w.DValidationRule.new(VP_ID, 'controlIsInitial', cls, 'isInitial',
        'controllo positivo: questo stato non e\' iniziale');
    // E — l'invariante di identita' che una correzione non deve rompere.
    w.DValidationRule.new(VP_ID, 'identityHolds', cls, 'self.instanceOf == State',
        'la shell della classe non e\' piu\' lo stesso oggetto');
}, [VP_ID, s1.stateClass] as any);
await page.waitForTimeout(COMMIT_MS);

// ── Il comando, sul modello aperto ───────────────────────────────────────────
h('Il comando «Validate» su SM_A');

await page.evaluate(async (m: string) => {
    const w = window as any;
    await w.DockManager.open2(w.LPointerTargetable.fromPointer(m));
}, models.a);
await page.waitForTimeout(NAV_MS);

const btn = page.locator('button[title="Validate the open model against the active rules"]');
if (await btn.count() !== 1) { console.log('FIXTURE FAILED: nessun bottone Validate'); await browser.close(); process.exit(1); }
await btn.first().click();
await page.waitForTimeout(SETTLE_MS);

const modal = await page.evaluate(() => {
    const root = document.querySelector('.validation-results');
    if (!root) return null;
    return {
        title: root.querySelector('.validation-results__title')?.textContent ?? '',
        stats: Array.from(root.querySelectorAll('.validation-results__stat')).map(s => ({
            value: s.querySelector('.validation-results__stat-value')?.textContent ?? '',
            label: s.querySelector('.validation-results__stat-label')?.textContent ?? '',
        })),
        meta: root.querySelector('.validation-results__meta')?.textContent ?? '',
        items: Array.from(root.querySelectorAll('.validation-results__item-btn')).map(i => ({
            element: i.querySelector('.validation-results__item-element')?.textContent ?? '',
            rule: i.querySelector('.validation-results__item-rule')?.textContent ?? '',
        })),
    };
});
note('il modale', modal);
await page.screenshot({ path: shot('a_modal') });
const byRule = (n: string) => (modal?.items ?? []).filter(i => i.rule === n);

// ── D, per primo: senza il controllo, i due blocchi sopra non dicono niente ──
h('D. Il controllo positivo, che DISCRIMINA (P12)');
check('`isInitial` viola su UNO solo dei due stati del modello aperto: il comando ha girato, ha visto SM_A, e NON ha visto SM_B',
    byRule('controlIsInitial').length === 1,
    `violazioni di controlIsInitial = ${byRule('controlIsInitial').length} `
    + `(0 = non ha valutato; 1 = ha visto solo SM_A; 2 = ha visto anche SM_B)`);

// ── B ────────────────────────────────────────────────────────────────────────
h('B. L\'estensione, misurata come numero');
const extentOk = byRule('extentIsTheModel').length === 0;
check('`State.instances.size == 2` tiene: l\'estensione e\' quella del MODELLO aperto',
    extentOk,
    extentOk
        ? 'nessuna violazione: State.instances ha 2 elementi, cioe\' gli stati di SM_A'
        : `violata su ${byRule('extentIsTheModel').length} istanze: State.instances NON ha 2 elementi. `
          + 'Con due modelli da due stati, il valore che spiega la violazione e\' 4, cioe\' il PROGETTO.');

// ── C ────────────────────────────────────────────────────────────────────────
h('C. La verifica della spec §8.2: la prima invariante del libro non deve violare');
const invOk = byRule('oneInitialState').length === 0;
check('`(forall s in State.instances such that s.isInitial).size == 1` NON viola',
    invOk,
    invOk
        ? 'zero violazioni, ed e\' un vero zero: il controllo positivo qui sopra ne ha prodotta una'
        : `VIOLATA su ${byRule('oneInitialState').length} istanze di un modello che ha UN solo stato iniziale. `
          + 'L\'estensione attraversata e\' il progetto, non il modello validato.');

// ── E ────────────────────────────────────────────────────────────────────────
h('E. L\'invariante di identita\', misurato PRIMA di qualunque correzione');
const identityOk = byRule('identityHolds').length === 0;
check('`self.instanceOf == State` tiene per identita\' di riferimento',
    identityOk,
    identityOk
        ? 'nessuna violazione: la shell legata al nome e\' lo stesso oggetto che l\'istanza punta — '
          + 'una correzione che ricostruisca le shell invece di modificarle sul posto lo romperebbe'
        : `violata su ${byRule('identityHolds').length} istanze: l'uguaglianza per identita' NON tiene gia' oggi`);

// ── Esito ────────────────────────────────────────────────────────────────────
h('ESITO');
if (errors.length) console.log('  pageerror raccolti:\n' + errors.map(e => '        ' + e).join('\n'));
check('nessun errore di pagina in tutto il giro', errors.length === 0, `${errors.length} pageerror`);
console.log(`\n  ${pass} PASS   ${fail} FAIL`);
await browser.close();
if (fail > 0) process.exitCode = 1;
