# Discovery 2026-08-23 — `NestedView` è UI irraggiungibile (Fase 0, read-only)

**Data**: 2026-08-23
**Branch**: `alfonso-frontend-jjtl`
**HEAD**: la misura è partita a `4ece7dd3d` ed è stata **ripetuta a `e51a82ec5`** con esito
identico: durante la Fase 0 un'altra sessione ha committato `4c9953fe2` (VIEW/Theme disable:
`editor-v2/Toolbar.tsx`, `EditorV2.scss`, `ColorSchemeSelector.tsx`) e `e51a82ec5` (la sua entry
di log). Nessuno dei due tocca il soggetto di questa misura. Il dettaglio è in §5.
**Prompt**: 2026-08-23 21:39 — R-LAY-12, NestedView è UI irraggiungibile
**Corregge**: la sezione di verifica visiva di
`claude_2026-08-23_1647_prompt_rlay11_sorgente_unica_attivazione.md`
**Esito**: tesi **confermata** — `NestedView` non è renderizzato da nessun sito, i tre gesti di
attivazione sono irraggiungibili. Due scostamenti dall'`Atteso` del prompt, **entrambi di
dettaglio e nessuno dei due tocca la conclusione**: §4.

## 1. Obiettivo

Il prompt delle 16:47 prescriveva una verifica visiva dei tre gesti di attivazione ospitati da
`NestedView` (radio `active-viewpoint`, doppio click, toggle «Click to activate»). La verifica è
risultata **ineseguibile**: nessuno dei tre gesti è stato trovato a schermo. L'ipotesi da provare
o falsificare è che il pannello che li ospita non sia montato da nessuna parte.

La stessa misura era già stata fatta in chat di progetto sul clone di origin (tip `9971ba2`) con
esito identico. Questo report la riproduce **sul working tree**, perché una misura fatta altrove
è un'ipotesi su un'altra copia del codice, non un fatto su questa (CLAUDE.md §5, «non fidarsi
delle fixture a memoria fra sessioni»).

## 2. Strumento

Tutte le ricerche con `command grep` — BSD grep 2.6.0-FreeBSD — **non** con `grep`, che in questa
shell è una funzione che avvolge `ugrep --ignore-files` (verificato: `type grep` →
`grep is a shell function from .../snapshot-zsh-...sh`). La distinzione è load-bearing: il
wrapper salta i path gitignorati e legge `--include=<glob>` come nome di file, quindi una ricerca
scritta per quel flag è **più larga** di quanto dichiari, non più stretta (CLAUDE.md §5).

Ogni asserzione di assenza porta il proprio controllo positivo nella stessa forma e con lo stesso
strumento. Directory di lavoro: `frontend/`.

## 3. Comandi eseguiti ed esito verbatim

### M1 — chi renderizza `NestedView`

```
command grep -rn --include="*.ts" --include="*.tsx" "NestedView" src
```

exit 0, 10 righe:

```
src/components/abstract/tabs/TabDataMaker.tsx:7:// (NestedView + ViewData) — no dedicated dock tab is created.
src/components/abstract/tabs/TabDataMaker.tsx:37:    // right-panel "Viewpoints" tab (NestedView + ViewData sub-tabs). See
src/components/abstract/Dock.tsx:21://import NestedView from "../rightbar/nestedViewEditor/ViewEditorNestedVersion";
src/components/editors/index.ts:8:export {NestedView} from './views/NestedView';
src/components/editors/views/NestedView.tsx:41:function NestedViewComponent(props: AllProps) {
src/components/editors/views/NestedView.tsx:558:export const NestedViewConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
src/components/editors/views/NestedView.tsx:561:)(NestedViewComponent);
src/components/editors/views/NestedView.tsx:563:export const NestedView = (props: OwnProps, children: ReactNode = []): ReactElement => {
src/components/editors/views/NestedView.tsx:565:    return <NestedViewConnected {...{...props, children}} />;
src/components/editors/views/ViewData.tsx:202:    // NestedView host has no such tree: there the back IS the only way from the
```

