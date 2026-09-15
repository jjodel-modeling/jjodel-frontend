# Ratifiche 2026-08-02: campi Corregge e Causa, enforcement dell'identità del blocco

Analisi del report Claude Code sul task che introduce i campi `Corregge` e `Causa` nel formato entry di `docs/claude-code-log.md` (replicato in `CLAUDE.md`, `AGENTS.md`, `docs/PROTOCOL.md`) e restringe l'allowlist dello smoke rimuovendo l'esenzione `[role="dialog"]`. Integrata con le risposte alla Fase 1 del prompt di gate.

## Verifiche fatte in chat

- **origin fermo a `07cee5219`** del 30/07/2026 ("docs: log entry for the properties card review round"). Il push è pendente da tre giorni e adesso ha sopra anche questo lavoro. Resta il primo punto operativo.
- **`docs/PROTOCOL.md` non esiste su origin** (404 sul branch `alfonso-frontend-jjtl`): è materiale non ancora pushato, coerente con il punto sopra.
- **§21.3 su origin** portava l'intestazione "fill the three metrics honestly" e le tre metriche erano Regressioni, Modifiche fuori scope, Layer Impact Report. Con `Corregge` e `Causa` diventano cinque: la riformulazione dell'intestazione non è una deviazione opportunistica, è la correzione di un'affermazione che il task stesso rendeva falsa. **Ratificata.**
- **Il diffstat riconcilia con la narrativa**: due righe di template in `PROTOCOL.md`, le stesse due più regole e tassonomia in `CLAUDE.md`, `AGENTS.md` allineata con lo stesso conteggio, `states.ts` meno sei più otto.
- **La doppia verifica dell'identità è solida**: l'md5 riportato non è quello della stringa vuota, il che esclude il falso positivo del range `sed` che non aggancia niente in nessuno dei due file.

## Decisioni

**D1. Referente di `Corregge`: il timestamp del documento prompt.** Il campo esiste per essere greppabile, e la greppabilità richiede una chiave stabile. Le intestazioni delle entry sono data più tipo più testo libero, quindi non uniche. L'unico riferimento già presente in ogni entry e di fatto univoco è il nome del documento prompt col timestamp al minuto. Formato: timestamp, opzionalmente seguito dalla descrizione breve tra parentesi per la leggibilità umana. **Confermata dalla Fase 1**: §21.3:891 prescrive il nome del documento prompt, il cui formato è fissato dall'ultimo campo dello stesso blocco. Nessun conflitto. Resta vero che la regola segue il naming dei documenti prompt: se cambia quello, cambia la chiave.

**D2. L'identità byte a byte diventa un gate eseguibile.** Oggi è garantita da un comando lanciato a mano una volta. Per la coppia `CLAUDE.md` / `AGENTS.md` il rischio è basso perché c'è il generatore; per la coppia con `PROTOCOL.md` non esiste niente, ed è lì che la deriva è probabile, perché sono due file che si toccano in momenti diversi per ragioni diverse. Uno script nella stessa batteria di `typecheck:scripts` e `smoke` trasforma un vincolo che dipende da chi si ricorda in un vincolo che rompe la build. Lo stesso script fa da linter sul log: vocabolario chiuso di `Causa` e formato di `Corregge`.

**D3. Il linter è retro-compatibile per soglia di data.** Valida solo le entry con data maggiore o uguale al 2026-08-02. Senza soglia produrrebbe 23 falsi errori su `Smoke visivo` e 25 su `Corregge` / `Causa`; con soglia, una entry in scope. Coerente con la scelta di non back-fillare.

**D4. `PROTOCOL.md` porta il template più un puntatore a §21.3, non le regole.** Duplicare le regole creerebbe un secondo punto di verità e quindi un secondo punto di deriva, che il check non copre perché confronta solo il blocco template. Il puntatore va fuori dal blocco identico. **Precisata dalla Fase 1**: il puntatore esiste già a `PROTOCOL.md:106`, quindi si estende quello, non se ne aggiunge un secondo.

**D5. `AGENTS.md` va verificata, non assunta.** **Risolta dalla Fase 1**: generatore deterministico, `AGENTS.md` in HEAD byte-identica alla proiezione corrente, working tree pulito dopo la rigenerazione di verifica. Conseguenza operativa permanente: ogni modifica a `CLAUDE.md` si fa su `CLAUDE.md` e si propaga rigenerando, mai patchando `AGENTS.md` a mano.

