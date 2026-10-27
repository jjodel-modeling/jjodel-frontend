# Critical zone: useJjomSync re-transforms every vertex on every update (fix 1 of round 2, discovery first)

Prompt-ID: P-2026-10-21-0035
Chat: C-2026-10-20-0839
Front: maintenance
Lane: full (critical zone: `useJjomSync.ts`, CLAUDE.md §3.1; Phase 1 read-only, then Phase 2 on GO)
Status: non completato 2026-10-21 · lane jjomsync-incremental · discovery d525d3ae8; Phase 1 done, Phase 2 not started in this session · continued by P-2026-10-21-0155
Request: https://claude.ai/code/session_01EMpM7yBvFWpBXh3o1TJSRA
Depends: P-2026-10-20-2305
Corregge: —

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Critical-zone go-ahead: Alfonso, 2026-10-21 00:13, «Ok», answering the chat's question «Mi dai l'ok a toccare il core
per 4 e 2, e la critical zone per 1?» after `docs/discovery/discovery_2026-10-20_large_model_slowness_round2.md`
(§5, fix 1). Phase 2 still needs the chat's GO on this lane's Phase 1 report, and a Layer Impact Report (RC-30).

Worktree: `~/jjodel-w-jjomsync`, branch `jjomsync-incremental`, cut from `alfonso-frontend-jjtl` at the commit that
adds this prompt. Model and tier: heavy, as pinned (RC-16), effort `xhigh`.

## Lane discipline

Every reply opens with `[P-2026-10-21-0035 · session <id>]`; every final message ends with one line
`Outcome: done | hard-stop | question | blocked`. Time limit 90 minutes per phase. A question carries one
`Recommended:` line. Every gate runs in the foreground (P16). No push, no merge. Watch the AM-8 ceiling (RC-51).

## COSA

From the round 2 report (§3.2, §3.3, §3.6, §4): the incremental effect of `useJjomSync` (`useJjomSync.ts:1228`)
re-transforms every vertex (`jjomVertexToRFNode` → `objectVertexToRFNode`, 6,102 `LObject.name` reads each time on
«Jjodel harness») because line 1334 forces `prevModel = {}`. The comment at :1331-1333 (`22a123a01`, 2026-05-21)
says the comparison was wrong: «it is sometimes taking newElement instead. source of isSingleton bug». During one
100 px drag the effect runs 8 times with one store dispatch seen by the probe. Commenting the line out (ablation)
halves the drag in dev (4.4 s → 2.3 s) and trims open, viewpoint switch and click, but it reopens the bug the line
works around.

Phase 1 (read-only, report mandatory): find (a) why `prevElements` sometimes holds the new element, with a
reproduction; (b) what the isSingleton bug was (git log, the commit `22a123a01` and its neighbours, any test or
ticket); (c) why the effect runs 8 times during a drag; (d) the minimal correct fix (compare the right snapshot,
re-transform only changed vertices, plus the cause of the repeated runs if it is separate), its layers and its
regression risks (singleton vertices, nodes not refreshing after an M1 slot edit, edges, containers R-GV-*). Measure
the expected saving by ablation with the probe.

Phase 2 (after the chat's GO): LIR first, tests red first executing the code, mutation bench, gates, probe acceptance
(drag ≤ 2.3 s dev median and name reads per drag ≤ 2,100 on the fixture; click, open, viewpoint switch not worse),
one `fix(editor-v2):` commit, closure.

## DOVE

Phase 1 writes only `docs/discovery/discovery_2026-10-21_jjomsync_incremental.md` (objective, files read with full
paths, findings with numbers, dependencies and risks, open questions, the proposed fix with its files) and, if
needed, opt-in steps in `frontend/scripts/probe/large-model-click-profile.ts` (`chore(probe):` commit apart from the
`docs:` commit, the P13 hook refuses them together). Phase 2 files are named by the report and confirmed in the GO.

## COME

1. Baseline `npm run typecheck` (0, RC-48) through `node scripts/run-quiet.mjs` from `frontend/`.
2. Phase 1 as above; ablations are temporary and reverted, never committed. Fixture:
   `~/jjodel-papers/2026-sosym-harness-models/jjodel/jjodel.harness.project.jjodel`.
3. Commit the report (and the probe, if changed), then hard stop. `Outcome: hard-stop`.

## Rollback

`pre-jjomsync-incremental-2026-10-21` on the trunk before this prompt; `lane-run merge` tags again before the merge;
undo with `git revert -m 1 <merge sha>`.

## RIFERIMENTI

`docs/discovery/discovery_2026-10-20_large_model_slowness_round2.md`; CLAUDE.md §3.1, §3.2; R-GV-1..18 in
`docs/decisions.md` (containers on the canvas).
