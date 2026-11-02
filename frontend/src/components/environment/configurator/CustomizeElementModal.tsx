/**
 * CustomizeElementModal — «Configure customize CSS» (#186 task 4, P-2026-10-17-1053, R-CFG-3).
 *
 * Opened by «Customize element» on a permission row of the Roles tab (`ProfilesStep`), above the
 * Endpoints window. It edits, for one role and one type, the presentation the Configurator panel
 * applies to the elements of that exact class: per attribute a widget (only the ones
 * `widgetChoicesFor` offers), a label, «Show type» and CSS; per reference or composition a label,
 * «Show type», the CSS of its cards and of the separators between its entries («interline»).
 *
 * The RENDER is the panel itself, `preview`, on the type's first instance in the Configurator's order,
 * with the role's permissions and the draft applied, inside an `inert` container: it shows the widgets
 * as the role will see them and takes no gesture. «Cancel», the close button and Escape drop the
 * draft; «Done» writes the role's whole `typePresentation` with one `SetFieldAction` (a write
 * replaces it, it does not merge), only when the cleaned draft differs from what is stored, and marks
 * the project unsaved, as the permission rows do: the Endpoints window's «Done» or Ctrl+S saves it.
 *
 * A portal on `<body>` at `--z-alert`, above the window's backdrop (9999). Escape is stopped at the
 * dialog, so the window under it stays open; Tab cycles inside the dialog; the focus goes back to the
 * opener at close.
 */

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import { DATA_MANAGER_VIEWPOINT_ID, LPointerTargetable, LProject, SetFieldAction, U } from '../../../joiner';
import { paletteAttr } from '../../../jjform';
import type { NavState } from '../../../jjform';
import { isAutoIdAttr } from '../../../jjform/shape';
import { instancesOfClass } from '../../abstract/tabs/instanceManagerModel';
import {
    cleanTypePresentation,
    modelsForType,
    nextTypePresentations,
    parseOptionList,
    resolveTypePermission,
    sanitizeDeclarations,
    typePresentationOf,
    widgetChoicesFor,
    type FieldPresentation,
    type RoleWidget,
    type TypePresentation,
} from '../../../joiner/environmentConfig';
import ConfiguratorPanel from './ConfiguratorPanel';
import { typeLabel } from './panelModel';
import './customizeElement.scss';

export interface CustomizeElementModalProps {
    /** The role (DProfile) being customized. */
    profileId: string;
    /** The metaclass (DClass) whose presentation is edited. */
    classId: string;
    /** The button that opened the popup: it gets the focus back at close. */
    opener: HTMLElement | null;
    onClose: () => void;
}

/** One feature of the type, as the popup lists it. */
interface Entry {
    name: string;
    typeName: string;
    kind: 'attribute' | 'reference' | 'composition';
    isEnum: boolean;
    isMultivalued: boolean;
    isReadOnly: boolean;
}

/** What the editor of one feature holds: the options as the text of their textarea. */
interface DraftField {
    widget: RoleWidget | '';
    optionsText: string;
    allowOther: boolean;
    label: string;
    showType: boolean;
    style: string;
    cardStyle: string;
    lineStyle: string;
}

const WIDGET_LABELS: Record<RoleWidget, string> = {
    input: 'Input',
    textarea: 'Textarea',
    dropdown: 'Dropdown',
    stepper: 'Stepper (− / +)',
    'number-input': 'Number input',
    'number-dropdown': 'Number dropdown',
};

/** The widget a feature keeps when the role has no choice to make. */
function fixedWidgetText(e: Entry): string {
    if (e.isReadOnly) return 'Read-only, no control';
    if (e.isEnum) return 'Dropdown, as the metamodel defines it';
    if (e.isMultivalued) return 'List of values';
    if (e.typeName === 'EBoolean') return 'Checkbox';
    return 'As the metamodel defines it';
}

/** The attributes and references of a class, inherited ones included, read from the class itself: no
 *  model is needed to customize a type. */
