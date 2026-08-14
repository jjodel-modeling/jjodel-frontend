# Discovery: `labelBox` come inset del contenuto sulle forme non rettangolari

**Data**: 2026-08-14
**Autore**: chat di progetto (lettura diretta del working tree + misura in Chromium)
**Branch**: `alfonso-frontend-jjtl`, HEAD `b0d639e39`
**Stato del working tree**: pulito salvo due path untracked (`.claude/settings.local.json`, `_to_delete/`)
**Natura**: discovery breve, svolta in chat. Le sezioni sono marcate `[letto]`, `[misurato]` o `[inferito]`.

---

## 1. Obiettivo

Il punto 3 della roadmap di fine sessione recita: *"`labelBox` come inset inline sul content box: e' cio' che rende usabili le forme non rettangolari, il contenuto HTML oggi non sa nulla del contorno"*. La discovery doveva stabilire il meccanismo CSS con cui applicare l'inset e la formula per calcolarlo.

Esito in una riga: **l'inset statico e' il primitivo sbagliato, e applicarlo peggiorerebbe il caso piu' comune invece di migliorarlo.** La formula corretta esiste gia' nel registry, sotto un altro nome.

---

## 2. File letti

- `frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx` (315 righe, integrale)
- `frontend/src/components/editor-v2/viewpoint/ir/irStyle.ts` (151 righe, integrale)
- `frontend/src/components/editor-v2/viewpoint/ir/shapeRegistry.ts` (integrale)
- `frontend/src/components/editor-v2/nodes/ObjectNode.tsx:370-440` (ramo IR)
- `frontend/src/components/editor-v2/EditorV2.scss` (blocco `.mm-node`)

Superficie di `.ir-node-content`: **un solo produttore** (`IRNodeContent.tsx:182`), stile tutto in `irStyle.ts`. Nessun consumatore esterno al modulo. `[letto]`

---

## 3. Metodo di misura

Le domande CSS sono state risolte in un harness Chromium (Playwright, `chromium-1194`) che replica la catena reale: le regole `.mm-node` / `.mm-object` estratte da `EditorV2.scss` e il `BASE_CSS` di `irStyle.ts` verbatim, con quattro candidati a confronto sullo stesso markup. Quattro casi per candidato, sonde su box, label e layer SVG. Nodo di prova 170x80, etichetta `TrafficLightController` a 11px/1.3.

