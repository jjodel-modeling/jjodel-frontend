/**
 * JjEL Collection Builtins
 * Methods for array/collection operations
 */

import {
    JjelValue,
    JjelFunction,
    EvaluationContext,
    createFunction,
    isJjelFunction
} from '../context';

// ============================================
// COLLECTION METHODS
// ============================================

/**
 * filter(predicate) - Filter elements matching predicate
 * Example: items.filter(x: x.isActive)
 */
export function filter(
    array: JjelValue[],
    predicate: JjelFunction,
    ctx: EvaluationContext
): JjelValue[] {
    const result: JjelValue[] = [];

    for (const item of array) {
        const matches = predicate.call([item], ctx);
        if (matches) {
            result.push(item);
        }
    }

    return result;
}

/**
 * map(transformer) - Transform each element
 * Example: items.map(x: x.name)
 */
export function map(
    array: JjelValue[],
    transformer: JjelFunction,
    ctx: EvaluationContext
): JjelValue[] {
    return array.map(item => transformer.call([item], ctx));
}

/**
 * flatMap(transformer) - Map and flatten one level
 * Example: classes.flatMap(c: c.attributes)
 */
export function flatMap(
    array: JjelValue[],
    transformer: JjelFunction,
    ctx: EvaluationContext
): JjelValue[] {
    const result: JjelValue[] = [];

    for (const item of array) {
        const mapped = transformer.call([item], ctx);
        if (Array.isArray(mapped)) {
            result.push(...mapped);
        } else {
            result.push(mapped);
        }
    }

    return result;
}

/**
 * first() - Get first element or null
 * first(predicate) - Get first element matching predicate
 */
export function first(
    array: JjelValue[],
    predicate?: JjelFunction,
    ctx?: EvaluationContext
): JjelValue {
    if (!predicate) {
        return array.length > 0 ? array[0] : null;
    }

    for (const item of array) {
        if (predicate.call([item], ctx!)) {
            return item;
        }
    }

    return null;
}

/**
 * last() - Get last element or null
 * last(predicate) - Get last element matching predicate
 */
export function last(
    array: JjelValue[],
    predicate?: JjelFunction,
    ctx?: EvaluationContext
): JjelValue {
    if (!predicate) {
        return array.length > 0 ? array[array.length - 1] : null;
    }

    for (let i = array.length - 1; i >= 0; i--) {
        if (predicate.call([array[i]], ctx!)) {
            return array[i];
        }
    }

    return null;
}

/**
 * any(predicate) - Check if any element matches
 * Example: items.any(x: x.isError)
 */
export function any(
    array: JjelValue[],
    predicate: JjelFunction,
    ctx: EvaluationContext
): boolean {
    for (const item of array) {
        if (predicate.call([item], ctx)) {
            return true;
        }
    }
    return false;
}

/**
 * all(predicate) - Check if all elements match
 * Example: items.all(x: x.isValid)
 */
export function all(
    array: JjelValue[],
    predicate: JjelFunction,
    ctx: EvaluationContext
): boolean {
    for (const item of array) {
        if (!predicate.call([item], ctx)) {
            return false;
        }
    }
    return true;
}

/**
 * none(predicate) - Check if no elements match
 * Example: items.none(x: x.isError)
 */
export function none(
    array: JjelValue[],
    predicate: JjelFunction,
    ctx: EvaluationContext
): boolean {
    return !any(array, predicate, ctx);
}

/**
 * count() - Get number of elements
 * count(predicate) - Count elements matching predicate
 */
export function count(
    array: JjelValue[],
    predicate?: JjelFunction,
    ctx?: EvaluationContext
): number {
    if (!predicate) {
        return array.length;
    }

    let c = 0;
    for (const item of array) {
        if (predicate.call([item], ctx!)) {
            c++;
        }
    }
    return c;
}

/**
 * size() - Alias for count()
 */
export const size = count;

/**
 * isEmpty() - Check if collection is empty
 */
export function isEmpty(array: JjelValue[]): boolean {
    return array.length === 0;
}

/**
 * isNotEmpty() - Check if collection has elements
 */
export function isNotEmpty(array: JjelValue[]): boolean {
    return array.length > 0;
}

/**
 * contains(element) - Check if collection contains element
 */
export function contains(array: JjelValue[], element: JjelValue): boolean {
    return array.some(item => deepEqual(item, element));
}

