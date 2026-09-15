# Prompt Claude Code — arco 2, passo 5: il registro e i debiti, corretti su misura

**Data**: 2026-08-12 01:00 (rev 3, riallineata a `d09058ae` dopo il passo 4)
**Tipo**: docs
**Perimetro**: solo `docs/` e `CLAUDE.md`. Nessun file sotto `frontend/src/`.
**Prerequisito**: passo 4 chiuso e committato, working tree pulito. Altrimenti STOP.

---

## Perché questo passo esiste

Una sessione di misura del 12 agosto ha girato l'app su un clone Linux, build di produzione servita
con `vite preview`, e ha accertato la causa che `docs/TECH-DEBT.md` lasciava aperta. Il report è
`docs/discovery/discovery_2026-08-12_harness_visivo_e_scala_entity_nel_tree.md`, da committare a sé
prima dei commit di registro se non è già nel repo (R-RAIL-20, P4).

Il risultato in una riga: **i selettori entity del tree colorano il `<span>` che contiene il glifo,
ma a dipingere è l'`<i class="bi">` interno, che ha un colore suo da una regola globale.** Il colore
non arriva mai al pixel. Verificato togliendo i tre blocchi, ricostruendo e confrontando le due
schermate: **153.258 pixel campionati, zero diversi, delta massimo 0**.

Nota di lettura: la voce di debito aveva **ragione** sulla previsione («nessun effetto visibile»).
Quello che mancava era la causa, e senza la causa nessuno poteva sapere che aveva ragione.

---

## COSA

Cinque commit, tutti in `docs/` più `CLAUDE.md`.

### Commit A — R-RAIL-36 a registro, e la sotto-regola in `CLAUDE.md`

**DOVE**: `docs/decisions.md`, in fondo alla sezione «Arco rail destro — preset 2a», dopo R-RAIL-35.

**Numerazione**: il passo 4 ha occupato **R-RAIL-34** (segmento del metamodel) e **R-RAIL-35**
(astrattezza nel guscio). La regola di questo passo e' quindi la **36**, non la 34 come diceva la
rev 2 di questo prompt.

```
- **R-RAIL-36** (2026-08-12) — Lo stile computato di un elemento è una misura della resa **solo se
  quell'elemento è quello che dipinge**. Altrimenti la misura sono i pixel. Un `color` letto su un
  contenitore non dice nulla del glifo che contiene, se il glifo ha una dichiarazione propria.
  Gradino successivo dell'emendamento a R-RAIL-28, che aveva stabilito che un report di esecuzione
  non è una misura della resa: anche una misura vera, presa sull'elemento sbagliato, non lo è.
  Nata dal caso dei glifi del tree, dove un `color` che passa da bordeaux a cyan non muove un pixel.
```

**PIÙ**, in `CLAUDE.md` §5, in coda alla sotto-regola «an assertion of absence requires proof that
the search ran», due paragrafi:

```
The same discipline applies to visual verification, twice over. First, a screenshot is evidence only
of the state it contains: before writing "X does not render", build the state where X would render
if the claim were false. A colour rule that only distinguishes two kinds proves nothing on a screen
showing one of them.

Second, a computed style is a measure of the rendering only when the element you measured is the one
that paints. Measured 2026-08-12: the tree glyph is `<span class="tree-node__icon tree-DClass"><i
class="bi bi-…"></i></span>`; the entity rules set `color` on the span, `i.bi` in
`styles/style.scss:790` sets it on the `<i>`, and a direct declaration always beats inheritance.
Removing every entity rule moves the span's computed colour from `#7A4056` to `#0ea5e9` and changes
zero pixels. When a style and a pixel disagree, the pixel is the measurement.
```

**GATE**: si tocca `CLAUDE.md`, quindi servono `npm run gen:agents`, `npm run check:agents` verde
con gli `AGENTS.md` rigenerati nello stesso commit (mai a mano), e `npm run check:docs` verde.

**NON FARE**: non emendare R-RAIL-33 sulla premessa. «Il tree resta monocromo» è **corretto**: è
quello che si vede ed è quello che i pixel confermano. Una bozza di emendamento girata nella prima
stesura del report è stata ritirata.

Nota di coordinamento: il passo 4 ha già aggiunto a R-RAIL-33 un **emendamento (2)**, su un punto
diverso e compatibile — le righe viewpoint e view-leaf restano a pastiglia perché sono righe di
documento e non di elemento. Il commit B qui sotto dice la stessa cosa quando elenca le righe da
tenere fuori dalla rimozione: verificare che le due formulazioni non si contraddicano, e se si
sovrappongono lasciare quella già a registro.

### Commit B — la causa, dentro la voce di debito

**DOVE**: `docs/TECH-DEBT.md`, voce «I selettori entity dei glifi nel tree non producono colore a
video».

**Titolo nuovo**:

```
## I selettori entity del tree colorano il contenitore, non il glifo
```

**`Stato attuale`** nuovo:

```
**Stato attuale:** causa **accertata** il 2026-08-12. Il glifo è
`<span class="tree-node__icon tree-DClass"><i class="bi bi-…"></i></span>`. I selettori entity
mettono `color` sul `<span>`; a dipingere è l'`<i>`, che prende il colore da una regola globale,
`frontend/src/styles/style.scss:790-791`, `i.bi { color: var(--font-color-1) }`, cioè `#0F172A`.
Una dichiarazione diretta batte l'ereditarietà a qualunque specificità stia il genitore, quindi il
colore entity non raggiunge mai il pixel. Misure: sul `<span>` `.tree-DClass` computa
`rgb(122, 64, 86)`; sull'`<i>` dentro di esso, `rgb(15, 23, 42)`. Rimuovendo i tre blocchi e
ricostruendo, il `<span>` passa a `rgb(14, 165, 233)` e la schermata resta **identica**: 153.258
pixel campionati, zero diversi, delta massimo 0. I tre blocchi sono
`tree-view-sidebar.scss:634-694` (light: ogni kind dichiara `color` **più** `background-color`, non
solo il colore), `:1038-1050` (dark) e `properties-with-tree-view.scss:999-1015` (copia del pannello,
che vince per specificità (0,3,0) su entrambe le proprietà). Restano fuori le righe viewpoint e
view-leaf, `tree-view-sidebar.scss:1466-1472` e `:1477-1483`, che sono pastiglie e colorano il
**fondo** del `<span>`, quindi funzionano; è la stessa eccezione che l'emendamento (2) a R-RAIL-33
ha appena messo a registro.
```

**`Fix strutturale raccomandato`** nuovo:

```
**Fix strutturale raccomandato:** rimuovere i tre blocchi, in esecuzione di R-RAIL-33. La previsione
«nessun effetto visibile» della formulazione precedente era **giusta**, ed è ora misurata: si può
fare senza rischio visivo. Ordine: i tre blocchi insieme, in un commit solo. Rimuovere la sola copia
del pannello lascerebbe vincere il blocco light del foglio del tree, che dichiara anche un
`background-color`, e quello un pixel lo muove. Da non fare in questo giro: far arrivare il colore
al glifo. Richiederebbe di disinnescare `i.bi` nel perimetro del rail, che è un cambio globale, e
farebbe emergere la quarta palette della voce seguente.
```

`Priorità`: `bassa — nessun effetto a video, è igiene del foglio in esecuzione di R-RAIL-33.`

### Commit C — chiusura della voce sugli `@import` dei font

**DOVE**: `docs/TECH-DEBT.md`, voce «Validità degli `@import` di Google Fonts in `_typography.scss`».

```
**Stato attuale:** **chiusa il 2026-08-12, misurata.** I font si caricano su entrambi i percorsi.
In produzione i due `@import` sono le prime cose in `frontend/dist/assets/index-*.css`, subito dopo
`@charset "UTF-8"` e prima di qualunque regola. In sviluppo, misurato su un progetto vite minimo che
importa quel solo partial, lo `<style>` iniettato espone due `CSSImportRule` come prime due regole e
le due richieste a `fonts.googleapis.com` partono. Il rialzo è della compilazione Sass, non del
bundler, quindi vale su entrambi i percorsi. Controprova sulla stessa macchina: uno `<style>` in cui
l'`@import` segue una regola di stile perde l'import dal CSSOM e non emette richieste, quindi la
misura sa distinguere i due esiti.
```

```
**Fix strutturale raccomandato:** nessuno sul caricamento. Resta il commento a
`frontend/src/styles/tokens/_typography.scss:72`, che dice «Load Inter and JetBrains Mono» mentre
l'import a `:84` è di IBM Plex Mono; JetBrains Mono arriva da `frontend/index.html:11` per Monaco.
Correzione già prevista nel passo 6.
```

`Priorità`: `chiusa.`

**PIÙ**: in coda a R-RAIL-5 in `docs/decisions.md`, una riga:
`**Verificato il 2026-08-12**: C5.2 misurata su entrambi i percorsi, voce di debito chiusa.`

### Commit D — voce nuova: la quarta palette entity

**DOVE**: `docs/TECH-DEBT.md`, voce nuova in fondo.

```
## Una quarta palette entity, globale e non scopata

