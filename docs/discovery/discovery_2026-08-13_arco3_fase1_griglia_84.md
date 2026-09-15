# Discovery — arco 3, fase 1: la griglia 84px e il perimetro del form dell'inspector

**Nome del documento prompt**: 2026-08-13 14:00
**Tipo**: discovery read-only. Nessun file sorgente modificato.
**Eseguita**: 2026-08-13, 14:30–14:55, su Mac, working tree `/Users/alfonso/jjodel`.

**Obiettivo**: stabilire con misura se la griglia `84px 1fr` del design §7 è scrivibile
dentro il perimetro negativo dell'arco 3, e con quale convenzione i bound vanno scritti nel
modello. Sei domande, ciascuna con comando, output e conclusione.

---

## AVVISO IN CIMA — tre scostamenti che cambiano la natura del compito

Il prompt chiede di riverificare le misure prese su `origin/alfonso-frontend-jjtl` a
`93800c7`. La riverifica ha trovato tre scostamenti, e il primo è di grado, non di dettaglio.

### Scostamento 1 — i passi A, B e C sono già implementati e committati

```
$ git log --oneline origin/alfonso-frontend-jjtl..HEAD
96bbd8bbc docs: arco 3 discovery report and handover
ad8e8e061 feat(rail): inspector form grid, segmented multiplicity, flag chips
01a74d39d fix(navbar): raise navbar above the floating properties rail
d8b2e9e28 docs: log entry for the required-boolean default fix
33b12350a fix(model): fill empty slots when an attribute becomes a required boolean
7f5f68b53 fix(model): required boolean slots are born carrying false
faa9b112d docs: rotazione del log a 20 entry attive (ventiduesimo lotto)
```

```
$ git log --oneline -1 --stat ad8e8e061
ad8e8e061 feat(rail): inspector form grid, segmented multiplicity, flag chips
 frontend/src/components/editors/Info.tsx                   | 228 +++++++---
 frontend/src/components/editors/properties-with-tree-view.scss | 494 +++++++++++++++++
 2 files changed, 661 insertions(+), 61 deletions(-)
```

Il working tree non è «avanti almeno del fix del booleano obbligatorio»: è avanti di sette
commit, e uno di essi **è l'arco 3, passi A, B e C**. Il passo D risulta anch'esso già
presente (una sola disclosure `Advanced`, `Info.tsx:1486-1502`, vedi §Q6-bis).

Esiste inoltre già un report di discovery sulle stesse domande, committato in
`96bbd8bbc`: `docs/discovery/discovery_2026-08-13_form_inspector_griglia_84.md` (153 righe),
più `docs/handover/2026-08-13_arco3_form_inspector.md` (349 righe).

**Conseguenza sul mandato**: le sei domande restano legittime e sono state eseguite da capo,
in modo indipendente, sul working tree. Ma non rispondono più a «il passo A è fattibile»:
rispondono a «la scelta già scritta regge alla verifica». Questo report è quindi una
**verifica a posteriori**, non un'istruttoria preventiva. Le conclusioni sono formulate in
quei termini.

### Scostamento 2 — il repository si è mosso durante la sessione

Al momento dell'apertura della sessione (14:30) `git status` riportava cinque file modificati
e un report non tracciato. Alle 14:52 lo stesso comando riporta un solo file modificato, e
`HEAD` è avanzato di tre commit:

```
$ git log --oneline 96bbd8bbc..HEAD
8cc34ed45 docs: discovery reports and log entries for the dark menu fix and the Theme removal
e682047a1 refactor(navbar): remove the Theme entry from the user menu
e8a53f47d fix(menu): opaque surface and legible hover for dropdowns in dark mode
```

Inoltre `properties-with-tree-view.scss` è stato riscritto sotto la lettura. Misurato: alle
14:35 il diff contro `HEAD` valeva 4 righe (fra cui un `background: red;` di debug lasciato
in albero); alle 14:47 lo stesso diff vale `92 insertions(+), 34 deletions(-)`, il `red` è
sparito e al suo posto c'è lavoro su `--color-selection-bg`. La riga che dichiara la griglia
si è spostata da 1792 a 1794 fra due comandi della stessa sessione.

Il caso è servito da controllo involontario sulla regola CLAUDE.md §5 «non fidarsi delle
fixture a memoria»: un numero di riga letto dieci minuti prima era già falso.

**Tutte le misure di questo report sono quindi ancorate a uno stato dichiarato**, non a un
numero di riga. Per il file in movimento:

```
$ git hash-object frontend/src/components/editors/properties-with-tree-view.scss
7d8a4b1d39aed231b21e4c87b2d0f8c18239cf13     # 2328 righe, mtime 2026-08-13 14:47:09
```

I file `.tsx` misurati sono invece **puliti rispetto a HEAD**, quindi le misure su di essi
sono riproducibili:

```
$ git status --short <i quattro .tsx letti>
(vuoto)
$ git hash-object Info.tsx PropertiesWithTreeView.tsx ViewData.tsx
2b4547a79498912f1dd8cebec9543504b6706946  Info.tsx
4a997455fbf75d01183e11a860b35fd14b4599a0  PropertiesWithTreeView.tsx
f89e9fd9a5c3910f44abf95c833c1ddaa1ceae2a  ViewData.tsx
```

### Scostamento 3 — nessuno: la baseline typecheck è quella attesa

