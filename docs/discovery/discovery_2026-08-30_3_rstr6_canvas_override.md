# Discovery 2026-08-30 — R-STR-6: l'override della view sul canvas

**Data**: 2026-08-30
**Branch**: `alfonso-frontend-jjtl`, HEAD `a1bbcb0c0`
**Prompt**: `docs/prompts/PROMPT_rstr6_canvas_override.md` — R-STR-6, «l'override della view vince anche sul canvas»
**Fase**: 1 (read-only). **Zero sorgenti toccati.**
**Esito**: **hard stop.** La misura risponde alla domanda del prompt con una terza risposta
che il prompt non prevedeva, e che sposta il perimetro fuori da quello registrato in R-STR-6.

---

## 0. L'ipotesi che la misura doveva falsificare

Il prompt pone una domanda binaria (§Metodo, punto 1):

> con un override di view attivo (chip `view` sull'inspector), il nodo canvas rende col
> widget della view **o** col gradino 1?

E prevede due esiti: o `viewWidget` copre già tutto — allora la slice è un report di conferma
più i test che pinnano — oppure alcuni renderer non onorano l'override, e si allinea la
decisione di riga.

**Nessuno dei due si verifica.** Sul ramo dove l'override esiste, il nodo non rende né col
widget della view **né** col gradino 1: rende **testo semplice**, perché quel ramo non
consulta affatto la libreria dei renderer.

---

## 1. Le due superfici del canvas, misurate

Sonde `scripts/smoke/_tmp_rstr6_canvas.ts` e `_tmp_rstr6_native.ts` (fuori commit), sul
fixture `RowViewSmoke` — la classe `AllNine`, tredici attributi scelti per coprire l'intera
libreria. Zero errori di pagina in entrambe le corse.

### 1.1 Ramo NATIVO — la libreria è viva, e non c'è niente da sovrascrivere

`allNine_valued` senza viewpoint IR attivo, 13 label e 13 celle appaiate per indice:

| feature | renderer reso | testo |
|---|---|---|
| `tint` | **swatch** | Green |
| `stroke` | **chip** (enumChip) | DASHED |
| `visible` / `locked` | **boolean** | true / false |
| `widthPx` | **numberUnit** | 240**px** |
| `plainCount` | **numberUnit** | 17 (nessuna unità — il controllo del punto 3) |
| `created` | **date** | 2026-08-28 · 2g |
| `description` | **scalar** (truncatedText) | Rendered as a rounded rectangl… |
| `ratio` | **progress** | 0.68 |
| `guard` | **code** | self.width > 0 |
| `notes` | **dash** | — |
| `tags [7]` | **chip** ×4 + `+3` (collection) | draft review urgent v2 |
| `cfg` | **refPill** | Config_main |

**Dieci renderer distinti**: la libreria è viva sul canvas, e `guard` prova che il **gradino 1
è onorato** (`jjodel/renderer=code` → `code`, non `scalar`).

Ma su questo ramo **non esiste alcun override da onorare**: `viewWidget` si legge da
`irResolution?.compiled.formSpec?.widgets` (`ObjectNode.tsx:821`), e sul ramo nativo
`irResolution` o è `null`, o è una default view migrata che non porta `formSpec`. È esattamente
ciò che R-STR-7 aveva già misurato. Il ramo nativo è quindi **già conforme**, per assenza di
domanda.

> **Reperto di metodo.** La prima stesura della sonda cercava `.mm-object__row` e tornava
> `rows: []`, che il gate leggeva come «nessun renderer». Quella classe **non esiste**: il
> compartment nativo è una griglia di coppie `.mm-object__slot-label` + `.mm-object__slot-value`
> emesse dentro un `Fragment`, senza wrapper di riga (`ObjectNode.tsx:1234-1250`). Un controllo
> positivo senza segnale non è un controllo: la tabella qui sopra viene dalla query riscritta,
> che appaia per indice e misura 13 su 13.

### 1.2 Ramo IR — testo semplice, per tutte e tredici le righe

Viewpoint `IR Demo AllNine` attivo (installato **e** attivato dal `<select>` reale: installare
non basta, avvertimento del report R-STR-7). Nodo `.mm-object[data-viewid=Pointer_IRDemoFlagView_AllNine]`:

```
renderer distinti sul ramo IR: ["none"]
```

Tutte e 13 le righe. `tint=Green` come testo, non uno swatch. `visible=true` come testo, non
un boolean. `ratio=0.68` come testo, non una progress. E soprattutto **`guard=self.width > 0`
come testo, non `code`**: sul ramo IR non è disonorato solo il gradino 0 della view — è
disonorato anche il **gradino 1 del metamodello**, che sul ramo nativo funziona.

Causa, letta nel sorgente e coerente con la misura: `IRNodeContent` rende il segmento `value`
come `<span>{row.value}</span>` (`IRNodeContent.tsx:568-578`). **Non importa
`detectValueRenderer` né alcun renderer**: `command grep -n "detectValueRenderer" IRNodeContent.tsx`
→ exit 1, mentre lo stesso simbolo ha 5 call site altrove (controllo positivo).

### 1.3 L'override, widget per widget della mappa R-STR-3

Scritto `form.widgets` sulle due view del viewpoint, un caso per ogni widget, e riletto il DOM:

| `widgets` scritto | renderer atteso (R-STR-3) | reso sul ramo IR |
|---|---|---|
| `description: color` | swatch | **none** (testo) |
| `tint: textarea` | code | **none** (testo) |
| `description: select` | enumChip | **none** (testo) |
| `description: checkbox` | boolean | **none** (testo) |
| `description: number` | numberUnit | **none** (testo) |
| `guard: text` | truncatedText | **none** (testo) |
| `description: reference` | refPill | **none** (testo) |

**7 casi su 7 non onorati.** Nessun renderer della mappa passa.

**Controllo positivo — l'override è arrivato al modello, non è la scrittura a mancare.**
Aperto l'inspector sulla riga `tint` con `widgets.tint = "textarea"`, il pannello dice:

```
tint · AllNine  [view]
Detection ladder
0  Declared by the view — winning rule in the form
   FormSpec.widgets.tint = "textarea" · Open the Form tab
1  Metamodel declaration — no annotation on tint
2  Parsed value — "Green" is not a colour literal
3  CSS colour enum — winning rule   [overridden by current view]
4  Attribute name — not evaluated
· on the canvas ·  Reset
```

Chip su `view`, gradino 0 vincente, gradino 1 col badge. La superficie della ladder funziona
esattamente come R-STR-7 l'ha consegnata. **È la riga sotto che non la ascolta.**

---

## 2. Perché il perimetro di R-STR-6 non è eseguibile come scritto

R-STR-6 registra il debito così:

> Estendere la vittoria della view alla riga del canvas richiede `decide` esportato da
> `nodes/valueRenderer.ts` e la decisione di riga cambiata in `nodes/ObjectNode.tsx`.

La decisione di riga in `ObjectNode.tsx` è `slotRows`, e la chiamata è a `:648`
(`const decision = detectValueRenderer(slot)`). Ma **sul ramo IR quella decisione non disegna
niente**: `slotRows` è calcolato sopra il return anticipato di `:832`, e sul ramo IR è
consumato **solo** dal ponte dell'inspector (`findRowByFeatureName`, R-STR-7). Il rendering
della riga lo fa `IRNodeContent`, che ha un modello dati suo.

Cambiare `:648` allineerebbe quindi una decisione che **sul ramo dove l'override esiste è una
scrittura morta** — il caso che CLAUDE.md §5 chiama per nome («verificare i consumatori prima
di assumere che un output sia portante»), e che qui si verifica alla lettera.

E il ramo nativo, l'unico che quella decisione disegna davvero, **non ha override da onorare**:
`viewWidget` vi è `undefined` per costruzione. Un diff su `:648` sarebbe inerte su entrambi i
rami, per due ragioni diverse.

### 2.1 Il costo vero: il modello dati della riga IR

`IRNodeContent` costruisce le righe da una **firma stringa a sei campi**
(`IRNodeContent.tsx:178,188`):

```
`${kind};${fid};${feat.name};${typeObj?.name};${feat.type};${display}`
   ↓
CompartmentRowData { key, name, typeName, typeId, value, editableValue }
```

`SlotShape`, che è ciò che `detectValueRenderer` consuma, ne chiede molti di più e li chiede
tutti: `values[]` (qui il multi-valore è già **appiattito** in una stringa unica — misurato,
`tags=draft, review, urgent, v2, legacy, `), `isReference`, `isMany`, `enumLiteralNames`,
`rendererOverride`, `unit`, `min`, `max`, `isBroken`. Nessuno dei nove è nella firma.

La firma non è incidentale: esiste per tenere stabile il memo del nodo. Arricchirla tocca il
percorso di re-render di ogni nodo IR.

### 2.2 La scorciatoia che la misura rende disponibile

C'è però un fatto che riduce molto il costo, ed è misurato: **`slotRows` è già popolato e già
in scope sul ramo IR** — 13 feature, verificato dal report R-STR-7 §4 leggendo il fiber, e
riconfermato qui dal fatto che l'inspector si apre sul ramo IR risolvendo il nome contro
`slotRows`. La decisione completa, `SlotShape` inclusa, **esiste già a due righe dal punto di
render**.

Quindi la via a costo minimo non è arricchire la firma: è **passare la decisione giù come prop**,
esattamente come `onInspectFeature` è stato aggiunto per R-STR-7, e far rendere al segmento
`value` quella decisione invece del testo. La decisione resta del motore
(`valueRenderer`/`widgetRenderer`), come il punto 2 del prompt richiede: `IRNodeContent` non
decide niente, riceve.

---

## 3. La conseguenza che non è tecnica, ed è la ragione dello stop

Far rendere al segmento `value` la libreria dei renderer **cambia l'aspetto di ogni nodo IR
già esistente**, non solo di quelli con un override. Oggi un segmento `value` è testo; domani
un booleano diventa un pallino, un enum una chip, un numero con bounds una barra di progresso.
Ogni view IR mai autorata cambia resa, senza che nessuno abbia chiesto niente.

Non è un dettaglio di implementazione: è la scelta se **il compartimento IR sia una superficie
di testo formattato dall'autore della view** (com'è oggi: l'autore scrive `segments` e ottiene
esattamente quelli) **oppure una superficie renderizzata come il nodo nativo**. Il `rowFormat`
dell'IR esiste per dare all'autore il controllo carattere per carattere; la libreria dei
renderer esiste per togliergli quella decisione e darla al tipo.

