/**
 * The `word` domain of the simulator (R-BV-7, R-BV-8, slice S2): the width
 * read per element from the frozen M at Reset, a stored bit-vector through the
 * core step with JjEL actions, step back, and the Reset defects.
 */

import { describe, it, expect } from 'vitest';
import { freezeSnapshot } from '../guardContext';
import type { SimSnapshot } from '../guardContext';
import { actionSiteKey, compileActions, makeActionOracle } from '../actionEvaluator';
import { inDomain, step } from '../netStep';
import { compileNet, netStcFromRoles } from '../netCompile';
import { isKindOf } from '../isKindOf';
import { objectReferences, objectSlotValues } from '../objectSlots';
import {
    decodeStateAttributes, defaultInitialOf, encodeStateAttributes, parseInitialLiteral, wordInitialOf, wordWidthOf,
} from '../stateAttributesCodec';
import { checkGuardSubset } from '../subsetChecker';
import { makeBitVector } from '../../../jjel/evaluator/builtins/bitvectors';
import { parseExpressionStrict } from '../../../jjel/parser';
import type { JjelBitVector } from '../../../jjel/evaluator/context';
import type { CompiledNet, Domain, GuardOracle, NetConfiguration, NetModelView, SimValue, StateAttributeDecl } from '../netTypes';

const MODEL = { id: 'M', name: 'machine' };
const CLASSES: Record<string, string[]> = { C_Init: [], C_End: [], C_Tr: [], C_Reg: [] };
const U = (widthFeature = 'A_w'): Domain => ({ kind: 'word', widthFeature, signed: false });
const reg = (initial: SimValue = 0, domain: Domain = U()): StateAttributeDecl =>
    ({ name: 'r', metaclass: 'C_Reg', space: 'semantic', domain, initial });
const NO_GUARDS: GuardOracle = () => ({ kind: 'true' });

interface Spec { [id: string]: { cls: string; slots?: Record<string, unknown[]>; refs?: Record<string, string> } }

/**
 * S -e1-> S, a self-loop; e1 points at the registers `a` and `b`. The net of a
 * raw lookup through `compileNet`, and a snapshot whose handles carry `refs`.
 */
function compileSpec(objects: Spec, decls: StateAttributeDecl[]): { net: CompiledNet; snap: SimSnapshot } {
    const lookup: Record<string, any> = {};
    for (const [c, ext] of Object.entries(CLASSES)) lookup[c] = { className: 'DClass', extends: ext };
    const handles: Record<string, any> = {};
    for (const [id, o] of Object.entries(objects)) {
        const features: string[] = [];
        for (const [f, values] of Object.entries(o.slots ?? {})) {
            features.push(`v_${id}_${f}`);
            lookup[`v_${id}_${f}`] = { className: 'DValue', instanceof: f, values };
        }
        lookup[id] = { className: 'DObject', instanceof: o.cls, features };
        handles[id] = { id, __type: 'Object', name: id };
    }
    for (const [id, o] of Object.entries(objects)) for (const [f, to] of Object.entries(o.refs ?? {})) handles[id][f] = handles[to];
    const view: NetModelView = {
        exists: id => !!lookup[id], isInstanceOf: (id, c) => isKindOf(lookup, id, c),
        outgoingTransitions: () => [], transitionTarget: () => null,
        references: (o, f) => objectReferences(lookup, o, f), values: (o, f) => objectSlotValues(lookup, o, f),
    };
    const stc = netStcFromRoles({ simInitial: 'C_Init', simTerminal: 'C_End', simOwnedTransitions: 'R_out', simNextState: 'R_next' })!;
    const net = compileNet(stc, view, 'M', Object.keys(objects), decls);
    return { net, snap: freezeSnapshot({ instances: Object.values(handles), classes: [], ...handles }, MODEL) };
}

/** The loop with two registers of one metaclass, `RA` 8 bits wide and `RB` 16. */
function counters(decls: StateAttributeDecl[] = [reg()], widths: [unknown[], unknown[]] = [[8], [16]]) {
    return compileSpec({
        S: { cls: 'C_Init', slots: { R_out: ['e1'] } },
        e1: { cls: 'C_Tr', slots: { R_next: ['S'] }, refs: { a: 'RA', b: 'RB' } },
        RA: { cls: 'C_Reg', slots: { A_w: widths[0] } },
        RB: { cls: 'C_Reg', slots: { A_w: widths[1] } },
    }, decls);
}

const r = (c: NetConfiguration, el: string) => c.state.attrs.get(el)?.get('r') as JjelBitVector;
const vec = (v: JjelBitVector) => [v.width, v.signed, v.bits];

