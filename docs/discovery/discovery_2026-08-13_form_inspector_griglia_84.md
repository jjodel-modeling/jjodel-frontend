# Discovery — il form dell'inspector, la griglia 84px e il perimetro reale

**Data**: 2026-08-13, sessione Cowork autonoma.
**Base**: `alfonso-frontend-jjtl` a `d8b2e9e28`. Misure prese su un clone Linux allineato al Mac,
verificato md5-identico sui sei file letti.
**Obiettivo**: stabilire su quali ancore la griglia 84px del design §7 può appoggiarsi senza
uscire dal perimetro dell'arco 3, e con quale convenzione il controllo multiplicity deve scrivere.

Questo report è un insieme di ipotesi con evidenze, non un riferimento definitivo (P4).

---

## Le cinque ipotesi, e come sono finite

| # | ipotesi | esito |
|---|---|---|
| 1 | `Info.tsx` ha un solo consumatore vivo, il rail | **FALSIFICATA**: ne ha due |
| 2 | la griglia si scopa a `.properties-with-tree-view--rail` | **FALSIFICATA**: quell'ancora esonda su un'area attiva |
| 3 | i campi che attraversano la griglia sono uniformi | **FALSIFICATA**: `.jj-field` ha due forme, a due e a tre figli |
| 4 | i bound usano `-1` per illimitato | **CONFERMATA**, con un corollario sull'undo |
| 5 | il ramo view non attraversa `.properties-fields` | **CONFERMATA** |

Tre ipotesi su cinque cadute. Il passo A scritto ieri sulle fondamenta di ieri avrebbe toccato
l'authoring IR.

---

## 1. `Info` ha due consumatori vivi, non uno

- `frontend/src/components/editors/PropertiesWithTreeView.tsx:634` — `<Info ... />`, il rail, `mode='tab'`.
- `frontend/src/components/contextMenu/ContextMenu.tsx:559` — `<Info mode={'popup'}/>`, dentro
  `<div className={'edit-panel'}>`, cioè il pannello di modifica del menu contestuale.
- `frontend/src/components/panels/ElementPropertiesDrawer.tsx:2` importa `Info`, ma **nessuno monta
  il drawer**: l'unica occorrenza fuori dal file è il commento a `EditorV2.tsx:105`, verbatim
  «`// ElementPropertiesDrawer import removed — bottom drawer disabled (see BottomDrawer removal)`».
  Il file resta in albero e non si tocca (Regola 9).

**Controllo positivo della ricerca** (R-RAIL-28): la stessa `rg` con gli stessi glob su
`PropertiesWithTreeView` torna sette file. La ricerca ha segnale; il silenzio sul drawer è un
risultato, non un guasto.

**Conseguenza**: qualunque regola che parta da `.jj-field` senza un'ancora di superficie cambia
anche il pannello del menu contestuale.

## 2. L'ancora giusta non è il rail: è `.properties-fields` dentro il rail

`Info` ha tre rami di ritorno, e solo uno passa dal contenitore che serve:

- **ramo view**, `Info.tsx:1236-1253`: ritorna presto, `<section className="properties-tab
  properties-panel">` con dentro `ViewpointProperties` oppure `ViewData`. Niente `.properties-fields`.
- **ramo popup/inline**, `Info.tsx:1412-1414`: verbatim
  «`// Fallback to original design for popup/inline modes`», poi
  `return <section className={'properties-tab'}>{jsx}`. Niente `.properties-fields`.
- **ramo model element in modalità tab**, `Info.tsx:1381`: `<div className="properties-fields">{jsx}</div>`.

E il punto che riordina il perimetro: **la superficie di authoring IR rende dentro il rail**, per la
via del ramo view. `ViewData.tsx:95,98,133,137` monta `VertexAuthoringPanel` e `EdgeAuthoringPanel`,
e quei pannelli usano `.jj-field`: tredici file sotto
`frontend/src/components/editor-v2/viewpoint/authoring/`. È l'area che `CLAUDE.md` §2.5 dichiara in
sviluppo. Il foglio del rail lo sa già, e lo scrive a `properties-with-tree-view.scss:619`.

**Ancora scelta**: `.properties-with-tree-view--rail .properties-fields .jj-field`.
Specificità (0,3,0), contro (0,1,0) di `_form-system.scss:945`. Raggiunge il solo form del ramo
model element nel rail; non raggiunge il popup, il ramo view, l'authoring IR, né altra superficie
dell'app. Usa due classi che esistono già: nessun identificatore nuovo, quindi nessun rischio di
collisione (P2).

## 3. `.jj-field` non è uniforme: due forme, non una

- forma a due figli, label più campo: `Info.tsx:424-427` (Type), `named()` a `:355-358` (Name).
- forma a **tre** figli, label più campo più hint: `Info.tsx:369-373` e `:374-378` (Uri, Prefix del
  package), con `<div className="jj-field-hint">`.

