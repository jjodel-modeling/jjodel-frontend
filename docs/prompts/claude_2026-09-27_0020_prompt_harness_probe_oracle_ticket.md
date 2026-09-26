# Prompt: ticket, the 1640 probe repository is not an oracle for permission rules (end-to-end test of a launched lane)

Prompt-ID: P-2026-09-27-0020
Chat: C-2026-09-26-1702
Lane: fast (docs only, one commit, no visual check)
Status: eseguito 2026-09-27 · lane harness · single commit

Worktree: `~/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, `git log -1` is the commit that adds this file (subject `docs: add prompt P-2026-09-27-0020, probe oracle ticket`), its parent is `620e3d5cd` (RC-29), `git status` empty. Otherwise stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-27-0020 · session <id>]` and ends with an `Outcome:` line (P16).

## COSA

This lane is the first one expected to run from launch to `Outcome: done` without a human, after RC-29 removed `Bash(git commit*)` from the `ask` list (`620e3d5cd`). Its content is the ticket that the RC-29 memo (`docs/ratifiche/claude_ratifiche_2026-09-27_commit_ask_under_bypass.md`, section «Ticket») leaves to the next harness lane.

## DOVE

- `docs/log-inbox/harness.md`: one ticket entry and this lane's own entry.
- This prompt file: the Status line.

Nothing else. No code, no other doc.

## COME

1. Read the RC-29 memo and, in `docs/discovery/discovery_2026-09-26_orchestrated_lanes_harness.md`, its §7 (the probe repositories and their table).
2. Ticket, at the head of `docs/log-inbox/harness.md`, in the shape of the existing ticket entries there (heading `## 2026-09-27 — ticket: a fresh git init with a copied settings.json is not an oracle for permission rules`, `**Ticket**`, `**Priority**: low`, `**Found in**: RC-29`, `**Detail**`): §7 of the 1640 report measured 0 denials for `git commit` under `-p` and `bypassPermissions` in a probe repository, while on the real tree the `ask` held and stopped `P-2026-09-26-2340` and `P-2026-09-26-2350` at their first commit (five probes in the RC-29 memo). Future permission measurements run on the tree the lanes run in, never in a copy; §7 of that report is to be read with the RC-29 memo beside it.
3. This lane's entry, right above the ticket, type `docs`, `Corregge: —`, prompt name and this file, the ticket named by heading, `Smoke visivo: —`; `npm run check:docs` from `frontend/` must stay 4/4 (inbox entries are linted by the same rules).
4. Status line of this file flipped to `eseguito 2026-09-27 · lane harness · <sha>`: since the sha is that of this very commit, write `eseguito 2026-09-27 · lane harness · single commit` and let the chat put the sha in (P13 tolerates the flip in the closure commit).
5. One commit, pathspec after `--`, files `docs/log-inbox/harness.md` and `docs/prompts/claude_2026-09-27_0020_prompt_harness_probe_oracle_ticket.md`, subject `docs: ticket on the probe oracle, first unattended closure (P-2026-09-27-0020)`, body with the `check:docs` result, `Model:` trailer.
6. Closing report: the sha, the `check:docs` line, whether any permission was refused (quote `permission_denials` if you can see it, otherwise say so), then `Outcome: done`.

Stop with `Outcome: question` and a `Recommended:` line if `check:docs` goes red on the new entries.

Never: `git add .`, `-A`, `-u`, `--no-verify`, a code file, push, any other tree.
