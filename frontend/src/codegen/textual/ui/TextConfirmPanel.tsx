/**
 * TextConfirmPanel — what an edited text needs confirmed before it is applied (R-TXT-18, R-TXT-26, step T6b,
 * P-2026-11-03-0021): the uncertain matches (a homonym paired by order, an object matched by similarity, an object
 * matched elsewhere in the model) and the deletions of objects another model references, flagged. One row per object:
 * the model's object, the text's, and the reason; one confirm action for all of them. Nothing is applied until then.
 *
 * The panel lies over the bottom of the editor, so its appearing moves no line of the text. It shows only when every
 * refusal of the plan is one a user may confirm (textDiff.ts `CONFIRMABLE`): a confirmation that could not apply the
 * text is not asked for.
 *
 * T8c (P-2026-11-08-0739; R-TXT-55 F10): one panel for an edit and a re-import. `panelRows` reads the plan's rows
 * (textDiff.ts `planRows`): the counts at the top, a checkbox per uncertain pairing with its score (unticked, the
 * pairing applies as a creation and a deletion), the changes, the creations and the deletions, one another model
 * references in the error colour. Cancel closes the panel and applies nothing.
 */

import type { ReactNode } from 'react';
import type { ConcreteGrammar } from '../concreteGrammar';
import type { TextMetamodel, TextObject } from '../metamodel';
import type { TextParseResult } from '../parser';
import { CONFIRMABLE, deletedObjects, planRows } from '../textDiff';
import type { Pairing, PlanCounts, PlanRow, TextEditPlan } from '../textDiff';
import { identityOf } from '../textMatch';

/** One line of the panel. */
export interface ConfirmRow {
    /** The model's object, `Class name`. */
    readonly old: string;
    /** The text's object; null for a deletion. */
    readonly new: string | null;
    readonly reason: string;
    /** A deletion of an object another model references (R-TXT-26). */
    readonly flagged: boolean;
    /** T8c: an uncertain pairing, its score and whether it is ticked; absent on any other row. */
    readonly pairing?: Pairing & { readonly score: number; readonly ticked: boolean };
}

/** What the rows are read from: the plan, the parse it was made of, and the model as the text was printed from it. */
export interface ConfirmInput {
    readonly plan: TextEditPlan;
    readonly parsed: TextParseResult;
    readonly mm: TextMetamodel;
    readonly grammar: ConcreteGrammar;
    readonly model: readonly TextObject[];
    readonly referencedElsewhere?: ReadonlySet<string>;
}

const labelOf = (g: ConcreteGrammar, o: TextObject | undefined, index: number | null = null): string => {
    if (!o) return '?';
    const name = identityOf(g, o);
    return name === null ? `${o.cls} (unnamed)${index === null ? '' : ` ${index}`}` : `${o.cls} ${name}`;
};

/**
 * Lane TABFIX (P-2026-11-08-0859): per entry, in text order, the class of an unnamed object (null for a named one), its
 * index among the unnamed of its class, null when it is the only one: the label takes an index only where it would repeat.
 */
export function homonymIndexes(classes: readonly (string | null)[]): (number | null)[] {
    const totals = new Map<string, number>();
    for (const c of classes) if (c !== null) totals.set(c, (totals.get(c) ?? 0) + 1);
    const seen = new Map<string, number>();
    return classes.map(c => {
        if (c === null || totals.get(c)! < 2) return null;
        const n = (seen.get(c) ?? 0) + 1;
        seen.set(c, n);
        return n;
    });
}

/** Whether the plan's refusals are all confirmable, and there is one at least: the panel's condition. */
export function needsConfirmation(plan: TextEditPlan): boolean {
    return plan.refusals.length > 0 && plan.refusals.every(r => CONFIRMABLE.includes(r.code));
}

