# Passo 4 dell'arco 1: restyle del tree pane

**Data**: 2026-08-11 00:55
**Repo**: `jjodel-frontend`
**Branch**: `alfonso-frontend-jjtl`
**Tipo**: esecutivo. Nessuna decisione architetturale autonoma; ogni ambiguità è un hard stop.

Questo prompt è autocontenuto: tutto ciò che serve sta qui sotto. Non ricostruire da memoria
di sessione e non aprire file che non siano elencati.

---

## 0. Guard di stato (prima di qualsiasi altra cosa)

```bash
git rev-parse --abbrev-ref HEAD
git log -1 --abbrev=9 --format='%h %s'
git log -1 --abbrev=9 --format='%h %s' HEAD~1
git log -1 --abbrev=9 --format='%h %s' HEAD~2
git status --porcelain
```

Atteso, esattamente:

| Controllo | Valore atteso |
|---|---|
| branch | `alfonso-frontend-jjtl` |
| HEAD | `2a9226c0f docs: record R-RAIL-24..26 and entity palette unification backlog item` |
| HEAD~1 | `ef1260ddc fix: keep NODE disclosure closed by default` |
| HEAD~2 | `9808a812d feat: restyle NODE section as disclosure in rail shell` |
| working tree | pulito, output di `git status --porcelain` vuoto |

Se anche un solo controllo non corrisponde: **fermati e riporta cosa hai trovato**. Non
riallineare, non stashare, non committare, non fare checkout. Lo stato atteso è la coppia di
chiusura del passo 3 sopra `9808a812d`.

---

## 1. COSA

Applicare al tree pane del rail destro i **quattro** valori di restyle ratificati da R-RAIL-7.
Nient'altro. Il tree continua a riusare `TreeViewContent`: non si tocca il componente, non si
tocca il markup, non si tocca la logica. Il passo 4 è un intervento di solo foglio di stile.

I quattro valori:

1. suffisso di tipo reso in `var(--font-mono)`;
2. altezza di riga 26px;
3. nome a 13px, peso 500;
4. peso 600 sul nome quando la riga è selezionata.

**Fuori scopo, esplicitamente rinviati** (R-RAIL-7): badge lettera, filtro appiattente,
conteggio totale, indent. Nessuno dei quattro entra nel diff, neppure come predisposizione.

---

## 2. DOVE

**File unico da modificare**:
`frontend/src/components/TreeViewSidebar/tree-view-sidebar.scss` (2053 righe).

È un **ampliamento di scope dichiarato**, autorizzato da R-RAIL-15: il restyle del tree si
scrive in questo foglio e non nel foglio del rail. Vietati gli override di specificità scritti
dal foglio del rail per raggiungere le classi del tree.

**Consumatore vivo unico del foglio**: `PropertiesWithTreeView.tsx:11` lo importa.
`TreeViewSidebar.tsx` è codice morto (l'unica menzione fuori dalla sua directory è un
*commento* in `Dock.tsx:281`). `TreeViewContent.tsx` **non importa alcun foglio**. Quindi la
sola superficie viva di questo restyle è il rail.

### I quattro valori: selettore, ancora, stato di oggi

| # | Valore da applicare | Selettore | Ancora | Stato oggi |
|---|---|---|---|---|
| 1 | suffisso di tipo in `var(--font-mono)` | `.tree-feature__type` | `:1907-1915` | `font-size: 11px`, **nessun `font-family`** |
| 2 | riga 26px | `.tree-row` | `:1699-1710` | nessuna altezza dichiarata, `padding` verticale 4px |
| 3 | nome 13px, peso 500 | `.tree-row__name` | `:1765-1775` | `font-size: 11px`, peso non dichiarato |
| 4 | peso 600 sul selezionato | `.tree-row--selected` | `:1740-1750` | solo la pill `::before` con `var(--color-selection-bg)` |

Le ancore sono indicative: **localizza per selettore**, poi verifica che lo stato di oggi
coincida con la colonna «Stato oggi». Se non coincide, vedi §7.

### Dove rendono i valori (serve per la verifica visiva, non per modificare)

