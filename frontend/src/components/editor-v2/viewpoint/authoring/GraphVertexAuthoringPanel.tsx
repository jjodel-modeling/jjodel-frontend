import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { LProject, LPointerTargetable, DClass, type LViewElement } from '../../../../joiner';
import { Input, Select, NumberInput, ColorPicker, ErrorText, Button, HelpText, ConditionalEditor, Toggle, FormSection, type PathBuilderFeatures } from '../../../ui';
import { getMetaclassInfo, type MetaclassInfo } from '../../hooks/useEditorMode';
import { validateIR } from '../ir/irValidate';
import { graphVertexSeedIR } from '../ir/irCreationSeed';
import type { GraphVertexViewIR, ShapeForm, VertexViewIR } from '../ir/irTypes';
import { authoredCornerRadius, baseCornerRadius } from '../ir/shapeRegistry';
import { resolveMetaclassId, withMetaclassPins, type MetaclassRef } from '../ir/metaclassPin';
import { defaultResizableForForm } from '../../nodes/nodeSizing';
import { LabelListEditor } from './LabelListEditor';
import { MatchingSection, type MetaclassChoice } from './MatchingSection';
import { ContainmentSection } from './ContainmentSection';
import {
    withBorderAxis, withDefaultSizeAxis, withShape, withVisible, withoutCornerRadius, type ChannelClass,
} from './graphVertexAuthoring';
import { isCommittableMatching } from './committableMatching';
import { metaclassAmbiguityWarning } from './authoringMessages';
import {
    IRIdentityFields, IRSourceBody, irTabBodyStyle,
    type IRIdentityProps, type IRTabId,
} from './irTabs';

export interface GraphVertexAuthoringPanelProps {
    view: LViewElement;
    /** Active tab of the partition; absent = every body visible (see `irTabBodyStyle`). */
    activeTab?: IRTabId;
    /** What the relocated legacy identity fields need beyond the view (R-H); absent = not rendered. */
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
    { value: 'cloud', label: 'Cloud' },
];
const BORDER_STYLE_OPTIONS = [
    { value: 'solid', label: 'Solid' },
    { value: 'dashed', label: 'Dashed' },
    { value: 'dotted', label: 'Dotted' },
    { value: 'double', label: 'Double' },
];
const DEFAULT_BORDER = { color: '#334155', width: 1, style: 'solid' as const };

const COMMIT_DEBOUNCE_MS = 300;
const FEATURES_HINT = 'Set a metaclass in the Applies to tab to enable feature paths';

/** Lossless deep clone for plain IR objects (pure JSON: no functions/dates). */
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

/** A MetaclassInfo as the containment checks read it (graphVertexAuthoring.ChannelClass). */
const channelClassOf = (info: MetaclassInfo): ChannelClass => ({
    id: info.id,
    name: info.name,
    references: (info.references ?? []).map(r => ({
        name: r.name, targetClassId: r.targetClassId, targetClassName: r.targetClassName,
        containment: !!r.containment, upperBound: r.upperBound,
    })),
});

/**
 * GraphVertexAuthoringPanel — authors the IR of a graphVertex view (P-2026-10-10-1156, slice S4; R-GV-11 made the
 * kind authorable).
 *
 * Built the way VertexAuthoringPanel is: one deep-cloned draft patched immutably, validated eagerly, committed after
 * a debounce through the L-proxy `view.ir = draft` (whole-object replace), the D15 re-seed when another surface
 * commits, the flush on unmount. Fields this panel does not edit round-trip verbatim, because the whole cloned ir is
 * written back.
 *
 * Bodies: Applies to (identity, Matching), Structure (the Containment section), Appearance (Shape, Fill, Border,
 * Sizing, Visibility), Text (General, Labels with the header band), Source. MatchingSection is typed on the vertex
 * draft and reads and writes only the matching keys both node kinds share, so the draft crosses it by a cast instead
 * of a change to its exported props (rule 11).
 */
