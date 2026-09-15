# Discovery: ri-hosting dell'authoring del simbolo, modale + card leggera (D15)

**Data**: 2026-08-15. **Autore**: sessione Cowork, lettura dell'albero `git archive HEAD` (`c4aee51da`) nel container.
**Natura**: Fase 1 read-only del prompt D15. Ipotesi da falsificare: che il pannello si possa
ri-ospitare in una modale senza fork e senza rompere il ciclo draft/commit.

## Obiettivo

Rispondere alle cinque domande del prompt D15: chi ospita `VertexAuthoringPanel`, qual e' il
pattern modale canonico, cosa serve alla card leggera e alla modale, collisioni dei nomi nuovi,
stacking context esistente.

## File letti (path completi)

- `frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx` (integrale, 504 righe)
- `frontend/src/components/editor-v2/viewpoint/authoring/irTabs.tsx` (righe 1-120)
- `frontend/src/components/editor-v2/viewpoint/authoring/SymbolCatalogPicker.tsx` (righe 1-60)
- `frontend/src/components/editor-v2/viewpoint/authoring/SymbolPreview.tsx` (interfaccia, righe 41-55)
- `frontend/src/components/editor-v2/viewpoint/ir/symbolRecognition.ts` (testata e firma, righe 1-59)
- `frontend/src/components/editors/views/ViewData.tsx` (integrale, 295 righe)
- `frontend/src/components/editors/Info.tsx` (righe 1330-1360)
- `frontend/src/components/editors/PropertiesWithTreeView.tsx` (struttura, righe 515-610)
- `frontend/src/components/import/ImportSummaryModal.tsx` (integrale, 308 righe)
- `frontend/src/components/import/ImportSummaryModal.scss` (righe 1-60)
- `frontend/src/events/registry.ts` (integrale, 117 righe)
- `frontend/src/components/ui/index.ts` (riga 74)
- `frontend/src/styles/tokens/_z-index.scss` e `frontend/src/styles/tokens.css` (blocchi z)
- `frontend/src/App.tsx` (righe 165-190)
- `frontend/src/view/viewElement/view.tsx` (riga 550)

## Findings

### 1. Chi ospita il pannello oggi

1. **Catena di hosting**: selezione nel tree → `Info.tsx:1345` monta `ViewData` (con
   `showBack={false}`) dentro `<section className="properties-tab properties-panel">`
   (Info.tsx:1337); il guscio del rail e' `PropertiesWithTreeView.tsx:515`
   (`.properties-with-tree-view`: rail-header a 529, card del tree a 578, card Properties).
   Secondo host: `NestedView.tsx:493` (standalone, con back).
2. **La barra a cinque tab vive in `ViewData`, i corpi nel pannello** (irTabs.tsx:8-15).
   `ViewData.tsx:92-100` (`renderIRPanel`): ogni tab rende lo STESSO elemento
   `<VertexAuthoringPanel view activeTab identity>`; React riconcilia per tipo e posizione,
   quindi il cambio tab aggiorna una prop e non rimonta: il singolo draft e il debounce da
   300 ms sopravvivono (R-A, strada B). Tab per kind vertex: applies-to, structure,
   appearance, text, piu' source gated su advanced (irTabs.tsx:46-51).
3. **Ciclo draft/commit** (VertexAuthoringPanel.tsx): seed = clone di `view.ir` (riga 79);
   reset SOLO al cambio di `view.id` (93-98); `dirtyRef` (90); validazione eager + commit
   debounced 300 ms (101-113): `(view as any).ir = draft` (109) → `set_ir` in
   `view/viewElement/view.tsx:550` → `SetFieldAction` (whole-object replace: flip del
   refToken → recompile → live preview). Semantica live, nessun apply/cancel.
4. **Alla chiusura (unmount) il commit pendente si PERDE**: la cleanup dell'effect (riga 111)
   cancella il timer; un unmount entro 300 ms dall'ultimo edit valido butta l'edit. Oggi il
   caso non si da' (il cambio tab non smonta, R-A: `display: none`, irTabs.tsx:63-64); una
   modale che smonta alla chiusura lo introdurrebbe. Riguarda il criterio (d) del prompt.
