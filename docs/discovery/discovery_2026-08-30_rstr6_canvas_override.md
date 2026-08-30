# Discovery — R-STR-6: dov'era davvero il debito

Data: 2026-08-30. Sonde: `frontend/scripts/smoke/_tmp_rstr6_measure.ts` (passo 1,
misura) e `_tmp_rstr6_verify.ts` (verifica, 13/13), nessuna delle due committata.
Fixture: `RowViewSmoke` sul dev server, `AllNine` con tredici attributi che
coprono l'intera libreria dei renderer.

Il prompt chiede il passo 1 prima di ogni diff: **misura lo stato, non assumerlo**.
La misura ha confermato che l'override non è onorato sul canvas, e ha **spostato il
difetto in un altro file** rispetto a quello che R-STR-6 aveva registrato.

---

## 1. Che cosa diceva R-STR-6

> Estendere la vittoria della view alla riga del canvas richiede `decide` esportato
> da `nodes/valueRenderer.ts` e la decisione di riga cambiata in
> `nodes/ObjectNode.tsx`.

Misurato: **la seconda metà è falsa**. `ObjectNode` non aveva bisogno di una
decisione diversa — aveva bisogno di un input che non riceveva — e il file dove la
riga non poteva onorare nulla è un altro.

## 2. La misura

### 2.1 Ramo nativo — la libreria è viva (controllo positivo)

Senza viewpoint IR, il nodo `allNine_valued` dipinge **dieci renderer distinti**:

```
["boolean","code","dash","date","enumChip","numberUnit","progress","refPill","swatch","truncatedText"]
```

`tint` → `swatch`, `visible` → `boolean`, `ratio` → `progress`, `cfg` → `refPill`.
Il selettore funziona: ogni «non rende» più sotto è una misura, non un errore di
ricerca.

### 2.2 Ramo IR — nessun renderer, mai

Con il viewpoint IR Demo attivo, il nodo ha 12 `.ir-row` e i renderer distinti sono:

```
["none"]
```

Zero marker `mm-object__*` su qualsiasi riga. E per **ogni** widget della mappa
R-STR-3 scritto in `FormSpec.widgets`, la riga non cambiava:

```
widgets={tint: color    } atteso swatch         reso -> none   text="tint=Green"
widgets={tint: textarea } atteso code           reso -> none   text="tint=Green"
widgets={tint: select   } atteso enumChip       reso -> none   text="tint=Green"
widgets={tint: checkbox } atteso boolean        reso -> none   text="tint=Green"
widgets={tint: number   } atteso numberUnit     reso -> none   text="tint=Green"
widgets={tint: text     } atteso truncatedText  reso -> none   text="tint=Green"
widgets={tint: reference} atteso refPill        reso -> none   text="tint=Green"
widgets={tint: link     } atteso refPill        reso -> none   text="tint=Green"
```

Nello **stesso istante** l'inspector diceva chip `view`, gradino 0 vincente,
gradino 1 col badge `overridden by current view` — e il pannello dipingeva la
libreria (`mm-object__swatch`, `mm-object__scalar`), che è il controllo positivo
che il selettore vede la libreria quando c'è.

Conferma statica: `grep` per `RowValue|detectValueRenderer|swatch` su
`viewpoint/ir/*.ts*` non trova nulla al di fuori dei **commenti** di
`widgetRenderer.ts`. Il ramo IR non ha mai avuto una libreria di renderer.

### 2.3 Il ramo nativo non vede mai un `formSpec`

Terza misura, quella che chiude il ragionamento. Un ir che porta `form` non supera
l'hash strutturale di `isMigratedDefaultView` (R-STR-7), quindi non è delegato:
va al ramo IR. L'unica altra porta è `compiled.viewId === IR_DEFAULT_OBJECT_VIEW_ID`,
che ritorna `true` **prima** di guardare l'ir — ma misurato,
`LPointerTargetable.fromPointer('Pointer_IRDefaultObjectView')` restituisce
**nulla**: la view di default built-in non è un `DViewElement` a cui si possa
scrivere. La scrittura è stata tentata e ha risposto `NO VIEW`; le righe native
sono rimaste `tint→swatch`, `visible→boolean`, e nessun nodo IR è comparso.

### 2.4 Il quadro

