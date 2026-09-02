/**
 * Unit tests for the pure half of the instance manager (Slice 2a).
 *
 * Pure: every function takes a plain `idlookup` dictionary, so no store, no React,
 * no framework barrel. The fixture is a two-model project on one metamodel, which
 * is the case the naive filter gets wrong — `DClass.instances` is flat across
 * models, so an instance list that does not walk the father chain shows the other
 * model's objects too.
 *
 * The domain is Families (Family, Member) because the composition Family.members
 * gives a CONTAINED instance, the case `model.objects` cannot see.
 */
import { describe, it, expect } from 'vitest';
import {
    MANAGER_TAB_PREFIX,
    instanceCountsByClass,
    instancesOfClass,
    managerTabId,
    modelIdOfManagerTab,
    modelIdOfObject,
    uninstantiableReason,
} from '../instanceManagerModel';

// --- fixture ----------------------------------------------------------------

/**
 * m1a: Family "Doe" (root) containing Member "Jane" through the `members` slot.
 *      Member "Loose" sits directly on the model (root, uncontained).
 * m1b: a second model on the same metamodel, with its own Family "Roe".
 *
 * `name` is carried BOTH as `DObject.name` and, for Jane, as a `name` slot whose
 * value disagrees — that is the XMI-import shape, and it pins which of the two
 * `makeDrawReadCtx` prefers.
 */
const idlookup: Record<string, any> = {
    m1a: { id: 'm1a', className: 'DModel', name: 'Model A' },
    m1b: { id: 'm1b', className: 'DModel', name: 'Model B' },

    cFamily: { id: 'cFamily', className: 'DClass', name: 'Family' },
    cMember: { id: 'cMember', className: 'DClass', name: 'Member' },
    fMembers: { id: 'fMembers', className: 'DReference', name: 'members' },
    fName: { id: 'fName', className: 'DAttribute', name: 'name' },

    oDoe: { id: 'oDoe', className: 'DObject', name: 'Doe', instanceof: 'cFamily', father: 'm1a', features: ['vDoeMembers'] },
    vDoeMembers: { id: 'vDoeMembers', className: 'DValue', instanceof: 'fMembers', father: 'oDoe', values: ['oJane'] },
    oJane: { id: 'oJane', className: 'DObject', name: 'stale', instanceof: 'cMember', father: 'vDoeMembers', features: ['vJaneName'] },
    vJaneName: { id: 'vJaneName', className: 'DValue', instanceof: 'fName', father: 'oJane', values: ['Jane'] },
    oLoose: { id: 'oLoose', className: 'DObject', name: 'Loose', instanceof: 'cMember', father: 'm1a', features: [] },

    oRoe: { id: 'oRoe', className: 'DObject', name: 'Roe', instanceof: 'cFamily', father: 'm1b', features: [] },
};

// --- tab id -----------------------------------------------------------------

describe('manager tab id', () => {
    it('prefixes, so it cannot collide with the canvas tab of the same model', () => {
        expect(managerTabId('m1a')).toBe('mgr_m1a');
        expect(managerTabId('m1a')).not.toBe('m1a');
        expect(MANAGER_TAB_PREFIX).toBe('mgr_');
    });

    it('round-trips back to the model id', () => {
        expect(modelIdOfManagerTab(managerTabId('m1a'))).toBe('m1a');
    });

    it('does not claim tab ids belonging to other kinds', () => {
        expect(modelIdOfManagerTab('m1a')).toBeNull();
        expect(modelIdOfManagerTab('doc_m1a')).toBeNull();
        expect(modelIdOfManagerTab('project_summary')).toBeNull();
        expect(modelIdOfManagerTab('mgr_')).toBeNull();
        expect(modelIdOfManagerTab('')).toBeNull();
    });
});

// --- model membership -------------------------------------------------------

