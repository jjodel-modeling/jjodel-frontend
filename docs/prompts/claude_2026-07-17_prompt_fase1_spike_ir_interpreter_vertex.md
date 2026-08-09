# Prompt Fase 1 — Spike interprete IR in EditorV2 (rendering vertex M1, zero editing)

**Data**: 2026-07-17 16:49
**Tipo**: feat (spike dietro attivazione implicita, nessun impatto sul comportamento esistente)
**Repo**: jjodel-frontend, branch `alfonso-frontend-jjtl`
**Prerequisito di lettura**: `CLAUDE.md` (fonte di verità; in caso di conflitto con questo prompt, segnalare e fermarsi) e il discovery report `docs/discovery/discovery_2026-07-17_classic_editor_deprecation_viewpoint_v2.md`, in particolare §3.2-bis (risoluzione), §3.8 (cuciture), §4-bis (nodeTypes e ObjectNode), §4-ter (hotspot performance).

## Contesto (autocontenuto)

Decisione di progetto (sessione 2026-07-17): il classic editor (v1) verrà rimosso e la ViewpointIR (spec `spec_2026-06-08_ir_schema_v1_1.md` nel KB di progetto; i tipi essenziali sono ridefiniti sotto, il prompt è autosufficiente) diventa il contratto della sintassi concreta in EditorV2. L'interprete NON valuta l'albero IR a ogni render: all'attivazione del viewpoint compila un render plan (accessor e predicati in closure, stili come classi CSS per view, risoluzione indicizzata per metaclasse).

Questo spike costruisce il nucleo minimo: rendering di view IR di kind `vertex` per gli oggetti M1 (ObjectNode), dietro un viewpoint demo installabile via console. Zero editing, zero edge, zero graphVertex, zero migration. Il classic non viene toccato.

Decisioni semantiche già prese (non ridiscuterle, implementarle):

1. **Risoluzione multi-match con regola esplicita IR**, non la formula del classic: ordine deterministico `priority` esplicita > specificità di metaclasse (match esatto > per ereditarietà) > ordine di dichiarazione delle view nel viewpoint. Il resolver dello spike è IR-nativo: opera SOLO sulle view che hanno il campo `ir`, non chiama `getAppliedViewsNew` e non tocca `transientProperties`. I due resolver coesistono senza sovrapposizione: un viewpoint è IR oppure classic, mai entrambi.
2. **Accessor su interfaccia di lettura stretta (ReadCtx)** con due backend intercambiabili: proxy L e lettura D-diretta. Default per lo spike: proxy L. Lo switch è una costante nel modulo IR. Il benchmark deciderà in una fase successiva; non misurare qui.
3. Escape hatch jsxString rimandato: nessun supporto per template raw nell'interprete.

## COSA

