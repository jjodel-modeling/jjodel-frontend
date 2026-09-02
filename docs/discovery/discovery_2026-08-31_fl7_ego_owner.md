# FL7 — il nodo owner nell'ego-diagramma. Fase 1.

Data: 2026-08-31. Prompt: `PROMPT_FL7_ego_owner.md` (da scrivere in `docs/prompts/`,
non `docs/prompt/`: quella directory **non esiste** — misurato, `ls docs/prompt` esce
non-zero, `ls docs/prompts` elenca 30 voci).

## 0. L'ipotesi che questa discovery falsifica

«L'owner e' un dato che l'ego-diagramma non ha, e prenderlo costa un giro nell'host
(`egoInputOf`, in `editor-v2/hooks/neighborhoodDraw.ts`) e quindi un file fuori dal
perimetro dichiarato.»

**Falsificata.** L'owner e' gia' dentro `EgoInput`, e ci arriva verbatim.

## 1. Obiettivo

Stabilire, prima di scrivere una riga, (a) da dove viene l'owner senza allargare il
perimetro, (b) quali test esistenti la modifica sposta, (c) dove il prompt chiede una
cosa che il perimetro dichiarato non contiene.

## 2. File letti

- `frontend/src/jjform/egoNeighborhood.ts` (intero, 430 righe)
- `frontend/src/jjform/__tests__/egoNeighborhood.test.ts` (intero, 340 righe)
- `frontend/src/components/abstract/tabs/EgoDiagram.tsx` (intero)
- `frontend/src/components/abstract/tabs/egoDiagram.scss` (intero)
- `frontend/src/components/abstract/tabs/InstanceManagerTab.tsx` 930–1120 (`EgoRow`, `EgoList`)
- `frontend/src/components/editor-v2/hooks/neighborhoodDraw.ts` 1–330 (`ownerLinkOf`, `neighborhoodOf`, `egoInputOf`)
- `frontend/src/components/editor-v2/hooks/shapeDraw.ts` 154–213 (`referencedBy`)
- `frontend/src/components/editor-v2/hooks/createDraw.ts` 143–152 (`ownerOf`)
- `frontend/src/jjform/shape.ts` 152–188 (`IncomingRef`)
- `frontend/src/styles/tokens/_colors-light.scss`, `_colors-dark.scss` (grep sui ruoli)
- `docs/design/design_handoff_instance_node/13a Diagramma Embedded.dc.html` (opzione 1a)

## 3. Findings

### 3.1 L'owner e' gia' nell'ingresso, e non serve toccare l'host

`EgoInput.incoming` e' `referencedBy(idlookup, subjectId)` **verbatim**, contenimento
incluso e marcato — `neighborhoodDraw.ts:264`:

```ts
return { subject, outgoing, incoming: referencedBy(idlookup, subjectId) };
```

e il modulo puro scarta il contenimento **dopo**, dentro di se'
(`egoNeighborhood.ts:210`):

```ts
const pointers = (input.incoming ?? []).filter(r => r && !r.composition);
```

Che il padre di contenimento compaia li' dentro non e' un'inferenza: e' scritto come
avvertimento in `shape.ts:161`, «an owner is not a referrer, and counting it would put
a 1 on every contained instance in the model», ed e' materializzato nella fixture del
test, `egoNeighborhood.test.ts:75` — `incoming(HEATER, 'states', true)`.

**Conseguenza sul perimetro**: `owner` si ricava da `input.incoming.find(r =>
r.composition)`. Zero modifiche a `neighborhoodDraw.ts`, zero cambi di firma di
`egoInputOf`, zero cambi alle prop di `EgoDiagram` viste dall'ospite. La clausola
del prompt «il mount dell'ego e' tuo solo se la firma delle prop cambia» **non si
attiva**.

### 3.2 «istanza rootable → owner: null» cade da sola

`referencedBy` accetta solo sorgenti che matchano `^idlookup\.([^.]+)\.values(\.\d+)?$`
con `slot.className === 'DValue'` e `father.className === 'DObject'`
(`shapeDraw.ts:186–194`). Un'istanza radice ha per `father` il **modello**, che non e'
un `DObject` e la cui collezione e' `idlookup.<id>.objects` — esclusa dal pattern per
costruzione, come il commento di `VALUE_POINTER` gia' dichiara. Nessuna voce
`composition` -> `owner: null`. La radice non e' un nodo perche' non arriva mai.

