/**
 * protocol — the messages between the code panel's thread and the runner's
 * worker (R-GEN-6, discovery 2026-10-10 §F.4, P-2026-10-10-0950).
 *
 * One run: the code of one ES module and a sequence of calls to its exports,
 * in, once the worker has said `ready`; one result per call, or the first
 * error, out. The runner does not know
 * the shape of a generated program (R-GEN-11's `initial`, `step`, `observe` are
 * calls like any other). An error carries the line and column of the
 * generated code, measured on the main thread from the stack the worker sends
 * back (`framesOf`), so the code panel can map it to the fragment, and the
 * fragment to its model element (R-GEN-5).
 *
 * Pure: no imports; shared by `runner.ts` and `runner.worker.ts`.
 */

/** The timeout of a run when the request names none, in milliseconds. Counted from the worker's `ready`. */
export const DEFAULT_TIMEOUT_MS = 2000;

/**
 * The bound on a worker's start-up, in milliseconds: from its creation to its `ready`. Apart from the program's
 * timeout, which starts on `ready`, so that a cold dev server compiling the worker module (6-48 s measured, ticket of
 * P-2026-10-10-0950) is not charged to the code. A worker that has not said `ready` by then is terminated, and the
 * error says the runner did not start.
 */
export const STARTUP_TIMEOUT_MS = 30000;

/**
 * What the worker posts once, when its sandbox is in place and before it evaluates anything. The runner sends the
 * request and starts the program's clock when it arrives.
 */
export interface WorkerReady {
    readonly ready: true;
}

export const WORKER_READY: WorkerReady = { ready: true };

export function isWorkerReady(message: unknown): message is WorkerReady {
    return message !== null && typeof message === 'object' && (message as WorkerReady).ready === true;
}

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
    /** Default `DEFAULT_TIMEOUT_MS`. Counted from the worker's `ready`: load time of the module counts, the worker's start-up does not. */
    readonly timeoutMs?: number;
}

/**
 * `load`: the module did not parse or did not evaluate. `export`: a call names
 * no exported function. `runtime`: a call threw. `result`: a result cannot be
 * cloned out of the worker. `timeout`: the worker was terminated. `sandbox`: a
 * network global could not be removed, so nothing ran. `worker`: the worker
 * itself reported an error (a script that failed to load, an uncaught throw
 * outside any call), or did not become ready within `STARTUP_TIMEOUT_MS`.
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
