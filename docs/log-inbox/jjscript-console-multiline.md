# log-inbox — lane «jjscript-console-multiline»

Entries written by the chat fix of the JjScript console's multi-line input (C-2026-11-02-0909),
branch `fix/jjscript-console-multiline`. Whoever closes the batch moves them into
`docs/claude-code-log.md` **verbatim and in this order** (RC-12) and empties this file. The active
log is not touched by this lane.

---

## 2026-11-02 — fix(jodie): run every line in the JjScript console (C-2026-11-02-0909)
**Prompt**: Juri in chat, no prompt file, during the smoke of #196 L5: two `create attribute` lines sent together in the JjScript console created only the first («solo un attributo creato»); diagnosis given in chat, then «applica la correzione». Branch from `staging` at `ad73e5f39`.
**Files touched**: commit `908ca99d5` (not pushed, not merged): `frontend/src/components/Jodie/console/providers/jjscriptProvider.ts` (modified), `frontend/src/components/Jodie/__tests__/jjscriptConsoleMultiline.test.ts` (new). This commit: this inbox, new.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Cause: the non-strict JjScript parse reads one command and drops the rest in silence. Test runs the real provider over a mocked jjscript barrel; the real `groupBlockCommands` is not exercised (executor.ts does not import in the bench). Mutation bench: forcing the one-command path kills 4 of 8. typecheck 0, build 0, vitest 438/12136 green, 9 red = §17. Browser smoke left to Juri, hence Regressions `unknown`.
**Prompt document name**: 2026-11-02 09:09

**Ticket** (found in this lane, not fixed): «Test in console mode» on a Jjodie reply always opens the JjEL console (`Jodie.tsx` handleTestInCode, TODO since 2026-04), so a JjScript snippet fails there with `Unexpected character: #` / `Unknown identifier create`. Owner area: Alfonso.
