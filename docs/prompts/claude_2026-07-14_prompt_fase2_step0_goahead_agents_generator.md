# Phase 2 · Step 0 (go-ahead) — build the AGENTS.md generator

**Phase 1 discovery is complete** (report received and reviewed). Decisions are locked below. Execute Phase 2.

**Scope**: `scripts/generate-agents.mjs`, `docs/_agents/runtime-codex.md`, `frontend/package.json`, the regenerated `AGENTS.md`, `docs/claude-code-log.md`. Do NOT touch the content of `CLAUDE.md` in this step (that is Step 1). Never `git add .`.

Read the root `CLAUDE.md` first and follow it. If any instruction here conflicts with it, flag the conflict and stop.

---

## Locked decisions

1. **Single source**: `CLAUDE.md` (and, later, any nested `CLAUDE.md`) is canonical. `AGENTS.md` is a generated projection, never hand-edited.

2. **Generator**: `scripts/generate-agents.mjs` (node ESM). Resolve every path inside the script relative to the **repo root** (derive it from the script's own location), NOT the current working directory, so it behaves identically whether run from the root or from `frontend/`.

3. **Wiring**: add `"gen:agents": "node ../scripts/generate-agents.mjs"` to `frontend/package.json` scripts.

4. **Banner**: every generated file begins with, on its own first line:
   `<!-- GENERATED FROM CLAUDE.md — DO NOT EDIT. Run `npm run gen:agents` to regenerate. -->`

5. **Name substitutions** (case-sensitive), applied to the CLAUDE.md body only, bounded by the Phase 1 delta catalog (do NOT invent substitutions beyond it): `Claude Code` → `Codex`; the doc self-reference `CLAUDE.md` → `AGENTS.md`. Do NOT rewrite unrelated occurrences of the string "Claude" in prose that are not self-references; use the catalog to scope this precisely.

6. **Log — shared, single record**: do NOT substitute `claude-code-log` → `Codex-log`. Both tools write to the one `docs/claude-code-log.md`. Leave that filename intact in the generated `AGENTS.md`.

7. **§0 Runtime — data-driven, safe by default**: the generator replaces CLAUDE.md's `§0` block (from the `§0` heading up to the next `## ` heading — key on the **heading text**, not line numbers) with the contents of `docs/_agents/runtime-codex.md` **iff** that file exists and is non-empty; otherwise it emits **no** §0 for Codex. Create `docs/_agents/runtime-codex.md` now as an empty stub whose only content is:
   `<!-- Codex runtime (model + effort/config). Fill to project a §0 into AGENTS.md; empty = no §0. Do not invent values. -->`
   Do NOT invent Codex model or effort values. With the stub empty, the generated `AGENTS.md` has no §0 (matching current behavior).

8. **Nested siblings — tree-aware**: build the generator to walk the repo (excluding `node_modules`) and emit an `AGENTS.md` next to **every** `CLAUDE.md` it finds. Today only the root `CLAUDE.md` exists, so it produces only the root `AGENTS.md`; when Step 2 adds nested `CLAUDE.md` files, their `AGENTS.md` siblings are produced automatically. The §0 replacement (decision 7) applies to the **root only**; nested files have no §0. Skip any empty or marker-only `CLAUDE.md` (e.g. a throwaway smoke-test file).

## Steps

1. Create `scripts/generate-agents.mjs`. It must be deterministic and **idempotent** (running it twice yields byte-identical output). For each `CLAUDE.md` found: prepend the banner, apply the substitutions, apply the root-only §0 replacement, and write the sibling `AGENTS.md`.
2. Create `docs/_agents/runtime-codex.md` as the empty stub from decision 7.
3. Add the `gen:agents` script to `frontend/package.json`.
4. Run `npm run gen:agents`. **Show the full diff** of the regenerated root `AGENTS.md` against the old one. Confirm in the output: (a) every CLAUDE.md section is now present (the sections AGENTS.md was missing are restored); (b) §17 no longer lists `npm run lint` and no longer shows the wrong dev command; (c) no §0 block is present (stub empty); (d) `docs/claude-code-log.md` is referenced (not `Codex-log`); (e) no legitimate content was lost.
5. **Idempotency check**: run `npm run gen:agents` a second time; `git status` must show no further change to `AGENTS.md`.
6. Run the repo's build/typecheck if present (this is docs + a build-time script; no app impact expected). Report anything unexpected.
7. **HARD STOP** for Alfonso's visual review of the diff.
8. On approval: stage only `scripts/generate-agents.mjs`, `docs/_agents/runtime-codex.md`, `frontend/package.json`, the regenerated `AGENTS.md`, and `docs/claude-code-log.md`. Conventional commit, one line: `chore(docs): generate AGENTS.md from CLAUDE.md (single source)`. Update `docs/claude-code-log.md` with the standard entry (all three metric fields filled honestly).

## Out of scope

No changes to `CLAUDE.md` content. No nested `CLAUDE.md` creation. No skills, no SPEC files. Those are Step 1 and later, separate prompts.
