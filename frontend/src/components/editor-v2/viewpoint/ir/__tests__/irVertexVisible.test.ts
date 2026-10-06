/**
 * `VertexViewIR.visible` (P-2026-10-03-1304, Q7, docs/discovery/discovery_2026-10-03_derived_notations_edges.md §3.7,
 * docs/lir/lir_2026-10-03_vertex_visible.md): a vertex view that resolves `visible` false is not drawn. The node is
 * hidden by the containment pass (computeViewHidden, then decorateNodes), the object stays in the model.
 *
 * - The key compiles only when declared, so a view without it compiles to the key list it had; it moves the irHash.
 * - The validator takes a boolean or a Conditional and refuses anything else.
 * - computeViewHidden: every object whose resolved view says false, whether or not a transition refers to it (the
 *   view hides the class); nothing when no view of the index declares the key.
 */
import { describe, expect, it } from 'vitest';
import { clearCompileCache, compileView, irHash } from '../irCompile';
import { validateIR } from '../irValidate';
import { buildContainmentModel, computeViewHidden, decorateNodes } from '../irContainment';
import { getIRIndex } from '../irResolveCore';
import { makeDrawReadCtx } from '../irReadCtx';
import type { VertexViewIR } from '../irTypes';

const box = (metaclass: string, over: Partial<VertexViewIR> = {}): VertexViewIR => ({
    irVersion: 'ir-1.2', kind: 'vertex', metaclasses: [metaclass],
    shape: { form: 'rounded', labels: [{ position: 'center', source: { from: 'intrinsic', prop: 'name' } }] },
    ...over,
});

describe('VertexViewIR.visible: compile and validation', () => {
    it('absent: no key in the compile, as before; declared: a conditional that reads false, or the rule\'s value', () => {
        clearCompileCache();
        expect('visible' in compileView('vv_none', box('State'))).toBe(false);
        const off = compileView('vv_off', box('Event', { visible: false }));
        expect(off.visible?.(makeDrawReadCtx({}), 'x')).toBe(false);
        const on = compileView('vv_on', box('Event', { visible: true }));
        expect(on.visible?.(makeDrawReadCtx({}), 'x')).toBe(true);
    });

    it('moves the irHash, so the compile cache keeps the two apart', () => {
        expect(irHash(box('Event', { visible: false }))).not.toBe(irHash(box('Event')));
    });

    it('the validator takes a boolean or a Conditional, and refuses anything else', () => {
        for (const v of [true, false, undefined, { when: { op: 'exists', path: '$name.value' }, then: true, else: false }]) {
            expect(validateIR('vv_ok', box('Event', v === undefined ? {} : { visible: v as never })), JSON.stringify(v)).toEqual({ ok: true });
        }
        for (const v of ['no', 0, null, ['x']]) {
            const r = validateIR('vv_bad', box('Event', { visible: v as never }));
            expect(r.ok, JSON.stringify(v)).toBe(false);
            expect(!r.ok && r.error).toContain('visible');
        }
    });
});

describe('computeViewHidden: the objects a view says are not drawn', () => {
    /** DemoPEST in small: two states, a transition firing on `coin`, and `kick`, an Event no transition refers to. */
    function scene(eventView: VertexViewIR) {
        const idlookup: Record<string, any> = {
            C_State: { id: 'C_State', name: 'State', extends: [] },
            C_Event: { id: 'C_Event', name: 'Event', extends: [] },
            s1: { id: 's1', name: 'locked', instanceof: 'C_State', features: [] },
            s2: { id: 's2', name: 'unlocked', instanceof: 'C_State', features: [] },
            coin: { id: 'coin', name: 'coin', instanceof: 'C_Event', features: [] },
            kick: { id: 'kick', name: 'kick', instanceof: 'C_Event', features: [] },
        };
        const state = {
            viewpoint: 'VP', viewelements: ['V_state', 'V_event'],
            idlookup: { ...idlookup, V_state: { id: 'V_state', viewpoint: 'VP', ir: box('State') }, V_event: { id: 'V_event', viewpoint: 'VP', ir: eventView } },
        };
        const nodes: any[] = [['V1', 's1'], ['V2', 's2'], ['VC', 'coin'], ['VK', 'kick']].map(([id, obj], i) => ({
            id, type: 'objectNode', position: { x: 200 * i, y: 0 }, measured: { width: 120, height: 42 }, data: { objectId: obj },
        }));
        const objByVertex = new Map<string, string>([['V1', 's1'], ['V2', 's2'], ['VC', 'coin'], ['VK', 'kick']]);
        return { state, nodes, objByVertex };
    }

    it('every Event, the one a transition fires on and the one none refers to; no State', () => {
        clearCompileCache();
        const { state, nodes, objByVertex } = scene(box('Event', { visible: false }));
        const index = getIRIndex(state, 'vv_scene_off')!;
        const readCtx = makeDrawReadCtx(state.idlookup);
        const hidden = computeViewHidden(nodes, objByVertex, index, readCtx, state.idlookup);
        expect([...hidden].sort()).toEqual(['coin', 'kick']);
        // Through the existing pass: the two Event nodes hidden, never removed.
        const model = buildContainmentModel(nodes, state.idlookup, index, readCtx);
        const out = decorateNodes(nodes, { ...model, objByVertex }, hidden);
        expect(out.map(n => [n.id, !!n.hidden])).toEqual([['V1', false], ['V2', false], ['VC', true], ['VK', true]]);
    });

    it('a Conditional decides per object', () => {
        clearCompileCache();
        const { state, nodes, objByVertex } = scene(box('Event', { visible: { when: { op: 'eq', left: '$name.value', right: { kind: 'string', value: 'kick' } }, then: true, else: false } as never }));
        const index = getIRIndex(state, 'vv_scene_cond')!;
        const hidden = computeViewHidden(nodes, objByVertex, index, makeDrawReadCtx(state.idlookup), state.idlookup);
        expect(hidden.has('coin')).toBe(true);
    });

    it('no view declares the key: nothing hidden', () => {
        clearCompileCache();
        const { state, nodes, objByVertex } = scene(box('Event'));
        const index = getIRIndex(state, 'vv_scene_none')!;
        expect(computeViewHidden(nodes, objByVertex, index, makeDrawReadCtx(state.idlookup), state.idlookup).size).toBe(0);
    });
});
