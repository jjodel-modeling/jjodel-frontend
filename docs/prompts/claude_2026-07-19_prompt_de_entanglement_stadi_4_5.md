# Prompt Claude Code — De-entanglement classic: Stadio 4 (purge barrel) + Stadio 5 (delete del perimetro graph/)

**Data**: 2026-07-19
**Branch di lavoro**: `alfonso-frontend-jjtl`
**Tipo**: refactor in tre commit (due stadi + docs). È il salto grosso del piano: da qui i componenti classic non sono più registrati né presenti nel codebase. Fonte di verità: `docs/discovery/discovery_2026-07-19_de_entanglement_graph.md` (rileggerlo, in particolare "Censimento consumer", Stadi 4-5 e Rischi 1/3/6) + esiti Stadi 0-3 (commit `c79cd34c2`..`2d312654f`).
**QUANDO**: working tree PULITO, nessun altro task in corso. Comandi git dalla RADICE del repo. Se in coda ci sono commit non pushati va bene (decide Alfonso), ma segnalare nel report finale lo stato del push.

## Obiettivo

Stadio 4: svuotare il barrel joiner dalle voci classic, così `windoww` smette di registrare i componenti del classic editor. Stadio 5: cancellare il perimetro `frontend/src/graph/` e i satelliti orfani. NON si tocca lo Stadio 6 (`edges/routing/classic/`, DerivedReferenceEdge, campi DEdge): decisione separata già presa in chat (la libreria routing resta e verrà rinominata in un giro dedicato).

## COSA — Commit 1 (Stadio 4: purge del barrel)

1. `frontend/src/joiner/components.tsx`: rimuovere gli import dal perimetro classic (righe ~6-15), i re-export (~20-29) e le voci classic nei dizionari (~60-93). Il file RESTA (serve ai componenti vivi); si eliminano solo le voci classic: GraphElement(Component), Vertex, VoidVertex, GraphVertex, Field, EdgePoint, VertexComponent, le shape (sono 20, non 19: elenco esatto alle righe ~22-26), DefaultNode(Component), Edge, EdgeComponent.
2. `frontend/src/joiner/index.ts`: rimuovere le voci classic nel blocco di re-export ~305-328. NON toccare i re-export dei tipi da `common/sharedTypes` (righe ~101-102) né il re-export di GraphDragManager (~205): sono vivi.
3. NON toccare `frontend/src/joiner/ExecuteOnRead.ts`: il loop di copia su `windoww` è generico e resta per i componenti vivi; le voci classic decadono da sole col purge del barrel.
4. Verifica attesa dal report di discovery: `components/editors/Info.tsx` riga ~29 (Toggle) deve continuare a compilare; `ClassNode.tsx` ~423 non è alimentato dal barrel (verificato in discovery, ricontrollare con grep che non siano comparsi consumer nuovi).

Gate: `npm run typecheck` (baseline 33, nessun aumento) + `npm run build` verde + test IR 41/41. Commit:
`refactor: purge classic components from joiner barrel (de-entanglement stage 4)`
`git add` dei soli 2 file. Mai `git add .`.

## COSA — Commit 2 (Stadio 5: delete del perimetro)

1. `git rm -r frontend/src/graph/` (dopo gli Stadi 1-2 contiene solo: graphElement.tsx, Vertex.tsx, Shapes.tsx, damedge.tsx, DefaultNode.tsx, graphElement.scss e directory residue).
2. `git rm -r frontend/src/components/edgeOverlay/` (EdgeFallbackCard: unico consumer era graphElement.tsx, ora orfana).
3. `git rm frontend/src/components/editors/TemplatePreview.tsx` (decisione OQ6: delete; è non referenziato e ancorato a `windoww.Components`).
4. `frontend/src/common/UX.tsx`: rimuovere `injectProp` (unico chiamante era graphElement.tsx), l'import di `type AllPropss` (riga ~6) e ogni import residuo dal perimetro. NON toccare `parseAndInject` né il suo catch (usa già `jsxErrorView` dallo Stadio 3).
5. `frontend/src/debugtools/debug.tsx`: mettere in guardia gli accessi a `windoww.GraphElementComponent` (optional chaining o early-return con messaggio in console), diff minima, NESSUNA ristrutturazione del tool.
6. `frontend/src/common/graphComponentRegistry.ts` e `jsxErrorView.tsx` restano: i lettori esterni (classes.ts, GraphDataElements, reducer, UX) sono no-op sicuri con registry vuoto (verificare che l'optional chaining ci sia ancora).
7. Verifiche di completezza OBBLIGATORIE (output nel report finale):
   - `grep -rn "src/graph\|from '.*graph/\|from \".*graph/" frontend/src` → zero hit di import reali (commenti esclusi, valutare a vista);
   - `grep -rn "EdgeFallbackCard\|TemplatePreview\|injectProp\|AllPropss" frontend/src` → solo commenti o zero;
   - `grep -rn "GraphElementComponent" frontend/src` → solo `debugtools/debug.tsx` (guardato), commenti, e gli alias nei due moduli comuni se documentati come tali.
8. ATTENZIONE (Rischio 1 del report): i jsxString persistiti nei progetti salvati nominano Vertex/DefaultNode/Shapes. La compile nel reducer (VIEWS_RECOMPILE) deve restare INTATTA: traspila senza eseguire, quindi non va in errore. Non toccare il reducer in questo task.

Gate: `npm run typecheck` (33, nessun aumento) + `npm run build` verde + suite test completa (i test IR 41/41; nessun altro test importa dal perimetro, ma eseguire la suite intera per conferma). Commit:
`refactor: delete classic editor perimeter graph/ (de-entanglement stage 5)`
`git add`/`git rm` dei soli file elencati.

## COSA — Commit 3 (docs)

Entry in `docs/claude-code-log.md` per gli Stadi 4+5 e commit:
`docs: update claude-code-log (de-entanglement stages 4-5)`

## Vincoli

- NON toccare: `edges/routing/classic/` e i suoi test, `edges/derived/DerivedReferenceEdge.tsx`, `NodeEditor.tsx`, i campi di DEdge/DVoidEdge, `useJjomSync.ts`, `portDistribution.ts`, `canvasToJjom.ts`, il reducer (Stadio 6 / Fase 5 IR).
- Zero refactoring opportunistico. I riferimenti in COMMENTI ai componenti classic restano: sono innocui e documentano la storia.
- Se il typecheck rivela un consumer non censito del perimetro, hard stop e segnalazione in chat con l'elenco: niente rimozioni a cascata improvvisate.
- Ordine tassativo: gate del commit 1 verde prima di iniziare lo Stadio 5.
- NON pushare. Hard stop finale: report con i tre hash, gate, output dei grep, e conteggio righe cancellate.
- Questo task è compile-safe per costruzione ma il comportamento va confermato in app: lo smoke completo post-Stadio 5 (load progetto reale, viewpoint IR, default delegate, editing, undo) è a carico di Alfonso prima di qualunque stadio successivo.

## RIFERIMENTI

- `docs/discovery/discovery_2026-07-19_de_entanglement_graph.md` (Stadi 4-5, Rischi 1, 3, 6; superficie RuntimeAccessible: il purge è un cambio di API per user script, da annotare nel log come nota changelog).
- Baseline: typecheck 33, test IR 41/41, build verde su `2d312654f`.
- Decisioni di chat recepite: TemplatePreview delete (OQ6) · debug.tsx guardato, non rimosso · routing lib e DerivedReferenceEdge intoccabili (Stadio 6) · VIEWS_RECOMPILE resta vivo (si spegne alla Fase 5 IR).
