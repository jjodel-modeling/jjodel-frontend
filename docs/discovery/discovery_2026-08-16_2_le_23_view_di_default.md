# Discovery 2026-08-16 (2) — Le 23 view di default: a cosa servono e chi le usa

**Fase**: 1 (read-only). Nessun file di codice toccato.
**Domanda di partenza (Alfonso)**: «a cosa servono e chi usa le 23 view di default?»
**Albero analizzato**: working tree locale, branch `alfonso-frontend-jjtl`, HEAD `d68c4bbc8`.
**Continuità**: seguito di `discovery_2026-08-16_viewpoint_default_e_validation.md`. Lì il soggetto erano i due viewpoint, qui il loro contenuto.
**Ambiente**: VM del bridge, `type grep` = `/usr/bin/grep` (GNU). Asserzioni di assenza con controllo positivo (R-RAIL-28).

---

## 1. Che cosa sono, e da dove nascono

`Defaults.views` (`common/Defaults.ts:5-30`) elenca 23 puntatori. La ripartizione per sito di creazione coincide con quella del censimento del 2026-08-13 (14 + 4 + 5):

| Sito | Quante | Quali |
|------|--------|-------|
| `redux/defaults/views.ts` | 14 | Model, Package, Class, Enum, Attribute, Reference, Operation, Parameter, Literal, Object, Singleton, Value, EdgePoint, Anchors |
| `redux/store.tsx` | 4 | Fallback, più le tre di validazione (Generic error view, Naming error view, Lowerbound error view) |
| `DV.edgeView` in `makeDefaultGraphViews` | 5 | Association, Dependency, Inheritance, Aggregation, Composition |

Per viewpoint: **20 nel viewpoint `Default`** (le 14, più `Fallback`, più le 5 edge) e **3 nel viewpoint `Default Validation`**.

A cosa servivano: sono la **libreria di notazione del renderer classico**. Una view per tipo di elemento del metamodello, con `jsxString`, `css` e `usageDeclarations`, più le cinque relazioni UML, più il segnaposto `Fallback` per ciò che non trovava altro. Erano la risposta alla domanda «come si disegna un `DClass` se l'utente non ha autorato niente».

Una sesta edge view viene creata con nome vuoto (`makeEdgeView("", ...)`) e non ha un puntatore in `Defaults.views`: non è una delle 23.

## 2. Chi le rende oggi: nessuno

Tre catene, tutte chiuse.

**a. Non entrano nell'indice IR.** `getIRIndex` (`components/editor-v2/viewpoint/ir/irResolveCore.ts:117-137`) itera `state.viewelements`, scarta ciò che non appartiene al viewpoint attivo, e poi scarta esplicitamente ciò che non ha `ir`: `if (!ir || typeof ir !== 'object') continue;`. Le 23 default nascono senza `ir` **per progetto e non per rinvio** (R-IRN-1). Quindi non sono mai candidate alla risoluzione di EditorV2.

**b. Il fallback che gira non è `Fallback`.** `Pointer_ViewFallback` non ha consumatori: le uniche 4 occorrenze in `frontend/src` (esclusi `examples/`) sono la voce in `Defaults.views`, la costante statica, e le due righe che la creano in `store.tsx:461,477`. Quando `ObjectNode` non risolve una view IR (`irResolution === null`) rende il proprio ramo nativo, il `div.mm-node.mm-object` di `ObjectNode.tsx:448` e seguenti. Il segnaposto è cablato nel componente, non letto dalla view.

**c. La cascata di punteggi è codice del classico.** `viewScores` → `mainViews` / `stackViews` è calcolata in `joiner/classes.ts:4033-4052` a partire dai punteggi di `redux/selectors/selectors.ts` (dove vive il gradino `VP_Default`, riga 557). I consumatori di `stackViews` sono `model/dataStructure/GraphDataElements.tsx:909`, `view/viewElement/view.tsx:594` e `selectors.ts:620`; l'unico consumatore di `viewScores` fuori da quel giro è `components/editors/Console.tsx:813`. **`components/editor-v2/` non contiene nessuna occorrenza né di `stackViews`, né di `viewScores`, né di `Pointer_View`** (grep exit 1 su tutte e tre; controllo positivo sulla stessa cartella e con lo stesso comando: `useJjomSync` compare in 12 file). L'unica menzione di `GraphDataElements` dentro `editor-v2` è un commento (`useJjomSync.ts:961`).

