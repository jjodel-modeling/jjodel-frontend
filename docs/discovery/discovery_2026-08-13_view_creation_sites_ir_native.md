# Discovery — siti di creazione delle view e presupposti del collasso IR-nativo

**Data**: 2026-08-13 16:00
**Tipo**: Fase 1, read-only. Nessuna modifica a file `.ts` / `.tsx` / `.scss`.
**Repo**: jjodel-frontend, branch `alfonso-frontend-jjtl`, HEAD `8cc34ed45`
**Effort**: xhigh
**Protocollo**: `docs/PROTOCOL.md` P1..P9. P8 non applicabile (discovery read-only, nessun
diff da smoke-testare).

---

## 0. Ipotesi che la discovery falsifica o conferma

La direzione ratificata in chat il 2026-08-13 poggia su quattro presupposti. La discovery
li tratta come ipotesi da misurare, non come premesse:

| # | Ipotesi implicita nel prompt | Esito |
|---|---|---|
| H1 | Le view nuove nascono senza `ir`, quindi «morte alla nascita» | **Confermata** per ogni sito di produzione. Zero siti seedano `ir` (§A) |
| H2 | «View senza `ir`» è una categoria chiusa di ~86 view residue | **Falsificata nel numero.** 86 è il sottoinsieme marcato `irLegacyClassic`; la popolazione senza `ir` è ~1457 su 1550 (§C.4). E la categoria **non è chiusa**: cresce a ogni progetto nuovo (23 view) e a ogni view creata a mano (§A.3) |
| H3 | Il gate «Enable IR» è l'unico passaggio esplicito da ritirare | **Confermata**: unico mount `ViewData.tsx:145`, unico rimando testuale `TemplateData.tsx:22-27` (§B.2) |
| H4 | Source può assorbire l'ispezione del `jsxString` legacy | **Parzialmente**: Source è un `<pre>` di JSON, il ramo legacy monta tre editor Monaco, non uno (§D.3) |

---

## 1. Nota sui riferimenti del prompt (regola 15)

Due path citati non esistono. Entrambi risolti in modo non ambiguo, nessuno dei due era
bersaglio di azione:

| Citato | Reale |
|---|---|
| `docs/specs/` spec IR v1.2 | `docs/spec/claude_spec_2026-07-18_ir_schema_v1_2.md` |
| `docs/discovery/discovery_2026-08-04_legacy_view_census_real_projects.md` | `docs/discovery/discovery_2026-08-05_legacy_view_census_real_projects.md` (il documento è datato 2026-08-04 al suo interno, il file porta 08-05) |

I quattro commit citati esistono tutti: `197b6c3d0` (Fase 5a, 2026-07-18), `637a5e238`
(migration 2.225→2.226), `1d5b55aed` (S1), `383170dc0` (S2).

---

## 2. File letti / analizzati (path completi)

**Creazione e schema view**
- `frontend/src/view/viewElement/view.tsx` (1841 righe; letti :180-362, :1660-1841 integralmente)
- `frontend/src/view/viewPoint/viewpoint.ts` (integrale)
- `frontend/src/joiner/classes.ts` :1086-1200 (`Constructors.DViewElement`)
- `frontend/src/utils/lastViewpoint.ts` (integrale)
- `frontend/src/utils/defaultViewTemplate.ts` (integrale)
- `frontend/src/redux/defaults/views.ts` (grep mirata sui 14 `new2`)
- `frontend/src/redux/store.tsx` :104, :246, :324, :355-510
- `frontend/src/common/Defaults.ts` :5-115
- `frontend/src/common/DV.tsx` :662, :1030-1068
- `frontend/src/redux/VersionFixer.tsx` :108-158, :985-1056, :1220-1245 (**letto, non modificato** — critical zone)

**Trigger di creazione**
- `frontend/src/components/contextMenu/ContextMenu.tsx` :56-91, :440-560, :606-712
- `frontend/src/components/editor-v2/EditorV2.tsx` :3035-3055
- `frontend/src/components/TreeViewSidebar/TreeViewContent.tsx` :435-480, :1335-1362
- `frontend/src/components/project/ProjectEditor.tsx` :1180-1215
- `frontend/src/components/editors/views/NestedView.tsx` :38-62, :493
- `frontend/src/components/abstract/tabs/TabDataMaker.tsx` (integrale)
- `frontend/src/components/abstract/tabs/MetamodelTab.tsx` :140-190
- `frontend/src/components/abstract/tabs/ModelTab.tsx` :25-60
- `frontend/src/components/abstract/tabs/EditorSwitch.tsx` (integrale)

**Gate IR e superficie di authoring**
- `frontend/src/components/editor-v2/viewpoint/authoring/EnableIRPanel.tsx` (integrale)
- `frontend/src/components/editor-v2/viewpoint/authoring/irTabs.tsx` (integrale)
- `frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx` :100-200, :405-425
- `frontend/src/components/editor-v2/viewpoint/authoring/RowAuthoringPanel.tsx` :405-420
- `frontend/src/components/editor-v2/viewpoint/authoring/EdgeAuthoringPanel.tsx` :758-775
- `frontend/src/components/editor-v2/viewpoint/authoring/MatchingSection.tsx` (grep `metaclasses`)
- `frontend/src/components/editors/views/ViewData.tsx` (integrale)
- `frontend/src/components/editors/views/data/TemplateData.tsx` (integrale)
- `frontend/src/components/editors/languages/Jsx.tsx` (integrale)
- `frontend/src/components/editors/Info.tsx` :1310-1360

**Resolver e delega**
- `frontend/src/components/editor-v2/viewpoint/ir/irResolveCore.ts` :55-200
- `frontend/src/components/editor-v2/viewpoint/ir/irDefaults.ts` (integrale)
- `frontend/src/components/editor-v2/viewpoint/ir/metaclassPin.ts` (integrale)
- `frontend/src/components/editor-v2/nodes/ObjectNode.tsx` :55-95
- `frontend/src/components/editor-v2/viewpoint/ir/irDemoFixture.ts` :100-130

**Documenti**
- `docs/PROTOCOL.md`, `docs/decisions.md` (R-RAIL-1, R-RAIL-31, sezione IR)
- `docs/spec/claude_spec_2026-07-18_ir_schema_v1_2.md` §10, §11, §12, §13
- `docs/ratifiche/claude_ratifiche_2026-08-04_tab_partizione.md` R-1, R-2, R-5
- `docs/discovery/discovery_2026-08-05_legacy_view_census_real_projects.md`
- `docs/discovery/discovery_2026-07-22_ir_view_enablement_entrypoint.md`

**Nota di metodo (R-RAIL-31 / CLAUDE.md §5).** Tutte le ricerche usano `command grep`
(BSD grep 2.6.0-FreeBSD), non il wrapper `ugrep --ignore-files` della shell interattiva:
`--include` filtra davvero e i path gitignorati non vengono saltati in silenzio. Le
alternanze usano `-E` con glob quotati. Due asserzioni di assenza hanno un controllo
positivo esplicito, riportato dove compaiono (§A.5, §C.3).

