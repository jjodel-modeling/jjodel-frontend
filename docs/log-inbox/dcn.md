# log-inbox — lane «dcn»

Entries written by the DCN lanes on `dcn` (P9, parallel lanes). Whoever closes the batch moves them
into `docs/claude-code-log.md` **verbatim and in this order** (RC-12) and empties this file. The
active log is not touched by this lane.

---

## 2026-11-06 — feat: featureSources in the ontological binding, dormant slots in the feature closure
**Prompt**: DCN L2.1 (P-2026-11-06-2300): optional `featureSources` on `OntoBinding` (codec), applied by `featureClosure` from every classifier of the generalization closure with an additive `dormantOwner`, judged by `bindingCheck`; tests first, mutation bench, one code commit.
**Files touched**: d51def3e7 — `frontend/src/model/ontological/bindingCodec.ts`, `bindingReader.ts`, `bindingCheck.ts`, `__tests__/bindingCodec.test.ts`, `__tests__/bindingReader.test.ts`, `__tests__/bindingCheck.test.ts`; docs commit — `docs/log-inbox/dcn.md` (new), the prompt's Status
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Six code files, the Rule 19 deroga of the prompt. Bench 24/24 killed; an equivalent frontier dedup was dropped, a no-aliasing codec test added. Gates: typecheck 0, ontological 69/69, full run 3 failed files (the known three) / 533 passed, build 0. `dormantOwner` is present (possibly empty) whenever `featureSources` is, absent otherwise. The first hop is not checked against the classifier metaclass: the prompt did not ask it.
**Prompt document name**: 2026-11-06 23:00

## 2026-11-07 — merge: dcn-l21 into alfonso-frontend-jjtl (P-2026-11-06-2351)
**Prompt**: merge `dcn-l21` at `37fc696f7` into `alfonso-frontend-jjtl`, one `--no-ff` merge commit of the explicit sha, merge base `895669463`, in the shape of `59b532f43`; probes, gates, hard stop for the chat's GO.
**Files touched**: a743c3f37 — the 12 files of the branch (`docs/decisions.md`, the DCN foundations discovery, `docs/log-inbox/dcn.md`, three prompts, `frontend/src/model/ontological/binding{Check,Codec,Reader}.ts` and their tests); docs commit — `docs/log-inbox/dcn.md`, the prompt's Status
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Zero conflicts, no union. The tip moved to `65852b291` (another chat's docs commit) during the pre-merge gates; accepted as trunk, first parent of the merge. Probes 27/27, control R-MT-5 absent. Gates: typecheck 0, vitest 14491 (14489 + 2 skipped, the known 3 red at import; a first run in parallel with the build timed out two Chromium afterAll hooks, rerun alone clean), hooks 967/967, build 0, check:docs 5/5, agents, scripts, addonly PASS.
**Prompt document name**: 2026-11-06 23:51
