/**
 * L1 — a JjScript M2 `create` consults the one verdict before writing (R-M2U-1..6).
 *
 * What this bench executes: the real `checkM2NameUniqueness` (the rule), the real
 * `m2KindForElementType` / `duplicateNameRefusal` / `withNearHomonymWarning` (the translation
 * L1 adds), and the real `errorFromResult` (what the dialog will actually show). Three of the
 * four modules are the subject; the rule is included because a translation tested against a
 * hand-made verdict would measure the hand, not the rule.
 *
 * Why the `joiner` mock: `nameUniqueness.ts` does not import under vitest — the barrel pulls
 * monaco (`window is not defined`) and the environment is `node`. What the barrel supplies to
 * that module at runtime is three `cname` strings and the pending dictionary; the mock
 * substitutes those and leaves the REAL module running. Same technique, and the same reason, as
 * `frontend/src/model/__tests__/m2NameUniqueness.test.ts`.
 *
 * DECLARED GAP (CLAUDE.md §5): `executeCreate` itself cannot be imported here — `create.ts`
 * reaches the same barrel. So the wiring inside it (that the gate runs before the switch, that
 * the warning is merged into the successful result) is NOT covered by an executing test, and is
 * not covered by a source-text one either. It is covered by the visual check on localhost:3001.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../joiner', () => ({
    DModel: { cname: 'DModel' },
    DObject: { cname: 'DObject' },
    DValue: { cname: 'DValue' },
    DPointerTargetable: { pendingCreation: {} as { [k: string]: any } },
}));

const { checkM2NameUniqueness } = await import('../../../model/logicWrapper/nameUniqueness');
const { m2KindForElementType, M2_KIND_BY_ELEMENT_TYPE, duplicateNameRefusal, withNearHomonymWarning } =
    await import('../m2CreateGuard');
const { errorFromResult } = await import('../errors');
const PENDING = ((await import('../../../joiner')) as any).DPointerTargetable.pendingCreation as any;

type Any = any;

// ── the fixture: one metamodel with two packages, plus a second metamodel ─────────────
// Duck-typed exactly like the L proxies the verdict sees on the field: it reads `className`,
// `id`, `name`, `father` and the collections, never a method.

function klass(id: string, name: string): Any {
    return {
        className: 'DClass', id, name, father: undefined,
        ownAttributes: [], ownReferences: [], ownOperations: [],
        allAttributes: [], allReferences: [], allOperations: [], allExtends: [],
    };
}
function pkg(id: string, name: string): Any {
    return {
        className: 'DPackage', id, name, father: undefined,
        classes: [], enumerators: [], datatypes: [], subpackages: [], children: [],
    };
}
function attach(child: Any, father: Any, collection: string): Any {
    child.father = father;
    father[collection].push(child);
    return child;
}
/** An element in the current-tick dictionary: outside every collection, by construction. */
function pending(className: string, id: string, name: string, father: Any): Any {
    const e = { className, id, name, father: father?.id ?? father };
    PENDING[id] = e;
    return e;
}

let model: Any, other: Any, pkgA: Any, pkgB: Any, otherPkg: Any, person: Any;

beforeEach(() => {
    for (const k of Object.keys(PENDING)) delete PENDING[k];

    model = { className: 'DModel', id: 'mm', name: 'Families', isMetamodel: true, allSubPackages: [] };
    pkgA = pkg('pA', 'A'); pkgA.father = model; model.allSubPackages.push(pkgA);
    pkgB = pkg('pB', 'B'); attach(pkgB, pkgA, 'subpackages'); model.allSubPackages.push(pkgB);
    person = attach(klass('cPerson', 'Person'), pkgA, 'classes');
    pkgA.children = [...pkgA.subpackages, ...pkgA.classes, ...pkgA.enumerators];

    other = { className: 'DModel', id: 'mm2', name: 'Library', isMetamodel: true, allSubPackages: [] };
    otherPkg = pkg('pO', 'O'); otherPkg.father = other; other.allSubPackages.push(otherPkg);
});