**D6. Il prompt correttivo porta già scritto il bersaglio di `Corregge`.** Il campo sposta l'asserzione da autodichiarazione a testimonianza del successore, che è il guadagno vero, ma introduce un modo nuovo di fallire: il successore deve riconoscersi come correzione. Chi lo sa con certezza è questa chat, che scrive il prompt, non Claude Code che lo esegue. Regola per il nostro lato, da aggiungere alle custom instructions (testo pronto in fondo).

**D7. Nessun back-fill dentro il campo.** Un link ricostruito è un'inferenza, un link compilato dal successore è una testimonianza, e mescolarli nello stesso campo distrugge il campo. Se serve una baseline sulle venti entry attive, si fa una volta sola in un documento separato ed etichettato come ricostruzione.

**D8. L'esenzione `[role="dialog"]` non torna.** Il no-op odierno regge perché nessuno dei tre stati dello smoke apre una modale: era rischio latente, non mascheramento attivo, e il report lo qualifica correttamente. Messo a verbale l'intento: quando aggiungeremo uno stato con modale, la modale viene misurata come il resto dell'albero. Se emergerà rumore, si affronta allora con un'esenzione mirata a quello stato, mai globale.

## Risposte alla Fase 1 (discovery del 2026-08-02)

Il finding decisivo: esiste già una entry in scope (`2026-08-02 — fix(jodie)`) i cui valori reali sono `Corregge: 2026-08-01 13:31 (prompt jjodie_window_default_bottom_left)` e `Causa: (a)`. I due regex naturali la farebbero fallire su entrambi i campi. Rosso al primo run per difetto del gate, non del log.

**D9. Regola unica per entrambi i campi: token canonico in posizione zero, coda libera.** `Corregge` accetta un'annotazione dopo il timestamp, e `Causa` accetta un'annotazione dopo il token, con la stessa forma di regex e due vocabolari distinti. Quello che la macchina legge è l'ancora iniziale; la coda è affordance umana e costa zero alla greppabilità. Non si vincola la forma dell'annotazione (parentesi, virgolette, prosa): sarebbe un secondo modo di far fallire una entry corretta, cioè esattamente l'errore che la discovery ha intercettato. Sulla coda di `Causa` c'è un guadagno ulteriore: permette di scrivere onestamente "prevalentemente (a), in parte (c)" invece di forzare una scelta falsa, che è la stessa preferenza per l'onestà sulla conformità già dichiarata in §21.3.

**D10. Token di `Causa` canonico e severo: `(a)`, non `a`.** Qui la raccomandazione della discovery viene respinta. Un vocabolario chiuso con due grafie ammesse per valore ha 2N membri e scarica la normalizzazione su ogni consumatore futuro, permanentemente. Il costo della severità è un run rosso e dieci secondi di correzione; il costo della tolleranza è debito che non si estingue. La legge di Postel è sbagliata per un dataset che si intende aggregare. La convenzione si fissa adesso, con una entry esistente, al costo minimo che avrà mai.

**D11. Sentinella `Corregge`: si tiene l'em dash U+2014, con obbligo di diagnostica.** È il carattere più fragile del formato e i modi tipici di sbagliarlo (trattino, en dash, doppio trattino) sono invisibili a occhio. Il messaggio di errore del linter deve dichiarare il codepoint atteso e quello trovato. Non si accettano varianti: sarebbe D10 al contrario. Motivo per cui la si tiene invece di sostituirla con una parola: è già atterrata in tre file, è coerente con lo house style, e una volta che il linter esiste la fragilità è limitata a un run rosso. Se un giorno vediamo davvero una sentinella sbagliata nel log, si cambia in una parola invece di continuare a difenderla. Nota collaterale: la chat di progetto ha una regola che vieta gli em dash in output, quindi non può scrivere la sentinella correttamente in un prompt; oggi è irrilevante perché le entry le scrive Claude Code.

**D12. §17 si allinea tutto, non solo il comando nuovo.** La lista dei gate a `CLAUDE.md:744-747` è già stale (mancano `smoke`, `smoke:calibrate`, `typecheck:scripts`). Aggiungere solo il quarto comando produce una lista che sembra aggiornata e non lo è, che è peggio di una lista palesemente vecchia: la seconda viene aggiustata, la prima no. È dentro scope perché `CLAUDE.md` è già nel DOVE per quel tipo di edit. Vincolo: i tre nomi mancanti si leggono da `package.json`, non si scrivono a memoria.

