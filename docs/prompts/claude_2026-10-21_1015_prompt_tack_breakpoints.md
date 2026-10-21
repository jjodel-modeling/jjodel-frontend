# Tack: breakpoints, hard-stops and context ceilings are three different stops; an «auto» pill

Prompt-ID: P-2026-10-21-1015
Chat: C-2026-10-19-1748
Front: tack
Lane: fast (classification in the lane-run collector and the Lanes page; no governance change)
Status: eseguito 2026-10-21 · lane tack-stops · 4c07b73ba · visual check by the chat on 4710 (RC-23) pending
Corregge: none
Request: Alfonso, 2026-10-21 10:09, in the project chat: «una cosa importante ed urgente, come già discusso dobbiamo distinguere tra gli hard-stop e i breakpoint, inoltre i breakpoint che non si fermano perché in modalità /lane auto devono essere contraddistinti da un pill 'auto'»

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 reduced: item 1 of COSA is the discovery, written into the log entry with numbers; no separate report and no hard stop. P8 replaced: the chat checks the board after exit (RC-23).

Worktree: `~/jjodel-w-tack-stops`, branch `tack-stops`, created by the chat from `alfonso-frontend-jjtl` at the commit that adds this prompt. Before anything else: `pwd`, branch, `git log -1`, `git status --short` (only the `frontend/node_modules` link); otherwise stop with `Outcome: blocked`.

Model and tier: as `lane-run start` assigns.

## Lane discipline
Every reply opens with `[P-2026-10-21-1015 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; questions carry `Recommended: <one line>`; unattended (RC-21, RC-25) except the RC-26 list. Time limit: 60 minutes. Node: `~/.local/bin/node`. Read only the lines you change (`grep -n`, then ranges). Tests with `--test-reporter=dot` piped through `grep -E 'not ok|# (tests|pass|fail)'`. Handoff at 120k.

## Context
A lane ends with `Outcome: hard-stop` for three different reasons that the board shows the same way:
- **breakpoint**: a stop the prompt planned (its `## HARD STOP` section names it: end of Phase 1, a visual check due, a report committed). Nothing went wrong; the lane waits for a GO.
- **ceiling**: the session hit the context ceiling and wrote a handoff (`handoff.md` in the lane folder, result text naming the ceiling). The work continues in a new lane.
- **hard-stop**: an unplanned stop (the prompt says «None planned», or the stop is not the one it names).
In `/lane auto` the chat GOs a breakpoint at once, so for Alfonso it never stopped. Those must carry an **auto** pill. From now on the chat marks such a resume by starting its message with `[auto]` after the Prompt-ID bracket (for example `[P-…] [auto] GO Phase 2 …`). Earlier auto resumes carry no marker and get no pill; say so, do not guess.
Earlier design (chat of 2026-10-19 22:00, relayed): «checkpoint» was the proposed label and palette for planned stops; Alfonso now names them **breakpoint** («checkpoint» is the session checkpoint of the KB). Palette from that design: planned stop slate `#475569` solid; keep the 3:1 contrast criterion against the other outcome swatches.
The protocol keeps the token `hard-stop` in the `Outcome:` line: this slice changes no governance file and no lane output, only how Tack classifies and shows it. A declared field (`Stop: planned | ceiling | unplanned`) is the harness front's, later; when present, it must win over the inference.

## COSA
1. **Measure first** (into the log entry): over the lane folders, how many `hard-stop` exits classify as breakpoint, ceiling, hard-stop with the rules of item 2, and 10 sampled lanes per class checked by hand against their result text; report any disagreement.
2. **Classification** in `tack/src/collectors/lane-run/collect.mjs`, stored per lane as `stop_kind` (`breakpoint | ceiling | hard-stop | null`, schema bump, additive), recomputed on the last turn only:
   - a declared `Stop:` line in the last result text wins (`planned` → breakpoint, `ceiling`, `unplanned` → hard-stop);
   - else `handoff.md` present and the last result mentions a context ceiling or a handoff → ceiling;
   - else the prompt (path in `prompt.txt`) has a `## HARD STOP` section that is not «None»/«None planned», and the lane is a discovery or its result says the planned stop was reached (match the section's own words, or `Phase 1`, `visual check`, `report committed`) → breakpoint;
   - else hard-stop.
3. **Auto**: per lane, `auto_resumes` = the resumes (`msg-<k>.md`, or `input-<k>.md` for k ≥ 2) whose text starts, after an optional `[P-…]` bracket, with `[auto]`. Class it in memory; store only the count (the privacy rule: no message text in the store).
4. **Lanes page**: the outcome pill shows `breakpoint`, `ceiling` or `hard-stop` with distinct swatches (breakpoint slate `#475569`, ceiling a neutral of its own, hard-stop the current warning colour), each with a tooltip that says what it means. A lane whose breakpoints were all GOed with `[auto]` gets an `auto` pill next to its outcome. «Waiting» and the waiting banner count breakpoints and hard-stops separately (`2 breakpoints · 1 hard-stop`). Same labels in the Last 24 hours table and in Insights' outcome keys.
5. Tests: one fixture per class (declared Stop wins; handoff → ceiling; planned section reached → breakpoint; «None planned» → hard-stop), the `[auto]` count with and without the Prompt-ID bracket, and the page rendering the three pills and `auto`. Full suite green.
6. Restart the board on 4710 from this worktree (stop the current one, check it is a `tack` node process; `TACK_NOTIFY=off`; the store copy as before). Report the counts per class from `/api/lanes`.
7. One `feat(tack)` commit, one docs commit with the log entry and this prompt's `Status:` line.

## DOVE
`tack/**`, `docs/log-inbox/tack.md`, this prompt file. Nothing else.

## NON FARE
No change to `lane-run.mjs`, to `docs/PROTOCOL.md`, `CLAUDE.md` or any governance file, or to the 4700 board (R-TACK-2). No message text in the store. No push, no merge.
