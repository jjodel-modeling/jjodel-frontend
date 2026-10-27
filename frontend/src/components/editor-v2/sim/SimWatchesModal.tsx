/**
 * SimWatchesModal — the «Invariants and breakpoints» dialog of the M1 face
 * (R-SIM-137; P-2026-10-05-1735, docs/discovery/discovery_2026-10-05_sim_watches_scenarios_coverage.md §2, W1, W4).
 *
 * Opened from an icon in the run inspector's header (SimInspector.tsx), which
 * exists before Reset and under every profile: State machine and Petri net have
 * no «State…» entry, and `X.[marked]` is what a watch reads there. The UI never
 * says «watch»: that word is the Watch rows' of R-SIM-104.
 *
 * A draft over the model's `runWatches` key (watchCodec.ts): add, rename, choose
 * the kind, edit the text, remove. Each row shows what its text fails to compile,
 * against the declarations as a run of the model reads them and without the run's
 * snapshot: a parse error, `node.[x]`, `event`, an input variable, a presentation
 * name, an undeclared name; with a run, what only the frozen M tells and a value
 * that is not a boolean show in the inspector, on the step shown. A name missing
 * or taken by an earlier row is the row's defect and keeps Apply off. Apply writes
 * the key alone in one `state` assignment (`watchesPatch`): one undo step, and no
 * run is interrupted, the key leaving `runSignature`; nothing is written when the
 * list is the stored one, or empty on a model without the key. Cancel, the close
 * button and Escape discard the draft.
 *
 * Portaled onto `document.body` with the roles dialog's classes (SimRolesModal.scss),
 * as SimDataModal is, and it stops keyboard and pointer events at its root for the
 * same reason; the row's grid is in SimInspector.scss, the sheet of the card that opens it.
 */

import { ReactElement, SyntheticEvent, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LPointerTargetable, store } from '../../../joiner';
import { decodeStateAttributes, mergeDeclarations, STATE_ATTRIBUTES_KEY } from '../../../model/simulation/stateAttributesCodec';
import { decodeWatches, WATCH_KINDS, watchesPatch } from '../../../model/simulation/watchCodec';
import type { WatchKind, WatchRecord } from '../../../model/simulation/watchCodec';
import { compileWatch } from '../../../model/simulation/watchEvaluator';
import type { OutputScope } from '../../../model/simulation/boardOutputs';
import { modelRunBag, runBag } from './simBridge';
import './SimRolesModal.scss';

export interface SimWatchesModalProps {
    /** The M1 model whose bag holds its invariants and breakpoints. */
    modelId: string;
    /** Its name, for the title; '' when unknown. */
    modelName: string;
    /** The raw `runWatches` of the model's bag, `null` when unset. */
    watchesRaw: string | null;
    onClose: () => void;
    onApplied: () => void;
}

/** Stops a React event at the dialog: the portal still bubbles through the editor's React tree. */
const stop = (e: SyntheticEvent) => e.stopPropagation();

const KIND_LABEL: Record<WatchKind, string> = { invariant: 'Invariant', breakpoint: 'Breakpoint' };

const KIND_TITLE: Record<WatchKind, string> = {
    invariant: 'Expected true on every configuration: Play stops when it is false',
    breakpoint: 'Of interest when true: Play stops when it is true',
};

/**
 * The scope a row compiles against, without a run: the model's declarations as its run reads them (R-SIM-94), the
 * metamodel's under the profile's off roles (R-SIM-78) with the model's globals over them. No snapshot, so nothing is
 * folded over M; that is the inspector's, on a run.
 */
function draftScope(lookup: Record<string, any>, modelId: string): OutputScope {
    const raw = lookup[lookup[modelId]?.instanceof]?._state;
    const text = (v: unknown): string | undefined => (v === undefined || v === null ? undefined : String(v));
    const metamodel = decodeStateAttributes(text(raw ? runBag(raw, lookup)[STATE_ATTRIBUTES_KEY] : undefined));
    const own = decodeStateAttributes(text(modelRunBag(lookup, modelId, raw)[STATE_ATTRIBUTES_KEY]));
    const attributes = mergeDeclarations(metamodel, own).decls;
    return { net: { modelId, attributes, declared: new Map(), places: new Set() } };
}

