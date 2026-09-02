/**
 * assertions.ts — DOM measurement, the four smoke assertions, and the console
 * baseline comparison.
 *
 * Nothing here decides a threshold: every bound comes from states.ts.
 */

import type { Page } from '@playwright/test';
import {
    CANVAS_MAIN_RATIO_MIN,
    CHROME_GAP_TOLERANCE_PX,
    DOCK_PANEL_BORDER_PX,
    FIXED_ALLOWLIST,
    STATUSBAR_INTERSECT_TOLERANCE_PX,
} from './states.ts';

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
    /** A5 — le tre bande sopra la status bar, per il controllo di contiguita'. */
    appbar: Rect | null;
    toolbar: Rect | null;
    rail: Rect | null;
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
                appbar: rectOf('.nav-container.appbar'),
                toolbar: rectOf('.editor-v2-toolbar'),
                rail: rectOf('.properties-tree-overlay'),
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

/**
 * A5 — the chrome stack is contiguous: no gap between app bar, canvas toolbar,
 * right rail and status bar.
 *
 * Exists because the same defect came back twice in two months and nothing
 * watched it: the app bar went 60px -> 50px while two other sheets kept
 * subtracting 60, which pushed the rail 9.73px below the toolbar. Seams are
 * asserted as relations between measured rects, never as absolute values — an
 * absolute expectation inherits the model that produced it and fails without
 * saying what stopped matching.
 *
 * The app bar -> toolbar seam is the one legitimately non-zero gap: rc-dock's
 * .dock-panel border-top, DOCK_PANEL_BORDER_PX.
 */
