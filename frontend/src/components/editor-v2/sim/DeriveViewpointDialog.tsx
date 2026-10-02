/**
 * DeriveViewpointDialog — «Derive viewpoint» with its notation select and its metaclass → role
 * table (slice D, P-2026-09-30-0255, docs/discovery/discovery_2026-09-29_derived_viewpoint_notations.md
 * §3, R-VP-21).
 *
 * Opened by `JjodelEvents.DERIVE_VIEWPOINT_OPEN` (the tree row of a metamodel) and mounted once at
 * the root (App.tsx), as ValidationRulesModal is (CLAUDE.md §8.7). The select opens on the latest
 * derived viewpoint's notation, else on the one the stored simulation binding matches, else on
 * Generic (notations.ts `initialNotation`). A role notation shows one row per class of the
 * metamodel, its role select prefilled (`dialogPrefill`) and always editable; a class with no role
 * of its own says which one it inherits. Generic has no table. Derive creates a new viewpoint
 * (`createDerivedViewpoint`): one undo step, not activated, its tab opened. Nothing is written
 * before it, and the simulation binding never.
 *
 * The shell is the Simulation roles dialog's (SimRolesModal.scss), as SimInputDialog's: portaled
 * onto `document.body`, the same backdrop, header, footer, select and buttons, keyboard and
 * pointer events stopped at the root; DeriveViewpointDialog.scss holds the size, the notation field
 * and the rows. Escape closes, Enter derives (a focused button keeps its own Enter), the focus
 * opens on the notation select and goes back where it was on close.
 */

