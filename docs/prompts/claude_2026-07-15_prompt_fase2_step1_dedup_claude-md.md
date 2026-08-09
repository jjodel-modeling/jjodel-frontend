# Phase 2 · Step 1 — CLAUDE.md dedup (safe, provable deletions)

**Prereq**: Step 0 committed (the `gen:agents` generator exists). After every CLAUDE.md edit in this step, run `npm run gen:agents` so `AGENTS.md` (and any siblings) reproject automatically; stage the regenerated file with each commit.

**Scope**: `CLAUDE.md`, the regenerated `AGENTS.md`, `docs/claude-code-log.md`. Three dedup families, each its own thematic commit with a HARD STOP for Alfonso's diff review before committing. Never `git add .`; the log has unrelated dirty work (WP1), so use the §6.1 sparse-log staging pattern to stage only this step's new entries.

Read `CLAUDE.md` first and follow it. This step only removes duplicated content; it moves nothing to subtrees or skills (that is Step 2+). Do not touch line numbers or §7/§16/§17 here.

---

## Family A — language chapters → their SPEC.md

`§11` (JjEL) and `§12` (JjTL) largely duplicate `frontend/src/jjel/SPEC.md` and `frontend/src/jjtl/SPEC.md`.

1. **Verify before deleting** (do NOT skip): open both SPEC files and confirm they actually cover the material in §11 and §12 (constructs, precedence, design decisions, built-ins, execution flow). Confirm specifically that `§12.7` (the "update all 5 files together when changing JjTL syntax" checklist) is **NOT** present in `jjtl/SPEC.md`.
2. Replace the body of §11 with a short pointer: one or two lines stating that the JjEL reference lives in `frontend/src/jjel/SPEC.md`, plus any 1-line load-bearing rule that is genuinely absent from the SPEC (if none, just the pointer).
3. Replace the body of §12 with a pointer to `frontend/src/jjtl/SPEC.md`, **but keep §12.7 verbatim** (it is a maintenance procedure, not in the SPEC). If §13 (JjScript) is short and stays, leave it untouched (its SPEC is created in a later step).
4. If the verification in step 1 shows any content in §11/§12 that is NOT in the SPEC and is load-bearing, do NOT delete it: keep it inline and report it at the hard stop. When in doubt, keep.
5. `npm run gen:agents`. **HARD STOP**: show the CLAUDE.md diff and the regenerated AGENTS.md diff. On approval, commit `docs(claude): dedup JjEL/JjTL chapters to their SPEC.md` (+ log entry).

## Family B — consolidate the four overlapping blocklists

The NON-NEGOTIABLE block, `§1`, `§4.2`, and `§20.1` restate the same rules (don't rename identifiers, don't scope-creep, never `git add .`, don't reintroduce removed code, etc.).

1. **Build the union first** and show it before editing: list every distinct rule across the four blocks, and for each note which of the four it came from. This is the safety check: nothing unique may be dropped.
2. Keep ONE canonical list (in the top NON-NEGOTIABLE block). Replace §1, §4.2, §20.1 with a one-line pointer to the canonical block, preserving any surrounding non-blocklist prose in those sections.
3. Present the union mapping (rule → original sources) at the HARD STOP so Alfonso can confirm no rule was lost.
4. `npm run gen:agents`. **HARD STOP**: show diffs + the union mapping. On approval, commit `docs(claude): consolidate the four overlapping blocklists into one canonical list` (+ log entry).

## Family C — remove two internal duplications

Two facts are each stated twice in CLAUDE.md:

1. `windoww` global store: `§3.11` and `§15.4`. Keep the `§15.4` (gotchas) copy as canonical; replace `§3.11` with a one-line cross-reference to it.
2. Ecore round-trip uses `pkg.__raw.uri`: stated in both `§3.7` and `§14`. Keep the `§14` (Ecore I/O) copy as canonical; replace the duplicated sentence in `§3.7` with a cross-reference, keeping §3.7's L-layer-vs-D-layer distinction that is unique to it.
3. Do NOT touch the `§3.1`⇄`§19.1` file-table duplication here; `§19` is reduced in Step 4, so that dedup happens there.
4. `npm run gen:agents`. **HARD STOP**: show diffs. On approval, commit `docs(claude): remove internal duplications (windoww, raw.uri)` (+ log entry).

---

## Verification each family

- After each `npm run gen:agents`: confirm it stayed idempotent (a second run yields no further change) and that no section other than the intended ones changed in AGENTS.md.
- Run build/typecheck if the repo gates on them (docs-only change; typecheck baseline is ~33, unchanged expected).

## Out of scope (later steps)

- §7 / §16 dedup to `docs/DESIGN-SYSTEM.md` / `docs/ai-providers.md` (needs a coverage check, next content pass).
- §17 dev-command fix (waiting on the correct command from Alfonso).
- Moving §3.* / §9 to subtree `CLAUDE.md`, §5.1 / §15 to skills, creating `jjscript/SPEC.md` (Step 2/3).
- §18 / §19 reduction and softening line numbers to symbol references (Step 4).
- Do not change any line-number references in this step.
