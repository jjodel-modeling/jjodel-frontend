# Sessione 2026-09-26, simulatore (chat C-2026-09-26-1100, «Jjodel · Simulatore»)

Copia nel repo: `docs/sessioni/sessione_2026-09-26_simulatore.md` (ramo `simulation-engine`, arriva nel tronco col prossimo merge). Affianca `sessione_2026-09-26.md` della chat C-2026-09-25-1353: le due chat hanno lavorato in parallelo sul tronco.

## Stato a fine sessione

`simulation-engine` e `alfonso-frontend-jjtl` sono entrambi a `df9d7a5e0` (Status flip del merge 1615): tutto il lavoro del simulatore di oggi è nel tronco, nessuno scarto. Tronco avanti 13 su origin, non pushato. Gate sul merge `cc388d5dd`: typecheck 14 (§17), vitest 4837, build pulita, check:docs 4/4. Decisioni fino a R-SIM-66. Il pannello Simulation dice perché un input non ha candidati; le guardie leggono `x.[marked]` e `x.[tokens]`; il valutatore delle azioni esiste, puro e non cablato (`NO_SIM_ACTIONS`). In `~/jjodel-sim/frontend/scripts/smoke/` restano tre file `_tmp_b2_*` gitignorati (fixture della console, utili per le verifiche). La lane 1640 (chat dell'harness) era in pausa sul tronco durante il merge ed è stata liberata.

## Decisioni prese

- Il simulatore ha una sola chat proprietaria, questa (`C-2026-09-26-1100`); ogni prompt porta `Chat: C-2026-09-26-1100`.
- B2 come da R-SIM-39/43: le chiavi di ruolo delle azioni (`simAction`, `simEntry`, `simExit`) restano alla corsia C. Interpretazione in prova: `marked`/`tokens` su un elemento che non è un posto sono un difetto.
- Merge accorpati: 1840 con B2 (`4b70b5634`), 1315 con 1535 (`cc388d5dd`).
- R-SIM-57..63 (esiti delle guardie nel pannello): C1 + A + testo del discard, B rinviato alla traccia; motivo nella riga di stato con lista al clic; ricalcolo nel bridge sito per sito, allineato a `netRunStatus`; `title` in `Running`; `compileDefects` in `RunStart` e riga dei difetti riformulata; sorgente solo nel `title`; clamp a una riga.
- R-SIM-64: `else` anche su Petri, fratelli per `siblingKey`. R-SIM-65: le righe che compaiono stanno sopra i pulsanti. R-SIM-66 (emenda 65): un solo posto sotto i pulsanti per l'esito dell'ultima azione («Last step», interruzione, Reset rifiutato).
- Tolta, per il merge 1615, la clausola che vietava `decisions.md` modificato dai due lati: la sostituisce un probe sulle intestazioni.

## Bug risolti

- Il pannello non diceva mai perché una guardia bloccava (false e difetti identici, tutto `Deadlock` muto): lane 1315.
- Testo del discard falso («no transition accepted it» anche con guardia falsa): lane 1315.
- `else` su una transizione di Petri parsato come guardia e difettoso: lane 1535 (`resolveElse` unico per le due forme).
- Scatti di 17 e 24,5 px dei pulsanti: clamp (1315), righe sopra (1535), posto unico (1535, R-SIM-66).
- Icone a quadratini sui worktree (403 del font per `fs.allow`): diagnosticato qui, risolto dalla chat «Harness icons» (lane 1335).

## Bug nuovi / Todo

- **Media**: `validateProfile` accetta un ruolo derivato il cui `from` è off (ticket della chiusura 1840): per la corsia che cablerà i profili.
- **Media**: bag pre-R-SIM-38 che cambia classe evento senza avviso (`f6beda976`); ricorso su PEST SM di 3001 (Trigger di nuovo su `Transition.nextState`, corretto a mano).
- **Bassa**: `else` sugli archi di un fork/join fuso nel controllo di flusso ha `elseOf: null` (letto nel codice, non misurato).
- **Ticket**: `parseExpression` scarta i token finali; `Pointer_EOBJECT` in salvataggi vecchi; errore `failed to get project {project: null}` al caricamento, non indagato.
- **Processo**: tre volte un prompt è finito nella sessione sbagliata o in due sessioni; le guardie (Prompt-ID, precondizioni) hanno sempre fermato. Prima di incollare: `!pwd`. Il file di sessione unico non regge più chat parallele (vedi Prossimi passi).

## Documenti aggiornati

- `docs/decisions.md`: R-SIM-57..66.
- `docs/discovery/discovery_2026-09-26_sim_guard_outcomes.md` (`7abb57eaa`).
- `docs/log-inbox/simulation.md`: entry B2, 1315, 1535.

## Prompt generati per Claude Code

- `P-2026-09-26-1105` B2 ✅ (`81373fab0`, chiusura `61c5b98a0`), visiva passata.
- `P-2026-09-26-1240` merge ✅ (`4b70b5634`, flip `6aeda5de4`), visiva passata.
- `P-2026-09-26-1315` discovery ✅ (`7abb57eaa`) e Fase 2 ✅ (`fa56c14de`, chiusura `5a398eaee`), visiva passata.
- `P-2026-09-26-1535` ✅ (`b76d75cc9`, `f58456c63`, chiusura `172f408c1`), visiva passata (passo 5 solo dalla sessione).
- `P-2026-09-26-1615` merge ✅ (`cc388d5dd`, flip `df9d7a5e0`), visiva passata.
- `P-2026-09-25-1840` era già eseguito all'apertura (`a27e46e8d`, `89faeef25`).

## Prompt pendenti

Nessuno.

## Prossimi passi

1. Discovery della corsia C: dichiarazioni degli attributi di stato (R-SIM-19) e chiavi di ruolo delle azioni (R-SIM-52), con R-SIM-2 (niente sotto-oggetti nel bag) e i profili (R-SIM-47..56) come vincoli; il pannello ha già il posto per i difetti di compilazione (`compileDefects`).
2. Corsia che cabla i profili nel pannello (con il ticket di `validateProfile`).
3. Push del tronco a richiesta.
4. Regola da decidere per le chat parallele: `sessione_CORRENTE.md` con una sezione per chat attiva, ognuna sostituisce solo la propria.

## Info strutturali scoperte

- `~/jjodel-release` è il tronco e serve 3001; `~/jjodel` serve 3000 (`validation-skeleton`); `~/jjodel-sim` 3002; `~/jjodel-open` 3003. Il `node_modules` dei worktree è un symlink a quello di `~/jjodel` (P14).
- Il pannello Simulation non si iscrive alla versione del run: il memo `view` ricalcola solo su `tick` (azioni del pannello). Non ha modalità Basic/Advanced.
- `netRunStatus` valuta tutti gli input solo in `Deadlock`; in `Running` si ferma al primo con candidati.
- Dal bridge desktop i commit sul Mac vanno per osascript; `device_commit_files` con uno stagedPath già modificato dopo la prima scrittura può consegnare la versione vecchia: verificare sempre l'md5.

## Cronologia

Apertura: il prompt 1840 risultava già eseguito. B2 scritto e eseguito (guardie su σ, valutatore delle azioni), verifica su 3002 con la scoperta che il pannello non mostrava gli esiti; merge 1240 nel tronco con verifica su 3001, dove sono emersi PEST SM e le icone a quadratini (diagnosi del 403, passata a una chat nuova). Pomeriggio: discovery e Fase 2 degli esiti delle guardie (R-SIM-57..63), poi `else` su Petri e layout delle righe (R-SIM-64..66, con una correzione di rotta sull'interruzione), merge 1615 nel tronco dopo aver messo in pausa la lane 1640 dell'harness che committava sullo stesso tree.
