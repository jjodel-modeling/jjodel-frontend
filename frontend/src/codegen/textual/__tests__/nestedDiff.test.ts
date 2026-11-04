/**
 * Step C lane C1c (P-2026-11-04-1115; R-TXT-41 D1; docs/discovery/discovery_2026-11-04_textual_step_c.md §2.2, F9): the
 * diff of nested expression objects on BOOL (boolCorpus.ts), in the editor (the previous print's spans carried over the
 * edit) and outside it.
 */

import { appendFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';

// The imports of the Text tab that reach the store, mocked as textualEdit.test.ts does.
vi.mock('@monaco-editor/react', () => ({ default: () => null }));
vi.mock('../../../jjscript', () => ({ buildEvalContext: () => ({}) }));
vi.mock('../../../components/editor-v2/sim/simBridge', () => ({ evalContextFor: () => ({}) }));
vi.mock('../../../components/abstract/DockManager', () => ({ default: { closeTab: () => true } }));
import type { ObjectSpan, RefSpan } from '../printer';
import { printTextModel } from '../printer';
import { parseText } from '../parser';
import type { TextObject } from '../metamodel';
import type { DiffOp, ObjectRef } from '../textDiff';
import { planTextEdit } from '../textDiff';
import { instanceNames, planEdit } from '../ui/TextualTab';
import { BOOL_CLIKE, BOOL_MM, boolGrammar, boolObjects } from './boolCorpus';

const G = boolGrammar(BOOL_CLIKE);

/**
 * Monaco's decorations (`NeverGrowsWhenTypingAtEdges`, TextualTab.tsx) over one edit, as a deletion then an insertion: a
 * span inside the replaced range collapses (no evidence), one around it stretches, one starting at its edge shifts.
 */
function carry<S extends { readonly start: number; readonly end: number }>(spans: readonly S[], at: number, removed: number, inserted: number): S[] {
    const cut = (x: number): number => (x <= at ? x : x >= at + removed ? x - removed : at);
    return spans.map(s => {
        let start = cut(s.start);
        let end = cut(s.end);
        if (end > at) { if (start >= at) start += inserted; end += inserted; }
        return { ...s, start, end };
    });
}

/** A term of an object: an atom's name, a literal, else `Class(operands)`. */
function termOf(objects: readonly TextObject[], id: string): string {
    const byId = new Map(objects.map(o => [o.id, o]));
    const atoms = new Map(boolObjects().filter(o => o.cls === 'Atom').map(o => [o.id, String(o.slots.name)]));
    const term = (x: unknown): string => {
        const o = byId.get(String(x));
        if (!o) return `?${String(x)}`;
        if (o.cls === 'Use') return atoms.get(String(o.slots.atom)) ?? String(byId.get(String(o.slots.atom))?.slots.name);
        if (o.cls === 'Lit') return String(o.slots.value);
        if (o.cls === 'Atom' || o.cls === 'Rule' || o.cls === 'Sheet') return `${o.cls}:${String(o.slots.name)}`;
        const ops = ['ops', 'left', 'right', 'op'].flatMap(f => (o.slots[f] === undefined ? [] : Array.isArray(o.slots[f]) ? o.slots[f] as unknown[] : [o.slots[f]]));
        return `${o.cls}(${ops.map(term).join(', ')})`;
    };
    return term(id);
}

/**
 * Edits the `when` of rule `rule` through the states `whens` (the first is the print), each step as typed: only the
 * range between the common prefix and the common suffix of two states changes, and the spans are carried over it. Then
 * plans the last state against the model.
 */
function edit(rule: string, whens: readonly string[], o: { readonly spans?: boolean; readonly reserved?: ReadonlySet<string> } = { spans: true }) {
    const model = boolObjects();
    const printed = printTextModel(G, model);
    const head = printed.text.indexOf(`Rule ${rule} {`);
    expect(head, `rule ${rule}`).toBeGreaterThanOrEqual(0);
    const where = printed.text.indexOf(whens[0], head);
    expect(where, `"${whens[0]}" in rule ${rule}`).toBeGreaterThan(head);
    let text = printed.text;
    let spans: ObjectSpan[] = [...printed.spans];
    let refs: RefSpan[] = [...(printed.refs ?? [])];
    for (let i = 1; i < whens.length; i++) {
        const [from, to] = [whens[i - 1], whens[i]];
        let p = 0;
        while (p < from.length && p < to.length && from[p] === to[p]) p++;
        let q = 0;
        while (q < from.length - p && q < to.length - p && from[from.length - 1 - q] === to[to.length - 1 - q]) q++;
        const at = where + p;
        const removed = from.length - p - q;
        const inserted = to.slice(p, to.length - q);
        text = text.slice(0, at) + inserted + text.slice(at + removed);
        spans = carry(spans, at, removed, inserted.length);
        refs = carry(refs, at, removed, inserted.length);
    }
    const last = whens[whens.length - 1];
    const inRule = (id: string): boolean => { const sp = parsed.spans.find(x => x.id === id); return !!sp && sp.start >= where && sp.end <= where + last.length; };
    const parsed = parseText(text, G, o.spans ? { keep: refs } : undefined);
    expect(parsed.errors).toEqual([]);
    const plan = planTextEdit({ mm: BOOL_MM, grammar: G, model, parsed, unprinted: printed.unprinted, ...(o.spans ? { previous: spans, previousRefs: refs } : {}), ...(o.reserved ? { reserved: o.reserved } : {}) });
    const name = (r: ObjectRef): string => ('model' in r ? termOf(model, r.model) : 'text' in r ? `new ${termOf(parsed.objects, r.text)}` : `@${r.outer}`);
    const opText = (op: DiffOp): string => {
        switch (op.op) {
            case 'create': return `create ${termOf(parsed.objects, op.text)}${op.into ? ` in ${name(op.into.owner)}.${op.into.feature}` : ''}`;
            case 'delete': return `delete ${termOf(model, op.model)}`;
            case 'attribute': return `set ${name(op.target)}.${op.feature} = ${JSON.stringify(op.value)}`;
            case 'reference': return `set ${name(op.target)}.${op.feature} = ${op.to ? name(op.to) : 'null'}`;
            case 'link': case 'unlink': return `${op.op} ${name(op.target)}.${op.feature} ${name(op.to)}`;
            case 'move': return `move ${termOf(model, op.model)} to ${op.into ? `${name(op.into.owner)}.${op.into.feature}` : 'top'}`;
            case 'reorder': return `reorder ${name(op.target)}.${op.feature} ${name(op.to)}`;
        }
    };
    return {
        model, parsed, plan,
        ops: (plan.diff?.ops ?? []).map(opText),
        by: (plan.diff?.match.matches ?? []).filter(m => inRule(m.text))
            .map(m => `${termOf(parsed.objects, m.text)}=${termOf(model, m.model)}:${m.by}`),
        refusals: plan.refusals.map(r => r.code),
    };
}

/** Label, rule, the states of its `when` as typed. */
const EDITS: readonly (readonly [string, string, readonly string[]])[] = [
    ['add last', 'chain', ['st & ld & rdy', 'st & ld & rdy & is_sw']],
    ['add first', 'chain', ['st & ld & rdy', 'is_sw & st & ld & rdy']],
    ['remove last', 'chain', ['st & ld & rdy', 'st & ld']],
    ['remove middle', 'chain', ['st & ld & rdy', 'st & rdy']],
    ['remove first', 'chain', ['st & ld & rdy', 'ld & rdy']],
    ['move last first', 'chain', ['st & ld & rdy', 'st & ld', 'rdy & st & ld']],
    ['swap subtrees', 'guard', ['st & ld | !rdy', 'st & ld', '!rdy | st & ld']],
    ['operator changed', 'chain', ['st & ld & rdy', 'st | ld & rdy', 'st | ld | rdy']],
    ['wrap operand', 'chain', ['st & ld & rdy', 'st & !ld & rdy']],
    ['wrap two operands', 'chain', ['st & ld & rdy', 'st & (ld & rdy', 'st & (ld & rdy)', 'st & (ld | rdy)']],
    ['wrap whole', 'guard', ['st & ld | !rdy', '!(st & ld | !rdy', '!(st & ld | !rdy)']],
    ['unwrap', 'lit', ['1 | !!st', '1 | !st']],
    ['retype atom', 'chain', ['st & ld & rdy', 'st & is_sw & rdy']],
];

describe('(1) measurement: nested expression edits on BOOL, today', () => {
    for (const mode of ['typed', 'pasted', 'nospan'] as const) {
        it.each(EDITS)(`%s (${mode})`, (label, rule, whens) => {
            const states = mode === 'typed' ? whens : [whens[0], whens[whens.length - 1]];
            const r = edit(rule, states, { spans: mode !== 'nospan' });
            if (process.env.C1C_MEAS) appendFileSync(process.env.C1C_MEAS, `MEAS ${mode} | ${label} | ${states.join(' => ')} | refusals ${JSON.stringify(r.refusals)} | by ${r.by.join('; ')} | ops ${r.ops.join('; ')}${process.env.C1C_LINES ? ` | lines ${(r.plan.lines ?? []).join('; ')}` : ''}\n`);
        });
    }
});

describe('(3) the handle of a created object avoids every instance name of the model', () => {
    const ADD: readonly string[] = ['st & ld & rdy', 'st & ld & rdy & is_sw'];
    const createdHandle = (lines: readonly string[] | null): string | undefined =>
        (lines ?? []).map(l => /^create instance of Use "([^"]+)"/.exec(l)?.[1]).find(h => h !== undefined);

    it('without the model names the created Use takes Use_1, the name a first application left on a Use', () => {
        expect(createdHandle(edit('chain', ADD).plan.lines)).toBe('Use_1');
    });

    it('a second application does not reuse Use_1 or Use_2, and its lines address the handle it created', () => {
        const r = edit('chain', ADD, { spans: true, reserved: new Set(['Use_1', 'Use_2']) });
        expect(r.refusals).toEqual([]);
        const h = createdHandle(r.plan.lines);
        expect(h).toBeDefined();
        expect(['Use_1', 'Use_2']).not.toContain(h);
        expect(r.plan.lines!.filter(l => !l.startsWith('create')).some(l => l.includes(h!))).toBe(true);
    });

    it('a created named object whose name an unprinted instance carries takes another handle and sets its name', () => {
        const model = boolObjects();
        const printed = printTextModel(G, model);
        const end = printed.text.indexOf('Atom rdy {}') + 'Atom rdy {}'.length;
        const text = `${printed.text.slice(0, end)}\n    Atom go {}${printed.text.slice(end)}`;
        const parsed = parseText(text, G, { keep: carry(printed.refs ?? [], end, 0, 15) });
        const plan = planTextEdit({ mm: BOOL_MM, grammar: G, model, parsed, unprinted: printed.unprinted, previous: carry(printed.spans, end, 0, 15),
            previousRefs: carry(printed.refs ?? [], end, 0, 15), reserved: new Set(['go']) });
        expect(plan.refusals).toEqual([]);
        const h = (plan.lines ?? []).map(l => /^create instance of Atom "([^"]+)"/.exec(l)?.[1]).find(x => x !== undefined);
        expect(h).toBe('Atom_1');
        expect(plan.lines).toContain('set Atom_1.name = "go"');
    });

    it('the Text tab gives the diff the name and initialName of every object of the base, printed or not', () => {
        const model = boolObjects();
        const printed = printTextModel(G, model);
        const uses = model.filter(o => o.cls === 'Use');
        const lookup: Record<string, unknown> = Object.fromEntries(uses.map((o, i) => [o.id, { id: o.id, name: `Use_${i + 1}`, initialName: `Use_${i}` }]));
        const names = instanceNames(lookup, { objects: model, unprinted: [{ id: 'u9', owner: uses[0].id, feature: 'x', cls: 'Use' } as never] });
        expect([...names].sort()).toEqual([...new Set(uses.flatMap((_, i) => [`Use_${i + 1}`, `Use_${i}`]))].sort());
        lookup.u9 = { id: 'u9', name: 'Hidden_1' };
        expect(instanceNames(lookup, { objects: [], unprinted: [{ id: 'u9', owner: '', feature: 'x', cls: 'Use' } as never] })).toEqual(new Set(['Hidden_1']));
        const end = printed.text.indexOf('st & ld & rdy', printed.text.indexOf('Rule chain {')) + 'st & ld & rdy'.length;
        const text = `${printed.text.slice(0, end)} & is_sw${printed.text.slice(end)}`;
        const base = { mm: BOOL_MM, grammar: G, objects: model, spans: printed.spans, unprinted: printed.unprinted, refs: printed.refs ?? [] };
        const { plan } = planEdit(base, text, carry(printed.spans, end, 0, 8), { reserved: names }, undefined, carry(printed.refs ?? [], end, 0, 8));
        expect(plan.refusals).toEqual([]);
        const h = createdHandle(plan.lines);
        expect(h).toBeDefined();
        expect(names.has(h!)).toBe(false);
    });
});

