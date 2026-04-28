/**
 * JjEL Built-in Method Metadata
 *
 * Static metadata describing the built-in methods available in JjEL expressions,
 * grouped by receiver type (string, collection, number, date).
 *
 * The list is filtered to only include methods that are actually implemented in
 * `frontend/src/jjel/evaluator/builtins/`. Promising a method that the evaluator
 * does not handle would be misleading; if a spec method is missing here, it is
 * either not yet implemented or has been removed.
 *
 * Source: JjTL & JjEL Language Design and Comparative Analysis, Appendices A.1
 * (String, 36) and A.2 (Collection, 31). Number and Date sets cross-checked
 * against the evaluator implementation.
 *
 * Used by the JjEL autocomplete method provider.
 */

export type BuiltinCategory = 'string' | 'collection' | 'number' | 'date';

export interface BuiltinMethod {
    /** Method name as written by the user (e.g. 'snakeCase'). */
    name: string;
    /** Receiver type — drives the badge in the dropdown and future type filtering. */
    category: BuiltinCategory;
    /** Display signature, e.g. '() -> String' or '(predicate: x => Boolean) -> [T]'. */
    signature: string;
    /** Short human-readable description (one short line). */
    description: string;
}

// ============================================
// STRING METHODS (36 — Appendix A.1)
// ============================================

export const STRING_METHODS: BuiltinMethod[] = [
    { name: 'toUpper',      category: 'string', signature: '() -> String',                    description: 'Convert to uppercase' },
    { name: 'toLower',      category: 'string', signature: '() -> String',                    description: 'Convert to lowercase' },
    { name: 'capitalize',   category: 'string', signature: '() -> String',                    description: 'Capitalize first letter' },
    { name: 'uncapitalize', category: 'string', signature: '() -> String',                    description: 'Lowercase first letter' },
    { name: 'camelCase',    category: 'string', signature: '() -> String',                    description: 'Convert to camelCase' },
    { name: 'pascalCase',   category: 'string', signature: '() -> String',                    description: 'Convert to PascalCase' },
    { name: 'snakeCase',    category: 'string', signature: '() -> String',                    description: 'Convert to snake_case' },
    { name: 'kebabCase',    category: 'string', signature: '() -> String',                    description: 'Convert to kebab-case' },
    { name: 'trim',         category: 'string', signature: '() -> String',                    description: 'Remove leading/trailing whitespace' },
    { name: 'trimStart',    category: 'string', signature: '() -> String',                    description: 'Remove leading whitespace' },
    { name: 'trimEnd',      category: 'string', signature: '() -> String',                    description: 'Remove trailing whitespace' },
    { name: 'padStart',     category: 'string', signature: '(length: Integer, char?: String) -> String', description: 'Pad start to target length' },
    { name: 'padEnd',       category: 'string', signature: '(length: Integer, char?: String) -> String', description: 'Pad end to target length' },
    { name: 'repeat',       category: 'string', signature: '(count: Integer) -> String',      description: 'Repeat string n times' },
    { name: 'replace',      category: 'string', signature: '(search: String, replacement: String) -> String', description: 'Replace first occurrence' },
    { name: 'replaceAll',   category: 'string', signature: '(search: String, replacement: String) -> String', description: 'Replace all occurrences' },
    { name: 'substring',    category: 'string', signature: '(start: Integer, end?: Integer) -> String', description: 'Extract substring' },
    { name: 'slice',        category: 'string', signature: '(start: Integer, end?: Integer) -> String', description: 'Extract slice' },
    { name: 'split',        category: 'string', signature: '(separator: String) -> [String]', description: 'Split string into array' },
    { name: 'startsWith',   category: 'string', signature: '(prefix: String) -> Boolean',     description: 'Check if string starts with prefix' },
    { name: 'endsWith',     category: 'string', signature: '(suffix: String) -> Boolean',     description: 'Check if string ends with suffix' },
    { name: 'contains',     category: 'string', signature: '(substring: String) -> Boolean',  description: 'Check if string contains substring' },
    { name: 'indexOf',      category: 'string', signature: '(search: String) -> Integer',     description: 'Find index of substring' },
    { name: 'lastIndexOf',  category: 'string', signature: '(search: String) -> Integer',     description: 'Find last index of substring' },
    { name: 'charAt',       category: 'string', signature: '(index: Integer) -> String',      description: 'Get character at index' },
    { name: 'length',       category: 'string', signature: '() -> Integer',                   description: 'Get string length' },
    { name: 'isEmpty',      category: 'string', signature: '() -> Boolean',                   description: 'Check if string is empty' },
    { name: 'isNotEmpty',   category: 'string', signature: '() -> Boolean',                   description: 'Check if string is not empty' },
    { name: 'isBlank',      category: 'string', signature: '() -> Boolean',                   description: 'Check if blank (empty or whitespace)' },
    { name: 'isNotBlank',   category: 'string', signature: '() -> Boolean',                   description: 'Check if not blank' },
    { name: 'matches',      category: 'string', signature: '(pattern: String) -> Boolean',    description: 'Test against regex pattern' },
    { name: 'reverse',      category: 'string', signature: '() -> String',                    description: 'Reverse string' },
    { name: 'toNumber',     category: 'string', signature: '() -> Number',                    description: 'Parse to number (or null)' },
    { name: 'toInt',        category: 'string', signature: '() -> Integer',                   description: 'Parse to integer (or null)' },
    { name: 'quote',        category: 'string', signature: '() -> String',                    description: 'Wrap string in quotes' },
    { name: 'format',       category: 'string', signature: '(...args: Any) -> String',        description: 'Simple {0}-style format' },
];

