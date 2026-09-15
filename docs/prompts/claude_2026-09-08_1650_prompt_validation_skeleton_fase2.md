# Fase 2 — Scheletro della validazione definita dall'utente

**Data**: 2026-09-08 16:50
**Spec normativa**: `docs/spec/claude_spec_2026-09-08_user_defined_validation.md` (serie R-VAL,
R-VAL-1..12 con 6-bis, in `docs/decisions.md`)
**Referti**: `docs/discovery/discovery_2026-09-08_validazione_definita_utente.md` e la
micro-discovery sul lexer JjEL dello stesso giorno
**Go-ahead**: dato da Alfonso l'8 settembre. Motivo del cambio di priorita': la sezione 5.5
«Adding Basic Validation» del libro su Jjodel e' un titolo vuoto e non si puo' scrivere finche' la
funzione non esiste.

## Perche' e' uno scheletro e non la fetta 1

La spec descrive la fetta 1 completa. Questo prompt ne implementa il sottoinsieme minimo che
cammina, perche' serve una funzione vera da mostrare nel libro, non la funzione finita.

**Dentro**: un viewpoint di validazione, regole con nome, classe di contesto, corpo JjEL,
messaggio come stringa fissa, severita' unica, flag di attivazione; raccolta delle regole
risalendo la gerarchia (R-VAL-12); tri-stato costruito al confine (R-VAL-7); valutazione **solo su
comando esplicito**; una lista delle violazioni; un authoring minimo.

**Fuori, e non per dimenticanza**: segnaposto nel messaggio, due severita', controllo statico dei
nomi in authoring, avviso sui nomi riservati, indicatori sul canvas, controesempi dal vivo,
rivalutazione automatica con debounce, modale alla cancellazione della classe (vale il default
conservativo di R-VAL-9: si conserva), UI per gestire piu' viewpoint di validazione (il tipo li
ammette, l'interfaccia dello scheletro ne mostra uno).

## Ramo

Si lavora su un ramo nuovo che parte da `alfonso-frontend-jjtl`, `validation-skeleton`. **Non
entra nella release del 15 settembre.** Nessun merge senza decisione esplicita di Alfonso.

## Criterio di accettazione, dato dal libro

La Tabella 7.5 del libro (sezione 7.7) dichiara tre invarianti sulla state machine dell'esempio
conduttore, gia' scritte in JjEL. Lo scheletro e' accettato quando tutte e tre si autorano, si
valutano sul modello del semaforo e producono il verdetto giusto:

1. esattamente uno stato iniziale: `(forall s in State.instances such that s.isInitial).size == 1`
2. uno stato non finale ha una transizione uscente: `not isFinal implies ownedTransitions.isNotEmpty`
3. ogni transizione ha un target: `forall t in ownedTransitions: t.nextState != null`

E quando, tolto lo stato iniziale al semaforo, la prima compare fra le violazioni, e rimesso lo
stato iniziale sparisce.

---

## Step 0 — Sonda di semantica (READ-ONLY, hard stop)

Prima di scrivere qualunque cosa. La spec dice «corpo JjEL booleano», ma due delle tre invarianti
del libro **non restituiscono un booleano**: la 1 restituisce un numero confrontato, la 3
restituisce un insieme di booleani. Il libro se ne accorge e scrive che «le regole di truthiness
dell'evaluator fanno funzionare la cosa in pratica». Per un validatore quella frase non basta:
se un array non vuoto e' truthy a prescindere dal contenuto, `[false, false]` risulta vero e la
regola violata viene dichiarata soddisfatta in silenzio. E' la categoria di difetto peggiore.

**Da misurare**, eseguendo l'evaluator, non leggendolo:

- il tipo di ritorno di ciascuna delle tre espressioni sopra, sul modello del semaforo o su un
  contesto equivalente;
- cosa restituisce la valutazione di un'espressione `forall ... : pred` quando **almeno un
  elemento e' falso**, e come si comporta la conversione a booleano su quel valore;
- lo stesso su collezione vuota;
- se esiste gia' nel codice una funzione che converte un `JjelValue` in booleano, e quale regola
  applica.

**Consegna**: referto in `docs/discovery/`, naming `discovery_<YYYY-MM-DD>_<descrizione>.md`,
sonda in `docs/discovery/harness/`. HARD STOP: si riprende dopo che Alfonso ha letto il referto,
perche' l'esito decide la regola di verdetto dello Step 2.

