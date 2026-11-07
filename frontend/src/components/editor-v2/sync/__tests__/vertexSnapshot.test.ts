/**
 * vertexChildrenHash (P-2026-10-21-0155): one test per `term:` line of `vertexSnapshot.ts`. Each test
 * changes one fact a node renders, in a fixture built so that no other term sees it, and expects the
 * vertex's hash to change: dropping the term's line makes exactly that test fail (mutation bench in
 * the commit message). The last tests pin the other direction: an unrelated write, or the same
 * content under new object identities, leaves the hash equal.
 */
import { describe, it, expect } from 'vitest';
import { vertexChildrenHash } from '../vertexSnapshot';

type L = Record<string, any>;

function fixture(): L {
    const L: L = {};
    const put = (o: any) => { L[o.id] = o; };
    // Metamodel mm: pkg (Person, Unrelated), pkg3 (Other). Metamodel mm2: pkg2 (Named, the ghost parent).
    put({ id: 'M', className: 'DModel', name: 'mm' });
    put({ id: 'M2', className: 'DModel', name: 'mm2' });
    put({ id: 'M3', className: 'DModel', name: 'mm2' });
    put({ id: 'M4', className: 'DModel', name: 'mm' });
    put({ id: 'P', className: 'DPackage', name: 'pkg', father: 'M' });
    put({ id: 'P2', className: 'DPackage', name: 'pkg2', father: 'M2' });
    put({ id: 'P3', className: 'DPackage', name: 'pkg3', father: 'M' });
    put({ id: 'T1', className: 'DDataType', name: 'EInt' });
    put({ id: 'T2', className: 'DDataType', name: 'EInt' });
    put({ id: 'T3', className: 'DDataType', name: 'EString' });
    put({ id: 'C1', className: 'DClass', name: 'Person', father: 'P',
        attributes: ['A1', 'A5'], references: ['R1'], operations: ['O1'], extends: ['C2'] });
    put({ id: 'C2', className: 'DClass', name: 'Named', father: 'P2', attributes: ['A3'] });
    put({ id: 'C3', className: 'DClass', name: 'Other', father: 'P3', attributes: ['A4'], references: ['R2'] });
    put({ id: 'UNREL', className: 'DClass', name: 'Unrelated', father: 'P' });
    put({ id: 'A1', className: 'DAttribute', name: 'age', father: 'C1', type: 'T1',
        lowerBound: 0, upperBound: 1, defaultValueLiteral: '0' });
    put({ ...L.A1, id: 'A1b' });
    put({ id: 'A5', className: 'DAttribute', name: 'mood', father: 'C1', type: 'E2' });
    put({ id: 'E2', className: 'DEnumerator', name: 'Mood', literals: ['LM1'] });
    put({ id: 'LM1', className: 'DEnumLiteral', name: 'HAPPY', father: 'E2' });
    put({ id: 'R1', className: 'DReference', name: 'friend', father: 'C1', type: 'C3', opposite: 'R2',
        lowerBound: 0, upperBound: -1 });
    put({ id: 'R2', className: 'DReference', name: 'back', father: 'C3', type: 'C1' });
    put({ id: 'O1', className: 'DOperation', name: 'run', father: 'C1', type: 'T1', parameters: ['PA1'] });
    put({ id: 'PA1', className: 'DParameter', name: 'x', father: 'O1', type: 'T3' });
    put({ id: 'A3', className: 'DAttribute', name: 'color', father: 'C2', type: 'E1', annotations: ['AN1'] });
    put({ id: 'AN1', className: 'DAnnotation', source: 'renderer=badge' });
    put({ id: 'E1', className: 'DEnumerator', name: 'Color', literals: ['L1', 'L2'] });
    put({ ...L.E1, id: 'E1b' });
    put({ id: 'L1', className: 'DEnumLiteral', name: 'RED', father: 'E1' });
    put({ id: 'L2', className: 'DEnumLiteral', name: 'GREEN', father: 'E1' });
    put({ id: 'A4', className: 'DAttribute', name: 'name', father: 'C3', type: 'T3' });
    // Model: alice (Person) -> friend -> bob (Other); zed (Other) is unrelated.
    put({ id: 'OB1', className: 'DObject', name: 'alice', instanceof: 'C1', features: ['V1', 'V2', 'V3'] });
    put({ id: 'V1', className: 'DValue', instanceof: 'A1', values: ['42'] });
    put({ id: 'V2', className: 'DValue', instanceof: 'R1', values: ['OB2'] });
    put({ id: 'V3', className: 'DValue', instanceof: 'A3', values: ['RED'] });
    put({ id: 'OB2', className: 'DObject', name: 'bob', instanceof: 'C3', features: ['V4'] });
    put({ id: 'V4', className: 'DValue', instanceof: 'A4', values: ['bob'] });
    put({ id: 'OB3', className: 'DObject', name: 'zed', instanceof: 'C3', features: ['V5'] });
    put({ id: 'V5', className: 'DValue', instanceof: 'A4', values: ['zed'] });
    return L;
}

/** Hash of vertex `of` before and after `write`, on a fresh fixture. */
function hashes(of: string, write: (L: L) => void): [number, number] {
    const L = fixture();
    const before = vertexChildrenHash(L, L[of]);
    write(L);
    return [before, vertexChildrenHash(L, L[of])];
}

function expectChange(of: string, write: (L: L) => void) {
    const [a, b] = hashes(of, write);
    expect(b).not.toBe(a);
}