export function assertChromeStackContiguous(m: Measurements): AssertionResult {
    const id = 'A5';
    const title = 'chrome stack contiguo: nessun vuoto fra app bar, toolbar, rail e status bar';

    const missing: string[] = [];
    if (!m.appbar) missing.push('.nav-container.appbar');
    if (!m.toolbar) missing.push('.editor-v2-toolbar');
    if (!m.rail) missing.push('.properties-tree-overlay');
    if (!m.statusbar) missing.push('.app-statusbar');
    if (missing.length > 0) {
        // Not a failure: a state that opens no project has no toolbar and no rail.
        return {
            id,
            title,
            status: 'skipped',
            detail: `absent in this state: ${missing.join(', ')}`,
        };
    }

    const appbar = m.appbar as Rect;
    const toolbar = m.toolbar as Rect;
    const rail = m.rail as Rect;
    const statusbar = m.statusbar as Rect;

    const seams = [
        {
            name: 'app bar -> toolbar',
            measured: toolbar.y - (appbar.y + appbar.h),
            expected: DOCK_PANEL_BORDER_PX,
            note: 'rc-dock .dock-panel border-top',
        },
        {
            name: 'toolbar -> rail',
            measured: rail.y - (toolbar.y + toolbar.h),
            expected: 0,
            note: 'flush',
        },
        {
            name: 'rail -> status bar',
            measured: statusbar.y - (rail.y + rail.h),
            expected: 0,
            note: 'flush',
        },
    ];

    const lines = seams.map(
        (s) =>
            `${s.name} = ${s.measured.toFixed(2)}px (atteso ${s.expected}, ${s.note})`,
    );
    const offenders = seams.filter(
        (s) => Math.abs(s.measured - s.expected) > CHROME_GAP_TOLERANCE_PX,
    );

    if (offenders.length === 0) {
        return {
            id,
            title,
            status: 'passed',
            detail: `${lines.join('; ')} — tolleranza ${CHROME_GAP_TOLERANCE_PX}px`,
        };
    }

    return {
        id,
        title,
        status: 'failed',
        detail:
            `${offenders.length} giunzione/i fuori tolleranza (${CHROME_GAP_TOLERANCE_PX}px):\n` +
            offenders
                .map(
                    (s) =>
                        `      ${s.name} = ${s.measured.toFixed(2)}px, atteso ${s.expected} ` +
                        `(scarto ${(s.measured - s.expected).toFixed(2)}px) — ${s.note}`,
                )
                .join('\n') +
            `\n      rects: appbar ${fmtRect(appbar)}; toolbar ${fmtRect(toolbar)}; ` +
            `rail ${fmtRect(rail)}; statusbar ${fmtRect(statusbar)}`,
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

/**
 * Keys the vite dev client writes into the page console. They are the harness
 * talking, not the application: `[vite] connecting...`, `[vite] connected.`,
 * `[vite] hot updated: …`.
 *
 * A4 ignores them, and this is not a softening of the gate — it is moving one
 * signal to the instrument that reads it properly. `hot updated` means somebody
 * saved a file while the run was in flight, which the quiescence guard declares
 * as a void run naming the file; repeated `connecting...` means the page booted
 * more than once, which countBoots declares as a void run naming the count.
 * Left inside A4 both arrived as "a console regression", which is the one thing
 * they are not.
 *
 * The prefix is deliberately `debug|`, not `[vite]` at any level: an
 * `error|[vite] Internal Server Error …` is the dev server failing to compile
 * the app, and that must still fail A4.
 */
export const VITE_CLIENT_KEY_PREFIX = 'debug|[vite] ';

export function isViteClientKey(key: string): boolean {
    return key.startsWith(VITE_CLIENT_KEY_PREFIX);
}

/**
 * How many times the document booted during one state.
 *
 * The vite client prints `[vite] connecting...` once per websocket setup, which
 * is once per document load. Measured 2026-08-30: 1 in every still run, 3 in a
 * run where two `touch`es on a module without an HMR boundary made vite issue
 * `full-reload` twice — the "counts at 3x the baseline" of the 30-08 report,
 * which is not a count that grew but the same count taken three times.
 *
 * Returns 0 when no vite client is present at all (a production build). That is
 * reported, never treated as a boot ceiling violation: this function measures
 * repetition, and it has nothing to say when the instrument is absent.
 */
export function countBoots(logs: Array<{ type: string; text: string }>): number {
    let n = 0;
    for (const l of logs) {
        if (l.type === 'debug' && l.text.startsWith('[vite] connecting...')) n++;
    }
    return n;
}

/** One document load per state. Anything above it makes the tally incomparable. */
export const MAX_BOOTS_PER_STATE = 1;

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
 *
 * Vite client keys are excluded on BOTH sides — observed and baseline. On the
 * observed side because they are not the application's output; on the baseline
 * side because the committed baseline contains three of them, and filtering
 * only one side would report every run as having lost a pattern. See
 * VITE_CLIENT_KEY_PREFIX for why this loses no signal.
 */
export function assertConsoleAgainstBaseline(
    stateId: string,
    observed: Record<string, number>,
    baseline: ConsoleBaseline,
): ConsoleComparison {
    const newPatterns: string[] = [];
    const exceeded: string[] = [];
    const improvements: string[] = [];
    let excluded = 0;

    for (const [key, count] of Object.entries(observed)) {
        if (isViteClientKey(key)) {
            excluded += count;
            continue;
        }
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
        if (isViteClientKey(key)) continue;
        const base = perState[stateId];
        if (base !== undefined && base > 0 && observed[key] === undefined) {
            improvements.push(`      IMPROVED: ${key} — ${base} -> 0, remove from the baseline`);
        }
    }

    const failed = newPatterns.length > 0 || exceeded.length > 0;
    const compared = Object.entries(observed).filter(([k]) => !isViteClientKey(k));
    const total = compared.reduce((a, [, count]) => a + count, 0);
    const viteNote = excluded > 0 ? `, ${excluded} vite-client message(s) excluded` : '';

    return {
        result: {
            id: 'A4',
            title: 'no console regression vs baseline',
            status: failed ? 'failed' : 'passed',
            detail: failed
                ? `${total} message(s), ${compared.length} distinct pattern(s)${viteNote}; ` +
                  `${newPatterns.length} new, ${exceeded.length} above baseline:\n` +
                  [...newPatterns, ...exceeded].join('\n')
                : `${total} message(s), ${compared.length} distinct pattern(s)${viteNote}, ` +
                  `all within baseline`,
        },
        improvements,
    };
}
