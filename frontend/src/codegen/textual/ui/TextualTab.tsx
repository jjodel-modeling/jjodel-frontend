/**
 * TextualTab — the model's text in the textual notation, read-only (R-TXT-23, slice T2b, P-2026-11-02-0040).
 *
 * Opened by openTextualTab.tsx, from the toolbar picker's textual entry (dataManagerOption.ts `TEXTUAL_OPTION_VALUE`).
 * The model is read as a JjGen generator reads it (`buildEvalContext` with the model as the extent, as GeneratorPane
 * does), turned into T1's input (`textInputOf`), and printed with the C-like style; a toggle shows the concrete EBNF
 * of the same grammar instead. Both are read-only.
 *
 * `NewTextualTab` is the «new» mode (slice T2c, P-2026-11-02-0045): an empty, editable text of a new model of a
 * metamodel, read after a pause in typing (modelLines.ts `readNewModel`); errors and values JjScript cannot write are
 * Monaco markers, and «Create model» hands the model's name and JjScript lines to the opener (openTextualTab.tsx).
 *
 * The tab sits in the first dock panel, whose tab bar the app bar replaces; the app bar lists only the tab ids it
 * resolves (Navbar.tsx `syncTabs`), so this tab carries its own title and close in its header.
 *
 * In `src/codegen/`: loaded through the dynamic import of the opener only (R-GEN-2, scripts/gates/check-codegen-lazy.ts).
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import Editor from '@monaco-editor/react';
import type { OnMount } from '@monaco-editor/react';
import { buildEvalContext } from '../../../jjscript';
import { evalContextFor } from '../../../components/editor-v2/sim/simBridge';
import DockManager from '../../../components/abstract/DockManager';
import { deriveBaseGrammar } from '../baseGrammar';
import { concreteGrammarEbnf, deriveConcreteGrammar } from '../concreteGrammar';
import { classFeatures } from '../metamodel';
import { readNewModel } from '../modelLines';
import { printTextModel } from '../printer';
import { CLIKE_STYLE } from '../style';
import type { ConcreteGrammar } from '../concreteGrammar';
import type { TextMetamodel, TextObject } from '../metamodel';
import type { NewModelReading } from '../modelLines';
import './TextualTab.scss';

/** T1's input: the metamodel and the objects as plain data (metamodel.ts). */
export interface TextInput {
    readonly metamodel: TextMetamodel;
    readonly objects: TextObject[];
}

/** What the tab shows: the model's text, the grammar's EBNF, and why the text could not be printed. */
export interface TextualView {
    readonly text: string;
    readonly ebnf: string;
    readonly error: string | null;
}

const list = (v: unknown): any[] => (Array.isArray(v) ? v : []);
const nameOf = (v: any): string => (typeof v?.name === 'string' ? v.name : '');
const idOf = (v: any): string | null => (typeof v?.id === 'string' && v.id ? v.id : null);
const messageOf = (e: unknown): string => (e instanceof Error ? e.message : String(e));

/**
 * The globals of `buildEvalContext` as T1's input. A class shell's supertypes are shells, read by name; an interface
 * is abstract (no instance can stand for it); a reference is many-valued when its upper bound is above one. Each
 * object keeps the slots of its class's features (own and inherited, metamodel.ts `classFeatures`): an attribute as
 * the eval context gives it, a reference by the target's id. An object with no class in the metamodel is skipped.
 */
export function textInputOf(globals: Readonly<Record<string, any>>): TextInput {
    const metamodel: TextMetamodel = {
        classes: list(globals.classes).map(c => ({
            name: nameOf(c),
            isAbstract: !!c.isAbstract || !!c.isInterface,
            supers: list(c.superTypes).map(nameOf),
            attributes: list(c.attributes).map(a => ({ name: nameOf(a), type: String(a.type ?? ''), many: !!a.multiValued })),
            references: list(c.references).map(r => ({
                name: nameOf(r),
                type: String(r.type ?? ''),
                containment: !!r.containment,
                many: r.multiplicity === '*' || Number(r.upperBound) > 1,
            })),
        })),
        enumerations: list(globals.enumerations).map(e => ({ name: nameOf(e), literals: list(e.literals).map(nameOf) })),
    };
    const objects: TextObject[] = [];
    for (const h of list(globals.instances)) {
        const cls = metamodel.classes.find(c => c.name === nameOf(h?.instanceOf));
        const id = idOf(h);
        if (!cls || !id) continue;
        const slots: Record<string, unknown> = {};
        for (const f of classFeatures(metamodel, cls)) {
            const v = h[f.name];
            if (f.kind === 'attribute') slots[f.name] = v;
            else if (f.many) slots[f.name] = (Array.isArray(v) ? v : v == null ? [] : [v]).map(idOf).filter((t): t is string => t !== null);
            else slots[f.name] = idOf(v);
        }
        objects.push({ id, cls: cls.name, slots });
    }
    return { metamodel, objects };
}

