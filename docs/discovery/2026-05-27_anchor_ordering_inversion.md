# Discovery — Inversione dell'ordering anchor su Department.left (step 2/3/5)

**Data**: 2026-05-27
**Tipo**: discovery osservazionale, READ-ONLY (nessuna modifica al codice)
**Documento prompt**: 2026-05-27 2000
**Fixture**: scena Università / Department / Laboratory con `has` (Università→Department) e `labs` (Department→Laboratory), entrambi insistenti su `Department.left`. Dati DOM raccolti in chat.

---

## 0. Sintesi (TL;DR)

L'inversione **non** è in `portDistribution.ts` (step 2/3/5). È nel posizionatore a valle
**`computeSidePositions` (`handlePosition.ts:172-214`)**, che ordina gli endpoint di un lato
**per ruolo** (`source` prima di `target`, poi per indice) e assegna le posizioni in
quell'ordine, **senza leggere alcuna coordinata**. Conseguenza geometria-indipendente: su un
lato che porta 1 source + 1 target reference, il **source finisce sempre in alto** e il
**target sempre in basso**, qualunque sia la posizione reale dei nodi opposti.

Nella fixture: `labs` aggancia `Department.left` come **source** → va in alto; `has` aggancia
come **target** → va in basso. Ma geometricamente Università (opposto di `has`) è in alto e
Laboratory (opposto di `labs`) è in basso. Quindi l'ordine desiderato è `has` sopra / `labs`
sotto → **risultato invertito**.

> **Correzione alla premessa del prompt** (vedi §3.3 e §8): sotto il codice *attuale* (HEAD,
> post-729c5ce07) il merge di STEP 1.5 è **posizionalmente inerte** per `has`/`labs`: con o
> senza merge le due ancore cadono a 0.333 (source, alto) e 0.667 (target, basso). Il merge
> cambia solo l'**handleId** assegnato a `labs` (`left-0`→`left-1`), non la sua posizione. Il
> merge **non** ha quindi né causato né smascherato l'inversione: l'inversione era già presente
> e visibile. Il "collasso simmetrico a (662,437)" ricordato come stato pre-fix non è
> riproducibile dal codice attuale (vedi §8) ed è verosimilmente memoria di uno stato
> pre-role-segregation.

**Ipotesi confermata**: nessuna tra α/β/γ/δ/ε *come formulate* (tutte assumono che il
posizionamento avvenga in `portDistribution`). La causa è una **sesta, ζ**: ordinamento
role-primary in `computeSidePositions` (modulo a valle). Sovrapposizione parziale con ε
(masking), ma corretta in §8.

**HARD STOP HS-D2 (classe)**: il bug è in un *consumer* dell'output di `computePortDistribution`
(`DynamicHandles` via `handlePosition.ts`), non dentro `portDistribution.ts`. Cambia la natura
del fix. Vedi §6.

---

## 1. Architettura reale del posizionamento (chi fa davvero cosa)

Il prompt assume la pipeline `step 1 → 1.5 → 2 → 3 → 5` interamente dentro `portDistribution.ts`.
La realtà del codice è **due moduli distinti**:

```
EditorV2.applyDistribution (787-808)
  └─ computePortDistribution(edgeList, nodeIds, positions)   [portDistribution.ts]
        ├─ STEP 1   bucketing per (nodeId, side, role)        :69-140
        ├─ STEP 2   sort spaziale DENTRO il bucket            :142-157   (centroide opposto)
        ├─ STEP 3   assegna handleId = `${side}-${index}`     :159-178
        ├─ STEP 4   nodeHandles + position (i+1)/(n+1)        :189-235   ← DATO MORTO
        └─ ritorna { edgeHandles, nodeHandles }
     ⇒ EditorV2:792 destruttura SOLO { edgeHandles }; nodeHandles SCARTATO.
        Gli edge ricevono solo sourceHandle/targetHandle (stringhe `${side}-${index}`).

DynamicHandles (rendering)                                    [DynamicHandles.tsx]
  └─ sidePositionsBySide = computeSidePositions(              :96-103, call :99
                              computeSideEndpoints(edges,nodeId,side))   [handlePosition.ts]
        ⇒ Map<`${handleId}:${role}`, percent 0..1>
     └─ positionProp = (left|right) ? 'top' : 'left'          :199
     └─ style[top] = `${percent*100}%`                        :253-254  ← POSIZIONE FISICA
```

