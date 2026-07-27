import React, { useEffect, useMemo, useRef, useState } from 'react';
import { LProject, LPointerTargetable, DClass, type LViewElement } from '../../../../joiner';
import {
    Select,
    NumberInput,
    Checkbox,
    ColorPicker,
    ConditionalEditor,
    HelpText,
    ErrorText,
    Button,
    PredicateBuilder,
    forPredicateKind,
    type PathBuilderFeatures,
} from '../../../ui';
import { getMetaclassInfo, type MetaclassInfo } from '../../hooks/useEditorMode';
import { validateIR } from '../ir/irValidate';
import { defaultEdgeViewIR } from '../ir/irDefaults';
import type { EdgeViewIR, TextSource, EdgeTermination } from '../ir/irTypes';
import { TextSourceEditor } from './TextSourceEditor';

export interface EdgeAuthoringPanelProps {
    view: LViewElement;
}

const COMMIT_DEBOUNCE_MS = 300;
const FEATURES_HINT = 'imposta una metaclasse sorgente per abilitare i path sulle feature';

const LINE_STYLE_OPTIONS = [
    { value: 'solid', label: 'Solid' },
    { value: 'dashed', label: 'Dashed' },
    { value: 'dotted', label: 'Dotted' },
];
const TERMINATION_OPTIONS = [
    { value: 'none', label: 'None' },
    { value: 'openArrow', label: 'Open arrow' },
    { value: 'closedArrow', label: 'Closed arrow' },
    { value: 'hollowTriangle', label: 'Hollow triangle' },
    { value: 'filledDiamond', label: 'Filled diamond' },
    { value: 'hollowDiamond', label: 'Hollow diamond' },
];

/** Lossless deep clone for plain IR objects (pure JSON: no functions/dates). */
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
/** New label-center default: a blank literal (mirrors the row template default). */
const newCenterSource = (): TextSource => ({ from: 'literal', text: '' });

/**
 * EdgeAuthoringPanel — authors the IR of a selected reference-as-edge view
 * (kind `edge`, reference substrate). Styles the RF edges derived from M1
 * references whose SOURCE object matches `metaclasses` (+ optional `reference`).
 *
 * The edit cycle mirrors RowAuthoringPanel exactly — a deep-cloned draft is
 * patched immutably; on each user edit it is validated eagerly (inline ErrorText)
 * and, when valid, committed after a debounce via `view.ir = draft` (whole-object
 * replace → recompile → live preview through UnifiedEdge's gated branch, E0).
 * Fields not touched here (object-as-edge source/target, routing, persistWaypoints)
 * round-trip verbatim because the whole cloned ir is written back.
 *
 * Matching is authored inline (source metaclass / reference / predicate / priority)
 * rather than through MatchingSection, which is typed `VertexViewIR`, carries
 * `exclusive`, and does not know `reference`. The predicate roots on the SOURCE
 * object (ratifica R-1): no dedicated target UI. `exclusive` is omitted (R-5).
 */