```
$ npm run typecheck > /tmp/tc-full.txt 2>&1 ; echo "EXIT=$?"
EXIT=2
$ grep -c "): error TS" /tmp/tc-full.txt
33
$ grep -cE "error TS(1261|1149)" /tmp/tc-full.txt
19          # 12 × TS1261 + 7 × TS1149
```

33 errori, di cui 19 di casing: esattamente la baseline dichiarata in CLAUDE.md §17. I 14
restanti sono quelli censiti (`api/data.ts` ×3, `Measurable.tsx` ×6, `Dummy.ts`,
`EditorV2.tsx:2886`, `ChatMessages.tsx:246`, `ProjectEditor.tsx:220`, `Dashboard.tsx:570`).
Il working tree non ha nulla di rotto prima di questa fase.

**Nota di metodo, perché il primo tentativo ha mentito.** La prima esecuzione era
`npm run typecheck 2>&1 | tail -60` e il conteggio sull'output troncato dava **12**. Dodici
non era un risultato: era il numero di errori visibili nell'ultima finestra da 60 righe. È
esattamente il fallimento che CLAUDE.md §5 descrive («un conteggio preso sulle righe 1-62 di
un file da 157 righe è un conteggio su quella finestra»). Il numero valido è 33, preso
sull'output completo con exit code registrato.

---

## File letti

Tutti sotto `/Users/alfonso/jjodel/`.

| path | stato |
|---|---|
| `frontend/src/components/editors/Info.tsx` (1591 righe) | pulito vs HEAD |
| `frontend/src/components/editors/PropertiesWithTreeView.tsx` | pulito vs HEAD |
| `frontend/src/components/editors/properties-with-tree-view.scss` (2328 righe) | **in movimento**, blob `7d8a4b1d3` |
| `frontend/src/components/editors/views/ViewData.tsx` | pulito vs HEAD |
| `frontend/src/components/panels/ElementPropertiesDrawer.tsx` | pulito vs HEAD |
| `frontend/src/components/editors/views/data/viewapplyto.scss` | pulito vs HEAD |
| `frontend/src/components/editors/info-improvements.scss` | pulito vs HEAD |
| `frontend/src/styles/components/_form-system.scss` | pulito vs HEAD |
| `frontend/src/model/logicWrapper/LModelElement.tsx` | pulito vs HEAD |
| `frontend/src/components/contextMenu/ContextMenu.tsx` | pulito vs HEAD |
| `frontend/src/components/editor-v2/viewpoint/authoring/` (13 file) | pulito vs HEAD |
| `docs/redesign/rail/README.md` | riferimento design |
| `docs/decisions.md` | R-RAIL-12, R-RAIL-25, R-RAIL-26 |
| `docs/discovery/discovery_2026-08-13_form_inspector_griglia_84.md` | report precedente |

**Nota sugli strumenti.** In questa shell `grep` è una funzione che avvolge
`ugrep --ignore-files`, dove `--include` non filtra (CLAUDE.md §5). Ogni comando di questo
report usa `command grep`, che risolve su BSD grep 2.6.0 e onora `-r`, `-c` e `--include`.
Il glob va fra virgolette: `--include=*.tsx` non quotato viene mangiato da zsh
(«no matches found»), e il comando non gira affatto.

---

## Q1 — Quanti consumatori vivi ha `Info.tsx`

**Comando**

```
$ cd frontend/src && command grep -rn "ElementPropertiesDrawer" .
```

**Output**

```
./components/editor-v2/EditorV2.tsx:105:// ElementPropertiesDrawer import removed — bottom drawer disabled (see BottomDrawer removal)
./components/panels/ElementPropertiesDrawer.tsx:4:export interface ElementPropertiesDrawerProps {
./components/panels/ElementPropertiesDrawer.tsx:10: * ElementPropertiesDrawer — renders the existing Info (properties) panel
./components/panels/ElementPropertiesDrawer.tsx:14:const ElementPropertiesDrawer: React.FC<ElementPropertiesDrawerProps> = () => {
./components/panels/ElementPropertiesDrawer.tsx:22:export default ElementPropertiesDrawer;
EXIT=0
```

Fuori dal proprio file il nome compare **una volta sola, dentro un commento**. Nessun JSX,
nessun import.

**Controllo positivo**, richiesto dal prompt e da CLAUDE.md §5 («un'asserzione di assenza
richiede la prova che la ricerca sia girata»). Stessa forma di comando, soggetto noto vivo:

```
$ command grep -rn "PropertiesWithTreeView" . | command grep -v "\.scss"
... 12 righe, fra cui:
./pages/components/Dashboard.tsx:38:import { PropertiesWithTreeView } from "../../components/editors/PropertiesWithTreeView";
./pages/components/Dashboard.tsx:627:                <Try><PropertiesWithTreeView mode={'floating'} /></Try>
EXIT=0
```

La ricerca ha segnale: trova sia l'import sia il sito di mount. Il silenzio su
`ElementPropertiesDrawer` è un risultato, non un guasto dello strumento.

**Chi importa e chi monta `Info`**

```
$ command grep -rn "from ['\"].*editors/Info['\"]\|from ['\"]\./Info['\"]\|from ['\"]\.\./Info['\"]" .
./components/editors/PropertiesWithTreeView.tsx:4:import { Info } from './Info';
./components/editors/index.ts:1:export {Info} from './Info';
./components/panels/ElementPropertiesDrawer.tsx:2:import { Info } from '../editors/Info';

$ command grep -rn "from ['\"].*components/editors['\"]\|from ['\"]\.\./editors['\"]" .
./components/abstract/Dock.tsx:8:import {Collaborative, Console, Logger, MetaData} from "../editors";
./components/contextMenu/ContextMenu.tsx:45:import { Info } from '../editors';

$ command grep -rn "<Info" .   (filtrato sui soli mount di Info, non InfoTooltip/InfoData)
./components/editors/Info.tsx:856:                <Info mode={'inline'} localData={element as any} />
./components/editors/PropertiesWithTreeView.tsx:634:                <Info
./components/panels/ElementPropertiesDrawer.tsx:17:            <Info mode="inline" />
./components/contextMenu/ContextMenu.tsx:559:                        <Info mode={'popup'}/>
```

