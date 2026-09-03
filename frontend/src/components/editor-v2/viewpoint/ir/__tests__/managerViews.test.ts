/**
 * managerViews — la regola R-VP-11, ESEGUITA e non letta.
 *
 * Le colonne sono della metaclasse, ma una view si risolve su un oggetto: quale view parla
 * per il Data Manager e' l'unica decisione non ovvia di questa slice, e leggere il
 * comparatore non basta a validarla (CLAUDE.md §5, «non validare un ordinamento leggendo
 * il comparatore»). Qui gira su indici veri.
 *
 * Il modulo si importa in `environment: node` senza doppiare niente — misurato con una
 * sonda prima di scrivere questo file: `managerViews` tira `irResolveCore` e `irReadCtx`,
 * nessuno dei due dereferenzia `window` all'import. E' la ragione per cui questi casi sono
 * asserzioni sul COMPORTAMENTO e non sul sorgente.
 */
import { describe, it, expect } from 'vitest';
import { resolveManagerSpec } from '../managerViews';
import type { IRViewpointIndex, IndexEntry } from '../irResolveCore';
import type { ManagerSpec } from '../irTypes';

/** Un `idlookup` di sole DClass: `classAncestry` legge `name` ed `extends`, nient'altro. */
const LOOKUP: Record<string, any> = {
    'c-person': { name: 'Person', extends: [] },
    'c-employee': { name: 'Employee', extends: ['c-person'] },
    'c-other': { name: 'Other', extends: [] },
};

/**
 * Una entry dell'indice. `compiled` porta solo cio' che questo modulo legge — `viewId`,
 * `priority` e l'`ir` — perche' un finto piu' grande direbbe che ne serve di piu'.
 */
const entry = (o: {
    viewId: string;
    kind?: 'vertex' | 'graphVertex' | 'edge';
    manager?: ManagerSpec;
    predicate?: unknown;
    priority?: number;
    declarationIndex?: number;
    pins?: Record<string, string>;
}): IndexEntry => ({
    compiled: {
        viewId: o.viewId,
        priority: o.priority ?? 0,
        ir: {
            kind: o.kind ?? 'vertex',
            ...(o.manager !== undefined ? { manager: o.manager } : {}),
            ...(o.predicate !== undefined ? { predicate: o.predicate } : {}),
        },
    } as any,
    declarationIndex: o.declarationIndex ?? 0,
    ...(o.pins ? { pins: o.pins as any } : {}),
});

const index = (byMetaclass: Record<string, IndexEntry[]>, wildcard: IndexEntry[] = []): IRViewpointIndex =>
    ({ byMetaclass: new Map(Object.entries(byMetaclass)), wildcard } as any);

const COLS: ManagerSpec = { columns: ['cfg', 'tags'] };

