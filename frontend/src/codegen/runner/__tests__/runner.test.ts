/**
 * runner — the sandboxed runner of the JavaScript target profile (R-GEN-6,
 * discovery 2026-10-10 §F.4, P-2026-10-10-0950).
 *
 * The vitest environment is `node` and has no `Worker` (vitest.config.ts), so
 * the transport is faked and nothing else is: `FakeWorker` hands each request
 * to the worker's own `executeRun`, which loads the code as a real ES module
 * (a `data:` URL, where the browser worker uses a `blob:` one) and runs the
 * calls; `runInWorker` measures the position of an error from the real V8
 * stack. A real worker in a real browser is the probe's
 * (`frontend/scripts/probe/codegen-runner.ts`). Each test name says which
 * break kills it; the bench is in the commit message.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { DEFAULT_TIMEOUT_MS, framesOf } from '../protocol';
import type { RunRequest, RunResponse, WorkerReply } from '../protocol';
import { runInWorker } from '../runner';
import type { RunnerErrorEvent, RunnerWorker } from '../runner';
import { NETWORK_GLOBALS, executeRun, shadowNetwork } from '../runner.worker';
import type { ModuleLoader } from '../runner.worker';

let loads = 0;

/** A real ES module from the code: a fresh URL per load, so no module state survives between runs. */
const dataLoader: ModuleLoader = code => {
    const url = 'data:text/javascript;base64,' + Buffer.from(`${code}\n// load ${++loads}\n`).toString('base64');
    return { url, module: import(/* @vite-ignore */ url) };
};

type Behaviour = 'execute' | 'silent' | ((w: FakeWorker, request: RunRequest) => void);

/** The transport of a Worker, and nothing else: no structured clone, so the worker's own clone is what a test sees. */
class FakeWorker implements RunnerWorker {
    onmessage: ((ev: { data: unknown }) => void) | null = null;
    onerror: ((ev: RunnerErrorEvent) => void) | null = null;
    terminated = 0;
    readonly posted: unknown[] = [];

    constructor(private readonly behaviour: Behaviour, private readonly unshadowed: readonly string[] = []) {}

    postMessage(message: unknown): void {
        this.posted.push(message);
        const request = message as RunRequest;
        if (this.behaviour === 'silent') return;
        if (this.behaviour === 'execute') {
            void executeRun(request, dataLoader, this.unshadowed).then(reply => this.deliver(reply));
            return;
        }
        this.behaviour(this, request);
    }

    /** A terminated worker delivers nothing. */
    deliver(reply: WorkerReply): void {
        if (this.terminated === 0) this.onmessage?.({ data: reply });
    }

    terminate(): void {
        this.terminated++;
    }
}

function factory(behaviour: Behaviour = 'execute', unshadowed: readonly string[] = []): { create: () => RunnerWorker; workers: FakeWorker[] } {
    const workers: FakeWorker[] = [];
    return {
        workers,
        create: () => {
            const w = new FakeWorker(behaviour, unshadowed);
            workers.push(w);
            return w;
        },
    };
}

function errorOf(r: RunResponse) {
    if (r.ok) throw new Error(`expected an error, got ${JSON.stringify(r)}`);
    return r.error;
}

afterEach(() => {
    vi.useRealTimers();
});

const MODULE = [
    'export function inc(x) { return x + 1; }',
    'export function pair(a, b) { return [a, b]; }',
    'export async function later(x) { return x * 10; }',
    'const box = { n: 0 };',
    'export function bump() { box.n++; return box; }',
    'export function fn() { return () => 1; }',
].join('\n');