/**
 * distinct() - Remove duplicates
 */
export function distinct(array: JjelValue[]): JjelValue[] {
    const result: JjelValue[] = [];
    const seen = new Set<string>();

    for (const item of array) {
        const key = JSON.stringify(item);
        if (!seen.has(key)) {
            seen.add(key);
            result.push(item);
        }
    }

    return result;
}

/**
 * distinctBy(keySelector) - Remove duplicates by key
 * Example: items.distinctBy(x: x.id)
 */
export function distinctBy(
    array: JjelValue[],
    keySelector: JjelFunction,
    ctx: EvaluationContext
): JjelValue[] {
    const result: JjelValue[] = [];
    const seen = new Set<string>();

    for (const item of array) {
        const key = JSON.stringify(keySelector.call([item], ctx));
        if (!seen.has(key)) {
            seen.add(key);
            result.push(item);
        }
    }

    return result;
}

/**
 * sortBy(keySelector) - Sort by key ascending
 * Example: items.sortBy(x: x.name)
 */
export function sortBy(
    array: JjelValue[],
    keySelector: JjelFunction,
    ctx: EvaluationContext
): JjelValue[] {
    return [...array].sort((a, b) => {
        const keyA = keySelector.call([a], ctx);
        const keyB = keySelector.call([b], ctx);
        return compare(keyA, keyB);
    });
}

/**
 * sortByDescending(keySelector) - Sort by key descending
 */
export function sortByDescending(
    array: JjelValue[],
    keySelector: JjelFunction,
    ctx: EvaluationContext
): JjelValue[] {
    return [...array].sort((a, b) => {
        const keyA = keySelector.call([a], ctx);
        const keyB = keySelector.call([b], ctx);
        return compare(keyB, keyA);
    });
}

/**
 * reverse() - Reverse the array
 */
export function reverse(array: JjelValue[]): JjelValue[] {
    return [...array].reverse();
}

/**
 * take(n) - Take first n elements
 */
export function take(array: JjelValue[], n: number): JjelValue[] {
    return array.slice(0, n);
}

/**
 * skip(n) - Skip first n elements
 */
export function skip(array: JjelValue[], n: number): JjelValue[] {
    return array.slice(n);
}

/**
 * takeWhile(predicate) - Take while predicate is true
 */
export function takeWhile(
    array: JjelValue[],
    predicate: JjelFunction,
    ctx: EvaluationContext
): JjelValue[] {
    const result: JjelValue[] = [];

    for (const item of array) {
        if (!predicate.call([item], ctx)) break;
        result.push(item);
    }

    return result;
}

/**
 * skipWhile(predicate) - Skip while predicate is true
 */
export function skipWhile(
    array: JjelValue[],
    predicate: JjelFunction,
    ctx: EvaluationContext
): JjelValue[] {
    let skipping = true;
    const result: JjelValue[] = [];

    for (const item of array) {
        if (skipping && predicate.call([item], ctx)) continue;
        skipping = false;
        result.push(item);
    }

    return result;
}

/**
 * flatten() - Flatten nested arrays one level
 */
export function flatten(array: JjelValue[]): JjelValue[] {
    const result: JjelValue[] = [];

    for (const item of array) {
        if (Array.isArray(item)) {
            result.push(...item);
        } else {
            result.push(item);
        }
    }

    return result;
}

/**
 * groupBy(keySelector) - Group elements by key
 * Returns array of {key, items} objects
 */
export function groupBy(
    array: JjelValue[],
    keySelector: JjelFunction,
    ctx: EvaluationContext
): JjelValue[] {
    const groups = new Map<string, { key: JjelValue; items: JjelValue[] }>();

    for (const item of array) {
        const key = keySelector.call([item], ctx);
        const keyStr = JSON.stringify(key);

        if (!groups.has(keyStr)) {
            groups.set(keyStr, { key, items: [] });
        }
        groups.get(keyStr)!.items.push(item);
    }

    return Array.from(groups.values());
}

/**
 * join(separator) - Join strings with separator
 * Example: names.join(", ")
 */
export function join(array: JjelValue[], separator: string = ''): string {
    return array.map(v => String(v)).join(separator);
}

/**
 * sum() - Sum numeric values
 * sum(selector) - Sum with selector function
 */