**Conclusione**

`ElementPropertiesDrawer` è **morto**: importa `Info` e nessuno lo monta. Resta in albero e
non si tocca (Regola 9). Ma l'ipotesi di partenza del piano cade lo stesso, perché il terzo
consumatore vivo esisteva e non era stato censito: il **`components/editors/index.ts` fa da
barrel**, e `ContextMenu.tsx:559` monta `<Info mode={'popup'}/>` da lì. C'è poi una
**ricorsione interna**: `Info.tsx:856` monta se stesso in `mode='inline'`.

I consumatori vivi di `Info` sono quindi **tre** (rail `mode='tab'`, context menu
`mode='popup'`, se stesso `mode='inline'`), non uno e non due.

Il perimetro CSS **non** si chiude sul solo rail per il fatto che il drawer è morto: si
chiude solo se la regola distingue le tre modalità. Vedi Q6.

---

## Q2 — La griglia si può scopare a `.properties-with-tree-view--rail`

Il prompt chiede se le regole `!important` note toccano il **layout** di `.jj-field` o solo
la **pelle** dei controlli interni. La domanda è stata risolta in modo esaustivo anziché
campionario: invece di leggere le due regole citate, è stato estratto **ogni** blocco SCSS
del progetto il cui selettore ha `.jj-field` come ultimo compound, cioè ogni regola che
prende di mira il contenitore.

**Comando**

```
$ cd frontend/src && python3 - <<'PY'
import re, glob
files = glob.glob('**/*.scss', recursive=True)
hits = []
for p in files:
    lines = open(p, encoding='utf-8', errors='replace').read().split('\n')
    for i, ln in enumerate(lines):
        s = ln.strip()
        if s.startswith('//') or s.startswith('/*'): continue
        if '.jj-field' in s and s.endswith('{'):
            sel = s[:-1].strip()
            parts = [x.strip() for x in sel.split(',')]
            if any(re.search(r'\.jj-field$', x) for x in parts):
                decls, depth = [], 1
                for j in range(i+1, min(i+40, len(lines))):
                    t = lines[j].strip()
                    depth += t.count('{') - t.count('}')
                    if depth <= 0: break
                    if ':' in t and not t.startswith('//'): decls.append(t)
                hits.append((p, i+1, sel, decls))
for p, n, sel, d in hits:
    print(f'{p}:{n}  SELECTOR: {sel}')
    for x in d: print(f'      {x}')
print(f'TOTAL container-targeting .jj-field rules: {len(hits)}')
bad = [(p,n,x) for p,n,s,d in hits for x in d
       if '!important' in x and re.match(r'(display|grid-template|grid-auto|flex-direction|flex-flow|margin|float|position)\b', x)]
print('LAYOUT !important:', bad if bad else 'NONE')
PY
```

**Output**

```
styles/components/_form-system.scss:945  SELECTOR: .jj-field
      margin-bottom: 14px;
      &:last-child { margin-bottom: 0; }
components/editors/properties-with-tree-view.scss:1794  SELECTOR: .jj-field
      display: grid;
      grid-template-columns: 84px minmax(0, 1fr);
      align-items: center;
      gap: 8px 10px;
      margin-bottom: 8px;
      &:last-child { margin-bottom: 0; }
TOTAL container-targeting .jj-field rules: 2
LAYOUT !important: NONE
```

**Le due regole citate dal prompt, lette**

`viewapplyto.scss:815-818` — verificata, ma il numero di riga del prompt è esatto solo per
caso: il file è pulito vs HEAD.

```scss
.properties-tab.properties-panel .jj-field select {
  border: 1px solid #e2e8f0 !important;
  box-shadow: none !important;
}
```

`info-improvements.scss:1130-1131`:

```scss
.properties-panel .jj-field input[type="text"]:focus,
.properties-panel .jj-field input[type="number"]:focus {
    border-color: none !important;      // valore invalido: la dichiarazione e' scartata
    // box-shadow: ... !important;       // gia' commentata
    outline: none !important;
}
```

Entrambe hanno `.jj-field` come **antenato**, mai come bersaglio, e i loro `!important`
cadono su `border`, `box-shadow` e `outline` di `<select>` e `<input>`. Vale la pena
segnalare che `info-improvements.scss:1125` è una regola **vuota**
(`.properties-panel .jj-field input[type="text"] { }`) e che `border-color: none` non è un
valore valido per quella proprietà: la dichiarazione non ha effetto. Entrambe fuori
perimetro (R-RAIL-26), quindi si annotano e basta.

**Conclusione**

In tutto il progetto esistono **due sole** regole che prendono `.jj-field` come contenitore,
e **nessuna delle due usa `!important`**. Non esiste alcun `!important` su `display`,
`margin`, `grid-template-columns` o `flex-direction` applicato a `.jj-field`. Le regole note
toccano solo la pelle dei controlli interni e **non ostacolano un `display: grid` sul
contenitore**: la risposta esplicita che il prompt chiedeva.

