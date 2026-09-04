# Memo di ratifica: il Data Manager Viewpoint (singleton)

**Data**: 2026-09-04 15:45
**Chat**: sessione Cowork del 3-4 settembre, dopo la chiusura di R-VP slice 1 (`85db1612c`,
`40142a4f3`) e la rimozione della scheda Form dal rail (`c582c2bbb`, R-VP-14).
**Serie**: R-DMV (Data Manager Viewpoint). Supera R-VP-3 e R-VP-12; conferma R-VP-14.

## 1. Il problema

Con R-VP-3 gli aspetti visuali del Data Manager stavano nella stessa view per classe del
viewpoint diagrammatico. Alfonso ha rilevato che così un viewpoint definisce due cose
eterogenee, la sintassi concreta di un diagramma e la configurazione di una tabella, e che
questo rende il meccanismo generale difficile da capire: il menu chiama i viewpoint
«sintassi» e poi mette il Data Manager a parte, sotto una riga. Il nome della chiave,
`manager`, nomina un componente della UI e non un concetto del linguaggio.

Il fabbisogno dichiarato (4 set 2026): solo il Data Manager come superficie di editing M1;
poter scegliere il tema visuale; poter fare override del widget per campo rispetto al default
derivato dal tipo. Nessuna esigenza di più configurazioni alternative del manager.

## 2. La decisione

Esiste un solo **Data Manager Viewpoint** per progetto: un `DViewPoint` marcato come builtin,
che non è un viewpoint come gli altri (non si crea da «New viewpoint», non si duplica, non si
cancella, non compare tra le sintassi del canvas, il canvas non lo apre). Il Data Manager legge
sempre da lui, mai da `state.viewpoint`. Le sue view sono view di classe senza `shape`, con le
sezioni già esistenti: colonne della tabella e `form` del drawer. I viewpoint diagrammatici
tornano a essere solo sintassi concreta; il loro `form.widgets` resta perché governa le righe
del nodo sul canvas (rung 0), che è un fatto del diagramma.

Nel rail, con il singleton selezionato: il campo Form theme (già in `ViewpointProperties`) e un
editor per classe dei widget per campo, con i soli widget compatibili col tipo, che scrive
`form.widgets` nella view di classe del singleton creandola se manca. Colonne, ordine, label e
nascosti entrano nello stesso pannello in una slice successiva.

Nella sidebar, sotto «Data Manager», si elencano **solo le classi che deviano dal default**
(quelle per cui nel singleton esiste una view) e sotto ciascuna le feature toccate con
l'override accanto, più «columns» quando l'ordine è fissato. Stato vuoto: «All classes use the
type-derived defaults». Una view svuotata si pota e la classe sparisce dall'albero.

Il singleton nasce alla prima scrittura (materializzazione su richiesta), non con una
migrazione: finché non c'è nulla da elencare non c'è nemmeno l'oggetto, e il default implicito
di R-VP-4 copre tutto. Un solo tema e un solo set di override per progetto, anche con più
metamodelli; se un giorno serve per metamodello si aggiunge un livello.

## 3. Cosa muore

- `hosts.manager` e `FormHostOverride` (R-VP-12): con un solo host della form non c'è più nulla
  da distinguere. Restano nel tipo finché un fronte R-DEAD non li misura e li toglie; nessun
  progetto li porta.
- La lettura del manager da `state.viewpoint` (commit 1 di R-VP slice 1): il manager legge dal
  singleton.
- Il nome `manager` della chiave sulla view: da ripensare **prima** che un progetto lo scriva
  (R-B9). Candidati: `table`, `columns`. Decisione rimandata alla discovery, con il nome della
  chiave di tipo del viewpoint.

## 4. Cosa resta

R-VP-1, R-VP-2, R-VP-4..11, R-VP-13, R-VP-14. Tutto il codice di R-VP slice 1
(`resolveManagerSpec`, `orderColumns`, `order`, `labels`, `hidden`, la cascata dei temi)
resta identico: cambia da quale viewpoint il manager legge.

## 5. Domande aperte per la discovery

Come si distingue il singleton (`ViewpointType` ha già `syntax | decoration | validation |
semantics | editor_behavior`: un valore nuovo, o un flag a parte); dove la sidebar filtra i
viewpoint per tipo (`TreeViewContent.tsx`, sezioni `viewpoints/syntax` e
`viewpoints/validation`); come la voce sintetica «Data manager» del picker
(`dataManagerOption.ts`, `Toolbar.tsx:309`) diventa l'apertura del singleton; come
`ViewpointProperties` e `FormAuthoringBody` si rimontano nel rail; dove `pruneForm` va esteso.
