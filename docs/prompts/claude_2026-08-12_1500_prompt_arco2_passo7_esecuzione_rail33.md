# Prompt Claude Code — arco 2, passo 7: esecuzione di R-RAIL-33, via i tre blocchi entity dal tree

**Data**: 2026-08-12 15:00 (rev 3: rev 2 piu' il commit di chiusura a registro)
**Tipo**: refactor
**Perimetro**: due fogli SCSS. Fuori dalla critical zone. Nessun `.tsx`.
**Base**: `b89b5e46`. Working tree pulito, altrimenti STOP.
**Numerazione**: prende lo slot 7 perché è pronto e la postura no; la postura scala a 8.

**Diff verificata allegata**: `patch_2026-08-12_rimozione_selettori_entity_tree_rev2.diff`.
La rev 1 e' ritirata: regrediva il tema dark. Non usarla. La rev 2 e' provata su clone Linux sopra
`b89b5e46`: `npm run typecheck` **14, il baseline locale, invariato** (33 sul Mac), `npm run build`
exit 0, resa **identica al pixel in light** e **fondi identici a HEAD in dark**.

---

## Perché

`docs/decisions.md` R-RAIL-33 dice che la scala entity non entra nel tree. I tre blocchi che ce la
mettono sono ancora nei fogli e dichiarano un'intenzione che il prodotto non ha più. La voce di
`docs/TECH-DEBT.md` riscritta al passo 5 ne dà la causa: colorano il `<span>`, mentre a dipingere è
l'`<i class="bi">` interno, che prende il colore da `styles/style.scss:790`.

---

## COSA

**Due commit.** Il primo e' il codice, il secondo chiude la voce a registro. Separati perche' il
primo ha uno smoke visivo che lo trattiene e il secondo no.

### Commit A — il codice: due file

#### A.1 `frontend/src/components/TreeViewSidebar/tree-view-sidebar.scss`

**Blocco light**, il commento «Per-type palette: one pair of entity tokens…» e le undici regole
`&.tree-D*` che seguono: via. Ogni kind dichiarava `color` **più** `background-color`.

**Blocco dark**, il commento «Dark mode — bare colored glyphs…» e le undici dichiarazioni a una riga
dentro `.tree-node__icon`: via.

#### A.2 `frontend/src/components/editors/properties-with-tree-view.scss`

La copia del pannello, cioè le undici dichiarazioni dentro `.tree-view-panel-body .tree-node__icon`:
via. È la copia che vinceva la cascata a `(0,3,0)`.

#### A.3 Cosa si tiene, e perché non è un dettaglio

**Due regole dentro quei blocchi non sono colore e restano.** Rimuoverle sarebbe uno sconfinamento
di scope e la regola 9 lo vieta:

- `&.tree-nested-model { font-style: italic; }` nel blocco light. Il corsivo del glifo del modello
  M1 annidato. Nella diff resta come blocco a sé, con il solo `font-style`.
- `&.tree-DClass { &.abstract-class { font-style: italic; } }` nella copia del pannello. È dead
  code nel rail (nessun `.tsx` emette `abstract-class`, il produttore vive in
  `components/forEndUser/Tree.tsx:139`), ma la sua rimozione non è mandata da questo passo. Se va
  tolta, è la voce sua e va aperta a parte.

**Le righe viewpoint e view-leaf non si toccano.** `tree-view-sidebar.scss:1397` e `:1408`,
`.tree-node__icon.tree-viewpoint` e `.tree-node__icon.tree-leaf-view`: sono pastiglie e colorano il
**fondo** del `<span>`, quindi funzionano davvero. È l'eccezione dell'emendamento (2) a R-RAIL-33.

#### A.4 Le lapidi

Dove stavano i blocchi resta un commento che dice perché non ci sono più, perché la voce di debito
avverte che il passaggio successivo li «ripara» rimettendo il colore contro una ratifica. Il
commento cita R-RAIL-33 e R-RAIL-36, dichiara la misura a zero pixel, e nomina chi vince adesso.

---

## Correzione della rev 1: perche' serve la riga di guardia

La rev 1 diceva «attesa: nessun cambiamento, in entrambi i temi». Era una previsione, non una
misura: avevo misurato il solo light. **Sbagliata.** L'hard stop 2 e' scattato correttamente.

`components/forEndUser/tree.scss:237` scopa la propria meta' scura come
`html[data-theme="dark"] { .tree-DClass { background-color: rgba(14,165,233,.2) } ... }`, cioe'
**(0,2,1)**. Il `background: transparent` di base del pannello, che sopravvive alla rimozione, e'
`.tree-view-panel-body .tree-node__icon` = **(0,2,0)**, e perde. Le undici dichiarazioni rimosse
stavano a (0,3,0) e tenevano **due** fronti: la `-bg` del foglio del tree, che il commento
nominava, e la meta' dark della quarta palette, che non nominava. Il secondo mestiere non era stato
costato da nessuno.

Misurato in dark, harness con `localStorage.theme = 'dark'`, tre build a confronto:

| kind | HEAD | solo rimozione | rimozione + guardia |
|---|---|---|---|
| `tree-DClass` | trasparente | `rgba(14, 165, 233, .2)` | trasparente |
| `tree-DModel` | trasparente | `rgba(100, 116, 139, .2)` | trasparente |
| `tree-DPackage` | trasparente | `rgba(245, 158, 11, .2)` | trasparente |
| `tree-viewpoint` | `rgb(36, 46, 61)` | invariato | invariato |
| `tree-leaf-view` | `rgb(36, 46, 61)` | invariato | invariato |

Il colore del glifo dipinto non si muove in nessuna delle tre build: **R-RAIL-36 regge**, e cio' che
si muoveva era il fondo del contenitore, che l'analisi del passo 5 non guardava.

La riga aggiunta:

```scss
[data-theme="dark"] &:not(.tree-viewpoint):not(.tree-leaf-view) {
    background: transparent;
}
```

Il `:not()` non e' cosmetico. Senza, la riga sta a (0,3,0) e batte le due pastiglie ratificate, che
sono a (0,2,0): spegnerebbe il fondo di viewpoint e view-leaf, cioe' l'eccezione dell'emendamento
(2) a R-RAIL-33. Con il `:not()` sale a (0,5,0) e le lascia stare, misurato.

## Il fatto controintuitivo, misurato

**Dopo la rimozione, la regola vincente su quegli `<span>` diventa la quarta palette**, quella di
`components/forEndUser/tree.scss`, globale e non scopata. Misurato sul clone, stessa scena:

| selettore | prima | dopo |
|---|---|---|
| `.tree-DClass` | `rgb(122, 64, 86)` entity class fg | **`rgb(14, 165, 233)`** cyan della palette legacy |
| `.tree-DPackage` | `rgb(69, 86, 111)` slate | **`rgb(245, 158, 11)`** ambra |
| `.tree-DModel` | `rgb(69, 86, 111)` | `rgb(100, 116, 139)` slate-500 |
| `.tree-viewpoint` | `rgb(69,86,111)` su `#E2EAF5` | invariato |
| `.tree-leaf-view` | `rgb(69,86,111)` su `#E2EAF5` | invariato |

E nonostante questo: **zero pixel di differenza**, 153.258 campionati, delta massimo 0. Perché
nemmeno la quarta palette dipinge, per la stessa ragione delle altre tre.

Il punto operativo: questo passo **non** introduce il cyan a video, ma toglie l'ultimo schermo che
stava davanti alla palette legacy. Il giorno in cui qualcuno disinnesca `i.bi` nel perimetro del
rail, quella diventa attiva. È già a registro come voce di debito propria.

---

## Verifiche, e quali sono già fatte

Già misurate sul clone, non previste:

- `npm run typecheck`: 14, invariato per file.
- `npm run build`: exit 0.
- **Light, resa identica al pixel**: 153.258 campionati, **zero diversi**, delta max 0, HEAD contro
  rimozione + guardia. La guardia e' scopata su dark e in light e' inerte: misurato, non dedotto.
- **Dark, fondi identici a HEAD** su tutti i kind, con le due pastiglie ratificate intatte.
- **L'harness è deterministico**: stessa build, due esecuzioni, zero differenze. Quindi lo zero qui
  sopra è un'assenza di effetto, non rumore.
- **Le lapidi non toccano l'output**: verificato sulla rev 1, md5 della CSS emessa invariato prima e
  dopo averle scritte. I commenti `//` non arrivano al CSS. La rev 2 cambia l'md5, e deve: la riga di
  guardia e' una regola vera, non un commento.

Da fare a te:

**Smoke visivo su entrambi i temi.** L'harness adesso attraversa anche il dark, ma solo sullo
scenario che costruisce: metamodello nuovo, una classe concreta e una astratta. Restano fuori i kind
che quello scenario non produce (attribute, reference, operation, enum, literal, parameter, object)
e i modelli M1. La guardia li copre per costruzione, perche' e' una riga sola e non per-kind, ma la
copertura per costruzione non e' una misura: guardali.

---

## Commit B — la chiusura a registro

Solo `docs/`. Da fare **dopo** che lo smoke visivo del commit A è passato, non prima: se lo smoke
trova qualcosa, questo commit racconterebbe una chiusura che non c'è stata.

### B.1 Chiudere la voce di debito

`docs/TECH-DEBT.md`, voce «I selettori entity del tree colorano il contenitore, non il glifo».
Sostituire `Fix strutturale raccomandato` e `Priorità`:

```
**Fix strutturale raccomandato:** **eseguito il 2026-08-12**, commit <SHA del commit A>. I tre
blocchi sono via. La rimozione ha richiesto una riga che nessuno aveva previsto: in dark le undici
`background: transparent` della copia del pannello non tenevano solo la `-bg` del foglio del tree,
tenevano anche la meta' scura della quarta palette, che e' scopata `html[data-theme="dark"]`, cioe'
(0,2,1), e batte il `background: transparent` di base a (0,2,0). Tolte le undici, sei kind
prendevano una pastiglia traslucida: DClass `rgba(14,165,233,.2)`, DModel `rgba(100,116,139,.2)`,
DPackage `rgba(245,158,11,.2)`, e cosi' via. Ripristinato con una riga sola,
`[data-theme="dark"] &:not(.tree-viewpoint):not(.tree-leaf-view) { background: transparent }`, dove
il `:not()` protegge le due pastiglie ratificate dall'emendamento (2) a R-RAIL-33. Misurato su tre
build: light zero pixel di differenza, dark fondi identici a prima su tutti i kind, colore del glifo
dipinto invariato ovunque.
```

```
**Priorità:** chiusa.
```

### B.2 Correggere la voce sulla quarta palette

Stessa voce di prima, «Una quarta palette entity, globale e non scopata». Il suo `Stato attuale`
dice che i suoi selettori «perdono per specificità (0,1,0 contro 0,2,0 e 0,3,0)». **È vero solo in
light.** In dark il foglio si scopa `html[data-theme="dark"]` e sale a (0,2,1), dove vince contro
(0,2,0). Sostituire quella parentesi con:

```
(in light perdono a (0,1,0) contro (0,2,0); in dark il foglio si scopa `html[data-theme="dark"]`,
sale a **(0,2,1)** e **vince** contro il `background: transparent` di base del pannello. Dal
2026-08-12 e' trattenuto li' da una riga di guardia in `properties-with-tree-view.scss`, dentro il
blocco `.tree-node__icon`. Quella riga e' uno schermo, non una soluzione: si toglie solo dopo aver
scopato questo foglio sotto la radice del componente legacy, mai prima.)
```

### B.3 R-RAIL-37 a registro

`docs/decisions.md`, in fondo alla sezione dell'arco, dopo R-RAIL-36:

```
- **R-RAIL-37** (2026-08-12) — Prima di rimuovere una dichiarazione si enumerano **tutte** le regole
  che sta battendo, non solo quella che il commento accanto nomina. Le undici `background:
  transparent` della copia del pannello ne tenevano due, la `-bg` del foglio del tree e la meta'
  dark della quarta palette, e il commento ne dichiarava una: la seconda non era stata costata da
  nessuno. La verifica e' meccanica e costa un giro di build: si toglie, si ricostruisce, si
  confronta lo stile computato **su ogni tema**, non sul tema che si ha davanti. Nata dall'hard stop
  del passo 7.
```

**Onestà sulla provenienza, da mettere nelle note del log e non nella regola**: la meta' dark non e'
sfuggita per mancanza di una regola. `CLAUDE.md` §5 dice gia', dal passo 5 e con parole scritte in
quella stessa sessione, che «a screenshot is evidence only of the state it contains: before writing
"X does not render", build the state where X would render if the claim were false». Il tema dark era
quello stato, e non e' stato costruito. R-RAIL-37 aggiunge la parte che davvero mancava, cioe'
l'enumerazione dei fronti che una dichiarazione tiene; la parte sulla copertura dei temi era gia'
scritta e non e' stata seguita.

### Gate del commit B

`npm run check:docs` verde. Nessun file sotto `frontend/src/`.

## Hard stop

1. Working tree non pulito → STOP.
2. **Se dopo la rimozione un glifo cambia colore, o un contenitore prende un fondo che prima non
   aveva**, STOP e riporta. Questo hard stop e' gia' scattato una volta, sul fondo in dark, ed e'
   servito: la rev 1 sarebbe entrata con una regressione.
3. **Se `.tree-node__icon.tree-viewpoint` o `.tree-leaf-view` finiscono nel diff**, STOP: sono
   l'eccezione ratificata e non vanno rimosse.
4. Se il diff tocca un `.tsx`, STOP.

## Log

Formato §21.2. `Corregge`: `—`. `Causa`: `—`. `Regressions`: `no` solo dopo lo smoke sui due temi,
`unknown` altrimenti. `Out-of-scope changes`: `no`. `Layer Impact Report`: `not-required`.
`Smoke visivo`: obbligatorio.

Nelle note: le due regole `font-style` tenute e perché; il ribaltamento della cascata verso
`forEndUser/tree.scss` con i tre valori misurati; lo zero pixel.

## Cruscotto

Chiude **«I selettori entity dei glifi nel tree non producono colore a video»** (Backlog arco 2
rail, DEBITO, in coda), ma **solo dopo lo smoke visivo sui due temi**: la voce si chiude sul commit
B, non sul commit A. Il titolo nel cruscotto è ancora quello vecchio: al passo 5 la voce in
`TECH-DEBT.md` è stata rititolata **«I selettori entity del tree colorano il contenitore, non il
glifo»**, e conviene allineare anche il cruscotto prima di chiuderla, altrimenti resta a registro
un titolo che dice una cosa falsa.
