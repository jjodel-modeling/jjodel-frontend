# Discovery 2026-08-30 — `brokenRef` sul ramo IR, e il difetto (2) del fixture che non c'e' piu'

**Data**: 2026-08-30
**Branch**: `alfonso-frontend-jjtl`, HEAD `3029a4e81`
**Prompt**: «Fixture: brokenRef sul ramo IR + coda micro-residui» — chiudere il residuo
dichiarato in §5 di `discovery_2026-08-30_rstr6b_full_ladder.md` (B)
**Sonde**: `frontend/scripts/smoke/_tmp_brokenref_measure.ts` (passo 0, lo stato) e
`_tmp_brokenref_verify.ts` (accettazione, 16/16). Nessuna delle due committata.
**Esito**: **chiuso**. I tre stati di una reference dipingono sul ramo IR come sul nativo,
e le guardie vincono su annotazione e override. Piu' una correzione a un fatto registrato
nel fixture, e la coda micro di `tree.scss`.

Strumento: `command grep` (BSD grep), mai il wrapper `ugrep --ignore-files` a cui `grep`
risolve in questa shell. Ogni asserzione di assenza porta il proprio controllo positivo.

---

## 0. Una correzione: il difetto (2) del fixture era vero il 28/08, non lo e' su HEAD

Il fixture porta a registro, dal 28/08, due difetti che esso stesso esibisce. Il secondo
diceva:

> (2) The broken reference renders as a dash, not as `brokenRef`. […] `brokenRefMemory`
> and the `brokenRef` renderer are therefore NOT exercised by this fixture yet.

E `docs/decisions.md` R-FORM-10 (30/08) sembrava spiegarlo, generalizzando: «la cascata
del core raggiunge `case 'values'` e fa `SetFieldAction(slot,'values',deletedID,'-=')`,
quindi **accorcia** l'array». Se cosi' fosse, lo slot `cfg` di `allNine_broken` resterebbe
vuoto e `brokenRef` non sarebbe raggiungibile in nessun modo da questo fixture.

**Misurato su HEAD, passo 0, prima di qualunque diff** (`_tmp_brokenref_measure.ts`):

```
Config vivi     : ["Config_main"]              ← Config_old cancellato
allNine_valued  : cfg rawValues ["Pointer…_47"]  resolves ["Config_main"]
allNine_broken  : cfg rawValues ["Pointer…_49"]  resolves [null]     ← APPESO
ramo nativo, riga cfg:
  allNine_valued : refPill    "Config_main"
  allNine_broken : brokenRef  "Config_old"     ← non un dash
```

Il puntatore **sopravvive** alla delete, non risolve, e il ramo nativo dipinge
`brokenRef` col nome **ricordato** da `brokenRefMemory`, non con l'id accorciato. Cioe':
il difetto (2) e' chiuso, e i commenti di `brokenRefMemory.ts` e della riga 474 del fixture
(«the reducer scrubs no inbound pointer») sono quelli giusti.

**Sul rapporto con R-FORM-10**: le due misure non sono in contraddizione diretta e questo
referto non tocca la ratifica. R-FORM-10 misura un `0..*` con due bersagli cancellato dal
percorso del manager; qui il `cfg` e' un `0..1` con un bersaglio, cancellato da
`LObject.delete()` chiamato dal fixture. Quale delle due variabili faccia la differenza —
cardinalita', percorso, o entrambe — **non e' misurato qui** e resta aperto. Cio' che questo
referto stabilisce e' piu' stretto e basta alla slice: *su questo caso, su HEAD, il
puntatore resta appeso*. Chi tocchera' R-FORM-10 ha qui il controesempio.

Il commento (2) del fixture e' stato riscritto con la data della ri-misura, non cancellato:
era vero quando fu scritto.

## 1. Il residuo di §5, misurato

Il §5 di (B) diceva: «la view IR Demo dichiara un solo compartimento, di sorgente
`attributes`, quindi nessuna riga di reference e' a schermo».

**Confermato, con il numero** (`_tmp_brokenref_measure.ts`, sezione C): con il viewpoint
IR Demo attivo, ogni nodo `AllNine` mostra **1 compartimento, 12 righe**, e le righe `cfg`
sul ramo IR sono **0**. Il ramo nativo la disegnava (sezione B sopra) — quindi non era una
riga assente dal modello, era una riga che il compartimento non chiedeva.

