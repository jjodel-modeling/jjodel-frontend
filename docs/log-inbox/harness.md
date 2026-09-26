# log-inbox — lane «harness»

Entries written by the harness lane while sessions share this tree (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-09-27 — docs: ticket on the probe oracle, first unattended closure (P-2026-09-27-0020)
**Prompt**: `claude_2026-09-27_0020_prompt_harness_probe_oracle_ticket.md`, fast lane (docs only, one commit, no visual check), launched by `lane-run` on the trunk in `~/jjodel-release` at `2b870d5ad`, the first lane expected to reach `Outcome: done` without a human after RC-29 (`620e3d5cd`). Records the ticket the RC-29 memo leaves to the next harness lane: `a fresh git init with a copied settings.json is not an oracle for permission rules`, below this entry.
**Files touched**: this commit: `docs/log-inbox/harness.md` (this entry and the ticket), `docs/prompts/claude_2026-09-27_0020_prompt_harness_probe_oracle_ticket.md` (Status line).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Docs only; `npm run check:docs` from `frontend/`: 4/4 passed, exit 0, 3 warnings (the two unresolved `Corregge` of the active log, this inbox waiting to be folded).
**Out-of-scope changes**: no — the two files of DOVE; `git diff --stat` of every other path empty.
**Layer Impact Report**: not-required
**Smoke visivo**: —
**Notes**: `Found in`: the prompt's `RC-29` fails `TICKET_FOUND_IN` (`frontend/scripts/gates/log-tools.ts:53`: a prompt or chat ID first), so the ticket reads `C-2026-09-26-1702 (RC-29)`, the chat that measured RC-29. The inbox held no ticket after the fold `c5a669c2e`: shape from the harness tickets of the active log. Order as the prompt, entry then ticket: the fold puts the ticket on top. Session `89eb97d2`; `permission_denials` not visible from inside it.
**Prompt document name**: 2026-09-27 00:20

## 2026-09-27 — ticket: a fresh git init with a copied settings.json is not an oracle for permission rules
**Ticket**: §7 of the P-2026-09-26-1640 report measured 0 `permission_denials` for `git commit` under `-p` and `bypassPermissions` in a probe repository (a fresh `git init` with a copied `settings.json`, `ask` on `Bash(git commit*)` included), while on the real tree that `ask` held and stopped `P-2026-09-26-2340` and `P-2026-09-26-2350` at their first commit: five probes in the RC-29 memo, 3 and 4 refused by the `ask` (an `allow` does not override it), 5 committed once the rule was removed. The difference between the two setups was not identified. Future permission measurements run on the tree the lanes run in, never in a copy; §7 of that report is to be read with the RC-29 memo beside it.
**Priority**: low
**Found in**: C-2026-09-26-1702 (RC-29)
**Detail**: docs/ratifiche/claude_ratifiche_2026-09-27_commit_ask_under_bypass.md (What was measured, Ticket), read with docs/discovery/discovery_2026-09-26_orchestrated_lanes_harness.md (§7)
