/**
 * `create class A extends B` — settling every superclass BEFORE the class exists.
 *
 * What this replaces: `createClass` used to call `DClass.new` first and then look each
 * superclass up, dropping the ones it could not find WITHOUT A WORD. `create class ALU extends
 * FunctionalUnit` on a metamodel with no `FunctionalUnit` produced `ALU` with no
 * generalization and reported success, so the defect surfaced later, as a missing edge on a
 * canvas nobody was watching at the time.
 *
 * The rule now: a command either does what it says or nothing. If any named superclass does
 * not resolve, no class is created and the run pauses on a skippable error — Skip Line then
 * leaves a clean state instead of a class missing its inheritance. It is the same discipline
 * `createAttribute` and `createReference` already apply to their `type` clause, where the type
 * is settled before `.new()` so an unresolvable one leaves nothing behind
 * (`docs/discovery/discovery_2026-09-11_attribute_enum_type.md` §3).
 *
 * Why a module of its own: `create.ts` does not import under node (the `joiner` barrel pulls
 * monaco), so the all-or-nothing decision has to live where a bench can execute it. The
 * resolver is injected for the same reason — resolving a name means walking L proxies, which
 * is exactly the half that cannot run here, and it is not the half that carries the rule.
 */

import type { CreateArgs, ExecutionResult, QualifiedName } from '../types';
import { qualifiedNameToString } from '../parser/grammar';

/**
 * The superclasses a `create class` asks for, in the order they were written.
 *
 * The parser fills BOTH fields for the same clause — it pushes each name onto `superClasses`
 * and leaves the last one in `superClass` (`parser/parser.ts`) — so `superClasses` is the
 * complete list whenever it is present and `superClass` is a view of it, not an extra. The
 * code this replaces read them as if they were disjoint (`superClass` for the first, then
 * `superClasses` from index 1), which happened to agree with the parser and would not have
 * agreed with anything else.
 *
 * `superClass` alone is honoured for a caller that builds `CreateArgs` by hand.
 */
export function superclassNames(options: CreateArgs['options'] | undefined): QualifiedName[] {
    const many = options?.superClasses;
    if (many && many.length > 0) return many.filter(Boolean);
    return options?.superClass ? [options.superClass] : [];
}

/**
 * The refusal a missing superclass produces.
 *
 * `PARENT_NOT_FOUND` is the code the standalone `A extends B` command already returns for the
 * same situation (`commands/extends.ts`), so the two paths agree on what happened; it is in
 * `KNOWN_ERROR_CODES` and `skippable: true`, so Skip Line is offered. The sentence says
 * «nothing was created» because that is the part a user cannot otherwise tell: a failed create
 * that half-succeeded and a failed create that did nothing read the same in a run log.
 */
export function missingSuperclassRefusal(className: string | undefined, superclass: string): ExecutionResult {
    const message = `Superclass '${superclass}' not found for class '${className}': nothing was created. `
        + `Create '${superclass}' first, or qualify it as Metamodel::Name.`;
    return {
        success: false,
        command: 'create',
        message,
        errors: [{ code: 'PARENT_NOT_FOUND', message }],
    };
}

export type SuperclassResolution<T> =
    | { ok: true; resolved: T[] }
    | { ok: false; refusal: ExecutionResult };

/**
 * Resolve every name, or none.
 *
 * All-or-nothing is the point, and it is structural rather than a convention the caller must
 * remember: nothing usable comes back unless every name resolved, so a caller cannot create
 * the class and then discover the third superclass was missing. The FIRST failure is the one
 * reported — listing them all would turn a refusal into a report, the same choice
 * `checkM2NameUniqueness` makes when it names only the first near-homonym.
 *
 * `resolve` is the caller's scoped-then-project lookup, injected whole so this function has no
 * opinion about resolution order and cannot drift from the one the rest of `create.ts` uses.
 */
export function resolveSuperclasses<T>(
    names: QualifiedName[],
    className: string | undefined,
    resolve: (name: QualifiedName) => T | null | undefined
): SuperclassResolution<T> {
    const resolved: T[] = [];
    for (const name of names) {
        const found = resolve(name);
        if (!found) return { ok: false, refusal: missingSuperclassRefusal(className, qualifiedNameToString(name)) };
        resolved.push(found);
    }
    return { ok: true, resolved };
}
