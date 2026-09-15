/**
 * DisplayAnnotations — the authoring surface for the `jjodel/*` declarations.
 *
 * The renderer inspector on the canvas could already write `jjodel/renderer`,
 * by way of its "Change renderer" menu. The other three declarations the Row
 * view library reads — `jjodel/unit`, `jjodel/min`, `jjodel/max` — had no
 * surface at all, which meant a modeller could not give `widthPx` its `px` in
 * any way whatsoever. This is that surface, and it lives on the METAMODEL side
 * of the product because these are facts about the attribute and not about a
 * view: they govern every instance of the class, and a FormSpec cannot own them.
 *
 * ── Two toggles over two different keys, and why neither hides the other ───
 *
 * `Code` writes `jjodel/renderer=code`; `Multiline` writes `jjodel/multiline=true`.
 * They may BOTH be on, and nothing here prevents it: at rung 2 of the width ladder
 * the renderer is read first, so `code` takes the width (span 6, mono) and the
 * multiline declaration keeps sitting on the attribute, unread for now and read
 * again the moment the renderer is cleared. Making them exclusive would mean
 * deleting one of the user's two declarations on their behalf to enforce a
 * precedence the ladder already enforces on its own.
 *
 * So the toggle carries a HINT instead — «Overridden by renderer: code» — and the
 * hint's condition is `multilineOverriddenBy`, which asks the same map the ladder
 * asks. Informing, not forbidding: the same argument the Code toggle already makes
 * one paragraph down for not rendering itself disabled.
 *
 * ── Where the fourth field went ────────────────────────────────────────────
 *
 * There is no `jjodel/code` and there never was: `rowViewAnnotations.ts` owns
 * five keys and that is not one of them. What renders a value in monospace is
 * the `code` RENDERER, already in `DECLARABLE_RENDERERS`, so the Code toggle
 * writes `jjodel/renderer=code` and clears it. That has one consequence worth
 * stating: the toggle and the inspector's menu are two controls over one key.
 * When the key declares something else the toggle is not shown DISABLED — it is
 * not rendered at all, because a disabled control invites the reader to work out
 * how to enable it, while the declared badge next to it already states the
 * situation and its Clear action is the one move that changes it.
 *
 * ── Why the verdict line is not the inspector's ────────────────────────────
 *
 * The canvas inspector shows all four rungs of the ladder because it is looking
 * at a value. Here there is no value, so rungs 2 to 4 cannot fire, and drawing
 * them would be the panel claiming a verdict it cannot reach — precisely the
 * failure the inspector was built to prevent, committed one level up. So this
 * shows `metamodelRenderer`'s single line and says, underneath, that instances
 * may resolve differently and where to go to see the whole argument.
 */

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { readRowViewAnnotations, type RowViewAnnotationKey } from './rowViewAnnotations';
import { declareRowViewAnnotation, clearRowViewAnnotation } from './rowViewAnnotationsWrite';
import { metamodelRenderer, type SlotShape } from './valueRenderer';
import { RENDERER_LABELS } from './RendererInspector';
import {
    boundToWrite,
    displayFieldsFor,
    multilineOverriddenBy,
    unitToWrite,
    type FieldCommit,
} from './displayAnnotationFields';
import './displayAnnotations.scss';

export interface DisplayAnnotationsProps {
    /** The DAttribute the group writes on. */
    featureId: string | null;
    /** Declared type name, e.g. `EString`, `EInt`, `Color`. */
    typeName?: string;
    /** Literal names when the type is an enumeration — gates Code off. */
    enumLiteralNames?: string[];
    /** Declared multi-valued, so the verdict can say `collection`. */
    isMany?: boolean;
}

/**
 * One labelled row, the same shape the rest of the inspector uses.
 *
 * No hint slot next to the label on purpose: `.jj-field` is a two-column grid
 * with a narrow label column, and an example put there wraps under the word it
 * qualifies. The examples live in the placeholders, where they are also the
 * thing the field is missing.
 */
function Field(props: { label: string; children: React.ReactNode }) {
    return (
        <div className="jj-field jj-display__field">
            <div className="jj-field-label">{props.label}</div>
            {props.children}
        </div>
    );
}

