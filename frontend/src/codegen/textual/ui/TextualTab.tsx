/**
 * TextualTab — the model's text in the textual notation (R-TXT-23, slice T2b, P-2026-11-02-0040), editable since step
 * T6b (P-2026-11-03-0021, R-TXT-22, R-TXT-26): an edit is applied to the model on a pause in typing (`TextualTab`).
 *
 * Opened by openTextualTab.tsx, from the toolbar picker's textual entry (dataManagerOption.ts `TEXTUAL_OPTION_VALUE`).
 * The model is read as a JjGen generator reads it (`buildEvalContext` with the model as the extent, as GeneratorPane
 * does), turned into T1's input (`textInputOf`), and printed with the C-like style; a toggle shows the concrete EBNF
 * of the same grammar instead, read-only.
 *
 * `NewTextualTab` is the «new» mode (slice T2c, P-2026-11-02-0045): an empty, editable text of a new model of a
 * metamodel, read after a pause in typing (modelLines.ts `readNewModel`); errors and values JjScript cannot write are
 * Monaco markers, and «Create model» hands the model's name and JjScript lines to the opener (openTextualTab.tsx).
 *
 * The tab sits in the first dock panel, whose tab bar the app bar replaces; the app bar lists only the tab ids it
 * resolves (Navbar.tsx `syncTabs`), so this tab carries its own title and close in its header.
 *
 * Both modes derive the grammar through one path (syntaxRecord.ts `textualNotation`, step T4a-2, P-2026-11-02-1830):
 * the metamodel's stored syntax annotations, resolved against its element ids. Their issues, and the style's case
 * notices, are listed under the bar; the label is the language's name when the record sets one.
 *
 * In `src/codegen/`: loaded through the dynamic import of the opener only (R-GEN-2, scripts/gates/check-codegen-lazy.ts).
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector, useStore } from 'react-redux';
import Editor from '@monaco-editor/react';
import type { OnMount } from '@monaco-editor/react';
import { buildEvalContext } from '../../../jjscript';
import { evalContextFor } from '../../../components/editor-v2/sim/simBridge';
import DockManager from '../../../components/abstract/DockManager';
import { TEXTUAL_SYNTAX_KEY, textualLanguageNameOf, textualLanguageOf, textualOptionLabel } from '../../../components/editor-v2/dataManagerOption';
import { concreteGrammarEbnf } from '../concreteGrammar';
import { classFeatures } from '../metamodel';
import { readNewModel } from '../modelLines';
import { isApplicableParse, parseText } from '../parser';
import type { TextParseResult } from '../parser';
import { printTextModel } from '../printer';
import type { ObjectSpan, RefSpan, UnprintedObject } from '../printer';
import { applyTextEdit, defaultedSlots, referencedElsewhere } from '../textApply';
import { deletedObjects, planTextEdit } from '../textDiff';
import type { ApplyRefusal, RefTarget, TextDiff, TextEditPlan } from '../textDiff';
import { matchObjects } from '../textMatch';
import type { TextMatch } from '../textMatch';
import { elementIdsOf, readSyntax, textualNotation } from '../syntaxRecord';
import type { AnnotationIssue, ElementIds } from '../annotations';
import type { ConcreteGrammar } from '../concreteGrammar';
import type { DecodedSyntax } from '../syntaxRecord';
import type { TextMetamodel, TextObject } from '../metamodel';
import type { NewModelReading } from '../modelLines';
import TextConfirmPanel, { confirmRows, needsConfirmation } from './TextConfirmPanel';
import type { ConfirmRow } from './TextConfirmPanel';
import './TextualTab.scss';

/** T1's input: the metamodel and the objects as plain data (metamodel.ts). */
export interface TextInput {
    readonly metamodel: TextMetamodel;
    readonly objects: TextObject[];
}

/** What the tab shows: the model's text, the grammar's EBNF, and why the text could not be printed. */
export interface TextualView {
    readonly text: string;
    readonly ebnf: string;
    readonly error: string | null;
    /** The annotations' issues and the style's notices (syntaxRecord.ts `textualNotation`); absent when none could be derived. */
    readonly issues?: readonly AnnotationIssue[];
    /** R-TXT-30: the objects the text leaves out, one line per class and reason (`unprintedIssues`); absent when none is. */
    readonly warnings?: readonly UnprintedIssue[];
}

/** A warning under the tab's bar: a line of its own, with no place in front of it. */
export interface UnprintedIssue {
    readonly level: 'warning';
    readonly message: string;
}

/**
 * R-TXT-30: one warning per class, grouping attribute and reason, in the order the objects were met:
 * `2 Book not shown: genre unset`. The objects inside the unprinted ones are counted in their line (`, with 3 objects
 * inside`), not as lines of their own: those are the objects that are missing too.
 */
export function unprintedIssues(unprinted: readonly UnprintedObject[]): UnprintedIssue[] {
    const lines = new Map<string, { cls: string; attr: string; reason: UnprintedObject['reason']; n: number; inside: number }>();
    for (const u of unprinted) {
        const key = `${u.cls}\u0000${u.attr}\u0000${u.reason}`;
        const line = lines.get(key) ?? { cls: u.cls, attr: u.attr, reason: u.reason, n: 0, inside: 0 };
        line.n += 1;
        line.inside += u.inside;
        lines.set(key, line);
    }
    return [...lines.values()].map(l => ({
        level: 'warning',
        message: `${l.n} ${l.cls} not shown: ${l.attr} ${l.reason === 'unset' ? 'unset' : 'outside every subset'}`
            + (l.inside ? `, with ${l.inside} object${l.inside === 1 ? '' : 's'} inside` : ''),
    }));
}

/** The metamodel's stored syntax annotations and the ids they are keyed by. */
export interface StoredNotation {
    readonly decoded: DecodedSyntax;
    readonly ids: ElementIds;
}

const NO_ANNOTATIONS: StoredNotation = { decoded: { record: null, issues: [] }, ids: { classes: {}, features: {}, enums: {} } };

/** The annotations stored on the metamodel `metamodelId`, read from the lookup. */
export function storedNotation(lookup: Readonly<Record<string, any>>, metamodelId: string | undefined): StoredNotation {
    if (typeof metamodelId !== 'string' || !lookup[metamodelId]) return NO_ANNOTATIONS;
    return { decoded: readSyntax(lookup, metamodelId), ids: elementIdsOf(lookup, metamodelId) };
}

const list = (v: unknown): any[] => (Array.isArray(v) ? v : []);
const nameOf = (v: any): string => (typeof v?.name === 'string' ? v.name : '');
const idOf = (v: any): string | null => (typeof v?.id === 'string' && v.id ? v.id : null);
const messageOf = (e: unknown): string => (e instanceof Error ? e.message : String(e));

/**
 * The globals of `buildEvalContext` as T1's input. A class shell's supertypes are shells, read by name; an interface
 * is abstract (no instance can stand for it); a reference is many-valued when its upper bound is above one. Each
 * object keeps the slots of its class's features (own and inherited, metamodel.ts `classFeatures`): an attribute as
 * the eval context gives it, a reference by the target's id. An object with no class in the metamodel is skipped.
 *
 * With the lookup, each feature reads `ordered` off its D-layer element by the shell's id (step T7, D-2): ordered
 * unless the element says `ordered: false`, the Ecore default. Without it no feature carries the flag.
 */
