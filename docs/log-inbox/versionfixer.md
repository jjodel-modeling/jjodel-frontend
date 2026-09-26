# log-inbox — lane «versionfixer»

Entries written by the versionfixer lane while sessions share this tree (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-09-26 — fix(nav): a cancelled reload keeps the tab alive (P-2026-09-25-1905)
**Prompt**: `claude_2026-09-25_1905_fase2_navigate_cancel.md`, Phase 2 of `P-2026-09-25-1905`, `Lane: fast`, from the high ticket of P-2026-09-25-1440 (the frozen reducer after "Stay on page"). Phase 1 report `8d6febf5f` (`docs/discovery/discovery_2026-09-25_navigate_cancel.md`), candidate §8 as it stands; Q1-Q6 ratified in the prompt. The branch was rebased from chat onto `5433451fd` before this phase.
**Files touched**: code `982581260`: `frontend/src/common/navigateReload.ts` (new), `frontend/src/common/__tests__/navigateReload.test.ts` (new), `frontend/src/common/U.tsx` (`R.navigate`: three lines become one `hashReload` call, plus the import). Docs: the report `8d6febf5f`; this commit: this entry, the Status lines of the Phase 1 and Phase 2 prompt files.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. On `982581260`: `npm run typecheck` exit 2, 14 errors, the §17 set (sorted diff with the baseline empty); `npx vitest run` 4772 passed (4767 + 5, stated before the run), the same 9 files red at import; `npm run build` exit 0, 51 warning lines as the baseline; `check:docs` 4/4. Red first: the new test failed at import. Probes on 3003: P1 Stay (logo, project → project) keeps the tab on A with the flag down, a second edit applied and saved; P2 Leave and P3 the LeftBar control as before.
**Out-of-scope changes**: no — the three files of the prompt's DOVE; `git diff --stat` of every other path empty.
**Layer Impact Report**: not-required (not owed: no `CLAUDE.md` §3.2 file touched)
**Smoke visivo**: in attesa di Alfonso su 3003
**Notes**: Chromium-only coverage (Q4): Firefox and Safari read, not measured; without the Navigation API, or without the abort, the behavior is today's. Mutation bench 8/8, table in `982581260`; M6 dies by V4 and by V5's exact call list, not by V4 alone as declared. P5: after a Stay the history holds A twice and one Back stays on A, no reset (ticket below). The temporary symlink `frontend/node_modules` stays until Alfonso's check.
**Prompt document name**: 2026-09-25 19:05

## 2026-09-26 — ticket: confirm first, then reset or log out (user-menu Dashboard, Sign-out)
**Ticket**: Two callers of `R.navigate` act before the unload prompt can be answered. The user menu's Dashboard throws offline at `Navbar.tsx:1999` (`Collaborative.client` undefined) and, online, calls `U.resetState()` before `R.navigate`: since `982581260` a "Stay" there reloads A from storage and the unsaved edit is lost (was: frozen tab). Sign-out asks twice (the in-app confirm, then the browser prompt) and logs out first: since `982581260` a "Stay" leaves a working, logged-out tab whose Cmd+S persists nothing and clears the dirty flag (was: frozen tab). Wanted: confirm first, then reset or log out; the Sign-out paths disable the unload warning after the in-app confirm, as `CloseProject` does at `Navbar.tsx:498`, so the browser prompt cannot be reached from Sign-out. Where the disable lives (`AuthApi.logout` or the three call sites) is this ticket's discovery.
**Priority**: medium
**Found in**: P-2026-09-25-1905
**Detail**: docs/discovery/discovery_2026-09-25_navigate_cancel.md (§3.3, §4 F4 F5)

## 2026-09-26 — ticket: a saved description keeps its old text in the blob's idlookup
**Ticket**: After an edit of the project description and Cmd+S, with no navigation, the saved record's `lastModified` advances and the blob carries the edited text, while `idlookup[A].description` in the blob keeps the old one. Read, not verified: `U.compressedState` writes `state.idlookup[id] = {...dproject, state: ''}` (`U.tsx`) from the caller's `dproject`, which the VER1 note in `projects.ts` describes as detached. A discovery of its own.
**Priority**: low
**Found in**: P-2026-09-25-1905
**Detail**: docs/discovery/discovery_2026-09-25_navigate_cancel.md (§0 the save check, §4 F6)

## 2026-09-26 — ticket: one Back after a cancelled navigation stays on the same project
**Ticket**: After "Stay on page", `R.navigate` rewrites the entry that setting the hash pushed back to the shown URL (`location.replace`), so the history holds that URL twice. Measured (P5 of `982581260`): entries `[A, A]` at index 1; one `history.back()` is a same-document traverse that stays on A, with no `U.resetState` and the editor mounted. Accepted by Q5 of P-2026-09-25-1905; recorded so that a later history change knows it.
**Priority**: low
**Found in**: P-2026-09-25-1905
**Detail**: docs/discovery/discovery_2026-09-25_navigate_cancel.md (§5 risk 2)
