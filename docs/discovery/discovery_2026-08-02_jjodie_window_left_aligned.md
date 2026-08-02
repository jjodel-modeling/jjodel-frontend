# Discovery — finestra Jjodie allineata a sinistra (default e fullscreen)

**Data**: 2026-08-02
**Prompt di riferimento**: `2026-08-01 14:05` — fix(jodie), two-phase con discovery read-only
**Protocollo**: `docs/PROTOCOL.md` P1..P9
**Branch**: `alfonso-frontend-jjtl`, HEAD `733dab0bb`
**Esito**: si procede alla Fase 2, con **due segnalazioni bloccanti-per-lettura** (§2 e §4.2) risolte come documentato.

---

## 1. Ipotesi che questa discovery sta falsificando

1. «Il file è allo stato origin `07cee5219` descritto nel prompt» → **FALSA**, vedi §2.
2. «Solo `computeDefaultPosition` e `enterFullscreen` ancorano a destra» → **FALSA**: c'è un terzo punto, il ramo fullscreen del listener di resize (§4.2).
3. «`resetPosition` ha una formula propria» → **FALSA**: passa da `computeDefaultPosition`, eredita il nuovo default senza modifiche (§4.1).
4. «La posizione viene serializzata al mount» → **FALSA**: solo a fine drag/resize/reset (§4.3).

## 2. SEGNALAZIONE 1 — il prompt sostituito È stato eseguito (P6)

Il prompt dichiara: *«Sostituisce `2026-08-01_prompt_jjodie_window_default_bottom_left.md` (mai eseguito)»* e riporta lo stato di `JodieWindow.tsx` «a origin».

**Entrambe le affermazioni non corrispondono al repo.** Quel prompt è stato eseguito e committato il 2026-08-01:

```
ddc9be2cd fix(jodie): default chat window to bottom-left anchored to the FAB
5f8e5eb1d docs: discovery for the Jjodie window bottom-left default
8dde49e0a docs: log entry for the Jjodie window bottom-left default
```

`git merge-base --is-ancestor ddc9be2cd HEAD` → vero: sono in history, non su un branch laterale.

Stato **reale** di `JodieWindow.tsx:90-113` (non quello citato dal prompt):

```typescript
const JODIE_DEFAULT_WIDTH = 760;
const JODIE_DEFAULT_HEIGHT = 520;
// TODO: cleanup — no consumer left after the bottom-left default (kept per preservation rule).
const JODIE_DEFAULT_MARGIN = 20;
// Replicate the minimized FAB offsets from JodieWindow.css (.jodie-minimized: left 30px, bottom 100px).
const JODIE_FAB_LEFT = 30;
const JODIE_FAB_BOTTOM = 100;
...
// Bottom-left, anchored to the minimized FAB that opens the window.
const computeDefaultPosition = (size: Size = DEFAULT_SIZE): Position => {
    const railInset = Math.max(0, document.querySelector('.leftbar')?.getBoundingClientRect().right ?? 0);
    const x = railInset + JODIE_FAB_LEFT;
    const maxX = window.innerWidth - size.width - JODIE_FAB_LEFT;
    return {
        x: x > maxX ? Math.max(JODIE_FAB_LEFT, maxX) : x,
        y: Math.max(0, window.innerHeight - size.height - JODIE_FAB_BOTTOM),
    };
};
```

**Conseguenze operative:**