describe('modelIdOfObject', () => {
    it('resolves a root object in one hop', () => {
        expect(modelIdOfObject(idlookup, 'oDoe')).toBe('m1a');
    });

    it('resolves a CONTAINED object by walking through its containing slot', () => {
        expect(modelIdOfObject(idlookup, 'oJane')).toBe('m1a');
    });

    it('returns null for an unknown id and for a broken father chain', () => {
        expect(modelIdOfObject(idlookup, 'nope')).toBeNull();
        expect(modelIdOfObject({ orphan: { id: 'orphan', className: 'DObject', father: 'gone' } }, 'orphan')).toBeNull();
    });

    it('does not loop on a father cycle', () => {
        const cyclic = {
            a: { id: 'a', className: 'DObject', father: 'b' },
            b: { id: 'b', className: 'DValue', father: 'a' },
        };
        expect(modelIdOfObject(cyclic, 'a')).toBeNull();
    });
});

// --- the instance filter ----------------------------------------------------

describe('instancesOfClass', () => {
    it('finds contained instances, which model.objects would miss', () => {
        const rows = instancesOfClass(idlookup, 'm1a', 'cMember');
        expect(rows.map(r => r.id)).toEqual(['oJane', 'oLoose']);
        expect(rows.find(r => r.id === 'oJane')?.isContained).toBe(true);
        expect(rows.find(r => r.id === 'oLoose')?.isContained).toBe(false);
    });

    it('does not leak instances of the same metaclass from another model', () => {
        expect(instancesOfClass(idlookup, 'm1a', 'cFamily').map(r => r.id)).toEqual(['oDoe']);
        expect(instancesOfClass(idlookup, 'm1b', 'cFamily').map(r => r.id)).toEqual(['oRoe']);
    });

    it('matches the metaclass EXACTLY, without conformance', () => {
        // Member does not extend Family; asking for Family must not return Members
        // even though both live in m1a.
        expect(instancesOfClass(idlookup, 'm1a', 'cFamily').map(r => r.metaclassName)).toEqual(['Family']);
    });

    it('takes the name from the `name` slot when it disagrees with DObject.name', () => {
        const jane = instancesOfClass(idlookup, 'm1a', 'cMember').find(r => r.id === 'oJane');
        expect(jane?.name).toBe('Jane');   // not 'stale'
    });

    it('sorts by name, then by id for homonyms', () => {
        const twins = {
            ...idlookup,
            oZ2: { id: 'oZ2', className: 'DObject', name: 'Same', instanceof: 'cMember', father: 'm1a', features: [] },
            oZ1: { id: 'oZ1', className: 'DObject', name: 'Same', instanceof: 'cMember', father: 'm1a', features: [] },
        };
        const rows = instancesOfClass(twins, 'm1a', 'cMember');
        expect(rows.map(r => r.name)).toEqual(['Jane', 'Loose', 'Same', 'Same']);
        expect(rows.slice(2).map(r => r.id)).toEqual(['oZ1', 'oZ2']);
    });

    it('returns [] rather than throwing on missing arguments', () => {
        expect(instancesOfClass(idlookup, '', 'cMember')).toEqual([]);
        expect(instancesOfClass(idlookup, 'm1a', '')).toEqual([]);
        expect(instancesOfClass(undefined as any, 'm1a', 'cMember')).toEqual([]);
    });
});

describe('instanceCountsByClass', () => {
    it('counts per class, scoped to the model', () => {
        expect(instanceCountsByClass(idlookup, 'm1a')).toEqual({ cFamily: 1, cMember: 2 });
        expect(instanceCountsByClass(idlookup, 'm1b')).toEqual({ cFamily: 1 });
    });

    it('agrees with instancesOfClass, class by class', () => {
        const counts = instanceCountsByClass(idlookup, 'm1a');
        for (const cid of ['cFamily', 'cMember']) {
            expect(instancesOfClass(idlookup, 'm1a', cid).length).toBe(counts[cid]);
        }
    });

    it('omits a class with no instances instead of writing a zero', () => {
        expect(instanceCountsByClass(idlookup, 'm1b')).not.toHaveProperty('cMember');
    });
});

describe('uninstantiableReason', () => {
    it('names the cause for an abstract metaclass and stays silent otherwise', () => {
        expect(uninstantiableReason({ isAbstract: true })).toMatch(/Abstract/);
        expect(uninstantiableReason({ isAbstract: false })).toBeNull();
        expect(uninstantiableReason({})).toBeNull();
    });
});
