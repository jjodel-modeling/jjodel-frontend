# Multi-tab viewpoints, discovery: per-tab active viewpoint, shared layout per (model, viewpoint), state that is one per project today

Prompt-ID: P-2026-11-06-2350
Chat: C-2026-11-06-2333
Front: multi-tab
Status: da eseguire
Lane: full (discovery, read only; the Phase 2 lanes will touch the critical zone)
Depends: R-MT-1..4, R-LAY-10..16, R-SIM-29, R-SIM-33
Worktree: ~/jjodel-w-multitab, branch multi-tab, at this prompt's commit on alfonso-frontend-jjtl (no node_modules: if a probe needs them, the P14 symlink to ~/jjodel/frontend/node_modules, removed at the end)
Request: none (Alfonso's words are in the lane folder as request.md)

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. Read only: no source file changes; you write the discovery report, and throwaway probes only in the lane folder ~/.jjodel-lanes/P-2026-11-06-2350/. No subagents, no background tasks. Every reply opens with [P-2026-11-06-2350 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Every question with a recommendation carries it in one line: `Recommended: <one line>`. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a probe log, grep its summary lines. Write the report section by section, committing after each (RC-51).

## Contesto (non rifare l'analisi)

Alfonso wants the same model, or several models, open in different tabs, each tab with its own viewpoint. R-MT-1..4 (docs/decisions.md) fix the target: the model is one and shared; the layout belongs to the pair (model, viewpoint), as R-LAY already keys it (`getActiveLayoutKey`, `__abstract__`); the active viewpoint, pan, zoom and the session size derived from content belong to the tab; selection is shared across tabs by model element; a simulator run belongs to the model and every tab observes it; two tabs on the same model and the same viewpoint are allowed and share the layout. R-LAY-11 made `activateViewpoint` (`utils/lastViewpoint.ts`) the only live writer of `project.activeViewpoint` and `state.viewpoint`; with tabs that single global value is exactly what must stop being the source of truth. Do not reopen these decisions; measure what the code needs.

Hypothesis to falsify: «the active viewpoint and the canvas sync state are global per project, so two editor instances on the same model cannot show different viewpoints without interfering».

## COSA

(1) **Active viewpoint census.** Every writer and reader of `state.viewpoint`, `project.activeViewpoint`, `activateViewpoint`, `getActiveLayoutKey`, `getLayoutKeyOf`, and the activation read at `irResolveCore.ts` (R-LAY-16 cites line 139; re-measure). For each reader: is it inside an editor instance (canvas, toolbar select, Properties rail, Symbol Editor, textual tab, Code panel, validation, Jjodie preview) or global, and could it receive the viewpoint from the tab instead. Positive control for every absence claim, with quoted globs.

(2) **Tabs and editor instances.** How a model tab is created and identified (rc-dock tab data, tab id from model id or not), whether the same model can be opened twice today and what happens if forced, what an EditorV2 instance owns (React Flow provider, store, viewport, `fitViewOptions`), and where a per-tab viewpoint would live: React context of the editor instance, or Redux keyed by tab id. Note that rc-dock tabs are not persisted.

(3) **Sync and critical zone, read only.** What happens when two EditorV2 instances mount the same model: `useJjomSync.ts` (Step 2, Step 4, deps), `syncState.ts` (`hasCanvasEdgePair`, `markCanvasEdgePair`, keyed by vertex pair without viewpoint), `useM1ReferenceEdges.ts`, `vertexSnapshot.ts`, `canvasToJjom.ts`, `jjomTransformers.ts`, `portDistribution.ts`, `handlePosition.ts`. Is the DGraph one per model with per-viewpoint layout dictionaries, and does a second mount create edges or vertices twice? Same question for `useContentSize.ts` and `nodeSizing.ts` (session sizes). List every critical-zone file a Phase 2 would touch (CLAUDE.md §3.1, §3.2); the Layer Impact Report is owed by those lanes, not here.

(4) **State that is one per project today.** Selection (where it lives, whether it is per user, per model element, per editor; R-MT-2 wants it shared by model element), the problem registry, the activation of validation viewpoints, the simulator run state and panel (R-MT-3: owned by the model, observed by tabs; is it keyed by model or by editor today?), the Jjodie ghost preview, undo, minimap, the textual tab. For each: already compatible, needs a key, or needs a decision.

(5) **Persistence.** What the saved project records about the active viewpoint (`project.activeViewpoint`, `api/persistance/projects.ts`, the 2.228 migration in `VersionFixer.tsx`), and what it should become when the tab owns the viewpoint (R-MT-1: the project value is only the default for the next opening). No migration is proposed unless the stored shape must change.

(6) **Optional probe.** If it settles (2) or (3), a throwaway probe in the lane folder that mounts two editors on one model with two viewpoints on a dev server at a free port (check the port first; never 3000 or 3001 if busy). Load gate: run `uptime` first and do not start a dev server if the 1-minute load is above 16.

(7) **Lane plan.** Lanes in order, each at five files or fewer, with files, visual yes/no, critical zone yes/no. Then decisions Q1..Qn, one recommendation each. Expected at least: where the per-tab viewpoint lives; what the toolbar select writes; what a tab shows when its viewpoint is deleted or deactivated; whether the classic editor gets per-tab viewpoints or stays on the project default; how a tab is opened on a chosen viewpoint (gesture).

Discovery report, mandatory: docs/discovery/discovery_2026-11-06_multi_tab_viewpoints.md (the hypothesis being falsified, objective, files read with full paths, findings with file:line and verbatim quotes, dependencies and risks, open questions, «Decisions taken (unattended)», «Decisions awaiting Alfonso»), committed on branch multi-tab, plus the Status flip of this prompt left uncommitted (RC-17). Hard stop after the report. No push, no merge. Final message: findings in short, Q1..Qn with recommendations, then the Outcome.

## HARD STOP

After the report is committed. Any change outside the report and the lane folder is a stop with Outcome: blocked.

## NON FARE

No source changes, no edits to docs/decisions.md, no new decision rows, no edits in other worktrees, no Layer Impact Report (it belongs to the Phase 2 lanes).

## DOVE

Read: the paths of COSA (1) to (5) under frontend/src, docs/decisions.md (R-MT, R-LAY, R-SIM-29, R-SIM-33), the discoveries of the 2.228 front in docs/discovery/ (`discovery_2026-08-23_*`, `discovery_2026-08-24_*`). Write: the report and the lane folder.

## RIFERIMENTI

docs/decisions.md R-MT-1..4, R-LAY-10..16, R-SIM-29, R-SIM-33; CLAUDE.md §3; docs/discovery/discovery_2026-08-23_2228_slice2b_riallineamento.md; docs/discovery/discovery_2026-08-23_nestedview_ui_morta.md.
