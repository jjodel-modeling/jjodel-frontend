# Ratifiche 2026-08-01: allineamento a sinistra della finestra Jjodie

**Tema**: posizione della finestra di chat Jjodie (default, espansione, reset).
**Stato**: decisioni chiuse. Prompt Claude Code pronto (`2026-08-01_prompt_jjodie_window_left_aligned.md`), esecuzione e verifica visiva da fare.

## Decisioni ratificate

**R1. Nessun setting di posizione.** Scartata l'ipotesi di un'impostazione tipo notifiche. La posizione è già personalizzabile e già persistente: `config.position || computeDefaultPosition(...)`, salvataggio in `JodieConfig.current.position` a fine drag. Un setting dedicato duplicherebbe lo stesso stato in due posti, con precedenza da arbitrare. Si cambia solo il valore di partenza; il drag resta l'override utente.

**R2. Lato sinistro per tutti gli stati.** Default flottante, stato espanso e reset position vanno tutti ancorati a sinistra. Motivo: il lato destro ospita floating panel Properties/TreeView, MiniMap, NotificationWidget e toast; il FAB minimizzato sta già in basso a sinistra dal task del 31/07.

**R3. Gap asimmetrico, 8px flottante e 0 espansa.** 8px è il passo base della griglia del design system e realizza il "padding minimale" richiesto. Espansa la finestra è un pannello agganciato, e un dock sta flush contro il bordo: stessa logica per cui oggi è flush a destra.

**R4. Il bordo di riferimento è l'area contenuto, non il viewport.** Zero nelle tab editor (rail smontato), larghezza del rail dove il rail è montato (dashboard, project summary). Misura a runtime via `.leftbar`, non `body:has()`: qui la geometria vive in JS. Normalizzazione `Math.max(0, ...)` perché sotto i 769px il rail esce dal viewport restando nel DOM.

**R5. Margine verticale invariato.** `JODIE_DEFAULT_MARGIN = 20` per il flottante, `y = 0` da espansa. Scartata l'idea di allineare il fondo ai 100px del FAB: quell'offset serve a un bottone circolare sopra il footer, applicato a un pannello da 520px lo alzerebbe senza motivo.

**R6. L'espansione tiene fermo il bordo sinistro.** L'icona expand (`bi bi-arrows-fullscreen` → `enterFullscreen`) oggi fa `x = innerWidth - width`, cioè sposta la finestra sull'altro lato. Nuovo comportamento: la finestra cresce verso destra e in altezza, il bordo sinistro non si muove. Larghezza (760) e altezza (viewport) restano quelle attuali.

**R7. Il left-align vince sulla posizione trascinata, ma solo nell'espansione.** Espandendo una finestra trascinata a destra, la finestra si aggancia a sinistra. È l'unico caso in cui un'azione sposta qualcosa che l'utente aveva posizionato a mano; accettato perché coerente con "sempre allineata a sinistra". Da confermare alla verifica visiva.

## Correzioni rispetto alle versioni precedenti del prompt

- Il primo prompt (`2026-08-01_prompt_jjodie_window_default_bottom_left.md`, rimosso dal KB, mai eseguito) allineava il margine inferiore a 100px sulla base del FAB. Valore sbagliato: il default reale usa `JODIE_DEFAULT_MARGIN = 20`.
- Lo "stato fullscreen" non è un fullscreen: è un pannello agganciato di larghezza fissa `JODIE_DEFAULT_WIDTH = 760` e altezza viewport. L'allineamento richiede anche due proprietà CSS che dichiarano il lato di aggancio (`border-right: none` → `border-left: none`, ombra da `-8px` a `8px`).

## Punti aperti

- **Migrazione config**: se `JodieConfig` scrive la posizione anche senza drag, gli utenti esistenti restano inchiodati al vecchio default. Il prompt lo tratta come hard stop verso Alfonso, non come decisione di Claude Code.
- **Disallineamento FAB**: il FAB resta a 30px dal bordo, la finestra andrà a 8px. Elementi diversi, fuori scope; una riga di CSS in un task separato se visivamente disturba.
- **Larghezza da espansa**: resta fissa a 760 anche se la finestra era stata allargata a mano. Comportamento attuale, non toccato.

## Riferimenti

- Prompt: `claude/2026-08-01_prompt_jjodie_window_left_aligned.md`
- Task precedente correlato: `claude/2026-07-31_prompt_jjodie_fab_bottom_left.md` (FAB a sinistra, offset 30/100)
- File coinvolti: `frontend/src/components/Jodie/JodieWindow.tsx`, `frontend/src/components/Jodie/JodieWindow.css`
