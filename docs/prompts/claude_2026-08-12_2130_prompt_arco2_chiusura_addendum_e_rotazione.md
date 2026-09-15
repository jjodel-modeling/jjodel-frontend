# Prompt Claude Code — arco 2, chiusura: l'addendum al report di triage e il ventiduesimo lotto

**Data**: 2026-08-12 21:30
**Tipo**: docs
**Perimetro**: tre file. `docs/discovery/discovery_2026-08-10_triage_residuo_serie_u.md`,
`docs/claude-code-log.md`, `docs/claude-code-log-archive.md`. Fuori dalla critical zone.
**Dipende da**: `9031c6ce6`.
**Commit**: **due, in quest'ordine**, e l'ordine conta per l'aritmetica della rotazione.

---

## Perché

La traccia che hai lasciato sui due `.md` in `.git/_to_delete/` era buona e l'ho seguita fino in
fondo. La risposta è netta e va scritta dove sta la domanda.

Il report di triage del 10 agosto chiude così il paragrafo su `docs/_to_delete/`: «non essendo mai
stata tracciata, non c'è nulla da recuperare né da scartare, e il suo contenuto non è ricostruibile
da git. Se conteneva qualcosa di significativo, quel qualcosa è perso». Per i due file che hai
trovato, **non è perso, e non è nemmeno ricostruibile: è già lì**.

Misure, tutte read-only e nessuna dedotta:

| Cosa | `migrated_design_doc_orig.md` | `retired_spec_v12.md` |
|---|---|---|
| Dimensione, righe | 21.824 B, 268 | 14.832 B, 214 |
| `git hash-object` | `9a540c9543baf8c2…` | `f968e41c802dbd5a…` |
| `git cat-file -e` | oggetto **presente** | oggetto **presente** |
| `--find-object` | `b0292b863`, `a0537ee5d` | `03363ce6a`, `a479e489d` |
| Copia viva nel repo | `docs/spec/design_2026-07-21_ir_authoring_surface_slice1.md` | `docs/spec/claude_spec_2026-07-18_ir_schema_v1_2.md` |
| Diff orfano → copia viva | 4 righe | 17 righe |

I due commit che li contengono sono esattamente i due che il loro nome annuncia: `b0292b863`
«retire docs/specs/, migrate the slice-1 design doc, redirect note» e `03363ce6a` «merge the two
divergent copies of the ViewpointIR v1.2 spec». Sono gli originali messi da parte prima
dell'operazione, non contenuto unico.

E le copie vive sono **soprainsiemi stretti**, verificato hunk per hunk. Il design doc diverge per
una riga sola, il path del companion spec che passa da `docs/specs/` a `docs/spec/`: è la
migrazione stessa. La spec diverge per quattro hunk, tutti nella direzione del *più* nella copia
viva: la riga `**Emendamenti**`, l'annotazione «emendamento 2026-07-18» sul fallback della palette,
il paragrafo su `DVertex.irEdgeLayout` che sostituisce una nota al futuro sul gap #6, e la frase su
`DVertex.irCollapsed`. Sono le ratifiche R-FS1..R-FS7. L'orfano è la copia **pre-fusione**.

Resta indeterminato, e va scritto come indeterminato, **da quale** `_to_delete/` vengano: il report
parla di `docs/_to_delete/`, questi stanno in `.git/_to_delete/`. Non l'ho stabilito e non vale la
pena stabilirlo, perché la conclusione non dipende da quella risposta.

---

## COSA

### Commit 1 — addendum in coda al report di triage

Aggiungere in fondo a `docs/discovery/discovery_2026-08-10_triage_residuo_serie_u.md` (310 righe
oggi) una sezione nuova. **Non riscrivere il paragrafo originale**: un report di discovery è una
fotografia datata, si corregge in coda con la data della correzione.

Testo, adattabile nella forma ma non nella sostanza né nei numeri:

> ## Addendum 2026-08-12: la domanda sul contenuto perso ha una risposta
>
> Il paragrafo su `docs/_to_delete/` chiude con «se conteneva qualcosa di significativo, quel
> qualcosa è perso». Per due file almeno, non lo è.
>
> Trovati in `.git/_to_delete/` durante la chiusura dell'arco 2 (commit `9031c6ce6`):
> `migrated_design_doc_orig.md` (21.824 B, 268 righe) e `retired_spec_v12.md` (14.832 B, 214
> righe), entrambi datati 24 luglio. Non stanno nel working tree e `git status` non scandisce
> `.git/`, quindi non sono mai comparsi in nessun triage.
>
> Nessuno dei due è contenuto unico, misurato:
>
> - `git hash-object` dà `9a540c95…` e `f968e41c…`; `git cat-file -e` conferma che **entrambi gli
>   oggetti sono in git**. `--find-object` li colloca in `b0292b863` («retire docs/specs/, migrate
>   the slice-1 design doc») e in `03363ce6a` («merge the two divergent copies of the ViewpointIR
>   v1.2 spec»). Sono gli originali messi da parte prima delle due operazioni che il loro nome
>   annuncia.
> - Le copie vive nel repo sono soprainsiemi stretti. `design_2026-07-21_ir_authoring_surface_slice1.md`
>   diverge per una riga, il path del companion spec da `docs/specs/` a `docs/spec/`, che è la
>   migrazione stessa. `claude_spec_2026-07-18_ir_schema_v1_2.md` diverge per quattro hunk, tutti
>   in aggiunta: la riga `**Emendamenti**`, l'annotazione sul fallback della palette, il paragrafo
>   su `DVertex.irEdgeLayout` al posto di una nota al futuro sul gap #6, e la frase su
>   `DVertex.irCollapsed`. Sono le ratifiche R-FS1..R-FS7. L'orfano è la copia pre-fusione.
>
> **Non stabilito**: da quale `_to_delete/` vengano. Il report parla di `docs/_to_delete/`, questi
> stanno in `.git/_to_delete/`. La conclusione non dipende dalla risposta e la domanda resta
> aperta.
>
> **Registrato per inciso**, perché è il resto del contenuto della stessa cartella: `.git/_to_delete/`
> raccoglie 32 file, di cui 30 sono detriti di git (6 `HEAD.lock.*`, 7 `index.lock.*`, 4
> `maintenance.lock.*`, 13 `tmp_obj_*`), cioè i file su cui git fa `unlink` e che il mount del
> bridge Cowork non può cancellare. È la traccia accumulata di R-RAIL-27 attraverso le sessioni.
> Non va ripulita in questo passo: è inerte, sta fuori dal working tree, e come evidenza vale più
> di quanto costi.

