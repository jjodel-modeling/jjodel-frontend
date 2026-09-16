# log-inbox — lane «views»

Entries written by the views lane while three sessions share this tree (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-09-16 — discovery: the lost route to edge and row views (Fase B)
**Prompt**: `claude_2026-09-16_0951_prompt_menu_v2_viewpoint_e_rotta_archi_righe.md`, **Fase B**,
read-only: what the edge/row seeding needs from a caller, where the two entries could live (tree rows
vs v2 child menu), what depends on `key_bindings` and `closefunc`, plus the fourth question added in
chat — who else depends on priority 3 of `resolveParentViewpoint`. Fase A was committed earlier as
`86f822d50`.
**Files touched**: `a4ec9313d`: `docs/discovery/discovery_2026-09-16_rotta_archi_righe.md` (new, 173
lines). No file under `frontend/src` touched. This entry in `docs/log-inbox/views.md`, not in the
active log (P9, three lanes open).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — read-only phase, no code and no gate run; the Fase A gates are recorded in the
entry of `86f822d50`.
**Out-of-scope changes**: no.
**Layer Impact Report**: not-required — nothing modified.
**Smoke visivo**: non applicabile — no runtime surface changed. The runtime facts the report relies
on were measured in the previous phases (`_tmp_gate_keybind.ts`, `_tmp_gate_reach.ts`,
`_tmp_v2menu_verify.ts`, all gitignored).
**Notes**: One prompt premise is contradicted and the report says so: `key_bindings` IS dispatched, by `Keystrokes.register('#root', …)` at `ContextMenu.tsx:711` through a jQuery delegated `keydown` (`U.tsx:3535`) — it is registered and unreachable, not undispatched, which changes what a later slice should do. Main finding: the two creators are each one piece short — `newDefault` knows the row/edge seeds but has no viewpoint parameter, `createViewInWorkbench` takes the viewpoint but has no branch for `DAttribute`/`DReference`.
**Prompt document name**: 2026-09-16 09:51
