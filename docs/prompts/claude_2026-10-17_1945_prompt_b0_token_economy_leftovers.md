# B0: close the 2026-10-13 token-economy leftovers (hook registration, runner allow, effort, CLAUDE.md §0)

Prompt-ID: P-2026-10-17-1945
Chat: C-2026-10-17-1757
Front: harness
Lane: full (RC-3: normative CLAUDE.md, four files); Phase 1 is the 2026-10-15 report §2.6, no new discovery (rework rule of RC-20)
Status: eseguito 2026-10-18 · lane harness · 6e910eb68
Depends: P-2026-10-15-1725
Request: none (chat decision under RC-25; Alfonso delegated on 2026-10-17 19:39)
Corregge: 2026-10-13 19:30

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P8 (visual check) does not apply, no UI is touched. P4 (discovery report) does not apply, Phase 1 is §2.6 of `docs/discovery/discovery_2026-10-15_lean_context_model_routing.md`, already committed.

Worktree: `~/jjodel-release`, branch `alfonso-frontend-jjtl`. Before anything else: `pwd`, branch, `git log -1` and `git status`. If the branch differs, stop with `Outcome: blocked`. `git status` is expected to show ` M CLAUDE.md` and nothing else: that diff is the uncommitted §0/§0.1 text of P-2026-10-13-1930 and this lane commits it. If the diff touches anything outside §0 and §0.1, or other files are modified, stop with `Outcome: question` and list them.

Mode: interactive session (RC-19, RC-36: `.claude/` is a protected path and is never edited in bypass). Alfonso launches `claude` in `~/jjodel-release` and answers the `ask` prompts on `.claude/settings.json`. Not launched through `lane-run`, so no `tier.txt` and no draw. Model: `claude-opus-5-5` as pinned (RC-16).

## Lane discipline
Every reply of this session opens with `[P-2026-10-17-1945 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
Time limit: 60 minutes (RC-20). If item 5 is not settled by minute 40, defer it to B7 and say so in the log entry.

## Context (do not redo the analysis)
`a7ab0a663` (P-2026-10-13-1930) committed `frontend/scripts/hooks/output-budget.mjs`, its test, `frontend/scripts/run-quiet.mjs`, `.claude/agents/explorer.md` and the `.gitignore` line. It never did the rest: the hook is not registered in `.claude/settings.json`, so it denies nothing; the runner has no `allow` entry; `effortLevel` is still `xhigh`; the CLAUDE.md §0/§0.1 text is uncommitted while `CLAUDE.md:108` already claims the hook is active; no log entry exists; the Status line still says `da eseguire` and the file has no `Front:` line (check:docs Check E, ticket in `docs/log-inbox/release-3-1-da1.md`). RC-49 (2) approves B0 as the first batch, unchanged.

## COSA
1. Register the hook: in `.claude/settings.json` add `frontend/scripts/hooks/output-budget.mjs` as a second `PreToolUse` entry on `Bash`, after `bash-guard.mjs`, with the same timeout and the same invocation form (read how `bash-guard.mjs` is registered and copy that form).
2. Add the `allow` entry for `frontend/scripts/run-quiet.mjs`, in the form the file already uses for allowed commands.
3. Set `effortLevel` to `high`. Change nothing else in that file.
4. Exemptions (report §6.1, risk 7): list the child processes that `frontend/scripts/lane-run.mjs`, `frontend/scripts/gates/` and `frontend/scripts/smoke/` run through a Bash tool call, and check each against the hook's rules a to e. If one would be denied, add the exemption in `output-budget.mjs` with a test and name it in the log entry. If none, say so and give the search you ran (a claim of absence carries its search, R-RAIL-28).
5. Read-only subagents on Sonnet (RC-49 (2)): check in the official Claude Code documentation whether the built-in `Explore` agent's model can be fixed per project (an agent override under `.claude/agents/`, a per-call `model`, or an environment variable). If documented, apply it so that `Explore` runs on `claude-sonnet-5-5` (`explorer` already does). If not documented, change nothing and write the finding in the log entry for B7.
6. Commit the CLAUDE.md §0/§0.1 diff after reading it in full. It must describe what the file now does: hook registered, effort default `high`, `xhigh` for critical-zone work (§3) and visual-bug diagnosis (§5), `medium` for trivial work outside the critical zone, never `max` unless the prompt asks. Fix the text where it claims more than items 1 to 5 deliver. Then `npm run gen:agents` and `npm run check:agents` (every generated file, not only the root).
7. Measure, do not claim: with the registration in place, show that `cat CLAUDE.md` is denied and `cat CLAUDE.md | head -n 20` passes (the hook's test fixtures, or a nested `claude -p` in the worktree). Put the two command lines and their verdicts in the inbox entry body; `Notes` stays within 500 characters.

## Gates (all green before the commits)
`npx vitest run frontend/scripts/hooks/__tests__/outputBudget.test.ts`; `npm run check:agents`; `npm run typecheck` (RC-48: zero errors); `npm run check:docs` after the docs commit, Check E included.

## Commits (P13, RC-17: docs and code never together)
Commit 1, code and configuration, explicit pathspec: `.claude/settings.json`, `CLAUDE.md`, `AGENTS.md`, every other file `gen:agents` regenerates, and `frontend/scripts/hooks/output-budget.mjs` with its test only if item 4 changed them. Subject under 72 characters, trailer `Model:` (P6).
Commit 2, docs: the log entry in `docs/log-inbox/harness.md` (§21.2 format, `Corregge: 2026-10-13 19:30`, `Causa` chosen honestly: the leftovers are scope left undone, not a wrong analysis); the Status flip of `docs/prompts/claude_2026-10-13_1930_prompt_token_economy_harness.md` (eseguito, sha of commit 1, `closed by P-2026-10-17-1945`) and its missing `Front: harness` line; the Status flip of this prompt.
No push (RC-19).

## HARD STOP
None planned: the lane closes with `Outcome: done` after commit 2 and green gates. Stop with `Outcome: question` if `.claude/settings.json` has no existing entry whose form you can copy, or if the CLAUDE.md diff goes beyond §0/§0.1.

## NON FARE
Do not touch `bash-guard.mjs`, `critical-zone.mjs`, `lane-run.mjs`, `docs/PROTOCOL.md` or `docs/decisions.md`. Do not change the model pin. Do not slim CLAUDE.md beyond §0/§0.1 (that is B2 and B4). No `git add .`, no `git stash`.

## RIFERIMENTI
`docs/prompts/claude_2026-10-13_1930_prompt_token_economy_harness.md` (items 1 to 4 of its COSA are the spec of this lane); `docs/discovery/discovery_2026-10-15_lean_context_model_routing.md` §2.6, §5.6 (B0), §6.1 risk 7, §7.5; `docs/decisions.md` RC-16, RC-19, RC-36, RC-45, RC-48, RC-49; `docs/ratifiche/claude_2026-10-17_memo_harness_front_fable_trial.md`; `docs/PROTOCOL.md` P6, P9, P13.
