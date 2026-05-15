/**
 * Edge-candidate heuristic — resolves the in-context classifier of an LViewElement
 * for the L2.x.1 banner.
 *
 * Pipeline:
 *   1. view.appliableToClasses (length === 1, classifier-id resolvable to LClass)
 *   2. view.oclCondition (regex match on `self.instanceof.id|name = '<value>'`)
 *   3. view.jsCondition (regex match on `data.instanceof.id|name == '<value>'`)
 *
 * Returns null at any step that does not yield a unique LClass with className 'DClass'.
 * See docs/discovery/discovery_2026-05-08_predicate_classifier_extraction.md.
 */

import {
    LClass,
    LModel,
    LPointerTargetable,
    LProject,
    LViewElement,
} from '../../../../joiner';

export interface EdgeCandidateResult {
    classifier: LClass;
    refNames: [string, string];
}

const PREDICATE_REGEX = /(?:self|data)\.instanceof\.(id|name)\s*={1,3}\s*['"]([^'"]+)['"]/g;
const OCL_COMMENT_REGEX = /--[^\n]*$/gm;

interface PredicateMatch {
    kind: 'id' | 'name';
    value: string;
}

function stripOclComments(predicate: string): string {
    return predicate.replace(OCL_COMMENT_REGEX, '');
}

function extractMatches(predicate: string): PredicateMatch[] {
    const result: PredicateMatch[] = [];
    const re = new RegExp(PREDICATE_REGEX.source, PREDICATE_REGEX.flags);
    let m: RegExpExecArray | null;
    while ((m = re.exec(predicate)) !== null) {
        result.push({ kind: m[1] as 'id' | 'name', value: m[2] });
    }
    return result;
}

function resolveClassifierById(id: string): LClass | null {
    const lCls = LPointerTargetable.fromPointer(id) as LClass | undefined;
    if (!lCls) return null;
    if ((lCls as any)?.className !== 'DClass') return null;
    return lCls;
}

function resolveClassifierByName(name: string, project: LProject): LClass | null {
    const mms: LModel[] = project.metamodels ?? [];
    for (const mm of mms) {
        const found = mm.getClassByName(name);
        if (found) return found;
    }
    return null;
}

function uniqueClassifierFromMatches(
    matches: PredicateMatch[],
    project: LProject
): LClass | null {
    if (matches.length === 0) return null;
    const ids = new Set<string>();
    let resolved: LClass | null = null;
    for (const { kind, value } of matches) {
        const lCls = kind === 'id'
            ? resolveClassifierById(value)
            : resolveClassifierByName(value, project);
        if (!lCls) continue;
        ids.add(lCls.id);
        resolved = lCls;
    }
    return ids.size === 1 ? resolved : null;
}

export function findClassifierFromView(
    view: LViewElement,
    project: LProject
): LClass | null {
    const apc = view.appliableToClasses ?? [];
    if (apc.length === 1) {
        const lCls = resolveClassifierById(apc[0]);
        if (lCls) return lCls;
    }
    if (apc.length > 0) return null;

    const ocl = stripOclComments(view.oclCondition || '');
    if (ocl.length > 0) {
        const lCls = uniqueClassifierFromMatches(extractMatches(ocl), project);
        if (lCls) return lCls;
    }

    const js = view.jsCondition || '';
    if (js.length > 0) {
        const lCls = uniqueClassifierFromMatches(extractMatches(js), project);
        if (lCls) return lCls;
    }

    return null;
}

export function findEdgeCandidate(
    view: LViewElement,
    project: LProject
): EdgeCandidateResult | null {
    const classifier = findClassifierFromView(view, project);
    if (!classifier) return null;
    const refs = classifier.references ?? [];
    if (refs.length !== 2) return null;
    return {
        classifier,
        refNames: [refs[0].name, refs[1].name],
    };
}
