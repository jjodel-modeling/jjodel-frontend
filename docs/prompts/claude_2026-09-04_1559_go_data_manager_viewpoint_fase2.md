# GO emendato: Data Manager Viewpoint (R-DMV), Fase 2

**Data**: 2026-09-04 15:59
**Referto**: `docs/discovery/discovery_2026-09-04_data_manager_viewpoint.md` (`65b8fb6b8`, Fase 1 chiusa)
**Prompt di Fase 1**: `docs/prompts/claude_2026-09-04_1545_prompt_data_manager_viewpoint_fase1.md`
**Ratifiche**: R-DMV-1..7 in `docs/decisions.md`; memo `docs/ratifiche/claude_2026-09-04_1545_memo_ratifica_data_manager_viewpoint.md`
**Effort**: xhigh. Corsia completa. Ogni slice è un commit, con HARD STOP per verifica visiva dove indicato.

## Risposte alle sei domande (§14 del referto)

- **Q1 — sì, e per prima.** `manager` → `table`: `table?: TableSpec` su `VertexViewIR` e
  `GraphVertexViewIR`, `TableSpec { columns?: string[] }`, `managerViews.ts` → `tableViews.ts`,
  `resolveManagerSpec` → `resolveTableSpec`, `ManagerViewResolution` → `TableViewResolution`,
  test rinominato. R-B9 verificata dal referto (§9): nessun progetto la porta. Il warn
  `[manager]` diventa `[table]`. Grep finale di `\bManagerSpec\b|resolveManagerSpec|managerViews`
  su `frontend/src` e `docs/discovery/harness` = 0 (le sonde `_tmp_*` non tracciate si ignorano).
  Regola 2 soddisfatta: il rinomino è chiesto qui.
- **Q2 — `'dataManager'`**, allineato a `DATA_MANAGER_OPTION_VALUE` / `isDataManagerOption`.
- **Q3 — id fisso `Pointer_ViewPointDataManager`**, precedente `Pointer_ViewPointDefault`. Il
  rischio della cache va misurato nella slice B con un test: due signature con lo stesso id di
  viewpoint ma view diverse non condividono l'indice; un singleton senza view non produce indice.
- **Q4 — sì**: la voce «Data Manager» nella sidebar esiste sempre, stato vuoto «All classes use
  the type-derived defaults» quando il singleton non esiste o non ha view.
- **Q5 — no**: nel pannello del singleton solo il Form theme del viewpoint e la tabella dei widget;
  niente `theme`/`labelPlacement` per view.
- **Q6 — il picker fa una cosa sola** (apre la tab, come oggi). È la voce della sidebar a
  selezionare il singleton nel rail (`_lastSelected.view`), o il suo stub quando non esiste. La
  materializzazione avviene alla prima scrittura dal pannello, nei due gradini di §8.2, **senza**
  TRANSACTION esterna (creator annidati, CLAUDE.md §3.3).

## Vincolo portante (§2.3 del referto)
Il singleton nasce e resta con `isExclusiveView === true`: creazione diretta con `newVP`, mai
attraverso lo switch di `handleCreateViewpoint`; il pannello del rail **non** ha il segmented
Type; `getViewpointType` restituisce `'dataManager'` dal campo esplicito prima di ogni booleano.
Smoke obbligatorio su un progetto con canvas classico: nessuna view del singleton vi si applica.

## Ordine delle slice (§12 del referto, emendato)
0. **Slice G → slice 0**: il rinomino, da sola. `refactor(ir): rename ManagerSpec to TableSpec
   before any project writes it (R-DMV-3)`. Gate: vitest sui test rinominati, `tsc` baseline,
   build. Nessuna verifica visiva (nessun pixel cambia): entry di log subito.
1. **Slice A**: tipo e predicato, con i quattro filtri (Toolbar, MegamodelView, Dashboard,
   dashboard di progetto). Deroga regola 19 accettata (RC-11): file elencati nella entry.
   Verifica: progetto identico.
2. **Slice B**: `computeIRSignature` / `getIRIndex` con viewpoint opzionale, `useIRFormView`
   propagato nei tre punti; test della cache (Q3). Verifica: canvas, manager, drawer identici.
3. **Slice C**: creatore del singleton (`ensureDataManagerViewpoint`, grep del nome) e lettura
   del manager dal singleton (`InstanceManagerTab.tsx:1523`, `IRForm.tsx:214` per host
   `manager`). **HARD STOP**: con singleton assente tutto identico (R-VP-4); creato a mano con una
   view di classe con `table.columns`, le colonne seguono lui e non il viewpoint attivo.
4. **Slice D**: `DataManagerViewpointPanel.tsx` nuovo (nome, Form theme senza hint, selettore
   di metaclasse, tabella feature → widget su `rowsForMetaclass` + `offeredOverrides`,
   materializzazione alla prima scrittura), `Info.tsx` dispatcha su `isDataManagerViewpoint`.
   Componente separato: `viewpointThemeHint.test.ts:80-84` vieta di toccare
   `ViewpointProperties.tsx`. **HARD STOP**: R-DMV-4 per intero, più il negativo (il singleton
   non è nel picker, non nel megamodello, non duplicabile, non cancellabile).
5. **Slice E**: sidebar, sezione «Data Manager» sempre presente, classi personalizzate e feature
   toccate con l'override accanto, «columns» quando fissato, stato vuoto; esclusione da
   `syntaxVps`/`validationVps`/`otherVps`; la voce seleziona il singleton nel rail. Un test di
   sorgente sul modello dei `instanceManager10*`. **HARD STOP**: R-DMV-5.
6. **Slice F**: `pruneForm` esteso a `order`/`labels`/`hidden` (non `basic`); potatore separato
   per `table` sull'ir; la view svuotata sparisce dall'albero.

Ogni slice: `git commit -- <file>`, docs e codice separati (§6.4), entry di log dopo la conferma
visiva dove c'è HARD STOP. Non passare alla slice successiva senza conferma in chat dopo ogni
HARD STOP; le slice 0, A, B, F possono seguirsi con la sola conferma dei gate.

## Cosa resta com'era
§6 del prompt di Fase 1. `hosts.manager` / `FormHostOverride` non si toccano (R-DMV-7, fronte
R-DEAD). Nessuna migrazione. `useJjomSync.ts`, `portDistribution.ts`, `VersionFixer.tsx` intatti.
