import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Toggle } from '../Toggle';
import { SegmentedControl } from '../SegmentedControl';
import { PredicateBuilder } from '../PredicateBuilder';
import type { PathBuilderFeatures } from '../PathBuilder';
import { isConditionalValue, toRules, fromRules, formatPredicate, type RulesForm } from './conditional';
import type { Conditional, Predicate } from '../../editor-v2/viewpoint/ir/irTypes';
import styles from './ConditionalEditor.module.css';

/**
 * The two modes of the switch, in bar order. Kept module-level so the array
 * identity is stable across renders. The VALUES are the component's existing
 * internal mode vocabulary ('fixed' / 'conditional') — unchanged; only the
 * rendering moved to the shared primitive.
 */
const MODE_OPTIONS: { value: 'fixed' | 'conditional'; label: string }[] = [
    { value: 'fixed', label: 'Fixed' },
    { value: 'conditional', label: 'Conditional' },
];

export interface ConditionalEditorProps<T> {
    value: Conditional<T> | undefined;
    onChange: (next: Conditional<T> | undefined) => void;
    /** Renders the editor for a fixed value of T (Fixed mode, then-branch, else-branch). */
    renderValue: (value: T, onChange: (v: T) => void) => React.ReactNode;
    /** Fallback used when seeding from undefined / an absent else. */
    defaultValue: T;
    features: PathBuilderFeatures | null;
    featuresHint?: string;
    classNames: string[];
    /**
     * Whether the Fixed/Conditional switch is offered. Default `true`, so every
     * call-site that does not pass it behaves exactly as before.
     *
     * `false` (Basic disclosure mode) hides the switch: a fixed value renders as a
     * plain editor with no affordance to go conditional, and a value that is ALREADY
     * conditional renders as a read-only chip. The value itself is never coerced —
     * handing a Conditional object to `renderValue` would render the raw object.
     */
    allowConditional?: boolean;
    /**
     * Opt-in to the rules editor (Symbol Editor 1b, slice 1): the Conditional mode
     * edits `rules[]` as a table, and every edit writes the `rules` form. Absent,
     * the editor is exactly today's `{when, then, else}` body with the multi-rule
     * chip, so a call site that does not pass it is unaffected.
     */
    rulesTable?: RulesTableOptions<T>;
}

/** Per-axis configuration of the rules editor. Every field is optional. */
export interface RulesTableOptions<T> {
    /**
     * The value that means "nothing" on this axis ('' for fill and marker). Present,
     * the switch becomes None | Fixed | Conditional and None removes the axis.
     */
    noneValue?: T;
    /** Label of the middle segment. Default 'Fixed'. */
    fixedLabel?: string;
    /** Target metaclass name ('State'): empty-state copy and the rule-row path prefix. */
    subjectName?: string;
    /** Noun of the value ('fill'): the THEN header and the empty-state copy. */
    valueNoun?: string;
}

/**
 * ConditionalEditor<T> — wraps any scalar value editor with a Fixed/Conditional
 * toggle (authoring phase B2b-i). Fixed mode delegates entirely to `renderValue`;
 * Conditional mode exposes a PredicateBuilder for `when`, `renderValue` for
 * `then`, and an optional `else` branch. Without `rulesTable` the multi-rule
 * (`rules`) form is not editable: it renders as a read-only chip and round-trips
 * verbatim (never coerced into `when/then/else`). With `rulesTable` both forms are
 * edited as a rules table (RulesModeEditor below).
 *
 * Design-system layer: only the erased `import type` couples it to the IR.
 */
