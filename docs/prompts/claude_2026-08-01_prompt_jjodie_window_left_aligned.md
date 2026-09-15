# Prompt Claude Code: finestra Jjodie allineata a sinistra (default e fullscreen)

**Nome del documento prompt**: 2026-08-01 14:05
**Tipo**: fix(jodie), two-phase con discovery read-only
**Effort**: high (fuori critical zone, CLAUDE.md §0)
**Sostituisce**: `2026-08-01_prompt_jjodie_window_default_bottom_left.md` (mai eseguito). Quel prompt allineava il margine inferiore a 100px sulla base del FAB: valore sbagliato, il default reale usa `JODIE_DEFAULT_MARGIN = 20`. Usare solo questo documento.
**Riferimento**: HEAD locale del branch `alfonso-frontend-jjtl`, che include `fix(jodie): move minimized FAB to bottom-left inside canvas` non ancora pushato. I valori citati vengono da origin `07cee5219`: se il working tree differisce, riportalo nel discovery report invece di assumere.

---

## COSA

La finestra di chat di Jjodie va ancorata al lato sinistro, sia da finestra flottante sia da massimizzata.

**Stato attuale** (da `JodieWindow.tsx` a origin):

```ts
const JODIE_DEFAULT_WIDTH = 760;
const JODIE_DEFAULT_HEIGHT = 520;
const JODIE_DEFAULT_MARGIN = 20;

const computeDefaultPosition = (size: Size = DEFAULT_SIZE): Position => ({
    x: Math.max(0, window.innerWidth - size.width - JODIE_DEFAULT_MARGIN),
    y: Math.max(0, window.innerHeight - size.height - JODIE_DEFAULT_MARGIN),
});
```

e in ingresso fullscreen:

```ts
const fsSize: Size = { width: JODIE_DEFAULT_WIDTH, height: window.innerHeight };
const fsPosition: Position = { x: Math.max(0, window.innerWidth - fsSize.width), y: 0 };
```

Entrambe le formule ancorano a destra, area ormai congestionata (floating panel Properties/TreeView, MiniMap, NotificationWidget, toast).

**Stato richiesto**:

1. **Default flottante**: x = bordo sinistro dell'area contenuto + 8px. Il gap di 8px è il passo base della griglia del design system, ed è il "padding minimale" richiesto: la finestra deve leggersi come attaccata al bordo, non centrata.
2. **Espansione** (icona `bi bi-arrows-fullscreen` in `JodieHeader.tsx`, handler `onToggleFullscreen` → `enterFullscreen`): flush a sinistra, x = bordo sinistro dell'area contenuto, gap zero. Il bordo sinistro resta fermo e la finestra cresce verso destra, non salta all'altro lato dello schermo come fa oggi. Espansa la finestra è un pannello agganciato, non flottante: il gap sparisce, esattamente come oggi è flush a destra. Larghezza (760) e altezza (viewport) restano quelle attuali.
   Stesso discorso per il bottone **Reset position** (`bi bi-arrow-counterclockwise`, handler `onResetPosition`): passa da `computeDefaultPosition`, quindi eredita il nuovo default senza modifiche proprie. Va verificato, non riscritto.
3. **Bordo sinistro dell'area contenuto** significa 0 nelle tab editor (rail smontato) e la larghezza del rail dove il rail è montato (dashboard, project summary). La finestra non deve mai coprire il rail.
4. **Margine verticale invariato**: `JODIE_DEFAULT_MARGIN = 20` per il default flottante, `y = 0` in fullscreen. Non allineare il fondo della finestra ai 100px del FAB: quello è un offset pensato per un bottone circolare sopra il footer, applicarlo a un pannello da 520px lo alzerebbe senza motivo.
5. **Nessuna nuova impostazione**: la posizione è già personalizzabile e persistente (`config.position || computeDefaultPosition(...)`, salvataggio in `JodieConfig.current.position` a fine drag). Si cambia solo il valore di partenza; chi trascina continua a ritrovare la finestra dove l'ha lasciata.

## DOVE

- `frontend/src/components/Jodie/JodieWindow.tsx` (costanti, `computeDefaultPosition`, handler di ingresso fullscreen)
- `frontend/src/components/Jodie/JodieWindow.css` (solo il blocco `.jodie-window--fullscreen`, per invertire il lato di bordo e ombra)
- lettura sola: il modulo che definisce `JodieConfig` (path da individuare in Fase 1)