/** The first name `check1`, `check2`, … no row uses. */
function freshName(rows: readonly WatchRecord[]): string {
    for (let n = 1; ; n++) if (!rows.some(r => r.name === `check${n}`)) return `check${n}`;
}

export function SimWatchesModal(props: SimWatchesModalProps): ReactElement {
    const { modelId, modelName, watchesRaw, onClose, onApplied } = props;

    const stored = useMemo(() => decodeWatches(watchesRaw), [watchesRaw]);
    const [rows, setRows] = useState<WatchRecord[]>(() => stored.watches);
    const [focusRow, setFocusRow] = useState<number | null>(null);
    // The declarations, read once on open (the dialog is modal).
    const scope = useMemo(() => draftScope((store.getState() as any).idlookup ?? {}, modelId), [modelId]);
    const dialogRef = useRef<HTMLDivElement>(null);
    const addRef = useRef<HTMLButtonElement>(null);
    const textRefs = useRef<Array<HTMLInputElement | null>>([]);

    // Escape closes without writing: from inside, the root's onKeyDown; with the focus outside, this listener.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);
    useEffect(() => {
        if (addRef.current) addRef.current.focus(); else dialogRef.current?.focus();
        // Once, on open.
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
    // A row just added takes the focus on its expression.
    useEffect(() => {
        if (focusRow === null) return;
        textRefs.current[focusRow]?.focus();
        setFocusRow(null);
    }, [focusRow]);

    /** Per row, what is wrong with it: its name first, then what its text fails to compile; `null` when nothing. */
    const defects = useMemo(() => rows.map((row, i) => {
        if (row.name.trim() === '') return { short: 'No name.', detail: 'Name it: the hit line and the inspector show the name.', blocks: true };
        if (rows.slice(0, i).some(r => r.name === row.name)) {
            return { short: 'The name is taken by an earlier one.', detail: `Another row above is named ${row.name}: names are unique in the model.`, blocks: true };
        }
        const d = compileWatch(row, scope).output.defect;
        return d ? { short: d.short, detail: d.detail, blocks: false } : null;
    }), [rows, scope]);

    const patch = watchesPatch(watchesRaw, rows);
    const blocked = defects.some(d => d?.blocks === true);

    const edit = (i: number, change: Partial<WatchRecord>): void => {
        setRows(rows.map((r, k) => (k === i ? { ...r, ...change } : r)));
    };
    const add = (): void => {
        setRows([...rows, { name: freshName(rows), kind: 'invariant', text: '' }]);
        setFocusRow(rows.length);
    };
    const remove = (i: number): void => { setRows(rows.filter((_, k) => k !== i)); };

    const apply = (): void => {
        const lmodel: any = LPointerTargetable.fromPointer(modelId as any);
        if (!lmodel || patch === null || blocked) return;
        lmodel.state = patch;
        onApplied();
    };

    const title = modelName ? `Invariants and breakpoints of ${modelName}` : 'Invariants and breakpoints';

    return createPortal(
        <div
            className="sim-roles-modal-backdrop"
            role="presentation"
            onKeyDown={e => { e.stopPropagation(); if (e.key === 'Escape') onClose(); }} onKeyUp={stop} onMouseDown={stop} onMouseUp={stop} onClick={stop} onDoubleClick={stop}
            onPointerDown={stop} onPointerUp={stop} onContextMenu={stop} onWheel={stop}
        >
            <div className="sim-roles-modal sim-watches-modal" role="dialog" aria-modal="true" aria-labelledby="sim-watches-modal-title" tabIndex={-1} ref={dialogRef}>
                <div className="sim-roles-modal__header">
                    <div className="sim-roles-modal__title-row">
                        <h2 className="sim-roles-modal__title" id="sim-watches-modal-title">{title}</h2>
                        <button type="button" className="sim-roles-modal__close" title="Close" aria-label="Close" onClick={onClose}>
                            <i className="bi bi-x-lg" />
                        </button>
                    </div>
                    <span className="sim-roles-modal__subtitle">
                        Boolean expressions over σ, read after every step. Play stops where an invariant is false or a breakpoint is true.
                    </span>
                </div>
                <div className="sim-roles-modal__body">
                    <div className="sim-roles-modal__data-head">
                        <div className="sim-roles-modal__section">
                            <i className="bi bi-shield-check" />
                            Invariants and breakpoints<span className="sim-roles-modal__count">{rows.length}</span>
                        </div>
                        <span className="sim-roles-modal__data-note">model.[x], X.[marked], X.[tokens]</span>
                        <button type="button" className="sim-roles-modal__btn sim-roles-modal__btn--outline sim-roles-modal__add" ref={addRef} onClick={add}>
                            <i className="bi bi-plus-lg" />
                            Add
                        </button>
                    </div>
                    {!stored.readable && (
                        <div className="sim-roles-modal__warning">The stored invariants and breakpoints are not readable. Apply replaces them.</div>
                    )}
                    {stored.readable && stored.defects.length > 0 && (
                        <div className="sim-roles-modal__warning" title={stored.defects.map(d => d.message).join('\n')}>
                            {`${stored.defects.length} stored ${stored.defects.length === 1 ? 'entry is' : 'entries are'} not readable; Apply leaves ${stored.defects.length === 1 ? 'it' : 'them'} out.`}
                        </div>
                    )}
                    {rows.length === 0 ? (
                        <div className="sim-roles-modal__empty">None yet. Add one: model.[coins] &lt;= 3 as an invariant, p3.[marked] as a breakpoint.</div>
                    ) : rows.map((row, i) => {
                        const defect = defects[i];
                        return (
                            <div className="sim-watches-modal__row" key={i}>
                                <div className="sim-watches-modal__line">
                                    <input
                                        type="text"
                                        className="sim-roles-modal__input sim-watches-modal__name"
                                        aria-label="Name"
                                        value={row.name}
                                        spellCheck={false}
                                        onChange={e => edit(i, { name: e.target.value })}
                                    />
                                    <select
                                        className="sim-roles-modal__select"
                                        aria-label="Kind"
                                        title={KIND_TITLE[row.kind]}
                                        value={row.kind}
                                        onChange={e => edit(i, { kind: e.target.value as WatchKind })}
                                    >
                                        {WATCH_KINDS.map(k => <option value={k} key={k}>{KIND_LABEL[k]}</option>)}
                                    </select>
                                    <input
                                        type="text"
                                        className="sim-roles-modal__input sim-watches-modal__text"
                                        aria-label="Expression"
                                        placeholder="a boolean over σ"
                                        value={row.text}
                                        spellCheck={false}
                                        ref={el => { textRefs.current[i] = el; }}
                                        onChange={e => edit(i, { text: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        className="sim-roles-modal__icon-btn"
                                        title={`Remove ${row.name || 'this row'}`}
                                        aria-label={`Remove ${row.name || 'this row'}`}
                                        onClick={() => remove(i)}
                                    >
                                        <i className="bi bi-trash3" />
                                    </button>
                                </div>
                                <span
                                    className={`sim-roles-modal__help${defect ? ' sim-roles-modal__help--error' : ''}`}
                                    title={defect?.detail}
                                >
                                    {defect ? defect.short : ''}
                                </span>
                            </div>
                        );
                    })}
                </div>
                <div className="sim-roles-modal__footer">
                    <span className="sim-roles-modal__note">Saved with the model. A run goes on.</span>
                    <div className="sim-roles-modal__actions sim-roles-modal__actions--end">
                        <button type="button" className="sim-roles-modal__btn sim-roles-modal__btn--secondary" onClick={onClose}>Cancel</button>
                        <button
                            type="button"
                            className="sim-roles-modal__btn sim-roles-modal__btn--primary"
                            disabled={patch === null || blocked}
                            title={blocked ? 'Every row needs a name of its own' : patch === null ? 'Nothing to write' : 'Write the invariants and breakpoints in one step; one undo reverts it.'}
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

export default SimWatchesModal;
