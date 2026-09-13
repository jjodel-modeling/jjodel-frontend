/**
 * JjScript Element Resolvers
 * Functions to resolve qualified names to actual model elements
 */

import { QualifiedName } from '../types';
import { qualifiedNameToString, matchQualifiedName, parseQualifiedName } from '../parser/grammar';
import { LProject, LModel } from '../../joiner';

// ============================================
// TARGET KINDS
// ============================================

/**
 * The element kinds a resolution target can be restricted to.
 *
 * Matched against the candidate's **D-layer** `className` ('DClass', 'DEnumerator', ...):
 * an L-proxy reports the D name, never the L name (CLAUDE.md §3.13), so a matcher written
 * against 'LClass' would silently never fire.
 */
export type ResolutionKind =
    | 'class' | 'enum' | 'literal' | 'attribute' | 'reference'
    | 'operation' | 'parameter' | 'package' | 'model';

/**
 * Same substring tests the command handlers already use for their own guards
 * (`isClass`/`isEnum`/`isOperation` in create.ts, `getItemType` in list.ts), kept in one
 * place so a resolution and the guard that follows it cannot disagree.
 */
const KIND_MATCHERS: { [K in ResolutionKind]: (className: string) => boolean } = {
    class:     (cn) => cn.includes('Class') && !cn.includes('DataType'),
    enum:      (cn) => cn.includes('Enum') && !cn.includes('Literal'),
    literal:   (cn) => cn.includes('Literal'),
    attribute: (cn) => cn.includes('Attribute'),
    reference: (cn) => cn.includes('Reference'),
    operation: (cn) => cn.includes('Operation'),
    parameter: (cn) => cn.includes('Parameter'),
    package:   (cn) => cn.includes('Package'),
    model:     (cn) => cn.includes('Model') && !cn.includes('ModelElement'),
};

const KIND_LABELS: { [K in ResolutionKind]: string } = {
    class: 'Class', enum: 'Enum', literal: 'Literal', attribute: 'Attribute',
    reference: 'Reference', operation: 'Operation', parameter: 'Parameter',
    package: 'Package', model: 'Model',
};

/**
 * Human-readable name of the expected kind, for error messages:
 * `['enum'] -> "Enum"`, `['package','model'] -> "Package or Model"`.
 * Falls back to a neutral word when the caller restricted nothing.
 */
export function kindLabel(kinds?: ResolutionKind[]): string {
    if (!kinds || kinds.length === 0) return 'Element';
    const names = kinds.map((k) => KIND_LABELS[k]).filter(Boolean);
    if (names.length === 0) return 'Element';
    if (names.length === 1) return names[0];
    return names.slice(0, -1).join(', ') + ' or ' + names[names.length - 1];
}

/**
 * The label of the kind an element already is, for messages that name the container a
 * member was looked for in.
 */
export function elementKindLabel(element: any): string {
    const className: string = element?.className || element?.constructor?.name || '';
    if (!className) return 'Element';
    for (const k of Object.keys(KIND_MATCHERS) as ResolutionKind[]) {
        if (KIND_MATCHERS[k](className)) return KIND_LABELS[k];
    }
    return 'Element';
}

/**
 * The kinds a `<command> <elementType> ... in <Target>` target may be, when the command
 * names the element type explicitly. Shared by delete and rename, which both fold their
 * `in` clause into a `Parent.member` qualified name and resolve it through `resolveElement`.
 */
export const TARGET_KINDS_BY_ELEMENT_TYPE: { [elementType: string]: ResolutionKind[] } = {
    'class':          ['class'],
    'abstract class': ['class'],
    'interface':      ['class'],
    'attribute':      ['attribute'],
    'reference':      ['reference'],
    'operation':      ['operation'],
    'parameter':      ['parameter'],
    'package':        ['package'],
    'enum':           ['enum'],
    'enumeration':    ['enum'],
    'literal':        ['literal'],
};

/** Anything that can hold other elements — the admissible kinds for a scope filter. */
export const CONTAINER_KINDS: ResolutionKind[] = ['package', 'model', 'class', 'enum'];

function matchesKind(element: any, kinds?: ResolutionKind[]): boolean {
    if (!kinds || kinds.length === 0) return true;
    const className: string = element?.className || element?.constructor?.name || '';
    if (!className) return false;
    return kinds.some((k) => KIND_MATCHERS[k]?.(className) === true);
}

