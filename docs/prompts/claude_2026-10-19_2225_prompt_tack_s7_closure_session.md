# Tack slice 7, closure session after the second context ceiling

Prompt-ID: P-2026-10-19-2225
Chat: C-2026-10-19-1748
Front: tack
Lane: full (third session of P-2026-10-19-1800 Phase 2: two red tests, full suite, README, report §0, board, commits, closure)
Status: eseguito 2026-10-19 · lane tack-s7 · e0fd6d286, docs commit carrying this line · 185 tests, 185 pass
Depends: P-2026-10-19-2140
Corregge: none (continuation under RC-51, not a repair)
Request: Alfonso, 2026-10-19 20:51, in the project chat: «si» to the GO of Phase 2 of P-2026-10-19-1800 (same request as P-2026-10-19-1800)

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 does not apply (continuation). P8 replaced as in P-2026-10-19-1800: the chat checks the board after exit.

Worktree: `~/jjodel-w-tack-s7`, branch `tack-s7`, **reused as is**: HEAD `1ca951380` with the uncommitted work of P-2026-10-19-1800 and P-2026-10-19-2140 (only `tack/` paths, plus the `frontend/node_modules` link). Before anything else: `pwd`, branch, `git log -1` (must be `1ca951380`) and `git status --short` (only `tack/` paths); otherwise stop with `Outcome: blocked`. Do not reset, stash or re-create anything.

Model and tier: as `lane-run start` assigns.

## Lane discipline
Every reply opens with `[P-2026-10-19-2225 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; questions carry `Recommended: <one line>`; unattended (RC-21, RC-25) except the RC-26 list. Time limit: 60 minutes. Node: `~/.local/bin/node`.

**Context budget, strict.** The two earlier sessions hit the 200k ceiling after 4 and 15 minutes. Read only `~/.jjodel-lanes/P-2026-10-19-2140/handoff.md`. Do not read either earlier prompt, the discovery report body, any `handoff.diff`, or a whole source file: open a file only at the lines you change (`grep -n` first, then a ranged read). Run tests with `--test-reporter=dot` piped through `grep -E 'not ok|# (tests|pass|fail)'`; never print a passing test. Write a handoff at 120k.

## COSA
1. Make the two known red tests green as the handoff says (`test/privacy.test.mjs:69`: add the column sources of the four new tables; `test/board.test.mjs:305`: spawn the board with `TACK_NOTIFY=off`).
2. Run the full `tack/test` suite and report the counts of tests run, passed and failed. All green, and the count must be higher than slice 6's 160.
3. README: one section on settings (the three files, precedence, which keys live where, credentials only in the user file), notifications (catalogue, channels, quiet hours, privacy) and the load strip. English, no em dash.
4. Add `## 0. Answer in brief` at the top of `docs/discovery/discovery_2026-10-19_tack_settings_notifications.md`: five lines at most, written from the handoff, without reading the rest of the report.
5. Board for the visual check: stop the s6 board on port 4710 (PID in `/tmp/tack-s5b/board.pid` or found with `lsof -i :4710`; check it is a `tack` node process), then start the board **from this worktree** (`~/jjodel-w-tack-s7/tack/bin/tack.mjs`), because the new code exists only here until the merge; use the real store copy as slice 6 did, and leave it running. Write the reason in the log entry. Check `/`, `/settings`, `/api/settings`, `/api/load` answer with `curl`.
6. Closure: the code commit (`tack/**`) and the docs commit (report §0, log entry, `Status:` lines), each subject naming P-2026-10-19-1800, P-2026-10-19-2140 and P-2026-10-19-2225; one entry in `docs/log-inbox/tack.md` (test counts, the twelve unattended decisions by reference to report §6, the board choice); `Status:` of 1800 to `eseguito ... · completed by P-2026-10-19-2225 · <sha>`, of 2140 to `eseguito ... · continued by P-2026-10-19-2225`, and this prompt's; `npm run check:docs` from `frontend/`.

## DOVE
`tack/**`, the discovery report (§0 only), `docs/log-inbox/tack.md` (one entry), the `Status:` lines of P-2026-10-19-1800, P-2026-10-19-2140 and this prompt. Nothing else.

## NON FARE
No new dependency, no new feature, no change outside DOVE, no change to `~/.claude/`, no real notification sent by a test, no push, no merge.

## HARD STOP
None planned: close with `Outcome: done`, or `Outcome: question` for an RC-26 item.

## RIFERIMENTI
- `~/.jjodel-lanes/P-2026-10-19-2140/handoff.md`
