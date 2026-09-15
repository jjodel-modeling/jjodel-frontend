# Ratifiche: decisioni Q1..Q11 dell'arco "Espressivita' edge v2"

**Data**: 2026-08-03
**Fonte**: `docs/discovery/discovery_2026-08-03_edge_expressiveness_v2.md` (OQ-1..OQ-16, Q1..Q11, rischi 1..12).
**Rapporto con le ratifiche precedenti**: integra `ratifiche_2026-08-02_edge_expressiveness_v2.md` (R-A1..R-A8). Dove diverge, prevale questo documento: R-A1 (ordine indicativo) e' confermato ma con una motivazione diversa (vedi R-B11).

## Il fatto che cambia il progetto dell'arco

La discovery ha trovato **~750 righe di lavoro gia' fatto e mai collegate all'IR**: `components/editors/markerPresets.ts` (17 preset in 7 categorie, con la famiglia **Multiplicity al completo**, cioe' le zampe di gallina ER che E-mark doveva costruire) e `components/editors/EdgeMarkerEditorModal.tsx` (editor custom completo: lista preset con thumbnail, canvas a maniglie draggabili, Monaco sul `d`, anteprima live su linea campione, e un `onApply(path: string)` che restituisce **esattamente la sola stringa `d`**, cioe' la forma di dato che serve). Consumatore unico oggi: la palette classica. Zero import incrociati con l'IR in entrambe le direzioni.

E-mark, che sembrava la slice da costruire, e' in gran parte una slice da **collegare**.

## R-B1 (Q1) — Il registro vive in `markerPresets.ts`, consumato in sola lettura

L'IR consuma `markerPresets.ts` cosi' com'e'. Non lo riscrive, non ne rimuove voci, non ne cambia quelle esistenti; puo' solo appendere, e solo se serve davvero.

Rationale: le tre alternative erano riuso (0 righe di registro, ma file condiviso con la palette classica che non ha test), registro IR dedicato (~120 righe duplicate destinate a divergere), registro condiviso nuovo in `ui/` (~150 righe piu' migrazione di due consumatori). Il rischio del riuso e' la modifica condivisa: si neutralizza vincolando l'IR alla sola lettura. La famiglia che serve a Jjodel (frecce, rombi, cerchi, barre, UML, molteplicita') e' gia' li' per intero, quindi la sola lettura non e' una rinuncia. Se un giorno l'IR avesse bisogno di glifi che la palette classica non deve mostrare, **quello** e' il momento di valutare il registro condiviso, non adesso.

Va dichiarata nel prompt la mappatura esplicita dai sei valori di `EdgeTermination` alle voci del registro, perche' e' li' che si materializza il delta visivo di R-B2.

## R-B2 (Q2) — ViewBox normalizzato a `0 0 10 10` sul ramo IR

I cinque marker IR passano al box unico `0 0 10 10`, gia' dichiarato da tutti e 17 i preset. Il campo `viewBox` resta per-voce nel tipo `MarkerPreset` (resta onesto ed estensibile), ma **l'opzione custom e' fissata a `0 0 10 10`**.

Rationale: senza un box unico la riga di aiuto per l'autore custom diventa "dipende dal marker che stai sostituendo", cioe' inutilizzabile, e la feature nasce morta. Il prezzo e' un cambio di aspetto minuscolo su triangolo (da 12×10) e rombi (da 12×8) **sugli edge IR gia' autorati**: e' un cambio visivo su comportamento committato (regola 3), quindi va dichiarato nel prompt come **atteso** e verificato a vista, non scoperto dopo. Oggi le view IR autorate sono quelle del dogfooding, quindi il delta e' praticamente gratuito: e' il momento migliore per farlo, e sara' sempre piu' caro dopo.

**Contratto per l'autore custom**, da mettere in UI accanto al campo:

> Disegna il glifo dentro un riquadro `0 0 10 10`. L'asse X va nel verso della linea (sorgente verso destinazione); il punto (10, 5) appoggia sul bordo del nodo di destinazione, il punto (0, 5) su quello di partenza. Il glifo viene ruotato automaticamente sulla linea e scalato con lo spessore della linea. Sono ammessi solo i comandi di path SVG (M, L, Q, C, A, Z).

## R-B3 (Q3) — Picker con anteprima: `JjSelect` con renderer d'opzione

