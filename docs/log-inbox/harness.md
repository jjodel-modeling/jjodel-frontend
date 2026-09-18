# log-inbox — lane «harness»

Entries written by the harness lane while sessions share this tree (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-09-18 — chore: P6 requires a Model trailer on every commit body
**Prompt**: `claude_2026-09-18_1940_prompt_model_trailer_obbligatorio.md` (P-2026-09-18-1940):
add to `docs/PROTOCOL.md` P6 the requirement that every commit body carry a
`Model: <vendor> <name> <version>` trailer naming the executing model, additive to
`Co-Authored-By`. One commit, PROTOCOL.md only; `CLAUDE.md` deliberately untouched (over its
40k limit, split is P-2026-09-18-1930).
**Files touched**: `97a41475e`, 1 file: `docs/PROTOCOL.md` (one paragraph added to P6 after the
commit-message paragraph; no existing line reflowed).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — docs only, no §3.1 file.
**Smoke visivo**: non applicabile
**Notes**: `npm run check:docs` 3/3 green after the edit (Check A: P9 byte-identical to §21.2).
The rule held at first application: `97a41475e` carries `Model: Z.ai GLM 5.3`. Follow-up
measurement: the next three commits. A gate refusing commits without the trailer is the natural
follow-up (`frontend/scripts/gates/`), stated in the closing report, not implemented today.
**Prompt document name**: 2026-09-18 19:40
