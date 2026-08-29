# Discovery — estensione dello stile 7a a tutti i tab del rail

**Data**: 2026-08-29 · **Stato**: hard stop al report, nessun file di sorgente toccato
**Prompt**: promozione a sistema dello stile 7a, oggi scopato sotto `.ir-tab-body--structure`
(`dc0a8e5a2`, `f2226b575`), a tutti i tab del rail.
**Corsia**: completa (RC-3). Il prompt ordina di fermarsi al report se il perimetro supera
i 3 file o tocca interfacce esportate. **Lo supera: 11 file, uno dei quali globale.**

---

## 0. Esito in una riga

La promozione si può fare, ma **non nella forma che il prompt descrive**: il fondo `#f8fafc`
non sta sul selettore che il prompt indica, sta su una regola di famiglia a dieci selettori
con `!important` che esce dal rail e raggiunge l'editor dei viewpoint, i quattro sotto-tab
legacy della view e la pagina Collaborative. Quattro delle premesse del prompt sono smentite
dalla misura (§3). Servono tre ratifiche prima di scrivere (§7).

---

## 1. Che cos'è davvero «il rail»

Il rail non ha cinque tab: ne ha **sette id** su **tre pannelli**, e la barra cambia per kind
(`irTabs.tsx:60-70`).

| kind | barra (Basic) | +Advanced |
|---|---|---|
| vertex | Applies to · Structure · Symbol · Form | Source |
| edge | Applies to · Structure · Appearance · Text | Source |
| row | Applies to · Text | Source |

I cinque tab nominati dal prompt sono **la sola barra del vertex**. `Appearance` e `Text`
esistono e sono raggiungibili (edge e row), e il prompt non li nomina: prima ambiguità da
sciogliere (§7, Q1).

**Il tab Symbol non è un tab body.** `ViewData.tsx:111-113` lo dirotta su `SymbolCard`, un
componente con radice propria `section.properties-tab.properties-panel.symbol-card` e foglio
proprio (`SymbolCard.scss`, 88 righe). Quando Symbol è attivo `VertexAuthoringPanel` **non è
montato affatto**: non esiste alcun `ir-tab-body--symbol` (grep: zero occorrenze fuori da
`irTabs.tsx` e da quella riga di `ViewData`). Ogni regola scritta su `.ir-tab-body` lo manca
per costruzione.

I body realmente presenti nel pannello del vertex, letti dal DOM:
`ir-applies-to`, `ir-structure`, `ir-form`, `ir-appearance`, `ir-text`, `ir-source` — sei,
di cui due (`appearance`, `text`) montati ma fuori dalla barra del vertex dopo D15.

---

## 2. Baseline misurata, tab per tab

`_tmp_rail_tabs_audit.ts` (non committata) apre ogni tab della barra del vertex sul rail vero
e legge lo stile calcolato **del solo sottoalbero visibile**. Ritagli in
`scripts/smoke/_tmp_rail_tab_before_*.png`.

> Nota di metodo (R-RAIL-36): la prima stesura della sonda usava `getComputedStyle(el).display
> !== 'none'` come test di visibilità e misurava i body nascosti degli altri tab — un elemento
> dentro un antenato `display:none` dichiara `display: block` per sé. Il tell erano le
> larghezze a `0.0` e i conteggi identici su tutti i tab. Corretta a
> `el.getClientRects().length > 0`; i numeri sotto sono della versione corretta.

