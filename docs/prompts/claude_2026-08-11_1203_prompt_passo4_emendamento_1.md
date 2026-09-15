# Passo 4, emendamento 1: atto zero, guard rivisto, quintetto di grep

**Data**: 2026-08-11 12:03
**Repo**: `jjodel-frontend`
**Branch**: `alfonso-frontend-jjtl`
**Emenda**: `2026-08-11_0055_prompt_passo4_restyle_tree.md`
**Tipo**: esecutivo. Nessuna decisione architetturale autonoma; ogni ambiguità è un hard stop.

Si legge **insieme** al prompt del passo 4, non al suo posto. Dove questo documento e il
prompt divergono, vince questo documento, e solo nei punti che nomina esplicitamente. Tutto
il resto del prompt resta in vigore parola per parola, §4 e §5 compresi.

Origine: una sessione Cowork ha eseguito la Fase A in sola lettura sul repo montato e ha
incontrato tre condizioni che il prompt non prevedeva. Due sono state ratificate da Alfonso
l'11 agosto; la terza è un residuo tecnico da chiudere prima del guard.

---

## 0-bis. Atto zero: il lock e la rinomina a metà

**Prima del guard di §0**, e solo qui, sono autorizzate scritture fuori dai due file del
passo 4.

Stato di partenza, misurato alle 09:45 UTC dell'11 agosto:

```
 D docs/sessioni/sessione_2026-08-10_4.md
?? docs/sessioni/claude_sessione_2026-08-10_4.md
?? .claude/settings.local.json
```

più un `.git/index.lock` da 0 byte, stantio. Il lock è stato prodotto da un `git status` di
quella sessione, che gira su un mount dove la unlink è vietata: git ha scritto il lock e non
è riuscito a rimuoverlo. Nessun processo git è attivo e nessuna operazione di scrittura è
stata tentata, quindi rimuoverlo è sicuro.

I due file di `docs/sessioni/` sono la stessa rinomina, fatta a mano da Alfonso: il
checkpoint prende il prefisso `claude_` degli altri venti.

```bash
rm -f .git/index.lock
git add docs/sessioni/sessione_2026-08-10_4.md docs/sessioni/claude_sessione_2026-08-10_4.md
git commit -m "docs: rename session checkpoint to the claude_ convention"
```

Due path espliciti. **Mai `git add .`, in nessuna fase, atto zero incluso.** Git registra la
coppia come rinomina; se il `--stat` mostra un add e un delete invece di un rename, va bene
lo stesso e non si interviene.

`.claude/settings.local.json` **resta untracked e fuori da ogni commit**. È un file di
configurazione locale di Claude Code, 196 byte, del 24 luglio, non intercettato da alcuna
regola di `.git/info/exclude` (che elenca dieci pattern `**/.claude/*` ma non questo). La
scelta di lasciarlo dov'è è di Alfonso, presa l'11 agosto. Non aggiungerlo agli exclude, non
committarlo, non spostarlo.

Questo è il **commit 0**. Il passo 4 produce quindi **tre** commit, non due.

---

## 0-ter. Guard di §0, valori attesi emendati

Il guard del prompt si esegue **dopo** l'atto zero, con questi valori:

| Controllo | Valore atteso |
|---|---|
| branch | `alfonso-frontend-jjtl` |
| HEAD | il commit 0, `docs: rename session checkpoint to the claude_ convention` |
| HEAD~1 | `abe5fdc8b session document` |
| HEAD~2 | `2a9226c0f docs: record R-RAIL-24..26 and entity palette unification backlog item` |
| HEAD~3 | `ef1260ddc fix: keep NODE disclosure closed by default` |
| HEAD~4 | `9808a812d feat: restyle NODE section as disclosure in rail shell` |
| working tree | **esattamente una riga**: `?? .claude/settings.local.json` |