| Valore | Punto di render |
|---|---|
| suffisso di feature | `TreeViewContent.tsx:765` |
| suffisso di istanza | `TreeViewContent.tsx:720` |
| nome | `TreeViewContent.tsx:654` |
| nome di rule e helper JjTL | `TreeViewContent.tsx:1470`, `:1479` |

`TreeViewContent.tsx` è in **sola lettura** per questo passo.

---

## 3. COME

### Fase A. Micro-discovery: localizzare il blocco di commento delle tre altezze

Il vincolo di §4 chiede, accanto al 26px, **una riga** di rimando al blocco di commento che
documenta le tre altezze letterali (R-RAIL-9). Quel blocco vive nel **foglio del rail**, che
non è questo file. Devi localizzarlo tu.

Segnali di localizzazione, in ordine:

1. il foglio del rail è il `.scss` toccato dai commit dell'arco: `git show --stat bcc68da8f` e
   `git show --stat 9808a812d` lo elencano;
2. dentro quel foglio, il blocco di commento con le tre altezze letterali è stato introdotto
   durante l'arco: `git log -p` sui commit dell'arco ristretto al file lo mostra;
3. **controprova**: il foglio del rail contiene 92 letterali esadecimali preesistenti e
   un'unica occorrenza di nome in lista nera intorno a `:735`, dentro un commento.

Se il blocco non si trova, o se i candidati sono più di uno, o se la controprova non torna:
**fermati e chiedi**. Non scrivere un rimando a un path ipotizzato.

**Discovery report obbligatorio.** Anche una discovery breve produce un report, non nessun
report.

- **Dove**: `docs/discovery/` (creare la cartella se non esiste);
- **Nome**: `discovery_2026-08-11_rimando_blocco_altezze.md`;
- **Contenuto minimo**: obiettivo della discovery; file letti o analizzati con path completi;
  findings (path del foglio del rail, riga esatta del blocco delle tre altezze, i tre valori
  che documenta); dipendenze e rischi individuati; domande aperte per Alfonso.

Il report è sintetico: dieci righe bastano. Niente tour del codebase.

**Commit 1** (solo il report, per R-RAIL-20 il report di discovery si committa a sé):

```bash
git add docs/discovery/discovery_2026-08-11_rimando_blocco_altezze.md
git commit -m "docs: add discovery report for tree row restyle cross-reference"
```

Scope di `git add` stretto sul singolo file. Mai `git add .`, in nessuna fase.

### Fase B. Implementazione

Leggi per intero le sezioni rilevanti di `tree-view-sidebar.scss` prima di scrivere: serve
capire le convenzioni locali del file, che non sono quelle del foglio del rail.

**Valore 1, suffisso di tipo.** Nel blocco `.tree-feature__type`, aggiungi
`font-family: var(--font-mono);`. Il nome della famiglia non compare mai come letterale
(R-RAIL-5). Non toccare le altre dichiarazioni del blocco.

**Valore 2, altezza di riga.** Nel blocco `.tree-row`:

- se **oggi il nome non manda a capo**, scrivi `height: 26px`;
- **altrimenti** scrivi `min-height: 26px`.

La condizione si verifica leggendo il codice esistente (troncamento, `white-space`,
`overflow`, `text-overflow` su `.tree-row` e `.tree-row__name`), non a occhio. **Non
modificare il troncamento esistente in nessun caso**: non aggiungere, non rimuovere e non
cambiare le proprietà che lo governano. Il `padding` verticale di 4px resta com'è, salvo che
la sua somma con l'altezza produca un box maggiore di 26px: in quel caso vedi §7, non
compensare di iniziativa.

Accanto al valore, **una sola riga** di commento che rimanda al blocco delle tre altezze del
foglio del rail, con il path e la riga trovati in Fase A. Esempio di forma (adatta il path
reale):

```scss
height: 26px; // altezze del rail: vedi il blocco in <path del foglio del rail>:<riga>
```

Il blocco delle tre altezze **resta punto unico**: non duplicarlo qui, non copiarne il testo,
non aggiungere un secondo blocco di commento.

