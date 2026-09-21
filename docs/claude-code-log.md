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

## 2026-09-21 — chore: simulation-engine slice 0 onto the trunk, the archive tag and the pushes, step F (P-2026-09-19-1740)
**Prompt**: `P-2026-09-19-1740` addendum item 2, step F, P14 literal. Of the 38 commits of `simulation-engine` six were not on the trunk (`git cherry`, re-measured 2026-09-21: the same six). Tag `archive/simulation-engine-2026-09-14` on `baf7b2b8a`; the three code commits picked with `-x` one at a time, `merge-tree` before each against the moving HEAD; the three log commits not picked, their entries moved verbatim into `docs/log-inbox/simulation.md`; `~/jjodel-sim` reset to the trunk. Hard stop before the pushes, then Alfonso's GO.
**Files touched**: code `135ab7a24` (from `2f53c876a`), `25cd6149a` (from `c70c9f7b5`), `857cb9335` (from `c09cf4353`); docs `577cc52b5` (`docs/log-inbox/simulation.md`, three entries verified verbatim by substring). This entry in its own commit.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. After the third pick, from `frontend/` through the temporary symlink: vitest **3962 passed, 0 failed** (3935 + 27 from `step.test.ts`, which ran alone as 27 of 27), the same 9 files red at import as the trunk; typecheck **14**, the same set as the trunk. Build not re-run (the picks add no new dependency and the build was measured at the merge).
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Pushed on Alfonso's GO of 2026-09-21: `alfonso-frontend-jjtl` 67290d8f5..577cc52b5 (the trunk was at 1b36576fb before the merge) and the tag. `simulation-engine` does not exist on origin (`ls-remote --heads` empty), so nothing was left alone there: the branch was only ever local. `~/jjodel` holds `4d8a93124` (tracer) on the branch, after the merge, outside this lane.
**Prompt document name**: 2026-09-19 17:40
## 2026-09-21 — merge: visual check and push of the reintegration, steps D and E (P-2026-09-19-1740)
**Prompt**: `P-2026-09-19-1740`, steps D and E. Alfonso's visual check on the merged tree, hard refresh on `localhost:3002` (3000 and 3001 held by other servers): seven items, seven ok (modal above the rail, tree "+" view with IR, native object chrome per R-IRN-29, diamond rounded and ellipse ignoring the radius per R-IRN-35, "Create edge view" and "Create row view", a project saved before `400095370`, homonymous metaclasses distinct per R-MCID-1). Server stopped, symlink removed, trunk pushed.
**Files touched**: this entry only. Merge `4d397ac02`, rotation `491fc1c4b` and the entry of steps A to C `8211a9d8a` are in the entry above.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no. Deviation 1 of the entry above (`irValidate.test.ts` reading the seeded key) accepted by Alfonso on 2026-09-21: the old test embodied D5, R-IRN-35 keeps the seed 8.
**Layer Impact Report**: not-required
**Smoke visivo**: passato — Alfonso, ACK of 2026-09-21, seven of seven on `localhost:3002`; which sub-checks of each item were exercised is not itemized in the ACK.
**Notes**: RC-11 derogation, declared: `npm run check:docs` Check B is red on the trunk after the rotation (10 field errors in 7 entries folded verbatim from the trunk inboxes: Causa with an annotation, Corregge or Causa absent). Accepted by Alfonso on 2026-09-21; the entries stay verbatim and the repair is a docs lane of its own after the push.
**Prompt document name**: 2026-09-19 17:40

