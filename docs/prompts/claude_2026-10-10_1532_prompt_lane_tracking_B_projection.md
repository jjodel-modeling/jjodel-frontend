# Lane tracking B: GitHub projection of lane state

Prompt-ID: P-2026-10-10-1532
Chat: C-2026-10-10-1256
Request: https://claude.ai/code/session_01FCFNYi6n4pLBgcbMduJcJe
Lane: full (more than 3 files; changes lane-run.mjs commands)
Depends: P-2026-10-10-1500
Front: harness
Status: da eseguire

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt says otherwise).

Worktree: `~/jjodel-w-lanetrack`, branch `lane-tracking`, tip `e843be28a` plus this prompt's commit (lane A
closed there: code `73af7bbac`, docs `8ab16688f`, RC-44). Before anything else: print `pwd`, branch,
`git log -4 --oneline`, `git status`. The tree must be clean and the branch `lane-tracking`. Otherwise stop.

## Lane discipline
Every reply of this session opens with `[P-2026-10-10-1532 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.

## Context

Read `docs/discovery/discovery_2026-10-10_lane_tracking_github_projects.md` §4.1, §5, §6, §9 and lane A's
inbox entry in `docs/log-inbox/harness.md`. The chat adopted every `Recommended:` of §9. Lane A shipped the
registry `docs/harness/fronts.json` (board block: owner `jjodel-modeling`, project 2, repo
`jjodel-modeling/jjodel-lanes`; one milestone number per front) and the pure part of
`frontend/scripts/lane-tracking.mjs`. GitHub is bootstrapped (RC-44): Project 2 «Jjodel Lanes», Status
options Backlog, Ready, In progress, In review, Done; labels `waiting:phase-2`, `waiting:visual`,
`waiting:question`, `blocked`, `outcome:unparsed`, `closure-owed`; milestones 1..7. The Mac's `gh` token has
the `project` scope (measured 14:47). Org Project 1 belongs to Juri: never read or written by this code.

## COSA

1. **Projection in `lane-tracking.mjs`** (extend lane A's module, keep its pure part pure):
   - `projectLane(id, observed)` computes the wanted card from lane-run's own state (`laneState`,
     `lastOutcome`, `headerStatus`, report §4.2: not the board's `kindOf`): column, labels, milestone, open
     or closed. Mapping, per §9 answers 1, 3, 6: prompt committed and not started → Ready; running → In
     progress; `question` → In progress + `waiting:question`; `blocked` → In progress + `blocked`;
     `hard-stop` → In review + `waiting:phase-2` for a discovery or `waiting:visual` otherwise (say how you
     tell them apart, from the header or the prompt, and test it); `done` with the Status line flipped →
     Done and issue closed; `done` without the flip → In review + `closure-owed`; an unparsed outcome →
     `outcome:unparsed`. Pure, unit-tested on every row.
   - `syncCard(id, wanted)` applies it with `gh` only (`gh issue create/edit/close`, `gh project item-add`,
     `gh project item-edit` with the Status field and option ids looked up once and cached). Idempotency
     key: the Prompt-ID at the start of the issue title; the card file in
     `~/.jjodel-lanes/_tracking/<Prompt-ID>.json` holds issue number and item id, written under a `mkdir`
     lock (§9 answer 7). A lost card file is healed by a search on the title, never by a second create.
   - Card body (§9 answer 16): Prompt-ID, title, Lane, front, branch, worktree name, Request URL, a link to
     the prompt file on the branch. Never the request words, never the prompt body.
   - Fails open everywhere (RC-15): any `gh` error, a missing `project` scope (say so: «tracking skipped:
     missing project scope»), or no network is written to the card file and to `lane-run status` as one
     line, and the lane goes on.
   - Enable switch (§9 answer 13): tracking runs only if `~/.jjodel-lanes/_tracking/config.json` exists;
     `LANE_TRACK_GH=<path>` substitutes the `gh` binary for tests.
2. **Seam in `lane-run.mjs`** (§5, about seven call lines, no wrapper change, §9 answer 1): `start` (create
   or move to In progress; and refuse a prompt in Front scope whose `frontProblem` is not null, with the
   reason, before spawning: §9 answer 10), `resume`, `status <id>` and `wait` (project the observed exit),
   the chain supervisor, `go` on a direct merge. A new command `lane-run track <Prompt-ID> | --sync`:
   `--sync` reconciles every prompt at or after `FRONT_FROM` plus every lane folder, creates missing Ready
   cards, heals misses, and closes the milestone of a front whose registry state is `closed`. `status <id>`
   prints one `card:` line (issue URL and column, or the skip reason).
3. **Tests** with a fake `gh` (a small script that records its argv and answers canned JSON): the mapping
   table, idempotent create (two `start`/`resume` calls, one `issue create`), heal from a lost card file,
   fail-open on a `gh` exit 1 and on a missing scope, the start refusal, `--sync` on a fixture with one
   unstarted prompt. Mutation bench (CLAUDE.md §5): drop the title search, drop the lock, map `hard-stop`
   to Done; each must die. Report the bench in the commit body.
4. **Live check, one write set only.** With `config.json` created on this Mac, run
   `lane-run track --sync` once. Expected, and nothing else: cards for P-2026-10-10-1500 (Done, closed,
   milestone `harness`) and P-2026-10-10-1532 (In progress, milestone `harness`). Print both issue URLs and
   their Project Status as read back with `gh`. If anything else would be created, stop before writing.
   Then run `--sync` a second time and show that it writes nothing.
5. **Docs**: P13 or §7 where `lane-run` commands are listed gains `track`; HARNESS-DOCS §6 (the check:docs
   row gains Check E, a carry-over from lane A) and §7 (`track`, the card line, the enable switch, the
   `_tracking/` folder and why it is not a `P-…` folder, report §0 point 4). One line each where possible.

## Gates
`npm run check:scripts`, `npm run check:docs`, the scripts' test suites (lane A measured 737/737 in
`scripts/hooks`), `npm run typecheck` against 14, build. Code and docs in separate commits, pathspec only.

## HARD STOP
No visual check is due: the chat verifies the two cards with `gh` and the browser after you exit. Close the
lane yourself (code, docs, closure commit with the `harness` inbox entry and this prompt's Status flip).
Exit `Outcome: done`. Exit `Outcome: question` before any GitHub write if item 4 would touch more than the
two expected cards, or if a change to the detached `/bin/sh` wrapper looks unavoidable.

## NON FARE
- No GitHub write outside item 4. Never Project 1, never `jjodel-frontend`.
- No change to `frontend/scripts/lane-board/` (its `kindOf` misread is a separate fast lane, §9 answer 17).
- No `Front:` line added to past prompts. No new dependency.

## RIFERIMENTI
Report P-2026-10-10-1330 §0, §4.1, §4.2, §5, §6, §9; lane A P-2026-10-10-1500 and RC-44; `docs/PROTOCOL.md`
P13, P16; `docs/HARNESS-DOCS.md` §6, §7; CLAUDE.md §5, §17; RC-15, RC-19, RC-36.
