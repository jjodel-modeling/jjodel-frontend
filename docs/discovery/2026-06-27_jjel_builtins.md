# Discovery — JjEL Built-in Method Reference (catalogo completo con firme)

**Data**: 2026-06-27
**Tipo**: discovery — READ-ONLY (nessuna modifica al codice, nessun commit)
**Repo / branch**: `jjodel-modeling/jjodel-frontend` @ `alfonso-frontend-jjtl` (working tree)
**Scopo**: estrarre dal codice il catalogo esaustivo dei built-in JjEL (firma + semantica +
`file:riga`) per l'appendice "JjEL Built-in Method Reference" del libro.
**Fonte**: lettura diretta dei quattro registri + del dispatcher dell'evaluator.

| File | Registro | Righe |
|---|---|---|
| `frontend/src/jjel/evaluator/builtins/strings.ts` | `getStringMethod` | `:305-346` |
| `frontend/src/jjel/evaluator/builtins/numbers.ts` | `getNumberMethod` | `:270-310` |
| `frontend/src/jjel/evaluator/builtins/collections.ts` | `getCollectionMethod` | `:555-591` |
| `frontend/src/jjel/evaluator/builtins/dates.ts` | `getDateMethod` / `getDateConstructor` | `:437-478` / `:483-493` |

---

## Conteggi effettivi (verificati riga per riga)

| Famiglia | Atteso (discovery 2026-06-26) | **Effettivo** | Esito |
|---|---|---|---|
| String | 36 | **36** | ✓ |
| Number | 35 | **35** | ✓ |
| Collection | 32 | **31** | ⚠ **correzione**: l'effettivo è 31 (la discovery precedente ha contato male; la sua stessa lista enumerava 31 nomi) |
| Date (metodi) | 36 | **36** | ✓ |
| Date (costruttori) | 5 | **5** | ✓ |
| **TOTALE** | **144** | **143** | ⚠ **143**, non 144 (dovuto al -1 collezioni) |

---

## Convenzioni di lettura

- **Receiver implicito**: la firma OMETTE il primo parametro del codice (il valore su cui si
  chiama il metodo, `self`). Es. il codice `padStart(str, length, char)` → firma libro
  `padStart(length: Integer, char: String = " ") : String`. I costruttori di data NON hanno
  receiver (sono funzioni globali): tutti i loro parametri sono elencati.
- **Tipi** (resa per il libro): `String`, `Integer`, `Number`, `Boolean`, `Array`, `Any`,
  `Lambda`. *Nota*: a runtime JjEL ha **un solo** tipo numerico (il `number` di JS);
  `Integer`/`Double` esistono solo per i literal e per `getTypeName`. Dove sotto scrivo
  `Integer` è una resa semantica (lunghezze, indici, componenti di data), non un vincolo di
  tipo forte. `?` nel ritorno = può restituire `null`.
- **° = dual-calling** (richiamabile **senza** parentesi): il metodo è intercettato dal ramo
  `getProperty` per quel tipo nell'evaluator (`evaluator.ts`). Vedi §"Note su dual-calling".
- **opzionale** = parametro con `?` o con default nel codice.

---

## Tabella 1 — String (36) · `strings.ts`

Receiver: `String`. file:riga = definizione (registrazione in `getStringMethod`, `:306-343`).

