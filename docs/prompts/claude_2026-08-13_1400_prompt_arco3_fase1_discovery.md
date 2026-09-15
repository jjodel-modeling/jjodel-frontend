# Arco 3, il form dell'inspector. Fase 1: discovery read-only

**Nome del documento prompt**: 2026-08-13 14:00
**Tipo**: discovery (nessuna modifica al codice)
**Base attesa**: `alfonso-frontend-jjtl`. Origin è a `93800c7`; il working tree locale può
essere avanti (almeno il fix del booleano obbligatorio, non pushato).

---

## Premessa: cos'è l'arco 3

Il rail destro del project editor sta venendo ridisegnato in archi successivi. L'arco 1 ha
consegnato il guscio, l'arco 2 l'identity block, la postura Browse/Focus, la Focus bar e la
scala entity. L'arco 3 riguarda **il form dell'inspector**, cioè il contenuto del pannello
proprietà, e comprende quattro passi:

- **A**, la griglia a due colonne `84px 1fr` che sostituisce lo stack label-sopra-campo
- **B**, il controllo segmentato di multiplicity al posto dei due stepper e del chip read-only
- **C**, i flag come chip in postura Browse e come switch in postura Focus
- **D**, la fusione di `ADVANCED` e `ADVANCED STATE` in una sola disclosure

Specifica di riferimento: `docs/redesign/rail/README.md` §7, passi 3 e 4 del build order.
Definition of done del design: nove controlli visibili a 420×1000 senza scroll.

**Questo prompt non implementa nessuno dei quattro passi.** Esegue la sola Fase 1: la
discovery che deve dire se il passo A è fattibile come descritto, e a quale prezzo. Il passo
A è quello che tocca più superficie di tutti, e va misurato prima di essere scritto.

---

## COSA

Rispondere a sei domande sul codice, con misura e non con impressione. Cinque erano ipotesi
del piano dell'arco; la sesta è emersa da una lettura di origin fatta prima di scrivere
questo prompt e ha cambiato di grado il rischio del passo A.

Per ogni domanda, il report deve riportare **il comando eseguito, il suo output e la
conclusione**, in quest'ordine. Una conclusione senza il comando che la sostiene non vale.

### Q1. Quanti consumatori vivi ha `Info.tsx`

Su origin `Info` risulta importato da due file: `PropertiesWithTreeView.tsx:4` e
`components/panels/ElementPropertiesDrawer.tsx:2`. Il secondo però non è importato da
nessuno, e `components/editor-v2/EditorV2.tsx:105` porta un commento tombale
(«ElementPropertiesDrawer import removed, bottom drawer disabled»).

Verificare sul working tree: **`ElementPropertiesDrawer` è montato da qualche parte, oppure
è un file morto che tiene in vita un import?** Serve il controllo positivo sulla stessa
ricerca, cioè dimostrare che la grep trova qualcosa quando deve trovarlo, non concludere dal
silenzio.

Perché conta: se il drawer è morto, il perimetro CSS del passo A si chiude sul solo rail. Se
è vivo, la griglia lo raggiunge e serve una scopatura più stretta.

### Q2. La griglia 84px si può scopare a `.properties-with-tree-view--rail`

Il modificatore è applicato in un punto solo, `PropertiesWithTreeView.tsx:515`, sulla radice
e solo quando `isFloating`. Il foglio `properties-with-tree-view.scss` (1776 righe) lo usa a
partire da `:1493`.

Verificare la catena di specificità contro le regole `!important` che intercettano `.jj-field`
o i suoi discendenti. Le due note al piano risultano essere:

- `components/editors/views/data/viewapplyto.scss:815-818`, regola
  `.properties-tab.properties-panel .jj-field select` con `border` e `box-shadow` in
  `!important`
- `components/editors/info-improvements.scss`, intorno a `:1170-1180`, `box-shadow` di focus
  in `!important`

Domanda precisa: **queste regole toccano il layout di `.jj-field`, o solo la pelle dei
controlli interni?** Se toccano solo bordo e ombra di `select` e degli stati di focus, non
ostacolano un `display: grid` sul contenitore, e va detto esplicitamente. Se invece esiste
una qualsiasi regola `!important` su `display`, `margin`, `grid-template-columns` o
`flex-direction` applicata a `.jj-field`, va nominata.

### Q3. Inventario reale dei consumatori di `.jj-field`

Questa è la domanda che il piano poneva come «quali kind del form attraversano la griglia», e
la formulazione era troppo stretta. Misurato su origin, `.jj-field` compare in **18 file
`.tsx`**, e `Info.tsx` non è nemmeno il primo:

