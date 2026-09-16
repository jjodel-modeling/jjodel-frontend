# Claude Code Session Log

Newest-first per day (R-RAIL-45, docs/HARNESS-DOCS.md): a new entry goes right under this line. Never append at the bottom.

**Incidenti — sanatoria batch L1–L4 (2026-09-02).** Tre commit del batch portano un
contenuto che il loro messaggio non descrive. Nessun rewrite di history: e' stato un
rewrite su albero condiviso a causare il secondo incidente. Formato «SHA -> contenuto reale».

- `50de03252` — messaggio: «la entry SAVE1-bis, il timer che non sopravvive all'errore».
  Contenuto reale: la sola entry **DIRTY1**.
- `f278cf4fb` — messaggio: «la entry DIRTY1, scritta dalla corsia L4». Contenuto reale:
  le entry **SAVE1-bis + DIRTY1**, entrambe.
- `ed5c80daa` — referto UNQ1 C5 che cita l'hash del codice sbagliato (`46a38022`, tolto dal
  ramo dal `reset` di un'altra corsia). Corretto in `ca0adaf95`, che lo riporta a `4bde4359`.

**Incidente — discovery parallele del 2026-09-13.** Due sessioni sullo stesso albero, entry
scritte nello stesso file prima di committare.

- `46f4f584d` — messaggio: «the simulation engine state discovery and its log entry».
  Contenuto reale: il report del motore e **due** entry, la sua e quella della discovery JjEL
  (`claude_2026-09-13_0100_...`), gia' su disco al momento del commit.
- `2d420c64f` — il solo report JjEL; la sua entry era gia' in `46f4f584d`.
  Lezione: due corsie parallele committano il log una alla volta, ciascuna dopo aver riletto la
  testa; lo stesso file non si mette in due commit sovrapposti.

**Incidente — log committato da un'altra corsia, 2026-09-16.** `9f0843325`, messaggio «log entry for
the Create View gate fix»: contenuto reale **due** entry, la sua e quella della discovery
rail/modale, gia' in albero e non in stage al momento del commit. Stesso schema del 2026-09-13.
Nessun rewrite: la entry resta dov'e', il suo commit non la nomina.

## 2026-09-16 — fix: Create View gated on the active viewpoint, not on a tracker nobody writes
**Prompt**: `claude_2026-09-16_0055_prompt_gate_create_view_sempre_chiuso.md` — replace
`!!getLastEditedViewpointId()` at the three gate sites with a predicate mirroring priority 2 of
`resolveParentViewpoint`, em dash → colon in the three disabled labels, tracker untouched. Run under
option 2 of the 01:20 chat instruction: measure the Ctrl+Alt+V path first, then commit unchanged,
then an `## Errata` on the prompt itself.
**Files touched**: `70bcbc5f8`: `utils/lastViewpoint.ts` (new `hasCreatableViewpoint`),
`TreeViewContent.tsx` (`:661` + label), `contextMenu/ContextMenu.tsx` (`:487`, `:531` + labels).
Docs in their own commits: this entry, and the Errata appended to the prompt.
**Outcome**: ⚠️ partial — acceptance criterion 3 is unattainable, withdrawn in the Errata.
**Corregge**: —
**Causa**: (c)
**Regressions**: no. `npm run typecheck` exit 2, **33** on full output, set identical to the pre-edit
run (`diff` exit 0), **0** in the three touched files, control `Measurable` → 6. `npx vitest run`
**3643 passed, 0 failed**, the same 9 files red at import as before the change (`diff` of the FAIL
lines, exit 0). `npm run build` exit 0, pre-existing warnings only.
**Out-of-scope changes**: no.
**Layer Impact Report**: not-required — no §3.1 file; the predicate only reads the project proxy.
**Smoke visivo**: passato on the one reachable site — `scripts/smoke/_tmp_gate_tree.ts` (gitignored),
**8 PASS 0 FAIL**: with no viewpoint active the tree classifier entry is disabled and reads
`Create View: open a viewpoint first`; with a non-system viewpoint active it is enabled, reads
`Create View`, creates the view in the ACTIVE viewpoint with a vertex `ir` pinned to the class, and
is field-by-field identical to what the `+` dialog makes for the same class (criterion 4: `ir`,
`appliableTo`, `appliableToClasses`, `oclCondition`, jsx). The two dead sites and the chord were
measured by `_tmp_gate_reach.ts` and `_tmp_gate_keybind.ts`; the latter carries an unbound chord as
its control, and the creator wrapped to say whether the handler ran at all.
**Notes**: (a) Census: `setLastEditedViewpoint` has NO caller, so the tracker reads null forever; kept as asked, for a later deliberate removal. (b) and (c) in full in the `## Errata` of the prompt: the two `ContextMenu.tsx` sites sit in a popup that cannot open (archive 2026-08-13 §8), and Ctrl+Alt+V never reaches its handler; forced on `#root` it does create edge and row views, then throws `closefunc is not a function`. No user gesture creates an edge or a row view today.
**Prompt document name**: 2026-09-16 00:55

## 2026-09-16 — discovery: the Properties rail paints over the Symbol Editor modal (phase 1)
**Prompt**: chat prompt, not a repo document: diagnose at runtime on the DOM why at ~1600px the rail
covers the modal's right column and eats the clicks on Fill and Marker; name the stacking chain, who
wins and why, regression or not, at which widths; report in `docs/discovery/`, then hard stop with no
fix, since slice 4 rewrites this modal shell. Found as a blocked click in the slice 1 probe.
**Files touched**: `docs/discovery/discovery_2026-09-16_rail_modal_stacking.md` (new),
`docs/discovery/harness/probe_2026-09-16_rail_modal_stacking.mts` (new). No source file touched.
This entry in its own commit.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — read-only task, zero source files modified.
**Out-of-scope changes**: no.
**Layer Impact Report**: not-required — no §3.1 file, no diff at all.
**Smoke visivo**: passato — probe `probe_2026-09-16_rail_modal_stacking.mts` on the live dev server,
**17 PASS 0 FAIL**, zero page errors, two screenshots read by eye. Answer: `#root` is `position:fixed`
(`index.scss:31`) so it creates a stacking context at level 0, the rail is `createPortal` onto `body`
at 900, so the modal's 1050 never enters the comparison. Three runtime experiments separate the
diagnosis from the alternatives, E3 being decisive: a `z-index: 999999` fixed div inside `#root` is
still covered. Not a regression: inverted since the modal was born (`36a789a53`, 2026-08-15 16:58),
visible at 1600 since it grew 640→1040 the same day (`70c33827d`, 17:51). Exactly D-UI-14, applied to
`ValidationRulesModal` on 2026-09-09 and never to this one.
**Notes**: Blocked below ~1785px with the default 400px rail (measured 1780 → 4 blocked, 1788 → 0; box overlap ends at 1840). Correction to the premise: Fill is blocked, **Marker is not** — it sits in the left column; the blocked set is Fill, Sizing and the modal's own ×. Same shape, unmeasured, in `ValidationResultsModal` and `ImportSummaryModal`. Side fact: `--z-modal` resolves to **1050**, not the 9999 the SCSS declares (`tokens.css:204` wins). Fix options in §9, none applied.
**Prompt document name**: 2026-09-16 09:05

## 2026-09-16 — feat: cornerRadius axis, rounded polygon painter and the Shape control (slice 3)
**Prompt**: `2026-09-15_1830_slice-3_corner-radius.md`, with the nine answers of
`2026-09-16_ack-slice-3_corner-radius.md` (commit `1f93c6a7e`). Two-phase: phase 1 report
`docs/discovery/discovery_2026-09-16_corner_radius_axis.md` (`b87ace74c`), GO given in the ACK.
**Files touched**: 12, in two commits, as the ACK ordered (slice 1 owned
`VertexAuthoringPanel.tsx` this round; its commit `aeb0c9134` landed first).
`8da572191`, 11 files: `irTypes.ts` (`ShapeSpec.cornerRadius?: number` + doc comment with the
ignore list), `irValidate.ts` (numeric guard beside padding), `shapeRegistry.ts`
(`honorsCornerRadius`, `authoredCornerRadius`, `baseCornerRadius`, `clampCornerRadius`,
`resolveCornerRadius`, `roundedPolygonPath`), `IRNodeContent.tsx` (`useCornerBox` +
`svgOutline(…, roundedD)` + inline radius), `SymbolPreview.tsx` (optional prop, tile ratio 0.7),
`SymbolBoxPreview.tsx` (optional prop, same painter), `SymbolEditorModal.tsx` (the only caller that
passes it), `DynamicHandles.tsx` (TODO only), plus `shapeRegistry.test.ts`, `irValidate.test.ts`,
`symbolRecognition.test.ts`. `b1abdc6f1`: `VertexAuthoringPanel.tsx` (Shape section only —
stepper, greyed base + Reset, three live glyphs, help text; `resetCornerRadius`). This entry in its
own commit.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. `npm run typecheck` exit 2, **33** `error TS` on full output, set identical to
the pre-change run (line-stripped `diff` exit 0), **0** in the 12 touched files, control
`Measurable` → 6. `npx vitest run` on the touched areas: **247 passed, 0 failed** over 10 files.
`npm run build` exit 0, only the pre-existing warnings (chunk size, sass deprecations, `bordr`).
Mutation bench, 8 mutations one at a time on committed files, each restored with `git checkout
HEAD --`: clamp /4→/2 (1 red), gate + circle (2), no half-edge clamp (2), `authoredCornerRadius`
accepts negatives (3), CSS radius unclamped (1), validator guard off (2), recognition reads the
radius (1), preset drops the radius (1). Unmutated baseline 86 green.
**Out-of-scope changes**: yes, declared and authorized by the ACK: `SymbolEditorModal.tsx`,
`irValidate.test.ts` and `symbolRecognition.test.ts` were not in the prompt's DOVE. 12 files: rule
19 threshold passed, list confirmed in the ACK (RC-11).
**Layer Impact Report**: produced — discovery report §5. CLAUDE.md §3.1 lists `viewpoint/ir/` and
`viewpoint/authoring/` as critical zone while the prompt said no critical-zone file was in scope;
the conflict was reported and the ACK settled it for CLAUDE.md.
**Smoke visivo**: passato — probe `scripts/smoke/_tmp_s3radius_verify.ts` (gitignored) on the live
dev server, **35/35 PASS, zero page errors**, plus four screenshots read by eye.
**Notes**: Reset left the KEY `undefined` (`patchShape` spread); rest/spread (`omitForm`) fixed
it: no key after Reset. Canvas: absent → no inline radius (rect 4px, rounded 10); -5 as absent;
circle 50%; r=20 on 198x40 → 10px; polygons 1 path, viewBox `0 0 w h`, ring/band/2 strokes on one
`d`; observer follows resize; viewBox zoom-immune 1→2. A run VOID (build running, nothing painted,
10 FAILs); it now waits, exits 2. ACK 3 deviation: observer also on rect/rounded with a radius,
ACK 4's clamp needs a box.
**Prompt document name**: 2026-09-15 18:30

## 2026-09-16 — feat: edit conditional axes as a rules table, add formatPredicate
**Prompt**: `docs/prompts/2026-09-15_1830_slice-1_rules-editor.md`, with the answers of
`docs/prompts/2026-09-16_ack-slice-1_rules-editor.md` (Q1 opt-in on Fill and Marker only, Q1b the
`TextStyleEditor.flip` bug, Q2 up/down buttons, Q3 `{rules: [], default}`, Q4 explicit Otherwise,
Q5 absence as the canonical none, Q6 per-axis middle label, Q7 `subjectName` and chips out of
scope, Q8 what `formatPredicate` prints, Q10 the stale help text, Q11 panel ownership).
**Files touched**: code, commit `aeb0c9134`: `ui/ConditionalEditor/conditional.ts` (`RulesForm`,
`toRules`, `fromRules`, `formatPredicate`), `ui/ConditionalEditor/ConditionalEditor.tsx` (optional
`rulesTable` prop + `RulesModeEditor`), `ui/ConditionalEditor/ConditionalEditor.module.css`, new
`ui/ConditionalEditor/__tests__/conditional.test.ts` (46 tests), `authoring/VertexAuthoringPanel.tsx`
(3 lines: Fill, Marker, the Basic-mode help text), `authoring/TextStyleEditor.tsx` (`flip` reads
through `toRules`). Docs in their own commits: this entry and the TECH-DEBT ticket for the
suggestion chips. Phase 1 report: `discovery_2026-09-16_rules_editor_format_predicate.md`
(`b9ff7f36a`).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. `npm run typecheck` exit 2, **33** `error TS` on full output (the §17
baseline), same set line-stripped as the pre-edit run (`diff` exit 0), **0** in the six touched
files; positive control `Measurable` → 6. `npx vitest run src/components/ui
src/components/editor-v2/viewpoint/ir src/components/editor-v2/viewpoint/authoring`: 34 files,
**792 passed, 0 failed** (26 files / 586 before this slice, on ui + ir alone). `npm run build`
exit 0, only the pre-existing chunk-size warning. Mutation bench on `conditional.ts`: **10/10
killed**, source restored (`cmp` exit 0). The tenth needed a test that reaches the guard (a
self-referencing predicate): the try/catch survived every malformed input already covered.
**Out-of-scope changes**: yes, both granted by the ACK: `TextStyleEditor.flip` (Q1b — on a `rules`
value `.then` is `undefined` and the ƒx button unset the axis) and the help text at
`VertexAuthoringPanel.tsx:423` (Q10). Six files, over rule 19's threshold, every one named by the
prompt or the ACK; declared here as RC-11 requires.
**Layer Impact Report**: not-required — no critical-zone file (§3.1); no TRANSACTION, no D-layer
write, no persistence change (the IR keeps the shapes `irCompile` already compiles).
**Smoke visivo**: passato — Playwright probe `scripts/smoke/_tmp_rules_editor_verify.ts`
(gitignored) on the live server: **30 PASS, 0 FAIL, 0 page errors**, over a real M2/M1 fixture with
the IR demo viewpoint active. It measures the IR after each gesture, the canvas colour per instance
(reorder flips Idle from green to red live), the popover on top at its own pixel
(`elementFromPoint`), Esc closing the popover and not the modal, and the three write rules. Plus the
2b and 2i screenshots read by eye. `npm run smoke` came back **VOID** twice, not failed: slice 3 was
editing `irValidate.ts`, `notationCatalog.ts` and `shapeRegistry.ts` under the run (8 boots of
`empty-project`). Reported with its cause as P8 asks.
**Notes**: Reorder is up/down buttons (ACK Q2), not the mockup's ⋮⋮ handle: no drag library exists in the repo. Measured at 1600px the Properties rail paints over the modal's right column and intercepts every click on Fill and Marker — a pre-existing layer, not this slice; the probe runs at 2400. This entry sits in `docs/log-inbox/` and not in the log itself: parallel lanes (P9), as slice 3 did.
**Prompt document name**: 2026-09-15 18:30

## 2026-09-16 — feat: the viewpoint + asks what the view applies to and seeds its IR
**Prompt**: `claude_2026-09-16_0027_prompt_plus_dialogo_nuova_view.md` — `+` opens «New view» with
one question: a class (→ `createViewInWorkbench(…, 'DClass', vp.id)`) or «All classes (default view)»
(→ `createBlankViewInViewpoint` seeded with the wildcard vertex IR and `appliableTo: 'Vertex'`). No new
discovery: it stands on `discovery_2026-09-15_plus_view_ir_seed.md` (`b0b70bd54`), not contradicted.
**Files touched**: `1731cbc66`: `components/project/NewViewDialog.tsx` (new, on `NewViewpointDialog`'s
classes and radio cards), `utils/lastViewpoint.ts` (seed in `createBlankViewInViewpoint` only),
`TreeViewSidebar/TreeViewContent.tsx` (`collectNewViewClasses`, dialog state and submit in
`ViewpointNode`, `metamodels` passed at its 3 mount sites). This entry in its own commit.
**Outcome**: ✅ completed
**Corregge**: 2026-09-16 00:11
**Causa**: (f)
**Regressions**: no. `npm run typecheck` exit 2, **33** on full output, set identical to the pre-edit
run (`diff` exit 0), **0** in the touched files, control `Measurable` → 6; re-run after the focus
experiment was reverted, same result. `npx vitest run` **3581 passed, 0 failed**, 9 files red at
import, the pre-existing set. `npm run build` exit 0, pre-existing warnings (`bordr`, sass).
**Out-of-scope changes**: yes — in `TreeViewContent.tsx`, beyond `handleAddView` and the dialog state:
the `collectNewViewClasses` helper and the `metamodels` prop at the 3 `ViewpointNode` mount sites. The
tree's class source lives in the parent's props, so the row had no other way to reach it.
**Layer Impact Report**: not-required — no §3.1 file; `new2` is called bare, no outer TRANSACTION.
**Smoke visivo**: passato — `scripts/smoke/_tmp_plusdlg_verify.ts` (gitignored), live dev server,
**37 PASS 0 FAIL**, screenshots read. Criteria 1-6 each measured: Cancel/Escape leave `subViews`
unchanged; the class view equals the one from the M2 canvas class menu on `ir`, `appliableTo`,
`appliableToClasses`, `oclCondition`, jsx; IR tabs `Applies to · Structure · Symbol · Form · Source`;
canvas rows 1 and 2 of the Fase 1 table as predicted; the CREATE payload already carries `ir`, with no
later `ir` write (control: a view whose `ir` is written afterwards shows both). Survived the first run
and replaced: a state-level spy whose control stayed green, since `TRANSACTION` is async.
**Notes**: Class source: the tree's `metamodels` prop (`buildPackageData`). No portal: overlay 1440×900, Confirm on top by `elementFromPoint`. Pre-existing, untouched: `.dialog-header { display: none }` (`alert/style.scss:111`) hides every dialog header; `setLastEditedViewpoint` has no callers; the rename input is never focused, before (focus stays on `+`) and after (`BODY`), measured by `_tmp_plusdlg_focus.ts`. TODO: `MatchingSection` commits `metaclasses: []` 300 ms after the wildcard toggle-off.
**Prompt document name**: 2026-09-16 00:27

## 2026-09-16 — fix: New Viewpoint dialog, gating reason moved into the hint
**Prompt**: chat prompt, not a repo document: in `NewViewpointDialog.tsx` only, restore the four
disabled types' descriptions and put `Only Syntax can be chosen here.` in the hint under the select,
as ONE child span of the flex `.form-hint` (`create-project-dialog.scss:312`). Verify on screen.
**Files touched**: `98e6fd6cb`: `frontend/src/components/project/NewViewpointDialog.tsx` (4
descriptions restored, `enabled` and `disabled={!t.enabled}` kept; hint = one `<span>`: description,
period, gating sentence). This entry in its own commit.
**Outcome**: ✅ completed
**Corregge**: 2026-09-15 13:51
**Causa**: (a)
**Regressions**: no. The five descriptions compared byte for byte with `fe7a33073`, `diff` exit 0.
`npm run typecheck` exit 2, **33** on full output, set identical to the previous run (`diff` exit
0), **0** in the file, control `Measurable` → 6. `npm run build` exit 0, pre-existing warnings. No
vitest suite covers the dialog.
**Out-of-scope changes**: no.
**Layer Impact Report**: not-required — no critical-zone file (§3.1).
**Smoke visivo**: passato — Playwright probe `scripts/smoke/_tmp_vpdlg_verify.ts` (gitignored) on the
live dev server, 8 PASS 0 FAIL, plus the dialog screenshot read by eye.
**Notes**: Measured with Syntax selected: `.form-hint` is `display:flex` with exactly one child node, a SPAN; text `Exclusive view — defines the concrete syntax of a model. Only Syntax can be chosen here.`, one box wrapping to two lines. Keyboard (ArrowDown, End) on the closed select leaves the value on `syntax`: the disabled options are unreachable, which is the premise of this fix. Causa (a): the 13:51 prompt's keyboard premise for the appended reasons was wrong.
**Prompt document name**: 2026-09-16 00:03

## 2026-09-15 — feat: Decoration viewpoint type gated too (prompt revision 14:05)
**Prompt**: `claude_2026-09-15_1351_prompt_viewpoint_type_gating_form_theme.md` as revised in
`1ed86ab0e`: `syntax` is the only selectable type; `decoration` disabled with its own reason, hint
text changed. Applied on top of `d039fc7e7`, which carried the rest of the prompt.
**Files touched**: `9335f4417`: `ViewpointProperties.tsx` (decoration
`enabled: false` + reason, hint `Only Syntax can be chosen here.`), `NewViewpointDialog.tsx`
(decoration `enabled: false`, reason appended). `properties.scss` and the test unchanged since
`d039fc7e7`. This entry in its own commit.
**Outcome**: ✅ completed
**Corregge**: 2026-09-15 13:51
**Causa**: (f)
**Regressions**: unknown, until the visual check. New measurements re-verified: `getViewpointType`
falls back to `decoration` at `viewpoint.ts:17-22`, `VP_Decorative` at `selectors.ts:558`; neither
touched. `npm run typecheck` exit 2, **33** on full output, set identical to the post-`d039fc7e7`
run (`diff` exit 0), **0** in the touched files, control `Measurable` → 6. `npx vitest run` **3581
passed, 0 failed**, the same 9 files red at import. `npm run build` exit 0, pre-existing warnings only.
**Out-of-scope changes**: no.
**Layer Impact Report**: not-required — no critical-zone file (§3.1).
**Smoke visivo**: non eseguito — spetta ad Alfonso: acceptance criteria 1-3 of the revised prompt.
**Notes**: The dialog reuses the panel's verbatim decoration reason, so the New Viewpoint hint says «not created from this panel» inside a dialog. The test is untouched: it pins the Form theme removal, not the type list. The earlier finding stands: a disabled `<option>` cannot become the select's value, so the appended reasons likely never show in the dialog hint.
**Prompt document name**: 2026-09-15 13:51

## 2026-09-15 — feat: viewpoint type gating, Form theme select dropped from ViewpointProperties
**Prompt**: `claude_2026-09-15_1351_prompt_viewpoint_type_gating_form_theme.md` — only `syntax` and
`decoration` selectable (validation, semantics, editor_behavior visible and disabled, in the rail
segmented control and the New Viewpoint dialog); the dead Form theme field leaves the viewpoint panel.
**Files touched**: `d039fc7e7`: `ViewpointProperties.tsx` (options gated with `enabled`/`reason`,
one hint line; Form theme block, `FORM_THEME_INHERIT`, `useSelector`, `jjform` import and the STYLE2/UX1
comments removed), `properties.scss` (1 line, hover skips `:disabled`), `NewViewpointDialog.tsx`
(`enabled`, `disabled` options, reason appended to descriptions), `viewpointThemeHint.test.ts`
(rewritten, 5 tests). This entry in its own commit.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown, until the visual check. Measurements of the prompt re-verified before the
edit, none contradicted: `IRForm` mounted only with `host="manager"` (`InstanceManagerTab.tsx:3036`,
`:3070`), `viewpointOfHost` at `IRForm.tsx:190-192`, rung 0 at `:232-236`, the `default:` branch at
`ProjectEditor.tsx:1216-1219`, `vpType === 'syntax'` the only test at `TreeViewContent.tsx:3091` and
`ProjectEditor.tsx:2895`. `npm run typecheck` exit 2, **33** `error TS` on full output before and
after, the two sets line-stripped `diff` exit 0, **0** in the four touched files; control `Measurable`
→ 6. `npx vitest run` **3581 passed, 0 failed**, 9 files red at import (`window is not defined`), the
pre-existing set; 3592 − 16 old tests + 5 new = 3581. `npm run build` exit 0, chunk-size warning, sass
deprecations and the `bordr` line, all pre-existing.
**Out-of-scope changes**: no.
**Layer Impact Report**: not-required — no critical-zone file (§3.1).
**Smoke visivo**: non eseguito — spetta ad Alfonso: acceptance criteria 1-3 of the prompt.
**Notes**: The test is SOURCE-TEXT, with no mutation bench: its subject is the presence of a control in a file, not a behavior; `>Form theme<` found in the DM panel is the signal of the absent one. Stale, out of scope: `DataManagerViewpointPanel.tsx:54` still says this test forbids `LProject.getProject`/`viewpoints`/`_lastSelected`. A native disabled `<option>` cannot become the select's value, so the appended reason likely never shows in the dialog hint.
**Prompt document name**: 2026-09-15 13:51

## 2026-09-15 — chore(release): lanes C, G, B2 and D cherry-picked onto alfonso-frontend-jjtl
**Prompt**: `claude_2026-09-15_1130_prompt_cherrypick_cgb2d_release_payload.md` — GO given after the
visual verification. Pick the four code commits in the order C → G → B2 → D in the `~/jjodel-release`
worktree (§6.5), gates on the destination branch, no push, no release lane.
**Files touched**: no source touched in this run: the four commits are carried **as-is** with
`git cherry-pick -x`, not rewritten. Two docs files, in separate commits: the prompt (`afecbb8f0`)
and this entry. All four picks clean, no conflict:

| lane | source (`validation-skeleton`) | destination (`alfonso-frontend-jjtl`) |
|------|--------------------------------|---------------------------------------|
| C — types resolved through admissible kinds | `3e3ab691a` | `adb9bfa3f` |
| G — qualified type names parse in create/returnType | `2a1619653` | `b934d5124` |
| B2 — Jjodie writes into the scope shown | `de77f22af` | `fccaeb0e0` |
| D — `generateUniqueModelName` delegates | `284576f94` | `d6dbf7bfe` |

Destination tip `d6dbf7bfe`, on top of the lane A tip `e82831264`. Each destination carries one
`(cherry picked from commit …)` line and the same patch as its source: `--stat` file lists identical,
`git patch-id --stable` identical for all four.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates in `/Users/alfonso/jjodel-release/frontend` with `node_modules` as a
temporary symlink, removed at the end; `git status` empty in that worktree before and after.
`npm run typecheck` exit 2, **14** `error TS` on full output = that branch's baseline, **measured in
the same run** on a detached worktree at `e82831264` (removed with `git worktree remove` + `prune`):
same set line-stripped, `diff` exit 0, with only `ChatMessages.tsx` 262 → 271 and `ProjectEditor.tsx`
225 → 226 shifted by the diffs, exactly as the B2 and D entries recorded; **0** errors in the other
18 files the picks touch, checked one by one. Positive controls with signal, same file same tool:
`src/` → 14, `Measurable` → 6. `npm run build` exit 0, the chunk-size warning plus the pre-existing
sass `@import` deprecations and the two `bordr` CSS lines. `npx vitest run src/jjscript
src/services/__tests__`: **350 passed, 0 failed** over 11 files, against 309 over 9 on the base;
one file red at import in both, `context-binding.test.ts`, `window is not defined`, pre-existing.
New suites green: `resolvers` 65, `scopeGuard` 16, `JjodieRagService` 7.
**Out-of-scope changes**: no.
**Layer Impact Report**: not-required — no critical-zone file (§3.1).
**Smoke visivo**: non applicabile in this run — the GO on C, G, B2 and D was given before it.
**Notes**: D's source commit is mixed (code + `docs/discovery/discovery_2026-09-14_unique_model_name_delegation.md`), so the pick carries that report onto the release branch: the sha was picked as named, rather than split, which would have broken the «same files, same counts» check of step 5. Not pushed, release lane not run. The release prompt's `frontend/` commit counts are to be re-measured before it runs.
**Prompt document name**: 2026-09-15 11:30