## 2026-09-21 — docs: Check B green after the fold, register language of three decisions, HARNESS-DOCS 1.3 (P-2026-09-21-1420)
**Prompt**: `P-2026-09-21-1420`, docs repair after the reintegration merge; Phase 1 report (`245a171a4`) then GO with six answers: line break after the letter, sentinel on the two tickets, `Corregge` of the 1930 split entry as `2026-09-18 19:30` with the file name in parentheses, accent `è`, HARNESS-DOCS line 374 out of scope, the inbox ticket as a block in this entry. Node `~/.local/bin/node` v26.8.1.
**Files touched**: commits `aa9bcfaad` (`docs/claude-code-log.md`, seven entries, fields only), `2e291a46a` (`docs/decisions.md`, RC-14, R-IRN-35, R-IRN-36), `877d6febc` (`docs/HARNESS-DOCS.md`, four lines); this entry (`docs/log-inbox/harness.md`). No gate change: all seven entries are post-rule, `check-docs.ts` already cuts off at 2026-08-02.
**Outcome**: ✅ completed — `check:docs` 4/4 (A, B, C, D), two non-blocking inbox warnings; `check:agents` green.
**Corregge**: 2026-09-19 17:40 (`P-2026-09-19-1740`, the merge lane whose fold left the residue)
**Causa**: (c)
**Regressions**: no.
**Out-of-scope changes**: no.
**Layer Impact Report**: not-required — docs-only.
**Smoke visivo**: non applicabile.
**Notes**: the cause is a wrong assumption: the fold copies inbox entries verbatim and nothing lints an inbox, so ten field errors surfaced only in the active log. HARNESS-DOCS line 374 (three checks, no D) and §4.5 (no `log:rotate`) stay stale, for a refresh of their own. The Project Knowledge copy of HARNESS-DOCS is 1.2 until Alfonso replaces it.
**Prompt document name**: 2026-09-21 14:20
**Ticket** (opened, not implemented here). Inboxes (`docs/log-inbox/*.md`) are outside Check B: an entry that fails the gate is invisible until the fold moves it into the active log, and the fold then turns the whole gate red (measured 2026-09-21: seven entries, ten errors, all written 2026-09-19). Either `check-docs.ts` lints the inbox files with the same rules as the active log, or `rotate-log.ts` refuses to fold an entry that would fail Check B. A ticket of the same family, not to be blocked by this one: the log has no ticket type, and two ticket blocks written as `## date — ticket` headings were read by the gate as task entries.
## 2026-09-19 — merge: reintegrate validation-skeleton into alfonso-frontend-jjtl, steps A to C (P-2026-09-19-1740)
**Prompt**: `P-2026-09-19-1740` with its addendum (items 1-6), GO given in chat with the preconditions verified there. Steps A (re-measure), B (merge, resolve, gates, commit) and C (rotate the log) done; D (visual check), E (push) and F (simulator slice 0) not started. The prompt asks for Opus 5 in the banner; the GO overrode it ("procedi comunque con il trailer veritiero"), so every trailer says Sonnet 5.
**Files touched**: merge `4d397ac02` (parents `1b36576fb` and `30707bfd9`, 228 files: 149 added, 79 modified, 11 conflicting: `docs/PROTOCOL.md`, `docs/archivio/claude_milestone_validazione_scheletro.md`, `docs/claude-code-log.md`, `docs/decisions.md`, `docs/spec/spec_attive.md`, `SymbolEditorModal.scss`, `SymbolEditorModal.tsx`, `IRNodeContent.tsx`, `irCompile.ts`, `irTypes.ts`, `lastViewpoint.ts`); rotation `491fc1c4b` (the two log files, the archive, and the six inbox files the fold emptied); this entry. None of the six §3.2 files differs from the trunk parent.
**Outcome**: ⚠️ partial — steps A to C complete, but `check:docs` Check B is red after the rotation (below), and D to F are still to run.
**Corregge**: —
**Causa**: (a)
**Regressions**: no. Step A: `merge-tree` reports exactly the 11 expected files, none outside; `merge-file` hunks per file PROTOCOL 2, log 2, decisions 1, spec_attive 2, `SymbolEditorModal.scss` 1, `.tsx` 3, `IRNodeContent` 1, `irCompile` 2, `irTypes` 1, `lastViewpoint` 2 (the IR trio 1/2/1, all take-branch). Trunk baseline measured: typecheck **14** errors, vitest **3493** passed with 9 files red at import, build exit 0; branch baseline 33 typecheck in its own tree, 3911 passed. Merged tree: typecheck **14**, the same set as the trunk line-stripped; vitest **3935 passed, 0 failed**, the same 9 files red as the trunk; build exit 0; `check:agents` exit 0; `check:docs` 3/4 with only D red at 86 entries, as declared. After the rotation: D green (40), **B red**: 10 field errors in 7 entries folded verbatim from the trunk inboxes (Causa with an annotation, Corregge or Causa absent). The fold moved 15 entries, not the "seven" written in the body of `491fc1c4b`.
**Out-of-scope changes**: yes — merge-caused, declared in the merge body: `irValidate.test.ts`, the "NO cornerRadius key" test read the key from `defaultObjectViewIR()`, which the trunk seeds with `cornerRadius: 8` (R-IRN-35), and now drops it from the seed (two lines, test only). Also the six emptied inbox files in the rotation commit, where the prompt named the two log files.
**Layer Impact Report**: not-required — no §3.2 file in a conflict hunk, and none differs from the trunk parent.
**Smoke visivo**: non applicabile — Step D is the visual check and comes after this entry.
**Notes**: Resolution table, the removed cornerRadius duplicate (one declaration in ShapeSpec, one in CompiledView, diffed identical to the trunk) and the separatorColorStyle rebuild are in the body of `4d397ac02`. 43 duplicate archive headings dropped, first copy kept; one group (2026-08-13, dark-mode menus) differs in its Files touched line.
**Prompt document name**: 2026-09-19 17:40

