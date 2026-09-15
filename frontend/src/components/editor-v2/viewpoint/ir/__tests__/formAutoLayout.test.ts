/**
 * Tests of `formAutoLayout` — the seam where FL1, FL2 and FL3 meet the renderer (FL4).
 *
 * The fixture is the State Machine of `form-autolayout-spec.md`, the same one
 * `jjform/__tests__/layout.test.ts` packs from the metamodel side. Here it arrives as the
 * two things a RENDERER actually holds — a `FormFieldDescriptor` from the edit form and a
 * `DraftField` from the create draft — which is the whole point of the file: the geometry
 * must come out the same from either end, or there are two forms.
 *
 * What is deliberately NOT asserted: pixels. The prompt asks for spans and order, and a
 * pixel assertion in a node environment would be a measurement of jsdom rather than of the
 * layout (CLAUDE.md §5: a computed style is a measure of the rendering only when the element
 * you measured is the one that paints).
 */

import { describe, expect, it } from 'vitest';
import type { DraftField } from '../../../../../jjform';
import { FORM_THEME_DEFAULT, FORM_THEME_NAMES, FORM_THEME_PRESETS, GRID_COLUMNS } from '../../../../../jjform';
import type { FormFieldDescriptor } from '../useFormWidgets';
import {
    LEGACY_SKIN_PRESET,
    OVERFLOW_DEMOTE_RATIO,
    autoLayoutRows,
    boundsOfMultiplicity,
    chromeOf,
    extendedWidgetFor,
    featureOf,
    inputFromDescriptor,
    inputFromDraftField,
    isFormThemeName,
    overflowVerdict,
    resolveFormTheme,
    spanWithOverflow,
    syntheticShape,
    themeVars,
} from '../formAutoLayout';

// ─── The State fixture, as the EDIT form describes it ────────────────────────

const desc = (o: Partial<FormFieldDescriptor> & { name: string; typeName: string }): FormFieldDescriptor => ({
    slotId: 'slot_' + o.name,
    widget: 'text',
    derivedWidget: 'text',
    lowerBound: 0,
    upperBound: 1,
    isMultivalued: false,
    isRequired: false,
    isEnum: false,
    isReference: false,
    isComposition: false,
    isReadOnly: false,
    isDerived: false,
    treatment: 'inline',
    options: [],
    values: [],
    filled: [],
    step: 1,
    featureId: 'feature_' + o.name,
    annotations: {},
    ...o,
});

const literals = (...names: string[]) => [{ label: '', options: names.map(n => ({ value: n, label: n })) }];

/** attrs then refs, the order `tableFeatures` fixes and `buildFormSections` reproduces. */
const STATE_ATTRS: FormFieldDescriptor[] = [
    desc({ name: 'name', typeName: 'EString' }),
    desc({ name: 'kind', typeName: 'StateKind', isEnum: true, widget: 'select', derivedWidget: 'select', options: literals('Initial', 'Normal', 'Final') }),
    desc({ name: 'isHistory', typeName: 'EBoolean', widget: 'checkbox', derivedWidget: 'checkbox' }),
    desc({ name: 'timeout', typeName: 'EInt', widget: 'number', derivedWidget: 'number' }),
    desc({ name: 'depth', typeName: 'EInt', widget: 'number', derivedWidget: 'number', isDerived: true, isReadOnly: true }),
    desc({ name: 'entryAction', typeName: 'EString' }),
    desc({ name: 'tags', typeName: 'EString', upperBound: -1, isMultivalued: true, treatment: 'list' }),
];

const STATE_REFS: FormFieldDescriptor[] = [
    desc({ name: 'outgoing', typeName: 'Transition', isReference: true, widget: 'reference', derivedWidget: 'reference', upperBound: -1, isMultivalued: true, treatment: 'list' }),
];

const ANN = { entryAction: { renderer: 'code' } };

const shapeOf = (rows: ReturnType<typeof autoLayoutRows>) =>
    rows.map(r => ({ keys: r.fields.map(f => f.key), spans: r.fields.map(f => f.span), free: r.free }));

