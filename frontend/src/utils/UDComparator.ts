/**
 * UsageDeclarations Comparator
 * Efficiently compares UsageDeclarations by extracting comparable values from Proxies
 *
 * Problem: L-Proxy objects (LClass, LAttribute, etc.) are always considered "different"
 * by normal comparison even when their underlying data is identical.
 *
 * Solution: Extract id + clonedCounter (version) from Proxies for comparison.
 */

import { PerformanceMetrics } from './PerformanceMetrics';

type UDValue = any;
type UDObject = Record<string, UDValue>;

export interface CompareResult {
    equal: boolean;
    reason?: string;
    changedKeys?: string[];
}

// Keys to skip during comparison (internal properties)
const SKIP_KEYS = new Set([
    'pointedBy',
    'clonedCounter', // Checked separately as version
    '__raw',
    '_',
    '__',
    '___',
    'component',
    'stateProps',
    'ownProps',
    'props',
]);

/**
 * Extract a comparable signature from an L-Proxy object
 * Returns: { id, _v (clonedCounter), className, name }
 */
function extractProxySignature(proxy: any): any {
    const raw = proxy.__raw || proxy;
    return {
        __isProxy: true,
        id: raw.id,
        _v: raw.clonedCounter, // Version check
        className: raw.className,
        name: raw.name,
    };
}

/**
 * Check if value is an L-Proxy object
 */
function isLProxy(value: any): boolean {
    if (!value || typeof value !== 'object') return false;
    return !!(value.__raw || (value.id && value.className));
}

/**
 * Extract a comparable value from any UD value
 * - L-Proxy → signature with id + version
 * - Arrays → mapped recursively (with optimization for large arrays)
 * - Plain objects → mapped recursively
 * - Primitives → as-is
 */
function extractComparableValue(value: UDValue, depth: number = 0): any {
    // Prevent infinite recursion
    if (depth > 4) return '[max-depth]';

    // Null/undefined
    if (value == null) return value;

    // Primitives
    if (typeof value !== 'object') return value;

    // Functions - compare by reference (should be same if JSX didn't change)
    if (typeof value === 'function') {
        return { __isFunction: true, name: value.name || 'anonymous' };
    }

    // L-Proxy object
    if (isLProxy(value)) {
        return extractProxySignature(value);
    }

    // Array
    if (Array.isArray(value)) {
        // For large arrays, use a signature instead of full comparison
        if (value.length > 20) {
            return {
                __isArray: true,
                length: value.length,
                // Sample first, middle, and last elements
                first: extractComparableValue(value[0], depth + 1),
                mid: extractComparableValue(value[Math.floor(value.length / 2)], depth + 1),
                last: extractComparableValue(value[value.length - 1], depth + 1),
            };
        }
        return value.map(v => extractComparableValue(v, depth + 1));
    }

    // React element - compare by type and key
    if (value.$$typeof || value._owner !== undefined) {
        return {
            __isReactElement: true,
            type: typeof value.type === 'function' ? value.type.name : value.type,
            key: value.key,
        };
    }

    // Plain object
    const result: Record<string, any> = {};
    for (const key of Object.keys(value)) {
        if (SKIP_KEYS.has(key) || key.startsWith('_')) continue;
        result[key] = extractComparableValue(value[key], depth + 1);
    }
    return result;
}

/**
 * Fast deep equality check for extracted values
 */
function fastDeepEqual(a: any, b: any): boolean {
    // Same reference
    if (a === b) return true;

    // Null/undefined
    if (a == null || b == null) return a === b;

    // Different types
    if (typeof a !== typeof b) return false;

    // Primitives
    if (typeof a !== 'object') return a === b;

    // Both arrays
    if (Array.isArray(a) !== Array.isArray(b)) return false;

    if (Array.isArray(a)) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (!fastDeepEqual(a[i], b[i])) return false;
        }
        return true;
    }

    // Both objects
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
        if (!keysB.includes(key)) return false;
        if (!fastDeepEqual(a[key], b[key])) return false;
    }

    return true;
}

/**
 * Compare two UsageDeclarations efficiently
 *
 * @param oldUD - Previous UsageDeclarations
 * @param newUD - New UsageDeclarations
 * @param skipKeys - Additional keys to skip (optional)
 * @returns CompareResult with equal flag and optional reason/changedKeys
 */
export function compareUsageDeclarations(
    oldUD: UDObject | undefined,
    newUD: UDObject | undefined,
    skipKeys?: Record<string, boolean>
): CompareResult {
    const stopTimer = PerformanceMetrics.startTimer('UDComparator');

    try {
        // Fast path: both undefined/null
        if (!oldUD && !newUD) return { equal: true };
        if (!oldUD || !newUD) return { equal: false, reason: 'one is null/undefined' };

        // Fast path: same reference
        if (oldUD === newUD) return { equal: true };

        // Get keys to compare - check both SKIP_KEYS (Set) and skipKeys (Record)
        const shouldSkipKey = (k: string): boolean => {
            if (k.startsWith('_')) return true;
            if (SKIP_KEYS.has(k)) return true;
            if (skipKeys && skipKeys[k]) return true;
            return false;
        };
        const oldKeys = Object.keys(oldUD).filter(k => !shouldSkipKey(k));
        const newKeys = Object.keys(newUD).filter(k => !shouldSkipKey(k));

        // Fast path: different number of keys
        if (oldKeys.length !== newKeys.length) {
            const added = newKeys.filter(k => !oldKeys.includes(k));
            const removed = oldKeys.filter(k => !newKeys.includes(k));
            return {
                equal: false,
                reason: `key count changed (${oldKeys.length} → ${newKeys.length})`,
                changedKeys: [...added, ...removed],
            };
        }

        // Compare each key
        const changedKeys: string[] = [];

        for (const key of newKeys) {
            if (!oldKeys.includes(key)) {
                changedKeys.push(key);
                continue;
            }

            const oldVal = extractComparableValue(oldUD[key]);
            const newVal = extractComparableValue(newUD[key]);

            if (!fastDeepEqual(oldVal, newVal)) {
                changedKeys.push(key);
            }
        }

        if (changedKeys.length > 0) {
            return {
                equal: false,
                reason: `values changed: ${changedKeys.slice(0, 3).join(', ')}${changedKeys.length > 3 ? '...' : ''}`,
                changedKeys,
            };
        }

        return { equal: true };
    } finally {
        stopTimer();
    }
}

/**
 * Quick check if two UD objects are likely the same
 * Uses only L-Proxy signatures without full extraction
 * Good for fast pre-check before full comparison
 */
export function quickUDCheck(
    oldUD: UDObject | undefined,
    newUD: UDObject | undefined
): boolean {
    if (!oldUD && !newUD) return true;
    if (!oldUD || !newUD) return false;
    if (oldUD === newUD) return true;

    // Check main data/node/view proxies which are most commonly in UD
    const keysToCheck = ['data', 'node', 'view'];

    for (const key of keysToCheck) {
        const oldVal = oldUD[key];
        const newVal = newUD[key];

        if (isLProxy(oldVal) && isLProxy(newVal)) {
            const oldRaw = oldVal.__raw || oldVal;
            const newRaw = newVal.__raw || newVal;

            // Different id = definitely different
            if (oldRaw.id !== newRaw.id) return false;

            // Different version = definitely different
            if (oldRaw.clonedCounter !== newRaw.clonedCounter) return false;
        }
    }

    // If main proxies are same, likely equal (full check needed for certainty)
    return true;
}

export default compareUsageDeclarations;
