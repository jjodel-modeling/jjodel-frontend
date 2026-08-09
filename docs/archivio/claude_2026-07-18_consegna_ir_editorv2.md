# Consegna — Branch `cloud/ir-editorv2`: IR come contratto di EditorV2, Fasi 0-5a

**Data**: 2026-07-18
**Sessione**: Cowork cloud autonoma (mandato: "concludi il lavoro senza il mio intervento, poi test insieme")
**Base**: `alfonso-frontend-jjtl` @ `b7d6e82ef` ("commit tutto", ultimo push sul remoto)
**Consegna**: bundle git `cloud-ir-editorv2.bundle` (12 commit sopra la base)

## Nota preliminare importante

I commit dello spike Fase 1 che avevi eseguito localmente NON sono sul remoto: questo branch re-implementa lo spike dal prompt salvato nel KB e ci costruisce sopra. Al merge, i tuoi commit locali dello spike vanno scartati (il branch li sostituisce con un superset). Se il tuo working tree ha altre modifiche non pushate oltre lo spike, verifica i conflitti prima.

## Come applicare

```bash
git fetch /percorso/cloud-ir-editorv2.bundle cloud/ir-editorv2:cloud/ir-editorv2
git checkout cloud/ir-editorv2
cd frontend && npm run build   # verde; typecheck 14 errori = baseline invariata
npx vitest run                  # 846/846 (9 suite failure = known failures pre-esistenti)
```

## Cosa contiene (per commit)

| Commit | Fase | Contenuto |
| --- | --- | --- |
| `3348c4593` + `4b7b2a561` | 1 (spike) | Campo `ir` su DViewElement + modulo interprete `editor-v2/viewpoint/ir/` (compile-to-closures, resolver IR-nativo indicizzato, ReadCtx doppio backend, CSS per view, fixture `window.__jjodelInstallIRDemo(metaclass, boolAttr)`) + innesto in ObjectNode |
| `dc1c9dd51` | spec | Spec IR v1.2 (`docs/specs/`): retarget a interprete, risoluzione normativa, editabilità, interaction, edge, collasso, dependency set, fallback, migrazione, wildcard `'*'` |
| `c4b3b7c03` | 2a | Default view IR (wildcard, label intrinsic `qualifiedName`), regola di specificità exact>inherited>wildcard, 13 unit test |
| `83b89147f` | 0 | Harness benchmark riproducibile (Playwright su build prod) + modello sintetico 500/1000 + risultati baseline in `docs/benchmarks/` |
| `c64531fae` | 2b | graphVertex: containment-by-hull (layer ViewportPortal), collasso con lift-to-ancestor, decorazione pura nodi/edge, 5 test |
| `b8eeedb27` | 2c | Edge view: styling reference-as-edge (stroke/marker/label) + sintesi object-as-edge (pattern Transition, fallback esplicito), 3 test |
| `876339c72` | 3 | Edit in place nelle view IR (path canonico canvasToJjom), interaction plan derivato (palette/connect/drop), filtro palette in EditorV2, micro-discovery write path in `docs/discovery/` |
| `637a5e238` | 4 | Migration inversa VersionFixer `2.225 -> 2.226` + carry-over di `ir`/`irLegacyClassic` in `updateDefaultView` |
| `197b6c3d0` | 5a | Spegnimento classic: EditorSwitch flow-only, mount classic rimossi da ModelTab/MetamodelTab, toggle rimosso dalla Toolbar, delete di EdgeOverlay(.tsx+.scss)/graphContainer/SubViewComponent/vertex-index/WorkbenchCanvas, barrel potato |

## LAYER IMPACT REPORT (VersionFixer 2.225 → 2.226 + view.tsx carry-over)

Da leggere PRIMA del merge: tocca due file critical-zone (`redux/VersionFixer.tsx`, e `view/viewElement/view.tsx` fuori zona ma core).

**Layers touched**: Persistence (VersionFixer / migrazione), D-layer (campi opzionali `ir`, `irLegacyClassic` su DViewElement).

**What changes**: al load di progetti con versione < 2.226, le view default classic M1 marker-matched (`CLASSIC_OBJECT_VIEW_MARKER`, `CLASSIC_SINGLETON_VIEW_MARKER`) ricevono `ir = defaultObjectViewIR()` con `migratedFrom: 'classic-default'`; le CLASSIC_VALUE e le jsxString custom non riconosciute ricevono `irLegacyClassic = true`. `updateDefaultView` preserva i due campi quando rigenera le default view al bump (senza questo carry-over la stessa load che applica la migration la cancellerebbe).

**What does NOT change**: nessun `jsxString` riscritto (resta come fallback/documentazione); nessun campo esistente modificato; progetti già a 2.226 o con `ir` presente = no-op (idempotente); il flusso load/save (SaveManager → VersionFixer.update → LoadAction) è invariato.

**Cross-layer interaction**: il campo `ir` viaggia con la serializzazione generica (spec sez. 8); l'interprete EditorV2 lo legge via `state.viewelements`; il classic (spento) non lo legge mai.

**Side-effect safety**: la mutazione avviene in place sui record di `s.idlookup` durante update(), stesso pattern delle migration 2.222→2.223; nessuna TRANSACTION coinvolta.

**Smoke-test scenarios**:
- progetto NUOVO → nessuna migration, default view senza `ir` (rendering nativo EditorV2) ✓ (coperto dallo smoke Playwright)
- progetto salvato pre-2.226 con default classic → al load le view portano `ir` e gli oggetti M1 si rendono via interprete ⚠️ DA VERIFICARE A MANO (serve un progetto salvato reale; gli 11 blob demo in `src/examples/` sono il corpus)
- save → reopen → `ir` persiste e non viene wipata dal bump ⚠️ DA VERIFICARE A MANO

