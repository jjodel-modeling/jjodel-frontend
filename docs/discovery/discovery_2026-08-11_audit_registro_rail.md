# Discovery — passo 6: audit del registro R-RAIL

**Data**: 2026-08-11 · **Fase**: 1 del passo 6 · **HEAD**: `019dbc318`

## 0. Obiettivo

Misurare lo stato reale del registro R-RAIL in `docs/decisions.md` distinguendo le **voci
definite** dalle **citazioni in prosa**, per iscrivere le lacune senza sovrascrivere nulla.
In più: rilevare i formati da ricalcare (`docs/decisions.md`, `docs/TECH-DEBT.md`, prima entry
del log) e verificare l'affermazione sul caricamento di IBM Plex Mono che la nota (15)
dell'entry dell'11 agosto dà per assente.

## 1. File letti

- `docs/decisions.md`, sezione «Arco rail destro — preset 2a (dal 2026-08-10)», `:273-392`
- `docs/TECH-DEBT.md` per intero (34 righe, tre sezioni)
- `docs/claude-code-log.md`, prima entry · `docs/claude-code-log-archive.md`, conteggi
- `docs/sessioni/claude_sessione_2026-08-10_4.md`, «Le ventisei ratifiche», `:42-69`
- `frontend/src/styles/tokens/_typography.scss` `:11-90`

## 2. Findings

### 2.1 Stato del registro: otto lacune, non una

| Insieme | Numeri |
|---|---|
| voci definite | 1..13, 19, 23, 24, 25, 26 |
| solo citate nella prosa di altre voci | 16 (`:385`), 18 (`:358`), 22 (`:364`) |
| assenti del tutto | 14, 15, 17, 20, 21 |

Nessuna delle otto è già definita: la condizione di stop 2 non scatta. La sezione è ordinata in
modo crescente (1..13, 19, 23..26), quindi la regola di posizione si applica: 14..18 fra
R-RAIL-13 (`:345`) e R-RAIL-19 (`:346`), 20..22 fra R-RAIL-19 (`:356`) e R-RAIL-23 (`:357`),
27 dopo R-RAIL-26 che chiude a `:392`.

Forma delle voci: `- **R-RAIL-N** (2026-08-10) — testo`, continuazioni rientrate di 2 spazi,
wrap effettivo **98** colonne.

### 2.2 I testi delle otto sono nel checkpoint, verbatim

`docs/sessioni/claude_sessione_2026-08-10_4.md:61-69`, come righe di tabella
`| R-RAIL-N | testo |`. Corrispondono ai testi del prompt carattere per carattere; l'unica
differenza è il punto finale, che il prompt aggiunge e che è lo stile delle voci esistenti di
`decisions.md`. La condizione di stop 3 non scatta.

### 2.3 Formato di `docs/TECH-DEBT.md`

Modello: la voce di R-RAIL-25, `:23-33`. Campi nell'ordine `**Registrato:**`, `**Origine:**`,
`**Stato attuale:**`, `**Fix strutturale raccomandato:**`, `**Priorità:**`, `**Effort
stimato:**`, `**Riferimenti:**` con lista puntata. Le sezioni sono separate da `---` su riga
propria; il file non chiude con un separatore.

### 2.4 La nota (15) dell'entry dell'11 agosto è falsa

`frontend/src/styles/tokens/_typography.scss` carica entrambi i font da Google Fonts:

- `:81` — `@import url('…family=Inter:ital,opsz,wght@…&display=swap');`
- `:84` — `@import url('…family=IBM+Plex+Mono:wght@400;500;600&display=swap');`

Quindi IBM Plex Mono **è** dichiarato, e l'affermazione «non è caricato da nessuna parte» non
regge. Due precisazioni rispetto al prompt del passo 6: i blocchi `:root { }` che precedono gli
`@import` sono **cinque** (`:11`, `:27`, `:41`, `:54`, `:64`), non quattro; e Inter sta **tre**
righe sopra, non due. Resta aperta la questione di validità: per specifica CSS un `@import` che
segue una regola di stile viene scartato, quindi il caricamento dipende da come il bundler
tratta quei due statement. Non verificabile staticamente: serve DevTools.

Nota accessoria: il commento di sezione a `:72` dice «Load Inter and JetBrains Mono», ma
l'import è di IBM Plex Mono. JetBrains Mono è caricato altrove, da `frontend/index.html:11`.

**Causa dell'errore, agli atti**: la grep che al passo 4 doveva cercare `plex|fonts.googleapis`
sotto `frontend/src` è stata scritta con i `--include=*.ts` non quotati; zsh ha tentato di
espanderli, ha fallito con `no matches found` e non ha eseguito la grep. L'assenza di output è
stata letta come esito negativo invece che come comando fallito.

### 2.5 Log

Attivo **20**, archivio **734**. La prima entry porta gli 11 campi nell'ordine atteso, da
`**Prompt**` a `**Prompt document name**`.

## 3. Dipendenze e rischi

- Le prose di `:358`, `:364` e `:385` citano 16, 18 e 22: iscrivere le voci le rende
  risolvibili senza toccarle. Nessun rimando da aggiungere.
- R-RAIL-16 si auto-dichiara «superata per l'arco 1 da R-RAIL-26»: entra nella sezione attiva
  come le altre, non in «Superate», perché la superficie è parziale e la voce resta la fonte
  del vincolo sul chip di firma.
- La voce di backlog sugli `@import` resta **aperta con verifica a carico di Alfonso**: se le
  due richieste partono, si chiude senza debito; se non partono, il difetto è di tipografia
  globale e non del solo suffisso mono.

## 4. Domande aperte per Alfonso

- Priorità ed effort delle due voci di backlog: le compilo per analogia con la voce R-RAIL-25
  (media / bassa), correggibili in un giro successivo.
- Se la verifica DevTools dice «zero richieste», la voce sugli `@import` cambia natura: da
  debito di tipografia a bug aperto, e va promossa fuori dal backlog.
