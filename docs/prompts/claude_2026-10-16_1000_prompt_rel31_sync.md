# Prompt: release 3.1, sync the release line with origin trunk and staging, close D-A1

Prompt-ID: P-2026-10-16-1000
Chat: C-2026-10-11-1812
Front: release-3-2
Lane: full (critical zone: VersionFixer and the staging merge; three merges, one data fix, release checklist)
Depends: P-2026-10-12-0115, P-2026-10-15-1710
Request: none (Alfonso, 2026-10-16 09:59, "Ok alle raccomandazioni": rel31-sync lane, D-A1 closed as pre-existing, predicate fix)
Status: eseguito 2026-10-16 · lane rel31-sync · 87b9cbac2 · hard-stop, gates green (typecheck 0, check:docs 5/5), saves 2.228-2.230 load; merged f9dcffe2c and pushed by Alfonso (visual GO pending: DA-3..DA-6)

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply.

Worktree: `~/jjodel-w-rel31-sync`, branch `rel31-sync`, created by the chat from the local `alfonso-frontend-jjtl` at the docs commit that added this prompt, with `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch and `git log -1` match; otherwise stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-16-1000 · session <id>]` and ends with an `Outcome:` line (P16). Gates and probes run in the foreground.

Critical-zone go-ahead: given by Alfonso for this lane (RC-30, `--critical-zone-goahead P-2026-10-16-1000`). The Layer Impact Report is still the first artefact.

## Where things stand (measured by the chat on 2026-10-16 09:40)

- Local trunk carries version 3.1.0 and the release lanes L1 to L5; 37 commits not on origin.
- `origin/alfonso-frontend-jjtl` has 19 commits not in the local trunk (pushed by Juri, last `38f0add16`).
- `origin/staging` (tip `e8fd99c58`) has 40 commits not in the trunk (#172, typecheck baseline zero, R-REF-7); format still 2.230. `git merge-tree` reports four text conflicts: `docs/decisions.md`, `frontend/src/components/Jodie/Jodie.tsx`, `frontend/src/components/Jodie/__tests__/reservedIdentifierGate.test.ts`, `frontend/src/constants/defaultPrompts.ts`.
- Branch `da1-disc` (report `71c07b6fd`, inbox `e45998ecd`) is not merged.
- `npm run check:docs` is red on Check E only: `docs/prompts/claude_2026-10-13_1930_prompt_token_economy_harness.md` (commit `7ad24c38e`) has no `Front:` line.
- PR #184 (`staging-dam-merged`) is open and must not be absorbed.

## COSA

In this order, one commit (or merge commit) per step:

1. **LIR.** `docs/discovery/discovery_2026-10-16_rel31_sync_lir.md`: the critical-zone files touched by steps 2 and 4 (`git diff --stat` of each incoming side intersected with CLAUDE.md §3), layer, change, risk, verification. Commit it.
2. **Origin trunk.** `git fetch origin`, then `git merge --no-ff origin/alfonso-frontend-jjtl`. Record the sha merged. Resolve conflicts keeping both sides; if a conflict is semantic (two incompatible behaviours), stop with `Outcome: question` and describe it.
3. **D-A1.** `git merge --no-ff da1-disc`. Then the fix from its report: in `frontend/scripts/probe/bpmn-lanes-fixture.ts` near line 80, the Lane-with-sub-lanes predicate becomes `not empty $childLaneSet.value.$lanes.values` (the form line 60 uses for pools). Regenerate `gv-bpmn.jjodel` with the script, copy the old `/Users/alfonso/jjodel-demo-exports/graphvertex/gv-bpmn.jjodel` to `gv-bpmn.jjodel.bak-2026-10-16` beside it, then write the new one there (this folder is in this lane's perimeter). Re-run the D-A1 probe (`~/.jjodel-lanes/P-2026-10-15-1710/` scripts): after «Add LaneSet» Sales keeps its three flow nodes, no «In no container» dots, Auto layout keeps them in Sales. Commit as `fix(demo): ...`.
4. **Staging.** `git merge --no-ff origin/staging` (record the sha). Resolve the four conflicts as L1 did (report `docs/discovery/discovery_2026-10-12_rel31_staging_merge.md`): Jodie keeps both behaviours including the trunk's reserved-names gate, its test keeps both sides' cases, `decisions.md` is a union in order. Re-read `VersionFixer.tsx` after the merge: the chain must still end `2.229 -> 2.230` and nothing from PR #184 may appear.
5. **Check E.** Add the missing `Front:` line to `docs/prompts/claude_2026-10-13_1930_prompt_token_economy_harness.md`, using the front that its content belongs to in `docs/harness/fronts.json` (most likely `harness`; say which and why). Header line only. Commit as `docs: ...`.
6. **Gates** on the result: typecheck (staging brought «typecheck baseline zero»: report the count and whether the baseline in CLAUDE.md §17 is now 0 or still 14 here; do not edit CLAUDE.md), vitest (counts, known reds), build without `VITE_CODEGEN`, smoke on a dev server of this tree on port 3161, `check:docs` (must be 5/5), `check:codegen-lazy` both modes, `versionfixer_3_0_0_save.test.ts`.
7. **Probes.** Load a 2.229 save (`scene_2_DemoPetri.jjodel`), the 2.228 fixture (`frontend/src/redux/__tests__/fixtures/save_3_0_0.jjodel`) and a 2.230 save exported from this build: no load error, version read.
8. **RC-23 crops** on the release build (`npm run build`, `npx vite preview` on port 3161, no `VITE_CODEGEN`), saved in `~/.jjodel-lanes/P-2026-10-16-1000/crops/`, one line each in the report, not judged: the same list as P-2026-10-12-0115 §5 (default views, Symbol Editor, Petri classic run with a drag, JjScript, Jodie reserved name, no Experimental group, no Code pill, no Dark option, About v3.1.0), plus D-A1 after the fix (before and after Auto layout), plus a nested instance created by JjScript `create … in` under a graphVertex container and one created from the Data Manager, each saved and reopened. For the Petri crop, also read the run's Marking and the tokens drawn on p1, and say whether they agree.

Report: `docs/discovery/discovery_2026-10-16_rel31_sync.md` with the shas merged, each conflict and its resolution, the gate table, the probe results, the crop list, «Decisions taken (unattended)» and «Decisions awaiting Alfonso». Log entry in `docs/log-inbox/release-3-1-sync.md`. Commit, then stop with `Outcome: hard-stop`. The chat merges `rel31-sync` into the trunk.

## NON FARE

No push, no PR, no tag, no merge into `alfonso-frontend-jjtl` or `staging`. Do not absorb PR #184. Do not edit `CLAUDE.md` (it has uncommitted changes from another chat in the trunk tree). No source edits beyond conflict resolution and the step 3 fixture line. Do not delete anything: the old demo file is kept as `.bak-2026-10-16`.

## RIFERIMENTI

CLAUDE.md §3, §17; PROTOCOL P4, P9, P12, P14, P16; RC-14, RC-23, RC-30; reports `discovery_2026-10-12_rel31_staging_merge.md`, `discovery_2026-10-12_rel31_version.md`, `discovery_2026-10-15_da1_graphvertex_add.md`.