**Valore 3, nome.** Nel blocco `.tree-row__name`, porta `font-size` da 11px a `13px` e
dichiara `font-weight: 500`.

**Valore 4, peso sul selezionato.** Dentro il blocco `.tree-row--selected`, porta a `600` il
peso **del nome** (`.tree-row__name` annidato o discendente, secondo la convenzione già in uso
nel file). Il suffisso di tipo mantiene il proprio peso. Nessun'altra proprietà dello stato
selezionato cambia: la pill `::before` con `var(--color-selection-bg)` resta esattamente
com'è.

### Fase C. Gate

```bash
npm run build       # exit 0
npm run typecheck   # 33, Δ0 sulla baseline
npm run check:docs  # 2/2, 0 warning
```

Un typecheck diverso da 33 è un hard stop.

### Fase D. Conformità (R-RAIL-19)

Esegui sul **diff staged** le **quattro grep di conformità** già girate ai passi 2 e 3. Non
inventarle e non eseguirne di «equivalenti»: recuperale nella loro forma esatta da
`docs/decisions.md` (voce R-RAIL-19) oppure dalle entry dei passi precedenti in
`docs/claude-code-log.md`.

**Se non riesci a recuperare tutte e quattro nella forma verbatim, fermati e chiedi.**

Riporta l'esito di ciascuna con il comando esatto che hai eseguito. Le occorrenze
**preesistenti** si riferiscono, non si correggono (R-RAIL-19).

### Fase E. Commit 2

```bash
git add frontend/src/components/TreeViewSidebar/tree-view-sidebar.scss
git commit -m "feat: restyle tree pane rows in properties rail"
```

Poi **hard stop**: Alfonso fa la verifica visiva su http://localhost:3001/ con hard refresh.
Non proseguire al passo 5, non aggiornare il log, non pushare.

---

## 4. Vincoli

- **Nessuna rinomina di classe.** Le classi CSS sono API interne. Vale per tutte le classi del
  file, non solo per le quattro toccate.
- Le variabili `$` locali a `:5-41` **non si toccano e non si migrano a token**. Ne risulta una
  convivenza dei due stili nello stesso file: è il prezzo del riuso, ed è ratificata.
- `color: var(--color-text-tertiary)` a `:1909` è **in lista nera ma preesistente**: resta
  com'è. Il passo 4 si limita ad aggiungere `font-family` nello stesso blocco. Non correggerlo,
  non annotarlo nel codice (R-RAIL-19: si riferisce nell'entry di log, non si corregge).
- **Niente barra di selezione** (R-RAIL-8): la selezione resta la pill esistente più il peso.
- Niente badge lettera, niente glifi, niente icone nuove.
- Nessun override di specificità dal foglio del rail verso le classi del tree (R-RAIL-15).
- Diff minimale e leggibile: preferire edit puntuali a riscritture. Zero refactoring
  opportunistico, nessun riordino di dichiarazioni, nessun ritocco al codice adiacente.
- Nessuna nuova dipendenza, nessuna modifica a `_form-system.scss` (globale e dichiarato
  intoccabile) né a `TreeViewContent.tsx`.

---

## 5. Cosa NON fare in questo passo

- **Non scrivere l'entry in `docs/claude-code-log.md`** e non ruotare il log. Il log è a 20
  entry e la sua rotazione è materia del passo 5, in un commit suo. Questa è una deroga
  deliberata alla regola generale di CLAUDE.md che chiede l'entry a fine task: è dichiarata
  qui, quindi non è un conflitto da segnalare. Al suo posto, riporta il memo di §8 nella
  risposta di chiusura.
- Non pushare la branch.
- Non toccare `docs/decisions.md`.
- Non aprire il perimetro dell'arco 2 (identity block, palette entity, chip di firma, postura
  Browse/Focus).

---

## 6. Condizioni di hard stop

Fermati e chiedi, senza procedere e senza «riparare», se:

1. il guard di §0 non torna;
2. il blocco delle tre altezze non si localizza, o i candidati sono più di uno, o la controprova
   dei 92 esadecimali non torna;
