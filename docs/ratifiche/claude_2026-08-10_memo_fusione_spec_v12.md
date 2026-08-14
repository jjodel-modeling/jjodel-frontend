# Memo di decisione — fusione spec ViewpointIR v1.2 (Fase 2 bloccata su 7 domande)

**Data**: 2026-08-10 (notte, sessione Cowork autonoma)
**Base**: `docs/discovery/discovery_2026-08-09_fusione_spec_v12.md` (158 righe, ora tracciato)
**Stato**: la Fase 1 ha concluso che la divergenza fra le due copie NON è quella descritta
dal prompt originario. Fase 2 non autorizzabile senza le ratifiche qui sotto. Nessun file
di spec toccato stanotte: decisione normativa, spetta ad Alfonso.

## Il quadro in tre righe

Nessuna delle due copie è soprainsieme dell'altra. La copia KB (`docs/spec/claude_spec_...`)
ha gli emendamenti di chat del 19/7 (`irEdgeLayout`, `irCollapsed`, header emendamenti) mai
entrati nel repo. La copia repo (`docs/specs/spec_...`) ha gli hunk 7-8 del 21/7
(`navigateRefHop` / draw-semantic multi-hop), committati con il codice in `a479e489d` e
tuttora veri a HEAD.

## Proposte di ratifica (R-FS1..R-FS7, una per domanda aperta)

**R-FS1 — Hunk 7 e 8: entrano nella fusione.** Sono normativi, committati e ancorati a
codice vivo (`irReadCtx.ts`, `getRef`, 6 test). Escluderli farebbe dichiarare alla copia
canonica meno di quello che il codice fa. Raccomandazione: SÌ, senza riserve.

**R-FS2 — Hunk 4: si tiene l'etichetta KB** `(normativo, emendamento 2026-07-18)`.
Testo normativo identico, l'etichetta è solo più informativa. Nessuna azione di merge.

**R-FS3 — Hunk 5: si tiene la riscrittura KB del bullet waypoints** (persistenza
`DVertex.irEdgeLayout` dichiarata implementata, coincide col codice) **e si conserva la
blockquote repo sul perimetro di `persistWaypoints`** se non ridondante rispetto alla
riscrittura. È una sostituzione di testo normativo: serve il tuo sì esplicito.

**R-FS4 — Perimetro aggiornamento riferimenti: opzione (i)**, i soli 2 documenti vivi
(`claude_spec_2026-07-26_ir_edge_authoring_addendum.md` e il design doc migrato), con
sostituzione di **path completo** (mai di sola directory: produrrebbe 40 path inesistenti,
ostacolo (a) del report). Registri e documenti chiusi restano intatti: riscriverli li
falsificherebbe (ostacolo (b), natura append-only del log).

**R-FS5 — Riga di reindirizzamento in `spec_attive.md`**: SÌ. Una riga («`docs/specs/`
ritirata il 2026-08-10; i riferimenti storici si risolvono in `docs/spec/`») risolve i 40
riferimenti storici senza toccarli.

**R-FS6 — Il design doc migrato conserva il nome** (niente prefisso `claude_`): coerente
con `design_2026-05-03_L2_edge_overlay.md` già presente senza prefisso in `docs/spec/`.

**R-FS7 — Indicizzazione del design doc in `spec_attive.md`**: fuori dalla Fase 2 (il
punto 4 del prompt originario nomina solo la riga sulla fusione). Proposta come follow-up
a costo di una riga, in un giro docs successivo.

## Cosa serve da te

Una riga: «R-FS1..R-FS7 ratificate» (o le eccezioni). Il prompt di Fase 2 è già pronto in
`claude/2026-08-10_prompt_fusione_spec_v12_fase2.md` e codifica queste scelte come COSA;
se cambi una ratifica va emendato il punto corrispondente prima dell'esecuzione.
