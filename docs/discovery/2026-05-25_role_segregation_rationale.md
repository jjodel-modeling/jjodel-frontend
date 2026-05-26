# Discovery: Razionale di c8910167a (Role Segregation)

**Data**: 2026-05-25
**Branch**: alfonso-frontend-jjtl
**Commit oggetto**: `c8910167a`
**Commit HEAD corrente**: `8ca6808a603be0ab9064e2184708db4083452810`
**Modalità**: READ-ONLY (l'unico file scritto è questo + entry in `docs/claude-code-log.md`)

> **Nota sullo stato del working tree.** Il "fix appena committato" citato dal prompt
> (*tree connector now respects handle assignment on child side*) **non è ancora un
> commit**: vive nel working tree come modifiche non-staged a
> `DynamicHandles.tsx` + `useTreeLayout.ts` e nel nuovo file untracked
> `utils/handlePosition.ts`. Tutte le affermazioni su "oggi" tengono conto di questo stato
> non committato. La formula percentuale di c8910167a **non è cambiata**: il diff del
> working tree la estrae 1:1 in `computeHandlePercent` (`handlePosition.ts:62-79`,
> docstring "Ported 1:1 from DynamicHandles.tsx:228-242").

---

## TL;DR

`c8910167a` ha reso **contestuale** una segregazione per-ruolo già esistente (introdotta da
`db7be7a25`): mantiene il layout "source 1ª metà / target 2ª metà" **solo** quando su un
lato sono attivi entrambi i ruoli (`hasBothRoles`), altrimenti distribuisce uniformemente
(un solo edge → 50%, centro). La segregazione **non è cosmetica**: è il meccanismo che
evita la **collisione visiva** tra source e target quando condividono gli stessi handleId
su un lato (su un lato ci sono solo `MAX_HANDLES_PER_SIDE = 4` handleId e source/target
li contano **entrambi** a partire da 0 — `portDistribution.ts:78,111,258`).

La regola proposta ("inheritance al centro + reference equidistribuite simmetriche") è
formulata sull'asse **semantico** (inheritance vs reference) ed **estetico** (centratura +
simmetria), ma **tace sull'asse ruolo** (source vs target), che è proprio l'asse che
garantisce l'assenza di collisioni. Negli scenari **S3** e **S4** (denso bidirezionale,
es. `Families.ecore Member.left` 4+4) smontare la segregazione e ricadere sulla formula
uniforme per-ruolo produce **collisioni dure** (ogni source si sovrappone a un target).
→ **Raccomandazione C** (vedi in fondo): la role segregation copre un problema strutturale
che la regola proposta non copre da sola; va preservata la collision-freedom cross-ruolo,
mentre l'estetica proposta è ortogonale e si può sovrapporre — ma **non** semplicemente
rimuovendo la segregazione.

---

## Obiettivo 1 — Metadata del commit

**Data commit**: `Mon May 25 01:20:36 2026 +0200`
**Autore**: Alfonso Pierantonio <alfonso.pierantonio@univaq.it>

**Commit message integrale** (laconico, una sola riga, nessun body):
```
fix(editor-v2): contextual handle positioning when only one role is on the side
```

**File toccati** (`git show c8910167a --stat`):
```
 docs/claude-code-log.md                            | 24 ++++++++++++
 .../editor-v2/components/DynamicHandles.tsx        | 44 +++++++++++++++++++---
 2 files changed, 62 insertions(+), 6 deletions(-)
```

**Righe modificate**: `DynamicHandles.tsx` +38 / −6 (44 righe toccate); `claude-code-log.md`
+24 (entry di log). **Nessun file di test toccato.** Nessun link a issue/screenshot nel
messaggio (vedi Obiettivo 5).

---

## Obiettivo 2 — Cosa è cambiato

### Logica PRIMA di c8910167a (`c8910167a^`, ovvero post-`db7be7a25`)

Segregazione **incondizionata**: la source sta sempre nella 1ª metà del lato, la target
sempre nella 2ª metà, indicizzate sull'`index` numerico dell'handle.

```typescript
// DynamicHandles.tsx (c8910167a^), dentro il loop per index
const sourcePercent = (index + 0.5) / (2 * MAX_HANDLES_PER_SIDE);
const targetPercent = 0.5 + (index + 0.5) / (2 * MAX_HANDLES_PER_SIDE);
```

Con `MAX_HANDLES_PER_SIDE = 4` (`portDistribution.ts:258`): per `index=0` la source cade a
**6.25%** (vicino all'angolo), la target a **56.25%** (poco oltre la metà). Per un lato con
**un solo** edge → l'ancora compare vicino a un angolo invece che al centro (il sintomo
documentato in `2026-05-25_edge_anchoring_regression.md` §3-4).

