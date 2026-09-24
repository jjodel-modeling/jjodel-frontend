import { describe, test, expect, afterAll } from 'vitest';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { findAwaitCounters } from '../lint-await-counter.ts';
import type { AwaitCounterFinding } from '../lint-await-counter.ts';

// Fixtures are strings, never files: a file holding the pattern under
// frontend/scripts/ would fail the gate on itself.

const HERE = dirname(fileURLToPath(import.meta.url));
const GATES = resolve(HERE, '..');
const SCANNER_SRC = resolve(GATES, 'lint-await-counter.ts');
const GATE_SRC = resolve(GATES, 'check-scripts.ts');

const inFunction = (stmt: string): string => `async function main() {\n  let n = 0;\n  ${stmt}\n}\n`; // the statement is on line 3
const topLevel = (stmt: string): string => `let n = 0;\n${stmt}\n`; // the statement is on line 2

const COMPOUND: Array<[string, string]> = [
    ['+=', 'PlusEqualsToken'],
    ['-=', 'MinusEqualsToken'],
    ['*=', 'AsteriskEqualsToken'],
    ['**=', 'AsteriskAsteriskEqualsToken'],
    ['/=', 'SlashEqualsToken'],
    ['%=', 'PercentEqualsToken'],
    ['<<=', 'LessThanLessThanEqualsToken'],
    ['>>=', 'GreaterThanGreaterThanEqualsToken'],
    ['>>>=', 'GreaterThanGreaterThanGreaterThanEqualsToken'],
    ['&=', 'AmpersandEqualsToken'],
    ['|=', 'BarEqualsToken'],
    ['^=', 'CaretEqualsToken'],
    ['||=', 'BarBarEqualsToken'],
    ['&&=', 'AmpersandAmpersandEqualsToken'],
    ['??=', 'QuestionQuestionEqualsToken'],
];

const BINARY: Array<[string, string]> = [
    ['+', 'PlusToken'],
    ['-', 'MinusToken'],
    ['*', 'AsteriskToken'],
    ['**', 'AsteriskAsteriskToken'],
    ['/', 'SlashToken'],
    ['%', 'PercentToken'],
    ['<<', 'LessThanLessThanToken'],
    ['>>', 'GreaterThanGreaterThanToken'],
    ['>>>', 'GreaterThanGreaterThanGreaterThanToken'],
    ['&', 'AmpersandToken'],
    ['|', 'BarToken'],
    ['^', 'CaretToken'],
    ['||', 'BarBarToken'],
    ['&&', 'AmpersandAmpersandToken'],
    ['??', 'QuestionQuestionToken'],
];

// [label, source, line of the finding]
const CAUGHT: Array<[string, string, number]> = [
    ['the incident, a shared counter', inFunction("failures += await e2e.run(2, 'x');"), 3],
    ['compound on a plain variable', inFunction('n += await f();'), 3],
    ['compound on a property', inFunction('o.n += await f();'), 3],
    ['compound on an element access', inFunction('arr[i] -= await f();'), 3],
    ['the await in parentheses', inFunction('n += (await f());'), 3],
    ['the await deep in the right side', inFunction('n += 1 + (await f()).length;'), 3],
    ['the await in a branch of the right side', inFunction('n += x ? await f() : 0;'), 3],
    ['logical assignment', inFunction('n ||= await f();'), 3],
    ['top level, outside any function', topLevel('n += await f();'), 2],
    ['x = x + await', inFunction('n = n + await f();'), 3],
    ['x = x + 1 + await, reading x first down the left spine', inFunction('n = n + 1 + await f();'), 3],
    ['x = (x + await), the sum in parentheses', inFunction('n = (n + await f());'), 3],
];

const CLEAN: Array<[string, string]> = [
    ['the safe shape: await first, add after', inFunction('const r = await f(); n += r;')],
    ['plain assignment of the awaited value', inFunction('n = await f();')],
    ['increment then an unrelated await', inFunction('n += 1; await g();')],
    ['the await belongs to a nested function', inFunction('n += items.map(async () => { await g(); }).length;')],
    ['an async arrow declared, then a plain add', inFunction('const g2 = async () => { await g(); }; n += 1;')],
    ['the pattern in a string', inFunction("const s = 'n += await f()';")],
    ['the pattern in a comment', inFunction('// n += await f()\n  n += 1;')],
    ['for await', inFunction('for await (const x of gen()) { n++; }')],
    ['x = other + await, x is not read', inFunction('n = m + await f();')],
    ['x = await + x, x is read after the await', inFunction('n = await f() + n;')],
    ['a plain compound', inFunction('n += 1;')],
];