**Conseguenza chiave**: il campo `position` calcolato da `portDistribution` STEP 4
(`portDistribution.ts:232`, `(i+1)/(n+1)`) **non è consumato da nessuno** per il rendering
(EditorV2 lo scarta, DynamicHandles non lo legge). Il "vero step 5" è
`computeSidePositions` + l'applicazione CSS in DynamicHandles. Questo era già annotato come
"`nodeHandles` resta dato morto" nella discovery `2026-05-25_cross_role_ordering_feasibility.md`.

Secondo consumer di `handlePosition`: `useTreeLayout` usa `computeHandlePositionForNode`
(`handlePosition.ts:224-248`), che internamente chiama gli stessi
`computeSideEndpoints`+`computeSidePositions` → l'inversione si propaga identica al ramo tree
connector dell'inheritance.

---

## 2. Fixture (coordinate illustrative; conta solo Università.y < Laboratory.y)

| Nodo | ruolo su Department.left | centroide opposto | Y viewport | posizione schermo |
|------|--------------------------|-------------------|-----------|-------------------|
| Università | opposto di `has` (target) | Università | **100** (bassa) | **ALTO** |
| Laboratory | opposto di `labs` (source) | Laboratory | **800** (alta) | **BASSO** |

`Department.left`: banda y ∈ [417, 457], altezza 40, top(nodeY)=417. Mapping percent→y per il
lato left (DynamicHandles:199,253-254 → CSS `top%`; handlePosition:244-246 → `nodeY+percent*h`):

`y = 417 + percent * 40`  →  0.333→430.3 · 0.5→437 · 0.667→443.7≈444 · `top%` cresce verso il
basso (percent 0 = alto, 1 = basso).

Edge:
- **`has`** Università→Department: su Department è **target**, side left. In `portDistribution`
  finisce nel bucket `Department:left:target`, `otherNodeIds=[Università]` (`:137`).
- **`labs`** Department→Laboratory: su Department è **source**, side left. Bucket
  `Department:left:source`, `otherNodeIds=[Laboratory]` (`:106`).

---

## 3. Tracciamento numerico

### 3.1 HEAD attuale (NO merge)

**STEP 1 — bucketing** (`portDistribution.ts:69-140`)

| bucket | contenuto | length |
|--------|-----------|--------|
| `Department:left:target` | `[{edgeIds:[has], role:target, type:reference, otherNodeIds:[Università]}]` | 1 |
| `Department:left:source` | `[{edgeIds:[labs], role:source, type:reference, otherNodeIds:[Laboratory]}]` | 1 |

**STEP 2 — sort spaziale** (`:142-157`)

Guardia `if (groups.length <= 1) continue;` (`:145`) → **entrambi i bucket hanno 1 elemento →
il comparator NON viene MAI eseguito**. Il sort `centerA.centerY - centerB.centerY` (`:154`,
ascendente = alto-prima) è corretto ma irrilevante qui. `nodePositions` non viene letto per
questa fixture.

**STEP 3 — assegnazione indici** (`:159-178`, `handleId = ${side}-${index}` `:166`)

| bucket | group[0] | index | handleId | assegnazione |
|--------|----------|-------|----------|--------------|
| `Department:left:target` | has | 0 | `left-0` | `has.targetHandle = 'left-0'` |
| `Department:left:source` | labs | 0 | `left-0` | `labs.sourceHandle = 'left-0'` |

→ **entrambi index 0** (bucket separati, ognuno indicizzato da 0). `has`=`left-0` (target),
`labs`=`left-0` (source).

**STEP 4** — `nodeHandles` calcolato (`:228-235`) ma **scartato** da EditorV2:792. Ignorato.

**STEP 5 reale — `computeSidePositions`** (`handlePosition.ts:172-214`)

`computeSideEndpoints(edges,'Department','left')` (`:119-141`) →
`[{handleId:'left-0', role:'target', edgeType:'reference'} /*has*/,
  {handleId:'left-0', role:'source', edgeType:'reference'} /*labs*/]`

