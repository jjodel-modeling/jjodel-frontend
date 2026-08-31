/**
 * Tests of `jjform/layout` — the width registry and the packer (FL1).
 *
 * Two things are under test and they are kept apart on purpose, because they fail
 * for different reasons: the REGISTRY (one type in, one span and one widget out,
 * every row of the spec's table) and the PACKER (a sequence of spans in, rows
 * out). The packer is exercised through spans it is handed, never through types
 * it has to classify first — a packing test that went through the registry would
 * go red when a width changed, and say the wrong thing about why.
 *
 * The fixture is the State Machine of `form-autolayout-spec.md`: a `State` with
 * name/kind/isHistory/timeout/depth/entryAction/tags and one `outgoing`
 * reference. It is the same model `outline.test.ts` and `create.test.ts` mock,
 * for the same reason — one fixture the whole engine is read against.
 */

import { describe, expect, it } from 'vitest';
import type { AttrShape, ClassShape, MetamodelShape, RefShape } from '../shape';
import {
    ENUM_SEGMENTED_MAX,
    GRID_COLUMNS,
    WIDTH_MAP,
    formLayout,
    layoutField,
    packRows,
    widthOf,
} from '../layout';
import type { LayoutAnnotations, LayoutField, WidthKind } from '../layout';

// ─── Fixture builders ────────────────────────────────────────────────────────

const attr = (o: Partial<AttrShape> & { key: string; typeName: string }): AttrShape => ({
    id: 'a_' + o.key,
    lower: 0, upper: 1, many: false, required: false,
    derived: false, readOnly: false,
    type: 'unknown',
    ...o,
});

const ref = (o: Partial<RefShape> & { key: string; of: string }): RefShape => ({
    id: 'r_' + o.key,
    lower: 0, upper: 1, many: false, required: false,
    derived: false, readOnly: false,
    ofId: 'c_' + o.of, composition: false,
    ...o,
});

const cls = (o: Partial<ClassShape> & { key: string }): ClassShape => ({
    id: 'c_' + o.key,
    root: false, abstract: false, singleton: false, containedIn: [],
    attrs: [], refs: [], children: [],
    ...o,
});

const enumeration = (name: string, ...literals: string[]) => ({
    id: 'e_' + name,
    name,
    literals: literals.map(l => ({ id: `l_${name}_${l}`, name: l })),
});

const SHAPE: MetamodelShape = {
    enums: {
        StateKind: enumeration('StateKind', 'Initial', 'Normal', 'Final'),
        Priority: enumeration('Priority', 'Low', 'Normal', 'High', 'Critical'),
    },
    classes: {},
};

const kindOf = (f: AttrShape | RefShape, ann?: LayoutAnnotations): WidthKind =>
    widthOf(f, SHAPE, ann).kind;

// ─── The registry, row by row ────────────────────────────────────────────────

describe('the width registry', () => {
    it('gives every kind a span from the closed set of three', () => {
        for (const [kind, entry] of Object.entries(WIDTH_MAP)) {
            expect([3, 6, 12], `${kind} span`).toContain(entry.span);
        }
    });

    it('transcribes the spec table: boolean and short enum are quarter rows', () => {
        expect(WIDTH_MAP.boolean).toEqual({ span: 3, widget: 'toggle' });
        expect(WIDTH_MAP.enumShort).toEqual({ span: 3, widget: 'segmented' });
        expect(WIDTH_MAP.enumLong).toEqual({ span: 6, widget: 'select' });
    });

    it('transcribes the spec table: the compact scalars', () => {
        expect(WIDTH_MAP.number).toEqual({ span: 3, widget: 'number' });
        expect(WIDTH_MAP.date).toEqual({ span: 3, widget: 'date' });
        expect(WIDTH_MAP.datetime).toEqual({ span: 3, widget: 'datetime' });
        expect(WIDTH_MAP.duration).toEqual({ span: 3, widget: 'duration' });
        expect(WIDTH_MAP.color).toEqual({ span: 3, widget: 'color' });
    });

    it('transcribes the spec table: the half rows', () => {
        expect(WIDTH_MAP.string).toEqual({ span: 6, widget: 'text' });
        expect(WIDTH_MAP.code).toEqual({ span: 6, widget: 'code' });
        expect(WIDTH_MAP.email).toEqual({ span: 6, widget: 'email' });
        expect(WIDTH_MAP.url).toEqual({ span: 6, widget: 'url' });
        expect(WIDTH_MAP.reference).toEqual({ span: 6, widget: 'picker' });
        expect(WIDTH_MAP.collection).toEqual({ span: 6, widget: 'chips' });
    });

    it('transcribes the spec table: the whole rows and the honest bottom', () => {
        expect(WIDTH_MAP.text).toEqual({ span: 12, widget: 'textarea' });
        expect(WIDTH_MAP.richtext).toEqual({ span: 12, widget: 'richtext' });
        // `unknown` is a half row of text, not a failure and not a whole row.
        expect(WIDTH_MAP.unknown).toEqual({ span: 6, widget: 'text' });
    });
});

