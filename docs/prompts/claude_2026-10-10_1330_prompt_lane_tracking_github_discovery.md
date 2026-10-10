# Lane tracking on GitHub Projects: discovery

Prompt-ID: P-2026-10-10-1330
Chat: C-2026-10-10-1256
Lane: full (more than three files; changes the P13 prompt header, a shared interface)
Status: da eseguire

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-lanetrack`, branch `lane-tracking`, created from the tip of `alfonso-frontend-jjtl`
at launch (`git -C ~/jjodel worktree add -b lane-tracking ~/jjodel-w-lanetrack <tip>`, plus the P14
`node_modules` symlink). Before anything else: print `pwd`, branch, `git log -1`, `git status`. The tree
must be clean and the branch must be `lane-tracking`. Otherwise stop.

## Lane discipline
Every reply of this session opens with `[P-2026-10-10-1330 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
The lane does not touch the `Status` line of this prompt.

## Context (decisions already taken, do not reopen)

Alfonso wants every lane to appear automatically on GitHub Projects, grouped by "front" (a milestone-like
unit that spans many lanes, e.g. the simulator, the code generation pilot, the stand-alone editor).
The chat decided:

1. **One board for all lanes**, "Jjodel lanes" (org `jjodel-modeling`), always. A front may in addition
   have a **dedicated Project**; today: code generation pilot, simulator, stand-alone editor (the
   latter reuses the existing org Project 1, "StandAlone Editor").
2. **A card is an issue in a new private repo `jjodel-modeling/jjodel-lanes`**, never a draft item and
   never an issue in the public `jjodel-frontend`. Title starts with the Prompt-ID, which is the
   idempotency key (a `resume` must never create a second issue).
3. **Front registry** `docs/harness/fronts.json`: per front `slug`, `title`, `exit` (verifiable exit
   criterion), `state` (`open` | `closed`), optional `project` (number of the dedicated Project).
   `maintenance` is a permanent open front. Seeded with today's open fronts; past lanes are not
   back-filled.
4. **New header field** `Front: <slug>` in the P13 prompt header. `check:docs` fails closed on a missing,
   unknown or closed front, only for prompts dated after a cut-off date to be fixed in Phase 2.
5. **`lane-run.mjs` drives the card**, failing open (if `gh` errors or is not authenticated, the lane
   runs and the failure is written in its state). Mapping: prompt committed `da eseguire` → Ready;
   `start` → In progress; exit `hard-stop (visual check due)` → In review; `done` after closure →
   Done (issue closed); `question` / `blocked` → stays In progress with a field saying so.
6. The local board in `frontend/scripts/board/` stays the operational tool; GitHub is a projection of
   the same lane state, not a second source of truth.

## COSA (Phase 1, read-only, local and remote)

Answer, with `file:line` and verbatim quotes:

1. **`lane-run.mjs`**: every point where a lane starts, resumes, exits; where the Prompt-ID, `Lane`
   and the final `Outcome` line are read; the layout of `~/.jjodel-lanes/<id>/`. Propose the smallest
   seam for a module `frontend/scripts/lane-tracking.mjs` (or a better name, checked with a global grep).
2. **`frontend/scripts/board/`** (lane board, launchd `io.jjodel.lane-board`): what lane state it
   already derives (`kindOf` included, known to misread merge lanes as phase2). Can the GitHub
   projection reuse that derivation instead of re-parsing?
3. **`check-docs.ts`**: how Checks A..D parse prompts today; where a Check E on `Front:` fits; how a
   date cut-off is expressed in the existing checks.
4. **P13** in `docs/PROTOCOL.md` and §4.1 of `docs/HARNESS-DOCS.md`: exact text to amend for `Front:`.
   Any other parser of the prompt header (grep for `Prompt-ID:` and `Lane:` across `frontend/scripts`).
5. **GitHub, read-only calls only**: `gh --version`, `gh auth status` (are the `project` and `repo`
   scopes present?), `gh project list --owner jjodel-modeling`, `gh project field-list 1 --owner
   jjodel-modeling`. Does `jjodel-lanes` already exist? Which built-in workflows does Project 1 have?
   Do not create, edit or delete anything on GitHub.
6. **Fronts to seed**: from the `docs/prompts/` headers of the last 30 days and `docs/decisions.md`,
   list the fronts that are open today, with a proposed slug and exit criterion for each.

## Report

Write `docs/discovery/discovery_2026-10-10_lane_tracking_github_projects.md` (P4 content: hypothesis,
goal, files read with full paths, findings with `file:line`, dependencies and risks, open questions,
each with `Recommended:`). Commit it with a pathspec, docs only. The hard stop is not reached until
the report is written and committed.

## HARD STOP
After the report commit. Exit with `Outcome: hard-stop`. No Phase 2 work.

## NON FARE
- No GitHub writes of any kind (no repo, Project, issue, field, workflow).
- No change to `lane-run.mjs`, `check-docs.ts`, `PROTOCOL.md`, `HARNESS-DOCS.md` or the board.
- No new dependency.

## RIFERIMENTI
`docs/HARNESS-DOCS.md` §4.1, §6, §7; `docs/PROTOCOL.md` P4, P13, P14; RC-15 (deny fails closed, hooks fail
open), RC-17, RC-19 (push is a human gate), RC-20, RC-25, RC-26.