// ============================================
// COLLECTION METHODS (31 — Appendix A.2)
// ============================================

export const COLLECTION_METHODS: BuiltinMethod[] = [
    { name: 'filter',           category: 'collection', signature: '(p: x => Boolean) -> [T]',          description: 'Filter elements matching predicate' },
    { name: 'map',              category: 'collection', signature: '(f: x => U) -> [U]',                description: 'Transform each element' },
    { name: 'flatMap',          category: 'collection', signature: '(f: x => [U]) -> [U]',              description: 'Map and flatten one level' },
    { name: 'first',            category: 'collection', signature: '(p?: x => Boolean) -> T',           description: 'First element (or first matching)' },
    { name: 'last',             category: 'collection', signature: '(p?: x => Boolean) -> T',           description: 'Last element (or last matching)' },
    { name: 'any',              category: 'collection', signature: '(p: x => Boolean) -> Boolean',      description: 'Any element matches?' },
    { name: 'all',              category: 'collection', signature: '(p: x => Boolean) -> Boolean',      description: 'All elements match?' },
    { name: 'none',             category: 'collection', signature: '(p: x => Boolean) -> Boolean',      description: 'No element matches?' },
    { name: 'count',            category: 'collection', signature: '(p?: x => Boolean) -> Integer',     description: 'Count elements (optional predicate)' },
    { name: 'size',             category: 'collection', signature: '() -> Integer',                     description: 'Number of elements' },
    { name: 'isEmpty',          category: 'collection', signature: '() -> Boolean',                     description: 'Collection has no elements?' },
    { name: 'isNotEmpty',       category: 'collection', signature: '() -> Boolean',                     description: 'Collection has any elements?' },
    { name: 'contains',         category: 'collection', signature: '(element: T) -> Boolean',           description: 'Element is in collection?' },
    { name: 'distinct',         category: 'collection', signature: '() -> [T]',                         description: 'Remove duplicates' },
    { name: 'distinctBy',       category: 'collection', signature: '(key: x => K) -> [T]',              description: 'Remove duplicates by key' },
    { name: 'sortBy',           category: 'collection', signature: '(key: x => K) -> [T]',              description: 'Sort ascending by key' },
    { name: 'sortByDescending', category: 'collection', signature: '(key: x => K) -> [T]',              description: 'Sort descending by key' },
    { name: 'reverse',          category: 'collection', signature: '() -> [T]',                         description: 'Reverse the collection' },
    { name: 'take',             category: 'collection', signature: '(n: Integer) -> [T]',               description: 'Take first n elements' },
    { name: 'skip',             category: 'collection', signature: '(n: Integer) -> [T]',               description: 'Skip first n elements' },
    { name: 'takeWhile',        category: 'collection', signature: '(p: x => Boolean) -> [T]',          description: 'Take while predicate true' },
    { name: 'skipWhile',        category: 'collection', signature: '(p: x => Boolean) -> [T]',          description: 'Skip while predicate true' },
    { name: 'flatten',          category: 'collection', signature: '() -> [T]',                         description: 'Flatten nested arrays one level' },
    { name: 'groupBy',          category: 'collection', signature: '(key: x => K) -> [{key, items}]',   description: 'Group by key' },
    { name: 'join',             category: 'collection', signature: '(separator?: String) -> String',    description: 'Join into string' },
    { name: 'sum',              category: 'collection', signature: '(selector?: x => Number) -> Number', description: 'Sum numeric values' },
    { name: 'avg',              category: 'collection', signature: '(selector?: x => Number) -> Number', description: 'Average of numeric values' },
    { name: 'min',              category: 'collection', signature: '(selector?: x => K) -> T',          description: 'Minimum value' },
    { name: 'max',              category: 'collection', signature: '(selector?: x => K) -> T',          description: 'Maximum value' },
    { name: 'indexOf',          category: 'collection', signature: '(element: T) -> Integer',           description: 'Index of element (-1 if absent)' },
    { name: 'at',               category: 'collection', signature: '(index: Integer) -> T',             description: 'Element at index (negative supported)' },
];

