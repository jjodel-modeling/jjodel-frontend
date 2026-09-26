# Prompt P-2026-09-25-1905, Phase 2: a cancelled navigation keeps the tab alive

Prompt-ID: P-2026-09-25-1905 (Phase 2 of `claude_2026-09-25_1905_prompt_navigate_cancel_discovery.md`)
Chat: C-2026-09-25-1353
Lane: fast
Status: da eseguire

Worktree: `~/jjodel-open`, branch `navigate-cancel`, the same session that wrote the Phase 1 report. The branch was rebased from chat on 2026-09-26 onto the trunk tip `5433451fd`; the report is now `8d6febf5f` (same content as `bd2b39bfe`, which no longer exists as a ref). Before anything else: `pwd` is `/Users/alfonso/jjodel-open`, branch `navigate-cancel`, `git log -1` is the commit that adds this file, `git log -2` shows the report `8d6febf5f` below it, `git status` empty. Otherwise stop.

**Environment (P14).** Recreate the temporary symlink `frontend/node_modules -> /Users/alfonso/jjodel/frontend/node_modules` after `test ! -e && test ! -L`, name it in the closing report, remove it at the end. Vite cache per tree. Dev server on 3003 only, from this tree, after `lsof -nP -iTCP:3003 -sTCP:LISTEN` exits 1. Do not touch `~/jjodel-release` (3001), `~/jjodel-sim`, `~/jjodel-events`, `~/jjodel-vite`, `~/jjodel-gate`, or any server you did not start. The simulator belongs to another chat.

Every message opens with `[P-2026-09-25-1905 · session <id>]`.

## Decisions (answers to §7 of the report, ratified by Alfonso in the project chat on 2026-09-26)

- **Q1, no.** The two callers that act before asking (F4 user-menu Dashboard, F5 Sign-out) stay out of this lane. They get one medium ticket in the closure entry: "confirm first, then reset or log out". The entry says plainly what this fix changes for them: Sign-out "Stay" goes from a frozen tab to a working, logged-out tab whose Cmd+S persists nothing and clears the dirty flag (§3.3); the user-menu Dashboard goes from frozen to A reloaded from storage with the edit lost.
- **Q2, yes, in that ticket.** The Sign-out paths disable the unload warning after the in-app confirm, as `CloseProject` does at `Navbar.tsx:498`, so the user is asked once and the browser prompt can no longer be reached from Sign-out. Where the disable lives (once in `AuthApi.logout` or at the three call sites) is that ticket's discovery, not this lane's.
- **Q3, yes,** merged into Q1's ticket: the user-menu Dashboard throws offline at `Navbar.tsx:1999` (`Collaborative.client` undefined).
- **Q4, yes.** Chromium-only coverage. A missing `navigation` object, or a navigate event that does not fire, means "not cancelled": today's behavior. M8 stays a mutant. Firefox and Safari are read, not measured, and the entry says so.
- **Q5, yes.** The duplicate history entry after a Stay is accepted; P5 measures it. If one Back after a Stay does anything other than stay on A with no reset, that is a stop and a report, not a fix in this lane.
- **Q6, yes,** low ticket, a discovery of its own: after Cmd+S the blob carries the edited description while `idlookup[A].description` keeps the old text (F6, cause read not verified).

## COSA

The §8 candidate of the report, as it stands: the hash set and the reload move into a pure function `hashReload` that watches the reload's own Navigation API `navigate` event; when its `signal` aborts synchronously inside `reload()` (the user stayed), the function restores the URL the page still shows with `location.replace` and resets the flag, both synchronously, in the task that called `R.navigate`. A proceeding reload behaves as today: `U.navigating` stays `true` until unload, the hash is the target's. No other file, caller, guard or handler changes.

Two precisions on the §8 text, both to keep `strict` clean, neither changes the mechanism:

- no `any`: the module declares a local `ReloadNavigateEvent { navigationType: string; signal: { addEventListener(type: 'abort', listener: () => void): void } }` and `ReloadWindow.navigation` uses it; `U.tsx` passes `window as unknown as ReloadWindow`;
- the listener is added before `setNavigating(true)` and removed in `finally`, as written; the order `setNavigating(true)` → hash set → `reload()` → (on cancel) `replace` → `setNavigating(false)` is the one V4 pins.

## DOVE

Three files, no critical-zone file (`CLAUDE.md` §3.2), no exported interface changed: `Lane: fast` (RC-3, RC-17).

1. `frontend/src/common/navigateReload.ts` (new, no imports): `ReloadWindow`, `ReloadNavigateEvent`, `hashReload(win, hash, setNavigating): boolean`, with the doc comment of §8 (it names the prompt and says why the signal is trusted). Name check first: `command grep -rn "navigateReload\|hashReload" frontend/src` exits 1.
2. `frontend/src/common/U.tsx`, `R.navigate` only: the three lines `U.navigating = true; window.location.hash = hash; window.location.reload();` become one call to `hashReload`, plus the import. The commented lines stay (Rule 8), the return type stays `void`, the absolute branch and everything else in `R` stay.
3. `frontend/src/common/__tests__/navigateReload.test.ts` (new; the directory does not exist, create it): V1..V5 of report §6 against a fake `ReloadWindow`. Node environment, no DOM, no `joiner`.

