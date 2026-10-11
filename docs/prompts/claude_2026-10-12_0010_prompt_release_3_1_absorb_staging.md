# Prompt: release 3.1, L1, absorb origin/staging into the release line

Prompt-ID: P-2026-10-12-0010
Chat: C-2026-10-11-1812
Front: release-3-2
Lane: full (critical zone: VersionFixer and the 2.230 migration; merge of 110 commits)
Depends: P-2026-10-11-1812
Request: none (Alfonso, 2026-10-12 00:06, "ok alle raccomandazioni, procedi in lane auto"; D1 of the 1812 report)
Status: da eseguire

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply.

Worktree: `~/jjodel-w-rel31-staging`, branch `rel31-staging`, created by the chat from `alfonso-frontend-jjtl` at the docs commit that added this prompt, with `frontend/node_modules` symlinked to `/Users/alfonso/jjodel/frontend/node_modules` (P14). Before anything else: `pwd`, branch and `git log -1` match; otherwise stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-12-0010 · session <id>]` and ends with an `Outcome:` line (P16). Gates run in the foreground.

Critical-zone go-ahead: given by Alfonso for this lane (RC-30, `--critical-zone-goahead P-2026-10-12-0010`). The Layer Impact Report is still the first artefact.

## COSA

Read first: `docs/discovery/discovery_2026-10-11_release_3_1_scope.md` §0, §3.5, §8.3 (L1). Do not redo that analysis.

Goal: the 3.1 line opens projects saved by beta (format 2.230) and by app (2.229) and 3.0.0 (2.228). Means: bring `origin/staging` (tip `cb5952876` at the time of writing; `git fetch origin` first and use the tip you see, recording its sha) into this branch with `git merge --no-ff origin/staging`.

1. **LIR.** Before merging, write `docs/discovery/discovery_2026-10-12_rel31_staging_lir.md`: the critical-zone files the merge changes (`git diff --stat HEAD origin/staging` intersected with CLAUDE.md §3), for each the layer, what staging changes, the risk and how it is verified. Commit it.
2. **Merge.** Resolve the three text conflicts: `frontend/src/components/Jodie/Jodie.tsx` and `frontend/src/constants/defaultPrompts.ts` keep both sides' behaviour (#168 on staging and the trunk's Jodie work, including the reserved-names gate); `docs/decisions.md` is a union, rows of both sides kept in order. Re-read `frontend/src/jjscript/parser/parser.ts` (#175 vs the trunk do-block fixes), `events/registry.ts` and `AISettingsContent.scss` even though they merge clean, and say in the report that both behaviours survive. No other edit rides on the merge commit.
3. **The reservation.** The comment at `VersionFixer.tsx` near line 1193 reserves «the first free number after 2.229» for the R-IRN-19 purge. After the merge that number is 2.231. Do not edit code for it: record it as a ticket line in the report and in the log inbox.
4. **Gates** in this tree: typecheck (baseline 14; any new error from staging code is reported by file, not fixed unless it is a merge artefact), vitest (report counts against 8692 and the 9 known import reds; new reds from staging are listed with cause), build, `npm run smoke` on a dev server of this tree on port 3141 (`SMOKE_URL`), `npm run check:docs`, `check:codegen-lazy`.
5. **Probe.** Open in the browser, on this tree's dev server, one 2.230 save and one 2.229 save. For 2.229 use `scene_2_DemoPetri.jjodel` from the repo. For 2.230: produce it by loading the 2.229 fixture on this build and exporting, or take a 2.230 fixture added by staging if one exists. Record version read, load error or none, and one screenshot crop each under the lane folder. A load error on either is a stop with `Outcome: question`.

Report: `docs/discovery/discovery_2026-10-12_rel31_staging_merge.md` with the staging sha merged, conflicts and how each was resolved, the gate table, the probe results, «Decisions taken (unattended)» and «Decisions awaiting Alfonso». Log entry in `docs/log-inbox/release-3-1.md` (P9). Commit, then stop with `Outcome: hard-stop`. The chat merges `rel31-staging` into the trunk.

## NON FARE

No push. No merge into `alfonso-frontend-jjtl` or `staging`. No tag. No changes beyond the merge resolution, the reports and the log inbox. Do not touch `useAutoAnchor.ts`, `src/codegen/`, `AdvancedSettings.tsx`, `package.json`, `AboutDialog.tsx`, `CHANGELOG.md` (other lanes). Do not absorb PR #184 (`staging-dam-merged`): it is held until 3.1.0 is tagged.

## RIFERIMENTI

CLAUDE.md §3, §17; docs/PROTOCOL.md P4, P9, P13, P14, P16; RC-14, RC-30; the 1812 report.
