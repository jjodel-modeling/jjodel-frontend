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
    FormSection,
    forPredicateKind,
    type PathBuilderFeatures,
} from '../../../ui';
import { getMetaclassInfo, type MetaclassInfo } from '../../hooks/useEditorMode';
import { validateIR } from '../ir/irValidate';
import { defaultEdgeViewIR } from '../ir/irDefaults';
import { CONTAINER_ENDPOINT } from '../ir/irTypes';
import type { EdgeViewIR, TextSource, EdgeTermination } from '../ir/irTypes';
import { resolveMetaclassId, withMetaclassPins, type MetaclassRef } from '../ir/metaclassPin';
import { metaclassChipLabel, metaclassGroups, type MetaclassChoice } from './MatchingSection';
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
import { metaclassAmbiguityWarning } from './authoringMessages';
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
const FEATURES_HINT = 'set a source metaclass in the Applies to tab to enable feature paths';
const ENDPOINT_FEATURES_HINT = 'set a metaclass in the Applies to tab to enable endpoint selection';
const ENDPOINT_ARRAY_ERROR = "An endpoint cannot read the whole array (.values): choose values[N] (for example values[0]) or a single-valued reference.";

const NATURE_OPTIONS = [
    { value: 'reference', label: 'Reference (styles an M1 reference)' },
    { value: 'object', label: 'Object (object rendered as a line)' },
];

/**
 * Which vocabulary an endpoint of an object-as-edge view speaks: a PathExpr picked
 * with the PathBuilder, or the reserved `container` token (R-B13). UI state only —
 * and DERIVED, never stored: the mode IS the endpoint value, so a persisted token
 * lands on the container mode by construction and the two cannot desync.
 */
type EndpointMode = 'path' | 'container';
const endpointModeOf = (expr: string): EndpointMode =>
    (expr === CONTAINER_ENDPOINT ? 'container' : 'path');
/**
 * "Reference path" is deliberately NOT listed here: the shared `Select` always
 * prepends an empty option (nota Select condiviso, 2026-08-08), so listing it would
 * render two entries dropping the same choice — the very ambiguity the routing menu
 * below was fixed to remove. The empty option carries the path mode, labelled through
 * `placeholder`.
 */
