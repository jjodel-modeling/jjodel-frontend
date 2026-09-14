import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * A3 — `DModel.new` non lascia piu' passare un nome gia' preso.
 *
 * Perche' statici e non di comportamento: ne' `joiner/classes.ts` ne'
 * `model/logicWrapper/LModelElement.tsx` sono importabili sotto il banco del repo
 * (`environment: 'node'`): entrambi muoiono con `window is not defined` attraverso la
 * barrel `joiner`. Rimisurato il 2026-09-12 con una config che rispecchia
 * `frontend/vitest.config.ts`, e con il controllo positivo che rende la misura tale:
 * `jjscript/executor/resolvers` importa senza errori dallo stesso banco.
 * Stessa ragione — e stessa forma — di `model/__tests__/getByNameKey.test.ts`.
 *
 * Ricopiare qui l'algoritmo per eseguirlo misurerebbe la copia, non il soggetto. La prova
 * di comportamento e' la sonda citata nella entry di log: 7 casi sulla funzione vera,
 * `A` -> `A (1)` -> `A (2)`.
 *
 * Il difetto: `LModel.set_name` rifiuta un nome di modello gia' preso da sempre, ma
 * `DModel.new` scriveva il nome scelto dal chiamante senza alcun controllo — importare due
 * volte lo stesso .ecore produceva due metamodelli omonimi in silenzio. Misurato in
 * `docs/discovery/discovery_2026-09-11_name_resolution_scope.md` §2.1 (R4).
 */

const CLASSES_TS = path.resolve(__dirname, '../classes.ts');
const LME_TSX = path.resolve(__dirname, '../../model/logicWrapper/LModelElement.tsx');

const classesSource = fs.readFileSync(CLASSES_TS, 'utf8');
const lmeSource = fs.readFileSync(LME_TSX, 'utf8');

/** Il corpo del solo `uniqueModelName`, dalla firma alla chiusura del metodo. */
function uniqueBody(): string {
    const start = classesSource.indexOf('    static uniqueModelName(requested: string, taken: string[]): string {');
    expect(start, 'la firma di uniqueModelName e\' cambiata: aggiorna il test').toBeGreaterThan(-1);
    const next = classesSource.indexOf('\n    }', start);
    expect(next).toBeGreaterThan(start);
    return classesSource.slice(start, next);
}

/** Il corpo di uno dei tre punti d'ingresso di DModel, dalla firma al `return`. */
function dmodelEntryBody(signature: string): string {
    const start = lmeSource.indexOf(signature);
    expect(start, `la firma \`${signature}\` e' cambiata: aggiorna il test`).toBeGreaterThan(-1);
    const next = lmeSource.indexOf('\n    }', start);
    expect(next).toBeGreaterThan(start);
    return lmeSource.slice(start, next);
}

const ENTRY_POINTS: { label: string; signature: string; nameExpr: string }[] = [
    { label: 'new',  signature: '    public static new(name?: DNamedElement["name"], instanceoff?: DModel["instanceof"]', nameExpr: 'name' },
    { label: 'new2', signature: '    static new2(setter: Partial<ObjectWithoutPointers<DModel>>', nameExpr: 'name' },
    { label: 'new3', signature: '    static new3(a: Partial<ModelPointers>', nameExpr: 'a.name' },
];

const dmodelNewBody = () => dmodelEntryBody(ENTRY_POINTS[0].signature);