## 2026-09-15 — docs: two process rules in CLAUDE.md (static tests, scope of regenerated artifacts)
**Prompt**: `claude_2026-09-15_1030_prompt_lane_h_claude_md_two_rules.md` — add the two rules
learned on 2026-09-14: a source-text test needs a mutation bench to be allowed, and a prompt
scope that names a file with a regeneration rule names the regenerated artifact too.
**Files touched**: `18d615cc2`: the prompt file. `74d0f81db`: `CLAUDE.md` (+12) and the
regenerated `AGENTS.md` (+12). This entry in its own commit. `frontend/src/jjtl/AGENTS.md`
regenerated identical, not staged.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — docs only, no code touched. `npm run check:agents` PASS (2 projected files
aligned), `npm run check:docs` PASS 3/3 with the 2 pre-existing warnings. Both run from
`frontend/` (there is no root `package.json`; from the repo root npm exits ENOENT).
**Out-of-scope changes**: no.
**Layer Impact Report**: not-required — no critical-zone file (§3.1).
**Smoke visivo**: non applicabile — no runtime surface.
**Notes**: Rule 1 landed as a new sub-rule at the end of §5, after «the interactive grep is not the
system grep»; the §5 sub-rules already cover verification discipline in general. Rule 2 landed as
rule 1c in the NON-NEGOTIABLE block, next to 1b, which already handles a §3 rule overriding the
declared scope. No section was reorganized.
**Prompt document name**: 2026-09-15 10:30

## 2026-09-14 — fix(B2): Jjodie writes into the scope shown to the model
**Prompt**: `claude_2026-09-14_1730_prompt_lane_b2_jjodie_scope_fix.md` — option S (scope stamped on
the reply, carried to Run), V1 as an explicit error, V3 refused out of scope, qualified RAG names.
Two-phase, hard checkpoint answered: one pre-check guard, 13 files, offer/JjScript mode unchanged,
bare cross-metamodel types refused.
**Files touched**: `ad32a8ea8`: `docs/discovery/discovery_2026-09-14_jjodie_scope_fix_targets.md`
(at the checkpoint). `de77f22af`: `types/jodie.ts`, `Jodie/Jodie.tsx`, `Jodie/ChatMessages.tsx`,
`services/JjodieContext.ts` (private → public), `services/JjodieRagService.ts`,
`jjscript/services/JjScriptService.ts`, `jjscript/types.ts`, `executor/executor.ts`,
`executor/utils.ts`, `commands/create.ts` (1 line), new `executor/scopeGuard.ts`; new tests
`executor/__tests__/scopeGuard.test.ts` (16), `services/__tests__/JjodieRagService.test.ts` (7).
This entry in its own commit.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown, until the visual check. Gates: `tsc --noEmit` exit 2, **33** on full output
(baseline measured before the edits, identical but one line), **0** in 12 touched files, **1** in
`ChatMessages.tsx`, the pre-existing TS2322 moved 262 → 271; control `src/` → 69. `vitest` guard + RAG +
`resolvers.test.ts` **88/88** (65 before); full run **3592 passed, 0 failed**, 9 files red at import
(`window is not defined`), the pre-existing set. Mutation bench **7/7** killed, sources restored
(`diff -q`). `npm run build` exit 0: chunk warning, plus a `bordr` CSS warning not from this lane.
**Out-of-scope changes**: yes — 13 files over rule 19's threshold, declared and confirmed at the
checkpoint. `getDefaultParent` now honours `context.targetMetamodelId` JjScript-wide; typed commands
pass the active metamodel there, same answer.
**Layer Impact Report**: not-required — no critical-zone file (§3.1).
**Smoke visivo**: non eseguito — spetta ad Alfonso: V1, V2, V3 of the report and the `A::Person`
escape hatch.
**Notes**: Test gap: the `.tsx` stamping/binding and the V1 line, `JjScriptService`, the executor call
site and `utils.ts` do not import under node; verified by hand only, no source-text tests. The guard
reads kinds by label: a case-only in-scope match of the same kind shelters a name (report §6). Lane G
landed during the run: `create … type A::X` now parses.
**Prompt document name**: 2026-09-14 17:30

## 2026-09-14 — fix(jjscript): i nomi di tipo qualificati parsano in create e returns
**Prompt**: `claude_2026-09-14_1731_prompt_lane_g_parser_qualified_type.md` — two-phase con gate
condizionale: far arrivare a `parseTypeReference` la stringa che si aspetta, senza toccare
`create.ts` (corsia B2 in corso su quel file).
**Files touched**: 3 in tre commit. Codice e test (`2a1619653`): `frontend/src/jjscript/parser/parser.ts`,
`frontend/src/jjscript/__tests__/parser.test.ts`. Docs: il referto
`docs/discovery/discovery_2026-09-14_parser_qualified_type.md` (`240f5af1f`) e questa entry.
`create.ts`, `set.ts`, `resolvers.ts` non toccati, come il prompt impone. I due
`ValidationRulesModal.*` sporchi di un'altra corsia lasciati dove sono, RC-13; nessuno `stash`.
**Outcome**: ✅ completed
**Corregge**: 2026-09-14 16:31
**Causa**: (c)
**Regressions**: no. Il ramo `IDENTIFIER`/`KEYWORD` di `expectIdentifierOrQualified` ritornava gia'
una stringa e la riceve invariata: per un nome non qualificato il percorso e' identico, e tre test
di controllo lo fissano (`type Mood`, `type int`, `returns Result`, `returns int`).
**Out-of-scope changes**: no. Aggiunto `qualifiedNameToString` all'import da `./grammar` gia'
esistente in `parser.ts`, che e' completamento normale di un file dichiarato.
**Layer Impact Report**: not-required — nessun file di §3.1; il parser non tocca D-layer, L-layer,
sync o persistenza.
**Smoke visivo**: **non eseguito in questo giro** — spetta ad Alfonso su localhost
(`create attribute age in Person type Mood2::Level`). Al suo posto i gate: `npm run typecheck`
exit 2, **33** righe `error TS` su output completo (la baseline di §17), **0** in ciascuno dei due
file toccati contate una per una, con controllo positivo che ha segnale sullo stesso output
(`src/` → 69); `npx vitest run src/jjscript/__tests__/parser.test.ts src/jjscript/__tests__/grammar.test.ts`
**170 passati, 0 falliti**; `npx vitest run src/jjscript` **333 passati** (erano 326), 9 file su 10 —
il decimo, `context-binding.test.ts`, fallisce all'import con `window is not defined` e il fallimento
e' stato **misurato pre-esistente su questo HEAD** ripristinando i due file da `git show HEAD:<path>`
e rieseguendo, poi rimessi a posto da copia con `diff` a zero e indice mai toccato (§6.4);
`npm run build` exit 0, solo il warning di chunk-size noto.
**Notes**: Adottata la forma piccola: `expectTypeNameString` serializza il solo ramo oggetto, la
firma di `parseTypeReference` resta `(raw: string)`. Lecito perche' il round trip e' esatto su ogni
forma che il lexer produce qui (referto §4). La corsia C aveva rilevato il difetto e lo aveva
lasciato fuori perimetro su ratifica: `Corregge` punta a quel giro. Fuori perimetro e non toccato:
`type List<String>` non raggiunge mai il ramo collezione (referto §7).
**Prompt document name**: 2026-09-14 17:31

## 2026-09-14 — docs(F): worktree and cherry-pick rule in CLAUDE.md
**Prompt**: `claude_2026-09-14_1633_prompt_lane_f_claude_md_worktree_rule.md` — record the
2026-09-14 worktree incident as a rule in the git section of `CLAUDE.md`, one subsection, English.
**Files touched**: `686a13712`: `CLAUDE.md` (new §6.5 after §6.4, +25; no cherry-pick section
existed) and `AGENTS.md` (regenerated, +25). This entry in its own commit.
**Outcome**: ⚠️ partial
**Corregge**: —
**Causa**: (a)
**Regressions**: no — docs only. `npm run check:agents` exit 0, `npm run check:docs` exit 0
(3/3, 2 pre-existing warnings on 2026-09-02 entries).
**Out-of-scope changes**: yes — `AGENTS.md`, which §17 requires in the same commit as `CLAUDE.md`.
**Layer Impact Report**: not-required — no critical-zone file (§3.1).
**Smoke visivo**: non applicabile — docs only.
**Notes**: Last bullet not written as dictated. The only tracked `eval.ts` is
`jjscript/executor/commands/eval.ts`, last changed 2026-09-09 on `validation-skeleton` and
2026-08-30 on `alfonso-frontend-jjtl`; `git diff --quiet` between them exits 1 today and at
`dc5f8d3aa`/`e82831264` (control `App.tsx` exits 1). It never stopped differing: the rule is kept,
the example is dropped.
**Prompt document name**: 2026-09-14 16:33

## 2026-09-14 — discovery(B): Jjodie metamodel scope, and where a Jjodie write lands
**Prompt**: `claude_2026-09-14_1630_prompt_lane_b_jjodie_scope_discovery.md` — read-only:
`resolveMetamodelScope`, `findClassByName` and its call sites, whether Jjodie goes through
`selectTarget`, what the LLM sees, a localhost repro, the two fix options with their cost.
**Files touched**: `767220122`: new `docs/discovery/discovery_2026-09-14_jjodie_metamodel_scope.md`.
This entry in its own commit. No source touched. `resolvers.ts`, `create.ts`, `set.ts` were read
clean at `26d04febc`; lane C's edits to them appeared later and were left as they are (RC-13).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — read-only run, no source modified.
**Out-of-scope changes**: no.
**Layer Impact Report**: not-required — no critical-zone file (§3.1).
**Smoke visivo**: non applicabile — read-only run. In its place `npx vitest run` on
`resolvers.test.ts`, 54/54, before lane C's edits. The Q6 repro is pending Alfonso on localhost.
**Notes**: `JjodieActionExecutor` has 0 importers on both branches and since its creation
(`75fe8f2f5`): the defect as described is unreachable. 14 call sites, not 13. Live Jjodie writes go
through JjScript: with `B` focused, `create attribute age in Person` lands in `B`. Writes outside the
scope remain via `metamodels[0]`, the scope read at Run time, and the project fallback (report §3 Q6).
**Prompt document name**: 2026-09-14 16:30

## 2026-09-14 — refactor(D): generateUniqueModelName delegates to uniqueModelName
**Prompt**: `claude_2026-09-14_1632_prompt_lane_d_unique_model_name_delegation.md` — compare the
two copies of the `(n)` rule on pool, suffix format and a base ending in `(n)`; delegate if the
pool is a parameter.
**Files touched**: `284576f94`: `components/project/ProjectEditor.tsx` (1 import, body → one
`return uniqueModelName(...)`, JSDoc; +4 −24) and the new
`docs/discovery/discovery_2026-09-14_unique_model_name_delegation.md`, together as the prompt
names them (a mixed commit, flagged against §6.4). This entry in its own commit.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown, until the visual check below. Gates: `npx tsc --noEmit` exit 2,
**33** `error TS` on full output before and after, same set line-stripped (`diff` exit 0);
`ProjectEditor.tsx` holds only the baseline error (225 → 226, shifted by the import); positive
controls `src/` 33, `Measurable` 6. `npx vitest run` on the three `nameLookup`/`uniqueModelName`/
`getByNameKey` tests 33/33. `npm run build` exit 0. No new test: `ProjectEditor.tsx` is not
importable in the bench (`window`); the rule is covered by the existing `nameLookup.test.ts`.
**Out-of-scope changes**: no.
**Layer Impact Report**: not-required — no critical-zone file (§3.1).
**Smoke visivo**: non applicabile in this run — pending Alfonso: two metamodels with the same name
→ `A`, `A (1)`; rename `A (1)` to `A` → refused.
**Notes**: Both take the pool as a parameter; suffix format and `(n)`-ending base identical; the
only differences are guards on inputs where the old copy threw (report §5). The function is a
local `const`, not exported as the prompt said. Doc comments in `nameLookup.ts:67` and
`classes.ts:1494` now describe the direction backwards; out of lane (report §6).
**Prompt document name**: 2026-09-14 16:32

## 2026-09-14 — fix(jjscript): i tipi risolti per kind ammissibili in set, create parameter, createReference
**Prompt**: `claude_2026-09-14_1631_prompt_lane_c_type_resolution_kinds.md` — two-phase con gate
condizionale: portare tre siti sullo stesso helper di `create attribute ... type <X>` (`39c5bf4ab`),
generalizzato ai kind ammissibili di ciascun comando.
**Files touched**: 6 in tre commit. Codice e test (`3e3ab691a`, 4 file):
`frontend/src/jjscript/executor/resolvers.ts`, `executor/commands/create.ts`,
`executor/commands/set.ts`, `executor/__tests__/resolvers.test.ts`. Docs: il referto
`docs/discovery/discovery_2026-09-14_type_resolution_kinds.md` (`5f00baf71`) e questa entry.
I quattro file sporchi delle altre corsie (`ValidationRulesModal.*`, `CLAUDE.md`, `AGENTS.md`)
lasciati dove sono, RC-13; nessuno `stash`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown — i tre comandi non sono eseguibili in bench (vedi **Smoke visivo**).
Baseline invariata e suite verde, ma il percorso utente non e' stato eseguito in questo giro.
**Out-of-scope changes**: **yes**, e dichiarato. Il gate ha trovato un **quarto sito** della stessa
famiglia, `createOperation` (`create.ts:788`, `returns <X>`): identico a `create parameter` riga per
riga. Portato dentro su ratifica esplicita in chat, come RC-11 prevede: stesso file, stesso helper,
~15 righe. Restano fuori, anch'essi su ratifica: `parser.ts:352` e `:404`.
**Layer Impact Report**: not-required — nessun file di §3.1; nessuna `TRANSACTION`, nessuna scrittura
D-layer vicino al sync.
**Smoke visivo**: **non eseguito in questo giro** — spetta ad Alfonso su localhost. Al suo posto i
gate: `npx tsc --noEmit` **33** righe `error TS` su output completo (la baseline di §17) e **0** in
ciascuno dei tre sorgenti toccati, contate una per una, con controllo positivo che ha segnale sullo
stesso output (`src/` → 69); `npx vitest run src/jjscript/executor/__tests__/resolvers.test.ts`
**65 passati, 0 falliti** (erano 54); `npx vitest run src/jjscript` **326 passati**, 9 file su 10 —
il decimo, `context-binding.test.ts`, fallisce all'import con `window is not defined` e il
fallimento e' stato **misurato pre-esistente** ripristinando i quattro file da `git show HEAD:<path>`
e rieseguendo, poi rimessi a posto da copia con `diff` a zero e indice mai toccato (§6.4);
`npm run build` exit 0, solo il warning di chunk-size noto.
**Notes**: Tre rilievi fuori previsione, misurati e argomentati in
`discovery_2026-09-14_type_resolution_kinds.md`: i kind di `set ... type` si derivano
dall'elemento tipato, non sono `['enum']` piatti (§3.4); `create ... type MM::X` **non parsa** —
`parser.ts:352` da' un oggetto a `parseTypeReference(raw: string)` (§7); `set Person.age type Mood`
non e' una forma esistente, il separatore di classe e' `::` (§3.5).
**Prompt document name**: 2026-09-14 16:31

## 2026-09-13 — discovery: the JjEL evaluator and its context, against the simulation spec
**Prompt**: `claude_2026-09-13_0100_prompt_discovery_jjel_eval_context.md` — read-only: entry points
and callers, context shape and read-only exposure, extra roots, errors and tri-state, translatable
subset census, lexer situation, step 2 mapping.
**Files touched**: 2, both docs. New: `docs/discovery/discovery_2026-09-13_jjel_eval_context.md`.
Modified: this entry. No source touched; `sim/` not read (grep only, 0 hits). The two
`ValidationRulesModal.*` and the six `jjscript/executor` files staged by another session left as
they were (RC-13).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — read-only run, no source modified.
**Out-of-scope changes**: no.
**Layer Impact Report**: not-required — no critical-zone file touched (§3.1).
**Smoke visivo**: non applicabile — read-only run. In its place a probe executing the evaluator,
**79 PASS 0 FAIL** (scratchpad, not committed: the prompt admits two files); `npx vitest run
src/jjel src/model/validation` 269/269.
**Notes**: Read-only M already holds de facto at the context-builder boundary (plain snapshot, no
write construct, frozen context measured). Three behaviours to decide: `and`/`or` eager, property of
a primitive silently `null`, `is` false on M1 handles. Two evaluator paths with different builtins.
Five open questions in the report §11.
**Prompt document name**: 2026-09-13 01:00

## 2026-09-13 — discovery: the simulation engine as it stands, against the computational model
**Prompt**: `claude_2026-09-13_0030_prompt_discovery_simulation_engine.md` — read-only map of the
engine (files, roles/fitting, state, step, critical zone, branches) and distance to the six-step plan.
**Files touched**: `docs/discovery/discovery_2026-09-13_simulation_engine_state.md` (new), this entry.
No code. The dirty `ValidationRulesModal.*` and `jjscript/executor/*` belong to other lanes (RC-13).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — no code changed.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — read-only; the report names the IR critical-zone call sites (§5).
**Smoke visivo**: non applicabile
**Notes**: Engine = `sim/` 3 files; roles are six flat `sim*` keys in the M2 `_state` bag (4 read);
run-state is a boolean Set outside Redux; step fires all transitions of all active instances, no
events/guards/candidates. Touches IR via `marked`/`isMarked`, not sync. `sim/` identical across
`alfonso-frontend-jjtl` and `validation-skeleton`. 8 open questions in report §9.
**Prompt document name**: 2026-09-13 00:30

## 2026-09-14 — chore(jjscript): la corsia A riportata su alfonso-frontend-jjtl, cinque commit
**Prompt**: GO dopo la verifica visiva di corsia (entry `2026-09-14 16:10`). Cherry-pick `-x` dei
cinque commit di codice della corsia A sul ramo che il prompt del 2026-09-12 00:30 dichiarava,
solo codice, e nota del cherry-pick in un commit di docs.
**Files touched**: 2, entrambi di docs: questa entry e `docs/sessioni/sessione_2026-09-14.md`.
Nessun sorgente toccato in questo giro: i cinque commit sono riportati **as-is** con
`git cherry-pick -x` (che incide la provenienza nel messaggio), non riscritti. Tutti e cinque erano
gia' solo-codice, quindi «solo codice» non ha richiesto filtri. Corrispondenza degli sha, origine su
`validation-skeleton` → destinazione su `alfonso-frontend-jjtl`:

| item | origine | destinazione |
|------|---------|--------------|
| A2 — fallback di `_impl_getByName` senza effetti collaterali | `2a60e3264` | `df11ed769` |
| A3 — `DModel.new` suffissa i nomi duplicati | `b434a3950` | `1efe5c3ec` |
| A3b — stessa regola su `new2` e `new3` | `6a211f5c3` | `fa3139a37` |
| A1 — ambiguita' sugli omonimi di case esatto | `a52dfe5f3` | `ce9e78d64` |
| A4 — `model/nameLookup.ts` e i due chiamanti che delegano | `dc5f8d3aa` | `e82831264` |

**Il cherry-pick e' avvenuto nel secondo worktree gia' esistente** (`/Users/alfonso/jjodel-release`,
pulito su `2241dd056`), non cambiando ramo in albero condiviso: i due `ValidationRulesModal.*`
dell'altra corsia sono sporchi in `/Users/alfonso/jjodel` e RC-13 vieta lo `stash` che sarebbe la
scorciatoia abituale. Il worktree di prova del giro precedente (tip `59f14a184`) era **una prova e
non una destinazione**: i suoi cinque sha non sono citati da nessuna parte, e il worktree e' stato
rimosso a fine giro con `git worktree remove` + `prune`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. **Questa entry chiude il `Regressions: unknown` che le cinque entry di codice
portano**: quelle entry non sono state emendate (CLAUDE.md:1012, il log e' add-only), e la verifica
visiva era gia' stata sciolta dalla entry `2026-09-14 16:10`. Gate sul ramo di destinazione dopo il
cherry-pick, eseguiti in `/Users/alfonso/jjodel-release` con `node_modules` in symlink temporaneo
(rimosso a fine giro, `git status` vuoto prima e dopo): `npx vitest run` sui quattro file di test
toccati **87 passati, 0 falliti** su 4 file; `npx tsc --noEmit` exit 2, **14** righe `error TS` su
output completo — la baseline di quel ramo, l'insieme «sparso» gia' dichiarato (`Measurable.tsx` ×6,
`api/data.ts` ×3, `Dummy.ts`, `EditorV2.tsx`, `ChatMessages.tsx`, `ProjectEditor.tsx`,
`Dashboard.tsx`) — e **0** righe in ciascuno degli 8 sorgenti toccati, controllati uno per uno, con
due controlli positivi che hanno segnale sullo stesso file e con lo stesso strumento (`src/` → 14,
`Measurable` → 6). I 19 errori di casing della baseline 33 non esistono su quel ramo: e' una
proprieta' del ramo, non un effetto del giro.
**Out-of-scope changes**: no.
**Layer Impact Report**: not-required — nessun file della critical zone (§3.1); nessun sorgente
modificato in questo giro.
**Smoke visivo**: **passato**, e non in questo giro: i cinque scenari su localhost riferiti da
Alfonso e verbalizzati nella entry `2026-09-14 16:10`, che questo giro presuppone e non ripete.
**Notes**: I 12 file portati combaciano byte per byte con `dc5f8d3aa`, uno per uno; lo stato
risultante e' identico alla prova (`git diff HEAD 59f14a184` vuoto, controllo positivo con segnale:
verso `2241dd056` stampa 12 file). **Il controllo positivo del giro del 2026-09-12 non ha piu'
segnale**: `eval.ts` oggi e' identico fra i due rami, la divergenza R-VAL-16 e' rientrata; usato
`App.tsx`, che differisce. Restano 35 file diversi sotto `frontend/src`, di altre corsie.
**Prompt document name**: 2026-09-14 16:25

## 2026-09-14 — verify: la verifica visiva della corsia A, passata su tutti e cinque i giri
**Prompt**: verifica di corsia dopo A4. Copre i cinque commit di codice della corsia A:
`2a60e3264` (A2), `b434a3950` (A3), `6a211f5c3` (A3b), `a52dfe5f3` (A1), `dc5f8d3aa` (A4).
**Files touched**: 1, questa entry. Nessun sorgente toccato.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: **no**. Riferito da Alfonso su localhost, cinque scenari: (1) un nome dichiarato
da due metamodelli riporta l'ambiguita' con le grafie `A::Person, B::Person`; (2) `A::Person`
risolve dentro `A`; (3) `show person` in minuscolo riporta l'ambiguita' — e' uno dei nove
chiamanti non ristretti, che prima prendeva il primo in silenzio; (4) due metamodelli creati
dall'interfaccia con lo stesso nome diventano `A` e `A (1)`; (5) rinominare `A (1)` in `A` viene
ancora **rifiutato**, cioe' `set_name` non ha imparato a suffissare. Le entry dei cinque giri
restano con `Regressions: unknown` come sono state scritte: il log e' add-only (CLAUDE.md:1012) e
questa entry le scioglie senza emendarle.
**Out-of-scope changes**: no.
**Layer Impact Report**: not-required — nessun sorgente modificato in questo giro.
**Smoke visivo**: **passato**, i cinque scenari sopra.
**Notes**: Il cherry-pick su `alfonso-frontend-jjtl` **non e' stato fatto**: quel ramo e' checked
out in un secondo worktree (`/Users/alfonso/jjodel-release`), quindi ne' `worktree add` ne' uno
spostamento del ref sono azioni che questa corsia puo' prendersi da sola. I cinque commit sono
stati provati in un worktree staccato sul commit del ramo: applicano puliti in ordine, 87 test
verdi, `tsc` 14 — la baseline di quel ramo — e 0 nei file toccati.
**Prompt document name**: 2026-09-14 16:10

## 2026-09-14 — refactor(A4): le ricerche per nome estratte dove il banco puo' eseguirle
**Prompt**: `claude_2026-09-12_0030_prompt_lane_a_resolver_ambiguity.md`, item **A4** aggiunto in
chat. Chiude la corsia A (A2, A3, A3b, A1, A4).
**Files touched**: 6 di codice in `dc5f8d3aa`, **sopra la soglia di 5 della regola 19** e
conseguenza diretta di cio' che il prompt autorizza (RC-11): nuovi `model/nameLookup.ts`
(`lookupNamedEntry`, `uniqueModelName`, zero import) e `model/__tests__/nameLookup.test.ts`
(15 test di comportamento); `model/logicWrapper/LModelElement.tsx` e `joiner/classes.ts` delegano;
`model/__tests__/getByNameKey.test.ts` e `joiner/__tests__/uniqueModelName.test.ts` perdono le
asserzioni sul testo che ora sono comportamento e tengono solo cio' che resta non importabile.
Docs in questo commit: questa entry. I due `ValidationRulesModal.*` restano dell'altra corsia.
**Outcome**: ✅ completed
**Corregge**: 2026-09-12 00:30 (A2 e A3: le loro prove erano statiche perche' non c'era altro modo)
**Causa**: (g)
**Regressions**: unknown, fino alla verifica visiva di corsia. Gate verdi: `npx tsc --noEmit`
**33** su output completo con exit status letto — la baseline — **0** righe nei file toccati,
controllo positivo con segnale (`src/` → 69); `npm run build` exit 0; `npx vitest run` **3551
passati, 0 falliti** (erano 3540, +11), 9 file rossi all'import per `window`, l'insieme
pre-esistente. **Durante il giro tsc e' salito a 44**: 11 errori tutti nel test nuovo, `T` inferito
come `{}` perche' l'helper tornava `any`. Tipato l'helper, tornato a 33.
**Out-of-scope changes**: no.
**Debito dichiarato** (da A1, iscritto qui perche' il log e' add-only e quella entry non si
emenda): i segmenti **intermedi** di un nome qualificato restano first-match
(`resolvers.ts`, `resolveByPath`: `current = matches[0]`). Quindi **la forma a tre segmenti
`A::B::C` non fa parte della sintassi documentata del qualificatore** finche' quel resolver non e'
sistemato: la sintassi documentata e' `Metamodel::Element` e basta.
**Layer Impact Report**: not-required — nessun file della critical zone (§3.1); il modulo nuovo e'
puro e i due chiamanti delegano senza cambiare firma.
**Smoke visivo**: non eseguito; la verifica di corsia segue. In sua vece il banco: **i cinque
mutanti che erano solo-sonda ora muoiono in repo** — N1 riscrittura degli alias (2 rossi), N2
tie-break invertito (1), N3 guardia `caseSensitive` tolta (1), Q1 ramo `else` commentato in
`DModel.new` (2), Q-pool `new3` su un bacino piu' stretto (1). Sorgenti ripristinati byte per byte.
**Notes**: `(g)` per RC-8: l'ostacolo e' del banco, non del prodotto. Restano statiche **solo** le
asserzioni su cio' che non si puo' importare: la delega di `_impl_getByName`, quella della statica,
le tre guardie di `DModel`. Verificano anche che non sia rientrata una copia della logica e che
`nameLookup.ts` **non importi nulla** — un import li' dentro renderebbe di nuovo inservibili le
prove di comportamento senza far arrossare niente.
**Prompt document name**: 2026-09-12 00:30