// ─── Rung 1: the metamodel type ──────────────────────────────────────────────

describe('rung 1 — the classified type', () => {
    it('reads the classification `shapeDraw` already made, it does not redo it', () => {
        expect(kindOf(attr({ key: 'isHistory', typeName: 'EBoolean', type: 'boolean' }))).toBe('boolean');
        expect(kindOf(attr({ key: 'timeout', typeName: 'EInt', type: 'number' }))).toBe('number');
        expect(kindOf(attr({ key: 'created', typeName: 'EDate', type: 'date' }))).toBe('date');
        expect(kindOf(attr({ key: 'name', typeName: 'EString', type: 'string' }))).toBe('string');
    });

    it('splits the enum row on the literal count, at 3', () => {
        const short = attr({ key: 'kind', typeName: 'StateKind', type: 'enum', enum: 'StateKind' });
        const long = attr({ key: 'prio', typeName: 'Priority', type: 'enum', enum: 'Priority' });
        expect(SHAPE.enums.StateKind.literals).toHaveLength(ENUM_SEGMENTED_MAX);
        expect(SHAPE.enums.Priority.literals).toHaveLength(ENUM_SEGMENTED_MAX + 1);
        expect(widthOf(short, SHAPE)).toMatchObject({ kind: 'enumShort', span: 3, widget: 'segmented' });
        expect(widthOf(long, SHAPE)).toMatchObject({ kind: 'enumLong', span: 6, widget: 'select' });
    });

    it('sends an enum with unreachable literals to the select, never to the segmented control', () => {
        // A segmented control draws one button per literal and cannot draw an
        // unknown number of them.
        const orphan = attr({ key: 'k', typeName: 'Gone', type: 'enum', enum: 'Gone' });
        expect(widthOf(orphan, SHAPE)).toMatchObject({ kind: 'enumLong', span: 6 });
    });

    it('makes any multivalued feature a chip input — attribute or reference', () => {
        expect(kindOf(attr({ key: 'tags', typeName: 'EString', type: 'string', many: true, upper: -1 }))).toBe('collection');
        expect(kindOf(ref({ key: 'outgoing', of: 'Transition', many: true, upper: -1 }))).toBe('collection');
        // Cardinality beats the type: a multivalued text is chips, not a textarea.
        expect(kindOf(attr({ key: 'notes', typeName: 'Text', many: true, upper: -1 }))).toBe('collection');
    });

    it('makes a single-valued reference a picker', () => {
        expect(widthOf(ref({ key: 'parent', of: 'Machine' }), SHAPE))
            .toMatchObject({ kind: 'reference', span: 6, widget: 'picker' });
    });

    it('falls to `unknown` on a type nothing recognises — not to `string`', () => {
        const v = widthOf(attr({ key: 'celsius', typeName: 'Celsius' }), SHAPE);
        expect(v).toMatchObject({ kind: 'unknown', span: 6, widget: 'text', rung: 'bottom' });
    });
});

// ─── Rung 2: the annotation ──────────────────────────────────────────────────

