# log-inbox — lane «smoke-baseurl»

Entries written by the smoke-baseurl lane while sessions share this tree (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-10-03 — feat: the visual smoke takes its server address from SMOKE_URL
**Prompt**: BASE_URL in smoke/states.ts was fixed to localhost:3000, so on a machine with nothing there the smoke ended RED with every state NOT REACHED, a statement about the machine. Read the address from SMOKE_URL, keep 3000 as the default, refuse port 3001 as hidden-tab-loop.ts does, document it in the README, and run the smoke once against a worktree dev server on 3016.
**Files touched**: frontend/scripts/smoke/states.ts, frontend/scripts/smoke/README.md (582ecb569); closure commit: docs/log-inbox/smoke-baseurl.md, docs/prompts/claude_2026-10-03_1000_prompt_smoke_baseurl.md
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato (smoke GREEN on 3016: 12 passed, 0 failed, 3 skipped, one boot per state, nothing moved; no human visual check, nothing on screen changes)
**Notes**: SMOKE_URL=http://localhost:3001 throws at import (exit 1, run.ts never starts); the check reads new URL().port, so a path or trailing slash does not slip past. No variable prints 3000 and, with nothing listening, ends RED with every state NOT REACHED: the old machine RED, kept by design. The 3016 run also printed IMPROVED for "wrong project setup in navbar" (2/2/3 to 0), baseline untouched. The prompt named no commit type (P6): feat chosen.
**Prompt document name**: 2026-10-03 10:00
