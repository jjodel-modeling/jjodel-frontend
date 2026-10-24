/**
 * PreviewBar — the floating bar at the top of the canvas while a script preview is shown
 * (S4b, R-JJD-2): `Preview · +N objects · K warnings`, `Discard`, `Apply`.
 *
 * Discard clears the preview and leaves the model untouched. Apply runs the script through the
 * path the code block's Run takes (`ScriptBlock.tsx`: the `runPasses` loop, one line at a time
 * through `JjScriptService.execute` with the reply's M1 scope, `ChatMessages.tsx`), then clears
 * the preview. Apply is one undo step: the run sits inside an undo group (`beginUndoGroup` /
 * `endUndoGroup`, R-JJD-6), closed once the writes it queued have reached the store. After the run
 * the objects created per metaclass are compared with the plan's; a mismatch stays in the bar for
 * a few seconds and goes to the console as a warning (R-JJD-2).
 *
 * The bar also clears the preview when the model it was planned against changes.
 *
 * M2 (P-2026-10-24-1600): a preview planned on a metamodel runs with the M2 scope, the counts read
 * the level of the open editor, and a mixed script shows its effects on the other level in one segment.
 */
import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { store, DState } from '../../../joiner';
import { COMMIT } from '../../../redux/action/action';
import { beginUndoGroup, endUndoGroup } from '../../../redux/reducer/reducer';
import { JjScriptService } from '../../../jjscript';
import { isDeferrable, runPasses } from '../../../jjscript/executor/runPasses';
import { buildPlanWorld } from '../../../jjscript/executor/planWorld';
import { toast } from '../../Toast/toastDispatch';
import { clearScriptPreview, getScriptPreview, isPreviewStale, setScriptPreviewApplying, type ScriptPreview } from './scriptPreviewStore';
import { createdCounts, effectsMismatch, otherLevelEffects, planLevel, plannedCounts } from './previewApplyCheck';
import './PreviewBar.scss';

export interface PreviewBarProps {
    preview: ScriptPreview;
}

/** The pause after each line, the code block's `BATCH_DELAY_MS`. */
const LINE_DELAY_MS = 20;

/** How long the bar shows a mismatch between planned and real effects. */
const MISMATCH_MS = 4000;

/** The app's batch interval (`U.UpdatingTimer`, `reducer.ts`): the sync layer's writes for the new objects land within it. */
const SETTLE_MS = 300;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Let the writes still queued in the open transaction reach the store, as `settlePendingWrites`
 * does (`instance.ts`): the interval's COMMIT made now, dispatched one macrotask later.
 */
async function flushPendingCommit(): Promise<void> {
    COMMIT(undefined, false);
    await sleep(0);
}

/** Run the script as one undo step: the group closes after the queued writes, and the sync layer's, are in. */
async function applyAsOneStep(preview: ScriptPreview): Promise<{ applied: number; failed: number }> {
    beginUndoGroup();
    try {
        return await applyScript(preview);
    } finally {
        await flushPendingCommit();
        await sleep(SETTLE_MS);
        await flushPendingCommit();
        endUndoGroup();
    }
}

/** The lines that run, with the filter of `ScriptBlock.tsx` (`commands`) and of the planner. */
function scriptCommands(script: string): string[] {
    return script
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith('//') && !l.startsWith('#') && !l.toLowerCase().startsWith('target '));
}

async function applyScript(preview: ScriptPreview): Promise<{ applied: number; failed: number }> {
    const idlookup: any = (store.getState() as any).idlookup ?? {};
    const m2 = preview.world.level === 'M2';
    const metamodelId = m2 ? preview.modelId : idlookup[preview.modelId]?.instanceof;
    if (typeof metamodelId !== 'string') return { applied: 0, failed: 0 };
    const scope = m2 ? { level: 'M2' as const, metamodelId } : { level: 'M1' as const, metamodelId, modelId: preview.modelId };
    const commands = scriptCommands(preview.script);
    const run = await runPasses(commands, async (i) => {
        try {
            return await JjScriptService.execute(commands[i], scope);
        } catch (err) {
            return { success: false, message: err instanceof Error ? err.message : 'Unknown error' };
        } finally {
            await new Promise((r) => setTimeout(r, LINE_DELAY_MS));
        }
    }, isDeferrable);
    const applied = run.outcomes.filter((o) => o.status === 'success').length;
    return { applied, failed: run.outcomes.length - applied };
}

