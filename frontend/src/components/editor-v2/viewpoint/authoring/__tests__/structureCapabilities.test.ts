/**
 * Unit tests for the level-2 capability table (Turno 7a/7b).
 *
 * The table is what makes «assente, non disabilitato» safe: every option the panel
 * drops has to be dropped for a stated geometric reason, and every absence has to
 * turn up in the summary row. Both halves are asserted here, on the two shapes the
 * design draws — the rectangle that offers everything and the stadium that does not.
 */
import { describe, it, expect } from 'vitest';
import {
    ALL_ACCENT_PLACEMENTS,
    ALL_COMPARTMENT_MODES,
    ALL_NAME_POSITIONS,
    SHAPE_LABEL,
    accentPlacementReason,
    compartmentModeReason,
    hiddenFieldNotes,
    namePositionReason,
    structureCapabilities,
} from '../../ir/structureCapabilities';
import type { ShapeForm } from '../../ir/irTypes';

const ALL_FORMS: ShapeForm[] = [
    'rect', 'rounded', 'ellipse', 'circle', 'diamond',
    'stadium', 'hexagon', 'parallelogram', 'cylinder',
];

describe('structureCapabilities — the rectangle offers everything (7a)', () => {
    const caps = structureCapabilities('rect');

    it('offers the header band, and says why it is available', () => {
        expect(caps.namePositions).toEqual([...ALL_NAME_POSITIONS]);
        expect(caps.defaultNamePosition).toBe('header-band');
        expect(namePositionReason(caps)).toBe('Header band available because the Symbol is Rectangle');
    });

    it('offers Top and Left, and therefore no Ring', () => {
        expect(caps.accentPlacements).toEqual(['none', 'top', 'left']);
        expect(caps.accentPlacements).not.toContain('ring');
        // No absence to explain: the reason line is for an absence, not for a state.
        expect(accentPlacementReason(caps)).toBeNull();
    });

    it('offers the inline compartment and keeps the Field compartments section', () => {
        expect(caps.compartmentModes).toEqual([...ALL_COMPARTMENT_MODES]);
        expect(caps.defaultCompartmentMode).toBe('inline');
        expect(caps.showsFieldCompartments).toBe(true);
        expect(compartmentModeReason(caps)).toBeNull();
    });

    it('hides nothing while the mode is inline', () => {
        expect(hiddenFieldNotes(caps, 'inline')).toEqual([]);
    });
});

describe('structureCapabilities — the stadium denies them (7b)', () => {
    const caps = structureCapabilities('stadium');

    it('drops the header band with the design\'s own reason', () => {
        expect(caps.namePositions).not.toContain('header-band');
        expect(caps.namePositions).toEqual(['center', 'below', 'external']);
        expect(caps.defaultNamePosition).toBe('center');
        expect(namePositionReason(caps)).toBe('Header band not offered: Stadium has no flat top edge');
    });

    it('replaces Top / Left with Ring', () => {
        expect(caps.accentPlacements).toEqual(['none', 'ring']);
        expect(accentPlacementReason(caps)).toBe('Ring replaces Top / Left on shapes without straight edges');
    });

    it('drops the inline compartment and the Field compartments section with it', () => {
        expect(caps.compartmentModes).toEqual(['popover', 'none']);
        expect(caps.defaultCompartmentMode).toBe('none');
        expect(caps.showsFieldCompartments).toBe(false);
        expect(compartmentModeReason(caps))
            .toBe('Inline not offered: a Stadium has no room for rows. The diagram is topology');
    });
});

describe('hiddenFieldNotes — the two families of cause', () => {
    it('separates what the choice made inert from what the Symbol removed', () => {
        const notes = hiddenFieldNotes(structureCapabilities('stadium'), 'none');
        expect(notes).toEqual([
            { fields: ['Columns', 'Empty slots', 'Edge marker'], cause: 'Mode is None', family: 'choice' },
            { fields: ['Field compartments'], cause: 'no compartment on this Symbol', family: 'symbol' },
        ]);
    });

    it('reports the choice alone on a Symbol that does have a compartment', () => {
        const notes = hiddenFieldNotes(structureCapabilities('rect'), 'none');
        expect(notes).toHaveLength(1);
        expect(notes[0].family).toBe('choice');
    });

    it('reports the Symbol alone while a stadium is on Popover', () => {
        const notes = hiddenFieldNotes(structureCapabilities('stadium'), 'popover');
        expect(notes).toHaveLength(1);
        expect(notes[0].family).toBe('symbol');
    });
});

describe('structureCapabilities — the table as a whole', () => {
    it('covers every ShapeForm, and never offers an empty vocabulary', () => {
        for (const form of ALL_FORMS) {
            const caps = structureCapabilities(form);
            expect(caps.form).toBe(form);
            expect(SHAPE_LABEL[form]).toBeTruthy();
            expect(caps.namePositions.length).toBeGreaterThan(0);
            expect(caps.accentPlacements.length).toBeGreaterThan(0);
            expect(caps.compartmentModes.length).toBeGreaterThan(0);
        }
    });

    it('always offers a default that is itself on offer', () => {
        for (const form of ALL_FORMS) {
            const caps = structureCapabilities(form);
            expect(caps.namePositions).toContain(caps.defaultNamePosition);
            expect(caps.accentPlacements).toContain(caps.defaultAccentPlacement);
            expect(caps.compartmentModes).toContain(caps.defaultCompartmentMode);
        }
    });

    it('offers Ring exactly when it offers neither Top nor Left', () => {
        for (const form of ALL_FORMS) {
            const { accentPlacements } = structureCapabilities(form);
            const bar = accentPlacements.includes('top') || accentPlacements.includes('left');
            expect(accentPlacements.includes('ring')).toBe(!bar);
        }
    });

    it('shows the Field compartments section exactly where inline is on offer', () => {
        for (const form of ALL_FORMS) {
            const caps = structureCapabilities(form);
            expect(caps.showsFieldCompartments).toBe(caps.compartmentModes.includes('inline'));
        }
    });

    it('offers no value outside its vocabulary', () => {
        for (const form of ALL_FORMS) {
            const caps = structureCapabilities(form);
            for (const p of caps.namePositions) expect(ALL_NAME_POSITIONS).toContain(p);
            for (const a of caps.accentPlacements) expect(ALL_ACCENT_PLACEMENTS).toContain(a);
            for (const m of caps.compartmentModes) expect(ALL_COMPARTMENT_MODES).toContain(m);
        }
    });

    it('falls back to the rectangle for an absent or unrecognized form', () => {
        // A Conditional `shape.form` reaches the panel as undefined: the tab then offers
        // the superset instead of narrowing on one branch of the conditional.
        expect(structureCapabilities(undefined)).toEqual(structureCapabilities('rect'));
        expect(structureCapabilities('trapezoid' as ShapeForm)).toEqual(structureCapabilities('rect'));
    });
});
