# GO finale TS2: chiusura con sez. 12 alla spec e log

**Data**: 2026-08-25 17:45
**Riferimento**: prompt `_1625_`; commit `4962a303a`
**Verifica R1-R6**: fatta dalla chat con il Chrome di Alfonso su `http://localhost:3000/`, progetto «State Machine v1», Class Diagram, view «Class» (compartimento `attributes` con source `children`, righe rese dalla row view «Attribute»). Le scritture di R2-R4 sono passate dall'L-proxy (`view.ir = ...`), lo stesso write path del pannello; R1 e R5 dal pannello e dal menu File.

## 1. Esito

| Prova | Esito | Misura |
|---|---|---|
| R1 | passa | Rail, tab Structure, "Row style" del compartimento: Size 11 + Color `#b91c1c`. Inline sul `.ir-compartment` (`font-size: 11px; color`), righe a 11px rosse, intestazione ferma a 13px e al suo colore, Ruolo content-hug da 88 a 83px di altezza |
| R2 | passa | `shape.text.fontSize = 16` con `rowFormat.style.fontSize = 11`: righe a 11. Rimosso lo stile di riga: righe a 16, Ruolo 148x97 |
| R3 | passa | Compartimento host Color rosso + row view «Attribute» `{fontWeight: bold}`: righe grassetto rosse; aggiunto `color: #1d4ed8` alla row view: righe blu (row view > compartimento), il compartimento resta rosso in computed style, la taglia 16 del nodo continua a scendere |
| R4 | passa | Row view con `color` condizionale `eq($name.value, "id") then #1d4ed8`: le righe `id` blu, le altre rosse dal compartimento. Slot `name` dell'attributo `id` di Person portato a `key`: la riga diventa `key:Integer` e rossa subito; ripristinato, torna blu. La firma a snapshot degli slot copre l'asse, come da report di Fase 1 |
| R5 | passa | File > Save Project, reload: `rowFormat.style` e `RowViewIR.style` (condizionale incluso) persistono e rendono; nessun `undefined` né `{}` nell'IR |
| R6 | non esercitata | Nessuna fixture con segmenti `value` editabili sui progetti a disposizione; la regola `.ir-row__input` di `d59cb06c9` non e' toccata da TS2 (nessuna riga CSS nel commit), quindi resta valida per costruzione. Da rifare alla prima fixture con valori |

Il compartimento della fixture e' `children`: R1-R4 esercitano quindi lo scostamento dichiarato (stile del compartimento come livello di cascata per le righe dispatch) e lo confermano; il percorso slot-mode (`attributes`/`references`) e' coperto dai test di compile e dall'ereditarieta' identica, non da una prova a schermo.

## 2. Da registrare nel log

- Lo scostamento da sez. 3.2 della spec e' confermato a schermo ed entra in sez. 12 come scritto nel prompt §5.
- La verifica di Fase 1 su `useIRRowView` ha risposta diversa da quella attesa e piu' larga: la firma e' uno snapshot di tutti gli slot propri piu' `crossDepsSignature`, non il `dependencySet`. Va scritto nella sez. 12 in una riga: «la reattivita' degli assi condizionali di stile poggia sullo snapshot degli slot in `useIRView`/`useIRRowView`, non sul `dependencySet`; una futura restrizione della firma al solo `dependencySet` resta corretta perche' il set si estende, ma va verificata». Il corollario e' gia' nel report di discovery.
- Ciclo di import `IRNodeContent -> IRRow -> IRNodeContent` per `resolveTextStyle`: innocuo (hoisting, chiamata a render), dichiarato. Se un domani da' noia, la funzione va in un modulo suo; non ora.
- Osservazione di sessione, non di TS2: con due mount del pannello vivi (rail + modal) e una scrittura esterna sullo stesso `view.ir`, il commit debounced del mount sporco vince sull'esterna (D15, last-writer-wins). Riprodotto una volta durante R2 scrivendo dall'L-proxy entro i 300 ms dall'ultimo tasto nel popover; non riproducibile dalla sola UI.
- Il progetto «State Machine v1» e' stato riportato allo stato di partenza (`shape.text = {fontFamily: "mono"}`, `padding: "large"`, nessuno stile di riga) e salvato.

## 3. Chiusura

Sez. 12 alla spec e entry di log come nel prompt `_1625_` §5, con l'hash `4962a303a` e le righe di §2. Commit `docs:` per pathspec, includendo questo GO in `docs/prompts/`. Attenzione al `docs/claude-code-log.md` modificato da un'altra sessione nel working tree: leggere la testa del file prima di scrivere la entry, mettere in staging solo le righe proprie se il diff altrui e' ancora li' (in caso di dubbio, hard stop e riportare). Nessun push.