function entriesOf(classId: string): Entry[] {
    let cls: any = null;
    try { cls = LPointerTargetable.fromPointer(classId as any); } catch { return []; }
    if (!cls) return [];
    const out: Entry[] = [];
    for (const a of ((cls.allAttributes ?? []) as any[])) {
        if (!a?.name) continue;
        const typeName = String(a.type?.name ?? '');
        out.push({
            name: String(a.name),
            typeName,
            kind: 'attribute',
            isEnum: a.type?.className === 'DEnumerator',
            isMultivalued: a.upperBound !== 1,
            isReadOnly: a.derived === true || a.changeable === false || isAutoIdAttr({ isID: a.isID === true, typeName }),
        });
    }
    for (const r of ((cls.allReferences ?? []) as any[])) {
        if (!r?.name) continue;
        out.push({
            name: String(r.name),
            typeName: String(r.type?.name ?? ''),
            kind: r.composition === true ? 'composition' : 'reference',
            isEnum: false,
            isMultivalued: r.upperBound !== 1,
            isReadOnly: r.derived === true || r.changeable === false,
        });
    }
    return out;
}

function draftOf(fp: FieldPresentation | undefined): DraftField {
    return {
        widget: fp?.widget ?? '',
        optionsText: (fp?.options ?? []).join('\n'),
        allowOther: fp?.allowOther === true,
        label: fp?.label ?? '',
        showType: fp?.showType !== false,
        style: fp?.style ?? '',
        cardStyle: fp?.cardStyle ?? '',
        lineStyle: fp?.lineStyle ?? '',
    };
}

/** The draft as a presentation, before cleaning. */
function presentationOfDraft(draft: Record<string, DraftField>): TypePresentation {
    const fields: Record<string, FieldPresentation> = {};
    for (const [name, d] of Object.entries(draft)) {
        fields[name] = {
            widget: d.widget || undefined,
            options: parseOptionList(d.optionsText, d.widget === 'number-dropdown').options,
            allowOther: d.allowOther,
            label: d.label,
            showType: d.showType,
            style: d.style,
            cardStyle: d.cardStyle,
            lineStyle: d.lineStyle,
        };
    }
    return { fields };
}

const FOCUSABLE = 'button, input, select, textarea, [tabindex]:not([tabindex="-1"])';
const noop = () => { /* the RENDER takes no gesture */ };

