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
import type { ReactNode } from 'react';
import { useSelector, useStore } from 'react-redux';
import Editor from '@monaco-editor/react';
import type { OnMount } from '@monaco-editor/react';
import { buildEvalContext } from '../../../jjscript';
import { evalContextFor } from '../../../components/editor-v2/sim/simBridge';
import DockManager from '../../../components/abstract/DockManager';
import { TEXTUAL_SYNTAX_KEY, textualLanguageNameOf, textualLanguageOf, textualOptionLabel } from '../../../components/editor-v2/dataManagerOption';
import { concreteGrammarEbnf, concreteGrammarEbnfSpans } from '../concreteGrammar';
import { textOutline } from '../languageService';
import type { OutlineNode } from '../languageService';
import { classFeatures } from '../metamodel';
import { readNewModel } from '../modelLines';
import { conformanceMarks, CONFORMANCE_SOURCE } from '../conformanceMarks';
import type { MarkedViolation } from '../conformanceMarks';
import { commentsOf, isApplicableParse, parseText } from '../parser';
import type { TextParseResult } from '../parser';
import { printTextModel } from '../printer';
import type { ObjectSpan, RefSpan, UnprintedObject } from '../printer';
import { applyTextEdit, defaultedSlots, referencedElsewhere } from '../textApply';
import { reprintChanged } from '../textReprint';
import type { ReprintResult } from '../textReprint';
import { deletedObjects, planTextEdit } from '../textDiff';
import type { ApplyRefusal, RefTarget, TextDiff, TextEditPlan } from '../textDiff';
import { identityOf, matchObjects } from '../textMatch';
import type { TextMatch } from '../textMatch';
import { elementIdsOf, readSyntax, storedSyntax, styleBaseOf, textualNotation, withStyleBase } from '../syntaxRecord';
import { STYLE_CATALOG, isStyleBase } from '../style';
import type { StyleBase } from '../style';
import { STYLE_TOKEN_KEYS } from '../annotations';
import type { AnnotationIssue, ElementIds, SyntaxAnnotations } from '../annotations';
import type { ConcreteGrammar, LiteralSrc } from '../concreteGrammar';
import type { DecodedSyntax } from '../syntaxRecord';
import type { TextMetamodel, TextObject } from '../metamodel';
import type { NewModelReading } from '../modelLines';
import TextConfirmPanel, { confirmRows, needsConfirmation } from './TextConfirmPanel';
import type { ConfirmRow } from './TextConfirmPanel';
import type { TextualSession } from './textualMonaco';
import SyntaxForm from './SyntaxForm';
import type { PreviewKind } from './SyntaxForm';
import { fieldKey, fieldPhrase, literalField, setLiteral, storedErrors, styleRefusal } from '../syntaxForm';
import type { FieldRef, FormFault } from '../syntaxForm';
import { useSyntaxDraft } from './useSyntaxDraft';
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
/** The source of a GenModel documentation annotation as the Ecore import writes it (api/data.ts `parseDAnnotation`). */
const GENMODEL_DOCUMENTATION = 'http://www.eclipse.org/emf/2002/GenModel/documentation=';

/**
 * The globals of `buildEvalContext` as T1's input. A class shell's supertypes are shells, read by name; an interface
 * is abstract (no instance can stand for it); a reference is many-valued when its upper bound is above one. Each
 * object keeps the slots of its class's features (own and inherited, metamodel.ts `classFeatures`): an attribute as
 * the eval context gives it, a reference by the target's id. An object with no class in the metamodel is skipped.
 *
 * With the lookup, each feature reads `ordered` off its D-layer element by the shell's id (step T7, D-2): ordered
 * unless the element says `ordered: false`, the Ecore default. Without it no feature carries the flag. With it too,
 * for the hover (step B1): a feature's bounds, and the GenModel documentation of a class, a feature, an enumeration and
 * a literal, which the Ecore import stores as a `DAnnotation` whose source ends in `documentation=<value>`.
 */
