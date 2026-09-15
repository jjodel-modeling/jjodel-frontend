# R-PanArchitecture — note di composizione e pattern per future revisioni

> Documento "parked" generato il 2026-05-07 dopo la chiusura del filone pan classic editor (5 round di fix in `Measurable.tsx`). Cristallizza i learnings tecnici architetturali per quando in futuro si vorrà rivedere il pan classic editor in profondità (es. pre-3.0.0 se diventa critico, oppure dopo). Non è una proposta esecutiva, è un punto di partenza informato.

## Contesto

R-PanArchitecture è il commit `5522f37dd` del 6 maggio 2026, che ha riprogettato il pan del classic editor passando da "dispatch live + CSS variables" a "mutazioni DOM dirette su tre layer durante drag + dispatch unico al `mouseup`". Risolveva uno stutter pan a 30fps che era il sintomo che ha originariamente innescato il filone.

R-PanArch ha effettivamente eliminato lo stutter, ma ha introdotto bug di rendering compositi che hanno richiesto 5 round iterativi di fix nello stesso giorno (sessione 2026-05-07). Tutti i fix vivono in un singolo file (`Measurable.tsx`), tutti sono applicazioni di un pattern unico ("sync DOM override in propsevent"), tutti reagiscono a effetti collaterali di sistemi che mutano lo stesso DOM con timing asincroni.

Questo documento descrive la composizione attuale, perché è fragile, e quali direzioni si possono valutare per un ripensamento futuro.

## Mappa dei sistemi che mutano il DOM durante drag

Quattro sistemi distinti scrivono sullo stesso pezzo di DOM con timing diversi:

```
.GraphContainer
├── .jjodel-edge-overlay (SVG, sibling di .scrollable)
│   └── <g> ← R-PanArch setAttribute('transform', ...) durante drag
├── <svg> Grid (sibling di .scrollable)
│   └── <pattern> ← R-PanArch setAttribute('patternTransform', ...) durante drag
└── .scrollable (CSS variables --offset-x/y, --zoom-x/y scritte da React)
    └── .panning-handle ← jQuery UI Draggable scrive style.left/top live
        └── .panning-content ← childmode-e scrive style.left/top
                              ← R-PanArch scrive style.transform inline
                              ← (CSS rule base: transform: translate(var(--offset-x), var(--offset-y)))
```

I quattro sistemi:

### 1. jQuery UI Draggable (legacy, su `.panning-handle`)

Configurazione: `{cancel, cursor: 'grabbing', distance: 5}` con `helper: 'clone'` commentato out. Comportamento default: applica `position: relative` e modifica `style.left/top` live ad ogni `mousemove`. Lascia lo stato finale persistente al `dragstop` — non rimuove `style.left/top`, che restano scritti inline al DOM e sopravvivono ai reload del browser.

Visibilità: il `.panning-handle` è il parent del `.panning-content`. Ogni movimento del handle si compone visivamente con qualunque transform del figlio.

### 2. childmode-e (Measurable interno, su `.panning-content`)

Code path in `MeasurableComponent.childmode` (line ~182). Quando `onChildren=true` (caso del pan handle-level), durante drag scrive `style.left/top` sul `.panning-content` (che ha `position: relative`, quindi `left/top` ha effetto visivo cumulativo con `transform`). Designed originariamente per il drag di vertex singoli, riusato dal pan handle-level senza essere stato discriminato dai due flussi.

Cleanup al `dragend` via `setTimeout(_, 1)`:

```typescript
AT_TRANSACTION(() => setTimeout(() => {
    child.classList.remove('dragging'); child.classList.add('idle');
    child.style.removeProperty('left'); child.style.removeProperty('top');
}, 1));
```

Asincrono. Tra il `mouseup` (sync) e l'esecuzione di questo cleanup (~1-2ms dopo, magari di più sotto carico), il `.panning-content` è in uno stato transitorio dove `class = dragging` ma altre proprietà possono essere già state mutate da R-PanArch.

### 3. R-PanArch (custom, su tre layer DOM)

