import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { LProject, LPointerTargetable, DClass, type LViewElement } from '../../../../joiner';
import { Input, Select, NumberInput, ColorPicker, ErrorText, Button, HelpText, ConditionalEditor, Checkbox, FormSection, type PathBuilderFeatures } from '../../../ui';
import { getMetaclassInfo, type MetaclassInfo } from '../../hooks/useEditorMode';
import { validateIR } from '../ir/irValidate';
import { defaultObjectViewIR } from '../ir/irDefaults';
import type { VertexViewIR, ShapeForm } from '../ir/irTypes';
import { defaultResizableForForm } from '../../nodes/nodeSizing';
import { LabelListEditor } from './LabelListEditor';
import { FieldCompartmentListEditor } from './FieldCompartmentListEditor';
import { BadgeListEditor } from './BadgeListEditor';
import { MatchingSection } from './MatchingSection';
import { JjodelEvents } from '../../../../events/registry';

export interface VertexAuthoringPanelProps {
    view: LViewElement;
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
const FEATURES_HINT = 'Set a metaclass to enable feature paths';

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
export const VertexAuthoringPanel: React.FC<VertexAuthoringPanelProps> = ({ view }) => {
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

    const patch = (next: VertexViewIR) => {
        dirtyRef.current = true;
        setDraft(next);
    };

    // Resolve the PathBuilder feature set from the view's target metaclass.
    //
    // Resolution is by IDENTITY, not by name. The view pins a specific class via
    // appliableToClasses (a class pointer); a project may hold duplicate metamodels
    // whose classes share a name, and a name-only lookup returns the class of the
    // first metamodel iterated — potentially a different class than the one this
    // view targets, with a stale/partial feature set (discovery 2026-07-23 §9: two
    // `USER_185` metamodels, each with its own `State`). We first pin the exact
    // class pointer from appliableToClasses and read its features from that
    // metaclass; in parallel we count how many metamodels declare a class of this
    // name, to surface the ambiguity to the author (metamodelsWithClass > 1).
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

        // Preferred identity: the class pointer this view is applied to whose name
        // matches the IR target. appliableToClasses mixes D-level type names with
        // M2 class pointers (cf. EnableIRPanel); only real DClass entries qualify.
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
            // Prefer the exact class the view points at, wherever it lives.
            if (targetId) {
                const exact = info.allClasses.find((c) => c.id === targetId);
                if (exact) byId = exact;
            }
        }

        // Identity match wins; fall back to the first name match (legacy behaviour)
        // only when appliableToClasses cannot pin an id (e.g. metaclasses edited to
        // a name not in the view's Apply-to set).
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

    return (
        <section className="properties-tab properties-panel">
            {error && <ErrorText>{error}</ErrorText>}

            {/* Active ambiguity warning: the target class name is declared in more
                than one project metamodel. The picker binds to the class this view
                is applied to (by id), but the duplication usually signals an
                incoherent model (duplicate metamodels) worth the author's attention. */}
            {featureInfo.metamodelsWithClass > 1 && (
                <ErrorText>
                    {`The metaclass "${featureInfo.targetName}" is declared in ${featureInfo.metamodelsWithClass} project metamodels: the picker uses the one this view is applied to. Check that the metamodels are not duplicated.`}
                </ErrorText>
            )}

            {/* Visual sections — always rendered; Basic only drops the Advanced-only
                ones (compartments, badges, matching) further down. */}

            {/* View label (IR label field, distinct from the DViewElement name) */}
            <FormSection title="General">
                <div className="jj-field">
                    <label className="jj-field-label">Label</label>
                    <Input value={draft.label ?? ''} onChange={(e) => patch({ ...draft, label: e.target.value })} />
                </div>
            </FormSection>

            {/* Shape form */}
            <FormSection title="Shape">
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
            <FormSection title="Fill">
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
            <FormSection title="Border">
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
            <FormSection title="Sizing">
                <div className="jj-field">
                    <Checkbox
                        checked={draft.resizable ?? defaultResizableForForm(typeof form === 'string' ? form : undefined)}
                        onChange={(checked) => patch({ ...draft, resizable: checked })}
                        label="Resizable"
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

            {/* Labels — full list (includes the former primary label at index 0) */}
            <FormSection title="Labels">
                <LabelListEditor
                    labels={labels}
                    features={features}
                    featuresHint={FEATURES_HINT}
                    classNames={classNames}
                    allowConditional={advanced}
                    onChange={(next) => patchShape({ labels: next })}
                />
            </FormSection>

            {/* Field compartments — Advanced only. The data round-trips verbatim
                while hidden: the whole cloned ir (draft.fieldCompartments
                included) is written back on every commit. */}
            {advanced && (
                <FormSection title="Field compartments">
                    <FieldCompartmentListEditor
                        compartments={fieldCompartments}
                        features={features}
                        featuresHint={FEATURES_HINT}
                        classNames={classNames}
                        onChange={(next) => patch({ ...draft, fieldCompartments: next })}
                    />
                </FormSection>
            )}

            {/* Badges — Advanced only (same round-trip guarantee). */}
            {advanced && (
                <FormSection title="Badges">
                    <BadgeListEditor
                        badges={badges}
                        features={features}
                        featuresHint={FEATURES_HINT}
                        classNames={classNames}
                        onChange={(next) => patchShape({ badges: next })}
                    />
                </FormSection>
            )}

            {/* Matching — Advanced only. Sits after the visual sections: Advanced is a
                superset of Basic now, not the alternative "matching" view it used to be. */}
            {advanced && (
                <>
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
                </>
            )}
        </section>
    );
};

export default VertexAuthoringPanel;
