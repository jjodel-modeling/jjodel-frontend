import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

// The two export services load under a stub joiner (measured, P-2026-09-25-1445), so their
// primitive-id check runs as written. The stub's `Defaults.primitiveTypeIds` holds one id
// without the old `Pointer_E` prefix: a check that reads the shared set accepts it, one that
// reads its own literal does not.
vi.mock('../index', () => new Proxy({}, {
    get: (_t, k) => (k === 'then' ? undefined
        : k === 'Defaults' ? { primitiveTypeIds: new Set(['Pointer_ZZ']) }
        : class Stub { static cname = String(k); }),
    has: () => true,
}));

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
const DEFAULTS_TS = path.resolve(__dirname, '../../common/Defaults.ts');

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

describe('DTypedElement — il seed di una DReference rifiutata', () => {
    // Il rifiuto (enum o datatype su una reference) e il tipo irrisolvibile condividono
    // il ramo del seed con `type === undefined`, che e' il contratto del parser Ecore.
    // I due casi non devono condividere il valore: vedi
    // docs/discovery/discovery_2026-08-30_dref_seed_rifiutata.md.

    it('non da\' piu\' il padre a chi un tipo lo aveva chiesto', () => {
        const body = typedElementBody();
        // Il padre resta raggiungibile, ma non piu' da solo: la riga che lo assegna
        // e' ora condizionata.
        expect(body).not.toMatch(/case 'DReference':\s*\n(\s*\/\/[^\n]*\n)*\s*type = this\.fatherPtr as Pointer<DClass> \|\| undefined;/);
    });

    it('il rifiuto prende il bersaglio piu\' debole, mai il contenitore', () => {
        expect(typedElementBody()).toMatch(/requested !== undefined && thiss\.className === 'DReference'\)?\s*\n?\s*\?\s*Defaults\.Pointer_EOBJECT/);
    });

    it('EOBJECT e\' il puntatore canonico, non una stringa scritta a mano', () => {
        // `Defaults.Pointer_EOBJECT` e' la stessa costante con cui `redux/store.tsx`
        // crea la metaclasse m3: se cambia li', deve cambiare qui.
        expect(fs.readFileSync(DEFAULTS_TS, 'utf8')).toMatch(/static Pointer_EOBJECT: Pointer<DClass> = 'Pointer_EOBJECT';/);
        expect(typedElementBody()).not.toMatch(/'Pointer_EOBJECT'/);
    });

    it('il seed di `undefined` resta il padre, e resta muto', () => {
        // Il contratto del parser Ecore: nessun tipo chiesto, nessun avviso, il seed di
        // sempre. E' uno dei due invarianti che questa slice non poteva toccare.
        const body = typedElementBody();
        expect(body).toMatch(/:\s*\(this\.fatherPtr as Pointer<DClass> \|\| undefined\)/);
        expect(body).toMatch(/if \(requested !== undefined\) Log\.ww\(/);
    });

    it('non allarga il ramo `default` agli altri typed element', () => {
        // `default:` cade in `case 'DReference':`. La condizione nomina la className
        // proprio per non cambiare il seed di chi non e' una reference.
        expect(typedElementBody()).toMatch(/thiss\.className === 'DReference'/);
    });
});

