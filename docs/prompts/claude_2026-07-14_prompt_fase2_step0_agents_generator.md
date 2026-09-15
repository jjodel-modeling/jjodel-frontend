# Phase 2 · Step 0 — AGENTS.md single-source generator

**Type**: two-phase. Phase 1 read-only (catalog + verify) → HARD STOP → Phase 2 build + regenerate + commit (only after go-ahead in chat).
**Decision locked**: AGENTS.md becomes a **generated projection** of `CLAUDE.md`, not a hand-maintained file. One source, zero drift.
**Scope**: `AGENTS.md`, the new generator script, and `docs/claude-code-log.md` only. Do NOT touch the content of `CLAUDE.md` in this step (that is Step 1).

Read the root `CLAUDE.md` first and follow it. If anything here conflicts with it, flag the conflict and stop.

Context: `AGENTS.md` is currently a hand-diverged, stale twin of `CLAUDE.md` for Codex (roughly `s/CLAUDE/AGENTS/`, `s/Claude Code/Codex/`, `s/claude-code-log/Codex-log/`, plus a different §0 runtime block and a stale §17 that wrongly lists `npm run lint`, which does not exist). We are replacing the hand-maintained file with a script that regenerates it from `CLAUDE.md`.

---

## PHASE 1 — read-only catalog + verification (HARD STOP after)

Do NOT edit or create anything except the discovery report in Phase 1.

1. **Existence check** (needed by later steps, verify now): report whether `docs/DESIGN-SYSTEM.md` and `docs/ai-providers.md` exist, with line counts. A prior session flagged `docs/ai-providers.md` as possibly non-existent; confirm ground truth. If either is missing, say so explicitly (it blocks a later dedup, not this step).

2. **Full delta catalog `CLAUDE.md` ↔ `AGENTS.md`**: diff the two files and, for every region that differs, classify each delta as exactly one of:
   - **Legitimate tool difference** (must be preserved and parametrized in the generator): e.g. the §0 runtime block (model / effort are tool-specific), and the name substitutions (`Claude Code`→`Codex`, `claude-code-log`→`Codex-log`, filename/self-references).
   - **Staleness / bug** (must be dropped; generation fixes it by re-projecting from CLAUDE.md): e.g. §17 listing `npm run lint`, the wrong dev command, and any section AGENTS.md is simply missing.
   Produce a table: `region | CLAUDE.md content (brief) | AGENTS.md content (brief) | classification | action in generator`.

3. **Enumerate the exact substitution set**: list every literal string that must be rewritten CLAUDE→AGENTS side (case-sensitive), so the generator is complete and reversible. Flag any that are risky (e.g. substrings that could match unintended text).

4. **Propose the generator design** and confirm what is idiomatic for this repo (check `package.json` scripts, existing `scripts/` dir, whether the repo uses node/sh/ts for tooling): a single script that reads `CLAUDE.md`, swaps the tool-specific §0 block for a Codex variant kept in a small fragment file (propose a path, e.g. `docs/_agents/runtime.md` or inline-in-script), applies the substitution set, and writes `AGENTS.md`. Note how it would extend to nested files later (if/when subtree `CLAUDE.md` files exist, the same script regenerates their `AGENTS.md` siblings). Confirm whether Codex reads nested `AGENTS.md` at all (check docs/knowledge if available; if unknown, record as an open question, do not guess).

5. **Save the report** to `docs/discovery/discovery_2026-07-14_agents_generation.md`: goal, files read, existence-check results, the delta catalog table, the substitution set, the proposed generator design, and open questions. The chat review starts from this file.

**HARD STOP.** Do not build the script or touch AGENTS.md until go-ahead is given in chat.

---

## PHASE 2 — build generator + regenerate + commit (ONLY after go-ahead)

Do this only after the Phase 1 catalog is reviewed and confirmed in chat. The go-ahead may adjust the substitution set or the §0 handling.

1. Create the generator script at the agreed path (idiomatic to the repo), plus the Codex §0 runtime fragment. The script must be deterministic and idempotent (running it twice yields an identical `AGENTS.md`).
2. Run it to regenerate `AGENTS.md`. The result must: carry every section currently in `CLAUDE.md` (fixing the missing sections), keep the correct §17 (no `lint`), and preserve only the legitimate tool differences from the Phase 1 catalog.
3. **Show the full diff** of the new `AGENTS.md` against the old one, and confirm no legitimate tool-specific content was lost. If the repo has a build/typecheck, run it (this is docs + a script, so no app impact is expected; report if anything unexpected happens).
4. **HARD STOP** for Alfonso's visual review of the diff.
5. On approval: stage only the generator script, its fragment, the regenerated `AGENTS.md`, and (if wired) a `package.json` script entry to run it. Never `git add .`. Conventional commit, one line, e.g. `chore(docs): generate AGENTS.md from CLAUDE.md (single source)`. Update `docs/claude-code-log.md` with the entry format (all three metric fields filled honestly).

---

## REFERENCES

- Rationale: `AGENTS.md` had already drifted and contained a wrong command; a generated projection removes the second maintenance surface so future `CLAUDE.md` edits (Steps 1-4) auto-project.
- The generator is infrastructure for the whole re-tiering: after it exists, every later step ends by regenerating `AGENTS.md`.
- Do not start the `CLAUDE.md` content changes (dedup, subtree extraction) here. Those are Step 1+, separate prompts.

Scope reminder: only `AGENTS.md`, the generator script + fragment, `docs/claude-code-log.md`. Zero changes to `CLAUDE.md` content. Read-only in Phase 1 except the discovery report.
