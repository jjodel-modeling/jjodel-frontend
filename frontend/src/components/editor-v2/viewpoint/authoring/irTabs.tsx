import React from 'react';
import type { CSSProperties } from 'react';
import { Input, type LViewElement, type LViewPoint } from '../../../../joiner';
import { ViewParentingFields } from '../../../viewParenting/ViewParentingFields';
import { InfoTooltip } from '../../../ui';

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
 * The single extra prop `ViewData` passes down for the relocated fields: what they
 * need beyond the view itself. Bundled into one object because the amendment allows
 * exactly one additional prop per panel.
 */
export interface IRIdentityProps {
    viewpoints: LViewPoint[];
    readOnly: boolean;
}

export interface IRIdentityFieldsProps extends IRIdentityProps {
    view: LViewElement;
}

/**
 * The authoritative controls of the legacy Apply-to tab, relocated into the IR
 * `Applies to` body (R-H, 2026-08-06). The five-tab bar no longer offers that tab to
 * an IR view, and these are the only controls on it the triage of 2026-08-04 rates
 * authoritative: `name` has no other writer, and `father` decides which index the
 * resolver files the view under (`irResolveCore.ts:113`).
 *
 * `name` is still the `Input` of `joiner` bound by `data`/`field`, as R-H relocated it.
 * The parenting controls are not duplicated markup any more: the defect R-H registered
 * and left standing — the Viewpoint and the Parent view selects writing the SAME
 * `father` field, so reparenting through one lost what the other meant — was fixed in
 * voce 4 (2026-08-07) by making the viewpoint derived and `father` single-writer, and
 * the block now lives in `ViewParentingFields`, shared with `InfoData.tsx`.
 */
export const IRIdentityFields: React.FC<IRIdentityFieldsProps> = ({ view, viewpoints, readOnly }) => {
    return (
        <>
            {/* Name */}
            <div className="jj-field">
                <label className="jj-field-label">
                    Name <span className="jj-field-required">*</span>
                    <InfoTooltip text="Display name of this view" />
                </label>
                <Input data={view} field={'name'} readOnly={readOnly} />
            </div>

            {/* Viewpoint (derived) + Parent view + Move to viewpoint — voce 4, 2026-08-07.
                The two selects that both wrote `father` are gone: one block, one writer.
                Shared verbatim with the legacy Apply-to tab, which mounts the same
                component instead of a second copy of the markup. */}
            <ViewParentingFields view={view} viewpoints={viewpoints} readOnly={readOnly} />
        </>
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
