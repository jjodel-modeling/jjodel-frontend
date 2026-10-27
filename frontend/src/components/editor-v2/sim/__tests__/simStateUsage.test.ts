/**
 * simStateUsage — what a row of the State page is, and what writes and reads it
 * (R-SIM-103, R-SIM-102 in the dialogs, P-2026-10-03-0041).
 *
 * The fixtures are the usage table of report §3
 * (docs/discovery/discovery_2026-10-02_sim_state_ui.md): the texts of the demo
 * scenes as the probe kit's scenario writes them, on a fake lookup with the
 * D-layer fields the reader walks (`className`, `instanceof`, `father`,
 * `features`, `values`, `name`). Each test name says which break of the rule
 * kills it; the mutation bench is in the commit message.
 */

import { describe, it, expect } from 'vitest';
import {
    DECLARATION_KIND, declarationKind, metamodelModels, modelDeclarationScope, rowUsage, stateAccessPath, stateAccesses,
    stateRowFlags, stateUses, usageLabel, usageTexts,
} from '../simStateUsage';
import type { StateUse, UsageText } from '../simStateUsage';
import { parseAction, parseExpressionStrict } from '../../../../jjel/parser';
import type { StateAttributeRecord } from '../../../../model/simulation/stateAttributesCodec';

type Lookup = Record<string, any>;

/** An object of `model` named `name`, one slot per feature in `slots`. */
function object(lookup: Lookup, model: string, name: string, slots: Record<string, unknown[]>): void {
    const id = `${model}_${name}`;
    const features = Object.keys(slots).map(f => `${id}_${f}`);
    lookup[id] = { className: 'DObject', id, name, father: model, features };
    for (const [f, values] of Object.entries(slots)) lookup[`${id}_${f}`] = { className: 'DValue', id: `${id}_${f}`, instanceof: f, father: id, values };
}

function model(lookup: Lookup, id: string, name: string, metamodel = 'MM'): void {
    lookup[id] = { className: 'DModel', id, name, instanceof: metamodel };
}

const global = (name: string, more: Partial<StateAttributeRecord> = {}): StateAttributeRecord => ({
    name, metaclass: null, space: 'semantic', domain: { kind: 'range', min: 0, max: 3 }, initial: '0', ...more,
});
const ofClass = (name: string, metaclass: string, more: Partial<StateAttributeRecord> = {}): StateAttributeRecord => ({
    name, metaclass, space: 'semantic', domain: { kind: 'range', min: 0, max: 5 }, initial: '0', ...more,
});
const presentation = (name: string, metaclass: string | null, more: Partial<StateAttributeRecord> = {}): StateAttributeRecord => ({
    name, metaclass, space: 'presentation', domain: null, initial: '0', ...more,
});

/** The labels of a list of uses, in order. */
const labels = (uses: readonly StateUse[]) => uses.map(usageLabel);

// -- the scenes of report §3 ---------------------------------------------------

/** DemoESM: tc coin / coins += 1; tp push [paid] / coins := 0; tu and ts with nothing; State.entry bound, empty. */
function esm(): { lookup: Lookup; bag: Record<string, unknown>; rows: StateAttributeRecord[] } {
    const lookup: Lookup = { MM: { className: 'DModel', id: 'MM', name: 'DemoESM' } };
    model(lookup, 'M1', 'demoESM');
    object(lookup, 'M1', 'locked', { F_entry: [] });
    object(lookup, 'M1', 'unlocked', { F_entry: [] });
    object(lookup, 'M1', 'tc', { F_guard: [], F_effect: ['model.[coins] := model.[coins] + 1'] });
    object(lookup, 'M1', 'tp', { F_guard: ['model.[paid]'], F_effect: ['model.[coins] := 0'] });
    object(lookup, 'M1', 'tu', { F_guard: [''], F_effect: [] });
    object(lookup, 'M1', 'ts', { F_guard: [], F_effect: [] });
    return {
        lookup,
        bag: { simGuard: 'F_guard', simAction: 'F_effect', simEntry: 'F_entry' },
        rows: [global('coins'), global('paid', { domain: { kind: 'boolean' }, initial: '', equation: 'model.[coins] >= 2' })],
    };
}