const rowsOfAttrs = () => autoLayoutRows(STATE_ATTRS.map(inputFromDescriptor), ANN);

// ─── The rows the RULES produce ──────────────────────────────────────────────

describe('the State fixture, laid out from the edit form descriptors', () => {
    it('produces the rows of the packing rules, not the rows of the board', () => {
        // Identical to `layout.test.ts`'s own assertion on the same class, reached from
        // descriptors instead of from shapes. That the two agree is the acceptance
        // criterion of the projection.
        expect(shapeOf(rowsOfAttrs())).toEqual([
            { keys: ['name', 'kind', 'isHistory'], spans: [6, 3, 3], free: 0 },
            { keys: ['timeout', 'depth', 'entryAction'], spans: [3, 3, 6], free: 0 },
            { keys: ['tags'], spans: [6], free: 6 },
        ]);
    });

    it('restarts the packing at the references section — rule 3', () => {
        expect(shapeOf(autoLayoutRows(STATE_REFS.map(inputFromDescriptor)))).toEqual([
            { keys: ['outgoing'], spans: [6], free: 6 },
        ]);
    });

    it('gives every field a widget name from the width map', () => {
        const all = [...rowsOfAttrs(), ...autoLayoutRows(STATE_REFS.map(inputFromDescriptor))]
            .flatMap(r => r.fields);
        expect(all.map(f => [f.key, f.widget])).toEqual([
            ['name', 'text'],
            ['kind', 'segmented'],
            ['isHistory', 'toggle'],
            ['timeout', 'number'],
            ['depth', 'number'],
            ['entryAction', 'code'],
            ['tags', 'chips'],
            ['outgoing', 'chips'],
        ]);
    });

    it('reaches the annotation rung when the host threads the declaration in', () => {
        // `entryAction` is an EString: rung 1 says `string`, and `code` is reachable only
        // because the host threaded `jjodel/renderer=code` in. Both calls are made here so
        // the difference is the ANNOTATION and not the fixture.
        const field = inputFromDescriptor(desc({ name: 'entryAction', typeName: 'EString' }));
        expect(autoLayoutRows([field])[0].fields[0]).toMatchObject({ kind: 'string', widget: 'text', rung: 'type' });
        expect(autoLayoutRows([field], ANN)[0].fields[0]).toMatchObject({ kind: 'code', widget: 'code', rung: 'annotation' });
    });

    it('never lets a row exceed the grid', () => {
        for (const r of rowsOfAttrs()) {
            const used = r.fields.reduce((n, f) => n + f.span, 0);
            expect(used + r.free).toBe(GRID_COLUMNS);
        }
    });
});

// ─── The same rows from the CREATE draft ─────────────────────────────────────

const draft = (o: Partial<DraftField> & { key: string; typeName: string; kind: DraftField['kind'] }): DraftField => ({
    multiplicity: '0..1',
    required: false,
    value: '',
    options: [],
    error: null,
    ...o,
});

