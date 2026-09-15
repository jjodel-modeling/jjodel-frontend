# Sessione 2026-08-01_3: allineamento a sinistra della finestra Jjodie

Sessione breve e monotematica, aperta su una segnalazione UX: la finestra di Jjodie si apre a destra, in un'area ormai congestionata. Chiusa con decisioni ratificate e prompt Claude Code pronto.

## Stato a fine sessione

- **Task Jjodie window left-align chiuso lato design.** Sette decisioni ratificate in `claude/ratifiche_2026-08-01_jjodie_window_left_aligned.md`. Prompt pronto in `claude/2026-08-01_prompt_jjodie_window_left_aligned.md`, esecuzione e verifica visiva ancora da fare.
- **Push ancora pendente** (invariato dai due checkpoint precedenti): origin `alfonso-frontend-jjtl` fermo a `07cee5219`. In locale ci sono la serie A INSTANCES e il `fix(jodie)` del FAB. Primo comando prossima sessione: `git log origin/alfonso-frontend-jjtl..HEAD --oneline`, lettura esiti nel claude-code-log, push.
- Il resto del backlog è invariato rispetto a `sessione_2026-08-01_2.md`.

## Decisioni prese

Tutte relative alla posizione della finestra Jjodie, dettaglio completo nel file di ratifiche. In sintesi:

1. **Nessun setting di posizione.** La posizione è già personalizzabile e persistente (`config.position || computeDefaultPosition(...)`, salvataggio in `JodieConfig.current.position` a fine drag). Un setting dedicato duplicherebbe lo stesso stato con precedenza da arbitrare. Si cambia solo il default; il drag resta l'override utente.
2. **Lato sinistro per tutti gli stati**: default flottante, stato espanso, reset position. Il lato destro ospita floating panel, MiniMap, NotificationWidget e toast; il FAB minimizzato è già a sinistra dal 31/07.
3. **Gap asimmetrico**: 8px da flottante (passo base della griglia), 0 da espansa (è un dock, sta flush contro il bordo).
4. **Bordo di riferimento = area contenuto**, non viewport: 0 nelle tab editor, larghezza del rail dove il rail è montato. Misura a runtime su `.leftbar`, non `body:has()`, perché qui la geometria vive in JS.
5. **Margine verticale invariato** (`JODIE_DEFAULT_MARGIN = 20`, `y = 0` da espansa). Scartato l'allineamento ai 100px del FAB.
6. **L'espansione tiene fermo il bordo sinistro**: la finestra cresce verso destra e in altezza invece di saltare all'altro lato.
7. **Il left-align vince sulla posizione trascinata, ma solo nell'espansione.** Unico caso in cui un'azione sposta qualcosa posizionato a mano; da confermare alla verifica visiva.

## Bug risolti

Nessuno. Task di design, implementazione non ancora eseguita.

## Bug nuovi / Todo

- **Migrazione config Jjodie** (MEDIA, condizionale): se `JodieConfig` scrive la posizione anche senza drag, gli utenti esistenti restano inchiodati al vecchio default e serve una migrazione one-time. Il prompt lo tratta come hard stop verso Alfonso.
- **Disallineamento FAB / finestra** (BASSA): FAB a 30px dal bordo, finestra a 8px. Una riga di CSS in un task separato, solo se visivamente disturba.
- **Larghezza fissa da espansa** (BASSA): resta 760 anche se la finestra era stata allargata a mano. Comportamento attuale, non toccato.
- Todo precedenti invariati: push (ALTA), conferma esiti serie A + verifica post-C0 (MEDIA), rehydration viewpoint selector (MEDIA), `JjodieWidget` morto da bonificare (BASSA).

## Documenti aggiornati

- `claude/2026-08-01_prompt_jjodie_window_left_aligned.md` — NUOVO, prompt operativo.
- `claude/ratifiche_2026-08-01_jjodie_window_left_aligned.md` — NUOVO, decisioni chiuse.
- `claude/2026-08-01_prompt_jjodie_window_default_bottom_left.md` — RIMOSSO dal KB. Prima versione del prompt, mai eseguita, conteneva un valore sbagliato (margine inferiore a 100px sulla base del FAB, mentre il default reale usa 20). Rimosso per evitare due prompt in conflitto.

## Prompt generati per Claude Code

- `2026-08-01_prompt_jjodie_window_left_aligned.md` — **da eseguire**. Two-phase con discovery read-only obbligatoria (7 verifiche, report in `docs/discovery/`), poi implementazione su `JodieWindow.tsx` e `JodieWindow.css`. Hard stop se la discovery trova persistenza automatica della posizione o call site inattesi di `computeDefaultPosition`.

## Prompt pendenti

- Serie A INSTANCES (`2026-07-31_prompt_instances_serieA_C0_C1_C2.md`): eseguita per dichiarazione, esiti da confermare nel claude-code-log + verifica visiva post-C0.
- C3 (token `.leftbar--project`) e C4 (skin): attendono il mockup della vista INSTANCES.

