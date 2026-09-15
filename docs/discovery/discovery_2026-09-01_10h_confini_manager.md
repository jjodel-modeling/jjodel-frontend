# 10h — i tre confini verticali del manager

Slice di solo chrome, giro 1 dei ritocchi visuali richiesti a schermo il 31-08.
Perimetro: `abstract/tabs/instanceManagerTab.scss` e la sua suite.
Referto della sonda `frontend/scripts/smoke/_tmp_10h_{measure,verify}.ts`.

---

## 1. Il difetto, misurato prima di toccarlo

Il rail METACLASSES/VIEWS finiva contro il fondo desk della colonna centrale
senza confine. La causa non è un token sbagliato: è un selettore che non arriva.

Il foglio dichiara **un solo** separatore, sul fratello:

```scss
&__pane {
    ...
    + .instance-manager__pane { border-left: 1px solid var(--color-form-border); }
}
```

`.instance-manager__main` **non è** un `__pane` — è il desk di 10d, non una
superficie di lettura — quindi la regola non lo raggiungeva. Misurato con
`_tmp_10h_measure.ts` (viewport 1600×950, fixture StateMachine/State/Transition):

| elemento | x..right | `border-left` |
|---|---|---|
| `.leftbar.leftbar--project` | 0..240 | — (`border-right: 1px solid rgb(226,232,240)`) |
| `.instance-manager__pane--outline` | 241..541 | `0px none` |
| `.instance-manager__pane--classes` | 541..741 | `1px solid rgb(226,232,240)` |
| `.instance-manager__main` | 741..1599 | **`0px none`** |

Le tre colonne sono adiacenti senza scarto (241, 541, 741): il confine mancante è
il terzo, e solo il terzo.

## 2. Il token: quello che il prompt ipotizza non esiste

Il prompt propone «verosimilmente `1px solid --color-border-subtle/#e2e8f0`».
Misurato sulla radice del documento, `getPropertyValue('--color-border-subtle')`
restituisce la **stringa vuota**: quel nome non è dichiarato da nessuna parte nel
sistema (`command grep -rn "border-subtle" frontend/src/styles` → zero righe).
Un `var()` su quel nome avrebbe dipinto il valore iniziale, cioè nessun bordo —
esattamente il difetto da cui parte la slice, riprodotto per un'altra via.

Il valore giusto è quello **già in uso ai due confini esistenti**:

| token | valore | dove risolve |
|---|---|---|
| `--color-form-border` | `#e2e8f0` (`$slate-200`) | il separatore fra i pannelli del manager |
| `--color-border-primary` | `#e2e8f0` | `tokens.css` vince su `_colors-light.scss` (`$slate-300`) |
| `--color-border-subtle` | *(non esiste)* | — |

## 3. La correzione

Si **estende il selettore** invece di dichiarare un `border-right` sul rail:

```scss
+ .instance-manager__pane,
+ .instance-manager__main { border-left: 1px solid var(--color-form-border); }
```

Tre ragioni, in ordine di peso:

1. **Il confine sta su chi segue.** È la convenzione già in uso in questo blocco.
   Un `border-right` locale sul rail avrebbe messo i due confini interni su due
   lati opposti, cioè su due regole che nessuno tiene allineate.
2. **Una dichiarazione sola.** Il prompt chiede che i tre confini portino lo
   stesso token: due regole gemelle sono due token il giorno in cui qualcuno ne
   cambia una. Con il selettore esteso i due confini interni **non possono**
   divergere — sono la stessa riga.
3. **Il rail porta già la classe.** `__pane--classes` è un `.instance-manager__pane`:
   la richiesta «il rail deve portare la classe separatore invece di una regola
   locale» è soddisfatta senza toccare il TSX.

Il reset dei pannelli **impilati** dentro `__main`
(`&__main > __pane + __pane { border-left: 0 }`, specificità (0,3,0)) non è
toccato e continua a vincere: la form sotto la tabella non prende bordi verticali.

Costo di layout: `__main` è `flex: 1 1 auto`, quindi assorbe il pixel — 858 → 857.
I due pannelli a larghezza fissa (300, 200) non si muovono.

## 4. La misura a schermo

`_tmp_10h_verify.ts`, girata **due volte** con lo stesso file e la slice in
`git stash`. Viewport 1600×950, zero errori di pagina in entrambi i giri.

**before 21 PASS / 5 FAIL — after 26 PASS / 0 FAIL.** I 5 rossi del before sono
esattamente il blocco 2, quello di contrasto; ogni altro blocco è verde in
entrambi i giri, ed è quello che lo rende un controllo.

I tre confini, `after`:

| confine | elemento che dipinge | computed |
|---|---|---|
| rail dell'app → Model outline | `.leftbar` `border-right` | `1px solid rgb(226, 232, 240)` |
| outline → metaclassi | `__pane--classes` `border-left` | `1px solid rgb(226, 232, 240)` |
| metaclassi → colonna centrale | `__main` `border-left` | `1px solid rgb(226, 232, 240)` |

