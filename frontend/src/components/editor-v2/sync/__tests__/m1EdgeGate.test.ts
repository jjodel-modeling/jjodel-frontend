/**
 * m1EdgeGate — BOOT1: su un grafo i cui vertici M1 devono ancora nascere, il gate
 * davanti allo Step 4 deve contare gli archi, non azzerarsi.
 *
 * Il fixture e' lo stato misurato il 2026-09-02 con la sonda
 * `scripts/smoke/_tmp_boot1_verifyC.ts`, e non uno inventato: modello `pippo` con
 * `A : Author` e `Book_0 : Book` radici, `Edition_0 : Edition` creata dal Data
 * Manager dentro lo slot `editions` (quindi FUORI da `model.objects`, con un
 * vertice suo perche' `createAdapter.syncChildToFlow` glielo ha fatto), e
 * `Book_0.authors = [A]`. Alla riapertura del canvas i due vertici delle radici
 * non ci sono ancora: e' lo stato esatto in cui il contatore vecchio dava 0.
 *
 * Le asserzioni sono di IDENTITA' — quale oggetto, quale metareference, quale
 * bersaglio — non di sola esistenza: un contatore cieco che ritorna un numero
 * giusto per la ragione sbagliata passerebbe un test di sola esistenza.
 */
import { describe, it, expect } from 'vitest';
import {
    collectPendingVertexObjects,
    collectMissingM1Edges,
    type MissingM1Edge,
} from '../m1EdgeGate';

const AUTHORS = 'Ref_authors';
const EDITIONS = 'Ref_editions';
const A = 'Obj_A', BOOK = 'Obj_Book_0', ED = 'Obj_Edition_0';
const V_ED = 'Vertex_Edition_0';

/** Lo stato al momento della riapertura: solo Edition_0 ha gia' un vertice. */
function fixture() {
    const idlookup: Record<string, any> = {
        [A]: { className: 'DObject', features: [] },
        [BOOK]: { className: 'DObject', features: ['Val_authors', 'Val_editions'] },
        [ED]: { className: 'DObject', features: [] },
        Val_authors: { className: 'DValue', instanceof: AUTHORS, values: [A] },
        Val_editions: { className: 'DValue', instanceof: EDITIONS, values: [ED] },
        [AUTHORS]: { className: 'DReference' },
        [EDITIONS]: { className: 'DReference' },
    };
    return {
        objects: [A, BOOK],                       // Edition_0 non e' qui: sta nello slot
        idlookup,
        vertexByObject: new Map<string, string>([[ED, V_ED]]),
        isSuppressed: () => false,
        existingEdgeKeys: new Set<string>(),
    };
}

const find = (rows: MissingM1Edge[], meta: string) => rows.filter(r => r.metaId === meta);

describe('collectPendingVertexObjects', () => {
    it('elenca le radici che lo Step 2bis sta per disegnare, e non quelle gia' + "'" + ' disegnate', () => {
        const f = fixture();
        const pending = collectPendingVertexObjects(f);
        expect([...pending].sort()).toEqual([A, BOOK].sort());
        expect(pending.has(ED)).toBe(false);   // ha gia' il suo vertice
    });

    it('rispetta le stesse quattro esclusioni dello Step 2bis', () => {
        const f = fixture();
        expect(collectPendingVertexObjects({ ...f, isSuppressed: (id) => id === BOOK }))
            .toEqual(new Set([A]));
        expect(collectPendingVertexObjects({ ...f, objects: [A, BOOK, 'Obj_fantasma'] }))
            .toEqual(new Set([A, BOOK]));       // fuori da idlookup
        expect(collectPendingVertexObjects({ ...f, objects: [A, BOOK, 42 as any] }))
            .toEqual(new Set([A, BOOK]));       // non stringa
        expect(collectPendingVertexObjects({
            ...f, vertexByObject: new Map([[ED, V_ED], [A, 'Vertex_A']]),
        })).toEqual(new Set([BOOK]));           // gia' con vertice
    });
});

