/**
 * protocol — the messages between the code panel's thread and the runner's
 * worker (R-GEN-6, discovery 2026-10-10 §F.4, P-2026-10-10-0950).
 *
 * One run: the code of one ES module and a sequence of calls to its exports,
 * in; one result per call, or the first error, out. The runner does not know
 * the shape of a generated program (R-GEN-11's `initial`, `step`, `observe` are
 * calls like any other). An error carries the line and column of the
 * generated code, measured on the main thread from the stack the worker sends
 * back (`framesOf`), so the code panel can map it to the fragment, and the
 * fragment to its model element (R-GEN-5).
 *
 * Pure: no imports; shared by `runner.ts` and `runner.worker.ts`.
 */

/** The timeout of a run when the request names none, in milliseconds. */
export const DEFAULT_TIMEOUT_MS = 2000;

export interface RunCall {
    /** The name of an export of the module. */
    readonly fn: string;
    /** Structured-cloneable arguments. */
    readonly args: readonly unknown[];
}

export interface RunRequest {
    /** The source of an ES module. */
    readonly code: string;
    readonly calls: readonly RunCall[];
    /** Default `DEFAULT_TIMEOUT_MS`. Load time counts. */
    readonly timeoutMs?: number;
}

/**
 * `load`: the module did not parse or did not evaluate. `export`: a call names
 * no exported function. `runtime`: a call threw. `result`: a result cannot be
 * cloned out of the worker. `timeout`: the worker was terminated. `sandbox`: a
 * network global could not be removed, so nothing ran. `worker`: the worker
 * itself reported an error (a script that failed to load, an uncaught throw
 * outside any call).
 */
export type RunErrorKind = 'load' | 'export' | 'runtime' | 'result' | 'timeout' | 'sandbox' | 'worker';

export interface SourcePosition {
    readonly line: number;
    readonly column: number;
}

export interface RunError {
    readonly kind: RunErrorKind;
    readonly message: string;
    /** The innermost frame in the generated code, 1-based; `null` when there is none. */
    readonly line: number | null;
    readonly column: number | null;
    /** Every frame in the generated code, innermost first. */
    readonly frames: readonly SourcePosition[];
    /** The index of the call that failed, when one did. */
    readonly call?: number;
}

export type RunResponse =
    | { readonly ok: true; readonly results: readonly unknown[] }
    | { readonly ok: false; readonly error: RunError };

/** What the worker posts back: the raw error, positions measured by the receiver. */
export type WorkerReply =
    | { readonly ok: true; readonly results: readonly unknown[] }
    | {
        readonly ok: false;
        readonly kind: Exclude<RunErrorKind, 'timeout' | 'worker'>;
        readonly message: string;
        /** `Error.stack` of the thrown value, when it has one. */
        readonly stack?: string;
        /** The URL the module was loaded from: the frames of the generated code are the ones on it. */
        readonly url?: string;
        readonly call?: number;
    };

function escapeRegExp(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * The frames of `stack` that lie in the module at `url`, innermost first:
 * `url:line:column` in V8's `at f (url:l:c)` and Firefox's `f@url:l:c` alike.
 */
export function framesOf(stack: string | undefined, url: string | undefined): SourcePosition[] {
    if (!stack || !url) return [];
    const re = new RegExp(`${escapeRegExp(url)}:(\\d+):(\\d+)`, 'g');
    const out: SourcePosition[] = [];
    for (const m of stack.matchAll(re)) out.push({ line: Number(m[1]), column: Number(m[2]) });
    return out;
}
