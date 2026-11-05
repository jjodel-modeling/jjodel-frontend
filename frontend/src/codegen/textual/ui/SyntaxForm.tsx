/**
 * SyntaxForm — the Syntax mode of the Text tab (step C lane C2b, P-2026-11-05-0118; report
 * docs/discovery/discovery_2026-11-05_textual_c2_syntax_form.md §2.2, R-TXT-47 D1, D2, D7, D9).
 *
 * A draft of the metamodel's syntax record, edited field by field, with a live preview of the text or the EBNF; Save
 * writes it as one undo step. Every computation is syntaxForm.ts's: this component holds the draft, the selection and
 * the wiring. Basic and Advanced follow the app's global mode (D2, Redux `advanced`): the form has no toggle of its own.
 *
 * In `src/codegen/`: loaded with the Text tab's lazy chunk; it imports no `joiner`, so the bench can import the tab.
 */

import { useDeferredValue, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import { useSelector } from 'react-redux';
import type { ElementIds, EnumSubset, SyntaxAnnotations } from '../annotations';
import type { TextMetamodel, TextObject } from '../metamodel';
import type { DecodedSyntax } from '../syntaxRecord';
import {
    advancedInEffect, byField, draftPreview, elementMarks, fieldKey, fieldPhrase, fieldValue, fieldsOf, formElements,
    parseSubsets, parseTokens, setField, styleTokenFields, subsetsText, tokensText,
} from '../syntaxForm';
import type { ElementKey, FieldRef, FormElement, FormField, FormFault, InterfaceMode } from '../syntaxForm';
import { useSyntaxDraft } from './useSyntaxDraft';
import type { SyntaxDraft } from './useSyntaxDraft';
import './SyntaxForm.scss';

export type PreviewKind = 'text' | 'ebnf';

export interface SyntaxFormProps {
    readonly mm: TextMetamodel;
    readonly ids: ElementIds;
    /** The stored record, decoded (syntaxRecord.ts `readSyntax`). */
    readonly decoded: DecodedSyntax;
    /** The stored key as written, for the dirty check (D3). */
    readonly storedRaw: string | undefined;
    /** The open model's objects, printed by the preview. */
    readonly objects: readonly TextObject[];
    /** The metamodel's name, the language name's placeholder. */
    readonly metamodelName?: string;
    /** The Text layer holds an edit not yet applied: Save waits (D1 (c)). */
    readonly pendingEdit: boolean;
    /** Writes the record as one undo step (openTextualTab.tsx `writeTextualSyntax`). */
    readonly onSave: (record: SyntaxAnnotations) => boolean;
    /** A read-only editor of the preview, from the tab (its Monaco setup). */
    readonly preview: (kind: PreviewKind, value: string) => ReactNode;
    /** The draft shared with the EBNF mode, owned by the Text tab (L1b, R-TXT-49 D3); without it the form keeps its own. */
    readonly draft?: SyntaxDraft;
}

const PREVIEW_MIN = 240;
const PREVIEW_DEFAULT = 420;

const plural = (n: number, one: string): string => `${n} ${one}${n === 1 ? '' : 's'}`;

export default function SyntaxForm({ mm, ids, decoded, storedRaw, objects, metamodelName, pendingEdit, onSave, preview, draft: shared }: SyntaxFormProps) {
    // D2: the app's Basic and Advanced (Redux `advanced`, Settings «Editor mode»), as Toolbar.tsx reads it.
    const interfaceMode: InterfaceMode = useSelector((state: any) => !!state.advanced) ? 'advanced' : 'basic';
    // L1b: the Text tab's draft when given, else the form's own (the hook runs either way, hooks are unconditional; idle,
    // with no metamodel to read, under a shared draft).
    const own = useSyntaxDraft({ mm: shared ? undefined : mm, ids, decoded, storedRaw, pendingEdit, onSave });
    const { draft, setDraft, change, reading, dirty, gate, save, loadStored } = shared ?? own;
    const [selected, setSelected] = useState<ElementKey>('language');
    const [filter, setFilter] = useState('');
    const [previewKind, setPreviewKind] = useState<PreviewKind>('text');
    const [previewWidth, setPreviewWidth] = useState(PREVIEW_DEFAULT);

    const elements = useMemo(() => formElements(mm, ids), [mm, ids]);
    const fields = useMemo(() => byField(reading.faults), [reading]);
    const marks = useMemo(() => elementMarks(elements, draft, reading.faults), [elements, draft, reading]);
    const deferred = useDeferredValue(draft);
    const shown = useMemo(() => draftPreview(mm, ids, deferred, objects), [mm, ids, deferred, objects]);

    const errors = reading.faults.filter(f => f.level === 'error').length;
    const notices = reading.faults.length - errors;
    const recordFaults = reading.faults.filter(f => !f.at.length);

    const set = (ref: FieldRef, value: unknown): void => setDraft(d => setField(d, ref, value));

    const q = filter.trim().toLowerCase();
    const matches = (e: FormElement): boolean => !q || e.name.toLowerCase().includes(q);
    const classes = elements.filter(e => e.kind === 'class' && matches(e));
    const enums = elements.filter(e => e.kind === 'enum' && matches(e));
    const current = elements.find(e => e.key === selected) ?? elements[0];

    const listItem = (e: FormElement, icon: string): ReactNode => {
        const m = marks.get(e.key);
        return (
            <li key={e.key}>
                <button type="button" className={'syntax-form__item' + (e.key === current.key ? ' syntax-form__item--selected' : '')}
                        aria-current={e.key === current.key} onClick={() => setSelected(e.key)}>
                    <i className={`bi ${icon}`} aria-hidden="true" />
                    <span className={'syntax-form__item-name' + (e.abstract ? ' syntax-form__item-name--abstract' : '')}>{e.name}</span>
                    <span className="syntax-form__marks">
                        <span className={'syntax-form__dot' + (m?.annotated ? ' syntax-form__dot--on' : '')}
                              title={m?.annotated ? 'Annotated' : undefined} />
                        <i className={'bi bi-exclamation-triangle syntax-form__flag' + (m?.finding ? ` syntax-form__flag--${m.finding}` : '')}
                           aria-label={m?.finding ? (m.finding === 'error' ? 'Has an error' : 'Has a notice') : undefined}
                           aria-hidden={m?.finding ? undefined : true} />
                    </span>
                </button>
            </li>
        );
    };

    const fieldList = (element: ElementKey): ReactNode => {
        const fs = [...fieldsOf(mm, ids, element, interfaceMode, metamodelName), ...(element === 'language' ? styleTokenFields(draft, interfaceMode) : [])];
        const hidden = interfaceMode === 'basic' ? advancedInEffect(draft, element) : 0;
        return (
            <>
                {fs.map(f => (
                    <Field key={f.id} element={element} field={f} draft={draft} ids={ids} mm={mm}
                           findings={fields.get(fieldKey({ element, field: f.id })) ?? []} onChange={set} />
                ))}
                {hidden > 0 && (
                    <div className="syntax-form__advanced-note">
                        <i className="bi bi-info-circle" aria-hidden="true" />
                        {`${plural(hidden, 'advanced setting')} in effect`}
                    </div>
                )}
            </>
        );
    };

    /** The faults of an element no field of it can fix. */
    const elementFaults = (element: ElementKey): ReactNode => {
        const own = fields.get(fieldKey({ element })) ?? [];
        return own.map((f, k) => (
            <div key={k} className={`syntax-form__element-fault syntax-form__element-fault--${f.level}`}>
                <i className={`bi ${f.level === 'error' ? 'bi-exclamation-triangle' : 'bi-info-circle'}`} aria-hidden="true" />
                {f.message}
            </div>
        ));
    };

    const editor = (): ReactNode => {
        if (current.kind === 'language') {
            return (
                <section className="syntax-form__group" aria-label="Language">
                    <h3 className="syntax-form__heading"><i className="bi bi-file-earmark-code" aria-hidden="true" />Language</h3>
                    {fieldList('language')}
                </section>
            );
        }
        if (current.kind === 'enum') {
            const none = !fieldsOf(mm, ids, current.key, interfaceMode).length && !advancedInEffect(draft, current.key);
            return (
                <section className="syntax-form__group" aria-label={current.name}>
                    <h3 className="syntax-form__heading"><i className="bi bi-list-ul" aria-hidden="true" />{current.name}</h3>
                    {elementFaults(current.key)}
                    {fieldList(current.key)}
                    {none && <div className="syntax-form__empty">An enumeration has Advanced settings only.</div>}
                </section>
            );
        }
        const classFields = fieldsOf(mm, ids, current.key, interfaceMode);
        return (
            <>
                <section className="syntax-form__group" aria-label={current.name}>
                    <h3 className="syntax-form__heading">
                        <i className="bi bi-box" aria-hidden="true" />{current.name}
                        {current.abstract && <span className="syntax-form__tag">abstract</span>}
                    </h3>
                    {elementFaults(current.key)}
                    {fieldList(current.key)}
                    {!classFields.length && current.abstract && <div className="syntax-form__empty">An abstract class prints no object of its own.</div>}
                </section>
                {(current.features ?? []).map(k => {
                    const f = ids.features[k.slice(k.indexOf(':') + 1)];
                    if (!fieldsOf(mm, ids, k, 'advanced').length) return null;
                    return (
                        <section key={k} className="syntax-form__group syntax-form__group--feature" aria-label={f?.name ?? k}>
                            <h4 className="syntax-form__subheading">{f?.name ?? k}</h4>
                            {elementFaults(k)}
                            {fieldList(k)}
                        </section>
                    );
                })}
            </>
        );
    };

    const onSplitter = (e: ReactPointerEvent<HTMLDivElement>): void => {
        const startX = e.clientX;
        const start = previewWidth;
        const target = e.currentTarget;
        target.setPointerCapture(e.pointerId);
        const move = (ev: PointerEvent): void => setPreviewWidth(Math.max(PREVIEW_MIN, start + startX - ev.clientX));
        const up = (): void => { target.removeEventListener('pointermove', move); target.removeEventListener('pointerup', up); };
        target.addEventListener('pointermove', move);
        target.addEventListener('pointerup', up);
    };

    const countTitle = reading.faults.map(f => `${f.level === 'error' ? 'Error' : 'Notice'}: ${f.message}`).join('\n');

    return (
        <div className="syntax-form">
            <div className="syntax-form__bar">
                <span className={'syntax-form__state' + (dirty ? ' syntax-form__state--dirty' : '')} role="status">
                    {dirty ? 'Unsaved changes' : 'Saved'}
                </span>
                {change === 'kept' && (
                    <span className="syntax-form__stale" role="alert">
                        <i className="bi bi-exclamation-triangle" aria-hidden="true" />
                        The stored syntax changed
                        <button type="button" className="syntax-form__button" title="Replace the draft with the stored syntax" onClick={loadStored}>
                            Reload
                        </button>
                    </span>
                )}
                {recordFaults.length > 0 && (
                    <span className={`syntax-form__record syntax-form__record--${recordFaults[0].level}`} title={recordFaults.map(f => f.message).join('\n')}>
                        {recordFaults[0].message}
                    </span>
                )}
                <span className="syntax-form__spacer" />
                <span className={'syntax-form__count' + (errors ? ' syntax-form__count--error' : '')} title={countTitle || 'No findings'}>
                    <i className={`bi ${errors ? 'bi-exclamation-triangle' : 'bi-info-circle'}`} aria-hidden="true" />
                    {errors || notices ? [errors ? plural(errors, 'error') : '', notices ? plural(notices, 'notice') : ''].filter(Boolean).join(' · ') : 'No findings'}
                </span>
                <button type="button" className="syntax-form__button" disabled={!dirty} title={dirty ? 'Drop the draft and show the stored syntax' : 'No unsaved changes'}
                        onClick={loadStored}>
                    Discard
                </button>
                <button type="button" className="syntax-form__button syntax-form__button--primary" disabled={!gate.enabled} title={gate.title} onClick={save}>
                    <i className="bi bi-check2" aria-hidden="true" />
                    Save
                </button>
            </div>
            <div className="syntax-form__main">
                <nav className="syntax-form__list" aria-label="Elements">
                    <input type="search" className="syntax-form__filter" placeholder="Filter" aria-label="Filter the elements"
                           value={filter} onChange={e => setFilter(e.target.value)} />
                    <ul className="syntax-form__items">
                        {listItem(elements[0], 'bi-file-earmark-code')}
                    </ul>
                    <div className="syntax-form__list-heading">Classes</div>
                    <ul className="syntax-form__items">{classes.map(e => listItem(e, 'bi-box'))}</ul>
                    {enums.length > 0 && (
                        <>
                            <div className="syntax-form__list-heading">Enumerations</div>
                            <ul className="syntax-form__items">{enums.map(e => listItem(e, 'bi-list-ul'))}</ul>
                        </>
                    )}
                </nav>
                <div className="syntax-form__editor">{editor()}</div>
                <div className="syntax-form__splitter" role="separator" aria-orientation="vertical" aria-label="Resize the preview" onPointerDown={onSplitter} />
                <div className="syntax-form__preview" style={{ width: previewWidth }}>
                    <div className="syntax-form__preview-bar">
                        <span className="syntax-form__preview-title">Preview</span>
                        <span className="syntax-form__spacer" />
                        <div className="syntax-form__preview-modes" role="group" aria-label="Preview">
                            {(['text', 'ebnf'] as const).map(k => (
                                <button key={k} type="button" aria-pressed={previewKind === k}
                                        className={'syntax-form__preview-mode' + (previewKind === k ? ' syntax-form__preview-mode--active' : '')}
                                        onClick={() => setPreviewKind(k)}>
                                    {k === 'text' ? 'Text' : 'EBNF'}
                                </button>
                            ))}
                        </div>
                    </div>
                    {shown.error && (
                        <div className="syntax-form__preview-error" role="alert">
                            <i className="bi bi-exclamation-triangle" aria-hidden="true" />
                            {shown.error}
                        </div>
                    )}
                    <div className="syntax-form__preview-body">{preview(previewKind, previewKind === 'text' ? shown.text : shown.ebnf)}</div>
                </div>
            </div>
        </div>
    );
}

interface FieldProps {
    readonly element: ElementKey;
    readonly field: FormField;
    readonly draft: SyntaxAnnotations;
    readonly ids: ElementIds;
    readonly mm: TextMetamodel;
    readonly findings: readonly { readonly level: FormFault['level']; readonly message: string; readonly also: readonly FieldRef[] }[];
    readonly onChange: (ref: FieldRef, value: unknown) => void;
}

/** One field: an 11 px label, its input, and a finding line of fixed height, empty or not, so nothing moves. */
function Field({ element, field, draft, ids, mm, findings, onChange }: FieldProps) {
    const ref: FieldRef = { element, field: field.id };
    const id = `syntax-${fieldKey(ref).replace(/[^A-Za-z0-9_-]/g, '_')}`;
    const value = fieldValue(draft, ref);
    const first = findings[0];
    const also = first?.also.length ? ` (also at ${first.also.map(r => fieldPhrase(ids, r)).join(', ')})` : '';
    const message = first ? `${first.message}${also}` : '';
    let input: ReactNode;
    switch (field.input) {
        case 'toggle':
            input = <input id={id} type="checkbox" className="syntax-form__toggle" checked={value === true} onChange={e => onChange(ref, e.target.checked)} />;
            break;
        case 'choice':
            input = (
                <select id={id} className="syntax-form__input" value={typeof value === 'string' ? value : ''} onChange={e => onChange(ref, e.target.value || undefined)}>
                    <option value="">{field.placeholder ? `Default (${field.placeholder})` : 'Default'}</option>
                    {(field.options ?? []).map(o => <option key={o} value={o}>{optionLabel(field, o, ids)}</option>)}
                </select>
            );
            break;
        case 'number':
            input = (
                <input id={id} type="number" className="syntax-form__input" value={typeof value === 'number' ? value : ''}
                       onChange={e => onChange(ref, e.target.value === '' ? undefined : Number(e.target.value))} />
            );
            break;
        case 'roots': {
            const on = new Set(Array.isArray(value) ? (value as string[]) : []);
            input = (
                <div id={id} className="syntax-form__checks" role="group" aria-label={field.label}>
                    {(field.options ?? []).map(o => (
                        <label key={o} className="syntax-form__check">
                            <input type="checkbox" checked={on.has(o)}
                                   onChange={e => onChange(ref, (field.options ?? []).filter(x => (x === o ? e.target.checked : on.has(x))))} />
                            {o === 'uncontained' ? 'Objects in no container' : ids.classes[o] ?? o}
                        </label>
                    ))}
                </div>
            );
            break;
        }
        case 'subsets':
            input = <SubsetsInput id={id} value={value as readonly EnumSubset[] | undefined} literals={literalsOf(mm, ids, element)} onCommit={v => onChange(ref, v)} />;
            break;
        case 'tokens':
            input = <TokensInput id={id} value={value} placeholder={field.placeholder ?? ''} onCommit={v => onChange(ref, v)} />;
            break;
        default:
            input = (
                <input id={id} type="text" className="syntax-form__input" spellCheck={false} placeholder={field.placeholder ?? ''}
                       value={typeof value === 'string' ? value : ''} onChange={e => onChange(ref, e.target.value)} />
            );
    }
    return (
        <div className={'syntax-form__field' + (field.input === 'toggle' ? ' syntax-form__field--toggle' : '')}>
            <label className="syntax-form__label" htmlFor={id}>{field.label}</label>
            {input}
            <div className={'syntax-form__finding' + (first ? ` syntax-form__finding--${first.level}` : '')} title={message || undefined}
                 role={first?.level === 'error' ? 'alert' : undefined}>
                {message}
            </div>
        </div>
    );
}

/** A choice's entry as the author reads it: a feature id by its name. */
function optionLabel(field: FormField, option: string, ids: ElementIds): string {
    if (field.id === 'feature.groupBy') return ids.features[option]?.name ?? option;
    return option;
}

/** The declared literals of an enumeration element, the groups field's hint. */
function literalsOf(mm: TextMetamodel, ids: ElementIds, element: ElementKey): readonly string[] {
    const name = ids.enums[element.slice(element.indexOf(':') + 1)];
    return mm.enumerations.find(e => e.name === name)?.literals ?? [];
}

/** The groups of literals as one line, applied when the field is left or on Enter, so a group half typed is not dropped. */
function SubsetsInput({ id, value, literals, onCommit }: { readonly id: string; readonly value: readonly EnumSubset[] | undefined; readonly literals: readonly string[]; readonly onCommit: (v: EnumSubset[]) => void }) {
    const printed = subsetsText(value);
    const [text, setText] = useState(printed);
    const last = useRef(printed);
    if (last.current !== printed) { last.current = printed; setText(printed); }
    return (
        <input id={id} type="text" className="syntax-form__input" spellCheck={false} value={text}
               placeholder={literals.length ? `group: ${literals.slice(0, 2).join(', ')}; …` : 'group: LITERAL, …'}
               onChange={e => setText(e.target.value)} onBlur={() => onCommit(parseSubsets(text))}
               onKeyDown={e => { if (e.key === 'Enter') onCommit(parseSubsets(text)); }} />
    );
}

/**
 * A list of style tokens as one line (B0, F5), the tokens split on blanks, applied when the field is left or on Enter:
 * applied per keystroke, a line equal to the base would clear itself while it is typed.
 */
function TokensInput({ id, value, placeholder, onCommit }: { readonly id: string; readonly value: unknown; readonly placeholder: string; readonly onCommit: (v: string[] | undefined) => void }) {
    const printed = tokensText(value);
    const [text, setText] = useState(printed);
    const last = useRef(printed);
    if (last.current !== printed) { last.current = printed; setText(printed); }
    return (
        <input id={id} type="text" className="syntax-form__input" spellCheck={false} value={text} placeholder={placeholder}
               onChange={e => setText(e.target.value)} onBlur={() => onCommit(parseTokens(text))}
               onKeyDown={e => { if (e.key === 'Enter') onCommit(parseTokens(text)); }} />
    );
}