/** The exact two calls `executeCreate` makes, in order. */
function attemptCreate(elementType: string, name: string, father: Any, metamodelName?: string) {
    const kind = m2KindForElementType(elementType);
    if (!kind) return { gated: false as const, refusal: null, verdict: undefined };
    const verdict = checkM2NameUniqueness({ father, kind, name });
    return { gated: true as const, verdict, refusal: duplicateNameRefusal(elementType, name, verdict, metamodelName) };
}

// ─────────────────────────────────────────────────────────────────────────────
describe('m2KindForElementType — the namespace each command writes into', () => {
    it('maps every gated elementType to the kind its L twin already passes', () => {
        expect(m2KindForElementType('class')).toBe('classifier');
        expect(m2KindForElementType('abstract class')).toBe('classifier');
        expect(m2KindForElementType('interface')).toBe('classifier');
        expect(m2KindForElementType('enum')).toBe('classifier');
        expect(m2KindForElementType('enumeration')).toBe('classifier');
        expect(m2KindForElementType('package')).toBe('package');
        expect(m2KindForElementType('attribute')).toBe('feature');
        expect(m2KindForElementType('reference')).toBe('feature');
        expect(m2KindForElementType('containment')).toBe('feature');
        expect(m2KindForElementType('composition')).toBe('feature');
        expect(m2KindForElementType('operation')).toBe('feature');
        expect(m2KindForElementType('parameter')).toBe('parameter');
        expect(m2KindForElementType('literal')).toBe('literal');
        // the nine writes of D1 are all reachable: thirteen command spellings, six namespaces
        expect(Object.keys(M2_KIND_BY_ELEMENT_TYPE)).toHaveLength(13);
    });

    it('returns null for what the gate must not touch — the fall-through signal', () => {
        // M1: governed by R-S1-*, and it leaves executeCreate before the gate.
        expect(m2KindForElementType('instance')).toBeNull();
        // JjScript has no command that creates one, so the namespace is out of reach.
        expect(m2KindForElementType('datatype')).toBeNull();
        for (const t of ['', undefined, null, 'nonsense']) expect(m2KindForElementType(t as any)).toBeNull();
        // positive control: the same call on a real elementType answers
        expect(m2KindForElementType('class')).not.toBeNull();
    });
});

describe('the pool is the metamodel, not the package (R-M2U-2)', () => {
    it('same package, same metamodel: refused, and the sentence names element and metamodel', () => {
        const { refusal } = attemptCreate('class', 'Person', pkgA, 'Families');
        expect(refusal).not.toBeNull();
        expect(refusal!.success).toBe(false);
        expect(refusal!.message).toBe(
            `Cannot create class 'Person': Name "Person" already used by Class "Person" (metamodel 'Families').`);
        expect(refusal!.errors?.[0].code).toBe('DUPLICATE_NAME');
    });

    it('ANOTHER package of the SAME metamodel: refused', () => {
        // `Person` lives in pkgA only; the create is asked for pkgB
        expect(pkgB.classes).toHaveLength(0);
        expect(pkgB.children).toHaveLength(0);
        const { refusal } = attemptCreate('class', 'Person', pkgB, 'Families');
        expect(refusal).not.toBeNull();
        expect(refusal!.message).toContain('already used by Class "Person"');
    });

    it('another METAMODEL: accepted', () => {
        expect(attemptCreate('class', 'Person', otherPkg, 'Library').refusal).toBeNull();
        // positive control: in ITS OWN metamodel that same name is refused
        expect(attemptCreate('class', 'Person', pkgA, 'Families').refusal).not.toBeNull();
    });

    it('a class and an enum share one namespace, as they do in `pkg.children`', () => {
        attach({ className: 'DEnumerator', id: 'eMood', name: 'Mood', literals: [] }, pkgA, 'enumerators');
        expect(attemptCreate('class', 'Mood', pkgA, 'Families').refusal).not.toBeNull();
        expect(attemptCreate('enum', 'Person', pkgA, 'Families').refusal).not.toBeNull();
    });
});

