/**
 * JjScript element resolvers — target kind restriction.
 *
 * Covers the defect measured in
 * `docs/discovery/discovery_2026-09-11_jjscript_target_resolution.md`: the target after
 * `in` was resolved by a case-insensitive scan over every element kind, returning the
 * first match in collection order. `create literal HAPPY in Mood` therefore picked the
 * attribute `Scene.mood` — created earlier by the same script — over the enum `Mood`.
 *
 * These are resolver-level tests on purpose. The executor cannot be imported under the
 * repo's `environment: 'node'` vitest config: `create.ts` reaches monaco-editor through
 * the `joiner` barrel and dies with `ReferenceError: window is not defined` (measured).
 * End-to-end verification of the reproduction script is manual.
 */

import { describe, it, expect } from 'vitest';
import {
    resolveElement,
    resolveElementInMetamodel,
    resolveTargetInMetamodel,
    resolveTargetInProject,
    resolveEnumTypeTarget,
    ambiguityMessage,
    QUALIFY_ADVICE,
    kindLabel,
    TARGET_KINDS_BY_ELEMENT_TYPE,
    CONTAINER_KINDS,
} from '../resolvers';
import type { QualifiedName } from '../../types';

// ─── fixtures ────────────────────────────────────────────────────────────────
//
// `LModel.attributes` is not a local collection: it is the FLAT list of every attribute
// of every class in the metamodel (`model/logicWrapper/LModelElement.tsx:5833`,
// `joiner/classes.ts:3488`). That is why `Scene.mood` is visible from the metamodel root
// and collides, ignoring case, with the enum `Mood`. The fixture reproduces that shape.

const qn = (raw: string, member?: string): QualifiedName =>
    ({ segments: raw.split('::'), member, raw: member ? `${raw}.${member}` : raw });

function buildMetamodel() {
    const sceneMood = { name: 'mood', className: 'DAttribute', id: 'attr-scene-mood' };
    const sceneTitle = { name: 'title', className: 'DAttribute', id: 'attr-scene-title' };
    const happy = { name: 'HAPPY', className: 'DEnumLiteral', id: 'lit-happy' };
    const calm = { name: 'CALM', className: 'DEnumLiteral', id: 'lit-calm' };
    const moodEnum = { name: 'Mood', className: 'DEnumerator', id: 'enum-mood', literals: [happy, calm] };
    const scene = {
        name: 'Scene', className: 'DClass', id: 'cls-scene',
        attributes: [sceneTitle, sceneMood], references: [], operations: [],
    };
    const metamodel: any = {
        name: 'MM', className: 'DModel', id: 'mm-1', isMetamodel: true,
        packages: [], classes: [scene],
        attributes: [sceneTitle, sceneMood],
        references: [], operations: [], parameters: [],
        literals: [happy, calm], enumerators: [moodEnum],
    };
    return { metamodel, scene, sceneMood, moodEnum, happy };
}

const asProject = (metamodel: any) =>
    ({ name: 'P', className: 'DProject', id: 'prj-1', metamodels: [metamodel], models: [] } as any);

/** Two enums differing only by case. The platform allows this: M2 uniqueness compares
 *  names case-sensitively and reports a case-only clash as a warning, not a refusal
 *  (`model/logicWrapper/nameUniqueness.ts:513` and :527-539). */
function buildCaseClashMetamodel() {
    const lower = { name: 'colour', className: 'DEnumerator', id: 'enum-lower', literals: [] };
    const upper = { name: 'Colour', className: 'DEnumerator', id: 'enum-upper', literals: [] };
    return {
        name: 'MM', className: 'DModel', id: 'mm-2', isMetamodel: true,
        packages: [], classes: [], attributes: [], references: [],
        operations: [], parameters: [], literals: [], enumerators: [lower, upper],
    } as any;
}

// ─── the reported bug ────────────────────────────────────────────────────────

