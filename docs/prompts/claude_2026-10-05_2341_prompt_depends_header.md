# Prompt: every prompt declares its dependencies (`Depends:` header line)

Prompt-ID: P-2026-10-05-2341
Chat: C-2026-10-05-1116
Lane: fast (docs only: two governance-adjacent docs and a decision row; no code). Tier: light. Model: the default of `.claude/settings.json`, no deviation. No critical-zone go-ahead.
Depends: none
Status: da eseguire
Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt says otherwise).

Worktree: `~/jjodel-w-depends`, branch `depends-header`, cut from the trunk at `078325ee6`, `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch, `git log -1` (the docs commit adding this prompt, on top of `078325ee6`) and a clean `git status`. Otherwise stop with `Outcome: blocked`.

## Lane discipline

Every reply of this session opens with `[P-2026-10-05-2341 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.

## Context (do not redo the analysis)

The lane board (`~/.jjodel-lanes/board/`, moving into `frontend/scripts/lane-board/` in lane `P-2026-10-05-2340`) draws the dependencies between lanes. Today it can only infer them from the Prompt-IDs a prompt cites, and a citation is often context, not a dependency. Alfonso asked on 2026-10-05, in chat `C-2026-10-05-1116` («procedi con tutte e tre»), for an explicit header line. The board already reads `Depends:`: `none`, or a comma-separated list of Prompt-IDs; any other text on the line is ignored.

## COSA

1. `docs/PROTOCOL.md`, P13: a new bullet right after «Every prompt declares its lane», in the style of its neighbours:
   **Every prompt declares what it depends on.** The header of a prompt in `docs/prompts/` carries `Depends: none` or `Depends: P-YYYY-MM-DD-HHmm[, P-…]`: the lanes whose result this one needs (merged code it builds on, a report it implements, a decision it applies). A Prompt-ID cited elsewhere in the prompt is context, not a dependency. Merge prompts rendered by `lane-run` are exempt: their dependency is the branch they merge. The line is new from 2026-10-06; earlier prompts are not amended. The lane board draws declared dependencies as solid arrows and citations as dashed ones (`frontend/scripts/lane-board/`). Decided RC-42.
2. `docs/decisions.md`: row **RC-42**, after RC-41, same format: `(2026-10-05, requested by Alfonso in chat C-2026-10-05-1116, evidence: read, verified: agent, reversible: trunk)`, title «Every prompt declares its dependencies», one or two sentences restating the rule and its reason (citations are not dependencies; the board needs exact edges).
3. `docs/HARNESS-DOCS.md`: wherever it lists the header fields of a prompt (around lines 124 and 429 at `078325ee6`: Prompt-ID, Chat, Lane, Status), add `Depends:` in the same place, one line each. If `CLAUDE.md` or `AGENTS.md` enumerate the header fields too, do not edit them: list the hits in the report and stop with `Outcome: question` and your recommendation.
4. Log entry in `docs/log-inbox/harness.md` (P9 format).

## Tests and gates (all in the foreground)

`npm run check:docs`, `npm run check:agents`, `npm run check:addonly` (from `frontend/`).

## Commits and closure

One docs commit, `docs(protocol): every prompt declares its dependencies (RC-42)`. A docs lane has no visual check: the closure commit follows at once, with the Status flip (`Status: eseguito <YYYY-MM-DD> · lane depends-header · <sha>`) and the log entry. Then `Outcome: done`. Do not merge.

## NON FARE

No edit to `lane-run.mjs`, to the lane templates or to any script; no edit to existing prompts; no `CLAUDE.md` or `AGENTS.md` edit (see COSA 3); no `git stash`, no `git add .`, no files outside the worktree.

## RIFERIMENTI

`CLAUDE.md`, `docs/PROTOCOL.md` P13 and P15, `docs/decisions.md` RC-40 and RC-41 for the row format.
