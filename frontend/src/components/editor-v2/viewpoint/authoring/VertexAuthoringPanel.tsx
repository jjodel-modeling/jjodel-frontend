import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { LProject, LPointerTargetable, DClass, type LViewElement } from '../../../../joiner';
import { Input, Select, NumberInput, ColorPicker, ErrorText, Button, HelpText, ConditionalEditor, Toggle, FormSection, type PathBuilderFeatures } from '../../../ui';
import { getMetaclassInfo, type MetaclassInfo } from '../../hooks/useEditorMode';
import { validateIR } from '../ir/irValidate';
import { defaultObjectViewIR } from '../ir/irDefaults';
import type { VertexViewIR, ShapeForm } from '../ir/irTypes';
import { resolveMetaclassId, withMetaclassPins, type MetaclassRef } from '../ir/metaclassPin';
import { defaultResizableForForm } from '../../nodes/nodeSizing';
import { LabelListEditor } from './LabelListEditor';
import { FieldCompartmentListEditor } from './FieldCompartmentListEditor';
import { BadgeListEditor } from './BadgeListEditor';
import { MatchingSection } from './MatchingSection';
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
];
const BORDER_STYLE_OPTIONS = [
    { value: 'solid', label: 'Solid' },
    { value: 'dashed', label: 'Dashed' },
    { value: 'dotted', label: 'Dotted' },
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
            // Whole-object immutable replace via set_ir (view.tsx:484 → SetFieldAction,
            // which dispatches): flips the refToken WeakMap → recompile → live preview.
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
                    {`La metaclasse «${featureInfo.targetName}» è dichiarata in ${featureInfo.metamodelsWithClass} metamodelli del progetto: la view usa quella fissata nel tab Applies to quando la metaclasse è stata scelta, non una qualsiasi con questo nome. Verifica che i metamodelli non siano duplicati.`}
                </ErrorText>
            )}

            {/* ─────────── Applies to ─────────── */}
            <div style={body('ir-applies-to')}>
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
                />
                <div className="jj-field" style={{ marginTop: 'var(--space-2)' }}>
                    <HelpText>Multiple rules are not yet editable here. Single conditional fields (when/then/else) are edited now directly in Basic, next to each field.</HelpText>
                </div>
            </div>

            {/* ─────────── Structure ─────────── */}
            <div style={body('ir-structure')}>
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
            <div style={body('ir-appearance')}>

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
                    <Select options={BORDER_STYLE_OPTIONS} value={border.style} onChange={(e) => patchBorder({ style: e.target.value as 'solid' | 'dashed' | 'dotted' })} />
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
            <div style={body('ir-text')}>
                {/* View label (IR label field, distinct from the DViewElement name,
                    which the relocated Name field of Applies to writes) */}
                <FormSection title="General" divider={false}>
                    <div className="jj-field">
                        <label className="jj-field-label">Label</label>
                        <Input value={draft.label ?? ''} onChange={(e) => patch({ ...draft, label: e.target.value })} />
                    </div>
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
            <div style={body('ir-source')}>
                <FormSection title="Source" divider={false}>
                    <IRSourceBody ir={(view as any).ir} />
                </FormSection>
            </div>
        </section>
    );
};

export default VertexAuthoringPanel;
