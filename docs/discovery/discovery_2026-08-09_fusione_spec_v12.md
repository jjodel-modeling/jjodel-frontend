# Discovery — fusione delle due copie divergenti della spec ViewpointIR v1.2

Data: 2026-08-09 (esecuzione 2026-08-10). Branch `alfonso-frontend-jjtl` @ `7c58738d5`.
Fase 1 read-only del prompt «Fusione spec IR v1.2 e ritiro di docs/specs/». Nessuna modifica
ai due file di spec, nessun `git mv`, nessun commit. HARD STOP a report scritto.

## Obiettivo

Verificare che la divergenza fra `docs/spec/claude_spec_2026-07-18_ir_schema_v1_2.md` (copia
archiviata oggi dal Project Knowledge) e `docs/specs/spec_2026-07-18_ir_schema_v1_2.md` (copia
preesistente e tracciata) sia **solo** quella descritta nel COSA del prompt, censire il
contenuto residuo di `docs/specs/` e i riferimenti a quella cartella, prima di autorizzare la
fusione.

**Esito: la divergenza NON è solo quella descritta.** Due delta normativi non menzionati dal
prompt, entrambi presenti nella sola copia `docs/specs/`. Il merge di quei delta non è
autorizzato da questo prompt: si ferma qui.

## File letti

- `docs/spec/claude_spec_2026-07-18_ir_schema_v1_2.md` (210 righe, integrale)
- `docs/specs/spec_2026-07-18_ir_schema_v1_2.md` (214 righe, integrale)
- `docs/specs/design_2026-07-21_ir_authoring_surface_slice1.md` (268 righe, testata e riferimenti)
- `docs/spec/spec_attive.md` (sezione «ViewpointIR v1.2», righe 15-27)
- `docs/claude-code-log-archive.md` (entry 2026-07-19 e 2026-07-21 che toccano la spec)
- Storia git di `docs/specs/spec_2026-07-18_ir_schema_v1_2.md` (6 commit, `--follow`)

## Censimento di `docs/specs/`

| File | Tema | Omologo in `docs/spec/`? |
|---|---|---|
| `spec_2026-07-18_ir_schema_v1_2.md` (214 r.) | Spec IR v1.2, contratto dell'interprete | sì — `claude_spec_2026-07-18_ir_schema_v1_2.md`, divergente |
| `design_2026-07-21_ir_authoring_surface_slice1.md` (268 r.) | Design doc Fase 1.5: editor vertex + PathBuilder | **no** — nessuna collisione di nome, migrabile senza conflitti |

Il design doc dichiara come companion spec `docs/specs/spec_2026-07-18_ir_schema_v1_2.md`
(riga 9): è un riferimento interno che il ritiro della cartella rende dangling.
Documento affine ma distinto già in `docs/discovery/`:
`claude_discovery_2026-07-21_authoring_surface.md` (la discovery di Fase 1 su cui il design
doc si appoggia; il design doc dichiara che quella discovery «esisteva solo in chat» —
l'archiviazione di oggi l'ha portata nel repo).

## Diff riassunto — 8 hunk

Direzione: **KB** = `docs/spec/claude_spec_...`, **repo** = `docs/specs/spec_...`.

| # | Sez. | Contenuto | Solo in | Nel COSA? |
|---|---|---|---|---|
| 1 | header | riga `**Emendamenti**: 2026-07-18 … 2026-07-19 …` | KB | sì |
| 2 | 2 | regola d'ordine con `> wildcard (metaclasses: '*')` + paragrafo sulla semantica wildcard delle default view | repo | sì |
| 3 | 4 | `metaclasses: MetaclassRef[] \| '*'` con commento inline | repo | sì |
| 4 | 6 | etichetta del fallback palette: `(normativo, emendamento 2026-07-18)` vs `(normativo)` | KB (solo etichetta) | **no** |
| 5 | 7 | bullet waypoints: KB ha la riscrittura «persistenza IMPLEMENTATA (2026-07-19)» con `DVertex.irEdgeLayout`; repo ha il bullet originale «gap #6 del report» | entrambi, versioni diverse | in parte |
| 6 | 8 | frase «Persistenza del collasso (2026-07-19): `DVertex.irCollapsed` …» | KB | sì |
| 7 | 9 | frase «La navigazione multi-hop … è draw-semantic per costruzione, via l'helper unico `navigateRefHop` / `ReadCtx.getRef`: vedi la nota in sez. 12.» | repo | **NO** |
| 8 | 12 | paragrafo intero «**Emendamento 2026-07-21 (fix render multi-hop)**: …» | repo | **NO** |

