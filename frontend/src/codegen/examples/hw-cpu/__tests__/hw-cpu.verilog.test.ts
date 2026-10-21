/**
 * hw-cpu.verilog — route A of the hardware demonstrator (P-2026-10-21-1300, slice S-D of
 * docs/discovery/discovery_2026-10-21_hw_demonstrator_plan.md §10.1): the templates `cpu` and `tb` of hw-cpu.json,
 * on the Verilog target (codegen/target/verilog/access.ts), generate the committed expected/cpu.v and expected/tb.v.
 *
 * The module's state codes are the indices of the committed trace (hw-cpu.trace.json `states`) and the testbench
 * prints the trace's own `$display` line, so the S-E comparison with Verilator reads both sides with one parser.
 * Verilator itself is not run here (`verilator --lint-only` on the two files is recorded in the commit body; the
 * scripted check is S-E).
 *
 * `HW_CPU_WRITE=1` writes the two expected files from this run instead of comparing them.
 * Each test name says which break kills it; the bench is in the commit body.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { generate } from '../../../engine/generate';
import { readModelTemplates } from '../../../engine/templateCodec';
import type { TemplateRecord } from '../../../engine/templates';
import { loadSpec, recordOf } from '../../../oracle/__tests__/exampleFixture';
import type { ExampleSpec } from '../../../oracle/__tests__/exampleFixture';

const WRITE = process.env.HW_CPU_WRITE === '1';
const EXPECTED = (file: string) => new URL(`../expected/${file}`, import.meta.url);
const trace = JSON.parse(readFileSync(new URL('../hw-cpu.trace.json', import.meta.url), 'utf8')) as { display: string; states: string[] };

function templatesOf(spec: ExampleSpec): TemplateRecord[] {
    const decoded = readModelTemplates(spec.lookup, spec.modelId);
    expect(decoded.defects).toEqual([]);
    return decoded.templates;
}

function run(spec: ExampleSpec, entry: string, templates = templatesOf(spec)) {
    return generate(recordOf(spec.lookup, spec.modelId), spec.lookup, spec.modelId, templates, entry);
}

/** The spec with the values of one slot replaced: a fresh copy, the committed one untouched. */
function withSlot(id: string, values: unknown[]): ExampleSpec {
    const spec = loadSpec('hw-cpu');
    spec.lookup[id] = { ...spec.lookup[id], values };
    return spec;
}

describe('hw-cpu on the Verilog target (route A)', () => {
    it.each(['cpu', 'tb'])('generates the committed expected/%s.v without error (mutant: any transfer, guard, initial word or layout changed)', entry => {
        const out = run(loadSpec('hw-cpu'), entry);
        expect(out.errors).toEqual([]);
        if (WRITE) writeFileSync(EXPECTED(`${entry}.v`), out.code);
        expect(out.code).toBe(readFileSync(EXPECTED(`${entry}.v`), 'utf8'));
    });

    it('codes the control states by their index in the committed trace (mutant: the places in another order)', () => {
        const code = run(loadSpec('hw-cpu'), 'cpu').code;
        const params = [...code.matchAll(/localparam \[3:0\] (\w+) = 4'h([0-9a-f]);/g)].map(m => [m[1], parseInt(m[2], 16)]);
        expect(params).toEqual(trace.states.map((s, i) => [s, i]));
    });

    it("prints the trace's own $display line at the falling edge (mutant: a register's format or order changed)", () => {
        const code = run(loadSpec('hw-cpu'), 'tb').code;
        expect(code).toContain(`always @(negedge clk) begin\n    ${trace.display};`);
        expect(code).toContain("if (state == 4'ha) $finish;");
    });

    it('fills the ROM from the cells\' init and the RAM from σ (mutant: the ROM read from σ, or the RAM from init)', () => {
        const spec = loadSpec('hw-cpu');
        const code = run(spec, 'cpu').code;
        for (let i = 0; i < 16; i++) {
            const init = Number(spec.lookup[`V_rom_${i}_init`].values[0]);
            expect(code).toContain(`rom[${i}] = 8'h${init.toString(16).padStart(2, '0')};`);
            expect(code).toContain(`ram[${i}] = 8'h00;`);
        }
    });

    it('binds JavaScript when the entry names no target (mutant: the Verilog target bound for every template)', () => {
        const spec = loadSpec('hw-cpu');
        const templates = templatesOf(spec).map(t => (t.name === 'cpu' ? { name: t.name, params: t.params, body: t.body } : t));
        const out = run(spec, 'cpu', templates);
        expect(out.errors.length).toBeGreaterThan(0);
        expect(run(spec, 'tb', templates).errors).toEqual([]);
    });

    it('names the guard the printer refuses, at its hole (mutant: a refusal swallowed or the element unnamed)', () => {
        const out = run(withSlot('V_dec_LDA_guard', ['IR.[value].slice(7, 4).toNumber() == 1']), 'cpu');
        expect(out.errors).toHaveLength(1);
        expect(out.errors[0].message).toMatch(/^The guard of dec_LDA, '.*', has no Verilog: /);
        expect(out.code).toContain('end else if () begin');
    });

    it('refuses on the entry a state whose transitions are not determined (mutant: the unguarded check dropped)', () => {
        const out = run(withSlot('V_dec_NOP_guard', []), 'cpu');
        expect(out.code).toBe('');
        expect(out.errors).toEqual([{ template: 'cpu', offset: 0, line: 1, column: 1,
            message: 'The model has no verilog: DECODE has a transition without guard among 11: which one fires is not determined' }]);
    });
});