export function sum(
    array: JjelValue[],
    selector?: JjelFunction,
    ctx?: EvaluationContext
): number {
    let total = 0;

    for (const item of array) {
        const value = selector ? selector.call([item], ctx!) : item;
        if (typeof value === 'number') {
            total += value;
        }
    }

    return total;
}

/**
 * avg() - Average of numeric values
 * avg(selector) - Average with selector function
 */
export function avg(
    array: JjelValue[],
    selector?: JjelFunction,
    ctx?: EvaluationContext
): number {
    if (array.length === 0) return 0;
    return sum(array, selector, ctx) / array.length;
}

/**
 * min() - Minimum value
 * min(selector) - Minimum with selector function
 */
export function min(
    array: JjelValue[],
    selector?: JjelFunction,
    ctx?: EvaluationContext
): JjelValue {
    if (array.length === 0) return null;

    let minValue: JjelValue = null;
    let minKey: JjelValue = null;

    for (const item of array) {
        const key = selector ? selector.call([item], ctx!) : item;
        if (minKey === null || compare(key, minKey) < 0) {
            minKey = key;
            minValue = item;
        }
    }

    return selector ? minValue : minKey;
}

/**
 * max() - Maximum value
 * max(selector) - Maximum with selector function
 */
export function max(
    array: JjelValue[],
    selector?: JjelFunction,
    ctx?: EvaluationContext
): JjelValue {
    if (array.length === 0) return null;

    let maxValue: JjelValue = null;
    let maxKey: JjelValue = null;

    for (const item of array) {
        const key = selector ? selector.call([item], ctx!) : item;
        if (maxKey === null || compare(key, maxKey) > 0) {
            maxKey = key;
            maxValue = item;
        }
    }

    return selector ? maxValue : maxKey;
}

/**
 * indexOf(element) - Find index of element
 */
export function indexOf(array: JjelValue[], element: JjelValue): number {
    for (let i = 0; i < array.length; i++) {
        if (deepEqual(array[i], element)) {
            return i;
        }
    }
    return -1;
}

/**
 * at(index) - Get element at index
 */
export function at(array: JjelValue[], index: number): JjelValue {
    if (index < 0) index = array.length + index;
    if (index < 0 || index >= array.length) return null;
    return array[index];
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function compare(a: JjelValue, b: JjelValue): number {
    if (a === b) return 0;
    if (a === null) return -1;
    if (b === null) return 1;

    if (typeof a === 'number' && typeof b === 'number') {
        return a - b;
    }

    if (typeof a === 'string' && typeof b === 'string') {
        return a.localeCompare(b);
    }

    if (typeof a === 'boolean' && typeof b === 'boolean') {
        return (a ? 1 : 0) - (b ? 1 : 0);
    }

    // Convert to string for comparison
    return String(a).localeCompare(String(b));
}

function deepEqual(a: JjelValue, b: JjelValue): boolean {
    if (a === b) return true;
    if (a === null || b === null) return a === b;

    if (typeof a !== typeof b) return false;

    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return false;
        return a.every((item, i) => deepEqual(item, b[i]));
    }

    if (typeof a === 'object' && typeof b === 'object') {
        const keysA = Object.keys(a);
        const keysB = Object.keys(b);
        if (keysA.length !== keysB.length) return false;
        return keysA.every(key => deepEqual((a as any)[key], (b as any)[key]));
    }

    return false;
}

// ============================================
// REGISTER COLLECTION BUILTINS
// ============================================

export function registerCollectionBuiltins(ctx: EvaluationContext): void {
    // These are method-style builtins, registered for reference
    // Actual method calls are handled by the evaluator
}

/**
 * Get collection method by name
 */
export function getCollectionMethod(name: string): ((...args: any[]) => JjelValue) | undefined {
    const methods: Record<string, (...args: any[]) => JjelValue> = {
        filter,
        map,
        flatMap,
        first,
        last,
        any,
        all,
        none,
        count,
        size,
        isEmpty,
        isNotEmpty,
        contains,
        distinct,
        distinctBy,
        sortBy,
        sortByDescending,
        reverse,
        take,
        skip,
        takeWhile,
        skipWhile,
        flatten,
        groupBy,
        join,
        sum,
        avg,
        min,
        max,
        indexOf,
        at
    };

    return methods[name];
}
