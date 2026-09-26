# Prompt: orchestrated lanes in the harness (RC-20..24): P16, P8 and P13, prompt discipline, `lane-run`

Prompt-ID: P-2026-09-26-1640
Chat: C-2026-09-25-1353
Lane: full (more than 3 files, a normative file)
Status: da eseguire

Worktree: `~/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session (`/clear`). Before anything
else: `pwd` is `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, `git log -1` is the commit
that adds this file (subject `docs: add prompt P-2026-09-26-1640, orchestrated lanes in the harness`),
`git status` empty. Otherwise stop. No dev server in this lane.

Read `CLAUDE.md`, then `docs/PROTOCOL.md` whole, then RC-15..RC-24 in `docs/decisions.md` and the memo
`docs/ratifiche/claude_ratifiche_2026-09-26_orchestrated_lanes.md`. Every reply of this session opens
with `[P-2026-09-26-1640 · session <id>]` and ends with one line `Outcome: done | hard-stop | question |
blocked` (this lane applies RC-20 to itself before it is written down).

## COSA

Turn RC-20..RC-24, ratified on 2026-09-26, into the normative text and the one script they need:

1. `docs/PROTOCOL.md`: a new clause **P16 — Orchestrated lanes** (RC-20, RC-21, RC-22), an amendment
   to **P8** (RC-23: the visual checklist run by the chat in the built-in browser, DOM measures, the
   `Smoke visivo` source, the human GO where it stays mandatory, the measurement period until
   2026-10-03), an amendment to **P13** (RC-24 replaces «at most two sessions on the shared tree»;
   the Prompt-ID clause gains the `Outcome` line and the `Recommended:` form of a question).
2. The lane discipline section of the prompt template: wherever the template lives (§4.1 of
   `docs/HARNESS-DOCS.md`, and `CLAUDE.md` §6.4 if it holds the Prompt-ID rule), add the two lines every
   prompt now requires of a session: the `Outcome` line closing every final message, and the
   `Recommended: <one line>` form for every question that has a recommendation.
3. `docs/HARNESS-DOCS.md` §7, the lifecycle of a task: rewrite the full-lane sequence on the
   orchestrated flow (the chat launches, the session stops with an `Outcome`, the chat resumes; the
   visual checklist by the chat; the rework loop at the Phase 2 prompt in the same session) and
   reference the figure `docs/harness/lane-lifecycle-bpmn.svg` (committed with this prompt, with its
   PDF). Bump the HARNESS-DOCS version line.
4. `frontend/scripts/lane-run.mjs` (new): a launcher for the chat. `lane-run start <worktree>
   <prompt-file>` runs `claude -p` in `<worktree>` with the prompt file's content as the prompt, in
   the background (`nohup`, detached), `--output-format stream-json` to a log file under
   `~/.jjodel-lanes/<Prompt-ID>/` (create it; never inside the repo), and prints the log path and,
   as soon as it appears in the stream, the session id, to stdout and to `<dir>/session.txt`.
   `lane-run resume <Prompt-ID> <message-file>` runs `claude -p --resume <session id>` with the
   message file, same log directory, appending. `lane-run status <Prompt-ID>` prints running/exited,
   the exit code, the last `Outcome:` line found in the assistant text of the log, and the elapsed
   time against the 90-minute default (`--limit <minutes>` overrides). Node only (`~/.local/bin/node`
   v26 in this repo), no dependency, no TypeScript, same header style as the hooks in
   `frontend/scripts/hooks/`. The script never commits, never pushes, never touches the repo.
5. `docs/claude-code-log.md`: the entry of this lane (P9), plus a ticket paragraph for anything you
   could not settle.

Out of scope: `.claude/settings.json`, the hooks, the skills (they keep reading P13's Status clause
live: see Phase 1), `CLAUDE.md` beyond §6.4, any file of the simulator, any branch but the trunk.

## DOVE

`docs/PROTOCOL.md`, `docs/HARNESS-DOCS.md`, `CLAUDE.md` (§6.4 only, if the Prompt-ID rule lives
there), `frontend/scripts/lane-run.mjs` (new), `frontend/scripts/__tests__/lane-run.test.mjs` (new, or
the folder the hook tests use: say which), `docs/claude-code-log.md`, the Status line of this file.
Nothing else. Name check before writing: `command grep -rn 'lane-run' .` must be empty, and one
positive control that must match (for example `bash-guard`).

