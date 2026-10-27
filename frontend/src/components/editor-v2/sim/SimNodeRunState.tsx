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
 *
 * P-2026-10-03-0120 (R-SIM-107, R-SIM-109): the σ card under every node is gone.
 * Under the node, tags instead: σ's for the attributes the viewer tagged
 * (simViewerPrefs.ts) and for those the step shown changed, for that step only,
 * solid slate with the glyph σ and the change in the run's cyan; with the canvas
 * switch «Inspect node.[x]» on, node's, one per presentation value, dashed pink
 * (R-SIM-102). The overlay follows the viewer preferences' channel too.
 *
 * P-2026-10-06-0115 (R-SIM-140): with the canvas layer's «Coverage» on for the
 * model, a place or an element a transition was compiled from shows the counts
 * of simCoverage.ts: never visited or never fired, a muted veil in the empty
 * token's colours over the node; otherwise its count, discreet, on the bottom
 * right corner. Painted for such an element even when the run shows nothing
 * else of it. Coverage off, the overlay renders as before. It follows the
 * coverage channel too.
 */

import { getSimNodeState, getSimRun, isSimPending, useSimChoiceVersion, useSimVersion } from './simRunState';
import type { SimNodeState, SimSigmaRow } from './simCanvasState';
import { getSimViewerPrefs, useSimViewerPrefsVersion } from './simViewerPrefs';
import { getSimNodeCoverage, useSimCoverageVersion } from './simCoverage';
import './simNodeRunState.scss';

export interface SimNodeRunStateProps {
    /** The DObject id of the node (`idlookup[vertexId].model`); nothing is painted without one. */
    objectId: string | null;
    /** Where the token is drawn: the pill on the corner (absent, the default) or the dot inside a derived view's node. */
    placement?: 'corner' | 'inside';
}

export function SimNodeRunState({ objectId, placement }: SimNodeRunStateProps) {
    // Unconditional (rules of hooks): the overlay re-reads the store on every bump of any of its channels.
    useSimVersion();
    useSimChoiceVersion();
    useSimViewerPrefsVersion();
    useSimCoverageVersion();
    if (typeof objectId !== 'string') return null;
    const found = getSimNodeState(objectId);
    const pending = isSimPending(objectId);
    // R-SIM-140: the counts, only while the canvas layer's «Coverage» is on for the model.
    const known = getSimNodeCoverage(objectId);
    const cov = known && getSimViewerPrefs(known.modelId).coverage === true ? known : null;
    if (!found && !pending && !cov) return null;
    // A candidate of the open list is always enabled; the fallback only keeps the ring if that ever fails.
    const s: Pick<SimNodeState, 'tokens' | 'sigma' | 'enabled'> = found ?? { tokens: null, sigma: [], enabled: false };
    const tokensTitle = s.tokens === null ? '' : `${s.tokens} ${s.tokens === 1 ? 'token' : 'tokens'} in the run`;
    const inside = placement === 'inside';
    // R-SIM-107: σ's tags, the attributes tagged by the viewer (by metaclass and name) and those the step shown changed.
    const prefs = found ? getSimViewerPrefs(found.modelId) : null;
    const declared = found ? getSimRun(found.modelId)?.net.declared.get(objectId) : undefined;
    const sigmaTags: SimSigmaRow[] = prefs
        ? s.sigma.filter(r => r.before !== undefined || prefs.tags.some(t => t.space === 'semantic' && t.name === r.attr
            && t.metaclass === (declared?.get(r.attr)?.metaclass ?? null)))
        : [];
    // R-SIM-109: node's tags, every presentation value, while the canvas switch is on.
    const nodeTags: readonly SimSigmaRow[] = prefs?.inspectNode ? found?.presentation ?? [] : [];
    const valueText = (r: SimSigmaRow) => (r.before !== undefined ? `${r.before ?? '—'} → ${r.value}` : r.value);
    return (
        <div
            className={inside ? 'sim-node-run sim-node-run--inside' : 'sim-node-run'}
            data-sim-tokens={s.tokens ?? undefined}
            data-sim-enabled={s.enabled ? 'true' : undefined}
            data-sim-pending={pending ? 'true' : undefined}
            data-sim-cov={cov ? cov.count : undefined}
        >
            {cov && cov.count === 0 && (
                <div
                    className="sim-node-run__cov-veil"
                    title={cov.kind === 'place' ? 'Never visited since the counts were cleared' : 'Never fired since the counts were cleared'}
                />
            )}
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
            {(sigmaTags.length > 0 || nodeTags.length > 0) && (
                <div className="sim-node-run__tags">
                    {sigmaTags.map(r => (
                        <span
                            key={`σ\u0000${r.attr}`}
                            className={`sim-node-run__tag sim-node-run__tag--sigma${r.before !== undefined ? ' sim-node-run__tag--changed' : ''}`}
                            title={`σ: self.[${r.attr}]${r.kind ? ` · ${r.kind}` : ''} = ${valueText(r)}${r.before !== undefined ? ' (changed by this step)' : ''}`}
                        >
                            <span className="sim-node-run__tag-glyph">σ</span>
                            <span className={`sim-node-run__tag-attr${r.kind === 'DEFINE' ? ' sim-node-run__tag-attr--define' : ''}`}>{r.attr}</span>
                            <span className="sim-node-run__tag-value">{valueText(r)}</span>
                        </span>
                    ))}
                    {nodeTags.map(r => (
                        <span
                            key={`node\u0000${r.attr}`}
                            className={`sim-node-run__tag sim-node-run__tag--node${r.before !== undefined ? ' sim-node-run__tag--changed' : ''}`}
                            title={`node.[${r.attr}]${r.kind ? ` · ${r.kind}` : ''} = ${valueText(r)}`}
                        >
                            <span className={`sim-node-run__tag-attr${r.kind === 'DEFINE' ? ' sim-node-run__tag-attr--define' : ''}`}>{r.attr}</span>
                            <span className="sim-node-run__tag-value">{valueText(r)}</span>
                        </span>
                    ))}
                </div>
            )}
            {cov && cov.count > 0 && (
                <span
                    className="sim-node-run__cov"
                    title={`${cov.kind === 'place' ? 'Visited' : 'Fired'} ${cov.count} ${cov.count === 1 ? 'time' : 'times'} since the counts were cleared`}
                >
                    {`×${cov.count}`}
                </span>
            )}
        </div>
    );
}

export default SimNodeRunState;