describe('two creates in a row — the same-tick half (D2)', () => {
    it('the first create is visible to the second while it is still PENDING', () => {
        // exactly the state `executeBlock` leaves behind: the dispatch is a macrotask away
        // (action.ts `setTimeout(…, 0)`), so `pkg.classes` is untouched and the element is in
        // `DPointerTargetable.pendingCreation` only.
        pending('DClass', 'cNew', 'Address', pkgA);
        expect(pkgA.classes.some((c: Any) => c.name === 'Address')).toBe(false);
        expect(attemptCreate('class', 'Address', pkgA, 'Families').refusal).not.toBeNull();
    });

    it('the first create is visible to the second once it is COMMITTED', () => {
        // the state ScriptBlock leaves behind: 20 ms of BATCH_DELAY_MS have elapsed, the
        // element has left the pending dictionary and entered the collection.
        attach(klass('cNew', 'Address'), pkgA, 'classes');
        expect(Object.keys(PENDING)).toHaveLength(0);
        expect(attemptCreate('class', 'Address', pkgA, 'Families').refusal).not.toBeNull();
    });

    it('a pending create in ANOTHER metamodel still does not collide', () => {
        pending('DClass', 'cNew', 'Address', otherPkg);
        expect(attemptCreate('class', 'Address', pkgA, 'Families').refusal).toBeNull();
        // positive control: in its own metamodel the same pending element refuses
        expect(attemptCreate('class', 'Address', otherPkg, 'Library').refusal).not.toBeNull();
    });
});

describe('the near-homonym is legal, and announced (R-M2U-1)', () => {
    it('`person` next to `Person` is accepted, with the verdict\'s warning', () => {
        const { verdict, refusal } = attemptCreate('class', 'person', pkgA, 'Families');
        expect(refusal).toBeNull();
        expect(verdict!.ok).toBe(true);
        expect(verdict!.warning).toBe('Name "person" differs only by case from "Person" in the same scope');
        expect(withNearHomonymWarning(undefined, verdict)).toEqual([verdict!.warning]);
    });

    it('the warning joins the warnings the create already carried, and never replaces them', () => {
        const { verdict } = attemptCreate('class', 'person', pkgA, 'Families');
        expect(withNearHomonymWarning(['something else'], verdict)).toEqual(['something else', verdict!.warning]);
    });

    it('a clean create is left exactly as it was — no empty array appears', () => {
        const { verdict } = attemptCreate('class', 'Address', pkgA, 'Families');
        expect(verdict!.warning).toBeUndefined();
        expect(withNearHomonymWarning(undefined, verdict)).toBeUndefined();
        const carried = ['kept'];
        expect(withNearHomonymWarning(carried, verdict)).toBe(carried);
    });

    it('a REFUSAL never announces a near-homonym: it already carries a reason', () => {
        const { verdict, refusal } = attemptCreate('class', 'Person', pkgA, 'Families');
        expect(refusal).not.toBeNull();
        expect(withNearHomonymWarning(undefined, verdict)).toBeUndefined();
    });

    it('and the `ok === false` guard holds on its own, not by luck of the rule', () => {
        // The rule never produces this shape — `UniquenessVerdict` documents `warning` as
        // "never present when ok is false", and `checkM2NameUniqueness` returns early on a
        // collision. So the test above cannot distinguish the guard from its absence: a
        // refused verdict has no warning to append either way. This one feeds the shape the
        // contract forbids, which is the only way the guard is measurable at all.
        expect(withNearHomonymWarning(undefined, { ok: false, reason: 'taken', warning: 'near' } as any))
            .toBeUndefined();
    });
});

