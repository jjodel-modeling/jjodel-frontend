import { describe, it, expect, beforeEach } from 'vitest'
import {
    inferMegamodelEdges,
    wouldCreateCycle,
} from '../megamodelInference'
import type { ProjectArtifacts } from '../megamodelInference'
import {
    loadMegamodel,
    serializeMegamodel,
    registerSerializedMegamodel,
    getSerializedMegamodel,
    clearSerializedMegamodel,
    buildProjectExportJson,
    extractMegamodelFromProjectJson,
} from '../megamodelPersistence'
import type { Megamodel, MegamodelEdge, MegamodelSerialized } from '../megamodel'

// ============================================================
// Fixtures
// ============================================================

function makeArtifacts(overrides: Partial<ProjectArtifacts> = {}): ProjectArtifacts {
    return {
        metamodels: [
            { id: 'mm1', name: 'PetriNet' },
            { id: 'mm2', name: 'WorkflowNet' },
        ],
        models: [
            { id: 'm1', name: 'FireAlarmSystem', instanceofMetamodelId: 'mm1' },
            { id: 'm2', name: 'BackupProcess', instanceofMetamodelId: 'mm2' },
            { id: 'm3', name: 'Orphan', instanceofMetamodelId: undefined },
        ],
        transformations: [
            { id: 't1', name: 'PetriNet_to_WorkflowNet', sourceMetamodelId: 'mm1', targetMetamodelId: 'mm2' },
        ],
        ...overrides,
    }
}

// ============================================================
// inferMegamodelEdges
// ============================================================

describe('inferMegamodelEdges', () => {
    it('produces conformsTo edges for models with a known metamodel', () => {
        const edges = inferMegamodelEdges(makeArtifacts())
        const conformsTo = edges.filter(e => e.type === 'conformsTo')
        expect(conformsTo).toHaveLength(2)

        const e1 = conformsTo.find(e => e.source.id === 'm1')!
        expect(e1.target.id).toBe('mm1')
        expect(e1.origin).toBe('derived')
        expect(e1.id).toBe('derived_m1_conformsTo_mm1')
    })

    it('skips conformsTo edges for models with no metamodel', () => {
        const edges = inferMegamodelEdges(makeArtifacts())
        const orphan = edges.filter(e => e.source.id === 'm3')
        expect(orphan).toHaveLength(0)
    })

    it('skips conformsTo edges when metamodel id is not in project', () => {
        const artifacts = makeArtifacts({
            models: [{ id: 'm1', name: 'Model', instanceofMetamodelId: 'unknown-mm' }],
        })
        const edges = inferMegamodelEdges(artifacts)
        expect(edges.filter(e => e.type === 'conformsTo')).toHaveLength(0)
    })

    it('produces a uses edge: metamodel → metamodel (cross-metamodel dependency)', () => {
        const artifacts = makeArtifacts({
            metamodels: [
                { id: 'mm1', name: 'PetriNet', usesMetamodelIds: ['mm2'] },
                { id: 'mm2', name: 'WorkflowNet' },
            ],
        })
        const uses = inferMegamodelEdges(artifacts).filter(e => e.type === 'uses')
        expect(uses).toHaveLength(1)
        expect(uses[0].source.id).toBe('mm1')
        expect(uses[0].target.id).toBe('mm2')
        expect(uses[0].origin).toBe('derived')
        expect(uses[0].id).toBe('derived_mm1_uses_mm2')
    })

    it('collapses multiple cross-metamodel links into a single uses edge and ignores self/unknown ids', () => {
        const artifacts = makeArtifacts({
            metamodels: [
                { id: 'mm1', name: 'PetriNet', usesMetamodelIds: ['mm2', 'mm2', 'mm1', 'ghost'] },
                { id: 'mm2', name: 'WorkflowNet' },
            ],
        })
        const uses = inferMegamodelEdges(artifacts).filter(e => e.type === 'uses')
        expect(uses).toHaveLength(1)
        expect(uses[0].target.id).toBe('mm2')
    })

    it('produces no uses edge when usesMetamodelIds is absent or empty', () => {
        const none = inferMegamodelEdges(makeArtifacts())
        expect(none.filter(e => e.type === 'uses')).toHaveLength(0)

        const empty = inferMegamodelEdges(makeArtifacts({
            metamodels: [{ id: 'mm1', name: 'PetriNet', usesMetamodelIds: [] }],
        }))
        expect(empty.filter(e => e.type === 'uses')).toHaveLength(0)
    })

    it('produces inputOf edge: metamodel → transformation', () => {
        const edges = inferMegamodelEdges(makeArtifacts())
        const inputOf = edges.filter(e => e.type === 'inputOf')
        expect(inputOf).toHaveLength(1)
        expect(inputOf[0].source.id).toBe('mm1')
        expect(inputOf[0].target.id).toBe('t1')
        expect(inputOf[0].id).toBe('derived_mm1_inputOf_t1')
    })

    it('produces outputOf edge: transformation → metamodel', () => {
        const edges = inferMegamodelEdges(makeArtifacts())
        const outputOf = edges.filter(e => e.type === 'outputOf')
        expect(outputOf).toHaveLength(1)
        expect(outputOf[0].source.id).toBe('t1')
        expect(outputOf[0].target.id).toBe('mm2')
        expect(outputOf[0].id).toBe('derived_t1_outputOf_mm2')
    })

    it('skips inputOf/outputOf when transformation has no metamodel reference', () => {
        const artifacts = makeArtifacts({
            transformations: [{ id: 't2', name: 'NoRef' }],
        })
        const edges = inferMegamodelEdges(artifacts)
        expect(edges.filter(e => e.type === 'inputOf')).toHaveLength(0)
        expect(edges.filter(e => e.type === 'outputOf')).toHaveLength(0)
    })

    it('returns empty array for empty artifacts', () => {
        const edges = inferMegamodelEdges({ metamodels: [], models: [], transformations: [] })
        expect(edges).toHaveLength(0)
    })

    it('all derived edges have origin === derived', () => {
        const edges = inferMegamodelEdges(makeArtifacts())
        expect(edges.every(e => e.origin === 'derived')).toBe(true)
    })

    it('denormalizes artifact names into ArtifactRef', () => {
        const edges = inferMegamodelEdges(makeArtifacts())
        const conformsTo = edges.find(e => e.source.id === 'm1' && e.type === 'conformsTo')!
        expect(conformsTo.source.name).toBe('FireAlarmSystem')
        expect(conformsTo.target.name).toBe('PetriNet')
    })
})

