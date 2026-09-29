# Prompt: discovery, trace monitor stage 2 (requirement files, the `Requirement:` header, the T6 changes)

Prompt-ID: P-2026-09-29-0404
Chat: C-2026-09-28-1936
Lane: discovery (read-only; the trace indexer and monitor, the prompt headers, the decision rows). Tier: heavy.
Status: da eseguire

Worktree: `~/jjodel-w-trace2`, branch `trace-stage2-disc` (cut by the chat from `alfonso-frontend-jjtl` at `1430054fe`, `frontend/node_modules` symlinked as P14 allows), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-trace2`, branch `trace-stage2-disc`, `git log -1` is the docs commit that added this prompt; if any differs, stop with `Outcome: blocked` and say which.

## COSA

Stage 1 of the trace monitor (indexer plus monitor) is on the trunk (the `harness-trace` merges of 2026-09-28; discovery `docs/discovery/discovery_2026-09-27_trace_monitor.md`, which defines stage 2 as «requirement files and the `Requirement:` header»). The RC-27 second opinion deferred four changes (T6) to stage 2: reserved REQ ids; freshness of verification; a `Check:` header; a retired REQ still cited counts as a miss (`docs/sessioni/sessione_2026-09-28_3.md:19`). Stage 2 is harness tooling: nothing in it changes the product or the MODELS demo.

Goal: the facts and a Phase 2 plan for stage 2 with the T6 changes, and the list of what is Alfonso's to decide (for example which requirements exist and who writes them).

## DOVE (read-only)

- The stage 1 code (indexer, monitor, their tests; find them from the `harness-trace` merge commits), `docs/HARNESS-DOCS.md`, `docs/PROTOCOL.md` P16, the prompt headers in `docs/prompts/`, `docs/decisions.md` RC-17..RC-34.
- Report: `docs/discovery/discovery_2026-09-29_trace_monitor_stage2.md`, opening with `## 0. Answer in brief`, at most 40 lines; plus this prompt's Status and a log entry in the fitting `docs/log-inbox/` file (say which).

## COME

1. Read `CLAUDE.md` (§6, the discovery rules), `docs/PROTOCOL.md` P16, RC-20, RC-21, RC-27, RC-33, RC-34, the stage 1 discovery and the session file cited above.
2. Answer with [M]/[R] evidence and file:line: the REQ file format and location (grep that `REQ-`, `docs/requirements`, `Requirement:`, `Check:` are still free); how the indexer would read them; each T6 change as a concrete rule with its test; what a prompt header gains and whether old prompts stay valid (they must: additive only); the effect on `check:docs` and `lane-run merge` gates (a new gate must not block today's merges).
3. Probes only as gitignored `_tmp_*` scripts under `npx tsx`, no dev server: run the stage 1 indexer on the trunk and report its counts.
4. `Recommended:` Phase 2 file list and order. Name every point that is Alfonso's decision.
5. One docs commit. Stop with `Outcome: hard-stop` (or `question`), the sha and §0.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree, a critical-zone file, product code.

## RIFERIMENTI

- The stage 1 discovery; RC-27; `docs/sessioni/sessione_2026-09-28_3.md`.
