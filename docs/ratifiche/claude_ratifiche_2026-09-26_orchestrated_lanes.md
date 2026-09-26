# Ratification 2026-09-26: orchestrated lanes (RC-20..RC-24)

**Date**: 2026-09-26. **Branch**: `alfonso-frontend-jjtl`. **Reference commit**: `9290c17be`.
**Source**: observer chat `C-2026-09-25-1353`, afternoon session of 2026-09-26, over the BPMN of one
lane (`docs/harness/lane-lifecycle-bpmn.pdf`, to be added by the implementation lane).
**Rows**: `docs/decisions.md`, «Ratifiche 2026-09-26: orchestrated lanes».
**Status**: ratified by Alfonso in chat on 2026-09-26, with one addition to RC-21 (a binary "proceed?" or option 1 counts as recommended).

## Decision

The three message flows of a lane that cross a pool boundary (prompt to Claude Code, hard stop back
to the chat, GO to Claude Code) are today a manual paste. They become operations of the project chat,
and Alfonso intervenes only where the protocol names him: ratification and the visual GO, the latter
now by sampling. Five rules.

**RC-20, orchestrated launch.** The project chat starts and resumes Claude Code sessions itself, from
the native shell of the Mac: `claude -p` in the lane's worktree with the committed prompt file as
input, in the background with the transcript on a log file, capturing the session id; the GO and
every later message reach the same session through `--resume` on that id. A session started without
`--resume` is new by construction (`/clear` is implicit). Every final message of a session ends with
one line `Outcome: done | hard-stop | question | blocked`, written in the lane discipline section of
every prompt; the chat reads that line and never interprets prose. A question is a hard stop: the
session writes it, terminates, the chat answers within its remit or brings the question to Alfonso,
then resumes. A rework after a failed visual GO resumes the same session with a new Phase 2 prompt
that `Corregge` the old one; a rework whose cause is the analysis opens a new discovery, declared. In non-interactive mode an `ask` cannot be answered and is a refusal with its reason;
the critical-zone hook keeps that behaviour, and a critical-zone lane needs the Layer Impact Report
and the explicit go-ahead in the resumed text, or is opened by Alfonso by hand as today. A session
that does not exit within the time limit (90 minutes by default, a prompt may declare another) is
`blocked`: the chat reports it and
does not resume on its own. A session that reports `done` with the Status line not flipped is an
inconsistency the chat reports before any merge.

**RC-21, recommended answers.** When a session's question carries a single, unconditional
recommendation in the fixed form `Recommended: <one line>`, the chat adopts it without asking, if the
choice stays inside the lane's perimeter. It asks Alfonso when the recommendation touches a
critical-zone file, changes an exported interface, amends a ratified R- decision, deletes a file or
adds a file outside the DOVE list, or when there is no single recommendation. Every unattended
adoption is recorded in `decisions.md` and in the memo with the marker `ratified as recommended,
unattended`, and the closing report of the lane lists them first. Above five unattended adoptions in
one lane the chat stops and submits them together before continuing.

**RC-22, parallel by default.** Two lanes start together whenever three mechanical checks pass: their
DOVE lists (tests included) do not intersect; neither depends on an exported interface the other
changes and the trunk does not yet have; each has its own worktree and its own branch. When the
checks pass, parallel launch is the default, not a choice; when one fails the chat says which and
queues the lane with its merge position already fixed. The useful shape is one lane with a visual
check plus as many lanes without one (pure modules with a mutation bench, read-only discoveries,
exporters with a textual oracle) as there are worktrees. Simulator lanes launched in parallel branch
from `simulation-engine` (`sim-<slug>`) and merge back into it; branches merge one at a time in the
order fixed at launch, semantic conflicts resolved on the branch first (RC-14).

