/**
 * intrinsicMeasureCache - the intrinsic reading of an IR node's content, kept until something it
 * depends on moves (P-2026-10-21-1240, LIR docs/lir/lir_2026-10-21_intrinsic_cache.md).
 *
 * `measureIntrinsic` (useContentSize.ts) forces a layout per node per commit: it writes `max-content`,
 * reads `offsetWidth/offsetHeight` and restores. Most commits change nothing the reading depends on
 * (round 3 §3.4: 431 ms of a production drag), so the reading is kept per element with the key it was
 * taken under and answered back while the key holds.
 *
 * The key has three parts, all read without a style or layout flush:
 * - what the element carries: its class, its inline style, and its content markup. `innerHTML` and not
 *   `textContent`: label, row and literal spans carry inline text styles and classes that move the
 *   reading with the text unchanged;
 * - what its node carries: the class names of the ancestors up to the `.react-flow__node`, where
 *   `ir-partition-sep-dashed-*` overrides the border (irStyle.ts) and a viewpoint's global CSS can key
 *   on `selected` or any other node class;
 * - the box the caller passes (the node's current size), so a reading that would depend on it is
 *   retaken after every write, as it was before the cache.
 * What the element inherits from the document is the epoch: bumped by the fonts landing, by the theme
 * attribute or class on <html>, and by any stylesheet text (<style>/<link> in <head>, the viewpoint CSS
 * injector of Dashboard.tsx). Zoom is a transform, which `offsetWidth` ignores; no viewport unit or
 * width media query reaches the node content: neither has an epoch.
 */
import type { IntrinsicMeasure } from './shapeRegistry';

/** Dashboard.tsx renders the compiled CSS of every view and viewpoint into this element. */
const VIEWS_CSS_ID = 'views-css-injector-d';
/** The attributes of <html> a theme is applied through (index.html boot script: `data-theme`). */
const THEME_ATTRIBUTES = ['data-theme', 'class'];

type Entry = { key: string; epoch: number; measure: IntrinsicMeasure };
const entries = new WeakMap<Element, Entry>();
let epoch = 0;
const listeners = new Set<() => void>();
let observer: MutationObserver | null = null;
let installed = false;
let injector: Element | null = null;

function bump(): void {
    epoch += 1;
    for (const f of [...listeners]) f();
}

const isSheet = (n: Node | null | undefined): boolean => !!n && (n.nodeName === 'STYLE' || n.nodeName === 'LINK');

/** Whether a mutation changes CSS the reading inherits. A <title> or another head node does not. */
function relevant(r: MutationRecord): boolean {
    if (r.type === 'attributes') {
        const t = r.target as Element;
        return t.getAttribute(r.attributeName as string) !== r.oldValue;
    }
    if (isSheet(r.target) || isSheet(r.target.parentNode)) return true;
    if (r.type === 'childList') {
        for (const n of Array.from(r.addedNodes)) if (isSheet(n)) return true;
        for (const n of Array.from(r.removedNodes)) if (isSheet(n)) return true;
    }
    return false;
}

function absorb(records: MutationRecord[]): void {
    if (records.some(relevant)) bump();
}

/** The viewpoint CSS element is re-found at every epoch read: a remount of it is a CSS change. */
function watchInjector(): void {
    const el = document.getElementById(VIEWS_CSS_ID);
    if (el === injector) return;
    injector = el;
    if (el && observer) observer.observe(el, { childList: true, characterData: true, subtree: true });
    bump();
}

function install(): void {
    if (installed) return;
    installed = true;
    if (typeof document === 'undefined') return;
    if (typeof MutationObserver !== 'undefined') {
        observer = new MutationObserver(absorb);
        observer.observe(document.documentElement, { attributes: true, attributeOldValue: true, attributeFilter: THEME_ATTRIBUTES });
        if (document.head) observer.observe(document.head, { childList: true, characterData: true, subtree: true });
    }
    // On a cold load the fonts can land after the first paint, and every reading is a text reading.
    const fonts = (document as any).fonts;
    if (fonts?.ready && fonts.status !== 'loaded') fonts.ready.then(bump);
    fonts?.addEventListener?.('loadingdone', bump);
}

/**
 * The current epoch. Drains the records the observer holds first: they are delivered in a microtask,
 * after the layout effects of the commit that made them, and that commit must read under the new epoch.
 */
export function intrinsicEpoch(): number {
    install();
    if (observer) absorb(observer.takeRecords());
    if (typeof document !== 'undefined') watchInjector();
    return epoch;
}

/** Calls `f` at every bump of the epoch; returns the unsubscribe. */
export function onIntrinsicEpoch(f: () => void): () => void {
    install();
    listeners.add(f);
    return () => { listeners.delete(f); };
}

function keyOf(el: HTMLElement, box: string): string {
    let ancestors = '';
    for (let p = el.parentElement; p; p = p.parentElement) {
        ancestors += `${p.className}|`;
        if (p.classList?.contains('react-flow__node')) break;
    }
    return `${box}\n${ancestors}\n${el.className}\n${el.style.cssText}\n${el.innerHTML}`;
}

/**
 * The intrinsic reading of `el`: the stored one while its key and the epoch hold, else `measure(el)`,
 * stored. A detached element reads 0 and its key would not move when it is attached: measured, not stored.
 */
export function readIntrinsic(el: HTMLElement, measure: (el: HTMLElement) => IntrinsicMeasure, box = ''): IntrinsicMeasure {
    if (!el.isConnected) return measure(el);
    const e = intrinsicEpoch();
    const key = keyOf(el, box);
    const hit = entries.get(el);
    if (hit && hit.epoch === e && hit.key === key) return hit.measure;
    const m = measure(el);
    entries.set(el, { key, epoch: e, measure: m });
    return m;
}

/** The stored reading of `el`, if any. */
export function peekIntrinsic(el: Element): IntrinsicMeasure | undefined {
    return entries.get(el)?.measure;
}

/** Forgets `el` (its host unmounted). */
export function dropIntrinsic(el: Element): void {
    entries.delete(el);
}
