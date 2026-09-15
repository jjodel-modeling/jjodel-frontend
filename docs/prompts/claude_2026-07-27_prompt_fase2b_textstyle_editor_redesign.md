# Fase 2b (implementazione): redesign del corpo `TextStyleEditor` - via checkbox, stato "Default" nei controlli, toggle ƒx per riga

> Follow-up della Fase 2 (`TextStyleField` + popover, gia' landata). Go-ahead di Alfonso.
> **Scope: redesign della sola UI per-asse di `TextStyleEditor`.** Semantica IR invariata.

## Framing

Il popover Tipografia funziona ma l'authoring per-asse ha un aspetto poco professionale: una
**checkbox per ogni asse** (Font, Dimensione, Peso, Stile, Colore) impilata in verticale, piu' un
segmentato "Fisso | Condizionale" per riga. Va sostituito con controlli sempre visibili, in cui lo
stato "non impostato" vive **dentro** il controllo come opzione **"Default"**, e la condizionalita'
si accende con **una piccola icona `ƒx` per riga**.

**La semantica IR NON cambia.** "Default" su un asse = quella chiave viene rimossa dall'oggetto
`TextStyle`; tutti gli assi a Default = `style` collassa a `undefined`. E' esattamente cio' che oggi
fa la checkbox spenta: si riusa lo stesso collasso, cambia solo come lo si attiva.

Leggi `CLAUDE.md` (§4.3 collision check, §15.2 overflow) e `docs/claude-code-log.md`. Branch:
`alfonso-frontend-jjtl`.

**Prima di editare, leggi per intero**: `TextStyleEditor.tsx` (struttura per-asse attuale + la
funzione/onChange che collassa a `undefined`) e il componente `ConditionalEditor`
(`components/ui/...`) per capire come rende la modalita' Fisso/Condizionale. Non riscrivere a memoria.

## Target visivo

Ogni asse e' una **riga compatta**: `[nome asse] [controllo] [icona ƒx]`. Cinque righe: Font,
Dimensione, Peso, Stile, Colore. Nessuna checkbox. Nessun segmentato "Fisso/Condizionale" visibile
nello stato normale.

Riferimento visivo (mockup approvato da Alfonso): colonna "Proposta" in
`textstyle_popover_mockup.html` (allegato in chat, non nel repo). In sintesi: label asse a sinistra
(~64px, 11-12px muted), controllo che riempie, icona `ƒx` ghost a destra (24px); righe separate da
un divider sottile; header "Tipografia" + reset gia' esistenti restano.

## COSA / DOVE / COME

### Regola trasversale (semantica, non negoziabile)
Riusa la **stessa logica di collasso** gia' presente in `TextStyleEditor` (quella che oggi scatta
allo spegnimento della checkbox). Un asse portato a "Default"/vuoto deve produrre lo stesso identico
risultato di prima (chiave rimossa; se tutti gli assi spariscono, `onChange(undefined)`). **Non
introdurre un nuovo write path**: sposti solo il *trigger* dell'unset dalla checkbox al valore
"Default" del controllo.

### COME.1 - Controlli con stato "Default" (stato normale, no ConditionalEditor)
Nello stato non-condizionale, ogni asse renderizza **direttamente** il controllo semplice (NON
montare `ConditionalEditor` in questo stato: e' qui che nasce l'aspetto pulito). Mapping:

- **Font** (`fontFamily`): `Select`. Opzioni: `Default`, `Sans`, `Mono`. `undefined` -> "Default".
- **Dimensione** (`fontSize`): `NumberInput` con suffisso `px`. Vuoto = placeholder "Default" =
  asse `undefined`. Mantieni la validazione soft esistente (suggerito 8-32) ma **consenti lo
  svuotamento** per tornare a Default.
- **Peso** (`fontWeight`): `Select`. Opzioni: `Default`, `Normal`, `Medium`, `Semibold`, `Bold`.
- **Stile** (`fontStyle`): `Select`. Opzioni: `Default`, `Normale`, `Corsivo` (normal/italic).
- **Colore** (`color`): `ColorPicker` con stato "Default" (nessun colore scelto = asse `undefined`).
  Se il `ColorPicker` esistente non ha uno stato "non impostato", rendilo con un trigger/swatch che
  mostri "Default" finche' non si sceglie un colore; **non** forzare un colore di default reale
  (romperebbe l'ereditarieta').

La prima opzione "Default" di ogni Select seleziona l'unset (rimozione chiave). Mostra il valore
"Default" in muted per distinguerlo da un valore autorato.

### COME.2 - Icona ƒx: entry point della modalita' condizionale (per riga)
L'icona `ƒx` (usa un'icona Bootstrap coerente, es. `bi-lightning-charge` o simile; scegline una e
usala) e' il toggle Fisso<->Condizionale **posseduto da `TextStyleEditor`**, per singolo asse:

- Stato dell'icona **derivato dal valore**: se il valore dell'asse e' un `Conditional`
  (usa `isConditionalValue` da `components/ui`), l'icona e' accesa e la riga mostra l'editor
  condizionale; se e' un valore nudo o `undefined`, l'icona e' spenta e si mostra il controllo
  semplice (COME.1).
- **Click da spenta -> accesa**: converti il valore corrente in forma condizionale
  (`{ when: <predicato vuoto>, then: <valore corrente o default dell'asse> }`) e mostra l'editor
  condizionale sotto la riga.
- **Click da accesa -> spenta**: collassa al valore `then` (o a `undefined` se non significativo),
  tornando al controllo semplice.

Nella modalita' condizionale (icona accesa) **riusa `ConditionalEditor`** per quell'asse, passandogli
come `renderValue` il controllo semplice dell'asse (Select/NumberInput/ColorPicker). L'area
condizionale si espande **sotto** la riga (grid full-width), con un contorno tratteggiato leggero per
distinguerla (vedi mockup).

