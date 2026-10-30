/**
 * JjEL live result (slice S3c, P-2026-10-24-0241, R-JJD-3).
 *
 * Shown above the composer in JjEL mode. The last submitted expression is re-evaluated
 * whenever the canvas selection changes (`JjodelEvents.CANVAS_SELECTION_CHANGED`),
 * 150 ms after the selection settles, each round bounded by the S3a deadline. Pin
 * freezes the target set until unpinned. One target: value and type; several: a
 * two-column list. Previous evaluations stay above, last six, newest at the bottom.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { JjodelEvents } from '../../events/registry';
import type { CanvasSelectionDetail } from '../editor-v2/utils/canvasSelection';
import { store } from '../../joiner';
import { evaluateJjelLive } from './jodieJjelContext';
import type { JjelLiveRow, JjelLiveTarget } from './jodieJjelContext';
import './JjelLiveResult.scss';

/** Delay after the last selection change before re-evaluating. */
export const JJEL_LIVE_DEBOUNCE_MS = 150;
/** Previous evaluations kept above the result block. */
export const JJEL_LIVE_HISTORY_MAX = 6;

export interface JjelLiveSubmission {
    expression: string;
    /** Changes on every submit, so the same expression re-evaluates. */
    nonce: number;
}

export interface JjelLiveResultProps {
    submission: JjelLiveSubmission | null;
}

interface LiveEvaluation {
    expression: string;
    rows: JjelLiveRow[];
}

interface HistoryItem {
    id: number;
    expression: string;
    path: string;
    value: string;
}

/** The current single selection, the target before any canvas event arrives. */
function readLastSelected(): JjelLiveTarget[] {
    try {
        const sel: any = (store.getState() as any)?._lastSelected;
        const elementId = typeof sel?.modelElement === 'string' ? sel.modelElement : '';
        if (!elementId) return [];
        return [{ elementId, nodeId: typeof sel?.node === 'string' ? sel.node : undefined }];
    } catch {
        return [];
    }
}

/** Targets of a selection event: node ids pair with element ids only when they align. */
function targetsOf(detail: CanvasSelectionDetail): JjelLiveTarget[] {
    const aligned = detail.nodeIds.length === detail.elementIds.length;
    return detail.elementIds.map((elementId, i) => ({ elementId, nodeId: aligned ? detail.nodeIds[i] : undefined }));
}

function summaryPath(rows: JjelLiveRow[]): string {
    if (rows.length === 1) return rows[0].info?.path ?? 'no selection';
    return `${rows.length} elements`;
}

function summaryValue(rows: JjelLiveRow[]): string {
    return rows.map((r) => r.text).join(', ');
}

