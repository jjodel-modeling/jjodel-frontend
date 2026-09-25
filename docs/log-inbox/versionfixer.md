# log-inbox — lane «versionfixer»

Entries written by the versionfixer lane while sessions share this tree (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---


## 2026-09-25 — fix(project): a change of project id in the URL opens that project (P-2026-09-25-1440)
**Prompt**: `claude_2026-09-25_1440_prompt_hash_change_open_discovery.md`, two-phase, from the high ticket of P-2026-09-25-0030. Phase 1 report `dc383a8b8` (`docs/discovery/discovery_2026-09-25_hash_change_open.md`). GO Phase 2, `Lane: full (more than 3 files)`, Q1-Q6 ratified as recommended, plus one addition: pin that after the race "A slower than B" a save never writes A's content into B's record. Closing ACK: visual check passed, the save rule read as the invariant below.
**Files touched**: code `5c47e40ec`: `frontend/src/components/pathChecker/PathChecker.tsx`, `frontend/src/components/pathChecker/openKey.ts` (new), `frontend/src/components/pathChecker/__tests__/openKey.test.ts` (new), `frontend/src/pages/Project.tsx`, `frontend/src/redux/reducer/reducer.ts`. Docs: the report `dc383a8b8`; this commit: this entry, the Status line of the prompt file.
**Outcome**: ✅ completed
**Corregge**: 2026-09-25 00:30 (`claude_2026-09-25_0030_prompt_project_open_path.md`: its `openRun` counter guards the loading flag, not the LOAD; addendum A4 called a superseded LOAD harmless after measuring only the order where the newer open is slower)
**Causa**: (c)
**Regressions**: no. On `5c47e40ec`: `npm run typecheck` exit 2, 14 errors, the baseline set; `npx vitest run` 4625 passed (4620 + 5, stated before the run), the same 9 files red at import; `npm run build` exit 0; `check:docs` 4/4; `check:scripts` pass. Probes P1-P7 on 3003, controls included (list, in-page, A4 form, dashboard filter). Mutation bench 8 of 8 killed, table in the commit body.
**Out-of-scope changes**: no — the five files of the report's candidate, named by the GO; Rule 19 not triggered.
**Layer Impact Report**: produced
**Smoke visivo**: passato (Alfonso su 3003: apertura sana dalla dashboard, hash da A a B, back/forward, race con A lento: B resta dopo 5 s e il save scrive solo B)
**Notes**: M4-M8 are held by probes on 3003, not vitest: the bench is node, without DOM or router, and stateInitializer and Project.tsx do not import there (window, joiner barrel). Save invariant: A's content never reaches B's record; M4 leaves the save writing nothing (A in the store under B's URL), M8 puts A's id in B's saved blob. Residual (Q5): a hash change before PathChecker mounts at page load is not seen. Correction to Phase 1: open-hash was created in this lane at 14:42:02 (reflog), not found.
**Prompt document name**: 2026-09-25 14:40
**Ticket** (priority high, opened here, a lane of its own). After `R.navigate` whose reload the user cancels with "Stay on page" (unsaved changes; the prompt is enabled by `ProjectEditor.tsx:409`), `U.navigating` stays `true` (`U.tsx:138`) and `reducer.ts:611` drops every action for the rest of the tab's life: edits are silently lost, and under the new URL the project cannot be saved. Measured on 3003 (report §2 (f), F5). With this fix the open of the new id starts but its LOAD is dropped: loading screen forever (report §5, risk 2).
**Ticket** (cited, not a new slot: the medium ticket `pointedBy entries grow with each in-page reopen and save`, found in P-2026-09-25-0030, stays open and medium). Measured here: the growth needs an in-page open from the dashboard's state (12 pending `pointedBy` paths); a change of project id adds none (3/3, 0 pending); a synchronous empty LOAD in `U.resetState` removes it (report §3.4; Q3: a lane of its own).