/** The text and the EBNF of the C-like notation for the globals; a failure is reported, never thrown. */
export function textualView(globals: Readonly<Record<string, any>>): TextualView {
    let input: TextInput;
    let grammar: ConcreteGrammar;
    try {
        input = textInputOf(globals);
        grammar = deriveConcreteGrammar(deriveBaseGrammar(input.metamodel), CLIKE_STYLE);
    } catch (e) {
        return { text: '', ebnf: '', error: messageOf(e) };
    }
    const ebnf = concreteGrammarEbnf(grammar);
    try {
        return { text: printTextModel(grammar, input.objects).text, ebnf, error: null };
    } catch (e) {
        return { text: '', ebnf, error: messageOf(e) };
    }
}

/** The model as the eval context reads it; the project is the user's (jjscript/executor/utils.ts `getProject`). */
function modelView(lookup: Readonly<Record<string, any>>, modelId: string): TextualView {
    try {
        return textualView(buildEvalContext(evalContextFor(lookup, modelId, ''), { extentModelId: modelId }));
    } catch (e) {
        return { text: '', ebnf: '', error: messageOf(e) };
    }
}

type TextualMode = 'text' | 'ebnf';

const MODES: ReadonlyArray<{ readonly mode: TextualMode; readonly label: string; readonly icon: string; readonly title: string }> = [
    { mode: 'text', label: 'Text', icon: 'bi-file-earmark-text', title: 'The model in the textual notation' },
    { mode: 'ebnf', label: 'EBNF', icon: 'bi-braces', title: 'The concrete grammar of the notation' },
];

/** The glyph margin plus the decorations fill the 30 px the global Monaco rules give the margin (ScriptTab.tsx). */
const EDITOR_DECORATIONS_WIDTH = 10;

export interface TextualTabProps {
    readonly modelId: string;
    /** The picker entry's label: the language's name (dataManagerOption.ts `textualOptionLabel`). */
    readonly label: string;
    /** The dock tab's id, for the close control. */
    readonly tabId: string;
}

export default function TextualTab({ modelId, label, tabId }: TextualTabProps) {
    const lookup = useSelector((state: any) => state.idlookup) as Record<string, any>;
    const [mode, setMode] = useState<TextualMode>('text');
    const view = useMemo(() => modelView(lookup ?? {}, modelId), [lookup, modelId]);
    const model = lookup?.[modelId];
    const modelName = typeof model?.name === 'string' && model.name ? model.name : 'Unnamed';
    const shown = mode === 'text' ? view.text : view.ebnf;
    const failed = view.error !== null && (mode === 'text' || !view.ebnf);

    return (
        <div className="textual-tab">
            <div className="textual-tab__bar">
                <span className="textual-tab__title" title={`${modelName} · ${label}`}>
                    <i className="bi bi-file-earmark-text" aria-hidden="true" />
                    <span className="textual-tab__name">{modelName}</span>
                    <span className="textual-tab__language">{label}</span>
                </span>
                <span className="textual-tab__readonly" title="Editing the text comes in a later slice">
                    <i className="bi bi-lock" aria-hidden="true" />
                    Read-only
                </span>
                <span className="textual-tab__spacer" />
                <div className="textual-tab__modes" role="group" aria-label="Shown text">
                    {MODES.map(m => (
                        <button
                            key={m.mode}
                            type="button"
                            className={'textual-tab__mode' + (mode === m.mode ? ' textual-tab__mode--active' : '')}
                            aria-pressed={mode === m.mode}
                            title={m.title}
                            onClick={() => setMode(m.mode)}
                        >
                            <i className={`bi ${m.icon}`} aria-hidden="true" />
                            {m.label}
                        </button>
                    ))}
                </div>
                <button type="button" className="textual-tab__close" aria-label="Close the text" title="Close"
                        onClick={() => DockManager.closeTab(tabId)}>
                    <i className="bi bi-x-lg" aria-hidden="true" />
                </button>
            </div>
            <div className="textual-tab__body">
                {!model ? (
                    <div className="textual-tab__message">
                        <i className="bi bi-question-circle" aria-hidden="true" />
                        The model is no longer in the project.
                    </div>
                ) : failed ? (
                    <div className="textual-tab__message textual-tab__message--error" role="alert">
                        <i className="bi bi-exclamation-triangle" aria-hidden="true" />
                        {`The model cannot be printed: ${view.error}`}
                    </div>
                ) : (
                    <Editor
                        width="100%"
                        height="100%"
                        language="plaintext"
                        value={shown}
                        options={{
                            readOnly: true,
                            domReadOnly: true,
                            minimap: { enabled: false },
                            lineNumbers: 'off',
                            folding: false,
                            lineDecorationsWidth: EDITOR_DECORATIONS_WIDTH,
                            glyphMargin: true,
                            fontSize: 13,
                            fontFamily: "'IBM Plex Mono', Monaco, Consolas, monospace",
                            scrollBeyondLastLine: false,
                            renderLineHighlight: 'none',
                            wordWrap: 'off',
                        }}
                    />
                )}
            </div>
        </div>
    );
}

