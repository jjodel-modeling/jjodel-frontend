# Tack slice 9, continuation after the context ceiling

Prompt-ID: P-2026-10-21-1117
Chat: C-2026-10-19-1748
Front: tack
Lane: full (second session of P-2026-10-21-1025: tests, privacy, closure)
Status: da eseguire
Depends: P-2026-10-21-1025
Corregge: none (continuation under RC-51, not a repair)
Request: Alfonso, 2026-10-21 10:12, in the project chat: «Esegui in /lane auto» (same request as P-2026-10-21-1025)

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 does not apply (continuation). P8 replaced: the chat checks the board after exit (RC-23).

Worktree: `~/jjodel-w-tack-s9`, branch `tack-s9`, **reused as is** with the uncommitted work of P-2026-10-21-1025 (only `tack/` paths). Before anything else: `pwd`, branch, `git log -1`, `git status --short`; otherwise stop with `Outcome: blocked`. Do not reset, stash or re-create anything.

Model and tier: as `lane-run start` assigns.

## Lane discipline
Every reply opens with `[P-2026-10-21-1117 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; questions carry `Recommended: <one line>`; unattended (RC-21, RC-25) except the RC-26 list. Time limit: 60 minutes. Node: `~/.local/bin/node`.

**Context budget, strict.** Read only `~/.jjodel-lanes/P-2026-10-21-1025/handoff.md`, then the COSA, DOVE and NON FARE of `docs/prompts/claude_2026-10-21_1025_prompt_tack_s9_waiting_cards.md` by range. Never read a whole source file; `grep -n`, then ranges. Tests with `--test-reporter=dot` piped through `grep -E 'not ok|# (tests|pass|fail)'`. Handoff at 120k.

## COSA
Finish the «Still to do» of the handoff, in order: run the 5 updated test files; write `test/waiting.test.mjs` (cards per wait kind, Recommended present and absent, chat linked and plain, single-card banner, `/api/attention` shape against a 4700-shaped fixture); extend the privacy test so no closing text reaches the store; fix any break in the existing lanes view tests; full suite green; restart 4710 from this worktree (`TACK_NOTIFY=off`, store copy as before) and report the waiting count and one card's fields from the API; the commits of P-2026-10-21-1025 item 7 with both Prompt-IDs in the subjects; one log entry in `docs/log-inbox/tack.md` carrying the measures of item 1 and the 3:1 limit reported by the first session (three fills at 3:1 is the most a 21:1 range allows; ceiling told apart by its outline); `Status:` of P-2026-10-21-1025 (completed by this prompt) and of this prompt (copy both onto the branch from the trunk).

## DOVE
As P-2026-10-21-1025, plus this prompt's `Status:` line.

## NON FARE
Everything in the NON FARE of P-2026-10-21-1025. No new feature. No push, no merge.
