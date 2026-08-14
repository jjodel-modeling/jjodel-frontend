# Memo — le tre rifiniture dell'arco 3, e una norma disallineata dal codice

**Data**: 2026-08-13, sessione Cowork.
**File toccato**: `frontend/src/components/editors/properties-with-tree-view.scss` (solo questo).
**Gate**: `tsc --noEmit` 14 invariato sul clone Linux, `npm run build` exit 0.

---

## 1. L'intestazione non cresce più in postura Focus

Il design §7 vuole badge 34×34 e titolo 19px in Focus, contro 22×22 e 14px in Browse. A schermo
la differenza di scala legge come due schermate diverse invece che come lo stesso pannello più
alto, che è l'opposto di quello che la definition of done chiede: «switching posture moves nothing
but the tree pane's height».

Tolti i due override. Restano i `18px 14px 14px` di padding: la postura si sente nello spazio, non
nel corpo del testo. Misurato dopo: nome 14px e badge 22px/12px identici nelle due posture.

Le transizioni su `width`, `height` e `font-size` restano dichiarate nel blocco base e diventano
inerti. Non si tolgono: tornerebbero a servire se la scala rientrasse.

**Scostamento dal design, deciso da Alfonso.** Va iscritto, altrimenti la prossima lettura del
design lo rimette.

## 2. Il cyan, e la norma che non descrive più il codice

La richiesta era «i colori usati per toggle, chip, pill sono slate, nella sintassi astratta è
cyan, uniformiamo». Il punto non era scegliere un cyan: era trovare quello già in uso.

**Due sorgenti, entrambe misurate:**

- `.tree-row--selected` usa `--color-selection-bg` (`#e0f7fa` light, `rgba(8,145,178,0.18)` dark)
  come pastiglia tinta. Il commento che dichiara quei token, a `_colors-light.scss:373-375`, dice:
  «questi token sono attualmente usati solo da `.tree-row--selected`; estendere alle altre
  selezioni del progetto in un task futuro». Questa rifinitura **è** quel task.
- `ui/Toggle/Toggle.module.css:89-91` dichiara `CHECKED STATE - active = cyan accent #0ea5e9
  (design system A)`, con tre taglie: xs 24×14, sm 28×16, md 36×20.

**Qui c'è una norma che non descrive più il codice.** `CLAUDE.md` §7.1 dice: «Horizontal toggle
switches: 36×20 px. Active `#334155` (slate, not cyan)». Il componente vero è cyan e il pannello
lo monta in taglia **xs**, cioè 24×14: misurato a schermo, non letto nel modulo. Quindi la
richiesta di Alfonso non è una deroga alla norma, è un allineamento al codice, e **la norma va
corretta**. Finché §7.1 resta com'è, il prossimo che la legge riporta indietro il colore.

Testo proposto per §7.1, da sostituire alla riga sui toggle:

> **Horizontal toggle switches**: taglie del componente `ui/Toggle` (xs 24×14, sm 28×16, md 36×20);
> il pannello Properties usa `xs`. Attivo `#0ea5e9` (cyan accent), spento `#cbd5e1`. Label a
> sinistra, mai dentro. Impl: `components/ui/Toggle/Toggle.module.css`.

E la riga «Cyan: mai come sfondo di bottone» va precisata: vale per i bottoni, non per gli
indicatori di stato attivo, che è l'uso che il componente fa già.

**Cosa è stato applicato**, con un accento solo e una tinta sola:

| superficie | spento | acceso |
|---|---|---|
| traccia dello switch | `#cbd5e1` | `#0ea5e9` |
| chip | fondo bianco, anello `#e2e8f0` | fondo `--color-selection-bg`, anello `#0ea5e9`, testo scuro semibold |
| segmento multiplicity | uguale al chip | uguale al chip |
| riga switch accesa | trasparente | fondo `--color-selection-bg` |

Il testo resta scuro sulla tinta, come fa la riga selezionata del tree. **Misurato: 13.1:1 di
contrasto.** Un riempimento cyan pieno con testo bianco avrebbe dato 3.7:1, sotto AA a 12px,
contro i 10.3:1 dello slate di ieri: il canale del colore si sposta sul cyan senza pagarlo in
leggibilità.

La traccia dello switch invece prende il cyan pieno, perché sopra non poggia testo. Nessun
override dark su di essa: `ui/Toggle` non ha metà scura, e due interruttori affiancati nella
stessa colonna devono restare identici anche cambiando tema.

## 3. La riga accesa si evidenzia con il fondo, non con una linea

La linea scura sulle righe true non era una scelta: era un difetto. Misurato, righe accese con
`border-top: 1px rgb(51,65,85)` contro `rgb(248,250,252)` delle spente. Causa: il blocco Browse
dichiara `.is-on { border-color: $pc-slate-700 }`, e il blocco Focus, che ridichiara `background`
e `color`, non ridichiara `border-color`. **A parità di specificità la proprietà non ridichiarata
resta quella di prima**: il blocco perde per omissione, non per specificità.