/** DemoFlowB: f2 / count := count + 1; f3 [count < 2]; f4 [count >= 2]. */
function flowB(): { lookup: Lookup; bag: Record<string, unknown>; rows: StateAttributeRecord[] } {
    const lookup: Lookup = { MM: { className: 'DModel', id: 'MM', name: 'DemoFlowB' } };
    model(lookup, 'M1', 'demoFlowB');
    object(lookup, 'M1', 'f1', { F_guard: [], F_effect: [] });
    object(lookup, 'M1', 'f2', { F_guard: [], F_effect: ['model.[count] := model.[count] + 1'] });
    object(lookup, 'M1', 'f3', { F_guard: ['model.[count] < 2'], F_effect: [] });
    object(lookup, 'M1', 'f4', { F_guard: ['model.[count] >= 2'], F_effect: [] });
    return { lookup, bag: { simGuard: 'F_guard', simAction: 'F_effect' }, rows: [global('count')] };
}

const usesOf = (s: { lookup: Lookup; bag: Record<string, unknown>; rows: StateAttributeRecord[] }) =>
    stateUses(usageTexts(s.lookup, s.bag, metamodelModels(s.lookup, 'MM')), s.rows);

// ---------------------------------------------------------------------------

describe('the kind chip and the access path (R-SIM-102, R-SIM-103)', () => {
    it('VAR, DEFINE, IVAR from declarationForm: stored, derived, input (killed by any swap in the map)', () => {
        expect(DECLARATION_KIND).toEqual({ stored: 'VAR', derived: 'DEFINE', input: 'IVAR' });
        expect(declarationKind(global('coins'))).toBe('VAR');
        expect(declarationKind(global('paid', { initial: '', equation: 'model.[coins] >= 2' }))).toBe('DEFINE');
        expect(declarationKind(global('amount', { initial: '', input: true }))).toBe('IVAR');
    });

    it('model.[x] for a global, self.[x] for a metaclass, node.[x] for presentation (killed by reading the metaclass alone)', () => {
        expect(stateAccessPath(global('coins'))).toBe('model.[coins]');
        expect(stateAccessPath(ofClass('visits', 'C_State'))).toBe('self.[visits]');
        expect(stateAccessPath(presentation('heat', 'C_State'))).toBe('node.[heat]');
        // presentation wins over the owner: a model's own presentation is read as node.[x] in its equations
        expect(stateAccessPath(presentation('glow', null))).toBe('node.[glow]');
    });
});

describe('E-NODE on its row before Apply (compileDerived on the draft)', () => {
    const rows: StateAttributeRecord[] = [
        presentation('heat', 'C_State'),
        ofClass('bad', 'C_State', { domain: { kind: 'boolean' }, initial: '', equation: 'node.[heat] > 2' }),
        presentation('warm', 'C_State', { initial: '', equation: 'node.[heat] > 2' }),
        ofClass('byName', 'C_State', { domain: { kind: 'boolean' }, initial: '', equation: 'self.[heat] > 1' }),
        ofClass('blank', 'C_State', { domain: { kind: 'boolean' }, initial: '', equation: '' }),
    ];

    it('a semantic equation reading node, or a presentation name, is flagged; a presentation one is not', () => {
        const flags = stateRowFlags(rows);
        expect([...flags.keys()]).toEqual([1, 3]);
        expect(flags.get(1)).toMatch(/^E-NODE: `node` is presentation state/);
        expect(flags.get(3)).toMatch(/^E-NODE: the semantic equation reads the presentation attribute 'heat'/);
    });

    it('only E-NODE: a blank equation is a parse defect at Reset, not a flag here (killed by flagging every defect)', () => {
        expect(stateRowFlags(rows).has(4)).toBe(false);
        expect(stateRowFlags([rows[4]]).size).toBe(0);
    });

    it('the declarations in scope count: a presentation name declared outside the table (killed by ignoring the context)', () => {
        const table = [global('hot', { domain: { kind: 'boolean' }, initial: '', equation: 'model.[heat] > 1' })];
        expect(stateRowFlags(table).size).toBe(0);
        const flags = stateRowFlags(table, [presentation('heat', null)]);
        expect([...flags.keys()]).toEqual([0]);
        // a flag is on a row of the table only, never on a context index
        expect(stateRowFlags([], [rows[1]]).size).toBe(0);
    });
});

describe('the StateAccess walk', () => {
    const expr = (text: string) => parseExpressionStrict(text).expression;

    it('every access, in order, with its root and the path as written', () => {
        const got = stateAccesses(expr('model.[a] + self.[b] + node.[c] + event.[d] + self.target.[e] + p3.[tokens]'));
        expect(got.map(a => `${a.root} ${a.via}.[${a.attr}]`)).toEqual([
            'model model.[a]', 'self self.[b]', 'node node.[c]', 'event event.[d]', 'path self.target.[e]', 'path p3.[tokens]',
        ]);
    });

    it('inside a lambda and an if: the variable is a path (killed by stopping at the first level)', () => {
        const got = stateAccesses(expr('if model.[on] then self.children.sum(c => c.[size]) else 0'));
        expect(got.map(a => `${a.root}:${a.attr}`)).toEqual(['model:on', 'path:size']);
    });

    it('an action is walked whole: the target and the value', () => {
        const action = parseAction('model.[coins] := model.[coins] + self.[bonus]').action;
        expect(stateAccesses(action).map(a => a.attr)).toEqual(['coins', 'coins', 'bonus']);
    });
});

