# GO Fase 2, slice 1c (taglie): risposte al LIR `3d48fcf9c`

**Prevale sul prompt delle 14:30 dove diverge.** Riferimento: il report unico
`docs/discovery/discovery_2026-08-24_layout_slice1c_taglie_lir.md`. Effort xhigh, critical zone
`useJjomSync.ts`. Un solo commit per i quattro file di codice più il test.

## Esito della Fase 1, in una riga per punto

La root cause (1) è confermata alle righe :1356-1377 e :1423-1447, con `rfNodeCache` che
conserva sempre l'output del trasformatore: il confronto trasformatore-contro-cache è legittimo
e one-shot per transizione. L'ipotesi sul reload era sbagliata nella causa (`state.viewpoint`
è nello snapshot persistito, `redux/store.tsx:160`, ripristinato prima del mount) e giusta
nell'esito: la taglia non viene mai ripropagata, con o senza reload. Il censimento è chiuso:
due siti da instradare, sei da dichiarare, di cui `ViewportCulling.ts:193-194` è codice morto.

Il punto che il prompt non sapeva è il più importante e cambia la natura del diff:
`useContentDrivenSize` legge `isResized` dal seme (`useContentSize.ts:101`), e dal `cd8363ccc`
il seme non viene più scritto da nessun gesto. Quindi oggi, su ellisse e rombo, la derivazione
da contenuto è attiva anche su un nodo ridimensionato a mano: è una **regressione della
rettifica del 24/8**, non un difetto latente, e va dichiarata così nel log e in un addendum al
report. Col solo fix (1) peggiorerebbe (patch e hook si contendono la taglia fino a bruciare
`MAX_UNACCEPTED_WRITES`): i punti (2) e (3) stanno nello stesso commit, senza eccezioni.

## Le tre risposte

**1. Refresh degli archi: omesso.** La misura sul sorgente di `@xyflow/react` 12.10.2 basta:
togliere `measured` azzera gli `handleBounds` e il `ResizeObserver` richiama
`updateNodeInternals` da sé, e il `{type:'dimensions', resizing: undefined}` che ne segue non
innesca persistenza (`EditorV2.tsx:3482`). Verificato in chat un rischio collaterale che il LIR
non nominava: `fitView` in `EditorV2.tsx` scatta solo nel callback della sync iniziale
(:417-438, con `setTimeout` 50 ms) e su gesti espliciti (:3134, :3136, :3302); nessuna
dipendenza da `nodesInitialized`, quindi togliere `measured` a un nodo esistente non ri-adatta
la vista. La cintura di `resetNodeSize` (doppio rAF + `updateNodeInternals` sugli id patchati)
resta il rimedio dichiarato se la prova 3 mostra handle staccati: in quel caso si aggiunge in un
commit separato, non si riapre il design.

**2. Test di `getLayoutKeyOf`: sì, col mock del barrel.** Nuovo file
`components/editor-v2/viewpoint/layout/__tests__/vertexLayoutAdapter.test.ts` con
`vi.mock('../../../../joiner', () => ({ store: { getState: () => state } }))` in testa, così
monaco non viene mai caricato. Quattro casi sullo stato sintetico: nessun viewpoint (`null` e
`''`), viewpoint non esclusivo, viewpoint esclusivo, `idlookup` mancante. Se il mock non regge
per risoluzione del path e la suite resta rossa, si rinuncia al test e lo si dichiara nel log:
**niente file gemello puro**, perché R-LAY-16 come emendata mette il predicato di esclusività
nell'adapter, e spostarlo nel modulo puro contraddirebbe la lettera per un test. Regola 19: i
file diventano **cinque** (quattro di codice più il test), tutti elencati qui.

**3. Piano confermato riga per riga**, con due precisazioni. La prima è la tua: nel patch
differito la presenza si testa con `has()`, perché `null` è il valore legittimo che dice
«togli `width`, `height`, `measured`». La seconda riguarda l'anti-bounce: `BOUNCE_WINDOW_MS` è
300 ms (`syncState.ts:78`) e l'effetto si riesegue a ogni render per il `Date.now()` nelle
dipendenze, quindi la cache raggiunge il trasformatore entro il primo render dopo la finestra.
Se in Fase 2 misuri un caso in cui la cache può restare stantia fino al cambio di layout
successivo, il confronto per la taglia legge anche il nodo React Flow vivo (`getNodes`), ma
come fallback dichiarato, non come default.

## Cosa resta com'è

`Date.now()` nelle dipendenze e `prevModel = {}` (:1344); il proxy L e `LVoidVertex`; i sei
siti dichiarati del censimento, `ViewportCulling.ts` compreso (morto, non si tocca); l'undo,
inclusa l'interazione col cambio layout; la taglia `style.width/height` del `packageNode`.

## Gate e chiusura

`tsc` byte-identico alla baseline salvata (33), vitest 1342 passed con le stesse 9 suite rosse
(più la nuova suite verde, o la rinuncia dichiarata), build exit 0, `check:docs`. Addendum in
coda al report con la regressione di `useContentSize.ts:101` nominata come tale. Entry nel log
dopo la verifica visiva di Alfonso, protocollo del prompt delle 14:30 invariato: la prova 6 è
quella che esercita (2) e (3). Commit `fix(layout): node sizes follow the layout in force`
con `git add` dei soli cinque file.
