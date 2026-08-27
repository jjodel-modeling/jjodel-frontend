# Prompt per Claude Code — Fase 2, ingressi editor viste

Continuazione della Fase 1 (investigazione già consegnata). Decisioni sui punti aperti, poi implementa.

## Decisioni

**§3 — vista multipla → apri sulla più specifica. Approvato.**
Voce singola `Edit view · <nome>`, dove `<nome>` = `idlookup[resolveIRView(...).viewId].name`.
Le viste sorelle (row/edge) restano raggiungibili dall'albero. Niente submenu "altre viste".
Object-as-edge e menu arco: fuori scope, come proposto — non aggiungerli.

**§5 — bottone-menu affiancato al `<select>`. Approvato.**
Il `<select>` resta identico, coercizioni comprese. Bottone `toolbar-dropdown-btn` nella forma
`.notation-selector`, icona `bi-pencil` (comunica edit meglio dei tre puntini), subito dopo il
`<select>` dentro `.toolbar-viewpoint-group`. Contenuto: le view del viewpoint attivo + «Open
views editor». Sul nuovo bottone metti `aria-haspopup="menu"` e `aria-expanded` — solo sul
nuovo, non retrofittare il `.notation-selector` esistente.
Gate: nessun viewpoint attivo, `isMetamodel`, o viewpoint classico ⇒ il bottone non si rende.

**§6 — ritorno `string | null` da `createViewInWorkbench`. Autorizzato.**
Cambio compatibile, i tre call site ignorano il valore. Autorizzato anche un secondo
allargamento, se serve per la coerenza dell'ingresso canvas: un parametro opzionale
`viewpointId?: string` che, quando passato, bypassa `resolveParentViewpoint()` — i nuovi
ingressi passano il viewpoint **attivo** (`state.viewpoint`), così la bozza nasce dove
l'utente la vede. I call site esistenti non cambiano comportamento. La discrepanza
preesistente sul "last edited workbench viewpoint" resta com'è.

**Ingresso 3 — opzione (a): già soddisfatto, non toccarlo.**
Il click sulla riga applica già la regola selezione → vista. Una matita che duplica il click
su una riga con già due azioni hover è rumore. Il vincolo sulla `aria-label` della matita
decade con l'ingresso.

## Requisiti aggiuntivi emersi dalla Fase 1

- **Rail collassata**: gli ingressi 1 e 2 devono riaprirla (`bothCollapsed`), altrimenti
  l'azione non mostra nulla. Riusa il meccanismo con cui la rail si espande oggi, non
  inventarne uno.
- **Helper unico**: `DockManager.openView(viewId)` accanto a `openViewpoint`, che scrive la
  tripla `_lastSelected {node:'', view, modelElement:''}` e gestisce la riapertura della rail.
  I tre siti esistenti che duplicano la tripla possono migrare all'helper se il diff resta
  piccolo; se no, solo i nuovi ingressi lo usano.
- **Deselezione nota**: aprire l'editor sulla vista azzera `node`/`modelElement` nel
  Properties (tripla atomica). Comportamento accettato — documentalo nel commit, non
  aggirarlo.

## Cosa implementare

1. **Menu contestuale nodo canvas** (`EditorV2.getContextMenuItems`, ramo nodo, accanto a
   `Create View`): voce `Edit view · <nome>` con `bi-eye`, gate = `resolveIRView(...)?.viewId
   != null` (per i nodi `objectNode` di tab modello). Se il classifier non ha vista dichiarata
   e siamo su viewpoint IR attivo: voce `Create view for <classifier>` che usa
   `createViewInWorkbench(..., viewpointId attivo)` e apre l'editor sull'id ritornato.
2. **Bottone-menu toolbar** come da §5.
3. Niente sull'ingresso rail.

## Vincoli (invariati dalla Fase 1)

- Nessun cambio al modello dati; tree filter / scope bar / densità intoccati.
- Degradazione: non risolvibile ⇒ voce assente, mai disabilitata.
- Un solo comportamento nuovo per ingresso; nessun redesign oltre la voce/bottone aggiunto.

## Verifica

- Nodo `State`, viewpoint IR attivo → `Edit view · State node` → editor sulla vista giusta
  (assert su `_lastSelected.view`).
- Classifier senza vista → `Create view for <X>` → bozza nel viewpoint attivo, editor aperto
  su di essa, `ir.metaclasses = [X]`.
- Rail collassata + ingresso 1 o 2 → rail riaperta con editor visibile.
- Viewpoint classico / metamodello / nessun viewpoint → nessuna voce nuova, bottone toolbar
  assente.
- `build` verde, `typecheck` baseline, `vitest` invariato, smoke `_tmp_` sul path consolidato.

Procedi.

---

## Risposte alle domande di apertura (2026-08-25, Claude Code)

- Perimetro approvato a 7 file (Rule 19).
- Tipo commit: `feat`. Commit unico.
- Deviazione dichiarata e approvata sul §6: in `EditorV2` il viewpoint attivo si legge da
  `IRViewpointIndex.viewpointId` invece che da `state.viewpoint`, per non aprire un lettore
  nuovo del root in editor-v2 (R-LAY-19, in vigore dal 2026-08-25). In `Toolbar` si riusa
  `rawActiveViewpointId` (`Toolbar.tsx:202`), lettore già censito.