describe('the texts of the bound features over the models (as the run reads them)', () => {
    it('ESM: the guard and the actions of the model, blanks and empty slots dropped, in lookup order', () => {
        const s = esm();
        const texts = usageTexts(s.lookup, s.bag, metamodelModels(s.lookup, 'MM'));
        expect(texts.map(t => `${t.element} ${t.site}: ${t.text}`)).toEqual([
            'tc action: model.[coins] := model.[coins] + 1',
            'tp guard: model.[paid]',
            'tp action: model.[coins] := 0',
        ]);
        expect(texts.every(t => t.model === 'demoESM')).toBe(true);
    });

    it('a guard is the first value of each Guard feature, `else` is not a text; an action is every value', () => {
        const lookup: Lookup = {};
        model(lookup, 'M1', 'm');
        object(lookup, 'M1', 'e1', { G1: ['else', 'model.[x] > 9'], G2: ['model.[y]'], A1: ['model.[x] := 1', 'model.[y] := 2'] });
        const texts = usageTexts(lookup, { simGuard: JSON.stringify(['G1', 'G2']), simExit: 'A1' }, ['M1']);
        expect(texts.map(t => `${t.site}: ${t.text}`)).toEqual(['guard: model.[y]', 'exit: model.[x] := 1', 'exit: model.[y] := 2']);
    });

    it('only the given models; an unbound feature and a model of another metamodel are not read', () => {
        const s = esm();
        model(s.lookup, 'MX', 'other', 'OTHER_MM');
        object(s.lookup, 'MX', 'tz', { F_effect: ['model.[coins] := 3'] });
        object(s.lookup, 'M1', 'loose', { F_unbound: ['model.[coins] := 2'] });
        expect(metamodelModels(s.lookup, 'MM')).toEqual(['M1']);
        const texts = usageTexts(s.lookup, s.bag, metamodelModels(s.lookup, 'MM'));
        expect(texts.map(t => t.element)).toEqual(['tc', 'tp', 'tp']);
        expect(usageTexts(s.lookup, s.bag, [])).toEqual([]);
    });

    it('PEST: no Guard, Action, Entry or Exit role, no text', () => {
        const s = esm();
        expect(usageTexts(s.lookup, { simNode: 'C_State' }, ['M1'])).toEqual([]);
    });
});

describe('Written by and Read by: the usage table of report §3', () => {
    it('ESM coins: written by tc action and tp action; read by tc action and the equation of paid', () => {
        const s = esm();
        const coins = rowUsage(usesOf(s), s.rows[0]);
        expect(labels(coins.written)).toEqual(['tc action', 'tp action']);
        // killed by not walking the action's value (tc action) and by dropping the equations' reads (equation of paid)
        expect(labels(coins.read)).toEqual(['tc action', 'equation of paid']);
        expect(coins.read.map(u => u.access)).toEqual(['model.[coins]', 'model.[coins]']);
    });

    it('ESM paid: never written (a DEFINE), read by tp guard', () => {
        const s = esm();
        const paid = rowUsage(usesOf(s), s.rows[1]);
        expect(paid.written).toEqual([]);
        expect(labels(paid.read)).toEqual(['tp guard']);
    });

    it('Flow B count: written by f2 action; read by f2 action, f3 guard, f4 guard', () => {
        const s = flowB();
        const count = rowUsage(usesOf(s), s.rows[0]);
        expect(labels(count.written)).toEqual(['f2 action']);
        expect(labels(count.read)).toEqual(['f2 action', 'f3 guard', 'f4 guard']);
    });

    it('Petri: p3.[tokens] is read by t2 guard on an element, and no declaration matches it', () => {
        const lookup: Lookup = {};
        model(lookup, 'M1', 'demoNet');
        object(lookup, 'M1', 't2', { F_guard: ['p3.[tokens] < 1'] });
        const uses = stateUses(usageTexts(lookup, { simGuard: 'F_guard' }, ['M1']), []);
        expect(uses.map(u => `${u.access} ${u.owner} ${u.space} by ${usageLabel(u)}`)).toEqual(['p3.[tokens] element semantic by t2 guard']);
        expect(rowUsage(uses, global('tokens')).read).toEqual([]);
    });

    it('one site reading a name twice is listed once', () => {
        const lookup: Lookup = {};
        model(lookup, 'M1', 'm');
        object(lookup, 'M1', 'f9', { G: ['model.[count] > 0 and model.[count] < 3'] });
        expect(labels(rowUsage(stateUses(usageTexts(lookup, { simGuard: 'G' }, ['M1']), []), global('count')).read)).toEqual(['f9 guard']);
    });
});

