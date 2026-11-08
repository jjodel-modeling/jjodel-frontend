/**
 * Lane T8d (P-2026-11-08-0831; R-TXT-18, R-TXT-21 (7), R-TXT-55 F8): a measurement bench of the match cascade on a file
 * re-imported without ids. Scripted edits, one or two at a time, on the state machine, the 1709 fixture and the 16 Briefs;
 * each edited text is planned against the original model with no carried spans, as `planTextImport` does.
 *
 * The edit is made on the objects and the text is their print, so the truth of each parsed object is known by construction:
 * the object it was printed from, which keeps its model id, or a new one. The print is taken with the ids off, the file
 * with its `@id` comments stripped (textFile.test.ts pins the two byte for byte).
 *
 * The assertions are the invariants only: nothing throws, every plan applies once its uncertain rows are confirmed (but
 * for the `CREATED_SLOT` limit of textDiff.ts, which the table counts), an unedited text pairs every object with itself.
 * The numbers go to the table at `CALIBRATION_OUT`, when set.
 *
 * Lane T8e (P-2026-11-08-1625): the grid of the rename thresholds. No caller of `matchObjects` passes them, so here a mock
 * of the module adds them to the input of every call `planTextImport` makes; the corpora above run at the defaults.
 *
 * The Briefs are read from the prototype's folder in the PROTO environment variable (no path in the repo), as
 * styleCheck.test.ts does; skipped without it.
 */

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { afterAll, describe, it, expect, vi } from 'vitest';
import { deriveBaseGrammar } from '../baseGrammar';
import { deriveConcreteGrammar } from '../concreteGrammar';
import type { ConcreteGrammar } from '../concreteGrammar';
import type { TextFeature, TextMetamodel, TextObject } from '../metamodel';
import type { SyntaxNode } from '../parser';
import { printTextModel } from '../printer';
import { CLIKE_STYLE } from '../style';
import { CONFIRMABLE } from '../textDiff';
import { planTextImport } from '../textFile';
import { RENAME_MARGIN, RENAME_THRESHOLD, featureTable, identityOf, placesOf, shownFeatures } from '../textMatch';
import { grammarOf } from './corpus';
import { FIXTURE, metamodelOf, objectsOf } from './spec';
import { tolerantCases } from './tolerantCorpus';

/** The thresholds of the grid cell being run; empty at the defaults. */
const cell = vi.hoisted(() => ({ current: {} as { renameThreshold?: number; renameMargin?: number } }));
vi.mock('../textMatch', async importOriginal => {
    const actual = await importOriginal<typeof import('../textMatch')>();
    return { ...actual, matchObjects: (input: Parameters<typeof actual.matchObjects>[0]) => actual.matchObjects({ ...input, ...cell.current }) };
});

interface Mut { readonly id: string; readonly cls: string; readonly slots: Record<string, unknown> }
interface Bench { readonly name: string; readonly mm: TextMetamodel; readonly g: ConcreteGrammar; readonly objects: readonly TextObject[] }
type At = <T>(xs: readonly T[]) => T | undefined;
/** Edits the objects in place; false when the model holds no target for it. */
type Edit = (b: Bench, objs: Mut[], at: At, touched: Set<string>) => boolean;

/** An update of the slot of an object the same plan creates, not written yet (textDiff.ts): a refusal of today's apply. */
const CREATED_SLOT = /after an object is created in it is not applied yet$/;
const VARIANTS = 12;
const COMBO_VARIANTS = 3;
/** The variant-th of `of` evenly spaced elements. */
const sampler = (variant: number, of: number): At => xs => (xs.length <= of ? xs[variant] : xs[Math.floor(variant * xs.length / of)]);

const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : v == null ? [] : [v]);
const featuresFor = (b: Bench, cls: string): readonly TextFeature[] => featureTable(b.mm)(cls);
const childIds = (b: Bench, o: Mut, many?: boolean): string[] =>
    featuresFor(b, o.cls).filter(f => f.kind === 'containment' && (!many || f.many)).flatMap(f => asArray(o.slots[f.name]).filter((x): x is string => typeof x === 'string'));

/** One slot of many contained objects. */
interface Slot { readonly owner: Mut; readonly feature: string; readonly ids: string[] }
const manySlots = (b: Bench, objs: readonly Mut[]): Slot[] => objs.flatMap(o => featuresFor(b, o.cls).filter(f => f.kind === 'containment' && f.many)
    .map(f => ({ owner: o, feature: f.name, ids: asArray(o.slots[f.name]).filter((x): x is string => typeof x === 'string') })));
