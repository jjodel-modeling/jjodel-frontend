/**
 * SymbolEditorModal — the modal surface of the symbol authoring (D15/D15b).
 *
 * Canonical cross-cutting pattern (CLAUDE.md 8.7, cf. ImportSummaryModal):
 * mounted once at the app root, CustomEvent dispatcher + local useState
 * listener, no Redux state. Two panes (approved mockup scene): the persistent
 * catalog column on the left (SymbolCatalogPicker in 'column' variant,
 * sectioned per D18, with per-project recents), and on the right the realistic
 * preview strip (D8 wiring: the box of the canvas node, derived or manual),
 * the Appearance/Text mini-bar and VertexAuthoringPanel re-hosted UNCHANGED
 * (same component, no editorial fork: the Editor V3 lesson).
 *
 * Writing stays live: applying a preset and «Reset to preset» go through the
 * same canonical whole-object set_ir the panel uses; the hosted panel realigns
 * through its own external-change reseed. «Modified from X» is session state
 * of this modal (memo D14), never persisted. Closing unmounts the panel,
 * which flushes its pending edit itself.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { LPointerTargetable, U, type LViewElement } from '../../../../joiner';
import { JjodelEvents } from '../../../../events/registry';
import { recognizeSymbol } from '../ir/symbolRecognition';
import {
    applyPresetToShape,
    CATALOG_FAMILIES,
    NOTATION_CATALOG,
    type SymbolPreset,
} from '../ir/notationCatalog';
import type { VertexViewIR } from '../ir/irTypes';
import { VertexAuthoringPanel } from './VertexAuthoringPanel';
import { SymbolCatalogPicker } from './SymbolCatalogPicker';
import SymbolPreview from './SymbolPreview';
import { SymbolBoxPreview, captionForBox } from './SymbolBoxPreview';
import { useCanvasNodeBox } from './useCanvasNodeBox';
import { readVertexLayout, type VertexLayoutSource } from '../layout/vertexLayout';
import { getLayoutKeyOf } from '../layout/vertexLayoutAdapter';
import { IR_TAB_LABELS, type IRTabId } from './irTabs';
import './SymbolEditorModal.scss';

/** The two anatomy bodies the modal re-hosts (memo D15). */
const MODAL_TABS: readonly IRTabId[] = ['ir-appearance', 'ir-text'];

/**
 * Stage bounds of the preview strip (D8 wiring). The strip keeps its FIXED
 * 132px height (no layout shifts): a large box scales down to fit these
 * bounds, it never stretches the strip. Height leaves room for the Preview
 * tag above and the caption below; width stays inside the main pane.
 */
const PREVIEW_MAX_W = 560;
const PREVIEW_MAX_H = 88;

/**
 * Recents (D18): per-project preset ids, most recent first, persisted in
 * localStorage under the documented key idiom (cf. EditorSwitch,
 * `jjodel.editorPrefs.${modelid}`). Modal state is the source of truth while
 * the app runs; storage is read on every open (the project can differ between
 * opens) and written on every apply. Storage failures (privacy mode, quota)
 * are swallowed: recents are a convenience, never load-bearing. Ids are
 * resolved against the catalog at render, so stale ids simply disappear.
 */
const RECENTS_KEY_PREFIX = 'jjodel.symbolRecents.';
const RECENTS_CAP = 6;

function readRecents(projectId: string | null): string[] {
    if (!projectId) return [];
    try {
        const raw = localStorage.getItem(RECENTS_KEY_PREFIX + projectId);
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter((x): x is string => typeof x === 'string').slice(0, RECENTS_CAP);
    } catch {
        return [];
    }
}

function writeRecents(projectId: string | null, ids: readonly string[]): void {
    if (!projectId) return;
    try {
        localStorage.setItem(RECENTS_KEY_PREFIX + projectId, JSON.stringify(ids));
    } catch {
        // best-effort persistence, the in-memory state keeps working
    }
}

/**
 * The current authored axes as a preset VALUE for SymbolPreview, or null when
 * the form is conditional (no honest static preview exists). Conditional
 * marker/fill are simply omitted: the strip previews the scalar baseline.
 */
function currentAxesPreset(shape: VertexViewIR['shape']): SymbolPreset | null {
    if (typeof shape.form !== 'string') return null;
    return {
        id: '__current-axes',
        label: '',
        notation: '',
        values: {
            form: shape.form,
            border: shape.border ? { style: shape.border.style, width: shape.border.width } : undefined,
            marker: typeof shape.marker === 'string' && shape.marker !== '' ? shape.marker : undefined,
            fill: typeof shape.fill === 'string' && shape.fill !== '' ? shape.fill : undefined,
        },
    };
}

