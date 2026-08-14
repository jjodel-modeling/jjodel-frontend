# Delta cruscotto v30 -> v31

Seed `p20260813a` (chiave `jjodel-trace-v30`, 77 voci) verso `p20260813b` (chiave
`jjodel-trace-v31`, **90 voci**). Tredici voci nuove, sei aggiornate, nessuna rimossa.
Distribuzione risultante: 54 chiuse, 21 in coda, 13 idee, 2 in lavorazione.

Delle tredici nuove, solo due vengono dalla sessione del 13 agosto. Le altre undici
erano già scritte nel repo e non nel cruscotto: è il risultato di un confronto fra i due
registri che nessun reseed aveva mai fatto.

## Lo stato, misurato

`origin/alfonso-frontend-jjtl` è a **`93800c7`**, due commit sopra il tip che il giro
precedente aveva registrato. Entrambi sono di sola documentazione e già pubblici:
`9031c6ce6` (R-RAIL-43, l'emendamento a R-RAIL-27, il bundle di trasporto cancellato) e
`93800c719` (l'addendum al report di triage).

Il fix del booleano obbligatorio **non è su origin**. La misura, non il racconto: `grep`
di `requiredBooleanInitialValues` su `frontend/src` del clone dà zero occorrenze, con
controllo positivo `_forceConformity` a cinque, quindi il silenzio è un risultato e non
un comando che non ha girato.

## Le due voci della sessione

| Voce | Stato |
|---|---|
| Booleano obbligatorio senza valore nello slot M1 | in lavorazione |
| La forma dei valori primitivi negli slot M1 | idea |

La prima porta la regola (`EBoolean` con `lowerBound >= 1` porta `false` nello slot M1),
il punto di implementazione, e soprattutto la ragione per cui il fix si è spostato: il
punto di aggancio che il buon senso suggeriva, `Constructors.DStructuralFeature`, è quello
dove la condizione è falsa il cento per cento delle volte, perché lì `lowerBound` vale
sempre 0. Ne esce una regola di lettura del modello che vale ben oltre questa voce: nel
modello Jjodel le proprietà di una feature si stabilizzano per transizioni successive, non
alla nascita, quindi ogni regola scritta come «quando si crea X con la proprietà P» va
tradotta in «quando P diventa vera su X».

**Una lacuna trovata registrando la voce**: la regola non è in `docs/decisions.md`.
`command grep -c -i` su `booleano` e `EBoolean` dà 0 con exit 1, controllo positivo su
`R-RAIL-43` a 2 con exit 0; l'ultimo id a registro resta il 43. Vive nel solo memo del
Project Knowledge. È la stessa specie della lacuna che con R-RAIL-19 produsse un hard stop
reale al passo 4 dell'arco 1, e un prompt futuro che la citasse come autorità non la
troverebbe.

## Le tre voci della coda dell'arco 2

| Voce | Stato |
|---|---|
| R-RAIL-43, un rinvio che ripete una motivazione la rimette alla prova | chiusa |
| Emendamento a R-RAIL-27, anche le letture git dal bridge mentono | chiusa |
| I due orfani di `.git/_to_delete/` non sono contenuto perso | chiusa |
| Rotazione del ventiduesimo lotto del log | in coda |

L'emendamento a R-RAIL-27 è il più utile dei tre, perché cambia come si leggono i report
prodotti da qui: `core.excludesFile` è vuoto su entrambe le macchine e non discrimina; a
cambiare è `HOME`, da cui git risolve il path di default degli esclusi. Riprodotto sul Mac
spostando la sola `HOME`. Conseguenza operativa: **un `git status` dal bridge sovrastima
sempre i file non tracciati**. Due voci di backlog nate così sono cadute, la cartella
`_to_delete/` nella root e `.claude/settings.local.json`.

La rotazione è dovuta e non eseguita: il log attivo porta 23 intestazioni contro le 20 di
soglia e l'archivio ne porta 749, gli stessi di prima delle due entry del 13. Era il commit
2 di un prompt il cui commit 1 è su origin, e la sua stessa entry lo dichiara.

## Le sei voci di backfill dal repo

Il confronto fra `docs/TECH-DEBT.md` e il seed ha trovato sei debiti aperti nel repo che
non erano mai entrati nel cruscotto: la portata parziale del restyle del tree pane (11/8) e
i cinque nati a coronamento del passo 4 dell'arco 2 (12/8), cioè la firma del guscio che
copre tre kind su undici, il fondo di `.jj-context-bar` che nessun consumatore vuole,
`.props-header__icon` senza consumatori, la difformità della sezione `NODE`, e la quarta
palette entity globale e non scopata.

Il meccanismo della deriva è visibile e vale la pena scriverlo: i debiti aperti **dentro**
un passo entrano nel cruscotto quando si registra il passo; quelli aperti **a coronamento**
di un passo restano nel solo repo, perché il racconto della sessione li nomina come coda e
non come voci.

La deriva corre anche nell'altro verso, ed è la tredicesima voce nuova: «Unificazione delle
palette entity pannello/tree» è ancora a priorità media in `TECH-DEBT.md` e descrive uno
stato superato, mentre nel cruscotto è chiusa dall'11 agosto perché R-RAIL-30 ha sostituito
entrambe le palette con una scala nuova. Le altre due chiuse nel repo portano correttamente
«Priorità: chiusa».

## Voci aggiornate (6)

| Voce | Cambio |
|---|---|
| Verifica ahead reale e push del ramo | chiusa -> **in coda**, la coda si è riformata |
| Esecuzione dal bridge Cowork | esteso alle letture, col meccanismo misurato |
| I tre preamboli mancanti dell'archivio | da qui nasce R-RAIL-43 |
| Riallineamento del sorgente jsx del cruscotto | il divario sale a dodici reseed |
| Arco 3, il form dell'inspector | due voci registrate gli stanno addosso |
| Cruscotto di tracciabilità in gallery | nota di metodo del reseed v31 |

## Un errore di titolo, riportato invece che corretto

La voce di `TECH-DEBT.md` sulla firma del guscio si intitola «copre due kind su undici»
mentre il suo corpo ne conta tre più otto. Il titolo è rimasto indietro rispetto al proprio
testo. La voce del cruscotto porta il conteggio del corpo, che è quello misurato, e dichiara
la divergenza invece di assorbirla in silenzio.

## Verifica prima della pubblicazione

Array `SEED` estratto per bracket matching dal bundle pubblicato, con **round-trip
verificato prima di ogni modifica**: `JSON.stringify` dell'array riletto è identico byte per
byte alla porzione originale, quindi la riserializzazione non è una fonte di rumore.
Modificato come dati, riserializzato e reinnestato; i **199.909 caratteri di codice fuori
dall'array sono identici prima e dopo**, neutralizzate le sole tre costanti e la
descrizione dell'artefatto. Controlli di integrità sul seed nuovo: vocabolari di tipo,
stato e priorità chiusi, concern dentro la tassonomia, nessuna dipendenza orfana, nessun
ciclo nel DAG.

Caricamento headless in Chromium: `#root` a 472.291 caratteri, grafo disegnato con 21 path,
chiave `jjodel-trace-v31` creata, intestazione a 90 voci totali, 36 aperte, 32 eseguibili
ora, 54 chiuse. Un solo errore in console, la richiesta a `fonts.googleapis.com` che il
sandbox blocca: **controllo negativo eseguito**, il bundle v30 caricato allo stesso modo
produce lo stesso errore e nessun altro, quindi non è una regressione di questo giro.