**Decisione sul toggle interno del `ConditionalEditor`**: se `ConditionalEditor` espone un modo per
NON renderizzare il proprio switch "Fisso/Condizionale" (perche' ora lo guida la `ƒx`), usalo. Se
NON lo espone, **NON modificare `ConditionalEditor`** (e' condiviso): lascia che mostri il suo switch
dentro l'area espansa; e' accettabile perche' compare solo quando l'utente e' gia' in condizionale.
**Se per ottenere il layout pulito ti accorgi di dover modificare `components/ui/ConditionalEditor`,
FERMATI e chiedi in chat** (impatterebbe gli altri editor che lo usano).

### COME.3 - Layout / SCSS
Righe compatte come da mockup. Classi namespaced `jj-textstyle-*` (riusa quelle gia' introdotte in
Fase 2 dove sensato; verifica con `grep -r` prima di aggiungerne di nuove, §4.3). Non toccare
l'header "Tipografia" + reset. Griglia riga: `nome | controllo | ƒx`. 8px grid, 11px label, palette
slate/cyan. Nessun layout shift indotto dall'espansione condizionale oltre l'altezza della riga
(il popover gia' scrolla internamente).

### COME.4 - Investigazione: il secondo "Sans" sotto la card Tipografia
Nello screenshot di Alfonso, **sotto** la card "Tipografia" compare un `Select` "Sans" a tutta
larghezza che non dovrebbe esserci. Identifica cosa lo renderizza (probabile: il trigger di
`TextStyleField` reso come `Select` invece che come summary compatto; oppure un family control
duplicato).

- Se e' il **trigger di `TextStyleField`** reso come select/dropdown: correggilo perche' renda il
  **summary compatto** ratificato (testo "Default" quando nulla e' autorato; altrimenti gli assi
  autorati in ordine `family · size · weight · style` + swatch colore in coda; asse condizionale ->
  glifo condizione). NON un `Select`.
- Se e' un **duplicato/residuo** dei controlli tipografia: rimuovilo.
- Se e' un controllo **estraneo** alla tipografia (es. un font base del nodo): **lascialo** e
  riportalo in chat.
- Se l'identita' non e' chiara leggendo `TextStyleField.tsx` / `TextStyleEditor.tsx` /
  `LabelEntryEditor.tsx`, **FERMATI**, scrivi una nota in `docs/discovery/` e chiedi prima di
  toccarlo.

## Scope file (stretto)

`git add` mirato, **mai** `git add .`:
1. `viewpoint/authoring/TextStyleEditor.tsx` (redesign per-asse - file principale)
2. `viewpoint/authoring/TextStyleField.tsx` (SOLO se il secondo "Sans" e' il suo trigger, COME.4)
3. SCSS authoring (classi `jj-textstyle-*`)
4. `docs/claude-code-log.md` (entry)

**Fuori scope (NON toccare)**: `components/ui/ConditionalEditor*` (condiviso: hard stop se servisse),
`irTypes.ts`, `irCompile.ts`, `IRNodeContent.tsx`, `nodeSizing.ts`, `_typography.scss`.

## Verifica (build + visiva su http://localhost:3001/, hard-refresh)

Non committare prima della conferma visiva di Alfonso.
1. Popover senza stile: 5 righe con controllo su "Default", nessuna checkbox, nessun segmentato.
2. Font=Sans, Peso=Bold, Dimensione=20: la label a schermo cambia; il nodo content-hug si allarga.
3. Riporta un asse a "Default": la label torna al default della superficie; nell'IR quella chiave
   sparisce; tutti a Default -> `style === undefined`.
4. ƒx su un asse (es. Peso): la riga si espande in condizionale; imposta un predicato; a schermo la
   label segue il predicato; ƒx di nuovo -> torna al controllo semplice senza perdere il valore.
5. Il popover non introduce layout shift oltre l'altezza; se l'area condizionale e' alta, scrolla
   dentro il popover.
6. Il secondo "Sans" non c'e' piu' (o e' stato spiegato in chat come controllo estraneo).
7. Round-trip: riseleziona/ricarica la view: assi autorati identici; key-drop preservato.
8. `npm run build` verde.

## Log e commit

- `docs/claude-code-log.md`: tipo `refactor`, prompt in una riga, file toccati, esito.
  **Nome del documento prompt**: `2026-07-27 17:47`.
- Commit (dopo conferma visiva):
  `refactor(editor-v2): typography axis controls - drop checkboxes, Default state, per-row ƒx toggle`

## Hard stop

FERMATI e chiedi in chat se:
- ottenere il layout richiede di modificare `components/ui/ConditionalEditor` (condiviso);
- il collasso a `undefined` (key-drop) si romperebbe con la ristrutturazione;
- l'identita' del secondo "Sans" non e' chiara dai file in scope (scrivi nota in `docs/discovery/`);
- servisse toccare un file fuori scope.

## RIFERIMENTI

- Mockup approvato: `textstyle_popover_mockup.html` (chat, colonna "Proposta").
- Ratifiche UX: `ratifiche_2026-07-27_typography_ux.md` (KB) - pattern, summary rule, "Default" chip.
- Fase 2 (base su cui si innesta): `2026-07-27_prompt_fase2_textstyle_field_popover.md` (KB),
  commit `e2368cad7` (TS1) + il commit di Fase 2.
- Discovery: `docs/discovery/discovery_2026-07-27_ts1_textstyle_label.md` (primitive UI: Q6 -
  `ConditionalEditor`/`isConditionalValue`, `Select`, `NumberInput`, `ColorPicker`).

---
**Nome del documento prompt**: 2026-07-27 17:47
