import { describe, it, expect } from 'vitest';
import { isMetamodelConnectionValid } from '../connectionValidity';
import type { EditorMode } from '../../hooks/useEditorMode';
import type { ClassNodeType } from '../../nodes/ClassNode';
import type { EnumNodeType } from '../../nodes/EnumNode';
import type { PackageNodeType } from '../../nodes/PackageNode';
import type { ObjectNodeType } from '../../nodes/ObjectNode';

// Node type strings, typed by each node's own declaration (the keys the
// EditorV2 nodeTypes registry maps to these components): a drifted literal
// fails typecheck. Independent of the module's constant on purpose.
const CLASS: NonNullable<ClassNodeType['type']> = 'classNode';
const ENUM: NonNullable<EnumNodeType['type']> = 'enumNode';
const PACKAGE: NonNullable<PackageNodeType['type']> = 'packageNode';
const OBJECT: NonNullable<ObjectNodeType['type']> = 'objectNode';

const TYPES = [CLASS, ENUM, PACKAGE, OBJECT];
const MODES: EditorMode[] = ['metamodel', 'model'];
// A missing node (getNode returns undefined), xyflow's fallback type, and near misses.
const UNKNOWN: (string | undefined)[] = [undefined, '', 'default', 'ClassNode', 'classNode ', 'class'];

// Every ordered pair, both directions included: 16 per mode.
const PAIRS = TYPES.flatMap(a => TYPES.map(b => [a, b] as const));

describe('isMetamodelConnectionValid — the node-type matrix (R-EDGE-1)', () => {
    // Kills "only the source end is checked", "only the target end is checked",
    // "an unknown node type passes" (object and package ends), and
    // "the mode is read from node types" (object -> object in a metamodel).
    it.each(PAIRS)('metamodel: %s -> %s is valid iff both ends are class nodes', (src, tgt) => {
        expect(isMetamodelConnectionValid('metamodel', src, tgt)).toBe(src === CLASS && tgt === CLASS);
    });

    // Kills "model mode returns false for an enum end" and
    // "the mode is read from node types" (class/enum/package ends in a model).
    it.each(PAIRS)('model: %s -> %s is always valid', (src, tgt) => {
        expect(isMetamodelConnectionValid('model', src, tgt)).toBe(true);
    });

    it('metamodel: the refused gestures of the report (S1-S6) are refused, the control is accepted', () => {
        expect(isMetamodelConnectionValid('metamodel', CLASS, ENUM)).toBe(false);    // S1, S1b, S4
        expect(isMetamodelConnectionValid('metamodel', ENUM, CLASS)).toBe(false);    // S2, S5b
        expect(isMetamodelConnectionValid('metamodel', ENUM, ENUM)).toBe(false);     // S3
        expect(isMetamodelConnectionValid('metamodel', CLASS, PACKAGE)).toBe(false); // S6
        expect(isMetamodelConnectionValid('metamodel', CLASS, CLASS)).toBe(true);    // S0, S0b, self-reference
    });
});

describe('isMetamodelConnectionValid — symmetry', () => {
    // Kills the one-end mutants: swapping the ends never changes the answer,
    // since the inheritance swap decides direction by geometry (report risk 5).
    it.each(MODES)('%s: swapping source and target gives the same answer', (mode) => {
        for (const [a, b] of PAIRS) {
            expect(isMetamodelConnectionValid(mode, a, b)).toBe(isMetamodelConnectionValid(mode, b, a));
        }
        for (const u of UNKNOWN) {
            expect(isMetamodelConnectionValid(mode, CLASS, u)).toBe(isMetamodelConnectionValid(mode, u, CLASS));
        }
    });
});

describe('isMetamodelConnectionValid — unknown node types', () => {
    // Kills "an unknown node type passes": the rule is positive, not "not an enum".
    it.each(UNKNOWN.map(u => [u] as const))('metamodel: class <-> %j is refused, both ways', (u) => {
        expect(isMetamodelConnectionValid('metamodel', CLASS, u)).toBe(false);
        expect(isMetamodelConnectionValid('metamodel', u, CLASS)).toBe(false);
        expect(isMetamodelConnectionValid('metamodel', u, u)).toBe(false);
    });

    // Kills "model mode returns false" for any end: mode first, whatever the types.
    it.each(UNKNOWN.map(u => [u] as const))('model: class <-> %j is valid, both ways', (u) => {
        expect(isMetamodelConnectionValid('model', CLASS, u)).toBe(true);
        expect(isMetamodelConnectionValid('model', u, CLASS)).toBe(true);
        expect(isMetamodelConnectionValid('model', u, u)).toBe(true);
    });
});