describe('the create draft and the edit form lay out the same way', () => {
    it('agrees field for field on the scalars the draft can hold', () => {
        // `depth` is derived and `draftableAttrs` drops it, so the draft's list is the
        // editable prefix — which is exactly why the comparison is made on that prefix and
        // not on the whole class: a draft with a derived field would be the bug.
        const editable = STATE_ATTRS.filter(f => !f.isReadOnly);
        const fromForm = autoLayoutRows(editable.map(inputFromDescriptor));
        const fromDraft = autoLayoutRows([
            draft({ key: 'name', typeName: 'EString', kind: 'text' }),
            draft({ key: 'kind', typeName: 'StateKind', kind: 'enum', options: [{ id: 'i', label: 'Initial' }, { id: 'n', label: 'Normal' }, { id: 'f', label: 'Final' }] }),
            draft({ key: 'isHistory', typeName: 'EBoolean', kind: 'boolean' }),
            draft({ key: 'timeout', typeName: 'EInt', kind: 'number' }),
            draft({ key: 'entryAction', typeName: 'EString', kind: 'text' }),
            draft({ key: 'tags', typeName: 'EString', kind: 'text', multiplicity: '0..*' }),
        ].map(inputFromDraftField));
        expect(shapeOf(fromDraft)).toEqual(shapeOf(fromForm));
    });

    it('reads the bounds out of the multiplicity label the draft carries', () => {
        expect(boundsOfMultiplicity('0..*')).toEqual({ lower: 0, upper: -1 });
        expect(boundsOfMultiplicity('1..1')).toEqual({ lower: 1, upper: 1 });
        expect(boundsOfMultiplicity('0..5')).toEqual({ lower: 0, upper: 5 });
        // Not a multiplicity at all: the honest default, never a crash.
        expect(boundsOfMultiplicity('')).toEqual({ lower: 0, upper: 1 });
    });

    it('makes a multivalued draft field a chip input, like the edit form', () => {
        const rows = autoLayoutRows([inputFromDraftField(draft({ key: 'tags', typeName: 'EString', kind: 'text', multiplicity: '0..*' }))]);
        expect(rows[0].fields[0]).toMatchObject({ widget: 'chips', span: 6, growsOnOverflow: true });
        expect(rows[0].free).toBe(6);
    });
});

// ─── The projection onto FL1's types ─────────────────────────────────────────

describe('the synthetic shape', () => {
    it('carries the enum literal COUNT, which is the only thing the width reads', () => {
        const shape = syntheticShape(STATE_ATTRS.map(inputFromDescriptor));
        expect(Object.keys(shape.classes)).toEqual([]);
        expect(shape.enums.StateKind.literals).toHaveLength(3);
    });

    it('sends a long enum to the select and a short one to the segmented control', () => {
        const long = desc({ name: 'priority', typeName: 'Priority', isEnum: true, options: literals('Low', 'Normal', 'High', 'Critical') });
        const [row] = autoLayoutRows([inputFromDescriptor(long)]);
        expect(row.fields[0]).toMatchObject({ kind: 'enumLong', widget: 'select', baseSpan: 6 });
    });

    it('does not count REFERENCE candidates as enum literals', () => {
        // Two candidates would look like a two-literal enum and win the segmented control.
        const ref = desc({ name: 'target', typeName: 'State', isReference: true, options: literals('a', 'b') });
        expect(inputFromDescriptor(ref).enumLiteralCount).toBeUndefined();
        expect(autoLayoutRows([inputFromDescriptor(ref)])[0].fields[0].kind).toBe('reference');
    });

    it('keeps a composition a reference feature, with the flag', () => {
        const child = featureOf(inputFromDescriptor(desc({ name: 'nested', typeName: 'State', isComposition: true })));
        expect(child).toMatchObject({ of: 'State', composition: true });
    });
});

// ─── FL2: the four presets ───────────────────────────────────────────────────

describe('the theme, across the four presets', () => {
    it('leaves the geometry alone — the metamodel decides it, not the theme', () => {
        // The acceptance criterion of the whole design, and the reason the rows above are
        // asserted once: a theme that could move a field would be a layout option.
        const base = shapeOf(rowsOfAttrs());
        for (const name of Object.keys(FORM_THEME_PRESETS) as (keyof typeof FORM_THEME_PRESETS)[]) {
            expect(shapeOf(rowsOfAttrs()), name).toEqual(base);
            expect(Object.keys(themeVars(FORM_THEME_PRESETS[name]))).toContain('--ir-form-row-gap');
        }
    });

    it('emits the label column only for the left placement', () => {
        expect(themeVars(FORM_THEME_PRESETS.Comfortable)['--ir-form-label-col']).toBeUndefined();
        expect(themeVars(FORM_THEME_PRESETS.Compact)['--ir-form-label-col']).toBe('72px');
        expect(themeVars(FORM_THEME_PRESETS.Dense)['--ir-form-label-col']).toBe('72px');
    });

    it('spends a different density scale per preset', () => {
        const gap = (n: keyof typeof FORM_THEME_PRESETS) => themeVars(FORM_THEME_PRESETS[n])['--ir-form-row-gap'];
        expect(gap('Comfortable')).toBe('14px');
        expect(gap('Compact')).toBe('8px');
        expect(gap('Dense')).toBe('6px');
    });

    it('gives each preset the chrome its section style names', () => {
        expect(chromeOf(FORM_THEME_PRESETS.Sectioned)).toMatchObject({ card: true, eyebrow: true });
        expect(chromeOf(FORM_THEME_PRESETS.Compact)).toMatchObject({ divider: true, card: false });
        expect(chromeOf(FORM_THEME_PRESETS.Dense)).toMatchObject({ eyebrow: false, divider: false, card: false });
    });
});