Callback `whileDragging` in `ScrollableComponent.render()` (linee ~518-559):
- `pcEl.style.transform = translate(fresh)` su `.panning-content`
- `edgeG.setAttribute('transform', scale(z) translate(fresh))` su `<g>` di EdgeOverlay
- `gridPattern.setAttribute('patternTransform', ...)` su `<pattern>` di Grid

`fresh = coords + ui.position` dove `coords = oldPos = current store offset` (read da Redux state) e `ui.position` è il delta dal `dragstart`. Single dispatch al `onDragEnd` (`commitOffset`) con `oldPos += ui.position` cumulato da childmode-e.

Vive in `propsevent`, ultimo nella catena event handler `[defaultevt, jquievt, propsevent]` di Measurable (line 299-309). È quindi sempre **ultimo a scrivere** per ogni frame, e può sovrascrivere quello che gli altri sistemi (1, 2) hanno scritto prima.

### 4. React commit delle CSS variables `--offset-x/y`

In `graphElement.tsx:1203-1204`, le CSS variables vengono scritte come parte dello `style` React-rendered del graph element, propagate per inheritance al `.panning-content`. Vengono aggiornate solo dopo che il `commitOffset` dispatch innesca un re-render React e il commit completa.

In React 18 concurrent mode, il commit può essere deferred di N microtask oltre il `dispatch` sync. Doppio `requestAnimationFrame` non garantisce di catturarlo dopo il commit in tutti i casi.

## Perché la composizione è fragile

I quattro sistemi sono coordinati informalmente, non strutturalmente. Ogni timing assumption che uno fa sull'altro è implicita. In particolare:

1. **jQuery UI sul handle vs R-PanArch sul content**: i due sistemi muovono entrambi il `.panning-handle/content` con scale di velocità identica (1× del mouse delta), ma in cascata visiva → 2× sui figli. Né jQuery UI è consapevole di R-PanArch, né viceversa.

2. **childmode-e sul content vs R-PanArch sul content**: stesso elemento, due sistemi di mutation. childmode scrive `left/top`, R-PanArch scrive `transform`. Se il content è positioned, le due si sommano. childmode è in `defaultevt` (precedente in catena), R-PanArch in `propsevent` (successivo) — l'ultimo "vince" il frame, ma solo se R-PanArch sa di dover sovrascrivere.

3. **rAF clear di R-PanArch vs cleanup setTimeout di childmode-e**: due cleanup asincroni con timing diversi (~16ms vs ~1-2ms). Tra l'uno e l'altro, il `.panning-content` può essere in uno stato CSS misto (es. inline transform clearato, class ancora `dragging`).

4. **rAF clear di R-PanArch vs React commit delle CSS variables**: il rAF può fire prima del commit React, lasciando la CSS rule base a leggere valori stale di `--offset-x/y`.

Ogni round di fix nella sessione 2026-05-07 ha gestito una di queste tensioni. Il pattern emerso è uniforme.

## Pattern adottato — "sync DOM override in propsevent"

R-PanArch sovrascrive direttamente il DOM dei figli che gli altri sistemi hanno scritto, **nello stesso tick** del callback. I sistemi precedenti scrivono prima nella event chain, R-PanArch scrive dopo. Per ogni frame, l'ultimo "vince" il rendering.

Esempi applicati:

**Override childmode su `.panning-content`** (round 2):
```typescript
// Dentro whileDragging, dopo le 3 mutazioni DOM:
pcEl.style.left = '0px';
pcEl.style.top = '0px';
```

**Override jQuery UI su `.panning-handle`** (round 3):
```typescript
const handleEl = this.panningHandleRef.current;
if (handleEl) {
    handleEl.style.left = '0px';
    handleEl.style.top = '0px';
}
```

**Cleanup mount-time per stato persistente jQuery UI/childmode** (round 1.3 + round 2.3):
```typescript
componentDidMount() {
    const handle = this.panningHandleRef.current;
    if (handle) { handle.style.left = '0'; handle.style.top = '0'; }
    const content = this.panningContentRef.current;
    if (content) { content.style.left = '0'; content.style.top = '0'; }
}
```

