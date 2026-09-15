# Discovery — Delete di istanze M1 lascia reference entranti pendenti (dangling)

**Data**: 2026-07-16 · **Tipo**: RCA read-only (Fase 1, two-phase) · **Nessuna modifica al codice.**
**Sintomo**: batteria di validazione riga #5 — cancellando dal canvas v2 le istanze TARGET di `C1_1.newAssociation`, le istanze spariscono ma i valori della reference restano; CHECK 6 segnala correttamente 2× `dangling_reference` ("points to non-existent object Pointer…"). Il validatore ha fatto il suo dovere: il bug è nel path di DELETE.

---

## 1. Censimento dei path di cancellazione di un'istanza M1 (DObject)

| # | Path | Entry point (file:line) | Sink | Cascade canonico? |
|---|------|------------------------|------|-------------------|
| a | **Canvas v2** | Del/Backspace `EditorV2.tsx:2134` · ctx-menu singolo "Delete" `:2534→:2537` (`deleteNode` `:1920`) · ctx-menu multi `:2346` e toolbar `:3473` (`deleteSelected` `:1865`) | tutti → `syncDeleteVertex` (`canvasToJjom.ts:264`) → ramo non-DClass `:318-322` → **`DeleteElementAction.new(dObject)` RAW** | ❌ **NO — path del sintomo** |
| b | **TreeView** | `TreeViewSidebar/TreeViewContent.tsx` — le istanze M1 sono leaf row (`FeatureRow` `:670-705`) | solo selezione (`_lastSelected` + evento `SELECT_NODE`); **nessuna affordance di delete** (gli unici `delete()` del file sono su viste, `:1177/:1558/:1569`). Idem `PropertiesWithTreeView.tsx` | N/A — il path non esiste |
| c | **JjScript** | `jjscript/executor/commands/instance.ts:332` (`executeDeleteInstance`) | `:373` → **`DeleteElementAction.new(lObject.__raw)` RAW** dentro `TRANSACTION('JjScript: Delete instance')` | ❌ NO — conferma il follow-up noto (2026-07-10 §follow-up, log 2026-07-11) |
| d | **Classic editor** (censito per confronto) | `graph/graphElement/graphElement.tsx:895-916` (Del / Shift+R) | `:914` → **`this.props.data.delete()`** | ✅ SÌ — unico path corretto; è la reference implementation |

Nota su (d): il classic wrappa `.delete()` in una `TRANSACTION` esterna (`:905`) mentre `.delete()` apre già la propria (`Dummy.ts:263-269`) — nesting pre-esistente e committed, non parte di questo bug; il precedente in `canvasToJjom.ts:303-305` documenta esplicitamente il no-outer-wrapper come idioma corretto.

## 2. Il cascade canonico è intatto e capace di gestire esattamente questo caso

`Dummy.get_delete` (`common/Dummy.ts:50-270`), in ordine:

1. **children** (`:84-87`): per un DObject cancella le sue DValue features; per una DValue conforme a reference **containment** cancella anche il target contenuto (commento `:86`).
2. **father collection safety net** (`:104-116`): DObject → `SetFieldAction 'objects' '-='` sul father (idempotente col punto 3).
3. **pointedBy dependencies** (`get__jjdependencies`, `joiner/classes.ts:2081` — itera `data.pointedBy`): **`case 'values'` (`:183`) → `SetFieldAction '-='` (`:205`) sulla DValue puntante** ← è esattamente la pulizia delle reference entranti mancata nel sintomo.
4. **nodes** (`:254`): ogni DVertex dell'elemento **in tutti i grafi** → `node.delete()`.
5. `DeleteElementAction.new(id)` finale (`:260`), il tutto nella TRANSACTION propria (`:263-269`).

Override `LObject.get_delete` (`LModelElement.tsx:6343-6352`): guardia singleton (`Log.ww` + return) poi `super`.

**pointedBy È popolato per i valori di reference M1** (quindi il punto 3 avrebbe funzionato): i link creati dal canvas v2 passano da `syncCreateReferenceLink`/`syncCreateCompositionLink` (`canvasToJjom.ts:1465-1471` / `:1394-1403`) → `refProxy.values = [...]` → `LValue.set_values` → `SetFieldAction 'values'` (`LModelElement.tsx:7596`); il reducer mantiene i pointedBy **incondizionatamente** (`reducer.ts:395` `if (true || action.isPointer)`, diff added/removed `:411-414`). Per i containment c'è anche la scrittura esplicita `:7610`.

## 3. Root cause

`syncDeleteVertex` (`canvasToJjom.ts:300-323`): il fix precedente (orphan-DReference) ha instradato **solo DClass** sul cascade canonico (`:308-309`); il commento dice esplicitamente "Non-class types stay on the raw path unchanged" → un **DObject** cade nel ramo else `:318-322`: `TRANSACTION` + `DeleteElementAction.new(modelElement.__raw)`.

`DeleteElementAction` (`redux/action/action.ts:760-770`) è un puro `SetFieldAction(ptr, '', undefined)`: il reducer (`reducer.ts:374-418`) elimina l'entry da idlookup e aggiorna i pointedBy **dei target dei campi puntatore top-level dell'oggetto cancellato** (father, instanceof — dichiaratamente niente deep-scan, commento `:384-385`). **Non visita mai il `pointedBy` dell'elemento cancellato per riscrivere le DValue che lo puntano.** Nessun'altra passata lo fa.

