# Discovery (read-only): aggiunta shape `circle` e `diamond` al sistema IR

> Fase 1 di un two-phase. **Read-only: nessun edit al codice.** L'unico file che
> puoi scrivere è il discovery report (vedi sezione dedicata). Al termine, HARD STOP.

Leggi `CLAUDE.md` prima di iniziare. Leggi `docs/claude-code-log.md` per il contesto recente
(in particolare il filone faseB shape CSS del 2026-07-22 e il resize shape del 2026-07-24).

## Contesto e obiettivo finale (NON implementare ora)

Oggi il sistema IR offre tre form di shape per le vertex view: `rect` (default), `rounded`,
`ellipse`. Vogliamo aggiungerne due:

- **`circle`**: identico a `ellipse` (border-radius 50%) ma con **aspect ratio bloccato 1:1**
  (`keepAspectRatio` acceso sul resizer per questo form). Ellipse resta a proporzioni libere:
  decisione confermata, non toccarla.
- **`diamond`**: rombo reso con un **layer SVG** dietro il contenuto, con `fill` e
  `stroke`/`stroke-width`/`stroke-dasharray` presi dagli stessi valori di border/fill risolti
  che oggi vengono dipinti inline su `.ir-node-content`. Motivo della scelta SVG (già decisa,
  non rimetterla in discussione): è l'unico approccio che rende un bordo fedele (stile, colore,
  spessore, dashed/dotted) a qualsiasi aspect ratio; clip-path taglia lo stroke, il rotate+scale
  lo distorce sui rombi non quadrati.

Questa è **solo la discovery**. Serve a mappare i punti d'innesto reali prima che io (nella chat
di progetto) scriva il prompt di implementazione. **Non scrivere codice di feature.**

## COSA mappare (con `file:riga` per ogni finding)

1. **Union dei form.** Dove è dichiarato il tipo/enum dei valori di shape form
   (`rect | rounded | ellipse`): nome esatto del tipo, file, riga. È nello schema `.ir`?
   In un file di tipi di `editor-v2`? Riporta la dichiarazione verbatim e ogni punto che la
   referenzia (grep globale del tipo e dei letterali `'ellipse'`, `'rounded'`, `'rect'`).

2. **Select Shape nel pannello.** In `VertexAuthoringPanel.tsx`: l'elenco completo delle option
   Shape offerte, con riga. Verifica e riporta **se e dove questo file ha ancora l'hard stop
   attivo per il bug feature-picker** (memo che risolve la metaclasse per nome, ~righe 84-106):
   voglio sapere se aggiungere una `<option>` alla select è fisicamente lontano da quel memo o
   se insistono sulle stesse righe. Non modificare nulla.

3. **Emissione della classe `ir-shape--<form>`.** Dove viene calcolata e applicata la classe
   `ir-shape--<form>` sul nodo React Flow (è il path reattivo che funziona: **non toccarlo**,
   solo localizzarlo con file:riga).

4. **Painting attuale di border e fill (path faseB).** In `IRNodeContent` (o dove risiede oggi):
   come vengono risolti e applicati **border e fill inline su `.ir-node-content`** — quali valori
   risolti esistono (oggetto `compiled.border`? `fill`?), la loro forma (width, style, color) e
   il punto esatto in cui diventano stile inline. Questo è il dato chiave: il layer SVG del diamond
   dovrà attingere agli **stessi valori risolti** e, per il solo form diamond, `.ir-node-content`
   dovrà **sopprimere** il proprio border/fill rettangolare (altrimenti si vede un bordo quadrato
   dietro il rombo). Riporta come è strutturato oggi il calcolo così posso disegnarci sopra
   la soppressione condizionale senza rompere gli altri form.