Le due cose sono in tensione, e la tensione è la stessa che R-STR-5 ha già sciolto una volta
nella direzione opposta:

> **R-STR-5** — La view vince nel FORM, non sul canvas. È la lettura corretta di `FormSpec`,
> che per sua definizione descrive «how the same view renders as a FORM of editable widgets
> instead of a symbol on the canvas».

Il prompt di oggi apre R-STR-6, che è per definizione l'estensione di quella vittoria al canvas
— quindi la contraddizione è **voluta e legittima**, ed è la ragione per cui R-STR-6 era
registrata «non aperta finché non è deciso esplicitamente». Ma la misura mostra che aprirla
non costa il diff che R-STR-6 preventivava: costa **la resa di ogni nodo IR esistente**, e su
questo il prompt non si esprime perché non poteva saperlo.

---

## 4. Le tre vie, con il loro costo

**(A) Solo il gradino 0, dentro il segmento `value`.** Il segmento `value` rende con la
libreria **soltanto quando la view dichiara un widget per quella feature**; senza widget resta
testo, come oggi. Blast radius: le sole feature con un override esplicito, cioè zero view
esistenti finché nessuno scrive un widget. Costo: una prop su `IRNodeContentProps`, il ramo nel
segmento `value`, il riuso di `RowValue`. **Ma lascia il gradino 1 disonorato sul ramo IR**
(`guard` resta testo), cioè lascia il canvas incoerente con sé stesso: la view vince, il
metamodello no.

