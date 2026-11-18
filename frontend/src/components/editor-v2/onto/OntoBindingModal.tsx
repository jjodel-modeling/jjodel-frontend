/**
 * OntoBindingModal — the «Ontological binding» dialog of a metamodel (P-2026-11-08-0113; discovery 2026-11-08 §3.4,
 * §3.5, §5 lane B; R-OI-2, R-OI-7).
 *
 * The «Ontological binding…» row of the metamodel's «Semantic type class» section (Info.tsx, Advanced only) opens it;
 * the «Instances of» rail opens the same dialog (lane A, question 5). It is a draft over the two records the
 * instantiation reads, `object` and `link`: a role table per record, each row a select over the metamodel's features
 * of the sort bindingCheck.ts expects, and the defects of `checkBindings` on their rows. Detect fills the draft from
 * the UML name table (bindingDetect.ts). Nothing is written before Confirm, which writes the bag in one `state`
 * assignment, one undo step; every other record of the bag and its unknown keys are kept (R-DCN-1). Remove takes the
 * two records out the same way.
 *
 * A bag that does not decode has nothing to edit: the dialog lists the decode errors and offers «Replace with
 * detected» behind a confirmation, never a silent overwrite (question 6).
 *
 * The shell is SimRolesModal's: portaled onto `document.body`, keyboard and pointer events stopped at its root (the
 * editor's own onKeyDown would otherwise receive them), Escape and the close button discard the draft.
 */