describe('vertexChildrenHash: class node (attributes, references, operations, ghosts)', () => {
    it('childName: attribute renamed', () => expectChange('C1', L => { L.A1.name = 'years'; }));
    it('childTypeId: attribute retyped to a same-named type', () => expectChange('C1', L => { L.A1.type = 'T2'; }));
    it('childTypeName: the attribute type renamed', () => expectChange('C1', L => { L.T1.name = 'Integer'; }));
    it('childLower: lower bound', () => expectChange('C1', L => { L.A1.lowerBound = 1; }));
    it('childUpper: upper bound', () => expectChange('C1', L => { L.A1.upperBound = 5; }));
    it('childAbstract: abstract flag of a child', () => expectChange('C1', L => { L.O1.abstract = true; }));
    it('childComposition: reference made a composition', () => expectChange('C1', L => { L.R1.composition = true; }));
    it('childAggregation: reference made an aggregation', () => expectChange('C1', L => { L.R1.aggregation = true; }));
    it('childDefaultValue: default value literal', () => expectChange('C1', L => { L.A1.defaultValueLiteral = '1'; }));
    it('childOppositeName: the opposite reference renamed', () => expectChange('C1', L => { L.R2.name = 'back2'; }));
    it('paramName: operation parameter renamed', () => expectChange('C1', L => { L.PA1.name = 'y'; }));
    it('paramTypeName: the parameter type renamed', () => expectChange('C1', L => { L.T3.name = 'Text'; }));
    it('refTypeAncestry + ancestryName: the reference target\'s package renamed (fullname)',
        () => expectChange('C1', L => { L.P3.name = 'pkg3b'; }));
    it('parentAncestry: the parent class renamed', () => expectChange('C1', L => { L.C2.name = 'Named2'; }));
    it('ancestryModelId: the parent moved to a same-named metamodel',
        () => expectChange('C1', L => { L.P2.father = 'M3'; }));
    it('ownModelId: the class moved to a same-named metamodel',
        () => expectChange('C1', L => { L.P.father = 'M4'; }));
});

describe('vertexChildrenHash: enum node', () => {
    it('childName: literal renamed', () => expectChange('E1', L => { L.L1.name = 'ROSSO'; }));
    it('childLiteralValue: literal raw value', () => expectChange('E1', L => { L.L1.value = 7; }));
    it('literal order', () => expectChange('E1', L => { L.E1.literals = ['L2', 'L1']; }));
});

describe('vertexChildrenHash: object node (slots, metamodel facts, reference targets)', () => {
    it('childValues: attribute slot edited', () => expectChange('OB1', L => { L.V1.values = ['43']; }));
    it('metaclassName: the metaclass renamed', () => expectChange('OB1', L => { L.C1.name = 'Human'; }));
    it('metaclassEnumLiteral: a literal of an enum typing a metaclass attribute, no slot for it',
        () => expectChange('OB1', L => { L.LM1.name = 'SAD'; }));
    it('slotFeatureId: slot pointed at a same-content feature', () => expectChange('OB1', L => { L.V1.instanceof = 'A1b'; }));
    it('slotFeatureName: the slot\'s M2 attribute renamed', () => expectChange('OB1', L => { L.A1.name = 'years'; }));
    it('slotFeatureUpper: the slot\'s feature upper bound', () => expectChange('OB1', L => { L.A1.upperBound = 5; }));
    it('slotFeatureLower: the slot\'s feature lower bound', () => expectChange('OB1', L => { L.A1.lowerBound = 1; }));
    it('slotFeatureDerived: the slot\'s feature made derived', () => expectChange('OB1', L => { L.A1.derived = true; }));
    it('slotAnnotationSource: an annotation of the slot\'s feature', () => expectChange('OB1', L => { L.AN1.source = 'renderer=chip'; }));
    it('slotTypeId: the slot\'s feature retyped to a same-content enum', () => expectChange('OB1', L => { L.A3.type = 'E1b'; }));
    it('slotTypeName: the slot\'s enum type renamed', () => expectChange('OB1', L => { L.E1.name = 'Colour'; }));
    it('slotLiteralName: a literal of the slot\'s enum type renamed', () => expectChange('OB1', L => { L.L1.name = 'ROSSO'; }));
    it('slotLiteralValue: a literal raw value of the slot\'s enum type', () => expectChange('OB1', L => { L.L1.value = 7; }));
    it('targetDataName: the reference target renamed (data.name)', () => expectChange('OB1', L => { L.OB2.name = 'bobby'; }));
    it('targetNameSlot: the reference target\'s name slot edited', () => expectChange('OB1', L => { L.V4.values = ['robert']; }));
    it('targetMetaclassName: the target\'s metaclass renamed (name fallback)', () => expectChange('OB1', L => { L.C3.name = 'Other2'; }));
    it('the reference target deleted (broken pointer)', () => expectChange('OB1', L => { delete L.OB2; }));
});

describe('vertexChildrenHash: what must not change it', () => {
    it('an unrelated write leaves every hash equal', () => {
        for (const of of ['C1', 'E1', 'OB1']) {
            const [a, b] = hashes(of, L => {
                L.UNREL.name = 'Other3';
                L.V5.values = ['zed2'];
                L.OB3.name = 'zed2';
                L.A1.ordered = true; // a field no transformer reads
            });
            expect(b, of).toBe(a);
        }
    });
    it('the same content under new object identities gives the same hash', () => {
        const L = fixture();
        const copy: L = JSON.parse(JSON.stringify(L));
        for (const of of ['C1', 'E1', 'OB1', 'P']) expect(vertexChildrenHash(copy, copy[of]), of).toBe(vertexChildrenHash(L, L[of]));
    });
    it('no model element gives 0', () => {
        expect(vertexChildrenHash(fixture(), undefined)).toBe(0);
    });
});