describe('rung 2 — the annotation', () => {
    const ann: LayoutAnnotations = {
        entryAction: { renderer: 'code' },
        tint: { renderer: 'swatch' },
        junk: { renderer: 'not-a-renderer' },
    };

    it('promotes a string to code, which is the correction the spec asks for', () => {
        const f = attr({ key: 'entryAction', typeName: 'EString', type: 'string' });
        expect(widthOf(f, SHAPE, ann)).toMatchObject({ kind: 'code', span: 6, widget: 'code', rung: 'annotation' });
        // Without the annotation the same attribute is a plain string.
        expect(kindOf(f)).toBe('string');
    });

    it('promotes an unknown type to a colour swatch', () => {
        expect(widthOf(attr({ key: 'tint', typeName: 'Paint' }), SHAPE, ann))
            .toMatchObject({ kind: 'color', span: 3, rung: 'annotation' });
    });

    it('falls THROUGH an unrecognised declaration instead of blanking the field', () => {
        const v = widthOf(attr({ key: 'junk', typeName: 'EString', type: 'string' }), SHAPE, ann);
        expect(v).toMatchObject({ kind: 'string', rung: 'type' });
    });
});

// ─── Rung 3: the type name, parsed ───────────────────────────────────────────

describe('rung 3 — the type name parsed syntactically', () => {
    const bySyntax = (typeName: string): WidthKind => kindOf(attr({ key: 'f', typeName }));

    it('names the vocabulary `classifyAttrType` has no opinion about', () => {
        expect(bySyntax('DateTime')).toBe('datetime');
        expect(bySyntax('Duration')).toBe('duration');
        expect(bySyntax('Color')).toBe('color');
        expect(bySyntax('Expression')).toBe('code');
        expect(bySyntax('Email')).toBe('email');
        expect(bySyntax('URL')).toBe('url');
        expect(bySyntax('Text')).toBe('text');
        expect(bySyntax('RichText')).toBe('richtext');
    });

    it('matches the whole name, case-insensitively, never a substring', () => {
        expect(bySyntax('eurl')).toBe('url');
        expect(bySyntax('  Color  ')).toBe('color');
        expect(bySyntax('Colorimeter')).toBe('unknown');
        expect(bySyntax('TextualNote')).toBe('unknown');
    });

    it('never consults the field NAME — the acceptance criterion of the ladder', () => {
        // Every one of these names would trip a name-based heuristic.
        for (const key of ['color', 'email', 'url', 'description', 'code', 'duration']) {
            expect(kindOf(attr({ key, typeName: 'Celsius' })), key).toBe('unknown');
        }
    });

    it('does not let a name override a decisive metamodel type', () => {
        // `EInt` is a number whatever the attribute is called and whatever
        // `Duration` would have meant as a type name.
        expect(kindOf(attr({ key: 'duration', typeName: 'EInt', type: 'number' }))).toBe('number');
    });
});

// ─── The packer ──────────────────────────────────────────────────────────────

const field = (key: string, span: 3 | 6 | 12, many = false, readOnly = false): LayoutField => ({
    key, id: 'f_' + key,
    kind: many ? 'collection' : 'string',
    widget: many ? 'chips' : 'text',
    span, baseSpan: span, stretched: false,
    growsOnOverflow: many,
    many, required: false, readOnly,
    rung: 'type', reason: 'fixture',
});

const shapeOf = (rows: ReturnType<typeof packRows>) =>
    rows.map(r => ({ spans: r.fields.map(f => f.span), free: r.free }));

