/**
 * RendererInspector — why THIS renderer, stated as the whole ladder.
 *
 * Design handoff: `Instance Node Proposal.dc.html`, Turno 5c, and README.md,
 * "Value-renderer detection":
 *
 *   «Inference must be visible and reversible. A guessed renderer that cannot
 *    be corrected is worse than flat text.»
 *
 * ── Why all four rungs and not just the winner ─────────────────────────────
 *
 * A heuristic that shows only its answer cannot be argued with. If the panel
 * said "swatch, inferred from a CSS colour enum" and stopped, a user who
 * disagreed would have exactly one recourse — override this property by hand,
 * and then the next one, and then the one after that — and would never learn
 * which rule to fix at the metamodel instead. Showing the discarded rungs turns
 * the panel from a verdict into an argument: rung 2 says `"Green" is not a
 * colour literal`, so the user knows the value is not the problem; rung 3 says
 * `all 3 literals of Palette are CSS colour names`, so they know exactly which
 * evidence to change if the reading is wrong.
 *
 * This is also the only thing that makes rule 4 — the attribute NAME — safe to
 * keep in the ladder at all. A name-based tie-break that fires invisibly is the
 * heuristic the handoff spends a paragraph rejecting; the same tie-break that
 * announces itself, states which name it matched, and can be overruled in one
 * click is a convenience. The display is what changes its character.
 *
 * A rung after the winner is marked `non valutata` rather than omitted:
 * "it did not apply" and "we never asked" are different facts about the model,
 * and collapsing them would misreport the ladder.
 *
 * ── The override promotes to the metamodel ─────────────────────────────────
 *
 * Choosing a renderer here writes `jjodel/renderer=…` on the DAttribute, not on
 * the DValue in front of the user. It becomes the rule-1 declaration, it governs
 * every instance of the class, and the ladder stops running for that property —
 * which is exactly the behaviour README.md specifies: «the heuristic accelerates
 * the first encounter; it is not a permanent mechanism.»
 */

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    traceLadder,
    detectValueRenderer,
    DECLARABLE_RENDERERS,
    type RendererKind,
    type SlotShape,
} from './valueRenderer';
import { declareRowViewAnnotation, clearRowViewAnnotation } from './rowViewAnnotationsWrite';
import RowValue from './RowValue';
import './rendererInspector.scss';

const POPOVER_WIDTH = 400;

/** Same geometry as `TextStyleField.tsx`: flip up when below does not fit. */
function computePopoverStyle(rect: DOMRect): React.CSSProperties {
    const GAP = 6, MARGIN = 8, PREF = 340;
    const spaceBelow = window.innerHeight - rect.bottom - MARGIN;
    const spaceAbove = rect.top - MARGIN;
    const openUp = spaceBelow < PREF && spaceAbove > spaceBelow;
    const maxHeight = Math.max(200, (openUp ? spaceAbove : spaceBelow) - GAP);
    const left = Math.max(MARGIN, Math.min(rect.left, window.innerWidth - POPOVER_WIDTH - MARGIN));
    const base: React.CSSProperties = { left, width: POPOVER_WIDTH, maxHeight };
    return openUp
        ? { ...base, bottom: window.innerHeight - rect.top + GAP }
        : { ...base, top: rect.bottom + GAP };
}

/** Human names for the library members, as the change menu lists them. */
const RENDERER_LABELS: Record<string, string> = {
    swatch: 'Swatch colore',
    enumChip: 'Chip enum',
    boolean: 'Booleano',
    numberUnit: 'Numero con unità',
    date: 'Data',
    truncatedText: 'Testo troncato',
    progress: 'Barra di progresso',
    code: 'Codice / mono',
};

export interface RendererInspectorProps {
    /** Anchor. The popover is positioned against this element's box. */
    anchor: DOMRect | null;
    /** The slot, exactly as the row resolved it. */
    slot: SlotShape;
    /** Metamodel feature id — where an override is written. */
    featureId: string | null;
    /** Name of the owning metaclass, for the header's `· Shape`. */
    className?: string;
    onClose: () => void;
}

