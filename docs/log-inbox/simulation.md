# log-inbox — lane «simulation»

Entries written by the simulation lane on `simulation-engine` (slice 0), moved here verbatim from
the three log-entry commits that were not cherry-picked (`22a593315`, `960de31d8`, `baf7b2b8a`,
reachable from the tag `archive/simulation-engine-2026-09-14`). Whoever closes the batch moves them
into `docs/claude-code-log.md` **verbatim and in this order** (RC-12) and empties this file
(P9, P-2026-09-19-1740 addendum item 2).

---

## 2026-09-25 — feat: the event class derived from the Trigger reference (P-2026-09-25-1500)
**Prompt**: `claude_2026-09-25_1500_prompt_sim_event_from_trigger.md`, single phase, fast lane, on `sim-event-trigger` in `~/jjodel-events` (worktree made by the project chat at `79175e94c`). R-SIM-38: Trigger alone configures the event role; `simEvent` is derived at every read of the bag and never written. One mid-lane stop (the netParity fixture, authorised), the hard stop of step 7, then a GO with two items: the cleanup marker dropped, the Vite scan error classified as pre-existing (a ticket).
**Files touched**: report `623b330d4`: `docs/discovery/discovery_2026-09-25_sim_event_from_trigger.md` (new). Code `332f8d03c`: `frontend/src/model/simulation/netCompile.ts`, `components/editor-v2/sim/simBridge.ts`, `SimulationPanel.tsx`, `simRoleStatus.ts`; tests `model/simulation/__tests__/netCompile.test.ts`, `netParity.test.ts`, `sim/__tests__/simBridge.test.ts`, `simRoleStatus.test.ts`. Code `470149a51`: `simRoleStatus.ts` (the marker dropped). Docs, this commit: this entry, three tickets, the prompt's Status line.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `332f8d03c`: `npm run typecheck` exit 2, 14 errors, the §17 set (diff with the trunk run empty); `npx vitest run` 4624 passed (4620 − 5 + 2 + 5 + 2, stated before the run), the same 9 files red at import; `npm run build` exit 0, pre-existing warnings only; `check:docs` 4/4. Mutation bench 10/10 killed (commit body). On `470149a51`: typecheck 14, the same set; the 43 sim tests pass.
**Out-of-scope changes**: yes — `frontend/src/model/simulation/__tests__/netParity.test.ts`, not in DOVE: one fixture line (the typed `R_trigger` DReference), no assertion changed, authorised in chat at the stop (RC-11). Nine files over the lane, above the Rule 19 threshold: the eight of DOVE (four code, three tests, the report) plus that one.
**Layer Impact Report**: not-required
**Smoke visivo**: passato — Alfonso on 3004, items (a)-(d) of step 7, plus a Trigger typed to a node/arc class refused as an overlap.
**Notes**: Decisions: withDerivedEventRole in netCompile.ts; simEvent kept in ROLE_SPECS (mapStateToProps copies ROLE_KEYS) and hidden via ROLE_GROUPS; a primitive-typed Trigger (EString is a DClass with isPrimitive) gives no event role; the class name reaches the row as a primitive prop. Mid-lane stop: (c), netParity.test.ts drives startRun and was missed at step 2. The panel does not load under the bench: its edits are covered by the visual check only. Detail: report §8.
**Prompt document name**: 2026-09-25 15:00

## 2026-09-25 — ticket: the Trigger select offers every reference of the metamodel
**Ticket**: The Trigger select of the Events group lists every plain reference of the metamodel, not only those of the arc/transition class. Since R-SIM-38 the Trigger also fixes the event class, so a reference of an unrelated class silently changes the event alphabet (the overlap check only catches node/arc/transition types). Restrict the options to the references of the arc/transition class.
**Priority**: medium
**Found in**: P-2026-09-25-1500

## 2026-09-25 — ticket: eventRoleWarning and roleWriteVerdict are dead since R-SIM-38
**Ticket**: Since `P-2026-09-25-1500`, `eventRoleWarning` (`components/editor-v2/sim/simRoleStatus.ts`) has no caller, and `roleWriteVerdict` (`model/simulation/stcFromRoles.ts`) is called by tests only: `writeRole` derives the event class after the write and calls `overlapVerdict`. Remove both, with their tests, in the SimModelView cleanup lane (the R-SIM-37 ticket).
**Priority**: low
**Found in**: P-2026-09-25-1500

## 2026-09-25 — ticket: the Vite dependency scan fails on every cold start
**Ticket**: Vite dependency scan fails on every cold start: esbuild rejects MTM.tsx:27 importing Nearley from DSL/nearley/nearley.tsx:34 (suggests _Nearley); pre-bundling is skipped, all deps are discovered at runtime and the page reloads once. Pre-existing since 0787639fd, silent on 3001, printed on a fresh worktree. Medium because worktree lanes cold-start by design.
**Priority**: medium
**Found in**: P-2026-09-25-1500
