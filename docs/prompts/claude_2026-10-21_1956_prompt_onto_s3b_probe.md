# Ontological instantiation, S3b Phase 2, lane B: acceptance probe, regression, assets, closing entry

Prompt-ID: P-2026-10-21-1956
Chat: C-2026-10-21-1405
Front: instance-of
Lane: full (viewpoint/ir/ is in the critical-zone table of CLAUDE.md 3.1; Layer Impact Report in the discovery)
Status: da eseguire
Request: none (the chat has no shareable URL; Alfonso's words are kept with --request)
Depends: P-2026-10-21-1955
Corregge: —
Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-oi-s3b`, branch `oi-s3b`, clean, its tip the `feat(onto)` commit of P-2026-10-21-1955. Check
`pwd`, the branch, `git log -2` and a clean `git status`; otherwise stop with `Outcome: blocked`. Model and tier:
heavy, effort `xhigh`.

## Lane discipline

Every reply opens with `[P-2026-10-21-1956 · session <id>]`; final line `Outcome: done | hard-stop | question |
blocked`. Time limit 90 minutes.

- **No subagent, no task in background.** Dev server and probes in the foreground (P16).
- **Commit each step as soon as its gate is green.**
- **One probe run per tool call.** Record the load average (`uptime`) beside every probe result.
- **Context economy**: read the report's oracle section and `onto-s3a-slot-problems.ts` only in windows (import,
  bindings, S3-1, S3-2); never read `EditorV2.tsx`, `IRNodeContent.tsx` or `instantiate.ts` whole; short tool output;
  never a whole diff. Probe output: the check lines only.
- No push, no merge. Do not touch `Status`. No product code: a probe failure that needs a product fix stops the lane
  with `Outcome: question` and the evidence.

## COSA

The plan is `docs/discovery/discovery_2026-10-21_onto_s3b_ghost_rows.md` (oracle), with decision 2 of
P-2026-10-21-1955: no option (d); the UML fixture's instance boxes hug their rows.

1. The probe `frontend/scripts/probe/onto-s3b-ghost-rows.ts` (new), checks S3b-0..S3b-5 of the report's oracle. S3b-1
   records the ghost row's DOM box against the node's box and must find it inside. M4 on it (the `orphan` prop not
   passed to `IRRow`, S3b-4 red, reverted). `chore(probe)` commit.
2. Regression: `undo-inline-edit.ts` 33/33; `onto-s2-instantiate.ts` 21/21 and `onto-s3a-slot-problems.ts` 8/8, both
   files unchanged.
3. Assets in `docs/discovery/assets/onto-s3b/`: dune's node with the `pages =` ghost row; the same node while typing
   300; `pages = 300` after Enter; the orphan isbn row with its marker and tooltip. Element crops.
4. Closing entry in `docs/log-inbox/instance-of.md`: shas, gates, probe results with load average, bench counts from
   `~/.jjodel-lanes/P-2026-10-21-1955/bench.txt` plus M4, decision 2 and its effect on S2 sizing, defects found as
   proposed tickets. One `docs:` commit with the assets.
5. Delete any gitignored throwaway this lane or the previous one created.

## DOVE

`frontend/scripts/probe/onto-s3b-ghost-rows.ts`, `docs/discovery/assets/onto-s3b/`, `docs/log-inbox/instance-of.md`.

## HARD STOP

After the docs commit, with `Outcome: done`.

## RIFERIMENTI

`docs/discovery/discovery_2026-10-21_onto_s3b_ghost_rows.md` (oracle); `frontend/scripts/probe/onto-s3a-slot-problems.ts`;
`docs/log-inbox/instance-of.md`.
