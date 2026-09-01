/**
 * NAV1 — «Data manager» in the toolbar viewpoint picker.
 *
 * Two halves, for one measured reason. `Toolbar.tsx` is not importable under the `node`
 * environment of vitest (it pulls `../../joiner`, which reaches the store and dies on
 * `window is not defined` — the same wall nine suites in this repo already hit), so the
 * behaviour that lives in the component is asserted on its SOURCE, exactly as
 * `instanceManager10c.test.ts` does for `InstanceManagerTab.tsx`. The vocabulary itself
 * lives in `dataManagerOption.ts`, which imports nothing, and is exercised as a real unit.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
    DATA_MANAGER_OPTION_LABEL,
    DATA_MANAGER_OPTION_VALUE,
    DATA_MANAGER_SEPARATOR_LABEL,
    isDataManagerOption,
} from '../dataManagerOption';

const TSX = readFileSync(resolve(__dirname, '../Toolbar.tsx'), 'utf8');

/** The body of the viewpoint <select>, from the tag to its close. */
function selectBody(): string {
    const start = TSX.indexOf('<option value="">Abstract syntax</option>');
    expect(start).toBeGreaterThan(-1);
    const end = TSX.indexOf('</select>', start);
    expect(end).toBeGreaterThan(start);
    return TSX.slice(start, end);
}

/** The body of `handleViewpointChange`, callback included. */
function handlerBody(): string {
    const start = TSX.indexOf('const handleViewpointChange = useCallback(');
    expect(start).toBeGreaterThan(-1);
    const end = TSX.indexOf('}, [modelId]);', start);
    expect(end).toBeGreaterThan(start);
    return TSX.slice(start, end);
}

describe('NAV1 — the vocabulary', () => {
    it('names the entry in sentence case, and not CRUD', () => {
        expect(DATA_MANAGER_OPTION_LABEL).toBe('Data manager');
        expect(DATA_MANAGER_OPTION_LABEL).not.toMatch(/CRUD/i);
        expect(DATA_MANAGER_OPTION_LABEL).not.toMatch(/syntax/i);
    });

    it('uses a sentinel that cannot be a pointer', () => {
        expect(DATA_MANAGER_OPTION_VALUE.startsWith('Pointer_')).toBe(false);
        expect(DATA_MANAGER_OPTION_VALUE.startsWith('@')).toBe(true);
        expect(DATA_MANAGER_OPTION_VALUE).not.toBe('');
    });

    it('recognises the sentinel and nothing else', () => {
        expect(isDataManagerOption(DATA_MANAGER_OPTION_VALUE)).toBe(true);
    });

    it('reads the empty string as a viewpoint value, not as the sentinel', () => {
        // '' IS «Abstract syntax»: a total predicate that swallowed it would make the
        // abstract-syntax entry open the manager instead of deactivating the viewpoint.
        expect(isDataManagerOption('')).toBe(false);
    });

    it('reads a real viewpoint id, null and undefined as not-the-sentinel', () => {
        expect(isDataManagerOption('Pointer_ViewPoint_3')).toBe(false);
        expect(isDataManagerOption(null)).toBe(false);
        expect(isDataManagerOption(undefined)).toBe(false);
        expect(isDataManagerOption(DATA_MANAGER_OPTION_LABEL)).toBe(false);
        expect(isDataManagerOption(DATA_MANAGER_SEPARATOR_LABEL)).toBe(false);
    });
});

