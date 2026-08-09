# Prompt Claude Code — Chiusura Fase B2a: commit finale, catch-up log, recupero discovery report

**Tipo**: chore/docs (nessun codice nuovo, solo commit e documentazione di lavoro già fatto e verificato). **Branch**: `alfonso-frontend-jjtl`. **Critical zone**: nessuna. **LIR**: not-required.

## Contesto (verificato da chat via accesso diretto al repo locale, non ridiscutere le premesse)

Stato del working tree verificato ora (`git status`, `git diff`, `git log`):

- I file di codice di **Fase B2a sono già staged** (`git add` fatto), ma **mai committati**. `git diff --cached --stat` mostra esattamente questi 10 file:
  - `frontend/src/components/editor-v2/viewpoint/authoring/BadgeListEditor.tsx` (nuovo)
  - `frontend/src/components/editor-v2/viewpoint/authoring/FieldCompartmentListEditor.tsx` (nuovo)
  - `frontend/src/components/editor-v2/viewpoint/authoring/FieldSegmentEditor.tsx` (nuovo)
  - `frontend/src/components/editor-v2/viewpoint/authoring/LabelEntryEditor.tsx` (nuovo)
  - `frontend/src/components/editor-v2/viewpoint/authoring/LabelListEditor.tsx` (nuovo)
  - `frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx` (modifica)
  - `frontend/src/components/ui/ListEditor/ListEditor.module.css` (nuovo)
  - `frontend/src/components/ui/ListEditor/ListEditor.tsx` (nuovo)
  - `frontend/src/components/ui/ListEditor/index.ts` (nuovo)
  - `frontend/src/components/ui/index.ts` (modifica, barrel export)

  Questo elenco combacia con la tabella DOVE del prompt B2a originale (`claude/2026-07-22_prompt_faseB2a_breadth_labels_compartments_badges.md`) più i due companion attesi e non problematici (CSS module + barrel export di `ListEditor`, sullo stesso pattern di Checkbox/ColorPicker/PathBuilder in Fase A). Alfonso ha già dato l'OK visivo sui 7 criteri di accettazione nella sessione precedente: **manca solo il commit**.

