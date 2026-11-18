import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// P-2026-11-01-2351 (open points 2 and 3 of P-2026-11-01-2300): the Ecore export writes
// defaultValueLiteral again, and the import keeps a literal's label and an enumeration's serializable
// flag. The export half runs EcoreService's own exportAttribute / exportEnumerator on plain objects; the
// XML they produce is parsed by a small reader into the Element shape xmlToJson takes, and the JSON
// handed to EcoreParser.parse is read with the helpers EcoreParser.parseDEnum / parseDEnumLiteral /
// parseDAttribute call (ecoreFeatureReads.ts). Same stub joiner as ecore-import-losses.test.ts.
const h = vi.hoisted(() => ({
    parse: (() => {}) as any,
}));

vi.mock('../../../joiner', () => {
    const named: Record<string, any> = {
        EcoreParser: { parse: (...a: any[]) => h.parse(...a) },
        DModel: { cname: 'DModel' },
        LPointerTargetable: { fromD: (d: any) => ({ id: d.id, name: d.name }) },
        store: { getState: () => ({ m2models: [], idlookup: {} }) },
        Defaults: {
            Pointer_EXPRESSION: 'Pointer_EXPRESSION', Pointer_ACTION: 'Pointer_ACTION',
            primitiveTypeIds: new Set(['Pointer_ESTRING', 'Pointer_EINT', 'Pointer_EBOOLEAN']),
        },
    };
    return new Proxy(named, {
        get: (t, k) => (k === 'then' ? undefined
            : k in t ? t[k as string]
            : class Stub { static cname = String(k); }),
        has: () => true,
    });
});

import { EcoreService } from '../EcoreService';
import {
    ecoreDefaultValueLiteral, ecoreLiteralValue, ecoreLiteralLabel, ecoreEnumSerializable,
} from '../ecoreFeatureReads';

const svc = EcoreService as any;

// --- a reader for the XML the exporter writes: tags, attributes, nesting, self-closing -------------

function unescapeXml(s: string): string {
    return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
}