/**
 * Outcome of a target resolution.
 *
 * `ambiguousWith` is set whenever more than one admissible element answered to the name —
 * exact-case homonyms across metamodels, or a case-insensitive plurality — for EVERY caller,
 * restricted on kinds or not. Picking one arbitrarily is what this module is being fixed for.
 * Entries are spelled `Metamodel::Name` so the user can retype one and have it resolve.
 */
export interface TargetResolution {
    /** The resolved element, or null when nothing admissible matched (ambiguity included). */
    element: any | null;
    /** The colliding spellings, when the fallback could not choose. */
    ambiguousWith?: string[];
    /**
     * Set when a container that *could* hold the member was selected and the member is not
     * on it. A settled answer, not a miss: the search stops instead of walking on to a
     * case-only sibling and acting on an element the caller never named.
     */
    memberMissingOn?: { parentName: string; parentKind: string; member: string };
}

const NOT_FOUND: TargetResolution = { element: null };

/**
 * Collections searched at each step of a path walk. The order used to decide which element
 * won a case-insensitive collision (an attribute named `mood` beat an enum named `Mood`
 * because 'attributes' comes five entries before 'enumerators'); it no longer does —
 * `selectTarget` now looks at every collection before choosing.
 */
const METAMODEL_COLLECTIONS = [
    'packages', 'subPackages', 'classifiers', 'classes',
    'attributes', 'references', 'operations', 'parameters',
    'literals', 'enumerators'
];

const PROJECT_COLLECTIONS = [
    'metamodels', 'models', 'packages', 'subPackages',
    'classifiers', 'classes', 'attributes', 'references',
    'operations', 'parameters', 'literals', 'enumerators'
];

/**
 * The collections `resolveMember` searches. An element that exposes one of them is the sort
 * of thing that can hold a member — whether or not it holds the one being asked for.
 */
const MEMBER_COLLECTIONS = ['attributes', 'references', 'operations', 'parameters', 'literals'];

function canHoldMembers(element: any): boolean {
    if (!element) return false;
    return MEMBER_COLLECTIONS.some((c) => Array.isArray(element[c]));
}

/** Every element of `current`'s collections whose name matches `segmentName` ignoring case. */
function collectByName(current: any, segmentName: string, collections: string[]): any[] {
    if (!current) return [];
    const lower = segmentName.toLowerCase();
    const out: any[] = [];
    for (const collName of collections) {
        const collection = current[collName];
        if (!Array.isArray(collection)) continue;
        for (const item of collection) {
            const name = item?.name;
            if (typeof name === 'string' && name.toLowerCase() === lower) out.push(item);
        }
    }
    return out;
}

/**
 * Choose one element out of the candidates that matched a name ignoring case.
 *
 * The rule, in order:
 *   1. an **exact-case** match among the admissible kinds wins;
 *   2. otherwise a case-insensitive match wins, but only if it is the only admissible one;
 *   2b. more than one admissible **exact-case** candidate is an ambiguity too: two
 *      metamodels may each declare `Person`, and `nameUniqueness.ts` (R-M2U-2) says that is
 *      legal, so the name alone cannot choose and nobody should choose for the user;
 *   3. more than one admissible case-insensitive candidate is an ambiguity, reported to
 *      the caller rather than resolved by insertion order;
 *   4. nothing admissible is a miss, and the caller moves on to its next strategy.
 *
 * Both ambiguity branches fire for **every** caller, restricted on kinds or not. Until now
 * only the restricted ones were told, and the nine that pass no `kinds` kept first-match —
 * the debt `7bacbd63c` declared. One rule, no opt-in.
 *
 * A qualified input never reaches either branch across metamodels: `A::Person` walks into
 * `A` first (`PROJECT_COLLECTIONS` starts at `'metamodels'`) and only A's elements are
 * candidates. That is why this depends on A3 — a qualifier is a key only if metamodel names
 * are unique.
 *
 * `member` is applied to each candidate before the kind test, so a candidate whose member
 * does not resolve can drop out and the next one be tried. That backtracking is what lets
 * `delete literal HAPPY in Mood` step past the attribute named `mood` to the enum `Mood`,
 * without a separate code path for the `Parent.member` form — but it is allowed **only past
 * a candidate that could never have held the member**. A candidate that could (it exposes
 * the collections `resolveMember` searches) is the answer, right or wrong: walking from it
 * onto a case-only sibling would act on an element the caller never named, which is a worse
 * failure than the one this module is being fixed for. Such a candidate settles the search
 * as `memberMissingOn`.
 */