## 2026-09-13 — fix(A1): gli omonimi scritti uguali sono un'ambiguita', con le grafie qualificate
**Prompt**: `claude_2026-09-12_0030_prompt_lane_a_resolver_ambiguity.md`, item **A1**, ultimo della
corsia A. A4 resta da aprire.
**Files touched**: 6 di codice in `a52dfe5f3`, **sopra la soglia di 5 della regola 19**, elencati
in chat prima del diff (RC-11): `jjscript/executor/resolvers.ts` (il ramo di pluralita' esatta,
`qualifiedSpelling`, `ambiguityMessage`, `QUALIFY_ADVICE`, l'ambiguita' tolta dal cancello su
`kinds`), `commands/delete.ts`, `commands/rename.ts`, `commands/list.ts`, `commands/create.ts`
(rendono il messaggio condiviso e perdono il consiglio diventato falso),
`executor/__tests__/resolvers.test.ts` (+13 test, 54 in tutto; 1 asserzione invertita).
Docs in questo commit: questa entry. I due `ValidationRulesModal.*` restano dell'altra corsia.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown, fino alla verifica visiva. Gate verdi: `npx tsc --noEmit` **33** su
output completo con exit status letto — la baseline — **0** righe `src/jjscript`, controllo
positivo con segnale (`src/` → 69); `npm run build` exit 0 col solo avviso di chunk pre-esistente;
`npx vitest run` **3540 passati, 0 falliti** (erano 3527, +13 sono i nuovi), 9 file rossi
all'import per `window`, l'insieme pre-esistente.
**Out-of-scope changes**: no, ma **i quattro comandi sono stati toccati per necessita'**, non per
stile: il loro suggerimento diceva «Use the exact name, matching case, of the one you mean», che e'
un consiglio **falso** quando il nome e' gia' esatto ed e' ambiguo lo stesso. Ora condividono
`ambiguityMessage` e `QUALIFY_ADVICE` e il dettaglio non afferma piu' «ignoring case».
**Debito dichiarato**, non toccato: i segmenti INTERMEDI di un nome qualificato restano
first-match (`resolvers.ts`, `resolveByPath`: `current = matches[0]`), quindi `A::B::C` sceglie il
primo `A`; dopo A3 i nomi di metamodello sono unici, ma la regola non vale ancora per i package
omonimi. Piu' i siti «pass a scope» e «report ambiguity» dell'inventario che diventano la corsia B.
**Layer Impact Report**: not-required — nessun file della critical zone (§3.1); i resolver leggono
i proxy L, non scrivono.
**Smoke visivo**: non eseguito, resta manuale. In sua vece il banco delle mutazioni, **5 su 5**,
comprese le due richieste dal prompt: S1 ritorno a `return exact[0]` (4 rossi), S2 qualificazione
tolta (7), S3 ambiguita' di nuovo dietro il cancello su `kinds` (2), S4 qualificatore inventato per
un elemento senza modello (6), S5 pluralita' di contenitori esatti che ripiega sul primo (1).
Sorgente ripristinato byte per byte (`diff -q` verde, 54/54 dopo).
**Notes**: Una sola asserzione **invertita** invece che cancellata: «unrestricted, the same lookup
silently picks the first — the old behaviour» fissava esattamente il debito che questo giro paga.
Un primitivo m3 si scrive **nudo** (`EString`), perche' `get_model` e' null per lui e
`Ecore::EString` stamperebbe qualcosa che non risolve; con `kinds` sui classificatori non dovrebbe
comunque mai essere candidato.
**Prompt document name**: 2026-09-12 00:30