/** What the «new» mode reads a text against: the metamodel's grammar, or why it cannot be derived. */
interface NewModelGrammar {
    readonly metamodel: TextMetamodel | null;
    readonly grammar: ConcreteGrammar | null;
    readonly error: string | null;
}

/** An extent that matches no model: the metamodel alone is read (an empty extent selects every model, evalExtent.ts). */
const NO_MODEL_EXTENT = '\u0000no-model';

/** The grammar of the metamodel `metamodelId`, read as the Text tab reads a model's, with no object. */
function metamodelGrammar(lookup: Readonly<Record<string, any>>, metamodelId: string): NewModelGrammar {
    try {
        const globals = buildEvalContext({ ...evalContextFor(lookup, metamodelId, ''), targetMetamodelId: metamodelId }, { extentModelId: NO_MODEL_EXTENT });
        const metamodel = textInputOf(globals).metamodel;
        return { metamodel, grammar: deriveConcreteGrammar(deriveBaseGrammar(metamodel), CLIKE_STYLE), error: null };
    } catch (e) {
        return { metamodel: null, grammar: null, error: messageOf(e) };
    }
}

/** The pause in typing after which the text is read. */
const READ_DELAY_MS = 300;

/** The owner of the «new» mode's markers in the Monaco model. */
const MARKER_OWNER = 'textual-new-model';

export interface NewTextualTabProps {
    readonly metamodelId: string;
    /** The picker entry's label: the language's name (dataManagerOption.ts `textualOptionLabel`). */
    readonly label: string;
    /** The dock tab's id, for the close control. */
    readonly tabId: string;
    /** The model's name when the tab opens. */
    readonly initialName: string;
    /** Creates the model `name` from the JjScript lines `script`; true when the model was created. */
    readonly onCreate: (name: string, script: string) => Promise<boolean>;
}

