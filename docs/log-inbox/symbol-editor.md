# log-inbox — lane «symbol-editor»

Entries written by the Symbol Editor lane while three sessions share this tree (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

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
**Regressions**: unknown — `unknown` and not `no` because nothing was opened in the running app:
the prompt assigns the visual check to Alfonso and says to hold this field until he answers. Gates
all green: `npm run typecheck` exit 2, **33** on full output, set byte-identical to the pre-edit run
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
**Smoke visivo**: non eseguito — the app was not opened; the ordered list of what to look at was
handed to Alfonso in chat. Covered instead by the unit bench below and by the rendered popover test.
**Notes**: Ambiguità «scrolla/mostra» risolta in **mostra una sezione per volta**, come chiede la spec: perciò il grid a due colonne e lo span del Border sono **rimossi**, non lasciati — con una sezione sola il grid la impagina a sinistra. Banco: 3 mutanti su `borderOverrideRows`, 5/2/2 rossi, sorgente ripristinato. Nav a 8 voci: `irTabsForKind` non dà Appearance al rail, quindi Shape e Badges si raggiungono solo qui. Altra corsia: `6ae3e15eb` nel giro, nessun suo file nel mio commit.
**Prompt document name**: 2026-09-16 23:39

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