export const GraphVertexAuthoringPanel: React.FC<GraphVertexAuthoringPanelProps> = ({ view, activeTab, identity }) => {
    const seed = (): GraphVertexViewIR => clone((view as any).ir ?? graphVertexSeedIR());

    const [draft, setDraft] = useState<GraphVertexViewIR>(seed);
    const [error, setError] = useState<string | null>(null);
    const advanced = useSelector((s: any) => !!s.advanced);
    const dirtyRef = useRef(false);

    const irObj = (view as any).ir;
    const lastSeenIrRef = useRef<unknown>(irObj);
    const lastCommittedRef = useRef<GraphVertexViewIR | null>(null);
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

    // D15: re-seed when the ir changed outside this mount; a local uncommitted edit keeps priority.
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

    // Eager validate + debounced immutable commit, on genuine user edits only.
    useEffect(() => {
        if (!dirtyRef.current) return;
        if (!isCommittableMatching(draft)) return;
        const v = validateIR(view.id, draft);
        setError(v.ok ? null : v.error);
        if (!v.ok) return;
        const t = setTimeout(() => {
            (view as any).ir = draft;
            lastCommittedRef.current = draft;
            lastSeenIrRef.current = draft;
        }, COMMIT_DEBOUNCE_MS);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [draft, view.id]);

    // D15: flush the last valid dirty draft when this mount goes away with a commit pending.
    useEffect(() => () => {
        const v = viewRef.current;
        const d = draftRef.current;
        if (!dirtyRef.current) return;
        if (d === lastCommittedRef.current) return;
        if (draftViewIdRef.current !== (v.id as string)) return;
        // Converted to another kind while mounted (the Kind selector): not ours to write back.
        if ((v as any).ir?.kind !== d.kind) return;
        if (!isCommittableMatching(d)) return;
        const res = validateIR(v.id, d);
        if (!res.ok) return;
        try { (v as any).ir = d; } catch { /* view already gone: nothing to flush onto */ }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Every class of every project metamodel, with the metamodel that declares it (the Matching picker), and the
    // same infos kept whole: the containment checks walk references from class to class.
    const { metaclassChoices, infos } = useMemo(() => {
        const metamodels = LProject.getProject()?.metamodels ?? [];
        const choices: MetaclassChoice[] = [];
        const all: MetaclassInfo[] = [];
        for (const mm of metamodels) {
            let info;
            try { info = getMetaclassInfo((mm as any).id, (mm as any).id); } catch { continue; }
            const metamodelName = (mm as any).name || 'unnamed metamodel';
            for (const c of info.allClasses) {
                choices.push({ id: c.id, name: c.name, metamodelName });
                all.push(c);
            }
        }
        return { metaclassChoices: choices, infos: all };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const allClasses = useMemo<MetaclassRef[]>(
        () => metaclassChoices.map((c) => ({ id: c.id, name: c.name })),
        [metaclassChoices],
    );

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

    const patch = (next: GraphVertexViewIR) => {
        dirtyRef.current = true;
        setDraft(withMetaclassPins(draft, next, pinCtx));
    };

    // Target metaclass resolved by identity first (pin, then Applies to), by name as the fallback: the vertex
    // panel's rule (discovery 2026-07-23 §9), with the same ambiguity count.
    const featureInfo = useMemo<{
        features: PathBuilderFeatures | null;
        metamodelsWithClass: number;
        targetName: string | null;
        target: MetaclassInfo | null;
    }>(() => {
        const mcs = draft.metaclasses;
        if (mcs === '*' || !Array.isArray(mcs) || mcs.length === 0) {
            return { features: null, metamodelsWithClass: 0, targetName: null, target: null };
        }
        const targetName = mcs[0];
        const targetId = resolveMetaclassId(targetName, {
            pins: draft.authoringMetaclassPins,
            appliesTo: appliesToClasses,
            candidates: allClasses,
        })?.id ?? null;
        const named = infos.filter((c) => c.name === targetName);
        const target = (targetId ? infos.find((c) => c.id === targetId) : undefined) ?? named[0] ?? null;
        if (!target) return { features: null, metamodelsWithClass: named.length, targetName, target: null };
        return {
            features: {
                attributes: (target.allAttributes ?? target.attributes ?? []).map((a) => ({
                    name: a.name, type: a.type, upperBound: a.upperBound,
                })),
                references: (target.references ?? []).map((r) => ({
                    name: r.name, targetClassName: r.targetClassName, upperBound: r.upperBound,
                })),
            },
            metamodelsWithClass: named.length,
            targetName,
            target,
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(draft.metaclasses), JSON.stringify(draft.authoringMetaclassPins ?? null), appliesToClasses, allClasses, infos, view.id]);

    const features = featureInfo.features;

    const classNames = useMemo<string[]>(() => Array.from(new Set(infos.map((c) => c.name))), [infos]);
    const classById = useMemo(() => {
        const byId = new Map(infos.map((c) => [c.id, channelClassOf(c)] as const));
        return (id: string): ChannelClass | null => byId.get(id) ?? null;
    }, [infos]);
    const classByName = useMemo(() => {
        const byName = new Map<string, ChannelClass>();
        for (const c of infos) if (!byName.has(c.name)) byName.set(c.name, channelClassOf(c));
        return (name: string): ChannelClass | null => byName.get(name) ?? null;
    }, [infos]);
    const rootClass = featureInfo.target ? channelClassOf(featureInfo.target) : null;

    const shape = draft.shape;
    const form = shape.form;
    const labels = shape.labels ?? [];
    const cornerRadius = authoredCornerRadius(shape.cornerRadius);
    const scalarForm = typeof form === 'string' ? (form as ShapeForm) : undefined;

    // Every write goes through graphVertexAuthoring.ts, which the node bench imports: the test drives these.
    const patchShape = (partial: Partial<GraphVertexViewIR['shape']>) => patch(withShape(draft, partial));
    const patchBorderAxis = (
        axis: 'color' | 'width' | 'style',
        next: NonNullable<GraphVertexViewIR['shape']['border']>['color' | 'width' | 'style'] | undefined,
    ) => patch(withBorderAxis(draft, axis, next));
    const resetCornerRadius = () => patch(withoutCornerRadius(draft));
    const patchDefaultSize = (axis: 'width' | 'height', raw: string) => patch(withDefaultSizeAxis(draft, axis, raw));

    const body = (id: IRTabId) => irTabBodyStyle(id, activeTab);
    const subjectName = featureInfo.targetName ?? undefined;

    return (
        <section className="properties-tab properties-panel" data-testid="gv-authoring-panel">
            {error && <ErrorText>{error}</ErrorText>}
            {featureInfo.metamodelsWithClass > 1 && (
                <ErrorText>{metaclassAmbiguityWarning(featureInfo.targetName, featureInfo.metamodelsWithClass)}</ErrorText>
            )}

            {/* ─────────── Applies to ─────────── */}
            <div className="ir-tab-body ir-tab-body--applies-to" style={body('ir-applies-to')}>
                {identity && <IRIdentityFields view={view} {...identity} />}
                <MatchingSection
                    draft={draft as unknown as VertexViewIR}
                    patch={(next) => patch(next as unknown as GraphVertexViewIR)}
                    features={features}
                    featuresHint={FEATURES_HINT}
                    classNames={classNames}
                    metaclassChoices={metaclassChoices}
                />
            </div>

            {/* ─────────── Structure ─────────── */}
            {/* The topology of the container: what it draws inside, how, and what a drop does. */}
            <div className="ir-tab-body ir-tab-body--structure" style={body('ir-structure')}>
                <ContainmentSection
                    draft={draft}
                    patch={patch}
                    advanced={advanced}
                    rootClass={rootClass}
                    classById={classById}
                    classByName={classByName}
                    classNames={classNames}
                    featuresHint={FEATURES_HINT}
                />
            </div>

            {/* ─────────── Appearance ─────────── */}
            <div className="ir-tab-body ir-tab-body--appearance" style={body('ir-appearance')}>
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
                            rulesTable={{ subjectName, valueNoun: 'shape' }}
                        />
                    </div>
                    <div className="jj-field" style={{ marginTop: 'var(--space-2)' }}>
                        <label className="jj-field-label">Corner radius</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <span style={{ opacity: cornerRadius === undefined ? 0.6 : 1 }}>
                                <NumberInput
                                    value={cornerRadius ?? baseCornerRadius(scalarForm)}
                                    min={0}
                                    onChange={(r) => patchShape({ cornerRadius: r })}
                                />
                            </span>
                            {cornerRadius === undefined
                                ? <span style={{ fontSize: 11, color: '#94a3b8' }}>default</span>
                                : <Button variant="ghost" size="sm" onClick={resetCornerRadius}>Reset</Button>}
                        </div>
                    </div>
                </FormSection>

                <FormSection title="Fill" divider={false}>
                    <div className="jj-field">
                        <ConditionalEditor
                            value={shape.fill}
                            onChange={(next) => patchShape({ fill: next })}
                            renderValue={(v, onCh) => <ColorPicker value={v} onChange={onCh} />}
                            defaultValue={''}
                            features={features}
                            featuresHint={FEATURES_HINT}
                            classNames={classNames}
                            allowConditional={advanced}
                            rulesTable={{ noneValue: '', fixedLabel: 'Solid', subjectName, valueNoun: 'fill' }}
                        />
                    </div>
                </FormSection>

                <FormSection title="Border" divider={false}>
                    <div className="jj-field">
                        <label className="jj-field-label">Color</label>
                        <ConditionalEditor<string>
                            value={shape.border?.color}
                            onChange={(next) => patchBorderAxis('color', next)}
                            renderValue={(v, onCh) => <ColorPicker value={v} onChange={(hex) => onCh(hex)} />}
                            defaultValue={DEFAULT_BORDER.color}
                            features={features}
                            featuresHint={FEATURES_HINT}
                            classNames={classNames}
                            allowConditional={advanced}
                            rulesTable={{ subjectName, valueNoun: 'border color' }}
                        />
                        <label className="jj-field-label" style={{ marginTop: 'var(--space-2)' }}>
                            Width <span style={{ color: '#94a3b8' }}>· px</span>
                        </label>
                        <ConditionalEditor<number>
                            value={shape.border?.width}
                            onChange={(next) => patchBorderAxis('width', next)}
                            renderValue={(v, onCh) => <NumberInput value={v} min={0} step={0.5} onChange={(w) => onCh(w)} />}
                            defaultValue={DEFAULT_BORDER.width}
                            features={features}
                            featuresHint={FEATURES_HINT}
                            classNames={classNames}
                            allowConditional={advanced}
                            rulesTable={{ subjectName, valueNoun: 'border width' }}
                        />
                        <label className="jj-field-label" style={{ marginTop: 'var(--space-2)' }}>Style</label>
                        <ConditionalEditor<'solid' | 'dashed' | 'dotted' | 'double'>
                            value={shape.border?.style}
                            onChange={(next) => patchBorderAxis('style', next)}
                            renderValue={(v, onCh) => (
                                <Select
                                    options={BORDER_STYLE_OPTIONS}
                                    value={v}
                                    onChange={(e) => onCh(e.target.value as 'solid' | 'dashed' | 'dotted' | 'double')}
                                />
                            )}
                            defaultValue={DEFAULT_BORDER.style}
                            features={features}
                            featuresHint={FEATURES_HINT}
                            classNames={classNames}
                            allowConditional={advanced}
                            rulesTable={{ subjectName, valueNoun: 'border style' }}
                        />
                    </div>
                </FormSection>

                <FormSection title="Sizing" divider={false}>
                    <div className="jj-field">
                        <Toggle
                            checked={draft.resizable ?? defaultResizableForForm(scalarForm)}
                            onChange={(checked) => patch({ ...draft, resizable: checked })}
                            label="Resizable"
                            size="xs"
                        />
                        <HelpText icon={false}>Forces the resize handles. Uncheck to lock. When unset, follows the shape.</HelpText>
                    </div>
                    <div className="jj-field">
                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <label className="jj-field-label">Width</label>
                                <Input type="number" min={1} step={1} placeholder="auto"
                                    value={draft.defaultSize?.width ?? ''}
                                    onChange={(e) => patchDefaultSize('width', e.target.value)} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <label className="jj-field-label">Height</label>
                                <Input type="number" min={1} step={1} placeholder="auto"
                                    value={draft.defaultSize?.height ?? ''}
                                    onChange={(e) => patchDefaultSize('height', e.target.value)} />
                            </div>
                        </div>
                        <HelpText icon={false}>Size in px of every instance not resized by hand. Empty follows the content.</HelpText>
                    </div>
                </FormSection>

                <FormSection title="Visibility" divider={false}>
                    <div className="jj-field" data-testid="gv-visible">
                        <ConditionalEditor<boolean>
                            value={draft.visible}
                            onChange={(next) => patch(withVisible(draft, next))}
                            renderValue={(v, onCh) => <Toggle checked={v} onChange={onCh} label="Drawn" size="xs" />}
                            defaultValue={true}
                            features={features}
                            featuresHint={FEATURES_HINT}
                            classNames={classNames}
                            allowConditional={advanced}
                        />
                        <HelpText icon={false}>Off hides the container on the canvas; the object stays in the model and in the tree.</HelpText>
                    </div>
                </FormSection>
            </div>

            {/* ─────────── Text ─────────── */}
            <div className="ir-tab-body ir-tab-body--text" style={body('ir-text')}>
                <FormSection title="General" divider={false}>
                    <div className="jj-field">
                        <label className="jj-field-label">Label</label>
                        <Input value={draft.label ?? ''} onChange={(e) => patch({ ...draft, label: e.target.value })} />
                    </div>
                </FormSection>
                <FormSection title="Labels" divider={false}>
                    <LabelListEditor
                        labels={labels}
                        features={features}
                        featuresHint={FEATURES_HINT}
                        classNames={classNames}
                        allowConditional={advanced}
                        allowHeader
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

export default GraphVertexAuthoringPanel;
