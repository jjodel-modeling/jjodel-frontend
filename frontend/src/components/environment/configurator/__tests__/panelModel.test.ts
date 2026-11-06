import { describe, expect, it } from 'vitest';
import {
    FOLD_PREFIX,
    canUnlink,
    cardinalityLabel,
    cardinalityText,
    componentKind,
    createControl,
    foldKey,
    issuesText,
    newTargetAt,
    orderComponents,
    parseFolds,
    partitionFields,
    roleRendering,
    saveStatus,
    serializeFolds,
    summaryLine,
    typeLabel,
} from '../panelModel';

// #187 (P-2026-10-14-1100), task 8: the four labels Juri proposed in #166 on 2026-10-07 and @tmaog accepted.
describe('cardinalityLabel', () => {
    it('reads the four cases of #187 task 8', () => {
        expect(cardinalityLabel(0, 1)).toBe('Optional, single');
        expect(cardinalityLabel(1, 1)).toBe('Required, single');
        expect(cardinalityLabel(0, -1)).toBe('Zero or more values');
        expect(cardinalityLabel(1, -1)).toBe('Required, multiple');
    });
    it('reads a bounded upper as multiple, the bound being said by the disabled «+ Add»', () => {
        expect(cardinalityLabel(0, 5)).toBe('Zero or more values');
        expect(cardinalityLabel(2, 5)).toBe('Required, multiple');
        expect(cardinalityLabel(0, 2)).toBe('Zero or more values');
    });
});

describe('cardinalityText', () => {
    it('adds the number of values held to a multi-valued feature (@tmaog, «[3]»)', () => {
        expect(cardinalityText({ lower: 1, upper: -1, count: 3 })).toBe('Required, multiple · 3');
        expect(cardinalityText({ lower: 0, upper: 2, count: 0 })).toBe('Zero or more values · 0');
    });
    it('prints no count on a single-valued feature', () => {
        expect(cardinalityText({ lower: 1, upper: 1, count: 1 })).toBe('Required, single');
    });
    it('prints «derived» for a derived feature', () => {
        expect(cardinalityText({ lower: 0, upper: -1, derived: true, count: 2 })).toBe('derived');
    });
});

describe('typeLabel', () => {
    it('drops the Ecore E of the primitives, as the mockup prints [String] and [Int]', () => {
        expect(typeLabel('EString')).toBe('String');
        expect(typeLabel('EInt')).toBe('Int');
        expect(typeLabel('EDouble')).toBe('Double');
        expect(typeLabel('EBoolean')).toBe('Boolean');
    });
    it('leaves every other name as it is, a class that starts with E included', () => {
        expect(typeLabel('Event')).toBe('Event');
        expect(typeLabel('Phase')).toBe('Phase');
        expect(typeLabel('Level')).toBe('Level');
    });
});

const f = (name: string, isReference = false, isComposition = false) => ({ name, isReference, isComposition });

describe('partitionFields', () => {
    it('puts the name attribute in Identity, the other attributes in Attributes, references and compositions together in Components', () => {
        const p = partitionFields([f('title'), f('name'), f('goal', true), f('phases', false, true), f('duration')]);
        expect(p.identity?.name).toBe('name');
        expect(p.attributes.map((x) => x.name)).toEqual(['title', 'duration']);
        expect(p.components.map((x) => x.name)).toEqual(['goal', 'phases']);
    });
    it('has no identity field when the class has no name attribute', () => {
        expect(partitionFields([f('title'), f('goal', true)]).identity).toBeNull();
    });
    it('does not take a reference called name for the identity', () => {
        const p = partitionFields([f('name', true), f('title')]);
        expect(p.identity).toBeNull();
        expect(p.components.map((x) => x.name)).toEqual(['name']);
    });
});

describe('componentKind', () => {
    it('is composition only for a composition; an aggregation is a reference, as in shape.refs', () => {
        expect(componentKind({ composition: true })).toBe('composition');
        expect(componentKind({ composition: false })).toBe('reference');
    });
});

