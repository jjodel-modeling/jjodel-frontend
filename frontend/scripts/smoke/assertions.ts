/**
 * assertions.ts — DOM measurement, the four smoke assertions, and the console
 * baseline comparison.
 *
 * Nothing here decides a threshold: every bound comes from states.ts.
 */

import type { Page } from '@playwright/test';
import { CANVAS_MAIN_RATIO_MIN, FIXED_ALLOWLIST, STATUSBAR_INTERSECT_TOLERANCE_PX } from './states.ts';

export interface Rect {
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface FixedElement {
    selector: string;
    rect: Rect;
    zIndex: string;
    allowlisted: boolean;
    /** Width and height of the overlap with the status bar, 0 when disjoint. */
    overlapW: number;
    overlapH: number;
}

export interface Measurements {
    viewport: Rect;
    canvas: Rect | null;
    main: Rect | null;
    reactFlowCount: number;
    statusbar: Rect | null;
    statusbarPosition: string | null;
    canvasOverMainRatio: number | null;
    nodeCount: number;
    edgeCount: number;
    minimapCount: number;
    fixedElements: FixedElement[];
}

export type AssertionStatus = 'passed' | 'failed' | 'skipped';

export interface AssertionResult {
    id: string;
    title: string;
    status: AssertionStatus;
    /** Always populated, including on pass: the measured value is the point. */
    detail: string;
}

/** Collects every measurement in one browser round-trip. */
export async function measure(
    page: Page,
    allowlist: string[],
    tolerancePx: number,
): Promise<Measurements> {
    return (await page.evaluate(
        (args: { allowlist: string[]; tolerancePx: number }) => {
            const toRect = (el: Element) => {
                const r = el.getBoundingClientRect();
                return { x: r.x, y: r.y, w: r.width, h: r.height };
            };
            const rectOf = (sel: string) => {
                const el = document.querySelector(sel);
                return el ? toRect(el) : null;
            };

            // A short, human-identifiable selector for an arbitrary element.
            const describe = (el: Element): string => {
                const tag = el.tagName.toLowerCase();
                const id = el.id ? `#${el.id}` : '';
                const cls =
                    typeof el.className === 'string' && el.className.trim()
                        ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.')
                        : '';
                return `${tag}${id}${cls}`;
            };

            const statusbarEl = document.querySelector('.app-statusbar');
            const sbRect = statusbarEl ? toRect(statusbarEl) : null;

            const fixedElements = [];
            for (const el of Array.from(document.querySelectorAll('*'))) {
                const cs = window.getComputedStyle(el);
                if (cs.position !== 'fixed') continue;
                const r = toRect(el);
                if (r.w === 0 || r.h === 0) continue;
                if (cs.visibility === 'hidden' || cs.display === 'none' || cs.opacity === '0') continue;

                // Exact match only. With '#root' in the list, an ancestor-based
                // match (closest) would exempt every element in the document.
                let allowlisted = false;
                for (const sel of args.allowlist) {
                    try {
                        if (el.matches(sel)) {
                            allowlisted = true;
                            break;
                        }
                    } catch {
                        // An invalid selector must not silently exempt anything.
                    }
                }

                let overlapW = 0;
                let overlapH = 0;
                if (sbRect) {
                    overlapW = Math.min(r.x + r.w, sbRect.x + sbRect.w) - Math.max(r.x, sbRect.x);
                    overlapH = Math.min(r.y + r.h, sbRect.y + sbRect.h) - Math.max(r.y, sbRect.y);
                    if (overlapW <= args.tolerancePx || overlapH <= args.tolerancePx) {
                        overlapW = 0;
                        overlapH = 0;
                    }
                }

                fixedElements.push({
                    selector: describe(el),
                    rect: r,
                    zIndex: cs.zIndex,
                    allowlisted,
                    overlapW,
                    overlapH,
                });
            }

            const canvas = rectOf('.editor-v2__canvas');
            const main = rectOf('.editor-v2__main');

            return {
                viewport: { x: 0, y: 0, w: window.innerWidth, h: window.innerHeight },
                canvas,
                main,
                reactFlowCount: document.querySelectorAll('.react-flow').length,
                statusbar: sbRect,
                statusbarPosition: statusbarEl ? window.getComputedStyle(statusbarEl).position : null,
                canvasOverMainRatio: canvas && main && main.w > 0 ? canvas.w / main.w : null,
                nodeCount: document.querySelectorAll('.react-flow__node').length,
                edgeCount: document.querySelectorAll('.react-flow__edge').length,
                minimapCount: document.querySelectorAll('.react-flow__minimap').length,
                fixedElements,
            };
        },
        { allowlist, tolerancePx },
    )) as Measurements;
}

function fmtRect(r: Rect | null): string {
    if (!r) return 'ABSENT';
    return `x=${Math.round(r.x)} y=${Math.round(r.y)} w=${Math.round(r.w)} h=${Math.round(r.h)}`;
}

/** A1 — the editor structure is mounted. Proxy for the white screen. */
export function assertStructureMounted(m: Measurements): AssertionResult {
    const missing: string[] = [];
    if (!m.canvas) missing.push('.editor-v2__canvas');
    if (!m.main) missing.push('.editor-v2__main');
    if (m.reactFlowCount === 0) missing.push('.react-flow');

    return {
        id: 'A1',
        title: 'editor structure mounted',
        status: missing.length === 0 ? 'passed' : 'failed',
        detail:
            missing.length === 0
                ? `.editor-v2__canvas, .editor-v2__main and .react-flow all present`
                : `missing: ${missing.join(', ')}`,
    };
}

/** A2 — the canvas has not collapsed relative to its container. */
export function assertCanvasGeometry(m: Measurements): AssertionResult {
    if (m.canvasOverMainRatio === null) {
        return {
            id: 'A2',
            title: 'canvas geometry',
            status: 'failed',
            detail: `cannot measure: canvas=${fmtRect(m.canvas)} main=${fmtRect(m.main)}`,
        };
    }
    const ratio = m.canvasOverMainRatio;
    return {
        id: 'A2',
        title: 'canvas geometry',
        status: ratio >= CANVAS_MAIN_RATIO_MIN ? 'passed' : 'failed',
        detail:
            `ratio = ${ratio.toFixed(4)} (min ${CANVAS_MAIN_RATIO_MIN}) — ` +
            `canvas ${fmtRect(m.canvas)}, main ${fmtRect(m.main)}`,
    };
}

/** A3 — nothing fixed and non-allowlisted sits over the status bar. */
export function assertNoStatusbarOverlay(m: Measurements): AssertionResult {
    if (!m.statusbar) {
        return {
            id: 'A3',
            title: 'no overlay on the status bar',
            status: 'failed',
            detail: '.app-statusbar not found — cannot evaluate',
        };
    }

    const offenders = m.fixedElements.filter(
        (f) => !f.allowlisted && f.overlapW > 0 && f.overlapH > 0,
    );
    const considered = m.fixedElements.filter((f) => !f.allowlisted).length;
    const exempted = m.fixedElements.length - considered;

    if (offenders.length === 0) {
        return {
            id: 'A3',
            title: 'no overlay on the status bar',
            status: 'passed',
            detail:
                `statusbar ${fmtRect(m.statusbar)} (position: ${m.statusbarPosition}); ` +
                `${m.fixedElements.length} visible fixed element(s), ${exempted} allowlisted, ` +
                `${considered} checked, 0 intersecting (tolerance ${STATUSBAR_INTERSECT_TOLERANCE_PX}px)`,
        };
    }

    const lines = offenders.map(
        (f) =>
            `      ${f.selector} — rect ${fmtRect(f.rect)} z=${f.zIndex || 'auto'} ` +
            `— overlap ${Math.round(f.overlapW)}x${Math.round(f.overlapH)}px`,
    );
    return {
        id: 'A3',
        title: 'no overlay on the status bar',
        status: 'failed',
        detail:
            `statusbar ${fmtRect(m.statusbar)}; ${offenders.length} offending element(s):\n` +
            lines.join('\n'),
    };
}

// ── Console baseline ────────────────────────────────────────────────────────

export interface ConsoleBaseline {
    generatedAt: string;
    commit: string;
    note: string;
    /** `<level>|<normalized pattern>` -> per-state count. */
    patterns: Record<string, Record<string, number>>;
}

/**
 * Normalizes a console message into a stable key.
 *
 * Newlines are collapsed first: most messages carry a multi-line stack trace,
 * and without collapsing, the 120-char truncation would cut inside the first
 * line and produce keys that differ run to run.
 *
 * Order matters: URLs before hashes before digits, since a URL contains both.
 */
export function normalizeConsoleKey(level: string, text: string): string {
    let s = text.replace(/\s+/g, ' ').trim();
    s = s.replace(/https?:\/\/[^\s)'"]+/g, '<URL>');
    s = s.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '<ID>');
    s = s.replace(/\b[0-9a-f]{8,}\b/gi, '<ID>');
    s = s.replace(/\d{4,}/g, '<N>');
    if (s.length > 120) s = s.slice(0, 120);
    return `${level}|${s}`;
}

/** Counts normalized console keys for one state. */
export function tallyConsole(logs: Array<{ type: string; text: string }>): Record<string, number> {
    const out: Record<string, number> = {};
    for (const l of logs) {
        const k = normalizeConsoleKey(l.type, l.text);
        out[k] = (out[k] ?? 0) + 1;
    }
    return out;
}

export interface ConsoleComparison {
    result: AssertionResult;
    /** Patterns whose count dropped below the baseline. Not a failure. */
    improvements: string[];
}

/**
 * A4 — no console regression against the committed baseline.
 *
 * Fails when a pattern absent from the baseline appears, or when an existing
 * pattern's count exceeds the baseline. A lower count never fails: it is
 * reported as an improvement so the baseline can be lowered.
 */
export function assertConsoleAgainstBaseline(
    stateId: string,
    observed: Record<string, number>,
    baseline: ConsoleBaseline,
): ConsoleComparison {
    const newPatterns: string[] = [];
    const exceeded: string[] = [];
    const improvements: string[] = [];

    for (const [key, count] of Object.entries(observed)) {
        const base = baseline.patterns[key]?.[stateId];
        if (base === undefined) {
            newPatterns.push(`      NEW (${count}x): ${key}`);
        } else if (count > base) {
            exceeded.push(`      WORSE: ${key} — baseline ${base}, observed ${count}`);
        } else if (count < base) {
            improvements.push(`      IMPROVED: ${key} — ${base} -> ${count}, lower the baseline`);
        }
    }

    // A baselined pattern that vanished entirely is also an improvement.
    for (const [key, perState] of Object.entries(baseline.patterns)) {
        const base = perState[stateId];
        if (base !== undefined && base > 0 && observed[key] === undefined) {
            improvements.push(`      IMPROVED: ${key} — ${base} -> 0, remove from the baseline`);
        }
    }

    const failed = newPatterns.length > 0 || exceeded.length > 0;
    const total = Object.values(observed).reduce((a, b) => a + b, 0);

    return {
        result: {
            id: 'A4',
            title: 'no console regression vs baseline',
            status: failed ? 'failed' : 'passed',
            detail: failed
                ? `${total} message(s), ${Object.keys(observed).length} distinct pattern(s); ` +
                  `${newPatterns.length} new, ${exceeded.length} above baseline:\n` +
                  [...newPatterns, ...exceeded].join('\n')
                : `${total} message(s), ${Object.keys(observed).length} distinct pattern(s), ` +
                  `all within baseline`,
        },
        improvements,
    };
}