describe('kind-restricted resolution — the reported bug', () => {
    it('resolves `Mood` to the enum when only enums are admissible', () => {
        const { metamodel, moodEnum } = buildMetamodel();
        const resolved = resolveElementInMetamodel(qn('Mood'), metamodel, ['enum']);
        expect(resolved?.id).toBe(moodEnum.id);
        expect(resolved?.className).toBe('DEnumerator');
    });

    it('prefers the enum even unrestricted, because `Mood` is the exact spelling', () => {
        // Exact-case-first applies to every caller, not just the restricted ones: it is the
        // half of the fix that needs no call site to opt in. Before it, collection order
        // decided and the attribute won.
        const { metamodel, moodEnum } = buildMetamodel();
        expect(resolveElementInMetamodel(qn('Mood'), metamodel)?.id).toBe(moodEnum.id);
    });

    it('CONTROL: the attribute is still reachable — asking for `mood` returns it', () => {
        // Without this, the test above would pass equally if the attribute had vanished
        // from the fixture or from the search.
        const { metamodel, sceneMood } = buildMetamodel();
        expect(resolveElementInMetamodel(qn('mood'), metamodel)?.id).toBe(sceneMood.id);
    });

    it('POSITIVE CONTROL: with no colliding attribute, `Mood` resolves to the enum unrestricted too', () => {
        // Without this the test above proves nothing: it would pass equally if the search
        // never reached the `enumerators` collection at all.
        const { metamodel, moodEnum } = buildMetamodel();
        metamodel.attributes = [];
        metamodel.classes = [];
        expect(resolveElementInMetamodel(qn('Mood'), metamodel)?.id).toBe(moodEnum.id);
    });

    it('resolves `Scene` to the class when only classes are admissible', () => {
        const { metamodel, scene } = buildMetamodel();
        expect(resolveElementInMetamodel(qn('Scene'), metamodel, ['class'])?.id).toBe(scene.id);
    });

    it('finds nothing when no admissible element carries the name', () => {
        const { metamodel } = buildMetamodel();
        expect(resolveElementInMetamodel(qn('title'), metamodel, ['enum'])).toBeNull();
    });
});

// ─── project-wide resolver ───────────────────────────────────────────────────

describe('project-wide resolveElement carries the same restriction', () => {
    it('resolves `Mood` to the enum when only enums are admissible', () => {
        const { metamodel, moodEnum } = buildMetamodel();
        expect(resolveElement(qn('Mood'), asProject(metamodel), ['enum'])?.id).toBe(moodEnum.id);
    });

    it('prefers the enum unrestricted too, on the exact spelling', () => {
        const { metamodel, moodEnum } = buildMetamodel();
        expect(resolveElement(qn('Mood'), asProject(metamodel))?.id).toBe(moodEnum.id);
    });

    it('CONTROL: `mood` still reaches the attribute project-wide', () => {
        const { metamodel, sceneMood } = buildMetamodel();
        expect(resolveElement(qn('mood'), asProject(metamodel))?.id).toBe(sceneMood.id);
    });
});

// ─── exact case wins ─────────────────────────────────────────────────────────

describe('exact-case match wins over a case-insensitive one', () => {
    it('picks the enum spelled exactly as asked', () => {
        const mm = buildCaseClashMetamodel();
        expect(resolveElementInMetamodel(qn('Colour'), mm, ['enum'])?.id).toBe('enum-upper');
    });

    it('picks the other one when the other spelling is asked for', () => {
        const mm = buildCaseClashMetamodel();
        expect(resolveElementInMetamodel(qn('colour'), mm, ['enum'])?.id).toBe('enum-lower');
    });

    it('an exact match beats an earlier candidate of the admissible kind', () => {
        // 'colour' comes first in the collection; 'Colour' is the exact spelling asked for.
        const mm = buildCaseClashMetamodel();
        expect(mm.enumerators[0].id).toBe('enum-lower');   // the ordering the fix must ignore
        expect(resolveElementInMetamodel(qn('Colour'), mm, ['enum'])?.id).toBe('enum-upper');
    });
});

// ─── ambiguity ───────────────────────────────────────────────────────────────