import { ReactElement, SyntheticEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { store } from '../../../joiner';
import { JjodelEvents } from '../../../events/registry';
import { createDerivedViewpoint, projectViewpointIds } from '../../../utils/deriveViewpoint';
import { sketchOfMetamodel } from './metamodelSketch';
import {
    DERIVED_NOTATIONS, canDerive, dialogPrefill, initialNotation, notationRoles, roleLabel,
} from '../viewpoint/derive/notations';
import type { ClassRoles, DerivedNotationId, DialogPrefill, NotationRoleId } from '../viewpoint/derive/notations';
import { isDerivableMetamodel, rolesFromTable } from '../viewpoint/derive/viewpointDerivation';
import type { SketchClass } from '../../../model/simulation/profileBinder';
import './SimRolesModal.scss';
import './DeriveViewpointDialog.scss';

/** The detail of the open event: the metamodel to derive from. */
export interface DeriveViewpointOpenDetail {
    metamodelId: string;
}

export interface DeriveViewpointFormProps {
    metamodelName: string;
    classes: readonly SketchClass[];
    notation: DerivedNotationId;
    roles: ClassRoles;
    /** Every class's role as the derivation reads the table: its own, else its nearest superclass's. */
    effective: ReadonlyMap<string, string>;
    prefillFrom: DialogPrefill['from'];
    onNotation: (notation: DerivedNotationId) => void;
    onRole: (classId: string, role: NotationRoleId | '') => void;
    onCancel: () => void;
    onConfirm: () => void;
}

const TITLE_ID = 'derive-viewpoint-dialog-title';
const NOTATION_ID = 'derive-viewpoint-dialog-notation';

/** The footer's note: where the table came from. */
const FROM: Readonly<Record<DialogPrefill['from'], string>> = {
    derived: 'Prefilled from the latest derived viewpoint.',
    binding: 'Prefilled from the simulation roles.',
    signals: 'Prefilled from the names and the structure.',
    none: 'A new viewpoint; the current one is not changed.',
};

/** The dialog's content, without its portal and its state: what the tests render. */
export function DeriveViewpointForm(props: DeriveViewpointFormProps): ReactElement {
    const { metamodelName, classes, notation, roles, effective, prefillFrom, onNotation, onRole, onCancel, onConfirm } = props;
    const offered = notationRoles(notation);
    const ready = canDerive({ notation, classRoles: roles });
    const emptyOption = (classId: string): string => {
        const inherited = roles[classId] ? undefined : effective.get(classId);
        return inherited ? `— (${roleLabel(notation, inherited as NotationRoleId)}, inherited)` : '—';
    };

    return (
        <div className="sim-roles-modal derive-viewpoint-dialog" role="dialog" aria-modal="true" aria-labelledby={TITLE_ID} tabIndex={-1}>
            <div className="sim-roles-modal__header">
                <div className="sim-roles-modal__title-row">
                    <h2 className="sim-roles-modal__title" id={TITLE_ID}>{`Derive viewpoint — ${metamodelName}`}</h2>
                    <button type="button" className="sim-roles-modal__close" title="Close" aria-label="Close" onClick={onCancel}>
                        <i className="bi bi-x-lg" aria-hidden="true" />
                    </button>
                </div>
                <div className="derive-viewpoint-dialog__field">
                    <label className="derive-viewpoint-dialog__label" htmlFor={NOTATION_ID}>Notation</label>
                    <select
                        id={NOTATION_ID}
                        className="sim-roles-modal__select"
                        value={notation}
                        onChange={e => onNotation(e.target.value as DerivedNotationId)}
                    >
                        {DERIVED_NOTATIONS.map(n => <option value={n.id} key={n.id}>{n.label}</option>)}
                    </select>
                </div>
            </div>
            <div className="sim-roles-modal__body">
                {offered.length === 0 ? (
                    <p className="derive-viewpoint-dialog__empty">Generic reads the structure alone: no role to bind.</p>
                ) : (
                    <div className="derive-viewpoint-dialog__table" role="group" aria-labelledby="derive-viewpoint-dialog-roles">
                        <div className="sim-roles-modal__section" id="derive-viewpoint-dialog-roles">
                            Metaclass roles <span className="sim-roles-modal__count">{classes.length}</span>
                        </div>
                        {classes.map((c, i) => {
                            const id = `derive-viewpoint-dialog-role-${i}`;
                            return (
                                <div className="derive-viewpoint-dialog__row" key={c.id}>
                                    <label
                                        className={`derive-viewpoint-dialog__label derive-viewpoint-dialog__class${c.abstract ? ' derive-viewpoint-dialog__class--abstract' : ''}`}
                                        htmlFor={id}
                                        title={c.abstract ? `${c.name} (abstract)` : c.name}
                                    >
                                        {c.name}
                                    </label>
                                    <select
                                        id={id}
                                        className="sim-roles-modal__select"
                                        value={roles[c.id] ?? ''}
                                        onChange={e => onRole(c.id, e.target.value as NotationRoleId | '')}
                                    >
                                        <option value="">{emptyOption(c.id)}</option>
                                        {offered.map(r => <option value={r} key={r}>{roleLabel(notation, r)}</option>)}
                                    </select>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            <div className="sim-roles-modal__footer">
                <span className="sim-roles-modal__note">{ready ? FROM[prefillFrom] : 'Give a class a role, or choose Generic.'}</span>
                <div className="sim-roles-modal__actions sim-roles-modal__actions--end">
                    <button type="button" className="sim-roles-modal__btn sim-roles-modal__btn--secondary" onClick={onCancel}>Cancel</button>
                    <button
                        type="button"
                        className="sim-roles-modal__btn sim-roles-modal__btn--primary"
                        disabled={!ready}
                        title={ready ? 'Create a new viewpoint with these views' : 'Give a class a role, or choose Generic'}
                        onClick={onConfirm}
                    >
                        <i className="bi bi-magic" aria-hidden="true" />
                        Derive
                    </button>
                </div>
            </div>
        </div>
    );
}

/** Stops a React event at the dialog, as SimInputDialog does. */
const stop = (e: SyntheticEvent) => e.stopPropagation();

interface Target {
    metamodelId: string;
    name: string;
    classes: readonly SketchClass[];
    viewpointIds: readonly string[];
}

const lookupNow = (): Record<string, any> => (store.getState() as any).idlookup ?? {};

export function DeriveViewpointDialog(): ReactElement | null {
    const [target, setTarget] = useState<Target | null>(null);
    const [notation, setNotation] = useState<DerivedNotationId>('generic');
    const [roles, setRoles] = useState<ClassRoles>({});
    const [from, setFrom] = useState<DialogPrefill['from']>('none');
    const hostRef = useRef<HTMLDivElement>(null);
    const returnFocus = useRef<HTMLElement | null>(null);

    useEffect(() => {
        const handler = (e: Event) => {
            const id = ((e as CustomEvent).detail as DeriveViewpointOpenDetail | null)?.metamodelId;
            const lookup = lookupNow();
            if (!id || !isDerivableMetamodel(lookup[id])) return;
            const viewpointIds = projectViewpointIds();
            const opened = initialNotation(lookup, id, viewpointIds);
            const prefill = dialogPrefill(lookup, id, opened, viewpointIds);
            returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
            setTarget({ metamodelId: id, name: lookup[id].name ?? id, classes: sketchOfMetamodel(lookup, id).classes, viewpointIds });
            setNotation(opened);
            setRoles(prefill.roles);
            setFrom(prefill.from);
        };
        window.addEventListener(JjodelEvents.DERIVE_VIEWPOINT_OPEN, handler);
        return () => window.removeEventListener(JjodelEvents.DERIVE_VIEWPOINT_OPEN, handler);
    }, []);

    const close = useCallback(() => {
        setTarget(null);
        const back = returnFocus.current;
        returnFocus.current = null;
        if (back?.isConnected) back.focus();
    }, []);

    // Escape closes with the focus outside the dialog too; the focus goes to the notation select on open.
    useEffect(() => {
        if (!target) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
        window.addEventListener('keydown', onKey);
        hostRef.current?.querySelector<HTMLElement>('select')?.focus();
        return () => window.removeEventListener('keydown', onKey);
    }, [target, close]);

    const effective = useMemo(
        () => (target ? rolesFromTable(lookupNow(), target.metamodelId, roles) : new Map<string, string>()),
        [target, roles],
    );

    if (!target) return null;

    const onNotation = (n: DerivedNotationId) => {
        const prefill = dialogPrefill(lookupNow(), target.metamodelId, n, target.viewpointIds);
        setNotation(n);
        setRoles(prefill.roles);
        setFrom(prefill.from);
    };
    const onRole = (classId: string, role: NotationRoleId | '') => setRoles(prev => {
        const next: Record<string, NotationRoleId> = { ...prev };
        if (role) next[classId] = role; else delete next[classId];
        return next;
    });
    const confirm = () => {
        const choice = { notation, classRoles: roles };
        if (!canDerive(choice)) return;
        createDerivedViewpoint(target.metamodelId, choice);
        close();
    };

    return createPortal(
        <div
            className="sim-roles-modal-backdrop"
            role="presentation"
            ref={hostRef}
            onKeyDown={e => {
                e.stopPropagation();
                if (e.key === 'Escape') close();
                if (e.key === 'Enter' && !(e.target instanceof HTMLButtonElement)) { e.preventDefault(); confirm(); }
            }}
            onKeyUp={stop} onMouseDown={stop} onMouseUp={stop} onClick={stop} onDoubleClick={stop}
            onPointerDown={stop} onPointerUp={stop} onContextMenu={stop} onWheel={stop}
        >
            <DeriveViewpointForm
                metamodelName={target.name}
                classes={target.classes}
                notation={notation}
                roles={roles}
                effective={effective}
                prefillFrom={from}
                onNotation={onNotation}
                onRole={onRole}
                onCancel={close}
                onConfirm={confirm}
            />
        </div>,
        document.body,
    );
}

export default DeriveViewpointDialog;
