/**
 * hw-cpu.verilator — the trace comparison with Verilator (P-2026-10-21-1430, slice S-E of
 * docs/discovery/discovery_2026-10-21_hw_demonstrator_plan.md §10.1, D5). The committed hw-cpu.verilator.trace is
 * written by scripts/oracle/hw-cpu-verilator.mjs from a Verilator run of expected/cpu.v and expected/tb.v, never from
 * the simulator; this test needs no Verilator: it checks that the trace equals the Jjodel side, hw-cpu.trace.json,
 * line by line, and that it was taken on the committed Verilog (the sha256 of both files in its header).
 * Regenerate with `npm run oracle:hw`.
 *
 * Each test name says which break kills it; the bench is in the commit body.
 */

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url));
const jjodel = JSON.parse(read('hw-cpu.trace.json').toString('utf8')) as { format: string; lines: string[] };
const text = read('hw-cpu.verilator.trace').toString('utf8').split('\n');
const header = text.filter(l => l.startsWith('# '));
const lines = text.filter(l => l !== '' && !l.startsWith('#'));

/** The sha256 the header records for a file: `# sha256 <name> <hex>`. */
function recorded(name: string): string | undefined {
    return header.map(l => /^# sha256 (\S+) ([0-9a-f]{64})$/.exec(l)).find(m => m?.[1] === name)?.[2];
}

describe('hw-cpu Verilator trace (S-E)', () => {
    it('was taken on the committed cpu.v and tb.v (mutant: either file edited without a new npm run oracle:hw)', () => {
        for (const name of ['cpu.v', 'tb.v']) {
            const hash = createHash('sha256').update(read(`expected/${name}`)).digest('hex');
            expect(recorded(name), name).toBe(hash);
        }
    });

    it('prints the Jjodel trace format (mutant: the format line of either side changed)', () => {
        expect(header).toContain(`# format ${jjodel.format}`);
    });

    it('equals hw-cpu.trace.json cycle by cycle, from Reset to HALT (mutant: a line of either trace changed or dropped)', () => {
        for (let i = 0; i < Math.min(lines.length, jjodel.lines.length); i++) {
            expect(lines[i], `cycle ${i}`).toBe(jjodel.lines[i]);
        }
        expect(lines.length).toBe(jjodel.lines.length);
    });
});
