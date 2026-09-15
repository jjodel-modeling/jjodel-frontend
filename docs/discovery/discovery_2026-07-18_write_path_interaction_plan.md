# Discovery — Write path dei widget e interaction plan IR (Fase 3)

**Data**: 2026-07-18
**Tipo**: micro-discovery read-only (integrazione 3 mancante del report classic deprecation) + base dell'interaction plan.
**Repo**: jjodel-frontend, branch `cloud/ir-editorv2`
**Esecuzione**: sessione Cowork cloud autonoma.

## Obiettivo

Colmare l'integrazione mancante del report `discovery_2026-07-17_classic_editor_deprecation_viewpoint_v2.md`: la mappa gesti→azioni e il write path canonico su cui l'editing IR si aggancia. Nota di scoping: il write path dei widget CLASSIC (Input/Edit/Select di graphElement) non è stato tracciato nel dettaglio, perché la decisione B lo rende irrilevante — l'editing IR passa dal write path di EditorV2, che è quello tracciato qui. Se in Fase 4/5 emergesse un comportamento classic da replicare, riaprire questa discovery.

## File letti/analizzati

- `frontend/src/components/editor-v2/sync/canvasToJjom.ts` (:486 syncNodeLabel, :1252 syncCreateObject, :1353 syncUpdateFeatureValue, :1388 syncCreateCompositionLink, :1459 syncCreateReferenceLink)
- `frontend/src/components/editor-v2/EditorV2.tsx` (:1650-1700 onDrop palette M1, :3475 PalettePanel props, onConnect/onConnectEnd)
- `frontend/src/components/editor-v2/panels/PalettePanel.tsx` (:61-77 modalità model, drag payload metaclassId)
- `frontend/src/components/editor-v2/nodes/ObjectNode.tsx` (commit path: syncNodeLabel, syncUpdateFeatureValue)
- `frontend/src/components/editor-v2/hooks/useEditorMode.ts` (:40 rootableClasses)

## Findings — mappa gesti→azioni (write path canonico EditorV2)

| Gesto | Azione canonica | Note |
| --- | --- | --- |
| Edit nome istanza | `syncNodeLabel(vertexId, name)` | TRANSACTION interna; identity slot via set_name |
| Edit valore attributo | `syncUpdateFeatureValue(vertexId, featureName, value)` | proxy L `$feat.value =` dentro TRANSACTION |
| Drop dalla palette | `syncCreateObject(...)` da onDrop (payload `metaclassId`); solo classi rootable | RF node creato direttamente + markCanvasUpdated |
| Connect (drag tra handle) | onConnect → popup tipo edge → `syncCreateReferenceLink` / `syncCreateCompositionLink` | guardie hasCanvasEdgePair a valle |
| Drop dentro contenitore | `syncCreateCompositionLink(parentVertexId, childVertexId, refName)` | createCompositionChild (EditorV2:2264) |

Tutte le scritture passano per canvasToJjom (critical zone §3.1): l'editing IR NON introduce write path nuovi, chiama queste API dal layer componenti (stesso pattern di ObjectNode nativo). Nessuna modifica a file critical zone.

## Implementato in questa fase

1. **Edit in place nelle view IR** (`IRNodeContent.tsx`): value segment dei compartment (double-click → input → commit via `syncUpdateFeatureValue`); label intrinsic name/qualifiedName (double-click → commit via `syncNodeLabel`). Default di parità col nodo nativo: editabile salvo `editable: false` nell'IR (spec v1.2 sez. 5).
2. **Interaction plan derivato** (`irInteraction.ts`, puro + testato): palette = metaclassi con view dichiarate (wildcard → nessuna restrizione); connect rules dalle view object-as-edge (feature source/target); drop containers dalle view graphVertex.
3. **Wiring palette** (`EditorV2.tsx`): `useIRInteractionPlan()` filtra le rootableClasses passate a PalettePanel quando il viewpoint attivo è IR.

## Non implementato (TODO, con rationale)

- **Connect gesture → creazione object-as-edge**: il popup di onConnectEnd oggi crea reference link; creare una Transition (oggetto + 2 slot) dal gesto richiede un ramo nuovo nel popup e la sequenza syncCreateObject + 2 syncUpdateFeatureValue con i timing D→L (CLAUDE.md §9.2). Fattibile senza toccare critical zone, rimandato per contenere il rischio della sessione autonoma. Le connectRules del plan sono già derivate e testate.
- **Containment drop gating**: il filtro dei drop target sui dropContainers del plan tocca la logica onNodeDrag di EditorV2 (densa); rimandato con lo stesso rationale.
- **Widget select/checkbox/color** per `editable.widget`: solo text nella v1 dell'edit in place (enum hanno già InlineEnumSelect sul nodo nativo).

## Rischi

- L'edit in place IR usa gli stessi sync di ObjectNode: nessun rischio nuovo di layer. Il rischio residuo è UX (input dentro shape ellipse), da verifica visiva.

## Domande aperte per Alfonso

- Il gesto connect deve creare direttamente l'object-as-edge quando la connect rule è unica, o sempre mostrare il popup di scelta?
