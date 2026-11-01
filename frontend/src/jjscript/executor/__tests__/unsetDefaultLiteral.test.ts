/**
 * An unset attribute reads its declared default from `defaultValueLiteral` (P-2026-11-01-2350; R-TXT-5).
 *
 * The editor (JjScript `set ... default`, set.ts) and the Ecore import (api/data.ts parseDAttribute) write an
 * attribute's declared default into `defaultValueLiteral`, a string; nothing fills `defaultValue`. The real
 * `buildEvalContext` runs here on a duck-typed L layer shaped like the editor's: attribute metas with
 * `defaultValueLiteral` set and `defaultValue` absent, objects whose `features` slots hold no value.
 *
 * Why the mocks: eval.ts reaches the joiner barrel (monaco, `window is not defined` under node) and `../utils`
 * (DockManager). The joiner is the Proxy stub of ecore-import-losses.test.ts, so the real EcoreService.xmlToJson
 * runs too; `../utils` hands over the project and the metamodel. `buildEvalContext`, `emptyAttributeDefault`,
 * JjEL and the default text generator run for real.
 */
import { readFileSync } from 'node:fs';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const h = vi.hoisted(() => ({
    project: null as any,
    metamodel: null as any,
    parse: (() => {}) as any,
}));

vi.mock('../../../joiner', () => {
    const named: Record<string, any> = {
        EcoreParser: { parse: (...a: any[]) => h.parse(...a) },
        DModel: { cname: 'DModel' },
        LPointerTargetable: { fromD: (d: any) => ({ id: d.id, name: d.name }), fromPointer: () => null },
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

vi.mock('../utils', () => ({
    getProject: () => h.project,
    getTargetMetamodel: () => h.metamodel,
}));

import { buildEvalContext } from '../commands/eval';
import { jjelEval } from '../../../jjel';
import { EcoreService } from '../../../services/export/EcoreService';
import { ecoreDefaultValueLiteral } from '../../../services/export/ecoreFeatureReads';
import { generate } from '../../../codegen/engine/generate';
import { decodeGeneratorFile } from '../../../codegen/engine/generatorFile';

// ── a duck-typed L layer, as the editor builds it ─────────────────────────────────────────────────────────
const MODE = { className: 'DEnumerator', name: 'Mode', literals: [{ name: 'Low' }, { name: 'Mid' }, { name: 'High' }] };
const prim = (name: string) => ({ className: 'DClass', name });

interface AttrSpec { readonly name: string; readonly type: any; readonly literal?: string; readonly lower?: number }

/** One class `Sys` with the given attributes, one model, one object `s1` whose attribute slots are all unset. */
function editorModel(attrs: readonly AttrSpec[], set: Record<string, unknown> = {}): void {
    const metas = attrs.map(a => ({
        className: 'DAttribute', name: a.name, type: a.type, upperBound: 1, lowerBound: a.lower ?? 0,
        defaultValueLiteral: a.literal ?? '', defaultValue: undefined,
    }));
    const cls = { className: 'DClass', name: 'Sys', attributes: metas, references: [], operations: [], extends: [], allSubclasses: [] };
    const s1 = {
        id: 's1', name: 's1', instanceof: cls,
        features: metas.map(m => ({ name: m.name, instanceof: m, value: set[m.name] })),
    };
    h.metamodel = { name: 'mm', classes: [cls], instances: [{ objects: [s1] }], enumerators: [MODE], packages: [] };
    h.project = { name: 'p', metamodels: [h.metamodel] };
}

const read = (expr: string) => jjelEval(expr, buildEvalContext({} as any));

describe('an unset attribute reads its declared default literal (P-2026-11-01-2350)', () => {
    it('EInt "7" reads 7 (kills: the literal ignored, or read as the string "7")', () => {
        editorModel([{ name: 'level', type: prim('EInt'), literal: '7' }]);
        expect(read('s1.level')).toBe(7);
    });

    it('EBoolean "false" reads false and "true" reads true (kills: Boolean("false") === true)', () => {
        editorModel([
            { name: 'off', type: prim('EBoolean'), literal: 'false' },
            { name: 'on', type: prim('EBoolean'), literal: 'true' },
        ]);
        expect(read('s1.off')).toBe(false);
        expect(read('s1.on')).toBe(true);
    });

    it('EString reads the string, EDouble "2.5" reads 2.5', () => {
        editorModel([
            { name: 'label', type: prim('EString'), literal: 'hello world' },
            { name: 'ratio', type: prim('EDouble'), literal: '2.5' },
        ]);
        expect(read('s1.label')).toBe('hello world');
        expect(read('s1.ratio')).toBe(2.5);
    });

    it('an enum literal name reads that literal, not the first one (kills: the canonical enum default)', () => {
        editorModel([{ name: 'mode', type: MODE, literal: 'Mid', lower: 1 }]);
        expect(read('s1.mode')).toBe('Mid');
    });

    it('"abc" on an EInt reads as if no default were declared: 0 when mandatory, null when optional (kills: Number("abc") read as 0 everywhere, or a throw)', () => {
        editorModel([
            { name: 'need', type: prim('EInt'), literal: 'abc', lower: 1 },
            { name: 'may', type: prim('EInt'), literal: 'abc' },
            { name: 'kind', type: MODE, literal: 'Nope' },
        ]);
        expect(read('s1.need')).toBe(0);
        expect(read('s1.may')).toBeNull();
        expect(read('s1.kind')).toBeNull();
    });

    it('neither a default nor a literal keeps today\'s reads; a set value wins over the literal (per contrasto)', () => {
        editorModel([
            { name: 'width', type: prim('EInt') },
            { name: 'count', type: prim('EInt'), lower: 1 },
            { name: 'level', type: prim('EInt'), literal: '7' },
        ], { level: 3 });
        expect(read('s1.width')).toBeNull();
        expect(read('s1.count')).toBe(0);
        expect(read('s1.level')).toBe(3);
    });

    it('the attribute shell shows the parsed literal as its defaultValue; null with none or unparsable (kills: the shell field left on defaultValue alone)', () => {
        editorModel([
            { name: 'level', type: prim('EInt'), literal: '7' },
            { name: 'off', type: prim('EBoolean'), literal: 'false' },
            { name: 'width', type: prim('EInt') },
            { name: 'may', type: prim('EInt'), literal: 'abc' },
        ]);
        expect(read('Sys.attributes.map(a => a.defaultValue)')).toEqual([7, false, null, null]);
    });
});

// ── the same reads on the Ecore-imported literals (the ecore-import-losses.test.ts fixture) ────────────────
function el(tagName: string, attrs: Record<string, string>, children: any[] = []): any {
    return { tagName, attributes: Object.entries(attrs).map(([name, value]) => ({ name, value })), children, textContent: '' };
}
const ECORE = 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//';
const attr = (name: string, eType: string, extra: Record<string, string> = {}) =>
    el('eStructuralFeatures', { 'xsi:type': 'ecore:EAttribute', name, eType, ...extra });
const root = el('ecore:EPackage', { name: 'probe', nsURI: 'http://probe/2300', nsPrefix: 'probe' }, [
    el('eClassifiers', { 'xsi:type': 'ecore:EClass', name: 'Sys' }, [
        attr('level', ECORE + 'EInt', { defaultValueLiteral: '7' }),
        attr('enabled', ECORE + 'EBoolean', { defaultValueLiteral: 'true' }),
        attr('label', ECORE + 'EString', { defaultValueLiteral: 'hello world' }),
        attr('mode', '#//Mode', { defaultValueLiteral: 'Mid' }),
        attr('width', ECORE + 'EInt'),
    ]),
    el('eClassifiers', { 'xsi:type': 'ecore:EEnum', name: 'Mode' }, [
        el('eLiterals', { name: 'Low', value: '0' }), el('eLiterals', { name: 'Mid', value: '5' }), el('eLiterals', { name: 'High', value: '9' }),
    ]),
]);
class FakeDOMParser { parseFromString() { return { querySelector: () => null, documentElement: root }; } }

/** `defaultValueLiteral` of each Sys feature, as EcoreParser.parseDAttribute stores it. */
function importedLiterals(): Record<string, string> {
    const parse = vi.fn(() => [{ id: 'M_new', className: 'DModel', name: 'probe' }]);
    h.parse = parse;
    expect(EcoreService.importFromXML('<x/>', 'probe').success).toBe(true);
    const json = (parse.mock.calls[0] as any[])[0];
    const many = (v: any): any[] => (v === undefined ? [] : Array.isArray(v) ? v : [v]);
    const sys = many(json.eClassifiers).find((c: any) => c['-name'] === 'Sys');
    return Object.fromEntries(many(sys.eStructuralFeatures).map((f: any) => [f['-name'], ecoreDefaultValueLiteral(f)]));
}

describe('an Ecore-imported metamodel gives the same reads', () => {
    beforeEach(() => { vi.stubGlobal('DOMParser', FakeDOMParser); });
    afterEach(() => { vi.unstubAllGlobals(); });

    it('level 7, enabled true, label "hello world", mode Mid; width without a default reads null', () => {
        const lit = importedLiterals();
        editorModel([
            { name: 'level', type: prim('EInt'), literal: lit.level },
            { name: 'enabled', type: prim('EBoolean'), literal: lit.enabled },
            { name: 'label', type: prim('EString'), literal: lit.label },
            { name: 'mode', type: MODE, literal: lit.mode },
            { name: 'width', type: prim('EInt'), literal: lit.width },
        ]);
        expect(read('[s1.level, s1.enabled, s1.label, s1.mode, s1.width]')).toEqual([7, true, 'hello world', 'Mid', null]);
    });
});

// ── the default text generator, on the context buildEvalContext builds ────────────────────────────────────
const FILE = new URL('../../../../public/examples/codegen/default-text.generator.json', import.meta.url);

describe('the default text generator prints an unset defaulted attribute (R-TXT-5)', () => {
    it('prints `level 7` with no `defaultValue` set by hand, and leaves out the unset optional `count`', () => {
        editorModel([
            { name: 'name', type: prim('EString') },
            { name: 'level', type: prim('EInt'), literal: '7' },
            { name: 'count', type: prim('EInt') },
        ], { name: 's1' });
        const decoded = decodeGeneratorFile(readFileSync(FILE, 'utf8'));
        expect(decoded.problems).toEqual([]);
        const lookup = { MM: { className: 'DModel', id: 'MM', name: 'mm' }, M: { className: 'DModel', id: 'M', name: 'm', instanceof: 'MM' } };
        const out = generate(buildEvalContext({} as any), lookup, 'M', [...decoded.generators[0].templates], 'main', [], {}, 'none');
        expect(out.errors).toEqual([]);
        expect(out.code).toBe('Sys s1 {\n  level 7\n}');
    });
});
