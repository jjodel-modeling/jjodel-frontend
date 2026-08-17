# Endpoint `container` — Fase 2, slice 2b: validateIR, authoring, guard R4, emendamenti spec

> **Nome del documento prompt**: 2026-08-17 19:05

Protocollo: docs/PROTOCOL.md — clausole P1..P10 applicabili.
Corsia: **completa** (critical zone `viewpoint/ir/`, `viewpoint/authoring/`). Nessun file della
lista §3.2 viene modificato: Layer Impact Report not-required; se emerge propagazione verso
sync o D-layer, STOP e segnala (Rule 20).

Leggi `CLAUDE.md` e `docs/decisions.md`. Branch: `alfonso-frontend-jjtl`.
Vincoli: **R-B13..R-B16**, R-B9, R-B9-bis. Memo:
`docs/ratifiche/claude_2026-08-17_memo_ratifica_edge_endpoint_container.md`. Base: slice 2a
committata (`65b979ede`) e **misura R-B16 passata** (2026-08-17, conferma visiva di Alfonso:
5 edge `irobj_` dopo scrittura IR da console, 0 nodi `Transition` visibili, re-parent da
console riagganciato senza reload).

## Contesto (non rifare l'analisi)

La 2a ha consegnato: `CONTAINER_ENDPOINT` in `irTypes.ts`, compile permissivo con flag
`sourceIsContainer`/`targetIsContainer`, `containerOf` + `walkedObjects` in `ContainmentModel`,
sintesi disaccoppiata dai vertici, test. Restano i quattro punti di coda dell'ordine R-B15,
tutti già decisi nel memo: la regola di validazione, la superficie di authoring, il guard del
reconnect, gli emendamenti spec. Il token oggi è scrivibile solo da console: nessuna UI lo
produce né lo mostra.

## COSA

1. **`viewpoint/ir/irValidate.ts`** — prima regola di validazione endpoint (R-B15, pattern
   R-B9-bis: la regola sta nell'authoring, il render resta permissivo). Per `edge.source` ed
   `edge.target`, se presenti: valido se `=== CONTAINER_ENDPOINT` oppure se è un PathExpr che
   compila e **non termina in `.values`**. La seconda metà chiude il gap misurato dalla
   discovery §Q4 (oggi `source: '$ref.values'` passa `validateIR` perché la regola vive solo
   nel pannello): allinea `validateIR` alla semantica di `isUsableEndpointExpr` senza toccare
   quest'ultima. Messaggi d'errore nello stile esistente (user-facing).
2. **`viewpoint/authoring/EdgeAuthoringPanel.tsx`** — opzione 2 ratificata: per ciascun
   endpoint (source e target, simmetrici) un `Select` a due voci, «Reference path» /
   «Containing element». Sulla seconda: il `PathBuilder` non monta, al suo posto una riga
   statica descrittiva, e `applyEndpoints` scrive `CONTAINER_ENDPOINT`. Inizializzazione della
   modalità dal valore persistito (`=== CONTAINER_ENDPOINT` → container). **`PathBuilder` non
   si tocca** (componente condiviso, R-B15) e non vede mai il token: il round-trip R5 muore
   qui per costruzione. Un `container` persistito non viene mai sanificato o azzerato dal
   seed del pannello (disciplina inversa di `dropInvalidRouting`, memo §Contratto).
3. **`EditorV2.tsx`, `handleReconnect`** (zona `:1861-1900` a `f6794dc81`; rileggi il file, i
   numeri possono essere slittati) — fix R4: oggi `if (!featName) return;` abortisce prima di
   `setIREdgeAnchorOverride`, quindi trascinare un capo `container` perde anche il pin di
   lato. Riordina il guard: la scrittura di modello resta esclusa per l'estremo senza feature
   (comportamento R-B16, corretto), ma l'override di ancora si applica comunque. Diff minima,
   solo dentro `handleReconnect`.
4. **`docs/spec/claude_spec_2026-07-18_ir_schema_v1_2.md`** — emendamenti ratificati (memo e
   discovery §Q6), rispettando le regole di scrittura di progetto:
   - **§7 Edge**: il tipo degli endpoint diventa `EndpointExpr = PathExpr | 'container'`, con
     la semantica del token (parent di contenimento dell'oggetto-edge, ammesso su source,
     target o entrambi: self-loop sul contenitore).
   - **§3 Primitive**: una riga che introduce `EndpointExpr` e rimanda a §7; `PathExpr` (§3.1
     della v1.1) resta intatta e il file v1.1 NON si tocca.
   - **§9 Dependency set**: clausola dedicata: il token non contribuisce al dependency set;
     l'invalidazione degli endpoint `container` passa dai canali del sync (hash per-vertice e
     `m1RefValuesSig`), misurata il 2026-08-17; vincolo R-B16 sulle ottimizzazioni future;
     la «dipendenza dal contenitore» esplicita è estensione futura.
   - **§6 Interaction**: la connect rule non è derivabile da un endpoint `container`; il
     gesto di connessione non copre la creazione di figli contenuti (dichiarato, non bug).
   - **§10 Fallback**: deroga dichiarata: oggetto-edge senza vertice con endpoint
     irrisolvibile resta invisibile in v1 (comportamento pre-esistente, nessuna card).
