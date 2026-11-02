/**
 * Step T4a-2 of the textual notation (P-2026-11-02-1830; R-TXT-21 (2), R-TXT-25 (12)): the syntax annotations stored
 * in the metamodel's `_state`, their element ids read from the D-layer records, and the one path the Text tab, the
 * EBNF view and «New model from text» derive their grammar through.
 *
 * The acceptance is a small library metamodel, of no particular domain: `Library` contains `Book` and `Member`, a book
 * has a mandatory `genre` enumeration. Its annotations rename a keyword (`members` to `patrons`), drop one (`genre`
 * positional), group the books by genre, and name the language. The D-layer records are written by hand in the shape
 * the lookup holds them (a metamodel's `packages`, a package's `classes`, `enumerators`, `subpackages`, a class's
 * `attributes` and `references`, a feature's `lowerBound`); the eval-context shells as eval.ts builds them, the way
 * textualTab.test.ts writes them. The save and load run the real `VersionFixer` chain, with the joiner barrel mocked
 * as in engine/__tests__/templateCodec.test.ts (that block, verbatim but for the relative paths).
 * Mutations each test kills are in its name; the bench is in the commit body.
 */

import { describe, it, expect, vi, beforeAll } from 'vitest';

vi.mock('../../../joiner', () => {
    const DGraphElement = { cname: 'DGraphElement' };
    const GRAPH_ELEMENTS = new Set(['DGraphElement', 'DGraph', 'DGraphVertex', 'DVertex', 'DVoidVertex',
        'DEdgePoint', 'DVoidEdge', 'DEdge', 'DExtEdge', 'DRefEdge']);
    const viewpoints = ['Pointer_ViewPointDefault'];
    return {
        RuntimeAccessible: () => (ctor: any) => ctor,
        Log: {
            exDev: (b: boolean, ...rest: any[]) => { if (b) throw new Error('[Dev Error] ' + String(rest[0])); return null; },
            eDevv: () => '', ii: () => '', ww: () => '', ll: () => '',
        },
        U: {
            getHashParam: () => null,
            getProjectID_URL: () => 'Pointer_TestProject',
            replaceAll: (str: string, searchText: string, replacement?: string) =>
                (!str ? str : str.split(searchText).join(replacement || '')),
            hexToPalette: (...hexs: string[]) => ({ type: 'color', value: hexs.map(() => ({ r: 0, g: 0, b: 0, a: 1 })) }),
        },
        DV: { defaultLanguages: () => ({ _selected: 'JSON' }) },
        RuntimeAccessibleClass: { extends: (cn: string, sup: any) => sup === DGraphElement && GRAPH_ELEMENTS.has(cn) },
        DGraphElement,
        Pointers: { ESTRING: 'Pointer_ESTRING' },
        EdgeBendingMode: { Line: 'L', Manhattan: 'Manhattan', Bezier_QT: 'QT' },
        EdgeHead: {
            Head_reference: 'M11.354 5.646a.5.5 90 010 .708l-6.035 6.089a.5.5 90 01-.156-.116L11.375 5.999l-6.406-6.211a.5.5 90 01.208-.115z',
            Tail_composition: 'M8.5776-.9085c.6316-.522 1.6553-.522 2.2869 0l7.0948 5.8644c.6316.522.6316 1.3671 0 1.8882L10.8645 12.7085c-.6316.522-1.6542.522-2.2847 0L1.4827 6.845a1.6117 1.332 0 010-1.8882z',
        },
        Defaults: { viewpoints, isSystemViewpoint: (id: any) => viewpoints.includes(id as string) },
        LViewElement: { updateDefaultView: () => undefined },
    };
});
vi.mock('../../../components/forEndUser/Tooltip', () => ({ Tooltip: { show: () => undefined } }));
vi.mock('@monaco-editor/react', () => ({ default: () => null }));
const evalContext = vi.hoisted(() => ({ globals: {} as Record<string, any> }));
vi.mock('../../../jjscript', () => ({ buildEvalContext: () => evalContext.globals }));
vi.mock('../../../components/editor-v2/sim/simBridge', () => ({ evalContextFor: () => ({}) }));
vi.mock('../../../components/abstract/DockManager', () => ({ default: { closeTab: () => true } }));