describe('an ambiguous case-insensitive fallback is an error, not a coin toss', () => {
    it('reports both candidates when no spelling matches exactly', () => {
        const mm = buildCaseClashMetamodel();
        const resolution = resolveTargetInMetamodel(qn('COLOUR'), mm, ['enum']);
        expect(resolution.element).toBeNull();
        expect(resolution.ambiguousWith).toEqual(['colour', 'Colour']);
    });

    it('reports the same ambiguity project-wide', () => {
        const resolution = resolveTargetInProject(qn('COLOUR'), asProject(buildCaseClashMetamodel()), ['enum']);
        expect(resolution.element).toBeNull();
        expect(resolution.ambiguousWith).toEqual(['colour', 'Colour']);
    });

    it('A1: unrestricted callers are told too — the debt 7bacbd63c declared, paid', () => {
        // This assertion used to read the other way round: «unrestricted, the same lookup
        // silently picks the first — the old behaviour», pinning first-match for the nine
        // callers that pass no `kinds`. A1 makes the rule one rule, with no opt-in, so the
        // old expectation is now the bug and the test is inverted rather than deleted.
        const mm = buildCaseClashMetamodel();
        const resolution = resolveTargetInMetamodel(qn('COLOUR'), mm);
        expect(resolution.element).toBeNull();
        expect(resolution.ambiguousWith).toEqual(['colour', 'Colour']);
    });

    it('a single candidate differing only by case is not ambiguous', () => {
        const { metamodel, moodEnum } = buildMetamodel();
        expect(resolveElementInMetamodel(qn('MOOD'), metamodel, ['enum'])?.id).toBe(moodEnum.id);
    });
});

// ─── not found names the expected kind ───────────────────────────────────────

describe('not-found names the kind that was expected', () => {
    it('kindLabel renders one kind and a pair', () => {
        expect(kindLabel(['enum'])).toBe('Enum');
        expect(kindLabel(['class'])).toBe('Class');
        expect(kindLabel(['package', 'model'])).toBe('Package or Model');
        expect(kindLabel(undefined)).toBe('Element');
        expect(kindLabel([])).toBe('Element');
    });

    it('an absent enum is a miss even though an attribute carries the name', () => {
        const { metamodel } = buildMetamodel();
        metamodel.enumerators = [];          // the enum is gone; the attribute `mood` stays
        const resolution = resolveTargetInMetamodel(qn('Mood'), metamodel, ['enum']);
        expect(resolution.element).toBeNull();
        expect(resolution.ambiguousWith).toBeUndefined();
        // This is the state the `literal-in-attribute` recovery rule is written for:
        // the message the caller builds from it reads
        // `Enum 'Mood' not found. Literals can only be added to enums.`
        expect(kindLabel(['enum'])).toBe('Enum');
    });
});

// ─── the `Parent.member` form used by delete and rename ──────────────────────

describe('the Parent.member form backtracks past a wrong-kind container', () => {
    it('finds the literal under the enum, not under the same-named attribute', () => {
        const { metamodel, happy } = buildMetamodel();
        // `delete literal HAPPY in Mood` parses to { segments: ['Mood'], member: 'HAPPY' }.
        const resolved = resolveElement(qn('Mood', 'HAPPY'), asProject(metamodel), ['literal']);
        expect(resolved?.id).toBe(happy.id);
    });

    it('backtracks unrestricted as well: a candidate whose member misses is skipped', () => {
        // The attribute `mood` has no member `HAPPY`, so it drops out and the enum is tried.
        // Before the fix the attribute was picked first and the whole lookup returned null.
        const { metamodel, happy } = buildMetamodel();
        expect(resolveElement(qn('Mood', 'HAPPY'), asProject(metamodel))?.id).toBe(happy.id);
    });

    it('CONTROL: a member that exists nowhere still resolves to nothing', () => {
        const { metamodel } = buildMetamodel();
        expect(resolveElement(qn('Mood', 'NOPE'), asProject(metamodel), ['literal'])).toBeNull();
    });

    it('resolves an attribute under its class', () => {
        const { metamodel, sceneMood } = buildMetamodel();
        const resolved = resolveElement(qn('Scene', 'mood'), asProject(metamodel), ['attribute']);
        expect(resolved?.id).toBe(sceneMood.id);
    });
});

// ─── the kind tables the commands pass ───────────────────────────────────────

describe('the element-type tables', () => {
    it('maps every element type delete and rename accept', () => {
        expect(TARGET_KINDS_BY_ELEMENT_TYPE['literal']).toEqual(['literal']);
        expect(TARGET_KINDS_BY_ELEMENT_TYPE['attribute']).toEqual(['attribute']);
        expect(TARGET_KINDS_BY_ELEMENT_TYPE['enum']).toEqual(['enum']);
        expect(TARGET_KINDS_BY_ELEMENT_TYPE['enumeration']).toEqual(['enum']);
        expect(TARGET_KINDS_BY_ELEMENT_TYPE['interface']).toEqual(['class']);
        expect(TARGET_KINDS_BY_ELEMENT_TYPE['parameter']).toEqual(['parameter']);
    });

    it('leaves an unknown element type unrestricted', () => {
        expect(TARGET_KINDS_BY_ELEMENT_TYPE['instance']).toBeUndefined();
    });

    it('a list scope admits containers only', () => {
        const { metamodel, scene } = buildMetamodel();
        expect(resolveElement(qn('Scene'), asProject(metamodel), CONTAINER_KINDS)?.id).toBe(scene.id);
        expect(resolveElement(qn('title'), asProject(metamodel), CONTAINER_KINDS)).toBeNull();
    });
});

