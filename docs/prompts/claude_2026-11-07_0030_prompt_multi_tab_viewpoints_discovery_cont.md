# Multi-tab viewpoints, discovery continuation: §4 to §7, lane plan, Q1..Qn

Prompt-ID: P-2026-11-07-0030
Chat: C-2026-11-06-2333
Front: multi-tab
Status: eseguito 2026-11-07 · lane full · 177e95c9f
Lane: full (discovery continuation, read only)
Depends: P-2026-11-06-2350 (handoff ~/.jjodel-lanes/P-2026-11-06-2350/handoff.md)
Worktree: ~/jjodel-w-multitab, branch multi-tab, at this prompt's commit (on top of 145c2b7c6)
Request: none (continuation of P-2026-11-06-2350 after the context ceiling)

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. Read only: no source changes. No subagents, no background tasks. Every reply opens with [P-2026-11-07-0030 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Every question with a recommendation carries it in one line: `Recommended: <one line>`. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD. Commit after each section (RC-51).

## COSA

Read `~/.jjodel-lanes/P-2026-11-06-2350/handoff.md` first, then the prompt `docs/prompts/claude_2026-11-06_2350_prompt_multi_tab_viewpoints_discovery.md` for the full scope. Do not redo §0 to §3.6 of `docs/discovery/discovery_2026-11-06_multi_tab_viewpoints.md`: they are committed. Finish the same report:

(a) Move the Evidence of the handoff into the report where it belongs (the asynchronous dispatch at `action.ts:349` and the duplicate vertices or M2 edges from creations outside the canvas, the simulator run keyed by model id, selection in the store), each as read or measured.
(b) §4 state that is one per project today, §5 persistence, §6 the probe only if the 1-minute load is at or below 16 (otherwise say it was not run and why), §7 the lane plan (each lane at five files or fewer, files, visual yes/no, critical zone yes/no; a first lane that fixes what is already broken without multi-tab, `EditorSwitch.tsx:93` and `:108`, and the possible regression of `242a82bcd`, comes first if it stands alone).
(c) Q1..Qn with one recommendation each (Q1 and Q2 are drafted in the handoff), then «Decisions taken (unattended)» and «Decisions awaiting Alfonso».
(d) Add the «## 0. Answer in brief» section P16 asks for, at the top.
(e) Flip the Status line of both prompts (P-2026-11-06-2350 and this one), left uncommitted (RC-17).

## HARD STOP

After the report is complete and committed. No push, no merge, no source changes, no decision rows.

## DOVE

Write: `docs/discovery/discovery_2026-11-06_multi_tab_viewpoints.md` and the lane folder ~/.jjodel-lanes/P-2026-11-07-0030/. Read: as P-2026-11-06-2350.
