/**
 * The toolbar auto-layout's ELK, off the main thread (P-2026-11-09-0952): a stress run on the folded DDR4 model was one
 * 12 s task. elkjs's own worker build is served as an asset and runs as a classic script, the form it is written for.
 *
 * Where there is no Worker (vitest, whose `new Worker` throws) or it dies, the caller's ELK lays the graph out on this
 * thread, as before.
 */

import ELK from 'elkjs/lib/elk-api.js';
// @ts-ignore
import elkWorkerUrl from 'elkjs/lib/elk-worker.min.js?url';
import type { ElkNode } from 'elkjs';

export interface ElkEngine { layout(graph: ElkNode): Promise<ElkNode> }

interface RunningWorker { engine: ElkEngine; died: Promise<never> }

/** undefined: not started yet; null: this environment has none, or it died. */
let running: RunningWorker | null | undefined;

function startWorker(): RunningWorker | null {
    let reportDeath!: (reason: unknown) => void;
    const died = new Promise<never>((_, reject) => { reportDeath = reject; });
    died.catch(() => undefined); // It can die with no layout waiting.
    try {
        const engine = new ELK({
            workerFactory: () => {
                const worker = new Worker(elkWorkerUrl);
                // The API only hears the worker's answers: a script that never loads would leave the layout pending.
                worker.addEventListener('error', event => {
                    running = null;
                    reportDeath(event);
                });
                return worker;
            },
        });
        return { engine, died };
    } catch {
        return null;
    }
}

/** `graph` laid out in the worker; by `onThread` where there is none, or it could not finish (the same error, if ELK's). */
export async function layoutOffThread(graph: ElkNode, onThread: ElkEngine): Promise<ElkNode> {
    if (running === undefined) running = startWorker();
    if (running) {
        try {
            return await Promise.race([running.engine.layout(graph), running.died]);
        } catch (err) {
            console.warn('[elkWorker] the worker could not lay out the graph, running it on the main thread:', err);
        }
    }
    return onThread.layout(graph);
}