function readXml(xml: string): any {
    const tag = /<(\/?)([\w:]+)((?:\s+[\w:]+="[^"]*")*)\s*(\/?)>/g;
    const stack: any[] = [{ children: [] }];
    let m: RegExpExecArray | null;
    while ((m = tag.exec(xml))) {
        const [, closing, tagName, rawAttrs, selfClosing] = m;
        if (closing) { stack.pop(); continue; }
        const attributes = [...rawAttrs.matchAll(/([\w:]+)="([^"]*)"/g)].map(a => ({ name: a[1], value: unescapeXml(a[2]) }));
        const node = { tagName, attributes, children: [] as any[], textContent: '' };
        stack[stack.length - 1].children.push(node);
        if (!selfClosing) stack.push(node);
    }
    return stack[0].children[0];
}

let currentRoot: any = null;
class FakeDOMParser {
    parseFromString() { return { querySelector: () => null, documentElement: currentRoot }; }
}

/** Export pieces wrapped in an EPackage, read back as EcoreParser.parse receives them. */
function roundTrip(...pieces: string[]): any {
    currentRoot = readXml(`<ecore:EPackage name="p" nsURI="http://p/2351" nsPrefix="p">${pieces.join('')}</ecore:EPackage>`);
    const parse = vi.fn(() => [{ id: 'M_new', className: 'DModel', name: 'p' }]);
    h.parse = parse;
    const r = EcoreService.importFromXML('<x/>', 'p');
    expect(r.success).toBe(true);
    return (parse.mock.calls[0] as any[])[0];
}

const many = (v: any): any[] => (v === undefined ? [] : Array.isArray(v) ? v : [v]);

const ptr = (id: string, name: string) => ({ id, name });
const attribute = (name: string, type: any, extra: Record<string, unknown> = {}) =>
    ({ name, type, lowerBound: 0, upperBound: 1, changeable: true, ...extra, __raw: {} }); // L accessor, not __raw (R-TXT-25 (8))

const ATTRS = [
    attribute('level', ptr('Pointer_EINT', 'EInt'), { defaultValueLiteral: '7' }),
    attribute('enabled', ptr('Pointer_EBOOLEAN', 'EBoolean'), { defaultValueLiteral: 'true' }),
    attribute('label', ptr('Pointer_ESTRING', 'EString'), { defaultValueLiteral: 'say "hi" & <go>' }),
    attribute('mode', ptr('Pointer_Mode', 'Mode'), { defaultValueLiteral: 'Mid' }),
    attribute('width', ptr('Pointer_EINT', 'EInt')),
    attribute('empty', ptr('Pointer_ESTRING', 'EString'), { defaultValueLiteral: '' }),
];

const enumerator = (name: string, literals: [string, number, string?][], extra: Record<string, unknown> = {}) => ({
    name, literals: literals.map(([n, value, literal]) => ({ name: n, __raw: { value, literal } })), ...extra,
});

describe('Ecore export writes defaultValueLiteral (P-2026-11-01-2351)', () => {
    it('writes the default of an EInt, EBoolean, EString (escaped) and enum attribute', () => {
        const xml = (n: number) => svc.exportAttribute(ATTRS[n], '  ');
        expect(xml(0)).toContain('defaultValueLiteral="7"');
        expect(xml(1)).toContain('defaultValueLiteral="true"');
        expect(xml(2)).toContain('defaultValueLiteral="say &quot;hi&quot; &amp; &lt;go&gt;"');
        expect(xml(3)).toContain('defaultValueLiteral="Mid"');
    });

    it('writes no defaultValueLiteral for an attribute with none, or an empty one (per contrasto)', () => {
        expect(svc.exportAttribute(ATTRS[4], '  ')).not.toContain('defaultValueLiteral');
        expect(svc.exportAttribute(ATTRS[5], '  ')).not.toContain('defaultValueLiteral');
    });
});

describe('Ecore round trip keeps defaults, literal values, labels and serializable (P-2026-11-01-2351)', () => {
    beforeEach(() => { vi.stubGlobal('DOMParser', FakeDOMParser); });
    afterEach(() => { vi.unstubAllGlobals(); });

    const classifier = (json: any, name: string) => many(json.eClassifiers).find((c: any) => c['-name'] === name);

    it('defaults survive export then import', () => {
        const cls = `<eClassifiers xsi:type="ecore:EClass" name="Sys">${ATTRS.map(a => svc.exportAttribute(a, '  ')).join('')}</eClassifiers>`;
        const json = roundTrip(cls);
        const read = (name: string) => ecoreDefaultValueLiteral(many(classifier(json, 'Sys').eStructuralFeatures).find((f: any) => f['-name'] === name));
        expect([read('level'), read('enabled'), read('label'), read('mode'), read('width'), read('empty')])
            .toEqual(['7', 'true', 'say "hi" & <go>', 'Mid', '', '']);
    });

    it('literal values and labels different from the names survive', () => {
        const en = enumerator('Mode', [['Low', 0], ['Mid', 5, 'middle'], ['High', 9, 'High']]);
        const json = roundTrip(svc.exportEnumerator(en, '  ', '\n'));
        const lits = many(classifier(json, 'Mode').eLiterals);
        expect(lits.map((l: any) => [l['-name'], ecoreLiteralValue(l), ecoreLiteralLabel(l)]))
            .toEqual([['Low', 0, ''], ['Mid', 5, 'middle'], ['High', 9, '']]);
    });

    it('serializable="false" survives, and an unset flag reads true', () => {
        const off = roundTrip(svc.exportEnumerator(enumerator('Off', [['A', 0]], { serializable: false }), '  ', '\n'));
        const on = roundTrip(svc.exportEnumerator(enumerator('On', [['A', 0]], { serializable: true }), '  ', '\n'));
        expect(ecoreEnumSerializable(classifier(off, 'Off'))).toBe(false);
        expect(ecoreEnumSerializable(classifier(on, 'On'))).toBe(true);
    });

    it('answers a missing element with the D-layer defaults', () => {
        expect(ecoreLiteralLabel(undefined)).toBe('');
        expect(ecoreEnumSerializable(undefined)).toBe(true);
    });
});
