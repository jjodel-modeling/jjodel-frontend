# Fase 2 — Doppio click su vista nel tree-view attiva il pin di Properties

**Data**: 2026-07-23. **Tipo**: feat (implementazione, dopo Fase 1 discovery + go-ahead). **Branch**: `alfonso-frontend-jjtl`. **Critical-zone**: nessuna. **LIR**: not-required.

## Contesto (ratificato, non ridiscutere)

Continuazione di `claude/2026-07-23_prompt_discovery_treeview_doubleclick_pin.md` (Fase 1, discovery read-only, report prodotto e analizzato). Decisioni finali:

- **D1 — Scope nodi**: SOLO `SubViewItem` (badge `v`, `DViewElement`, il nodo che apre `ViewData`). `ViewpointNode` (badge `VP`, `DViewPoint`) **non va toccato**: nessun auto-pin su doppio click su un Viewpoint. Non è una vista.
- **D2 — Canale**: CustomEvent, pattern già in uso nel progetto (`TOGGLE_TREE_VIEW`, `TRANSFORMATIONS` in questo stesso file). Nuova costante in `JjodelEvents`.
- **D3 — Pannello collassato**: il doppio click deve riportare il pannello Properties a visibile, non solo pinnare uno stato invisibile.
- **D4**: nessun marker visivo aggiuntivo nel tree per la riga pinnata. Il feedback resta l'icona pin nell'header di Properties (già esistente). Fuori scope.
- **D5**: autorizzata una riga di `user-select: none` in `tree-view-sidebar.scss` sulle righe del tree, per evitare che il doppio click evidenzi il testo del nome.

## Vincoli tecnici non negoziabili (dal report di discovery, §6.2 e §6.3)

1. **Tripla esplicita, mai letta dallo store.** `Action.fire` dispatcha con `setTimeout(…, 0)` (`redux/action/action.ts:349`): subito dopo `SetRootFieldAction.new('_lastSelected', …)` lo store contiene ancora il valore precedente. L'handler del doppio click **deve costruire la tripla `{node:'', view: view.id, modelElement:''}` direttamente dall'id del nodo cliccato**, mai leggerla da `store.getState()._lastSelected` (a differenza di `togglePin`, che può permetterselo perché il suo click avviene ben dopo che la selezione si è assestata).
2. **Guardia rename.** `SubViewItem` mostra un `<input>` di rename inline (righe ~1180-1190) dentro `.tree-row__content`. Il doppio click nell'handler deve fare `if (isRenaming) return;` come prima istruzione (la variabile `isRenaming` è già calcolata a monte, riga ~1147) — altrimenti un doppio click per selezionare una parola durante il rename pinnerebbe la vista per errore.
3. **Non toccare** `togglePin`, `pinnedResolvable`, `handleInternalNavigate`, il bottone pin, `<Info>`: il nuovo canale deve limitarsi ad invocare `setPinnedSelected` con la tripla, riusando i guard esistenti così come sono.

## COSA / DOVE / COME

### 1. `frontend/src/events/registry.ts`

Nel gruppo `// Panels` di `JjodelEvents` (righe 7-61), aggiungi:

```ts
PROPERTIES_PIN_VIEW: 'jjodel:properties-pin-view',
```

Verificato in Fase 1: nome libero, nessuna collisione in `frontend/src`.

### 2. `frontend/src/components/TreeViewSidebar/TreeViewContent.tsx`

- `EntityRowProps` (interfaccia non esportata, righe ~549-572): aggiungi `onDoubleClick?: (e: React.MouseEvent) => void`.
- `EntityRow` (righe ~574-666): destruttura `onDoubleClick` insieme alle altre prop già distrutte, e attaccalo al div `.tree-row__content` (riga ~626) accanto a `onClick` esistente. Non aggiungerlo al chevron né alla colonna `actions`.
- `SubViewItem` (righe ~1124-1251): aggiungi `handleDoubleClick` accanto a `handleClick` esistente (dopo riga ~1166):
  ```ts
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
      if (isRenaming) return;                    // vincolo 2
      e.stopPropagation();
      window.dispatchEvent(new CustomEvent(JjodelEvents.PROPERTIES_PIN_VIEW, {
          detail: { selected: { node: '', view: view.id, modelElement: '' } }   // vincolo 1: tripla esplicita
      }));
  }, [view.id, isRenaming]);
  ```
  Verifica il nome esatto della variabile `isRenaming` nel file (il report la colloca a riga ~1147: confermala prima di usarla, non assumere). Passa `handleDoubleClick` a `EntityRow` nel call site di `SubViewItem` (riga ~1222).