Fuori da `src/components/editors/views/NestedView.tsx` restano **quattro commenti**
(`TabDataMaker.tsx:7` e `:37`, `Dock.tsx:21` che è un import commentato di un path diverso e
oggi inesistente, `ViewData.tsx:202`) e **un re-export**, `editors/index.ts:8`. Nessun sito che
istanzi il componente.

La ricerca è per sottostringa, quindi copre anche `NestedViewConnected`: le sue uniche occorrenze
sono le righe 558 e 565 **dentro il file stesso**. Zero consumatori per entrambi i simboli.

### M1b — nessun uso in JSX fuori dal file

```
command grep -rn --include="*.ts" --include="*.tsx" "<NestedView" src
```

exit 0, **una** riga: `NestedView.tsx:565`, che è l'auto-riferimento del wrapper alla propria
versione connessa. Nessun altro file monta il componente.

### M1c — nessun import dinamico

```
command grep -rnE --include="*.ts" --include="*.tsx" "(import\(|lazy\().*NestedView" src
```

**exit 1**, zero righe. Controllo positivo sulla stessa forma di ricerca:

```
command grep -rncE --include="*.ts" --include="*.tsx" "(React\.lazy\(|[^a-zA-Z]lazy\(|import\()" src | wc -l
```

→ **938** file con segnale, fra cui `SaveManager.lazy.tsx:3`
(`const LazySaveManager = lazy(() => import('./SaveManager'))`) e `jjodie/rag/index.ts:161-164`.
La ricerca gira e vede il costrutto; l'assenza di `NestedView` in quella forma è un risultato
negativo, non un comando che non è partito.

### M1d — allargamento a tutti i tipi di file

Il perimetro `*.ts`/`*.tsx` è una scelta, non un dato: `src` contiene anche 7 file `.js`, 194
`.scss`, 32 `.css`. Per non lasciare una via nascosta, la ricerca è stata rifatta **senza filtro
di estensione**:

```
command grep -rn "NestedView" src | command grep -v "\.tsx:"
```

exit 0, **una** riga: `src/components/editors/index.ts:8`, il re-export già noto. Nessun hit in
`.js`, `.scss`, `.css`, `.json`, né in nessun altro tipo. Non esiste un registro di componenti
per nome, né un riferimento da configurazione, che aggiri l'analisi statica degli import.

### M2 — consumatori del barrel `components/editors`

```
command grep -rnE --include="*.ts" --include="*.tsx" "from ['\"][^'\"]*editors['\"]" src
```

exit 0, **due** righe:

```
src/components/abstract/Dock.tsx:8:import {Collaborative, Console, Logger, MetaData} from "../editors";
src/components/contextMenu/ContextMenu.tsx:45:import { Info } from '../editors';
```

Controllo di completezza sulla forma alternativa del path (`.../editors/index`):

```
command grep -rnE --include="*.ts" --include="*.tsx" "from ['\"][^'\"]*editors/index" src
```

exit 1, zero righe: nessuno importa il barrel per path esplicito all'`index`.

**Nessuno dei due importatori importa `NestedView`.** `Dock.tsx:8` prende
`Collaborative, Console, Logger, MetaData`; `ContextMenu.tsx:45` prende `Info`. Il re-export di
`editors/index.ts:8` è quindi vivo come riga di codice ed **è raggiungibile solo in astratto**:
nessun modulo lo importa per quel simbolo, e un barrel non istanzia nulla da sé.

Controllo positivo su una rotta di import analoga, che deve avere segnale:

```
command grep -rnE --include="*.ts" --include="*.tsx" "views/ViewData" src
```

exit 0 → `src/components/editors/Info.tsx:13:import { ViewData } from './views/ViewData';`.
La forma di ricerca trova gli import da `views/` quando ci sono. Il silenzio su `NestedView` non
è un difetto dello strumento.

### M3 — controllo positivo (già riportato in M1c e M2)

Vedi sopra: 938 file per il costrutto dinamico, `Info.tsx:13` per l'import da `views/`. Entrambi
hanno segnale. Se uno dei due fosse tornato vuoto, la Fase 0 si sarebbe fermata lì.

### M4 — l'UI di attivazione vive solo dentro `NestedView.tsx`

