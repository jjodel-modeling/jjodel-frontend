# Discovery: layout a due pannelli della modale Symbol (D15b)

**Data**: 2026-08-15. **Autore**: sessione Cowork, albero `git archive` a `36a789a53` nel container.
**Natura**: mini-discovery confermativa. Origine: confronto di Alfonso fra la modale D15a (colonna
singola, minimale) e la scena modale approvata nel mockup; richiesta di portare il layout alla
qualita' percepita del mockup, con anteprima semplificata (la misura vera D8 arriva dopo) e SENZA
gli elementi D17/D18/D19 (stencil, sezioni con recenti, «Nuova forma»).
Ipotesi da falsificare: che la scena a due pannelli si ottenga senza fork del pannello ne' del picker.

## Obiettivo

Confermare i tre meccanismi del ri-layout: catalogo a colonna persistente, anatomia a due colonne,
anteprima con label. Perimetro: 4 file (`SymbolEditorModal.tsx/.scss`, `SymbolCatalogPicker.tsx`,
`VertexAuthoringPanel.tsx`).

## File letti

- `frontend/src/components/editor-v2/viewpoint/authoring/SymbolCatalogPicker.tsx` (integrale, 103 righe)
- `frontend/src/components/ui/FormSection/FormSection.tsx` (integrale) e la dir del modulo
- `frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx` (gia' integrale in D15)
- `frontend/src/components/editors/views/ViewData.tsx` (righe 56-148, ramo legacy)

## Findings

1. **FormSection usa CSS modules** (`FormSection.tsx:31`, `styles.section` da
   `FormSection.module.css`): le classi sono hashate e NON bersagliabili da SCSS esterno. Il
   selettore stabile e' l'elemento (`section`), ma per la griglia serve un contenitore
   identificabile: i body del pannello oggi hanno SOLO lo style inline di `irTabBodyStyle`,
   nessuna classe. Soluzione: classi stabili additive sui cinque body
   (`ir-tab-body ir-tab-body--<id>`), verificate a zero occorrenze. Lo `display: none` inline
   dell'inattivo vince comunque sulla `display: grid` da stylesheet: il meccanismo R-A resta intatto.
2. **Il picker ha la disclosure interna** (`SymbolCatalogPicker.tsx:41-55`: stato `open`, bottone
   «Browse symbol catalog», bottone «Hide» a riga 66): per la colonna persistente serve una prop
   additiva `variant?: 'disclosure' | 'column'` (default `'disclosure'`, contratto invariato per
   ogni altro mount). In `column`: niente gate, niente «Hide», layout steso dal contenitore.
3. **La sola superficie viva del corpo Appearance e' la modale**: il ramo legacy di ViewData che
   monta il pannello senza `activeTab` (ViewData.tsx:137) e' irraggiungibile per kind vertex (con
   `ir.kind === 'vertex'` la barra e' sempre quella a cinque tab, riga 105). Spostare il picker dal
   corpo Appearance alla colonna della modale non toglie il Browse a nessun altro host.
4. **Lo stato «modificato» sale nella testata della modale** (posizione del mockup): con il picker
   ospitato dalla modale, `lastApplied` vive li'; il chip di stato (preset · modified · custom) e
   «Reset to preset» stanno nell'header. Le aggiunte D15a equivalenti nella sezione Symbol del
   pannello si RILOCANO (si tolgono dal pannello, si rimettono nella modale): un solo posto per la
   memoria di sessione. Il chip di riconoscimento D14 nella sezione Symbol resta.
5. **Percorso di scrittura di apply e reset**: la modale scrive col percorso canonico
   (`view.ir = { ...ir, shape: applyPresetToShape(ir.shape, preset) }`, stesso `set_ir` del
   pannello e di EnableIRPanel); il pannello montato si riallinea con la guardia di reseed di
   D15a. Finestra di gara residua: un edit digitato nei 300 ms prima del click sul preset vince
   sul preset (last-writer-wins, semantica dichiarata e invariata).
6. **Anteprima semplificata**: pseudo-preset dagli assi correnti scalari
   (`typeof form === 'string'`; marker/fill solo se scalari) reso da `SymbolPreview` riscalato,
   con la label della view (`ir.label`, ripiego sul nome) sovrapposta. Niente misura D8, niente
   caption in px: la striscia dice solo cio' che e' vero. Un asse `form` condizionale disattiva
   la striscia (nessuna anteprima falsa).
7. **Collisioni**: `ir-tab-body`, `symbol-editor-modal__catalog`, `variant.*column` a zero
   occorrenze (controllo positivo `recognizeSymbol` a segno).

## Rischi

- Il selettore della griglia dipende dalle classi nuove dei body, non da nth-of-type: robusto ai
  body futuri. Le colonne si applicano SOLO nel contesto della modale: il pannello altrove resta
  a colonna singola.
- Fuori scope ribadito: sezioni con contatori e recenti (D18), stencil e «Salva come stencil»
  (D17), «Nuova forma» (D19 chiusa), misura reale in anteprima (slice D8-preview). Il filtro
  notazione resta la Select esistente (i chip di notazione arrivano con D18).

## Domande aperte per Alfonso

Nessuna bloccante: perimetro e semplificazioni gia' scelti in chat (D15b ora; anteprima
semplificata; niente elementi D17/D18/D19).