// ─── backtracking must not cross an admissible container ─────────────────────
//
// Two enums differing only by case, and the member lives on the one the user did NOT
// name. Backtracking past a candidate is legitimate only when that candidate could not
// have held the member in the first place (an attribute has no literals); it must never
// walk from an exact-case container of the right sort onto a case-insensitive sibling.

function buildTwoEnumsMetamodel() {
    const foo = { name: 'FOO', className: 'DEnumLiteral', id: 'lit-foo-lower' };
    const bar = { name: 'BAR', className: 'DEnumLiteral', id: 'lit-bar-upper' };
    const upper = { name: 'Mood', className: 'DEnumerator', id: 'enum-Mood', literals: [bar] };
    const lower = { name: 'mood', className: 'DEnumerator', id: 'enum-mood', literals: [foo] };
    return {
        metamodel: {
            name: 'MM', className: 'DModel', id: 'mm-3', isMetamodel: true,
            packages: [], classes: [], attributes: [], references: [],
            operations: [], parameters: [], literals: [foo, bar], enumerators: [upper, lower],
        } as any,
        foo, bar, upper, lower,
    };
}

describe('member backtracking stops at an admissible container', () => {
    it('does not fall through from the exact-case enum onto its case-only sibling', () => {
        // `delete literal FOO in Mood`: FOO is on `mood`, not on `Mood`. Acting on `mood`
        // would delete a literal the user never named.
        const { metamodel } = buildTwoEnumsMetamodel();
        const resolution = resolveTargetInProject(qn('Mood', 'FOO'), asProject(metamodel), ['literal']);
        expect(resolution.element).toBeNull();
        expect(resolution.memberMissingOn).toEqual({
            parentName: 'Mood', parentKind: 'Enum', member: 'FOO',
        });
    });

    it('CONTROL: the member that IS on the exact-case enum resolves', () => {
        const { metamodel, bar } = buildTwoEnumsMetamodel();
        expect(resolveElement(qn('Mood', 'BAR'), asProject(metamodel), ['literal'])?.id).toBe(bar.id);
    });

    it('CONTROL: naming the other spelling reaches its own literal', () => {
        const { metamodel, foo } = buildTwoEnumsMetamodel();
        expect(resolveElement(qn('mood', 'FOO'), asProject(metamodel), ['literal'])?.id).toBe(foo.id);
    });

    it('still backtracks past a container that could never hold the member', () => {
        // The attribute `mood` has no literals at all — stepping over it is the whole point
        // of the member-before-kind ordering and must keep working.
        const { metamodel, happy } = buildMetamodel();
        expect(resolveElement(qn('Mood', 'HAPPY'), asProject(metamodel), ['literal'])?.id).toBe(happy.id);
    });

    it('backtracks past a NON-holder even when the non-holder is the exact spelling', () => {
        // The attribute is spelled `Mood`, exactly as asked, and holds nothing; the enum is
        // spelled `mood` and holds HAPPY. An attribute could never have held a literal, so
        // stepping over it is legitimate and the enum is the answer. This is the case that
        // separates «cannot hold members» from «happens not to hold this one»: without that
        // distinction the exact-case attribute would stop the search and HAPPY be missed.
        const attrMood = { name: 'Mood', className: 'DAttribute', id: 'attr-Mood' };
        const happy = { name: 'HAPPY', className: 'DEnumLiteral', id: 'lit-happy-lower' };
        const enumMood = { name: 'mood', className: 'DEnumerator', id: 'enum-mood', literals: [happy] };
        const metamodel: any = {
            name: 'MM', className: 'DModel', id: 'mm-4', isMetamodel: true,
            packages: [], classes: [{ name: 'C', className: 'DClass', id: 'c', attributes: [attrMood] }],
            attributes: [attrMood], references: [], operations: [], parameters: [],
            literals: [happy], enumerators: [enumMood],
        };
        const resolution = resolveTargetInProject(qn('Mood', 'HAPPY'), asProject(metamodel), ['literal']);
        expect(resolution.memberMissingOn).toBeUndefined();
        expect(resolution.element?.id).toBe(happy.id);
    });

    it('a missing member on a uniquely selected case-insensitive container is an error too', () => {
        // Only one enum now, spelled `mood`; the user asks for `MOOD.FOO` — wrong member.
        const { metamodel } = buildTwoEnumsMetamodel();
        metamodel.enumerators = [metamodel.enumerators[1]];   // keep `mood` only
        const resolution = resolveTargetInProject(qn('MOOD', 'NOPE'), asProject(metamodel), ['literal']);
        expect(resolution.element).toBeNull();
        expect(resolution.memberMissingOn).toEqual({
            parentName: 'mood', parentKind: 'Enum', member: 'NOPE',
        });
    });
});

