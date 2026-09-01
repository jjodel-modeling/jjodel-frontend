# PROMPT — Core: il seed della DReference rifiutata

Chiude il residuo dichiarato dal discovery DTypedElement (30-08, §4): quando lo switch rifiuta un tipo per una DReference (enum → reference, rifiuto semanticamente giusto e oggi **dichiarato** via `Log.ww`), il seed resta *il padre* — la reference punta al proprio contenitore. Valore sbagliato, oggi almeno rumoroso.

## Il punto

Separare i due casi che oggi condividono il seed:
- **`type === undefined`** (il parser Ecore, per contratto): seed invariato, muto — pinnato da test, NON toccarlo.
- **Rifiuto dichiarato** (`requested !== undefined` e lo switch dice no): il seed *il padre* va sostituito con un valore che dichiari l'assenza invece di inventare un bersaglio. Misura prima cosa il D-graph tollera come `type` assente su una DReference (null? pointer vuoto?) e cosa fanno i consumatori (`.type` letto da render, export, validazione) — il verdetto guida la scelta. Se nessun valore assente è tollerato senza fix a valle, fermati e riporta: la slice diventa un discovery.

## Vincoli

- I 12 test statici del 30-08 devono restare verdi (il contratto `undefined` è uno dei due invarianti).
- Censimento chiamanti aggiornato: chi riceve oggi *il padre* dal rifiuto, e cosa riceve dopo. Nessun chiamante deve dipendere dal valore sbagliato (il censimento del 30-08 dice che nessuno lo pinnava — riverifica su HEAD).
- `Log.ww` resta: il rifiuto continua a dichiararsi.

## Test attesi

- enum id/name/proxy → DReference: `.type` non è più il padre; il valore scelto è dichiarato e uniforme sulle tre forme.
- `undefined` → identico a prima, muto (controllo di non-regressione sui due percorsi parse Ecore).
- Round-trip export: una DReference col tipo assente non produce un `.ecore` che punta al contenitore.

## Coordinamento

Sessione parallela: 12b/12c (`editor-v2/`, `jjform/`) — zero file condivisi (`joiner/classes.ts` + test). Pathspec, entry di log in commit separato.
