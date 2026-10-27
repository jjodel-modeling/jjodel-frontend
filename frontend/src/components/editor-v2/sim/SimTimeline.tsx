/**
 * SimTimeline — the timeline slider of the simulation panel (R-SIM-142, P-2026-10-05-2350).
 *
 * One row under the transport row, from step 0 to the run's live step, one
 * notch per step; absent at step 0 and without a run, so the panel is as it was
 * there. Moving the thumb shows that step as the inspector's trace click does
 * (simRunState.ts `simSetView`, R-SIM-106): the run does not move, and the right
 * end is live. The row follows the view on the `'mark'` version, so a trace
 * click or «Back to live» moves the thumb. Grabbing it, by pointer or by key,
 * stops Play (`onGrab`); ←/→ move one step, Home and End go to 0 and to live.
 *
 * While the thumb is not at live, «Continue from here» pops the run to the step
 * shown (`continueFrom`, `simStepBack` repeated, R-SIM-138), discarding the
 * later steps; the panel does the rest as for Step back. The button keeps its
 * box at live, hidden, so nothing in the row shifts when the thumb leaves it.
 * Viewing only, never a model write: the run-state is outside Redux (R-SIM-1).
 */

import { ReactElement } from 'react';
import { getSimRun, getSimView, simSetView, simStepBack, useSimVersion } from './simRunState';

/**
 * The most notches drawn: past it they would sit closer than about 3 px on the
 * track the row leaves beside the button (288 px panel), and read as a band.
 */
export const TIMELINE_MAX_NOTCHES = 40;

/** The thumb's step: the step viewed, the live one when none is, within 0..live. */
export function timelineValue(live: number, viewed: number | null): number {
    const top = Math.max(0, live);
    return Math.min(top, Math.max(0, viewed ?? top));
}

/** The step a thumb position shows, rounded into 0..live; `null` at the right end, which is live. */
export function timelineStep(value: number, live: number): number | null {
    if (!Number.isFinite(value)) return null;
    const n = Math.min(live, Math.max(0, Math.round(value)));
    return n === live ? null : n;
}

/** Where a key moves the thumb from `value`: ←/→ one step, Home to 0, End to live; `undefined` for a key the timeline does not take. */
export function timelineKeyStep(key: string, value: number, live: number): number | undefined {
    switch (key) {
        case 'ArrowLeft': return Math.max(0, value - 1);
        case 'ArrowRight': return Math.min(live, value + 1);
        case 'Home': return 0;
        case 'End': return live;
        default: return undefined;
    }
}

/**
 * «Continue from here»: the run of a model popped to step `j` by `simStepBack`
 * repeated, the steps after it discarded, at Running and back to live
 * (R-SIM-138). False, and nothing changed, at live, out of 0..m, without a run;
 * false too if a pop is refused on the way, the run left where that pop stopped.
 */
export function continueFrom(modelId: string, j: number): boolean {
    const m = getSimRun(modelId)?.trace?.length ?? 0;
    if (!Number.isInteger(j) || j < 0 || j >= m) return false;
    for (let k = m; k > j; k--) if (!simStepBack(modelId)) return false;
    return true;
}

export interface SimTimelineProps {
    modelId: string;
    /** A grab, by pointer or by key: the panel stops Play. */
    onGrab: () => void;
    /** «Continue from here», with the step the thumb shows. */
    onContinue: (step: number) => void;
}

export interface SimTimelineRowProps extends SimTimelineProps {
    /** The run's live step, its committed steps. */
    live: number;
    /** The step viewed, `null` while the run shows live (`getSimView`). */
    viewed: number | null;
}

/** The row on the store: the live step and the view, re-read on every `'mark'` version. */
export function SimTimeline(props: SimTimelineProps): ReactElement | null {
    useSimVersion();
    const live = getSimRun(props.modelId)?.trace?.length ?? 0;
    return <SimTimelineRow {...props} live={live} viewed={getSimView(props.modelId)} />;
}

/** The row itself, without hooks: the range and «Continue from here»; nothing at step 0. */
export function SimTimelineRow({ modelId, live, viewed, onGrab, onContinue }: SimTimelineRowProps): ReactElement | null {
    if (live <= 0) return null;
    const value = timelineValue(live, viewed);
    const atLive = value === live;
    const show = (n: number): void => {
        onGrab();
        simSetView(modelId, timelineStep(n, live));
    };
    const notched = live <= TIMELINE_MAX_NOTCHES;
    return (
        <div className="sim-timeline">
            <input
                type="range"
                className={`sim-timeline__range${notched ? ' sim-timeline__range--notched' : ''}`}
                min={0}
                max={live}
                step={1}
                value={value}
                aria-label="Timeline"
                aria-valuetext={atLive ? `Step ${live}, live` : `Step ${value} of ${live}`}
                title={atLive ? `Step ${live}, live. Drag to view a past step.` : `Viewing step ${value}. The run is still at step ${live}.`}
                // One 1 px notch per step, centred under the thumb's stops (the scss places the box).
                style={notched ? { backgroundImage: `repeating-linear-gradient(to right, currentColor 0 1px, transparent 1px calc((100% - 1px) / ${live}))` } : undefined}
                onPointerDown={() => onGrab()}
                onKeyDown={ev => {
                    const to = timelineKeyStep(ev.key, value, live);
                    if (to === undefined) return;
                    ev.preventDefault();
                    show(to);
                }}
                onChange={ev => show(Number(ev.currentTarget.value))}
            />
            <button
                type="button"
                className={`sim-timeline__continue${atLive ? ' sim-timeline__continue--live' : ''}`}
                title={atLive ? undefined : `Continue from step ${value}: the run returns to it, and steps ${value + 1}..${live} are discarded`}
                disabled={atLive}
                onClick={() => onContinue(value)}
            >
                Continue from here
            </button>
        </div>
    );
}
