/**
 * The right pane of the Refactoring tab (P-2026-10-24-2320): a read-only view of the target
 * metamodel and, while previewing, the planned effects drawn on it, with the bar of chips,
 * the impact on conforming models, `Discard` and `Apply`.
 *
 * Boxes are plain HTML over an SVG of the generalizations; nothing here is a canvas node, a
 * D-object or a store write (R-JJD-2). Added classes and features are dashed cyan, removed ones
 * struck through in red, new generalizations dashed with a hollow triangle.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { EffectsPlan, PlanWorld } from '../../jjscript/executor/effectsPlanner';
import {
    columnsFor, effectChips, layoutView, metamodelView, modelImpact, type ViewClass,
} from './refactoringPreview';
import './RefactoringPreviewPane.scss';

export interface RefactoringPreviewPaneProps {
    world: PlanWorld | null;
    plan: EffectsPlan | null;
    previewing: boolean;
    /** The metamodel's name, for the pane's title. */
    metamodelName?: string;
    typeName: (id: string) => string | undefined;
}

const featureGlyph: Record<string, string> = { Attribute: 'a', Reference: 'r', Operation: 'o', Literal: 'l' };

function ClassBox({ c, style }: { c: ViewClass; style: React.CSSProperties }): JSX.Element {
    return (
        <div className={`rfa-box rfa-box--${c.status}${c.abstract ? ' rfa-box--abstract' : ''}`} style={style}
             data-class-id={c.id} data-status={c.status}>
            <div className="rfa-box__head" title={c.from ? `renamed from ${c.from}` : undefined}>
                {c.kind === 'Enumeration' && <span className="rfa-box__stereo">«enum»</span>}
                <span className="rfa-box__name">{c.name}</span>
            </div>
            <ul className="rfa-box__features">
                {c.features.map(f => (
                    <li key={f.id} className={`rfa-feature rfa-feature--${f.status}`} data-status={f.status}
                        title={f.from ? `renamed from ${f.from}` : undefined}>
                        <span className="rfa-feature__glyph" aria-hidden="true">{featureGlyph[f.kind]}</span>
                        <span className="rfa-feature__name">{f.name}</span>
                        {f.type && <span className="rfa-feature__type">: {f.type}</span>}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export const RefactoringPreviewPane: React.FC<RefactoringPreviewPaneProps> = ({ world, plan, previewing, metamodelName, typeName }) => {
    const hostRef = useRef<HTMLDivElement>(null);
    const [paneWidth, setPaneWidth] = useState(600);
    useEffect(() => {
        const el = hostRef.current;
        if (!el || typeof ResizeObserver === 'undefined') return;
        const ro = new ResizeObserver(entries => setPaneWidth(entries[0]?.contentRect.width || 600));
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const view = useMemo(
        () => (world ? metamodelView(world, previewing ? plan : null, typeName) : null),
        [world, plan, previewing, typeName]);
    const layout = useMemo(() => (view ? layoutView(view, columnsFor(paneWidth)) : null), [view, paneWidth]);
    const byId = useMemo(() => new Map((view?.classes || []).map(c => [c.id, c])), [view]);

    return (
        <div className="rfa-pane" data-previewing={previewing ? 'true' : 'false'}>
            <div className="rfa-pane__title">
                <span>{metamodelName || 'Metamodel'}</span>
                <span className="rfa-pane__mode">{previewing ? 'Preview' : 'Read-only'}</span>
            </div>
            <div className="rfa-pane__scroll" ref={hostRef}>
                {!layout || !layout.boxes.length ? (
                    <div className="rfa-pane__empty">{world ? 'This metamodel has no classes yet.' : 'No target selected.'}</div>
                ) : (
                    <div className="rfa-pane__canvas" style={{ width: layout.width, height: layout.height }}>
                        <svg className="rfa-pane__edges" width={layout.width} height={layout.height} aria-hidden="true">
                            <defs>
                                <marker id="rfa-tri" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="12" markerHeight="12" orient="auto-start-reverse" markerUnits="userSpaceOnUse">
                                    <path d="M1,1 L11,6 L1,11 Z" className="rfa-tri" />
                                </marker>
                                <marker id="rfa-tri-added" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="12" markerHeight="12" orient="auto-start-reverse" markerUnits="userSpaceOnUse">
                                    <path d="M1,1 L11,6 L1,11 Z" className="rfa-tri rfa-tri--added" />
                                </marker>
                            </defs>
                            {layout.edges.map(e => (
                                <line key={`${e.childId}->${e.parentId}`} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
                                      className={`rfa-edge rfa-edge--${e.status}`} data-status={e.status}
                                      markerEnd={e.status === 'added' ? 'url(#rfa-tri-added)' : 'url(#rfa-tri)'} />
                            ))}
                        </svg>
                        {layout.boxes.map(b => {
                            const c = byId.get(b.id);
                            return c ? <ClassBox key={b.id} c={c} style={{ left: b.x, top: b.y, width: b.width, minHeight: b.height }} /> : null;
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export interface RefactoringPreviewBarProps {
    plan: EffectsPlan;
    /** The conforming models of the target metamodel (an M2 Refactoring), for the impact line. */
    conformingModels: number;
    busy: boolean;
    /** The script changed after the plan: Apply waits for the re-plan. */
    stale?: boolean;
    onDiscard: () => void;
    onApply: () => void;
}

export const RefactoringPreviewBar: React.FC<RefactoringPreviewBarProps> = ({ plan, conformingModels, busy, stale, onDiscard, onApply }) => {
    const chips = effectChips(plan);
    const impact = modelImpact(plan);
    return (
        <div className="rfa-bar" role="toolbar" aria-label="Refactoring preview">
            <div className="rfa-bar__chips">
                {chips.length
                    ? chips.map(c => <span key={c.key} className={`rfa-chip rfa-chip--${c.tone}`}>{c.label}</span>)
                    : <span className="rfa-bar__none">No effect planned</span>}
            </div>
            <div className={`rfa-bar__impact${impact.length ? ' rfa-bar__impact--loss' : ''}`}>
                {impact.length
                    ? impact.join(' · ')
                    : conformingModels
                        ? `${conformingModels} conforming ${conformingModels === 1 ? 'model' : 'models'}, no slot value lost`
                        : 'No conforming model'}
            </div>
            <span className="rfa-bar__spacer" />
            <button type="button" className="script-tab__button" onClick={onDiscard} disabled={busy}>Discard</button>
            <button type="button" className="script-tab__button script-tab__button--primary script-tab__button--solid"
                    onClick={onApply} disabled={busy || stale || !chips.length}>
                {busy ? 'Applying…' : 'Apply'}
            </button>
        </div>
    );
};