`computeSidePositions`: N=2; nessun inheritance (M=0, R=2). `bySortKey` (`:177-182`) ordina
**source prima di target** (`:178-180`):

| ordine ref | endpoint | k | refPositions[k] = (k+1)/(N+1) | risultato |
|-----------|----------|---|-------------------------------|-----------|
| 0 | `left-0:source` (labs) | 0 | 1/3 = **0.333** | `result['left-0:source']=0.333` |
| 1 | `left-0:target` (has)  | 1 | 2/3 = **0.667** | `result['left-0:target']=0.667` |

Rendering (DynamicHandles:228-229,253-254 → CSS top%):

| edge | handle:role | percent | y = 417+p·40 | schermo |
|------|-------------|---------|--------------|---------|
| **labs** (source) | `left-0:source` | 0.333 | **430** | **ALTO** ❌ (Laboratory è in basso) |
| **has** (target)  | `left-0:target` | 0.667 | **444** | **BASSO** ❌ (Università è in alto) |

→ **INVERTITO**. `has` (opposto in alto) → basso; `labs` (opposto in basso) → alto.

### 3.2 Ipotetico CON merge (STEP 1.5, fix droppato)

**STEP 1.5** unisce `:source`+`:target` in `Department:left:merged` (crossRoleTotal=2≤MAX=4),
pre-ordine per ruolo: `[labs_source, has_target]`.

**STEP 2** ora `merged.length=2>1` → **il comparator GIRA**. side=`left`, isHorizontal=false,
sort ascendente per `otherNode.centerY`:
- labs → Laboratory.centerY = 800
- has → Università.centerY = 100
- `comparator(labs,has) = 800 − 100 = +700 > 0` → labs **dopo** has.
- ordinato: `merged = [has(100), labs(800)]`. ✔ (ordine spaziale corretto: has in cima)

**STEP 3**: `merged[0]=has`→`left-0` (target); `merged[1]=labs`→`left-1` (source).
→ `has.targetHandle='left-0'`, `labs.sourceHandle='left-1'`. (L'indice ORA riflette la
geometria: has=0=più in alto.)

**STEP 5 reale — `computeSidePositions`**:
`computeSideEndpoints` → `[{left-0:target}/*has*/, {left-1:source}/*labs*/]`.
`bySortKey` ordina **role-primary** (source prima): l'indice (0 vs 1) è solo tiebreak
**intra-ruolo**, quindi viene **ignorato** quando i ruoli differiscono:

| ordine ref | endpoint | k | (k+1)/3 | risultato |
|-----------|----------|---|---------|-----------|
| 0 | `left-1:source` (labs) | 0 | **0.333** | `result['left-1:source']=0.333` |
| 1 | `left-0:target` (has)  | 1 | **0.667** | `result['left-0:target']=0.667` |

Rendering:

| edge | handle:role | percent | y | schermo |
|------|-------------|---------|---|---------|
| **labs** (source) | `left-1:source` | 0.333 | 430 | **ALTO** ❌ |
| **has** (target)  | `left-0:target` | 0.667 | 444 | **BASSO** ❌ |

→ **ANCORA INVERTITO**. STEP 2 aveva ordinato correttamente (has index 0), STEP 3 aveva dato a
has l'indice minore, ma `computeSidePositions` **scarta l'ordine spaziale** ri-ordinando
role-primary. Il merge è servito solo a rendere distinti gli handleId.

### 3.3 Confronto: il merge è posizionalmente inerte

| | percent labs (source) | percent has (target) | dot visibili |
|--|----------------------|----------------------|--------------|
| NO merge | 0.333 (`left-0:source`) | 0.667 (`left-0:target`) | 33% e 67% |
| CON merge | 0.333 (`left-1:source`) | 0.667 (`left-0:target`) | 33% e 67% |

Le **posizioni fisiche sono identiche**. Cambia solo quale handleId ospita il dot source
(`left-0`→`left-1`). Anche `activeHandles` cambia (`{left-0}` → `{left-0,left-1}`,
DynamicHandles:59-71) ma il set di dot *visibili e connessi* resta {source@33%, target@67%}
perché DynamicHandles disegna un Handle per (id,role) e usa `handleRoles` (`:75-88`) per marcare
`--connected` solo il ruolo attivo. **Il merge non altera il rendering di has/labs.**