Le due Select delle terminazioni passano a `JjSelect` (react-select, gia' dipendenza, gia' esportato dal design system, gia' in uso) con un renderer d'opzione locale al pannello che disegna la thumbnail, riusando il markup che il modal gia' scrive.

Rationale: `ui/Select` e' un `<select>` nativo e non puo' contenere markup, quindi l'estensione non e' un'opzione tecnica. Fra dropdown con thumbnail e griglia di bottoni, con diciassette voci piu' il custom e due campi da riempire (sorgente e destinazione) la griglia occuperebbe il pannello intero. La disomogeneita' con le altre Select del form e' un costo reale ma accettabile: un selettore di glifi **deve** avere un aspetto diverso da un menu di testo, altrimenti nasconde la sua unica informazione utile.

## R-B4 (Q4) — Riuso di `EdgeMarkerEditorModal`, con regola di uscita

Si tenta il riuso del modal esistente, collegandone l'`onApply` al draft dell'IR. **Con hard stop**: se il modal non e' montabile dal pannello IR senza modificare il suo file (l'API e' scritta attorno a `markerPosition: 'head'|'tail'` della palette classica, e `InteractivePathCanvas` piu' `pathDataModel`, 1400 righe, non sono stati letti integralmente), Claude Code si ferma e riporta, invece di adattarlo.

Rationale: il potenziale e' enorme (un editor di path completo gia' scritto) ma l'assunzione non e' verificata, ed e' esattamente il tipo di assunzione che costa una giornata se falsa. La regola di uscita ha gia' funzionato sul fix della label. Fallback dichiarato in anticipo: **campo di testo semplice per la `d` con validazione e anteprima statica**, che e' comunque una v1 utilizzabile.

## R-B5 (Q5) — Scrittura via i writer canonici invariati, risoluzione fatta fuori

E-lab riusa `syncUpdateFeatureValue` / `syncNodeLabel` **senza modificarli**, risolvendo objectId verso vertexId all'esterno con l'helper gia' esistente (`EditorV2.tsx:142-151`).

Rationale: **diff zero sulla critical zone**, nessun Layer Impact Report, e si eredita la `TRANSACTION` che il writer canonico gia' avvolge. La strada del nuovo export in `canvasToJjom.ts` sarebbe piu' pulita semanticamente ma paga un Layer Impact Report per otto righe di risoluzione. La scrittura inline sul modello di `handleReconnect` e' **esclusa**: quel precedente scrive lo slot **senza TRANSACTION** e replicarlo propagherebbe l'omissione.

Nuovo rischio da registrare, emerso qui: `EditorV2.tsx:1883-1886` scrive uno slot fuori da `TRANSACTION` mentre il writer canonico la avvolge. E' un'incoerenza latente su undo e sincronizzazione, non toccata da questo arco.

## R-B6 (Q6) — La label di una reference-as-edge non e' editabile

Il flag di editabilita' e' offerto **solo** sulla natura object.

Rationale: la label di una reference-as-edge e' **sempre derivata da un oggetto terzo**, il sorgente, perche' e' li' che la `TextSource` viene valutata. Renderla editabile significherebbe scrivere uno slot dell'oggetto sorgente, con l'effetto che la stessa modifica si riflette su **tutti** gli edge uscenti da quell'oggetto: l'utente edita una linea e ne cambiano cinque. La regola sana e' che si edita cio' che appartiene alla cosa su cui si e' cliccato, e una reference in M1 non ha un'entita' propria. Se emergesse un bisogno reale, si ri-ratifica.

## R-B7 (Q7) — Predicato di scrivibilita': intrinsic piu' path single-hop `.value`

Sono scrivibili: `intrinsic name`, `intrinsic qualifiedName`, e `path` single-hop con `take === 'value'`. Tutto il resto no, con **rifiuto esplicito del multi-hop**, non assunto per il fatto che oggi il PathBuilder produca solo single-hop.

`values[N]` resta fuori: il writer canonico scrive `featureProxy.value`, cioe' posizione 0, quindi non esiste il writer per l'indice N e fingere il contrario ricreerebbe una scrittura morta.

**`parsePathExpr` va esportata da `irCompile.ts`, non duplicata.** Rationale: il precedente del codebase e' la duplicazione (`isUsableEndpointExpr`), che questa stessa sessione ha gia' registrato come micro-debito perche' il test ne verifica una copia invece della funzione. Aggiungere una seconda copia raddoppierebbe un debito appena riconosciuto. L'export e' una parola chiave in un file IR core fuori dalla critical zone, e apre la strada a ritirare anche il debito precedente.

## R-B8 (Q8) — Le label agli estremi seguono la regola della centrale

Nessun flag nuovo, nessuna regola nuova: una label di estremo **autorata** e' sempre visibile, esattamente come lo e' oggi una label centrale autorata.

Rationale: la domanda si dissolve guardando cosa dice davvero la regola attuale. `irLabelAlwaysVisible` vale gia' "sempre visibile quando c'e' un testo autorato", quindi "sempre visibili" e "stessa regola della centrale" sono la stessa cosa. Introdurre un flag per label aggiungerebbe un concetto per risolvere un problema che non si e' ancora presentato. Se il canvas denso diventasse illeggibile, il flag si aggiunge dopo in modo additivo.

