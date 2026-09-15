# Discovery: cascata tipografica del simbolo e preset di padding (Fase 1)

**Data**: 2026-08-25
**Prompt**: `docs/prompts/claude_2026-08-25_1320_prompt_symbol_text_cascade_padding.md` (2026-08-25 13:20)
**Branch**: `alfonso-frontend-jjtl`, HEAD `3090ef4b7`
**Tipo**: read-only. Nessun file sorgente toccato in questa fase.

---

## 0. Ipotesi che la discovery falsifica

La Fase 1 esiste per provare a smentire sei affermazioni date per vere dal prompt. Nessuna
delle sei e' stata smentita; una ha prodotto una rettifica di motivazione (§4.1) e cinque
osservazioni collaterali sono emerse per strada (§4).

| # | Ipotesi del prompt | Esito |
|---|---|---|
| H1 | `ir-pad--*`, `PaddingToken`, `VALID_PADDING_VALUES`, `shape.text` non esistono | **confermata** (§3.1) |
| H2 | Le regole che fissano `font-size` in px dentro `.ir-node-content` sono tre; altre quattro restano fuori dal testo del simbolo | **confermata** (§3.2) |
| H3 | `useContentDrivenSize` misura il DOM, non una costante di font | **confermata** (§3.3) |
| H4 | `recognizeSymbol` / `notationCatalog` non enumerano le chiavi di `ShapeSpec` | **confermata** (§3.4) |
| H5 | `irHash` e la cache di compile invalidano al cambio dei due assi | **confermata** (§3.5) |
| H6 | Il collasso a `undefined` di `TextStyleField` e' replicabile su `shape.text` senza lasciare `undefined` o `{}` nell'IR salvato | **confermata** (§3.6) |

Conclusione operativa: nessuna verifica fallita, quindi **la Fase 2 prosegue senza hard stop**,
come previsto da §3.1 del prompt.

---

## 1. Obiettivo

Verificare i presupposti del prompt prima di scrivere i due assi `ShapeSpec.padding` e
`ShapeSpec.text`, il rifacimento in token di BASE_CSS e i controlli di authoring.

## 2. File letti (path completi)

Sorgente:

- `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts` (486 righe, intero)
- `frontend/src/components/editor-v2/viewpoint/ir/irCompile.ts` (552 righe; letto 240-410, il compile dei node view)
- `frontend/src/components/editor-v2/viewpoint/ir/irStyle.ts` (189 righe, intero)
- `frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx` (397 righe, intero)
- `frontend/src/components/editor-v2/viewpoint/ir/irValidate.ts` (156 righe, intero)
- `frontend/src/components/editor-v2/viewpoint/ir/symbolRecognition.ts` (76 righe, intero)
- `frontend/src/components/editor-v2/viewpoint/ir/notationCatalog.ts` (228 righe; letto `applyPresetToShape` 137-152 e la tabella `values`)
- `frontend/src/components/editor-v2/viewpoint/ir/useContentSize.ts` (214 righe, intero)
- `frontend/src/components/editor-v2/viewpoint/ir/irDefaults.ts` (letto il seed `defaultObjectViewIR`, 38-50)
- `frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx` (566 righe, intero)
- `frontend/src/components/editor-v2/viewpoint/authoring/TextStyleField.tsx` (196 righe, intero)
- `frontend/src/components/editor-v2/viewpoint/authoring/TextStyleEditor.tsx` (letto 1-140, `setAxis` incluso)
- `frontend/src/components/editor-v2/viewpoint/authoring/LabelEntryEditor.tsx` (116 righe, intero)
- `frontend/src/components/editor-v2/viewpoint/authoring/SymbolBoxPreview.tsx` (letto 1-40 e 85-164)
- `frontend/src/components/editor-v2/viewpoint/authoring/irTabs.tsx` (letto `IRSourceBody`, 191-209)
- `frontend/src/styles/tokens/index.scss` (letto 55-75)
- `frontend/src/styles/tokens/_typography.scss` (letto le righe dei due token font)

