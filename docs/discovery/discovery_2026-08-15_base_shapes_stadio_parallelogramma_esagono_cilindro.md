# Discovery 2026-08-15: quattro forme nuove nella sezione Base

Fase 1 read-only. Nessun file modificato. Richiesta: aggiungere a Base le figure
del mockup, cioe' Stadio, Parallelogramma, Esagono, Cilindro (le altre cinque del
mockup esistono gia').

## Obiettivo e stato di partenza

Il catalogo oggi ha 5 preset Base (`rect`, `rounded`, `ellipse`, `circle`,
`diamond`), con label in inglese. Il mockup ne mostra 9, con label in italiano:
lo scarto e' quindi di quattro forme, tutte e quattro fuori dal perimetro v1
dichiarato in testa a `notationCatalog.ts` («stadio, parallelogramma, cilindro...
NON sono approssimati: entrano quando arriva il contorno che li esprime davvero»).

Le quattro figure non sono righe di catalogo: sono primitivi nuovi. Il catalogo e'
un indice sopra lo spazio degli assi, e l'asse forma e' chiuso su
`ShapeForm = 'rect' | 'rounded' | 'ellipse' | 'circle' | 'diamond'`.

## File letti

- `frontend/src/components/editor-v2/viewpoint/ir/shapeRegistry.ts` (459 righe, per intero)
- `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts` (riga 38, `ShapeForm`)
- `frontend/src/components/editor-v2/viewpoint/ir/irStyle.ts` (righe 45-105, regole `.ir-shape--*`)
- `frontend/src/components/editor-v2/viewpoint/ir/notationCatalog.ts` (222 righe, per intero)
- `frontend/src/components/editor-v2/viewpoint/authoring/SymbolPreview.tsx` (`contourEl`)
- `frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx` (`FORM_OPTIONS`)
- `frontend/src/components/editor-v2/components/DynamicHandles.tsx` (uso di `insetFractionAt`)
- `frontend/src/components/editor-v2/nodes/nodeSizing.ts`
- `frontend/src/components/editor-v2/viewpoint/ir/useContentSize.ts` (consumatore di `boxFromIntrinsic`)

## Costo strutturale di una forma nuova

I consumatori dell'asse forma sono pochi e tutti passano dal registry:

| Punto | Cosa serve |
|---|---|
| `irTypes.ts` | un membro in piu' nell'unione `ShapeForm` (additivo) |
| `shapeRegistry.ts` | una riga: painter, `defaultResizable`, `keepAspectRatio`, `insetFractionAt`, `sizing` |
| `irStyle.ts` | regole `.ir-shape--<form>` (painter css) oppure soppressione della box + classe svg (painter svg) |
| `SymbolPreview.tsx` | un `case` in `contourEl` per la tile del catalogo |
| `VertexAuthoringPanel.tsx` | una voce in `FORM_OPTIONS` per il wizard |
| `notationCatalog.ts` | la riga di preset |
| test | `shapeRegistry.test.ts` (equivalenza e geometria) e `notationCatalog.test.ts` |

Nessun altro switch sulla forma esiste nel codebase: la tabellizzazione D10 ha gia'
raccolto i sei punti storici in uno solo. Questa parte e' meccanica.

## L'ostacolo vero: la precondizione di `insetFractionAt`

`ShapeDescriptor.insetFractionAt(t)` e' il profilo del contorno usato in due punti:
`DynamicHandles` per rientrare gli anchor dal bounding box al contorno, e
`availableWidthFraction` per il sizing content-plus-supplement. La sua
precondizione e' dichiarata (D9, 2026-08-14) e non osservata: la forma e'
simmetrica rispetto a entrambi gli assi, quindi **il lato non e' un parametro**.
Sulle cinque forme attuali profilo orizzontale e verticale coincidono, ed e' per
questo che una sola funzione basta.

Le quattro richieste si dispongono su tre livelli di costo:

**Stadio.** Riempie il proprio box, simmetrico su entrambi gli assi. Painter css
(`border-radius: 999px`), esattamente come `rounded` e `ellipse`. L'unico scarto
e' che il raggio delle calotte vale h/2, quindi il profilo dipende dal rapporto
d'aspetto del box, che la firma non vede: stessa classe di approssimazione gia'
accettata per `rounded` (raggio 10px approssimato a rientro nullo), da registrare
in commento. Costo: una riga di tabella.

**Esagono.** Simmetrico su entrambi gli assi, ma profilo orizzontale e verticale
diversi: con smusso al 25%, il rientro orizzontale vale 0.25*|2t-1|, quello
verticale e' nullo nella banda centrale e sale a 0.5 agli estremi. Una sola
funzione scalare non serve entrambi i lati. Serve un secondo profilo opzionale nel
descriptor (`crossInsetFractionAt`, default = `insetFractionAt`), che e'
un'estensione additiva del contratto e lascia le cinque forme attuali
pixel-identiche.

**Parallelogramma e Cilindro.** Rompono la precondizione, ciascuno a modo suo. Il
parallelogramma non e' simmetrico rispetto a nessuno dei due assi (solo
centralmente), il cilindro e' uno dei quattro casi nominati esplicitamente nel
commento D9 (il rettangolo centrato collassa a zero perche' il centro cade dentro
il coperchio). Il piano previsto c'e' gia': `insetFractionAt` diventa opzionale e
queste forme passano dal percorso numerico `boxForContentNumeric`, che **esiste
gia'** (riga 383) ma oggi delega a `contentRect`, quindi va generalizzato per
cercare anche l'offset verticale del rettangolo, come il suo stesso commento
prevede. In piu' `DynamicHandles` ha bisogno di un ripiego per il descriptor senza
profilo (rientro nullo, anchor sul bounding box).

## Proposta di scaglionamento

- **Slice A**: Stadio + Esagono. Perimetro: i sette punti della tabella sopra piu'
  il campo opzionale `crossInsetFractionAt`. Porta Base da 5 a 7 delle 9 tile del
  mockup e sblocca due preset gia' esclusi (Terminator del flowchart sullo stadio,
  entita' esagonali sulle notazioni che le usano).
- **Slice B**: Parallelogramma + Cilindro. Perimetro aggiuntivo: `insetFractionAt`
  opzionale, generalizzazione di `contentRect`/`boxForContentNumeric` all'offset
  verticale, ripiego in `DynamicHandles`. E' il lavoro che il commento D9 ha
  descritto in anticipo, non un imprevisto.

Farle insieme e' possibile ma mette due cambi di contratto nello stesso diff, in
zona §3.1: A e' verificabile visivamente da sola, B ha bisogno del suo smoke.

## Questione aperta di superficie

Il mockup ha le label in italiano («Rettangolo», «Arrotondato»), il catalogo e il
wizard sono in inglese. Tradurre la sezione e' una decisione di lingua dell'intera
UI di authoring, non di queste quattro righe: va deciso separatamente, altrimenti
Base resta l'unica sezione mista.
