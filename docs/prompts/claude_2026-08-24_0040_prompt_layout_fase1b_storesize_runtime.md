# Prompt Claude Code, 2026-08-24 00:40: layout per viewpoint, Fase 1b, la macchina `storeSize` osservata

**Fase**: 1b, **misura di caratterizzazione**. Nessuna modifica al codice di produzione. Un solo file
nuovo di test, che fotografa il comportamento esistente senza cambiarlo.
**Zona critica**: no. **Branch**: `alfonso-frontend-jjtl`. **Base**: `854dd2eab` o successivo.
**Protocollo**: `docs/PROTOCOL.md` P1..P10, deroga dichiarata su P8 (nessuno smoke: non c'è un
pixel che cambia).
**Decisioni che governano**: `R-LAY-1..12`, `R-RAIL-28` (ogni asserzione di assenza porta il
controllo positivo nella stessa invocazione), `R-IRN-27`.
**Report che precede**: `docs/discovery/discovery_2026-08-24_layout_d1_d8_d10.md`, §2.2 e §2.3.
Leggilo prima di tutto: questo prompt misura la sua affermazione principale, non la ripete.

## Perché

Il report del 24 ha trovato che `LViewElement.size` (`view.tsx:1462`) è un dizionario
`elemento → GraphSize` con catena view → viewpoint → scalari D (`updateSize` `:1681-1718`, `getSize`
`:1721-1738`), gate `storeSize`. Ha anche dichiarato, §12, che **nulla è stato eseguito a runtime**.
La chat ha letto `get_viewpoint` (`view.tsx:1563`): il «viewpoint» della catena è la **radice dei
padri della view che rende**, non il viewpoint esclusivo attivo. Se è così, la macchina esistente
usa la chiave che `R-LAY-6` ha scartato. Questa fase lo misura eseguendo, non leggendo.

## Passo zero, obbligatorio

```
command grep -c "R-LAY" docs/decisions.md        # atteso 19
command grep -c "storeSize" frontend/src/view/viewElement/view.tsx   # controllo positivo, > 0
```
Valori diversi da 19 e > 0: fermati e scrivi una riga nel report.

## Che cosa misurare

Un file di test Vitest, `frontend/src/view/viewElement/__tests__/storesize_characterization.test.ts`,
che costruisce **due viewpoint esclusivi** `A` e `B`, una view `vA` figlia di `A` e una `vB` figlia
di `B` che rendono lo stesso nodo `n`, con `storeSize = true` sui due viewpoint. Usa le fixture e il
modo di costruire lo stato che i test esistenti già usano (guarda
`frontend/src/redux/__tests__/versionfixer_2228_migration.test.ts` e i test sotto
`frontend/src/view/**/__tests__/` per il pattern; non inventarne uno nuovo). Se il pattern esistente
non permette di costruire viewpoint con view figlie, **fermati e dillo nel report**: è un risultato.

Le domande, ciascuna un `it(...)` con nome che la enuncia:

1. **Chi scrive dove.** `project.activeViewpoint = B`, ma il nodo è reso da `vA`. Chiamare
   `vA.updateSize(n.id, size)`. Il record finisce in `A.size[n.id]`, in `B.size[n.id]`, o in
   nessuno dei due? Asserire quello che succede, non quello che dovrebbe.
2. **Chi legge da dove.** Con `A.size[n.id]` e `B.size[n.id]` diversi e `activeViewpoint = B`, cosa
   torna `vA.getSize(n.id)`? E `vB.getSize(n.id)`?
3. **La view come sede.** Con `vA.storeSize = true` e `A.storeSize = false`, dove va la scrittura?
   È il caso che `R-LAY-8` esclude (solo i viewpoint esclusivi hanno un record).
4. **Il fallback.** Con tutti gli `storeSize` a `false`, `updateSize` torna `false` e gli scalari D
   (`n.x`, `n.y`) sono l'unica sede? Controllo positivo: con `storeSize = true` non lo sono.
5. **`GraphSize` porta la posizione.** Il record scritto contiene `x` e `y`, non solo `w` e `h`.

I test **passano se fotografano il comportamento reale**: se la risposta a 1 è «`A`», il test
asserisce `A`. Nessun `expect` scritto per come vorremmo che fosse. Ogni `it` porta nel nome la
riga di codice che esercita.

## Che cosa NON fare

- Non toccare `view.tsx`, `classes.ts`, `GraphDataElements.tsx`, `NodeData.tsx`, né altro codice di
  produzione. Se un test non si può scrivere senza un cambiamento di produzione, si scrive nel
  report e non il cambiamento.
- Non proporre la sede, non proporre `R-LAY-13`. Sono decisioni della chat.
- Non accendere `storeSize` di default da nessuna parte.

## Report, obbligatorio

`docs/discovery/discovery_2026-08-24_layout_fase1b_storesize_runtime.md`: passo zero, il pattern di
fixture usato, **una tabella con le cinque risposte misurate** (domanda, atteso dalla lettura del
report del 24, osservato, riga di codice), gli scostamenti fra letto e osservato, e la sezione
«ciò che NON è stato accertato». Se hai dovuto fermarti, il report dice dove e perché.

## Gate e commit

`npm run test` (il file nuovo verde, 1323 + N), `npm run typecheck` con diff vuoto rispetto alla
baseline §17, `npm run check:docs` (Check C è già rosso su una entry altrui: dichiaralo, non
correggerla). Un commit, `git add` dei soli due file (test + report) più la entry di log:
`test(view): characterize storeSize write/read chain across viewpoints (R-LAY, fase 1b)`.
Entry in `docs/claude-code-log.md`, `Corregge` vuoto, `Causa` vuota.

**Hard stop** dopo il commit. L'analisi si fa in chat sul report.

## Per Alfonso, a schermo, in parallelo (cinque minuti)

Renderer classico, un modello con due viewpoint esclusivi. Properties del nodo → view → «bind
sizes to view» acceso su tutte e due le view. Sposta il nodo con `A` attivo, attiva `B`, guarda se
si sposta anche lì; riportalo con `B` attivo, torna ad `A`. Poi ricarica la pagina. Tre righe di
osservazione nella chat: bastano.

## Riferimenti

- `docs/discovery/discovery_2026-08-24_layout_d1_d8_d10.md`, §2.2, §2.3, §12
- `frontend/src/view/viewElement/view.tsx`: `:287`, `:1402-1403` (`storeSize`), `:1462` (`size`),
  `:1563` (`get_viewpoint`), `:1681-1738` (`updateSize`, `getSize`)
- `frontend/src/joiner/classes.ts:1118` (`storeSize = false` di default)
- `frontend/src/components/editors/views/data/NodeData.tsx:39-40` (l'interruttore a schermo)
- `frontend/src/components/editor-v2/GraphDataElements.tsx:1398-1425` (gli override che scavalcano)
- `docs/decisions.md`: `R-LAY-6`, `R-LAY-8`, `R-LAY-9`