export function ConditionalEditor<T>({
    value,
    onChange,
    renderValue,
    defaultValue,
    features,
    featuresHint,
    classNames,
    allowConditional = true,
    rulesTable,
}: ConditionalEditorProps<T>): React.ReactElement {
    const isCond = isConditionalValue(value);
    const isRules = isCond && 'rules' in (value as any);
    const isWhen = isCond && 'when' in (value as any);
    const mode: 'fixed' | 'conditional' = isWhen ? 'conditional' : 'fixed';

    // Multi-rule form, without the rules editor: preserved verbatim as a chip.
    if (isRules && !rulesTable) {
        return <span className={styles.chip}>conditional (multiple rules, not yet editable)</span>;
    }

    // Basic disclosure mode: no switch. An already-conditional value gets the same
    // read-only chip treatment as the multi-rule form — shown, never rewritten, and
    // editable again as soon as the mode goes back to Advanced. (Without
    // `rulesTable` a `rules` value returned above, so `isCond` is `isWhen` here.)
    if (!allowConditional) {
        if (isCond) {
            return <span className={styles.chip}>conditional (edit in Advanced mode)</span>;
        }
        return (
            <div className={styles.wrapper}>
                {renderValue((value as T) ?? defaultValue, (v) => onChange(v))}
            </div>
        );
    }

    if (rulesTable) {
        return (
            <RulesModeEditor<T>
                value={value}
                onChange={onChange}
                renderValue={renderValue}
                defaultValue={defaultValue}
                features={features}
                featuresHint={featuresHint}
                classNames={classNames}
                options={rulesTable}
            />
        );
    }

    const switchToFixed = () => {
        if (mode === 'fixed') return;
        // Take the then-branch as the new fixed value; the predicate is discarded
        // (explicit user action, not silent loss).
        onChange((value as { then: T }).then);
    };
    const switchToConditional = () => {
        if (mode === 'conditional') return;
        const base = (value ?? defaultValue) as T;
        onChange({ when: { op: 'literal', value: true }, then: base });
    };

    return (
        <div className={styles.wrapper}>
            {/* Segmented switch, not two buttons: the pair is one mode selector with a
                single active choice, which the raised pill states directly. Rendered by
                the shared `SegmentedControl` primitive (U-6, ratifica 2026-08-08 Q3
                opzione b), so this control and every future exclusive choice read as one
                pattern. No `icon` on either option: the ratifica is explicit that this
                control carries no glyph, and therefore no cyan. */}
            <SegmentedControl
                options={MODE_OPTIONS}
                value={mode}
                onChange={(next) => (next === 'fixed' ? switchToFixed() : switchToConditional())}
                ariaLabel="Value mode"
            />

            {mode === 'fixed' && renderValue((value as T) ?? defaultValue, (v) => onChange(v))}

            {mode === 'conditional' && (() => {
                const cond = value as { when: Predicate; then: T; else?: T };
                const hasElse = cond.else !== undefined;
                return (
                    <div className={styles.conditional}>
                        <div className={styles.section}>
                            <div className={styles.sectionLabel}>When</div>
                            <PredicateBuilder
                                value={cond.when}
                                onChange={(w) => onChange({ ...cond, when: w })}
                                features={features}
                                featuresHint={featuresHint}
                                classNames={classNames}
                            />
                        </div>
                        <div className={styles.section}>
                            <div className={styles.sectionLabel}>Then</div>
                            {renderValue(cond.then, (t) => onChange({ ...cond, then: t }))}
                        </div>
                        <Toggle
                            checked={hasElse}
                            label="Include else branch"
                            onChange={(c) => {
                                if (c) onChange({ ...cond, else: cond.else ?? defaultValue });
                                // Drop the else key entirely (no placeholder) — rebuild without it.
                                else onChange({ when: cond.when, then: cond.then });
                            }}
                            size="xs"
                        />
                        {hasElse && (
                            <div className={styles.section}>
                                <div className={styles.sectionLabel}>Otherwise</div>
                                {renderValue(cond.else ?? defaultValue, (e) => onChange({ ...cond, else: e }))}
                            </div>
                        )}
                    </div>
                );
            })()}
        </div>
    );
}

// ---- Rules editor (Symbol Editor 1b, slice 1: mockup 2b and 2i) ----------------

type RulesMode = 'none' | 'fixed' | 'conditional';