describe('each of the nine keeps ITS OWN scope — the gate is not one flat pool', () => {
    // The risk this guards: if the gate computed a single metamodel-wide namespace for all
    // thirteen spellings, it would refuse an attribute that happens to share a class's name,
    // which is legal and common (`create attribute name in Person` next to a class `Name`).
    // The father travels with each call, so the scope travels with it.

    it('an attribute may carry the name of a CLASS of the same metamodel', () => {
        expect(pkgA.classes.some((c: Any) => c.name === 'Person')).toBe(true);
        expect(attemptCreate('attribute', 'Person', person, 'Families').refusal).toBeNull();
        expect(attemptCreate('reference', 'Person', person, 'Families').refusal).toBeNull();
        expect(attemptCreate('operation', 'Person', person, 'Families').refusal).toBeNull();
        // positive control: a CLASS by that name in that metamodel IS refused, so the name is
        // genuinely taken in the classifier pool and the acceptance above is about the scope.
        expect(attemptCreate('class', 'Person', pkgA, 'Families').refusal).not.toBeNull();
    });

    it('two classes in DIFFERENT packages collide; two attributes on different classes do not', () => {
        const other2 = attach(klass('cOrder', 'Order'), pkgB, 'classes');
        const code = { className: 'DAttribute', id: 'aCode', name: 'code', father: other2 };
        other2.ownAttributes.push(code); other2.allAttributes = [code];

        // classifier: the pool is the whole metamodel, so pkgB's `Order` blocks pkgA (R-M2U-2)
        expect(attemptCreate('class', 'Order', pkgA, 'Families').refusal).not.toBeNull();
        // feature: the pool is the OWNER, so `Order.code` does not block `Person.code`
        expect(attemptCreate('attribute', 'code', person, 'Families').refusal).toBeNull();
        // positive control: on its own owner, `code` is refused
        expect(attemptCreate('attribute', 'code', other2, 'Families').refusal).not.toBeNull();
    });

    it('a literal, a parameter and a class may all carry one name at once', () => {
        const mood = attach({ className: 'DEnumerator', id: 'eMood', name: 'Mood', literals: [], children: [] },
            pkgA, 'enumerators');
        const draw = { className: 'DOperation', id: 'oDraw', name: 'draw', father: person, children: [] as Any[] };
        expect(attemptCreate('literal', 'Person', mood, 'Families').refusal).toBeNull();
        expect(attemptCreate('parameter', 'Person', draw, 'Families').refusal).toBeNull();
        expect(attemptCreate('attribute', 'Person', person, 'Families').refusal).toBeNull();
        // and none of the three is blocked by the others: three scopes, one name
        expect(attemptCreate('literal', 'Mood', mood, 'Families').refusal).toBeNull();
    });

    it('a PACKAGE next to a homonymous class is still refused — committed behaviour, unchanged', () => {
        // `package` resolves over `father.children`, which holds subpackages, classes and
        // enumerators together. That is the scope the core rule has always compared against
        // (R-M2U leaves package/literal/parameter alone on purpose), so this refusal predates
        // L1 and must survive it.
        expect(attemptCreate('package', 'Person', pkgA, 'Families').refusal).not.toBeNull();
    });
});

