# 2026-08-29 01:20 — Livello 2: gruppi Structure del rettangolo nel rail

Prompt originale: `docs/design/design_handoff_instance_node/PROMPT_structure_tab.md`
(copiato nel bundle come chiesto). Referenza autoritativa: `Instance Node Proposal.dc.html`,
Turno 7 (`id="7"`, `7a`, `7b`, `7c`), letto in HTML grezzo — non dal riassunto del prompt.

## Hard stop iniziale

Il bundle in repo si fermava al Turno 5 (`grep -o -i "turn[oi]* *[0-9]"` → 2, 3, 4, 5, con
controllo positivo su `Turno`). Riportato insieme alla lista dei 13+3 file (regola 19) e a
tre decisioni irreversibili. Alfonso ha copiato il bundle aggiornato e ratificato:

1. **Forma IR**: `structure?` annidata su `VertexViewIR`, non otto chiavi piatte su
   `ShapeSpec` — «questi campi sono struttura, non geometria del simbolo». Stessa logica per
   la tabella capability: modulo separato, non campi su `ShapeDescriptor`.
2. **Mappa widget↔renderer**: `color→swatch`, `textarea→code`, `select→enumChip`,
   `checkbox→boolean`, `number→numberUnit`, più `reference`/`link → refPill`.
   `date`/`progress`/`truncatedText` restano senza widget. `text→truncatedText` è la coppia
   che il prompt non nominava e che l'esempio di 7c richiede (`widgets.color = "text"` →
   «Testo semplice»).
3. **Definizione di «copre»**: badge, gradino 0 e Reset compaiono SOLO quando il widget mappa
   su un renderer DIVERSO da quello dichiarato dal metamodello, o su nessuno. Accordo
   (`widgets.color='color'` su `@renderer=color`) = silenzio, chip resta `auto`.

4. **La view vince nel FORM, non sul canvas** (R-STR-5, ratificata dopo la consegna).
   `FormSpec` e' per sua definizione «how the same view renders as a FORM of editable widgets
   instead of a symbol on the canvas»: il Turno 7c e' stato **allineato a questa lettura**, non
   il contrario. Il gradino 0 dice «vince nel form», il footer mostra il renderer del canvas
   con la sua etichetta (`· on the canvas`), il gradino 1 resta visibile col badge
   `overridden by current view`. Estendere la vittoria della view alla riga del canvas —
   `decide` esportato da `valueRenderer.ts` piu' la decisione di riga in `ObjectNode` — e'
   **debito registrato e non aperto** (R-STR-6).

## Scostamenti dichiarati

- **`Type` offre quattro segmenti, non tre.** 7a disegna Inline/Chip/Badge e 7b
  Inline/Chip/Hidden; la tabella dei campi dichiara `typeDisplay` senza vincolo di Symbol,
  quindi mostrarne tre diversi per forma sarebbe un vincolo inventato. I quattro entrano
  tutti nel segmented control.
- **Evidenza in formato reale.** 7c scrive `@renderer=color`; il formato su cavo è
  `jjodel/renderer=swatch` (`rowViewAnnotations.ts`). La riga di provenienza cita quello:
  un autore che legge `@renderer` e cerca quella stringa non trova nulla.
- **Stringhe in inglese** (R-4), incluse quelle che il Turno 7 scrive in italiano.
- **`RENDERER_LABELS` si è spostata** da `RendererInspector.tsx` a `valueRenderer.ts`, con
  re-export dal punto di prima. Obbligata: importarla dal componente tira dentro il barrel
  del joiner e quindi Monaco, che dereferenzia `window` all'import — e avrebbe rotto
  all'import `formAuthoring.test.ts`, che era verde. È il quattordicesimo file, oltre la
  lista concordata, e vale come scostamento di perimetro.
- **`Field compartments` scompare** sui Symbol senza compartimento inline (7b lo dice nella
  riga riassuntiva). Il prompt diceva «resta in coda invariata»: resta invariata quando c'è,
  ma il Symbol la toglie. I compartimenti nell'IR non sono toccati.
- **`StructureGroups.scss`** è il quindicesimo file: le righe di 7a sono label a sinistra /
  controllo a destra, che `jj-field` (label sopra) non esprime. Stessa ragione per cui
  esiste `FormAuthoringBody.scss`.

## Reperto

Il `Select` condiviso emette SEMPRE un `<option value="">` col placeholder. La prima
versione del gruppo Name avrebbe potuto persistere `''` come `name.position`. Corretto con
l'idioma di Padding: il placeholder porta l'etichetta del default e un pick vuoto rimuove la
chiave. Trovato dalla sonda, non dalla lettura.

## Verifica

- `npm run typecheck`: 33 = baseline, zero errori nei file toccati.
- `npm run build`: exit 0, zero righe di errore, solo il chunk-warning.
- `npx vitest run`: 1808 passed / 0 failed (erano 1759; +49 = i tre file nuovi), i 9 file
  rotti all'import sono la baseline nota.
- `npm run smoke`: 12 passed / 0 failed / 3 skipped.
- Sonda `_tmp_structure_tab.ts` sul rail vero: **23 check ALL GREEN**, 7a e 7b.

## Non coperto

Il Turno 7c non ha sonda a schermo: servirebbe un `FormSpec.widgets` autorato più
un'annotazione `jjodel/renderer` sulla stessa feature, e poi l'inspector aperto da una riga
del compartimento. Coperto da 21 asserzioni unitarie (`widgetRenderer.test.ts`), non dal
pixel. Dark mode fuori perimetro per prompt.
