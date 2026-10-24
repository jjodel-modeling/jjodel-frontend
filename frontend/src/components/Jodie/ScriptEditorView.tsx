/**
 * ScriptEditorView — the Jjodie panel's editor of a generated script (S5, R-JJD-2).
 *
 * Opened by `Edit script` on a script card, in place of the conversation, which stays mounted.
 * Monaco on the script; the lines that differ from the generated text get a green margin bar
 * (`editedLines`). The ghost preview follows the edits: a debounced `SCRIPT_PREVIEW_REQUEST` with
 * the edited text, and a status line from the planner under the editor. Apply stays on the canvas
 * bar.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Editor, { DiffEditor, type DiffOnMount, type OnMount } from '@monaco-editor/react';
import { planEffects, type EffectsPlan } from '../../jjscript/executor/effectsPlanner';
import { buildPlanWorld } from '../../jjscript/executor/planWorld';
import { getScriptPreview } from '../editor-v2/preview/scriptPreviewStore';
import { openScriptAsFile } from '../scripts/scriptFiles';
import { JjodelEvents } from '../../events/registry';
import { store } from '../../joiner';
import {
    editedLines, editedScript, linkScriptFile, noteScriptFollowUp, reviewRequest, setEditedScript, type ScriptEditorTarget,
} from './scriptEditorModel';
import './ScriptEditorView.scss';

export interface ScriptEditorViewProps {
    target: ScriptEditorTarget;
    /** Back to the conversation. */
    onBack: () => void;
}

/** Wait after the last keystroke before planning and previewing the edited text. */
const PREVIEW_DEBOUNCE_MS = 400;

const EDITOR_OPTIONS = {
    minimap: { enabled: false },
    lineNumbers: 'on' as const,
    fontSize: 13,
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
    scrollBeyondLastLine: false,
    wordWrap: 'on' as const,
    glyphMargin: false,
    lineDecorationsWidth: 6,
    automaticLayout: true,
};

type PlanState = { kind: 'planning' } | { kind: 'planned'; plan: EffectsPlan } | { kind: 'failed'; message: string };

