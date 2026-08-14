# Prompt Claude Code — Fusione spec ViewpointIR v1.2, Fase 2 (esecuzione condizionata)

**Data**: 2026-08-10 03:05
**Precondizione di lancio**: Alfonso ha ratificato R-FS1..R-FS7 (memo
`claude/2026-08-10_memo_fusione_spec_v12.md`). Se una ratifica è cambiata, STOP e
segnalare il conflitto invece di eseguire.
**Corregge**: — (prosegue «2026-08-09 fusione spec IR v1.2 e ritiro di docs/specs», la cui
Fase 2 non era autorizzabile)

## COSA

Fondere le due copie divergenti della spec ViewpointIR v1.2 nella copia canonica
`docs/spec/claude_spec_2026-07-18_ir_schema_v1_2.md`, ritirare `docs/specs/`, aggiornare i
soli riferimenti vivi. Base fattuale: gli 8 hunk censiti in
`docs/discovery/discovery_2026-08-09_fusione_spec_v12.md` (leggerlo per intero prima di
toccare qualsiasi file).

Esito atteso per hunk:
- Hunk 1, 6: restano come in copia KB (già canonica).
- Hunk 2, 3: restano come già previsti dal COSA originario (wildcard `'*'` dalla copia repo).
- Hunk 4: si tiene l'etichetta KB, nessuna azione (R-FS2).
- Hunk 5: si tiene la riscrittura KB del bullet waypoints; la blockquote repo sul perimetro
  di `persistWaypoints` si conserva sotto il bullet SOLO se il suo contenuto non è già
  dichiarato dalla riscrittura (verifica testuale, non a memoria) (R-FS3).
- Hunk 7, 8: entrano nella copia canonica, presi verbatim dalla copia repo (R-FS1). Il
  cross-ref dell'hunk 7 («vedi la nota in sez. 12») deve restare coerente con la
  numerazione della copia canonica: verificare che la sez. 12 canonica riceva l'hunk 8.

## DOVE

1. `docs/spec/claude_spec_2026-07-18_ir_schema_v1_2.md`: riceve hunk 7, 8 (e l'eventuale
   blockquote dell'hunk 5). Nessun'altra modifica di contenuto.
2. `docs/specs/spec_2026-07-18_ir_schema_v1_2.md`: `git rm` (il contenuto normativo residuo
   è ora tutto nella canonica).
3. `docs/specs/design_2026-07-21_ir_authoring_surface_slice1.md`: `git mv` verso
   `docs/spec/design_2026-07-21_ir_authoring_surface_slice1.md`, nome conservato (R-FS6).
   Dentro il file migrato: il riferimento companion a
   `docs/specs/spec_2026-07-18_ir_schema_v1_2.md` diventa
   `docs/spec/claude_spec_2026-07-18_ir_schema_v1_2.md` (path completo).
4. `docs/spec/claude_spec_2026-07-26_ir_edge_authoring_addendum.md`: la singola occorrenza
   di `docs/specs/spec_2026-07-18_ir_schema_v1_2.md` diventa il path canonico completo
   (R-FS4, opzione (i): NESSUN altro file di registro, prompt, discovery o archivio va
   toccato).
5. `docs/spec/spec_attive.md`: aggiungere in coda alla sezione «ViewpointIR v1.2» la riga
   di reindirizzamento: «`docs/specs/` è stata ritirata il 2026-08-10; i riferimenti
   storici a quel path si risolvono in `docs/spec/`.» (R-FS5). Nessuna indicizzazione del
   design doc (R-FS7: follow-up separato).

## COME

- Due commit bisecabili:
  1. `docs: merge the two divergent copies of the ViewpointIR v1.2 spec` — punto 1 del
     DOVE più il `git rm` del punto 2 (la fusione e il ritiro della copia sono un fatto
     solo).
  2. `docs: retire docs/specs/, migrate the slice-1 design doc, redirect note` — punti
     3, 4, 5.
- `git add`/`git mv` per path espliciti, mai `git add .` (Regola 17).
- Dopo ogni commit: `npm run check:docs` (tocca il log). `build`/`typecheck`/`vitest` non
  necessari: zero file sorgente nel perimetro (dichiararlo nella entry come da precedente
  del 10/8).
- Al termine: entry in `docs/claude-code-log.md` per ciascun commit (formato §21.2, con
  questo documento come Prompt document name «2026-08-10 03:05»). Se le entry attive
  superano 20, la rotazione è un commit a sé, come da prassi.
- Diff completo dei file toccati nel report di chiusura. NESSUN push: resta ad Alfonso.
- Verifica finale obbligatoria: `grep -rn "docs/specs/" docs/spec/ frontend/src/` deve
  dare zero hit; `ls docs/specs/` deve fallire (cartella rimossa da git e vuota su disco).

## RIFERIMENTI

- `docs/discovery/discovery_2026-08-09_fusione_spec_v12.md` (censimento hunk, ostacoli
  (a) e (b), provenienza git dei delta)
- `claude/2026-08-10_memo_fusione_spec_v12.md` (ratifiche R-FS1..R-FS7)
- `docs/claude-code-log.md`, entry «fusione spec ViewpointIR v1.2, Fase 1» del 2026-08-10
- CLAUDE.md regole 15-19; docs/PROTOCOL.md P4, P6, P9
