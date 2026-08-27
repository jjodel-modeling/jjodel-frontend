# Prompt — canvas, i cinque punti deferiti (Fase 1 discovery + Fase 2)

> Branch: `alfonso-frontend-jjtl`. Area: editor-v2, resa del canvas. **NON** critical-zone.
> Board di origine: "Jjodel Canvas Redesign", cinque punti deferiti dall'analisi critica.

---

## Fase 1 — discovery (read-only)

Per ciascuno dei cinque punti: dove vive il codice e qual è il meccanismo attuale (path e
righe), il minimo intervento e cosa NON tocca, i rischi di regressione, stima S/M/L e
dipendenze. Poi una partizione proposta: cosa entra in Fase 2, cosa richiede una decisione
di Alfonso, cosa si sconsiglia e perché.

I cinque punti, in ordine di valore atteso:

1. **Routing e anchoring degli archi** — gli archi degradano con nodi vicini o sovrapposti.
   Dove vivono anchor ed edge path? Cosa costerebbe passare al pattern floating edges?
2. **Event label sugli archi** — come sono rese, collidono, c'è un alone?
3. **Fit-all all'apertura** — una volta per tab, e rispettare un viewport salvato.
4. **Minimap** — mai montata? Costo con styling da design system e toggle da View menu.
5. **Neutral default per classifier non renderizzati** — con viewpoint IR attivo, gli
   oggetti la cui metaclasse non ha view devono essere **presenti ma neutri** (slate, bordo
   tratteggiato, nessun colore di metaclasse), coerenti col dimming già fatto nell'albero.

### Vincoli (validi anche per la Fase 2)

- Nessun cambio al modello dati; nessuna libreria nuova oltre ciò che React Flow offre.
- Fronti chiusi intoccati (tree filter, scope bar, densità, ingressi editor viste, undo).
- **R-LAY-19**: niente lettori nuovi del root state nei percorsi editor-v2 — si passa dagli
  indici esistenti (`getIRIndex`, `IRViewpointIndex`).
- **Metamodel-independence**: nessun literal di metaclasse o viewpoint; le verifiche a
  schermo usano fixture sintetiche come la sonda `_tmp_views_editor_entries`.
- Degradazione: viewpoint classico ⇒ i punti 1-2-5 valgono solo dove l'informazione esiste.

---

## Fase 2 — decisioni di Alfonso (2026-08-25)

**Partizione approvata.** Entrano 4, 5, 2a, più 2b e 3. Il punto 1 (routing) è **rinviato**:
d'accordo sul rapporto rischio/beneficio; quando si riaprirà partirà dalla variante piccola
(rettangoli dei nodi a `computeManhattanPath` per il caso "target non davanti") e da una
specifica formale con screenshot su fixture sintetica, che Alfonso preparerà. 2c (de-overlap
generale delle label) rinviato come proposto.

**2b — alone: solo sul `__text`.** Il `!important` deliberato su `.edge-label` non si tocca:
il wrapper resta trasparente. L'alone va su `.edge-label__text`:
`background: var(--color-edge-label-bg)` (token esistente in entrambi i temi, senza
consumatori), padding 1-2px 4px, `border-radius: var(--radius-sm)`. Così l'alone abbraccia il
testo, non il box con i nudge.

**3 — chiave per `(modello, viewpoint)`**, anticipando R-LAY-19 slice 2: due tele dello stesso
modello sotto viewpoint diversi hanno viewport distinti. Obiettivo: **ripristina se c'è, fit
altrimenti** — mai un fit sopra un viewport salvato. Prima azione: misurare l'ipotesi
`rc-dock` senza `cached` (smontaggio a ogni cambio tab); se smentita, fermarsi e riportare
prima di implementare.

**5 — neutro come l'albero: header solo, niente feature.** `nome : Metaclasse` in slate, bordo
`dashed`, nessun colore d'entità, corpo assente. Ragioni: coerenza con la scelta già fatta
nell'albero, e un nodo "non reso dal viewpoint" che mostra tutte le feature si contraddice.

**4 — minimap**: toggle nel View menu (quarta copia dell'idioma Navbar↔EditorV2, default
visibile), colori dai token `--color-minimap-bg` / `--minimap-mask`,
`.editor-v2-minimap-portal` dichiarato morto e non rimosso. I colori per metaclasse restano
fuori (dipendono dal punto 5).

**2a — `irLabelPlacement`**: `UnifiedEdge` lo legge e lo applica (`'above' | 'below'` = segno
del nudge perpendicolare; `'auto'` = comportamento attuale). Dead write chiuso.

### Aggiornamenti dopo la misura su rc-dock

La misura ha **smentito** l'ipotesi dello smontaggio (`DockTabPane.js:72`: con `cached`
assente il pane continua a renderizzare una volta visitato; `destroyInactiveTabPane` non è mai
passato). Decisione di Alfonso: fare il punto 3 lo stesso, con la motivazione ridotta —
sopravvivere a chiusura/riapertura del tab e al reload. Conseguenze sulla verifica:

- la prova «cambio tab → viewport identico» decade come test della persistenza; la
  sostituiscono «pan+zoom → chiudi il tab → riaprilo» e «pan+zoom → reload»;
- la sonda misura anche il **trascinamento del tab in un altro pannello**: se remonta, la
  persistenza lo copre gratis;
- la smentita su rc-dock va documentata nel commit, così la diagnosi sbagliata non riemerge.

### Verifica

- Fixture sintetica (Alpha con view, Beta senza): Beta → nodo neutro slate tratteggiato, solo
  header, nessun colore entità; viewpoint classico/nessuno → Beta piena come oggi.
- Label evento: alone `--color-edge-label-bg` visibile su entrambi i temi;
  `irLabelPlacement: 'above'`/`'below'` sposta la label dal lato giusto; `'auto'` invariato.
- Viewport: pan+zoom → chiusura/riapertura e reload → viewport identico, nessun fit; prima
  apertura senza chiave → fit; due viewpoint sullo stesso modello → due viewport indipendenti.
- Minimap: toggle da View menu persiste (localStorage), colori da token in light e dark.
- `build` verde, `typecheck` baseline, `vitest` invariato, smoke `_tmp_` su fixture sintetica.

### Vincoli aggiuntivi della Fase 2

- Il viewport NON entra nel D-layer né nell'undo.
- **R-LAY-18**: nessun `fitView` nuovo fuori dal callback sync e dai gesti espliciti — il
  ripristino usa `setViewport` / `defaultViewport`, non `fitView`.