---

## 4. Risposte puntuali D1–D6

### D1 — Cosa fa REALMENTE il comparator dello step 2 sulla fixture?
Sul caso reale (NO merge) **non fa nulla**: i due edge sono in bucket separati di lunghezza 1,
intercettati dalla guardia `groups.length <= 1` (`portDistribution.ts:145`). Il comparator
(`:149-155`) gira solo se i due vengono fusi (STEP 1.5) o nel caso same-role (D6). Quando gira
(§3.2) legge il **centroide del nodo OPPOSTO** via `averagePosition(a.otherNodeIds, …)`
(`:150-151`; `otherNodeIds` = `[edge.target]` per source `:106`, `[edge.source]` per target
`:137`) e per i lati verticali ordina **ascendente per centerY** (`:154`) = alto-prima.
**Il comparator è corretto**; non è la causa.

Micro-tabella (caso con-merge, quando il sort gira):

| edge | sortKey (centroide opposto, asse Y) | posizione nell'array ordinato |
|------|-------------------------------------|-------------------------------|
| has  | Università.centerY = 100 | 0 (primo) |
| labs | Laboratory.centerY = 800 | 1 (secondo) |

#### D1-bis — Da quale fonte legge il centroide? (sub-domanda, nice-to-have)
Da **`nodePositions`**, il parametro passato a `computePortDistribution`. Nel path live è
costruito da `buildNodePositions(getNodes())` (`EditorV2.tsx:788-790`), cioè dalle **coordinate
RF correnti** (`n.position.x/y` + `n.measured.width/height`, `:774-778`) — **non** da una Map
cached/stale. Caveat: se `applyDistribution` gira prima della misurazione DOM dei nodi
(load/import), `measured` è undefined → fallback w=180/h=80 per il centro; `n.position`
dovrebbe già essere impostato dal layout, quindi l'ordinamento relativo regge salvo nodi con
altezze molto diverse. **Per l'inversione cross-role la freschezza è irrilevante** (STEP 2 non
gira e comunque `computeSidePositions` ignora il centroide). **Rileva solo per il same-role
(D6)**, dove il centroide è l'input reale dell'ordinamento: se lì la sorgente fosse stale,
l'ordine same-role potrebbe risultare incoerente — ma la sorgente è live.

### D2 — Cosa fa lo step 3 con l'output dello step 2?
`groups.forEach((group, index) => handleId = ${side}-${index})` (`:165-166`): assegna l'indice
nell'ordine dell'array (post-sort). index 0 → primo elemento. Nessuna inversione qui. Nel caso
con-merge: `has`→index 0→`left-0`, `labs`→index 1→`left-1` (`:170-174` instrada su
source/targetHandle per ruolo). index 0 corrisponde all'elemento che STEP 2 ha messo per primo
(spazialmente più in alto). Step 3 è corretto.

### D3 — Cosa fa lo step 5 (positioning) con gli indici?
Il "vero step 5" è `computeSidePositions` (`handlePosition.ts:172-214`), **non**
`portDistribution`. Formula: split inheritance/reference (`:183-184`); senza inheritance
(`M==0`) `refPositions = ref.map((_,k) => (k+1)/(N+1))` (`:192-194`); l'ordine di `ref` è dato
da `bySortKey` = **(role, index)**, source prima (`:177-182`). Poi `result.set(`${handleId}:${role}`, …)`
(`:206`). La posizione fisica (CSS `top%`, DynamicHandles:253-254; o `nodeY+percent*h`,
handlePosition:244-246) ha **percent 0 = alto, 1 = basso**. Quindi: il **primo nell'ordine
role-primary** (= un source) prende il percent minore = **alto**. L'indice 0/1 conta solo come
tiebreak intra-ruolo. Coerente con l'osservato `left-0/target`→0.667→y=444.