export const SymbolEditorModal: React.FC = () => {
    const [viewId, setViewId] = useState<string | null>(null);
    const [tab, setTab] = useState<IRTabId>('ir-appearance');
    // «Modified from X» (memo D14): remembered only after an application in
    // THIS modal session; reset on every open.
    const [lastApplied, setLastApplied] = useState<SymbolPreset | null>(null);
    // Recents (D18): reloaded per project on open, NOT reset like lastApplied.
    const [recentIds, setRecentIds] = useState<readonly string[]>([]);
    const closeBtnRef = useRef<HTMLButtonElement | null>(null);

    useEffect(() => {
        const handler = (e: Event) => {
            const detail = (e as CustomEvent<{ viewId?: string }>).detail;
            if (detail?.viewId) {
                setViewId(detail.viewId);
                setTab('ir-appearance');
                setLastApplied(null);
                setRecentIds(readRecents(U.getProjectID_URL()));
            }
        };
        window.addEventListener(JjodelEvents.SYMBOL_EDITOR_OPEN, handler);
        return () => window.removeEventListener(JjodelEvents.SYMBOL_EDITOR_OPEN, handler);
    }, []);

    // Esc closes. The hosted panel flushes its pending valid edit on unmount,
    // so closing loses nothing (criterion d of the D15 prompt).
    useEffect(() => {
        if (!viewId) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setViewId(null);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [viewId]);

    useEffect(() => {
        if (viewId && closeBtnRef.current) closeBtnRef.current.focus();
    }, [viewId]);

    // Read-only subscription on the raw ir: header, preview and recognition
    // follow the live edits the hosted panel commits. No write path here
    // besides the canonical set_ir of apply/reset below.
    const ir = useSelector((s: any): VertexViewIR | undefined =>
        viewId ? s?.idlookup?.[viewId]?.ir : undefined);

    // Realistic preview (D8 wiring): the box of the canvas node rendering this
    // view, read from the DOM (the canvas stays mounted under the modal).
    const nodeBox = useCanvasNodeBox(viewId);
    // Manual-size facts of the representative vertex, as a primitive signature
    // so the subscription cannot re-render the modal on unrelated store
    // updates. '' = not resized; 'WxH' with manualSizeOf's exact gate (both
    // dimensions positive), '0x0'-shaped = resized but invalid D-layer size.
    // Read PER LAYOUT (slice 1c): the manual size the preview must show is the one of the
    // layout in force, not the seed. Reading the key inside the selector also makes the
    // signature move at a layout change, with no extra dependency.
    const manualSig = useSelector((s: any): string => {
        const raw = nodeBox ? s?.idlookup?.[nodeBox.vertexId] : undefined;
        const eff = readVertexLayout((raw ?? {}) as VertexLayoutSource, getLayoutKeyOf(s));
        if (!eff.isResized) return '';
        const w = typeof eff.w === 'number' && eff.w > 0 ? eff.w : 0;
        const h = typeof eff.h === 'number' && eff.h > 0 ? eff.h : 0;
        return `${w}x${h}`;
    });

    if (!viewId) return null;

    let view: LViewElement | null = null;
    try { view = LPointerTargetable.fromPointer(viewId) as unknown as LViewElement; } catch { view = null; }
    // View deleted (or ir gone) while the modal is open: nothing to edit.
    if (!view || !ir || ir.kind !== 'vertex') return null;

    const matches = recognizeSymbol(ir.shape);
    const first = matches.length > 0 ? matches[0] : null;
    const notations = [...new Set(matches.map((m) => m.notation))].join(' · ');
    const la = lastApplied;
    const modified = la !== null && !matches.some((m) => m.id === la.id);
    const state: 'preset' | 'modified' | 'custom' = modified ? 'modified' : first ? 'preset' : 'custom';
    const titleLabel = modified && la ? la.label : first ? first.label : 'Custom symbol';

    const target = Array.isArray(ir.metaclasses) && ir.metaclasses.length > 0 ? ir.metaclasses[0] : null;
    const previewPreset = currentAxesPreset(ir.shape);
    const previewLabel = (typeof ir.label === 'string' && ir.label !== '') ? ir.label : (view.name as string);

    // Preview box (D8 wiring). Precedence mirrors the engine: the manual size
    // wins and switches the derivation off (useContentSize gates on
    // !isResized). Manual numbers come from the D-layer, per the acceptance
    // criterion; a raised isResized with an invalid D-layer size keeps the
    // manual caption on the DOM numbers (the flag is the user's intent).
    // Without a canvas node there is no box: the strip degrades to the
    // symbolic glyph and says so, no number is invented.
    const isResized = manualSig !== '';
    const [manualW, manualH] = isResized ? manualSig.split('x').map(Number) : [0, 0];
    const manualValid = manualW > 0 && manualH > 0;
    const previewBox = nodeBox
        ? (isResized && manualValid ? { w: manualW, h: manualH } : { w: nodeBox.w, h: nodeBox.h })
        : null;

    // Same canonical write path as the panel (set_ir, whole-object replace);
    // the hosted panel realigns via its external-change reseed.
    const applyPreset = (preset: SymbolPreset) => {
        const current = (view as any).ir as VertexViewIR;
        (view as any).ir = { ...current, shape: applyPresetToShape(current.shape, preset) };
        setLastApplied(preset);
        // Recents (D18): dedupe, most recent first, capped; applying from the
        // strip itself re-applies and moves the preset back to the front.
        setRecentIds((prev) => {
            const next = [preset.id, ...prev.filter((id) => id !== preset.id)].slice(0, RECENTS_CAP);
            writeRecents(U.getProjectID_URL(), next);
            return next;
        });
    };

    const close = () => setViewId(null);

    return (
        <div className="symbol-editor-modal-backdrop" onClick={close} role="presentation">
            <div
                className="symbol-editor-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="symbol-editor-modal-title"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="symbol-editor-modal__header">
                    <div className="symbol-editor-modal__icon"><i className="bi bi-shapes" aria-hidden="true" /></div>
                    <div className="symbol-editor-modal__heading">
                        <h2 id="symbol-editor-modal-title" className="symbol-editor-modal__title">
                            Symbol · <span className="symbol-editor-modal__title-name">{titleLabel}</span>
                            <span className={`symbol-editor-modal__state symbol-editor-modal__state--${state}`}>{state}</span>
                        </h2>
                        <span className="symbol-editor-modal__subtitle">
                            {view.name}
                            {target ? <> · applies to <strong>{target}</strong></> : null}
                            {!modified && first && notations ? ` · ${notations}` : null}
                        </span>
                    </div>
                    {modified && la && (
                        <button
                            type="button"
                            className="btn btn-secondary symbol-editor-modal__reset"
                            title="Reapply the preset axes; the border color stays yours"
                            onClick={() => applyPreset(la)}
                        >
                            <i className="bi bi-arrow-counterclockwise" aria-hidden="true" /> Reset to preset
                        </button>
                    )}
                    <button
                        type="button"
                        className="symbol-editor-modal__close-btn"
                        onClick={close}
                        aria-label="Close"
                        ref={closeBtnRef}
                    >
                        <i className="bi bi-x-lg" aria-hidden="true" />
                    </button>
                </div>

                <div className="symbol-editor-modal__body">
                    <aside className="symbol-editor-modal__catalog">
                        <SymbolCatalogPicker variant="column" onApply={applyPreset} recentIds={recentIds} />
                        <div className="symbol-editor-modal__catalog-foot">
                            {NOTATION_CATALOG.length} presets · {CATALOG_FAMILIES.length} families
                        </div>
                    </aside>

                    <div className="symbol-editor-modal__main">
                        <div className="symbol-editor-modal__preview">
                            <span className="symbol-editor-modal__preview-tag">Preview</span>
                            {previewPreset ? (
                                previewBox ? (
                                    <>
                                        <SymbolBoxPreview
                                            preset={previewPreset}
                                            box={previewBox}
                                            label={previewLabel}
                                            borderColor={typeof ir.shape.border?.color === 'string' && ir.shape.border.color !== ''
                                                ? ir.shape.border.color : undefined}
                                            maxW={PREVIEW_MAX_W}
                                            maxH={PREVIEW_MAX_H}
                                        />
                                        <span className="symbol-editor-modal__preview-caption">
                                            {captionForBox(previewBox, isResized ? 'manual' : 'derived')}
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <div className="symbol-editor-modal__preview-stage">
                                            <SymbolPreview preset={previewPreset} width={168} />
                                            {previewLabel ? (
                                                <span className="symbol-editor-modal__preview-label">{previewLabel}</span>
                                            ) : null}
                                        </div>
                                        <span className="symbol-editor-modal__preview-caption">
                                            symbolic preview · no node on canvas
                                        </span>
                                    </>
                                )
                            ) : (
                                <span className="symbol-editor-modal__preview-empty">
                                    Conditional form: no static preview
                                </span>
                            )}
                        </div>

                        <div className="symbol-editor-modal__tabs" role="tablist">
                            {MODAL_TABS.map((id) => (
                                <button
                                    key={id}
                                    type="button"
                                    role="tab"
                                    aria-selected={tab === id}
                                    className={`symbol-editor-modal__tab${tab === id ? ' is-active' : ''}`}
                                    onClick={() => setTab(id)}
                                >
                                    {IR_TAB_LABELS[id]}
                                </button>
                            ))}
                        </div>

                        <div className="symbol-editor-modal__panel" role="tabpanel">
                            <VertexAuthoringPanel view={view} activeTab={tab} />
                        </div>
                    </div>
                </div>

                <div className="symbol-editor-modal__footer">
                    <span className="symbol-editor-modal__hint">
                        <i className="bi bi-info-circle" aria-hidden="true" /> Changes apply immediately to the canvas. Esc closes.
                    </span>
                    <button type="button" className="btn btn-primary" onClick={close}>Close</button>
                </div>
            </div>
        </div>
    );
};

export default SymbolEditorModal;
