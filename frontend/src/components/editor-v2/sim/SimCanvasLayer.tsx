/**
 * SimCanvasLayer: what the canvas carries of a run beside the node overlays
 * (R-SIM-107, R-SIM-109; P-2026-10-03-0120, discovery 2026-10-02 §7).
 *
 * Mounted by SimulationPanel while a run of its model exists, a sibling of the
 * panel inside the editor, so it hides with its tab. In the canvas's top-right
 * corner, clear of the rail (`--jj-canvas-right-inset`, read, never defined):
 * - the «Inspect node.[x]» switch, off by default: on, every element with
 *   presentation state carries dashed pink tags of its values (SimNodeRunState);
 * - when the model has globals, the toggle of the globals card, off by default,
 *   and the card itself: the globals on the step shown, σ's key (R-SIM-102).
 *
 * Both are viewer preferences (simViewerPrefs.ts): outside Redux, never in a
 * bag, kept across Reset and Stop. The layer reads them on their own channel,
 * and the run on the `'mark'` version, so a past step viewed (R-SIM-106) shows
 * its globals too.
 */

import type { ReactElement } from 'react';
import { configAt, getSimRun, getSimView, useSimVersion } from './simRunState';
import { stateKindOf, stateValueOf } from './simCanvasState';
import { getSimViewerPrefs, setSimViewerPrefs, useSimViewerPrefsVersion } from './simViewerPrefs';

export interface SimCanvasLayerProps {
    /** The M1 model whose run the canvas shows. */
    modelId: string;
}

export function SimCanvasLayer({ modelId }: SimCanvasLayerProps): ReactElement | null {
    useSimVersion();
    useSimViewerPrefsVersion();
    const run = getSimRun(modelId);
    if (!run) return null;
    const prefs = getSimViewerPrefs(modelId);
    const live = run.trace?.length ?? 0;
    const n = getSimView(modelId) ?? live;
    const state = configAt(run, n)?.state ?? run.config.state;
    const prev = n > 0 ? configAt(run, n - 1)?.state ?? null : null;
    // The globals of the model: the semantic declarations on the model's own id, stored and derived; inputs are not state.
    const globals = [...(run.net.declared.get(run.net.modelId)?.values() ?? [])]
        .filter(d => d.space === 'semantic' && d.input !== true)
        .sort((a, b) => a.name.localeCompare(b.name));
    return (
        <div className="sim-canvas-layer">
            <div className="sim-canvas-layer__controls">
                {globals.length > 0 && (
                    <button
                        type="button"
                        className="sim-canvas-layer__toggle"
                        aria-pressed={prefs.globalsCard}
                        title={prefs.globalsCard ? 'Hide the globals card' : 'Show the globals of the run in a card on the canvas'}
                        onClick={() => setSimViewerPrefs(modelId, { globalsCard: !prefs.globalsCard })}
                    >
                        <span className="sim-state-glyph">σ</span>
                        <span>Globals</span>
                    </button>
                )}
                <span className="sim-canvas-layer__switch-label" id={`sim-inspect-node-${modelId}`}>Inspect node.[x]</span>
                <button
                    type="button"
                    role="switch"
                    className={`jjodel-switch${prefs.inspectNode ? ' checked' : ''}`}
                    aria-checked={prefs.inspectNode}
                    aria-labelledby={`sim-inspect-node-${modelId}`}
                    data-checked={prefs.inspectNode ? 'true' : 'false'}
                    title="Tag every element with its presentation state, node.[x], dashed"
                    onClick={() => setSimViewerPrefs(modelId, { inspectNode: !prefs.inspectNode })}
                />
            </div>
            {prefs.globalsCard && globals.length > 0 && (
                <div className="sim-canvas-globals" aria-label="Globals of the run">
                    <div className="sim-canvas-globals__head">
                        <span className="sim-state-glyph">σ</span>
                        <span>Globals</span>
                        <span className="sim-canvas-globals__step">{n === live ? `step ${n}` : `step ${n} of ${live}`}</span>
                    </div>
                    {globals.map(d => {
                        const value = stateValueOf(state, 'semantic', run.net.modelId, d.name);
                        const old = prev ? stateValueOf(prev, 'semantic', run.net.modelId, d.name) : value;
                        const changed = old !== value;
                        const shown = value === undefined ? '—' : String(value);
                        const text = changed ? `${old === undefined ? '—' : String(old)} → ${shown}` : shown;
                        const kind = stateKindOf(d);
                        return (
                            <div className="sim-canvas-globals__row" key={d.name} title={`model.[${d.name}] · ${kind} = ${text}`}>
                                <span className={`sim-canvas-globals__name${kind === 'DEFINE' ? ' sim-canvas-globals__name--define' : ''}`}>{d.name}</span>
                                {kind !== 'VAR' && <span className={`sim-state-chip sim-state-chip--${kind.toLowerCase()}`}>{kind}</span>}
                                <span className={`sim-canvas-globals__value${changed ? ' sim-canvas-globals__value--changed' : ''}`}>{text}</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default SimCanvasLayer;