const byId = (objs: readonly Mut[]): Map<string, Mut> => new Map(objs.map(o => [o.id, o]));
const swapped = (ids: readonly string[], i: number, j: number): string[] => ids.map((x, k) => (k === i ? ids[j] : k === j ? ids[i] : x));
const leafOf = (b: Bench, o: Mut): boolean => childIds(b, o).length === 0;
const freshName = (prefix: string, objs: readonly Mut[], o: Mut): string => `${prefix}${objs.indexOf(o)}_${objs.length}`;

/** The object and what it contains out of the model, and every reference to any of them cleared. */
function removeObject(b: Bench, objs: Mut[], id: string): void {
    const all = byId(objs);
    const gone = new Set<string>();
    const walk = (x: string): void => { const o = all.get(x); if (!o || gone.has(x)) return; gone.add(x); childIds(b, o).forEach(walk); };
    walk(id);
    for (let i = objs.length - 1; i >= 0; i--) if (gone.has(objs[i].id)) objs.splice(i, 1);
    for (const o of objs) {
        for (const f of featuresFor(b, o.cls)) {
            if (f.kind === 'attribute') continue;
            const v = o.slots[f.name];
            if (Array.isArray(v)) o.slots[f.name] = v.filter(x => !gone.has(x as string));
            else if (typeof v === 'string' && gone.has(v)) o.slots[f.name] = null;
        }
    }
}

/** A copy of a leaf object under a fresh id and name, appended to the slot. */
function addClone(b: Bench, objs: Mut[], s: Slot, source: Mut): void {
    const id = `new_${objs.length}`;
    const slots: Record<string, unknown> = { ...source.slots };
    if (identityOf(b.g, source) !== null) slots.name = freshName('added', objs, source);
    objs.push({ id, cls: source.cls, slots });
    s.owner.slots[s.feature] = [...s.ids, id];
}

const rename: Edit = (b, objs, at, touched) => {
    const o = at(objs.filter(x => !touched.has(x.id) && identityOf(b.g, x) !== null));
    if (!o) return false;
    touched.add(o.id);
    o.slots.name = freshName('renamed', objs, o);
    return true;
};

const reorder: Edit = (b, objs, at, touched) => {
    const all = byId(objs);
    const name = (id: string): string | null => identityOf(b.g, all.get(id)!);
    const pairs = manySlots(b, objs).flatMap(s => {
        const i = s.ids.findIndex((id, k) => k + 1 < s.ids.length && !touched.has(id) && !touched.has(s.ids[k + 1]) && name(id) !== null && name(s.ids[k + 1]) !== null && name(id) !== name(s.ids[k + 1]));
        return i < 0 ? [] : [{ s, i }];
    });
    const p = at(pairs);
    if (!p) return false;
    p.s.owner.slots[p.s.feature] = swapped(p.s.ids, p.i, p.i + 1);
    touched.add(p.s.ids[p.i]);
    touched.add(p.s.ids[p.i + 1]);
    return true;
};

const deleteOne: Edit = (b, objs, at, touched) => {
    const places = placesOf(objs, featureTable(b.mm));
    const o = at(objs.filter(x => places.has(x.id) && !touched.has(x.id)));
    if (!o) return false;
    touched.add(o.id);
    removeObject(b, objs, o.id);
    return true;
};

const addOne: Edit = (b, objs, at, touched) => {
    const all = byId(objs);
    const options = manySlots(b, objs).flatMap(s => s.ids.flatMap(id => (leafOf(b, all.get(id)!) && !touched.has(id) ? [{ s, source: all.get(id)! }] : [])));
    const p = at(options);
    if (!p) return false;
    addClone(b, objs, p.s, p.source);
    return true;
};

/** The single-valued attributes the rule prints, set on the object, other than its name. */
const changeable = (b: Bench, o: Mut): readonly TextFeature[] => {
    const rule = b.g.objects[o.cls];
    if (!rule) return [];
    const shown = shownFeatures(rule);
    return featuresFor(b, o.cls).filter(f => f.kind === 'attribute' && !f.many && f.name !== 'name' && shown.has(f.name) && o.slots[f.name] != null);
};

