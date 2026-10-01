/**
 * subsetChecker — step 2 of the plan (spec §5.4, R-SIM-18), P-2026-09-24-1520.
 *
 * Executes `checkGuardSubset` (P11) on parsed guards: every diagnostic code has
 * a test that produces it and, beside it, the nearest guard that must not
 * (P12). The rewrites of E-EAGER are executed in guardEvaluator.test.ts.
 */

import { describe, it, expect } from 'vitest';
import { parseExpression } from '../../../jjel/parser';
import { getCollectionMethod, getDateMethod, getNumberMethod, getStringMethod } from '../../../jjel/evaluator';
import { checkGuardSubset, GUARD_ROOTS, NOT_VERIFIABLE_METHODS } from '../subsetChecker';
import type { SubsetDiagnostic } from '../subsetChecker';
import { STATE_RESERVED } from '../../../jjel/stateReserved';

function check(src: string): SubsetDiagnostic[] {
    const parsed = parseExpression(src);
    expect(parsed.errors).toEqual([]);
    return checkGuardSubset(parsed.expression!, src);
}
const codes = (src: string) => check(src).map(d => d.code);

describe('clean guards produce no diagnostic', () => {
    const clean = [
        'self.count > 1 and event == go',
        'self.requires != null implies self.requires.locked',
        'if self.requires != null then self.requires.locked else false',
        'Transition.instances.all(t => t.count > 0)',
        'exists t in Transition.instances | t == self',
        '(forall t in Transition.instances such that t.count > 3).size == 1',
        'self.requires?.locked == true',
        'model.id == "m1" and self.node == 1',
        'self.owner != null and self.count > 0',
        'x != null and y.p',
        'x != null and x?.p',
        'x != null and xs.all(x => x.p)',
        'x[0] == null',
    ];
    for (const src of clean) {
        it(src, () => expect(codes(src)).toEqual([]));
    }
});

describe('errors', () => {
    it('E-NODE: a free `node`, not the feature `self.node`', () => {
        expect(codes('node == null')).toEqual(['E-NODE']);
        expect(codes('exists n in xs | node == n')).toEqual(['E-NODE']);
        expect(codes('self.node == null')).toEqual([]);
    });

    it('E-DATA: a free `data`', () => {
        expect(codes('data.count == 1')).toEqual(['E-DATA']);
        expect(codes('self.data.count == 1')).toEqual([]);
    });

    it('E-SHADOW: every root, as a lambda parameter, a forall and an exists variable', () => {
        for (const root of GUARD_ROOTS) {
            expect(codes(`exists ${root} in xs | ${root} == 1`)).toEqual(['E-SHADOW']);
        }
        expect(codes('xs.all(event => event == 1)')).toEqual(['E-SHADOW']);
        expect(codes('(forall model in xs such that model == 1).size == 0')).toEqual(['E-SHADOW']);
        expect(codes('exists other in xs | other == 1')).toEqual([]);
        expect(codes('exists data in xs | data == 1')).toEqual([]);
    });

    it('E-EAGER, and-form: the rewrite quotes the author text', () => {
        const d = check('self.requires != null and self.requires.locked');
        expect(d.map(x => x.code)).toEqual(['E-EAGER']);
        expect(d[0].severity).toBe('error');
        expect(d[0].message).toContain('Write: if self.requires != null then self.requires.locked else false');
    });

    it('E-EAGER, or-form: the rewrite is implies', () => {
        const d = check('self.requires == null or self.requires.locked');
        expect(d.map(x => x.code)).toEqual(['E-EAGER']);
        expect(d[0].message).toContain('Write: self.requires != null implies self.requires.locked');
    });

    it('E-EAGER: null on the left, a method call, a longer conjunction, a longer disjunction', () => {
        expect(codes('null != x and x.size() > 0')).toEqual(['E-EAGER']);
        expect(codes('self.requires != null and self.count > 0 and self.requires.locked')).toEqual(['E-EAGER']);
        const d = check('x == null or y == null or x.p');
        expect(d.map(z => z.code)).toEqual(['E-EAGER']);
        expect(d[0].message).toContain('Write: not (x == null or y == null) implies x.p');
    });

    it('E-EAGER: not raised when the right side does not navigate the tested path with `.`', () => {
        expect(codes('x != null and x?.p')).toEqual([]);
        expect(codes('x != null and x[0] == 1')).toEqual([]);
        expect(codes('x != null and y.p')).toEqual([]);
        expect(codes('x == null and x.p')).toEqual([]);
        expect(codes('x != null and xs.all(x => x.p)')).toEqual([]);
    });

    it('E-NOELSE: an if without else, anywhere in the guard', () => {
        expect(codes('if self.count > 1 then true')).toEqual(['E-NOELSE']);
        expect(codes('self.ok and (if self.count > 1 then true)')).toEqual(['E-NOELSE']);
        expect(codes('if self.count > 1 then true else false')).toEqual([]);
    });

    it('E-FORALL: a forall as the whole guard, not as an operand', () => {
        expect(codes('forall t in xs : t.ok')).toEqual(['E-FORALL']);
        expect(codes('(forall t in xs such that t.ok).isEmpty')).toEqual([]);
    });

    it('E-VALUE: a lambda outside a method argument, an object literal anywhere', () => {
        expect(codes('x => true')).toEqual(['E-VALUE']);
        expect(codes('{a: 1} == self')).toEqual(['E-VALUE']);
        expect(codes('xs.any(x => true)')).toEqual([]);
    });

    it('E-WITH: with … do is rejected, and its body is not analysed', () => {
        expect(codes('with self do count == 2')).toEqual(['E-WITH']);
        expect(codes('with self do node == 1')).toEqual(['E-WITH']);
    });

    it('E-CALL: a function call', () => {
        expect(codes('now() != null')).toEqual(['E-CALL']);
        expect(codes('String(1) == "1"')).toEqual(['E-CALL']);
        expect(codes('now == null')).toEqual([]);
    });
});

