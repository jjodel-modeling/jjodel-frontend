# Simulation: hide event instances on the canvas while a run is active

Prompt-ID: P-2026-10-04-0935
Chat: C-2026-10-04-0935
Lane: fast (cosmetic, view-only; hard stop if the only path is in the critical zone). Tier: heavy. Model: the default of `.claude/settings.json`, no deviation. No critical-zone go-ahead.
Status: da eseguire

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-simhide`, branch `sim-hide-events` from the trunk `43685438b`, `frontend/node_modules` symlinked (P14). Before anything else:
`pwd`, branch, `git log -1` (the docs commit adding this prompt, on top of `43685438b`) and a clean `git status`. Otherwise stop with `Outcome: blocked`.

## Lane discipline
Every reply of this session opens with `[P-2026-10-04-0935 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.

## Context (do not redo the analysis)
Events are M1 instances in the same model (R-SIM-16): instances of the metaclass(es) bound to the event role
(`simEvent`, matched with `isKindOf`), drawn as ordinary nodes, linked to transitions by the trigger reference
(`simTrigger`). During a run the user fires events from the panel (event buttons, or the I/O board), so the
event nodes on the canvas are noise. Alfonso: hide them while the simulation runs.

## COSA
1. While the run state is Running, Terminated, Deadlock or Halted (R-SIM-29), the canvas does not render the
   nodes of event instances, nor any edge incident to them (trigger references included). In Not started,
   after Reset, and when the simulation panel is closed, everything renders as before.
2. View-only: no model write, no position or size write, no layout run, nothing persisted, nothing on the undo
   stack. Every other node keeps its box (0 px delta). Panel, event buttons and board are unchanged.
3. A model with no event role behaves exactly as today (parity oracle).

Inline check first (max 10 lines in the log entry): where the run state lives, how the canvas learns it, and
the narrowest render-time filter (e.g. the node/edge arrays handed to React Flow in `EditorV2.tsx`, or a
`hidden` flag). Verify any new identifier with a global grep.

## Visual contract (template-task-visivi)
- Now: on a scene with an event role, during a run, event nodes and trigger edges are in the DOM.
- Then: during a run, 0 `.react-flow__node` of event instances and 0 edges incident to them; all other nodes
  and edges with identical bounding boxes; after Reset the DOM equals the Not started frame.
- Acceptance: probe on the four demo scenes (`~/jjodel-demo-exports/`) plus one hand-made statechart with
  events: counts as above, bbox delta 0 px, console clean; scenes without events byte-identical. Crops
  `<scene>_{before,running,reset}_600.png` (gitignored) for the chat's RC-23 check.

## Tests and gates
Unit tests for the filter first (red before the fix), mutation bench on the filter, then typecheck (baseline
14), vitest, build, check:docs. Code and docs in separate commits; log entry in `docs/log-inbox/simulation.md`.

## HARD STOP
- If the only viable path touches `useJjomSync.ts`, `portDistribution.ts`, `handlePosition.ts` or
  `viewpoint/ir/`: stop before editing, write a Layer Impact Report in the log inbox, `Outcome: question`.
- After the code commit, with the visual check due: `Outcome: hard-stop (visual check due)`. Do not merge.

## NON FARE
No change to the engine, the roles modal, the board, R-SIM rows, layout or VersionFixer. No `git stash`,
no `git add .`, no files outside the worktree (no `/tmp` scratch files).

## RIFERIMENTI
`docs/spec/claude_spec_2026-09-13_computational_model.md` (R-SIM-16, R-SIM-29), `docs/decisions.md` R-SIM
series, `CLAUDE.md` §3.2, `template-task-visivi`.
