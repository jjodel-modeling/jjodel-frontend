/**
 * vertexLayout — the per-viewpoint layout resolver (R-LAY-14..17, slice 1a).
 *
 * Il modulo è puro e senza import: i test lo esercitano direttamente, senza store, senza mock
 * e senza DOM. È la condizione di R-LAY-16, e la ragione per cui il modulo non prende in
 * prestito `GraphSize` da `common/Geom.ts` (che trascinerebbe il barrel joiner e monaco: le 9
 * suite rosse della baseline muoiono tutte così).
 *
 * Coprono le due direzioni del contratto — read-through con fallback per RECORD e non per
 * campo, e la materializzazione completa alla prima scrittura sotto un viewpoint — più la
 * purezza, che qui non è cosmetica: il resolver riceve il D-object del vertice e il chiamante
 * della 1b lo riuserà dopo la chiamata.
 */
import { describe, it, expect } from 'vitest';
import {
    readVertexLayout,
    resolveVertexLayoutWrite,
    type VertexLayout,
    type VertexLayoutSource,
} from '../vertexLayout';

/** Gli scalari, cioè il record della sintassi astratta. */
const SCALARS: VertexLayout = { x: 10, y: 20, w: 300, h: 200, isResized: false };

const VP = 'Pointer_ViewPointA';
const OTHER_VP = 'Pointer_ViewPointB';

/** Il record che un gesto ha già scritto sotto VP: diverso dagli scalari in ogni campo. */
const UNDER_VP: VertexLayout = { x: 111, y: 222, w: 333, h: 444, isResized: true };

function source(dict?: { [vpId: string]: VertexLayout }): VertexLayoutSource {
    return dict ? { ...SCALARS, layoutByViewpoint: dict } : { ...SCALARS };
}

describe('readVertexLayout', () => {
    it('dizionario assente: legge gli scalari', () => {
        expect(readVertexLayout(source(), VP)).toEqual(SCALARS);
    });

    it('dizionario presente ma senza la chiave: legge gli scalari (read-through)', () => {
        expect(readVertexLayout(source({ [OTHER_VP]: UNDER_VP }), VP)).toEqual(SCALARS);
    });

    it('chiave presente: legge il record del viewpoint', () => {
        expect(readVertexLayout(source({ [VP]: UNDER_VP }), VP)).toEqual(UNDER_VP);
    });

    it('viewpoint nullo: legge gli scalari anche con il dizionario popolato', () => {
        // `null` è la sintassi astratta: nessun viewpoint attivo, oppure attivo ma non
        // esclusivo — l'adapter impuro della 1b collassa i due casi prima di arrivare qui.
        expect(readVertexLayout(source({ [VP]: UNDER_VP }), null)).toEqual(SCALARS);
    });

    it('chiave orfana: non viene mai consultata', () => {
        // R-LAY-17: il record di un viewpoint cancellato resta nel dizionario ed è garbage
        // inerte. Qui `OTHER_VP` sta per quel record: leggendo sotto VP non lo si vede.
        const src = source({ [OTHER_VP]: UNDER_VP });
        expect(readVertexLayout(src, VP)).toEqual(SCALARS);
        expect(readVertexLayout(src, null)).toEqual(SCALARS);
    });

    it('il record restituito è una copia, non il record persistito', () => {
        const dict = { [VP]: { ...UNDER_VP } };
        const out = readVertexLayout(source(dict), VP);
        out.x = -1;
        expect(dict[VP].x).toBe(UNDER_VP.x);
    });
});