**(B) L'intera libreria sul segmento `value`.** Coerenza piena con il ramo nativo: gradino 1 e
gradino 0 valgono ovunque. Blast radius: **ogni nodo IR esistente cambia resa**. Serve una
scelta di prodotto, e probabilmente un opt-in per view (`rowFormat.rendered: true`?) per non
riscrivere l'aspetto del lavoro già autorato — che però è a sua volta una chiave nuova sull'IR
senza VersionFixer (R-B9).

**(C) Chiudere R-STR-6 dichiarandola non desiderabile.** Il compartimento IR resta una
superficie di testo dell'autore; la precedenza `FormSpec.widgets` resta viva sulle due
superfici dove ha senso (Form tab e ladder), e la ladder sul canvas resta ciò che è oggi: la
spiegazione di **come il ramo nativo renderebbe**, con il footer «· on the canvas ·» che dice
il vero. Costo: zero diff, più i test che pinnano lo stato misurato e una riga a registro.

---

## 5. Domande di ratifica

1. **Quale delle tre vie**, (A), (B) o (C)?
2. Se (B): l'opt-in per view è accettabile come chiave nuova sull'IR, o la resa deve cambiare
   per tutte le view esistenti senza scampo?
3. Se (A) o (B): il footer dell'inspector dice oggi «· on the canvas ·» seguito dal renderer
   **nativo**. Su un ramo IR che rende testo quella riga è già oggi imprecisa — va corretta
   in questa slice o in una sua?

## 6. Cosa NON è stato misurato, e va dichiarato

- **Dark mode**: fuori scope per il prompt, non aperto.
- **`property.render = edge-label`**: fuori scope per il prompt, non aperto.
- **`instanceTable.ts:201`** chiama `detectValueRenderer` per la tabella del manager: è la
  terza superficie viva della libreria, ma il prompt esclude «ogni cosa del fronte manager»,
  quindi è nominata e non misurata.
- **Le view IR nei progetti salvati**: il blast radius di (B) è argomentato sul meccanismo, non
  contato su un campione di progetti reali. Non ho modo di misurarlo da qui.
