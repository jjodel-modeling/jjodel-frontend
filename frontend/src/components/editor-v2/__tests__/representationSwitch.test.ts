import { describe, expect, it } from 'vitest';
import {
    diagramTabFor,
    textAvailability,
    TEXT_ENTRY_METAMODEL_TITLE,
    TEXT_ENTRY_NO_MODEL_TITLE,
    TEXT_ENTRY_TITLE,
} from '../representationSwitch';
import { modelOfTabId } from '../../abstract/tabs/modelTabId';

// R-MT-35 (P-2026-11-20-1610): the `Diagram | Text` switch of the editor bar.

describe('textAvailability', () => {
    it('hides the switch when the textual view is off (the picker entry gate)', () => {
        expect(textAvailability({ isMetamodel: false, modelId: 'm1', textualEnabled: false }).shown).toBe(false);
        expect(textAvailability({ isMetamodel: true, modelId: 'mm', textualEnabled: false }).shown).toBe(false);
    });

    it('shows Text disabled, with its reason, on a metamodel', () => {
        expect(textAvailability({ isMetamodel: true, modelId: 'mm', textualEnabled: true }))
            .toEqual({ shown: true, enabled: false, title: TEXT_ENTRY_METAMODEL_TITLE });
    });

    it('shows Text disabled without a model', () => {
        expect(textAvailability({ isMetamodel: false, modelId: '', textualEnabled: true }))
            .toEqual({ shown: true, enabled: false, title: TEXT_ENTRY_NO_MODEL_TITLE });
        expect(textAvailability({ isMetamodel: false, modelId: null, textualEnabled: true }).enabled).toBe(false);
    });

    it('enables Text on a model with the textual view on', () => {
        expect(textAvailability({ isMetamodel: false, modelId: 'm1', textualEnabled: true }))
            .toEqual({ shown: true, enabled: true, title: TEXT_ENTRY_TITLE });
    });
});

describe('diagramTabFor', () => {
    const text = 'txt_m1';

    it('prefers a canvas tab of the model in the Text tab\'s own group', () => {
        const own = [{ id: 'other' }, { id: text }, { id: 'm1~tab2' }];
        const left = [{ id: 'm1' }];
        expect(diagramTabFor('m1', text, own, [left], modelOfTabId)).toBe('m1~tab2');
    });

    it('falls back to a canvas tab of the model in another group', () => {
        const own = [{ id: text }, { id: 'm2' }];
        const left = [{ id: 'mm' }, { id: 'm1' }];
        expect(diagramTabFor('m1', text, own, [left], modelOfTabId)).toBe('m1');
    });

    it('never returns the Text tab itself, nor another model\'s tab', () => {
        const own = [{ id: text }, { id: 'm10' }, {}];
        expect(diagramTabFor('m1', text, own, [[{ id: 'm2~tab3' }]], modelOfTabId)).toBeNull();
    });

    it('reads other groups when the Text tab is in none', () => {
        expect(diagramTabFor('m1', text, null, [[{ id: 'm1~tab4' }]], modelOfTabId)).toBe('m1~tab4');
    });
});
