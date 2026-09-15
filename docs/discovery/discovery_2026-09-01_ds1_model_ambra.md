# DS-1 — la coppia `model` esce dai contenitori e torna ambra

Referto della slice DS-1, corsia veloce (RC-3). Prompt: `docs/prompts/PROMPT_ds1_entity_model_amber.md`
piu' l'inline del 2026-09-01 che ratifica l'opzione **(A)** e aggiunge `docs/DESIGN-SYSTEM.md`
§2.2 al perimetro.

## 1. L'ipotesi che questa discovery poteva falsificare

Che i quattro valori dettati dal prompt fossero quelli giusti: L, C e H dentro la
costruzione della scala, ΔE sopra il pavimento in **entrambi** i temi, contrasto
almeno quello dichiarato. Se uno dei quattro numeri non fosse tornato, (A) sarebbe
caduta e la slice si sarebbe fermata su (C).

Non e' caduta. I numeri del prompt sono **riprodotti tutti**, a quattro decimali,
ricalcolandoli da zero in OKLab sui nove esadecimali committati — non copiati dal
referto precedente.

## 2. La misura, rifatta

Convertitore scritto per l'occasione (sRGB → lineare → LMS → OKLab → OKLCh), zero
dipendenze nuove; poi trapiantato dentro il test cosi' che la regola sia difesa e non
solo verificata una volta.

### Le nove coppie committate, e il pavimento

```
chiaro   fondo L 0.934-0.936   C 0.017 (tenue) | 0.030-0.032 (satura)
         testo L 0.449-0.451   C 0.046-0.047   | 0.084-0.086
scuro    fondo L 0.299-0.301   C 0.030-0.032   | 0.056
         testo L 0.844-0.846   C 0.042-0.043   | 0.076-0.077
```

Pavimento = la ΔE OKLab minima fra i fondi di due famiglie **diverse**:

| tema | pavimento | coppia che lo fissa |
|---|---|---|
| chiaro | **0.0143** | `class` / `object` |
| scuro | **0.0243** | `class` / `object` |

Coincide con il prompt. Non e' una costante scelta: il test lo **ricalcola** a ogni
giro sulle coppie che trova nel foglio, quindi se domani la scala cambia il pavimento
cambia con lei.

### La coppia nuova

| | chiaro | scuro |
|---|---|---|
| fondo | `#F3E8D3` — L 0.934 C 0.030 H 83.6 | `#3B2B06` — L 0.300 C 0.056 H 83.9 |
| testo | `#6B5110` — L 0.451 C 0.085 H 85.0 | `#E4C992` — L 0.846 C 0.078 H 84.7 |
| contrasto | **6.16:1** | **8.52:1** |
| ΔE vs `enum` | **0.0146** (pav. 0.0143) | **0.0263** (pav. 0.0243) |
| ΔE vs `literal` | 0.0172 | 0.0324 |
| ΔE vs `reference` | 0.0165 | 0.0300 |

Il margine sopra il pavimento e' sottile in chiaro (0.0003) e comodo in scuro
(0.0020). E' il prezzo dichiarato dell'opzione (A): H 85 e' **l'unica** tinta ambra che
sta sopra il pavimento in tutti e due i temi, e la scala non ammette un terzo grado di
croma senza essere riaperta (opzione B, non presa).

Il vicino piu' stretto in chiaro non e' `enum` per un soffio ma **e' comunque `enum`**:
0.0146 contro 0.0165 di `reference`. La distinzione a schermo e' percettiva, e la
sezione 4 la misura invece di ipotizzarla.

## 3. Il diff

`frontend/src/styles/tokens/_colors-light.scss` e `_colors-dark.scss`: `model` esce dal
blocco alias ed entra fra le coppie canoniche, in coda, con il commento che porta i
numeri. I **sei** contenitori restanti (`metamodel`, `package`, `viewpoint`,
`transformation`, `refactoring`, `view`) non si toccano.

Nota che vale un sorriso: il commento del blocco alias diceva gia' «Alias — **sei**
contenitori» mentre ne elencava sette. Con questa slice la frase diventa vera; nessuna
modifica al commento e' stata necessaria.

`docs/DESIGN-SYSTEM.md` §2.2 «Model — Amber» riscritta: la rampa dichiarata (che i
token non applicavano) e' sostituita dalla coppia a token, con i numeri OKLCh, i due
contrasti e i due pavimenti; i letterali storici restano in tabella come **non
autorevoli**, con i percorsi verificati (vedi §6).

