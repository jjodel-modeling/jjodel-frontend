#!/usr/bin/env node
/*
 * generate-agents.mjs — regenerate AGENTS.md as a projection of CLAUDE.md.
 *
 * Single source, zero drift: AGENTS.md (Codex's twin of CLAUDE.md) is GENERATED
 * from CLAUDE.md and never hand-edited. Run `npm run gen:agents` after any
 * CLAUDE.md change.
 *
 * Deterministic & idempotent: the output is a pure function of the CLAUDE.md
 * file(s) (+ the optional root runtime fragment). The script never reads
 * AGENTS.md back, so running it twice yields byte-identical files.
 *
 * Tree-aware: it walks the repo (excluding node_modules and dotdirs) and writes
 * an AGENTS.md next to EVERY projectable CLAUDE.md. Empty or marker-only files
 * (no Markdown heading) are skipped — e.g. the [CANARY] smoke-test probe at
 * frontend/src/components/editor-v2/CLAUDE.md. Today only the root CLAUDE.md is
 * projectable, so only the root AGENTS.md is produced; when nested CLAUDE.md
 * files are added later, their AGENTS.md siblings appear automatically.
 *
 * §0 Runtime (root only): CLAUDE.md's "## 0. Runtime — model & effort" is
 * Claude-specific (model, /effort). It is replaced by docs/_agents/runtime-codex.md
 * IFF that file carries real content; an HTML-comment-only / whitespace stub counts
 * as empty → no §0 is emitted at all. Nested files have no §0 and receive name
 * substitutions only.
 *
 * Name substitutions (case-sensitive, applied to the projected body only — never
 * the banner):
 *   "Claude Code" -> "Codex"
 *   "CLAUDE.md"   -> "AGENTS.md"
 * The operational log is SHARED: "docs/claude-code-log.md" (lowercase) is
 * intentionally NOT rewritten, so both tools read and write the one log file.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

// Repo root is derived from THIS script's location, not process.cwd(), so the
// generator behaves identically whether run from the root or from frontend/.
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ROOT_CLAUDE = resolve(ROOT, 'CLAUDE.md');
const RUNTIME_FRAGMENT = resolve(ROOT, 'docs/_agents/runtime-codex.md');

const BANNER = '<!-- GENERATED FROM CLAUDE.md — DO NOT EDIT. Run `npm run gen:agents` to regenerate. -->';

const SUBSTITUTIONS = [
    [/Claude Code/g, 'Codex'],
    [/CLAUDE\.md/g, 'AGENTS.md'],
];

function applySubstitutions(text) {
    let out = text;
    for (const [pattern, replacement] of SUBSTITUTIONS) out = out.replace(pattern, replacement);
    return out;
}

// Recursively collect CLAUDE.md paths, excluding node_modules and dotdirs.
function findClaudeFiles(dir, acc) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
        const full = join(dir, entry.name);
        if (entry.isDirectory()) findClaudeFiles(full, acc);
        else if (entry.isFile() && entry.name === 'CLAUDE.md') acc.push(full);
    }
    return acc;
}

// A CLAUDE.md is projectable only if it is a real reference doc: non-empty and
// carrying at least one Markdown heading. This deterministically skips empty or
// marker-only files (e.g. the [CANARY] smoke-test probe, a single line with no
// heading).
function isProjectable(body) {
    if (!body.trim()) return false;
    return /^#{1,6}\s/m.test(body);
}

// The §0 runtime fragment's effective content, or null when absent/empty.
// The stub ships as an HTML-comment-only marker → stripped to empty → no §0.
function runtimeFragment() {
    if (!existsSync(RUNTIME_FRAGMENT)) return null;
    const raw = readFileSync(RUNTIME_FRAGMENT, 'utf8');
    const stripped = raw.replace(/<!--[\s\S]*?-->/g, '').trim();
    return stripped ? raw.trim() : null;
}

// Root projection: banner + substituted body, with §0 replaced by the runtime
// fragment (if any) or omitted entirely.
function projectRoot(claude) {
    const startMatch = claude.match(/^##\s*0\.\s/m);
    if (!startMatch) {
        throw new Error('generate-agents: "## 0." heading not found in root CLAUDE.md — aborting (no silent projection).');
    }
    const startIdx = startMatch.index;

    // Next "## " heading after §0 — keyed on heading text, not a line number.
    const afterHeading = startIdx + startMatch[0].length;
    const nextRel = claude.slice(afterHeading).search(/^##\s/m);
    if (nextRel === -1) {
        throw new Error('generate-agents: no "## " heading after §0 — aborting.');
    }
    const nextIdx = afterHeading + nextRel;

    const before = applySubstitutions(claude.slice(0, startIdx).replace(/\s+$/, ''));
    const after = applySubstitutions(claude.slice(nextIdx).replace(/\s+$/, ''));

    const fragment = runtimeFragment();
    const body = fragment ? `${before}\n\n${fragment}\n\n${after}` : `${before}\n\n${after}`;
    return `${BANNER}\n\n${body}\n`;
}

// Nested projection: banner + name substitutions only (no §0 logic).
function projectNested(claude) {
    return `${BANNER}\n\n${applySubstitutions(claude.replace(/\s+$/, ''))}\n`;
}

function main() {
    const files = findClaudeFiles(ROOT, []).sort();
    let written = 0;
    let skipped = 0;
    for (const src of files) {
        const claude = readFileSync(src, 'utf8');
        if (!isProjectable(claude)) {
            console.log(`generate-agents: skip ${src} (empty or marker-only)`);
            skipped++;
            continue;
        }
        const output = resolve(src) === ROOT_CLAUDE ? projectRoot(claude) : projectNested(claude);
        const out = resolve(dirname(src), 'AGENTS.md');
        writeFileSync(out, output);
        console.log(`generate-agents: wrote ${out} (${output.split('\n').length - 1} lines).`);
        written++;
    }
    console.log(`generate-agents: done — ${written} written, ${skipped} skipped.`);
}

main();