---

## AREA A — Censimento dei siti di creazione di `DViewElement`

### A.1 Il fatto strutturale a monte

`Constructors.DViewElement` (`joiner/classes.ts:1086-1200`) è l'unico costruttore. Inizializza
**44 campi** e **non tocca mai `ir`**. Verificato leggendo il corpo per intero: nessuna
assegnazione a `thiss.ir` né a `thiss.irLegacyClassic`.

Ne discende che *ogni* view nasce con `ir === undefined`, e l'unico modo per averne uno alla
nascita è che la callback di `new2` lo scriva. Un solo sito lo fa, ed è una fixture di
sviluppo (A7).

`thiss.version = VersionFixer.get_highestversion()` (`:1095`) e `DState.version.n` è
inizializzato a `highestVersion` (`store.tsx:104`): **su un progetto nuovo la catena di
migration non gira mai** (`VersionFixer.update` :119 esce subito dal `while`). La migration
2.225→2.226 non è quindi una rete di sicurezza per le view create oggi.

### A.2 Tabella dei siti

| # | Sito (file:riga) | Trigger | Kind creato | Semina `ir`? | Semina `jsxString`? | Note |
|---|---|---|---|---|---|---|
| **A1** | `view/viewElement/view.tsx:315-361` `DViewElement.newDefault` → `.new2` a `:355` | **Ctrl+Alt+V** (`ContextMenu.tsx:666` `key_bindings.addView` → `addViewKeybind` `:644`); voci ctx-menu classico `view+m2` `:531` e `view+` `:536` | `appliableTo` resta `'Any'` (default del Constructor); solo `oclCondition` discrimina | **NO** | **SÌ** — `DEFAULT_VIEW_JSX_STRING` (`:317`) | Non scrive `appliableToClasses`: la metaclasse finisce solo dentro la stringa OCL |
| **A2** | `utils/lastViewpoint.ts:199-274` `createViewInWorkbench` → `.new2` a `:248` | ctx-menu canvas flow «Create View» (`EditorV2.tsx:3049`); ctx-menu tree view (`TreeViewContent.tsx:476`); voce `createview` del ctx-menu classico (`ContextMenu.tsx:487` → `addViewToWorkbench` `:633`) | `Vertex` (DClass/DEnumerator), `Graph` (DModel), `GraphVertex` (DPackage) | **NO** | **SÌ** — `DEFAULT_VIEW_JSX_STRING` (`:249`) | Scrive `appliableToClasses` con **nomi di tipo D** (`['DObject']`, `['DModel']`, …), mai il pointer della metaclasse |
| **A3** | `utils/lastViewpoint.ts:164-190` `createBlankViewInViewpoint` → `.new2` a `:182` | pulsante «+» sulla riga Viewpoint del tree (`TreeViewContent.tsx:1349`) | `'Any'` | **NO** | **NO** — `''` (`:184`, commento: «l'utente personalizzerà dopo») | Unico sito che nasce con template vuoto, seguito da rename inline |
| **A4** | `view/viewElement/view.tsx:1700-1796` `get_duplicate` → `.new2` a `:1714` | «Duplicate» su una view / viewpoint | eredita dalla sorgente | **SÌ, copiato** (ramo `default` `:1764-1772`, copia shallow `{...ir}`) | copiato dalla sorgente | Copia anche `irLegacyClassic`. La copia shallow crea un **nuovo oggetto top-level**, quindi non collide con le WeakMap keyed-by-ir di `refToken` e `delegationCache` |
| **A5** | `view/viewPoint/viewpoint.ts:38-45` `DViewPoint.newVP` | `ProjectEditor.tsx:1193` (dialog «New viewpoint»); `NestedView.tsx:51` (`addVP`); `view.tsx:1713` (duplicate) | viewpoint | **NO** | **NO** — `''` (`:44`) | **Un viewpoint nuovo non crea view di default**: nasce vuoto |
| **A6** | `redux/defaults/views.ts` ×14 (`:44,120,169,317,419,443,466,508,528,541,644,694,758,793`) + `redux/store.tsx:362,409,427,461` + `DV.edgeView` (`store.tsx:500` → `DV.tsx:1054`) ×5 | init dello store, cioè **ogni progetto nuovo** | 23 view + 2 viewpoint (`Defaults.views` / `Defaults.viewpoints`) | **NO** | **SÌ** — template generati da `common/DV.tsx` | Tutte protette da `Defaults.check` (`Defaults.ts:101`) |
| **A7** | `components/editor-v2/viewpoint/ir/irDemoFixture.ts:103,109` | console di sviluppo `window.__jjodelInstallIRDemo()` (`:129`) | vertex IR | **SÌ** (`:106`, `:112`) | **SÌ** — `DEFAULT_VIEW_JSX_STRING` | Unico sito che seeda `ir` alla creazione. Non è un percorso di prodotto |
| **A8** | `redux/VersionFixer.tsx:1232` `buildVersionSignature` | diagnostica di sviluppo (firma di schema) | campione sintetico | **NO** | `"jsx"` letterale | Non raggiungibile dall'utente |
| **A9** | `examples/StateMachine/views/index.ts:20,27,37,47,57,67,79` + `examples/StateMachine/index.ts:126` | — | — | **NO** | template d'esempio | **Codice morto**: zero importatori (§A.5) |

**Fuori tabella, distinto per natura (come chiede il prompt)**

| Sito | Natura |
|---|---|
| `view/viewElement/view.tsx:1798-1827` `updateDefaultView` | **Rigenerazione**, non creazione: sostituisce `s.idlookup[v.id]` con una copia della factory `Defaults`. Preserva `ir` (`:1809`) e **scarta deliberatamente** `irLegacyClassic` (`:1810-1816`) |
| `redux/VersionFixer.tsx:1009-1056` migration 2.225→2.226 | **Scrittura su view esistenti** al load, e solo se `state.version.n < 2.226`. Ramo 1 scrive `ir` con `migratedFrom: 'classic-default'`; rami 2 e 4 scrivono `irLegacyClassic`; ramo 5 (`isKnownDefault` vero) **non scrive nulla** |

### A.3 Risposta alla domanda chiave: quante creazioni producono view morte alla nascita

**Tutte quelle di prodotto.** Nove siti su dieci non seedano `ir`; l'unico che lo fa (A7) è
una fixture da console. In termini di volume:

- **A6, ~23 view per progetto nuovo.** È il numero più grande e il meno visibile: nascono
  senza `ir`, e siccome un progetto nuovo parte già a `highestVersion`, nessuna migration le
  toccherà mai. Sono view classiche permanenti *create oggi*, non residuo storico.
- **A1 e A2** sono i due gesti espliciti dell'utente («Add view», «Create View»). Entrambi
  scrivono ancora `DEFAULT_VIEW_JSX_STRING`.
- **A3** è l'unico che nasce vuoto.

**La coda da tagliare, in ordine di peso**: `redux/defaults/views.ts` + `redux/store.tsx`
(A6) prima di tutto, poi `utils/lastViewpoint.ts:249` (A2) e `view/viewElement/view.tsx:317`
(A1). Sono tre punti di scrittura di `DEFAULT_VIEW_JSX_STRING` e uno di template `DV.tsx`.

### A.4 Raggiungibilità reale dei trigger dopo la Fase 5a

Verifica non richiesta ma necessaria per pesare la tabella. Il ctx-menu classico
(`ContextMenu.tsx`) è ancora **montato** (`MetamodelTab.tsx:171`, `ModelTab.tsx:42`), ma il
suo popup non può più aprirsi: `ShowContextMenu` (`:76-87`) risale il DOM cercando
`dataset.nodetype === 'Graph'`, attributo emesso solo dal renderer classico
(`common/UX.tsx:149`), che la Fase 5a non monta più (`EditorSwitch.tsx:111-141`, commento
`:123-129`; `ModelTab.tsx:39-40`).

**Ma il modulo si carica e registra comunque i keystroke**: `setTimeout(registerKeystrokes, 1)`
a livello di modulo (`ContextMenu.tsx:712`), `Keystrokes.register('#root', …)` (`:709`).
Quindi:

- le voci di menu `view+`, `view+m2`, `createview` sono **irraggiungibili**;
- **Ctrl+Alt+V resta vivo** e chiama `newDefault` (A1) leggendo `state._lastSelected`, che
  EditorV2 scrive (`EditorV2.tsx:1249-1255`, `:2913`).

**Limite dichiarato**: che la scorciatoia arrivi davvero al listener con il focus dentro il
canvas ReactFlow è una proprietà runtime; in read-only ho verificato solo che la
registrazione avviene su `#root` (che contiene l'intera app) e che la sorgente di selezione
è popolata. Non ho eseguito la sequenza.

### A.5 Controllo positivo sull'asserzione di assenza (A9)

«`examples/StateMachine` non ha importatori» è un'asserzione di assenza. Controllo positivo
sulla stessa forma di comando:

```
command grep -rn "from '../../utils/lastViewpoint'" --include='*.tsx' .
  → 3 hit (Toolbar.tsx:9, EditorV2.tsx:103, ContextMenu.tsx:51)   [segnale presente]
command grep -rn "StateMachine" --include='*.ts' --include='*.tsx' . | grep -v '^./examples/StateMachine'
  → nessun import; solo occorrenze testuali (WelcomeModal, test jjtl, classes.ts:2606)
```

Coerente con il censimento del 2026-08-05, che aveva già classificato quei blob come codice
morto.

---

## AREA B — Il gate «Enable IR»

### B.1 `EnableIRPanel.tsx` — dove monta e cosa scrive esattamente

**Mount**: uno solo, `ViewData.tsx:145`, ultimo ramo della catena ternaria dentro il tab `IR`.
Condizione completa per arrivarci: `showIRTab` vero (`ViewData.tsx:65`) **e** `ir` falsy.
Sciolta:

```
isV && !ir && view.isEdge !== true
```

cioè: non è un viewpoint, non ha `ir`, non è una edge-view classica.

**Guardia interna** (`EnableIRPanel.tsx:67-76`): se `view.ir` esiste, il pannello rende un
`HelpText` di sola lettura e non offre alcuna azione. È una difesa ridondante rispetto a
`ViewData`, dichiarata tale nel commento `:63-66`.

**Cosa scrive `enable()` (`:80-108`) — esattamente una cosa:**

```ts
(view as any).ir = seed;     // :107, dopo validateIR :102
```

Un solo `SetFieldAction` via `LViewElement.set_ir` (`view.tsx:487`). **Non scrive**
`appliableToClasses`, **non scrive** `migratedFrom`, **non scrive**
`authoringMetaclassPins`, non tocca `jsxString`, non tocca `irLegacyClassic`.

**Il seed per kind:**

| kind | seed | `metaclasses` |
|---|---|---|
| `vertex` | `{...defaultObjectViewIR(), metaclasses, label: view.name}` (`:89-93`) | nomi risolti, **fallback `'*'`** |
| `row` | letterale minimale, `template: [{from:'intrinsic', prop:'name'}]` (`:83-88`) | sempre `[]` |
| `edge` | `{...defaultEdgeViewIR(), metaclasses}` (`:97-100`) | nomi risolti, **fallback `[]`** |

`resolveMetaclassNames` (`:34-46`) legge `view.appliableToClasses`, scarta i 13 nomi di tipo
D-level (`D_LEVEL_TYPES` `:22-25`, che include `''`, `DObject`, `DClass`, …), risolve il resto
via `LPointerTargetable.fromPointer` e tiene il `.name` delle sole `DClass`.

**Conseguenza misurata, e non ovvia**: le view create da **A2** hanno
`appliableToClasses = ['DObject']` / `['DModel']` / `['DPackage']` / `['DEnumerator']` — tutti
in `D_LEVEL_TYPES`. Quindi `resolveMetaclassNames` restituisce **sempre `[]`** su una view nata
da «Create View», e il seed vertex cade sul wildcard `'*'`. Il gesto che *sapeva* quale
metaclasse l'autore aveva scelto produce una view applicata a tutto.

**Osservazione a margine**: `EnableIRPanel` non riceve né consulta `readOnly`. `ViewData`
calcola `readOnly = !debug && Defaults.check(view.id)` (`:51`) e lo passa a `InfoData`,
`TemplateData`, `PaletteData`, `EventsData`, `GenericNodeData` — **non** al tab IR. Il bottone
«Enable IR authoring» è quindi attivo anche sulle 23 view di default protette (A6).

### B.2 Censimento degli entry point verso l'abilitazione IR

| Entry point | Dove | Stato |
|---|---|---|
| Il pannello | `ViewData.tsx:145` (mount), `EnableIRPanel.tsx:143` (bottone) | unico punto di scrittura |
| «entrypoint della fase B2c-ii» | **è lo stesso pannello.** `docs/prompts/claude_2026-07-23_prompt_faseB2c-ii_enable_ir_entrypoint.md:9` dichiara «entry-point DENTRO il tab IR (non header/context-menu)». Non esiste un secondo entrypoint | — |
| Avviso S2 sul tab Template | `TemplateData.tsx:22-27`: «This template is no longer interpreted. Rendering uses the abstract notation; to define a concrete syntax, **enable the IR**.» | testo, nessuna navigazione: non è un link né un bottone verso il tab IR |
| Altri riferimenti | grep su `EnableIRPanel`, `Enable IR`, `enable the IR`: 4 commenti (`metaclassPin.ts:39`, `EdgeAuthoringPanel.tsx:186`, `RowAuthoringPanel.tsx:114`, `VertexAuthoringPanel.tsx:120`) che citano il pannello come precedente per il filtro D-level. Nessun altro mount, nessun'altra CTA | — |

**Totale: un mount, un bottone, un rimando testuale non navigabile.**

### B.3 Cosa succede a ciascun entry point se la view arriva già con `ir`

Il fatto decisivo è a `ViewData.tsx:104`:

```ts
const tabs = irKind ? irTabsForKind(irKind, props.advanced).map(...) : [ …barra legacy… ];
```

Se `ir.kind` è `vertex | row | edge`, l'**intero array legacy non viene costruito**. Quindi:

| Entry point | Effetto con `ir` popolato alla creazione |
|---|---|
| `EnableIRPanel` | **Non monta mai.** Vive dentro il descrittore `'ir'` che sta nel ramo legacy (`:127-148`), ramo non preso. Diventa codice irraggiungibile |
| Tab `Template` (e il suo avviso) | **Non monta mai**: anch'esso nel ramo legacy (`:118-126`). L'avviso S2 sparisce con lui |
| `showIRTab` (`:65`) | Calcolato ma **mai letto** in quel percorso: è consumato solo dentro lo spread `:127` del ramo legacy |
| `templateLegacy` (`:72`) | Idem: passato solo a `TemplateData` (`:123`) |

**Nessuna logica assume «view senza `ir`» come stato intermedio del flusso di authoring.**
I tre pannelli (`Vertex`/`Row`/`Edge`) partono dal draft `view.ir` e non hanno un ramo
«non ancora abilitato». `irResolveCore` salta le view senza `ir` senza fallback (§C.2).
L'unico consumatore che *tratta* l'assenza è `ViewData`, e lo fa scegliendo la barra.

Se il seed si sposta alla creazione, `EnableIRPanel.tsx` (150 righe), la clausola `showIRTab`,
`templateLegacy` e la prop `legacyNoIR` di `TemplateData` diventano **tutti** morti per le view
nuove — restano vivi solo per lo stock storico.

### B.4 Il pin di identità (R-1) al momento della creazione

**Chi lo scrive oggi.** Solo `withMetaclassPins` (`metaclassPin.ts:128-149`), chiamato dal
`patch` dei tre pannelli (`VertexAuthoringPanel.tsx:146`, `RowAuthoringPanel.tsx:137`,
`EdgeAuthoringPanel.tsx:211`). E si riconcilia **solo** quando `metaclasses` cambia davvero
(`:133`, early return su uguaglianza JSON): è la regola di no-backfill dichiarata a `:114-116`.

`EnableIRPanel` **non scrive il pin**, pur avendo in mano gli id: `resolveMetaclassNames`
(`:34-46`) risolve `entry → LProxy → l.name` e **butta via `l.id`**, che è esattamente il
valore che il pin vuole. Una view abilitata dal pannello resta quindi senza pin finché
l'autore non tocca la lista metaclassi in `MatchingSection`.

La trappola registrata nella ratifica (`claude_ratifiche_2026-08-04_tab_partizione.md`, R-1,
«scrivere il pin su una view migrata ne cambia l'hash») è stata chiusa con la **seconda**
uscita: `irDefaults.ts:146` fa `delete structural.authoringMetaclassPins` prima di
confrontare gli hash. Verificato.

**Fotografia: cosa è disponibile alla creazione, sito per sito** (nessuna proposta, come
richiesto)

| Sito | Metaclasse target nota? | In quale forma | Utile al pin (`id`)? | Utile a `metaclasses` (`name`)? |
|---|---|---|---|---|
| **A1** `newDefault(forData, forSelf)` | **Dipende.** `forData` può essere `DClass`, `DModel`, `DAttribute`, `DReference`, un `DGraphElement`, o `undefined` | `forData.id` + `L.from(forData).name` (`view.tsx:348-349`) | **sì** quando `forData.className === 'DClass'` | **sì**, stesso caso |
| **A2** `createViewInWorkbench(elementId, elementName, className)` | **Sì, sempre**, per i 4 className gestiti | i due parametri, più `className` | **sì** — `elementId` è il pointer della `DClass` | **sì** — `elementName` è il nome della metaclasse |
| **A3** `createBlankViewInViewpoint(dVp, nameSeed)` | **Mai**: la firma non porta alcun elemento | — | no | no |
| **A4** `duplicate` | eredita: `ir` (pin incluso) è copiato per intero | — | n/a | n/a |
| **A5** `newVP` | n/a (viewpoint) | — | — | — |
| **A6** default di init | **Sì, ma D-level**: le default si applicano a `DModel`/`DClass`/`DObject`…, non a metaclassi M2 di progetto | `appliableToClasses = [DModel.cname]` ecc. | no — non sono `DClass` di progetto | no |

**Il punto saliente**: A2 ha in mano `elementId` (il pointer M2) ed `elementName`, cioè
esattamente la coppia che pin e `metaclasses` chiedono, e oggi li scarta entrambi — l'id
dentro una stringa OCL, il nome dentro il nome della view. A1 li ha nel caso `DClass`. A3 e
A6 non li hanno per costruzione.

---

## AREA C — Consumatori dell'assenza di `ir`

### C.1 `ViewData.tsx` a HEAD — condizioni esatte e le due barre

```ts
// :59
const ir = (view as any).ir;
// :65
const showIRTab = (ir?.kind === 'vertex') || (ir?.kind === 'row') || (ir?.kind === 'edge')
                  || (isV && !ir && view.isEdge !== true);
// :72
const templateLegacy = isV && !ir;
// :80-81
const irKind = (ir?.kind === 'vertex' || ir?.kind === 'row' || ir?.kind === 'edge') ? ir.kind : undefined;
```

`isVP = view.className === DViewPoint.cname` (`:53`), `isV = !isVP` (`:54`).

**Ramo IR** (`irKind` definito) — `irTabsForKind(kind, advanced)` (`irTabs.tsx:45-50`):

| kind | Basic | Advanced |
|---|---|---|
| `vertex` / `edge` | Applies to · Structure · Appearance · Text | + **Source** |
| `row` | Applies to · Text | + **Source** |

Source è l'**unico** tab advanced-gated (R-3, commento `irTabs.tsx:41-43`). Tutti i body sono
montati sempre, nascosti con `display:none` (`irTabBodyStyle` `:61-62`) — è la strada B, R-A:
un solo draft, un solo debounce a 300 ms, gli atomi di endpoint dell'edge sopravvivono al
cambio tab.

**Ramo legacy** (`irKind === undefined`), in ordine di costruzione `:108-185`:

| Tab | Condizione | Componente |
|---|---|---|
| Apply to | sempre | `InfoData` |
| Template | `isV` | `TemplateData`, `readonly = readOnly \|\| templateLegacy`, `legacyNoIR = templateLegacy` |
| IR | `showIRTab` | catena ternaria → `VertexAuthoringPanel` / `RowAuthoringPanel` / `EdgeAuthoringPanel` / `HelpText` per kind ignoto / **`EnableIRPanel`** |
| Style | sempre | `PaletteData` |
| Events | `isV` | `EventsData` |
| Options | `isV` | `GenericNodeData` |
| Components | `isVP` | `ComponentsTab` |

Per una view legacy tipica (`isV`, `!ir`, `!isEdge`): **6 tab** — Apply to, Template, IR,
Style, Events, Options.

Il ramo IR mostrato dal tab `IR` legacy (`:132-137`) è **irraggiungibile a HEAD**: se
`ir.kind` è uno dei tre autorabili, `irKind` è definito e il ramo legacy non si costruisce.
Resta vivo solo il ramo `EnableIRPanel` e il placeholder per kind non autorabili
(`graphVertex`).

### C.2 Resolver e indice IR

Due punti, entrambi in `irResolveCore.ts`:

```ts
// computeIRSignature :85-86 — la firma dell'indice
const ir = (d as any).ir;
if (ir && typeof ir === 'object') parts.push(`${vid}:${refToken(ir)}`);

// getIRIndex :114-115 — la costruzione dell'indice
const ir = (d as any).ir as AnyViewIR | undefined;
if (!ir || typeof ir !== 'object') continue;
```

**Le view senza `ir` sono saltate in entrambi.** Non entrano nella firma (non invalidano la
cache), non entrano nell'indice, non partecipano a nessun fallback. `getIRIndex` restituisce
`null` se `viewIds.length === 0` (`:190`): un viewpoint di sole view legacy è, per il
resolver, indistinguibile da nessun viewpoint.

A valle: `ObjectNode.tsx:60` `useIRView(...)` → `null` → ramo nativo astratto. È esattamente
il fallback normativo della spec §10 («elemento senza view IR applicabile → rendering
astratto di EditorV2, comportamento identico a "nessun viewpoint"»).

### C.3 Grep globale — mappa di tutto ciò che il collasso tocca

Ricerca su tutto `frontend/src`, `*.ts` + `*.tsx`, con `command grep`:

```
command grep -rlE "\.ir\b" --include='*.ts' --include='*.tsx' . | grep -vE "editor-v2/viewpoint|__tests__"
  → 4 file
command grep -rnE '![a-zA-Z_$.()]*\bir\b' --include='*.ts' --include='*.tsx' .
  → 5 hit  [controllo positivo: la ricerca trova ViewData.tsx:65 e :72, che so essere presenti]
```

| Sito | Codice | Classificazione |
|---|---|---|
| `components/editors/views/ViewData.tsx:59` | `const ir = (view as any).ir` | **superficie di authoring** |
| `ViewData.tsx:65` | `showIRTab` — `isV && !ir && view.isEdge !== true` | **superficie di authoring** |
| `ViewData.tsx:72` | `templateLegacy = isV && !ir` | **superficie di authoring** |
| `ViewData.tsx:80-81` | `irKind` — sceglie la barra | **superficie di authoring** |
| `ViewData.tsx:132-145` | catena ternaria del tab IR legacy | **superficie di authoring** |
| `editor-v2/viewpoint/ir/irResolveCore.ts:85-86` | firma dell'indice | **resolver-rendering** |
| `irResolveCore.ts:114-115` | `if (!ir …) continue` | **resolver-rendering** |
| `irDefaults.ts:138-139` | `isMigratedDefaultView`, guardia `!ir` | **resolver-rendering** (delega nativa) |
| `editor-v2/nodes/ObjectNode.tsx:65` | `irResolution !== null && isMigratedDefaultView(...)` | **resolver-rendering** |
| `editor-v2/nodes/ObjectNode.tsx:390` | `(irResolution.compiled.ir as VertexViewIR).resizable` | **resolver-rendering** |
| `view/viewElement/view.tsx:207` | dichiarazione campo `ir?: GObject` | **schema** |
| `view/viewElement/view.tsx:484-487` | `__info_of__ir`, `get_ir`, `set_ir` | **schema / D-L proxy** |
| `view/viewElement/view.tsx:1809` | carry-over di `ir` in `updateDefaultView` | **migration / rigenerazione** |
| `redux/VersionFixer.tsx:1038` | `if (e.ir !== undefined \|\| e.irLegacyClassic) continue` | **migration** (idempotenza) |
| `redux/VersionFixer.tsx:1042` | `e.ir = {...defaultObjectViewIR(), migratedFrom:'classic-default'}` | **migration** |
| `authoring/*Panel.tsx` (`Vertex:421`, `Row:414`, `Edge:766`) | `<IRSourceBody ir={(view as any).ir} />` | **superficie di authoring** |
| `authoring/EnableIRPanel.tsx:67`, `:107` | guardia + unica scrittura | **superficie di authoring** |
| `viewpoint/ir/irDemoFixture.ts:106,112` | `(d as any).ir = …` | **altro** (fixture dev) |

**Nota sull'assenza attesa**: R-RAIL-1 C1.2 prevede un identity block calcolato da
`view.ir.kind` / `view.ir.metaclasses`, che «per le view legacy (`!view.ir`) non si rende
affatto». **Quel consumatore non esiste a HEAD**: la lista sopra è esaustiva e non lo contiene.
Coerente con R-RAIL-26, che ha spostato il renderer dell'elemento di metamodello dall'arco 1
all'arco 2. Il controllo positivo che valida questa assenza è il fatto che la stessa grep
trova i 4 file attesi, `ObjectNode.tsx` incluso.

### C.4 `irLegacyClassic` a HEAD — e la correzione al numero «86»

**Censimento completo delle occorrenze** (grep su tutto `frontend/src`):

| Sito | Natura |
|---|---|
| `view/viewElement/view.tsx:211` | dichiarazione del campo |
| `view/viewElement/view.tsx:1810-1816` | commento: spiega perché `updateDefaultView` **non** lo riporta |
| `utils/defaultViewTemplate.ts:156` | commento |
| `redux/VersionFixer.tsx:1004,1006` | commenti |
| `redux/VersionFixer.tsx:1038` | **lettura** — guardia di idempotenza |
| `redux/VersionFixer.tsx:1045,1048` | **scritture** (rami 2 e 4) |
| `redux/__tests__/versionfixer_2226_classification.test.ts:17` | test |

**Confermato: zero letture fuori dalla guardia di idempotenza.** Nessuno ha iniziato a
leggerlo dopo S1 e S2. Non esiste alcun `LViewElement.get_irLegacyClassic`, nessuna UI, nessun
badge, nessun placeholder.

Ne discende una **divergenza spec ↔ codice** da mettere agli atti: la spec v1.2 §11 prescrive
che le view custom non riconosciute portino «un placeholder esplicito ("questa view richiedeva
il classic editor")». Quel placeholder non è mai stato costruito. `irLegacyClassic` è un
marchio scritto e mai letto.

**Correzione al numero del prompt.** Il prompt dice «residuo (~86 view sui progetti reali
post-S1)» descrivendo la categoria «view senza `ir`». I due insiemi non coincidono. Dal
censimento (`discovery_2026-08-05_legacy_view_census_real_projects.md`, tabelle §«Prima di S1»
e §«Dopo S1»), su 1550 `DViewElement` con `jsxString`:

| Insieme | Conta | Ha `ir`? | Ha `irLegacyClassic`? |
|---|---|---|---|
| già con `ir` prima della migration | 49 | sì | — |
| già flaggate prima della migration | 60 | no | sì |
| secchio 1 → riceve `ir` | 44 | sì | no |
| secchio 2 → marker value | 22 | **no** | sì |
| **secchio 3 → marcate legacy (post-S1)** | **86** | **no** | **sì** |
| **secchio 5 → default riconosciuta, nessun campo scritto** | **1289** | **no** | **no** |

- View **senza `ir`** dopo la migration: `1550 − 49 − 44 = ~1457`, cioè il **94%** del parco.
- Di queste, marcate `irLegacyClassic`: `60 + 22 + 86 = 168`.
- Di queste, **1289 non portano alcun segno**: sono le default generate dal tool (relazioni
  edge 381, sintassi astratta 664, edgePoint 62, anchor 61, void 61) che S1 ha riconosciuto e
  la migration ha deliberatamente lasciato intatte.

**86 è il residuo di view *marcate legacy*, non la popolazione senza `ir`.** La distinzione
conta per il collasso: se «legacy» significa «senza `ir`», la categoria vale ~1457 view su un
corpus di 1550 e **non è chiusa** — cresce di 23 a ogni progetto nuovo (A6) e di 1 a ogni
«Add view» (A1/A2/A3). Se «legacy» significa «marcata `irLegacyClassic`», vale 168 view ed è
chiusa solo perché la migration non rigira mai (né sui progetti già migrati, per idempotenza,
né sui nuovi, per versione).

`ViewData` usa la prima definizione: `templateLegacy = isV && !ir` (`:72`) apre in sola
lettura il Template di tutte e ~1457, comprese le 1289 default del tool che nessuno ha mai
autorato.

---

## AREA D — Superficie Source e assorbimento del legacy

### D.1 Il tab Source (barra 1.5)

| Aspetto | Fatto |
|---|---|
| Dichiarazione | `irTabs.tsx:22` `'ir-source'`, label `'Source'` (`:33`) |
| Gate | `irTabsForKind` `:49` — `return advanced ? [...content, 'ir-source'] : content`. Unico tab advanced-gated |
| Sorgente di `advanced` | `ViewData.tsx:275` `ret.advanced = !!(state as any).advanced`; scritto da `ProfileSection.tsx:394` `SetRootFieldAction.new('advanced', newMode)`. **Gate a livello di BARRA**: in Basic il tab non è proprio offerto (commento `ViewData.tsx:262-263`) |
| Componente | `IRSourceBody` (`irTabs.tsx:122-140`) |
| Cosa rende | `<pre>{JSON.stringify(ir ?? null, null, 2)}</pre>` — l'`ir` **persistito**, non il draft (commento `:113-117`: mostrare ciò che è davvero salvato è ciò che rende visibile il gap quando il draft non valida) |
| Perché non è un editor | commento `:118-120`: il body è montato sempre (strada B), Monaco peserebbe su ogni pannello e intercetterebbe i keystroke in capture phase (CLAUDE.md §15.1) |
| Mount | 3 siti identici: `VertexAuthoringPanel.tsx:419-423`, `RowAuthoringPanel.tsx:412-416`, `EdgeAuthoringPanel.tsx:764-768`. Tutti nella forma `<div style={body('ir-source')}><FormSection title="Source" divider={false}><IRSourceBody ir={(view as any).ir} /></FormSection></div>` |
| Props disponibili | i pannelli hanno `view: LViewElement` per intero, quindi `view.__raw.jsxString` è già a portata di mano |

### D.2 La superficie Template read-only di S2

| Aspetto | Fatto |
|---|---|
| Condizione di montaggio | `ViewData.tsx:118-126` — solo `isV`, e solo nel ramo legacy (`irKind === undefined`) |
| Props | `readonly = readOnly \|\| templateLegacy`, `legacyNoIR = templateLegacy` (`:123`) |
| Testo dell'avviso | `TemplateData.tsx:22-27`: «This template is no longer interpreted. Rendering uses the abstract notation; to define a concrete syntax, enable the IR.» Reso in `<HelpText>`, condizionato a `props.legacyNoIR` |
| Gate su `readOnly` | Tre livelli. (1) `JsxEditor` riceve `readOnly` (`TemplateData.tsx:30`) e lo applica a Monaco via `withReadOnly(...)` (`Jsx.tsx:148`). (2) **Il write path è chiuso a monte**: `blur()` `Jsx.tsx:45` fa `if (readOnly) return` prima di `view.jsxString = jsx` — necessario perché `onBlur` scatta comunque e `set_jsxString` schedulerebbe `VIEWS_RECOMPILE_jsxString` anche a valore invariato (commento `:38-44`). (3) Il modal fullscreen riceve `onSave = readOnly ? undefined : …` (`:170`), perché il suo Ctrl+S chiama `onSave?.()` senza controllare il flag (commento `:166-169`) |
| Cosa monta oltre al JSX | `<HRule>` + **due** `<Function>` Monaco: `constants` (`:32-39`) e `usageDeclarations` «Observed properties» (`:41-46`). Un terzo, `preRenderFunc`, è disabilitato con `false &&` (`:48`) |

### D.3 Distanza fra le due superfici — fatti, non piano

| Dimensione | Source (IR) | Template (legacy) |
|---|---|---|
| Numero di editor montati | 1 (`<pre>`) | 3 (JsxEditor Monaco + 2 `Function` Monaco) |
| Tipo del dato | oggetto → `JSON.stringify` | stringa già pronta |
| Interattività | nessuna, `<pre>` statico | Monaco read-only + toolbar (collapse / wrap / expand / fullscreen) + modal fullscreen |
| Avviso | assente | `<HelpText>` condizionato a `legacyNoIR` |
| Gate | `advanced` (a livello di barra) | `readOnly \|\| templateLegacy` (a livello di prop) |
| Warning di sintassi | assenti | 3 avvisi live su `<>`, `?.`, `??` (`Jsx.tsx:112-126`) |
| Barra che lo ospita | 5-tab IR (`irTabsForKind`) | 6-tab legacy (`ViewData.tsx:108-185`) |
| Accesso al campo altrui | `view` intero: `view.__raw.jsxString` **già disponibile** nei tre pannelli | `view.__raw.ir` disponibile ma non usato |

**Componenti coinvolti se Source dovesse mostrare anche il `jsxString`**, elencati come fatti:
`irTabs.tsx` (`IRSourceBody`, firma `{ ir: unknown }` — un `jsxString` è una stringa, non
JSON-serializzabile in modo utile con lo stesso `<pre>`); i tre pannelli, che oggi montano
`IRSourceBody` con la sola prop `ir`; `ViewData.tsx`, che decide quale barra costruire e oggi
non offre Source al ramo legacy; `TemplateData.tsx` + `Jsx.tsx` + i due `Function`, che sono
ciò che il ramo legacy perderebbe. **Nessuna proposta di implementazione**, come da vincolo.

---

## AREA E — `jsxString` residuo in creazione e default view

### E.1 Le view create oggi ricevono ancora un `jsxString` non vuoto?

**Sì, in 5 siti su 6 di produzione.** Costanti coinvolte:

| Sito | `jsxString` | Costante |
|---|---|---|
| A1 `newDefault` | non vuoto | `DEFAULT_VIEW_JSX_STRING` (`defaultViewTemplate.ts:82-95`), letto a `view.tsx:317` |
| A2 `createViewInWorkbench` | non vuoto | `DEFAULT_VIEW_JSX_STRING`, importato a `lastViewpoint.ts:10`, usato a `:249` |
| A3 `createBlankViewInViewpoint` | **vuoto** `''` | — |
| A4 `duplicate` | copiato | quello della sorgente |
| A5 `newVP` | **vuoto** `''` | `viewpoint.ts:44` |
| A6 default di init | non vuoto | 14 generatori di `common/DV.tsx` (`modelView`, `packageView`, `classView`, `enumeratorView`, `attributeView`, `referenceView`, `operationView`, `parameterView`, `literalView`, `objectView`, `singletonView`, `valueView`, `edgePointView`, `anchorJSX`) + `semanticErrorOverlay`, `invisibleJsx` ×2, `fallbackView` (`store.tsx:362,409,427,461`) + `DV.edgeView` ×5 (`store.tsx:500` → `DV.tsx:1054`) |

`DEFAULT_VIEW_JSX_STRING` è documentata (`defaultViewTemplate.ts:65-81`) come consumata
esattamente da `createViewInWorkbench`, `LViewElement.newDefault`, la mappa `Defaults` che
`updateDefaultView` rigenera, e la migration `2.223 → 2.224` come bersaglio di riscrittura.
La docstring è accurata.

Le altre costanti del modulo — `DEFAULT_VIEW_JSX_V2_3_LEGACY` (`:16`, dichiarata FROZEN),
`CLASSIC_OBJECT_VIEW_JSX` (`:191`), `CLASSIC_VALUE_VIEW_JSX` (`:217`),
`CLASSIC_SINGLETON_VIEW_JSX` (`:229`) — non sono scritte da alcun sito di creazione: servono
solo come bersagli di riscrittura o marker di detection nelle migration.

### E.2 Le default view IR e la delega (spec §11)

**Dove vive il confronto con la factory**: `irDefaults.ts:136-152`, `isMigratedDefaultView`.

```ts
if (compiled.viewId === IR_DEFAULT_OBJECT_VIEW_ID) return true;          // :137
if (ir.migratedFrom === 'classic-default') {                             // :143
    const structural = { ...ir };
    delete structural.migratedFrom;                                      // :145
    delete structural.authoringMetaclassPins;                            // :146
    delegated = irHash(canonicalize(structural)) === irHash(canonicalize(defaultObjectViewIR()));
}
```

`canonicalize` (`:103-111`) ordina le chiavi degli oggetti e lascia l'ordine degli array
(semantico). Memo per-`ir` su `WeakMap` (`:116`), factory hash calcolato una volta (`:113`).

**Unico consumatore**: `ObjectNode.tsx:65`
`const irDelegated = irResolution !== null && isMigratedDefaultView(irResolution.compiled)`.
La view resta nell'indice; cambia solo chi la rende.

**Le default create ex novo seguono lo stesso percorso?** **No, e per due ragioni distinte:**

1. `migratedFrom: 'classic-default'` è scritto in **un solo punto del codebase**:
   `VersionFixer.tsx:1042`, dentro la migration. `EnableIRPanel` lo omette
   deliberatamente (commento `:52-54`: «No `migratedFrom`: the view is authored custom, not
   migrated, so it renders through the IR interpreter (not the native branch)»). Nessun altro
   sito lo scrive — grep su `migratedFrom`: 2 occorrenze non-test non-commento, entrambe già
   citate.
2. `IR_DEFAULT_OBJECT_VIEW_ID` (`'Pointer_IRDefaultObjectView'`) **non è mai creato come
   `DViewElement`**: non compare in `Defaults.views` (23 id, nessuno è questo), non è passato
   come `id` a nessun `new2`. È solo una via di fuga per la delega e la chiave della cache di
   compile. Stesso discorso per `IR_DEFAULT_ROW_VIEW_ID`, dichiarato esplicitamente «MAI
   persisted as a DViewElement» (`irDefaults.ts:58-60`).

Quindi la delega al rendering nativo è raggiungibile **solo** dalle view che la migration ha
toccato, mai dalle view nate oggi. Una default creata ex novo (A6) non ha `ir` e cade sul ramo
nativo per la via ordinaria (§C.2) — stesso pixel, meccanismo diverso.

**Fuori scope, non analizzato**: se le default debbano esistere come `DViewElement`
(dichiarato fuori scope in chat).

---

## 3. Dipendenze e rischi individuati

**R1 — La popolazione «senza `ir`» non è chiusa (§C.4, §A.3).** Il presupposto n. 2 della
direzione ratificata («categoria chiusa che non può più crescere») è vero solo per
`irLegacyClassic`. La categoria «senza `ir`» cresce di 23 view a ogni progetto nuovo, perché
`redux/defaults/views.ts` e `redux/store.tsx` non seedano `ir` e la migration non gira mai su
un progetto nuovo (`store.tsx:104` + `VersionFixer.tsx:119`). Fino a che A6 non è toccato, il
collasso è prospettico solo per le view create a mano.

**R2 — Ritirare «Enable IR» senza toccare A6 lascia le default di init senza via d'uscita.**
Le 23 default sono `Defaults.check` → `readOnly` (`ViewData.tsx:51`); oggi l'unico modo per
dar loro un `ir` è il bottone di `EnableIRPanel`, che non consulta `readOnly`. Rimosso il
bottone senza seedarle alla creazione, restano senza `ir` e senza superficie per ottenerlo.

**R3 — `resolveMetaclassNames` produce `'*'` proprio sulle view che sapevano la metaclasse
(§B.1).** `createViewInWorkbench` scrive `appliableToClasses = ['DObject']`, che è in
`D_LEVEL_TYPES`. Ogni view nata da «Create View» e poi abilitata via pannello finisce
wildcard. Se il seed si sposta alla creazione, questo è il difetto che si eredita a meno di
usare `elementId`/`elementName` invece di `appliableToClasses`.

**R4 — Il pin non è scritto dal percorso di enable (§B.4).** `EnableIRPanel` risolve gli id e
li scarta. Un seed alla creazione avrebbe in mano `elementId` in A2 e `forData.id` in A1 (caso
`DClass`): sono i due soli siti dove il pin sarebbe scrivibile alla nascita.

**R5 — `irLegacyClassic` è un marchio senza lettori, e la spec prescrive un placeholder che
non esiste (§C.4).** Chi legge la spec §11 si aspetta un artefatto visibile che non c'è. Il
rischio non è di regressione ma di decisione presa su un'aspettativa sbagliata.

**R6 — Il ramo IR del tab `IR` legacy è già morto (`ViewData.tsx:132-137`).** Non è
raggiungibile a HEAD: `irKind` intercetta prima. Chi tocca `ViewData` deve sapere che quelle
righe non sono un percorso vivo, per non «preservarne il comportamento» inesistente.

**R7 — `updateDefaultView` è l'unico punto che riscrive le default a ogni bump di versione
(`view.tsx:1798-1827`), e preserva `ir` ma non `irLegacyClassic`.** Un seed alla creazione
delle default di A6 deve tenere conto che la factory `Defaults.defaultViewsMap` è la sorgente
della rigenerazione: se `ir` viene seedato in `defaults/views.ts`, il carry-over `:1809`
diventa ridondante ma non dannoso; se viene seedato altrove, la rigenerazione lo perde salvo
il carry-over. **Non ho modificato nulla**: `VersionFixer.tsx` e `DV.tsx` sono critical zone,
letti soltanto.

**R8 — `duplicate` copia `ir` in modo shallow (`view.tsx:1768`).** `{...ir}` produce un nuovo
oggetto top-level (quindi `refToken`/`delegationCache`, che sono `WeakMap` keyed-by-ir, non
collidono) ma condivide i sotto-oggetti `shape`, `labels`, `fieldCompartments` con la
sorgente. Innocuo finché i pannelli sostituiscono l'oggetto intero invece di mutarlo — cosa
che oggi fanno (`patch` → `setDraft(...)` → `view.ir = draft`). È un vincolo implicito che
nessun commento dichiara.

---

## 4. Limiti dichiarati

1. **Nessuna verifica runtime.** Che Ctrl+Alt+V (§A.4) arrivi al listener con il focus dentro
   il canvas ReactFlow non è verificabile in read-only. Ho verificato la registrazione
   (`ContextMenu.tsx:709-712`) e la disponibilità della sorgente di selezione, non l'esecuzione.
2. **I numeri del censimento non sono stati rimisurati.** §C.4 ricombina le tabelle del
   documento del 2026-08-05; il censimento stesso dichiara (nota di metodo 2) che replica il
   predicato `isKnownDefault` invece di invocarlo, quindi i suoi conteggi del terzo secchio
   sono un limite superiore. Le mie somme ereditano quel limite.
3. **`redux/defaults/views.ts` non è stato letto integralmente** (847 righe): ho letto
   `:30-60` e verificato con grep mirata l'assenza di `ir`/`.ir =` in tutto il file e i 14
   `new2` con il loro template. Un campo `ir` scritto con una forma sintattica diversa da
   quelle cercate sfuggirebbe.
4. **`common/DV.tsx` letto solo alle righe rilevanti** (`:662`, `:1030-1068`). Il file è il
   generatore dei template classici; non ho verificato che nessuno dei 14 generatori scriva
   `ir`, ma nessuno di essi crea `DViewElement` — lo fa il chiamante in `defaults/views.ts`,
   che è coperto dal punto 3.
5. **La critical zone è stata letta, mai modificata**: `VersionFixer.tsx`, `DV.tsx`. Nessun
   file `.ts`/`.tsx`/`.scss` è stato toccato in questa sessione.

---

## 5. Domande aperte per Alfonso

1. **Il collasso include A6?** Le 23 view di default create a ogni progetto nuovo
   (`redux/defaults/views.ts` + `redux/store.tsx`) sono il volume principale della coda. Se
   restano fuori, «le view nuove nascono IR-native» vale solo per i tre gesti manuali e la
   categoria legacy continua a crescere (R1). Se entrano, si tocca il percorso di init dello
   store, che è adiacente alla critical zone.

2. **Quale definizione di «legacy» si ratifica?** «Senza `ir`» (~1457 view, ~94% del corpus
   misurato) o «marcata `irLegacyClassic`» (168)? `ViewData` usa oggi la prima; il prompt cita
   il numero della seconda. La scelta decide quante view vedono il Template read-only con
   l'avviso, e se le 1289 default del tool sono «legacy» o semplicemente irrilevanti.

3. **`irLegacyClassic` va letto o ritirato?** Zero lettori a HEAD, e il placeholder che la
   spec §11 gli associa non è mai stato costruito. Le opzioni sono costruire il placeholder,
   oppure prendere atto che il marchio è inerte e chiudere la voce. Oggi la spec e il codice
   dicono cose diverse.

4. **Il seed alla creazione scrive anche il pin?** In A2 sono disponibili `elementId` e
   `elementName`, in A1 `forData.id`/`.name` per il caso `DClass`. Il pin è additivo, escluso
   dall'hash della delega (`irDefaults.ts:146`) e la regola di no-backfill vale per `patch`,
   non necessariamente per la creazione. Scriverlo alla nascita chiuderebbe R3 e R4 insieme;
   non scriverlo lascia il fallback per nome, che è il comportamento di oggi.

5. **Source assorbe il legacy con quale perimetro?** Il ramo legacy monta tre editor
   (jsxString, `constants`, `usageDeclarations`); Source è un `<pre>`. Se l'assorbimento è
   solo del `jsxString`, gli altri due campi perdono superficie. Se è di tutti e tre, Source
   smette di essere un dump e diventa una seconda superficie di ispezione.

6. **Il kind di default per il seed alla creazione.** `EnableIRPanel` fa scegliere fra
   `vertex` / `row` / `edge` con default `vertex` (`:61`). Alla creazione non c'è un autore da
   interrogare: A2 potrebbe derivarlo dal `className` (già mappato su `appliableTo`
   `Vertex`/`Graph`/`GraphVertex` a `lastViewpoint.ts:216-241`), A1 e A3 no.

---

**Fine Fase 1. HARD STOP.** Nessuna Fase 2, nessuna proposta implementativa nel codice.
Il report resta nel working tree; il commit attende autorizzazione.