describe('packing — greedy fill in declaration order', () => {
    it('fills a row to 12 and starts a new one', () => {
        const rows = packRows([field('a', 6), field('b', 3), field('c', 3), field('d', 6), field('e', 6)]);
        expect(shapeOf(rows)).toEqual([
            { spans: [6, 3, 3], free: 0 },
            { spans: [6, 6], free: 0 },
        ]);
    });

    it('breaks before a field that does not fit rather than splitting it', () => {
        const rows = packRows([field('a', 6), field('b', 3), field('c', 6)]);
        // `c` needs 6 and only 3 are left, so the row closes at 9 — and `b`, the
        // last scalar of a short row, stretches into the gap.
        expect(shapeOf(rows)).toEqual([
            { spans: [6, 6], free: 0 },
            { spans: [12], free: 0 },
        ]);
    });

    it('never reorders — permuting the declaration permutes the layout', () => {
        const keysOf = (rows: ReturnType<typeof packRows>) => rows.map(r => r.fields.map(f => f.key));
        const a = packRows([field('big', 12), field('x', 3), field('y', 3)]);
        const b = packRows([field('x', 3), field('y', 3), field('big', 12)]);
        expect(keysOf(a)).toEqual([['big'], ['x', 'y']]);
        expect(keysOf(b)).toEqual([['x', 'y'], ['big']]);
    });

    it('honours the grid constant it is written against', () => {
        expect(GRID_COLUMNS).toBe(12);
    });
});

describe('packing — the stretch', () => {
    it('extends the last SCALAR of a short row to fill it', () => {
        const rows = packRows([field('only', 6)]);
        expect(rows[0].fields[0]).toMatchObject({ span: 12, baseSpan: 6, stretched: true });
        expect(rows[0].free).toBe(0);
    });

    it('stretches the last field, not the widest one', () => {
        const rows = packRows([field('a', 6), field('b', 3)]);
        expect(rows[0].fields.map(f => f.span)).toEqual([6, 6]);
        expect(rows[0].fields[0].stretched).toBe(false);
        expect(rows[0].fields[1].stretched).toBe(true);
    });

    it('leaves a full row alone', () => {
        const rows = packRows([field('a', 6), field('b', 6)]);
        expect(rows[0].fields.every(f => !f.stretched)).toBe(true);
    });

    it('does NOT stretch a multi — it keeps the hole and the overflow flag', () => {
        const rows = packRows([field('tags', 6, true)]);
        expect(rows[0].free).toBe(6);
        expect(rows[0].fields[0]).toMatchObject({ span: 6, stretched: false, growsOnOverflow: true });
    });

    it('stretches a scalar that follows a multi on the same row', () => {
        const rows = packRows([field('tags', 6, true), field('note', 3)]);
        expect(rows[0].fields.map(f => f.span)).toEqual([6, 6]);
        expect(rows[0].free).toBe(0);
    });

    it('gives the whole row back to a lone scalar, so a 3 can become a 12', () => {
        const rows = packRows([field('flag', 3)]);
        expect(rows[0].fields[0]).toMatchObject({ span: 12, baseSpan: 3, stretched: true });
    });

    // ── Amendment A1 (spec, 31-08-2026): read-only never stretches ────────────

    it('does NOT stretch a read-only field — it keeps the hole (A1)', () => {
        const rows = packRows([field('depth', 3, false, true)]);
        expect(rows[0].fields[0]).toMatchObject({ span: 3, baseSpan: 3, stretched: false });
        expect(rows[0].free).toBe(9);
    });

    it('leaves the hole when a read-only field ENDS a short row (A1)', () => {
        const rows = packRows([field('name', 6), field('depth', 3, false, true)]);
        expect(rows[0].fields.map(f => f.span)).toEqual([6, 3]);
        expect(rows[0].free).toBe(3);
    });

    it('still stretches a writable scalar that FOLLOWS a read-only one (A1)', () => {
        // The rule is about the LAST field of the row, not about the row containing
        // one: a writable field closing the row takes the free columns as before.
        const rows = packRows([field('depth', 3, false, true), field('note', 3)]);
        expect(rows[0].fields.map(f => f.span)).toEqual([3, 9]);
        expect(rows[0].free).toBe(0);
    });
});

// ─── The whole form ──────────────────────────────────────────────────────────