### Precisazione sull'hunk 5

Il COSA dice che la copia `docs/specs/` «NON ha gli emendamenti 2026-07-19». È vero solo a
metà: la copia repo **ha** il chiarimento sul perimetro di `persistWaypoints`, inserito come
blockquote annidata sotto il bullet originale. Quello che le manca è la **riscrittura** del
bullet waypoints con `DVertex.irEdgeLayout` e la dichiarazione che la persistenza degli edge
sintetici è implementata.

### Provenienza dei delta — la storia git è dirimente

`docs/specs/spec_2026-07-18_ir_schema_v1_2.md` ha 6 commit. Gli emendamenti sono entrati così:

| Commit | Data | Cosa ha scritto nella spec |
|---|---|---|
| `dc1c9dd51` | 07-18 | creazione |
| `c4b3b7c03` | 07-18 | default view IR, **wildcard** `'*'`, intrinsic label |
| `3f46884b0` | 07-18 | sez. 6, fallback palette |
| `15b81c33b` | 07-18 | sez. 11, delega delle default migrate al nativo |
| `12f7b32bf` | 07-19 | **solo** il blockquote sul perimetro di `persistWaypoints` (2 righe) |
| `a479e489d` | 07-21 | sez. 12 emendamento multi-hop + cross-ref sez. 9 (hunk 7 e 8) |

Ricerche `git log -S` sulla storia di `docs/specs/`: `irEdgeLayout` **zero** hit, `irCollapsed`
**zero** hit, `**Emendamenti**` **zero** hit. Quindi:

- gli hunk 1, 5-KB e 6 (header, riscrittura sez. 7, frase sez. 8) sono **edit di sola KB**, mai
  entrati nel repo;
- gli hunk 7 e 8 sono un **emendamento committato e ancorato al codice**: `a479e489d` ha
  scritto insieme `irReadCtx.ts` (`navigateRefHop` + `getRef`), `irReadCtxLproxy.ts`,
  `irCompile.ts`, `irCrossDeps.ts`, `+6` test e la spec. Documentano comportamento in
  produzione, non una decisione di carta.

La copia KB è quindi **anteriore al 2026-07-21** sul ramo del render multi-hop, e la copia repo
è anteriore agli edit di chat del 2026-07-19 su `irEdgeLayout`/`irCollapsed`. Nessuna delle due
è soprainsieme dell'altra, ed entrambe si presentano come normative.

## Riferimenti a `docs/specs/`

**42 occorrenze in 27 file. Zero in codice** (`.ts`/`.tsx`: nessun hit): è un problema di sola
documentazione.

| Categoria | File | Occ. | Aggiornabile? |
|---|---|---|---|
| Registro storico — log archiviato | `docs/claude-code-log-archive.md` | 5 | **no**, vedi sotto |
| Registro storico — log attivo | `docs/claude-code-log.md` | 1 | **no** (è la entry di ieri che ha *scoperto* la divergenza) |
| Prompt archiviati (eseguiti) | 10 file in `docs/prompts/` | 13 | **no** |
| Discovery report chiusi | 10 file in `docs/discovery/` | 19 | discutibile |
| Ratifiche | `claude_ratifiche_2026-08-03_state_actions_events.md` | 1 | discutibile |
| Archivio | `claude_2026-07-18_consegna_ir_editorv2.md` | 1 | discutibile |
| **Documento vivo** | `docs/spec/claude_spec_2026-07-26_ir_edge_authoring_addendum.md` | 1 | **sì** |
| **Documento vivo** | `docs/specs/design_2026-07-21_ir_authoring_surface_slice1.md` | 1 | **sì**, nel file migrato |