```
command grep -rn --include="*.ts" --include="*.tsx" "active-viewpoint" src
command grep -rn --include="*.ts" --include="*.tsx" --include="*.scss" --include="*.css" "vp-toggle" src
command grep -rn --include="*.ts" --include="*.tsx" "Click to activate" src
```

exit 0 su tutti e tre.

| Gesto | Marcatore | Siti |
|---|---|---|
| radio di attivazione | `name="active-viewpoint"` | `NestedView.tsx:149` |
| toggle | `vp-toggle` | `NestedView.tsx:369`, `:385` + `nestedView.scss:974, 1002, 2026, 2036` |
| tooltip del toggle | `Click to activate` | `NestedView.tsx:367` |

Due hit su `active-viewpoint` cadono fuori e **non sono UI**:
`src/utils/globalCssAudit.ts:22` (un commento di intestazione, il file è rilevato come `data` da
`file(1)` e ha richiesto `command grep -a`) e
`src/utils/__tests__/globalCssAudit.test.ts:65`, il nome di un `describe` che cita «the
active-viewpoint gate of view.tsx:778-782». Sono strumentazione di audit CSS che nomina il
concetto, non markup che lo renda.

Il foglio `nestedView.scss` è l'unico che stila il toggle: lo stile del gesto vive e muore con il
suo unico ospite.

### M5 — raggiungibilità delle superfici dei gate «Create View»

I tre gate che leggono `getLastEditedViewpointId()` (R-LAY-11) stanno su superfici **vive**, e
questo delimita il perimetro del difetto UX che sopravvive a R-LAY-12.

```
command grep -rn --include="*.tsx" "<ContextMenu" src
command grep -n "ContextMenu" src/components/abstract/tabs/MetamodelTab.tsx src/components/abstract/tabs/ModelTab.tsx
```

exit 0. I due mount del renderer **classico** sono confermati, e confermata è anche la loro
identità — il nome `ContextMenu` è omonimo su tre componenti distinti, quindi il mount da solo
non basta:

```
src/components/abstract/tabs/MetamodelTab.tsx:23:import ContextMenu from "../../contextMenu/ContextMenu";
src/components/abstract/tabs/MetamodelTab.tsx:171:        <ContextMenu graph={graphid}/>
src/components/abstract/tabs/ModelTab.tsx:19:import ContextMenu from "../../contextMenu/ContextMenu";
src/components/abstract/tabs/ModelTab.tsx:42:        <ContextMenu graph={graphid}/>
```

Gli altri `<ContextMenu` trovati sono **altri componenti** e non vanno confusi:
`EditorV2.tsx:4046` monta `./ContextMenu` locale a editor-v2 (`EditorV2.tsx:44`), e
`DV.tsx:1224-1530` usa `forEndUser/ContextMenu`, che è la API di authoring.

Catena di montaggio fino alla radice, verificata a ritroso:

```
Dashboard.tsx:635  <Try><Dock /></Try>
  → DockManager.tsx:140  TabDataMaker.metamodel(me) / TabDataMaker.model(me)
    → TabDataMaker.tsx:22  <MetamodelTab .../>   → ContextMenu (MetamodelTab.tsx:171)
    → TabDataMaker.tsx:32  <ModelTab .../>       → ContextMenu (ModelTab.tsx:42)
```

Per il Tree View:

```
Dashboard.tsx:639  <Try><PropertiesWithTreeView mode={'floating'} /></Try>
  → PropertiesWithTreeView.tsx:588  <TreeViewContent />
```

Entrambe le superfici sono raggiungibili dallo schermo. I tre gate che vi stanno sopra —
`ContextMenu.tsx:487`, `ContextMenu.tsx:531`, `TreeViewContent.tsx:483`, tutti nella forma
`const hasWorkbenchVP = !!getLastEditedViewpointId();` — sono quindi **visibili e permanentemente
disabilitati**, perché la variabile che leggono non ha più scrittori (R-LAY-11). È l'esatto
contrario del caso `NestedView`: lì il codice è vivo e la superficie è morta, qui la superficie è
viva e il dato è morto.

## 4. Scostamenti dall'`Atteso` del prompt

