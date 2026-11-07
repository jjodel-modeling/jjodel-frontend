# Tack v0b: first run on a repository with no session

Prompt-ID: P-2026-10-21-1500
Chat: C-2026-10-19-1748
Front: tack
Lane: full (small: preselection fallback and empty states; no new collector)
Status: eseguito 2026-10-21 · lane tack-v0b · 82cdc7792 · Sprotty first run now preselects the work tree as unrecorded, every tab empty · visual check by the chat on 4711 (RC-23) pending
Corregge: P-2026-10-21-1330 (finding of its first-run check: started from `~/harness-exp/sprotty`, which has no Claude Code session, the board preselects no repository and shows every repository's data, Jjodel's included)
Request: Alfonso, 2026-10-19 20:49, in the project chat: «decidi tu» on closing v0 (this slice is the condition the chat set for the v0.1.0 tag)

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 does not apply as a separate phase (the defect and its site are known, see Context). P8 replaced as in the earlier Tack slices: the chat checks the board after exit (RC-23).

Worktree: `~/jjodel-w-tack-v0b`, branch `tack-v0b`, created by the chat from the trunk at the commit that adds this file. Before anything else: `pwd`, branch, `git log -1` and `git status --short` match; otherwise stop with `Outcome: blocked`.

Model and tier: as `lane-run start` assigns.

## Lane discipline
Every reply opens with `[P-2026-10-21-1500 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; questions carry `Recommended: <one line>`; unattended (RC-21, RC-25) except the RC-26 list. Time limit: 60 minutes. Node: `~/.local/bin/node`.

**Context budget.** Read `preselect` in `tack/src/board/api.mjs` (around line 59), its caller in `tack/src/board/server.mjs` (around line 122), and only the view code that renders the selected repository. Run tests with `--test-reporter=dot` and print only failures. Write a handoff at 120k.

## Context
Repositories enter the store only through the folders Claude Code sessions ran in, so a repository with no session is never stored and `preselect(db, cwd)` finds nothing. The board then falls back to «all repositories». For a new user that is the wrong first screen: it shows other people's work and hides that their own repository was seen at all.

## COSA
1. **Fallback.** When `preselect` finds no stored repository and the start directory is inside a git work tree, the board preselects that work tree: its toplevel and name, marked as having no recorded session. Outside a git work tree the current behaviour stays, and the README says so. «All repositories» remains selectable in the picker; it is just never the default when the start directory is a work tree.
2. **Empty states.** With that selection, every tab (Lanes, Sessions, Timeline, Insights) shows one line in the board's existing empty-state style, for example `No Claude Code sessions recorded for <name> yet.`, and no data of other repositories. The API routes behind those tabs answer with empty lists for that repository, not with all repositories. `/api/attention` is unchanged (the menu bar route covers all repositories by design).
3. **Tests.** A store with sessions of one repository, the board started from a second git work tree with none: preselected is the second, sessions and lanes empty, no row of the first in any default view; started from a non-git folder: current behaviour. Existing tests unchanged.
4. **README.** The «Install and first run» section describes the new first screen, replacing the fallback sentence P-2026-10-21-1330 added. The `Status:` line stays as it is.
5. **Re-run** the first-run check of P-2026-10-21-1330 item 2 for `~/harness-exp/sprotty` only (fresh store under `/tmp/tack-v0b/`, port 4711, no flag, `git status --porcelain` identical before and after) and put the row in the entry.

## DOVE
`tack/**`, `docs/log-inbox/tack.md` (one entry), this prompt's `Status:` line. Store files only under `/tmp/tack-v0b/`. Nothing else.

## Gates
`node --test` on `tack/test` green; the Sprotty row of item 5; `npm run check:docs` from `frontend/`.

## Commits (P13, RC-17), explicit pathspecs, no push
1. `fix(tack): preselect the start work tree when it has no session (P-2026-10-21-1500)` with `tack/**`. Trailer `Model:` (P6).
2. `docs: Status flip and log entry for Tack v0b (P-2026-10-21-1500)`.

## NON FARE
No new collector, metric or view. No Claude Code session started. No file written in `~/harness-book` or `~/harness-exp/sprotty`. Do not touch the board on port 4710, `~/.tack/store.db` or `/api/attention`. No git tag. No push.

## HARD STOP
None planned: close with `Outcome: done`, or `Outcome: question` for an RC-26 item.

## RIFERIMENTI
- `tack/src/board/api.mjs` `preselect`, `tack/src/board/server.mjs`
- `docs/prompts/claude_2026-10-21_1330_prompt_tack_v0_closure.md` and its entry in `docs/log-inbox/tack.md`
