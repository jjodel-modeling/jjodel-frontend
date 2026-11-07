/**
 * The target level of a Refactoring (R-JJD-14) on the `DProject.scripts` entry: the optional `level` and
 * `metamodelId`, read with defaults (R-JJD-5, no migration), filled by `openScriptAsFile` from the model the script
 * was planned on, and the compatibility filter of the tab's `Run on`.
 *
 * `scriptFiles.ts` runs against a mocked store: the joiner barrel does not import in the bench.
 * Each test names the mutation that kills it.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { DProjectScript } from '../../../joiner/classes';
import { addScript, compatibleModels, readTarget, targetLabel, targetOfModel, type TargetCandidate } from '../projectScripts';

const PID = 'Pointer_Project';
const written: any[] = [];
let state: any;

vi.mock('../../../joiner', () => ({
    U: { getProjectID_URL: () => PID },
    store: { getState: () => state },
    SetFieldAction: {
        new: (id: string, field: string, value: any) => {
            written.push({ id, field, value });
            state = { ...state, idlookup: { ...state.idlookup, [id]: { ...state.idlookup[id], [field]: value } } };
        },
    },
    LModel: { fromPointer: () => undefined },
}));
vi.mock('../../abstract/DockManager', () => ({
    default: { openScript: vi.fn(() => true), closeTab: vi.fn(), open2: vi.fn() },
}));

const { openScriptAsFile, createProjectRefactoring, projectTargetCandidates } = await import('../scriptFiles');

function project(scripts?: DProjectScript[]) {
    state = {
        idlookup: {
            [PID]: { id: PID, metamodels: ['MM_A', 'MM_B'], models: ['M_a1', 'M_b1', 'M_a2'], ...(scripts ? { scripts } : {}) },
            MM_A: { id: 'MM_A', name: 'Families', isMetamodel: true },
            MM_B: { id: 'MM_B', name: 'Persons', isMetamodel: true },
            M_a1: { id: 'M_a1', name: 'smiths', isMetamodel: false, instanceof: 'MM_A' },
            M_b1: { id: 'M_b1', name: 'people', isMetamodel: false, instanceof: 'MM_B' },
            M_a2: { id: 'M_a2', name: 'joneses', isMetamodel: false, instanceof: 'MM_A' },
        },
    };
}

const CANDIDATES: TargetCandidate[] = [
    { id: 'MM_A', name: 'Families', isMetamodel: true },
    { id: 'MM_B', name: 'Persons', isMetamodel: true },
    { id: 'M_a1', name: 'smiths', isMetamodel: false, metamodelId: 'MM_A' },
    { id: 'M_b1', name: 'people', isMetamodel: false, metamodelId: 'MM_B' },
    { id: 'M_a2', name: 'joneses', isMetamodel: false, metamodelId: 'MM_A' },
];
const ids = (xs: { id: string }[]) => xs.map(x => x.id);

beforeEach(() => { written.length = 0; project(); });

describe('readTarget: the optional fields read with defaults', () => {
    it('an entry without the field is any level (dies if a missing level defaults to M1 or M2)', () => {
        expect(readTarget({})).toEqual({ level: undefined });
        expect(readTarget(undefined)).toEqual({ level: undefined });
    });
    it('keeps M2 and drops a stray metamodelId on it (dies if metamodelId is read for M2)', () => {
        expect(readTarget({ level: 'M2', metamodelId: 'MM_A' })).toEqual({ level: 'M2' });
    });
    it('keeps the metamodel of an M1 target (dies if metamodelId is dropped)', () => {
        expect(readTarget({ level: 'M1', metamodelId: 'MM_A' })).toEqual({ level: 'M1', metamodelId: 'MM_A' });
    });
    it('reads an unknown level as any level (dies if the value is passed through unchecked)', () => {
        expect(readTarget({ level: 'M3' as any })).toEqual({ level: undefined });
    });
});

describe('addScript records the target only when given', () => {
    it('an entry made without a level has no level key (dies if level is written as undefined)', () => {
        const { entry } = addScript([], { name: 'a', text: '' }, 1, 'S1');
        expect('level' in entry).toBe(false);
        expect('metamodelId' in entry).toBe(false);
    });
    it('M1 keeps the metamodel, M2 does not (dies if metamodelId is written for any level)', () => {
        expect(addScript([], { text: '', level: 'M1', metamodelId: 'MM_A' }, 1, 'S1').entry)
            .toMatchObject({ level: 'M1', metamodelId: 'MM_A' });
        expect('metamodelId' in addScript([], { text: '', level: 'M2', metamodelId: 'MM_A' }, 1, 'S1').entry).toBe(false);
    });
});

describe('compatibleModels: what Run on lists', () => {
    it('M2 lists only metamodels (dies if the M2 branch is dropped)', () => {
        expect(ids(compatibleModels(CANDIDATES, { level: 'M2' }))).toEqual(['MM_A', 'MM_B']);
    });
    it('M1 of a metamodel lists only its models, in project order (dies if the metamodel check is dropped)', () => {
        expect(ids(compatibleModels(CANDIDATES, { level: 'M1', metamodelId: 'MM_A' }))).toEqual(['M_a1', 'M_a2']);
    });
    it('M1 without a metamodel lists every model (dies if a missing metamodelId matches nothing)', () => {
        expect(ids(compatibleModels(CANDIDATES, { level: 'M1' }))).toEqual(['M_a1', 'M_b1', 'M_a2']);
    });
    it('any level lists the models first, then the metamodels (dies if the order is the input order)', () => {
        expect(ids(compatibleModels(CANDIDATES, {}))).toEqual(['M_a1', 'M_b1', 'M_a2', 'MM_A', 'MM_B']);
    });
});

describe('targetOfModel and targetLabel', () => {
    it('a metamodel gives M2, a model the M1 of its metamodel (dies if isMetamodel is ignored)', () => {
        expect(targetOfModel({ isMetamodel: true })).toEqual({ level: 'M2' });
        expect(targetOfModel({ isMetamodel: false, metamodelId: 'MM_A' })).toEqual({ level: 'M1', metamodelId: 'MM_A' });
        expect(targetOfModel(undefined)).toEqual({});
    });
    it('labels the three cases (dies if the metamodel name is not used)', () => {
        expect(targetLabel({ level: 'M2' })).toBe('Metamodel');
        expect(targetLabel({ level: 'M1', metamodelId: 'MM_A' }, 'Families')).toBe('Model of Families');
        expect(targetLabel({})).toBe('Any level');
    });
});

describe('scriptFiles against the store', () => {
    it('projectTargetCandidates reads level and metamodel of every model (dies if instanceof is not read)', () => {
        expect(projectTargetCandidates()).toEqual(CANDIDATES);
    });
    it('projectTargetCandidates reads DProject.metamodels once even when models lists them too (dies if metamodels is not read, or ids are not deduplicated)', () => {
        state.idlookup[PID] = { ...state.idlookup[PID], models: ['MM_A', 'M_a1', 'M_b1', 'M_a2'] };
        expect(ids(projectTargetCandidates())).toEqual(['MM_A', 'MM_B', 'M_a1', 'M_b1', 'M_a2']);
    });
    it('openScriptAsFile planned on a model fills M1 and its metamodel (dies if the target is not computed)', () => {
        const entry = openScriptAsFile('create X', 'plan', 'M_b1');
        expect(entry).toMatchObject({ name: 'plan.jjs', modelId: 'M_b1', level: 'M1', metamodelId: 'MM_B' });
        expect(written.at(-1)).toMatchObject({ id: PID, field: 'scripts' });
        expect(written.at(-1).value[0]).toMatchObject({ level: 'M1', metamodelId: 'MM_B' });
    });
    it('openScriptAsFile planned on a metamodel fills M2 (dies if a metamodel reads as M1)', () => {
        expect(openScriptAsFile('create X', 'plan', 'MM_A')).toMatchObject({ level: 'M2' });
    });
    it('openScriptAsFile with no model leaves the entry at any level (dies if a default level is written)', () => {
        const entry = openScriptAsFile('', 'plan');
        expect(entry && 'level' in entry).toBe(false);
    });
    it('createProjectRefactoring writes an empty entry with the target and keeps older entries (dies if the list is replaced)', () => {
        const old: DProjectScript = { id: 'S_old', name: 'old.jjs', text: 'x', updatedAt: 1 };
        project([old]);
        const entry = createProjectRefactoring({ level: 'M1', metamodelId: 'MM_A' });
        expect(entry).toMatchObject({ name: 'refactoring.jjs', text: '', level: 'M1', metamodelId: 'MM_A' });
        const list = written.at(-1).value as DProjectScript[];
        expect(list.map(s => s.id)).toEqual(['S_old', entry!.id]);
        expect(readTarget(list[0])).toEqual({ level: undefined });
    });
});
