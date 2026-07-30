import React from 'react';
import {
    Toggle,
    NumberInput,
    HelpText,
    Button,
    Select,
    PredicateBuilder,
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
        <>
            {/* Header */}
            <div className="jj-field-label" style={{ marginTop: 4 }}>Matching</div>
            <HelpText>Questi campi decidono quando la view si applica; per le view IR sostituiscono il tab Apply-to, che su di esse non ha effetto.</HelpText>

            {/* Metaclasses */}
            <div className="jj-field" style={{ marginTop: 8 }}>
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
                            <HelpText>Con la lista vuota la view non si applica a nulla.</HelpText>
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
                <HelpText>Cambiare metaclasse non invalida i path già scritti nei predicate o nei campi condizionali; i path non risolvibili sulla nuova metaclasse falliscono silenziosamente a runtime (nessun match). Le feature del PathBuilder si risolvono dalla prima metaclasse della lista.</HelpText>
            </div>

            {/* Predicate (top-level) */}
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
                            featuresHint={featuresHint}
                            classNames={classNames}
                        />
                    </div>
                )}
                {!hasPredicate && (
                    <HelpText>Senza predicate la view si applica a ogni istanza delle metaclassi selezionate.</HelpText>
                )}
            </div>

            {/* Priority */}
            <div className="jj-field" style={{ marginTop: 8 }}>
                <label className="jj-field-label">Priorità</label>
                <NumberInput
                    value={draft.priority ?? 0}
                    onChange={(n) => patch({ ...draft, priority: n })}
                />
                <HelpText>Vince la priorità più alta; a parità, la specificità (esatta &gt; ereditata &gt; wildcard), poi l'ordine di dichiarazione.</HelpText>
            </div>

            {/* Exclusive */}
            <div className="jj-field" style={{ marginTop: 8 }}>
                <label className="jj-field-label">Esclusiva</label>
                <Toggle
                    checked={draft.exclusive ?? true}
                    onChange={(c) => patch({ ...draft, exclusive: c })}
                    label="exclusive"
                    size="xs"
                />
                <HelpText>Le view decorative (exclusive disattivato) non sono ancora supportate dal resolver IR: disattivandolo la view sparisce dal canvas (limite corrente).</HelpText>
            </div>
        </>
    );
};

export default MatchingSection;
