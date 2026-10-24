# Code generation 3.3: completion of P-2026-10-24-1515 (tab beside the canvas, resizable columns)

Prompt-ID: P-2026-10-24-1630
Chat: C-2026-10-23-2009
Front: codegen
Lane: full (completion of P-2026-10-24-1515, stopped at the context limit with its work uncommitted)
Depends: P-2026-10-24-1515
Status: da eseguire
Corregge: P-2026-10-24-1515
Request: Alfonso, 2026-10-24 15:08, in the project chat (kept locally as `request.md`)

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 is done. P8 replaced: the chat runs the visual check on the crops (RC-23).

Worktree: `~/jjodel-w-cggen`, branch `cg-generators`, HEAD `ea6c1ef0a`, with the uncommitted work of 1515 in the
tree. Before anything else: `pwd`, branch, `git log -1`, `git status --short`; the status must show the files the
handoff lists (and `frontend/scripts/probe/_tmp_rail_measure.ts` untracked). Otherwise stop. Alfonso's dev server
runs on 3131 from this worktree: never touch it; yours on 3133.

Model and tier: as `lane-run` assigns.

## Lane discipline

Every reply opens with `[P-2026-10-24-1630 · session <id>]`; every final message ends with
`Outcome: done | hard-stop | question | blocked`; every question carries `Recommended: <one line>`. Unattended
(RC-21, RC-25) except the RC-26 list. Time limit: 75 minutes. No subagents, no background tasks. **Context
discipline is the point of this lane** (1515 died twice at the ceiling): never print a diff, a whole file or a whole
log; read the handoff once; filter every gate and probe output with `tail`/`grep` to its summary lines; one probe run
per tool call.

## Read first, and only this

`~/.jjodel-lanes/P-2026-10-24-1515/handoff.md` (not the `.diff`). The 1515 prompt's sections Gates and Close, and the
chat's answer `~/.jjodel-lanes/xfer-1515/answer.md`.

## COSA

1. Delete `frontend/scripts/probe/_tmp_rail_measure.ts` (an untracked scratch file of 1515).
2. Gates first: `npx vitest run src/codegen`, `npm run check:codegen-lazy -- --on`, `npm run typecheck`. If green,
   **commit at once**: `fix(codegen): generator tab beside the canvas, Properties anchored to the canvas panel,
   resizable columns (P-2026-10-24-1515)`, pathspec the handoff's files.
3. `npm run build`; the full probe `scripts/probe/codegen-generator-tab.ts` on 3133; the crops the 1515 prompt asks,
   plus one of the Properties panel over the canvas with the generator tab open beside it.
4. The mutation bench (the seven mutations of the handoff), killed/total.
5. Optional, only if time remains: the 250 ms slide of the collapsing Properties panel over the generator tab;
   otherwise list it in the log entry.

## DOVE

The files of the handoff (including `frontend/src/components/editors/PropertiesWithTreeView.tsx`, scope extended by
the chat's answer), their tests, `frontend/scripts/probe/codegen-generator-tab.ts`, `docs/log-inbox/codegen.md`, the
`Status:` lines of this prompt and of P-2026-10-24-1515.

## Close

The fix commit of item 2 (and a `test(codegen)` commit if the probe changed after it), then one docs commit with the
log entry covering both lanes (Alfonso's visual check of 15:08, the before/after measurements of the Properties panel
with one dock panel, the RC-21 rule in `TemplateEditorTab.scss`, a Layer Impact note on `PropertiesWithTreeView.tsx`)
and the two `Status:` flips: on 1515 `eseguito 2026-10-24 · lane codegen · <fix sha> · completed by
P-2026-10-24-1630`, on this prompt `eseguito 2026-10-24 · lane codegen · <last sha> · <bench k/n> · crops in the lane
folder`. `Outcome: done`.

## NON FARE

No new feature. Nothing in the critical zone. No change outside DOVE. No push, no merge (R-GEN-39).