// ─── `type <Name>` on create attribute ───────────────────────────────────────
//
// The silent EString fallback measured in
// `docs/discovery/discovery_2026-09-11_attribute_enum_type.md`: `create attribute
// animalMood in Animal type Mood` returned success and produced an EString attribute,
// because neither `normalizeAttributeType` nor the `Defaults['Pointer_MOOD']` lookup knew
// the name and both fell through a `??`.
//
// `resolveEnumTypeTarget` is the half that lives in the resolver. The decision that turns
// its result into a pointer or an error is `resolveAttributeType` in `commands/create.ts`,
// which cannot be imported here (see the header of this file), so the branches it takes
// are asserted through the resolution it branches on.

describe('resolveEnumTypeTarget — the type of an attribute', () => {
    function buildTypedMetamodel() {
        const animal = { name: 'Animal', className: 'DClass', id: 'cls-animal', attributes: [], references: [] };
        const mood = { name: 'Mood', className: 'DEnumerator', id: 'enum-mood', literals: [] };
        const metamodel: any = {
            name: 'MM', id: 'mm-1', packages: [], classes: [animal], attributes: [],
            references: [], operations: [], parameters: [], literals: [], enumerators: [mood],
        };
        return { metamodel, animal, mood };
    }
    const project = (...mms: any[]) => ({ name: 'P', metamodels: mms, models: [] } as any);

    it('resolves an enum of the metamodel', () => {
        const { metamodel, mood } = buildTypedMetamodel();
        expect(resolveEnumTypeTarget(qn('Mood'), metamodel, project(metamodel)).element?.id).toBe(mood.id);
    });

    it('refuses a CLASS of the same name — the kind restriction is the whole point', () => {
        const { metamodel, animal } = buildTypedMetamodel();
        metamodel.enumerators = [];
        metamodel.classes = [animal, { name: 'Mood', className: 'DClass', id: 'cls-mood' }];
        const r = resolveEnumTypeTarget(qn('Mood'), metamodel, project(metamodel));
        expect(r.element).toBeFalsy();
        expect(r.ambiguousWith).toBeUndefined();   // -> "Unknown type", not "Ambiguous"
    });

    it('prefers the exact spelling over a case-only near-homonym', () => {
        const { metamodel } = buildTypedMetamodel();
        metamodel.enumerators = [
            { name: 'mood', className: 'DEnumerator', id: 'enum-lower', literals: [] },
            { name: 'Mood', className: 'DEnumerator', id: 'enum-upper', literals: [] },
        ];
        expect(resolveEnumTypeTarget(qn('Mood'), metamodel, project(metamodel)).element?.id).toBe('enum-upper');
        expect(resolveEnumTypeTarget(qn('mood'), metamodel, project(metamodel)).element?.id).toBe('enum-lower');
    });

    it('reports ambiguity when only the case differs and neither spelling is exact', () => {
        const { metamodel } = buildTypedMetamodel();
        metamodel.enumerators = [
            { name: 'mood', className: 'DEnumerator', id: 'enum-lower', literals: [] },
            { name: 'Mood', className: 'DEnumerator', id: 'enum-upper', literals: [] },
        ];
        const r = resolveEnumTypeTarget(qn('MOOD'), metamodel, project(metamodel));
        expect(r.element).toBeNull();
        expect(r.ambiguousWith).toEqual(['mood', 'Mood']);
    });

    it('accepts the qualified form Metamodel::Name', () => {
        const { metamodel, mood } = buildTypedMetamodel();
        const other: any = {
            name: 'Other', id: 'mm-2', packages: [], classes: [], attributes: [], references: [],
            operations: [], parameters: [], literals: [],
            enumerators: [{ name: 'Mood', className: 'DEnumerator', id: 'enum-other', literals: [] }],
        };
        // No metamodel scope: the qualifier is what decides, and it decides both ways.
        expect(resolveEnumTypeTarget(qn('MM::Mood'), null, project(metamodel, other)).element?.id).toBe(mood.id);
        expect(resolveEnumTypeTarget(qn('Other::Mood'), null, project(metamodel, other)).element?.id).toBe('enum-other');
    });

    it('an unknown name resolves to nothing, with no ambiguity — the error case', () => {
        const { metamodel } = buildTypedMetamodel();
        const r = resolveEnumTypeTarget(qn('Nope'), metamodel, project(metamodel));
        expect(r.element).toBeFalsy();
        expect(r.ambiguousWith).toBeUndefined();
    });

    it('the SCOPED metamodel wins over another metamodel that spells the name the same way', () => {
        // The discriminating fixture: both metamodels declare `Mood`, so an answer of
        // `enum-mood` can only come from the scoped leg running FIRST. Without it — or with
        // the project consulted first — `other` is reachable and the answer flips.
        const { metamodel, mood } = buildTypedMetamodel();
        const other: any = {
            name: 'Other', id: 'mm-2', packages: [], classes: [], attributes: [], references: [],
            operations: [], parameters: [], literals: [],
            enumerators: [{ name: 'Mood', className: 'DEnumerator', id: 'enum-other', literals: [] }],
        };
        // `other` first in the project, so project-wide resolution would answer `enum-other`.
        expect(resolveEnumTypeTarget(qn('Mood'), metamodel, project(other, metamodel)).element?.id)
            .toBe(mood.id);
        // CONTROL: scoped to `other`, the same call gives the other one — the scope is doing it.
        expect(resolveEnumTypeTarget(qn('Mood'), other, project(other, metamodel)).element?.id)
            .toBe('enum-other');
    });

    it('an ambiguous metamodel answer is NOT rescued by the project fallback', () => {
        // Ambiguity is conclusive: the scoped leg has spoken, and falling through would
        // silently answer with a different metamodel's enum instead of asking the user
        // to qualify.
        const { metamodel } = buildTypedMetamodel();
        metamodel.enumerators = [
            { name: 'mood', className: 'DEnumerator', id: 'enum-lower', literals: [] },
            { name: 'Mood', className: 'DEnumerator', id: 'enum-upper', literals: [] },
        ];
        const other: any = {
            name: 'Other', id: 'mm-2', packages: [], classes: [], attributes: [], references: [],
            operations: [], parameters: [], literals: [],
            enumerators: [{ name: 'MOOD', className: 'DEnumerator', id: 'enum-other', literals: [] }],
        };
        const r = resolveEnumTypeTarget(qn('MOOD'), metamodel, project(metamodel, other));
        expect(r.element).toBeNull();
        expect(r.ambiguousWith).toEqual(['mood', 'Mood']);
    });

    it('falls back to the project only when the metamodel has no answer', () => {
        const { metamodel } = buildTypedMetamodel();
        const other: any = {
            name: 'Other', id: 'mm-2', packages: [], classes: [], attributes: [], references: [],
            operations: [], parameters: [], literals: [],
            enumerators: [{ name: 'Colour', className: 'DEnumerator', id: 'enum-colour', literals: [] }],
        };
        expect(resolveEnumTypeTarget(qn('Colour'), metamodel, project(metamodel, other)).element?.id)
            .toBe('enum-colour');
        // CONTROL: with a project of its own the metamodel still wins for a name it holds.
        expect(resolveEnumTypeTarget(qn('Mood'), metamodel, project(metamodel, other)).element?.id)
            .toBe('enum-mood');
    });

    it('does not reach for an ATTRIBUTE of that name — the flat pool cannot leak in', () => {
        // The original defect's shape: `Scene.mood` is visible from the metamodel root.
        const { metamodel } = buildTypedMetamodel();
        const sceneMood = { name: 'Mood', className: 'DAttribute', id: 'attr-mood' };
        metamodel.attributes = [sceneMood];
        metamodel.enumerators = [];
        const r = resolveEnumTypeTarget(qn('Mood'), metamodel, project(metamodel));
        expect(r.element).toBeFalsy();
    });
});

