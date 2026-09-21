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

## 2026-09-19 — feat: two metaclasses of different metamodels are different metaclasses (P-2026-09-19-1610)
**Prompt**: `P-2026-09-19-1610`, metaclass identity across metamodels. A view lists `metamodel_1.State` and `metamodel_2.State` together or one of them, and the resolver honours the choice. `authoringMetaclassPins` admits `string | string[]` per name (additive, no `irVersion` bump), the picker excludes by id, the list shows one row per identity. Two-phase: discovery report, GO with five answers (pure module in DOVE, homonymous metamodels left as is, series R-MCID, `[]` in `pinAccepts` as written, log at the top), four steps with a visual stop after step 2.
**Files touched**: discovery `941a94da9` (`docs/discovery/discovery_2026-09-19_metaclass_identity_homonyms.md`). Step 1 `f98e67cb5`, 5 files: `ir/irTypes.ts`, `ir/irResolveCore.ts` (`pinAccepts`), `ir/metaclassPin.ts`, `ir/__tests__/metaclassPin.test.ts`, `ir/__tests__/ir.test.ts`. Step 2 `70ac9055f`, 5 files: `authoring/metaclassEntries.ts` (new, pure), `authoring/__tests__/metaclassEntries.test.ts` (new), `authoring/MatchingSection.tsx` (re-exports the pure module), `authoring/EdgeAuthoringPanel.tsx`, `authoring/RowAuthoringPanel.tsx`. Step 3 `366300c03`: `ir/__tests__/ir.test.ts` (resolver-level, `homonymWorld()`). Step 4: `docs/decisions.md` (`603546085`, R-MCID-1, R-MCID-2); this entry in its own commit.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. `npm run typecheck` exit 2, **33** on full output, the declared baseline, **0** in the touched files; control `Measurable` → 6. `npx vitest run` from `frontend/`: **3900 passed, 0 failed**, the same 9 files red at import as before. `npm run build` exit 0 after step 2 (step 3 is test-only). Mutation bench: 15 mutants of `metaclassEntries.ts`, 8 of the pin resolution and 4 of `pinAccepts` at resolver level, each killed by a named test; the one survivor (`samePin` order-insensitive) is unreachable through `withMetaclassPins` and is declared intent (commit message of `f98e67cb5`).
**Out-of-scope changes**: no.
**Layer Impact Report**: not-required — `viewpoint/authoring/` and `viewpoint/ir/` are §3.1 rows, but no §3.2 file (`useJjomSync`, `syncState`, `canvasToJjom`, `portDistribution`, `useM1ReferenceEdges`, `VersionFixer`) and no D-layer creator was touched; `pinAccepts` only reads the ir.
**Smoke visivo**: passato — Alfonso on localhost:3000, ACK of 2026-09-19 ("Verifica visiva OK") on the step-2 checklist: two metamodels each with `State`, add both, remove one, ir shows the array then the plain string. Which of the five listed items were exercised is not itemized in the ACK.
**Notes**: Tickets. (1) Same-named metamodels: metaclassChoices labels by mm.name, so two metamodels called alike merge into one picker group and read identically (the USER_185 case, discovery 2026-07-23); fix = optional metamodelId on MetaclassChoice; left as is by decision. (2) UI: a legacy view listing an unpinned name cannot be narrowed to one class except by remove + re-add, since the picker hides the homonyms of an unpinned name. Log is now 42 entries, Check D red until the next rotation.
**Prompt document name**: 2026-09-19 16:10

## 2026-09-18 — docs: trasporto normativo, passo 2 di P-2026-09-18-2110
**Prompt**: passo 2 di P-2026-09-18-2110 (emenda P-2026-09-18-1930): portare sul tronco tre dei
quattro delta normativi misurati a `fbcbcb820` contro questo tronco (`7bc6c7365`) — §9.3 di
CLAUDE.md, le due righe `P1..P9`→`P1..P12`, il trailer `Model:` di PROTOCOL.md P6 con la versione
1.1→1.2. La frase di rotazione di P9 (`npm run log:rotate`) non viaggia: lo script non esiste su
questo tronco (RC-10).
**Files touched**: `CLAUDE.md`, `docs/PROTOCOL.md`, `AGENTS.md` (rigenerato, regola 1c).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — solo CLAUDE.md/PROTOCOL.md e la loro proiezione, nessun sorgente toccato.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Conteggi: CLAUDE.md 63444 char (era 60208, +3236, atteso ~3200), PROTOCOL.md 14258
char. Tre gate, tutti exit 0: `gen:agents` (2 scritti, 0 skippati), `check:agents` PASS (2/2
allineati), `check:docs` PASS (3/3, 2 warning preesistenti non correlati, `Corregge` del
2026-09-02). Worktree gia' su `alfonso-frontend-jjtl`: la premessa "prunable" del prompt era
superata, non ricreato. Commit `32dbe1ef8`.
**Prompt document name**: 2026-09-18 21:10

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

