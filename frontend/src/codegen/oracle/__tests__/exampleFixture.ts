/**
 * The fixture of the oracle tests: the two lecture examples (codegen/examples/), read from their JSON, a record
 * shaped like `buildEvalContext`'s over each, the in-process runner of S4's tests, and the mutation the README
 * describes. Not a test file: imported by `examples.test.ts` and by `target/js/__tests__/access.test.ts`.
 *
 * `buildEvalContext` does not import under the node bench (the joiner writes on `window`, measured in S2), so
 * `recordOf` builds the record the way generate.test.ts and guardContext.test.ts do: one handle per object with its
 * `id`, `name` and its features by name, references resolved to the same handles, a feature of upper bound -1 a
 * list, every object bound by name at the top. The real record is the probe's (scripts/probe/codegen-oracle.ts).
 */

import { readFileSync } from 'node:fs';
import type { ScenarioRecord } from '../../../model/simulation/scenarioCodec';
import { WORKER_READY } from '../../runner/protocol';
import type { RunRequest, RunResponse, WorkerReply } from '../../runner/protocol';
import { runInWorker } from '../../runner/runner';
import type { RunnerErrorEvent, RunnerWorker } from '../../runner/runner';
import { executeRun } from '../../runner/runner.worker';
import type { ModuleLoader } from '../../runner/runner.worker';

type Lookup = Record<string, any>;

export interface Example {
    readonly name: string;
    readonly scene: string;
    readonly profile: string;
    readonly metamodelId: string;
    readonly modelId: string;
    readonly lookup: Lookup;
    readonly jjscript?: readonly string[];
    readonly scenario: ScenarioRecord;
    readonly mutation: { readonly transition: string; readonly from: string; readonly to: string; readonly step: number };
}

export const EXAMPLES = ['turnstile', 'petri-producer-consumer'] as const;

/** The example, read fresh: generation freezes the objects of the record it is given, never the lookup. */
export function loadExample(name: (typeof EXAMPLES)[number]): Example {
    return JSON.parse(readFileSync(new URL(`../../examples/${name}/${name}.json`, import.meta.url), 'utf8'));
}

/** A record shaped like `buildEvalContext`'s for the model `modelId` of `lookup`. */
export function recordOf(lookup: Lookup, modelId: string): Record<string, any> {
    const ids = Object.keys(lookup).filter(id => lookup[id].className === 'DObject' && ownerModel(lookup, id) === modelId);
    const handles = new Map<string, any>(ids.map(id => [id, { id, __type: 'Object', name: lookup[id].name }]));
    for (const id of ids) {
        const h = handles.get(id);
        for (const vid of lookup[id].features ?? []) {
            const v = lookup[vid];
            const f = lookup[v.instanceof];
            const values = (v.values ?? []).map((x: unknown) => (f.className === 'DReference' ? handles.get(x as string) ?? null : x));
            h[f.name] = f.upperBound === -1 ? values : values[0] ?? null;
        }
    }
    const out: Record<string, any> = { instances: [...handles.values()] };
    for (const [id, h] of handles) out[lookup[id].name] = h;
    return out;
}

function ownerModel(lookup: Lookup, id: string): string | null {
    let d = lookup[id];
    for (let i = 0; d && d.className !== 'DModel' && i < 40; i++) d = lookup[d.father];
    return d?.id ?? null;
}

let loads = 0;

/** S4's in-process loader (runner.test.ts): the code as a real ES module from a fresh `data:` URL. */
const dataLoader: ModuleLoader = code => {
    const url = 'data:text/javascript;base64,' + Buffer.from(`${code}\n// load ${++loads}\n`).toString('base64');
    return { url, module: import(/* @vite-ignore */ url) };
};

/**
 * The transport of a worker, nothing else: the request goes to the worker's own `executeRun`. Like a real worker it
 * posts `ready` once its script has run (the next microtask), and a request that reaches it earlier waits until then.
 */
class InProcessWorker implements RunnerWorker {
    onmessage: ((ev: { data: unknown }) => void) | null = null;
    onerror: ((ev: RunnerErrorEvent) => void) | null = null;
    private terminated = false;
    private ready = false;
    private readonly waiting: RunRequest[] = [];
    constructor() {
        queueMicrotask(() => this.becomeReady());
    }
    private becomeReady(): void {
        if (this.terminated) return;
        this.ready = true;
        this.onmessage?.({ data: WORKER_READY });
        for (const request of this.waiting.splice(0)) this.handle(request);
    }
    postMessage(message: unknown): void {
        if (!this.ready) this.waiting.push(message as RunRequest);
        else this.handle(message as RunRequest);
    }
    private handle(request: RunRequest): void {
        void executeRun(request, dataLoader).then((reply: WorkerReply) => {
            if (!this.terminated) this.onmessage?.({ data: reply });
        });
    }
    terminate(): void {
        this.terminated = true;
    }
}

/** `runInWorker` over the in-process worker: the runner's path of S4's tests. */
export const inProcess = (request: RunRequest): Promise<RunResponse> => runInWorker(request, () => new InProcessWorker());

/** The program's `$ID` table (R-GEN-17) read back, id to name: its declaration run on its own. Empty without one. */
function idNames(code: string): Map<string, string> {
    const start = code.indexOf('const $ID = Object.freeze({');
    const end = start < 0 ? -1 : code.indexOf('\n});', start);
    if (end < 0) return new Map();
    // eslint-disable-next-line no-new-func
    const table = new Function(`'use strict';\n${code.slice(start, end + 4)}\nreturn $ID;`)() as Record<string, string>;
    return new Map(Object.entries(table).map(([name, id]) => [id, name]));
}

/**
 * The mutation of the README: in the entry of `transition`, the postset place `from` becomes `to`, the target of
 * the transition swapped. The program names elements through its `$ID` table (R-GEN-17), so the entry is found by
 * `id: $ID.<name of transition>` and the place by `place: $ID.<name of from>`, the names read from the table.
 * Throws when the text has no such place there, so a template change cannot void it.
 */
export function swapTarget(code: string, transition: string, from: string, to: string): string {
    const names = idNames(code);
    const ref = (id: string) => `$ID.${names.get(id) ?? id}`;
    const at = code.indexOf(`id: ${ref(transition)},`);
    const post = at < 0 ? -1 : code.indexOf('postset: [', at);
    const end = post < 0 ? -1 : code.indexOf(']', post);
    const segment = end < 0 ? '' : code.slice(post, end);
    const swapped = segment.replace(`place: ${ref(from)},`, `place: ${ref(to)},`);
    if (segment === '' || swapped === segment) throw new Error(`no postset place ${from} in the entry of ${transition}`);
    return code.slice(0, post) + swapped + code.slice(end);
}
