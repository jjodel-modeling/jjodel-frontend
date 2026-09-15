/**
 * SymbolCard — the light identity card of the vertex symbol in the rail (D15).
 *
 * The rail declares WHAT the symbol is and leaves the HOW to the modal: this
 * card reads the PERSISTED ir (never a draft: it does not edit), derives the
 * recognition set (D14) and the one preserved axis worth a glance (the border
 * color), and launches the symbol editor through the events registry. The
 * anatomy itself (the Appearance and Text bodies of VertexAuthoringPanel) is
 * re-hosted by SymbolEditorModal: same component, no editorial fork.
 */

import React from 'react';
import type { LViewElement } from '../../../../joiner';
import { recognizeSymbol } from '../ir/symbolRecognition';
import type { VertexViewIR } from '../ir/irTypes';
import SymbolPreview from './SymbolPreview';
import { JjodelEvents } from '../../../../events/registry';
import './SymbolCard.scss';

export interface SymbolCardProps {
    view: LViewElement;
}

/** Same default the authoring panel applies when no border is authored. */
const DEFAULT_BORDER_COLOR = '#334155';

export const SymbolCard: React.FC<SymbolCardProps> = ({ view }) => {
    const ir = (view as any).ir as VertexViewIR | undefined;
    const shape = ir?.shape;
    const matches = shape ? recognizeSymbol(shape) : [];
    const first = matches.length > 0 ? matches[0] : null;
    const notations = [...new Set(matches.map((m) => m.notation))].join(' · ');
    const tail = matches.length > 1 ? matches.slice(1).map((m) => m.label).join(', ') : '';
    // Border color is scalar in the schema (cf. the Border section of the panel).
    const borderColor = shape?.border?.color ?? DEFAULT_BORDER_COLOR;

    return (
        <section className="properties-tab properties-panel symbol-card">
            <div className="symbol-card__row">
                <div className="symbol-card__thumb">
                    {first
                        ? <SymbolPreview preset={first} width={48} />
                        : <i className="bi bi-shapes" aria-hidden="true" />}
                </div>
                <div className="symbol-card__meta">
                    <span className="symbol-card__name">{first ? first.label : 'Custom symbol'}</span>
                    <span className="symbol-card__sub">
                        {first
                            ? notations + (tail ? ` · also: ${tail}` : '')
                            : 'no catalog preset matches these axes'}
                    </span>
                </div>
            </div>

            <div className="symbol-card__axis">
                <span className="jj-field-label">Border</span>
                <span className="symbol-card__axis-value">
                    <span className="symbol-card__swatch" style={{ background: borderColor }} />
                    <span className="symbol-card__hex">{borderColor}</span>
                </span>
            </div>

            <button
                type="button"
                className="btn btn-primary symbol-card__launch"
                onClick={() => window.dispatchEvent(
                    new CustomEvent(JjodelEvents.SYMBOL_EDITOR_OPEN, { detail: { viewId: view.id } })
                )}
            >
                <i className="bi bi-arrows-fullscreen" aria-hidden="true" /> Open symbol editor
            </button>
        </section>
    );
};

export default SymbolCard;
