/**
 * probe_2026-09-09_regola_senza_istanze — il quarto modo silenzioso, sull'app vera
 * (R-VAL-17, spec §8.4).
 *
 * Il caso e' quello trovato a mano il 2026-09-09, e si riproduce alla lettera: nel
 * metamodello delle macchine a stati `Initial` e' una sottoclasse di `State`, ma nel
 * modello i nodi chiamati «Initial» e «FInal» sono **istanze di `State` con quel nome**.
 * Una regola scritta su `Initial` non trova nulla a cui applicarsi, non viola, non e'
 * «non valutabile», e tace. L'utente ha scritto una regola giusta sulla classe sbagliata.
 *
 * ── Che cosa misura, e perche' ciascun blocco esiste ─────────────────────────
 *
 *  A. LA FIXTURE, COL DIFETTO DENTRO. Due istanze di `State` chiamate «Initial» e
 *     «FInal», e una classe `Initial` che estende `State` e non ha istanze. Costruita a
 *     tappe con un'attesa fra l'una e l'altra: scritta in un `evaluate` solo, il commit
 *     differito rende `addObject` inerte (CLAUDE.md §9.2).
 *
 *  B. IL CASO VERO, cioe' le DUE cose insieme. Una regola muta su `Initial` e una regola
 *     su `State` che viola davvero. Il modale deve dichiararle entrambe: l'elenco con la
 *     violazione, e la riga in fondo con la regola che non ha trovato istanze. La regola
 *     che viola e' anche il controllo positivo (P12) senza cui «una sola violazione»
 *     sarebbe indistinguibile da un comando che non ha valutato niente.
 *
 *  C. LA RIGA DI RIEPILOGO SOMMA, ed e' il posto dove il difetto si nasconde meglio:
 *     «2 rules over 2 instances» e' vero e non dice che una delle due non ha toccato
 *     niente. Si misura il testo, per avere il numero che la riga nuova serve a smentire.
 *
 *  D. LA RIGA DISCRIMINA (P12). Non basta vederla comparire: una riga sempre dipinta
 *     sarebbe indistinguibile da una riga corretta. Si sposta il contesto della regola
 *     muta da `Initial` a `State` — stessa regola, stesso corpo, stesso modale — e la
 *     riga deve SPARIRE, mentre le violazioni salgono. Costruire lo stato in cui la riga
 *     NON deve esserci e' l'unica prova che il conto e' un conto.
 *
 *  E. I TRE NUMERI RESTANO TRE. R-VAL-17 chiede una riga, non un quarto numero: la fila
 *     delle statistiche non deve essere cresciuta.
 *
 * ── Che cosa NON prova ───────────────────────────────────────────────────────
 *
 * Niente sulla copertura per regola — su quante istanze ciascuna e' stata valutata — che
 * e' la forma completa e appartiene alla fetta 1. Niente sul canvas: lo scheletro non ci
 * mette indicatori.
 *
 * Con il dev server su (P8: porta 3000, non 3001):
 *   cd frontend && npx tsx ../docs/discovery/harness/probe_2026-09-09_regola_senza_istanze.mts
 */
