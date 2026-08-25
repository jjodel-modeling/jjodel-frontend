import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { LProject, LPointerTargetable, DClass, type LViewElement } from '../../../../joiner';
import { Input, Select, NumberInput, ColorPicker, ErrorText, Button, HelpText, ConditionalEditor, Toggle, FormSection, type PathBuilderFeatures } from '../../../ui';
import { getMetaclassInfo, type MetaclassInfo } from '../../hooks/useEditorMode';
import { validateIR } from '../ir/irValidate';
import { defaultObjectViewIR } from '../ir/irDefaults';
import type { VertexViewIR, ShapeForm, PaddingToken } from '../ir/irTypes';
import { MARKER_REGISTRY } from '../ir/markerRegistry';
import { recognizeSymbol } from '../ir/symbolRecognition';
import { resolveMetaclassId, withMetaclassPins, type MetaclassRef } from '../ir/metaclassPin';
import { defaultResizableForForm } from '../../nodes/nodeSizing';
import { LabelListEditor } from './LabelListEditor';
import { TextStyleField } from './TextStyleField';
import { FieldCompartmentListEditor } from './FieldCompartmentListEditor';
import { BadgeListEditor } from './BadgeListEditor';
import { MatchingSection, type MetaclassChoice } from './MatchingSection';
import { metaclassAmbiguityWarning } from './authoringMessages';
import { IRIdentityFields, IRSourceBody, irTabBodyStyle, type IRIdentityProps, type IRTabId } from './irTabs';
import { JjodelEvents } from '../../../../events/registry';

