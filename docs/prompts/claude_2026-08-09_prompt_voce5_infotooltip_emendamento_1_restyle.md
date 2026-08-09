# Emendamento 1 al prompt voce 5 InfoTooltip: grafica scura del tooltip (commit 2)

**Nome del documento prompt**: 2026-08-09 16:32
**Emenda**: `claude/2026-08-09_prompt_voce5_infotooltip_ui.md` ("2026-08-09 15:59"), che resta valido integralmente per Fase 0 e Fase 1 (commit 1).
**Tipo**: feat (restyle della primitiva, API estesa)
**Branch**: `alfonso-frontend-jjtl`
**Vincolo generale**: CLAUDE.md è la fonte di verità; se questo emendamento lo contraddice, segnalare il conflitto e fermarsi.

## Contesto

Ratifica di Alfonso (2026-08-09 pomeriggio, etichetta **D-5-2**): la primitiva `InfoTooltip` adotta la grafica del cruscotto di tracciabilità (pannello slate scuro, caret verso l'ancora, ombra morbida) e l'API si estende con un **titolo opzionale** (`title?: string`), oggi non esercitato da nessun sito. Il badge di stato del cruscotto ("coperto") è **escluso**: è semantica di copertura R→D→I→P→C, non della primitiva.

Il commit 1 (estrazione byte-identica, D-5-1) resta invariato: prima si dimostra l'identità col md5, poi la grafica cambia una volta sola, nella sede nuova. Due commit bisecabili: se qualcosa si rompe, si sa in quale passo.

## Prerequisito e sequenza

1. **Commit 1 a HEAD**, eseguito secondo il prompt base (Fase 0 con report più Fase 1). Se il commit 1 risulta già eseguito prima della lettura di questo emendamento, partire da HEAD con verifica delta: la primitiva esiste in `components/ui/InfoTooltip/`, i 4 siti importano, md5 confermati nell'esito.
2. **Hard stop dopo il commit 1**: smoke di identità di Alfonso (4 hover, resa identica a prima). Si procede al commit 2 solo al suo GO.
3. **Commit 2**: questo emendamento.

## COSA (commit 2)

1. Estendere l'API della primitiva: `{ text: string; title?: string }`. Senza `title` la resa è il solo body; con `title` compare la riga in grassetto sopra il body. I 4 siti consumatori restano invariati (nessuno passa `title` oggi).
2. Applicare la grafica nuova (spec sotto), con stili colocati con la primitiva.
3. Ritirare le vecchie regole `jj-info-*` dalla sede globale, alle condizioni del censimento.
4. Riga **D-5-2** in `docs/decisions.md`; entry in `docs/claude-code-log.md`.
5. Un solo commit, scope chiuso, **niente push**.

## DOVE (scope chiuso, commit 2)

- `frontend/src/components/ui/InfoTooltip/InfoTooltip.tsx`
- `frontend/src/components/ui/InfoTooltip/InfoTooltip.scss` (nuovo)
- la sede globale attuale delle regole `jj-info-*` (path esatto dal censimento di Fase 0 del prompt base; in quel file, solo rimozione delle regole ritirate, nessun'altra riga)
- `docs/decisions.md`
- `docs/claude-code-log.md`
- `docs/discovery/discovery_2026-08-09_infotooltip_ui_consolidation.md` (addendum, vedi Fase 0-bis)

I 4 siti consumatori **non** si toccano nel commit 2. Qualsiasi altro file: fermarsi e chiedere prima.

## COME

### Fase 0-bis: estensione read-only del censimento (prima di scrivere codice)

Da appendere al report di discovery esistente come sezione "Addendum emendamento 1":

1. **Sede e riferimenti delle regole `jj-info-*`**: path esatto del file che le definisce; grep completo (`.scss`, `.css`, `.tsx`) per verificare che nessun altro selettore o file le referenzi: niente override per pannello, niente selettori discendenti esterni. Se esistono riferimenti esterni: **HARD STOP** con report.
2. **Clipping e stacking**: per ciascuno dei 4 siti, verificare gli antenati del tooltip per `overflow: hidden|auto|scroll` e per stacking context (z-index). Riportare per sito: clippa / non clippa un pannello posizionato sopra l'icona. Se almeno un sito clippa: **HARD STOP** con report; la soluzione (portal, riposizionamento) si decide in chat, non in autonomia.
3. **Token disponibili**: verificare in `src/styles/tokens/` (canone per DS-6) l'esistenza di token per slate `#334155`, radius, ombra, font-size 12px. Usare i token dove esistono, hex con commento altrimenti. Non creare token nuovi.
4. Aggiornare il report; se tutto verde, procedere senza fermarsi.

### Implementazione (commit 2)

1. **`InfoTooltip.tsx`**: props `{ text: string; title?: string }`. Struttura: wrapper invariato (`jj-info-icon-wrapper`), icona invariata (`jj-info-icon`), pannello `jj-info-tooltip` con `role="tooltip"` contenente la riga titolo (`jj-info-tooltip-title`, renderizzata solo se `title` è presente) e il body (`jj-info-tooltip-text`). I due nomi di classe nuovi vanno verificati liberi con grep globale prima dell'uso. Comportamento invariato: hover con `useState` su mouseenter/leave. Niente librerie nuove, niente portal, niente animazioni.
2. **`InfoTooltip.scss`** (importato dal componente):
   - `.jj-info-icon-wrapper`: regole attuali riportate senza modifiche di resa, più `position: relative` se serve all'ancoraggio del pannello.
   - `.jj-info-icon`: regole attuali riportate senza modifiche di resa (il restyle riguarda il pannello, non l'icona).
   - `.jj-info-tooltip`: `position: absolute; bottom: calc(100% + 8px); right: -8px` (il pannello si estende verso sinistra, come nello screenshot di riferimento); background `#334155` (o token), color `#cbd5e1`, font-size 12px (o token), line-height 1.45, padding 12px 14px, border-radius 10px, box-shadow `0 4px 12px rgba(15, 23, 42, 0.25)`, max-width 340px, width max-content, white-space normal, text-align left, z-index coerente con il censimento del punto 2 di Fase 0-bis.
   - caret: `::after` sul pannello, quadrato 8px dello stesso background, `transform: rotate(45deg)`, posizionato in basso a destra (`right: 12px; bottom: -4px`), che punta all'icona.
   - `.jj-info-tooltip-title`: color `#f1f5f9`, font-weight 600, margin-bottom 4px.
   - `.jj-info-tooltip-text`: nessuna regola propria oltre l'ereditato, salvo necessità emerse dal censimento (annotarle).
   - niente transizioni o animazioni; nessuna modifica di layout del contenuto circostante (il pannello è absolute, zero reflow).
3. **Ritiro regole vecchie**: rimuovere dalla sede globale le sole regole `jj-info-*`, confermate senza riferimenti esterni al punto 1 di Fase 0-bis. Nessun'altra riga di quel file va toccata.
4. **`docs/decisions.md`**, nuova riga: **D-5-2 (2026-08-09)**: InfoTooltip adotta la grafica del cruscotto di tracciabilità (pannello slate `#334155`, testo chiaro, caret, ombra, 12px; ancorato a destra dell'icona, si estende a sinistra); API estesa con `title?` opzionale, non esercitata dai siti attuali; badge di stato escluso (semantica del cruscotto); stili colocati in `ui/InfoTooltip/InfoTooltip.scss`, regole globali `jj-info-*` ritirate; niente animazioni, niente portal.
5. **Gate**: `npm run build` 0 errori; `tsc` baseline 33, delta zero; vitest tutto verde, totale invariato; `npm run check:docs` 2/2 PASS coi due warning noti.
6. **Log**: entry standard in `docs/claude-code-log.md`, con **Nome del documento prompt**: `2026-08-09 16:32`. Rotazione oltre le 20 entry.
7. **Commit unico**, `git add` dei soli file elencati in DOVE (mai `git add .`). Messaggio: `feat(ui): dark panel styling and optional title for InfoTooltip`. **Niente push**.

### Dopo il commit 2

Riportare in chat: esiti dei gate, verdetto clipping per sito, path della sede globale ripulita, token usati contro hex. Checklist smoke per Alfonso (http://localhost:3000/, hard refresh):

1. Gli stessi 4 hover del prompt base, con attesa nuova: pannello scuro slate, testo chiaro, caret sull'icona, nessun taglio ai bordi del pannello contenitore, nessuno spostamento di layout all'apertura.
2. Un hover su un'icona vicina al bordo sinistro del pannello, se esiste: il pannello non deve uscire a sinistra in modo illeggibile. Se accade, riportarlo come finding, senza fixare in autonomia.

## RIFERIMENTI

- Prompt base: `claude/2026-08-09_prompt_voce5_infotooltip_ui.md` ("2026-08-09 15:59"), ratifica D-5-1 (sede `components/ui/InfoTooltip/`, 4 siti, resa identica al commit 1).
- Screenshot di riferimento: tooltip del cruscotto di tracciabilità (chat "Cruscotto della situazione"): pannello scuro, titolo semibold chiaro, body grigio-azzurro, caret in basso a destra sopra l'ancora.
- Design system: slate `#334155` base, cyan `#0ea5e9` come accento di stato (qui non usato: il badge è escluso); `tokens/` canone (DS-6); attenzione ARIA (DS-7), qui `role="tooltip"`.
- Vetrina: l'ingresso di InfoTooltip in vetrina resta rinviato al punto 4 della sequenza DS (invariato da D-5-1).