describe('orderComponents', () => {
    const items = [{ key: 'phases' }, { key: 'goal' }, { key: 'teacher' }, { key: 'assessment' }];
    it('follows the slot order of the instance', () => {
        expect(orderComponents(items, ['goal', 'teacher', 'assessment', 'phases']).map((x) => x.key)).toEqual(['goal', 'teacher', 'assessment', 'phases']);
    });
    it('then the order of the view, the named ones first', () => {
        expect(orderComponents(items, ['goal', 'teacher', 'assessment', 'phases'], ['phases', 'teacher']).map((x) => x.key))
            .toEqual(['phases', 'teacher', 'goal', 'assessment']);
    });
    it('keeps a component the slot order does not name, at the end', () => {
        expect(orderComponents(items, ['goal']).map((x) => x.key)).toEqual(['goal', 'phases', 'teacher', 'assessment']);
    });
    it('does not mutate its input', () => {
        const copy = items.map((x) => x.key);
        orderComponents(items, ['assessment', 'goal']);
        expect(items.map((x) => x.key)).toEqual(copy);
    });
});

describe('folds', () => {
    it('keys the folds per metaclass', () => {
        expect(foldKey('Pointer_1')).toBe(`${FOLD_PREFIX}Pointer_1`);
        expect(FOLD_PREFIX).toBe('jjodel.cfgPanel.folds.');
    });
    it('round-trips the folded sections', () => {
        expect([...parseFolds(serializeFolds(new Set(['components', 'identity'] as const)))].sort()).toEqual(['components', 'identity']);
    });
    it('drops what is not a section, and reads corrupt or absent input as nothing folded', () => {
        expect([...parseFolds('["attributes","references",3]')]).toEqual(['attributes']);
        expect(parseFolds('{not json').size).toBe(0);
        expect(parseFolds('{"a":1}').size).toBe(0);
        expect(parseFolds(null).size).toBe(0);
    });
});

describe('createControl', () => {
    it('is hidden when the feature or the role forbids the create', () => {
        expect(createControl({ writable: false, reason: null })).toEqual({ state: 'hidden', reason: null });
        expect(createControl({ writable: false, reason: '«phases» is full — cardinality 0..2' }).state).toBe('hidden');
    });
    it('is disabled with its reason at the upper bound or on an abstract target', () => {
        expect(createControl({ writable: true, reason: 'Abstract metaclass — it has no direct instances' }))
            .toEqual({ state: 'disabled', reason: 'Abstract metaclass — it has no direct instances' });
    });
    it('is enabled otherwise', () => {
        expect(createControl({ writable: true, reason: null })).toEqual({ state: 'enabled', reason: null });
    });
});

describe('newTargetAt', () => {
    const row = (index: number, actions: string[]) => ({ index, actions });
    it('on a multi-valued slot appends while the slot is below its upper bound', () => {
        expect(newTargetAt({ upper: -1 }, { link: 'append', rows: [row(0, ['open', 'remove'])] })).toBe('append');
        expect(newTargetAt({ upper: 2 }, { link: null, rows: [row(0, []), row(1, [])] })).toBeNull();
    });
    it('on an empty single-valued slot sets the index the slot links at (R-REF-4)', () => {
        expect(newTargetAt({ upper: 1 }, { link: 0, rows: [] })).toBe(0);
        expect(newTargetAt({ upper: 1 }, { link: null, rows: [] })).toBeNull();
    });
    it('on a filled single-valued slot replaces at the raw index of the row, only when the row may change', () => {
        expect(newTargetAt({ upper: 1 }, { link: null, rows: [row(2, ['open', 'change'])] }, 2)).toBe(2);
        expect(newTargetAt({ upper: 1 }, { link: null, rows: [row(2, ['open'])] }, 2)).toBeNull();
        expect(newTargetAt({ upper: 1 }, { link: null, rows: [row(2, ['open', 'change'])] }, 0)).toBeNull();
    });
});

