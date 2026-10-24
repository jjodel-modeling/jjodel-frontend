/**
 * PreviewBar — the floating bar at the top of the canvas while a script preview is shown
 * (S4b, R-JJD-2): `Preview · +N objects · K warnings`, `Discard`, `Apply`.
 *
 * Discard clears the preview and leaves the model untouched. Apply runs the script through the
 * path the code block's Run takes (`ScriptBlock.tsx`: the `runPasses` loop, one line at a time
 * through `JjScriptService.execute` with the reply's M1 scope, `ChatMessages.tsx`), then clears
 * the preview. Apply is still several undo steps here: the single undo group is S4c (R-JJD-6).
 *
 * The bar also clears the preview when the model it was planned against changes.
 */
import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { store, DState } from '../../../joiner';
import { JjScriptService } from '../../../jjscript';
import { isDeferrable, runPasses } from '../../../jjscript/executor/runPasses';
import { toast } from '../../Toast/toastDispatch';
import { clearScriptPreview, isPreviewStale, setScriptPreviewApplying, type ScriptPreview } from './scriptPreviewStore';
import './PreviewBar.scss';

export interface PreviewBarProps {
    preview: ScriptPreview;
}

/** The pause after each line, the code block's `BATCH_DELAY_MS`. */
const LINE_DELAY_MS = 20;

/** The lines that run, with the filter of `ScriptBlock.tsx` (`commands`) and of the planner. */
function scriptCommands(script: string): string[] {
    return script
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith('//') && !l.startsWith('#') && !l.toLowerCase().startsWith('target '));
}

async function applyScript(preview: ScriptPreview): Promise<{ applied: number; failed: number }> {
    const idlookup: any = (store.getState() as any).idlookup ?? {};
    const metamodelId = idlookup[preview.modelId]?.instanceof;
    if (typeof metamodelId !== 'string') return { applied: 0, failed: 0 };
    const scope = { level: 'M1' as const, metamodelId, modelId: preview.modelId };
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

    useEffect(() => {
        if (!busy && isPreviewStale(preview, idlookup)) clearScriptPreview(preview.modelId);
    }, [idlookup, preview, busy]);

    const onDiscard = useCallback(() => clearScriptPreview(preview.modelId), [preview.modelId]);

    const onApply = useCallback(async () => {
        if (busy) return;
        setBusy(true);
        setScriptPreviewApplying(true);
        try {
            const { applied, failed } = await applyScript(preview);
            if (failed > 0) toast.warning(`${applied} lines applied, ${failed} failed.`, 'Script applied in part');
            else toast.success(`${applied} lines applied.`, 'Script applied');
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Unknown error', 'Script not applied');
        } finally {
            clearScriptPreview(preview.modelId);
            setBusy(false);
        }
    }, [busy, preview]);

    const objects = preview.plan.created.length;
    const warnings = preview.plan.warnings.length;
    return (
        <div className="jj-preview-bar" role="toolbar" aria-label="Script preview">
            <span className="jj-preview-bar__title">Preview</span>
            <span className="jj-preview-bar__sep" aria-hidden="true">·</span>
            <span className="jj-preview-bar__count">+{objects} {objects === 1 ? 'object' : 'objects'}</span>
            <span className="jj-preview-bar__sep" aria-hidden="true">·</span>
            <span className={warnings > 0 ? 'jj-preview-bar__warnings jj-preview-bar__warnings--on' : 'jj-preview-bar__warnings'}>
                {warnings} {warnings === 1 ? 'warning' : 'warnings'}
            </span>
            <button type="button" className="jj-preview-bar__btn" onClick={onDiscard} disabled={busy}>Discard</button>
            <button type="button" className="jj-preview-bar__btn jj-preview-bar__btn--primary" onClick={onApply} disabled={busy}>
                {busy ? 'Applying…' : 'Apply'}
            </button>
        </div>
    );
}