### Logica DOPO c8910167a (committed)

Calcolo per-lato dell'occupancy di ruolo, poi scelta della strategia:

```typescript
// Per-side role occupancy (DynamicHandles.tsx:186-201 nel commit)
const sourceHandlesOnSide: string[] = [];
const targetHandlesOnSide: string[] = [];
for (let i = 0; i < MAX_HANDLES_PER_SIDE; i++) {
    const hid = `${side}-${i}`;
    if (!activeHandles.has(hid)) continue;
    const roles = handleRoles.get(hid);
    if (roles?.has('source')) sourceHandlesOnSide.push(hid);
    if (roles?.has('target')) targetHandlesOnSide.push(hid);
}
const sourceCount = sourceHandlesOnSide.length;
const targetCount = targetHandlesOnSide.length;
const hasBothRoles = sourceCount > 0 && targetCount > 0;

// Strategia contestuale (DynamicHandles.tsx:219-242 nel commit)
let sourcePercent: number;
let targetPercent: number;
if (hasBothRoles) {
    sourcePercent = (index + 0.5) / (2 * MAX_HANDLES_PER_SIDE);   // 1ª metà
    targetPercent = 0.5 + (index + 0.5) / (2 * MAX_HANDLES_PER_SIDE); // 2ª metà
} else {
    const srcRoleIdx = sourceHandlesOnSide.indexOf(handleId);
    const tgtRoleIdx = targetHandlesOnSide.indexOf(handleId);
    sourcePercent = sourceCount > 0 && srcRoleIdx >= 0
        ? (srcRoleIdx + 1) / (sourceCount + 1)   // uniforme: 1 edge → 50%
        : 0.5;
    targetPercent = targetCount > 0 && tgtRoleIdx >= 0
        ? (tgtRoleIdx + 1) / (targetCount + 1)
        : 0.5;
}
```

### Stato "oggi" (working tree, non committato)

La stessa formula è estratta 1:1 in `utils/handlePosition.ts` (`computeHandlePercent`,
`:62-79`) e condivisa tra `DynamicHandles.tsx` (rendering) e `useTreeLayout.ts` (il tree
connector dell'inheritance raggruppata ora atterra sull'handle assegnato, non più sul
centro del nodo — `useTreeLayout.ts` diff working-tree, `computeHandlePositionForNode`).
**Semantica percentuale invariata** rispetto a c8910167a.

### Diff concettuale (bullet)

- **Cosa fa il commit**: trasforma la segregazione per-ruolo da *incondizionata* a
  *condizionale* sulla densità del lato. `hasBothRoles` è il discriminante.
- **Formula precedente per source+target sullo stesso lato**: `(index+0.5)/8` (source) e
  `0.5+(index+0.5)/8` (target) → 6.25/18.75/31.25/43.75% e 56.25/68.75/81.25/93.75%.
  **Questa formula è preservata** dentro il ramo `hasBothRoles`.
- **Comportamento nuovo**: quando su un lato è attivo **un solo** ruolo, si usa la
  distribuzione uniforme `(rank+1)/(count+1)` sul conteggio del ruolo (1 edge → 50% =
  centro), ripristinando il comportamento pre-`db7be7a25` **limitatamente** ai lati
  mono-ruolo.
- **Caso che il commit cita esplicitamente come motivo per tenere la segregazione**:
  `Families.ecore Member.left, 4 source + 4 target` (commento in `DynamicHandles.tsx`,
  ramo `hasBothRoles`).

---

## Obiettivo 3 — Razionale

### Esplicito dal commit message

Il messaggio è **laconico** (una riga): *"contextual handle positioning when only one role
is on the side"*. Dichiara il **cosa** (posizionamento contestuale quando un solo ruolo è
sul lato), non il **perché strutturale** della parte preservata.

### Ricostruito dal diff + documento di design coevo

Il razionale completo è scritto nella discovery **coeva** `2026-05-25_edge_anchoring_regression.md`
(stesso giorno; è di fatto il documento che ha *proposto* c8910167a). Sintesi citabile:

- La regressione corretta: `db7be7a25` ("role-aware physical positioning of handles",
  2026-05-21 17:25) aveva sostituito la formula `position = 0.5` (centro per singolo
  handle) con la segregazione 6.25%/56.25%. Effetto collaterale: con **un solo** edge su un
  lato, l'ancora finisce vicino all'angolo → illusione di "edge che esce dal lato
  sbagliato" (`edge_anchoring_regression.md` §3, righe 150-159, 242-246).