// P-2026-10-20-1123, R-CFG-7: the Configurator unlinks every single reference the viewer may write,
// required ones included; `jjform/refSlot` keeps R-REF-3 for the Data Manager.
describe('canUnlink', () => {
    const row = (actions: string[]) => ({ actions });
    it('on a multi-valued slot follows the row\'s remove, as R-REF-3 rules it', () => {
        expect(canUnlink({ upper: -1 }, row(['open', 'remove']))).toBe(true);
        expect(canUnlink({ upper: 2 }, row(['open']))).toBe(false);
    });
    it('does not read change on a multi-valued slot', () => {
        expect(canUnlink({ upper: -1 }, row(['open', 'change']))).toBe(false);
        expect(canUnlink({ upper: 2 }, row(['open', 'change']))).toBe(false);
    });
    it('on a single-valued slot unlinks a required row the viewer may change, and an optional one', () => {
        expect(canUnlink({ upper: 1 }, row(['open', 'change']))).toBe(true);
        expect(canUnlink({ upper: 1 }, row(['open', 'change', 'remove']))).toBe(true);
    });
    it('keeps a row the viewer may not write: changeable=false, derived, the role, a locked value, a hidden reference', () => {
        expect(canUnlink({ upper: 1 }, row(['open']))).toBe(false);
        expect(canUnlink({ upper: 1 }, row([]))).toBe(false);
    });
    it('unlinks a dangling pointer of a required single slot, which has no Open', () => {
        expect(canUnlink({ upper: 1 }, row(['change']))).toBe(true);
    });
});

describe('issuesText', () => {
    it('says no issues, and counts errors and warnings with their plurals', () => {
        expect(issuesText(0, 0)).toBe('No issues');
        expect(issuesText(1, 0)).toBe('1 error');
        expect(issuesText(2, 0)).toBe('2 errors');
        expect(issuesText(0, 1)).toBe('1 warning');
        expect(issuesText(1, 2)).toBe('1 error, 2 warnings');
    });
});

describe('saveStatus', () => {
    it('reads the project flag', () => {
        expect(saveStatus(true)).toBe('Unsaved');
        expect(saveStatus(false)).toBe('Saved');
    });
});

describe('summaryLine', () => {
    it('joins the key fields of an element as label: text', () => {
        expect(summaryLine([{ label: 'description', text: 'Learn X' }, { label: 'minutes', text: '30' }])).toBe('description: Learn X · minutes: 30');
        expect(summaryLine([])).toBe('');
    });
});

// #186 «Customize element» (P-2026-10-17-1053): how the role's widget renders through the form's own widgets.
describe('roleRendering', () => {
    const str = { typeName: 'EString', isEnum: false, isMultivalued: false, isReadOnly: false, derivedWidget: 'text' };
    const num = { typeName: 'EInt', isEnum: false, isMultivalued: false, isReadOnly: false, derivedWidget: 'number' };
    it('a string: input forces the plain text cell, textarea the growing box, dropdown the panel\'s dropdown', () => {
        expect(roleRendering('input', str)).toEqual({ widget: 'text', cellWidget: 'text' });
        expect(roleRendering('textarea', str)).toEqual({ widget: 'text', multiline: true });
        expect(roleRendering('dropdown', str)).toEqual({ widget: 'text', dropdown: 'string' });
    });
    it('a number: the stepper, the number input (the stepper without its buttons: a text field would write a string), the number dropdown', () => {
        expect(roleRendering('stepper', num)).toEqual({ widget: 'number', cellWidget: 'number' });
        expect(roleRendering('number-input', num)).toEqual({ widget: 'number', cellWidget: 'number', numberInput: true });
        expect(roleRendering('number-dropdown', num)).toEqual({ widget: 'number', dropdown: 'number' });
    });
    it('no widget, an unknown one, or one of the other family: what the panel renders without a presentation', () => {
        expect(roleRendering(undefined, str)).toBeNull();
        expect(roleRendering('select', str)).toBeNull();
        expect(roleRendering('stepper', str)).toBeNull();
        expect(roleRendering('input', num)).toBeNull();
    });
    it('a choice the field does not offer: an enum, a multi-valued or read-only field, a type without choices', () => {
        expect(roleRendering('dropdown', { ...str, isEnum: true, derivedWidget: 'select' })).toBeNull();
        expect(roleRendering('input', { ...str, isMultivalued: true })).toBeNull();
        expect(roleRendering('number-input', { ...num, isReadOnly: true })).toBeNull();
        expect(roleRendering('input', { ...str, typeName: 'EChar' })).toBeNull();
    });
    it('a stale presentation: a string choice on a field whose type became numeric renders the number widget of today', () => {
        expect(roleRendering('textarea', { ...str, derivedWidget: 'number' })).toBeNull();
    });
});
