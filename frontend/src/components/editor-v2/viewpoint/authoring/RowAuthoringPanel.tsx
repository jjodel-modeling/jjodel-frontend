import React, { useEffect, useMemo, useRef, useState } from 'react';
import { LProject, LPointerTargetable, DClass, type LViewElement } from '../../../../joiner';
import {
    Input,
    Select,
    NumberInput,
    Toggle,
    HelpText,
    ErrorText,
    Button,
    ListEditor,
    PredicateBuilder,
    ConditionalEditor,
    forPredicateKind,
    type PathBuilderFeatures,
} from '../../../ui';
import { getMetaclassInfo, type MetaclassInfo } from '../../hooks/useEditorMode';
import { validateIR } from '../ir/irValidate';
import { defaultRowViewIR } from '../ir/irDefaults';
import type { RowViewIR, TextSource } from '../ir/irTypes';
import { resolveMetaclassId, withMetaclassPins, type MetaclassRef } from '../ir/metaclassPin';
import { TextSourceEditor } from './TextSourceEditor';

export interface RowAuthoringPanelProps {
    view: LViewElement;
}

const COMMIT_DEBOUNCE_MS = 300;
const FEATURES_HINT = 'imposta una metaclasse per abilitare i path sulle feature';

/** Lossless deep clone for plain IR objects (pure JSON: no functions/dates). */
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
/** New template entry default: a blank literal (mirrors the label list default). */
const newTemplateSource = (): TextSource => ({ from: 'literal', text: '' });

/**
 * RowAuthoringPanel — authors the IR of a selected row view (kind `row`).
 *
 * A row view has no shape/badge/resize: it renders as an inline text row inside a
 * fieldCompartment whose source is `children` (dispatch-mode). The panel mirrors
 * VertexAuthoringPanel's edit cycle exactly — a deep-cloned draft is patched
 * immutably; on each user edit it is eagerly validated (inline ErrorText) and,
 * when valid, committed after a debounce via `view.ir = draft` (whole-object
 * replace → recompile → live preview). Fields not touched here (any Conditional,
 * an advanced predicate) round-trip verbatim because the whole cloned ir is
 * written back.
 *
 * Matching is authored inline (metaclasses / predicate / priority) rather than
 * through MatchingSection, which is typed `VertexViewIR` and carries `exclusive`
 * (absent on RowViewIR).
 */
