import React from 'react';
import { Select } from '../Select';
import { Input } from '../Input';
import { NumberInput } from '../NumberInput';
import { Toggle } from '../Toggle';
import { PathBuilder, type PathBuilderFeatures } from '../PathBuilder';
import { singleHopOf } from '../../editor-v2/viewpoint/ir/pathExpr';
import { ListEditor } from '../ListEditor';
import {
    PREDICATE_KIND_OPTIONS,
    forPredicateKind,
    isLiteralOperand,
    attributeTypeToLiteralKind,
    type PredicateKind,
} from './predicateDefaults';
import type { Predicate, Literal, PathExpr } from '../../editor-v2/viewpoint/ir/irTypes';
import styles from './PredicateBuilder.module.css';

type LiteralKind = Literal['kind'];

const LITERAL_KIND_OPTIONS: { value: LiteralKind; label: string }[] = [
    { value: 'boolean', label: 'Booleano' },
    { value: 'number', label: 'Numero' },
    { value: 'string', label: 'Testo' },
];

const OPERAND_MODE_OPTIONS = [
    { value: 'path', label: 'Path' },
    { value: 'literal', label: 'Valore' },
];

/** Immutably move `arr[index]` by `delta`; out-of-range is a no-op (ListEditor contract). */
function moveItem<T>(arr: T[], index: number, delta: number): T[] {
    const target = index + delta;
    if (target < 0 || target >= arr.length) return arr;
    const copy = arr.slice();
    const [item] = copy.splice(index, 1);
    copy.splice(target, 0, item);
    return copy;
}

/** A clean Literal of the requested kind (kind switch resets the value, like forKind). */
function defaultLiteral(kind: LiteralKind): Literal {
    if (kind === 'boolean') return { kind: 'boolean', value: false };
    if (kind === 'number') return { kind: 'number', value: 0 };
    return { kind: 'string', value: '' };
}

/**
 * If `operand` is a PathExpr resolvable to a known-typed attribute of the target
 * metaclass, return the suggested literal kind for the *other* operand; else
 * undefined. Single-hop only (mirrors PathBuilder's authoring scope).
 */
function resolvePathLiteralType(
    operand: PathExpr | Literal,
    features: PathBuilderFeatures | null,
): LiteralKind | undefined {
    if (isLiteralOperand(operand) || !features) return undefined;
    // Shared grammar (ir/pathExpr) instead of a private regex; singleHopOf enforces
    // the single-hop scope this function already declares, and never throws.
    const hop = singleHopOf(operand);
    if (!hop) return undefined;
    const attr = features.attributes.find((a) => a.name === hop.feature);
    if (!attr) return undefined;
    return attributeTypeToLiteralKind(attr.type);
}

// ---- OperandEditor (internal, not exported) --------------------------------

interface OperandEditorProps {
    value: PathExpr | Literal;
    onChange: (next: PathExpr | Literal) => void;
    features: PathBuilderFeatures | null;
    featuresHint?: string;
    /** Preselected literal kind when switching path -> literal for the first time. */
    suggestedLiteralType?: LiteralKind;
}

const OperandEditor: React.FC<OperandEditorProps> = ({
    value,
    onChange,
    features,
    featuresHint,
    suggestedLiteralType,
}) => {
    const isLit = isLiteralOperand(value);
    const mode: 'path' | 'literal' = isLit ? 'literal' : 'path';

    const onModeChange = (next: string) => {
        if (next === mode) return;
        if (next === 'path') {
            // Empty path is a transient invalid state (validateIR/D4 gates the commit
            // upstream once wired in B2b-ii); PathBuilder shows its "pick a feature" hint.
            onChange('');
        } else {
            onChange(defaultLiteral(suggestedLiteralType ?? 'string'));
        }
    };

    return (
        <div className={styles.operand}>
            <Select
                className={styles.operandMode}
                options={OPERAND_MODE_OPTIONS}
                value={mode}
                onChange={(e) => onModeChange(e.target.value)}
            />
            {mode === 'path' ? (
                <PathBuilder
                    features={features}
                    value={value as string}
                    onChange={(expr) => onChange(expr)}
                    disabledHint={featuresHint}
                />
            ) : (
                (() => {
                    const lit = value as Literal;
                    return (
                        <div className={styles.row}>
                            <Select
                                className={styles.control}
                                options={LITERAL_KIND_OPTIONS}
                                value={lit.kind}
                                onChange={(e) => onChange(defaultLiteral(e.target.value as LiteralKind))}
                            />
                            {lit.kind === 'boolean' && (
                                <Toggle
                                    checked={lit.value}
                                    label="vero"
                                    onChange={(c) => onChange({ kind: 'boolean', value: c })}
                                    size="xs"
                                />
                            )}
                            {lit.kind === 'number' && (
                                <NumberInput
                                    value={lit.value}
                                    onChange={(n) => onChange({ kind: 'number', value: n })}
                                />
                            )}
                            {lit.kind === 'string' && (
                                <Input
                                    value={lit.value}
                                    onChange={(e) => onChange({ kind: 'string', value: e.target.value })}
                                />
                            )}
                        </div>
                    );
                })()
            )}
        </div>
    );
};

// ---- PredicateBuilder ------------------------------------------------------

