# log-inbox — lane «versionfixer»

Entries written by the versionfixer lane while sessions share this tree (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-09-25 — fix(redux): a project that cannot be opened shows an error screen (P-2026-09-25-0030)
**Prompt**: `claude_2026-09-25_0030_prompt_project_open_path.md`, two-phase, from the first Ticket of P-2026-09-24-1610. Phase 1 report `d6918f467`. GO with Q1-Q7 ruled (error in the loading screen, no toast; stay on it; not-found included; in-page data-loss fix included), then two stops ruled in chat: the drain and P5 ×5 (P5 failed as ACKed), the re-render event and the save guard. Closing GO: entry in this inbox, visual check passed.
**Files touched**: code `0609e9793`: `frontend/src/redux/reducer/reducer.ts`, `frontend/src/components/topbar/SaveManager.ts`, `frontend/src/api/persistance/projects.ts`, `frontend/src/pages/Project.tsx`, `frontend/src/components/LoadingScreen/ProjectLoadingScreen.tsx`, `frontend/src/events/registry.ts`, `frontend/src/components/topbar/__tests__/saveManager_load.test.ts` (new). Docs, this commit: addendum A1-A5 to `docs/discovery/discovery_2026-09-25_project_open_path.md`, this entry, two tickets. The prompt's Status line is left to `/status-flip`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `0609e9793`: `npm run typecheck` exit 2, 14 errors, the baseline set; `npx vitest run` 4452 passed (4449 + 3), the same 9 files red at import; `npm run build` exit 0 (chunk size, pre-existing `bordr`); `check:docs`, `check:agents`, `check:scripts` green. T2, T3 red before the fix. P5 ×5 per entry point: deep link and list equal to the old store modulo timestamp. 12 mutants, 12 killed (commit body).
**Out-of-scope changes**: yes — 7 code files, over the Rule 19 threshold, declared per RC-11: the five of report §8 plus `frontend/src/events/registry.ts` (`PROJECT_OPEN_CHANGED`) and the save guard in `projects.ts`, both ruled in chat; the drain and the `openRun` counter are beyond §8 as well, ruled.
**Layer Impact Report**: produced
**Smoke visivo**: passato (verifica visiva di Alfonso su 3003: R3A per deep link e per hash in-page, un progetto sano, not-found)
**Notes**: Beyond report §8, each held by a mutant (code commit body): a drain (COMMIT + one macrotask) before the now-synchronous LOAD keeps init before LOAD; PROJECT_OPEN_CHANGED re-renders the page; a save guard. Read, not measured: the drain's order assumes no 4 ms nesting clamp on the init timer alone. Literal P4b (failed A, healthy B) cannot kill M9; the rewritten one does. Residual, harmless: a superseded open's LOAD lands while the newer one loads. Mid-lane stops: (c). Detail: addendum A1-A5.
**Prompt document name**: 2026-09-25 00:30

## 2026-09-25 — ticket: an in-page hash change between two projects starts no open
**Ticket**: In an open tab, changing the hash from one project to another (`#/project?id=A` → `#/project?id=B`: address bar, history between two projects) starts no open: `PathChecker` calls `U.resetState` on pathname changes only (`PathChecker.tsx:7-14`), and both are `/project`. The store keeps A (or A's open completes) under B's URL; `LProject.getProject()` reads B from the URL, finds nothing, and `Project.tsx` throws on `project.type`, caught by `Try` with cascading page errors (measured on 3003, P4b first form). Pre-existing, not changed by P-2026-09-25-0030.
**Priority**: high
**Found in**: P-2026-09-25-0030
**Detail**: docs/discovery/discovery_2026-09-25_project_open_path.md (addendum A4)

## 2026-09-25 — ticket: pointedBy entries grow with each in-page reopen and save
**Ticket**: On an in-page open (history, hash edit) the reset's `[emptyLOAD + init]` batch applies to the empty state and leaves pending `pointedBy` paths, resolved at the next dispatch onto the loaded project: one more `{"source":"classs"}` on each primitive (two more on `Pointer_EOBJECT`) per in-page reopen + save, saved with the project. Deep link and list do not. Down from the old code, which also duplicated `classs` and the project's `viewpoints` each cycle; those are gone since `0609e9793`.
**Priority**: medium
**Found in**: P-2026-09-25-0030
**Detail**: docs/discovery/discovery_2026-09-25_project_open_path.md (addendum A5, the table)
