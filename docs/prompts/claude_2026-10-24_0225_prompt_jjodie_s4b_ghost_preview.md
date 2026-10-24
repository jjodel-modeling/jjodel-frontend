# Jjodie S4b: ghost preview on the canvas (code and gates)

Prompt-ID: P-2026-10-24-0225
Chat: C-2026-10-24-0020
Front: jjodie-ui
Lane: full (implementation S4b, code and gates)
Depends: P-2026-10-24-0137, P-2026-10-24-0155
Status: da eseguire
Corregge: none
Request: Alfonso, 2026-10-24 00:40 and 01:14, in the project chat (unattended run)
Model: claude-opus-5-5

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 is done (`docs/discovery/discovery_2026-10-24_jjodie_panel_jjel_live.md`). P8: the visual check runs in
the next lane (S4b probe); this lane runs the gates and one smoke probe of its own only if context allows.

Worktree: `~/jjodel-w-jjp-s4b`, branch `jjp-s4b`, cut from `jjodie-panel` at `ebac98b62` (S1a, S3a, S3b, S4a merged)
plus the commit that adds this prompt. Before anything else: `pwd`, branch, `git log -1`, `git status --short` (only
the `frontend/node_modules` symlink may show). Otherwise stop.

## Lane discipline

Every reply opens with `[P-2026-10-24-0225 · session <id>]`; every final message ends with
`Outcome: done | hard-stop | question | blocked`; every question carries `Recommended: <one line>`. Unattended
(RC-21, RC-25) except the RC-26 list: Alfonso is asleep. Critical-zone files (CLAUDE.md §3.2: `useJjomSync.ts`,
`portDistribution.ts` and the others listed there) are not authorised: if the preview cannot be drawn without one,
stop with `Outcome: question`. Time limit: 75 minutes. No subagents, no background tasks. Commit as soon as the gates
are green. Context discipline (the first lane of this front stopped at the 200k ceiling): never `cat` a whole large
file or log; `EditorV2.tsx` (about 5100 lines) is read only by line ranges found with grep, starting from
`flowElements` and the R-SIM-16/29 `hideRunEvents` code; test and build output through `tail` or `grep` of the summary
lines. If the context passes about 150k, commit what is green, write a handoff and stop with `Outcome: hard-stop`.
Subject lines without `(P-...)` suffix, Prompt-ID in the body, `Model:` trailer. Log entry in
`docs/log-inbox/jjodie-ui-s4b.md` (a file of its own). Nothing merges anywhere: the chat merges `jjp-s4b`.

## Read first, and only this

The report: Q3, Q7 (row S4b), «Decisions taken», «Dependencies and risks». Rows R-JJD-2 and R-JJD-6. The S4a log entry
(`docs/log-inbox/jjodie-ui.md`, its Notes and Ticket: the planner reads a plain-data `PlanWorld`, and the builder from
the store, as `buildWorld` in `ConsumerProposal.tsx`, is owed by the first UI consumer, which is this lane). The S4
paragraph of `docs/prompts/claude_2026-10-24_0020_prompt_jjodie_panel_jjel_live.md`.

## COSA

Slice S4b under R-JJD-2:

1. A `PlanWorld` builder from the store (with `opposite` and attribute `upper`), next to the planner, with tests on
   plain fixtures where possible.
2. A small preview store (`useSyncExternalStore`, a module of its own; grep names first) holding the current planned
   preview: the script text, the plan, the target model id. Set by a new registry event (append only to
   `events/registry.ts`, for example a «preview script» event carrying the script text and the model id) so that S2
   and S5 can drive it later; cleared by Discard, by Apply, and when the model changes.
3. In `EditorV2.tsx`, append synthetic nodes and edges for the planned creations to `flowElements` (the
   `hideRunEvents` pattern): new elements with a dashed cyan border `#06b6d4` and translucent fill, new edges dashed,
   a small amber marker on elements with warnings. Preview ids are prefixed and ignored by every selection, drag,
   connect and delete handler; they are never draggable or selectable and never create a D-object. Placement: below
   or beside the existing nodes without overlapping them (a simple column is enough).
4. A floating bar at the top of the canvas (new component and stylesheet): `Preview · +N objects · K warnings` with
   `Discard` and `Apply`. Discard clears the preview and leaves the model untouched. Apply runs the script through the
   existing executor path that the code block's Run uses today, then clears the preview; one undo step comes in S4c,
   so say in the log that Apply is still several undo steps here.

Gates: typecheck at the baseline of CLAUDE.md §17, vitest (summary lines), build. Commit
(`feat(canvas): ghost preview of a planned script`).

## HARD STOP

`Outcome: hard-stop` after the closing docs commit (log entry and Status): visual check due in the probe lane.

## NON FARE

No edit to Jjodie components (`JodieHeader.tsx`, `ChatInput.tsx`, `MarkdownRenderer.tsx`, `Jodie.tsx`,
`JodieWindow.tsx`): another lane is editing them. No `reducer.ts`, no critical-zone file. No merge, no push.
