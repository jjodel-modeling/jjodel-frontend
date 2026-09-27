# log-inbox — lane «views»

Entries written by the views lane while three sessions share this tree (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-09-27 — fix(editor-v2): the Properties rail opens on the model (P-2026-09-27-0110)
**Prompt**: `claude_2026-09-27_0110_prompt_properties_rail_shows_model.md`, fast lane on `~/jjodel-release`. With no selection (tab open, pane click, `deselectAll`) the rail showed the root package or the first class: `findModelElement` walked `rawModel.packages`. Decision RC-25 of the prompt: it returns the model id in every case, signature kept, walk removed.
**Files touched**: code `cc2550779`: `frontend/src/components/editor-v2/hooks/useJjomSelection.ts` (`findModelElement` body and doc comment; its three callers unchanged). This commit: this entry, the Status line of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown — gates green on `cc2550779`: `npx tsc --noEmit` exit 2, 14 errors, the §17 set by file and code; `npx vitest run src/components/editor-v2` 74 files, 1634 passed; `npm run build` exit 0, 51 warning lines as the baseline. No test covers the hook; the rail is verified only by the chat's visual check.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required (no §3.2 file touched)
**Smoke visivo**: chat, localhost:3001 (pending: new metamodel, pane click after adding a class, class click, existing metamodel with classes)
**Notes**: Consumers read by body, all accept a DModel id: `selectors.ts:64,75`; `PalettePanel.tsx:103-107`; Jodie via `jjscript/executor/utils.ts:83,156` and `activeArtifact.ts:77`; `SaveManager.ts:63`; `PropertiesWithTreeView.tsx:536-548`; `Info.tsx:1592,1650-1668`. HEAD moved mid-session: the chat's `2124b64fe`, one prompt file, disjoint. Status flipped at the code commit as the prompt asks, not at the visual GO as P13 says.
**Prompt document name**: 2026-09-27 01:10