1. **Campo `ir` su DViewElement** (additivo): proprietà opzionale `ir?: object` nel D-layer di `view/viewElement/view.tsx`, con getter/setter L minimi. Serializzazione generica: nessun VersionFixer necessario per un opzionale undefined (verificato nella spec IR sez. 8). Non modificare nessun campo esistente.
2. **Modulo interprete** in `frontend/src/components/editor-v2/viewpoint/ir/` (cartella nuova):
   - `irTypes.ts`: tipi TypeScript del subset v1 dello schema (vedi sezione Tipi sotto).
   - `irCompile.ts`: `compileView(ir: VertexViewIR): CompiledView`. Compila una volta per view: accessor PathExpr in closure su ReadCtx, Predicate in closure booleane, Conditional in funzioni valore, dependency set (elenco nomi feature letti dai PathExpr della view). Cache per (view id, hash dell'ir).
   - `irReadCtx.ts`: interfaccia `ReadCtx` (lettura feature di un elemento: valore singolo, valori multipli, navigazione, nome metaclasse, test instanceof) con backend proxy L e backend D-diretto. Costante `IR_READ_BACKEND: 'lproxy' | 'draw' = 'lproxy'`.
   - `irResolve.ts`: `resolveIRView(elementId, viewpoint): CompiledView | null`. Indice per metaclasse costruito all'attivazione del viewpoint; regola di ordinamento del punto 1 sopra. Restituisce null se il viewpoint attivo non ha view IR (l'aggancio in ObjectNode allora non fa nulla).
   - `IRNodeContent.tsx`: componente React che rende il contenuto di un nodo dal CompiledView (shape rect/rounded/ellipse, label da PathExpr con posizione top/center/inside/bottom, badge Bootstrap Icons con visibilità condizionale, field compartment read-only da attributes/references con rowFormat). Nessun handler di scrittura.
   - `irStyle.ts`: genera e inietta le classi CSS per view in un tag `<style id="ir-views-css">` dedicato (una classe `.ir-view-<viewid>` per view, iniettata una volta all'attivazione, rimossa alla disattivazione). Non toccare l'iniettore esistente di `Dashboard.tsx`.
   - `irDemoFixture.ts`: helper dev-only `window.__jjodelInstallIRDemo()` che crea un viewpoint "IR Demo" con 2-3 view vertex per un metamodello tipo StateMachine: State base (rounded, label `$name.value`), State iniziale (predicato `eq($isInitial.value, true)`, badge `bi-play-circle-fill`, priority più alta). Le view della fixture ricevono anche `jsxString = DEFAULT_VIEW_JSX_STRING` e `appliableTo`/`appliableToClasses` coerenti, così l'eventuale passaggio al classic con quel viewpoint attivo mostra il rendering default invece di rompersi.
3. **Innesto in ObjectNode** (`components/editor-v2/nodes/ObjectNode.tsx`): se il viewpoint attivo risolve una view IR per l'oggetto, renderizzare `IRNodeContent` al posto del contenuto fisso (righe feature). Conservare INVARIATI: wrapper `.mm-node`, `NodeResizer`, `DynamicHandles`, `useNodeHighlightClass` (il report §4-bis conferma che il contratto handle è agnostico). Aggiungere al wrapper `className` con l'id della view e `data-viewid`. Se nessuna view IR risolve, comportamento identico a oggi.
4. **NON toccare** `ClassNode.tsx`: il ramo `jsxString`/`ViewpointRenderer` morto resta com'è. Nessuna modifica a transformer, `nodeTypes`, EditorSwitch, Toolbar.

### Tipi (subset v1 per lo spike, da `irTypes.ts`)

```typescript
type PathExpr = string; // "$name.value", "$attrs.values[0]", navigazione concatenata. Vietati ?. ?? ternari chiamate.

type Literal =
  | { kind: 'string'; value: string }
  | { kind: 'number'; value: number }
  | { kind: 'boolean'; value: boolean };

type Predicate =
  | { op: 'and' | 'or'; args: Predicate[] }
  | { op: 'not'; arg: Predicate }
  | { op: 'eq' | 'neq' | 'lt' | 'lte' | 'gt' | 'gte'; left: PathExpr | Literal; right: PathExpr | Literal }
  | { op: 'exists'; path: PathExpr }
  | { op: 'empty'; path: PathExpr }
  | { op: 'isKind'; class: string; path?: PathExpr }
  | { op: 'literal'; value: boolean };

type Conditional<T> =
  | T
  | { when: Predicate; then: T; else?: T }
  | { rules: { when: Predicate; then: T }[]; default?: T };

interface VertexViewIR {
  irVersion: string;               // "ir-1.0"
  kind: 'vertex';
  metaclasses: string[];           // nomi di metaclasse del metamodello
  predicate?: Predicate;
  priority?: number;
  exclusive?: boolean;             // per lo spike: solo view esclusive, le decorative si ignorano
  label?: string;
  shape: {
    form: Conditional<'rect' | 'rounded' | 'ellipse'>;
    fill?: Conditional<string>;
    border?: { color: string; width: number; style: 'solid' | 'dashed' | 'dotted' };
    labels?: { position: 'top' | 'center' | 'inside' | 'bottom'; source: { from: 'path'; expr: PathExpr } | { from: 'literal'; text: string }; visible?: Conditional<boolean> }[];
    badges?: { icon: Conditional<string>; position: 'tl' | 'tr' | 'bl' | 'br'; visible: Conditional<boolean>; tooltip?: string }[];
  };
  fieldCompartments?: {
    id: string;
    source: { from: 'attributes' } | { from: 'references' };
    rowFormat: { segments: ({ kind: 'name' } | { kind: 'type' } | { kind: 'value' } | { kind: 'literal'; text: string })[] };
    visible?: Conditional<boolean>;
    separator?: boolean;
  }[];
}
```

## DOVE (scope stretto, elenco chiuso)

File modificati:

- `frontend/src/view/viewElement/view.tsx` (SOLO aggiunta campo opzionale `ir` + accessor; nessun rename, nessun altro campo toccato)
- `frontend/src/components/editor-v2/nodes/ObjectNode.tsx` (SOLO l'innesto del ramo IR)

File nuovi:

- `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts`
- `frontend/src/components/editor-v2/viewpoint/ir/irCompile.ts`
- `frontend/src/components/editor-v2/viewpoint/ir/irReadCtx.ts`
- `frontend/src/components/editor-v2/viewpoint/ir/irResolve.ts`
- `frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx`
- `frontend/src/components/editor-v2/viewpoint/ir/irStyle.ts`
- `frontend/src/components/editor-v2/viewpoint/ir/irDemoFixture.ts`
- `docs/discovery/discovery_2026-07-17_ir_interpreter_spike_seams.md` (report Fase A; se la data di esecuzione è diversa, usare quella)
- entry in `docs/claude-code-log.md` a fine task

VIETATO toccare: `useJjomSync.ts`, `portDistribution.ts` (critical zone), `defaultViewTemplate.ts`, `common/DV.tsx`, `redux/VersionFixer.tsx`, `redux/reducer/reducer.ts`, `redux/selectors/selectors.ts`, `ClassNode.tsx`, `jjomTransformers.ts`, `EditorSwitch.tsx`, qualunque file sotto `graph/`. Se una modifica a uno di questi sembra necessaria, fermarsi e segnalare il conflitto, non procedere.

Prima di introdurre ogni nuovo identificatore (classi CSS `ir-view-*`, `ir-node-content`, id `ir-views-css`, nomi esportati, `window.__jjodelInstallIRDemo`): `grep -r` globale per verificare che il nome non sia già in uso.

## COME

### Fase A — Verifica mirata (read-only, prima di scrivere codice)

Verificare sul working tree, con report OBBLIGATORIO in `docs/discovery/discovery_2026-07-17_ir_interpreter_spike_seams.md` (obiettivo, file letti con path, findings, rischi, domande aperte):

1. Come un ObjectNode risale al DObject e alla sua metaclasse (il report principale indica che ObjectNode legge `state.idlookup` per metaclasse e feature, righe :40-45/:54-120): confermare il percorso e come si testa `instanceof` rispetto a un nome di metaclasse (risoluzione nome → pointer DClass).
2. Forma reale dei valori feature sul D-layer e sul proxy L per implementare i due backend di ReadCtx (slot `.value` vs `.values[]`; il bypass `__raw` documentato in `jjomTransformers.ts:150-154` è il riferimento per il backend D-diretto).
3. Dove agganciare la risoluzione in ObjectNode senza aggiungere scan O(model) per dispatch: la risoluzione deve dipendere solo da (viewpoint attivo, metaclasse dell'oggetto, feature lette dai predicati della fixture). Il report §4-ter documenta che ObjectNode ha già due useSelector per nodo: non peggiorare quel profilo, riusare i dati già selezionati dove possibile.
4. Il viewpoint attivo: dove vive nello state (`state.viewpoint`) e come si leggono le view del viewpoint con campo `ir`.

HARD STOP condizionale: fermarsi e riportare in chat SOLO SE (a) leggere le view del viewpoint attivo da ObjectNode richiede modifiche a file vietati, oppure (b) la risoluzione nome metaclasse → pointer non è fattibile senza toccare il core. Altrimenti proseguire con la Fase B. La discovery grande è già stata fatta: questa fase verifica quattro assunzioni puntuali, non riapre l'analisi.

### Fase B — Implementazione in 2 commit

**Commit 1** `feat: add IR view field and compile module (no UI wiring)`: campo `ir` + `irTypes` + `irCompile` + `irReadCtx` + `irResolve` + `irStyle` + fixture. Nessun import da ObjectNode. Verifica: `npm run build` verde; app visivamente IDENTICA a prima (hard refresh su http://localhost:3001/).

**HARD STOP**: attendere conferma visiva di Alfonso prima del commit 2.

**Commit 2** `feat: render IR views in ObjectNode behind active viewpoint`: hook di risoluzione + innesto + CSS. Verifica di Alfonso (criteri espliciti):

1. Su un modello StateMachine: `window.__jjodelInstallIRDemo()` in console, attivare il viewpoint "IR Demo" dal selettore; gli State si rendono secondo l'IR (rounded, label dal nome, badge play sullo State con isInitial true).
2. Modificare `isInitial` di uno State: il badge segue il valore.
3. Tornare al viewpoint default: rendering ObjectNode identico a prima dello spike.
4. Drag, resize, selezione ed edge esistenti funzionano invariati sui nodi resi via IR (wrapper, handles e resizer non sono stati toccati).
5. Console senza errori nuovi.

Git: `git add` dei SOLI file elencati in DOVE, mai `git add .` (il working tree contiene commit pendenti del filone validazione conformance). Commit message convenzionali, una riga, in inglese.

A task concluso (dopo la conferma visiva del punto 5): entry in `docs/claude-code-log.md` secondo il formato standard del log.

## RIFERIMENTI

- `docs/discovery/discovery_2026-07-17_classic_editor_deprecation_viewpoint_v2.md` (report della discovery grande, nel repo)
- Spec IR v1.1 nel KB di progetto (`spec_2026-06-08_ir_schema_v1_1.md`); questo prompt ne ridefinisce il subset necessario, la spec serve solo per dubbi di semantica
- `CLAUDE.md` nella root del repo
- Sessioni di riferimento nel KB: `claude/sessione_2026-07-17.md` (decisione B, compile-to-render-plan)

Fuori scope esplicito (fasi successive, non anticipare nulla): editing/interaction plan, edge view, graphVertex e collasso, migration delle view classic, benchmark, regola di risoluzione dentro `getAppliedViewsNew`, rimozione di qualunque codice classic.