// ─── A1: exact-case homonyms across metamodels ───────────────────────────────
//
// `nameUniqueness.ts` (R-M2U-2) makes a classifier name unique WITHIN a metamodel and
// free ACROSS metamodels, so two metamodels may each declare `Person` and both are
// legal. The name alone cannot choose between them, and until A1 `selectTarget` chose
// anyway — `if (exact.length > 0) return exact[0]`, the first in collection order.
// Measured as P7 in docs/discovery/discovery_2026-09-11_name_resolution_scope.md §5.

describe('A1 — two metamodels, one spelling', () => {
    function twoMetamodels() {
        const mmA: any = { name: 'A', id: 'mm-a' };
        const mmB: any = { name: 'B', id: 'mm-b' };
        const aPerson = { name: 'Person', className: 'DClass', id: 'a-person', model: mmA, attributes: [], references: [] };
        const bPerson = { name: 'Person', className: 'DClass', id: 'b-person', model: mmB, attributes: [], references: [] };
        const shell = (mm: any, cls: any, enums: any[] = []) => Object.assign(mm, {
            packages: [], classes: [cls], attributes: [], references: [],
            operations: [], parameters: [], literals: [], enumerators: enums,
        });
        shell(mmA, aPerson); shell(mmB, bPerson);
        return { mmA, mmB, aPerson, bPerson, project: { name: 'P', metamodels: [mmA, mmB], models: [] } as any };
    }

    it('an unqualified name that both declare is an ambiguity, spelled Metamodel::Name', () => {
        const { project } = twoMetamodels();
        const r = resolveTargetInProject(qn('Person'), project, ['class']);
        expect(r.element).toBeNull();
        expect(r.ambiguousWith).toEqual(['A::Person', 'B::Person']);
    });

    it('and for an unrestricted caller too — no opt-in', () => {
        const { project } = twoMetamodels();
        const r = resolveTargetInProject(qn('Person'), project);
        expect(r.element).toBeNull();
        expect(r.ambiguousWith).toEqual(['A::Person', 'B::Person']);
    });

    it('the qualified form resolves, and never reports ambiguity', () => {
        const { project, aPerson, bPerson } = twoMetamodels();
        expect(resolveTargetInProject(qn('A::Person'), project, ['class']).element?.id).toBe(aPerson.id);
        expect(resolveTargetInProject(qn('B::Person'), project, ['class']).element?.id).toBe(bPerson.id);
        expect(resolveTargetInProject(qn('A::Person'), project, ['class']).ambiguousWith).toBeUndefined();
    });

    it('CONTROL: scoped to one metamodel the name is not ambiguous at all', () => {
        const { mmA, aPerson } = twoMetamodels();
        const r = resolveTargetInMetamodel(qn('Person'), mmA, ['class']);
        expect(r.element?.id).toBe(aPerson.id);
        expect(r.ambiguousWith).toBeUndefined();
    });

    it('CONTROL: one metamodel only — a lone exact match still resolves', () => {
        const { mmA, aPerson, project } = twoMetamodels();
        project.metamodels = [mmA];
        expect(resolveTargetInProject(qn('Person'), project, ['class']).element?.id).toBe(aPerson.id);
    });

    it('the case-insensitive branch is qualified too', () => {
        const { mmA, mmB, project } = twoMetamodels();
        mmA.classes = [{ name: 'person', className: 'DClass', id: 'a-lower', model: mmA }];
        mmB.classes = [{ name: 'Person', className: 'DClass', id: 'b-upper', model: mmB }];
        const r = resolveTargetInProject(qn('PERSON'), project, ['class']);
        expect(r.element).toBeNull();
        expect(r.ambiguousWith).toEqual(['A::person', 'B::Person']);
    });

    it('an element with no owning model is spelled BARE — the m3 primitives', () => {
        // `get_model` returns null for a primitive (it lives in the store, not in a
        // metamodel). Inventing `Ecore::EString` would print something that does not
        // resolve. With kinds restricted to classifiers a primitive should not be a
        // candidate at all; this pins the spelling for the case where one ever is.
        const mmA: any = { name: 'A', id: 'mm-a' };
        const prim = { name: 'EString', className: 'DClass', id: 'Pointer_ESTRING' };   // no .model
        const owned = { name: 'EString', className: 'DClass', id: 'a-estring', model: mmA };
        Object.assign(mmA, {
            packages: [], classes: [prim, owned], attributes: [], references: [],
            operations: [], parameters: [], literals: [], enumerators: [],
        });
        const r = resolveTargetInMetamodel(qn('EString'), mmA, ['class']);
        expect(r.element).toBeNull();
        expect(r.ambiguousWith).toEqual(['EString', 'A::EString']);
    });

    it('the message reads as specified', () => {
        expect(ambiguityMessage('Person', ['A::Person', 'B::Person']))
            .toBe("Ambiguous 'Person': A::Person, B::Person. Qualify as Metamodel::Name.");
        expect(QUALIFY_ADVICE).toBe('Qualify as Metamodel::Name.');
    });

    it('12a318b3a is preserved: an exact-case holder with a missing member still settles', () => {
        // The backtracking rule is about where the search STOPS, not about how many
        // candidates share a spelling. One exact-case enum that cannot hold FOO must still
        // report memberMissingOn rather than walking on.
        const { metamodel } = buildMetamodel();
        const resolution = resolveTargetInMetamodel(qn('Mood', 'FOO'), metamodel, ['literal']);
        expect(resolution.element).toBeNull();
        expect(resolution.memberMissingOn).toEqual({ parentName: 'Mood', parentKind: 'Enum', member: 'FOO' });
        expect(resolution.ambiguousWith).toBeUndefined();
    });

    it('two exact-case holders that both miss the member are an ambiguity, qualified', () => {
        const mmA: any = { name: 'A', id: 'mm-a' };
        const mmB: any = { name: 'B', id: 'mm-b' };
        const eA = { name: 'Mood', className: 'DEnumerator', id: 'a-mood', literals: [], model: mmA };
        const eB = { name: 'Mood', className: 'DEnumerator', id: 'b-mood', literals: [], model: mmB };
        const shell = (mm: any, en: any) => Object.assign(mm, {
            packages: [], classes: [], attributes: [], references: [],
            operations: [], parameters: [], literals: [], enumerators: [en],
        });
        shell(mmA, eA); shell(mmB, eB);
        const project: any = { name: 'P', metamodels: [mmA, mmB], models: [] };
        const r = resolveTargetInProject(qn('Mood', 'FOO'), project, ['literal']);
        expect(r.element).toBeNull();
        expect(r.ambiguousWith).toEqual(['A::Mood', 'B::Mood']);
    });
});

