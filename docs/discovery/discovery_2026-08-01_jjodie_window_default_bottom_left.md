# Discovery — default della finestra Jjodie in basso a sinistra

**Data**: 2026-08-01
**Prompt di riferimento**: `2026-08-01 13:31` — fix(jodie), two-phase con discovery read-only
**Branch**: `alfonso-frontend-jjtl`, HEAD locale `b21616a55` (include `616cf47e6 fix(jodie): move minimized FAB to bottom-left inside canvas`, non ancora pushato)
**Esito**: nessuna condizione di hard stop. Si procede alla Fase 2.

---

## 1. Obiettivo

Spostare il valore di partenza della posizione della finestra di chat di Jjodie da basso-destra a
basso-sinistra, ancorandolo al FAB minimizzato. Nessuna nuova impostazione, nessun cambio allo
schema di `JodieConfig`, comportamento invariato per chi ha già una posizione persistita.

## 2. File letti (path completi)

| Path | Righe rilevanti | Perché |
|------|-----------------|--------|
| `frontend/src/components/Jodie/JodieWindow.tsx` | 90-101, 133-139, 190-200, 233-270, 362-381, 382-400 | Sede della modifica + tutti i consumer della geometria |
| `frontend/src/types/jodie.ts` | 162, 408-458, 745-829 | `JodieConfig` (schema, `save()`, `load()`), `AIConfig.map` |
| `frontend/src/components/Jodie/JodieWindow.css` | 23-40, 92-104, 871-916 | Base finestra, fullscreen, offset del FAB |
| `frontend/src/pages/dashboard.scss` | 348-364, 383-399, 795-830 | Larghezza `.leftbar` e regole responsive |
| `frontend/src/pages/components/Dashboard.tsx` | 322, 549, 620-621 | Mount del rail |
| `frontend/src/pages/components/LeftBar.tsx` | 324, 406 | Classe radice del rail |

Nessun file di codice modificato in questa fase.

## 3. Esito delle 7 verifiche

### 3.1 — `computeDefaultPosition` e `JODIE_DEFAULT_MARGIN`

```
frontend/src/components/Jodie/JodieWindow.tsx:92:const JODIE_DEFAULT_MARGIN = 20;
frontend/src/components/Jodie/JodieWindow.tsx:98:const computeDefaultPosition = ...
frontend/src/components/Jodie/JodieWindow.tsx:136:  const initialPosition = config.position || computeDefaultPosition(initialSize);
frontend/src/components/Jodie/JodieWindow.tsx:262:  const defaultPos = computeDefaultPosition(defaultSize);
```

Corpo attuale (righe 98-101):

```typescript
const computeDefaultPosition = (size: Size = DEFAULT_SIZE): Position => ({
    x: Math.max(0, window.innerWidth - size.width - JODIE_DEFAULT_MARGIN),
    y: Math.max(0, window.innerHeight - size.height - JODIE_DEFAULT_MARGIN),
});
```

`JODIE_DEFAULT_MARGIN = 20`. **Unici consumer: le righe 99 e 100**, cioè la funzione stessa. Dopo la
modifica resterà senza consumer → per la regola 9 delle NON-NEGOTIABLE RULES **non va rimossa**: si
annota con `// TODO: cleanup`.

**Call site n. 2 — `resetPosition` (riga 259-270)**: è il caso esplicitamente previsto dal prompt
("per esempio in un reset"), quindi **non è un call site inatteso** e non attiva l'hard stop. Va però
registrata la conseguenza:

- il pulsante *Reset position* porterà la finestra in basso a **sinistra** invece che in basso a destra;
- questo è coerente con l'intento del task (il reset deve riportare al default, e il default cambia);
- **il commento alla riga 258 — `// Reset: bottom-right with default size; also exits fullscreen if active` — diventa factualmente falso.** Il prompt indica come unico punto di intervento `computeDefaultPosition`, quindi il commento **non viene toccato in Fase 2**: la correzione va proposta ad Alfonso all'hard stop pre-commit.

Nessun altro call site. Nessuna invocazione in handler di resize del viewport.

### 3.2 — Persistenza: la posizione viene scritta senza drag? → **NO. Si procede.**

Schema (`types/jodie.ts:745-752`): `position?: {x, y}` e `size?: {width, height}` sono campi opzionali
della classe, serializzati da `save()` con `JSON.stringify(this)` nella chiave localStorage
**`jjodie-credentials`** (`AI.STORAGE_GLOBAL_CONFIG`, riga 162).

Punti di scrittura di `position`, tutti in `JodieWindow.tsx`:

| Riga | Trigger |
|------|---------|
| 191-194 `savePosition` | fine drag (`handleMouseUp`, riga 292) |
| 197-200 `saveSize` + 358 | fine resize (`save()` serializza l'oggetto intero, quindi anche `position` **se già presente**) |
| 267-269 `resetPosition` | click esplicito su Reset |

**Nessuna scrittura al mount.** `computeDefaultPosition` alimenta solo `useState` (riga 136): il valore
calcolato resta in memoria e non viene mai serializzato finché l'utente non trascina/ridimensiona/resetta.
→ **nessuna migrazione one-time necessaria, nessun hard stop.**

L'unico `save()` non guidato dall'utente è dentro `load()` (riga 815, `return data.save(true)`), ma è un
**re-save di ciò che è stato letto**: non fabbrica una posizione di default. Vedi però §5.1 — quella riga
è oggi irraggiungibile.

### 3.3 — Effetti che riposizionano la finestra → **nessuna ri-ancoraggio a destra fuori dal fullscreen**

`JodieWindow.tsx:362-381`:

```typescript
useEffect(() => {
    const handleWindowResize = () => {
        if (isFullscreen) {
            setSize(prev => ({ width: prev.width, height: window.innerHeight }));
            setPosition(prev => ({ x: Math.max(0, window.innerWidth - size.width), y: 0 }));
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

- Ramo **non-fullscreen**: solo clamp verso l'alto/sinistra con `Math.min`. **Non contiene la formula
  `innerWidth - width - margin`** e non ri-ancora a destra. Compatibile col nuovo default.
- Ramo **fullscreen**: ri-ancora a destra, ma è geometria di fullscreen, indipendente dal default (§3.6).
- Nota (pre-esistente, fuori scope): il ramo non-fullscreen manca di `Math.max(0, …)`, quindi su viewport
  più stretti della finestra `x` può diventare negativo. Comportamento committato, non toccato.

### 3.4 — Rail sinistro

- **Larghezza**: `dashboard.scss:804-808` → `width: 240px; min-width: 240px; max-width: 240px`. **Confermata.**
- **Selettore**: `.leftbar` è la classe radice in entrambi i rami di `LeftBar.tsx` (riga 324
  `'leftbar leftbar--project'`, riga 406 `'leftbar'`). **Confermato.**
- **Mount**: `Dashboard.tsx:322` (lista progetti, incondizionato) e `Dashboard.tsx:621`
  (`{!hideLeftBar && <LeftBar active={'Project'} project={project} />}`) — **confermato alla riga esatta
  indicata dal prompt**. `hideLeftBar` (stato locale, riga 549) è true quando l'editor è attivo → nelle
  tab editor il rail **non è nel DOM** → `querySelector('.leftbar')` restituisce `null` → inset 0.
- **Stesso document**: `LeftBar` è un normale nodo dell'albero React di `Dashboard`, nessun portal e
  nessun iframe. `document.querySelector` lo raggiunge. **Confermato.**
- **Sotto i 769px**: `dashboard.scss:352-357` e `385-390` → `position: fixed; left: -240px`. Con width
  240 il `getBoundingClientRect().right` vale esattamente **0** (non negativo). `Math.max(0, …)` è
  comunque la normalizzazione corretta e difensiva.

### 3.5 — Offset effettivi del FAB (`JodieWindow.css:871-916`)

```css
.jodie-minimized { position: fixed; bottom: 100px; left: 30px; z-index: 10000; ... }

@media (min-width: 769px) {
    body:has(.leftbar) .jodie-minimized { left: calc(240px + 30px); }
}
```

**Confermati: `left: 30px`, `bottom: 100px`, offset rail `240px + 30px` sopra i 769px.** I valori del
nuovo default devono essere 30 (margine sinistro) e 100 (distanza dal fondo).

### 3.6 — `.jodie-window--fullscreen` è indipendente da `position`

`JodieWindow.css:92-104`: la classe imposta **solo** `border-radius`, `border-right`, `box-shadow` e due
regole sui figli (`cursor`, `border-radius`). **Nessuna proprietà geometrica.** La geometria fullscreen è
calcolata in JS da `enterFullscreen` (righe 234-245) e applicata via inline style (righe 394-399). Il
cambio di default **non lo tocca**. `exitFullscreen` ripristina `savedGeometry`, non il default.

### 3.7 — Collisioni sui nuovi identificatori

```
grep -rn "JODIE_FAB\|JODIE_DEFAULT_LEFT\|JODIE_DEFAULT_BOTTOM\|JODIE_BOTTOM_OFFSET\|LEFT_INSET" frontend/src
→ NO MATCHES
```

`JODIE_FAB_LEFT` e `JODIE_FAB_BOTTOM` sono liberi.

---

## 4. Divergenze prompt ↔ codice

| Prompt | Codice |
|--------|--------|
| numeri di riga da origin `07cee5219` | il working tree è avanti; `JODIE_DEFAULT_MARGIN` è a **riga 92**, `computeDefaultPosition` a **98-101**. Contenuto identico a quanto descritto. |
| `.leftbar` "~804-807" | 804-808 (la dichiarazione width occupa 3 righe). Valore 240px confermato. |
| `Dashboard.tsx` ~621 | esatto. |

Nessuna divergenza sostanziale.

## 5. Rischi e osservazioni

### 5.1 — Osservazione fuori scope: la posizione persistita non viene mai riletta dopo un reload

`JodieConfig.load()` (riga 777-816) è invocata **una sola volta**, dall'inizializzatore statico
`static current: JodieConfig = JodieConfig.load()` (riga 748). La guardia alla riga 798 è:

```typescript
if (!data || !Array.isArray(data.providers)) { /* scarta i dati letti */ }
```

ma `providers` è un **dizionario**, non un array: `AIConfig.map` è inizializzato a `{}` (riga 410) e
popolato per chiave (`AIConfig.map[name] = this`, riga 440). `Array.isArray({...})` è quindi sempre
`false` → il ramo viene sempre preso → i dati letti da localStorage (inclusi `position` e `size`) sono
scartati e si ritorna una `new JodieConfig()`. Di conseguenza la riga 815 (`return data.save(true)`) è
irraggiungibile — il che è anche il motivo per cui la verifica 3.2 non attiva l'hard stop.

**Conseguenze pratiche, da verificare in browser prima di trarne conclusioni operative:**

1. `position`/`size` **vengono scritti** in `jjodie-credentials` a fine drag, ma **non vengono più letti
   dopo un reload di pagina**. La persistenza sopravvive solo dentro la stessa sessione JS (la finestra
   chiusa e riaperta senza reload trova il singleton già mutato in memoria).
2. Per il task in corso questo è **favorevole**: gli utenti con una posizione basso-destra persistita
   vedranno comunque il nuovo default dopo un reload. Nessuno resta bloccato sul vecchio valore.
3. La checklist di verifica visiva del prompt chiede di svuotare la chiave localStorage prima del test:
   **con questo comportamento un hard refresh è già sufficiente**. Svuotare la chiave resta comunque
   innocuo (e la rimuove anche per la voce "trascinamento").
4. La voce di checklist *"trascino, chiudo, riapro → torna dove l'ho lasciata"* è verificabile solo
   **senza reload** in mezzo.

Questo è comportamento **committato e pre-esistente**, non introdotto né peggiorato da questo task.
Non viene toccato (regola 3: preservation first). Segnalato qui perché cambia l'interpretazione del
vincolo n. 3 del prompt e la procedura di test. **Se merita un fix, è un task separato.**

Comando di verifica manuale in console:
```js
JSON.parse(localStorage.getItem('jjodie-credentials') || '{}').position
// → mostra cosa è stato salvato; confrontare con JodieConfig.current.position dopo un reload
```

### 5.2 — Drawer mobile aperto (`<= 768px`)

Sotto i 769px il FAB ignora il rail (la media query è `min-width: 769px`). La misura a runtime prescritta
dal prompt, invece, se l'utente ha aperto il drawer (`.leftbar.open` → `left: 0` → `right` = 240)
restituirebbe 240 e la finestra nascerebbe a x=270 invece che a 30. È un caso di bordo benigno — col
drawer aperto e visibile, evitare la sovrapposizione è ragionevole — ma è una **divergenza di 240px dal
FAB in quello stato specifico**. Si adotta comunque `Math.max(0, …)` come da prompt, senza gate sul
breakpoint, per non aggiungere logica non richiesta.

### 5.3 — Rischi minori

- Il default è calcolato **una sola volta al mount** (riga 136, inizializzatore di `useState`). Se il rail
  viene montato/smontato mentre la finestra è già aperta, la posizione non si aggiorna. È il comportamento
  attuale (nessun ricalcolo del default fuori dal reset) e non viene modificato.
- Il clamp di sicurezza sul lato destro è nuovo: su viewport stretti la finestra può finire a `x = 30`
  senza rispettare l'inset del rail. È esattamente il compromesso richiesto dal prompt (visibilità
  integrale prima dell'allineamento al FAB).

## 6. Domande aperte per Alfonso

1. **Commento riga 258** (`// Reset: bottom-right with default size`) — diventa falso con questa modifica.
   Lo aggiorno in `bottom-left` (una riga, stesso file) o lo lascio intatto per rispettare il vincolo
   "unico punto di intervento"? Richiesta all'hard stop pre-commit.
2. **§5.1** — la persistenza di posizione/size non sopravvive al reload per via della guardia
   `Array.isArray(data.providers)`. Apro un task separato o resta come nota?

## 7. Conclusione

Nessuna delle tre condizioni di hard stop della Fase 1 si è verificata:

- verifica 2: nessuna persistenza automatica della posizione → **procedi**;
- verifica 1: il secondo call site è il reset, esplicitamente previsto dal prompt → **procedi** (con nota);
- verifica 3: nessun riposizionamento che ancori a destra fuori dal fullscreen → **procedi**.

Si prosegue con la Fase 2 sul solo `computeDefaultPosition` in `JodieWindow.tsx`.