// ─── A2: the legacy literals, mapped and not renamed ─────────────────────────

describe('the legacy skin, reconciled with the preset (A2)', () => {
    it('maps every persisted skin onto a preset', () => {
        expect(Object.keys(LEGACY_SKIN_PRESET).sort()).toEqual(['card', 'compact', 'inspector', 'plain']);
        for (const preset of Object.values(LEGACY_SKIN_PRESET)) {
            expect(FORM_THEME_PRESETS[preset]).toBeDefined();
        }
    });

    it('resolves the default skin to the default preset', () => {
        expect(resolveFormTheme('plain')).toEqual(FORM_THEME_PRESETS.Comfortable);
    });

    it('folds FormSpec.labelPlacement on top as a one-field layer', () => {
        // `above` is the same placement FL2 spells `top`; the rename lives in the adapter.
        expect(resolveFormTheme('plain', 'left')).toEqual({
            ...FORM_THEME_PRESETS.Comfortable, labelPlacement: 'left',
        });
        expect(resolveFormTheme('compact', 'above').labelPlacement).toBe('top');
        // Stating nothing leaves the preset's own placement in place.
        expect(resolveFormTheme('compact').labelPlacement).toBe('left');
    });

    it('lets a per-class layer change one field without inheriting the rest', () => {
        const t = resolveFormTheme('card', undefined, { density: 'dense' });
        expect(t).toEqual({ labelPlacement: 'top', density: 'dense', sectionStyle: 'card' });
    });
});

// ─── STYLE2: the viewpoint rung, and the three-step precedence ───────────────
//
// The ladder the slice exists to build: `ir.form.theme` (view) beats the viewpoint, the
// viewpoint beats the factory default. Each step gets its own case, because a ladder
// asserted only at its top would pass with the middle rung missing — which is exactly the
// state of the code before this slice, where the middle rung was a function parameter
// nobody could reach.

