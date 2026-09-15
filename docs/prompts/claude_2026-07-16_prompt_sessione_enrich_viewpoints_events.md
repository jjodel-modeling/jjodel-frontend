# Prompt sessione Cowork — Enrich Viewpoints/Events da transcript (+ fallback sito)

Incolla questo prompt in una nuova sessione Cowork del progetto "Jjodel Development".

---

## Contesto

Continuazione del lavoro sulla documentazione di Jjodel (docs.jjodel.io, repo `jjodel-modeling/jjodel-docs`, deploy automatico via GitHub Action su push a `main`).

**Prima di iniziare, leggi dal knowledge base del progetto:** `claude/sessione_2026-07-15_3.md` e `claude/sessione_2026-07-16.md`. Contengono lo stato completo: riallineamento di tutte le pagine (16/07), Tutorial 5 pubblicato, `lastUpdated` attivo, lezioni operative sulla consegna dei file.

Stato di partenza atteso: working tree `~/jjodel-docs` sul Mac di Alfonso pulito e allineato a `origin/main` (commit `8224255` o successivo). Modalità operativa: Claude clona il repo nel cloud per analisi e build, scrive i file finali nel working tree locale via device bridge; commit e push li fa Alfonso con un comando unico preparato da Claude.

## Task primario: enrich Viewpoints + Events dal transcript della lezione

**COSA.** Arricchire `src/content/docs/user-guide/viewpoints.md` e `src/content/docs/reference/jjodel-events.md` con il materiale del transcript della lezione (pendenza aperta dal 2026-04-16). `console.md` è GIÀ stata riscritta il 16/07: non rifarla; al massimo integrazioni puntuali se il transcript copre aspetti della Console non documentati.

**DOVE.** Chiedere la connessione di due cartelle: `~/jjodel-docs` e `~/jjodel-emse-transcripts-backup-2026-06-12` (i transcript). Se la cartella transcript non esiste o non contiene il materiale della lezione su viewpoints/events, chiedere ad Alfonso dove si trova PRIMA di procedere; se non è recuperabile, passare al fallback.

**COME.**
1. Leggere per intero le due pagine correnti (viewpoints.md è stata toccata dalla PR copilot: nota sui default views read-only da preservare).
2. Leggere i transcript ed estrarre solo contenuto stabile e verificabile; in dubbio, verificare contro il repo frontend (`jjodel-modeling/jjodel-frontend`, branch `alfonso-frontend-jjtl`, cartella `frontend/src/`).
3. Integrare rispettando le regole di scrittura del progetto: niente em dash, niente filler, paragrafi max 4-5 frasi, max 2 admonition per pagina, placeholder screenshot nel formato standard, link interni relativi.
4. Verifica pipeline PRIMA della consegna: `npm run build` verde (34+ pagine), link checker sui link interni, zero em dash fuori dai placeholder.
5. Consegna nel working tree e comando unico di commit/push per Alfonso.

## Fallback: sezione "What you can do with Jjodel" sul sito

Se i transcript non sono disponibili, passare al repo `jjodel-modeling/jjodel-website` (jjodel.io). Sezione home concordata nella sessione 2026-04-20 (nel KB): sei blocchi Design metamodel / Viewpoints / JjEL / JjTL / Collaborate / JjScript, layout a colonne alternate, visual + testo compatto + link "Learn more" alla doc; posizione fra i tre pilastri e il feed Latest activity; esclusioni esplicite: Jjodie AI, co-evolution, LSP/GLSP. Verificare i path dei "Learn more" contro le route reali di docs.jjodel.io prima di scriverli.

## Regole operative (lezioni apprese il 15-16/07)

- MAI patch o blob trascritti a mano in chat. Consegna file via device bridge (`device_commit_files`); se il bridge è giù, script Python auto-verificante (ancore uniche + assert), collaudato prima nel cloud su copia pulita con diff byte-per-byte contro il risultato atteso.
- Push solo da Alfonso. Nota sul suo git locale: ordine corretto `git add -A && git commit` → `git pull --rebase` → `git push`.
- `lastUpdated` è attivo: ogni pagina toccata mostrerà automaticamente la data nuova nel footer. Non serve alcuna azione.
- Non rimuovere il badge `New` dal Tutorial 5 (si toglie in una sessione futura).
- A fine lavoro: checkpoint di sessione nel KB (`claude/sessione_<data>.md`) con la struttura consolidata.

## Todo minore accodabile

Verifica live dello step 11 del Tutorial 5: nella regola di validazione, il confronto `c.$name === data.$name` va testato nell'app da Alfonso; se il proxy restituisce oggetti attributo serve `.value` su entrambi i lati. Eventuale correzione: one-liner in `tutorial-05-er-concrete-syntax.md`.