const WHEN_POPOVER_WIDTH = 340;

/** Fixed-positioned geometry of the WHEN popover from its trigger (portal to body),
 *  same scheme as the typography popover: below the trigger, flipped above when
 *  the room below is short, clamped horizontally into the viewport. */
function whenPopoverStyle(rect: DOMRect): React.CSSProperties {
    const MARGIN = 8;
    const below = window.innerHeight - rect.bottom - MARGIN;
    const above = rect.top - MARGIN;
    const left = Math.max(MARGIN, Math.min(rect.left, window.innerWidth - WHEN_POPOVER_WIDTH - MARGIN));
    const base: React.CSSProperties = { left, width: WHEN_POPOVER_WIDTH };
    if (below >= 240 || below >= above) return { ...base, top: rect.bottom + 4, maxHeight: below - 4 };
    return { ...base, bottom: window.innerHeight - rect.top + 4, maxHeight: above - 4 };
}

interface RulesModeEditorProps<T> {
    value: Conditional<T> | undefined;
    onChange: (next: Conditional<T> | undefined) => void;
    renderValue: (value: T, onChange: (v: T) => void) => React.ReactNode;
    defaultValue: T;
    features: PathBuilderFeatures | null;
    featuresHint?: string;
    classNames: string[];
    options: RulesTableOptions<T>;
}

/**
 * The `rulesTable` body of ConditionalEditor. The mode is derived from the value
 * (the panel re-seeds from the store after a commit), with one exception kept in
 * local state: None → Fixed writes nothing until the author picks a value, since a
 * fixed none value is indistinguishable from None.
 *
 * Conditional edits the normal form of `toRules` and writes through `fromRules`,
 * so an old `{when, then, else}` is rewritten only on the first real edit, never
 * on open. Rule order is semantics (first match wins): up/down rewrite `rules`.
 */
