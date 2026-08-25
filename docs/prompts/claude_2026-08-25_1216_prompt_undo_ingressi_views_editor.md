# Prompt — undo dei due ingressi «views editor» del canvas (misura + chiusura)

> Branch: `alfonso-frontend-jjtl`. Area: editor-v2, ingressi all'editor viste.
> **NON** critical-zone. Nessuna modifica al reducer: è core (Rule 5).

---

## Decisioni ricevute (Alfonso, 2026-08-25) — «esegui senza chiedere»

**Caso A** — se conforme, nessuna riga. Se il delta viene scartato (violazione
R-UNDO-4), registra la misura ma **non cambiare il reducer**: la chiusura è locale,
`openView` marca l'interazione (lo stesso `markUserInteracted` di R-UNDO-2) prima
della scrittura, *se è quello il motivo dello scarto*.

**Caso B** — se i due dispatch si fondono e il delta fuso è completo (punti 1-2
verdi) → riga di conformità, chiuso. Se si perdono dati nella fusione o non si
fondono (punto 3) → chiusura scelta: un solo dispatch per il gesto — la scrittura di
`_lastSelected` entra nella stessa `TRANSACTION` della creazione, dentro il handler
dell'ingresso canvas (`EditorV2`), non dentro `createViewInWorkbench` (che ha altri
tre call site senza apertura). `DockManager.openView` resta com'è per gli altri usi;
l'ingresso canvas chiama la variante transazionale. Registra come **R-UNDO-7** con
la misura e questa chiusura.

In entrambi i casi: sonda `_tmp_`, fixture sintetica (stile
`_tmp_views_editor_entries`, `Alpha`/`Beta`), zero literal; gate soliti (build,
typecheck 33, vitest 1349, smoke).

---

## Cosa è stato misurato

Sonda `frontend/scripts/smoke/_tmp_undo_view_entry.ts` (gitignored come tutte le
`_tmp_`), fixture costruita dentro la pagina: M2 `SynthM2` con `Pkg`, `Alpha(name,
flag)` --`betas`--> `Beta(name)`; M1 `SynthM1` con `a1`/`b1` linkati e due `DVertex`;
viewpoint IR dichiarato su `Alpha` **sola**, così `Beta` è il caso «nessuna view
dichiarata». Nessun progetto esistente aperto, nessun nome di metaclasse
nell'implementazione. Interfaccia in modo *advanced* (l'ingresso «Create view for …»
è gated su `isAdvancedMode()`). Gesti reali: click destro sul nodo, click sulla voce
di menù. **9/10 PASS**, l'unico rosso è il caso A, che è la misura stessa.

Passo di priming aggiunto dopo la prima corsa: senza un `pastDelta` lo stack è vuoto,
`shouldMerge` è falso per costruzione (`reducer.ts:1211`) e il caso A misurerebbe
l'assenza di un precedente invece della regola. Il priming è un trascinamento di nodo
e porta `undoable` a 1 prima del gesto.

### Caso A — «Edit view …» (sola apertura)

| misura | valore |
|---|---|
| `_lastSelected.view` | `""` → `Pointer_IRDemoBaseView_Alpha` (l'ingresso funziona) |
| `undoable` | 1 → 1 |
| ultimo delta | `["idlookup","action_title"]` → invariato, **non** acquisisce `_lastSelected` |
| `U.userHasInteracted` | `true` |

La scrittura è **scartata**: né spinta né fusa. Il gate R-UNDO-2 è escluso per misura
(flag alto) e l'assenza di precedente pure (stack non vuoto).

Controllo positivo nella stessa corsa, due scritture identiche nel contenuto e
diverse solo per la compagnia:

- `_lastSelected` da sola → `undoable` 1 → 1, assente dall'ultimo delta (**scartata**);
- `_lastSelected` insieme a una `SetFieldAction` su `name`, stessa `TRANSACTION` →
  `undoable` 1 → 2, delta `["idlookup","_lastSelected","action_title"]` (**conservata**).

Il discriminante è l'**arietà del delta**, non il gate: `isOnlyTransientTopLevelChange`
(`reducer.ts:1195`) intercetta i cambi di sola `dragging` / `_lastSelected` /
`contextMenu` **prima** del calcolo del delta e ritorna, quindi non si arriva mai al
ramo di fusione. Poiché il motivo dello scarto non è l'interazione, la chiusura locale
prevista («`openView` marca l'interazione») **non si applica** e non è stata scritta.

### Caso B — «Create view for <metaclasse>» (creazione + apertura)

| misura | valore |
|---|---|
| view creata e aperta | 1 nuova `DViewElement`, `_lastSelected.view` = il suo id |
| view nata completa | `name = "View for Beta"`, `ir` presente, `oclCondition` popolata |
| delta spinti dal gesto | **1** |
| chiavi del delta | `viewelements`, `idlookup` (2 id), **`_lastSelected`**, i `VIEWS_RECOMPILE_*`, `ELEMENT_CREATED` |
| un solo ⌘Z | la view creata sparisce da `idlookup` **e** la selezione torna a quella di prima |

I due dispatch **si fondono** e il delta fuso è **completo**: punti 1-2 verdi. Il caso
B è conforme e non richiede codice. La «variante transazionale» resta non scritta:
serviva solo al ramo di perdita, che non si è verificato.

Perché B si fonde e A no: la scrittura di `openView` in B non è un cambio di sola
chiave transitoria — arriva mentre i flag di ricompilazione della creazione sono
ancora in movimento, quindi salta il ritorno anticipato e finisce nel ramo di fusione,
dentro il delta della creazione. È lo stesso meccanismo del controllo positivo di A.

## Chiusura

Nessuna modifica al codice sorgente: entrambi i rami che l'avrebbero richiesta sono
esclusi dalla misura. Il risultato è a registro come **R-UNDO-7** in `docs/decisions.md`,
con la rettifica di R-UNDO-4 che ne discende (un cambio di sola selezione non è «fuso
nel precedente»: è scartato).
