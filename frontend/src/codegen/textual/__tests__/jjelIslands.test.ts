/**
 * Step F, lane F1a (P-2026-11-07-1356; R-TXT-55 F1 and F11, docs/discovery/discovery_2026-11-07_textual_f_jjel_tracing.md
 * §3.2, §4.3): which attribute values are JjEL, read off the primitive's id as conformance keys it, never off the type's
 * name. The globals are written by hand in the shape eval.ts builds them, the store's imports mocked as textualTab.test.ts
 * does. Mutations each test kills are in its name; the bench is in the commit body.
 */

import { describe, it, expect, vi } from 'vitest';

vi.mock('@monaco-editor/react', () => ({ default: () => null }));
vi.mock('../../../jjscript', () => ({ buildEvalContext: () => ({}) }));
vi.mock('../../../components/editor-v2/sim/simBridge', () => ({ evalContextFor: () => ({}) }));
vi.mock('../../../components/abstract/DockManager', () => ({ default: { closeTab: () => true } }));

import { textInputOf } from '../ui/TextualTab';
import { classFeatures, jjelOf } from '../metamodel';
import type { TextMetamodel } from '../metamodel';

describe('F1: a JjEL value is an attribute typed by Pointer_EXPRESSION or Pointer_ACTION', () => {
    it('maps the two primitive ids and nothing else (dies on the ids swapped, on a name read as an id, on a prototype key)', () => {
        expect(jjelOf('Pointer_EXPRESSION')).toEqual({ jjel: 'expression' });
        expect(jjelOf('Pointer_ACTION')).toEqual({ jjel: 'action' });
        for (const t of ['Expression', 'Action', 'Pointer_ESTRING', 'constructor', 'toString', '', undefined, null, 42]) expect(jjelOf(t)).toEqual({});
    });

    // The shells as eval.ts builds them: `type` the type's name (eval.ts `attr.type?.name`), measured in the app on
    // DemoESM (R1): `String(a.type)` is `Expression`, `a.type.id` undefined, the lookup's `type` the primitive's id.
    const globals = () => ({
        classes: [{
            id: 'C_T', name: 'Transition', superTypes: [],
            attributes: [
                { id: 'A_name', name: 'name', type: 'EString' },
                { id: 'A_guard', name: 'guard', type: 'Expression' },
                { id: 'A_effect', name: 'effect', type: 'Action' },
                { id: 'A_note', name: 'note', type: 'EString' },
                { id: 'A_fake', name: 'fake', type: 'Expression' },
            ],
            references: [],
        }],
        enumerations: [],
        instances: [],
    });
    const lookup = {
        A_name: { id: 'A_name', type: 'Pointer_ESTRING' },
        A_guard: { id: 'A_guard', type: 'Pointer_EXPRESSION' },
        A_effect: { id: 'A_effect', type: 'Pointer_ACTION' },
        A_note: { id: 'A_note', type: 'Pointer_ESTRING' },
        // A user class called Expression: the name prints the same, the id is not the primitive's.
        A_fake: { id: 'A_fake', type: 'Pointer_UserExpression' },
    };

    it('textInputOf sets `jjel` from the lookup by the attribute id, EString and a namesake class left out (dies on the flag dropped, on the name keyed)', () => {
        const attrs = textInputOf(globals(), lookup).metamodel.classes[0].attributes!;
        const jj = Object.fromEntries(attrs.map(a => [a.name, a.jjel ?? null]));
        expect(jj).toEqual({ name: null, guard: 'expression', effect: 'action', note: null, fake: null });
        expect(attrs.find(a => a.name === 'guard')!.type).toBe('Expression');
        // Without the lookup no attribute is JjEL: the shell holds no id of its type.
        expect(textInputOf(globals()).metamodel.classes[0].attributes!.some(a => a.jjel !== undefined)).toBe(false);
    });

    it('classFeatures carries `jjel` onto the feature, own and inherited (dies on the flag not carried)', () => {
        const mm: TextMetamodel = {
            classes: [
                { name: 'Base', attributes: [{ name: 'guard', type: 'Expression', jjel: 'expression' }] },
                { name: 'Step', supers: ['Base'], attributes: [{ name: 'effect', type: 'Action', jjel: 'action' }, { name: 'note', type: 'EString' }] },
            ],
            enumerations: [],
        };
        const fs = classFeatures(mm, mm.classes[1]);
        expect(fs.map(f => [f.name, f.jjel ?? null])).toEqual([['guard', 'expression'], ['effect', 'action'], ['note', null]]);
        expect('jjel' in fs[2]).toBe(false);
    });
});