describe('resolveManagerSpec — quale view parla per il manager (R-VP-11)', () => {
    it('senza indice, senza classe nota, senza candidati: niente, e non un errore', () => {
        expect(resolveManagerSpec('c-person', null, LOOKUP)).toEqual({ spec: null, skippedPredicated: [] });
        expect(resolveManagerSpec('c-ignota', index({}), LOOKUP)).toEqual({ spec: null, skippedPredicated: [] });
        expect(resolveManagerSpec('c-person', index({}), LOOKUP)).toEqual({ spec: null, skippedPredicated: [] });
    });

    it('la view della classe, quando ce l\'ha', () => {
        const r = resolveManagerSpec('c-person', index({ Person: [entry({ viewId: 'v1', manager: COLS })] }), LOOKUP);
        expect(r.spec).toEqual(COLS);
        expect(r.skippedPredicated).toEqual([]);
    });

    it('una view che NON dichiara `manager` non e\' un risultato: si continua a cercare', () => {
        const r = resolveManagerSpec('c-person', index({
            Person: [entry({ viewId: 'v-senza' }), entry({ viewId: 'v-con', manager: COLS, declarationIndex: 1 })],
        }), LOOKUP);
        expect(r.spec).toEqual(COLS);
    });

    it('una view `graphVertex` parla come una `vertex`: e\' nello stesso bucket', () => {
        // La ragione per cui `manager` sta su ENTRAMBE le interfacce: l'indice le file
        // con lo stesso ramo, quindi escluderne una lascerebbe scoperta una classe.
        const r = resolveManagerSpec('c-person', index({
            Person: [entry({ viewId: 'v-gv', kind: 'graphVertex', manager: COLS })],
        }), LOOKUP);
        expect(r.spec).toEqual(COLS);
    });

    it('IGNORA una view con predicato, e la RIPORTA', () => {
        const r = resolveManagerSpec('c-person', index({
            Person: [entry({ viewId: 'v-pred', manager: COLS, predicate: { op: 'eq', left: 'a', right: 'b' } })],
        }), LOOKUP);
        expect(r.spec).toBeNull();
        expect(r.skippedPredicated).toEqual(['v-pred']);
    });

    it('con una predicata E una senza, vince quella senza — e la saltata resta detta', () => {
        const other: ManagerSpec = { columns: ['name'] };
        const r = resolveManagerSpec('c-person', index({
            Person: [
                entry({ viewId: 'v-pred', manager: COLS, predicate: { op: 'eq' }, priority: 10 }),
                entry({ viewId: 'v-pura', manager: other, declarationIndex: 1 }),
            ],
        }), LOOKUP);
        expect(r.spec).toEqual(other);
        expect(r.skippedPredicated).toEqual(['v-pred']);
    });

    it('la specificita\' vince sull\'ereditata, e la priorita\' sulla specificita\'', () => {
        const dellaClasse: ManagerSpec = { columns: ['propria'] };
        const dellAntenata: ManagerSpec = { columns: ['ereditata'] };
        const idx = index({
            Employee: [entry({ viewId: 'v-emp', manager: dellaClasse, declarationIndex: 1 })],
            Person: [entry({ viewId: 'v-per', manager: dellAntenata, declarationIndex: 0 })],
        });
        expect(resolveManagerSpec('c-employee', idx, LOOKUP).spec).toEqual(dellaClasse);

        // Stessa coppia, ma l'ereditata alza la priorita': `compareCandidates` mette la
        // priorita' PRIMA della specificita', e questo caso lo dimostra invece di fidarsi.
        const idx2 = index({
            Employee: [entry({ viewId: 'v-emp', manager: dellaClasse, declarationIndex: 1 })],
            Person: [entry({ viewId: 'v-per', manager: dellAntenata, declarationIndex: 0, priority: 5 })],
        });
        expect(resolveManagerSpec('c-employee', idx2, LOOKUP).spec).toEqual(dellAntenata);
    });

    it('a parita\' di tutto vince chi e\' stato dichiarato prima', () => {
        const primo: ManagerSpec = { columns: ['primo'] };
        const secondo: ManagerSpec = { columns: ['secondo'] };
        const r = resolveManagerSpec('c-person', index({
            Person: [
                entry({ viewId: 'v-b', manager: secondo, declarationIndex: 7 }),
                entry({ viewId: 'v-a', manager: primo, declarationIndex: 3 }),
            ],
        }), LOOKUP);
        expect(r.spec).toEqual(primo);
    });

    it('la wildcard vale, ed e\' l\'ultima', () => {
        const wild: ManagerSpec = { columns: ['da-wildcard'] };
        expect(resolveManagerSpec('c-person', index({}, [entry({ viewId: 'v-*', manager: wild })]), LOOKUP).spec)
            .toEqual(wild);

        const propria: ManagerSpec = { columns: ['propria'] };
        expect(resolveManagerSpec('c-person', index(
            { Person: [entry({ viewId: 'v-p', manager: propria, declarationIndex: 1 })] },
            [entry({ viewId: 'v-*', manager: wild, declarationIndex: 0 })],
        ), LOOKUP).spec).toEqual(propria);
    });

    it('un pin che non accetta la classe esclude la view', () => {
        const idx = index({ Person: [entry({ viewId: 'v-pin', manager: COLS, pins: { Person: 'c-altra' } })] });
        expect(resolveManagerSpec('c-person', idx, LOOKUP).spec).toBeNull();

        // Controllo positivo: lo stesso indice con il pin giusto risolve.
        const ok = index({ Person: [entry({ viewId: 'v-pin', manager: COLS, pins: { Person: 'c-person' } })] });
        expect(resolveManagerSpec('c-person', ok, LOOKUP).spec).toEqual(COLS);
    });
});
