/**
 * TemplatePreview — Live preview of JSX templates with mock data.
 *
 * Compiles JSX using the same pipeline as the runtime (DSL.parser → JSXT.fromString → new Function)
 * and renders it with a lightweight mock context. Errors are caught and displayed gracefully.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { JSXT, UX } from '../../joiner';
import DSL from '../../DSL/DSL';

// Minimal mock objects that satisfy the most common template variables.
function createMockContext(): Record<string, any> {
    const windoww = (window as any);

    const mockData: any = {
        id: 'mock-object-1',
        name: 'ExampleObject',
        className: 'DObject',
        children: [],
        features: [],
        attributes: [],
        references: [],
        superClasses: [],
        allSubClasses: [],
        isAbstract: false,
        isSingleton: false,
        state: undefined,
        get: (key: string) => mockData[key],
    };
    // self-reference for proxy-like access
    mockData.data = mockData;

    const mockNode: any = {
        id: 'mock-node-1',
        x: 0, y: 0,
        width: 200, height: 100,
        zIndex: 0,
        isSelected: false,
    };

    const mockView: any = {
        id: 'mock-view-1',
        name: 'Preview View',
        className: 'DViewElement',
    };

    // Build context similar to runtime (graphElement.tsx getJSXContext)
    const ctx: Record<string, any> = {
        // Standard variables available in templates
        data: mockData,
        node: mockNode,
        view: mockView,
        state: undefined,
        props: {},
        constants: {},
        usageDeclarations: {},
        decorators: null,
        component: null,
        otherViews: [],
        htmlindex: [],
        stateProps: {},
        ownProps: {},
        isVertex: true,
        isEdge: false,
        isEdgePoint: false,
        isVoid: false,
        isGraph: false,
        children: [],
        level: 0,
        // React must be available for createElement calls
        React,
    };

    // Inject runtime-accessible classes and components (View, Input, DefaultNode, etc.)
    if (windoww.defaultContext) {
        Object.assign(ctx, windoww.defaultContext);
    }
    if (windoww.Components) {
        Object.assign(ctx, windoww.Components);
    }

    return ctx;
}

/** Compile a JSX template string into a callable function, returns [fn, null] or [null, error]. */
function compileTemplate(jsxCode: string): [Function | null, string | null] {
    try {
        // Step 1: process <Children> DSL tags
        const parsed = DSL.parser(jsxCode);

        // Step 2: convert JSX to React.createElement calls
        const compiled = JSXT.fromString(parsed, { factory: 'React.createElement' });

        // Step 3: wrap in a function that destructures the context
        const fn = new Function('ctx', `with(ctx){ return (${compiled}) }`);
        return [fn, null];
    } catch (e: any) {
        return [null, e.message || String(e)];
    }
}

// ───────────── Error Boundary ─────────────

class PreviewErrorBoundary extends React.Component<
    { children: React.ReactNode; resetKey: string },
    { error: string | null }
> {
    state = { error: null as string | null };

    static getDerivedStateFromError(e: Error) {
        return { error: e.message };
    }

    componentDidUpdate(prev: { resetKey: string }) {
        if (prev.resetKey !== this.props.resetKey && this.state.error) {
            this.setState({ error: null });
        }
    }

    render() {
        if (this.state.error) {
            return (
                <div className="template-preview-error">
                    <i className="bi bi-exclamation-triangle" />
                    <span>Render error: {this.state.error}</span>
                </div>
            );
        }
        return this.props.children;
    }
}

// ───────────── Main Component ─────────────

export interface TemplatePreviewProps {
    jsxCode: string;
    className?: string; // target class name for header
}

export function TemplatePreview({ jsxCode, className }: TemplatePreviewProps) {
    const [rendered, setRendered] = useState<React.ReactNode>(null);
    const [error, setError] = useState<string | null>(null);
    const [renderKey, setRenderKey] = useState(0);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const mockCtx = useMemo(() => createMockContext(), []);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(() => {
            if (!jsxCode.trim()) {
                setRendered(null);
                setError(null);
                return;
            }

            const [fn, compileErr] = compileTemplate(jsxCode);
            if (compileErr || !fn) {
                setError(compileErr || 'Unknown compilation error');
                setRendered(null);
                return;
            }

            try {
                const result = fn(mockCtx);
                setRendered(result);
                setError(null);
                setRenderKey((k) => k + 1);
            } catch (e: any) {
                setError(e.message || String(e));
                setRendered(null);
            }
        }, 400);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [jsxCode, mockCtx]);

    return (
        <div className="template-preview-pane">
            <div className="template-preview-header">
                <i className="bi bi-eye" />
                <span>Preview{className ? ` — ${className}` : ''}</span>
                <span className="template-preview-badge">Mock Data</span>
            </div>
            <div className="template-preview-content">
                {error ? (
                    <div className="template-preview-error">
                        <i className="bi bi-exclamation-triangle" />
                        <div className="template-preview-error__text">
                            <span className="template-preview-error__title">Template error</span>
                            <code className="template-preview-error__message">{error}</code>
                        </div>
                    </div>
                ) : rendered ? (
                    <PreviewErrorBoundary resetKey={String(renderKey)}>
                        <div className="template-preview-canvas">
                            {rendered}
                        </div>
                    </PreviewErrorBoundary>
                ) : (
                    <div className="template-preview-empty">
                        <i className="bi bi-code-slash" />
                        <span>Write a JSX template to see a preview</span>
                    </div>
                )}
            </div>
        </div>
    );
}

export default TemplatePreview;