describe('runInWorker: the protocol over a worker', () => {
    it('a sequence of calls answers one result per call, in order', async () => {
        const f = factory();
        const r = await runInWorker({ code: MODULE, calls: [{ fn: 'inc', args: [1] }, { fn: 'inc', args: [41] }, { fn: 'pair', args: ['a', 2] }] }, f.create);
        expect(r).toEqual({ ok: true, results: [2, 42, ['a', 2]] });
        expect(f.workers[0].posted).toEqual([{ code: MODULE, calls: [{ fn: 'inc', args: [1] }, { fn: 'inc', args: [41] }, { fn: 'pair', args: ['a', 2] }] }]);
    });

    it('each result is the value at its call, not at the end of the run (mutant: the per-call clone dropped)', async () => {
        const r = await runInWorker({ code: MODULE, calls: [{ fn: 'bump', args: [] }, { fn: 'bump', args: [] }] }, factory().create);
        expect(r).toEqual({ ok: true, results: [{ n: 1 }, { n: 2 }] });
    });

    it('an async export is awaited', async () => {
        const r = await runInWorker({ code: MODULE, calls: [{ fn: 'later', args: [4] }] }, factory().create);
        expect(r).toEqual({ ok: true, results: [40] });
    });

    it('no calls is an empty list of results', async () => {
        expect(await runInWorker({ code: MODULE, calls: [] }, factory().create)).toEqual({ ok: true, results: [] });
    });

    it('a runtime error carries the generated line and column and the index of its call (mutant: position not measured)', async () => {
        const code = [
            'export function ok() { return 1; }',
            'export function boom(x) {',
            '  const y = x * 2;',
            '  throw new Error("boom " + y);',
            '}',
        ].join('\n');
        const e = errorOf(await runInWorker({ code, calls: [{ fn: 'ok', args: [] }, { fn: 'boom', args: [3] }] }, factory().create));
        expect(e.kind).toBe('runtime');
        expect(e.call).toBe(1);
        expect(e.message).toContain('boom 6');
        expect([e.line, e.column]).toEqual([4, 9]);
        expect(e.frames[0]).toEqual({ line: 4, column: 9 });
    });

    it('the frames list every generated frame, innermost first', async () => {
        const code = [
            'function inner() {',
            '  return null.x;',
            '}',
            'export function outer() {',
            '  return inner();',
            '}',
        ].join('\n');
        const e = errorOf(await runInWorker({ code, calls: [{ fn: 'outer', args: [] }] }, factory().create));
        expect(e.frames.map(f => f.line)).toEqual([2, 5]);
    });

    it('a thrown value that is not an Error has no position', async () => {
        const e = errorOf(await runInWorker({ code: 'export function f() { throw "plain"; }', calls: [{ fn: 'f', args: [] }] }, factory().create));
        expect(e).toMatchObject({ kind: 'runtime', message: 'plain', line: null, column: null, frames: [], call: 0 });
    });

    it('code that does not parse is a load error', async () => {
        const e = errorOf(await runInWorker({ code: 'export function f( {', calls: [{ fn: 'f', args: [] }] }, factory().create));
        expect(e.kind).toBe('load');
        expect(e.call).toBeUndefined();
    });

    it('a call to a name the module does not export is an export error', async () => {
        const e = errorOf(await runInWorker({ code: MODULE, calls: [{ fn: 'inc', args: [1] }, { fn: 'nope', args: [] }] }, factory().create));
        expect(e).toMatchObject({ kind: 'export', call: 1 });
    });

    it('a result that cannot be cloned is a result error', async () => {
        const e = errorOf(await runInWorker({ code: MODULE, calls: [{ fn: 'fn', args: [] }] }, factory().create));
        expect(e).toMatchObject({ kind: 'result', call: 0 });
    });

    it('a reply ends the run and terminates its worker: one worker per run', async () => {
        const f = factory();
        await runInWorker({ code: MODULE, calls: [{ fn: 'inc', args: [1] }] }, f.create);
        await runInWorker({ code: MODULE, calls: [{ fn: 'inc', args: [2] }] }, f.create);
        expect(f.workers).toHaveLength(2);
        expect(f.workers.map(w => w.terminated)).toEqual([1, 1]);
    });

    it('the timeout terminates the worker and answers timeout (mutant: terminate removed)', async () => {
        const f = factory('silent');
        const started = Date.now();
        const e = errorOf(await runInWorker({ code: 'export function spin() { while (true) {} }', calls: [{ fn: 'spin', args: [] }], timeoutMs: 40 }, f.create));
        expect(e).toMatchObject({ kind: 'timeout', line: null, column: null });
        expect(e.message).toContain('40');
        expect(f.workers[0].terminated).toBe(1);
        expect(Date.now() - started).toBeGreaterThanOrEqual(35);
    });

    it('the default timeout is 2000 ms', async () => {
        vi.useFakeTimers();
        expect(DEFAULT_TIMEOUT_MS).toBe(2000);
        const f = factory('silent');
        let settled: RunResponse | null = null;
        void runInWorker({ code: MODULE, calls: [] }, f.create).then(r => { settled = r; });
        await vi.advanceTimersByTimeAsync(1999);
        expect(settled).toBeNull();
        expect(f.workers[0].terminated).toBe(0);
        await vi.advanceTimersByTimeAsync(1);
        expect(settled).toMatchObject({ ok: false, error: { kind: 'timeout' } });
        expect(f.workers[0].terminated).toBe(1);
    });

    it('a reply after the timeout is ignored', async () => {
        const f = factory((w, request) => {
            setTimeout(() => w.onmessage?.({ data: { ok: true, results: ['late'] } }), 60);
            void request;
        });
        const r = await runInWorker({ code: MODULE, calls: [], timeoutMs: 10 }, f.create);
        expect(errorOf(r).kind).toBe('timeout');
        await new Promise(res => setTimeout(res, 80));
        expect(f.workers[0].terminated).toBe(1);
    });

    it('an error event of the worker answers at once, with its position only when it comes from the generated code', async () => {
        const fromCode = factory(w => w.onerror?.({ message: 'Uncaught TypeError: x', filename: 'blob:http://localhost/abc', lineno: 3, colno: 5 }));
        const e1 = errorOf(await runInWorker({ code: MODULE, calls: [] }, fromCode.create));
        expect(e1).toMatchObject({ kind: 'worker', line: 3, column: 5 });
        expect(fromCode.workers[0].terminated).toBe(1);

        const fromScript = factory(w => w.onerror?.({ message: 'failed to load', filename: 'http://localhost/runner.worker.js', lineno: 1, colno: 1 }));
        expect(errorOf(await runInWorker({ code: MODULE, calls: [] }, fromScript.create))).toMatchObject({ kind: 'worker', line: null, column: null });
    });

    it('a worker whose sandbox left a network global reachable refuses to run', async () => {
        const e = errorOf(await runInWorker({ code: MODULE, calls: [{ fn: 'inc', args: [1] }] }, factory('execute', ['fetch']).create));
        expect(e.kind).toBe('sandbox');
        expect(e.message).toContain('fetch');
    });
});