L'ultima riga sostituisce il «pulito, output vuoto» del prompt. Un output vuoto significa che
qualcuno ha toccato quel file e va segnalato come divergenza, non festeggiato. Qualsiasi
altra riga oltre a quella è hard stop, come da §6.1.

---

## 1. Fase A: esito già disponibile, la discovery non si rifà

La micro-discovery di §3 Fase A è stata eseguita in sola lettura e ha prodotto un risultato
univoco. **Non ripeterla da zero**: verifica i quattro numeri qui sotto con quattro comandi e
prosegui. Se anche uno solo non torna, fermati.

**Foglio del rail**: `frontend/src/components/editors/properties-with-tree-view.scss`,
1448 righe a `abe5fdc8b`. È l'unico `.scss` elencato sia da `git show --stat bcc68da8f` sia
da `git show --stat 9808a812d`.

**Blocco delle tre altezze**: righe **4-34**, commento in testa al foglio, titolato
`LITERAL px IN THE RAIL'S NEW CODE (arc 1, 2026-08-10)`. La clausola (a), quella di
R-RAIL-9, comincia a `:9`. Le tre altezze stanno a `:14` (44px, rail header), **`:15`
(26px, tree row)**, `:17` (28px, multiplicity segmented control). Candidato unico: nessun
altro blocco del foglio le enumera.

Il foglio contiene già a `:1388` il precedente della forma di rimando:

```scss
height: 44px;   // literal by R-RAIL-9 — see the block at the top of this file
```

**Controprova del segnale 3: torna, ma su un'altra revisione.** I numeri del prompt (92
esadecimali, lista nera «intorno a `:735`») vengono da
`docs/discovery/discovery_2026-08-10_arco1_ancoraggio.md` §8, che li dichiara «a baseline» su
un file di 1366 righe. Riconciliazione:

| Revisione | Righe | Esadecimali | Lista nera |
|---|---|---|---|
| `bcc68da8f^` (pre-arco) | 1366 | **92** | **`:735`**, unica, in un commento |
| `bcc68da8f` | 1527 | 87 | idem, rinumerata |
| `abe5fdc8b` (HEAD) | 1448 | **82** | **`:717`**, unica, stessa riga byte per byte |

La riga è sempre `border-bottom: 1px solid #f1f5f9; // var(--color-border-primary);`. Il delta
di 10 è la tokenizzazione fatta dall'arco. A HEAD compare una seconda corrispondenza della
lista nera a `:1327`: è `var(--shadow-*)` scritto dentro il commento dell'arco che cita
R-RAIL-10, quindi un glob in prosa, non un consumo di token. Non conta.

I quattro comandi di verifica:

```bash
git show --stat 9808a812d | grep '\.scss'
sed -n '4,34p' frontend/src/components/editors/properties-with-tree-view.scss
git show bcc68da8f^:frontend/src/components/editors/properties-with-tree-view.scss \
  | grep -oE '#[0-9a-fA-F]{8}\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b' | wc -l   # atteso 92
git show bcc68da8f^:frontend/src/components/editors/properties-with-tree-view.scss \
  | grep -n 'color-border-primary'                                             # attesa la riga 735
```

### Discovery report, contenuto e commit 1

Il report resta **obbligatorio** e va scritto, anche se la discovery non è stata rifatta: al
path e col nome del prompt, `docs/discovery/discovery_2026-08-11_rimando_blocco_altezze.md`.
Contenuto minimo: obiettivo; file letti coi path completi; findings (foglio del rail, riga del
blocco, i tre valori); la riconciliazione della controprova della tabella qui sopra; la nota
che la discovery è stata eseguita l'11 agosto in sessione Cowork e qui verificata; dipendenze
e rischi; domande aperte. Dieci righe bastano.

```bash
git add docs/discovery/discovery_2026-08-11_rimando_blocco_altezze.md
git commit -m "docs: add discovery report for tree row restyle cross-reference"
```

---

## 2. Fase B: tre hard stop già sciolti