### D4 — Dove sta l'inversione?
In `computeSidePositions` (`handlePosition.ts:177-206`): l'ordinamento è **role-primary**
(source→alto, target→basso) e **non legge geometria**. Per la coppia source+target sullo stesso
lato questo pinna il source in alto e il target in basso a prescindere da dove stanno i nodi
opposti. È un **modulo a valle di `portDistribution`** → vedi §6 (HS-D2).

### D5 — Era il comparator davvero "corretto" pre-25 maggio?
Il comparator di STEP 2 **è** corretto (ascendente per centroide opposto). La falla diagnostica
della discovery del 26 maggio (`2026-05-26_2120_discovery_handle_ordering_within_side.md`) è
**dichiarare l'ordering end-to-end corretto avendo validato solo STEP 2** (necessario ma non
sufficiente), **senza tracciare il posizionatore reale `computeSidePositions`** che lo
sovrascrive. La correttezza di STEP 2 non implica la correttezza visiva perché la posizione
finale la decide un altro modulo, role-primary e geometria-cieco.

> **Limite di accesso (onestà)**: il file `2026-05-26_2120_discovery_handle_ordering_within_side.md`
> **non è nel repo** (`docs/discovery/` arriva al 2026-05-25; verosimilmente è nella knowledge
> base esterna di Alfonso). Non ho potuto rileggerlo direttamente. La conclusione qui si basa su
> (a) la descrizione del prompt ("dichiarò step 2 corretto da lettura del codice") e (b) il fatto
> architetturale che STEP 2 ≠ posizionatore. Le discovery 2026-05-25 *presenti* nel repo
> (`role_segregation_rationale`, `cross_role_ordering_feasibility`) avevano invece *proposto* un
> "cross-role global ordering"; l'implementazione 729c5ce07 (`computeSidePositions`) lo ha però
> reso **role-primary**, non spaziale — gap design↔implementazione (vedi §7).

### D6 — Same-role same-side: era già rotto pre-fix?
**No, il same-role same-side è CORRETTO** e l'inversione **non** lo tocca. Traccia per 2 source
sullo stesso lato con opposti a Y diverse (Y_lo < Y_hi):
1. STEP 1: entrambi nel bucket `…:source`, length 2.
2. STEP 2 **gira** (length>1) → ordina ascendente per centroide opposto → `[src(Y_lo), src(Y_hi)]`
   → indici `left-0`(Y_lo), `left-1`(Y_hi). L'ordine spaziale è **codificato nell'indice**.
3. STEP 5 `computeSidePositions`: stesso ruolo → `bySortKey` ordina per **indice**
   (`:181`) → `[left-0, left-1]` → percent `[0.333, 0.667]` → Y_lo→alto, Y_hi→basso. **Corretto.**

Il same-role funziona perché STEP 2 incide l'ordine nell'indice e `computeSidePositions`
preserva l'ordine d'indice intra-ruolo. L'inversione è **specifica del cross-role**, dove
`bySortKey` antepone il ruolo e cancella ogni ordine spaziale.

- Test che copra Q3-bis: **nessuno** (`utils/__tests__/` rimosso col drop; non esistono unit
  test per `portDistribution`/`handlePosition`). Conferma del checkpoint del prompt.
- Scena demo con 2 reference stesso-ruolo stesso-lato: non identificata staticamente; **D6
  verificabile da Alfonso** ma la traccia di codice è inequivocabile (same-role = corretto).

---

## 5. Ipotesi confermata (α/β/γ/δ/ε)

**Nessuna come formulata**, perché α–ε assumono che il posizionamento viva in `portDistribution`
(step 2/3/5). Mappatura onesta:

- **α** (step 2 direzione sbagliata): NO — direzione corretta (`:154`), e per la fixture non gira.
- **β** (step 2 centroide sbagliato): NO — legge il centroide *opposto* corretto (`otherNodeIds`).
- **γ** (step 3 indici invertiti): NO — assegna in ordine d'array (`:165-166`).
- **δ** (step 5 mappa index 0 al fondo): NO — il `position` di portDistribution è morto; il vero
  step 5 (`computeSidePositions`) non ordina per indice ma **per ruolo**, quindi "index 0 → fondo"
  non descrive il meccanismo.
