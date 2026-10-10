# Lane tracking C: trunk sync, front cut-off moved to 2026-10-11, Front line for auto-intake

Prompt-ID: P-2026-10-10-1612
Chat: C-2026-10-10-1256
Request: https://claude.ai/code/session_01FCFNYi6n4pLBgcbMduJcJe
Lane: full (more than 3 files; touches lane-templates and PROTOCOL.md)
Depends: P-2026-10-10-1532
Front: harness
Status: eseguito 2026-10-10 · lane lane-tracking · 0955ef140

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt says otherwise).

Worktree: `~/jjodel-w-lanetrack`, branch `lane-tracking`, tip `09e62e6ee` plus this prompt's commit. Before
anything else: print `pwd`, branch, `git log -4 --oneline`, `git status`. The tree must be clean and the
branch `lane-tracking`. Otherwise stop.

## Lane discipline
Every reply of this session opens with `[P-2026-10-10-1612 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.

## Context

Lane B (P-2026-10-10-1532) closed `done` and left two tickets in `docs/log-inbox/harness.md`, both blocking
the merge of `lane-tracking` into `alfonso-frontend-jjtl`. The chat measured a third blocker. Decisions,
taken by the chat under RC-21 (reversible, inside the harness front):

1. **Ticket 1 (high).** Other chats committed prompts on the trunk after the cut-off without a `Front:` line
   (P-2026-10-10-1520 from C-2026-10-10-1512, P-2026-10-10-1600 from C-2026-10-10-0057; both lanes are
   running now). They could not know the rule: it is not on the trunk yet. **Decision: move the cut-off to
   `P-2026-10-11-0000`**, so the rule binds from the first prompt of tomorrow, after the merge has put it in
   every chat's `PROTOCOL.md`. No past prompt is amended. Prompts 1500, 1532 and this one keep their
   `Front:` line, harmlessly.
2. **Ticket 2 (medium).** `frontend/scripts/lane-templates/issue-discovery.md` renders no `Front:` line, so
   `start --auto` would refuse auto-intake prompts from tomorrow. **Decision (report §9 answer 14):** the
   template renders `Front: maintenance`, the slug read from `auto-intake.config.json` (a new key, default
   `maintenance`), not hard-coded in the template.
3. **Measured by the chat (14:10):** `git merge-tree` of the trunk and `lane-tracking` conflicts on
   `docs/decisions.md` only: the trunk gained RC-45 (commit `d1449992a`, another chat) at the same place
   where this branch added RC-44. Both rows stay, RC-44 before RC-45.

## COSA

0. **Bring the trunk in first**: `git merge --no-ff alfonso-frontend-jjtl` into `lane-tracking` (P14; not a
   squash, RC-14). Resolve `docs/decisions.md` by keeping both rows, RC-44 then RC-45, verbatim. Any other
   conflict: stop with `Outcome: question`. Run `npm run check:docs` after the merge commit and report
   what Check E says about the trunk's prompts before item 1 (expected: red on 1520 and 1600).
1. **Cut-off**: `FRONT_FROM = 'P-2026-10-11-0000'` in `frontend/scripts/lane-tracking.mjs`; the tests that
   pin the cut-off follow it (the cut-off mutant must still die: rerun that one mutant and report it).
   `docs/PROTOCOL.md` P13 and any other text that says «new from P-2026-10-10-1500» say «new from
   P-2026-10-11-0000» instead (grep with a positive control; fix every hit, HARNESS-DOCS included).
   `docs/decisions.md` RC-44 stays as written (rows are add-only); add nothing there.
2. **Auto-intake Front**: `auto-intake.config.json` gains `"front": "maintenance"`; `auto-intake.mjs` passes
   it to the template; `issue-discovery.md` renders `Front: <slug>` right after the `Depends:` line (match
   the order of real prompts). A test of the rendering (in the existing auto-intake tests if any; say where)
   and a check that the rendered prompt passes `frontProblem` with a Prompt-ID after the cut-off.
3. **Close the two tickets** by the closing entry of this lane (the log is add-only: the entry says which
   tickets it closes, per CLAUDE.md §21.2).

## Gates
`npm run check:docs` green after item 1 (Check E no longer red on 1520 and 1600), `npm run check:scripts`,
the scripts' test suites, `npm run typecheck` against 14, build. Merge commit, code commit, docs commit,
closure commit: separate, pathspec only.

## HARD STOP
No visual check. Close the lane yourself (inbox entry, Status flip of this prompt). Exit `Outcome: done`.
Do not merge into the trunk: the chat does that with `lane-run merge` and the governance go-ahead.

## NON FARE
- No GitHub write. No change to `lane-run.mjs` beyond what item 2 strictly needs (say so if any).
- No `Front:` line added to any prompt of another chat. No new dependency.

## RIFERIMENTI
Lane B inbox entry and tickets in `docs/log-inbox/harness.md`; report P-2026-10-10-1330 §9 answers 8, 14;
RC-14, RC-21, RC-44; `docs/PROTOCOL.md` P13, P14; CLAUDE.md §5, §17, §21.2.