function RulesModeEditor<T>({
    value,
    onChange,
    renderValue,
    defaultValue,
    features,
    featuresHint,
    classNames,
    options,
}: RulesModeEditorProps<T>): React.ReactElement {
    const { noneValue, fixedLabel = 'Fixed', subjectName, valueNoun } = options;
    const hasNone = noneValue !== undefined;
    const isCond = isConditionalValue(value);
    const isNone = !isCond && hasNone && (value === undefined || value === noneValue);

    const [solidPending, setSolidPending] = useState(false);
    const [editingDefault, setEditingDefault] = useState(false);
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    const mode: RulesMode = isCond ? 'conditional' : (isNone && !solidPending) ? 'none' : 'fixed';

    const modeOptions = useMemo<{ value: RulesMode; label: string }[]>(() => [
        ...(hasNone ? [{ value: 'none' as const, label: 'None' }] : []),
        { value: 'fixed', label: fixedLabel },
        { value: 'conditional', label: 'Conditional' },
    ], [hasNone, fixedLabel]);

    const form: RulesForm<T> = toRules(value);
    const rules = form.rules;
    const popoverOpen = mode === 'conditional' && openIndex !== null && openIndex < rules.length;

    // While the WHEN popover is open: close on outside mousedown, Esc and scroll of
    // any ancestor (capture). Esc stops there, so the modal hosting the panel stays open.
    useEffect(() => {
        if (!popoverOpen) return;
        const onDocMouseDown = (e: MouseEvent) => {
            const t = e.target as Node;
            if (popoverRef.current?.contains(t) || triggerRef.current?.contains(t)) return;
            setOpenIndex(null);
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return;
            e.stopPropagation();
            setOpenIndex(null);
        };
        const onScroll = (e: Event) => {
            if (popoverRef.current?.contains(e.target as Node)) return;
            setOpenIndex(null);
        };
        document.addEventListener('mousedown', onDocMouseDown, true);
        document.addEventListener('keydown', onKey, true);
        window.addEventListener('scroll', onScroll, true);
        return () => {
            document.removeEventListener('mousedown', onDocMouseDown, true);
            document.removeEventListener('keydown', onKey, true);
            window.removeEventListener('scroll', onScroll, true);
        };
    }, [popoverOpen]);

    /** A none value is written as absence: the canonical spelling (D2). */
    const writeScalar = (v: T) => onChange(hasNone && v === noneValue ? undefined : v);
    const write = (next: RulesForm<T>) => onChange(fromRules(next, { noneValue, fallback: defaultValue }));

    const setMode = (next: RulesMode) => {
        if (next === mode) return;
        setOpenIndex(null);
        if (next === 'none') {
            setSolidPending(false);
            onChange(undefined);
            return;
        }
        if (next === 'fixed') {
            // Keep the Fixed segment even when the value written is none.
            setSolidPending(true);
            if (mode === 'none') return;
            // Collapse Conditional: the first rule's value, else the default.
            writeScalar(rules[0]?.then ?? form.default ?? defaultValue);
            return;
        }
        // Conditional: the current scalar moves into `default` (none included, which
        // is the 2i encoding `{rules: [], default: noneValue}`).
        setSolidPending(false);
        setEditingDefault(false);
        const base = isNone ? (noneValue as T) : ((value as T | undefined) ?? defaultValue);
        onChange(fromRules<T>({ rules: [], default: base }, { noneValue, fallback: defaultValue }));
    };

    const subject = subjectName ? subjectName.charAt(0).toLowerCase() + subjectName.slice(1) : undefined;
    const subjectLabel = subjectName ?? 'instance';

    const replaceRule = (i: number, rule: { when: Predicate; then: T }) =>
        write({ ...form, rules: rules.map((r, j) => (j === i ? rule : r)) });
    const removeRule = (i: number) => {
        setOpenIndex(null);
        write({ ...form, rules: rules.filter((_, j) => j !== i) });
    };
    const moveRule = (i: number, delta: number) => {
        const j = i + delta;
        if (j < 0 || j >= rules.length) return;
        const next = rules.slice();
        [next[i], next[j]] = [next[j], next[i]];
        setOpenIndex(null);
        write({ ...form, rules: next });
    };
    const addRule = () =>
        write({ ...form, rules: [...rules, { when: { op: 'literal', value: true }, then: form.default ?? defaultValue }] });

    // A default equal to the none value renders as None, like an absent one.
    const hasRealDefault = form.default !== undefined && !(hasNone && form.default === noneValue);
    const clearDefault = () => {
        setEditingDefault(false);
        const { default: _dropped, ...rest } = form;
        write(rest);
    };

    const toggleWhen = (i: number, el: HTMLButtonElement) => {
        if (openIndex === i) {
            setOpenIndex(null);
            return;
        }
        triggerRef.current = el;
        setOpenIndex(i);
    };

    const otherwiseRow = (
        <div className={styles.ruleRow}>
            <span />
            <span className={styles.otherwiseLabel}>Otherwise</span>
            <i className={`bi bi-arrow-right ${styles.ruleArrow}`} aria-hidden="true" />
            <div className={styles.ruleThen}>
                {hasRealDefault || editingDefault
                    ? renderValue(form.default ?? noneValue ?? defaultValue, (v) => write({ ...form, default: v }))
                    : (
                        <button
                            type="button"
                            className={styles.defaultNone}
                            onClick={() => setEditingDefault(true)}
                            title="Set a default"
                        >
                            {hasNone ? 'None' : 'Not set'}
                        </button>
                    )}
            </div>
            {hasRealDefault ? (
                <button type="button" className={styles.ruleIconBtn} aria-label="Clear default" title="Clear default" onClick={clearDefault}>
                    <i className="bi bi-x-lg" aria-hidden="true" />
                </button>
            ) : <span />}
        </div>
    );

    const popStyle = popoverOpen && triggerRef.current
        ? whenPopoverStyle(triggerRef.current.getBoundingClientRect())
        : undefined;

    return (
        <div className={styles.wrapper}>
            <SegmentedControl
                options={modeOptions}
                value={mode}
                onChange={setMode}
                ariaLabel="Value mode"
            />

            {mode === 'fixed' && renderValue((value as T | undefined) ?? noneValue ?? defaultValue, writeScalar)}

            {mode === 'conditional' && (
                <div className={styles.rules}>
                    {rules.length === 0 ? (
                        <div className={styles.rulesEmpty}>
                            <div className={styles.rulesEmptyTitle}>
                                No rules yet, every {subjectLabel} uses the default below
                            </div>
                            <div className={styles.rulesEmptyBody}>
                                A rule is a boolean expression on the {subjectLabel} plus a {valueNoun ?? 'value'}.
                                Rules are checked top to bottom; the first true one wins.
                            </div>
                            <button type="button" className={styles.addRuleBtn} onClick={addRule}>
                                <i className="bi bi-plus-lg" aria-hidden="true" /> Add first rule
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className={styles.rulesCaption}>Top to bottom · first match wins</div>
                            <div className={`${styles.ruleRow} ${styles.ruleHeader}`}>
                                <span />
                                <span>When</span>
                                <span />
                                <span>{valueNoun ? `Then ${valueNoun}` : 'Then'}</span>
                                <span />
                            </div>
                            {rules.map((rule, i) => {
                                const text = formatPredicate(rule.when, { subject });
                                return (
                                    <div key={i} className={styles.ruleRow}>
                                        <div className={styles.ruleMove}>
                                            <button
                                                type="button"
                                                className={styles.ruleIconBtn}
                                                aria-label="Move rule up"
                                                disabled={i === 0}
                                                onClick={() => moveRule(i, -1)}
                                            >
                                                <i className="bi bi-arrow-up" aria-hidden="true" />
                                            </button>
                                            <button
                                                type="button"
                                                className={styles.ruleIconBtn}
                                                aria-label="Move rule down"
                                                disabled={i === rules.length - 1}
                                                onClick={() => moveRule(i, 1)}
                                            >
                                                <i className="bi bi-arrow-down" aria-hidden="true" />
                                            </button>
                                        </div>
                                        <button
                                            type="button"
                                            className={`${styles.ruleWhen}${openIndex === i ? ` ${styles.ruleWhenOpen}` : ''}`}
                                            title={text}
                                            aria-haspopup="dialog"
                                            aria-expanded={openIndex === i}
                                            onClick={(e) => toggleWhen(i, e.currentTarget)}
                                        >
                                            {text}
                                        </button>
                                        <i className={`bi bi-arrow-right ${styles.ruleArrow}`} aria-hidden="true" />
                                        <div className={styles.ruleThen}>
                                            {renderValue(rule.then, (t) => replaceRule(i, { ...rule, then: t }))}
                                        </div>
                                        <button
                                            type="button"
                                            className={styles.ruleIconBtn}
                                            aria-label="Remove rule"
                                            title="Remove rule"
                                            onClick={() => removeRule(i)}
                                        >
                                            <i className="bi bi-x-lg" aria-hidden="true" />
                                        </button>
                                    </div>
                                );
                            })}
                        </>
                    )}

                    {otherwiseRow}

                    {rules.length > 0 && (
                        <button type="button" className={styles.addRuleBtn} onClick={addRule}>
                            <i className="bi bi-plus-lg" aria-hidden="true" /> Add rule
                        </button>
                    )}
                </div>
            )}

            {popoverOpen && popStyle && createPortal(
                <div ref={popoverRef} className={styles.whenPopover} style={popStyle} role="dialog" aria-label="Rule condition">
                    <div className={styles.sectionLabel}>When</div>
                    <PredicateBuilder
                        value={rules[openIndex as number].when}
                        onChange={(w) => replaceRule(openIndex as number, { ...rules[openIndex as number], when: w })}
                        features={features}
                        featuresHint={featuresHint}
                        classNames={classNames}
                    />
                </div>,
                document.body,
            )}
        </div>
    );
}

export default ConditionalEditor;