Test:

- `frontend/src/components/editor-v2/viewpoint/ir/__tests__/ir.test.ts` (letto 1-60, l'impianto delle fixture)
- `frontend/src/components/editor-v2/viewpoint/ir/__tests__/irValidate.test.ts` (167 righe; letto 1-80)
- `frontend/src/components/editor-v2/viewpoint/ir/__tests__/markerRegistry.test.ts` (letto 80-124, il precedente `compile di shape.marker`)

Documenti:

- `CLAUDE.md`, `docs/PROTOCOL.md`, `docs/decisions.md` (processo + serie R-IRN + R-B9-bis), `docs/claude-code-log.md` (ultime 12 entry)
- `docs/spec/claude_spec_2026-07-27_ir_textstyle_addendum.md` (intero indice, §3-§5 e §7-§10 per esteso)

## 2.1 Nota di metodo sui grep

`type grep` in questa shell risponde: funzione di shell da
`~/.claude/shell-snapshots/snapshot-zsh-...`, cioe' il wrapper `ugrep --ignore-files` che
CLAUDE.md §5 descrive. Ogni ricerca di questo report e' stata eseguita con `command grep`
(BSD grep), che onora `-r` e `--include` come dichiarato. Le ricerche di assenza portano un
controllo positivo esplicito (§3.1).

---

## 3. Findings

### 3.1 I quattro identificatori nuovi non esistono (H1)

```
$ command grep -rn "ir-pad" frontend/src            -> exit 1, 0 righe
$ command grep -rn "PaddingToken" frontend/src      -> exit 1, 0 righe
$ command grep -rn "VALID_PADDING" frontend/src     -> exit 1, 0 righe
$ command grep -rn "shape\.text\|shape?\.text" frontend/src -> exit 1, 0 righe
```

Controllo positivo sullo stesso comando e sullo stesso perimetro, per provare che la ricerca
gira davvero:

```
$ command grep -rn "shape\.marker\|shape?\.marker" frontend/src   -> 6 righe
  __tests__/markerRegistry.test.ts:3, :89
  ir/irCompile.ts:311
  ir/symbolRecognition.ts:63
  authoring/SymbolEditorModal.tsx:102
  authoring/VertexAuthoringPanel.tsx:317
```

Il controllo ha segnale, quindi i quattro silenzi sono risultati negativi e non comandi muti.

### 3.2 Le regole in px dentro `.ir-node-content` (H2)

Esattamente le tre attese dal prompt, verbatim da `irStyle.ts`:

- `irStyle.ts:25`: `.ir-node-content .ir-label { font-size: 11px; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%; }`
- `irStyle.ts:47`: `.ir-node-content .ir-compartment .ir-row { font-size: 11px; line-height: 1.4; display: flex; gap: 4px; min-width: 0; }`
- `irStyle.ts:138`: `.ir-node-content .ir-label__input, .ir-node-content .ir-row__input { font-size: 11px; border: 1px solid #334155; ... }`

Restano in px, e restano fuori dal perimetro (non sono testo del simbolo):

- `irStyle.ts:40`: `.ir-badge` 12px
- `irStyle.ts:133`: `.ir-hull__header` 11px
- `irStyle.ts:134`: `.ir-hull__toggle` 11px
- `irStyle.ts:136`: `.ir-collapse-chip` 10px

Il prompt cita `.ir-hull__*` a 11px: sono due regole, non una, ed entrambe a 11px. Nessuna
sorpresa.

Padding oggi (la diagnosi §0.2 del prompt e' confermata alla lettera):

- `.ir-label--top` (`:26`) e `.ir-label--bottom` (`:29`): **nessun padding**
- `.ir-label--center` (`:27`): **nessun padding**
- `.ir-label--inside` (`:28`): `padding: 0 8px`
- `.ir-compartment` (`:45`): `padding: 4px 8px`

Nessun'altra regola del foglio tocca il padding delle superfici di testo.

### 3.3 `useContentDrivenSize` misura il DOM, non una costante (H3)

`useContentSize.ts:52-73`, `measureIntrinsic`:

```ts
const cs = getComputedStyle(el);
const chromeX = px(cs.borderLeftWidth) + px(cs.borderRightWidth) + px(cs.paddingLeft) + px(cs.paddingRight);
...
s.width = 'max-content';
...
const w = el.offsetWidth;
const h = el.offsetHeight;
```

Nessuna costante di font: la misura e' `offsetWidth`/`offsetHeight` a `max-content`, e il
chrome (bordo + padding) viene letto dal computed style. Un font piu' grande e un padding
piu' grande allargano il nodo senza altro lavoro. La correzione prevista come debito dalla
spec ir-1.3 §4 e §10 («se oggi il misuratore usa un font fisso, e' il punto da correggere»)
**non serve**: il misuratore non e' mai stato a font fisso in questa forma del file.

Perimetro: `useContentDrivenSize` e' attivo solo sulle forme con supplemento geometrico
(`hasSizeSupplement`: ellisse, cerchio, rombo, `useContentSize.ts:116`). Le forme che
riempiono la loro box (rect, rounded, stadium) restano al content-hug CSS, che e' anch'esso
guidato dal DOM. Entrambe le strade crescono col font.

### 3.4 Riconoscimento e catalogo ignorano le chiavi nuove (H4)

`symbolRecognition.ts:59-75` legge **solo** `shape.form`, `shape.border?.style`,
`shape.border?.width`, `shape.marker`, `shape.fill`. Nessuna enumerazione di chiavi, nessun
`Object.keys(shape)`. Due chiavi in piu' sono invisibili al riconoscimento, che e' il
comportamento voluto: il modulo dichiara gia' «ignored: ... labels, badges, text style»
(`symbolRecognition.ts:12-13`).

`notationCatalog.ts:137-152`, `applyPresetToShape`, parte da `{ ...shape }` e riscrive solo
`form`, `border`, `marker`, `fill`. Applicare un preset **preserva** `padding` e `text`.

Nessuna modifica necessaria in nessuno dei due file.

### 3.5 `irHash` e la cache di compile (H5)

`irCompile.ts:285-290`: `irHash` e' un djb2 su `JSON.stringify(ir)`; la chiave di cache e'
`` `${viewId}:${irHash(ir)}` `` (`:295`). Entrambi gli assi partecipano alla stringa, quindi
un cambio invalida la cache per costruzione.

Corollario utile: `JSON.stringify` **elide** le chiavi il cui valore e' `undefined`, quindi
`{ padding: undefined }` produce lo stesso hash di `padding` assente. Nessuna cache
frammentata dalle chiavi svuotate dal pannello.

`compileView` e' l'**unico** costruttore di un literal `CompiledView` in tutto il codebase
(`command grep -rn "CompiledView" frontend/src`: 21 righe, un solo `const compiled:
CompiledView = {` a `irCompile.ts:383`; tutte le altre sono `import type`, annotazioni di
variabile o firme). Aggiungere un campo **obbligatorio** `padding` non rompe nessun altro
sito.

### 3.6 Il collasso a `undefined` e' replicabile (H6)

Catena misurata:

1. `TextStyleEditor.ts:39-46`, `setAxis`: cancella la chiave quando l'asse e' `undefined` e
   ritorna `undefined` quando non resta nessun asse. Un `{}` non e' producibile da questa
   strada.
2. `TextStyleField.tsx:173`: il bottone di reset chiama `onChange(undefined)` diretto.
3. `LabelEntryEditor.tsx:105-111`: `onChange({ ...label, style })` con `style` eventualmente
   `undefined`: la chiave resta presente **nell'oggetto vivo** col valore `undefined`.
4. `VertexAuthoringPanel.tsx:482` (marker) segue la stessa strada:
   `patchShape({ marker: next === '' ? undefined : next })`.
5. `irTabs.tsx:191-209`, `IRSourceBody`, rende `JSON.stringify(ir ?? null, null, 2)`: una
   chiave `undefined` **non compare** nel tab Source.

Quindi il comportamento che il prompt chiede di replicare e' gia' quello accettato per il
marker, e la prova B4 («nessuna chiave `undefined` o `{}`» nel tab Source) e' soddisfatta
dalla serializzazione, non da una pulizia esplicita. Il seed successivo passa da
`clone = JSON.parse(JSON.stringify(x))` (`VertexAuthoringPanel.tsx:68`), che elide la chiave
per la seconda volta.

**Nessuna rimozione esplicita della chiave e' quindi necessaria**, ne' per `padding` ne' per
`text`.

---

## 4. Osservazioni collaterali (non richieste dal prompt, misurate)

### 4.1 `box-sizing: border-box` e' gia' globale, la motivazione del prompt e' inesatta, la riga resta giusta

`frontend/src/styles/tokens/index.scss:62-64` dichiara un reset universale:

```scss
* {
  box-sizing: border-box;
}
```

Quindi `.ir-label` e' **gia'** in border-box oggi, e il rischio descritto dal prompt («in
content-box la label sforerebbe il box e l'ellissi tornerebbe a non scattare») non si
materializzerebbe comunque. La dichiarazione esplicita in BASE_CSS resta corretta e viene
scritta lo stesso, con due ragioni diverse da quella del prompt: rende il foglio iniettato
auto-contenuto (BASE_CSS vive in un `<style id="ir-views-css">` proprio, indipendente dal
foglio dell'app) e batte per specificita' il reset a (0,0,0). Zero pixel di differenza
attesa: e' una cintura, non il fix.

### 4.2 `SymbolBoxPreview` eredita la tipografia nuova, per costruzione dichiarata

`SymbolBoxPreview.tsx:111` rende `<div className={`ir-node-content ir-shape--${v.form}`}>` e
`:158` una `<span className="ir-label ir-label--center">`. Il modulo lo dichiara nel suo
docstring (`:5-12`): «Renders the box ... as a REPLICA of the canvas node: the same global
classes irStyle.ts injects ... What the canvas paints through CSS (dashed and double borders,
radii, shadow, **typography**, ellipsis) the preview paints identically by construction».

Conseguenza del commit A: nell'anteprima del modal Symbol la label passa da 11 a 13px e
prende `padding: 0 8px`. **E' il comportamento voluto**, perche' la fedelta' della replica e' il
contratto del componente, e per ottenerlo il file **non va toccato**, coerentemente col
divieto di §2 del prompt. Va guardato nella verifica visiva.

L'anteprima non riceve la classe `ir-pad--*` (rende solo `ir-node-content ir-shape--<form>`):
resta sempre sui token di default 8/4. Limite dichiarato, non un difetto: il preset di
padding e' un asse della view, l'anteprima e' del simbolo.

### 4.3 Due limiti della resa che il perimetro del prompt non chiude

Entrambi preesistenti nella sostanza, entrambi resi leggermente piu' visibili dal commit A.
Nessuno dei due si corregge qui: il CSS del prompt e' dettato riga per riga.

- **Salto di padding entrando in edit inline.** L'input della label porta
  `ir-label ir-label--<pos> ir-label__input` (`IRNodeContent.tsx:299`). Le due regole che
  dichiarano padding stanno alla stessa specificita' (0,2,0) e vince l'ultima in ordine di
  sorgente: `.ir-label__input` (`irStyle.ts:138`) sta **dopo** `.ir-label--top`
  (`irStyle.ts:26`), quindi l'input tiene `padding: 0 4px` mentre lo span che sostituisce
  passa a `4px 8px`. Oggi lo scarto e' 0 -> `0 4px`, dopo diventa `4px 8px` -> `0 4px`: il
  salto c'e' gia', cresce. Il corpo del testo invece coincide (entrambe le regole diventano
  `font-size: inherit`), che e' quello che la prova A4 chiede.
- **`font-family` non raggiunge gli editor inline.** Gli `<input>` non ereditano la famiglia
  dallo UA stylesheet, e la riga `:138` porta `font-size: inherit` ma non
  `font-family: inherit`. Un `shape.text.fontFamily: 'mono'` colorera' label e righe ma non
  il campo di edit. Anche questo e' lo stato di oggi (l'input era a font UA gia' prima), solo
  osservabile in piu' casi.

### 4.4 `fontWeight` del nodo non raggiunge l'intestazione: confermato, ed e' voluto

`.ir-label--top` e `.ir-label--center` dichiarano `font-weight: 600` in regola di classe
(`irStyle.ts:26-27`). Una dichiarazione di classe batte l'ereditarieta' da
`.ir-node-content`, quindi un `shape.text.fontWeight` inline sulla radice non tocca
l'intestazione, mentre raggiunge le righe dei compartimenti (che non dichiarano peso). Il
prompt lo prevede e chiede di scriverlo nel commento: confermato in lettura, nessuna
sorpresa. La strada per cambiare il peso dell'intestazione resta `LabelSpec.style`, inline
sullo span, che vince su tutto.

### 4.5 Il default view non dichiara nessuno dei due assi

`irDefaults.ts:38-43`: `shape: { form: 'rect', labels: [...] }`. Nessun `padding`, nessun
`text`. Eredita i default CSS, come richiesto. `irDefaults.ts` non va toccato.

---

## 5. Rischi

| # | Rischio | Mitigazione |
|---|---|---|
| R1 | Il salto da 11 a 13px cambia la taglia di ogni nodo IR content-hug di ogni progetto | Voluto e dichiarato. Nessuna taglia persistita cambia: un nodo con taglia esplicita (`isResized`) e' fuori dalla derivazione (`useContentSize.ts:116`). Prova A5. |
| R2 | Il padding nuovo sull'intestazione fa scattare l'ellissi prima, su forme geometriche | Prova A2 (nome lungo su rombo/ellisse). Il nodo cresce col padding perche' `measureIntrinsic` legge il chrome dal computed style. |
| R3 | `padding: undefined` persistito nell'IR | Escluso da §3.6: `JSON.stringify` elide, e il precedente marker e' identico. Prova A3 (tab Source). |
| R4 | La regola `.ir-node-content` a `irStyle.ts:18` e' una di tre regole omonime (`:18`, `:60`, `:69`) | Nessuna delle altre due dichiara `font-size` o custom property: nessun conflitto. Le custom property `--ir-pad-*` vanno sulla prima, che e' quella che il commento del prompt indica. |

## 6. Domande aperte

Nessuna bloccante. Due punti di §4.3 (salto di padding dell'input, `font-family` non ereditata
dagli input) sono materiale per un fronte successivo, se Alfonso li vuole chiudere: entrambi si
risolvono con una riga in `irStyle.ts:138`, fuori dal CSS dettato da questo prompt.

## 7. Baseline dei gate, presa prima di qualunque modifica

- `npx tsc --noEmit` -> **33** errori (uguale alla baseline di CLAUDE.md §17). Conteggio su
  output completo (`grep -c "error TS"` sul file intero, non su una finestra).
- `npx vitest run` -> **1354 passed**, **9 suite fallite in raccolta** (`window is not defined`,
  pre-esistenti: jjscript / jjtl / UDComparator).
- Working tree: `frontend/src/common/featureSignature.ts`, `frontend/src/components/StatusBar.scss`,
  `frontend/src/components/StatusBar.tsx` modificati e **non di questo fronte**, quindi restano
  intatti, commit per pathspec.