export function ScriptEditorView({ target, onBack }: ScriptEditorViewProps): JSX.Element {
    const { key, generated, modelId, name, onFollowUp, messageId } = target;
    const [text, setText] = useState(() => editedScript(key, generated));
    const [compare, setCompare] = useState(false);
    const [planState, setPlanState] = useState<PlanState>({ kind: 'planning' });
    const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
    const decorationsRef = useRef<ReturnType<Parameters<OnMount>[0]['createDecorationsCollection']> | null>(null);

    const edited = useMemo(() => editedLines(generated, text), [generated, text]);

    const onChange = useCallback((value: string | undefined) => {
        const next = value ?? '';
        setText(next);
        setEditedScript(key, generated, next);
    }, [key, generated]);

    const paintEdited = useCallback(() => {
        const decorations = decorationsRef.current;
        if (!decorations) return;
        decorations.set(edited.map((line) => ({
            range: { startLineNumber: line, startColumn: 1, endLineNumber: line, endColumn: 1 },
            options: { isWholeLine: true, linesDecorationsClassName: 'jj-script-editor__edited-line' },
        })));
    }, [edited]);

    useEffect(paintEdited, [paintEdited]);

    const onMount = useCallback<OnMount>((editor) => {
        editorRef.current = editor;
        decorationsRef.current = editor.createDecorationsCollection();
        paintEdited();
    }, [paintEdited]);

    // The preview and the status line follow the edits, debounced.
    useEffect(() => {
        // The status keeps the last plan until the next one is in: no flicker while typing.
        let live = true;
        const timer = setTimeout(() => {
            const preview = getScriptPreview();
            if (!(preview && preview.modelId === modelId && preview.script === text)) {
                window.dispatchEvent(new CustomEvent(JjodelEvents.SCRIPT_PREVIEW_REQUEST, { detail: { script: text, modelId } }));
            }
            try {
                const world = buildPlanWorld((store.getState() as any).idlookup, modelId);
                planEffects(text, world)
                    .then((plan) => { if (live) setPlanState({ kind: 'planned', plan }); })
                    .catch((err) => { if (live) setPlanState({ kind: 'failed', message: err instanceof Error ? err.message : 'The script could not be planned.' }); });
            } catch (err) {
                setPlanState({ kind: 'failed', message: err instanceof Error ? err.message : 'The model could not be read.' });
            }
        }, PREVIEW_DEBOUNCE_MS);
        return () => { live = false; clearTimeout(timer); };
    }, [text, modelId]);

    const onUndo = useCallback(() => {
        const editor = editorRef.current;
        if (!editor) return;
        editor.focus();
        editor.trigger('jjodie', 'undo', null);
    }, []);
    // Revert is an edit of its own: the library's value update would merge it into the typing undo group.
    const onRevert = useCallback(() => {
        const editor = editorRef.current;
        const model = editor?.getModel();
        if (!editor || !model) { onChange(generated); return; }
        editor.pushUndoStop();
        editor.executeEdits('jjodie-revert', [{ range: model.getFullModelRange(), text: generated, forceMoveMarkers: true }]);
        editor.pushUndoStop();
    }, [onChange, generated]);

    // The diff keeps its models from the library and disposes them after the widget: the library
    // disposes them first, which the widget reports as an error.
    // The widget is detached first, for when this cleanup runs before the library's (Chat while comparing).
    const diffRef = useRef<Parameters<DiffOnMount>[0] | null>(null);
    const diffModelsRef = useRef<ReturnType<Parameters<DiffOnMount>[0]['getModel']>>(null);
    const onDiffMount = useCallback<DiffOnMount>((diff) => { diffRef.current = diff; diffModelsRef.current = diff.getModel(); }, []);
    useEffect(() => {
        if (!compare) return;
        return () => {
            const models = diffModelsRef.current;
            diffModelsRef.current = null;
            try { diffRef.current?.setModel(null); } catch { /* already disposed by the library */ }
            diffRef.current = null;
            models?.original.dispose();
            models?.modified.dispose();
        };
    }, [compare]);
    const onReview = useCallback(() => {
        if (!onFollowUp || !text.trim()) return;
        noteScriptFollowUp(key, messageId, name);
        onFollowUp(reviewRequest(text));
        onBack();
    }, [onFollowUp, text, onBack, key, messageId, name]);
    const onSave = useCallback(() => {
        const entry = openScriptAsFile(text, name, modelId);
        if (entry) linkScriptFile(key, messageId, name, entry.id);
    }, [text, name, modelId, key, messageId]);

    const status =
        !text.trim() ? { kind: 'empty', text: 'Empty script · nothing to preview' }
        : planState.kind === 'planning' ? { kind: 'planning', text: 'Planning…' }
        : planState.kind === 'failed' ? { kind: 'error', text: `Error: ${planState.message}` }
        : planState.plan.error
            ? { kind: 'error', text: planState.plan.error.line > 0 ? `Error on line ${planState.plan.error.line}: ${planState.plan.error.message}` : `Error: ${planState.plan.error.message}` }
        : { kind: 'valid', text: 'Valid · preview follows your edits' };

    return (
        <div className="jj-script-editor" data-edited-lines={edited.join(',')}>
            <div className="jj-script-editor__header">
                <button type="button" className="jj-script-editor__back" onClick={onBack} aria-label="Back to the chat">
                    <i className="bi bi-chevron-left" aria-hidden="true" />
                    <span>Chat</span>
                </button>
                <span className="jj-script-editor__name" title={name}>{name}</span>
                {edited.length > 0 && (
                    <span className="jj-script-editor__count">{edited.length} {edited.length === 1 ? 'line' : 'lines'} edited</span>
                )}
            </div>
            <div className="jj-script-editor__actions">
                <button type="button" className="jj-script-editor__action" onClick={onUndo} disabled={compare} title="Undo the last edit">
                    <i className="bi bi-arrow-counterclockwise" aria-hidden="true" />
                    <span>Undo</span>
                </button>
                <button
                    type="button"
                    className="jj-script-editor__action"
                    onClick={() => setCompare((c) => !c)}
                    aria-pressed={compare}
                >
                    Compare with generated
                </button>
                <button type="button" className="jj-script-editor__action" onClick={onRevert} disabled={text === generated} title="Back to the generated script">
                    Revert
                </button>
                <button
                    type="button"
                    className="jj-script-editor__action"
                    onClick={onReview}
                    disabled={!onFollowUp || !text.trim()}
                    title="Send the edited script to Jjodie for a review"
                >
                    Ask Jjodie to review
                </button>
                <button type="button" className="jj-script-editor__action" onClick={onSave} disabled={!text.trim()} title="Store the edited script as a project file">
                    Save as file
                </button>
            </div>
            <div className="jj-script-editor__editor">
                {/* The editor stays mounted under the diff: its undo history survives a compare. */}
                <div className={`jj-script-editor__pane${compare ? ' jj-script-editor__pane--hidden' : ''}`}>
                    <Editor
                        width="100%"
                        height="100%"
                        language="plaintext"
                        theme="vs"
                        value={text}
                        onChange={onChange}
                        onMount={onMount}
                        options={EDITOR_OPTIONS}
                    />
                </div>
                {compare && (
                    <div className="jj-script-editor__pane jj-script-editor__pane--diff">
                        <DiffEditor
                            width="100%"
                            height="100%"
                            language="plaintext"
                            theme="vs"
                            original={generated}
                            modified={text}
                            keepCurrentOriginalModel
                            keepCurrentModifiedModel
                            onMount={onDiffMount}
                            options={{ ...EDITOR_OPTIONS, readOnly: true, originalEditable: false, renderSideBySide: false }}
                        />
                    </div>
                )}
            </div>
            <div className={`jj-script-editor__status jj-script-editor__status--${status.kind}`} role="status">
                {status.text}
            </div>
        </div>
    );
}

export default ScriptEditorView;