describe('the viewpoint rung of the form theme (STYLE2)', () => {
    it('the bottom step: nothing stated anywhere is the committed default', () => {
        // The non-regression, field by field and not by `toEqual` on a name: this is the
        // rendering every saved project has today, and a saved project has no `formTheme`.
        const t = resolveFormTheme(undefined, undefined, undefined, undefined);
        expect(t).toEqual(FORM_THEME_DEFAULT);
        expect(t).toEqual(FORM_THEME_PRESETS.Comfortable);
        // And it is the SAME answer the only call site produced before STYLE2, when it
        // passed `spec?.theme ?? 'plain'` and could never pass undefined.
        expect(t).toEqual(resolveFormTheme('plain'));
    });

    it('the middle step: the viewpoint wins over the default', () => {
        for (const name of FORM_THEME_NAMES) {
            expect(resolveFormTheme(undefined, undefined, undefined, name))
                .toEqual(FORM_THEME_PRESETS[name]);
        }
        // Dense in particular — the preset no write surface of the app could reach before
        // this slice (STYLE1 report §4), which is the whole reason the rung was built.
        expect(resolveFormTheme(undefined, undefined, undefined, 'Dense'))
            .toEqual({ labelPlacement: 'left', density: 'dense', sectionStyle: 'none' });
    });

    it('the top step: the view wins over the viewpoint', () => {
        // The viewpoint asks for Dense, the view declares the `plain` skin: the view wins,
        // whole preset against whole preset, and the answer is Comfortable.
        expect(resolveFormTheme('plain', undefined, undefined, 'Dense'))
            .toEqual(FORM_THEME_PRESETS.Comfortable);
        expect(resolveFormTheme('compact', undefined, undefined, 'Sectioned'))
            .toEqual(FORM_THEME_PRESETS.Compact);
    });

    it('a view that states only a placement keeps the rest of the viewpoint', () => {
        // The one-field layer is still a layer: it overrides `labelPlacement` and leaves
        // the viewpoint's density and chrome standing. Without a skin there is nothing
        // between the viewpoint and the placement.
        expect(resolveFormTheme(undefined, 'above', undefined, 'Dense'))
            .toEqual({ labelPlacement: 'top', density: 'dense', sectionStyle: 'none' });
    });

    it('the per-class rung still sits above all three', () => {
        expect(resolveFormTheme('plain', undefined, { density: 'compact' }, 'Dense'))
            .toEqual({ labelPlacement: 'top', density: 'compact', sectionStyle: 'flat' });
    });

    it('the four existing call shapes answer exactly as they did', () => {
        // Every assertion of the A2 block above, restated with the new fourth argument
        // ABSENT. A signature change that altered any of these would be a regression of
        // the committed rendering, not a new rung.
        expect(resolveFormTheme('plain')).toEqual(FORM_THEME_PRESETS.Comfortable);
        expect(resolveFormTheme('plain', 'left'))
            .toEqual({ ...FORM_THEME_PRESETS.Comfortable, labelPlacement: 'left' });
        expect(resolveFormTheme('compact', 'above').labelPlacement).toBe('top');
        expect(resolveFormTheme('compact').labelPlacement).toBe('left');
        expect(resolveFormTheme('card', undefined, { density: 'dense' }))
            .toEqual({ labelPlacement: 'top', density: 'dense', sectionStyle: 'card' });
    });

    it('a stored value that is not a preset name resolves as no opinion', () => {
        // The D field comes back from a project file, so it is untrusted at the boundary.
        // A retired or hand-edited name must land on the step BELOW, not on an undefined
        // lookup that reaches the default by accident.
        for (const junk of ['dense', 'COMFORTABLE', 'Cosy', '', 'plain'] as any[]) {
            expect(isFormThemeName(junk)).toBe(false);
            expect(resolveFormTheme(undefined, undefined, undefined, junk))
                .toEqual(FORM_THEME_DEFAULT);
        }
        // Positive control: the guard has signal — the four real names pass.
        for (const name of FORM_THEME_NAMES) expect(isFormThemeName(name)).toBe(true);
        // And a junk viewpoint does not swallow a view that DID state something.
        expect(resolveFormTheme('compact', undefined, undefined, 'Cosy' as any))
            .toEqual(FORM_THEME_PRESETS.Compact);
    });

    it('the select can name every preset the rung accepts', () => {
        // The vocabulary of the viewpoint panel's select is `FORM_THEME_NAMES` itself,
        // read at render time and not a second list of four names.
        // If a fifth preset is ever added, this fails unless the rung accepts it too.
        for (const name of FORM_THEME_NAMES) {
            expect(isFormThemeName(name)).toBe(true);
            expect(FORM_THEME_PRESETS[name]).toBeDefined();
        }
        expect(FORM_THEME_NAMES).toHaveLength(4);
    });
});

// ─── FL3: which widget the cell renders ──────────────────────────────────────

const dispatchOf = (d: FormFieldDescriptor, autoWidget: Parameters<typeof extendedWidgetFor>[0]) =>
    extendedWidgetFor(autoWidget, d);

