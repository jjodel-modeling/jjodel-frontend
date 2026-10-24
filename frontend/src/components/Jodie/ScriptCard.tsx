/**
 * ScriptCard — a generated JjScript in a Jjodie reply, collapsed (S2, R-JJD-2).
 *
 * Status line, name and line count, effect chips and one amber warning line, all from the
 * read-only planner (`planEffects` over `buildPlanWorld`) against the reply's M1 model. The card
 * drives the ghost preview through `SCRIPT_PREVIEW_REQUEST`: on mount for the newest card of the
 * conversation, on click for any card. Apply stays on the canvas bar; the card reads `applied`
 * when the preview of its script goes from applying to cleared. `Edit script` opens the script in
 * the panel's editor (S5), whose edited text counts as the card's own for the preview and Apply.
 * `Open as file` links the card to the file it stores; a card of a later reply that targets that
 * file shows `Update file`, a diff of the file against its script with Accept and Reject (S6c).
 *
 * `ScriptCardContext` is set by the Jjodie message bubble: without it (other Markdown hosts, an
 * M2 reply, no model in scope) a JjScript block keeps the open code block and its Run button.
 */
import React, { createContext, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useSelector } from 'react-redux';
import { planEffects, type EffectsPlan } from '../../jjscript/executor/effectsPlanner';
import { buildPlanWorld } from '../../jjscript/executor/planWorld';
import { getScriptPreview, subscribeScriptPreview } from '../editor-v2/preview/scriptPreviewStore';
import { JjodelEvents } from '../../events/registry';
import { store } from '../../joiner';
import { openScriptAsFile, readProjectScript } from '../scripts/scriptFiles';
import {
    editedScript,
    getScriptEditorVersion,
    linkScriptFile,
    noteScriptFollowUp,
    openScriptEditor,
    scriptFileTarget,
    subscribeScriptEditor,
} from './scriptEditorModel';
import {
    fixWarningsRequest,
    scriptCardChips,
    scriptCardLineCount,
    scriptCardName,
    scriptCardStatus,
    scriptCardWarningLine,
} from './scriptCardModel';
import './ScriptCard.scss';

export interface ScriptCardContextValue {
    /** The M1 model the reply was written against. */
    modelId: string;
    /** The reply's message id: keys the one automatic preview per card. */
    messageId: string;
    /** This reply holds the newest script card of the conversation. */
    newest: boolean;
    /** Send Jjodie a follow-up message (the chat's one-shot ask). */
    onFollowUp?: (input: string) => void;
}

export const ScriptCardContext = createContext<ScriptCardContextValue | null>(null);

export interface ScriptCardProps {
    code: string;
    context: ScriptCardContextValue;
    /** The open code block (S1b styling), shown by `Show script`. */
    children: React.ReactNode;
}

// Per session, not per mount: the panel remounts its messages when it closes and reopens, and an
// applied or already previewed card must not preview again by itself.
const autoPreviewed = new Set<string>();
const appliedScripts = new Set<string>();

function requestPreview(script: string, modelId: string): void {
    window.dispatchEvent(new CustomEvent(JjodelEvents.SCRIPT_PREVIEW_REQUEST, { detail: { script, modelId } }));
}

