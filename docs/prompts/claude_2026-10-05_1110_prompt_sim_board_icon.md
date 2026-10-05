# Simulation panel: a clearer icon for the I/O board button

Prompt-ID: P-2026-10-05-1110
Chat: C-2026-10-05-1110
Lane: fast (cosmetic, one icon class). Tier: light. Model: the default of `.claude/settings.json`, no deviation. No critical-zone go-ahead.
Status: da eseguire
Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Worktree: `~/jjodel-w-boardicon`, branch `sim-board-icon` from the trunk `0e77734a2`, `frontend/node_modules` symlinked (P14). Before anything else:
`pwd`, branch, `git log -1` (the docs commit adding this prompt, on top of `0e77734a2`) and a clean `git status`. Otherwise stop with `Outcome: blocked`.

## Lane discipline

Every reply of this session opens with `[P-2026-10-05-1110 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.

## Context (do not redo the analysis)

The button that opens the I/O board in the simulation panel uses `bi bi-motherboard`
(`frontend/src/components/editor-v2/sim/SimulationPanel.tsx`, around line 860). Alfonso: the icon does not say what
the button does. The board holds the machine's inputs (switches, buttons) and outputs (lamps); the chat chose
`bi-toggles` (two switches, reads as a control panel; Bootstrap Icons 1.13.1 ships it).

## COSA

1. Replace `bi-motherboard` with `bi-toggles` on that button. Same size, same title, same position: no layout
   change (0 px delta on the button's box).
2. If any other place shows the same board-opening affordance with `bi-motherboard` (a test fixture, a
   snapshot, a doc page describing the button), update it consistently; grep `bi-motherboard` across
   `frontend/src`, `frontend/docs` and `docs/` and list the hits in the log entry.

## Tests and gates

Typecheck (baseline), vitest (fixtures updated if they carry the class), build, check:docs. One code commit
(`fix(sim): clearer icon for the I/O board button`), log entry in `docs/log-inbox/simulation.md`.
Crop of the panel toolbar before/after at 600 px (gitignored) for the chat's RC-23 check.

## HARD STOP

- After the code commit: `Outcome: hard-stop (visual check due)`. Do not merge.

## NON FARE

No other icon, no title change, no SCSS change, no `git stash`, no `git add .`, no files outside the worktree.

## RIFERIMENTI

`CLAUDE.md`, `template-task-visivi`.
