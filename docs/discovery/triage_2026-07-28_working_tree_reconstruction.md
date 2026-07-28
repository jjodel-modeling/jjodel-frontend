# Triage READ-ONLY — Ricostruzione index in commit tematici (Fase B step 1)

**Data**: 2026-07-28
**Branch**: `alfonso-frontend-jjtl` · **HEAD**: `9bd8cad9a` (feat: edge view authoring panel — E-ref)
**Origin**: `origin/alfonso-frontend-jjtl` = `4273317f8`; HEAD avanti di **3 commit non pushati** (`420657f98` E0, `e2368cad7` TS1, `9bd8cad9a` E-ref).
**Tipo**: discovery / chore, **READ-ONLY assoluto**. Nessun `git add/rm/restore/reset/stash/commit`, nessun edit di codice. Unico output su disco: questo file.
**Metodo**: ogni classificazione qui sotto è confermata leggendo i **diff reali** (non la memoria di sessione né il triage del 27). Dove il tree diverge dalle ipotesi del prompt, prevale il diff.

---

## 1. Obiettivo

Produrre una mappa a livello di **hunk** dell'intero working tree post-commit-E-ref e una **sequenza di commit tematici** che builda a ogni passo, come input per la Fase B step 2 (i commit veri, dopo ratifica di Alfonso). Nessun commit qui.

## 2. `git status` (fotografia)

```
On branch alfonso-frontend-jjtl (ahead of origin by 3 commits)

Changes to be committed (INDEX):
  M frontend/src/components/editor-v2/nodes/ObjectNode.tsx
  M frontend/src/components/editor-v2/nodes/nodeSizing.ts
  M frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx   (SOLO hunk checkbox)
  M frontend/src/components/editor-v2/viewpoint/ir/irStyle.ts
  M frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts

Changes not staged (WORKING TREE):
  M .claude/scheduled_tasks.lock
  M docs/claude-code-log.md
  M frontend/src/components/editor-v2/EditorV2.tsx
  M frontend/src/components/editor-v2/hooks/useEditorMode.ts
  M frontend/src/components/editor-v2/sync/canvasToJjom.ts
  D frontend/src/components/editor-v2/utils/laneSeparation.ts
  M frontend/src/components/editor-v2/viewpoint/authoring/LabelEntryEditor.tsx
  M frontend/src/components/editor-v2/viewpoint/authoring/TextStyleEditor.tsx
  M frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx  (SOLO hunk bottone)
  M frontend/src/components/editors/views/ViewData.tsx
  M frontend/src/components/editors/views/nestedView.scss
  M frontend/src/events/registry.ts
  M frontend/src/styles/components/_form-system.scss

Untracked:
  docs/discovery/*.md  (13 file, vedi §7)
  frontend/src/components/editor-v2/viewpoint/authoring/TextStyleField.tsx
```

`VertexAuthoringPanel.tsx` compare in ENTRAMBE le sezioni (index=checkbox, working-tree=bottone): unico file davvero "misto" per index/working-tree. `EditorV2.tsx` è misto per **filone** (tutto unstaged, ma 3 filoni distinti negli hunk).

## 3. Revisione delle ipotesi del prompt (leggere PRIMA della tabella)

| Ipotesi prompt | Esito dal diff reale |
|---|---|
| **F5 — refactor edge/anchor orfano in EditorV2.tsx** | **NON esiste** come refactor funzionale. Gli unici hunk edge-correlati non-F3 in EditorV2.tsx sono la **rimozione dei console.log `[BUG-DIAG-DROP]`** (onConnect/onConnectEnd/M1-branch) → *debug-cleanup, behavior-preserving*. Nessun cambio di rendering/anchor rispetto a E0. Ribattezzo il filone **F5 → "debug-cleanup connect"**. |
| **F6 — lane-separation** | Confermato: `laneSeparation.ts` cancellato (−125) + in EditorV2.tsx rimozione import (`LANE_DEBUG`, `reconstructEdgePoints`, `LaneRect`, `ReconstructEdge`) e del blocco `if (LANE_DEBUG){…}`. **Rimozione completa**: `grep laneSeparation\|LANE_DEBUG\|reconstructEdgePoints src/` → 0 occorrenze residue. |
| (non previsto) **F8 — redesign header/properties panel** | **NUOVO filone**: `ViewData.tsx` (unstaged, hunk header — collassa le 2 righe header in una sola `.props-header--view` con breadcrumb inline) + `nestedView.scss` (stili `.props-header--view` + tab-bar single-row overflow) + discovery `discovery_2026-07-28_properties_panel_redesign.md`. Estraneo a F4/F5/F6. |