Le quattro ancore di §2 sono state verificate contro il file reale e **coincidono tutte** con
la colonna «Stato oggi». §6.3 non scatta. Verificale comunque leggendo i blocchi, ma non
fermarti a cercare divergenze che non ci sono.

| # | Selettore | Riga reale | Stato oggi |
|---|---|---|---|
| 1 | `.tree-feature__type` | `:1907` | `font-size: 11px`, `color: var(--color-text-tertiary)`, nessun `font-family` |
| 2 | `.tree-row` | `:1699` | nessuna altezza, `padding-top` e `padding-bottom` a 4px |
| 3 | `.tree-row__name` | `:1765`, annidato come `&__name` | `font-size: 11px`, peso non dichiarato |
| 4 | stato selezionato | `:1740` | solo `&--selected::before` con `var(--color-selection-bg)` |

**Valore 2: si scrive `height`, non `min-height`.** La condizione del prompt è risolta.
`.tree-row__name` (`:1767-1771`) dichiara `white-space: nowrap`, `overflow: hidden`,
`text-overflow: ellipsis`, quindi il nome non manda a capo oggi. E
`frontend/src/styles/tokens/index.scss:60-62` dichiara `* { box-sizing: border-box; }`, quindi
i 26px assorbono gli 8px di padding verticale: content box 18px, box totale 26px. **Il padding
non va toccato** e il caso di §6.4 non si presenta. Non modificare in alcun modo le proprietà
di troncamento.

Riga da scrivere, col rimando:

```scss
height: 26px; // altezze del rail: vedi il blocco in frontend/src/components/editors/properties-with-tree-view.scss:15
```

**Valore 4: la forma è discendente, non annidata.** Nel file **non esiste** un blocco
`.tree-row--selected { }`: ci sono solo `&--selected::before` (`:1740`) e
`&--selected:hover::before` (`:1748`), dentro `.tree-row`. Il peso del nome va quindi scritto
così, dentro `.tree-row`, dopo il blocco `&--selected:hover::before`:

```scss
&--selected .tree-row__name {
    font-weight: 600;
}
```

Specificità `(0,2,0)`, che vince sul `font-weight: 500` di `.tree-row__name` `(0,1,0)` senza
`!important`. È la convenzione già in uso nel file per lo stesso schema, a `:1981`
(`.tree-row--action-create .tree-row__name`) e `:1997`
(`.tree-row--action-delete .tree-row__name`). **Non** scrivere `&__name` dentro
`&--selected`: compilerebbe in `.tree-row--selected__name`.

**Edit chirurgico sul valore 1.** Nel blocco `.tree-feature__type` aggiungi la sola riga
`font-family: var(--font-mono);`. Non riscrivere il blocco: se la riga preesistente
`color: var(--color-text-tertiary);` entra nel diff come riga aggiunta, la grep 1 di §3 qui
sotto diventa rossa per un motivo che non è una violazione, e ti costringe a un hard stop
inutile. R-RAIL-19 dice che le occorrenze preesistenti si riferiscono e non si correggono:
il modo più semplice per rispettarlo è non farle comparire nel diff.

---

## 3. Fase D emendata: cinque grep, non quattro

Il prompt manda a recuperare le quattro grep da `docs/decisions.md` (voce R-RAIL-19) o dalle
entry dei passi 2 e 3 in `docs/claude-code-log.md`. **Nessuna delle due fonti le contiene**:
`decisions.md` non ha la voce R-RAIL-19 (nella sezione del rail ci sono 1..13, 16, 18, 22, 23,
24, 25, 26), e il log non ha entry per i passi 2 e 3, coerentemente con la deroga di §5 che ne
rimanda la scrittura al passo 5. L'unica fonte che le descrive è
`discovery_2026-08-10_arco1_ancoraggio.md` §8, che ne mette quattro in tabella e ne cita una
quinta (`font-family:`) nella conseguenza 1.