export interface VertexAuthoringPanelProps {
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

const FORM_OPTIONS = [
    { value: 'rect', label: 'Rectangle' },
    { value: 'rounded', label: 'Rounded' },
    { value: 'ellipse', label: 'Ellipse' },
    { value: 'circle', label: 'Circle' },
    { value: 'diamond', label: 'Diamond' },
    { value: 'stadium', label: 'Stadium' },
    { value: 'hexagon', label: 'Hexagon' },
    { value: 'parallelogram', label: 'Parallelogram' },
    { value: 'cylinder', label: 'Cylinder' },
];
const BORDER_STYLE_OPTIONS = [
    { value: 'solid', label: 'Solid' },
    { value: 'dashed', label: 'Dashed' },
    { value: 'dotted', label: 'Dotted' },
    { value: 'double', label: 'Double' },
];
/** Marker interni delle notazioni (asse marker): opzioni dalla tabella dati.
 *  '' = nessun marker; la chiave viene rimossa dall'IR, non persistita vuota. */
const MARKER_OPTIONS = [
    { value: '', label: 'None' },
    ...Object.values(MARKER_REGISTRY).map((m) => ({ value: m.id, label: m.label })),
];

/** Spacing preset (asse padding): vocabolario chiuso, 'normal' non viene persistito. */
const PADDING_OPTIONS = [
    { value: 'small', label: 'Small' },
    { value: 'normal', label: 'Normal' },
    { value: 'large', label: 'Large' },
];

const DEFAULT_BORDER = { color: '#334155', width: 1, style: 'solid' as const };
const COMMIT_DEBOUNCE_MS = 300;
// Cross-tab message (R-B): the metaclass that unlocks these paths is authored in
// Applies to, while the paths themselves are edited in Text and Structure — so the
// hint names the tab that holds the cause.
const FEATURES_HINT = 'Set a metaclass in the Applies to tab to enable feature paths';

/** Lossless deep clone for plain IR objects (pure JSON: no functions/dates). */
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

/**
 * VertexAuthoringPanel — authors the IR of a selected vertex view.
 *
 * Edit cycle (design doc §3): a deep-cloned draft is patched immutably; on each
 * user edit the draft is validated eagerly (inline ErrorText) and, when valid,
 * committed after a debounce via the L-proxy `view.ir = draft` (whole-object
 * replace — flips the refToken WeakMap → recompile → live preview). Fields not
 * edited here (extra labels, compartments, badges, any Conditional) round-trip
 * verbatim because the whole cloned ir is written back.
 */
export const VertexAuthoringPanel: React.FC<VertexAuthoringPanelProps> = ({ view, activeTab, identity }) => {
    const seed = (): VertexViewIR => clone((view as any).ir ?? defaultObjectViewIR());

    const [draft, setDraft] = useState<VertexViewIR>(seed);
    const [error, setError] = useState<string | null>(null);

    // Disclosure mode — read-only here. The single Basic/Advanced toggle lives in the
    // Properties card header (PropertiesWithTreeView), which owns the write path; this
    // panel only reads the resulting global mode. Redux `advanced` is the runtime
    // broadcast channel every mode writer sets (Navbar, BottomBar, Settings, the card
    // header), so a plain selector keeps the panel in sync from any of them.
    const advanced = useSelector((s: any) => !!s.advanced);
    const dirtyRef = useRef(false);

    // D15: two mounts of this panel can edit the same view (the rail tabs and
    // the symbol editor modal) and the commit is a whole-object replace, so
    // each mount tracks the ir object it derives from. `get_ir` returns
    // `c.data.ir` as-is (view.tsx:549): referential identity is the change signal.
    const irObj = (view as any).ir;
    const lastSeenIrRef = useRef<unknown>(irObj);
    const lastCommittedRef = useRef<VertexViewIR | null>(null);
    // Latest draft/view for the unmount flush below (refs: no re-render, no
    // stale closure). draftViewIdRef guards against flushing a draft onto a
    // view it was not seeded from.
    const draftRef = useRef(draft);
    draftRef.current = draft;
    const viewRef = useRef(view);
    viewRef.current = view;
    const draftViewIdRef = useRef<string>(view.id as string);

    // Reset the draft when the selected view changes (no commit on reset).
    useEffect(() => {
        dirtyRef.current = false;
        setDraft(seed());
        setError(null);
        draftViewIdRef.current = view.id as string;
        lastSeenIrRef.current = (view as any).ir;
        lastCommittedRef.current = null;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [view.id]);

    // D15: re-seed when the ir changed OUTSIDE this mount (the other surface
    // committed). Without this, the next local edit would write back a stale
    // clone and silently revert the other surface's work. A local uncommitted
    // edit keeps priority (last-writer-wins, unchanged from today).
    useEffect(() => {
        if (irObj === lastSeenIrRef.current) return;
        const clean = !dirtyRef.current || draft === lastCommittedRef.current;
        lastSeenIrRef.current = irObj;
        if (!clean) return;
        dirtyRef.current = false;
        setDraft(seed());
        setError(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [irObj]);

    // Eager validate + debounced immutable commit — only on genuine user edits.
    useEffect(() => {
        if (!dirtyRef.current) return;
        const v = validateIR(view.id, draft);
        setError(v.ok ? null : v.error);
        if (!v.ok) return;
        const t = setTimeout(() => {
            // Whole-object immutable replace via set_ir (view.tsx:484 → SetFieldAction,
            // which dispatches): flips the refToken WeakMap → recompile → live preview.
            (view as any).ir = draft;
            lastCommittedRef.current = draft;
            lastSeenIrRef.current = draft;
        }, COMMIT_DEBOUNCE_MS);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [draft, view.id]);

    // D15: this mount can now disappear with a debounced commit pending (the
    // modal closes, the rail switches to the Symbol card). The commit effect's
    // cleanup cancels the timer, so the unmount flushes the last valid dirty
    // draft synchronously. Nothing changes for the tab switch, which never
    // unmounts the panel (R-A).
    useEffect(() => () => {
        const v = viewRef.current;
        const d = draftRef.current;
        if (!dirtyRef.current) return;
        if (d === lastCommittedRef.current) return;
        if (draftViewIdRef.current !== (v.id as string)) return;
        // Il draft appartiene al kind con cui il pannello è stato montato. Se l'ir sulla
        // view non è più di quel kind, qualcun altro l'ha convertita mentre eravamo
        // montati (selettore di kind, slice B) e questo flush la riporterebbe indietro.
        // Non è roba nostra: si scarta.
        if ((v as any).ir?.kind !== d.kind) return;
        const res = validateIR(v.id, d);
        if (!res.ok) return;
        try { (v as any).ir = d; } catch { /* view already gone: nothing to flush onto */ }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
    // one of its own: two lists free to move apart would diverge at the first edit,
    // which is what the pin exists to prevent. Every other edit goes through
    // withMetaclassPins untouched — it reconciles only on a metaclass change, so an
    // unpinned view stays unpinned until the author actually picks a metaclass.
    const patch = (next: VertexViewIR) => {
        dirtyRef.current = true;
        setDraft(withMetaclassPins(draft, next, pinCtx));
    };

    // Resolve the PathBuilder feature set from the view's target metaclass.
    //
    // Resolution is by IDENTITY, not by name: a project may hold duplicate
    // metamodels whose classes share a name, and a name-only lookup returns the
    // class of the first metamodel iterated — potentially a different class than
    // the one this view targets, with a stale/partial feature set (discovery
    // 2026-07-23 §9: two `USER_185` metamodels, each with its own `State`). The
    // identity comes from the ir's own pin and, for views authored before the pin
    // existed, from appliableToClasses (chain in ir/metaclassPin.ts); we read the
    // features from that class, and in parallel count how many metamodels declare a
    // class of this name, to surface the ambiguity (metamodelsWithClass > 1).
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
            // Prefer the exact class the view points at, wherever it lives.
            if (targetId) {
                const exact = info.allClasses.find((c) => c.id === targetId);
                if (exact) byId = exact;
            }
        }

        // Identity match wins; fall back to the first name match only when the chain
        // cannot pin an id at all (no pin, and a name outside the Apply-to set).
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
    // PredicateBuilder `isKind` selector inside each ConditionalEditor. Distinct
    // from `features` (target-metaclass features only). The project class set does
    // not change during a panel editing session, so it is computed once.
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

    const shape = draft.shape;
    const form = shape.form;
    const fill = shape.fill;
    const marker = shape.marker;
    const labels = shape.labels ?? [];
    const badges = shape.badges ?? [];
    const fieldCompartments = draft.fieldCompartments ?? [];
    const border = shape.border ?? DEFAULT_BORDER;
    // Resolved resizable state (mirrors the checkbox default): explicit flag ?? per-form default.
    // Gates the "Propagate size" button — propagating a size to a non-resizable view has no effect.
    const canResize = draft.resizable ?? defaultResizableForForm(typeof form === 'string' ? form : undefined);

    // --- immutable patch helpers ---
    const patchShape = (partial: Partial<VertexViewIR['shape']>) =>
        patch({ ...draft, shape: { ...draft.shape, ...partial } });
    const patchBorder = (partial: Partial<NonNullable<VertexViewIR['shape']['border']>>) => {
        const base = draft.shape.border ?? DEFAULT_BORDER;
        patchShape({ border: { ...base, ...partial } });
    };

    /** Body visibility of the five-tab partition: `display: none` only (R-A). */
    const body = (id: IRTabId) => irTabBodyStyle(id, activeTab);

    return (
        <section className="properties-tab properties-panel">
            {error && <ErrorText>{error}</ErrorText>}

            {/* Active ambiguity warning: the target class name is declared in more
                than one project metamodel. The picker binds to the class this view
                is applied to (by id), but the duplication usually signals an
                incoherent model (duplicate metamodels) worth the author's attention.
                Cross-tab (R-B): it names the tab where the metaclass is chosen. */}
            {featureInfo.metamodelsWithClass > 1 && (
                <ErrorText>
                    {metaclassAmbiguityWarning(featureInfo.targetName, featureInfo.metamodelsWithClass)}
                </ErrorText>
            )}

            {/* ─────────── Applies to ─────────── */}
            {/* Stable classes on the tab bodies (D15b): FormSection's CSS modules are
                hashed, so a host that restyles a body (the modal's two-column
                anatomy) needs an addressable container. Visibility is still the
                inline style of irTabBodyStyle, which wins over any stylesheet. */}
            <div className="ir-tab-body ir-tab-body--applies-to" style={body('ir-applies-to')}>
                {/* Authoritative controls of the legacy Apply-to tab, which the
                    five-tab bar no longer offers to an IR view (R-H). */}
                {identity && <IRIdentityFields view={view} {...identity} />}

                {/* Matching — reachable in Basic too since the partition (R-3): the
                    disclosure mode no longer gates whole sections, only Conditional
                    branches and the Source tab. */}
                <MatchingSection
                    draft={draft}
                    patch={patch}
                    features={features}
                    featuresHint={FEATURES_HINT}
                    classNames={classNames}
                    metaclassChoices={metaclassChoices}
                />
                <div className="jj-field" style={{ marginTop: 'var(--space-2)' }}>
                    <HelpText>Multiple rules are not yet editable here. Single conditional fields (when/then/else) are edited now directly in Basic, next to each field.</HelpText>
                </div>
            </div>

            {/* ─────────── Structure ─────────── */}
            <div className="ir-tab-body ir-tab-body--structure" style={body('ir-structure')}>
                {/* Field compartments — the data round-trips verbatim either way: the
                    whole cloned ir (draft.fieldCompartments included) is written back
                    on every commit. */}
                <FormSection title="Field compartments" divider={false}>
                    <FieldCompartmentListEditor
                        compartments={fieldCompartments}
                        features={features}
                        featuresHint={FEATURES_HINT}
                        classNames={classNames}
                        onChange={(next) => patch({ ...draft, fieldCompartments: next })}
                    />
                </FormSection>
            </div>

            {/* ─────────── Appearance ─────────── */}
            <div className="ir-tab-body ir-tab-body--appearance" style={body('ir-appearance')}>

            {/* Symbol identity (D14). The catalog picker and the «modified from X»
                session state moved to SymbolEditorModal (D15b): the modal hosts the
                persistent catalog column and owns the last-applied preset. */}
            <FormSection title="Symbol" divider={false}>
                {/* Structural recognition (D14): where the authored axes sit in the
                    catalog space. Derived on every render, never stored (a preset is
                    a value, not a type: D10). Set-valued because the catalog is a
                    many-to-many index: the first match leads, the rest are the tail. */}
                {(() => {
                    const matches = recognizeSymbol(draft.shape);
                    const notations = [...new Set(matches.map(m => m.notation))].join(' · ');
                    return (
                        <div className="jj-field" style={{ fontSize: 11, display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
                            {matches.length > 0 ? (
                                <>
                                    <strong>{matches[0].label}</strong>
                                    <span style={{ color: '#64748b' }}>
                                        {notations}
                                        {matches.length > 1 ? ` · also: ${matches.slice(1).map(m => m.label).join(', ')}` : ''}
                                    </span>
                                </>
                            ) : (
                                <span style={{ color: '#64748b' }}>Custom symbol · no catalog preset matches these axes</span>
                            )}
                        </div>
                    );
                })()}
            </FormSection>

            {/* Shape form */}
            <FormSection title="Shape" divider={false}>
                <div className="jj-field">
                    <ConditionalEditor<ShapeForm>
                        value={form}
                        onChange={(next) => patchShape({ form: next })}
                        renderValue={(v, onCh) => <Select options={FORM_OPTIONS} value={v} onChange={(e) => onCh(e.target.value as ShapeForm)} />}
                        defaultValue={'rect'}
                        features={features}
                        featuresHint={FEATURES_HINT}
                        classNames={classNames}
                        allowConditional={advanced}
                    />
                </div>
            </FormSection>

            {/* Fill */}
            <FormSection title="Fill" divider={false}>
                <div className="jj-field">
                    <ConditionalEditor
                        value={fill}
                        onChange={(next) => patchShape({ fill: next })}
                        renderValue={(v, onCh) => <ColorPicker value={v} onChange={onCh} />}
                        defaultValue={''}
                        features={features}
                        featuresHint={FEATURES_HINT}
                        classNames={classNames}
                        allowConditional={advanced}
                    />
                </div>
            </FormSection>

            {/* Border (always scalar in the schema) */}
            <FormSection title="Border" divider={false}>
                <div className="jj-field">
                    <label className="jj-field-label">Color</label>
                    <ColorPicker value={border.color} onChange={(hex) => patchBorder({ color: hex })} />
                    <label className="jj-field-label" style={{ marginTop: 'var(--space-2)' }}>Width</label>
                    <NumberInput value={border.width} min={0} onChange={(w) => patchBorder({ width: w })} />
                    <label className="jj-field-label" style={{ marginTop: 'var(--space-2)' }}>Style</label>
                    <Select options={BORDER_STYLE_OPTIONS} value={border.style} onChange={(e) => patchBorder({ style: e.target.value as 'solid' | 'dashed' | 'dotted' | 'double' })} />
                    {/* Nessuna riscrittura silenziosa della width: e' CSS nativo che sotto
                        i 3px il double non mostra due linee, quindi lo si dice e basta. */}
                    {border.style === 'double' && border.width < 3 && (
                        <HelpText icon={false}>Double shows two lines from width 3 up.</HelpText>
                    )}
                </div>
            </FormSection>

            {/* Padding (Advanced only): spacing preset for header, inside label and
                compartments. Normal removes the key from the IR, like None for the marker.
                The placeholder of the shared Select resolves to the default too (nota
                Select condiviso, 2026-08-08): a closed vocabulary never persists ''. */}
            {advanced && (
                <FormSection title="Padding" divider={false}>
                    <div className="jj-field">
                        <Select
                            options={PADDING_OPTIONS}
                            value={shape.padding ?? 'normal'}
                            onChange={(e) => {
                                const v = e.target.value as PaddingToken | '';
                                patchShape({ padding: v === 'normal' || v === '' ? undefined : v });
                            }}
                        />
                    </div>
                </FormSection>
            )}

            {/* Marker — notation symbol inside the shape (gateway x, timer clock,
                history H). Conditional like Fill: the same view can switch marker
                per instance in Advanced. None removes the key from the IR. */}
            <FormSection title="Marker" divider={false}>
                <div className="jj-field">
                    <ConditionalEditor
                        value={marker ?? ''}
                        onChange={(next) => patchShape({ marker: next === '' ? undefined : next })}
                        renderValue={(v, onCh) => <Select options={MARKER_OPTIONS} value={v} onChange={(e) => onCh(e.target.value)} />}
                        defaultValue={''}
                        features={features}
                        featuresHint={FEATURES_HINT}
                        classNames={classNames}
                        allowConditional={advanced}
                    />
                </div>
            </FormSection>

            {/* Resizable — top-level flag (like `label`, not a shape.* field). Mirrors
                the runtime gate: shown state = explicit flag ?? per-form default. */}
            <FormSection title="Sizing" divider={false}>
                <div className="jj-field">
                    <Toggle
                        checked={draft.resizable ?? defaultResizableForForm(typeof form === 'string' ? form : undefined)}
                        onChange={(checked) => patch({ ...draft, resizable: checked })}
                        label="Resizable"
                        size="xs"
                    />
                    {/* icon={false}: inside the Properties card the hint is a quiet
                        indented line under the field label, without the (i) glyph. */}
                    <HelpText icon={false}>Forces the resize handles. Uncheck to lock. When unset, follows the shape.</HelpText>
                    <Button
                        variant="secondary"
                        disabled={!canResize}
                        title="Apply the selected instance size to all instances of this view"
                        onClick={() => window.dispatchEvent(
                            new CustomEvent(JjodelEvents.PROPAGATE_VIEW_SIZE, { detail: { viewId: view.id } })
                        )}
                    >
                        Propagate size
                    </Button>
                </div>
            </FormSection>

            {/* Badges — same round-trip guarantee as the compartments. */}
            <FormSection title="Badges" divider={false}>
                <BadgeListEditor
                    badges={badges}
                    features={features}
                    featuresHint={FEATURES_HINT}
                    classNames={classNames}
                    onChange={(next) => patchShape({ badges: next })}
                />
            </FormSection>

            </div>

            {/* ─────────── Text ─────────── */}
            <div className="ir-tab-body ir-tab-body--text" style={body('ir-text')}>
                {/* View label (IR label field, distinct from the DViewElement name,
                    which the relocated Name field of Applies to writes) */}
                <FormSection title="General" divider={false}>
                    <div className="jj-field">
                        <label className="jj-field-label">Label</label>
                        <Input value={draft.label ?? ''} onChange={(e) => patch({ ...draft, label: e.target.value })} />
                    </div>
                </FormSection>

                {/* Symbol text, root of the typographic cascade (ir-1.3): the way to
                    resize every text of the symbol at once, without going label by
                    label. Reachable in Basic on purpose, unlike Padding. */}
                <FormSection title="Symbol text" divider={false}>
                    <TextStyleField
                        value={shape.text}
                        onChange={(next) => patchShape({ text: next })}
                        features={features}
                        featuresHint={FEATURES_HINT}
                        classNames={classNames}
                    />
                    <HelpText icon={false}>Applies to every text of the symbol. A label's own style overrides it.</HelpText>
                </FormSection>

                {/* Labels — full list (includes the former primary label at index 0) */}
                <FormSection title="Labels" divider={false}>
                    <LabelListEditor
                        labels={labels}
                        features={features}
                        featuresHint={FEATURES_HINT}
                        classNames={classNames}
                        allowConditional={advanced}
                        onChange={(next) => patchShape({ labels: next })}
                    />
                </FormSection>
            </div>

            {/* ─────────── Source ─────────── */}
            <div className="ir-tab-body ir-tab-body--source" style={body('ir-source')}>
                <FormSection title="Source" divider={false}>
                    <IRSourceBody ir={(view as any).ir} />
                </FormSection>
            </div>
        </section>
    );
};

export default VertexAuthoringPanel;
