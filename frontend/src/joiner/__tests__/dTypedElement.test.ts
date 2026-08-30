import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * Il contratto di `Constructors.DTypedElement` (joiner/classes.ts).
 *
 * Perche' statiche e non di comportamento: `joiner/classes.ts` non e' importabile
 * sotto vitest. `joiner/types.ts:192` lega `window` a livello di modulo
 * (`export const windoww = window`), l'ambiente di `vitest.config.ts` e' `node`, e
 * shimmare `window` non basta — jQuery, importata a catena, chiede un DOM vero, e
 * jsdom non e' installato (regola 4: niente dipendenze nuove). E' la stessa ragione
 * dichiarata in `services/export/__tests__/ecore-io.test.ts`, e la stessa che tiene
 * rossi all'import i 9 file di baseline della suite.
 *
 * La prova di comportamento e' quindi la sonda `_tmp_dtyped_repro.ts`, che crea un
 * DAttribute e un DReference per ciascuna forma di input sul canvas vero e rilegge
 * `.type` dallo store; la sua tabella prima/dopo sta nel report di discovery. Questi
 * test pinnano il contratto perche' non torni indietro in silenzio, che e' esattamente
 * il modo in cui il difetto era passato inosservato.
 */

const CLASSES_TS = path.resolve(__dirname, '../classes.ts');
const DATA_TS = path.resolve(__dirname, '../../api/data.ts');
const CREATE_TS = path.resolve(__dirname, '../../jjscript/executor/commands/create.ts');

const source = fs.readFileSync(CLASSES_TS, 'utf8');

/** Il corpo del solo `DTypedElement`, dalla firma alla successiva a pari indentazione. */
function typedElementBody(): string {
    const start = source.indexOf('    DTypedElement(type?: DTypedElement["type"]): this {');
    expect(start, 'la firma di DTypedElement e\' cambiata: aggiorna il test').toBeGreaterThan(-1);
    const next = source.indexOf('\n    DPackage(', start);
    expect(next, 'il metodo che segue DTypedElement e\' cambiato: aggiorna il test').toBeGreaterThan(start);
    return source.slice(start, next);
}

describe('DTypedElement — la risoluzione del tipo', () => {
    it('non chiama piu\' getByName2 con un argomento solo', () => {
        // Il difetto: `classname` resta undefined, il confronto `classname !== d.className`
        // scarta ogni voce, e il lookup per nome ritorna sempre null.
        expect(typedElementBody()).not.toMatch(/getByName2\(\s*type\s*\)/);
    });

    it('delega a resolveClassifier', () => {
        expect(typedElementBody()).toMatch(/Constructors\.resolveClassifier\(\s*type\s*\)/);
    });

    it('resolveClassifier esiste ed e\' privata', () => {
        expect(source).toMatch(/private static resolveClassifier\(type: any\): DClassifier \| null/);
    });

    it('risolve un id dallo idlookup prima di tentare il nome', () => {
        const body = source.slice(source.indexOf('private static resolveClassifier'));
        const byId = body.indexOf('s.idlookup[type]');
        const byName = body.indexOf('getByName2');
        expect(byId).toBeGreaterThan(-1);
        expect(byName).toBeGreaterThan(-1);
        expect(byId, 'l\'id va risolto prima del nome').toBeLessThan(byName);
    });

    it('interroga getByName2 con entrambi gli argomenti, una volta per tipo di classifier', () => {
        const body = source.slice(source.indexOf('private static resolveClassifier'));
        expect(body).toMatch(/getByName2\(type, cname, false, s\)/);
        expect(body).toMatch(/\['DClass', 'DEnumerator', 'DDataType'\]/);
    });

    it('accetta un proxy scartandolo a __raw', () => {
        const body = source.slice(source.indexOf('private static resolveClassifier'));
        expect(body).toMatch(/typeof type === 'object'/);
        expect(body).toMatch(/__raw \|\| type/);
    });
});

describe('DTypedElement — il fallback e\' dichiarato', () => {
    it('avvisa quando il tipo chiesto non si risolve', () => {
        expect(typedElementBody()).toMatch(/Log\.ww\('DTypedElement: cannot resolve the requested type/);
    });

    it('non avvisa quando nessun tipo era stato chiesto', () => {
        // `type === undefined` e' il seed usato come previsto: e' cosi' che il parser
        // Ecore costruisce, per poi scrivere `.type` subito dopo.
        expect(typedElementBody()).toMatch(/if \(requested !== undefined\) Log\.ww\(/);
    });

    it('tiene memoria di cosa era stato chiesto prima di sovrascriverlo', () => {
        const body = typedElementBody();
        const capture = body.indexOf('const requested = type;');
        const overwrite = body.indexOf('type = undefined');
        expect(capture).toBeGreaterThan(-1);
        expect(capture, 'requested va catturata prima che lo switch azzeri type').toBeLessThan(overwrite);
    });
});

describe('DTypedElement — i contratti che i chiamanti si aspettano', () => {
    it('il corto circuito sul pointer primitivo canonico sopravvive', () => {
        // `jjscript/.../create.ts:414` costruisce un `Pointer_E*` e lo passa: il suo
        // stesso commento dichiara di dipendere da questo ramo.
        expect(typedElementBody()).toMatch(/\/\^Pointer_E\[A-Z\]\+\$\/\.test\(type\)/);
        expect(fs.readFileSync(CREATE_TS, 'utf8')).toMatch(/Defaults as any\)\['Pointer_' \+ shortType\.toUpperCase\(\)\]/);
    });

    it('un DDataType vale come tipo dove vale un enum, e non su una reference', () => {
        const body = typedElementBody();
        expect(body).toMatch(/case 'DDataType':\s*\n\s*case 'DEnumerator':/);
    });

    it('il parser Ecore continua a costruire senza tipo, scrivendo .type dopo', () => {
        // E' il fix-C: passare una stringa raw al costruttore la farebbe cadere nel seed.
        // Se questo test diventa rosso, il percorso di import ha cambiato contratto e la
        // risoluzione qui sopra va rivista insieme a lui.
        const data = fs.readFileSync(DATA_TS, 'utf8');
        expect(data).toMatch(/DAttribute\.new\(\s*\n\s*this\.read\(json, ECoreNamed\.namee, 'attr_1'\),\s*\n\s*undefined,/);
        expect(data).toMatch(/DReference\.new\(undefined, undefined, parent\.id\)/);
    });
});
