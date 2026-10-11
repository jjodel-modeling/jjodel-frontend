# Tickets become Backlog cards: `lane-run ticket` and a one-time backfill

Prompt-ID: P-2026-10-11-1017
Chat: C-2026-10-10-0057
Lane: full (scripts only: `frontend/scripts/lane-run.mjs`, `frontend/scripts/lane-tracking.mjs`, their tests). Phase 1 short, hard stop, then Phase 2 on the chat's GO.
Front: harness
Depends: none
Status: da eseguire

Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-ticketcards`, branch `ticket-cards`, created from the trunk commit that adds this file. Before anything else check that `pwd` is the worktree, the branch is `ticket-cards`, `git status` is clean. Otherwise stop with `Outcome: blocked`.

## Lane discipline
Every reply opens with `[P-2026-10-11-1017 · session <id>]`. Every final message ends with `Outcome: done | hard-stop | question | blocked`. Every question with a recommendation carries `Recommended: <one line>`. Do not touch the `Status` line.

## Why

A ticket today is only a `## <date> — ticket: ...` block in `docs/log-inbox/<name>.md`, with `**Priority**`, `**Found in**`, `**Detail**`. Nothing puts it on the Jjodel Lanes board (org Project 2, repo `jjodel-modeling/jjodel-lanes`, milestones per front from `docs/harness/fronts.json`), because the tracker only makes cards for prompts with a Prompt-ID and a `Front:` line. On 2026-10-11 about forty ticket blocks sit in thirteen inbox files and none is on the board. Alfonso decided (2026-10-11 10:16) that tickets become Backlog cards, written by lanes and by the chat without his intervention, and that today's open tickets are backfilled once.

## COSA

**1. `lane-run ticket`.** A new subcommand that files one ticket in both places:

`lane-run ticket --front <slug> --priority high|medium|low --found <Prompt-ID> [--detail <path>] [--inbox <name>] --title "<one line>" --body-file <file>`

- appends the block to `docs/log-inbox/<inbox>.md` in today's exact format (`<inbox>` defaults to the front slug), in the current worktree, without committing (the caller commits, as today);
- creates or updates one issue in the board repo: title `ticket: <title>`, body = the block plus the inbox path, labels `ticket` and `priority:<p>`, milestone of the front, column Backlog;
- keeps an idempotency record in `~/.jjodel-lanes/_tracking/tickets/<hash>.json` (hash of inbox name + title), so a rerun updates instead of duplicating;
- fails open like `trackCard` (RC-15): a GitHub failure prints a `card:` line saying so and still writes the inbox block, exit 0;
- reuses `boardIds`, the `gh` wrapper and the label handling the tracker already has. Search names first (CLAUDE.md: verify names before creating new ones).

**2. Backfill, `lane-run ticket --backfill [--dry-run]`.** Parse every `## ... — ticket: ...` block in `docs/log-inbox/*.md` on the trunk and emit one card per block, Backlog, same labels. Front mapping: the `Front:` line of the prompt named in `**Found in**` if that prompt has one; otherwise by file name: `ir-graphvertex*`, `gv-*` to `graphvertex`; `harness`, `merge-gate`, `smoke-baseurl` to `harness`; `codegen*` to `codegen-pilot`; `simulation` to `simulator`; `standalone-environment` to `standalone-editor`; everything else to `maintenance`. A block without `**Priority**` gets `priority:unset`.

**3. The hard-stop rule (ticket of 2026-10-11 in `docs/log-inbox/harness.md`, found in P-2026-10-11-0957).** In `projectLane` (`lane-tracking.mjs:181-193`) a flipped Status wins over `hard-stop`: Done and closed, as for `done`. Add the test.

## Phase 1 (read-only, short)

Write `docs/discovery/discovery_2026-10-11_ticket_cards.md` (P4) with: the parser's rule for a ticket block, measured on the thirteen inbox files (count per file, blocks it would miss, blocks with odd fields); the front each block maps to; and the full `--backfill --dry-run` table you would produce (inbox, title, front, priority, found-in). Mark the blocks you can see are already fixed on the trunk (a later entry or commit says so, for example the useJjomSync stale edge fixed by F1 `ad08a8519`), with the evidence. Commit the report, then stop with `Outcome: hard-stop`. The chat answers with the list of blocks to skip or close.

## Phase 2 (after the GO)

Implement 1, 2, 3 with tests (parser on fixtures copied from real blocks, idempotency, fail-open, the hard-stop rule). Gates: `npm run typecheck:scripts`, the scripts test suites, `check:scripts`, `check:docs`. Mutation bench on the parser and on `projectLane`. Then run the backfill for real with the skip list from the GO, and run `lane-run track --sync --dry-run` to show the hard-stop change. Commits with explicit pathspec and the `Model:` trailer; one inbox entry in `docs/log-inbox/harness.md`.

## NON FARE

- No file under `frontend/src/`. No change to how lane cards are projected beyond point 3.
- Never touch org Project 1 (StandAlone Editor, Juri's).
- No `git stash`, no `git add .`, no push. Do not touch the `Status` line.

## HARD STOP

Phase 1: after the report commit. Phase 2: after the commits, green gates and the backfill run.