function RendererInspector({ anchor, slot, featureId, className, onClose }: RendererInspectorProps) {
    const popoverRef = useRef<HTMLDivElement>(null);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const onDocMouseDown = (e: MouseEvent) => {
            if (popoverRef.current?.contains(e.target as Node)) return;
            onClose();
        };
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('mousedown', onDocMouseDown, true);
        document.addEventListener('keydown', onKey, true);
        return () => {
            document.removeEventListener('mousedown', onDocMouseDown, true);
            document.removeEventListener('keydown', onKey, true);
        };
    }, [onClose]);

    if (!anchor) return null;

    const trace = traceLadder(slot);
    const decision = detectValueRenderer(slot);
    const declared = !!slot.rendererOverride;

    const apply = (kind: RendererKind) => {
        // The write lands on the metamodel feature, so it governs every instance
        // of the class — not on the one slot the user happened to be looking at.
        if (featureId) declareRowViewAnnotation(featureId, 'renderer', kind);
        setMenuOpen(false);
        onClose();
    };

    const reset = () => {
        if (featureId) clearRowViewAnnotation(featureId, 'renderer');
        setMenuOpen(false);
        onClose();
    };

    return createPortal(
        <div ref={popoverRef} className="inode-inspector" style={computePopoverStyle(anchor)}>
            <div className="inode-inspector__header">
                <span className="inode-inspector__prop">{slot.featureName ?? 'proprietà'}</span>
                {className ? <span className="inode-inspector__class">· {className}</span> : null}
                {/* `auto` while the ladder decides, `dichiarato` once a rule-1
                    declaration exists — the badge is the fastest read of whether
                    the heuristic is still running for this property. */}
                <span className={`inode-inspector__badge${declared ? ' inode-inspector__badge--declared' : ''}`}>
                    {declared ? 'dichiarato' : 'auto'}
                </span>
            </div>

            <div className="inode-inspector__body">
                <div className="inode-inspector__section">Ladder di detection</div>

                {trace.rungs.map((rung) => {
                    const won = rung.status === 'fired';
                    const unreached = rung.status === 'not-evaluated';
                    return (
                        <div
                            key={rung.index}
                            className={`inode-inspector__rung${won ? ' inode-inspector__rung--won' : ''}${unreached ? ' inode-inspector__rung--unreached' : ''}`}
                        >
                            <span className={`inode-inspector__index${won ? ' inode-inspector__index--won' : ''}`}>
                                {rung.index}
                            </span>
                            <div className="inode-inspector__rung-body">
                                <div className="inode-inspector__rung-title">
                                    {rung.title}
                                    {won ? <span className="inode-inspector__won-tag"> — regola vincente</span> : null}
                                    {unreached ? <span className="inode-inspector__unreached-tag"> — non valutata</span> : null}
                                </div>
                                {/* Deliberately nothing for an unreached rung: it
                                    has no evidence, and inventing one would be the
                                    failure this whole panel exists to prevent. */}
                                {rung.evidence ? (
                                    <div className="inode-inspector__evidence">{rung.evidence}</div>
                                ) : null}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="inode-inspector__footer">
                {/* The resolved renderer in its ACTUAL row form, not a name for
                    it: the user is choosing between renderings, so the panel has
                    to show renderings. Same component the compartment uses. */}
                <span className="inode-inspector__result">
                    <RowValue decision={decision} values={slot.values ?? [slot.value]} variant="row" />
                </span>
                <button
                    type="button"
                    className="inode-inspector__action"
                    onClick={() => setMenuOpen((o) => !o)}
                >
                    Cambia renderer
                </button>
            </div>

            {menuOpen && (
                <div className="inode-inspector__menu">
                    {DECLARABLE_RENDERERS.map((kind) => (
                        <button
                            key={kind}
                            type="button"
                            className={`inode-inspector__menu-item${slot.rendererOverride === kind ? ' inode-inspector__menu-item--active' : ''}`}
                            onClick={() => apply(kind)}
                        >
                            {RENDERER_LABELS[kind] ?? kind}
                        </button>
                    ))}
                    {declared && (
                        <button
                            type="button"
                            className="inode-inspector__menu-item inode-inspector__menu-item--reset"
                            onClick={reset}
                        >
                            <i className="bi bi-arrow-counterclockwise" /> Torna automatico
                        </button>
                    )}
                </div>
            )}
        </div>,
        document.body,
    );
}

export default RendererInspector;
