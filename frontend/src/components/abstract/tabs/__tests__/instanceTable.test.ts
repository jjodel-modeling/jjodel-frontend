/**
 * Unit tests for the collection table (Slice 2b) and for the one half of the
 * shape adapter that is pure — `referencedBy`, the `pointedBy` walk.
 *
 * Everything imported here comes from `shapeDraw.ts`, the importless half of the
 * adapter, NOT from `shapeAdapter.ts`. That split exists because of this file: the
 * first version imported `referencedBy` from the adapter and died at import with
 * `window is not defined` — the adapter imports the joiner barrel, the barrel
 * reaches monaco, and monaco dereferences `window` at module scope. It is the same
 * failure the nine already-red suites in this repo die of, and the reason
 * `irReadCtx` is split from `irReadCtxLproxy`.
 *
 * `buildMetamodelShape` is therefore NOT tested here — it needs `getMetaclassInfo`,
 * which needs the store. It is exercised at screen instead, by
 * `scripts/smoke/_tmp_instance_manager.ts`, where the enum column is the proof
 * that the literals were resolved.
 *
 * The `pointedBy` fixture is not invented: the shape was MEASURED on the
 * RowViewSmoke fixture on 2026-08-30 (`_tmp_pointedby.ts`), which is where the
 * `idlookup.<dvalue>.values.<n>` form and the noise entries around it come from.
 */
import { describe, it, expect } from 'vitest';
import { attrShape, classifyAttrType, featureFlags, referencedBy } from '../../../editor-v2/hooks/shapeDraw';
import {
    filterRows,
    slotShapeFor,
    tableColumns,
    tableRow,
} from '../instanceTable';
import type { ClassShape, MetamodelShape } from '../../../../jjform';

// --- shape fixture ----------------------------------------------------------
// Sensor(name: EString, tint: Colour[enum], threshold: EInt, tags: EString[0..*],
//        cfg -> Config[1..1], computed: EString derived) + ports: Port[0..4] child

const shape: MetamodelShape = {
    enums: {
        Colour: {
            id: 'eColour', name: 'Colour',
            literals: [{ id: 'lRed', name: 'Red' }, { id: 'lGreen', name: 'Green' }],
        },
    },
    classes: {
        Sensor: {
            key: 'Sensor', id: 'cSensor', root: true, abstract: false, singleton: false,
            containedIn: [],
            attrs: [
                { key: 'name', id: 'aName', lower: 1, upper: 1, many: false, required: true, derived: false, readOnly: false, type: 'string', typeName: 'EString' },
                { key: 'tint', id: 'aTint', lower: 0, upper: 1, many: false, required: false, derived: false, readOnly: false, type: 'enum', enum: 'Colour', typeName: 'Colour' },
                { key: 'threshold', id: 'aThr', lower: 0, upper: 1, many: false, required: false, derived: false, readOnly: false, type: 'number', typeName: 'EInt' },
                { key: 'tags', id: 'aTags', lower: 0, upper: -1, many: true, required: false, derived: false, readOnly: false, type: 'string', typeName: 'EString' },
                { key: 'computed', id: 'aComp', lower: 0, upper: 1, many: false, required: false, derived: true, readOnly: true, type: 'string', typeName: 'EString' },
            ],
            refs: [
                { key: 'cfg', id: 'rCfg', lower: 1, upper: 1, many: false, required: true, derived: false, readOnly: false, of: 'Config', ofId: 'cConfig', composition: false },
            ],
            children: [
                { key: 'ports', id: 'rPorts', lower: 0, upper: 4, many: true, required: false, derived: false, readOnly: false, of: 'Port', ofId: 'cPort', composition: true },
            ],
        },
        Config: {
            key: 'Config', id: 'cConfig', root: true, abstract: false, singleton: false,
            containedIn: [], attrs: [], refs: [], children: [],
        },
    },
};
const Sensor = shape.classes.Sensor as ClassShape;

// --- instance fixture -------------------------------------------------------
// s1: complete. s2: cfg dangling, tags multivalued with a HOLE, no tint.

