# Prompt sessione Cowork — Screenshot docs, batch 1: percorso di ingresso

Incolla questo prompt in una NUOVA sessione Cowork del progetto "Jjodel Development". Sessione dedicata: gli screenshot consumano molto contesto, non accodare altri task.

## Prerequisiti (a carico di Alfonso, PRIMA di avviare)

1. **Dev server frontend acceso in locale** (branch con la new UI): l'app raggiungibile su `http://localhost:3000/` (in passato nel progetto si è usata anche la 3001: vale la porta che Alfonso indica a inizio sessione). Fallback se il locale non è disponibile: `beta.jjodel.io` con login fatto.
2. **Browser, una delle due strade:**
   - **Chrome + estensione Claude in Chrome** (preferita): estensione attiva, permessi concessi per `localhost` (e per `beta.jjodel.io` se si usa il fallback). Nota: l'estensione funziona SOLO su Google Chrome, non su Edge o altri Chromium (doc ufficiale Anthropic).
   - **Edge (o altro browser) via computer use**: nessuna estensione; la sessione chiede l'accesso al computer (tool `computer_*`) e Alfonso approva. Più lento e meno preciso nei crop; lo schermo resta occupato durante le catture.
3. Progetti d'esempio disponibili nell'app: un class diagram base (Tutorial 1/2), lo state machine con simulazione (Tutorial 4, serve anche per viewpoints), l'ER (Tutorial 3/5). Se mancano, dirlo subito: Claude li costruisce in-app seguendo i tutorial (più lento ma valida anche i tutorial).
4. Connettere la cartella `~/jjodel-docs` quando la sessione la chiede.

## Contesto

docs.jjodel.io (repo `jjodel-modeling/jjodel-docs`, deploy automatico su push a main). Stato: 48 placeholder screenshot in 13 pagine, uniche immagini reali in sign-in.md. Leggere dal KB: `claude/sessione_2026-07-16_2.md` (stato repo, lezioni operative). Working tree atteso pulito e allineato a `6b991e0` o successivo.

## COSA (solo batch 1, poi stop)

15 screenshot sul percorso di ingresso, nelle posizioni esatte dei placeholder `<!-- TODO: screenshot ... -->`:

1. `getting-started/first-project.md` (4)
2. `tutorials/tutorial-01-basic.md` (3)
3. `tutorials/tutorial-02-viewpoint.md` (3)
4. `user-guide/viewpoints.md` (5, è anche pagina di atterraggio dei "Learn more" dal sito)

Se il contesto regge dopo la consegna: `user-guide/dashboard.md` (2). Batch 2 (tutorial ER 3/5 + tutorial 4, 22 placeholder) e batch 3 (editor: metamodel, transformation, console, tree views, nodes) in sessioni successive.

## COME

- Con Chrome: prima di tutto `tabs_context` sui tool claude-in-chrome; riusare la tab dell'app esistente, non crearne di nuove senza motivo. Con computer use: `computer_resolve_access` → `computer_request_access` sul browser, poi catture con `computer_screenshot`.
- Ogni placeholder descrive già l'inquadratura richiesta. Finestra ~1440px, catturare/croppare l'area rilevante, PNG.
- Naming kebab-case descrittivo, salvate in `./images/` accanto alla pagina (convenzione esistente: `sign-in.md` → `./images/registration-form.png`). Creare la cartella `images/` se manca.
- Sostituire il placeholder con `![alt descrittivo](./images/nome.png)`; il commento TODO si rimuove solo quando lo screenshot c'è.
- Ottimizzare i PNG (sharp è già dipendenza del repo; script Node al volo, niente nuove dipendenze).
- Verifica PRIMA della consegna: `npm run build` verde, immagini referenziate esistenti, zero em dash nei md toccati. `changelog.md` è generato e gitignorato: NON committarlo mai.
- Consegna via `device_commit_files` in `~/jjodel-docs` (immagini + md), verifica md5, comando unico per Alfonso con `git add` SCOPED sui file consegnati.
- **MAI git che scrive l'index via device_bash sul repo montato** (`git status`/`add`/`commit`): crea un `index.lock` che il bridge non può cancellare e blocca il git di Alfonso (successo il 16/07). Solo `git log`/`rev-parse` o `git --no-optional-locks status --porcelain`, o md5.
- `lastUpdated` si aggiorna da solo sulle pagine toccate; il Docs Changelog pure.
- Nota screenshot vs utenti: il dev server locale mostra la new UI di destinazione (i placeholder la chiedono esplicitamente); se una schermata locale divergesse vistosamente dalla beta pubblica, segnalarlo ad Alfonso invece di pubblicare in silenzio.

## Opportunità collaterali (se il flusso lo permette)

- Tutorial 5 step 11 (todo aperto): con l'app davanti, testare nella regola di validazione il confronto `c.$name === data.$name`; se il proxy restituisce oggetti attributo serve `.value` su entrambi i lati. Fix eventuale: one-liner in `tutorial-05-er-concrete-syntax.md`.
- Colpo d'occhio alla home jjodel.io: icone chip della sezione "What you can do" rese correttamente.

## Regole generali

Regole di scrittura del progetto per ogni testo toccato (niente em dash, niente filler). A fine sessione: checkpoint `claude/sessione_<data>.md` con la struttura consolidata, incluso l'elenco screenshot fatti/mancanti per i batch successivi.