`IRNodeContent` partiziona le righe R/A a monte (`rows.references` / `rows.attributes`,
`IRNodeContent.tsx:207`) e serve a un compartimento **solo** l'array della sua sorgente. Una
view che dichiara `attributes` e basta non ha alcun posto dove una reference possa comparire.

**Dove sta la view IR di RowViewSmoke.** Il prompt la colloca in `examples/RowViewSmoke`.
Quella cartella contiene il solo `index.ts`, che **non dichiara alcuna view IR**: la demo
view e' `editor-v2/viewpoint/ir/irDemoFixture.ts`, installata da
`window.__jjodelInstallIRDemo('AllNine','visible')` — la chiamata che ogni sonda del fronte
IR fa (`_tmp_rstr6b_verify.ts:85`, `_tmp_rstr6_verify.ts`, questa). E' li' che il
compartimento e' stato aggiunto, ed e' l'unico candidato: `command grep -rn "IR Demo"` su
`frontend/src` porta un file solo.

## 2. Il diff, tre file

### 2.1 `irDemoFixture.ts` — il compartimento `references`

Una costante condivisa, `REFERENCES_COMPARTMENT`, aggiunta in coda ai
`fieldCompartments` di **entrambe** le demo view (base e flagged).

`rowFormat` **identico** a quello di `attrs`, deliberatamente: i due compartimenti devono
differire nella sorgente e in nient'altro, o una differenza in cio' che dipingono si
potrebbe leggere come una differenza in come e' stato chiesto loro di dipingerlo.

Additivo su tre conti, tutti verificati a schermo (§3):
- **nessuna chiave IR nuova**: `source: {from:'references'}` e' irVersion 1.0, dichiarato
  in `irTypes.ts:130`. Nessuna migrazione, nessun bump.
- **`attrs` intatto**: stesso id, stesse 12 righe, stessi nomi, stesso ordine.
- **inerte dove non serve**: `IRNodeContent` salta un compartimento la cui sorgente e'
  vuota (`if (source.length === 0) return null`), quindi le demo view di `State` e `Task`,
  i default del helper, rendono esattamente come prima.

### 2.2 `examples/RowViewSmoke/index.ts` — la terza istanza, e i commenti

`valuedInstance` accetta ora `cfgTarget: string | null`; `null` significa che lo slot `cfg`
non viene mai scritto e resta come conformita' l'ha creato. Aggiunta **in coda** a `order`
una terza `AllNine`, `allNine_noref` — in coda perche' le sonde delle altre sessioni
indirizzano per posizione via `createdIds`, e le prime quattro devono tenere i loro id.

Le tre istanze differiscono **solo** nella reference:

| istanza | `cfg` | stato | renderer |
|---|---|---|---|
| `allNine_valued` | `Config_main`, vivo | valida | `refPill` |
| `allNine_broken` | `Config_old`, cancellato | rotta | `brokenRef` |
| `allNine_noref` | mai scritto | vuota | `dash` |

**Perche' una istanza e non una seconda feature.** Il prompt lascia la scelta («su istanze
gia' presenti o aggiunte in coda»). Una seconda reference sul metamodello avrebbe aggiunto
una riga a **ogni** nodo `AllNine`, e i conteggi che le sonde di (A) e (B) asseriscono
— «12 righe, 0 vuote», «24 righe = 12 feature × 2 istanze» — sarebbero diventati falsi.
Una istanza in piu' non tocca nessuna riga esistente.

Riscritti due commenti, entrambi per la ri-misura di §0: il difetto (2) e la nota sulla
delete.

### 2.3 `tree.scss` — `$color-accent`

La coda micro del prompt. Rimossa la sola dichiarazione, riga 20.

## 3. L'accettazione, 16/16 ALL GREEN

