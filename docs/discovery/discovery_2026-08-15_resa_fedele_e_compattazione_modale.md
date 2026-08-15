# Discovery breve: resa fedele della striscia e compattazione della modale Symbol

**Data**: 2026-08-15. **Branch**: `alfonso-frontend-jjtl`, HEAD `c45141491`.
**Origine**: cinque rilievi di stile di Alfonso sullo screenshot post-GO D8; slice `fix(editor-v2)`
(tipo chiesto e confermato, P6). Punto 1 deciso: l'area principale resta bianca.
**Natura**: discovery read-only sintetica (corsia veloce, 3 file attesi), report comunque dovuto (P4).

## Ipotesi e obiettivo

Ipotesi da verificare: (a) il CSS di `irStyle` e' globale e una replica DOM nella modale puo'
riusarne le classi; (b) le taglie dei controlli del kit UI discendono da token CSS sovrascrivibili
in scope. Entrambe verificate vere.

## File letti

- `frontend/src/components/editor-v2/viewpoint/ir/irStyle.ts` (integrale)
- `frontend/src/components/editor-v2/viewpoint/authoring/SymbolCatalogPicker.tsx` (:155-175)
- `frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx` (grep import kit, :4)
- `frontend/src/components/ui/{Input,Select,Button,NumberInput,ListEditor}/*` (moduli CSS, grep)
- `frontend/src/styles/tokens.css` (:150-153, :229-231), `styles/variables.scss` (:17)

## Findings

1. **`irStyle` e' globale**: `BASE_CSS` e' iniettato in `document.head` in un tag
   `<style id="ir-views-css">` (`irStyle.ts:14, 126-135`), via `ensureViewCss` chiamata da
   `irResolveCore.ts:12` quando una view entra nell'indice. La modale apre sempre su una view
   indicizzata, quindi le classi (`.ir-node-content`, `.ir-shape--*`, `.ir-label`,
   `.ir-marker-svg`, `.ir-diamond-svg`) sono disponibili nel DOM della modale.
2. **Stato "taglia esplicita" riproducibile inline**: i floor 140x40 (`irStyle.ts:69`) sono
   tolti sul canvas da `.mm-node.ir-sized` (`:110-111`); una replica senza antenato `.mm-node`
   li riproduce con `min-width:0; min-height:0` inline. Le forme geometriche hanno gia' min 0
   (`:82, :86, :94`).
3. **Emissione inline del canvas** (da replicare tale e quale, `IRNodeContent.tsx:169-203`):
   border/background inline solo se autorati e MAI per le forme a painter svg (rombo), che
   portano i valori sul polygon con overdraw per il double; marker in colore bordo con
   `MARKER_VIEWBOX` + `meet`; label con `.ir-label .ir-label--center` (11px, ellissi,
   `irStyle.ts:25-27`): l'ellissi rotta nello screenshot viene dal layer flex custom della
   striscia attuale, non dalle classi canvas.
4. **Taglie del kit da token**: Input md usa `--font-size-lg` (16px, `tokens.css:153`) e
   `height: var(--input-height-base)` (40px, `tokens.css:230`, `Input.module.css:40-43`);
   Select e Button md idem (`Select.module.css:60`, `Button.module.css` size map). I moduli
   sono CSS Modules a classi hashate: la strada pulita e' la RIDEFINIZIONE SCOPED dei token
   sotto la modale, non il puntamento delle classi. `NumberInput` ha 32px cablati
   (`NumberInput.module.css:8`): resta com'e', delta dichiarato.
5. **Scroller del catalogo**: `.symbol-catalog__sections` (`SymbolEditorModal.scss:211-215`);
   aria con `padding-right`, `scrollbar-width: thin`, `scrollbar-gutter: stable`.
6. **Search**: e' il componente `Input` del kit dentro `.jj-field.symbol-catalog`
   (`SymbolCatalogPicker.tsx:160-166`): si compatta con gli stessi token scoped, senza toccare
   il picker.

## Rischi

- La replica eredita anche ombra e radius del canvas: e' il punto ("esattamente come sul
  canvas"), ma l'ombra nel riquadro grigio della striscia va giudicata allo smoke.
- Token scoped: abbassano ogni controllo del kit dentro catalogo e pannello (incluso
  SegmentedControl e ColorPicker); valori proposti 30/26/34px e font 12px, giudizio allo smoke.
- Assi condizionali (fill/marker) restano fuori dalla replica come oggi (baseline scalare
  dichiarata dal messaggio `Conditional form`): nessun cambiamento di semantica.

## Domande aperte

Nessuna bloccante: le decisioni (bianco confermato, tipo fix) sono gia' prese; i valori di
compattazione sono proposte da giudicare allo smoke visivo.