export function textInputOf(globals: Readonly<Record<string, any>>, lookup?: Readonly<Record<string, any>>): TextInput {
    const orderedOf = (f: any): { ordered?: boolean } => (lookup ? { ordered: lookup[f?.id]?.ordered !== false } : {});
    const metamodel: TextMetamodel = {
        classes: list(globals.classes).map(c => ({
            name: nameOf(c),
            isAbstract: !!c.isAbstract || !!c.isInterface,
            supers: list(c.superTypes).map(nameOf),
            attributes: list(c.attributes).map(a => ({ name: nameOf(a), type: String(a.type ?? ''), many: !!a.multiValued, ...orderedOf(a) })),
            references: list(c.references).map(r => ({
                name: nameOf(r),
                type: String(r.type ?? ''),
                containment: !!r.containment,
                many: r.multiplicity === '*' || Number(r.upperBound) > 1,
                ...orderedOf(r),
            })),
        })),
        enumerations: list(globals.enumerations).map(e => ({ name: nameOf(e), literals: list(e.literals).map(nameOf) })),
    };
    const objects: TextObject[] = [];
    for (const h of list(globals.instances)) {
        const cls = metamodel.classes.find(c => c.name === nameOf(h?.instanceOf));
        const id = idOf(h);
        if (!cls || !id) continue;
        const slots: Record<string, unknown> = {};
        for (const f of classFeatures(metamodel, cls)) {
            const v = h[f.name];
            if (f.kind === 'attribute') slots[f.name] = v;
            else if (f.many) slots[f.name] = (Array.isArray(v) ? v : v == null ? [] : [v]).map(idOf).filter((t): t is string => t !== null);
            else slots[f.name] = idOf(v);
        }
        objects.push({ id, cls: cls.name, slots });
    }
    return { metamodel, objects };
}

/** What an edit of the text is diffed against (step T6b): the model as the text was printed from it, and the print's spans. */
export interface EditBase {
    readonly mm: TextMetamodel;
    readonly grammar: ConcreteGrammar;
    readonly objects: readonly TextObject[];
    readonly spans: readonly ObjectSpan[];
    readonly unprinted: readonly UnprintedObject[];
    /** R-TXT-35: the print's reference tokens. */
    readonly refs?: readonly RefSpan[];
}

/** The view, and the base of an edit when the text could be printed. */
export interface ModelReading {
    readonly view: TextualView;
    readonly base: EditBase | null;
}

/** The view of `textualView` and the base an edit of its text is diffed against; a failure is reported, never thrown. */
/** The lookup, when given, reads `ordered` for the diff (`textInputOf`). */
export function readModel(globals: Readonly<Record<string, any>>, stored: StoredNotation = NO_ANNOTATIONS, lookup?: Readonly<Record<string, any>>): ModelReading {
    let input: TextInput;
    let grammar: ConcreteGrammar;
    let issues: readonly AnnotationIssue[];
    try {
        input = textInputOf(globals, lookup);
        ({ grammar, issues } = textualNotation(input.metamodel, stored.decoded, stored.ids));
    } catch (e) {
        return { view: { text: '', ebnf: '', error: messageOf(e) }, base: null };
    }
    const ebnf = concreteGrammarEbnf(grammar);
    try {
        const printed = printTextModel(grammar, input.objects);
        const warnings = unprintedIssues(printed.unprinted);
        return {
            view: { text: printed.text, ebnf, error: null, issues, ...(warnings.length ? { warnings } : {}) },
            base: { mm: input.metamodel, grammar, objects: input.objects, spans: printed.spans, unprinted: printed.unprinted, refs: printed.refs ?? [] },
        };
    } catch (e) {
        return { view: { text: '', ebnf, error: messageOf(e), issues }, base: null };
    }
}

/** The text and the EBNF of the C-like notation for the globals, with the stored annotations; a failure is reported, never thrown. */
export function textualView(globals: Readonly<Record<string, any>>, stored: StoredNotation = NO_ANNOTATIONS): TextualView {
    return readModel(globals, stored).view;
}

/** The model as the eval context reads it; the project is the user's (jjscript/executor/utils.ts `getProject`). */
function modelReading(lookup: Readonly<Record<string, any>>, modelId: string): ModelReading {
    try {
        const globals = buildEvalContext(evalContextFor(lookup, modelId, ''), { extentModelId: modelId });
        return readModel(globals, storedNotation(lookup, lookup[modelId]?.instanceof), lookup);
    } catch (e) {
        return { view: { text: '', ebnf: '', error: messageOf(e) }, base: null };
    }
}

// ---- Editing the text of a model (step T6b, P-2026-11-03-0021; R-TXT-22, R-TXT-26) -----------------------------------

/** The pause in typing after which an edited text is read and, when nothing blocks it, applied (R-TXT-26). */
export const APPLY_DELAY_MS = 800;

export interface Pause {
    /** Restarts the wait. */
    readonly poke: () => void;
    readonly cancel: () => void;
}

/** A pause in typing: every `poke` restarts a wait of `delay` ms, and `run` is called once a wait ends with no new poke. */
export function pauseOf(delay: number, run: () => void): Pause {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const cancel = (): void => {
        if (timer !== null) clearTimeout(timer);
        timer = null;
    };
    return { poke: () => { cancel(); timer = setTimeout(() => { timer = null; run(); }, delay); }, cancel };
}

/** What the text and the model agreed on last, at a print or an application: the editor's text and the model's print. */
export interface TextSync {
    readonly text: string;
    readonly model: string;
}

/**
 * A change of the model's print (a diagram edit, an undo, another tab): reprint when the editor holds no pending
 * edit, else keep the user's text and say the model changed. Never while the tab's own application runs: its result
 * becomes the new agreement when the run ends.
 */
export function onModelPrint(sync: TextSync, modelText: string, editorText: string, applying: boolean): 'none' | 'reprint' | 'keep' {
    if (applying || modelText === sync.model) return 'none';
    return editorText === sync.text ? 'reprint' : 'keep';
}

/** What the tab does with an edited text once read (R-TXT-26). */
export type EditDecision =
    /** The text is the agreed one: no pending edit. */
    | { readonly kind: 'synced' }
    /** The text does not parse, or a token names nothing and keeps no target (R-TXT-35): markers, the model untouched. */
    | { readonly kind: 'errors'; readonly count: number }
    /** The model changed under the edit: not applied, so the other change is not undone unasked. */
    | { readonly kind: 'stale' }
    /** Uncertain matches or deletions referenced elsewhere only: the panel asks. */
    | { readonly kind: 'confirm' }
    | { readonly kind: 'refused'; readonly reasons: readonly string[] }
    /** The text asks for no change of the model. */
    | { readonly kind: 'unchanged' }
    | { readonly kind: 'apply' };

/** The decision on a read text: the parse's errors first, then the change under the edit, the panel, the refusals. */
export function editDecision(text: string, sync: TextSync, parsed: TextParseResult, plan: TextEditPlan, stale: boolean): EditDecision {
    if (text === sync.text) return { kind: 'synced' };
    const unresolved = plan.diff?.unresolved?.length ?? 0;
    if (!isApplicableParse(parsed) || unresolved) return { kind: 'errors', count: Math.max(parsed.errors.length + unresolved, 1) };
    if (stale) return { kind: 'stale' };
    if (needsConfirmation(plan)) return { kind: 'confirm' };
    if (plan.refusals.length) return { kind: 'refused', reasons: plan.refusals.map(r => r.message) };
    if (!plan.lines?.length) return { kind: 'unchanged' };
    return { kind: 'apply' };
}