## 2026-09-13 — fix(A3b): la guardia sul nome vale anche su DModel.new2 e new3
**Prompt**: `claude_2026-09-12_0030_prompt_lane_a_resolver_ambiguity.md`, item **A3b** aggiunto in
chat. A1 resta fermo in attesa di ACK.
**Files touched**: 2 di codice in `6a211f5c3` — `model/logicWrapper/LModelElement.tsx` (il ramo
`else` di `DModel.new2` e di `DModel.new3`) e `joiner/__tests__/uniqueModelName.test.ts` (+7 test,
14 in tutto; l'estrattore del corpo ora e' parametrico sui tre punti d'ingresso). Docs in questo
commit: questa entry. I due `ValidationRulesModal.*` restano dell'altra corsia (RC-13).
**Outcome**: ✅ completed
**Corregge**: 2026-09-12 00:30 (A3, `b434a3950`) — chiude i due punti d'ingresso che quel giro
aveva lasciato aperti e ne corregge il conteggio dei chiamanti.
**Causa**: (b)
**Regressions**: unknown, fino alla verifica visiva. Gate verdi: `npx tsc --noEmit` **33** su
output completo con exit status letto — la baseline — **0** righe `LModelElement`, controllo
positivo con segnale (`src/` → 69); `npm run build` exit 0 col solo avviso di chunk pre-esistente;
`npx vitest run` **3527 passati, 0 falliti** (erano 3520, +7 sono i nuovi), 9 file rossi all'import
per `window`, l'insieme pre-esistente.
**Out-of-scope changes**: no. **Debito dichiarato con direzione gia' decisa, non toccato qui**:
`generateUniqueModelName` (`components/project/ProjectEditor.tsx:1359`) duplica questa regola e
dovra' delegare all'helper del modello, non il contrario.
**Layer Impact Report**: not-required — nessun file della critical zone (§3.1).
**Smoke visivo**: non eseguito, resta manuale. In sua vece il banco delle mutazioni, **4 su 4**:
R1 guardia di `new3` cancellata (2 rossi), R2 guardia di `new3` commentata (1), R3 guardia di
`new2` cancellata (2), R4 `new3` che interroga un bacino diverso — solo i metamodelli — (1).
Sorgente ripristinato byte per byte (`diff -q` verde, 14/14 dopo).
**Notes**: **Correzione alla entry di A3**, che resta com'e' scritta perche' il log e' add-only:
`new3` ha **UN** chiamante vivo, non due — `JjodieAPIImpl.ts:95`; la riga 94 e' un commento che
nomina la stessa chiamata ed era stata contata come sito. `new2` non ne ha nessuno: la guardia c'e'
perche' non diventi la scorciatoia. `new3` scrive in `a.name` e non in un locale, come gia' fa il
ramo dell'auto-nome sopra di esso.
**Prompt document name**: 2026-09-12 00:30

## 2026-09-12 — fix(A3): DModel.new suffissa un nome di metamodello gia' preso
**Prompt**: `claude_2026-09-12_0030_prompt_lane_a_resolver_ambiguity.md`, **solo A3**. A1 resta
fermo in attesa di ACK.
**Files touched**: 3 di codice in `b434a3950` — `joiner/classes.ts`
(`DPointerTargetable.uniqueModelName`, accanto a `defaultname`),
`model/logicWrapper/LModelElement.tsx` (il ramo `else` di `DModel.new`),
`joiner/__tests__/uniqueModelName.test.ts` (nuovo, 7 test). Docs in questo commit: questa entry.
I due `ValidationRulesModal.*` restano dell'altra corsia (RC-13).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown, fino alla verifica visiva. Gate verdi: `npx tsc --noEmit` **33** su
output completo con exit status letto — la baseline — **0** righe nei due file toccati, controllo
positivo con segnale (`src/` → 69); `npm run build` exit 0 col solo avviso di chunk pre-esistente;
`npx vitest run` **3520 passati, 0 falliti** (erano 3513, +7 sono i nuovi), 9 file rossi all'import
per `window`, l'insieme pre-esistente.
**Out-of-scope changes**: no. **Debito dichiarato**: `DModel.new2` e `DModel.new3` hanno lo stesso
buco — `new3` con due chiamanti vivi in `jjodie-integration/JjodieAPIImpl.ts` — e il prompt limita
il giro a `DModel.new`; applicare l'helper e' una riga per ciascuno. Verificato come richiesto che
**nessun chiamante dipende dal nome restituito**: i due siti di `DockLayout.tsx` sono commentati,
`ProjectEditor.tsx:1703` passa un nome gia' deduplicato, gli altri nove usano solo il `DModel`.
**Layer Impact Report**: not-required — nessun file della critical zone (§3.1); la scrittura e'
`DModel.new` su un elemento nuovo, non un percorso di sync.
**Smoke visivo**: non eseguito, resta manuale. In sua vece il banco delle mutazioni, **5 su 5**:
Q1a ramo `else` commentato (1 rosso), Q1b ramo `else` cancellato (1), Q2 suffisso che riparte dal
conteggio invece che dal massimo (1 statico + 2 sonda), Q3 confronto case-insensitive (2 + 1),
Q4 metacaratteri non neutralizzati (1 + 1). **Q1 sopravviveva** alla prima stesura: l'asserzione
era un `toMatch` nudo e il commento contiene ancora il testo della riga. Riancorata a inizio riga
piu' un `not.toMatch` sul commento, uccide in entrambe le forme. Sorgenti ripristinati byte per
byte (`diff -q` verde, 7/7 e 8/8 dopo).
**Notes**: Lo schema ` (n)` **non e' nuovo**: e' quello di `generateUniqueModelName`
(`ProjectEditor.tsx:1359`) per i nomi di modello. `defaultname` tiene il suo contatore nudo
(`model_0`). Bacino identico a quello di `set_name`: ogni `DModel`, metamodelli e modelli M1
insieme. Test statico per la ragione di A2 — `joiner` e `LModelElement` non importabili sotto il
banco, rimisurato con controllo positivo; il comportamento e' nella sonda, 8 casi.
**Prompt document name**: 2026-09-12 00:30

## 2026-09-12 — fix(A2): il ripiego case-insensitive di getByName non scrive piu' nella collezione
**Prompt**: `claude_2026-09-12_0030_prompt_lane_a_resolver_ambiguity.md`, **solo A2**. A3 e A1
restano fermi in attesa di ACK.
**Files touched**: 2 di codice in `2a60e3264` — `model/logicWrapper/LModelElement.tsx`
(`_impl_getByName`: il ripiego legge invece di scrivere) e `model/__tests__/getByNameKey.test.ts`
(+1 test nuovo, 2 aggiornati, 8 in tutto). Docs in questo commit: questa entry. I due
`ValidationRulesModal.*` restano dell'altra corsia (RC-13).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown, fino alla verifica visiva. Gate verdi: `npx tsc --noEmit` **33** su output
completo con exit status letto — la baseline — **0** righe `LModelElement`, controllo positivo con
segnale sullo stesso file (`src/` → 69); `npm run build` exit 0 col solo avviso di chunk
pre-esistente; `npx vitest run` **3513 passati, 0 falliti** (erano 3512, +1 e' il nuovo), 9 file
rossi all'import per `window`, l'insieme pre-esistente.
**Out-of-scope changes**: no. **Due asserzioni esistenti sono state aggiornate** perche'
codificavano il corpo vecchio: quella che fissava `return collection[key.toLowerCase()] || null` e
quella che fissava il `|| null` finale. Ora fissano la forma in lettura e l'accumulatore. Il
tie-break e' **invariato di proposito**: vinceva l'ultima chiave corrispondente e continua a farlo;
quale dei due omonimi di solo caso risponda e' una domanda diversa da «il lookup sporca l'ingresso»,
e A2 scioglie solo la seconda.
**Layer Impact Report**: not-required — `LModelElement.tsx` non e' in critical zone (§3.1) e il
tocco e' in sola lettura: la modifica **toglie** l'unica scrittura che c'era.
**Smoke visivo**: non eseguito, resta manuale. In sua vece il banco delle mutazioni, **3 su 3
uccise**, ma con una divisione che va detta: N1 (riscrittura degli alias, il difetto originale)
muore sia col test **committato** (3 rossi) sia con la sonda (2); N2 (tie-break invertito) e N3
(guardia `caseSensitive` tolta) muoiono **solo con la sonda**, che non e' committata. Il test in
repo e' statico e protegge la purezza, non il comportamento.
**Notes**: Il test committato e' statico perche' `LModelElement.tsx` **non e' importabile** sotto il
banco del repo — rimisurato il 2026-09-12 con una config che ne rispecchia le impostazioni:
`window is not defined`, controllo positivo `jjscript/executor/resolvers` che importa. La prova di
comportamento e' la sonda, 6 su 6, che esegue la funzione vera (non una copia) e misura P3-d chiuso.
**Prompt document name**: 2026-09-12 00:30

## 2026-09-12 — fix(jjscript): il tipo enum degli attributi risolto, niente piu' ripiego su EString
**Prompt**: `claude_2026-09-11_1800_prompt_jjscript_attribute_enum_type.md`, Fase 2 dopo il via.
Risposte: §9.1 il resolver nuovo sta in `resolvers.ts` e `create.ts` non contiene logica di lookup;
§9.4 il tipo sconosciuto e' un errore, cambiamento di comportamento dichiarato; §9.2 e §9.3 avevano
l'opzione conservativa, presa (vedi `Out-of-scope changes`).
**Files touched**: 3 di codice in `39c5bf4ab` — `jjscript/executor/resolvers.ts`
(`resolveEnumTypeTarget`), `jjscript/executor/commands/create.ts` (`PRIMITIVE_ATTRIBUTE_TYPES`,
`primitiveAttributeType`, `AttributeTypeOutcome`, `resolveAttributeType`, la firma di
`createAttribute` e il suo sito di chiamata), `jjscript/executor/__tests__/resolvers.test.ts`
(+10 test, 41 in tutto). Docs in questo commit: questa entry. I due `ValidationRulesModal.*`
restano dell'altra corsia (RC-13).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — verifica visiva passata su localhost il 2026-09-12 per entrambi gli script
(riproduzione del prompt del tipo enum; script completo sul metamodello unito, con
`Animal.animalMood` tipato con l'enum `Mood`). Il campo e' stato portato da `unknown` a `no` **in
loco**, su indicazione esplicita e ripetuta di Alfonso: e' una deroga a CLAUDE.md:1012, dove il log
e' add-only e le entry non si emendano mai. Gate verdi: `npx tsc --noEmit` **33** su output
completo con exit status letto — la baseline — e **0** righe `src/jjscript`, con controllo positivo
che ha segnale sullo stesso file (`src/` → 69); `npm run build` exit 0 col solo avviso di chunk
pre-esistente; `npx vitest run` **3512 passati, 0 falliti** (erano 3502, +10 sono i nuovi), 9 file
rossi all'import per `window`, l'insieme pre-esistente.
**Out-of-scope changes**: no. **Cambiamento di comportamento dichiarato** (§9.4): un tipo non
risolvibile ora e' un errore e la riga viene saltata con
`Unknown type '<Name>' for attribute '<attr>'. Expected a primitive type or an enum.`, dove prima
era un falso successo. I progetti salvati non cambiano: il fix tocca solo l'esecuzione.
**Debito dichiarato**, stessa famiglia ma percorsi diversi, non toccati (opzione conservativa di
§9.2/§9.3): `commands/set.ts:272` (`set <el> type <X>` risolve di progetto senza `kinds` e ripiega
su una stringa), il ramo parametro di `commands/create.ts` (scarta in silenzio un tipo non
primitivo), e `createReference` che continua a non passare `kinds`.
**Layer Impact Report**: not-required — nessun file della critical zone (§3.1); la scrittura e'
`DAttribute.new` su un elemento nuovo, non un percorso di sync.
**Smoke visivo**: **passato** — i due script su localhost, riferiti da Alfonso (stessa deroga di
`Regressions`: campo aggiornato in loco). Accanto, il
banco delle mutazioni su `resolveEnumTypeTarget`, **5 su 5 discriminanti** dopo una correzione dei
test: M1 senza restrizione di kind (4 rossi), M2 gamba di progetto per prima (2), M3 gamba di
progetto non ristretta (2), M4 gamba del metamodello omessa (2), M5 `isConclusive` ridotto a
`scoped.element` (1). **M2, M4 e M5 sopravvivevano** al primo giro: nessuna fixture metteva lo
stesso nome in due metamodelli, quindi «prima il metamodello» non era osservabile. Aggiunte le due
fixture, uccidono. Sorgente ripristinato byte per byte (`diff -q` verde, 41/41 dopo).
**Notes**: Il tipo arriva al resolver come `QualifiedName` intatto, mai via `rawTypeName` (che
appiattirebbe `MM::Mood` in stringa). L'id dell'enumeratore finisce in `DAttribute.type`, la stessa
rappresentazione che scrivono `Info.tsx:316` e `canvasToJjom.ts:674`. Referto:
`discovery_2026-09-11_attribute_enum_type.md`.
**Prompt document name**: 2026-09-11 18:00

## 2026-09-12 — discovery: `create attribute ... type <Enum>` ripiega su EString in silenzio
**Prompt**: `claude_2026-09-11_1800_prompt_jjscript_attribute_enum_type.md`, Fase 1 read-only con
hard stop. Stabilire cosa decide il tipo di un attributo, come e' rappresentato un attributo tipato
con enum, se la risoluzione di `createReference` e' riusabile con restrizione di kind, e quali altri
comandi accettano `type <Name>`.
**Files touched**: 2, entrambi docs. Nuovo:
`docs/discovery/discovery_2026-09-11_attribute_enum_type.md` (299 righe). Modificato: questa entry.
Nessun sorgente toccato. I due `ValidationRulesModal.*` restano dell'altra corsia (RC-13).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — giro di sola lettura, nessun sorgente modificato.
**Out-of-scope changes**: no.
**Layer Impact Report**: not-required — nessun file della critical zone (§3.1) nel perimetro.
**Smoke visivo**: non applicabile. In sua vece la sonda, **9 test su 9**, con `node_modules` in
symlink fuori dal repo e nulla installato.
**Notes**: I ripieghi silenziosi sono **due**, non uno (`create.ts:73` e il lookup
`Defaults['Pointer_MOOD']`, misurato `undefined`): sanarne uno solo non cambia nulla. La
rappresentazione **non va toccata** — `DAttribute.type` e' gia' un puntatore al `DEnumerator` — e
la condizione di stop del prompt non scatta. Riferiti e non corretti: `set ... type` e
`create parameter`. Dettaglio e 4 domande aperte in
`discovery_2026-09-11_attribute_enum_type.md` §9.
**Prompt document name**: 2026-09-11 18:00

## 2026-09-12 — chore(jjscript): la verifica manuale passa, i due fix su alfonso-frontend-jjtl
**Prompt**: GO dopo la verifica visiva su localhost dei quattro casi (script originale;
`delete literal HAPPY in Mood`; `create literal X in mood`; il caso di backtracking `Mood`/`mood`).
Cherry-pick di `7bacbd63c` e `12a318b3a` sul ramo che il prompt del 2026-09-11 10:15 dichiarava,
solo codice, e nota del cherry-pick in un commit di docs.
**Files touched**: 1, questa entry. Nessun sorgente toccato in questo giro: i due commit sono stati
riportati **as-is** con `git cherry-pick -x` (che incide la provenienza nel messaggio), non riscritti.
Sul ramo di destinazione diventano `9b9730ed4` e `11f42aada`. Entrambi i sorgenti erano gia'
solo-codice (6 file ciascuno, tutti sotto `frontend/src/jjscript/`), quindi «solo codice» non ha
richiesto filtri. **Il cherry-pick e' avvenuto in un `git worktree` temporaneo**, non cambiando ramo
in albero condiviso: i due `ValidationRulesModal.*` dell'altra corsia sono sporchi **e** diversi fra
i due rami, quindi un `checkout` li avrebbe rifiutati o sovrascritti, e RC-13 vieta lo `stash` che e'
la scorciatoia abituale. Worktree rimosso a fine giro.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. **Questa entry scioglie l'`unknown` dichiarato in `7bacbd63c` e `12a318b3a`**:
quelle due entry non sono state emendate (CLAUDE.md:1012, il log e' add-only e le entry non si
emendano mai), e il loro `unknown` resta il verdetto corretto al momento in cui fu scritto — nulla
era ancora stato visto nell'app. La verifica manuale sui quattro casi e' passata su localhost.
Gate sul ramo di destinazione dopo il cherry-pick: `npx vitest run` sul file dei resolver
**31/31**; `npx tsc --noEmit` exit 2, **14** righe `error TS` su output completo — l'insieme
«sparso» gia' dichiarato (`Measurable.tsx` ×6, `api/data.ts` ×3, `Dummy.ts`, `EditorV2.tsx`,
`ChatMessages.tsx`, `ProjectEditor.tsx`, `Dashboard.tsx`), **0** in `src/jjscript` con due controlli
positivi che hanno segnale sullo stesso file (`src/` → 14, `Measurable` → 6). I 19 errori di casing
della baseline 33 non esistono su quel ramo: e' una proprieta' del ramo, non un effetto del giro.
**Out-of-scope changes**: no.
**Layer Impact Report**: not-required — nessun file della critical zone (§3.1); nessun sorgente
modificato in questo giro.
**Smoke visivo**: **passato** — i quattro casi su localhost, riferiti da Alfonso. E' la verifica che
i due giri precedenti avevano lasciato aperta per decisione 10.2.
**Notes**: I sei file portati combaciano **byte per byte** fra i due rami (`git diff --quiet` per
file, con controllo positivo su `eval.ts` che DIFFERISCE per la divergenza pre-esistente di
R-VAL-16). Resta aperto e dichiarato: i 9 chiamanti senza `kinds` (debito di `7bacbd63c`), che la
corsia A1 chiudera' portando l'ambiguita' su entrambi i rami di `selectTarget` per tutti.
**Prompt document name**: 2026-09-12 00:40

## 2026-09-11 — discovery: la risoluzione per nome e il suo scope in tutto il codebase
**Prompt**: inventario read-only di ogni lookup per nome (contro puntatore), con lo scope di
ciascuno, il consumatore che lo possiede e la regola di unicita' vigente — per misurare il costo
del disegno «nomi unici per metamodello, nome qualificato `Metamodel.Element`, i lookup di
progetto falliscono su ambiguita'». Hard stop: nessuna implementazione, nessun piano di
refactoring oltre la colonna «change needed» per sito.
**Files touched**: 2, entrambi docs. Nuovo:
`docs/discovery/discovery_2026-09-11_name_resolution_scope.md` (548 righe: obiettivo, conteggi
grep grezzi e ritenuti, tabella di 56 siti in 8 gruppi, regola di unicita' con estratto, 27
misure della sonda, test esistenti, precedenti, rischi, costo per tipo di modifica, 6 domande
aperte). Modificato: questa entry. I due `ValidationRulesModal.*` sporchi sono di un'altra
corsia: non toccati, non committati (RC-13).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — nessun sorgente modificato. `git status --short` prima e dopo mostra gli
stessi due file dell'altra corsia, `git diff --stat` gli stessi 2 file / +11 −9; niente in stage.
**Out-of-scope changes**: no — il referto e la entry, cioe' il perimetro che il prompt dichiara.
**Layer Impact Report**: not-required — nessun file della critical zone (§3.1) e' stato
modificato; la sonda legge, non scrive.
**Smoke visivo**: non applicabile — giro di sola lettura. In sua vece la sonda, **27 test su 27**,
sotto il runner del repo con `node_modules` in symlink e nulla installato: `jsdom` non c'e' e non
e' stato aggiunto (regola 4). Tre assert scritti in prima battuta erano sbagliati e sono stati
corretti su cio' che il codice fa davvero, non viceversa.
**Notes**: `checkM2NameUniqueness` **e' gia'** il disegno voluto (R-M2U-2): il buco e' tutto sul
lato lookup, 17 siti su 56. Tre misure cambiano la forma del lavoro, in
`discovery_2026-09-11_name_resolution_scope.md` §5: `selectTarget:233` ritorna `exact[0]`, quindi
due omonimi scritti uguali non toccano mai il ramo `ambiguousWith`; `B::Person` si risolve gia'
oggi; `B.Person` ritorna null, il `.` e' accesso a membro. `src/ai/` non esiste (RC-10, §0).
**Prompt document name**: 2026-09-11 11:30

## 2026-09-11 — fix(jjscript): il backtracking sul membro si ferma su un contenitore plausibile
**Prompt**: controllo di correttezza prima del cherry-pick. Scenario: due enum `Mood` e `mood`
(collisione di solo caso, ammessa come warning da `nameUniqueness`), comando
`delete literal FOO in Mood` con FOO su `mood` e non su `Mood`. Prima scrivere il test a livello
di resolver e riferire il risultato osservato; poi, se conferma il difetto, la correzione minima
in `selectTarget`, tutti i test esistenti verdi, nessun amend, commit nuovo. In entry: (a) righe di
codice contro righe di test in `7bacbd63c`, (b) il debito dichiarato sui chiamanti non ristretti.
**Files touched**: 7. Codice in `12a318b3a`: `jjscript/executor/resolvers.ts`
(`canHoldMembers`, `MEMBER_COLLECTIONS`, `elementKindLabel`, `memberMissingMessage`, il campo
opzionale `memberMissingOn` su `TargetResolution`, la nuova precedenza in `selectTarget`,
`isConclusive`), `commands/create.ts`, `commands/delete.ts`, `commands/rename.ts`,
`commands/list.ts` (rendono il messaggio), `executor/__tests__/resolvers.test.ts` (+6 test, 31 in
tutto). Docs in questo commit: questa entry. I due `ValidationRulesModal.*` sporchi restano
dell'altra corsia, non toccati (RC-13).
**Outcome**: ✅ completed
**Corregge**: 2026-09-11 10:15
**Causa**: (c)
**Regressions**: unknown. Gate verdi: `npx tsc --noEmit` **33** su output completo con exit status
letto, la baseline, **0** righe `jjscript` (controllo positivo: il totale e' 33 mentre il filtro e'
vuoto); `npm run build` exit 0; `npx vitest run` **3502 passati, 0 falliti** (erano 3496, +6 sono i
nuovi), 9 file rossi all'import per `window`, l'insieme pre-esistente. Resta `unknown` per la
stessa ragione del giro precedente: nulla di tutto questo e' stato visto nell'app in esecuzione, e
la verifica end-to-end e' ancora da fare a mano.
**Out-of-scope changes**: no — resolver, suoi chiamanti dentro JjScript, test, log: il perimetro
del prompt. Sono 6 file di codice, sopra la soglia di 5 della regola 19, conseguenza diretta di
quanto il prompt autorizza (RC-11).
**Layer Impact Report**: not-required — nessun file della critical zone (§3.1); i resolver leggono
i proxy L, non scrivono.
**Smoke visivo**: non eseguito, la verifica end-to-end resta manuale su localhost (decisione 10.2
del giro precedente). In sua vece il banco delle mutazioni, **5 su 5 discriminanti** dopo una
correzione del banco stesso: N1 contenitore esatto non decisivo (1 rosso), N2 tutto e' un
contenitore (1), N3 niente e' un contenitore (2), N4 `memberMissingOn` non finale (2), N5
contenitore case-insensitive unico non decisivo (1). **N2 era inizialmente verde**: nessuna fixture
metteva un non-contenitore alla grafia esatta, e la mutazione sopravviveva. Aggiunta quella
fixture, N2 uccide. Sorgente ripristinato byte per byte (`diff -q` verde, 31/31 dopo).
**Notes**: (a) `7bacbd63c`: codice **+457 −161** (netto +296), test **+262 −0**; 0,57 righe di
test per riga di codice aggiunta, 0,89 sul netto. (b) **Debito dichiarato**: i chiamanti che non
passano `kinds` — 9 siti, quelli del referto §4.5 piu' `set`, `show`, `validate`, `move`, `copy`,
`remove` — nel ripiego case-insensitive prendono ancora **il primo che capita** senza segnalare
ambiguita'. La precedenza al caso esatto vale per tutti; l'errore di ambiguita' no.
**Prompt document name**: 2026-09-11 17:30

## 2026-09-11 — fix(jjscript): la risoluzione del target dopo `in` ristretta ai kind ammissibili
**Prompt**: due fasi. `create literal HAPPY in Mood` falliva con «Cannot create literal in
attribute 'mood'»: il resolver del target cercava case-insensitive su ogni kind e restituiva il
primo in ordine di collezione. Fase 1 read-only con hard stop e referto; Fase 2 dopo il via, con
tre risposte che hanno ristretto il perimetro (10.1 ramo corrente, 10.2 test a livello di resolver,
10.3 il tipo enum degli attributi fuori scope).
**Files touched**: 8, dichiarati in chat prima del diff (RC-11, soglia di regola 19 superata).
Codice in `7bacbd63c`: `jjscript/executor/resolvers.ts` (selezione kind-aware: esatto prima,
ripiego case-insensitive unico, ambiguita' dichiarata; `ResolutionKind`, `TargetResolution`,
`kindLabel`, `TARGET_KINDS_BY_ELEMENT_TYPE`, `CONTAINER_KINDS`, piu' `resolveTargetInMetamodel` /
`resolveTargetInProject`), `commands/create.ts` (tabella dei kind del parent, messaggi di
ambiguita' e di non-trovato che nominano il kind), `commands/delete.ts`, `commands/rename.ts`,
`commands/list.ts` (passano i kind ammissibili), `executor/__tests__/resolvers.test.ts` (nuovo,
25 test). Docs in questo commit: il referto
`docs/discovery/discovery_2026-09-11_jjscript_target_resolution.md` e questa entry. I due
`ValidationRulesModal.*` sporchi sono di un'altra corsia: non toccati, non committati (RC-13).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown. I gate sono verdi — `npx tsc --noEmit` **33** su output completo con
exit status letto, la baseline dichiarata, zero errori nei file toccati (controllo positivo: lo
stesso file filtrato su `jjscript` non stampa nulla mentre il totale e' 33); `npm run build` exit 0
con il solo avviso di chunk pre-esistente; `npx vitest run` **3496 test passati, 0 falliti**
(erano 3471, +25 sono i nuovi), 9 file falliscono all'import per `window` sotto
`environment: 'node'`, lo stesso insieme pre-esistente. Resta `unknown` e non `no` perche' il
comportamento cambia anche per i 9 chiamanti **non** ristretti: la precedenza al caso esatto e il
backtracking sul membro valgono per tutti, e nessuno dei due e' stato visto nell'app in esecuzione.
**Out-of-scope changes**: no — ogni file e' il resolver, un suo chiamante dentro JjScript, il test
nuovo, il referto o il log, cioe' il perimetro che il prompt elenca. Sono 6 file di codice, sopra
la soglia di 5 della regola 19: elencati in chat con cosa cambia in ciascuno prima del diff e
ripetuti qui (RC-11). Non toccati e dichiarati aperti i siti del referto §4.5 (`extends.ts`,
`abstract.ts`, `move`/`copy`/`remove`, `superClass` e il tipo di `reference` in `create.ts`): hanno
lo stesso difetto ma non la parola `in`.
**Layer Impact Report**: not-required — nessun file della critical zone (§3.1). Il tocco al
D-layer e' in sola lettura: i resolver leggono i proxy L, non scrivono.
**Smoke visivo**: non eseguito in questo giro, per decisione 10.2: la verifica end-to-end dello
script di riproduzione e' manuale su localhost e resta da fare. In sua vece, banco delle mutazioni
sul resolver, **5 su 5 discriminanti** — M1 senza precedenza al caso esatto (5 rossi), M2 senza
filtro di kind (4), M3 ambiguita' che ripiega sul primo (2), M4 membro applicato dopo il test di
kind (2), M5 ultimo segmento che torna a fermarsi alla prima collezione (4). Ogni mutazione
arrossa asserzioni sue; sorgente ripristinato byte per byte (`diff -q` verde, 25/25 dopo).
**Notes**: Il commit di codice va **cherry-picked su `alfonso-frontend-jjtl`**, il ramo che il
prompt dichiara; i file in perimetro erano byte-identici sui due rami (referto §0). Due premesse
del prompt smentite dalla misura, entrambe in `discovery_2026-09-11_jjscript_target_resolution.md`
§8: il test end-to-end sull'executor non gira sotto `environment: 'node'`, e il tipo enum degli
attributi e' un secondo difetto, fuori scope per 10.3.
**Prompt document name**: 2026-09-11 10:15

## 2026-09-09 — feat(sidebar): i tre concern sotto VIEWPOINTS (R-VAL-19, 19-bis)
**Prompt**: Fase 2 su `validation-skeleton`. Un ramo `VIEWPOINTS` con `SYNTAX`, `DATA MANAGER`,
`VALIDATION`; il Data Manager scende di un livello, `VALIDATION` nasce con le regole in piano e la
classe di contesto nella colonna dove per le view compare «Vertex». Vincoli da R-VAL-19-bis:
nessuna attivazione nell'albero e nessuna eccezione; le righe dei concern contano VIEWPOINT e il
numero di classi passa nel testo della riga di stato; i tre si vedono a zero con guardia unificata;
la chiave nuova in `STATIC_SECTION_KEYS`; l'albero nomina e naviga. La verifica finale asserisce la
STRUTTURA RESA, non il sorgente, piu' il banco delle mutazioni.
**Files touched**: 7, dichiarati prima del diff (RC-11). Nuovi:
`frontend/src/components/TreeViewSidebar/concernCounts.ts` (modulo puro senza import),
`docs/discovery/harness/probe_2026-09-09_albero_tre_concern.mts`. Modificati:
`TreeViewSidebar/TreeViewContent.tsx`, `TreeViewSidebar/tree-view-sidebar.scss`,
`TreeViewSidebar/__tests__/dataManagerSection.test.ts`,
`docs/discovery/harness/probe_2026-09-04_rdmv_sliceE_sidebar.mts`, e questa entry. I due
`ValidationRulesModal.*` sporchi sono di un'altra corsia: non toccati, non committati.
**Outcome**: ⚠️ partial
**Corregge**: —
**Causa**: (a)
**Regressions**: no. `npx tsc --noEmit` = **33**, la baseline dichiarata, zero errori nei file
toccati (controllo positivo: lo stesso comando filtrato su `TreeViewSidebar|concernCounts` non
stampa nulla mentre il conteggio totale e' 33). `npm run build` exit 0, solo l'avviso di chunk
pre-esistente. `npm run test`: **3471 test passati, 0 falliti**; 9 file falliscono all'import per
`window` sotto `environment: 'node'`, tutti in `jjtl/`, `jjscript/`, `utils/`, fuori perimetro e
pre-esistenti. Le due sonde verdi: la nuova **26 PASS 0 FAIL**, la vecchia riscritta **17 PASS 0
FAIL**, unit **30/30**.
**Out-of-scope changes**: no — 7 file, sopra la soglia di 5 della regola 19, dichiarati in chat
prima del diff con cosa cambia in ciascuno e ripetuti qui (RC-11).
**Layer Impact Report**: not-required — nessun file della critical zone (§3.1). Il tocco al
D-layer e' in sola lettura: `buildValidationViewpointsData` scandisce `idlookup`, non scrive.
**Smoke visivo**: passato. Due scatti del rail, `_tmp_concern_z_rail_zero.png` (i tre concern a
zero, ciascuno con la sua riga) e `_tmp_concern_z_rail.png` (popolato). Banco delle mutazioni
**7 su 7 discriminanti**: M1 riga di VALIDATION tolta, M2 riga di stato a depth 2, M3 Data Manager
a depth 1, M4 contatore che torna a contare classi, M5 Data Manager fuori da VIEWPOINTS, M6 totale
senza i viewpoint sciolti, M7 esclusione del singleton dopo lo smistamento. Ogni mutazione arrossa
l'asserzione sua e solo quella; sorgenti ripristinati byte per byte (`diff -q` verde).
**Notes**: Il pezzo a meta' e le tre scelte prese senza una decisione che le coprisse stanno
nell'addendum §9 di `discovery_2026-09-09_albero_tre_concern.md`: il clic sulla regola apre
l'ambiente sul metamodello ma non vi si posiziona (serve un `ruleId` nel detail, e il consumatore
e' il file dell'altra corsia); sotto `VALIDATION` convivono due specie di viewpoint; `otherVps`
resta sciolto. Li' anche due cose viste e non toccate.
**Prompt document name**: 2026-09-09 (Fase 2, tre concern sotto VIEWPOINTS)

## 2026-09-09 — discovery: i tre concern sotto VIEWPOINTS nell'albero del megamodello
**Prompt**: Fase 1 READ-ONLY corta, ramo `validation-skeleton`, normativa R-VAL-19 (`874199048`) e
spec §8bis. Sei domande: dove l'albero e' costruito e se e' dichiarativo; cosa sa fare la riga DATA
MANAGER al clic e se la riga di stato sopravvive a uno spostamento; chi calcola i conteggi; da cosa
e' decisa l'espansione di default e dove e' persistita; cosa fa l'occhio accanto a «State Machines
Syntax» e se e' riusabile per R-VAL-2; se il meccanismo del ramo visibile a zero e' generico o
scritto per il Data Manager. HARD STOP: nessuna modifica, nessuna proposta di implementazione.
**Files touched**: `docs/discovery/discovery_2026-09-09_albero_tre_concern.md` (nuovo, 387 righe) e
questa entry. Nessun sorgente.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — nessun file di codice toccato. `git status --porcelain frontend/src` mostra
solo i due file di `validation/ValidationRulesModal.*` gia' sporchi a inizio sessione, di altra
corsia, non toccati; controllo positivo sullo stesso comando senza pathspec.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — sola lettura, nessun sorgente.
**Smoke visivo**: non applicabile. Referto di sorgente con controlli positivi sui comandi
(`command grep`, non il wrapper): `bi-eye` 2 occorrenze in `TreeViewContent.tsx` con controllo
positivo `bi-chevron` = 3; `bi-eye-slash` zero nello stesso file mentre il repo ne ha (negativo con
controllo). Il comportamento a schermo non e' stato rimisurato in questo giro: e' dichiarato in §8.
**Notes**: Tre reperti nel referto, §5, §3, §6. L'occhio accanto al viewpoint **non e' un toggle**:
e' il glifo di tipo, e l'attivazione vive solo nel picker della Toolbar, **esclusiva**, opposta a
R-VAL-2. I conteggi non sono gia' omogenei: `DATA MANAGER` conta classi, non viewpoint. `SYNTAX` e
`VALIDATION` esistono gia' ma dietro un `length > 0`. Perimetro Fase 2: 6 file, sopra la regola 19.
**Prompt document name**: 2026-09-09 (Fase 1, tre concern sotto VIEWPOINTS)

## 2026-09-09 — docs: §9.3, svuotare una reference non svuota, e leggerla conta uno di troppo
**Prompt**: seconda meta' del giro, dichiarata indipendente dalla misura sul transitorio verde e da
fare solo dopo. Aggiungere a `CLAUDE.md` §9.3 due misure della stessa famiglia del fallimento muto:
`slot.values = []` NON svuota uno slot di reference gia' scritto e non lancia; in lettura, una
reference singola mai impostata torna `[null]`, quindi `length` vale 1 dove non c'e' nessun valore.
Solo docs, `gen:agents` e `check:agents` obbligatori, commit separato.
**Files touched**: `CLAUDE.md` (§9.3, +18 righe), `AGENTS.md` (rigenerato). Questa entry nello
stesso commit. `frontend/src/jjtl/AGENTS.md` rigenerato e identico, quindi fuori dal diff.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — nessun sorgente toccato, `git status --porcelain frontend/src` vuoto con
controllo positivo. `npm run check:agents` PASS su entrambi i generati; `npm run check:docs` 3/3
con i 2 warning pre-esistenti. Build e suite non eseguite: nessun sorgente.
**Out-of-scope changes**: no — `AGENTS.md` e' il generato che RC-7 e §17 impongono nello stesso
commit della sorgente.
**Layer Impact Report**: not-required — nessun sorgente.
**Smoke visivo**: non applicabile. Le due misure iscritte non sono nuove: vengono dalla sonda della
5.3, dove hanno prodotto quattro FAIL che misuravano un modello sano.
**Notes**: Iscritta anche la conseguenza operativa, che e' la parte utile: non esiste una forma
misurata che svuoti dalla proxy L una reference gia' scritta, quindi una fixture che vuole una
reference non impostata **la costruisce cosi'** invece di scriverla e ritirarla. E per la lettura,
si conta su `__raw.values` filtrando i falsy ogni volta che la domanda e' «c'e' un valore».
**Prompt document name**: 2026-09-09 (§9.3, svuotamento e lettura)

## 2026-09-09 — docs: il ritiro delle voci di validazione non passa per il verde
**Prompt**: misura corta e sola, ramo `validation-skeleton`. Il ritiro di R-VAL-18
(`clearValidationProblems`) attraversa il transitorio verde di 5 secondi del registro? Cioe': dopo
un Validate con violazioni, toccando il modello, i nodi che violavano mostrano un pallino VERDE
prima di spegnersi? Verde su un nodo si legge «sistemato», ed e' la cosa falsa che R-VAL-18 ha
escluso escludendo `markResolved`. Misurare il PIXEL, non dedurlo dal codice (P11). HARD STOP se il
verde c'e'.
**Files touched**: `docs/discovery/harness/probe_2026-09-09_ritiro_transitorio_verde.mts` (nuova) e
questa entry. Nessun sorgente.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — nessun file di codice toccato, `git status --porcelain frontend/src` vuoto
con controllo positivo sullo stesso comando senza pathspec.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun sorgente, sola lettura.
**Smoke visivo**: passato, sonda **6 PASS 0 FAIL**. Campionatore a 30 ms installato PRIMA della
modifica, finestra di 6.5 s, cioe' oltre i 5 s di `RESOLVED_TTL_MS`.
**Notes**: RISPOSTA: **il verde non c'e'**, e la decisione non e' violata. 223 campioni sulla
finestra del ritiro, un colore solo, `rgb(220,38,38)` con classe `--error`; zero campioni verdi,
zero `--resolved`; i pallini spariscono ~250 ms dopo la modifica. Il controllo positivo e'
obbligatorio e c'e': lo STESSO campionatore su una riparazione di conformance, che `markResolved`
lo usa davvero, vede `rgb(34,197,94)` e `--resolved` in 167 campioni su 222, dai 933 ms ai 5911.
**Prompt document name**: 2026-09-09 (misura, transitorio verde)

## 2026-09-09 — docs(libro): la figura 5.8, e i due indicatori che esistono davvero
**Prompt**: `claude_2026-09-09_1306_prompt_book_5_3_conformance_figure.md`. Le due immagini della
5.3 sono placeholder di giugno. Passo zero obbligatorio: verificare nell'applicazione quali
indicatori di conformance esistono oggi, e riferire qualunque scostamento. Poi portare la frase
della 5.3 dal singolare ai due livelli, ricatturare le due immagini mantenendo i nomi di file, non
riscrivere il resto della sezione, nessun commento di provvisorieta'.
**Files touched**: nel repo del libro (commit `6e8e689`), `author/part2/ch05-getting-started.tex`
piu' le due immagini `author/images/ch05-conformance-{violation,ok}.png` che sostituiscono i
placeholder. In questo repo, la sonda `probe_2026-09-09_book53_conformance.mts` e questa entry.
Nessun sorgente del frontend toccato.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — nessun file di codice toccato. `pdflatex` in scratch, due passate, exit 0,
zero errori e zero riferimenti irrisolti. Figura **5.8** (sottofigure 5.8a e 5.8b) a pagina 86, con
`\label` invariati. Overfull box: **26 prima, 26 dopo**, le stesse a meno dello scorrimento delle
righe; nessuna nuova.
**Out-of-scope changes**: no — `ch05-getting-started.tex` era pulito; le voci sporche dell'albero
del libro sono di un'altra corsia e non sono state toccate.
**Layer Impact Report**: not-required — nessun sorgente.
**Smoke visivo**: passato, sonda **15 PASS 0 FAIL**. Il modello sano e' misurato prima di romperlo,
il difetto e' costruito e non ottenuto svuotando uno slot.
**Notes**: I due livelli non sono quelli che il prompt supponeva. Non esiste nessun verdetto di
modello: la status bar dice «conforms to StateMachine» col punto verde in **entrambi** gli stati, ed
e' l'etichetta del legame. I due vivi sono il badge sull'elemento e il marcatore `missing` sulla
riga della feature, che il prompt non nominava. Terzo reperto, non corretto: la fascia del pannello
dichiara «Conforms to» anche sull'elemento segnalato (`Info.tsx:647` riassegna `conform` invece di
congiungerlo).
**Prompt document name**: 2026-09-09 13:06

## 2026-09-09 — docs(libro): la sezione 5.5, e il passo zero che l'ha decisa
**Prompt**: GO 5.5 su `claude_2026-09-09_1125_prompt_book_5_5_validation.md`, repo del libro,
capitolo `ch05-getting-started.tex`. Passo zero obbligatorio: guardare cosa fa l'applicazione oggi,
compresa la dichiarazione di freschezza, e riferire qualunque scostamento. Un invariante solo, per
istanza. Ricatturare le tre figure. Ritoccare la 5.6 e togliere la sua nota. Compilazione in
scratch, due passate. Aggiunta del prompt: smontare l'editor riporta a «mai validato», quindi la
sonda non deve navigare via fra il Validate e lo scatto.
**Files touched**: nel repo del libro (commit `1fdecc9`), `author/part2/ch05-getting-started.tex`
piu' tre immagini nuove `author/images/ch05-validation-{violation,fixed,rule}.png`. In questo repo,
la sonda `docs/discovery/harness/probe_2026-09-09_book55_validazione.mts` e questa entry. Nessun
sorgente del frontend toccato.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — nessun file di codice toccato, `git status --porcelain frontend/src` vuoto a
fine giro con controllo positivo sullo stesso comando senza pathspec. Compilazione `pdflatex` in
`-output-directory` di scratch, due passate, exit 0, zero errori e **zero riferimenti irrisolti** in
tutto il libro. Figure 5.13, 5.14, 5.15 alle pagine 90-92; `ch:jjel` risolve al capitolo 7.
**Out-of-scope changes**: no — `ch05-getting-started.tex` era pulito, le voci sporche dell'albero
del libro (`book.pdf`, `_build/book.pdf`, `book.idx`, `audit-2026-09/`) sono di un'altra corsia e
non sono state toccate ne' committate.
**Layer Impact Report**: not-required — nessun sorgente.
**Smoke visivo**: passato, sonda Playwright **22 PASS 0 FAIL** sulla fixture esatta del capitolo.
Le figure escono da quel giro, quindi testo e immagini descrivono lo stesso stato.
**Notes**: Invariante cambiato rispetto allo stub, come chiedeva il prompt. Tre scostamenti
riferiti: `isFinal` mai scritto vale `null` e la regola viola lo stesso, senza «non valutabili»; la
`ValidationPill` della 5.3 non e' montata (0 nel DOM), debito della 5.3; la figura dell'authoring
ritrae il controllo Active a meta' di un restyle di un'altra corsia, dichiarato accanto
all'`includegraphics`. La sezione e' in «we» e non in «you», per coerenza col capitolo.
**Prompt document name**: 2026-09-09 11:25

## 2026-09-09 — feat(validation): il pallino sulle istanze che violano, e la sua freschezza
**Prompt**: Fase 2 di R-VAL-18 / spec §8.5, ramo `validation-skeleton`, tre commit separati in
quest'ordine: (1) il risolutore vertice privato di `ConformanceProblemSync` esce in un modulo
condiviso, comportamento invariato, critical zone intatta; (2) `publishValidationProblems` registra
anche sotto l'id del vertice risolto; (3) la freschezza — ritiro alla prima transazione che tocca
modello **o** regole, UNA dichiarazione a tre stati mai per nodo, firma che copre entrambi. Verifica
eseguita e non dichiarata, piu' la mutazione. Fuori: tetto del popover, pallino nelle righe M1
dell'albero, istanze rese come edge sintetico — da iscrivere, non da risolvere.
**Files touched**: 10 sorgenti in tre commit — `problems/vertexResolver.ts` (nuovo),
`problems/ConformanceProblemSync.tsx`, `problems/validationToProblems.ts`,
`problems/validationFreshness.ts` (nuovo), `problems/ValidationFreshnessSync.tsx` (nuovo),
`editor-v2/Toolbar.tsx`, `editor-v2/EditorV2.tsx`, `editor-v2/EditorV2.scss`, piu' tre file di test
in `problems/__tests__/`. Poi la sonda `probe_2026-09-09_pallino_freschezza.mts`, l'addendum §8 al
referto di Fase 1 e questa entry, in un commit separato dal codice (RC-13).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `npx vitest run` 3458 verdi / 0 falliti, 9 file rossi in raccolta
`window is not defined`, gli stessi di sempre. `npm run typecheck` **33** = baseline §17, conteggio
su output completo e non su una coda, ed elenco degli errori **identico** a quello di inizio giro a
meno di riga e colonna. `npm run build` exit 0 col solo avviso di chunk-size.
**Out-of-scope changes**: no, ma **10 file sopra la soglia di 5** (regola 19): dichiarati in chat
prima del diff con cosa cambia in ciascuno, e sanabili a valle (RC-11). Sono la conseguenza diretta
dei tre commit ordinati dal prompt. `ValidationRulesModal.tsx/.scss` erano modificati in albero da
un'altra corsia e **non** sono stati toccati ne' committati.
**Layer Impact Report**: produced — in chat prima del diff. Nessuna scrittura nel D-layer: solo
letture di `idlookup`; il registro dei problemi e' stato di sessione, immune a undo/redo.
`canvasToJjom.ts` non e' toccato.
**Smoke visivo**: passato, sonda Playwright **14 PASS 0 FAIL** sull'app vera. Due istanze che
violano portano il pallino, la terza no; la dichiarazione dice «2 violations»; spostare un nodo NON
invalida (controllo P12); rinominare un'istanza che non viola ritira **tutti** i pallini e la
dichiarazione passa a «Changed since validation»; cambiare il solo **messaggio** di una regola —
che non muove nessun verdetto — fa lo stesso.
**Notes**: Mutazione eseguita in due sedi. Unitaria: tolto il ritiro, 3 test rossi; tolto il ramo
`DValidationRule` dalla firma, 4. Sull'app: tolto il ritiro, i 2 controlli «spariscono» diventano
rossi **mentre la dichiarazione resta verde** — che e' precisamente perche' R-VAL-18 chiede
entrambe le meta' e perche' si misurano separate. Trovato di passaggio: il risolutore esisteva in
**tre** copie, non due (`EditorV2.tsx:181` oltre a `canvasToJjom.ts:1347`).
**Prompt document name**: 2026-09-09 (Fase 2, pallino e freschezza)

## 2026-09-09 — discovery: il pallino rosso sulle istanze che violano (fetta 1)
**Prompt**: Fase 1 READ-ONLY, ramo `validation-skeleton`. Accertare cinque cose prima di aprire la
Fase 2: (1) come `ConformanceProblemSync` mappa una voce del registro sul badge del nodo e se
filtra per `NodeProblemKind`; (2) se un kind nuovo va dichiarato; (3) se esiste un meccanismo di
invalidazione riusabile — la domanda che conta, perche' la conformance si ricalcola sola e la
validazione gira a comando; (4) quanto testo e quante voci regge il badge su uno stesso nodo
(R-VAL-12); (5) se il canvas ridisegna sul cambio del registro o serve un evento. Consegna: referto
in `docs/discovery/`. HARD STOP, nessuna modifica al codice.
**Files touched**: `docs/discovery/discovery_2026-09-09_pallino_validazione_canvas.md` (nuovo) e
questa entry. Nessun sorgente.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — nessun file di codice toccato, `git status --porcelain frontend/src` vuoto a
fine giro, con controllo positivo sullo stesso comando senza pathspec.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1 toccato; la Fase 1 e' di sola lettura.
**Smoke visivo**: non applicabile — nessuna modifica renderizzabile.
**Notes**: Tre risposte cambiano il piano della Fase 2; il dettaglio sta in
`discovery_2026-09-09_pallino_validazione_canvas.md`. I badge sono agnostici rispetto al kind:
nessun punto in lettura filtra su `NodeProblemKind`, manca il solo ancoraggio al DVertex. La voce
chiavata sul DObject di un'istanza M1 non accende nemmeno l'albero: la legge solo il rail.
L'invalidazione non esiste, e `clearValidationProblems` e' scritta e mai chiamata.
**Prompt document name**: 2026-09-09 (Fase 1, pallino validazione)

## 2026-09-09 — feat(validation): la regola che non trova istanze, dichiarata
**Prompt**: chiusura del quarto modo silenzioso, R-VAL-17 / spec §8.4, ramo
`validation-skeleton`, commit unico e scope stretto. Una riga in fondo al modale degli esiti che
dichiara quante regole non hanno trovato nessuna istanza a cui applicarsi, stessa forma e stesso
posto della riga sulla regola che non compila, con cui convive. Il conteggio si prende nel
valutatore, non si ricostruisce nella UI; se serve cambiare la forma di `evaluateValidation`,
farlo in modo additivo. Non un quarto numero, non la copertura per regola, nessun indicatore sul
canvas. Verifica: test unitari piu' prova di mutazione, e una sonda che riproduce il caso vero.
**Files touched**: `model/validation/validationEvaluator.ts` (+`unmatchedRuleCount` nel referto,
una riga di calcolo, due blocchi di commento), `components/editor-v2/problems/ValidationResultsModal.tsx`
(la riga in fondo piu' l'intestazione), `model/validation/__tests__/validationEvaluator.test.ts`
(§G, 6 test). Poi la sonda `docs/discovery/harness/probe_2026-09-09_regola_senza_istanze.mts` e
questa entry, in un commit separato dal codice (RC-13).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `npx vitest run` 3409 verdi / 0 falliti (erano 3403: +6, i nuovi), 9 file
rossi in raccolta `window is not defined`, gli stessi di sempre. `npm run typecheck` **33** =
baseline §17, conteggio su output completo e non su una coda, zero nei file toccati.
`npm run build` exit 0 col solo avviso di chunk-size.
**Out-of-scope changes**: no — nessun file fuori dai tre dichiarati. `validationContext.ts` non e'
toccato: `ValidationRunResult` estende `ValidationReport` e il campo nuovo ci passa da solo.
**Layer Impact Report**: not-required — nessun file di §3.1. Il valutatore e' il modulo puro, il
modale legge e basta: nessuna scrittura nel D-layer.
**Smoke visivo**: passato, sonda Playwright **9 PASS 0 FAIL** piu' due catture. Il caso vero
riprodotto alla lettera: classe `Initial` sottoclasse di `State` senza istanze, e nel modello due
istanze di `State` chiamate «Initial» e «FInal». Il modale dichiara **entrambe** le cose — una
violazione nell'elenco e «1 rule found no instance to apply to» in fondo — mentre la riga di
riepilogo continua a dire «2 rules over 2 instances», che e' il posto dove il difetto si nascondeva.
**Notes**: Mutazione eseguita in due forme, entrambe rosse: `unmatchedRuleCount = 0` rompe 5 test su
6, `= compiled.length` ne rompe 3. Il controllo che discrimina (P12) e' nella sonda: spostato il
contesto della regola muta da `Initial` a `State` — stessa regola, stesso corpo — la riga sparisce e
le violazioni salgono da 1 a 3. Spente e non compilanti NON rientrano nel conto: hanno gia' la loro
dichiarazione.
**Prompt document name**: 2026-09-09 11:00

## 2026-09-09 — docs: §9.3, gli slot di reference si scrivono in un altro modo, e sbagliare e' muto
**Prompt**: task docs autonomo, fuori dalla corsia, solo file normativi. Iscrivere in `CLAUDE.md`
nella famiglia §9.1 la misura dello step di chiusura: una reference M1 si scrive con
`slot.values = [id]`, mentre `slot.value = <id>` e `slot.value = <oggetto L>` non lanciano e non
scrivono; per gli attributi `slot.value = <primitivo>` funziona. Nominare esplicitamente
l'aggravante: il fallimento e' muto, quindi una sonda che scrive cosi' misura uno stato che non ha
mai creato. Verificare con grep se la cosa e' gia' detta altrove e correggere li' invece di
duplicare.
**Files touched**: `CLAUDE.md` (§9.3 nuova, 33 righe), `AGENTS.md` (rigenerato). Questa entry nello
stesso commit, come chiede il prompt. `frontend/src/jjtl/AGENTS.md` rigenerato e **identico**,
quindi non compare nel diff.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — nessun file di codice toccato, `git status --porcelain frontend/src` vuoto a
fine giro con controllo positivo sullo stesso comando senza pathspec. `npm run check:agents` PASS su
entrambi i generati; `npm run check:docs` 3/3 con i 2 warning pre-esistenti. Build e suite non
eseguite: nessun sorgente toccato.
**Out-of-scope changes**: no — `AGENTS.md` e' il generato che RC-7 e §17 impongono di includere
nello stesso commit della sorgente.
**Layer Impact Report**: not-required — nessun file di §3.1, nessun sorgente.
**Smoke visivo**: non applicabile — solo documentazione. La misura iscritta non e' nuova: viene
dalla sonda del giro precedente, che l'ha prodotta eseguendo le quattro forme in sequenza su uno
slot vero (`probe_2026-09-09_semaforo_end_to_end.mts`).
**Notes**: Il grep preventivo dice che la cosa NON era detta da nessuna parte: `CLAUDE.md` §9.1 e
§9.2 mostrano `['$' + attr].value = v`, che e' giusto per gli **attributi** e resta, e §3.12 parla
dello slot di identita'. Niente da correggere altrove, quindi sezione nuova e non riscrittura.
Iscritto anche il corollario in lettura: `slot.values` sulla proxy L torna gli oggetti avvolti e
non gli id, che e' l'altra meta' dello stesso inciampo.
**Prompt document name**: 2026-09-09 01:10

## 2026-09-09 — docs: il semaforo del libro, giro end to end dall'authoring
**Prompt**: chiusura della fetta, voci 3 e 4 di un documento di milestone, in un giro solo.
Semaforo del libro in offline; viewpoint creato dall'interfaccia; le tre invarianti della Tabella
7.5 scritte dall'authoring, la terza nella forma corretta; una quarta nella forma originale del
libro lasciata li'; Validate con il terzo numero che conta le non valutabili; stato iniziale tolto
e rimesso; estensione verificata con un secondo modello. Tre schermate per la sezione 5.5. Nessuna
modifica al codice: se il giro scopre un difetto si riferisce e ci si ferma.
**Files touched**: `docs/discovery/discovery_2026-09-09_semaforo_end_to_end.md` (nuovo, 11 sezioni),
`docs/discovery/harness/probe_2026-09-09_semaforo_end_to_end.mts` (nuova, 6 blocchi) e questa entry.
**Nessun file di codice.** Tre figure scritte come artefatti ignorati accanto alla sonda, path nel
referto §8.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `git status --porcelain frontend/src` vuoto a fine giro, con controllo
positivo sullo stesso comando senza pathspec, che elenca i due file nuovi. Nessun gate di build o
suite: giro di sola misura, dichiarato nel referto §11.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1, nessun sorgente.
**Smoke visivo**: passato, **13 PASS 0 FAIL**, piu' tre catture. Sul semaforo sano i numeri sono
`0 / 0 / 3`; tolto lo stato iniziale diventano `3 / 0 / 3` con le tre voci di `oneInitialState`;
rimesso tornano `0 / 0 / 3`. Con una seconda macchina a stati nel progetto restano `0`.
**Notes**: Rilievo dichiarato in §0 del referto: `docs/archivio/claude_milestone_validazione_scheletro.md`
**non esiste** (tre ricerche con controllo positivo). Non mi sono fermato perche' il prompt descrive
il giro per esteso; se «voci 3 e 4» erano altro, il giro va rifatto. Misura utile alle prossime
sonde: una reference M1 si scrive con `slot.values = [id]`, mentre `slot.value = <id>` e
`slot.value = <oggetto>` non lanciano e non scrivono.
**Prompt document name**: 2026-09-09 00:30

## 2026-09-09 — feat(validation): Step 4, l'authoring minimo delle regole
**Prompt**: Step 4 come da prompt di Fase 2. Un punto da cui creare, editare e cancellare regole
su una classe scelta, Monaco per il corpo, contesto dichiarato in testa (`self: <Classe>`), le
ereditate in sola lettura e distinte dalle proprie. NON nel rail di destra (R-VAL-1, R-VAL-11).
**Files touched**: nuovi `model/validation/validationRuleSets.ts` (puro),
`model/validation/validationAuthoring.ts` (le tre scritture),
`model/validation/__tests__/validationRuleSets.test.ts` (11 test),
`components/validation/ValidationRulesModal.tsx` e `.scss`; modificati `events/registry.ts`
(+1 evento), `editor-v2/Toolbar.tsx` (bottone, handler e il selettore di Advanced), `App.tsx`
(mount). Poi la sonda e questa entry.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `npx vitest run` 3403 verdi / 0 falliti (erano 3393: +10, i nuovi), 9 file
rossi `window is not defined`, gli stessi. `tsc --noEmit` 33 = baseline §17, 0 nei file toccati.
`build` exit 0 col solo avviso di chunk-size.
**Out-of-scope changes**: yes — **deroga alla regola 19 dichiarata (RC-11): 8 file**, elencati
sopra con cosa cambia in ciascuno. Nient'altro fuori da quella lista.
**Layer Impact Report**: not-required — nessun file di §3.1.
**Smoke visivo**: passato, sonda Playwright **13 PASS 0 FAIL** piu' tre screenshot: apertura dal
bottone vero, ereditate visibili e non selezionabili, giro completo di scrittura riletto dal
D-layer, cancellazione con conferma che toglie entrambe le meta' del legame. Controllo positivo
che discrimina (P12): sulla superclasse la sezione delle ereditate NON esiste.
**Notes**: Due difetti trovati dalla sonda e corretti nel giro. (1) La firma della `useSelector`
delle regole non comprendeva la collezione del viewpoint: creazione e aggancio arrivano in commit
distinti, quindi «New rule» scriveva nel D-layer e il riquadro restava vuoto. (2) Il rail delle
Properties dipingeva **sopra** il modale nella fascia di destra, con il bottone di cancellazione
inerte; risolto col portale su `document.body`. Il pixel contro il numero: il fondale calcolava
gia' 1050 contro 900.
**Prompt document name**: 2026-09-08 16:50

## 2026-09-09 — fix(jjscript): l'estensione si restringe dentro buildEvalContext
**Prompt**: correzione dell'estensione, opzione (b), R-VAL-16 / spec §8.2, commit separato prima
dello Step 4. Parametro opzionale su `buildEvalContext`, default identico a oggi, shell costruite
gia' ristrette e non ricostruite ne' mutate dopo, restrizione su tutti e quattro i posti mappati
compresa la mappa delle ambiguita'. Nessun altro sito di chiamata toccato. Cinque criteri di
accettazione tutti misurati, prova di mutazione compresa. Gate pieni perche' il modulo e' condiviso.
**Files touched**: `jjscript/executor/commands/evalExtent.ts` (nuovo, il selettore puro),
`jjscript/executor/commands/eval.ts` (parametro opzionale piu' la riga che restringe il pool),
`jjscript/index.ts` (+1 export di tipo), `jjscript/__tests__/evalExtent.test.ts` (nuovo, 6 test),
`model/validation/validationContext.ts` (il chiamante e la sua intestazione). Poi la sonda
aggiornata e questa entry. **I quattro chiamanti storici NON sono toccati**: la console via
`executeEval`, i comandi `let` e `forall` di JjScript, e Jjodie (`jodieJjelContext.ts`). Nessuno
passa un secondo argomento — enumerati con un grep sull'intero `frontend/src`.
**Outcome**: ✅ completed
**Corregge**: 2026-09-08 16:50
**Causa**: (c)
**Regressions**: no — `npx vitest run` 3393 verdi / **0 test falliti** (erano 3387: +6, i nuovi),
9 file rossi `window is not defined`, gli stessi identici. `tsc --noEmit` 33 = baseline §17, 0 nei
file toccati. `build` exit 0 col solo avviso di chunk-size.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1.
**Smoke visivo**: passato. Sonda di R-VAL-15 rieseguita: **da 4 PASS 2 FAIL a 7 PASS 0 FAIL**, con
i due rossi diventati verdi e i verdi rimasti verdi. Piu' una prova di mutazione (P12): tolta la
restrizione dal selettore, la suite passa da 6/6 a 3 rossi.
**Notes**: I cinque criteri, uno per uno: (1) invariante del libro verde e `State.instances.size ==
2` verde; (2) controllo positivo invariato, `isInitial` viola su una delle due istanze; (3)
`self.instanceOf == State` tiene ancora per identita'; (4) default immutato, provato sull'IDENTITA'
dell'array — una copia sarebbe gia' un cambiamento; (5) mutazione rossa. Aggiunto un blocco di
simmetria su SM_B che il prompt non chiedeva: la restrizione segue il modello aperto.
**Prompt document name**: 2026-09-08 16:50

## 2026-09-09 — docs: la verifica di R-VAL-15 e' ROSSA, l'estensione e' il progetto
**Prompt**: verifica piccola e bloccante prima dello Step 4, R-VAL-15 / spec §8.2. Due modelli
della stessa lingua nello stesso progetto, uno stato iniziale ciascuno, e
`(forall s in State.instances such that s.isInitial).size == 1` eseguita dal comando Validate sul
modello aperto: deve NON violare. Se rossa, riferire PRIMA di correggere, perche' la correzione
tocca `buildEvalContext`, condiviso con console, JjScript e Jjodie.
**Files touched**: `docs/discovery/harness/probe_2026-09-09_estensione_perimetro_validato.mts`
(nuova) e questa entry. **Nessun file di codice**: giro di sola misura, come chiedeva il prompt.
**Outcome**: ⚠️ partial — la misura e' completa, la correzione non e' stata scritta perche' il
prompt la subordina a una decisione.
**Corregge**: —
**Causa**: (c)
**Regressions**: no — `git status --porcelain frontend/src` vuoto a fine giro, con controllo
positivo sullo stesso comando senza pathspec, che elenca la sonda. Nessun gate di build o suite:
nessun diff di sorgente da difendere.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1, nessun sorgente.
**Smoke visivo**: passato per sonda, **4 PASS 2 FAIL**, e i due rossi sono il risultato cercato:
`State.instances.size == 2` viola e la prima invariante del libro viola su un modello che ha UN
solo stato iniziale. Controllo positivo che discrimina (P12): una terza regola viola su UNA sola
delle due istanze del modello aperto, quindi il comando ha girato, ha visto SM_A e non ha
iterato SM_B.
**Notes**: Il perimetro delle ISTANZE validate e' giusto (R-VAL-14 regge); a essere di progetto e'
l'ESTENSIONE che la quantificazione attraversa. Misurato anche, prima di qualunque correzione,
l'invariante che una correzione non deve rompere: `self.instanceOf == State` tiene per identita' di
riferimento, quindi le shell delle classi vanno modificate sul posto e non ricostruite. Tre opzioni
di correzione riportate in chat, nessuna scritta.
**Prompt document name**: 2026-09-08 16:50

## 2026-09-08 — feat(validation): Step 3, il comando e la lista
**Prompt**: GO Step 3 con R-VAL-14 (spec §8.1): la superficie dichiara TRE numeri —
violazioni, regole inattive, valutazioni non valutabili — e il terzo e' un contatore, non voci
del registro. Perimetro il modello aperto. Resto invariato: comando esplicito, nessun debounce,
nessun `AFTER_TRANSACTION`, `ValidationPill` non si ripara, niente indicatori sul canvas quindi
l'ancoraggio doppio di R-M2U resta fuori e alla lista basta l'id elemento.
**Files touched**: nuovi `model/validation/validationContext.ts`,
`editor-v2/problems/validationToProblems.ts`, `editor-v2/problems/ValidationResultsModal.tsx` e
`.scss`; modificati `editor-v2/problems/registry.ts` (+1 membro nella union),
`events/registry.ts` (+1 evento), `editor-v2/Toolbar.tsx` (bottone e handler), `App.tsx` (mount).
Poi `docs/discovery/harness/probe_2026-09-08_validation_skeleton_step3.mts` e questa entry.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `npx vitest run` 3387 verdi / 0 falliti, 9 file rossi `window is not
defined`, gli stessi di prima. `tsc --noEmit` 33 = baseline §17, 0 nei file toccati. `build`
exit 0 col solo avviso di chunk-size.
**Out-of-scope changes**: yes — **deroga alla regola 19 dichiarata (RC-11): 8 file**, elencati
sopra con cosa cambia in ciascuno. Nessuno fuori da quella lista; `EditorV2.tsx` non e' toccato
perche' il produttore non e' un componente montato ma una funzione chiamata dal comando.
**Layer Impact Report**: not-required — nessun file di §3.1.
**Smoke visivo**: passato, sonda Playwright **13 PASS 0 FAIL** piu' tre screenshot: fixture
costruita dall'app, click sul BOTTONE vero, i tre numeri letti a schermo (1 violazione, 1 regola
inattiva, 2 non valutabili), una sola voce nel registro, e il controllo positivo che DISCRIMINA
per P12 — cambiato il modello, le violazioni passano da 1 a 2.
**Notes**: Misura non scontata: un booleano opzionale **mai scritto** vale `null`, non `false`,
quindi la regola su quell'istanza esce NON VALUTABILE e non violata. Argomentata nel blocco G
della sonda. Costo del comando su 5 regole x 2 istanze: 9 ms, contesto compreso. Scostamento
dichiarato: quando una regola non compila il modale lo dice in una riga, perche' il canale di
authoring non esiste ancora e l'alternativa e' il silenzio.
**Prompt document name**: 2026-09-08 16:50

## 2026-09-08 — feat(validation): Step 2, il valutatore
**Prompt**: GO opzione (a) — `redux/store.tsx` non si tocca, la cartella di stato resta con le
altre 18, la riparazione generale resta iscritta e non si apre qui. Poi Step 2 come da prompt di
Fase 2 con R-VAL-13: modulo puro senza import verso il joiner, raccolta lungo la gerarchia
(R-VAL-12), `self` l'istanza, tri-stato al confine con i tre ingressi, verdetto che pretende un
booleano e non converte nulla, test unitari incluse le tre invarianti del libro. Nuovo in
normativa: P12, il controllo positivo deve discriminare.
**Files touched**: `frontend/src/model/validation/validationEvaluator.ts` (nuovo),
`frontend/src/model/validation/__tests__/validationEvaluator.test.ts` (nuovo, 24 test). Questa
entry a parte. **Nessuna riga di `redux/store.tsx`**, come da opzione (a).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `npx vitest run` 3387 verdi / **0 test falliti** (erano 3363: +24, i nuovi),
9 file rossi per `window is not defined`, gli stessi identici di prima. `tsc --noEmit` 33 errori =
baseline §17, **0** sotto `model/validation`. `build` exit 0 col solo avviso di chunk-size.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1. Il modulo non importa `joiner`, e
questa e' una proprieta' verificabile: gira nella suite, che `validationTypes.ts` non puo' fare.
**Smoke visivo**: non applicabile — modulo puro, nessuna superficie. Al posto suo i 24 test che lo
ESEGUONO, piu' una **prova di mutazione** (P12 applicato alla suite invece che a una sonda):
introdotta in `verdict()` proprio la truthiness che R-VAL-13 vieta — array non vuoto -> vero — la
suite passa da 39/39 a **3 rossi**, e ripristinata torna verde. Una suite che non discrimina la
regola che difende sarebbe decorazione.
**Notes**: La terza invariante del libro finisce fra le non valutabili, e il test lo mostra accanto
alla forma corretta: `forall t in coll: pred` su un modello ROTTO produce zero violazioni, mentre
`coll.all(t => pred)` sullo stesso modello ne produce una. E' il costo di R-VAL-13, gia' dichiarato
nella spec §5.1. Altra conseguenza scritta nel modulo: `self.owner?.name != ""` su un'istanza senza
`owner` non compra un verdetto, esce non valutabile per il terzo ingresso.
**Prompt document name**: 2026-09-08 16:50

## 2026-09-08 — docs: la verifica sulle cartelle di stato, e perche' la correzione non si fa
**Prompt**: precedenza sullo Step 2. Sanare `state.validationviewpoints` e `state.validationrules`
come array in `redux/store.tsx`, additivo, **con verifica obbligatoria prima di scrivere**: un
progetto salvato senza quelle chiavi, ricaricato, le trova? Se il ripristino e' in blocco la chiave
arriva `undefined` e rompe in un altro modo. Se serve toccare `VersionFixer`: hard stop, non farla,
riferire. Inoltre, senza aprire corsie: dichiarare in commento che `VALIDATION_VIEWPOINT_ID` e' una
scorciatoia dello scheletro e non la forma (R-VAL-2 multiplo, al contrario di R-DMV-1 singleton), e
iscrivere che cancellare un viewpoint lascia le regole orfane.
**Files touched**: `frontend/src/model/validation/validationTypes.ts` (solo commenti: +24 sul
puntatore fisso, +9 sulle regole orfane), `docs/TECH-DEBT.md` (due entry nuove),
`docs/discovery/harness/probe_2026-09-08_cartelle_di_stato_al_reload.mts` (nuova) e questa entry.
**Nessuna riga di `redux/store.tsx`**: la correzione non e' stata scritta, ed e' il punto della entry.
**Outcome**: ⚠️ partial — la verifica e' completa, la correzione e' ferma per la condizione che il
prompt stesso poneva.
**Corregge**: —
**Causa**: (c)
**Regressions**: no — nessuna riga di codice eseguibile toccata (solo commenti). `tsc --noEmit` 33
errori = baseline §17; `vitest run src/model/validation` 15/15 verdi.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1; `redux/store.tsx` letto e NON modificato.
**Smoke visivo**: passato per sonda, **9 PASS 0 FAIL**: riproduce la cartella-stringa, la vede
sopravvivere a salva+ricarica, toglie dallo snapshot una chiave **dichiarata** su `DState`
(`edgepoints`) e la fa passare dal percorso di caricamento vero, e passa in rassegna tutte le classi D.
**Notes**: Ripristino **in blocco**: `edgepoints`, dichiarata su `DState` e tolta dallo snapshot,
torna `undefined`. Completare la correzione vuol dire una migrazione: hard stop come da prompt.
E non e' un difetto della validazione — 20 classi D su 44 sono nella stessa condizione,
`DAnnotation` e i tre edge comprese. Le due entry nuove di `docs/TECH-DEBT.md` argomentano tutto.
**Prompt document name**: 2026-09-08 16:50

## 2026-09-08 — feat(validation): Step 1, il modello dello scheletro
**Prompt**: Step 1 del prompt di Fase 2 dopo il GO su D1=(b). `DValidationViewpoint` e
`DValidationRule` come tipi paralleli, non `DViewElement` e senza supertipo comune (R-VAL-6-bis);
campi della regola name/context/body/message/enabled, nessuna severita'; il viewpoint nasce alla
prima scrittura come il Data Manager Viewpoint, senza migrazione e senza bump di `DState.version.n`
se si resta additivi, e se un bump serve dichiararlo e fermarsi.
**Files touched**: `frontend/src/model/validation/validationTypes.ts` (nuovo, 4 classi + find/ensure),
`frontend/src/model/validation/__tests__/validationTypes.test.ts` (nuovo, 15 test),
`frontend/src/joiner/index.ts` (+3, un export). Poi, in commit separati:
`docs/TECH-DEBT.md` (il todo iscritto su richiesta),
`docs/discovery/harness/probe_2026-09-08_validation_skeleton_step1.mts` (nuova) e questa entry.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — suite `npx vitest run` 3363 test verdi / 0 falliti, 9 file rossi per
`window is not defined`; **baseline misurata nello stesso giro** togliendo le tre modifiche e
rimettendole da copia (mai `git stash`, RC-13): 3348 verdi, gli stessi 9 file rossi. Delta +15,
che sono i test nuovi. `tsc --noEmit` 33 errori, cioe' la baseline di §17 esatta, 0 sotto i file
toccati. `build` exit 0 col solo avviso di chunk-size.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1. `joiner/index.ts` tocca solo la lista
degli export; nessun campo aggiunto a una classe D esistente.
**Smoke visivo**: passato, per sonda invece che a occhio: la suite gira in `environment: node` e il
modulo importa `joiner`, che scrive su `window`, quindi il test unitario e' sul SORGENTE e la sonda
Playwright fa il resto — **24 PASS 0 FAIL** su registrazione D<->L, nascita alla prima scrittura,
le due direzioni del legame, la proxy L e il giro salva-ricarica-rileggi. Tre controlli positivi.
**Notes**: Un rilievo da decidere, riportato in chat e non sanato: `state.validationviewpoints`,
la cartella derivata dal className in `reducer.ts:466`, resta una **stringa** perche' `DState` non
la dichiara, mentre `viewpoints` e `viewelements` sono array letti come tali in 8 siti. Nessuno
legge la nostra oggi (0 occorrenze). Sanarla sono 2 righe additive in `redux/store.tsx`, fuori dal
perimetro del prompt: regola 20, si riporta e ci si ferma.
**Prompt document name**: 2026-09-08 16:50

## 2026-09-08 — docs: Step 0, il verdetto booleano delle regole di validazione
**Prompt**: Step 0 del prompt di Fase 2 (scheletro della validazione definita dall'utente),
READ-ONLY con hard stop. Misurare ESEGUENDO l'evaluator: il tipo di ritorno delle tre invarianti
della Tabella 7.5 del libro; che cosa restituisce `forall ... : pred` con almeno un elemento falso
e come si converte a booleano; lo stesso su collezione vuota; se esista gia' una funzione
`JjelValue -> boolean` e quale regola applichi. Il linguaggio non si tocca.
**Files touched**: `docs/discovery/discovery_2026-09-08_verdetto_booleano.md` (nuovo, 11 sezioni),
`docs/discovery/harness/probe_2026-09-08_jjel_verdetto_booleano.mts` (nuova, 8 blocchi). Nessun file
di codice. Ramo nuovo `validation-skeleton` da `alfonso-frontend-jjtl`, come chiede il prompt.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — nessun file di codice toccato, `git status --porcelain frontend/src` vuoto a
fine giro con controllo positivo sullo stesso comando senza pathspec, che elenca i due file nuovi.
Nessun gate di build o suite: giro read-only senza diff di sorgente, dichiarato nel referto §11.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1, nessun sorgente.
**Smoke visivo**: non applicabile. Al posto suo la sonda consegnata, che ESEGUE parser ed evaluator
JjEL su un contesto della forma di `buildEvalContext` (P11): **42 PASS 0 FAIL**, con sette controlli
positivi a esito noto sulla fixture, senza i quali un elenco di esiti sorprendenti sarebbe
indistinguibile da un modello vuoto.
**Notes**: L'ipotesi del prompt e' confermata sulla terza invariante e imprecisa sulla prima: INV1 e
INV2 sono booleane, solo INV3 restituisce un array. `[false]` e' vero per tutte le vie misurate —
`if`, `not`, `and`, `implies`, `Boolean()` — e `[]` e' falso per JjEL e vero per il `Boolean()` di
JjTL/JjScript: due difetti opposti, e due regole gia' in circolo che divergono su un valore.
Nessun convertitore esportato. Tre domande aperte in §10, D1 bloccante per lo Step 2.
**Prompt document name**: 2026-09-08 16:50

## 2026-09-08 — docs: micro-discovery, l'estensione del difetto keyword-dopo-il-punto
**Prompt**: micro-discovery READ-ONLY, nessun fix. Misurare l'estensione del difetto nel lexer JjEL
per decidere se la correzione sia prerequisito della validazione definita dall'utente o corsia
laterale: elenco completo delle keyword, esito per ciascuna dopo un punto misurato eseguendo il
parser, esistenza di un controllo che impedisca di chiamare una feature come una keyword, confronto
con la tabella JjTL. Referto piu' sonda in `docs/discovery/harness/`. Il lexer non si tocca.
**Files touched**: `docs/discovery/discovery_2026-09-08_keyword_dopo_il_punto.md` (nuovo, 251 righe),
`docs/discovery/harness/probe_2026-09-08_jjel_keyword_after_dot.mts` (nuova, 7 blocchi). Nessun file
di codice.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — nessun file di codice toccato, `git status --porcelain frontend/src` vuoto a
fine giro con controllo positivo sullo stesso comando senza pathspec. Nessun gate di build o suite:
giro read-only, dichiarato nel referto §11.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1, nessun sorgente.
**Smoke visivo**: non applicabile. Al posto suo la sonda consegnata, che ESEGUE lexer, parser ed
evaluator JjEL e il lexer JjTL (P11): **16 PASS 0 FAIL**, con le due tabelle IMPORTATE dal sorgente
e non trascritte, e due controlli positivi separati — otto nomi non-keyword che devono parsare e
`checkNameShape` su input che deve rifiutare.
**Notes**: Cinque ipotesi falsificate (referto §2). Il difetto non e' di `forAll`: rompono **18
keyword su 18** in navigazione, 15/18 come identificatore nudo, 25/25 sul lexer JjTL. Ma `type`,
`name` e `value` non sono keyword e parsano, e `a["<kw>"]` funziona su tutte e 18 fino alla lettura
del valore. Verdetto: **corsia laterale**. Nessun controllo impedisce di chiamare una feature come
una keyword, a nessuno dei tre livelli cercati. Tre domande aperte in §10.
**Prompt document name**: 2026-09-08 17:40

## 2026-09-08 — docs: §12.6 dice il vero su `forall` in JjEL
**Prompt**: task docs autonomo, fuori dalla corsia validazione, solo file .md. `CLAUDE.md` §12.6
dichiara `coll.forAll(x: pred)`; la discovery del 2026-09-08 punto 7 la falsifica. Sostituire la
forma, segnalare `x: pred` come non supportata e `forAll` come rotta nel lexer, cercare la stessa
forma negli altri documenti normativi ed elencare le occorrenze. Nessun fix di codice.
**Files touched**: `CLAUDE.md` (§12.6: riga di tabella + nota nuova di 16 righe), `AGENTS.md`
(rigenerato), `frontend/src/jjtl/SPEC.md` (§12.2, riga di Known Bugs), `frontend/src/jjtl/CLAUDE.md`
(Known limitations, primo bullet), `frontend/src/jjtl/AGENTS.md` (rigenerato). Questa entry a parte.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — nessun file di codice toccato, `git status --porcelain frontend/src` limitato
ai tre .md dichiarati, con controllo positivo sullo stesso comando senza pathspec. `npm run
check:agents` PASS su entrambi i generati; `npm run check:docs` 3/3 con i 2 warning pre-esistenti.
Build e suite non eseguite: nessun sorgente toccato.
**Out-of-scope changes**: yes — i due `AGENTS.md`, rigenerati e inclusi nello stesso commit come
impongono RC-7 e §17, non erano nella lista del prompt. Deroga alla regola 19 dichiarata: 6 file,
di cui 2 generati e 1 la entry di log. Nient'altro fuori dalla lista.
**Layer Impact Report**: not-required — nessun file di §3.1, nessun sorgente.
**Smoke visivo**: non applicabile — solo documentazione. Al posto suo una sonda fuori albero (P11)
che ESEGUE parser ed evaluator JjEL sulle forme prima di scriverle nel documento: `coll.forAll(x =>
pred)` fallisce come `coll.forAll(x: pred)` (`1:9 Expected property name after '.'`), `getCollectionMethod('forAll')`
e' assente, `coll.all(x => pred)` parsa e valuta `false` sul fixture. Controllo positivo nello stesso giro.
**Notes**: Scostamento dichiarato: il prompt chiedeva `coll.forAll(x => pred)`, che la sonda mostra
fallire allo stesso modo — `forAll` non e' un metodo di collezione e il lexer lo prende per keyword
comunque. Scritto `coll.all(x => pred)`. Terzo errore nella stessa cella: JjEL `forall` non e' un
quantificatore booleano ma una comprehension, per decisione esplicita
(`docs/spec/concern_languages.md:53`). `PROTOCOL.md` e `docs/spec/` non contengono la forma.
**Prompt document name**: 2026-09-08 17:05

## 2026-09-08 — docs: discovery della validazione definita dall'utente (Fase 1 + addendum)
**Prompt**: Fase 1 read-only two-phase piu' addendum, otto punti: forma del registry dei problemi e
innesto per un produttore nuovo; firma/contesto/tri-stato di JjEL; dependency set esposto o esponibile;
come si aggiunge un elemento contenuto in una classe M2 (VersionFixer, round trip .ecore); aggancio a
fine transazione; se la radice del modello sia tipata; stato di allInstances e di `.forAll`; se la chiave
del registro ammetta uno scope non ancorato. Referto obbligatorio, hard stop prima di qualunque codice.
**Files touched**: `docs/discovery/discovery_2026-09-08_validazione_definita_utente.md` (nuovo, 834
righe). Nessun file di codice.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — nessun file di codice toccato; `git status --porcelain frontend/src` vuoto a fine
giro, con controllo positivo sullo stesso comando senza pathspec (che elenca il referto). Nessun gate di
build o suite eseguito: dichiarato nel referto §6.3.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1. `LModelElement.tsx`, `joiner/classes.ts`,
`redux/reducer/reducer.ts` e `VersionFixer.tsx` letti e non modificati.
**Smoke visivo**: non applicabile — Fase 1 read-only. Al posto suo, due sonde fuori albero che ESEGUONO
lexer/parser/evaluator JjEL (P11) e non ne leggono il sorgente; output integrale nel referto §4.2 e §5.3,
con controlli positivi (`forall … in …` e `exists` a 0 errori) accanto ai casi che falliscono.
**Notes**: Sei ipotesi del prompt falsificate, tabellate in §3bis del referto, che le argomenta tutte:
`DModel.instanceof` e' `Pointer<DModel>` e non `Pointer<DClass>`; `NodeProblem.nodeId` e' obbligatorio e
la violazione di modello non ha oggi superficie; JjEL non ha tri-stato e la navigazione su assente lancia;
`.forAll` riprodotto su JjEL diretto piu' un secondo difetto non iscritto, che rende `CLAUDE.md §12.6`
falsa. Sette domande aperte in §7, D1 e D3 bloccanti per la forma della Fase 2.
**Prompt document name**: 2026-09-08 16:30

## 2026-09-06 — fix(jjtl): accept newlines in helper bodies and before else
**Prompt**: un `helper` con il corpo su righe separate non parsa mai nell'app (Monaco e Validate:
"Expected expression" sulla `{`), nemmeno nelle forme documentate in SPEC §3.4 e §13.2. Decisione
di Alfonso: procedere col rischio minore. Fix stretto nel parser interno di espressioni, non il
cambio dei call site.
**Files touched**: `frontend/src/jjtl/parser/parser.ts` (+17: due `skipNewlines()` in `helper()`,
lookahead `isElseAfterNewlines()` in `ifThenElse()`), `frontend/src/jjtl/__tests__/helper-multiline.test.ts`
(nuovo, 9 test); poi `docs/discovery/discovery_2026-09-06_jjtl_helper_body_newlines.md`,
`docs/prompts/claude_2026-09-06_1500_prompt_jjtl_helper_body_newlines.md` e questa entry nel
commit docs.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `vitest run src/jjtl` 116 verdi / 0 falliti (era 107, +9), i 7 file
`window is not defined` pre-esistenti invariati. `tsc --noEmit` 14 errori, 0 sotto `src/jjtl/`
(baseline "scattered" di §17 su filesystem case-sensitive). `build` exit 0 col solo avviso di
chunk-size. Un `NEWLINE` non seguito da `else` termina ancora un `:=` (test dedicato).
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — solo parser JjTL.
**Smoke visivo**: non applicabile — da verificare a mano da Alfonso: incollare l'helper, la
sottolineatura sulla `{` sparisce, Validate 0 errori.
**Notes**: Root cause (report F1): l'app non passa mai il sorgente al parser (`JjtlEditor.tsx:57`,
`useJjtlParser.ts:61`), quindi la delega a JjEL non è mai esercitata dall'app, solo dai test.
Passare `source` ai call site è il fix di prospettiva ma cambia il parser di tutte le espressioni
`:=`/`where`/`let`: decisione aperta, discovery a due fasi (F5). Verificato sul clone cloud, file
portati sul Mac via bridge, commit dalla shell nativa.
**Prompt document name**: 2026-09-06 15:00

## 2026-09-06 — feat(jjtl): istanze sorgente contenute e creazione annidata nelle feature (Fase 2)
**Prompt**: GO Fase 2 con sette decisioni ratificate (D1..D7): feature risolta contro il metamodello e mai validata come classe, `forall` dentro il wrapper e a livello di regola con lookup della feature e fallback dichiarato, deref di `{__ref}` nel forall e su `parent`, enumerazione sempre di tutti gli oggetti del modello sorgente, write-back degli annidati come DObject contenuti, messaggi che non mentono, due limiti del parser. Deroga alla regola 19 dichiarata nel GO. HARD STOP dopo il commit 4 per la verifica visiva.
**Files touched**: `frontend/src/components/project/ProjectEditor.tsx` (commit 1 `f428e1470`, commit 4 `3d6b16e14`); `frontend/src/jjtl/parser/parser.ts` (`63131b0fb`); `frontend/src/jjtl/executor/executor.ts` (`cde18558b`); nuovi `frontend/src/jjtl/executor/__tests__/contained-sources.test.ts` (4 test), `frontend/src/jjtl/executor/__tests__/nested-creation-into-features.test.ts` (23 test), `frontend/src/jjtl/parser/__tests__/forall-and-value-mappings.test.ts` (11 test); `frontend/src/jjtl/SPEC.md`, `frontend/src/jjtl/CLAUDE.md`, `frontend/src/jjtl/AGENTS.md` (`454773e8b`). Questa entry a parte.
**Outcome**: ✅ completed
**Corregge**: 2026-09-06 14:40 (prompt di Fase 1, discovery)
**Causa**: —
**Regressions**: no — `npm run build` exit 0 col solo avviso di chunk-size a ogni commit; `npx tsc --noEmit` 33 su output completo, la baseline esatta di §17, misurata prima e dopo ogni commit (salita a 34 una volta, per un `result.stats` possibly undefined in un test nuovo, chiusa prima del commit); `vitest run src/jjtl` 141 verdi contro i 107 di partenza, con gli **stessi 7 file rossi in import** pre-esistenti, invariati.
**Out-of-scope changes**: yes — `frontend/src/jjtl/AGENTS.md`, rigenerato e incluso nello stesso commit come impone RC-7 e §17; non era nella lista del GO. Nient'altro fuori dalla lista dichiarata.
**Layer Impact Report**: not-required — nessun file di §3.1. `LValue.addObject` apre una TRANSACTION propria attorno a `DObject.new3` (verificato a `LModelElement.tsx:7336` prima di scrivere il diff, come chiedeva D5): la creazione degli annidati sta quindi FUORI dalla TRANSACTION di STEP 6, come `DVertex.new`. `LModelElement.tsx` e `useJjomSync.ts` letti e non toccati.
**Smoke visivo**: passato — verifica manuale di Alfonso su `ERDLanguage` a `localhost:3000`, ACK esplicito in chat sui quattro commit di codice. Automatico: banco delle mutazioni (P11) su 10 mutazioni, tutte rosse — 4 sul parser (skipNewlines nel forall, IDENTIFIER fra le chiavi, ramo delle coppie in coda, case IDENTIFIER in `literal()`) e 6 sull'executor (nome della feature in scrittura, deref di `{__ref}`, errore sul `-> Class` a livello di regola, lookup della feature, marcatore `__nested`, applicazione delle coppie).
**Notes**: Debito dichiarato: il commit 4 (write-back) **non ha test automatici** — ProjectEditor non ha banco, la copertura è la verifica manuale. Due todo da aprire fuori da questo giro: i 7 file `window is not defined` (fra cui `forall-mapping.test.ts`, quindi nove test `forall` non girano); e `.forAll(x: pred)` che non parsa mai sulla via dell'app. Entrambi in SPEC §12.2 e in `jjtl/CLAUDE.md`. Le due deroghe a D5/D7 sono iscritte in SPEC §9.2 come design.
**Prompt document name**: 2026-09-06 15:20

## 2026-09-06 — docs: discovery delle istanze sorgente contenute e della creazione annidata JjTL (Fase 1)
**Prompt**: Fase 1 read-only two-phase: confermare il percorso `ProjectEditor` → `executor.execute` e se `allSubObjects` sia la sorgente giusta (con `_containerId`/`parent`); tracciare come parsano ed eseguono `-> feature { … }`, `-> Class { … }` e `forall … -> Class { … }`, e come gli annidati diventino DObject; verificare i limiti del parser elencati. Referto obbligatorio, hard stop prima di qualunque codice.
**Files touched**: `docs/discovery/discovery_2026-09-06_jjtl_contained_sources_nested_creation.md` (nuovo, 452 righe). Nessun file di codice.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — nessun file di codice toccato, `frontend/src` pulito a fine giro (verificato con `git status --porcelain frontend/src`, vuoto, con controllo positivo sullo stesso comando senza pathspec). Nessun gate di build o suite eseguito: dichiarato nel referto §10.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1. `LModelElement.tsx` e `joiner/classes.ts` letti e non modificati, come impone il perimetro.
**Smoke visivo**: non applicabile — Fase 1 read-only. Al posto suo, quattro sonde fuori albero che ESEGUONO lexer/parser/executor (P11) e non ne leggono il sorgente; misure in referto §4.2, §6.3, §7.
**Notes**: Due findings cambiano la forma della Fase 2, entrambi nel referto: togliendo il warning su `columns` nessuna delle tre forme crea un Column, perche' gli annidati non entrano in `targetModel.instances` e STEP 6 li scarta (§6); e `forall a in ownedAttributes` itera involucri `{__ref}`, non oggetti, quindi i Column nascerebbero a null (§8 R2, fuori prompt). H4 falsificata (§7.1, §7.3). Confermato il NEWLINE prima di `->` nel forall: chiude F5 del referto 2026-09-04. Sei domande aperte in §9.
**Prompt document name**: 2026-09-06 14:40

## 2026-09-05 — feat(rail): la select «Palette» del Data Manager (R-SKIN slice C, chiude la Fase 2)
**Prompt**: GO emendato R-SKIN Fase 2, slice C: select «Palette» nel `DataManagerViewpointPanel` sotto «Form theme», stesso `writeViewpoint`, default `Slate`. Sonda end-to-end su B+C su tabella e drawer; negativo: un progetto senza `formPalette` identico a oggi. HARD STOP dopo il commit.
**Files touched**: `frontend/src/components/editors/viewpoint/properties/DataManagerViewpointPanel.tsx` — commit `8116e35da`. Sonda a parte: `probe_2026-09-05_rskin_sliceC_select.mts` (nuova).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `npm run typecheck` 33 su output completo (baseline esatta §17), `npm run build` exit 0 col solo avviso di chunk-size, vitest 1782/1782 su `components/editors`, `components/editor-v2`, `components/abstract`, `components/TreeViewSidebar`. `viewpointThemeHint.test.ts` verde: `ViewpointProperties.tsx` non e' stato toccato. Banco delle mutazioni (P11), due giri: la select che scrive sempre il nome (niente `undefined` su `Slate`) -> D1 rosso, e D2 resta verde, che e' la ragione per cui D1 esiste; la select spostata SOPRA «Form theme» -> A1 rosso.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1. `ensureDataManagerViewpoint` dentro `writeViewpoint` resta una chiamata NUDA (§3.3).
**Smoke visivo**: passato — sonda `probe_2026-09-05_rskin_sliceC_select.mts`, **15 PASS 0 FAIL**, il giro intero dalla porta dell'utente. A: la select c'e' SOTTO «Form theme» (ordine, non sola presenza), quattro opzioni in ordine di catalogo, legge `Slate` col singleton assente, e aprire il rail non materializza. B: scelta `Paper`, il singleton nasce `dataManager` + `isExclusiveView: true` col nome scritto nel campo. C: nel manager la tabella E il drawer portano i valori calibrati di Paper (Q2, misurata stavolta dal gesto e non da console). D: rimessa `Slate`, il campo torna ASSENTE e le due superfici tornano a `:root`.
**Notes**: Scostamento dichiarato dal controllo gemello: nessun sentinella `__inherit__`. `Slate` e' l'ASSENZA di palette — l'unico nome senza regole nel foglio — quindi sceglierlo scrive `undefined`, e la lista non porta due voci con un solo effetto visibile e due stati persistiti diversi. Fuori corsia, gia' registrato nella entry A+B: in dark il rail sinistro e l'outline restano chiari, ed e' il tema scuro dell'app, non la palette.
**Prompt document name**: 2026-09-04 23:30

## 2026-09-05 — feat(manager): le quattro palette della form del Data Manager (R-SKIN, slice A+B)
**Prompt**: GO emendato R-SKIN Fase 2. Slice A: registro chiuso `palettes.ts` (nomi, default `Slate`, guardia, `paletteAttr`) e campo `formPalette?` su `DViewElement` accanto a `formTheme`, nessuna migrazione. Slice B: i nove token in `styles/tokens/_form-palettes.scss`, DUE regole per palette (light e `:root[data-theme="dark"]`), `data-palette` su `.instance-manager`. Poi calibrazione a schermo all'HARD STOP, light e dark.
**Files touched**: slice A — `frontend/src/jjform/palettes.ts` (nuovo), `frontend/src/jjform/index.ts`, `frontend/src/jjform/__tests__/palettes.test.ts` (nuovo), `frontend/src/view/viewElement/view.tsx`, commit `08abf6355`. Slice B — `frontend/src/styles/tokens/_form-palettes.scss` (nuovo), `frontend/src/styles/tokens/index.scss`, `frontend/src/components/abstract/tabs/InstanceManagerTab.tsx`, commit `a8c8aae45`. Calibrazione di Paper — `_form-palettes.scss`, commit `f3459a29f`. Sonda a parte: `b30fbdf66`, riallineata alle attese calibrate nel commit docs di questo giro.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `npm run typecheck` 33 su output completo (baseline esatta §17), `npm run build` exit 0 col solo avviso di chunk-size, `vitest run src/jjform` 364/364 su 13 file. Nessun progetto senza `formPalette` cambia: `Slate` non ha regole, e' `:root` (blocchi A e D della sonda).
**Out-of-scope changes**: yes — due deroghe dichiarate, vedi Notes.
**Layer Impact Report**: not-required — nessun file di §3.1. `InstanceManagerTab.tsx` legge un campo in piu' da `idlookup`, nessuna scrittura.
**Smoke visivo**: passato — sonda `probe_2026-09-05_rskin_sliceB_palettes.mts`, **18 PASS 0 FAIL** dopo la calibrazione, piu' gli otto screenshot (quattro palette in light, quattro in dark). Q2 misurata dove serviva: `getComputedStyle` su una cella della TABELLA e su un controllo del DRAWER danno gli stessi valori per ogni palette, cioe' una scrittura copre due superfici. R2 esercitato: in dark le tre palette portano i valori scuri, non quelli chiari.
**Notes**: Deroga 1: il riesporto sta in `jjform/index.ts`, non in `joiner/index.ts` come diceva la slice A — `InstanceManagerTab` importa da `jjform`, a specchio di `formTheme`, e `joiner` resta intatto. Deroga 2: `--color-form-summary` scritto per tutte e tre le palette. Fuori corsia, da registrare: in dark il rail sinistro e l'outline restano chiari — e' lo stato del tema scuro dell'app, non della palette.
**Prompt document name**: 2026-09-04 23:30

## 2026-09-04 — fix(jjtl): accept newlines inside nested object creation
**Prompt**: la forma multiriga di object creation (`-> attr {` a capo `-> Class {`, quella
documentata in SPEC §3.3) produce `targetClass = attr` senza errori di parsing né di Validate;
gli oggetti annidati non vengono creati. Discovery sintetica obbligatoria, poi fix minimo in
`attributeMapping()` e `objectCreation()`, test di parsing, suite `jjtl` e build.
**Files touched**: `frontend/src/jjtl/parser/parser.ts` (+7, due `skipNewlines()`),
`frontend/src/jjtl/__tests__/nested-object-creation.test.ts` (nuovo, 5 test) in `1c567930d`;
`docs/discovery/discovery_2026-09-04_jjtl_nested_object_creation.md`,
`docs/prompts/claude_2026-09-04_1850_prompt_jjtl_nested_object_creation_newlines.md` e questa
entry nel commit docs successivo.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `vitest run src/jjtl` 107 verdi / 0 falliti (era 102 su HEAD, +5 nuovi); i
7 file `window is not defined` (monaco, `environment: 'node'`) sono pre-esistenti, riverificati su
un worktree pulito a HEAD. `tsc --noEmit` 14 errori, 0 sotto `src/jjtl/` (i 14 "scattered" della
baseline §17; i 19 di casing non compaiono su filesystem case-sensitive). `build` exit 0 col solo
avviso di chunk-size.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — solo parser JjTL.
**Smoke visivo**: non applicabile — da verificare a mano da Alfonso: SM2PN (docs), forma
multiriga, Validate + Execute, attesi 7 mapping, 0 warning nel Trace, archi presenti.
**Notes**: Root cause confermata (report F1, F2). `forAllMapping()` non ha il difetto, non
toccato (F5). Validate è solo `parse()`: il controllo delle classi target vive in
`executor.validateTargetClasses` come warning a runtime, todo fuori scope (F3). Il ramo
"nested mapping body" non corrisponde a nessuna sintassi in SPEC né nei test; lasciato, da
decidere in chat (F4). Deroga a §6 del prompt ("un solo commit"): `CLAUDE.md` §6.4 vieta docs e
codice nello stesso commit, quindi due commit.
**Prompt document name**: 2026-09-04 18:50

## 2026-09-05 — docs: discovery delle skin della form del Data Manager (R-SKIN, Fase 1)
**Prompt**: Fase 1 read-only di R-SKIN: falsificare H1..H6 (colori diretti nella form, censimento dei token, `--color-form-*` in entrambi i file colori, dove vive la regola `[data-skin]`, il pattern di `formTheme` per `formSkin`, la tabella dentro o fuori la skin), referto con `file:riga` e tabella token × skin, hard stop prima di qualunque codice.
**Files touched**: `docs/discovery/discovery_2026-09-04_form_skins.md` (nuovo, 529 righe) — commit `715054349`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — nessun file di codice toccato, `frontend/src` pulito a fine giro. Nessun comando di build o test eseguito, dichiarato nel referto §15.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1 implicato; `VersionFixer.tsx` non letto e non necessario (`formSkin?` additivo come `formTheme`).
**Smoke visivo**: non applicabile — nessun pixel cambia.
**Notes**: **H6 falsificata**, ed e' il finding: `instanceManagerTab.scss` legge `--color-form-*` su **143 righe**, quindi una skin agganciata a `.ir-form` cambierebbe il drawer e non la tabella sopra di esso. `.instance-manager` e' antenato di `.ir-form`: un attributo, entrambi. Secondo finding: la parola «skin» e' gia' presa (`LegacySkin`, `LEGACY_SKIN_PRESET`, `ir-form--plain` sulla stessa radice). Sei domande, due chiuse in discovery.
**Prompt document name**: 2026-09-04 23:02

## 2026-09-05 — feat(ir): la view di classe svuotata si pota (R-DMV slice F, chiude la Fase 2)
**Prompt**: GO emendato R-DMV Fase 2, slice F: `pruneForm` esteso a `order`/`labels`/`hidden` (non `basic`), potatore separato per `table` sull'ir, e la view del singleton svuotata (ne' `form` ne' `table`) che si rimuove facendo sparire la classe dall'albero. Test su `pruneForm` e sul potatore.
**Files touched**: `frontend/src/components/editor-v2/viewpoint/authoring/FormAuthoringBody.tsx`, `.../ir/irPrune.ts` (nuovo), `.../ir/__tests__/irPrune.test.ts` (nuovo), `frontend/src/components/editors/viewpoint/properties/DataManagerViewpointPanel.tsx` — commit `317ec973b`. Sonda a parte: `acd5c72d6`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `tsc` 33 su output completo (baseline esatta), `build` exit 0 col solo avviso di chunk-size, vitest **3293/3293** sull'intera suite (0 test rossi; restano i 9 file che muoiono all'import di monaco in `environment: node`, pre-esistenti). Banco delle mutazioni (P11), tre giri: `pruneForm` che non pota `order`/`hidden` -> 2 rossi; `pruneForm` che pota anche `basic` -> 1 rosso; `isPrunableClassView` che ignora lo `shape` -> 1 rosso.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1. `DeleteElementAction` e `SetRootFieldAction` sono chiamate NUDE, nessun creator annidato (§3.3).
**Smoke visivo**: passato — sonda `probe_2026-09-05_rdmv_sliceF_prune.mts`, 7 PASS 0 FAIL, confronto dentro il giro (stesso progetto, stessa classe): scritto -> la view c'e' e la classe compare; tolto -> la view sparisce da `idlookup`, la classe esce dall'albero e torna lo stato vuoto, il VIEWPOINT resta; riscritto -> la view rinasce UNA sola.
**Notes**: Due misure che il referto non aveva. `lView.delete()` su una view del singleton e' un **no-op silenzioso** (logga «unexpected pointedBy case ending with an object» da `get__jjdependencies`: `subViews` e' un Dictionary): si usa `DeleteElementAction`. E `DeleteElementAction` lascia l'id in `state.viewelements`, che alla RIscrittura lo duplicava — due righe per una classe. Il `-=` sul root chiude il giro. Dettaglio nel commento di `writeForm`.
**Prompt document name**: 2026-09-04 15:59