export const RowAuthoringPanel: React.FC<RowAuthoringPanelProps> = ({ view }) => {
    const seed = (): RowViewIR => clone((view as any).ir ?? defaultRowViewIR());

    const [draft, setDraft] = useState<RowViewIR>(seed);
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

    // Identity universe for the metaclass pin, read once per mount: every class of
    // every project metamodel, in project iteration order. `classNames` below stays
    // the deduped NAME list the PredicateBuilder wants; this one keeps the pointer.
    const allClasses = useMemo<MetaclassRef[]>(() => {
        const metamodels = LProject.getProject()?.metamodels ?? [];
        const out: MetaclassRef[] = [];
        for (const mm of metamodels) {
            let info;
            try { info = getMetaclassInfo((mm as any).id, (mm as any).id); } catch { continue; }
            for (const c of info.allClasses) out.push({ id: c.id, name: c.name });
        }
        return out;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Legacy identity: the classes this view is applied to. appliableToClasses mixes
    // D-level type names with M2 class pointers (cf. EnableIRPanel), so only real
    // DClass entries qualify — the same filter the pin resolution ran inline before.
    const appliesToClasses = useMemo<MetaclassRef[]>(() => {
        const out: MetaclassRef[] = [];
        for (const entry of (((view as any).appliableToClasses ?? []) as string[])) {
            try {
                const l = LPointerTargetable.fromPointer(entry) as any;
                if (l && l.className === DClass.cname) out.push({ id: l.id, name: l.name });
            } catch { /* malformed / unresolvable entry — skip */ }
        }
        return out;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify((view as any).appliableToClasses ?? []), view.id]);

    const pinCtx = useMemo(
        () => ({ appliesTo: appliesToClasses, candidates: allClasses }),
        [appliesToClasses, allClasses],
    );

    // The pin map is reconciled inside the patch that moves `metaclasses`, never in
    // one of its own — same contract as the other two panels (ir/metaclassPin.ts).
    const patch = (next: RowViewIR) => {
        dirtyRef.current = true;
        setDraft(withMetaclassPins(draft, next, pinCtx));
    };

    // Resolve the PathBuilder feature set from the row view's first metaclass —
    // same identity-first resolution as VertexAuthoringPanel (a project may hold
    // duplicate metamodels whose classes share a name; the identity comes from the
    // ir's pin and, on views authored before it existed, from appliableToClasses,
    // and we count how many metamodels declare the name to surface the ambiguity).
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

        const targetId = resolveMetaclassId(targetName, {
            pins: draft.authoringMetaclassPins,
            appliesTo: appliesToClasses,
            candidates: allClasses,
        })?.id ?? null;

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
        // appliesToClasses is itself memoized on the stringified appliableToClasses,
        // so it carries the dependency this list used to spell out.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(draft.metaclasses), JSON.stringify(draft.authoringMetaclassPins ?? null), appliesToClasses, allClasses, view.id]);

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

    // --- matching (metaclasses) ---
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

    // --- matching (predicate) ---
    const hasPredicate = draft.predicate !== undefined;
    const setHasPredicate = (checked: boolean) => {
        if (checked) {
            patch({ ...draft, predicate: forPredicateKind('literal') });
        } else {
            // Drop the KEY (not `predicate: undefined`) — keeps the ir byte-identical
            // to a view authored without any predicate.
            const { predicate, ...rest } = draft;
            patch(rest as RowViewIR);
        }
    };

    // --- template ---
    const template = draft.template ?? [];
    const setTemplate = (next: TextSource[]) => patch({ ...draft, template: next });
    const removeSegment = (idx: number) => {
        const n = [...template];
        n.splice(idx, 1);
        setTemplate(n);
    };
    const moveSegment = (idx: number, delta: number) => {
        const j = idx + delta;
        if (j < 0 || j >= template.length) return;
        const n = [...template];
        [n[idx], n[j]] = [n[j], n[idx]];
        setTemplate(n);
    };
    const replaceSegment = (idx: number, seg: TextSource) => {
        const n = [...template];
        n[idx] = seg;
        setTemplate(n);
    };

    return (
        <section className="properties-tab properties-panel">
            <div className="jj-field-label" style={{ marginTop: 4 }}>IR Row view authoring</div>
            <HelpText>Una row view rende un child in composizione come riga di testo inline dentro un compartment con sorgente "children"; non ha shape, badge o resize.</HelpText>

            {error && <ErrorText>{error}</ErrorText>}

            {featureInfo.metamodelsWithClass > 1 && (
                <ErrorText>
                    {`La metaclasse «${featureInfo.targetName}» è dichiarata in ${featureInfo.metamodelsWithClass} metamodelli del progetto: il picker usa quella a cui è applicata questa view. Verifica che i metamodelli non siano duplicati.`}
                </ErrorText>
            )}

            {/* Matching — metaclasses */}
            <div className="jj-field-label" style={{ marginTop: 8 }}>Matching</div>
            <div className="jj-field" style={{ marginTop: 4 }}>
                <label className="jj-field-label">Metaclassi</label>
                <Toggle
                    checked={isWildcard}
                    onChange={setWildcard}
                    label="Tutte le metaclassi (*)"
                    size="xs"
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
                            <HelpText>Con la lista vuota la row view non si applica a nessun child.</HelpText>
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
                <HelpText>Le feature del PathBuilder si risolvono dalla prima metaclasse della lista.</HelpText>
            </div>

            {/* Matching — predicate */}
            <div className="jj-field" style={{ marginTop: 8 }}>
                <label className="jj-field-label">Condizione</label>
                <Toggle
                    checked={hasPredicate}
                    onChange={setHasPredicate}
                    label="Applica solo se (predicate)"
                    size="xs"
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
                    <HelpText>Senza predicate la row view si applica a ogni child delle metaclassi selezionate.</HelpText>
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

            {/* Template — the inline text of the row */}
            <div className="jj-field-label" style={{ marginTop: 8 }}>Template</div>
            <ListEditor<TextSource>
                items={template}
                onRemove={removeSegment}
                onMove={moveSegment}
                onAdd={() => setTemplate([...template, newTemplateSource()])}
                addLabel="Add segment"
                emptyHint="No segments — a row must render at least one segment."
                itemLabel={(seg, i) => `Segment #${i + 1} — ${seg.from}`}
                renderItem={(seg, i) => (
                    <TextSourceEditor
                        source={seg}
                        features={features}
                        disabledHint={FEATURES_HINT}
                        onChange={(s) => replaceSegment(i, s)}
                    />
                )}
            />

            {/* Visible — only edited when already present (never seeded here → verbatim). */}
            {draft.visible !== undefined && (
                <div className="jj-field" style={{ marginTop: 8 }}>
                    <label className="jj-field-label">Visible</label>
                    <ConditionalEditor<boolean>
                        value={draft.visible}
                        onChange={(next) => patch({ ...draft, visible: next })}
                        renderValue={(v, onCh) => <Toggle checked={v} onChange={onCh} label="visible" size="xs" />}
                        defaultValue={true}
                        features={features}
                        featuresHint={FEATURES_HINT}
                        classNames={classNames}
                    />
                </div>
            )}

            {/* Label of the view (IR label, distinct from the DViewElement name) */}
            <div className="jj-field" style={{ marginTop: 8 }}>
                <label className="jj-field-label">Label</label>
                <Input value={draft.label ?? ''} onChange={(e) => patch({ ...draft, label: e.target.value })} />
            </div>
        </section>
    );
};

export default RowAuthoringPanel;