**D13. Nome e collocazione confermati**: `frontend/scripts/gates/check-docs.ts`, script npm `check:docs`. Sull'include di `typecheck:scripts` (oggi `smoke/**/*.ts`): si prova prima ad allargare a `scripts/**/*.ts`, perché un glob per sottocartella lascia scoperto il prossimo script che nasce altrove, che è la stessa classe di buco latente dell'esenzione dialog. Se allargando emergono errori preesistenti in altri script, non si aggiustano in questo task: si ripiega su `gates/**/*.ts` e si riportano come voce di backlog.

**D14. `AGENTS.md` resta fuori dal Check A.** Il generatore la copre e includerla sarebbe ridondante, come osservato nel report. Il rischio residuo non è la deriva del blocco, è che qualcuno editi `CLAUDE.md` e non rigeneri. Il check che lo chiuderebbe è diverso ("`AGENTS.md` uguale alla proiezione corrente") e resta fuori da questo task perché richiede un dry-run del generatore o una directory temporanea. Registrato in backlog come **Check C**.

## Backlog aperto da questa linea di lavoro

- **Check C**: verifica che `AGENTS.md` sia la proiezione corrente di `CLAUDE.md`, non solo che il blocco sia identico. Richiede dry-run del generatore.
- **Ordine del log**: `docs/claude-code-log.md` non è in ordine cronologico. La regola di archiviazione in `CLAUDE.md` dice di spostare le più vecchie mantenendo le ultime 20: su un file non ordinato è ambigua e può archiviare le entry sbagliate. È un difetto del protocollo, non del linter.
- **Validità retroattiva per campo**: `Smoke visivo` ha un confine di introduzione diverso da `Corregge` e `Causa`. Validare tutti i campi richiede un registro "campo introdotto il", non una soglia unica. Idea da valutare, non urgente.
- **Errori di typecheck in script fuori da `smoke/`**, se emergono allargando l'include.
- §17 stale è sintomo: nessuno verifica che la documentazione dei gate corrisponda ai gate reali. Candidato naturale a diventare parte di `check:docs` in futuro.

## Nota di metodo (per il paper)

`Esito` è autodichiarato dallo stesso agente nello stesso istante, senza controfattuale: è strutturalmente incapace di rilevare "credevo di aver finito e non avevo finito". `Corregge` sposta l'asserzione su un agente diverso, in un momento diverso, con evidenza nuova. Non migliora la qualità del dato, ne cambia la categoria epistemica. Quello che diventa misurabile non è quanti task falliscono, ma quanti task sono stati creduti completi e non lo erano, che è la quantità di interesse per valutare il metodo e finora non era osservabile. Il caso che lo rende evidente è la catena di rilavorazione in cui ogni anello si è autodichiarato ✅.

Secondo elemento, emerso dalla Fase 1: ordine non cronologico del log e confini di validità per campo si sono visti solo scrivendo un parser. Formalizzare un formato che finora era rispettato a occhio ne ha rivelato due difetti strutturali prima ancora che il gate esistesse. Il valore del gate non è solo quello che impedirà in futuro, è quello che ha già fatto emergere in fase di specifica.

## Domande aperte

- I due test skipped dello smoke: risposta nel discovery report, da leggere e riportare in sessione.

## Prompt generati per Claude Code

- `2026-08-02_prompt_gate_protocol_identity_log_linter.md`. Fase 1 ✅ eseguita, report in `docs/discovery/discovery_2026-08-02_gate_protocol_identity_log_linter.md`. Fase 2 autorizzata con le decisioni D9-D14.

## Prossimi passi

1. **Push** del branch, invariato dal 30/07.
2. Fase 2 del prompt di gate.
3. Aggiungere D6 alle custom instructions del progetto.
4. Backlog invariato: conferma esiti serie A INSTANCES e verifica post-C0, mockup INSTANCES per C3/C4, rehydration viewpoint selector, sessione roadmap sull'artefatto storia.

## Testo pronto per le custom instructions (D6)

Da aggiungere alla sezione "Regole per Claude Code (VS Code Plugin)", sottosezione Prompt Log:

> Quando un prompt corregge il lavoro di un task precedente, il prompt stesso deve dichiarare esplicitamente il bersaglio del campo `Corregge` (timestamp del documento prompt corretto). Il riconoscimento della natura correttiva spetta alla chat che genera il prompt, non a Claude Code che lo esegue: un successore che non si riconosce come correzione lascia la catena invisibile esattamente come prima dell'introduzione del campo. Il campo va compilato anche quando il task corretto si era dichiarato ✅, perché è proprio quel caso a rendere greppabile il successo al primo colpo.