export function CustomizeElementModal({ profileId, classId, opener, onClose }: CustomizeElementModalProps) {
    const idlookup = useSelector((s: any) => s?.idlookup);
    const profile: any = idlookup?.[profileId] ?? null;
    const className: string = idlookup?.[classId]?.name ?? classId;
    const entries = useMemo(() => entriesOf(classId), [classId]);
    const attributes = entries.filter(e => e.kind === 'attribute');
    const components = entries.filter(e => e.kind !== 'attribute');

    const [draft, setDraft] = useState<Record<string, DraftField>>(() => {
        const stored = typePresentationOf(profile, classId);
        const out: Record<string, DraftField> = {};
        for (const e of entries) out[e.name] = draftOf(stored?.fields?.[e.name]);
        return out;
    });
    const edit = (name: string, patch: Partial<DraftField>) =>
        setDraft(prev => ({ ...prev, [name]: { ...(prev[name] ?? draftOf(undefined)), ...patch } }));

    const preview = useMemo(() => cleanTypePresentation(presentationOfDraft(draft)), [draft]);

    // ── Closing: Cancel / close / Escape drop the draft; Done writes it ──────
    useEffect(() => () => { if (opener?.isConnected) opener.focus(); }, [opener]);
    const done = () => {
        const { next, changed } = nextTypePresentations(profile?.typePresentation, classId, presentationOfDraft(draft));
        if (changed && profile) {
            SetFieldAction.new(profile.id, 'typePresentation', next, '', false);
            U.isProjectModified = true;
        }
        onClose();
    };

    // ── Focus: first control at open, Tab kept inside, Escape stopped here ───
    const dialogRef = useRef<HTMLDivElement>(null);
    const focusables = () => Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])
        .filter(el => !(el as HTMLButtonElement).disabled && !el.closest('[inert]') && el.getClientRects().length > 0);
    useLayoutEffect(() => { focusables()[0]?.focus(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            e.stopPropagation();
            e.preventDefault();
            onClose();
            return;
        }
        if (e.key !== 'Tab') return;
        const list = focusables();
        if (!list.length) return;
        const at = list.indexOf(document.activeElement as HTMLElement);
        if (e.shiftKey && at <= 0) { e.preventDefault(); list[list.length - 1].focus(); }
        else if (!e.shiftKey && at === list.length - 1) { e.preventDefault(); list[0].focus(); }
    };

    // ── RENDER: the type's first instance, as the Configurator lists them ────
    const projectModelIds: string[] = (((LProject.getProject() as any)?.models ?? []) as Array<{ id: string }>).map(m => m.id);
    const first = useMemo(() => {
        for (const mid of modelsForType(idlookup, projectModelIds, classId)) {
            const row = instancesOfClass(idlookup, mid, classId)[0];
            if (row) return { id: row.id, modelId: mid };
        }
        return null;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [idlookup, classId, projectModelIds.join('|')]);
    const [nav, setNav] = useState<NavState | null>(null);
    const renderScrollRef = useRef<HTMLDivElement | null>(null);
    const permissionOf = useCallback((cid: string) => resolveTypePermission(profile, cid), [profile]);
    const presentationOf = useCallback(
        (cid: string) => (cid === classId ? preview : typePresentationOf(profile, cid)),
        [classId, preview, profile],
    );
    const palette = paletteAttr(idlookup?.[DATA_MANAGER_VIEWPOINT_ID]?.formPalette);

    const idFor = (name: string, what: string) => `cfg-custom-${what}-${name}`;
    const cssEditor = (name: string, what: 'style' | 'cardStyle' | 'lineStyle', label: string) => {
        const value = draft[name]?.[what] ?? '';
        const dropped = sanitizeDeclarations(value).dropped;
        return (
            <div className="cfg-custom__css">
                <label className="cfg-custom__label" htmlFor={idFor(name, what)}>{label}</label>
                <textarea
                    id={idFor(name, what)}
                    className="cfg-custom__code"
                    rows={3}
                    spellCheck={false}
                    placeholder={what === 'lineStyle' ? 'border-color: #e2e8f0;' : what === 'cardStyle' ? 'background-color: #f8fafc;' : 'font-weight: 600;\ncolor: #0f172a;'}
                    value={value}
                    onChange={ev => edit(name, { [what]: ev.target.value })}
                />
                {dropped.length > 0 && (
                    <ul className="cfg-custom__dropped" aria-live="polite">
                        {dropped.map((d, i) => <li key={i}>Not applied: <code>{d.declaration}</code> ({d.reason})</li>)}
                    </ul>
                )}
            </div>
        );
    };
    const common = (e: Entry) => (
        <>
            <label className="cfg-custom__label" htmlFor={idFor(e.name, 'label')}>Label</label>
            <input
                id={idFor(e.name, 'label')}
                className="cfg-custom__input"
                type="text"
                placeholder={e.name}
                value={draft[e.name]?.label ?? ''}
                onChange={ev => edit(e.name, { label: ev.target.value })}
            />
            <span className="cfg-custom__label">Show type</span>
            <label className="cfg-custom__check">
                <input type="checkbox" checked={draft[e.name]?.showType !== false} onChange={ev => edit(e.name, { showType: ev.target.checked })} />
                [{typeLabel(e.typeName)}] in the title
            </label>
        </>
    );

    const attributeEntry = (e: Entry) => {
        const choices = widgetChoicesFor(e);
        const d = draft[e.name] ?? draftOf(undefined);
        const widget = d.widget && choices.includes(d.widget) ? d.widget : '';
        const dropdown = widget === 'dropdown' || widget === 'number-dropdown';
        const optionsDropped = dropdown ? parseOptionList(d.optionsText, widget === 'number-dropdown').dropped : [];
        return (
            <div className="cfg-custom__entry" key={e.name} data-entry={e.name}>
                <div className="cfg-custom__entry-head">{e.name}: <span className="cfg-custom__entry-type">{typeLabel(e.typeName)}</span></div>
                <div className="cfg-custom__grid">
                    <label className="cfg-custom__label" htmlFor={idFor(e.name, 'widget')}>Widget</label>
                    {choices.length ? (
                        <select id={idFor(e.name, 'widget')} className="cfg-custom__input" value={widget} onChange={ev => edit(e.name, { widget: ev.target.value as RoleWidget | '' })}>
                            <option value="">Default</option>
                            {choices.map(c => <option key={c} value={c}>{WIDGET_LABELS[c]}</option>)}
                        </select>
                    ) : (
                        <span className="cfg-custom__fixed" id={idFor(e.name, 'widget')}>{fixedWidgetText(e)}</span>
                    )}
                    {dropdown && (
                        <>
                            <label className="cfg-custom__label" htmlFor={idFor(e.name, 'options')}>Options</label>
                            <div>
                                <textarea
                                    id={idFor(e.name, 'options')}
                                    className="cfg-custom__code"
                                    rows={3}
                                    placeholder="One option per line"
                                    value={d.optionsText}
                                    onChange={ev => edit(e.name, { optionsText: ev.target.value })}
                                />
                                {optionsDropped.length > 0 && (
                                    <ul className="cfg-custom__dropped"><li>Not a number, left out: {optionsDropped.join(', ')}</li></ul>
                                )}
                            </div>
                        </>
                    )}
                    {widget === 'dropdown' && (
                        <>
                            <span className="cfg-custom__label">Other</span>
                            <label className="cfg-custom__check">
                                <input type="checkbox" checked={d.allowOther} onChange={ev => edit(e.name, { allowOther: ev.target.checked })} />
                                Allow «Other:», a free value
                            </label>
                        </>
                    )}
                    {common(e)}
                </div>
                {cssEditor(e.name, 'style', 'CSS')}
            </div>
        );
    };

    const componentEntry = (e: Entry) => (
        <div className="cfg-custom__entry" key={e.name} data-entry={e.name}>
            <div className="cfg-custom__entry-head">
                {e.name}: <span className="cfg-custom__entry-type">{e.typeName}</span>
                <span className="cfg-custom__entry-kind">{e.kind === 'composition' ? 'composition' : 'reference'}</span>
            </div>
            <div className="cfg-custom__grid">{common(e)}</div>
            {cssEditor(e.name, 'cardStyle', 'Card')}
            {(e.isMultivalued || e.kind === 'composition') && cssEditor(e.name, 'lineStyle', 'Interline')}
        </div>
    );

    const titleId = 'cfg-custom-title';
    return createPortal(
        <div className="cfg-custom">
            <div
                ref={dialogRef}
                className="cfg-custom__dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                onKeyDown={onKeyDown}
            >
                <div className="cfg-custom__head">
                    <div>
                        <h2 id={titleId} className="cfg-custom__title">Configure customize CSS</h2>
                        <p className="cfg-custom__subtitle">
                            {className}, for the role {profile?.name || 'unnamed'}
                        </p>
                        <p className="cfg-custom__text">
                            This panel allows developers to customize the CSS for the selected element. CSS styling is
                            allowed only: the element type itself remains unchanged (for example, an input element
                            always remains an input element). Press «Done» to apply the changes to this role.
                        </p>
                    </div>
                    <button type="button" className="cfg-custom__close" aria-label="Close without applying" title="Close without applying" onClick={onClose}>
                        <i className="bi bi-x-lg" aria-hidden="true" />
                    </button>
                </div>

                <div className="cfg-custom__body">
                    <div className="cfg-custom__edit">
                        <section className="cfg-custom__section" aria-label="Attributes">
                            <h3 className="cfg-custom__section-title">Attributes</h3>
                            {attributes.length ? attributes.map(attributeEntry) : <p className="cfg-custom__empty">No attributes.</p>}
                        </section>
                        <section className="cfg-custom__section" aria-label="Components">
                            <h3 className="cfg-custom__section-title">Components</h3>
                            {components.length ? components.map(componentEntry) : <p className="cfg-custom__empty">No references or compositions.</p>}
                        </section>
                    </div>
                    <section className="cfg-custom__render" aria-label="Render">
                        <h3 className="cfg-custom__section-title">Render</h3>
                        {first ? (
                            <div
                                className="cfg-custom__render-frame"
                                ref={el => { renderScrollRef.current = el; if (el) el.setAttribute('inert', ''); }}
                            >
                                <div className="instance-manager configurator__dm" data-palette={palette}>
                                    <div className="instance-manager__form-inner">
                                        <ConfiguratorPanel
                                            modelid={first.modelId}
                                            subjectId={first.id}
                                            nav={nav}
                                            setNav={setNav}
                                            scrollRef={renderScrollRef}
                                            openDelete={noop}
                                            onCreate={noop}
                                            onCreateAndLink={noop}
                                            permissionOf={permissionOf}
                                            presentationOf={presentationOf}
                                            preview
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="cfg-custom__empty">This project has no {className} yet: create one to preview it.</p>
                        )}
                    </section>
                </div>

                <div className="cfg-custom__foot">
                    <button type="button" className="envgen-btn envgen-btn--secondary" onClick={onClose}>Cancel</button>
                    <button type="button" className="envgen-btn envgen-btn--primary" onClick={done}>
                        <i className="bi bi-check-lg" aria-hidden="true" /> Done
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
}

export default CustomizeElementModal;