## R-B9 (Q9) — Si riusa il vocabolario esistente di `edge.routing`

Restano i tre valori gia' in codice e gia' potenzialmente persistiti: `'orthogonal' | 'straight' | 'curved'`. Le etichette in UI possono dire quello che si vuole ("Ortogonale (Manhattan)", "Diretto", "Curvo (Bezier)").

Rationale: le etichette sono gratis, gli identificatori no. Rinominarli romperebbe le view IR gia' salvate, e per l'IR non esiste alcun VersionFixer (quel meccanismo copre `jsxString`). Mantenere due vocabolari in parallelo sarebbe il peggio dei due mondi. La regola sul non rinominare identificatori esistenti vale anche qui.

## R-B10 (Q10) — Su routing non ortogonale le gesture dei waypoint si nascondono

`SegmentHandles` non viene montato e i waypoint non sono creabili quando il routing non e' ortogonale.

Rationale: e' lo stesso principio di R-A4 sul wildcard. Un waypoint su una bezier non e' sconsigliabile, e' **privo di significato**: il dato persistito e' `{segmentIndex, offset}`, che su una curva non ha referente. Lasciare la gesture attiva significherebbe permettere all'utente di creare dati inerti **e persistiti**, cioe' esattamente una nuova scrittura morta, il giorno dopo averne rimossa una. I waypoint gia' salvati restano sul modello e tornano vivi se si torna a ortogonale: non si cancellano.

## R-B11 (Q11) — Ordine: E-mark, poi E-lab, poi E-route

Confermato l'ordine di R-A1, ma la ragione e' diversa da quella che sembrava.

L'accoppiamento non e' "E-route rompe E-lab". `computeLabelPosition` cammina i punti di una polilinea e su una `d` bezier restituisce l'origine del canvas: questo **rompe gia' oggi la label centrale**, che esiste da E0. Quindi E-route deve farsi carico dell'ancoraggio delle label per i path non-polilinea **in ogni caso**, che E-lab sia landata o no. Anticipare E-route non risparmierebbe lavoro a nessuno dei due, e sposterebbe in avanti la slice piu' economica.

Regola di processo che discende dal rischio 1: **due slice non vanno mai in lavorazione contemporaneamente**, perche' tutte e tre atterrano in `UnifiedEdge.tsx`, che e' l'unico renderer di ogni edge dell'applicazione. La condivisione non e' logica (i rami sono separati da `isIREdge`) ma di file: un errore strutturale nel JSX abbatte anche il class diagram M2.

## R-B12 — Vincoli implementativi che valgono da subito

- **Il blocco `<defs>` va cambiato di forma, non esteso.** Oggi emette tutti e cinque i marker IR per ogni edge, indipendentemente dall'uso: con una famiglia di diciassette voci diventerebbe 17 marker per edge. E-mark deve emettere **solo i due referenziati**.
- **`EditorV2.scss:2082-2111` non si tocca.** Le classi dei marker sono condivise con gli edge classici M2: modificarle e' una regressione garantita su una superficie che questo arco non riguarda.
- **Il colore non si eredita.** Un path custom senza classe e senza stile renderebbe nero pieno. Ogni voce del registro deve portare la sua politica fill/stroke, e il token `'currentColor'` dei preset **non e' CSS funzionante**: va risolto al colore della linea come gia' fa il modal, oppure reso vivo impostando `color` sul marker.
- **`registerEdgePath` e' un registry globale condiviso con gli edge classici.** Un edge curvo che vi registrasse una polilinea fantasma degraderebbe il rilevamento degli incroci **degli altri edge**. E' l'effetto di E-route piu' facile da non vedere in uno smoke test, e va gatato esplicitamente.
- **`edge.labels.placement` e `edge.routing` sono dead write.** Non sono feature da attivare: E-lab e E-route devono implementarne il consumo da zero.
- **`irValidate` non fa alcun cross-check.** Ogni stato invalido rappresentabile introdotto dai nuovi schemi (marker custom insieme a un valore enum, label di estremo editabile su sorgente literal, routing incoerente con waypoint) non verra' intercettato: se il pannello non lo impedisce, lo produrra'. E' lo stesso rischio gia' registrato per gli IR ibridi.
- **Nessuna delle tre slice ha un banco automatizzato per il rendering.** `UnifiedEdge` non e' montabile in node. Aspetto dei glifi, posizione delle label e forma del path restano verifica visiva manuale.

## Perimetro e critical zone (riepilogo)

| Slice | Critical zone | Note |
|---|---|---|
| E-mark | **No** | ~5 file, nessuno in critical zone |
| E-lab | **No**, per effetto di R-B5 | Sarebbe entrata solo con un nuovo export in `canvasToJjom.ts` |
| E-route | **No**, verificato | Entrerebbe solo con liberta' di ancoraggio per-edge, che nessuno ha chiesto |