/** The panel's rows: the uncertain matches in text order, then the deletions other models reference, in model order. */
export function confirmRows(input: ConfirmInput): ConfirmRow[] {
    const { plan, grammar: g } = input;
    if (!plan.diff) return [];
    const modelById = new Map(input.model.map(o => [o.id, o]));
    const textById = new Map(input.parsed.objects.map(o => [o.id, o]));
    const rows: ConfirmRow[] = [];
    for (const m of plan.diff.match.matches) {
        if (!m.uncertain) continue;
        const reason = m.by === 'homonym' ? 'same name, paired by order'
            : m.by === 'rename' ? `renamed, ${Math.round((m.score ?? 0) * 100)}% of the values equal`
                : 'same name, elsewhere in the model';
        rows.push({ old: labelOf(g, modelById.get(m.model)), new: labelOf(g, textById.get(m.text)), reason, flagged: false });
    }
    const elsewhere = input.referencedElsewhere;
    if (elsewhere?.size) {
        const gone = deletedObjects(input.mm, input.model, plan.diff.ops);
        for (const o of input.model) {
            if (gone.has(o.id) && elsewhere.has(o.id)) rows.push({ old: labelOf(g, o), new: null, reason: 'deleted, referenced from another model', flagged: true });
        }
    }
    return rows;
}

/** T8c: the panel's rows and counts, for an edit and a re-import alike, from the plan's rows (textDiff.ts `planRows`). */
export function panelRows(input: ConfirmInput): { readonly rows: ConfirmRow[]; readonly counts: PlanCounts } {
    const { plan, grammar: g } = input;
    if (!plan.diff) return { rows: [], counts: { changes: 0, creates: 0, deletes: 0 } };
    const modelById = new Map(input.model.map(o => [o.id, o]));
    const textById = new Map(input.parsed.objects.map(o => [o.id, o]));
    const planned = planRows({ diff: plan.diff, mm: input.mm, grammar: g, model: input.model, parsed: input.parsed,
        ...(input.referencedElsewhere ? { referencedElsewhere: input.referencedElsewhere } : {}) });
    // TABFIX: the index follows the text, not the rows, which list the creations and the deletions apart; a deletion, which
    // has no place in the text, comes after, in model order. A pair's two cells read one index.
    const textAt = new Map(input.parsed.objects.map((o, i) => [o.id, i]));
    const modelAt = new Map(input.model.map((o, i) => [o.id, i]));
    const place = (r: PlanRow): number => (r.kind === 'delete' ? input.parsed.objects.length + (modelAt.get(r.model) ?? 0) : textAt.get(r.text) ?? 0);
    const unnamed = (r: PlanRow): string | null => [r.kind === 'delete' ? undefined : textById.get(r.text), r.kind === 'create' ? undefined : modelById.get(r.model)].find(o => o && identityOf(g, o) === null)?.cls ?? null;
    const inText = [...planned.rows].sort((a, b) => place(a) - place(b));
    const indexes = homonymIndexes(inText.map(unnamed));
    const indexOf = new Map(inText.map((r, k) => [r, indexes[k]]));
    const rows = planned.rows.map((r): ConfirmRow => {
        const n = indexOf.get(r) ?? null;
        switch (r.kind) {
            case 'uncertain': {
                const why = r.by === 'homonym' ? 'same name, paired by order' : r.by === 'rename' ? 'renamed' : 'same name, elsewhere in the model';
                const reason = !r.ticked ? 'not paired: created and deleted' : r.features.length ? `${why}, changes ${r.features.join(', ')}` : why;
                return { old: labelOf(g, modelById.get(r.model), n), new: labelOf(g, textById.get(r.text), n), reason, flagged: false,
                    pairing: { text: r.text, model: r.model, score: r.score, ticked: r.ticked } };
            }
            case 'change': return { old: labelOf(g, modelById.get(r.model), n), new: labelOf(g, textById.get(r.text), n), reason: `changed: ${r.features.join(', ')}`, flagged: false };
            case 'create': return { old: '—', new: labelOf(g, textById.get(r.text), n), reason: 'created', flagged: false };
            case 'delete': return { old: labelOf(g, modelById.get(r.model), n), new: null, reason: r.flagged ? 'deleted, referenced from another model' : 'deleted', flagged: r.flagged };
        }
    });
    return { rows, counts: planned.counts };
}

