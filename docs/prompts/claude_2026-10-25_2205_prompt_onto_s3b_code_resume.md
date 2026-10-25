# Ontological instantiation, S3b Phase 2, lane A (continuation): finish ghost and orphan rows from the left-over diff

Prompt-ID: P-2026-10-25-2205
Chat: C-2026-10-25-2159
Front: instance-of
Lane: full (viewpoint/ir/ is in the critical-zone table of CLAUDE.md 3.1; Layer Impact Report in the discovery)
Status: eseguito
Request: none (Alfonso: «decidi tu», /lane auto, 2026-10-25 22:01)
Depends: P-2026-10-21-1910
Corregge: P-2026-10-21-1955 (stopped at step 3 on a usage limit, 2026-10-21 20:33, nothing committed)
Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-oi-s3b`, branch `oi-s3b`. Its tip is this prompt's `docs:` commit, whose parent is `d6fa8ba7f`.
The tree is **not clean on purpose**: it holds the uncommitted work of P-2026-10-21-1955 in exactly these six files,
about 430 lines (`git diff --stat`): `instantiate.ts`, `__tests__/instantiate.test.ts`, `IRNodeContent.tsx`, `IRRow.tsx`,
`irStyle.ts`, `scripts/probe/uml-class-object-fixture.ts`. Check `pwd`, the branch, `git log -2` and that
`git status --short` lists those six files and nothing else; otherwise stop with `Outcome: blocked`. Model and tier:
heavy, effort `xhigh`.

## Lane discipline

Every reply opens with `[P-2026-10-25-2205 · session <id>]`; final line `Outcome: done | hard-stop | question |
blocked`. Every question carries `Recommended: <one line>`. Time limit 75 minutes.

- **No subagent, no task in background.** Gates in the foreground (P16), through `node scripts/run-quiet.mjs`.
- **Commit the code as soon as typecheck and the unit tests are green**, before the bench.
- **One test run per tool call.** One probe run per call, with the load average beside it.
- **Context economy**: read the discovery by windows (Q2, Q3, Q4, Layer Impact Report, Phase 2 plan, oracle); read the
  left-over diff file by file with `git diff -- <file>`, never the whole diff at once; grep, never read `EditorV2.tsx`,
  `IRNodeContent.tsx`, `instantiate.ts` or `LModelElement.tsx` whole; short tool output.
- No push, no merge. Do not touch `Status`. No CLAUDE.md 3.2 file, no `reducer.ts`, no `nodeSizing.ts`, no
  `jjomTransformers.ts`; if one becomes necessary, stop with `Outcome: question`.

## Decisions

All decisions of P-2026-10-21-1955 stand unchanged (read its section «Decisions» in
`~/jjodel-release/docs/prompts/claude_2026-10-21_1955_prompt_onto_s3b_code.md`, the trunk worktree; read only): the discovery's
D1..D9; not option (d), «a manual resize wins» stays, the UML instance view authors no `defaultSize` (R-OI-16);
unparsable text is written as a String value; editing real slot rows is a later slice.

**The left-over diff is the base, not a draft to redo.** It is unreviewed: review it against the discovery's plan
before building on it. Keep what matches the plan; fix what does not; never discard it wholesale.

## COSA

1. First reply: the Layer Impact Report of the discovery, amended for decision 2 (as P-2026-10-21-1955 step 1), then a
   short review table of the left-over diff: per file, which plan items (lane A, items 1-5 and unit tests 1-8) are
   done, partial or missing, and any departure from the plan. The last edit in flight was the extraction of
   `valueOfText(get, view, binding, modelId, feature, raw)` out of `plannedValue` in `instantiate.ts` (shared by the
   default value and the text typed into a ghost row); it was refused by the permission layer, so it is not in the tree.
2. Complete lane A, items 1-5, and unit tests 1-8, inside the six files.
3. Fixture (decision 2) is already edited in the diff; verify it matches P-2026-10-21-1955 step 3. Before committing, one
   run of `onto-s2-instantiate.ts` and one of `onto-s3a-slot-problems.ts`. The previous lane saw S2 pass 21/21 and the
   S3a probe abort on `page.goto` timeout (300 s) under load, not on an assertion: if it times out again, retry once
   with the load average below 10; if a check fails only because it asserts a manual box that decision 2 removes, stop
   with `Outcome: question`, the check name and its assertion; do not edit either probe.
4. Gates: typecheck 0; `instantiate.test.ts` and the IR render tests green; `npm run build` 0. Commit the code, paths
   named: `feat(onto): S3b ghost and orphan rows (P-2026-10-25-2205, continues P-2026-10-21-1955)`.
5. Mutation bench M1, M2, M3 of the discovery's oracle on the unit tests, one mutant per call, each red, each reverted
   (`git status` clean after). Counts, failing test names and load average to `~/.jjodel-lanes/P-2026-10-25-2205/bench.txt`
   (not committed; the probe lane copies them into the log entry).

## DOVE

`frontend/src/components/editor-v2/hooks/instantiate.ts`, `frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx`,
`frontend/src/components/editor-v2/viewpoint/ir/IRRow.tsx`, `frontend/src/components/editor-v2/viewpoint/ir/irStyle.ts`,
`frontend/src/components/editor-v2/hooks/__tests__/instantiate.test.ts`, `frontend/scripts/probe/uml-class-object-fixture.ts`.
Nothing else.

## HARD STOP

After step 5, with `Outcome: done` and a clean tree. Earlier with `Outcome: question` at step 3 as stated, or if a gate
cannot go green inside the six files.

## RIFERIMENTI

`docs/discovery/discovery_2026-10-21_onto_s3b_ghost_rows.md`; `docs/discovery/discovery_2026-10-21_onto_s3a_slot_problems.md`;
`~/jjodel-release/docs/prompts/claude_2026-10-21_1955_prompt_onto_s3b_code.md`; `docs/log-inbox/instance-of.md`.
