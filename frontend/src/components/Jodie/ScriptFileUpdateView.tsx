/**
 * ScriptFileUpdateView — `Update file` of a script card (S6c, R-JJD-5).
 *
 * The S5 compare view, between the script file as it is now (the user's own edits included) and
 * the card's script. `Accept` writes the script to the file, whose open tab follows it; `Reject`
 * goes back to the chat and changes nothing.
 */
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { DiffEditor, type DiffOnMount } from '@monaco-editor/react';
import { readProjectScript, saveProjectScript } from '../scripts/scriptFiles';
import { fileUpdateInput, linkScriptFile, type ScriptEditorTarget } from './scriptEditorModel';
import { JJSCRIPT_LANGUAGE_ID, JJSCRIPT_THEME_ID, registerJjscriptLanguage } from '../../jjscript/editor/jjscriptMonaco';
import './ScriptEditorView.scss';

export interface ScriptFileUpdateViewProps {
    target: ScriptEditorTarget;
    /** Back to the conversation. */
    onBack: () => void;
}

const DIFF_OPTIONS = {
    minimap: { enabled: false },
    lineNumbers: 'on' as const,
    fontSize: 13,
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
    scrollBeyondLastLine: false,
    wordWrap: 'on' as const,
    glyphMargin: false,
    lineDecorationsWidth: 6,
    automaticLayout: true,
    readOnly: true,
    originalEditable: false,
    // Side by side when the panel is wide enough, inline under Monaco's breakpoint.
    renderSideBySide: true,
};

export function ScriptFileUpdateView({ target, onBack }: ScriptFileUpdateViewProps): JSX.Element {
    const { key, name, messageId, update } = target;
    const scriptId = update?.scriptId ?? '';
    const script = update?.script ?? '';
    const file = useSelector((state: any) => readProjectScript(scriptId, state));
    const input = useMemo(() => fileUpdateInput(file?.text, script), [file?.text, script]);

    // As in the S5 compare: the models outlive the widget, then are disposed.
    const diffRef = useRef<Parameters<DiffOnMount>[0] | null>(null);
    const diffModelsRef = useRef<ReturnType<Parameters<DiffOnMount>[0]['getModel']>>(null);
    const onDiffMount = useCallback<DiffOnMount>((diff) => { diffRef.current = diff; diffModelsRef.current = diff.getModel(); }, []);
    useEffect(() => () => {
        const models = diffModelsRef.current;
        diffModelsRef.current = null;
        try { diffRef.current?.setModel(null); } catch { /* already disposed by the library */ }
        diffRef.current = null;
        models?.original.dispose();
        models?.modified.dispose();
    }, []);

    const onAccept = useCallback(() => {
        if (!file) return;
        saveProjectScript(file.id, { text: script });
        // The card whose script the file now holds stays on it, and is the newest link of its name.
        linkScriptFile(key.replace(/^update\u0000/, ''), messageId, name, file.id, false);
        onBack();
    }, [file, script, key, messageId, name, onBack]);

    const unchanged = !!input && input.added === 0 && input.removed === 0;

    return (
        <div
            className="jj-script-editor jj-script-update"
            data-script-id={scriptId}
            data-added={input?.added ?? ''}
            data-removed={input?.removed ?? ''}
        >
            <div className="jj-script-editor__header">
                <button type="button" className="jj-script-editor__back" onClick={onBack} aria-label="Back to the chat">
                    <i className="bi bi-chevron-left" aria-hidden="true" />
                    <span>Chat</span>
                </button>
                <span className="jj-script-editor__name" title={file?.name}>Update {file?.name ?? 'file'}</span>
                {input && !unchanged && (
                    <span className="jj-script-editor__count">+{input.added} −{input.removed} lines</span>
                )}
            </div>
            <div className="jj-script-editor__actions">
                <button type="button" className="jj-script-editor__action" onClick={onAccept} disabled={!input || unchanged}
                        title={file ? `Write the new script to ${file.name}` : 'The file is no longer in the project'}>
                    <i className="bi bi-check2" aria-hidden="true" />
                    <span>Accept</span>
                </button>
                <button type="button" className="jj-script-editor__action" onClick={onBack} title="Keep the file as it is">
                    <i className="bi bi-x" aria-hidden="true" />
                    <span>Reject</span>
                </button>
            </div>
            <div className="jj-script-editor__editor">
                {input && (
                    <div className="jj-script-editor__pane jj-script-editor__pane--diff">
                        <DiffEditor
                            width="100%"
                            height="100%"
                            language={JJSCRIPT_LANGUAGE_ID}
                            theme={JJSCRIPT_THEME_ID}
                            beforeMount={registerJjscriptLanguage}
                            original={input.original}
                            modified={input.modified}
                            keepCurrentOriginalModel
                            keepCurrentModifiedModel
                            onMount={onDiffMount}
                            options={DIFF_OPTIONS}
                        />
                    </div>
                )}
            </div>
            <div className="jj-script-editor__status" role="status">
                {!input ? 'This script is no longer in the project.'
                    : unchanged ? `${file!.name} already holds this script`
                    : `${file!.name} as it is now, against the new script`}
            </div>
        </div>
    );
}

export default ScriptFileUpdateView;