## 4. Il gate visivo — la sonda

`frontend/scripts/smoke/_tmp_ds1_verify.ts`, non committata (`.gitignore:66`). Due giri
con lo **stesso** file: `before` con i due fogli token riportati a `HEAD`, `after`
sull'albero della slice. Non `git stash`, deliberatamente: 10h stava scrivendo in
`instanceManagerTab.scss` nella stessa corsa e uno stash avrebbe toccato il suo lavoro.

**Esito: before 27 PASS / 4 FAIL — after 31 PASS / 0 FAIL. Zero errori di pagina in
entrambi.**

Le quattro rosse del before sono, per costruzione, le sole che misurano la slice:
`1a` (il token non e' piu' il fondo del contenitore) e `2d` (nessuna delle tre superfici
e' rimasta ardesia), in chiaro e in scuro.

Le asserzioni `2a/2b/2c` sono verdi in **entrambi** i giri, ed e' il loro punto: dicono
che le tre superfici leggono il **token**, qualunque valore abbia. Una che fosse rossa
nel giro after avrebbe detto che quella superficie dipinge un letterale — il difetto
che il prompt chiede di cercare. Nessuna lo fa.

### Le tre superfici, misurate a schermo (computed style, non sorgente)

| superficie | selettore | chiaro | scuro |
|---|---|---|---|
| A. rail Properties, glifo | `.props-header__glyph.jj-type-badge--model` | `rgb(243,232,211)` / `rgb(107,81,16)` | `rgb(59,43,6)` / `rgb(228,201,146)` |
| A. rail Properties, chip | `.props-header__kind.jj-type-badge--model` | trasparente / `rgb(107,81,16)` | trasparente / `rgb(228,201,146)` |
| B. outline del manager, badge `m` | `.instance-manager__outline-badge` | `rgb(243,232,211)` / `rgb(107,81,16)` | `rgb(59,43,6)` / `rgb(228,201,146)` |
| C. menu «New document», voce Model | `.new-document__badge` | `rgb(243,232,211)` / `rgb(107,81,16)` | `rgb(59,43,6)` / `rgb(228,201,146)` |

Il badge `m` di 10f **vira per eredita'**, come il prompt richiedeva: nessuna riga di
`instanceManagerTab.scss` e' stata toccata.

**Una correzione alla sonda, non al prodotto.** La prima versione chiedeva il *fondo*
anche al chip del rail ed era rossa in entrambi i temi. Misurato:
`properties-with-tree-view.scss:431-432` gli mette `background: none` dentro la testata,
quindi il chip legge la coppia **solo per il testo**. Asserzione corretta a quello che il
prodotto fa per disegno. E' l'errore che il §5 di CLAUDE.md chiama per nome: una regola
che «sembra» giusta letta nel sorgente, contro il pixel che la contraddice — e vince il
pixel.

### Controlli, positivi e negativi, nello stesso giro

- **C1** — le tre superfici sono tutte nel DOM prima di leggerne il colore. Nella prima
  versione della sonda il rail era `null` (il manager e l'editor non convivono in un tab
  solo) e le sue asserzioni sarebbero passate su `undefined === undefined`: un silenzio
  indistinguibile da un verde. Corretta aprendo le due viste **a turno**.
- **C2/C3** — la striscia ha tutti e cinque i badge, i token vicini non sono stringhe
  vuote.
- **1b, per contrasto** — il badge `metamodel` e' ancora ardesia, e lo e' in tutti e due
  i giri: la slice ha spostato `model` e nient'altro.
- **4a/4b** — il badge istanza dell'outline resta sulla coppia `class`, e la lettera del
  modello resta `m` minuscola: 10f non e' stata scalfita.

### La striscia di giudizio

`model`, `enum`, `literal`, `class`, `metamodel` affiancati, costruiti con le **classi
del foglio spedito** (`.jj-type-badge--*`) e non con esadecimali scritti nella sonda —
altrimenti si fotograferebbe la sonda invece del prodotto. Ritagli:
`_tmp_ds1_{before,after}_{light,dark}_2_strip.png`.

**Verdetto.** Il gate passa in entrambi i temi. Nel `before` **`MODEL` e `METAMODEL`
sono lo stesso pixel** — e' quella l'indistinguibilita' che c'era, e non era fra model
ed enum. Nell'`after` `model` legge oliva-oro, `enum` pesca-arancio, `literal`
beige-tortora: tre pastelli caldi diversi, il piu' vicino dei quali sta sopra il
pavimento che la scala gia' accetta fra `class` e `object`. In scuro la separazione e'
piu' larga, come i numeri prevedono.

La decisione ultima e' di chi guarda: i ritagli sono agli atti e la slice si ferma su
(C) se il giudizio e' opposto. La misura, da sola, non basta a chiudere un gate
percettivo — e' per questo che il prompt ne chiedeva uno.

## 5. I test committati

`frontend/src/styles/__tests__/entityModelAmberDs1.test.ts` — 21 casi, nuovo file.

Le asserzioni geometriche leggono gli esadecimali **dal foglio**, non dalle costanti del
test. Non e' un dettaglio: la prima versione li leggeva dalle proprie costanti, e una
mutazione che portava il token a H 70 (sotto il pavimento) lasciava verdi tutte le
asserzioni di ΔE tranne quella sul valore esatto. Un test che misura il proprio
letterale non difende niente.

Provato con **sei** mutazioni, ognuna ripristinata a verde:

| mutazione | rossi |
|---|---|
| `model` torna alias del contenitore (chiaro) | 2 |
| tinta a H 70 (`#F7E6D4`/`#734C17`, sotto il pavimento) | 4 |
| grado di croma tenue invece che saturo | 5 |
| `package` de-aliasato | 1 |
| `.jj-type-badge--model` vira a letterale nel foglio | 2 |
| `model-fg` scuro uguale a `enum-fg` | 4 |

## 6. Percorsi verificati, e due che erano sbagliati

I riferimenti ai quattro letterali ambra sono stati **cercati**, non copiati. Due erano
fuori bersaglio:

| riferimento in circolazione | reale |
|---|---|
| `element-badge.scss:28` | `components/common/element-badge.scss:29-30` (piu' `:111` in scuro) |
| `dashboard.scss:1129` | `pages/dashboard.scss:1126` |
| `MegamodelView.scss:256,266,462` | corretto — `components/megamodel/MegamodelView.scss` |
| `EditorV2.scss:~810` | corretto — il blocco `&__badge` |

Un quinto sito porta gli **stessi** due esadecimali senza essere il modello:
`components/project/project-editor.scss:794`, `data-type="validation"`. Non converge con
gli altri quattro; se si toccasse per somiglianza di colore si tingerebbe un badge di
validazione.

**Reperto per la slice a valle.** Il commento di `EditorV2.scss:797-808` giustifica il
proprio letterale scrivendo che «those tokens alias `--color-entity-container-bg/fg` in
both themes». DS-1 lo ha falsificato. Il file e' fuori perimetro e il commento resta
dov'e': va aggiornato dalla slice che fa convergere i quattro letterali sul token, e la
sua premessa non regge piu' nemmeno come motivazione.

## 7. Gate

- `npm run typecheck` — **33**, baseline invariata, conteggio su output **completo**
  (`EXIT=2`, che e' la baseline).
- `npm run build` — exit **0**, solo il warning noto sulla dimensione dei chunk.
- `npx vitest run` — **2710 passati / 0 falliti**; 9 file rossi = i noti
  `window is not defined`, nessuno di questa slice.

## 8. Domande aperte

1. Il margine di 0.0003 sul pavimento in chiaro e' reale ma minuscolo. Se l'occhio lo
   dice insufficiente, la strada non e' un'altra tinta ambra — non ce ne sono — ma
   l'opzione (B): un terzo grado di croma, cioe' una modifica alla **costruzione** della
   scala, da riaprire come slice propria.
2. `viewpoint` collide con `model` sulla card del megamodel (`#FAEEDA / #854F0B` per
   entrambi, difetto registrato il 2026-08-12). DS-1 non lo tocca: quella coppia e'
   letterale su quella superficie, e la convergenza e' la slice a valle.
3. Il limite della famiglia contenitori resta aperto
   (`claude_2026-08-12_classificazione_teal_e_limite_della_famiglia_contenitori.md` §3
   punto 2). DS-1 ne stacca **un membro**, non riscrive la regola.
