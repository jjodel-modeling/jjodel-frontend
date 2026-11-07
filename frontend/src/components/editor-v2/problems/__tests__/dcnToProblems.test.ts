/**
 * The DCN well-formedness checks in the problems registry (P-2026-11-07-1825; spec §5).
 *
 * The subject is `reconcileDcnProblems`, the body of the producer's effect, on a raw lookup shaped as the store
 * keeps it: a mini DCN metamodel MM (DClass with `extends`, features with `father` their class, the dcn role keys
 * and the R-OI binding in its bag) and a class-level model M of it, the drone reduced to `power` and `battery`.
 * The rules themselves are tested in `model/dcn/__tests__/dcnWellFormedness.test.ts`; here, what reaches the
 * registry. The registry is module state: `vi.resetModules()` before every test, fake timers for the 5 s resolved
 * TTL. Each test name says which break of the mapping kills it.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { encodeRoleValues } from '../../../../model/simulation/roleCatalog';
import { encodeProfile } from '../../../../model/simulation/profileCodec';
import { systemProfile } from '../../../../model/simulation/simProfiles';

type Lookup = Record<string, any>;

let SUT: typeof import('../dcnToProblems');
let REG: typeof import('../registry');

beforeEach(async () => {
    vi.resetModules();
    REG = await import('../registry');
    SUT = await import('../dcnToProblems');
    vi.useFakeTimers();
});
afterEach(() => { vi.useRealTimers(); });

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** The M2 classes, under the package PKG of MM, with their `extends`. */
const CLASSES: Record<string, { name: string; extends?: string[] }> = {
    C_Named: { name: 'NamedElement' },
    C_Class: { name: 'Class', extends: ['C_Named'] },
    C_Static: { name: 'StaticClass', extends: ['C_Class'] },
    C_Viewpoint: { name: 'Viewpoint', extends: ['C_Named'] },
    C_Dynamic: { name: 'DynamicClass', extends: ['C_Named'] },
    C_Property: { name: 'Property', extends: ['C_Named'] },
    C_Operation: { name: 'Operation', extends: ['C_Named'] },
    C_Monitor: { name: 'Monitor', extends: ['C_Named'] },
    C_Instance: { name: 'InstanceSpecification', extends: ['C_Named'] },
};

/** The M2 features, `father` the class that declares them. */
const FEATURES: Record<string, { className: 'DAttribute' | 'DReference'; name: string; father: string }> = {
    R_ownedAttributes: { className: 'DReference', name: 'ownedAttributes', father: 'C_Class' },
    R_ownedOperations: { className: 'DReference', name: 'ownedOperations', father: 'C_Class' },
    R_viewpoints: { className: 'DReference', name: 'viewpoints', father: 'C_Static' },
    R_classes: { className: 'DReference', name: 'classes', father: 'C_Viewpoint' },
    A_invariant: { className: 'DAttribute', name: 'invariant', father: 'C_Dynamic' },
    R_dynAttributes: { className: 'DReference', name: 'attributes', father: 'C_Dynamic' },
    R_dynOperations: { className: 'DReference', name: 'operations', father: 'C_Dynamic' },
    R_monitors: { className: 'DReference', name: 'monitors', father: 'C_Dynamic' },
    A_body: { className: 'DAttribute', name: 'body', father: 'C_Operation' },
    A_monBody: { className: 'DAttribute', name: 'body', father: 'C_Monitor' },
    R_type: { className: 'DReference', name: 'type', father: 'C_Property' },
    A_rangeMin: { className: 'DAttribute', name: 'rangeMin', father: 'C_Property' },
    A_rangeMax: { className: 'DAttribute', name: 'rangeMax', father: 'C_Property' },
    R_classifier: { className: 'DReference', name: 'classifier', father: 'C_Instance' },
};

/** The roles as the L2.3 dialog binds them: the «Dynamic classification» profile, or a run reads the dcn group off. */
const DCN_ROLES = {
    simProfile: encodeProfile(systemProfile('dynamicClassification')!),
    simStaticClass: 'C_Static',
    simViewpoints: 'R_viewpoints',
    simDynamicClasses: 'R_classes',
    simInvariant: 'A_invariant',
    simOperation: encodeRoleValues(['R_ownedOperations', 'R_dynOperations']),
    simBody: encodeRoleValues(['A_body', 'A_monBody']),
    simMonitor: 'R_monitors',
};