`_tmp_brokenref_verify.ts`, zero errori di pagina. Il ramo nativo e' letto **prima** di
accendere il viewpoint IR: con l'IR attivo il nodo nativo non e' a schermo, e «non trovato»
si leggerebbe come «rende altro» (l'errore che la sonda di (B) dichiara).

```
0  ramo nativo:  refPill / brokenRef / dash                        3/3
1  ramo IR, gli stessi tre, appaiati al nativo feature per feature  3/3
2a due compartimenti su ogni nodo AllNine                          ok
2b `attrs` intatto: 12 righe, gli stessi nomi nello stesso ordine   ok
2c `refs` porta la sola `cfg`                                      ok
2d un nodo senza reference NON monta il compartimento (Config, Color) ok
3  la riga rotta legge `Config_old`, non `Pointer…` accorciato      ok
4  guardie vs ANNOTAZIONE  (@renderer=code su cfg)                 3/3
5  guardie vs OVERRIDE DI VIEW (FormSpec.widgets.cfg=textarea)     3/3
```

I controlli 4 e 5 sono l'estensione del 16/16 di (B): i tre stati **non** si lasciano
dichiarare, ne' dal gradino 1 ne' dal gradino 0. E' l'ordine che `detectValueRenderer`
impone (`valueRenderer.ts:622-631`, le guardie sopra i due gradini) verificato a schermo
sul ramo IR invece che nel solo test unitario.

**Reperto di metodo — il nodo IR non si indirizza per nome.** La prima stesura della sonda
cercava il nodo IR per nome dell'istanza nel testo, e ha fallito **10 controlli su 10** con
«nodo assente» mentre il controllo 2, che non indirizza per nome, vedeva tutti e tre i nodi.
Causa: l'etichetta della demo view legge `$name.value`, cioe' lo slot `name`, e `AllNine`
non dichiara quell'attributo — l'etichetta e' vuota. Dieci fallimenti che descrivevano la
sonda, non il prodotto. L'indirizzo giusto e' il `data-id` del nodo React Flow, che e' l'id
del `DVertex`, e `DVertex.model` porta al `DObject`
(`GraphDataElements.tsx:1673`). Il controllo 2 ha fatto da controllo positivo: senza di
esso i dieci FAIL sarebbero stati leggibili come una regressione.

## 4. La coda micro: `tree.scss`, misura uses-vs-declares

Metodo R-NV-7: le variabili SCSS sono **file-scoped**, quindi il conteggio si fa **dentro
il file** e un grep repo-wide per omonimia sarebbe un falso positivo di massa.

Estrattore: per ogni `^\$nome` dichiarata, il numero di righe del file che la nominano. **1
= la sola dichiarazione**, cioe' orfana; ≥2 = almeno un consumatore.

**`$color-accent` e' orfana per effetto di `00b6a9fbc`**, come il prompt dichiara — e la
misura lo prova per confronto fra i due alberi:

```
$color-accent  prima di 00b6a9fbc : 2   (dichiarazione + 1 uso)
$color-accent  su HEAD            : 1   (la sola dichiarazione)
```

**Ma non e' sola.** Sulle 30 variabili del file, le orfane sono **8**:

```
$color-accent          $color-bg-secondary   $color-bg-tertiary   $color-border
$color-text-secondary  $font-size-sm         $radius-sm           $spacing-md
```

Le altre sette erano **gia' orfane prima** di `00b6a9fbc` (contate a 1 anche in
`git show 00b6a9fbc^`), quindi non sono un effetto collaterale della pulizia del 30-08 e
non rientrano in questa coda. **Dichiarate, non rimosse** (Regola 9): sono materiale per
una slice che le misuri per proprio conto, come il 30-08 fece per `nestedView.scss`.

Controllo positivo dell'estrattore: `$spacing-sm` conta 3 — dichiarazione piu' due usi
reali, righe 77 e 86. Un estrattore che restituisse 1 su tutto sarebbe rotto, non
informativo.

**Gate: il CSS compilato e' identico.**

```
sass --style=compressed  su HEAD  → md5 03bbe9cbd7289c37fe66560f449eb292, 3356 byte
sass --style=compressed  col diff → md5 03bbe9cbd7289c37fe66560f449eb292
diff: vuoto
```

3356 byte, non zero: la compilazione ha prodotto CSS vero, quindi il confronto ha segnale.

**Il gate a pixel sul tree non ha segnale, e lo si dichiara** (R-NV-8, e il reperto §4.2
del referto del 30-08). La certificazione qui e' l'identita' del CSS compilato, che e' piu'
forte di un confronto di ritagli: se il foglio prodotto e' lo stesso byte per byte, nessun
pixel che quel foglio governa puo' essere cambiato.

## 5. Cosa NON e' verificato

- **Il rapporto esatto fra questa misura e R-FORM-10**: vedi §0. Il controesempio e'
  registrato, la variabile che lo spiega no.
- **Dark mode**: fuori scope, come in (B).
- **Le view IR nei progetti salvati**: il campione resta quello che il repo ha — una sola
  view IR di esempio, il limite gia' dichiarato in §1 di (B).
- **Le altre sette variabili orfane di `tree.scss`**: misurate e dichiarate (§4), non
  toccate.
- **Il fronte manager** (`instanceTable.ts`, la terza superficie viva della libreria):
  invariato, il motore non e' stato toccato.
