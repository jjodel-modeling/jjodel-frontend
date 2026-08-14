# Memo — Slice C della serie U (U-3 + U-7 + ritiro del portale)

**Data**: 2026-08-10 (notte, sessione Cowork autonoma)
**Base**: `docs/discovery/discovery_2026-08-08_uniformazione_card_properties.md` (§D1, §D3,
§D6), `docs/decisions.md` sezione arco U (Q4, Q5, Q7), ancore riverificate stanotte su
HEAD `5c6c2f3de`.
**Perimetro ereditato**: Slice C = U-3 (titoli di sezione) + U-7 (doppie label dei toggle)
+ ritiro del portale di `ViewData` (spostato qui da Slice D per ratifica del 9/8).

## Ancore riverificate stanotte (post voce 6)

- Il portale è vivo: `frontend/src/components/editors/views/ViewData.tsx:203`
  (`document.querySelector('.properties-panel-header__actions')`) e `:223`
  (`createPortal`); lo slot host è `PropertiesWithTreeView.tsx:459`. NOTA: il path nel
  report dell'8/8 era `editors/ViewData.tsx`, oggi il file sta in `editors/views/`.
- Le label del §D6 sono ora in inglese (voce 6): `MatchingSection.tsx:84` «All
  metaclasses (*)», `:122` «Apply only if (predicate)», `:157` «exclusive». La tabella
  delle 16 occorrenze va ricontata in Fase 0: righe e testi sono driftati, il pattern no.
- `FormSection`: 9 call site in `VertexAuthoringPanel`, zero in Edge/Row (invariato).
- `props-section__title`: vivo in `Info.tsx:49` (card astratta).

## Decisioni da ratificare (C-1..C-3)

**C-1 — U-3, meccanismo unico dei titoli di sezione.** Due strade:
(a) **adottare `FormSection`** anche in Edge/Row/Applies-to (il primitivo esiste, è già lo
standard del tab vertex; uniforma DOM e tipografia; diff medio, ~13 siti dove oggi un
`jj-field-label` fa da titolo);
(b) variante CSS minima: modificatore `jj-field-label--section` (12px/700/uppercase come
`FormSection`) sui soli siti-titolo, zero cambi di DOM.
**Raccomandazione: (a)**, perché la gerarchia assente è un problema di semantica del
markup, non solo di stile, e la strada (b) lascerebbe tre meccanismi in vita (contro lo
scopo dichiarato di U-3). La card astratta (`props-section__title`) resta fuori: migra
quando si unificano i pannelli, non in questa slice.

**C-2 — U-7, applicazione della policy Q5 con strada (b) del §D6**: togliere la prop
`label` del `Toggle` nei casi di ridondanza pura; toglierla riscrivendo la label di campo
nei casi di ridondanza parziale; NON toccare i casi in cui la seconda label porta
informazione (wildcard, predicate, exclusive) né i 3 casi in cui è l'unica label.
Niente migrazione a `jj-toggle-row` in questa slice (cambio di layout riga/colonna, va
guardato a parte). Q5 è già ratificata: qui si ratifica solo la strada (b).

**C-3 — Ritiro del portale (Q4, già ratificata l'8/8)**: l'help va all'host (riga
PROPERTIES), il back nell'header della view, rimozione di `createPortal` + `headerSlot`
+ querySelector globale in `ViewData.tsx`. Da eseguire come primo commit della slice: è
l'unico con rischio funzionale, meglio isolarlo.

## Struttura proposta della slice (3 commit bisecabili)

1. `refactor(properties): retire the ViewData header portal (Q4)` — C-3, hard stop visivo.
2. `refactor(properties): single section-title mechanism in the authoring panels (U-3)` —
   C-1, hard stop visivo **doppio** (Q7: card view E card astratta).
3. `refactor(properties): drop redundant Toggle labels per Q5 levels (U-7)` — C-2, hard
   stop visivo.

Ogni commit col suo gate (`typecheck` Δ0, `build`, vitest area authoring) e smoke di
Alfonso prima del successivo. Fase 0 obbligatoria con report in `docs/discovery/`
(`discovery_2026-08-10_slice_c_ancore.md` o data di esecuzione): riconteggio delle
occorrenze U-7 post voce 6 e verifica ancore del portale.

## Cosa serve da te

Ratifica di C-1 (a o b), C-2, C-3 (conferma dell'ordine). Col tuo ok genero il prompt
esecutivo completo COSA/DOVE/COME/RIFERIMENTI per Claude Code.