| Metodo | Firma | Ritorno | Descrizione | file:riga |
|---|---|---|---|---|
| toUpper° | `toUpper() : String` | String | Maiuscolo (`String.toUpperCase`). | strings.ts:16 |
| toLower° | `toLower() : String` | String | minuscolo. | strings.ts:24 |
| capitalize | `capitalize() : String` | String | Prima lettera maiuscola, resto invariato. | strings.ts:32 |
| uncapitalize | `uncapitalize() : String` | String | Prima lettera minuscola, resto invariato. | strings.ts:41 |
| camelCase | `camelCase() : String` | String | Separatori `-_`/spazio rimossi, lettera seguente in maiuscolo, prima lettera minuscola. | strings.ts:50 |
| pascalCase | `pascalCase() : String` | String | Come camelCase ma prima lettera maiuscola. | strings.ts:60 |
| snakeCase | `snakeCase() : String` | String | `_` inserito tra minuscola→Maiuscola, separatori→`_`, tutto minuscolo. | strings.ts:70 |
| kebabCase | `kebabCase() : String` | String | Come snakeCase ma con `-`. | strings.ts:81 |
| trim° | `trim() : String` | String | Rimuove whitespace iniziale e finale. | strings.ts:91 |
| trimStart° | `trimStart() : String` | String | Rimuove whitespace iniziale. | strings.ts:98 |
| trimEnd° | `trimEnd() : String` | String | Rimuove whitespace finale. | strings.ts:105 |
| padStart | `padStart(length: Integer, char: String = " ") : String` | String | Pad a sinistra fino a `length` con `char`. | strings.ts:112 |
| padEnd | `padEnd(length: Integer, char: String = " ") : String` | String | Pad a destra fino a `length`. | strings.ts:119 |
| repeat | `repeat(count: Integer) : String` | String | Ripete `count` volte (`floor`); `count<0` → `""`. | strings.ts:126 |
| replace | `replace(search: String, replacement: String) : String` | String | Sostituisce la **prima** occorrenza. | strings.ts:134 |
| replaceAll | `replaceAll(search: String, replacement: String) : String` | String | Sostituisce **tutte** le occorrenze (via split/join, non regex). | strings.ts:141 |
| substring | `substring(start: Integer, end?: Integer) : String` | String | Sottostringa `[start, end)` (`String.substring`). | strings.ts:148 |
| slice | `slice(start: Integer, end?: Integer) : String` | String | Slice (supporta indici negativi). | strings.ts:155 |
| split | `split(separator: String) : Array<String>` | Array\<String> | Divide in array sul separatore. | strings.ts:162 |
| startsWith | `startsWith(prefix: String) : Boolean` | Boolean | Inizia con `prefix`. | strings.ts:169 |
| endsWith | `endsWith(suffix: String) : Boolean` | Boolean | Finisce con `suffix`. | strings.ts:176 |
| contains | `contains(substring: String) : Boolean` | Boolean | Include `substring` (`String.includes`). | strings.ts:183 |
| indexOf | `indexOf(search: String) : Integer` | Integer | Indice prima occorrenza, `-1` se assente. | strings.ts:190 |
| lastIndexOf | `lastIndexOf(search: String) : Integer` | Integer | Indice ultima occorrenza, `-1` se assente. | strings.ts:197 |
| charAt | `charAt(index: Integer) : String` | String | Carattere a `index` (negativi dal fondo; `""` se fuori range). | strings.ts:204 |
| length° | `length() : Integer` | Integer | Lunghezza della stringa. | strings.ts:213 |
| isEmpty° | `isEmpty() : Boolean` | Boolean | `length === 0`. | strings.ts:220 |
| isNotEmpty° | `isNotEmpty() : Boolean` | Boolean | `length > 0`. | strings.ts:227 |
| isBlank | `isBlank() : Boolean` | Boolean | Vuota o solo whitespace (`trim().length === 0`). | strings.ts:234 |
| isNotBlank | `isNotBlank() : Boolean` | Boolean | Non blank. | strings.ts:241 |
| matches | `matches(pattern: String) : Boolean` | Boolean | Test regex (`new RegExp(pattern)`); pattern invalido → `false`. | strings.ts:248 |
| reverse | `reverse() : String` | String | Inverte l'ordine dei caratteri. | strings.ts:260 |
| toNumber | `toNumber() : Number?` | Number \| null | `parseFloat`; `NaN` → `null`. | strings.ts:267 |
| toInt | `toInt() : Integer?` | Integer \| null | `parseInt` base 10; `NaN` → `null`. | strings.ts:275 |
| quote | `quote() : String` | String | Racchiude in `"…"`, escapando le `"` interne. | strings.ts:283 |
| format | `format(...args: Any) : String` | String | Sostituisce `{0}`,`{1}`,… con gli argomenti; indice fuori range resta `{n}`. | strings.ts:291 |

Dual° (no-parentesi): **toUpper, toLower, trim, trimStart, trimEnd, length, isEmpty, isNotEmpty**.

---

## Tabella 2 — Number (35) · `numbers.ts`

Receiver: `Number`. Nessun metodo numerico è dual-calling (vedi §note). Registrazione `:271-307`.

