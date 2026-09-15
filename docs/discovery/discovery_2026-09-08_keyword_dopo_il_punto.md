# Micro-discovery — l'estensione del difetto «keyword dopo il punto» nel lexer JjEL

**Data**: 2026-09-08
**Corsia**: micro-discovery READ-ONLY. Nessun fix, il lexer non e' stato toccato.
**Sonda**: `docs/discovery/harness/probe_2026-09-08_jjel_keyword_after_dot.mts` — **16 PASS 0 FAIL**

---

## 1. Conclusione, in una riga

**Corsia laterale, non prerequisito** — ma per una ragione diversa da quella che ci si
aspetterebbe: il difetto e' molto piu' largo del previsto (**18 keyword su 18**, non solo
`forAll`), e proprio per questo esiste una via di scampo che copre **tutti** i casi,
`a["<kw>"]`, misurata funzionante fino alla lettura del valore.

Con una riserva, in §8: nulla impedisce di chiamare una feature come una keyword, e il
messaggio di errore che l'utente riceve non nomina la causa.

---

## 2. Obiettivo e ipotesi

Misurare quanto sia esteso il difetto per cui una keyword non puo' seguire un punto, per
decidere se la sua correzione sia un prerequisito della validazione definita dall'utente
(vincoli in JjEL sulle istanze M1) o una corsia a se'.

| # | Ipotesi | Esito |
|---|---|---|
| H1 | `forAll` e' un caso particolare, o quasi | **FALSIFICATA**: rompono **tutte e 18** le keyword JjEL |
| H2 | I nomi di feature che la gente usa davvero (`type`, `name`, `value`) sono a rischio | **FALSIFICATA**: nessuno dei due elenchi contiene quei nomi; parsano tutti (§4, blocco C) |
| H3 | Le due tabelle keyword coincidono | **FALSIFICATA**: 14 comuni, 4 solo JjEL, 11 solo JjTL (§6) |
| H4 | Esiste un controllo che impedisce di chiamare una feature come una keyword | **FALSIFICATA**: nessuno, ne' attivo ne' passivo (§7) |
| H5 | Il difetto non ha aggiramenti | **FALSIFICATA**: `a["<kw>"]` parsa e legge, su tutte e 18 (§5) |

---

## 3. File letti (path completi)

Tutti relativi a `/Users/alfonso/jjodel/`.

- `frontend/src/jjel/types/tokens.ts` — `JJEL_KEYWORDS`, righe 106-125 (tabella letta per intero)
- `frontend/src/jjel/lexer/lexer.ts` — righe 390-405 (il lookup)
- `frontend/src/jjel/lexer/index.ts`
- `frontend/src/jjtl/types/tokens.ts` — `JJTL_KEYWORDS`, righe 105-136 (tabella letta per intero)
- `frontend/src/jjtl/lexer/lexer.ts` — righe 320-335 (il lookup) e `:391` (`tokenize`)
- `frontend/src/model/conformance/nameShape.ts` — letto per intero (49 righe)
- `frontend/src/joiner/classes.ts` — `LPointerTargetable.set_name`, righe 2178-2215
- `frontend/src/model/logicWrapper/LModelElement.tsx` — `set_name` a `:3211` (`LClass`),
  `:4416` (`LAttribute`), `:5623`; `LObject.set_name` via override
