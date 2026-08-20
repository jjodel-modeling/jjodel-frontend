# PROTOCOL.md — protocollo di esecuzione per Claude Code

Posizione: `docs/PROTOCOL.md` nel repo `jjodel-frontend`.
Versione: 1.1 (2026-08-15)

Questo file contiene le clausole che prima venivano ricopiate per esteso in ogni prompt. I prompt ora le citano per numero. Se una clausola cambia, cambia qui e vale ovunque da subito.

Riga da mettere in testa a ogni prompt Claude Code:

```
Protocollo: docs/PROTOCOL.md — clausole P1..P10 applicabili (tutte salvo deroga esplicita nel prompt).
```

Le deroghe si scrivono così: `Deroga: P4 non si applica (motivo: ...)`.

---

## P1 — CLAUDE.md è la fonte di verità

Leggi `CLAUDE.md` nella root all'inizio di ogni sessione e i `CLAUDE.md` di sottocartella pertinenti ai file che tocchi. Se un prompt contraddice `CLAUDE.md`, fermati e segnala il conflitto: non eseguire e non ignorare silenziosamente.

## P2 — Scope chiuso

Tocca solo i file elencati nel prompt, più quelli strettamente necessari (un import mancante). Un file non menzionato non si modifica: se serve, chiedi prima. Zero refactoring opportunistico: non rinominare variabili, non riordinare import, non migliorare codice adiacente. Mai rinominare identificatori esistenti (classi CSS/SCSS, variabili, funzioni, componenti, props) senza richiesta esplicita: le classi CSS sono API interne e le collisioni non danno errori di compilazione, danno bug visivi in componenti scorrelati.

Prima di introdurre un nuovo identificatore, verifica con ricerca globale (`grep -r`) che non sia già in uso.

## P3 — Leggere prima di scrivere

Prima di modificare un file, leggilo intero (o la sezione rilevante). Rispetta le convenzioni locali: naming, import, struttura, stile SCSS. Non rimuovere codice apparentemente inutilizzato. Non modificare interfacce TypeScript esistenti (aggiungere proprietà opzionali va bene; cambiare o rimuovere no) senza richiesta esplicita.

## P4 — Two-phase e discovery report

Fase 1 read-only, poi hard stop, poi Fase 2 solo dopo go-ahead.

Ogni fase esplorativa, anche breve, produce un report su file. L'output di terminale o di chat non conta.

- Path: `docs/discovery/`
- Naming: `discovery_<YYYY-MM-DD>_<descrizione_snake_case>.md`, suffisso `_N` per più report dello stesso giorno sullo stesso tema
- Contenuto minimo: ipotesi che la discovery sta falsificando, obiettivo, file letti con path completi, findings con `file:riga` e citazione verbatim, dipendenze e rischi, domande aperte
- Il report chiude la Fase 1: l'hard stop non è raggiunto finché non è scritto

Il report è un insieme di ipotesi con evidenze, non un riferimento definitivo. Chi lo usa a valle rilegge i file reali.

## P5 — Critical zone

L'elenco completo dei file in critical zone e il template obbligatorio del Layer Impact Report stanno in `CLAUDE.md` §3.1 e §3.2. Questa clausola non li duplica.

I file in critical zone richiedono go-ahead esplicito nel prompt più Layer Impact Report prima di qualunque modifica. Attenzione particolare, ovunque, a: custom DOM events, LModel proxy (trova per NOME, scrive con `$attr.value`), ID temporanei di `DObject.new()`.

## P6 — Commit

Si committa a ogni passo compiuto, anche prima della verifica visiva di Alfonso. La verifica non blocca il commit: blocca il merge. Ogni filone lavora sul proprio branch.

`git add` solo con path espliciti. Mai `git add .`. Se lo stato del working tree non corrisponde a quanto dichiara il prompt, fermati e segnalalo prima di toccare qualsiasi cosa.

Commit message: tipo convenzionale (`feat:`, `fix:`, `refactor:`, `docs:`), in inglese, una riga. Il tipo è indicato nel prompt: se manca, chiedilo, non sceglierlo.

Per modifiche che toccano più di 5 file: elenca prima tutti i file e cosa cambia in ciascuno, poi procedi.

Nel report di chiusura mostra sempre il diff dei file toccati. L'esposizione del diff non trattiene il commit.

## P7 — Build pulita

Dopo ogni modifica, `npm run build` (o il comando indicato nel prompt) deve completare senza errori. Riporta la baseline di `npx tsc --noEmit` prima e dopo: se il numero di errori sale, fermati.

## P8 — Smoke visivo

Prima dell'hard stop, esegui lo smoke visivo e riporta l'esito nel prompt log.

Dev server: **http://localhost:3000** (la porta 3001 può servire una build stale: non usarla per la verifica). Il server è in ascolto su `[::1]` soltanto: usare `http://localhost:3000`, non `http://127.0.0.1:3000`.

