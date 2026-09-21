/**
 * The Form theme select lives in the Data Manager panel only (2026-09-15).
 *
 * This file used to pin the UX1 hint «Applies when this viewpoint is active.» under the
 * Form theme select of `ViewpointProperties`. That select was removed: it wrote `formTheme`
 * on the selected viewpoint, and the only reader, rung 0 of the cascade in `IRForm`, reads
 * the Data Manager singleton for `host="manager"`, the one host `IRForm` is mounted with.
 * The theme belongs to the Data Manager viewpoint, whose own panel carries it.
 *
 * SOURCE-TEXT assertions, and no mutation bench behind them (CLAUDE.md §5): the subject is
 * the presence of a control in a file, not a behavior. Why the source and not a mount:
 * importing `ViewpointProperties` under vitest dies at collection with
 * `ReferenceError: window is not defined` (the `joiner` barrel reaches monaco), and the
 * environment is `node`.
 *
 * Each block opens with a POSITIVE control: a string that is not found and a read that did
 * not happen give the same silence (CLAUDE.md §5).
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const VP_PATH = resolve(__dirname, '../ViewpointProperties.tsx');
const DM_PATH = resolve(__dirname, '../DataManagerViewpointPanel.tsx');

const VP = readFileSync(VP_PATH, 'utf8');
const DM = readFileSync(DM_PATH, 'utf8');

describe('ViewpointProperties no longer carries a Form theme field', () => {
    it('positive control: the file is read and is the component', () => {
        expect(VP.length).toBeGreaterThan(1000);
        expect(VP).toContain('const ViewpointProperties');
        expect(VP).toContain('>Type<');
    });

    it('contains neither the field label nor the write', () => {
        expect(VP).not.toContain('>Form theme<');
        expect(VP).not.toContain('(viewpoint as any).formTheme =');
    });
});

describe('DataManagerViewpointPanel keeps its own Form theme and palette selects', () => {
    it('positive control: the file is read and is the panel', () => {
        expect(DM.length).toBeGreaterThan(1000);
        expect(DM).toContain('DataManagerViewpointPanel');
    });

    it('still contains its Form theme select', () => {
        expect(DM).toContain('>Form theme<');
        expect(DM).toContain('onChange={handleFormThemeChange}');
    });

    it('still contains its palette select', () => {
        expect(DM).toContain('>Palette<');
        expect(DM).toContain('onChange={handlePaletteChange}');
    });
});
