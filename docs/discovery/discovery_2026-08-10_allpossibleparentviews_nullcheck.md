# Discovery — null-check mancante in `get_allPossibleParentViews` (view.tsx)

**Data**: 2026-08-10
**Origine**: backlog di `contesto_progetto.md` («Bug `allPossibleParentViews`, view.tsx:446-447, null-check mancante, alta priorità: verificare su HEAD se già toccato durante l'esecuzione della voce 4»). Eseguita dalla sessione Cowork notturna del 10/8 su mandato di Alfonso (implementazione autonoma delle voci semplici).
**HEAD alla discovery**: `12ad6de83`.

## Obiettivo

Verificare se la voce 4 (writer unico `father`) ha già chiuso il null-check mancante; in caso negativo, confermare la root cause e delimitare il fix minimo.

## File letti

- `frontend/src/view/viewElement/view.tsx` (blocco `get_allPossibleParentViews` :434-449; `get_viewpoint` :1436-1453; `set_father` a valle)
- `docs/discovery/discovery_2026-08-07_father_single_writer.md` (consumatori censiti alle righe 329-331)
- grep globale `allPossibleParentViews` su `frontend/src` e `docs/`

## Findings

1. **Il bug è vivo su HEAD**: la voce 4 non ha toccato il getter. A `view.tsx:446-447`:
   `let vp = this.get_viewpoint(c); allviews[vp.id] = vp;` senza guardia.
2. **Root cause confermata**: `get_viewpoint` (:1436) ritorna `undefined as any` in due
   rami espliciti, per sua stessa dichiarazione («A cycle has no rootless ancestor, so it
   terminates on the `undefined` this walk already returns when the chain runs out»):
   (a) ciclo nella catena `father` (set `visited` colpito); (b) catena che si esaurisce
   senza radice, cioè un pointer `father` dangling che fa uscire il `while (curr)` con
   `curr` undefined. In entrambi i casi la riga 447 fa `vp.id` su undefined:
   `TypeError: Cannot read properties of undefined (reading 'id')`.
3. **Superficie di innesco**: i tre consumatori censiti dalla discovery della voce 4 sono
   Select di parenting nella UI (`InfoData.tsx:326`, `irTabs.tsx:152`,
   `ViewProperties.tsx:72` — quest'ultimo file oggi rimosso). L'eccezione nel getter del
   proxy fa crashare il render del pannello Properties su una view con catena rotta,
   tipicamente da progetto persistito corrotto o da delete parziale: dati sporchi, non
   creabili dalla UI (i cicli sono esclusi proprio da questo getter quando funziona).
4. **Fix minimo**: guardia `if (vp)` sulla sola re-inserzione del viewpoint. Il contratto
   (`LViewElement[]`) non cambia; per una view con catena rotta la lista resta valida,
   semplicemente senza la voce del viewpoint. Coerente con la scelta di `get_viewpoint`
   di non lanciare eccezioni verso il caller.
5. **Nessun test esistente** copre il getter (zero hit nei `__tests__`). Un test unitario
   richiederebbe una fixture con catena `father` dangling sul proxy L: costo sproporzionato
   per una guardia di una riga; lasciato fuori, annotato qui.

## Dipendenze e rischi

- Nessun file della critical zone (§3.1). Il file è L-layer core: intervento limitato a
  una guardia su un getter read-only, nessun write path toccato.
- Rischio comportamentale: nullo nel caso sano (`vp` sempre definito); nel caso rotto si
  passa da crash del render a lista senza viewpoint.

## Domande aperte per Alfonso

Nessuna bloccante. Facoltativa: se si vuole che la catena rotta sia *visibile* invece che
silenziosa, un `Log.ee`/warn nel ramo `!vp` è un follow-up a costo minimo.