### 3.3 Due sorgenti dell'owner, e questa non e' quella di 13a

Il riquadro 13a prende l'owner dalla catena `father` (`createDraw.ownerOf` ->
`neighborhoodDraw.ownerLinkOf`). Il nastro lo prendera' dall'indice inverso
`pointedBy`. Sono due letture dello stesso legame e in un modello sano coincidono; se
divergessero, diverge il **bookkeeping** del reducer, non il disegno. Lo dichiaro
invece di nasconderlo: non introduco `ownerOf` nel modulo puro perche' vorrebbe dire
un `idlookup` dentro `jjform/`, che l'invariante della directory vieta (un solo
import, di tipo, da `./shape`).

Limite noto e accettato: se un modello corrotto avesse **due** puntatori di
contenimento verso la stessa istanza, si prende il primo in ordine di
`referencedBy` (che ordina per nome della sorgente, poi feature, poi indice).

### 3.4 Il token della linea di contenimento esiste gia'

Il prompt chiede `#cbd5e1`. `--color-form-border-strong` **e'** `$slate-300` =
`#cbd5e1` in chiaro (`_colors-light.scss:401`) e ha la sua controparte scura
(`_colors-dark.scss:300`). La sottoetichetta a slate-400 e' `--color-form-muted`, gia'
letto dal foglio. Nessun token nuovo, regola 28 rispettata.

### 3.5 `EgoSide` va allargato, e i consumatori reggono

`side` e' oggi `'incoming' | 'outgoing'`. L'owner non e' ne' l'uno ne' l'altro. Cercati
tutti i consumatori del campo: `capped()` (lo riceve come argomento), `EgoArrow.side`,
e due chiavi di React (`node.side + ':' + node.id`) in `EgoDiagram.tsx:92` e
`InstanceManagerTab.tsx:1040`. **Nessuno `switch` esaustivo, nessun confronto di
uguaglianza sul tipo** salvo `a.side === 'incoming'` nei test di layout, che riguardano
frecce e non l'owner. Allargare l'unione e' additivo.

### 3.6 Quali test esistenti si spostano

La fixture `heater()` **ha gia'** il contenimento (`incoming(HEATER, 'states', true)`),
quindi ogni asserzione che parte da li' vede un owner da domani. Verificate una per
una, contando su un'implementazione che aggiunge una **banda superiore** e non tocca le
x:

| test | file:riga | esito atteso |
|---|---|---|
| `1 incoming, 2 outgoing, referenced by 3` | 92 | invariato (il conteggio non cambia) |
| `il contenimento non e' un referrer` | 116 | invariato — resta vero: non e' fra gli **incoming** |
| `entranti a sinistra…` (x e width) | 288 | invariato se l'owner sta dentro la larghezza gia' calcolata |
| `una freccia per vicino` (`arrows.length === in+out`) | 322 | **si rompe** se il link dell'owner finisce in `arrows` |

Da cui la scelta di progetto: il link dell'owner **non** e' un `EgoArrow`. E' un campo
a se' di `EgoLayout` — e deve esserlo comunque, perche' e' l'unica linea senza marker
e il renderer la deve distinguere. Gli altri test di layout usano fixture senza
contenimento e non si muovono.

### 3.7 Il conflitto di perimetro: il fallback vive nella tabella

Il prompt chiede «Fallback lista testuale (FL6): guadagna il gruppo owner in testa» e,
tre righe sotto, «NON toccare: … la tabella». Il fallback **e'** `EgoList`, e sta in
`InstanceManagerTab.tsx:1006–1120`. Le due clausole non possono valere entrambe.

Peggio: quel file e' **conteso adesso**. Working tree al momento della lettura:
`instanceManagerTab.scss` modificato (barra di selezione della riga dell'outline,
`--color-selection-bar`) e `__tests__/instanceManagerOutline.test.ts` non tracciato —
la sessione 10b, in corso. `InstanceManagerTab.tsx` non e' ancora sporco, ma e' il
prossimo file che quella slice tocca.

