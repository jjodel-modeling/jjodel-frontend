import { describe, it, expect } from 'vitest';
import {
    isClassKind,
    isTypeKindAllowed,
    isDataTypeExtendsWriteAllowed,
    modelIdOf,
    findClassifierKindViolations,
    classifierKindSignature,
    describeClassifierKindViolation,
} from '../classifierKindRules';

/**
 * Enum step B (R-EDGE-2, P-2026-09-27-1806): the rules the model-layer setters apply.
 * The setters live in `LModelElement.tsx`, which the bench cannot import, so the rules are
 * executed here. The browser probe of the lane executes the wiring.
 */

describe('isClassKind: only a DClass', () => {
    it('a class is a class', () => {
        expect(isClassKind('DClass')).toBe(true);
    });
    it('an enum, a data type, a package, an object are not', () => {
        for (const cn of ['DEnumerator', 'DDataType', 'DPackage', 'DObject']) expect(isClassKind(cn)).toBe(false);
    });
    it('an unresolved element is not a class', () => {
        expect(isClassKind(undefined)).toBe(false);
        expect(isClassKind(null)).toBe(false);
    });
});

describe('isTypeKindAllowed (B1): a reference is typed by a class', () => {
    it('refuses a reference typed by an enum, a data type or a package', () => {
        for (const cn of ['DEnumerator', 'DDataType', 'DPackage']) expect(isTypeKindAllowed('DReference', cn)).toBe(false);
    });
    it('lets a reference be typed by a class', () => {
        expect(isTypeKindAllowed('DReference', 'DClass')).toBe(true);
    });
    it('lets an unresolved pointer or name through, as set-by-name does today', () => {
        expect(isTypeKindAllowed('DReference', undefined)).toBe(true);
    });
    it('does not constrain attributes, operations or parameters', () => {
        expect(isTypeKindAllowed('DAttribute', 'DEnumerator')).toBe(true);
        expect(isTypeKindAllowed('DOperation', 'DEnumerator')).toBe(true);
        expect(isTypeKindAllowed('DParameter', 'DDataType')).toBe(true);
    });
});

describe('isDataTypeExtendsWriteAllowed (B3): removals pass, additions do not', () => {
    it('refuses the first supertype of an enum (S5b)', () => {
        expect(isDataTypeExtendsWriteAllowed([], ['Pointer_Person'])).toBe(false);
        expect(isDataTypeExtendsWriteAllowed(undefined, ['Pointer_Person'])).toBe(false);
    });
    it('allows removing a saved supertype (Dummy.dclass, syncDeleteEdge)', () => {
        expect(isDataTypeExtendsWriteAllowed(['Pointer_Person'], [])).toBe(true);
        expect(isDataTypeExtendsWriteAllowed(['Pointer_A', 'Pointer_B'], ['Pointer_B'])).toBe(true);
    });
    it('refuses a write that removes one and adds another', () => {
        expect(isDataTypeExtendsWriteAllowed(['Pointer_A'], ['Pointer_B'])).toBe(false);
    });
    it('allows rewriting the same list and clearing an absent one', () => {
        expect(isDataTypeExtendsWriteAllowed(['Pointer_A'], ['Pointer_A'])).toBe(true);
        expect(isDataTypeExtendsWriteAllowed(undefined, [])).toBe(true);
        expect(isDataTypeExtendsWriteAllowed(null, [])).toBe(true);
    });
    it('does not read or mutate its inputs beyond membership', () => {
        const prev = ['Pointer_A', 'Pointer_B'];
        const next = ['Pointer_A'];
        isDataTypeExtendsWriteAllowed(prev, next);
        expect(prev).toEqual(['Pointer_A', 'Pointer_B']);
        expect(next).toEqual(['Pointer_A']);
    });
});

// ── S24: the detector over idlookup ──────────────────────────────────────────

type Entry = Record<string, any>;

/**
 * A metamodel `mm` with the three shapes of R-EDGE-3 and a legitimate control for each, a
 * second metamodel `mm2` holding an S1 of its own, and the m3 EObject outside both.
 * Pointers start with `Pointer`, as `Pointers.isPointer` reads them.
 */