| Metodo | Firma | Ritorno | Descrizione | file:riga |
|---|---|---|---|---|
| abs | `abs() : Number` | Number | Valore assoluto. | numbers.ts:16 |
| round | `round(decimals: Integer = 0) : Number` | Number | Arrotonda a `decimals` cifre (0 → intero). | numbers.ts:24 |
| floor | `floor() : Number` | Number | Arrotonda per difetto. | numbers.ts:35 |
| ceil | `ceil() : Number` | Number | Arrotonda per eccesso. | numbers.ts:42 |
| trunc | `trunc() : Number` | Number | Tronca la parte decimale. | numbers.ts:49 |
| sign | `sign() : Number` | Number | Segno: `-1`, `0`, `1`. | numbers.ts:56 |
| sqrt | `sqrt() : Number` | Number | Radice quadrata. | numbers.ts:63 |
| pow | `pow(exponent: Number) : Number` | Number | Elevamento a potenza. | numbers.ts:70 |
| exp | `exp() : Number` | Number | `e^x`. | numbers.ts:77 |
| log | `log() : Number` | Number | Logaritmo naturale. | numbers.ts:84 |
| log10 | `log10() : Number` | Number | Logaritmo base 10. | numbers.ts:91 |
| log2 | `log2() : Number` | Number | Logaritmo base 2. | numbers.ts:98 |
| sin | `sin() : Number` | Number | Seno (radianti). | numbers.ts:105 |
| cos | `cos() : Number` | Number | Coseno (radianti). | numbers.ts:112 |
| tan | `tan() : Number` | Number | Tangente (radianti). | numbers.ts:119 |
| asin | `asin() : Number` | Number | Arcoseno. | numbers.ts:126 |
| acos | `acos() : Number` | Number | Arcocoseno. | numbers.ts:133 |
| atan | `atan() : Number` | Number | Arcotangente. | numbers.ts:140 |
| toFixed | `toFixed(decimals: Integer = 0) : String` | String | Formatta con decimali fissi. | numbers.ts:147 |
| toPrecision | `toPrecision(precision: Integer) : String` | String | Formatta con precisione totale. | numbers.ts:154 |
| toExponential | `toExponential(decimals?: Integer) : String` | String | Notazione esponenziale. | numbers.ts:161 |
| toString | `toString() : String` | String | Converte a stringa. | numbers.ts:168 |
| toHex | `toHex() : String` | String | Esadecimale (su `floor`). | numbers.ts:175 |
| toBinary | `toBinary() : String` | String | Binario (su `floor`). | numbers.ts:182 |
| toOctal | `toOctal() : String` | String | Ottale (su `floor`). | numbers.ts:189 |
| isInteger | `isInteger() : Boolean` | Boolean | È un intero. | numbers.ts:196 |
| isFinite | `isFinite() : Boolean` | Boolean | È finito. | numbers.ts:203 |
| isNaN | `isNaN() : Boolean` | Boolean | È `NaN`. | numbers.ts:210 |
| isPositive | `isPositive() : Boolean` | Boolean | `> 0`. | numbers.ts:217 |
| isNegative | `isNegative() : Boolean` | Boolean | `< 0`. | numbers.ts:224 |
| isZero | `isZero() : Boolean` | Boolean | `=== 0`. | numbers.ts:231 |
| clamp | `clamp(min: Number, max: Number) : Number` | Number | Vincola al range `[min, max]`. | numbers.ts:238 |
| between | `between(min: Number, max: Number) : Boolean` | Boolean | In `[min, max]` inclusivo. | numbers.ts:245 |
| mod | `mod(divisor: Number) : Number` | Number | Modulo **sempre positivo** (`((n%d)+d)%d`). | numbers.ts:252 |
| div | `div(divisor: Number) : Number` | Number | Divisione **intera** (`floor(n/d)`). | numbers.ts:259 |

---

## Tabella 3 — Collection (31) · `collections.ts`

Receiver: `Array`. `Lambda` = lambda JjEL (`x => …`). Registrazione `:556-588`.

