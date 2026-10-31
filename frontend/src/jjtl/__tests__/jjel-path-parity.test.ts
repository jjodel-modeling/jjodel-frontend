import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

/**
 * Every JjTL fixture of the repository parses and runs the same on both parser
 * paths: the legacy expression parser (no `source`) and the JjEL delegation
 * (`source` passed, what the app hook and the editor use from P-2026-10-31-1910).
 *
 * Fixtures:
 * - `fixtures/parity-sources.json`: every complete transformation the
 *   `src/jjtl` suite lexed on 2026-10-31, captured at runtime (132 sources);
 * - the `transformation` code fences of SPEC.md, README.md, the help reference
 *   and the development plan, read from disk;
 * - the two app templates (`DEFAULT_CODE` of JjtlDevelopmentEnv.tsx,
 *   `createTransformation().code`).
 *
 * For a fixture that parses on the legacy path, the JjEL path must parse it
 * too, give the same AST once every expression is in JjEL form (legacy nodes
 * through `toJjelAst`, locations dropped), and give the same execution result
 * on a synthetic source model, prompt host recorded. A fixture that fails on
 * the legacy path and parses on the JjEL path is a JjEL-only form and must be
 * listed in JJEL_ONLY: a new one fails the test until it is looked at.
 *
 * The joiner barrel is mocked (see executor/__tests__/contained-sources.test.ts).
 */
vi.mock('../../joiner', () => ({
    U: {
        asNumber: (val: any, returnInvalid: any = 0, returnNAN: any = NaN): number => {
            if (isNaN(val)) return returnNAN;
            if (typeof val === 'number') return val;
            const v = +val;
            if (isNaN(v)) return returnInvalid;
            return v;
        },
    },
}));

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { JjtlLexer } from '../lexer/lexer';
import { JjtlParser } from '../parser/parser';
import { execute } from '../executor/executor';
import { toJjelAst } from '../executor/astBridge';
import { getUIBridge, setUIBridge, UIBridge } from '../executor/UIBridge';
import { createTransformation } from '../types/transformation';
import type { TransformationAST, ParserError } from '../types';
import fixtureFile from './fixtures/parity-sources.json';

const REPO = resolve(__dirname, '../../../..');

interface Fixture { id: string; source: string; }

function docFences(relPath: string): Fixture[] {
    const text = readFileSync(resolve(REPO, relPath), 'utf8');
    const out: Fixture[] = [];
    const re = /```[a-z]*\n(transformation\b[\s\S]*?)```/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) out.push({ id: `${relPath}#${out.length + 1}`, source: m[1] });
    return out;
}

function appTemplates(): Fixture[] {
    const env = readFileSync(resolve(REPO, 'frontend/src/jjtl/components/JjtlDevelopmentEnv.tsx'), 'utf8');
    const m = /const DEFAULT_CODE = `([\s\S]*?)`;/.exec(env);
    return [
        { id: 'JjtlDevelopmentEnv.DEFAULT_CODE', source: m ? m[1] : '' },
        { id: 'createTransformation.code', source: createTransformation('My Transformation').code },
    ];
}

const DOCS = [
    'frontend/src/jjtl/SPEC.md',
    'frontend/src/jjtl/README.md',
    'docs/help/reference/jjtl.md',
    'docs/jjtl/JJTL-DEVELOPMENT-PLAN.md',
];

const FIXTURES: Fixture[] = [
    ...(fixtureFile as Fixture[]),
    ...DOCS.flatMap(docFences),
    ...appTemplates(),
];

/**
 * Fixtures that fail on the legacy path and parse on the JjEL path: the forms
 * the switch adds (`implies`, `exists`, `with ... do`, `forall ... : ...`).
 */
const JJEL_ONLY = new Set<string>([
    'tests#031', 'tests#032', 'tests#048', 'tests#049', 'tests#050', 'tests#051', 'tests#056',
    'tests#057', 'tests#058', 'tests#059', 'tests#066', 'tests#067', 'tests#068',
]);

// ---------------------------------------------------------------------------

function parseBoth(source: string): { legacy: ParseOut; jjel: ParseOut } {
    const { tokens } = new JjtlLexer(source).tokenize();
    return {
        legacy: safeParse(() => new JjtlParser(tokens).parse()),
        jjel: safeParse(() => new JjtlParser(tokens, source).parse()),
    };
}

interface ParseOut { ast: TransformationAST | null; errors: ParserError[]; }

function safeParse(fn: () => ParseOut): ParseOut {
    try { return fn(); } catch (e: any) { return { ast: null, errors: [{ message: String(e?.message ?? e), line: 0, column: 0 }] }; }
}

const LEGACY_EXPR = new Set([
    'Literal', 'Identifier', 'MemberAccess', 'NullSafeMemberAccess', 'FunctionCall', 'NullSafeFunctionCall',
    'BinaryExpression', 'UnaryExpression', 'ConditionalExpression', 'NullCoalesceExpression',
    'IsTypeExpression', 'LambdaExpression', 'ArrayLiteral',
]);