/**
 * How a candidate is spelled in an ambiguity message: `Metamodel::Name`.
 *
 * Every spelling in that message has to be re-typeable and has to resolve, which is the
 * whole point of printing it. `::` is the qualifier (the `.` is member access — measured in
 * `docs/discovery/discovery_2026-09-11_name_resolution_scope.md` §5, P10).
 *
 * An element with no owning model is spelled **bare**. That is the m3 primitives: `EString`
 * lives in the store, not in a metamodel, and `get_model` returns null for it
 * (`model/logicWrapper/LModelElement.tsx`, "normal for primitive types in m3"). Inventing
 * `Ecore::EString` would print something that does not resolve. With `kinds` restricted to
 * classifiers a primitive should never be a candidate in the first place; the bare spelling
 * is what happens if one ever is, not a case being catered for.
 */
function qualifiedSpelling(element: any): string {
    const name: string = element?.name ?? '';
    let owner: string | undefined;
    try {
        const model = element?.model;
        const n = model?.name;
        if (typeof n === 'string' && n) owner = n;
    } catch { /* a proxy that cannot answer is spelled bare */ }
    return owner ? owner + '::' + name : name;
}

/** The one piece of advice every ambiguity message gives. Exported so the four commands
 *  cannot drift into saying different things about the same situation. */
export const QUALIFY_ADVICE = 'Qualify as Metamodel::Name.';

/** «Ambiguous 'Person': A::Person, B::Person. Qualify as Metamodel::Name.» */
export function ambiguityMessage(asked: string, ambiguousWith: string[]): string {
    return `Ambiguous '${asked}': ${ambiguousWith.join(', ')}. ${QUALIFY_ADVICE}`;
}

function selectTarget(
    candidates: any[],
    segmentName: string,
    member?: string,
    kinds?: ResolutionKind[]
): TargetResolution {
    const exact: any[] = [];
    const loose: Array<{ element: any; matchedName: string }> = [];
    // Candidates that can hold members but not the one asked for, kept apart so they can
    // stop the search instead of being backtracked past.
    const exactHolders: any[] = [];
    const looseHolders: Array<{ element: any; matchedName: string }> = [];
    const seen = new Set<any>();
    const lower = segmentName.toLowerCase();

    for (const candidate of candidates) {
        const matchedName = candidate?.name;
        if (typeof matchedName !== 'string') continue;

        const isExact = matchedName === segmentName;
        if (!isExact && matchedName.toLowerCase() !== lower) continue;

        const element = member ? resolveMember(candidate, member) : candidate;

        if (!element || !matchesKind(element, kinds)) {
            // Nothing usable on this candidate. Record it only if it was a plausible
            // holder; otherwise let the loop move on, which is the legitimate backtrack.
            if (member && canHoldMembers(candidate)) {
                if (isExact) exactHolders.push(candidate);
                else looseHolders.push({ element: candidate, matchedName });
            }
            continue;
        }

        // The same element shows up in more than one collection ('classifiers' and
        // 'classes' overlap); count it once.
        const key = element.id ?? element;
        if (seen.has(key)) continue;
        seen.add(key);

        if (isExact) exact.push(element);
        else loose.push({ element, matchedName });
    }

    if (exact.length === 1) return { element: exact[0] };
    if (exact.length > 1) return { element: null, ambiguousWith: exact.map(qualifiedSpelling) };

    // An exact-case container of the right sort outranks every case-insensitive sibling,
    // even when the member is missing on it. Unchanged by A1: `12a318b3a`'s rule is about
    // where the search STOPS, not about how many candidates share a spelling.
    if (member && exactHolders.length === 1) return missingMember(exactHolders[0], member);
    if (member && exactHolders.length > 1) {
        return { element: null, ambiguousWith: exactHolders.map(qualifiedSpelling) };
    }

    if (loose.length === 1) return { element: loose[0].element };
    if (loose.length > 1) return { element: null, ambiguousWith: loose.map((l) => qualifiedSpelling(l.element)) };

    if (member && looseHolders.length === 1) return missingMember(looseHolders[0].element, member);
    if (member && looseHolders.length > 1) {
        return { element: null, ambiguousWith: looseHolders.map((l) => qualifiedSpelling(l.element)) };
    }

    return NOT_FOUND;
}

