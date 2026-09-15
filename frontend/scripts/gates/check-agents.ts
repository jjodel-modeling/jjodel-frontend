/**
 * check-agents.ts — generated-vs-source gate for AGENTS.md.
 *
 * AGENTS.md is a projection of CLAUDE.md produced by scripts/generate-agents.mjs
 * and never hand-edited. Nothing used to verify that the committed projection
 * still matched its source, and it silently fell behind twice in three days
 * (f15a22bd2 note 3, then again between the decisions.md pointer and 363f8166d —
 * once carrying a NON-NEGOTIABLE rule with it). This gate closes the class: it
 * regenerates into a system temp directory and compares byte for byte with what
 * is committed.
 *
 * Every file the generator produces is compared, not just the root one: the
 * nested projections (today frontend/src/jjtl/AGENTS.md) are exposed to exactly
 * the same drift, through the same generator.
 *
 * This script never writes inside the repo. The generator is invoked with
 * --out-dir pointing at a temp directory, which is removed before exit.
 *
 * Run: npm run check:agents
 */

import { readFileSync, existsSync, readdirSync, mkdtempSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { dirname, resolve, join, relative } from 'node:path';
import { tmpdir } from 'node:os';

const HERE = dirname(fileURLToPath(import.meta.url));
// frontend/scripts/gates -> frontend/scripts -> frontend -> repo root
const REPO = resolve(HERE, '..', '..', '..');

const GENERATOR = resolve(REPO, 'scripts/generate-agents.mjs');

/** The command to run when this gate is red. Printed verbatim in the message. */
const REGEN_COMMAND = 'cd frontend && npm run gen:agents';

/** Cap on the diff extract, in lines. */
const DIFF_EXTRACT_LINES = 20;

interface Mismatch {
    /** Repo-relative path of the projected file. */
    file: string;
    reason: 'missing' | 'differs';
    differingLines: number;
    extract: string[];
}

function rel(p: string): string {
    return relative(REPO, p) || p;
}

// ── Generation into a temp tree ──────────────────────────────────────────────

/**
 * The generator derives its own repo root from its file location, not from
 * process.cwd(), so the working directory of this call is irrelevant.
 */
function generateInto(outDir: string): void {
    execFileSync(process.execPath, [GENERATOR, '--out-dir', outDir], { stdio: 'pipe' });
}

/** Every file produced under the temp root, as paths relative to that root. */
function collectGenerated(dir: string, root: string, acc: string[]): string[] {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) collectGenerated(full, root, acc);
        else if (entry.isFile()) acc.push(relative(root, full));
    }
    return acc;
}

// ── Comparison ───────────────────────────────────────────────────────────────

/**
 * A line-level extract, not a minimal diff: on an insertion every later line
 * shifts and counts as differing. That is acceptable here — the first divergence
 * is the actionable part, and the real failure mode is a source edit that was
 * never projected.
 */
function compare(expected: string, actual: string): { differingLines: number; extract: string[] } {
    const e = expected.split('\n');
    const a = actual.split('\n');
    const max = Math.max(e.length, a.length);

    let differing = 0;
    const extract: string[] = [];
    for (let i = 0; i < max; i++) {
        if (e[i] === a[i]) continue;
        differing++;
        if (extract.length < DIFF_EXTRACT_LINES) {
            if (a[i] !== undefined) extract.push(`      ${i + 1} - committed : ${a[i]}`);
            if (e[i] !== undefined) extract.push(`      ${i + 1} + regenerated: ${e[i]}`);
        }
    }
    return { differingLines: differing, extract };
}

function checkAlignment(): { ok: boolean; lines: string[]; mismatches: Mismatch[] } {
    const tempRoot = mkdtempSync(join(tmpdir(), 'jjodel-check-agents-'));
    const lines: string[] = [];
    const mismatches: Mismatch[] = [];

    try {
        generateInto(tempRoot);
        const produced = collectGenerated(tempRoot, tempRoot, []).sort();

        lines.push(`    ${produced.length} projected file(s) regenerated into a temp tree`);

        for (const p of produced) {
            const expected = readFileSync(join(tempRoot, p), 'utf8');
            const committedPath = resolve(REPO, p);

            if (!existsSync(committedPath)) {
                mismatches.push({ file: p, reason: 'missing', differingLines: 0, extract: [] });
                continue;
            }

            const actual = readFileSync(committedPath, 'utf8');
            if (actual === expected) {
                lines.push(`    aligned: ${p}`);
                continue;
            }

            const { differingLines, extract } = compare(expected, actual);
            mismatches.push({ file: p, reason: 'differs', differingLines, extract });
        }
    } finally {
        rmSync(tempRoot, { recursive: true, force: true });
    }

    return { ok: mismatches.length === 0, lines, mismatches };
}

// ── Report ───────────────────────────────────────────────────────────────────

function main(): void {
    console.log('check-agents — generated documents aligned with their source');
    console.log(`repo: ${REPO}`);

    const outcome = checkAlignment();

    console.log('');
    console.log(`${outcome.ok ? 'PASS' : 'FAIL'}  Check — AGENTS.md is the current projection of CLAUDE.md`);
    for (const l of outcome.lines) console.log(l);

    for (const m of outcome.mismatches) {
        console.log('');
        if (m.reason === 'missing') {
            console.log(`    ERROR  the generator produces ${m.file}, which is not in the repo`);
            continue;
        }
        console.log(`    ERROR  ${m.file} is stale — ${m.differingLines} line(s) differ from the projection`);
        console.log(`      the committed file no longer matches what ${rel(GENERATOR)} produces`);
        for (const l of m.extract) console.log(l);
        if (m.differingLines > DIFF_EXTRACT_LINES) {
            console.log(`      … ${m.differingLines - DIFF_EXTRACT_LINES} further differing line(s) not shown`);
        }
    }

    console.log('');
    console.log('='.repeat(74));
    if (outcome.ok) {
        console.log('  PASS  every generated document matches its source');
        process.exit(0);
    }

    console.log('  FAIL  a generated document is out of date');
    console.log('');
    console.log(`  Regenerate with:  ${REGEN_COMMAND}`);
    console.log('  then include the regenerated file(s) in this commit — they are part of');
    console.log('  the change, not a separate chore. Never hand-edit them.');
    process.exit(1);
}

main();
