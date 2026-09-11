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

    it('CONTROL: unrestricted, the same lookup silently picks the first — the old behaviour', () => {
        const mm = buildCaseClashMetamodel();
        const resolution = resolveTargetInMetamodel(qn('COLOUR'), mm);
        expect(resolution.ambiguousWith).toBeUndefined();
        expect(resolution.element?.id).toBe('enum-lower');
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