## Verifica automatica eseguita

- `npm run build` verde a ogni commit; `npx tsc --noEmit` = 14 errori, identico alla baseline del branch (0 nei file toccati).
- 23 unit test nuovi sul modulo IR (compile, resolver+ordering, containment, edge views, interaction, defaults): tutti verdi; suite completa 846/846 (9 suite con failure di import identiche al commit base = known failures).
- Smoke Playwright sulla build di produzione: offline mode → progetto → import ecore+xmi → modello aperto in flow (13 nodi, 23 edge) → **mode toggle assente, zero GraphContainer classic** → viewpoint Default attivo senza regressioni → fixture IR installata e attivata: **12 nodi renderizzati dall'interprete, 6 badge condizionali `done`, view base vs flag distinte**, tag `#ir-views-css` presente, nessun errore console nuovo.

## Checklist di test manuale (per la nostra sessione insieme)

1. **Regressione zero su non-IR**: apri un progetto esistente, modello in flow: rendering, drag, resize, edit inline, edge identici a prima. Il toggle classic/split non c'è più (atteso).
2. **Spike criteri 1-5** (dal prompt Fase 1): `window.__jjodelInstallIRDemo()` su un modello StateMachine, attiva "IR Demo State": rounded+label+badge play su isInitial; cambia `isInitial` → il badge segue; torna a Default → rendering identico a prima; drag/resize/selezione/edge invariati; console pulita.
3. **Containment (2b)**: fixture con graphVertex (view `kind: 'graphVertex'` su una metaclasse contenitore): hull attorno ai figli, chevron di collasso, collasso → figli nascosti, edge risalgono al contenitore (lift), riespansione integra.
4. **Edge view (2c)**: view `kind: 'edge'` object-as-edge su Transition: il nodo sparisce, appare l'edge sintetico con label dal nome; con endpoint rotto il nodo resta visibile (fallback esplicito).
5. **Edit in place (3)**: nelle view IR, double-click su valore attributo e sul nome: commit su Invio, Escape annulla, il modello si aggiorna (Properties panel coerente).
6. **Migration (4)**: apri un progetto salvato con view classic (pre-2.226): console mostra `[VersionFixer 2.225 -> 2.226] ...`; gli oggetti si rendono via IR default; salva e riapri: stabile.
7. **Palette IR (3)**: con viewpoint IR attivo la palette M1 mostra solo le metaclassi con view dichiarate. NOTA UX: se il viewpoint dichiara view solo per metaclassi non-rootable, la palette risulta vuota ("No rootable classes found") — visto nello smoke, da decidere se è il comportamento voluto.

## Limiti noti e decisioni prese in autonomia (da ratificare)

1. **Containment-by-hull, non reparenting RF**: i figli restano nodi top-level a coordinate assolute; il contenitore è un hull visivo. Il reparenting vero (parentId + coordinate relative) cambia la semantica del write-back canvas→JjOM (canvasToJjom, critical zone) e richiede LIR+go-ahead dedicati. Clipping/routing al bordo dissolti da questa scelta.
2. **Fase 5 finale (delete graph/) NON eseguita**: il classic è spento (irraggiungibile dalla UI) ma i file restano. La consumer map raccolta mostra che `Vertex/Shapes/GraphElement/damedge` sono importati da `GraphDataElements.tsx` (model layer), `redux/store.tsx` (Defaults), `LModelElement.tsx`, `common/UX.tsx`, `DSL.ts`, editors/views/data: serve il de-entanglement (b) del piano con discovery dedicata. `sharedTypes.tsx` (contextFixedKeys) e `GraphDragHandler.ts` restano deps del reducer.
3. **Terminazioni edge approssimate**: React Flow non ha marker triangolo/rombo nativi; hollowTriangle/diamond → frecce (documentato nel modulo). Marker SVG custom = follow-up.
4. **Reattività cross-oggetto**: i PathExpr multi-hop leggono eager ma non invalidano sul target navigato (limite dichiarato, spec v1.2 sez. 9); gli edge sintetici si aggiornano via il signature del hook (nodes/edges cambiano), i predicati vertex solo su feature di self.
5. **Connect gesture per object-as-edge e gating dei drop**: derivati nel plan (`irInteraction.ts`, testato) ma non cablati nel popup di connessione né nel drag-drop (rationale nel discovery report 2026-07-18).
6. **Benchmark**: numeri assoluti da container condiviso (varianza documentata); il confronto valido è same-machine con lo stesso harness (`docs/benchmarks/README.md`). Il comparativo IR (Fase 4 seconda metà) va rifatto sul tuo M3 dopo il merge: `node scripts/benchmarks/bench_baseline.mjs`.
7. **Fixture demo importata side-effect da ObjectNode** (dev-only): da spostare dietro flag di build in hardening.
8. **Viewpoint misti IR/classic**: gli elementi con view IR rendono via interprete, il resto via rendering astratto; comportamento transitorio documentato in spec (sez. 2).

## Prossimi passi suggeriti

1. Test manuali insieme (checklist sopra) → ratifica delle decisioni 1-2.
2. Merge su `alfonso-frontend-jjtl` (scartando i commit spike locali).
3. Benchmark comparativo su M3 (baseline harness + viewpoint IR attivo).
4. Discovery de-entanglement (b) → delete finale di graph/ (strato (d)).
5. Workstream authoring IR (editor strutturati al posto di TemplateEditor).