const { VersionFixer } = await import('../../../redux/VersionFixer');
const { default: first } = await import('../../../examples/first');
const { decodeSyntax, elementIdsOf, encodeSyntax, readSyntax, syntaxPatch, textualNotation, TEXTUAL_SYNTAX_KEY } = await import('../syntaxRecord');
const { metamodelGrammar, storedNotation, textInputOf, textualView } = await import('../ui/TextualTab');
const { textualLanguageNameOf, textualOptionLabel } = await import('../../../components/editor-v2/dataManagerOption');
const { concreteGrammarEbnf, deriveConcreteGrammar } = await import('../concreteGrammar');
const { deriveBaseGrammar } = await import('../baseGrammar');
const { printTextModel } = await import('../printer');
const { isApplicableParse, parseText } = await import('../parser');
const { readNewModel } = await import('../modelLines');
const { CLIKE_STYLE } = await import('../style');
type SyntaxAnnotations = import('../annotations').SyntaxAnnotations;

beforeAll(() => { vi.spyOn(console, 'log').mockImplementation(() => undefined); });

// ---- The library metamodel, as D-layer records and as eval-context shells ------------------------------------

/** The D-layer records of the library metamodel `MM` and of its model `M`; `book` names the class `Book`. */
function libraryLookup(book = 'Book', withRecord?: string): Record<string, any> {
    const L: Record<string, any> = {};
    const put = (o: Record<string, any>): void => { L[o.id] = o; };
    put({ id: 'MM', className: 'DModel', isMetamodel: true, name: 'Library', packages: ['P'], _state: withRecord === undefined ? {} : { [TEXTUAL_SYNTAX_KEY]: withRecord } });
    put({ id: 'M', className: 'DModel', isMetamodel: false, name: 'city', instanceof: 'MM' });
    put({ id: 'P', className: 'DPackage', name: 'library', classes: ['C_Lib', 'C_Book'], enumerators: ['E_Genre'], subpackages: ['P2'] });
    // Member sits in a subpackage: the walk must reach it.
    put({ id: 'P2', className: 'DPackage', name: 'people', classes: ['C_Mem'], enumerators: [], subpackages: [] });
    put({ id: 'C_Lib', className: 'DClass', name: 'Library', attributes: ['A_Lib_name'], references: ['R_Lib_books', 'R_Lib_members'] });
    put({ id: 'C_Book', className: 'DClass', name: book, attributes: ['A_Book_name', 'A_Book_genre', 'A_Book_year'], references: ['R_Book_borrowedBy'] });
    put({ id: 'C_Mem', className: 'DClass', name: 'Member', attributes: ['A_Mem_name'], references: [] });
    put({ id: 'E_Genre', className: 'DEnumerator', name: 'Genre', literals: [] });
    for (const [id, name, lower] of [
        ['A_Lib_name', 'name', 1], ['A_Book_name', 'name', 1], ['A_Book_genre', 'genre', 1], ['A_Book_year', 'year', 0], ['A_Mem_name', 'name', 1],
    ] as const) put({ id, className: 'DAttribute', name, lowerBound: lower });
    for (const [id, name] of [['R_Lib_books', 'books'], ['R_Lib_members', 'members'], ['R_Book_borrowedBy', 'borrowedBy']] as const) {
        put({ id, className: 'DReference', name, lowerBound: 0 });
    }
    return L;
}

const attr = (owner: string, name: string, type: string) => ({ name, type, className: owner, multiValued: false, defaultValue: null, __type: 'Attribute' });
const ref = (owner: string, name: string, type: string, upper: number, containment = false) =>
    ({ name, type, containment, multiplicity: upper === -1 ? '*' : String(upper), upperBound: upper, lowerBound: 0, opposite: null, className: owner, __type: 'Reference' });
const shell = (name: string, attributes: any[], references: any[] = []) => ({
    name, className: 'DClass', isAbstract: false, isInterface: false, attributes, references, superTypes: [], subTypes: [], instances: [], allInstances: [], __type: 'Class',
});

