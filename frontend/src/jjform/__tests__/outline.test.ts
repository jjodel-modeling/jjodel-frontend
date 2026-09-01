/**
 * Tests of `jjform/outline` — the menu and the default expansion (slice 10b).
 *
 * What is under test is NOT «does a slot have room»: that is `addChildReason`'s,
 * tested in `create.test.ts`, and re-testing it here would be the second copy of
 * the rule this module exists to avoid. What is under test is that the outline
 * ASKS those two functions and shapes their answer the way the design says —
 * offer in `entries`, refusal in `blocked` with its sentence, nothing greyed out.
 *
 * The fixture is a State Machine, the same model `Q8 Catalogo vs Outline.dc.html`
 * mocks: a rootable `Machine` with two child slots (one bounded), a singleton
 * `Config`, an abstract `Element`, and a leaf `Transition` with no children.
 */

import { describe, expect, it } from 'vitest';
import type { ClassShape, MetamodelShape, RefShape } from '../shape';
import {
    OUTLINE_DEFAULT_OPEN_DEPTH,
    childMenu,
    outlineLabel,
    outlineOpenByDefault,
    rootMenu,
} from '../outline';
import type { OutlineNode } from '../outline';
import { addChildReason } from '../create';

const ref = (o: Partial<RefShape> & { key: string; of: string }): RefShape => ({
    id: 'r_' + o.key,
    lower: 0, upper: -1, many: true, required: false,
    derived: false, readOnly: false,
    ofId: 'c_' + o.of, composition: true,
    ...o,
});

const cls = (o: Partial<ClassShape> & { key: string }): ClassShape => ({
    id: 'c_' + o.key,
    root: false, abstract: false, singleton: false, containedIn: [],
    attrs: [], refs: [], children: [],
    ...o,
});

const MACHINE = cls({
    key: 'Machine', root: true,
    children: [
        // Declared in THIS order, and not alphabetically: the menu must follow it.
        ref({ key: 'regions', of: 'Region' }),
        ref({ key: 'config', of: 'Config', upper: 1, many: false }),
    ],
});

const SHAPE: MetamodelShape = {
    enums: {},
    classes: {
        Machine: MACHINE,
        Region: cls({ key: 'Region', containedIn: ['Machine'], children: [ref({ key: 'states', of: 'State' })] }),
        State: cls({ key: 'State', containedIn: ['Region'] }),
        Transition: cls({ key: 'Transition', containedIn: ['Region'] }),
        Config: cls({ key: 'Config', root: true, singleton: true }),
        Element: cls({ key: 'Element', root: true, abstract: true }),
    },
};

const node = (o: Partial<OutlineNode> & { id: string }): OutlineNode => ({
    name: '', cls: '', kind: 'object', depth: 1, childKey: null, children: [], ...o,
});

describe('childMenu — il «+» di un nodo istanza', () => {
    it('offre una voce per ogni child slot con posto, nell ordine della shape', () => {
        const menu = childMenu(MACHINE, {});
        expect(menu.entries).toEqual([
            { cls: 'Region', childKey: 'regions', label: 'Add Region' },
            { cls: 'Config', childKey: 'config', label: 'Add Config' },
        ]);
        expect(menu.blocked).toEqual([]);
    });

    it('uno slot pieno esce da entries ed entra in blocked col motivo', () => {
        const menu = childMenu(MACHINE, { config: 1 });
        expect(menu.entries.map(e => e.childKey)).toEqual(['regions']);
        expect(menu.blocked).toHaveLength(1);
        expect(menu.blocked[0].key).toBe('config');
        // Il motivo e' quello di `addChildReason`, non una frase riscritta qui.
        expect(menu.blocked[0].reason).toContain('full');
        expect(menu.blocked[0].reason).toContain('config');
    });

    it('lo slot unbounded non si riempie mai, per quanti figli tenga', () => {
        expect(childMenu(MACHINE, { regions: 99 }).entries.map(e => e.childKey))
            .toEqual(['regions', 'config']);
    });

    it('una chiave assente da counts vale zero, non «sconosciuto»', () => {
        expect(childMenu(MACHINE).entries).toHaveLength(2);
    });

    it('una metaclasse foglia non ha ne offerte ne motivi — il «+» e assente', () => {
        const menu = childMenu(SHAPE.classes.Transition, {});
        expect(menu.entries).toEqual([]);
        expect(menu.blocked).toEqual([]);
    });

    it('uno slot read-only e bloccato col suo motivo', () => {
        const ro = cls({ key: 'X', children: [ref({ key: 'kids', of: 'State', readOnly: true })] });
        expect(childMenu(ro, {}).entries).toEqual([]);
        expect(childMenu(ro, {}).blocked[0].reason).toContain('read-only');
    });

    it('nessuna metaclasse — menu vuoto, non un errore', () => {
        expect(childMenu(null)).toEqual({ entries: [], blocked: [] });
    });
});