- La finestra è **già** in basso a sinistra, ma con gap 30px e fondo a 100px — esattamente i due valori che questo prompt dichiara sbagliati. Il task quindi **corregge codice committato**, non porta origin al nuovo stato.
- Il diff sarà più piccolo del previsto su `computeDefaultPosition` (l'helper del rail e il clamp esistono già, cambiano solo le costanti) e più grande del previsto sulle costanti (due da neutralizzare).
- `JODIE_FAB_LEFT` e `JODIE_FAB_BOTTOM` restano **senza consumer** dopo questa modifica. P3 vieta di rimuovere codice apparentemente inutilizzato → annotati `// TODO: cleanup`, rimozione proposta ad Alfonso come task separato (§7 Q1).
- `JODIE_DEFAULT_MARGIN` **torna vivo** (governa `y`): il suo `// TODO: cleanup` va rimosso perché diventa falso.

P6 imporrebbe di fermarsi («Se lo stato del working tree non corrisponde a quanto dichiara il prompt, fermati e segnalalo»), ma il prompt stesso contiene una deroga mirata: *«se il working tree differisce, riportalo nel discovery report invece di assumere»*. Prevale l'istruzione specifica: si prosegue documentando qui. Lo stato finale richiesto è comunque non ambiguo e indipendente dal punto di partenza.

## 3. File letti (path completi)

| Path | Righe rilevanti |
|------|-----------------|
| `frontend/src/components/Jodie/JodieWindow.tsx` | 90-113, 147-149, 246-283, 375-395 |
| `frontend/src/components/Jodie/JodieWindow.css` | 88-104 |
| `frontend/src/components/Jodie/JodieHeader.tsx` | 27-29, 152-153, 247-265 |
| `frontend/src/types/jodie.ts` | 162, 408-458, 745-829 |
| `frontend/src/pages/dashboard.scss` | 348-364, 383-399, 804-809 |
| `frontend/src/pages/components/Dashboard.tsx` | 322, 549, 620-621 |
| `docs/PROTOCOL.md` | P1..P9 (v1.0) |

Nessun file di codice modificato in questa fase.

## 4. Esito delle 7 verifiche

### 4.1 — Call site di `computeDefaultPosition` e costanti

```
JodieWindow.tsx:90:  const JODIE_DEFAULT_WIDTH = 760;
JodieWindow.tsx:93:  const JODIE_DEFAULT_MARGIN = 20;      ← oggi SENZA consumer
JodieWindow.tsx:95:  const JODIE_FAB_LEFT = 30;
JodieWindow.tsx:96:  const JODIE_FAB_BOTTOM = 100;
JodieWindow.tsx:98:  DEFAULT_SIZE usa JODIE_DEFAULT_WIDTH
JodieWindow.tsx:149: config.position || computeDefaultPosition(initialSize)   ← init
JodieWindow.tsx:250: fsSize usa JODIE_DEFAULT_WIDTH
JodieWindow.tsx:275: const defaultPos = computeDefaultPosition(defaultSize);  ← resetPosition
```

**Due call site, entrambi attesi.** `resetPosition` (righe 271-283) **non ha formula propria**: chiama
`computeDefaultPosition(defaultSize)` ed eredita il nuovo default senza modifiche. La Fase 2b non deve
toccarlo. Il bottone è `bi bi-arrow-counterclockwise` → `onResetPosition` (`JodieHeader.tsx:247-255`).
Confermato anche `bi bi-arrows-fullscreen` → `onToggleFullscreen` (`JodieHeader.tsx:257-265`).

**Nessun call site inatteso** → questa condizione di hard stop non scatta.

### 4.2 — SEGNALAZIONE 2: handler fullscreen + listener di resize che ri-ancora a destra

`enterFullscreen` (righe 246-258), verbatim:

```typescript
    // Enter fullscreen: anchor right, full viewport height, default width
    const enterFullscreen = useCallback(() => {
        triggerAnimation();
        setSavedGeometry({ position, size });
        const fsSize: Size = { width: JODIE_DEFAULT_WIDTH, height: window.innerHeight };
        const fsPosition: Position = {
            x: Math.max(0, window.innerWidth - fsSize.width),
            y: 0,
        };
        setSize(fsSize);
        setPosition(fsPosition);
        setIsFullscreen(true);
    }, [position, size, triggerAnimation]);
```

`exitFullscreen` (righe 261-269), verbatim:

```typescript
    // Exit fullscreen: restore previously saved geometry
    const exitFullscreen = useCallback(() => {
        triggerAnimation();
        if (savedGeometry) {
            setSize(savedGeometry.size);
            setPosition(savedGeometry.position);
        }
        setSavedGeometry(null);
        setIsFullscreen(false);
    }, [savedGeometry, triggerAnimation]);
```

`savedGeometry` è catturata **prima** di sovrascrivere la geometria e ripristinata tale e quale → l'uscita
da fullscreen è indipendente dal lato di ancoraggio. **Non va toccata.**

**Esiste il listener previsto dal prompt** (righe 376-395), e il suo ramo fullscreen ri-ancora a destra:

```typescript
    // Keep window in bounds on resize (or re-anchor when fullscreen)
    useEffect(() => {
        const handleWindowResize = () => {
            if (isFullscreen) {
                setSize(prev => ({ width: prev.width, height: window.innerHeight }));
                setPosition(prev => ({
                    x: Math.max(0, window.innerWidth - size.width),   // ← RI-ANCORA A DESTRA
                    y: 0,
                }));
                return;
            }
            setPosition(prev => ({
                x: Math.min(prev.x, window.innerWidth - size.width),
                y: Math.min(prev.y, window.innerHeight - size.height),
            }));
        };
        window.addEventListener('resize', handleWindowResize);
        return () => window.removeEventListener('resize', handleWindowResize);
    }, [size, isFullscreen]);
```

Senza questo aggiornamento, dopo un qualunque resize del viewport la finestra massimizzata **tornerebbe
ancorata a destra**, vanificando il task.

**Contraddizione interna del prompt.** La verifica 2 prescrive: *«se c'è, va aggiornato anche quello»*.
La lista di hard stop dice: *«Hard stop … se la 2 o la 4 trovano un ricalcolo che ancora a destra»*.
Le due frasi si applicano allo stesso identico ritrovamento e impongono azioni opposte.

**Risoluzione adottata**: prevale l'istruzione specifica della verifica 2, che descrive esattamente questo
caso e ne prescrive il trattamento. La lista di hard stop si legge come rete di sicurezza per un ricalcolo
*non anticipato*; questo è anticipato alla lettera. Fermarsi qui consegnerebbe una feature rotta al primo
resize. **Il ramo va aggiornato** con lo stesso helper della 2b e gap zero.

Nota di scope: il listener non è tra i punti elencati in DOVE (che cita «costanti, `computeDefaultPosition`,
handler di ingresso fullscreen»), ma la verifica 2 lo autorizza esplicitamente. Modifica al solo ramo
`isFullscreen`; il ramo non-fullscreen resta intatto.

### 4.3 — Persistenza: la posizione viene scritta senza drag? → **NO. Si procede.**

Chiave localStorage: **`jjodie-credentials`** (`types/jodie.ts:162`, `AI.STORAGE_GLOBAL_CONFIG`).
Schema: `position?: {x,y}`, `size?: {width,height}` (righe 750-751), serializzati da `save()` con
`JSON.stringify(this)` (riga 765).

Punti di scrittura, tutti in `JodieWindow.tsx`: `savePosition` a fine drag (righe 203-206, invocata a
riga 304), `saveSize` a fine resize (righe 209-212), `resetPosition` (righe 280-282). **Nessuna scrittura
al mount**: `computeDefaultPosition` alimenta solo l'inizializzatore di `useState` (riga 149), il valore
non viene mai serializzato finché l'utente non agisce. → **nessuna migrazione, nessun hard stop.**

**Osservazione fuori scope (invariata rispetto al report del 2026-08-01, §5.1)**: `JodieConfig.load()`
scarta i dati letti da localStorage perché la guardia a riga 798 è `!Array.isArray(data.providers)`, ma
`providers` è un dizionario (`AIConfig.map = {}`, riga 410, popolato per chiave a riga 440) → `Array.isArray`
è sempre falso. `position`/`size` vengono scritti ma **mai riletti dopo un reload**. Comportamento
committato e preesistente, non toccato. Rileva per il test: **basta un hard refresh** per vedere il nuovo
default, e la voce «trascino/chiudo/riapro» è verificabile solo senza reload in mezzo.

### 4.4 — Ramo non-fullscreen del clamp → nessun ancoraggio a destra

`x: Math.min(prev.x, window.innerWidth - size.width)` — clamp puro verso sinistra, **nessuna formula
`innerWidth - width - margin`**. Compatibile col nuovo default, **non va toccato**.

Nota preesistente (fuori scope): manca `Math.max(0, …)`, quindi con viewport più stretto della finestra
`x` può diventare negativo. Comportamento committato, invariato.

### 4.5 — Rail sinistro

- **Larghezza**: `dashboard.scss:804-808` → `width: 240px; min-width: 240px; max-width: 240px`. **Confermata.**
- **Selettore**: `.leftbar`, classe radice in entrambi i rami di `LeftBar.tsx` (:324 `'leftbar leftbar--project'`, :406 `'leftbar'`). **Confermato.**
- **Mount**: `Dashboard.tsx:322` (lista progetti) e `Dashboard.tsx:621` `{!hideLeftBar && <LeftBar active={'Project'} project={project} />}` — **riga esatta indicata dal prompt**. `hideLeftBar` è true con l'editor attivo → nelle tab editor il rail **non è nel DOM** → inset 0.
- **Stesso document**: normale nodo dell'albero React di `Dashboard`, nessun portal, nessun iframe. `document.querySelector` lo raggiunge. **Confermato.**
- **Off-canvas** sotto i 769px: `dashboard.scss:354` e `:387` → `position: fixed; left: -240px`. Con width 240 il `right` vale esattamente **0**; `Math.max(0, …)` resta la normalizzazione corretta e difensiva.

### 4.6 — Blocco `.jodie-window--fullscreen` (`JodieWindow.css:91-96`), verbatim

```css
/* Fullscreen modifier: right-anchored, full viewport height. Drag/resize disabled. */
.jodie-window--fullscreen {
    border-radius: 0;
    border-right: none;
    box-shadow: -8px 0 24px rgba(0, 0, 0, 0.12);
}
```

Valori attesi dal prompt **confermati**. Il blocco non contiene proprietà geometriche (`left`/`right`/
`top`/`width`): la geometria arriva sempre dall'inline style calcolato in JS. Le regole figlie
(`.jodie-header` cursor, `.jodie-input-container` border-radius, righe 98-104) sono neutre rispetto al lato.
**Nessun'altra regola nel file impone un ancoraggio a destra** per `.jodie-window`.

Il commento di intestazione dice `right-anchored` e diventerà falso: è la riga immediatamente sopra il
blocco che sto modificando e descrive proprio la proprietà che cambio. Stesso caso del commento di
`resetPosition` che Alfonso ha approvato di aggiornare il 2026-08-01. Aggiornato, e segnalato in §7 Q2.
Idem per il commento di `enterFullscreen` (`JodieWindow.tsx:246`, «anchor right»).

### 4.7 — Collisioni sui nuovi identificatori

```
grep -rn "JODIE_LEFT_GAP\|LEFT_GAP\|getLeftInset\|leftInset\|computeLeftInset\|JODIE_GAP" frontend/src
→ TUTTI LIBERI
```

## 5. Piano di modifica risultante

| # | Punto | File | Nota |
|---|-------|------|------|
| 2a | costante gap 8 | `JodieWindow.tsx` | `JODIE_LEFT_GAP`; `JODIE_DEFAULT_MARGIN` resta e torna a governare `y` |
| 2b | helper inset rail | `JodieWindow.tsx` | estratto dal corpo attuale di `computeDefaultPosition`, riusato da 2c e 2d |
| 2c | `computeDefaultPosition` | `JodieWindow.tsx` | `x = max(0, min(inset + 8, innerWidth - width - 8))`, `y` con `JODIE_DEFAULT_MARGIN` |
| 2d | `enterFullscreen` | `JodieWindow.tsx` | `x = max(0, min(inset, innerWidth - fsWidth))`, gap zero |
| 2d-bis | ramo fullscreen del resize | `JodieWindow.tsx` | **aggiunta rispetto a DOVE**, autorizzata dalla verifica 2 (§4.2) |
| 2e | CSS fullscreen | `JodieWindow.css` | `border-right`→`border-left`, ombra `-8px`→`8px` |
| — | commenti stale | entrambi | 3 commenti che il cambio rende falsi (§4.6) |

Non si toccano: `exitFullscreen`, `resetPosition`, ramo non-fullscreen del clamp, drag, resize manuale,
`.jodie-minimized`, schema `JodieConfig`.

## 6. Rischi

1. **Il FAB resta a 30px, la finestra va a 8px.** Dopo questa modifica FAB e finestra non sono più allineati sullo stesso margine sinistro (30 vs 8). Il prompt lo mette esplicitamente fuori scope («il FAB resta ai suoi 30/100px: eventuale riallineamento è un task separato»), ma è una discontinuità visiva che si noterà: il bottone che apre la finestra non è più sulla sua stessa verticale.
2. **Viewport stretto in fullscreen**: con `innerWidth < 760` la finestra massimizzata parte da `x=0` e sborda a destra. È il comportamento odierno a specchio (oggi sborda a sinistra), non una regressione nuova.
3. **Rail montato + fullscreen**: la finestra massimizzata parte dal bordo del rail e resta larga 760 → occupa `240..1000`. Su viewport stretti può sborare. Accettato: coerente con la richiesta «flush al bordo dell'area contenuto, larghezza invariata».
4. **Il default è calcolato una sola volta al mount** (riga 149): montare/smontare il rail a finestra già aperta non lo ricalcola. Comportamento odierno, invariato.

## 7. Domande aperte

1. **`JODIE_FAB_LEFT` / `JODIE_FAB_BOTTOM` restano senza consumer.** P3 vieta di rimuoverli, quindi li annoto `// TODO: cleanup`. Sono però costanti introdotte da `ddc9be2cd` — cioè dal task che questo prompt corregge — e il loro nome rimanda a un allineamento al FAB che il prompt dichiara sbagliato. Le rimuovo in un commit di cleanup dedicato o restano?
2. **Tre commenti** (`JodieWindow.tsx:246` «anchor right», `:93` `// TODO: cleanup` ormai falso, `JodieWindow.css:91` «right-anchored») diventano falsi per effetto diretto della modifica. Aggiornati, coerentemente con la decisione presa il 2026-08-01 sul commento di `resetPosition`.
3. **Il prompt sostituito è già in history** (§2): vale la pena un `revert` cosmetico o si tiene la catena `ddc9be2cd` → questo commit come traccia della correzione? Consigliata la seconda: i campi `Corregge`/`Causa` del prompt log (§21.3) esistono apposta per misurare questi rework.

## 8. Conclusione

Nessuna condizione di hard stop scatta nella sua forma sostanziale: niente persistenza automatica (4.3),
niente call site inattesi (4.1). Il ricalcolo che ancora a destra **esiste** (4.2) ma è esattamente quello
che la verifica 2 prescrive di aggiornare: trattato come tale, con la contraddizione documentata sopra.
Si prosegue con la Fase 2 secondo il piano di §5.
