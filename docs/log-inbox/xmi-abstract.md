# log-inbox — lane «xmi-abstract»

Entries written by the XMI import abstract-fallback lane on `xmi-abstract` (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-10-31 — fix(xmi): skip and count unknown or abstract classes on M1 import (P-2026-10-31-1411)
**Prompt**: XMI M1 import never instantiates a missing or abstract class: skip the object and its subtree, one warning per class with counts, drop and count references to skipped objects, fail with nothing written when every root is skipped (discovery P-2026-10-31-1342 point 5).
**Files touched**: `frontend/src/services/export/XMIService.ts`, `frontend/src/services/export/__tests__/xmi-import-skip.test.ts` (new) — ac7c92039
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Tests execute importM1FromXML on a fake D-layer and a minimal DOMParser (node, no jsdom); the known-classes write log was snapshotted on the pre-change code and matches. Mutation bench: nested abstract guard and dropped-ref branch each killed. Unknown wrapper root tags now skip instead of failing; interfaces count as abstract. Real D-layer and dialog not exercised in the app: Regressions unknown. Gates: tsc 0, vitest export 78/78, build 0.
**Prompt document name**: 2026-10-31 14:11
