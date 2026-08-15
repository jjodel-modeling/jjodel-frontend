/**
 * SymbolEditorModal — the modal surface of the symbol authoring (D15/D15b).
 *
 * Canonical cross-cutting pattern (CLAUDE.md 8.7, cf. ImportSummaryModal):
 * mounted once at the app root, CustomEvent dispatcher + local useState
 * listener, no Redux state. Two panes (approved mockup scene): the persistent
 * catalog column on the left (SymbolCatalogPicker in 'column' variant, flat:
 * the sectioned catalog is D18), and on the right a simplified preview strip,
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
import { LPointerTargetable, type LViewElement } from '../../../../joiner';
import { JjodelEvents } from '../../../../events/registry';
import { recognizeSymbol } from '../ir/symbolRecognition';
import {
    applyPresetToShape,
    CATALOG_NOTATIONS,
    NOTATION_CATALOG,
    type SymbolPreset,
} from '../ir/notationCatalog';
import type { VertexViewIR } from '../ir/irTypes';
import { VertexAuthoringPanel } from './VertexAuthoringPanel';
import { SymbolCatalogPicker } from './SymbolCatalogPicker';
import SymbolPreview from './SymbolPreview';
import { IR_TAB_LABELS, type IRTabId } from './irTabs';
import './SymbolEditorModal.scss';

/** The two anatomy bodies the modal re-hosts (memo D15). */
const MODAL_TABS: readonly IRTabId[] = ['ir-appearance', 'ir-text'];

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
    const closeBtnRef = useRef<HTMLButtonElement | null>(null);

    useEffect(() => {
        const handler = (e: Event) => {
            const detail = (e as CustomEvent<{ viewId?: string }>).detail;
            if (detail?.viewId) {
                setViewId(detail.viewId);
                setTab('ir-appearance');
                setLastApplied(null);
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

    // Same canonical write path as the panel (set_ir, whole-object replace);
    // the hosted panel realigns via its external-change reseed.
    const applyPreset = (preset: SymbolPreset) => {
        const current = (view as any).ir as VertexViewIR;
        (view as any).ir = { ...current, shape: applyPresetToShape(current.shape, preset) };
        setLastApplied(preset);
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
                        <SymbolCatalogPicker variant="column" onApply={applyPreset} />
                        <div className="symbol-editor-modal__catalog-foot">
                            {NOTATION_CATALOG.length} presets · {CATALOG_NOTATIONS.length} notations
                        </div>
                    </aside>

                    <div className="symbol-editor-modal__main">
                        <div className="symbol-editor-modal__preview">
                            <span className="symbol-editor-modal__preview-tag">Preview</span>
                            {previewPreset ? (
                                <div className="symbol-editor-modal__preview-stage">
                                    <SymbolPreview preset={previewPreset} width={168} />
                                    {previewLabel ? (
                                        <span className="symbol-editor-modal__preview-label">{previewLabel}</span>
                                    ) : null}
                                </div>
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