- **`ViewpointNode` non va modificato** (D1): nessun `handleDoubleClick`, nessuna prop nuova sul suo `EntityRow`.
- Import: aggiungi `JjodelEvents` da `../../events/registry` se non già importato in questo file (verifica prima di aggiungere un import duplicato).

### 3. `frontend/src/components/editors/PropertiesWithTreeView.tsx`

- Aggiungi un `useEffect` che ascolta `JjodelEvents.PROPERTIES_PIN_VIEW` su `window`, registrato/pulito con lo stesso pattern already in uso per `TOGGLE_TREE_VIEW` (righe ~283-291: stesso stile di `addEventListener`/cleanup in `return`).
- Nell'handler: `setPinnedSelected(e.detail.selected)`.
- **Vincolo D3**: nello stesso handler, riporta il pannello Properties a visibile se è collassato. **Prima di scrivere questa riga**, individua nel file lo state/setter reale che controlla la visibilità del pannello Properties (rail collassato) — non assumere il nome `isPropertiesVisible`/`setIsPropertiesVisible`: verificalo leggendo il file, potrebbe essere un altro nome o vivere in un context. Se il pannello Properties in questo componente non ha affatto uno stato di visibilità collassabile separato dal tree (cioè è sempre visibile quando il componente è montato), annota questo nel log invece di inventare uno state che non esiste.
- Dipendenze del `useEffect`: `[]` se `setPinnedSelected` (e l'eventuale setter di visibilità) sono stabili (come già per `handleInternalNavigate`); altrimenti includili.
- Non toccare `togglePin`, `pinnedResolvable`, `handleInternalNavigate`, il bottone pin, il render di `<Info>`.

### 4. `frontend/src/components/TreeViewSidebar/tree-view-sidebar.scss`

Aggiungi `user-select: none;` sulle righe del tree (`.tree-row` o `.tree-row__content`, verifica quale selettore è corretto e coerente con le altre 3 occorrenze di `user-select: none` già nel file — righe 85, 1516, 1627). Una riga, nessun altro cambiamento in questo file.

### 5. `docs/claude-code-log.md`

Entry di fine task: data, tipo `feat`, prompt ricevuto (riassunto), file toccati, esito, note (menzionare esplicitamente se il vincolo D3 sulla visibilità del pannello non era applicabile per assenza dello state).

## Verifica

- `npm run typecheck` (o il comando usato nel progetto): nessun aumento rispetto alla baseline nota (33).
- `npm run build`: pulito.
- **Verifica manuale su `localhost:3001`, hard-refresh** (Alfonso):
  1. Doppio click su una view (nodo `v`) nel tree → Properties mostra `ViewData` di quella view, icona pin piena, pannello visibile anche se era collassato prima del doppio click.
  2. Doppio click su una seconda view diversa → il pannello segue la nuova, il pin resta attivo (ri-target, nessuna azione di unpin manuale necessaria).
  3. Singolo click su una classe/altro elemento del modello mentre il pin è attivo → il pannello **non** si sposta.
  4. Unpin col bottone esistente → il pannello torna a seguire la selezione live.
  5. Doppio click **dentro l'input di rename** di una view (rename inline attivo) → **non** pinna (vincolo 2).
  6. Delete della view pinnata → unpin automatico (comportamento già esistente via `pinnedResolvable`, verificare che regga anche quando il pin è stato attivato da doppio click).
  7. Doppio click su un nodo **Viewpoint** (`VP`) → nessun cambiamento di comportamento, nessun auto-pin (conferma D1).
  8. Il nome della view **non** si evidenzia visivamente al doppio click (conferma D5).

## Hard stop

Commit solo dopo la verifica visiva completa dei punti 1-8 sopra, confermata da Alfonso. `git add` solo i file esplicitamente elencati in questo prompt (registry.ts, TreeViewContent.tsx, PropertiesWithTreeView.tsx, tree-view-sidebar.scss, docs/claude-code-log.md) — mai `git add .` o `git add -A`.
