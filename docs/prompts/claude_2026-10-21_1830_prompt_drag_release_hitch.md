# Canvas: the hitch at drag release on a large model (discovery)

Prompt-ID: P-2026-10-21-1830
Chat: C-2026-10-20-0839
Front: maintenance
Lane: full (the fix will likely land in the sync layer, critical zone; Phase 1 read-only)
Status: da eseguire
Request: https://claude.ai/code/session_01EMpM7yBvFWpBXh3o1TJSRA
Depends: P-2026-10-21-1753
Corregge: —

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-dragrelease`, branch `drag-release-hitch`, cut from `alfonso-frontend-jjtl` at the commit that
adds this prompt. Model and tier: heavy, as pinned (RC-16), effort `xhigh`.

## Lane discipline

Every reply opens with `[P-2026-10-21-1830 · session <id>]`; every final message ends with one line
`Outcome: done | hard-stop | question | blocked`. Time limit 90 minutes. Every gate runs in the foreground (P16). No
push, no merge. Phase 1 only: hard stop on the discovery report; no product code edited. Context discipline, learned
on the previous perf lanes (all four stopped at the AM-8 ceiling): never cat a probe log or a CPU profile, grep the
summary lines only; run gates through `node scripts/run-quiet.mjs`; read the round 3 report only at §3.3 and §3.4;
write the report before the soft ceiling (RC-51). Load gate: `uptime` before every measurement run, start only when
the 1-minute load is ≤ 16 (wait up to 20 minutes, then run and record the load); the other chats' lanes keep this
machine busy.

## COSA

After the six performance merges of 2026-10-20/21 (lazy References `bfab138ba`, core name scans `2e9a4dd6c`,
incremental sync `d9ea6a486`, inset `74b80d710`, intrinsic cache `460d77437`, plus R-GV-18) the largest felt event
left on «Jjodel harness» is the release of a drag: the pointerup costs one long task of 312–416 ms in production
(round 3 report §3.3, «drag INP»; the probe's drag step ends with a 464 ms task), while the moves themselves are at
p50 61–81 ms. The round 3 report attributes it, unmeasured, to the position commit, the sync and the autosave
scheduling (`EditorV2.tsx:4525` `scheduleLayoutSave` on drag end, `syncPositionBatchToJjom`, edge lanes 135 ms).

Answer with numbers, from CPU profiles of the release alone:
1. Split the pointerup long task by inclusive time: the store dispatch of the position (`syncPositionBatchToJjom`
   and what it writes), the `useJjomSync` run that follows (how many vertices it re-transforms after the R-GV-18
   and incremental-sync fixes: expected 1), the edge recomputation (`assignLanes`, `corridors`, `conflicts`,
   `parsePathPoints`: how many edges are recomputed for one moved node, expected only its incident edges), the
   React commits (which components, how many fibers), the autosave scheduling, and anything else. State what is
   proportional to the whole model (407 objects, 48 nodes on the BPMN viewpoint) and what to the moved node.
2. The same for a drag of a container (a Role lane on the BPMN viewpoint), which moves its children.
3. Ablations in the probe, measured and reverted, one each: skip the edge recomputation for non-incident edges;
   defer the autosave scheduling out of the pointerup task (`requestIdleCallback` or a timer); whatever item 1 shows
   as the largest slice.
4. Dev versus production for the release (one production build; the base production numbers of the day are in
   `~/.jjodel-lanes/P-2026-10-21-1535/handoff.md`, grep «drag»).
5. A ranked list of fixes with the measured saving, its layers, and whether it touches the critical zone
   (`useJjomSync.ts`, `viewpoint/ir/`), the core or persistence.

## DOVE

Read anything. Write only the probe `frontend/scripts/probe/large-model-click-profile.ts` (a new opt-in step
`release` that profiles the pointerup alone, and one for the container drag) and the report
`docs/discovery/discovery_2026-10-21_drag_release_hitch.md` (mandatory, CLAUDE.md: objective, files read with full
paths, findings with numbers, dependencies and risks, open questions for Alfonso, ranked fixes). Ablations are
temporary, never committed. Fixture: `~/jjodel-papers/2026-sosym-harness-models/jjodel/jjodel.harness.project.jjodel`
(do not copy it into the repository).

## COME

1. Baseline `npm run typecheck` (0, RC-48) through `node scripts/run-quiet.mjs` from `frontend/`.
2. Items 1 to 5 in order; three runs per measurement where the load allows, one otherwise, each recorded with its
   load.
3. `chore(probe):` commit and `docs:` commit (separately, the P13 hook refuses them together), `git add` by path,
   `Model:` trailer. Hard stop.

## RIFERIMENTI

`docs/discovery/discovery_2026-10-21_large_model_round3.md` §3.3, §3.4, §5 (fix 4);
`docs/discovery/discovery_2026-10-21_jjomsync_incremental.md` §4 (what the incremental sync now does on a position
write); `docs/sessioni/sessione_2026-10-21.md` (the day's numbers); R-GV-1..18 in `docs/decisions.md` for the
container drag.