describe('the root qualifies the name (killed by matching the name alone)', () => {
    // A global count and a count on State; a heat on State's presentation and a semantic global heat.
    const rows: StateAttributeRecord[] = [
        global('count'),
        ofClass('count', 'C_State'),
        presentation('heat', 'C_State'),
        global('heat'),
        // in a global's equation `self` is the model: twice reads the global count
        global('twice', { initial: '', equation: 'self.[count] * 2' }),
        // in a metaclass equation `self` is the element
        ofClass('busy', 'C_State', { domain: { kind: 'boolean' }, initial: '', equation: 'self.[count] > 1' }),
        // in a global's equation `node` is the model's presentation: glow reads the global warmth, not State's
        presentation('warmth', null),
        presentation('warmth', 'C_State'),
        presentation('glow', null, { initial: '', equation: 'node.[warmth] > 1' }),
        // the same name and owner kind in the other space: a semantic heat on Transition
        ofClass('heat', 'C_Trans'),
    ];
    const lookup: Lookup = {};
    model(lookup, 'M1', 'm');
    object(lookup, 'M1', 'f2', { A: ['model.[count] := model.[count] + 1'] });
    object(lookup, 'M1', 's1', { E: ['self.[count] := self.[count] + 1', 'node.[heat] := model.[heat]'] });
    const uses = stateUses(usageTexts(lookup, { simAction: 'A', simEntry: 'E' }, ['M1']), rows);

    it('the global count: written by f2 action only, read by f2 action and the equation of twice', () => {
        const u = rowUsage(uses, rows[0]);
        expect(labels(u.written)).toEqual(['f2 action']);
        expect(labels(u.read)).toEqual(['f2 action', 'equation of twice']);
    });

    it('count on State: written and read by s1 entry, read by the equation of busy', () => {
        const u = rowUsage(uses, rows[1]);
        expect(labels(u.written)).toEqual(['s1 entry']);
        expect(labels(u.read)).toEqual(['s1 entry', 'equation of busy']);
    });

    it('warmth: the model\'s own is read by the equation of glow through node, State\'s is not (killed by node always an element)', () => {
        expect(labels(rowUsage(uses, rows[6]).read)).toEqual(['equation of glow']);
        expect(rowUsage(uses, rows[7]).read).toEqual([]);
    });

    it('heat: the presentation one is written by s1 entry through node, the global one read by it through model', () => {
        expect(labels(rowUsage(uses, rows[2]).written)).toEqual(['s1 entry']);
        expect(rowUsage(uses, rows[2]).read).toEqual([]);
        expect(rowUsage(uses, rows[3]).written).toEqual([]);
        expect(labels(rowUsage(uses, rows[3]).read)).toEqual(['s1 entry']);
    });

    it('the semantic heat on Transition: node.[heat] is not it (killed by matching the owner and not the space)', () => {
        expect(rowUsage(uses, rows[9])).toEqual({ written: [], read: [] });
    });
});

describe('the model\'s dialog: its globals over the metamodel\'s declarations (R-SIM-94)', () => {
    it('the metamodel\'s declarations a model\'s rows do not shadow: a global of the same name goes, a metaclass one stays', () => {
        const metamodel = [global('coins'), global('paid', { initial: '', equation: 'model.[coins] >= 2' }), ofClass('coins', 'C_State')];
        expect(modelDeclarationScope([global('coins', { initial: '1' })], metamodel)).toEqual([metamodel[1], metamodel[2]]);
        expect(modelDeclarationScope([], metamodel)).toEqual(metamodel);
    });

    it('a model\'s coins is read by the metamodel\'s equation of paid', () => {
        const s = esm();
        const table = [s.rows[0]];
        const scope = modelDeclarationScope(table, s.rows);
        const texts: UsageText[] = usageTexts(s.lookup, s.bag, ['M1']);
        expect(labels(rowUsage(stateUses(texts, [...table, ...scope]), table[0]).read)).toEqual(['tc action', 'equation of paid']);
    });
});
