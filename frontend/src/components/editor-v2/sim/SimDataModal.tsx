/**
 * SimDataModal — the «Data» dialog of the M1 face: the globals of one model
 * (R-SIM-94, P-2026-09-29-0110, docs/discovery/discovery_2026-09-29_sim_data_level.md §5).
 *
 * The model carries its own `simStateAttributes` key, with the record form of
 * R-SIM-67; the run merges it over the metamodel's (`mergeDeclarations`): a
 * global declared here overrides the metamodel's global of the same name, and
 * a global declared in the metamodel is the default of every model that
 * declares none. A model declares globals only: the table is the metamodel's
 * (`Declarations`, SimRolesModal.tsx) with its metaclass select fixed to Global.
 *
 * A draft over the model's key: Add attribute, the undeclared names of the
 * Reset line (added as rows when the dialog opens from them), the rows as
 * edited. Apply writes the key in one `state` assignment (`modelDataPatch`),
 * one undo step; it moves `runSignature`, so a run of the model is
 * interrupted. Cancel, the close button and Escape discard the draft.
 *
 * Portaled onto `document.body` as the roles dialog is, with its classes
 * (SimRolesModal.scss), and it stops keyboard and pointer events at its root
 * for the same reason: the editor's own handlers would otherwise receive them.
 */

import { ReactElement, SyntheticEvent, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LPointerTargetable } from '../../../joiner';
import { stateAttributeRows } from '../../../model/simulation/stateAttributesCodec';
import { modelDataPatch, modelDataRows, newGlobalRow } from './simBridge';
import { Declarations } from './SimRolesModal';
import type { StateAttributeRecord } from '../../../model/simulation/stateAttributesCodec';
import './SimRolesModal.scss';

export interface SimDataModalProps {
    /** The M1 model whose bag holds its globals. */
    modelId: string;
    /** Its name, for the title; '' when unknown. */
    modelName: string;
    /** The raw `simStateAttributes` of the model's bag, `null` when unset. */
    stateAttributesRaw: string | null;
    /** The undeclared names of the Reset line the dialog was opened from, added as rows; empty from the entry. */
    undeclared: readonly string[];
    onClose: () => void;
    onApplied: () => void;
}

/** Stops a React event at the dialog: the portal still bubbles through the editor's React tree. */
const stop = (e: SyntheticEvent) => e.stopPropagation();

export function SimDataModal(props: SimDataModalProps): ReactElement {
    const { modelId, modelName, stateAttributesRaw, undeclared, onClose, onApplied } = props;

    const stored = useMemo(() => stateAttributeRows(stateAttributesRaw ?? undefined), [stateAttributesRaw]);
    // The names of the Reset line are a draft from the start: Apply writes them, Cancel drops them.
    const [draft, setDraft] = useState<StateAttributeRecord[] | null>(() => {
        const opened = modelDataRows(stored.rows, undeclared);
        return opened.length > stored.rows.length ? opened : null;
    });
    const [focusRow, setFocusRow] = useState<number | null>(() => (draft ? stored.rows.length : null));
    const rows = draft ?? stored.rows;
    const dialogRef = useRef<HTMLDivElement>(null);
    const addRef = useRef<HTMLButtonElement>(null);

    // Escape closes without writing: from inside, the root's onKeyDown; with the focus outside, this listener.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);
    // Opened from the entry, Add attribute takes the focus; from the Reset line, the first added row (Declarations).
    useEffect(() => {
        if (draft) return;
        if (addRef.current) addRef.current.focus(); else dialogRef.current?.focus();
        // Once, on open.
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const add = (): void => {
        const next = [...rows, newGlobalRow(rows)];
        setDraft(next);
        setFocusRow(next.length - 1);
    };

    const apply = (): void => {
        const lmodel: any = LPointerTargetable.fromPointer(modelId as any);
        if (!lmodel || draft === null) return;
        lmodel.state = modelDataPatch(draft);
        onApplied();
    };

    const title = modelName ? `Data of ${modelName}` : 'Data';

    return createPortal(
        <div
            className="sim-roles-modal-backdrop"
            role="presentation"
            onKeyDown={e => { e.stopPropagation(); if (e.key === 'Escape') onClose(); }} onKeyUp={stop} onMouseDown={stop} onMouseUp={stop} onClick={stop} onDoubleClick={stop}
            onPointerDown={stop} onPointerUp={stop} onContextMenu={stop} onWheel={stop}
        >
            <div className="sim-roles-modal" role="dialog" aria-modal="true" aria-labelledby="sim-data-modal-title" tabIndex={-1} ref={dialogRef}>
                <div className="sim-roles-modal__header">
                    <div className="sim-roles-modal__title-row">
                        <h2 className="sim-roles-modal__title" id="sim-data-modal-title">{title}</h2>
                        <button type="button" className="sim-roles-modal__close" title="Close" aria-label="Close" onClick={onClose}>
                            <i className="bi bi-x-lg" />
                        </button>
                    </div>
                    <span className="sim-roles-modal__subtitle">
                        The globals of this model. One declared here overrides the metamodel&apos;s of the same name.
                    </span>
                </div>
                <div className="sim-roles-modal__body">
                    <div className="sim-roles-modal__data">
                        <div className="sim-roles-modal__data-head">
                            <div className="sim-roles-modal__section">
                                <i className="bi bi-database" />
                                Globals<span className="sim-roles-modal__count">{rows.length}</span>
                            </div>
                            <span className="sim-roles-modal__data-note">read as model.[name]</span>
                            <button type="button" className="sim-roles-modal__btn sim-roles-modal__btn--outline sim-roles-modal__add" ref={addRef} onClick={add}>
                                <i className="bi bi-plus-lg" />
                                Add attribute
                            </button>
                        </div>
                        {!stored.readable && draft === null && (
                            <div className="sim-roles-modal__warning">The stored declarations are not readable. Adding an attribute replaces them.</div>
                        )}
                        <Declarations rows={rows} classes={[]} onChange={setDraft} focusRow={focusRow} onFocused={() => setFocusRow(null)} globalsOnly />
                    </div>
                </div>
                <div className="sim-roles-modal__footer">
                    <span className="sim-roles-modal__note">A metaclass attribute is declared in the metamodel.</span>
                    <div className="sim-roles-modal__actions sim-roles-modal__actions--end">
                        <button type="button" className="sim-roles-modal__btn sim-roles-modal__btn--secondary" onClick={onClose}>Cancel</button>
                        <button
                            type="button"
                            className="sim-roles-modal__btn sim-roles-modal__btn--primary"
                            disabled={draft === null}
                            title={draft === null ? 'Nothing to write' : 'Write the globals in one step; one undo reverts it. A run of this model is interrupted.'}
                            onClick={apply}
                        >
                            Apply
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body,
    );
}

export default SimDataModal;
