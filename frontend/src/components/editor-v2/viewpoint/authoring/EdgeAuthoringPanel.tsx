import React, { useEffect, useMemo, useRef, useState } from 'react';
import { LProject, LPointerTargetable, DClass, type LViewElement } from '../../../../joiner';
import {
    Select,
    NumberInput,
    Toggle,
    ColorPicker,
    ConditionalEditor,
    HelpText,
    ErrorText,
    Button,
    PathBuilder,
    PredicateBuilder,
    forPredicateKind,
    type PathBuilderFeatures,
} from '../../../ui';
import { getMetaclassInfo, type MetaclassInfo } from '../../hooks/useEditorMode';
import { validateIR } from '../ir/irValidate';
import { defaultEdgeViewIR } from '../ir/irDefaults';
import type { EdgeViewIR, TextSource, EdgeTermination } from '../ir/irTypes';
import { resolveMetaclassId, withMetaclassPins, type MetaclassRef } from '../ir/metaclassPin';
import {
    natureOf,
    isUsableEndpointExpr,
    nextEdgeForEndpoints,
    hasAnyEndpoint,
    dropEndpoints,
    endpointDraftState,
    type EdgeNature,
} from '../ir/edgeEndpoints';
import { TextSourceEditor } from './TextSourceEditor';
import { IRIdentityFields, IRSourceBody, irTabBodyStyle, type IRIdentityProps, type IRTabId } from './irTabs';

export interface EdgeAuthoringPanelProps {
    view: LViewElement;
    /**
     * Active tab of the five-tab partition. Optional: when absent every body is
     * rendered visible, which is the pre-partition layout (see `irTabBodyStyle`).
     */
    activeTab?: IRTabId;
    /**
     * What the relocated legacy identity fields need beyond the view (R-H). Absent
     * when no host drives the partition: the fields are then not rendered, exactly
     * as before the relocation.
     */
    identity?: IRIdentityProps;
}

const COMMIT_DEBOUNCE_MS = 300;
// Cross-tab messages (R-B): the metaclass that unlocks these paths is authored in
// Applies to, while the paths themselves are edited in Text (labels) and Structure
// (endpoints) — so both hints name the tab that holds the cause.
const FEATURES_HINT = 'imposta una metaclasse sorgente nel tab Applies to per abilitare i path sulle feature';
const ENDPOINT_FEATURES_HINT = 'imposta una metaclasse nel tab Applies to per abilitare la scelta dei capi';
const ENDPOINT_ARRAY_ERROR = "Un capo non può leggere l'intero array (.values): scegli values[N] (per esempio values[0]) o una reference a valore singolo.";

const NATURE_OPTIONS = [
    { value: 'reference', label: 'Reference (stila una reference M1)' },
    { value: 'object', label: 'Object (oggetto reso come linea)' },
];

