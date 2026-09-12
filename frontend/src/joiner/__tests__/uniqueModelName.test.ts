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

/** Il corpo del solo `DModel.new`, dalla firma al `return`. */
function dmodelNewBody(): string {
    const start = lmeSource.indexOf('    public static new(name?: DNamedElement["name"], instanceoff?: DModel["instanceof"]');
    expect(start, 'la firma di DModel.new e\' cambiata: aggiorna il test').toBeGreaterThan(-1);
    const next = lmeSource.indexOf('\n    }', start);
    expect(next).toBeGreaterThan(start);
    return lmeSource.slice(start, next);
}

describe('uniqueModelName — lo schema (n), non uno nuovo', () => {
    it('restituisce il nome chiesto quando e\' libero', () => {
        expect(uniqueBody()).toMatch(/if \(!taken\.includes\(requested\)\) return requested;/);
    });

    it('il confronto e\' esatto: nessun toLowerCase, come checkM2NameUniqueness', () => {
        expect(uniqueBody()).not.toMatch(/toLowerCase/);
    });

    it('suffissa con " (n)", lo schema di generateUniqueModelName', () => {
        const body = uniqueBody();
        expect(body).toMatch(/requested \+ ' \(' \+ \(max \+ 1\) \+ '\)'/);
        // e riparte dal massimo esistente, non dal conteggio
        expect(body).toMatch(/if \(n > max\) max = n;/);
    });

    it('i metacaratteri del nome sono neutralizzati prima della regexp', () => {
        expect(uniqueBody()).toMatch(/requested\.replace\(/);
    });
});

describe('DModel.new — il nome scelto dal chiamante passa dal controllo', () => {
    it('il ramo senza nome resta `defaultname`, quello con nome chiama uniqueModelName', () => {
        const body = dmodelNewBody();
        expect(body).toMatch(/if \(!name\) name = this\.defaultname\("model_"/);
        // Ancorata a inizio riga, senza `//` davanti: la prima stesura usava un toMatch
        // nudo, e una mutazione che COMMENTAVA la riga la superava — il commento contiene
        // ancora il testo. Misurato col banco delle mutazioni (Q1, 2026-09-12).
        expect(body).toMatch(/\n +else name = DPointerTargetable\.uniqueModelName\(name, dmodelnames\);/);
        expect(body).not.toMatch(/\/\/ *else name = DPointerTargetable\.uniqueModelName/);
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