/** The globals `buildEvalContext` gives for the model `M` (with objects) or for the metamodel alone. */
function libraryGlobals(book = 'Book', withObjects = true): Record<string, any> {
    const library = shell('Library', [attr('Library', 'name', 'EString')], [ref('Library', 'books', book, -1, true), ref('Library', 'members', 'Member', -1, true)]);
    const bookShell = shell(book, [attr(book, 'name', 'EString'), attr(book, 'genre', 'Genre'), attr(book, 'year', 'EInt')], [ref(book, 'borrowedBy', 'Member', 1)]);
    const member = shell('Member', [attr('Member', 'name', 'EString')]);
    const obj = (id: string, cls: any, slots: Record<string, unknown>): any => ({ id, __type: 'Object', instanceOf: cls, instanceof: cls, parent: null, ...slots });
    const ann = obj('m1', member, { name: 'ann' });
    const bob = obj('m2', member, { name: 'bob' });
    const b1 = obj('b1', bookShell, { name: 'dune', genre: 'FICTION', year: null, borrowedBy: null });
    const b2 = obj('b2', bookShell, { name: 'cosmos', genre: 'SCIENCE', year: 1980, borrowedBy: ann });
    const b3 = obj('b3', bookShell, { name: 'odes', genre: 'POETRY', year: null, borrowedBy: null });
    const b4 = obj('b4', bookShell, { name: 'spqr', genre: 'HISTORY', year: 2015, borrowedBy: bob });
    const city = obj('lib', library, { name: 'city', books: [b1, b2, b3, b4], members: [ann, bob] });
    for (const o of [ann, bob, b1, b2, b3, b4]) o.parent = city;
    return {
        classes: [library, bookShell, member],
        enumerations: [{ name: 'Genre', literals: ['FICTION', 'POETRY', 'SCIENCE', 'HISTORY'].map((n, value) => ({ name: n, value })), literalCount: 4, __type: 'Enumeration' }],
        instances: withObjects ? [city, ann, bob, b1, b2, b3, b4] : [],
    };
}

const LIBRARY_RECORD: SyntaxAnnotations = {
    v: 1,
    language: 'Shelf',
    features: {
        R_Lib_members: { keyword: 'patrons' },
        A_Book_genre: { keyword: '' },
        R_Lib_books: { groupBy: 'A_Book_genre' },
    },
    enums: {
        E_Genre: { subsets: [{ name: 'prose', literals: ['FICTION', 'HISTORY'] }, { name: 'verse', literals: ['POETRY'] }, { name: 'nonfiction', literals: ['SCIENCE'] }] },
    },
};

/** The model tab's view of the library model, with the record stored as `raw` (none when undefined). */
function libraryView(raw?: string, book = 'Book') {
    const lookup = libraryLookup(book, raw);
    return textualView(libraryGlobals(book), storedNotation(lookup, 'MM'));
}

const errors = (issues: readonly { level: string; where: string; message: string }[] | undefined): string[] =>
    (issues ?? []).filter(i => i.level === 'error').map(i => `${i.where}: ${i.message}`);

const LIBRARY_TEXT = [
    'Library city {',
    '  books {',
    '    prose {',
    '      Book dune {',
    '        FICTION',
    '      }',
    '      Book spqr {',
    '        HISTORY',
    '        year 2015',
    '        borrowedBy bob',
    '      }',
    '    }',
    '    verse {',
    '      Book odes {',
    '        POETRY',
    '      }',
    '    }',
    '    nonfiction {',
    '      Book cosmos {',
    '        SCIENCE',
    '        year 1980',
    '        borrowedBy ann',
    '      }',
    '    }',
    '  }',
    '  patrons {',
    '    Member ann {}',
    '    Member bob {}',
    '  }',
    '}',
].join('\n');

// ---- The storage ----------------------------------------------------------------------------------------------

describe('the key', () => {
    it('is textSyntax, not a sim* key, and the record codec reads and writes it (mutant: the reader looks at another key)', () => {
        expect(TEXTUAL_SYNTAX_KEY).toBe('textSyntax');
        expect(TEXTUAL_SYNTAX_KEY.startsWith('sim')).toBe(false);
        const raw = encodeSyntax(LIBRARY_RECORD);
        const lookup = libraryLookup('Book', raw);
        expect(readSyntax(lookup, 'MM')).toEqual({ record: LIBRARY_RECORD, issues: [] });
        expect(syntaxPatch(undefined, LIBRARY_RECORD)).toEqual({ [TEXTUAL_SYNTAX_KEY]: raw });
    });
});