describe('findAwaitCounters — caught', () => {
    test.each(CAUGHT)('%s', (_label, source, line) => {
        const found = findAwaitCounters(source, 'fixture.ts');
        expect(found).toHaveLength(1);
        expect(found[0].line).toBe(line);
    });

    test.each(COMPOUND)('compound operator %s', (op) => {
        const found = findAwaitCounters(inFunction(`n ${op} await f();`), 'fixture.ts');
        expect(found.map((f) => [f.kind, f.operator])).toEqual([['compound', op]]);
    });

    test.each(BINARY)('x = x %s await', (op) => {
        const found = findAwaitCounters(inFunction(`n = n ${op} await f();`), 'fixture.ts');
        expect(found.map((f) => f.kind)).toEqual(['self-assign']);
    });

    test('the same statement in a .mjs file is read as JavaScript', () => {
        expect(findAwaitCounters(inFunction('n += await f();'), 'probe.mjs')).toHaveLength(1);
    });
});

describe('findAwaitCounters — clean', () => {
    test.each(CLEAN)('%s', (_label, source) => {
        expect(findAwaitCounters(source, 'fixture.ts')).toEqual([]);
    });
});

// ── Mutation bench ──────────────────────────────────────────────────────
//
// Each mutant is the real source of lint-await-counter.ts with ONE line changed,
// transpiled and run. Every mutant is measured against a probe that the real
// module answers correctly and that the mutant must answer wrong: a fixture that
// both answer alike would prove nothing (CLAUDE.md §5).

type Scanner = (source: string, fileName: string) => AwaitCounterFinding[];

function loadScanner(mutation?: { from: string; to: string }): Scanner {
    let source = readFileSync(SCANNER_SRC, 'utf8');
    if (mutation) {
        // Exactly one occurrence: a refactor that moves the line must break the bench loudly.
        expect(source.split(mutation.from), `mutation anchor not unique: ${mutation.from}`).toHaveLength(2);
        source = source.replace(mutation.from, () => mutation.to);
    }
    const js = ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText;
    const mod: { exports: Record<string, unknown> } = { exports: {} };
    new Function('module', 'exports', 'require', js)(mod, mod.exports, (id: string) => {
        if (id === 'typescript') return ts;
        throw new Error(`unexpected require: ${id}`);
    });
    return mod.exports.findAwaitCounters as Scanner;
}

const count = (scan: Scanner, source: string): number => scan(source, 'fixture.ts').length;

