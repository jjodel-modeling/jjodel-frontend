/**
 * Minimal DOM shim for the headless co-evolution suite.
 * The joiner chain touches window / document / HTMLElement at module load
 * (e.g. reducer.ts:1416 HTMLElement.prototype.focus, setDocumentEvents).
 * No jsdom: the project has no jsdom dependency and adding one is out of
 * scope (CLAUDE.md §2 no new dependencies). This shim absorbs the touches;
 * nothing here is exercised by assertions.
 *
 * Runs as a vitest setupFile BEFORE any test module import.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { vi } from 'vitest';

const g: any = globalThis as any;

// src/DSL/nearley/unparse_test.js does `module.exports = ...` inside an ESM
// module: fine in the browser build (vite-plugin-node-polyfills shims
// `module`), fatal under the vitest SSR transform. Mock its importer; the
// only consumed export is `Nearley` (MTM.tsx / editors/MTM.tsx).
const nearleySink: any = new Proxy(function () {} as any, {
    get(_t, prop) {
        if (prop === Symbol.toPrimitive) return () => '';
        if (prop === 'then') return undefined;
        return nearleySink;
    },
    apply() { return nearleySink; },
    construct() { return nearleySink; },
});
vi.mock('src/DSL/nearley/nearley', () => ({ Nearley: nearleySink, default: nearleySink }));

// Bare-global jQuery for UMD plugins (jqueryui reads `jQuery` as a global).
const jqSink: any = new Proxy(function () {} as any, {
    get(_t, prop) {
        if (prop === Symbol.toPrimitive) return () => '';
        if (prop === 'then') return undefined;
        return jqSink;
    },
    apply() { return jqSink; },
    construct() { return jqSink; },
});
if (typeof g.jQuery === 'undefined') g.jQuery = jqSink;
if (typeof g.$ === 'undefined') g.$ = jqSink;

const stubEl = (): any => ({
    style: {},
    dataset: {},
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    addEventListener() {},
    removeEventListener() {},
    appendChild(c: any) { return c; },
    removeChild(c: any) { return c; },
    insertBefore(c: any) { return c; },
    setAttribute() {},
    removeAttribute() {},
    getAttribute: () => null,
    focus() {},
    blur() {},
    click() {},
    remove() {},
    contains: () => false,
    getBoundingClientRect: () => ({ x: 0, y: 0, width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0 }),
    querySelector: () => null,
    querySelectorAll: () => [],
    children: [],
    childNodes: [],
    ownerDocument: null as any,
    innerHTML: '',
    textContent: '',
});

if (typeof g.window === 'undefined') g.window = g;

if (typeof g.HTMLElement === 'undefined') {
    g.HTMLElement = class HTMLElement {
        style: any = {};
        focus() {}
        blur() {}
    };
}
if (typeof g.Element === 'undefined') g.Element = g.HTMLElement;
if (typeof g.Node === 'undefined') g.Node = g.HTMLElement;
if (typeof g.HTMLInputElement === 'undefined') g.HTMLInputElement = class extends g.HTMLElement {};
if (typeof g.HTMLTextAreaElement === 'undefined') g.HTMLTextAreaElement = class extends g.HTMLElement {};
if (typeof g.SVGElement === 'undefined') g.SVGElement = class SVGElement extends g.HTMLElement {};
if (typeof g.SVGGraphicsElement === 'undefined') g.SVGGraphicsElement = class extends g.SVGElement {};
if (typeof g.SVGPathElement === 'undefined') g.SVGPathElement = class extends g.SVGGraphicsElement {};
if (typeof g.SVGSVGElement === 'undefined') g.SVGSVGElement = class extends g.SVGGraphicsElement {};
if (typeof g.SVGRectElement === 'undefined') g.SVGRectElement = class extends g.SVGGraphicsElement {};
if (typeof g.SVGCircleElement === 'undefined') g.SVGCircleElement = class extends g.SVGGraphicsElement {};
if (typeof g.SVGEllipseElement === 'undefined') g.SVGEllipseElement = class extends g.SVGGraphicsElement {};
if (typeof g.SVGLineElement === 'undefined') g.SVGLineElement = class extends g.SVGGraphicsElement {};
if (typeof g.SVGPolygonElement === 'undefined') g.SVGPolygonElement = class extends g.SVGGraphicsElement {};
if (typeof g.SVGPolylineElement === 'undefined') g.SVGPolylineElement = class extends g.SVGGraphicsElement {};
if (typeof g.MouseEvent === 'undefined') g.MouseEvent = class MouseEvent {};
if (typeof g.KeyboardEvent === 'undefined') g.KeyboardEvent = class KeyboardEvent {};
if (typeof g.CustomEvent === 'undefined') {
    g.CustomEvent = class CustomEvent {
        type: string; detail: any;
        constructor(type: string, init?: any) { this.type = type; this.detail = init?.detail; }
    };
}

if (typeof g.document === 'undefined') {
    const docEl = stubEl();
    g.document = {
        addEventListener() {},
        removeEventListener() {},
        dispatchEvent: () => true,
        createElement: () => stubEl(),
        createElementNS: () => stubEl(),
        createTextNode: () => ({ textContent: '' }),
        getElementById: () => null,
        getElementsByTagName: () => [],
        getElementsByClassName: () => [],
        querySelector: () => null,
        querySelectorAll: () => [],
        body: stubEl(),
        head: stubEl(),
        documentElement: docEl,
        activeElement: null,
        hasFocus: () => false,
        location: null as any,
        fonts: { ready: Promise.resolve(), addEventListener() {} },
    };
}

if (typeof g.location === 'undefined') {
    g.location = {
        href: 'http://localhost/', origin: 'http://localhost', protocol: 'http:',
        host: 'localhost', hostname: 'localhost', port: '', pathname: '/',
        search: '', hash: '', reload() {}, assign() {}, replace() {},
    };
}
g.document.location = g.location;

if (typeof g.navigator === 'undefined' || !g.navigator?.userAgent) {
    try {
        g.navigator = {
            userAgent: 'node-vitest', language: 'en', languages: ['en'],
            platform: 'linux', maxTouchPoints: 0,
            clipboard: { writeText: () => Promise.resolve(), readText: () => Promise.resolve('') },
        };
    } catch { /* node >=21 navigator getter may be read-only; existing one is fine */ }
}

if (typeof g.localStorage === 'undefined') {
    const mem = new Map<string, string>();
    g.localStorage = {
        getItem: (k: string) => (mem.has(k) ? mem.get(k) : null),
        setItem: (k: string, v: string) => { mem.set(k, String(v)); },
        removeItem: (k: string) => { mem.delete(k); },
        clear: () => { mem.clear(); },
        key: (i: number) => Array.from(mem.keys())[i] ?? null,
        get length() { return mem.size; },
    };
}
if (typeof g.sessionStorage === 'undefined') g.sessionStorage = g.localStorage;

if (typeof g.requestAnimationFrame === 'undefined') {
    g.requestAnimationFrame = (cb: (t: number) => void) => setTimeout(() => cb(Date.now()), 0);
    g.cancelAnimationFrame = (id: any) => clearTimeout(id);
}
if (typeof g.getComputedStyle === 'undefined') {
    g.getComputedStyle = () => ({ getPropertyValue: () => '' });
}
if (typeof g.matchMedia === 'undefined') {
    g.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
}
if (typeof g.ResizeObserver === 'undefined') {
    g.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
}
if (typeof g.MutationObserver === 'undefined') {
    g.MutationObserver = class { observe() {} disconnect() {} takeRecords() { return []; } };
}
if (typeof g.IntersectionObserver === 'undefined') {
    g.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
}