const counted = (n: number, what: string): string => `${n} ${what}${n === 1 ? '' : 's'}`;

export interface TextConfirmPanelProps {
    readonly rows: readonly ConfirmRow[];
    /** Applies the text with these rows confirmed. */
    readonly onConfirm: () => void;
    readonly busy: boolean;
    /** T8c: the counts at the top; absent, the title counts the rows. */
    readonly counts?: PlanCounts;
    /** T8c: an uncertain pairing's checkbox, ticked or unticked. */
    readonly onTick?: (pairing: Pairing, ticked: boolean) => void;
    /** T8c: closes the panel and applies nothing; absent, no Cancel. */
    readonly onCancel?: () => void;
}

export default function TextConfirmPanel({ rows, onConfirm, busy, counts, onTick, onCancel }: TextConfirmPanelProps) {
    const flagged = rows.some(r => r.flagged);
    const pairs = rows.some(r => r.pairing);
    const title = counts
        ? `${counted(counts.changes, 'change')}, ${counted(counts.creates, 'creation')}, ${counted(counts.deletes, 'deletion')} to confirm before the text is applied`
        : `${rows.length} change${rows.length === 1 ? '' : 's'} to confirm before the text is applied`;
    // A deletion another model references reads in the error colour (the issue list's modifier class, R-TXT-55 F10).
    const cell = (r: ConfirmRow, content: ReactNode) => (r.flagged ? <span className="textual-tab__issue--error">{content}</span> : content);
    return (
        <section className="textual-tab__confirm" aria-label="Changes to confirm">
            <header className="textual-tab__confirm-head">
                <i className={`bi ${flagged ? 'bi-exclamation-triangle' : 'bi-question-circle'}`} aria-hidden="true" />
                <span>{title}</span>
                {/* Next to the title: the app's floating widgets sit in the bottom-right corner. */}
                <button type="button" className="textual-tab__create" disabled={busy} onClick={onConfirm}
                        title="Apply the text with these matches and deletions">
                    <i className="bi bi-check2" aria-hidden="true" />
                    {busy ? 'Applying…' : 'Confirm'}
                </button>
                {onCancel && (
                    <button type="button" className="textual-tab__create" disabled={busy} onClick={onCancel}
                            title="Close the panel and apply nothing">
                        <i className="bi bi-x" aria-hidden="true" />
                        Cancel
                    </button>
                )}
            </header>
            <table className="textual-tab__confirm-rows">
                <thead>
                    <tr>
                        {pairs && <th scope="col">Pair</th>}
                        <th scope="col">In the model</th><th scope="col">In the text</th><th scope="col">Reason</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((r, k) => (
                        <tr key={k} className={r.flagged ? 'textual-tab__confirm-row--flagged' : undefined}>
                            {pairs && (
                                <td>
                                    {r.pairing && (
                                        <label>
                                            <input type="checkbox" checked={r.pairing.ticked} disabled={busy || !onTick}
                                                   aria-label={`Pair ${r.old} with ${r.new ?? '—'}`}
                                                   onChange={e => onTick?.({ text: r.pairing!.text, model: r.pairing!.model }, e.target.checked)} />
                                            {` ${Math.round(r.pairing.score * 100)}%`}
                                        </label>
                                    )}
                                </td>
                            )}
                            <td>{cell(r, r.old)}</td>
                            <td>{cell(r, r.new ?? '—')}</td>
                            <td>
                                {cell(r, <>
                                    {r.flagged && <i className="bi bi-exclamation-triangle" aria-hidden="true" />}
                                    {r.reason}
                                </>)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </section>
    );
}