describe('uniqueModelName — la statica delega al modulo importabile', () => {
    // A4: lo schema (n) e' in `model/nameLookup.ts` e le sue prove di comportamento — la
    // sequenza A / A (1) / A (2), il confronto esatto, il massimo invece del conteggio, i
    // metacaratteri — girano in `model/__tests__/nameLookup.test.ts`. Qui resta la delega,
    // che da un file non importabile non si puo' eseguire.
    it('il corpo della statica e\' una sola chiamata al modulo', () => {
        const start = classesSource.indexOf('    static uniqueModelName(requested: string, taken: string[]): string {');
        expect(start, 'la firma della statica e\' cambiata: aggiorna il test').toBeGreaterThan(-1);
        const body = classesSource.slice(start, classesSource.indexOf('\n    }', start));
        expect(body).toMatch(/return uniqueModelNameImpl\(requested, taken\);/);
        // nessuna copia della logica rientrata
        expect(body).not.toMatch(/taken\.includes/);
        expect(body).not.toMatch(/replace\(/);
    });

    it('l\'import e\' aliasato, perche\' la statica ha lo stesso nome', () => {
        expect(classesSource).toMatch(/import \{ uniqueModelName as uniqueModelNameImpl \} from "\.\.\/model\/nameLookup";/);
    });
});

describe('DModel.new — il nome scelto dal chiamante passa dal controllo', () => {
    it('il ramo senza nome resta `defaultname`, quello con nome chiama uniqueModelName', () => {
        const body = dmodelNewBody();
        expect(body).toMatch(/if \(!name\) name = this\.defaultname\("model_"/);
        // Ancorata a inizio riga, senza `//` davanti: la prima stesura usava un toMatch
        // nudo, e una mutazione che COMMENTAVA la riga la superava — il commento contiene
        // ancora il testo. Misurato col banco delle mutazioni (Q1, 2026-09-12).
        expect(body).toMatch(/\n +else name = uniqueModelName\(name, dmodelnames\);/);
        expect(body).not.toMatch(/\/\/ *else name = uniqueModelName/);
    });

    it('il bacino e\' quello che set_name gia\' confronta: ogni DModel', () => {
        // `Selectors.getAll(DModel, ...)` e `store.getState()['models']` sono lo stesso
        // insieme: metamodelli e modelli M1 insieme. Se uno dei due si restringesse, le due
        // meta' della regola direbbero cose diverse.
        const body = dmodelNewBody();
        expect(body).toMatch(/Selectors\.getAll\(DModel, undefined, undefined, true, false\)/);
        expect(body).toMatch(/dmodels\.map\(\(d: DModel\) => d\.name\)/);
        expect(lmeSource).toMatch(/const models: LModel\[\] = LModel\.fromPointer\(store\.getState\(\)\['models'\]\);/);
    });

    it('contrasto: `set_name` continua a RIFIUTARE, non suffissa', () => {
        // Le due meta' sono deliberatamente diverse: un rename ha un chiamante a cui dire di
        // no, una create no. Se un giorno set_name suffissasse, questo test va rivisto.
        expect(lmeSource).toMatch(/toast\.error\(`Model name "\$\{val\}" is already taken`/);
        expect(lmeSource).not.toMatch(/uniqueModelName\(val/);
    });
});

describe('A3b — la regola vale su tutti e tre i punti d\'ingresso', () => {
    // `new2` non ha chiamanti nell'albero e `new3` ne ha UNO,
    // `jjodie-integration/JjodieAPIImpl.ts:95` (la riga 94 e' un commento che nomina la
    // stessa chiamata: contata come sito vivo in prima battuta, e non lo e').
    // La entry di A3 dice «due chiamanti vivi» ed e' sbagliata; il log e' add-only e non si
    // emenda, la correzione sta nella entry di A3b.
    for (const ep of ENTRY_POINTS) {
        it(`${ep.label}: il ramo senza nome resta defaultname, quello con nome suffissa`, () => {
            const body = dmodelEntryBody(ep.signature);
            expect(body).toMatch(/defaultname\("model_"/);
            // Ancorata a inizio riga e con il contro-controllo sul commento: vedi Q1.
            // A4: i tre chiamano la funzione importata da `model/nameLookup`, non piu' la
            // statica di DPointerTargetable. La guardia e' la stessa, il nome no.
            const expr = ep.nameExpr.replace('.', '\\.');
            const re = new RegExp('\\n +else ' + expr + ' = uniqueModelName\\(' + expr + ', dmodelnames\\);');
            expect(body).toMatch(re);
            expect(body).not.toMatch(new RegExp('\\/\\/ *else ' + expr + ' = uniqueModelName'));
        });

        it(`${ep.label}: interroga lo stesso bacino degli altri due`, () => {
            const body = dmodelEntryBody(ep.signature);
            expect(body).toMatch(/Selectors\.getAll\(DModel, undefined, undefined, true, false\)/);
            expect(body).toMatch(/dmodels\.map\(\(d: DModel\) => d\.name\)/);
        });
    }

    it('nessun punto d\'ingresso e\' rimasto indietro: tre firme, tre guardie', () => {
        const guards = (lmeSource.match(/else (a\.)?name = uniqueModelName\(/g) || []).length;
        expect(guards).toBe(ENTRY_POINTS.length);
    });
});
