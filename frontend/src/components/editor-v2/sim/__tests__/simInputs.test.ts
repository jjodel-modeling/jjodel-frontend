/**
 * simInputs — the pure layer of the inputs' UI (R-SIM-88, P-2026-09-28-0034).
 *
 * Executes the module the dialogs read (P11): SimInputDialog.tsx and
 * SimRolesModal.tsx import the joiner and cannot load under the node bench, so
 * the rows and the confirm gate of the input dialog, and the form of a Data row,
 * live here. Each test name says which break kills it; the bench is in the
 * commit message.
 */

import { describe, it, expect } from 'vitest';
import { declarationForm, formPatch, inputRows, inputValues, parseInputValue } from '../simInputs';
import type { InputRead } from '../../../../model/simulation/netTypes';
import type { StateAttributeRecord } from '../../../../model/simulation/stateAttributesCodec';

const LOOKUP: Record<string, any> = { D: { id: 'D', name: 'DecisionNode_0' }, M: { id: 'M', name: 'decFlow' } };
const NET = { modelId: 'M' };
const DECISION: InputRead = { element: 'D', attr: 'decision', domain: { kind: 'boolean' } };
const LEVEL: InputRead = { element: 'D', attr: 'level', domain: { kind: 'range', min: 1, max: 3 } };
const MODE: InputRead = { element: 'M', attr: 'mode', domain: { kind: 'enum', literals: ['fast', 'slow'] } };

describe('the rows of the input dialog', () => {
    it('one row per ask, named as Last step names it, a global by its name (mutant: the id shown)', () => {
        expect(inputRows([DECISION, MODE], NET, LOOKUP).map(r => [r.key, r.label])).toEqual([['D:decision', 'DecisionNode_0.decision'], ['M:mode', 'mode']]);
    });
});

describe('the value typed, by domain', () => {
    it('boolean: true or false only', () => {
        expect([parseInputValue(DECISION.domain, 'true'), parseInputValue(DECISION.domain, 'false'), parseInputValue(DECISION.domain, '')]).toEqual([true, false, null]);
    });

    it('range: an integer within the bounds (mutants: bounds unchecked, a decimal accepted)', () => {
        expect(['1', '3', ' 2 ', '0', '4', '2.5', '', 'x'].map(t => parseInputValue(LEVEL.domain, t))).toEqual([1, 3, 2, null, null, null, null, null]);
    });

    it('enum: one of its literals', () => {
        expect(['fast', 'slow', 'Fast', ''].map(t => parseInputValue(MODE.domain, t))).toEqual(['fast', 'slow', null, null]);
    });
});

describe('the confirm gate', () => {
    it('the values only when every row has one, in the order of the rows (mutant: a partial answer confirmed)', () => {
        const rows = inputRows([DECISION, LEVEL], NET, LOOKUP);
        expect(inputValues(rows, { 'D:decision': 'false' })).toBeNull();
        expect(inputValues(rows, { 'D:decision': 'false', 'D:level': '9' })).toBeNull();
        expect(inputValues(rows, { 'D:level': '2', 'D:decision': 'false' })).toEqual([
            { element: 'D', attr: 'decision', value: false }, { element: 'D', attr: 'level', value: 2 },
        ]);
    });
});

describe('the form of a Data row: stored, derived or input', () => {
    const STORED: StateAttributeRecord = { name: 'n', metaclass: null, space: 'semantic', domain: { kind: 'range', min: 0, max: 3 }, initial: '1' };
    const apply = (row: StateAttributeRecord, form: string): StateAttributeRecord => ({ ...row, ...formPatch(row, form) });

    it('reads the form of a row (mutant: an input read as stored)', () => {
        expect([declarationForm(STORED), declarationForm({ ...STORED, initial: '', equation: 'x' }), declarationForm({ ...STORED, initial: '', input: true })])
            .toEqual(['stored', 'derived', 'input']);
    });

    it('to input: no initial, no equation, semantic with its domain kept, boolean when it had none (mutants: the initial kept, the space kept)', () => {
        const input = apply(STORED, 'input');
        expect([input.input, input.initial, input.equation, input.space, input.domain]).toEqual([true, '', undefined, 'semantic', STORED.domain]);
        const fromPresentation = apply({ ...STORED, space: 'presentation', domain: null }, 'input');
        expect([fromPresentation.space, fromPresentation.domain]).toEqual(['semantic', { kind: 'boolean' }]);
    });

    it('back to stored or derived, the input goes; derived and stored keep their rules (mutant: input left on the row)', () => {
        const input = apply(STORED, 'input');
        expect(declarationForm(apply(input, 'stored'))).toBe('stored');
        expect(declarationForm(apply(input, 'derived'))).toBe('derived');
        expect(apply(STORED, 'derived')).toMatchObject({ initial: '', equation: '' });
        expect(apply({ ...STORED, initial: '', equation: 'x' }, 'stored').equation).toBeUndefined();
    });
});