## 2026-09-18 — feat(views): editor reference in una sezione + drill-in nel rail canvas (#142)
**Prompt**: Fase B della #142 (Views/canvas). La discovery ha smentito l'ipotesi critical-zone: il rail è il pannello classico `Info.tsx`, e `useM1ReferenceEdges` rende già l'edge per uno slot-write. Scelto B1 (drill-in), poi pivot a «opzione Y» (una sola sezione reference) su feedback utente («learners due volte», «× non funziona»).
**Files touched**: `frontend/src/components/editors/Info.tsx`, `frontend/src/components/editors/info-improvements.scss`. Aggiornamento discovery report e questa entry a parte (commit docs separato, §6.4).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `npm run typecheck` output COMPLETO **14** errori pre-esistenti, 0 nei file toccati; `npm run build` exit **0** col solo avviso chunk-size. Smoke confermato dall'utente via screenshot.
**Out-of-scope changes**: no — 2 file, entrambi del rail toccato per B1/opzione Y.
**Layer Impact Report**: produced — in chat prima del diff (rail/view; sync NON toccato: l'edge lo rende `useM1ReferenceEdges` add-only, §3.5).
**Smoke visivo**: passato — canvas rail: sezione unica REFERENCES con select (cambia/aggiungi), drill-in (il rail segue il target con la sua customization), × che fa sparire la riga (filtro buchi). Confermato dall'utente.
**Notes**: Rail = `Info.object` (classico), non `IRForm` (solo Data Manager). Opzione Y: reference non-containment fuori dagli SLOTS, in `Info.references`; scritture via `setValueAtPosition` (no core). «× non funziona» era pre-esistente (clear→buco «-----», `keepempties`); la sezione filtra i buchi. Aperto: create containment dal rail (New Assessment). Referto: discovery_2026-09-18_142_inherited_customization.md §6.
**Prompt document name**: 2026-09-18 18:20

## 2026-09-18 — feat(data-manager): editing inline + crea-e-collega per le reference (#142)
**Prompt**: creare un branch per la #142, poi pianificare e implementare (inherited customization per Views e Data Manager). Scelto perimetro **Fase A** (solo Data Manager); UX drill-in omogenea col containment. La Fase B (canvas) resta separata.
**Files touched**: `frontend/src/components/abstract/tabs/InstanceManagerTab.tsx`, `frontend/src/components/abstract/tabs/instanceManagerTab.scss`. Discovery report e questa entry di log a parte (commit docs separato, §6.4).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `npx vitest run` area toccata (instanceManager*, createAdapter/multiDraw, jjform nav/create) **519/519**; `npm run typecheck` output COMPLETO **14** errori pre-esistenti, 0 nei file toccati; `npm run build` exit **0** col solo avviso chunk-size.
**Out-of-scope changes**: no — 2 soli file, entrambi previsti dal piano (Fase A).
**Layer Impact Report**: not-required — nessun file di §3.1; scrittura via `formWrite.appendValue`/`applyCreate` esistenti, nessun edge di canvas, nessun TRANSACTION attorno ai creator (§3.3/§3.4 fuori portata).
**Smoke visivo**: passato (rendering) — sezione References confermata dall'utente via screenshot: A1 link+cardinalità+gating «Slot full [1/1]», A2 bottone «New … & link». Interazioni drill-in e create-and-link non ri-verificate a runtime in questa sessione.
**Notes**: Estende il drill-in del containment da `shape.children` a `shape.refs`: nuovo `refSlots` (memo su `formSubjectId`), sezione «Referenced elements» (link via `drillTo`/`NavState`) e crea-e-collega `openCreateAndLink`→`openCreate(...,null,null)` + `appendValue(...,isPtr)` post-commit (stato `linkBack`). Customization ereditata da `useIRFormView`. I test del tab hanno colto l'invariante «una sola porta del draft». Referto: discovery_2026-09-18_142_inherited_customization.md.
**Prompt document name**: 2026-09-18 17:35

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

## 2026-09-18 — fix(views): view da albero nasce con IR + modale symbol in primo piano (#139)
**Prompt**: analizzare e risolvere i bug della issue #139 (3 bug UI sulle view); branch dedicato e PR su staging; per il Bug 3 scelto dall'utente di NON toccarlo e commentare l'issue chiedendo ad Alfonso e Tommaso come rivedere la parte grafica.
**Files touched**: `frontend/src/utils/lastViewpoint.ts`, `frontend/src/components/editor-v2/viewpoint/authoring/SymbolEditorModal.tsx`, `frontend/src/components/editor-v2/viewpoint/authoring/SymbolEditorModal.scss`. Questa entry di log a parte (commit separato, §6.4).
**Outcome**: ✅ completed — Bug 1+2 risolti (commit 7b5f4fd3a, PR #151 su staging); Bug 3 deferito per decisione dell'utente ai maintainer via commento issue (#issuecomment-5731734971, @apierantonio @tmaog).
**Corregge**: —
**Causa**: —
**Regressions**: unknown — `npm run typecheck` output completo **14** errori pre-esistenti (baseline file noti), 0 nei file toccati; `npm run build` exit **0** col solo avviso di chunk-size. Nessuno smoke visivo a runtime (app non avviata), quindi il comportamento UI non è stato esercitato a mano.
**Out-of-scope changes**: no — i 3 file mappano sui due bug; il commento SCSS della modale fa parte della stessa modifica (Bug 2), il "no portal" era diventato falso.
**Layer Impact Report**: not-required — nessun file di §3.1. `lastViewpoint.ts` scrive `d.ir` DENTRO la callback di `DViewElement.new2` (nessun TRANSACTION esterno, §3.3), come già fa `createViewInWorkbench`.
**Smoke visivo**: non eseguito — `@playwright/test` non risolvibile in locale, come nei giri #147/#128. Le due fix sono minimali e type-safe ma non provate in app.
**Notes**: Bug 1 = `createBlankViewInViewpoint` semina un vertex IR (`computeCreationSeed`, `metaclasses:'*'` senza classe target), identico a `EnableIRPanel.enable(vertex)` anticipato alla creazione: nessuna nuova semantica di match. Bug 2 = `SymbolEditorModal` ora `createPortal(..., document.body)`: inline in `#root` era intrappolata sotto il rail Properties (anch'esso portato al body, z-index 900) nonostante z-index 9999. Bug 3 (layout rail Properties) deferito: richiede decisione UX su `R-RAIL-*`.
**Prompt document name**: 2026-09-18 16:49

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

## 2026-09-18 — fix(export): oggetti referenziati da altri modelli nell'export JSON M1 (#128)
**Prompt**: risolvere jjodel-modeling/jjodel-frontend#128; usare e tenere aggiornata la documentazione degli export JSON in `docs/`.
**Files touched**: `frontend/src/services/export/JsonModelService.ts`, `frontend/src/services/export/__tests__/JsonModelService.test.ts` (nuovo), `docs/json-export-schema.md`, `docs/discovery/discovery_2026-09-18_json_external_objects.md` (nuovo). Questa entry e la rotazione a parte.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `npm run test -- src/services/export/__tests__` **63/63** (14 nuovi); `npm run typecheck` su output COMPLETO **14** errori pre-esistenti, 0 nei file toccati, exit 2 identico; `npm run build` exit **0** col solo avviso di chunk-size noto.
**Out-of-scope changes**: no — fix, test e documentazione richiesta dal prompt e dal protocollo.
**Layer Impact Report**: not-required — `JsonModelService.ts` e' un servizio di export, nessun file di §3.1, nessuna scrittura D, nessuna TRANSACTION.
**Smoke visivo**: non applicabile — nessun pixel cambia. Il payload scaricato e' coperto dal test Node su Blob (self-contained, tutti i `$ref` risolti). `npm run smoke` non avviato: `@playwright/test` non risolvibile in locale, come nel giro #147.
**Notes**: `buildModelObjects` percorre la chiusura raggiungibile (worklist su Map) dai root; root locali in `objects`, esterni in `externalObjects` (additivo, nessun bump di formatVersion). Containment preservato; cicli/duplicati → `$ref` via serializedObjects. Metaclassi esterne → `externalMetamodels`. Id stale/non-DObject restano `$ref`. Deroga RC-11 nel referto (6 file). Commit 7c4e763bf (codice), d0a51de50 (docs).
**Prompt document name**: 2026-09-18 12:50

## 2026-09-18 — fix(ai): ripresa autorizzata della PR per #147
**Prompt**: "chiaro procedi pr", dopo il chiarimento sul fallback del modello Custom.
**Files touched**: `docs/discovery/discovery_2026-09-18_custom_provider_model.md`, `docs/claude-code-log.md`, `docs/claude-code-log-archive.md`; commit dei due file di codice gia' verificati nel giro precedente.
**Outcome**: ✅ completed — commit codice c6e735b01; consegna su branch fix/147-custom-provider-model verso staging.
**Corregge**: —
**Causa**: —
**Regressions**: no — codice invariato dal giro precedente: 7 test verdi, build riuscita, 14 errori TypeScript preesistenti e output identico.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: fallito nell'avvio nel giro precedente — @playwright/test mancante; nessuna verifica visiva dichiarata.
**Notes**: Autorizzazione ricevuta alla ripresa. Nessuna nuova modifica di codice; documentazione separata dal commit funzionale. La rotazione sposta un'altra entry verbatim mantenendo 40 entry attive. Limiti di verifica riportati nella PR.
**Prompt document name**: 2026-09-18 12:03

## 2026-09-18 — fix(ai): Custom provider uses its configured model (#147)
**Prompt**: risolvere jjodel-modeling/jjodel-frontend#147 su branch dedicato e creare PR verso staging.
**Files touched**: `frontend/src/services/AIProviderService.ts`, `frontend/src/services/__tests__/AIProviderService.test.ts`, `docs/discovery/discovery_2026-09-18_custom_provider_model.md`, `docs/claude-code-log.md`, `docs/claude-code-log-archive.md`.
**Outcome**: ⚠️ partial — fix verificato nel working tree; richiesta di autorizzazione a git add/commit rifiutata, nessun push o PR.
**Corregge**: —
**Causa**: (g)
**Regressions**: no — 7 test verdi (3 rossi prima del fix); typecheck 14 errori prima/dopo, output completo identico; build exit 0.
**Out-of-scope changes**: no — fix, test e documentazione richiesta dal protocollo; archiviate verbatim le tre entry piu' vecchie per mantenere 40 entry.
**Layer Impact Report**: not-required
**Smoke visivo**: fallito nell'avvio — manca @playwright/test nell'installazione locale; nessun esito visivo misurato.
**Notes**: Branch fix/147-custom-provider-model da staging cb699ad58. Quattro righe risolvono il placeholder custom contro config.model. Override reali preservati. Test su API pubblica e payload HTTP, senza chiamate reali a OpenRouter. Dettagli nel referto; modifiche non committate a seguito del rifiuto dell'autorizzazione.
**Prompt document name**: 2026-09-18 11:55

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

## 2026-09-16 — docs: trasporto di quattro regole normative da validation-skeleton
**Prompt**: prompt di chat alla corsia del worktree del tronco, non un documento in repo: ora che
la 3.0 e' uscita (tag `3.0.0` su `cb699ad58`, verificato su `origin` con `git ls-remote --tags`),
portare qui le quattro regole nate su `validation-skeleton`, nell'ordine obbligato in cui ognuna
cita la precedente. Tre condizioni: mettere a verbale il commit locale non pushato prima di
toccare altro, non pushare in nessun caso, fermarsi al primo conflitto e rigenerare AGENTS.md con
`gen:agents` invece di risolverlo a mano (1c).
**Files touched**: quattro `git cherry-pick -x`, ciascuno con il proprio `CLAUDE.md` + `AGENTS.md`
gia' dentro: `8f6122427` (da `686a13712`, §6.5 worktree e cherry-pick), `cccabe385` (da
`74d0f81db`, test statici e file rigenerati in scope), `4db186124` (da `43e598404`, un test si
giudica dalle mutazioni che uccide), `00b32f5e7` (da `e786d9d8a`, §6.6 la casa delle regole).
Nessun file sorgente. Questa voce in un commit di soli docs.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — nessun sorgente toccato, solo `CLAUDE.md` e le sue proiezioni.
`npm run check:agents` **PASS**, 2 file proiettati rigenerati in temp e allineati (`AGENTS.md`,
`frontend/src/jjtl/AGENTS.md`). `npm run check:docs` **3/3**. I gate girati in questo clone
attraverso un symlink temporaneo a `~/jjodel/frontend/node_modules` (§6.5), rimosso a fine
sequenza; `git status` vuoto prima e dopo.
**Out-of-scope changes**: no.
**Layer Impact Report**: not-required — nessun file §3.1, nessun diff di codice.
**Smoke visivo**: non applicabile — trasporto di sole regole, nessuna superficie.
**Notes**: A verbale come chiesto, il commit locale non pushato preesistente: `96acb6ae9`, Alfonso Pierantonio, 2026-09-15, «docs: log-inbox entry for the 3.0.0 release lane», solo `docs/log-inbox/release-3-0.md`. **Non pushato nulla**: il ramo resta ahead=5, cosa sale lo decide Alfonso. Verifica per contenuto prima di toccare: 0/22, 0/8, 0/4, 0/19 righe gia' presenti, controllo positivo `c744b7660` 1/1 PRESENTE. Nessun conflitto, `gen:agents` non e' servito.
**Prompt document name**: 2026-09-16 23:30

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
