import React from 'react';
import type { CSSProperties } from 'react';
import type { LViewElement } from '../../../../joiner';

/**
 * irTabs — the five-tab partition of the IR authoring panels (ratifica 2026-08-04).
 *
 * The BAR lives in `ViewData` (it replaces the legacy one for every view carrying an
 * `ir`); the BODIES live inside each authoring panel. The panel therefore stays
 * mounted whole, with its single draft, its single 300 ms debounce and — for the edge
 * — the three endpoint atoms: changing tab hides a body, it never unmounts the panel
 * (strada B, R-A). This module carries only what the two sides must agree on.
 */

export type IRTabId =
    | 'ir-applies-to'
    | 'ir-structure'
    | 'ir-appearance'
    | 'ir-text'
    | 'ir-source';

/** The three IR kinds that have an authoring panel (graphVertex is out of scope). */
export type IRAuthoringKind = 'vertex' | 'row' | 'edge';

/** Tab labels — English (R-4), independent of the italian strings inside the panels. */
export const IR_TAB_LABELS: Record<IRTabId, string> = {
    'ir-applies-to': 'Applies to',
    'ir-structure': 'Structure',
    'ir-appearance': 'Appearance',
    'ir-text': 'Text',
    'ir-source': 'Source',
};

/**
 * Which tabs a kind shows, in bar order.
 *
 * A row has no geometry by construction, so Structure and Appearance are dropped
 * STRUCTURALLY — the bodies are not rendered at all, which is a different mechanism
 * from the `display: none` of an inactive tab (V1). Source is the only
 * advanced-gated tab (R-3): every other tab is reachable in Basic, matching
 * included.
 */
export const irTabsForKind = (kind: IRAuthoringKind, advanced: boolean): IRTabId[] => {
    const content: IRTabId[] = kind === 'row'
        ? ['ir-applies-to', 'ir-text']
        : ['ir-applies-to', 'ir-structure', 'ir-appearance', 'ir-text'];
    return advanced ? [...content, 'ir-source'] : content;
};

/**
 * Style of a tab body: `display: none` when it is not the active one — never
 * `visibility: hidden` nor `opacity: 0`, which would keep the subtree laid out and
 * reachable with the Tab key (R-A).
 *
 * `active === undefined` means "no host is driving the partition": every body shows,
 * which is the pre-partition rendering. It keeps the panels usable from any other
 * mount site and makes the new prop genuinely optional.
 */
export const irTabBodyStyle = (id: IRTabId, active: IRTabId | undefined): CSSProperties | undefined =>
    (active === undefined || active === id) ? undefined : { display: 'none' };

/**
 * Read-only breadcrumb `viewpoint › parent › this view`. Text only, no navigation.
 *
 * The middle segment appears only when the parent is not the viewpoint itself:
 * `father` is the single field behind BOTH the "Viewpoint" and the "Parent view"
 * selects of the legacy Apply-to tab (`InfoData.tsx:306` and `:323`), and
 * `get_viewpoint` (`view.tsx:1427`) walks that same chain up to its root — so on a
 * top-level view the two segments would print the same name twice.
 */
export const IRBreadcrumb: React.FC<{ view: LViewElement }> = ({ view }) => {
    let vpName: string | undefined;
    let parentName: string | undefined;
    try {
        const vp = (view as any).viewpoint;
        const parent = (view as any).father;
        vpName = vp?.name;
        if (parent && (!vp || parent.id !== vp.id)) parentName = parent.name;
    } catch { /* unresolvable ancestor — the breadcrumb degrades to the view name */ }

    const segments = [vpName, parentName, view.name].filter(Boolean) as string[];
    if (segments.length === 0) return null;

    return (
        <div
            className="jj-field-label"
            style={{ marginTop: 4, color: 'var(--color-text-secondary)', fontWeight: 400 }}
        >
            {segments.join(' › ')}
        </div>
    );
};

/**
 * Source body — read-only dump of the `ir` actually persisted on the view, NOT of the
 * draft: while the draft fails `validateIR` nothing is committed, and showing what is
 * really stored is exactly what makes that gap visible.
 *
 * A plain `<pre>`, deliberately not an editor: this body is mounted at all times
 * (strada B), so Monaco would weigh on every panel and would also swallow keystrokes
 * in capture phase (CLAUDE.md §15.1).
 */
export const IRSourceBody: React.FC<{ ir: unknown }> = ({ ir }) => (
    <pre
        style={{
            margin: 0,
            padding: 'var(--space-2)',
            fontFamily: "'IBM Plex Mono', Monaco, Consolas, monospace",
            fontSize: 12,
            lineHeight: 1.5,
            whiteSpace: 'pre',
            overflowX: 'auto',
            color: 'var(--color-text-primary)',
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border-primary)',
            borderRadius: 4,
        }}
    >
        {JSON.stringify(ir ?? null, null, 2)}
    </pre>
);