export function NewTextualTab({ metamodelId, label, tabId, initialName, onCreate }: NewTextualTabProps) {
    const lookup = useSelector((state: any) => state.idlookup) as Record<string, any>;
    const metamodel = lookup?.[metamodelId];
    const metamodelName = typeof metamodel?.name === 'string' && metamodel.name ? metamodel.name : 'Unnamed';
    const input = useMemo(() => metamodelGrammar(lookup ?? {}, metamodelId), [lookup, metamodelId]);
    const [text, setText] = useState('');
    const [name, setName] = useState(initialName);
    const [reading, setReading] = useState<NewModelReading | null>(null);
    const [creating, setCreating] = useState(false);
    const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
    const monacoRef = useRef<Parameters<OnMount>[1] | null>(null);
    const [editorReady, setEditorReady] = useState(false);

    useEffect(() => {
        const { grammar, metamodel: mm } = input;
        if (!grammar || !mm) { setReading(null); return; }
        const timer = setTimeout(() => setReading(readNewModel(text, grammar, mm)), READ_DELAY_MS);
        return () => clearTimeout(timer);
    }, [text, input]);

    useEffect(() => {
        const editor = editorRef.current;
        const monaco = monacoRef.current;
        const model = editor?.getModel();
        if (!editor || !monaco || !model) return;
        // Markers of a text the editor no longer holds would land in the wrong place.
        const live = reading && reading.text === model.getValue() ? reading.markers : [];
        const length = model.getValueLength();
        monaco.editor.setModelMarkers(model, MARKER_OWNER, live.map(m => {
            const from = model.getPositionAt(Math.min(m.start, length));
            const to = model.getPositionAt(Math.min(Math.max(m.end, m.start + 1), length));
            return {
                severity: monaco.MarkerSeverity.Error,
                message: m.message,
                startLineNumber: from.lineNumber, startColumn: from.column,
                endLineNumber: to.lineNumber, endColumn: to.column,
            };
        }));
    }, [reading, editorReady]);

    const onMount: OnMount = (editor, monaco) => {
        editorRef.current = editor;
        monacoRef.current = monaco;
        setEditorReady(true);
    };

    const current = reading !== null && reading.text === text;
    const lines = current ? reading.lines : null;
    const canCreate = !creating && lines !== null && name.trim() !== '';
    const status = !current
        ? 'Reading…'
        : reading.lines === null
            ? `${reading.markers.length} problem${reading.markers.length === 1 ? '' : 's'}`
            : `${reading.objects} object${reading.objects === 1 ? '' : 's'}`;

    const create = async () => {
        if (!canCreate || !lines) return;
        setCreating(true);
        let created = false;
        try {
            created = await onCreate(name.trim(), lines.join('\n'));
        } finally {
            setCreating(false);
        }
        // The canvas of the new model takes the tab's place: a second «Create model» would make a second model.
        if (created) DockManager.closeTab(tabId);
    };

    return (
        <div className="textual-tab">
            <div className="textual-tab__bar">
                <span className="textual-tab__title" title={`New model of ${metamodelName} · ${label}`}>
                    <i className="bi bi-file-earmark-plus" aria-hidden="true" />
                    <span className="textual-tab__name">New model</span>
                    <span className="textual-tab__language">{label}</span>
                </span>
                <label className="textual-tab__model-name">
                    <span>Name</span>
                    <input type="text" value={name} spellCheck={false} aria-label="Model name"
                           onChange={e => setName(e.target.value)} />
                </label>
                <span className="textual-tab__spacer" />
                <span className={'textual-tab__status' + (current && reading.lines === null ? ' textual-tab__status--error' : '')}
                      role="status">
                    {status}
                </span>
                <button type="button" className="textual-tab__create" disabled={!canCreate}
                        title={canCreate ? 'Create the model from the text' : 'Fix the marked problems and give the model a name'}
                        onClick={() => void create()}>
                    <i className="bi bi-plus-lg" aria-hidden="true" />
                    {creating ? 'Creating…' : 'Create model'}
                </button>
                <button type="button" className="textual-tab__close" aria-label="Close the text" title="Close"
                        onClick={() => DockManager.closeTab(tabId)}>
                    <i className="bi bi-x-lg" aria-hidden="true" />
                </button>
            </div>
            <div className="textual-tab__body">
                {!metamodel ? (
                    <div className="textual-tab__message">
                        <i className="bi bi-question-circle" aria-hidden="true" />
                        The metamodel is no longer in the project.
                    </div>
                ) : input.error !== null ? (
                    <div className="textual-tab__message textual-tab__message--error" role="alert">
                        <i className="bi bi-exclamation-triangle" aria-hidden="true" />
                        {`The notation cannot be derived: ${input.error}`}
                    </div>
                ) : (
                    <Editor
                        width="100%"
                        height="100%"
                        language="plaintext"
                        defaultValue=""
                        onChange={v => setText(v ?? '')}
                        onMount={onMount}
                        options={{
                            readOnly: creating,
                            minimap: { enabled: false },
                            lineNumbers: 'off',
                            folding: false,
                            lineDecorationsWidth: EDITOR_DECORATIONS_WIDTH,
                            glyphMargin: true,
                            fontSize: 13,
                            fontFamily: "'IBM Plex Mono', Monaco, Consolas, monospace",
                            scrollBeyondLastLine: false,
                            renderLineHighlight: 'none',
                            wordWrap: 'off',
                        }}
                    />
                )}
            </div>
        </div>
    );
}
