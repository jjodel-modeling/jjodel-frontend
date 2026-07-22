import React, { useEffect, useMemo, useRef, useState } from 'react';
import { LProject, type LViewElement } from '../../../../joiner';
import { Input, Select, NumberInput, ColorPicker, ErrorText, Button, HelpText, type PathBuilderFeatures } from '../../../ui';
import { getMetaclassInfo } from '../../hooks/useEditorMode';
import { validateIR } from '../ir/irValidate';
import { defaultObjectViewIR } from '../ir/irDefaults';
import type { VertexViewIR, ShapeForm } from '../ir/irTypes';
import { LabelListEditor } from './LabelListEditor';
import { FieldCompartmentListEditor } from './FieldCompartmentListEditor';
import { BadgeListEditor } from './BadgeListEditor';

export interface VertexAuthoringPanelProps {
    view: LViewElement;
}

const FORM_OPTIONS = [
    { value: 'rect', label: 'Rectangle' },
    { value: 'rounded', label: 'Rounded' },
    { value: 'ellipse', label: 'Ellipse' },
];
const BORDER_STYLE_OPTIONS = [
    { value: 'solid', label: 'Solid' },
    { value: 'dashed', label: 'Dashed' },
    { value: 'dotted', label: 'Dotted' },
];

const DEFAULT_BORDER = { color: '#334155', width: 1, style: 'solid' as const };
const COMMIT_DEBOUNCE_MS = 300;
const FEATURES_HINT = 'imposta una metaclasse per abilitare i path sulle feature';

/** Lossless deep clone for plain IR objects (pure JSON: no functions/dates). */
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

/** A field value is a Conditional<T> when it is an object carrying when/rules. */
function isConditional(x: unknown): boolean {
    return x !== null && typeof x === 'object' && ('when' in (x as any) || 'rules' in (x as any));
}

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
    // Basic/Advanced tab is pure local UI state — it never touches view.ir or the draft.
    const [tab, setTab] = useState<'basic' | 'advanced'>('basic');
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
    // Source: LProject metamodels (same as InfoData) — no M1 model id needed.
    const features = useMemo<PathBuilderFeatures | null>(() => {
        const mcs = draft.metaclasses;
        if (mcs === '*' || !Array.isArray(mcs) || mcs.length === 0) return null;
        const targetName = mcs[0];
        const metamodels = LProject.getProject()?.metamodels ?? [];
        for (const mm of metamodels) {
            let info;
            try { info = getMetaclassInfo((mm as any).id, (mm as any).id); } catch { continue; }
            const target = info.allClasses.find((c) => c.name === targetName);
            if (target) {
                return {
                    attributes: (target.allAttributes ?? target.attributes ?? []).map((a) => ({
                        name: a.name, type: a.type, upperBound: a.upperBound,
                    })),
                    references: (target.references ?? []).map((r) => ({
                        name: r.name, targetClassName: r.targetClassName, upperBound: r.upperBound,
                    })),
                };
            }
        }
        return null;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(draft.metaclasses)]);

    const shape = draft.shape;
    const form = shape.form;
    const fill = shape.fill;
    const labels = shape.labels ?? [];
    const badges = shape.badges ?? [];
    const fieldCompartments = draft.fieldCompartments ?? [];
    const border = shape.border ?? DEFAULT_BORDER;

    // --- immutable patch helpers ---
    const patchShape = (partial: Partial<VertexViewIR['shape']>) =>
        patch({ ...draft, shape: { ...draft.shape, ...partial } });
    const patchBorder = (partial: Partial<NonNullable<VertexViewIR['shape']['border']>>) => {
        const base = draft.shape.border ?? DEFAULT_BORDER;
        patchShape({ border: { ...base, ...partial } });
    };

    const conditionalPlaceholder = (
        <Input value="conditional (Advanced, next slice)" readOnly disabled />
    );

    return (
        <section className="properties-tab properties-panel">
            <div className="jj-field-label" style={{ marginTop: 4 }}>IR View authoring</div>

            {/* Basic / Advanced tabs — segmented control (pure local UI state). */}
            <div className="jj-field" style={{ display: 'flex', gap: 'var(--spacing-1)', marginBottom: 8 }}>
                <Button variant={tab === 'basic' ? 'primary' : 'ghost'} size="sm" onClick={() => setTab('basic')}>Basic</Button>
                <Button variant={tab === 'advanced' ? 'primary' : 'ghost'} size="sm" onClick={() => setTab('advanced')}>Advanced</Button>
            </div>

            {error && <ErrorText>{error}</ErrorText>}

            {tab === 'basic' && (
                <>
                    {/* View label (IR label field, distinct from the DViewElement name) */}
                    <div className="jj-field">
                        <label className="jj-field-label">Label</label>
                        <Input value={draft.label ?? ''} onChange={(e) => patch({ ...draft, label: e.target.value })} />
                    </div>

                    {/* Shape form */}
                    <div className="jj-field">
                        <label className="jj-field-label">Shape</label>
                        {isConditional(form)
                            ? conditionalPlaceholder
                            : <Select options={FORM_OPTIONS} value={form as string} onChange={(e) => patchShape({ form: e.target.value as ShapeForm })} />}
                    </div>

                    {/* Fill */}
                    <div className="jj-field">
                        <label className="jj-field-label">Fill</label>
                        {isConditional(fill)
                            ? conditionalPlaceholder
                            : <ColorPicker value={(fill as string) ?? ''} onChange={(hex) => patchShape({ fill: hex })} />}
                    </div>

                    {/* Border (always scalar in the schema) */}
                    <div className="jj-field">
                        <label className="jj-field-label">Border</label>
                        <ColorPicker value={border.color} onChange={(hex) => patchBorder({ color: hex })} />
                        <NumberInput value={border.width} min={0} onChange={(w) => patchBorder({ width: w })} />
                        <Select options={BORDER_STYLE_OPTIONS} value={border.style} onChange={(e) => patchBorder({ style: e.target.value as 'solid' | 'dashed' | 'dotted' })} />
                    </div>

                    {/* Labels — full list (includes the former primary label at index 0) */}
                    <div className="jj-field-label" style={{ marginTop: 8 }}>Labels</div>
                    <LabelListEditor
                        labels={labels}
                        features={features}
                        featuresHint={FEATURES_HINT}
                        onChange={(next) => patchShape({ labels: next })}
                    />

                    {/* Field compartments */}
                    <div className="jj-field-label" style={{ marginTop: 8 }}>Field compartments</div>
                    <FieldCompartmentListEditor
                        compartments={fieldCompartments}
                        onChange={(next) => patch({ ...draft, fieldCompartments: next })}
                    />

                    {/* Badges */}
                    <div className="jj-field-label" style={{ marginTop: 8 }}>Badges</div>
                    <BadgeListEditor
                        badges={badges}
                        onChange={(next) => patchShape({ badges: next })}
                    />
                </>
            )}

            {tab === 'advanced' && (
                <div className="jj-field" style={{ marginTop: 8 }}>
                    <HelpText>Il builder per le regole condizionali (when/then/else, rules) su forma, fill, badge, label e compartimenti arriva nella Fase B2b.</HelpText>
                </div>
            )}
        </section>
    );
};

export default VertexAuthoringPanel;