- La direzione di fix raccomandata (`edge_anchoring_regression.md` §5, righe 259-261):
  *"rendere il posizionamento role-aware contestuale alla densità del lato. Quando un dato
  (side) ha entrambi i ruoli attivi, mantenere la segregazione prima metà / seconda metà
  (per evitare la collisione visiva del problema che `db7be7a25` voleva risolvere). Quando
  invece è presente un solo ruolo, distribuzione uniforme (i+1)/(n+1) ... come
  pre-`db7be7a25`."* → c8910167a implementa **esattamente** questo.
- Vincolo esplicito (`edge_anchoring_regression.md` riga 266): **non** revertire
  `89e67dc65` né `cdcef4456` — la separazione dei bucket per ruolo *"resta corretta per
  consentire a `top-0` di esistere come source per un edge e target per un altro edge sullo
  stesso nodo."*

**Perché la segregazione esiste (il punto strutturale).** Su un lato, gli handleId di
source e target provengono da bucket **separati** (`${node}:${side}:source` vs
`:target`, `portDistribution.ts:78,111`), **ciascuno indicizzato da 0**. Quindi `side-0`
può essere contemporaneamente il `sourceHandle` di un edge **e** il `targetHandle` di un
altro. `DynamicHandles` renderizza per ogni handleId **sia** un `<Handle type="source">`
**sia** un `<Handle type="target">`. Se entrambi i ruoli mappano sulla **stessa** percentuale
fisica, i due endpoint atterrano sullo **stesso pixel**. La segregazione mappa lo stesso
handleId su **due** posizioni fisiche diverse a seconda del ruolo (source→1ª metà,
target→2ª metà). Con soli 4 handleId per lato condivisi tra i ruoli, è ciò che permette a
un lato di ospitare fino a **4 source + 4 target = 8 endpoint senza overlap**.

### Contesto: catena di commit

```
89e67dc65 fix(editor-v2): role-aware handle bucketing in computePortDistribution
cdcef4456 fix(editor-v2): union node handles across source/target buckets in STEP 4
db7be7a25 fix(editor-v2): role-aware physical positioning of handles in DynamicHandles  [2026-05-21 17:25]
c8910167a fix(editor-v2): contextual handle positioning when only one role is on the side  [2026-05-25 01:20]
(working tree, non committato) tree connector respects handle assignment + estrazione handlePosition.ts
```

`git log --oneline -12 c8910167a` (intorno al commit):
```
c8910167a fix(editor-v2): contextual handle positioning when only one role is on the side
288cf3140 chore: remove [diag1] instrumentation post v2-flow reference delete fix
c26786fd1 fix(v2-flow): cleanup graph-side DEdge on reference and inheritance delete
1ed51d2e3 docs: [diag1] discovery of v2-flow reference delete pipeline
ccd3d2780 chore: revert Phase B Cluster 1, freeze cluster with rentry conditions
4758456dd fix(editor-v2): rehydrate attribute values across remove-rename-readd flow
```

Lineage role-aware (i 3 commit fratelli + il contestuale): `89e67dc65` (indici per ruolo)
→ `cdcef4456` (union STEP 4, su `nodeHandles` che però è dato morto — vedi
`inheritance_anchor_distribution.md` §2.3) → `db7be7a25` (posizione fisica segregata) →
`c8910167a` (segregazione condizionale).

---

## Obiettivo 4 — Stress test della regola proposta

> Regola proposta: **inheritance al centro (50%)** del suo lato; **reference
> equidistribuite** nello spazio rimanente, simmetriche attorno al centro.
> Discriminante chiave per la collision-freedom = **asse ruolo (source/target)**, che la
> regola **non nomina**.

### S1: 1 inh source (figlio) + 1 ref target (incoming), stesso lato — **coperto OK (migliora)**
- **Oggi** (`hasBothRoles=true`, 1 src + 1 tgt): inh(src)→6.25%, ref(tgt)→56.25%.
  Asimmetrico (è il sintomo descritto dal prompt su Full Professor).
- **Regola proposta**: inh→50%, ref→25% (o 75%). Posizioni distinte → **nessuna
  collisione**, e più equilibrato dell'attuale.
- Richiede di aggiungere alla formula la consapevolezza *inheritance vs reference* (asse
  semantico), oggi assente (la formula è solo role-aware). Fattibile, ma è codice nuovo.

### S2: 1 inh source + 2 ref stesso ruolo — **coperto OK (migliora), con caveat di lettura**
- Lettura A (2 ref **source** → 3 source, 0 target, `hasBothRoles=false`): oggi uniforme
  per indice → 25/50/75%, ma l'inheritance **non** è garantita al centro (dipende
  dall'ordinamento del bucket). Proposta: inh→50%, ref→25%/75%. Distinte → **no
  collisione**, e garantisce il centro all'inheritance (miglioria).
