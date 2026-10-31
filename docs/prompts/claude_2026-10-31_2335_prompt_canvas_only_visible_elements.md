# Canvas: render only the visible nodes and edges (React Flow viewport virtualization)

Prompt-ID: P-2026-10-31-2335
Chat: C-2026-10-31-2310
Front: maintenance
Lane: fast (one prop on the ReactFlow component, outside the critical zone, no exported interface changes)
Status: da eseguire
Corregge: —

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 non si applica (motivo: fast lane, RC-3; the preventive check goes in the log entry, ten lines max).

Worktree: `~/jjodel-w-onlyvis`, branch `only-visible`, cut from `alfonso-frontend-jjtl` at the commit that adds this
prompt. Model and tier as pinned (RC-16). Before anything else: `pwd`, branch, `git log -1` and `git status` are as
stated here. Otherwise stop.

## Lane discipline

Every reply opens with `[P-2026-10-31-2335 · session <id>]`; every final message ends with one line
`Outcome: done | hard-stop | question | blocked`. Every question that has a recommendation carries it in one line:
`Recommended: <one line>`. Time limit 60 minutes. Gates in the foreground through `node scripts/run-quiet.mjs`. Never
cat a probe log, grep its summary lines only. Load gate before each measurement: `uptime`, run only with the 1-minute
load ≤ 16 (wait up to 15 minutes, then run and record the load). No push, no merge.

## Contesto (non rifare l'analisi)

`<ReactFlow>` in `frontend/src/components/editor-v2/EditorV2.tsx` (around line 4875, the prop block ends with
`connectionRadius={40}`) does not pass `onlyRenderVisibleElements`; the `@xyflow/react` 12 default is `false`, so every
node and edge of the model is mounted and re-rendered on every commit. On 2026-10-31 Alfonso loaded a 525-instance model
on a throwaway build with the prop set to `true`: the editor went from unusable (10 to 15 s per gesture) to normal.
The port distribution still runs on the whole edge list; that is a separate, later front and is out of scope here.

## COSA

1. Add `onlyRenderVisibleElements` to the `<ReactFlow>` props in `EditorV2.tsx`, right after `connectionRadius={40}`.
   No runtime toggle, no window global, no setting.
2. Measure before and after on the harness fixture
   (`~/jjodel-papers/2026-sosym-harness-models/jjodel/jjodel.harness.project.jjodel`) with
   `frontend/scripts/probe/large-model-click-profile.ts`, production build (`CLICK_PROD`), default passes. Record drag
   release, model open and viewpoint switch, median of the probe's runs, before (trunk) and after (branch).
3. Correctness checks in the same probe session or a short ad hoc script, numbers from the DOM, never screenshots:
   (a) an edge whose two endpoints are both outside the viewport but whose path crosses it is still rendered
   (`.react-flow__edge` count for that edge id is 1); (b) after a pan that moves a node out of view and back, its
   handle positions (`getBoundingClientRect` of its `.react-flow__handle` elements, relative to the node) are equal to
   the ones before the pan, within 1 px; (c) the minimap still shows all nodes; (d) console has no new errors or warnings.
4. Run the gates against their baselines: `npm run typecheck`, `npx vitest run`, `npm run build`, `npm run smoke`.
5. Code commit with the one-file pathspec, then the log entry in `docs/log-inbox/maintenance.md` and the Status flip,
   left uncommitted: a visual check is due (RC-17). Exit with `Outcome: hard-stop (visual check due)`.

## HARD STOP

If check (a) or (b) fails, stop before the code commit, report the failing ids and numbers, and propose the remedy in one
`Recommended:` line. Do not try a workaround.

## NON FARE

Do not touch `portDistribution.ts`, `useJjomSync.ts` or any file of §3.2. Do not change `MiniMap` props. Do not add
dependencies. Do not reorder or reformat the surrounding props.

## RIFERIMENTI

`docs/sessioni/sessione_2026-10-21*` and `sessione_CORRENTE.md` (performance front, measurements of 2026-10-20/21);
handoff of the paused lane `~/.jjodel-lanes/P-2026-10-21-1830/handoff.md` (drag release hitch, port distribution on 1322
edges) for context only.