describe('the other namespaces are gated too, each in its own scope', () => {
    it('a feature collides with an INHERITED one, and the reason names the superclass (R-M2U-4)', () => {
        const sup = attach(klass('cSup', 'Named'), pkgA, 'classes');
        const label = { className: 'DAttribute', id: 'aLabel', name: 'label', father: sup };
        sup.ownAttributes.push(label); sup.allAttributes = [label];
        const sub = attach(klass('cSub', 'Employee'), pkgA, 'classes');
        sub.allExtends = [sup]; sub.allAttributes = [label];

        const { refusal } = attemptCreate('attribute', 'label', sub, 'Families');
        expect(refusal).not.toBeNull();
        expect(refusal!.message).toContain('inherited from Class "Named"');
        // a reference and an operation share that namespace, so they collide with it too
        expect(attemptCreate('reference', 'label', sub, 'Families').refusal).not.toBeNull();
        expect(attemptCreate('containment', 'label', sub, 'Families').refusal).not.toBeNull();
        expect(attemptCreate('operation', 'label', sub, 'Families').refusal).not.toBeNull();
        // positive control: a free name on the same class passes
        expect(attemptCreate('attribute', 'salary', sub, 'Families').refusal).toBeNull();
    });

    it('a literal collides inside its enum, and not with a class of that name', () => {
        const mood = attach({ className: 'DEnumerator', id: 'eMood', name: 'Mood', literals: [], children: [] },
            pkgA, 'enumerators');
        const happy = { className: 'DEnumLiteral', id: 'lHappy', name: 'HAPPY', father: mood };
        mood.literals.push(happy); mood.children.push(happy);
        expect(attemptCreate('literal', 'HAPPY', mood, 'Families').refusal).not.toBeNull();
        expect(attemptCreate('literal', 'SAD', mood, 'Families').refusal).toBeNull();
    });

    it('a parameter collides inside its operation', () => {
        const draw = { className: 'DOperation', id: 'oDraw', name: 'draw', father: person, children: [] as Any[] };
        const p = { className: 'DParameter', id: 'pScale', name: 'scale', father: draw };
        draw.children.push(p);
        expect(attemptCreate('parameter', 'scale', draw, 'Families').refusal).not.toBeNull();
        expect(attemptCreate('parameter', 'offset', draw, 'Families').refusal).toBeNull();
    });

    it('a package collides among the father\'s children', () => {
        expect(attemptCreate('package', 'B', pkgA, 'Families').refusal).not.toBeNull();
        expect(attemptCreate('package', 'C', pkgA, 'Families').refusal).toBeNull();
    });
});

describe('what the user actually sees — through `errorFromResult`', () => {
    it('the refusal reaches the dialog as DUPLICATE_NAME, skippable, with its own sentence', () => {
        const { refusal } = attemptCreate('class', 'Person', pkgA, 'Families');
        const shown = errorFromResult(refusal!, "create class Person");
        expect(shown.code).toBe('DUPLICATE_NAME');
        expect(shown.skippable).toBe(true);
        expect(shown.message).toBe(refusal!.message);
        // no suggestion is set on the error, so the code table's own advice is what shows
        expect(shown.suggestion).toBe('Use a different name or delete the existing element first.');
    });
});

describe('the gate fails OPEN, never closed, on a state it cannot read', () => {
    it('no father: no namespace, no refusal — a create with no parent is the parent check\'s job', () => {
        expect(attemptCreate('class', 'Person', undefined, 'Families').refusal).toBeNull();
    });

    it('an unnamed create is not a name, and never collides', () => {
        // the auto-name path: `D*.new` computes the name from `defaultname`, which has its own
        // same-tick uniqueness (classes.ts). The verdict must not pre-empt it.
        expect(attemptCreate('class', undefined as any, pkgA, 'Families').refusal).toBeNull();
    });

    it('a wrong-KIND parent leaves the creator\'s own refusal to surface', () => {
        // `create attribute a in Mood`: the feature collections do not exist on an enum, so the
        // pool is empty and the verdict accepts — then `createAttribute`'s `isClass` guard
        // returns INVALID_PARENT_TYPE, exactly as before L1.
        const mood = attach({ className: 'DEnumerator', id: 'eMood', name: 'Mood', literals: [] }, pkgA, 'enumerators');
        expect(attemptCreate('attribute', 'anything', mood, 'Families').refusal).toBeNull();
    });

    it('without a metamodel name the sentence drops the clause instead of printing undefined', () => {
        const { refusal } = attemptCreate('class', 'Person', pkgA, undefined);
        expect(refusal!.message).toBe(`Cannot create class 'Person': Name "Person" already used by Class "Person".`);
        expect(refusal!.message).not.toContain('undefined');
    });
});
