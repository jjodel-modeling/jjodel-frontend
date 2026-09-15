# Prompt Claude Code: Data Manager Viewpoint singleton, Fase 1 discovery (R-DMV)

**Data**: 2026-09-04 15:45
**Repo**: `jjodel-frontend`, branch `alfonso-frontend-jjtl`, HEAD `c582c2bbb` (più il commit docs di questo prompt)
**Modello / effort**: xhigh
**Tipo**: feat, corsia completa (two-phase). Questa è la **Fase 1, read-only**, con hard stop.
**Critical zone**: non attesa. Se la discovery tocca `useJjomSync.ts`, `VersionFixer.tsx` o i
writer del D-layer dei viewpoint, fermarsi e dirlo.

Leggi `CLAUDE.md`, `docs/decisions.md` (serie R-DMV, R-VP) e `docs/claude-code-log.md`. Il memo
`docs/ratifiche/claude_2026-09-04_1545_memo_ratifica_data_manager_viewpoint.md` è la fonte delle
decisioni; se il codice le contraddice, fermati e dillo.

## 1. COSA (contesto della Fase 2, da non implementare ora)
Un `DViewPoint` builtin, uno per progetto, da cui il Data Manager legge (R-DMV-1); rail con Form
theme e editor per classe dei widget per campo (R-DMV-4); sidebar che elenca le classi
personalizzate (R-DMV-5); nascita alla prima scrittura (R-DMV-6).

## 2. Ipotesi da falsificare
- H1: `ViewpointType` (`view/viewPoint/viewpoint.ts:13`) è il posto giusto per distinguere il
  singleton (`getViewpointType` legge `viewpointType` esplicito o i booleani legacy). Alternativa:
  un flag `builtin` a parte. Dire cosa legge la sidebar (`TreeViewContent.tsx`, sezioni
  `__section:viewpoints/syntax` e `/validation`) e cosa il picker della toolbar.
- H2: la voce sintetica «Data manager» del picker (`components/editor-v2/dataManagerOption.ts`,
  `Toolbar.tsx:309-335`, test `dataManagerPicker.test.ts`) può restare la porta del manager e in
  più selezionare il singleton nel rail, senza mai attivarlo come `state.viewpoint`.
- H3: `InstanceManagerTab.tsx:1522` (`getIRIndex(state, computeIRSignature(state))`) legge
  l'indice del viewpoint ATTIVO. Serve un indice del singleton: dire se `computeIRSignature` /
  `getIRIndex` accettano un viewpoint esplicito o vanno parametrizzati (leggere `irResolveCore.ts`
  `:100-240`), e se `useIRFormView` (per il drawer) ha lo stesso vincolo.
- H4: `ViewpointProperties.tsx` (Form theme, `:66-70`, `:128-136`) e `FormAuthoringBody.tsx`
  (widgets per feature, `withFormEntry:162`, `pruneForm:126`) si possono montare nel rail per il
  singleton senza modifiche a `Info.tsx:1369-1388` oltre al dispatch sul tipo.
- H5: `DViewPoint.newVP` (`viewpoint.ts:40`, usi in `ProjectEditor.tsx:1193` e `view.tsx:1866`)
  è la sola via di creazione; «New viewpoint» (`JjodelEvents.CREATE_VIEWPOINT`,
  `events/registry.ts:51`) e la duplicazione (`view.tsx:1866`) e la cancellazione hanno un punto
  ciascuno in cui escludere il builtin.
- H6: `pruneForm` (`FormAuthoringBody.tsx:115-131`) pota solo `widgets` e `features` vuoti; per
  R-DMV-5 deve potare anche `order`, `labels`, `hidden` vuoti e la chiave delle colonne.

