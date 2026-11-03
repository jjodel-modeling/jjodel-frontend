/**
 * TextConfirmPanel — what an edited text needs confirmed before it is applied (R-TXT-18, R-TXT-26, step T6b,
 * P-2026-11-03-0021): the uncertain matches (a homonym paired by order, an object matched by similarity, an object
 * matched elsewhere in the model) and the deletions of objects another model references, flagged. One row per object:
 * the model's object, the text's, and the reason; one confirm action for all of them. Nothing is applied until then.
 *
 * The panel lies over the bottom of the editor, so its appearing moves no line of the text. It shows only when every
 * refusal of the plan is one a user may confirm (textDiff.ts `CONFIRMABLE`): a confirmation that could not apply the
 * text is not asked for.
 */

import type { ConcreteGrammar } from '../concreteGrammar';
import type { TextMetamodel, TextObject } from '../metamodel';
import type { TextParseResult } from '../parser';
import { CONFIRMABLE, deletedObjects } from '../textDiff';
import type { TextEditPlan } from '../textDiff';
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

const labelOf = (g: ConcreteGrammar, o: TextObject | undefined): string => {
    if (!o) return '?';
    const name = identityOf(g, o);
    return name === null ? `${o.cls} (unnamed)` : `${o.cls} ${name}`;
};

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

export interface TextConfirmPanelProps {
    readonly rows: readonly ConfirmRow[];
    /** Applies the text with these rows confirmed. */
    readonly onConfirm: () => void;
    readonly busy: boolean;
}

export default function TextConfirmPanel({ rows, onConfirm, busy }: TextConfirmPanelProps) {
    const flagged = rows.some(r => r.flagged);
    return (
        <section className="textual-tab__confirm" aria-label="Changes to confirm">
            <header className="textual-tab__confirm-head">
                <i className={`bi ${flagged ? 'bi-exclamation-triangle' : 'bi-question-circle'}`} aria-hidden="true" />
                <span>{`${rows.length} change${rows.length === 1 ? '' : 's'} to confirm before the text is applied`}</span>
                {/* Next to the title: the app's floating widgets sit in the bottom-right corner. */}
                <button type="button" className="textual-tab__create" disabled={busy} onClick={onConfirm}
                        title="Apply the text with these matches and deletions">
                    <i className="bi bi-check2" aria-hidden="true" />
                    {busy ? 'Applying…' : 'Confirm'}
                </button>
            </header>
            <table className="textual-tab__confirm-rows">
                <thead>
                    <tr><th scope="col">In the model</th><th scope="col">In the text</th><th scope="col">Reason</th></tr>
                </thead>
                <tbody>
                    {rows.map((r, k) => (
                        <tr key={k} className={r.flagged ? 'textual-tab__confirm-row--flagged' : undefined}>
                            <td>{r.old}</td>
                            <td>{r.new ?? '—'}</td>
                            <td>
                                {r.flagged && <i className="bi bi-exclamation-triangle" aria-hidden="true" />}
                                {r.reason}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </section>
    );
}