## Prossimi passi

1. **Push** del branch (origin fermo a `07cee5219`).
2. Eseguire il prompt Jjodie window left-align e fare la verifica visiva con la checklist inclusa (svuotare prima la posizione salvata in `JodieConfig`, altrimenti il nuovo default non si vede).
3. Conferma esiti serie A nel claude-code-log; verifica post-C0 del toggle con tab M1 aperta.
4. Mockup INSTANCES → replica HTML → C3/C4.
5. Sessione roadmap: completare la sezione "Prossimo futuro" dell'artefatto storia.

## Info strutturali scoperte

Tutte verificate su origin `07cee5219` via lettura diretta dei sorgenti.

**`frontend/src/components/Jodie/JodieWindow.tsx`**

```ts
const JODIE_DEFAULT_WIDTH = 760;
const JODIE_DEFAULT_HEIGHT = 520;
const JODIE_DEFAULT_MARGIN = 20;
const DEFAULT_SIZE: Size = { width: JODIE_DEFAULT_WIDTH, height: JODIE_DEFAULT_HEIGHT };
const MIN_SIZE: Size = { width: 320, height: 400 };
const MAX_SIZE: Size = { width: 1200, height: 900 };

const computeDefaultPosition = (size: Size = DEFAULT_SIZE): Position => ({
    x: Math.max(0, window.innerWidth - size.width - JODIE_DEFAULT_MARGIN),
    y: Math.max(0, window.innerHeight - size.height - JODIE_DEFAULT_MARGIN),
});
```

- La geometria è **inline style** (`left: position.x, top: position.y, width, height`), calcolata in JS. Le classi CSS non ancorano nulla: `.jodie-window` è `position: fixed` senza `top/left/right/bottom`. Conseguenza pratica: gli offset dipendenti dal rail non si possono fare con `body:has(.leftbar)` come per il FAB, serve una misura a runtime.
- Persistenza: `config.position || computeDefaultPosition(initialSize)` all'init; `savePosition` scrive in `JodieConfig.current.position` e chiama `save()`, invocato a fine drag/resize. Resta da verificare in discovery se qualcosa scriva la posizione anche senza drag.
- **Lo stato "fullscreen" non è un fullscreen**: è un pannello agganciato di larghezza fissa `JODIE_DEFAULT_WIDTH` e altezza viewport, con `x = Math.max(0, window.innerWidth - fsSize.width)`, `y = 0`. La geometria pre-espansione è salvata in `savedGeometry` e ripristinata all'uscita.

**`frontend/src/components/Jodie/JodieWindow.css`**

- `.jodie-window--fullscreen` dichiara il lato di aggancio in due proprietà: `border-right: none` e `box-shadow: -8px 0 24px rgba(0, 0, 0, 0.12)`. Spostare il pannello a sinistra senza invertirle lascerebbe il bordo mancante dal lato sbagliato.
- `.jodie-window--animating` anima `width/height/left/top` (220ms, cubic-bezier); drag e resize manuali escludono deliberatamente queste transizioni.

**`frontend/src/components/Jodie/JodieHeader.tsx`** — bottoni dell'header, con handler:

| icona | azione | handler |
|---|---|---|
| `bi bi-eraser` | clear console/chat | `onClearCurrentMode` |
| `bi bi-arrow-counterclockwise` | reset position and size | `onResetPosition` |
| `bi bi-arrows-fullscreen` / `bi bi-fullscreen-exit` | espandi / esci | `onToggleFullscreen` |
| `bi bi-gear` | AI settings | `onOpenSettings` |
| `bi bi-x-lg` | chiudi | `onClose` |

L'"icona expand" citata in chat è `bi bi-arrows-fullscreen`, cioè il toggle di espansione. `onResetPosition` è un terzo call site che eredita `computeDefaultPosition`: va verificato, altrimenti riporterebbe la finestra in basso a destra vanificando il fix.

**Vincolo di metodo emerso**: il repo pubblico è fermo a `07cee5219` e il `fix(jodie)` del FAB non è pushato, quindi i numeri di riga letti online non sono affidabili sul working tree locale. Nei prompt conviene citare i blocchi verbatim come ancora, non le righe.

## Cronologia

Alfonso segnala che la finestra di Jjodie sta a destra, area congestionata, e offre due strade: un setting di posizione come per le notifiche, oppure il basso a sinistra. Lettura del codice invece che scelta a naso: la posizione risulta già persistente e già modificabile via drag, quindi il setting duplicherebbe stato esistente e la scelta cade sul cambio di default. Primo prompt generato, poi corretto: conteneva un margine inferiore a 100px preso dal FAB, mentre il default reale è 20. Alfonso raffina due volte la specifica, prima chiedendo l'allineamento a sinistra anche da massimizzata (che ha fatto emergere il finto fullscreen e le due proprietà CSS del lato di aggancio), poi l'espansione con bordo sinistro fisso (che ha fatto emergere il call site `onResetPosition`). Task chiuso con file di ratifiche; checkpoint su keyword.