Out of scope: `reducer.ts:611`, `App.tsx:112`, `PathChecker`, `stateInitializer`, `U.resetState`, the unload handler, every caller of `R.navigate`, `auth.ts`, `Navbar.tsx`, the save path, the simulator.

## COME

1. **Baseline** on this tree, after the symlink: `npm run typecheck` (expected 14, the §17 set; record the set), `npx vitest run` (state the total and the files red at import before touching anything), `npm run build`, `npm run check:docs`. Record.
2. **Tests first.** Write V1..V5 and show them red (the module does not exist). V4 records the call order on the fake and is the only killer of M6: say so in the test's comment.
3. **Implement** in the order module → test green → `U.tsx`. Minimal diff, no refactor, no rename.
4. **Mutation bench**, the eight mutants of report §6 (M1..M8), each applied, run against the vitest bench, reverted; table in the code commit body with the killing test. M6 is held by V4 alone, as declared. A survivor among M1..M5, M7, M8 is a stop: report, do not weaken the mutant.
5. **Probes on 3003**, with the Phase 1 probe (`probe_1905.mjs` in the session scratchpad; if it is gone, rebuild the same init script, throwaway, never committed), fixtures A and B of 1440, the UI gesture as in Phase 1 (description pencil, Tab), dialog answered after 400 ms:
   - **P1** Stay from `logo` and `evalB`: URL = A's, `U.navigating === false`, 0 `U.resetState`, editor mounted with `handler:true`, a second UI edit applied, Cmd+S advances A's `lastModified` and the blob carries both edits;
   - **P2** Leave from `logo` and `evalB`: at `R.navigate`'s return `U.navigating === true` and the URL is the target's; the new document opens the target; stored copies unchanged;
   - **P3** control, LeftBar > Close project > "Don't save": no dialog, `aborted:false`, the reload proceeds;
   - **P4** Stay from `signout` and `evalResetFirst`: record the residuals of §3.3 as they are (no pass/fail; they feed the Q1 ticket);
   - **P5** history: after a Stay from `logo`, `navigation.entries()` and one `history.back()`: the page stays on A, no `U.resetState`, the editor still mounted. Anything else is a stop (Q5).
   Verbatim excerpts of P1, P2, P5 go in the code commit body, trimmed as in the report.
6. **Gates on the code commit**: typecheck 14 (same set), vitest the baseline total plus 5, 0 failed, the same files red at import; build exit 0; `check:docs` 4/4; diff of every file outside DOVE empty.
7. **Code commit**, pathspec after `--` with the three files, subject `fix(nav): a cancelled reload keeps the tab alive (P-2026-09-25-1905)` (48 characters before the suffix, §6.2), body with baseline, gates, mutant table, probe excerpts, `Model:` trailer.
8. **Closure commit** right after (P13, RC-17), docs only: the entry in `docs/log-inbox/versionfixer.md` (the inbox of the 0030/1440/1905 line; CLAUDE.md §21.2; `Layer Impact Report: not owed`; `Smoke visivo: in attesa di Alfonso su 3003`; the three tickets of Q1+Q2+Q3 (medium, one slot), Q6 (low) and, only if P5 measured something, the history entry (low); the Chromium-only coverage of Q4 stated; the §3.3 residuals cited from the report, not retold); the Status of this file flipped to `eseguito 2026-09-26 · lane navigate-cancel · <code sha>`; the Status of the Phase 1 prompt `docs/prompts/claude_2026-09-25_1905_prompt_navigate_cancel_discovery.md` flipped to `eseguito 2026-09-26 · lane navigate-cancel · 8d6febf5f`. The Phase 1 file lives on the trunk too: flip it here only, the merge carries it.
9. **Leave 3003 running** on this tree for Alfonso's check by hand: modify → logo → "Stay on page" → a second edit → Cmd+S → reload the tab and see both edits; then modify → logo → "Leave" → the dashboard opens and the edit is gone. The visual outcome line of the Status (`verifica visiva passata`) is Alfonso's, from chat, after his check: not this session's. Remove the symlink only when Alfonso says the check is done; say in the closing report that it is still there.
10. **Closing report** opening with `[P-2026-09-25-1905 · session <id>]`: two shas, gates, mutant table summary, P1..P5 in one line each, any deviation. Then stop: the merge into the trunk comes from chat.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, `rm` of a symlink you did not create, an edit outside DOVE, a critical-zone edit, push.

## RIFERIMENTI

- `docs/discovery/discovery_2026-09-25_navigate_cancel.md` (`8d6febf5f`): §2.4 (the signal), §3.1 (C4), §3.3 (residuals), §5 (risks), §6 (V1..V5, P1..P5, M1..M8), §8 (candidate).
- `docs/discovery/discovery_2026-09-25_hash_change_open.md` §5 risk 2 (the dropped LOAD).
- `docs/decisions.md` RC-3, RC-13, RC-17; `docs/PROTOCOL.md` P13, P14.
- `CLAUDE.md` §3.2 (critical zone, not touched), §5 (pure modules for the bench), §6.2 (subject length), §21.2 (entry format).
