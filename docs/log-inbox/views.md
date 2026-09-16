# log-inbox — lane «views»

Entries written by the views lane while three sessions share this tree (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-09-16 — fix: the tree Create View entry resolves its viewpoint once and passes it
**Prompt**: `claude_2026-09-16_1115_prompt_rotta_archi_righe_decisioni.md`, **Fase 1** — the twin of
the defect Fase A removed from the v2 menu: `TreeViewContent.tsx:657` called
`createViewInWorkbench` with no viewpoint while the gate resolved at render, so a viewpoint
deactivated between render and click could file the view in `Pointer_ViewPointDefault`. Resolve once,
pass the id, keep `hasCreatableViewpoint()` as the gate. Hard stop after this; Fase 2 not started.
**Files touched**: `ca3fdaa99`: `components/TreeViewSidebar/TreeViewContent.tsx` only (the import and
`handleAddView` in `useClassifierContextMenu`). This entry, in this inbox, in its own commit.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. `npm run typecheck` exit 2, **33** on full output, set identical to the pre-edit
run (`diff` exit 0), **0** in the touched file, control `Measurable` → 6. `npx vitest run` **3643
passed, 0 failed**, the same 9 files red at import. `npm run build` exit 0, pre-existing warnings.
**Out-of-scope changes**: no.
**Layer Impact Report**: not-required — no §3.1 file, no D/L write path touched.
**Smoke visivo**: passato — `scripts/smoke/_tmp_gate_tree.ts` (gitignored) re-run after the edit,
**8 PASS 0 FAIL**: disabled and `Create View: open a viewpoint first` with nothing active; enabled
with «Gate VP» active; the view created in the ACTIVE viewpoint with a vertex `ir` pinned to the
class; field-by-field identical to what the `+` dialog makes for the same class.
**Notes**: Census asked by the prompt, after the fix: the live UI call sites of `createViewInWorkbench` all pass the 4th argument — `EditorV2.tsx:3274` and `:3323`, `TreeViewContent.tsx:664` and `:1957`. The only one without it is `ContextMenu.tsx:641`, inside the classic popup that cannot open (`ShowContextMenu` needs a `data-nodetype="Graph"` ancestor unmounted since Fase 5a). This is what makes «no view born from a user gesture lands in Default» true, with the four structural fallbacks untouched.
**Prompt document name**: 2026-09-16 11:15

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
**Notes**: One prompt premise is contradicted, in the report: `key_bindings` IS dispatched, by `Keystrokes.register('#root', …)` (`ContextMenu.tsx:711`, delegated `keydown` at `U.tsx:3535`) — registered and unreachable, not undispatched. Main finding: each creator is one piece short — `newDefault` has the row/edge seeds but no viewpoint parameter, `createViewInWorkbench` takes the viewpoint but has no `DAttribute`/`DReference` branch.
**Prompt document name**: 2026-09-16 09:51