const idlookup: Record<string, any> = {
    cSensor: { id: 'cSensor', className: 'DClass', name: 'Sensor' },
    cConfig: { id: 'cConfig', className: 'DClass', name: 'Config' },
    aName: { id: 'aName', className: 'DAttribute', name: 'name' },
    aTint: { id: 'aTint', className: 'DAttribute', name: 'tint' },
    aThr: { id: 'aThr', className: 'DAttribute', name: 'threshold' },
    aTags: { id: 'aTags', className: 'DAttribute', name: 'tags' },
    aComp: { id: 'aComp', className: 'DAttribute', name: 'computed' },
    rCfg: { id: 'rCfg', className: 'DReference', name: 'cfg' },
    rPorts: { id: 'rPorts', className: 'DReference', name: 'ports', composition: true },
    lRed: { id: 'lRed', className: 'DEnumLiteral', name: 'Red' },
    lGreen: { id: 'lGreen', className: 'DEnumLiteral', name: 'Green' },

    cfg1: { id: 'cfg1', className: 'DObject', name: 'cfg1', instanceof: 'cConfig', father: 'm1', features: [], pointedBy: [] },

    s1: { id: 's1', className: 'DObject', name: 's1', instanceof: 'cSensor', father: 'm1',
          features: ['vName1', 'vTint1', 'vThr1', 'vTags1', 'vCfg1'] },
    vName1: { id: 'vName1', className: 'DValue', instanceof: 'aName', father: 's1', values: ['s1'] },
    vTint1: { id: 'vTint1', className: 'DValue', instanceof: 'aTint', father: 's1', values: ['lGreen'] },
    vThr1: { id: 'vThr1', className: 'DValue', instanceof: 'aThr', father: 's1', values: ['42'] },
    vTags1: { id: 'vTags1', className: 'DValue', instanceof: 'aTags', father: 's1', values: ['alpha', null, 'beta'] },
    vCfg1: { id: 'vCfg1', className: 'DValue', instanceof: 'rCfg', father: 's1', values: ['cfg1'] },

    s2: { id: 's2', className: 'DObject', name: 's2', instanceof: 'cSensor', father: 'm1',
          features: ['vName2', 'vCfg2'] },
    vName2: { id: 'vName2', className: 'DValue', instanceof: 'aName', father: 's2', values: ['s2'] },
    vCfg2: { id: 'vCfg2', className: 'DValue', instanceof: 'rCfg', father: 's2', values: ['gone'] },

    m1: { id: 'm1', className: 'DModel', name: 'plant' },
};

// cfg1 is pointed at by s1.cfg, and OWNED by m1 through a containment slot.
idlookup.cfg1.pointedBy = [
    { source: 'idlookup.vCfg1.values.0' },
    // noise the reducer really puts there — measured, not invented
    { source: 'idlookup.vName1.father' },
    { source: 'idlookup.cConfig.instances' },
    { source: 'objects' },
    { source: 'idlookup.m1.objects' },
];

// --- referencedBy: the pointedBy walk ---------------------------------------