/** What the lookup gives an edit besides the objects (textApply.ts `defaultedSlots`, `referencedElsewhere`). */
export interface EditEvidence {
    readonly defaults?: ReadonlyMap<string, ReadonlySet<string>>;
    readonly referencedElsewhere?: ReadonlySet<string>;
}

/**
 * Parses the text and plans its application on the base, with the spans the editor carried over the edit (R-TXT-22)
 * and the reference tokens it carried (`refs`, R-TXT-35: a token the user did not retype keeps its target).
 */
export function planEdit(base: EditBase, text: string, carried: readonly ObjectSpan[], evidence: EditEvidence = {},
                         confirmed?: readonly ApplyRefusal['code'][], refs: readonly RefSpan[] = []): { readonly parsed: TextParseResult; readonly plan: TextEditPlan } {
    const parsed = parseText(text, base.grammar, { keep: refs });
    const plan = planTextEdit({
        mm: base.mm, grammar: base.grammar, model: base.objects, parsed, unprinted: base.unprinted, previous: carried, previousRefs: refs,
        ...(evidence.defaults ? { defaults: evidence.defaults } : {}),
        ...(evidence.referencedElsewhere ? { referencedElsewhere: evidence.referencedElsewhere } : {}),
        ...(confirmed ? { confirmed } : {}),
    });
    return { parsed, plan };
}

/**
 * The spans of a parse that identify their model object, for the editor to carry to the next parse (R-TXT-22): those
 * of the certain matches only. An uncertain match carried as a span would read as certain the next time.
 */
export function certainSpans(parsed: Pick<TextParseResult, 'spans'>, match: Pick<TextMatch, 'matches'>): ObjectSpan[] {
    const modelOf = new Map(match.matches.filter(m => !m.uncertain).map(m => [m.text, m.model]));
    return parsed.spans.flatMap(s => { const id = modelOf.get(s.id); return id ? [{ id, start: s.start, end: s.end }] : []; });
}

/**
 * The spans of an applied text, in the model after the run: the plan's own matches (a confirmed one included: it was
 * applied as that object), then the re-match of the created objects against the new model (`rematch`). A created
 * homonym pairs by order there, as the run appended them in text order; a model object is never given two spans.
 */
export function appliedSpans(parsed: Pick<TextParseResult, 'spans'>, plan: Pick<TextMatch, 'matches' | 'created'>,
                             rematch: Pick<TextMatch, 'matches'>): ObjectSpan[] {
    const modelOf = appliedIds(plan, rematch);
    return parsed.spans.flatMap(s => { const id = modelOf.get(s.id); return id ? [{ id, start: s.start, end: s.end }] : []; });
}

/** The model object of each parsed object of an applied text (`appliedSpans`). */
function appliedIds(plan: Pick<TextMatch, 'matches' | 'created'>, rematch: Pick<TextMatch, 'matches'>): Map<string, string> {
    const modelOf = new Map(plan.matches.map(m => [m.text, m.model]));
    const used = new Set(modelOf.values());
    const created = new Set(plan.created);
    for (const m of rematch.matches) {
        if (!created.has(m.text) || used.has(m.model) || (m.uncertain && m.by !== 'homonym')) continue;
        modelOf.set(m.text, m.model);
        used.add(m.model);
    }
    return modelOf;
}

/**
 * R-TXT-35: the reference tokens of an applied text, in the model after the run, each with the target the plan read for
 * it (kept or read in the text): the next edit keeps the tokens the user leaves alone. A kept path may name another
 * object in the text as typed; `pathRewrites` writes its new path (P-2026-11-03-1535).
 */
export function appliedRefs(text: string, refs: readonly RefTarget[], plan: Pick<TextMatch, 'matches' | 'created'>,
                            rematch: Pick<TextMatch, 'matches'>): RefSpan[] {
    const modelOf = appliedIds(plan, rematch);
    return refs.flatMap(r => {
        const owner = modelOf.get(r.owner);
        const target = 'model' in r.to ? r.to.model : 'text' in r.to ? modelOf.get(r.to.text) : r.to.outer;
        return owner !== undefined && target !== undefined ? [{ owner, feature: r.feature, target, text: text.slice(r.start, r.end), start: r.start, end: r.end }] : [];
    });
}

/** A replacement in the text: `[start, end)` becomes `text`. */
export interface TextEdit {
    readonly start: number;
    readonly end: number;
    readonly text: string;
}

/** The reference tokens of an agreed text rewritten to the print (`pathRewrites`). */
export interface PathRewrite {
    /** The text after the edits. */
    readonly text: string;
    /** In text order, none overlapping. */
    readonly edits: readonly TextEdit[];
    /** Every carried token, in the rewritten text; a rewritten one with its new text. */
    readonly refs: readonly RefSpan[];
    /** The tokens left as typed because a selection is on them. */
    readonly held: number;
}

/**
 * R-TXT-35 (P-2026-11-03-1535): after an application the text shows the current paths. Each carried token is paired
 * with the token the new print writes for the same owner, feature and target (by order among equals); one whose text
 * differs from the print's is rewritten to it, unless a selection touches it, edges included. Nothing else changes.
 */
export function pathRewrites(text: string, carried: readonly RefSpan[], printed: readonly RefSpan[],
                             selections: readonly { readonly start: number; readonly end: number }[] = []): PathRewrite {
    const keyOf = (r: RefSpan): string => `${r.owner}\u0000${r.feature}\u0000${r.target}`;
    const queues = new Map<string, RefSpan[]>();
    for (const p of printed) {
        if (!queues.has(keyOf(p))) queues.set(keyOf(p), []);
        queues.get(keyOf(p))!.push(p);
    }
    const edits: TextEdit[] = [];
    const rewritten = new Map<RefSpan, string>();
    let held = 0;
    for (const r of [...carried].sort((a, b) => a.start - b.start)) {
        const p = queues.get(keyOf(r))?.shift();
        if (!p || p.text === text.slice(r.start, r.end)) continue;
        if (selections.some(s => s.start <= r.end && s.end >= r.start)) { held++; continue; }
        edits.push({ start: r.start, end: r.end, text: p.text });
        rewritten.set(r, p.text);
    }
    let out = text;
    for (const e of [...edits].reverse()) out = out.slice(0, e.start) + e.text + out.slice(e.end);
    const refs = carried.map(r => {
        const start = shiftOffset(r.start, edits);
        const now = rewritten.get(r);
        return now === undefined ? { ...r, start, end: shiftOffset(r.end, edits) } : { ...r, text: now, start, end: start + now.length };
    });
    return { text: out, edits, refs, held };
}

/** An offset of the text before `edits`, in the text after them; an offset inside a replaced range is not asked for. */
export function shiftOffset(offset: number, edits: readonly TextEdit[]): number {
    return edits.reduce((at, e) => (e.end <= offset ? at + e.text.length - (e.end - e.start) : at), offset);
}

// ---- Step T7: a cut pasted whole (D-5), and the marker of a misplaced outer reference (item 5) ---------------------

/** What a cut took: its text, and the carried spans wholly inside it, relative to its start (R-TXT-22). */
export interface CutClip {
    readonly text: string;
    readonly spans: readonly ObjectSpan[];
    /** R-TXT-35: the carried reference tokens wholly inside it, relative to its start. */
    readonly refs?: readonly RefSpan[];
}

