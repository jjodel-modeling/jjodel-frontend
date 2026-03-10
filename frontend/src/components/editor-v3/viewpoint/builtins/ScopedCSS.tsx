/**
 * Editor V3 — ScopedCSS: injects view-specific CSS with data-attribute scoping.
 *
 * Each custom view's CSS is wrapped in a [data-view="viewId"] scope
 * so styles from different views don't interfere with each other.
 */

import React, { useMemo } from 'react';

interface ScopedCSSProps {
    css: string;
    viewId: string;
    children: React.ReactNode;
}

/**
 * Wraps children in a scoped div and injects prefixed CSS.
 *
 * The CSS scoping uses `&` replacement with `[data-view="viewId"]`.
 * If no `&` is found, each rule is automatically prefixed.
 */
export function ScopedCSS({ css, viewId, children }: ScopedCSSProps) {
    const scopedCss = useMemo(() => {
        if (!css) return '';
        const scope = `[data-view="${viewId}"]`;

        // If the CSS uses & (SCSS-like), replace with scope
        if (css.includes('&')) {
            return css.replace(/&/g, scope);
        }

        // Otherwise, prefix each rule with the scope selector
        return prefixRules(css, scope);
    }, [css, viewId]);

    return (
        <>
            {scopedCss && <style dangerouslySetInnerHTML={{ __html: scopedCss }} />}
            <div data-view={viewId}>
                {children}
            </div>
        </>
    );
}

/**
 * Prefix CSS rules with a scope selector.
 * Simple approach: prepend scope before each selector.
 */
function prefixRules(css: string, scope: string): string {
    // Split on } to get rule blocks
    return css.replace(/([^{}]+)\{/g, (match, selectors: string) => {
        const prefixed = selectors
            .split(',')
            .map((s: string) => {
                const trimmed = s.trim();
                if (!trimmed || trimmed.startsWith('@')) return trimmed;
                return `${scope} ${trimmed}`;
            })
            .join(', ');
        return `${prefixed} {`;
    });
}
