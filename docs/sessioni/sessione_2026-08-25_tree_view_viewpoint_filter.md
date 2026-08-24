# Sessione 2026-08-25 — filtro per viewpoint nel tree view

Documento di sessione citato da `docs/claude-code-log.md`, voce
`2026-08-25 — feat(tree-view): stato di resa per viewpoint`.

## Fase 1 — le quattro domande

**1. L'insieme dei classifier resi da un viewpoint è interrogabile?** Sì, ed è già
memoizzato, ma solo per i viewpoint **IR**. `computeIRSignature(state)`
(`irResolveCore.ts:116`) scorre la sola lista di puntatori `state.viewelements`
filtrando su `d.viewpoint === state.viewpoint`; `getIRIndex(state, signature)`
(`:134`) è cachata in una `Map` di modulo e ricompila solo al cambio di signature.
L'indice espone già `byMetaclass`, `wildcard`, `edgeByMetaclass`,
`objectAsEdgeByMetaclass`, `rowByMetaclass`. La domanda "il viewpoint rende X?" è
un lookup su `Map`, non una scansione: non serviva cambiare approccio.

Limiti, entrambi compatibili col vincolo di degradazione: i viewpoint classici
(jsxString) danno signature `''` e quindi nessuna informazione; le view wildcard
(`metaclasses: '*'`) rendono tutto e non escludono nulla.

**2. Come lo sa la palette.** Non è `FeaturesPalette` (non c'entra). Il percorso è
`EditorV2.tsx:1450` `irPalette` → `useIRInteractionPlan()` → `deriveIRInteraction`
→ `applyIRPaletteFilter`, il cui campo `undeclared` alimenta la sezione "Not in
this viewpoint" di `PalettePanel.tsx:155`. Riusata la fonte (`IRViewpointIndex`),
non la funzione: `paletteMetaclasses` è un insieme di *creabilità* (byMetaclass ∪
objectAsEdge) e omette row e reference-as-edge; parte dalle rootable classes; ha
un fallback normativo che nell'albero non ha senso; e restituisce array filtrati,
non un insieme interrogabile per riga.

**3. Viewpoint attivo e artefatto aperto.** `activateViewpoint()`
(`utils/lastViewpoint.ts:52`) scrive due canali insieme: `project.activeViewpoint`
e il root `state.viewpoint`. Va letto il **root**, perché è quello contro cui
risolve `computeIRSignature`: leggere l'altro significherebbe poter dimmare
rispetto a un viewpoint diverso da quello che dipinge il canvas. L'artefatto
aperto **non è in Redux**: la tab vera è l'`activeId` del dock
(`MyRcDock.tsx:577`, evento `JjodelEvents.ACTIVE_TAB`, consumato da
`StatusBar.tsx:286`), e una trasformazione è un `JjtlTransformation` che vive nel
JSON di progetto, non nell'`idlookup`.

**4. Multi-metamodello.** Sì, in due sensi. A livello di view: `ir.metaclasses` è
una lista di nomi e il picker (`MatchingSection.tsx:30-45`) offre ogni classe di
ogni metamodello del progetto, con identità fissata da `authoringMetaclassPins`.
A livello di artefatto: una trasformazione ha `sourceMetamodelId` /
`targetMetamodelId` (`megamodelInference.ts:126-145`). Da qui `scope: string[]`.

## Fase 2 — le tre decisioni ratificate

1. **"Reso" = unione completa** delle view IR (vertex, graphVertex,
   object-as-edge, reference-as-edge, row). Verità sopra coerenza con la palette:
   sono domande diverse, e le due superfici usano label diverse — "Not in this
   viewpoint" nella palette, `not rendered` nell'albero.
2. **Solo il caso Redux**: scopo a un metamodello, ricavato dall'artefatto aperto.
   Su trasformazione o scopo non determinabile si degrada al comportamento di
   prima. Il cablaggio `ACTIVE_TAB` + source/target metamodel è il giro successivo.
3. **Toggle "mostra tutto" fuori dal giro**: sarebbe un campo nuovo su `DProject`
   più una migration `VersionFixer`, e il dimming non nasconde nulla.

## Implementazione

- `irInteraction.ts` — `renderedMetaclassNames(index)`, pura, memoizzata su
  `WeakMap` dell'indice. `null` = nessuna opinione (indice assente, vuoto, o con
  una wildcard di qualunque tipo).
- `treeViewScope.ts` (nuovo) — `computeTreeViewScope(state)` + `useTreeViewScope()`.
  Artefatto aperto risalito da `_lastSelected.modelElement` al `DModel`; un
  metamodello è scopo di sé stesso, un M1 porta in scopo il proprio `instanceof`.
  `excludedCount` da una passata D-layer sui nomi delle classi del solo
  metamodello in scopo.
- `TreeViewContent.tsx` — `TreeClassData.notRendered`, calcolato in
  `buildPackageData`, applicato **solo** ai metamodelli in scopo. `EntityRow`
  aggiunge `tree-row--not-rendered` e l'hint. `ClassNode` forza
  `hasStructuralFeatures = false`: niente chevron, feature non renderizzate.
  Rimosso `activeViewpointId`, inerte dal 2026-07-28.
