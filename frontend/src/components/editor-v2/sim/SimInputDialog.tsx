/**
 * SimInputDialog — the values of the inputs a press reads (R-SIM-88,
 * P-2026-09-28-0034, docs/discovery/discovery_2026-09-28_sim_input_variables.md §5.4).
 *
 * The panel opens it when ▶ or an event button reads an input of an enabled
 * transition (`pressInput` returns `asks`): one row per input, a control by
 * its domain (two chips for a boolean, a number field within the bounds of a
 * range, a select of the literals of an enumeration), none preselected. The
 * primary, named after the press, stays off until every row has a value;
 * Enter confirms then. Cancel, the close button and Escape leave the run as
 * it is (R-SIM-35).
 *
 * The shell is the Simulation roles dialog's (SimRolesModal.tsx): portaled
 * onto `document.body`, so nothing is added to the panel and nothing in it
 * moves (R-SIM-63, R-SIM-65, R-SIM-66); the same backdrop, header, footer and
 * buttons; keyboard and pointer events stopped at the root, so Backspace never
 * reaches the canvas. Smaller: SimInputDialog.scss.
 */

import { ReactElement, SyntheticEvent, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { inputValues } from './simInputs';
import type { InputDraft, InputRow } from './simInputs';
import type { InputValue } from './simBridge';
import './SimRolesModal.scss';
import './SimInputDialog.scss';

export interface SimInputDialogProps {
    /** The press: `Step (ε)` or the event's label, in the subtitle. */
    press: string;
    /** The primary button's text: `Step`, `Fire coin`. */
    action: string;
    rows: readonly InputRow[];
    onCancel: () => void;
    onConfirm: (values: InputValue[]) => void;
}

/** Stops a React event at the dialog: the portal still bubbles through the editor's React tree. */
const stop = (e: SyntheticEvent) => e.stopPropagation();

export function SimInputDialog({ press, action, rows, onCancel, onConfirm }: SimInputDialogProps): ReactElement {
    const [draft, setDraft] = useState<InputDraft>({});
    const dialogRef = useRef<HTMLDivElement>(null);
    const values = inputValues(rows, draft);
    const set = (key: string, text: string) => setDraft(d => ({ ...d, [key]: text }));
    const confirm = () => { if (values) onConfirm(values); };

    // Escape cancels with the focus outside the dialog too; the focus goes into the dialog on open.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onCancel]);
    useEffect(() => { dialogRef.current?.querySelector<HTMLElement>('button.sim-roles-modal__chip, input, select')?.focus(); }, []);

    const control = (r: InputRow): ReactElement => {
        const text = draft[r.key] ?? '';
        const aria = `Value of ${r.label}`;
        switch (r.domain.kind) {
            case 'boolean':
                return (
                    <div className="sim-input-dialog__chips" role="group" aria-label={aria}>
                        {['true', 'false'].map(v => (
                            <button
                                type="button"
                                key={v}
                                className={`sim-roles-modal__chip${text === v ? ' sim-roles-modal__chip--on' : ''}`}
                                aria-pressed={text === v}
                                onClick={() => set(r.key, v)}
                            >
                                {v}
                            </button>
                        ))}
                    </div>
                );
            case 'range':
                return (
                    <input
                        type="number"
                        className="sim-roles-modal__input sim-input-dialog__number"
                        aria-label={aria}
                        min={r.domain.min}
                        max={r.domain.max}
                        step={1}
                        placeholder={`${r.domain.min}..${r.domain.max}`}
                        value={text}
                        onChange={e => set(r.key, e.target.value)}
                    />
                );
            case 'enum':
                return (
                    <select className="sim-roles-modal__select" aria-label={aria} value={text} onChange={e => set(r.key, e.target.value)}>
                        <option value="" disabled>choose</option>
                        {r.domain.literals.map(l => <option value={l} key={l}>{l}</option>)}
                    </select>
                );
        }
    };

    return createPortal(
        <div
            className="sim-roles-modal-backdrop"
            role="presentation"
            onKeyDown={e => {
                e.stopPropagation();
                if (e.key === 'Escape') onCancel();
                if (e.key === 'Enter' && values) { e.preventDefault(); confirm(); }
            }}
            onKeyUp={stop} onMouseDown={stop} onMouseUp={stop} onClick={stop} onDoubleClick={stop}
            onPointerDown={stop} onPointerUp={stop} onContextMenu={stop} onWheel={stop}
        >
            <div className="sim-roles-modal sim-input-dialog" role="dialog" aria-modal="true" aria-labelledby="sim-input-dialog-title" tabIndex={-1} ref={dialogRef}>
                <div className="sim-roles-modal__header">
                    <div className="sim-roles-modal__title-row">
                        <h2 className="sim-roles-modal__title" id="sim-input-dialog-title">{rows.length === 1 ? 'Input' : 'Inputs'}</h2>
                        <button type="button" className="sim-roles-modal__close" title="Cancel" aria-label="Cancel" onClick={onCancel}>
                            <i className="bi bi-x-lg" />
                        </button>
                    </div>
                    <span className="sim-roles-modal__subtitle">{`${press} reads ${rows.length === 1 ? 'this value' : 'these values'}.`}</span>
                </div>
                <div className="sim-roles-modal__body">
                    {rows.map(r => (
                        <div className="sim-input-dialog__row" key={r.key}>
                            <span className="sim-input-dialog__label" title={r.label}>{r.label}</span>
                            {control(r)}
                        </div>
                    ))}
                </div>
                <div className="sim-roles-modal__footer">
                    <div className="sim-roles-modal__actions sim-roles-modal__actions--end">
                        <button type="button" className="sim-roles-modal__btn sim-roles-modal__btn--secondary" onClick={onCancel}>Cancel</button>
                        <button
                            type="button"
                            className="sim-roles-modal__btn sim-roles-modal__btn--primary"
                            disabled={!values}
                            title={values ? `${action} with these values` : 'Give every value first'}
                            onClick={confirm}
                        >
                            {action}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body,
    );
}

export default SimInputDialog;
