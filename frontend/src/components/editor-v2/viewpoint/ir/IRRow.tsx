/**
 * IRRow — renders a single containment child as an inline text row (Fase R2).
 *
 * Read-only (spec R2 P2: no selection, no inline editing — nothing but rendering).
 * The child's row view is resolved for its own concrete metaclass (resolveRowView, R1)
 * with the built-in defaultRowViewIR fallback; the component owns a per-child
 * subscription (useIRRowView) so it re-renders on a change to the CHILD without
 * touching the host node. Same `.ir-row` class as the slot-mode rows for visual
 * consistency (no new style).
 */
import { useIRRowView } from './irResolve';
import { resolveTextStyle } from './IRNodeContent';

export interface IRRowProps {
    /** DObject id of the containment child rendered by this row. */
    childObjectId: string;
}

function IRRow({ childObjectId }: IRRowProps) {
    const res = useIRRowView(childObjectId);
    if (!res) return null;
    const { compiled, objectId, readCtx } = res;
    if (!compiled.visible(readCtx, objectId)) return null;
    // Row style (ir-1.3 TS2) inline on the row itself: it wins over the host
    // compartment's rowFormat.style and the host node's shape.text, both of which
    // reach here by inheritance.
    return (
        <div className="ir-row" style={resolveTextStyle(compiled.style, readCtx, objectId)}>
            {compiled.template.map((seg, i) => {
                const v = seg(readCtx, objectId);
                return <span key={i}>{v == null ? '' : String(v)}</span>;
            })}
        </div>
    );
}

export default IRRow;
