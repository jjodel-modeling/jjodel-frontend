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

## 2026-09-18 — chore: fold and rotate the prompt log by script, gate red above 40 (P-2026-09-18-2015)
**Prompt**: `claude_2026-09-18_2015_prompt_log_rotate_fold_gate.md`. Replace hand-folding of
`docs/log-inbox/*.md` and hand-rotation into `docs/claude-code-log-archive.md` with `log-tools.ts`
+ `rotate-log.ts` (`--fold`, `--rotate`, `--keep=40`, `--write`); `check:docs` gains Check D
(active entries > 40 fails, non-empty inbox warns). Ran the tool for real: fold (101 → 118, three
inboxes emptied), then rotate (118 → 40, 78 moved verbatim to the archive).
**Files touched**: code — `frontend/scripts/gates/log-tools.ts`, `rotate-log.ts`,
`__tests__/log-tools.test.ts`, `check-docs.ts`, `frontend/package.json`, `vitest.config.ts`
(`920b84895`). Docs — `docs/PROTOCOL.md` (`3de7bef90`); `docs/claude-code-log.md` +
`docs/log-inbox/{harness,symbol-editor,views}.md` (`095f27cd1`); `docs/claude-code-log.md` +
`docs/claude-code-log-archive.md` (`9378e405e`); `docs/claude-code-log.md` (`eab6eb23f`).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: yes
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: docs/log-inbox/harness.md predates this lane's discovery (9a9f7952b, before 5c9e88d16); the report's sentence missed it, amended not rewritten. 5642a7d80, 5c9e88d16, 920b84895 predate the Model trailer in this lane (RC-11). 3de7bef90's P9 sentence is owed to the trunk (§6.6). Ticket: fold should lint inbox entries against the Notes cap in dry-run. This entry makes the log 41; Check D red by design until the next batch.
**Prompt document name**: 2026-09-18 20:15

