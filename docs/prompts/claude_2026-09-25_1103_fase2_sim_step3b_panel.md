# Prompt P-2026-09-25-1103, Phase 2: simulation step 3b, the panel and the run-state on the Petri core

Prompt-ID: P-2026-09-25-1103 (Phase 2 of `claude_2026-09-25_1103_prompt_sim_step3b_discovery.md`)
Chat: C-2026-09-25-1030
Lane: full (a changed exported interface; more than 3 files)
Status: eseguito 2026-09-25 · lane sim-step3b · 11de5af03 · verifica visiva passata 2026-09-25
Worktree: `~/jjodel-sim`, branch `simulation-engine`, HEAD `7a93968c5` or later (the ratification commit on top of the report commit `b9fd3a1f7`).
Report this phase answers: `docs/discovery/discovery_2026-09-25_sim_step3b_panel.md` (`b9fd3a1f7`).
Protocollo: docs/PROTOCOL.md, clausole P1..P15 applicabili.
Every message opens with `[P-2026-09-25-1103 · session <id>]`.

Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-sim` on `simulation-engine`, stop and say so. Do not touch `~/jjodel`, `~/jjodel-release` (the open-path merge `P-2026-09-25-1115` may run there, and 3001 serves it), `~/jjodel-open`, `~/jjodel-gate`, `~/jjodel-harness`. The untracked `frontend/scripts/smoke/_tmp_sim1_verify.ts` is Alfonso's: leave it.

## Decisions

The report holds. Alfonso ratified the sixteen answers of its §1 as recommended, with two precisions, written as **R-SIM-34..37** in `docs/decisions.md` (`7a93968c5`, section «Ratifiche 2026-09-25: passo 3b, pannello e run-state»). Read it before any code. What binds this phase:

1. Interruption and signature (R-SIM-34), questions 1 and 2 of the report, as recommended.
2. Choice among candidates (R-SIM-35), question 3: a list after the input click; no random policy.
3. Store and version (R-SIM-36), questions 4 and 5, as recommended, plus **precision A**: the panel's status, halt line, candidate list and «Last step» line update on the panel's own React state after every commit, discard, quiescence and refused selector included; they never depend on `getSimVersion`/`useSimVersion`, which stay the canvas contract of the `'mark'` channel. One test pins it: a discard leaves the version unchanged and changes the «Last step» line (mutation: drive the line from the version).
4. Bridge, overlaps, M2 face, defects line, «Last step», keys (R-SIM-37), questions 6 and 8 to 13, as recommended. The R-SIM-32 keys become definitive with your code commit, unchanged.
5. **Precision B, question 7**: delete the five old types (`SimConfiguration`, `StcRoles`, `StcDescriptor`, `StepLabel`, `SimRunStatus`); leave `SimModelView` exactly as it is, **with no `TODO` marker** in the code. Its slimming, and the rename of `stcFromRoles.ts` (question 8), are tickets: write both as a Ticket paragraph in your log entry.
6. Commits (question 14): two code commits, types authorized as proposed in report §11.3: `feat(sim): panel and run-state on the Petri core (P-2026-09-25-1103)`, then `refactor(sim): delete the old boolean step (P-2026-09-25-1103)`. Each commit green on its own (typecheck 14, vitest, build).
7. Files (question 16): the 15 files of report §11.1 are authorized (rule 19 exception), with the not-touched list of §11.1 byte-identical at the end. `netCompile.test.ts` and `netStep.test.ts` stay untouched (precision B keeps the count at 15).
8. Interfaces (rule 11): every change listed in report §11.2 is authorized. Nothing else exported changes.
9. Visual check port (question 15): **3002**, from this worktree, as in steps 1 and 3 (own `cacheDir` in the scratchpad, so `~/jjodel/frontend/node_modules/.vite` is not rewritten). 3001 stays on the trunk.
10. Layer Impact Report: report §12 is the definitive one; restate it in chat, unchanged or with any correction the code forces, before the first edit of `simRunState.ts`.

## COSA

Implement report §11: the bridge (`sim/simBridge.ts`), the run-state (`SimRun`, `simReset(modelId, run)`, `simCommit`, `getSimRun`, `isSimActive` as tokens > 0, the bump rules), the panel (five statuses, halt line by `HaltReason` kind, inputs disabled in `Terminated`, `Deadlock`, `Halted`, candidate list, interruption line, defects line, «Last step» line, the M2 face in four groups with the number input), the role specs per shape with `missingEngineRoles` per shape and the new parity of §8.2, the overlap sorts and refusal of §8.3, `eventAlphabet` moved into `netCompile.ts`; then the deletion of the old step with the test moves of §9.2 and §9.3 and the parity oracle of §9.4.

## DOVE

The 15 files of report §11.1 (10 modified, 2 deleted, 3 new). Nothing else. `ObjectNode.tsx` and `viewpoint/ir/*` need no diff: if the code says otherwise, stop.

## COME

1. Re-read the real files before writing (the report is evidence, not reference), and the section R-SIM-34..37.
2. Before creating each exported name, confirm it is free with `command grep -rnw <name> src scripts` from `frontend/`, with a positive control.
3. Commit 1 (`feat(sim)`): report §11.3 item 1. Commit 2 (`refactor(sim)`): §11.3 item 2. Pathspec after `--` for each, only its files, `Model:` trailer, the mutation table in the body of the commit whose tests it covers.
4. Tests and mutation bench: every row of report §11.4 plus the row of precision A. One mutation at a time, sources restored and checked by hash after each run. A mutation that stays green is a stop: say which and wait.
5. Gates after each code commit, from `frontend/`: `npm run typecheck` (14, the §17 set), `npx vitest run` (state the expected total before running; the same 9 files red at import), `npm run build` (exit 0), `npm run check:docs`, `npm run check:scripts` (1 hit, `_tmp_sim1_verify.ts:186`, not a stop).
6. **Visual check, hard stop.** Start the dev server of this worktree on 3002 and hand Alfonso the checks of report §11.5, items 1 to 6, as numbered steps with what he must see, light and dark. Item 7 (the P8 smoke states from a scratchpad copy pointed at 3002) you run yourself and report. Wait for his answer. On a failure: report, propose the fix as an edit before the closure (P13), wait.
7. Closure after Alfonso's OK (P13, one docs commit): this file's Status flipped to `Status: eseguito 2026-09-25 · lane sim-step3b · <last code sha> · verifica visiva passata 2026-09-25`; the entry in `docs/log-inbox/simulation.md` by the rules of the active log, with the two tickets of precision B; subject `docs: close simulation step 3b (P-2026-09-25-1103)`. Stop the 3002 server. `git status` empty.
8. Report in chat, opening with `[P-2026-09-25-1103 · session <id>]`: commits, tests and mutation table, gates, visual result, every deviation from the report, and what the merge of `simulation-engine` into the trunk must know. Then stop. Do not start 3c, and do not merge.

Stop and ask, before acting, if: a file outside the 15 needs a change; the typecheck count moves; an exported interface outside report §11.2 must change; a parity trace differs from the golden traces of §9.4.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, commits outside `simulation-engine`, merge, push.

## RIFERIMENTI

- `docs/discovery/discovery_2026-09-25_sim_step3b_panel.md` §1, §4..§12.
- `docs/decisions.md` R-SIM-7..37, R-MK-4, R-MK-6, R-MK-7.
- `docs/discovery/discovery_2026-09-25_sim_step3_petri_core.md`; the 3a entry in `docs/log-inbox/simulation.md`.
- `CLAUDE.md` §3.2, §17; `docs/PROTOCOL.md` P8, P11, P12, P13, P14.