Il costo reale della clausola e' minimo: `group()` esiste gia' e `entry()` rende un
`EgoNode` qualsiasi, quindi l'aggiunta e' **una riga** prima di `{group('incoming', …)}`.
Non e' il costo il problema, e' la collisione. -> Domanda aperta 1.

## 4. Dipendenze e rischi

- Nessun file di `CLAUDE.md` §3.1 nel perimetro: **Layer Impact Report non richiesto**.
  Zero creatori D, zero `TRANSACTION`, zero `SetFieldAction`: il modulo resta puro e il
  componente resta senza import da `editor-v2/`, `joiner/`, `redux/` (invariante
  asserita in `egoDiagram.test.ts`, che va tenuta verde).
- `jjform/index.ts` (il barrel) esporta gia' tipi e funzioni di `egoNeighborhood`
  (righe 140–159). Un tipo **nuovo** esportato dal modulo non compare nel barrel senza
  toccarlo. Evito il problema non introducendo tipi nuovi: `owner` e' un `EgoNode`, che
  il barrel gia' esporta.
- La fixture del prompt dice «Running (owner Region_main)». `Region_main` **non esiste**
  nel codice: e' un nome della board 13a. Nella fixture reale l'owner di `Running` e'
  `Heater` via `states`. Verificato con controllo positivo (`Heater` compare, 3 hit).
  Il test si scrive sulla fixture reale.

## 5. Domande aperte

1. **Il fallback testuale.** Aggiungo il gruppo «owner» a `EgoList` — una riga in
   `InstanceManagerTab.tsx`, file conteso con 10b — oppure lo lascio a 10b/a una slice
   successiva e chiudo FL7 sul solo nastro? (Il mio consiglio: **si'**, farlo, ma
   committandolo **da solo**, dopo aver riletto il file, cosi' che la collisione sia
   una riga sola e non un blocco.)
2. **L'owner che e' anche vicino.** «Rende una volta sola nel ruolo di vicino, e la
   linea di contenimento punta a quel nodo». Nel nastro quel nodo sta gia' in colonna e
   ha gia' la sua freccia di riferimento verso il soggetto: una seconda linea, senza
   marker, correrebbe **sugli stessi due estremi**. Propongo: `ego.owner` **nomina**
   comunque quel nodo (identita' di oggetto, `side` resta `'incoming'`/`'outgoing'`, e
   la chiave di contenimento entra nelle sue `featureKeys`), ma **nessuna seconda
   linea e nessuna seconda scatola** si disegnano; scatola, sottoetichetta e linea
   esistono solo quando `owner.side === 'owner'`. E' la lettura piu' fedele di «una
   volta sola»; la lettura alternativa (disegnare la linea comunque) e' un tratto grigio
   sotto una freccia. Confermi?

## 6. Piano di Fase 2, se il go-ahead arriva

Quattro file, tutti nel perimetro dichiarato (piu' il quinto della domanda 1).

1. `jjform/egoNeighborhood.ts`
   - `EgoSide` guadagna `'owner'`.
   - `Ego` guadagna `owner: EgoNode | null`.
   - `egoNeighborhood` calcola l'owner dopo i due lati, con la precedenza esistente.
   - `EgoLayout` guadagna `owner: EgoPlacedNode | null` e `ownerLink: string | null`.
   - `egoLayout` riserva una banda superiore di `EGO_NODE_H + EGO_ROW_GAP` **solo**
     quando l'owner ha scatola propria; le tre colonne scendono, le x non cambiano.
   - `egoAction`: l'owner e' un nodo `object` come gli altri -> `select`. Nessun ramo
     nuovo (verificato leggendo la funzione: decide su `kind`, non su `side`).
2. `abstract/tabs/EgoDiagram.tsx` — la scatola dell'owner (stessa `neighbour()`, piu'
   la sottoetichetta) e il `<path>` senza `markerEnd`.
3. `abstract/tabs/egoDiagram.scss` — `&__node--owner` e `&__owner-link`, sui due ruoli
   gia' esistenti (`--color-form-muted`, `--color-form-border-strong`).