**Preserve inline transform per evitare CSS-var staleness** (round 5):
```typescript
// Inline style.transform = translate(fresh_finale) NON viene clearato
// in onDragEnd. Resta persistente fino al prossimo whileDragging.
```

Il pattern è efficace: ogni round ha chiuso un sintomo specifico, e collettivamente i 5 round hanno chiuso il filone. Ma è anche **reattivo**: ogni nuovo sintomo richiede di identificare quale dei 4 sistemi sta interferendo e applicare un altro override.

## Limiti del pattern attuale

1. **Crescita della superficie del fix**: ogni nuovo bug compositivo richiede una nuova clausola di override sync. La diff cumulativa è ~50 righe in `Measurable.tsx` per chiudere 5 sintomi di un singolo filone. Se in futuro emergeranno altri (es. interazione con il flow editor, con un nuovo flusso di drag, con concurrent mode di React 18 che si comporta diversamente), si aggiungeranno altre clausole.

2. **Stato inline persistente sul DOM**: il round 5 ha lasciato `style.transform = translate(...)` permanente sul `.panning-content` tra un pan e l'altro. Visibile in DevTools. Confonde debugging di chi non ha letto il commento. Se un altro sviluppatore in futuro leggesse `style="transform: translate(-525px, 302px)"` su un elemento "fermo", potrebbe pensare a un bug.

3. **Dipendenza da ordine non documentato della event chain**: il pattern funziona perché R-PanArch è in `propsevent`, ultimo nella catena `[defaultevt, jquievt, propsevent]`. Se quel ordine cambiasse (es. refactor di `Measurable`, riorganizzazione della event dispatching), il pattern si rompe silenziosamente — gli override non sarebbero più "ultimi".

4. **Nessuna invariante esplicita**: non c'è documentazione (al di fuori dei commenti puntuali nel codice) che dica "il `.panning-handle` deve avere `style.left/top = 0` in ogni frame durante e dopo drag", o "l'inline transform sul `.panning-content` deve coincidere con `translate(var(--offset))` post-pan". Se un futuro sviluppatore introducesse una violazione, non c'è un test né un check runtime che lo rilevasse.

5. **Reattività CSS rule potenziale**: se in futuro si aggiungesse una rule come `.panning-content.dragging { transform: none }` (o simile) — magari per una ragione legittima (es. un effetto visivo durante drag) — lo schema corrente lo gestirebbe nei frame mid-drag (override sync), ma potrebbe creare nuovi flicker post-mouseup come accaduto nel round 5. La defesa attuale è "preserve inline transform forever", che neutralizza qualunque rule, ma anche qualunque intento futuro.

## Direzioni per un ripensamento futuro

Ipotesi non esecutive, da valutare prima di un rewrite serio:

### A. Decoupling di childmode dal pan handle-level

childmode-e è designed per il drag di vertex singoli. Il pan handle-level (drag di tutto il canvas) lo riusa per via di `onChildren=true`. Se si discriminassero i due flussi — es. nuovo `panMode=true` che bypassa childmode — si eliminerebbe una intera categoria di interferenze (round 2 non sarebbe stato necessario).

Costo: identificare tutti i punti del codebase che leggono `onChildren` e capire l'impatto. Il rischio è regredire il drag di vertex singoli.

### B. Sostituzione di jQuery UI Draggable per il pan handle

jQuery UI è legacy e introduce side-effect (mutazione live di `style.left/top` sul handle, stato persistente, behavior default opaco). Per il solo pan handle-level si può scrivere un drag handler nativo (eventi `mousedown/move/up`, niente DOM mutation, solo emit di delta) in ~30 righe di codice. R-PanArch sarebbe l'unico consumer del delta.

Costo: tenere jQuery UI per il drag di vertex singoli (dove è ancora utile per le features di Draggable come containment, axis, snap) ma non per il pan. Refactor del `Measurable` per supportare i due path.

### C. Eliminare le CSS variables React-rendered come sorgente di pan

Attualmente `--offset-x/y` sono scritte da React come style del graph element. Il React commit timing è opaco e a volte deferred, da cui i flicker da CSS-var staleness. Si può spostare la sorgente del pan a un *singolo* riferimento (es. una ref al `.panning-content` modificata sync da R-PanArch, senza CSS variables intermediate). React non sarebbe più nel critical path del rendering del pan.

