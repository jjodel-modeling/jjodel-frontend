# Discovery: stratificazione del box painting per le viste IR (ellipse rotta, border props senza effetto)

Leggi CLAUDE.md prima di iniziare. Leggi docs/claude-code-log.md per il contesto recente.

FASE 1, SOLO LETTURA. Nessuna modifica al working tree. L'hard stop di Fase B resta attivo: niente commit. Unica eccezione ammessa: applicare la decisione A già ratificata (revert del wrapper TRANSACTION a bare `view.ir = draft`, rimozione del commento errato), che è indipendente da questa discovery.

## Contesto (verifica visiva di Alfonso, non ri-verificare)

- Shape rect e rounded: funzionano live. Il fix `:has()` su `.mm-node` è meccanicamente corretto.
- Shape ellipse: il bordo ellittico viene disegnato, ma i figli interni di `.ir-node-content` (title bar, righe field) dipingono sfondi rettangolari che sbordano dalla sagoma e la coprono. Manca il clipping, e il contenuto non è pensato per stare dentro un'ellisse.
- I controlli border del pannello (stile, colore, spessore) non hanno alcun effetto visibile.

Ipotesi di lavoro da verificare, non da assumere: tutte le proprietà visive authored finiscono su `.ir-node-content`, ma il box visibile (border + background) lo dipinge l'antenato `.mm-node`. Se confermata, la direzione del fix è: un solo bridge `:has()` che neutralizza il painting di `.mm-node` quando contiene una vista IR, e il box ridipinto da `.ir-node-content`. Questa discovery serve a dire se è fattibile e cosa rischia di rompere.

## COSA (domande a cui rispondere, con file:riga per ogni risposta)

### 1. Flusso dei border props

- Dal pannello: dove vivono i campi border style/colore/spessore in `VertexAuthoringPanel.tsx` e in quali proprietà del draft IR scrivono?
- I valori raggiungono lo store? (verifica statica del path di commit, come per form)
- Dalla compilazione: dove e come vengono emessi? Inline style su `.ir-node-content`? Regole nel CSS statico per-view (`staticCssFor`, selettore `.ir-view-<viewId>`)? Oppure non sono ancora compilati affatto?
- Se sono emessi: perché non si vedono? (elemento sbagliato, specificità persa contro gli stili base di `.mm-node`, proprietà sovrascritta)

### 2. Mappa del painting di `.mm-node`

- Elenco completo degli stili box di `.mm-node` base: background, border, border-radius, padding, box-shadow, con file:riga (SCSS o BASE_CSS).
- Il CSS statico per-view (`staticCssFor`): che selettore genera esattamente, su quale elemento atterra, con quale specificità rispetto alle regole base.
- Stati interattivi: hover, selected, drag. Quali regole cambiano il painting di `.mm-node` in questi stati? Verrebbero perse neutralizzando il painting base?

### 3. Struttura DOM

- `.ir-node-content` è figlio DIRETTO di `.mm-node`? Chi sono i sibling (handle React Flow, altro)?
- Quali figli di `.ir-node-content` dipingono background propri (title bar, righe compartment)? Con che classi?
- Conferma o smentisci: nello screenshot di Alfonso la classe `ir-shape--ellipse` appariva anche sul wrapper `react-flow__node`. Il grep precedente ha trovato una sola emissione (IRNodeContent:105). C'è una seconda via (className nella definizione del nodo React Flow, effetti DOM, cloneElement)? Se sì, file:riga.

### 4. Fattibilità della ri-stratificazione

Valuta la soluzione candidata:

```css
.mm-node:has(> .ir-node-content) { background: transparent; border-color: transparent; box-shadow: none; }
.ir-node-content { /* replica del box base: background, border, radius */ }
.ir-node-content.ir-shape--ellipse { border-radius: 50%; overflow: hidden; }
```

Rispondi: cosa si rompe? In particolare: staticCssFor per-view che assume il painting su `.mm-node`; stati hover/selected; dimensionamento (chi determina width/height del nodo, `.mm-node` o il contenuto); handle (restano sibling e quindi fuori dal clipping?); viste NON-IR che condividono `.mm-node` (devono restare intatte: il bridge è condizionato alla presenza di `.ir-node-content`, verifica che la condizione sia sufficiente).

Se emerge una soluzione migliore della candidata, descrivila con lo stesso livello di dettaglio, senza implementarla.

## Report (OBBLIGATORIO)

Salva il report in `docs/discovery/discovery_2026-07-22_ir_box_layering.md`. Contenuto minimo: obiettivo, file letti con path completi, findings per ciascuna delle 4 sezioni sopra (con file:riga), rischi individuati, domande aperte per Alfonso. La Fase 1 non è completa finché il report non è scritto.

HARD STOP dopo il report. L'analisi e la decisione sul fix avvengono in chat. Nessuna implementazione, nessun commit.

## DOVE (perimetro di lettura atteso, estendi solo se necessario)

- `VertexAuthoringPanel.tsx`
- `IRNodeContent` e i file della pipeline di compilazione IR (`irResolveCore.ts`, `irStyle.ts`)
- SCSS del nodo: dove è definito `.mm-node` (probabile `diagram.scss` o affine)
- Il punto di generazione di `staticCssFor`

## RIFERIMENTI

- Fix precedente: `irStyle.ts:32-37`, regole `:has()` per rounded/ellipse. Restano nel working tree, non toccarle.
- Il path reattivo (set_ir, computeIRSignature, refToken, render) è verificato e funziona. Non è oggetto di questa discovery.
- Emissione classe shape: IRNodeContent:105.
