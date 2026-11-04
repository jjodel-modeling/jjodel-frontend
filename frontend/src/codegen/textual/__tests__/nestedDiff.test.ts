/**
 * Step C lane C1c (P-2026-11-04-1115; R-TXT-41 D1; docs/discovery/discovery_2026-11-04_textual_step_c.md §2.2, F9): the
 * diff of nested expression objects on BOOL (boolCorpus.ts), in the editor (the previous print's spans carried over the
 * edit) and outside it.
 */

import { appendFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { ObjectSpan, RefSpan } from '../printer';
import { printTextModel } from '../printer';
import { parseText } from '../parser';
import type { TextObject } from '../metamodel';
import type { DiffOp, ObjectRef } from '../textDiff';
import { planTextEdit } from '../textDiff';
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
function edit(rule: string, whens: readonly string[], o: { readonly spans?: boolean } = { spans: true }) {
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
    const plan = planTextEdit({ mm: BOOL_MM, grammar: G, model, parsed, unprinted: printed.unprinted, ...(o.spans ? { previous: spans, previousRefs: refs } : {}) });
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

describe('(1) measurement: nested expression edits on BOOL, today', () => {
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
    for (const mode of ['typed', 'pasted', 'nospan'] as const) {
        it.each(EDITS)(`%s (${mode})`, (label, rule, whens) => {
            const states = mode === 'typed' ? whens : [whens[0], whens[whens.length - 1]];
            const r = edit(rule, states, { spans: mode !== 'nospan' });
            if (process.env.C1C_MEAS) appendFileSync(process.env.C1C_MEAS, `MEAS ${mode} | ${label} | ${states.join(' => ')} | refusals ${JSON.stringify(r.refusals)} | by ${r.by.join('; ')} | ops ${r.ops.join('; ')}\n`);
        });
    }
});