import playwright from '../../../frontend/node_modules/@playwright/test/index.js';
const { chromium } = playwright as unknown as typeof import('@playwright/test');
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { BASE_URL, NAV_MS, SETTLE_MS, createProject, seed } from '../../../frontend/scripts/smoke/states.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const shot = (n: string) => resolve(HERE, `_tmp_r17_${n}.png`);

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
const pid = await createProject(page, `Smoke_R17_${Date.now()}`);
if (!pid) { console.log('FIXTURE FAILED: createProject'); await browser.close(); process.exit(1); }
await page.goto(`${BASE_URL}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(NAV_MS + SETTLE_MS);

// ── A ────────────────────────────────────────────────────────────────────────
h('A. La fixture del caso vero: `Initial` e\' una CLASSE, e nel modello non ha istanze');

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
    const lInitial = w.LClass.fromD(lPkg.addClass('Initial'));
    return { ok: true as const, m2: dM2.id, stateClass: lState.id, initialClass: lInitial.id };
});
if (!m2.ok) { console.log('FIXTURE FAILED: ' + (m2 as any).error); await browser.close(); process.exit(1); }
await page.waitForTimeout(COMMIT_MS);

await page.evaluate(([st, ini]: string[]) => {
    const w = window as any;
    w.LPointerTargetable.fromPointer(st).addAttribute('isInitial', 'Pointer_EBOOLEAN');
    // `Initial` sottoclasse di `State`, come nel metamodello del caso vero.
    w.LPointerTargetable.fromPointer(ini).extends = [st];
}, [m2.stateClass, m2.initialClass] as any);
await page.waitForTimeout(COMMIT_MS);

const modelId = await page.evaluate((mm: string) => {
    const w = window as any;
    const project = w.LProject.getProject();
    const m = w.DModel.new('SM_1', mm, false);
    w.SetFieldAction.new(project.id, 'models', m.id, '+=', true);
    return m.id;
}, m2.m2);
await page.waitForTimeout(COMMIT_MS);

// Due istanze di `State`, chiamate «Initial» e «FInal»: e' esattamente il modello in cui
// il difetto e' stato trovato. Il nome coincide con quello della classe, l'istanza no.
await page.evaluate(([m, cls]: string[]) => {
    const w = window as any;
    const lCls = w.LPointerTargetable.fromPointer(cls);
    const lm = w.LPointerTargetable.fromPointer(m);
    lm.addObject({}, lCls);
    lm.addObject({}, lCls);
}, [modelId, m2.stateClass] as any);
await page.waitForTimeout(COMMIT_MS * 2);

await page.evaluate((m: string) => {
    const w = window as any;
    const lm = w.LPointerTargetable.fromPointer(m);
    const objs = (lm?.allSubObjects ?? lm?.objects ?? []) as any[];
    // Scritto ESPLICITAMENTE su entrambi: uno slot mai scritto vale `null` e non `false`.
    if (objs[0]) { objs[0].name = 'Initial'; objs[0]['$isInitial'].value = true; }
    if (objs[1]) { objs[1].name = 'FInal'; objs[1]['$isInitial'].value = false; }
}, modelId);
await page.waitForTimeout(COMMIT_MS);

const fixture = await page.evaluate(([m, ini]: string[]) => {
    const w = window as any;
    const lm = w.LPointerTargetable.fromPointer(m);
    const objs = (lm?.allSubObjects ?? lm?.objects ?? []) as any[];
    const lIni = w.LPointerTargetable.fromPointer(ini);
    let instancesOfInitial = -1;
    try { instancesOfInitial = (lIni.instances ?? []).length; } catch { /* misurato sotto dal conto */ }
    return {
        oggetti: objs.map((o: any) => {
            let cls = '';
            try { cls = o.instanceof?.name ?? ''; } catch { cls = '?'; }
            return { name: o.name, classe: cls, isInitial: (() => { try { return o['$isInitial']?.value ?? null; } catch { return 'throw'; } })() };
        }),
        instancesOfInitial,
    };
}, [modelId, m2.initialClass] as any);
note('il modello', fixture);
check('due istanze di `State` chiamate «Initial» e «FInal», e la classe `Initial` senza istanze',
    fixture.oggetti.length === 2 &&
    fixture.oggetti.every((o: any) => o.classe === 'State') &&
    fixture.oggetti.map((o: any) => o.name).join(',') === 'Initial,FInal' &&
    fixture.instancesOfInitial === 0,
    JSON.stringify(fixture));

// ── B ────────────────────────────────────────────────────────────────────────
h('B. Il caso vero: una regola MUTA su `Initial` insieme a una che VIOLA su `State`');

const rules = await page.evaluate(([vp, st, ini]: string[]) => {
    const w = window as any;
    w.DValidationViewpoint.new();
    // La regola muta: attiva, compila, scritta bene. Il corpo e' `false`, cioe'
    // violerebbe su OGNI istanza a cui si applicasse. Non si applica a nessuna.
    const muta = w.DValidationRule.new(vp, 'soloSuInitial', ini, 'false',
        'questa regola non ha mai girato');
    // Il controllo positivo: viola su «FInal», che non e' iniziale.
    const viola = w.DValidationRule.new(vp, 'deveEssereIniziale', st, 'isInitial',
        'questo stato non e\' iniziale');
    return { muta: muta.id, viola: viola.id };
}, [VP_ID, m2.stateClass, m2.initialClass] as any);
await page.waitForTimeout(COMMIT_MS);

await page.evaluate(async (m: string) => {
    const w = window as any;
    await w.DockManager.open2(w.LPointerTargetable.fromPointer(m));
}, modelId);
await page.waitForTimeout(NAV_MS);

/** Il bottone VISIBILE: con piu' tab aperte rc-dock impagina il pannello inattivo fuori
 *  schermo, e un `.first()` risolverebbe sul nascosto. */
const btn = page.locator('button[title="Validate the open model against the active rules"]:visible');
if (await btn.count() !== 1) {
    console.log('FIXTURE FAILED: bottoni Validate visibili = ' + await btn.count());
    await browser.close(); process.exit(1);
}

/** Il modale, letto per intero: i tre numeri, la riga di riepilogo, le voci e le righe in
 *  fondo. Le note si leggono per TESTO, non per posizione: la riga sul difetto di
 *  compilazione e questa convivono, e distinguerle per indice sarebbe fragile. */
const readModal = () => page.evaluate(() => {
    const root = document.querySelector('.validation-results');
    if (!root) return null;
    const notes = Array.from(root.querySelectorAll('.validation-results__note'))
        .map(n => (n.textContent ?? '').replace(/\s+/g, ' ').trim());
    return {
        title: root.querySelector('.validation-results__title')?.textContent ?? '',
        stats: Array.from(root.querySelectorAll('.validation-results__stat')).map(s => ({
            value: s.querySelector('.validation-results__stat-value')?.textContent ?? '',
            label: s.querySelector('.validation-results__stat-label')?.textContent ?? '',
        })),
        meta: (root.querySelector('.validation-results__meta')?.textContent ?? '').replace(/\s+/g, ' ').trim(),
        items: Array.from(root.querySelectorAll('.validation-results__item-btn')).map(i => ({
            element: i.querySelector('.validation-results__item-element')?.textContent ?? '',
            rule: i.querySelector('.validation-results__item-rule')?.textContent ?? '',
        })),
        notes,
    };
});

await btn.first().click();
await page.waitForTimeout(SETTLE_MS);
const modal = await readModal();
note('il modale', modal);
await page.screenshot({ path: shot('a_modale') });

const noteSenzaIstanze = (m: any) => (m?.notes ?? []).filter((t: string) => /found no instance to apply to/.test(t));
const byRule = (m: any, n: string) => (m?.items ?? []).filter((i: any) => i.rule === n);

check('il comando HA girato e ha visto le istanze: `deveEssereIniziale` viola su «FInal», e su nessun altro',
    byRule(modal, 'deveEssereIniziale').length === 1 &&
    byRule(modal, 'deveEssereIniziale')[0].element === 'FInal',
    `violazioni = ${JSON.stringify(modal?.items)}`);

check('la regola muta NON produce violazioni — e infatti e\' il difetto: tace',
    byRule(modal, 'soloSuInitial').length === 0,
    `violazioni di soloSuInitial = ${byRule(modal, 'soloSuInitial').length} (il suo corpo e' \`false\`: se si applicasse, violerebbe su tutto)`);

check('IL MODALE DICHIARA ENTRAMBE LE COSE: la violazione nell\'elenco, e la regola senza istanze nella riga in fondo',
    byRule(modal, 'deveEssereIniziale').length === 1 && noteSenzaIstanze(modal).length === 1 &&
    /\b1 rule\b/.test(noteSenzaIstanze(modal)[0]),
    `riga = ${JSON.stringify(noteSenzaIstanze(modal))}`);

// ── C ────────────────────────────────────────────────────────────────────────
h('C. La riga di riepilogo somma, ed e\' li\' che il difetto si nascondeva');
note('la riga di riepilogo', modal?.meta);
check('«2 rules over 2 instances»: vera, e muta sul fatto che una delle due non ha toccato niente',
    /2 rules over 2 instances/.test(modal?.meta ?? ''),
    modal?.meta ?? '(assente)');

// ── E ────────────────────────────────────────────────────────────────────────
h('E. I tre numeri restano TRE: una riga, non un quarto numero');
check('la fila delle statistiche ha esattamente tre voci',
    (modal?.stats ?? []).length === 3,
    JSON.stringify(modal?.stats));

// ── D ────────────────────────────────────────────────────────────────────────
h('D. La riga DISCRIMINA: spostata la regola su `State`, deve sparire');

await page.evaluate(() => { document.querySelector<HTMLElement>('.validation-results__close')?.click(); });
await page.waitForTimeout(500);
// Stessa regola, stesso corpo, stesso modello: cambia solo il contesto, da una classe
// senza istanze a una che ne ha due.
await page.evaluate(([rid, st]: string[]) => {
    (window as any).SetFieldAction.new(rid, 'context', st, '', true);
}, [rules.muta, m2.stateClass] as any);
await page.waitForTimeout(COMMIT_MS);

await btn.first().click();
await page.waitForTimeout(SETTLE_MS);
const dopo = await readModal();
note('il modale con la regola spostata su `State`', dopo);
await page.screenshot({ path: shot('b_discrimina') });

check('la riga SPARISCE quando nessuna regola resta senza istanze — non e\' una riga sempre dipinta',
    noteSenzaIstanze(dopo).length === 0,
    `righe «found no instance» = ${JSON.stringify(noteSenzaIstanze(dopo))}`);
check('e la stessa regola, ora applicata, viola su entrambe le istanze: il corpo era `false` dall\'inizio',
    byRule(dopo, 'soloSuInitial').length === 2,
    `violazioni di soloSuInitial = ${byRule(dopo, 'soloSuInitial').length}, totali = ${(dopo?.items ?? []).length}`);

// ── Esito ────────────────────────────────────────────────────────────────────
h('ESITO');
if (errors.length) console.log('  pageerror raccolti:\n' + errors.map(e => '        ' + e).join('\n'));
check('nessun errore di pagina in tutto il giro', errors.length === 0, `${errors.length} pageerror`);
console.log(`\n  ${pass} PASS   ${fail} FAIL`);
await browser.close();
if (fail > 0) process.exitCode = 1;