## 2026-09-04 — feat(sidebar): la sezione «Data Manager», sempre presente (R-DMV slice E)
**Prompt**: GO emendato R-DMV Fase 2, slice E: sezione «Data Manager» sempre presente in `TreeViewContent.tsx` con lo stato vuoto ratificato, classi personalizzate con le feature toccate e l'override accanto, «columns» quando fissato, esclusione da `syntaxVps`/`validationVps`/`otherVps`, la voce che seleziona il singleton o il suo stub (Q4/Q6), materializzazione al primo write dal pannello. Un test di sorgente sul modello dei `instanceManager10*`.
**Files touched**: `frontend/src/components/TreeViewSidebar/TreeViewContent.tsx`, `.../TreeViewSidebar/tree-view-sidebar.scss`, `.../TreeViewSidebar/__tests__/dataManagerSection.test.ts` (nuovo), `frontend/src/components/editors/Info.tsx`, `.../editors/viewpoint/properties/DataManagerViewpointPanel.tsx` — commit `5ae652227`. Sonda a parte: `d0546abcb`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `tsc` 33 su output completo (baseline esatta), `build` exit 0 col solo avviso di chunk-size, vitest 1811/1811 su `src/components` (17 nuovi). Banco delle mutazioni (P11): spostata la guardia del singleton DOPO i tre rami del partizionamento, 2 test su 17 rossi; ripristinata.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1.
**Smoke visivo**: passato — sonda `probe_2026-09-04_rdmv_sliceE_sidebar.mts`, 17 PASS 0 FAIL, che chiude anche la verifica della slice D dalla porta dell'utente (RC-8). A: singleton assente, la sezione c'e' con lo stato vuoto. B: la voce apre il pannello sullo STUB e NON materializza. C: la prima scrittura crea i due gradini insieme, `dataManager` + `isExclusiveView: true`. D: l'albero elenca `Sensor > note = Code`, il singleton non e' fra i viewpoint e il contatore resta 1.
**Notes**: `SectionNode` prende due prop opzionali (`onLabelClick`, `labelTitle`) usate dalla sola sezione Data Manager: le altre stanno per un insieme e non hanno niente da selezionare. Lo stub e' letto in `Info.tsx` dal pointer GREZZO (`viewId`) e non dal proxy: `LViewElement.fromPointer` di un id inesistente rende un proxy senza `__raw`, che non distingue «niente selezionato» da «selezionato ma non ancora nato».
**Prompt document name**: 2026-09-04 15:59

