/**
 * JjEL Number Builtins
 * Methods for numeric operations
 */

import { JjelValue } from '../context';

// ============================================
// NUMBER METHODS
// ============================================

/**
 * abs() - Absolute value
 * Example: (-5).abs() => 5
 */
export function abs(num: number): number {
    return Math.abs(num);
}

/**
 * round() - Round to nearest integer
 * round(decimals) - Round to n decimal places
 */
export function round(num: number, decimals: number = 0): number {
    if (decimals === 0) {
        return Math.round(num);
    }
    const factor = Math.pow(10, decimals);
    return Math.round(num * factor) / factor;
}

/**
 * floor() - Round down
 */
export function floor(num: number): number {
    return Math.floor(num);
}

/**
 * ceil() - Round up
 */
export function ceil(num: number): number {
    return Math.ceil(num);
}

/**
 * trunc() - Truncate decimal part
 */
export function trunc(num: number): number {
    return Math.trunc(num);
}

/**
 * sign() - Get sign (-1, 0, or 1)
 */
export function sign(num: number): number {
    return Math.sign(num);
}

/**
 * sqrt() - Square root
 */
export function sqrt(num: number): number {
    return Math.sqrt(num);
}

/**
 * pow(exponent) - Power
 */
export function pow(num: number, exponent: number): number {
    return Math.pow(num, exponent);
}

/**
 * exp() - e^x
 */
export function exp(num: number): number {
    return Math.exp(num);
}

/**
 * log() - Natural logarithm
 */
export function log(num: number): number {
    return Math.log(num);
}

/**
 * log10() - Base 10 logarithm
 */
export function log10(num: number): number {
    return Math.log10(num);
}

/**
 * log2() - Base 2 logarithm
 */
export function log2(num: number): number {
    return Math.log2(num);
}

/**
 * sin() - Sine
 */
export function sin(num: number): number {
    return Math.sin(num);
}

/**
 * cos() - Cosine
 */
export function cos(num: number): number {
    return Math.cos(num);
}

/**
 * tan() - Tangent
 */
export function tan(num: number): number {
    return Math.tan(num);
}

/**
 * asin() - Arcsine
 */
export function asin(num: number): number {
    return Math.asin(num);
}

/**
 * acos() - Arccosine
 */
export function acos(num: number): number {
    return Math.acos(num);
}

/**
 * atan() - Arctangent
 */
export function atan(num: number): number {
    return Math.atan(num);
}

/**
 * toFixed(decimals) - Format with fixed decimal places
 */
export function toFixed(num: number, decimals: number = 0): string {
    return num.toFixed(decimals);
}

/**
 * toPrecision(precision) - Format with total precision
 */
export function toPrecision(num: number, precision: number): string {
    return num.toPrecision(precision);
}

/**
 * toExponential(decimals?) - Format in exponential notation
 */
export function toExponential(num: number, decimals?: number): string {
    return decimals !== undefined ? num.toExponential(decimals) : num.toExponential();
}

/**
 * toString() - Convert to string
 */
export function toString(num: number): string {
    return String(num);
}

/**
 * toHex() - Convert to hexadecimal string
 */
export function toHex(num: number): string {
    return Math.floor(num).toString(16);
}

/**
 * toBinary() - Convert to binary string
 */
export function toBinary(num: number): string {
    return Math.floor(num).toString(2);
}

/**
 * toOctal() - Convert to octal string
 */
export function toOctal(num: number): string {
    return Math.floor(num).toString(8);
}

/**
 * isInteger() - Check if integer
 */
export function isInteger(num: number): boolean {
    return Number.isInteger(num);
}

/**
 * isFinite() - Check if finite
 */
export function isFinite(num: number): boolean {
    return Number.isFinite(num);
}

/**
 * isNaN() - Check if NaN
 */
export function isNaN(num: number): boolean {
    return Number.isNaN(num);
}

/**
 * isPositive() - Check if positive
 */
export function isPositive(num: number): boolean {
    return num > 0;
}

/**
 * isNegative() - Check if negative
 */
export function isNegative(num: number): boolean {
    return num < 0;
}

/**
 * isZero() - Check if zero
 */
export function isZero(num: number): boolean {
    return num === 0;
}

/**
 * clamp(min, max) - Clamp value to range
 */
export function clamp(num: number, min: number, max: number): number {
    return Math.min(Math.max(num, min), max);
}

/**
 * between(min, max) - Check if value is in range (inclusive)
 */
export function between(num: number, min: number, max: number): boolean {
    return num >= min && num <= max;
}

/**
 * mod(divisor) - Modulo operation (always positive)
 */
export function mod(num: number, divisor: number): number {
    return ((num % divisor) + divisor) % divisor;
}

/**
 * div(divisor) - Integer division
 */
export function div(num: number, divisor: number): number {
    return Math.floor(num / divisor);
}

// ============================================
// REGISTER NUMBER BUILTINS
// ============================================

/**
 * Get number method by name
 */
export function getNumberMethod(name: string): ((...args: any[]) => JjelValue) | undefined {
    const methods: Record<string, (...args: any[]) => JjelValue> = {
        abs,
        round,
        floor,
        ceil,
        trunc,
        sign,
        sqrt,
        pow,
        exp,
        log,
        log10,
        log2,
        sin,
        cos,
        tan,
        asin,
        acos,
        atan,
        toFixed,
        toPrecision,
        toExponential,
        toString,
        toHex,
        toBinary,
        toOctal,
        isInteger,
        isFinite,
        isNaN,
        isPositive,
        isNegative,
        isZero,
        clamp,
        between,
        mod,
        div
    };

    return methods[name];
}