describe('encodeSyntax, decodeSyntax and syntaxPatch', () => {
    it('round trip, in a fixed field order whatever the order given (mutant: the record stringified as given)', () => {
        const raw = encodeSyntax(LIBRARY_RECORD);
        const shuffled = { enums: LIBRARY_RECORD.enums, features: LIBRARY_RECORD.features, language: 'Shelf', v: 1 } as SyntaxAnnotations;
        expect(encodeSyntax(shuffled)).toBe(raw);
        expect(Object.keys(JSON.parse(raw))).toEqual(['v', 'language', 'features', 'enums']);
        expect(decodeSyntax(raw)).toEqual({ record: LIBRARY_RECORD, issues: [] });
    });

    it('writes nothing when the record is the stored one, and an emptied record as {"v":1}, never a removed key', () => {
        const raw = encodeSyntax(LIBRARY_RECORD);
        expect(syntaxPatch(raw, LIBRARY_RECORD)).toBeNull();
        expect(syntaxPatch(raw, { v: 1 })).toEqual({ [TEXTUAL_SYNTAX_KEY]: '{"v":1}' });
    });

    it('reads no key as no record and no issue', () => {
        expect(decodeSyntax(undefined)).toEqual({ record: null, issues: [] });
        expect(decodeSyntax(null)).toEqual({ record: null, issues: [] });
        expect(readSyntax(libraryLookup(), 'MM')).toEqual({ record: null, issues: [] });
        expect(readSyntax({}, 'nope')).toEqual({ record: null, issues: [] });
    });

    it('reads a malformed key as no record with one issue, never a throw (mutant: JSON.parse unguarded)', () => {
        for (const raw of ['{not json', '[]', '"text"', '{"language":"x"}', '{"v":"1"}', '{"v":0}']) {
            const d = decodeSyntax(raw);
            expect(d.record).toBeNull();
            expect(d.issues).toHaveLength(1);
            expect(d.issues[0].level).toBe('error');
        }
    });

    it('reads a newer version as no record, and says so (mutant: v > 1 read as v 1)', () => {
        const d = decodeSyntax(JSON.stringify({ ...LIBRARY_RECORD, v: 2 }));
        expect(d.record).toBeNull();
        expect(d.issues.map(i => i.message)).toEqual(['the stored annotations are version 2, newer than this Jjodel reads (1): none applied']);
    });

    it('drops an entry that is not a record with an issue, and keeps the others (mutant: a null entry reaches resolveAnnotations and throws)', () => {
        const raw = JSON.stringify({ v: 1, classes: { C_Book: null, C_Mem: { name: 'x' } }, features: { R_Lib_members: { keyword: 'patrons' }, A_Book_year: 7 }, style: 3 });
        const d = decodeSyntax(raw);
        expect(d.record?.features).toEqual({ R_Lib_members: { keyword: 'patrons' } });
        expect(d.record?.classes).toEqual({ C_Mem: {} });
        expect(d.issues).toHaveLength(4);
        const view = libraryView(raw);
        expect(view.error).toBeNull();
        expect(view.text).toContain('  patrons {');
    });
});

describe('the D-layer save and load keep textSyntax intact', () => {
    it('saved, loaded through the real VersionFixer chain: the key byte for byte, the record the same, the ids resolved', () => {
        const state = JSON.parse(first as unknown as string);
        const mmId = (state.models as string[]).find(id => state.idlookup[id]?.isMetamodel === true)!;
        expect(mmId).toBeDefined();
        const ids = elementIdsOf(state.idlookup, mmId);
        const [classId, className] = Object.entries(ids.classes)[0];
        const record: SyntaxAnnotations = { v: 1, language: 'Firstly', classes: { [classId]: { keyword: 'thing' } } };
        const raw = encodeSyntax(record);
        state.idlookup[mmId]._state = { ...(state.idlookup[mmId]._state ?? {}), [TEXTUAL_SYNTAX_KEY]: raw };

        const loaded = VersionFixer.update(JSON.parse(JSON.stringify(state)));

        // Positive control: the chain ran over this state, from no version to the highest.
        expect(loaded.version.n).toBe(VersionFixer.get_highestversion());
        expect(loaded.version.conversionList.length).toBeGreaterThan(10);
        expect(loaded.idlookup[mmId]._state[TEXTUAL_SYNTAX_KEY]).toBe(raw);
        expect(readSyntax(loaded.idlookup, mmId)).toEqual({ record, issues: [] });
        expect(elementIdsOf(loaded.idlookup, mmId).classes[classId]).toBe(className);
    });
});

// ---- The element ids ------------------------------------------------------------------------------------------

describe('elementIdsOf', () => {
    it('reads every class, feature and enumeration with its lower bound, subpackages included (mutant: lower dropped; subpackages not walked)', () => {
        const ids = elementIdsOf(libraryLookup(), 'MM');
        expect(ids.classes).toEqual({ C_Lib: 'Library', C_Book: 'Book', C_Mem: 'Member' });
        expect(ids.enums).toEqual({ E_Genre: 'Genre' });
        expect(ids.features.A_Book_genre).toEqual({ owner: 'Book', name: 'genre', lower: 1 });
        expect(ids.features.A_Book_year).toEqual({ owner: 'Book', name: 'year', lower: 0 });
        expect(ids.features.R_Lib_members).toEqual({ owner: 'Library', name: 'members', lower: 0 });
        expect(Object.keys(ids.features)).toHaveLength(8);
    });

    it('is empty for a metamodel not in the lookup', () => {
        expect(elementIdsOf({}, 'nope')).toEqual({ classes: {}, features: {}, enums: {} });
    });
});

// ---- The shared path ------------------------------------------------------------------------------------------

