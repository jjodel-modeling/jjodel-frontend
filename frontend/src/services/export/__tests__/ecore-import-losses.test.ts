import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// P-2026-11-01-2300 (ticket #395): the Ecore import keeps an attribute's defaultValueLiteral and a
// literal's value. EcoreService loads under a stub joiner (as in ecore-nsuri-collision.test.ts) so
// its real xmlToJson runs; the JSON it hands to EcoreParser.parse is captured and read with the
// helpers EcoreParser.parseDAttribute and parseDEnumLiteral call (api/data.ts).
const h = vi.hoisted(() => ({
    parse: (() => {}) as any,
}));

vi.mock('../../../joiner', () => {
    const named: Record<string, any> = {
        EcoreParser: { parse: (...a: any[]) => h.parse(...a) },
        DModel: { cname: 'DModel' },
        LPointerTargetable: { fromD: (d: any) => ({ id: d.id, name: d.name }) },
        store: { getState: () => ({ m2models: [], idlookup: {} }) },
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
import { ecoreDefaultValueLiteral, ecoreLiteralValue } from '../ecoreFeatureReads';

// Minimal Element for EcoreService.xmlToJson: attributes, children, textContent.
function el(tagName: string, attrs: Record<string, string>, children: any[] = []): any {
    return {
        tagName,
        attributes: Object.entries(attrs).map(([name, value]) => ({ name, value })),
        children,
        textContent: '',
    };
}

const ECORE = 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//';
const attr = (name: string, eType: string, extra: Record<string, string> = {}) =>
    el('eStructuralFeatures', { 'xsi:type': 'ecore:EAttribute', name, eType, ...extra });

// The fixture .ecore of the prompt: EInt `level` defaulting to 7, EBoolean defaulting to true, EString
// with a default, an EEnum whose literals carry 0, 5, 9 (and one with no value), a class with own and
// inherited features.
const root = el('ecore:EPackage', { name: 'probe', nsURI: 'http://probe/2300', nsPrefix: 'probe' }, [
    el('eClassifiers', { 'xsi:type': 'ecore:EClass', name: 'Named', abstract: 'true' }, [
        attr('name', ECORE + 'EString'),
    ]),
    el('eClassifiers', { 'xsi:type': 'ecore:EClass', name: 'Sys', eSuperTypes: '#//Named' }, [
        attr('level', ECORE + 'EInt', { defaultValueLiteral: '7' }),
        attr('enabled', ECORE + 'EBoolean', { defaultValueLiteral: 'true' }),
        attr('label', ECORE + 'EString', { defaultValueLiteral: 'hello world' }),
        attr('mode', '#//Mode', { defaultValueLiteral: 'Mid' }),
        el('eStructuralFeatures', { 'xsi:type': 'ecore:EReference', name: 'parts', eType: '#//Sys', upperBound: '-1', containment: 'true' }),
        attr('width', ECORE + 'EInt'),
    ]),
    el('eClassifiers', { 'xsi:type': 'ecore:EEnum', name: 'Mode' }, [
        el('eLiterals', { name: 'Low', value: '0' }),
        el('eLiterals', { name: 'Mid', value: '5' }),
        el('eLiterals', { name: 'High', value: '9', literal: 'high' }),
        el('eLiterals', { name: 'Unset' }),
    ]),
]);

class FakeDOMParser {
    parseFromString() { return { querySelector: () => null, documentElement: root }; }
}

/** The JSON xmlToJson produced for the fixture, as EcoreParser.parse received it. */
function importedJson(): any {
    const parse = vi.fn(() => [{ id: 'M_new', className: 'DModel', name: 'probe' }]);
    h.parse = parse;
    const r = EcoreService.importFromXML('<x/>', 'probe');
    expect(r.success).toBe(true);
    expect(parse).toHaveBeenCalledTimes(1);
    return (parse.mock.calls[0] as any[])[0];
}

// xmlToJson keeps a lone child as an object and turns repeated ones into an array (EcoreService.ts:712-720).
const many = (v: any): any[] => (v === undefined ? [] : Array.isArray(v) ? v : [v]);

function classifier(json: any, name: string): any {
    const found = many(json.eClassifiers).find((c: any) => c['-name'] === name);
    expect(found, 'classifier ' + name).toBeTruthy();
    return found;
}

function feature(json: any, cls: string, name: string): any {
    const found = many(classifier(json, cls).eStructuralFeatures).find((f: any) => f['-name'] === name);
    expect(found, 'feature ' + cls + '.' + name).toBeTruthy();
    return found;
}

describe('Ecore import keeps defaultValueLiteral and literal values (P-2026-11-01-2300, #395)', () => {
    beforeEach(() => { vi.stubGlobal('DOMParser', FakeDOMParser); });
    afterEach(() => { vi.unstubAllGlobals(); });

    it('reads the default of an EInt, an EBoolean, an EString and an EEnum attribute', () => {
        const json = importedJson();
        expect(ecoreDefaultValueLiteral(feature(json, 'Sys', 'level'))).toBe('7');
        expect(ecoreDefaultValueLiteral(feature(json, 'Sys', 'enabled'))).toBe('true');
        expect(ecoreDefaultValueLiteral(feature(json, 'Sys', 'label'))).toBe('hello world');
        expect(ecoreDefaultValueLiteral(feature(json, 'Sys', 'mode'))).toBe('Mid');
    });

    it('reads no default where the .ecore declares none, own or inherited (per contrasto)', () => {
        const json = importedJson();
        expect(ecoreDefaultValueLiteral(feature(json, 'Sys', 'width'))).toBe('');
        expect(ecoreDefaultValueLiteral(feature(json, 'Named', 'name'))).toBe('');
    });

    it('reads each literal value as a number, 0 included', () => {
        const json = importedJson();
        const values = many(classifier(json, 'Mode').eLiterals).map((l: any) => [l['-name'], ecoreLiteralValue(l)]);
        expect(values.slice(0, 3)).toEqual([['Low', 0], ['Mid', 5], ['High', 9]]);
    });

    it('reads -Infinity, the sentinel the exporter skips, for a literal with no value (per contrasto)', () => {
        const json = importedJson();
        const unset = many(classifier(json, 'Mode').eLiterals).find((l: any) => l['-name'] === 'Unset');
        expect(ecoreLiteralValue(unset)).toBe(Number.NEGATIVE_INFINITY);
    });

    it('answers a missing element with the D-layer defaults', () => {
        expect(ecoreDefaultValueLiteral(undefined)).toBe('');
        expect(ecoreDefaultValueLiteral(null)).toBe('');
        expect(ecoreLiteralValue(undefined)).toBe(Number.NEGATIVE_INFINITY);
    });
});