## 2026-09-04 — feat(rail): DataManagerViewpointPanel, il rail del singleton (R-DMV slice D)
**Prompt**: GO emendato R-DMV Fase 2, slice D: pannello nuovo per il singleton (nome, Form theme senza hint, selettore di metaclasse, tabella feature -> widget su `rowsForMetaclass` + `offeredOverrides`, materializzazione alla prima scrittura), `Info.tsx` che dispaccia su `isDataManagerViewpoint`. Niente segmented Type, niente `theme`/`labelPlacement` per view (Q5). HARD STOP dopo il commit.
**Files touched**: `frontend/src/components/editors/viewpoint/properties/DataManagerViewpointPanel.tsx` (nuovo), `.../properties/DataManagerViewpointPanel.scss` (nuovo), `frontend/src/components/editors/Info.tsx` — commit `367a23c45`. Sonda a parte: `316675476`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `tsc` 33 su output completo (baseline esatta), `build` exit 0 col solo avviso di chunk-size, vitest 1749/1749 su `components/editors`, `components/editor-v2`, `components/abstract`. `viewpointThemeHint.test.ts` verde: `ViewpointProperties.tsx` non e' stato toccato, ed e' la ragione per cui il pannello e' un componente separato.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1. `ensureDataManagerViewpoint` e `DViewElement.new2` sono due chiamate NUDE, nessuna TRANSACTION esterna (§3.3).
**Smoke visivo**: passato — sonda end-to-end `probe_2026-09-04_rdmv_sliceD_rail_panel.mts`, 19 PASS 0 FAIL, piu' lo screenshot del rail. A: il singleton rende il pannello nuovo, il segmented Type e l'hint NON ci sono (positivo di controllo su un viewpoint ordinario, dove il segmented c'e'). B: la prima scrittura crea la view di classe che prima non c'era, e il reset RIMUOVE la chiave `form`. C: il picker mostra esattamente `[Abstract syntax, Ordinary syntax, Data manager]`, il megamodello e la dashboard non lo nominano, ciascuno con il proprio positivo.
**Notes**: **Scostamento da R-DMV-3, dichiarato**: la view di classe porta uno `shape: {form:'rect'}` minimo. Misurato: un ir `vertex` senza `shape` fa lanciare `compileView` (`irCompile.ts:305`), `getIRIndex` scarta la view con `[ir] compile failed` e l'indice torna `null`. Il primo gradino della materializzazione resta non esercitato: la porta d'ingresso e' la voce di sidebar della slice E, e senza di essa il pannello si raggiunge solo con il singleton gia' creato.
**Prompt document name**: 2026-09-04 15:59

## 2026-09-04 — fix(tests): le due asserzioni sul mount di IRForm allineate a host="manager"
**Prompt**: commit a parte, dichiarato fuori dalla corsia R-DMV: allineare `instanceManagerOutline.test.ts:155` e `instanceManager10c.test.ts:541` al mount che il sorgente porta da `40142a4f3` (R-VP slice 1, commit 2), cioe' `<IRForm objectId={formSubjectId ?? subjectId} host="manager" />`.
**Files touched**: `frontend/src/components/abstract/tabs/__tests__/instanceManagerOutline.test.ts`, `frontend/src/components/abstract/tabs/__tests__/instanceManager10c.test.ts` — commit `8f8bd41d8`.
**Outcome**: ✅ completed
**Corregge**: 2026-09-03 23:20
**Causa**: (c)
**Regressions**: no — vitest 84/84 sui due file. Nessun sorgente applicativo toccato: la stringa attesa e' stata allineata al codice, non il contrario.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — due file di test.
**Smoke visivo**: non applicabile — nessun pixel cambia.
**Notes**: I due rossi erano in albero da `40142a4f3`, che aggiunse `host="manager"` ai due mount del drawer e non aggiorno' le asserzioni di sorgente che li citano verbatim; la sua entry dichiarava gia' `Out-of-scope changes: yes`. Trovati dalla suite intera girata nella slice C di R-DMV e riportati nell'hard stop prima di essere sanati, non dopo.
**Prompt document name**: 2026-09-04 15:59

## 2026-09-04 — feat(manager): la tabella e il drawer leggono dal singleton (R-DMV slice C)
**Prompt**: GO emendato R-DMV Fase 2, slice C: `ensureDataManagerViewpoint` / `findDataManagerViewpoint` con id fisso `Pointer_ViewPointDataManager` (Q3), e i tre punti di lettura portati sul singleton — la tabella (`InstanceManagerTab`), la view del drawer e il rung del tema della form (`IRForm`, host `manager`). HARD STOP prima della slice D.
**Files touched**: `frontend/src/view/viewPoint/viewpoint.ts`, `frontend/src/joiner/index.ts`, `frontend/src/components/abstract/tabs/InstanceManagerTab.tsx`, `frontend/src/components/editor-v2/viewpoint/ir/IRForm.tsx` — commit `3b349b03d`. Sonda a parte: `6fc43ed43`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `tsc` 33 su output completo (baseline esatta), `build` exit 0 col solo avviso di chunk-size. Suite intera: 3253/3255, 2 rossi PRE-ESISTENTI e non causati qui (`instanceManagerOutline.test.ts:155`, `instanceManager10c.test.ts:541` asseriscono un mount di `IRForm` senza `host="manager"`, che il sorgente porta da `40142a4f3`; verificato con `git show HEAD:` e diff vuoto su quella riga), piu' 9 file che falliscono all'import di monaco in `environment: node`.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1. `newVP` apre la propria TRANSACTION e non e' avvolta (§3.3).
**Smoke visivo**: passato — sonda end-to-end `probe_2026-09-04_rdmv_sliceC_singleton_read.mts` sul dev server, 10 PASS 0 FAIL, piu' la verifica di Alfonso. A: singleton assente, colonne `[tint, threshold, tags]`, nessun avviso, e aprire il manager NON lo crea (R-DMV-6). B: `table.columns` nel viewpoint ATTIVO, tabella invariata. C: la stessa chiave nel SINGLETON, `[tags, threshold, tint]` e nessuna colonna persa.
**Notes**: B rosso prima / C verde e' cio' che rende la misura una misura: da solo, B non distinguerebbe «legge dal singleton» da «non legge piu' niente». Primo giro C1 rosso per la FIXTURE: `DViewElement.new2` prende il PADRE, e una stringa fa cadere il fallback su `Pointer_ViewPointDefault` in silenzio — lo stato che non si e' formato letto come comportamento (CLAUDE.md §5). Documentato nella sonda.
**Prompt document name**: 2026-09-04 15:59