describe('no record: the output is the unannotated one, byte for byte', () => {
    it('the same text and EBNF as the grammar derived with no annotation (mutant: an empty record resolved and applied)', () => {
        const globals = libraryGlobals();
        const mm = textInputOf(globals).metamodel;
        const plain = deriveConcreteGrammar(deriveBaseGrammar(mm), CLIKE_STYLE);
        const view = libraryView();
        expect(view.ebnf).toBe(concreteGrammarEbnf(plain));
        expect(view.text).toBe(printTextModel(plain, textInputOf(globals).objects).text);
        expect(view.issues).toEqual([]);
        expect(textualView(globals)).toEqual(view);
        const n = textualNotation(mm, decodeSyntax(undefined), elementIdsOf(libraryLookup(), 'MM'));
        expect(n.grammar.annotationIssues).toBeUndefined();
        expect(n.language).toBeUndefined();
    });

    it('a record that cannot be read prints the same text, with its issue shown (mutant: the issue dropped)', () => {
        const plain = libraryView();
        const broken = libraryView('{"v":9}');
        expect(broken.text).toBe(plain.text);
        expect(broken.ebnf).toBe(plain.ebnf);
        expect(errors(broken.issues)).toHaveLength(1);
    });
});

describe('the library acceptance', () => {
    it('prints the annotated text: patrons, genre positional, books by genre, one per line (mutants: ids without lower bound refuse the grouping; block objects of a group chained on one line)', () => {
        const view = libraryView(encodeSyntax(LIBRARY_RECORD));
        expect(view.error).toBeNull();
        expect(errors(view.issues)).toEqual([]);
        expect(view.text).toBe(LIBRARY_TEXT);
    });

    it('parses its text without errors and reprints it equal', () => {
        const lookup = libraryLookup('Book', encodeSyntax(LIBRARY_RECORD));
        const stored = storedNotation(lookup, 'MM');
        const mm = textInputOf(libraryGlobals()).metamodel;
        const { grammar } = textualNotation(mm, stored.decoded, stored.ids);
        const r = parseText(LIBRARY_TEXT, grammar);
        expect(r.errors).toEqual([]);
        expect(isApplicableParse(r)).toBe(true);
        expect(printTextModel(grammar, r.objects).text).toBe(LIBRARY_TEXT);
    });

    it('«New model from text» reads the annotated text through the same grammar (mutant: the new tab derives with no annotation)', () => {
        evalContext.globals = libraryGlobals('Book', false);
        const lookup = libraryLookup('Book', encodeSyntax(LIBRARY_RECORD));
        const g = metamodelGrammar(lookup, 'MM');
        expect(g.error).toBeNull();
        const reading = readNewModel(LIBRARY_TEXT, g.grammar!, g.metamodel!);
        expect(reading.markers).toEqual([]);
        expect(reading.objects).toBe(7);
        expect(reading.lines).not.toBeNull();
        expect(g.issues).toEqual([]);
    });

    it('the EBNF view shows the annotated grammar', () => {
        const view = libraryView(encodeSyntax(LIBRARY_RECORD));
        expect(view.ebnf).toContain('"patrons"');
        expect(view.ebnf).toContain('"prose"');
        expect(view.ebnf).not.toBe(libraryView().ebnf);
    });
});

describe('stale ids and renames', () => {
    it('a stale id is a visible issue, and the rest applies (mutant: an unknown id throws or is silently kept)', () => {
        const record: SyntaxAnnotations = { ...LIBRARY_RECORD, classes: { C_Gone: { keyword: 'x' } } };
        const view = libraryView(encodeSyntax(record));
        expect(view.error).toBeNull();
        expect(errors(view.issues)).toEqual(['classes: no class has the id "C_Gone"']);
        expect(view.text).toBe(LIBRARY_TEXT);
    });

    it('renaming an annotated class keeps its annotation: label and text follow the new name (mutant: annotations keyed by name)', () => {
        const record: SyntaxAnnotations = { ...LIBRARY_RECORD, classes: { C_Book: { keyword: 'title' } } };
        const before = libraryView(encodeSyntax(record));
        const after = libraryView(encodeSyntax(record), 'Volume');
        expect(errors(after.issues)).toEqual([]);
        expect(after.text).toBe(before.text);
        expect(after.text).toContain('      title dune {');
        expect(after.ebnf).toContain('Volume_prose      ::= "title" [name=NAME]');
        const lookup = libraryLookup('Volume', encodeSyntax(record));
        expect(textualOptionLabel(lookup.MM.name, textualLanguageNameOf(lookup, 'M'))).toBe('Shelf');
    });
});
