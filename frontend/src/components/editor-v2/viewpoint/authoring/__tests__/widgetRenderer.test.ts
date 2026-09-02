/**
 * Unit tests for the widget <-> renderer correspondence and the precedence it settles
 * (Turno 7c).
 *
 * The property that matters is not the map itself but WHEN it produces a badge:
 * a view that agrees with the metamodel is not an override and must stay silent, or
 * every `color` widget on every `Color` attribute would grow a Reset link that undoes
 * nothing. Agreement, disagreement and "the metamodel says nothing" are asserted
 * separately because they are three different facts behind one absent badge.
 */
import { describe, it, expect } from 'vitest';
import {
    WIDGET_RENDERER,
    metamodelDeclares,
    rendererForWidget,
    viewRendererOverride,
    withoutViewWidget,
} from '../../ir/widgetRenderer';
import { metamodelRenderer, type SlotShape } from '../../../nodes/valueRenderer';
import {
    provenanceForRow,
    provenanceEvidence,
    slotShapeForRow,
    withFormEntry,
    type AuthoringFeatureRow,
} from '../FormAuthoringBody';
import type { WidgetKind } from '../../ir/irTypes';

const ALL_WIDGETS: WidgetKind[] = [
    'text', 'textarea', 'select', 'checkbox', 'color', 'number', 'reference', 'link',
];

/** `color : Color`, the feature 7c is drawn on. */
const COLOR_SLOT: SlotShape = { value: '#334155', typeName: 'Color', featureName: 'color' };
/** `description : EString` — nothing in the metamodel settles its rendering. */
const PLAIN_SLOT: SlotShape = { value: 'hello', typeName: 'EString', featureName: 'description' };

const row = (over: Partial<AuthoringFeatureRow> = {}): AuthoringFeatureRow => ({
    name: 'color', typeName: 'Color', lowerBound: 0, upperBound: 1,
    isEnum: false, isReference: false, isComposition: false, ...over,
});

describe('WIDGET_RENDERER', () => {
    it('is total over the widget vocabulary', () => {
        for (const w of ALL_WIDGETS) expect(rendererForWidget(w)).toBeTruthy();
        expect(Object.keys(WIDGET_RENDERER).sort()).toEqual([...ALL_WIDGETS].sort());
    });

    it('maps the six ratified pairs', () => {
        expect(rendererForWidget('color')).toBe('swatch');
        expect(rendererForWidget('textarea')).toBe('code');
        expect(rendererForWidget('select')).toBe('enumChip');
        expect(rendererForWidget('checkbox')).toBe('boolean');
        expect(rendererForWidget('number')).toBe('numberUnit');
        expect(rendererForWidget('text')).toBe('truncatedText');
    });

    it('sends both reference-shaped widgets to the pill', () => {
        expect(rendererForWidget('reference')).toBe('refPill');
        expect(rendererForWidget('link')).toBe('refPill');
    });

    it('answers null outside the vocabulary', () => {
        expect(rendererForWidget(undefined)).toBeNull();
        expect(rendererForWidget('')).toBeNull();
        expect(rendererForWidget('slider')).toBeNull();
    });

    it('leaves date and progress with no widget: only the metamodel can ask for them', () => {
        const asked = new Set(Object.values(WIDGET_RENDERER));
        expect(asked.has('date')).toBe(false);
        expect(asked.has('progress')).toBe(false);
        expect(asked.has('dash')).toBe(false);
        expect(asked.has('collection')).toBe(false);
        expect(asked.has('brokenRef')).toBe(false);
    });
});

describe('metamodelDeclares', () => {
    it('is true for a declared type and for an annotation', () => {
        expect(metamodelDeclares(metamodelRenderer(COLOR_SLOT))).toBe(true);
        expect(metamodelDeclares(metamodelRenderer({ ...PLAIN_SLOT, rendererOverride: 'code' }))).toBe(true);
    });

    it('is false for the floor, where instances decide by value', () => {
        expect(metamodelDeclares(metamodelRenderer(PLAIN_SLOT))).toBe(false);
    });
});

describe('viewRendererOverride — the three silences', () => {
    it('says nothing when the view declares no widget', () => {
        expect(viewRendererOverride(COLOR_SLOT, undefined)).toBeNull();
        expect(viewRendererOverride(COLOR_SLOT, '')).toBeNull();
    });

    it('says nothing when the metamodel declares nothing to cover', () => {
        expect(viewRendererOverride(PLAIN_SLOT, 'color')).toBeNull();
    });

    it('says nothing when the two agree — this is the ratified definition of "covers"', () => {
        // widgets.color = 'color' on a Color attribute is agreement, not an override.
        expect(viewRendererOverride(COLOR_SLOT, 'color')).toBeNull();
    });
});