Niente `git add .`, solo i path espliciti.

## COME

### Fase 0: setup

Leggi `CLAUDE.md` (blocco NON-NEGOTIABLE RULES) e le ultime 5-10 entry di `docs/claude-code-log.md`.

### Fase 1: discovery read-only

1. `grep -rn "computeDefaultPosition\|JODIE_DEFAULT_MARGIN\|JODIE_DEFAULT_WIDTH" frontend/src` → riporta corpo esatto della funzione, valori delle costanti e tutti i call site. Un call site atteso è `resetPosition` (bottone `bi bi-arrow-counterclockwise` in `JodieHeader.tsx`): conferma che ricalcoli la posizione tramite `computeDefaultPosition` invece di avere una formula propria. Se ha una formula propria del tipo `innerWidth - width - margin`, allineala allo stesso helper della Fase 2b. Se compaiono altri call site inattesi, segnalali: cambia lo scope.
2. Riporta verbatim gli handler di ingresso e uscita fullscreen (`savedGeometry`, `fsSize`, `fsPosition`). Verifica se esiste un listener che ricalcola la geometria fullscreen al resize del viewport: se c'è, va aggiornato anche quello, altrimenti dopo un resize la finestra tornerebbe ancorata a destra.
3. Individua il modulo `JodieConfig` e rispondi a una domanda precisa: **la posizione viene scritta in storage anche senza drag** (per esempio da un `save()` al primo mount o da un default serializzato)? Se sì, **hard stop e report ad Alfonso**: servirebbe una migrazione one-time della config, decisione architetturale che non si prende qui. Se la scrittura avviene solo a fine drag/resize, si procede.
4. Esiste un effetto che ri-clampa la finestra dentro il viewport al resize? Se sì, verifica che non contenga una formula del tipo `innerWidth - width - margin` che la riporterebbe a destra. Riporta il codice.
5. Rail sinistro: conferma larghezza (`frontend/src/pages/dashboard.scss`, regola `.leftbar` ~804-807, attesa `width: 240px`) e mount condizionale (`frontend/src/pages/components/Dashboard.tsx` ~621, `{!hideLeftBar && <LeftBar ... />}`). Qui la geometria è in JS: il `body:has(.leftbar)` usato per il FAB non è applicabile, serve una misura a runtime. Conferma che `.leftbar` sia il selettore corretto e che il nodo viva nello stesso document.
6. Riporta verbatim il blocco `.jodie-window--fullscreen` in `JodieWindow.css` (atteso `border-right: none` e `box-shadow: -8px 0 24px rgba(0, 0, 0, 0.12)`) e conferma che nessun'altra regola imponga un ancoraggio a destra.
7. Prima di introdurre il nuovo identificatore della Fase 2a, `grep -rn` per verificare che il nome non sia già in uso nel codebase.

**Report OBBLIGATORIO**: salva la discovery in `docs/discovery/discovery_<data-corrente-YYYY-MM-DD>_jjodie_window_left_aligned.md` (obiettivo, file letti con path completi, esito delle 7 verifiche, rischi, domande aperte). L'implementazione non parte finché il report non è scritto.

**Hard stop dopo la Fase 1** se: la 3 mostra persistenza automatica, la 1 trova call site inattesi, la 2 o la 4 trovano un ricalcolo che ancora a destra. Negli altri casi si prosegue senza attendere.

### Fase 2: implementazione

**2a. Costante del gap.** Accanto a `JODIE_DEFAULT_MARGIN`, aggiungi una costante per il gap orizzontale sinistro (valore 8), con un commento di una riga che spieghi che è il passo base della griglia e che in fullscreen il gap è zero. Nome da verificare libero in Fase 1.7. `JODIE_DEFAULT_MARGIN` resta e continua a governare il margine verticale: non rimuoverla, non cambiarne il valore.

**2b. Helper per l'inset sinistro.** Funzione locale che misura il rail a runtime:

- `document.querySelector('.leftbar')?.getBoundingClientRect().right ?? 0`
- normalizzare con `Math.max(0, ...)`: sotto i 769px il rail esce dal viewport restando nel DOM (`dashboard.scss`, `left: -240px`) e il suo `right` risulta negativo o nullo, quindi l'inset torna correttamente a 0.

**2c. `computeDefaultPosition`.** Nuova formula:

- `x = Math.max(0, Math.min(leftInset + GAP, window.innerWidth - size.width - GAP))`. Il `min` è il clamp per viewport stretti: la finestra è larga 760, sotto una certa soglia sborderebbe a destra. Se non ci sta comunque, `max(0, ...)` la incolla al bordo.
- `y` invariato: `Math.max(0, window.innerHeight - size.height - JODIE_DEFAULT_MARGIN)`.

**2d. Ingresso fullscreen.** `fsPosition` diventa `{ x: Math.max(0, Math.min(leftInset, window.innerWidth - fsSize.width)), y: 0 }`, con lo stesso helper della 2b e gap zero. `fsSize` invariato. L'uscita da fullscreen (`savedGeometry`) non si tocca.

**2e. CSS fullscreen.** Nel blocco `.jodie-window--fullscreen`, due sole sostituzioni puntuali:

FROM:
```css
    border-right: none;
    box-shadow: -8px 0 24px rgba(0, 0, 0, 0.12);
```

TO:
```css
    border-left: none;
    box-shadow: 8px 0 24px rgba(0, 0, 0, 0.12);
```

`border-radius: 0` e le regole figlie (`.jodie-header`, `.jodie-input-container`) restano invariate.

### Cosa NON toccare

- Logica di drag e resize, animazioni (`.jodie-window--animating`), transizioni
- Blocco base `.jodie-window` e regole del FAB `.jodie-minimized` (il FAB resta ai suoi 30/100px: eventuale riallineamento è un task separato)
- Schema di `JodieConfig`, chiavi di storage, meccanismo di `save()`
- `JodieMinimized.tsx`, `Jodie.tsx`, `NotificationWidget`
- `LeftBar.tsx`, `dashboard.scss`
- `frontend/src/components/JjodieWidget/`: componente morto, ignoralo
- `--jj-canvas-right-inset` e i suoi consumer residui (MiniMap)

### Fase 3: verifica e chiusura

1. `npm run build` deve passare; `npm run typecheck` non deve peggiorare il baseline.
2. **Hard stop**: mostra il diff completo e attendi approvazione prima del commit.
3. Commit: `fix(jodie): left-align chat window in both floating and fullscreen mode`, con `git add frontend/src/components/Jodie/JodieWindow.tsx frontend/src/components/Jodie/JodieWindow.css`. Discovery report in un commit `docs:` separato.
4. Entry in `docs/claude-code-log.md` col formato standard (Regressions / Out-of-scope / Layer Impact Report: not-required).

### Checklist verifica visiva (per Alfonso, localhost:3001, hard refresh)

Prima del test, svuotare la posizione salvata: rimuovere la chiave di `JodieConfig` individuata in Fase 1.3, oppure usare una finestra in incognito. Senza questo passaggio il nuovo default non si vede.

- Tab editor: la chat si apre a sinistra con 8px dal bordo, senza toccare Properties/TreeView a destra.
- Click sull'icona expand da tab editor: il bordo sinistro non si muove, la finestra cresce verso destra e in altezza. Pannello flush a sinistra, altezza piena, ombra proiettata verso destra, nessun bordo visibile sul lato sinistro.
- Espandi partendo da una finestra trascinata a destra: la finestra si sposta a sinistra e si aggancia lì (il left-align vince sulla posizione precedente).
- Dashboard e project summary: apertura, espansione e reset partono tutti dal bordo destro del rail, mai sopra il rail.
- Esci dall'espansione: la finestra torna esattamente alla geometria che aveva prima.
- Bottone Reset position: riporta la finestra al nuovo default a sinistra, non in basso a destra.
- Trascinamento: sposto la finestra, la chiudo, la riapro. Deve tornare dove l'ho lasciata.
- Viewport stretto (browser ~900px, poi ~700px): la finestra resta interamente visibile, non sborda a destra.
- Toast e NotificationWidget in basso a destra: visibili anche con la chat aperta.

## RIFERIMENTI

- CLAUDE.md: NON-NEGOTIABLE RULES (scope, no rename, hard stop pre-commit, `git add` esplicito)
- Regola discovery report: `docs/discovery/discovery_<data>_<descrizione>.md`, obbligatorio anche per discovery brevi
- Task correlato: `2026-07-31_prompt_jjodie_fab_bottom_left.md` (FAB già in basso a sinistra, offset 30/100, regola `body:has(.leftbar)` per il rail)