/**
 * «Literal 'FOO' not found in Enum 'Mood'» — the message every command builds from a
 * settled `memberMissingOn`, kept in one place so the four call sites cannot drift.
 */
export function memberMissingMessage(
    missing: NonNullable<TargetResolution['memberMissingOn']>,
    memberKind: string
): string {
    return `${memberKind} '${missing.member}' not found in ${missing.parentKind} '${missing.parentName}'`;
}

function missingMember(parent: any, member: string): TargetResolution {
    return {
        element: null,
        memberMissingOn: {
            parentName: parent?.name ?? '',
            parentKind: elementKindLabel(parent),
            member,
        },
    };
}

/** True when a resolution is settled: either it found something, or it found too much. */
function isConclusive(r: TargetResolution): boolean {
    return !!r.element || !!r.ambiguousWith || !!r.memberMissingOn;
}

// ============================================
// METAMODEL-SCOPED RESOLVER (PREFERRED)
// ============================================

/**
 * Resolve a qualified name to a model element WITHIN a specific metamodel.
 * This is the preferred function when you know the target metamodel,
 * as it prevents ambiguity when the same name exists in multiple metamodels.
 *
 * @param target - The qualified name to resolve
 * @param metamodel - The metamodel to search within
 * @param kinds - Optional restriction to the element kinds the caller can accept.
 *   Omitting it searches every kind, which is what every pre-existing call site does.
 * @returns The resolved element or null
 */
export function resolveElementInMetamodel(
    target: QualifiedName, metamodel: LModel, kinds?: ResolutionKind[]
): any {
    return resolveTargetInMetamodel(target, metamodel, kinds).element;
}

/**
 * The same resolution as `resolveElementInMetamodel`, reporting *why* it found nothing.
 * Callers that want to tell the user «ambiguous» apart from «not found» use this one.
 */
export function resolveTargetInMetamodel(
    target: QualifiedName, metamodel: LModel, kinds?: ResolutionKind[]
): TargetResolution {
    if (!target || !metamodel) return NOT_FOUND;

    const segments = target.segments;
    if (segments.length === 0) return NOT_FOUND;

    // Strategy 1: Direct path resolution within metamodel
    let result = resolveByPathInMetamodel(segments, metamodel, target.member, kinds);
    if (isConclusive(result)) return result;

    // Strategy 2: Name-only resolution within metamodel
    if (segments.length === 1) {
        result = resolveByNameInMetamodel(segments[0], metamodel, target.member, kinds);
        if (isConclusive(result)) return result;
    }

    return NOT_FOUND;
}

/**
 * Find a class by name ONLY within a specific metamodel.
 * This prevents the bug where elements are added to wrong classes
 * when the same class name exists in multiple metamodels.
 *
 * @param className - The class name to find
 * @param metamodel - The metamodel to search within
 * @returns The class element or null
 */
export function findClassInMetamodel(className: string, metamodel: LModel): any {
    if (!className || !metamodel) return null;

    const nameLower = className.toLowerCase();

    // Search in classes collection
    const classes = metamodel.classes || [];
    for (const cls of classes) {
        if (cls?.name?.toLowerCase() === nameLower) {
            return cls;
        }
    }

    // Also search in packages
    const packages = metamodel.packages || [];
    for (const pkg of packages) {
        const result = findClassInPackage(className, pkg);
        if (result) return result;
    }

    return null;
}

/**
 * Find a class within a package and its subpackages
 */
function findClassInPackage(className: string, pkg: any): any {
    if (!pkg) return null;

    const nameLower = className.toLowerCase();

    // Search in package's classes
    const classifiers = pkg.classifiers || [];
    for (const cls of classifiers) {
        if (cls?.name?.toLowerCase() === nameLower) {
            return cls;
        }
    }

    // Search in subpackages
    const subPackages = pkg.subPackages || [];
    for (const subPkg of subPackages) {
        const result = findClassInPackage(className, subPkg);
        if (result) return result;
    }

    return null;
}