describe('collectMissingM1Edges — il gate dello Step 4', () => {
    it('conta i due archi anche quando il vertice del sorgente non esiste ancora', () => {
        const f = fixture();
        const pendingVertexObjects = collectPendingVertexObjects(f);
        const rows = collectMissingM1Edges({ ...f, pendingVertexObjects });
        expect(rows).toHaveLength(2);

        const [aut] = find(rows, AUTHORS);
        expect(aut).toMatchObject({ srcObject: BOOK, tgtObject: A, srcVertex: null, tgtVertex: null });

        const [edi] = find(rows, EDITIONS);
        // il bersaglio contenuto HA gia' il suo vertice: identita', non sola esistenza
        expect(edi).toMatchObject({ srcObject: BOOK, tgtObject: ED, srcVertex: null, tgtVertex: V_ED });
    });

    it('la containment non e' + "'" + ' un caso speciale: e' + "'" + ' trovata dalla stessa passeggiata della reference', () => {
        const f = fixture();
        const rows = collectMissingM1Edges({ ...f, pendingVertexObjects: collectPendingVertexObjects(f) });
        expect(find(rows, EDITIONS).map(r => r.tgtObject)).toEqual([ED]);
        expect(find(rows, AUTHORS).map(r => r.tgtObject)).toEqual([A]);
    });

    it('un endpoint ancora senza vertice non porta chiave: l' + "'" + 'arco non puo' + "'" + ' esistere', () => {
        const f = fixture();
        const rows = collectMissingM1Edges({ ...f, pendingVertexObjects: collectPendingVertexObjects(f) });
        expect(rows.every(r => r.key === null)).toBe(true);
    });

    it('con i vertici gia' + "'" + ' presenti usa la chiave composita e non duplica', () => {
        const f = fixture();
        const vertexByObject = new Map([[ED, V_ED], [A, 'Vertex_A'], [BOOK, 'Vertex_Book']]);
        const base = { ...f, vertexByObject, pendingVertexObjects: new Set<string>() };
        const rows = collectMissingM1Edges(base);
        expect(rows.map(r => r.key).sort()).toEqual([
            `${AUTHORS}:Vertex_Book→Vertex_A`,
            `${EDITIONS}:Vertex_Book→${V_ED}`,
        ].sort());

        // gia' disegnati: il gate deve tacere, altrimenti Step 4 rifa' gli stessi archi
        const done = collectMissingM1Edges({
            ...base, existingEdgeKeys: new Set(rows.map(r => r.key!)),
        });
        expect(done).toEqual([]);
    });

    it('sorgenti fratelli sulla stessa coppia restano archi distinti (chiave composita, §3.4)', () => {
        const f = fixture();
        f.idlookup[BOOK].features = ['Val_authors', 'Val_second'];
        f.idlookup.Val_second = { className: 'DValue', instanceof: 'Ref_editor', values: [A] };
        f.idlookup.Ref_editor = { className: 'DReference' };
        const vertexByObject = new Map([[A, 'Vertex_A'], [BOOK, 'Vertex_Book']]);
        const rows = collectMissingM1Edges({
            ...f, vertexByObject, pendingVertexObjects: new Set<string>(),
        });
        expect(rows.map(r => r.key).sort()).toEqual([
            `${AUTHORS}:Vertex_Book→Vertex_A`,
            `Ref_editor:Vertex_Book→Vertex_A`,
        ].sort());
    });

    it('uno slot il cui instanceof non e' + "'" + ' una DReference non produce archi', () => {
        const f = fixture();
        f.idlookup[AUTHORS] = { className: 'DAttribute' };
        const rows = collectMissingM1Edges({ ...f, pendingVertexObjects: collectPendingVertexObjects(f) });
        expect(find(rows, AUTHORS)).toEqual([]);
        expect(rows).toHaveLength(1);
    });

    it('un bersaglio che non avra' + "'" + ' mai un vertice viene saltato, non contato a vuoto', () => {
        const f = fixture();
        f.idlookup.Val_authors.values = ['Obj_altrove'];
        const rows = collectMissingM1Edges({ ...f, pendingVertexObjects: collectPendingVertexObjects(f) });
        expect(find(rows, AUTHORS)).toEqual([]);
    });
});
