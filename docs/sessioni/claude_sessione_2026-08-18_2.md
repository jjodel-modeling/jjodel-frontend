# Sessione 2026-08-18 (2) — Il log smette di essere la quarta copia del ragionamento

**Superficie**: Cowork, con la cartella del repo connessa dal bridge a metà sessione. Da quel momento
l'architetto ha scritto direttamente sul disco di Alfonso, non solo generato prompt.
**Branch**: `alfonso-frontend-jjtl`. **Origin verificato a `eb14a614c`**, working tree pulito, zero
ahead e zero behind.
**Questo checkpoint sostituisce** `sessione_CORRENTE.md` (versione 2026-08-18 delle 11:27), di cui
riporta le parti ancora vive.

**Gap di processo da sanare**: la versione delle 11:27 non è mai stata archiviata in
`docs/sessioni/`, dove l'ultimo file è `claude_sessione_2026-08-17_3.md`. I fatti che conteneva
sopravvivono comunque nel repo (R-IRN-9 e R-IRN-10 in `decisions.md`, il discovery report del 18/8,
le entry di log); si perde la sintesi, non le fonti.

---

## Stato a fine sessione

Due commit, entrambi su origin, entrambi con gate verdi.

| Commit | Contenuto | Verifica |
|---|---|---|
| `461dba3e6` | tetto di 500 caratteri su `Notes`, soglia di rotazione a 40, Check C nel gate | gate 5/5, nessuna superficie visiva |
| `eb14a614c` | `HARNESS-DOCS` 1.1, undici sostituzioni | nessun gate lo legge |

Gate misurati sul primo commit: typecheck 14 nell'albero da `git archive` (equivalente ai 33 su
macOS, i 19 di casing non esistono su filesystem case-sensitive), vitest 1315 passed con le nove
suite rosse note, build exit 0, `check:docs` 3/3 con 0 warning, `check:agents` pass su entrambi i
file proiettati.

**Il primo commit è stato rifatto.** Era passato come `4f11213ee` con la lista dei file al posto del
messaggio, perché il `--` della pathspec era finito dove andava il `-m`. Amend più
`push --force-with-lease` eseguiti da Alfonso pochi minuti dopo, con la finestra ancora stretta.
`4f11213ee` non esiste più.

---

## Decisioni prese

**La soglia di rotazione del log passa da 20 a 40, e il tetto è sul contenuto dell'entry.** La
domanda iniziale era 20 contro 40. La misura ha mostrato che era la manopola sbagliata: il log
attivo pesava 135 KB su 26 entry, circa 33k token, con mediana di 4242 byte per entry e tre `Notes`
sopra i 6000 caratteri, ciascuna su una riga sola. A quel formato 40 entry costerebbero 42k token a
ogni apertura di sessione. Con l'entry limitata il costo scende a un quarto e la rotazione passa da
ogni tre giorni a ogni sei.

**Il tetto è 500 caratteri sul solo campo `Notes`**, con obbligo di spostare il ragionamento nel
discovery report, nel memo o nel file di sessione, e di citarne il nome. Il log torna a essere
l'indice che punta agli altri tre documenti invece della loro quarta copia.

**Il cutoff è `2026-08-19`, e non è prudenza.** Le 26 entry già in log ne contengono tre da 6393,
7485 e 7946 caratteri, e il log è append-only. Senza cutoff il gate sarebbe diventato rosso al primo
run su entry che il log stesso vieta di riscrivere, ripetendo l'incidente dei campi `Corregge` e
`Causa` di agosto. Il gate aveva già il pattern (`LINT_FROM_DATE`): si è imitato, non inventato.

**La soglia vive in un posto solo.** `CLAUDE.md` §21 la cita ma non la ripete: dice
«the rotation threshold is set in `docs/PROTOCOL.md` P9, not here». `HARNESS-DOCS` §5 ammette una
sola duplicazione, il blocco di formato, perché un gate la verifica byte a byte; ogni altra è un
difetto. Aggiungere una casa in più al numero, nel commit che ne toglieva le copie vecchie, si
sarebbe smentito da solo.

**Il pannello di simulazione è parcheggiato, non chiuso.** Alfonso ha cose da aggiungere o
modificare. La condizione di riapertura non è ancora scritta: va riempita, perché «chiuso per ora»
senza contenuto dichiarato è esattamente lo stato che questa giornata ha passato a smontare. Il
precedente giusto è D19, rimandata con condizione di riapertura esplicita.