## 2026-09-18 — fix: guard the Escape close binding when no popup is open (item A)
**Prompt**: `claude_2026-09-18_1650_prompt_view_quattro_difetti_minori.md`, item A: the Escape
binding at `ContextMenu.tsx:669` calls the module-level `closefunc`, `null as any` until the
classic popup renders, so Escape with no popup throws `closefunc is not a function` (measured,
discovery_2026-09-16_rotta_archi_righe.md §3). Fix: guard the call with `closefunc?.()`, nothing
else.
**Files touched**: `1f3caab09`, 1 file: `components/contextMenu/ContextMenu.tsx` (line 669 only,
`()=>closefunc()` → `()=>closefunc?.()`). This entry in its own commit.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. `npm run typecheck` exit 2, **33** on full output, the declared baseline, **0**
in the touched file; control `Measurable` → 6. `npx vitest run`: **3816 passed, 0 failed**, the same
9 files red at import as before the change (the +4 tests vs the last active-log entry are lane L3's
untracked `summaryLines.test.ts`, not this lane's). `npm run build` exit 0, pre-existing
chunk-size warning only.
**Out-of-scope changes**: no.
**Layer Impact Report**: not-required — no §3.1 file, no D-layer write, the binding only calls a
popup-close callback.
**Smoke visivo**: passato — Alfonso on localhost:3000, ACK of 2026-09-18: Escape on the open v2
canvas with no popup, console clean after a hard refresh (the error had been reproduced on the
stale tab first). The classic popup path is not reachable today (same discovery §1), so the console
is the whole check.
**Notes**: Defect found, not caused, by the previous prompts — item A of a four-defect batch left
open by the 15-16 September round. No test executable for this module under vitest (imports
through `joiner`, `window is not defined`); stated here, no source-text test per the §5 sub-rule.
**Prompt document name**: 2026-09-18 16:50

## 2026-09-18 — fix: stop hiding every dialog header from the alert stylesheet (item B)
**Prompt**: `claude_2026-09-18_1650_prompt_view_quattro_difetti_minori.md`, item B: the global
`.alert-header, .dialog-header { display: none }` in `alert/style.scss:112-114` removed the header
of every dialog in the app; `.alert-header` has zero tsx consumers (re-measured with
`command grep`), `.dialog-header` five. Fix: drop `.dialog-header` from the selector only.
**Files touched**: `0214f29d4`, 1 file: `components/alert/style.scss` (one line, the selector loses
`, .dialog-header`). This entry in its own commit.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. `npm run typecheck` exit 2, **33** on full output, the declared baseline, **0**
in the touched file; control `Measurable` → 6. `npx vitest run` from `frontend/`: **3816 passed,
0 failed**, the same 9 files red at import as before the change. `npm run build` exit 0. A first
vitest+build round ran from the repo root by mistake (no `package.json` there, vitest with a
different root): discarded, both re-run from `frontend/`.
**Out-of-scope changes**: no.
**Layer Impact Report**: not-required — style only, no §3.1 file, no behaviour read by sync or D-L.
**Smoke visivo**: passato — Alfonso on localhost:3000, ACK of 2026-09-18: the five dialogs (New
View, New Viewpoint, New Transformation, Execute Transformation, Create Project) show their header
once, titles not duplicated, alert toasts unchanged; no finding on any dialog's own scss.
**Notes**: Defect found, not caused, by the previous prompts — item B of a four-defect batch left
open by the 15-16 September round. No test: style only.
**Prompt document name**: 2026-09-18 16:50

## 2026-09-18 — fix: an empty metaclass list is a draft, never a commit (item C)
**Prompt**: `claude_2026-09-18_1650_prompt_view_quattro_difetti_minori.md`, item C: switching the
wildcard off writes `metaclasses: []`, which passes `validateIR` (probe G1), so the debounced
commit stored it and the view matched nothing, blanking a viewpoint whose only IR view is this one
(probe G2). Decision (chat, do not reopen): an empty list is an unfinished edit — never committed,
the stored ir keeps its previous `metaclasses`; the section says so.
**Files touched**: `3f5fe347b`, 6 files: `viewpoint/authoring/committableMatching.ts` (new, pure,
no imports: `isCommittableMatching`), `viewpoint/authoring/__tests__/committableMatching.test.ts`
(new, 5 tests), `viewpoint/authoring/MatchingSection.tsx` (the empty-list hint line, one text),
`viewpoint/authoring/VertexAuthoringPanel.tsx` (commit gate after `dirtyRef` before `validateIR`,
same gate on the unmount flush, import), `viewpoint/authoring/EdgeAuthoringPanel.tsx` (commit
gate + import, no flush exists), `viewpoint/authoring/RowAuthoringPanel.tsx` (same). Rule-19
listing shown and approved in chat before writing. This entry in its own commit.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. `npm run typecheck` exit 2, **33** on full output, the declared baseline, **0**
in the six touched files; control `Measurable` → 6. `npx vitest run` from `frontend/`: **3821
passed, 0 failed** (+5 = the new test file), the same 9 files red at import as before. `npm run
build` exit 0.
**Out-of-scope changes**: no.
**Layer Impact Report**: not-required — no §3.1 file; the gate only skips the panel's own
`set_ir` write on a draft shape, no sync or D-layer path touched.
**Smoke visivo**: passato — Alfonso on localhost:3000, ACK of 2026-09-18: neutral canvas
reproduced on the stale tab first; after hard refresh the four checks hold (wildcard off on a
vertex view and an edge view: no neutral canvas, hint shown; metaclass picked: hint gone, canvas
narrows within the debounce; wildcard back on with empty list: nothing neutral). Extra check by
Alfonso: closing and reopening the view tab with an empty list brings the wildcard back on
(stored ir kept, draft dropped, as decided).
**Notes**: Defect found, not caused, by the previous prompts — item C of a four-defect batch (`claude_2026-09-18_1650_prompt_view_quattro_difetti_minori.md`). The replaced hint (MatchingSection `:170-172`) stated the behaviour this fix removes. An uncommitted empty list does not survive a tab change (draft dropped, stored ir keeps the wildcard) — a persisted draft is a separate decision, not this lane's. Rest: `docs/sessioni/sessione_2026-09-18.md`. Mutation bench: 5/5 red.
**Prompt document name**: 2026-09-18 16:50

## 2026-09-18 — fix: focus the inline rename input when it mounts (item D)
**Prompt**: `claude_2026-09-18_1650_prompt_view_quattro_difetti_minori.md`, item D: the rename
`<input>` shown right after a view is created never receives focus, on both creation paths.
Fase 1 (read-only) measured the cause: the store write behind a new view is a macrotask
(`action.ts:349`'s `setTimeout(…, 0)`), so the row mounts in a commit strictly later (98-297ms
across two probe runs) than the parent's `useEffect([renamingViewId])`, which always reads a null
ref and never calls `.focus()`/`.select()` at all — not "focus stolen", focus never applied. This
also falsifies an existing comment claiming same-commit React 18 batching. Fase 2 moved the focus
effect into `SubViewItem`, keyed on its own `isRenaming`, guaranteeing the effect and the ref
attachment land in the same commit.
**Files touched**: `faa893a77`, 1 file: `components/TreeViewSidebar/TreeViewContent.tsx` (new
`useEffect([isRenaming])` inside `SubViewItem`; the dead parent effect on `[renamingViewId]`
removed; the stale batching comment at the blank-view creation site rewritten to state the
measured cause). Discovery report `docs/discovery/discovery_2026-09-18_rename_input_focus.md`
(new) and this entry travel in the docs commit, per lane discipline (§6.4: docs and code never in
the same commit).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no (Alfonso ACK, see Smoke visivo). `npm run typecheck` exit 2, **33** on full
output, the declared baseline, **0** in the touched file; control `Measurable` → 6. `npx vitest
run` from `frontend/`: **3821 passed, 0 failed**, the same 9 files red at import as before. `npm
run build` exit 0.
**Out-of-scope changes**: no.
**Layer Impact Report**: not-required — no §3.1 file; local component state and a ref already in
scope, no D/L or sync-layer surface touched.
**Smoke visivo**: passato — Alfonso on localhost:3000, ACK of 2026-09-18: rename box editable at
once on both paths, Enter commits, Escape on first rename deletes, the ~200ms row delay observed
and pre-existing.
**Notes**: Pass criterion renegotiated mid-task. Stated first as "activeElement === input at
+50ms after click": FAILed on both paths (mount itself lands at +206/+207ms, unrelated pre-existing
store lag, out of this item's scope). Restated by Alfonso as "focused within 20ms of its own
mount": measured 9ms and 1ms, PASS both paths — recorded as a measurement, not a defect of this
lane. Probe deleted after the run (gitignored, never committed).
**Prompt document name**: 2026-09-18 16:50

## 2026-09-18 — docs: the ObjectNode comment states what the resolver does on a wildcard view (item E)
**Prompt**: `claude_2026-09-18_1650_prompt_view_quattro_difetti_minori.md`, item E: the comment at
`ObjectNode.tsx:108-110` lumped "no IR viewpoint" and "a wildcard IR view" together as both making
the object "keep rendering in full", implying one code path. They are not the same path: a wildcard
(`'*'`) view resolves non-null and renders through the IR default object view at minimal specificity
(`irResolveCore.ts`); only "no IR viewpoint" is the native path. Comment-only, no code change.
**Files touched**: `6001add8b`, 1 file: `components/editor-v2/nodes/ObjectNode.tsx` (comment above
`irViewpointActive`, 5 lines replacing 3). This entry in its own commit.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — comment-only, no gate run.
**Out-of-scope changes**: no.
**Layer Impact Report**: not-required — comment only, no behaviour changed.
**Smoke visivo**: non applicabile — no runtime surface changed.
**Notes**: Anchor verified live before editing (rule 15): still `:108-110`, unchanged since the
prompt was written. Text is the user's exact replacement, given verbatim in the ACK.
**Prompt document name**: 2026-09-18 16:50

## 2026-09-18 — feat(editor-v2): multi-instance preview of the Symbol Editor (slice 5)
**Prompt**: `claude_2026-09-17_1425_prompt_slice5_preview_multi_istanza.md` — slice **5**, the last
of the 1b round: the preview strip draws up to three REAL instances of the view, each with the axes
that instance resolves to and a caption saying which rule won on it. The prompt took the five
decisions the handoff docs left open (D8-a caption per active section, D8-b fallback glyph for a
conditional form, D8-c the title stays «Custom symbol», D8-d manual size per instance, D8-e fixed
strip) and supplied six measured preconditions, re-checked one by one in Fase 1. Two-phase with a
conditional stop; none of the three stop conditions held, so Fase 2 ran in the same session.
**Files touched**: `5c4db90b1`, 8 files, code only (the prompt's own declared list, so rule 19's
threshold is crossed with the list already written and confirmed). `ir/irCompile.ts` (+33:
`matchIndexOf`, additive, on no render path), `authoring/useCanvasNodeBox.ts` (+80:
`useCanvasNodeBoxes(viewId, max)`; `useCanvasNodeBox` keeps its signature and now delegates its scan
to the shared `resolveCanvasNodes(viewId, 1)`), `authoring/previewInstances.ts` (**new**, pure: the
per-instance resolution and the caption), `authoring/SymbolEditorModal.tsx` (the wiring: boxes,
signature, ReadCtx, tiles; `currentAxesPreset` gains the D8-b fallback and stops returning null),
`authoring/SymbolEditorModal.scss` (the tile row and the tile), `authoring/SymbolBoxPreview.tsx`
(a `caption` prop and the narrowed «Declared limit» paragraph), plus the two test files
`ir/__tests__/matchIndexOf.test.ts` and `authoring/__tests__/previewInstances.test.ts` (**new**, 30
tests). `VertexAuthoringPanel.tsx` was not touched. Discovery report and this entry in a separate
docs commit.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — verified on screen by Alfonso (ACK 2026-09-18), all six acceptance criteria
holding: 1–4 on the ordered list under **Smoke visivo**, 5 by the two mutation benches in
**Notes**, 6 by the gates: `npm run typecheck` exit 2, **33** on full output, the declared
baseline, and **0** in the eight touched files. `npx vitest run` **3811 passed, 0 failed**, 171
files with the same **9** red at import (`window is not defined`, all under `jjscript/`, `jjtl/`
and `utils/`, none of them this lane's). Of the +83 tests against the 3728 of the shape-axis run,
**exactly 30 are this task**, the two new files; the rest is the jjscript lane's. `npm run build`
exit 0, `✓ built in 39.41s`, only the pre-existing chunk warning and the pre-existing `bordr` typo
in `editors/properties-with-tree-view.scss:1210`.
**Out-of-scope changes**: no — 8 files, all of them on the prompt's list.
**Layer Impact Report**: not-required — no §3.2 file and no D-layer write path. Everything this
slice adds is a READ: `matchIndexOf` compiles predicates and evaluates them, the modal reads
`store.getState().idlookup` behind a primitive-signature subscription, and no action is dispatched
on any new path. No schema change, no persistence, no `irVersion` bump. Same call as slices 4a, 4b
and the shape-axis table on these same files.
**Smoke visivo**: passato — run by Alfonso (ACK 2026-09-18) on the ordered list handed to him in
chat, criteria 1–4 all holding: (1) a view with 3 instances satisfying different rules shows three
tiles with three different, correct captions in the Symbol, Fill, Marker and Border sections, the
winning row being the FIRST one that holds, not the last; (2) the same view in Padding or Text
shows three size captions, and one resized instance reads `manual size` on its own tile only;
(3) with 0 instances the strip is identical to today, except that a conditional form draws its
fallback glyph; (4) switching between 1 and 3 instances, or between sections, moves nothing outside
the strip: same strip height, same panel position, no layout shift.
**Notes**: Banchi: `matchIndexOf` all'ULTIMA regola vera = **2 rossi**, entrambi in
`matchIndexOf.test.ts`; caption Border all'ULTIMA riga = **1 rosso**, il test che porta quel nome.
`BorderOverrideRow` porta `whenText` e non `when`: ri-derivata in `borderRowPredicates`, vincolata
da un test di equivalenza su fixture divergente; l'alternativa migliore (campo `when` opzionale)
esce dallo scope. `&__preview-empty` resta con `// TODO: cleanup`. Referto:
`discovery_2026-09-17_slice5_preview_instances.md` §5.
**Prompt document name**: 2026-09-17 14:25

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
## 2026-09-18 — fix: the summary numbers skipped lines in editor space (corsia L3)
**Prompt**: `claude_2026-09-17_1024_prompt_jjscript_silent_defects_duplicates_extends_skipped.md`,
phase 2 lane L3, with Alfonso's GO of 2026-09-18 (the D6 mapping, render time only, the named
mutant, hard stop) and his ACK: the three visual checks passed and the third file is sanctioned.
**Files touched**: `139350eea`, 3 files: `jjscript/components/ScriptBlock.tsx` (one import, the
`summaryForDialog` memo mapping `executionSummary.skippedLines` through the `lineToCommandIndex`
the component already builds, the dialog's `summary` prop takes the mapped copy),
`jjscript/components/summaryLines.ts` (new, pure: `skippedLinesAsEditorLines`, the same lookup
`getScriptLine` performs with the same fallback), `jjscript/__tests__/summaryLines.test.ts` (new,
4 tests: the prompt's comment-and-blank case, the identity control, order preservation, the
fallback). `ExecutionErrorDialog.tsx` untouched; `skippedLinesSet`, `runCommandsFromIndex` and
the `EXECUTION_PAUSED` detail keep command-index space, as the prompt's decision requires. This
entry in its own commit.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no, set on Alfonso's ACK. `npm run typecheck` **33** on full output, the declared
baseline, control `Measurable` → 6, **0** in the touched files; `npx vitest run` **3816 passed,
0 failed**, the same 9 files red at import; `npm run build` exit 0.
**Out-of-scope changes**: yes, one, sanctioned at the GO's ACK: `summaryLines.ts` is a third file
beyond «ScriptBlock.tsx and its test», because the component imports the `joiner` barrel and does
not load under vitest; a pure module beats a source-text test.
**Layer Impact Report**: not-required — no §3.1 file; display only, nothing in the executor, no
D-layer write path.
**Smoke visivo**: passato — Alfonso on screen: the summary reads «Skipped lines: 3» with the
comment and the blank line before the skipped command, 1 without them, and Skip Line resumes from
the right command.
**Notes**: Bench 3/3 killed with apply controls; the GO's wiring mutant (the unmapped summary
reaching the dialog) cannot be executed in the bench, declared, no source-text substitute. The two
§8 tickets stay open: the probe result and the overflow status were announced three times with
unfilled placeholders and never reached the lane; the type-reference ticket is a candidate L5, fix
shape of `9345a4046`, if the probe reproduces the race.
**Prompt document name**: 2026-09-17 10:24

## 2026-09-18 — fix: the waiter waits for a same-script superclass, the pass refuses a forward one (corsia L4)
**Prompt**: `claude_2026-09-17_1024_prompt_jjscript_silent_defects_duplicates_extends_skipped.md`,
phase 2 lane L4, the TODO L1 and L2 left open, with Alfonso's GO of 2026-09-18: the validator on
the superclass role plus the same-script race, born from the read-only report committed with this
entry (`discovery_2026-09-17_superclass_same_script_race.md`).
**Files touched**: `9345a4046`, 6 files: `jjscript/executor/dependencies.ts` (the superclass of
`create class|abstract class|interface` becomes a `required` dependency, so `waitForDependencies`
polls for it; the `add` case passes its element type because `add` becomes a `create`;
`EXTENDING_ELEMENT_TYPES`), `jjscript/executor/scriptValidator.ts` (the superclass role joins the
forward-reference pass via `superclassNames`, the same three element types, header rewritten),
`jjscript/executor/superclassResolution.ts` (`missingSuperclassRefusal` sets its own suggestion:
the `PARENT_NOT_FOUND` table text told the user to repeat what already worked),
`jjscript/__tests__/scriptValidator.test.ts` (+3 tests, the old acceptance inverted),
`jjscript/executor/__tests__/superclassResolution.test.ts` (+1),
`jjscript/__tests__/dependencies.test.ts` (new, 9 tests, the last added because the bench mutant
on the `add` path had no killer). This entry in its own commit.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. `npm run typecheck` exit 2, **33** on full output, the declared baseline,
control `Measurable` → 6, **0** in the touched files; `npx vitest run` **3812 passed, 0 failed**,
the same 9 files red at import; `npm run build` exit 0, pre-existing warnings only. Committed
behaviour changes by decision, both declared in the report §7: an absent superclass now takes up
to `MAX_WAIT_MS = 500` ms to refuse, polled every 30 ms, and the same wait applies to `add`.
**Out-of-scope changes**: no. The `add` elementType pass and the bench-added test are inside the
GO's file list and declared in the commit message.
**Layer Impact Report**: not-required — no §3.1 file, no D-layer write path, no TRANSACTION; the
validator reads the name set the caller hands in, the wait happens before dispatch.
**Smoke visivo**: passato — Alfonso on screen, five checks: a same-script superclass resolves (1);
a forward one refused before command 1 with nothing created (2); an absent one refused within the
declared 500 ms with nothing created (3); one of several missing leaves the class uncreated (4);
the L1 duplicate refusal unchanged (5).
**Notes**: Mutation bench 9/9 killed, each with an apply control; one ambiguous anchor was refused,
re-run fixed, not scored. Two open tickets at the GO's instruction, not this lane's work, both
report §8: the `type-reference` role is still `required: false` (enum before an attribute typed on
it: probe not run) and the long refusal message overflows the dialog's red box (cosmetic). The GO's
placeholders for both arrived unfilled. Same declared gap as L1/L2: `createClass` wiring has no
executing test.
**Prompt document name**: 2026-09-17 10:24

## 2026-09-17 — feat(editor-v2): the 1b shell of the Symbol Editor (slice 4b)
**Prompt**: `claude_2026-09-16_2339_prompt_slice4b_guscio_2h.md` — slice **4b**, the SHELL half of
spec slice 4 (4a, the Goal family, is already in): popover `variant='popover'`, 1b header with the
preset chip, `nav sezioni (170px) | panel` with the count badges, 1b footer, and
`applyPresetToShape(shape, preset, {keepRules})` under D7. The five things the 2h mockup shows and
the plan does not have (metaclass dropdown, View name, Notations chips, «Also used for», «Show
diff») stayed out; none of them was needed to make the shell work.
**Files touched**: `b53d2f5dd`, 10 files, code only. `authoring/borderOverrides.ts` (**new**, pure:
`borderOverrideRows` moved out of the panel), `authoring/SymbolEditorModal.tsx` (the 1b shell:
chip + popover, section nav, footer, badges), `authoring/SymbolEditorModal.scss` (chip, popover,
nav; the two-column grid, the Border span, the tab bar and the catalog column rules **removed**),
`authoring/SymbolCatalogPicker.tsx` (`variant='popover'` reusing the `'column'` path, footer),
`authoring/VertexAuthoringPanel.tsx` (`activeSection` prop, section wrappers, the moved function),
`authoring/irTabs.tsx` (`IRSectionId`, labels, `irSectionStyle`), `ir/notationCatalog.ts`
(`ApplyPresetOptions`, `keepRules`), plus three test files — `authoring/__tests__/borderOverrides.test.ts`
(**new**, 11), `authoring/__tests__/symbolCatalogPopover.test.ts` (**new**, 9, rendered) and
`ir/__tests__/notationCatalog.test.ts` (+7 on `keepRules`). This entry in this inbox, in its own commit.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — verified on screen by Alfonso (ACK 2026-09-17), all eight points holding: the
rail unchanged with every section; a view with a scalar border draws identical; the header shows the
chip and no catalog column; the popover opens with Base expanded and its footer reads 56 presets and
5 families; the nav shows one section at a time at full width; the badges are consistent; `keepRules`
keeps the two rules without writing `default`; the footer behaves as expected. Gates all green: `npm run typecheck` exit 2, **33** on full output, set byte-identical to the pre-edit run
(`diff` exit 0), **0** in the ten touched files. `npx vitest run` **3718 passed, 0 failed**, the same
9 files red at import (`diff` of the FAIL lines, exit 0). Of the +47 against the pre-edit 3671,
**27 are this slice** (11 + 9 + 23→30) and 20 belong to the jjscript lane, whose files were written
at 23:54–23:56 between the two runs — measured, not assumed. `npm run build` exit 0, only the
pre-existing chunk warning.
**Out-of-scope changes**: yes — 10 files, over regola 19's threshold, declared in chat with the
Layer Impact Report before the diff and proceeded with under **RC-11**. Each is named by the spec
for this half or forced by it: `borderOverrides.ts` exists because the prompt requires tests on
`borderOverrideRows` and `VertexAuthoringPanel` cannot be imported by the bench; `irTabs.tsx`
carries the section vocabulary the panel and the modal must agree on. Second deviation, declared:
the nav has **8 entries, not the spec's 7**.
**Layer Impact Report**: produced — in chat before the diff, as §3.2 and P5 require for
`viewpoint/ir` and `viewpoint/authoring`. No D-layer, no L-layer, no sync, no persistence: the IR
schema is unchanged, `applyPresetToShape` gains an argument and under `keepRules` writes strictly
fewer keys, so no `irVersion` bump and no VersionFixer. The write path is the same canonical
whole-object `set_ir`.
**Smoke visivo**: passato — eseguito da Alfonso il 2026-09-17 (ACK visivo) sulla lista ordinata
consegnata in chat, tutti e otto i punti reggono (elencati sotto **Regressions**). The unit bench
below and the rendered popover test cover the same ground on the non-visual side.
**Notes**: Ambiguità «scrolla/mostra» risolta in **mostra una sezione per volta**, come chiede la spec: perciò il grid a due colonne e lo span del Border sono **rimossi**, non lasciati — con una sezione sola il grid la impagina a sinistra. Banco: 3 mutanti su `borderOverrideRows`, 5/2/2 rossi, sorgente ripristinato. Nav a 8 voci: `irTabsForKind` non dà Appearance al rail, quindi Shape e Badges si raggiungono solo qui. Altra corsia: `6ae3e15eb` nel giro, nessun suo file nel mio commit.
**Prompt document name**: 2026-09-16 23:39

## 2026-09-17 — feat(editor-v2): the rules table on the shape axis
**Prompt**: `claude_2026-09-17_1048_prompt_regole_su_shape.md` — give `SHAPE` the rules table that
`FILL`, `MARKER` and the three border axes already have, shaped like the border ones (no
`noneValue`, no `fixedLabel`: a form always has a value). The prompt supplied the preconditions as
already measured and asked only that they be re-checked, which they were, one by one.
**Files touched**: `e343242bd`, 2 files. `authoring/VertexAuthoringPanel.tsx` (+10: the `rulesTable`
prop on the form's `ConditionalEditor`, plus the comment that records the criterion at the site that
raises the question), `ir/__tests__/symbolRecognition.test.ts` (+15: a form in `{rules, default}`
form matches no preset and does not fall back to the default, with a positive control on the same
default written as a scalar). The corner radius stepper was not touched. This entry in this inbox,
in its own commit.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — verified on screen by Alfonso (ACK 2026-09-17) on localhost:3001 in Advanced
mode, acceptance criteria 1–3 answered and all five checks holding (listed under **Smoke visivo**).
Criterion 4 is covered by test and bench, criterion 5 by the gates: `npm run typecheck` exit 2,
**33** on full output, set byte-identical to the pre-edit run (`diff` exit 0), **0** in the two
touched files. `npx vitest run` **3728 passed, 0 failed**, the same 9 files red at import (`diff`
exit 0; those 9 fail at import on `window is not defined` and are why vitest's own exit is non-zero,
as before). Of the +10 against the 4b run's 3718, **exactly 1 is this task** (symbolRecognition
14→15); the other 9 are the jjscript lane's `2b357af17` and `fad85bae5`, the second of which adds a
test file (165→166) — measured from the commits, not assumed. `npm run build` exit 0, `✓ built in 1m
45s`, only the pre-existing chunk warning.
**Out-of-scope changes**: no — 2 files, both inside «`VertexAuthoringPanel.tsx` and its tests». The
test went into `symbolRecognition.test.ts` because that is the only place criterion 4 can be
executed: the panel itself has no test file and cannot have one (see **Notes**).
**Layer Impact Report**: not-required — no §3.2 file, no D-layer or L-layer write path, no schema
change and no persistence. `Conditional<T>` already admitted all three shapes on every axis, so the
IR the panel can now write was already a legal value that `compileConditional` already resolved;
nothing to migrate, no `irVersion` bump. Same call as slice 4a on this same file.
**Smoke visivo**: passato — run by Alfonso on 2026-09-17 on localhost:3001 in Advanced, on the
ordered list handed to him in chat: (1) the rules table appears on the form axis and starts empty,
(2) per-instance rendering follows the rules with the default as fallback, (3) an existing
`{when,then,else}` survives open/close without an edit and is rewritten to `{rules, default}` only
after a real edit, (4) Basic mode shows the form rules without offering an overwrite, (5) preset
application with `keepRules` behaves as observed in slice 4b. Deferred to slice 5 by Alfonso in the
same ACK, not defects of this slice: the «Custom symbol» title and the absence of a static preview.
**Notes**: Criterio (anche nel commit e nel codice): la tabella va agli assi con **più di due valori**, i booleani tengono il predicato singolo. Banco su `symbolRecognition`: leggere il `default` su tutti gli assi = **3 rossi** (questo più i due della slice 2), sul solo form = **1 rosso**, ed è questo test, nessun altro nel file lo prende. Il prop in sé NON è coperto: `VertexAuthoringPanel` non si importa nel banco (monaco via `joiner`) e §5 vieta il test sul sorgente — lacuna dichiarata.
**Prompt document name**: 2026-09-17 10:48

