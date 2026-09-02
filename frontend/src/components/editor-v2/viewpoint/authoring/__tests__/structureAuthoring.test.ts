/**
 * Unit tests for the level-2 Structure round-trip (Turno 7a/7b).
 *
 * Three properties, none of which any other test can catch, and all three irreversible
 * if they break: the saved IR has no VersionFixer (R-B9), so anything this slice writes
 * is written for good.
 *
 *  - a default is NOT persisted: the key is removed, and an emptied group disappears
 *    rather than staying as `{}`;
 *  - a value the current Symbol no longer offers stays in the IR and is not rendered —
 *    the panel falls back, it never silently repairs (the `double` border precedent);
 *  - `structure` as a whole becomes `undefined`, never `{}`, so a view whose fields were
 *    set and put back round-trips byte-identical to one that never carried them.
 */
import { describe, it, expect } from 'vitest';
import {
    DEFAULT_ACCENT,
    DEFAULT_COLUMNS,
    DEFAULT_EDGE_MARKER,
    DEFAULT_EMPTY_BEHAVIOR,
    DEFAULT_TYPE_DISPLAY,
    pruneStructure,
    resolveStructure,
    withStructure,
} from '../StructureGroups';
import { structureCapabilities } from '../../ir/structureCapabilities';
import type { StructureSpec } from '../../ir/irTypes';

const RECT = structureCapabilities('rect');
const STADIUM = structureCapabilities('stadium');

describe('withStructure — a default is the absence of the key', () => {
    it('writes a leaf and removes it again, leaving nothing behind', () => {
        const one = withStructure(undefined, 'accentPlacement', 'left');
        expect(one).toEqual({ accentPlacement: 'left' });

        const back = withStructure(one, 'accentPlacement', undefined);
        // Not `{ accentPlacement: undefined }`, and not `{}`: undefined.
        expect(back).toBeUndefined();
    });

    it('removes an emptied nested group rather than leaving `{}`', () => {
        const set = withStructure(undefined, 'name.position', 'center');
        expect(set).toEqual({ name: { position: 'center' } });

        const cleared = withStructure(set, 'name.position', undefined);
        expect(cleared).toBeUndefined();
    });

    it('keeps the sibling leaf when only one of a group is cleared', () => {
        let s = withStructure(undefined, 'name.position', 'below');
        s = withStructure(s, 'name.typeDisplay', 'chip');
        expect(s).toEqual({ name: { position: 'below', typeDisplay: 'chip' } });

        s = withStructure(s, 'name.position', undefined);
        expect(s).toEqual({ name: { typeDisplay: 'chip' } });
        expect(Object.keys(s!.name!)).toEqual(['typeDisplay']);
    });

    it('never mutates the spec it was handed', () => {
        const before: StructureSpec = { name: { position: 'below' }, edgeMarker: false };
        const snapshot = JSON.stringify(before);
        withStructure(before, 'name.typeDisplay', 'badge');
        withStructure(before, 'edgeMarker', undefined);
        expect(JSON.stringify(before)).toBe(snapshot);
    });

    it('writes the two non-string leaves with their own types', () => {
        expect(withStructure(undefined, 'compartment.columns', 3)).toEqual({ compartment: { columns: 3 } });
        expect(withStructure(undefined, 'edgeMarker', false)).toEqual({ edgeMarker: false });
    });
});

describe('pruneStructure', () => {
    it('turns an empty spec into undefined', () => {
        expect(pruneStructure({})).toBeUndefined();
        expect(pruneStructure({ name: {}, compartment: {} })).toBeUndefined();
    });

    it('keeps a spec that still says something', () => {
        expect(pruneStructure({ name: {}, emptyBehavior: 'hide' })).toEqual({ emptyBehavior: 'hide' });
    });
});

describe('resolveStructure — defaults come from the Symbol, not from the schema', () => {
    it('resolves an absent spec to the rectangle\'s neutral configuration (7a)', () => {
        const r = resolveStructure(undefined, RECT);
        expect(r).toMatchObject({
            namePosition: 'header-band',
            typeDisplay: DEFAULT_TYPE_DISPLAY,
            accentPlacement: 'none',
            accent: DEFAULT_ACCENT,
            mode: 'inline',
            columns: DEFAULT_COLUMNS,
            emptyBehavior: DEFAULT_EMPTY_BEHAVIOR,
            edgeMarker: DEFAULT_EDGE_MARKER,
        });
        expect(r.preserved).toEqual({});
    });

    it('resolves the same absent spec differently on a stadium (7b)', () => {
        const r = resolveStructure(undefined, STADIUM);
        expect(r.namePosition).toBe('center');
        expect(r.mode).toBe('none');
        expect(r.preserved).toEqual({});
    });
});

describe('resolveStructure — a value the Symbol dropped is kept, not rewritten', () => {
    const authored: StructureSpec = {
        name: { position: 'header-band' },
        accentPlacement: 'top',
        compartment: { mode: 'inline' },
    };

    it('renders the rectangle\'s authored values as authored', () => {
        const r = resolveStructure(authored, RECT);
        expect(r.namePosition).toBe('header-band');
        expect(r.accentPlacement).toBe('top');
        expect(r.mode).toBe('inline');
        expect(r.preserved).toEqual({});
    });

    it('falls back on a stadium, and reports what it is holding back', () => {
        const r = resolveStructure(authored, STADIUM);
        expect(r.namePosition).toBe('center');
        expect(r.accentPlacement).toBe('none');
        expect(r.mode).toBe('none');
        expect(r.preserved).toEqual({
            'name.position': 'header-band',
            accentPlacement: 'top',
            'compartment.mode': 'inline',
        });
    });

    it('leaves the IR itself untouched, so the values come back with the Symbol', () => {
        const snapshot = JSON.stringify(authored);
        resolveStructure(authored, STADIUM);
        expect(JSON.stringify(authored)).toBe(snapshot);
        expect(resolveStructure(authored, RECT).namePosition).toBe('header-band');
    });
});
