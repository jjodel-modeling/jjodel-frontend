# Prompt: a cancelled navigation leaves the tab dead (discovery)

Prompt-ID: P-2026-09-25-1905
Chat: C-2026-09-25-1353
Lane: fast
Status: eseguito 2026-09-26 · lane navigate-cancel · 8d6febf5f

Worktree: `~/jjodel-open`. Its branch `open-hash` is merged into the trunk (`46a67b3c4`) and closed. Setup, each a hard stop if it fails: `pwd` is `/Users/alfonso/jjodel-open`; `git status` empty; `git switch -c navigate-cancel alfonso-frontend-jjtl`, then `git log -1` reads `docs: add prompt P-2026-09-25-1905, cancelled navigation discovery` (if the trunk moved past it, stop and say so). Every commit of this lane goes on `navigate-cancel`. Never work by absolute path on another worktree.

**Environment (P14).** This tree has no `node_modules`: create the temporary symlink to `~/jjodel/frontend/node_modules`, name it in the report, remove it at the end. Vite cache is per tree. Dev server on 3003 only, from this tree, after `lsof -nP -iTCP:3003 -sTCP:LISTEN` shows it free. Do not touch `~/jjodel-release` (3001), `~/jjodel-sim`, `~/jjodel-events`, `~/jjodel-vite`, `~/jjodel-gate`, or any server you did not start. The simulator is out of scope and owned by another chat.

Two-phase. **This prompt covers Phase 1 only**: read-only on the source, it ends with a committed report and a hard stop. Phase 2 comes from chat as a GO with this ID and its own `Lane:` line. `reducer.ts` is not a critical-zone file; if the Phase 2 candidate touches one (`CLAUDE.md` §3.2), the report carries a Layer Impact Report draft.

## COSA

The high ticket found by `P-2026-09-25-1440` (entry in `docs/log-inbox/versionfixer.md`). `R.navigate` (`frontend/src/common/U.tsx`, around `:118-146`) sets `U.navigating = true`, then `window.location.hash = hash` and `window.location.reload()`. When the project has unsaved changes, the `beforeunload` handler (`U.enableUnsavedChangesWarning`, around `:216`, enabled by `ProjectEditor.tsx:405-411`) makes the browser ask; if the user answers "Stay on page", the reload does not happen and `U.navigating` stays `true` for the life of the tab. From then on `reducer.ts` (around `:611`, `if (U.navigating) return oldState;`) drops every action, and `App.tsx:112` renders `<Loader/>` at the next render. The user chose "Stay" to keep unsaved work, and is left with a tab that cannot record or save it.

Wanted in the end (Phase 2, not now): after a cancelled navigation the tab works as before (actions apply, the editor renders, a save works), with the URL consistent with what is shown; a navigation that proceeds behaves as today.

Hypotheses to falsify, each with evidence:

- **H1.** Every way to reach the stuck state goes through `R.navigate` (34 call sites of `R.navigate(` in `frontend/src`, counted from chat; group them by kind). Other writers of `U.navigating`, if any, are listed.
- **H2.** After "Stay on page", `window.location.hash` has already changed to the target (it is set before `reload()`), so the URL and the shown project disagree. Measure it.
- **H3.** A reset of `U.navigating` placed right after `reload()` (a macrotask, or a `pageshow`/`focus`/`visibilitychange` signal, whichever fires) runs when the user cancels and never produces a visible wrong render when the reload proceeds. Measure both branches in Chrome; say what Firefox and Safari do only if you can run them, otherwise mark it as read, not measured.
- **H4.** Nothing else depends on `U.navigating` staying `true` until unload (for example code that assumes no dispatch after `R.navigate`, or the LeftBar paths that disable the warning first at `LeftBar.tsx:138`, `:154`).

Out of scope: any source edit; the save format; the open path of 0030/1440 except where `R.navigate` enters it; the `pointedBy` ticket; the simulator.

## DOVE

Phase 1 reads, at least: `R.navigate` and `U.navigating` in `frontend/src/common/U.tsx`, the `beforeunload` handler and `shouldBypassBeforeUnload`; `ProjectEditor.tsx` (the effect at `:405`); `LeftBar.tsx` (`:130-160`); `App.tsx` (the `Loader` returns at `:108`, `:112`); `reducer.ts` (the guard at `:611` and what else reads `U.navigating`); a sample of the 34 callers, at least one per kind. Read whole functions; line numbers are from chat and may have moved.

## COME

1. **Map (H1, H4).** A table of the callers of `R.navigate` grouped by kind (menu, dashboard, after save, after import, error paths), with file:line, and whether each can run while the project is modified. Every reader and writer of `U.navigating`.
2. **Measure on 3003** with an in-page probe (no source edit): make the project modified, trigger `R.navigate` from two different callers, answer "Stay on page", then record `U.navigating`, `location.hash`, whether a dispatch changes the store, what the page shows at the next render, whether a save works. Then the same with "Leave": record what happens. Chrome shows the prompt only after a user gesture on the page; do the gesture through the UI, not a synthetic event, and say how you did it. If the prompt cannot be driven from the session, stop and give Alfonso the exact steps to do it by hand, then continue from his answers.
3. **Candidate fix, not applied.** The smallest change that satisfies COSA, its files, how it restores or rewrites the hash, and at least five mutants with the test or probe that kills each. Say which parts vitest can reach (the reducer guard can be tested; the browser prompt cannot).
4. **Report** in `docs/discovery/discovery_2026-09-25_navigate_cancel.md` (path `docs/discovery/` and naming `discovery_<date>_<description>.md` are mandatory): objective, files read with full paths, the table, the measurements, the candidate, risks, questions for Alfonso numbered Q1.., each with a recommended answer.
5. Commit the report alone, pathspec after `--`, subject within 72 characters counted before committing: `docs: discovery of the cancelled navigation (P-2026-09-25-1905)`; `Model:` trailer. No log entry and no Status flip in Phase 1. Stop your server on 3003, remove the temporary symlink, `git status` empty.
6. **Hard stop.** Closing message opening with `[P-2026-09-25-1905 · session <id>]`: report sha, H1-H4 in one line each, the questions. Wait.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, a source edit, `rm` of a symlink you did not create, push.

## RIFERIMENTI

- `docs/log-inbox/versionfixer.md`, the 1440 entry, Ticket paragraph (priority high).
- `docs/discovery/discovery_2026-09-25_hash_change_open.md` (where the defect was found) and `docs/discovery/discovery_2026-09-25_project_open_path.md`.
- `docs/PROTOCOL.md` P13, P14; `docs/decisions.md` RC-13, RC-17.