5. **CSS delle shape.** In `irStyle.ts` (BASE_CSS) o dove vivono le regole IR: le regole
   `.ir-node-content.ir-shape--*` esistenti (rounded, ellipse) verbatim, con file:riga. Conferma
   che il radius è applicato su `.ir-node-content` e non sull'antenato `.mm-node` (post
   ri-stratificazione faseB). Riporta anche eventuali token/variabili di radius.

6. **Resize / aspect ratio.** Dove è configurato il `NodeResizer` per i nodi shape (atteso:
   `nodeSizing.ts` e/o `ObjectNode.tsx`, ramo IR). In particolare: come è impostato `keepAspectRatio`
   oggi (la decisione faseB era OFF per ellipse), e dove aggancerei il lock 1:1 per il solo form
   `circle`. File:riga.

7. **Scaffolding poligonale riusabile (opzionale ma utile).** Grep di `clipPath`, `makePolygon`,
   `Polygon`, `Star`, `sides` in tutto `src/`: esiste ancora codice (anche morto/legacy del
   classico) che genera path/clip di poligoni e che potrei riusare o da cui prendere le formule
   per il diamond SVG? Se sì, dove; se no, dillo esplicitamente.

## Report OBBLIGATORIO

Al termine della discovery salva il report in:

```
docs/discovery/discovery_2026-07-24_shapes_circle_diamond.md
```

Crea la cartella `docs/discovery/` se non esiste. Contenuto minimo del report:
obiettivo della discovery, elenco dei file letti con **path completi**, i sette findings sopra
con `file:riga`, dipendenze e rischi individuati (specialmente sul punto 4, il path faseB),
domande aperte per Alfonso. Report sintetico va bene, ma il report **ci deve essere**:
l'analisi in chat parte dal report salvato, non dalla memoria di sessione.

## HARD STOP

Dopo aver scritto il report: **FERMATI**. Nessun edit al codice di feature, nessun commit del
codice. Il report puoi lasciarlo nel working tree oppure committarlo da solo con `git add` del
**solo** file del report (mai `git add .`, mai `git commit -a`), messaggio `docs: discovery shapes
circle/diamond`. Poi torna in chat con il contenuto del report. Il prompt di implementazione lo
scrivo io dopo aver letto i findings.

## DOVE (path candidati — CONFERMALI, non assumerli)

- `frontend/src/components/editor-v2/nodes/ObjectNode.tsx` (ramo IR, resize)
- `frontend/src/components/editor-v2/nodes/nodeSizing.ts` (se esiste, dopo il resize task del 24/07)
- `VertexAuthoringPanel.tsx` (select Shape + hard stop feature-picker — path esatto da confermare)
- `irStyle.ts` (BASE_CSS, regole `.ir-shape--*` — path esatto da confermare)
- Componente `IRNodeContent` (painting border/fill inline — path esatto da confermare)
- Schema/tipi `.ir` (union dei form — path da confermare)

Se un file atteso non c'è sul branch corrente, **non concludere che non esiste**: segnalalo nel
report e chiedi ad Alfonso su quale branch guardare.

## COME

- Solo lettura. Leggi i file interi (o le sezioni rilevanti), grep globali per i nomi e i letterali.
- Zero modifiche al codice. Nessun refactoring, nessun rename.
- Non toccare la critical zone (`useJjomSync.ts`, `portDistribution.ts`) né il memo del
  feature-picker in `VertexAuthoringPanel.tsx`.

## RIFERIMENTI

- Filone faseB shape CSS + ri-stratificazione box painting: entry di `docs/claude-code-log.md`
  del 2026-07-22 (fix shape css, painting su `.ir-node-content`, neutralizzazione `.mm-node`
  via `:has(> .ir-node-content)`).
- Resize shape / content-hug: entry del 2026-07-24 (decisione `keepAspectRatio` OFF per ellipse,
  eventuale `nodeSizing.ts`).
- Vocabolario poligonale del classico (contesto per il punto 7): `Ellipse`, `Rectangle`,
  `Polygon` (con `sides` + `makeClipPath(makePolygon(...))`), `Star`.
