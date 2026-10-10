/**
 * runner — runs generated JavaScript in a worker of its own (R-GEN-6, spec
 * 2026-10-10 §6, discovery 2026-10-10 §F.4, U6, P-2026-10-10-0950).
 *
 * One worker per run: created, sent the request, terminated on its reply, on
 * its error event or at the timeout (`DEFAULT_TIMEOUT_MS` unless the request
 * says otherwise), whichever comes first; nothing after that is listened to.
 * The line and column of an error are measured here, from the stack the worker
 * sends back, on the frames of the generated module only (`framesOf`).
 *
 * `createRunnerWorker` is the one place a worker is made: Vite emits
 * `runner.worker.ts` as an asset of its own from the `new Worker(new URL(…,
 * import.meta.url))` pattern, reachable only through this module. Tests pass a
 * worker of their own: the node bench has no `Worker` (vitest.config.ts).
 */

import { DEFAULT_TIMEOUT_MS, framesOf } from './protocol';
import type { RunError, RunErrorKind, RunRequest, RunResponse, WorkerReply } from './protocol';

/** What a worker's `error` event carries, as far as the runner reads it. */
export interface RunnerErrorEvent {
    readonly message?: string;
    readonly filename?: string;
    readonly lineno?: number;
    readonly colno?: number;
    preventDefault?(): void;
}

/** The part of `Worker` the runner uses. */
export interface RunnerWorker {
    postMessage(message: unknown): void;
    terminate(): void;
    onmessage: ((ev: { data: unknown }) => void) | null;
    onerror: ((ev: RunnerErrorEvent) => void) | null;
}

/** A fresh module worker on `runner.worker.ts`. */
export function createRunnerWorker(): RunnerWorker {
    return new Worker(new URL('./runner.worker.ts', import.meta.url), { type: 'module' }) as unknown as RunnerWorker;
}

function runError(kind: RunErrorKind, message: string): RunError {
    return { kind, message, line: null, column: null, frames: [] };
}

function responseOf(reply: unknown): RunResponse {
    if (reply === null || typeof reply !== 'object' || typeof (reply as WorkerReply).ok !== 'boolean') {
        return { ok: false, error: runError('worker', 'The worker replied with a message the runner does not understand.') };
    }
    const r = reply as WorkerReply;
    if (r.ok) return { ok: true, results: r.results };
    const frames = framesOf(r.stack, r.url);
    return {
        ok: false,
        error: {
            kind: r.kind,
            message: r.message,
            line: frames.length > 0 ? frames[0].line : null,
            column: frames.length > 0 ? frames[0].column : null,
            frames,
            ...(r.call !== undefined ? { call: r.call } : {}),
        },
    };
}

/** An error event: placed only when it comes from the generated module (a `blob:` URL), not from the worker's script. */
function workerError(ev: RunnerErrorEvent): RunError {
    const fromCode = typeof ev.filename === 'string' && ev.filename.startsWith('blob:') && typeof ev.lineno === 'number' && ev.lineno > 0;
    if (!fromCode) return runError('worker', ev.message || 'The worker reported an error.');
    const position = { line: ev.lineno as number, column: ev.colno ?? 0 };
    return { kind: 'worker', message: ev.message || 'The worker reported an error.', line: position.line, column: position.column, frames: [position] };
}

/** Runs the calls of `request` on its module in a new worker, and terminates it. Never rejects. */
export function runInWorker(request: RunRequest, createWorker: () => RunnerWorker = createRunnerWorker): Promise<RunResponse> {
    const timeoutMs = request.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    return new Promise(resolve => {
        let timer: ReturnType<typeof setTimeout> | undefined;
        let worker: RunnerWorker;
        try {
            worker = createWorker();
        } catch (error) {
            resolve({ ok: false, error: runError('worker', `The worker could not start: ${(error as Error)?.message ?? String(error)}`) });
            return;
        }
        let done = false;
        const finish = (response: RunResponse) => {
            if (done) return;
            done = true;
            clearTimeout(timer);
            worker.onmessage = null;
            worker.onerror = null;
            worker.terminate();
            resolve(response);
        };
        timer = setTimeout(() => finish({
            ok: false,
            error: runError('timeout', `The run did not finish in ${timeoutMs} ms: the worker was terminated.`),
        }), timeoutMs);
        worker.onmessage = ev => finish(responseOf(ev.data));
        worker.onerror = ev => {
            ev.preventDefault?.();
            finish({ ok: false, error: workerError(ev) });
        };
        worker.postMessage({ code: request.code, calls: request.calls });
    });
}