La cascata è netta: `_form-system.scss:945` vale (0,1,0), la regola della griglia vale
(0,3,0) come discendente di `.properties-with-tree-view--rail .properties-fields`. Vince
senza `!important` e senza toccare il foglio globale (R-RAIL-25 rispettata).

Ma **la premessa della domanda resta sbagliata**, e la sua conclusione è in Q6: l'ancora
corretta non è `--rail`.

---

## Q3 — Inventario reale dei consumatori di `.jj-field`

**Comando**

```
$ cd frontend/src && command grep -rc "jj-field" --include="*.tsx" . | command grep -v ":0$" | sort -t: -k2 -rn
```

**Output**

```
./components/editor-v2/viewpoint/authoring/EdgeAuthoringPanel.tsx:27
./components/editors/Info.tsx:23
./components/editors/views/data/InfoData.tsx:17
./components/editor-v2/viewpoint/authoring/FieldCompartmentListEditor.tsx:14
./components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx:10
./components/editor-v2/viewpoint/authoring/RowAuthoringPanel.tsx:10
./components/editors/views/data/PaletteData.tsx:9
./components/editor-v2/viewpoint/authoring/MatchingSection.tsx:8
./components/editor-v2/viewpoint/authoring/LabelEntryEditor.tsx:8
./components/editor-v2/viewpoint/authoring/BadgeListEditor.tsx:8
./components/viewParenting/ViewParentingFields.tsx:5
./components/editor-v2/viewpoint/authoring/EnableIRPanel.tsx:4
./components/editor-v2/viewpoint/authoring/irTabs.tsx:3
./components/editors/views/data/FieldData.tsx:2
./components/editor-v2/viewpoint/authoring/TextStyleField.tsx:2
./components/editors/views/ViewData.tsx:1
./components/editor-v2/viewpoint/authoring/TextSourceEditor.tsx:1
./components/editor-v2/viewpoint/authoring/FieldSegmentEditor.tsx:1
```

Diciotto file. Controllo che il filtro `--include` funzioni davvero (con `command grep`, non
con il wrapper): `command grep -rl "jj-field" --include="*.scss" .` torna soli `.scss`, quindi
il filtro discrimina.

**Confronto con la tabella del prompt (presa su origin `93800c7`)**

| file | prompt | working tree | scostamento |
|---|---|---|---|
| `EdgeAuthoringPanel.tsx` | 27 | 27 | — |
| `Info.tsx` | 23 | 23 | — |
| `InfoData.tsx` | 17 | 17 | — |
| `FieldCompartmentListEditor.tsx` | 14 | 14 | — |
| `VertexAuthoringPanel.tsx` / `RowAuthoringPanel.tsx` | 10 / 10 | 10 / 10 | — |
| `PaletteData.tsx` | 9 | 9 | — |
| `MatchingSection` / `LabelEntryEditor` / `BadgeListEditor` | 8 / 8 / 8 | 8 / 8 / 8 | — |
| `ViewParentingFields.tsx` | 5 | 5 | — |
| `EnableIRPanel.tsx` | 4 | 4 | — |
| altri sei file (1–3) | 6 file | `irTabs` 3, `FieldData` 2, `TextStyleField` 2, `ViewData` 1, `TextSourceEditor` 1, `FieldSegmentEditor` 1 | — |

**Zero scostamenti sul lato TSX.** Notevole, visto che `Info.tsx` è cambiato di 228 righe in
`ad8e8e061`: il conteggio di `.jj-field` è rimasto a 23 perché il passo B ha sostituito i due
stepper e la pastiglia con `.jj-mult`, che non è un `.jj-field`, mantenendo invariato il
numero di campi.

**Lato SCSS**

```
$ for f in <i sette fogli>; do printf "%-60s %s\n" "$f" "$(command grep -c '\.jj-field' $f)"; done
components/editors/views/data/viewapplyto.scss               24
components/editors/properties-with-tree-view.scss            22
styles/components/_form-system.scss                           4
components/editors/info-improvements.scss                     3
components/viewParenting/viewParenting.scss                   2
components/editors/views/nestedView.scss                      1
components/editors/views/data/viewoptions.scss                1
```

| foglio | prompt (origin) | working tree | scostamento |
|---|---|---|---|
| `viewapplyto.scss` | 24 | 24 | — |
| `properties-with-tree-view.scss` | 14 | **22** | **+8** |
| `_form-system.scss` | 4 | 4 | — |
| `info-improvements.scss` | 3 | 3 | — |
| `viewParenting.scss` | non censito | 2 | +2 (censimento incompleto nel prompt) |
| `nestedView.scss` | non censito | 1 | +1 |
| `viewoptions.scss` | non censito | 1 | +1 |

Lo scostamento di +8 su `properties-with-tree-view.scss` è **interamente** l'arco 3:

```
$ P=frontend/src/components/editors/properties-with-tree-view.scss
$ for r in origin/alfonso-frontend-jjtl HEAD; do git show "${r}:${P}" | command grep -c "\.jj-field"; git show "${r}:${P}" | wc -l; done
14   1776      # origin 93800c7
22   2270      # HEAD ad8e8e061 -> 96bbd8bbc
$ command grep -c "\.jj-field" "$P" ; wc -l < "$P"
22   2328      # working tree, blob 7d8a4b1d3 (le +58 righe sono lavoro dark-mode concorrente)
```

