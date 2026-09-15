# Discovery: deprecation del classic editor (v1) e applicabilità del meccanismo viewpoint a EditorV2

**Tipo**: Fase 1, discovery read-only. NESSUNA modifica al codice.
**Repo**: jjodel-frontend, branch `alfonso-frontend-jjtl`
**Data**: 2026-07-17
**Rev**: aggiornato 2026-07-17 in chat di progetto con 5 integrazioni: risoluzione multi-match (Area C), edge con endpoint non renderizzati (Area C), write path dei widget classic (Area C), registrazione nodeTypes (Area D), mappa gesti→azioni in EditorV2 e hotspot performance (Area D)

---

## Contesto e terminologia

Nel progetto convivono due editor:

1. **Classic editor (v1)**: la pipeline storica di rendering basata su viewpoint. Nodi renderizzati da `graph/defaultNode/DefaultNode.tsx` e dal machinery in `graph/`, template jsxString valutati a runtime (pipeline `DSL.parser` / `UX.parseAndInject` in `common/UX.tsx`), view risolte per predicato dal viewpoint attivo. Viene montato come `classicSlot` dentro EditorV2 tramite `components/abstract/tabs/EditorSwitch.tsx` (toggle flow / classic / split).
2. **EditorV2 (flow editor)**: `components/editor-v2/EditorV2.tsx` e la cartella `components/editor-v2/`. Nodi come componenti React fissi (`nodes/ClassNode.tsx`, `ObjectNode.tsx`, `EnumNode.tsx`, `PackageNode.tsx`), palette e notazioni via SCSS/CSS variables.

Obiettivo strategico (deciso in chat di progetto): rimuovere il classic editor. Prima di qualsiasi piano serve una mappa completa di (a) cosa dipende dal classic, (b) quanto del meccanismo viewpoint è editor-agnostico e quanto è accoppiato al classic renderer, (c) quanto lavoro serve per portare il rendering viewpoint-driven dentro EditorV2.

Attenzione al perimetro concettuale: il viewpoint non è solo rendering. I template classic contengono widget interattivi che scrivono sul modello, quindi la sintassi concreta è una superficie di editing (lettura E scrittura). La discovery deve fotografare entrambi i versi.

Questa discovery risponde a queste domande. Non implementa nulla.

## COSA

Produrre un discovery report che copra le cinque aree seguenti.

### Area A: perimetro del classic editor

- Elencare i file che compongono il classic editor: `graph/` (DefaultNode, GraphElement e affini), `components/edgeOverlay/EdgeOverlay.tsx`, edge classic in `edges/`, e ogni altro modulo renderizzato solo nel path `classicSlot`.
- Per ogni file: chi lo importa (grep sugli import), ed evidenziare i file importati ANCHE da codice non-classic (questi sono i punti dove la rimozione non è un semplice delete).
- Entry point UI che portano al classic: il toggle 3-stati in `EditorSwitch.tsx`, `ModelTab.tsx`, `MetamodelTab.tsx`, context menu (`ContextMenu.tsx`, incluso il path legacy `LViewElement.newDefault` invocato dai keystroke handler), `TreeViewSidebar`, `createViewInWorkbench` in `utils/lastViewpoint.ts`.

### Area B: dipendenze persistite (il rischio silenzioso)

- Template costanti: dove sono definite e usate `CLASSIC_OBJECT_VIEW_JSX`, `CLASSIC_VALUE_VIEW_JSX`, `DEFAULT_VIEW_JSX_STRING`. Chi le legge a runtime.
- Migration: cercare in VersionFixer tutte le migration che toccano view classic o leggono quelle costanti (nota: la 2.223 le legge a runtime). Elencare le schema version coinvolte.
- Progetti salvati: quali dati persistiti (DViewElement con jsxString, classi CSS `.jjodel-classic-object*`, container `__ref-anchors` per gli edge anchor) richiedono il runtime classic per essere renderizzati. Cosa succede aprendo un progetto con view classic se il runtime non c'è più.
- Esempi e progetti demo inclusi nel repo che usano view classic.

### Area C: inventario del meccanismo viewpoint e suo grado di accoppiamento

Questa è l'area più importante per la decisione.