| | vede `FormSpec.widgets` | ha la libreria dei renderer |
|---|---|---|
| ramo nativo (`ObjectNode` + `RowValue`) | no (non ci arriva mai) | **sì**, dieci renderer |
| ramo IR (`IRNodeContent`) | sì (l'inspector la legge lì) | **no**, testo nudo |

La riga che **poteva** dipingere non vedeva l'override; la riga che **vedeva**
l'override non sapeva dipingere. Il debito non era una precedenza da cambiare in
`ObjectNode`: era un ponte mancante fra i due rami.

## 3. Il fix

Tre pezzi, nessuno dei quali aggiunge una seconda decisione al componente canvas
(vincolo esplicito del prompt).

1. **`nodes/valueRenderer.ts` — `SlotShape.viewRenderer` e il gradino 0.** La
   decisione resta una sola funzione. Il gradino 0 sta **sotto** i quattro guardiani
   di stato (`brokenRef`, `dash`, `refPill`, `collection`) e **sopra** la regola 1:
   - sotto i guardiani, perché `dash`/`collection`/`brokenRef` sono STATI del valore
     e R-STR-3 non mappa nessun widget su di essi. Una view non può dichiarare pieno
     uno slot vuoto.
   - sopra la regola 1, perché è esattamente ciò che il gradino 0 è definito a
     coprire (R-STR-4), ed è ciò che l'inspector già disegna col badge.
   La mappatura widget→renderer **non** è fatta qui: `viewpoint/ir/widgetRenderer.ts`
   importa `valueRenderer`, e leggerla all'indietro chiuderebbe un ciclo. Arriva già
   mappata, e viene validata come `rendererOverride` — un nome fuori vocabolario
   **cade**, non svuota la riga (principio del fallback).
2. **`nodes/ObjectNode.tsx`** riempie `viewRenderer` da
   `irResolution?.compiled.formSpec?.widgets?.[nome]`, la stessa sorgente che
   l'inspector legge: una chiave, una provenienza. Questo chiude il ramo nativo.
3. **`viewpoint/ir/IRNodeContent.tsx`** riceve `renderViewWidget?(featureName)`, una
   callback opzionale, e la usa nel segmento `value` **solo se restituisce
   qualcosa**. `ObjectNode` la implementa passando per `findRowByFeatureName` — lo
   stesso ponte per nome che R-STR-7 ha già introdotto per l'inspector — e
   restituisce `null` quando la view non dichiara nulla. L'interprete continua a non
   sapere niente di `SlotRow`.

**Perché la callback e non la libreria dentro l'interprete**: `slotRows` è già
costruito sul ramo IR (misurato da R-STR-7, e ri-verificato qui: il ponte per nome
risolve), quindi il lato che ha già sia il modello di riga sia la libreria è
`ObjectNode`. Portare `RowValue` dentro `viewpoint/ir/` avrebbe messo il modello di
riga del ramo nativo dentro l'interfaccia dell'interprete.

## 4. Perché non degrada niente

Il gate è la **presenza** di un widget dichiarato. Nessun progetto esistente cambia
resa se nessuno ha usato il Form tab su quella feature. Verificato a schermo:

- riga IR senza override: `renderer: none`, `text: "tint=Green"` — identica a prima;
- dopo il Reset (`form` rimosso): torna a `none`, cioè al valore di partenza;
- ramo nativo a inizio e a fine giro: `swatch` → `swatch`.

## 5. La copy dell'inspector, allineata

R-STR-5 aveva scritto nel pannello la propria delimitazione: il gradino 0 portava il
tag «winning rule **in the form**» e il footer un inciso «· on the canvas», per
tenere distinte due risposte diverse. Ora la risposta è una: il tag torna «winning
rule» e l'inciso sparisce. Verificato: `tag=plain, aside=false`, e il footer dipinge
lo **stesso** renderer della riga (`["code"]` contro `code`).

Il selettore SCSS `.inode-inspector__result-scope` resta orfano in
`nodes/rendererInspector.scss`. **Non rimosso**: è una regola inerte, la Regola 9
chiede di non togliere codice apparentemente inutilizzato, e c'è una sessione
parallela sugli scss orfani. Segnalato qui perché sia raccolto lì.

## 6. Il confine, dichiarato

**Sul ramo IR il gradino 1 continua a non dipingere.** Una dichiarazione di
metamodello `jjodel/renderer=swatch`, da sola, lascia la riga IR a testo nudo
(misurato: `B2 -> renderer: none`). È deliberato e non è un residuo di questa slice:

- R-STR-6 riguarda la vittoria della **view**, ed è quello che è stato aperto;
- estendere il gradino 1 al ramo IR cambierebbe la resa di **ogni** view autorata
  che nomina un attributo, senza che nessuno l'abbia dichiarato — l'opposto del gate
  scelto al §4.

Chi vorrà aprirlo lo apra come fronte proprio, con la stessa disciplina.

## 7. Cosa NON è verificato

- `property.render = edge-label` e la dark mode: fuori scope per prompt.
- Il comportamento con una view che dichiara un widget su una feature **assente**
  dall'istanza (riga placeholder): `findRowByFeatureName` la risolve sul
  `slot: { value: '', featureName }` del placeholder, che è vuoto, quindi il
  guardiano `dash` vince. Coerente, ma non provato a schermo.