// ============================================================
// wouldCreateCycle
// ============================================================

describe('wouldCreateCycle', () => {
    function makeTriggeredEdge(from: string, to: string): MegamodelEdge {
        return {
            id: `${from}_${to}`,
            source: { id: from, type: 'model', name: from },
            target: { id: to, type: 'model', name: to },
            type: 'user-defined',
            origin: 'user-defined',
            trigger: {
                event: 'onChange',
                transformationId: 'tx',
                enabled: true,
            },
        }
    }

    function makeEdge(from: string, to: string): MegamodelEdge {
        return {
            id: `${from}_${to}`,
            source: { id: from, type: 'model', name: from },
            target: { id: to, type: 'model', name: to },
            type: 'user-defined',
            origin: 'user-defined',
            // no trigger — should be ignored by cycle detection
        }
    }

    it('returns false for no edges', () => {
        expect(wouldCreateCycle([], 'A', 'B')).toBe(false)
    })

    it('returns false when no path from to→from exists', () => {
        const edges = [makeTriggeredEdge('A', 'B'), makeTriggeredEdge('B', 'C')]
        expect(wouldCreateCycle(edges, 'A', 'D')).toBe(false)
    })

    it('detects a direct cycle A→B + adding B→A', () => {
        const edges = [makeTriggeredEdge('A', 'B')]
        expect(wouldCreateCycle(edges, 'B', 'A')).toBe(true)
    })

    it('detects an indirect cycle A→B→C + adding C→A', () => {
        const edges = [makeTriggeredEdge('A', 'B'), makeTriggeredEdge('B', 'C')]
        expect(wouldCreateCycle(edges, 'C', 'A')).toBe(true)
    })

    it('does NOT detect cycles through non-triggered edges', () => {
        // A→B (no trigger), adding B→A — should not be considered a cycle
        const edges = [makeEdge('A', 'B')]
        expect(wouldCreateCycle(edges, 'B', 'A')).toBe(false)
    })

    it('handles self-loop: adding A→A', () => {
        expect(wouldCreateCycle([], 'A', 'A')).toBe(true)
    })
})

// ============================================================
// loadMegamodel / serializeMegamodel
// ============================================================

describe('loadMegamodel', () => {
    it('returns only derived edges when no serialized megamodel', () => {
        const mm = loadMegamodel(undefined, makeArtifacts())
        expect(mm.megamodelVersion).toBe('1.0')
        expect(mm.edges.every(e => e.origin === 'derived')).toBe(true)
        expect(mm.edges.length).toBeGreaterThan(0)
    })

    it('merges derived and user-defined edges', () => {
        const userEdge: MegamodelEdge = {
            id: 'user-1',
            source: { id: 'mm1', type: 'metamodel', name: 'PetriNet' },
            target: { id: 'mm2', type: 'metamodel', name: 'WorkflowNet' },
            type: 'user-defined',
            origin: 'user-defined',
        }
        const serialized: MegamodelSerialized = {
            megamodelVersion: '1.0',
            edges: [userEdge],
        }
        const mm = loadMegamodel(serialized, makeArtifacts())
        expect(mm.edges.find(e => e.id === 'user-1')).toBeDefined()
        expect(mm.edges.some(e => e.origin === 'derived')).toBe(true)
    })
})