const ENDPOINT_MODE_OPTIONS = [
    { value: CONTAINER_ENDPOINT, label: 'Containing element' },
];
const ENDPOINT_MODE_PATH_LABEL = 'Reference path';
// Replaces the PathBuilder on the container mode: there is nothing to pick, and the
// widget must not see the token at all (it would show it as an empty picker and
// overwrite it on the first interaction — R5 of the discovery, dissolved by keeping
// the shared component out of this branch).
const CONTAINER_ENDPOINT_DESCRIPTION = 'This end is the element that contains the object: it follows the containment parent, whatever holds the object at the time, so there is no path to pick.';

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
    // every project metamodel, in project iteration order, each with the metamodel
    // that declares it — what the picker groups its options by, and what lets it
    // write the pin of the class actually chosen. `classNames` below stays the
    // deduped NAME list the PredicateBuilder wants.
    const metaclassChoices = useMemo<MetaclassChoice[]>(() => {
        const metamodels = LProject.getProject()?.metamodels ?? [];
        const out: MetaclassChoice[] = [];
        for (const mm of metamodels) {
            let info;
            try { info = getMetaclassInfo((mm as any).id, (mm as any).id); } catch { continue; }
            const metamodelName = (mm as any).name || 'unnamed metamodel';
            for (const c of info.allClasses) out.push({ id: c.id, name: c.name, metamodelName });
        }
        return out;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /** The same universe reduced to what pin resolution matches on, same order. */
    const allClasses = useMemo<MetaclassRef[]>(
        () => metaclassChoices.map((c) => ({ id: c.id, name: c.name })),
        [metaclassChoices],
    );

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
     * Endpoint mode switch (R-B13), symmetric on the two ends. The token is written
     * through the SAME atomic writer as a picked path, so the pair still reaches the
     * ir together or not at all; switching back to the path mode empties the local
     * expression only, which leaves a committed pair — token included — alone until a
     * new valid pair exists (R-D). A persisted `container` is therefore never
     * sanitized by this panel: the inverse discipline of `dropInvalidRouting`.
     */
    const changeEndpointMode = (end: 'source' | 'target', raw: string) => {
        // The empty option of the shared Select is not a third mode: it IS the path
        // mode (see ENDPOINT_MODE_OPTIONS).
        const next: EndpointMode = raw === CONTAINER_ENDPOINT ? 'container' : 'path';
        if (next === endpointModeOf(end === 'source' ? sourceExpr : targetExpr)) return;
        const expr = next === 'container' ? CONTAINER_ENDPOINT : '';
        if (end === 'source') applyEndpoints(expr, targetExpr);
        else applyEndpoints(sourceExpr, expr);
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

    // Derived from the expressions themselves, so the seed and the reset on view.id
    // (which already re-read both endpoints from the ir) initialize them for free.
    const sourceMode = endpointModeOf(sourceExpr);
    const targetMode = endpointModeOf(targetExpr);

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
    const available = metaclassGroups(metaclassChoices, list);
    const setWildcard = (checked: boolean) => patch({ ...draft, metaclasses: checked ? '*' : [] });
    const removeMetaclass = (idx: number) => patch({ ...draft, metaclasses: list.filter((_, i) => i !== idx) });
    // The picker yields a class ID: the name goes into `metaclasses` as always, the
    // id into the pin map, so the choice between two homonyms survives the patch.
    const addMetaclass = (classId: string) => {
        const hit = metaclassChoices.find((c) => c.id === classId);
        if (!hit || list.includes(hit.name)) return;
        patch({
            ...draft,
            metaclasses: [...list, hit.name],
            authoringMetaclassPins: { ...(draft.authoringMetaclassPins ?? {}), [hit.name]: hit.id },
        });
    };

    // --- matching (reference) ---
    // The picker offers the source metaclass's references; the empty option drops
    // the KEY (not `reference: undefined`) so the ir is byte-identical to a view
    // authored without a reference restriction (= matches any reference).
    const refNames = features?.references?.map((r) => r.name) ?? [];
    const refOptions = [
        { value: '', label: '(any reference)' },
        ...refNames.map((n) => ({ value: n, label: n })),
        ...(draft.reference && !refNames.includes(draft.reference)
            ? [{ value: draft.reference, label: `${draft.reference} (unresolved)` }]
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
            <FormSection title="IR Edge view authoring" divider={false}>
                <HelpText>{isObject
                    ? 'An object edge view renders every instance of the metaclass as a line between the two endpoints: the object is no longer drawn as a node.'
                    : 'A reference edge view styles the edges derived from the M1 references whose SOURCE object matches the metaclass (and optional reference) below.'}</HelpText>

                {error && <ErrorText>{error}</ErrorText>}

                {/* Cross-tab (R-B): names the tab where the metaclass is chosen. */}
                {featureInfo.metamodelsWithClass > 1 && (
                    <ErrorText>
                        {metaclassAmbiguityWarning(featureInfo.targetName, featureInfo.metamodelsWithClass)}
                    </ErrorText>
                )}
            </FormSection>

            {/* ─────────── Applies to ─────────── */}
            <div style={body('ir-applies-to')}>
            {/* Authoritative controls of the legacy Apply-to tab, which the five-tab
                bar no longer offers to an IR view (R-H). */}
            {identity && <IRIdentityFields view={view} {...identity} />}

            {/* Matching — source metaclass */}
            <FormSection title="Matching" divider={false}>
            <div className="jj-field">
                <label className="jj-field-label">{isObject ? 'Object metaclass' : 'Source metaclass'}</label>
                <Toggle
                    checked={isWildcard}
                    onChange={setWildcard}
                    label="All metaclasses (*)"
                    size="xs"
                    disabled={isObject}
                />
                {/* Cross-tab (R-B): the constraint is imposed by the nature, which is
                    authored in Structure — both messages name that tab, since from here
                    the disabled toggle would otherwise have no visible cause. */}
                {isObject && (
                    <HelpText>An object-as-edge must name at least one metaclass: with the wildcard it ends up in no resolver bucket and produces nothing. The nature is changed in the Structure tab.</HelpText>
                )}
                {isObject && isWildcard && (
                    <ErrorText>This view has a wildcard metaclass (*): on the object substrate (nature set in the Structure tab) it applies to nothing. Name at least one metaclass.</ErrorText>
                )}
                {!isWildcard && (
                    <>
                        {list.map((name, idx) => (
                            <div
                                key={name}
                                style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-1)', marginTop: 4 }}
                            >
                                <span style={{ flex: 1 }}>
                                    {metaclassChipLabel(name, draft.authoringMetaclassPins, metaclassChoices)}
                                </span>
                                <Button variant="ghost" size="sm" onClick={() => removeMetaclass(idx)} title="Remove">
                                    <i className="bi bi-x" aria-hidden="true" />
                                </Button>
                            </div>
                        ))}
                        {list.length === 0 && (
                            <HelpText>{isObject
                                ? 'With an empty list the edge view renders no object as a line.'
                                : 'With an empty list the edge view applies to no reference.'}</HelpText>
                        )}
                        <div style={{ marginTop: 4 }}>
                            <Select
                                options={available}
                                value=""
                                placeholder="Add metaclass…"
                                onChange={(e) => addMetaclass(e.target.value)}
                            />
                        </div>
                    </>
                )}
                <HelpText>{isObject
                    ? 'Endpoints and PathBuilder features are resolved from the first metaclass in the list.'
                    : 'References and PathBuilder features are resolved from the first metaclass in the list.'}</HelpText>
            </div>

            {/* Matching — reference (reference substrate only: the object resolver
                never reads `reference`, so offering it there would be a dead control).
                Stays with the matching block it has always been rendered inside: the
                partition does not split an existing section (Q2 del 2026-08-06). */}
            {!isObject && (
                <div className="jj-field">
                    <label className="jj-field-label">Reference</label>
                    <Select
                        options={refOptions}
                        value={draft.reference ?? ''}
                        onChange={(e) => setReference(e.target.value)}
                    />
                    <HelpText>A specific reference takes priority over views matching any reference. With a wildcard or missing source metaclass the picker stays empty.</HelpText>
                </div>
            )}

            {/* Matching — predicate */}
            <div className="jj-field">
                <label className="jj-field-label">Condition</label>
                <Toggle
                    checked={hasPredicate}
                    onChange={setHasPredicate}
                    label="Apply only if (predicate)"
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
                        ? 'The predicate is evaluated on the object rendered as a line.'
                        : 'The predicate is evaluated on the source object of the reference.'}</HelpText>
                )}
            </div>

            {/* Matching — priority */}
            <div className="jj-field">
                <label className="jj-field-label">Priority</label>
                <NumberInput
                    value={draft.priority ?? 0}
                    onChange={(n) => patch({ ...draft, priority: n })}
                />
                <HelpText>The highest priority wins; on a tie, specificity (exact &gt; inherited &gt; wildcard), then declaration order.</HelpText>
            </div>
            </FormSection>
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
                <label className="jj-field-label">Nature</label>
                <Select
                    options={NATURE_OPTIONS}
                    value={nature}
                    onChange={(e) => changeNature(e.target.value as EdgeNature)}
                />
                <HelpText>{isObject
                    ? 'The nature is not an IR field: the view is of type object as long as both endpoints are set.'
                    : 'Reference: the line already exists (it is the M1 reference) and the view only decides its appearance and label.'}</HelpText>
            </div>

            {/* Endpoints — object substrate only. Written atomically (applyEndpoints):
                either both keys are in the ir, or neither is. */}
            {isObject && (
                <>
                    <FormSection title="Endpoints" divider={false}>
                    <HelpText>With both endpoints set, the instances of this metaclass are drawn as lines: they no longer appear as nodes on the canvas and their references towards the endpoints are no longer drawn.</HelpText>
                    {/* Each end picks its vocabulary first: a reference path, or the
                        containing element (R-B13). On the container mode the
                        PathBuilder does not mount — it is a shared component and must
                        never see the token. */}
                    <div className="jj-field">
                        <label className="jj-field-label">Source endpoint</label>
                        <Select
                            options={ENDPOINT_MODE_OPTIONS}
                            placeholder={ENDPOINT_MODE_PATH_LABEL}
                            value={sourceMode === 'container' ? CONTAINER_ENDPOINT : ''}
                            onChange={(e) => changeEndpointMode('source', e.target.value)}
                        />
                        {sourceMode === 'container' ? (
                            <HelpText>{CONTAINER_ENDPOINT_DESCRIPTION}</HelpText>
                        ) : (
                            <div style={{ marginTop: 4 }}>
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
                        )}
                    </div>
                    <div className="jj-field">
                        <label className="jj-field-label">Target endpoint</label>
                        <Select
                            options={ENDPOINT_MODE_OPTIONS}
                            placeholder={ENDPOINT_MODE_PATH_LABEL}
                            value={targetMode === 'container' ? CONTAINER_ENDPOINT : ''}
                            onChange={(e) => changeEndpointMode('target', e.target.value)}
                        />
                        {targetMode === 'container' ? (
                            <HelpText>{CONTAINER_ENDPOINT_DESCRIPTION}</HelpText>
                        ) : (
                            <div style={{ marginTop: 4 }}>
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
                        )}
                    </div>
                    {/* Same slot, three messages. The generic one is only true when
                        nothing is at stake: while a committed pair is still live it
                        would be false (the view is NOT a reference view), and with one
                        endpoint typed it would omit that the text is about to be lost.
                        Neither state reaches validateIR — the ir is valid in both, the
                        divergence is a condition of the FORM. */}
                    <HelpText>{endpointsDiverge
                        ? `The endpoint pair is not complete: until both are valid again the view keeps using the previous pair (${draft.edge?.source} → ${draft.edge?.target}) and the canvas does not change. Leaving the panel discards the incomplete edit and the previous pair reappears on reopening. To remove it and go back to a reference edge view, change the Nature.`
                        : unsavedSingleEndpoint
                            ? 'With a single endpoint nothing is saved: the two endpoints are written together, so until you set the other one too the view stays a reference edge view and the typed endpoint is lost when you leave the panel.'
                            : 'The two endpoints are written together: while one is missing (or reads a whole array) the view stays a reference edge view and the canvas does not change.'}</HelpText>
                    </FormSection>
                </>
            )}
            </div>

            {/* ─────────── Appearance ─────────── */}
            <div style={body('ir-appearance')}>

            {/* Line style */}
            <FormSection title="Line" divider={false}>
            <div className="jj-field">
                <label className="jj-field-label">Color</label>
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
            <div className="jj-field">
                <label className="jj-field-label">Width</label>
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
            <div className="jj-field">
                <label className="jj-field-label">Dash</label>
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
            <div className="jj-field">
                <label className="jj-field-label">Routing</label>
                <Select
                    options={ROUTING_OPTIONS}
                    placeholder="Manhattan (default)"
                    value={routing}
                    onChange={(e) => setRouting(e.target.value as 'orthogonal' | 'straight' | 'curved' | '')}
                />
                {(routing === 'straight' || routing === 'curved') && (
                    <HelpText>
                        On Direct and Bezier the segment handles disappear and no waypoint is created;
                        the ones already saved are kept and become visible again with Manhattan.
                    </HelpText>
                )}
            </div>

            </FormSection>

            {/* Terminations */}
            <FormSection title="Ends" divider={false}>
            <div className="jj-field">
                <label className="jj-field-label">Start</label>
                <Select
                    options={TERMINATION_OPTIONS}
                    value={srcEnd}
                    onChange={(e) => patchTerminations({ sourceEnd: e.target.value as EdgeTermination })}
                />
            </div>
            <div className="jj-field">
                <label className="jj-field-label">End</label>
                <Select
                    options={TERMINATION_OPTIONS}
                    value={tgtEnd}
                    onChange={(e) => patchTerminations({ targetEnd: e.target.value as EdgeTermination })}
                />
            </div>
            </FormSection>
            </div>

            {/* ─────────── Text ─────────── */}
            <div style={body('ir-text')}>

            {/* Label center */}
            <FormSection title="Label" divider={false}>
            <div className="jj-field">
                <Toggle
                    checked={hasCenterLabel}
                    onChange={setHasCenterLabel}
                    label="Center label"
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
                        ? 'Without a label the line shows no text at its center.'
                        : 'Without a label the edge keeps its default label (the reference name).'}</HelpText>
                )}
            </div>
            </FormSection>
            </div>

            {/* ─────────── Source ─────────── */}
            <div style={body('ir-source')}>
                <FormSection title="Source" divider={false}>
                    <IRSourceBody ir={(view as any).ir} />
                </FormSection>
            </div>
        </section>
    );
};

export default EdgeAuthoringPanel;