export function ScriptCard({ code, context, children }: ScriptCardProps): JSX.Element {
    const { modelId, messageId, newest, onFollowUp } = context;
    const key = `${messageId}\u0000${modelId}\u0000${code}`;
    const [ownPlan, setOwnPlan] = useState<EffectsPlan | null>(null);
    const [planFailure, setPlanFailure] = useState<string | null>(null);
    const [applied, setApplied] = useState(() => appliedScripts.has(key));
    const [open, setOpen] = useState(false);

    const preview = useSyncExternalStore(subscribeScriptPreview, getScriptPreview);
    // The card's script, as generated or as edited in the script editor (S5).
    useSyncExternalStore(subscribeScriptEditor, getScriptEditorVersion);
    const edited = editedScript(key, code);
    const mine = !!preview && preview.modelId === modelId && (preview.script === code || preview.script === edited);

    // Applied: the preview of this script was applying, then went away.
    const sawApplying = useRef(false);
    useEffect(() => {
        if (mine && preview!.applying) { sawApplying.current = true; return; }
        if (sawApplying.current && !mine) {
            sawApplying.current = false;
            appliedScripts.add(key);
            setApplied(true);
        }
    }, [mine, preview, key]);

    useEffect(() => {
        let live = true;
        try {
            const world = buildPlanWorld((store.getState() as any).idlookup, modelId);
            planEffects(code, world)
                .then((p) => { if (live) setOwnPlan(p); })
                .catch((err) => { if (live) setPlanFailure(err instanceof Error ? err.message : 'The script could not be planned.'); });
        } catch (err) {
            setPlanFailure(err instanceof Error ? err.message : 'The model could not be read.');
        }
        return () => { live = false; };
    }, [code, modelId]);

    useEffect(() => {
        if (!newest || autoPreviewed.has(key) || appliedScripts.has(key)) return;
        autoPreviewed.add(key);
        requestPreview(code, modelId);
    }, [newest, key, code, modelId]);

    // While this script is the canvas preview, its plan is the one the bar counts.
    const plan = mine ? preview!.plan : ownPlan;
    const status = planFailure && !plan ? { kind: 'error' as const, line: 0, message: planFailure } : scriptCardStatus(plan, applied);
    const chips = useMemo(() => (plan ? scriptCardChips(plan) : []), [plan]);
    const warnings = plan?.warnings ?? [];
    const warningLine = scriptCardWarningLine(warnings);
    const name = scriptCardName(code);
    const lines = scriptCardLineCount(code);
    // The file a later reply updates (S6c), while it is still in the project.
    const fileId = scriptFileTarget(key, messageId, name);
    const file = useSelector((state: any) => (fileId ? readProjectScript(fileId, state) : undefined));
    const upToDate = !!file && file.text === edited;

    const onPreview = useCallback(() => requestPreview(code, modelId), [code, modelId]);
    const onFix = useCallback(() => {
        if (!onFollowUp || warnings.length === 0) return;
        noteScriptFollowUp(key, messageId, name);
        onFollowUp(fixWarningsRequest(code, warnings));
    }, [onFollowUp, code, warnings, key, messageId, name]);
    const onEdit = useCallback(() => {
        openScriptEditor({ key, generated: code, modelId, name, onFollowUp, messageId });
    }, [key, code, modelId, name, onFollowUp, messageId]);
    const onOpenAsFile = useCallback(() => {
        const entry = openScriptAsFile(code, name, modelId);
        if (entry) linkScriptFile(key, messageId, name, entry.id);
    }, [code, name, modelId, key, messageId]);
    const onUpdateFile = useCallback(() => {
        if (!file) return;
        openScriptEditor({ key: `update\u0000${key}`, generated: code, modelId, name, messageId, update: { scriptId: file.id, script: edited } });
    }, [file, key, code, modelId, name, messageId, edited]);

    const statusText =
        status.kind === 'planning' ? 'Planning…'
        : status.kind === 'planned' ? 'Planned'
        : status.kind === 'applied' ? 'Applied'
        : status.line > 0 ? `Error on line ${status.line}: ${status.message}` : `Error: ${status.message}`;
    const statusIcon =
        status.kind === 'planning' ? 'bi-hourglass-split'
        : status.kind === 'planned' ? 'bi-eye'
        : status.kind === 'applied' ? 'bi-check-circle'
        : 'bi-x-circle';

    return (
        <div className={`jj-script-card${mine ? ' jj-script-card--previewing' : ''}`} data-status={status.kind}>
            <button
                type="button"
                className="jj-script-card__summary"
                onClick={onPreview}
                title="Preview on the canvas"
                aria-label={`Preview ${name} on the canvas`}
            >
                <span className={`jj-script-card__status jj-script-card__status--${status.kind}`} title={statusText}>
                    <i className={`bi ${statusIcon}`} aria-hidden="true" />
                    <span className="jj-script-card__status-text">{statusText}</span>
                </span>
                <span className="jj-script-card__title">
                    <span className="jj-script-card__name">{name}</span>
                    <span className="jj-script-card__lines">{lines} {lines === 1 ? 'line' : 'lines'}</span>
                </span>
                {chips.length > 0 && (
                    <span className="jj-script-card__chips">
                        {chips.map((c) => (
                            <span key={`${c.kind}:${c.label}`} className={`jj-script-card__chip jj-script-card__chip--${c.kind}`}>{c.label}</span>
                        ))}
                    </span>
                )}
                {warningLine && (
                    <span className="jj-script-card__warnings" title={warnings.map((w) => `line ${w.line}: ${w.message}`).join('\n')}>
                        <i className="bi bi-exclamation-triangle" aria-hidden="true" />
                        <span className="jj-script-card__warnings-text">{warningLine}</span>
                    </span>
                )}
            </button>
            <div className="jj-script-card__actions">
                <button
                    type="button"
                    className="jj-script-card__action"
                    onClick={onFix}
                    disabled={!onFollowUp || warnings.length === 0}
                    title={warnings.length === 0 ? 'No warnings to fix' : 'Ask Jjodie to fix the warnings'}
                >
                    Fix warnings
                </button>
                <button type="button" className="jj-script-card__action" onClick={onEdit} title="Edit the script, with a live preview">
                    Edit script
                </button>
                <button type="button" className="jj-script-card__action" onClick={onOpenAsFile} title="Store the script as a project file and open it">
                    Open as file
                </button>
                {file && (
                    <button
                        type="button"
                        className="jj-script-card__action"
                        onClick={onUpdateFile}
                        disabled={upToDate}
                        title={upToDate ? `${file.name} already holds this script` : `Review the changes to ${file.name}`}
                    >
                        Update file
                    </button>
                )}
                <button
                    type="button"
                    className="jj-script-card__disclosure"
                    onClick={() => setOpen((o) => !o)}
                    aria-expanded={open}
                >
                    <i className={`bi ${open ? 'bi-chevron-up' : 'bi-chevron-down'}`} aria-hidden="true" />
                    <span>{open ? 'Hide script' : 'Show script'}</span>
                </button>
            </div>
            {open && <div className="jj-script-card__code">{children}</div>}
        </div>
    );
}

export default ScriptCard;