| Metodo | Firma | Ritorno | Descrizione | file:riga |
|---|---|---|---|---|
| filter | `filter(predicate: Lambda) : Array` | Array | Elementi per cui `predicate` è vero. | collections.ts:22 |
| map | `map(transformer: Lambda) : Array` | Array | Trasforma ogni elemento. | collections.ts:43 |
| flatMap | `flatMap(transformer: Lambda) : Array` | Array | Map + appiattimento di un livello. | collections.ts:55 |
| first° | `first(predicate?: Lambda) : Any?` | Any \| null | Primo elemento, o primo che matcha `predicate`; `null` se vuoto/nessuno. | collections.ts:78 |
| last° | `last(predicate?: Lambda) : Any?` | Any \| null | Ultimo elemento, o ultimo che matcha. | collections.ts:100 |
| any | `any(predicate: Lambda) : Boolean` | Boolean | Esiste almeno un elemento che matcha. | collections.ts:122 |
| all | `all(predicate: Lambda) : Boolean` | Boolean | Tutti gli elementi matchano. | collections.ts:139 |
| none | `none(predicate: Lambda) : Boolean` | Boolean | Nessun elemento matcha (`= !any`). | collections.ts:156 |
| count | `count(predicate?: Lambda) : Integer` | Integer | Numero di elementi, o quanti matchano. | collections.ts:168 |
| size° | `size(predicate?: Lambda) : Integer` | Integer | **Alias di `count`** (`export const size = count`). | collections.ts:189 |
| isEmpty° | `isEmpty() : Boolean` | Boolean | `length === 0`. | collections.ts:194 |
| isNotEmpty° | `isNotEmpty() : Boolean` | Boolean | `length > 0`. | collections.ts:201 |
| contains | `contains(element: Any) : Boolean` | Boolean | Contiene `element` (confronto `deepEqual`). | collections.ts:208 |
| distinct | `distinct() : Array` | Array | Rimuove i duplicati (chiave `JSON.stringify`). | collections.ts:215 |
| distinctBy | `distinctBy(keySelector: Lambda) : Array` | Array | Dedup per chiave calcolata. | collections.ts:234 |
| sortBy | `sortBy(keySelector: Lambda) : Array` | Array | Ordina **ascendente** per chiave (copia, non muta). | collections.ts:257 |
| sortByDescending | `sortByDescending(keySelector: Lambda) : Array` | Array | Ordina **discendente** per chiave (copia). | collections.ts:272 |
| reverse | `reverse() : Array` | Array | Inverte (copia, non muta). | collections.ts:287 |
| take | `take(n: Integer) : Array` | Array | Primi `n` elementi. | collections.ts:294 |
| skip | `skip(n: Integer) : Array` | Array | Salta i primi `n`. | collections.ts:301 |
| takeWhile | `takeWhile(predicate: Lambda) : Array` | Array | Prende finché `predicate` è vero, poi si ferma. | collections.ts:308 |
| skipWhile | `skipWhile(predicate: Lambda) : Array` | Array | Salta finché `predicate` è vero, poi prende tutto il resto. | collections.ts:326 |
| flatten | `flatten() : Array` | Array | Appiattisce le sotto-array di un livello. | collections.ts:346 |
| groupBy | `groupBy(keySelector: Lambda) : Array` | Array<{key, items}> | Raggruppa per chiave → array di `{key, items}`. | collections.ts:364 |
| join | `join(separator: String = "") : String` | String | Concatena gli elementi come stringhe. | collections.ts:388 |
| sum | `sum(selector?: Lambda) : Number` | Number | Somma i valori numerici (con `selector` opzionale). | collections.ts:396 |
| avg | `avg(selector?: Lambda) : Number` | Number | Media; `0` se collezione vuota. | collections.ts:417 |
| min | `min(selector?: Lambda) : Any?` | Any \| null | Minimo (per chiave se `selector`); `null` se vuoto. | collections.ts:430 |
| max | `max(selector?: Lambda) : Any?` | Any \| null | Massimo (per chiave se `selector`); `null` se vuoto. | collections.ts:455 |
| indexOf | `indexOf(element: Any) : Integer` | Integer | Indice di `element` (`deepEqual`), `-1` se assente. | collections.ts:479 |
| at | `at(index: Integer) : Any?` | Any \| null | Elemento a `index` (negativi dal fondo; `null` se fuori range). | collections.ts:491 |

Dual° (no-parentesi): **first, last, size, isEmpty, isNotEmpty**.

---

## Tabella 4a — Date · metodi (36) · `dates.ts`

Receiver: una `String` data ISO 8601. **Tutti** ritornano `null` se la stringa non è una data
valida (per questo i ritorni sono marcati `?`). Nessuno è dual-calling. Registrazione `:438-475`.