// ============================================
// NUMBER METHODS (35 — implemented in evaluator)
// ============================================

export const NUMBER_METHODS: BuiltinMethod[] = [
    { name: 'abs',           category: 'number', signature: '() -> Number',                       description: 'Absolute value' },
    { name: 'round',         category: 'number', signature: '(decimals?: Integer) -> Number',     description: 'Round to nearest (or n decimals)' },
    { name: 'floor',         category: 'number', signature: '() -> Integer',                      description: 'Round down' },
    { name: 'ceil',          category: 'number', signature: '() -> Integer',                      description: 'Round up' },
    { name: 'trunc',         category: 'number', signature: '() -> Integer',                      description: 'Truncate decimal part' },
    { name: 'sign',          category: 'number', signature: '() -> Integer',                      description: 'Sign (-1, 0, 1)' },
    { name: 'sqrt',          category: 'number', signature: '() -> Number',                       description: 'Square root' },
    { name: 'pow',           category: 'number', signature: '(exponent: Number) -> Number',       description: 'Power' },
    { name: 'exp',           category: 'number', signature: '() -> Number',                       description: 'e^x' },
    { name: 'log',           category: 'number', signature: '() -> Number',                       description: 'Natural logarithm' },
    { name: 'log10',         category: 'number', signature: '() -> Number',                       description: 'Base 10 logarithm' },
    { name: 'log2',          category: 'number', signature: '() -> Number',                       description: 'Base 2 logarithm' },
    { name: 'sin',           category: 'number', signature: '() -> Number',                       description: 'Sine' },
    { name: 'cos',           category: 'number', signature: '() -> Number',                       description: 'Cosine' },
    { name: 'tan',           category: 'number', signature: '() -> Number',                       description: 'Tangent' },
    { name: 'asin',          category: 'number', signature: '() -> Number',                       description: 'Arcsine' },
    { name: 'acos',          category: 'number', signature: '() -> Number',                       description: 'Arccosine' },
    { name: 'atan',          category: 'number', signature: '() -> Number',                       description: 'Arctangent' },
    { name: 'toFixed',       category: 'number', signature: '(decimals?: Integer) -> String',     description: 'Format with fixed decimal places' },
    { name: 'toPrecision',   category: 'number', signature: '(precision: Integer) -> String',     description: 'Format with total precision' },
    { name: 'toExponential', category: 'number', signature: '(decimals?: Integer) -> String',     description: 'Format in exponential notation' },
    { name: 'toString',      category: 'number', signature: '() -> String',                       description: 'Convert to string' },
    { name: 'toHex',         category: 'number', signature: '() -> String',                       description: 'Convert to hexadecimal' },
    { name: 'toBinary',      category: 'number', signature: '() -> String',                       description: 'Convert to binary' },
    { name: 'toOctal',       category: 'number', signature: '() -> String',                       description: 'Convert to octal' },
    { name: 'isInteger',     category: 'number', signature: '() -> Boolean',                      description: 'Is integer?' },
    { name: 'isFinite',      category: 'number', signature: '() -> Boolean',                      description: 'Is finite?' },
    { name: 'isNaN',         category: 'number', signature: '() -> Boolean',                      description: 'Is NaN?' },
    { name: 'isPositive',    category: 'number', signature: '() -> Boolean',                      description: 'Is positive?' },
    { name: 'isNegative',    category: 'number', signature: '() -> Boolean',                      description: 'Is negative?' },
    { name: 'isZero',        category: 'number', signature: '() -> Boolean',                      description: 'Is zero?' },
    { name: 'clamp',         category: 'number', signature: '(min: Number, max: Number) -> Number', description: 'Clamp to range' },
    { name: 'between',       category: 'number', signature: '(min: Number, max: Number) -> Boolean', description: 'In range (inclusive)?' },
    { name: 'mod',           category: 'number', signature: '(divisor: Number) -> Number',        description: 'Modulo (always positive)' },
    { name: 'div',           category: 'number', signature: '(divisor: Number) -> Integer',       description: 'Integer division' },
];

// ============================================
// DATE METHODS (36 — implemented in evaluator)
// ============================================