## 2026-09-19 — feat: corner radius is a Conditional axis, aligned to R-IRN-35 before the merge (P-2026-09-19-1730)
**Prompt**: `P-2026-09-19-1730`, pre-merge alignment. The branch's scalar `ShapeSpec.cornerRadius` (D5) takes the trunk's type and compile path (`Conditional<number>`, `CompiledView.cornerRadius`, fallback `undefined`, never 0) and keeps its own rendering (polygons through `roundedPolygonPath`, clamp at render, absent is not zero). Two-phase: discovery report, GO with two answers (Q1 option B: stepper disabled with the label `rule-driven`; Q2 a pure helper `resolveCompiledCornerRadius` in `shapeRegistry.ts`, called by `IRNodeContent`), commit type asked under P6 and answered `feat(ir)`.
**Files touched**: discovery `83229edbd` (`docs/discovery/discovery_2026-09-19_corner_radius_alignment.md`, plus a Phase 2 addendum in the docs commit). Code `f5ec4b5fe`, 9 files: `ir/irTypes.ts`, `ir/irCompile.ts`, `ir/shapeRegistry.ts`, `ir/IRNodeContent.tsx`, `ir/irValidate.ts`, `authoring/VertexAuthoringPanel.tsx`, `ir/__tests__/ir.test.ts`, `ir/__tests__/shapeRegistry.test.ts`, `ir/__tests__/irValidate.test.ts`. This entry in its own docs commit, which also carries the addendum. Inbox: `views.md`, the one the prompt names; `symbol-editor.md` was the other candidate.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. `npm run typecheck` exit 2, **33** on full output, the declared baseline, **0** in the touched files; control `Measurable` → 6. `npx vitest run` from `frontend/`: **3911 passed, 0 failed** (3900 + 11 new), the identical set of 9 files red at import. `npm run build` exit 0. The 11 new tests were red on the pre-change source (run before any source edit); a bench of 10 mutants on the new code, each killed by a named test, none survived (commit message of `f5ec4b5fe`).
**Out-of-scope changes**: no. The helper in `shapeRegistry.ts` and the panel guard are the GO's answers to Q2 and Q1; `previewInstances.ts` and the four other readers untouched. Nine files, above the P6 threshold of five: listed in the commit and in the addendum, no separate pause because the GO named them.
**Layer Impact Report**: not-required — `viewpoint/ir/` and `viewpoint/authoring/` are §3.1 rows, but no §3.2 file (`useJjomSync`, `syncState`, `canvasToJjom`, `portDistribution`, `useM1ReferenceEdges`, `VersionFixer`) and no D-layer creator was touched.
**Smoke visivo**: non applicabile — the prompt sets the hard stop before Alfonso's visual check, which comes with the merged tree. Not executed here: the `IRNodeContent` call of the helper and the panel guard (both import `joiner`, no bench).
**Notes**: Merge after `f5ec4b5fe`: irTypes 1 hunk, irCompile 2, IRNodeContent 1, all take-branch (border axes; the render region, where the separatorColorStyle rebuild is R-IRN-36); merge-tree: the same 11 conflicted files. ShapeSpec.cornerRadius is DUPLICATED in the auto-merged irTypes.ts with no marker (lines 198, 208): P-2026-09-19-1740 deletes one, TS2300 finds it. Numbers: discovery addendum, section 8.
**Prompt document name**: 2026-09-19 17:30