| | Applies to | Structure (7a) | Symbol | Form | Source |
|---|---|---|---|---|---|
| pannello | `#f8fafc` · 16/20 | id. | id. | id. | id. |
| eyebrow `h3` | 12/700/0.84px/#64748b, mb 12 | **11/600/0.88px/#94a3b8, mb 0** | assente | assente | 12/700/#64748b |
| label | 14px #64748b | (7a: 13px #475569) | 14px #64748b | 14px #64748b | assente |
| segmented track | assente | **trasparente + 1px, r8** | assente | `#f1f5f9`, 0px, r8 | assente |
| segmento attivo | — | **`#f1f5f9`, no ombra, 5/10** | — | bianco + ombra, 4/12 | — |
| select | 13px, 9px, 1px #e2e8f0, r6, 200×30 | **12px, 10px, 1px #cbd5e1, r4, 110×28** | — | 13px, r6, 200×30 | — |
| input testo | 15px, 14px, r12, 343×36 | **11px mono, 0px, senza bordo** | — | assente | — |
| help | 13px #64748b lh 19.5 gap 8 | **11px #94a3b8 lh 16.5 gap 6** | assente | 13px #64748b lh 19.5 | assente |
| controlli | 2 select, 3 input, 3 switch, 6 help | 6 segm, 5 select, 1 color, 4 switch | nessuno | 1 segm, 1 select, 1 help | 1 `<pre>` |

Lo scarto è omogeneo: **ogni tab diverso da Structure è ancora sull'idioma della card B4.**

---

## 3. Le quattro premesse del prompt che la misura smentisce

**(a) «Il fondo bianco va sulla regola condivisa `section.properties-tab.properties-panel`».**
Quel selettore **non dichiara alcun fondo**. La scansione per catena di selettori su
`info.scss` e `properties-with-tree-view.scss` non trova nessuna regola di background sul
pannello. Il `#f8fafc` viene da `styles/components/_form-system.scss:664-670`:

```scss
.properties-tab, .viewpoint-tab, .node-tab, .apply-to-tab, .template-tab,
.style-tab, .events-tab, .options-tab, .permissions-tab, .page-root {
  background-color: #f8fafc !important;
  ...
}
```

Blast radius contato sui consumatori vivi:

| selettore | dove vive |
|---|---|
| `.properties-tab` | 9 file `.tsx` — **entrambe le property card**: i tre pannelli di authoring IR, `SymbolCard`, `EnableIRPanel`, `Info.tsx`, `ViewData`, e `InfoData` (card della sintassi astratta) |
| `.viewpoint-tab` | `NestedView.tsx:476,496` — editor dei viewpoint |
| `.template-tab` | `TemplateData.tsx:17` |
| `.style-tab` | `PaletteData.tsx:358` |
| `.events-tab` | `CustomData.tsx:28` |
| `.options-tab` | `GenericNodeData.tsx:41` |
| `.page-root` | `Collaborative.tsx:38` |
| `.node-tab`, `.apply-to-tab`, `.permissions-tab` | zero consumatori `.tsx` (`.apply-to-tab` esiste in SCSS e si ridipinge da sé bianco a `viewapplyto.scss:47`) |

Portare quella dichiarazione a `#ffffff` **ridipinge l'editor dei viewpoint, i quattro
sotto-tab legacy della view e la pagina Collaborative**. Non è «il rail intero»: è mezza app.
E per Q7 (2026-08-08) tocca **tutte e due** le property card, quindi il gate visivo è doppio.

**(b) «Il pull negativo 20/16 e il gate `:not(:has([role=alert]))` si rimuovono, esistevano
solo per la scopatura».** Vero **solo** se il fondo diventa bianco su un antenato che copre
anche il padding. Se la regola di famiglia non si tocca (per (a)), il pull resta necessario.
Le due cose sono legate, non indipendenti.

**(c) «Body padding di sistema 14px».** L'inset che vince oggi è `16px 20px !important`
(`properties-with-tree-view.scss:578`, dentro `.properties-panel-container`). Sullo **stesso
selettore** ne esiste un secondo, `12px 16px !important` (`viewapplyto.scss:28`), che oggi
perde per specificità. Portare il primo a 14px senza toccare il secondo lascia due
dichiarazioni in conflitto sullo stesso bersaglio, ed è il tipo di stato che ha già prodotto
la confusione di partenza. **Vanno riconciliate insieme, non una sola.** Entrambe con
`!important`, entrambe scritte per vincere contro `.properties-panel { padding: 0px!important }`
(`info-improvements.scss:1186`): un terzo dichiarante sullo stesso terreno.