describe('DTypedElement — i contratti che i chiamanti si aspettano', () => {
    it('il corto circuito sul pointer primitivo canonico sopravvive', () => {
        // `jjscript/.../create.ts:414` costruisce un `Pointer_E*` e lo passa: il suo
        // stesso commento dichiara di dipendere da questo ramo. Dal 2026-09-25 il ramo legge
        // l'insieme condiviso degli id primitivi (R-SIM-44), non il prefisso `Pointer_E`.
        expect(typedElementBody()).toMatch(/typeof type === 'string' && Defaults\.primitiveTypeIds\.has\(type\)/);
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

// ==================================================================
// The one set of primitive ids (R-SIM-44), P-2026-09-25-1445. Each test names the mutant of
// report §7.2 (discovery_2026-09-25_state_operator_core_types.md) it kills. `Defaults.ts`,
// `classes.ts` and `create.ts` do not load under vitest (`window is not defined`, through the
// joiner barrel; for `create.ts` re-measured with a stub joiner on 2026-09-25), so they are read
// as text; the two export services load and are executed.
// ==================================================================

const ECORE_TS = path.resolve(__dirname, '../../services/export/EcoreService.ts');
const JSON_TS = path.resolve(__dirname, '../../services/export/JsonModelService.ts');

describe('the shared set of primitive ids (R-SIM-44)', () => {
    it('is Defaults.types as a Set, and the list holds Expression and Action after EDouble', () => {
        const defaults = fs.readFileSync(DEFAULTS_TS, 'utf8');
        expect(defaults).toMatch(/static primitiveTypeIds: ReadonlySet<string> = new Set<string>\(Defaults\.types\);/);
        const types = defaults.slice(defaults.indexOf('static types:'), defaults.indexOf('];', defaults.indexOf('static types:')));
        const ids = [...types.matchAll(/"(Pointer_[A-Z]+)"/g)].map(m => m[1]);
        expect(ids.indexOf('Pointer_EXPRESSION')).toBe(ids.indexOf('Pointer_EDOUBLE') + 1);
        expect(ids.indexOf('Pointer_ACTION')).toBe(ids.indexOf('Pointer_EDOUBLE') + 2);
        expect(ids).toContain('Pointer_EVOID');
        expect(ids).toContain('Pointer_EOBJECT');
        expect(defaults).toMatch(/static Pointer_EXPRESSION: Pointer<DClass> = 'Pointer_EXPRESSION';/);
        expect(defaults).toMatch(/static Pointer_ACTION: Pointer<DClass> = 'Pointer_ACTION';/);
    });

    it('M11: EcoreService.mapToEcoreType reads the shared set, not the prefix', async () => {
        const { EcoreService } = await import('../../services/export/EcoreService');
        const map = (t: unknown) => (EcoreService as any).mapToEcoreType(t);
        expect(map({ id: 'Pointer_ZZ', name: 'EInt' })).toBe('ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EInt');
        expect(map({ id: 'Pointer_EINT', name: 'EInt' })).toBe('#//EInt');
    });

    it('M11: JsonModelService.buildTypeRef reads the shared set, not the prefix', async () => {
        const { JsonModelService } = await import('../../services/export/JsonModelService');
        expect((JsonModelService as any).buildTypeRef({ id: 'Pointer_ZZ', name: 'Custom' }, 'm1', {})).toBe('Custom');
    });

    it('M11: no file keeps a `Pointer_E` prefix check of its own', () => {
        expect(typedElementBody()).not.toMatch(/Pointer_E\[A-Z\]/);
        expect(fs.readFileSync(ECORE_TS, 'utf8')).not.toMatch(/startsWith\(['"]Pointer_E['"]\)/);
        expect(fs.readFileSync(JSON_TS, 'utf8')).not.toMatch(/startsWith\(['"]Pointer_E['"]\)/);
    });
});

describe('JjScript `type Expression` / `type Action` (R-SIM-44)', () => {
    /** The alias table of `create.ts`, evaluated from its source: `set.ts` reads the same table. */
    function aliasTable(): Record<string, string> {
        const src = fs.readFileSync(CREATE_TS, 'utf8');
        const m = src.match(/const PRIMITIVE_ATTRIBUTE_TYPES: Record<string, string> = (\{[\s\S]*?\});/);
        expect(m, 'the alias table of create.ts moved: update the test').not.toBeNull();
        return new Function(`return ${m![1]}`)();
    }

    it('M10: the two names map to the primitives, whose pointers exist in Defaults', () => {
        const table = aliasTable();
        expect(table.expression).toBe('Expression');
        expect(table.action).toBe('Action');
        const defaults = fs.readFileSync(DEFAULTS_TS, 'utf8');
        for (const short of [table.expression, table.action]) {
            expect(defaults).toContain(`static Pointer_${short.toUpperCase()}: Pointer<DClass>`);
        }
    });

    it('control: the existing aliases are unchanged', () => {
        const table = aliasTable();
        expect(table.string).toBe('EString');
        expect(table.int).toBe('EInt');
        expect(Object.keys(table)).toHaveLength(27);
    });
});
