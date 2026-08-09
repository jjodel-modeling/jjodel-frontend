# Discovery — consolidamento `InfoTooltip` in `components/ui/` (voce 5, D-5-1)

**Documento prompt**: 2026-08-09 15:59
**Fase**: 0 (verifica d'ingresso, read-only)
**Esito**: **HARD STOP** — una condizione di uscita su sei è scattata (*barrel da toccare*).
Nessun file sorgente scritto.

---

## 1. Obiettivo

Verificare che il perimetro dichiarato dal prompt (5 file sorgente + 3 doc) regga sul
codice a `HEAD` (`e5d238cd9`), prima di estrarre `InfoTooltip` come primitiva condivisa
in `frontend/src/components/ui/InfoTooltip/InfoTooltip.tsx` e consolidare i 4 siti
censiti dalla Fase A (`e23fb6439`).

## 2. Ipotesi che la discovery falsifica

- **H1** — le definizioni locali di `InfoTooltip` sono esattamente 4, alle righe citate
  dalla Fase A, e i corpi hanno tutti md5 `47b49fac269cb6f677866c6d891615f3`.
  → **non falsificata**.
- **H2** — `Info.tsx:64` e `:97` sono definizione + uso, non due definizioni.
  → **non falsificata**: `:64` definizione, `:97` unico uso.
- **H3** — non esiste già una primitiva tooltip/popover in `components/ui/`.
  → **non falsificata**.
- **H4** — la nuova primitiva può replicare il pattern di export di `Select`
  **senza** toccare file fuori dal DOVE.
  → **FALSIFICATA**. È la causa dello stop. Vedi §5.

## 3. File letti (path completi)

Sorgente:

- `frontend/src/components/editors/Info.tsx` (righe 1–110)
- `frontend/src/components/editors/views/data/InfoData.tsx` (righe 1–55)
- `frontend/src/components/editor-v2/viewpoint/authoring/irTabs.tsx` (righe 1–80)
- `frontend/src/components/viewParenting/ViewParentingFields.tsx` (righe 1–50)
- `frontend/src/components/ui/index.ts` (intero)
- `frontend/src/components/ui/Select/index.ts` (intero)
- `frontend/src/components/ui/Select/Select.tsx` (intero)
- `frontend/src/components/editors/info-improvements.scss` (righe 970–1020)
- `frontend/src/components/forEndUser/Tooltip.tsx` (intestazione)

Documentazione:

- `docs/decisions.md` (registro etichette)
- `docs/claude-code-log.md` (entry Fase A del 2026-08-09 e precedenti sul punto)
- `docs/PROTOCOL.md` (P4)

## 4. Findings

### 4.1 Censimento definizioni — 4 su 4, conteggio confermato

`grep -rn "InfoTooltip" frontend/src/` → 4 file, nessun quinto. `grep -rl` su
`*.ts *.tsx *.js *.jsx *.scss *.css` (repo intero, escluso `node_modules`) conferma:
solo i 4 `.tsx` censiti. Le uniche altre menzioni sono in `docs/` (5 file: log, archivio
log, 3 discovery), cioè prosa, non codice.

| File | Definizione | Usi |
|------|-------------|-----|
| `frontend/src/components/editors/Info.tsx` | `:64` | `:97` (1) |
| `frontend/src/components/editors/views/data/InfoData.tsx` | `:33` | `:153, :162, :182, :197, :204, :211, :230, :242, :260, :283` (10) |
| `frontend/src/components/editor-v2/viewpoint/authoring/irTabs.tsx` | `:66` | `:114` (1) |
| `frontend/src/components/viewParenting/ViewParentingFields.tsx` | `:33` | `:87, :136` (2) |

**Chiarimento richiesto dal prompt su `Info.tsx:64,:97`**: sono **definizione più uso**,
non due definizioni. `:64` è l'unica `function InfoTooltip` del file; `:97` è
l'invocazione dentro `PropertiesToggle` (`{tooltip && <InfoTooltip text={tooltip} />}`).
Nessuna annotazione aggiuntiva dovuta.

**Scostamento minore rispetto alla Fase A**: `InfoData.tsx` ha **10** usi, non 9. La Fase A
ne aveva contati 9. Non incide sul consolidamento (gli usi restano intatti), ma il numero
esatto è quello qui sopra.

Nessuno dei 4 file esporta il componente: è duplicazione reale, non invocazione di un
condiviso.

### 4.2 Identità — md5 uguale su tutte e quattro, `47b49fac269cb6f677866c6d891615f3`

Normalizzazione: le 12 righe della sola dichiarazione di funzione (dalla riga
`function InfoTooltip(...)` alla `}` di chiusura), commento di testa **escluso**.

```
47b49fac269cb6f677866c6d891615f3  editors/Info.tsx                       righe 64–75
47b49fac269cb6f677866c6d891615f3  editors/views/data/InfoData.tsx        righe 33–44
47b49fac269cb6f677866c6d891615f3  editor-v2/.../authoring/irTabs.tsx     righe 66–77
47b49fac269cb6f677866c6d891615f3  viewParenting/ViewParentingFields.tsx  righe 33–44
```

Coincide con la misura della Fase A. Corpo verbatim (da `Info.tsx:64-75`):

```tsx
function InfoTooltip(props: { text: string }) {
    const [show, setShow] = useState(false);
    return (
        <span className="jj-info-icon-wrapper"
            onMouseEnter={() => setShow(true)}
            onMouseLeave={() => setShow(false)}
        >
            <span className="jj-info-icon">i</span>
            {show && <span className="jj-info-tooltip">{props.text}</span>}
        </span>
    );
}
```

I commenti di testa **divergono** fra i 4 siti (ognuno cita i precedenti come sorgente:
`Info.tsx` nessuno, `InfoData.tsx:31-32`, `irTabs.tsx:63-65`, `ViewParentingFields.tsx:30-32`).
Non fanno parte del corpo misurato e vengono rimossi insieme alle definizioni.

### 4.3 Collisione nomi — nessuna dentro `ui/`, una omonimia parziale fuori

- Nessun altro identificatore `InfoTooltip` nel codebase (tipi, export, test): zero hit.
- Nessuna primitiva tooltip/popover in `components/ui/`. L'unica traccia è un export
  **commentato** fra i segnaposto in coda al barrel:
  `frontend/src/components/ui/index.ts:73` → `// export { Tooltip } from './Tooltip';`
  (la directory `ui/Tooltip/` non esiste).
- **Da sapere, non è una collisione**: esiste `frontend/src/components/forEndUser/Tooltip.tsx`,
  un componente diverso e non imparentato (connesso a Redux, `tooltip.scss` proprio,
  posizionamento a runtime). È già importato da `Info.tsx:27`
  (`import { Tooltip } from '../forEndUser/Tooltip';`) e **convive** con `InfoTooltip` nello
  stesso file senza ambiguità. Il nome `InfoTooltip` resta libero.

### 4.4 Convenzioni di `components/ui/` — **qui scatta lo stop**

Rilevato su `Select` (e verificato su tutta la directory):

1. **Export nel file del componente**: named + default.
   `Select.tsx` → `export const Select = React.forwardRef(...)`, poi `Select.displayName = 'Select'`,
   poi `export default Select;`. I tipi sono esportati come `export interface` / `export type`.
2. **`index.ts` per componente**: `Select/index.ts` →
   `export { Select } from './Select';` + `export type { SelectProps, SelectOption, SelectSize } from './Select';`
   Presente in **20 directory su 21** (unica eccezione `examples/`, che non è un componente).
3. **Voce nel barrel** `ui/index.ts`: ogni componente ha la sua coppia
   `export { X } from './X';` + `export type { XProps } from './X';`.
   Presenti tutti e 20.
4. **Come importano i consumatori**: in stragrande maggioranza dal barrel —
   `Info.tsx:31` → `import { Button, EmptyState, Toggle, NumberInput, JjSelect } from '../ui';`
   `InfoData.tsx:25` → `import {Toggle} from '../../../ui';`
   Esistono 6 eccezioni con import profondo, tutte preesistenti:
   - `abstract/tabs/DocumentationTab.tsx:16`, `Settings/PromptsSettingsSection.tsx:7`,
     `editors/Empty.tsx:2`, `megamodel/MegamodelView.tsx:21`, `project/ProjectEditor.tsx:44`
     → `from '.../ui/EmptyState'` (arrivano all'`index.ts` del componente)
   - `editors/views/data/NodeData.tsx:18` → `from '../../../ui/Toggle/Toggle'`
     (unico caso di path completo fino al file)

`irTabs.tsx` e `ViewParentingFields.tsx` **non importano nulla da `ui/`** oggi: per loro
l'import sarebbe comunque nuovo, in qualunque forma.

**Conseguenza**: replicare il pattern richiede **due file fuori dal DOVE** —
`frontend/src/components/ui/InfoTooltip/index.ts` (nuovo) e una voce in
`frontend/src/components/ui/index.ts` (modifica). Il prompt lo prevede esplicitamente
come condizione di arresto («Se esiste un barrel che andrebbe modificato, si applica la
regola di DOVE: fermarsi e chiedere»). **Stop qui.**

### 4.5 Censimento stili — una sola sede, non toccata

`grep -rn "jj-info-" --include="*.scss" --include="*.css"` (repo intero) → **3 hit, un solo file**:

- `frontend/src/components/editors/info-improvements.scss:975` → `.jj-info-icon-wrapper`
  (`position: relative`, `display: inline-flex`, `margin-left: 5px`, `cursor: help`)
- `frontend/src/components/editors/info-improvements.scss:983` → `.jj-info-icon`
  (cerchio 13×13, `border: 1px solid #cbd5e1`, `font-size: 9px`, italic, `color: #94a3b8`)
- `frontend/src/components/editors/info-improvements.scss:999` → `.jj-info-tooltip`
  (assoluto a `calc(100% + 6px)`, `background: #f8fafc`, `max-width: 220px`, `z-index: 20`,
  `pointer-events: none`)

Classi globali (SCSS classico, non CSS Module). Nessuna variante dark, nessun token: colori
letterali. **Non toccate**, come da mandato.

### 4.6 Etichetta D-5-1 — libera

`docs/decisions.md` non contiene alcuna etichetta con prefisso `D-5`. Le etichette in uso
sono: `C-1`, `D-4-1..D-4-9`, `D3` (in *Superate*), `Q2`, `Q4`, `Q5`, `Q6`, `Q7`, `R-2`,
`RC-3`, `RC-7`, `U-5`, `U-6`. **D-5-1 è libera.**

## 5. Perché lo stop — e le tre uscite possibili

Cinque condizioni su sei del gate passano: md5 identico, nessuna quinta definizione,
nessuna collisione di nome, nessuna primitiva tooltip preesistente, D-5-1 libera.
Scatta la sesta: **barrel da toccare**.

Il DOVE autorizza **un solo** file nuovo, `ui/InfoTooltip/InfoTooltip.tsx`, mentre la
convenzione ratificata di `ui/` è a tre livelli (file + `index.ts` del componente + voce
nel barrel). Non è un dettaglio formale: l'istruzione di Fase 1 dice «export secondo il
pattern rilevato», e il pattern rilevato non sta dentro il DOVE. Scegliere da solo di
saltare il barrel sarebbe una decisione di convenzione, non un passaggio meccanico —
esattamente ciò che la regola anti-drift riserva alla ratifica.

### Opzione A — pattern completo (perimetro 8 file)

`ui/InfoTooltip/InfoTooltip.tsx` (nuovo) + `ui/InfoTooltip/index.ts` (nuovo) + voce in
`ui/index.ts` (modifica). I 4 siti importano dal barrel, come già fanno `Info.tsx` e
`InfoData.tsx` per `Toggle`.

- **Pro**: `InfoTooltip` è indistinguibile dalle altre 20 primitive; nessun caso speciale
  da spiegare a chi arriverà dopo; l'ingresso in vetrina (punto 4 DS) non dovrà rifare
  nulla, solo aggiungere la demo.
- **Contro**: allarga il DOVE di 2 file. Entrambi sono meccanici — un `index.ts` di due
  righe e una coppia di righe nel barrel, in coda alle esistenti.
- **Nota**: la voce nel barrel **non** è l'ingresso in vetrina. La vetrina è la pagina
  demo DS-8, che resta rinviata come da prompt.

### Opzione B — import profondo, DOVE invariato (perimetro 6 file)

Solo `ui/InfoTooltip/InfoTooltip.tsx`; i 4 siti importano
`from '.../ui/InfoTooltip/InfoTooltip'`.

- **Pro**: rispetta il DOVE alla lettera, un solo file nuovo. Precedente esistente
  (`NodeData.tsx:18` importa `'../../../ui/Toggle/Toggle'`).
- **Contro**: sarebbe l'**unica** primitiva di `ui/` senza `index.ts` e assente dal barrel.
  Il precedente citato è un'eccezione su un componente che *nel barrel c'è*; qui l'assenza
  sarebbe strutturale. Chi cerca le primitive leggendo `ui/index.ts` non la trova.

### Opzione C — solo `index.ts` del componente, barrel intatto (perimetro 7 file)

`ui/InfoTooltip/InfoTooltip.tsx` + `ui/InfoTooltip/index.ts`; i 4 siti importano
`from '.../ui/InfoTooltip'`.

- **Pro**: un solo file fuori dal DOVE; precedente più solido (5 siti importano
  `'.../ui/EmptyState'` in questa forma).
- **Contro**: divergenza comunque, solo più piccola — il componente resta invisibile dal
  barrel. Mezza convenzione.

**Raccomandazione**: **Opzione A**. I due file in più sono entrambi meccanici e il costo di
non farli è una divergenza permanente su una directory che oggi è uniforme al 100%.

## 6. Rischi e dipendenze rilevate

1. **La primitiva in `ui/` non sarà auto-contenuta sul piano degli stili.** Le classi
   `jj-info-*` vivono in `components/editors/info-improvements.scss`, importato da **un
   solo** file: `Info.tsx:23`. Gli altri 3 siti oggi rendono correttamente perché quello
   SCSS finisce comunque nel foglio globale del bundle. Il consolidamento **non cambia
   nulla** di questo (la dipendenza implicita esiste già identica su 3 siti su 4), ma
   sposta il componente in `ui/` lasciando i suoi stili in `editors/`. Da dichiarare nel
   docstring, non da risolvere qui: il mandato esclude CSS Module e tocchi al CSS.
2. **`Info.tsx` è fermo dal 2026-07-05** (`d6b7bf806`) ed è il pannello Properties (§19.5).
   Il touch è ratificato ma deve restare meccanico: via la definizione `:64-75` e il suo
   commento `:63`, dentro un import. Nient'altro — il file contiene molto codice adiacente
   che invita a ritocchi (Rule 8).
3. **`ViewParentingFields.tsx` è il writer unico di `father`** (voce 4, D-4-2/D-4-4/D-4-8).
   I suoi 2 `InfoTooltip` stanno sui campi Viewpoint (`:87`) e Parent view (`:136`). Il
   consolidamento tocca solo l'intestazione del file (definizione + import): **nessuna**
   riga del write path. Va comunque verificato riga per riga nel diff.
4. **Nessun file in critical zone.** `irTabs.tsx` sta sotto
   `editor-v2/viewpoint/authoring/`, directory che compare nella tabella §3.1 di CLAUDE.md
   ma **non** fra i trigger del Layer Impact Report §3.2 (che elenca file, non directory,
   e nessuno di questi 4). Layer Impact Report: **non dovuto**.
5. **`useState` resta usato in tutti e 4 i file** dopo la rimozione: `Info.tsx` lo usa in
   `CollapsibleSection:38`, `InfoData.tsx` e `irTabs.tsx` e `ViewParentingFields.tsx`
   altrove. Nessun import React diventa orfano. Verificato prima di scrivere.

## 7. Domande aperte per Alfonso

1. **Quale opzione fra A, B e C** (§5)? A e C richiedono di allargare il DOVE,
   rispettivamente di 2 e 1 file. Raccomandata A.
2. Se A: confermare che la voce nel barrel va in coda alle *Form Components*, accanto alle
   altre, e **non** conta come «ingresso in vetrina» (che resta al punto 4 DS).
3. Il conteggio usi di `InfoData.tsx` è **10**, non 9 come da Fase A (§4.1). Segnalato per
   completezza; non cambia il lavoro.

---

## 8. Esito della ratifica (aggiunto a valle, 2026-08-09)

Alfonso ha scelto l'**opzione A**. Il DOVE si allarga di due file,
`ui/InfoTooltip/index.ts` (nuovo) e `ui/index.ts` (voce nel barrel); Fase 1 eseguita su
quel perimetro. Registrato come **D-5-1** in `docs/decisions.md`.

**Una correzione al rischio 5 del §6**, trovata scrivendo la Fase 1: `useState` **non**
resta usato in tutti e quattro i file. Sopravvive solo in `Info.tsx`
(`CollapsibleSection:38`) e `ViewParentingFields.tsx` (`:54-55`); in `InfoData.tsx` e
`irTabs.tsx` l'unico uso era dentro `InfoTooltip`, quindi il named import è stato tolto da
quelle due righe. `React` invece resta usato in entrambe (`React.MouseEvent` in
`InfoData.tsx:102,:112`; `React.FC` in `irTabs.tsx:107,:137`), quindi la riga d'import
sopravvive. Il §6 affermava il contrario: qui prevale quanto scritto in questa sezione.

**Stato**: Fase 1 chiusa. Gate verdi (build, `tsc` 33 = baseline, vitest 204/204 sul
perimetro viewpoint e 10/10 su viewParenting). Smoke di identità **passato** (Alfonso,
2026-08-09): i 4 hover rendono indistinguibili da prima.

---

# Addendum emendamento 1 — grafica scura del tooltip (D-5-2, commit 2)

**Documento prompt**: 2026-08-09 16:32
**Fase**: 0-bis (estensione read-only del censimento)
**Esito**: **HARD STOP** — la condizione del punto 2 è scattata su **tutti e quattro** i
siti. Nessun file di codice scritto per il commit 2.

## A1. Punto 1 — sede e riferimenti delle regole `jj-info-*`: **verde**

Sede unica: `frontend/src/components/editors/info-improvements.scss`, righe **975**
(`.jj-info-icon-wrapper`), **983** (`.jj-info-icon`), **999** (`.jj-info-tooltip`), fino a
`:1015`. Tre selettori **piatti di primo livello**, nessuna nidificazione `&-`.

Grep `jj-info` su tutto il repo (`.scss`, `.css`, `.tsx`, `.ts`, `.html`, escluso
`node_modules`) → **7 hit e basta**: le 3 definizioni qui sopra e 4 nella primitiva
(3 `className` più una menzione nel docstring). **Zero override per pannello, zero
selettori discendenti esterni, zero riferimenti da altri file.** Le regole sono ritirabili
dalla sede globale senza toccare nient'altro.

Nomi nuovi liberi: `jj-info-tooltip-title` e `jj-info-tooltip-text` → **0 hit** entrambi.

## A2. Punto 2 — clipping e stacking: **rosso su 4 siti su 4**

Il pannello è `position: absolute` e il suo containing block è
`.jj-info-icon-wrapper` (`position: relative`, `info-improvements.scss:976`), che sta
**dentro** i contenitori qui sotto. Un assoluto è ritagliato da ogni antenato con
`overflow` diverso da `visible` che stia fra sé e il proprio containing block: la fuga
avviene solo se il containing block è **fuori** dallo scroller, che qui non è il caso.

| Sito | Contenitore che ritaglia | Regola | Verdetto |
|------|--------------------------|--------|----------|
| `editors/Info.tsx` | `.properties-panel` | `info.scss:414-417` — `height: 100%; overflow: auto` | **clippa** |
| `editors/views/data/InfoData.tsx` | `.properties-panel` (`:133`) **+** `.apply-to-tab` | `info.scss:417` **+** `viewapplyto.scss:47-50` — `overflow-x: visible !important; overflow-y: auto !important; height: 100%` | **clippa, doppiamente** |
| `editor-v2/.../irTabs.tsx` | `.properties-panel` (host `ViewData.tsx:142`) | `info.scss:417` | **clippa** |
| `viewParenting/ViewParentingFields.tsx` | entrambi gli host sopra | — | **clippa** |

Due precisazioni che contano:

1. **`overflow-x: visible` su `.apply-to-tab` non salva nulla.** Per specifica, se uno dei
   due assi non è `visible`, l'altro computa ad `auto`: quel box ritaglia su **entrambi**
   gli assi ed è uno scroll container a tutti gli effetti.
2. **Gli intermedi sono puliti**: `.props-section` e `.props-section__body`
   (`info-improvements.scss:918`, `:970`) non hanno `overflow` né `position`, e
   `.properties-section-content` ha `overflow: hidden` in `info.scss:543` ma è già
   sovrascritto a `visible` da `info-improvements.scss:172-176` («Override info.scss
   overflow:hidden that clips toggles»). Gli unici clipper sono i due contenitori di
   scroll.

### Perché oggi funziona e con la grafica nuova no

Non è una regressione latente che il commit 2 scopre: è la **geometria** che cambia. Oggi
il pannello è `left: calc(100% + 6px); top: 50%; transform: translateY(-50%)` — centrato
verticalmente sull'icona, quindi la sua estensione verticale oltre la riga è di poche
decine di px e resta dentro il viewport dello scroller nella pratica.

La grafica nuova è `bottom: calc(100% + 8px)`: il pannello sale. Stima con i valori dello
spec (padding 12px, font 12px, line-height 1.45, max-width 340px):

- body di una riga, senza titolo → altezza ~41px → bordo superiore **~49px sopra l'icona**
- con `title` → **~70px**
- i testi reali più lunghi di `InfoData.tsx` (278, 249, 249, 193 caratteri: path style e i
  due endpoint JjEL) a 340px di larghezza vanno su 4-6 righe → altezza ~90-115px → bordo
  superiore **~100-125px sopra l'icona**

Qualunque icona si trovi entro ~130px dal bordo alto del viewport di scroll — e la prima
riga del pannello ci sta **sempre** — vedrà il tooltip tagliato in alto. `InfoData.tsx`,
col suo tooltip da 278 caratteri, è il caso peggiore ed è anche il consumatore più
frequentato (10 usi).

### Stacking

`z-index: var(--z-tooltip)` (1050) è disponibile e sarebbe corretto contro i menu di
react-select (`viewapplyto.scss:439`, `z-index: 999`). **Ma è irrilevante al problema**:
il ritaglio da `overflow` non si batte con lo z-index. Segnalato per completezza, non come
soluzione.

## A3. Punto 3 — token: quasi tutto è hex, e non per pigrizia

`styles/tokens/` (canone DS-6) contiene `_colors-light.scss`, `_colors-dark.scss`,
`_radius.scss`, `_shadows.scss`, `_typography.scss`, `_z-index.scss`, più gradients,
spacing, transitions.

| Valore chiesto dallo spec | Token esistente | Uso |
|---|---|---|
| background `#334155` | `$slate-700` (`_colors-light.scss:32`) è una **variabile SCSS**, non una custom property; le custom property che valgono `#334155` stanno quasi tutte in `_colors-dark.scss`, cioè valgono così **solo** sotto `[data-theme="dark"]` | **hex con commento** |
| testo `#cbd5e1` | `$slate-300` (`:26`), stessa natura | **hex con commento** |
| titolo `#f1f5f9` | `$slate-100` (`:20`), stessa natura | **hex con commento** |
| `border-radius: 10px` | `--radius-tooltip` esiste **ma vale 4px** (`--radius-sm`); la scala è 4/8/12/16 — **10px non è in scala** | vedi domanda 3 |
| `box-shadow 0 4px 12px rgba(15,23,42,.25)` | `--shadow-tooltip` = `--shadow-md` = **stessa geometria**, colore e alpha diversi (`rgba(0,0,0,0.08)` in light) | vedi domanda 3 |
| `font-size: 12px` | `--text-xs` = 11px, `--text-sm` = 13px — **12px non è in scala** | **hex/literal con commento** |
| `z-index` | **`--z-tooltip` = 1050 esiste ed è esatto** | **token** |

Il nodo di fondo: questo pannello è una **superficie scura su UI chiara**, e la palette
light non ha token per una superficie invertita. Non ne creo (vietato dal punto 3), quindi
restano literal commentati — esattamente la via che il punto 3 prevede.

**Nessun file `.scss` di componente in questa zona fa `@use`/`@import` dei partial dei
token**: consumano le custom property con `var(--x)`. `InfoTooltip.scss` farà lo stesso.

## A4. Perché mi fermo, e cosa si decide in chat

Il punto 2 di Fase 0-bis dice: «Se almeno un sito clippa: HARD STOP con report; la
soluzione (portal, riposizionamento) si decide in chat, non in autonomia». Clippano tutti
e quattro.

**La grafica e l'API non sono in discussione**: pannello scuro, caret, ombra, `title?`
opzionale sono indipendenti dall'ancoraggio e possono atterrare in qualunque caso. La
decisione è stretta: **dove si ancora il pannello**.

### Opzione A — ancoraggio orizzontale attuale, grafica nuova (raccomandata)

`left: calc(100% + 6px); top: 50%; transform: translateY(-50%)` invariati; cambiano solo
skin, caret (che va sul bordo **sinistro** del pannello, a puntare a destra verso
l'icona), ombra, `title?`.

- **Pro**: delta di clipping **zero** rispetto a oggi, cioè rispetto a una resa che lo
  smoke del commit 1 valida. Niente JS, niente portal, niente misurazioni. Lo spec resta
  onorato in tutto tranne la direzione.
- **Contro**: si discosta dallo screenshot del cruscotto, dove il caret è in basso a
  destra. La differenza è la direzione, non lo stile.

### Opzione B — pannello sotto invece che sopra

`top: calc(100% + 8px)`, caret sul bordo superiore.

- **Pro**: una riga di CSS rispetto allo spec.
- **Contro**: **non risolve**, sposta il taglio dal bordo alto a quello basso. Nei pannelli
  proprietà i campi in fondo sono altrettanto comuni.

### Opzione C — pannello fuori dal flusso, `position: fixed`

Precedente reale in casa: `components/forEndUser/tooltip.scss:2-3` fa esattamente questo
(`position: fixed; z-index: 9999`) ed è già importato da `Info.tsx:27`.

- **Pro**: immune a qualunque `overflow`, per costruzione.
- **Contro**: richiede misurazione a runtime (`getBoundingClientRect`) e riposizionamento
  su scroll/resize — cioè JS di posizionamento che l'emendamento non prevede («niente
  portal», «niente animazioni») e che porta con sé i propri modi di rompersi. È un
  cambiamento di categoria, non di stile.

### Opzione D — flip automatico sopra/sotto secondo lo spazio

- **Pro**: è ciò che farebbe una libreria di popper.
- **Contro**: stessa obiezione di C sul JS di misura, e non basta comunque quando lo
  scroller è più basso del pannello (il caso dei tooltip da 278 caratteri).

**Raccomandazione: A.** Tiene la grafica ratificata, non introduce codice di
posizionamento e non tocca l'unica proprietà la cui resa è già stata verificata a video.
Se lo screenshot del cruscotto è vincolante anche nella direzione, allora la strada onesta
è C, e va aperta come voce a sé con il suo perimetro.

## A5. Domande aperte per Alfonso

1. **Quale opzione fra A, B, C, D** per l'ancoraggio? Raccomandata A.
2. **GO sullo smoke di identità del commit 1** — il prerequisito 2 dell'emendamento lo
   chiede prima del commit 2, e non è ancora arrivato.
3. **`border-radius` e `box-shadow`**: lo spec chiede 10px e
   `rgba(15,23,42,0.25)`; i token semanticamente giusti esistono ma con valori diversi
   (`--radius-tooltip` 4px, `--shadow-tooltip` con alpha 0.08). Confermi i literal dello
   spec, oppure si snappa alla scala (`--radius-md` 8px o `--radius-lg` 12px)?

## A6. Esito della ratifica (aggiunto a valle, 2026-08-09)

Alfonso: **opzione A**, **GO** sullo smoke di identità del commit 1, e **conferma dei
literal dello spec** per radius (10px) e ombra (`rgba(15,23,42,0.25)`) invece dello snap
alla scala dei token. Commit 2 eseguito su queste tre risposte, registrato come **D-5-2**.

Una necessità emersa in implementazione, che il punto 2 dell'emendamento chiedeva di
annotare: `.jj-info-tooltip-title` ha bisogno di `display: block` oltre alle tre proprietà
dello spec. I figli del pannello sono `<span>` — un `<div>` dentro uno `<span>` non è
phrasing content — e su una casella inline il `margin-bottom` è inerte e il titolo
resterebbe sulla stessa riga del body. `.jj-info-tooltip-text` invece non ha ricevuto
regole proprie, come da spec: parte da sé dopo il blocco del titolo.

**Stato**: commit 2 chiuso. Smoke **passato** (Alfonso, 2026-08-09, «1-5 tutto ok»): la
grafica rende nei quattro siti e il punto 5 — l'unico rischio che restava aperto, la
fuoriuscita a destra dopo l'allargamento del pannello da 220 a 340px — non si verifica,
nemmeno sui tooltip da 278 e 249 caratteri di `InfoData.tsx`. La misura di §A2 regge
anche a video: con l'ancoraggio dell'opzione A nessuno dei due assi taglia.
