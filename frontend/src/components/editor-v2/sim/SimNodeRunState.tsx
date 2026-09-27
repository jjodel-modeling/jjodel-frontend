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
 * - the object's semantic σ, one `attr = value` row each, under the node.
 *
 * Mounted as a SIBLING of the node wrapper, inside `.react-flow__node`: the
 * wrapper clips its own overflow (instanceNode.scss), and the badge and the σ
 * card sit outside its box. Absolutely positioned and `pointer-events: none`,
 * so the node keeps its size, its handles and every gesture.
 */

import { getSimNodeState, useSimVersion } from './simRunState';
import './simNodeRunState.scss';

export interface SimNodeRunStateProps {
    /** The DObject id of the node (`idlookup[vertexId].model`); nothing is painted without one. */
    objectId: string | null;
}

export function SimNodeRunState({ objectId }: SimNodeRunStateProps) {
    // Unconditional (rules of hooks): the overlay re-reads the store on every bump.
    useSimVersion();
    if (typeof objectId !== 'string') return null;
    const s = getSimNodeState(objectId);
    if (!s) return null;
    const tokensTitle = s.tokens === null ? '' : `${s.tokens} ${s.tokens === 1 ? 'token' : 'tokens'} in the run`;
    return (
        <div className="sim-node-run" data-sim-tokens={s.tokens ?? undefined} data-sim-enabled={s.enabled ? 'true' : undefined}>
            {s.enabled && <div className="sim-node-run__ring" title="Enabled: can fire in the run" />}
            {s.tokens !== null && (
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