**L'architetto scrive direttamente sul repo.** Con la cartella connessa dal bridge, `CLAUDE.md` e
`HARNESS-DOCS.md` sono stati modificati senza passare da Claude Code. È l'eccezione già prevista da
`HARNESS-DOCS` §7, non la nuova norma, e vale per i documenti di cui §2 e §5 dichiarano l'architetto
come produttore. Il codice resta di Claude Code.

---

## Bug e difetti trovati

**Alta**

1. **L'invariante 7 di `HARNESS-DOCS` §12 scriveva la soglia in lettere**, «superano venti», nella
   sezione che il documento presenta come le sette righe che reggono tutto il resto. Nessuna ricerca
   globale su `20` la trovava. Corretta in 1.1. Lezione: una ricerca numerica non è una ricerca
   completa, e R-RAIL-28 vale anche per i numeri scritti a parole.
2. **`HARNESS-DOCS` §4.5 conteneva una terza copia del blocco di formato**, citata verbatim e non
   coperta dal gate, che confronta solo `CLAUDE.md` e `PROTOCOL.md`. Sarebbe rimasta l'unica delle
   tre a divergere. Allineata.
3. **`HARNESS-DOCS` §4.4 bloccava il prompt J1 senza motivo**: diceva «o si iscrivono, o il prompt
   non va eseguito» riferito a R-J, iscritta il 18/8 con R-J1..R-J7. Corretta, con la nota che J1 va
   comunque riletto contro R-J2, emendata in ratifica, e contro R-J7, che nel memo del 14 agosto non
   esisteva.

**Media**

4. **Le custom instructions del progetto restano sbagliate su due fatti operativi**: dicono
   `http://localhost:3001/` e «oltre le 20 entry». Non stanno nel repo, quindi nessun commit le
   tocca, ed entrano nel system prompt di ogni chat del progetto. Pesano più dei file corretti oggi.
5. **La copia delle sessioni in `docs/sessioni/` si sta saltando**: nessun file per il 18/8.
6. Ereditati e invariati: drag&drop di un `.jjodel` sulla dashboard, mai eseguito; arrotondamento al
   resize, mezzo controllo dal 15/8; `console-baseline.json` con il pattern che A4 dà per migliorato;
   `CLAUDE.md` §7.2 con quattro `var(--accent)` residui.

---

## Documenti aggiornati

- `CLAUDE.md`: riga `**Notes**` del blocco §21.2, più la nota di budget in §21 con le cifre datate
  al 18/8 e il puntatore a P9.
- `docs/PROTOCOL.md`: stessa riga in P9, byte-identica, e soglia da 20 a 40.
- `frontend/scripts/gates/check-docs.ts`: Check C, con `collectNotesSpans` separato e telemetria.
- `AGENTS.md`: rigenerato con `gen:agents`, mai a mano.
- `docs/HARNESS-DOCS.md`: 1.1, undici sostituzioni.
- Project Knowledge: `HARNESS-DOCS.md` sostituito, `contesto_progetto.md` riconsolidato,
  `sessione_CORRENTE.md` sostituito da questo file.

## Prompt generati

| Prompt | Esito |
|---|---|
| `claude_2026-08-18_1407_prompt_tetto_entry_log_e_soglia_40.md` | ✅ eseguito, hard stop rispettato, due domande riportate correttamente |

## Prompt pendenti

- `claude_2026-08-14_1530_prompt_J1_walker_jjel_modulo_puro.md`: sbloccato, **da riscrivere o
  rileggere** contro R-J2 emendata e R-J7 prima di eseguirlo.

---

## Prossimi passi

1. **Riempire la condizione di riapertura del pannello di simulazione**: cosa Alfonso vuole
   aggiungere o modificare. Finché è vuota, il fronte è parcheggiato senza contenuto.
2. **Correggere le custom instructions del progetto**: porta 3000, soglia 40. Solo Alfonso può.
3. **Fronte `activeViewpoint` a 0..1**, preceduto da una discovery read-only sul corpus persistito
   che serva insieme questo fronte e il prerequisito del ritiro del seed. Tocca core, richiede Layer
   Impact Report.
4. **Backlog del registro**: le decisioni delle serie D su forme, simboli e dashboard non sono mai
   arrivate in `docs/decisions.md`, mentre R-B, R-SIM, R-J e R-MK ci sono andate dritte. È il debito
   di registro più vecchio aperto.
