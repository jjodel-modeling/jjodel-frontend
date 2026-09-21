/**
 * L2 — `create class A extends B` does what it says or nothing.
 *
 * What this bench executes: `superclassNames` (which field the clause really lives in),
 * `resolveSuperclasses` (the all-or-nothing decision, with the lookup injected),
 * `missingSuperclassRefusal` (the sentence and the code), and the real `errorFromResult`, so
 * the assertion about Skip Line is about what the dialog does and not about a flag.
 *
 * The injected resolver is not a shortcut around the subject: resolving a name means walking L
 * proxies, which cannot run under node, and it is not the half that carries the rule. The rule
 * is «every name, or none», and that is what runs here. The real lookup — scoped inside the
 * target metamodel first, project-wide second — is passed in by `create.ts` and is the same
 * expression the file used before this lane, moved and not rewritten.
 *
 * DECLARED GAP (CLAUDE.md §5): that `create.ts` calls this BEFORE `DClass.new` cannot be
 * executed here, because `create.ts` reaches the monaco barrel. The structure is what protects
 * it — nothing usable comes back from a failed resolution, so the call site has no id to write
 * — but «nothing was created» is confirmed on screen, not by a test.
 */
import { describe, it, expect } from 'vitest';

import { superclassNames, resolveSuperclasses, missingSuperclassRefusal } from '../superclassResolution';
import { errorFromResult } from '../errors';
import type { QualifiedName } from '../../types';

const qn = (...segments: string[]): QualifiedName => ({ segments, raw: segments.join('::') } as QualifiedName);

/** A metamodel as a name -> element table, which is all the resolver contract needs. */
const world = (names: string[]) => {
    const table = new Map(names.map(n => [n, { id: `c_${n}`, name: n }]));
    return (name: QualifiedName) => table.get(name.segments[name.segments.length - 1]) ?? null;
};

// ─────────────────────────────────────────────────────────────────────────────
describe('superclassNames — which field the clause really lives in', () => {
    it('reads the full list when the parser filled it', () => {
        expect(superclassNames({ superClasses: [qn('A'), qn('B')], superClass: qn('B') } as any)
            .map(n => n.segments[0])).toEqual(['A', 'B']);
    });

    it('honours `superClass` alone, for a caller that builds the args by hand', () => {
        expect(superclassNames({ superClass: qn('A') } as any).map(n => n.segments[0])).toEqual(['A']);
    });

    it('prefers the list over the single field — they describe ONE clause, not two', () => {
        // The parser pushes every name onto `superClasses` and leaves the LAST in `superClass`.
        // Reading them as disjoint (the old `superClass` + `superClasses` from index 1) agreed
        // with the parser by luck and with nothing else.
        const names = superclassNames({ superClasses: [qn('A'), qn('B'), qn('C')], superClass: qn('C') } as any);
        expect(names.map(n => n.segments[0])).toEqual(['A', 'B', 'C']);
        expect(names).toHaveLength(3);
    });

    it('no clause at all is an empty list, never a list holding undefined', () => {
        expect(superclassNames(undefined)).toEqual([]);
        expect(superclassNames({} as any)).toEqual([]);
        expect(superclassNames({ superClasses: [] } as any)).toEqual([]);
    });
});