const changedValue = (b: Bench, f: TextFeature, v: unknown): unknown => {
    if (typeof v === 'boolean') return !v;
    if (typeof v === 'number') return v + 1;
    const e = b.mm.enumerations.find(x => x.name === f.type);
    if (e) return e.literals[(e.literals.indexOf(v as string) + 1) % e.literals.length];
    return `${String(v)}x`;
};

const changeTwo = (b: Bench, o: Mut): void => { for (const f of changeable(b, o).slice(0, 2)) o.slots[f.name] = changedValue(b, f, o.slots[f.name]); };

const twoAttributes: Edit = (b, objs, at, touched) => {
    const o = at(objs.filter(x => !touched.has(x.id) && changeable(b, x).length >= 2));
    if (!o) return false;
    touched.add(o.id);
    changeTwo(b, o);
    return true;
};

/** Two siblings of one slot, class and name (none counts), that the text tells apart by what else they show. */
const swapHomonyms: Edit = (b, objs, at, touched) => {
    const all = byId(objs);
    const content = (o: Mut): string => JSON.stringify(featuresFor(b, o.cls).filter(f => f.kind !== 'containment').map(f => o.slots[f.name] ?? null));
    const options = manySlots(b, objs).flatMap(s => {
        const out: { s: Slot; i: number; j: number }[] = [];
        s.ids.forEach((a, i) => s.ids.forEach((c, j) => {
            const x = all.get(a)!;
            const y = all.get(c)!;
            if (i < j && !touched.has(a) && !touched.has(c) && x.cls === y.cls && identityOf(b.g, x) === identityOf(b.g, y) && content(x) !== content(y)) out.push({ s, i, j });
        }));
        return out;
    });
    const p = at(options);
    if (!p) return false;
    p.s.owner.slots[p.s.feature] = swapped(p.s.ids, p.i, p.j);
    touched.add(p.s.ids[p.i]);
    touched.add(p.s.ids[p.j]);
    return true;
};

const renameWithTwoAttributes: Edit = (b, objs, at, touched) => {
    const o = at(objs.filter(x => !touched.has(x.id) && identityOf(b.g, x) !== null && changeable(b, x).length >= 2));
    if (!o) return false;
    touched.add(o.id);
    o.slots.name = freshName('renamed', objs, o);
    changeTwo(b, o);
    return true;
};

/** One object deleted and, in its slot, a new one of its class: what a rename looks like, and is not. */
const replaceOne: Edit = (b, objs, at, touched) => {
    const all = byId(objs);
    const options = manySlots(b, objs).flatMap(s => s.ids.flatMap(id => {
        const o = all.get(id)!;
        const sibling = s.ids.map(x => all.get(x)!).find(x => x.id !== id && x.cls === o.cls && leafOf(b, x));
        return sibling && !touched.has(id) ? [{ s, id, sibling }] : [];
    }));
    const p = at(options);
    if (!p) return false;
    touched.add(p.id);
    removeObject(b, objs, p.id);
    const slot = manySlots(b, objs).find(s => s.owner.id === p.s.owner.id && s.feature === p.s.feature)!;
    addClone(b, objs, slot, p.sibling);
    return true;
};

const BASE_EDITS: readonly (readonly [string, Edit])[] = [
    ['rename', rename], ['reorder siblings', reorder], ['delete one', deleteOne], ['add one', addOne], ['change two attributes', twoAttributes], ['swap homonyms', swapHomonyms],
];
const COMBOS: readonly (readonly [string, readonly Edit[]])[] = BASE_EDITS.flatMap(([a, ea], i) => BASE_EDITS.slice(i + 1).map(([c, ec]) => [`${a} + ${c}`, [ea, ec]] as const));
const SAME_TARGET: readonly (readonly [string, Edit])[] = [['rename + two attributes, one object', renameWithTwoAttributes], ['delete + add of one class', replaceOne]];

interface Tally {
    runs: number; skipped: number; objects: number; correct: number; wrongCertain: number; wrongUncertain: number;
    uncertain: number; missed: number; refused: number; unexpected: number; unprintable: number; unreadable: number;
}
const emptyTally = (): Tally => ({ runs: 0, skipped: 0, objects: 0, correct: 0, wrongCertain: 0, wrongUncertain: 0, uncertain: 0, missed: 0, refused: 0, unexpected: 0, unprintable: 0, unreadable: 0 });

/** corpus -> edit kind -> tally. */
const tables = new Map<string, Map<string, Tally>>();
const renameScores = new Map<string, { right: number; wrong: number }>();
const evidence = new Map<string, Map<string, { right: number; wrong: number }>>();
const refusalCodes = new Map<string, number>();