/** The clip of a cut of `length` characters at `at` of `before`, with the spans carried then; null when it holds no whole object. */
export function cutClip(before: string, spans: readonly ObjectSpan[], at: number, length: number, refs: readonly RefSpan[] = []): CutClip | null {
    const end = at + length;
    const inside = spans.filter(s => s.end > s.start && s.start >= at && s.end <= end).map(s => ({ id: s.id, start: s.start - at, end: s.end - at }));
    const tokens = refs.filter(s => s.end > s.start && s.start >= at && s.end <= end).map(s => ({ ...s, start: s.start - at, end: s.end - at }));
    return inside.length ? { text: before.slice(at, end), spans: inside, ...(tokens.length ? { refs: tokens } : {}) } : null;
}

/**
 * The spans a paste of `inserted` at `at` re-attaches (D-5): the clip's, when the paste is the clip's text and that text
 * is in `after` once only. With the original or a copy still in the text, the paste is new and carries nothing.
 */
export function pastedSpans(clip: CutClip, at: number, inserted: string, after: string): ObjectSpan[] {
    if (inserted !== clip.text || after.indexOf(clip.text) !== after.lastIndexOf(clip.text)) return [];
    return clip.spans.map(s => ({ id: s.id, start: s.start + at, end: s.end + at }));
}

/** R-TXT-35: the reference tokens the same paste re-attaches: those of the clip, when `pastedSpans` re-attaches its objects. */
export function pastedRefs(clip: CutClip, at: number, inserted: string, after: string): RefSpan[] {
    if (!pastedSpans(clip, at, inserted, after).length) return [];
    return (clip.refs ?? []).map(s => ({ ...s, start: s.start + at, end: s.end + at }));
}

/** How many objects of a pending cut the plan would delete: such a plan waits for the paste (D-5). */
export function heldByCut(clip: CutClip | null, base: Pick<EditBase, 'mm' | 'objects'>, plan: TextEditPlan): number {
    if (!clip || !plan.diff) return 0;
    const gone = deletedObjects(base.mm, base.objects, plan.diff.ops);
    return clip.spans.filter(s => gone.has(s.id)).length;
}

/** A marker of the text: the offsets and the message. */
export interface TextMark {
    readonly start: number;
    readonly end: number;
    readonly message: string;
}

const OUTER_TOKEN = /@"((?:[^"\\]|\\.)*)"/g;

/**
 * R-TXT-32 code `outer`: each misplaced `@"id"`, found in its owner's span outside the spans of the objects it contains
 * (the parser keeps no position of the token). One marker per misplaced value, in text order within the owner.
 */
export function outerMarks(text: string, parsed: Pick<TextParseResult, 'objects' | 'spans'>, diff: Pick<TextDiff, 'match' | 'outer'>): TextMark[] {
    const textOf = new Map(diff.match.matches.map(m => [m.model, m.text]));
    const spanOf = new Map(parsed.spans.map(s => [s.id, s]));
    const used = new Set<number>();
    const out: TextMark[] = [];
    for (const o of diff.outer ?? []) {
        const id = 'model' in o.target ? textOf.get(o.target.model) : 'text' in o.target ? o.target.text : undefined;
        const own = id !== undefined ? spanOf.get(id) : undefined;
        if (!own) continue;
        const inner = parsed.spans.filter(s => s.id !== own.id && s.start >= own.start && s.end <= own.end);
        for (const m of text.slice(own.start, own.end).matchAll(OUTER_TOKEN)) {
            const start = own.start + (m.index ?? 0);
            let value: string | null = null;
            try { value = JSON.parse(`"${m[1]}"`); } catch { value = null; }
            if (value !== o.id || used.has(start) || inner.some(s => start >= s.start && start < s.end)) continue;
            used.add(start);
            out.push({ start, end: start + m[0].length, message: `@"${o.id}" is a reference outside the text not where it was printed: such a value can only be kept, deleted or replaced (R-TXT-32)` });
            break;
        }
    }
    return out;
}

/** The issues of the notation, and the warnings of the objects left out, one line each, under the tab's bar; nothing when there is none. */
function NotationIssues({ issues, warnings }: { readonly issues: readonly AnnotationIssue[] | undefined; readonly warnings?: readonly UnprintedIssue[] }) {
    if (!issues?.length && !warnings?.length) return null;
    return (
        <ul className="textual-tab__issues" aria-label="Notation issues">
            {(issues ?? []).map((i, k) => (
                <li key={k} className={`textual-tab__issue textual-tab__issue--${i.level}`}>
                    <i className={`bi ${i.level === 'error' ? 'bi-exclamation-triangle' : 'bi-info-circle'}`} aria-hidden="true" />
                    {`${i.where}: ${i.message}`}
                </li>
            ))}
            {(warnings ?? []).map((w, k) => (
                <li key={`w${k}`} className="textual-tab__issue textual-tab__issue--warning">
                    <i className="bi bi-exclamation-triangle" aria-hidden="true" />
                    {w.message}
                </li>
            ))}
        </ul>
    );
}

/** What the bar says of the edit: a decision, or a step of the application. */
type EditStatus = EditDecision | { readonly kind: 'editing' } | { readonly kind: 'applying' } | { readonly kind: 'applied'; readonly failed: number }
    /** T7 D-5: a cut's objects wait for their paste. */
    | { readonly kind: 'cut'; readonly count: number };

/** The bar's line for an edit status, and whether it reads as an error. */
export function editStatusText(s: EditStatus): { readonly text: string; readonly error: boolean } {
    switch (s.kind) {
        case 'synced': return { text: 'Up to date', error: false };
        case 'editing': return { text: 'Editing…', error: false };
        case 'errors': return { text: `${s.count} problem${s.count === 1 ? '' : 's'} · not applied`, error: true };
        case 'stale': return { text: 'Not applied', error: true };
        case 'confirm': return { text: 'Not applied · confirm below', error: false };
        case 'refused': return { text: `Not applied: ${s.reasons[0]}${s.reasons.length > 1 ? ` (+${s.reasons.length - 1})` : ''}`, error: true };
        case 'unchanged': return { text: 'No change', error: false };
        case 'cut': return { text: `Cut · paste to move ${s.count === 1 ? 'it' : 'them'}`, error: false };
        case 'apply': case 'applying': return { text: 'Applying…', error: false };
        case 'applied': return s.failed
            ? { text: `Applied, ${s.failed} line${s.failed === 1 ? '' : 's'} failed`, error: true }
            : { text: 'Applied', error: false };
    }
}

type TextualMode = 'text' | 'ebnf';

const MODES: ReadonlyArray<{ readonly mode: TextualMode; readonly label: string; readonly icon: string; readonly title: string }> = [
    { mode: 'text', label: 'Text', icon: 'bi-file-earmark-text', title: 'The model in the textual notation' },
    { mode: 'ebnf', label: 'EBNF', icon: 'bi-braces', title: 'The concrete grammar of the notation' },
];

/** The glyph margin plus the decorations fill the 30 px the global Monaco rules give the margin (ScriptTab.tsx). */
const EDITOR_DECORATIONS_WIDTH = 10;

const EDITOR_OPTIONS = {
    minimap: { enabled: false },
    lineNumbers: 'off',
    folding: false,
    lineDecorationsWidth: EDITOR_DECORATIONS_WIDTH,
    glyphMargin: true,
    fontSize: 13,
    fontFamily: "'IBM Plex Mono', Monaco, Consolas, monospace",
    scrollBeyondLastLine: false,
    renderLineHighlight: 'none',
    wordWrap: 'off',
} as const;

/** The owner of the edit's markers in the Monaco model. */
const EDIT_MARKER_OWNER = 'textual-edit';

