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
perimetro viewpoint e 10/10 su viewParenting). Smoke visivo pendente.