Motivo: le tre domande in gioco (risoluzione delle percentuali, containing block dell'SVG assoluto, larghezza dei flex item sotto `align-items: center`) sono tutte casi in cui il ragionamento a tavolino sbaglia facilmente.

---

## 4. Findings

### F1. Il padding percentuale non tocca il layer SVG `[misurato]`

Timore a priori: `padding` su `.ir-node-content` avrebbe ristretto il rombo, perche' `.ir-diamond-svg` e' `position: absolute; inset: 0; width: 100%`.

Misura: con `padding: 0 25%` sul box da 170px, `svgW` resta **168px**, identico alla baseline, e `svgLeftOffset` resta 1px. Il containing block di un figlio assoluto e' il **padding box** del contenitore relativo, che include l'area di padding. Il timore era infondato: il meccanismo del padding e' compatibile con il painter SVG.

### F2. Le percentuali verticali non sono esprimibili come padding `[letto, noto]`

Le percentuali di `padding` risolvono sull'**inline size** (la larghezza) su tutti e quattro i lati, anche nelle proprieta' logiche. Il fix degli handle era sfuggito al problema perche' usava `top`/`bottom` su `inset`, dove la percentuale risolve sull'altezza.

Conseguenza: un inset a due assi richiede un elemento posizionato (`inset: Y% X%`) o una griglia a tracce percentuali. Il padding puo' portare **solo la componente orizzontale**.

### F3. Le label non sono vincolate in larghezza da nulla `[misurato]`

`.ir-label` ha `overflow: hidden; text-overflow: ellipsis; white-space: nowrap`, ma sotto `align-items: center` (regola `ir-shape--diamond`) il flex item e' auto-width: prende la larghezza naturale del testo e sborda, e l'ellissi non scatta mai. Misurato: con `padding: 0 25%` e area utile di 83px, la label resta larga **131.8px**, centrata sul padding box e sbordante in modo simmetrico. Serve un `max-width: 100%` esplicito perche' il padding produca un effetto.

Sull'ellisse il default e' `stretch`, quindi la label prende la larghezza del box e l'ellissi scatta: ma al bordo del **rettangolo circoscritto**, non del contorno.

### F4. L'inset da rettangolo inscritto e' una regressione visibile `[misurato]`

Il rettangolo inscritto di area massima vale `w/2 x h/2` per il rombo (25% di rientro per lato) e `w/√2 x h/√2` per l'ellisse (14.64% per lato). Applicati:

| caso | area utile | larghezza label | ellissi |
|------|-----------|-----------------|---------|
| rombo 170x80, baseline | 168 px | 131.8 px | no |
| rombo 170x80, inset 25% | **83 px** | 83 px | **si** |
| ellisse 170x80, baseline | 168 px | 168 px | no |
| ellisse 170x80, inset 14.64% | **118.3 px** | 118.3 px | **si** |

Un'etichetta che oggi si legge per intero, e che sta **dentro** il contorno, verrebbe troncata. Il rettangolo inscritto e' dimensionato per la banda peggiore, mentre una label a riga singola occupa la banda migliore, quella centrale.

### F5. La formula giusta e' gia' nel registry `[inferito da F4, verificato numericamente]`

Per una riga sola di altezza `hL` centrata verticalmente in un nodo alto `h`, la larghezza disponibile e':

- rombo: `w · (1 − hL/h)` → a 170x80 con `hL` = 14.3 px: **139.6 px**, e la label da 131.8 ci sta
- ellisse: `w · √(1 − (hL/h)²)` → **167.3 px**, praticamente tutta la larghezza

Sono esattamente `1 − 2·insetFractionAt(t)` valutata al bordo della banda occupata dal contenuto, con `t = 0.5 ± hL/2h`. La funzione e' gia' in `shapeRegistry.ts`, scritta per un altro scopo.

**Rileggere `insetFractionAt` come profilo di semilarghezza della forma, e non come "rientro degli handle", e' il finding strutturale della discovery.** Gli handle sono stati il primo consumatore di quella funzione, non la sua ragione d'essere.

### F6. Il caso davvero rotto e' l'ellisse in content-hug `[misurato]`

Prima di qualunque resize, l'ellisse non ha un floor (`min-width: 0; min-height: 0`) e il box collassa all'altezza della riga: misurato **135.8 x 16.3 px**, con la label che riempie tutta la larghezza di un'ellisse alta 16 px. Qui il testo esce dal contorno in modo grossolano, e non per colpa dell'inset: manca un rapporto fra l'altezza del contenuto e l'altezza della forma.

Questo, e non la label centrata nel rombo, e' il difetto che un utente incontra per primo.

---

## 5. Dipendenze e rischi

- **Specificita'**: `.ir-node-content.ir-shape--diamond > :not(.ir-diamond-svg)` vale (0,3,0) e batte una regola `.ir-shape-content` a (0,2,0). Un wrapper introdotto senza pareggiare la specificita' viene silenziosamente ignorato: e' successo nell'harness ed e' passato inosservato fino alla lettura dei numeri.
- **Content-hug**: un wrapper `position: absolute` non contribuisce alla dimensione intrinseca. Su `rect` e `rounded` (inset nullo) farebbe collassare i nodi al floor 140x40 indipendentemente dal contenuto. Un wrapper va quindi reso assoluto **solo** per le forme con inset non nullo, cioe' condizionato al descriptor.
- **Nessun gate eseguibile da questa superficie**: typecheck di progetto, build e test di progetto restano non eseguiti (VM Linux aarch64, `node_modules` darwin-arm64).

---

## 6. Domande aperte per Alfonso

1. **Il contenuto multi-banda va risolto ora o dopo?** Compartimenti dentro forme geometriche sono il caso che richiede l'inset per banda. Oggi sono rari perche' le forme geometriche si usano per nodi-etichetta.
2. **Il floor dell'ellisse in content-hug (F6) e' un bug a se'?** Sospetto di si, e che vada chiuso prima e separatamente dal labelBox.
3. **`container` derivato (D5, soglia 80%)**: la soglia va misurata sul rettangolo inscritto o sulla banda? Con la lettura a banda la soglia cambia significato.

---

## 7. Riproducibilita'

Harness e script di misura: `docs/discovery/harness/labelbox_2026-08-14.html` e `labelbox_2026-08-14.mjs`. Si eseguono con `node labelbox_2026-08-14.mjs` avendo Playwright e un Chromium disponibile; stampano la tabella di F4 e salvano uno screenshot comparativo.