- **ε** (combinazione che si compensava pre-fix): **parziale e da correggere** — non sono due step
  di `portDistribution` che si compensano. Sotto il codice attuale non c'è alcun mascheramento da
  parte del merge (§3.3): le due ancore erano già distinte e invertite. L'eventuale "collisione a
  437" è di uno stato pre-role-segregation (§8), non del HEAD attuale.

**Causa reale = ζ (fuori lista)**: ordinamento **role-primary, geometria-cieco** in
`computeSidePositions` (`handlePosition.ts:177-206`), modulo a valle non contemplato dalle ipotesi.

---

## 6. HARD STOP HS-D2 (classe) — il bug è downstream

> HS-D2 del prompt: "se il bug è in un consumer dell'output di `computePortDistribution`
> invece che dentro `portDistribution.ts`, riportarlo — cambia la natura del fix."

**Attivato (variante).** Il bug **non** è in `portDistribution.ts` (step 2/3/5 sono corretti) e
**non** è in `EditorV2.tsx:applyDistribution` (si limita a copiare gli handleId sugli edge,
`:794-806`). È in **`handlePosition.ts::computeSidePositions`**, consumato da
**`DynamicHandles.tsx:99`** (rendering) e da **`useTreeLayout`** via `computeHandlePositionForNode`.
Il fix definitivo va mirato lì, non su `portDistribution`. Questo è il segnale principale della
discovery e va portato in chat prima di qualsiasi implementazione.

HS-D1 (comparator non a 142-157): **non attivato** — il comparator è esattamente a
`portDistribution.ts:149-155`.
HS-D3 (bug a monte in `useAutoAnchor`/`jjomTransformers`, side selection): **non attivato** — la
fixture dà per assegnato il lato `left` corretto per entrambi; il difetto è l'ordine *dentro* il
lato, non la scelta del lato.

---

## 7. Proposta di fix (NON implementata)

Obiettivo: ordinare gli endpoint reference di un lato per **posizione geometrica del nodo opposto**
(come già fa, correttamente, STEP 2 per il same-role), invece che per ruolo. Mantenere inheritance
centrata (a2-strict), collision-freedom, cap a MAX, e la shape `Map<`handleId:role`, number>`.

