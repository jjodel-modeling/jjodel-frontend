/**
 * JjEL Date Builtins
 * Methods for date/time operations
 *
 * Note: JjEL represents dates as ISO 8601 strings
 */

import { JjelValue, JjelObject } from '../context';

// ============================================
// DATE METHODS (on string dates)
// ============================================

/**
 * Parse ISO date string to Date object
 */
function parseDate(str: string): Date | null {
    const date = new Date(str);
    return isNaN(date.getTime()) ? null : date;
}

/**
 * year() - Get year
 * Example: "2024-01-15".year() => 2024
 */
export function year(dateStr: string): number | null {
    const date = parseDate(dateStr);
    return date ? date.getFullYear() : null;
}

/**
 * month() - Get month (1-12)
 */
export function month(dateStr: string): number | null {
    const date = parseDate(dateStr);
    return date ? date.getMonth() + 1 : null;
}

/**
 * day() - Get day of month
 */
export function day(dateStr: string): number | null {
    const date = parseDate(dateStr);
    return date ? date.getDate() : null;
}

/**
 * hour() - Get hour (0-23)
 */
export function hour(dateStr: string): number | null {
    const date = parseDate(dateStr);
    return date ? date.getHours() : null;
}

/**
 * minute() - Get minute
 */
export function minute(dateStr: string): number | null {
    const date = parseDate(dateStr);
    return date ? date.getMinutes() : null;
}

/**
 * second() - Get second
 */
export function second(dateStr: string): number | null {
    const date = parseDate(dateStr);
    return date ? date.getSeconds() : null;
}

/**
 * millisecond() - Get millisecond
 */
export function millisecond(dateStr: string): number | null {
    const date = parseDate(dateStr);
    return date ? date.getMilliseconds() : null;
}

/**
 * dayOfWeek() - Get day of week (0 = Sunday, 6 = Saturday)
 */
export function dayOfWeek(dateStr: string): number | null {
    const date = parseDate(dateStr);
    return date ? date.getDay() : null;
}

/**
 * dayOfYear() - Get day of year (1-366)
 */
export function dayOfYear(dateStr: string): number | null {
    const date = parseDate(dateStr);
    if (!date) return null;

    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
}

/**
 * weekOfYear() - Get week of year (ISO 8601)
 */