**Attenzione al `-c`**: `grep -c` conta le **righe** che citano `.jj-field`, non le regole.
Il prompt le chiama «regole»; sono righe. La differenza non è pedante — le regole
contenitore in tutto il progetto sono due (Q2), contro 57 righe che citano la classe.

**Conclusione**

Nessuno scostamento sul lato TSX: i 18 file e i loro conteggi sono identici a origin. Il solo
scostamento SCSS è il foglio del rail, e corrisponde riga per riga al lavoro dell'arco 3 già
committato. Il censimento SCSS del prompt era incompleto di tre fogli (`viewParenting`,
`nestedView`, `viewoptions`), tutti fuori perimetro.

---

## Q4 — Bound illimitato: `-1` o `999`

È la domanda che il prompt marca come la più importante, perché un errore qui corrompe il
modello senza dare errore di compilazione. Va risolta **sul write path**.

**Il write path, dal componente al modello**

```
$ command grep -n "PropertiesNumberInput" components/editors/Info.tsx
138:function PropertiesNumberInput(props: { data: LModelElement; field: string; min?: number; max?: number }) {
283:                    <PropertiesNumberInput data={data} field={'lowerBound'} min={0} />
285:                    <PropertiesNumberInput data={data} field={'upperBound'} min={-1} />
606:                    <PropertiesNumberInput data={data} field={'ordinal'} min={0} />
```

`Info.tsx:138-150` — il componente non normalizza nulla: assegna sul proxy L.

```tsx
const handleChange = (newVal: number) => {
    (data as any)[field] = newVal;      // -> set_upperBound / set_lowerBound
};
```

**Il terminale della catena**, `model/logicWrapper/LModelElement.tsx:1504-1531`:

```tsx
protected set_lowerBound(val: this["lowerBound"], c: Context): boolean {
    val = +val;
    if (isNaN(val)) val = 0;
    else val = Math.max(0, val);                       // lower clampato a 0
    if (val === c.data.lowerBound) return true;
    TRANSACTION(this.get_name(c)+'.lowerBound', ()=>{
        SetFieldAction.new(c.data, 'lowerBound', val);
        if (c.data.upperBound != -1 && val > c.data.upperBound)
            SetFieldAction.new(c.data, 'upperBound', val);   // -1 e' escluso: e' l'illimitato
    }, c.data.lowerBound, val)
    return true;
}

protected set_upperBound(val: this["upperBound"], c: Context): boolean {
    val = +val;
    if (isNaN(val)) val = -1;                          // il default in caso di NaN e' -1
    else val = Math.max(-1, val);                      // il minimo rappresentabile e' -1
    if (val === c.data.upperBound) return true;
    TRANSACTION(this.get_name(c)+'.upperBound', ()=>{
        SetFieldAction.new(c.data, 'upperBound', val);
        if (val !== -1 && val < c.data.lowerBound)     // -1 e' escluso di nuovo
            SetFieldAction.new(c.data, 'lowerBound', val);
    }, c.data.upperBound, val)
    return true;
}
```

Tre prove indipendenti, tutte nello stesso setter, che `-1` **è** l'illimitato del modello:
il clamp `Math.max(-1, val)` lo rende il minimo rappresentabile; il fallback su `NaN` è `-1`;
e le due clausole correttive **escludono esplicitamente** `-1` dal confronto d'ordine, cosa
che ha senso solo se `-1` non è un numero ma un simbolo. Nessuna comparsa di `999`.

**Il `999` è confinato al rendering degli slot M1**

```
$ command grep -n "999" components/editors/Info.tsx
235:// questo file (`:522`, `:622`) e' normalizzazione di rendering degli slot M1, non la convenzione
621:            upperBound = (upperBound === -1) ? 999 : upperBound;
721:        if (upperBound < 0) upperBound = 999;
786:        const isMultiValued = upperBound > 1 || upperBound >= 999;
882:        const upperDisplay = upperBound >= 999 ? '*' : upperBound;
```

Le quattro occorrenze vive (`:621`, `:721`, `:786`, `:882`) sono tutte **letture**: `:621` e
`:721` leggono `feature.instanceof.upperBound` / `feature.__raw.upperBound` e lo normalizzano
in una **variabile locale** per fare da limite superiore a un conteggio di slot; `:786` e
`:882` consumano quella variabile locale. Nessuna di esse assegna a `data.upperBound`. Il
`999` non raggiunge mai il modello.

**Controllo sull'intero codebase**: `-1` è la convenzione ovunque, non solo qui.

```
$ command grep -rn "upperBound" --include="*.ts" --include="*.tsx" . | command grep -E "=[^=]|set_"
./components/editor-v2/types.ts:72:    upperBound: number;  // 1 = singolo, -1 = unbounded
./components/editor-v2/types.ts:91:    upperBound: number;     // -1 = unbounded (*)
./components/editor-v2/hooks/useEditorMode.ts:74:    upperBound: number;    // -1 = unbounded
./components/editor-v2/sync/canvasToJjom.ts:265:                lRef.upperBound = -1;
./components/editor-v2/hooks/useClassRemoval.ts:167:  newRef.__raw.upperBound = ref.upperBound ?? -1;
./jjscript/executor/commands/eval.ts:435:  multiValued: attr.upperBound === -1 || attr.upperBound === '*',
./components/contextMenu/ContextMenu.tsx:335:  if (dref.upperBound !== -1 && ...)
./common/DV.tsx:135: ... if (u==-1) return '['+l+'...]' ...
```

Sync layer, JjScript, context menu, default view: tutti su `-1`. Nessuno su `999`.