3. uno dei quattro selettori non esiste, oppure il suo stato di oggi diverge dalla colonna
   «Stato oggi» di §2 (ad esempio `.tree-row` ha già un'altezza dichiarata, oppure
   `.tree-row__name` dichiara già un peso);
4. applicare l'altezza richiederebbe di toccare le proprietà di troncamento o il `padding`;
5. le quattro grep di R-RAIL-19 non si recuperano verbatim;
6. il typecheck non è 33, oppure la build non esce 0, oppure `check:docs` non è 2/2.

In ogni caso di stop: riporta il rilievo, lo stato del working tree e cosa proponi. Non
committare lavoro parziale.

---

## 7. Definition of done

- Due commit sulla branch: il report di discovery, poi il restyle.
- Un solo file di codice nel diff del commit 2:
  `frontend/src/components/TreeViewSidebar/tree-view-sidebar.scss`.
- I quattro valori applicati, il rimando di una riga presente col path reale.
- Gate verde: build 0, typecheck 33 Δ0, `check:docs` 2/2, working tree pulito.
- Quattro grep di R-RAIL-19 eseguite sul diff staged, esito riportato per ciascuna.
- Il suffisso di tipo rende **davvero** in mono: la famiglia computata risolve a un font
  monospace caricato, non a un fallback di sistema (C5.3 di R-RAIL-5). Verificalo sul computed,
  non sul nome della variabile.

---

## 8. Memo per l'entry di log del passo 5

Da riportare nella risposta di chiusura, così il passo 5 non lo ricostruisce:

- ampliamento di scope su `tree-view-sidebar.scss`, autorizzato da R-RAIL-15;
- `height` oppure `min-height`, con la ragione della scelta (il nome manda a capo oggi, sì o no);
- path e riga del foglio del rail e del blocco delle tre altezze, come da discovery report;
- path del discovery report;
- il passo 4 ha prodotto **due** commit, non uno, per via del report committato a sé (R-RAIL-20);
- qualunque divergenza trovata fra le ancore di §2 e il file reale.

---

## 9. Checklist di verifica visiva per Alfonso

Da eseguire su http://localhost:3001/ dopo il commit 2, con hard refresh.

1. Riga del tree: **misura il computed**, non fidarti del valore scritto. Deve dare 26px.
2. Nome a 13px, peso 500. Riga selezionata: nome a 600, pill invariata per colore e geometria.
3. Suffisso di tipo in monospace, su feature e su istanza. Se la famiglia non è caricata il
   fallback si vede: confronta con un altro punto dell'app che usa già `var(--font-mono)`.
4. Nessun wrap nuovo e nessun troncamento diverso da prima, in particolare sui nomi lunghi.
5. Rule e helper JjTL nel tree: nome coerente con gli altri nodi.
6. Inspector, sezione NODE e resto del rail: identici a prima del passo 4.

---

## 10. RIFERIMENTI

| Ratifica | Contenuto rilevante qui |
|---|---|
| R-RAIL-5 | `var(--font-sans)` / `var(--font-mono)`, mai nomi di famiglia. C5.3: DoD col font che rende davvero |
| R-RAIL-7 | Il tree riusa `TreeViewContent`; solo quattro valori di restyle. Rinviati badge lettera, filtro appiattente, conteggio totale, indent |
| R-RAIL-8 | Niente barra di selezione: pill esistente più peso 600 |
| R-RAIL-9 | Tre altezze letterali in blocco di commento |
| R-RAIL-15 | Il restyle del tree si scrive in `tree-view-sidebar.scss` (ampliamento di scope dichiarato). Vietati gli override di specificità dal foglio del rail |
| R-RAIL-19 | Le grep di conformità girano sul diff staged; le occorrenze preesistenti si riferiscono, non si correggono |
| R-RAIL-20 | Il report di discovery si committa a sé |

Fonte di verità del codebase: `CLAUDE.md` in root. Se questo prompt lo contraddice in un punto
non dichiarato in §5, segnala il conflitto invece di eseguirlo.
