# 2026-08-29 19:00 — structure_7a_style

Allineamento visivo del solo tab Structure all'artboard 7a di
`docs/design/design_handoff_instance_node/Instance Node Proposal.dc.html`.
Corsia veloce (RC-3): solo stile, due file, nessuna logica e nessun tocco all'IR.

## Perimetro dichiarato dal prompt

`frontend/src/components/editor-v2/viewpoint/authoring/StructureGroups.scss`, piu'
eventuali classi in `StructureGroups.tsx`. Nessun altro body del rail. Token del
design system dove esistono, ma i valori risolti devono essere quelli di 7a.

Il `.tsx` ha preso esattamente due cose: un `<div className="ir-structure-group
ir-structure-group--name|--accent|--compartment">` attorno a ciascuno dei tre
`FormSection`, e `className="ir-structure-group__help"` sui cinque `HelpText`.
Nessuna espressione, nessun handler, nessun default toccato. Il wrapper e' cio' che
rende lo scope reale: i primitivi condivisi (`SegmentedControl`, `Select`,
`ColorPicker`, `HelpText`, `FormSection`) sono CSS Modules con classi hashate, quindi
la ristilatura passa per selettori strutturali e ARIA — e senza wrapper avrebbe
raggiunto anche il `FieldCompartmentListEditor`, che vive nello stesso body.

## Mappa token -> valore 7a

| 7a | token usato | risolve a |
|---|---|---|
| label riga | `--color-form-label` | `#475569` |
| eyebrow, help, chevron | `--color-form-muted` | `#94a3b8` |
| segmento inattivo, hex | `--color-form-section` | `#64748b` |
| track segmented | `--color-form-border` | `#e2e8f0` |
| bordo select | `--color-form-border-strong` | `#cbd5e1` |
| segmento attivo, valore select | `--color-text-primary` | `#0f172a` |
| fondo segmento attivo, hairline | `--color-slate-100` | `#f1f5f9` |

`--color-slate-100` e' un primitivo tema-invariante (`styles/tokens.css`): i due punti
che lo usano hanno una controparte `html[data-theme='dark']` in coda al foglio, nella
stessa forma che `ListEditor.module.css` usa per le sue superfici chiare literal.
Restano literal solo il gap interno di 10px e l'inset di 14px del separatore, che non
stanno sulla griglia da 8px e non hanno token.

## Scostamenti dichiarati

1. **Padding del body 12px, non 14.** Il prompt chiede 14px. Il padding e' di
   `.properties-panel` (`components/editors/info.scss:414`, `padding: var(--space-3)`),
   condiviso da ogni tab del rail: portarlo a 14 li sposta tutti. Non toccato.
2. **La card «Field compartments» del mock non e' implementabile come stile.** In 7a e'
   una riga riassuntiva collassata — icona `bi-list-columns`, id, «4 features» a destra.
   Nel codice la sezione e' un `FieldCompartmentListEditor` (`ListEditor`) sempre
   aperto, con Id / Title / Source / Row segments / Row style / Visible per voce: non
   esiste uno stato collassato da stilare, e il conteggio delle feature non e' calcolato
   li'. Presa solo la eyebrow della sezione, allineata alle altre tre; il corpo
   dell'editor resta invariato. Chiuderla come il mock e' una micro-voce di UI, non
   di CSS.
3. **I valori citati nelle righe di motivo restano non evidenziati.** 7a stampa
   «Header band available because the Symbol is **Rectangle**» col nome della forma in
   `#64748b`/500. `namePositionReason` e le sue sorelle
   (`viewpoint/ir/structureCapabilities.ts:179-196`) ritornano una stringa piatta:
   l'evidenziazione vuole markup nel modulo delle capability, fuori dal perimetro.

## Due misure che hanno cambiato il diff

- **L'altezza del select non viene dal primitivo.** `.selectSm` mette 32px, ma il valore
  osservato era 36 con larghezza 200. La regola che vince e' `.view-editor-root select`
  (`components/forEndUser/color.scss:667`: `height: var(--select-height)` 36px,
  `min-width: var(--select-width)` 170px), stessa specificita' (0,1,1) della classe del
  primitivo e piu' avanti nell'ordine sorgente. Da qui l'ancoraggio del blocco su
  `.ir-tab-body--structure` — (0,2,1) — e le tre proprieta' di taglia tutte ridichiarate
  (`width: auto`, `min-width: 0`, `height: 28px`). Risultato misurato: 110x28.
  Lo stesso accade a `input[type='text']` per via di `styles/components/_form-system.scss:42`.
- **L'icona `bi-info-circle` non mancava per caso.**
  `properties-with-tree-view.scss:689` la spegne (`display: none`) dentro tutta la card
  Properties, con la motivazione B4 esplicita: «in the mockup a hint is a quiet line of
  text, not an annotated callout». 7a la disegna. Ripresa a (0,3,2) solo sotto questo
  body; la regola della card resta in piedi ovunque altro si applichi. Il `font-size`
  del glifo arriva **inline** dal primitivo (`HelpText.tsx`, `var(--icon-size-sm)` =
  14px): l'unico modo di raggiungerlo e' `!important`, ed e' l'unico del foglio.

Terza nota minore: la riga Type ha quattro segmenti (Inline / Chip / Badge / Hidden)
contro i tre del mock, e a `max-width: 62%` il track andava a capo dentro un bordo
arrotondato con `overflow: hidden` — 55.6px di altezza invece di 28.8. La colonna dei
controlli e' salita a 72%.

## Verifica

`_tmp_structure_7a.ts` (non committata) apre il rail vero sulla demo IR, apre il tab
Structure, fotografa il body e legge lo stile calcolato di ogni controllo che 7a
specifica; girata su HEAD (`before`) e sulla modifica (`after`). Numeri nella entry di
log del 2026-08-29. `_tmp_structure_tab.ts`, la sonda di comportamento 7a/7b gia'
esistente, resta **22/22** invariata.