**Verifica sul codice del passo B già scritto** (`Info.tsx:241-263`):

```tsx
const MULTIPLICITY_PRESETS = [
    { key: '0..1', label: '[0..1]', lower: 0, upper:  1 },
    { key: '1..1', label: '[1..1]', lower: 1, upper:  1 },
    { key: '0..*', label: '[0..*]', lower: 0, upper: -1 },
    { key: '1..*', label: '[1..*]', lower: 1, upper: -1 },
];
const applyPreset = (p) => {
    setCustomOpen(false);
    (data as any).upperBound = p.upper;      // upper per primo
    (data as any).lowerBound = p.lower;
};
```

Il segmentato scrive `-1`, che è la convenzione giusta. L'ordine upper-prima-di-lower è
anch'esso corretto e non incidentale: applicando `[1..*]` a partire da `[0..1]`, scrivere
prima `lower=1` farebbe scattare la clausola `val > c.data.upperBound` di `set_lowerBound`
(1 > 1 è falso, quindi in questo caso specifico è innocuo, ma partendo da `[0..0]` non lo
sarebbe) e alzerebbe l'upper a un valore intermedio prima che `-1` lo sovrascriva.

**Conclusione**

**La convenzione del modello è `-1`.** Il `999` è normalizzazione locale di rendering degli
slot M1 e non tocca mai il write path: il «sembra» del prompt è ora dimostrato. Il segmentato
del passo B, già scritto, scrive `-1` e nell'ordine corretto: **nessun danno nel modello**.

Resta un dettaglio non verificato per via statica, riportato fra le domande aperte: il
comportamento dell'**undo** su una coppia di scritture consecutive che aprono due TRANSACTION
distinte (una per `set_upperBound`, una per `set_lowerBound`). Un solo Ctrl-Z potrebbe
ripristinare metà preset. Serve una verifica a runtime.

---

## Q5 — Il ramo view attraversa la griglia

**Comando**

```
$ command grep -n "^import\|AuthoringPanel\|EnableIRPanel\|InfoData\|PaletteData\|GenericNodeData" components/editors/views/ViewData.tsx
```

**Output (estratto)**

```
15:import InfoData from './data/InfoData';
20:import PaletteData from "./data/PaletteData";
21:import GenericNodeData from "./data/GenericNodeData";
26:import {VertexAuthoringPanel} from "../../editor-v2/viewpoint/authoring/VertexAuthoringPanel";
27:import {RowAuthoringPanel} from "../../editor-v2/viewpoint/authoring/RowAuthoringPanel";
28:import {EdgeAuthoringPanel} from "../../editor-v2/viewpoint/authoring/EdgeAuthoringPanel";
29:import {EnableIRPanel} from "../../editor-v2/viewpoint/authoring/EnableIRPanel";
 95:  ? <VertexAuthoringPanel view={view} activeTab={id} identity={identity} />
 97:    ? <RowAuthoringPanel view={view} activeTab={id} identity={identity} />
 98:    : <EdgeAuthoringPanel view={view} activeTab={id} identity={identity} />}
114:  <InfoData viewID={view.id} viewpointsID={...} readonly={readOnly} />
133:  ? <VertexAuthoringPanel view={view} />
135:    ? <RowAuthoringPanel view={view} />
137:      ? <EdgeAuthoringPanel view={view} />
145:        : <EnableIRPanel view={view} />}
154:  <PaletteData viewID={view.id} readonly={readOnly} />
172:  <GenericNodeData viewID={view.id} readonly={readOnly} />
```

**Il punto di innesto in `Info.tsx`** (`:1318-1354`, letto per intero, non dedotto):

```tsx
const selectedViewClass = (selectedView as any)?.__raw?.className || (selectedView as any)?.className;
if (tab && selectedView && (selectedViewClass === DViewPoint.cname || selectedViewClass === DViewElement.cname)) {
    ...
    return (
        <section className="properties-tab properties-panel">
            {isVP ? <ViewpointProperties .../> : <ViewData .../>}
        </section>
    );
}
```

**Controllo sui siti di mount dei pannelli**: nessuno di essi è montato altrove.

```
$ for c in VertexAuthoringPanel RowAuthoringPanel EdgeAuthoringPanel EnableIRPanel InfoData PaletteData; do command grep -rn "<$c\b" --include="*.tsx" .; done
```

Tutti e sei tornano **esclusivamente** righe di `ViewData.tsx`. I restanti consumatori di
`.jj-field` sono figli di quei pannelli, verificato uno per uno:

```
ViewParentingFields  <- irTabs.tsx:108, InfoData.tsx:284
FieldData            <- GenericNodeData.tsx:42
TextStyleField       <- LabelEntryEditor.tsx:105
TextSourceEditor     <- EdgeAuthoringPanel.tsx:746, LabelEntryEditor.tsx:69, RowAuthoringPanel.tsx:377
FieldSegmentEditor   <- FieldCompartmentListEditor.tsx:228
MatchingSection      <- VertexAuthoringPanel.tsx:280
LabelEntryEditor     <- LabelListEditor.tsx:63
BadgeListEditor      <- VertexAuthoringPanel.tsx:383
FieldCompartmentListEditor <- VertexAuthoringPanel.tsx:298
GenericNodeData      <- ViewData.tsx:172
```

**Conclusione**

La catena del prompt è **confermata**, letta sul codice e non dedotta dai riferimenti. Quando
l'elemento selezionato è un `DViewElement`, `Info` ritorna **presto** — prima del ramo model
element — e rende `ViewData`, che monta l'intera superficie di authoring IR. **Tutti i 17
file consumatori diversi da `Info.tsx` rendono dentro il rail.**