/** The context key that sends Cmd/Ctrl+Z to the app's undo: set while the text holds no pending edit (R-TXT-26). */
const APP_UNDO_KEY = 'textualNoPendingEdit';

type MonacoEditor = Parameters<OnMount>[0];
/** A change of the Monaco model's content: what replaced which offsets. */
type ContentChange = { readonly rangeOffset: number; readonly rangeLength: number; readonly text: string };
type MonacoApi = Parameters<OnMount>[1];

export interface TextualTabProps {
    readonly modelId: string;
    /** The picker entry's label: the language's name (dataManagerOption.ts `textualOptionLabel`). */
    readonly label: string;
    /** The dock tab's id, for the close control. */
    readonly tabId: string;
}

/**
 * The Text view is editable (step T6b, R-TXT-26): on a pause in typing the text is parsed, diffed against the model
 * and, when nothing refuses it, applied as one undo step; the text stays as typed but for the reference tokens whose
 * print changed, rewritten to the new print (R-TXT-35, P-2026-11-03-1535). The previous parse's spans, carried
 * by Monaco decorations, are the first evidence of identity (R-TXT-22). A change of the model from elsewhere reprints
 * a text with no pending edit and never overwrites one. With no pending edit, Cmd/Ctrl+Z is the app's undo, whose
 * change reprints the text: one step restores model and text together. The EBNF view stays read-only.
 */