- Lettura B (2 ref **target** + 1 inh source → bidirezionale, `hasBothRoles=true`):
  ricade nel problema **S3** (vedi sotto): se la regola venisse implementata
  abbandonando la segregazione, inh(src) e ref(tgt) potrebbero contendersi le stesse
  posizioni. In questa lettura **non** è banale.

### S3: 0 inh + N source + M target, stesso lato — **NON coperto / degenere**
- **Oggi** (`hasBothRoles=true`): segregato → N source in 1ª metà, M target in 2ª metà →
  collision-free (ma raggruppato per metà, non equidistribuito sull'intero lato).
- **Regola proposta = "reference equidistribuite"**, due implementazioni possibili:
  - **(a) rimuovere la segregazione e ricadere sulla formula uniforme per-ruolo** (il ramo
    `else` attuale): ogni ruolo distribuisce **indipendentemente** su [0,1] →
    source a `(1..N)/(N+1)`, target a `(1..M)/(M+1)`. Per `N=M` i due insiemi sono
    **identici** → **ogni source collide con un target**. **REGRESSIONE.**
  - **(b) un unico ordinamento equidistante cross-ruolo** (interleaving globale dei N+M
    endpoint su tutto il lato): collision-free, ma richiede **macchinari nuovi** (un rank
    globale che attraversa i due ruoli) che oggi non esistono e che la regola — muta
    sull'asse ruolo — **non implica**.
- **Verdetto: degenere come formulata.** Coperto solo introducendo (b), non per semplice
  rimozione della segregazione.

### S4: Families.ecore `Member.left` 4+4 (4 source + 4 target, no inheritance) — **NON coperto / regressione dura**
- **Oggi** (`hasBothRoles=true`): 8 endpoint → source 6.25/18.75/31.25/43.75%, target
  56.25/68.75/81.25/93.75% → collision-free. **È il caso che il commento di c8910167a e
  `db7be7a25` citano esplicitamente come ragione d'essere della segregazione.**
- **Regola proposta, lettura naive "8 reference equidistanti"** ricadendo sulla formula
  uniforme per-ruolo (`count=4` per ruolo): source 20/40/60/80%, target 20/40/60/80% →
  **4 coppie di collisioni**. **REGRESSIONE DURA** — esattamente il sintomo che la
  segregazione previene.
- Coperto solo con l'ordinamento globale cross-ruolo (b di S3). Non per rimozione.

### S5: inh grouped + N ref, stesso lato — **compatibile lato trunk/parent; lato figlio eredita il caveat S3/S4**
- **Lato parent (trunk)**: l'inheritance fan-in collassa in **un solo** bucket target
  (`portDistribution.ts:115-130`); se quel lato del parent ha solo inheritance →
  `hasBothRoles=false`, `count=1` → **50%** → il trunk si ancora al **centro del parent**.
  La regola proposta ("inheritance al centro") **concorda**. **Compatibile** (è già così).
- **Lato figlio**: con il fix non-committato del tree connector, il ramo atterra
  sull'handle assegnato del figlio via `computeHandlePositionForNode` (stessa formula). Se
  il lato figlio è **mono-ruolo** (inh + reference uscenti, tutte source) → uniforme →
  proposta (inh al centro + ref simmetriche) **compatibile e collision-free**. Se il lato
  figlio ha **anche reference incoming** (target) → bidirezionale → **eredita il caveat
  S3/S4**.

**Nota sintesi S3/S4.** Sono precisamente i casi per cui la segregazione è stata
introdotta (`db7be7a25`) e poi preservata (`c8910167a`, ramo `hasBothRoles`). La regola
proposta riproduce il comportamento voluto **solo** quando il lato è mono-ruolo (degenera
correttamente in "tutti equidistanti" senza collisioni). Quando il lato è
**bidirezionale**, la rimozione della segregazione **peggiora** (collisioni). La role
segregation va quindi **preservata in qualche forma** (la sua *funzione* = collision-freedom
cross-ruolo, non necessariamente il layout a metà).

---

## Obiettivo 5 — Test/docs/screenshot collegati

- **Test toccati da c8910167a**: **nessuno**. `git show c8910167a --stat` elenca solo
  `docs/claude-code-log.md` e `DynamicHandles.tsx`. Nessun file Jest/Vitest/Playwright.
  (Nessun test unitario copre la formula percentuale di `DynamicHandles`/`handlePosition`.)
- **Screenshot / GIF / issue tracker nel commit message**: **nessuno**. Messaggio di una
  riga, senza link.
- **Docs / discovery collegati** (knowledge base):
  - `docs/discovery/2026-05-25_edge_anchoring_regression.md` — **il documento che propone
    c8910167a**: lineage `89e67dc65`/`cdcef4456`/`db7be7a25`, sintomo 6.25%/56.25%,
    direzione di fix contestuale, vincolo "non revertire il bucketing per ruolo". Fonte
    primaria del razionale.
  - `docs/discovery/2026-05-25_inheritance_anchor_distribution.md` — discovery sorella
    (sessione precedente di oggi): documenta che `nodeHandles` è dato morto, il doppio
    sistema di anchoring inheritance grouped (tree connector vs handle), e nei "Findings"
    (righe 329-345) anticipa proprio che *"il caso «tutte equidistanti su un lato»
    confligge col design role-segregato attuale"* e che un intervento *"rischia di
    regredire il caso denso bidirezionale Families.ecore (Member.left, 4+4)"*.
  - `docs/claude-code-log.md` — entry operative dei commit della serie.
  - (Non trovati file `sessione_*.md` / `session_*.md` nella root del workspace.)

---

## Raccomandazione operativa

**C — La role segregation di c8910167a risolve un problema strutturale che la regola
proposta non copre. Smontarla (ricadendo sulla formula uniforme per-ruolo) regredirebbe.**

Scelta per applicazione diretta del criterio del prompt: *"Hard stop se gli scenari S3/S4
mostrano che la nuova regola rompe il comportamento di c8910167a in modo non banale →
scegliere C"*. S3/S4 lo mostrano in modo **non banale** (Families `Member.left` 4+4: 4
collisioni visive, ogni source sovrapposta a un target, sotto la lettura naive
"equidistanti").