const BINDINGS = JSON.stringify({
    v: 1,
    bindings: [{
        name: 'object',
        typeReference: 'R_classifier',
        featureContainer: 'R_ownedAttributes',
        featureType: 'R_type',
        featureSources: [{ path: ['R_viewpoints', 'R_classes', 'R_dynAttributes'] }],
    }],
});

interface Obj { cls: string; name: string; slots?: Record<string, unknown[]> }

/** The drone: Mode/Flying with rampUp writing power, Link/Online with ping writing `pingWrites`. */
function droneObjects(pingWrites: string = 'power'): Record<string, Obj> {
    return {
        Drone: { cls: 'C_Static', name: 'Drone', slots: { R_ownedAttributes: ['p_power', 'p_battery'], R_viewpoints: ['Mode', 'Link'] } },
        p_power: { cls: 'C_Property', name: 'power', slots: { R_type: ['Integer'] } },
        p_battery: { cls: 'C_Property', name: 'battery', slots: { R_type: ['Integer'] } },
        Mode: { cls: 'C_Viewpoint', name: 'Mode', slots: { R_classes: ['Flying'] } },
        Flying: { cls: 'C_Dynamic', name: 'Flying', slots: { A_invariant: ['self.battery > 0'], R_dynOperations: ['op_rampUp'] } },
        op_rampUp: { cls: 'C_Operation', name: 'rampUp', slots: { A_body: ['self.power := self.battery'] } },
        Link: { cls: 'C_Viewpoint', name: 'Link', slots: { R_classes: ['Online'] } },
        Online: { cls: 'C_Dynamic', name: 'Online', slots: { A_invariant: ['true'], R_monitors: ['mon_ping'] } },
        mon_ping: { cls: 'C_Monitor', name: 'ping', slots: { A_monBody: [`self.${pingWrites} := 0`] } },
    };
}

/** MM with `bag`, its package and classes, the primitive Integer, and the model M of `objects` (father M). */
function buildLookup(bag: Record<string, unknown>, objects: Record<string, Obj>): Lookup {
    const lookup: Lookup = {};
    lookup.MM = { className: 'DModel', id: 'MM', name: 'DCN', _state: { ...bag } };
    lookup.PKG = { className: 'DPackage', id: 'PKG', name: 'dcn', father: 'MM' };
    lookup.Integer = { className: 'DClass', id: 'Integer', name: 'Integer', father: 'PKG', extends: [] };
    for (const [id, c] of Object.entries(CLASSES)) lookup[id] = { className: 'DClass', id, name: c.name, father: 'PKG', extends: [...(c.extends ?? [])] };
    for (const [id, f] of Object.entries(FEATURES)) lookup[id] = { ...f, id };
    lookup.M = { className: 'DModel', id: 'M', name: 'drone', instanceof: 'MM' };
    for (const [id, o] of Object.entries(objects)) {
        const feats: string[] = [];
        for (const [f, values] of Object.entries(o.slots ?? {})) {
            const vid = `v_${id}_${f}`;
            feats.push(vid);
            lookup[vid] = { className: 'DValue', id: vid, instanceof: f, values: [...values], father: id };
        }
        lookup[id] = { className: 'DObject', id, instanceof: o.cls, father: 'M', name: o.name, features: feats };
    }
    return lookup;
}

