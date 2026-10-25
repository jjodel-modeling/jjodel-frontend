# Ontological instantiation, S3b Phase 2, lane B: re-export, acceptance probe, regression, assets, closing entry

Prompt-ID: P-2026-10-25-2220
Chat: C-2026-10-25-2159
Front: instance-of
Lane: full (viewpoint/ir/ is in the critical-zone table of CLAUDE.md 3.1; Layer Impact Report in the discovery)
Status: da eseguire
Request: none (Alfonso: «decidi tu», /lane auto, 2026-10-25 22:01)
Depends: P-2026-10-25-2205
Corregge: P-2026-10-21-1956 (never launched; replaced by this prompt)
Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-oi-s3b`, branch `oi-s3b`, its tip this prompt's `docs:` commit, whose parent is `f454b12b7`
(`feat(onto): S3b ghost and orphan rows`). Check `pwd`, the branch, `git log -3` and a clean `git status`; otherwise
stop with `Outcome: blocked`. Model and tier: heavy, effort `xhigh`.

Note: a dev server for Alfonso runs on port 3005 from this worktree. Do not use, stop or restart it; pick probe ports
outside 3000, 3001, 3005 and 3015.

## Lane discipline

Every reply opens with `[P-2026-10-25-2220 · session <id>]`; final line `Outcome: done | hard-stop | question |
blocked`. Every question carries `Recommended: <one line>`. Time limit 90 minutes.

- **No subagent, no task in background.** Dev server and probes in the foreground (P16).
- **Commit each step as soon as its gate is green.** Commit subjects at most 72 characters (the hook refuses longer);
  the `Model:` trailer the hook requires.
- **One probe run per tool call.** Record the load average (`uptime`) beside every probe result.
- **Context economy**: read the discovery's oracle section and `onto-s3a-slot-problems.ts` only in windows (import,
  bindings, S3-1, S3-2); never read `EditorV2.tsx`, `IRNodeContent.tsx` or `instantiate.ts` whole; short tool output;
  never a whole diff. Probe output: the check lines only.
- No push, no merge. No product code: a probe failure that needs a product fix stops the lane with `Outcome: question`
  and the evidence. No edit to `onto-s2-instantiate.ts`, `onto-s3a-slot-problems.ts` or `undo-inline-edit.ts`.

## Why a re-export first

Lane A found that the S2 and S3a probes import `~/jjodel-demo-exports/uml/uml-class-object.jjodel`, exported on
2026-10-21 00:20, before decision 2 (R-OI-16: the UML instance view authors no `defaultSize`, an instance box hugs its
rows). With that file S2 still measures a 280×138 manual box, so decision 2 was never exercised. The old export is
left untouched; this lane writes a fresh one beside it and points every probe at it.

## COSA

0. Re-export: run `uml-class-object-fixture.ts` once through `lane-run probe` with
   `GV_SAVE=~/jjodel-demo-exports/uml-s3b`, all its checks green (load average beside). Record the instance nodes'
   box sizes from the new file: no InstanceSpecification carries a manual box. Nothing to commit for this step.
1. The probe `frontend/scripts/probe/onto-s3b-ghost-rows.ts` (new), checks S3b-0..S3b-5 of the discovery's oracle,
   importing the new export (`UML_FILE=~/jjodel-demo-exports/uml-s3b/uml-class-object.jjodel`, defaulting to that path).
   S3b-1 records the ghost row's DOM box against the node's box and must find it inside, with no clipping. M4 on it (the
   `orphan` prop not passed to `IRRow`, S3b-4 red, reverted, `git status` clean after). `chore(probe)` commit.
2. Regression, each with the new export through `UML_FILE`: `onto-s2-instantiate.ts` 21/21 and
   `onto-s3a-slot-problems.ts` 8/8 (files unchanged; probe assets to `ONTO_OUT=/tmp/...`, never into the repo);
   `undo-inline-edit.ts` 33/33. If an S2 check fails only because it asserted the old manual box size, record it as a
   finding with the measured size and continue; do not edit the probe.
3. Assets in `docs/discovery/assets/onto-s3b/`: dune's node with the `pages =` ghost row; the same node while typing
   300; `pages = 300` after Enter; the orphan isbn row with its marker and tooltip. Element crops, light theme.
4. Closing entry in `docs/log-inbox/instance-of.md` covering P-2026-10-21-1955, P-2026-10-25-2205 and this lane: shas,
   gates, probe results with load average, bench counts from `~/.jjodel-lanes/P-2026-10-25-2205/bench.txt` plus M4,
   decision 2 and its measured effect on instance sizing, the new export path, defects found as proposed tickets.
   In the same commit flip `Status:` of `docs/prompts/claude_2026-10-25_2205_prompt_onto_s3b_code_resume.md` to
   `eseguito`. One `docs:` commit with the assets.
5. Delete any gitignored throwaway this lane or the previous ones created (not the dev server's files, not
   `~/jjodel-demo-exports/`).

## DOVE

`frontend/scripts/probe/onto-s3b-ghost-rows.ts`, `docs/discovery/assets/onto-s3b/`, `docs/log-inbox/instance-of.md`,
the `Status:` line of `docs/prompts/claude_2026-10-25_2205_prompt_onto_s3b_code_resume.md`. Outside the repo:
`~/jjodel-demo-exports/uml-s3b/`. Nothing else.

## HARD STOP

After the docs commit, with `Outcome: done` and a clean tree.

## RIFERIMENTI

`docs/discovery/discovery_2026-10-21_onto_s3b_ghost_rows.md` (oracle); `frontend/scripts/probe/uml-class-object-fixture.ts`
(header: run line with `GV_SAVE`); `frontend/scripts/probe/onto-s3a-slot-problems.ts`; `docs/log-inbox/instance-of.md`;
`~/jjodel-release/docs/prompts/claude_2026-10-21_1956_prompt_onto_s3b_probe.md` (the prompt this one replaces).