export interface PredicateBuilderProps {
    value: Predicate;
    onChange: (next: Predicate) => void;
    /** Feature descriptors for the target metaclass; null = wildcard -> PathBuilder disabled. */
    features: PathBuilderFeatures | null;
    featuresHint?: string;
    /** Metaclass names offered for the `isKind` class selector. */
    classNames: string[];
}

/**
 * PredicateBuilder — recursive, grammar-constrained editor for a ViewpointIR
 * Predicate (authoring phase B2b-i). One Select chooses the kind (replacing the
 * node via forPredicateKind); the body renders kind-specific controls. `and`/`or`
 * nest via ListEditor + recursion; `not` nests a single child. Emits only shapes
 * the IR compiler accepts. Lives in the design-system layer (no editor-v2/redux
 * import beyond the erased `import type`).
 */
export const PredicateBuilder: React.FC<PredicateBuilderProps> = ({
    value,
    onChange,
    features,
    featuresHint,
    classNames,
}) => {
    const kind = value.op;

    const onKindChange = (next: string) => {
        onChange(forPredicateKind(next as PredicateKind, classNames));
    };

    const body = (): React.ReactNode => {
        switch (value.op) {
            case 'and':
            case 'or': {
                const group = value;
                return (
                    <div className={styles.nested}>
                        <ListEditor<Predicate>
                            items={group.args}
                            emptyHint="Nessuna condizione — aggiungine una."
                            addLabel="Aggiungi condizione"
                            itemLabel={(_, i) => `#${i + 1}`}
                            onAdd={() => onChange({ ...group, args: [...group.args, { op: 'literal', value: true }] })}
                            onRemove={(i) => onChange({ ...group, args: group.args.filter((_, idx) => idx !== i) })}
                            onMove={(i, delta) => onChange({ ...group, args: moveItem(group.args, i, delta) })}
                            renderItem={(arg, i) => (
                                <PredicateBuilder
                                    value={arg}
                                    onChange={(v) => onChange({ ...group, args: group.args.map((a, idx) => (idx === i ? v : a)) })}
                                    features={features}
                                    featuresHint={featuresHint}
                                    classNames={classNames}
                                />
                            )}
                        />
                    </div>
                );
            }
            case 'not': {
                const n = value;
                return (
                    <div className={styles.nested}>
                        <PredicateBuilder
                            value={n.arg}
                            onChange={(v) => onChange({ op: 'not', arg: v })}
                            features={features}
                            featuresHint={featuresHint}
                            classNames={classNames}
                        />
                    </div>
                );
            }
            case 'exists':
            case 'empty': {
                const e = value;
                return (
                    <PathBuilder
                        features={features}
                        value={e.path}
                        onChange={(expr) => onChange({ ...e, path: expr })}
                        disabledHint={featuresHint}
                    />
                );
            }
            case 'isKind': {
                const k = value;
                const hasPath = k.path !== undefined;
                return (
                    <div className={styles.operands}>
                        {classNames.length > 0 ? (
                            <Select
                                className={styles.control}
                                options={classNames.map((c) => ({ value: c, label: c }))}
                                value={k.class}
                                placeholder="Seleziona tipo…"
                                onChange={(e) => onChange({ ...k, class: e.target.value })}
                            />
                        ) : (
                            <Input
                                value={k.class}
                                placeholder="Nome del tipo"
                                onChange={(e) => onChange({ ...k, class: e.target.value })}
                            />
                        )}
                        <Toggle
                            checked={hasPath}
                            label="su un oggetto raggiunto da un path"
                            onChange={(c) =>
                                onChange(c ? { ...k, path: k.path ?? '' } : { op: 'isKind', class: k.class })
                            }
                            size="xs"
                        />
                        {hasPath && (
                            <PathBuilder
                                features={features}
                                value={k.path ?? ''}
                                onChange={(expr) => onChange({ ...k, path: expr })}
                                disabledHint={featuresHint}
                            />
                        )}
                    </div>
                );
            }
            case 'literal': {
                const l = value;
                return (
                    <Toggle
                        checked={l.value}
                        label="sempre vero"
                        onChange={(c) => onChange({ op: 'literal', value: c })}
                        size="xs"
                    />
                );
            }
            default: {
                // The six comparators (eq/neq/lt/lte/gt/gte): two operands.
                const c = value;
                return (
                    <div className={styles.operands}>
                        <div className={styles.operandBlock}>
                            <div className={styles.operandLabel}>Sinistra</div>
                            <OperandEditor
                                value={c.left}
                                onChange={(v) => onChange({ ...c, left: v })}
                                features={features}
                                featuresHint={featuresHint}
                                suggestedLiteralType={resolvePathLiteralType(c.right, features)}
                            />
                        </div>
                        <div className={styles.operandBlock}>
                            <div className={styles.operandLabel}>Destra</div>
                            <OperandEditor
                                value={c.right}
                                onChange={(v) => onChange({ ...c, right: v })}
                                features={features}
                                featuresHint={featuresHint}
                                suggestedLiteralType={resolvePathLiteralType(c.left, features)}
                            />
                        </div>
                    </div>
                );
            }
        }
    };

    return (
        <div className={styles.node}>
            <Select
                className={styles.kindSelect}
                options={PREDICATE_KIND_OPTIONS}
                value={kind}
                onChange={(e) => onKindChange(e.target.value)}
            />
            {body()}
        </div>
    );
};

export default PredicateBuilder;