- Inventario del machinery: `DViewPoint` / `LViewPoint`, `DViewElement` / `LViewElement` (in `view/`), risoluzione della view per un elemento (predicati / oclCondition / matching), applicazione di style, la pipeline di valutazione jsxString (`common/UX.tsx` `parseAndInject`, riferimenti in `redux/reducer/reducer.ts`), lo scope runtime iniettato nei template (`data`, `view`, `node`, `decorators`, `views`, `viewpoint`, ecc.), gli editor di authoring (`components/editors/viewpoint/`: WorkbenchEditors, TemplateEditor, PredicateEditor, StyleEditor, WorkbenchCanvas, TemplatePreview).
- **Algoritmo di risoluzione view→elemento (integrazione)**: come il classic sceglie la view quando più di una matcha lo stesso elemento. Documentare: ordinamento e priorità, flag di esclusività nelle opzioni della view, fallback sulla default view quando niente matcha, determinismo della scelta. Per gli edge esiste già un two-pass classifier (`findApplicableEdgeView`, con wildcard skip in Pass 1 e fallback in Pass 2, emerso nella sessione 2026-05-09); documentare l'equivalente per i nodi (Vertex/Field/Graph) con path e righe.
- **Edge con endpoint non renderizzati dal viewpoint attivo (integrazione)**: cosa fa oggi il classic quando source o target di una edge view non sono renderizzati (nessuna view applicabile, elemento filtrato dal viewpoint, container collassato). L'edge viene soppresso, risale a un antenato visibile, o altro? Documentare il comportamento effettivo nel codice, non quello atteso. Questo determina la semantica che l'interprete nuovo dovrà replicare o ridefinire esplicitamente.
- **Write path dei widget nei template classic (integrazione)**: i template non sono solo display; i componenti registrati includono widget interattivi (`Input`, `Edit`, `Select`, `TextArea`, `Color`, ...). Documentare: dove sono definiti e registrati (risoluzione via `windoww`), come un edit dell'utente su un widget torna sul modello (proxy L, `$attr.value = ...`, action Redux, path completo con file e righe), come vengono gestiti focus/commit/annulla, e quali widget scrivono direttamente vs passano da handler. Questo definisce il contratto di scrittura che qualunque sostituto della pipeline deve garantire.
- Per ciascun pezzo, classificarlo esplicitamente: **editor-agnostico** (lavora su dati e produce ReactNode, riusabile da qualunque host) oppure **classic-bound** (assume GraphElement, DefaultNode, nodi/coordinate del graph classic, edge anchor sui Field, ecc.). Indicare i punti di accoppiamento precisi con path e numero di riga.
- Gli edge: come le view/viewpoint influenzano il rendering degli edge nel classic, e cosa di questo non ha equivalente nel flow.

### Area D: stato attuale dell'integrazione viewpoint in EditorV2

- `components/editor-v2/viewpoint/ViewpointRenderer.tsx`: è uno stub che compila il jsxString con `new Function('React', 'data', ...)`. Documentare cosa gli manca rispetto alla pipeline classic (scope completo, parser DSL, gestione errori, subscription ai cambiamenti Redux, style, selezione view per predicato).
- Punti di aggancio esistenti: `ClassNode.tsx` righe ~423-434 renderizza ViewpointRenderer se `data.jsxString` esiste. Verificare se `ObjectNode.tsx` (M1) ha un aggancio analogo o nessuno.
- **Registrazione dei custom node React Flow (integrazione)**: dove EditorV2 registra i `nodeTypes`, e quanto è invasivo aggiungere un tipo di nodo nuovo (un futuro nodo generico viewpoint-driven) accanto a ClassNode/ObjectNode, invece di innestarsi dentro ClassNode com'è oggi lo stub. Indicare il punto di registrazione con path e riga e le assunzioni che i nodi esistenti fanno sul formato dei loro dati.
- **Mappa gesti→azioni in EditorV2 (integrazione)**: inventario di come i gesti dell'utente diventano oggi mutazioni del modello nella notazione fissa: il ramo `canvasToJjom` (creazione, delete via cascade canonica), gli handler di connect di React Flow (creazione edge/reference: quale metaclasse viene istanziata, quali reference vengono scritte), l'inline editing dentro ClassNode/ObjectNode (edit di nome/attributi), drop/containment se esiste. Per ciascun gesto: path, riga, e classificazione "generico/parametrizzabile" vs "hardcoded sulla metaclasse". Serve a dimensionare la parametrizzazione della superficie di editing.
- Come EditorV2 riceve oggi i dati dei nodi (props, hook, Redux) e se in quel flusso arriva già l'informazione "quale view del viewpoint attivo si applica a questo elemento" oppure no.
- **Hotspot di performance noti o sospetti (integrazione)**: nella pipeline di rendering attuale (classic e flow), annotare le evidenze dal codice di costi rilevanti nel render path: accessi al proxy L dentro i render, granularità delle subscription Redux (chi si sottoscrive a cosa, re-render a cascata), costo di EdgeOverlay, uso o assenza di memo/selettori. Solo lettura del codice, nessun profiling attivo; segnare i punti con path e riga e classificarli come "misurato/commentato nel codice" vs "sospetto da verificare con benchmark".
- `EditorSwitch.tsx` e `ActiveEditorContext.tsx`: come il viewpoint attivo governa il toggle e cosa cambierebbe se il flow diventasse l'unico renderer.