5. **Test** — in `ir.test.ts` (o file di test di validazione se esiste): `validateIR` accetta
   `container` sugli endpoint, rifiuta `$ref.values` come endpoint, accetta `$ref.values[0]`;
   nessun cambiamento ai test della 2a.
6. **Log** — oltre all'entry nuova di questo task: aggiorna **in place** l'entry ⚠️ della
   slice 2a come proposto nel suo closing report, registrando la misura R-B16 passata
   (5 edge / 0 nodi / re-parent riagganciato senza reload, conferma visiva di Alfonso
   2026-08-17) e portando l'Outcome a ✅ con nota sulla deroga d'ordine già verbalizzata.

## HARD STOP

Prima del commit, in chat: diff completa; grep di collisione sui nuovi identificatori (voci e
classi CSS del nuovo Select, eventuali costanti di modalità) con controllo positivo; gate
`npm run typecheck` (baseline invariata), `npm run build`, vitest (baseline 2a),
`npm run check:docs` (il file spec non è tra i sorvegliati, ma l'entry di log sì: 8 errori
preesistenti, nessuno nuovo). Poi **smoke visivo di Alfonso**: (i) dal pannello, endpoint
source → «Containing element» sulla view edge di `Transition`, target `$next.value`: gli archi
restano/appaiono senza console rossa; (ii) riapertura del pannello: la modalità container è
mostrata, non un picker vuoto; (iii) trascinamento del capo container di un edge: il pin di
lato si applica e nessuna scrittura di modello; (iv) reload: tutto persiste. Commit solo dopo
GO visivo, `git add` dei soli file dichiarati.

## NON FARE

- Non toccare `PathBuilder`, `pathExpr.ts`/`STEP_RE`, `ReadCtx`, `isUsableEndpointExpr`,
  `parentOf`, file del sync.
- Non aggiungere card di fallback per gli endpoint irrisolvibili (deroga §10 ratificata).
- Non vietare il doppio `container` (ratificato ammesso).
- Nel file spec: niente em dash, niente filler, admonition solo se già presenti nello stile
  del documento; emendare le sezioni indicate, non riscriverle.
- Non toccare il file spec v1.1.

## RIFERIMENTI

Memo di ratifica; discovery `discovery_2026-08-17_edge_source_container.md` §Q4/§Q5/§Q6 e
R3/R4/R5; righe R-B13..R-B16; `irValidate.ts` (52 righe, intero), `edgeEndpoints.ts:42-45,67-78`,
`EdgeAuthoringPanel.tsx:126-266,330-337,590-663`, `EditorV2.tsx` `handleReconnect`,
spec v1.2 §3/§6/§7/§9/§10.
