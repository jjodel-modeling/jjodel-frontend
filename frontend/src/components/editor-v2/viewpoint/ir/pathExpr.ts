/**
 * pathExpr — the PathExpr grammar, parsed in one place.
 *
 * Moved verbatim out of irCompile.ts (risk R8, discovery 2026-08-03 §6.3/§7.3):
 * the compiler and the two authoring widgets each carried an independent parser
 * of the same language, so every grammar extension touched three sites and could
 * diverge in two of them silently.
 *
 * The parsing logic, the accepted input set and the thrown messages are
 * unchanged. The messages are not internal: validateIR reuses the compiler as a
 * validator and surfaces them in the authoring panel, so rewording one would
 * change what the user reads.
 *
 * Pure by contract: no React, no Redux, no runtime import from editor-v2. The
 * only dependency is the PathExpr type alias, erased at build.
 */

import type { PathExpr } from './irTypes';

/** Constructs forbidden in PathExpr (spec v1.1 §PathExpr). */
export const FORBIDDEN_PATH = /\?\.|\?\?|[?:()]/;
/** One step: $feature | value | values | values[N] */
export const STEP_RE = /^(\$[A-Za-z_][A-Za-z0-9_]*|value|values(\[\d+\])?)$/;

export interface ParsedPath {
    /** [{feature, accessor}] chain; v1 spike evaluates only the first hop (self). */
    steps: { feature?: string; take: 'value' | 'values' | number }[];
    featureNames: string[];
}

export function parsePathExpr(expr: PathExpr): ParsedPath {
    if (FORBIDDEN_PATH.test(expr)) {
        throw new Error(`[ir] forbidden construct in PathExpr: ${expr}`);
    }
    const tokens = expr.split('.').map(t => t.trim()).filter(Boolean);
    const steps: ParsedPath['steps'] = [];
    const featureNames: string[] = [];
    let current: { feature?: string; take: 'value' | 'values' | number } | null = null;
    for (const tok of tokens) {
        if (!STEP_RE.test(tok)) throw new Error(`[ir] invalid PathExpr step "${tok}" in ${expr}`);
        if (tok.startsWith('$')) {
            if (current) steps.push(current);
            const feature = tok.slice(1);
            featureNames.push(feature);
            current = { feature, take: 'value' };
        } else if (tok === 'value') {
            if (!current) throw new Error(`[ir] dangling .value in ${expr}`);
            current.take = 'value';
        } else { // values or values[N]
            if (!current) throw new Error(`[ir] dangling .values in ${expr}`);
            const m = tok.match(/^values\[(\d+)\]$/);
            current.take = m ? parseInt(m[1], 10) : 'values';
        }
    }
    if (current) steps.push(current);
    if (steps.length === 0) throw new Error(`[ir] empty PathExpr: ${expr}`);
    return { steps, featureNames };
}

/**
 * The single hop of `expr`, or null when `expr` is not a single-hop path.
 *
 * Derived from ParsedPath instead of from a private regex: that substitution is
 * the point of this module. Two properties the authoring widgets depend on:
 *
 * - Non-throwing. Both widgets render whatever the IR holds, including paths a
 *   hand-authored or imported IR may have left malformed. parsePathExpr throws
 *   by design (the compiler needs it to); the widgets need a neutral empty state
 *   instead, and this is where the conversion happens, once.
 * - Single-hop gate. Multi-hop returns null, so converging on the shared parser
 *   does not widen the authoring surface to multi-hop.
 */
export function singleHopOf(expr: string): { feature: string; take: 'value' | 'values' | number } | null {
    let parsed: ParsedPath;
    try {
        parsed = parsePathExpr(expr ?? '');
    } catch {
        return null;
    }
    if (parsed.steps.length !== 1) return null;
    const step = parsed.steps[0];
    if (!step.feature) return null;
    return { feature: step.feature, take: step.take };
}