describe('mutation bench — the scanner', () => {
    test('the loader is faithful: the unmutated transpile answers like the real module on every fixture', () => {
        const scan = loadScanner();
        for (const source of [...CAUGHT.map((c) => c[1]), ...CLEAN.map((c) => c[1])]) {
            expect(scan(source, 'fixture.ts')).toEqual(findAwaitCounters(source, 'fixture.ts'));
        }
    });

    test.each(COMPOUND)('mutant: compound operator %s dropped from the set — killed by the operator table', (op, name) => {
        const scan = loadScanner({ from: `    ts.SyntaxKind.${name},\n`, to: '' });
        expect(count(scan, inFunction(`n ${op} await f();`))).toBe(0); // the mutant misses it
        expect(count(findAwaitCounters as Scanner, inFunction(`n ${op} await f();`))).toBe(1); // the real one does not
    });

    test.each(BINARY)('mutant: binary operator %s dropped from the set — killed by the x = x <op> table', (op, name) => {
        const scan = loadScanner({ from: `    ts.SyntaxKind.${name},\n`, to: '' });
        expect(count(scan, inFunction(`n = n ${op} await f();`))).toBe(0);
        expect(count(findAwaitCounters as Scanner, inFunction(`n = n ${op} await f();`))).toBe(1);
    });

    const mutants: Array<{ name: string; from: string; to: string; probe: string; real: number }> = [
        {
            name: 'descends into nested functions — killed by "the await belongs to a nested function"',
            from: '    if (ts.isFunctionLike(node)) return false;\n',
            to: '',
            probe: inFunction('n += items.map(async () => { await g(); }).length;'),
            real: 0,
        },
        {
            name: 'the x = x <op> branch dropped — killed by the self-assign fixtures',
            from: '} else if (op === ts.SyntaxKind.EqualsToken) {',
            to: '} else if (false) {',
            probe: inFunction('n = n + await f();'),
            real: 1,
        },
        {
            name: 'x is not required to be the leftmost operand — killed by "x = other + await"',
            from: '                    leftmostOperand(rhs).getText(sf) === node.left.getText(sf) &&\n',
            to: '',
            probe: inFunction('n = m + await f();'),
            real: 0,
        },
        {
            name: 'parentheses not unwrapped — killed by "x = (x + await)"',
            from: '    while (ts.isParenthesizedExpression(e)) e = e.expression;\n',
            to: '',
            probe: inFunction('n = (n + await f());'),
            real: 1,
        },
        {
            name: 'the left spine not walked — killed by "x = x + 1 + await"',
            from: '    while (ts.isBinaryExpression(e) && BINARY_OPERATORS.has(e.operatorToken.kind)) e = unwrap(e.left);\n',
            to: '',
            probe: inFunction('n = n + 1 + await f();'),
            real: 1,
        },
        {
            name: 'an await is never recognised — killed by every caught fixture',
            from: '    if (ts.isAwaitExpression(node)) return true;\n',
            to: '',
            probe: inFunction('n += await f();'),
            real: 1,
        },
        {
            name: 'the reported line is 0-based — killed by the line assertion',
            from: '            line: line + 1,\n',
            to: '            line,\n',
            probe: inFunction('n += await f();'),
            real: 1,
        },
    ];

    test.each(mutants)('mutant: $name', ({ from, to, probe, real }) => {
        const mutant = loadScanner({ from, to });
        if (from.includes('line: line + 1')) {
            // The count is unchanged by this mutant, the position is not.
            expect(mutant(probe, 'fixture.ts')[0].line).toBe(2);
            expect(findAwaitCounters(probe, 'fixture.ts')[0].line).toBe(3);
            return;
        }
        expect(count(findAwaitCounters as Scanner, probe)).toBe(real);
        expect(count(mutant, probe)).not.toBe(real);
    });
});

// ── The gate, on a tree on disk ─────────────────────────────────────────

const INCIDENT = 'async function run() {\n  let failures = 0;\n  failures += await e2e.run(2, "x");\n}\n';
const SAFE = 'async function run() {\n  let failures = 0;\n  const r = await e2e.run(2, "x");\n  failures += r;\n}\n';

const tmpDirs: string[] = [];
afterAll(() => {
    for (const d of tmpDirs) rmSync(d, { recursive: true, force: true });
});

// typescript is resolved by the copied scanner from <tmp>/node_modules, a symlink to the real one.
const NODE_MODULES = dirname(dirname(createRequire(import.meta.url).resolve('typescript/package.json')));

interface GateRun {
    status: number | null;
    out: string;
}

/** Copies the gate (optionally one line mutated) next to a fixture tree and runs it on that tree. */
function runGate(files: Record<string, string>, mutation?: { from: string; to: string }): GateRun {
    const dir = mkdtempSync(join(tmpdir(), 'check-scripts-'));
    tmpDirs.push(dir);
    mkdirSync(join(dir, 'gates'));
    symlinkSync(NODE_MODULES, join(dir, 'node_modules'));
    copyFileSync(SCANNER_SRC, join(dir, 'gates', 'lint-await-counter.ts'));
    let gate = readFileSync(GATE_SRC, 'utf8');
    if (mutation) {
        expect(gate.split(mutation.from), `mutation anchor not unique: ${mutation.from}`).toHaveLength(2);
        gate = gate.replace(mutation.from, () => mutation.to);
    }
    writeFileSync(join(dir, 'gates', 'check-scripts.ts'), gate);

    for (const [rel, text] of Object.entries(files)) {
        const path = join(dir, 'tree', rel);
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, text);
    }
    mkdirSync(join(dir, 'tree'), { recursive: true });

    const r = spawnSync(
        process.execPath,
        ['--disable-warning=ExperimentalWarning', '--experimental-strip-types', join(dir, 'gates', 'check-scripts.ts'), `--root=${join(dir, 'tree')}`],
        { encoding: 'utf8' },
    );
    return { status: r.status, out: `${r.stdout}${r.stderr}` };
}

