/**
 * Output-panel lines for the warnings of a JjTL run (#520). Kept out of JjtlDevelopmentEnv.tsx,
 * which imports monaco and cannot load in the test bench.
 */

/** Warnings printed one per line; the rest are counted, and all of them are in the Trace tab. */
export const MAX_LISTED_WARNINGS = 20;

export function formatRunWarnings(warnings: readonly string[] | undefined, max: number = MAX_LISTED_WARNINGS): string[] {
    if (!warnings || warnings.length === 0) return [];
    const lines = [`${warnings.length} warning(s):`];
    for (const w of warnings.slice(0, max)) lines.push(`Warning: ${w}`);
    if (warnings.length > max) lines.push(`... and ${warnings.length - max} more, listed in the Trace tab.`);
    return lines;
}