const LINE_STYLE_OPTIONS = [
    { value: 'solid', label: 'Solid' },
    { value: 'dashed', label: 'Dashed' },
    { value: 'dotted', label: 'Dotted' },
];
// The persisted identifiers stay the ones the IR type already declares: saved edge
// views have no VersionFixer, so a second vocabulary would strand them. Only the
// labels are the arc's wording. Manhattan is NOT listed here: it is the Select's
// empty option, labelled "Manhattan (default)" below — the two entries dropped the
// same key and reading them as distinct choices was the ambiguity.
const ROUTING_OPTIONS = [
    { value: 'straight', label: 'Direct' },
    { value: 'curved', label: 'Bezier' },
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
/**
 * A `routing` outside the closed vocabulary (R-B9) is not a fourth value: it is the
 * absent key. The empty string of the Select's placeholder option used to land in the
 * ir this way, and since every commit writes the whole draft back it survived any
 * later edit of an unrelated field. Normalized on the seed, so the stale value leaves
 * the ir at the next genuine edit; on its own it commits nothing (the seed runs with
 * dirtyRef false). An explicit 'orthogonal' is left alone — it is in the vocabulary.
 */
const dropInvalidRouting = (ir: EdgeViewIR): EdgeViewIR => {
    const r = ir?.edge?.routing as string | undefined;
    if (r !== undefined && r !== 'orthogonal' && r !== 'straight' && r !== 'curved') delete ir.edge.routing;
    return ir;
};
/** New label-center default: a blank literal (mirrors the row template default). */
const newCenterSource = (): TextSource => ({ from: 'literal', text: '' });

/**
 * EdgeAuthoringPanel — authors the IR of a selected edge view (kind `edge`), on
 * both substrates:
 * - reference-as-edge: styles the RF edges derived from M1 references whose SOURCE
 *   object matches `metaclasses` (+ optional `reference`);
 * - object-as-edge: every instance of `metaclasses` is drawn as a line between the
 *   two endpoint PathExprs (`edge.source` / `edge.target`), its node hidden.
 *
 * The nature is NOT a field of the IR (see `natureOf`): it is UI state re-derived
 * from the endpoints. Both endpoints therefore reach the ir together or not at all
 * (`applyEndpoints`) — a half-authored pair would silently be a live
 * reference-as-edge view carrying an inert PathExpr.
 *
 * The edit cycle mirrors RowAuthoringPanel exactly — a deep-cloned draft is
 * patched immutably; on each user edit it is validated eagerly (inline ErrorText)
 * and, when valid, committed after a debounce via `view.ir = draft` (whole-object
 * replace → recompile → live preview through UnifiedEdge's gated branch, E0).
 * Fields not touched here (object-as-edge source/target, persistWaypoints)
 * round-trip verbatim because the whole cloned ir is written back.
 *
 * Matching is authored inline (source metaclass / reference / predicate / priority)
 * rather than through MatchingSection, which is typed `VertexViewIR`, carries
 * `exclusive`, and does not know `reference`. The predicate roots on the SOURCE
 * object (ratifica R-1): no dedicated target UI. `exclusive` is omitted (R-5).
 */
export const EdgeAuthoringPanel: React.FC<EdgeAuthoringPanelProps> = ({ view, activeTab, identity }) => {
    const seed = (): EdgeViewIR => dropInvalidRouting(clone((view as any).ir ?? defaultEdgeViewIR()));

    const [draft, setDraft] = useState<EdgeViewIR>(seed);
    const [error, setError] = useState<string | null>(null);
    // Nature and endpoint expressions are UI state, not IR. The endpoints live here
    // (and not only in the draft) because they are written atomically: an expression
    // typed while the other one is still missing must stay out of the ir.
    const [nature, setNature] = useState<EdgeNature>(() => natureOf((view as any).ir));
    const [sourceExpr, setSourceExpr] = useState<string>(() => (view as any).ir?.edge?.source ?? '');
    const [targetExpr, setTargetExpr] = useState<string>(() => (view as any).ir?.edge?.target ?? '');
    const dirtyRef = useRef(false);

    // Reset the draft when the selected view changes (no commit on reset). Nature and
    // endpoints are re-derived from the same seed, so reopening the tab on a complete
    // object view lands back on the object branch.
    useEffect(() => {
        dirtyRef.current = false;
        const next = seed();
        setDraft(next);
        setNature(natureOf(next));
        setSourceExpr(next.edge?.source ?? '');
        setTargetExpr(next.edge?.target ?? '');
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
    // The endpoint writes below go through this same patch and are untouched by it:
    // withMetaclassPins returns `next` unchanged whenever `metaclasses` did not move.
    const patch = (next: EdgeViewIR) => {
        dirtyRef.current = true;
        setDraft(withMetaclassPins(draft, next, pinCtx));
    };

    // --- nature + endpoints (atomic write) ---

    /**
     * The two endpoints reach the ir together or not at all — the decision is
     * `nextEdgeForEndpoints` (ir/edgeEndpoints.ts), which returns null whenever the
     * ir must not move. This stays the only writer of the endpoints; all that is
     * left here is the wiring of the two local expressions, which always move.
     */
    const applyEndpoints = (nextSource: string, nextTarget: string) => {
        setSourceExpr(nextSource);
        setTargetExpr(nextTarget);
        const edge = nextEdgeForEndpoints(draft.edge, nextSource, nextTarget);
        if (!edge) return;
        patch({ ...draft, edge });
    };

    /**
     * Nature switch, explicit and symmetric: each direction drops the keys that
     * belong to the other substrate, so the ir never carries both a `reference`
     * restriction (ignored by the object resolver) and a pair of endpoints.
     */
    const changeNature = (next: EdgeNature) => {
        if (next === nature) return;
        setNature(next);
        if (next === 'object') {
            if (draft.reference !== undefined) {
                const { reference, ...rest } = draft;
                patch(rest as EdgeViewIR);
            }
            return;
        }
        setSourceExpr('');
        setTargetExpr('');
        if (hasAnyEndpoint(draft.edge)) {
            patch({ ...draft, edge: dropEndpoints(draft.edge) });
        }
    };

    // How the form relates to the draft (ir/edgeEndpoints.ts): every branch of the
    // endpoint behaviour is decided there, so it can be unit-tested without mounting
    // this component.
    const { diverges: endpointsDiverge, unsavedSingleEndpoint } =
        endpointDraftState(draft.edge, sourceExpr, targetExpr);

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
    const isObject = nature === 'object';

    // Endpoint pickers see the REFERENCES only: an endpoint must navigate to another
    // object, and an attribute path would compile and then resolve to nothing (silent
    // fallback, the object stays a node). Same feature resolution as everything else —
    // only the attribute list is emptied, PathBuilder is untouched.
    const endpointFeatures = useMemo<PathBuilderFeatures | null>(
        () => (features ? { attributes: [], references: features.references } : null),
        [features],
    );

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

    // --- routing ---
    // Absent ≡ 'orthogonal' (R-B9), and both read as the Select's empty option — the
    // menu's only Manhattan entry, labelled "Manhattan (default)" below. The test
    // mirrors setRouting's: an explicit 'orthogonal' (which this panel never writes,
    // and which the seed deliberately keeps) would otherwise select no option at all.
    const routing = draft.edge.routing === 'straight' || draft.edge.routing === 'curved'
        ? draft.edge.routing
        : '';
    const setRouting = (next: 'orthogonal' | 'straight' | 'curved' | '') => {
        if (next !== 'straight' && next !== 'curved') {
            // Drop the KEY (not `routing: 'orthogonal'`, and never the placeholder's empty
            // string, which is no value of the vocabulary) — absent and 'orthogonal' render
            // identically, and dropping keeps the ir byte-identical to a view authored
            // without any routing, same contract as the predicate and the center label.
            const edge = { ...draft.edge };
            delete edge.routing;
            patch({ ...draft, edge });
        } else {
            patchEdge({ routing: next });
        }
    };

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

    /** Body visibility of the five-tab partition: `display: none` only (R-A). */
    const body = (id: IRTabId) => irTabBodyStyle(id, activeTab);

    return (
        <section className="properties-tab properties-panel">
            <div className="jj-field-label" style={{ marginTop: 4 }}>IR Edge view authoring</div>
            <HelpText>{isObject
                ? "Una edge view di tipo object rende ogni istanza della metaclasse come una linea fra i due capi: l'oggetto non viene più disegnato come nodo."
                : 'Una edge view di tipo reference stila gli edge derivati dalle reference M1 il cui oggetto SORGENTE corrisponde alla metaclasse (ed eventuale reference) qui sotto.'}</HelpText>

            {error && <ErrorText>{error}</ErrorText>}

            {/* Cross-tab (R-B): names the tab where the metaclass is chosen. */}
            {featureInfo.metamodelsWithClass > 1 && (
                <ErrorText>
                    {`La metaclasse «${featureInfo.targetName}» è dichiarata in ${featureInfo.metamodelsWithClass} metamodelli del progetto: la view usa quella fissata nel tab Applies to quando la metaclasse è stata scelta, non una qualsiasi con questo nome. Verifica che i metamodelli non siano duplicati.`}
                </ErrorText>
            )}

            {/* ─────────── Applies to ─────────── */}
            <div style={body('ir-applies-to')}>
            {/* Authoritative controls of the legacy Apply-to tab, which the five-tab
                bar no longer offers to an IR view (R-H). */}
            {identity && <IRIdentityFields view={view} {...identity} />}

            {/* Matching — source metaclass */}
            <div className="jj-field-label" style={{ marginTop: 8 }}>Matching</div>
            <div className="jj-field" style={{ marginTop: 4 }}>
                <label className="jj-field-label">{isObject ? "Metaclasse dell'oggetto" : 'Metaclasse sorgente'}</label>
                <Toggle
                    checked={isWildcard}
                    onChange={setWildcard}
                    label="Tutte le metaclassi (*)"
                    size="xs"
                    disabled={isObject}
                />
                {/* Cross-tab (R-B): the constraint is imposed by the nature, which is
                    authored in Structure — both messages name that tab, since from here
                    the disabled toggle would otherwise have no visible cause. */}
                {isObject && (
                    <HelpText>Una object-as-edge deve nominare almeno una metaclasse: con il wildcard non finisce in nessun bucket del resolver e non produce nulla. La natura si cambia nel tab Structure.</HelpText>
                )}
                {isObject && isWildcard && (
                    <ErrorText>Questa view ha metaclasse wildcard (*): sul substrato object (natura impostata nel tab Structure) non si applica a nulla. Nomina almeno una metaclasse.</ErrorText>
                )}
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
                            <HelpText>{isObject
                                ? 'Con la lista vuota la edge view non rende come linea nessun oggetto.'
                                : 'Con la lista vuota la edge view non si applica a nessuna reference.'}</HelpText>
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
                <HelpText>{isObject
                    ? 'I capi e le feature del PathBuilder si risolvono dalla prima metaclasse della lista.'
                    : 'Le reference e le feature del PathBuilder si risolvono dalla prima metaclasse della lista.'}</HelpText>
            </div>

            {/* Matching — reference (reference substrate only: the object resolver
                never reads `reference`, so offering it there would be a dead control).
                Stays with the matching block it has always been rendered inside: the
                partition does not split an existing section (Q2 del 2026-08-06). */}
            {!isObject && (
                <div className="jj-field" style={{ marginTop: 8 }}>
                    <label className="jj-field-label">Reference</label>
                    <Select
                        options={refOptions}
                        value={draft.reference ?? ''}
                        onChange={(e) => setReference(e.target.value)}
                    />
                    <HelpText>Una reference specifica ha priorità sulle view che matchano qualsiasi reference. Con metaclasse sorgente wildcard o assente il picker resta vuoto.</HelpText>
                </div>
            )}

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
                    <HelpText>{isObject
                        ? "Il predicate è valutato sull'oggetto reso come linea."
                        : "Il predicate è valutato sull'oggetto sorgente della reference."}</HelpText>
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
            </div>

            {/* ─────────── Structure ─────────── */}
            {/* Topology of the edge: what the line IS. Its content changes with the
                nature — a reference view restricts a reference, an object view names
                its two endpoints. */}
            <div style={body('ir-structure')}>

            {/* Nature — first control of the body: it decides what everything below
                means. Not a field of the ir: derived from the endpoints, kept in UI
                state. */}
            <div className="jj-field" style={{ marginTop: 8 }}>
                <label className="jj-field-label">Natura</label>
                <Select
                    options={NATURE_OPTIONS}
                    value={nature}
                    onChange={(e) => changeNature(e.target.value as EdgeNature)}
                />
                <HelpText>{isObject
                    ? "La natura non è un campo dell'IR: la view è di tipo object finché entrambi i capi sono impostati."
                    : 'Reference: la linea esiste già (è la reference M1) e la view ne decide solo aspetto ed etichetta.'}</HelpText>
            </div>

            {/* Endpoints — object substrate only. Written atomically (applyEndpoints):
                either both keys are in the ir, or neither is. */}
            {isObject && (
                <>
                    <div className="jj-field-label" style={{ marginTop: 8 }}>Capi</div>
                    <HelpText>Con entrambi i capi impostati le istanze di questa metaclasse vengono disegnate come linee: non appaiono più come nodi sul canvas e le loro reference verso i capi non vengono più disegnate.</HelpText>
                    <div className="jj-field" style={{ marginTop: 4 }}>
                        <label className="jj-field-label">Capo sorgente</label>
                        <PathBuilder
                            features={endpointFeatures}
                            value={sourceExpr}
                            disabledHint={ENDPOINT_FEATURES_HINT}
                            onChange={(expr) => applyEndpoints(expr, targetExpr)}
                        />
                        {sourceExpr !== '' && !isUsableEndpointExpr(sourceExpr) && (
                            <ErrorText>{ENDPOINT_ARRAY_ERROR}</ErrorText>
                        )}
                    </div>
                    <div className="jj-field" style={{ marginTop: 8 }}>
                        <label className="jj-field-label">Capo destinazione</label>
                        <PathBuilder
                            features={endpointFeatures}
                            value={targetExpr}
                            disabledHint={ENDPOINT_FEATURES_HINT}
                            onChange={(expr) => applyEndpoints(sourceExpr, expr)}
                        />
                        {targetExpr !== '' && !isUsableEndpointExpr(targetExpr) && (
                            <ErrorText>{ENDPOINT_ARRAY_ERROR}</ErrorText>
                        )}
                    </div>
                    {/* Same slot, three messages. The generic one is only true when
                        nothing is at stake: while a committed pair is still live it
                        would be false (the view is NOT a reference view), and with one
                        endpoint typed it would omit that the text is about to be lost.
                        Neither state reaches validateIR — the ir is valid in both, the
                        divergence is a condition of the FORM. */}
                    <HelpText>{endpointsDiverge
                        ? `La coppia dei capi non è completa: finché non tornano validi entrambi la view continua a usare la coppia precedente (${draft.edge?.source} → ${draft.edge?.target}) e il canvas non cambia. Uscendo dal pannello la modifica incompleta viene scartata e alla riapertura ricompare la coppia precedente. Per rimuoverla e tornare a una edge view di tipo reference, cambia la Natura.`
                        : unsavedSingleEndpoint
                            ? 'Con un capo solo non viene salvato niente: i due capi si scrivono insieme, quindi finché non imposti anche l\'altro la view resta una edge view di tipo reference e uscendo dal pannello il capo digitato va perso.'
                            : 'I due capi vengono scritti insieme: finché ne manca uno (o legge un intero array) la view resta una edge view di tipo reference e il canvas non cambia.'}</HelpText>
                </>
            )}
            </div>

            {/* ─────────── Appearance ─────────── */}
            <div style={body('ir-appearance')}>

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
            <div className="jj-field" style={{ marginTop: 8 }}>
                <label className="jj-field-label">Routing</label>
                <Select
                    options={ROUTING_OPTIONS}
                    placeholder="Manhattan (default)"
                    value={routing}
                    onChange={(e) => setRouting(e.target.value as 'orthogonal' | 'straight' | 'curved' | '')}
                />
                {(routing === 'straight' || routing === 'curved') && (
                    <HelpText>
                        Su Direct e Bezier le maniglie di segmento spariscono e non si creano waypoint;
                        quelli già salvati restano e tornano visibili con Manhattan.
                    </HelpText>
                )}
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
            </div>

            {/* ─────────── Text ─────────── */}
            <div style={body('ir-text')}>

            {/* Label center */}
            <div className="jj-field-label" style={{ marginTop: 8 }}>Label</div>
            <div className="jj-field" style={{ marginTop: 4 }}>
                <Toggle
                    checked={hasCenterLabel}
                    onChange={setHasCenterLabel}
                    label="Label al centro"
                    size="xs"
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
                    <HelpText>{isObject
                        ? 'Senza label la linea non mostra testo al centro.'
                        : "Senza label l'edge mantiene l'etichetta di default (nome della reference)."}</HelpText>
                )}
            </div>
            </div>

            {/* ─────────── Source ─────────── */}
            <div style={body('ir-source')}>
                <div className="jj-field-label" style={{ marginTop: 8 }}>Source</div>
                <IRSourceBody ir={(view as any).ir} />
            </div>
        </section>
    );
};

export default EdgeAuthoringPanel;
