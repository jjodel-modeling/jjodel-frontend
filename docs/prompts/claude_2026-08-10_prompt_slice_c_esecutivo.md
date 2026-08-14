# Prompt Claude Code — Slice C della serie U (C-3 portale, C-1/U-3 titoli, C-2/U-7 label)

**Data**: 2026-08-10 10:30
**Ratifiche**: C-1 opzione (a), C-2, C-3 ratificate da Alfonso il 10/8 mattina (memo
`claude/2026-08-10_memo_slice_c_u3_u7.md`). Q4, Q5, Q7 già a registro in
`docs/decisions.md` (sezione arco U).
**Esecuzione**: 3 commit bisecabili, HARD STOP visivo di Alfonso dopo ciascuno. NESSUN
push: resta ad Alfonso a fine slice.

## FASE 0 — verifica ancore (obbligatoria, report su file)

Le righe citate sotto vengono dalla discovery dell'8/8 e sono driftate (voce 6 ha
tradotto le stringhe in inglese; ViewData si è spostato). Prima di ogni edit:

1. Verificare il portale: `frontend/src/components/editors/views/ViewData.tsx` —
   attesi `headerSlot` (useState ~:201), `document.querySelector('.properties-panel-header__actions')`
   (~:203), `createPortal(headerActions, headerSlot)` (~:223). Slot host:
   `frontend/src/components/editors/PropertiesWithTreeView.tsx` ~:459. Censire COSA
   contiene `headerActions` (bottone back, help, altro) e chi altro legge
   `.properties-panel-header__actions` (grep globale).
2. Ricontare i siti U-3 (titoli di sezione resi con `div.jj-field-label`):
   attesi in `EdgeAuthoringPanel.tsx`, `RowAuthoringPanel.tsx`, `MatchingSection.tsx`,
   `EnableIRPanel.tsx` (~13 siti totali; la discovery dell'8/8 li elenca per riga, i
   numeri vanno riverificati). Distinguere sito-titolo da label di campo: il criterio è
   il ruolo nel markup (intesta un gruppo di campi), non la classe.
3. Ricontare le doppie label U-7 (prop `label` di `Toggle` sotto una
   `jj-field-label` che dice quasi la stessa cosa): attese ~16 coppie più 3 casi
   label-unica da NON toccare (`FieldSegmentEditor`, label center dell'edge,
   «Include else branch»). Classificare ogni coppia nelle tre classi di Q5
   (ridondanza pura / parziale / informativa) col testo INGLESE corrente.
4. Report OBBLIGATORIO in `docs/discovery/discovery_2026-08-10_slice_c_ancore.md`
   (obiettivo, file letti con path completi, censimento per commit, rischi, eventuali
   domande). L'hard stop di Fase 0 non è completo finché il report non è scritto e
   committato col Commit 1 (P4). Se un'ancora non corrisponde, STOP e segnalare.

## Commit 1 — C-3, ritiro del portale (Q4)

`refactor(properties): retire the ViewData header portal (Q4)`

- In `ViewData.tsx`: rimuovere `headerSlot`, l'effect col `querySelector` globale e la
  `createPortal`; le azioni si rendono inline nell'header della view (il ramo
  fallback `: headerActions` esiste già).
- Destinazioni ratificate da Q4: l'help va all'host (riga PROPERTIES,
  `PropertiesWithTreeView.tsx`), il back resta/torna nell'header della view. Se il
  censimento di Fase 0 mostra che `headerActions` contiene altro, fermarsi e chiedere.
- Lo slot `<div className="properties-panel-header__actions" />` resta solo se l'help
  spostato lo usa; se rimane vuoto e senza lettori, rimuoverlo nello stesso commit
  (verificare con grep che nessun altro lo legga).
- Gate: `typecheck` (baseline 33, Δ0), `build`, vitest dell'area; HARD STOP visivo:
  header della view con back funzionante, help raggiungibile dalla riga PROPERTIES,
  nessun elemento duplicato, su entrambe le card (Q7).

## Commit 2 — C-1 opzione (a), meccanismo unico dei titoli (U-3)

`refactor(properties): FormSection as the single section-title mechanism (U-3)`

- Nei soli siti-titolo censiti in Fase 0 (Edge, Row, Applies to/Matching, EnableIR):
  sostituire il `div.jj-field-label` usato come titolo con `FormSection`
  (`components/ui/FormSection`), il primitivo già standard del tab vertex (9 call
  site). Le label di campo restano `jj-field-label`, invariate.
- NON toccare: `props-section__title` (card astratta, migra con l'unificazione dei
  pannelli), `VertexAuthoringPanel.tsx` (già conforme), classi CSS esistenti (nessun
  rename, regola 2).
- Se `FormSection` richiede un wrapping dei figli che cambia la struttura DOM di un
  sito in modo non banale, annotarlo nel report ed elencare i siti nel closing report.
- Regola 19: il commit tocca più di 5 file — elencare prima i file col cambiamento
  previsto in ciascuno, poi procedere.
- Gate come sopra; HARD STOP visivo DOPPIO (Q7): gerarchia titolo/label leggibile su
  card view E card astratta, tab Applies to / Structure / Appearance / Text di un
  edge e di un vertex, nessun layout shift.

## Commit 3 — C-2, doppie label dei toggle (U-7, policy Q5)

`refactor(properties): drop redundant Toggle labels per Q5 levels (U-7)`

- Classe 1 (ridondanza pura, es. `Visible`/`visible`, `Editable`/`editable inline`):
  rimuovere la prop `label` del `Toggle`, tenere la label di campo.
- Classe 2 (ridondanza parziale, es. `Separator`/`row separators`): rimuovere la prop
  `label` riscrivendo la label di campo se il censimento mostra che perde informazione
  (es. `Separator` → `Row separators`).
- Classe 3 (la label del toggle porta informazione: wildcard, predicate, exclusive):
  NON toccare. Idem i 3 casi label-unica.
- Nessuna migrazione a `jj-toggle-row` (fuori scope per ratifica C-2); nessun uso
  nuovo della prop `description` di `Toggle`.
- Gate come sopra; HARD STOP visivo: i toggle di Applies to / liste label / badge /
  compartment leggibili senza doppioni, i tre casi informativi intatti.

## Chiusura

- Entry in `docs/claude-code-log.md` per ciascun commit (formato §21.2, Prompt
  document name «2026-08-10 10:30»); il report di Fase 0 viaggia col Commit 1, mai
  untracked (P4). Se le entry attive superano 20, la rotazione è un commit a sé.
- `git add` per path espliciti (regola 17). Diff completo nel closing report (P6).
- NESSUN push. A slice verificata, il push lo fa Alfonso insieme ai commit già in coda
  sul branch.

## RIFERIMENTI

- `docs/discovery/discovery_2026-08-08_uniformazione_card_properties.md` §D1 (header e
  portale), §D3 (titoli), §D6 (doppie label), §D10 (skin B4 su entrambe le card)
- `docs/decisions.md`, sezione «Uniformazione delle due property card (arco U)»: Q4,
  Q5, Q7
- `claude/2026-08-10_memo_slice_c_u3_u7.md` (ratifiche C-1..C-3, ancore riverificate)
- CLAUDE.md regole 1-2, 15-19; docs/PROTOCOL.md P4, P6, P9