Costo: i consumer di `--offset-x/y` (forse altri componenti che le leggono) andrebbero migrati. EdgeOverlay e Grid già non le usano per il pan stesso (usano `setAttribute` direttamente in R-PanArch), quindi il blast radius dovrebbe essere contenuto.

### D. Class lifecycle gestito da R-PanArch invece che da childmode-e

Attualmente la transizione `idle → dragging → idle` su `.panning-content` è gestita da childmode-e con `setTimeout` asincrono. Se R-PanArch gestisse direttamente questa transizione (sync nel `onDragStart` e nel `onDragEnd`), si eliminerebbe l'asincronia. Il flicker del round 5 non sarebbe potuto succedere con la rule `.dragging` come causa, e una buona parte del rationale del round 5 verrebbe meno.

Costo: childmode-e potrebbe avere logiche aggiuntive che dipendono dal class change (es. cleanup di altre proprietà, eventi custom). Da inventariare.

### E. Migrazione a un drag controller dedicato

Visione più ampia: introdurre un singolo modulo `PanController` che possiede tutto il flusso del pan (mouse handlers, calcolo del delta, application del transform, dispatch finale, cleanup), con un'interfaccia pulita e una sola sorgente di verità per il transform applicato. Sostituirebbe jQuery UI + childmode + R-PanArch + dispatch React per il pan handle-level. Lascia gli altri tre sistemi attivi solo per i loro use case originali (drag di vertex, drag di altri children).

Costo: maggiore. È un refactor di scala che richiede una sessione dedicata. Probabilmente non da affrontare prima del 3.0.0.

## Quando riprendere questo documento

Tre triggers naturali:

1. **Un nuovo sintomo di rendering del pan classic editor** che non si risolve con il pattern "sync DOM override". È il segnale che la composizione attuale ha esaurito la sua gestibilità ad-hoc.
2. **Un refactor del `Measurable`** che cambia l'ordine della event chain `[defaultevt, jquievt, propsevent]`. Il pattern attuale dipende silenziosamente da quell'ordine.
3. **Un performance regression**: se R-PanArch perdesse il vantaggio di stutter-free ottenuto rispetto al pre-fix, vale la pena ripensare invece di patchare.

In assenza di questi triggers, il sistema attuale funziona e i 5 fix sono coerenti tra loro. Non è da rifare se non è rotto.

## Riferimenti

- Sessione che ha generato questo documento: `sessione_2026-05-07.md`
- Commit di base: `5522f37dd` (R-PanArchitecture, 6 maggio 2026)
- Prompt eseguiti il 7 maggio:
  - `2026-05-07_HHMM_pan_double_translation_fix.md`
  - `2026-05-07_HHMM_pan_childmode_override.md`
  - `2026-05-07_HHMM_pan_handle_sync_override.md`
  - `2026-05-07_HHMM_pan_double_raf_clear.md`
  - `2026-05-07_HHMM_pan_preserve_transform.md`
- File toccato: `frontend/src/components/forEndUser/Measurable.tsx`
- Riferimenti di linea (al momento di questo documento, possono shiftare con futuri commit):
  - `Measurable.tsx:182` — `MeasurableComponent.childmode`
  - `Measurable.tsx:222` — childmode scrive `child.style.left/top`
  - `Measurable.tsx:226-230` — childmode cleanup `setTimeout(_, 1)`
  - `Measurable.tsx:299-309` — event chain `[defaultevt, jquievt, propsevent]`
  - `Measurable.tsx:441-467` — `getCoords()` ritorna `oldPos`
  - `Measurable.tsx:518-559` — `whileDragging` di R-PanArch
  - `Measurable.tsx:613-621` — rAF clear in `onDragEnd`
  - `Measurable.scss:25-28` — base CSS rule `.panning-content { transform: translate(var(--offset-x), var(--offset-y)) }`
  - `App.scss:302-307` — `.draggable-child-mode` (sul handle, non su content)
  - `graphElement.tsx:1203-1204` — scrittura React-rendered di `--offset-x/y`