**Ratifica di Alfonso, 11 agosto**: si girano **tutte e cinque**, come soprainsieme. Un
soprainsieme non può mancare le quattro vere, e nessuna delle cinque è inventata. §6.5 è
sciolta da questa ratifica e non va invocata.

Tutte e cinque girano sul **diff staged del solo file di codice**, dopo `git add` e prima di
`git commit`. Le righe di intestazione del diff (`+++`) sono escluse, altrimenti il path del
file inquina il conteggio.

```bash
F=frontend/src/components/TreeViewSidebar/tree-view-sidebar.scss
D() { git diff --cached -U0 -- "$F" | grep '^+' | grep -v '^+++'; }

# 1 — i 13 nomi in lista nera di R-RAIL-6 (atteso: 0)
D | grep -E -- '--(color-bg-primary|color-bg-secondary|color-border-focus|color-border-primary|color-border-secondary|color-text-secondary|color-text-tertiary|shadow-|transition-fast|transition-slow)'

# 2 — ombre da token (atteso: 0)
D | grep -- 'var(--shadow-'

# 3 — letterali esadecimali (atteso: 0)
D | grep -E '#[0-9a-fA-F]{3,8}\b'

# 4 — z-index (atteso: 0)
D | grep -- 'z-index'

# 5 — font-family (atteso: 1, ed è quella giusta)
D | grep -- 'font-family:'
```

**La grep 5 deve dare esattamente una riga**, ed è `+    font-family: var(--font-mono);`. Non
è una violazione: è il valore 1 del passo. La verifica è che quella riga consumi la variabile
e **non** contenga un nome di famiglia in chiaro (`IBM Plex Mono`, `monospace`, virgolette).
Zero righe significa che il valore 1 non è stato applicato; due o più, che il diff ha toccato
qualcosa che non doveva.

Riporta l'esito di ciascuna col comando esatto eseguito.

---

## 4. Cosa resta invariato, in particolare

- **§5 vale per intero.** `docs/decisions.md` **non si tocca in questo passo**, neppure per
  iscrivere R-RAIL-19. L'iscrizione va al passo 5, che è già un passo di documentazione e non
  ha bisogno di una deroga nuova; il testo pronto è in §6 qui sotto. Nessuna entry in
  `docs/claude-code-log.md`, nessuna rotazione, nessun push.
- **§4 vale per intero**: nessuna rinomina di classe, niente refactoring opportunistico,
  nessun override di specificità dal foglio del rail, `TreeViewContent.tsx` in sola lettura.
- **Fase C invariata**: `npm run build` a 0, `npm run typecheck` a 33 con Δ0,
  `npm run check:docs` a 2/2. Misura di controllo presa l'11 agosto su `abe5fdc8b` prima di
  ogni modifica: `check:docs` dava già **2/2, 0 warning**. La build è l'unico dei tre gate che
  compili davvero il Sass, quindi è l'unico che eserciti questa modifica: se fallisce, è un
  hard stop vero e non un falso positivo di ambiente.
- **Fase E e hard stop finale invariati**: dopo il commit 2 si ferma tutto e Alfonso fa la
  verifica visiva su `http://localhost:3001/` con hard refresh.

---

## 5. Definition of done emendata

- **Tre** commit sulla branch: rinomina del checkpoint, report di discovery, restyle.
- Un solo file di codice nel diff del commit 2:
  `frontend/src/components/TreeViewSidebar/tree-view-sidebar.scss`.
- I quattro valori applicati; il rimando di una riga presente col path reale e la riga 15.
- Gate verde: build 0, typecheck 33 Δ0, `check:docs` 2/2.
- Working tree a fine passo: **esattamente** `?? .claude/settings.local.json`.
- Cinque grep eseguite sul diff staged, esito riportato per ciascuna, con la 5 a una riga.
- Il suffisso di tipo rende davvero in mono, verificato sul computed style (C5.3 di R-RAIL-5).