### Due ostacoli al punto 5 della Fase 2

**(a) La sostituzione `docs/specs/` → `docs/spec/` produce path inesistenti.** Il nome del file
canonico non è `spec_2026-07-18_ir_schema_v1_2.md` ma
`claude_spec_2026-07-18_ir_schema_v1_2.md` — il prompt fissa esplicitamente che il nome **non
cambia**, perché è quello indicizzato da `spec_attive.md`. Una sostituzione di sola directory
lascerebbe 40 riferimenti a `docs/spec/spec_2026-07-18_ir_schema_v1_2.md`, che non esiste:
si passerebbe da riferimenti a una cartella ritirata a riferimenti a un file inesistente.
Serve una sostituzione **di path completo**, non di directory.

**(b) Riscrivere i registri storici li falsifica.** Le 5 occorrenze nell'archivio del log e le
13 nei prompt archiviati non sono puntatori da manutenere: sono la registrazione di **cosa un
task ha effettivamente toccato**. `claude-code-log-archive.md:8613` dice «Files touched: …
`docs/specs/spec_2026-07-18_ir_schema_v1_2.md`», ed è vero del commit `a479e489d`. Cambiarlo
renderebbe il log una dichiarazione falsa su un commit esistente, contro la natura
append-only del registro (CLAUDE.md §21) e contro la regola 8. Stessa logica per i prompt
archiviati, che sono documenti eseguiti e chiusi, e per i discovery report, che citano i path
letti **in quella sessione**.

## Domande aperte

1. **Gli hunk 7 e 8 entrano nella fusione?** Sono normativi, committati e ancorati al codice a
   HEAD (`navigateRefHop` e `ReadCtx.getRef` esistono). Lasciarli fuori significa che la copia
   canonica dichiarerebbe meno di quello che il codice fa, e perderebbe l'unico punto della
   spec che spiega perché la navigazione multi-hop è draw-semantic su entrambi i backend. Il
   prompt però non li autorizza: servono due righe di go-ahead.
2. **L'hunk 4** (etichetta `(normativo, emendamento 2026-07-18)` contro `(normativo)`): la
   copia KB è più informativa e il testo normativo è identico. Si tiene la versione KB, cioè
   nessuna azione? Confermare.
3. **L'hunk 5**: si tiene la riscrittura KB del bullet waypoints (che dichiara la persistenza
   implementata) e si scarta il bullet «gap #6» della copia repo? È la lettura corrente e
   coincide con il codice, ma è una sostituzione di testo normativo, non un'aggiunta.
4. **Perimetro del punto 5** (aggiornamento riferimenti). Tre opzioni:
   (i) aggiornare **solo i 2 documenti vivi** (l'addendum edge authoring e il design doc
   migrato), lasciando intatti registri e documenti chiusi — è la lettura che non falsifica
   nulla e la mia raccomandazione;
   (ii) aggiornare anche discovery, ratifiche e archivio (21 occorrenze in più), lasciando
   fuori solo log e prompt;
   (iii) aggiornare tutte le 42.
   In ogni caso la sostituzione deve essere di path completo (ostacolo (a)).
5. **Nota di reindirizzamento**: al posto della riscrittura di massa, vale la pena aggiungere
   una riga in `docs/spec/spec_attive.md` che dichiari «`docs/specs/` è stata ritirata il
   2026-08-09; i riferimenti storici a quel path si risolvono in `docs/spec/`»? Costa una riga
   e risolve i 40 riferimenti storici senza toccarli.
6. **Il design doc migrato** `design_2026-07-21_ir_authoring_surface_slice1.md` prende il
   prefisso `claude_` per uniformarsi al resto di `docs/spec/`, o conserva il nome? Il prompt
   dice `git mv` senza specificare. Nota: `docs/spec/` contiene già
   `design_2026-05-03_L2_edge_overlay.md` senza prefisso, quindi conservare il nome è coerente.
7. **`spec_attive.md` indicizza il design doc?** Oggi no. Dopo la migrazione entra
   nell'indice o resta fuori? Fuori dal punto 4 della Fase 2, che nomina solo la riga sulla
   fusione.