---

## Step 1 — Modello

`DValidationViewpoint` e `DValidationRule` come **tipi paralleli**, non come `DViewElement` e non
appoggiati a un supertipo comune (R-VAL-6-bis: una view seleziona su piu' metaclassi con un
filtro, una regola predica su un contesto solo; un supertipo che ammette piu' classi renderebbe
rappresentabile la regola con due contesti).

Campi della regola: `name`, `context` (puntatore alla classe M2), `body` (stringa JjEL),
`message` (stringa), `enabled` (boolean). Nessuna severita' nello scheletro: tutto e' `error`.

Il viewpoint nasce alla prima scrittura, come il Data Manager Viewpoint (R-DMV): nessuna
migrazione, nessun bump di `DState.version.n` se si riesce a restare additivi. Se un bump serve,
dichiararlo e fermarsi prima di farlo.

Commit, poi hard stop.

## Step 2 — Valutatore

Un modulo puro, senza import verso il joiner, che dato un modello M1 e l'insieme delle regole
attive produce l'elenco delle violazioni.

- **Raccolta**: per ogni istanza si raccolgono le regole della sua classe **e di tutte le
  superclassi** (R-VAL-12). Le regole si accumulano, nessuna sovrascrive nessuna: si valutano
  tutte e ognuna produce la propria voce.
- **Contesto**: `self` e' l'istanza.
- **Tri-stato al confine** (R-VAL-7): `JjelEvaluationError` viene catturata e mappata su **non
  valutabile**, che non e' una violazione e non compare fra i problemi. Il linguaggio non si
  tocca.
- **Verdetto su risultato non booleano**: secondo l'esito dello Step 0. Se la truthiness
  dell'evaluator non distingue `[false]` da `[true]`, il valutatore **non la usa**: applica la
  propria regola dichiarata, cioe' un insieme soddisfa se e solo se tutti i suoi elementi sono
  veri, e l'insieme vuoto soddisfa. Questa regola va scritta nel codice come funzione unica e
  documentata, non sparsa.
- Una violazione porta: id dell'istanza, nome della regola, messaggio.

Test unitari sul modulo, incluse le tre invarianti del libro.

Commit, poi hard stop.

## Step 3 — Comando e lista

Un comando esplicito «Validate» che valuta il **modello aperto** (non tutti i modelli del
progetto) e una lista delle violazioni con il salto all'elemento.

Le violazioni entrano nel registro esistente di `editor-v2/problems/` come nuovo produttore,
usando l'innesto gia' presente (`ownerModelId`, `getProblemIdsOwnedBy`), al prezzo di un membro
in piu' nella union `NodeProblemKind`. **Non si ripara `ValidationPill`** (non montata dal
2026-08-26, corsia di triage separata): lo scheletro fa la sua lista.

Nessun debounce, nessuna rivalutazione automatica, nessun `AFTER_TRANSACTION`.

Commit, poi hard stop con verifica visiva di Alfonso.

## Step 4 — Authoring minimo

Un punto da cui creare, editare e cancellare regole su una classe scelta, con Monaco per il corpo
e il contesto dichiarato in testa (`self: <Classe>`). Le regole ereditate dalle superclassi si
mostrano in sola lettura e distinte da quelle proprie.

**Non nel rail di destra accanto alle proprieta' della classe** (R-VAL-1, R-VAL-11).

Commit, poi hard stop.

---

## Vincoli di ingaggio

- `CLAUDE.md` e' la fonte di verita': se questo prompt lo contraddice, segnalare il conflitto
  invece di eseguire.
- Critical zone (`useJjomSync.ts`, `portDistribution.ts`): non si tocca. Se uno step sembra
  richiederlo, ci si ferma e si chiede.
- Scope stretto: `git add <file specifici>`, mai `git add .`. Docs e codice mai nello stesso
  commit.
- Zero refactoring opportunistico, nessun identificatore esistente rinominato. Prima di
  introdurre un nome nuovo (classe SCSS, evento, chiave di context), ricerca globale che non sia
  gia' in uso.
- Gate a ogni commit: `npm run typecheck` rispetto alla baseline, `npx vitest run`, `npm run
  build` verde.
- Entry in `docs/claude-code-log.md` a fine di ogni step, dopo la conferma visiva.