**Opzione A (consigliata) — rendere `computeSidePositions` spaziale.**
`computeSidePositions` oggi riceve solo `SideEndpoint[]` (handleId, role, edgeType), senza
coordinate. Servirebbe:
1. arricchire `SideEndpoint` con il nodo opposto (o il suo centroide sull'asse rilevante);
   `computeSideEndpoints` ha già gli `edges` → può ricavare l'opposto, ma gli serve
   `nodePositions` (oggi assente nel modulo).
2. propagare `nodePositions` da `DynamicHandles` (che ha accesso alle coord RF) e da
   `useTreeLayout` dentro `computeSideEndpoints`/`computeSidePositions`.
3. in `computeSidePositions`, ordinare i `ref` per centroide-opposto (ascendente centerY sui lati
   verticali, ascendente centerX sugli orizzontali), con tiebreak deterministico (edgeId/handleId);
   inheritance resta pinnata al centro.

Pro: un solo modulo cambia semantica; **non serve toccare `portDistribution`**; **non serve il
merge** (gli endpoint `left-0:source` e `left-0:target` restano chiavi distinte, posizionabili a
33%/67% nell'ordine geometrico corretto). Contro: `computeSidePositions` smette di essere puro
(dipende dalle coord); gestire il fallback con coord mancanti (→ ordine attuale).

**Opzione B (alternativa) — indice cross-role globale + `computeSidePositions` per-indice.**
(b1) far assegnare a `portDistribution` indici **globali cross-role** che riflettano l'ordine
spaziale (è ciò che fa il merge di STEP 1.5: ordina il bucket fuso e indicizza → has=`left-0`,
labs=`left-1`); (b2) cambiare `bySortKey` di `computeSidePositions` per ordinare **per indice
globale**, non role-primary. Solo la **combinazione** funziona: il merge da solo è inerte (§3.3) e
il per-indice da solo non discrimina (has/labs sarebbero entrambi index 0). Più invasiva e
accoppia due moduli.

**Raccomandazione**: Opzione A. Il merge droppato non è prerequisito; reintrodurlo senza toccare
`computeSidePositions` non avrebbe effetto visivo (§3.3).

---

## 8. Onestà intellettuale — inconsistenze nei dati DOM

- `left-0:target` (has) osservato a y=444 ≈ 0.667·40+417 → **coerente** con la traccia (target in
  basso).
- `left-0:source` (labs) osservato a y=437 = 0.5·40+417 = **centro/default 0.5**, non 0.333 (≈430).
  Sotto il codice attuale `left-0:source` è a 0.333 (NO merge) oppure è **inattivo** (CON merge,
  labs sta su `left-1:source`) → fallback 0.5 = 437. Il valore 437 è quindi compatibile con uno
  **stato CON-merge** in cui labs è migrato a `left-1` e `left-0:source` è il dot inattivo; ma il
  prompt attribuisce 437 a labs su `left-0:source`. Probabile lettura DOM in uno stato di render
  transitorio (pre/post re-distribution) — **non blocca** la conclusione qualitativa
  (target-sotto-source).
- "Pre-fix entrambe a (662,437), incrocio simmetrico": **non riproducibile** dal codice attuale —
  `computeSidePositions` separa sempre source(0.333)/target(0.667) anche senza merge; perfino la
  vecchia formula deprecata `computeHandlePercent` (`:69-85`, segregata) le separava
  (0.0625/0.5625). Il collasso a un singolo punto richiede uno stato **pre-role-segregation**
  (prima di db7be7a25), antecedente all'attuale HEAD. Da verificare con Alfonso; **non blocca**.

**Firma robusta dell'inversione, indipendente dai pixel**: sullo stesso lato un endpoint
**target è sempre posizionato sotto** un endpoint **source**, qualunque sia la geometria, perché
`computeSidePositions` ordina source-prima-di-target. `has` è target → sotto; `labs` è source →
sopra. Questo spiega l'osservato senza dipendere dalla riconciliazione esatta dei pixel.

---

## 9. Conclusione operativa

1. Il fix definitivo va su **`handlePosition.ts::computeSidePositions`** (Opzione A), non su
   `portDistribution.ts`.
2. Il merge di STEP 1.5 (droppato) era **inerte** per questo sintomo: né causa né cura. Drop corretto.
3. **Same-role same-side è già corretto** (D6); il fix cross-role non deve regredirlo (Opzione A
   ordina per centroide come già fa STEP 2 per il same-role → coerente).
4. STEP 2 di `portDistribution` resta utile **solo** se si sceglie l'Opzione B; con l'Opzione A
   l'ordinamento diventa autonomo in `computeSidePositions` e l'indice torna mera identità RF.

---

## Known limitation post-fix

L'ordinamento geometry-aware è calcolato al momento del recompute della memo
`sidePositionsBySide` di `DynamicHandles` (deps `[edgeTopologyKey, nodeId]`), che legge le
posizioni dei nodi dal RF store in modo imperativo, **senza** sottoscrizione alle posizioni
live. Questo è deliberato: la riga 45 di `DynamicHandles.tsx` evita la re-render cascade durante
il drag proprio non dipendendo dalle posizioni dei nodi.

Conseguenza: durante un drag dal vivo che inverte verticalmente due nodi opposti **cross-role**
senza innescare una riassegnazione di handle (il caso cross-role non viene ri-bucketizzato da
`portDistribution`, quindi `edgeTopologyKey` non cambia), l'ordinamento non si aggiorna fino al
recompute successivo. La scena statica (al load / after-layout, il bersaglio del criterio di
accettazione §4) è corretta.

Questo è **stato noto, non regressione**: è strettamente migliore dello stato pre-fix (inversione
statica permanente). Renderlo reattivo al drag richiederebbe una sottoscrizione alle posizioni su
`DynamicHandles` che reintrodurrebbe la cascade evitata dalla riga 45 — trade-off scartato
consapevolmente. Chi arriva qui da un `git blame` su una segnalazione del tipo "l'ordering non si
aggiorna al drag nel caso X" deve trovare subito che il comportamento era previsto, con il
rationale del trade-off.