- `TreeViewScopeBar.tsx` — aggiunto `TreeViewScopeBarLive` (il wrapper cablato);
  senza `onShowExcluded` il conteggio è testo, non un bottone morto.
- Montaggio in `PropertiesWithTreeView.tsx` e nei due rami di
  `TreeViewSidebar.tsx`, sempre fuori dal body scrollabile.
- `tree-view-redesign.scss` eliminato (duplicato morto: la copia viva è in coda a
  `tree-view-sidebar.scss`).

## Smoke visivo

Playwright sul path verificato di `scripts/smoke/states.ts` (seed offline +
progetto creato dalla UI reale). Fixture: 5 classifier in `metamodel_1`, un
modello M1, viewpoint IR installato dall'helper dev dell'app
`__jjodelInstallIRDemo('State')` e attivato dal `<select>` reale della toolbar
(il selettore è `disabled` sulle tab metamodello, `Toolbar.tsx:487`: serve una
tab M1).

| | Esito |
|---|---|
| A — nessun viewpoint attivo | scope bar assente, 0 righe dimmed, albero identico a prima |
| B — viewpoint IR attivo | `State` normale; `Initial`/`Final`/`Transition`/`Event` dimmed, hint `not rendered`, senza chevron; scope bar `filter: IR Demo State on metamodel_1` + `4 excluded`; coerente con "NOT IN THIS VIEWPOINT" della palette a sinistra |
| C — scroll | scope bar `top` 135px prima e dopo 163px di scroll del body |
| D — click su riga dimmed | `_lastSelected` = `Event` (DClass), riga selezionata e ancora dimmed |

Zero `pageerror`.

**Limite di copertura, dichiarato.** Verificato solo il montaggio nel rail
(`PropertiesWithTreeView`, montato in `Dashboard.tsx:639`). I due rami di
`TreeViewSidebar.tsx` sono cablati ma non verificabili: il componente non è
importato da nessun file fuori dalla sua cartella — grep con controllo positivo su
`<PropertiesWithTreeView`, che trova `Dashboard.tsx:639`. `Dock.tsx:281` lo dà per
"dedicated component" ma nulla lo monta.

## Debito residuo

- Chiavatura per **nome**: due metamodelli omonimi collidono. Lo scopo a un
  metamodello riduce il caso agli omonimi interni; la via d'uscita è
  `resolveMetaclassId` (`metaclassPin.ts`), citata nel commento al punto di
  chiavatura.
- Il giro successivo: `ACTIVE_TAB` come sorgente della tab aperta, e scopo a due
  metamodelli per una trasformazione. `TreeViewScopeBar` ha già `scope: string[]`.
- Toggle "mostra tutto", se dopo l'uso reale il dimming risulterà troppo: schema
  `DProject.expandedTreeNodes` + migration `VersionFixer`.

## Appendice — cleanup della shell TreeViewSidebar (commit separato)

`TreeViewSidebar.tsx` (la shell: sidebar desktop + overlay laptop) era morto.
Controllo positivo su ogni grep prima di dichiarare l'assenza:
`<PropertiesWithTreeView` risolve a `Dashboard.tsx:639`, `useNodeProblems` a 5
file. Il componente non era importato da nulla fuori dalla sua cartella, e
nemmeno il barrel `index.ts` aveva consumatori.

Rimossi: il componente, l'export morto dal barrel, e dalla scss le sole regole
`.tree-view-sidebar*` / `.tree-view-overlay*` — incluse le sei nei due blocchi
dark-mode (`[data-theme="dark"]` e `html[data-theme="dark"] body:not(...)`).
−356 righe, nessun selettore vivo toccato. Restano `.tree-view-content` e
`.tree-search` (vivi) e `.tree-view-search-toggle` (ora orfano, ma fuori dal
perimetro dichiarato del cleanup).

Corretto il commento `Dock.tsx:281`, che indicava il componente eliminato come
sostituto della tab Tree View rimossa: il sostituto reale è
`PropertiesWithTreeView` montato in `Dashboard.tsx`.

Smoke ripetuto dopo la rimozione: rail identico — scope bar `top` 135px,
container 399×392 a `top` 135, `.tree-search` presente, le stesse quattro righe
dimmed, zero `pageerror`. Screenshot sovrapponibile a quello pre-cleanup.

### Debito segnalato e non toccato

- `hooks/useResolution.ts` resta senza consumatori. Non rimosso su indicazione.
- `TreeViewContent.tsx:463` cerca lo scroll container con
  `.tree-view-sidebar__body, .tree-view-overlay__body`. Quel selettore non ha
  mai fatto match nel rail (che usa `.tree-view-panel-body`): il menu contestuale
  non si chiude allo scroll. Difetto pre-esistente, reso visibile dalla
  rimozione, non introdotto da essa. Correggerlo cambierebbe un comportamento,
  non lo ripristinerebbe.
- `Tooltip.tsx:167` elenca le stesse due classi morte in una lista di selettori.
- `properties-with-tree-view.scss:413` cita `tree-view-sidebar.scss:1763`:
  riferimento di riga ora sfasato di 356 righe.
