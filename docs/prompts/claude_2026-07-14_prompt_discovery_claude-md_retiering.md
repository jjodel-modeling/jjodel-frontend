# Discovery (read-only): CLAUDE.md re-tiering

**Type**: Phase 1 discovery, READ-ONLY. No edits, no commits.
**Goal**: map the current `CLAUDE.md` and classify every section so we can shrink the always-on file without losing any load-bearing rule. Output is a discovery report, then a HARD STOP.

Read `CLAUDE.md` at the project root first, then follow it. If anything below conflicts with `CLAUDE.md`, flag the conflict and stop rather than proceeding.

---

## WHAT

Produce a tiering map of the current `CLAUDE.md`. For every section, classify it into one of three tiers and verify the classification against the real codebase:

- **Tier 1 (stays, always-on)**: non-negotiable rules, gates, triggers, the log/measurement protocol, indexes. The test is: "if Claude Code forgets this, a regression follows."
- **Tier 2 (moves, on-demand)**: deep but conditional playbooks. If the content is bound to a specific directory, the target mechanism is a **subtree `CLAUDE.md`** (a `CLAUDE.md` inside that directory, which loads automatically and deterministically when files there are read). Only if the content is cross-cutting and not bound to one directory, the target is an explicit skill.
- **Tier 3 (leaves the doc, goes to discovery)**: volatile facts (line numbers, file→role tables, directory trees) that the discovery phase re-derives per task.

This is analysis only. Do not move, edit, or delete anything.

## WHERE

- `CLAUDE.md` (project root): the file to map.
- The directories the sections claim to govern, to verify path-binding: `frontend/src/components/editor-v2/` (and its `hooks/`, `sync/`, `utils/`), `frontend/src/jjel/`, `frontend/src/jjtl/`, `frontend/src/jjscript/`, `frontend/src/model/`, `frontend/src/services/`, styles locations, `docs/DESIGN-SYSTEM.md`.
- Existing `SPEC.md` files under the language directories (to check whether §11/§12/§13 duplicate them).
- Any already-existing nested `CLAUDE.md` files anywhere in the repo.

## HOW

Run these checks and record the answers in the report:

1. **Ground truth**: real total line count of `CLAUDE.md`; the ordered list of `##`/`###` headings with the line range of each.
2. **Per-section tier table**: one row per section with columns `section | ~lines | tier (1/2/3) | proposed destination | path-binding (which dir, or "cross-cutting", or "n/a") | volatility (stable/volatile)`. Base tier on the test above, not on topic.
3. **Path-binding verification**: for each Tier-2 candidate, confirm the section's content actually maps to the directory you'd move it to (e.g., that §3 sync/D-L files live under `editor-v2/`, that §11 concerns `src/jjel/`). Note any section whose content spans multiple unrelated directories (those are skill candidates, not subtree candidates).
4. **Subtree support check**: report whether any nested `CLAUDE.md` already exists in the repo, and whether the project's tooling/setup shows evidence of subtree-memory usage. Do not assume; check.
5. **Volatility spot-check (sample, do not fix)**: for a sample of the specific line-number references baked into CLAUDE.md, verify whether they still point at the cited construct. Suggested samples: the TRANSACTION-prohibition site referenced in §3.3; the `set_name` / identity-slot site referenced in §3.12 (cited around `LModelElement.tsx:7484`); the Step-4 deps line referenced in §3.5. Report for each: still-accurate / drifted-to-line-N / not-found. This measures how much of §3/§19 is stale today.
6. **Duplication check**: for §11 (JjEL), §12 (JjTL), §13 (JjScript), report whether the content is already covered by a `SPEC.md` in the corresponding directory, so that moving it out is deduplication rather than loss.
7. **Always-on core estimate**: sum the Tier-1 lines and report the projected size of the slimmed always-on `CLAUDE.md`, plus the total lines proposed for Tier 2 and Tier 3.
8. **Open questions for Alfonso**: anything where the tier or the mechanism (subtree vs skill vs discovery) is genuinely ambiguous and needs a decision in chat.

## Discovery report (MANDATORY)

Save the report to `docs/discovery/discovery_2026-07-14_claude_md_retiering.md`. Create the folder if missing. The report must contain, at minimum: the goal, the files/dirs read (full paths), the per-section tier table, the path-binding and volatility findings, the line-reference spot-check results, the duplication findings, the always-on core estimate, and the open questions. The in-chat analysis will start from this saved report, not from terminal output.

## HARD STOP

After writing the report: stop. Do not modify `CLAUDE.md`, do not create any subtree `CLAUDE.md`, do not create skills, do not commit. The Phase 2 split prompt will be generated in chat after we review the report together.

## REFERENCES (mechanics this plan relies on, for context)

- `CLAUDE.md` is loaded in full into context at every session start; it costs tokens every session. Official guidance targets under ~200 lines; the current file is ~1850.
- A subtree `CLAUDE.md` (inside a directory) loads on-demand, deterministically, when Claude reads files in that directory. This is the safe home for path-bound load-bearing rules.
- Skills load only the name+description at startup; the body loads on invocation, and auto-invocation is model-decided (not deterministic). Reserve skills for cross-cutting playbooks that a prompt will load explicitly.
- `@path` imports in CLAUDE.md are expanded fully into context at startup: they reduce file size, not context footprint. Not a tool for shrinking the always-on footprint.

Scope: read-only. Zero edits. Zero commits. If a check cannot be completed, record it as an open question in the report rather than guessing.