describe('serializeMegamodel', () => {
    it('serializes only user-defined edges', () => {
        const megamodel: Megamodel = {
            megamodelVersion: '1.0',
            edges: [
                {
                    id: 'derived-1',
                    source: { id: 'mm1', type: 'metamodel', name: 'MM' },
                    target: { id: 't1', type: 'transformation', name: 'T' },
                    type: 'inputOf',
                    origin: 'derived',
                },
                {
                    id: 'user-1',
                    source: { id: 'mm1', type: 'metamodel', name: 'MM' },
                    target: { id: 'mm2', type: 'metamodel', name: 'MM2' },
                    type: 'user-defined',
                    origin: 'user-defined',
                },
            ],
        }
        const result = serializeMegamodel(megamodel)
        expect(result.edges).toHaveLength(1)
        expect(result.edges[0].id).toBe('user-1')
        expect(result.megamodelVersion).toBe('1.0')
    })

    it('returns empty edges when no user-defined edges exist', () => {
        const megamodel: Megamodel = {
            megamodelVersion: '1.0',
            edges: [
                {
                    id: 'd1',
                    source: { id: 'a', type: 'model', name: 'A' },
                    target: { id: 'b', type: 'metamodel', name: 'B' },
                    type: 'conformsTo',
                    origin: 'derived',
                },
            ],
        }
        const result = serializeMegamodel(megamodel)
        expect(result.edges).toHaveLength(0)
    })
})

// ============================================================
// Registry
// ============================================================

describe('megamodel registry', () => {
    beforeEach(() => {
        clearSerializedMegamodel('proj-1')
    })

    it('stores and retrieves a serialized megamodel', () => {
        const data: MegamodelSerialized = { megamodelVersion: '1.0', edges: [] }
        registerSerializedMegamodel('proj-1', data)
        expect(getSerializedMegamodel('proj-1')).toBe(data)
    })

    it('returns undefined for unknown project', () => {
        expect(getSerializedMegamodel('unknown')).toBeUndefined()
    })

    it('clearSerializedMegamodel removes the entry', () => {
        registerSerializedMegamodel('proj-1', { megamodelVersion: '1.0', edges: [] })
        clearSerializedMegamodel('proj-1')
        expect(getSerializedMegamodel('proj-1')).toBeUndefined()
    })
})

// ============================================================
// buildProjectExportJson / extractMegamodelFromProjectJson
// ============================================================

describe('buildProjectExportJson', () => {
    it('includes serialized megamodel in export object', () => {
        const raw = { id: 'proj-1', name: 'Test', state: 'compressed' } as Record<string, unknown>
        const megamodel: Megamodel = { megamodelVersion: '1.0', edges: [] }
        const result = buildProjectExportJson(raw, megamodel)
        expect(result.id).toBe('proj-1')
        expect(result.megamodel).toBeDefined()
        expect((result.megamodel as MegamodelSerialized).megamodelVersion).toBe('1.0')
    })

    it('omits megamodel field when not provided', () => {
        const raw = { id: 'proj-1' } as Record<string, unknown>
        const result = buildProjectExportJson(raw)
        expect(result.megamodel).toBeUndefined()
    })

    it('does not mutate the original raw object', () => {
        const raw = { id: 'proj-1' } as Record<string, unknown>
        buildProjectExportJson(raw, { megamodelVersion: '1.0', edges: [] })
        expect(raw.megamodel).toBeUndefined()
    })
})

describe('extractMegamodelFromProjectJson', () => {
    it('extracts a valid megamodel', () => {
        const json = {
            id: 'proj-1',
            megamodel: { megamodelVersion: '1.0', edges: [] },
        } as Record<string, unknown>
        const result = extractMegamodelFromProjectJson(json)
        expect(result).toBeDefined()
        expect(result!.megamodelVersion).toBe('1.0')
    })

    it('returns undefined for legacy project without megamodel field', () => {
        const json = { id: 'proj-1' } as Record<string, unknown>
        expect(extractMegamodelFromProjectJson(json)).toBeUndefined()
    })

    it('returns undefined when megamodelVersion is wrong', () => {
        const json = {
            megamodel: { megamodelVersion: '2.0', edges: [] },
        } as Record<string, unknown>
        expect(extractMegamodelFromProjectJson(json)).toBeUndefined()
    })
})
