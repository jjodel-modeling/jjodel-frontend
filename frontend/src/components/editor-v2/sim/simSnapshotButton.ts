/**
 * The «Save snapshot» button of the Simulation panel (P-2026-11-09-0017, R-DCN-30): why it is off, the step it saves,
 * the line it leaves. Pure, so the bench imports it without the panel.
 */
import type { SnapshotWriteResult } from './simSnapshotWrite';

/** Why the button is off, `null` when it is on: a run that moves has no step to show, a snapshot in flight is one at a time. */
export function snapshotOff(playing: boolean, saving: boolean): string | null {
    if (saving) return 'Save snapshot: a snapshot is being written';
    if (playing) return 'Save snapshot: pause the run first';
    return null;
}

/** The step the panel shows (R-SIM-106): the slider's when it was moved, else the last of the trace. */
export function snapshotStep(viewed: number | null, traceLength: number): number {
    return viewed ?? traceLength;
}

/** The panel's line after a write; `error` when the model was not saved whole. */
export function snapshotLine(result: Pick<SnapshotWriteResult, 'ok' | 'name' | 'unwritten' | 'problems'>): { text: string; error: boolean } {
    if (!result.ok) return { text: snapshotFailed(result.problems[0]), error: true };
    const n = result.unwritten.length;
    const saved = `Saved as «${result.name}»`;
    return { text: n === 0 ? saved : `${saved} · ${n} ${n === 1 ? 'value' : 'values'} not written`, error: false };
}

/** The same line when the write gave no result, or the first of its problems. */
export function snapshotFailed(reason: string | undefined): string {
    return reason ? `Snapshot not saved: ${reason}` : 'Snapshot not saved';
}