5. **La sezione Symbol oggi**: corpo Appearance, VertexAuthoringPanel.tsx:335-362: chip di
   riconoscimento (340-358, `recognizeSymbol(draft.shape)` a ogni render) +
   `SymbolCatalogPicker` (359-361, sezione a disclosure). Border a 397-411; `DEFAULT_BORDER`
   `#334155` a 58. Sizing (Resizable + «Propagate size») a 433-455; Badges a 458-466. Il
   pannello dispatcha gia' un evento del registry (`PROPAGATE_VIEW_SIZE`, 448-450): il
   bottone di lancio ha un precedente identico.
6. **Il text style e' annidato per label**: non esiste una sezione «Text style» separata; sta
   dentro `LabelEntryEditor.tsx:105` (`TextStyleField`) sotto `LabelListEditor` nel corpo
   Text. «Anatomia» a granularita' di componente = corpo Appearance + corpo Text interi;
   estrarre il solo text style sarebbe un fork.

### 2. Pattern modale canonico (§8.7)

7. `ImportSummaryModal.tsx`: montato UNA volta alla radice (`App.tsx:177`, accanto a
   GlobalDrawer, HelpDrawer, ExplainModal, WelcomeModal, righe 172-177); listener su window
   per `JjodelEvents.IMPORT_SUMMARY_SHOW` (84-91); stato locale `useState` (79); Esc chiude
   (93-100); click sul backdrop chiude, `stopPropagation` sul corpo; `role="dialog"`,
   `aria-modal`; focus al bottone di chiusura (102-105); `if (!summary) return null` (115).
   Nessun portal: backdrop `position: fixed; inset: 0` con
   `z-index: var(--z-modal, 9999)` (ImportSummaryModal.scss:1-10).
8. **Registry**: `events/registry.ts`, gruppo `JjodelEvents`; la convenzione recente e'
   kebab-case (`'jjodel:import-summary-show'`, riga 66). L'apertura passa da un evento del
   registry, mai da stringa hardcoded (CLAUDE.md regola 25).
9. **Non esiste un componente `Modal` riusabile**: `components/ui/index.ts:74` ha
   `// export { Modal } from './Modal';` commentato e il file `./Modal` NON esiste nel
   barrel (ls senza risultati, exit 2, controllo positivo sugli altri componenti della dir).
   La riga commentata e' vestigiale: la modale si costruisce col pattern del punto 7.

### 3. Card leggera e modale: cosa serve

10. **La card non edita, quindi non le serve il draft**: legge l'ir PERSISTITO
    (`view.ir.shape`), chiama `recognizeSymbol(shape): readonly SymbolPreset[]`
    (symbolRecognition.ts:59), mostra `shape.border?.color ?? '#334155'` e dispatcha il
    lancio con `detail: { viewId: view.id }`. Per la miniatura, `SymbolPreview` accetta
    `preset` e `width` (default 56, la stessa del mockup) quando `matches[0]` esiste.
11. **Alla modale basta `view`**: `activeTab` e `identity` sono opzionali
    (VertexAuthoringPanel.tsx:23-36). Con `activeTab === undefined` si mostrano TUTTI i
    corpi (irTabs.tsx:57-64, «pre-partition rendering»), inclusi Applies to, Structure e
    Source: troppo. Non esiste oggi un meccanismo per un SOTTOINSIEME di corpi: o la modale
    pilota `activeTab` con una sua mini-barra ristretta ad Appearance/Text (zero modifiche
    al contratto), o si estende `irTabBodyStyle` con una visibilita' a insieme (modifica
    piccola ma di contratto). Senza `identity` i campi identita' non si rendono: giusto per
    la modale.
