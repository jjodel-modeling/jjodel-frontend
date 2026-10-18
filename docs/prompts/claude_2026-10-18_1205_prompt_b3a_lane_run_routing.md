# B3a: lane-run routing records effort and model per launch (runs.jsonl) and injects the cited decisions and log entries into the lane input

Prompt-ID: P-2026-10-18-1205
Chat: C-2026-10-17-1757
Front: harness
Lane: full (governance file `lane-run.mjs`, RC-36; heavy by rule, not drawn)
Status: da eseguire
Depends: P-2026-10-18-0945
Request: none (Alfonso, 2026-10-18 11:44, «applica tutto il più possibile in automatico»; RC-49 (2) approved AM-1, AM-5 and AM-7; words kept in the lane folder's request.md, RC-43)

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 does not apply: Phase 1 is `docs/discovery/discovery_2026-10-15_lean_context_model_routing.md` §5.1 D and E, §5.4 AM-1, AM-5, AM-7, §5.6 (B3a); one-session implementation lane (RC-17 fast lane with a governance file, hence heavy). P8 does not apply, no UI.

Worktree: `~/jjodel-w-routing`, branch `lane-run-routing`, created by the chat from the local `alfonso-frontend-jjtl` at the docs commit that added this prompt, with `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch and `git log -1` match; otherwise stop with `Outcome: blocked`. Runs in parallel with P-2026-10-18-1155 (board and lane-usage): disjoint DOVE; this lane does not touch `lane-usage.mjs` or the board.

Model and tier: heavy, Opus 5.5 as pinned (RC-16), effort `high`. Launched with `--tier heavy` (governance, RC-36; not an RC-45 draw).

## Lane discipline
Every reply opens with `[P-2026-10-18-1205 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; questions carry `Recommended: <one line>`; unattended (RC-21, RC-25) except the RC-26 list. Time limit: 90 minutes (RC-20). Priority if time runs short: item 1, then 2, then 3; an item not reached becomes a ticket in the entry. Output discipline (CLAUDE.md §0.1): `lane-run.mjs` is about 2700 lines, read it with Read and `offset`/`limit` around `tierRule`, `start`, `resume`, `status`, `merge --launch`, `chain`; tests through `run-quiet.mjs`. Never start a real lane from this session: the tests use the fake-claude fixtures `laneRun.test.ts` already has.

## Context (do not redo the analysis)
`lane-run start` picks the tier (`tierRule`, heavy when in doubt; RC-32, RC-45 draw) and launches `claude -p` with the pin for heavy or `--model LIGHT_MODEL` for light; nothing records the effort, and the requested model is only implicit in `tier.txt`. B0 (P-2026-10-17-1945) set the interactive `effortLevel` to `high`; AM-7 says heavy lanes run `xhigh` only for the critical zone or a visual bug, otherwise `high`, light `high`. B2 (P-2026-10-18-0945, merged) shipped `npm run decisions -- <IDs>` and `npm run log:find`; AM-5 says the session reads the cited decisions and the relevant log entries instead of the whole register and the last N entries, and that `lane-run` injects them. `.claude/settings.json` is not in this lane's DOVE (interactive, B7): the env keys of AM-1 (`JJODEL_LIGHT_MODEL`, `JJODEL_REPORT_MODEL`) do not exist yet, so this lane reads them when present and falls back to today's constants with one printed line. Escalation (AM-3) and light-for-code (AM-2) wait for the RC-45 report (RC-49 (3)): not in this lane.

## COSA
1. Effort and model per launch (AM-7, AM-1 part).
   a. `tierRule` returns `{tier, model, effort, reason}`. `tier` stays `heavy|light`. `model`: for heavy the pin read from `.claude/settings.json` `model` (as today); for light `env.JJODEL_LIGHT_MODEL` from the same file when present, else the current `LIGHT_MODEL` constant (print `light model: constant (settings env not set, B7)` once per launch). `effort`: heavy `xhigh` when the prompt carries `--critical-zone-goahead`, names a §3.2 critical file in its DOVE, or its `Lane:` line says `visual bug`; otherwise `high`; light `high`. `--effort <level>` on `start`, `resume`, `merge --launch`, `chain` and `escalate` overrides it.
   b. Pass `--effort <level>` to `claude -p` on every launch and resume (check in `claude --help` that the flag exists in the installed CLI; if it does not, pass the effort through the documented alternative and say which in the entry; if none exists, record it in `runs.jsonl` only and open a ticket).
   c. `~/.jjodel-lanes/<id>/runs.jsonl`: one line per launch `{at, kind: start|resume|merge|chain, session, tier, requestedModel, effort, reason}` appended at launch; after exit, `lane-run status <id>` (and `--all` once per lane) completes the last line with `effectiveModel` (from the log's `init`), `outcome` and `exit`, writing the line back once (idempotent). `tier.txt` is unchanged. `status` prints `effort` and the requested/effective models.
2. Targeted reads injected at start (AM-5).
   a. `lane-run start` and `merge --launch` resolve the decision IDs the prompt cites (every `<SERIES>-<n>` token the register knows, as `decisions-query.ts` recognises them; reuse its ID regex by import or by one shared constant, do not copy it) and append to the lane input, after the prompt text, a block `## Decisions in scope (injected by lane-run, AM-5)` with the output of `npm run decisions -- <IDs> --no-related` plus, for each ID, the related rows at depth one. Then a block `## Log entries in scope (injected by lane-run, AM-5)` with `npm run log:find -- --prompt <Depends IDs> --front <Front> --limit 10` (headers only; `--full` for the entries that match a `Depends:` ID). Both blocks are written into `stdin.md` so they can be audited, and their size in bytes is printed at launch and recorded in `runs.jsonl` as `injectedBytes`.
   b. Failure modes: an ID the register does not have is listed under the block as `not found` (the CLI exits 1 but the launch proceeds); a CLI that fails for another reason stops the launch with the error (fail closed: a lane must not start half-briefed).
   c. Cap: if the injected text exceeds 40,000 characters, keep the decisions and drop `--full` bodies from the log block, printing `injected: trimmed to headers`.
3. Tests: `laneRun.test.ts` and `laneRunDirect.test.ts` (and a new `laneRunRouting.test.ts` if the existing files get too long): effort per case (critical go-ahead, §3.2 file in DOVE, visual bug, plain heavy, light, `--effort` override), light model from env versus constant, `runs.jsonl` line at launch and completion by `status` (idempotent on a second `status`), injection blocks present in `stdin.md` with the two headings, `not found` listing, fail-closed on a broken CLI, the 40k trim. Use the existing fake-claude harness of `laneRun.test.ts`; for the CLIs use a fixture register and log under `--root` (B2 added `--root` for this).
4. `docs/harness/gates.md`: five lines on `runs.jsonl` (fields) and the two injected blocks, so the schema is written once.

## Gates
`laneRun.test.ts`, `laneRunDirect.test.ts`, the new file, then all of `scripts/hooks`, through `run-quiet.mjs`; `typecheck:scripts` exit 0; `check:scripts` PASS; `check:docs` after the docs commit (5/5). Real check without launching: `node frontend/scripts/lane-run.mjs status P-2026-10-18-0945` still works on a lane folder that has no `runs.jsonl` (prints `runs: none`).

## Commits (P13, RC-17), explicit pathspecs
Commit 1, `feat(harness): lane-run records effort and model per launch, injects cited decisions (P-2026-10-18-1205)` (under 72 without the suffix): `lane-run.mjs`, the test files, fixtures. Trailer `Model:` (P6).
Commit 2, docs: `docs/harness/gates.md`, the log entry in `docs/log-inbox/harness.md` («Decisions taken (unattended)» and «Decisions awaiting Alfonso» at the end; the latter should name AM-1's settings keys as waiting for B7) and the Status flip of this prompt. No push, no merge (RC-19).

## HARD STOP
None planned. Stop with `Outcome: question` only if the installed `claude` CLI has no way to set the effort per launch (item 1b) and recording alone is judged not worth the lane; or if the injection cannot be done without changing `decisions-query.ts` or `log-find.ts` (out of DOVE): give the measured obstacle and the recommended way out.

## NON FARE
Do not touch `.claude/`, `CLAUDE.md`, `docs/PROTOCOL.md`, `docs/decisions.md`, `lane-usage.mjs`, `lane-board/`, `decisions-query.ts`, `log-find.ts`, any hook. No `escalate` command (AM-3 waits), no change to the RC-45 draw, no `--auto` behaviour change. No `git add .`, no `git stash`, no `git reset --hard`.

## RIFERIMENTI
`docs/discovery/discovery_2026-10-15_lean_context_model_routing.md` §2.3, §4.2, §5.1 D and E, §5.4 AM-1, AM-5, AM-7, §5.6, §7.5; `frontend/scripts/lane-run.mjs` (`tierRule` near line 247, `start` near 860, `resume` near 966, `status`, `merge` near 1677, `chain` near 165); `frontend/scripts/gates/decisions-query.ts` and `log-find.ts` (B2, with `--root`); `frontend/scripts/hooks/__tests__/laneRun.test.ts`, `laneRunDirect.test.ts`; `docs/harness/gates.md`; `docs/decisions.md` RC-16, RC-17, RC-19, RC-20, RC-21, RC-25, RC-26, RC-32, RC-36, RC-43, RC-45, RC-48, RC-49; `docs/PROTOCOL.md` P6, P13, P14, P16.