describe('every name, or none', () => {
    it('all present: every one resolves, in the order written', () => {
        const r = resolveSuperclasses([qn('Named'), qn('Serializable')], 'Person', world(['Named', 'Serializable']));
        expect(r.ok).toBe(true);
        expect((r as any).resolved.map((e: any) => e.id)).toEqual(['c_Named', 'c_Serializable']);
    });

    it('a single missing superclass: nothing comes back to create with', () => {
        const r = resolveSuperclasses([qn('FunctionalUnit')], 'ALU', world([]));
        expect(r.ok).toBe(false);
        expect((r as any).resolved).toBeUndefined();
        expect((r as any).refusal.success).toBe(false);
    });

    it('ONE of several missing: still nothing, although two of three resolved', () => {
        const r = resolveSuperclasses([qn('Named'), qn('Ghost'), qn('Serializable')], 'Person',
            world(['Named', 'Serializable']));
        expect(r.ok).toBe(false);
        expect((r as any).resolved).toBeUndefined();
        // the refusal names the one that failed, not the ones that worked
        expect((r as any).refusal.message).toContain("'Ghost'");
        expect((r as any).refusal.message).not.toContain('Named');
    });

    it('the FIRST failure is reported: a refusal is not a report', () => {
        const r = resolveSuperclasses([qn('GhostA'), qn('GhostB')], 'Person', world([]));
        expect((r as any).refusal.message).toContain("'GhostA'");
        expect((r as any).refusal.message).not.toContain('GhostB');
    });

    it('stops at the first failure instead of looking the rest up', () => {
        const asked: string[] = [];
        resolveSuperclasses([qn('Ghost'), qn('Named')], 'Person', (n) => {
            asked.push(n.segments[0]);
            return n.segments[0] === 'Named' ? { id: 'c_Named' } : null;
        });
        expect(asked).toEqual(['Ghost']);
        // positive control: with the first one present, the walk does continue
        const asked2: string[] = [];
        resolveSuperclasses([qn('Named'), qn('Other')], 'Person', (n) => {
            asked2.push(n.segments[0]); return { id: 'x' };
        });
        expect(asked2).toEqual(['Named', 'Other']);
    });

    it('no clause: ok with nothing resolved — a plain `create class` is untouched', () => {
        const r = resolveSuperclasses([], 'Person', world([]));
        expect(r.ok).toBe(true);
        expect((r as any).resolved).toEqual([]);
    });

    it('a qualified name is reported the way it was written', () => {
        const r = resolveSuperclasses([qn('Other', 'Base')], 'ALU', world([]));
        expect((r as any).refusal.message).toContain("'Other::Base'");
    });

    it('a resolver that answers `undefined` is a failure, like one that answers null', () => {
        const r = resolveSuperclasses([qn('Ghost')], 'ALU', () => undefined);
        expect(r.ok).toBe(false);
    });
});

describe('what the user sees', () => {
    it('the sentence says the superclass, the class, and that nothing was created', () => {
        expect(missingSuperclassRefusal('ALU', 'FunctionalUnit').message).toBe(
            "Superclass 'FunctionalUnit' not found for class 'ALU': nothing was created. "
            + "Create 'FunctionalUnit' first, or qualify it as Metamodel::Name.");
    });

    it('reaches the dialog as PARENT_NOT_FOUND and skippable — Skip Line leaves a clean state', () => {
        const refusal = missingSuperclassRefusal('ALU', 'FunctionalUnit');
        const shown = errorFromResult(refusal, 'create class ALU extends FunctionalUnit');
        expect(shown.code).toBe('PARENT_NOT_FOUND');
        expect(shown.skippable).toBe(true);
        expect(shown.message).toBe(refusal.message);
    });

    it('does not inherit the PARENT_NOT_FOUND advice, which is wrong for this failure', () => {
        // The table entry says "Make sure the parent was created earlier in the script."
        // Since the waiter polls for the superclass (`dependencies.ts`), one created earlier IS
        // found, so that advice would tell the user to repeat what already worked.
        const shown = errorFromResult(
            missingSuperclassRefusal('ALU', 'FunctionalUnit'),
            'create class ALU extends FunctionalUnit');
        expect(shown.suggestion).toBe(
            'If the superclass is created earlier in this script, this is a timing issue: report it.');
        expect(shown.suggestion).not.toContain('created earlier in the script.');
    });

    it('agrees with the standalone `A extends B` command on the code', () => {
        // `commands/extends.ts` returns PARENT_NOT_FOUND for the same situation. The sentences
        // differ because the commands differ; what must agree is what happened.
        expect(missingSuperclassRefusal('ALU', 'FunctionalUnit').errors?.[0].code).toBe('PARENT_NOT_FOUND');
    });
});
