# log-inbox — lane «simulation»

Entries written by the simulation lane on `simulation-engine` (slice 0), moved here verbatim from
the three log-entry commits that were not cherry-picked (`22a593315`, `960de31d8`, `baf7b2b8a`,
reachable from the tag `archive/simulation-engine-2026-09-14`). Whoever closes the batch moves them
into `docs/claude-code-log.md` **verbatim and in this order** (RC-12) and empties this file
(P9, P-2026-09-19-1740 addendum item 2).

---

## 2026-09-24 — feat: simulation step 1, events as M1 instances (P-2026-09-23-1850)
**Prompt**: `P-2026-09-23-1850`, two-phase, on `simulation-engine` in `~/jjodel-sim` after `git merge --ff-only alfonso-frontend-jjtl`. Phase 1 report `4e62f124c` (`docs/discovery/discovery_2026-09-23_sim_step1_events.md`). GO with seven rulings (option (a), ε enablement, no stability requirement, all-or-nothing event role, disjointness at save and run start, placement (i), key names `simEvent`/`simTrigger`/`simEventIdentifier`), rules 11 and 19 approved; two correction rounds (overlap warning without the event role and any-of on a multi-valued trigger; the save verdict judged after the save, as at run start). One code commit, then this docs commit.
**Files touched**: code `e6cb005a4`, 8 files: `model/simulation/types.ts`, `step.ts`, `stcFromRoles.ts`, `isKindOf.ts`, `objectSlots.ts` (new), `__tests__/events.test.ts` (new); `components/editor-v2/sim/SimulationPanel.tsx`, `simulation-panel.scss`. Docs, this commit: this entry, the prompt file (Status).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on the code commit against the Phase 1 baseline (`293e7fec6`): `npm run typecheck` exit 2, **14** errors, the same set; `npx vitest run` **4228 passed, 0 failed** (4185 + 43 new), the same 9 files red at import; `npm run build` exit 0; `check:docs` and `check:agents` green. `step.test.ts` byte-identical (the parity oracle); slice 0 verifiers `after` and `after3` green on the new code.
**Out-of-scope changes**: yes — `objectSlots.ts` (new) was outside the prompt's DOVE and joined it by the report §6 and the GO; 8 code files, above the P6 five, all declared in the report and approved (rule 19). Nothing else.
**Layer Impact Report**: not-required
**Smoke visivo**: passato — the smoke states through a gitignored copy pointed at 3002 (`states.ts` hardcodes 3000, which serves `~/jjodel`); turnstile e2e green; Alfonso's visual check passed 2026-09-24 on 3002 (3001 serves `~/jjodel-release`).
**Notes**: Known limits. The token split on a nondeterministic event is provisional until step 3 interleaving (R-SIM-7), pinned by two `provisional:` tests. A trigger edited mid-run is read at the next step until the R-SIM-13 interruption lands. Mutation bench: 39 of 39 killed, listed in the body of `e6cb005a4`. Probes: after HMR, a dynamic import of `simRunState.ts` reads a second, empty instance; restart the server before reading the store.
**Prompt document name**: 2026-09-23 18:50
**Ticket** (opened, not fixed here). `CLAUDE.md` §17 states a typecheck baseline of 33 errors; the count measured on this branch and on the trunk is 14 (the 19 casing errors are gone). The figure needs updating in a lane that holds `CLAUDE.md` (P15).
**Ticket** (opened, not fixed here). The run controls stay hidden until the Terminal role is set (`rolesComplete` over `ENGINE_ROLE_KEYS`, `SimulationPanel.tsx`), so a statechart without a final state needs a terminal metaclass with no instance to run; the turnstile of the visual check used one (`TFinal`).