Ora la riga accesa porta `--color-selection-bg` su tutta la larghezza e il filetto torna neutro.

## 4. Un difetto trovato mentre correggevo, che le prime misure non avevano preso

In dark lo stato acceso perdeva tinta e anello: misurato `rgba(255,255,255,0.06)` con anello
`rgb(51,65,85)`, cioè lo stato spento. Causa: la regola base del blocco dark porta `[data-theme]`
in più e vale (0,5,0), quindi batte la `.is-on` del blocco chiaro a (0,4,0) e ne sovrascrive
fondo e bordo.

**La lezione, che vale oltre questo caso**: un token che porta già la propria metà scura non
basta. Il token porta il valore, la ridichiarazione porta la specificità. Ogni blocco `[data-theme]`
che ridichiara la base di un componente deve ridichiarare anche i suoi stati, o li spegne.

Corretto e rimisurato: acceso `rgba(8,145,178,0.18)` con anello `#0ea5e9` in dark,
`#e0f7fa` con lo stesso anello in light.

## 5. Voci di registro proposte

**Nota sulla numerazione, verificata sul repo a fine giornata**: il registro è arrivato a
**R-RAIL-45** per via del lavoro parallelo su Claude Code (il freeze del dark e la voce
sull'ordine letto nel dato). Le quattro voci proposte nell'handover dell'arco 3 prendono quindi
**46, 47, 48, 49**, e le quattro qui sotto **50, 51, 52, 53**. I numeri scritti nell'handover
sono superati da questi.

- **R-RAIL-50** — L'identity block non cambia scala con la postura. Il design §7 la prevede; a
  schermo produce due schermate invece dello stesso pannello più alto, contro la definition of
  done. La postura si dice con lo spazio, non con il corpo del testo.
- **R-RAIL-51** — Lo stato «acceso» e lo stato «selezionato» del pannello si dicono con i token
  di selezione già in uso nella sintassi astratta, non con lo slate. L'accento è `#0ea5e9`, quello
  che `ui/Toggle` usa per il proprio stato attivo; la tinta è `--color-selection-bg`. Il testo
  resta scuro sulla tinta: il cyan pieno sotto testo bianco costa 3.7:1 contro 13.1:1.
- **R-RAIL-52** — Quando il pannello ha già un controllo per un compito, il controllo nuovo ne
  copia i numeri misurati, non quelli del design. Gli switch dei flag sono 24×14 con pollice 10
  perché tanto misura `ui/Toggle` in taglia xs due sezioni più sopra, non i 30×18 del design §7.
- **R-RAIL-53** — Un token con metà scura non basta a far seguire il tema a uno stato: se un
  blocco `[data-theme]` ridichiara la base di un componente, vale (0,5,0) e spegne gli stati
  dichiarati fuori. Il token porta il valore, la ridichiarazione porta la specificità.
- **Correzione a `CLAUDE.md` §7.1** — La riga sui toggle orizzontali descrive uno stato che il
  codice non ha: il componente è cyan e il pannello lo usa in taglia xs. Testo sostitutivo al §2.


---

## 6. Le due rifiniture sulle card delle view (giro successivo)

Ancorate a `.view-editor-root` (`views/ViewData.tsx:202`), che esiste solo nel ramo view: non
toccano il form del ramo model element né il popup del menu contestuale. Le regole battute stanno
nella pelle B4 dello stesso foglio, scopata a `.properties-panel-container`, che vale per tutto il
rail: i controlli delle card erano rimasti alla scala grande mentre l'inspector scendeva.

**I dropdown.** Trigger a 30px e 13px con raggio 6; `.jj-field` eredita 13px, che è quello che
serve alla voce dell'elenco metaclassi, in `MatchingSection.tsx:90-94` uno `<span style="flex:1">`
senza classe propria. Le label restano a 14px.

Una cosa che non si può replicare, e va detta invece di lasciarla intendere: il rapporto «voci un
filo più grandi del valore scelto» viene da `JjSelect`, che è react-select e disegna il proprio
menu. Il `Select` delle card monta un `<select>` nativo, e le sue `<option>` le disegna il sistema
operativo.

**Lo stepper** torna alla geometria del componente (`ui/NumberInput/NumberInput.module.css`): 32px,
raggio 6, bottoni 28, valore 13px. La pastiglia larga era la pelle del rail, che lo portava a
raggio 12 con bottoni da 38 e valore 15.

**Come sono verificate, e cosa resta aperto.** L'harness non produce viste IR, quindi la card
dell'authoring non è raggiungibile: la verifica è fatta iniettando la stessa struttura DOM dentro
`.view-editor-root` e misurando lì (voce 13px, select 30px/13px/raggio 6, stepper 32px/raggio 6 con
bottoni 28 e valore 13px). **Questo prova che i selettori arrivano e con quali valori, non come
rende il componente vero.** La conferma a schermo sulla card IR resta di Alfonso.

Il campo Name delle card è rimasto alla scala grande: le rifiniture hanno preso select, voci di
elenco e stepper. Portarlo a 13px è una riga.
