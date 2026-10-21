# Tack v0 closure on repositories that are not Jjodel

Prompt-ID: P-2026-10-21-1330
Chat: C-2026-10-19-1748
Front: tack
Lane: full (small: one display fix, a first-run check on two foreign repositories, README, version; no new feature)
Status: da eseguire
Supersedes: P-2026-10-19-2100 (same task, rewritten on the trunk after slice 9 and S1)
Corregge: none (the `tack repos` column width defect was found by the chat on 2026-10-19 20:55 and is fixed here as item 1)
Request: Alfonso, 2026-10-19 20:49, in the project chat: «decidi tu» on closing v0 now versus waiting for the Sprotty pilot; 2026-10-19 22:20: Lanes page before the v0 closure (R-TACK-3)

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 does not apply as a separate phase (inputs measured by the chat, see Context). P8 replaced as in the earlier Tack slices: the chat checks the board after exit (RC-23).

Worktree: `~/jjodel-w-tack-v0`, branch `tack-v0`, created by the chat from the trunk at the commit that adds this file. Before anything else: `pwd`, branch, `git log -1` and `git status --short` match; otherwise stop with `Outcome: blocked`.

Model and tier: as `lane-run start` assigns.

## Lane discipline
Every reply opens with `[P-2026-10-21-1330 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; questions carry `Recommended: <one line>`; unattended (RC-21, RC-25) except the RC-26 list. Time limit: 60 minutes. Node: `~/.local/bin/node`.

**Context budget.** Read `tack/README.md` and only the modules you change, by function. Do not read Jjodel's board, discovery reports or earlier prompts. Run tests with `--test-reporter=dot` and print only failures. Write a handoff at 120k.

## Context
On the trunk: slices 1-9 (Lanes page, settings and notifications, breakpoints, waiting cards, `/api/attention`) and S1 (the `TraceSource` boundary in `tack/src/collectors/source.mjs`), 253 tests. The chat closes v0 now, labelled honestly, and runs the Sprotty pilot as v0.1. Measured by the chat:
- `~/harness-book`: git repository with one Claude Code session.
- `~/harness-exp/sprotty`: clean clone of `eclipse-sprotty/sprotty`, no Claude Code session. It stays without sessions: the earlier plan to seed two headless sessions is dropped (it spends model budget, an RC-26 item), and a repository with no session is itself a first-run case worth checking.
- `tack/package.json` reads `"version": "0.0.1"`; the README `Status:` line still says «slice 6 of 7».

## COSA
1. **Bounded `tack repos` output.** One line per repository; toplevels truncated with a count (`/Users/x/repo +3 more`); widths from visible content, capped at 60 characters per column. Unit test with a repository having 40 toplevels and one with a 300-character path. If the output is already bounded, keep the test as a guard and say so.
2. **First-run check, no flag, fresh store.** For each of `~/harness-book` and `~/harness-exp/sprotty`: with `TACK_STORE` (or the equivalent the README names) set to `/tmp/tack-v0/<name>.db`, run `tack board --no-open --port 4711` **from the repository root** with no other flag, call `/api/repos`, `/api/sessions`, `/api/metrics`, `/api/lanes` and `/api/attention` with `curl`, stop the server. Record per repository: preselected repository, sessions found, cost known and unknown, metrics `not-adopted` (expected: every layer-2/3 metric), what the Lanes tab shows with no lane folder, and `git status --porcelain` identical before and after. If the board needs a flag, crashes on the empty case, or writes in the repository: stop with `Outcome: question`.
3. **README.** An «Install and first run» section (Node >= 24; `node tack/bin/tack.mjs board` from a clone; what a repository with no conventions shows); the `Status:` line replaced by exactly `v0: validated on the author's repositories (Jjodel, harness-book, a Sprotty clone without sessions); external pilot pending.`; the list of layers with what each requires; one line on the trace-source boundary (lane-run is the only adapter today). English, no em dash.
4. **Version.** `"version": "0.1.0"` in `tack/package.json`; `tack --version` prints it (test).

## DOVE
`tack/**`, `docs/log-inbox/tack.md` (one entry), this prompt's `Status:` line. Store files only under `/tmp/tack-v0/`. Nothing else.

## Gates
`node --test` on `tack/test` green, privacy tests included; the first-run table of item 2 complete for both repositories; `npm run check:docs` from `frontend/`.

## Commits (P13, RC-17), explicit pathspecs, no push
1. `feat(tack): v0.1.0, bounded repos output, install section (P-2026-10-21-1330)` with `tack/**`. Trailer `Model:` (P6).
2. `docs: Status flip and log entry for the Tack v0 closure (P-2026-10-21-1330)` with the entry (first-run table, tests) and the Status line.

## NON FARE
No new metric, view or collector. No Claude Code session started anywhere. No change outside `tack/` and the two docs. No file written in `~/harness-book` or `~/harness-exp/sprotty`. Do not touch the board on port 4710 or `~/.tack/store.db`. No git tag (the chat tags after the merge). No message text, subject, author or path in the entry beyond repository toplevels. No push.

## HARD STOP
None planned: close with `Outcome: done`, or `Outcome: question` as in item 2.

## RIFERIMENTI
- `tack/README.md`, `tack/bin/tack.mjs`, `tack/src/board/server.mjs`
- `docs/decisions.md` R-TACK-3, R-TACK-7