/** The corpus name of a grid cell starts with this: its tallies stay out of the tables of the defaults. */
const GRID = 'grid ';
const GRID_THRESHOLDS = [0.5, 0.6, 0.7] as const;
const GRID_MARGINS = [0.1, 0.2, 0.3] as const;
const gridKey = (threshold: number, margin: number): string => `${GRID}${threshold}/${margin}`;

const objectIds = (n: SyntaxNode): string[] => [...(n.kind === 'object' ? [n.id] : []), ...n.children.flatMap(c => (c.kind === 'token' ? [] : objectIds(c)))];

function tallyOf(corpus: string, kind: string): Tally {
    let table = tables.get(corpus);
    if (!table) tables.set(corpus, table = new Map());
    let t = table.get(kind);
    if (!t) table.set(kind, t = emptyTally());
    return t;
}

/** One edited model through the import, against the original. */
function measure(b: Bench, corpus: string, kind: string, edited: readonly Mut[]): void {
    const t = tallyOf(corpus, kind);
    let printed;
    try { printed = printTextModel(b.g, edited); } catch { t.unprintable++; return; }
    const imported = planTextImport({ mm: b.mm, grammar: b.g, objects: b.objects, unprinted: [] }, printed.text, {}, CONFIRMABLE);
    const printedIds = printed.tree ? objectIds(printed.tree) : [];
    const parsedIds = imported.parsed.tree ? objectIds(imported.parsed.tree) : [];
    if (imported.parsed.errors.length || !imported.plan.diff || printedIds.length !== parsedIds.length) { t.unreadable++; return; }
    t.runs++;
    t.objects += parsedIds.length;
    const truth = new Map(parsedIds.map((p, i) => [p, printedIds[i]]));
    const inModel = new Set(b.objects.map(o => o.id));
    const byEvidence = evidence.get(corpus) ?? new Map<string, { right: number; wrong: number }>();
    evidence.set(corpus, byEvidence);
    for (const m of imported.plan.diff.match.matches) {
        const right = truth.get(m.text) === m.model;
        if (right) t.correct++; else if (m.uncertain) t.wrongUncertain++; else t.wrongCertain++;
        if (m.uncertain) t.uncertain++;
        const e = byEvidence.get(m.by) ?? { right: 0, wrong: 0 };
        byEvidence.set(m.by, e);
        if (right) e.right++; else e.wrong++;
        if (m.by === 'rename' && m.score !== undefined && !corpus.startsWith(GRID)) {
            const key = m.score.toFixed(2);
            const s = renameScores.get(key) ?? { right: 0, wrong: 0 };
            renameScores.set(key, s);
            if (right) s.right++; else s.wrong++;
        }
    }
    t.missed += imported.plan.diff.match.created.filter(id => inModel.has(truth.get(id)!)).length;
    if (imported.plan.refusals.length || imported.plan.lines === null) {
        t.refused++;
        if (!imported.plan.refusals.length || imported.plan.refusals.some(r => !CREATED_SLOT.test(r.message))) t.unexpected++;
        if (!corpus.startsWith(GRID)) for (const r of imported.plan.refusals) refusalCodes.set(`${r.code}: ${r.message.replace(/renamed\w+|added\w+/g, '<name>')}`, (refusalCodes.get(`${r.code}: ${r.message.replace(/renamed\w+|added\w+/g, '<name>')}`) ?? 0) + 1);
    }
}

const copyOf = (objects: readonly TextObject[]): Mut[] => objects.map(o => ({ id: o.id, cls: o.cls, slots: { ...o.slots } }));

function runEdits(b: Bench, corpus: string, kind: string, edits: readonly Edit[], variants: number): void {
    for (let v = 0; v < variants; v++) {
        const objs = copyOf(b.objects);
        const touched = new Set<string>();
        const at = sampler(v, variants);
        if (!edits.every(e => e(b, objs, at, touched))) { tallyOf(corpus, kind).skipped++; continue; }
        measure(b, corpus, kind, objs);
    }
}

function sweep(corpus: string, benches: readonly Bench[]): void {
    for (const b of benches) {
        measure(b, corpus, 'none (control)', copyOf(b.objects));
        for (const [kind, e] of [...BASE_EDITS, ...SAME_TARGET]) runEdits(b, corpus, kind, [e], VARIANTS);
        for (const [kind, es] of COMBOS) runEdits(b, corpus, kind, es, COMBO_VARIANTS);
    }
}

