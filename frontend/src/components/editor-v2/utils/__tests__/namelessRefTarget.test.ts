import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { transformSync } from 'esbuild';

/**
 * R-TXT-46 D4 — a reference to a nameless object is not broken on the v2-flow canvas.
 *
 * Report: `docs/discovery/discovery_2026-11-04_core_nameless_identity.md` §3.3 (Canvas v2-flow).
 * Both readers used to keep a target only when its L name was truthy, so a target whose name
 * reads '' (R-TXT-45) fell to the broken branch. They now test that the target resolves.
 *
 * Neither file imports under vitest (the `joiner` barrel pulls monaco: `window is not defined`),
 * so the committed source is extracted and executed with its free dependencies injected, the
 * technique of `model/__tests__/unq1AutoNameShadow.test.ts`.
 */

const TRANSFORMERS = path.resolve(__dirname, '../jjomTransformers.ts');
const FORM_FIELD = path.resolve(__dirname, '../../viewpoint/ir/IRFormField.tsx');

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

// ── jjomTransformers: the reference branch of the object row ────────────────
const tSource = fs.readFileSync(TRANSFORMERS, 'utf8');
const refBranch = (() => {
    const at = tSource.indexOf('const raw: unknown[] = (fv.__raw?.values ?? fv.values ?? []) as unknown[];');
    expect(at, 'the reference branch of jjomTransformers changed: update the test').toBeGreaterThan(-1);
    const tryAt = tSource.lastIndexOf('try {', at);
    return blockAt(tSource, tryAt, 'the reference branch');
})();
const resolveRefs = compile(
    `let values, refTargets, value;\n${refBranch}\nreturn { values, refTargets, value };`,
    ['fv', 'rememberRefTargetName', 'lastSeenRefTargetName'],
) as (fv: any, r: any, l: any) => { values: string[]; refTargets: Array<{ id: string; name: string; broken?: boolean }>; value: string };

function rowOf(raw: string[], resolved: Array<{ id: string; name: any }>) {
    const remembered: Array<[string, string]> = [];
    const out = resolveRefs(
        { __raw: { values: raw }, values: resolved },
        (id: string, name: string) => { remembered.push([id, name]); },
        (_id: string) => 'LAST_KNOWN',
    );
    return { ...out, remembered };
}

// ── IRFormField: displayValue, the chip label ───────────────────────────────
const fSource = fs.readFileSync(FORM_FIELD, 'utf8');
const SIG = 'function displayValue(raw: unknown): string {';
const displayBody = (() => {
    const at = fSource.indexOf(SIG);
    expect(at, 'the signature of displayValue changed: update the test').toBeGreaterThan(-1);
    return blockAt(fSource, at + SIG.length - 1, 'displayValue');
})();
const displayValueOf = compile(displayBody, ['raw', 'LPointerTargetable']) as (raw: unknown, LPT: any) => string;
const LOOKUP: { [id: string]: any } = { p_named: { name: 'Port_1' }, p_nameless: { name: '' } };
const LPT = { fromPointer: (p: any) => LOOKUP[p] };
const displayValue = (raw: unknown) => displayValueOf(raw, LPT);
/** The chip's broken test, as IRFormField writes it: the label fell through to the pointer. */
const isBrokenChip = (v: string) => displayValue(v) === v;

describe('D4 — jjomTransformers: a nameless target resolves', () => {
    it("a target whose name is '' is not broken", () => {
        const r = rowOf(['p_nameless'], [{ id: 'p_nameless', name: '' }]);
        expect(r.refTargets).toEqual([{ id: 'p_nameless', name: '' }]);
    });

    it('a named target, as before (control)', () => {
        const r = rowOf(['p_named'], [{ id: 'p_named', name: 'Port_1' }]);
        expect(r.refTargets).toEqual([{ id: 'p_named', name: 'Port_1' }]);
        expect(r.value).toBe('Port_1');
    });

    it('a pointer that resolves to nothing is still broken, with the last known name', () => {
        const r = rowOf(['p_gone'], []);
        expect(r.refTargets).toEqual([{ id: 'p_gone', name: 'LAST_KNOWN', broken: true }]);
    });

    it('a mixed row keeps the order and flags only the unresolved pointer', () => {
        const r = rowOf(['p_named', 'p_nameless', 'p_gone'],
            [{ id: 'p_named', name: 'Port_1' }, { id: 'p_nameless', name: '' }]);
        expect(r.refTargets.map(t => !!t.broken)).toEqual([false, false, true]);
    });
});

describe('D4 — IRFormField.displayValue: a nameless target is not a broken chip', () => {
    it("a pointer to a nameless object labels '' and is not broken", () => {
        expect(displayValue('p_nameless')).toBe('');
        expect(isBrokenChip('p_nameless')).toBe(false);
    });

    it('a named target and an unresolved pointer, as before (control)', () => {
        expect(displayValue('p_named')).toBe('Port_1');
        expect(isBrokenChip('p_gone')).toBe(true);
        expect(displayValue('Running')).toBe('Running');
        expect(displayValue(null)).toBe('');
    });
});