### Riproduzione statica del sintomo (riga #5)

1. `C1_1.newAssociation = [T1, T2]` scritto via `canvasToJjom.ts:1465-1471` → reducer aggiunge a `T1`/`T2` un pointedBy con source `idlookup.<dvalue-di-C1_1>.values…`.
2. Selezione dei target sul canvas + Del → `deleteSelected` (`EditorV2.tsx:1865`) → node non-classNode → `syncDeleteVertex(vertexId)`.
3. `syncDeleteVertex` cancella (raw) gli edge connessi **del solo grafo corrente** (`:272-298`), poi `modelElement.className === 'DObject'` ≠ 'DClass' → ramo raw `:318-322`.
4. Reducer: via l'entry idlookup di T1/T2; i loro pointedBy muoiono con loro senza essere consultati.
5. La DValue di `C1_1` conserva i due pointer morti → CHECK 6: 2× `dangling_reference`. ✔ combacia con lo screenshot.

## 4. Perimetro del danno (ogni delete raw di DObject: canvas v2 **e** JjScript)

1. **Reference M1→M1 entranti** (il sintomo): pointer dangling nelle DValue di altre istanze — persistiti nel progetto.
2. **`model.objects`**: l'id morto resta nell'array; `get_objects` (`LModelElement.tsx:5404-5408`) mappa i pointer **senza filtro null** → ogni consumer riceve buchi null (il validatore li salta con `if (!obj) continue`; altri consumer da censire).
3. **DValue features dell'istanza cancellata**: mai cancellate (children saltato) → orfane in idlookup con `father` → id morto. Pollution persistita.
4. **Containment**: se la reference era containment, il target contenuto NON viene cancellato (il cascade l'avrebbe fatto via children della DValue) → resta nel modello sganciato dal container.
5. **DVertex dell'istanza in tutti i grafi**: mai cancellati (`nodes` saltato); invisibili solo perché `jjomVertexToRFNode` ritorna null su model irrisolvibile (`jjomTransformers.ts:345-348`) — ma persistiti.
6. **Edge di viewpoint in altri grafi**: `syncDeleteVertex` pulisce solo il grafo corrente → edge con endpoint morti persistiti altrove.
7. **OrphanStore**: NON coinvolto — cattura solo su delete di DAttribute (`useOrphanFeatures.ts:74-86`).
8. pointedBy stale sui target delle reference **uscenti** dell'istanza (source → DValue ormai orfana). Minore.

KB già in atti e coerente: il follow-up 2026-07-10/11 su `executeDeleteInstance` raw (questo report lo conferma con file:line); **C.3 non c'entra** — lì si cancella una CLASSE e l'orphaning delle istanze è by design (`Dummy.ts:211-216`); qui si cancellano ISTANZE e a pendere sono le reference di altre istanze.

## 5. Fix path raccomandato (NON implementato — Fase 2 dopo go-ahead)

Instradare anche DObject sul cascade canonico, riusando l'idioma del fix DClass:

- **`canvasToJjom.ts` `syncDeleteVertex`**: ramo canonico anche per `className === 'DObject'` → `modelElement.delete()` (niente TRANSACTION esterna — `.delete()` ha la propria; commento `:303-305`). Valutare il deferred sweep del ramo DClass (`:317`) per gli edge cross-graph, perché nel cascade `case 'start'/'end'` è no-op (`Dummy.ts:142-144`).
- **`instance.ts` `executeDeleteInstance`**: `lObject.delete()` al posto della raw action; rimuovere il wrapper TRANSACTION esterno (stesso principio).
- **`Dummy.ts` / `LModelElement.tsx` (zona delete)**: NESSUNA modifica prevista — la macchina è intatta; il fix è routing dei call-site.

**⚠ Critical zone**: `canvasToJjom.ts` è in §3.1 → la Fase 2 richiede **Layer Impact Report** e go-ahead esplicito. La zona cascade (`Dummy.ts`, `LModelElement.tsx`) in questa analisi è stata solo letta.

## 6. Domande aperte

1. **Edge cross-graph post-cascade**: `case 'start'/'end'` no-op + pulizia edge limitata al grafo corrente → serve un sweep differito (riuso di `sweepAllM1ReferenceGraphs`?) anche per il ramo DObject? Da verificare su progetto multi-grafo.
2. **Singleton**: oggi il path raw cancella anche istanze singleton; il canonico rifiuta (`LModelElement.tsx:6346-6349`). Post-fix il canvas v2 rifiuterà: comportamento voluto (by design) ma cambio visibile — confermare.
3. **Undo**: il cascade emette molte azioni nella sua TRANSACTION; verificare che l'undo del delete resti atomico sul canvas v2 (il classic già convive col cascade).
4. **Dati già inquinati**: i dangling nei progetti salvati (incluso quello della batteria #5) restano anche dopo il fix — sono dati, non codice. Pulizia one-off (VersionFixer? comando sanity?) o si lasciano al validatore?
5. **Ramo non-JjOM** di `deleteNode`/`deleteSelected` (`EditorV2.tsx:1904-1916`): solo RF locale, nessun modello coinvolto → fuori scope.
6. **Consumer di `model.objects` senza null-guard** (blast radius #2): censimento da fare in Fase 2 o separatamente.