describe('resolveVertexLayoutWrite', () => {
    it('viewpoint nullo: scrive sugli scalari, patch intatta', () => {
        const out = resolveVertexLayoutWrite(source(), { x: 42 }, null);
        expect(out).toEqual({ target: 'scalars', patch: { x: 42 } });
    });

    it('viewpoint nullo: gli scalari valgono anche con un dizionario già popolato', () => {
        const out = resolveVertexLayoutWrite(source({ [VP]: UNDER_VP }), { w: 7 }, null);
        expect(out).toEqual({ target: 'scalars', patch: { w: 7 } });
    });

    it('primo gesto sotto vp, patch di solo drag: il record è COMPLETO dagli scalari', () => {
        // L'emendamento di R-LAY-15. Senza materializzazione completa, w/h/isResized
        // resterebbero indefiniti sotto la chiave nuova e `manualSizeOf`
        // (jjomTransformers.ts:50-57) leggerebbe quei buchi invece degli scalari.
        const out = resolveVertexLayoutWrite(source(), { x: 99, y: 88 }, VP);
        expect(out).toEqual({
            target: 'dictionary',
            vpId: VP,
            record: { x: 99, y: 88, w: SCALARS.w, h: SCALARS.h, isResized: SCALARS.isResized },
        });
    });

    it('primo gesto sotto vp con dizionario già presente per un ALTRO vp: parte dagli scalari', () => {
        const out = resolveVertexLayoutWrite(source({ [OTHER_VP]: UNDER_VP }), { x: 99 }, VP);
        expect(out).toEqual({
            target: 'dictionary',
            vpId: VP,
            record: { ...SCALARS, x: 99 },
        });
    });

    it('gesto successivo: il record completo parte dal record esistente, non dagli scalari', () => {
        const out = resolveVertexLayoutWrite(source({ [VP]: UNDER_VP }), { x: 5 }, VP);
        expect(out).toEqual({
            target: 'dictionary',
            vpId: VP,
            record: { ...UNDER_VP, x: 5 },
        });
    });

    it('una patch di resize completa sovrascrive ogni campo', () => {
        const patch = { x: 1, y: 2, w: 3, h: 4, isResized: true };
        const out = resolveVertexLayoutWrite(source({ [VP]: UNDER_VP }), patch, VP);
        expect(out).toEqual({ target: 'dictionary', vpId: VP, record: patch });
    });

    it('il risultato riguarda solo vpId: gli altri record non compaiono', () => {
        const out = resolveVertexLayoutWrite(source({ [OTHER_VP]: UNDER_VP }), { x: 1 }, VP);
        expect(out.target).toBe('dictionary');
        // La descrizione porta un solo record e un solo id: la conservazione degli altri
        // viewpoint è affidata al merge '+=' del reducer, non a questo modulo.
        expect(Object.keys(out)).toEqual(['target', 'vpId', 'record']);
        if (out.target === 'dictionary') expect(out.vpId).toBe(VP);
    });

    it('una patch con undefined esplicito non buca il record materializzato', () => {
        const out = resolveVertexLayoutWrite(source(), { x: 5, w: undefined }, VP);
        expect(out).toEqual({
            target: 'dictionary',
            vpId: VP,
            record: { ...SCALARS, x: 5 },
        });
        if (out.target === 'dictionary') expect(out.record.w).toBe(SCALARS.w);
    });

    it('record vuoto: la patch vuota materializza comunque il record completo', () => {
        const out = resolveVertexLayoutWrite(source(), {}, VP);
        expect(out).toEqual({ target: 'dictionary', vpId: VP, record: SCALARS });
    });
});

describe('purezza', () => {
    it('readVertexLayout non muta la sorgente', () => {
        const src = source({ [VP]: { ...UNDER_VP } });
        const snapshot = JSON.parse(JSON.stringify(src));
        readVertexLayout(src, VP);
        readVertexLayout(src, OTHER_VP);
        readVertexLayout(src, null);
        expect(src).toEqual(snapshot);
    });

    it('resolveVertexLayoutWrite non muta né la sorgente né la patch', () => {
        const src = source({ [VP]: { ...UNDER_VP } });
        const snapshot = JSON.parse(JSON.stringify(src));
        const patch = { x: 1, y: 2 };
        const patchSnapshot = { ...patch };

        resolveVertexLayoutWrite(src, patch, VP);
        resolveVertexLayoutWrite(src, patch, OTHER_VP);
        resolveVertexLayoutWrite(src, patch, null);

        expect(src).toEqual(snapshot);
        expect(patch).toEqual(patchSnapshot);
    });

    it('mutare il record restituito non tocca il dizionario di partenza', () => {
        const src = source({ [VP]: { ...UNDER_VP } });
        const out = resolveVertexLayoutWrite(src, { x: 1 }, VP);
        if (out.target === 'dictionary') out.record.y = -999;
        expect(src.layoutByViewpoint![VP]).toEqual(UNDER_VP);
    });

    it('la patch restituita nel caso scalars è una copia', () => {
        const patch = { x: 1 };
        const out = resolveVertexLayoutWrite(source(), patch, null);
        if (out.target === 'scalars') out.patch.x = -1;
        expect(patch.x).toBe(1);
    });
});
