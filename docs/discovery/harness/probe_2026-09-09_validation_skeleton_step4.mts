/**
 * probe_2026-09-09_validation_skeleton_step4 — l'ambiente di authoring delle regole,
 * guidato come lo guiderebbe l'utente.
 *
 * I test unitari coprono la partizione fra proprie ed ereditate e il nome di partenza;
 * quello che nessun test unitario raggiunge e' il resto: che il bottone apra, che le
 * classi si vedano, che «New rule» scriva davvero nel D-layer, che i campi tornino
 * indietro nel modello, che le ereditate siano visibili e NON modificabili, e che la
 * cancellazione tolga la regola da tutte e due le meta' del legame.
 *
 * ── Che cosa misura, e perche' ciascun blocco esiste ─────────────────────────
 *
 *  A. LA FIXTURE, CON UNA GERARCHIA VERA. `Derived extends Base`, una regola su ciascuna.
 *     La gerarchia non e' un ornamento: senza, il blocco C non ha niente da mostrare in
 *     sola lettura e la decisione R-VAL-12 resta non provata dove si vede.
 *
 *  B. IL GIRO DI SCRITTURA COMPLETO. «New rule» dal bottone, poi nome, corpo e messaggio
 *     scritti nel form e riletti da `idlookup`. Si legge il D-LAYER e non il form: un
 *     form che mostra quello che ha in pancia e' d'accordo con se' stesso anche quando non
 *     scrive niente.
 *
 *  C. LE EREDITATE SI VEDONO E NON SI TOCCANO (R-VAL-12). Sulla sottoclasse devono
 *     comparire in una sezione propria, dichiarare da quale superclasse arrivano, e NON
 *     essere selezionabili: se lo fossero, l'interfaccia suggerirebbe un override che la
 *     decisione esclude.
 *
 *  D. IL CONTESTO DICHIARATO. `self: <Classe>` sopra il corpo, sempre. E' parte del
 *     significato della regola, non della selezione corrente.
 *
 *  E. LA CANCELLAZIONE TOGLIE ENTRAMBE LE META'. Dopo la conferma, la regola non e' piu'
 *     in `idlookup` **e** non e' piu' nella collezione del viewpoint. Una sola delle due
 *     lascia un puntatore a un oggetto che non c'e' o un oggetto che nessuno raggiunge, e
 *     dall'interfaccia le due cose si vedono uguali.
 *
 *  F. IL CONTROLLO POSITIVO, e DISCRIMINA (P12). Su `Base` — la superclasse — la sezione
 *     delle ereditate NON deve esistere, e la sua regola deve comparire fra le proprie.
 *     Senza questo confronto, «le ereditate ci sono» al blocco C sarebbe indistinguibile
 *     da un pannello che mostra tutte le regole a tutte le classi.
 *
 * ── Che cosa NON prova ───────────────────────────────────────────────────────
 *
 * Non prova niente su cio' che lo scheletro dichiara fuori: controllo statico dei nomi,
 * avviso sui nomi riservati, controesempi dal vivo, segnaposto nel messaggio, severita',
 * piu' viewpoint. E non prova la resa di Monaco oltre alla sua presenza: il corpo si
 * scrive attraverso l'editor e si rilegge dal modello, che e' l'unica cosa che conta qui.
 *
 * Con il dev server su (P8: porta 3000, non 3001):
 *   cd frontend && npx tsx ../docs/discovery/harness/probe_2026-09-09_validation_skeleton_step4.mts
 */
import playwright from '../../../frontend/node_modules/@playwright/test/index.js';
const { chromium } = playwright as unknown as typeof import('@playwright/test');
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { BASE_URL, NAV_MS, SETTLE_MS, createProject, seed } from '../../../frontend/scripts/smoke/states.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const shot = (n: string) => resolve(HERE, `_tmp_val4_${n}.png`);

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
await seed(ctx, true);   // advanced = true: l'ambiente vive li' (spec §7)
const page = await ctx.newPage();
const errors: string[] = [];
page.on('pageerror', (e) => errors.push(e.message));