## 2026-09-17 — fix: a missing superclass creates nothing (corsia L2)
**Prompt**: `claude_2026-09-17_1024_prompt_jjscript_silent_defects_duplicates_extends_skipped.md`,
phase 2 lane L2, with Alfonso's GO answer 4: every superclass resolved before `DClass.new`, on any
miss create nothing and fail with `PARENT_NOT_FOUND` skippable, same resolution order and
bound-scope guard, standalone `extends` command untouched.
**Files touched**: `4898aa60f`, 3 files: `jjscript/executor/superclassResolution.ts` (new, pure:
`superclassNames`, `missingSuperclassRefusal`, `resolveSuperclasses`),
`jjscript/executor/__tests__/superclassResolution.test.ts` (new, 15 tests),
`jjscript/executor/commands/create.ts` (resolution moved ahead of `DClass.new`, the two old
superclass blocks replaced by one loop over the resolved list). The code was written by background
session 818585 (`claude agents` id 08604181), which was then renamed onto the Symbol Editor prompt
P-2026-09-17-1048 and left L2 uncommitted in the tree; session 00207c verified it, re-ran the gates
and the mutation bench on the current tree, and took the lane over. This entry in its own commit.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. `npm run typecheck` exit 2, **33** on full output, the declared baseline,
control `Measurable` → 6, **0** in either touched file; `npx vitest run` **3770 passed, 0 failed**
(3755 before, +15), the same 9 files red at import; `npm run build` exit 0, pre-existing chunk-size
warning only. Committed behaviour does change by decision: a `create class` whose superclass is
missing used to succeed without the generalization and now creates nothing, skippable.
**Out-of-scope changes**: yes. `parser.ts:359-366` pushes each `extends` name onto `superClasses`
and overwrites `superClass` with the same token, so `superClass` is always the LAST name. The old
code read the two as disjoint sources (`superClass` first, then `superClasses` from index 1), so
`A extends B extends C` produced `extends = [C, B, C]`: the first superclass dropped, the last
applied twice. `superclassNames` now takes the list in order. No file outside the three was touched.
**Layer Impact Report**: not-required — no §3.1 file, no TRANSACTION introduced, the
`SetFieldAction`s on `extends` still run after `DClass.new` as before.
**Smoke visivo**: passato — Alfonso on localhost:3001, five checks: a missing superclass refused
with no `ALU` left in the tree after Skip Line; several superclasses with one missing, nothing
created; `A extends B extends C` with both present giving exactly two generalizations, `B` and `C`,
each once; plain `create class` unchanged; standalone `A extends B` with a missing `B` unchanged.
Recorded here too, the log being add-only: the L1 smoke of `09ce4b60c`, run by Alfonso on
2026-09-17, six checks all passed, check 1 from the JjScript console (typed-command path).
**Notes**: Mutation bench 7 applied, 7 killed, 0 survived, each with an apply control asserting the
edit landed; a first harness silently failed to apply 4 of 6 and was fixed rather than counted as
survivors. Declared gap: the `createClass` wiring has no executing test (`create.ts` does not import
under vitest) and no source-text substitute. The L1 TODO stays open: the forward-`extends` refusal
belongs in `scriptValidator.ts`, which is lane L4.
**Prompt document name**: 2026-09-17 10:24