## COME

### Phase 1, read-only, then HARD STOP

Measure before writing, and write the report to
`docs/discovery/discovery_2026-09-26_orchestrated_lanes_harness.md` (objective, files read with full
paths, findings, risks, questions with a `Recommended:` line each). Then stop with
`Outcome: hard-stop`. The report answers:

1. What the skills `status-flip`, `log-entry`, `discovery-report` extract live from `PROTOCOL.md` and
   `CLAUDE.md` (which headings, which anchors, the guard that aborts on an empty extraction), so that
   the P13 amendment and the new P16 do not move or rename an anchor. Quote the extraction code.
2. What `check:docs` (`frontend/scripts/gates/check-docs.ts` or wherever Check A lives) compares byte
   for byte between `CLAUDE.md` §21.2 and `PROTOCOL.md` P9, so the amendments touch neither block.
3. Where the prompt template and the Prompt-ID rule live today (HARNESS-DOCS §4.1, CLAUDE.md §6.4,
   PROTOCOL P13), with line numbers, and whether P15 makes the CLAUDE.md change owed to another branch
   (it should not: this is the trunk).
4. How a `claude -p` run reports its session id in `--output-format stream-json` on this machine
   (run `claude -p "Reply with the single word ok" --output-format stream-json` in a temporary
   directory outside the repo, quote the first event, do not commit anything), and whether
   `--resume <id>` accepts a `-p` prompt afterwards. This is the dry run RC-20's memo asks for; record
   the two commands and their first lines verbatim in the report. If either fails, that is a
   `question`, not a workaround.
5. The Node available to a non-interactive launch from the Mac's native shell (`which node`,
   `~/.local/bin/node --version`), since the chat will invoke the script from `osascript`, whose
   PATH is not the login shell's.

### Phase 2, after the GO

1. Baseline: `check:docs` 4/4 (state the warnings count), `npx vitest run` on the hook tests folder
   (state the count), `git status` empty apart from this lane.
2. Normative text, one commit (docs only): P16, the P8 and P13 amendments, the template lines,
   HARNESS-DOCS §7 and version. English, no em dashes, no filler; each amended clause says which RC
   amends it and when, as P13 already does for RC-17. P16 opens by naming the three message flows it
   replaces (prompt to session, hard stop to chat, GO to session) and the two human gates it keeps
   (ratification, visual GO by sampling after 2026-10-03). Do not restate the RC rows: cite them.
3. `lane-run.mjs` and its tests, one commit (code only): tests first, red, with a fake `claude`
   on the PATH (a shell script under the test's temp dir that echoes a stream-json session event and
   exits), covering: `start` creates the directory, writes `session.txt` from the first event, prints
   the log path; `resume` refuses without `session.txt`; `status` reports running, exited with code,
   the last `Outcome:` line, and `blocked` past the limit; a prompt file whose header has no
   `Prompt-ID` is refused before anything runs. Mutation bench, one mutant per branch above, table in
   the commit body; a survivor is a stop.
4. Gates on the code commit: `check:docs` 4/4, `check:scripts` as the baseline, the hook tests plus
   the new ones, 0 failed; `git diff --stat` outside DOVE empty.
5. Closure: one docs commit (RC-17) with the log entry, the Status of this file flipped to
   `eseguito 2026-09-26 · lane harness · <code sha>` (no visual check in this lane: the line ends at
   the sha), and the Phase 1 report's own Status if it carries one. Closing report opening with
   `[P-2026-09-26-1640 · session <id>]`: the three shas, gates, mutants, the dry-run lines of Phase 1
   question 4, deviations. Then `Outcome: done`.

Stop and ask (with a `Recommended:` line) if: an anchor the skills read must move; Check A's blocks
would change; `claude -p --resume` does not accept a prompt; the prompt template lives in a place this
prompt did not name.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`,
`--no-verify`, a critical-zone edit, push, a change under `.claude/`, any tree you did not start in.

## RIFERIMENTI

`docs/ratifiche/claude_ratifiche_2026-09-26_orchestrated_lanes.md`; `docs/decisions.md` RC-15..RC-24;
`docs/PROTOCOL.md` P8, P13, P15; `docs/HARNESS-DOCS.md` §4.1, §6, §7; `frontend/scripts/hooks/` for the
script style; `docs/harness/lane-lifecycle-bpmn.svg` and `.pdf` (the figure, committed with this file).