function runCorpus(corpus: string, benches: readonly Bench[]): void {
    sweep(corpus, benches);
    const table = tables.get(corpus)!;
    const control = table.get('none (control)')!;
    expect(control.runs, corpus).toBe(benches.length);
    expect([control.wrongCertain, control.wrongUncertain, control.missed], corpus).toEqual([0, 0, 0]);
    for (const [kind, t] of table) expect([kind, t.unprintable, t.unreadable, t.unexpected], corpus).toEqual([kind, 0, 0, 0]);
}

function tableText(): string {
    const lines = [
        '# T8d calibration of the match cascade, re-import without ids (P-2026-11-08-0831)',
        '',
        `RENAME_THRESHOLD ${RENAME_THRESHOLD}, RENAME_MARGIN ${RENAME_MARGIN}. Other values: the grid at the end.`,
        '',
        'objects: parsed objects over all runs. wrong: paired with a model object that is not its source, or a new object paired at all. missed: an object with a source in the model that the plan creates (a create plus a delete that should have been a pairing).',
        '',
    ];
    for (const [corpus, table] of tables) {
        if (corpus.startsWith(GRID)) continue;
        lines.push(`## ${corpus}`, '', '| edit | runs | no target | objects | correct | wrong, certain | wrong, uncertain | uncertain rows | missed | refused |', '|---|---|---|---|---|---|---|---|---|---|');
        for (const [kind, t] of table) lines.push(`| ${kind} | ${t.runs} | ${t.skipped} | ${t.objects} | ${t.correct} | ${t.wrongCertain} | ${t.wrongUncertain} | ${t.uncertain} | ${t.missed} | ${t.refused} |`);
        lines.push('', '| evidence | right | wrong |', '|---|---|---|');
        for (const [by, e] of evidence.get(corpus) ?? []) lines.push(`| ${by} | ${e.right} | ${e.wrong} |`);
        lines.push('');
    }
    lines.push('## Rename rows by score, all corpora', '', '| score | right | wrong |', '|---|---|---|');
    for (const [score, s] of [...renameScores].sort(([a], [c]) => Number(a) - Number(c))) lines.push(`| ${score} | ${s.right} | ${s.wrong} |`);
    lines.push('', `Refusals after confirming the uncertain rows: ${[...refusalCodes].map(([c, n]) => `${c} ${n}`).join(', ') || 'none'}.`, '');
    lines.push(...gridText());
    return lines.join('\n');
}

/** One row per grid cell, every edit of every corpus summed. */
function gridText(): string[] {
    const lines = ['## Grid of the rename thresholds, all corpora and edits', '', '| threshold | margin | runs | objects | correct | wrong, certain | wrong, uncertain | uncertain rows | missed | refused | rename right | rename wrong |', '|---|---|---|---|---|---|---|---|---|---|---|---|'];
    for (const threshold of GRID_THRESHOLDS) {
        for (const margin of GRID_MARGINS) {
            const key = gridKey(threshold, margin);
            const sum = emptyTally();
            for (const t of tables.get(key)?.values() ?? []) for (const k of Object.keys(sum) as (keyof Tally)[]) sum[k] += t[k];
            const rename = evidence.get(key)?.get('rename') ?? { right: 0, wrong: 0 };
            lines.push(`| ${threshold} | ${margin} | ${sum.runs} | ${sum.objects} | ${sum.correct} | ${sum.wrongCertain} | ${sum.wrongUncertain} | ${sum.uncertain} | ${sum.missed} | ${sum.refused} | ${rename.right} | ${rename.wrong} |`);
        }
    }
    lines.push('');
    return lines;
}

const PROTO = process.env.PROTO ?? '';