## 2026-09-17 — fix: the JjScript create consults the M2 uniqueness verdict (corsia L1)
**Prompt**: `claude_2026-09-17_1024_prompt_jjscript_silent_defects_duplicates_extends_skipped.md`,
phase 2 lane L1, with Alfonso's GO answers 1-3 (all nine kinds of D1, through a pure function in
`create.ts` before `D*.new`; the near-homonym warning belongs to L1 and is rendered per line; the
message shape) plus his later addition: verify the guard is not one flat namespace, and stop before
L2 if it is.
**Files touched**: `09ce4b60c`, 5 files: `jjscript/executor/m2CreateGuard.ts` (new, pure),
`jjscript/executor/__tests__/m2CreateGuard.test.ts` (new, 27 tests),
`jjscript/executor/commands/create.ts` (two imports, the gate before the switch, the warning merge
after it, `metamodelNameFor`), `jjscript/components/ScriptBlock.tsx` (`warningLines` + the strip),
`jjscript/components/ScriptBlock.scss` (`.script-block__warning`). This entry in its own commit.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. `npm run typecheck` **33** on full output, the declared baseline, control
`Measurable` → 6, zero hits in any touched file; `npx vitest run` **3755 passed, 0 failed**, the same
9 files red at import; `npm run build` exit 0, pre-existing chunk-size warning only; `check:docs`
3/3. Committed behaviour does change by decision: a duplicate M2 create used to succeed and now
fails, skippable (R-M2U, already ratified 2026-08-30).
**Out-of-scope changes**: no. `ScriptBlock.tsx`/`.scss` are the render half of answer 2.
**Layer Impact Report**: not-required — no §3.1 file; `nameUniqueness.ts` and `D*.new` untouched, the
gate only reads.
**Smoke visivo**: passato — Alfonso on localhost:3001, checks 1-5: duplicate refused with Skip Line
and no second class in the tree, the same name in another metamodel created, `Foo`/`foo` both created
with the amber warning visible and no pause, two identical creates in a row (first applies, second
refused), `create attribute Person in Person` accepted and the inherited-feature case refused naming
the superclass. Plus his own two: a command that already emitted warnings shows them in the strip
without layout breakage, and after Skip Line the tree holds no duplicate.
**Notes**: Side effect: warnings from OTHER commands are now visible in script blocks — the field
was carried and nothing rendered it. Declared gap: `executeCreate`'s wiring has no executing test
(`create.ts` does not import under vitest) and no source-text substitute. Flattening excluded by
mutation; full bench in `09ce4b60c`. TODO: L2's forward-`extends` refusal belongs in
`scriptValidator.ts`'s forward-reference pass, same classifier set.
**Prompt document name**: 2026-09-17 10:24