function fixture(): Record<string, Entry> {
    const L: Record<string, Entry> = {
        Pointer_mm: { className: 'DModel', isMetamodel: true, name: 'MM' },
        Pointer_pkg: { className: 'DPackage', name: 'p', father: 'Pointer_mm' },
        Pointer_person: { className: 'DClass', name: 'Person', father: 'Pointer_pkg', extends: [] },
        Pointer_other: { className: 'DClass', name: 'Other', father: 'Pointer_pkg', extends: ['Pointer_person'] },
        Pointer_enum: { className: 'DEnumerator', name: 'Color', father: 'Pointer_pkg', extends: ['Pointer_person'] },
        Pointer_dt: { className: 'DDataType', name: 'Money', father: 'Pointer_pkg' },
        // S1, S6 and a control reference typed by a class.
        Pointer_s1: { className: 'DReference', name: 'badRef', father: 'Pointer_person', type: 'Pointer_enum' },
        Pointer_s6: { className: 'DReference', name: 'pkgRef', father: 'Pointer_person', type: 'Pointer_pkg' },
        Pointer_ok: { className: 'DReference', name: 'okRef', father: 'Pointer_person', type: 'Pointer_other' },
        Pointer_eobj: { className: 'DReference', name: 'anyRef', father: 'Pointer_other', type: 'Pointer_EOBJECT' },
        // A type set by name before its class exists, and a pointer whose target is gone (undo, §3.3).
        Pointer_named: { className: 'DReference', name: 'namedRef', father: 'Pointer_other', type: 'Later' },
        Pointer_missing: { className: 'DReference', name: 'goneRef', father: 'Pointer_other', type: 'Pointer_gone' },
        // A class whose supertype is not a class.
        Pointer_bad: { className: 'DClass', name: 'Bad', father: 'Pointer_pkg', extends: ['Pointer_other', 'Pointer_dt'] },
        // A supertype pointer to nothing: dangling, «Check integrity»'s business, not this rule's.
        Pointer_dang: { className: 'DClass', name: 'Dang', father: 'Pointer_pkg', extends: ['Pointer_deleted'] },
        // An attribute typed by the enum: legal.
        Pointer_attr: { className: 'DAttribute', name: 'color', father: 'Pointer_person', type: 'Pointer_enum' },
        Pointer_EOBJECT: { className: 'DClass', name: 'EObject', father: 'Pointer_m3pkg', extends: [] },
        Pointer_m3pkg: { className: 'DPackage', name: 'ecore', father: 'Pointer_m3' },
        Pointer_m3: { className: 'DModel', isMetamodel: true, name: 'M3' },
        Pointer_mm2: { className: 'DModel', isMetamodel: true, name: 'MM2' },
        Pointer_pkg2: { className: 'DPackage', name: 'q', father: 'Pointer_mm2' },
        Pointer_c2: { className: 'DClass', name: 'C2', father: 'Pointer_pkg2', extends: [] },
        Pointer_e2: { className: 'DEnumerator', name: 'E2', father: 'Pointer_pkg2' },
        Pointer_r2: { className: 'DReference', name: 'r2', father: 'Pointer_c2', type: 'Pointer_e2' },
    };
    return L;
}

const brief = (vs: ReturnType<typeof findClassifierKindViolations>) =>
    vs.map((v) => `${v.kind}:${v.elementId}->[${v.targetIds.join(',')}]@[${v.anchorIds.join(',')}]`);

describe('modelIdOf: the father chain up to the DModel', () => {
    it('resolves a reference to its metamodel', () => {
        expect(modelIdOf(fixture(), 'Pointer_s1')).toBe('Pointer_mm');
    });
    it('returns undefined for a broken chain and stops on a cycle', () => {
        const L = fixture();
        L.Pointer_orphan = { className: 'DClass', father: 'Pointer_nowhere' };
        L.Pointer_loopA = { className: 'DClass', father: 'Pointer_loopB' };
        L.Pointer_loopB = { className: 'DClass', father: 'Pointer_loopA' };
        expect(modelIdOf(L, 'Pointer_orphan')).toBeUndefined();
        expect(modelIdOf(L, 'Pointer_loopA')).toBeUndefined();
    });
});

