import React from 'react';
import {
    Toggle,
    NumberInput,
    HelpText,
    Button,
    Select,
    PredicateBuilder,
    FormSection,
    forPredicateKind,
    type PathBuilderFeatures,
} from '../../../ui';
import type { VertexViewIR } from '../ir/irTypes';

export interface MatchingSectionProps {
    draft: VertexViewIR;
    patch: (next: VertexViewIR) => void;
    features: PathBuilderFeatures | null;
    featuresHint: string;
    classNames: string[];
}

/**
 * MatchingSection — authors the top-level matching fields of a vertex view IR
 * (metaclasses / predicate / priority / exclusive): the "when does this view
 * apply" half of the authoring panel. Lives in the Advanced tab; Basic answers
 * "how the view looks", this answers "when it is selected".
 *
 * Presentational and stateless on the draft (mirrors the panel's immutable
 * cycle): it reads `draft` and re-patches via `patch`. The panel's eager
 * validate + debounced commit already covers these fields — no extra plumbing.
 *
 * For IR views this replaces the classic Apply-to tab, which the IR resolver
 * ignores (it reads ir.metaclasses / ir.predicate, not appliableToClasses).
 */
export const MatchingSection: React.FC<MatchingSectionProps> = ({
    draft,
    patch,
    features,
    featuresHint,
    classNames,
}) => {
    const mcs = draft.metaclasses;
    const isWildcard = mcs === '*';
    const list = Array.isArray(mcs) ? mcs : [];
    const available = classNames.filter((n) => !list.includes(n));
    const hasPredicate = draft.predicate !== undefined;

    // --- metaclasses handlers ---
    const setWildcard = (checked: boolean) =>
        patch({ ...draft, metaclasses: checked ? '*' : [] });
    const removeMetaclass = (idx: number) =>
        patch({ ...draft, metaclasses: list.filter((_, i) => i !== idx) });
    const addMetaclass = (name: string) => {
        if (!name || list.includes(name)) return;
        patch({ ...draft, metaclasses: [...list, name] });
    };

    // --- predicate handlers ---
    const setHasPredicate = (checked: boolean) => {
        if (checked) {
            // Seed the same default ConditionalEditor uses (a `literal true`).
            patch({ ...draft, predicate: forPredicateKind('literal') });
        } else {
            // Drop the KEY (mirrors ConditionalEditor's else removal), not
            // `predicate: undefined` — keeps the ir byte-identical to a view
            // authored without any predicate.
            const { predicate, ...rest } = draft;
            patch(rest as VertexViewIR);
        }
    };

    return (
        <FormSection title="Matching" divider={false}>
            <HelpText>These fields decide when the view applies; for IR views they replace the Apply-to tab, which has no effect on them.</HelpText>

            {/* Metaclasses */}
            <div className="jj-field">
                <label className="jj-field-label">Metaclasses</label>
                <Toggle
                    checked={isWildcard}
                    onChange={setWildcard}
                    label="All metaclasses (*)"
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
                                <Button variant="ghost" size="sm" onClick={() => removeMetaclass(idx)} title="Remove">
                                    <i className="bi bi-x" aria-hidden="true" />
                                </Button>
                            </div>
                        ))}
                        {list.length === 0 && (
                            <HelpText>With an empty list the view applies to nothing.</HelpText>
                        )}
                        <div style={{ marginTop: 4 }}>
                            <Select
                                options={available.map((n) => ({ value: n, label: n }))}
                                value=""
                                placeholder="Add metaclass…"
                                onChange={(e) => addMetaclass(e.target.value)}
                            />
                        </div>
                    </>
                )}
                <HelpText>Changing metaclass does not invalidate paths already written in predicates or conditional fields; paths that cannot be resolved on the new metaclass fail silently at runtime (no match). PathBuilder features are resolved from the first metaclass in the list.</HelpText>
            </div>

            {/* Predicate (top-level) */}
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
                            featuresHint={featuresHint}
                            classNames={classNames}
                        />
                    </div>
                )}
                {!hasPredicate && (
                    <HelpText>Without a predicate the view applies to every instance of the selected metaclasses.</HelpText>
                )}
            </div>

            {/* Priority */}
            <div className="jj-field">
                <label className="jj-field-label">Priority</label>
                <NumberInput
                    value={draft.priority ?? 0}
                    onChange={(n) => patch({ ...draft, priority: n })}
                />
                <HelpText>The highest priority wins; on a tie, specificity (exact &gt; inherited &gt; wildcard), then declaration order.</HelpText>
            </div>

            {/* Exclusive */}
            <div className="jj-field">
                <label className="jj-field-label">Exclusive</label>
                <Toggle
                    checked={draft.exclusive ?? true}
                    onChange={(c) => patch({ ...draft, exclusive: c })}
                    label="exclusive"
                    size="xs"
                />
                <HelpText>Decorative views (exclusive off) are not supported by the IR resolver yet: turning it off makes the view disappear from the canvas (current limitation).</HelpText>
            </div>
        </FormSection>
    );
};

export default MatchingSection;
