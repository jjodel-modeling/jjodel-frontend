# Sessione 2026-08-05 (5) — Recupero di efficacia e controllo

Sessione Cowork nata da un allarme di Alfonso: molte ore, anche oltre la giornata di oggi, senza progresso visibile sull'applicazione; latenze e passaggi non chiari; sensazione di perdita di controllo. Diagnosi condotta sui documenti delle sessioni del 4-5 agosto. Le decisioni qui dentro sono ratificate da Alfonso (fronte su delega "decidi tu"; processo: pacchetto completo).

## Stato a fine sessione

Fronte unico: **arco A fino alla barra visibile (1.5)**. Tutto il resto congelato, con documento di rientro. Processo alleggerito con RC-2..RC-6. La coda unica sta in `contesto_progetto.md`, che da ora è cruscotto e kickoff insieme: i documenti di kickoff separati cessano.

## Diagnosi: i numeri del 2026-08-05

Cinque filoni di chat nella stessa giornata, in parte contemporanei (arco A, legacy, ratifiche R-F/R-G più 1.3, design system, questa), più otto o dieci run di Claude Code. Prodotto: più di venti documenti tra prompt, ratifiche, verbali e kickoff, tre mockup HTML, otto commit di cui tre sono misure o report. Cambiamenti percepibili nell'app: checkbox di nuovo cliccabili, tab Template in sola lettura, classificazione legacy riparata, pin di identità. Tutti veri, tutti piccoli. La barra su strada B, filone dichiarato vivo: zero righe implementate dopo due giorni di decisioni.

Le tre cause, in ordine di peso:

1. **Troppi fronti.** Quattro fronti attivi, circa venticinque prossimi passi cumulati. Nessun fronte riceve ore consecutive sufficienti a produrre qualcosa che si vede.
2. **Il processo costa più del lavoro che protegge.** Two-phase, report, ratifiche, verbali e quattro gate si applicano uguali a una migration e a una stringa di warning. Le due discovery più costose hanno sbagliato proprio sulla resa (censimento su corpus morto; checkbox visibili ma non cliccabili) e a correggerle è stata la verifica a video, il controllo più economico della catena.
3. **Il canale delle decisioni perde.** Le ratifiche vivono nel KB, che Claude Code non legge: `49c32c134` è atterrato senza 2.1 e senza C-1..C-4. Il rattoppo (testo incollato inline) produce prompt da duecento righe, cioè latenza e fragilità.

Nota separata: parte della lentezza percepita è del prodotto, non del metodo (`async-lz-string`, tre freeze di allProjects in una sessione). Diagnosi e fix candidato già agli atti, in coda congelata.

## Decisioni prese (serie RC, processo)

### RC-1 — Fronte unico: arco A fino alla barra (su delega)

Motivazione: è il filone vivo, ha tutte le decisioni chiuse (R-A..R-G), e 1.5 è il primo cambiamento grande e visibile. Fatto significa, a video: apro una edge view IR, cambio tab avanti e indietro durante un edit non salvato, niente si perde e niente si sposta; i tab sono quelli della partizione ratificata.

### RC-2 — "Fatto" si definisce a video

Ogni fronte ha la sua frase "apro X e vedo Y" scritta prima di iniziare. Una sessione che non avvicina quella frase è una sessione persa, qualunque documento produca. Metrica a fine sessione: commit atterrati e verificati contro documenti prodotti.

### RC-3 — Due corsie

**Corsia completa** (two-phase, report in `docs/discovery/`, ratifiche, verbale, gate pieni): solo per critical zone (`useJjomSync.ts`, `portDistribution.ts`), migrazioni, task sopra 3 file o che cambiano interfacce esportate.

**Corsia veloce**, tutto il resto:

- prompt fino a circa 80 righe, COSA/DOVE/COME/RIFERIMENTI;
- verifica preventiva inline (grep e letture mirate), riportata in massimo 10 righe nella entry di log: nessun report separato;
- gate: `npx tsc --noEmit` senza errori nuovi nei file toccati (baseline 33 nota), vitest sui soli file toccati, `npm run build`. Vitest completo e `check:docs` restano alla corsia completa e a un pass di igiene periodico;
- verifica visiva raggruppata: un solo hard stop a fine sessione, non uno per commit;
- effort di Claude Code: high (xhigh resta alla corsia completa);
- ogni prompt di corsia veloce dichiara in testa "Corsia veloce, RC-3 del 2026-08-05". Se Claude Code vede conflitto con CLAUDE.md, segnala citando questa ratifica.

### RC-4 — Le decisioni vincolanti vanno nel repo

Nasce `docs/decisions.md`: una riga per decisione attiva (id, data, vincolo operativo). Claude Code lo legge a inizio sessione come legge CLAUDE.md; i prompt citano gli id invece di incollare il testo. Le motivazioni estese restano nel KB. Chiude la falla che ha prodotto `49c32c134`.

### RC-5 — Una sessione alla volta

Mai due sessioni che scrivono su KB o repo in contemporanea senza perimetri di file disgiunti dichiarati in apertura. Costo misurato della violazione, solo oggi: discovery 1.2 eseguita due volte, S2 prima di S1, documenti datati male, `contesto_progetto.md` trovato fermo di due sessioni, collisione nella numerazione delle sessioni.

### RC-6 — Un cruscotto solo, niente kickoff separati

`contesto_progetto.md` apre con: stato in cinque righe, coda unica di massimo cinque voci, fronti congelati con documento di rientro. La sessione nuova apre leggendo il cruscotto più al massimo un documento. I kickoff separati cessano; quelli esistenti restano come documenti di rientro dei fronti congelati.

### RC-7 — Igiene dei gate, dopo la barra

Un gate rosso anche quando va tutto bene non è un gate. Le baseline rosse (tsc a 33, `check:docs`, i 9 file vitest `window is not defined`) si portano a verde o si scopano fuori dai gate con una slice dedicata, prima voce della coda successiva alla chiusura della barra.

## Coda unica ratificata

Vive in `contesto_progetto.md`. In sintesi: 1) recupero capi (prompt già scritto), con fotografia di apertura di git log e working tree; 2) trappola `.gitignore` più atterraggio della modifica pendente a `CLAUDE.md`; 3) semina di `docs/decisions.md`; 4) prompt e implementazione di 1.5, la barra; 5) verifica visiva unica e chiusura.

## Congelati

Design system (rientro: `claude/2026-08-05_3_kickoff_prossima_sessione.md`), property card (rientro: `claude/2026-08-05_design_property_card_sintassi_astratta.md`), code arco B (rientro: `claude/sessione_2026-08-05_2.md`), fuori archi (rientro: `claude/backlog_2026-08-04_vista_ordinata.md` e la sezione bug del contesto).

## Prompt generati per Claude Code

Nessuno nuovo: la voce 1 della coda riusa `claude/2026-08-05_prompt_recupero_capi_2_1_C1_C4.md`, già autosufficiente.

## Cronologia

Apertura sull'allarme. Lettura di contesto, sessioni 1-3 del giorno, ratifiche R-F/R-G, verbale 1.3, prompt di recupero. Diagnosi con i numeri, piano in cinque mosse, due domande ad Alfonso: fronte su delega ("decidi tu") e processo ("pacchetto completo"). Scelto arco A fino alla barra. Scritto questo documento, riscritto il cruscotto.
