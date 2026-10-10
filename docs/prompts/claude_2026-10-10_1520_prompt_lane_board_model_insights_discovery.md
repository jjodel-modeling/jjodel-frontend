# Lane board Insights: model use against success and code-area difficulty, discovery

Prompt-ID: P-2026-10-10-1520
Chat: C-2026-10-10-1512
Request: https://claude.ai/code/session_015Px4yAHrpWDZQo31DjapvA
Lane: full (discovery; defines the data contract of a new Insights section)
Depends: none
Status: eseguito 2026-10-10, lane P-2026-10-10-1520 (lane-board-model-insights; discovery da062a727, code e3590d682, log 479fbab01, fix 285356563), trunk taken by P-2026-10-10-1635 (25383392a), merged 549409422 (P-2026-10-10-1708); verifica visiva passata 2026-10-10 (chat, RC-23, built-in browser on 4701 and 4700)

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt says otherwise).

Worktree: `~/jjodel-w-modelinsights`, branch `lane-board-model-insights`, cut from the trunk tip that carries the
docs commit adding this prompt, `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch,
`git log -1` and a clean `git status`. Otherwise stop with `Outcome: blocked`.

## Lane discipline
Every reply of this session opens with `[P-2026-10-10-1520 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
The lane does not touch the `Status` line of this prompt; the chat flips it.
Unattended: Alfonso is away; a question with one recommendation inside this lane's perimeter is answered as
recommended (RC-21).

## Context (measured by the chat, do not redo)
Alfonso wants the Insights tab of the lane board (`frontend/scripts/lane-board/insights.js`, 249 lines, served by
`lane-board.mjs`) to show how the models used by the lanes (Opus, Sonnet, Fable, Haiku for subagents) relate to
measures of success, and how hard the different areas of the code are. The chat measured on 2026-10-10 at 15:15:
378 lane folders in `~/.jjodel-lanes/`; 273 have a model in `log.jsonl` (249 `claude-opus-5-5`, 18
`claude-sonnet-5-5`, 6 `claude-sonnet-5`); `result` events carry `modelUsage`; every lane folder has `tier.txt`.

The design constraint the chat already settled, and that the report must serve: the model is not assigned at
random. Opus 5.5 is the pinned default (RC-16), Sonnet is a declared exception for peripheral lanes, and model
changes coincide in time with harness changes (hooks 2026-09-21, orchestration RC-20 2026-09-26, RC-23). A raw
success-by-model table would therefore measure task difficulty and harness era, not the model. The intended views
are: (1) difficulty per code area, computed over all lanes regardless of model; (2) a model by area matrix where
every cell shows its n and is greyed below a threshold; (3) a first-shot success timeline with model changes and
harness ratifications drawn as markers. Success signals come from artifacts, not from the log's self-assessment,
which stays a secondary column.

Another chat (C-2026-10-10-1256) has lanes on GitHub Projects tracking in `~/jjodel-w-lanetrack`
(P-2026-10-10-1330, P-2026-10-10-1500). Read its branch with `git log`/`git diff` only to learn whether it touches
`frontend/scripts/lane-board/`, and say so in the report (RC-22). Do not touch that worktree.

## WHAT (read-only Phase 1)
Measure, do not assume. Throwaway probe scripts go in `/tmp/p1520/`, never in the repo.

1. **Model attribution.** For every lane folder: the primary model (init event; then `modelUsage` of the final
   `result`; then the `Model:` trailer of the lane's commits). Coverage per source, disagreements between
   sources, lanes with more than one model (subagents, resumes on another model), and where a per-worktree
   override (`.claude/settings.local.json`) would leave a trace. Tokens and `total_cost_usd` per lane: present or
   not, since when.
2. **Linking a lane to its commits and files.** How to find, for a Prompt-ID, its commits on the trunk and on its
   branch (session id in `session.txt`, `Claude-Session:` trailers, branch name, merge commits, prompt Status line
   shas). Coverage of each route. From the commits, the files touched (excluding `docs/`).
3. **Success signals.** For each, the share of lanes for which it resolves:
   a. final outcome and `blocked`/over-time runs;
   b. runs per lane (`input-k.md`), and whether a GO, an ACK and a corrective resume can be told apart from
      the input text (show the heuristic and its error on a hand-checked sample of 20);
   c. `Corregge` chains: entries in `docs/log-inbox/*.md`, `docs/claude-code-log.md` and the archive whose
      `Corregge` resolves to a prompt, then to a Prompt-ID; also prompts whose text says they correct another;
   d. reverts of a lane's commits (`git log --grep`, revert subjects, e.g. `04c13e039`);
   e. the visual check result in the prompt's Status line (passed, failed, not applicable).
   Propose the definition of "first-shot success" from what resolves, with its coverage.
4. **Code areas.** Propose at most eight areas from the paths actually touched, with counts: at least the six
   critical-zone files of `CLAUDE.md` §3.2, `editor-v2/viewpoint/ir` and authoring, the simulator
   (`editor-v2/sim/`, `model/simulation/`), canvas (`EditorV2.tsx` and hooks), harness scripts, other. A lane
   touching several areas: say how to attribute it (primary area by changed lines, or one count per area) with a
   recommendation. Per area: n, rework rate, blocked rate, median working time, `Causa` distribution where present.
   List the ten files most often touched by lanes that were later corrected or reverted.
5. **Confounders.** Model changes by date; harness events by date from `docs/decisions.md` (RC-15 onward, with
   their dates); tier by model; lane kind (fast, full, merge, discovery) by model. One table each.
6. **Integration.** How `insights.js` `compute()` gets its data today and how `lane-board.mjs` caches; cost of
   scanning 378 `log.jsonl` files and the git queries on each refresh; propose where the new computation lives
   (server side in `collect()` with cache keyed on mtimes, or a separate endpoint), the `/api` field shape, and
   the minimum n threshold for a matrix cell.

## Report (mandatory, P4)
Write `docs/discovery/discovery_2026-10-10_lane_board_model_insights.md`: hypothesis being falsified, goal, files
and folders read with full paths, findings with `file:line` and verbatim quotes, coverage tables, the proposed data
contract, risks, and open questions each with `Recommended:`. Commit it alone (docs only, pathspec, `Model:`
trailer). The hard stop is not reached until the report is committed.

## HARD STOP
After the report commit: stop with `Outcome: hard-stop`. No Phase 2 code.

## DO NOT
No change to `lane-board.mjs`, `insights.js`, `timeline.js`, `lane-run.mjs` or any lane folder. No board on port
4700. No writes in another chat's worktree. No `git stash`, no `git add .`.

## REFERENCES
- `docs/PROTOCOL.md` P4, P9, P13, P14, P16; RC-16, RC-20, RC-21, RC-22, RC-23, RC-43.
- `CLAUDE.md` §3.2 (critical zone), §21.3 (Causa taxonomy).
- `frontend/scripts/lane-board/README.md`.
