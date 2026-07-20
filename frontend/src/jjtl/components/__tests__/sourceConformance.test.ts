import { describe, it, expect } from 'vitest';
import {
    isModelCompatibleWithSource,
    resolveModelMetamodelId,
    resolveModelMetamodelName,
} from '../sourceConformance';
import type { SourceCompatInput } from '../sourceConformance';

// ============================================================
// isModelCompatibleWithSource — identity-first with name fallback
// ============================================================

describe('isModelCompatibleWithSource', () => {
    it('matches by metamodel ID when the transformation has a sourceMetamodelId', () => {
        const model: SourceCompatInput = { metamodelId: 'mm1', metamodelName: 'StateMachine' };
        expect(isModelCompatibleWithSource(model, 'mm1', 'StateMachine')).toBe(true);
    });

    it('rejects a mismatched metamodel ID', () => {
        const model: SourceCompatInput = { metamodelId: 'mm2', metamodelName: 'StateMachine' };
        expect(isModelCompatibleWithSource(model, 'mm1', 'StateMachine')).toBe(false);
    });

    it('does NOT fall back to name when the ID is present (no false positive from name)', () => {
        // Same name, different ID → the ID must win.
        const model: SourceCompatInput = { metamodelId: 'mm2', metamodelName: 'StateMachine' };
        expect(isModelCompatibleWithSource(model, 'mm1', 'StateMachine')).toBe(false);
    });

    it('falls back to name equality for legacy transformations without sourceMetamodelId', () => {
        const model: SourceCompatInput = { metamodelId: 'mm1', metamodelName: 'StateMachine' };
        expect(isModelCompatibleWithSource(model, undefined, 'StateMachine')).toBe(true);
    });

    it('matches by ID even when the model metamodel name is unresolved (empty) — the original bug', () => {
        const model: SourceCompatInput = { metamodelId: 'mm1', metamodelName: '' };
        expect(isModelCompatibleWithSource(model, 'mm1', 'StateMachine')).toBe(true);
    });

    it('does not spuriously match ID-vs-name (regression of removed matchesById)', () => {
        // Legacy path (no sourceMetamodelId). sourceMetamodelName is accidentally an ID string.
        // The old matchesById (mmId === sourceMetamodelName) would have returned true here.
        const model: SourceCompatInput = { metamodelId: 'mm1', metamodelName: 'StateMachine' };
        expect(isModelCompatibleWithSource(model, undefined, 'mm1')).toBe(false);
    });

    it('resolves the metamodel ID from conformsTo when metamodelId is absent', () => {
        const model: SourceCompatInput = { conformsTo: 'mm1' };
        expect(isModelCompatibleWithSource(model, 'mm1', 'Whatever')).toBe(true);
    });

    it('returns false in the legacy path when both names are empty', () => {
        const model: SourceCompatInput = { metamodelId: 'mm1', metamodelName: '' };
        expect(isModelCompatibleWithSource(model, undefined, '')).toBe(false);
    });
});

// ============================================================
// Field resolvers — alternative field shapes
// ============================================================

describe('resolveModelMetamodelId', () => {
    it('prefers metamodelId, then conformsTo, then metamodel', () => {
        expect(resolveModelMetamodelId({ metamodelId: 'a', conformsTo: 'b' })).toBe('a');
        expect(resolveModelMetamodelId({ conformsTo: 'b' })).toBe('b');
        expect(resolveModelMetamodelId({ metamodel: 'c' })).toBe('c');
        expect(resolveModelMetamodelId({ metamodel: { id: 'd' } })).toBe('d');
        expect(resolveModelMetamodelId({})).toBe('');
    });
});

describe('resolveModelMetamodelName', () => {
    it('prefers metamodelName, then metamodel.name', () => {
        expect(resolveModelMetamodelName({ metamodelName: 'A' })).toBe('A');
        expect(resolveModelMetamodelName({ metamodel: { name: 'B' } })).toBe('B');
        expect(resolveModelMetamodelName({ metamodel: 'stringPtr' })).toBe('');
        expect(resolveModelMetamodelName({})).toBe('');
    });
});
