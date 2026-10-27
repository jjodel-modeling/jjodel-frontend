/**
 * conformingModels — the models a metamodel editor's code panel offers (R-GEN-19, P-2026-10-23-1910).
 *
 * A hand-built lookup with two projects and two metamodels: only the project's own models of that metamodel, in the
 * project's order. Each test name says which break kills it; the bench is in the commit body.
 */

import { describe, it, expect } from 'vitest';
import { conformingModels } from '../conformingModels';

const lookup = {
    P: { className: 'DProject', id: 'P', models: ['MM', 'B', 'X', 'A', 'GONE'] },
    Q: { className: 'DProject', id: 'Q', models: ['C'] },
    MM: { className: 'DModel', id: 'MM' },
    OTHER: { className: 'DModel', id: 'OTHER' },
    A: { className: 'DModel', id: 'A', instanceof: 'MM' },
    B: { className: 'DModel', id: 'B', instanceof: 'MM' },
    X: { className: 'DModel', id: 'X', instanceof: 'OTHER' },
    C: { className: 'DModel', id: 'C', instanceof: 'MM' },
};

describe('conformingModels', () => {
    it('lists the project\'s models of the metamodel in the project\'s order (kills: lookup order; pointers dropped)', () => {
        expect(conformingModels(lookup, 'P', 'MM')).toEqual(['B', 'A']);
    });

    it('leaves out a model of another project (kills: another project\'s model listed)', () => {
        expect(conformingModels(lookup, 'P', 'MM')).not.toContain('C');
        expect(conformingModels(lookup, 'Q', 'MM')).toEqual(['C']);
    });

    it('leaves out a model of another metamodel, and the metamodel itself (kills: another metamodel\'s model listed)', () => {
        expect(conformingModels(lookup, 'P', 'OTHER')).toEqual(['X']);
        expect(conformingModels(lookup, 'P', 'MM')).not.toContain('X');
        expect(conformingModels(lookup, 'P', 'MM')).not.toContain('MM');
    });

    it('is empty with an unknown project, a project with no models, or a metamodel with none', () => {
        expect(conformingModels(lookup, '', 'MM')).toEqual([]);
        expect(conformingModels({ ...lookup, P: { className: 'DProject', id: 'P' } }, 'P', 'MM')).toEqual([]);
        expect(conformingModels(lookup, 'Q', 'OTHER')).toEqual([]);
    });
});