describe('check-scripts — negative control', { timeout: 60_000 }, () => {
    test('a gitignored _tmp_ probe with the incident line fails the gate, naming file and line', () => {
        const r = runGate({ 'smoke/_tmp_sim1_verify.ts': INCIDENT });
        expect(r.status).toBe(1);
        expect(r.out).toContain('smoke/_tmp_sim1_verify.ts:3:3');
        expect(r.out).toContain('failures += await e2e.run(2, "x")');
        expect(r.out).toContain('1 of them _tmp_* probes');
    });

    test('the same tree without the incident line passes', () => {
        const r = runGate({ 'smoke/_tmp_sim1_verify.ts': SAFE });
        expect(r.status).toBe(0);
        expect(r.out).toContain('PASS');
    });

    test('a .mjs script is scanned', () => {
        expect(runGate({ 'probe.mjs': INCIDENT }).status).toBe(1);
    });

    test('node_modules and dist are not scanned', () => {
        const r = runGate({ 'node_modules/pkg/index.ts': INCIDENT, 'dist/out.js': INCIDENT, 'ok.ts': SAFE });
        expect(r.status).toBe(0);
        expect(r.out).toContain('scanned 1 file(s)');
    });

    test('a root that is not a directory fails closed', () => {
        const r = spawnSync(
            process.execPath,
            ['--disable-warning=ExperimentalWarning', '--experimental-strip-types', GATE_SRC, '--root=/nonexistent-check-scripts-root'],
            { encoding: 'utf8' },
        );
        expect(r.status).toBe(1);
    });
});

describe('mutation bench — the gate', { timeout: 60_000 }, () => {
    test('mutant: the walk skips _tmp_ files — killed by the _tmp_ probe control', () => {
        const mutant = { from: '        if (e.isSymbolicLink()) continue;\n', to: "        if (e.isSymbolicLink() || e.name.startsWith('_tmp_')) continue;\n" };
        expect(runGate({ 'smoke/_tmp_sim1_verify.ts': INCIDENT }).status).toBe(1);
        expect(runGate({ 'smoke/_tmp_sim1_verify.ts': INCIDENT }, mutant).status).toBe(0);
    });

    test('mutant: .mjs dropped from the extensions — killed by the .mjs control', () => {
        const mutant = { from: "'.jsx', '.mjs', '.cjs'", to: "'.jsx', '.cjs'" };
        expect(runGate({ 'probe.mjs': INCIDENT }).status).toBe(1);
        expect(runGate({ 'probe.mjs': INCIDENT }, mutant).status).toBe(0);
    });

    test('mutant: node_modules and dist scanned — killed by the exclusion control', () => {
        const mutant = { from: "new Set(['node_modules', 'dist'])", to: 'new Set<string>()' };
        const tree = { 'node_modules/pkg/index.ts': INCIDENT, 'ok.ts': SAFE };
        expect(runGate(tree).status).toBe(0);
        const r = runGate(tree, mutant);
        expect(r.status).toBe(1);
        expect(r.out).toContain('node_modules/pkg/index.ts'); // it fails for the finding, not by crashing
    });

    test('mutant: the exit code is always 0 — killed by the negative control', () => {
        const mutant = { from: 'process.exit(failed === 0 ? 0 : 1);', to: 'process.exit(0);' };
        const r = runGate({ 'probe.ts': INCIDENT }, mutant);
        expect(r.status).toBe(0);
        expect(r.out).toContain('FAIL  1 finding(s)'); // it saw the finding and exited 0 anyway
        expect(runGate({ 'probe.ts': INCIDENT }).status).toBe(1);
    });
});