Lo smoke apre gli stati noti definiti in `frontend/scripts/smoke/states.ts` e verifica:

1. nessun errore in console
2. il canvas ha larghezza superiore alla soglia attesa (intercetta il canvas collassato)
3. il numero di nodi renderizzati è maggiore di zero (intercetta la schermata vuota)
4. nessun elemento in `position: fixed` interseca la status bar
5. nessun contenitore con overflow ha figli clippati oltre la tolleranza

I gate asserzionano **relazioni fra misure, non valori assoluti**. Un gate che dice
`bottom === 90` eredita il modello che ha prodotto quel 90 e fallisce senza spiegare;
`overlay.top === toolbar.bottom` fallisce dicendo cosa non combacia.

Se uno smoke fallisce, il commit resta ma l'hard stop riporta il fallimento in cima. Non tentare di aggiustare a occhio: segnala.

Lo smoke non sostituisce la verifica di Alfonso, che riguarda proporzioni, gerarchia visiva e comportamento percepito.

## P9 — Prompt log

Al termine di ogni task, aggiungi un'entry a `docs/claude-code-log.md`. Leggi il log a inizio sessione per il contesto sulle modifiche recenti. Oltre le 40 entry, sposta le più vecchie in `docs/claude-code-log-archive.md`.

Formato:

```
## YYYY-MM-DD — type: short description
**Prompt**: summary of received prompt
**Files touched**: list of modified files
**Outcome**: ✅ completed | ⚠️ partial | ❌ problems
**Corregge**: <name of the prompt document this task corrects> | —
**Causa**: <letter from the §21.3 taxonomy> | —
**Regressions**: yes | no | unknown
**Out-of-scope changes**: yes | no
**Layer Impact Report**: produced | not-required | skipped
**Smoke visivo**: passato | fallito (dettaglio) | non applicabile
**Notes**: (optional, max 500 characters; longer reasoning goes in the cited document)
**Prompt document name**: YYYY-MM-DD HH:mm
```

La semantica dei campi di autovalutazione, incluse le regole di compilazione di `Corregge` e `Causa` e la tassonomia dei valori ammessi, è definita in `CLAUDE.md` §21.3. Questo file non la duplica. Il blocco di formato qui sopra è verificato byte a byte contro `CLAUDE.md` §21.2 da `npm run check:docs`.

Il log non sostituisce i commit message, e il discovery report non sostituisce il log: sono tre artefatti distinti.

## P10 — Dove vivono i documenti

Il Project Knowledge tiene lo stato corrente, il repo tiene la storia. Sei documenti nel KB, per
nome: `contesto_progetto.md`, `sessione_CORRENTE.md`, `spec_attive.md`, `HARNESS-DOCS.md`,
`template-ir-authoring`, `template-task-visivi`.

Tutto il resto si salva in `docs/`: prompt in `docs/prompts/`, memo di ratifica in
`docs/ratifiche/`, checkpoint in `docs/sessioni/`, discovery in `docs/discovery/`, materiale di
lavoro in `docs/archivio/`, allegati non testuali in `docs/archivio/artefatti/`. Il prefisso e'
`claude_` ovunque tranne che per i discovery report, che seguono il naming di P4.

Archiviare non e' ripulire: la copia nel repo e la cancellazione dal KB sono due passi distinti, e
un documento lasciato in entrambi i posti continua a competere in retrieval con la propria versione
piu' recente. La mappa completa dei tipi documentali, con formati, gate e ciclo di vita, e' in
`docs/HARNESS-DOCS.md`; la storia della bonifica in `docs/archivio/triage_kb_2026-08-15.md`.

---

## Nota di implementazione per P8

Lo smoke **esiste** e gira con `npm run smoke` (`frontend/package.json:102`). Vive in
`frontend/scripts/smoke/`: `states.ts` elenca gli stati da aprire, `run.ts` li apre ed esegue le
asserzioni, `assertions.ts` le contiene, `calibrate.ts` ritara le soglie, `console-baseline.json`
tiene i pattern di console gia' noti. Non serve piu' nessuna deroga: i prompt riportano l'esito, e
se una slice non e' verificabile dallo smoke lo dicono con il motivo.

**Quello che lo smoke non copre, e che va dichiarato invece che dato per coperto.** I tre stati di
`states.ts` (`empty-project`, `empty-metamodel-tab`, `advanced-mode`) partono tutti da un progetto
creato ex novo da `createProject` (`states.ts:177`), che lo crea e poi ci naviga sopra: **nessuno
apre un progetto salvato in precedenza**. Lo smoke quindi non esercita mai `SaveManager.load` su uno
stato persistito, e non vede niente di cio' che riguarda migrazioni di `VersionFixer`, seed delle
view di default e normalizzazione degli stati salvati. Per quel perimetro la verifica resta manuale
finche' `states.ts` non impara ad aprire uno stato salvato. Rilevato il 2026-08-18 dalla discovery
di Fase 1 su `2.227 -> 2.228`, §3.1.