- `frontend/src/jjscript/executor/commands/eval.ts` — righe 265-285 (il commento «reserved
  names are skipped», verificato: non e' un controllo sulle keyword)
- `docs/discovery/harness/probe_2026-09-05_rskin_sliceC_select.mts` — solo per la convenzione
  di intestazione e di lancio delle sonde

---

## 4. La tabella delle keyword, e l'esito per ciascuna

Le due tabelle sono **importate dal sorgente** dalla sonda, non ricopiate: una lista
trascritta a mano misura la trascrizione, e puo' divergere dal codice senza che il referto
se ne accorga.

### 4.1 `JJEL_KEYWORDS` — 18 voci (`frontend/src/jjel/types/tokens.ts:106-125`)

Ogni riga e' `a.<kw>` passato al **parser** JjEL, piu' il tipo del token che esce **dopo il
DOT** dal lexer.

| keyword | token dopo `.` | `a.<kw>` | `<kw>` nudo | `{<kw>: 1}` | `a["<kw>"]` |
|---|---|---|---|---|---|
| `and` | `AND` | ROTTO `1:3` | ROTTO | ROTTO | ok |
| `do` | `DO` | ROTTO `1:3` | ROTTO | ROTTO | ok |
| `else` | `ELSE` | ROTTO `1:3` | ROTTO | ROTTO | ok |
| `exists` | `EXISTS` | ROTTO `1:3` | ROTTO | ROTTO | ok |
| `false` | `BOOLEAN` | ROTTO `1:3` | parsa (come **letterale**) | ROTTO | ok |
| `forall` | `FORALL` | ROTTO `1:3` | ROTTO | ROTTO | ok |
| `if` | `IF` | ROTTO `1:3` | ROTTO | ROTTO | ok |
| `implies` | `IMPLIES` | ROTTO `1:3` | ROTTO | ROTTO | ok |
| `in` | `IN` | ROTTO `1:3` | ROTTO | ROTTO | ok |
| `is` | `IS` | ROTTO `1:3` | ROTTO | ROTTO | ok |
| `not` | `NOT` | ROTTO `1:3` | ROTTO | ROTTO | ok |
| `null` | `NULL` | ROTTO `1:3` | parsa (come **letterale**) | ROTTO | ok |
| `or` | `OR` | ROTTO `1:3` | ROTTO | ROTTO | ok |
| `such` | `SUCH` | ROTTO `1:3` | ROTTO | ROTTO | ok |
| `that` | `THAT` | ROTTO `1:3` | ROTTO | ROTTO | ok |
| `then` | `THEN` | ROTTO `1:3` | ROTTO | ROTTO | ok |
| `true` | `BOOLEAN` | ROTTO `1:3` | parsa (come **letterale**) | ROTTO | ok |
| `with` | `WITH` | ROTTO `1:3` | ROTTO | ROTTO | ok |

**18 / 18 rotte** in navigazione. Errore identico su tutte:
`1:3 Expected property name after '.'`.

Le tre che «parsano» da sole (`true`, `false`, `null`) non sono un'eccezione utile: parsano
come **letterali**, non come riferimento a un binding. Una classe o una variabile chiamata
`true` resta comunque irraggiungibile per nome — solo con un errore diverso, o con nessun
errore e il valore sbagliato, che e' peggio.

**15 / 18** rotte come identificatore nudo, **18 / 18** come chiave di object literal.

### 4.2 Il controllo positivo — e perche' e' la meta' che conta

Un elenco di soli fallimenti e' indistinguibile da un parser rotto. La sonda passa quindi
otto nomi che **non** sono in tabella, e devono parsare tutti:

```
PASS  a.type    PASS  a.name     PASS  a.value    PASS  a.values
PASS  a.abstract PASS  a.owner   PASS  a.label    PASS  a.father
```

Tutti e otto parsano. **`type`, `name`, `value` — i tre che il prompt chiedeva
esplicitamente di includere — non sono keyword ne' in JjEL ne' in JjTL**, e non sono
toccati dal difetto. Questa e' la misura che rende il verdetto una corsia laterale e non
un blocco: i nomi che una feature porta quasi sempre sono al sicuro.

---

## 5. La via di scampo, misurata fino al valore

`a["<kw>"]` (index access, `evaluator.ts:967-982`) **parsa su tutte e 18** le keyword.

Parsare non basterebbe: la via di scampo vale solo se legge davvero. Il contesto M1
appiattisce gli slot nell'oggetto (`jjel/evaluator/modelContext.ts`,
`extractAttributeValues`), quindi la feature `in` di un'istanza e' una proprieta' nuda, ed
e' esattamente dove l'index access arriva. Misurato:

```
PASS  a["in"] legge davvero il valore (42)          jjelEval('a["in"]', {a:{in:42}}) === 42
PASS  a["do"] su feature assente da' null, non lancia
```

Quindi un vincolo su un metamodello che chiami una feature come una keyword **si puo'
scrivere oggi**, in una forma piu' brutta ma funzionante.

---

## 6. Le due tabelle divergono (domanda 4)

| | voci | |
|---|---|---|
| **comune** | 14 | `and`, `else`, `false`, `forall`, `if`, `in`, `is`, `not`, `null`, `or`, `such`, `that`, `then`, `true` |
| **solo JjEL** | 4 | `do`, `exists`, `implies`, `with` |
| **solo JjTL** | 11 | `alert`, `confirm`, `from`, `helper`, `input`, `let`, `notify`, `prompt`, `to`, `transformation`, `where` |

JjEL 18 voci, JjTL 25. La partizione e' verificata dalla sonda su entrambi i lati (blocco A,
2 PASS).

Al livello del **lexer** JjTL il comportamento e' identico: **25 / 25** le keyword escono
come token di keyword dopo un punto, mai come `IDENTIFIER`. Misurato sul lexer e non sul
parser perche' il parser JjTL vuole un programma intero e il soggetto qui e' la
tokenizzazione: dichiarato, non aggirato.

**La conseguenza della divergenza e' che l'insieme dei nomi sicuri dipende da chi legge
l'espressione.** Una feature `from` o `to` — nomi molto plausibili su una classe di tipo
arco — naviga senza problemi in JjEL e si rompe in JjTL. Una feature `with` o `exists` fa
l'opposto. Non esiste un unico elenco di nomi da evitare.

---

## 7. Domanda 3: esiste un controllo che lo impedisca? **No.**

Cercato su tre livelli, tutti e tre negativi.

**a) Controllo lessicale passivo.** `frontend/src/model/conformance/nameShape.ts` e' l'unica
regola lessicale sul nome di un elemento (CHECK 12 della conformance). Verbatim, `:18-22`:

```ts
/** First character: a letter in any script, `_` or `$`. */
const NAME_FIRST_CHAR = /[\p{L}_$]/u;
const NAME_WHOLE = /^[\p{L}_$]+[\p{L}\p{N}$_\s'’]*$/u;
```

Nessun elenco di parole riservate. La sonda lo passa su tutte e 18 le keyword:
**0 rifiutate su 18**, tutte `'ok'`. Controllo positivo nello stesso blocco:
`checkNameShape('')` -> `'empty'`, `checkNameShape('9bad')` -> `'bad_first_char'` — la
funzione sa dire di no quando deve, quindi i 18 `'ok'` sono un risultato, non un silenzio.

**b) Controllo attivo, sulla via di scrittura.** `LPointerTargetable.set_name`
(`frontend/src/joiner/classes.ts:2178-2215`) e' il sito che ogni rinomina M2 attraversa. Il
suo unico verdetto e' l'**unicita'** (`checkM2NameUniqueness` per gli elementi M2,
`father.children` per gli altri). Nessuna forma, nessuna parola riservata. Gli override
(`LClass` `:3211`, `LAttribute` `:4416`, `LObject`) chiamano `super` e aggiungono altro —
l'inferenza del tipo dal nome per `LAttribute` — mai un controllo lessicale.

**c) Falso positivo escluso.** `frontend/src/jjscript/executor/commands/eval.ts:277` porta il
commento «Built-ins take precedence on collision (reserved names are skipped)», che a prima
lettura sembra il controllo cercato. Letto il codice attorno (`:275-284`): la guardia e'
`if (name in variables) continue`, cioe' una classe il cui nome collide con un binding gia'
presente **non viene legata**. Non e' un controllo sulle keyword, ed e' silenzioso.