function run(net: CompiledNet, snap: SimSnapshot, texts: string[], times: number): NetConfiguration[] {
    const actions = makeActionOracle(snap, net, new Map([[actionSiteKey({ element: 'e1', role: 'transition' }), compileActions(texts)]]));
    const history: NetConfiguration[] = [{ state: net.initial, event: null }];
    for (let k = 0; k < times; k++) {
        const out = step(net, history[history.length - 1], 'e1', NO_GUARDS, actions);
        if (out.kind !== 'fired') throw new Error(`step ${k}: ${out.kind} ${JSON.stringify(out.kind === 'halted' ? out.reason : null)}`);
        history.push(out.next);
    }
    return history;
}

const INC = ['self.a.[r] := self.a.[r] + bits(8, 1)', 'self.b.[r] := self.b.[r] + bits(16, 1)'];

describe('a stored word: widths per element, read at Reset (R-BV-7)', () => {
    it('the widths of one metaclass side by side, the number initial at each width', () => {
        const { net } = counters();
        expect(net.declarationDefects).toEqual([]);
        expect([...net.widths!].map(([e, m]) => [e, [...m]])).toEqual([['RA', [['r', 8]]], ['RB', [['r', 16]]]]);
        expect(vec(r({ state: net.initial, event: null }, 'RA'))).toEqual([8, false, 0n]);
        expect(vec(r({ state: net.initial, event: null }, 'RB'))).toEqual([16, false, 0n]);
    });

    it('an 8-bit register incremented 256 times is 0, the 16-bit one beside it is 256', () => {
        const { net, snap } = counters();
        const history = run(net, snap, INC, 256);
        const last = history[256];
        expect(vec(r(last, 'RA'))).toEqual([8, false, 0n]);
        expect(vec(r(last, 'RB'))).toEqual([16, false, 256n]);
        expect(vec(r(history[255], 'RA'))).toEqual([8, false, 255n]);
    });

    it('step back restores the vector: an earlier σ is untouched by the later steps', () => {
        const { net, snap } = counters();
        const history = run(net, snap, INC, 5);
        expect(vec(r(history[2], 'RA'))).toEqual([8, false, 2n]);
        expect(vec(r(history[2], 'RB'))).toEqual([16, false, 2n]);
        const replay = run(net, snap, INC, 2)[2];
        expect(vec(r(replay, 'RA'))).toEqual(vec(r(history[2], 'RA')));
        expect(r(history[5], 'RA').bits).toBe(5n);
    });

    it('a vector of another width or signedness halts the step with domain, σ unchanged', () => {
        const { net, snap } = counters();
        for (const text of ['self.a.[r] := bits(16, 1)', 'self.a.[r] := sbits(8, 1)', 'self.a.[r] := 1']) {
            const actions = makeActionOracle(snap, net, new Map([[actionSiteKey({ element: 'e1', role: 'transition' }), compileActions([text])]]));
            const out = step(net, { state: net.initial, event: null }, 'e1', NO_GUARDS, actions);
            expect([text, out.kind === 'halted' && out.reason.kind]).toEqual([text, 'domain']);
            expect(out.kind === 'halted' && out.next.state).toBe(net.initial);
        }
    });

    it('a net with no word declaration carries no widths', () => {
        const range: StateAttributeDecl = { name: 'r', metaclass: 'C_Reg', space: 'semantic', domain: { kind: 'range', min: 0, max: 3 }, initial: 0 };
        expect(counters([range]).net.widths).toBeUndefined();
    });
});

describe('the Reset defects of a word, named by the element', () => {
    it('a width-mismatched initial literal: initial, at the element, the value stays', () => {
        const { net } = counters([reg(parseInitialLiteral('bits(16, 3)')!)]);
        expect(net.declarationDefects).toEqual([
            { index: 0, name: 'r', code: 'initial', message: "initial 16'h0003 outside unsigned word[8]", element: 'RA' },
        ]);
        expect(vec(r({ state: net.initial, event: null }, 'RB'))).toEqual([16, false, 3n]);
    });

    it('a number initial that does not fit the element width', () => {
        const { net } = counters([reg(300)]);
        expect(net.declarationDefects).toEqual([
            { index: 0, name: 'r', code: 'initial', message: 'initial 300 outside unsigned word[8]', element: 'RA' },
        ]);
    });

    it('a missing or invalid width: width, at the element, and no width for it', () => {
        const { net } = counters([reg()], [[], [200]]);
        expect(net.declarationDefects).toEqual([
            { index: 0, name: 'r', code: 'width', message: 'no width', element: 'RA' },
            { index: 0, name: 'r', code: 'width', message: 'width 200: an integer from 1 to 128 is required', element: 'RB' },
        ]);
        expect(net.widths).toBeUndefined();
        expect(counters([reg()], [[0], ['8']]).net.declarationDefects!.map(d => [d.code, d.element])).toEqual([['width', 'RA'], ['width', 'RB']]);
        expect(counters([reg()], [[1], [128]]).net.declarationDefects).toEqual([]);
    });

    it('a word input is refused: input (R-BV-8)', () => {
        const input: StateAttributeDecl = { name: 'w', metaclass: null, space: 'semantic', domain: U(), input: true };
        expect(counters([input]).net.declarationDefects!.filter(d => d.code === 'input')).toEqual([
            { index: 0, name: 'w', code: 'input', message: 'an input is not a word (R-BV-8)' },
        ]);
    });
});