describe('NAV1 — the entry in the picker', () => {
    it('renders the entry from the shared vocabulary, not from a literal', () => {
        const body = selectBody();
        expect(body).toContain('value={DATA_MANAGER_OPTION_VALUE}');
        expect(body).toContain('{DATA_MANAGER_OPTION_LABEL}');
        expect(body).not.toContain('>Data manager<');
    });

    it('puts it LAST — after the viewpoints, never interleaved', () => {
        const body = selectBody();
        const viewpoints = body.indexOf('viewpoints.map');
        const manager = body.indexOf('DATA_MANAGER_OPTION_VALUE');
        expect(viewpoints).toBeGreaterThan(-1);
        expect(manager).toBeGreaterThan(viewpoints);
    });

    it('separates it from the syntaxes with a disabled option', () => {
        const body = selectBody();
        const sep = body.indexOf('DATA_MANAGER_SEPARATOR_LABEL');
        expect(sep).toBeGreaterThan(-1);
        expect(body.slice(sep - 40, sep)).toContain('disabled');
        // Before the entry, so the group order is syntaxes → separator → manager.
        expect(sep).toBeLessThan(body.indexOf('DATA_MANAGER_OPTION_VALUE'));
    });

    it('hides it on metamodels and without a model id', () => {
        const body = selectBody();
        const guard = body.indexOf('{!isMetamodel && modelId && (');
        expect(guard).toBeGreaterThan(-1);
        expect(guard).toBeLessThan(body.indexOf('DATA_MANAGER_OPTION_VALUE'));
    });

    it('leaves the abstract-syntax entry and the viewpoint list untouched', () => {
        // Non-regression: the vocabulary for the syntaxes alone is the before.
        const body = selectBody();
        expect(body).toContain('<option value="">Abstract syntax</option>');
        expect(body).toContain('<option key={vp.id} value={vp.id}>{vp.name}</option>');
    });
});

describe('NAV1 — the routing', () => {
    it('intercepts the sentinel BEFORE the viewpoint write', () => {
        const body = handlerBody();
        const guard = body.indexOf('isDataManagerOption(vpId)');
        const write = body.indexOf('activateViewpoint(');
        expect(guard).toBeGreaterThan(-1);
        expect(write).toBeGreaterThan(guard);
    });

    it('returns before reaching activateViewpoint, so no sentinel enters state.viewpoint', () => {
        const body = handlerBody();
        const branch = body.slice(body.indexOf('isDataManagerOption(vpId)'), body.indexOf('activateViewpoint('));
        expect(branch).toContain('return;');
        expect(branch).not.toContain('activateViewpoint');
    });

    it('delegates to DockManager.openManager rather than mounting the tab itself', () => {
        const body = handlerBody();
        expect(body).toContain('DockManager.openManager(');
        // The picker owns no tab construction: that is TabDataMaker's, through DockManager.
        expect(body).not.toContain('TabDataMaker');
        expect(body).not.toContain('InstanceManagerTab');
    });

    it('resolves the LModel from the modelId the toolbar already receives', () => {
        const body = handlerBody();
        expect(body).toContain('LPointerTargetable.fromPointer(modelId)');
        expect(body).toContain('if (!modelId) return;');
    });

    it('keeps modelId in the callback deps, so the door does not close over a stale model', () => {
        expect(TSX).toContain('}, [modelId]);');
    });
});

describe('NAV1 — symmetry with the header tab', () => {
    it('uses the same entry point as the models rail', () => {
        const LEFTBAR = readFileSync(
            resolve(__dirname, '../../../pages/components/LeftBar.tsx'), 'utf8');
        expect(LEFTBAR).toContain('DockManager.openManager(');
        expect(handlerBody()).toContain('DockManager.openManager(');
    });

    it('reuses an existing tab instead of mounting a second one', () => {
        // The convergence is DockManager.open's, not the picker's: same tab id (built
        // once, in `managerTabId`) → `updateTab(..., true)` and an early return.
        const DOCK = readFileSync(
            resolve(__dirname, '../../abstract/DockManager.tsx'), 'utf8');
        const open = DOCK.slice(DOCK.indexOf('static async open(group'), DOCK.indexOf('static activateProjectSummary'));
        expect(open).toContain('DockManager.dock.find(tab.id)');
        expect(open).toContain('updateTab(tab.id, null as any, true)');
        const MAKER = readFileSync(
            resolve(__dirname, '../../abstract/tabs/TabDataMaker.tsx'), 'utf8');
        expect(MAKER).toContain('const tabId = managerTabId(model.id);');
    });

    it('never closes the manager tab from the picker', () => {
        // Going back to a syntax activates the canvas tab; the manager stays open.
        expect(handlerBody()).not.toContain('closeTab');
    });
});
