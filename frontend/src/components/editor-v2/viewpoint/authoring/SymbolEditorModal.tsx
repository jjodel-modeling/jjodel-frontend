/**
 * SymbolEditorModal — the modal surface of the symbol authoring (D15).
 *
 * Canonical cross-cutting pattern (CLAUDE.md 8.7, cf. ImportSummaryModal):
 * mounted once at the app root, CustomEvent dispatcher + local useState
 * listener, no Redux state. The body re-hosts VertexAuthoringPanel unchanged
 * (same component, no editorial fork: the Editor V3 lesson) restricted to the
 * anatomy bodies through the existing activeTab contract; a local mini-bar
 * switches between Appearance and Text. Writing stays live through the
 * panel's own draft cycle: no apply/cancel, no second write path. Closing
 * unmounts the panel, which flushes its pending edit itself.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { LPointerTargetable, type LViewElement } from '../../../../joiner';
import { JjodelEvents } from '../../../../events/registry';
import { recognizeSymbol } from '../ir/symbolRecognition';
import type { VertexViewIR } from '../ir/irTypes';
import { VertexAuthoringPanel } from './VertexAuthoringPanel';
import { IR_TAB_LABELS, type IRTabId } from './irTabs';
import './SymbolEditorModal.scss';

/** The two anatomy bodies the modal re-hosts (memo D15). */
const MODAL_TABS: readonly IRTabId[] = ['ir-appearance', 'ir-text'];

export const SymbolEditorModal: React.FC = () => {
    const [viewId, setViewId] = useState<string | null>(null);
    const [tab, setTab] = useState<IRTabId>('ir-appearance');
    const closeBtnRef = useRef<HTMLButtonElement | null>(null);

    useEffect(() => {
        const handler = (e: Event) => {
            const detail = (e as CustomEvent<{ viewId?: string }>).detail;
            if (detail?.viewId) {
                setViewId(detail.viewId);
                setTab('ir-appearance');
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

    // Read-only subscription on the raw ir: the header recognition follows the
    // live edits the hosted panel commits. No write path exists here.
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
                            Symbol · {first ? first.label : 'Custom symbol'}
                        </h2>
                        <span className="symbol-editor-modal__subtitle">
                            {view.name}{first && notations ? ` · ${notations}` : ''}
                        </span>
                    </div>
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

                <div className="symbol-editor-modal__body" role="tabpanel">
                    <VertexAuthoringPanel view={view} activeTab={tab} />
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