/**
 * Resolve by path within a specific metamodel.
 *
 * Intermediate segments keep the historical walk: first collection that holds a name
 * match wins, since they are containers and the kind restriction does not describe them.
 * The **last** segment is the target, so every collection is consulted before choosing
 * (see `selectTarget`).
 */
function resolveByPathInMetamodel(
    segments: string[], metamodel: LModel, member?: string, kinds?: ResolutionKind[]
): TargetResolution {
    if (segments.length === 0) return NOT_FOUND;

    let current: any = metamodel;

    for (let i = 0; i < segments.length; i++) {
        const segmentName = segments[i];
        const isLast = i === segments.length - 1;
        const matches = collectByName(current, segmentName, METAMODEL_COLLECTIONS);

        if (isLast) {
            const picked = selectTarget(matches, segmentName, member, kinds);
            if (isConclusive(picked)) return picked;

            // Also check direct name match — `current` itself may be the target.
            if (current?.name?.toLowerCase() === segmentName.toLowerCase()) {
                return selectTarget([current], segmentName, member, kinds);
            }
            return NOT_FOUND;
        }

        if (matches.length > 0) { current = matches[0]; continue; }

        // Also check direct name match: stay on `current` for this segment.
        if (current?.name?.toLowerCase() === segmentName.toLowerCase()) continue;

        return NOT_FOUND;
    }

    return NOT_FOUND;
}

/**
 * Resolve by name within a specific metamodel only
 */
function resolveByNameInMetamodel(
    name: string, metamodel: LModel, member?: string, kinds?: ResolutionKind[]
): TargetResolution {
    const nameLower = name.toLowerCase();
    const results: any[] = [];

    function search(item: any): void {
        if (!item) return;

        // Check current item
        if (item.name?.toLowerCase() === nameLower) {
            results.push(item);
        }

        // Search in collections (no metamodels/models - stay within this metamodel)
        for (const collName of METAMODEL_COLLECTIONS) {
            const collection = item[collName];
            if (Array.isArray(collection)) {
                for (const child of collection) {
                    search(child);
                }
            }
        }
    }

    search(metamodel);

    return selectTarget(results, name, member, kinds);
}

/**
 * Get a metamodel by ID from a project
 */
export function getMetamodelById(project: LProject, metamodelId: string): LModel | null {
    if (!project || !metamodelId) return null;

    const metamodels = project.metamodels || [];
    return metamodels.find((mm: LModel) => mm.id === metamodelId) || null;
}

// ============================================
// MAIN RESOLVER (searches entire project)
// ============================================

/**
 * Resolve a qualified name to a model element.
 *
 * WARNING: This function searches across ALL metamodels in the project.
 * If there are duplicate names across metamodels, it may return the wrong element.
 * Prefer using resolveElementInMetamodel() when you know the target metamodel.
 */
export function resolveElement(
    target: QualifiedName, project: LProject, kinds?: ResolutionKind[]
): any {
    return resolveTargetInProject(target, project, kinds).element;
}

/**
 * The same resolution as `resolveElement`, reporting *why* it found nothing.
 * Callers that want to tell the user «ambiguous» apart from «not found» use this one.
 */
export function resolveTargetInProject(
    target: QualifiedName, project: LProject, kinds?: ResolutionKind[]
): TargetResolution {
    if (!target || !project) return NOT_FOUND;

    const segments = target.segments;
    if (segments.length === 0) return NOT_FOUND;

    // Try multiple resolution strategies

    // Strategy 1: Direct path resolution (Package::Class::Member)
    let result = resolveByPath(segments, project, target.member, kinds);
    if (isConclusive(result)) return result;

    // Strategy 2: Name-only resolution (search all elements)
    if (segments.length === 1) {
        result = resolveByName(segments[0], project, target.member, kinds);
        if (isConclusive(result)) return result;
    }

    // Strategy 3: Partial path match
    result = resolvePartialPath(segments, project, target.member, kinds);
    if (isConclusive(result)) return result;

    return NOT_FOUND;
}

/**
 * Resolve parent context for element creation
 */
export function resolveParent(parent: QualifiedName | undefined, project: LProject, elementType: string): any {
    if (!parent) {
        return getDefaultParent(project, elementType);
    }
    return resolveElement(parent, project);
}