## 2026-09-17 — fix: the JjScript error dialog shows the executor's own error (corsia B)
**Prompt**: `claude_2026-09-16_2327_prompt_jjscript_forward_refs_and_structured_errors.md`, phase 2
lane B, with Alfonso's answers 3, 4 and 5 to §10 of the report (all four result-shaped sites,
`handleStep` read and converted if result-shaped, the function in `errors.ts` confirmed) plus one
addition made at the lane A hand-off: the dialog must number its line the way the validator refusal
and the outcome strip do.
**Files touched**: `fad85bae5`, 5 files: `jjscript/executor/errors.ts` (`errorFromResult`,
`KNOWN_ERROR_CODES`, the `scriptLine` field on `ExecutionErrorInfo`),
`jjscript/components/ScriptBlock.tsx` (five sites, the `errors` field on `ScriptLineResult`, the
line numbers), `jjscript/components/ExecutionErrorDialog.tsx` (the title line only),
`components/Jodie/ChatMessages.tsx` (`errors` passed through, the one place it was dropped),
`jjscript/__tests__/errorFromResult.test.ts` (new, 9 tests). This entry in its own commit.
**Outcome**: ✅ completed
**Corregge**: 2026-09-14 17:30
**Causa**: (c)
**Regressions**: no. `npm run typecheck` exit 2, **33** on full output, the declared baseline,
control `Measurable` → 6; the one hit in a touched file is the pre-existing `ChatMessages.tsx` entry
of the §17 baseline, 170 lines above the edit. `npx vitest run` **3727 passed, 0 failed**, the same
9 files red at import. `npm run build` exit 0, pre-existing chunk-size warning only.
**Out-of-scope changes**: yes, two, both declared. `ExecutionErrorDialog.tsx` was allowed only if
the suggestion was not rendered (it was), and one line of it changed for the title's line number.
`handleStep:674` is a fifth site, converted on Alfonso's answer 4: it was result-shaped but not even
on `parseError`, it passed the raw string, so the dialog showed no suggestion at all there.
**Layer Impact Report**: not-required — no §3.1 file, no D-layer or L-layer write path.
**Smoke visivo**: passato — Alfonso on localhost:3001: the executor's sentence and its suggestion are
shown, the dialog title sits on the editor line, Skip Line resumes correctly, and the summary reports
the editor line for the error.
**Notes**: `scriptLine` is a new optional field, not a renumbering: `lineNumber` still indexes the command list for Skip, the enum recovery and `skippedLinesSet` (`:1016`). Residual: the summary's skipped line and the `EXECUTION_PAUSED` detail stay on that index, so they match the editor line only when no comment or blank line precedes the failing command. Thrown paths `:459`, `:725`, `:872`, `:1004` keep `parseError`: an exception carries no `errors`. The two open defects of lane A stand, report §6.
**Prompt document name**: 2026-09-16 23:27

## 2026-09-17 — fix: JjScript refuses a forward reference before command 1 (corsia A)
**Prompt**: `claude_2026-09-16_2327_prompt_jjscript_forward_refs_and_structured_errors.md`, phase 1
(read-only discovery with report, hard stop) then phase 2 lane A. Run with Alfonso's five answers to
§10 of the report: option (b) corrected to the names of EVERY metamodel of the project, the three
hard-failure roles only, the §5 exclusions each with a test, the mutation bench plus a
target-only-names mutant, and a `console.warn` on stand-down added after the visual check.
**Files touched**: `2b357af17`, 3 files: `jjscript/executor/scriptValidator.ts` (second pass,
`collectClassifierNames`, the `kind` discriminant, header rewritten around the real soundness rule),
`jjscript/__tests__/scriptValidator.test.ts` (+20 tests, 28 total),
`jjscript/components/ScriptBlock.tsx` (the name set at the call site, the refusal wording, one new
`ScriptOutcome` kind). Report `6ae3e15eb`. This entry in its own commit.
**Outcome**: ✅ completed (lane A; lane B is the next commit of the same prompt)
**Corregge**: —
**Causa**: —
**Regressions**: no. `npm run typecheck` exit 2, **33** on full output, the declared baseline, **0**
in the three touched files. `npx vitest run` **3691 passed, 0 failed** (3671 before, +20 new), the
same 9 files red at import. `npm run build` exit 0, pre-existing chunk-size warning only.
**Out-of-scope changes**: yes, declared under rule 1b. The prompt scoped `ScriptBlock.tsx` to the
integrity refusal block; the text the user reads is the outcome strip at `:1478`, which said
`Syntax error at line N`. One `ScriptOutcome` kind (`'refused'`) and one branch of that ternary were
added so a forward reference is not called a syntax error. Nothing else in the file changed.
**Layer Impact Report**: not-required — no §3.1 file. `projectClassifierNames()` reads L proxies and
writes nothing.
**Smoke visivo**: passato — Alfonso ran the Pipeline script on a clean metamodel at localhost:3001:
zero commands executed and the two-line refusal naming lines 17 and 19.
**Notes**: Two open defects measured and left untouched, both in the report §6: `create class|enum|package` has no duplicate check (`create.ts:439,1023,1059`), and `create class A extends B` with a missing `B` drops the inheritance silently (`create.ts:452-467`). The first is why the pass needs the name set at all. Bench: 9 mutants, 9 killed, one named test each; the harness reports a mutant that fails to apply instead of scoring it green.
**Prompt document name**: 2026-09-16 23:27

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