export function weekOfYear(dateStr: string): number | null {
    const date = parseDate(dateStr);
    if (!date) return null;

    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * quarter() - Get quarter (1-4)
 */
export function quarter(dateStr: string): number | null {
    const m = month(dateStr);
    return m ? Math.ceil(m / 3) : null;
}

/**
 * isLeapYear() - Check if year is a leap year
 */
export function isLeapYear(dateStr: string): boolean | null {
    const y = year(dateStr);
    if (y === null) return null;
    return (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);
}

/**
 * daysInMonth() - Get number of days in the month
 */
export function daysInMonth(dateStr: string): number | null {
    const date = parseDate(dateStr);
    if (!date) return null;
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

/**
 * timestamp() - Get Unix timestamp (milliseconds)
 */
export function timestamp(dateStr: string): number | null {
    const date = parseDate(dateStr);
    return date ? date.getTime() : null;
}

/**
 * toISOString() - Convert to ISO 8601 string
 */
export function toISOString(dateStr: string): string | null {
    const date = parseDate(dateStr);
    return date ? date.toISOString() : null;
}

/**
 * toDateString() - Convert to date part only
 */
export function toDateString(dateStr: string): string | null {
    const date = parseDate(dateStr);
    return date ? date.toISOString().split('T')[0] : null;
}

/**
 * toTimeString() - Convert to time part only
 */
export function toTimeString(dateStr: string): string | null {
    const date = parseDate(dateStr);
    return date ? date.toISOString().split('T')[1].replace('Z', '') : null;
}

/**
 * addDays(n) - Add n days
 */
export function addDays(dateStr: string, n: number): string | null {
    const date = parseDate(dateStr);
    if (!date) return null;
    date.setDate(date.getDate() + n);
    return date.toISOString();
}

/**
 * addMonths(n) - Add n months
 */
export function addMonths(dateStr: string, n: number): string | null {
    const date = parseDate(dateStr);
    if (!date) return null;
    date.setMonth(date.getMonth() + n);
    return date.toISOString();
}

/**
 * addYears(n) - Add n years
 */
export function addYears(dateStr: string, n: number): string | null {
    const date = parseDate(dateStr);
    if (!date) return null;
    date.setFullYear(date.getFullYear() + n);
    return date.toISOString();
}

/**
 * addHours(n) - Add n hours
 */
export function addHours(dateStr: string, n: number): string | null {
    const date = parseDate(dateStr);
    if (!date) return null;
    date.setHours(date.getHours() + n);
    return date.toISOString();
}

/**
 * addMinutes(n) - Add n minutes
 */
export function addMinutes(dateStr: string, n: number): string | null {
    const date = parseDate(dateStr);
    if (!date) return null;
    date.setMinutes(date.getMinutes() + n);
    return date.toISOString();
}

/**
 * addSeconds(n) - Add n seconds
 */
export function addSeconds(dateStr: string, n: number): string | null {
    const date = parseDate(dateStr);
    if (!date) return null;
    date.setSeconds(date.getSeconds() + n);
    return date.toISOString();
}

/**
 * startOfDay() - Set to start of day
 */
export function startOfDay(dateStr: string): string | null {
    const date = parseDate(dateStr);
    if (!date) return null;
    date.setHours(0, 0, 0, 0);
    return date.toISOString();
}

/**
 * endOfDay() - Set to end of day
 */
export function endOfDay(dateStr: string): string | null {
    const date = parseDate(dateStr);
    if (!date) return null;
    date.setHours(23, 59, 59, 999);
    return date.toISOString();
}

/**
 * startOfMonth() - Set to start of month
 */
export function startOfMonth(dateStr: string): string | null {
    const date = parseDate(dateStr);
    if (!date) return null;
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    return date.toISOString();
}

/**
 * endOfMonth() - Set to end of month
 */
export function endOfMonth(dateStr: string): string | null {
    const date = parseDate(dateStr);
    if (!date) return null;
    date.setMonth(date.getMonth() + 1, 0);
    date.setHours(23, 59, 59, 999);
    return date.toISOString();
}

/**
 * startOfYear() - Set to start of year
 */
export function startOfYear(dateStr: string): string | null {
    const date = parseDate(dateStr);
    if (!date) return null;
    date.setMonth(0, 1);
    date.setHours(0, 0, 0, 0);
    return date.toISOString();
}

/**
 * endOfYear() - Set to end of year
 */
export function endOfYear(dateStr: string): string | null {
    const date = parseDate(dateStr);
    if (!date) return null;
    date.setMonth(11, 31);
    date.setHours(23, 59, 59, 999);
    return date.toISOString();
}

/**
 * diffDays(other) - Difference in days
 */
export function diffDays(dateStr1: string, dateStr2: string): number | null {
    const date1 = parseDate(dateStr1);
    const date2 = parseDate(dateStr2);
    if (!date1 || !date2) return null;

    const diff = date1.getTime() - date2.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * diffMonths(other) - Difference in months
 */
export function diffMonths(dateStr1: string, dateStr2: string): number | null {
    const date1 = parseDate(dateStr1);
    const date2 = parseDate(dateStr2);
    if (!date1 || !date2) return null;

    return (date1.getFullYear() - date2.getFullYear()) * 12 +
           (date1.getMonth() - date2.getMonth());
}

/**
 * diffYears(other) - Difference in years
 */
export function diffYears(dateStr1: string, dateStr2: string): number | null {
    const date1 = parseDate(dateStr1);
    const date2 = parseDate(dateStr2);
    if (!date1 || !date2) return null;

    return date1.getFullYear() - date2.getFullYear();
}

/**
 * isBefore(other) - Check if date is before another
 */
export function isBefore(dateStr1: string, dateStr2: string): boolean | null {
    const date1 = parseDate(dateStr1);
    const date2 = parseDate(dateStr2);
    if (!date1 || !date2) return null;

    return date1.getTime() < date2.getTime();
}

/**
 * isAfter(other) - Check if date is after another
 */
export function isAfter(dateStr1: string, dateStr2: string): boolean | null {
    const date1 = parseDate(dateStr1);
    const date2 = parseDate(dateStr2);
    if (!date1 || !date2) return null;

    return date1.getTime() > date2.getTime();
}

/**
 * isSameDay(other) - Check if same day
 */
export function isSameDay(dateStr1: string, dateStr2: string): boolean | null {
    const d1 = toDateString(dateStr1);
    const d2 = toDateString(dateStr2);
    if (!d1 || !d2) return null;

    return d1 === d2;
}

/**
 * format(pattern) - Format date with pattern
 * Supported: YYYY, MM, DD, HH, mm, ss
 */
export function format(dateStr: string, pattern: string): string | null {
    const date = parseDate(dateStr);
    if (!date) return null;

    return pattern
        .replace('YYYY', String(date.getFullYear()))
        .replace('MM', String(date.getMonth() + 1).padStart(2, '0'))
        .replace('DD', String(date.getDate()).padStart(2, '0'))
        .replace('HH', String(date.getHours()).padStart(2, '0'))
        .replace('mm', String(date.getMinutes()).padStart(2, '0'))
        .replace('ss', String(date.getSeconds()).padStart(2, '0'));
}

// ============================================
// DATE CONSTRUCTOR FUNCTIONS
// ============================================

/**
 * now() - Current date/time as ISO string
 */
export function now(): string {
    return new Date().toISOString();
}

/**
 * today() - Today's date (start of day) as ISO string
 */
export function today(): string {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date.toISOString();
}

/**
 * date(year, month, day) - Create date from parts
 */
export function date(y: number, m: number, d: number): string {
    return new Date(y, m - 1, d).toISOString();
}

/**
 * datetime(year, month, day, hour, minute, second) - Create datetime from parts
 */
export function datetime(
    y: number,
    m: number,
    d: number,
    h: number = 0,
    min: number = 0,
    s: number = 0
): string {
    return new Date(y, m - 1, d, h, min, s).toISOString();
}

/**
 * parseDate(string, format?) - Parse date from string
 */
export function parseDateString(str: string): string | null {
    const date = parseDate(str);
    return date ? date.toISOString() : null;
}

// ============================================
// REGISTER DATE BUILTINS
// ============================================

/**
 * Get date method by name
 */
export function getDateMethod(name: string): ((...args: any[]) => JjelValue) | undefined {
    const methods: Record<string, (...args: any[]) => JjelValue> = {
        year,
        month,
        day,
        hour,
        minute,
        second,
        millisecond,
        dayOfWeek,
        dayOfYear,
        weekOfYear,
        quarter,
        isLeapYear,
        daysInMonth,
        timestamp,
        toISOString,
        toDateString,
        toTimeString,
        addDays,
        addMonths,
        addYears,
        addHours,
        addMinutes,
        addSeconds,
        startOfDay,
        endOfDay,
        startOfMonth,
        endOfMonth,
        startOfYear,
        endOfYear,
        diffDays,
        diffMonths,
        diffYears,
        isBefore,
        isAfter,
        isSameDay,
        format
    };

    return methods[name];
}

/**
 * Get date constructor function by name
 */
export function getDateConstructor(name: string): ((...args: any[]) => JjelValue) | undefined {
    const constructors: Record<string, (...args: any[]) => JjelValue> = {
        now,
        today,
        date,
        datetime,
        parseDate: parseDateString
    };

    return constructors[name];
}
