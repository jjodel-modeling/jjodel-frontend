/**
 * Unit tests for readViewParenting — the candidate list of the "Parent view" select.
 *
 * The list is not cosmetic: it is where the co-membership rule (D-4-2) and the
 * no-cycle rule (D-4-6) are enforced. A view offered from another viewpoint would
 * create the divergence the cascade exists to prevent; a descendant offered as a
 * selectable parent would create a cycle, and the upward walks in view.tsx have no
 * visited set.
 *
 * Since 2026-08-10 the list also reproduces the nesting of the Tree card: depth-first
 * from the root of the viewpoint, siblings by name, one indent step per level. The
 * forbidden entries are DISABLED rather than removed, so the two renderings of the same
 * hierarchy cannot disagree on what exists.
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
/** Every option the user can actually pick. */
const selectable = (s: ViewSubtreeSource, id: string) =>
    readViewParenting(s, id).parentOptions.filter(o => !o.isDisabled).map(o => o.value);
const disabled = (s: ViewSubtreeSource, id: string) =>
    readViewParenting(s, id).parentOptions.filter(o => o.isDisabled).map(o => o.value);
/** `value@depth`, the shape of the tree without the indent characters. */
const shape = (s: ViewSubtreeSource, id: string) =>
    readViewParenting(s, id).parentOptions.map(o => `${o.value}@${o.depth}`);

const NBSP = '\u00A0';

describe('readViewParenting', () => {
    it('offers the root of the viewpoint as the first entry', () => {
        const opts = readViewParenting(project(), 'child').parentOptions;
        expect(opts[0]).toEqual({ value: 'vpA', label: '(root of Alpha)', depth: 0 });
    });

    it('offers the views of the same viewpoint and no others', () => {
        expect(values(project(), 'child').sort()).toEqual(['child', 'grandchild', 'root', 'sibling', 'vpA']);
        expect(values(project(), 'child')).not.toContain('other');
        expect(values(project(), 'child')).not.toContain('vpB');
    });

    it('reproduces the nesting of the tree, depth-first, siblings by name', () => {
        // Root ("Root") before Sibling ("Sibling"), each followed by its own descendants.
        expect(shape(project(), 'sibling')).toEqual([
            'vpA@0', 'root@1', 'child@2', 'grandchild@3', 'sibling@1',
        ]);
    });

    it('indents the label by one step per level, in non-breaking spaces', () => {
        const opts = readViewParenting(project(), 'sibling').parentOptions;
        const byId = Object.fromEntries(opts.map(o => [o.value, o.label]));
        expect(byId.vpA).toBe('(root of Alpha)');
        expect(byId.root).toBe(`${NBSP.repeat(4)}Root`);
        expect(byId.child).toBe(`${NBSP.repeat(8)}Child`);
        expect(byId.grandchild).toBe(`${NBSP.repeat(12)}Grandchild`);
    });

    it('disables the view itself instead of hiding it (D-4-6)', () => {
        expect(values(project(), 'root')).toContain('root');
        expect(selectable(project(), 'root')).not.toContain('root');
    });

    it('disables the whole subtree, not just the direct children (D-4-6)', () => {
        expect(disabled(project(), 'root')).toEqual(['root', 'child', 'grandchild']);
        expect(selectable(project(), 'root')).toEqual(['vpA', 'sibling']);
    });

    it('leaves the rest of the tree selectable while a branch is disabled', () => {
        // Editing `child`: itself and `grandchild` are out, `root` and `sibling` are in.
        expect(disabled(project(), 'child')).toEqual(['child', 'grandchild']);
        expect(selectable(project(), 'child')).toEqual(['vpA', 'root', 'sibling']);
    });

    it('keeps the disabled entries in their own place in the hierarchy', () => {
        // `child` stays under `root`, at depth 2, even though it cannot be picked.
        expect(shape(project(), 'child')).toEqual([
            'vpA@0', 'root@1', 'child@2', 'grandchild@3', 'sibling@1',
        ]);
    });

    it('never offers an empty value: "None" is gone (D-4-7)', () => {
        for (const id of ['root', 'child', 'grandchild', 'sibling']) {
            expect(values(project(), id)).not.toContain('');
        }
    });

    it('sorts siblings by name at every level, root aside', () => {
        const s = project();
        s.idlookup.sibling.name = 'Zulu';
        s.idlookup.grandchild.father = 'vpA';   // promoted next to root, name "Grandchild"
        expect(readViewParenting(s, 'child').parentOptions.map(o => o.value))
            .toEqual(['vpA', 'grandchild', 'root', 'child', 'sibling']);
    });

    it('lists a co-located view the walk cannot reach, flat after the tree', () => {
        // A dangling `father`: the view belongs to the viewpoint but hangs off nothing in
        // it. Dropping it would remove a legitimate parent from the list.
        const s = project();
        s.idlookup.sibling.father = 'ghost';
        const opts = readViewParenting(s, 'child').parentOptions;
        expect(opts.map(o => o.value)).toEqual(['vpA', 'root', 'child', 'grandchild', 'sibling']);
        expect(opts[opts.length - 1]).toMatchObject({ value: 'sibling', depth: 1 });
    });

    it('terminates on a cycle among co-located views, listing each one once', () => {
        // root -> sibling -> root. Nothing hangs from the viewpoint root any more, so the
        // whole set comes out of the flat tail, by name, each entry emitted exactly once.
        // The assertion is the invariant, not the order: what must hold is that the walk
        // ends and that no view is lost or duplicated.
        const s = project();
        s.idlookup.root.father = 'sibling';
        s.idlookup.sibling.father = 'root';
        const opts = readViewParenting(s, 'grandchild').parentOptions;
        const ids = opts.map(o => o.value);
        expect(new Set(ids).size).toBe(ids.length);
        expect(ids.slice().sort()).toEqual(['child', 'grandchild', 'root', 'sibling', 'vpA']);
        // The edited view stays forbidden even when the hierarchy around it is broken.
        expect(opts.find(o => o.value === 'grandchild')?.isDisabled).toBe(true);
    });

    it('reports the viewpoint from the persisted field, not from the father chain', () => {
        const s = project();
        s.idlookup.child.viewpoint = 'vpB';      // the divergence the cascade repairs
        const facts = readViewParenting(s, 'child');
        expect(facts.viewpointId).toBe('vpB');
        expect(facts.viewpointName).toBe('Beta');
        expect(facts.parentOptions.map(o => o.value)).toEqual(['vpB', 'other', 'child']);
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

    // fatherName feeds the read-only breadcrumb (U-2). It comes from the same idlookup
    // read as the row below it, so the two cannot disagree.
    it('names the father of a child view', () => {
        expect(readViewParenting(project(), 'child').fatherName).toBe('Root');
        expect(readViewParenting(project(), 'grandchild').fatherName).toBe('Child');
    });

    it('names the viewpoint as the father of a top-level view', () => {
        // `father = viewpoint` is how a top-level view is stored (D-4-7): the name is
        // the viewpoint's own, which is why the breadcrumb drops the segment there.
        expect(readViewParenting(project(), 'root').fatherName).toBe('Alpha');
    });

    it('leaves the father nameless when there is no father', () => {
        const s = project();
        s.idlookup.sibling.father = '';
        s.idlookup.sibling.viewpoint = undefined;
        expect(readViewParenting(s, 'sibling').fatherName).toBeUndefined();
    });
});
