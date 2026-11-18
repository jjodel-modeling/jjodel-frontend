import { describe, expect, it } from 'vitest';
import { snapshotFailed, snapshotLine, snapshotOff, snapshotStep } from '../simSnapshotButton';

const written = { ok: true, name: 'drone (snapshot step 24)', problems: [] as string[] };
const unwritten = (n: number) => Array.from({ length: n }, () => ({})) as any;

describe('snapshotOff', () => {
    it('is on when the run is still and nothing is being written', () => {
        expect(snapshotOff(false, false)).toBeNull();
    });
    it('is off while Playing, and says to pause', () => {
        expect(snapshotOff(true, false)).toMatch(/pause the run/);
    });
    it('is off while a snapshot is in flight, and that reason comes first', () => {
        expect(snapshotOff(false, true)).toMatch(/being written/);
        expect(snapshotOff(true, true)).toMatch(/being written/);
    });
});

describe('snapshotStep', () => {
    it('is the end of the trace while the slider was not moved', () => {
        expect(snapshotStep(null, 24)).toBe(24);
    });
    it('is the slider step when it was moved, step 0 included', () => {
        expect(snapshotStep(7, 24)).toBe(7);
        expect(snapshotStep(0, 24)).toBe(0);
    });
});

describe('snapshotLine', () => {
    it('names the model when every value was written', () => {
        expect(snapshotLine({ ...written, unwritten: [] })).toEqual({ text: 'Saved as «drone (snapshot step 24)»', error: false });
    });
    it('counts the values not written', () => {
        expect(snapshotLine({ ...written, unwritten: unwritten(3) }).text).toBe('Saved as «drone (snapshot step 24)» · 3 values not written');
        expect(snapshotLine({ ...written, unwritten: unwritten(1) }).text).toBe('Saved as «drone (snapshot step 24)» · 1 value not written');
    });
    it('reports the first problem of a refused write as an error', () => {
        expect(snapshotLine({ ok: false, name: null, unwritten: [], problems: ['no DCN run of this model', 'other'] }))
            .toEqual({ text: 'Snapshot not saved: no DCN run of this model', error: true });
    });
});

describe('snapshotFailed', () => {
    it('has a line without a reason', () => {
        expect(snapshotFailed(undefined)).toBe('Snapshot not saved');
    });
});
