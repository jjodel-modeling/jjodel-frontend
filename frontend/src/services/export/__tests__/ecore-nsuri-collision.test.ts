import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// P-2026-10-31-1711: an Ecore whose nsURI is already loaded is refused before the parser runs.
// EcoreService loads under a stub joiner (as in ecore-io.test.ts); the parser and the store are
// the two seams the guard sits between, so both are controlled here.
const h = vi.hoisted(() => ({
    parse: (() => {}) as any,
    state: {} as any,
}));

vi.mock('../../../joiner', () => {
    const named: Record<string, any> = {
        EcoreParser: { parse: (...a: any[]) => h.parse(...a) },
        DModel: { cname: 'DModel' },
        LPointerTargetable: { fromD: (d: any) => ({ id: d.id, name: d.name }) },
        store: { getState: () => h.state },
        Defaults: { primitiveTypeIds: new Set<string>() },
    };
    return new Proxy(named, {
        get: (t, k) => (k === 'then' ? undefined
            : k in t ? t[k as string]
            : class Stub { static cname = String(k); }),
        has: () => true,
    });
});

import { EcoreService } from '../EcoreService';
import { readEcoreNsURIs, ecoreCollision, ecoreCollisionMessage } from '../ecoreNsURI';

// Minimal Element for EcoreService.xmlToJson: attributes, children, textContent.
function el(tagName: string, attrs: Record<string, string>, children: any[] = []): any {
    return {
        tagName,
        attributes: Object.entries(attrs).map(([name, value]) => ({ name, value })),
        children,
        textContent: '',
    };
}

let root: any;
class FakeDOMParser {
    parseFromString() { return { querySelector: () => null, documentElement: root }; }
}

// Loaded project: metamodel "Families" at http://families/1.0, with a sub-package at
// http://families/1.0/sub.
function loadedState(): any {
    return {
        m2models: ['M_fam'],
        idlookup: {
            M_fam: { id: 'M_fam', name: 'Families', packages: ['P_fam'] },
            P_fam: { id: 'P_fam', name: 'families', uri: 'http://families/1.0', subpackages: ['P_sub'] },
            P_sub: { id: 'P_sub', name: 'sub', uri: 'http://families/1.0/sub', subpackages: [] },
        },
    };
}

describe('Ecore import: nsURI already loaded (P-2026-10-31-1711)', () => {
    let parse: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        parse = vi.fn(() => [{ id: 'M_new', className: 'DModel', name: 'imported' }]);
        h.parse = parse;
        h.state = loadedState();
        vi.stubGlobal('DOMParser', FakeDOMParser);
    });
    afterEach(() => { vi.unstubAllGlobals(); });

    it('refuses an nsURI equal to a loaded metamodel, names it, and writes nothing', () => {
        root = el('ecore:EPackage', { name: 'families', nsURI: 'http://families/1.0' });
        const r = EcoreService.importFromXML('<x/>', 'Families2');
        expect(r.success).toBe(false);
        expect(r.model).toBeUndefined();
        expect(r.errors).toEqual([
            'The metamodel "Families" already uses the nsURI "http://families/1.0". '
            + 'Delete or rename the loaded metamodel first, then import again.',
        ]);
        expect(parse).not.toHaveBeenCalled();
    });

    it('refuses an nsURI equal to a loaded sub-package', () => {
        root = el('ecore:EPackage', { name: 'other', nsURI: 'http://families/1.0/sub' });
        const r = EcoreService.importFromXML('<x/>', 'Other');
        expect(r.success).toBe(false);
        expect(r.errors[0]).toContain('"Families"');
        expect(parse).not.toHaveBeenCalled();
    });

    it('refuses a wrapped multi-package Ecore when one package collides', () => {
        root = el('xmi:XMI', {}, [
            el('ecore:EPackage', { name: 'a', nsURI: 'http://a/1.0' }),
            el('ecore:EPackage', { name: 'families', nsURI: 'http://families/1.0' }),
        ]);
        const r = EcoreService.importFromXML('<x/>', 'Wrapped');
        expect(r.success).toBe(false);
        expect(r.errors[0]).toContain('"http://families/1.0"');
        expect(parse).not.toHaveBeenCalled();
    });

    it('imports an Ecore with a different nsURI', () => {
        root = el('ecore:EPackage', { name: 'families', nsURI: 'http://families/2.0' });
        const r = EcoreService.importFromXML('<x/>', 'Families2');
        expect(parse).toHaveBeenCalledTimes(1);
        expect(r.success).toBe(true);
        expect(r.model).toEqual({ id: 'M_new', name: 'imported' });
    });

    it('imports an Ecore with no nsURI, even when its name matches a loaded package', () => {
        root = el('ecore:EPackage', { name: 'families' });
        const r = EcoreService.importFromXML('<x/>', 'Families2');
        expect(parse).toHaveBeenCalledTimes(1);
        expect(r.success).toBe(true);
    });

    it('imports when no metamodel is loaded', () => {
        h.state = { m2models: [], idlookup: {} };
        root = el('ecore:EPackage', { name: 'families', nsURI: 'http://families/1.0' });
        const r = EcoreService.importFromXML('<x/>', 'Families');
        expect(parse).toHaveBeenCalledTimes(1);
        expect(r.success).toBe(true);
    });
});

describe('ecoreNsURI helpers', () => {
    it('readEcoreNsURIs: root package, wrapped packages, blank and missing nsURI', () => {
        expect(readEcoreNsURIs({ '-name': 'a', '-nsURI': 'http://a' })).toEqual(['http://a']);
        expect(readEcoreNsURIs({ 'ecore:EPackage': [{ '-nsURI': 'http://a' }, { '-nsURI': 'http://b' }, {}] }))
            .toEqual(['http://a', 'http://b']);
        expect(readEcoreNsURIs({ 'ecore:EPackage': { '-nsURI': 'http://c' } })).toEqual(['http://c']);
        expect(readEcoreNsURIs({ '-name': 'a', '-nsURI': '  ' })).toEqual([]);
        expect(readEcoreNsURIs({ '-name': 'a' })).toEqual([]);
        expect(readEcoreNsURIs(null)).toEqual([]);
    });

    it('ecoreCollision: first loaded metamodel on the nsURI, exact match only', () => {
        const loaded = [{ metamodel: 'A', nsURI: 'http://x' }, { metamodel: 'B', nsURI: 'http://x' }];
        expect(ecoreCollision({ '-nsURI': 'http://x' }, loaded)).toEqual({ metamodel: 'A', nsURI: 'http://x' });
        expect(ecoreCollision({ '-nsURI': 'http://x/' }, loaded)).toBeNull();
        expect(ecoreCollisionMessage({ metamodel: 'A', nsURI: 'http://x' }))
            .toBe('The metamodel "A" already uses the nsURI "http://x". Delete or rename the loaded metamodel first, then import again.');
    });
});