| Metodo | Firma | Ritorno | Descrizione | file:riga |
|---|---|---|---|---|
| year | `year() : Integer?` | Integer \| null | Anno (`getFullYear`). | dates.ts:26 |
| month | `month() : Integer?` | Integer \| null | Mese **1-12** (`getMonth()+1`). | dates.ts:34 |
| day | `day() : Integer?` | Integer \| null | Giorno del mese. | dates.ts:42 |
| hour | `hour() : Integer?` | Integer \| null | Ora 0-23. | dates.ts:50 |
| minute | `minute() : Integer?` | Integer \| null | Minuti. | dates.ts:58 |
| second | `second() : Integer?` | Integer \| null | Secondi. | dates.ts:66 |
| millisecond | `millisecond() : Integer?` | Integer \| null | Millisecondi. | dates.ts:74 |
| dayOfWeek | `dayOfWeek() : Integer?` | Integer \| null | Giorno settimana (0=Domenica … 6=Sabato). | dates.ts:82 |
| dayOfYear | `dayOfYear() : Integer?` | Integer \| null | Giorno dell'anno. | dates.ts:90 |
| weekOfYear | `weekOfYear() : Integer?` | Integer \| null | Settimana dell'anno (ISO 8601). | dates.ts:103 |
| quarter | `quarter() : Integer?` | Integer \| null | Trimestre 1-4. | dates.ts:117 |
| isLeapYear | `isLeapYear() : Boolean?` | Boolean \| null | Anno bisestile. | dates.ts:125 |
| daysInMonth | `daysInMonth() : Integer?` | Integer \| null | Giorni nel mese. | dates.ts:134 |
| timestamp | `timestamp() : Integer?` | Integer \| null | Unix timestamp in millisecondi (`getTime`). | dates.ts:143 |
| toISOString | `toISOString() : String?` | String \| null | ISO 8601 completa. | dates.ts:151 |
| toDateString | `toDateString() : String?` | String \| null | Solo la parte data `YYYY-MM-DD`. | dates.ts:159 |
| toTimeString | `toTimeString() : String?` | String \| null | Solo la parte ora. | dates.ts:167 |
| addDays | `addDays(n: Integer) : String?` | String \| null | Aggiunge `n` giorni → ISO. | dates.ts:175 |
| addMonths | `addMonths(n: Integer) : String?` | String \| null | Aggiunge `n` mesi. | dates.ts:185 |
| addYears | `addYears(n: Integer) : String?` | String \| null | Aggiunge `n` anni. | dates.ts:195 |
| addHours | `addHours(n: Integer) : String?` | String \| null | Aggiunge `n` ore. | dates.ts:205 |
| addMinutes | `addMinutes(n: Integer) : String?` | String \| null | Aggiunge `n` minuti. | dates.ts:215 |
| addSeconds | `addSeconds(n: Integer) : String?` | String \| null | Aggiunge `n` secondi. | dates.ts:225 |
| startOfDay | `startOfDay() : String?` | String \| null | Inizio giornata (00:00:00.000). | dates.ts:235 |
| endOfDay | `endOfDay() : String?` | String \| null | Fine giornata (23:59:59.999). | dates.ts:245 |
| startOfMonth | `startOfMonth() : String?` | String \| null | Primo del mese, 00:00. | dates.ts:255 |
| endOfMonth | `endOfMonth() : String?` | String \| null | Ultimo del mese, 23:59. | dates.ts:266 |
| startOfYear | `startOfYear() : String?` | String \| null | 1 gennaio, 00:00. | dates.ts:277 |
| endOfYear | `endOfYear() : String?` | String \| null | 31 dicembre, 23:59. | dates.ts:288 |
| diffDays | `diffDays(other: String) : Integer?` | Integer \| null | Differenza in giorni (`self - other`, `floor`). | dates.ts:299 |
| diffMonths | `diffMonths(other: String) : Integer?` | Integer \| null | Differenza in mesi. | dates.ts:311 |
| diffYears | `diffYears(other: String) : Integer?` | Integer \| null | Differenza in anni. | dates.ts:323 |
| isBefore | `isBefore(other: String) : Boolean?` | Boolean \| null | `self < other`. | dates.ts:334 |
| isAfter | `isAfter(other: String) : Boolean?` | Boolean \| null | `self > other`. | dates.ts:345 |
| isSameDay | `isSameDay(other: String) : Boolean?` | Boolean \| null | Stesso giorno (confronto `toDateString`). | dates.ts:356 |
| format | `format(pattern: String) : String?` | String \| null | Formatta con i token `YYYY MM DD HH mm ss`. | dates.ts:368 |

## Tabella 4b — Date · costruttori di contesto (5) · `dates.ts`

**Funzioni globali** (no receiver): si invocano nude — `now()`, `date(2024,1,15)`, … —
registrate come builtin globali dall'evaluator (`evaluator.ts:84-91`). Non sono dual-calling.
Registrazione in `getDateConstructor` `:484-490`.