describe('referencedBy (the pointedBy walk)', () => {
    it('keeps only the value pointers, and resolves each to instance + feature', () => {
        const refs = referencedBy(idlookup, 'cfg1');
        expect(refs).toHaveLength(1);
        expect(refs[0]).toMatchObject({
            instanceId: 's1', instanceName: 's1', instanceClass: 'Sensor',
            featureKey: 'cfg', featureId: 'rCfg', composition: false, index: 0,
        });
    });

    it('drops the noise entries the reducer also writes', () => {
        // positive control: the noise IS in the fixture, so an empty result would
        // mean the walk never ran rather than that it filtered correctly.
        expect(idlookup.cfg1.pointedBy.length).toBe(5);
        expect(referencedBy(idlookup, 'cfg1').length).toBeLessThan(5);
    });

    it('reports one entry per POINTER, not per instance', () => {
        const twice = {
            ...idlookup,
            cfg1: { ...idlookup.cfg1, pointedBy: [
                { source: 'idlookup.vCfg1.values.0' },
                { source: 'idlookup.vCfg1.values.2' },
            ] },
        };
        const refs = referencedBy(twice, 'cfg1');
        expect(refs).toHaveLength(2);
        expect(refs.map(r => r.index)).toEqual([0, 2]);
    });

    it('accepts a bare `.values` path as index 0', () => {
        const bare = { ...idlookup, cfg1: { ...idlookup.cfg1, pointedBy: [{ source: 'idlookup.vCfg1.values' }] } };
        expect(referencedBy(bare, 'cfg1')[0].index).toBe(0);
    });

    it('flags a containment pointer instead of hiding it', () => {
        const owned = {
            ...idlookup,
            vPorts: { id: 'vPorts', className: 'DValue', instanceof: 'rPorts', father: 's1', values: ['p1'] },
            p1: { id: 'p1', className: 'DObject', name: 'p1', instanceof: 'cSensor', father: 'vPorts',
                  pointedBy: [{ source: 'idlookup.vPorts.values.0' }] },
        };
        const refs = referencedBy(owned, 'p1');
        expect(refs).toHaveLength(1);
        expect(refs[0].composition).toBe(true);
    });

    it('drops an entry whose slot no longer resolves, rather than reporting a ghost', () => {
        const stale = { ...idlookup, cfg1: { ...idlookup.cfg1, pointedBy: [{ source: 'idlookup.vanished.values.0' }] } };
        expect(referencedBy(stale, 'cfg1')).toEqual([]);
    });

    it('returns [] for an unknown instance and for one never pointed at', () => {
        expect(referencedBy(idlookup, 'nope')).toEqual([]);
        expect(referencedBy(idlookup, 's1')).toEqual([]);
    });
});

// --- the shape pieces (holes (a) and (b) of the discovery §2.2) --------------

describe('classifyAttrType', () => {
    it('maps the primitive names of widgetForPrimitive, and enum wins over all', () => {
        expect(classifyAttrType('EString', false)).toBe('string');
        expect(classifyAttrType('EChar', false)).toBe('string');
        expect(classifyAttrType('EInt', false)).toBe('number');
        expect(classifyAttrType('EDouble', false)).toBe('number');
        expect(classifyAttrType('EBoolean', false)).toBe('boolean');
        expect(classifyAttrType('EDate', false)).toBe('date');
        expect(classifyAttrType('EString', true)).toBe('enum');
    });

    it('calls an unrecognised datatype unknown, not string', () => {
        expect(classifyAttrType('Celsius', false)).toBe('unknown');
        expect(classifyAttrType('', false)).toBe('unknown');
    });
});

describe('featureFlags', () => {
    const l = {
        plain: { id: 'plain' },
        derived: { id: 'derived', derived: true },
        locked: { id: 'locked', changeable: false },
    };
    it('reads derived and changeable off the D layer', () => {
        expect(featureFlags(l, 'plain')).toEqual({ derived: false, readOnly: false });
        expect(featureFlags(l, 'derived')).toEqual({ derived: true, readOnly: true });
        expect(featureFlags(l, 'locked')).toEqual({ derived: false, readOnly: true });
    });
    it('does not lock a feature it cannot resolve', () => {
        expect(featureFlags(l, 'absent')).toEqual({ derived: false, readOnly: false });
    });
});