## 2026-09-16 — discovery: Fase 2 preconditions, the reference row does not exist
**Prompt**: `claude_2026-09-16_1115_prompt_rotta_archi_righe_decisioni.md`, **Fase 2** — the two
preconditions before any code: whether a plain reference row dispatches `CHILD_CONTEXT_MENU`, and
what `newDefault` writes as `appliableTo` for the `DReference` and `DAttribute` branches. One fails,
so **no code was written** and the host decision goes back to Alfonso.
**Files touched**: `dbfeb67ac`: `docs/discovery/discovery_2026-09-16_precondizioni_fase2_archi_righe.md`
(new). No file under `frontend/src` touched. This entry in this inbox, in its own commit.
**Outcome**: ⚠️ partial — Fase 2 stopped at its own precondition, as the prompt prescribes.
**Corregge**: —
**Causa**: (c)
**Regressions**: no — read-only phase, nothing modified, no gate run.
**Out-of-scope changes**: no.
**Layer Impact Report**: not-required — nothing modified.
**Smoke visivo**: passato as a measurement — `scripts/smoke/_tmp_refrow_dispatch.ts` (gitignored) on
the live dev server, with the attribute row as the positive control: the attribute row dispatches
`{childKind:'attr'}` and opens «Delete Attribute»; the cross-metamodel ghost chip dispatches
`{childKind:'ref'}` and opens «Delete reference»; a same-metamodel reference (`next: State→State`)
is **not a row at all** — it is the single canvas edge, and right-clicking it dispatches **zero**
`CHILD_CONTEXT_MENU`, opening the edge menu instead.
**Notes**: P2 passes: `newDefault` derives the field from the seed kind via `appliableToForIRKind` (`view.tsx:181-188`, applied `:514-517`) — edge → `'Edge'`, row → `'Field'`. P1 fails: `ClassNode` renders references only as cross-metamodel ghost chips (`:542`, `:608-612`), so a `ref` entry would be invisible for ordinary same-metamodel references. Recorded, not proposed: the edge menu (`EditorV2.tsx:3357-3374`) holds the DReference id as `edge.data.reference.id`.
**Prompt document name**: 2026-09-16 11:15

## 2026-09-16 — feat: «Create edge view» and «Create row view» from the v2 canvas menus
**Prompt**: `claude_2026-09-16_1238_prompt_voci_arco_riga.md` — after the host retake: the edge entry
on the reference EDGE menu (the child menu's `ref` branch is fed by the cross-metamodel ghost chip
alone), the row entry in the `attr` branch, and the two missing branches of `createViewInWorkbench`,
mirroring `newDefault` and inventing nothing.
**Files touched**: `f554aa5fb`: `utils/lastViewpoint.ts` (the `DReference` and `DAttribute` branches
of the switch, +52) and `components/editor-v2/EditorV2.tsx` (the two entries, +33). This entry in
this inbox, in its own commit.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. `npm run typecheck` exit 2, **33** on full output, set identical to the pre-edit
run (`diff` exit 0), **0** in `lastViewpoint.ts`, and the single `EditorV2.tsx` hit is the
pre-existing `:2886` of the §17 baseline; control `Measurable` → 6. `npm run build` exit 0.
`npx vitest run`: **3645 passed, 3 failed** — the three reds are in
`viewpoint/ir/__tests__/symbolRecognition.test.ts`, which imports only `irTypes`,
`notationCatalog` and `symbolRecognition` (zero references to either file of this slice), and whose
subjects `notationCatalog.ts` and `irTypes.ts` are dirty in the tree from the Symbol Editor lane.
Not touched, not fixed: another lane's work in progress. The 9 pre-existing import failures are
unchanged.
**Out-of-scope changes**: no.
**Layer Impact Report**: not-required — no §3.1 file; `new2` is called bare, no outer TRANSACTION.
**Smoke visivo**: passato — `scripts/smoke/_tmp_edgerow_verify.ts` (gitignored), **15 PASS 0 FAIL**.
Criteria 1-2: the edge view is `ir.kind 'edge'`, `appliableTo 'Edge'`, `metaclasses ["State"]` (the
owner, with the pin) and the row view is `ir.kind 'row'`, `appliableTo 'Field'`, no metaclass, both
in the active viewpoint. Criterion 4: with none active both entries read `… — no viewpoint
available`, are disabled, and create nothing. Criterion 5: the `ir` travels in the CREATE payload
with no later `ir` write, against a control that fails when the `ir` is written afterwards.
Criterion 3, the strong one: **zero** keys differ from `DViewElement.newDefault(<that D element>)`,
compared over the whole D object with generated identities masked.
**Notes**: Two things the strong check forced. `appliableToForIRKind` is module-private in `view.tsx` (out of scope), so `'Edge'` and `'Field'` are literals with a comment naming the helper. And `newDefault` blanks `css` and `palette`, which the constructor seeds with a placeholder: without mirroring that the two creators differed on exactly those fields. The blanking is scoped to the two new branches. Declared limit: no row entry in `er` and `compact` notations, where the rows are not rendered.
**Prompt document name**: 2026-09-16 12:38

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
## 2026-09-16 — feat(ir): the border becomes conditional per axis (slice 2)
**Prompt**: `claude_2026-09-16_1603_prompt_slice2_border_per_asse.md` on `docs/handoff/02-coder-spec.md`
slice 2, plus the two decisions of the day: three Fixed/Conditional switches all visible (not one
switch on the border, which is the shape D1 rejected), and the Border section spanning both columns
of the anatomy grid instead of a wider modal.
**Files touched**: `3e4f7536f`, 10 files. IR: `ir/irTypes.ts` (`ShapeSpec.border` per axis;
`CompiledView.border` → `borderColor`/`borderWidth`/`borderStyle`), `ir/irCompile.ts` (three
`compileConditional`, the same three lines `compileEdgeView` runs for `line`),
`ir/IRNodeContent.tsx` (each axis resolved per instance; inline box, SVG stroke, dash, `double`
overdraw and marker colour all read the resolved values), `ir/symbolRecognition.ts` (the two axes
through `scalarOf`). Authoring: `authoring/VertexAuthoringPanel.tsx` (three `ConditionalEditor`
axes, `patchBorderAxis` replacing `patchBorder`, the OVERRIDES table and its `borderOverrideRows`
grouping), `authoring/SymbolEditorModal.tsx` (`currentAxesPreset` scalar-or-omitted),
`authoring/SymbolCard.tsx` (scalar-or-default colour), `authoring/SymbolEditorModal.scss` (the span
rule). Tests: `ir/__tests__/ir.test.ts`, `ir/__tests__/symbolRecognition.test.ts`. This entry in
this inbox, in its own commit.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — verified on screen by Alfonso (ACK 2026-09-16), all five points holding: a view
saved with a scalar border draws exactly as before; the Border section shows the three switches
(Color, Width · px, Style) and spans the full width, with the other sections re-pairing and no hole;
the modal is not wider than before; Width set to Conditional draws per instance on the canvas and the
title falls back to «Custom symbol»; the ER «Weak entity» stays recognized by name. Gates:
`npm run typecheck` exit 2, **33** on full output, set identical to the pre-edit run (`diff` exit 0),
**0** in the touched files, control `Measurable` → 6. `npx vitest run` **3653 passed, 0 failed**
(3648 before, plus the 5 new), the 9 pre-existing import failures unchanged. `npm run build` exit 0.
**Out-of-scope changes**: yes — 10 files, over regola 19's threshold, declared before the diff and
proceeded with under **RC-11**. Each is named by the spec for this slice; the two test files carry
the new cases and no others. `notationCatalog.ts` was NOT touched: `applyPresetToShape` already
writes scalars and still type-checks against the widened axes (`keepRules` is slice 4).
**Layer Impact Report**: produced — in chat before the diff, as §3.2 and P5 require for
`viewpoint/ir` and `viewpoint/authoring`. No D-layer, no L-layer, no sync, no persistence: the
schema change is additive, a scalar border reads back identical, so no `irVersion` bump and no
VersionFixer.
**Smoke visivo**: passato — eseguito da Alfonso il 2026-09-16 (ACK visivo), tutti e cinque i punti
reggono, nell'ordine in cui erano stati chiesti: (1) open a view saved with a
scalar border and check it draws exactly as before; (2) the Border section in the Symbol modal shows
three switches — Color, Width · px, Style — and spans the full width, with the other sections
re-pairing (Shape beside Fill, Padding beside Marker) and no hole; (3) the modal is not wider than
before; (4) set Width to Conditional with one rule and check the canvas draws it per instance and
the modal title falls back to «Custom symbol»; (5) an ER «Weak entity» view is still recognized by
name in the title.
**Notes**: Bench rimisurato, dettaglio in `7801d7a58`. Strada presa sui due test: **riscritti, non cancellati**. Togliere la sentinella `scalarOf` li lascia verdi (14/14): attraverso l'output di `recognizeSymbol` è indistinguibile dal confronto crudo, e nessun test può ucciderla. Ma leggere il `default` è ucciso da quei due e da nessun altro, su entrambe le forme: sono l'unico presidio sul titolo che mente. TODO: `borderOverrideRows` non ha test ed è lei a decidere una riga sola o una per asse.
**Prompt document name**: 2026-09-16 16:03