## 2026-09-19 — docs: gate report for validation-skeleton into the trunk, Phase 1 (P-2026-09-19-1622)
**Prompt**: `claude_2026-09-19_1622_prompt_merge_gate_validation_skeleton.md`, Phase 1, read-only, hard stop on the report. Re-measure every figure the chat gave, classify the 41 duplicates and the 220 non-duplicates, map the conflicts to lanes, answer the edge-view question, and frame the merge mechanism as options with numbers, without choosing.
**Files touched**: `docs/discovery/discovery_2026-09-19_merge_gate_validation_skeleton.md` (new), `docs/log-inbox/merge-gate.md` (new). The prompt file was already tracked on the trunk (`2da08a722`). No file under `frontend/`, no change to `CLAUDE.md`, `PROTOCOL.md`, `decisions.md`.
**Outcome**: ✅ completed — Phase 1 only. Nothing merged, picked, checked out, stashed or pushed; Phase 2 not started.
**Corregge**: —
**Causa**: —
**Regressions**: no — docs only, nothing built or run.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Prompt figures were stale: the trunk merged origin/staging at 16:29, conflicts 7 to 10. Blocking finding: ShapeSpec.cornerRadius declared twice (R-IRN-31 vs D5), plus border. Session opened in ~/jjodel, where the prompt file is absent; worked in ~/jjodel-release as the prompt says. No build: no node_modules there (P14).
**Prompt document name**: 2026-09-19 16:22
## 2026-09-19 — docs: ratify R-IRN-35, R-IRN-36 and RC-14 from the merge gate (P-2026-09-19-1735)
**Prompt**: `claude_2026-09-19_1735_prompt_ratify_merge_gate_decisions.md`. Write into the normative documents the three decisions of 2026-09-19 on questions 1, 2 and 4 of section 10 of the gate report: R-IRN-35 and R-IRN-36 after R-IRN-34, RC-14 after RC-13 in `docs/decisions.md`, and the paragraph "Reintegration of a branch" at the end of P14 with the header bump 1.3 to 1.4. Measured the effect on the merge before writing, hard stop on the count, GO on option 1 (commit as written, trunk side at the merge).
**Files touched**: `ca23ae72a`, 2 files: `docs/decisions.md` (+34), `docs/PROTOCOL.md` (+20, -1). This entry in its own commit. The prompt file was already tracked on the trunk (`9c173dfce`). No file under `frontend/`, no change to `CLAUDE.md` or `docs/handoff/decisions-symbol-editor-1b.md`.
**Outcome**: ✅ completed — two commits, no push. `git merge-file -p <trunk> <merge-base 4275c5850> <validation-skeleton>`, conflict markers on complete output:

| File | Before | After |
|---|---|---|
| `docs/decisions.md` | 1 | 1 (the pre-existing hunk at the end of the file, merged line 3304 to 3338) |
| `docs/PROTOCOL.md` | 0 | 2 |

The two new `PROTOCOL.md` hunks are expected at the merge and resolve trunk side: the version line (1.4 against 1.3) and the reintegration paragraph inside P14. The prompt's "your edit must not add a hunk" could not hold: the base has no P12 to P15, both sides added that block identically, so any edit inside it conflicts wherever it sits. Line 91 differs on the branch only and merges clean. The gate report's premise that P14 sits outside the conflict hunks was true only until this edit. `npm run check:docs` through the P14 symlink: 3/3 pass (the trunk has no Check D), symlink removed, `git status --short` empty before and after.
**Deviation from the prompt**: RC-13-bis is in `docs/PROTOCOL.md:118`, not in `docs/decisions.md`; RC-14 went after RC-13, the last Processo entry. Each of the three `decisions.md` entries closes with a sentence naming the section-10 question that ratified it, kept by decision.
**Corregge**: —
**Causa**: —
**Regressions**: no — docs only; `check:docs` 3/3.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: The three new decisions.md entries are in English inside a register that is Italian; to be brought in line in a docs lane after the merge. The merge lane (P-2026-09-19-1740) must name the two PROTOCOL.md hunks and resolve them per hunk, trunk side, not by taking the whole file.
**Prompt document name**: 2026-09-19 17:35

## 2026-09-19 — docs: two discovery accounts carried, RC-13 cites P13 (P-2026-09-18-2110, last commit)
**Prompt**: `claude_2026-09-18_2110_prompt_claude_md_split_sul_tronco.md`, closing commit of the lane: carry the two
discovery files cited by root §5, retarget one citation in `docs/decisions.md`, extend the clause-range ticket.
**Files touched**: commit `7f5d8edbc` (`discovery_2026-08-11_ugrep_wrapper_ignore_files.md` and
`discovery_2026-09-16_symbolrecognition_scalarof_mutation_bench.md`, byte-identical to the trunk at `aae7401c1`,
and `docs/decisions.md`). The ticket extension is on the trunk, in `docs/log-inbox/claude-md-split.md` (`2b1cc6d05`),
because that is where the ticket lives.
**Outcome**: ✅ completed — every path cited by §5 resolves (5 of 5, positive and negative control run), and so do
all 85 backticked paths of the 11 carried files. `decisions.md` RC-13 says `docs/PROTOCOL.md` P13, only that citation.
**Corregge**: —
**Causa**: —
**Regressions**: no.
**Out-of-scope changes**: no.
**Layer Impact Report**: not-required — docs-only.
**Smoke visivo**: non applicabile.
**Notes**: measured with `git merge-file` on decisions.md (base = merge-base, ours = branch, theirs = trunk): 1 conflict already without this edit, 2 with the literal edit, 1 if the branch carried the trunk's exact RC-13 wording. Follow-up if wanted: use the trunk's wording.
**Prompt document name**: 2026-09-18 21:10
## 2026-09-19 — docs: the trunk's CLAUDE.md split brought into the branch (P-2026-09-18-2110, step 4)
**Prompt**: `claude_2026-09-18_2110_prompt_claude_md_split_sul_tronco.md`, step 4, after point 0 on the trunk
(`aae7401c1`: PROTOCOL.md 1.2 -> 1.3, one line in P10 for `docs/CODEBASE-MAP.md`). Files read with `git show`
from that fixed sha, then `gen:agents` run on the branch.
**Files touched**: commit `9b3d74857`, 20 files: `CLAUDE.md`, `AGENTS.md`, `docs/PROTOCOL.md`,
`docs/CODEBASE-MAP.md`, and for the eight modules (`editor-v2`, `model`, `redux`, `styles`, `jjel`,
`jjscript`, `jjtl`, `services/export`) their `CLAUDE.md` and `AGENTS.md`.
**Outcome**: ⚠️ partial — the carry is exact: md5 of all 19 files other than PROTOCOL.md identical to the trunk
at `aae7401c1`; PROTOCOL.md differs by one sentence, the P9 rotation sentence citing `npm run log:rotate`,
re-added verbatim (it describes a script that exists here and not on the trunk). `check:agents` exit 0.
`check:docs` exit 1, and it was exit 1 before any change: Check D, 41 active entries against the threshold of
40; A, B and C pass. Not fixed here: rotation is an exclusive lane (RC-12).
**Corregge**: —
**Causa**: (g)
— the red gate is the active-log threshold, not the split.
**Regressions**: no.
**Out-of-scope changes**: no.
**Layer Impact Report**: not-required — docs-only.
**Smoke visivo**: non applicabile.
**Notes**: declared delta: the P9 rotation sentence exists on the branch only, and does not take a version number. Open: two `docs/discovery/` files cited by root §5 exist on the trunk only; `docs/decisions.md` RC-13 cites P13 on the trunk only.
**Prompt document name**: 2026-09-18 21:10