### Area E: rischi, critical zone, domande aperte

- Verificare se il perimetro toccato da una futura rimozione interseca i file critical-zone (`useJjomSync.ts`, `portDistribution.ts`).
- Elencare i comportamenti del classic senza equivalente flow (esempio noto: edge anchor sui Field via `__ref-anchors`; cercarne altri). Includere i comportamenti di EDITING senza equivalente flow (es. edit in place di slot arbitrari via widget nei template), non solo quelli di rendering.
- Bug noti rilevanti: esiste un bug segnalato di edge non tracciabile nel flow editor; se durante la lettura emergono indizi sulla causa, annotarli senza investigare a fondo.
- Chiudere con una lista di domande aperte per Alfonso, ciascuna con le opzioni sul tavolo.

## DOVE

Solo lettura. File di partenza (non esaustivi, seguire gli import):

- `frontend/src/components/abstract/tabs/EditorSwitch.tsx`, `ModelTab.tsx`, `MetamodelTab.tsx`
- `frontend/src/components/editor-v2/` (EditorV2.tsx, nodes/, viewpoint/ViewpointRenderer.tsx, ActiveEditorContext.tsx, hooks/, e il modulo dove vive `canvasToJjom`)
- `frontend/src/graph/` (DefaultNode e machinery collegato)
- `frontend/src/view/` (DViewPoint, DViewElement, LViewElement)
- `frontend/src/common/UX.tsx`, `frontend/src/common/DV.tsx` (qui o vicino: definizione dei widget registrati Input/Edit/Select/TextArea/Color)
- `frontend/src/components/editors/viewpoint/` e `frontend/src/components/rightbar/viewsEditor/`
- `frontend/src/utils/lastViewpoint.ts`
- `frontend/src/components/edgeOverlay/EdgeOverlay.tsx`, `frontend/src/edges/`
- VersionFixer (individuare il path esatto con grep)
- `frontend/src/redux/reducer/reducer.ts` (riferimenti parseAndInject)

## COME

1. Leggere `CLAUDE.md` nella root del repo prima di iniziare.
2. Leggere `docs/claude-code-log.md` per il contesto delle modifiche recenti.
3. Procedere per aree (A, B, C, D, E). Usare grep globale per import, costanti e nomi di classi CSS; leggere per intero solo i file centrali (EditorSwitch, ViewpointRenderer, DefaultNode, le parti rilevanti di UX.tsx e view/).
4. Nella classificazione dell'Area C essere concreti: ogni claim di accoppiamento deve citare path e riga, non impressioni.
5. Per le cinque integrazioni (risoluzione multi-match, edge con endpoint non renderizzati, write path dei widget, registrazione nodeTypes, mappa gesti→azioni + hotspot performance) vale la stessa regola: comportamento documentato dal codice con path e riga, non dedotto.
6. NESSUNA modifica a file di codice. Gli unici file scrivibili sono il discovery report e l'entry di log.

### Discovery report (OBBLIGATORIO)

- Salvare il report in `docs/discovery/` (creare la cartella se manca).
- Nome file: `discovery_2026-07-17_classic_editor_deprecation_viewpoint_v2.md`.
- Contenuto minimo: obiettivo della discovery, file letti/analizzati con path completi, findings per ciascuna delle 5 aree, tabella di classificazione editor-agnostico vs classic-bound per il machinery viewpoint (rendering E editing), dipendenze e rischi, domande aperte per Alfonso.
- La discovery NON è completa finché il report non è scritto su file. L'analisi successiva in chat parte dal report, non dalla memoria della sessione.

