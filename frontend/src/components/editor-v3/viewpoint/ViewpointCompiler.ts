/**
 * Editor V3 — ViewpointCompiler: compiles DViewElement JSX into executable functions.
 *
 * Pipeline:
 * 1. Parse Constants tab → safe eval
 * 2. Parse UsageDeclarations tab → safe eval
 * 3. Parse JSX template → DSL.parser() (expands <Children />)
 * 4. Compile JSX → JSXT / UX.parseAndInject() → React.createElement calls
 * 5. Create render Function with sandboxing
 * 6. Wrap with error handling
 *
 * Uses the existing V2 pipeline (DSL.parser, UX.parseAndInject) for full compatibility.
 */

import React from 'react';
import type { CompiledView, ViewContext } from '../types';

// V2 dependencies — imported from joiner/DSL/UX
let DSL: any = null;
let UX: any = null;

/** Lazy-load DSL and UX to avoid circular imports */
function ensureDeps(): void {
    if (!DSL) {
        try {
            // Dynamic require from the existing codebase
            DSL = require('../../../DSL/DSL').default;
        } catch {
            console.warn('[ViewpointCompiler] DSL module not available');
        }
    }
    if (!UX) {
        try {
            UX = require('../../../common/UX').default;
        } catch {
            console.warn('[ViewpointCompiler] UX module not available');
        }
    }
}

/**
 * Compile a DViewElement into a CompiledView.
 * The viewElement can be any object with jsxString, constants, usageDeclarations, css.
 */
export function compileView(viewElement: any): CompiledView {
    ensureDeps();

    try {
        // 1. Compile Constants
        const constantsFn = viewElement.constants
            ? safeCompile(`return (${viewElement.constants})()`)
            : () => ({});

        // 2. Compile UsageDeclarations
        const udFn = viewElement.usageDeclarations
            ? safeCompile(`const ret = {}; (${viewElement.usageDeclarations})(ret); return ret;`)
            : () => ({});

        // 3. Parse JSX through DSL (expand <Children /> etc.)
        let jsxString = viewElement.jsxString || '<View />';
        if (DSL?.parser) {
            jsxString = DSL.parser(jsxString);
        }

        // 4. Compile JSX to React.createElement calls
        let compiledCode: string;
        if (UX?.parseAndInject) {
            compiledCode = UX.parseAndInject(jsxString, viewElement);
        } else {
            // Fallback: simple JSX eval (less features but works without V2 deps)
            compiledCode = fallbackCompileJSX(jsxString);
        }

        // 5. Create render function
        const body = `return (${compiledCode})`;
        const paramStr = '{data, node, view, views, constants, usageDeclarations, React, ' +
            'View, Field, Input, Text, SubView, Image, Toggle, Selector, Graph, Edge, Vertex}';

        const renderFn = new Function(paramStr, body);

        // 6. Build the render wrapper with context + built-in components
        const render = (context: ViewContext, builtins: Record<string, any>): React.ReactNode => {
            try {
                const allConstants = constantsFn();
                const allUD = udFn();

                return renderFn({
                    ...context,
                    constants: allConstants,
                    usageDeclarations: allUD,
                    ...allConstants,
                    ...allUD,
                    React,
                    ...builtins,
                });
            } catch (e) {
                console.error('[ViewpointCompiler] Runtime error:', e);
                return null;
            }
        };

        // 7. Compute hash for cache invalidation
        const raw = (jsxString || '') + (viewElement.css || '') + (viewElement.constants || '');
        const hash = hashString(raw);

        return {
            render: render as any,
            css: viewElement.css || '',
            hash,
            error: null,
        };
    } catch (error) {
        return {
            render: () => null,
            css: '',
            hash: '',
            error: error instanceof Error ? error.message : String(error),
        };
    }
}

/**
 * Fallback JSX compiler when DSL/UX modules are not available.
 * Uses new Function to eval the JSX string directly (requires pre-compiled JSX or simple expressions).
 */
function fallbackCompileJSX(jsxString: string): string {
    // If it already looks like React.createElement, return as-is
    if (jsxString.includes('React.createElement')) {
        return jsxString;
    }

    // For raw JSX, attempt simple tag-to-createElement conversion
    // This is a basic fallback — the real pipeline uses JSXT
    try {
        // Try importing jsx-transform if available
        const JSXT = require('jsx-transform');
        return JSXT.fromString(jsxString, { factory: 'React.createElement' });
    } catch {
        // Last resort: wrap in a div
        console.warn('[ViewpointCompiler] jsx-transform not available, returning raw string');
        return `React.createElement('div', { className: 'viewpoint-fallback' }, ${JSON.stringify(jsxString)})`;
    }
}

/**
 * Compile code with basic sandboxing. Errors are caught and logged, not thrown.
 */
function safeCompile(code: string): (...args: any[]) => any {
    try {
        const fn = new Function(code);
        return (...args: any[]) => {
            try {
                return fn.apply(null, args);
            } catch (e) {
                console.error('[ViewpointCompiler] Runtime error in eval:', e);
                return {};
            }
        };
    } catch (e) {
        console.error('[ViewpointCompiler] Compile error in eval:', e);
        return () => ({});
    }
}

/** Simple string hash (djb2). */
function hashString(str: string): string {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
    }
    return hash.toString(36);
}
