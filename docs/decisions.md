# Decisions — vincoli operativi attivi

Nato da RC-4 (2026-08-05): le decisioni che non stanno nel repo non vincolano l'esecutore.
Claude Code legge questo file a inizio sessione, come CLAUDE.md. Una riga per decisione:
id, data, vincolo operativo. Le motivazioni estese vivono nel knowledge base della chat di
progetto. Quando due serie condividono una sigla (R-B del 2026-08-05 vs R-B9 del 2026-08-03),
citare l'id con la data. Le decisioni sostituite si spostano in "Superate", con data.

## Processo

- **RC-3** (2026-08-05) — Due corsie. Corsia completa (two-phase, report in `docs/discovery/`,
  ratifiche, verbale, gate pieni, effort xhigh) solo per: critical zone (`useJjomSync.ts`,
  `portDistribution.ts`), migrazioni, task sopra 3 file o che cambiano interfacce esportate.
  Corsia veloce per tutto il resto: prompt fino a ~80 righe COSA/DOVE/COME/RIFERIMENTI;
  verifica preventiva inline riportata in massimo 10 righe nella entry di log, nessun report
  separato; gate ridotti (`npx tsc --noEmit` senza errori nuovi nei file toccati, baseline 33;
  vitest sui soli file toccati; `npm run build`); verifica visiva raggruppata in un solo hard
  stop a fine sessione; effort high. I prompt di corsia veloce lo dichiarano in testa; in
  conflitto con CLAUDE.md, segnalare citando questa ratifica.
- **R-E/E-1** (2026-08-05) — Discovery con report già esistente al path indicato: non
  riscriverlo; leggerlo per intero, confrontare punto per punto, aggiungere in coda un
  addendum con le sole cose non coperte.

## Arco A — barra a tab e capi degli edge

- **R-A** (2026-08-05) — Strada B per la barra: tutti i tab montati, gli inattivi nascosti con
  `display: none` (mai `visibility: hidden` né `opacity: 0`). La key di remount resta a
  livello di pannello: il reset avviene al cambio di view, non di tab. Nei sotto-editor
  dell'authoring e in `components/ui/` non si introducono `autoFocus`, `focus()`,
  `scrollIntoView`. Verifica mirata sul popover di `TextStyleField` al cambio tab.
- **R-B** (2026-08-05) — Niente badge di errore per-tab in v1 (`validateIR` ritorna una
  stringa senza coordinate): striscia di errore a livello di pannello sempre visibile, e i
  messaggi cross-tab nominano il tab nel testo. Coordinate di campo in `validateIR` =
  follow-up separato, prerequisito dei badge.
- **R-C** (2026-08-05) — 2.1 allargata: `isUsableEndpointExpr`, `nextEdgeForEndpoints`,
  `dropEndpoints` e la logica decisionale dei capi vivono in un modulo puro importabile sotto
  `viewpoint/ir/`; i test importano il modulo, mai mirror per copia.
- **R-D, emendamento a R-1 di E-obj** (2026-08-05) — Scrittura atomica dei capi: entrambe le
  chiavi o nessuna, sempre; con input incompleto l'IR resta intatto e la divergenza fra draft
  e IR è dichiarata in UI, non silenziosa né distruttiva. Uscire da object-as-edge è solo
  `changeNature('reference')`.
- **C-1..C-4** (2026-08-05) — Messaggistica dei capi: C-1 il caso A (coppia committata, un
  capo svuotato) dichiara la conseguenza (coppia precedente attiva; uscendo, l'edit incompleto
  si perde); C-2 il caso B (nessuna coppia, un capo digitato) ha un avviso proprio di lavoro
  non salvato; C-3 nessun messaggio rivendica una persistenza non avvenuta (il draft non è
  "salvato"); C-4 i test descrivono la semantica attuale, senza mirror di rami cancellati.
- **validateIR muto sulla divergenza** (2026-08-05) — Le stringhe di stato della divergenza
  sono un canale UI: non passano da `validateIR`.
- **R-F** (2026-08-05) — Il pin di identità della metaclasse (slice 1.3) è escluso da
  `canonicalize`: la canonicalizzazione non lo riscrive e non lo rimuove.
- **R-G** (2026-08-05) — Risalita al parent per feature negli endpoint: semantica ratificata;
  il lessema concreto è delegato al prompt di F3. F3 non parte prima che 2.1 sia landata.

## Edge IR — arco espressività (serie R-B del 2026-08-03) ed E-route

- **Deroga d'ordine** (2026-08-06) — E-route eseguita subito, in parallelo alla coda arco A e
  prima di F2/F3 e di E-mark/E-lab. Decisione di Alfonso. Commit `423f19f01` (amend
  dell'orfano `5b2cb2f60`: stesso contenuto, corretta solo la entry di log).
- **R-B9** (2026-08-03) — Vocabolario del routing: identificatori persistiti
  `'orthogonal' | 'straight' | 'curved'`, mai rinominati (le view IR salvate non hanno
  VersionFixer); etichette UI libere (oggi Manhattan / Direct / Bezier). Campo assente ≡
  `orthogonal`, resa identica.
- **R-B10** (2026-08-03) — Con routing non ortogonale i waypoint non si creano
  (`SegmentHandles` non montato) e quelli persistiti in `DVertex.irEdgeLayout` non si
  cancellano né si riscrivono: tornano vivi al ritorno a `orthogonal`.
- **R-B12, gate del registry** (2026-08-03, implementato il 2026-08-06) — `registerEdgePath`
  è condiviso con gli edge classici: mai registrarvi la polilinea ortogonale fantasma di un
  edge non ortogonale. Stato attuale: gli edge non ortogonali non registrano nulla: il
  crossing detection li ignora.

## Superate

- **D3** (2026-07-26, routing congelato in v1) — superata da E-route il 2026-08-06.