export default function TextualTab({ modelId, label, tabId }: TextualTabProps) {
    const lookup = useSelector((state: any) => state.idlookup) as Record<string, any>;
    const store = useStore();
    const [mode, setMode] = useState<TextualMode>('text');
    const read = useMemo(() => modelReading(lookup ?? {}, modelId), [lookup, modelId]);
    const view = read.view;
    const model = lookup?.[modelId];
    const modelName = typeof model?.name === 'string' && model.name ? model.name : 'Unnamed';
    // The picker's rule (Toolbar.tsx), read live: a language name set after the tab opened shows here too.
    const metamodel = lookup?.[model?.instanceof];
    const shownLabel = metamodel ? textualOptionLabel(metamodel.name, textualLanguageNameOf(lookup, modelId)) : label;
    const failed = view.error !== null && (mode === 'text' || !view.ebnf);

    const [status, setStatus] = useState<EditStatus>({ kind: 'synced' });
    const [stale, setStale] = useState(false);
    const [confirm, setConfirm] = useState<{ readonly text: string; readonly rows: readonly ConfirmRow[] } | null>(null);
    const readRef = useRef(read);
    readRef.current = read;
    const editorRef = useRef<MonacoEditor | null>(null);
    const monacoRef = useRef<MonacoApi | null>(null);
    const syncRef = useRef<TextSync | null>(null);
    const staleRef = useRef(false);
    const applyingRef = useRef(false);
    const decorationsRef = useRef<{ ids: string[]; model: Map<string, string> }>({ ids: [], model: new Map() });
    const undoKeyRef = useRef<{ set(v: boolean): void } | null>(null);
    // T7 D-5: the text and spans before a cut, until its change lands; then the clip, until an identical paste.
    const armedRef = useRef<{ readonly text: string; readonly spans: readonly ObjectSpan[]; readonly refs: readonly RefSpan[] } | null>(null);
    // R-TXT-35: the reference tokens of the last agreement (a print or an application), carried as decorations.
    const refDecorationsRef = useRef<{ ids: string[]; refs: Map<string, RefSpan> }>({ ids: [], refs: new Map() });
    const clipRef = useRef<CutClip | null>(null);
    // R-TXT-35 (P-2026-11-03-1535): the rewrite of the paths runs; a token was held under the caret.
    const rewritingRef = useRef(false);
    const heldRef = useRef(false);
    const handlers = useRef<{ read: () => void; content: (changes: readonly ContentChange[]) => void; cursor: () => void }>({ read: () => {}, content: () => {}, cursor: () => {} });
    const pause = useMemo(() => pauseOf(APPLY_DELAY_MS, () => handlers.current.read()), []);
    useEffect(() => () => pause.cancel(), [pause]);

    const setDecorations = (spans: readonly ObjectSpan[]): void => {
        const editor = editorRef.current;
        const monaco = monacoRef.current;
        const m = editor?.getModel();
        if (!monaco || !m) return;
        const kept = spans.filter(s => s.end > s.start);
        const ids = m.deltaDecorations(decorationsRef.current.ids, kept.map(s => {
            const from = m.getPositionAt(s.start);
            const to = m.getPositionAt(s.end);
            return {
                range: new monaco.Range(from.lineNumber, from.column, to.lineNumber, to.column),
                options: { stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges },
            };
        }));
        decorationsRef.current = { ids, model: new Map(ids.map((id, i) => [id, kept[i].id])) };
    };

    const setRefDecorations = (refs: readonly RefSpan[]): void => {
        const editor = editorRef.current;
        const monaco = monacoRef.current;
        const m = editor?.getModel();
        if (!monaco || !m) return;
        const kept = refs.filter(s => s.end > s.start);
        const ids = m.deltaDecorations(refDecorationsRef.current.ids, kept.map(s => {
            const from = m.getPositionAt(s.start);
            const to = m.getPositionAt(s.end);
            return {
                range: new monaco.Range(from.lineNumber, from.column, to.lineNumber, to.column),
                options: { stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges },
            };
        }));
        refDecorationsRef.current = { ids, refs: new Map(ids.map((id, i) => [id, kept[i]])) };
    };

    /** R-TXT-35: the reference tokens of the last agreement, where the edit carried them; each keeps the text it was printed with. */
    const carriedRefs = (): RefSpan[] => {
        const m = editorRef.current?.getModel();
        if (!m) return [];
        const { ids, refs } = refDecorationsRef.current;
        return ids.flatMap(id => {
            const r = m.getDecorationRange(id);
            const s = refs.get(id);
            return r && s ? [{ ...s, start: m.getOffsetAt(r.getStartPosition()), end: m.getOffsetAt(r.getEndPosition()) }] : [];
        });
    };

    /** The previous parse's spans, where the edit carried them (R-TXT-22). */
    const carriedSpans = (): ObjectSpan[] => {
        const m = editorRef.current?.getModel();
        if (!m) return [];
        const { ids, model: owners } = decorationsRef.current;
        return ids.flatMap(id => {
            const r = m.getDecorationRange(id);
            const owner = owners.get(id);
            return r && owner ? [{ id: owner, start: m.getOffsetAt(r.getStartPosition()), end: m.getOffsetAt(r.getEndPosition()) }] : [];
        });
    };

    /** The parse's errors, and the misplaced outer references (T7 (5)), as markers. */
    const setMarkers = (parsed: TextParseResult | null, marks: readonly TextMark[] = []): void => {
        const monaco = monacoRef.current;
        const m = editorRef.current?.getModel();
        if (!monaco || !m) return;
        const length = m.getValueLength();
        monaco.editor.setModelMarkers(m, EDIT_MARKER_OWNER, [...(parsed?.errors ?? []), ...marks].map(e => {
            const from = m.getPositionAt(Math.min(e.start, length));
            const to = m.getPositionAt(Math.min(Math.max(e.end, e.start + 1), length));
            return {
                // Step A: a reference error after a syntax error may follow from it, and is a warning.
                severity: 'secondary' in e && e.secondary ? monaco.MarkerSeverity.Warning : monaco.MarkerSeverity.Error,
                message: e.message,
                startLineNumber: from.lineNumber, startColumn: from.column,
                endLineNumber: to.lineNumber, endColumn: to.column,
            };
        }));
    };

    const updateUndoKey = (): void => {
        const editor = editorRef.current;
        undoKeyRef.current?.set(!!editor && !!syncRef.current && editor.getValue() === syncRef.current.text);
    };

    /** The model's text replaces the editor's; the view state (caret, scroll) is kept where the text allows. */
    const reprint = (r: ModelReading): void => {
        const editor = editorRef.current;
        if (!editor || !r.base) return;
        pause.cancel();
        armedRef.current = null;
        clipRef.current = null;
        heldRef.current = false;
        const viewState = editor.saveViewState();
        syncRef.current = { text: r.view.text, model: r.view.text };
        if (editor.getValue() !== r.view.text) editor.setValue(r.view.text);
        if (viewState) editor.restoreViewState(viewState);
        setDecorations(r.base.spans);
        setRefDecorations(r.base.refs ?? []);
        setMarkers(null);
        staleRef.current = false;
        setStale(false);
        setConfirm(null);
        setStatus({ kind: 'synced' });
        updateUndoKey();
    };

    /**
     * R-TXT-35: the agreed text's reference tokens rewritten to the print's (`pathRewrites`), as one step of the editor's
     * own stack. No model write and no application: the rewritten text becomes the agreement, so Cmd/Ctrl+Z stays the
     * app's undo and its reprint restores the text before the application. A token under the caret waits for it to leave.
     */
    const rewritePaths = (printed: readonly RefSpan[]): void => {
        const editor = editorRef.current;
        const monaco = monacoRef.current;
        const m = editor?.getModel();
        const sync = syncRef.current;
        if (!editor || !monaco || !m || !sync || editor.getValue() !== sync.text) return;
        const offsets = (editor.getSelections() ?? []).map(s => ({
            anchor: m.getOffsetAt({ lineNumber: s.selectionStartLineNumber, column: s.selectionStartColumn }),
            head: m.getOffsetAt(s.getPosition()),
        }));
        const r = pathRewrites(sync.text, carriedRefs(), printed, offsets.map(o => ({ start: Math.min(o.anchor, o.head), end: Math.max(o.anchor, o.head) })));
        heldRef.current = r.held > 0;
        if (!r.edits.length) return;
        const spans = carriedSpans();
        const range = (e: TextEdit) => {
            const from = m.getPositionAt(e.start);
            const to = m.getPositionAt(e.end);
            return new monaco.Range(from.lineNumber, from.column, to.lineNumber, to.column);
        };
        rewritingRef.current = true;
        try {
            editor.pushUndoStop();
            editor.executeEdits('textual-paths', r.edits.map(e => ({ range: range(e), text: e.text })), () => offsets.map(o => {
                const a = m.getPositionAt(shiftOffset(o.anchor, r.edits));
                const h = m.getPositionAt(shiftOffset(o.head, r.edits));
                return new monaco.Selection(a.lineNumber, a.column, h.lineNumber, h.column);
            }));
            editor.pushUndoStop();
        } finally {
            rewritingRef.current = false;
        }
        syncRef.current = { ...sync, text: editor.getValue() };
        setDecorations(spans.map(s => ({ ...s, start: shiftOffset(s.start, r.edits), end: shiftOffset(s.end, r.edits) })));
        setRefDecorations(r.refs);
        updateUndoKey();
    };

    const evidence = (base: EditBase): EditEvidence => {
        const now = ((store.getState() as any)?.idlookup ?? {}) as Record<string, any>;
        return { defaults: defaultedSlots(now, base.objects), referencedElsewhere: referencedElsewhere(now, modelId) };
    };

    const apply = async (text: string, parsed: TextParseResult, plan: TextEditPlan): Promise<void> => {
        applyingRef.current = true;
        setStatus({ kind: 'applying' });
        let failedLines = 0;
        try {
            failedLines = (await applyTextEdit(modelId, plan)).failed;
        } catch {
            failedLines = plan.lines?.length ?? 1;
        } finally {
            applyingRef.current = false;
        }
        // The applied text is the new agreement: as typed, with the spans of its objects in the new model, and its reference
        // tokens rewritten to the new print's (R-TXT-35).
        const after = modelReading(((store.getState() as any)?.idlookup ?? {}) as Record<string, any>, modelId);
        syncRef.current = { text, model: after.view.text };
        const editor = editorRef.current;
        if (after.base && plan.diff && editor?.getValue() === text) {
            const b = after.base;
            const rematch = matchObjects({ mm: b.mm, grammar: b.grammar, model: b.objects, parsed, previous: carriedSpans() });
            setDecorations(appliedSpans(parsed, plan.diff.match, rematch));
            setRefDecorations(appliedRefs(text, plan.diff.refs ?? [], plan.diff.match, rematch));
            rewritePaths(b.refs ?? []);
        }
        setStatus({ kind: 'applied', failed: failedLines });
        updateUndoKey();
        if (editor && editor.getValue() !== syncRef.current?.text) pause.poke(); // typed during the run (not the rewrite of the paths)
    };

    /** Reads the editor's text after a pause; `confirmed`, from the panel, drops the refusals it confirms. */
    const readEdit = (confirmed?: readonly ApplyRefusal['code'][]): void => {
        const editor = editorRef.current;
        const sync = syncRef.current;
        const r = readRef.current;
        if (!editor || !sync || !r.base) return;
        if (applyingRef.current) { pause.poke(); return; }
        const text = editor.getValue();
        if (text === sync.text) {
            setMarkers(null);
            setConfirm(null);
            if (staleRef.current) reprint(r); else setStatus({ kind: 'synced' });
            return;
        }
        const ev = evidence(r.base);
        const { parsed, plan } = planEdit(r.base, text, carriedSpans(), ev, confirmed, carriedRefs());
        setMarkers(parsed, plan.diff ? [...outerMarks(text, parsed, plan.diff), ...(plan.diff.unresolved ?? [])] : []);
        // Spans are re-derived from every parse that matched (R-TXT-22); a broken one keeps the carried ones.
        if (plan.diff) setDecorations(certainSpans(parsed, plan.diff.match));
        const d = editDecision(text, sync, parsed, plan, staleRef.current);
        // T7 D-5: a cut's objects are not deleted on the pause; their paste, identical, moves them.
        const held = heldByCut(clipRef.current, r.base, plan);
        if (held && (d.kind === 'apply' || d.kind === 'confirm')) {
            setConfirm(null);
            setStatus({ kind: 'cut', count: held });
            return;
        }
        setConfirm(d.kind === 'confirm'
            ? { text, rows: confirmRows({ plan, parsed, mm: r.base.mm, grammar: r.base.grammar, model: r.base.objects, referencedElsewhere: ev.referencedElsewhere }) }
            : null);
        if (d.kind === 'apply') void apply(text, parsed, plan); else setStatus(d);
    };

    /** T7 D-5: the change of a cut makes the clip; an identical paste re-attaches its spans and ends it. */
    const trackClip = (changes: readonly ContentChange[]): void => {
        const m = editorRef.current?.getModel();
        const one = changes.length === 1 ? changes[0] : null;
        const armed = armedRef.current;
        armedRef.current = null;
        if (!m || !one) return;
        if (armed && one.text === '') { clipRef.current = cutClip(armed.text, armed.spans, one.rangeOffset, one.rangeLength, armed.refs); return; }
        const clip = clipRef.current;
        if (!clip || one.text !== clip.text) return;
        const pasted = pastedSpans(clip, one.rangeOffset, one.text, m.getValue());
        if (!pasted.length) return;
        const ids = new Set(pasted.map(s => s.id));
        setDecorations([...carriedSpans().filter(s => !ids.has(s.id)), ...pasted]);
        const tokens = pastedRefs(clip, one.rangeOffset, one.text, m.getValue());
        if (tokens.length) setRefDecorations([...carriedRefs(), ...tokens]);
        clipRef.current = null;
    };

    /** The pending cut's objects are deleted after all: the clip is dropped and the text read again. */
    const dropClip = (): void => {
        clipRef.current = null;
        readEdit();
    };

    handlers.current = {
        read: () => readEdit(),
        content: changes => {
            if (rewritingRef.current) return;
            trackClip(changes);
            updateUndoKey();
            const editor = editorRef.current;
            const sync = syncRef.current;
            if (editor && sync && editor.getValue() === sync.text && !staleRef.current) {
                pause.cancel();
                setMarkers(null);
                setConfirm(null);
                setStatus({ kind: 'synced' });
                return;
            }
            setStatus({ kind: 'editing' });
            pause.poke();
        },
        // R-TXT-35: a held token is rewritten once the caret leaves it, while the text is the agreed one.
        cursor: () => {
            const r = readRef.current;
            if (!heldRef.current || applyingRef.current || rewritingRef.current || !r.base || r.view.text !== syncRef.current?.model) return;
            rewritePaths(r.base.refs ?? []);
        },
    };

    const onConfirm = (): void => {
        const editor = editorRef.current;
        if (!confirm || !editor || editor.getValue() !== confirm.text) { setConfirm(null); return; }
        setConfirm(null);
        readEdit(['uncertain', 'referenced']);
    };

    // Point 4: the model changed from elsewhere.
    useEffect(() => {
        const sync = syncRef.current;
        const editor = editorRef.current;
        if (!sync || !editor || !read.base) return;
        const action = onModelPrint(sync, view.text, editor.getValue(), applyingRef.current);
        if (action === 'reprint') reprint(read);
        else if (action === 'keep') {
            staleRef.current = true;
            setStale(true);
            setConfirm(null);
        }
    }, [view.text]);

    const onMount: OnMount = (editor, monaco) => {
        editorRef.current = editor;
        monacoRef.current = monaco;
        const r = readRef.current;
        syncRef.current = { text: editor.getValue(), model: r.view.text };
        if (r.base && editor.getValue() === r.view.text) { setDecorations(r.base.spans); setRefDecorations(r.base.refs ?? []); }
        const key = editor.createContextKey<boolean>(APP_UNDO_KEY, true);
        undoKeyRef.current = key;
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyZ, () => {
            void import('../../../joiner').then(({ UndoAction, DUser }) => { UndoAction.new(1, DUser.current, false).commit(); });
        }, APP_UNDO_KEY);
        editor.onDidChangeModelContent(e => handlers.current.content(e.changes));
        editor.onDidChangeCursorSelection(() => handlers.current.cursor());
        // T7 D-5: in the capture phase the selection is still there; the change that follows is the cut.
        editor.getDomNode()?.addEventListener('cut', () => {
            const m = editor.getModel();
            if (m) armedRef.current = { text: m.getValue(), spans: carriedSpans(), refs: carriedRefs() };
        }, true);
        updateUndoKey();
    };

    const shownStatus = editStatusText(stale && status.kind !== 'errors' ? { kind: 'stale' } : status);
    const refusalTitle = status.kind === 'refused' ? status.reasons.join('\n') : shownStatus.text;

    return (
        <div className="textual-tab">
            <div className="textual-tab__bar">
                <span className="textual-tab__title" title={`${modelName} · ${shownLabel}`}>
                    <i className="bi bi-file-earmark-text" aria-hidden="true" />
                    <span className="textual-tab__name">{modelName}</span>
                    <span className="textual-tab__language">{shownLabel}</span>
                </span>
                {mode === 'ebnf' ? (
                    <span className="textual-tab__readonly" title="The grammar is derived from the metamodel">
                        <i className="bi bi-lock" aria-hidden="true" />
                        Read-only
                    </span>
                ) : model && !failed ? (
                    <span className={'textual-tab__status' + (shownStatus.error ? ' textual-tab__status--error' : '')}
                          role="status" title={refusalTitle}>
                        {shownStatus.text}
                        {status.kind === 'cut' && (
                            <button type="button" className="textual-tab__stale-reload" title="Delete the cut objects instead of waiting for their paste"
                                    onClick={dropClip}>
                                Delete
                            </button>
                        )}
                    </span>
                ) : null}
                <span className="textual-tab__spacer" />
                {stale && (
                    <span className="textual-tab__stale" role="alert">
                        <i className="bi bi-exclamation-triangle" aria-hidden="true" />
                        The model changed: your text is kept, not applied
                        <button type="button" className="textual-tab__stale-reload" title="Replace the text with the model's"
                                onClick={() => reprint(readRef.current)}>
                            Reprint
                        </button>
                    </span>
                )}
                <div className="textual-tab__modes" role="group" aria-label="Shown text">
                    {MODES.map(m => (
                        <button
                            key={m.mode}
                            type="button"
                            className={'textual-tab__mode' + (mode === m.mode ? ' textual-tab__mode--active' : '')}
                            aria-pressed={mode === m.mode}
                            title={m.title}
                            onClick={() => setMode(m.mode)}
                        >
                            <i className={`bi ${m.icon}`} aria-hidden="true" />
                            {m.label}
                        </button>
                    ))}
                </div>
                <button type="button" className="textual-tab__close" aria-label="Close the text" title="Close"
                        onClick={() => DockManager.closeTab(tabId)}>
                    <i className="bi bi-x-lg" aria-hidden="true" />
                </button>
            </div>
            {model && <NotationIssues issues={view.issues} warnings={view.warnings} />}
            <div className="textual-tab__body textual-tab__body--layered">
                {!model ? (
                    <div className="textual-tab__message">
                        <i className="bi bi-question-circle" aria-hidden="true" />
                        The model is no longer in the project.
                    </div>
                ) : failed ? (
                    <div className="textual-tab__message textual-tab__message--error" role="alert">
                        <i className="bi bi-exclamation-triangle" aria-hidden="true" />
                        {`The model cannot be printed: ${view.error}`}
                    </div>
                ) : (
                    <>
                        {/* The text stays mounted under the EBNF, so a pending edit survives the toggle. */}
                        <div className={'textual-tab__layer' + (mode === 'text' ? '' : ' textual-tab__layer--hidden')}>
                            {read.base && (
                                <Editor width="100%" height="100%" language="plaintext" defaultValue={view.text}
                                        onMount={onMount} options={EDITOR_OPTIONS} />
                            )}
                        </div>
                        {mode === 'ebnf' && (
                            <div className="textual-tab__layer">
                                <Editor width="100%" height="100%" language="plaintext" value={view.ebnf}
                                        options={{ ...EDITOR_OPTIONS, readOnly: true, domReadOnly: true }} />
                            </div>
                        )}
                        {mode === 'text' && confirm && confirm.rows.length > 0 && (
                            <TextConfirmPanel rows={confirm.rows} busy={status.kind === 'applying'} onConfirm={onConfirm} />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

/** What the «new» mode reads a text against: the metamodel's grammar, or why it cannot be derived. */
interface NewModelGrammar {
    readonly metamodel: TextMetamodel | null;
    readonly grammar: ConcreteGrammar | null;
    readonly error: string | null;
    readonly issues?: readonly AnnotationIssue[];
}

/** An extent that matches no model: the metamodel alone is read (an empty extent selects every model, evalExtent.ts). */
const NO_MODEL_EXTENT = '\u0000no-model';

/** The grammar of the metamodel `metamodelId`, read as the Text tab reads a model's, with no object. */
export function metamodelGrammar(lookup: Readonly<Record<string, any>>, metamodelId: string): NewModelGrammar {
    try {
        const globals = buildEvalContext({ ...evalContextFor(lookup, metamodelId, ''), targetMetamodelId: metamodelId }, { extentModelId: NO_MODEL_EXTENT });
        const metamodel = textInputOf(globals).metamodel;
        const stored = storedNotation(lookup, metamodelId);
        const { grammar, issues } = textualNotation(metamodel, stored.decoded, stored.ids);
        return { metamodel, grammar, error: null, issues };
    } catch (e) {
        return { metamodel: null, grammar: null, error: messageOf(e) };
    }
}

/** The pause in typing after which the text is read. */
const READ_DELAY_MS = 300;

/** The owner of the «new» mode's markers in the Monaco model. */
const MARKER_OWNER = 'textual-new-model';

export interface NewTextualTabProps {
    readonly metamodelId: string;
    /** The picker entry's label: the language's name (dataManagerOption.ts `textualOptionLabel`). */
    readonly label: string;
    /** The dock tab's id, for the close control. */
    readonly tabId: string;
    /** The model's name when the tab opens. */
    readonly initialName: string;
    /** Creates the model `name` from the JjScript lines `script`; true when the model was created. */
    readonly onCreate: (name: string, script: string) => Promise<boolean>;
}

export function NewTextualTab({ metamodelId, label, tabId, initialName, onCreate }: NewTextualTabProps) {
    const lookup = useSelector((state: any) => state.idlookup) as Record<string, any>;
    const metamodel = lookup?.[metamodelId];
    const metamodelName = typeof metamodel?.name === 'string' && metamodel.name ? metamodel.name : 'Unnamed';
    const shownLabel = metamodel ? textualOptionLabel(metamodel.name, textualLanguageOf(metamodel._state?.[TEXTUAL_SYNTAX_KEY])) : label;
    const input = useMemo(() => metamodelGrammar(lookup ?? {}, metamodelId), [lookup, metamodelId]);
    const [text, setText] = useState('');
    const [name, setName] = useState(initialName);
    const [reading, setReading] = useState<NewModelReading | null>(null);
    const [creating, setCreating] = useState(false);
    const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
    const monacoRef = useRef<Parameters<OnMount>[1] | null>(null);
    const [editorReady, setEditorReady] = useState(false);

    useEffect(() => {
        const { grammar, metamodel: mm } = input;
        if (!grammar || !mm) { setReading(null); return; }
        const timer = setTimeout(() => setReading(readNewModel(text, grammar, mm)), READ_DELAY_MS);
        return () => clearTimeout(timer);
    }, [text, input]);

    useEffect(() => {
        const editor = editorRef.current;
        const monaco = monacoRef.current;
        const model = editor?.getModel();
        if (!editor || !monaco || !model) return;
        // Markers of a text the editor no longer holds would land in the wrong place.
        const live = reading && reading.text === model.getValue() ? reading.markers : [];
        const length = model.getValueLength();
        monaco.editor.setModelMarkers(model, MARKER_OWNER, live.map(m => {
            const from = model.getPositionAt(Math.min(m.start, length));
            const to = model.getPositionAt(Math.min(Math.max(m.end, m.start + 1), length));
            return {
                severity: monaco.MarkerSeverity.Error,
                message: m.message,
                startLineNumber: from.lineNumber, startColumn: from.column,
                endLineNumber: to.lineNumber, endColumn: to.column,
            };
        }));
    }, [reading, editorReady]);

    const onMount: OnMount = (editor, monaco) => {
        editorRef.current = editor;
        monacoRef.current = monaco;
        setEditorReady(true);
    };

    const current = reading !== null && reading.text === text;
    const lines = current ? reading.lines : null;
    const canCreate = !creating && lines !== null && name.trim() !== '';
    const status = !current
        ? 'Reading…'
        : reading.lines === null
            ? `${reading.markers.length} problem${reading.markers.length === 1 ? '' : 's'}`
            : `${reading.objects} object${reading.objects === 1 ? '' : 's'}`;

    const create = async () => {
        if (!canCreate || !lines) return;
        setCreating(true);
        let created = false;
        try {
            created = await onCreate(name.trim(), lines.join('\n'));
        } finally {
            setCreating(false);
        }
        // The canvas of the new model takes the tab's place: a second «Create model» would make a second model.
        if (created) DockManager.closeTab(tabId);
    };

    return (
        <div className="textual-tab">
            <div className="textual-tab__bar">
                <span className="textual-tab__title" title={`New model of ${metamodelName} · ${shownLabel}`}>
                    <i className="bi bi-file-earmark-plus" aria-hidden="true" />
                    <span className="textual-tab__name">New model</span>
                    <span className="textual-tab__language">{shownLabel}</span>
                </span>
                <label className="textual-tab__model-name">
                    <span>Name</span>
                    <input type="text" value={name} spellCheck={false} aria-label="Model name"
                           onChange={e => setName(e.target.value)} />
                </label>
                <span className="textual-tab__spacer" />
                <span className={'textual-tab__status' + (current && reading.lines === null ? ' textual-tab__status--error' : '')}
                      role="status">
                    {status}
                </span>
                <button type="button" className="textual-tab__create" disabled={!canCreate}
                        title={canCreate ? 'Create the model from the text' : 'Fix the marked problems and give the model a name'}
                        onClick={() => void create()}>
                    <i className="bi bi-plus-lg" aria-hidden="true" />
                    {creating ? 'Creating…' : 'Create model'}
                </button>
                <button type="button" className="textual-tab__close" aria-label="Close the text" title="Close"
                        onClick={() => DockManager.closeTab(tabId)}>
                    <i className="bi bi-x-lg" aria-hidden="true" />
                </button>
            </div>
            {metamodel && <NotationIssues issues={input.issues} />}
            <div className="textual-tab__body">
                {!metamodel ? (
                    <div className="textual-tab__message">
                        <i className="bi bi-question-circle" aria-hidden="true" />
                        The metamodel is no longer in the project.
                    </div>
                ) : input.error !== null ? (
                    <div className="textual-tab__message textual-tab__message--error" role="alert">
                        <i className="bi bi-exclamation-triangle" aria-hidden="true" />
                        {`The notation cannot be derived: ${input.error}`}
                    </div>
                ) : (
                    <Editor
                        width="100%"
                        height="100%"
                        language="plaintext"
                        defaultValue=""
                        onChange={v => setText(v ?? '')}
                        onMount={onMount}
                        options={{
                            readOnly: creating,
                            minimap: { enabled: false },
                            lineNumbers: 'off',
                            folding: false,
                            lineDecorationsWidth: EDITOR_DECORATIONS_WIDTH,
                            glyphMargin: true,
                            fontSize: 13,
                            fontFamily: "'IBM Plex Mono', Monaco, Consolas, monospace",
                            scrollBeyondLastLine: false,
                            renderLineHighlight: 'none',
                            wordWrap: 'off',
                        }}
                    />
                )}
            </div>
        </div>
    );
}
