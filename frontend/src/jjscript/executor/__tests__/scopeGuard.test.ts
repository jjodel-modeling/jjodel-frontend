/**
 * JjScript bound-scope guard — a Jjodie reply writes into the scope it showed.
 *
 * Covers V3 of `docs/discovery/discovery_2026-09-14_jjodie_scope_fix_targets.md`: with `B`
 * bound and `Person` declared only in `A`, the handlers' scoped leg misses and their project
 * leg takes `A.Person` silently (probe P4 there). `checkBoundScope` runs before dispatch and
 * refuses such a name.
 *
 * Guard-level tests on purpose: the executor that calls it and the handlers behind it cannot be
 * imported under the repo's `environment: 'node'` config (they reach monaco through `joiner`).
 * The wiring in `executor.ts`, `JjScriptService.ts` and the Jjodie components is verified by hand.
 */

import { describe, it, expect } from 'vitest';
import { checkBoundScope } from '../scopeGuard';
import { ambiguityMessage, resolveTargetInProject } from '../resolvers';
import type { ElementDependency } from '../dependencies';
import type { QualifiedName } from '../../types';

// ─── fixtures ────────────────────────────────────────────────────────────────

const qn = (raw: string, member?: string): QualifiedName =>
    ({ segments: raw.split('::'), member, raw: member ? `${raw}.${member}` : raw });

const dep = (raw: string, role: ElementDependency['role'] = 'parent', member?: string): ElementDependency =>
    ({ name: qn(raw, member), role, required: true });

function metamodel(name: string, contents: { classes?: any[]; enumerators?: any[]; attributes?: any[]; operations?: any[] } = {}) {
    const mm: any = {
        name, id: `mm-${name.toLowerCase()}`, className: 'DModel', isMetamodel: true,
        packages: [], classes: [], attributes: [], references: [], operations: [],
        parameters: [], literals: [], enumerators: [],
    };
    for (const cls of contents.classes ?? []) { cls.model = mm; mm.classes.push(cls); }
    for (const en of contents.enumerators ?? []) { en.model = mm; mm.enumerators.push(en); }
    for (const at of contents.attributes ?? []) { at.model = mm; mm.attributes.push(at); }
    for (const op of contents.operations ?? []) { op.model = mm; mm.operations.push(op); }
    return mm;
}

const cls = (name: string, extra: any = {}) =>
    ({ name, className: 'DClass', id: `cls-${name}-${Math.random().toString(36).slice(2, 7)}`, attributes: [], references: [], operations: [], ...extra });

const project = (...metamodels: any[]) => ({ name: 'P', metamodels, models: [] } as any);

// ─── V3: the name lives only in another metamodel ────────────────────────────

describe('checkBoundScope — V3, a bare name held only by another metamodel', () => {
    it('is refused, naming the scope and the spelling that would resolve', () => {
        const A = metamodel('A', { classes: [cls('Person')] });
        const B = metamodel('B');
        const r = checkBoundScope([dep('Person')], B, project(A, B));
        expect(r?.code).toBe('OUT_OF_SCOPE');
        expect(r?.message).toBe("'Person' is not in 'B'; qualify as A::Person to target another metamodel.");
    });

    it('CONTROL: bound to the metamodel that holds it, the same name passes', () => {
        const A = metamodel('A', { classes: [cls('Person')] });
        const B = metamodel('B');
        expect(checkBoundScope([dep('Person')], A, project(A, B))).toBeNull();
    });

    it('the suggested spelling really resolves to the other metamodel', () => {
        const A = metamodel('A', { classes: [cls('Person')] });
        const B = metamodel('B');
        const p = project(A, B);
        const r = checkBoundScope([dep('Person')], B, p);
        const spelled = r!.message.match(/qualify as (\S+) to/)![1];
        expect(resolveTargetInProject(qn(spelled), p, ['class']).element?.model).toBe(A);
    });

    it('every role counts: a superclass, a type, a delete target', () => {
        const A = metamodel('A', { classes: [cls('Person')] });
        const B = metamodel('B');
        for (const role of ['superclass', 'type-reference', 'target', 'value-reference'] as const) {
            expect(checkBoundScope([dep('Person', role)], B, project(A, B))?.code).toBe('OUT_OF_SCOPE');
        }
    });

    it('a member form is checked on its container and spelled with the member', () => {
        const draw = { name: 'draw', className: 'DOperation', id: 'op-draw', parameters: [] };
        const A = metamodel('A', { classes: [cls('Shape', { operations: [draw] })] });
        const B = metamodel('B');
        const r = checkBoundScope([dep('Shape', 'parent', 'draw')], B, project(A, B));
        expect(r?.code).toBe('OUT_OF_SCOPE');
        expect(r?.message).toBe("'Shape.draw' is not in 'B'; qualify as A::Shape.draw to target another metamodel.");
    });

    it('the first offending dependency is the one reported', () => {
        const A = metamodel('A', { classes: [cls('Person'), cls('Named')] });
        const B = metamodel('B', { classes: [cls('Local')] });
        const r = checkBoundScope([dep('Local'), dep('Named', 'superclass'), dep('Person')], B, project(A, B));
        expect(r?.message).toContain("'Named'");
    });
});

