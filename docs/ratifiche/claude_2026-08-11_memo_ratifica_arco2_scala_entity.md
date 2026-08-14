# Memo di ratifica: R-RAIL-29 sul grep, e la scala entity nuova (terza via)

**Data**: 2026-08-11
**Stato del repo**: quattro commit locali del passo 1, non pushati. Niente di quanto segue è
stato verificato contro origin, perché su origin non c'è.
**Cosa ti chiedo**: ratifica di R-RAIL-29 e di R-RAIL-30, più tre risposte puntuali in fondo.
Col tuo ok scrivo il prompt del passo 2.

---

## 1. R-RAIL-29, la regola sul grep

La scoperta è tua, fatta col controllo positivo che R-RAIL-28 prescrive, alla prima
applicazione della regola. Ha due metà, e finora ne è atterrata una sola.

**Metà già a posto**: l'esempio dentro la sotto-regola di `CLAUDE.md` §5, che hai riscritto col
comportamento misurato invece di quello immaginato.

**Metà mancante**: il fatto in sé, cioè che su quella macchina `grep` non è GNU grep. Serve
scritto in due posti, perché vincola due attori diversi.

### 1.1 Testo per `CLAUDE.md` §5, come sotto-regola a sé

> **Sub-rule: `grep` on this machine is not GNU grep**
>
> The interactive `grep` resolves to a wrapper around `ugrep --ignore-files`. Two consequences,
> both measured, not assumed:
>
> - Gitignored paths are skipped by default. `--exclude-dir=node_modules` is a no-op, and a
>   search for something that lives under an ignored path returns a silence that is not
>   evidence.
> - `--include=<glob>` does not filter. ugrep reads it as a file name and warns. Searches
>   written that way are wider than declared, not narrower.
>
> When GNU semantics are required, call `command grep` explicitly. Otherwise use ugrep's own
> flags. A search scope written into a prompt is a claim about what the command does: if the
> command does something else, the scope was never enforced.

### 1.2 Testo per le custom instructions del progetto

Questo vincola me, non Claude Code, e `CLAUDE.md` non lo raggiunge. Va incollato nelle custom
instructions, in coda alla sezione «Regole per Claude Code», oppure in `contesto_progetto.md`
se preferisci tenerlo nel knowledge.

> ### Ricerche nei prompt
> Su questo Mac `grep` non è GNU grep ma un wrapper di `ugrep --ignore-files`. Nei prompt per
> Claude Code non si scrivono flag GNU dati per buoni: `--exclude-dir` è inerte, perché i path
> gitignorati sono già esclusi, e `--include=<glob>` non filtra, perché viene letto come nome
> di file. Se servono le semantiche GNU, il prompt scrive `command grep`. Ogni scope di ricerca
> dichiarato in un prompt è una promessa sul comportamento del comando: se il comando non la
> mantiene, lo scope non è mai esistito.

### 1.3 Voce a registro, puntatore come per R-RAIL-28

> - **R-RAIL-29** (2026-08-11) — Su questa macchina `grep` è un wrapper di
>   `ugrep --ignore-files`: `--exclude-dir` è inerte e `--include` non filtra. Testo normativo
>   in `CLAUDE.md` §5, sotto-regola «`grep` on this machine is not GNU grep»; il vincolo gemello
>   sui prompt scritti in chat sta nelle custom instructions del progetto. Scoperta dal
>   controllo positivo prescritto da R-RAIL-28, alla sua prima applicazione.

### 1.4 Portata retroattiva, per non scoprirla due volte

Ogni ricerca prescritta nei prompt precedenti aveva uno scope diverso da quello dichiarato:
più largo sui tipi di file, e più stretto sui path. La direzione larga è innocua, quella
stretta no. Un'asserzione di assenza su qualcosa che vive sotto un path gitignorato non era
dimostrabile con quel comando, e questo include `node_modules`, `dist`, `build` e
`.claude/`. Non propongo un riesame sistematico: propongo che chiunque citi una vecchia
asserzione di assenza come autorità la rifaccia prima di citarla.

---

## 2. R-RAIL-30, la scala entity

Hai scelto la terza via, quindi la scala si disegna, non si eredita. Qui c'è la proposta con i
valori generati, non stimati. Il metodo prima, perché è quello che ratifichi davvero: i numeri
si rigenerano in un minuto se cambi un vincolo.

### 2.1 I cinque vincoli che la generano

**Il cyan è fuori.** È già prenotato tre volte, come `--color-selection-bg`, come barra di
selezione ritirata ma non rimossa, e come `--color-cyan-600`. R-RAIL-8 ha lasciato il triplo
ruolo inerte anziché scioglierlo. Se un kind entity indossa il cyan, identità di tipo e stato
di selezione diventano lo stesso segnale. La banda esclusa è circa 210-250 di tinta OKLCH.

**I contenitori sono una famiglia, non quattro colori.** `viewpoint`, `metamodel`, `model` e
`package` condividono la tinta slate 257 a croma molto bassa. Questo trasforma il difetto del
pannello, dove metamodel e package sono accidentalmente identici, in una regola: i contenitori
si leggono neutri, gli elementi cromatici. È anche l'unica lettura compatibile con «slate base
con accenti cyan». Regge a una condizione, ed è la prima domanda in fondo.