**RC-23, visual check by the chat.** The numbered visual steps of a prompt (the items of its §11.5)
are a checklist the chat runs in the built-in browser of the desktop app against the lane's dev
server on the Mac. Every item is read from the DOM or the console (positions, presence, texts, button
states), never from a screenshot; screenshots in light and dark are taken and attached for Alfonso as
a record, not as evidence. The browser profile is empty and separate from Alfonso's: fixtures are
built with the console script the prompt names or imported from an exported file, never assumed to
exist. The log entry records the source: `Smoke visivo: passato — chat, unattended, <n>/<n>`. Alfonso's
GO stays mandatory on critical-zone lanes, on items that are perceptual judgements (the prompt marks
them as such), and on any item the chat could not close for a technical reason, which counts as
failed, not skipped. Until 2026-10-03 every unattended check is followed by Alfonso's GO on every lane, with the
screenshots and measures in hand; the sampled GO starts after that, with the data (RC-15).

**RC-24, concurrency limit.** The limit of P13, «at most two sessions on the shared tree on disjoint
files», was written for sessions on one worktree. With one worktree and one branch per lane it is
replaced by: one branch per lane, merges one at a time, and the three checks of RC-22 at launch.

## Rationale

The Prompt-ID and Status guards exist because the three transitions are manual: a GO pasted into the
wrong session (2026-09-17) and two chats on one gate (2026-09-19). Orchestrating the transitions
removes the cause and keeps the guards, which cost nothing. The rest follows the direction of RC-15
(norms move to enforcement where a machine holds them honestly, the visual gate is measured before it
is relaxed) and of RC-19 (human gates do not rest on `ask`). Recommended answers are already ratified
in blocks («as recommended», 13 on 2026-09-25 for step 3, 18 for the `.[x]` operator); the rule
removes the round trip where Alfonso's answer would have been «si». Parallelism was possible today
and did not happen (exporter and 3c discovery could have run beside the 1315 and 1535 lanes): the
rule makes the default explicit and the criterion mechanical.

## Measured today

The pipe was probed on 2026-09-26 at 17:0x from the observer chat: `localhost:3002` (dev server of
`~/jjodel-sim`, started by the 1535 session) opened in the built-in browser without a site approval,
«Offline mode» reached the project list, the DOM and page JavaScript were readable (build 3835, light
theme). The browser's `localStorage` held no project: fixtures must be built or imported (RC-23).
Git reads from the chat go through the native shell (`osascript`), since the worktrees point to
`~/jjodel/.git` and the bridge VM cannot see it.

## Alternatives set aside

A lane tracker file as a state machine shared by the actors (`docs/lanes/<Prompt-ID>.json`): set
aside on 2026-09-26, the goal is fewer human hand-offs, not more bookkeeping. A `Stop` hook to notify
the chat: unnecessary while the chat launches the session itself and sees the process exit. Relaying
messages between sessions: still forbidden (P13).

## Settled on 2026-09-26 (Alfonso, four answers)

The rework loop re-enters at the Phase 2 prompt, in the same session: the chat resumes the session
with a new prompt that `Corregge` the old one; the discovery is not redone. If the cause of the rework
is one of analysis, the chat says so and opens a new discovery as the declared exception. The time
limit per lane is 90 minutes by default; a prompt may declare a different one. The first lane to run
the orchestrated pipe is lane C of the simulator. During a first period, until 2026-10-03, the chat
runs the checklist and Alfonso confirms on every lane with the screenshots and measures in hand; the
sampled GO starts after that, with the data. The wording of the `Outcome` and `Recommended` lines is
the one written in RC-20 and RC-21.

## Next step

After ratification: the five rows in `decisions.md`; P16 (orchestration) in `PROTOCOL.md`, P8 and P13
amended; the lane discipline section of the prompt template; §7 of `HARNESS-DOCS.md` with the BPMN
figure; a `lane-run` script in `frontend/scripts/` (launch, capture the session id, resume) with a
dry run recorded as its oracle. One implementation lane, full, owned by this chat.