## 2026-09-04 — feat(ir): viewpoint esplicito e opzionale su computeIRSignature e getIRIndex (R-DMV slice B)
**Prompt**: GO emendato R-DMV Fase 2, slice B: parametro `viewpointId` opzionale su `computeIRSignature` e `getIRIndex` (default l'attivo, i 19+16 chiamanti invariati), propagato nei tre punti di `useIRFormView`; test della cache per la domanda Q3 (id fisso, due progetti in sequenza).
**Files touched**: `frontend/src/components/editor-v2/viewpoint/ir/irResolveCore.ts`, `.../ir/useIRFormView.ts`, `.../ir/__tests__/irIndexViewpoint.test.ts` (nuovo) — commit `a30217722`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `tsc` 33 su output completo (baseline esatta), `build` exit 0 col solo avviso di chunk-size, vitest 552/552 su tutta la cartella `viewpoint/ir/` (23 file, 6 nuovi). Banco delle mutazioni (P11), due giri: `getIRIndex` che ignora `viewpointId` -> 3 rossi su 6; `computeIRSignature` che lo ignora -> 4 rossi su 6.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1.
**Smoke visivo**: non applicabile — nessun chiamante cambia comportamento: il default del parametro e' il viewpoint attivo, canvas / manager / drawer identici. La verifica end-to-end arriva con la slice C, che e' il primo passaggio di un viewpoint diverso.
**Notes**: Q3 misurata e non dedotta: `indexCache` e' chiavata sulla sola signature, che porta un `refToken` per ogni oggetto ir (WeakMap sull'identita'), quindi due progetti in sequenza con lo stesso `Pointer_ViewPointDataManager` danno due chiavi diverse. Asserito anche che indicizzare il singleton non sfratta l'indice dell'attivo (R7 del referto).
**Prompt document name**: 2026-09-04 15:59

## 2026-09-04 — feat(viewpoint): il tipo dataManager e la sua esclusione dalle liste (R-DMV slice A)
**Prompt**: GO emendato R-DMV Fase 2, slice A: valore nuovo `'dataManager'` di `ViewpointType`, predicato unico, e i quattro filtri (picker della Toolbar, MegamodelView, Dashboard, dashboard di progetto). L'esclusione arriva prima della cosa da escludere: non esiste mai una finestra in cui il singleton compare dove non deve.
**Files touched**: `frontend/src/view/viewPoint/viewpoint.ts`, `frontend/src/joiner/index.ts`, `frontend/src/components/editor-v2/Toolbar.tsx`, `frontend/src/components/megamodel/MegamodelView.tsx`, `frontend/src/pages/components/Dashboard.tsx`, `frontend/src/components/project/ProjectEditor.tsx` — commit `15c289f37`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `tsc` 33 su output completo (baseline esatta), `build` exit 0 col solo avviso di chunk-size, `dataManagerPicker.test.ts` 39/39 (il test asserisce sul sorgente di `Toolbar.tsx`, incluso `'}, [modelId]);'`: le deps non cambiano). Nessun `switch` esaustivo su `ViewpointType` in albero, verificato con grep sui 4 consumatori.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1.
**Smoke visivo**: non applicabile in questa slice — nulla crea ancora il singleton, quindi nessuna lista puo' cambiare contenuto. Verificato invece nella slice C, blocco A: il singleton non esiste e la tabella e' identica.
**Notes**: **Deroga regola 19** (6 file, RC-11). Due nomi e un oggetto: `viewpointType` dice COSA e si legge da un `DViewElement`, `DATA_MANAGER_VIEWPOINT_ID` dice QUALE e si legge dove viaggia solo un id (`MegamodelView` prende `{id, name}`). Il singleton NON entra in `Defaults.viewpoints`: quella lista e' cio' che lo store semina all'avvio, e R-DMV-6 lo vuole nato alla prima scrittura. Nessun test: `viewpoint.ts` tira monaco via `joiner` e non si importa in `environment: node`, misurato con una sonda.
**Prompt document name**: 2026-09-04 15:59

## 2026-09-04 — refactor(ir): ManagerSpec diventa TableSpec, prima che un progetto la scriva (R-DMV-3)
**Prompt**: GO emendato R-DMV Fase 2, slice 0 (ex slice G, promossa in testa): rinomino puro della chiave dell'ir e dei suoi identificatori, da sola nel commit. `manager?: ManagerSpec` -> `table?: TableSpec` sui due node ir, `managerViews.ts` -> `tableViews.ts`, `resolveManagerSpec` -> `resolveTableSpec`, `ManagerViewResolution` -> `TableViewResolution`, test rinominato, warn `[manager]` -> `[table]`.
**Files touched**: `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts`, `.../ir/managerViews.ts` -> `.../ir/tableViews.ts` (rinominato), `.../ir/__tests__/managerViews.test.ts` -> `.../ir/__tests__/tableViews.test.ts` (rinominato), `frontend/src/components/abstract/tabs/instanceTable.ts`, `.../tabs/__tests__/instanceTable.test.ts`, `.../tabs/InstanceManagerTab.tsx` — commit `b7f069389`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `tsc` 33 su output completo (baseline esatta), `build` exit 0 col solo avviso di chunk-size, vitest 55/55 sui due file di test (`tableViews` 10, `instanceTable` 45). Banco delle mutazioni (P11): rimesso `(ir as NodeViewIR).manager` al posto di `.table` in `tableViews.ts`, 9 test su 10 rossi; ripristinato.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1; nessun campo persistito cambia di forma perche' nessun progetto porta ancora la chiave (R-B9, referto §9 con positivo di controllo).
**Smoke visivo**: non applicabile — rinomino puro, nessun pixel cambia (dichiarato dal GO).
**Notes**: **Deroga regola 19** (6 file, RC-11): i sei enumerati dalla risposta Q1 del GO. `hosts.manager` / `FormHostOverride` non toccati (R-DMV-7). `managerResolution` resta il nome della variabile locale (regola 2). Grep finale su `frontend/src` = 0; su `docs/discovery/harness` restano 2 righe di prosa nella sonda **non tracciata** `probe_2026-09-03_rvp_slice1_manager_columns.mts`, WIP di un'altra corsia, non toccata (RC-13).
**Prompt document name**: 2026-09-04 15:59

## 2026-09-04 — docs: discovery del Data Manager Viewpoint singleton (R-DMV, Fase 1)
**Prompt**: Fase 1 read-only di R-DMV: falsificare H1..H6 (dove marcare il singleton, il picker come porta, l'indice del manager, il rail, i punti di esclusione, `pruneForm`), referto con `file:riga` e citazioni verbatim, proposta di affettatura della Fase 2, hard stop prima di qualunque codice.
**Files touched**: `docs/discovery/discovery_2026-09-04_data_manager_viewpoint.md` (nuovo, 807 righe) — commit `65b8fb6b8`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — nessun file di codice toccato, Fase 1 read-only. Nessun comando di build o test eseguito, dichiarato nel referto §15.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1 letto in scrittura; `VersionFixer.tsx` letto in sola lettura per la domanda 6 (risposta: nessuna migrazione).
**Smoke visivo**: non applicabile — nessun pixel cambia.
**Notes**: Falsificate H4 (il segmented «Type» del rail declassa il singleton; `FormAuthoringBody` vuole un `draft` e un `target` che nel rail non esistono) e H5 nei numeri (duplicazione e cancellazione hanno due punti ciascuna, non uno). Finding portante §2.3: `isExclusiveView` false renderebbe le view del singleton DECORATIVE su ogni canvas classico (`selectors.ts:552-559`). R-B9 verificata con positivo di controllo: la chiave `manager` si puo' ancora rinominare in `table`.
**Prompt document name**: 2026-09-04 15:45

## 2026-09-04 — refactor(rail): via la scheda Form, il Data Manager e' l'unico host (R-VP-14)
**Prompt**: rimozione integrale della scheda Form del rail (Properties | Form, 2026-08-26): il pannello di destra torna al solo rendering classico (`Info`). Nessuna modifica a `IRForm`, `formHosts.ts`, alla prop `host` ne' al Data Manager (R-VP-14). Corsia veloce RC-3, due file, nessuna critical zone.
**Files touched**: `frontend/src/components/editors/PropertiesWithTreeView.tsx`, `frontend/src/components/editors/properties-with-tree-view.scss` — commit `c582c2bbb`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `tsc` 33 su output completo (baseline esatta, 0 nei due file), `build` exit 0, warning solo le deprecazioni Sass pre-esistenti (`@import`, `darken()`, global builtin) e l'avviso di chunk-size; zero righe `error`. vitest non eseguito: nessun test cita `inspectorTab` o `inspector-tabs`.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1.
**Smoke visivo**: passato — quattro controlli: oggetto M1 selezionato → nessuna barra di tab, Properties classico come prima del 2026-08-26; DClass selezionato → identico a oggi; sezione NODE in Advanced ancora presente; Data Manager, drawer invariato.
**Notes**: Verifica preventiva §2 sul working tree: `import IRForm` :6, `formSubjectId` :544 (solo il mount :1110), `formSubjectIsObject` :547-550 (barra e mount), `inspectorTab` :551 con l'effetto :554-556, barra :1084-1107, ternario :1109-1115, guardia :1120 — nessun altro consumatore. Via anche il commento :536-539, solo sulla scheda; `selectedElementId` resta (:556, :557, :816). SCSS :2497-2537 intero, `grep inspector-tabs` → 0. Senza la guardia NODE torna sugli oggetti, voluto.
**Prompt document name**: 2026-09-04 15:09

## 2026-09-04 — feat(form): order, labels, hidden e hosts.manager su FormSpec (R-VP slice 1, commit 2)
**Prompt**: GO emendato R-VP slice 1 Fase 2, commit 2: tre chiavi additive su `FormSpec` (`order`, `labels`, `hidden`), override per host `hosts.manager` (`FormHostOverride`), `resolveFormSpec` pura in `formHosts.ts`, prop `host` su `IRForm` dichiarata dai tre mount, `hidden` nello stesso `continue` di `features: 'hidden'`, `order` su `visible` prima di `buildFormSections`.
**Files touched**: `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts`, `.../ir/formHosts.ts` (nuovo), `.../ir/__tests__/formHosts.test.ts` (nuovo), `.../ir/IRForm.tsx`, `.../ir/IRFormField.tsx`, `.../ir/useFormWidgets.ts`, `.../ir/__tests__/useFormWidgets.test.ts`, `.../ir/__tests__/irValidate.test.ts`, `frontend/src/components/abstract/tabs/InstanceManagerTab.tsx`, `frontend/src/components/editors/PropertiesWithTreeView.tsx` — commit `40142a4f3`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `tsc` 33 su output completo (baseline esatta, 0 nei dieci file), `build` exit 0 col solo avviso di chunk-size (Node 23), vitest 95/95 sui quattro file di test (10 nuovi `formHosts`, 4 nuovi `useFormWidgets`, 2 nuovi `irValidate`).
**Out-of-scope changes**: yes
**Layer Impact Report**: not-required — nessun file di §3.1.
**Smoke visivo**: passato — `localhost:3000`, `Form 1b fixture`, `Running : State`, hard refresh dopo il commit. Drawer del manager (Advanced): `Time-out (s)`, `kind`, `name`, `isHistory`, `On entry`, `depth`; `tags` assente. Rail (scheda Form, Advanced): `timeout` con label normale, `kind`, `On entry`, `tags` presente. Pannello Properties classico invariato. Tabella invariata (R-VP-9).
**Notes**: **Deroga regola 19** (10 file, RC-11). **Scope oltre il GO, dichiarato**: `IRFormField.tsx:455` è l'unico punto che stampa la label (`field.name`), una riga (`field.label ?? field.name`) con `label?` opzionale sul descrittore, valorizzato solo se l'autore lo dichiara. Il rail passa `host="rail"` esplicito. `widgets: { kind: 'text' }` nell'override resta select: `kind` è enum e `overrideIsCompatible` lo rifiuta, ladder pre-esistente. Dettaglio: addendum §9 del referto.
**Prompt document name**: 2026-09-03 23:20

## 2026-09-03 — feat(manager): ManagerSpec.columns sulla view di classe (R-VP slice 1, commit 1)
**Prompt**: GO emendato R-VP slice 1 Fase 2, commit 1: `ManagerSpec { columns? }` su `VertexViewIR`, `orderColumns` pura in `instanceTable.ts`, lettura di `manager` dall'indice per la sola view senza predicato (R-VP-11), warn una volta per classe. Niente `sort` (R-VP-10), niente `irCompile`/`CompiledView`.
**Files touched**: `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts`, `frontend/src/components/editor-v2/viewpoint/ir/irResolveCore.ts` (solo `export` di `pinAccepts` e `compareCandidates`), `frontend/src/components/editor-v2/viewpoint/ir/managerViews.ts` (nuovo), `frontend/src/components/editor-v2/viewpoint/ir/__tests__/managerViews.test.ts` (nuovo), `frontend/src/components/abstract/tabs/instanceTable.ts`, `frontend/src/components/abstract/tabs/__tests__/instanceTable.test.ts`, `frontend/src/components/abstract/tabs/InstanceManagerTab.tsx` — commit `85db1612c`. Docs a parte: `b28c370de` (ratifiche R-VP, memo, referto, GO).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `tsc` 33 su output completo (baseline esatta), `build` exit 0 col solo avviso di chunk-size (Node 23), vitest 55/55 sui due file di test (10 nuovi in `managerViews`, 7 nuovi in `instanceTable`).
**Out-of-scope changes**: yes
**Layer Impact Report**: not-required — nessun file di §3.1; zero import di `useJjomSync`/`portDistribution` nel manager (referto §6).
**Smoke visivo**: passato — su `localhost:3000`, progetto `Form 1b fixture`, metaclasse `State`: senza `manager` tabella identica; `manager` su una view con `predicate` → un solo warn `[manager]` e colonne invariate; tolto il predicato e `columns: ['tags','timeout','kind']` → NAME, TAGS, TIMEOUT, KIND, poi le altre nell'ordine di prima, tutte visibili, «1 column hidden» invariato.
**Notes**: **Deroga regola 19** (7 file, RC-11): `irResolveCore.ts` entra solo per due `export`. **Deviazione dal GO, dichiarata**: `manager?` anche su `GraphVertexViewIR` (stesso bucket `byMetaclass`, `irResolveCore.ts:210`); `EdgeViewIR` fuori. Build con Node 18 fallita per `crypto.hash`: (g), sparita con Node 23. Commit dalla shell nativa del Mac, lock residui rimossi a mano da Alfonso. Dettaglio nell'addendum §8 del referto `discovery_2026-09-03_rvp_slice1_manager_section.md`.
**Prompt document name**: 2026-09-03 23:20

## 2026-09-03 — docs: discovery on AI surfaces, providers and system prompts
**Prompt**: inventario read-only delle superfici AI (Jjodie, trasformazioni, documentazione, altro), del pannello Providers e dei system prompt, per la sezione «AI in Jjodel» dei docs.
**Files touched**: `docs/discovery/discovery_2026-09-03_ai_surfaces_inventory.md` (nuovo), `docs/claude-code-log.md`
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — nessun file di codice letto in scrittura, Fase 1 read-only.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1.
**Smoke visivo**: non applicabile — deroga P8 dichiarata nel prompt, nessun pixel cambia.
**Notes**: `frontend/src/ai/` non esiste (client: `services/AIProviderService.ts`, registro `types/jodie.ts`): regola 15 dichiarata, non applicata come stop perche' trovare quei path era l'oggetto della discovery. Il blocco di entry del prompt e' in italiano e privo di sei campi di §21.2: scritto nel formato canonico. Findings nel referto, §2-§6.
**Prompt document name**: 2026-09-03 22:20

## 2026-09-03 — docs(log): §6.1 chiusura batch 2026-09-02 (BOOT1, VIEW1, VER2, SAVE2, DOC2)
**Prompt**: §6.1 di chiusura del batch del 2 settembre a repo fermo: spostare verbatim le otto
entry dalle cinque inbox al log attivo, cancellare le inbox, committare il checkpoint del 3/9 e
questo prompt, accertare (non chiudere) lo stato di EGO1 in indice. Nessun file applicativo.
**Files touched**: `docs/claude-code-log.md` + `docs/log-inbox/` cinque file rimossi
(`c1118d86c`), `docs/sessioni/sessione_2026-09-03_ricostruzione.md` +
`docs/prompts/claude_2026-09-03_1143_chiusura_61_inbox_e_checkpoint.md` (`d9e2480cb`).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: (a)
**Regressions**: no — nessun file di codice toccato. `check:docs` 3/3 con le stesse 2 warning
pre-esistenti (i due `Corregge: 2026-09-01 23:20` di SAVE1-bis e DIRTY1) prima e dopo ogni
commit; nessuna warning nuova dalle otto entry spostate.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — solo documentazione.
**Smoke visivo**: non applicabile — nessun pixel cambia.
**Notes**: Due premesse del prompt smentite dalla misura, entrambe innocue. (1) Il log attivo
teneva 10 entry, non 9: attivo 10 -> 18 con le otto, non 17; rotazione comunque saltata
(soglia 40). (2) **EGO1: l'indice e' vuoto** — `git diff --cached` a zero al gate, nessun
revert staged da accertare; l'hard stop del punto 4 non ha oggetto. Entry spostate verbatim,
nessun emendamento; nessun file di appoggio, nessuna copia del log (RC-13-bis).
**Prompt document name**: 2026-09-03 11:43

## 2026-09-02 — fix(topbar): l'ultimo salvataggio si legge da ogni tab (DOC2)
**Prompt**: DOC2 punto 4 — l'indicatore di SAVE2 sta nella tab sbagliata: l'autosave lo innesca il canvas, ma lo stato si legge solo dal Data Manager.
**Files touched**: `frontend/src/components/topbar/LastSavedIndicator.tsx` (nuovo), `frontend/src/common/libraries/lastSaved.ts`, `frontend/src/common/libraries/__tests__/lastSaved.test.ts`, `frontend/src/components/abstract/tabs/InstanceManagerTab.tsx`, `frontend/src/components/abstract/tabs/instanceManagerTab.scss`, `frontend/src/pages/components/Navbar.tsx`, `frontend/src/pages/components/navbar.scss` — commit `defb3a112`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: (a)
**Regressions**: no — `tsc` 33 su output completo (baseline esatta, 0 nei sette file), `build` exit 0 col solo avviso di chunk-size, `vitest` 3216 verdi / 0 falliti (era 3207; i 9 file `window is not defined` sono pre-esistenti, riverificati su HEAD).
**Out-of-scope changes**: yes
**Layer Impact Report**: not-required — nessun file di §3.1, nessuna scrittura D-layer: si consuma un CustomEvent gia' emesso.
**Smoke visivo**: passato — sonda `_tmp_doc2_smoke.ts` sull'app vera, 15 PASS / 0 FAIL, `pageerror` 0. Trascinamento reale su v2-flow -> autosave alla quiete -> «Saved just now» in topbar; Data Manager a zero occorrenze; sporco «Unsaved, last saved just now».
**Notes**: Spostato, non duplicato: una resa sola. `formatLastSavedLabel`/`subscribeLastSaved` escono da `lastSaved.ts` perche' i test li ESEGUANO — le asserzioni sul sorgente di SAVE2 erano verdi con l'indicatore nella tab sbagliata (P11). 3 mutazioni, 2 rossi ciascuna. **Deroga regola 19** (7 file, RC-11) e ai test di SAVE2, che il punto 4 rende falsi. Topbar 50px, non 60 come dice il prompt (`_layout.scss:17`, `b4cba749e`).
**Prompt document name**: 2026-09-02 (in chat)

## 2026-09-02 — docs: P11 e il censimento dei numeri normativi stantii (DOC2)
**Prompt**: DOC2 punti 2 e 3 — normare la sonda che non esegue il soggetto, e censire i numeri normativi rimasti indietro.
**Files touched**: `docs/PROTOCOL.md`, `docs/discovery/discovery_2026-09-02_doc2_numeri_stantii.md` (nuovo) — commit `29322514d`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — solo documenti; `check:docs` 3/3 con 2 warning before e after, `check:agents` PASS, `AGENTS.md` non si e' mosso.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: P11 in coda e non dentro P7/P8: i prompt citano le clausole per numero e inserirla in mezzo rinumererebbe le citazioni. Fuori dal blocco di P9 verificato byte a byte; `P1..P10` in testa diventa `P1..P11`. Censimento: 3 voci stantie su 8 verificate — il `1000ms` ricopiato in `projects.ts:105`, il totale `vitest` 3147 dei prompt (reale 3207), il range `P1..P9` di `CLAUDE.md`. Nessuna corretta: e' una lista.
**Prompt document name**: 2026-09-02 (in chat)

## 2026-09-02 — docs(editor-v2): il docstring dell'autosave punta alla costante (DOC2)
**Prompt**: DOC2 punto 1 — il blocco ratificato di `useLayoutAutosave.ts` dice ancora «fires 1000ms after the gesture» dopo SAVE2.
**Files touched**: `frontend/src/components/editor-v2/hooks/useLayoutAutosave.ts` — commit `1a4502151`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — il diff e' un solo blocco di commento; `tsc` 33 su output completo, 0 nel file toccato.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — commento, nessun codice eseguibile.
**Smoke visivo**: non applicabile
**Notes**: Il ragionamento sulla silenziosita' non e' riscritto: vale a fortiori a 15 s, che e' piu' lontano di 1000 ms dalla finestra di coalescing. Il numero non e' duplicato — il blocco cita `AUTOSAVE_DEBOUNCE_MS`/`AUTOSAVE_MAX_WAIT_MS`, che vivono in `useLayoutAutosave.ts` stesso (:71, :84) e **non** in `layoutAutosaveScheduler.ts` come diceva il prompt. `CLAUDE.md` non toccato: nessun hard stop.
**Prompt document name**: 2026-09-02 (in chat)

## 2026-09-02 — feat(editor-v2): l'ultimo salvataggio in testata al Data Manager (SAVE2)
**Prompt**: diradare l'autosave del layout, togliergli la notifica, e mostrare da qualche parte quando il progetto e' stato salvato l'ultima volta.
**Files touched**: frontend/src/components/abstract/tabs/InstanceManagerTab.tsx, frontend/src/components/abstract/tabs/instanceManagerTab.scss, frontend/src/common/libraries/__tests__/lastSaved.test.ts (nuovo)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: produced
**Smoke visivo**: passato (sonda `_tmp_save2_smoke.ts`, 12 PASS/0 FAIL: «Saved just now» in testata, «Unsaved, last saved just now» col progetto sporco; slate 11px, nessuno sfondo; pageerror 0)
**Notes**: `lastModified` non torna in Redux dopo un save (la sola `SetFieldAction` sta in `Offline.getAll`), e rimettercelo sarebbe un passo di undo per autosave: il timestamp vive in `common/libraries/lastSaved.ts` come `U.isProjectModified` vive su `U`, con evento a ogni scrittura. Riusa `formatRelativeTime` di `types/activity`; nessun quinto formatter. Etichetta «Unsaved» e non la coppia vietata in questo file da A3 di 10c.
**Prompt document name**: 2026-09-02 (in chat)

## 2026-09-02 — fix(persistance): l'autosave si dirada e smette di notificare (SAVE2)
**Prompt**: diradare l'autosave del layout, togliergli la notifica, e mostrare da qualche parte quando il progetto e' stato salvato l'ultima volta.
**Files touched**: frontend/src/api/persistance/projects.ts, frontend/src/components/editor-v2/hooks/useLayoutAutosave.ts, frontend/src/components/editor-v2/hooks/layoutAutosaveScheduler.ts (nuovo), frontend/src/common/libraries/lastSaved.ts (nuovo), frontend/src/events/registry.ts, frontend/src/api/__tests__/projectsSaveNotification.test.ts (nuovo), frontend/src/components/editor-v2/hooks/__tests__/layoutAutosaveScheduler.test.ts (nuovo)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: yes
**Layer Impact Report**: produced
**Smoke visivo**: passato (sonda `_tmp_save2_smoke.ts`: 5 gesti in 10 s -> 0 salvataggi durante, 1 alla quiete, silenzioso, 0 toast; save esplicito -> 1 toast; pageerror 0)
**Notes**: Misurato prima di scegliere N: un save silenzioso costa 235 ms (mediana su 5), tutti in `U.compressedState`, su 499 voci di `idlookup` — 10 gesti a 2 s producevano 6 serializzazioni complete. Trigger (a) idle a 15 s con tetto a 120 s; (b) intervallo+dirty scartato perche' l'orologio puo' cadere fra due gesti. 7 mutazioni tutte rosse. Fuori perimetro: `events/registry.ts` per la regola 25; nessun `git add -A`.
**Prompt document name**: 2026-09-02 (in chat)

## 2026-09-02 — fix(editor-v2): il gate dello Step 4 concorda con la passata che protegge (BOOT1)
**Prompt**: su un grafo creato da zero il bootstrap non produce archi — tre nodi radice, zero archi, ne' la containment ne' la reference.
**Files touched**: frontend/src/components/editor-v2/hooks/useJjomSync.ts, frontend/src/components/editor-v2/sync/m1EdgeGate.ts (nuovo), frontend/src/components/editor-v2/sync/__tests__/m1EdgeGate.test.ts (nuovo)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: produced
**Smoke visivo**: passato (sonda `_tmp_boot1_verifyC.ts`: 10 PASS/3 FAIL prima, 13 PASS/0 FAIL dopo; canvas 3 nodi 2 archi; pageerror 0)
**Notes**: Il grafo esisteva: la premessa «mai avuto un grafo» e' falsa per lo stato osservato. Lo Step 4 e' protetto da un contatore calcolato prima che lo Step 2bis crei i vertici, quindi 0 su un grafo appena ripopolato; lo Step 3 non e' protetto e i suoi archi li disegna. L'asimmetria era il difetto. Referto: docs/discovery/discovery_2026-09-02_boot1_bootstrap_archi.md.
**Prompt document name**: 2026-09-02 (in chat)

## 2026-09-02 — fix(editor-v2): la create dal manager instanzia vertice e arco sul canvas
**Prompt**: VIEW1, corsia parallela a VER2 — un figlio di containment creato dal Data
Manager esisteva nel modello e non compariva sul canvas. Misurare la divergenza alla riga,
chi possiede l'identita', quanti canvas; scegliere fra (a) simmetria dei percorsi e (b) il
canvas autorita' sul layout, con il punto 3 come discriminante.
**Files touched**: `frontend/src/components/editor-v2/hooks/createAdapter.ts`,
`.../hooks/__tests__/createAdapterFlow.test.ts` (nuovo) — commit `783a8245d`.
Referto: `docs/discovery/discovery_2026-09-02_view1_create_manager_vertice.md`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: (c)
**Regressions**: no — `tsc` 33 (baseline esatta, 0 nei due file), `build` exit 0, `vitest`
3147 verdi / 0 falliti (i 9 file `window is not defined` sono pre-esistenti, riverificati,
nessuno nel perimetro). Sonda 13/3 -> 16/0, `pageerror` 0 in entrambe le corse.
**Out-of-scope changes**: no — due file, pathspec esplicito al commit; staged EGO1 e il
perimetro VER2 (`api/persistance/`, `reducer.ts`) non toccati.
**Layer Impact Report**: produced — in chat prima del diff. D-layer (`DVertex.new`,
`DVoidEdge.new2` da un sito nuovo) e canvas v2-flow; nessun file di §3.1 modificato, le due
funzioni erano gia' esportate e gia' chiamate cosi' da `ContextMenu.tsx:371-372`.
**Smoke visivo**: passato — sonda guidata dalla UI vera del Data Manager, 16 PASS / 0 FAIL.
**Notes**: Scelto (a). (b) usciva dal perimetro di visita `model.objects`, ratificato in
CRUD3 F2, e voleva uno Step 4 che riparte sulle scritture di slot, che §3.5 vieta. Nessuna
nozione di canvas attivo esiste (grep vuoto, controllo positivo a 7 file): l'idioma e' primo
match, gia' in due posti. **Deroga P6 (RC-11)**: tipo di commit non indicato, scelto `fix`
invece di chiederlo. Aperto: figlio creato senza canvas non recuperato all'apertura.
**Prompt document name**: PROMPT_VIEW1.md — 2026-09-02

## 2026-09-02 — fix: il riallineamento di `save` non scrive piu' sull'oggetto vivo dello store
**Prompt**: VER2 — misurare quando il riallineamento di `ProjectsApi.save` colpisce `idlookup[id]` invece di un target detached, misurarne il danno, correggere solo se il danno si misura.
**Files touched**: frontend/src/api/persistance/projects.ts, frontend/src/api/__tests__/projectsSaveVersionStore.test.ts, docs/discovery/discovery_2026-09-02_ver2_riallineamento_save.md
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: (c)
**Regressions**: yes
**Out-of-scope changes**: no
**Layer Impact Report**: produced
**Smoke visivo**: non applicabile
**Notes**: Non e' il divergence point: l'app sta stabilmente a `transactionDepthLevel === 1` (`reducer.ts:1443` + `BEGIN()` in `COMMIT`), l'azione va in coda e la scrittura colpisce l'oggetto vivo SEMPRE. Misurato: bump fuori dal delta e dalla history (Δ`clonedCounter` 0, Δundo 0, contro +1/+1 del controfattuale). Regressione dichiarata (RC-11): due save entro 300ms condividono un numero. Misure, alternative scartate e residuo in `discovery_2026-09-02_ver2_riallineamento_save.md`.
**Prompt document name**: 2026-09-02 (in chat)

## 2026-09-02 — docs(log): §6.1 chiusura batch VER1 / UNQ1-C6
**Prompt**: §6.1 di chiusura del batch VER1 / UNQ1-C6 a repo fermo, seriale: spostare le tre
entry dalla inbox al log attivo, committare i prompt untracked, iscrivere RC-13-bis in
PROTOCOL, ruotare il log se oltre soglia, e accertare (non chiudere) lo stato di EGO1 in
indice. Nessun file applicativo.
**Files touched**: `docs/claude-code-log.md` + `docs/log-inbox/` (`8875ddc7f`),
`docs/prompts/` cinque prompt (`be35fde2e`), `docs/PROTOCOL.md` (`7b930bd07`).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: (e)
**Regressions**: no — nessun file di codice toccato. `npm run check:docs` **3/3, 2 warning**
prima e dopo ciascun commit; Check A resta PASS dopo l'aggiunta di RC-13-bis, che sta fuori
dal blocco verificato byte a byte.
**Out-of-scope changes**: yes — questa entry stessa e' un sesto commit oltre i cinque punti
del prompt, che non ne prevedeva una: P9 la richiede e la sua omissione e' gia' stata la
CODA del batch precedente.
**Layer Impact Report**: not-required — solo documentazione.
**Smoke visivo**: non applicabile — nessun pixel cambia.
**Notes**: Deroga dichiarata: la `Notes` di VER1 era 878 caratteri, Check C in ERROR;
accorciata sotto il cap citando `1ac3b1863`. Entry del batch corrente, stessa sessione, non
back-filling. Attivo 6 -> 9 entry, rotazione saltata (soglia 40). Accertamento EGO1: l'indice
non tiene lavoro in volo, tiene un **revert staged** (-295 righe, la discovery cancellata);
albero e HEAD identici byte a byte, test 24/24. Indice lasciato come trovato.
**Prompt document name**: PROMPT_6.1_chiusura_VER1_C6.md — 2026-09-02

## 2026-09-02 — fix(problems): l'appartenenza al modello e' un campo su NodeProblem
**Prompt**: UNQ1 C6, corsia L2 parallela — chiudere il terzo punto di §C5.4: un campo
opzionale additivo su `NodeProblem` che nomini il modello di appartenenza, scritto da
**entrambi** i produttori, e la revoca che lo usa al posto di `ownedIdsByModel`, se e solo
se tiene il caso dell'elemento cancellato che §C5.2 tiene.
**Files touched**: `frontend/src/components/editor-v2/problems/registry.ts`,
`.../problems/UniquenessProblemSync.tsx`, `.../problems/ConformanceProblemSync.tsx`,
`.../problems/__tests__/UniquenessProblemSync.test.ts` (commit `bc939442b`).
Referto in coda a `docs/discovery/discovery_2026-09-01_unq1_duplicate_name.md` (`e153c8fe2`).
Coda `7f8fa2242`: tre puntatori di riga della nota, scritti contro i file prima della
modifica. **Deroga RC-13 dichiarata (RC-11)**: quel commit tiene `registry.ts` e il referto
insieme — stessa correzione, sole righe di commento, ma e' un commit misto.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — sonda `_tmp_unq1c6.ts`: le sette righe della tabella di C5.3 verdi
prima **e** dopo, `pageerror` 0 in entrambe le corse; `tsc` 33 (baseline esatta, 0 nei
quattro file), `build` exit 0, `vitest` 3131 verdi / 0 falliti (i 9 file `window is not
defined` sono pre-esistenti, riverificati, nessuno nel perimetro).
**Out-of-scope changes**: no — quattro file, sotto la soglia dei cinque, pathspec esplicito
al commit; staged EGO1 e WIP VER1 in `api/persistance/` non toccati.
**Layer Impact Report**: not-required — il registro dei problemi e' una `Map` di modulo
lato UI: nessuna scrittura D-layer, nessun proxy L, nessun TRANSACTION, nessuna persistenza.
**Smoke visivo**: passato — sonda 22 PASS / 0 FAIL contro il dev server (prima: 15/7).
**Notes**: `ownerModelId`, non `modelId`: la conformance registra anche sull'id del
`DVertex`, che vive nel grafo non nel modello, e per l'unicita' il valore e' il `DModel` di
un metamodello quando e' un metamodello a essere aperto. Punto 4: `ownedIdsByModel`
**rimossa** — scritto alla registrazione, il campo tiene l'elemento cancellato perche'
l'owner e' nel dato. Test 7 -> 12, quattro mutazioni rosse. Censimento lettori, nome e
misure in §C6.1-C6.4 del referto. Deroga RC-13 in `7f8fa2242`, sopra.
**Prompt document name**: PROMPT_UNQ1-C6.md — 2026-09-02

## 2026-09-02 — fix(persistance): save riallinea project.__raw dopo il bump di versione
**Prompt**: VER1 (corsia L1, parallela) — `ProjectsApi.save` legge la versione da un `__raw`
stantio: due save espliciti sullo stesso `LProject` producono `1.1` due volte. Riprodurre con
una sonda contro il dev server, censire i lettori di `version`, correggere nel punto minimo,
test unitario accanto a quello DIRTY1 e invertire l'asserzione che il difetto lo registrava
com'era. Non toccare la regola ratificata 2026-08-24 (il silent save resta senza bump).
**Files touched**: `frontend/src/api/persistance/projects.ts`,
`frontend/src/api/__tests__/projectsSaveDirty.test.ts`,
`frontend/src/api/__tests__/projectsSaveVersion.test.ts` (nuovo) — commit `1ac3b1863`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `tsc --noEmit` **33** sull'output completo (baseline invariata), **0** nei
file toccati; `build` exit 0 col solo warning di chunk; `vitest` intera **3131 passati, 0
falliti**, i 9 file che non si raccolgono riverificati su un worktree staccato su HEAD e
risultati **identici** (stessa lista, `window is not defined` in `monaco-editor/.../window.js:14`
e `src/utils/PerformanceMetrics.ts:220`, nessuno dei due toccato).
**Out-of-scope changes**: no — l'inversione del test DIRTY1 è la stessa correzione, chiesta dal
prompt.
**Layer Impact Report**: not-required — nessun file della critical zone §3.1: `projects.ts` non
è in elenco, non passa da `useJjomSync`/`syncState`/`canvasToJjom`/`portDistribution`/
`VersionFixer`, e la scrittura D-layer che tocca è il `SetFieldAction` già presente, invariato.
**Smoke visivo**: non applicabile — nessun pixel cambia; la verifica è la sonda
`_tmp_ver1_verify.ts`, **5 FAIL su 7 prima, 0 su 7 dopo**, stabile su due corse.
**Notes**: Causa misurata: il reducer copia lungo il path (`reducer.ts:540`), `idlookup[id]`
diventa un oggetto nuovo e il proxy resta sul precedente. Nessun lettore dipende dal valore
stantio. Tre mutazioni rosse (6, 2, 8 FAIL). Censimento, alternativa scartata e motivazione
in `1ac3b1863` e nel commento di `projects.ts:140-162`. Notes accorciata in §6.1 sotto il cap
§21.2: entry del batch corrente, stessa sessione, non back-filling.
**Prompt document name**: PROMPT_VER1.md — 2026-09-02

## 2026-09-02 — chore(gates): Check B accetta solo la forma (x) per Causa
**Prompt**: CODA di chiusura L1–L4, punto 3 — Check B passava sia `**Causa**: (a)` sia
`**Causa**: a`. Restringere alla sola forma parentesizzata, misurando prima le conseguenze
su attivo e archivio. Hard stop se Check B scandisse anche l'archivio (il «no back-filling»
vieterebbe di emendare le entry pregresse).
**Files touched**: `frontend/scripts/gates/check-docs.ts` (commit `c9bd6112a`).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `npm run check:docs` **3/3, exit 0, 2 warning** prima e dopo, invariati.
Nessun file applicativo, nessun impatto su build o typecheck.
**Out-of-scope changes**: no — un solo file, pathspec esplicito.
**Layer Impact Report**: not-required — script di gate, nessun layer applicativo.
**Smoke visivo**: non applicabile — nessun pixel cambia.
**Notes**: Check B scandisce il solo log attivo; l'archivio serve a risolvere `Corregge`,
non viene lintato: nessuna entry pregressa toccata, niente hard stop. `Corregge` non prende
una lettera ma `YYYY-MM-DD HH:mm`, già vincolato da `TIMESTAMP_PREFIX`: la restrizione vale
per la sola `Causa`. Forme in archivio: **118 `(x)`, 8 nude, 3 di prosa**. Controllo positivo
`Causa: e` → ERROR. Il gate non ha test: dichiarato, non creato.
**Prompt document name**: PROMPT_CODA_batch_L1-L4.md — 2026-09-02

## 2026-09-02 — docs(log): chiusura batch L1–L4 (sanatoria, log-inbox, rotazione)
**Prompt**: §6.1 di chiusura del batch L1–L4 a repo fermo, seriale: bonificare l'indice
condiviso, verificare le tre sonde temporanee, scrivere la nota di sanatoria dei commit
mal-messaggiati, correggere la `Causa` di SAVE1-bis, iscrivere in P9 la regola log-inbox
per le corsie parallele, ruotare il log se oltre soglia. Nessun file applicativo.
**Files touched**: `docs/claude-code-log.md` (nota di sanatoria, `ff74cee8e`),
`docs/PROTOCOL.md` + `docs/log-inbox/.gitkeep` (regola log-inbox, `061453e65`),
`docs/claude-code-log.md` + `docs/claude-code-log-archive.md` (rotazione P9, `0838a303f`).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: (e)
**Regressions**: no — nessun file di codice toccato, nessun gate di build coinvolto.
`npm run check:docs` (da `frontend/`) **3/3, exit 0** prima e dopo ciascuno dei tre commit,
con i 2 warning non bloccanti preesistenti su `Corregge` di SAVE1-bis e DIRTY1.
**Out-of-scope changes**: no — tre commit tematici, ciascuno per pathspec esplicito.
L'indice conteneva staged della corsia EGO1: lasciato intatto, mai `git add .`.
**Layer Impact Report**: not-required — solo documentazione.
**Smoke visivo**: non applicabile — nessun pixel cambia.
**Notes**: `Corregge` resta `—`: la sessione non rifà il lavoro di una corsia, ne sana il
registro; `Causa` `(e)` è la concorrenza su albero condiviso. La `Causa` di SAVE1-bis non
andava corretta: portava già `(a)` dal commit che ha scritto l'entry (`f278cf4fb`). Le tre
sonde `frontend/scripts/smoke/_tmp_*` cadono in `.gitignore:66`, nessuna promossa.
Rotazione: attivo 49 -> 5, archivio 1025 -> 1069, verbatim per data. Nessun rewrite.
**Prompt document name**: PROMPT_CHIUSURA_batch_L1-L4.md — 2026-09-02

## 2026-09-02 — fix: UNQ1 C5, la revoca duplicate-name resta nel modello scandito
**Prompt**: UNQ1 C5 — la revoca tocca solo le entry il cui owner appartiene al modello che
l'effetto sta scansionando (referto §A.4: revoca globale, produttore per modello, `:160-164`
— aprire M2 cancella le entry M1, e non tornano). Nessuna modifica alla firma, nessun rescan
aggiunto. Perimetro: `UniquenessProblemSync.tsx` + test, NON `LModelElement.tsx` (corsia L1).
Verifica con due collisioni vere insieme, per nome ESPLICITO, before/after.
**Files touched**: `frontend/src/components/editor-v2/problems/UniquenessProblemSync.tsx`,
`frontend/src/components/editor-v2/problems/__tests__/UniquenessProblemSync.test.ts` (nuovo),
`docs/discovery/discovery_2026-09-01_unq1_duplicate_name.md` (referto C5, commit a parte).
La sonda `scripts/smoke/_tmp_unq1_c5.ts` non e' committata (`.gitignore:66`).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `npm run typecheck` su output COMPLETO **33**, la baseline esatta, **0**
nei file toccati; `npm run build` exit **0** col solo avviso di chunk-size noto; `npm run
test` intera **3118/3118** passati, 0 falliti. I 9 file che non si raccolgono sono i `window
is not defined` pre-esistenti, fuori da questo perimetro. Due mutazioni: revoca su tutti gli
owned set (il globale di prima) **3 rossi**, ciclo di revoca rimosso **4 rossi**.
**Out-of-scope changes**: no — due file di codice, entrambi nel perimetro. Commit per
pathspec: l'indice conteneva staged di altre corsie (`api/persistance/projects.ts`,
`egoDiagram.*`), non toccati.
**Layer Impact Report**: not-required — nessun file della lista di §3.2 e nessuna scrittura D:
il registro e' una `Map` di modulo, UI-only, immune a undo/redo e non persistita. La
directory `problems/` compare in §3.1, ma il diff non tocca canvas, JjOM ne' D-layer.
**Smoke visivo**: non applicabile — nessun pixel cambia. Misura sul registro con
`_tmp_unq1_c5.ts`, stesso strumento sui due lati, zero `pageerror` in entrambi: **before 9
PASS / 3 FAIL, after 12 PASS / 0 FAIL**. Entry M1 attive dopo l'apertura della tab M2 da **0
a 3**, al ritorno su M1 da **0 a 3**, dopo il rename di uno dei tre da **0 a 2**; le 2 entry
M2 restano 2 in ogni passo di entrambe le corse (controllo). Il before ottenuto ripristinando
il solo file da `git show HEAD:` e rimettendolo a posto da una copia, senza `stash` (RC-13).
**Notes**: `ownedIdsByModel`, `Map` di modulo per-modello: nessun campo su `NodeProblem`,
quindi `registry.ts` e il produttore della conformance restano fermi. Cade
`getRegistryState()`, che leggeva `window._jjNodeProblems` e in env `node` tornava vuota —
per cui la revoca era intestabile. Il corpo dell'effetto e' spostato in
`reconcileDuplicateProblems`, esportata per il test. Aritmetica: per una coppia il rename ne
revoca **due** (2 -> 0); il decremento chiede tre omonimi. Dettaglio nel referto C5.
**Prompt document name**: 2026-09-02 09:20