export function JjelLiveResult({ submission }: JjelLiveResultProps): JSX.Element | null {
    const [live, setLive] = useState<LiveEvaluation | null>(null);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [pinned, setPinned] = useState(false);
    const [evalCount, setEvalCount] = useState(0);

    const selectionRef = useRef<JjelLiveTarget[]>(readLastSelected());
    const pinnedTargetsRef = useRef<JjelLiveTarget[] | null>(null);
    const submissionRef = useRef<JjelLiveSubmission | null>(submission);
    const liveRef = useRef<LiveEvaluation | null>(null);
    const timerRef = useRef<number | null>(null);
    const historyIdRef = useRef(0);
    submissionRef.current = submission;

    const evaluate = useCallback((targets: JjelLiveTarget[]) => {
        const sub = submissionRef.current;
        if (!sub) return;
        const next: LiveEvaluation = { expression: sub.expression, rows: evaluateJjelLive(sub.expression, targets) };
        const prev = liveRef.current;
        if (prev) {
            const item: HistoryItem = {
                id: ++historyIdRef.current,
                expression: prev.expression,
                path: summaryPath(prev.rows),
                value: summaryValue(prev.rows),
            };
            setHistory((h) => [...h, item].slice(-JJEL_LIVE_HISTORY_MAX));
        }
        liveRef.current = next;
        setLive(next);
        setEvalCount((c) => c + 1);
    }, []);

    const currentTargets = useCallback(
        () => pinnedTargetsRef.current ?? selectionRef.current,
        [],
    );

    // A submit evaluates at once, on the pinned set or the current selection.
    useEffect(() => {
        if (!submission) return;
        evaluate(currentTargets());
    }, [submission?.nonce, evaluate, currentTargets]);

    // Selection changes: always tracked, re-evaluated only when not pinned.
    useEffect(() => {
        const onSelection = (e: Event) => {
            const detail = (e as CustomEvent<CanvasSelectionDetail>).detail;
            if (!detail || !Array.isArray(detail.elementIds)) return;
            selectionRef.current = targetsOf(detail);
            if (pinnedTargetsRef.current || !submissionRef.current) return;
            if (timerRef.current !== null) window.clearTimeout(timerRef.current);
            timerRef.current = window.setTimeout(() => {
                timerRef.current = null;
                if (!pinnedTargetsRef.current) evaluate(selectionRef.current);
            }, JJEL_LIVE_DEBOUNCE_MS);
        };
        window.addEventListener(JjodelEvents.CANVAS_SELECTION_CHANGED, onSelection);
        return () => {
            window.removeEventListener(JjodelEvents.CANVAS_SELECTION_CHANGED, onSelection);
            if (timerRef.current !== null) window.clearTimeout(timerRef.current);
        };
    }, [evaluate]);

    const togglePin = useCallback(() => {
        if (pinnedTargetsRef.current) {
            pinnedTargetsRef.current = null;
            setPinned(false);
            // Unpinned: catch up with the selection made while pinned.
            evaluate(selectionRef.current);
        } else {
            pinnedTargetsRef.current = (liveRef.current?.rows ?? [])
                .map((r) => r.target)
                .filter((t): t is JjelLiveTarget => t !== null);
            setPinned(true);
        }
    }, [evaluate]);

    if (!live && history.length === 0) return null;

    const rows = live?.rows ?? [];
    const single = rows.length === 1 ? rows[0] : null;
    const info = single?.info ?? null;

    return (
        <div className="jjel-live" data-eval-count={evalCount}>
            {history.length > 0 && (
                <ol className="jjel-live__history" aria-label="Previous evaluations">
                    {history.map((h) => (
                        <li key={h.id} className="jjel-live__history-row" title={`${h.expression} on ${h.path}: ${h.value}`}>
                            <span className="jjel-live__history-expr">{h.expression}</span>
                            <span className="jjel-live__history-on"> on </span>
                            <span className="jjel-live__history-path">{h.path}</span>
                            <span className="jjel-live__history-value">{h.value}</span>
                        </li>
                    ))}
                </ol>
            )}
            {live && (
                <div className="jjel-live__result">
                    <div className="jjel-live__target">
                        <span className="jjel-live__self">self</span>
                        {single && info && (
                            <>
                                <span className="jjel-live__badge">{info.level}</span>
                                <span className="jjel-live__kind">{info.kind}</span>
                                <span className="jjel-live__path" title={info.path}>{info.path}</span>
                            </>
                        )}
                        {single && !info && <span className="jjel-live__path">no selection</span>}
                        {!single && <span className="jjel-live__kind">{rows.length} elements</span>}
                        <span className="jjel-live__mode">{pinned ? 'pinned' : 'follows selection'}</span>
                        <button
                            type="button"
                            className="jjel-live__pin"
                            aria-pressed={pinned}
                            aria-label={pinned ? 'Unpin the target' : 'Pin the target'}
                            title={pinned ? 'Unpin: follow the canvas selection' : 'Pin: keep evaluating on these elements'}
                            onClick={togglePin}
                        >
                            <i className={`bi ${pinned ? 'bi-pin-angle-fill' : 'bi-pin-angle'}`} aria-hidden="true" />
                        </button>
                    </div>
                    {single ? (
                        <div className={`jjel-live__value-line jjel-live__value-line--${single.status}`}>
                            <span className="jjel-live__value">{single.text}</span>
                            {single.type && <span className="jjel-live__type">{single.type}</span>}
                        </div>
                    ) : (
                        <ul className="jjel-live__list">
                            {rows.map((r, i) => (
                                <li key={r.target?.elementId ?? i} className={`jjel-live__row jjel-live__row--${r.status}`}>
                                    <span className="jjel-live__row-path" title={r.info?.path}>{r.info?.path ?? 'no selection'}</span>
                                    <span className="jjel-live__row-value" title={r.type || undefined}>{r.text}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