## 2026-09-19 — feat(ir): object view default parity with abstract syntax
**Prompt**: `claude_2026-09-18_2219_prompt_default_view_parity.md` — Fase 1 discovery (hard stop),
poi Fase 2 a batch con GO espliciti in chat: S1 (`TextStyle.underline`) + `cornerRadius` +
parità del seed (bordo/etichetta/separatore), verifica S3 (`EnableIRPanel` delegava già a
`irDefaults.ts` per vertex ed edge — nessuna modifica), item 4 (terminazione dell'arco — già lo
stato del codice, nessuna modifica), fix della regressione trovata durante S5 sull'identità delle
view migrate.
**Files touched**: `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts`,
`irCompile.ts`, `IRNodeContent.tsx`, `irDefaults.ts`,
`viewpoint/ir/__tests__/ir.test.ts`, `docs/discovery/discovery_2026-09-18_default_view_parity.md`
(+ due probe non tracciati, lasciati nello scratchpad di sessione), `docs/decisions.md` (R-IRN-29..34).
Commit: `400095370`, `12ae8c41c`, `6ee6efcd5`, `971234d94`, `516afd310`.
**Outcome**: ✅ completed — parità del chrome misurata a zero delta (light e dark) su una object
view nuova; regressione sulle view migrate trovata durante la stessa sessione e corretta prima
della chiusura (`516afd310`).
**Corregge**: —
**Causa**: (c)
— la modifica alla factory (`400095370`) non ha considerato la dipendenza di
`isMigratedDefaultView` sulla sua forma esatta; scoperta e corretta nello stesso task, non in un
task successivo.
**Regressions**: yes — vedi R-IRN-33. Ogni progetto migrato da `VersionFixer` 2.225→2.226
(`637a5e238`, 2026-07-18 in poi) ha smesso di delegare al renderer nativo dopo `400095370`/`6ee6efcd5`,
tornando a renderizzare via interprete IR sulla propria `ir` non aggiornata (raggio 4px, bordo
grigio, nessuna sottolineatura). Fix in `516afd310`: forma pre-batch congelata
(`LEGACY_OBJECT_VIEW_SNAPSHOT`), riconosciuta insieme a quella corrente. Tre nuovi test
verificati su mutation bench (§5): la sola forma pre-fix fa fallire esattamente il test che nomina
la regressione.
**Out-of-scope changes**: no — ogni file toccato era nominato da Alfonso nei GO di fase, incluso
`ir.test.ts` per il fix.
**Layer Impact Report**: not-required — nessuno dei file toccati e' nella critical zone di §3.1/§3.2
(`useJjomSync.ts`, `syncState.ts`, `canvasToJjom.ts`, `portDistribution.ts`,
`useM1ReferenceEdges.ts`, `VersionFixer.tsx`, `defaultViewTemplate.ts`, `DV.tsx`).
**Smoke visivo**: passato per una view nuova (verifica visiva di Alfonso dopo il batch 4, canvas
`:3001`, light e dark). Non ancora verificato a schermo per un progetto migrato pre-`400095370`
(R-IRN-34) — solo a livello di unità (`isMigratedDefaultView`).
**Notes**: durante la verifica del fix e' stato usato `git stash push -- irDefaults.ts` su albero
condiviso (violazione RC-13/§6.4), rilevato e corretto subito (pop immediato, nessun'altra corsia
toccata, verifica poi rifatta con `git show HEAD:<path>`). Dettaglio in R-IRN-33.
**Prompt document name**: 2026-09-18 22:19
## 2026-09-19 — ticket extension: the clause-range check also covers docs/HARNESS-DOCS.md
**Extends** the ticket "check:docs should assert the clause range against PROTOCOL.md" above (add-only: the
original text stands). The check D proposed there compares the highest `## P<n>` of `docs/PROTOCOL.md` with the
range cited in three places. `docs/HARNESS-DOCS.md` cites the range too, and all three of its citations are stale:
`P1..P10` at lines 122, 344 and 358, against P1..P15 in force. The gate should cover it, which makes six citation
sites instead of three.
**Not done here**: no edit to `docs/HARNESS-DOCS.md` (its own rule asks for a version bump, and it already
differs between the trunk and `validation-skeleton`). Line 122 is inside an example prompt header and may be
meant as a historical example: whoever implements the gate decides whether it is in scope.
**Corregge**: —
**Causa**: —
## 2026-09-19 — ticket: check:docs should assert the clause range against PROTOCOL.md
**Ticket** (opened, not implemented here). `frontend/scripts/gates/check-docs.ts` should add a check D:
the highest `## P<n>` heading of `docs/PROTOCOL.md` equals the `<n>` cited as `P1..P<n>` in the three
places that state the range: `CLAUDE.md` (the pointer under the non-negotiable block and the one in §1)
and the `Protocollo:` line of `docs/PROTOCOL.md`.
**Why**: the range was wrong twice in one day. It said P1..P11 while P12 existed (corrected 2026-09-18),
then P1..P12 while Phase 2 had added P13 to P15 (corrected 2026-09-19, `717b29a64`). Both were found by reading,
not by a gate.
**Notes for whoever picks it up**: three citation sites today (`CLAUDE.md:14`, `CLAUDE.md:108`,
`docs/PROTOCOL.md:11`); the check must fail on a mismatch in either direction. It touches a gate script and
`CLAUDE.md` §17, so it is a lane of its own.
**Corregge**: —
**Causa**: —