/** An Ecore metamodel, the form styleCheck.test.ts reads. */
function ecoreMetamodel(path: string): TextMetamodel {
    const text = readFileSync(path, 'utf8');
    const classes: TextMetamodel['classes'][number][] = [];
    const enumerations: TextMetamodel['enumerations'][number][] = [];
    const re = /<eClassifiers xsi:type="ecore:(EClass|EEnum)" name="(\w+)"([^>]*?)(\/>|>([\s\S]*?)<\/eClassifiers>)/g;
    for (const [, kind, name, attrs, , body = ''] of text.matchAll(re)) {
        if (kind === 'EEnum') { enumerations.push({ name, literals: [...body.matchAll(/eLiterals name="(\w+)"/g)].map(x => x[1]) }); continue; }
        const supers = /eSuperTypes="([^"]+)"/.exec(attrs)?.[1].split(' ').map(x => x.replace('#//', ''));
        const attributes: { name: string; type: string; many: boolean }[] = [];
        const references: { name: string; type: string; many: boolean; containment: boolean }[] = [];
        for (const [, k, n, a] of body.matchAll(/<eStructuralFeatures xsi:type="ecore:(EAttribute|EReference)" name="(\w+)"([^>]*)>/g)) {
            const type = /eType="[^"]*?(\w+)"/.exec(a)![1];
            const many = a.includes('upperBound="-1"');
            if (k === 'EAttribute') attributes.push({ name: n, type, many });
            else references.push({ name: n, type, many, containment: a.includes('containment="true"') });
        }
        classes.push({ name, isAbstract: attrs.includes('abstract="true"'), supers, attributes, references });
    }
    return { classes, enumerations };
}

/** A Brief from its JSON tree: ids `o1`, `o2`, ... in document order. */
function loadBrief(path: string): TextObject[] {
    const out: TextObject[] = [];
    let n = 0;
    const walk = (e: Record<string, unknown>): string => {
        const id = `o${++n}`;
        const slots: Record<string, unknown> = {};
        out.push({ id, cls: String(e.__type), slots });
        for (const [k, v] of Object.entries(e)) {
            if (k.startsWith('__')) continue;
            if (Array.isArray(v)) slots[k] = v.map(x => (x && typeof x === 'object' ? walk(x as Record<string, unknown>) : x));
            else if (v && typeof v === 'object') slots[k] = walk(v as Record<string, unknown>);
            else slots[k] = v;
        }
        return id;
    };
    walk(JSON.parse(readFileSync(path, 'utf8')));
    return out;
}

function briefBenches(): Bench[] {
    const specs: Record<string, TextMetamodel> = { Core: ecoreMetamodel(`${PROTO}/metamodels/CoreSpec.ecore`), Arbiter: ecoreMetamodel(`${PROTO}/metamodels/ArbiterSpec.ecore`) };
    const dir = `${PROTO}/out/brief/json`;
    return readdirSync(dir).filter(f => f.endsWith('.json')).sort().map(f => {
        const objects = loadBrief(`${dir}/${f}`);
        const mm = specs[objects[0].cls];
        return { name: f, mm, g: deriveConcreteGrammar(deriveBaseGrammar(mm), CLIKE_STYLE), objects };
    });
}

describe('T8d calibration bench: re-import without ids (invariants only)', () => {
    afterAll(() => {
        const out = process.env.CALIBRATION_OUT;
        if (out) writeFileSync(out, tableText());
    });

    it('the state machine, in its two notations', () => {
        runCorpus('state machine (turnstile, 2 notations)', tolerantCases().filter(c => c.name.startsWith('turnstile')));
    }, 60_000);

    it('the 1709 fixture', () => {
        runCorpus('1709 fixture', [{ name: 'fixture', mm: metamodelOf(FIXTURE), g: grammarOf(FIXTURE), objects: objectsOf(FIXTURE) }]);
    }, 60_000);

    it.skipIf(!PROTO)('the 16 Briefs (PROTO)', () => {
        runCorpus('16 Briefs', briefBenches());
    }, 300_000);

    it('the grid of the rename thresholds runs every cell (T8e)', () => {
        const benches: Bench[] = [
            ...tolerantCases().filter(c => c.name.startsWith('turnstile')),
            { name: 'fixture', mm: metamodelOf(FIXTURE), g: grammarOf(FIXTURE), objects: objectsOf(FIXTURE) },
            ...(PROTO ? briefBenches() : []),
        ];
        try {
            for (const renameThreshold of GRID_THRESHOLDS) {
                for (const renameMargin of GRID_MARGINS) {
                    cell.current = { renameThreshold, renameMargin };
                    sweep(gridKey(renameThreshold, renameMargin), benches);
                }
            }
        } finally { cell.current = {}; }
        const objects = GRID_THRESHOLDS.flatMap(t => GRID_MARGINS.map(m => [...tables.get(gridKey(t, m))!.values()].reduce((n, x) => n + x.objects, 0)));
        expect(objects.every(n => n > 0 && n === objects[0])).toBe(true);
    }, 300_000);
});
