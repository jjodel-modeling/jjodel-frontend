/**
 * Step T8b of the textual notation (P-2026-11-08-0206; R-TXT-17, R-TXT-18, R-TXT-55 F8 to F10): the text file of a
 * model, for the Text tab's Export and Import. Pure, on plain objects, so it tests without the app.
 *
 * The export is the print of the model with the ids on (`NotationStyle.printIds`, T8a), turned on here for the file
 * only: the syntax record does not carry the option, and the Text tab prints without it.
 *
 * The import plans a file's text against the model as an edit of it, through the same `planTextEdit` the Text tab uses,
 * with no carried spans (there is no previous print): the match starts at the ids the file's comments carry, then
 * names, then similarity (R-TXT-18). A recovered object is never applied (R-TXT-21 (8)): the plan refuses the parse.
 * The plan is applied by `applyTextEdit`, as an edit is, in one undo step.
 */

import type { ConcreteGrammar } from './concreteGrammar';
import type { TextMetamodel, TextObject } from './metamodel';
import { parseText } from './parser';
import type { TextParseResult } from './parser';
import { printTextModel } from './printer';
import type { UnprintedObject } from './printer';
import { planTextEdit } from './textDiff';
import type { ApplyRefusal, DiffOp, Pairing, PlanInput, TextEditPlan } from './textDiff';
import { identityOf, textIdsOf } from './textMatch';
import type { ConfirmRow } from './ui/TextConfirmPanel';

/** What the import plans against: the model as the Text tab prints it. */
export interface TextImportBase {
    readonly mm: TextMetamodel;
    readonly grammar: ConcreteGrammar;
    readonly objects: readonly TextObject[];
    readonly unprinted: readonly UnprintedObject[];
}

/** What the lookup gives the plan besides the objects, as for an edit (textDiff.ts `PlanInput`). */
export interface TextImportEvidence {
    readonly defaults?: ReadonlyMap<string, ReadonlySet<string>>;
    readonly referencedElsewhere?: ReadonlySet<string>;
    readonly reserved?: ReadonlySet<string>;
}

export interface TextImport {
    readonly text: string;
    readonly parsed: TextParseResult;
    readonly plan: TextEditPlan;
    /** The id each parsed object's comment carries (`textIdsOf`); empty for a file without ids. */
    readonly ids: ReadonlyMap<string, string>;
}

/** The text of the exported file: the print with one `@id` comment per object head. */
export function exportText(g: ConcreteGrammar, objects: readonly TextObject[]): string {
    return printTextModel({ ...g, style: { ...g.style, printIds: true } }, objects).text;
}

/** The exported file's name. */
export function textFileName(modelName: string): string {
    return `${modelName || 'model'}.txt`;
}

/** A file's text planned against the model, with no carried spans; `confirmed` and `unpaired` (T8c) as in the Text tab's panel. */
export function planTextImport(base: TextImportBase, text: string, evidence: TextImportEvidence = {},
                               confirmed?: readonly ApplyRefusal['code'][], unpaired?: readonly Pairing[]): TextImport {
    const parsed = parseText(text, base.grammar);
    const ids = parsed.tree ? textIdsOf(parsed.tree, base.grammar) : new Map<string, string>();
    // The ids are the diff input's evidence 0 (`DiffInput.ids`), which `diffText` hands to `matchObjects`.
    const input: PlanInput = {
        mm: base.mm, grammar: base.grammar, model: base.objects, parsed, unprinted: base.unprinted, previous: [],
        ...(ids.size ? { ids } : {}),
        ...(evidence.defaults ? { defaults: evidence.defaults } : {}),
        ...(evidence.referencedElsewhere ? { referencedElsewhere: evidence.referencedElsewhere } : {}),
        ...(evidence.reserved ? { reserved: evidence.reserved } : {}),
        ...(confirmed ? { confirmed } : {}),
        ...(unpaired?.length ? { unpaired } : {}),
    };
    return { text, parsed, plan: planTextEdit(input), ids };
}

const targetOf = (op: DiffOp): string | undefined => {
    if (op.op === 'move' || op.op === 'delete') return op.model;
    if (op.op === 'create') return undefined;
    return 'model' in op.target ? op.target.model : undefined;
};

/**
 * The rows of the confirm panel for the plan's certain changes: one per model object it changes, naming the features,
 * one per deletion and one per creation, in text order then model order. The uncertain matches and the deletions other
 * models reference are the panel's own rows (`confirmRows`), not repeated here.
 */
export function textImportRows(base: TextImportBase, imported: Pick<TextImport, 'parsed' | 'plan'>,
                               referencedElsewhere?: ReadonlySet<string>): ConfirmRow[] {
    const diff = imported.plan.diff;
    if (!diff) return [];
    const g = base.grammar;
    const label = (o: TextObject | undefined): string => {
        if (!o) return '?';
        const name = identityOf(g, o);
        return name === null ? `${o.cls} (unnamed)` : `${o.cls} ${name}`;
    };
    const modelById = new Map(base.objects.map(o => [o.id, o]));
    const textById = new Map(imported.parsed.objects.map(o => [o.id, o]));
    const textOf = new Map(diff.match.matches.filter(m => !m.uncertain).map(m => [m.model, m.text]));
    const changed = new Map<string, string[]>();
    for (const op of diff.ops) {
        if (op.op === 'create' || op.op === 'delete') continue;
        const id = targetOf(op);
        if (id === undefined || !textOf.has(id)) continue;
        const feature = op.op === 'move' ? 'container' : op.feature;
        const features = changed.get(id) ?? [];
        if (!features.includes(feature)) features.push(feature);
        changed.set(id, features);
    }
    const rows: ConfirmRow[] = [];
    for (const o of imported.parsed.objects) {
        const id = diff.match.matches.find(m => m.text === o.id && !m.uncertain)?.model;
        const features = id === undefined ? undefined : changed.get(id);
        if (features) rows.push({ old: label(modelById.get(id!)), new: label(textById.get(textOf.get(id!)!)), reason: `changed: ${features.join(', ')}`, flagged: false });
        else if (diff.match.created.includes(o.id)) rows.push({ old: '—', new: label(o), reason: 'created', flagged: false });
    }
    for (const op of diff.ops) {
        if (op.op === 'delete' && !referencedElsewhere?.has(op.model)) rows.push({ old: label(modelById.get(op.model)), new: null, reason: 'deleted', flagged: false });
    }
    return rows;
}
