/**
 * Unit tests for the projection of the problems registry onto form fields (Slice 1b).
 *
 * Pure: `collectFormDiagnostics` takes plain NodeProblem objects, so no store, no React, no
 * framework barrel. The cases are the ones the StateMachine fixture produces plus the two
 * that are easy to get wrong: a violation that names a CLASS rather than a feature, and a
 * problem that is on its way out of the registry.
 */
import { describe, it, expect } from 'vitest';
import { collectFormDiagnostics, worstSeverity } from '../formDiagnostics';
import type { NodeProblem, ConformanceProblemDetail } from '../../../problems/registry';

function conformance(details: ConformanceProblemDetail[], over: Partial<NodeProblem> = {}): NodeProblem {
    return {
        id: 'conformance:obj',
        nodeId: 'obj',
        kind: 'conformance',
        severity: details.some(d => d.severity === 'error') ? 'error' : 'warning',
        title: 'Conformance',
        description: `${details.length} conformance violations`,
        relatedNodeIds: [],
        conformance: details,
        createdAt: 0,
        ...over,
    };
}

const detail = (
    metamodelElementName: string | undefined,
    severity: 'error' | 'warning',
    message: string,
    violationType = 'missing_required_attr',
): ConformanceProblemDetail => ({ violationType, severity, message, metamodelElementName });

const FIELDS = new Set(['name', 'kind', 'outgoing', 'timeout']);

describe('collectFormDiagnostics', () => {
    it('routes each violation to the field it names, and keeps the rest', () => {
        const p = conformance([
            detail('kind', 'error', 'kind is required'),
            detail('outgoing', 'warning', 'State has no outgoing transitions'),
            // A class-level check: metamodelElementName holds the CLASS name, which matches
            // no field. It must be counted, not silently dropped.
            detail('State', 'error', 'Object is an instance of abstract class "State"', 'abstract_instantiation'),
        ]);
        const r = collectFormDiagnostics([p], FIELDS);

        expect(r.byField.get('kind')).toEqual([{ severity: 'error', message: 'kind is required' }]);
        expect(r.byField.get('outgoing')).toEqual([
            { severity: 'warning', message: 'State has no outgoing transitions' },
        ]);
        expect(r.byField.has('State')).toBe(false);
        expect(r.residue).toHaveLength(1);
        expect(r.residue[0].message).toContain('abstract class');
    });

    it('counts exactly what NodeProblemIndicator counts', () => {
        // The indicator's formula: one unit per conformance violation, one per problem of
        // any other kind, resolved problems excluded. The rail and the canvas badge must
        // never report a different number for the same object.
        const problems: NodeProblem[] = [
            conformance([
                detail('kind', 'error', 'a'),
                detail('outgoing', 'warning', 'b'),
                detail('nope', 'error', 'c'),
            ]),
            {
                id: 'duplicate-name:obj', nodeId: 'obj', kind: 'duplicate-name', severity: 'warning',
                title: 'Duplicate name', description: 'Another element is called Idle',
                relatedNodeIds: ['other'], createdAt: 0,
            },
        ];
        const r = collectFormDiagnostics(problems, FIELDS);

        const indicatorCount = problems
            .filter(p => p.resolvedAt === undefined)
            .reduce((n, p) => n + (p.conformance?.length ?? 1), 0);
        expect(r.errorCount + r.warningCount).toBe(indicatorCount);
        expect(r.errorCount).toBe(2);
        expect(r.warningCount).toBe(2);
    });

    it('a problem of another kind lands in the residue with its title', () => {
        const r = collectFormDiagnostics([{
            id: 'duplicate-name:obj', nodeId: 'obj', kind: 'duplicate-name', severity: 'warning',
            title: 'Duplicate name', description: 'Another element is called Idle',
            relatedNodeIds: [], createdAt: 0,
        }], FIELDS);
        expect(r.byField.size).toBe(0);
        expect(r.residue).toEqual([{ severity: 'warning', message: 'Duplicate name' }]);
        expect(r.warningCount).toBe(1);
    });

    it('ignores a resolved problem entirely, in the fields AND in the counts', () => {
        const r = collectFormDiagnostics(
            [conformance([detail('kind', 'error', 'kind is required')], { resolvedAt: 123 })],
            FIELDS,
        );
        expect(r.byField.size).toBe(0);
        expect(r.errorCount).toBe(0);
        expect(r.warningCount).toBe(0);
    });

    it('sends a violation on a hidden or filtered-out feature to the residue', () => {
        // `substates` is a real feature, but the view hid it or Basic mode dropped it, so it
        // is not among the rendered field names. The count must still include it.
        const r = collectFormDiagnostics(
            [conformance([detail('substates', 'warning', 'too many substates')])],
            FIELDS,
        );
        expect(r.byField.size).toBe(0);
        expect(r.residue).toHaveLength(1);
        expect(r.warningCount).toBe(1);
    });

    it('groups several violations on the same field, in order', () => {
        const r = collectFormDiagnostics(
            [conformance([detail('kind', 'error', 'first'), detail('kind', 'warning', 'second')])],
            FIELDS,
        );
        expect(r.byField.get('kind')?.map(d => d.message)).toEqual(['first', 'second']);
    });

    it('returns an empty projection for no problems', () => {
        const r = collectFormDiagnostics([], FIELDS);
        expect(r.byField.size).toBe(0);
        expect(r.errorCount).toBe(0);
        expect(r.residue).toEqual([]);
    });

    it('tolerates a violation with no metamodelElementName at all', () => {
        const r = collectFormDiagnostics(
            [conformance([detail(undefined, 'warning', 'check could not run', 'check_failed')])],
            FIELDS,
        );
        expect(r.residue).toHaveLength(1);
        expect(r.warningCount).toBe(1);
    });
});

describe('worstSeverity', () => {
    it('reports error over warning, and null for nothing', () => {
        expect(worstSeverity([{ severity: 'warning', message: 'a' }, { severity: 'error', message: 'b' }])).toBe('error');
        expect(worstSeverity([{ severity: 'warning', message: 'a' }])).toBe('warning');
        expect(worstSeverity([])).toBeNull();
        expect(worstSeverity(undefined)).toBeNull();
    });
});
