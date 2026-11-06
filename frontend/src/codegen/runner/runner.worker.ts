/**
 * runner.worker — the worker that runs generated code (R-GEN-6, discovery
 * 2026-10-10 §F.4, U6, P-2026-10-10-0950).
 *
 * In a worker, before anything else: capture `postMessage`, then remove the
 * network globals of `NETWORK_GLOBALS` from the global scope and its prototype
 * chain (`shadowNetwork`), then the names of `ESCAPE_GLOBALS` and the
 * navigator's `storage` (`shadowEscapes`, R-GEN-30), and `postMessage` itself,
 * so the generated code can neither reach the network through them nor forge a
 * reply. Then post `ready`:
 * the main thread starts the program's clock on it and sends the request. On
 * that one message, load the code as an ES module from a `blob:` URL and run
 * the calls in order (`executeRun`). The main thread terminates the worker at
 * the timeout and after the reply: one worker per run (`runner.ts`).
 *
 * A worker has no DOM by construction. The network removal is best effort, not
 * a security boundary (U6): a dynamic `import()` can still reach out (a nested
 * `Worker`, `caches` and `navigator.storage` are removed since S7), and a hard
 * guarantee needs a CSP
 * on this script's response (`connect-src 'none'`), which is a deployment
 * matter outside the pilot's files. If a name cannot be removed, nothing runs.
 *
 * Outside a worker (the node test bench) importing this module does nothing:
 * `shadowNetwork`, `executeRun` and `bootWorker` are exported to be tested there.
 */

import { WORKER_READY } from './protocol';
import type { RunRequest, WorkerReply } from './protocol';

/** The globals that reach the network or persistent storage (discovery §F.4). */
export const NETWORK_GLOBALS = [
    'fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'importScripts', 'WebTransport', 'BroadcastChannel', 'indexedDB',
] as const;

/**
 * The globals that start a fresh scope with the network or fetch through a cache
 * (discovery 2026-10-23 §4.3, R-GEN-30): removed like the network ones.
 */
export const ESCAPE_GLOBALS = ['Worker', 'SharedWorker', 'caches'] as const;

/** The members of the scope's `navigator` that reach persistent storage (R-GEN-30). */
export const NAVIGATOR_MEMBERS = ['storage'] as const;

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

/**
 * `shadowGlobals` over `ESCAPE_GLOBALS` on `scope`, then over `NAVIGATOR_MEMBERS`
 * on its `navigator` and that object's prototype chain. Returns the names still
 * reached, the navigator's as `navigator.<name>`.
 */
export function shadowEscapes(scope: object): string[] {
    const left = shadowGlobals(scope, ESCAPE_GLOBALS);
    const nav = (scope as Record<string, unknown>).navigator;
    if (nav === null || typeof nav !== 'object') return left;
    return [...left, ...shadowGlobals(nav, NAVIGATOR_MEMBERS).map(name => `navigator.${name}`)];
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

export interface WorkerScope {
    postMessage(message: unknown): void;
    onmessage: ((ev: MessageEvent) => void) | null;
}

function inWorker(g: any): boolean {
    const W = g.WorkerGlobalScope;
    return typeof W === 'function' && g instanceof W;
}

/**
 * What a worker does when it starts: the sandbox, the one handler of the run, then `ready`. `ready` goes last, by the
 * `postMessage` captured before it was removed, so when the main thread sees it the sandbox is in place and nothing
 * of the generated code has been evaluated.
 */
export function bootWorker(scope: WorkerScope, load: ModuleLoader = blobLoader): void {
    // Captured before the code can touch it, then removed, so only these messages leave the worker.
    const post = scope.postMessage.bind(scope);
    const unshadowed = [...shadowNetwork(scope), ...shadowEscapes(scope), ...shadowGlobals(scope, ['postMessage'])];
    let started = false;
    scope.onmessage = (ev: MessageEvent) => {
        if (started) return;
        started = true;
        void executeRun(ev.data as RunRequest, load, unshadowed).then(post);
    };
    post(WORKER_READY);
}

if (inWorker(globalThis)) bootWorker(globalThis as unknown as WorkerScope);