describe('the extended widget dispatch', () => {
    it('routes the registry names to the registry', () => {
        const d = desc({ name: 'created', typeName: 'EDate' });
        expect(dispatchOf(d, 'date')).toBe('date');
        expect(dispatchOf(d, 'duration')).toBe('duration');
        expect(dispatchOf(d, 'color')).toBe('color');
        expect(dispatchOf(d, 'email')).toBe('email');
        expect(dispatchOf(d, 'chips')).toBe('chips');
    });

    it('leaves the names the form already dispatches alone', () => {
        const d = desc({ name: 'timeout', typeName: 'EInt' });
        for (const w of ['toggle', 'segmented', 'select', 'number', 'text', 'code', 'picker'] as const) {
            expect(dispatchOf(d, w), w).toBeNull();
        }
    });

    it('keeps @url on the write side even though it has no read twin (FL3 §F5)', () => {
        expect(dispatchOf(desc({ name: 'homepage', typeName: 'EUrl' }), 'url')).toBe('url');
    });

    it('does not confuse the prose textarea with the JjEL editor', () => {
        // The width map's `textarea` on a field the author did not override: the prose box.
        expect(dispatchOf(desc({ name: 'notes', typeName: 'EText' }), 'textarea')).toBe('textarea');
        // `WidgetKind.textarea` as an OVERRIDE over an EString: the JjEL expression editor,
        // which stays with the legacy dispatch. Same word, opposite widget.
        const overridden = desc({ name: 'guard', typeName: 'EString', widget: 'textarea', derivedWidget: 'text' });
        expect(dispatchOf(overridden, 'text')).toBeNull();
        expect(dispatchOf(overridden, 'textarea')).toBeNull();
    });

    it('offers NO control on a read-only or derived cell — deviation 3 of the shape', () => {
        const derived = desc({ name: 'depth', typeName: 'EInt', isDerived: true, isReadOnly: true });
        for (const w of ['date', 'duration', 'color', 'email', 'url', 'chips', 'textarea'] as const) {
            expect(dispatchOf(derived, w), w).toBeNull();
        }
    });

    it('leaves a containment list to the sub-form control', () => {
        const children = desc({ name: 'nested', typeName: 'State', isComposition: true, upperBound: -1, isMultivalued: true });
        expect(dispatchOf(children, 'chips')).toBeNull();
    });
});

// ─── The overflow promotion ──────────────────────────────────────────────────

describe('the overflow promotion and its hysteresis', () => {
    const HALF = 200;

    it('promotes when the chip run outgrows the half row', () => {
        expect(overflowVerdict(false, 201, HALF)).toBe(true);
        expect(overflowVerdict(false, 199, HALF)).toBe(false);
    });

    it('does NOT demote at the promotion boundary — the flip-flop this exists to stop', () => {
        // 7 tags overflow, the field goes to 12, the user deletes one and the run measures
        // just under the half row again. Without the band this alternates every keystroke.
        expect(overflowVerdict(true, 200, HALF)).toBe(true);
        expect(overflowVerdict(true, 180, HALF)).toBe(true);
    });

    it('demotes only once the run has fallen clear of the band', () => {
        expect(overflowVerdict(true, HALF * OVERFLOW_DEMOTE_RATIO - 1, HALF)).toBe(false);
    });

    it('is stable under repeated measurement — no oscillation at any width', () => {
        // The property, executed rather than argued (CLAUDE.md §5): whatever the width,
        // feeding the verdict back to itself twice must reach a fixed point.
        for (let w = 0; w <= 400; w += 7) {
            const once = overflowVerdict(false, w, HALF);
            expect(overflowVerdict(once, w, HALF), `w=${w}`).toBe(overflowVerdict(overflowVerdict(once, w, HALF), w, HALF));
        }
    });

    it('holds its verdict when the container has not been measured yet', () => {
        expect(overflowVerdict(true, 999, 0)).toBe(true);
        expect(overflowVerdict(false, 999, 0)).toBe(false);
    });

    it('promotes only the fields FL1 flagged, and only upwards', () => {
        const [row] = autoLayoutRows([inputFromDescriptor(STATE_ATTRS[6])]);   // tags
        expect(spanWithOverflow(row.fields[0], true)).toBe(12);
        expect(spanWithOverflow(row.fields[0], false)).toBe(6);
        const [scalar] = autoLayoutRows([inputFromDescriptor(STATE_ATTRS[0])]);  // name, stretched to 12
        expect(spanWithOverflow(scalar.fields[0], true)).toBe(scalar.fields[0].span);
    });
});