describe('rootMenu — il «+» del nodo modello', () => {
    it('offre le sole rootable concrete', () => {
        const menu = rootMenu(SHAPE, {});
        expect(menu.entries).toEqual([
            { cls: 'Machine', childKey: null, label: 'New Machine' },
            { cls: 'Config', childKey: null, label: 'New Config' },
        ]);
        expect(menu.blocked).toEqual([]);
    });

    it('la contenuta NON e in blocked: il suo motivo lo da il catalogo', () => {
        const keys = [...rootMenu(SHAPE, {}).entries, ...rootMenu(SHAPE, {}).blocked]
            .map(e => ('cls' in e ? e.cls : e.key));
        expect(keys).not.toContain('Region');
        expect(keys).not.toContain('State');
    });

    it('la astratta non compare da nessuna delle due parti', () => {
        const menu = rootMenu(SHAPE, {});
        expect(menu.entries.map(e => e.cls)).not.toContain('Element');
        expect(menu.blocked.map(b => b.key)).not.toContain('Element');
    });

    // MISURATO a schermo (`scripts/smoke/_tmp_10b_verify.ts`) e dichiarato qui: in
    // jjodel un singleton non e' MAI `root` — `shapeDraw` calcola `root` come
    // «concrete, not singleton, not the target of any containment reference» — quindi
    // questo caso non e' raggiungibile dall'adapter vivo, e nemmeno il catalogo offre
    // il `New` di un singleton (lo istanzia il callback di persist del DModel). Il
    // caso resta pinnato perche' e' il CONTRATTO di `newInstanceReason`, di cui questo
    // modulo e' un consumatore e non una seconda copia: se un giorno `root` cambiasse
    // definizione, il menu deve gia' sapere cosa dire.
    it('il singleton gia istanziato esce da entries ed entra in blocked', () => {
        const menu = rootMenu(SHAPE, { Config: 1 });
        expect(menu.entries.map(e => e.cls)).toEqual(['Machine']);
        expect(menu.blocked).toHaveLength(1);
        expect(menu.blocked[0].key).toBe('Config');
        expect(menu.blocked[0].reason).toContain('Singleton');
    });

    it('il conteggio di una NON singleton non blocca niente', () => {
        expect(rootMenu(SHAPE, { Machine: 12 }).entries.map(e => e.cls)).toEqual(['Machine', 'Config']);
    });

    it('nessuna shape — menu vuoto, non un errore', () => {
        expect(rootMenu(null)).toEqual({ entries: [], blocked: [] });
    });
});

describe('outlineOpenByDefault — quanto si apre da solo', () => {
    it('modello e radici aperti, il terzo livello no', () => {
        expect(OUTLINE_DEFAULT_OPEN_DEPTH).toBe(2);
        expect(outlineOpenByDefault(0)).toBe(true);
        expect(outlineOpenByDefault(1)).toBe(true);
        expect(outlineOpenByDefault(2)).toBe(false);
        expect(outlineOpenByDefault(7)).toBe(false);
    });
});

describe('outlineLabel — cosa legge una riga', () => {
    it('il nome quando c e', () => {
        expect(outlineLabel(node({ id: 's1', name: 'Idle' }))).toBe('Idle');
    });
    it('un oggetto senza nome non e una riga vuota', () => {
        expect(outlineLabel(node({ id: 's1', name: '   ' }))).toBe('unnamed');
    });
    it('il puntatore morto dice cosa e', () => {
        expect(outlineLabel(node({ id: 'ghost', kind: 'broken' }))).toBe('dangling pointer');
    });
    it('nessun nodo — stringa vuota, non un errore', () => {
        expect(outlineLabel(null)).toBe('');
    });
});


// ── CRUD2 §2.6: la stessa regola, la seconda superficie ──────────────────────

describe('childMenu — the abstract gate reaches the outline too (CRUD2 §2.6)', () => {
    // `Element` is already declared abstract in SHAPE above and is the positive
    // control of this block: a slot typed on it is the case the gate exists for.
    const ABSTRACT_HOST = cls({
        key: 'Host', root: true,
        children: [
            ref({ key: 'parts', of: 'Element' }),   // abstract target
            ref({ key: 'regions', of: 'Region' }),  // concrete target
        ],
    });

    it('positive control: the fixture really declares Element abstract', () => {
        expect(SHAPE.classes.Element.abstract).toBe(true);
        expect(SHAPE.classes.Region.abstract).toBe(false);
    });

    it('blocks the abstract slot and keeps the concrete one, when the shape is given', () => {
        const menu = childMenu(ABSTRACT_HOST, {}, SHAPE);
        expect(menu.entries.map(e => e.childKey)).toEqual(['regions']);
        expect(menu.blocked.map(b => b.key)).toEqual(['parts']);
        expect(menu.blocked[0].reason).toContain('abstract');
    });

    it('without the shape the menu is exactly what it was before this slice', () => {
        const menu = childMenu(ABSTRACT_HOST, {});
        expect(menu.entries.map(e => e.childKey)).toEqual(['parts', 'regions']);
        expect(menu.blocked).toEqual([]);
    });

    it('agrees with addChildReason on the same pair — one rule, two surfaces', () => {
        const parts = ABSTRACT_HOST.children[0];
        expect(childMenu(ABSTRACT_HOST, {}, SHAPE).blocked[0].reason)
            .toBe(addChildReason(parts, 0, SHAPE.classes.Element));
    });
});