describe('viewRendererOverride — the case 7c draws', () => {
    const p = viewRendererOverride(COLOR_SLOT, 'text');

    it('reports the widget, the renderer it asks for, and what it covers', () => {
        expect(p).not.toBeNull();
        expect(p!.widget).toBe('text');
        expect(p!.viewRenderer).toBe('truncatedText');
        expect(p!.metamodel.kind).toBe('swatch');
        expect(p!.metamodel.reason).toBe('declared Color type');
    });

    it('reports an annotation-declared renderer the same way', () => {
        const q = viewRendererOverride({ ...PLAIN_SLOT, rendererOverride: 'code' }, 'color');
        expect(q!.metamodel.kind).toBe('code');
        expect(q!.metamodel.fromDeclaration).toBe(true);
    });
});

describe('the Form tab row shows the same verdict the ladder does', () => {
    it('builds the row provenance from the same comparison', () => {
        const withOverride = provenanceForRow(row(), { widgets: { color: 'text' } });
        expect(withOverride!.metamodel.kind).toBe('swatch');
        expect(provenanceEvidence(withOverride!)).toBe('declared Color type');

        // No override on the ir: no provenance line, and the inspector chip stays `auto`.
        expect(provenanceForRow(row(), undefined)).toBeNull();
        expect(provenanceForRow(row(), { widgets: { color: 'color' } })).toBeNull();
    });

    it('quotes the real wire format for an annotation, not the design\'s shorthand', () => {
        const p = provenanceForRow(
            row({ name: 'description', typeName: 'EString' }),
            { widgets: { description: 'color' } },
            { renderer: 'code' },
        );
        expect(provenanceEvidence(p!)).toBe('jjodel/renderer=code');
    });

    it('reads the metamodel side without any instance value', () => {
        const shape = slotShapeForRow(row({ name: 'tags', upperBound: -1 }));
        expect(shape.value).toBe('');
        expect(shape.isMany).toBe(true);
        expect(shape.featureName).toBe('tags');
    });
});

describe('withoutViewWidget — the Reset, and it prunes like the Form tab', () => {
    it('removes the entry, then the map, then the form', () => {
        const ir = { kind: 'vertex', form: { widgets: { color: 'text' } } };
        const next = withoutViewWidget(ir as any, 'color');
        expect(next).toEqual({ kind: 'vertex' });
        expect('form' in next).toBe(false);
    });

    it('keeps the form when something else is still in it', () => {
        const ir = { kind: 'vertex', form: { theme: 'card', widgets: { color: 'text' } } };
        expect(withoutViewWidget(ir as any, 'color')).toEqual({ kind: 'vertex', form: { theme: 'card' } });
    });

    it('keeps the sibling entries', () => {
        const ir = { kind: 'vertex', form: { widgets: { color: 'text', width: 'text' } } };
        expect(withoutViewWidget(ir as any, 'color'))
            .toEqual({ kind: 'vertex', form: { widgets: { width: 'text' } } });
    });

    it('returns the SAME reference when there is nothing to remove', () => {
        const ir = { kind: 'vertex', form: { theme: 'card' } } as any;
        expect(withoutViewWidget(ir, 'color')).toBe(ir);
        const bare = { kind: 'vertex' } as any;
        expect(withoutViewWidget(bare, 'color')).toBe(bare);
    });

    it('agrees with the Form tab\'s own pruning, which is the point of restating it', () => {
        // The canvas must perform EXACTLY the write the Form tab performs, or the two
        // surfaces would leave different irs behind for one user action.
        const cases = [
            { widgets: { color: 'text' } },
            { theme: 'card' as const, widgets: { color: 'text' } },
            { widgets: { color: 'text', width: 'text' } },
        ];
        for (const form of cases) {
            const viaPanel = withFormEntry(form as any, 'widgets', 'color', undefined);
            const viaCanvas = withoutViewWidget({ form } as any, 'color').form;
            expect(viaCanvas).toEqual(viaPanel);
        }
    });

    it('never mutates the ir it was handed', () => {
        const ir = { kind: 'vertex', form: { widgets: { color: 'text', width: 'text' } } };
        const snapshot = JSON.stringify(ir);
        withoutViewWidget(ir as any, 'color');
        expect(JSON.stringify(ir)).toBe(snapshot);
    });
});