export function textInputOf(globals: Readonly<Record<string, any>>, lookup?: Readonly<Record<string, any>>): TextInput {
    const orderedOf = (f: any): { ordered?: boolean } => (lookup ? { ordered: lookup[f?.id]?.ordered !== false } : {});
    const boundsOf = (f: any): { lower?: number; upper?: number } => {
        const d = lookup?.[f?.id];
        return typeof d?.lowerBound === 'number' && typeof d?.upperBound === 'number' ? { lower: d.lowerBound, upper: d.upperBound } : {};
    };
    const docOf = (el: any): string | undefined => {
        for (const a of list(lookup?.[el?.id]?.annotations)) {
            const source = lookup?.[a]?.source;
            if (typeof source === 'string' && source.startsWith(GENMODEL_DOCUMENTATION)) return source.slice(GENMODEL_DOCUMENTATION.length);
        }
        return undefined;
    };
    const withDoc = (el: any): { doc?: string } => { const doc = docOf(el); return doc === undefined ? {} : { doc }; };
    const metamodel: TextMetamodel = {
        classes: list(globals.classes).map(c => ({
            name: nameOf(c),
            isAbstract: !!c.isAbstract || !!c.isInterface,
            supers: list(c.superTypes).map(nameOf),
            attributes: list(c.attributes).map(a => ({ name: nameOf(a), type: String(a.type ?? ''), many: !!a.multiValued, ...orderedOf(a), ...boundsOf(a), ...withDoc(a) })),
            references: list(c.references).map(r => ({
                name: nameOf(r),
                type: String(r.type ?? ''),
                containment: !!r.containment,
                many: r.multiplicity === '*' || Number(r.upperBound) > 1,
                ...orderedOf(r),
                ...boundsOf(r),
                ...withDoc(r),
            })),
            ...withDoc(c),
        })),
        enumerations: list(globals.enumerations).map(e => {
            const literalDocs = Object.fromEntries(list(e.literals).flatMap(l => { const doc = docOf(l); return doc === undefined ? [] : [[nameOf(l), doc]]; }));
            return { name: nameOf(e), literals: list(e.literals).map(nameOf), ...withDoc(e), ...(Object.keys(literalDocs).length ? { literalDocs } : {}) };
        }),
    };
    const objects: TextObject[] = [];
    for (const h of list(globals.instances)) {
        const cls = metamodel.classes.find(c => c.name === nameOf(h?.instanceOf));
        const id = idOf(h);
        if (!cls || !id) continue;
        const slots: Record<string, unknown> = {};
        for (const f of classFeatures(metamodel, cls)) {
            const v = h[f.name];
            // A nameless object reads name '' (R-TXT-45): unset for the text, so it never prints `Port ""` (R-TXT-46 D6).
            if (f.kind === 'attribute') slots[f.name] = f.name === 'name' && v === '' ? null : v;
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
    /** The metamodel and the objects read, also when the print fails: the Syntax mode edits a record that breaks it (C2b). */
    readonly input?: TextInput;
}

/** The view of `textualView` and the base an edit of its text is diffed against; a failure is reported, never thrown. */
/** The lookup, when given, reads `ordered` for the diff (`textInputOf`). */
export function readModel(globals: Readonly<Record<string, any>>, stored: StoredNotation = NO_ANNOTATIONS, lookup?: Readonly<Record<string, any>>): ModelReading {
    let input: TextInput | undefined;
    let grammar: ConcreteGrammar;
    let issues: readonly AnnotationIssue[];
    try {
        input = textInputOf(globals, lookup);
        ({ grammar, issues } = textualNotation(input.metamodel, stored.decoded, stored.ids));
    } catch (e) {
        return { view: { text: '', ebnf: '', error: messageOf(e) }, base: null, ...(input ? { input } : {}) };
    }
    const ebnf = concreteGrammarEbnf(grammar);
    try {
        const printed = printTextModel(grammar, input.objects);
        const warnings = unprintedIssues(printed.unprinted);
        return {
            view: { text: printed.text, ebnf, error: null, issues, ...(warnings.length ? { warnings } : {}) },
            base: { mm: input.metamodel, grammar, objects: input.objects, spans: printed.spans, unprinted: printed.unprinted, refs: printed.refs ?? [] },
            input,
        };
    } catch (e) {
        return { view: { text: '', ebnf, error: messageOf(e), issues }, base: null, input };
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
    /** P-2026-11-03-2326: the agreed text's object spans and reference tokens, kept with the agreement. */
    readonly spans?: readonly ObjectSpan[];
    readonly refs?: readonly RefSpan[];
    /** E1b (R-TXT-54 E10): the print `model` was agreed as, for T10's splice. */
    readonly printed?: AgreedPrint;
}

/** E1b: the old print of an agreement: its object spans, its reference tokens, and the grammar it was printed in. */
export interface AgreedPrint {
    readonly grammar: ConcreteGrammar;
    readonly spans: readonly ObjectSpan[];
    readonly refs: readonly RefSpan[];
}

export function agreedPrint(base: Pick<EditBase, 'grammar' | 'spans' | 'refs'>): AgreedPrint {
    return { grammar: base.grammar, spans: base.spans, refs: base.refs ?? [] };
}

/**
 * T10, lane E1b (R-TXT-20, R-TXT-54 E10): the text a change of the model's print puts in place of the agreed one, with
 * its spans and reference tokens. When the agreed text is not the bare print, `reprintChanged` keeps the typed text of
 * every object whose print did not change; else, or when it cannot splice safely, the whole new print, as before.
 * `carried` is what the agreed text carries; `text` and `base` are the changed model's print.
 */
export function modelReprint(sync: TextSync, carried: { readonly spans: readonly ObjectSpan[]; readonly refs?: readonly RefSpan[] }, text: string,
    base: Pick<EditBase, 'grammar' | 'spans' | 'refs'>): ReprintResult & { readonly spliced: boolean } {
    const full = { text, spans: base.spans, refs: base.refs ?? [], spliced: false };
    if (sync.text === sync.model || !sync.printed) return full;
    const r = reprintChanged({
        grammar: base.grammar,
        previous: sync.printed.grammar,
        typed: { text: sync.text, spans: carried.spans, refs: carried.refs ?? [] },
        old: { text: sync.model, spans: sync.printed.spans, refs: sync.printed.refs },
        next: { text, spans: base.spans, refs: base.refs ?? [] },
    });
    return r ? { ...r, spliced: true } : full;
}

/**
 * P-2026-11-03-2326: the spans and tokens of a text equal to the agreed one again (a delete and a paste back, Monaco's
 * own undo, a retyped text), which the edits back to it may have collapsed: the agreement's. Null for another text.
 */
export function agreedEvidence(sync: TextSync, text: string): { readonly spans: readonly ObjectSpan[]; readonly refs: readonly RefSpan[] } | null {
    if (text !== sync.text || !sync.spans) return null;
    return { spans: sync.spans, refs: sync.refs ?? [] };
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

/**
 * R-TXT-45, C2c (D4): of the plan's candidates (`TextEditPlan.named`), the handles of the objects the model after the
 * run actually names. A cleared slot reads nameless, so a removed name is listed only where the core still assigns one.
 */
export function namedByModel(plan: Pick<TextEditPlan, 'named' | 'handles'>, grammar: ConcreteGrammar, objects: readonly TextObject[]): string[] {
    if (!plan.named?.length) return [];
    const byId = new Map(objects.map(o => [o.id, o]));
    return plan.named.filter(h => {
        const id = plan.handles.get(h);
        const o = id === undefined ? undefined : byId.get(id);
        return !!o && !!identityOf(grammar, o);
    });
}

/**
 * R-TXT-44 (1), (2): after an application in which the app named objects the text leaves nameless (the list measured by
 * `namedByModel`), the print to reprint once, so the tab never keeps a text that differs from the model's print; null
 * otherwise: the typed text stays the agreement.
 */
export function namedReprint(plan: Pick<TextEditPlan, 'named'>, print: string, typed: string): string | null {
    return plan.named?.length && print !== typed ? print : null;
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

/**
 * E1b: a read text that asks for no change of the model (a comment typed, say) is the new agreement, so a later change
 * of the model splices into it (T10) instead of finding a pending edit. Null for any other decision.
 */
export function unchangedAgreement(d: EditDecision, text: string, print: string, base: Pick<EditBase, 'grammar' | 'spans' | 'refs'>): TextSync | null {
    return d.kind === 'unchanged' ? { text, model: print, printed: agreedPrint(base) } : null;
}

/** What the lookup gives an edit besides the objects (textApply.ts `defaultedSlots`, `referencedElsewhere`). */
export interface EditEvidence {
    readonly defaults?: ReadonlyMap<string, ReadonlySet<string>>;
    readonly referencedElsewhere?: ReadonlySet<string>;
    /** The instance names of the model, which a created object's handle avoids (textDiff.ts `PlanInput.reserved`). */
    readonly reserved?: ReadonlySet<string>;
}

/** The `name` and `initialName` of the base's objects, printed or not, as the store holds them now. */
export function instanceNames(lookup: Readonly<Record<string, any>>, base: Pick<EditBase, 'objects' | 'unprinted'>): Set<string> {
    const out = new Set<string>();
    for (const o of [...base.objects, ...base.unprinted]) {
        const d = lookup[o.id];
        for (const n of [d?.name, d?.initialName]) if (typeof n === 'string' && n) out.add(n);
    }
    return out;
}

/**
 * Parses the text and plans its application on the base, with the spans the editor carried over the edit (R-TXT-22)
 * and the reference tokens it carried (`refs`, R-TXT-35: a token the user did not retype keeps its target).
 */
export function planEdit(base: EditBase, text: string, carried: readonly ObjectSpan[], evidence: EditEvidence = {},
                         confirmed?: readonly ApplyRefusal['code'][], refs: readonly RefSpan[] = [],
                         given?: TextParseResult): { readonly parsed: TextParseResult; readonly plan: TextEditPlan } {
    // Step B1: the providers' parse of this very text, grammar and carried tokens, when the caller has it.
    const parsed = given ?? parseText(text, base.grammar, { keep: refs });
    const plan = planTextEdit({
        mm: base.mm, grammar: base.grammar, model: base.objects, parsed, unprinted: base.unprinted, previous: carried, previousRefs: refs,
        ...(evidence.defaults ? { defaults: evidence.defaults } : {}),
        ...(evidence.referencedElsewhere ? { referencedElsewhere: evidence.referencedElsewhere } : {}),
        ...(evidence.reserved ? { reserved: evidence.reserved } : {}),
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

/**
 * Step C lane C3b (R-TXT-41 D2, R-TXT-43, R-TXT-37): the deletions that ask before the pause applies them, counted at
 * the top of each deleted subtree. Measured on the step C corpus, a truncated indentation text deletes 3 to 9 such
 * subtrees, while deleting one printed block deletes 1, with what it contains.
 */
export const GUARD_ROOTS = 3;

/** What the guard asks about: the objects the plan deletes, contents included, of the printed ones. */
export interface DeletionGuard {
    readonly deleted: number;
    readonly total: number;
    /** Every printed object goes (R-TXT-43). */
    readonly all: boolean;
    /** Step D lane D1 (R-TXT-37, R-TXT-53 D7): the deleted objects a comment of the text covers, `Class name`, in text order. */
    readonly commented?: readonly string[];
}

/** What the pause read, for the guard to tell an object commented out from one deleted (D1). */
export interface GuardRead {
    readonly grammar: ConcreteGrammar;
    readonly text: string;
    readonly parsed: Pick<TextParseResult, 'tree'>;
    /** The previous parse's spans, where the edit carried them. */
    readonly carried: readonly ObjectSpan[];
}

/**
 * Step D lane D1 (R-TXT-37, R-TXT-53 D7): the carried spans of the deleted subtrees that lie inside a comment of the
 * text, in text order. A run of comments separated by whitespace only covers as one, for a block commented line by
 * line; a span collapsed by a deletion is never covered.
 */
export function commentedOut(plan: TextEditPlan, read: GuardRead): ObjectSpan[] {
    if (!plan.diff || !read.parsed.tree) return [];
    const runs: [number, number][] = [];
    for (const c of [...commentsOf(read.parsed.tree, read.grammar)].sort((a, b) => a.start - b.start)) {
        const last = runs[runs.length - 1];
        if (last && c.start >= last[1] && !read.text.slice(last[1], c.start).trim()) last[1] = Math.max(last[1], c.end);
        else runs.push([c.start, c.end]);
    }
    const roots = new Set(plan.diff.ops.flatMap(op => op.op === 'delete' ? [op.model] : []));
    return read.carried
        .filter(s => roots.has(s.id) && s.end > s.start && runs.some(([from, to]) => from <= s.start && s.end <= to))
        .sort((a, b) => a.start - b.start);
}

/** An object as the guard names it, as the confirmation panel does: `Class name`, or `Class (unnamed)`. */
function guardLabel(g: ConcreteGrammar, o: TextObject | undefined, id: string): string {
    if (!o) return id;
    const name = identityOf(g, o);
    return name === null ? `${o.cls} (unnamed)` : `${o.cls} ${name}`;
}

/**
 * The guard of an applicable plan: `GUARD_ROOTS` deleted subtrees or more, or every object, or, given what the pause
 * read, a deleted object a comment covers (D1); null otherwise.
 */
export function deletionGuard(base: Pick<EditBase, 'mm' | 'objects'>, plan: TextEditPlan, read?: GuardRead): DeletionGuard | null {
    if (!plan.diff || !plan.lines?.length) return null;
    const gone = deletedObjects(base.mm, base.objects, plan.diff.ops);
    if (!gone.size) return null;
    const roots = plan.diff.ops.filter(op => op.op === 'delete' && gone.has(op.model)).length;
    const all = base.objects.every(o => gone.has(o.id));
    const byId = new Map(base.objects.map(o => [o.id, o]));
    const commented = read ? commentedOut(plan, read).map(s => guardLabel(read.grammar, byId.get(s.id), s.id)) : [];
    if (commented.length) return { deleted: gone.size, total: base.objects.length, all, commented };
    return all || roots >= GUARD_ROOTS ? { deleted: gone.size, total: base.objects.length, all } : null;
}

/** The objects a guard names, three at most, then how many more. */
const commentedText = (names: readonly string[]): string => `${names.slice(0, 3).join(', ')}${names.length > 3 ? ` (+${names.length - 3})` : ''}`;

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
type EditStatus = EditDecision | { readonly kind: 'editing' } | { readonly kind: 'applying' } | { readonly kind: 'applied'; readonly failed: number; readonly named?: number }
    /** T7 D-5: a cut's objects wait for their paste. */
    | { readonly kind: 'cut'; readonly count: number }
    /** C3b: the deletions of the edit wait for a confirmation; `kept`, the user cancelled them. */
    | ({ readonly kind: 'guard' } & DeletionGuard) | { readonly kind: 'kept' };

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
        case 'guard': return {
            text: s.commented?.length ? `Not applied · comments out ${commentedText(s.commented)}, confirm below`
                : s.all ? `Not applied · deletes every object (${s.total}), confirm below` : `Not applied · deletes ${s.deleted} objects of ${s.total}, confirm below`,
            error: false,
        };
        case 'kept': return { text: 'Not applied · deletions cancelled', error: true };
        case 'apply': case 'applying': return { text: 'Applying…', error: false };
        case 'applied': return s.failed
            ? { text: `Applied, ${s.failed} line${s.failed === 1 ? '' : 's'} failed`, error: true }
            : s.named
                ? { text: `Applied · the app named ${s.named} object${s.named === 1 ? '' : 's'} the text leaves nameless`, error: false }
                : { text: 'Applied', error: false };
    }
}

/** One row of the outline as shown: a node, its depth, and whether its children show below it. */
export interface OutlineRow {
    readonly node: OutlineNode;
    readonly depth: number;
    readonly open: boolean;
}

/**
 * The rows of the outline (step B2): the nodes in text order, the children of a collapsed node hidden. With a filter, the
 * nodes whose label or secondary text holds it, case aside, each under its ancestors, every level open.
 */
export function outlineRows(nodes: readonly OutlineNode[], collapsed: ReadonlySet<string>, filter: string): OutlineRow[] {
    const q = filter.trim().toLowerCase();
    if (!q) {
        const out: OutlineRow[] = [];
        const walk = (ns: readonly OutlineNode[], depth: number): void => {
            for (const n of ns) {
                const open = n.children.length > 0 && !collapsed.has(n.key);
                out.push({ node: n, depth, open });
                if (open) walk(n.children, depth + 1);
            }
        };
        walk(nodes, 0);
        return out;
    }
    const hit = (n: OutlineNode): boolean => n.label.toLowerCase().includes(q) || n.detail.toLowerCase().includes(q);
    const walk = (ns: readonly OutlineNode[], depth: number): OutlineRow[] => ns.flatMap(n => {
        const below = walk(n.children, depth + 1);
        return hit(n) || below.length ? [{ node: n, depth, open: below.length > 0 }, ...below] : [];
    });
    return walk(nodes, 0);
}

/** The outline's row height: the 8 px grid. */
export const OUTLINE_ROW_HEIGHT = 24;

/** The rows to render of `count` scrolled by `scrollTop` in `height` pixels, and `overscan` rows either side: `[first, last)`. */
export function outlineWindow(count: number, scrollTop: number, height: number, overscan = 8): { readonly first: number; readonly last: number } {
    const first = Math.max(0, Math.floor(scrollTop / OUTLINE_ROW_HEIGHT) - overscan);
    const last = Math.min(count, Math.ceil((scrollTop + height) / OUTLINE_ROW_HEIGHT) + overscan);
    return { first, last: Math.max(first, last) };
}

/** Where the outline's open state of a tab is kept. */
const outlineKey = (tabId: string): string => `jjodel.textual.outline.${tabId}`;

/** The outline's open state of the tab `tabId`, open when never set. */
export function outlineOpenOf(tabId: string): boolean {
    try { return window.localStorage.getItem(outlineKey(tabId)) !== 'closed'; } catch { return true; }
}

function storeOutlineOpen(tabId: string, open: boolean): void {
    try { window.localStorage.setItem(outlineKey(tabId), open ? 'open' : 'closed'); } catch { /* storage unavailable: kept for the session */ }
}

const OUTLINE_ICONS: Record<OutlineNode['kind'], string> = { object: 'bi-box', group: 'bi-collection', unknown: 'bi-question-square' };

/** The pause after an edit before the outline reads the text again; the caret follows at once. */
const OUTLINE_DELAY_MS = 150;

interface TextNavigatorProps {
    readonly editor: MonacoEditor | null;
    readonly session: TextualSession | null;
    readonly open: boolean;
    readonly children: ReactNode;
}

/**
 * The outline left of the text and the breadcrumb above it (step B2, R-TXT-39 (1), (2)). Both read the session's
 * analysis of the current version (languageService.ts `textOutline`) and follow the caret: the node at the caret is the
 * selected row, scrolled into view, and the breadcrumb's path. A click on a row or a segment moves the caret to the node
 * and reveals its line. The rows are windowed by hand: only the visible ones are rendered.
 */
function TextNavigator({ editor, session, open, children }: TextNavigatorProps) {
    const [version, setVersion] = useState(0);
    const [caret, setCaret] = useState(0);
    const [filter, setFilter] = useState('');
    const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(() => new Set());
    const [scroll, setScroll] = useState({ top: 0, height: 0 });
    const listRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!editor) return;
        let timer: ReturnType<typeof setTimeout> | null = null;
        const offset = (): number => {
            const m = editor.getModel();
            const p = editor.getPosition();
            return m && p ? m.getOffsetAt(p) : 0;
        };
        setCaret(offset());
        setVersion(v => v + 1);
        const content = editor.onDidChangeModelContent(() => {
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => { timer = null; setVersion(v => v + 1); }, OUTLINE_DELAY_MS);
        });
        const cursor = editor.onDidChangeCursorPosition(() => setCaret(offset()));
        return () => { if (timer) clearTimeout(timer); content.dispose(); cursor.dispose(); };
    }, [editor]);

    const outline = useMemo(() => {
        const r = session?.current();
        return r ? textOutline(r.text, r.parsed, r.grammar) : null;
    }, [session, version]);
    const path = useMemo(() => outline?.pathAt(caret) ?? [], [outline, caret]);
    const selected = path.length ? path[path.length - 1].key : null;

    // Following the caret: a selected node inside a collapsed one opens its ancestors.
    useEffect(() => {
        if (path.length < 2 || !path.slice(0, -1).some(n => collapsed.has(n.key))) return;
        setCollapsed(c => { const next = new Set(c); for (const n of path.slice(0, -1)) next.delete(n.key); return next; });
    }, [selected]);

    const rows = useMemo(() => (outline && open ? outlineRows(outline.nodes, collapsed, filter) : []), [outline, open, collapsed, filter]);

    useEffect(() => {
        const el = listRef.current;
        if (!el) return;
        const measure = (): void => setScroll({ top: el.scrollTop, height: el.clientHeight });
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        return () => ro.disconnect();
    }, [open]);

    // The selected row scrolled into view.
    useEffect(() => {
        const el = listRef.current;
        if (!el || selected === null) return;
        const i = rows.findIndex(r => r.node.key === selected);
        if (i < 0) return;
        const top = i * OUTLINE_ROW_HEIGHT;
        if (top < el.scrollTop) el.scrollTop = top;
        else if (top + OUTLINE_ROW_HEIGHT > el.scrollTop + el.clientHeight) el.scrollTop = top + OUTLINE_ROW_HEIGHT - el.clientHeight;
    }, [selected, rows]);

    const pick = (n: OutlineNode): void => {
        const m = editor?.getModel();
        if (!editor || !m) return;
        const p = m.getPositionAt(n.selectStart);
        editor.setPosition(p);
        editor.revealLineInCenterIfOutsideViewport(p.lineNumber);
        editor.focus();
    };
    const toggle = (n: OutlineNode): void => setCollapsed(c => {
        const next = new Set(c);
        if (next.has(n.key)) next.delete(n.key); else next.add(n.key);
        return next;
    });

    const { first, last } = outlineWindow(rows.length, scroll.top, scroll.height);
    const filtering = filter.trim() !== '';

    return (
        <div className="textual-tab__nav">
            {open && (
                <aside className="textual-tab__outline" aria-label="Outline">
                    <label className="textual-tab__outline-filter">
                        <i className="bi bi-search" aria-hidden="true" />
                        <input type="text" value={filter} placeholder="Filter" spellCheck={false} aria-label="Filter the outline"
                               onChange={e => setFilter(e.target.value)}
                               onKeyDown={e => { if (e.key === 'Escape') setFilter(''); }} />
                    </label>
                    <div className="textual-tab__outline-list" ref={listRef} role="tree" aria-label="Objects of the text"
                         onScroll={e => setScroll({ top: e.currentTarget.scrollTop, height: e.currentTarget.clientHeight })}>
                        <div style={{ height: rows.length * OUTLINE_ROW_HEIGHT, position: 'relative' }}>
                            {rows.slice(first, last).map((r, i) => {
                                const n = r.node;
                                const cls = 'textual-tab__outline-row'
                                    + (n.key === selected ? ' textual-tab__outline-row--selected' : '')
                                    + (n.kind !== 'object' ? ' textual-tab__outline-row--group' : '')
                                    + (n.recovered && n.kind === 'object' ? ' textual-tab__outline-row--recovered' : '');
                                return (
                                    <div key={n.key} className={cls} role="treeitem" aria-level={r.depth + 1} aria-selected={n.key === selected}
                                         {...(n.children.length ? { 'aria-expanded': r.open } : {})} tabIndex={-1}
                                         title={n.recovered && n.kind === 'object' ? 'Recovered from a broken text: shown, never applied' : n.label}
                                         style={{ top: (first + i) * OUTLINE_ROW_HEIGHT, paddingLeft: 8 + r.depth * 12 }}
                                         onClick={() => pick(n)}>
                                        {n.children.length && !filtering ? (
                                            <button type="button" className="textual-tab__outline-twisty" tabIndex={-1}
                                                    aria-label={r.open ? 'Collapse' : 'Expand'}
                                                    onClick={e => { e.stopPropagation(); toggle(n); }}>
                                                <i className={`bi ${r.open ? 'bi-chevron-down' : 'bi-chevron-right'}`} aria-hidden="true" />
                                            </button>
                                        ) : <span className="textual-tab__outline-twisty" />}
                                        <i className={`bi ${OUTLINE_ICONS[n.kind]} textual-tab__outline-icon`} aria-hidden="true" />
                                        <span className="textual-tab__outline-label">{n.label}</span>
                                        {n.detail && <span className="textual-tab__outline-detail">{n.detail}</span>}
                                        {n.unclosed && (
                                            <i className="bi bi-exclamation-circle textual-tab__outline-unclosed"
                                               aria-label="Its block or an enclosing one is left open" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        {outline && rows.length === 0 && (
                            <div className="textual-tab__outline-empty">{filtering ? 'No match' : 'No objects'}</div>
                        )}
                    </div>
                </aside>
            )}
            <div className="textual-tab__main">
                <nav className="textual-tab__crumbs" aria-label="Breadcrumb">
                    {path.map((n, i) => (
                        <span key={n.key} className="textual-tab__crumb-item">
                            {i > 0 && <i className="bi bi-chevron-right textual-tab__crumb-sep" aria-hidden="true" />}
                            <button type="button" className={'textual-tab__crumb' + (n.kind !== 'object' ? ' textual-tab__crumb--group' : '')}
                                    aria-current={i === path.length - 1 ? 'location' : undefined}
                                    title={n.detail ? `${n.label} · ${n.detail}` : n.label} onClick={() => pick(n)}>
                                {n.label}
                            </button>
                        </span>
                    ))}
                </nav>
                <div className="textual-tab__editor">{children}</div>
            </div>
        </div>
    );
}

type TextualMode = 'text' | 'ebnf' | 'syntax';

const MODES: ReadonlyArray<{ readonly mode: TextualMode; readonly label: string; readonly icon: string; readonly title: string }> = [
    { mode: 'text', label: 'Text', icon: 'bi-file-earmark-text', title: 'The model in the textual notation' },
    { mode: 'ebnf', label: 'EBNF', icon: 'bi-braces', title: 'The concrete grammar of the notation' },
    // Step C2b (P-2026-11-05-0118): only where the record can be written (`writeSyntax`).
    { mode: 'syntax', label: 'Syntax', icon: 'bi-sliders', title: 'The syntax annotations of the notation' },
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

/**
 * The text's editor: folding, and the semantic highlighting of the language service (step B1). Folding takes 16 px of
 * the margin, so the empty glyph margin goes and the decorations take the rest of the 30 px (P-2026-11-04-0146): the
 * global rules paint the text at 30 px, and a wider layout hid the chevrons under it and sent the first characters'
 * clicks to the folding gutter.
 */
export const TEXT_EDITOR_OPTIONS = {
    ...EDITOR_OPTIONS,
    folding: true,
    glyphMargin: false,
    lineDecorationsWidth: 14,
    'semanticHighlighting.enabled': true,
} as const;

/** The Monaco adapter, loaded on the tab's mount (it imports `joiner`, which the bench cannot). */
type TextualMonacoModule = typeof import('./textualMonaco');

/** The owner of the edit's markers in the Monaco model. */
const EDIT_MARKER_OWNER = 'textual-edit';

/** D3b: the owner of the conformance markers, apart from the edit's, so a pause's parse never clears them (D8). */
const CONFORMANCE_MARKER_OWNER = 'textual-conformance';

/** The conformance hook, loaded on the tab's mount (model/conformance/useConformance imports `joiner`, which the bench cannot). */
type ConformanceHook = typeof import('../../../model/conformance/useConformance')['useConformance'];

/** D3b: reads the model's conformance with the loaded hook and hands its violations on; renders nothing. */
function ConformanceReader({ use, modelId, onRead }: { readonly use: ConformanceHook; readonly modelId: string; readonly onRead: (vs: readonly MarkedViolation[]) => void }) {
    const result = use(modelId);
    useEffect(() => onRead(result?.violations ?? []), [result]);
    return null;
}

/** The context key that sends Cmd/Ctrl+Z to the app's undo: set while the text holds no pending edit (R-TXT-26). */
const APP_UNDO_KEY = 'textualNoPendingEdit';

/** The same in the EBNF editor: set while the syntax draft is clean (R-TXT-49 D6); a dirty draft has no undo. */
const EBNF_APP_UNDO_KEY = 'textualEbnfDraftClean';

/** The owner of the draft's findings at the EBNF literals. */
const EBNF_MARKER_OWNER = 'textual-ebnf';

/** The app's undo, one step (the Text editor's Cmd/Ctrl+Z). */
const appUndo = (): void => {
    void import('../../../joiner').then(({ UndoAction, DUser }) => { UndoAction.new(1, DUser.current, false).commit(); });
};

type MonacoEditor = Parameters<OnMount>[0];
/** A change of the Monaco model's content: what replaced which offsets. */
type ContentChange = { readonly rangeOffset: number; readonly rangeLength: number; readonly text: string };
type MonacoApi = Parameters<OnMount>[1];

/**
 * Step C3a (P-2026-11-04-0412): the style picker writes only while the text is the agreed one, so the reprint of the
 * new style replaces no pending edit (`onModelPrint` reprints such a text, and would keep any other one as stale).
 */
export function canSwitchStyle(status: { readonly kind: string }, stale: boolean): boolean {
    return !stale && (status.kind === 'synced' || status.kind === 'applied');
}

/** The record the picker writes for `base`: null when the record already names it, nothing to write. */
export function styleSwitchRecord(decoded: DecodedSyntax, base: StyleBase): SyntaxAnnotations | null {
    return styleBaseOf(decoded) === base ? null : withStyleBase(decoded.record, base);
}

/**
 * The picker's name for `base` (lane L2b): `<name> (custom)` for the base in effect when the record overrides a
 * language-wide token, which a switch drops (R-TXT-49 D10); the per-block tokens and the options do not count.
 */
export function styleEntryName(decoded: DecodedSyntax, base: StyleBase): string {
    const style = decoded.record?.style;
    const custom = styleBaseOf(decoded) === base && !!style && STYLE_TOKEN_KEYS.some(k => style[k] !== undefined);
    return custom ? `${STYLE_CATALOG[base].name} (custom)` : STYLE_CATALOG[base].name;
}

/** The picker's entries, in the catalog's order. */
const STYLE_ENTRIES = (Object.keys(STYLE_CATALOG) as StyleBase[]).map(base => ({ base, name: STYLE_CATALOG[base].name }));

/**
 * An editable literal of the EBNF mode (lane L1b, P-2026-11-05-0921; R-TXT-48 step 1, R-TXT-49 D2): its span between
 * the quotes, its origin, the record field it edits, and the origin as a key, which links its occurrences.
 */
export interface EbnfIsland {
    readonly start: number;
    readonly end: number;
    readonly text: string;
    readonly src: LiteralSrc;
    readonly at: FieldRef;
    readonly origin: string;
}

/**
 * The EBNF of a draft's grammar, `draftPreview(...).ebnf` (both print it with `concreteGrammarEbnf`), with an island on
 * every element literal: none on a fixed token (D11) or an enumeration literal (D8), for which
 * `literalField` has no field. Null without a grammar, a draft that does not derive.
 */
export function ebnfOfDraft(mm: TextMetamodel, ids: ElementIds, grammar: ConcreteGrammar | undefined): { readonly text: string; readonly islands: readonly EbnfIsland[] } | null {
    if (!grammar) return null;
    const { text, literals } = concreteGrammarEbnfSpans(grammar);
    const islands = literals.flatMap((l): EbnfIsland[] => {
        const at = l.src && literalField(mm, ids, l.src);
        return l.src && at ? [{ start: l.start, end: l.end, text: l.text, src: l.src, at, origin: JSON.stringify(l.src) }] : [];
    });
    return { text, islands };
}

/** Each island's faults: those whose fields include the island's field (R-TXT-47 D9's `at`), in the faults' order. */
export function islandFaults(islands: readonly EbnfIsland[], faults: readonly FormFault[]): FormFault[][] {
    return islands.map(i => {
        const k = fieldKey(i.at);
        return faults.filter(f => f.at.some(r => fieldKey(r) === k));
    });
}

export interface TextualTabProps {
    readonly modelId: string;
    /** The picker entry's label: the language's name (dataManagerOption.ts `textualOptionLabel`). */
    readonly label: string;
    /** The dock tab's id, for the close control. */
    readonly tabId: string;
    /** Stores a metamodel's syntax record as one undo step (openTextualTab.tsx `writeTextualSyntax`); no style picker without it. */
    readonly writeSyntax?: (metamodelId: string, record: SyntaxAnnotations) => boolean;
}

/**
 * The Text view is editable (step T6b, R-TXT-26): on a pause in typing the text is parsed, diffed against the model
 * and, when nothing refuses it, applied as one undo step; the text stays as typed but for the reference tokens whose
 * print changed, rewritten to the new print (R-TXT-35, P-2026-11-03-1535). The previous parse's spans, carried
 * by Monaco decorations, are the first evidence of identity (R-TXT-22). A change of the model from elsewhere reprints
 * a text with no pending edit and never overwrites one. With no pending edit, Cmd/Ctrl+Z is the app's undo, whose
 * change reprints the text: one step restores model and text together. The EBNF view's structure stays read-only; its
 * element literals edit the syntax draft the Syntax form shares (lane L1b, R-TXT-48, R-TXT-49 D2, D3).
 */
export default function TextualTab({ modelId, label, tabId, writeSyntax }: TextualTabProps) {
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
    // The Syntax mode needs the metamodel only: it edits the record that may be what breaks the print.
    const failed = mode === 'syntax' ? !read.input : view.error !== null && (mode === 'text' || !view.ebnf);
    const metamodelId: string | undefined = typeof model?.instanceof === 'string' ? model.instanceof : undefined;
    const stored = useMemo(() => storedNotation(lookup ?? {}, metamodelId), [lookup, metamodelId]);
    const decoded = stored.decoded;
    const storedRaw = metamodelId && lookup?.[metamodelId] ? storedSyntax(lookup, metamodelId) : undefined;
    // D9 (R-TXT-47): the stored record's `checkStyle` errors, which the notation's own issues do not carry (F3).
    const issues = useMemo(() => {
        const shown = view.issues ?? [];
        if (!read.input) return shown;
        try {
            return [...shown, ...storedErrors(read.input.metamodel, stored.ids, decoded.record, shown)];
        } catch {
            return shown;
        }
    }, [view.issues, read.input, stored, decoded]);
    // The form stays mounted once opened, under the other modes, so its draft survives a look at the text.
    const [syntaxOpened, setSyntaxOpened] = useState(false);
    useEffect(() => { if (mode === 'syntax') setSyntaxOpened(true); }, [mode]);
    // P-2026-11-05-0910: the picker's last refused style and why, until the stored record changes.
    const [styleRefused, setStyleRefused] = useState<{ readonly base: StyleBase; readonly reason: string } | null>(null);
    useEffect(() => { setStyleRefused(null); }, [storedRaw]);

    const [status, setStatus] = useState<EditStatus>({ kind: 'synced' });
    const [stale, setStale] = useState(false);
    const [confirm, setConfirm] = useState<{ readonly text: string; readonly rows: readonly ConfirmRow[] } | null>(null);
    // L1b (R-TXT-49 D3): the syntax draft, owned here and shared by the Syntax form and the EBNF mode; only where Save
    // can write it. Without a writer the EBNF stays the stored one, read only.
    const editableSyntax = !!(writeSyntax && metamodelId && read.input);
    const syntaxDraft = useSyntaxDraft({
        mm: editableSyntax ? read.input?.metamodel : undefined, ids: stored.ids, decoded, storedRaw,
        pendingEdit: !canSwitchStyle(status, stale),
        onSave: record => !!writeSyntax && !!metamodelId && writeSyntax(metamodelId, record),
    });
    const draftEbnf = useMemo(() => (editableSyntax && read.input ? ebnfOfDraft(read.input.metamodel, stored.ids, syntaxDraft.reading.grammar) : null),
        [editableSyntax, read.input, stored.ids, syntaxDraft.reading]);
    const draftFaults = useMemo(() => (draftEbnf ? islandFaults(draftEbnf.islands, syntaxDraft.reading.faults) : []), [draftEbnf, syntaxDraft.reading]);
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
    // C3b: the text whose deletions the guard asks about, while it asks, and the refusals the panel confirmed for it.
    const guardTextRef = useRef<{ readonly text: string; readonly confirmed?: readonly ApplyRefusal['code'][] } | null>(null);
    // R-TXT-35 (P-2026-11-03-1535): the rewrite of the paths runs; a token was held under the caret.
    const rewritingRef = useRef(false);
    const heldRef = useRef(false);
    const [ui, setUi] = useState<TextualMonacoModule | null>(null);
    useEffect(() => { void import('./textualMonaco').then(m => setUi(m)); }, []);
    // D3b: the model's conformance violations, marked on the carried spans; loaded like the adapter.
    const [conformance, setConformance] = useState<{ readonly use: ConformanceHook } | null>(null);
    useEffect(() => { void import('../../../model/conformance/useConformance').then(m => setConformance({ use: m.useConformance })); }, []);
    const violationsRef = useRef<readonly MarkedViolation[]>([]);
    // Step B2: the outline's open state, kept per tab, and what the outline and the breadcrumb read once the editor is up.
    const [outlineOpen, setOutlineOpen] = useState(() => outlineOpenOf(tabId));
    const [nav, setNav] = useState<{ readonly editor: MonacoEditor; readonly session: TextualSession | null } | null>(null);
    // Step B1: the parse and analysis of the text's current version, shared by the providers and the typing pause.
    const sessionRef = useRef<TextualSession | null>(null);
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
        setConformanceMarkers();
    };

    /**
     * D3b (D8): the violations as warnings on the carried spans, each time the spans or the violations change; between two
     * pauses Monaco moves them with the text. Their own owner: the apply never reads them.
     */
    const setConformanceMarkers = (): void => {
        const monaco = monacoRef.current;
        const m = editorRef.current?.getModel();
        if (!monaco || !m) return;
        const text = m.getValue();
        const reading = sessionRef.current?.current();
        const tree = reading && reading.text === text ? reading.parsed.tree : undefined;
        monaco.editor.setModelMarkers(m, CONFORMANCE_MARKER_OWNER, conformanceMarks(violationsRef.current, carriedSpans(), text, tree).map(c => {
            const from = m.getPositionAt(c.start);
            const to = m.getPositionAt(c.end);
            return {
                severity: monaco.MarkerSeverity.Warning,
                source: CONFORMANCE_SOURCE,
                message: c.message,
                startLineNumber: from.lineNumber, startColumn: from.column,
                endLineNumber: to.lineNumber, endColumn: to.column,
            };
        }));
    };

    const onViolations = (vs: readonly MarkedViolation[]): void => {
        violationsRef.current = vs;
        setConformanceMarkers();
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
        sessionRef.current?.invalidate();
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

    /** P-2026-11-03-2326: the spans and tokens just set on the agreed text are kept with the agreement. */
    const agree = (): void => {
        const sync = syncRef.current;
        if (sync && editorRef.current?.getValue() === sync.text) syncRef.current = { ...sync, spans: carriedSpans(), refs: carriedRefs() };
    };

    /** P-2026-11-03-2326: the text is the agreed one again; the spans and tokens the edits back to it collapsed are put back. */
    const restoreAgreed = (text: string): void => {
        const back = syncRef.current && agreedEvidence(syncRef.current, text);
        if (!back) return;
        setDecorations(back.spans);
        setRefDecorations(back.refs);
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

    /**
     * The model's text replaces the editor's; the view state (caret, scroll) is kept where the text allows. T10 (E1b):
     * an agreed text the editor holds is spliced, keeping the typed text of the unchanged objects; `full` reprints the
     * whole print. `setValue` either way, so the text before never sits on the editor's undo stack (E3).
     */
    const reprint = (r: ModelReading, full = false): void => {
        const editor = editorRef.current;
        if (!editor || !r.base) return;
        pause.cancel();
        armedRef.current = null;
        clipRef.current = null;
        heldRef.current = false;
        const sync = syncRef.current;
        const typed = sync && !full ? agreedEvidence(sync, editor.getValue()) ?? (editor.getValue() === sync.text ? { spans: carriedSpans(), refs: carriedRefs() } : null) : null;
        const next = sync && typed ? modelReprint(sync, typed, r.view.text, r.base) : { text: r.view.text, spans: r.base.spans, refs: r.base.refs ?? [] };
        const viewState = editor.saveViewState();
        syncRef.current = { text: next.text, model: r.view.text, printed: agreedPrint(r.base) };
        if (editor.getValue() !== next.text) editor.setValue(next.text);
        if (viewState) editor.restoreViewState(viewState);
        setDecorations(next.spans);
        setRefDecorations(next.refs);
        agree();
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
        agree();
        updateUndoKey();
    };

    const evidence = (base: EditBase): EditEvidence => {
        const now = ((store.getState() as any)?.idlookup ?? {}) as Record<string, any>;
        return { defaults: defaultedSlots(now, base.objects), referencedElsewhere: referencedElsewhere(now, modelId), reserved: instanceNames(now, base) };
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
        syncRef.current = { text, model: after.view.text, ...(after.base ? { printed: agreedPrint(after.base) } : {}) };
        const editor = editorRef.current;
        // R-TXT-44: the names the app gave show at once, and the next edit reads them (the stuck edit of P-2026-11-04-1447).
        // Only the names the model holds after the run (C2c): a cleared slot reads nameless (R-TXT-45).
        const named = after.base ? namedByModel(plan, after.base.grammar, after.base.objects) : [];
        if (after.base && editor?.getValue() === text && namedReprint({ named }, after.view.text, text) !== null) {
            reprint(after, true);
            setStatus({ kind: 'applied', failed: failedLines, named: named.length });
            return;
        }
        if (after.base && plan.diff && editor?.getValue() === text) {
            const b = after.base;
            const rematch = matchObjects({ mm: b.mm, grammar: b.grammar, model: b.objects, parsed, previous: carriedSpans() });
            setDecorations(appliedSpans(parsed, plan.diff.match, rematch));
            setRefDecorations(appliedRefs(text, plan.diff.refs ?? [], plan.diff.match, rematch));
            rewritePaths(b.refs ?? []);
            agree();
        }
        setStatus({ kind: 'applied', failed: failedLines });
        updateUndoKey();
        if (editor && editor.getValue() !== syncRef.current?.text) pause.poke(); // typed during the run (not the rewrite of the paths)
    };

    /**
     * Reads the editor's text after a pause; `confirmed`, from the panel, drops the refusals it confirms; `deletions`,
     * from the guard's Confirm, applies the deletions it asked about.
     */
    const readEdit = (confirmed?: readonly ApplyRefusal['code'][], deletions = false): void => {
        guardTextRef.current = null;
        const editor = editorRef.current;
        const sync = syncRef.current;
        const r = readRef.current;
        if (!editor || !sync || !r.base) return;
        if (applyingRef.current) { pause.poke(); return; }
        const text = editor.getValue();
        if (text === sync.text) {
            restoreAgreed(text);
            setMarkers(null);
            setConfirm(null);
            if (staleRef.current) reprint(r); else setStatus({ kind: 'synced' });
            return;
        }
        const ev = evidence(r.base);
        const shared = sessionRef.current?.current();
        const reuse = shared && shared.text === text && shared.grammar === r.base.grammar ? shared.parsed : undefined;
        const carried = carriedSpans();
        const { parsed, plan } = planEdit(r.base, text, carried, ev, confirmed, carriedRefs(), reuse);
        setMarkers(parsed, plan.diff ? [...outerMarks(text, parsed, plan.diff), ...(plan.diff.unresolved ?? [])] : []);
        const read: GuardRead = { grammar: r.base.grammar, text, parsed, carried };
        // Spans are re-derived from every parse that matched (R-TXT-22); a broken one keeps the carried ones. D1: an object
        // commented out keeps its span, so the next pause still finds it inside the comment.
        if (plan.diff) setDecorations([...certainSpans(parsed, plan.diff.match), ...commentedOut(plan, read)]);
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
        // C3b: a truncation, a lost indent or a select-all-delete reads as a valid text; its deletions ask first. D1: so
        // does an object commented out, whatever else the pause carries.
        const guard = d.kind === 'apply' && !deletions ? deletionGuard(r.base, plan, read) : null;
        if (guard) {
            guardTextRef.current = { text, ...(confirmed ? { confirmed } : {}) };
            setStatus({ kind: 'guard', ...guard });
            return;
        }
        const agreed = unchangedAgreement(d, text, r.view.text, r.base);
        if (agreed) { syncRef.current = agreed; agree(); updateUndoKey(); }
        if (d.kind === 'apply') void apply(text, parsed, plan); else setStatus(d);
    };

    /** C3b: the guard's Confirm applies the text it asked about; an edit since then is read afresh. */
    const onGuardConfirm = (): void => {
        const editor = editorRef.current;
        const asked = guardTextRef.current;
        if (!editor) return;
        if (asked?.text === editor.getValue()) readEdit(asked.confirmed, true); else readEdit();
    };

    /** C3b: Cancel keeps the text and the model; the next edit reads the text again. */
    const onGuardCancel = (): void => {
        guardTextRef.current = null;
        setStatus({ kind: 'kept' });
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
                restoreAgreed(sync.text);
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

    // A new notation reads the same text otherwise: the session parses again.
    useEffect(() => { sessionRef.current?.invalidate(); }, [view.ebnf]);

    const onMount: OnMount = (editor, monaco) => {
        editorRef.current = editor;
        monacoRef.current = monaco;
        const m = editor.getModel();
        if (ui && m) {
            const session = ui.openTextualSession(m, { base: () => readRef.current.base, keep: () => carriedRefs() });
            sessionRef.current = session;
            editor.onDidDispose(() => { session.dispose(); if (sessionRef.current === session) sessionRef.current = null; });
            // The theme is global: another editor may have set its own since.
            editor.onDidFocusEditorText(() => monaco.editor.setTheme(ui.TEXTUAL_THEME_ID));
        }
        const r = readRef.current;
        syncRef.current = { text: editor.getValue(), model: r.view.text, ...(r.base ? { printed: agreedPrint(r.base) } : {}) };
        if (r.base && editor.getValue() === r.view.text) { setDecorations(r.base.spans); setRefDecorations(r.base.refs ?? []); agree(); }
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
        setNav({ editor, session: sessionRef.current });
    };

    const shownStatus = editStatusText(stale && status.kind !== 'errors' ? { kind: 'stale' } : status);
    const styleFree = canSwitchStyle(status, stale);
    const onStyle = (value: string): void => {
        if (!writeSyntax || !metamodelId || !isStyleBase(value) || !canSwitchStyle(status, staleRef.current)) return;
        const record = styleSwitchRecord(decoded, value);
        if (!record) return;
        // R-TXT-47 D1: a style the style check refuses is not written, as Save does not write it.
        let reason: string | null = null;
        if (read.input) {
            try {
                reason = styleRefusal(read.input.metamodel, stored.ids, record, decoded.issues);
            } catch (e) {
                reason = e instanceof Error ? e.message : String(e);
            }
        }
        setStyleRefused(reason ? { base: value, reason } : null);
        if (!reason) writeSyntax(metamodelId, record);
    };
    const refusalTitle = status.kind === 'refused' ? status.reasons.join('\n') : shownStatus.text;
    const islandTitle = (island: EbnfIsland): string => {
        const phrase = fieldPhrase(stored.ids, island.at);
        return phrase.charAt(0).toUpperCase() + phrase.slice(1);
    };
    const literalEdit = (island: EbnfIsland, value: string) => (read.input
        ? setLiteral(read.input.metamodel, stored.ids, syntaxDraft.draft, island.src, value)
        : { ok: false as const, reason: 'The metamodel cannot be read' });
    const literalCheck = (island: EbnfIsland, value: string): string | null => {
        const r = literalEdit(island, value);
        return r.ok ? null : r.reason;
    };
    const literalApply = (island: EbnfIsland, value: string): string | null => {
        const r = literalEdit(island, value);
        if (!r.ok) return r.reason;
        syntaxDraft.setDraft(() => r.draft);
        return null;
    };
    const syntaxPreview = (kind: PreviewKind, value: string): ReactNode => (ui ? (
        <Editor width="100%" height="100%" language={kind === 'ebnf' ? ui.EBNF_LANGUAGE_ID : ui.TEXTUAL_LANGUAGE_ID} value={value}
                theme={ui.TEXTUAL_THEME_ID} beforeMount={ui.registerTextualMonaco}
                options={{ ...EDITOR_OPTIONS, readOnly: true, domReadOnly: true }} />
    ) : null);

    return (
        <div className="textual-tab">
            <div className="textual-tab__bar">
                <span className="textual-tab__title" title={`${modelName} · ${shownLabel}`}>
                    <i className="bi bi-file-earmark-text" aria-hidden="true" />
                    <span className="textual-tab__name">{modelName}</span>
                    <span className="textual-tab__language">{shownLabel}</span>
                </span>
                {mode === 'ebnf' && draftEbnf ? (
                    <span className="textual-tab__draft">
                        <span className={'textual-tab__draft-state' + (syntaxDraft.dirty ? ' textual-tab__draft-state--dirty' : '')} role="status">
                            {syntaxDraft.dirty ? 'Unsaved changes' : 'Saved'}
                        </span>
                        <button type="button" className="textual-tab__draft-button" disabled={!syntaxDraft.dirty}
                                title={syntaxDraft.dirty ? 'Drop the draft and show the stored syntax' : 'No unsaved changes'} onClick={syntaxDraft.loadStored}>
                            Discard
                        </button>
                        <button type="button" className="textual-tab__draft-button textual-tab__draft-button--primary" disabled={!syntaxDraft.gate.enabled}
                                title={syntaxDraft.gate.title} onClick={syntaxDraft.save}>
                            <i className="bi bi-check2" aria-hidden="true" />
                            Save
                        </button>
                    </span>
                ) : mode === 'ebnf' ? (
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
                                onClick={() => reprint(readRef.current, true)}>
                            Reprint
                        </button>
                    </span>
                )}
                {writeSyntax && metamodel && styleRefused && (
                    <span className="textual-tab__stale" role="alert" title={styleRefused.reason}>
                        <i className="bi bi-exclamation-triangle" aria-hidden="true" />
                        {STYLE_CATALOG[styleRefused.base].name} refused: {styleRefused.reason}
                    </span>
                )}
                {writeSyntax && metamodel && (
                    <label className="textual-tab__style"
                           title={styleFree ? 'The style of the notation, stored with the metamodel' : 'Apply or discard the edit to change the style'}>
                        <i className="bi bi-type" aria-hidden="true" />
                        <select className="textual-tab__style-select" aria-label="Notation style" value={styleBaseOf(decoded)}
                                disabled={!styleFree} onChange={e => onStyle(e.target.value)}>
                            {STYLE_ENTRIES.map(s => <option key={s.base} value={s.base}>{styleEntryName(decoded, s.base)}</option>)}
                        </select>
                    </label>
                )}
                {mode === 'text' && model && !failed && (
                    <button type="button" className={'textual-tab__outline-toggle' + (outlineOpen ? ' textual-tab__outline-toggle--on' : '')}
                            aria-pressed={outlineOpen} title={outlineOpen ? 'Hide the outline' : 'Show the outline'}
                            onClick={() => { const next = !outlineOpen; setOutlineOpen(next); storeOutlineOpen(tabId, next); }}>
                        <i className="bi bi-layout-sidebar" aria-hidden="true" />
                    </button>
                )}
                <div className="textual-tab__modes" role="group" aria-label="Shown text">
                    {MODES.filter(m => m.mode !== 'syntax' || writeSyntax).map(m => (
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
            {model && <NotationIssues issues={issues} warnings={view.warnings} />}
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
                            <TextNavigator editor={nav?.editor ?? null} session={nav?.session ?? null} open={outlineOpen}>
                                {read.base && ui && (
                                    <Editor width="100%" height="100%" language={ui.TEXTUAL_LANGUAGE_ID} defaultValue={view.text}
                                            theme={ui.TEXTUAL_THEME_ID} beforeMount={ui.registerTextualMonaco}
                                            onMount={onMount} options={TEXT_EDITOR_OPTIONS} />
                                )}
                            </TextNavigator>
                            {conformance && <ConformanceReader use={conformance.use} modelId={modelId} onRead={onViolations} />}
                        </div>
                        {mode === 'ebnf' && ui && (
                            <div className="textual-tab__layer">
                                {draftEbnf ? (
                                    <EbnfLiterals ui={ui} text={draftEbnf.text} islands={draftEbnf.islands} faults={draftFaults} titleOf={islandTitle}
                                                  check={literalCheck} apply={literalApply} clean={!syntaxDraft.dirty} />
                                ) : (
                                    <Editor width="100%" height="100%" language={ui.EBNF_LANGUAGE_ID} value={view.ebnf}
                                            theme={ui.TEXTUAL_THEME_ID} beforeMount={ui.registerTextualMonaco}
                                            options={{ ...EDITOR_OPTIONS, readOnly: true, domReadOnly: true }} />
                                )}
                            </div>
                        )}
                        {writeSyntax && metamodelId && read.input && (mode === 'syntax' || syntaxOpened) && (
                            <div className={'textual-tab__layer' + (mode === 'syntax' ? '' : ' textual-tab__layer--hidden')}>
                                <SyntaxForm mm={read.input.metamodel} ids={stored.ids} decoded={decoded} storedRaw={storedRaw}
                                            objects={read.input.objects} metamodelName={typeof metamodel?.name === 'string' ? metamodel.name : undefined}
                                            pendingEdit={!styleFree} onSave={record => writeSyntax(metamodelId, record)} preview={syntaxPreview}
                                            draft={syntaxDraft} />
                            </div>
                        )}
                        {mode === 'text' && confirm && confirm.rows.length > 0 && (
                            <TextConfirmPanel rows={confirm.rows} busy={status.kind === 'applying'} onConfirm={onConfirm} />
                        )}
                        {mode === 'text' && status.kind === 'guard' && (
                            <section className="textual-tab__confirm" aria-label="Deletions to confirm">
                                <header className="textual-tab__confirm-head">
                                    <i className="bi bi-exclamation-triangle" aria-hidden="true" />
                                    <span>{status.commented?.length
                                        ? `The text comments out ${commentedText(status.commented)}: confirm deletes ${status.deleted === 1 ? 'it' : `${status.deleted} objects`} from the model`
                                        : status.all
                                        ? `The text deletes every object of the model (${status.total})`
                                        : `The text deletes ${status.deleted} objects of ${status.total}`}</span>
                                    <button type="button" className="textual-tab__create" onClick={onGuardConfirm}
                                            title="Apply the text with these deletions, as one undo step">
                                        <i className="bi bi-check2" aria-hidden="true" />
                                        Confirm
                                    </button>
                                    <button type="button" className="textual-tab__stale-reload" onClick={onGuardCancel}
                                            title="Keep the text and the model as they are">
                                        Cancel
                                    </button>
                                </header>
                            </section>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

interface EbnfLiteralsProps {
    readonly ui: TextualMonacoModule;
    readonly text: string;
    readonly islands: readonly EbnfIsland[];
    /** `islandFaults` of the islands: each island's findings, one marker each. */
    readonly faults: readonly (readonly FormFault[])[];
    /** The hover and the input's label: what the island edits. */
    readonly titleOf: (island: EbnfIsland) => string;
    /** Why a value is refused for an island, or null (the live check, `setLiteral`). */
    readonly check: (island: EbnfIsland, value: string) => string | null;
    /** Writes a value into the draft through `setLiteral`; the refusal's reason, or null when written. */
    readonly apply: (island: EbnfIsland, value: string) => string | null;
    /** The draft is clean: Cmd/Ctrl+Z goes to the app's undo (D6). */
    readonly clean: boolean;
}

/**
 * The EBNF mode over the syntax draft (lane L1b, R-TXT-49 D2): a read-only model whose element literals are islands; a
 * click, Enter or F2 on one lays an input over it as a content widget, an overlay that moves no line. Enter writes the
 * value into the draft, Escape or leaving the input drops it; a refused value shows its reason under the input. The
 * islands of the origin under the pointer or being edited are highlighted together. The text is set by hand, keeping
 * the scroll, so the wrapper's `setValue` does not reset the view on every edit.
 */
function EbnfLiterals(props: EbnfLiteralsProps) {
    const { ui, text, islands, faults, clean } = props;
    const live = useRef(props);
    live.current = props;
    const editorRef = useRef<MonacoEditor | null>(null);
    const monacoRef = useRef<MonacoApi | null>(null);
    const islandIdsRef = useRef<string[]>([]);
    const linkedIdsRef = useRef<string[]>([]);
    const hoverRef = useRef<string | null>(null);
    const openRef = useRef<{ readonly origin: string; readonly input: HTMLInputElement; readonly close: () => void } | null>(null);
    const undoKeyRef = useRef<{ set(v: boolean): void } | null>(null);
    const [ready, setReady] = useState(false);

    const rangeOf = (i: Pick<EbnfIsland, 'start' | 'end'>) => {
        const m = editorRef.current!.getModel()!;
        const a = m.getPositionAt(i.start);
        const b = m.getPositionAt(i.end);
        return new monacoRef.current!.Range(a.lineNumber, a.column, b.lineNumber, b.column);
    };

    const paintLinked = (): void => {
        const m = editorRef.current?.getModel();
        if (!m) return;
        const origin = openRef.current?.origin ?? hoverRef.current;
        const linked = origin ? live.current.islands.filter(i => i.origin === origin) : [];
        linkedIdsRef.current = m.deltaDecorations(linkedIdsRef.current, linked.map(i => ({ range: rangeOf(i), options: { inlineClassName: 'textual-tab__island--linked' } })));
    };

    const close = (): void => {
        const open = openRef.current;
        openRef.current = null;
        open?.close();
        paintLinked();
    };

    const islandAt = (offset: number): EbnfIsland | undefined => live.current.islands.find(i => offset >= i.start && offset <= i.end);

    const open = (island: EbnfIsland): void => {
        const editor = editorRef.current;
        const monaco = monacoRef.current;
        const m = editor?.getModel();
        if (!editor || !monaco || !m) return;
        close();
        const node = document.createElement('div');
        node.className = 'textual-tab__literal-widget';
        const input = document.createElement('input');
        input.className = 'textual-tab__literal-input';
        input.value = island.text;
        input.spellcheck = false;
        input.setAttribute('aria-label', live.current.titleOf(island));
        input.style.height = `${editor.getOption(monaco.editor.EditorOption.lineHeight)}px`;
        const reason = document.createElement('div');
        reason.className = 'textual-tab__literal-reason';
        reason.setAttribute('role', 'alert');
        node.append(input, reason);
        const size = (): void => { input.style.width = `${Math.max(island.text.length, input.value.length) + 1}ch`; };
        const refuse = (r: string | null): void => {
            reason.textContent = r ?? '';
            node.classList.toggle('textual-tab__literal-widget--refused', r !== null);
        };
        const done = (): void => { close(); editor.focus(); };
        size();
        input.addEventListener('input', () => {
            size();
            refuse(input.value === island.text ? null : live.current.check(island, input.value));
        });
        // Native and stopped here: the editor's own keybindings (Cmd/Ctrl+Z included) never see the input's keys.
        input.addEventListener('keydown', e => {
            e.stopPropagation();
            if (e.key === 'Enter') {
                e.preventDefault();
                if (input.value === island.text) { done(); return; }
                const r = live.current.apply(island, input.value);
                if (r === null) done(); else refuse(r);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                done();
            }
        });
        input.addEventListener('blur', () => { if (openRef.current?.input === input) close(); });
        const position = m.getPositionAt(island.start);
        const widget = {
            getId: () => 'textual.ebnf.literal',
            getDomNode: () => node,
            getPosition: () => ({ position, preference: [monaco.editor.ContentWidgetPositionPreference.EXACT] }),
        };
        editor.addContentWidget(widget);
        openRef.current = { origin: island.origin, input, close: () => editor.removeContentWidget(widget) };
        paintLinked();
        // After the editor's own mouse-down handling, which focuses its text area.
        setTimeout(() => { if (openRef.current?.input === input) { input.focus(); input.select(); } }, 0);
    };

    const paint = (): void => {
        const editor = editorRef.current;
        const monaco = monacoRef.current;
        const m = editor?.getModel();
        if (!editor || !monaco || !m) return;
        const { text: shown, islands: list, faults: found, titleOf } = live.current;
        if (m.getValue() !== shown) {
            close();
            const state = editor.saveViewState();
            m.setValue(shown);
            if (state) editor.restoreViewState(state);
        }
        islandIdsRef.current = m.deltaDecorations(islandIdsRef.current, list.map((i, k) => {
            const level = found[k]?.some(f => f.level === 'error') ? 'error' : found[k]?.length ? 'notice' : null;
            return {
                range: rangeOf(i),
                options: {
                    inlineClassName: 'textual-tab__island' + (level ? ` textual-tab__island--${level}` : ''),
                    // The findings ride on the island's hover: a read-only editor neither paints nor hovers its markers
                    // (Monaco's `renderValidationDecorations: 'editable'`), so the wavy underline is the island's own.
                    hoverMessage: [...(found[k] ?? []).map(f => ({ value: f.message })), { value: `${titleOf(i)}: click or press Enter to edit` }],
                    stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
                },
            };
        }));
        monaco.editor.setModelMarkers(m, EBNF_MARKER_OWNER, list.flatMap((i, k) => (found[k] ?? []).map(f => {
            const r = rangeOf(i);
            return {
                severity: f.level === 'error' ? monaco.MarkerSeverity.Error : monaco.MarkerSeverity.Info,
                message: f.message,
                startLineNumber: r.startLineNumber, startColumn: r.startColumn, endLineNumber: r.endLineNumber, endColumn: r.endColumn,
            };
        })));
        paintLinked();
    };

    useEffect(() => { paint(); }, [text, islands, faults, ready]);
    useEffect(() => { undoKeyRef.current?.set(clean); }, [clean, ready]);

    const onMount: OnMount = (editor, monaco) => {
        editorRef.current = editor;
        monacoRef.current = monaco;
        editor.onDidFocusEditorText(() => monaco.editor.setTheme(ui.TEXTUAL_THEME_ID));
        const key = editor.createContextKey<boolean>(EBNF_APP_UNDO_KEY, live.current.clean);
        undoKeyRef.current = key;
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyZ, appUndo, EBNF_APP_UNDO_KEY);
        const offsetOf = (p: { lineNumber: number; column: number } | null): number | null => (p ? editor.getModel()?.getOffsetAt(p) ?? null : null);
        editor.onMouseMove(e => {
            const at = e.target.type === monaco.editor.MouseTargetType.CONTENT_TEXT ? offsetOf(e.target.position) : null;
            const origin = (at === null ? undefined : islandAt(at))?.origin ?? null;
            if (origin !== hoverRef.current) { hoverRef.current = origin; paintLinked(); }
        });
        editor.onMouseLeave(() => { if (hoverRef.current !== null) { hoverRef.current = null; paintLinked(); } });
        editor.onMouseDown(e => {
            if (e.target.type !== monaco.editor.MouseTargetType.CONTENT_TEXT) return;
            const at = offsetOf(e.target.position);
            const island = at === null ? undefined : islandAt(at);
            if (island) open(island);
        });
        editor.onKeyDown(e => {
            if (openRef.current || (e.keyCode !== monaco.KeyCode.Enter && e.keyCode !== monaco.KeyCode.F2)) return;
            const at = offsetOf(editor.getPosition());
            const island = at === null ? undefined : islandAt(at);
            if (!island) return;
            e.preventDefault();
            e.stopPropagation();
            open(island);
        });
        setReady(true);
    };

    return (
        <Editor width="100%" height="100%" language={ui.EBNF_LANGUAGE_ID} defaultValue={text}
                theme={ui.TEXTUAL_THEME_ID} beforeMount={ui.registerTextualMonaco} onMount={onMount}
                options={{ ...EDITOR_OPTIONS, readOnly: true, domReadOnly: true }} />
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