## 2026-09-19 — docs: split audit findings closed, gates measured in the trunk worktree, §18/§19 moved
**Prompt**: `claude_2026-09-18_2110_prompt_claude_md_split_sul_tronco.md`, second handover turn:
(1) gates in the trunk worktree, (2) findings A and B in `jjtl/CLAUDE.md`, (3) clause range,
(4) close the 551-character gap by moving §18 and §19. Step 4 (bring the split back into the branch) not run.
**Files touched**: commits `34ddaf0c7` (audit report §7), `19112458f` (`frontend/src/jjtl/CLAUDE.md` + `AGENTS.md`),
`717b29a64` (`CLAUDE.md`, `AGENTS.md`, `docs/PROTOCOL.md`), `068d59367` (`CLAUDE.md`, `AGENTS.md`, new `docs/CODEBASE-MAP.md`).
**Outcome**: ✅ completed — root `CLAUDE.md` 40551 -> 37756 characters (2244 of headroom). Gates
`gen:agents`, `check:agents`, `check:docs` all exit 0 after each commit, run in the trunk worktree.
A restored verbatim (9 lines added, 0 removed against the baseline); B resolved by correcting the
note; range now P1..P15.
**Corregge**: 2026-09-18 19:30 (`claude_2026-09-18_1930_prompt_claude_md_split_oltre_limite.md`)
**Causa**: (a)
— the 21-25k estimate of that prompt is falsified and stands declared as such; the
acceptance is "under 40,000 with headroom", not the estimate.
**Regressions**: no.
**Out-of-scope changes**: no.
**Layer Impact Report**: not-required — docs-only.
**Smoke visivo**: non applicabile.
**Notes**: second cause (c): Phase 3 merged two pre-existing jjtl lines and wrote "moved verbatim" over a deletion. Gates import only `node:` built-ins, so they need no `node_modules`; the symlink in the release tree is another lane's under a live vite, hence no `npm ci`. Supersedes the "gates not run" note of the entry above.
**Prompt document name**: 2026-09-18 21:10

