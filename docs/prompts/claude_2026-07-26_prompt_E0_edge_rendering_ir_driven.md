# Prompt Claude Code: E0 — rendering IR-driven degli edge (consumo gated in UnifiedEdge)

**Data**: 2026-07-26
**Tipo**: feat (implementazione scoped; Fase 2 del two-phase, la discovery è già fatta)
**Repo**: jjodel-frontend, branch `alfonso-frontend-jjtl`
**Prerequisito**: HEAD = `4273317f8`, working tree PULITO (`git status`). Se non lo è, STOP e segnala.
**Mappa di riferimento (già scritta, NON rifare discovery)**: `docs/discovery/discovery_2026-07-26_edge_authoring_substrate.md`. Ogni sito qui sotto è già lì con `file:riga`.
**Hard stop**: dopo l'implementazione + build/test verdi + snippet di verifica, PRIMA del commit. Il commit avviene solo dopo la conferma visiva di Alfonso su `http://localhost:3001/`.

## Perché questo task

Lo stack IR edge è già vivo (resolve/compile/decorate/persist/react col test verde), ma il renderer non consuma lo stile IR: `applyEdgeStyle` (`irEdgeViews.ts:49-72`) produce stroke/width/dash/marker/label che `UnifiedEdge` ignora (destruttura solo id/coords/handles/data/label/type, non usa `<BaseEdge>`; `UnifiedEdge.tsx:62-76`). Risultato: colore/spessore/tratteggio/marker autorati nell'IR NON si vedono. E0 chiude questo buco per **entrambe le nature** (reference-as-edge e object-as-edge scrivono già `data.irEdgeViewId`), senza toccare il routing.

Decisioni ratificate che vincolano questo task (addendum `spec_2026-07-26_ir_edge_authoring_addendum.md`, KB): D1 consumo gated in UnifiedEdge (non componente dedicato); D2 matching pre-lift; D3 Manhattan congelata; D6 label IR sempre visibile.

## Prima di iniziare

1. Leggere `CLAUDE.md`; in caso di conflitto con questo prompt, segnalare senza procedere.
2. Leggere `docs/claude-code-log.md` (contesto recente) e la sezione edge del discovery report del 2026-07-26.
3. Rileggere per intero, prima di modificarli: `edges/UnifiedEdge.tsx`, `viewpoint/ir/irEdgeViews.ts`, `viewpoint/ir/irContainment.ts`. Sono in `frontend/src/components/editor-v2/`.

## Vincoli di scope (rigidi)

- **Toccare SOLO**: `edges/UnifiedEdge.tsx`, `viewpoint/ir/irEdgeViews.ts`, `viewpoint/ir/irContainment.ts`. Se serve un import o un tipo in `viewpoint/ir/irTypes.ts`, aggiungere solo campi opzionali additivi (mai cambiare/rimuovere campi esistenti) e dichiararlo nel log.
- **NON toccare la critical zone**: `hooks/useJjomSync.ts`, `utils/portDistribution.ts`, `sync/canvasToJjom.ts`, `syncState`. Se ti sembra necessario, STOP e segnala: non lo è per E0.
- **NON toccare il routing**: `computeManhattanPath` / `utils/edgeUtils.ts` restano invariati. `edge.routing`/`irRoutingHint` restano inerti (dead-write documentato, non consumarli, non rimuoverli).
- **Path classic invariato**: quando `data.irEdgeViewId` è ASSENTE, `UnifiedEdge` deve rendere ESATTAMENTE come oggi (edge M2 classici byte-identici). Il nuovo comportamento vive interamente dentro il ramo gated.
- Zero refactoring opportunistico; mai rinominare identificatori esistenti (classi CSS, marker id, props).

## COSA / DOVE / COME

### 1. `applyEdgeStyle` → scrivere lo stile in vocabolario di dominio dentro `e.data`
**DOVE**: `viewpoint/ir/irEdgeViews.ts:49-72`.
**COME**: oggi scrive su `e.style` (stroke/width/dash) e su RF `markerStart`/`markerEnd` (`MarkerType`), campi che `UnifiedEdge` non consuma. Riscrivere in modo che lo stile finisca in `e.data`, con nomi NUOVI e verificati anti-collisione (`grep -r` nel codebase PRIMA di introdurli; le collisioni CSS/data sono insidiose). Nomi proposti (adattare se collidono): `data.irStroke`, `data.irStrokeWidth`, `data.irStrokeDasharray`, `data.irSourceTermination`, `data.irTargetTermination`, `data.irLabelText`, `data.irLabelAlwaysVisible`. Mantenere `data.irEdgeViewId` (già scritto, è il gate). Le terminazioni vanno espresse nel vocabolario `EdgeTermination` (none/openArrow/closedArrow/hollowTriangle/filledDiamond/hollowDiamond), NON come `MarkerType` RF. Se restano scritture su `e.style`/RF marker che nessuno legge, rimuoverle (erano dead-write) SOLO se questo non cambia altri consumer: verificare con grep.

