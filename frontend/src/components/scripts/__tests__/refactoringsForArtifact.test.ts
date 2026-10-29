/**
 * The Refactorings listed by the menu of a metamodel or model tab (R-JJD-14): M2 entries on a metamodel,
 * M1 entries of the same metamodel on a model, entries without a target on both, in project order.
 *
 * `scriptFiles.ts` runs against a mocked store: the joiner barrel does not import in the bench.
 * Each test names the mutation that kills it.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { DProjectScript } from '../../../joiner/classes';
import { refactoringsForArtifact, type TargetCandidate } from '../projectScripts';
import { projectRefactoringsFor } from '../scriptFiles';

const PID = 'Pointer_Project';
let state: any;

vi.mock('../../../joiner', () => ({
    U: { getProjectID_URL: () => PID },
    store: { getState: () => state },
    SetFieldAction: { new: vi.fn() },
    LModel: { fromPointer: () => undefined },
}));
vi.mock('../../abstract/DockManager', () => ({
    default: { openScript: vi.fn(() => true), closeTab: vi.fn(), open2: vi.fn() },
}));

function entry(id: string, target: Partial<Pick<DProjectScript, 'level' | 'metamodelId'>> = {}): DProjectScript {
    return { id, name: id, text: `-- ${id}`, updatedAt: 0, ...target };
}

const MM: TargetCandidate = { id: 'MM', name: 'Families', isMetamodel: true };
const M_FAM: TargetCandidate = { id: 'M1', name: 'smiths', isMetamodel: false, metamodelId: 'MM' };
const M_OTHER: TargetCandidate = { id: 'M2', name: 'nets', isMetamodel: false, metamodelId: 'MM_OTHER' };
const M_ORPHAN: TargetCandidate = { id: 'M3', name: 'loose', isMetamodel: false };

const SCRIPTS = [
    entry('anyLevel'),
    entry('onMetamodel', { level: 'M2' }),
    entry('onFamilies', { level: 'M1', metamodelId: 'MM' }),
    entry('onAnyModel', { level: 'M1' }),
    entry('onOther', { level: 'M1', metamodelId: 'MM_OTHER' }),
];
const ids = (list: DProjectScript[]) => list.map(s => s.id);

describe('refactoringsForArtifact', () => {
    it('lists M2 and untargeted entries on a metamodel, no M1 entry (kills: M1 entries kept on a metamodel)', () => {
        expect(ids(refactoringsForArtifact(SCRIPTS, MM))).toEqual(['anyLevel', 'onMetamodel']);
    });

    it('lists M1 entries of the model\'s metamodel and untargeted ones on a model (kills: metamodelId ignored)', () => {
        expect(ids(refactoringsForArtifact(SCRIPTS, M_FAM))).toEqual(['anyLevel', 'onFamilies', 'onAnyModel']);
    });

    it('lists no M2 entry on a model (kills: M2 entries kept on a model)', () => {
        expect(ids(refactoringsForArtifact(SCRIPTS, M_OTHER))).toEqual(['anyLevel', 'onAnyModel', 'onOther']);
    });

    it('keeps a model of another metamodel off an M1 entry with a metamodel (kills: wrong-metamodel match)', () => {
        const only = [entry('onFamilies', { level: 'M1', metamodelId: 'MM' })];
        expect(refactoringsForArtifact(only, M_OTHER)).toEqual([]);
    });

    it('lists only metamodel-free M1 entries on a model without a metamodel (kills: undefined === undefined match)', () => {
        expect(ids(refactoringsForArtifact(SCRIPTS, M_ORPHAN))).toEqual(['anyLevel', 'onAnyModel']);
    });

    it('reads an unknown level as any level (declared intent: bypassing readTarget is equivalent, compatibleModels reads it the same)', () => {
        const odd = [{ ...entry('odd'), level: 'M3' as any }];
        expect(ids(refactoringsForArtifact(odd, MM))).toEqual(['odd']);
        expect(ids(refactoringsForArtifact(odd, M_FAM))).toEqual(['odd']);
    });

    it('returns the entries themselves, in project order (kills: re-sorted or copied entries)', () => {
        const out = refactoringsForArtifact(SCRIPTS, M_FAM);
        expect(out[0]).toBe(SCRIPTS[0]);
        expect(out.map(s => SCRIPTS.indexOf(s))).toEqual([0, 2, 3]);
    });
});

describe('projectRefactoringsFor', () => {
    beforeEach(() => {
        state = {
            idlookup: {
                [PID]: { id: PID, metamodels: ['MM'], models: ['M1', 'M2'], scripts: SCRIPTS },
                MM: { id: 'MM', name: 'Families', isMetamodel: true },
                M1: { id: 'M1', name: 'smiths', isMetamodel: false, instanceof: 'MM' },
                M2: { id: 'M2', name: 'nets', isMetamodel: false, instanceof: 'MM_OTHER' },
            },
        };
    });

    it('reads the artifact from the project and its metamodel from instanceof (kills: instanceof not read)', () => {
        expect(ids(projectRefactoringsFor('MM'))).toEqual(['anyLevel', 'onMetamodel']);
        expect(ids(projectRefactoringsFor('M1'))).toEqual(['anyLevel', 'onFamilies', 'onAnyModel']);
        expect(ids(projectRefactoringsFor('M2'))).toEqual(['anyLevel', 'onAnyModel', 'onOther']);
    });

    it('lists nothing for an artifact outside the project (kills: unknown artifact read as any level)', () => {
        expect(projectRefactoringsFor('NOPE')).toEqual([]);
    });

    it('lists nothing when the project has no scripts field (kills: missing field not defaulted)', () => {
        delete state.idlookup[PID].scripts;
        expect(projectRefactoringsFor('M1')).toEqual([]);
    });
});