4. I due test: `jjform/__tests__/egoNeighborhood.test.ts` (owner valorizzato, rootable
   nullo, dedup, footer invariato, banda di layout) e
   `abstract/tabs/__tests__/egoDiagram.test.ts` (la scatola, la sottoetichetta, il
   link senza marker, il click).

Gate: `npm run typecheck` (baseline **33**, su output completo), `npm run build`,
vitest sulle due suite piu' l'intera `npm run test`, `npm run smoke`. Mutazioni: almeno
tre (owner senza dedup, banda non riservata, link con marker).

---

# Fase 2 — cio' che l'esecuzione ha aggiunto al referto

Go-ahead ricevuto sulle due domande del §5: **1 = farlo, commit separato**;
**2 = nessuna seconda linea**.

## 7. Cosa e' stato scritto

Tre commit, tutti con pathspec e indice verificato vuoto prima e dopo ciascuno.

| commit | file | cosa |
|---|---|---|
| `3637bfbaa` | `jjform/egoNeighborhood.ts` + suo test, `abstract/tabs/EgoDiagram.tsx` + foglio + suo test | il nastro |
| `b5112fddf` | `abstract/tabs/InstanceManagerTab.tsx` | il gruppo «owner» nel fallback (una riga piu' due righe di commento, piu' il doc di `EgoList` che la modifica falsificava) |
| (questo) | `docs/` | referto, prompt, log |

Contratto risultante, in tre righe:

- `Ego.owner: EgoNode | null` — il padre di contenimento, o null.
- `EgoSide` guadagna `'owner'`, che vuol dire «ha una scatola propria». Un owner
  che e' anche vicino porta il `side` della sua colonna: e' cosi' che il tipo dice
  «disegnato una volta sola».
- `EgoLayout` guadagna `owner: EgoPlacedNode | null` e `ownerLink: string | null`,
  fuori da `arrows` perche' quella linea non ha punta.

Nessun tipo nuovo esportato, quindi `jjform/index.ts` **non e' stato toccato**: il
barrel esporta gia' `Ego`, `EgoNode`, `EgoSide`, `EgoLayout`, `EgoPlacedNode`.

## 8. Un caso che il prompt non nomina, trovato scrivendo

**L'owner tagliato dal cap.** Se l'owner e' anche il quinto uscente, `capped()` lo
toglie dalla colonna e il nodo non e' disegnato da nessuna parte: lasciandogli il
`side` della colonna, l'owner sparirebbe dietro un «+n more». «Una volta sola» vuol
dire una volta DISEGNATA, quindi in quel caso il nodo riprende `side: 'owner'` e la
sua banda, che il cap non tocca. Due righe, un test dedicato.

## 9. Un comportamento fuori perimetro, misurato e non toccato

`substates`, auto-riferimento di `State` su `State`, **resta `composition: false`**
mentre `states` (da `StateMachine` a `State`), scritta nello stesso ciclo e con la
stessa istruzione `r.composition = true`, diventa `true`. Misurato due volte con un
tick di attesa fra scrittura e lettura, per non ricadere nella lettura stantia di
CLAUDE.md §3.6 (`_tmp_fl7_refs.ts`):

```json
{ "states":    { "dComposition": true,  "lComposition": true,  "target": "State" },
  "substates": { "dComposition": false, "lComposition": false, "target": "State" } }
```

Precede questa slice, non e' toccato da questa slice, e non e' un difetto del
nastro: il nastro legge cio' che il modello dichiara. Lo si registra perche' e'
costato due asserzioni rosse alla sonda, che le leggeva come un difetto dell'owner.
Il fixture della sonda e' stato cambiato per usare un contenimento che il modello
accetta — **due** macchine a stati, `Heater` e `Cooler`, che e' anche una fixture
migliore: due istanze della stessa metaclasse con owner diversi sono l'unica forma
in cui «per-istanza e non per-metaclasse» si misura davvero.

## 10. Un incidente di concorrenza, e come si e' chiuso