**I cinque kind cromatici sono equispaziati per costruzione**, 59.6 gradi l'uno dall'altro
sull'arco che resta. Nessuna coppia può essere accidentalmente vicina, perché la spaziatura non
è scelta a mano. L'assegnazione minimizza lo scostamento dai colori del tree di oggi: enum si
sposta di 2 gradi, attribute di 12, operation di 24, class di 30. `reference` è l'unico
spostamento deliberato, ed è quello che lo toglie dal cyan.

**`literal` è la tinta di enum a metà croma.** Un literal appartiene a un enum, e il colore lo
dice invece di inventare un decimo significato.

**I valori sono generati in OKLCH a chiarezza fissa**, quindi tutti i badge hanno lo stesso peso
percepito, e il contrasto è misurato riga per riga. Nessun valore è stato scelto a occhio.

### 2.2 La scala

| kind | tinta | light bg | light fg | contrasto | dark bg | dark fg | contrasto |
|---|---|---|---|---|---|---|---|
| viewpoint | 257 | `#E9F1FB` | `#4C5C73` | 5.98 | `#272E38` | `#BECEE4` | 8.56 |
| metamodel | 257 | `#E9F1FB` | `#4C5C73` | 5.98 | `#272E38` | `#BECEE4` | 8.56 |
| model | 257 | `#E9F1FB` | `#4C5C73` | 5.98 | `#272E38` | `#BECEE4` | 8.56 |
| package | 257 | `#E9F1FB` | `#4C5C73` | 5.98 | `#272E38` | `#BECEE4` | 8.56 |
| class | 357 | `#FFEAF0` | `#99285D` | 6.49 | `#44212E` | `#FFB3CD` | 8.37 |
| enum | 56 | `#FFECDF` | `#8A4600` | 6.19 | `#43260F` | `#FFBB8C` | 8.37 |
| literal | 56 | `#FEECE1` | `#7D4E2B` | 6.11 | `#3A2A1F` | `#F0C1A2` | 8.40 |
| attribute | 175 | `#D2FBEF` | `#036A58` | 5.86 | `#00372C` | `#58E8C8` | 8.71 |
| reference | 116 | `#EEF4D3` | `#596101` | 5.91 | `#2D310C` | `#C8D76D` | 8.61 |
| operation | 297 | `#F1EDFF` | `#6641A5` | 6.39 | `#312746` | `#D2C1FF` | 8.49 |

Contrasto minimo su dieci kind e due temi: **5.86**. La soglia AA per testo piccolo è 4.5, e i
badge sono a 11px, quindi il margine c'è. Il rapporto fra fondo del badge e fondo di pagina sta
fra 1.05 e 1.15 in entrambi i temi: il badge si stacca senza gridare.

Le quattro collisioni incrociate che hai trovato spariscono per costruzione, perché la scala ha
una sorgente sola. Sparisce anche il collasso metamodel/package, che qui è voluto e dichiarato
invece che accidentale.

### 2.3 Nomi dei token, proposta condizionata

`--color-entity-<kind>-bg` e `--color-entity-<kind>-fg`, più
`--color-entity-container-bg` e `--color-entity-container-fg` per i quattro contenitori, che
condividono la coppia invece di replicarla quattro volte. In `_colors-light.scss` e
`_colors-dark.scss`, entrambi, per `CLAUDE.md` §7.2.

**Condizione**: se i token entity esistono già con un'altra convenzione di nome, vince quella
esistente e si cambiano solo i valori. Il report di discovery risponde a questa domanda al
punto 4, ma non è su origin e non posso leggerlo.

---

## 3. Cosa manca prima che io scriva il prompt del passo 2

Due dati, entrambi già nel tuo report di discovery, che mi servono verbatim:

1. **Punto 4**: i token entity esistono già? Con quali nomi, e per quali kind.
2. **Punto 2, coda**: chi consuma `constants/documentTypes.ts`. Il report mi è arrivato
   troncato lì. Se quella terza palette dipinge qualcosa che si vede, entra nel passo 2, e la
   scala qui sopra deve coprirne i tipi; se è morta o serve solo per icone, resta fuori e va a
   backlog.

---

## 4. Cosa serve da te

**Domanda 1, la più importante.** Il badge porta un glifo o un testo oltre al colore? Se sì, la
famiglia contenitori regge, perché il colore dice «è un contenitore» e il glifo dice quale. Se
il colore è l'unico canale, questa scala è sbagliata e serve la variante a dieci tinte distinte,
che ho già calcolata e che costa il collasso di due contenitori nella banda verde.

**Domanda 2.** `reference` in giallo-verde `#EEF4D3 / #596101`, che è dove lo mette la
spaziatura uniforme, oppure in magenta `#FFE8FC / #883183`, che è più bello ma sta a 33 gradi da
operation, e reference e operation sono fratelli che si leggono in fila. Io tengo il
giallo-verde e accetto che sia il colore meno gradevole della scala, perché la leggibilità di
tre feature affiancate vale più dell'estetica di una.

**Domanda 3.** Contrasto minimo a 5.86, che è la scala qui sopra, oppure a 6.83, che costa un
testo più scuro e badge più pesanti. Io tengo 5.86.

Col tuo ok su queste tre, il passo 2 diventa: commit A con R-RAIL-29 e R-RAIL-30 a norma e a
registro, commit B con i token in light e dark, commit C con i consumatori del pannello, commit
D con quelli del tree, poi log e rotazione.