describe('findClassifierKindViolations: the three saved shapes, and nothing else', () => {
    it('finds S1, S6, S5b, a non-class supertype and the missing type, in element order', () => {
        expect(brief(findClassifierKindViolations(fixture(), 'Pointer_mm'))).toEqual([
            'supertype-not-class:Pointer_bad->[Pointer_dt]@[Pointer_bad]',
            'datatype-extends:Pointer_enum->[Pointer_person]@[Pointer_enum,Pointer_person]',
            'reference-type-missing:Pointer_missing->[Pointer_gone]@[Pointer_missing,Pointer_other]',
            'reference-type-not-class:Pointer_s1->[Pointer_enum]@[Pointer_s1,Pointer_person]',
            'reference-type-not-class:Pointer_s6->[Pointer_pkg]@[Pointer_s6,Pointer_person]',
        ]);
    });
    it('stays inside the model it is asked about', () => {
        expect(brief(findClassifierKindViolations(fixture(), 'Pointer_mm2'))).toEqual([
            'reference-type-not-class:Pointer_r2->[Pointer_e2]@[Pointer_r2,Pointer_c2]',
        ]);
    });
    it('reports nothing on a clean metamodel', () => {
        const L = fixture();
        L.Pointer_s1.type = 'Pointer_other';
        L.Pointer_s6.type = 'Pointer_EOBJECT';
        L.Pointer_enum.extends = [];
        L.Pointer_bad.extends = ['Pointer_other'];
        delete L.Pointer_missing;
        expect(findClassifierKindViolations(L, 'Pointer_mm')).toEqual([]);
    });
    it('does not see pending creates (inherited keys of idlookup)', () => {
        const pending = { Pointer_p1: { className: 'DReference', name: 'p', father: 'Pointer_person', type: 'Pointer_enum' } };
        const L = Object.assign(Object.create(pending), fixture());
        expect(brief(findClassifierKindViolations(L, 'Pointer_mm')).some((s) => s.includes('Pointer_p1'))).toBe(false);
    });
});

describe('classifierKindSignature: changes exactly when a verdict can change', () => {
    const sig = (L: Record<string, Entry>) => classifierKindSignature(L);
    it('moves on a retype, an extends write, and the deletion of a target', () => {
        const base = sig(fixture());
        const a = fixture(); a.Pointer_s1.type = 'Pointer_other';
        const b = fixture(); b.Pointer_enum.extends = [];
        const c = fixture(); delete c.Pointer_enum;
        const d = fixture(); d.Pointer_dt.className = 'DClass';
        // The package S6 points at is not in the signature itself: only the kind of the target moves it.
        const e = fixture(); delete e.Pointer_pkg;
        for (const L of [a, b, c, d, e]) expect(sig(L)).not.toBe(base);
    });
    it('does not move on a rename or on an unrelated element', () => {
        const base = sig(fixture());
        const a = fixture(); a.Pointer_person.name = 'Human';
        const b = fixture(); b.Pointer_view = { className: 'DViewElement', name: 'v' };
        expect(sig(a)).toBe(base);
        expect(sig(b)).toBe(base);
    });
});

describe('describeClassifierKindViolation: names the element and the fix', () => {
    const L = fixture();
    const texts = findClassifierKindViolations(L, 'Pointer_mm').map((v) => describeClassifierKindViolation(v, L));
    it('says what holds the pointer and what it points at', () => {
        expect(texts.map((t) => t.description)).toEqual([
            'Class "Bad" extends the data type "Money". Only a class can be a supertype: remove it from the supertypes of "Bad".',
            'Enumeration "Color" extends "Person". Only a class can have supertypes: remove the inheritance edge.',
            'Reference "Other.goneRef" is typed by an element that no longer exists.',
            'Reference "Person.badRef" is typed by the enumeration "Color". A reference can only be typed by a class: retype it to a class.',
            'Reference "Person.pkgRef" is typed by the package "p". A reference can only be typed by a class: retype it to a class.',
        ]);
    });
    it('uses no em dash', () => {
        for (const t of texts) expect(t.title + t.description).not.toMatch(/—/);
    });
});