| file | occorrenze |
|---|---|
| `components/editor-v2/viewpoint/authoring/EdgeAuthoringPanel.tsx` | 27 |
| `components/editors/Info.tsx` | 23 |
| `components/editors/views/data/InfoData.tsx` | 17 |
| `components/editor-v2/viewpoint/authoring/FieldCompartmentListEditor.tsx` | 14 |
| `VertexAuthoringPanel.tsx`, `RowAuthoringPanel.tsx` | 10 ciascuno |
| `PaletteData.tsx` | 9 |
| `MatchingSection.tsx`, `LabelEntryEditor.tsx`, `BadgeListEditor.tsx` | 8 ciascuno |
| `ViewParentingFields.tsx` | 5 |
| `EnableIRPanel.tsx` | 4 |
| altri sei file | da 1 a 3 |

Ricostruire questa tabella sul working tree e confrontarla con quella qui sopra. Segnalare
ogni scostamento, perché uno scostamento significa che il working tree ha lavoro non pushato
in questa zona.

Aggiungere il conteggio lato SCSS: su origin `viewapplyto.scss` porta 24 regole che citano
`.jj-field`, `properties-with-tree-view.scss` ne porta 14, `_form-system.scss` 4,
`info-improvements.scss` 3.

### Q4. Bound illimitato: `-1` o `999`

In `Info.tsx` convivono le due convenzioni:

- `-1` sul modello: `formatMultiplicity` a `:132` rende `'*'` per `u === -1`; i due
  `PropertiesNumberInput` di Lower e Upper hanno `min={-1}` a `:431` e `:435`
- `999` lato render: `:521-523` (`upperBound === -1 ? 999`), `:621-622`
  (`if (upperBound < 0) upperBound = 999`), `:687` (`upperBound >= 999`), `:783`
  (`upperBound >= 999 ? '*'`)

**La domanda va risolta sul write path, non sul render.** Serve stabilire quale valore
finisce davvero nel modello quando l'utente sceglie un upper bound illimitato, seguendo la
catena da `PropertiesNumberInput` fino alla scrittura sul proxy `LModel`. Il `999` sembra una
sostituzione locale ai soli editor di valori M1, ma «sembra» non basta.

Perché è la domanda più importante delle sei: il passo B sostituisce quei due stepper con
cinque segmenti che scrivono i bound direttamente. Se il segmented scrive `999` dove il
modello vuole `-1`, o viceversa, **il danno è dentro il modello e non a schermo**, non dà
errore di compilazione e non si vede in una verifica visiva.

### Q5. Il ramo view attraversa la griglia

Il piano assumeva di no. La lettura di origin dice il contrario, e va verificata:

`Info.tsx:13` importa `ViewData`, e la rende a `:1245` quando l'elemento selezionato è un
`DViewElement` (commento a `:1221`). `ViewData.tsx:26-29` importa a sua volta
`VertexAuthoringPanel`, `RowAuthoringPanel`, `EdgeAuthoringPanel` e `EnableIRPanel`, oltre a
`InfoData`, `PaletteData` e `GenericNodeData`.

Se la catena è quella, **tutti i pannelli di view authoring rendono dentro il rail**, quindi
dentro il perimetro del modificatore `--rail`. Confermarla o smentirla leggendo il codice, non
deducendola da questi riferimenti.

### Q6. Il perimetro `--rail` è più largo del form dell'inspector

Questa è la domanda nuova, ed è la conseguenza di Q3 e Q5 messe insieme.

Se il modificatore `--rail` sta sulla radice del rail (Q2) e i pannelli di authoring rendono
dentro il rail (Q5), allora una regola scritta come

```scss
.properties-with-tree-view--rail .jj-field { display: grid; grid-template-columns: 84px 1fr; }
```

non tocca i 23 campi di `Info.tsx`: ne tocca **circa 96 in più**, distribuiti su diciassette
altri file, molti dei quali hanno un layout proprio pensato per la label sopra il campo.

Il report deve dire, con misura:

1. quali dei 18 file consumatori rendono effettivamente dentro il perimetro `--rail`, e quali
   no (per esempio perché montati altrove, o solo dentro modali e popover);
2. se esiste un selettore intermedio già presente nel markup che permetta di scopare la
   griglia al solo form dell'inspector senza toccare l'authoring, e quale;
3. se quel selettore non esiste, quale sarebbe il punto minimo dove introdurne uno, tenendo
   presente che **non si rinominano classi esistenti** e che l'aggiunta di una classe nuova va
   proposta nel report, non eseguita in questa fase.

La risposta a questa domanda decide se il passo A è un passo solo, oppure va spezzato in A1
(scopatura del perimetro) e A2 (griglia).

---

## DOVE

File da leggere, tutti sotto `frontend/src/`. I numeri di riga sono presi su origin `93800c7`
e vanno usati come orientamento, non come ancore fisse: il working tree può essere avanti.

