# Tack slice 7, Phase 2 continuation after the context ceiling

Prompt-ID: P-2026-10-19-2140
Chat: C-2026-10-19-1748
Front: tack
Lane: full (second session of P-2026-10-19-1800 Phase 2: settings, notifier, transports, sampler, settings page, load strip, tests, closure)
Status: da eseguire
Depends: P-2026-10-19-1800
Corregge: none (continuation under RC-51, not a repair)
Request: Alfonso, 2026-10-19 20:51, in the project chat: «si» to the GO of Phase 2 of P-2026-10-19-1800 (same request as P-2026-10-19-1800)

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 does not apply (continuation, discovery done in `1ca951380`). P8 replaced as in P-2026-10-19-1800: the chat checks the board after exit.

Worktree: `~/jjodel-w-tack-s7`, branch `tack-s7`, **reused as is**: HEAD `1ca951380` with the uncommitted work of P-2026-10-19-1800 (`tack/src/store/schema-5.sql` untracked, `tack/src/store/open.mjs` and `tack/src/collectors/lane-run/collect.mjs` modified). Before anything else: `pwd`, branch, `git log -1` (must be `1ca951380`) and `git status --short` (only those three paths, plus the `frontend/node_modules` link); otherwise stop with `Outcome: blocked`. Do not reset, stash or re-create anything.

Model and tier: as `lane-run start` assigns.

## Lane discipline
Every reply opens with `[P-2026-10-19-2140 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; questions carry `Recommended: <one line>`; unattended (RC-21, RC-25) except the RC-26 list. Time limit: 90 minutes. Node: `~/.local/bin/node`.

**Context budget.** Read first, and only: `~/.jjodel-lanes/P-2026-10-19-1800/handoff.md`, then the COSA, DOVE, NON FARE and Gates of `docs/prompts/claude_2026-10-19_1800_prompt_tack_s7_settings_notifications.md`. Do not read the discovery report whole: open it only by section when the handoff points there, and only to add §0. Do not read `handoff.diff` (the work is in the tree). Open a Tack file only to change it, by function. Run tests with `--test-reporter=dot` and print only failures. Write a new handoff at 150k, not at 200k.

## Context
P-2026-10-19-1800 Phase 2 stopped at the 200k ceiling four minutes after the GO, because the discovery had used most of the session. The design is fixed in the handoff and in the twelve unattended decisions of report §6, ratified by Alfonso with the GO; implement it as written, without reopening it.

## COSA
Finish the «Remaining work» of the handoff, tests first, committing nothing until all of it is green:
1. Settings schema `tack/contract/v1/settings.json` with per-key levels, loader and merge, `tack check` on the three files, `tack settings`.
2. Notifier with rising edge, baseline, dedup, quiet hours and digest; the desktop and ntfy transports; `tack notify --watch` and `tack notify test <channel>`.
3. Host load sampler, stored samples, top-bar strip with threshold line and lane ticks.
4. `/settings` page and theme tokens (light values byte-identical, frozen by a test).
5. All tests listed in the handoff and in Phase 2 of P-2026-10-19-1800.
6. Closure: README section; the «## 0. Answer in brief» section added to the discovery report; board on port 4710 with the real store copy, left running (stop the s6 board first: check it is a `tack` node process); commits as the handoff specifies, with both Prompt-IDs in the subjects; one entry in `docs/log-inbox/tack.md`; `Status:` lines of both prompts (1800 flipped to `eseguito ... · completed by P-2026-10-19-2140 · <sha>`); `check:docs`.

## DOVE
As P-2026-10-19-1800, plus the `Status:` line of this prompt.

## NON FARE
Everything in the NON FARE of P-2026-10-19-1800. No feature beyond its COSA. No push. Do not touch `docs/prompts/claude_2026-10-19_2100_prompt_tack_s7_v0_closure.md`.

## HARD STOP
None planned: close with `Outcome: done`, or `Outcome: question` for an RC-26 item.

## RIFERIMENTI
- `~/.jjodel-lanes/P-2026-10-19-1800/handoff.md`
- `docs/prompts/claude_2026-10-19_1800_prompt_tack_s7_settings_notifications.md`