describe('(3b) a single-valued slot is emptied before a create fills it (the executor counts a deleted holder until it lands)', () => {
    it('operator changed: the slot lets the old And go before its delete, and the Or is created after', () => {
        const lines = edit('chain', ['st & ld & rdy', 'st | ld & rdy', 'st | ld | rdy']).plan.lines ?? [];
        const out = lines.indexOf('set chain.when -= And_1');
        expect(out).toBeGreaterThanOrEqual(0);
        expect(out).toBeLessThan(lines.indexOf('delete And_1'));
        expect(lines.indexOf('delete And_1')).toBeLessThan(lines.indexOf('create instance of Or "Or_1" in chain.when'));
    });

    it('wrap whole: refused with a reason, the moved holder still fills the single-valued slot when the create counts it (in the app, P-2026-11-04-1158)', () => {
        const r = edit('guard', ['st & ld | !rdy', '!(st & ld | !rdy', '!(st & ld | !rdy)']);
        expect(r.plan.lines).toBeNull();
        expect(r.plan.refusals.map(x => x.message)).toEqual(['wrapping the value of guard.when in a new object is not applied yet']);
    });

    it('a create into a many-valued slot, or into a slot nobody leaves, adds no line', () => {
        expect(edit('chain', ['st & ld & rdy', 'st & ld & rdy & is_sw']).plan.lines?.some(l => l.includes('-='))).toBe(false);
        expect(edit('chain', ['st & ld & rdy', 'st & (ld & rdy', 'st & (ld & rdy)', 'st & (ld | rdy)']).plan.lines?.filter(l => l.includes('-=')).length).toBe(2);
    });
});

