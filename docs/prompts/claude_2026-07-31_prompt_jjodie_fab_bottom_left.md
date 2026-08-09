# Prompt Claude Code: FAB Jjodie in basso a sinistra, dentro il canvas

**Nome del documento prompt**: 2026-08-01 01:06
**Tipo**: fix(jodie), one-shot con mini-discovery
**Effort**: high (task fuori critical zone, CLAUDE.md §0)
**Riferimento riga numeri**: HEAD `07cee5219`. Se il working tree differisce nei punti citati, STOP e segnala prima di editare.

---

## COSA

Il floating button minimizzato di Jjodie (`.jodie-minimized`, icona `bi bi-robot`, visibile quando la chat è chiusa) oggi sta in basso a destra. Va spostato in basso a **sinistra**, restando dentro l'area contenuto:

- nelle tab editor (canvas, rail sinistro smontato): 30px dal bordo sinistro del viewport;
- nelle viste con rail sinistro montato (dashboard, project summary): a destra del rail, cioè 240px + 30px dal bordo.

La coordinata verticale resta invariata (`bottom: 100px`). La finestra Jodie NON cambia: continua ad aprirsi con la geometria attuale (default a destra, draggabile). Si sposta solo l'icona.

## DOVE

Un solo file da modificare:

- `frontend/src/components/Jodie/JodieWindow.css` (blocco `.jodie-minimized` a ~riga 871, override notification a ~riga 908)

Nessun altro file. Niente `git add .`, solo il path esplicito.

## COME

### Fase 0: setup

Leggi `CLAUDE.md` (blocco NON-NEGOTIABLE RULES) e le ultime 5-10 entry di `docs/claude-code-log.md`.

### Fase 1: mini-discovery read-only

Verifiche da eseguire e riportare:

1. `grep -rn "jodie-minimized" frontend/src` → il posizionamento deve vivere solo in `JodieWindow.css` (blocco base ~871, override `body[data-notification-visible]` ~908; le regole a 892/897/903/912/1179 sono icona/hover/badge/dark e non toccano left/right/bottom). `JodieMinimized.tsx` deve renderizzare solo className, nessuno stile inline.
2. Larghezza attuale del rail: in `frontend/src/pages/dashboard.scss` la regola `.leftbar` (~804-807) deve dire `width: 240px` ("Fixed width 240px as per design"). Se il valore reale è diverso, usa quello nel calc della Fase 2b.
3. Mount condizionale del rail: in `frontend/src/pages/components/Dashboard.tsx` (~riga 621) `{!hideLeftBar && <LeftBar ... />}`. Premessa del fix: quando il rail è nascosto, il nodo `.leftbar` NON è nel DOM. Se trovi un'implementazione a `display:none` invece che a smontaggio, STOP e segnala (il selettore `:has` scelto sotto non funzionerebbe).
4. `:has()` è già in uso nel codebase (es. `frontend/src/components/editors/views/nestedView.scss:97`): pattern ammesso, nessuna nuova dipendenza.
5. Conferma che il blocco CSS a ~871 corrisponda testualmente al FROM della Fase 2a (working tree può differire da quanto pushato).

**Report OBBLIGATORIO**: salva la discovery in `docs/discovery/discovery_<data-corrente-YYYY-MM-DD>_jjodie_fab_bottom_left.md` (sintetico: obiettivo, file letti, esito delle 5 verifiche, rischi). L'implementazione non parte finché il report non è scritto. Trattandosi di verifiche puntuali su file noti, non serve hard stop tra Fase 1 e Fase 2 se tutte e 5 le verifiche passano; se anche una sola fallisce, STOP e report ad Alfonso.

### Fase 2: edit (str_replace puntuali)

**2a. Ancoraggio a sinistra.** Nel blocco `.jodie-minimized` (~871):

FROM:
```css
    bottom: 100px;  /* Positioned above footer */
    /* F3: sit left of the floating overlay (var published on <body>; 0px fallback
       keeps the historic 30px when the overlay is hidden or absent). */
    right: calc(var(--jj-canvas-right-inset, 0px) + 30px);
```

TO:
```css
    bottom: 100px;  /* Positioned above footer */
    /* Anchored bottom-left inside the canvas area. In editor tabs the left rail
       is unmounted, so 30px clears the canvas edge; when the rail is in the DOM,
       the body:has(.leftbar) rule below offsets past its fixed width. */
    left: 30px;
```