**Vincolo strutturale (descrittivo, non implementativo).** Su un lato che ospita **sia**
source **sia** target, il posizionamento **deve** mantenere un'assegnazione
**collision-free** perché source e target condividono gli handleId (entrambi indicizzati
da 0; max 4 handleId per lato — `portDistribution.ts:78,111,258`). La regola proposta,
formulata solo sull'asse *inheritance/reference* + estetico, **omette l'asse ruolo** che
fornisce questa collision-freedom. Qualsiasi sostituzione deve preservare un **ordinamento
per-lato collision-free attraverso i ruoli** (il *vero* compito della segregazione);
l'estetica "inheritance al centro + reference equidistanti simmetriche" è **ortogonale** e
può esserle sovrapposta, ma **non** la fornisce da sola.

**Sfumatura onesta (confine B/C).** La regola proposta **non è sbagliata**: cattura
correttamente l'estetica desiderata per i casi che la motivano (S1, S2 lettura A, lati
mono-ruolo, lato trunk/parent di S5) e li **migliora** (centra l'inheritance, simmetrizza).
Il problema è che **non può sostituire** la segregazione per semplice rimozione: i due
concetti vanno **combinati**. Resta C (non A/B) perché lo smontaggio diretto, senza il
nuovo ordinamento cross-ruolo, regredisce S3/S4 — e il prompt impone C in questo caso.

---

## File chiave per un eventuale fix

- `frontend/src/components/editor-v2/components/DynamicHandles.tsx` — rendering degli handle;
  ramo `hasBothRoles` (segregazione) vs uniforme (`:204-242` post-c8910167a; oggi delega a
  `handlePosition.ts`).
- `frontend/src/components/editor-v2/utils/handlePosition.ts` — **nuovo** (untracked):
  `computeHandlePercent` (`:62-79`) è ora l'unica fonte della formula, condivisa con il tree
  connector. È il punto naturale dove vivrebbe un ordinamento cross-ruolo.
- `frontend/src/components/editor-v2/utils/portDistribution.ts` — bucketing per ruolo
  (`:78`, `:111`), `MAX_HANDLES_PER_SIDE = 4` (`:258`), collasso inheritance fan-in/fan-out
  (`:81-99`, `:115-130`).
- `frontend/src/components/editor-v2/hooks/useTreeLayout.ts` — tree connector
  dell'inheritance raggruppata; con il fix non-committato atterra sull'handle assegnato
  (consumer della stessa formula → qualsiasi modifica alla formula impatta anche il trunk).
- `frontend/src/components/editor-v2/utils/jjomTransformers.ts` — `computeOptimalHandles`
  forza inheritance figlio=`top-0`, parent=`bottom-0` (`:353-356`): determina su quale lato
  l'inheritance contribuisce il proprio ruolo.
