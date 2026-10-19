# Merge prompts name the chat that launches them

Prompt-ID: P-2026-10-19-2315
Chat: C-2026-10-19-1747
Front: harness
Lane: fast (rendered merge header in `lane-run.mjs`, its tests)
Status: eseguito 2026-10-19 · lane mergeurl · 7174054d8 · laneRun 136/136, Request line from --chat-url, prompts or trailer, else none
Depends: P-2026-10-19-2105, P-2026-10-19-2229
Corregge: none
Request: https://claude.ai/code/session_018RaPfFUZaHRjEo11BkNXZB (Alfonso, 2026-10-19 22:59: «confermo tutto», on the merge-prompt link)

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P8 does not apply, no UI change.

Worktree: `~/jjodel-w-mergeurl`, branch `mergeurl`, created by the chat from the trunk; the commit that adds this prompt is on the branch. Before anything else: `pwd`, branch and `git log -1` match; otherwise stop with `Outcome: blocked`.

Model and tier: as `lane-run start` assigns.

## Lane discipline

Every reply opens with `[P-2026-10-19-2315 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; questions carry `Recommended: <one line>`; unattended (RC-21, RC-25) except the RC-26 list. Time limit: 45 minutes. Node: `~/.local/bin/node`. Read `docs/decisions.md`, the logs and every file above 500 lines with `offset`/`limit` or `rg`, never whole.

## Context (measured, do not redo)

Merge prompts rendered by `lane-run merge` carry `Chat: —` and no `Request:` URL, even when the chat passes `--chat <id>`; their adding commit has no `Claude-Session:` trailer. The lane board therefore shows them without a chat link (example: P-2026-10-19-1841, merge of shell-ui-s6). They are most of the 254 rows still without `chatUrl` after P-2026-10-19-2229. The start gate of P-2026-10-19-2105 exempts merge prompts on purpose.

## COSA

1. **Rendered header.** In `lane-run merge` (both directions, `--direct` included): with `--chat <id>`, write `Chat: <id>` in the rendered prompt and a `Request:` line that starts with the chat's URL, found in this order: (a) `--chat-url <url>` if given (new option, must match `^https://`); (b) the newest prompt in `docs/prompts/` whose header has `Chat: <id>` and whose `Request:` starts with an `https://` URL; (c) the `Claude-Session:` trailer of the newest commit that added a prompt with `Chat: <id>`. The rest of the line reads `(merge of <branch> launched by chat <id>)`. With no `--chat`, or when none of the three gives a URL, write `Request: none (rendered by lane-run, no chat URL known for <id or "no --chat">)` and print a warning. Never fail the merge for this.
2. **Tests** in the existing `lane-run` tests: each of (a), (b), (c), the `none` fallback, and the warning. A mutation that drops source (b) must fail a test.
3. **Commit** (`git add` named files only): `feat(harness): merge prompts name the chat that launches them (P-2026-10-19-2315)` with `lane-run.mjs` and its test, trailer `Model:` (P6); `docs: Status flip and log entry (P-2026-10-19-2315)` with the log-inbox entry (P9) and this prompt's `Status:`. `check:docs` and `check:scripts` from `frontend/`.

## DOVE

`frontend/scripts/lane-run.mjs`, its test file, `frontend/scripts/lane-templates/*` only if the header is rendered from a template, the harness log inbox, this prompt.

## NON FARE

Do not touch `lane-board.mjs`, `tack/` or `docs/decisions.md`. Do not edit earlier merge prompts or anything under `~/.jjodel-lanes/`.

## HARD STOP

None planned. Stop with `question` if the merge template has no header line where `Request:` can go without changing the gates.

## RIFERIMENTI

RC-43 in `docs/decisions.md`; P13 in `docs/PROTOCOL.md`; `merge` usage at the top of `frontend/scripts/lane-run.mjs`; the closing reports of P-2026-10-19-2105 and P-2026-10-19-2229 in `~/.jjodel-lanes/`.