## 2026-09-16 — docs: a test is judged by the mutations it kills (§5, terza regola)
**Prompt**: prompt di chat, corsia Symbol Editor, fetta di soli docs — aggiungere a `CLAUDE.md`,
accanto alle due regole di processo del 2026-09-15, la terza imparata oggi sul banco di
`symbolRecognition`; rigenerare `AGENTS.md` (§17, in perimetro per la regola 1c) e lanciare
`check:agents` e `check:docs`.
**Files touched**: `43e598404`: `CLAUDE.md` (+8, nuova sub-rule di §5 subito dopo quella del
2026-09-15 sui test che asseriscono sul testo sorgente — è lì che è di casa, mentre l'altra regola
di ieri, la 1c, sta nel blocco NON-NEGOTIABLE) e `AGENTS.md` (+8, proiezione rigenerata con
`npm run gen:agents`, mai scritta a mano). `frontend/src/jjtl/AGENTS.md` è stato riscritto identico
dal generatore e resta fuori dallo stage. Questa entry in questo inbox, in commit separato.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `npm run check:agents` PASS (2 file proiettati, `AGENTS.md` e
`frontend/src/jjtl/AGENTS.md` entrambi allineati) e `npm run check:docs` PASS 3/3 con 3 warning
pre-esistenti. Misurati **anche prima dell'edit**, come controllo: erano già verdi, quindi il verde
dopo non è un caso fortunato. Nessun file di prodotto toccato, nessun gate di build o test in gioco.
**Out-of-scope changes**: no — `AGENTS.md` è dentro il perimetro per la regola 1c, che il prompt cita
esplicitamente.
**Layer Impact Report**: not-required — sola documentazione, nessun file §3.1.
**Smoke visivo**: non applicabile.
**Notes**: Nasce su `validation-skeleton` mentre CLAUDE.md diverge fra i rami: **assente su `master`**, 2/101 su `alfonso-frontend-jjtl` e `simulation-engine`, che non hanno né questa sub-rule né quella di ieri (controllo positivo: `NON-NEGOTIABLE` → 3, `TRANSACTION` → 16, quindi gli zeri sono assenze vere). Nessuna convenzione di merge nei docs — §6.5 copre i cherry-pick di codice, non le regole: chi fonde porti sul tronco `43e598404` e `74d0f81db`.
**Prompt document name**: 2026-09-16 (prompt di chat, nessun documento)

