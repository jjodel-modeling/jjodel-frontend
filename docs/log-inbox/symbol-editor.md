# log-inbox — lane «symbol-editor»

Entries written by the Symbol Editor lane while three sessions share this tree (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-09-16 — feat: the Goal family, the cloud form and the two bar markers
**Prompt**: `claude_2026-09-16_1242_prompt_slice4a_famiglia_goal.md` — slice **4a**, the catalog half
of slice 4 split off from the 2h shell so it lands in parallel with slice 2. The whole shell half
(popover `variant='popover'`, 1b header, section nav and its badges, footer, `applyPresetToShape`
with `keepRules`) stayed out, as the prompt requires.
**Files touched**: `27f80d1ac`, 13 files, code only. The four the prompt names — `ir/irTypes.ts`
(`ShapeForm += 'cloud'`), `ir/shapeRegistry.ts` (the complete descriptor), `ir/markerRegistry.ts`
(`bar-top`, `bar-bottom`), `ir/notationCatalog.ts` (`CatalogFamily += 'Goal'`, nine presets) — plus
`ir/structureCapabilities.ts` (typecheck-forced: two `Record<ShapeForm, …>` tables), the three render
sites a new form must reach (`ir/irStyle.ts`, `authoring/SymbolPreview.tsx`,
`authoring/SymbolBoxPreview.tsx`), `authoring/VertexAuthoringPanel.tsx` (the one contended line), and
four test files (`shapeRegistry`, `notationCatalog`, `symbolRecognition`, `structureCapabilities`).
This entry in this inbox, in its own commit.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — verified on screen by Alfonso (ACK 2026-09-16), all four surfaces holding: the
Goal family at nine presets with the footer reading 56 presets and 5 families, the cloud in the
modal preview, the cylinder now drawing, and the cloud on the canvas with its label inside both at
small node size and enlarged. Gates: `npm run typecheck` exit 2, **33** on full output, set byte-identical to
the pre-edit run (`diff` exit 0), control `Measurable` → 6. `npx vitest run` on the two touched test
directories: **30 files, 711 tests, 0 failed** (pre-edit control on the six relevant files: 110
passed). `npm run build` exit 0, pre-existing chunk warning only.
**Out-of-scope changes**: yes — 9 files beyond the prompt's list, over the regola 19 threshold,
declared in chat before the diff and proceeded with under **RC-11**. Each is forced, not chosen:
`structureCapabilities.ts` by the compiler; `irStyle.ts` / `SymbolPreview.tsx` /
`SymbolBoxPreview.tsx` by acceptance criterion 2, which names the three places a form must survive;
the four test files by assertions that go red on a new form or a new notation, three of them by
design (`symbolRecognition.test.ts` exists to make a new ambiguity group a declared choice).
One of them is a **visible change outside the perimeter**, confirmed on screen: the **cylinder**,
which `SymbolBoxPreview` had been dropping because it narrowed on `kind === 'svg'` alone — the same
filter that kept the cloud out. Widening it for the cloud necessarily brought the cylinder back, so
the modal preview now paints a form it had never shown, ornament included. Not a choice of this
slice, and not reversible without losing the cloud.
**Layer Impact Report**: not-required — no §3.1 file touched, no D/L write path, no persistence.
`irTypes.ts` gains an optional union member: additive, no `irVersion` bump, no VersionFixer.
**Smoke visivo**: passato **as an offline geometry measurement, not on the running app**. The
silhouette and the 72×48 tile were rendered to PNG (`qlmanage`, scratchpad, gitignored) at three
aspect ratios with the 64% content rect overlaid: the rect sits inside the outline at 200×200,
320×120 and 130×220; the tile reads as a cloud at catalog weight beside the cylinder tile; and
Actor / Agent / Role differ by the bar alone, top and bottom (criterio 3). The canvas node and the
Symbol modal were not opened in that run; **Alfonso has since opened both (ACK 2026-09-16)** and the
four surfaces listed under **Regressions** hold, so the owed check is closed.
**Notes**: `nodeSizing.ts` deliberately NOT touched — `defaultResizableForForm` delegates to the descriptor, so editing it would be a dead write (§5 sub-rule). The contended `FORM_OPTIONS` line was free (file clean, no commit on it since the prompt's 12:42) and is written. The cylinder, invisible in the modal preview before this slice, is recorded under **Out-of-scope changes**.
**Prompt document name**: 2026-09-16 12:42