const drone = (pingWrites?: string) => buildLookup({ ...DCN_ROLES, ontoBindings: BINDINGS }, droneObjects(pingWrites));
const vertexOf = (id: string): string | null => (id === 'MM' || id === 'M' ? null : `V_${id}`);
const reconcile = (lookup: Lookup) => SUT.reconcileDcnProblems(lookup, 'M', vertexOf);
const on = (nodeId: string) => REG.getNodeProblemsSnapshot(nodeId).filter(p => p.kind === 'dcn');
const active = (nodeId: string) => on(nodeId).filter(p => p.resolvedAt === undefined);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('dcnToProblems: the drone with two viewpoints writing power', () => {
    it('two W6 diagnostics, each under the DObject and the vertex, kind dcn, owned by the model (mutants: the vertex anchor dropped, the owner not the model)', () => {
        expect(reconcile(drone())).toBe(4);
        for (const id of ['op_rampUp', 'V_op_rampUp', 'mon_ping', 'V_mon_ping']) {
            expect(active(id)).toHaveLength(1);
            expect(active(id)[0]).toMatchObject({ kind: 'dcn', severity: 'error', title: 'W6: write ownership', ownerModelId: 'M' });
        }
        expect(active('mon_ping')[0].id).toBe('dcn:mon_ping:W6:0');
        expect(active('mon_ping')[0].description).toBe(
            'ping writes power, which viewpoint Mode also writes (rampUp): two viewpoints never write the same property.');
        expect(active('mon_ping')[0].relatedNodeIds).toEqual(['V_op_rampUp']);
        expect(REG.getProblemIdsOwnedBy('dcn', 'M')).toHaveLength(4);
    });

    it('the conflict removed: the entries are marked resolved, then the TTL removes them (mutant: the revoke pass dropped)', () => {
        reconcile(drone());
        expect(reconcile(drone('battery'))).toBe(0);
        expect(on('V_mon_ping')).toHaveLength(1);
        expect(on('V_mon_ping')[0].resolvedAt).toBeDefined();
        vi.advanceTimersByTime(5000);
        expect(on('V_mon_ping')).toHaveLength(0);
        expect(on('op_rampUp')).toHaveLength(0);
    });

    it('a range bound found by name in the metamodel: Property.rangeMin above Property.rangeMax (mutant: features not looked up by Class.feature)', () => {
        const lookup = drone('battery');
        lookup.v_p_battery_A_rangeMin = { className: 'DValue', id: 'v_p_battery_A_rangeMin', instanceof: 'A_rangeMin', values: [100], father: 'p_battery' };
        lookup.v_p_battery_A_rangeMax = { className: 'DValue', id: 'v_p_battery_A_rangeMax', instanceof: 'A_rangeMax', values: [0], father: 'p_battery' };
        lookup.p_battery.features.push('v_p_battery_A_rangeMin', 'v_p_battery_A_rangeMax');
        expect(reconcile(lookup)).toBe(2);
        expect(active('p_battery')[0].description).toBe('Drone.battery has rangeMin 100 above rangeMax 0.');
    });
});

describe('dcnToProblems: inert without the dcn roles, and by owner and kind', () => {
    it('a metamodel with no dcn role: the signature is empty and nothing is registered (mutant: the closure check dropped)', () => {
        const lookup = buildLookup({ ontoBindings: BINDINGS }, droneObjects());
        expect(SUT.dcnSignature(lookup, 'M')).toBe('');
        expect(reconcile(lookup)).toBe(0);
        expect(SUT.dcnSignature(drone(), 'M')).not.toBe('');
    });

    it('the roles with no binding whose feature container the static class conforms to: nothing is checked (mutant: the binding fit ignored)', () => {
        const unfit = JSON.stringify({ v: 1, bindings: [{ name: 'object', typeReference: 'R_classifier', featureContainer: 'R_classes' }] });
        expect(reconcile(buildLookup({ ...DCN_ROLES, ontoBindings: unfit }, droneObjects()))).toBe(0);
    });

    it('the signature follows a body edit and a binding edit (mutants: model slots or bindings out of the signature)', () => {
        const before = SUT.dcnSignature(drone(), 'M');
        expect(SUT.dcnSignature(drone('battery'), 'M')).not.toBe(before);
        const rebound = drone();
        rebound.MM._state.ontoBindings = BINDINGS.replace('"object"', '"thing"');
        expect(SUT.dcnSignature(rebound, 'M')).not.toBe(before);
    });

    it('another model\'s dcn entry and this model\'s conformance entry are untouched (mutants: revoke by kind only, by owner only)', () => {
        const foreign = (id: string, nodeId: string, kind: 'dcn' | 'conformance', owner: string) => REG.registerProblem({
            id, nodeId, kind, severity: 'error', title: 't', description: 'd', relatedNodeIds: [], ownerModelId: owner, createdAt: 0,
        });
        foreign('dcn:X:W6:0', 'X', 'dcn', 'OTHER');
        foreign('conformance:mon_ping', 'mon_ping', 'conformance', 'M');
        reconcile(drone());
        reconcile(drone('battery'));
        expect(REG.getNodeProblemsSnapshot('X')[0].resolvedAt).toBeUndefined();
        expect(REG.getNodeProblemsSnapshot('mon_ping').filter(p => p.kind === 'conformance')[0].resolvedAt).toBeUndefined();
        SUT.clearDcnProblems('M');
        expect(REG.getNodeProblemsSnapshot('X')).toHaveLength(1);
        expect(REG.getNodeProblemsSnapshot('mon_ping').map(p => p.kind)).toEqual(['conformance']);
    });
});