**(d) «Controlli fuori idioma, es. Monaco nel Source».** Nel Source **non c'è Monaco**:
`IRSourceBody` (`irTabs.tsx:200-217`) è un `<pre>` con **stili inline** — e il suo docstring
dichiara che Monaco è stato escluso apposta (peso su ogni pannello, cattura dei tasti, §15.1).
Gli stili inline non sono raggiungibili da un foglio senza `!important`: allineare il Source
è una modifica al `.tsx`, non al CSS. Il vero controllo fuori idioma è un altro: il
**`<pre>`** stesso, e il fatto che il body Source non abbia righe campo da allineare.

Quinta premessa, minore, sul 7c: il prompt chiede «evidenza ambra `#b45309` sul solo verbo».
Nel mock l'ambra sta sul **contenitore** della riga, e **ogni** span interno la sovrascrive
(`#94a3b8`, `#64748b`, `#0284c7`): a video di ambra non se ne vede. Il verbo «metamodel
declares» è `#94a3b8`. Prompt e mock non concordano — Q3.

---

## 4. Il costo nascosto: la riga campo

7a vuole `label a sinistra / controllo a destra`. Fuori da Structure il rail usa `.jj-field`,
che impila (label sopra, controllo sotto). Non è una differenza di valori, è una differenza
di layout, e `.jj-field` **non è del rail**:

- **172 occorrenze in 22 file `.tsx`**
- **67 regole in 11 file** `.scss`/`.css`
- base a `_form-system.scss:945-959` (label 11px #64748b), riscritta dalla skin B4 a 14px
  dentro `.properties-panel-container` — che è ciò che il rail misura

Trasformare `.jj-field` in riga 7a è una modifica alla card B4, quindi a **entrambe** le
property card (Q7). Le alternative sono tre e vanno ratificate (Q2):

1. **`.jj-field` diventa una riga**, scoped alla sola card view del rail. Perimetro grande,
   resa uniforme, rischio alto sui campi con controllo largo (textarea, PathBuilder,
   ListEditor) che a 383px non stanno accanto alla loro label.
2. **Riga nuova solo dove serve**, sul modello di `.ir-structure-group__row`, applicata
   campo per campo nei `.tsx`. Perimetro chirurgico, ma tocca ogni pannello e non copre i
   campi resi da componenti condivisi (`ViewParentingFields`, `MatchingSection`).
3. **Il sistema 7a non include la riga**: si promuovono densità, tipografia e controlli, e
   la label resta sopra fuori da Structure. Costo zero sui `.tsx`, ma i tab non diventano
   davvero «come 7a».

Nessuna delle tre è deducibile dal prompt.

---

## 5. Perimetro file stimato

| # | file | cosa cambia | rischio |
|---|---|---|---|
| 1 | `styles/components/_form-system.scss` | il fondo della famiglia a 10 selettori | **globale, fuori dal rail** |
| 2 | `components/editors/properties-with-tree-view.scss` | inset 16/20 → 14; skin B4 della riga campo | doppia card (Q7) |
| 3 | `components/editors/views/data/viewapplyto.scss` | la seconda dichiarazione di inset sullo stesso selettore | InfoData |
| 4 | *nuovo* `railSystem.scss` (o estensione) | il sistema: gruppi, riga, segmented, select, input, color, help | — |
| 5 | `.../authoring/StructureGroups.scss` | rimozione delle regole diventate ridondanti | regression check |
| 6 | `.../authoring/FormAuthoringBody.scss` (+ `.tsx`?) | allineamento 7c della riga di provenienza | — |
| 7 | `.../authoring/SymbolCard.scss` | il tab Symbol, che non è un tab body | — |
| 8 | `.../authoring/irTabs.tsx` | stili inline del `<pre>` del Source | tocca il `.tsx` |
| 9 | `components/viewParenting/viewParenting.scss` | i campi di Applies to | condiviso col tab legacy |
| 10 | `.../authoring/VertexAuthoringPanel.tsx` (+ Edge, Row) | wrapper/classi se si sceglie la riga (2) | 3 file |
| 11 | `.../authoring/MatchingSection.tsx` | idem | — |

**11 file, di cui uno globale e due condivisi con la card della sintassi astratta.**
Il prompt ferma a 3. Interfacce esportate: nessuna necessaria nella variante (3); la variante
(2) non ne tocca comunque, ma tocca dieci `.tsx`.

---

## 6. Le due verifiche che il prompt chiedeva prima del bianco

**Consumatori che dipendono da `#f8fafc`** — elencati in §3(a). Nessuno lo dipende in senso
funzionale (non ci sono contrasti calcolati su quel valore), ma sette superfici vive lo
mostrano, e sei sono fuori dal rail. Due membri della famiglia si ridipingono già da sé:
`.apply-to-tab` a bianco (`viewapplyto.scss:47`), `.properties-panel-container` a bianco
(`properties-with-tree-view.scss:126`) — quindi il grigio è già disatteso in parte dell'albero.

**ErrorText su bianco** — `--color-red-600` = `#dc2626` su `#ffffff`: contrasto 4.83:1,
sopra la soglia AA per testo normale, e migliore che su `#f8fafc`. Nessun fondo proprio,
nessun bordo: la riga regge il cambio. Il dark usa `--color-red-400`, ma il dark è sospeso
(R-RAIL-44) e non entra nella verifica.

---

## 7. Ratifiche necessarie prima di scrivere

**Q1 — Perimetro.** «Tutti i tab del rail» sono i cinque del vertex, o anche `Appearance` e
`Text` (edge, row)? E `SymbolCard`, che non è un tab body, entra?

**Q2 — La riga campo.** Quale delle tre vie di §4. È la scelta che decide se il perimetro
sta in 4 file o in 11.

**Q3 — Il fondo bianco.** Tre opzioni, in ordine di raggio crescente:
  (a) **restare sul body** — si generalizza il pull di `f2226b575` a tutti i body del rail
      più `SymbolCard`: 0 file globali, ma il pull e il suo coupling 20/16 restano, contro
      la lettera del prompt;
  (b) **un antenato del solo rail** — dipingere `.properties-with-tree-view--rail
      .view-editor-tab-content` e il pannello dentro di esso: raggio esatto, la famiglia
      globale non si tocca, il pull sparisce davvero;
  (c) **la famiglia globale** — come il prompt la descrive, con le sei superfici fuori dal
      rail che cambiano e il gate visivo su ciascuna.
  La (b) è quella che realizza l'intenzione del prompt senza la sua premessa sbagliata, ed è
  la raccomandazione di questo report.

**Q4 — 7c e l'ambra.** Si segue il mock (nessuna ambra visibile) o il prompt (ambra sul verbo)?
Nel codice la riga è oggi 10px `--text-2xs` / `--color-text-tertiary`, contro gli 11px
`#94a3b8` del mock: quella parte diverge in ogni caso e va allineata.

**Q5 — Il Source.** Si tocca il `.tsx` per togliere gli stili inline del `<pre>`, o il Source
si dichiara fuori sistema?

---

## 8. Ostacolo di fixture per la verifica finale

Il tab Form nella fixture `__jjodelInstallIRDemo()` non ha metaclasse impostata e mostra solo
«Set a metaclass in the Applies to tab to list its features here.»: la tabella dei widget e la
riga di provenienza 7c **non sono raggiungibili** in quello stato (ritaglio
`_tmp_rail_tab_before_form.png`). Il giro del 2026-08-29 su 7c ci arrivava con la fixture
`RowViewSmoke` più `__jjodelInstallIRDemo('AllNine','visible')`. Chi implementa deve
riprodurre quel setup, o lo screenshot «dopo» del Form tab non prova nulla.

---

## 9. Se le ratifiche arrivano, l'ordine consigliato

1. **Promozione** — fondo e inset alla sede scelta in Q3, rimozione del pull e del gate
   `[role=alert]`, rimozione delle regole ridondanti in `StructureGroups.scss`.
   Regression check: `_tmp_structure_7a.ts` deve dare gli stessi numeri di oggi, e
   `_tmp_structure_tab.ts` restare 22/22.
2. **Sistema** — il foglio condiviso con tipografia, segmented, select, input, color, help.
3. **Estensione per tab** — un tab alla volta, con lo screenshot prima/dopo di ciascuno.
4. **7c** — la riga di provenienza del Form, secondo Q4.

Due commit, come il prompt permette: (1) è la promozione, (2)+(3)+(4) l'estensione.

---

## 10. Sonde

Non committate, in `frontend/scripts/smoke/`:
`_tmp_rail_tabs_audit.ts` (baseline per tab + ritagli), `_tmp_rail_rules.ts` (attribuzione
delle regole a runtime — **inconcludente**: in dev solo 374 regole su 286 `<style>` sono
leggibili da `document.styleSheets`, e il controllo positivo `panel.matches('.properties-panel')`
passa mentre l'elenco resta vuoto, quindi il silenzio non è un risultato; l'attribuzione di
§3 è stata fatta sulla sorgente, per catena di selettori),
`_tmp_structure_7a.ts` (esteso con catena dei fondi e geometria).

---

# Addendum — Fase 2 eseguita (2026-08-29)

Le cinque ratifiche sono arrivate e la promozione è stata scritta. Questo addendum
registra come sono state sciolte le cinque domande di §7 e cosa la Fase 2 ha misurato
in più.

## Le ratifiche, e cosa hanno prodotto

**Q3 → opzione (b), la raccomandazione del report.** Il bianco sta su
`.properties-with-tree-view--rail .properties-panel-container .view-editor-tab-content`.
La famiglia globale di `_form-system.scss:664` non è stata toccata: il pannello interno
riprende il bianco con un `!important` che pareggia quello della famiglia. Il tiraggio
negativo 20/16 di `f2226b575`, il suo coupling dichiarato e il gate
`:not(:has(> [role='alert']))` sono spariti: esistevano solo per la scopatura.

**Tre classi di antenato, non due — misurato.** La sede scritta nel prompt
(`--rail .view-editor-tab-content`, due classi) è stata provata e **non basta**: la skin
B4 dichiara `.properties-panel-container .jj-field select` e `info.scss:914` dichiara
`.properties-panel .input-container select`, entrambe (0,2,1) come la sede a due classi.
A pari specificità decide l'ordine sorgente, che questo foglio controlla verso
`properties-with-tree-view` (dov'è importato in coda) ma non verso `info.scss`. Col terzo
antenato le regole di controllo salgono a (0,3,1) e la questione si chiude senza
`!important`. Prima della correzione i select di Applies to e Form restavano a
13px/r6/200px; dopo, tutti i controlli visibili di tutti i tab misurano
`12px / 28px / rgb(203,213,225)`.

**Q2 → la riga campo, e il capovolgimento che la misura ha imposto.** La prima stesura
faceva della griglia il default di ogni `.jj-field`, con due eccezioni. È stata bocciata
sullo schermo: dentro Structure il campo «Row segments» porta un `ListEditor` annidato —
un `div` con classe hashata, che l'eccezione `div:not([class])` non intercettava — e la
lista finiva schiacciata nella colonna destra. La riga è ora **opt-in**, con l'elenco dei
controlli atomici che la reggono. Un elenco di ciò che regge la riga è verificabile; un
elenco di ciò che non la regge non si chiude mai.

**Trappola CSS che ha spento tutto in una volta.** La prima versione dell'opt-in usava
`:has()` dentro `:has()`, che non è CSS valido — e un selettore invalido non cade da
solo: porta giù l'intera lista separata da virgole. A schermo la riga era sparita da
**tutti** i tab insieme, il che somiglia a «la regola non si applica» e invece era «la
regola non esiste». Riscritta con combinatori discendenti dentro l'argomento.

**Q1 → i sette tab.** `SymbolCard` è in perimetro e il sistema la raggiunge senza cambi
strutturali: vive nello stesso contenitore, e le servono due sole regole (la riga d'asse
e lo swatch a 14px), perché la sua riga non è un `jj-field`.

**Q4 → l'ambra sul verbo.** Il report aveva misurato che nel mock l'ambra sta sul
contenitore ed è sovrascritta da ogni span interno, quindi invisibile. La ratifica la
vuole sul verbo, e lì è: `--color-warning-text` vale esattamente `#b45309` in light
(`_colors-light.scss:414`) e ha una controparte dark, cosa che il literal non avrebbe.

**Q5 → il Source resta fuori.** Il `<pre>` di `IRSourceBody` porta stili inline e
toccarlo è una modifica al `.tsx`. Il tab prende il fondo e l'inset del sistema; il
blocco di codice resta com'è. Voce futura.

## Ostacolo di fixture confermato, e superato per la sola 7c

`_tmp_7c_provenance.ts` **falliva già su HEAD**, verificato riportando il tree a HEAD e
rigiocandola: `option textarea not offered ()`. La causa è `4c6bd845d`, che ha riparato
il fixture passando l'enum: `tint` è ora `Palette` e non offre più alcun override
compatibile (dump per riga: `opts: [""]`). La sonda è invecchiata rispetto a quella
riparazione — non è una regressione di Fase 2.

Per vedere davvero la riga 7c si dichiara `jjodel/renderer=swatch` su `description`
(EString, il cui unico override compatibile è `textarea`): il widget allora **copre** la
dichiarazione invece di concordarci. Misurato così, con la riga a schermo: riga e glifo
11px `#94a3b8`, verbo `#b45309` a 500, renderer coperto `#64748b` a 500, evidenza in mono
`#64748b`, Reset `#0284c7` a 500.

## Non verificato a schermo, e perché

`Appearance` e `Text` sono i due tab dei pannelli edge e row. Il fixture
`__jjodelInstallIRDemo()` installa **solo view di kind vertex** (righe del tree:
`IR Demo State`, `IR State baseVertex`, `IR State isInitialVertex`), quindi i due tab non
sono raggiungibili senza costruire una view edge o row — authoring, non stile. Sono
`ir-tab-body` sotto lo stesso scope e il sistema li raggiunge per costruzione, ma la
prova a schermo manca. Ostacolo di fixture, causa (g).

## Il controllo negativo, provato meglio di uno screenshot

La card della sintassi astratta non è solo byte-identica (`cmp` sui due PNG): è
**strutturalmente fuori portata**. Misurato sul DOM vivo, il suo pannello dà
`insideTabContent=false` — non è dentro `.view-editor-tab-content`, quindi nessuna delle
regole nuove può raggiungerla, indipendentemente dalla specificità.

L'editor dei viewpoint non è esercitabile: `NestedView` non ha importatori vivi. Il solo
riferimento fuori dal proprio file è l'`export` del barrel (`components/editors/index.ts:8`)
e una riga **commentata** in `Dock.tsx:21`. Controllo positivo sulla stessa grep: la
forma `from '…ViewData'` ne trova 2. Il suo `.viewpoint-tab` è dipinto solo dalla
famiglia di `_form-system.scss:664`, che non è stata toccata.

## Scostamenti residui, dichiarati

1. **Due input restano a 13px** in Applies to (lo stepper di Priority e il suo gemello):
   li tiene la neutralizzazione di U-5 (`properties-with-tree-view.scss:378-386`, (0,4,1)),
   scritta apposta per il difetto della casella vuota. Non toccata: sovrascriverla per
   1px di font riaprirebbe quel difetto.
2. **`Id` e `Title` del compartment editor restano impilati** mentre `Source` accanto a
   loro è una riga: i primi due sono campi di testo a piena larghezza, il terzo un select
   allineato a destra. Coerente campo per campo, non uniforme a colpo d'occhio.
3. **Il rientro degli hint della skin B4** (`margin-left` sulla colonna della label,
   `max-width: 290px`) è annullato dentro il rail: con la riga di 7a la label non occupa
   più una colonna propria e il rientro lasciava la riga di aiuto disallineata.
4. **I sotto-tab legacy di una view senza IR** (Template, Style, Events, Options) vivono
   nello stesso contenitore e prendono fondo, inset e sistema dei controlli. È il raggio
   che «tutti i tab del rail» comporta, ed è dichiarato qui perché il prompt elencava i
   sette tab IR e non questi.
5. **Il `Reset` di 7c tiene l'underline**, che il mock non ha: toglierla lascerebbe un
   comando distinguibile dal solo colore.