describe('framesOf: positions from a stack', () => {
    const url = 'blob:http://localhost:3080/1f2e-33';

    it('reads V8 and Firefox frames of the generated module only', () => {
        const v8 = `TypeError: x\n    at inner (${url}:7:13)\n    at ${url}:9:3\n    at run (http://localhost:3080/runner.worker.js:40:2)`;
        expect(framesOf(v8, url)).toEqual([{ line: 7, column: 13 }, { line: 9, column: 3 }]);
        const firefox = `inner@${url}:7:13\nouter@${url}:9:3\nrun@http://localhost:3080/runner.worker.js:40:2`;
        expect(framesOf(firefox, url)).toEqual([{ line: 7, column: 13 }, { line: 9, column: 3 }]);
    });

    it('without a stack or a url there is no frame', () => {
        expect(framesOf(undefined, url)).toEqual([]);
        expect(framesOf('Error: x', undefined)).toEqual([]);
    });
});

describe('the sandbox: network globals', () => {
    it('names the eight globals of the discovery (§F.4)', () => {
        expect([...NETWORK_GLOBALS].sort()).toEqual(
            ['BroadcastChannel', 'EventSource', 'WebSocket', 'WebTransport', 'XMLHttpRequest', 'fetch', 'importScripts', 'indexedDB'],
        );
    });

    it('shadowNetwork removes every one from the scope and its prototype chain (mutant: shadowing removed)', () => {
        const base: any = { fetch() { return 1; }, XMLHttpRequest: function XHR() {} };
        Object.defineProperty(base, 'indexedDB', { get: () => ({}), configurable: true, enumerable: true });
        const middle: any = Object.create(base);
        middle.WebSocket = function WS() {};
        const scope: any = Object.create(middle);
        scope.EventSource = function ES() {};
        scope.importScripts = () => undefined;
        scope.BroadcastChannel = function BC() {};
        Object.defineProperty(scope, 'WebTransport', { value: function WT() {}, writable: true, configurable: false });

        expect(shadowNetwork(scope)).toEqual([]);
        for (const name of NETWORK_GLOBALS) expect(typeof scope[name], name).toBe('undefined');
    });

    it('a global that can be neither deleted nor shadowed is reported, so the worker refuses to run', () => {
        const scope: any = {};
        Object.defineProperty(scope, 'fetch', { value: () => 1, writable: false, configurable: false });
        expect(shadowNetwork(scope)).toEqual(['fetch']);
    });

    it('importing the worker module outside a worker shadows nothing: node keeps its fetch', () => {
        expect(typeof (globalThis as any).fetch).toBe('function');
    });
});