describe('(3c) no collection update on a slot after a create into it (the update reads committed values only and drops the pending child)', () => {
    it('wrap two operands: both operands leave And.ops before the Or is created there', () => {
        const lines = edit('chain', ['st & ld & rdy', 'st & (ld & rdy', 'st & (ld & rdy)', 'st & (ld | rdy)']).plan.lines ?? [];
        const create = lines.findIndex(l => l.startsWith('create instance of Or '));
        expect(create).toBeGreaterThan(0);
        expect(lines.slice(create + 1).some(l => l.startsWith('set And_1.ops'))).toBe(false);
        expect(lines.filter(l => l.startsWith('set And_1.ops -= ')).length).toBe(2);
    });

    it('add first and wrap operand: the reorders of And.ops come after a line addressing the created object, which the executor waits on', () => {
        for (const whens of [['st & ld & rdy', 'is_sw & st & ld & rdy'], ['st & ld & rdy', 'st & !ld & rdy']]) {
            const r = edit('chain', whens);
            expect(r.refusals).toEqual([]);
            const lines = r.plan.lines ?? [];
            const h = /^create instance of \w+ "(\w+)" in And_1\.ops$/.exec(lines.find(l => l.startsWith('create')) ?? '')?.[1];
            expect(h).toBeDefined();
            const create = lines.findIndex(l => l.startsWith('create'));
            const addressed = lines.findIndex(l => l.startsWith(`set ${h!}.`));
            expect(addressed).toBeGreaterThan(create);
            expect(lines.slice(create + 1, addressed).some(l => l.startsWith('set And_1.ops'))).toBe(false);
        }
    });

    it('a created object no line addresses: a later update of its slot is refused with a reason', () => {
        const r = edit('chain', ['st & ld & rdy', 'and() & st & ld & rdy']);
        expect(r.plan.lines).toBeNull();
        expect(r.plan.refusals.map(x => x.message).join(' | ')).toMatch(/^an update of And_\d\.ops after an object is created in it is not applied yet/);
    });
});

describe('(4) slot matching: pasted and re-imported, an edit plans as typed, certain (evidence slot)', () => {
    /** Without spans the equal subtree wins: the inner Not(st) is the one kept, one op fewer than typed. */
    const OTHER: Readonly<Record<string, readonly string[]>> = {
        'unwrap|nospan': ['move Not(st) to Or(1, Not(Not(st))).ops', 'delete Not(Not(st))'],
    };
    for (const mode of ['pasted', 'nospan'] as const) {
        it.each(EDITS)(`%s (${mode})`, (label, rule, whens) => {
            const typed = edit(rule, whens);
            const r = edit(rule, [whens[0], whens[whens.length - 1]], { spans: mode === 'pasted' });
            expect(r.refusals, label).toEqual(typed.refusals);
            expect(r.refusals.includes('uncertain'), label).toBe(false);
            expect(r.ops, label).toEqual(OTHER[`${label}|${mode}`] ?? typed.ops);
            if (mode === 'nospan') expect(r.by.filter(b => b.endsWith(':slot')).length, label).toBeGreaterThan(0);
        });
    }
});
