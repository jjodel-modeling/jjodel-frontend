# Edge IR: endpoint «container» — Fase 1, discovery read-only

> **Nome del documento prompt**: 2026-08-17 16:55

Protocollo: docs/PROTOCOL.md — clausole P1..P10 applicabili.
Corsia: **completa** (critical zone: `viewpoint/ir/`, `viewpoint/authoring/`). Questa è la sola
Fase 1: read-only, nessuna modifica al codice.

Leggi `CLAUDE.md` e `docs/decisions.md` (serie R-B; anche R-SIM per il contesto d'uso).
Branch: `alfonso-frontend-jjtl`.

## Contesto (non rifare l'analisi)

Richiesta di Alfonso: nell'irKind Edge, `source` e `target` sono oggi PathExpr su reference
dell'oggetto-edge (`irTypes.ts:238-239`). Un metaelemento contenuto (es. `Transition` child di
`State` via containment) non ha back-reference verso il contenitore, quindi non può esprimere il
source e non diventa mai object-as-edge (`irCompile.ts:396` richiede entrambi gli endpoint). Si
vuole, in aggiunta al meccanismo attuale, poter dichiarare come endpoint il **parent di
contenimento** dell'oggetto-edge (semantica eContainer).

Ipotesi di design da verificare (non da implementare): token riservato `container` come
espressione endpoint **intera** (non componibile in catene, v1), persistito nel campo stringa
esistente; oggi `parsePathExpr` lo rifiuta (`pathExpr.ts:23`, manca il prefisso `$`), quindi il
vocabolo è libero per costruzione. Simmetrico su source e target. Validazione del token in
`validateIR` (R-B9-bis), render permissivo, vocabolario mai rinominato (R-B9).

## COSA (domande della discovery, tutte con citazione file:riga)

1. **Pipeline object-as-edge oggi**: da `compileEdgeView` (`irCompile.ts:370`) e
   `edgeEndpoints.ts` fino all'edge sul canvas: chi risolve `sourceExpr`/`targetExpr` a runtime,
   quando, e che cosa produce (DEdge? edge RF diretto?). Cosa rende oggi un oggetto con view
   edge e un solo endpoint (nodo? niente?). `isUsableEndpointExpr` (`edgeEndpoints.ts:136`):
   semantica esatta.
2. **Punto di risoluzione del parent**: per un DObject M1, come si ottiene il contenitore
   (campo `father`? DValue del containment? entrambi?) e con quali garanzie di freschezza
   (CLAUDE.md §3.6: father eager, forward-link stale). Dove lo si leggerebbe nel punto trovato
   in (1).
3. **Reattività degli endpoint**: cosa fa ricalcolare oggi gli endpoint di un object-as-edge
   (dependency set di `irCrossDeps`? step di `useJjomSync`? altro); cosa arriva, e a chi,
   quando un child viene spostato in un altro container (re-parent). Se il re-parent non
   produce oggi nessun segnale utile, dirlo esplicitamente: è il rischio principale.
4. **Grammatica e validazione**: conferma con controllo positivo che `container` nudo è
   rifiutato sia nel percorso di authoring sia in quello di render; dove `validateIR` valida
   gli endpoint edge; se esiste già un vocabolario di valori speciali per gli endpoint.
5. **Authoring**: come `EdgeAuthoringPanel.tsx` edita oggi source/target (testo libero?
   picker?), e dove si innesterebbe una scelta «Containing element» di prima classe.
6. **Spec e decisioni**: sezioni esatte di
   `docs/spec/claude_spec_2026-07-18_ir_schema_v1_2.md` da emendare (edge kind, PathExpr,
   dependency set §9) e righe R-B che vincolano o confliggono.
7. **Criterio di accettazione dal caso d'uso**: nel progetto di test della simulazione
   (metamodello State/Transition con containment `transitions` e reference `next`), come
   rendono oggi le istanze di `Transition`, e cosa dovrebbe cambiare a schermo con l'endpoint
   `container` (una riga, verificabile).

## Discovery report (OBBLIGATORIO)

Report in `docs/discovery/`, nome `discovery_<YYYY-MM-DD>_edge_source_container.md` (suffisso
`_N` se il tema ricorre nello stesso giorno). Contenuto minimo P4: ipotesi in falsificazione,
obiettivo, file letti con path completi, findings con file:riga e citazione, dipendenze e
rischi, domande aperte per Alfonso. Ogni asserzione di assenza con controllo positivo
dichiarato (CLAUDE.md §5; `command grep`, mai il wrapper).

## HARD STOP

La Fase 1 chiude con il report scritto e l'entry di log (formato §21.2). Nessuna modifica al
codice, nessuna proposta di diff. L'analisi e la ratifica avvengono in chat sul report salvato;
la Fase 2 avrà un prompt proprio, con Layer Impact Report se tocca sync.

## NON FARE

Non modificare file. Non estendere STEP_RE «per prova». Non trarre conclusioni di assenza da
grep senza controllo positivo. Non riscrivere report esistenti: se un report sul tema esiste
già al path indicato, leggilo e aggiungi un addendum (ratifica R-E/E-1).

## RIFERIMENTI

`irTypes.ts:220-246,302-320` (schema edge), `irCompile.ts:370-400`, `edgeEndpoints.ts`,
`pathExpr.ts:23,31-58`, `irReadCtx.ts:17-34`, `irCrossDeps.ts`, `EdgeAuthoringPanel.tsx`,
`useJjomSync.ts` (solo lettura, step edge), decisioni R-B9/R-B9-bis/R-B10/R-B12,
spec v1.2 §6/§9 e sezione edge.