## 2026-09-19 — docs: verbatim audit of the CLAUDE.md split (Phases 1-3) and check of §5
**Prompt**: `claude_2026-09-18_2110_prompt_claude_md_split_sul_tronco.md`, handover turn: (1) read-only
verbatim audit of the moved blocks against `084d99b3b`, (2) complete Phase 2 §5. Lane taken over
from the session that ran steps 1-3 and whose closing report never arrived.
**Files touched**: `docs/discovery/discovery_2026-09-19_claude_md_split_audit_verbatim.md` and two
probes under `docs/discovery/harness/`. Commit `c8cdc8efe`. No normative file touched.
**Outcome**: ⚠️ partial — audit done: 850 of 856 baseline lines verbatim, the other 6 accounted
for; three non-move findings (jjtl module reflow, §12.7 deleted while the note says moved, clause
range P1..P12 stale against P1..P15). §5: no edit, the four examples were already compressed by
`da07e3169` (-308 chars) with the accounts present in the cited files. Root is 40,551 chars: 551
over the limit, and §5 has no further worked example to move without cutting a rule.
**Corregge**: —
**Causa**: (a)
— the numeric target cannot be reached inside the scope the prompt names. Second: the
handover premise "§5 compression not done" was wrong, because the previous report did not arrive.
**Regressions**: no.
**Out-of-scope changes**: no.
**Layer Impact Report**: not-required — docs-only.
**Smoke visivo**: non applicabile.
**Notes**: the three gates were not run, no gated file was touched. Step 4 stays suspended. Trunk
worktree carries another lane's WIP in `viewpoint/ir/*`, left untouched (RC-13). Entry is not
part of the audit commit (docs and record travel apart).
**Prompt document name**: 2026-09-18 21:10

## 2026-09-19 — docs: CLAUDE.md split Phase 3 — design system + language sections to nested modules
**Prompt**: `claude_2026-09-18_1930_prompt_claude_md_split_oltre_limite.md` Phase 3 — move §7
(Design system), §11 (JjEL), §13 (JjScript), §14 (Ecore/XMI I/O) verbatim to new nested,
directory-scoped CLAUDE.md files; merge root §12's non-table content (Full reference, Roadmap)
into the pre-existing `frontend/src/jjtl/CLAUDE.md`, keeping §12.6 (cross-language symbol table)
in root since it governs JjEL and JjScript too. Rules 26-28 stay in the non-negotiable block as
the one-line design-system versions. Run on the trunk per §6.6/P15.
**Files touched**: `AGENTS.md`, `CLAUDE.md`, `frontend/src/jjel/CLAUDE.md` + `AGENTS.md` (new),
`frontend/src/jjscript/CLAUDE.md` + `AGENTS.md` (new), `frontend/src/services/export/CLAUDE.md` +
`AGENTS.md` (new), `frontend/src/styles/CLAUDE.md` + `AGENTS.md` (new), `frontend/src/jjtl/CLAUDE.md`
+ `AGENTS.md` (merged in). Commit `62d139fa1`.
**Outcome**: ⚠️ partial — every named block moved verbatim, all three gates green (`gen:agents`,
`check:agents`, `check:docs`), `## 0.` heading intact. Root CLAUDE.md 44726 -> 41386 bytes:
under the Phase 1/2 combined reduction trend but still above the prompt's stated "<40000,
expected around 21000-25000" target. No further sections were moved to close the gap — none of
§9, §16-21, the non-negotiable block, §2.5, §4, §6, §15 were named in Phase 3's scope, and closing
the gap further would mean moving un-named sections, which Rule 1 does not authorize on this
lane's own initiative.
**Corregge**: —
**Causa**: (a)
— the prompt states the byte target as "expected around", not as one of its own
four enumerated acceptance items (verbatim moves, gates green, `## 0.` heading, phase 0 measurement
shown); the phase satisfies all four but undershoots the numeric expectation. Flagged for Alfonso
in the Step 4 hard-stop report rather than resolved unilaterally.
**Regressions**: no.
**Out-of-scope changes**: no.
**Layer Impact Report**: not-required — docs-only.
**Smoke visivo**: non applicabile.
**Notes**: other lane's concurrent WIP in `frontend/src/components/editor-v2/viewpoint/ir/*` and
three IR-related discovery/probe files (one new since Phase 2) present in the shared tree
throughout; left untouched per §6.4/P13 (RC-13).
**Prompt document name**: 2026-09-18 19:30

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