function DisplayAnnotations({ featureId, typeName, enumLiteralNames, isMany }: DisplayAnnotationsProps) {
    // Equality on the five parsed values, so the group re-renders when a
    // declaration changes and not on every unrelated store write.
    const annotations = useSelector(
        (state: any) => readRowViewAnnotations(state?.idlookup ?? {}, featureId),
        (a, b) => a.renderer === b.renderer && a.unit === b.unit && a.min === b.min && a.max === b.max
            && a.multiline === b.multiline,
    );

    const [unitDraft, setUnitDraft] = useState('');
    const [minDraft, setMinDraft] = useState('');
    const [maxDraft, setMaxDraft] = useState('');

    // The committed value is the truth; the drafts exist so typing is not
    // clobbered mid-keystroke. They resync when the declaration changes under
    // them — another session, the canvas inspector, or a different attribute.
    useEffect(() => { setUnitDraft(annotations.unit ?? ''); }, [annotations.unit, featureId]);
    useEffect(() => { setMinDraft(annotations.min != null ? String(annotations.min) : ''); }, [annotations.min, featureId]);
    useEffect(() => { setMaxDraft(annotations.max != null ? String(annotations.max) : ''); }, [annotations.max, featureId]);

    if (!featureId) return null;

    const gating = displayFieldsFor(typeName, (enumLiteralNames?.length ?? 0) > 0);
    const declaredRenderer = annotations.renderer;
    const codeDeclared = declaredRenderer === 'code';
    // Not shown disabled: not shown. The badge below states what is declared.
    const showCodeToggle = gating.code && (declaredRenderer === undefined || codeDeclared);
    const multilineDeclared = annotations.multiline === true;
    // The renderer that is taking the width decision, when one is — shown only while
    // `multiline` is actually on, since with the toggle off there is nothing to override.
    const overriddenBy = multilineDeclared ? multilineOverriddenBy(declaredRenderer) : null;

    const commit = (key: RowViewAnnotationKey, outcome: FieldCommit) => {
        if (outcome.action === 'ignore') return;
        if (outcome.action === 'clear') clearRowViewAnnotation(featureId, key);
        else declareRowViewAnnotation(featureId, key, outcome.value);
    };

    const toggleCode = (on: boolean) => {
        if (on) declareRowViewAnnotation(featureId, 'renderer', 'code');
        else clearRowViewAnnotation(featureId, 'renderer');
    };

    // The wire value is the string `'true'`, which is what `parseRowViewAnnotations`
    // reads back as the boolean: the write path's signature is `string | number` and it
    // is not widened for one caller. Off CLEARS rather than writing `false` — an absent
    // declaration and a denied one read the same at rung 2, and clearing is what every
    // other control in this group does with an emptied field.
    const toggleMultiline = (on: boolean) => {
        if (on) declareRowViewAnnotation(featureId, 'multiline', 'true');
        else clearRowViewAnnotation(featureId, 'multiline');
    };

    // The verdict the metamodel alone settles. Bounds come from the DRAFTS'
    // committed twins, so the line moves the moment `progress` becomes reachable.
    const slot: SlotShape = {
        value: '',
        typeName,
        enumLiteralNames,
        isMany,
        rendererOverride: annotations.renderer,
        unit: annotations.unit,
        min: annotations.min,
        max: annotations.max,
    };
    const verdict = metamodelRenderer(slot);

    return (
        <div className="jj-display">
            {gating.unit && (
                <Field label="Unit">
                    <input
                        type="text"
                        className="jj-display__input"
                        value={unitDraft}
                        placeholder="e.g. px, s, ms"
                        onChange={(e) => setUnitDraft(e.target.value)}
                        onBlur={() => commit('unit', unitToWrite(unitDraft))}
                        onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                    />
                </Field>
            )}

            {gating.bounds && (
                <div className="jj-display__bounds">
                    <Field label="Min">
                        <input
                            type="number"
                            className="jj-display__input"
                            value={minDraft}
                            placeholder="none"
                            onChange={(e) => setMinDraft(e.target.value)}
                            onBlur={() => commit('min', boundToWrite(minDraft))}
                            onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                        />
                    </Field>
                    <Field label="Max">
                        <input
                            type="number"
                            className="jj-display__input"
                            value={maxDraft}
                            placeholder="none"
                            onChange={(e) => setMaxDraft(e.target.value)}
                            onBlur={() => commit('max', boundToWrite(maxDraft))}
                            onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                        />
                    </Field>
                </div>
            )}

            {gating.bounds && (
                <div className="jj-display__note">
                    Both bounds set renders a progress bar; either one empty renders a plain number.
                </div>
            )}

            {showCodeToggle && (
                <div className="jj-toggle-row jj-display__toggle-row" onClick={() => toggleCode(!codeDeclared)}>
                    <span className="jj-toggle-row__label">Code</span>
                    <button
                        type="button"
                        role="switch"
                        aria-checked={codeDeclared}
                        aria-label="Render values in monospace"
                        className={`jjodel-switch${codeDeclared ? ' active' : ''}`}
                        onClick={(e) => { e.stopPropagation(); toggleCode(!codeDeclared); }}
                    />
                </div>
            )}

            {gating.multiline && (
                <>
                    <div className="jj-toggle-row jj-display__toggle-row" onClick={() => toggleMultiline(!multilineDeclared)}>
                        <span className="jj-toggle-row__label">Multiline</span>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={multilineDeclared}
                            aria-label="Edit this attribute in a multiline box"
                            className={`jjodel-switch${multilineDeclared ? ' active' : ''}`}
                            onClick={(e) => { e.stopPropagation(); toggleMultiline(!multilineDeclared); }}
                        />
                    </div>
                    {overriddenBy && (
                        <div className="jj-display__note">
                            Overridden by renderer: {overriddenBy}
                        </div>
                    )}
                </>
            )}

            <div className="jj-display__verdict">
                <div className="jj-display__verdict-head">
                    <span className="jj-display__verdict-label">Renderer from metamodel</span>
                    <span className="jj-display__verdict-value">
                        {RENDERER_LABELS[verdict.kind] ?? verdict.kind}
                    </span>
                    {declaredRenderer ? (
                        <>
                            <span className="jj-display__badge">declared</span>
                            <button
                                type="button"
                                className="jj-display__clear"
                                onClick={() => clearRowViewAnnotation(featureId, 'renderer')}
                            >
                                Clear
                            </button>
                        </>
                    ) : null}
                </div>
                <div className="jj-display__verdict-sub">
                    Instances may resolve differently by value — inspect a row on the canvas for the full ladder.
                </div>
            </div>
        </div>
    );
}

export default DisplayAnnotations;