### Log

Aggiungere l'entry a `docs/claude-code-log.md` a fine task:

```
## 2026-07-17 — docs: discovery deprecation classic editor + viewpoint su EditorV2
**Prompt**: discovery read-only su perimetro classic editor, dipendenze persistite, accoppiamento del meccanismo viewpoint (rendering + editing), stato integrazione viewpoint in EditorV2 (rev. con 5 integrazioni)
**File toccati**: docs/discovery/discovery_2026-07-17_classic_editor_deprecation_viewpoint_v2.md (nuovo)
**Esito**: (compilare)
**Nome del documento prompt**: 2026-07-17 01:10 (rev. 2026-07-17)
```

### Hard stop

Al termine del report: STOP. Nessuna proposta di implementazione, nessun piano di rimozione, nessun commit di codice. Il piano si decide in chat di progetto sul report.

## RIFERIMENTI

- Il toggle flow/classic/split e le preferenze per-model in localStorage (`jjodel.editorPrefs.${modelid}`) sono documentati in `EditorSwitch.tsx`.
- Lavoro di visual parity M1 classic/flow (giugno 2026): classi BEM `.jjodel-classic-object*`, contratto via CSS variables (`--object-header-bg`, `--node-header-text`, `--field-type-color`), container nascosto `__ref-anchors` per preservare gli edge anchor. Schema version 2.223 con migration marker-based che legge le costanti template a runtime.
- Path noti di generazione default view: `createViewInWorkbench` (`utils/lastViewpoint.ts:152-164`, invocato da ContextMenu, TreeViewContent, EditorV2) e path legacy `LViewElement.newDefault` (`view/viewElement/view.tsx:289-375`, invocato dai keystroke handler di ContextMenu). Consolidati su `DEFAULT_VIEW_JSX_STRING` condivisa.
- Scope runtime dei template classic: `data` (LObject), `view` (LViewElement), `node` (LGraphElement), `decorators`, `views`, `viewpoint`, `nodeid`, `dataid`, `viewid`, flag `isVertex`/`isEdge`/`isGraph`. Componenti registrati nei template: `View`, `Input`, `Edit`, `Measurable`, `Scrollable`, `Color`, `Select`, `TextArea`, risolti via `windoww[name]`.
- Per gli edge: two-pass classifier `findApplicableEdgeView` (wildcard skip + fallback) e filtro per viewpoint attivo in `EdgeOverlay.tsx` (fix 2026-05-09, commit `8f83a62`).
- Delete M1 recente: `canvasToJjom` ramo DObject instradato su `.delete()` canonico con cascade (fix 2026-07-16, commit `fix(editor): route M1 instance deletion through canonical cascade`). È un esempio già a posto di gesto→azione canonica.
- Critical zone: `useJjomSync.ts`, `portDistribution.ts`. Non toccarli; segnalare solo se il perimetro li interseca.

## CONTESTO STRATEGICO (per l'analisi in chat, non per questa discovery)

La direzione discussa in chat di progetto (sessione 2026-07-17, da confermare dopo il report): promuovere la ViewpointIR (spec `spec_2026-06-08_ir_schema_v1_1.md`) da formato intermedio della feature AI a contratto della superficie di editing di EditorV2, su due piani compilati all'attivazione del viewpoint:

- **Render plan**: accessor e predicati compilati in closure, stili come classi CSS per view, risoluzione indicizzata per metaclasse, subscription Redux derivate dal dependency set dichiarato dall'IR.
- **Interaction plan**: palette di creazione derivata dalle view (metaclasse istanziabile per ogni view vertex/graphVertex non astratta), semantica di connessione derivata dalle edge view (il drag scrive le stesse reference che il rendering legge), drop di containment che scrive la feature usata per renderizzare i figli, edit in place derivato dai field spec con flag di editabilità. Tutte le scritture passano dal path canonico delle azioni.

Le cinque integrazioni di questa rev servono a dimensionare esattamente questo scenario. La discovery NON deve valutare o commentare la direzione: deve solo fotografare lo stato del codice.