// ============================================
// RESOLUTION STRATEGIES
// ============================================

/**
 * Resolve by full path (Package::SubPackage::Element).
 *
 * Same shape as `resolveByPathInMetamodel`: intermediate segments are containers and keep
 * the first-match walk, the last segment is the target and goes through `selectTarget`.
 */
function resolveByPath(
    segments: string[], project: LProject, member?: string, kinds?: ResolutionKind[]
): TargetResolution {
    if (segments.length === 0) return NOT_FOUND;

    // Start from project
    let current: any = project;

    for (let i = 0; i < segments.length; i++) {
        const segmentName = segments[i];
        const isLast = i === segments.length - 1;
        const matches = collectByName(current, segmentName, PROJECT_COLLECTIONS);

        if (isLast) {
            const picked = selectTarget(matches, segmentName, member, kinds);
            if (isConclusive(picked)) return picked;

            // Also check direct name match — `current` itself may be the target.
            if (current?.name?.toLowerCase() === segmentName.toLowerCase()) {
                return selectTarget([current], segmentName, member, kinds);
            }
            return NOT_FOUND;
        }

        if (matches.length > 0) { current = matches[0]; continue; }

        // Also check direct name match: stay on `current` for this segment.
        if (current?.name?.toLowerCase() === segmentName.toLowerCase()) continue;

        return NOT_FOUND;
    }

    return NOT_FOUND;
}

/**
 * Resolve by name only (search all elements in project)
 */
function resolveByName(
    name: string, project: LProject, member?: string, kinds?: ResolutionKind[]
): TargetResolution {
    const nameLower = name.toLowerCase();
    const results: any[] = [];

    function search(item: any): void {
        if (!item) return;

        // Check current item
        if (item.name?.toLowerCase() === nameLower) {
            results.push(item);
        }

        // Search in collections
        for (const collName of PROJECT_COLLECTIONS) {
            const collection = item[collName];
            if (Array.isArray(collection)) {
                for (const child of collection) {
                    search(child);
                }
            }
        }
    }

    search(project);

    return selectTarget(results, name, member, kinds);
}

/**
 * Resolve partial path (try to match suffix)
 */
function resolvePartialPath(
    segments: string[], project: LProject, member?: string, kinds?: ResolutionKind[]
): TargetResolution {
    // Try matching from the last segment backwards
    const results: any[] = [];
    const lastSegmentRaw = segments[segments.length - 1];

    function search(item: any, depth: number = 0): void {
        if (!item) return;

        // Check if this item matches the last segment
        const lastSegment = lastSegmentRaw.toLowerCase();
        if (item.name?.toLowerCase() === lastSegment) {
            // Verify the path matches
            if (verifyPath(item, segments)) {
                results.push(item);
            }
        }

        // Search in collections
        for (const collName of PROJECT_COLLECTIONS) {
            const collection = item[collName];
            if (Array.isArray(collection)) {
                for (const child of collection) {
                    search(child, depth + 1);
                }
            }
        }
    }

    search(project);
    return selectTarget(results, lastSegmentRaw, member, kinds);
}

/**
 * Verify that an element's ancestry matches the path segments
 */
function verifyPath(element: any, segments: string[]): boolean {
    if (segments.length <= 1) return true;

    let current = element;
    for (let i = segments.length - 1; i >= 0; i--) {
        if (!current) return false;
        if (current.name?.toLowerCase() !== segments[i].toLowerCase()) {
            // Allow skipping levels
            continue;
        }
        current = current.parent;
    }

    return true;
}

/**
 * Resolve a member (attribute, reference, operation) of an element
 */