L'assunzione del piano dell'arco («il ramo view non attraversa la griglia») era falsa se
riferita al rail, e vera se riferita a `.properties-fields`. È la distinzione di Q6.

---

## Q6 — Il perimetro `--rail` è più largo del form dell'inspector

### Q6.1 — Quali consumatori rendono dentro `--rail`

Il modificatore, misurato:

```
$ command grep -rn "properties-with-tree-view--rail" --include="*.tsx" .
./components/editors/PropertiesWithTreeView.tsx:515:  className={`properties-with-tree-view${isFloating ? ' properties-with-tree-view--floating properties-with-tree-view--rail' : ''}${isFloating && posture === 'focus' ? ' properties-with-tree-view--rail-focus' : ''}`}
```

Un solo punto, sulla radice, condizionato a `isFloating` (`:485`, `mode === 'floating'`).
Riga 515 identica a origin: nessuno scostamento.

| file | rende in `--rail`? | dentro `.properties-fields`? |
|---|---|---|
| `Info.tsx` (ramo model element, `mode='tab'`) | **sì** | **sì** |
| `Info.tsx` (ramo view, `:1335`) | sì | no — ritorno anticipato |
| `Info.tsx` (ramo popup/inline, `:1519`) | no (context menu) | no |
| `InfoData.tsx`, `PaletteData.tsx`, `ViewData.tsx`, `GenericNodeData`, `FieldData` | **sì**, via ramo view | **no** |
| 11 file sotto `viewpoint/authoring/` | **sì**, via ramo view | **no** |
| `ViewParentingFields.tsx` | **sì**, via `InfoData`/`irTabs` | **no** |

Diciassette file su diciotto rendono dentro `--rail` senza passare da `.properties-fields`.
La stima del prompt («circa 96 campi in più») è dello stesso ordine dei 122 riscontri di
`.jj-field` nei 17 file, e la sostanza è confermata: **una regola ancorata a `--rail`
ristrutturerebbe l'intera superficie di authoring IR**, che CLAUDE.md §2.5 dichiara «in
sviluppo».

### Q6.2 — Esiste già un selettore intermedio?

**Sì.** E ne esiste esattamente uno.

```
$ command grep -rn "properties-fields" --include="*.tsx" .
./components/editors/Info.tsx:1480:                    <div className="properties-fields">
```

Un solo sito di mount in tutto il progetto. Controllo positivo sulla stessa forma di comando:
`command grep -rln "properties-panel" --include="*.tsx" .` torna 12 file, quindi la ricerca
discrimina e non è muta per un difetto del filtro.

Il contenitore sta nel ramo model element in modalità tab (`Info.tsx:1470-1482`), **dopo** il
ritorno anticipato del ramo view (`:1335`) e **prima** del fallback popup/inline (`:1519`).
È quindi esattamente il form dell'inspector, e nient'altro: non il popup del context menu,
non il ramo view, non l'authoring IR.

**Non serve introdurre alcuna classe nuova.** La domanda Q6.3 del prompt («quale sarebbe il
punto minimo dove introdurne uno») è priva di oggetto: P2 non viene nemmeno sfiorata.

### Q6.3 — Cosa è stato effettivamente scritto

L'ancora usata dall'implementazione già committata coincide con quella che questa discovery
avrebbe raccomandato:

```scss
// properties-with-tree-view.scss:1791 (blob 7d8a4b1d3)
.properties-with-tree-view--rail .properties-fields {
    padding-bottom: 18px;
    .jj-field {
        display: grid;
        grid-template-columns: 84px minmax(0, 1fr);
        align-items: center;
        gap: 8px 10px;
        margin-bottom: 8px;
        &:last-child { margin-bottom: 0; }
    }
    .jj-field-label { justify-self: end; margin-bottom: 0; font-size: 12px; text-align: right; }
    .jj-field-hint  { grid-column: 2; margin-top: 2px; }
    ...
}
```

Specificità (0,3,0) contro (0,1,0) di `_form-system.scss:945`; due classi preesistenti;
nessun `!important` sul layout. `minmax(0, 1fr)` invece di `1fr` è corretto e documentato in
loco: una traccia `1fr` ha `min-width: auto` e non scende sotto il min-content, il che
produceva scroll orizzontale a rail stretto.

`.jj-field-hint { grid-column: 2 }` copre la forma a tre figli (label + campo + hint) che
esiste in `Info.tsx` per Uri e Prefix del package: senza quella riga l'hint cadrebbe nella
colonna da 84px della riga successiva.

### Q6-bis — Stato dei quattro passi, misurato

| passo | stato | evidenza |
|---|---|---|
| A — griglia `84px 1fr` | **implementato** | `properties-with-tree-view.scss:1791-1863` |
| B — multiplicity segmentato | **implementato** | `Info.tsx:241-291`, SCSS `:1870+` |
| C — flag chip / switch | **implementato** | `Info.tsx:163-228` (`FlagChip`, `FlagsSection`), SCSS `:1998+`, `:2112+` |
| D — fusione ADVANCED | **implementato, da confermare** | `Info.tsx:1486-1502`: una sola `CollapsibleSection title="Advanced"` dentro `.jj-disclosure`. Nessuna seconda sezione «ADVANCED STATE» residua nel file (`grep -n "CollapsibleSection title="` torna 18 righe, tutte di sezioni di dominio più questa) |

**Conclusione**