import { ReactElement, SyntheticEvent, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import { DState, LPointerTargetable } from '../../../joiner';
import { sketchOfMetamodel } from '../sim/metamodelSketch';
import { ONTO_BINDINGS_KEY, decodeOntoBindings } from '../../../model/ontological/bindingCodec';
import { checkBindings } from '../../../model/ontological/bindingCheck';
import {
    EDITED_RECORDS, bagAfterConfirm, bagAfterRemove, detectOntoBindings, detectedRecord, editedRecords, editorBase, foreignRecords, keptKeys,
    rolePaths, roleSorts, roleValue, withRoleValue,
} from '../../../model/ontological/bindingDetect';
import type { OntoBinding, OntoBindings } from '../../../model/ontological/bindingCodec';
import type { BindingDefect } from '../../../model/ontological/bindingCheck';
import type { DetectRow, EditedRecord, RolePath, RoleSort } from '../../../model/ontological/bindingDetect';
import type { MetamodelSketch } from '../../../model/simulation/profileBinder';
import './OntoBindingModal.scss';

export interface OntoBindingModalProps {
    /** The metamodel whose bag holds the bindings. */
    modelId: string;
    onClose: () => void;
}

interface RoleOption { id: string; label: string }

const EMPTY: OntoBindings = { v: 1, bindings: [] };

const ROLE_LABEL: Record<string, string> = {
    typeReference: 'Type reference', featureContainer: 'Feature container', 'generalization.via': 'Generalization',
    'generalization.general': 'General', 'generalization.direct': 'Generalization', slotContainer: 'Slot container',
    definingFeature: 'Defining feature', valueHolder: 'Value holder', abstractFlag: 'Abstract flag', featureType: 'Feature type',
    defaultValue: 'Default value',
};

const ROLE_HELP: Record<string, string> = {
    typeReference: 'Instance to classifier, owned by the instance metaclass',
    featureContainer: 'Classifier to its properties',
    'generalization.via': 'Classifier to its generalizations',
    'generalization.general': 'Generalization to the general classifier',
    'generalization.direct': 'Classifier to its general classifiers',
    slotContainer: 'Instance to its slots',
    definingFeature: 'Slot to its property, owned by the slot metaclass',
    valueHolder: 'Slot to its value',
    abstractFlag: 'The abstract flag of a classifier',
    featureType: 'Property to its type',
    defaultValue: 'The default value of a property',
};

const BADGE: Record<RoleSort, string> = { reference: 'Ref', attribute: 'Attr', class: 'Class' };

/** The row's label; a value kind's carries its `when`. */
function labelOf(b: OntoBinding, path: RolePath): string {
    const [head, i, part] = path.split('.');
    if (head !== 'valueKinds') return ROLE_LABEL[path] ?? path;
    const when = b.valueKinds?.[Number(i)]?.when ?? '';
    return `${when.replace(/^primitive:/, '')} ${part === 'create' ? 'literal' : 'value'}`;
}

function helpOf(path: RolePath): string {
    const [head, , part] = path.split('.');
    if (head === 'valueKinds') return part === 'create' ? 'The literal metaclass a value of this kind creates' : 'The feature of the literal that holds the value';
    return ROLE_HELP[path] ?? '';
}

/** The options of a role's select: the sketch's items of the sorts it needs, `Class.feature` for a feature. */
function optionsOf(sketch: MetamodelSketch, sorts: readonly RoleSort[]): RoleOption[] {
    const className = new Map(sketch.classes.map(c => [c.id, c.name]));
    const out: RoleOption[] = [];
    if (sorts.includes('class')) for (const c of sketch.classes) out.push({ id: c.id, label: c.name });
    if (sorts.includes('reference')) for (const r of sketch.references) out.push({ id: r.id, label: `${className.get(r.owner) ?? r.owner}.${r.name}` });
    if (sorts.includes('attribute')) for (const a of sketch.attributes) out.push({ id: a.id, label: `${className.get(a.owner) ?? a.owner}.${a.name}` });
    return out.sort((x, y) => x.label.localeCompare(y.label));
}

/** The row a defect belongs to, `null` for the record (the slot roles together, the name, the feature sources). */
function defectRow(d: BindingDefect, b: OntoBinding): RolePath | null {
    if (d.role === 'generalization' || d.role === 'valueKinds') {
        const paths = rolePaths(b).filter(p => p.startsWith(`${d.role}.`));
        return paths.find(p => { const v = roleValue(b, p); return v !== undefined && d.message.startsWith(v); }) ?? paths[0] ?? null;
    }
    return rolePaths(b).includes(d.role) ? d.role : null;
}

/** Stops a React event at the dialog: the portal still bubbles through the editor's React tree. */
const stop = (e: SyntheticEvent) => e.stopPropagation();

export function OntoBindingModal(props: OntoBindingModalProps): ReactElement {
    const { modelId, onClose } = props;
    const raw = useSelector((s: DState) => (s as any)?.idlookup?.[modelId]?._state?.[ONTO_BINDINGS_KEY]);
    const lookup = useSelector((s: DState) => (s as any)?.idlookup ?? {});
    const mmName: string = lookup[modelId]?.name ?? '';
    const sketch = useMemo(() => sketchOfMetamodel(lookup, modelId), [lookup, modelId]);

    const [draft, setDraft] = useState<OntoBinding[] | null>(null);
    const [detected, setDetected] = useState<DetectRow[] | null>(null);
    const [replacing, setReplacing] = useState(false);
    const [askReplace, setAskReplace] = useState(false);
    const [notice, setNotice] = useState<string | null>(null);
    const dialogRef = useRef<HTMLDivElement>(null);

    const stored = useMemo(() => editorBase(raw), [raw]);
    const base: OntoBindings | null = replacing ? EMPTY : stored.ok ? stored.base : null;
    const storedRecords = useMemo(() => (base ? editedRecords(base) : []), [base]);
    const records = draft ?? storedRecords;
    const foreign = base ? foreignRecords(base) : [];

    const after = base ? bagAfterConfirm(base, records) : null;
    const afterDecode = after !== null ? decodeOntoBindings(after) : null;
    const pending = after !== null && (replacing || after !== bagAfterConfirm(base as OntoBindings, storedRecords));
    // The verdict on the bag as Confirm leaves it; the rows show the defects of the two records they edit.
    const defects = checkBindings([...records, ...foreign], sketch).defects.filter(d => records.some(r => r.name === d.binding));
    const statusOf = new Map((detected ?? []).map(r => [`${r.record}:${r.path}`, r]));

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);
    useEffect(() => { dialogRef.current?.focus(); }, []);

    const write = (value: string): void => {
        const lmm: any = LPointerTargetable.fromPointer(modelId);
        if (!lmm) return;
        lmm.state = { [ONTO_BINDINGS_KEY]: value };
        onClose();
    };

    const detect = (from: OntoBindings): void => {
        const result = detectOntoBindings(sketch);
        setDetected(result.rows);
        if (result.bindings.length === 0) {
            setNotice('No UML binding found in the names of this metamodel: declare the roles by hand.');
            return;
        }
        const kept = editedRecords(from);
        setDraft(result.bindings.map(b => detectedRecord(kept.find(k => k.name === b.name), b)));
        setNotice(null);
    };

    const setRole = (name: string, path: RolePath, id: string): void => {
        setDraft(records.map(r => (r.name === name ? withRoleValue(r, path, id === '' ? undefined : id) : r)));
    };

    const addRecord = (name: EditedRecord): void => setDraft([...records, { name } as OntoBinding]);

    const reset = (): void => {
        setDraft(null);
        setDetected(null);
        setReplacing(false);
        setAskReplace(false);
        setNotice(null);
    };

    const rowOf = (b: OntoBinding, path: RolePath): ReactElement => {
        const value = roleValue(b, path) ?? '';
        const sorts = roleSorts(path);
        const options = optionsOf(sketch, sorts);
        const known = value === '' || options.some(o => o.id === value);
        const rowDefects = defects.filter(d => d.binding === b.name && defectRow(d, b) === path);
        const found = statusOf.get(`${b.name}:${path}`);
        const missing = found?.status === 'missing' && value === '';
        const detectedHere = found?.status === 'found' && found.id === value;
        const help = rowDefects.length > 0 ? rowDefects.map(d => d.message).join(' ')
            : missing ? `Not found: ${found.className}${found.featureName ? `.${found.featureName}` : ''}` : helpOf(path);
        return (
            <div className="onto-binding-modal__row" key={path} data-path={path}>
                <span className="onto-binding-modal__role">
                    <span className={`onto-binding-modal__badge onto-binding-modal__badge--${sorts[0]}`}>{BADGE[sorts[0]]}</span>
                    <span className="onto-binding-modal__label" title={path}>{labelOf(b, path)}</span>
                </span>
                <span className="onto-binding-modal__value">
                    <span className="onto-binding-modal__control">
                        <select
                            className={`onto-binding-modal__select${value === '' ? ' onto-binding-modal__select--empty' : ''}${rowDefects.length > 0 ? ' onto-binding-modal__select--defect' : ''}`}
                            aria-label={`${b.name} ${labelOf(b, path)}`}
                            value={value}
                            onChange={e => setRole(b.name, path, e.target.value)}
                        >
                            <option value="">{path === 'typeReference' ? 'Select a reference' : '—'}</option>
                            {!known && <option value={value}>{`${value} (not in the metamodel)`}</option>}
                            {options.map(o => <option value={o.id} key={o.id}>{o.label}</option>)}
                        </select>
                        <span className="onto-binding-modal__verdict">
                            {rowDefects.length > 0 ? <i className="bi bi-exclamation-circle-fill onto-binding-modal__verdict--error" title={help} />
                                : missing ? <i className="bi bi-question-circle onto-binding-modal__verdict--missing" title={help} />
                                    : detectedHere ? <i className="bi bi-check2 onto-binding-modal__verdict--found" title="Found by Detect" /> : null}
                        </span>
                    </span>
                    <span className={`onto-binding-modal__help${rowDefects.length > 0 ? ' onto-binding-modal__help--error' : ''}`} title={help}>{help}</span>
                </span>
            </div>
        );
    };

    const recordOf = (b: OntoBinding): ReactElement => {
        const recordDefects = defects.filter(d => d.binding === b.name && defectRow(d, b) === null);
        const kept = keptKeys(b);
        return (
            <div className="onto-binding-modal__record" key={b.name} data-record={b.name}>
                <div className="onto-binding-modal__section">
                    {b.name}
                    <span className="onto-binding-modal__count">{b.name === 'object' ? 'instances of classes' : 'instances of associations'}</span>
                    {kept.length > 0 && <span className="onto-binding-modal__count" title="Keys this dialog does not edit, written back as they are">{`kept: ${kept.join(', ')}`}</span>}
                </div>
                {recordDefects.map((d, i) => (
                    <div className="onto-binding-modal__warning onto-binding-modal__warning--error" key={i}>
                        <i className="bi bi-exclamation-circle-fill" />{d.message}
                    </div>
                ))}
                {rolePaths(b).map(p => rowOf(b, p))}
            </div>
        );
    };

    const undecodable = !stored.ok && !replacing;
    const missingRecords = EDITED_RECORDS.filter(n => !records.some(r => r.name === n));
    const pill = undecodable ? { kind: 'error', text: 'unreadable' }
        : records.length === 0 ? { kind: 'none', text: 'no binding' }
            : defects.length > 0 ? { kind: 'warn', text: `${defects.length} ${defects.length === 1 ? 'problem' : 'problems'}` }
                : { kind: 'ok', text: records.map(r => r.name).join(', ') };

    const body = undecodable ? (
        <div className="onto-binding-modal__body">
            <div className="onto-binding-modal__warning onto-binding-modal__warning--error">
                <i className="bi bi-exclamation-circle-fill" />The stored bindings cannot be read:
            </div>
            <ul className="onto-binding-modal__errors">
                {(stored as { errors: string[] }).errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
            {askReplace ? (
                <div className="onto-binding-modal__confirm">
                    <span>Replace discards the stored bindings, every record in them, and proposes the detected ones. Nothing is written before Confirm; one undo restores them.</span>
                    <span className="onto-binding-modal__actions">
                        <button type="button" className="onto-binding-modal__btn onto-binding-modal__btn--secondary" onClick={() => setAskReplace(false)}>Keep them</button>
                        <button
                            type="button" className="onto-binding-modal__btn onto-binding-modal__btn--danger"
                            onClick={() => { setReplacing(true); setAskReplace(false); detect(EMPTY); }}
                        >
                            Replace
                        </button>
                    </span>
                </div>
            ) : (
                <button type="button" className="onto-binding-modal__btn onto-binding-modal__btn--outline" onClick={() => setAskReplace(true)}>
                    <i className="bi bi-magic" />Replace with detected…
                </button>
            )}
        </div>
    ) : (
        <div className="onto-binding-modal__body">
            {notice && <div className="onto-binding-modal__warning">{notice}</div>}
            {records.length === 0 && !notice && (
                <div className="onto-binding-modal__empty">
                    No binding is declared: the instances of this metamodel&apos;s classes are not recognised. Detect proposes the UML binding from
                    the metamodel&apos;s names.
                </div>
            )}
            {records.map(recordOf)}
            {missingRecords.length > 0 && (
                <div className="onto-binding-modal__actions">
                    {missingRecords.map(n => (
                        <button type="button" key={n} className="onto-binding-modal__btn onto-binding-modal__btn--outline" onClick={() => addRecord(n)}>
                            <i className="bi bi-plus-lg" />{`${n} record`}
                        </button>
                    ))}
                </div>
            )}
            {foreign.length > 0 && (
                <div className="onto-binding-modal__kept" title="Records this dialog does not edit; Confirm and Remove keep them as they are">
                    {`Other records, kept: ${foreign.map(f => f.name).join(', ')}`}
                </div>
            )}
        </div>
    );

    const decodeErrors = afterDecode && !afterDecode.ok ? afterDecode.errors : [];

    return createPortal(
        <div
            className="onto-binding-modal-backdrop"
            role="presentation"
            onKeyDown={e => { e.stopPropagation(); if (e.key === 'Escape') onClose(); }} onKeyUp={stop} onMouseDown={stop} onMouseUp={stop} onClick={stop} onDoubleClick={stop}
            onPointerDown={stop} onPointerUp={stop} onContextMenu={stop} onWheel={stop}
        >
            <div className="onto-binding-modal" role="dialog" aria-modal="true" aria-labelledby="onto-binding-modal-title" tabIndex={-1} ref={dialogRef}>
                <div className="onto-binding-modal__header">
                    <div className="onto-binding-modal__title-row">
                        <h2 className="onto-binding-modal__title" id="onto-binding-modal-title">Ontological binding</h2>
                        <span className={`onto-binding-modal__pill onto-binding-modal__pill--${pill.kind}`}>{pill.text}</span>
                        <button type="button" className="onto-binding-modal__close" title="Close" aria-label="Close" onClick={onClose}>
                            <i className="bi bi-x-lg" />
                        </button>
                    </div>
                    <span className="onto-binding-modal__subtitle">
                        {`Which metaclasses of ${mmName || 'this metamodel'} hold instances, slots and values.`}
                    </span>
                </div>
                {body}
                <div className="onto-binding-modal__footer">
                    <div className="onto-binding-modal__actions">
                        <button
                            type="button" className="onto-binding-modal__btn onto-binding-modal__btn--ghost" disabled={undecodable} onClick={() => detect(base ?? EMPTY)}
                            title="Propose the object and link records from the metamodel's names (UML)"
                        >
                            <i className="bi bi-magic" />Detect
                        </button>
                        <button type="button" className="onto-binding-modal__btn onto-binding-modal__btn--ghost" disabled={draft === null && !replacing} onClick={reset}
                            title="Discard the changes made in this dialog">
                            <i className="bi bi-arrow-counterclockwise" />Reset
                        </button>
                        <button
                            type="button" className="onto-binding-modal__btn onto-binding-modal__btn--ghost" disabled={!base || storedRecords.length === 0}
                            onClick={() => base && write(bagAfterRemove(base))}
                            title="Take out the object and link records in one step; one undo reverts it. Other records are kept."
                        >
                            <i className="bi bi-trash" />Remove
                        </button>
                    </div>
                    <div className="onto-binding-modal__actions onto-binding-modal__actions--end">
                        {decodeErrors.length > 0 && (
                            <span className="onto-binding-modal__message" title={decodeErrors.join('\n')}>
                                <i className="bi bi-exclamation-circle-fill" />{`${decodeErrors.length} incomplete ${decodeErrors.length === 1 ? 'role' : 'roles'}`}
                            </span>
                        )}
                        <button type="button" className="onto-binding-modal__btn onto-binding-modal__btn--secondary" onClick={onClose}>Cancel</button>
                        <button
                            type="button"
                            className="onto-binding-modal__btn onto-binding-modal__btn--primary"
                            disabled={!pending || decodeErrors.length > 0}
                            title={pending ? 'Write the binding in one step; one undo reverts it. Other records are kept.' : 'Nothing to write'}
                            onClick={() => after !== null && write(after)}
                        >
                            Confirm
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body,
    );
}

export default OntoBindingModal;