**Verdetto**: nessun livello impedisce, avverte o registra una feature chiamata come una
keyword. La ricerca che lo stabilisce e' quella qui sopra, sui tre livelli, piu' un grep su
tutto `frontend/src` per `reserved|RESERVED_WORDS|keyword` i cui unici esiti pertinenti sono
`jjscript/types.ts:585` (`KEYWORDS`, la lista di **JjScript**, usata dall'autocomplete a
`JjScriptInput.tsx:75`) e il commento appena discusso.

---

## 8. La riserva

Il verdetto e' «corsia laterale», ma tre cose restano vere e vanno messe a verbale.

1. **Nulla impedisce il nome.** Un metamodello con una feature `in` (una porta di ingresso),
   `do` (un'attivita'), `is` o `with` e' legale oggi, e nessuno avverte l'autore.
2. **Il messaggio non nomina la causa.** L'utente che scrive `self.in > 0` legge
   `Expected property name after '.'`. Non dice che `in` e' una parola riservata, ne'
   suggerisce `self["in"]`. E' il tipo di errore su cui si perde un pomeriggio.
3. **La divergenza fra le due tabelle** (§6) rende impossibile dare all'utente un unico
   elenco di nomi da evitare, se non l'unione delle due (29 parole).

Nessuna delle tre e' un blocco per la validazione. Tutte e tre diventano un problema il
giorno in cui i vincoli sono scritti da utenti su metamodelli arbitrari — cioe' quando la
funzione e' finita, non mentre la si costruisce.

---

## 9. Dipendenze e rischi

| # | Rischio | Evidenza | Gravita' |
|---|---|---|---|
| K1 | Il vincolo su una feature chiamata come una keyword non si scrive nella forma naturale, e l'errore non spiega perche' | §4.1, §8.2 | media |
| K2 | Nessun controllo a monte: il nome si puo' dare e nessuno lo segnala | §7 | media |
| K3 | L'insieme dei nomi sicuri dipende dal linguaggio che legge l'espressione | §6 | bassa, ma sorprendente |
| K4 | La via di scampo `a["<kw>"]` e' misurata sul contesto **appiattito** (`extractAttributeValues`). Un contesto futuro che NON appiattisse gli slot la invaliderebbe | §5 | bassa |
| K5 | Un eventuale fix del lexer tocca **due** lexer, e la scelta di allinearli o no e' di progetto, non tecnica | §6 | bassa (e' la corsia che questo referto rinvia) |

---

## 10. Domande aperte per Alfonso

**Q1 — La riserva di §8.2 vale un giro suo, e quale?** Tre mitigazioni indipendenti dal fix
del lexer, in ordine di costo: (i) migliorare il messaggio del parser, che dopo un `.`
sa gia' di aver visto un token di keyword e potrebbe dirlo e suggerire la forma con le
virgolette; (ii) un warning al momento della rinomina, sulla via `set_name` gia' esistente;
(iii) una voce nella documentazione utente dei vincoli. La (i) e' quella che paga di piu' per
riga scritta, e non tocca il lexer.

**Q2 — Il fix del lexer, quando si fara', allinea le due tabelle o no?** Sono liste diverse
per ragioni legittime (JjTL ha i suoi costrutti), ma un utente che scrive un vincolo e una
trasformazione sullo stesso metamodello vede due comportamenti diversi sullo stesso nome.

**Q3 — Il fix e' del lexer o del parser?** Il lexer non ha il contesto per sapere che sta
seguendo un punto; il parser si'. Accettare un token di keyword come nome di proprieta' nel
ramo del member access e' un cambiamento piu' piccolo e piu' locale che rendere il lexer
sensibile al contesto. Non e' una decisione di questo referto, ma e' la prima cosa che il
giro dovra' scegliere.

---

## 11. Stato dell'albero a fine giro

Nessun file di codice modificato. Scritti da questo giro: questo referto e la sonda in
`docs/discovery/harness/`. Il lexer non e' stato toccato, come impone l'hard stop.