La domanda che il prompt poneva («il passo A è un passo solo o va spezzato in A1 scopatura +
A2 griglia») ha risposta: **è un passo solo**, perché il selettore di scopatura esisteva già
nel markup e non andava creato. La risposta però arriva a cose fatte: il passo A è già
scritto, con quell'ancora.

---

## Dipendenze e rischi

1. **Il lavoro è già stato fatto, e questa discovery lo ha solo verificato.** Il rischio
   operativo è che una Fase 2 lanciata sul testo di questo prompt riscriva da zero qualcosa
   che esiste già, creando un conflitto con `ad8e8e061`. Vedi la prima domanda aperta.

2. **Il file del rail è conteso.** `properties-with-tree-view.scss` è stato modificato da
   un'altra sessione durante questa discovery (mtime 14:47:09, +92/-34 rispetto a HEAD,
   lavoro su `--color-selection-bg` nei chip di multiplicity e nei flag — cioè **sulle
   superfici dei passi B e C**). Qualunque Fase 2 su quel file parte da una base che si muove.
   Va sincronizzato prima di toccarlo.

3. **Undo di una coppia di bound (Q4).** `applyPreset` esegue due assegnazioni consecutive
   che aprono due TRANSACTION distinte (`LModelElement.tsx:1509` e `:1526`). Non verificato a
   runtime se un Ctrl-Z ripristini l'intero preset o solo metà. Un preset applicato a metà è
   uno stato del modello, non un artefatto visivo.

4. **Un `!important` invalido sopravvive fuori perimetro.** `info-improvements.scss:1130`
   dichiara `border-color: none !important`, che non è un valore valido: la dichiarazione è
   scartata dal parser. `:1125` è una regola vuota. R-RAIL-26 tiene il file fuori perimetro,
   quindi si annota e non si tocca.

5. **`ElementPropertiesDrawer` resta morto in albero** (Regola 9: non si rimuove). Tiene vivo
   un import di `Info` che non corrisponde a nessun rendering.

6. **Il perimetro negativo del passo A non è stato violato** dall'implementazione esistente:
   `_form-system.scss`, `info-improvements.scss`, la critical zone, il tree, l'header del rail
   e il canvas non compaiono nel diff di `ad8e8e061`, che tocca due soli file. Il perimetro
   **non va rinegoziato**.

7. **Rotazione del log.** `docs/claude-code-log.md` porta 23 intestazioni contro una soglia di
   20. L'entry di questo task è stata aggiunta **senza ruotare**, come il prompt prescrive; la
   rotazione resta una voce e un commit a parte.

---

## Domande aperte per Alfonso

1. **La Fase 2 di questo prompt va ancora eseguita?** I passi A, B, C e (a quanto risulta) D
   sono già committati in `ad8e8e061`, con l'ancora `.properties-fields` che questa discovery
   conferma essere quella giusta. Le opzioni sono: (a) chiudere l'arco 3 come fatto e passare
   alla verifica visiva della definition of done (nove controlli a 420×1000 senza scroll);
   (b) trattare `ad8e8e061` come una bozza e riscriverlo; (c) qualcosa in mezzo, cioè una
   revisione mirata. La discovery non può decidere: è una domanda di processo.

2. **Chi sta lavorando su `properties-with-tree-view.scss` in questo momento?** Il file è
   cambiato sotto la lettura alle 14:47 e le modifiche insistono sui chip di multiplicity e
   sui flag, cioè sui passi B e C. Se è una sessione parallela, va coordinata prima che
   qualcuno tocchi di nuovo quel foglio.

3. **Va verificato l'undo dei preset di multiplicity?** È l'unico rischio di Q4 che una
   lettura statica non chiude, ed è nella classe «il danno è dentro il modello e non a
   schermo» che il prompt stesso indica come la più costosa. Se sì, serve uno smoke a runtime:
   applicare `[1..*]` su un attributo `[0..1]`, premere Ctrl-Z una volta, leggere
   `windoww.store.getState().idlookup[<id>]` e confrontare i due bound.

4. **Il censimento SCSS del prompt era incompleto di tre fogli** (`viewParenting.scss`,
   `nestedView.scss`, `viewoptions.scss`, 4 righe in tutto). Sono tutti fuori dal perimetro e
   nessuno tocca `.jj-field` come contenitore, quindi la conclusione non cambia. Va comunque
   corretto nel documento di piano dell'arco, se quel documento viene mantenuto?

5. **`docs/redesign/rail/README.md` è del 10 agosto** (`mtime 10 ago 16:54`) e descrive la
   griglia come `84px 1fr` (`:244`), mentre l'implementazione usa `84px minmax(0, 1fr)` per
   una ragione misurata e documentata. Va aggiornata la spec, o si lascia la divergenza
   annotata solo nel commento del foglio?

---

## Verifica prima dell'hard stop

- `npm run typecheck`: 33 errori (19 casing: 12 × TS1261 + 7 × TS1149; 14 sparsi). **Baseline
  attesa**, exit code 2 come da sempre. Nessuna regressione introdotta — del resto questa fase
  non ha modificato alcun sorgente.
- Nessun file sorgente toccato. `git status` mostra come modificato il solo
  `properties-with-tree-view.scss`, che è lavoro di un'altra sessione (mtime 14:47:09,
  precedente all'ultima lettura di questo report e mai scritto da qui).
- Nessun comando git di scrittura eseguito. Nessun commit. Nessun branch.

**HARD STOP.** Il report è su file. Non sono state proposte patch né anticipato il passo A.