**Registrato:** 2026-08-12
**Origine:** accertamento della causa dei glifi monocromi. Cercando quale regola vincesse su
`.tree-node__icon.tree-DClass` è emerso un concorrente che nessun documento nominava.
**Stato attuale:** `frontend/src/components/forEndUser/tree.scss` dichiara **ventitré** selettori
entity senza alcuno scoping, con una palette propria: ambra per i package, **cyan `#0ea5e9` per le
classi**, verde per gli attributi, viola per le reference, cyan più scuro per le operation, grigio
per i parameter. Il foglio è importato da `components/forEndUser/Tree.tsx:16`, cioè dal tree legacy
per end user, ma i selettori sono globali e colpiscono anche il tree del rail, dove perdono per
specificità (0,1,0 contro 0,2,0 e 0,3,0). Misurato: rimuovendo i tre blocchi entity del rail,
`.tree-DClass` passa a `rgb(14, 165, 233)`. È il cyan che R-RAIL-30 ha escluso dalla scala perché
prenotato dalla selezione. Oggi non dipinge, per la stessa ragione della voce precedente.
**Fix strutturale raccomandato:** scopare i selettori sotto la radice del componente legacy, non
cancellarli: quel tree è vivo. Va fatto **prima** di qualunque intervento che porti il colore ai
glifi, altrimenti il primo che disinnesca `i.bi` nel rail si ritrova la palette del 2023 con il cyan
sulle classi.
**Priorità:** bassa oggi, alta il giorno in cui si tocca `i.bi`.
**Effort stimato:** mezza giornata.
**Riferimenti:**
- `docs/decisions.md` — R-RAIL-30, R-RAIL-33, R-RAIL-34
- `docs/discovery/discovery_2026-08-12_harness_visivo_e_scala_entity_nel_tree.md` §5
```

### Commit E — correzione dei riferimenti sbagliati

**DOVE**: `docs/TECH-DEBT.md`. **Rimisurati su `d09058ae`**, cioè dopo il passo 4. Un solo numero è
cambiato rispetto alla rev 2: la copia del pannello è passata da `:921-937` a `:999-1015`, spostata
dalle 78 righe di SCSS che il passo 4 ha aggiunto allo stesso foglio. Gli altri sei sono invariati,
verificati uno per uno.

| voce | dice | scrivere |
|---|---|---|
| `entityMeta.ts` | «le diciotto voci» | «le quindici voci» |
| restyle del tree | `.tree-feature__name` a `:1899` | `:1890`; `:1899` è in `.tree-feature__type` |
| teal | `MegamodelView.scss:261-262` | `:261-262` e `:467` |

Le altre quattro correzioni di riga sono già dentro il testo riscritto al commit B.

---

## Verifiche

- `npm run check:docs` verde a ogni commit.
- `npm run check:agents` verde e `AGENTS.md` rigenerati, **solo** al commit A.
- Scope stretto, mai `git add .`.
- Nessun file sotto `frontend/src/`. Se ti ci trovi, STOP.

## Hard stop

1. Working tree non pulito all'inizio → STOP.
2. R-RAIL-36 già presente, oppure il numero 36 già occupato da un passo successivo → STOP,
   confronta invece di duplicare e riallinea la numerazione.
3. `check:agents` rosso dopo `gen:agents` → STOP, non forzare.
4. I numeri di riga del commit E non corrispondono a quello che leggi → STOP e riporta i valori
   reali. Non si corregge una citazione sbagliata con un'altra citazione sbagliata.

## Log

Formato §21.2. `Corregge`: `2026-08-11_1734_prompt_arco2_passo2_ripresa_C_D_E.md` per i commit B e
C, `—` per gli altri. `Causa`: `(c)`. `Layer Impact Report`: `not-required`.
`Smoke visivo`: `non applicabile`, il passo non tocca codice.
