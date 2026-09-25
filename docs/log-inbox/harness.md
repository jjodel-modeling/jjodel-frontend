# log-inbox — lane «harness»

Entries written by the harness lane while sessions share this tree (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-09-25 — feat(harness): hook gates off ask under bypass, Opus 5.5 pin (P-2026-09-25-1022)
**Prompt**: `claude_2026-09-25_1022_prompt_harness_bypass_gates.md`, two-phase, on `harness-bypass` in `~/jjodel-gate`. Phase 1 report `ddee7a09e` (`docs/discovery/discovery_2026-09-25_harness_bypass_gates.md`). GO with four rulings: `docs/HARNESS-DOCS.md` rows 381-382 join the closure commit; `status-flip` loses the lone-commit path; the bypass deny covers the whole 3.2 trigger, with one test for a creator outside the six and one for `SetFieldAction` in `sync/`; `settings.local.json` of this worktree deleted after the gates. `bubble` stays `ask`.
**Files touched**: code `cd5eb9eb5`: `.claude/settings.json`, `.claude/skills/status-flip/SKILL.md`, `frontend/scripts/hooks/critical-zone.mjs`, `bash-guard.mjs`, `__tests__/criticalZone.test.ts`, `__tests__/bashGuard.test.ts`. Docs: the Phase 1 report `ddee7a09e`; this closure commit: `docs/HARNESS-DOCS.md`, the prompt file (Status), this inbox. Untracked, no commit: `.claude/settings.local.json` deleted.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `cd5eb9eb5`: `npx vitest run scripts/hooks` 233 passed (203 + 30), the 203 old tests unchanged; `check:docs` 4/4; `check:agents` green; `typecheck:scripts` exit 0; `check:scripts` pass. Mutation bench through `HOOKS_DIR`: 18 of 18 killed, listed in the body of `cd5eb9eb5`; control, an unmutated copy through the same path, 233 passed.
**Out-of-scope changes**: yes — `docs/HARNESS-DOCS.md` was outside the prompt's DOVE and joined by the GO, as DOVE provides; 10 files over the lane (6 code, 4 docs), above the P6 five, all declared in the prompt, the report or the GO. Nothing else.
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile — harness lane, nothing reaches the UI.
**Notes**: The `bypassPermissions` value on a hook's stdin is read from the docs and the 2.1.282 binary, not captured: capturing it needs a logging hook, which the prompt forbids (report §1.5). Gates ran through a temporary `node_modules` symlink (P14), removed at the end. The deny list refused an `rm -rf` of a bench copy, as designed; the copy stayed in the scratchpad.
**Prompt document name**: 2026-09-25 10:22

**Ticket** (opened, not fixed here). The `log-entry` skill, rule 6, says to commit the inbox alone; RC-17 and P13 put the inbox entry in the lane's closure commit with the Status line. This lane followed the GO and P13. `.claude/skills/log-entry/SKILL.md` needs the same change `status-flip` got here, in a lane that holds it.