export const EdgeAuthoringPanel: React.FC<EdgeAuthoringPanelProps> = ({ view }) => {
    const seed = (): EdgeViewIR => clone((view as any).ir ?? defaultEdgeViewIR());

    const [draft, setDraft] = useState<EdgeViewIR>(seed);
    const [error, setError] = useState<string | null>(null);
    const dirtyRef = useRef(false);

    // Reset the draft when the selected view changes (no commit on reset).
    useEffect(() => {
        dirtyRef.current = false;
        setDraft(seed());
        setError(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [view.id]);

    // Eager validate + debounced immutable commit — only on genuine user edits.
    useEffect(() => {
        if (!dirtyRef.current) return;
        const v = validateIR(view.id, draft);
        setError(v.ok ? null : v.error);
        if (!v.ok) return;
        const t = setTimeout(() => {
            (view as any).ir = draft;
        }, COMMIT_DEBOUNCE_MS);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [draft, view.id]);

    const patch = (next: EdgeViewIR) => {
        dirtyRef.current = true;
        setDraft(next);
    };

    // Resolve the PathBuilder feature set from the edge view's first (source)
    // metaclass — same identity-first resolution as RowAuthoringPanel (a project
    // may hold duplicate metamodels whose classes share a name; the view pins the
    // exact class via appliableToClasses, and we count how many metamodels declare
    // the name to surface the ambiguity). `references` also populate the reference
    // picker below.
    const featureInfo = useMemo<{
        features: PathBuilderFeatures | null;
        metamodelsWithClass: number;
        targetName: string | null;
    }>(() => {
        const mcs = draft.metaclasses;
        if (mcs === '*' || !Array.isArray(mcs) || mcs.length === 0) {
            return { features: null, metamodelsWithClass: 0, targetName: null };
        }
        const targetName = mcs[0];

        let targetId: string | null = null;
        for (const entry of (((view as any).appliableToClasses ?? []) as string[])) {
            try {
                const l = LPointerTargetable.fromPointer(entry) as any;
                if (l && l.className === DClass.cname && l.name === targetName) { targetId = l.id; break; }
            } catch { /* malformed / unresolvable entry — skip */ }
        }

        const metamodels = LProject.getProject()?.metamodels ?? [];
        let metamodelsWithClass = 0;
        let byId: MetaclassInfo | null = null;
        let byNameFallback: MetaclassInfo | null = null;
        for (const mm of metamodels) {
            let info;
            try { info = getMetaclassInfo((mm as any).id, (mm as any).id); } catch { continue; }
            const named = info.allClasses.find((c) => c.name === targetName);
            if (!named) continue;
            metamodelsWithClass++;
            if (!byNameFallback) byNameFallback = named;
            if (targetId) {
                const exact = info.allClasses.find((c) => c.id === targetId);
                if (exact) byId = exact;
            }
        }

        const target = byId ?? byNameFallback;
        if (!target) return { features: null, metamodelsWithClass, targetName };
        return {
            features: {
                attributes: (target.allAttributes ?? target.attributes ?? []).map((a) => ({
                    name: a.name, type: a.type, upperBound: a.upperBound,
                })),
                references: (target.references ?? []).map((r) => ({
                    name: r.name, targetClassName: r.targetClassName, upperBound: r.upperBound,
                })),
            },
            metamodelsWithClass,
            targetName,
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(draft.metaclasses), JSON.stringify((view as any).appliableToClasses ?? []), view.id]);

    const features = featureInfo.features;

    // All class names across every project metamodel (deduped) — offered to the
    // PredicateBuilder `isKind` selector. The project class set does not change
    // during a panel editing session, so it is computed once.
    const classNames = useMemo<string[]>(() => {
        const metamodels = LProject.getProject()?.metamodels ?? [];
        const names = new Set<string>();
        for (const mm of metamodels) {
            let info;
            try { info = getMetaclassInfo((mm as any).id, (mm as any).id); } catch { continue; }
            for (const c of info.allClasses) names.add(c.name);
        }
        return Array.from(names);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --- matching (source metaclass) ---
    const mcs = draft.metaclasses;
    const isWildcard = mcs === '*';
    const list = Array.isArray(mcs) ? mcs : [];
    const available = classNames.filter((n) => !list.includes(n));
    const setWildcard = (checked: boolean) => patch({ ...draft, metaclasses: checked ? '*' : [] });
    const removeMetaclass = (idx: number) => patch({ ...draft, metaclasses: list.filter((_, i) => i !== idx) });
    const addMetaclass = (name: string) => {
        if (!name || list.includes(name)) return;
        patch({ ...draft, metaclasses: [...list, name] });
    };

    // --- matching (reference) ---
    // The picker offers the source metaclass's references; the empty option drops
    // the KEY (not `reference: undefined`) so the ir is byte-identical to a view
    // authored without a reference restriction (= matches any reference).
    const refNames = features?.references?.map((r) => r.name) ?? [];
    const refOptions = [
        { value: '', label: '(qualsiasi reference)' },
        ...refNames.map((n) => ({ value: n, label: n })),
        ...(draft.reference && !refNames.includes(draft.reference)
            ? [{ value: draft.reference, label: `${draft.reference} (non risolta)` }]
            : []),
    ];
    const setReference = (name: string) => {
        if (!name) {
            const { reference, ...rest } = draft;
            patch(rest as EdgeViewIR);
        } else {
            patch({ ...draft, reference: name });
        }
    };

    // --- matching (predicate) ---
    const hasPredicate = draft.predicate !== undefined;
    const setHasPredicate = (checked: boolean) => {
        if (checked) {
            patch({ ...draft, predicate: forPredicateKind('literal') });
        } else {
            // Drop the KEY (not `predicate: undefined`) — keeps the ir byte-identical
            // to a view authored without any predicate.
            const { predicate, ...rest } = draft;
            patch(rest as EdgeViewIR);
        }
    };

    // --- edge style patch helpers ---
    const line = draft.edge.line ?? {};
    const srcEnd = draft.edge.terminations?.sourceEnd ?? 'none';
    const tgtEnd = draft.edge.terminations?.targetEnd ?? 'openArrow';

    const patchEdge = (partial: Partial<EdgeViewIR['edge']>) =>
        patch({ ...draft, edge: { ...draft.edge, ...partial } });
    const patchLine = (partial: Partial<NonNullable<EdgeViewIR['edge']['line']>>) =>
        patchEdge({ line: { ...draft.edge.line, ...partial } });
    const patchTerminations = (partial: Partial<NonNullable<EdgeViewIR['edge']['terminations']>>) =>
        patchEdge({ terminations: { ...draft.edge.terminations, ...partial } });

    // --- label center ---
    const hasCenterLabel = draft.edge.labels?.center !== undefined;
    const setHasCenterLabel = (checked: boolean) => {
        if (checked) {
            patchEdge({ labels: { ...draft.edge.labels, center: newCenterSource() } });
        } else {
            // Drop `center`; if `labels` is left empty drop the whole key too, so the
            // ir is byte-identical to a view authored without a center label. A
            // `placement` (not authored here) survives.
            const labels = { ...draft.edge.labels };
            delete labels.center;
            if (Object.keys(labels).length === 0) {
                const edge = { ...draft.edge };
                delete edge.labels;
                patch({ ...draft, edge });
            } else {
                patchEdge({ labels });
            }
        }
    };

    return (
        <section className="properties-tab properties-panel">
            <div className="jj-field-label" style={{ marginTop: 4 }}>IR Edge view authoring</div>
            <HelpText>Una edge view di tipo reference stila gli edge derivati dalle reference M1 il cui oggetto SORGENTE corrisponde alla metaclasse (ed eventuale reference) qui sotto.</HelpText>

            {error && <ErrorText>{error}</ErrorText>}

            {featureInfo.metamodelsWithClass > 1 && (
                <ErrorText>
                    {`La metaclasse «${featureInfo.targetName}» è dichiarata in ${featureInfo.metamodelsWithClass} metamodelli del progetto: il picker usa quella a cui è applicata questa view. Verifica che i metamodelli non siano duplicati.`}
                </ErrorText>
            )}

            {/* Matching — source metaclass */}
            <div className="jj-field-label" style={{ marginTop: 8 }}>Matching</div>
            <div className="jj-field" style={{ marginTop: 4 }}>
                <label className="jj-field-label">Metaclasse sorgente</label>
                <Checkbox
                    checked={isWildcard}
                    onChange={setWildcard}
                    label="Tutte le metaclassi (*)"
                />
                {!isWildcard && (
                    <>
                        {list.map((name, idx) => (
                            <div
                                key={name}
                                style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-1)', marginTop: 4 }}
                            >
                                <span style={{ flex: 1 }}>{name}</span>
                                <Button variant="ghost" size="sm" onClick={() => removeMetaclass(idx)} title="Rimuovi">
                                    <i className="bi bi-x" aria-hidden="true" />
                                </Button>
                            </div>
                        ))}
                        {list.length === 0 && (
                            <HelpText>Con la lista vuota la edge view non si applica a nessuna reference.</HelpText>
                        )}
                        <div style={{ marginTop: 4 }}>
                            <Select
                                options={available.map((n) => ({ value: n, label: n }))}
                                value=""
                                placeholder="Aggiungi metaclasse…"
                                onChange={(e) => addMetaclass(e.target.value)}
                            />
                        </div>
                    </>
                )}
                <HelpText>Le reference e le feature del PathBuilder si risolvono dalla prima metaclasse della lista.</HelpText>
            </div>

            {/* Matching — reference */}
            <div className="jj-field" style={{ marginTop: 8 }}>
                <label className="jj-field-label">Reference</label>
                <Select
                    options={refOptions}
                    value={draft.reference ?? ''}
                    onChange={(e) => setReference(e.target.value)}
                />
                <HelpText>Una reference specifica ha priorità sulle view che matchano qualsiasi reference. Con metaclasse sorgente wildcard o assente il picker resta vuoto.</HelpText>
            </div>

            {/* Matching — predicate */}
            <div className="jj-field" style={{ marginTop: 8 }}>
                <label className="jj-field-label">Condizione</label>
                <Checkbox
                    checked={hasPredicate}
                    onChange={setHasPredicate}
                    label="Applica solo se (predicate)"
                />
                {draft.predicate !== undefined && (
                    <div style={{ marginTop: 4 }}>
                        <PredicateBuilder
                            value={draft.predicate}
                            onChange={(next) => patch({ ...draft, predicate: next })}
                            features={features}
                            featuresHint={FEATURES_HINT}
                            classNames={classNames}
                        />
                    </div>
                )}
                {!hasPredicate && (
                    <HelpText>Il predicate è valutato sull'oggetto sorgente della reference.</HelpText>
                )}
            </div>

            {/* Matching — priority */}
            <div className="jj-field" style={{ marginTop: 8 }}>
                <label className="jj-field-label">Priorità</label>
                <NumberInput
                    value={draft.priority ?? 0}
                    onChange={(n) => patch({ ...draft, priority: n })}
                />
                <HelpText>Vince la priorità più alta; a parità, la specificità (esatta &gt; ereditata &gt; wildcard), poi l'ordine di dichiarazione.</HelpText>
            </div>

            {/* Line style */}
            <div className="jj-field-label" style={{ marginTop: 8 }}>Linea</div>
            <div className="jj-field" style={{ marginTop: 4 }}>
                <label className="jj-field-label">Colore</label>
                <ConditionalEditor
                    value={line.color}
                    onChange={(next) => patchLine({ color: next })}
                    renderValue={(v, onCh) => <ColorPicker value={v} onChange={onCh} />}
                    defaultValue={''}
                    features={features}
                    featuresHint={FEATURES_HINT}
                    classNames={classNames}
                />
            </div>
            <div className="jj-field" style={{ marginTop: 8 }}>
                <label className="jj-field-label">Spessore</label>
                <ConditionalEditor<number>
                    value={line.width}
                    onChange={(next) => patchLine({ width: next })}
                    renderValue={(v, onCh) => <NumberInput value={v} min={0} onChange={onCh} />}
                    defaultValue={1}
                    features={features}
                    featuresHint={FEATURES_HINT}
                    classNames={classNames}
                />
            </div>
            <div className="jj-field" style={{ marginTop: 8 }}>
                <label className="jj-field-label">Tratto</label>
                <ConditionalEditor<'solid' | 'dashed' | 'dotted'>
                    value={line.style}
                    onChange={(next) => patchLine({ style: next })}
                    renderValue={(v, onCh) => (
                        <Select
                            options={LINE_STYLE_OPTIONS}
                            value={v}
                            onChange={(e) => onCh(e.target.value as 'solid' | 'dashed' | 'dotted')}
                        />
                    )}
                    defaultValue={'solid'}
                    features={features}
                    featuresHint={FEATURES_HINT}
                    classNames={classNames}
                />
            </div>

            {/* Terminations */}
            <div className="jj-field-label" style={{ marginTop: 8 }}>Terminazioni</div>
            <div className="jj-field" style={{ marginTop: 4 }}>
                <label className="jj-field-label">Sorgente</label>
                <Select
                    options={TERMINATION_OPTIONS}
                    value={srcEnd}
                    onChange={(e) => patchTerminations({ sourceEnd: e.target.value as EdgeTermination })}
                />
            </div>
            <div className="jj-field" style={{ marginTop: 8 }}>
                <label className="jj-field-label">Destinazione</label>
                <Select
                    options={TERMINATION_OPTIONS}
                    value={tgtEnd}
                    onChange={(e) => patchTerminations({ targetEnd: e.target.value as EdgeTermination })}
                />
            </div>

            {/* Label center */}
            <div className="jj-field-label" style={{ marginTop: 8 }}>Label</div>
            <div className="jj-field" style={{ marginTop: 4 }}>
                <Checkbox
                    checked={hasCenterLabel}
                    onChange={setHasCenterLabel}
                    label="Label al centro"
                />
                {draft.edge.labels?.center !== undefined && (
                    <div style={{ marginTop: 4 }}>
                        <TextSourceEditor
                            source={draft.edge.labels.center}
                            features={features}
                            disabledHint={FEATURES_HINT}
                            onChange={(s) => patchEdge({ labels: { ...draft.edge.labels, center: s } })}
                        />
                    </div>
                )}
                {!hasCenterLabel && (
                    <HelpText>Senza label l'edge mantiene l'etichetta di default (nome della reference).</HelpText>
                )}
            </div>
        </section>
    );
};

export default EdgeAuthoringPanel;
