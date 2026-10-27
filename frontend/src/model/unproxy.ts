/**
 * Pure L-proxy reductions, in a module the test bench can import.
 *
 * An L object is a Proxy over its D object whose getters build further proxies on
 * demand (`joiner/proxy.ts`). Walking one as data — `JSON.stringify`, a deep copy —
 * follows `father`, `model`, `pointedBy`... through a graph that is lazily built and in
 * practice endless: measured 0.8 s to 62.5 s on one synchronous task, ending in
 * «Converting circular structure» (discovery 2026-09-29 ir_authoring_freeze, H1).
 * `Action.fire` refuses a proxy only at the top level of the value it writes, so one
 * nested in a draft written through `view.ir = draft` reached the store as-is.
 *
 * Both functions here stop at a proxy and use its `id`, never its other properties.
 * The module imports nothing on purpose (see `nameLookup.ts`): an import from
 * `joiner`, even a type, would pull the barrel back in and the bench could not load it.
 */

/** True for an L object: its proxy handler answers `__isProxy` with true (`joiner/proxy.ts`). */
export function isLProxy(value: unknown): boolean {
    return typeof value === 'object' && value !== null && !!(value as { __isProxy?: unknown }).__isProxy;
}

export type UnproxyResult<T> =
    | { ok: true; value: T; mapped: number }
    | { ok: false; path: string; reason: string };

/**
 * `value` with every nested L object replaced by its `id`.
 *
 * Copy on write: a subtree that holds no proxy comes back as the same reference, so a
 * value with none comes back unchanged, and the input is never mutated. Only arrays and
 * plain objects are walked; any other object is kept as it is.
 *
 * Refused, with the path of the offending node: `value` itself an L object (it is not
 * plain data, and a lone id is not what the caller meant to write), an L object whose
 * `id` is not a non-empty string, a circular structure (no save could serialize it).
 */
export function unproxyDeep<T>(value: T): UnproxyResult<T> {
    if (isLProxy(value)) return { ok: false, path: '', reason: 'the value is itself an L object, not plain data' };
    const onPath = new Set<object>();
    const state: { mapped: number; failure: { path: string; reason: string } | null } = { mapped: 0, failure: null };
    const walk = (v: unknown, path: string): unknown => {
        if (state.failure || typeof v !== 'object' || v === null) return v;
        if (isLProxy(v)) {
            const id = (v as { id?: unknown }).id;
            if (typeof id === 'string' && id !== '') { state.mapped++; return id; }
            state.failure = { path, reason: 'an L object without a string id' };
            return v;
        }
        const isArray = Array.isArray(v);
        if (!isArray) {
            const proto = Object.getPrototypeOf(v);
            if (proto !== Object.prototype && proto !== null) return v;
        }
        if (onPath.has(v)) { state.failure = { path, reason: 'a circular structure' }; return v; }
        onPath.add(v);
        let out: any = v;
        if (isArray) {
            const arr = v as unknown[];
            for (let i = 0; i < arr.length; i++) {
                const m = walk(arr[i], path + '[' + i + ']');
                if (m !== arr[i]) { if (out === v) out = arr.slice(); out[i] = m; }
            }
        } else {
            const obj = v as Record<string, unknown>;
            for (const k of Object.keys(obj)) {
                const m = walk(obj[k], path ? path + '.' + k : k);
                if (m !== obj[k]) { if (out === v) out = { ...obj }; out[k] = m; }
            }
        }
        onPath.delete(v);
        return out;
    };
    const out = walk(value, '');
    if (state.failure) return { ok: false, ...state.failure };
    return { ok: true, value: out as T, mapped: state.mapped };
}

/**
 * A `JSON.stringify` replacer that writes an L object as its `id` instead of walking it.
 * Every other value is returned untouched, so the output of a value without proxies is
 * byte-identical to a plain `JSON.stringify` (persisted hashes depend on it). An L object
 * without a string `id` is dropped, as `undefined` is: losing that node beats a hung page.
 */
export function proxyToIdReplacer(_key: string, value: unknown): unknown {
    if (!isLProxy(value)) return value;
    const id = (value as { id?: unknown }).id;
    return typeof id === 'string' ? id : undefined;
}