describe('attrShape — the enum literals hole', () => {
    const l: Record<string, any> = {
        aTint: { id: 'aTint', className: 'DAttribute', name: 'tint', type: 'eColour' },
        eColour: { id: 'eColour', className: 'DEnumerator', name: 'Colour', literals: ['lRed', 'lGreen', 'ghost'] },
        lRed: { id: 'lRed', className: 'DEnumLiteral', name: 'Red' },
        lGreen: { id: 'lGreen', className: 'DEnumLiteral', name: 'Green' },
        aFake: { id: 'aFake', className: 'DAttribute', name: 'fake', type: 'nowhere' },
        aPlain: { id: 'aPlain', className: 'DAttribute', name: 'plain', type: 'pString', derived: true },
        pString: { id: 'pString', className: 'DClass', name: 'EString' },
    };
    const meta = (id: string, name: string, isEnum: boolean, typeName: string) =>
        ({ id, name, type: typeName, lowerBound: 0, upperBound: 1, isEnum });

    it('resolves the literals as id+name pairs, keyed by enum name', () => {
        const enums: Record<string, any> = {};
        const a = attrShape(l, meta('aTint', 'tint', true, 'Colour') as any, enums);
        expect(a.type).toBe('enum');
        expect(a.enum).toBe('Colour');
        expect(enums.Colour.literals).toEqual([{ id: 'lRed', name: 'Red' }, { id: 'lGreen', name: 'Green' }]);
    });

    it('drops a literal pointer that does not resolve', () => {
        const enums: Record<string, any> = {};
        attrShape(l, meta('aTint', 'tint', true, 'Colour') as any, enums);
        // positive control: the ghost IS in the fixture
        expect(l.eColour.literals).toContain('ghost');
        expect(enums.Colour.literals.map((x: any) => x.id)).not.toContain('ghost');
    });

    it('falls back to unknown when the enum flag has no reachable enumeration', () => {
        const enums: Record<string, any> = {};
        const a = attrShape(l, meta('aFake', 'fake', true, 'Nope') as any, enums);
        expect(a.type).toBe('unknown');
        expect(a.enum).toBeUndefined();
        expect(enums).toEqual({});
    });

    it('carries derived through onto the shape', () => {
        const a = attrShape(l, meta('aPlain', 'plain', false, 'EString') as any, {});
        expect(a).toMatchObject({ type: 'string', derived: true, readOnly: true, many: false, required: false });
    });
});

// --- columns ----------------------------------------------------------------

describe('tableColumns', () => {
    it('is attributes then references, and EXCLUDES containment children', () => {
        const cols = tableColumns(Sensor);
        expect(cols.map(c => c.key)).toEqual(['name', 'tint', 'threshold', 'tags', 'computed', 'cfg']);
        expect(cols.map(c => c.key)).not.toContain('ports');
    });

    it('carries the flags a header needs without a second lookup', () => {
        const by = Object.fromEntries(tableColumns(Sensor).map(c => [c.key, c]));
        expect(by.name).toMatchObject({ kind: 'attr', required: true, multiplicity: '1..1' });
        expect(by.tags).toMatchObject({ many: true, multiplicity: '0..*' });
        expect(by.computed).toMatchObject({ derived: true, readOnly: true });
        expect(by.cfg).toMatchObject({ kind: 'ref', typeName: 'Config', required: true });
    });
});

// --- cells ------------------------------------------------------------------