## 2026-09-16 — docs: una sola casa per CLAUDE.md, e la coda di trasporto (§6.6)
**Prompt**: `claude_2026-09-16_2301_prompt_casa_delle_regole.md` — scrivere la quarta regola di
processo: dove vivono le regole e in quale ramo valgono. Rigenerare `AGENTS.md` (§17, in perimetro
per la 1c) e **registrare** la coda di trasporto verso il tronco senza eseguirla.
**Files touched**: `e786d9d8a`: `CLAUDE.md` (+23, nuova **§6.6** subito dopo §6.5, che ne ha la
meccanica — sottosezione e non sezione nuova, come la convenzione del file vuole) e `AGENTS.md`
(+23, proiezione rigenerata con `gen:agents`, mai scritta a mano). `frontend/src/jjtl/AGENTS.md`
riscritto identico dal generatore e lasciato fuori dallo stage. Questa entry in commit separato.
Nota RC-13: al momento del commit un'altra corsia aveva **5 file suoi già in stage** (Jodie,
jjscript); il commit per pathspec li ha esclusi, verificato con `git show --stat`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `npm run check:agents` PASS (2 file proiettati, entrambi allineati) e
`npm run check:docs` PASS 3/3 con i 3 warning pre-esistenti, misurati **prima** dell'edit oltre che
dopo, come il prompt chiede. Nessun file di prodotto toccato, nessun ramo diverso da
`validation-skeleton`. L'assenza delle regole sul tronco è misurata due volte e in due modi
indipendenti: per ancestry (controllo positivo passato — `6e9a31fe7` È antenato di
`origin/alfonso-frontend-jjtl`) e per contenuto (i 4 marcatori a 0 con controlli positivi che hanno
segnale, `NON-NEGOTIABLE` → 3 e `TRANSACTION` → 16). **Correzione del 2026-09-16, misurata**: la
riga che qui diceva «anche `staging` non ha CLAUDE.md» era falsa, ed era un errore di metodo mio e
non una misura. `staging` (`cb699ad58`) **ha** CLAUDE.md, 1035 righe, la stessa copia del tronco con
gli stessi quattro marcatori a 0; il ramo **senza** è solo `master`. L'errore: `git cat-file -e
cb699ad58:CLAUDE.md` falliva perché il commit non era nel database locale (`fatal: Not a valid object
name`), e quel fallimento è indistinguibile dall'assenza del file — esattamente il silenzio che §5
descrive, su cui non avevo messo il controllo positivo. Rimisurato dopo aver scaricato l'oggetto, con
controllo positivo su ogni soggetto (`frontend/package.json` leggibile sia su `staging` sia su
`master`, e `master` resta senza CLAUDE.md).
**Out-of-scope changes**: no — `AGENTS.md` è in perimetro per la regola 1c, che il prompt cita.
**Layer Impact Report**: not-required — sola documentazione, nessun file §3.1.
**Smoke visivo**: non applicabile.
**Notes**: Coda al tronco, in ordine: `686a13712` (F, §6.5), `74d0f81db` (H, 1c + sub-rule §5), `43e598404` (oggi). Oggi cita ieri e ieri cita F: portare solo l'ultimo metterebbe sul tronco una citazione che punta al nulla. NON trasportata qui, per istruzione del prompt. Ma la sua premessa è scaduta: il tag `3.0.0` **esiste** (`cb699ad58`) e la PR #144 è **MERGED** dal 2026-09-15, quindi la condizione «dopo il tag» è già soddisfatta e il GO resta di Alfonso. `master` senza CLAUDE.md: domanda aperta.
**Prompt document name**: 2026-09-16 23:01

## 2026-09-16 — fix: Jjodie stamps the level of the editor on screen, not of the last selection
**Prompt**: `claude_2026-09-16_2249_prompt_fix_jjodie_scope_level_m1_on_metamodel.md` — step 1 a
read-only verification with a mandatory report, step 2 the fix. Run with the three conditions of
Alfonso's ACK: no em dashes in the added comments and strings, a stale-cache investigation with the
softening it implies, and a separate advice string for a scope-bound run.
**Files touched**: `ccd867bda`, 5 files: `jjscript/executor/activeArtifact.ts` (new, pure: the cache
rule), `jjscript/executor/__tests__/activeArtifact.test.ts` (new, 18 assertions),
`jjscript/executor/utils.ts` (the three resolvers share the rule), `components/Jodie/Jodie.tsx`
(level first, then one resolver), `jjscript/executor/commands/create.ts` (the WRONG_LEVEL message).
Docs in their own commits: `73bf25fc6` the report, and this entry.
**Outcome**: ✅ completed
**Corregge**: 2026-09-14 17:30
**Causa**: (c)
**Regressions**: unknown — `npm run typecheck` exit 2, **33** on full output, set identical to the
pre-edit run (`diff` exit 0), **0** in the five touched files, control `Measurable` → 6.
`npx vitest run` **3671 passed, 0 failed**, the same 9 files red at import. `npm run build` exit 0,
pre-existing chunk-size warning only. `unknown` and not `no` because nothing was exercised in the
running app: see **Smoke visivo**.
**Out-of-scope changes**: no.
**Layer Impact Report**: not-required — no §3.1 file, no D-layer or L-layer write path.
**Smoke visivo**: non eseguito — the prompt's hard stop asked for a check on localhost:3001 (select
in an M1 model, switch to the metamodel tab, ask for an enum, Run). The dev server was not running
and the ACK authorised the commit without it. The behaviour is covered by the unit bench below, not
by the app.
**Notes**: Three things the prompt did not anticipate, all measured in `docs/discovery/discovery_2026-09-16_jjodie_scope_level_m1_on_metamodel.md`: `editorType` has six values not two (§5), `errors[0].message` cannot reach `ExecutionErrorDialog` (§7), and nothing ever clears the cache (§11). Bench in §12: 3 mutants, 4/4/1 red. `JodieHeader.tsx:70` still disagrees (§6); read-only per the prompt.
**Prompt document name**: 2026-09-16 22:49

## 2026-09-16 — fix: the v2 Create View entry resolves its viewpoint once, never the system default
**Prompt**: `claude_2026-09-16_0951_prompt_menu_v2_viewpoint_e_rotta_archi_righe.md`, **Fase A** —
gate the v2 canvas entry on `hasCreatableViewpoint()` (the tree's own predicate) and pass the
resolved viewpoint id as the fourth argument of `createViewInWorkbench`, so the label and the
destination come from ONE resolution and the entry can no longer file a view inside
`Pointer_ViewPointDefault`. Hard stop after this commit: **Fase B not started**.
**Files touched**: `86f822d50`: `components/editor-v2/EditorV2.tsx` only (the import, and the
`Create View` entry at `:3244-3275`). This entry in its own commit.
**Outcome**: ✅ completed (Fase A; Fase B is a separate, not-yet-started phase)
**Corregge**: —
**Causa**: —
**Regressions**: no. `npm run typecheck` exit 2, **33** on full output, set identical to the pre-edit
run (`diff` exit 0); the single `EditorV2.tsx` error is the pre-existing `:2886` of the §17 baseline,
not a new one; control `Measurable` → 6. `npx vitest run` **3643 passed, 0 failed**, the same 9 files
red at import. `npm run build` exit 0, pre-existing warnings only.
**Out-of-scope changes**: no.
**Layer Impact Report**: not-required — `EditorV2.tsx` is not a §3.1 file and the change touches one
menu entry, no D/L write path.
**Smoke visivo**: passato — `scripts/smoke/_tmp_v2menu_verify.ts` (gitignored), **10 PASS 0 FAIL**:
with no viewpoint active the entry reads `Create View — no viewpoint available`, is disabled, and a
click creates nothing; with «Menu VP» active it reads `Create View in "Menu VP"` and creates exactly
one view whose `father` is that viewpoint; no view is ever filed in `Pointer_ViewPointDefault`; and
the created view is field-by-field identical (`ir`, `appliableTo`, `appliableToClasses`,
`oclCondition`, jsx) to the one the `+` dialog makes for the same class.
**Notes**: Born from the Errata of the 00:55 prompt, but not a correction of its result: the double resolution predates it, in another file. Residual and declared, chain out of scope: with the gate true, `resolveParentViewpoint` could still reach priority 3 if the active viewpoint's D object were unreadable — pathological, left as is. Probe note for whoever writes the next one: the v2 menu is dismissed by its own `.context-menu-backdrop`, not by Escape, which leaves it open and intercepting.
**Prompt document name**: 2026-09-16 09:51

## 2026-09-16 — fix: the Symbol Editor modal portaled onto body, above the Properties rail
**Prompt**: chat prompt, not a repo document: phase 2, option A of the phase 1 report — bring
`SymbolEditorModal` into line with D-UI-14 the way `ValidationRulesModal` already is (`a5ed5406d`),
local portal + `--z-alert`, landed before slice 2 starts writing since it lists the same file. Scope
that one modal: `ValidationResultsModal` and `ImportSummaryModal` untouched (unmeasured), z tokens
untouched. Plus three things, each its own commit: a ticket for those two modals, a ticket for
`--z-modal` = 1050, and the `check:docs` trim of another lane's Notes.
**Files touched**: `bc42b259c`, 2 files: `viewpoint/authoring/SymbolEditorModal.tsx` (`createPortal`
import, `return createPortal((…), document.body)`, the reason in a doc comment),
`SymbolEditorModal.scss` (backdrop `z-index: var(--z-alert, 10000)`, header comment corrected — it
claimed «no portal»). Alongside: `37151aee4` (report §13 + the probe turned onto the corrected state),
`56f803a8a` and `cf3566fc1` (the two TECH-DEBT tickets), `f475fc1cb` (the Notes trim). This entry in
its own commit.
**Outcome**: ✅ completed
**Corregge**: 2026-09-16 09:05
**Causa**: (c)
**Regressions**: no. `npm run typecheck` exit 2, **33** on full output, the declared baseline, **0**
in the two touched files, control `Measurable` → 6. `npm run build` exit 0, only the pre-existing
chunk-size warning. No vitest suite covers this modal. `npm run check:docs` **3/3** after the trim.
**Out-of-scope changes**: no.
**Layer Impact Report**: not-required — no §3.1 file, no D-layer write.
**Smoke visivo**: passato — same probe as phase 1, assertions inverted onto the corrected state:
**25 PASS 0 FAIL**, zero page errors, screenshot read by eye. At 1600 with the rail open: 50 controls
visible, **50 reachable, 0 blocked** (was 44/6), the × takes the click and closes, Escape closes,
no width from 1280 to 2400 blocks anything (was 1280–1780). Controls that make it mean something: the
boxes STILL overlap by 120px, so it is not a layout change; the rail is still mounted, open and 400px;
and E4 — the backdrop moved back inside `#root` at runtime — makes the rail win again, then restoring
it onto body makes the modal win. Body scale unchanged elsewhere: `#root` auto, rail 900, sim-panel
850, backdrop 10000.
**Notes**: Modality became real as a side effect: the `inset: 0` backdrop now covers the rail too, so a click there no longer edits the model behind an `aria-modal` dialog — §5.2 of the report measured that as a defect. E3 survives the fix and is why it could not be a bigger number: 999999 inside `#root` still never reaches the top. Causa (c): the modal was written on the ImportSummaryModal pattern six days before D-UI-14 ratified the rule, and nobody went back.
**Prompt document name**: 2026-09-16 09:40

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

