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
import {
    NOTATION_CATALOG, CATALOG_NOTATIONS, CATALOG_FAMILIES, applyPresetToShape,
    filterCatalog, catalogSections, catalogFamilySections, getCatalogPreset,
} from '../notationCatalog';
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

    it('le notazioni rappresentate: le cinque di P5, Base (D24) e le tre di Goal (D6)', () => {
        expect([...CATALOG_NOTATIONS].sort()).toEqual(
            ['BPMN', 'Base', 'ER', 'Flowchart', 'Petri net', 'UML', 'GRL', 'KAOS', 'i*'].sort(),
        );
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

describe('notationCatalog: applyPresetToShape con keepRules (D7, slice 4b)', () => {
    const byId = (id: string) => {
        const p = NOTATION_CATALOG.find(x => x.id === id);
        if (!p) throw new Error(`preset ${id} non in tabella`);
        return p;
    };

    /** `eq <path> true`: la forma che il PredicateBuilder scrive per un flag. */
    const flag = (name: string) =>
        ({ op: 'eq', left: `$${name}.value`, right: { kind: 'boolean', value: true } }) as any;

    /** Un fill a due regole, senza `default`: e' il caso del criterio di accettazione. */
    const twoRuleFill = () => ({
        rules: [
            { when: flag('isFinal'), then: '#ff0000' },
            { when: flag('isInitial'), then: '#00ff00' },
        ],
    });

    it('un fill a 2 regole resta intatto, e NESSUN default viene scritto', () => {
        const fill = twoRuleFill();
        const shape: ShapeSpec = { form: 'rect', fill: fill as any };
        // uml-initial-state DICHIARA un fill (#334155): senza keepRules lo scriverebbe.
        const next = applyPresetToShape(shape, byId('uml-initial-state'), { keepRules: true });
        expect(next.fill).toBe(fill);
        expect(next.fill).toEqual(twoRuleFill());
        // D2, la meta' che la spec di slice 4 sbagliava: non si inietta un default che
        // l'utente non ha mai scelto, perche' cambierebbe cio' che disegna ogni istanza
        // che non matcha nessuna regola.
        expect('default' in (next.fill as any)).toBe(false);
        // e l'asse che il preset governa davvero segue il preset
        expect(next.form).toBe('circle');
    });

    it('un marker condizionale sopravvive a un preset che non ne dichiara alcuno', () => {
        const marker = { rules: [{ when: flag('isFinal'), then: 'clock' }] };
        const shape: ShapeSpec = { form: 'rounded', marker: marker as any };
        // bpmn-task non dichiara marker: senza keepRules lo RIMUOVEREBBE.
        const next = applyPresetToShape(shape, byId('bpmn-task'), { keepRules: true });
        expect(next.marker).toBe(marker);
        const without = applyPresetToShape(shape, byId('bpmn-task'));
        expect('marker' in without).toBe(false);
    });

    it('per asse: la width condizionale resta, lo style scalare segue il preset', () => {
        const width = { rules: [{ when: flag('isFinal'), then: 5 }] };
        const shape: ShapeSpec = {
            form: 'rect',
            border: { color: '#aa0000', width: width as any, style: 'dotted' },
        };
        const next = applyPresetToShape(shape, byId('er-weak-entity'), { keepRules: true });
        expect(next.border?.width).toBe(width);
        expect(next.border?.style).toBe('double');   // scalare: segue il preset
        expect(next.border?.color).toBe('#aa0000');  // sempre dell'autore, come gia' oggi
    });

    it('keepRules spento: risultato identico a oggi, asse per asse', () => {
        const shape: ShapeSpec = {
            form: 'rect',
            fill: twoRuleFill() as any,
            marker: { rules: [{ when: flag('isFinal'), then: 'clock' }] } as any,
            border: { color: '#aa0000', width: { rules: [] } as any, style: 'dotted' },
        };
        for (const id of ['uml-initial-state', 'bpmn-task', 'er-weak-entity']) {
            expect(applyPresetToShape(shape, byId(id), { keepRules: false }))
                .toEqual(applyPresetToShape(shape, byId(id)));
        }
    });

    it('su assi tutti scalari keepRules non cambia nulla', () => {
        const shape: ShapeSpec = {
            form: 'rect',
            fill: '#ffeeaa',
            border: { color: '#aa0000', width: 2, style: 'dotted' },
            marker: 'gear',
        };
        for (const id of ['uml-initial-state', 'bpmn-task', 'er-weak-entity', 'goal-softgoal']) {
            expect(applyPresetToShape(shape, byId(id), { keepRules: true }))
                .toEqual(applyPresetToShape(shape, byId(id)));
        }
    });

    it('la form segue sempre il preset, anche condizionale (D7 non la elenca)', () => {
        const shape: ShapeSpec = {
            form: { rules: [{ when: flag('isFinal'), then: 'circle' }] } as any,
        };
        expect(applyPresetToShape(shape, byId('bpmn-task'), { keepRules: true }).form).toBe('rounded');
    });

    it('l input non muta e il risultato e un oggetto nuovo', () => {
        const shape: ShapeSpec = { form: 'rect', fill: twoRuleFill() as any };
        const snapshot = JSON.parse(JSON.stringify(shape));
        const next = applyPresetToShape(shape, byId('uml-initial-state'), { keepRules: true });
        expect(shape).toEqual(snapshot);
        expect(next).not.toBe(shape);
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

describe('notationCatalog: catalogSections e getCatalogPreset (D18)', () => {
    it('una sezione per notazione, nell ordine di CATALOG_NOTATIONS, coi totali pieni', () => {
        const sections = catalogSections('');
        expect(sections.map(s => s.notation)).toEqual([...CATALOG_NOTATIONS]);
        for (const s of sections) {
            expect(s.presets.length).toBe(s.total);
            expect(s.presets.every(p => p.notation === s.notation)).toBe(true);
        }
        expect(sections.reduce((n, s) => n + s.total, 0)).toBe(NOTATION_CATALOG.length);
    });

    it('la query filtra i presets ma non i totali; le sezioni vuote restano nell indice', () => {
        const sections = catalogSections('gateway');
        expect(sections.length).toBe(CATALOG_NOTATIONS.length);
        const bpmn = sections.find(s => s.notation === 'BPMN');
        expect(bpmn?.presets.map(p => p.id)).toEqual([
            'bpmn-exclusive-gateway', 'bpmn-parallel-gateway',
            'bpmn-inclusive-gateway', 'bpmn-complex-gateway',
        ]);
        expect(bpmn?.total).toBe(filterCatalog('BPMN', '').length);
        const flow = sections.find(s => s.notation === 'Flowchart');
        expect(flow?.presets).toEqual([]);
        expect(flow?.total).toBe(filterCatalog('Flowchart', '').length);
    });

    it('l ordine dentro una sezione e l ordine di tabella', () => {
        const er = catalogSections('').find(s => s.notation === 'ER');
        expect(er?.presets.map(p => p.id))
            .toEqual(NOTATION_CATALOG.filter(p => p.notation === 'ER').map(p => p.id));
    });

    it('una query multi-notazione pesca nelle sole sezioni giuste, in ordine di indice', () => {
        const nonEmpty = catalogSections('decisione')
            .filter(s => s.presets.length > 0)
            .map(s => s.notation);
        expect(nonEmpty).toEqual(['BPMN', 'UML', 'Flowchart']);
    });

    it('getCatalogPreset: id noto risolve alla riga di tabella, id ignoto a undefined', () => {
        const p = getCatalogPreset('bpmn-timer-event');
        expect(p).toBe(NOTATION_CATALOG.find(x => x.id === 'bpmn-timer-event'));
        expect(getCatalogPreset('project-stencil-not-yet')).toBeUndefined();
        expect(getCatalogPreset('')).toBeUndefined();
    });
});

describe('notationCatalog: famiglie e catalogFamilySections (D24)', () => {
    it('ogni riga dichiara una famiglia del vocabolario ordinato', () => {
        for (const p of NOTATION_CATALOG) {
            expect(p.family).toBeDefined();
            expect(CATALOG_FAMILIES).toContain(p.family);
        }
    });

    it('una sezione per famiglia, in ordine dichiarato, coi totali che coprono la tabella', () => {
        const sections = catalogFamilySections('', '');
        expect(sections.map(s => s.family)).toEqual([...CATALOG_FAMILIES]);
        for (const s of sections) {
            expect(s.presets.length).toBe(s.total);
            expect(s.presets.every(p => p.family === s.family)).toBe(true);
            // l'ordine dentro una sezione e' l'ordine di tabella
            expect(s.presets.map(p => p.id))
                .toEqual(NOTATION_CATALOG.filter(p => p.family === s.family).map(p => p.id));
        }
        expect(sections.reduce((n, s) => n + s.total, 0)).toBe(NOTATION_CATALOG.length);
    });

    it('il filtro di notazione (chip) restringe i preset ma mai i totali', () => {
        const sections = catalogFamilySections('', 'Petri net');
        const process = sections.find(s => s.family === 'Process');
        expect(process?.presets.map(p => p.id))
            .toEqual(['petri-place', 'petri-marked-place', 'petri-transition']);
        expect(process?.total).toBe(NOTATION_CATALOG.filter(p => p.family === 'Process').length);
        const data = sections.find(s => s.family === 'Data (ER)');
        expect(data?.presets).toEqual([]);
        expect(data?.total).toBe(7);
    });

    it('query e chip si compongono, e le sezioni vuote restano nell indice', () => {
        const sections = catalogFamilySections('gateway', 'UML');
        expect(sections.length).toBe(CATALOG_FAMILIES.length);
        expect(sections.every(s => s.presets.length === 0)).toBe(true);
        const both = catalogFamilySections('gateway', 'BPMN');
        expect(both.find(s => s.family === 'Process')?.presets.map(p => p.id)).toEqual([
            'bpmn-exclusive-gateway', 'bpmn-parallel-gateway',
            'bpmn-inclusive-gateway', 'bpmn-complex-gateway',
        ]);
    });

    it('la famiglia Goal (D6): nove preset in coda, e il catalogo arriva a 56', () => {
        expect(NOTATION_CATALOG).toHaveLength(56);
        expect(CATALOG_FAMILIES).toHaveLength(5);
        // In coda: l'ordine di CATALOG_FAMILIES e' l'ordine delle sezioni.
        expect(CATALOG_FAMILIES[CATALOG_FAMILIES.length - 1]).toBe('Goal');
        const goal = catalogFamilySections('', '').find(s => s.family === 'Goal');
        expect(goal?.total).toBe(9);
        expect(goal?.presets.map(p => p.id)).toEqual([
            'goal-goal', 'goal-softgoal', 'goal-task', 'goal-resource', 'goal-actor',
            'goal-agent', 'goal-role', 'goal-belief', 'goal-obstacle',
        ]);
    });

    it('Goal: Agent e Role differiscono dall Actor per la sola barra, e l Obstacle non e un rombo', () => {
        expect(getCatalogPreset('goal-actor')?.values).toEqual({ form: 'circle' });
        expect(getCatalogPreset('goal-agent')?.values).toEqual({ form: 'circle', marker: 'bar-top' });
        expect(getCatalogPreset('goal-role')?.values).toEqual({ form: 'circle', marker: 'bar-bottom' });
        // Un rombo col bordo normale e' gia' la relationship ER, e la modale
        // titola con matches[0]: l'Obstacle si presenterebbe come «Relationship».
        expect(getCatalogPreset('goal-obstacle')?.values.form).toBe('parallelogram');
        expect(getCatalogPreset('goal-softgoal')?.values.form).toBe('cloud');
    });

    it('i preset nuovi (D24/D26) risolvono per id e citano solo primitivi esistenti', () => {
        expect(getCatalogPreset('base-rect')?.values.form).toBe('rect');
        expect(getCatalogPreset('base-diamond')?.family).toBe('Base');
        expect(getCatalogPreset('uml-flow-final')?.values).toEqual({ form: 'circle', marker: 'x' });
        expect(getCatalogPreset('uml-fork-join')?.values).toEqual({ form: 'rect', fill: '#334155' });
    });
});