## 4. Tabella file/hunk → filone (intero tree)

| File | Staged? | Filone | Contenuto (1 frase) |
|---|---|---|---|
| `hooks/useEditorMode.ts` | no | **F1** | Firma M2 include i NOMI di reference/attributi → un rename id-preserving ri-deriva `modeInfo` (fix co-evoluzione M2→M1). |
| `nodes/ObjectNode.tsx` | **sì** | **F2** | Gate `canResize` / `ir-resizable` sul nodo oggetto. |
| `nodes/nodeSizing.ts` | **sì** | **F2** | `defaultResizableForForm(form)`. |
| `viewpoint/ir/irStyle.ts` | **sì** | **F2** | Regola `.mm-node.ir-resizable`. |
| `viewpoint/ir/irTypes.ts` | **sì** | **F2** | `resizable?: boolean` su `VertexViewIR` (+1). |
| `authoring/VertexAuthoringPanel.tsx` | **misto** | **F2 / F3** | Checkbox "Resizable" (staged=F2) + bottone "Propaga dimensione" (unstaged=F3). Vedi §5. |
| `sync/canvasToJjom.ts` | no | **F3** | `syncSizeBatchToJjom(sizes[])` — batch SetFieldAction w/h in una TRANSACTION. |
| `events/registry.ts` | no | **F3** | Costante `PROPAGATE_VIEW_SIZE: 'jjodel:propagate-view-size'`. |
| `EditorV2.tsx` | no | **F3 / F6 / F5** | 3 filoni negli hunk. Vedi §5. |
| `utils/laneSeparation.ts` | no (deleted) | **F6** | Modulo lane-separation cancellato (−125). |
| `authoring/LabelEntryEditor.tsx` | no | **F4** | Usa il nuovo `<TextStyleField>` (trigger+popover) al posto dell'editor inline. |
| `authoring/TextStyleField.tsx` (NEW) | untracked | **F4** | Nuovo campo trigger+popover (portal) che apre `TextStyleEditor`. |
| `authoring/TextStyleEditor.tsx` | no | **F4** | Redesign per-asse dell'editor TextStyle (+253/−…). |
| `styles/components/_form-system.scss` | no | **F4** | Stili del form/popover TextStyle (+161). |
| `editors/views/ViewData.tsx` | no | **F8** | Header view: 2 righe → 1 riga `.props-header--view` con breadcrumb inline. |
| `editors/views/nestedView.scss` | no | **F8** | Stili `.props-header--view` + `.view-editor-tab-bar` single-row/overflow-x. |
| `docs/claude-code-log.md` | no | **F7 (misto entry)** | Blocco +92 contiguo, 9 entry di filoni diversi. Vedi §7. |
| `docs/discovery/*.md` (13) | untracked | **F7** | Report discovery di varie sessioni. Vedi §7. |
| `.claude/scheduled_tasks.lock` | no | **RUMORE** | Lock di sessione (sessionId/pid cambiano ogni run). **Mai committare**; valutare `.gitignore`. |

Nessun hunk "nascosto": i file etichettati F1/F3/F4/F8 sono stati grep-ati per `resizable|propagat|PROPAGATE_VIEW_SIZE|laneSeparation|props-header|TextStyle` e non contengono filoni incrociati oltre a quanto sopra.

## 5. I due file misti (il cuore del task)

### 5.1 `VertexAuthoringPanel.tsx` — split index/working-tree già pulito

| Hunk (ancora `@@`) | Stato | Filone | Descrizione |
|---|---|---|---|
| `@@ -1` import: aggiunge `Checkbox` + `defaultResizableForForm` | **STAGED** | **F2** | dipendenze della checkbox |
| `@@ -253` JSX `<div.jj-field><Checkbox "Resizable"> + HelpText` | **STAGED** | **F2** | la checkbox resizable |
| `@@ -10` import `JjodelEvents` | unstaged | **F3** | dipendenza del bottone |
| `@@ -179` `const canResize = draft.resizable ?? defaultResizableForForm(...)` | unstaged | **F3** | gate del bottone |
| `@@ -262` `<Button "Propaga dimensione">` (dispatch `PROPAGATE_VIEW_SIZE`) dentro lo stesso `.jj-field` della checkbox | unstaged | **F3** | il bottone propagazione |