## 2026-09-02 — fix: UNQ1 F2, l'auto-nome non ombreggia piu' il nome vero di un nested
**Prompt**: UNQ1 F2 — (A) `get_name` (:6081): slot identita' con `values []` -> `data.name`,
auto-nome solo se anche `data.name` e' vuoto, previo censimento dei lettori che contano
sull'auto-nome in finestra; (B) `defaultname`: per un padre `DValue` di containment il
namespace e' quello di `getNamespaceOf`, non `lfather.childNames`; `get_children_idlist` non
si tocca. C1 scartato. Perimetro: `LModelElement.tsx` + il suo test, NON
`UniquenessProblemSync.tsx` (corsia L2).
**Files touched**: `frontend/src/model/logicWrapper/LModelElement.tsx`,
`frontend/src/model/__tests__/unq1AutoNameShadow.test.ts` (nuovo),
`docs/discovery/discovery_2026-09-01_unq1_duplicate_name.md` (referto F2, commit a parte).
La sonda `scripts/smoke/_tmp_unq1f2_verify.ts` non e' committata (`.gitignore:66`).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `npx tsc --noEmit` su output COMPLETO **33**, la baseline esatta, **0**
nel file toccato; `npm run build` exit **0** col solo avviso di chunk-size noto; `npx vitest
run` intera **3118/3118** passati, 0 falliti. I 9 file che non si raccolgono sono i `window is
not defined` pre-esistenti, riverificati sul `LModelElement.tsx` di HEAD: falliscono identici
senza la correzione. Tre mutazioni: guardia di A resa inerte 3 rossi, namespace di B svuotato
3 rossi, `get_name` riportato a HEAD rosso sull'ancoraggio.
**Out-of-scope changes**: no — due file di codice, entrambi nel perimetro. Commit per
pathspec: l'indice conteneva staged di altre corsie (`api/persistance/projects.ts`,
`UniquenessProblemSync.tsx`), non toccati.
**Layer Impact Report**: not-required — nessun file di §3.1. `LModelElement.tsx` e' L-layer
puro; nessuna scrittura D nuova, nessuna TRANSACTION, nessun creatore aggiunto.
**Smoke visivo**: passato — `_tmp_unq1f2_verify.ts` **before 4 PASS / 4 FAIL, after 8 PASS /
0 FAIL**, stesso strumento sui due lati, zero `pageerror` in entrambi. Nella finestra i
campioni con `raw != proxy` passano da **9 a 0**; il secondo `Add` senza rinomina da
`Edition_0` a **`Edition_1`**; i duplicate-name attivi col modello aperto da **2 a 0**; le due
root restano `Book_0`/`Book_1` in entrambe le corse (controllo). Il before ottenuto
ripristinando il solo file da `git show HEAD:` e rimettendolo a posto da una copia, senza
`stash` (RC-13).
**Notes**: censimento di A: i tre lettori di `initialName` (`instanceTable.ts:127`,
`shapeDraw.ts:205`, `irReadCtx.ts:173`) lo chiedono tutti **dopo** il nome, nel caso che la
correzione lascia intatto; nessun bloccante. C1 non presa: `get_children_idlist` resta non
ridefinito su `LValue`, e la domanda di §8 del referto resta aperta. Dettaglio, mutazioni e
i tre punti ancora aperti nel referto F2 del discovery citato sopra.
**Prompt document name**: 2026-09-02 00:20


## 2026-09-02 — refactor: «Save & Exit» passa dall'helper, il timer non sopravvive (SAVE1-bis)
**Prompt**: SAVE1-bis — `SaveAndCloseProject` (`Navbar.tsx:508`) usa `saveProjectWithFeedback`
e poi chiude. Il conteggio di «Request timed out» in `Navbar.tsx` va a 0 e il test SAVE1 che
lo pinnava va aggiornato. Opzione all'helper solo se serve. Perimetro: Navbar.tsx,
`common/libraries/saveProject.tsx`, test. NON `api/persistance.ts` (corsia L4).
**Files touched**: `frontend/src/pages/components/Navbar.tsx`,
`frontend/src/common/libraries/saveProject.tsx` (solo commenti),
`frontend/src/common/libraries/__tests__/saveProject.test.ts`. Le sonde
`scripts/smoke/_tmp_save1bis_{verify,diag}.ts` non sono committate (`.gitignore:66`).
**Outcome**: ✅ completed
**Corregge**: 2026-09-01 23:20 (SAVE1)
**Causa**: (a)
**Regressions**: no — `npx tsc --noEmit` su output COMPLETO **33**, la baseline, **0** nei
file toccati; `npm run build` exit **0**; `npx vitest run` intera **3118/3118** passati, i 9
file rossi falliscono in import (`window is not defined`) e sono preesistenti. Le due non
regressioni che il passaggio poteva rompere sono misurate a schermo su ENTRAMBI i lati (1a,
1b verdi in before e after). Quattro mutazioni sul codice nuovo: tolto il `return` sul
fallimento 1/15 rosso, cambiato l'argomento della chiamata 2/15, reintrodotto un timeout in
Navbar 1/15, chiusura spostata dentro l'`if` 1/15.
**Out-of-scope changes**: no — tre file, tutti nel perimetro. Nessuna opzione aggiunta
all'helper: non serviva, il chiamante sequenzia sul `Promise<boolean>` gia' esistente.
**Layer Impact Report**: not-required — nessun file di §3.1; l'unica scrittura D e'
`SetRootFieldAction('isLoading')` dentro l'helper, che c'era gia'.
**Smoke visivo**: passato — `_tmp_save1bis_verify.ts` **before 21 PASS / 1 FAIL, after 22
PASS / 0 FAIL**, stesso strumento sui due lati, zero `pageerror` in entrambi. L'unico rosso
del before e' 2e, che e' il difetto: dopo un errore di salvataggio arrivava, dieci secondi
piu' tardi, un «Request timed out» spurio (il vecchio `clearTimeout` stava solo sul ramo di
successo). Il before gira sui sorgenti di HEAD ripristinati da `git show` e rimessi da una
copia, **senza `git stash`** (RC-13).
**Notes**: la (a) e' del perimetro di SAVE1, non della sua esecuzione: diceva «due call
site». `U.isProjectModified = false` rimosso e non riscritto: lo azzera gia' `ProjectsApi.save`
(`projects.ts:133`) e poi `CloseProject` (`Navbar.tsx:498`). Al primo giro la sonda dava 5 rossi
FALSI: `window` sostituito a meta' misura, strumenti morti che leggevano zero ovunque. Riarmati
via `addInitScript`, contatori in `sessionStorage` per attraversare il reload della chiusura.
**Prompt document name**: SAVE1-bis (in chat) — 2026-09-02 09:00

## 2026-09-02 — fix(persistance): il dirty flag non lo azzera l'autosave silenzioso (DIRTY1)
**Prompt**: DIRTY1, dal referto SAVE1. In `ProjectsApi.save` la riga che azzera
`U.isProjectModified` sta fuori da `if (!silent)`: dopo un drag di nodo il progetto risulta
pulito e l'avviso «Unsaved changes» alla chiusura non scatta. L'azzeramento entra nel ramo
`!silent`, nessun altro cambio a `save`, before/after. Non `Navbar.tsx` (corsia L3).
**Files touched**: `frontend/src/api/persistance/projects.ts`,
`frontend/src/api/__tests__/projectsSaveDirty.test.ts` (nuovo).
**Outcome**: ✅ completed
**Corregge**: 2026-09-01 23:20 (SAVE1)
**Causa**: (c)
**Regressions**: no — `npx tsc --noEmit` su output COMPLETO **33**, la baseline, **0** nei
file toccati; `npm run build` exit **0**; `npx vitest run` intera **3091/3091** test passati
(3082 + i 9 nuovi), i 9 file rossi falliscono in import (`window is not defined`) e sono
preesistenti. Nessun chiamante dipendeva dall'azzeramento silenzioso: `saveProject.tsx` e le
tre voci di SAVE1 chiamano `save(project)` senza `opts`, quindi esplicito; l'unico
`{silent:true}` e' `useLayoutAutosave.ts:59`. I gate girano su albero condiviso con altre
corsie (vedi Notes).
**Out-of-scope changes**: no — due file, entrambi nel perimetro. Il commento del metodo,
che elencava `U.isProjectModified` fra le cose identiche nei due casi, e' aggiornato nello
stesso file: lasciarlo sarebbe stato falso.
**Layer Impact Report**: not-required — nessun file di §3.1; la modifica toglie una
scrittura su uno static di `U`, non ne aggiunge nel D-layer.
**Smoke visivo**: non applicabile. La misura e' il test, ESEGUITO e non letto: `projects.ts`
si importa in `environment: node` doppiati i suoi import e stubbato il `window` che
dereferenzia a modulo (`:453`), quindi il flag e' letto DOPO una chiamata vera a `save`.
**Before 6 PASS / 3 FAIL, after 9 PASS / 0 FAIL**, stesso file sui due lati; i 3 rossi del
before sono le sole asserzioni sul silent save. Quattro mutazioni tutte rosse: riga rimossa
4/9, condizione invertita 5/9, ramo Offline/Online saltato 6/9, version bump anche sul
silent 1/9.
**Notes**: riga misurata `api/persistance/projects.ts:133:9` — il prompt citava
`api/persistance.ts`, che non esiste (regola 15). Il difetto `version` che non avanza fra
due `save` sullo stesso `__raw` e' fuori perimetro: registrato in un test che lo asserisce
COM'E' (`1.1` due volte), cosi' il giorno che verra' corretto quel test diventa rosso.
Altre corsie comparse in albero a meta' sessione: constatate e lasciate, commit per
pathspec sull'indice altrui gia' staged (RC-13).
**Prompt document name**: DIRTY1 (in chat) — 2026-09-02 00:20

## 2026-09-02 — discovery: appendice UNQ1 F1, il «2» del tree conta figli (Q5/Q6)
**Prompt**: aggiunta a UNQ1 F1, dallo screenshot post CHECK 6: Book_0 con due figli
rinominati a nomi distinti, badge 2 nel tree, form «No issues», canvas pulito. Q5 il badge
aggrega i problemi dei discendenti sul padre, e da quale registro; Q6 il badge resta dopo
save + reload. Zero file di prodotto, sonde `_tmp_unq1_*`, nessun fix.
**Files touched**: `docs/discovery/discovery_2026-09-01_unq1_duplicate_name.md` (appendice
§A.0-§A.6 in coda al referto esistente, R-E/E-1: non riscritto). Zero prodotto. Le sonde
`scripts/smoke/_tmp_unq1_{badge,ctrl,form}.ts` non sono committate (`.gitignore:66`).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — nessun file di codice toccato; le sonde girano contro il dev server
e non modificano sorgenti, zero `pageerror` in tutte e tre.
**Out-of-scope changes**: no — un solo file, il referto.
**Layer Impact Report**: not-required — discovery read-only, nessun diff su §3.1.
**Smoke visivo**: non applicabile. Sonde: `_tmp_unq1_badge` 14/16, `_tmp_unq1_ctrl` 7/9,
`_tmp_unq1_form` 3/4. I due rossi di `_tmp_unq1_ctrl` sono il difetto di §A.4 scritto come
comportamento corretto; i due di `_tmp_unq1_badge` sono un controllo positivo che NON e'
partito (misura rotta, non un negativo) e sono stati rifatti in `_tmp_unq1_ctrl`, dove
passa; quello di `_tmp_unq1_form` e' l'asserzione che cercava «duplicate» dove la form
rende «1 warning».
**Notes**: il badge conta figli, non problemi: `instance.children.length`
(`TreeViewContent.tsx:891`), misurato 2/3/5 su padri con 0/0/2 entry attive. `FeatureRow`
non legge `_jjNodeProblems`; l'unico lettore dell'albero e' `EntityRow` (`:719-720`), per
il proprio id. I warning non sopravvivono al rename. Dopo il reload il badge resta perche'
restano i figli. Due fatti nuovi in §A.4 e §A.5. Referto per il resto.
**Prompt document name**: UNQ1 F1 aggiunta (in chat) — 2026-09-02 00:00

