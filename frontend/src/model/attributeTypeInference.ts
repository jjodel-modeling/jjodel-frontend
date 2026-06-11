/**
 * Name-based attribute type inference.
 *
 * Pure utility: given an attribute name, propose an initial Ecore primitive type
 * (a `ShortAttribETypes` value). Returns `null` when no rule matches, in which case
 * the caller keeps the current/default type (EString).
 *
 * The inferred type is only a DEFAULT. Callers apply it solely when the attribute's
 * type is still the untouched EString default; it must never override a type the user
 * (or an import) explicitly chose. See
 * `docs/discovery/2026-06-11_attr_type_inference_discovery.md`.
 *
 * Dependency-light by design (cf. `megamodelInference.ts`): the ONLY import is a
 * TYPE-ONLY reference to `ShortAttribETypes`. A value import of the enum transitively
 * loads the framework barrel (monaco etc.), which throws `window is not defined` under
 * the node-based vitest env and would break this module's unit test. The rule table
 * therefore uses the enum's string values directly (it is a string enum:
 * `ShortAttribETypes.EBoolean === 'EBoolean'`) and casts once, at the return boundary
 * (`string` → `ShortAttribETypes` is a legal assertion: the enum is a subtype of
 * string). The accompanying unit test pins each rule to its exact string value.
 */
import type { ShortAttribETypes } from '../joiner';

// Enum members referenced as their (string) runtime values. These MUST stay in sync
// with `ShortAttribETypes` (common/U.tsx); the unit test guards the exact strings.
const EBoolean = 'EBoolean';
const EDate = 'EDate';
const EDouble = 'EDouble';
const EInt = 'EInt';

/**
 * snake_case / kebab-case → camelCase. Names already in camelCase pass through
 * unchanged (`isActive` → `isActive`; `is_active` → `isActive`). Only characters that
 * follow a separator are upper-cased, so the first segment keeps its original case.
 */
function toCamelCase(name: string): string {
    return name.replace(/[_-]+([a-zA-Z0-9])/g, (_m, c: string) => c.toUpperCase());
}

type Rule = { test: (name: string) => boolean; type: string };

// Exact-name matches are case-insensitive (compared against the lower-cased name).
const EXACT_BOOLEAN = new Set([
    'enabled', 'active', 'visible', 'deleted', 'archived', 'valid', 'locked', 'done',
    'completed', 'default', 'readonly', 'mandatory', 'optional', 'abstract',
]);
const EXACT_DATE = new Set(['date', 'timestamp', 'birthday', 'deadline', 'expiry']);
const EXACT_DOUBLE = new Set([
    'price', 'cost', 'amount', 'weight', 'height', 'width', 'length', 'latitude',
    'longitude', 'temperature', 'salary', 'budget', 'score', 'average', 'balance',
    'percentage',
]);
const EXACT_INT = new Set([
    'age', 'year', 'month', 'day', 'count', 'quantity', 'level', 'rank', 'position',
    'order', 'priority', 'version', 'duration', 'seats', 'floor',
]);

/**
 * Ordered rules, first match wins. Semantic suffixes (date, money) are placed BEFORE
 * the quantifier prefixes (num/min/max), so `minDate` → EDate and `maxPrice` → EDouble.
 * Prefix rules require an uppercase boundary (`[A-Z]` after the prefix) so `isbn`,
 * `island`, `hash`, `cannon` fall through. Suffix rules match the capitalised suffix as
 * written (camelCase boundary), so `interactive` / `accelerate` do not match.
 */
const RULES: Rule[] = [
    // 1 — boolean prefixes (is/has/can/should/must/allow[s])
    { test: n => /^(is|has|can|should|must|allows?)[A-Z]/.test(n), type: EBoolean },
    // 2 — boolean suffixes
    { test: n => /(Enabled|Disabled|Active|Visible|Required)$/.test(n), type: EBoolean },
    // 3 — boolean exact names
    { test: n => EXACT_BOOLEAN.has(n.toLowerCase()), type: EBoolean },
    // 4 — date suffixes / exact names
    {
        test: n => /(Date|Time|Timestamp|At)$/.test(n) || EXACT_DATE.has(n.toLowerCase()),
        type: EDate,
    },
    // 5 — double (money / measure) suffixes / exact names
    {
        test: n =>
            /(Price|Cost|Amount|Rate|Ratio|Percentage|Percent)$/.test(n) ||
            EXACT_DOUBLE.has(n.toLowerCase()),
        type: EDouble,
    },
    // 6 — int (count / index) suffixes / prefixes / exact names
    {
        test: n =>
            /(Count|Index|Size|Quantity|Qty)$/.test(n) ||
            /^(num|min|max)[A-Z]/.test(n) ||
            EXACT_INT.has(n.toLowerCase()),
        type: EInt,
    },
];

/**
 * Infer a default Ecore primitive type from an attribute name.
 * @returns a `ShortAttribETypes` value, or `null` when no rule matches (keep EString).
 */
export function inferAttributeType(name: string): ShortAttribETypes | null {
    if (!name) return null;
    const trimmed = name.trim();
    if (!trimmed) return null;
    const camel = toCamelCase(trimmed);
    for (const rule of RULES) {
        if (rule.test(camel)) return rule.type as ShortAttribETypes;
    }
    return null;
}