## 2026-09-18 — chore: CLAUDE.md split, Phase 0 measurements (P-2026-09-18-1930)
**Prompt**: GO for Phase 0 only of the CLAUDE.md split — measure whether the 40k-char limit
truncates or only reports, and whether a nested CLAUDE.md under `editor-v2/` actually loads for
work under that directory. Hard stop after reporting; Phases 1-3 not started.
**Files touched**: `frontend/src/components/editor-v2/CLAUDE.md` (new probe), `frontend/src/components/editor-v2/AGENTS.md` (generated sibling)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: M1 inconclusive via debug log (no truncation string in 4 `--debug` runs,
positive-controlled); settled directly — this session's own CLAUDE.md matches disk byte-for-byte,
untruncated. M2 conclusive: token auto-injected (no explicit Read) for editor-v2 work, absent
elsewhere. Full account: `docs/discovery/discovery_2026-09-18_claude_md_split_phase0_nested_load.md`.
**Prompt document name**: 2026-09-18 19:30

---


## 2026-09-18 — docs: CLAUDE.md split Phase 2 — §5 compression, §6.4-6.6 to PROTOCOL.md
**Prompt**: `claude_2026-09-18_1930_prompt_claude_md_split_oltre_limite.md` Phase 2 — compress
the 4 named §5 worked examples (ugrep 2026-08-11, typecheck window 2026-08-13, tree glyph
2026-08-12, symbolRecognition mutation bench 2026-09-16) to one sentence + pointer each, creating
the two missing discovery docs; move §6.4/6.5/6.6 verbatim to `docs/PROTOCOL.md` as P13/P14/P15,
leaving pointers in §6; update RC-13 in `docs/decisions.md` to cite P13.
**Files touched**: `AGENTS.md`, `CLAUDE.md`, `docs/PROTOCOL.md`, `docs/decisions.md`,
`docs/discovery/discovery_2026-08-11_ugrep_wrapper_ignore_files.md` (new),
`docs/discovery/discovery_2026-09-16_symbolrecognition_scalarof_mutation_bench.md` (new).
Commit `da07e3169`.
**Outcome**: ✅ completed — root CLAUDE.md 50910 -> 44726 bytes. All three gates green; Check A
(§21.2/P9 byte-identity) re-confirmed passing after the edit.
**Corregge**: —
**Causa**: —
**Regressions**: no.
**Out-of-scope changes**: yes, minor — the `docs/PROTOCOL.md` header line ("clausole P1..P12
applicabili") was left unupdated after adding P13-P15; a stale self-count, not corrected in this
lane (not named in Phase 2's instructions). Flagged to Alfonso in the Step 4 hard-stop report.
**Layer Impact Report**: not-required — docs-only.
**Smoke visivo**: non applicabile.
**Notes**: other lane's concurrent WIP in `frontend/src/components/editor-v2/viewpoint/ir/*` and
two new IR-related discovery/probe files was present in the shared tree throughout; left
untouched per §6.4/P13 (RC-13).
**Prompt document name**: 2026-09-18 19:30

## 2026-09-18 — docs: split critical-zone D-L/M1-M2 rules into nested CLAUDE.md modules
**Prompt**: `claude_2026-09-18_1930_prompt_claude_md_split_oltre_limite.md` Phase 1 — move §3
(sync layer / D-L proxy critical zone) out of root CLAUDE.md into three nested, directory-scoped
CLAUDE.md modules (`frontend/src/redux/`, `frontend/src/model/`, `frontend/src/components/editor-v2/`),
verbatim, leaving one-line pointers in root §3. Run on the trunk (`alfonso-frontend-jjtl`,
`/Users/alfonso/jjodel-release`) per §6.6/P15.
**Files touched**: `AGENTS.md`, `CLAUDE.md`, `docs/PROTOCOL.md`, `frontend/src/redux/CLAUDE.md` +
`AGENTS.md`, `frontend/src/model/CLAUDE.md` + `AGENTS.md`, `frontend/src/components/editor-v2/CLAUDE.md`
+ `AGENTS.md`. Commit `4355a148c`.
**Outcome**: ✅ completed — root CLAUDE.md 63444 -> 50910 bytes. All three gates green
(`gen:agents`, `check:agents`, `check:docs`).
**Corregge**: —
**Causa**: —
**Regressions**: no.
**Out-of-scope changes**: yes — `frontend/src/redux/CLAUDE.md` carries one paragraph noting a
DV.tsx-runtime gap that is new prose, not a verbatim move of §3.9. Flagged to Alfonso in the
Step 4 hard-stop report, not yet ratified.
**Layer Impact Report**: not-required — docs-only, no D-L/sync code touched.
**Smoke visivo**: non applicabile.
**Notes**: see also Step 1 (`32dbe1ef8`, probe removal + §9.3 transport) and the individual
normative commits under this Phase (`686a13712`, `74d0f81db`, `43e598404`, `7bc6c7365`,
`00b32f5e7`, `8f6122427`, `cccabe385`, `4db186124`) already present on trunk before Phase 1 proper.
**Prompt document name**: 2026-09-18 19:30

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