describe('inDomain, the width resolution and the initial at a width', () => {
    const v8 = makeBitVector('bits', [8, 7]);
    it('a vector of the width and the signedness; without a width, none', () => {
        expect(inDomain(v8, U(), 8)).toBe(true);
        expect(inDomain(v8, U(), 16)).toBe(false);
        expect(inDomain(v8, { kind: 'word', widthFeature: 'A_w', signed: true }, 8)).toBe(false);
        expect(inDomain(v8, U())).toBe(false);
        expect(inDomain(7, U(), 8)).toBe(false);
        expect(inDomain(v8, { kind: 'range', min: 0, max: 9 })).toBe(false);
    });

    it('wordWidthOf: the first value, an integer from 1 to 128', () => {
        expect(wordWidthOf([8, 16])).toBe(8);
        expect(wordWidthOf([1])).toBe(1);
        expect(wordWidthOf([128])).toBe(128);
        expect(wordWidthOf([129])).toMatch(/1 to 128/);
        expect(wordWidthOf([0])).toMatch(/1 to 128/);
        expect(wordWidthOf([2.5])).toMatch(/1 to 128/);
        expect(wordWidthOf([])).toBe('no width');
    });

    it('wordInitialOf: a number at the width in range, a vector of both, else null', () => {
        expect(vec(wordInitialOf(255, 8, false)!)).toEqual([8, false, 255n]);
        expect(vec(wordInitialOf(-1, 8, true)!)).toEqual([8, true, 255n]);
        expect(wordInitialOf(256, 8, false)).toBeNull();
        expect(wordInitialOf(-1, 8, false)).toBeNull();
        expect(wordInitialOf(v8, 8, false)).toBe(v8);
        expect(wordInitialOf(v8, 8, true)).toBeNull();
        expect(wordInitialOf('A', 8, false)).toBeNull();
    });
});

describe('the codec: the word domain and the bit-vector literal', () => {
    it('a word record round-trips, and a malformed word domain is bad', () => {
        const raw = encodeStateAttributes([{ name: 'r', metaclass: 'C_Reg', space: 'semantic', domain: U(), initial: 'bits(8, 0)' }]);
        expect(raw).toBe('{"v":1,"attrs":[{"name":"r","metaclass":"C_Reg","space":"semantic","domain":{"kind":"word","widthFeature":"A_w","signed":false},"initial":"bits(8, 0)"}]}');
        const { decls, defects } = decodeStateAttributes(raw);
        expect(defects).toEqual([]);
        expect(decls[0].domain).toEqual(U());
        expect(vec(decls[0].initial as JjelBitVector)).toEqual([8, false, 0n]);
        const bad = decodeStateAttributes('{"v":1,"attrs":[{"name":"r","metaclass":null,"space":"semantic","domain":{"kind":"word","widthFeature":"","signed":false},"initial":"0"}]}');
        expect(bad.defects.map(d => d.message)).toEqual(['bad domain']);
        expect(defaultInitialOf(U())).toBe('0');
    });

    it('parseInitialLiteral: bits and sbits with literal arguments in range', () => {
        expect(vec(parseInitialLiteral('bits(8, 255)') as JjelBitVector)).toEqual([8, false, 255n]);
        expect(vec(parseInitialLiteral('sbits(8, -1)') as JjelBitVector)).toEqual([8, true, 255n]);
        expect(vec(parseInitialLiteral("bits(4, '0b1010')") as JjelBitVector)).toEqual([4, false, 10n]);
        expect(parseInitialLiteral('bits(8, 256)')).toBeNull();
        expect(parseInitialLiteral('bits(8, x)')).toBeNull();
        expect(parseInitialLiteral('foo(8, 1)')).toBeNull();
        expect(parseInitialLiteral('-3')).toBe(-3);
    });
});

describe('the subset: bit-vector constants and methods in guards (R-BV-8)', () => {
    const codes = (src: string) => checkGuardSubset(parseExpressionStrict(src).expression!).map(d => d.code);
    it('literal constants and the translatable methods pass; toVerilog and a computed constant do not', () => {
        expect(codes('self.[r] == bits(8, 0)')).toEqual([]);
        expect(codes('self.[r].slice(3, 0) != sbits(4, -1).asUnsigned()')).toEqual([]);
        expect(codes('self.[r].toVerilog() == \'8\'')).toEqual(['T-METHOD']);
        expect(codes('self.[r] == bits(8, self.n)')).toEqual(['E-CALL']);
        expect(codes('now() == 1')).toEqual(['E-CALL']);
    });
});
