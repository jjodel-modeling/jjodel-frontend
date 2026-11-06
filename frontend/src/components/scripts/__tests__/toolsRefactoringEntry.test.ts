/**
 * Tools › «Run refactoring on <name>…» (R-JJD-17): the label and the enabled state are a pure function of
 * the artifact of the active tab and the Refactorings compatible with it. Each test names the mutation
 * that kills it.
 */
import { describe, it, expect } from 'vitest';
import { OPEN_ARTIFACT_TOOLTIP, refactoringChoice, toolsRefactoringEntry, type TargetCandidate } from '../projectScripts';

const MM: TargetCandidate = { id: 'MM', name: 'Families', isMetamodel: true };
const M1: TargetCandidate = { id: 'M1', name: 'smiths', isMetamodel: false, metamodelId: 'MM' };

describe('toolsRefactoringEntry', () => {
    it('no artifact: generic label, disabled, asks to open one (kills: label naming a missing artifact)', () => {
        expect(toolsRefactoringEntry(undefined, [])).toEqual({ label: 'Run refactoring…', disabled: true, title: OPEN_ARTIFACT_TOOLTIP });
        expect(OPEN_ARTIFACT_TOOLTIP).toBe('Open a model or metamodel');
    });

    it('no artifact stays disabled even with a list (kills: enabled from the list length alone)', () => {
        expect(toolsRefactoringEntry(null, [{}]).disabled).toBe(true);
    });

    it('a model with Refactorings: named, enabled, no tooltip (kills: inverted disabled)', () => {
        expect(toolsRefactoringEntry(M1, [{}, {}])).toEqual({ label: 'Run refactoring on smiths…', disabled: false });
    });

    it('a model with none: named, disabled, the reason says model (kills: fixed artifact noun)', () => {
        expect(toolsRefactoringEntry(M1, [])).toEqual({
            label: 'Run refactoring on smiths…', disabled: true, title: 'No refactoring for this model',
        });
    });

    it('a metamodel with none: the reason says metamodel (kills: isMetamodel test inverted)', () => {
        expect(toolsRefactoringEntry(MM, [])).toEqual({
            label: 'Run refactoring on Families…', disabled: true, title: 'No refactoring for this metamodel',
        });
    });
});

describe('refactoringChoice', () => {
    it('lists a Refactoring by name, enabled when it has text (kills: empty test inverted)', () => {
        expect(refactoringChoice({ name: 'rename', text: 'create Person' })).toEqual({ label: 'rename', disabled: false, title: undefined });
    });

    it('a blank Refactoring is disabled with the reason (kills: dropped trim)', () => {
        expect(refactoringChoice({ name: 'blank', text: '  \n' })).toEqual({ label: 'blank', disabled: true, title: 'This refactoring is empty' });
    });
});