await page.goto(`${BASE_URL}/all-projects`, { waitUntil: 'domcontentloaded', timeout: NAV_MS });
await page.waitForTimeout(SETTLE_MS);
const pid = await createProject(page, `Smoke_VAL4_${Date.now()}`);
if (!pid) { console.log('FIXTURE FAILED: createProject'); await browser.close(); process.exit(1); }
await page.goto(`${BASE_URL}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(NAV_MS + SETTLE_MS);

// ── A ────────────────────────────────────────────────────────────────────────
h('A. La fixture: Derived extends Base, una regola per classe');

const s1 = await page.evaluate(() => {
    const w = window as any;
    const project = w.LProject.getProject();
    if (!project) return { ok: false as const, error: 'no project' };
    const dM2 = w.DModel.new('AuthMM', undefined, true);
    const lM2 = w.LModel.fromD(dM2);
    w.SetFieldAction.new(project.id, 'metamodels', lM2.id, '+=', true);
    const lPkg = w.LPackage.fromD(lM2.addChild('package'));
    lPkg.name = 'auth';
    const base = w.LClass.fromD(lPkg.addClass('Base'));
    const derived = w.LClass.fromD(lPkg.addClass('Derived'));
    return { ok: true as const, m2: dM2.id, base: base.id, derived: derived.id };
});
if (!s1.ok) { console.log('FIXTURE FAILED: ' + (s1 as any).error); await browser.close(); process.exit(1); }
await page.waitForTimeout(COMMIT_MS);

await page.evaluate(([base, derived]: string[]) => {
    const w = window as any;
    w.LPointerTargetable.fromPointer(derived).addExtend(w.LPointerTargetable.fromPointer(base));
}, [s1.base, s1.derived] as any);
await page.waitForTimeout(COMMIT_MS);

await page.evaluate(([VP_ID, base, derived]: string[]) => {
    const w = window as any;
    w.DValidationViewpoint.new();
    w.DValidationRule.new(VP_ID, 'fromBase', base, 'true', 'regola della superclasse');
    w.DValidationRule.new(VP_ID, 'fromDerived', derived, 'true', 'regola della sottoclasse');
}, [VP_ID, s1.base, s1.derived] as any);
await page.waitForTimeout(COMMIT_MS);

const fixture = await page.evaluate(([base, derived, VP_ID]: string[]) => {
    const idl = (window as any).store.getState().idlookup;
    return {
        derivedExtends: idl[derived]?.extends ?? [],
        baseId: base,
        rules: (idl[VP_ID]?.rules ?? []).map((r: string) => ({ name: idl[r]?.name, ctx: idl[r]?.context })),
    };
}, [s1.base, s1.derived, VP_ID] as any);
note('gerarchia e regole', fixture);
check('Derived estende Base, e c\'e\' una regola per classe',
    fixture.derivedExtends.includes(fixture.baseId) && fixture.rules.length === 2,
    JSON.stringify(fixture));

// ── Apertura dell'ambiente, dal BOTTONE ──────────────────────────────────────
h('L\'ambiente si apre dal bottone della toolbar del metamodello');

await page.evaluate(async (m2: string) => {
    const w = window as any;
    await w.DockManager.open2(w.LPointerTargetable.fromPointer(m2));
}, s1.m2);
await page.waitForTimeout(NAV_MS);

const rulesBtn = page.locator('button[title="Validation rules of this metamodel"]:visible');
check('il bottone e\' sulla toolbar del metamodello in Advanced', await rulesBtn.count() === 1,
    `${await rulesBtn.count()} bottoni visibili`);
await rulesBtn.first().click();
await page.waitForTimeout(SETTLE_MS);
await page.screenshot({ path: shot('a_open') });

const opened = await page.evaluate(() => {
    const root = document.querySelector('.validation-rules');
    if (!root) return null;
    return {
        title: root.querySelector('.validation-rules__title')?.textContent ?? '',
        classes: Array.from(root.querySelectorAll('.validation-rules__class-name')).map(e => e.textContent),
    };
});
note('il modale aperto', opened);
check('mostra le classi del metamodello', !!opened && opened.classes.join(',') === 'Base,Derived',
    `classi = ${JSON.stringify(opened?.classes)}`);

// ── C + F ────────────────────────────────────────────────────────────────────
h('C. Le ereditate si vedono e non si toccano   (+ F, controllo positivo su Base)');

const readPane = () => page.evaluate(() => {
    const root = document.querySelector('.validation-rules');
    if (!root) return null;
    const inheritedBlock = root.querySelector('.validation-rules__inherited');
    return {
        own: Array.from(root.querySelectorAll('button.validation-rules__rule .validation-rules__rule-name')).map(e => e.textContent),
        inherited: Array.from(root.querySelectorAll('.validation-rules__rule--inherited')).map(li => ({
            name: li.querySelector('.validation-rules__rule-name')?.textContent ?? '',
            from: li.querySelector('.validation-rules__rule-from')?.textContent ?? '',
            isButton: li.tagName.toLowerCase() === 'button',
        })),
        hasInheritedBlock: !!inheritedBlock,
    };
});

await page.locator('.validation-rules__class', { hasText: 'Derived' }).first().click();
await page.waitForTimeout(500);
const onDerived = await readPane();
note('pannello su Derived', onDerived);
check('su Derived: una propria, una ereditata che dichiara da dove viene',
    !!onDerived && onDerived.own.length === 1 && onDerived.own[0] === 'fromDerived' &&
    onDerived.inherited.length === 1 && onDerived.inherited[0].name === 'fromBase' &&
    onDerived.inherited[0].from.includes('Base'),
    JSON.stringify(onDerived));
check('l\'ereditata NON e\' un bottone: non si seleziona e non si modifica',
    !!onDerived && onDerived.inherited[0].isButton === false,
    `tag della riga ereditata = ${onDerived?.inherited[0].isButton ? 'button' : 'non-button'}`);

await page.locator('.validation-rules__class', { hasText: 'Base' }).first().click();
await page.waitForTimeout(500);
const onBase = await readPane();
note('pannello su Base', onBase);
check('F  su Base non c\'e\' nessuna sezione di ereditate, e la sua regola e\' fra le proprie',
    !!onBase && onBase.hasInheritedBlock === false &&
    onBase.own.length === 1 && onBase.own[0] === 'fromBase',
    JSON.stringify(onBase));

// ── B + D ────────────────────────────────────────────────────────────────────
h('B. Il giro di scrittura, riletto dal D-layer   (+ D, il contesto dichiarato)');

await page.locator('.validation-rules__class', { hasText: 'Derived' }).first().click();
await page.waitForTimeout(400);
await page.locator('.validation-rules__new').first().click();
await page.waitForTimeout(COMMIT_MS);

const created = await page.evaluate((VP_ID: string) => {
    const idl = (window as any).store.getState().idlookup;
    const rules = (idl[VP_ID]?.rules ?? []).map((r: string) => ({ id: r, name: idl[r]?.name, ctx: idl[r]?.context }));
    return { count: rules.length, names: rules.map((r: any) => r.name), last: rules[rules.length - 1] };
}, VP_ID);
note('dopo «New rule»', created);
check('la regola nuova esiste nel D-layer con un nome di partenza libero',
    created.count === 3 && created.last.name === 'rule_0' && created.last.ctx === s1.derived,
    JSON.stringify(created));

const ctxLine = await page.evaluate(() =>
    document.querySelector('.validation-rules__context')?.textContent ?? '');
note('la riga del contesto', ctxLine);
check('D  il contesto e\' dichiarato sopra il corpo: `self: Derived`',
    ctxLine.trim() === 'self: Derived', `letto: «${ctxLine}»`);

// Nome, corpo, messaggio: scritti nel form, riletti dal modello.
await page.locator('.validation-rules__input').first().fill('mustBeSomething');
await page.locator('.validation-rules__input--wide').first().click();   // il blur scrive
await page.waitForTimeout(COMMIT_MS);
await page.locator('.validation-rules__input--wide').first().fill('non va bene');
await page.locator('.validation-rules__input').first().click();
await page.waitForTimeout(COMMIT_MS);

// Il corpo passa da Monaco: si scrive nell'editor e si perde il fuoco. Il click e'
// `force`, perche' Monaco copre la propria textarea con il riquadro della riga corrente e
// Playwright rifiuta un click «intercettato» — misurato in questo giro, con un timeout su
// un elemento visibile e abilitato. La textarea resta il bersaglio giusto: e' li' che va
// il testo digitato.
await page.locator('.validation-rules__monaco .monaco-editor textarea').first().click({ force: true });
await page.keyboard.type('ownedThings.all(x => x.ok)');
await page.locator('.validation-rules__input').first().click();
await page.waitForTimeout(COMMIT_MS);
await page.screenshot({ path: shot('b_written') });

const written = await page.evaluate((rid: string) => {
    const d = (window as any).store.getState().idlookup[rid];
    return d && { name: d.name, body: d.body, message: d.message, enabled: d.enabled, context: d.context };
}, created.last.id);
note('la regola riletta dal D-layer', written);
check('nome, corpo e messaggio sono arrivati nel modello, non solo nel form',
    !!written && written.name === 'mustBeSomething' && written.message === 'non va bene' &&
    String(written.body).includes('ownedThings.all(x => x.ok)') && written.enabled === true,
    JSON.stringify(written));

// ── E ────────────────────────────────────────────────────────────────────────
h('E. La cancellazione toglie ENTRAMBE le meta\' del legame');

await page.locator('.validation-rules__delete').first().click();
await page.waitForTimeout(400);
await page.screenshot({ path: shot('c_confirm') });
const confirmBtn = page.locator('.confirm-dialog button', { hasText: 'Delete' });
const confirmCount = await confirmBtn.count();
check('la cancellazione chiede conferma invece di eseguire subito', confirmCount >= 1,
    `bottoni di conferma trovati = ${confirmCount}`);
await confirmBtn.first().click();
await page.waitForTimeout(COMMIT_MS);

const deleted = await page.evaluate(([rid, VP_ID]: string[]) => {
    const idl = (window as any).store.getState().idlookup;
    return {
        inLookup: !!idl[rid],
        inViewpoint: (idl[VP_ID]?.rules ?? []).includes(rid),
        restanti: (idl[VP_ID]?.rules ?? []).map((r: string) => idl[r]?.name),
    };
}, [created.last.id, VP_ID] as any);
note('dopo la cancellazione', deleted);
check('la regola non e\' piu\' in idlookup NE\' nella collezione del viewpoint',
    deleted.inLookup === false && deleted.inViewpoint === false,
    JSON.stringify(deleted));
check('e le altre due sono rimaste: la cancellazione ha colpito una sola regola',
    deleted.restanti.length === 2, `restanti = ${JSON.stringify(deleted.restanti)}`);

// ── Esito ────────────────────────────────────────────────────────────────────
h('ESITO');
if (errors.length) console.log('  pageerror raccolti:\n' + errors.map(e => '        ' + e).join('\n'));
check('nessun errore di pagina in tutto il giro', errors.length === 0, `${errors.length} pageerror`);
console.log(`\n  ${pass} PASS   ${fail} FAIL`);
await browser.close();
if (fail > 0) process.exitCode = 1;