export const DATE_METHODS: BuiltinMethod[] = [
    { name: 'year',         category: 'date', signature: '() -> Integer',                description: 'Get year' },
    { name: 'month',        category: 'date', signature: '() -> Integer',                description: 'Get month (1-12)' },
    { name: 'day',          category: 'date', signature: '() -> Integer',                description: 'Get day of month' },
    { name: 'hour',         category: 'date', signature: '() -> Integer',                description: 'Get hour (0-23)' },
    { name: 'minute',       category: 'date', signature: '() -> Integer',                description: 'Get minute' },
    { name: 'second',       category: 'date', signature: '() -> Integer',                description: 'Get second' },
    { name: 'millisecond',  category: 'date', signature: '() -> Integer',                description: 'Get millisecond' },
    { name: 'dayOfWeek',    category: 'date', signature: '() -> Integer',                description: 'Day of week (0=Sun..6=Sat)' },
    { name: 'dayOfYear',    category: 'date', signature: '() -> Integer',                description: 'Day of year (1-366)' },
    { name: 'weekOfYear',   category: 'date', signature: '() -> Integer',                description: 'ISO 8601 week of year' },
    { name: 'quarter',      category: 'date', signature: '() -> Integer',                description: 'Quarter (1-4)' },
    { name: 'isLeapYear',   category: 'date', signature: '() -> Boolean',                description: 'Is in a leap year?' },
    { name: 'daysInMonth',  category: 'date', signature: '() -> Integer',                description: 'Number of days in the month' },
    { name: 'timestamp',    category: 'date', signature: '() -> Integer',                description: 'Unix timestamp (milliseconds)' },
    { name: 'toISOString',  category: 'date', signature: '() -> String',                 description: 'Convert to ISO 8601 string' },
    { name: 'toDateString', category: 'date', signature: '() -> String',                 description: 'Date part only (YYYY-MM-DD)' },
    { name: 'toTimeString', category: 'date', signature: '() -> String',                 description: 'Time part only' },
    { name: 'addDays',      category: 'date', signature: '(n: Integer) -> Date',         description: 'Add n days' },
    { name: 'addMonths',    category: 'date', signature: '(n: Integer) -> Date',         description: 'Add n months' },
    { name: 'addYears',     category: 'date', signature: '(n: Integer) -> Date',         description: 'Add n years' },
    { name: 'addHours',     category: 'date', signature: '(n: Integer) -> Date',         description: 'Add n hours' },
    { name: 'addMinutes',   category: 'date', signature: '(n: Integer) -> Date',         description: 'Add n minutes' },
    { name: 'addSeconds',   category: 'date', signature: '(n: Integer) -> Date',         description: 'Add n seconds' },
    { name: 'startOfDay',   category: 'date', signature: '() -> Date',                   description: 'Set to start of day' },
    { name: 'endOfDay',     category: 'date', signature: '() -> Date',                   description: 'Set to end of day' },
    { name: 'startOfMonth', category: 'date', signature: '() -> Date',                   description: 'Set to start of month' },
    { name: 'endOfMonth',   category: 'date', signature: '() -> Date',                   description: 'Set to end of month' },
    { name: 'startOfYear',  category: 'date', signature: '() -> Date',                   description: 'Set to start of year' },
    { name: 'endOfYear',    category: 'date', signature: '() -> Date',                   description: 'Set to end of year' },
    { name: 'diffDays',     category: 'date', signature: '(other: Date) -> Integer',     description: 'Difference in days' },
    { name: 'diffMonths',   category: 'date', signature: '(other: Date) -> Integer',     description: 'Difference in months' },
    { name: 'diffYears',    category: 'date', signature: '(other: Date) -> Integer',     description: 'Difference in years' },
    { name: 'isBefore',     category: 'date', signature: '(other: Date) -> Boolean',     description: 'Is before another date?' },
    { name: 'isAfter',      category: 'date', signature: '(other: Date) -> Boolean',     description: 'Is after another date?' },
    { name: 'isSameDay',    category: 'date', signature: '(other: Date) -> Boolean',     description: 'Is same calendar day?' },
    { name: 'format',       category: 'date', signature: '(pattern: String) -> String',  description: 'Format with YYYY/MM/DD/HH/mm/ss' },
];

// ============================================
// AGGREGATED EXPORTS
// ============================================

/** All built-in methods, regardless of receiver category. */
export const ALL_BUILTIN_METHODS: BuiltinMethod[] = [
    ...STRING_METHODS,
    ...COLLECTION_METHODS,
    ...NUMBER_METHODS,
    ...DATE_METHODS,
];

/**
 * Methods that are likely to be used most often. Used by the autocomplete
 * ranking to boost their priority when the user has not typed any prefix.
 * Subjective set, refine over time.
 */
export const COMMON_METHOD_NAMES: ReadonlySet<string> = new Set([
    'name', 'size', 'count', 'isEmpty', 'isNotEmpty',
    'filter', 'map', 'first', 'last', 'any', 'all',
    'sortBy', 'distinct', 'flatMap',
    'toUpper', 'toLower', 'snakeCase', 'camelCase',
]);