Al primo tentativo di commit, il commit `b88c0caf9` della sessione **10b** ha
inglobato i miei cinque file: erano nell'indice, e un `git commit` senza pathspec
committa l'indice intero (CLAUDE.md §6.1, esattamente questo caso). La sessione 10b
se n'e' accorta e ha rimediato da sola — `b88c0caf9` non e' antenato di HEAD
(verificato con `git merge-base --is-ancestor`), e il suo commit buono `757d1057d`
porta i suoi due file soltanto. I miei cinque erano tornati nell'indice, intatti, e
sono partiti in `3637bfbaa`. **Nessuna perdita, nessuna storia da districare.**

## 11. Verifiche

**Gate.** `npm run typecheck` **33** (baseline invariata; conteggio su output
completo, exit 2 come da baseline). `npm run build` exit **0**, solo il warning
chunk-size preesistente. `npm run test`: **2520 passati / 0 falliti**, 9 file rossi
= i noti errori all'import in `jjtl/`, `jjscript/`, `utils/`, nessuno di questa
slice. Suite proprie **56/56** (erano 39 al referto FL5).

**Mutazioni**, cinque, tutte rosse, verde al ripristino:

| mutazione | rossi |
|---|---|
| owner senza dedup (sempre una scatola nuova) | 4 |
| nessuna banda riservata (`band = 0`) | 2 |
| owner preso da un entrante qualsiasi (senza il filtro `composition`) | 1 |
| il legame di contenimento con la punta (`markerEnd`) | 1 |
| la sottoetichetta invertita (mai resa) | 1 |

**Smoke.** `npm run smoke` **GREEN 12/0/3**, corsa quiescente, un boot per stato —
e NON probante per questa slice: nessuno stato di `states.ts` monta il manager,
quindi dice che nulla e' regredito, non che l'owner si vede.

**La sonda sull'app vera**, `_tmp_fl7_verify.ts`, fixture `Heater` + `Cooler`:
**20 PASS / 0 FAIL / 0 errori di pagina**. Cio' che ha misurato, a schermo:

- una sola scatola owner, `Heater`, sottoetichetta «owner», sopra
  (`y+h = 378 <= 464`) e a sinistra (`x = 915 < 971`) del soggetto;
- la metaclasse nel tooltip, con la chiave: `Owner: Heater : StateMachine — via states`;
- **una** linea di contenimento, `d = "M 198 40 L 272 126"` (una retta), **senza**
  `marker-end`, stroke `rgb(203, 213, 225)` = `$slate-300`; le sei frecce dei
  riferimenti la punta ce l'hanno (`url(#ego-diagram-arrow)`): il contrasto e'
  visibile, non dichiarato;
- il footer dice **lo stesso numero della colonna** «referenced by» della riga
  (4 e 4), che e' l'invariante che il modulo dichiara — l'owner non entra in
  nessuno dei due. La prima stesura della sonda scriveva 3 a mano, copiando la
  fixture di FL5: qui c'e' anche `Idle.next -> Running`. L'asserzione ora legge la
  cella invece di ricordarsela;
- `Off`, contenuto da `Cooler`, ha owner **`Cooler`** e non `Heater`: per-istanza,
  non per-metaclasse;
- `Heater`, rootable, ha **zero** scatole owner e **zero** linee, e il nastro
  disegna comunque il soggetto con footer `0 incoming · 0 outgoing`;
- il click sull'owner porta la form su `Heater`;
- nessuna scatola sborda dalla cornice (la banda e' dentro `height`), il pannello
  non scorre di lato;
- a 900px il fallback rende, e i gruppi sono
  `["owner", "incoming", "this object", "outgoing"]` — «owner» in testa.

Schermate: `frontend/scripts/smoke/_tmp_fl7_owner.png`, `_tmp_fl7_rootable.png`,
`_tmp_fl7_narrow.png` (gitignored, come tutte le `_tmp_*`).

## 12. Punti aperti

1. **La vista Diagram 13a/1b** resta la decisione rimandata, come da prompt.
2. **La verifica visiva dei 4 preset**, agganciata alla prima slice sul tab Style.
3. `substates` e il contenimento su auto-riferimento (§9): da aprire come ticket a
   parte se qualcuno lo vuole, non come coda di FL7.