Nota: `--jj-canvas-right-inset` resta in uso da altri consumer (es. MiniMap in `EditorV2.tsx:3853`): non toccare la variabile né i suoi writer (`PropertiesWithTreeView.tsx`), sparisce solo da questo blocco.

**2b. Offset quando il rail è montato.** Subito dopo il blocco `.jodie-minimized:hover i` (~903-905), aggiungi:

```css
/* Views with the left rail mounted (dashboard, project summary): keep the FAB
   inside the content area, to the right of the fixed-width rail. Under 768px
   the rail slides off-canvas (dashboard.scss: left -240px) while staying in the
   DOM, so the offset applies only where the rail is actually visible. */
@media (min-width: 769px) {
    body:has(.leftbar) .jodie-minimized {
        left: calc(240px + 30px);
    }
}
```

(240px = larghezza rail verificata in Fase 1.2; se diversa, usa il valore reale. Il breakpoint 768px replica quello di `dashboard.scss` ~349/382.)

**2c. Rimozione AUTORIZZATA dell'override notification.** Elimina il blocco (~907-910):

```css
/* Stack FAB above notification when visible */
body[data-notification-visible="true"] .jodie-minimized {
    bottom: 280px;  /* Move above notification widget (~200px height + gap) */
}
```

Motivo: il NotificationWidget è fixed in basso a destra (`bottom: 60px; right: 24px` in `notification-widget.scss`); col FAB a sinistra non c'è più sovrapposizione e la regola farebbe solo saltare il FAB verso l'alto senza motivo. La rimozione è richiesta esplicitamente da questo prompt (eccezione consapevole alla regola "non rimuovere codice"). Il meccanismo `data-notification-visible` altrove resta intatto: `NotificationWidget.tsx` non si tocca.

### Cosa NON toccare

- `JodieWindow` (geometria e posizione finestra invariate), `JodieMinimized.tsx`, `Jodie.tsx`
- `NotificationWidget` (componente e attributo body)
- `LeftBar.tsx`, `dashboard.scss`
- `frontend/src/components/JjodieWidget/` è un componente MORTO (zero import, ha un suo `.jjodie-fab` bottom-right): ignoralo, niente unificazioni o pulizie
- badge unread (`::after` con `top/right` relativi al bottone: restano corretti)
- `z-index: 10000` e la variante `[data-theme="dark"]` (~1179): invariati

### Fase 3: verifica e chiusura

1. `npm run build` deve passare; `npm run typecheck` non deve peggiorare il baseline.
2. **Hard stop**: mostra il diff completo e attendi approvazione prima del commit.
3. Commit: `fix(jodie): move minimized FAB to bottom-left inside canvas`, con `git add frontend/src/components/Jodie/JodieWindow.css` (più il discovery report con `git add docs/discovery/<file>` se si committano insieme, in un commit `docs:` separato se preferito).
4. Entry in `docs/claude-code-log.md` col formato standard (Regressions / Out-of-scope / Layer Impact Report: not-required).

### Checklist verifica visiva (per Alfonso, localhost:3000, hard refresh)

- Tab editor (canvas): FAB in basso a sinistra, ~30px dal bordo, dentro il canvas; nessuna collisione col contenuto in basso a sinistra (gli zoom controls sono in toolbar, la MiniMap resta a destra).
- Project summary / dashboard: FAB a destra del rail, mai sopra il rail.
- Click sul FAB: la finestra Jodie si apre come oggi (a destra); riducendola, il FAB ricompare a sinistra.
- Toast e NotificationWidget in basso a destra: non più coperti, e il FAB non si muove quando compaiono.
- Badge unread rosso visibile sull'angolo del FAB.

## RIFERIMENTI

- CLAUDE.md: NON-NEGOTIABLE RULES (scope, no rename, hard stop pre-commit, `git add` esplicito)
- Regola discovery report: `docs/discovery/discovery_<data>_<descrizione>.md`, obbligatorio anche per discovery brevi
- F3 viewport insets (fase floating panels): `--jj-canvas-right-inset` pubblicata su `<body>` da `PropertiesWithTreeView.tsx:355`, consumer residui da preservare
- Lezione C9 (fase floating): mai `pointer-events: none` sul wrapper `.jodie-root`