Coerente con lo spegnimento del classico (Fase 5a, decisione B del 2026-07-17) e con `TemplateData.tsx:57`: una view senza `ir` «has no interpreter left».

## 3. Che cosa le tocca ancora davvero

Non il rendering. La contabilità:

1. **Bootstrap dei registri**: `redux/reducer/reducer.ts:1104-1112` popola `Defaults.defaultViewsMap` e `defaultViewPointsMap` scorrendo `idlookup`, condizionato sull'esistenza di `Pointer_ViewPointDefault` come oggetto.
2. **Reiniezione al caricamento**: `redux/VersionFixer.tsx:149-151` rimette in `idlookup` ogni default mancante.
3. **Rigenerazione al caricamento**: `view/viewElement/view.tsx:1861` (`updateDefaultView`) sostituisce la versione salvata con quella corrente, preservando `ir` e deliberatamente non preservando `irLegacyClassic`.
4. **Gate di sola lettura**: `Defaults.check(id)` decide `readOnly` in circa dodici superfici di editing (`languages/Js.tsx`, `Jsx.tsx`, `Ocl.tsx`, `Javascript.tsx`, `forEndUser/Input.tsx`, `Color.tsx`, `Selector.tsx`, `MySelect.tsx`, `CountryPicker.tsx`, `MTM.tsx`, `views/ViewData.tsx:52`, `views/NestedView.tsx:396`) e, a `view.tsx:543`, rende le default **non cancellabili e non degradabili a decorazione**.
5. **Classificazione nella migration**: la migrazione inversa `2.225 -> 2.226` (`VersionFixer.tsx:1009`) le riconosce come default generate dal tool attraverso i marker di `utils/defaultViewTemplate.ts`, e le tiene fuori dal marchio `irLegacyClassic`. È il motivo per cui quei marker esistono.

Da cui la sola funzione viva e visibile all'utente: **sono il contenuto del viewpoint `Default` nell'albero delle view, in sola lettura**. Si vedono, si aprono, non si modificano, non disegnano niente.

## 4. Conseguenze

- Le 23 default non sono un rischio di regressione visiva: toccarle non cambia un pixel, perché nessun pixel passa da loro. Il rischio, se mai, è di contabilità (idlookup, persistenza, gate di sola lettura).
- La «assenza di notazione» oggi è rappresentata due volte: dalle 23 view senza `ir`, che è la rappresentazione dichiarata da R-IRN-1, e dal ramo nativo di `ObjectNode`, che è quella che si vede. Solo la seconda è raggiungibile.
- Il gradino `VP_Default` della cascata (`selectors.ts:557`), citato nella discovery precedente come portante, è portante **rispetto al codice classico**. Va ridimensionata l'affermazione: non tiene in piedi il canvas attuale, tiene in piedi una cascata che oggi non ha consumatori vivi a schermo.

## 5. Domande aperte per Alfonso

1. **Vale la pena tenere 20 view inerti nel viewpoint `Default`?** Sono l'unica cosa che si vede aprendo quel viewpoint. Le alternative sono tre: lasciarle come archeologia leggibile, ridurle a un insieme minimo, oppure sostituirle con view IR vere (una notazione di default autorata, che renderebbe `Default` un viewpoint come gli altri invece che un residuo).
2. **La cascata `viewScores`/`stackViews` va ritirata?** È una superficie ampia (`selectors.ts`, `classes.ts`, `GraphDataElements.tsx`, `view.tsx`, `Console.tsx`) senza consumatori a schermo. Fronte separato e grosso, non da aprire dentro questa fetta.
3. **`Console.tsx` è vivo?** È l'unico consumatore di `viewScores` fuori dal giro classico. Se è morto anche lui, il punto 2 si semplifica molto.

## 6. Stato

Fase 1 chiusa con questo report. Nessuna implementazione: la domanda era conoscitiva e non apre di per sé una fetta.
