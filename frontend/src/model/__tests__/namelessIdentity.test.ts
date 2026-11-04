import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { transformSync } from 'esbuild';

/**
 * R-TXT-45 / R-TXT-46 — an object can be nameless
 * (`model/logicWrapper/LModelElement.tsx`).
 *
 * Report: `docs/discovery/discovery_2026-11-04_core_nameless_identity.md` §3.2, §4.
 *
 * Variant B (D1): an identity slot WRITTEN with the empty string (raw first value `''`) yields
 * only to `data.name`, never to `initialName`. `[]`, a hole and `null` are "never written" and
 * keep today's fallback (D9). D10: `set_name('')` on a never-written `[]` slot writes `['']`.
 *
 * Same technique as `unq1AutoNameShadow.test.ts`: `LModelElement.tsx` does not import under
 * vitest (`window is not defined`), so the committed source is extracted, its types erased by
 * esbuild, and executed with its free dependencies injected.
 */

const LME_TSX = path.resolve(__dirname, '../logicWrapper/LModelElement.tsx');
const source = fs.readFileSync(LME_TSX, 'utf8');

/** The `{...}` block whose opening brace is the first `{` at or after `from`. */
function blockAt(src: string, from: number, what: string): string {
    const open = src.indexOf('{', from);
    expect(open, `cannot find the opening of ${what}: update the test`).toBeGreaterThan(-1);
    let depth = 0;
    for (let i = open; i < src.length; i++) {
        if (src[i] === '{') depth++;
        else if (src[i] === '}' && --depth === 0) return src.slice(open + 1, i);
    }
    throw new Error(`unbalanced block in ${what}`);
}

function compile(body: string, params: string[]): Function {
    const ts = `(function (${params.join(', ')}) {\n${body}\n})`;
    const js = transformSync(ts, { loader: 'ts', target: 'es2020' }).code;
    // eslint-disable-next-line no-new-func
    return new Function(`return ${js.replace(/;\s*$/, '')}`)() as Function;
}

// ── LValue.get_values, the EString identity case ────────────────────────────
const ID_CASE_HEAD = "if (!ret[0] && (dmeta?.upperBound === 1 || (!dmeta && ret.length <= 1))";
const idCaseAt = source.indexOf(ID_CASE_HEAD);
const idCaseBody = (() => {
    expect(idCaseAt, 'the identity case of get_values changed: update the test').toBeGreaterThan(-1);
    const condEnd = source.indexOf("=== 'name') {", idCaseAt);
    expect(condEnd, 'the identity condition of get_values changed: update the test').toBeGreaterThan(idCaseAt);
    // The whole `if`, guard included: the guard decides whether a populated slot is touched.
    const body = blockAt(source, condEnd, 'the get_values identity case');
    const blockEnd = source.indexOf(body, condEnd) + body.length + 1;
    return source.slice(idCaseAt, blockEnd);
})();
const idCase = compile(idCaseBody, ['ret', 'context', 'DObject', 'dmeta', 'typestr', 'ShortAttribETypes']) as
    (ret: any[], context: any, DObject: any, dmeta: any, typestr: any, ShortAttribETypes: any) => void;

/**
 * Runs the identity case on a slot whose raw values are `raw` (already mapped to `ret` the way
 * the EString mapper does), owned by an object with `name` and `initialName`.
 */
function readSlot(raw: unknown[], owner: { name?: any; initialName?: any }): any {
    const ret = Array.from({ length: Math.max(raw.length, 1) }, (_, i) => raw[i]).map(v => v ? v + '' : '');
    const context = { data: { name: 'name', father: 'ptr_owner', values: raw } };
    idCase(ret, context, { fromPointer: (p: any) => (p === 'ptr_owner' ? owner : undefined) },
        { upperBound: 1 }, 'EString', { EString: 'EString' });
    return ret[0];
}

// ── LObject.get_name ────────────────────────────────────────────────────────
const GET_NAME_SIG = "    protected get_name(context: Context): this['name'] {";
const getNameBody = (() => {
    const marker = source.indexOf("const slot = (context.proxyObject as GObject)['$name'];");
    expect(marker, 'the body of LObject.get_name changed: update the test').toBeGreaterThan(-1);
    const sigAt = source.lastIndexOf(GET_NAME_SIG, marker);
    expect(sigAt, 'the signature of LObject.get_name changed: update the test').toBeGreaterThan(-1);
    return blockAt(source, sigAt + GET_NAME_SIG.length - 1, 'LObject.get_name');
})();
const getName = compile(getNameBody, ['context']) as (c: any) => any;

function nameOf(raw: unknown[] | undefined, slotValue: any, dataName: any, metaName = 'Port') {
    return getName({
        data: { name: dataName },
        proxyObject: { '$name': { value: slotValue, __raw: { values: raw } }, instanceof: { name: metaName } },
    });
}

describe('(1) variant B — get_values, identity slot', () => {
    it("written '' with data.name '' -> nameless, not the auto-name", () => {
        expect(readSlot([''], { name: '', initialName: 'Port_2' })).toBe('');
    });

    it("written '' with data.name set (a rename that wrote data.name only) -> data.name", () => {
        expect(readSlot([''], { name: 'Renamed', initialName: 'Port_2' })).toBe('Renamed');
    });

    it('never written `[]` -> the auto-name, as before (control)', () => {
        expect(readSlot([], { name: 'Port_2', initialName: 'Port_2' })).toBe('Port_2');
        expect(readSlot([], { name: '', initialName: 'Port_2' })).toBe('Port_2');
    });

    it('a hole or null (D9, `set X.name = null`) -> the auto-name, as before', () => {
        expect(readSlot(new Array(1), { name: undefined, initialName: 'Port_2' })).toBe('Port_2');
        expect(readSlot([null], { name: undefined, initialName: 'Port_2' })).toBe('Port_2');
    });

    it('a populated slot wins, as before', () => {
        expect(readSlot(['a'], { name: 'b', initialName: 'Port_2' })).toBe('a');
    });
});

describe('(1) variant B — LObject.get_name', () => {
    it("raw [''] and data.name '' -> '' (not the metaclass name, not the slot fallback)", () => {
        expect(nameOf([''], '', '')).toBe('');
        expect(nameOf([''], '', undefined)).toBe('');
    });

    it("raw [''] and data.name set -> data.name", () => {
        expect(nameOf([''], 'Renamed', 'Renamed')).toBe('Renamed');
    });

    it('raw `[]` -> data.name, then the slot fallback, as before (control)', () => {
        expect(nameOf([], 'Port_2', 'Port_7')).toBe('Port_7');
        expect(nameOf([], 'Port_2', '')).toBe('Port_2');
    });

    it('a populated slot wins over data.name, as before (CLAUDE.md §3.12)', () => {
        expect(nameOf(['a'], 'a', 'b')).toBe('a');
    });
});
