/**
 * Unit tests for readViewParenting — the candidate list of the "Parent view" select.
 *
 * The list is not cosmetic: it is where the co-membership rule (D-4-2) and the
 * no-cycle rule (D-4-6) are enforced. A view offered from another viewpoint would
 * create the divergence the cascade exists to prevent; a descendant offered as a
 * parent would create a cycle, and the upward walks in view.tsx have no visited set.
 */
import { describe, it, expect } from 'vitest';
import { readViewParenting } from '../viewParentingOptions';
import type { ViewSubtreeSource } from '../../../view/viewElement/viewSubtree';

/**
 * A project with two viewpoints:
 *   vpA "Alpha"  ->  root  ->  child  ->  grandchild
 *                    sibling
 *   vpB "Beta"   ->  other
 */
function project(): ViewSubtreeSource {
    const d = (id: string, name: string, father: string | undefined, viewpoint: string | undefined) =>
        ({ id, name, father, viewpoint, className: 'DViewElement' });
    const idlookup: { [id: string]: any } = {
        vpA: { id: 'vpA', name: 'Alpha', viewpoint: 'vpA', className: 'DViewPoint' },
        vpB: { id: 'vpB', name: 'Beta', viewpoint: 'vpB', className: 'DViewPoint' },
        root: d('root', 'Root', 'vpA', 'vpA'),
        child: d('child', 'Child', 'root', 'vpA'),
        grandchild: d('grandchild', 'Grandchild', 'child', 'vpA'),
        sibling: d('sibling', 'Sibling', 'vpA', 'vpA'),
        other: d('other', 'Other', 'vpB', 'vpB'),
    };
    return { viewelements: ['root', 'child', 'grandchild', 'sibling', 'other'], idlookup };
}

const values = (s: ViewSubtreeSource, id: string) => readViewParenting(s, id).parentOptions.map(o => o.value);

describe('readViewParenting', () => {
    it('offers the root of the viewpoint as the first entry', () => {
        const opts = readViewParenting(project(), 'child').parentOptions;
        expect(opts[0]).toEqual({ value: 'vpA', label: '(root of Alpha)' });
    });

    it('offers the views of the same viewpoint and no others', () => {
        expect(values(project(), 'child')).toEqual(['vpA', 'root', 'sibling']);
    });

    it('excludes the view itself (D-4-6)', () => {
        expect(values(project(), 'root')).not.toContain('root');
    });

    it('excludes the whole subtree, not just the direct children (D-4-6)', () => {
        const opts = values(project(), 'root');
        expect(opts).not.toContain('child');
        expect(opts).not.toContain('grandchild');
        expect(opts).toEqual(['vpA', 'sibling']);
    });

    it('never offers an empty value: "None" is gone (D-4-7)', () => {
        for (const id of ['root', 'child', 'grandchild', 'sibling']) {
            expect(values(project(), id)).not.toContain('');
        }
    });

    it('sorts the co-located views by name, root aside', () => {
        const s = project();
        s.idlookup.sibling.name = 'Zulu';
        s.idlookup.grandchild.father = 'vpA';   // promoted next to root, name "Grandchild"
        expect(readViewParenting(s, 'child').parentOptions.map(o => o.label))
            .toEqual(['(root of Alpha)', 'Grandchild', 'Root', 'Zulu']);
    });

    it('reports the viewpoint from the persisted field, not from the father chain', () => {
        const s = project();
        s.idlookup.child.viewpoint = 'vpB';      // the divergence the cascade repairs
        const facts = readViewParenting(s, 'child');
        expect(facts.viewpointId).toBe('vpB');
        expect(facts.viewpointName).toBe('Beta');
        expect(facts.parentOptions.map(o => o.value)).toEqual(['vpB', 'other']);
    });

    it('counts the descendants that would follow a move', () => {
        expect(readViewParenting(project(), 'root').descendantCount).toBe(2);
        expect(readViewParenting(project(), 'child').descendantCount).toBe(1);
        expect(readViewParenting(project(), 'grandchild').descendantCount).toBe(0);
    });

    it('flags a detached view and offers it nothing to be co-located with', () => {
        const s = project();
        s.idlookup.sibling.father = '';
        s.idlookup.sibling.viewpoint = undefined;   // what set_father leaves behind on father=''
        const facts = readViewParenting(s, 'sibling');
        expect(facts.detached).toBe(true);
        expect(facts.viewpointId).toBeUndefined();
        expect(facts.parentOptions).toEqual([]);
    });

    it('does not flag a view whose father is the viewpoint itself', () => {
        expect(readViewParenting(project(), 'root').detached).toBe(false);
        expect(readViewParenting(project(), 'root').fatherId).toBe('vpA');
    });
});