- `docs/claude-code-log.md` ha **due entry pendenti, non committate, e inserite nel posto sbagliato**: subito dopo l'intestazione del file (`# Claude Code Session Log`), invece che in fondo dove il file mantiene l'ordine cronologico crescente (verificato: l'ultima entry committata, quella di Fase A `authoring_slice1_faseA`, è correttamente in fondo al file). Le due entry pendenti, nell'ordine in cui appaiono ora (sbagliato) sono:
  1. `## 2026-07-22 — feat: vertex authoring panel with live IR preview (phase B)` (corrisponde ai commit già in git `bc012ac93`/`82a3a6c9a`)
  2. `## 2026-07-22 — feat(editor-v2): ri-stratificazione box painting IR su .ir-node-content (Fase B authoring)` (corrisponde al commit già in git `bc012ac93`)

  Cronologicamente corrette in fondo al file, nell'ordine dei commit (`git log`: `56e161f4f` Fase A più vecchio → `bc012ac93` → `82a3a6c9a` più recente), andrebbero: prima l'entry "ri-stratificazione box painting" (bc012ac93), poi l'entry "vertex authoring panel... (phase B)" (82a3a6c9a) — cioè l'ordine attuale delle due entry va anche invertito, non solo spostato.

- **Manca del tutto** il discovery report della catena di mount di `VertexAuthoringPanel`, mai salvato su file nonostante la regola del progetto lo richieda. Il contenuto era stato prodotto in chat da Code in una sessione precedente (read-only): `Dock.tsx:282` (tab "Properties") → `PropertiesWithTreeView.tsx:295` → `Info.tsx:1208` → `ViewData.tsx:74`, dentro il sotto-tab con id `'ir'` label `'IR'` (barra sotto-tab per una view: Apply to · Template · IR · Style · Events · Options). Percorso secondario: `NestedView.tsx:493`. Gate in cascata prima che il pannello sia visibile: (a) selezione è una `DViewElement`, non una `DViewPoint`; (b) tab mode; (c) `view.ir?.kind === 'vertex'` (aggiunge il sotto-tab IR); (d) l'utente deve cliccare il sotto-tab, non è quello di default. Il pannello è avvolto in un error boundary (`<Try>`) che impedisce il crash su IR malformato.

- **Nel working tree ci sono anche file di un altro filone di lavoro**, non correlato a B2a, da NON toccare (vedi COME).

## COSA

### Step 1 — Riordino cronologico + commit di catch-up del log (docs-only, isolato)

Nel file `docs/claude-code-log.md`: sposta le due entry pendenti (elencate sopra) dalla loro posizione attuale (subito dopo l'intestazione) alla fine del file, dopo l'ultima entry esistente (quella di Fase A, `2026-07-22 — feat: authoring IR slice-1 enabling layer (Fase A)`), invertendone l'ordine: prima "ri-stratificazione box painting IR" (bc012ac93), poi "vertex authoring panel with live IR preview (phase B)" (82a3a6c9a). **Solo spostamento e riordino, zero riscrittura del testo delle due entry.**

Verifica: il contenuto testuale delle due entry deve restare byte-identico, solo la posizione cambia. Poi `git add docs/claude-code-log.md` (solo questo file) e commit:

```
docs: catch up claude-code-log entries for phase B rendering + panel (bc012ac93, 82a3a6c9a), fix chronological order
```

### Step 2 — Append entry Fase B2a + commit del codice già staged

Aggiungi in fondo a `docs/claude-code-log.md` (dopo l'entry appena riordinata "phase B panel") questa nuova entry:

```
## 2026-07-22 — feat: authoring slice-1 breadth — label list, fieldCompartments, badges, Basic/Advanced tab shell (phase B2a)
**Prompt**: estensione in ampiezza di VertexAuthoringPanel (Fase B): lista label completa (aggiungi/rimuovi/riordina), fieldCompartments con segmenti, badges, tab shell Basic/Advanced (Advanced placeholder inerte, il Conditional/Predicate builder arriva in Fase B2b). Nessuna modifica al ciclo edit/validate/commit di Fase B.
**File toccati**: components/ui/ListEditor/{ListEditor.tsx,ListEditor.module.css,index.ts} (nuovo), components/ui/index.ts (barrel), components/editor-v2/viewpoint/authoring/{LabelEntryEditor.tsx,LabelListEditor.tsx,FieldCompartmentListEditor.tsx,FieldSegmentEditor.tsx,BadgeListEditor.tsx} (nuovi), components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx (tab shell + montaggio editor nuovi)
**Esito**: ✅ completato — verifica visiva di Alfonso positiva sui 7 criteri di accettazione (lista label multi-entry con riordino live, fieldCompartment con segmento value reso senza reload, badge Bootstrap Icons in canvas nella posizione scelta, round-trip byte-identico dei Conditional esistenti su label/badge/fieldCompartment, riordino senza side-effect sul resto dell'IR, placeholder Advanced inerte senza errori console, persistenza su reload)
**Note**: i campi Conditional (`label.visible`, `badge.icon`, `badge.visible`, `fieldCompartment.visible`) restano read-only/preservati verbatim in questa fase; l'editing arriva in Fase B2b (Conditional/Predicate builder), design in corso di ratifica
**Nome del documento prompt**: 2026-07-22_prompt_faseB2a_breadth_labels_compartments_badges.md
```

Prima di committare, **ri-verifica i gate** (non fidarti del gate di sessione precedente, è passato tempo e il working tree ha altre modifiche non correlate in sospeso):
- `npm run typecheck` — confronta con la baseline dichiarata (33), Δ0 atteso sui file toccati.
- `npm test` / vitest — suite invariata, nessuna regressione.
- `npm run build` — verde.

Se un gate non è verde: **STOP, non forzare il commit**, riporta l'errore esatto.

Se tutti i gate sono verdi: verifica che `git diff --cached --stat` mostri esattamente gli stessi 10 file di codice elencati sopra più `docs/claude-code-log.md` (nient'altro), poi commit:

```
feat: authoring slice-1 breadth — label list, fieldCompartments, badges, Basic/Advanced tab shell (phase B2a)
```

### Step 3 — Recupero discovery report mancante (read-only, no codice)

Riverifica rapidamente (grep/apertura file) che i riferimenti sotto siano ancora accurati — potrebbero essere shiftati di riga dopo i commit di Fase B/B2a — poi scrivi `docs/discovery/discovery_2026-07-22_vertexauthoringpanel_mount_chain.md` con la struttura standard (obiettivo, file letti con path completi, findings, dipendenze/rischi, domande aperte), formalizzando:

- Catena di mount: `Dock.tsx` (tab "Properties") → `PropertiesWithTreeView.tsx` → `Info.tsx` → `ViewData.tsx`, sotto-tab id `'ir'` label `'IR'` (barra: Apply to · Template · IR · Style · Events · Options).
- Percorso secondario: `NestedView.tsx`.
- Gate in cascata (a) selezione `DViewElement` non `DViewPoint`; (b) tab mode; (c) `view.ir?.kind === 'vertex'`; (d) click esplicito sul sotto-tab (non è default).
- Error boundary (`<Try>`) attorno al pannello.
- Nota operativa per il futuro: un dev server non riavviato per intero dopo manovre manuali sui file può nascondere il pannello anche a codice corretto (precedente di questa sessione — da citare come "domanda aperta/nota" nel report, utile a chi debugga in futuro).

Poi `git add docs/discovery/discovery_2026-07-22_vertexauthoringpanel_mount_chain.md` + entry di log (stesso formato standard) e commit:

```
docs: discovery report for VertexAuthoringPanel mount chain (retroactive)
```

## COME (vincoli)

- **Mai `git add .` o `git add -A`** in nessuno dei tre step. Solo i file esplicitamente elencati.
- **NON TOCCARE** (altro filone di lavoro, in sospeso nello stesso working tree, non tuo compito in questo prompt):
  - `docs/discovery/discovery_2026-07-22_ir_box_layering.md` (untracked)
  - `docs/discovery/discovery_2026-07-22_ir_color_swatch_padding.md` (untracked)
  - `docs/discovery/discovery_2026-07-22_ir_shape_css.md` (untracked)
  - `docs/specs/design_2026-07-21_ir_authoring_surface_slice1.md` (untracked)
  - `frontend/src/components/ui/ColorPicker/ColorPicker.module.css` (modificato, unstaged — non è nello scope B2a nonostante il nome simile a un file toccato in Fase A)
  - `.claude/scheduled_tasks.lock` (cancellato, unstaged, housekeeping non correlato)
  - `.claude/settings.local.json` (untracked, locale)

  Non fare `git add` su nessuno di questi, non fare `git checkout --`/`git clean` per "ripulire", non committarli per errore insieme a Fase B2a. Lasciali esattamente come sono nel working tree.
- Tre commit separati come da step 1/2/3 sopra, non accorpare.
- Se durante lo Step 1 scopri che il testo delle due entry pendenti non è quello riportato in questo prompt (es. è stato nel frattempo modificato), STOP e riporta la differenza invece di procedere.
- NIENTE push, salvo diversa istruzione esplicita.

## RIFERIMENTI

- `claude/ratifiche_2026-07-21_authoring_slice1.md` (D1-D6, Q3/Q5, A1/A2)
- `claude/2026-07-22_prompt_faseB2a_breadth_labels_compartments_badges.md` (prompt originale, criteri di accettazione)
- `claude/sessione_2026-07-22_3.md` (checkpoint con lo stato dettagliato di questa chiusura)
- Convenzione discovery report: `docs/discovery/`, naming `discovery_<data>_<descrizione>.md`
- Convenzione log: `docs/claude-code-log.md`, formato standard con campi Prompt/File toccati/Esito/Note/Nome del documento prompt