describe('slotShapeFor / tableRow', () => {
    it('renders an enum by literal NAME, whichever convention the slot stores', () => {
        const byId = slotShapeFor(idlookup, 's1', Sensor.attrs[1], shape);
        expect(byId.slot.value).toBe('Green');

        const byName = {
            ...idlookup,
            vTint1: { ...idlookup.vTint1, values: ['Red'] },
        };
        expect(slotShapeFor(byName, 's1', Sensor.attrs[1], shape).slot.value).toBe('Red');
    });

    it('resolves a reference to the target name, and offers the enum domain to the renderer', () => {
        const cfg = slotShapeFor(idlookup, 's1', Sensor.refs[0], shape);
        expect(cfg.slot.value).toBe('cfg1');
        expect(cfg.slot.isReference).toBe(true);

        const tint = slotShapeFor(idlookup, 's1', Sensor.attrs[1], shape);
        expect(tint.slot.enumLiteralNames).toEqual(['Red', 'Green']);
    });

    it('skips the holes a cleared value leaves, in the count and in the text', () => {
        const tags = slotShapeFor(idlookup, 's1', Sensor.attrs[3], shape);
        expect(idlookup.vTags1.values).toHaveLength(3);   // positive control: the hole is there
        expect(tags.count).toBe(2);
        expect(tags.slot.values).toEqual(['alpha', 'beta']);
    });

    it('calls a dangling pointer broken, not empty', () => {
        const bad = slotShapeFor(idlookup, 's2', Sensor.refs[0], shape);
        expect(bad.broken).toBe(true);
        expect(bad.slot.isBroken).toBe(true);
        const row = tableRow(idlookup, 's2', Sensor, shape);
        expect(row.cells.cfg.decision.kind).toBe('brokenRef');
    });

    it('derives `required` from the cardinality and hands it to the ladder (R-FORM-15)', () => {
        // `lower >= 1`, read off the shape and never persisted: the slot carries the
        // flag, the ENGINE turns it into the verdict. Same derivation the canvas
        // adapter makes from `lowerBound`, which is what stops the two surfaces
        // classifying one empty slot two different ways.
        expect(Sensor.refs[0].lower).toBe(1);               // positive control
        expect(slotShapeFor(idlookup, 's1', Sensor.refs[0], shape).slot.required).toBe(true);
        expect(Sensor.attrs[1].lower).toBe(0);              // positive control
        expect(slotShapeFor(idlookup, 's1', Sensor.attrs[1], shape).slot.required).toBe(false);
    });

    it('a derived feature is never required, however its bounds read', () => {
        // Computed rather than held: an empty one is not a model to repair, and
        // flagging it would put a warning on every row of a metamodel that
        // declares one.
        const derivedRequired = { ...Sensor.attrs[4], lower: 1, required: true };
        expect(derivedRequired.derived).toBe(true);         // positive control
        expect(slotShapeFor(idlookup, 's1', derivedRequired, shape).slot.required).toBe(false);
    });

    it('the three states of one reference, side by side (R-FORM-15)', () => {
        // s3 holds the required `cfg` as an EMPTY slot — what a delete leaves on the
        // referrer — beside s2's dangling pointer and s2's absent, optional `tint`.
        // The same three the canvas node now classifies the same way.
        const l = {
            ...idlookup,
            s3: { id: 's3', className: 'DObject', name: 's3', instanceof: 'cSensor', father: 'm1',
                  features: ['vName3', 'vCfg3'] },
            vName3: { id: 'vName3', className: 'DValue', instanceof: 'aName', father: 's3', values: ['s3'] },
            vCfg3: { id: 'vCfg3', className: 'DValue', instanceof: 'rCfg', father: 's3', values: [] },
        };
        expect(tableRow(l, 's3', Sensor, shape).cells.cfg.decision.kind).toBe('missingRequired');
        expect(tableRow(l, 's2', Sensor, shape).cells.cfg.decision.kind).toBe('brokenRef');
        expect(tableRow(l, 's2', Sensor, shape).cells.tint.decision.kind).toBe('dash');
    });

    it('the cell flag is READ OFF the decision, not computed a second time', () => {
        // The divergence R-FORM-15 closes was exactly a second copy of the rule:
        // the table decided ahead of the switch, the node had only the ladder.
        const l = {
            ...idlookup,
            s3: { id: 's3', className: 'DObject', name: 's3', instanceof: 'cSensor', father: 'm1',
                  features: ['vCfg3'] },
            vCfg3: { id: 'vCfg3', className: 'DValue', instanceof: 'rCfg', father: 's3', values: [] },
        };
        const row = tableRow(l, 's3', Sensor, shape);
        expect(row.cells.cfg.missingRequired).toBe(true);
        expect(row.cells.cfg.decision.kind).toBe('missingRequired');
        // and the two other states leave it false, brokenness included
        expect(tableRow(l, 's2', Sensor, shape).cells.cfg.missingRequired).toBe(false);
        expect(tableRow(l, 's2', Sensor, shape).cells.tint.missingRequired).toBe(false);
    });

    it('lets the precedence pick the renderer, per kind', () => {
        const row = tableRow(idlookup, 's1', Sensor, shape);
        expect(row.cells.cfg.decision.kind).toBe('refPill');
        expect(row.cells.tags.decision.kind).toBe('collection');
        expect(row.cells.tags.count).toBe(2);
        expect(row.cells.threshold.decision.kind).toBe('numberUnit');
        // an absent slot is a dash, and s2 has no tint slot at all
        expect(tableRow(idlookup, 's2', Sensor, shape).cells.tint.decision.kind).toBe('dash');
    });

    it('lets a COLOUR-named enum win as a swatch, which is the ladder\'s own order', () => {
        // `tint` holds `Green`, and the ladder asks "is this a colour" of every
        // scalar. This is not the table overriding the enum: `detectValueRenderer`
        // is designed so that an enumeration of colour names paints. Pinned here
        // because it looks like a bug until you know it is the feature.
        expect(tableRow(idlookup, 's1', Sensor, shape).cells.tint.decision.kind).toBe('swatch');
    });

    it('renders a non-colour enum as a chip', () => {
        const kinds = {
            ...shape,
            enums: { ...shape.enums, Kind: { id: 'eKind', name: 'Kind',
                literals: [{ id: 'lInit', name: 'initial' }, { id: 'lFinal', name: 'final' }] } },
        };
        const cls: ClassShape = { ...Sensor, attrs: [
            { key: 'kind', id: 'aKind', lower: 0, upper: 1, many: false, required: false,
              derived: false, readOnly: false, type: 'enum', enum: 'Kind', typeName: 'Kind' },
        ], refs: [] };
        const l = {
            ...idlookup,
            aKind: { id: 'aKind', className: 'DAttribute', name: 'kind' },
            s1: { ...idlookup.s1, features: ['vKind'] },
            vKind: { id: 'vKind', className: 'DValue', instanceof: 'aKind', father: 's1', values: ['lInit'] },
        };
        const cell = tableRow(l, 's1', cls, kinds).cells.kind;
        expect(cell.text).toBe('initial');       // resolved by id, not printed raw
        expect(cell.decision.kind).toBe('enumChip');
    });

    it('honours a rule-1 renderer annotation on the feature', () => {
        const annotated = {
            ...idlookup,
            aThr: { ...idlookup.aThr, annotations: ['annR'] },
            annR: { id: 'annR', className: 'DAnnotation', source: 'jjodel/renderer=code' },
        };
        expect(tableRow(annotated, 's1', Sensor, shape).cells.threshold.decision.kind).toBe('code');
    });

    it('keeps only non-containment pointers in the row, and counts them', () => {
        const all = referencedBy(idlookup, 'cfg1');
        const row = tableRow(idlookup, 'cfg1', shape.classes.Config as ClassShape, shape, [
            ...all,
            { instanceId: 'm1', instanceName: 'plant', instanceClass: 'Model',
              featureKey: 'own', featureId: 'x', composition: true, index: 0 },
        ]);
        expect(row.referencedBy).toHaveLength(1);
        expect(row.referencedBy[0].featureKey).toBe('cfg');
    });
});

// --- search -----------------------------------------------------------------

describe('filterRows', () => {
    const rows = [
        tableRow(idlookup, 's1', Sensor, shape),
        tableRow(idlookup, 's2', Sensor, shape),
    ];

    it('matches the name and the printed values alike', () => {
        expect(filterRows(rows, 's2').map(r => r.id)).toEqual(['s2']);
        expect(filterRows(rows, 'green').map(r => r.id)).toEqual(['s1']);   // an enum LABEL
        expect(filterRows(rows, 'cfg1').map(r => r.id)).toEqual(['s1']);    // a reference TARGET
        expect(filterRows(rows, 'beta').map(r => r.id)).toEqual(['s1']);    // the far side of a hole
    });

    it('ANDs the terms across the row rather than matching a phrase', () => {
        expect(filterRows(rows, 'green 42').map(r => r.id)).toEqual(['s1']);
        expect(filterRows(rows, 'green nothingness')).toEqual([]);
    });

    it('is case-insensitive and returns everything on an empty query', () => {
        expect(filterRows(rows, '  GREEN ').map(r => r.id)).toEqual(['s1']);
        expect(filterRows(rows, '   ')).toHaveLength(2);
    });
});
