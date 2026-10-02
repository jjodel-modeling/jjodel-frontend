/**
 * SimNodeRunState: the run state of one node on the canvas (S15, slice A1,
 * P-2026-09-27-1647; ratified 2026-09-27, C-2026-09-27-1437).
 *
 * The R-SIM-3 pattern: mounted by ObjectNode in each of its three branches,
 * fed by the run-state singleton on the `'mark'` version, the IR interpreter
 * and its dependency set untouched (R-SIM-4). What it paints, only while a run
 * knows the node's object:
 * - the tokens of a place of the net, 0 included, as a badge on the corner;
 * - a dashed ring when a candidate transition of some input was compiled from
 *   the object;
 * - the object's semantic σ, one `attr = value` row each, under the node;
 * - slice A2 (P-2026-09-27-2324): a solid ring, in place of the dashed one,
 *   while the object is a candidate of the panel's open «Choose a transition»
 *   list. The overlay follows the choice version too; ObjectNode does not.
 *
 * Mounted as a SIBLING of the node wrapper, inside `.react-flow__node`: the
 * wrapper clips its own overflow (instanceNode.scss), and the badge and the σ
 * card sit outside its box. Absolutely positioned and `pointer-events: none`,
 * so the node keeps its size, its handles and every gesture.
 *
 * P-2026-09-30-1935: `placement: 'inside'`, for a node a derived viewpoint draws
 * (ObjectNode, `ir.generated`): the token is a dot inside the node, 12 px from its
 * left edge, vertically centred, with the count beside it from two; an empty place
 * paints nothing. The rings and the σ card are the corner placement's. Without the
 * prop the overlay renders as before.
 */

import { getSimNodeState, isSimPending, useSimChoiceVersion, useSimVersion } from './simRunState';
import type { SimNodeState } from './simCanvasState';
import './simNodeRunState.scss';

export interface SimNodeRunStateProps {
    /** The DObject id of the node (`idlookup[vertexId].model`); nothing is painted without one. */
    objectId: string | null;
    /** Where the token is drawn: the pill on the corner (absent, the default) or the dot inside a derived view's node. */
    placement?: 'corner' | 'inside';
}

export function SimNodeRunState({ objectId, placement }: SimNodeRunStateProps) {
    // Unconditional (rules of hooks): the overlay re-reads the store on every bump of either channel.
    useSimVersion();
    useSimChoiceVersion();
    if (typeof objectId !== 'string') return null;
    const found = getSimNodeState(objectId);
    const pending = isSimPending(objectId);
    if (!found && !pending) return null;
    // A candidate of the open list is always enabled; the fallback only keeps the ring if that ever fails.
    const s: Pick<SimNodeState, 'tokens' | 'sigma' | 'enabled'> = found ?? { tokens: null, sigma: [], enabled: false };
    const tokensTitle = s.tokens === null ? '' : `${s.tokens} ${s.tokens === 1 ? 'token' : 'tokens'} in the run`;
    const inside = placement === 'inside';
    return (
        <div
            className={inside ? 'sim-node-run sim-node-run--inside' : 'sim-node-run'}
            data-sim-tokens={s.tokens ?? undefined}
            data-sim-enabled={s.enabled ? 'true' : undefined}
            data-sim-pending={pending ? 'true' : undefined}
        >
            {pending
                ? <div className="sim-node-run__pending" title="Candidate of the open choice: pick it in the panel" />
                : s.enabled && <div className="sim-node-run__ring" title="Enabled: can fire in the run" />}
            {inside && s.tokens !== null && s.tokens > 0 && (
                <>
                    <span className="sim-node-run__dot" title={tokensTitle} aria-label={tokensTitle} />
                    {s.tokens > 1 && <span className="sim-node-run__count">{s.tokens}</span>}
                </>
            )}
            {!inside && s.tokens !== null && (
                <span
                    className={`sim-node-run__tokens${s.tokens === 0 ? ' sim-node-run__tokens--empty' : ''}`}
                    title={tokensTitle}
                    aria-label={tokensTitle}
                >
                    <i className="bi bi-circle-fill" aria-hidden="true" />
                    {s.tokens}
                </span>
            )}
            {s.sigma.length > 0 && (
                <div className="sim-node-run__sigma" title={s.sigma.map(r => `${r.attr} = ${r.value}`).join('\n')}>
                    {s.sigma.map(r => (
                        <div key={r.attr} className="sim-node-run__sigma-row">
                            <span className="sim-node-run__sigma-attr">{r.attr}</span>
                            {' = '}
                            <span className="sim-node-run__sigma-value">{r.value}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default SimNodeRunState;