In una griglia `84px 1fr` il terzo figlio cade nella colonna sinistra della riga successiva, cioè
sotto la label, largo 84px. Serve `grid-column: 2` sull'hint. Vale anche per
`.jj-field-required`, che però è **dentro** la label e non è un figlio della griglia.

Fuori dalla griglia restano forme che non usano `.jj-field` affatto e che il passo A non tocca:
`label.input-container` della sezione DEPENDENCIES (`Info.tsx:342-355`), `.jj-bounds-row`
(`Info.tsx:428-441`, che il passo B sostituisce), `.jj-toggle-row` (`Info.tsx:80`, che il passo C
riveste).

## 4. La convenzione dei bound, letta sul write path

`frontend/src/model/logicWrapper/LModelElement.tsx:1504-1529`, verbatim:

```
protected set_lowerBound(val, c) {
    val = +val;
    if (isNaN(val)) val = 0;
    else val = Math.max(0, val);
    ...
    SetFieldAction.new(c.data, 'lowerBound', val);
    if (c.data.upperBound != -1 && val > c.data.upperBound) SetFieldAction.new(c.data, 'upperBound', val);
}
protected set_upperBound(val, c) {
    val = +val;
    if (isNaN(val)) val = -1;
    else val = Math.max(-1, val);
    ...
    SetFieldAction.new(c.data, 'upperBound', val);
    if (val !== -1 && val < c.data.lowerBound) SetFieldAction.new(c.data, 'lowerBound', val);
}
```

Quindi: **`-1` è l'illimitato**, `lowerBound` è clampato a zero, e ciascun setter corregge l'altro
bound quando l'intervallo si invertirebbe. Il `999` che si legge a `Info.tsx:522` e `:622` è
normalizzazione di rendering degli slot M1, non la convenzione del modello: non va portato nel
controllo nuovo.

**Corollario per il passo B**: i quattro preset richiedono due scritture. Verificate a tavolino le
quattro transizioni fra preset, in entrambi gli ordini: nessuna produce un valore diverso da quello
atteso, perché la clausola di correzione non scatta mai fra preset. Ma ogni setter apre la propria
`TRANSACTION`, quindi un cambio di preset che muove entrambi i bound costa **due passi di undo**.
Domanda aperta sotto.

## 5. `ADVANCED STATE` sta fuori dal contenitore dei campi

`Info.tsx:1386-1396`: la sezione è sorella di `.properties-fields`, non figlia. Fonderla dentro
`Advanced` (passo D) è quindi una modifica di markup nel guscio del ramo model element, non una
regola CSS. Va messa in conto al passo D e non al passo A.

## 6. Baseline misurate, non riportate a memoria

- `npx tsc --noEmit` sul clone Linux: **14 errori**, coerente con la baseline documentata
  (`CLAUDE.md` §17 dichiara 33 sul Mac, differenza attesa: i 19 di casing che un filesystem
  case-sensitive non produce).
- `npm ci` completato, `vite` e `tsc` presenti in `node_modules/.bin`.
- `npm run build`: misurato nello stesso giro, esito riportato nell'handover.

---

## Rischi

1. **La griglia tocca ogni kind, non le sole feature.** Dentro `.properties-fields` passano class,
   enum, feature, attribute, reference, operation, literal, package, model. L'harness deve aprirli
   uno per uno: guardare la sola classe è la specie di misura che R-RAIL-28 vieta.
2. **I due temi.** R-RAIL-42 esiste per una barra che nessuno aveva aperto in dark. Ogni superficie
   nuova di questo arco si guarda due volte.
3. **Il popup del menu contestuale è una superficie di controllo.** Se cambia, l'ancora ha esondato.
   Va incluso nell'harness come controllo negativo: deve restare identico al pixel.

## Domande aperte per Alfonso

1. **Undo del multiplicity**: un preset che muove entrambi i bound costa due passi di undo. Le
   alternative sono lasciarlo così (comportamento identico ai due stepper di oggi, zero rischio) o
   avvolgere le due scritture in una `TRANSACTION` esterna. `CLAUDE.md` §3.3 dichiara sicure le
   TRANSACTION di sole `SetFieldAction`, ma qui sarebbero **annidate** dentro quelle dei setter, e
   fuori dalla critical zone. Ho scelto la prima per stanotte: è la conservativa, e la seconda resta
   un cambio di due righe.
2. **`Custom` e i valori fuori preset**: un `[3..7]` cade su Custom. Un `[0..0]` è legale nel
   modello (`upperBound: 0`, `get_many` lo legge come non-many) ma non ha preset: cade su Custom
   anch'esso. Confermi che va bene, o `[0..0]` va trattato come stato illegale da correggere?