5. Ereditati: discovery Options; slice 2 del collasso IR-nativo; promozione del contratto della
   taglia ad addendum della v1.2; i due controlli visivi da trenta secondi.

---

## Info strutturali scoperte

- **La soglia praticata era 55, non 20.** 799 entry archiviate in 23 lotti fanno circa 35 entry per
  lotto; se ogni rotazione ne lascia 20, il log arrivava a 55 prima di scattare. La regola diceva 20
  da cinque mesi e non ha mai descritto la pratica, perché nessun gate la controlla.
- **`check-docs.ts` non impone il conteggio delle entry.** Verifica il formato dal 2026-08-02 in poi
  e risolve i nomi dei prompt su attivo più archivio, quindi archiviare non perde niente di ciò che
  il gate controlla.
- **Byte contro caratteri.** Le misure divergevano di circa l'uno per cento fra chat ed esecutore:
  `wc -c` conta byte, `len()` su stringa conta caratteri, e un file pieno di trattini lunghi, accenti
  ed emoji ha circa 1300 caratteri multibyte su 26 entry. Il Check C misura `Notes` in caratteri e
  la telemetria in byte, con le unità dichiarate.
- **`parseEntries` tiene solo la prima riga di un campo** («first occurrence wins»), quindi un check
  di lunghezza basato sulla mappa dei campi si aggira scrivendo la nota su più righe. Da qui
  `collectNotesSpans`, verificato con controllo positivo su fixture: nota multiriga con prima riga da
  41 caratteri e span 764, intercettata.
- **`gen:agents` e i due gate girano senza `node_modules`.** `gen:agents` è
  `node ../scripts/generate-agents.mjs`, `check:docs` e `check:agents` usano
  `--experimental-strip-types`. Si possono eseguire dalla VM del bridge con node nudo, senza toccare
  le dipendenze installate su macOS.
- **I lock di git sul mount si ricreano a ogni comando.** Vanno spostati in `_to_delete/git-locks/`
  prima di ogni invocazione, e l'ultima azione prima di restituire il controllo deve essere lo
  spostamento, senza altri comandi git dopo, altrimenti il git nativo sul Mac trova un `index.lock`
  che non può rimuovere.
- **Due thread intrecciati spiegano i fronti spariti dall'indice.** `sessione_CORRENTE.md` si
  sostituisce e tiene «le parti ancora vive» del proprio thread: con due sessioni in parallelo, i
  fronti dell'altro thread escono dall'indice senza che nessuno lo decida. È così che il pannello di
  simulazione (R-SIM) e l'endpoint `container` (R-B) sono usciti da `contesto_progetto.md`.

---

## Cronologia

Apertura sul riordino delle priorità. La lettura dei due documenti del KB mostra che sono costruiti
uno sull'altro e che il più recente eredita un punto cieco: due fronti aperti fra il 16 e il 17
agosto non compaiono in nessuno dei due. Il riconsolidamento resta la prima mossa, ma con perimetro
più largo di quello dichiarato.

La voce sulla rotazione del log si rivela poggiata su una premessa falsa. La rotazione non era
rinviata quattro volte: era stata eseguita il 17 agosto, ventitreesimo lotto, e le 26 entry erano un
solo giorno di ricarica. La domanda «20 o 40» viene posta e la prima risposta, 40, è data senza
misurare. La misura successiva la ribalta e la riformula: il costo non è il numero di entry ma
l'assenza di un tetto sull'entry, con una mediana da 1000 token e note da 2000 parole che duplicano
il discovery report.

Prompt generato, eseguito con hard stop pulito, due domande riportate invece che decise
dall'esecutore. Il controllo positivo su fixture è la parte migliore dell'esecuzione: `0 in scope` è
un silenzio, e trattarlo come tale invece che come un pass è la disciplina che ha dimostrato
l'utilità dell'helper separato.

A metà sessione Alfonso connette la cartella del repo, e la chat passa da generare prompt a
scrivere. Correzione della nota in `CLAUDE.md`, rigenerazione di `AGENTS.md` col generatore, gate
rieseguiti dalla VM. Il commit passa con il messaggio sbagliato e viene rifatto con amend nella
finestra stretta. `HARNESS-DOCS` va a 1.1, e la ricerca globale che l'esecutore aveva dichiarato
completa si scopre parziale: l'invariante 7 scriveva la soglia in lettere.