- **Righe condivise?** No: git li tratta come hunk distinti. Il bottone JSX è *adiacente* (nello stesso `<div.jj-field>` creato dalla checkbox) ma è un hunk separato → **separazione pulita in 2 commit possibile**.
- **Dipendenza di build F3→F2**: il bottone usa `defaultResizableForForm` (importato dall'hunk F2) e `draft.resizable` (campo aggiunto da F2 in irTypes). **F2 deve precedere F3.** Committare F2 da solo (checkbox) compila: il file non referenzia ancora `JjodelEvents`/`canResize`/Button.

### 5.2 `EditorV2.tsx` — tre filoni, hunk in regioni disgiunte

Tutto unstaged. Ordine per riga (ancora `@@` = riga file):

| Hunk `@@` | Filone | Descrizione | Confine |
|---|---|---|---|
| `@@ -37` import: `+resolveIRView` (da `irResolveCore`) | **F3** | usato dal listener | testa file |
| `@@ -49` import: **−**`{LANE_DEBUG, reconstructEdgePoints, LaneRect, ReconstructEdge}` (laneSeparation) | **F6** | rimozione lane-separation | testa file |
| `@@ -68` import: `+syncSizeBatchToJjom` | **F3** | usato dal listener | testa file |
| `@@ -103` import: `+toast` (`../Toast/toastDispatch`) | **F3** | warn del listener | testa file |
| `@@ -942 (+64)` `useEffect` **`PROPAGATE_VIEW_SIZE`** | **F3** | il listener: risolve targets = object node che risolvono a `viewId`, source = l'unica istanza selezionata, applica w/h ai nodi RF + `syncSizeBatchToJjom` | **inizia** dopo `const { getOptimalAnchors } = useAutoAnchor();`; **finisce** a `}, [getNodes, setNodes, scheduleLayoutSave, takeSnapshot]);` (~riga 1006) |
| `@@ -966 (−31)` rimozione blocco `if (LANE_DEBUG){ … reconstructEdgePoints … }` | **F6** | rimozione lane-separation (produttore log) | **subito sotto** il listener (~1026) |
| `@@ -1360, -1379, -1405, -1445, -1466, -1486` rimozioni `console.log('[BUG-DIAG-DROP] …')` in `onConnect` / `onConnectEnd` / M1-branch | **F5 (debug-cleanup)** | rimozione strumentazione diagnostica del drop/connect; **behavior-preserving** | nettamente sotto (~1389+) |

- **Confini netti**: F3(imports) e F6(import) coabitano la testa (righe 37–103) ma sono **4 hunk distinti** → separabili con `git add -p` / `git apply --cached`. Il listener (F3, ~942–1006), la rimozione LANE_DEBUG (F6, ~1026) e i BUG-DIAG (F5, ~1389+) sono in **regioni non contigue** → nessun hunk condiviso tra filoni.
- **Build-safety dello split**:
  - laneSeparation.ts (delete, F6) **deve** viaggiare insieme alla rimozione dell'import `@@ -49` (F6): cancellare il file senza togliere l'import — o viceversa — rompe la build. Sono lo **stesso commit F6, atomico**.
  - Se F3 è committato **prima** di F6: EditorV2.tsx conserva ancora `import … laneSeparation` e il file esiste ancora → compila. ✓
  - Se F6 è committato **prima** di F3: gli hunk F3 non ci sono ancora, indipendenti → compila. ✓
  - F5 (rimozione console.log) è sempre build-safe da solo.

## 6. Descrizione semantica di F5 e F6 + decisione keep/drop per Alfonso

### F6 — rimozione lane-separation *(era "WIP lane-separation")*
`laneSeparation.ts` (125 righe) esponeva `LANE_DEBUG`, `reconstructEdgePoints`, `LaneRect`, `ReconstructEdge`. In EditorV2.tsx un blocco gated `if (LANE_DEBUG){…}` ricostruiva la geometria degli edge e la loggava (`[laneA:producer]`), **senza effetto visivo** (nessun offset, nessuna mutazione). Il diff **elimina** modulo + gate + import. È la chiusura di un esperimento di diagnostica lane-separation. Nessun consumatore residuo (grep = 0).
→ **DOMANDA keep/drop**: committare la rimozione (keep-removal, raccomandato — è dead/debug code) oppure ripristinare il modulo (drop-removal)? *Raccomando keep-removal*: CLAUDE.md §2 tratta la strumentazione come da rimuovere in un commit dedicato.

### F5 — debug-cleanup connect *(era "WIP orfano edge/anchor")*
**Non è un refactor edge/anchor.** Sono le rimozioni dei `console.log('[BUG-DIAG-DROP] …')` inseriti per diagnosticare il flusso drop→connect→scelta reference M1. La logica di `onConnect`/`onConnectEnd`/M1-branch **non cambia**: identici rami, identici `return`, identico popup. Solo i log spariscono.
→ **DOMANDA keep/drop**: committare la rimozione (keep-removal, raccomandato — strumentazione temporanea, CLAUDE.md §2) oppure tenere i log (drop-removal)? *Raccomando keep-removal.*

> **Nota**: F6 e F5 sono entrambi "rimozione di strumentazione edge" in EditorV2.tsx (+ file laneSeparation.ts per F6). Possono essere **un unico commit chore** o due. Vedi §7 (commit 6).

## 7. `docs/claude-code-log.md` + docs untracked → filone

### Log (blocco +92 contiguo, 9 entry newest-first)
| Entry `## …` | Filone |
|---|---|
| feat: propaga la dimensione a tutte le istanze (IR) | **F3** |
| docs: discovery TS1 authoring trigger+popover | **F4** |
| feat: TextStyle authoring sulla label (TS1) | già in `e2368cad7` (entry non committata con la feature) → **F7** |
| feat: flag `resizable` su vertex view IR | **F2** |
| docs: discovery stato tipografia IR | **F4** |
| chore: discovery guard single-container | altro (containment) → **F7** |
| chore: discovery co-evoluzione M2→M1 | **F1** |
| chore: discovery authoring panel per edge | già in `9bd8cad9a` (E-ref) → **F7** |
| chore: discovery substrato edge | E0/E-ref → **F7** |

Diverse entry documentano lavoro **già committato** (TS1, edge): il log è "andato in deriva" rispetto ai commit. Due strategie:
- **(semplice, raccomandata)** committare l'**intero blocco log** una volta sola nel commit chore finale (F7). Rischio minimo, nessun `git checkout`/riscrittura.
- **(purista)** far portare a ogni commit di feature la sua entry via il pattern CLAUDE.md §6.1 (backup → `git checkout HEAD -- log` → riscrivi solo l'entry → add → commit → restore). Error-prone su 6 commit.

### Docs discovery untracked → filone
| File | Filone |
|---|---|
| `discovery_2026-07-27_resizable_flag.md` | F2 |
| `discovery_2026-07-27_size_propagation.md` | F3 |
| `lir_2026-07-27_size_propagation.md` | F3 |
| `discovery_2026-07-27_size_readback_object_node.md` | F3 (razionale "no read-back w/h" citato dal listener) |
| `discovery_2026-07-27_ir_text_typography_state.md` | F4 |
| `discovery_2026-07-27_ts1_textstyle_label.md` | F4 |
| `discovery_2026-07-28_properties_panel_redesign.md` | **F8** |
| `discovery_2026-07-27_containment_single_container_guard.md` | altro (F7) |
| `discovery_2026-07-26_coevolution_edge_rename.md` | F1 |
| `discovery_2026-07-26_debug_console_logs.md` | F5 |
| `discovery_2026-07-26_edge_authoring_panel.md` | E-ref (F7) |
| `discovery_2026-07-26_edge_authoring_substrate.md` | E0 (F7) |
| `triage_2026-07-28_working_tree_reconstruction.md` (questo) | F7 |

## 8. Sequenza di commit proposta (builda a ogni passo)

Ogni riga: file/hunk inclusi · messaggio proposto · dipendenze. **Il doc discovery di ciascun filone può viaggiare col suo commit di feature** (alternativa: tutti nel chore F7 finale — decidere in §7).

1. **F2 — resizable** *(l'index è GIÀ esattamente questo → nessuno staging)*
   - `nodes/ObjectNode.tsx`, `nodes/nodeSizing.ts`, `viewpoint/ir/irStyle.ts`, `viewpoint/ir/irTypes.ts`, `VertexAuthoringPanel.tsx`(hunk checkbox).
   - `feat(editor-v2): add resizable flag to IR vertex views and enable rect/rounded resize`
   - Indipendente. Builda da solo.
2. **F1 — fix co-evoluzione**
   - `hooks/useEditorMode.ts` (intero).
   - `fix(editor-v2): include feature names in the M2 signature so id-preserving renames re-derive modeInfo`
   - Indipendente (ordine vs F2 libero).
3. **F3 — propagazione size** *(dipende da F2)*
   - `sync/canvasToJjom.ts`(intero), `events/registry.ts`(intero), `VertexAuthoringPanel.tsx`(hunk bottone), `EditorV2.tsx`(hunk F3: import `@@37/68/103` + listener `@@942`).
   - `feat(editor-v2): propagate a resized instance size to all instances of an IR view`
   - **Build**: richiede F2 (bottone usa `defaultResizableForForm`/`draft.resizable`). Staging per-hunk su EditorV2.tsx e VertexAuthoringPanel.tsx.
4. **F4 — TextStyle field+editor (atomico 4 file)**
   - `authoring/LabelEntryEditor.tsx`, `authoring/TextStyleField.tsx`(new), `authoring/TextStyleEditor.tsx`, `styles/components/_form-system.scss`.
   - `feat(editor-v2): TextStyle trigger+popover field and per-axis editor redesign`
   - **Build**: i 4 file sono un unico blocco (LabelEntryEditor → TextStyleField → TextStyleEditor). Splittarli rompe la build. Indipendente da F2/F3 (`TextStyle` è già in HEAD da TS1).
5. **F8 — redesign header view**
   - `editors/views/ViewData.tsx`(hunk header), `editors/views/nestedView.scss`.
   - `feat(editors): collapse the view header into a single inline-breadcrumb row`
   - Indipendente. (La sola SCSS tab-bar overflow è separabile ma stessa sessione.)
6. **F6 + F5 — cleanup strumentazione edge** *(solo se Alfonso fa keep-removal)*
   - `utils/laneSeparation.ts`(delete), `EditorV2.tsx`(hunk F6 import `@@49` + blocco `@@1026`; hunk F5 BUG-DIAG `@@1389+`).
   - `chore(editor-v2): remove edge debug instrumentation (lane-separation + connect diag logs)`
   - **Build**: delete file + rimozione import atomici. Indipendente da F3 (regioni disgiunte). *Oppure* due commit distinti F6 / F5.
7. **F7 — chore docs + log** *(finale)*
   - Tutti i `docs/discovery/*.md` untracked + questo triage + `docs/claude-code-log.md`(intero, strategia semplice §7).
   - `chore: add discovery reports and update the prompt log`
   - Nessun impatto build.

**Mai committato**: `.claude/scheduled_tasks.lock` (rumore).

Ordine build-safe verificato: 1→2→3 (F2 prima di F3); 4/5/6/7 in qualsiasi posizione dopo (indipendenti). `npm run build` verde atteso a ogni passo.

## 9. Strategia di ricostruzione dell'index (raccomandazione, NON eseguita)

**Raccomandazione: (b) NON fare `git reset` — lavorare sull'index attuale.**
Motivo (una riga): l'index è **già** esattamente il filone F2 (verificato: 5 file, `VertexAuthoringPanel` col solo hunk checkbox), quindi il commit 1 è pronto senza staging; un `git reset` butterebbe uno stato noto-buono e reintrodurrebbe il rischio di mis-staging di F2, senza alcun vantaggio. Per i commit 3/6 basta staging **per-hunk mirato** (`git add -p` o `git apply --cached` con patch salvate) su `EditorV2.tsx` e `VertexAuthoringPanel.tsx`; i file F1/F4/F8 si aggiungono interi.

## 10. Dubbi e domande aperte per Alfonso

1. **keep/drop F6** (rimozione lane-separation) e **keep/drop F5** (rimozione console.log BUG-DIAG): raccomando keep-removal per entrambi. Un commit unico o due?
2. **Strategia log** (§7): intero blocco nel chore F7 (semplice) oppure split per-entry §6.1 (purista)?
3. **Discovery doc**: ciascuno col suo commit di feature, o tutti nel chore F7? (Raccomando: tutti in F7 per non gonfiare i commit feature; il doc F8 e F1 potrebbero però stare coi rispettivi commit.)
4. **F8**: la SCSS `.view-editor-tab-bar` single-row/overflow è nello stesso commit del redesign header, o commit UI a parte? (Raccomando insieme: stessa sessione redesign.)
5. **`.claude/scheduled_tasks.lock`**: aggiungerlo a `.gitignore` (fuori scope di questo task, ma il file continuerà a sporcare `git status` a ogni sessione)?
6. **Ordine F1 vs F2**: liberi (indipendenti); ho messo F2 prima solo perché l'index è già pronto. Confermi?