### 2. `UnifiedEdge` → ramo gated che consuma lo stile IR
**DOVE**: `edges/UnifiedEdge.tsx` (destrutturazione `:62-76`; path/className `:486-488,592-599`; marker `:477-484,513-575`; label `:501-506,625-668`).
**COME**:
- Leggere `data.irEdgeViewId` (e i campi `data.ir*` del punto 1). Se assente → comportamento attuale invariato.
- Se presente: applicare `irStroke`/`irStrokeWidth`/`irStrokeDasharray` come **inline style sul path** (override della sola resa, non della className: la classe resta per non perdere altri stili strutturali). Non introdurre `<BaseEdge>`.
- Mappare `irSourceTermination`/`irTargetTermination` ai marker di dominio che UnifiedEdge **già disegna** (`:513-575`): riusare gli `<marker>` esistenti (rombo pieno/vuoto, freccia, triangolo) mappando il vocabolario `EdgeTermination`, senza creare nuovi marker se già esistono equivalenti. Se manca un equivalente (es. `closedArrow`), aggiungerlo accanto agli esistenti con id nuovo verificato anti-collisione.
- Label: se `irLabelAlwaysVisible` è true (o è presente `irLabelText` da una view IR), la label center è **sempre visibile**, bypassando l'hover-gating M1 (`:501-506,631`). L'hover-gating resta per gli edge senza view IR.

### 3. Fix matching pre-lift (D2) — solo reference-as-edge
**DOVE**: `viewpoint/ir/irContainment.ts:240-277` (`decorateEdges`, dove riscrive `source`/`target` sull'antenato) e `viewpoint/ir/irEdgeViews.ts:129-134` (`decorateReferenceEdges`, che risolve la view via `objByVertex.get(e.source)`).
**COME**: preservare gli id-oggetto ORIGINALI dei due capi sul `data` dell'edge PRIMA del lift (nomi nuovi verificati, es. `data.irSourceObjectId`/`data.irTargetObjectId`; lo spread `...e.data` in `:270` li conserva attraverso il lift). Far risolvere `decorateReferenceEdges` la view sull'oggetto ORIGINALE (via quegli id) invece che su `objByVertex.get(e.source)` post-lift. object-as-edge non cambia (risolve su `objectId`, già lift-invariante). Verificare che l'ordine in `useIRContainment.ts:147-158` (lift → decorateReference → synthesize) resti invariato: il fix agisce sui DATI dell'edge, non sull'ordine.

## Verifica

1. `npm run build` verde; typecheck baseline; `npm test` (vitest) verde. Nessun test rosso nuovo. Se un test edge esistente (`viewpoint/ir/__tests__/ir.test.ts`) copre `applyEdgeStyle`, aggiornarlo al nuovo contratto `data.ir*` (è un cambio di contratto interno atteso, non una regressione).
2. **Produrre uno snippet console pronto da incollare** che seedi su un progetto runtime (il "CD3" di Alfonso) DUE edge view IR, usando la forma reale di `EdgeViewIR` (`irTypes.ts:163-191`) e lo stesso pattern di seed delle row view (`DViewElement.new2(... d.ir=<EdgeViewIR> ...)`, `appliableTo='Edge'`): (a) una **reference-as-edge** su una reference d'ereditarietà/dominio, stile ben visibile (es. tratteggiata, `hollowTriangle` al target); (b) una **object-as-edge** se il progetto ha una metaclasse reificata. Consegnare lo snippet ad Alfonso (incollato nella risposta o come file di lavoro), indicando i punti da adattare (nomi metaclasse/reference del progetto runtime). Serve per la conferma visiva; non è un artefatto di repo.
3. **HARD STOP**: non committare. Consegnare ad Alfonso: diff, esito gate, snippet. Alfonso verifica su `http://localhost:3001/` con hard-refresh che lo stile IR (colore/spessore/tratteggio/marker/label sempre visibile) ora si veda su entrambe le nature, e che gli edge classici M2 siano invariati.
4. Solo dopo il GO di Alfonso: commit + entry in `docs/claude-code-log.md`.

## Commit (solo dopo GO)
- Messaggio: `feat(editor-v2): IR-driven edge rendering (gated style consumption + pre-lift matching)`
- `git add` dei soli file toccati (mai `git add .`).
- Entry di log: data, tipo feat, prompt (riassunto una riga), file toccati, esito, nota sul cambio di contratto `applyEdgeStyle` (da `e.style`/RF marker a `data.ir*`) e sul fix pre-lift.

## RIFERIMENTI
- Addendum ratificato: `spec_2026-07-26_ir_edge_authoring_addendum.md` (KB) — D1/D2/D3/D6 vincolano questo task.
- Discovery: `docs/discovery/discovery_2026-07-26_edge_authoring_substrate.md` (mappa con file:riga; rischio #1 = dead write, rischio #3 = matching post-lift).
- Schema: `docs/specs/spec_2026-07-18_ir_schema_v1_2.md` §7; `EdgeViewIR`/`EdgeTermination` in `viewpoint/ir/irTypes.ts:145-191`.
