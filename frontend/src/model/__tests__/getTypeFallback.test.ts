import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * Il gradino 3 di `LTypedElement.get_type` (model/logicWrapper/LModelElement.tsx).
 *
 * Perche' statiche e non di comportamento: `LModelElement.tsx` non e' importabile sotto
 * vitest. Misurato 2026-08-30 su un test usa-e-getta: l'import solleva
 * `ReferenceError: window is not defined` da `monaco-editor/esm/vs/base/browser/window.js:14`,
 * tirata dentro dalla catena della barrel `joiner`, e l'ambiente di `vitest.config.ts` e'
 * `node`. E' la stessa ragione, e la stessa forma, di
 * `joiner/__tests__/dTypedElement.test.ts`, che pinna la meta' del contratto scritta nel
 * costruttore.
 *
 * La prova di comportamento e' la sonda `_tmp_gettype_window.ts` del referto
 * `docs/discovery/discovery_2026-08-30_gettype_finestra_parser.md`, rigirata sul fix.
 * Questi test pinnano il contratto perche' non torni indietro in silenzio.
 */

const LME_TSX = path.resolve(__dirname, '../logicWrapper/LModelElement.tsx');
const CLASSES_TS = path.resolve(__dirname, '../../joiner/classes.ts');
const DEFAULTS_TS = path.resolve(__dirname, '../../common/Defaults.ts');

const source = fs.readFileSync(LME_TSX, 'utf8');

/** Il corpo del solo `get_type`, dalla firma alla `set_type` che la segue. */
function getTypeBody(): string {
    const start = source.indexOf('    protected get_type(c: Context): this["type"] {');
    expect(start, 'la firma di get_type e\' cambiata: aggiorna il test').toBeGreaterThan(-1);
    const next = source.indexOf('\n    protected set_type(', start);
    expect(next, 'il metodo che segue get_type e\' cambiato: aggiorna il test').toBeGreaterThan(start);
    return source.slice(start, next);
}

describe('get_type gradino 3 — la reference non riceve piu\' il proprio contenitore', () => {
    it('il fallback di una DReference e\' EOBJECT, non il padre', () => {
        const body = getTypeBody();
        expect(body).toMatch(/c\.data\.className === 'DReference' \? Defaults\.Pointer_EOBJECT/);
        expect(body).not.toMatch(/c\.data\.className === 'DReference' \? c\.data\.father/);
    });

    it('EOBJECT e\' la costante canonica, non una stringa scritta a mano', () => {
        // La stessa con cui `redux/store.tsx:340` crea la metaclasse m3: se cambia li',
        // deve cambiare qui.
        expect(fs.readFileSync(DEFAULTS_TS, 'utf8'))
            .toMatch(/static Pointer_EOBJECT: Pointer<DClass> = 'Pointer_EOBJECT';/);
        expect(getTypeBody()).not.toMatch(/'Pointer_EOBJECT'/);
    });

    it('contrasto: chi non e\' una reference tiene il fallback di sempre', () => {
        // Il ramo `else` e' l'altra meta' della stessa riga: non era in discussione, e
        // un test che non lo guarda lascerebbe passare una modifica che lo travolge.
        expect(getTypeBody()).toMatch(/: 'Pointer_ESTRING'\);/);
    });

    it('dice la stessa cosa che dice il costruttore', () => {
        // Il reperto §1 di `discovery_2026-08-30_dref_seed_rifiutata.md`: il seed era
        // scritto in due posti. Il costruttore e' gia' su EOBJECT; questa e' la riga che
        // mancava all'appello.
        expect(fs.readFileSync(CLASSES_TS, 'utf8')).toMatch(/\?\s*Defaults\.Pointer_EOBJECT/);
    });
});

describe('get_type — la scala resta nell\'ordine, e i gradini sopra non si muovono', () => {
    it('il tipo presente vince prima di ogni fallback', () => {
        const body = getTypeBody();
        const step1 = body.indexOf('if (type) return type;');
        const step3 = body.indexOf('// 3) fallback values.');
        expect(step1).toBeGreaterThan(-1);
        expect(step3).toBeGreaterThan(step1);
    });

    it('la risoluzione per nome resta fra il primo gradino e il terzo', () => {
        const body = getTypeBody();
        const step2 = body.indexOf("if (typeof rawType === 'string')");
        const step3 = body.indexOf('// 3) fallback values.');
        expect(step2).toBeGreaterThan(-1);
        expect(step2).toBeLessThan(step3);
    });

    it('il gradino 3 resta l\'unica uscita in coda', () => {
        // Una sola `return` dopo il commento del gradino 3: se ne comparisse una seconda,
        // il fallback avrebbe due valori e questo test non basterebbe piu'.
        const tail = getTypeBody().slice(getTypeBody().indexOf('// 3) fallback values.'));
        expect(tail.match(/\breturn\b/g)?.length).toBe(1);
    });
});