export function PreviewBar({ preview }: PreviewBarProps): JSX.Element {
    const idlookup = useSelector((s: DState) => (s as any).idlookup);
    const [busy, setBusy] = useState(false);
    const [mismatch, setMismatch] = useState<string | null>(null);

    useEffect(() => {
        if (!busy && isPreviewStale(preview, idlookup)) clearScriptPreview(preview.modelId);
    }, [idlookup, preview, busy]);

    const onDiscard = useCallback(() => clearScriptPreview(preview.modelId), [preview.modelId]);

    const onApply = useCallback(async () => {
        if (busy) return;
        setBusy(true);
        setScriptPreviewApplying(true);
        try {
            const before = buildPlanWorld((store.getState() as any).idlookup ?? {}, preview.modelId);
            const { applied, failed } = await applyAsOneStep(preview);
            if (failed > 0) toast.warning(`${applied} lines applied, ${failed} failed.`, 'Script applied in part');
            else toast.success(`${applied} lines applied.`, 'Script applied');
            const after = buildPlanWorld((store.getState() as any).idlookup ?? {}, preview.modelId);
            const diff = effectsMismatch(plannedCounts(preview.plan), createdCounts(before, after));
            if (diff) {
                console.warn('[PreviewBar] Apply: planned and real effects differ:', diff);
                setMismatch(diff);
                await sleep(MISMATCH_MS);
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Unknown error', 'Script not applied');
        } finally {
            // Discard during the mismatch, or a newer request, already replaced this preview.
            const now = getScriptPreview();
            if (now && now.script === preview.script && now.worldKey === preview.worldKey) clearScriptPreview(preview.modelId);
            setBusy(false);
        }
    }, [busy, preview]);

    const objects = Object.values(plannedCounts(preview.plan)).reduce((a, b) => a + b, 0);
    const warnings = preview.plan.warnings.length;
    const other = otherLevelEffects(preview.plan);
    const otherLevel = planLevel(preview.plan) === 'M2' ? 'M1' : 'M2';
    return (
        <div className="jj-preview-bar" role="toolbar" aria-label="Script preview">
            <span className="jj-preview-bar__title">Preview</span>
            <span className="jj-preview-bar__sep" aria-hidden="true">·</span>
            <span className="jj-preview-bar__count">+{objects} {objects === 1 ? 'object' : 'objects'}</span>
            <span className="jj-preview-bar__sep" aria-hidden="true">·</span>
            <span className={warnings > 0 ? 'jj-preview-bar__warnings jj-preview-bar__warnings--on' : 'jj-preview-bar__warnings'}>
                {warnings} {warnings === 1 ? 'warning' : 'warnings'}
            </span>
            {other > 0 && (
                <>
                    <span className="jj-preview-bar__sep" aria-hidden="true">·</span>
                    <span className="jj-preview-bar__other">{other} {other === 1 ? 'effect' : 'effects'} on {otherLevel}</span>
                </>
            )}
            {mismatch && (
                <>
                    <span className="jj-preview-bar__sep" aria-hidden="true">·</span>
                    <span className="jj-preview-bar__mismatch" role="status">{mismatch}</span>
                </>
            )}
            <button type="button" className="jj-preview-bar__btn" onClick={onDiscard} disabled={busy && !mismatch}>Discard</button>
            <button type="button" className="jj-preview-bar__btn jj-preview-bar__btn--primary" onClick={onApply} disabled={busy}>
                {mismatch ? 'Applied' : busy ? 'Applying…' : 'Apply'}
            </button>
        </div>
    );
}