| Costruttore | Firma | Ritorno | Descrizione | file:riga |
|---|---|---|---|---|
| now | `now() : String` | String | Data/ora corrente come ISO 8601. | dates.ts:388 |
| today | `today() : String` | String | Oggi all'inizio della giornata, come ISO. | dates.ts:395 |
| date | `date(year: Integer, month: Integer, day: Integer) : String` | String | Costruisce una data (mese **1-based**) → ISO. | dates.ts:404 |
| datetime | `datetime(year: Integer, month: Integer, day: Integer, hour: Integer = 0, minute: Integer = 0, second: Integer = 0) : String` | String | Costruisce un datetime → ISO. | dates.ts:411 |
| parseDate | `parseDate(string: String) : String?` | String \| null | Parsa una stringa → ISO, `null` se invalida. Impl: `parseDateString`. | dates.ts:425 |

---

## Note su dual-calling (richiamabili senza parentesi)

I metodi marcati `°` sono intercettati dal ramo `getProperty` dell'evaluator per il tipo del
receiver e quindi funzionano **anche senza parentesi** (`name.toUpper` ≡ `name.toUpper()`):

- **String** (`evaluator.ts:440-464`): `toUpper, toLower, trim, trimStart, trimEnd, length,
  isEmpty, isNotEmpty`.
- **Collection** (`evaluator.ts:417-429`): `first, last, size, isEmpty, isNotEmpty`.
- **Number / Date**: **nessuno** (non esiste un ramo `getProperty` per i numeri; le date sono
  stringhe e i loro nomi-metodo non sono nel ramo `String`). I costruttori di data non sono
  dual: un identificatore nudo `now` restituisce la *funzione*, non la invoca.

Comportamento di un metodo **non**-dual richiamato senza parentesi:
- su **String** → ritorna `null` silenziosamente (cade fuori dallo `switch`, nessun fallback);
- su **Collection** → **lancia** `Cannot access property 'X' on a collection. Use 'forall x in
  collection : x.X' …` (`evaluator.ts:433-435`).

---

## UNCERTAIN / da decidere (per l'appendice)

1. **Conteggio collezioni = 31, non 32** → totale reale **143** (non 144). Da correggere nei
   testi che citano 32/144.
2. **`size` (collezioni) è un alias di `count`** (`export const size = count`,
   `collections.ts:189`): stessa funzione e stessa firma (`predicate?` opzionale). Decidere se
   documentarli come due voci o come una con nota "alias".
3. **`parseDate` (costruttore)** punta a `parseDateString` (`dates.ts:425`), **non** alla
   funzione privata interna `parseDate` (`dates.ts:17`, non esportata, usata solo per il
   parsing). Nessun conflitto a runtime; il nome utente è `parseDate`.
4. **Alias "solo senza parentesi"** presenti nel ramo `getProperty` ma **assenti dal registro**
   (quindi NON contati nei 143, e funzionanti SOLO senza parentesi):
   - String (`evaluator.ts:441-464`): `toUpperCase`, `toLowerCase`, `trimLeft`, `trimRight`,
     `size`, `notEmpty`.
   - Collection (`evaluator.ts:417-429`): `length`, `notEmpty`.
   Inversione da segnalare: es. `s.toUpperCase` funziona (no parentesi) ma `s.toUpperCase()`
   **lancia** "Unknown method" (non è nel registro). Decidere se documentarli come alias o
   ometterli.
5. **Nessun alias deprecato**: `filter`/`map` sono correnti, non deprecati. L'unico alias vero è
   `size`→`count`. Nessuna voce duplicata/legacy nei quattro registri.
6. **Built-in globali fuori dalle quattro famiglie** (per completezza dell'appendice): i
   convertitori di tipo `String(value)`, `Number(value)`, `Boolean(value)`,
   `Array(...values)`, registrati in `evaluator.ts:94-115`. Sono funzioni libere (no receiver),
   non metodi di istanza. Da decidere se includerli.
7. **Tipi di ritorno/argomenti**: nessun metodo è realmente UNCERTAIN — ogni firma è deducibile
   dal codice. Le uniche scelte di *resa* (non di fatto) sono `Integer` vs `Number` (a runtime
   JjEL ha un solo tipo numerico, §convenzioni) e l'uso di `?` per i ritorni che possono essere
   `null` (tutte le Date; `toNumber`/`toInt` su String; `first`/`last`/`min`/`max`/`at` su
   collezione vuota).

---

## Hard stop rispettato

Read-only. Nessuna modifica a `src/`, nessun fix/refactor, nessun file nuovo salvo questo report
(e l'entry di log richiesta da CLAUDE.md §21). Nessun commit, nessun push.
</content>