12. **La modale alla radice risolve la view dal pointer**: l'evento porta `viewId`; il
    componente usa `LPointerTargetable.fromPointer` (stesso schema dei pannelli). Guardia:
    pointer non risolvibile (view cancellata mentre la modale e' aperta) → chiusura.

### 4. Collisioni di nomi (grep con `command grep`, controllo positivo: `recognizeSymbol` → 3 file)

13. Tutti a ZERO occorrenze in `src` (ts, tsx, scss, css): `SymbolEditor`, `symbol-editor`,
    `SYMBOL_EDITOR`, `symbolEditor`, `SymbolModal`, `symbol-modal`, `SymbolCard`,
    `symbol-card`, `OPEN_SYMBOL`, `open-symbol`, `symbol-light`, `SymbolAnatomy`,
    `ir-symbol`. Nomi candidati liberi: componente `SymbolEditorModal` (+
    `SymbolEditorModal.scss`, blocco `.symbol-editor-modal`), card `SymbolCard` o classi
    `.symbol-card*`, evento `SYMBOL_EDITOR_OPEN: 'jjodel:symbol-editor-open'`.

### 5. Z-index e overlay esistenti

14. Scala attiva in `styles/tokens/_z-index.scss:14-40`: `--z-modal-backdrop: 9000`,
    `--z-modal: 9999`, `--z-alert: 10000`, `--z-loading: 99999`, `--z-toast: 999998`.
    ATTENZIONE: esiste una seconda scala piu' vecchia in `styles/tokens.css:204-211`
    (`--z-modal: 1050`); quale vinca dipende dall'ordine di caricamento.
    `ImportSummaryModal` si protegge con `var(--z-modal, 9999)`: riusare la formula
    identica, nessun valore nudo, nessuno stacking context nuovo.
15. Il rail sta sotto: z interni fino a 900-1000
    (`properties-with-tree-view.scss:1426`, «above canvas + rc-dock, below canvas
    context-menu (1000) and modals»). Una modale a `--z-modal` copre tutto il necessario.

## Dipendenze e rischi

- **R1, il rischio centrale: doppio mount = draft stantio.** Se la modale monta un SECONDO
  `VertexAuthoringPanel` mentre il rail ne tiene uno per Applies to/Structure/Source, i due
  draft sono indipendenti e il commit e' whole-object: dopo un edit nella modale, il draft
  del rail e' stantio (si resetta solo al cambio di `view.id`, righe 93-98) e il PRIMO edit
  successivo nel rail riscrive l'intero ir col clone vecchio, annullando in silenzio gli
  edit della modale. Il difetto esiste gia' in potenza (undo esterno con pannello aperto)
  ma D15 lo renderebbe quotidiano. Opzioni sul tavolo per la Fase 2: (a) reseed del draft
  quando `view.ir` cambia sotto un mount non-dirty; (b) un solo mount spostato via portal
  (stato preservato, nessun secondo draft); (c) surfaces disgiunte + reseed alla chiusura
  della modale. Da decidere in chat prima del diff.
- **R2: perdita del commit pendente alla chiusura** (finding 4). Serve un flush del draft
  valido e dirty allo smontaggio del pannello (o un hosting che non smonta). Criterio (d).
- **R3: due scale di z-token** (finding 14): usare la formula di ImportSummaryModal.
- **R4: critical zone.** `viewpoint/authoring/` e' in §3.1: Layer Impact Report in chat
  prima del diff di Fase 2 (il prompt lo richiede anche senza file di §3.2). Nessuna
  scrittura D-layer nuova: il percorso resta `set_ir` esistente; niente VersionFixer
  (nessun cambio di schema persistito).
- **R5: `EdgeAuthoringPanel`** riceve lo stesso trattamento in una slice successiva: fuori
  scope qui, annotato come richiesto dal prompt.
- **R6: UI in inglese.** Il mockup e' in italiano («Apri editor simbolo», «Ripristina
  preset»): nel codice le stringhe vanno in inglese (vincolo del prompt), per esempio
  «Open symbol editor».

## Domande aperte per Alfonso

- **Q1: cosa resta nella barra del rail per una view vertex?** (a) cinque tab invariati con
  il corpo Appearance sostituito dalla card e Text che resta nel rail; (b) Appearance e Text
  escono dalla barra e la card diventa l'unico corpo «Symbol» del rail, con l'anatomia
  intera (Appearance + Text) nella modale. Il memo dice «l'anatomia intera (form, marker,
  assi del bordo, fill, text style) vive in una modale», che spinge verso (b); il mockup
  frame B non mostra la barra. Proposta motivata alla fine della Fase 1 in chat.
- **Q2: Sizing (Resizable, «Propagate size») e Badges** stanno nel corpo Appearance: seguono
  l'anatomia nella modale (il mockup mette Resizable nella modale; i corpi si spostano
  interi, finding 6) o restano nel rail? Proposta: seguono il corpo, nessuno smembramento.
- **Q3: lo stato effimero «modificato» + «Ripristina preset»** (header della modale nel
  mockup, stato di sessione del picker secondo il memo D14) entra in questa slice o nella
  successiva? Il perimetro del prompt non lo elenca: proposta di rimandarlo per tenere la
  diff minima, dichiarandolo nel report di chiusura.
