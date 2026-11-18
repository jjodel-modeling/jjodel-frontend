# Canvas: skip the forced first mount of never-measured nodes (#475, #547)

Prompt-ID: P-2026-11-04-0901
Chat: C-2026-11-03-2317
Front: hw-notation
Status: eseguito 2026-11-04 · lane full · be8e2eed2 0740d511f · stopped at the context ceiling, closed by P-2026-11-04-0925 · verifica visiva non applicabile (unattended: probe crops, no hand run)
Lane: full (Route A of the discovery, chosen on Alfonso's delegation, 2026-11-04 08:57)
Depends: P-2026-11-04-0404
Worktree: ~/jjodel-w-canvasmount, branch canvas-mount-unmeasured
Request: none (Alfonso, 2026-11-04 08:57)

Before anything else run pwd, git branch --show-current, git status --short: the stated worktree and branch, clean, otherwise stop with Outcome: blocked. Final line Outcome: done | hard-stop | question | blocked. No subagents, no background tasks. One probe run per tool call, uptime recorded before each timing run. Summary lines only, through node scripts/run-quiet.mjs. Commit each green step, before probes: lanes hit the context ceiling in 15 to 30 minutes. A question with one recommendation carries a line Recommended: <one line>. The repo is public: name no partner company. A probe is not a hand run. Do not merge. Close with «Decisions taken (unattended)», «Decisions awaiting Alfonso». Every reply opens with [P-2026-11-04-0901 · session <id>].

## COSA

Read docs/discovery/discovery_2026-11-04_jjtl_canvas_render.md and ~/.jjodel-lanes/P-2026-11-04-0256/ (patchA-skip-forced-render.diff if there, handoff). Implement Route A in EditorV2.tsx at the React Flow prop boundary: a node never measured enters with its real handle positions and an estimated size, so React Flow does not force-mount it. The two faults of the throwaway patch must be gone: edges touching a never-measured node are drawn, and fitView finishes.

Port distribution and ELK wait until a node is measured; they never read the estimate. If that cannot hold without the critical zone (useJjomSync.ts, portDistribution.ts), stop with Outcome: question. Route B is out. The behaviour on small models, selection, fit-to-view, export (CanvasExportService reads the DOM), and pan into an off-screen node is unchanged: check each and state how. Report in the Layer Impact Report docs/discovery/lir_2026-11-04_canvas_mount_unmeasured.md, committed before the code.

Figures before and after, load under 15 where possible and always recorded: b10_8, b11_9 (probe in ~/.jjodel-lanes/P-2026-11-03-2332/), longest task, long-task total, on the dev server; one before and one after on a production build. Crops before and after in the lane folder, at deviceScaleFactor 1: a small model, b10_8 after fit, b10_8 panned to an edge between an on-screen and an off-screen node. #475 closes only if the longest task actually shrinks: say so, the chat closes it.

## DOVE

frontend/src/components/editor-v2/EditorV2.tsx, a helper beside it with its test, the LIR, docs/log-inbox/hw-notation.md, the Status line. No CLAUDE.md 3.2 file. DynamicHandles.tsx and handle position code are read, not changed, unless you stop and ask.

## COME

Tests first. Gates: tsc, full vitest (3 files red at import are the baseline), build, check:docs.
