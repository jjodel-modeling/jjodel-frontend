#!/usr/bin/env node
/**
 * hw-cpu trace oracle (slice S-E of the hardware demonstrator plan, D5): the
 * committed `src/codegen/examples/hw-cpu/expected/cpu.v` and `tb.v` are built
 * and run by Verilator, and the per-cycle trace the testbench prints is
 * compared line by line with the Jjodel side, `hw-cpu.trace.json` (written by
 * the simulator in `hw-cpu.run.test.ts`). The Verilator trace is written to
 * the committed `hw-cpu.verilator.trace`, with the sha256 of the two Verilog
 * files in its header, so the normal suite (`hw-cpu.verilator.test.ts`) can
 * check it without Verilator and fail when either file changes without a new
 * run.
 *
 * A sibling of `bv-verilator.mjs` and `bv-printer-verilator.mjs`: the same
 * `run`, version check and scratch handling, copied because those scripts run
 * on import and export nothing. Scratch in `frontend/.vite-cache/hw-oracle/`
 * (gitignored), with the JSON verdict `{cycles, agreements, firstMismatch}`.
 * Exit 1 on a mismatch: the first diverging cycle and the register (or state)
 * that differs are printed.
 *
 * `--cpu <path>` / `--tb <path>` build another copy of a file (a mutation
 * bench); the trace then goes to the scratch directory and the committed one
 * is left untouched.
 *
 * Run: npm run oracle:hw   (not in the normal suite)
 */

import { execFileSync, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const FRONTEND = resolve(HERE, '../..');
const EXAMPLE = resolve(FRONTEND, 'src/codegen/examples/hw-cpu');
const JJODEL_TRACE = resolve(EXAMPLE, 'hw-cpu.trace.json');
const COMMITTED_TRACE = resolve(EXAMPLE, 'hw-cpu.verilator.trace');
const SCRATCH = resolve(FRONTEND, '.vite-cache/hw-oracle');

/** The field names of a trace line, in the order of the §7.4 format. */
const FIELDS = ['cycle', 'state', 'PC', 'IR', 'ACC', 'Z'];
const LINE = /^\d+ \d+ [0-9a-f]+ [0-9a-f]+ [0-9a-f]+ [01]+$/;

function option(name, fallback) {
    const k = process.argv.indexOf(name);
    return k >= 0 && process.argv[k + 1] ? resolve(process.argv[k + 1]) : fallback;
}

const CPU = option('--cpu', resolve(EXAMPLE, 'expected/cpu.v'));
const TB = option('--tb', resolve(EXAMPLE, 'expected/tb.v'));
const BENCH = process.argv.includes('--cpu') || process.argv.includes('--tb');
const OUT = BENCH ? resolve(SCRATCH, 'verilator.trace') : COMMITTED_TRACE;

// ---------------------------------------------------------------- RUN

function run(cmd, args, cwd, logPath) {
    return new Promise((done, fail) => {
        const child = spawn(cmd, args, { cwd });
        let out = '';
        child.stdout.on('data', d => { out += d; });
        child.stderr.on('data', d => { out += d; });
        child.on('error', fail);
        child.on('close', code => {
            writeFileSync(logPath, out);
            if (code === 0) done(out);
            else fail(new Error(`${cmd} exited ${code}; log: ${logPath}`));
        });
    });
}

const sha256 = path => createHash('sha256').update(readFileSync(path)).digest('hex');

const version = execFileSync('verilator', ['--version'], { encoding: 'utf8' }).trim();
const jjodel = JSON.parse(readFileSync(JJODEL_TRACE, 'utf8'));

rmSync(SCRATCH, { recursive: true, force: true });
mkdirSync(SCRATCH, { recursive: true });
await run('verilator', [
    '--binary', '--timing', '--top-module', 'tb', '-Wno-WIDTH', '-j', '0',
    '-CFLAGS', '-O0', '--Mdir', 'obj', '-o', 'sim', TB, CPU,
], SCRATCH, resolve(SCRATCH, 'build.log'));
const out = await run(resolve(SCRATCH, 'obj/sim'), [], SCRATCH, resolve(SCRATCH, 'run.log'));
const lines = out.split('\n').map(l => l.trim()).filter(l => LINE.test(l));

writeFileSync(OUT, [
    '# hw-cpu.verilator.trace: written by scripts/oracle/hw-cpu-verilator.mjs (npm run oracle:hw), never by hand.',
    `# verilator ${version}`,
    `# sha256 cpu.v ${sha256(CPU)}`,
    `# sha256 tb.v ${sha256(TB)}`,
    `# format ${jjodel.format}`,
    ...lines,
    '',
].join('\n'));

// ---------------------------------------------------------------- COMPARE

const stateName = v => jjodel.states[Number(v)] ?? '?';
const shown = (field, v) => (field === 'state' ? `${v} (${stateName(v)})` : v);

let agreements = 0;
let firstMismatch = null;
const cycles = Math.max(lines.length, jjodel.lines.length);
for (let i = 0; i < cycles; i++) {
    const j = jjodel.lines[i];
    const v = lines[i];
    if (j === v) { agreements++; continue; }
    if (firstMismatch) continue;
    if (j === undefined || v === undefined) {
        firstMismatch = { cycle: i, register: 'end of trace', jjodel: j ?? null, verilator: v ?? null };
        continue;
    }
    const jf = j.split(' ');
    const vf = v.split(' ');
    const differ = FIELDS.filter((_, k) => jf[k] !== vf[k]);
    firstMismatch = {
        cycle: i,
        register: differ[0],
        jjodel: shown(differ[0], jf[FIELDS.indexOf(differ[0])]),
        verilator: shown(differ[0], vf[FIELDS.indexOf(differ[0])]),
        differ,
        lines: { jjodel: j, verilator: v },
    };
}

const verdict = { cycles, agreements, firstMismatch };
writeFileSync(resolve(SCRATCH, 'verdict.json'), JSON.stringify(verdict, null, 2) + '\n');

console.log(`hw-cpu-verilator: ${version}; ${lines.length} Verilator lines, ${jjodel.lines.length} Jjodel lines, ${agreements} agree`);
console.log(`hw-cpu-verilator: trace written to ${OUT}`);
if (firstMismatch) {
    const m = firstMismatch;
    if (m.register === 'end of trace') {
        console.error(`hw-cpu-verilator: first mismatch at cycle ${m.cycle}: ${m.verilator === null ? 'Verilator' : 'Jjodel'} trace ends, `
            + `the other has ${m.jjodel ?? m.verilator}`);
    } else {
        console.error(`hw-cpu-verilator: first mismatch at cycle ${m.cycle}: ${m.register} jjodel ${m.jjodel}, verilator ${m.verilator}`
            + (m.differ.length > 1 ? ` (also ${m.differ.slice(1).join(', ')})` : ''));
        console.error(`  jjodel    ${m.lines.jjodel}`);
        console.error(`  verilator ${m.lines.verilator}`);
    }
    process.exit(1);
}
