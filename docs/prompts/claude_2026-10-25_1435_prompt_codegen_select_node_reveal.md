# Code generation 3.3: SELECT_NODE centres on React Flow's own viewport (completion of P-2026-10-25-1355)

Prompt-ID: P-2026-10-25-1435
Chat: C-2026-10-23-2009
Front: codegen
Lane: full (one handler in EditorV2.tsx, outside the critical zone; scope extended by the chat under RC-25)
Depends: P-2026-10-25-1355
Status: da eseguire
Corregge: P-2026-10-25-1355
Request: Alfonso, 2026-10-25 13:52, in the project chat (kept locally as `request.md`)

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 is done (the 1355 handoff's item 0). P8 replaced: the chat runs the visual check on the crops (RC-23).

Worktree: `~/jjodel-w-cggen`, branch `cg-generators`, HEAD `d88d939bd`. Before anything else: `pwd`, branch,
`git log -1`, `git status --short` (only the `frontend/node_modules` symlink may show). Otherwise stop. Alfonso's dev
server runs on 3131 from this worktree: never touch it; yours on 3133, stopped before the close.

Model and tier: as `lane-run` assigns.

## Lane discipline

Every reply opens with `[P-2026-10-25-1435 · session <id>]`; every final message ends with
`Outcome: done | hard-stop | question | blocked`. Unattended (RC-21, RC-25) except the RC-26 list. Time limit: 60
minutes. No subagents, no background tasks. Commit the fix as soon as typecheck and tests are green, before the probe.
Never print a diff, a whole file or a whole log; read `~/.jjodel-lanes/P-2026-10-25-1355/handoff.md` once (not the
`.diff`); one probe run per tool call; no probe while the 1-minute load is above 20. Run the bench in a temporary
detached worktree as 1355 did, never in this tree while 3131 serves it.

## The cause (measured by 1355)

Every fragment click selects its node, but the node is never in view on a canvas narrowed to ~528 px beside the
generator tab: `EditorV2.tsx:1140`, the `SELECT_NODE` handler, centres at `x = (window.innerWidth - rightInset)/3`
from the React Flow container's left, i.e. relative to the window, and moves the canvas on every click.

## COSA

1. **Answer to 1355's question (chat, RC-25, provisional; Alfonso informed with a veto):** yes, a minimal edit of the
   `SELECT_NODE` handler in `frontend/src/components/editor-v2/EditorV2.tsx`. Centre on React Flow's own viewport
   size (the store's width/height), keep the zoom, and leave the viewport unchanged when the node is already fully
   inside it. No other change in that file. Write a short Layer Impact note in the log entry: every `SELECT_NODE`
   emitter is affected (list them with a grep), and with a full-width canvas the result must match today's for a node
   that is off-screen (measure one case before and after).
2. Tests (kills named): a node outside the viewport is centred within it (kills: window-based centre); a node inside
   is not moved (kills: move on every select); the zoom is unchanged (kills: fitView used). Extend
   `scripts/probe/codegen-generator-tab.ts`: Alfonso's sequence, a fragment click on a node that starts off-screen
   on the narrowed canvas, assert it ends inside the canvas viewport and selected. Crops under
   `~/.jjodel-lanes/P-2026-10-25-1435/crops/`: the narrowed canvas with the revealed, selected node beside the code;
   the full-width canvas after a selection from elsewhere (unchanged behaviour).
3. **Close 1355 too**: its code is committed (`f141bb614` 7px grab area for the divider, `d88d939bd` probe) but its
   log entry and Status flip are missing. Write one log entry covering both lanes (1355's item 0 diagnosis and its
   decisions 1-3 from the handoff, this lane's fix) and flip both `Status:` lines: 1355 `eseguito 2026-10-25 · lane
   codegen · f141bb614 · item 2 completed by P-2026-10-25-1435`, this one `eseguito 2026-10-25 · lane codegen · <fix
   sha> · <bench k/n> · crops in the lane folder`.

## DOVE

`frontend/src/components/editor-v2/EditorV2.tsx` (the `SELECT_NODE` handler only) and a test beside its existing
tests (or a pure helper in a new small module the handler calls, with its test), `frontend/scripts/probe/
codegen-generator-tab.ts`, `docs/log-inbox/codegen.md`, the `Status:` lines of this prompt and of 1355. Nothing in the
critical zone (`useJjomSync.ts`, `canvasToJjom.ts`, `jjomTransformers.ts`, `portDistribution.ts`, `handlePosition.ts`,
`DV.tsx`, `VersionFixer.tsx`).

## Gates

From `frontend/`: `npm run typecheck` exit 0; `npm run build`; `npx vitest run src/codegen src/components/editor-v2`;
`npm run check:codegen-lazy -- --on`; the probe green; bench killed/total.

## Close

`fix(editor): SELECT_NODE centres on the flow viewport, no move when visible (P-2026-10-25-1435)`, then the docs
commit (log entry and both flips). `Outcome: done`.

## NON FARE

No other change to EditorV2.tsx. No new dependency. No push, no merge (R-GEN-39).