## 3. File da leggere (path completi)
`frontend/src/view/viewPoint/viewpoint.ts`; `frontend/src/view/viewElement/view.tsx` (`:220-260`
`formTheme`, `:1850-1880` duplicazione); `frontend/src/components/editor-v2/dataManagerOption.ts`;
`frontend/src/components/editor-v2/Toolbar.tsx` (`:290-340`);
`frontend/src/components/TreeViewSidebar/TreeViewContent.tsx` (sezioni viewpoint, `:50-70`,
`:2050-2120`, e il punto in cui le view di un viewpoint sono elencate);
`frontend/src/components/abstract/tabs/InstanceManagerTab.tsx` (`:1500-1560`);
`frontend/src/components/editor-v2/viewpoint/ir/irResolveCore.ts` (`computeIRSignature`,
`getIRIndex`, `:100-240`); `frontend/src/components/editor-v2/viewpoint/ir/useIRFormView.ts`;
`frontend/src/components/editor-v2/viewpoint/ir/managerViews.ts`;
`frontend/src/components/editors/viewpoint/properties/ViewpointProperties.tsx`;
`frontend/src/components/editors/Info.tsx` (`:1360-1400`);
`frontend/src/components/editor-v2/viewpoint/authoring/FormAuthoringBody.tsx`;
`frontend/src/components/editor-v2/viewpoint/ir/useFormWidgets.ts` (`overrideIsCompatible:163`);
`frontend/src/components/project/ProjectEditor.tsx` (`:1180-1210`);
`frontend/src/redux/VersionFixer.tsx` (solo per dire se il singleton richiede una migrazione:
R-DMV-6 dice di no, verificare che un progetto salvato senza il singleton si apra identico).

## 4. Domande a cui il referto risponde
1. Dove e come marcare il singleton (H1), con la proposta di nome della chiave.
2. Come il manager e il drawer leggono dal singleton invece che dal viewpoint attivo (H3), con
   `file:riga` dei punti da cambiare; se serve un parametro nuovo su `computeIRSignature` /
   `getIRIndex`, dire chi altro li chiama (grep con conteggio).
3. I punti di esclusione del builtin da creazione, duplicazione, cancellazione, picker delle
   sintassi, apertura sul canvas (H5), ciascuno con `file:riga`.
4. Come il rail mostra il singleton: cosa dispatcha `Info.tsx`, cosa serve per montare Form theme
   e un editor per classe (H4); proposta minima della UI per classe (selettore di metaclasse,
   elenco feature con widget derivato e select dei compatibili).
5. La sidebar (R-DMV-5): dove elencare le classi personalizzate e le feature toccate; come si
   ottiene «widget derivato → override» per una feature (riusare `describeSlot`?).
6. Materializzazione (R-DMV-6): qual è la prima scrittura (Form theme o un widget), chi crea il
   `DViewPoint` e la view di classe, e che cosa vede il rail prima che esista.
7. Il nome della chiave delle colonne sulla view (`manager` oggi, R-DMV-3): proposta motivata
   (`table`? `columns`?) e conteggio delle occorrenze da rinominare (grep `\bmanager\b` in
   `irTypes.ts`, `managerViews.ts`, `InstanceManagerTab.tsx`, test); R-B9 vale: nessun progetto
   la porta ancora, verificarlo con grep sui fixture ed esempi.
8. Collisioni: grep di ogni identificatore nuovo che proponi.
9. Test a rischio: `dataManagerPicker.test.ts`, `managerViews.test.ts`, `instanceManager10*`,
   quelli della sidebar.
10. Domande aperte per Alfonso.

## 5. Referto
`docs/discovery/discovery_2026-09-04_data_manager_viewpoint.md` (suffisso `_N` se esiste).
Contenuto minimo: H1..H6 con esito, file letti, findings con `file:riga` e citazione verbatim,
dipendenze e rischi, proposta di affettatura della Fase 2 (slice per commit, ciascuna sotto i
5 file o con deroga dichiarata), domande aperte.

**HARD STOP.** La Fase 1 è chiusa solo quando il referto è scritto e committato (P4). La Fase 2
parte solo dopo un GO esplicito in chat, eventualmente emendato.

## 6. Cosa NON fare
Nessuna modifica al codice. Nessuna migrazione. Nessun rinomino. Non toccare `useJjomSync.ts`,
`portDistribution.ts`, `VersionFixer.tsx`.