// ─── A1: an unrestricted caller, end to end through `show` ───────────────────
//
// `show` is one of the nine callers that pass no `kinds`. It is exercised here at the
// resolver level (the executor cannot be imported under this bench — see the header),
// on both ambiguity branches, because those nine are exactly the ones whose behaviour
// A1 changes without them opting in.

describe('A1 — the unrestricted caller `show` on both branches', () => {
    const showLookup = (target: any, project: any) => resolveTargetInProject(target, project);

    function projectWith(classes: { name: string; id: string; mm: string }[]) {
        const mms = new Map<string, any>();
        for (const c of classes) {
            if (!mms.has(c.mm)) mms.set(c.mm, Object.assign({ name: c.mm, id: 'mm-' + c.mm }, {
                packages: [], classes: [], attributes: [], references: [],
                operations: [], parameters: [], literals: [], enumerators: [],
            }));
            const mm = mms.get(c.mm);
            mm.classes.push({ name: c.name, className: 'DClass', id: c.id, model: mm });
        }
        return { name: 'P', metamodels: [...mms.values()], models: [] } as any;
    }

    it('exact-case homonyms: show is told, and told in qualified spellings', () => {
        const p = projectWith([{ name: 'Person', id: 'a1', mm: 'A' }, { name: 'Person', id: 'b1', mm: 'B' }]);
        const r = showLookup(qn('Person'), p);
        expect(r.element).toBeNull();
        expect(r.ambiguousWith).toEqual(['A::Person', 'B::Person']);
    });

    it('case-insensitive plurality: show is told there too', () => {
        const p = projectWith([{ name: 'person', id: 'a1', mm: 'A' }, { name: 'Person', id: 'b1', mm: 'B' }]);
        const r = showLookup(qn('PERSON'), p);
        expect(r.element).toBeNull();
        expect(r.ambiguousWith).toEqual(['A::person', 'B::Person']);
    });

    it('CONTROL: with one candidate show still resolves, unqualified and unrestricted', () => {
        const p = projectWith([{ name: 'Person', id: 'a1', mm: 'A' }]);
        expect(showLookup(qn('Person'), p).element?.id).toBe('a1');
    });
});
