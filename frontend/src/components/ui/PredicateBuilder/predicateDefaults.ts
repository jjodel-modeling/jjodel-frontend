/**
 * predicateDefaults — pure, dependency-free helpers for the PredicateBuilder
 * control (authoring phase B2b-i).
 *
 * Mirrors the `forKind` factory pattern of FieldSegmentEditor: switching the
 * predicate kind replaces the whole node with a minimal valid Predicate of the
 * new kind (no partial merge). Kept React/redux/joiner-free so it lives in the
 * design-system layer and is unit-testable in the node vitest environment.
 *
 * Type-only dependency on the IR union (Predicate/Literal): these are pure data
 * shapes erased at compile time (irTypes.ts is a runtime-free module), so the
 * `import type` creates no runtime coupling to editor-v2.
 */
import type { Predicate, Literal, PathExpr } from '../../editor-v2/viewpoint/ir/irTypes';

/** The discriminant of Predicate — the 13 authorable predicate kinds. */
export type PredicateKind = Predicate['op'];

/** Readable labels for every predicate kind, in the order shown in the Select. */
export const PREDICATE_KIND_OPTIONS: { value: PredicateKind; label: string }[] = [
    { value: 'and', label: 'Tutte vere (AND)' },
    { value: 'or', label: 'Almeno una vera (OR)' },
    { value: 'not', label: 'Nega (NOT)' },
    { value: 'eq', label: '= uguale a' },
    { value: 'neq', label: '≠ diverso da' },
    { value: 'lt', label: '< minore di' },
    { value: 'lte', label: '≤ minore o uguale a' },
    { value: 'gt', label: '> maggiore di' },
    { value: 'gte', label: '≥ maggiore o uguale a' },
    { value: 'exists', label: 'Esiste (non vuoto)' },
    { value: 'empty', label: 'È vuoto' },
    { value: 'isKind', label: 'È di tipo…' },
    { value: 'literal', label: 'Sempre vero/falso' },
];

const COMPARATOR_KINDS: PredicateKind[] = ['eq', 'neq', 'lt', 'lte', 'gt', 'gte'];

/**
 * Produce a minimal valid Predicate for `kind` (mirror of FieldSegmentEditor's
 * `forKind`): a full replacement, not a partial merge of the previous node.
 * `classNames` (optional) seeds the `isKind` class with the first metaclass.
 */
export function forPredicateKind(kind: PredicateKind, classNames: string[] = []): Predicate {
    switch (kind) {
        case 'and':
        case 'or':
            return { op: kind, args: [] };
        case 'not':
            return { op: 'not', arg: { op: 'literal', value: true } };
        case 'exists':
        case 'empty':
            return { op: kind, path: '' };
        case 'isKind':
            return { op: 'isKind', class: classNames[0] ?? '' };
        case 'literal':
            return { op: 'literal', value: true };
        default:
            // The six comparators share the same operand shape.
            if (COMPARATOR_KINDS.includes(kind)) {
                return { op: kind, left: { kind: 'string', value: '' }, right: { kind: 'string', value: '' } };
            }
            // Unreachable for the closed union; keep the factory total.
            return { op: 'literal', value: true };
    }
}

/**
 * Discriminate a comparator operand: a Literal is an object carrying `kind`, a
 * PathExpr is a string. Mirror of irCompile.ts's (non-exported) `isLiteral`.
 */
export function isLiteralOperand(x: PathExpr | Literal): x is Literal {
    return typeof x === 'object' && x !== null && 'kind' in x;
}

const BOOLEAN_TYPE_NAMES = new Set<string>(['EBoolean', 'Boolean', 'boolean']);
const NUMBER_TYPE_NAMES = new Set<string>([
    // native jjodel ShortAttribETypes (U.tsx)
    'EByte', 'EShort', 'EInt', 'ELong', 'EFloat', 'EDouble',
    // Ecore std numeric datatypes reachable via import
    'EBigInteger', 'EBigDecimal',
    // bare / alias forms used in Ecore round-trip (EcoreService.ts)
    'Byte', 'Short', 'Int', 'Integer', 'int', 'Long', 'Float', 'Double',
    'byte', 'short', 'long', 'float', 'double',
]);

/**
 * Map a metamodel attribute type name to the literal editor kind
 * (see docs/discovery/discovery_2026-07-22_attribute_type_vocabulary.md).
 * The primitive vocabulary is closed (ShortAttribETypes) but user EEnum/
 * EDataType names are arbitrary, so anything unrecognized falls back to 'string'.
 */
export function attributeTypeToLiteralKind(type: string): 'boolean' | 'number' | 'string' {
    if (BOOLEAN_TYPE_NAMES.has(type)) return 'boolean';
    if (NUMBER_TYPE_NAMES.has(type)) return 'number';
    return 'string';
}
