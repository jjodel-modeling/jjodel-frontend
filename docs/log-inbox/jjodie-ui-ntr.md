# log-inbox — lane «jjodie-ui-ntr»

Entries written by the Jjodie non-text-reply lane (front jjodie-ui, branch `jjodie-non-text-reply`) in a file of its own, so parallel lanes do not collide (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-10-30 — fix: a Jjodie reply without text throws, not crashes the chat
**Prompt**: Claude reply whose first block is not text crashed the Jjodie panel (`reading 'match'`); join text blocks or throw on both provider paths, guard the two render helpers.
**Files touched**: `frontend/src/services/AIProviderService.ts`, `frontend/src/components/Jodie/ChatMessages.tsx`, `frontend/src/services/__tests__/AIProviderService.test.ts`, `frontend/src/components/Jodie/__tests__/chatMessagesContentGuard.test.ts` (new) — 8d5b5a1fe
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: yes
**Layer Impact Report**: not-required
**Smoke visivo**: passato — Alfonso, localhost:3020, 2026-10-30 14:36: Claude provider, no Try fallback
**Notes**: Check: (1) confirmed, current models run adaptive thinking when `thinking` is omitted, the unfixed code returned undefined (test red); (2) confirmed, the gate at Jodie.tsx:64 skips a falsy content, ChatMessages.tsx:114/425 match during render; (3) narrowed, history is in memory only (Jodie.tsx:146, :880): the crash lasts until reload; (4) confirmed, null passed through. Scope: two test files, not one; the two helpers are now exported for the guard test.
**Prompt document name**: 2026-10-30 12:15
