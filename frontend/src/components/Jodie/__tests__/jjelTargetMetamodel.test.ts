/**
 * The Jjodie JjEL console reads the metamodel of the artifact on screen (#192). With a
 * model tab active, `getActiveMetamodel()` is null, and a context that named no
 * metamodel made `getTargetMetamodel` fall back to the project's first one: `instances`
 * listed another metamodel's objects. The context handed to `buildEvalContext` now
 * names the active model's own metamodel. The joiner and jjscript barrels do not load
 * in the bench (window), so they are mocked, and so is the UI-state reader.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const ui: { level: 'M1' | 'M2'; model: unknown; metamodel: unknown } = { level: 'M2', model: null, metamodel: null };
const seen: { contexts: Array<Record<string, unknown>> } = { contexts: [] };

vi.mock('../../../joiner', () => ({
    DUser: { current: 'user' },
    L: { fromPointer: () => null },
}));
vi.mock('../../../jjscript', () => ({
    buildEvalContext: (ctx: Record<string, unknown>) => { seen.contexts.push(ctx); return {}; },
}));
vi.mock('../../../jjscript/executor/utils', () => ({
    getActiveLevel: () => ui.level,
    getActiveModel: () => ui.model,
    getActiveMetamodel: () => ui.metamodel,
}));

import { evaluateJjelInJodie, evaluateJjelLive } from '../jodieJjelContext';

beforeEach(() => {
    seen.contexts = [];
    ui.level = 'M2';
    ui.model = null;
    ui.metamodel = null;
});

describe('Jjodie JjEL context names the metamodel on screen (#192)', () => {
    it('a model tab: the model\'s own metamodel, not the project\'s first', () => {
        ui.level = 'M1';
        ui.model = { id: 'rules_1000', instanceof: { id: 'mm-GameRules' } };
        evaluateJjelInJodie('1');
        expect(seen.contexts[0].targetMetamodelId).toBe('mm-GameRules');
    });

    it('a model tab whose instanceof is a bare pointer id', () => {
        ui.level = 'M1';
        ui.model = { id: 'rules_1000', instanceof: 'mm-GameRules' };
        evaluateJjelInJodie('1');
        expect(seen.contexts[0].targetMetamodelId).toBe('mm-GameRules');
    });

    it('the live result reads the same metamodel', () => {
        ui.level = 'M1';
        ui.model = { id: 'rules_1000', instanceof: { id: 'mm-GameRules' } };
        evaluateJjelLive('1', []);
        expect(seen.contexts[0].targetMetamodelId).toBe('mm-GameRules');
    });

    it('a metamodel tab: the active metamodel', () => {
        ui.metamodel = { id: 'mm-PlayerProgress' };
        evaluateJjelInJodie('1');
        expect(seen.contexts[0].targetMetamodelId).toBe('mm-PlayerProgress');
    });

    it('nothing resolvable: no metamodel named, the old fallback applies', () => {
        evaluateJjelInJodie('1');
        expect(seen.contexts[0].targetMetamodelId).toBeUndefined();
    });
});
