/**
 * Editor tab of a project script file (S6a, R-JJD-5), a Refactoring under R-JJD-14.
 *
 * Monaco on the script text, `Save` (writes the entry of `DProject.scripts`) and `Run on <model>`,
 * which runs through the S4b preview: the model's canvas opens and shows the ghost of the planned
 * effects, applied or discarded from the canvas bar. Nothing is executed from here. The target
 * level shows under the title, and `Run on` lists only the models it fits.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import Editor from '@monaco-editor/react';
import {
    projectTargetCandidates, readProjectScript, runScriptOnModel, saveProjectScript,
} from '../../scripts/scriptFiles';
import { compatibleModels, readTarget, targetLabel } from '../../scripts/projectScripts';
import { JJSCRIPT_LANGUAGE_ID, JJSCRIPT_THEME_ID, registerJjscriptLanguage } from '../../../jjscript/editor/jjscriptMonaco';
import './ScriptTab.scss';

export interface ScriptTabProps {
    scriptId: string;
}

/** The tab title: the entry's name from the store, so a rename from the tree or the megamodel shows at once (S6c). */
export const ScriptTabTitle: React.FC<{ scriptId: string; name: string }> = ({ scriptId, name }) => {
    const stored = useSelector((state: any) => readProjectScript(scriptId, state)?.name);
    return <div className="tab-title active-on-mouseenter" data-type="script">{stored ?? name}</div>;
};

const ScriptTab: React.FC<ScriptTabProps> = ({ scriptId }) => {
    const entry = useSelector((state: any) => readProjectScript(scriptId, state));
    const candidates = useSelector((state: any) => projectTargetCandidates(state),
        (a, b) => a.length === b.length && a.every((m, i) => m.id === b[i].id && m.name === b[i].name
            && m.isMetamodel === b[i].isMetamodel && m.metamodelId === b[i].metamodelId));
    const target = readTarget(entry);
    const models = useMemo(() => compatibleModels(candidates, target),
        [candidates, target.level, target.metamodelId]); // eslint-disable-line react-hooks/exhaustive-deps
    const targetText = targetLabel(target, candidates.find(c => c.id === target.metamodelId)?.name);

    const [text, setText] = useState<string>(entry?.text ?? '');
    const [modelId, setModelId] = useState<string>(entry?.modelId ?? '');

    // The chosen model falls back to the first compatible one when the stored one is gone or does not fit.
    const chosen = useMemo(
        () => (models.some(m => m.id === modelId) ? modelId : models[0]?.id || ''),
        [models, modelId]);
    const chosenName = models.find(m => m.id === chosen)?.name;

    // Saved elsewhere (another tab on the same entry, a later Jjodie write): follow it when not dirty.
    const [savedText, setSavedText] = useState<string>(entry?.text ?? '');
    useEffect(() => {
        if (entry && entry.text !== savedText) {
            if (text === savedText) setText(entry.text);
            setSavedText(entry.text);
        }
    }, [entry?.text]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!entry) {
        return <div className="script-tab script-tab--missing">This script is no longer in the project.</div>;
    }

    const dirty = text !== entry.text;
    const save = () => {
        saveProjectScript(scriptId, chosen && chosen !== entry.modelId ? { text, modelId: chosen } : { text });
    };
    const run = () => {
        if (!chosen) return;
        if (chosen !== entry.modelId) saveProjectScript(scriptId, { modelId: chosen });
        void runScriptOnModel(text, chosen);
    };

    return (
        <div className="script-tab" data-script-id={scriptId}>
            <div className="script-tab__toolbar">
                <span className="script-tab__heading">
                    <span className="script-tab__name" title={entry.name}>
                        <i className="bi bi-arrow-repeat" aria-hidden="true" />
                        {entry.name}
                        {dirty && <span className="script-tab__dirty" aria-label="Unsaved changes">•</span>}
                    </span>
                    <span className="script-tab__target" data-target-level={target.level || 'any'}>
                        Refactoring · {targetText}
                    </span>
                </span>
                <span className="script-tab__spacer" />
                <button type="button" className="script-tab__button" onClick={save} disabled={!dirty}>Save</button>
                <select className="script-tab__model" aria-label="Model to run on" value={chosen}
                        onChange={e => setModelId(e.target.value)} disabled={!models.length}>
                    {!models.length && <option value="">No model</option>}
                    {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                <button type="button" className="script-tab__button script-tab__button--primary" onClick={run}
                        disabled={!chosen || !text.trim()}>
                    {chosenName ? `Run on ${chosenName}` : 'Run'}
                </button>
            </div>
            <div className="script-tab__editor">
                <Editor
                    width="100%"
                    height="100%"
                    language={JJSCRIPT_LANGUAGE_ID}
                    theme={JJSCRIPT_THEME_ID}
                    beforeMount={registerJjscriptLanguage}
                    value={text}
                    onChange={(value) => setText(value || '')}
                    options={{
                        minimap: { enabled: false },
                        lineNumbers: 'on',
                        fontSize: 13,
                        fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                        scrollBeyondLastLine: false,
                        wordWrap: 'on',
                    }}
                />
            </div>
        </div>
    );
};

export default ScriptTab;