// ─── plural elsewhere: the A1 message ────────────────────────────────────────

describe('checkBoundScope — held by several other metamodels', () => {
    it('raises the A1 ambiguity, spelled Metamodel::Name', () => {
        const A = metamodel('A', { classes: [cls('Person')] });
        const B = metamodel('B');
        const C = metamodel('C', { classes: [cls('Person')] });
        const r = checkBoundScope([dep('Person')], B, project(A, B, C));
        expect(r?.code).toBe('AMBIGUOUS_OUT_OF_SCOPE');
        expect(r?.message).toBe(ambiguityMessage('Person', ['A::Person', 'C::Person']));
    });
});

// ─── what is NOT refused ─────────────────────────────────────────────────────

describe('checkBoundScope — what passes', () => {
    it('a qualified name crosses the scope: the deliberate escape hatch', () => {
        const A = metamodel('A', { classes: [cls('Person')] });
        const B = metamodel('B');
        expect(checkBoundScope([dep('A::Person')], B, project(A, B))).toBeNull();
    });

    it('both metamodels declare it: the bound one answers, nothing to refuse', () => {
        const A = metamodel('A', { classes: [cls('Person')] });
        const B = metamodel('B', { classes: [cls('Person')] });
        expect(checkBoundScope([dep('Person')], B, project(A, B))).toBeNull();
    });

    it('a name nobody holds is left to the handler, which reports not-found', () => {
        const A = metamodel('A', { classes: [cls('Person')] });
        const B = metamodel('B');
        expect(checkBoundScope([dep('Nope')], B, project(A, B))).toBeNull();
    });

    it('a primitive spelled like a class (EString) lives in no metamodel and passes', () => {
        const A = metamodel('A', { classes: [cls('Person')] });
        const B = metamodel('B');
        expect(checkBoundScope([dep('EString', 'type-reference')], B, project(A, B))).toBeNull();
    });

    it('an exact spelling in scope passes even when the other metamodel has another kind', () => {
        // `type Mood` with the enum in B and a class Mood in A: the handler's scoped leg takes
        // B's enum, so refusing would be a false refusal.
        const A = metamodel('A', { classes: [cls('Mood')] });
        const B = metamodel('B', { enumerators: [{ name: 'Mood', className: 'DEnumerator', id: 'en-mood', literals: [] }] });
        expect(checkBoundScope([dep('Mood', 'type-reference')], B, project(A, B))).toBeNull();
    });

    it('a case-only match in scope of the same kind passes', () => {
        const A = metamodel('A', { classes: [cls('Person')] });
        const B = metamodel('B', { classes: [cls('person')] });
        expect(checkBoundScope([dep('Person')], B, project(A, B))).toBeNull();
    });

    it('no dependencies and the scope present: nothing to check', () => {
        const B = metamodel('B');
        expect(checkBoundScope([], B, project(B))).toBeNull();
    });
});

// ─── refusals that are not about a name ──────────────────────────────────────

describe('checkBoundScope — the scope itself', () => {
    it('a case-only match in scope of ANOTHER kind does not shelter the name', () => {
        // `LModel.attributes` is the flat pool, so an attribute `person` answers `Person` on the
        // scoped leg; the handler, restricted to classes, would still walk on to A's class.
        const A = metamodel('A', { classes: [cls('Person')] });
        const B = metamodel('B', { attributes: [{ name: 'person', className: 'DAttribute', id: 'at-person' }] });
        expect(checkBoundScope([dep('Person')], B, project(A, B))?.code).toBe('OUT_OF_SCOPE');
    });

    it('a bound metamodel gone from the project refuses every command, even with no dependency', () => {
        const A = metamodel('A', { classes: [cls('Person')] });
        const r = checkBoundScope([], null, project(A));
        expect(r?.code).toBe('SCOPE_NOT_FOUND');
    });
});