const STATE = cls({
    key: 'State',
    attrs: [
        attr({ key: 'name', typeName: 'EString', type: 'string' }),
        attr({ key: 'kind', typeName: 'StateKind', type: 'enum', enum: 'StateKind' }),
        attr({ key: 'isHistory', typeName: 'EBoolean', type: 'boolean' }),
        attr({ key: 'timeout', typeName: 'EInt', type: 'number' }),
        attr({ key: 'depth', typeName: 'EInt', type: 'number', derived: true, readOnly: true }),
        attr({ key: 'entryAction', typeName: 'EString', type: 'string' }),
        attr({ key: 'tags', typeName: 'EString', type: 'string', many: true, upper: -1 }),
    ],
    refs: [ref({ key: 'outgoing', of: 'Transition', many: true, upper: -1 })],
    children: [ref({ key: 'nested', of: 'State', many: true, upper: -1, composition: true })],
});

const ANN: LayoutAnnotations = { entryAction: { renderer: 'code' } };

describe('formLayout — the State fixture of the spec', () => {
    const layout = formLayout(STATE, SHAPE, ANN);
    const rowsOf = (key: string) =>
        layout.sections.find(s => s.key === key)!.rows.map(r => ({
            keys: r.fields.map(f => f.key),
            spans: r.fields.map(f => f.span),
            free: r.free,
        }));

    it('packs the attributes in declaration order', () => {
        expect(rowsOf('attributes')).toEqual([
            { keys: ['name', 'kind', 'isHistory'], spans: [6, 3, 3], free: 0 },
            { keys: ['timeout', 'depth', 'entryAction'], spans: [3, 3, 6], free: 0 },
            // `tags` is a multi: it keeps its half row and its hole.
            { keys: ['tags'], spans: [6], free: 6 },
        ]);
    });

    it('restarts the packing at the references section — rule 3', () => {
        // `tags` (an attribute) and `outgoing` (a reference) both end a short row
        // and could have shared one. They do not, because the section boundary is
        // a break: the metamodel decides the sections, not the free space.
        expect(rowsOf('references')).toEqual([{ keys: ['outgoing'], spans: [6], free: 6 }]);
    });

    it('leaves containment children out of the grid — they are sub-forms', () => {
        const keys = layout.sections.flatMap(s => s.rows.flatMap(r => r.fields.map(f => f.key)));
        expect(keys).not.toContain('nested');
    });

    it('carries readOnly and required through untouched', () => {
        const depth = layout.sections[0].rows[1].fields.find(f => f.key === 'depth')!;
        expect(depth).toMatchObject({ readOnly: true, span: 3, widget: 'number' });
    });

    it('reports the widget of every field, and the rung that chose it', () => {
        const all = layout.sections.flatMap(s => s.rows.flatMap(r => r.fields));
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
        expect(all.find(f => f.key === 'entryAction')!.rung).toBe('annotation');
    });

    it('drops an empty section rather than heading nothing', () => {
        const bare = formLayout(cls({ key: 'Marker' }), SHAPE);
        expect(bare.sections).toEqual([]);
    });

    it('never emits a per-field width — the layout is a consequence, not a setting', () => {
        // The acceptance criterion of the principle: permuting the declaration is
        // the ONLY way to change the geometry from outside.
        const permuted = formLayout({ ...STATE, attrs: [...STATE.attrs].reverse() }, SHAPE, ANN);
        const first = permuted.sections[0].rows[0].fields.map(f => f.key);
        expect(first).toEqual(['tags', 'entryAction']);
    });
});

describe('layoutField — one feature on its own', () => {
    it('returns an unstretched field FL4 can re-measure without a re-layout', () => {
        const f = layoutField(STATE.attrs[0], SHAPE, ANN);
        expect(f).toMatchObject({ key: 'name', span: 6, baseSpan: 6, stretched: false, growsOnOverflow: false });
    });

    it('flags only the collections as growing on overflow', () => {
        expect(layoutField(STATE.attrs[6], SHAPE).growsOnOverflow).toBe(true);
        expect(layoutField(STATE.refs[0], SHAPE).growsOnOverflow).toBe(true);
        expect(layoutField(STATE.attrs[3], SHAPE).growsOnOverflow).toBe(false);
    });
});