Entry di log per questo commit, formato §21.2. `Corregge`: `—` (non corregge un prompt, chiude una
domanda aperta di un report). `Causa`: `—`. `Regressions`: `no`. `Out-of-scope changes`: `no`.
`Layer Impact Report`: `not-required`. `Smoke visivo`: `non applicabile`.

### Commit 2 — il ventiduesimo lotto, rotazione a sé

Le entry attive sono **22** adesso; dopo il commit 1 saranno **23**. La rotazione è un commit a sé
e aggiunge la propria entry, quindi ne sposta **quattro**: 23 − 4 + 1 = 20. Fare il conto di nuovo
sul file, non fidarsi di questo numero: se il commit 1 fosse andato diversamente, cambia.

Taglio posizionale come i lotti da quattro in poi. Le quattro più vecchie per posizione nel file
attivo vanno in coda all'archivio nel loro ordine, e va scritto il paragrafo di preambolo, in
inglese, nella forma della serie.

**Una cosa da dire nel paragrafo, ed è il motivo per cui vale la pena scriverlo bene.** Con i tre
paragrafi recuperati da `e88fca7df` la serie del preambolo è di nuovo continua da uno a ventuno,
quindi **il progressivo torna a leggersi dal preambolo**, che è la regola registrata e che aveva
smesso di funzionare proprio perché mancavano quei tre. Questo lotto è il primo dopo il ripristino
a poterla applicare: dirlo chiude il caso da cui è nata R-RAIL-43.

Verificare inoltre, e dichiarare nel paragrafo se concordano, il criterio del taglio: posizione nel
file attivo contro `Prompt document name`. Se divergono, l'inversione si dichiara, non si nasconde.

---

## Verifiche

1. `command grep -c '^## 20' docs/claude-code-log.md`: 22 prima, 23 dopo il commit 1, **20** dopo
   il commit 2.
2. `command grep -c '^## 20' docs/claude-code-log-archive.md`: 749 prima, 749 dopo il commit 1,
   **753** dopo il commit 2.
3. **Conservazione**: la somma attivo + archivio dopo il commit 2 deve essere quella prima, più le
   due entry nuove. Verificare che l'insieme delle intestazioni sia lo stesso, nessuna persa e
   nessuna inventata.
4. `command grep -c 'Twenty-second' docs/claude-code-log-archive.md` deve dare 1 dopo. Controllo
   positivo sulla stessa ricerca: `Twenty-first` deve dare 1.
5. `npm run check:docs` verde dopo entrambi i commit.
6. Nessuna build: non tocchi codice.

## Hard stop

1. **Se le entry attive prima del commit 1 non sono 22**, ricalcola tutto e riporta il numero
   trovato: qualcosa è passato in mezzo.
2. **Se il report di triage non ha 310 righe** o il paragrafo citato non c'è più, STOP: qualcuno
   lo ha già toccato.
3. **Se una delle misure della tabella non si riproduce** (`hash-object`, `cat-file -e`,
   `--find-object`, i conteggi di diff), STOP e riporta quale. L'addendum afferma quei numeri e
   non va scritto con numeri che non tornano.
4. **Non toccare `.git/_to_delete/`**, in nessun modo, nemmeno per spostarne i due `.md`.

## Cosa questo passo NON fa

- **Non ripulisce `.git/_to_delete/`.**
- **Non stabilisce** da quale `_to_delete/` vengano i due file. Resta aperta e dichiarata.
- **Non emenda** il paragrafo originale del report di triage.
- **Non fa push.**

## Log

Due entry, una per commit, formato §21.2. Quella della rotazione porta nelle note il conto
(23 − 4 + 1), la conservazione verificata sui conteggi, l'esito del confronto fra taglio
posizionale e `Prompt document name`, e la riga sul progressivo che torna leggibile dal preambolo.

## Cruscotto

Non chiude voci. Chiude una domanda aperta di un report di discovery e riporta il log a 20.
