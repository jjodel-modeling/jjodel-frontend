# Discovery — Fase A spike interprete IR (verifica cuciture puntuali)

**Data**: 2026-07-17
**Tipo**: verifica mirata read-only, preliminare alla Fase B dello spike interprete IR.
**Repo**: jjodel-frontend, branch `cloud/ir-editorv2` (da `alfonso-frontend-jjtl`)
**Esecuzione**: sessione Cowork cloud autonoma (non Claude Code VS Code). Nota: i commit dello spike eseguito localmente da Alfonso NON risultano sul remoto; questo branch re-implementa lo spike dal prompt `2026-07-17_prompt_fase1_spike_ir_interpreter_vertex.md` del KB.

## Obiettivo

Verificare le 4 assunzioni del prompt spike prima dell'implementazione. Nessuna delle due condizioni di hard stop (modifiche a file vietati; risoluzione nome metaclasse non fattibile senza core) si è verificata.

## File letti/analizzati

- `frontend/src/components/editor-v2/nodes/ObjectNode.tsx` (intero)
- `frontend/src/components/editor-v2/utils/jjomTransformers.ts` (:140-360, objectVertexToRFNode)
- `frontend/src/view/viewElement/view.tsx` (:164-505, DViewElement/LViewElement)
- `frontend/src/view/viewPoint/viewpoint.ts` (intero)
- `frontend/src/redux/store.tsx` (:91-200, DState)
- `frontend/src/model/logicWrapper/LModelElement.tsx` (:2617-2680 DClass, :5716-5745 DObject)
- `frontend/src/utils/lastViewpoint.ts` (:100-200, createViewInWorkbench)
- `frontend/src/examples/StateMachine/views/index.ts` (:10-60, pattern fixture con id idempotenti)
- `frontend/src/components/editor-v2/sync/canvasToJjom.ts` (:13-33, import pattern `store` dal barrel joiner)

## Findings

1. **Risalita ObjectNode → DObject → metaclasse**. L'RF node id È il vertex id. `state.idlookup[vertexId].model` (raw) è il pointer al DObject; `dObject.instanceof` è il pointer alla DClass; `data.instanceOfClassId` è già nel node data (popolato dal transformer, `jjomTransformers.ts:243-254`). Test instanceof per nome: `DClass.extends: Pointer<DClass>[]` (LModelElement.tsx:2648) permette la walk transitiva via idlookup; la risoluzione nome→pointer non serve (l'indice IR è keyed per NOME e la walk produce nomi).
2. **Forma valori feature**. D-layer: `DObject.features: Pointer<DValue>[]`; `DValue.values: any[]` (slot raw); `DValue.instanceof` → DAttribute/DReference con `.name`. Proxy L: `lObj['$'+featureName].value` (coerce/tronca a upperBound) — differenza semantica documentata nel ReadCtx (famiglia "il proxy mente ai check"), rilevante per il benchmark. Il bypass `__raw` di `jjomTransformers.ts:150-154` conferma la disciplina del backend D-diretto.
3. **Aggancio senza scan O(model)**. ObjectNode ha già 3 useSelector per nodo (liveMetaclassInfo, liveFeatureNameSig, metaclassAttrSig), tutti O(#feature). Il hook `useIRView` aggiunge UN selector che produce una firma compatta: signature IR del viewpoint attivo (iterazione della sola lista `state.viewelements`, WeakMap ref-token sugli oggetti ir per detect di edit) + snapshot dei values delle feature di self. LIMITE NOTO confermato: la reattività copre solo self; i PathExpr cross-oggetto leggono eager ma non invalidano (da risolvere in Fase 2b/2c, spec v1.2 dependency set).
4. **Viewpoint attivo e view IR**. `state.viewpoint: Pointer<DViewPoint>` (store.tsx:167); le view si enumerano da `state.viewelements` filtrando `d.viewpoint === state.viewpoint` e presenza campo `ir`. Nessun file vietato va toccato per leggerle.

## Rischi

- La coesistenza dei due resolver è garantita per costruzione (il resolver IR non chiama `getAppliedViewsNew` né tocca `transientProperties`), ma un viewpoint misto (view IR + view classic) renderà gli oggetti via IR e il resto via classic slot: comportamento accettato per lo spike, da regolare nella spec v1.2.
- `DViewElement.new2` con id esplicito è idempotente solo se si verifica prima l'esistenza in idlookup (il fixture lo fa).
- La verifica visiva di Alfonso (criteri 1-5 del prompt) NON è stata eseguita in questa sessione autonoma: sostituita da typecheck (14 errori = baseline invariata) e build verde. I criteri restano nella checklist di test finale della consegna.

## Domande aperte per Alfonso

- Nessuna bloccante per la Fase B. Il destino dei viewpoint misti IR/classic va deciso nella spec v1.2.
