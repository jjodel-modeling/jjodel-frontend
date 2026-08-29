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
 * A rung after the winner is marked `not evaluated` rather than omitted:
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
 *
 * ── Rung 0: what the VIEW declares (Turno 7c) ──────────────────────────────
 *
 * A view can declare a widget for the same feature, in `FormSpec.widgets`. When
 * that widget asks for a different renderer than the metamodel's rule, the ladder
 * gains a rung 0 that names it, the state chip turns from `auto` to `view`, and
 * rung 1 keeps its evidence with an `overridden by current view` badge — because
 * «l'override si giudica sapendo cosa nasconde».
 *
 * SCOPE, stated because the panel must not overclaim: `FormSpec` is, by its own
 * definition in irTypes.ts, «how the same view renders as a FORM of editable
 * widgets instead of a symbol on the canvas». So the view's declaration wins in
 * the FORM, and the row under the pointer here — a canvas compartment — still
 * paints the metamodel's rule. That is why rung 0's tag says «winning rule in the
 * form» rather than «winning rule», and why the footer keeps showing what is
 * actually painted. Extending the precedence to the canvas row is a rendering
 * change, deliberately out of this slice.
 */

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    traceLadder,
    detectValueRenderer,
    DECLARABLE_RENDERERS,
    RENDERER_LABELS,
    type RendererKind,
    type SlotShape,
} from './valueRenderer';
import { declareRowViewAnnotation, clearRowViewAnnotation } from './rowViewAnnotationsWrite';
import { viewRendererOverride } from '../viewpoint/ir/widgetRenderer';
import RowValue from './RowValue';
import { JjodelEvents } from '../../../events/registry';
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

/** Human names for the library members, as the change menu lists them. Defined in
 *  `valueRenderer.ts` (pure) and re-exported here for the importers that had it from
 *  this module - see the note there for why it had to move. */
export { RENDERER_LABELS } from './valueRenderer';

export interface RendererInspectorProps {
    /** Anchor. The popover is positioned against this element's box. */
    anchor: DOMRect | null;
    /** The slot, exactly as the row resolved it. */
    slot: SlotShape;
    /** Metamodel feature id — where an override is written. */
    featureId: string | null;
    /** Name of the owning metaclass, for the header's `· Shape`. */
    className?: string;
    /**
     * The widget the ACTIVE VIEW declares for this feature (`FormSpec.widgets[name]`),
     * when it declares one. Absent = the view says nothing, and there is no rung 0.
     */
    viewWidget?: string;
    /** Id of the view that declares it, for the cross-tab link to the Form tab. */
    viewId?: string;
    /** Drop the view's entry — the Form tab's own Reset, reached from here. */
    onResetViewOverride?: () => void;
    onClose: () => void;
}

function RendererInspector({
    anchor, slot, featureId, className, viewWidget, viewId, onResetViewOverride, onClose,
}: RendererInspectorProps) {
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
    // Null when the view declares nothing, when the metamodel declares nothing to
    // cover, or when the two agree — see `viewRendererOverride` for why agreement is
    // silence and not a badge.
    const viewOverride = viewRendererOverride(slot, viewWidget);

    const openFormTab = () => {
        if (viewId === undefined) return;
        window.dispatchEvent(new CustomEvent(JjodelEvents.IR_AUTHORING_TAB, {
            detail: { viewId, tab: 'ir-form' },
        }));
        onClose();
    };

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
                <span className="inode-inspector__prop">{slot.featureName ?? 'property'}</span>
                {className ? <span className="inode-inspector__class">· {className}</span> : null}
                {/* `auto` while the ladder decides, `declared` once a rule-1
                    declaration exists — the badge is the fastest read of whether
                    the heuristic is still running for this property. */}
                {/* Three states, not two: `auto` while the ladder decides, `declared`
                    once a rule-1 declaration exists, `view` once a view covers it. */}
                <span className={`inode-inspector__badge${viewOverride ? ' inode-inspector__badge--view' : declared ? ' inode-inspector__badge--declared' : ''}`}>
                    {viewOverride ? 'view' : declared ? 'declared' : 'auto'}
                </span>
            </div>

            <div className="inode-inspector__body">
                <div className="inode-inspector__section">Detection ladder</div>

                {viewOverride && (
                    <div className="inode-inspector__rung inode-inspector__rung--view">
                        <span className="inode-inspector__index inode-inspector__index--won">0</span>
                        <div className="inode-inspector__rung-body">
                            <div className="inode-inspector__rung-title">
                                Declared by the view
                                <span className="inode-inspector__won-tag"> — winning rule in the form</span>
                            </div>
                            <div className="inode-inspector__evidence">
                                <code>{`FormSpec.widgets.${slot.featureName ?? 'property'} = "${viewOverride.widget}"`}</code>
                                {viewId !== undefined && (
                                    <>
                                        {' · '}
                                        <button type="button" className="inode-inspector__inline-link" onClick={openFormTab}>
                                            Open the Form tab
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

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
                                    {won ? <span className="inode-inspector__won-tag"> — winning rule</span> : null}
                                    {unreached ? <span className="inode-inspector__unreached-tag"> — not evaluated</span> : null}
                                    {/* The rung the view covers keeps its evidence and gains
                                        the badge: an override is judged by what it hides. */}
                                    {won && viewOverride ? (
                                        <span className="inode-inspector__overridden-tag">overridden by current view</span>
                                    ) : null}
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
                    {/* Named as the canvas's, when a view covers it: the footer shows what is
                        painted here, and rung 0 says the view wins in the form (R-STR-5). The
                        two statements only read as one answer if the footer says which
                        surface it is talking about. */}
                    {viewOverride && <span className="inode-inspector__result-scope">· on the canvas</span>}
                </span>
                {/* Same key the Form tab writes, so the provenance cannot diverge: the
                    Reset removes `FormSpec.widgets[feature]` and rung 0 disappears with
                    it. Offered only when the host can perform the write. */}
                {viewOverride && onResetViewOverride && (
                    <button
                        type="button"
                        className="inode-inspector__action inode-inspector__action--reset-view"
                        onClick={() => { onResetViewOverride(); onClose(); }}
                    >
                        Back to the metamodel renderer
                    </button>
                )}
                <button
                    type="button"
                    className="inode-inspector__action"
                    onClick={() => setMenuOpen((o) => !o)}
                >
                    Change renderer
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
                            <i className="bi bi-arrow-counterclockwise" /> Back to automatic
                        </button>
                    )}
                </div>
            )}
        </div>,
        document.body,
    );
}

export default RendererInspector;