Riportati per intero come prescrive la clausola di Fase 0. **Nessuno dei due tocca la
conclusione**; sono stati sottoposti ad Alfonso prima di iscrivere R-LAY-12, che ha disposto di
procedere con gli scostamenti a referto.

| # | `Atteso` nel prompt | Misurato | Effetto sulla tesi |
|---|---|---|---|
| M2 | «un solo sito, `ContextMenu.tsx:45`, che importa `Info`, non `NestedView`» | **due** siti: `Dock.tsx:8` (`Collaborative, Console, Logger, MetaData`) e `ContextMenu.tsx:45` (`Info`). `Dock.tsx` è un modulo **vivo** (montato a `Dashboard.tsx:635`), non codice morto | **nessuno**. La clausola che porta peso è la seconda: nessuno dei due importa `NestedView`. «Zero consumatori» regge, ed è misurato su due importatori invece che su uno |
| M1 | commento a `TabDataMaker.tsx:6,37` | riga **7**, non 6 (`:37` corretto) | **nessuno**. Resta un commento in entrambe le letture |

Il testo di R-LAY-12 non asserisce l'unicità dell'importatore del barrel: asserisce un re-export
«che nessuno importa per quel simbolo». Sotto entrambi gli scostamenti resta vero parola per
parola, e per questo è stato iscritto verbatim.

Vale la pena registrare che lo scostamento M2 è della stessa famiglia dell'errore che R-LAY-12
corregge — un'affermazione di unicità presa da una misura fatta altrove e non riprodotta. Qui è
stato innocuo. Riprodurre la misura sul working tree è ciò che lo ha reso visibile.

## 5. Nota di concorrenza

La Fase 0 è iniziata con working tree pulito a HEAD `4ece7dd3d`. A metà misura `git status` ha
riportato per un istante un file modificato e HEAD si è spostato a `4c9953fe2` e poi a
`e51a82ec5`: **un'altra sessione stava committando in parallelo**. I due commit toccano
`editor-v2/Toolbar.tsx`, `EditorV2.scss`, `ColorSchemeSelector.tsx` e `docs/claude-code-log.md`.

Nessuno di quei file è il soggetto di questa misura, ma «non c'entra» è un giudizio, non un dato:
le tre misure load-bearing (M1 su tutti i tipi di file, M2, il controllo positivo) sono state
**rieseguite a `e51a82ec5`** con output identico riga per riga. Le tabelle di questo report
valgono a quell'HEAD.

Conseguenza operativa applicata al commit di questo task: pathspec esplicito al `git commit`, mai
`git add .`, e confronto di `git diff --cached --name-only` con la lista dichiarata prima di
committare (CLAUDE.md §6.1 — l'indice è condiviso fra sessioni).

## 6. Conclusione

`NestedView` è **UI morta**: il file esiste, compila, è coperto dal suo foglio di stile e non è
renderizzato da nessun sito raggiungibile. Ne segue, per i tre gesti di attivazione che ospita:

1. La divergenza fra `project.activeViewpoint` e `state.viewpoint` che R-LAY-10 pone come
   condizione di sblocco era **possibile nel codice ma non producibile dalla UI**. «Già viva
   oggi», nella entry del 2b, va letta come «viva nel codice, irraggiungibile dallo schermo».
2. La verifica visiva prescritta dal prompt delle 16:47 non era eseguibile perché **non esiste il
   pixel da guardare**, non perché Alfonso non l'abbia trovato. La sostituzione è in R-LAY-12.
3. Il commit `052966df8` ha modificato codice morto. Si tiene come hardening difensivo — se un
   giorno il pannello torna a essere montato, i due `select` passano già da `activateViewpoint` —
   non come chiusura di una divergenza viva.
4. `NestedView.tsx` entra nel censimento del codice morto e **non si rimuove** (Rule 9).

La lezione è quella già scritta in R-IRN-23 e qui riconfermata su un altro fronte: una catena
statica corretta non dice se il percorso è raggiungibile. La Fase 0 del prompt delle 16:47
verificava che i siti esistessero nel codice, ed erano lì; non verificava che qualcuno li
montasse, e nessuno lo fa.