---

## 6. Memo per l'entry di log del passo 5

Da riportare nella risposta di chiusura. Sostituisce l'elenco di §8 del prompt, che resta
valido nei punti non ripetuti qui.

- **Tre** commit, non due: atto zero (rinomina del checkpoint), report di discovery
  committato a sé per R-RAIL-20, restyle;
- `.git/index.lock` stantio rimosso in atto zero, prodotto da un `git status` eseguito su un
  mount senza permesso di unlink. Se in futuro si opera dal bridge di Cowork, le scritture git
  non sono sicure: ogni comando lascia un lock che non riesce a rimuovere;
- `.claude/settings.local.json` resta untracked per scelta dell'11 agosto, e non è coperto da
  `.git/info/exclude`. Candidato a una voce di igiene, non a questo passo;
- ampliamento di scope su `tree-view-sidebar.scss`, autorizzato da R-RAIL-15;
- `height: 26px` e non `min-height`, perché il nome non manda a capo (`nowrap` più
  `text-overflow: ellipsis` su `.tree-row__name:1767-1771`) e perché
  `* { box-sizing: border-box }` (`styles/tokens/index.scss:61`) fa assorbire gli 8px di
  padding dentro i 26;
- rimando scritto verso
  `frontend/src/components/editors/properties-with-tree-view.scss:15`, blocco righe 4-34,
  clausola (a) a `:9`;
- discovery report: `docs/discovery/discovery_2026-08-11_rimando_blocco_altezze.md`;
- divergenza sulle ancore di §2: nessuna sui quattro stati, una sulla forma del valore 4,
  perché il blocco `.tree-row--selected` non esiste e il peso si scrive come discendente;
- la controprova di §3 Fase A del prompt (92 esadecimali, lista nera a `:735`) è una misura
  pre-arco su `bcc68da8f^`; a HEAD vale 82 e `:717`. Chi scrive prompt futuri dichiari la
  revisione insieme al numero;
- **R-RAIL-19 va iscritta in `docs/decisions.md`** nel passo 5, con questo testo:

> **R-RAIL-19** (2026-08-10, forma fissata il 2026-08-11) — Le grep di conformità dell'arco
> girano sul **diff staged**, mai sul file intero, perché il foglio del rail ha 82 letterali
> esadecimali preesistenti che renderebbero la grep rossa sempre. Le occorrenze preesistenti
> si riferiscono nell'entry di log, non si correggono. Il quartetto originario non era stato
> messo a registro e non è stato più recuperabile dalle fonti autorizzate; l'11 agosto si è
> fissato il **quintetto** che lo sostituisce, preso da
> `docs/discovery/discovery_2026-08-10_arco1_ancoraggio.md` §8: (1) i 13 nomi in lista nera di
> R-RAIL-6; (2) `var(--shadow-`; (3) letterali esadecimali `#[0-9a-fA-F]{3,8}`; (4) `z-index`;
> (5) `font-family:`. La quinta ha atteso diverso da zero quando il passo aggiunge una
> famiglia: la verifica è che la riga consumi `var(--font-mono)` e non un nome in chiaro.

---

## 7. RIFERIMENTI

Invariati rispetto a §10 del prompt. Si aggiungono:

| Fonte | Contenuto rilevante qui |
|---|---|
| `docs/discovery/discovery_2026-08-10_arco1_ancoraggio.md` §8 | Le cinque grep e la loro forma sul diff; le misure di baseline (92 esadecimali, lista nera a `:735`, z-index già conforme) |
| Ratifica in chat Cowork, 2026-08-11 | Quintetto di grep al posto del quartetto; atto zero come primo commit del passo 4; `.claude/settings.local.json` lasciato untracked |

`CLAUDE.md` in root resta la fonte di verità. Se questo emendamento lo contraddice in un punto
non dichiarato qui o in §5 del prompt, segnala il conflitto invece di eseguirlo.