function resolveMember(element: any, memberName: string): any {
    if (!element || !memberName) return element;

    const memberLower = memberName.toLowerCase();

    // Search in structural features
    const collections = ['attributes', 'references', 'operations', 'parameters', 'literals'];

    for (const collName of collections) {
        const collection = element[collName];
        if (Array.isArray(collection)) {
            const match = collection.find((item: any) =>
                item?.name?.toLowerCase() === memberLower
            );
            if (match) {
                return match;
            }
        }
    }

    // Check if it's a property
    if (memberName in element) {
        return element[memberName];
    }

    return null;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get default parent for new element based on type
 */
function getDefaultParent(project: LProject, elementType: string): any {
    const metamodels = project.metamodels || [];

    // For classes, enums, packages: use first metamodel's root package
    if (['class', 'abstract class', 'interface', 'enum', 'enumeration', 'package'].includes(elementType)) {
        if (metamodels.length > 0) {
            const mm = metamodels[0];
            const packages = mm.packages || [];
            if (packages.length > 0) {
                return packages[0];
            }
            return mm;
        }
    }

    return null;
}

/**
 * Find all elements matching a pattern
 */
export function findElements(pattern: string, project: LProject, elementType?: string): any[] {
    const results: any[] = [];
    const qn = parseQualifiedName(pattern);

    function search(item: any): void {
        if (!item) return;

        // Check if matches
        const itemQN: QualifiedName = {
            segments: [item.name || ''],
            raw: item.name || ''
        };

        if (matchQualifiedName(qn, itemQN)) {
            // Check type filter
            if (!elementType || matchesType(item, elementType)) {
                results.push(item);
            }
        }

        // Search in collections
        const collections = [
            'metamodels', 'models', 'packages', 'subPackages',
            'classifiers', 'classes', 'attributes', 'references',
            'operations', 'parameters', 'literals', 'enumerators'
        ];

        for (const collName of collections) {
            const collection = item[collName];
            if (Array.isArray(collection)) {
                for (const child of collection) {
                    search(child);
                }
            }
        }
    }

    search(project);
    return results;
}

/**
 * Check if element matches a type
 */
function matchesType(element: any, type: string): boolean {
    const className = element.className || element.constructor?.name || '';
    const typeLower = type.toLowerCase();

    if (typeLower === 'class' && className.includes('Class')) return true;
    if (typeLower === 'attribute' && className.includes('Attribute')) return true;
    if (typeLower === 'reference' && className.includes('Reference')) return true;
    if (typeLower === 'operation' && className.includes('Operation')) return true;
    if (typeLower === 'package' && className.includes('Package')) return true;
    if ((typeLower === 'enum' || typeLower === 'enumeration') && className.includes('Enum')) return true;
    if (typeLower === 'literal' && className.includes('Literal')) return true;
    if (typeLower === 'parameter' && className.includes('Parameter')) return true;

    return false;
}

/**
 * Get the full path of an element
 */
export function getElementPath(element: any): string {
    const segments: string[] = [];
    let current = element;

    while (current) {
        if (current.name) {
            segments.unshift(current.name);
        }
        current = current.parent;
    }

    return segments.join('::');
}

/**
 * Check if one element is an ancestor of another
 */
export function isAncestor(ancestor: any, descendant: any): boolean {
    let current = descendant;
    while (current) {
        if (current.id === ancestor.id) {
            return true;
        }
        current = current.parent;
    }
    return false;
}

/**
 * The enumerator a `type <Name>` clause names, for an attribute.
 *
 * The kind restriction is the whole point: without `['enum']` a class called `Mood`
 * would answer for `type Mood` and the attribute would be typed with a class. Measured
 * in `docs/discovery/discovery_2026-09-11_attribute_enum_type.md` §5 (R1/R2).
 *
 * Metamodel first, project second — the same order `createReference` already uses
 * (`commands/create.ts`), so a name is read in the artefact being edited before the rest
 * of the project is consulted. Both legs are kind-restricted, so the project leg cannot
 * reach for an attribute or a class the way the unrestricted resolvers still do.
 *
 * Returns the full `TargetResolution`, never the bare element: the caller has to tell
 * «no such enum» from «ambiguous», and those two are the SAME `element: null` on the
 * `resolveElement*` shorthands. `ambiguousWith` is the discriminator.
 *
 * `Metamodel::Name` needs nothing special here — `PROJECT_COLLECTIONS` starts at
 * `'metamodels'`, so the qualified walk already resolves (same referto, R3).
 */
export function resolveEnumTypeTarget(
    name: QualifiedName,
    metamodel: LModel | null | undefined,
    project: LProject | null | undefined
): TargetResolution {
    const kinds: ResolutionKind[] = ['enum'];

    if (metamodel) {
        const scoped = resolveTargetInMetamodel(name, metamodel, kinds);
        if (isConclusive(scoped)) return scoped;
    }
    if (project) return resolveTargetInProject(name, project, kinds);

    return NOT_FOUND;
}
