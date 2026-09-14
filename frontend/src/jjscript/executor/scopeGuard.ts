/**
 * JjScript bound-scope guard
 *
 * A script run from a Jjodie reply carries the metamodel Jjodie showed the model when the
 * reply was asked for (`ExecutionContext.scopeBound`). The command handlers resolve a name in
 * the target metamodel first and project-wide second, so a bare name that the bound metamodel
 * does not hold, but another metamodel does, is written there without a word (V3 in
 * `docs/discovery/discovery_2026-09-14_jjodie_scope_fix_targets.md`). This check runs once per
 * command, before dispatch, over the names `extractDependencies` reports for it, and refuses
 * such a name instead.
 *
 * Pure on purpose: the metamodel and the project are arguments and the only runtime import is
 * the resolvers, so it runs under the bench's `environment: 'node'`, which the handlers do not.
 */

import type { LModel, LProject } from '../../joiner';
import type { QualifiedName } from '../types';
import type { ElementDependency } from './dependencies';
import { resolveTargetInMetamodel, elementKindLabel, ambiguityMessage, QUALIFY_ADVICE } from './resolvers';
import { qualifiedNameToString } from '../parser/grammar';

export interface ScopeRefusal {
    code: 'SCOPE_NOT_FOUND' | 'OUT_OF_SCOPE' | 'AMBIGUOUS_OUT_OF_SCOPE';
    message: string;
    suggestion?: string;
}

/**
 * The refusal for the first dependency that would leave the bound metamodel, or `null`.
 *
 * - A **qualified** name (`A::Person`) is never refused: naming the metamodel is the deliberate
 *   way across the scope, and the handlers resolve it there.
 * - A bare name no other metamodel holds is left to the handler, found or not.
 * - A bare name another metamodel holds is refused unless the bound metamodel answers it too:
 *   with the exact spelling, with an ambiguity or a missing member of its own (both settle the
 *   search inside the scope), or with a case-only match of a kind the other metamodel's match
 *   also has (the handler's scoped leg picks that one first).
 * - Held by one other metamodel: «not in B, qualify». Held by several: the A1 ambiguity message.
 *
 * `metamodel` null means the bound metamodel is gone from the project; every command is
 * refused then, including those with no dependency, because a creator with no `in` would
 * otherwise receive no parent at all.
 */
export function checkBoundScope(
    dependencies: ElementDependency[],
    metamodel: LModel | null | undefined,
    project: LProject | null | undefined
): ScopeRefusal | null {
    if (!metamodel) {
        const message = 'The metamodel this script was written for is no longer in the project.';
        return {
            code: 'SCOPE_NOT_FOUND',
            message,
            suggestion: 'Open the metamodel or model you want to change, then ask Jjodie again.'
        };
    }

    const scopeId = (metamodel as any).id;
    const others: LModel[] = (((project as any)?.metamodels ?? []) as LModel[])
        .filter((mm: any) => !!mm && mm.id !== scopeId);

    const seen = new Set<string>();
    for (const dep of dependencies) {
        const name = dep?.name;
        if (!name || !Array.isArray(name.segments) || name.segments.length !== 1) continue;

        const key = qualifiedNameToString(name);
        if (seen.has(key)) continue;
        seen.add(key);

        const refusal = checkName(name, metamodel, others);
        if (refusal) return refusal;
    }
    return null;
}

function checkName(name: QualifiedName, scope: LModel, others: LModel[]): ScopeRefusal | null {
    const elsewhere: Array<{ metamodel: any; element: any | null }> = [];
    for (const mm of others) {
        const r = resolveTargetInMetamodel(name, mm);
        if (r.element) elsewhere.push({ metamodel: mm, element: r.element });
        else if (r.ambiguousWith || r.memberMissingOn) elsewhere.push({ metamodel: mm, element: null });
    }
    if (elsewhere.length === 0) return null;

    const inScope = resolveTargetInMetamodel(name, scope);
    if (inScope.ambiguousWith || inScope.memberMissingOn) return null;
    if (inScope.element) {
        const asked = name.member ?? name.segments[0];
        if (inScope.element.name === asked) return null;
        const kind = elementKindLabel(inScope.element);
        if (elsewhere.some((e) => e.element && elementKindLabel(e.element) === kind)) return null;
    }

    const asked = qualifiedNameToString(name);
    const spellings = elsewhere.map((e) => `${e.metamodel?.name ?? ''}::${asked}`);
    if (spellings.length > 1) {
        return { code: 'AMBIGUOUS_OUT_OF_SCOPE', message: ambiguityMessage(asked, spellings), suggestion: QUALIFY_ADVICE };
    }
    const scopeName = (scope as any).name ?? '';
    return {
        code: 'OUT_OF_SCOPE',
        message: `'${asked}' is not in '${scopeName}'; qualify as ${spellings[0]} to target another metamodel.`,
        suggestion: QUALIFY_ADVICE
    };
}
