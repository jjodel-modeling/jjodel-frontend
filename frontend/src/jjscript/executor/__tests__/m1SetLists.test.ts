/**
 * R-TXT-25 (2), P-2026-11-02-0651 — M1 `set` takes a list on a many-valued attribute and an
 * enumeration literal on an enum-typed one.
 *
 * Same bench as `m1Operators.test.ts`: the handler runs for real on an in-memory model, the joiner
 * is reduced to what it touches, the command is parsed by the real parser. Every write to an
 * attribute slot is recorded with the TRANSACTION it ran in: the store's undo restores what one
 * TRANSACTION wrote, and the store itself is not simulated here (`window is not defined` through
 * the real joiner), so «undo restores» is measured as «one write, inside one TRANSACTION».
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
    store: new Map<string, any>(),
    writes: [] as Array<{ slot: string; via: 'value' | 'values'; v: any; tx: number }>,
    tx: 0,
    open: 0,
    project: null as any,
}));

vi.mock('../../../joiner', () => {
    class DModel {}
    class DValue {}
    return {
        LPointerTargetable: { fromPointer: (id: string) => h.store.get(id) },
        DObject: { new: () => null },
        DModel,
        DValue,
        SetFieldAction: { new: () => undefined },
        TRANSACTION: (_: string, fn: () => void) => { h.tx++; h.open++; try { fn(); } finally { h.open--; } },
        LModel: class {},
        LProject: class {},
        LClass: class {},
    };
});

vi.mock('../utils', () => ({
    getProject: () => h.project,
    getTargetMetamodel: () => null,
}));

vi.mock('../resolvers', () => ({
    resolveElementInMetamodel: () => null,
    resolveElement: () => null,
}));

vi.mock('../../../model/logicWrapper/nameUniqueness', () => ({
    checkM2NameUniqueness: () => ({ ok: true }),
    m2KindOf: () => 'class',
}));

vi.mock('../../../redux/action/action', () => ({ COMMIT: () => undefined, dispatchesInFlight: () => 0 }));

import { parse } from '../../parser/parser';
import { executeSetInstance } from '../commands/instance';
import { clearHandles } from '../handleRegistry';

// ── The metamodel ────────────────────────────────────────────────────────────────────────────────

const Mood = { id: 'e_Mood', className: 'DEnumerator', name: 'Mood', literals: [{ name: 'happy' }, { name: 'sad' }, { name: 'Calm' }] };
const Card = {
    id: 'c_Card', name: 'Card', references: [] as any[],
    attributes: [
        { name: 'title', type: { className: 'DClass', name: 'EString' }, upperBound: 1 },
        { name: 'tags', type: { className: 'DClass', name: 'EString' }, upperBound: -1 },
        { name: 'marks', type: { className: 'DClass', name: 'EInt' }, upperBound: 3 },
        { name: 'mood', type: Mood, upperBound: 1 },
        { name: 'moods', type: Mood, upperBound: -1 },
    ],
    get allAttributes() { return Card.attributes; },
    get allReferences() { return Card.references; },
};

function card(id: string, name: string): any {
    const o: any = { id, name, className: 'DObject', instanceof: Card, __raw: { id, instanceof: Card.id, father: 'm1' }, subObjects: [] };
    for (const a of Card.attributes) {
        const slot: any = { id: `${id}_${a.name}` };
        Object.defineProperty(slot, 'value', { set(v: any) { h.writes.push({ slot: slot.id, via: 'value', v, tx: h.open }); } });
        Object.defineProperty(slot, 'values', { set(v: any) { h.writes.push({ slot: slot.id, via: 'values', v: [...v], tx: h.open }); } });
        o['$' + a.name] = slot;
    }
    h.store.set(id, o);
    return o;
}

const context: any = { projectId: 'p', modelId: 'm1', targetMetamodelId: 'mm1', level: 'M1', history: [], variables: new Map() };
const argsOf = (line: string): any => {
    const r = parse(line);
    if (!r.success) throw new Error(`parse failed: ${line}: ${r.errors?.[0]?.message}`);
    return r.ast!.args;
};
const set = (line: string) => executeSetInstance(argsOf(line), context, h.project);
const codeOf = (r: any) => r.errors?.[0]?.code;

beforeEach(() => {
    h.store.clear();
    h.writes = [];
    h.tx = 0;
    clearHandles();
    const objects = [card('k1', 'k1')];
    const model = { id: 'm1', name: 'M1', isMetamodel: false, objects, __raw: { objects: objects.map((o) => o.id) } };
    h.project = { id: 'p', models: [model], metamodels: [{ id: 'mm1', name: 'MM', classes: [Card] }] };
});

describe('a list on a many-valued attribute replaces its values', () => {
    it('writes the whole list through `values`, once, inside one TRANSACTION (dies on a write of the first value only)', async () => {
        const r = await set('set k1.tags = ["a", "b-c", "a"]');
        expect(r.success).toBe(true);
        expect(h.writes).toEqual([{ slot: 'k1_tags', via: 'values', v: ['a', 'b-c', 'a'], tx: 1 }]);
        expect(h.tx).toBe(1);
        expect(r.undoable).toBe(true);
        expect(r.message).toBe('Set k1.tags = ["a", "b-c", "a"]');
    });

    it('numbers, a one-number list (the lexer reads `[3]` as a multiplicity) and a bounded attribute', async () => {
        expect((await set('set k1.marks = [3, -1, 2.5]')).success).toBe(true);
        expect((await set('set k1.marks = [3]')).success).toBe(true);
        expect(h.writes.map((w) => w.v)).toEqual([[3, -1, 2.5], [3]]);
    });

    it('`[]` clears: an empty write through `values`', async () => {
        const r = await set('set k1.tags = []');
        expect(r.success).toBe(true);
        expect(h.writes).toEqual([{ slot: 'k1_tags', via: 'values', v: [], tx: 1 }]);
    });

    it('one value without brackets keeps the old path: the first value, through `value`', async () => {
        expect((await set('set k1.tags = "x"')).success).toBe(true);
        expect(h.writes).toEqual([{ slot: 'k1_tags', via: 'value', v: 'x', tx: 1 }]);
    });
});

describe('a list on a single-valued attribute is an error', () => {
    it('LIST_ON_SINGLE_VALUED, with the attribute in the message, nothing written (dies if the upper bound is not read)', async () => {
        const r = await set('set k1.title = ["a"]');
        expect(r.success).toBe(false);
        expect(codeOf(r)).toBe('LIST_ON_SINGLE_VALUED');
        expect(r.message).toMatch(/'title' holds one value/);
        expect(h.writes).toEqual([]);
    });

    it('also on an enum-typed single attribute', async () => {
        expect(codeOf(await set('set k1.mood = [happy]'))).toBe('LIST_ON_SINGLE_VALUED');
        expect(h.writes).toEqual([]);
    });
});

describe('an enumeration literal on an enum-typed attribute', () => {
    it('by name: stored as the literal name (dies on the old TYPE_MISMATCH for a name)', async () => {
        const r = await set('set k1.mood = sad');
        expect(r.success).toBe(true);
        expect(h.writes).toEqual([{ slot: 'k1_mood', via: 'value', v: 'sad', tx: 1 }]);
        expect(r.message).toBe('Set k1.mood = sad');
    });

    it('qualified, `Mood.Calm` and `Mood::happy`: the same name', async () => {
        expect((await set('set k1.mood = Mood.Calm')).success).toBe(true);
        expect((await set('set k1.mood = Mood::happy')).success).toBe(true);
        expect(h.writes.map((w) => w.v)).toEqual(['Calm', 'happy']);
    });

    it('a list of literals on a many-valued enum attribute, bare and qualified', async () => {
        expect((await set('set k1.moods = [happy, Mood.sad, happy]')).success).toBe(true);
        expect(h.writes).toEqual([{ slot: 'k1_moods', via: 'values', v: ['happy', 'sad', 'happy'], tx: 1 }]);
    });

    it('a string is still written as given, as before', async () => {
        expect((await set('set k1.mood = "sad"')).success).toBe(true);
        expect(h.writes.map((w) => w.v)).toEqual(['sad']);
    });
});

describe('an unknown literal is an error naming the enumeration', () => {
    it('UNKNOWN_LITERAL names Mood and its literals; case counts; nothing written', async () => {
        const r = await set('set k1.mood = calm');
        expect(codeOf(r)).toBe('UNKNOWN_LITERAL');
        expect(r.message).toBe("'calm' is not a literal of the enumeration Mood (happy, sad, Calm)");
        expect(h.writes).toEqual([]);
    });

    it('one bad literal in a list refuses the whole list', async () => {
        expect(codeOf(await set('set k1.moods = [happy, angry]'))).toBe('UNKNOWN_LITERAL');
        expect(h.writes).toEqual([]);
    });

    it('a qualifier that is not the attribute\'s enumeration', async () => {
        const r = await set('set k1.mood = Feeling.happy');
        expect(codeOf(r)).toBe('UNKNOWN_LITERAL');
        expect(r.message).toMatch(/'Feeling' is not the enumeration of 'mood', which is Mood/);
    });

    it('a name on an attribute that is not an enumeration stays TYPE_MISMATCH, in a list too', async () => {
        expect(codeOf(await set('set k1.title = happy'))).toBe('TYPE_MISMATCH');
        expect(codeOf(await set('set k1.tags = [happy]'))).toBe('TYPE_MISMATCH');
        expect(h.writes).toEqual([]);
    });
});
