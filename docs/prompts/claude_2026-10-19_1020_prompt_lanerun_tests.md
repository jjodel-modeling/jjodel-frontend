# lane-run tests red at import of the decisions register, and the closure of the menubar-disc merge

Prompt-ID: P-2026-10-19-1020
Chat: C-2026-10-18-2225
Front: harness
Lane: fast (three test files of lane-run and, if the cause is there, lane-run itself; then a docs-only closure; no critical zone)
Status: eseguito 2026-10-19 · lane lanerun-tests · 1af036abe
Depends: P-2026-10-19-0150
Corregge: —
Request: Alfonso, 2026-10-19 morning, in chat C-2026-10-18-2225: «procedi» on the recommendation «a small lane on the 25 red lane-run tests, then close the merge».

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 does not apply (fast lane: the measurement below is the discovery, at most ten lines in the entry). P8 does not apply (no UI).

Worktree: `~/jjodel-w-lanerunfix`, branch `lanerun-tests`, created by the chat from the local `alfonso-frontend-jjtl` at the docs commit that added this prompt, `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch, `git log -1`, `git status` match; otherwise `Outcome: blocked`.

Model and tier: as `lane-run start` assigns.

## Lane discipline
Every reply opens with `[P-2026-10-19-1020 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; questions carry `Recommended: <one line>`. Unattended (RC-21, RC-25) outside the RC-26 list. Time limit 60 minutes. Tests through `run-quiet.mjs`; read `lane-run.mjs` with Read and `offset`/`limit`, never whole.

## Context (do not redo the analysis)
The direct merge P-2026-10-19-0150 (menubar-disc into the trunk, merge commit `590063d13`) ended `blocked` on one red gate, vitest: 25 failed tests, all in `frontend/scripts/hooks/__tests__/laneRun.test.ts` (9), `laneRunDirect.test.ts` (11) and `laneRunRouting.test.ts` (5). The same 25 were red on the trunk tip **before** the merge (`~/.jjodel-lanes/P-2026-10-19-0150/vitest-before.json` against `vitest-after.json`: identical sets, none new; the incoming branch had 0), so the merge did not cause them. The failure message: `lane-run: the injection (AM-5) failed, the lane is not started: the register …/docs/decisions.md was not read: Unknown file extension ".ts" for …/frontend/scripts/gates/decisions-query.ts`. Node on this Mac is v23.3.0, where type stripping is behind `--experimental-strip-types`; the chat met the same error launching `lane-run start` with plain `node` last night and worked around it by passing the flag. The merge was launched by the chat with plain `node … lane-run.mjs merge …`, so the worker and the vitest it ran may have lacked the flag; but a rerun of the three files this morning with `NODE_OPTIONS='--experimental-strip-types'` still showed about 14 red (log `/tmp/menubar/lanerun-tests.log`), so the flag alone does not explain all of them. Other merges in the last hours (health-disc, P-2026-10-19-0907) closed green: find what differs.

## COSA
1. Measure: run the three files from this worktree with plain node and with the flag, through the quiet runner; list the red tests of each run and their first error line. Compare with the gate run of the merge worker (`gate-vitest-before.log`) and with how the green merge P-2026-10-19-0907 ran its gate.
2. Fix the cause where it lives, with the smallest change: if `lane-run.mjs` loads `gates/decisions-query.ts` in-process (an `import` of a `.ts` file) it must instead do what the other gates already do (`spawnSync(process.execPath, ['--disable-warning=ExperimentalWarning', '--experimental-strip-types', …])`, `lane-run.mjs:1040`), so that it works whatever flags its own node was started with; if the tests start lane-run without the flag while production always has it, fix the tests' spawn instead. Record which, with the evidence.
3. All three files green with plain node and with the flag; the whole `scripts/hooks` suite at its count; `typecheck:scripts` 0; `check:scripts` PASS.
4. Closure of the merge, in the docs commit of this lane: flip `Status:` of `docs/prompts/claude_2026-10-19_0150_prompt_merge_menubar-disc.md` to `eseguito 2026-10-19 · merge 590063d13 · gates green but vitest, whose 25 reds pre-existed on the receiving tip and are fixed by P-2026-10-19-1020`, and add the merge's P9 entry and this lane's P9 entry to `docs/log-inbox/harness.md`.

## DOVE
`frontend/scripts/lane-run.mjs`, `frontend/scripts/hooks/__tests__/laneRun.test.ts`, `laneRunDirect.test.ts`, `laneRunRouting.test.ts`, `docs/prompts/claude_2026-10-19_0150_prompt_merge_menubar-disc.md` (Status line only), `docs/log-inbox/harness.md`, this prompt's Status line. Anything else: stop and ask with a recommendation.

## Commits (P13, RC-17), explicit pathspecs, no push
Code: `fix(lane-run): <cause in a few words> (P-2026-10-19-1020)`. Docs: the two Status flips and the two entries. Trailer `Model:` (P6). Then `Outcome: done` (no visual check).

## NON FARE
No change to the lane board, the menu bar app, other gates or tests outside the three files. No change to node on the machine. No restart of the board on 4700. No push.
