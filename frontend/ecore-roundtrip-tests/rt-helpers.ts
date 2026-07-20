/**
 * Shared bootstrap + F7 compensation for the round-trip suite.
 *
 * F7 (docs/discovery/2026-07-04_coevolution_audit.md): headless, the deferred
 * `_persistCallbacks` registrations (SetFieldAction on the father's collection
 * + the child's `father` field) are lost, while the parser's DIRECT mutations
 * (packages, subpackages, enumerators, literals) survive. In the app the same
 * import populates everything (imported metamodels render; W2 round-trip was
 * verified on the dev server), so the harness compensates the lost writes and
 * ONLY the lost writes, reconstructing them from element-creation order
 * (idlookup insertion order == EcoreParser DFS order).
 *
 * The compensation is idempotent and write-only-if-missing, so it stays
 * harmless if F7 is ever fixed at the root.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { installDomParserShim } from './xml-mini';

export let joiner: any;
export let store: any;
export let EcoreService: any;
export let XMIService: any;

export async function bootstrap(): Promise<void> {
    installDomParserShim();
    joiner = await import('../src/joiner');
    store = joiner.store;
    await joiner.stateInitializer();

    const DUser: any = joiner.DUser;
    const uid = 'Pointer_OfflineUser';
    DUser.new('Test', 'User', 'test', '', '', false, 'test@example.com', '', uid, undefined, true);
    DUser.current = uid;
    if (joiner.statehistory && joiner.UserHistory && !joiner.statehistory[uid]) {
        joiner.statehistory[uid] = new joiner.UserHistory();
    }
    // Headless boot takes the dashboard path (no '#/project' hash) and skips
    // the primitive-type seeding that EcoreParser.LinkAllNamesToIDs needs.
    joiner.DState.init_editor();
    await new Promise((r) => setTimeout(r, 30));

    EcoreService = (await import('../src/services/export/EcoreService')).EcoreService;
    XMIService = (await import('../src/services/export/XMIService')).XMIService;
}

export const lookup = (): Record<string, any> => (store.getState() as any).idlookup;

export const flush = async (rounds = 4, ms = 15): Promise<void> => {
    for (let i = 0; i < rounds; i++) await new Promise((r) => setTimeout(r, ms));
};

/** Snapshot of the current idlookup keys, used to identify newly created elements. */
export function idCheckpoint(): Set<string> {
    return new Set(Object.keys(lookup()));
}

const pushOnce = (arr: any[], id: string) => { if (!arr.includes(id)) arr.push(id); };

/**
 * Replay the father/collection wirings lost to F7 for every element created
 * after `checkpoint`. Reconstruction keys on creation order:
 * EcoreParser emits [model, package, (class (ops (params)*)* (attr|ref)*) |
 * enum (literals)* | datatype ..., subpackage ...] depth-first, so tracking
 * the last-seen package/class/operation is sufficient.
 */
export function compensateF7(checkpoint: Set<string>): { seen: Record<string, number>; wired: number } {
    const lk = lookup();
    let pkg: any = null;
    let cls: any = null;
    let op: any = null;
    const stats = { seen: {} as Record<string, number>, wired: 0 };

    for (const id of Object.keys(lk)) {
        if (checkpoint.has(id)) continue;
        const d = lk[id];
        if (!d || typeof d !== 'object') continue;
        if (d.className) stats.seen[d.className] = (stats.seen[d.className] || 0) + 1;
        switch (d.className) {
            case 'DPackage':
                pkg = d; cls = null; op = null;
                break;
            case 'DEnumerator': // direct-wired by the parser; just closes any class scope
                cls = null; op = null;
                break;
            case 'DClass':
                if (pkg) {
                    if (!d.father) d.father = pkg.id;
                    pushOnce(pkg.classes, d.id);
                    stats.wired++;
                }
                cls = d; op = null;
                break;
            case 'DDataType':
                if (pkg) {
                    if (!d.father) d.father = pkg.id;
                    pushOnce(pkg.datatypes, d.id);
                }
                cls = null; op = null;
                break;
            case 'DOperation':
                if (cls) {
                    if (!d.father) d.father = cls.id;
                    pushOnce(cls.operations, d.id);
                }
                op = d;
                break;
            case 'DParameter':
                if (op) {
                    if (!d.father) d.father = op.id;
                    pushOnce(op.parameters, d.id);
                }
                break;
            case 'DAttribute':
                if (cls) {
                    if (!d.father) d.father = cls.id;
                    pushOnce(cls.attributes, d.id);
                }
                break;
            case 'DReference':
                if (cls) {
                    if (!d.father) d.father = cls.id;
                    pushOnce(cls.references, d.id);
                }
                break;
            default:
                break;
        }
    }
    return stats;
}

/**
 * importFromXML + macrotask flush + F7 compensation.
 * The flush is REQUIRED: the store commit is asynchronous (elements bridge
 * through Constructors.pending until the transaction batch lands), so both
 * the checkpoint diff and any state inspection must run after it.
 */
export async function importEcoreCompensated(xml: string, name: string): Promise<{ success: boolean; model?: any; errors: string[] }> {
    const checkpoint = idCheckpoint();
    const res = EcoreService.importFromXML(xml, name);
    await flush();
    if (res.success) compensateF7(checkpoint);
    return res;
}
