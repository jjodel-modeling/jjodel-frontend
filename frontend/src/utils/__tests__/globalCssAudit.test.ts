/**
 * Unit tests for globalCssAudit — which views repaint the canvas through global CSS.
 *
 * These assert the shipped module, and in particular they assert against the REAL
 * factory constant imported from view/viewElement/defaultViewCss: that is the whole
 * reason the constant was extracted out of the DViewElement constructor. A test
 * carrying its own copy of the baseline would go green while the product compares
 * against a different text.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { DEFAULT_VIEW_CSS } from '../../view/viewElement/defaultViewCss';
import {
    auditGlobalCss,
    markWarned,
    resetGlobalCssAuditMemory,
    type ViewCssDescriptor,
} from '../globalCssAudit';

/** A regular, non-default view with global css on. Overridden per case. */
function view(over: Partial<ViewCssDescriptor> = {}): ViewCssDescriptor {
    return {
        id: 'v1',
        name: 'View 1',
        css: DEFAULT_VIEW_CSS,
        cssIsGlobal: true,
        isViewpoint: false,
        isExclusiveView: false,
        isDefault: false,
        isActive: false,
        ...over,
    };
}

const AUTHORED = DEFAULT_VIEW_CSS + '\n.mm-node { background: red !important; }\n';
const TOP_LEVEL_ONLY = '.mm-node { background: red !important; }';

describe('the predicate', () => {
    it('stays silent on the untouched factory block', () => {
        expect(auditGlobalCss([view()]).culprits).toEqual([]);
    });

    it('stays silent when the factory block differs only by whitespace', () => {
        const reindented = DEFAULT_VIEW_CSS.replace(/\n/g, '\n   ') + '\n\n';
        expect(auditGlobalCss([view({ css: reindented })]).culprits).toEqual([]);
    });

    it('fires when the author appends an !important rule to the factory block', () => {
        const { culprits } = auditGlobalCss([view({ css: AUTHORED })]);
        expect(culprits).toEqual([{ id: 'v1', name: 'View 1', isViewpoint: false }]);
    });

    it('fires on a top-level !important, with no nesting: two conjuncts, not three', () => {
        expect(auditGlobalCss([view({ css: TOP_LEVEL_ONLY })]).culprits).toHaveLength(1);
    });

    it('stays silent when cssIsGlobal is off, however bad the css is', () => {
        expect(auditGlobalCss([view({ css: AUTHORED, cssIsGlobal: false })]).culprits).toEqual([]);
    });

    it('stays silent on authored css that carries no !important', () => {
        expect(auditGlobalCss([view({ css: '.mm-node { background: red; }' })]).culprits).toEqual([]);
    });
});

describe('the active-viewpoint gate of view.tsx:778-782', () => {
    const exclusiveVP = { css: AUTHORED, isViewpoint: true, isExclusiveView: true, isDefault: false };

    it('skips an exclusive non-default viewpoint that is not the active one', () => {
        expect(auditGlobalCss([view({ ...exclusiveVP, isActive: false })]).culprits).toEqual([]);
    });

    it('counts the same viewpoint once it is active', () => {
        expect(auditGlobalCss([view({ ...exclusiveVP, isActive: true })]).culprits).toHaveLength(1);
    });

    it('counts a default viewpoint whether or not it is active', () => {
        const d = { css: AUTHORED, isViewpoint: true, isExclusiveView: true, isDefault: true };
        expect(auditGlobalCss([view({ ...d, isActive: false })]).culprits).toHaveLength(1);
    });

    it('counts an overlay viewpoint whether or not it is active', () => {
        const o = { css: AUTHORED, isViewpoint: true, isExclusiveView: false, isDefault: false };
        expect(auditGlobalCss([view({ ...o, isActive: false })]).culprits).toHaveLength(1);
    });

    it('counts a regular view whatever viewpoint is active', () => {
        expect(auditGlobalCss([view({ css: AUTHORED, isActive: false })]).culprits).toHaveLength(1);
    });
});

describe('aggregation and the dedup key', () => {
    it('returns every culprit in one result, sorted by id', () => {
        const { culprits } = auditGlobalCss([
            view({ id: 'b', name: 'B', css: AUTHORED }),
            view({ id: 'a', name: 'A', css: AUTHORED }),
        ]);
        expect(culprits.map((c) => c.id)).toEqual(['a', 'b']);
    });

    it('does not depend on the order the descriptors arrive in', () => {
        const one = auditGlobalCss([view({ id: 'a', css: AUTHORED }), view({ id: 'b', css: AUTHORED })]);
        const two = auditGlobalCss([view({ id: 'b', css: AUTHORED }), view({ id: 'a', css: AUTHORED })]);
        expect(one.key).toBe(two.key);
    });

    it('changes when the css of a culprit changes', () => {
        const before = auditGlobalCss([view({ css: AUTHORED })]);
        const after = auditGlobalCss([view({ css: AUTHORED + '.x { color: blue !important; }' })]);
        expect(after.key).not.toBe(before.key);
    });

    it('changes when a culprit joins the set', () => {
        const one = auditGlobalCss([view({ id: 'a', css: AUTHORED })]);
        const two = auditGlobalCss([view({ id: 'a', css: AUTHORED }), view({ id: 'b', css: AUTHORED })]);
        expect(two.key).not.toBe(one.key);
    });
});

describe('the session dedup memory', () => {
    beforeEach(() => resetGlobalCssAuditMemory());

    it('lets the same key through exactly once', () => {
        expect(markWarned('k')).toBe(true);
        expect(markWarned('k')).toBe(false);
        expect(markWarned('k')).toBe(false);
    });

    it('lets a different key through', () => {
        expect(markWarned('k1')).toBe(true);
        expect(markWarned('k2')).toBe(true);
    });

    it('is what makes a repeated activation silent and a changed css speak again', () => {
        const first = auditGlobalCss([view({ css: AUTHORED })]);
        expect(markWarned(first.key)).toBe(true);
        // same activation, nothing edited
        expect(markWarned(auditGlobalCss([view({ css: AUTHORED })]).key)).toBe(false);
        // the author edits the offending css
        const edited = auditGlobalCss([view({ css: AUTHORED + '.y { color: red !important; }' })]);
        expect(markWarned(edited.key)).toBe(true);
    });
});
