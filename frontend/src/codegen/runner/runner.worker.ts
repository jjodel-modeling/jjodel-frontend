/**
 * runner.worker — the worker that runs generated code (R-GEN-6, discovery
 * 2026-10-10 §F.4, U6, P-2026-10-10-0950).
 *
 * In a worker, before anything else: capture `postMessage`, then remove the
 * network globals of `NETWORK_GLOBALS` from the global scope and its prototype
 * chain (`shadowNetwork`), and `postMessage` itself, so the generated code can
 * neither reach the network through them nor forge a reply. Then, on the one
 * message of the run, load the code as an ES module from a `blob:` URL and run
 * the calls in order (`executeRun`). The main thread terminates the worker at
 * the timeout and after the reply: one worker per run (`runner.ts`).
 *
 * A worker has no DOM by construction. The network removal is best effort, not
 * a security boundary (U6): a dynamic `import()`, a nested `Worker` or the
 * prototype of the scope can still reach out, and a hard guarantee needs a CSP
 * on this script's response (`connect-src 'none'`), which is a deployment
 * matter outside the pilot's files. If a name cannot be removed, nothing runs.
 *
 * Outside a worker (the node test bench) importing this module does nothing:
 * `shadowNetwork` and `executeRun` are exported to be tested there.
 */

import type { RunRequest, WorkerReply } from './protocol';

/** The globals that reach the network or persistent storage (discovery §F.4). */
export const NETWORK_GLOBALS = [
    'fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'importScripts', 'WebTransport', 'BroadcastChannel', 'indexedDB',
] as const;

/**
 * Removes each name from `scope` and from every object of its prototype chain;
 * where a property cannot be deleted, shadows it with `undefined` on `scope`.
 * Returns the names `scope` still reaches.
 */
export function shadowGlobals(scope: object, names: readonly string[]): string[] {
    const s = scope as Record<string, unknown>;
    for (const name of names) {
        for (let o: object | null = scope; o !== null; o = Object.getPrototypeOf(o)) {
            if (!Object.prototype.hasOwnProperty.call(o, name)) continue;
            try {
                delete (o as Record<string, unknown>)[name];
            } catch {
                // non-configurable: shadowed below
            }
        }
        if (s[name] === undefined) continue;
        try {
            Object.defineProperty(scope, name, { value: undefined });
        } catch {
            try {
                s[name] = undefined;
            } catch {
                // neither: reported below
            }
        }
    }
    return names.filter(name => s[name] !== undefined);
}

/** `shadowGlobals` over `NETWORK_GLOBALS`. */
export function shadowNetwork(scope: object): string[] {
    return shadowGlobals(scope, NETWORK_GLOBALS);
}

/** Loads the code as an ES module: the URL at once, so a throw while loading can be placed; the namespace later. */
export type ModuleLoader = (code: string) => { readonly url: string; readonly module: Promise<Record<string, unknown>> };

/** The worker's loader: a `blob:` URL of the code, imported. */
export const blobLoader: ModuleLoader = code => {
    const url = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
    return { url, module: import(/* @vite-ignore */ url) };
};

function failure(kind: 'load' | 'runtime', error: unknown, url: string | undefined, call?: number): WorkerReply {
    const e: any = error;
    const isError = e !== null && typeof e === 'object' && typeof e.message === 'string';
    return {
        ok: false,
        kind,
        message: isError ? `${e.name ?? 'Error'}: ${e.message}` : String(e),
        ...(isError && typeof e.stack === 'string' ? { stack: e.stack } : {}),
        ...(url !== undefined ? { url } : {}),
        ...(call !== undefined ? { call } : {}),
    };
}

/**
 * One run: refuse when the sandbox left a name reachable, load the module,
 * then each call in order, its result cloned at once (a later call may change
 * what an earlier one returned). The first failure ends the run.
 */
export async function executeRun(request: RunRequest, load: ModuleLoader, unshadowed: readonly string[] = []): Promise<WorkerReply> {
    if (unshadowed.length > 0) {
        return { ok: false, kind: 'sandbox', message: `The sandbox could not remove ${unshadowed.join(', ')}: nothing ran.` };
    }
    let url: string | undefined;
    let module: Record<string, unknown>;
    try {
        const loaded = load(request.code);
        url = loaded.url;
        module = await loaded.module;
    } catch (error) {
        return failure('load', error, url);
    }
    const results: unknown[] = [];
    for (let i = 0; i < request.calls.length; i++) {
        const { fn, args } = request.calls[i];
        const f = Object.prototype.hasOwnProperty.call(module, fn) ? module[fn] : undefined;
        if (typeof f !== 'function') return { ok: false, kind: 'export', message: `The module exports no function '${fn}'.`, call: i };
        let value: unknown;
        try {
            value = await f(...args);
        } catch (error) {
            return failure('runtime', error, url, i);
        }
        try {
            results.push(structuredClone(value));
        } catch (error) {
            return { ok: false, kind: 'result', message: `The result of '${fn}' cannot leave the worker: ${(error as Error)?.message ?? String(error)}`, call: i };
        }
    }
    return { ok: true, results };
}

interface WorkerScope {
    postMessage(message: unknown): void;
    onmessage: ((ev: MessageEvent) => void) | null;
}

function inWorker(g: any): boolean {
    const W = g.WorkerGlobalScope;
    return typeof W === 'function' && g instanceof W;
}

if (inWorker(globalThis)) {
    const scope = globalThis as unknown as WorkerScope;
    // Captured before the code can touch it, then removed, so only this reply leaves the worker.
    const post = scope.postMessage.bind(scope);
    const unshadowed = [...shadowNetwork(scope), ...shadowGlobals(scope, ['postMessage'])];
    let started = false;
    scope.onmessage = (ev: MessageEvent) => {
        if (started) return;
        started = true;
        void executeRun(ev.data as RunRequest, blobLoader, unshadowed).then(post);
    };
}