function stripLocations(v: any): any {
    if (Array.isArray(v)) return v.map(stripLocations);
    if (v && typeof v === 'object') {
        const out: any = {};
        for (const k of Object.keys(v)) if (k !== 'location') out[k] = stripLocations(v[k]);
        return out;
    }
    return v;
}

/** The AST with every expression in JjEL form and no locations. */
function normalize(v: any): any {
    if (Array.isArray(v)) return v.map(normalize);
    if (v && typeof v === 'object') {
        if (v.type === 'JjelExpression') return stripLocations(v.expression);
        if (LEGACY_EXPR.has(v.type)) {
            try { return stripLocations(toJjelAst(v)); } catch { /* not bridgeable: compare as is */ }
        }
        const out: any = {};
        for (const k of Object.keys(v)) if (k !== 'location') out[k] = normalize(v[k]);
        return out;
    }
    return v;
}

// ---------------------------------------------------------------------------

let calls: string[] = [];

const RECORDING_BRIDGE: UIBridge = {
    async showAlert(message, alertType) { calls.push(`alert(${message},${alertType})`); },
    showNotify(message, duration) { calls.push(`notify(${message},${duration})`); },
    async showPrompt(message, typeRef, defaultValue) {
        calls.push(`prompt(${message},${typeRef},${defaultValue})`);
        return { value: `typed:${message}`, cancelled: false };
    },
    async showInput(message, inputType, defaultValue, options) {
        calls.push(`input(${message},${inputType},${defaultValue},${JSON.stringify(options)})`);
        return { value: `entered:${message}` as any, cancelled: false };
    },
    async showConfirm(message) { calls.push(`confirm(${message})`); return true; },
};

/** Two instances of every source class the transformation names. */
function syntheticSource(ast: TransformationAST): any[] {
    const classes = new Set<string>();
    for (const m of ast.mappings ?? []) for (const s of (m as any).sources ?? []) classes.add(s.className);
    const out: any[] = [];
    for (const c of classes) {
        for (const n of [1, 2]) {
            out.push({ id: `${c}_${n}`, className: c, __type: c, name: `${c.toLowerCase()}${n}`, value: n, active: n === 1 });
        }
    }
    return out;
}

function serialize(v: any): any {
    return JSON.parse(JSON.stringify(v, (_k, x) => (x instanceof Map ? Object.fromEntries(x) : x)));
}

async function run(ast: TransformationAST): Promise<any> {
    calls = [];
    let result: any;
    try {
        result = await execute(ast, syntheticSource(ast));
    } catch (e: any) {
        return { threw: String(e?.message ?? e), calls };
    }
    return serialize({
        success: result.success,
        errors: result.errors,
        // The node-type label differs by construction: 'JjelExpression' for
        // the wrapper, the legacy node type otherwise. The message after it
        // is JjEL's own on both paths.
        warnings: result.warnings.map((w: string) => w.replace(/^Expression evaluation failed \(\w+\)/, 'Expression evaluation failed (...)')),
        roots: result.targetModel?.roots,
        calls,
    });
}

// ---------------------------------------------------------------------------

let saved: UIBridge;
beforeAll(() => { saved = getUIBridge(); setUIBridge(RECORDING_BRIDGE); });
afterAll(() => { setUIBridge(saved); });

describe('JjTL fixtures parse and run the same on both parser paths', () => {
    it('inventory is complete (positive control)', () => {
        expect((fixtureFile as Fixture[]).length).toBe(132);
        // SPEC.md: the five §13 examples plus the §3.1 EBNF fence, which starts with 'transformation ='
        expect(FIXTURES.filter(f => f.id.startsWith('frontend/src/jjtl/SPEC.md')).length).toBe(6);
        expect(FIXTURES.length).toBe(144);
        expect(FIXTURES.every(f => f.source.length > 0)).toBe(true);
    });

    it.each(FIXTURES.map(f => [f.id, f] as const))('%s', async (_id, fixture) => {
        const { legacy, jjel } = parseBoth(fixture.source);
        const legacyClean = legacy.ast !== null && legacy.errors.length === 0;
        const jjelClean = jjel.ast !== null && jjel.errors.length === 0;

        if (!legacyClean) {
            if (jjelClean) expect(JJEL_ONLY.has(fixture.id), 'JjEL-only form not listed').toBe(true);
            return;
        }
        expect(JJEL_ONLY.has(fixture.id), 'listed as JjEL-only but parses on legacy').toBe(false);
        expect(jjel.errors).toEqual([]);
        expect(normalize(jjel.ast)).toEqual(normalize(legacy.ast));
        expect(await run(jjel.ast!)).toEqual(await run(legacy.ast!));
    });
});