describe('warnings', () => {
    it('W-NULLCMP: `?.` under an ordering comparison, not under equality', () => {
        expect(codes('self.requires?.level < 5')).toEqual(['W-NULLCMP']);
        expect(codes('5 >= x?.m()')).toEqual(['W-NULLCMP']);
        expect(codes('self.requires?.level == 5')).toEqual([]);
        expect(codes('self.requires.level < 5')).toEqual([]);
    });

    it('W-TRUTHY: a syntactically non-boolean operand of and, or, not, implies, if', () => {
        expect(codes('[] and true')).toEqual(['W-TRUTHY']);
        expect(codes('1 or false')).toEqual(['W-TRUTHY']);
        expect(codes('not 3')).toEqual(['W-TRUTHY']);
        expect(codes('"a" implies true')).toEqual(['W-TRUTHY']);
        expect(codes('if self.count + 1 then true else false')).toEqual(['W-TRUTHY']);
        expect(codes('self.ok and true')).toEqual([]);
    });

    it('W-IS: `is` on instances', () => {
        const d = check('self is Transition');
        expect(d.map(x => x.code)).toEqual(['W-IS']);
        expect(d[0].severity).toBe('warning');
        expect(d[0].message).toContain('self.instanceOf == Transition');
    });
});

describe('not verifiable', () => {
    it('T-DECIMAL, T-DIV, T-MOD', () => {
        expect(codes('self.count > 1.5')).toEqual(['T-DECIMAL']);
        expect(codes('self.count > 2')).toEqual([]);
        expect(codes('self.count / 2 == 1')).toEqual(['T-DIV']);
        expect(codes('self.count % 2 == 1')).toEqual(['T-MOD']);
        expect(codes('self.count * 2 == 4')).toEqual([]);
    });

    it('T-METHOD: by name, on a method call and a null-safe one', () => {
        expect(codes('self.name.matches("a")')).toEqual(['T-METHOD']);
        expect(codes('xs.sortBy(x => x.c).first() == self')).toEqual(['T-METHOD']);
        expect(codes('self.created?.year() > 2000')).toEqual(['W-NULLCMP', 'T-METHOD']);
        expect(codes('xs.size() > 0 and self.name.format() == "a"')).toEqual([]);
    });

    it('every name in the list is a builtin, and none is shared with a group that translates', () => {
        for (const name of NOT_VERIFIABLE_METHODS) {
            const inCollection = !!getCollectionMethod(name);
            const inString = !!getStringMethod(name);
            const inNumber = !!getNumberMethod(name);
            const inDate = !!getDateMethod(name);
            expect(inCollection || inString || inNumber || inDate, name).toBe(true);
            // A string method is flagged only when strings are its one home (`matches`).
            if (inString) expect([name, inCollection || inNumber || inDate]).toEqual(['matches', false]);
        }
        expect(NOT_VERIFIABLE_METHODS.has('format')).toBe(false);
        expect(!!getStringMethod('format') && !!getDateMethod('format')).toBe(true);
    });
});

describe('severity and location', () => {
    it('one diagnostic of each severity, with the location of the node', () => {
        const d = check('self is T and node == null and self.count > 1.5');
        const bySeverity = Object.fromEntries(d.map(x => [x.severity, x.code]));
        expect(bySeverity).toEqual({ warning: 'W-IS', error: 'E-NODE', 'not-verifiable': 'T-DECIMAL' });
        const node = d.find(x => x.code === 'E-NODE')!;
        expect(node.location?.start.offset).toBe('self is T and '.length);
    });
});

describe('state access .[x] (R-SIM-18, R-SIM-30, R-SIM-42), P-2026-09-25-1445', () => {
    it('reading state is exportable: no diagnostic on self, model, event or a path', () => {
        for (const src of ['self.[visits] < 3', 'model.[i] == 0', 'event.[n] > 1', 'self.target.[visits] + 1 < 3',
            'p.[tokens] < 2 and q.[marked]', 'Place.instances.all(p => p.[tokens] <= 1)']) {
            expect(codes(src), src).toEqual([]);
        }
    });

    it('M11: node.[x] in a guard is E-NODE, anywhere in it', () => {
        expect(codes('node.[level] > 0')).toEqual(['E-NODE']);
        expect(codes('self.[a] == 1 and node.[b] == 2')).toEqual(['E-NODE']);
        expect(codes('xs.all(x => node.[b] == x)')).toEqual(['E-NODE']);
        expect(codes('self.node.[b] == 2')).toEqual([]);
    });

    it('the roots are read from the single list of jjel/stateReserved.ts', () => {
        expect(GUARD_ROOTS).toBe(STATE_RESERVED.roots);
        expect([...STATE_RESERVED.roots]).toEqual(['self', 'event', 'model', 'node']);
        expect(STATE_RESERVED.presentationRoot).toBe('node');
        expect([...STATE_RESERVED.readOnlyAttributes]).toEqual(['marked', 'tokens']);
        expect(STATE_RESERVED.operator).toBe('.[');
    });
});
