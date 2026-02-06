/**
 * JjEL String Builtins
 * Methods for string operations
 */

import { JjelValue } from '../context';

// ============================================
// STRING METHODS
// ============================================

/**
 * toUpper() - Convert to uppercase
 * Example: name.toUpper()
 */
export function toUpper(str: string): string {
    return str.toUpperCase();
}

/**
 * toLower() - Convert to lowercase
 * Example: name.toLower()
 */
export function toLower(str: string): string {
    return str.toLowerCase();
}

/**
 * capitalize() - Capitalize first letter
 * Example: "hello".capitalize() => "Hello"
 */
export function capitalize(str: string): string {
    if (str.length === 0) return str;
    return str[0].toUpperCase() + str.slice(1);
}

/**
 * uncapitalize() - Lowercase first letter
 * Example: "Hello".uncapitalize() => "hello"
 */
export function uncapitalize(str: string): string {
    if (str.length === 0) return str;
    return str[0].toLowerCase() + str.slice(1);
}

/**
 * camelCase() - Convert to camelCase
 * Example: "hello_world".camelCase() => "helloWorld"
 */
export function camelCase(str: string): string {
    return str
        .replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '')
        .replace(/^./, c => c.toLowerCase());
}

/**
 * pascalCase() - Convert to PascalCase
 * Example: "hello_world".pascalCase() => "HelloWorld"
 */
export function pascalCase(str: string): string {
    return str
        .replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '')
        .replace(/^./, c => c.toUpperCase());
}

/**
 * snakeCase() - Convert to snake_case
 * Example: "HelloWorld".snakeCase() => "hello_world"
 */
export function snakeCase(str: string): string {
    return str
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .replace(/[-\s]+/g, '_')
        .toLowerCase();
}

/**
 * kebabCase() - Convert to kebab-case
 * Example: "HelloWorld".kebabCase() => "hello-world"
 */
export function kebabCase(str: string): string {
    return str
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/[_\s]+/g, '-')
        .toLowerCase();
}

/**
 * trim() - Remove leading and trailing whitespace
 */
export function trim(str: string): string {
    return str.trim();
}

/**
 * trimStart() - Remove leading whitespace
 */
export function trimStart(str: string): string {
    return str.trimStart();
}

/**
 * trimEnd() - Remove trailing whitespace
 */
export function trimEnd(str: string): string {
    return str.trimEnd();
}

/**
 * padStart(length, char) - Pad start to target length
 */
export function padStart(str: string, length: number, char: string = ' '): string {
    return str.padStart(length, char);
}

/**
 * padEnd(length, char) - Pad end to target length
 */
export function padEnd(str: string, length: number, char: string = ' '): string {
    return str.padEnd(length, char);
}

/**
 * repeat(count) - Repeat string n times
 */
export function repeat(str: string, count: number): string {
    if (count < 0) return '';
    return str.repeat(Math.floor(count));
}

/**
 * replace(search, replacement) - Replace first occurrence
 */
export function replace(str: string, search: string, replacement: string): string {
    return str.replace(search, replacement);
}

/**
 * replaceAll(search, replacement) - Replace all occurrences
 */
export function replaceAll(str: string, search: string, replacement: string): string {
    return str.split(search).join(replacement);
}

/**
 * substring(start, end?) - Extract substring
 */
export function substring(str: string, start: number, end?: number): string {
    return str.substring(start, end);
}

/**
 * slice(start, end?) - Extract slice
 */
export function slice(str: string, start: number, end?: number): string {
    return str.slice(start, end);
}

/**
 * split(separator) - Split string into array
 */
export function split(str: string, separator: string): string[] {
    return str.split(separator);
}

/**
 * startsWith(prefix) - Check if string starts with prefix
 */
export function startsWith(str: string, prefix: string): boolean {
    return str.startsWith(prefix);
}

/**
 * endsWith(suffix) - Check if string ends with suffix
 */
export function endsWith(str: string, suffix: string): boolean {
    return str.endsWith(suffix);
}

/**
 * contains(substring) - Check if string contains substring
 */
export function contains(str: string, substring: string): boolean {
    return str.includes(substring);
}

/**
 * indexOf(search) - Find index of substring
 */
export function indexOf(str: string, search: string): number {
    return str.indexOf(search);
}

/**
 * lastIndexOf(search) - Find last index of substring
 */
export function lastIndexOf(str: string, search: string): number {
    return str.lastIndexOf(search);
}

/**
 * charAt(index) - Get character at index
 */
export function charAt(str: string, index: number): string {
    if (index < 0) index = str.length + index;
    if (index < 0 || index >= str.length) return '';
    return str[index];
}

/**
 * length - Get string length
 */
export function length(str: string): number {
    return str.length;
}

/**
 * isEmpty() - Check if string is empty
 */
export function isEmpty(str: string): boolean {
    return str.length === 0;
}

/**
 * isNotEmpty() - Check if string is not empty
 */
export function isNotEmpty(str: string): boolean {
    return str.length > 0;
}

/**
 * isBlank() - Check if string is blank (empty or whitespace only)
 */
export function isBlank(str: string): boolean {
    return str.trim().length === 0;
}

/**
 * isNotBlank() - Check if string is not blank
 */
export function isNotBlank(str: string): boolean {
    return str.trim().length > 0;
}

/**
 * matches(pattern) - Test against regex pattern
 */
export function matches(str: string, pattern: string): boolean {
    try {
        const regex = new RegExp(pattern);
        return regex.test(str);
    } catch {
        return false;
    }
}

/**
 * reverse() - Reverse string
 */
export function reverse(str: string): string {
    return str.split('').reverse().join('');
}

/**
 * toNumber() - Parse string to number
 */
export function toNumber(str: string): number | null {
    const num = parseFloat(str);
    return isNaN(num) ? null : num;
}

/**
 * toInt() - Parse string to integer
 */
export function toInt(str: string): number | null {
    const num = parseInt(str, 10);
    return isNaN(num) ? null : num;
}

/**
 * quote() - Wrap string in quotes
 */
export function quote(str: string): string {
    return `"${str.replace(/"/g, '\\"')}"`;
}

/**
 * format(...args) - Simple string format
 * Example: "Hello {0}!".format("World") => "Hello World!"
 */
export function format(str: string, ...args: JjelValue[]): string {
    return str.replace(/\{(\d+)\}/g, (_, index) => {
        const i = parseInt(index, 10);
        return i < args.length ? String(args[i]) : `{${index}}`;
    });
}

// ============================================
// REGISTER STRING BUILTINS
// ============================================

/**
 * Get string method by name
 */
export function getStringMethod(name: string): ((...args: any[]) => JjelValue) | undefined {
    const methods: Record<string, (...args: any[]) => JjelValue> = {
        toUpper,
        toLower,
        capitalize,
        uncapitalize,
        camelCase,
        pascalCase,
        snakeCase,
        kebabCase,
        trim,
        trimStart,
        trimEnd,
        padStart,
        padEnd,
        repeat,
        replace,
        replaceAll,
        substring,
        slice,
        split,
        startsWith,
        endsWith,
        contains,
        indexOf,
        lastIndexOf,
        charAt,
        length,
        isEmpty,
        isNotEmpty,
        isBlank,
        isNotBlank,
        matches,
        reverse,
        toNumber,
        toInt,
        quote,
        format
    };

    return methods[name];
}
