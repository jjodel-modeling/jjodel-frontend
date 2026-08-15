/**
 * Catalogo dei preset (D10): integrita' referenziale della tabella e semantica
 * di applicazione.
 *
 * La tabella e' dati e crescera'; questi test fissano cio' che ogni riga deve
 * rispettare (id univoci, marker esistenti nel registry, forme del catalogo
 * corrente, il vincolo width>=3 sui double) e cio' che l'applicazione di un
 * preset deve e NON deve toccare (il colore del bordo e' dell'autore, il
 * marker precedente non sopravvive, labels e badges passano intatti).
 */

import { describe, it, expect } from 'vitest';
import { NOTATION_CATALOG, CATALOG_NOTATIONS, applyPresetToShape, filterCatalog } from '../notationCatalog';
import { MARKER_REGISTRY } from '../markerRegistry';
import { SHAPE_REGISTRY } from '../shapeRegistry';
import type { ShapeSpec } from '../irTypes';

const BORDER_STYLES = ['solid', 'dashed', 'dotted', 'double'];

describe('notationCatalog: integrita della tabella', () => {
    it('id univoci e notazione presente nel filtro', () => {
        const ids = NOTATION_CATALOG.map(p => p.id);
        expect(new Set(ids).size).toBe(ids.length);
        for (const p of NOTATION_CATALOG) expect(CATALOG_NOTATIONS).toContain(p.notation);
    });

    it('ogni forma citata esiste nello shapeRegistry', () => {
        for (const p of NOTATION_CATALOG) {
            expect(SHAPE_REGISTRY[p.values.form]).toBeDefined();
        }
    });

    it('ogni marker citato esiste nel markerRegistry', () => {
        for (const p of NOTATION_CATALOG) {
            if (p.values.marker) expect(MARKER_REGISTRY[p.values.marker]).toBeDefined();
        }
    });

    it('bordi: stile nel vocabolario, e i double dichiarano width >= 3', () => {
        for (const p of NOTATION_CATALOG) {
            const b = p.values.border;
            if (!b) continue;
            expect(BORDER_STYLES).toContain(b.style);
            expect(b.width).toBeGreaterThan(0);
            if (b.style === 'double') expect(b.width).toBeGreaterThanOrEqual(3);
        }
    });

    it('le cinque notazioni verificate in P5 sono tutte rappresentate', () => {
        expect([...CATALOG_NOTATIONS].sort()).toEqual(['BPMN', 'ER', 'Flowchart', 'Petri net', 'UML'].sort());
    });
});

describe('notationCatalog: applyPresetToShape', () => {
    const byId = (id: string) => {
        const p = NOTATION_CATALOG.find(x => x.id === id);
        if (!p) throw new Error(`preset ${id} non in tabella`);
        return p;
    };

    const base: ShapeSpec = {
        form: 'rect',
        fill: '#ffeeaa',
        border: { color: '#aa0000', width: 2, style: 'dotted' },
        marker: 'gear',
        labels: [{ position: 'top', source: { from: 'intrinsic', prop: 'name' } }],
    };

    it('scrive form/border/marker e conserva il colore del bordo dell autore', () => {
        const next = applyPresetToShape(base, byId('bpmn-exclusive-gateway'));
        expect(next.form).toBe('diamond');
        expect(next.marker).toBe('x');
        expect(next.border).toEqual({ color: '#aa0000', width: 1, style: 'solid' });
    });

    it('un preset senza marker RIMUOVE il marker precedente', () => {
        const next = applyPresetToShape(base, byId('bpmn-task'));
        expect(next.form).toBe('rounded');
        expect('marker' in next).toBe(false);
    });

    it('fill scritto solo quando il preset lo dichiara', () => {
        const kept = applyPresetToShape(base, byId('er-weak-entity'));
        expect(kept.fill).toBe('#ffeeaa');
        expect(kept.border?.style).toBe('double');
        expect(kept.border?.width).toBe(3);
        const inked = applyPresetToShape(base, byId('uml-initial-state'));
        expect(inked.fill).toBe('#334155');
    });

    it('labels e il resto della spec passano intatti, e l input non muta', () => {
        const snapshot = JSON.parse(JSON.stringify(base));
        const next = applyPresetToShape(base, byId('uml-final-state'));
        expect(next.labels).toBe(base.labels);
        expect(base).toEqual(snapshot);
        expect(next).not.toBe(base);
    });

    it('senza bordo autore, il colore ricade sull ink di default', () => {
        const bare: ShapeSpec = { form: 'rect' };
        const next = applyPresetToShape(bare, byId('petri-transition'));
        expect(next.border?.color).toBe('#334155');
        expect(next.fill).toBe('#334155');
    });
});

describe('notationCatalog: filterCatalog', () => {
    it('filtra per notazione e cerca su label e keywords', () => {
        expect(filterCatalog('ER', '').every(p => p.notation === 'ER')).toBe(true);
        expect(filterCatalog('', 'gateway').length).toBeGreaterThanOrEqual(4);
        // keyword italiana dichiarata in tabella
        expect(filterCatalog('', 'decisione').map(p => p.id)).toContain('flow-decision');
        expect(filterCatalog('BPMN', 'timer').map(p => p.id)).toEqual(['bpmn-timer-event']);
        expect(filterCatalog('', 'zzz-niente')).toEqual([]);
    });
});