| file | perché |
|---|---|
| `components/editors/Info.tsx` (1485 righe) | il form; kind a `:299-599`, `TYPE & BOUNDS` a `:423-441`, bounds a `:521-523` e `:621-622` |
| `components/editors/PropertiesWithTreeView.tsx` (708 righe) | il guscio; il modificatore `--rail` a `:515` |
| `components/editors/properties-with-tree-view.scss` (1776 righe) | il foglio del rail; blocco `--rail` da `:1493` |
| `styles/components/_form-system.scss` | `.jj-field` a `:945-948`, `.jj-field-label` a `:951-959` |
| `components/editors/info-improvements.scss` | uno dei due `!important` noti |
| `components/editors/views/data/viewapplyto.scss` | l'altro `!important`, e 24 regole su `.jj-field` |
| `components/editors/views/ViewData.tsx` | la catena verso i pannelli di authoring |
| `components/panels/ElementPropertiesDrawer.tsx` | il secondo importatore di `Info` |
| `components/editor-v2/viewpoint/authoring/` | i pannelli, per il conteggio di Q3 |
| `docs/redesign/rail/README.md` §7 | la specifica del design |
| `docs/decisions.md` | il registro; R-RAIL-12, R-RAIL-25, R-RAIL-26 rilevanti |

---

## COME

### Read-only, senza eccezioni

Questa fase **non modifica nessun file sorgente**. Niente edit, niente refactoring, niente
«già che c'ero». L'unica scrittura consentita è il discovery report.

Nessun comando git di scrittura. Nessun commit.

### Discovery report, obbligatorio

**Path**: `docs/discovery/`
**Nome file**: `discovery_2026-08-13_arco3_fase1_griglia_84.md`

Se la cartella non esiste, crearla (esiste già e contiene dodici report precedenti).

Contenuto minimo:

- **Obiettivo** della discovery, in due righe
- **File letti**, con path completi
- **Le sei domande**, ciascuna con comando eseguito, output e conclusione
- **Dipendenze e rischi** individuati
- **Domande aperte per Alfonso**, cioè le decisioni che la discovery non può prendere da sola

L'hard stop non è raggiunto finché il report non è scritto su file. L'output del terminale non
conta come report.

### Hard stop

Scritto il report, **fermarsi**. Non proporre patch, non anticipare il passo A, non aprire
branch. L'analisi si fa in chat a partire dal report salvato, e la Fase 2 parte solo dopo
go-ahead esplicito.

### Log

Al termine, aggiungere l'entry in `docs/claude-code-log.md` secondo il formato di CLAUDE.md,
tipo `docs`, con `**Nome del documento prompt**: 2026-08-13 14:00`.

Attenzione alla rotazione: il log attivo è sopra soglia (23 intestazioni contro 20). Se il
prompt di rotazione non è ancora passato, aggiungere l'entry senza ruotare e segnalarlo, che è
un'altra voce e un altro commit.

---

## RIFERIMENTI

### Misure già prese, da riverificare e non da assumere

Tutto quanto sopra viene da una lettura di `origin/alfonso-frontend-jjtl` a `93800c7` fatta il
13 agosto. **Non viene dal working tree locale**, che può contenere lavoro non pushato. Ogni
numero di riga e ogni conteggio va riconfermato prima di essere usato come base. Uno
scostamento non è un errore del prompt: è un'informazione, e va scritta nel report.

### Vincoli di registro attivi

- **R-RAIL-12**: la sezione `NODE` resta nel guscio, gated su `advanced`. Non va mappata su
  una sezione «Appearance» dentro l'inspector. La discovery non deve proporlo.
- **R-RAIL-25**: `styles/components/_form-system.scss` è globale (importato da
  `styles/style.scss:2`) e ha consumatori vivi oltre a `Info`. Fuori perimetro.
- **R-RAIL-26**: `components/editors/info-improvements.scss` fuori perimetro.
- **P2**: nessun identificatore esistente va rinominato, classi CSS incluse.
- **Regola 9**: non si rimuove codice apparentemente inutilizzato. Se `ElementPropertiesDrawer`
  risulta morto (Q1), il report lo scrive e basta; non lo cancella.

### Perimetro negativo del passo A, per orientare la discovery

Quando la Fase 2 arriverà, il passo A **non** potrà toccare: `_form-system.scss`,
`info-improvements.scss`, la critical zone (`useJjomSync.ts`, `portDistribution.ts`), il tree,
l'header del rail, il canvas. La discovery serve a stabilire se la griglia è scrivibile
rispettando questo perimetro, o se il perimetro va rinegoziato. **Se va rinegoziato, è una
domanda per Alfonso, non una decisione da prendere nel report.**

### Verifica prima dell'hard stop

Il progetto deve continuare a compilare, il che in una fase read-only è banale ma va comunque
controllato: `npm run typecheck` deve dare la baseline attesa (33 errori sul Mac, di cui 19 di
casing) e non un numero diverso. Se il numero è diverso, il working tree ha già qualcosa di
rotto prima di questa fase, e va detto in cima al report.