Stesso colore, stesso spessore, stesso stile. Nel `before` il terzo era
`0px none rgb(15, 23, 42)`, cioè il `currentColor` di un bordo mai dichiarato.

**E poi il pixel.** Un `computed style` è una misura del rendering solo se
l'elemento misurato è quello che dipinge (CLAUDE.md §5). Decodificati i PNG e
letta la colonna di pixel a tre altezze diverse (y = 300, 500, 700):

| confine | x | before | after |
|---|---|---|---|
| rail dell'app | 239 | `(226,232,240)` | `(226,232,240)` |
| outline → metaclassi | 541 | `(226,232,240)` | `(226,232,240)` |
| metaclassi → desk | 741 | `(248,250,252)` — il desk, nudo | **`(226,232,240)`** |

Una colonna sola, in tutti e tre i casi, alle tre altezze. Ritagli
`_tmp_10h_{before,after}_{1_rest,2_selected,3_filtered,4_no_outline,5_dark}.png`.

**Non-regressioni**, verdi in entrambi i giri: fondo desk `rgb(248,250,252)`;
le due card con bordo, raggio 12px e ombra identici fra loro; il filtro montato e
funzionante (6 → 1 righe su `Idl`); i badge lettera di 10f (`m`, `S`, `T`, 16×16);
il badge «C» del rail 18×18; la selezione dall'outline che accende **una** riga
sola (l'invariante di 10g). I tre confini non cambiano né sotto selezione né sotto
filtro. Con l'**outline chiuso** dal rail VIEWS, il confine nuovo resta e il rail —
diventato primo pannello — correttamente **non** prende un bordo a sinistra.

## 5. Il confine di riferimento diverge, ma non nel colore

Il rail sinistro dell'app è `.leftbar--project`, `pages/dashboard.scss:990`, e
scrive il suo bordo **letterale**: `border-right: 1px solid #e2e8f0`. In chiaro
non c'è divergenza da correggere — `#e2e8f0` **è** il valore che
`--color-form-border` risolve, e i tre confini dipingono lo stesso rgb, misurato
sia nel computed style sia nel pixel.

La divergenza è **nominale**, e sostituire quella riga con il token la
peggiorerebbe. Misurato nel blocco 5 della sonda, con `data-theme="dark"`:

| | chiaro | scuro |
|---|---|---|
| `--color-form-border` | `#e2e8f0` | `rgba(255,255,255,0.08)` |
| `.leftbar` | `rgb(226,232,240)` | `rgb(226,232,240)` |
| i due confini del manager | `rgb(226,232,240)` | `rgba(255,255,255,0.08)` |

Il blocco `.leftbar--project` è scritto **tutto** in esadecimale letterale —
`background: #f8fafc`, `border-bottom: #e2e8f0` sulle sue sezioni — e non ha
**alcuna** regola di tema scuro (`command grep -i dark` sul blocco: zero righe).
Portare al token il solo bordo darebbe un pannello chiaro con un bordo quasi
trasparente: una incoerenza nuova al posto di una vecchia. La convergenza di quel
blocco è una slice sua, sul rail dell'app e non sul manager, ed è fuori dal
perimetro dichiarato di 10h. **Segnalata, non fatta.**

## 6. La suite

`abstract/tabs/__tests__/instanceManager10h.test.ts`, **18 casi**. Asserzioni sul
sorgente del foglio, come 10c/10d/10f e per la stessa causa misurata: il TSX
importa il barrel di `editor-v2/`, che arriva a monaco, che dereferenzia `window`
all'import. Qui pesa meno del solito, perché il delta della slice **è** il foglio.

Provata con **sette** mutazioni, ognuna verde al ripristino:

| mutazione | rossi |
|---|---|
| tolta l'estensione a `__main` | 2 |
| letterale `#e2e8f0` al posto del token | 3 |
| `2px` invece di `1px` | 3 |
| `border-right` locale sul rail | 3 |
| secondo token di bordo (`--color-form-border-strong`) | 3 |
| tolto il reset dei pannelli impilati | 1 |
| variabile CSS dichiarata nel foglio (regola 28) | 1 |

Quello che la suite **non** può dire, e che la sonda dice: che i tre confini
DIPINGANO lo stesso rgb. Un token identico nel sorgente e un colore identico a
schermo sono due affermazioni diverse — la seconda è sulla cascata.

## 7. Stato dell'albero al momento della misura

Le misure sono state prese con il lavoro **DS-1 di un'altra sessione non
committato** in albero (`docs/DESIGN-SYSTEM.md`, `styles/tokens/_colors-{light,dark}.scss`,
`styles/__tests__/`). Non interferisce: DS-1 muove `--color-entity-model-*`, e
nessuno dei tre confini legge quel token. Si vede però nella sonda — il badge del
nodo modello misura `rgb(243,232,211)`/`rgb(107,81,16)`, cioè l'ambra di DS-1 e
non più la coppia contenitori. Il commit di 10h è stato fatto con pathspec e
indice verificato vuoto prima e dopo.
