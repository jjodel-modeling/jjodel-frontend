# Fase B live preview: fix CSS delle classi ir-shape (verdetto probe: ramo CSS)

Leggi CLAUDE.md prima di iniziare. Leggi docs/claude-code-log.md per il contesto recente.

## Diagnosi (CHIUSA, non ri-diagnosticare)

La probe `[irdiag]` e l'ispezione DOM di Alfonso hanno dato il verdetto completo:

- `[irdiag] commit`: `draftForm: 'ellipse'`, `storedForm: 'ellipse'`, `sigChanged: true`. Il token della view editata incrementa a ogni commit (r12, r13, r14) mentre le altre view restano ferme. Write e invalidazione funzionano.
- `[irdiag] IRNodeContent render` logga `form: 'ellipse'` per la view editata. Il render riceve il form nuovo.
- DOM (verificato in DevTools): la classe `ir-shape--ellipse` è presente e si aggiorna live sul wrapper React Flow, su tutte e 3 le istanze State:

```html
<div class="react-flow__node react-flow__node-objectNode nopan selectable draggable ir-shape--ellipse"
     data-id="Pointer1784645026771_USER_235" ...>
  <div class="mm-node mm-object ir-view-Pointer_Probe2_State" data-viewid="Pointer_Probe2_State">
    ...
```

Conclusione: l'intera catena reattiva funziona. Il problema è solo CSS. La classe di forma sta sul wrapper `react-flow__node`, ma il box visibile del nodo lo disegna il div interno `.mm-node`. Una regola applicata al wrapper (che non ha sfondo né bordo) non produce alcun effetto visibile. O la regola `.ir-shape--*` non esiste, o esiste ma punta all'elemento sbagliato.

## COSA

### 1. Discovery breve (read-only)

Grep di `ir-shape` in tutto `src/`:

- dove viene emessa la classe `ir-shape--<form>` sul nodo React Flow (NON toccare quel punto: è il path reattivo che funziona);
- se esiste già una regola CSS `.ir-shape--*`, e dove (BASE_CSS in `irStyle.ts`, SCSS, altro);
- quali valori di form offre la select Shape in `VertexAuthoringPanel.tsx` (elenco completo).

OBBLIGATORIO: salva il report in `docs/discovery/discovery_2026-07-22_ir_shape_css.md` (crea la cartella se manca). Contenuto minimo: obiettivo, file letti con path completi, findings, rischi, domande aperte per Alfonso. Report sintetico va bene, ma il report ci deve essere.

### 2. Fix CSS

Nel punto dove vivono gli stili IR (atteso: BASE_CSS in `irStyle.ts`; conferma via discovery), aggiungi o correggi le regole con selettore discendente che colpisce l'elemento che disegna il box:

```css
.react-flow__node.ir-shape--rounded .mm-node { border-radius: 10px; }
.react-flow__node.ir-shape--ellipse .mm-node { border-radius: 50%; }
```

Decisioni già prese, non deviarci:

- Se esiste già una regola `.ir-shape--*` con selettore sbagliato (per esempio si aspetta la classe direttamente su `.mm-node`): correggi il selettore. NON spostare l'emissione della classe, quel path funziona e non va toccato.
- `rect` è il default: nessuna regola necessaria (o regola esplicita di reset se le altre forme lo richiedono).
- Se esiste già un token/variabile per il radius in `irStyle.ts`, usalo al posto del 10px hardcoded.
- Se la select Shape offre forme oltre rect/rounded/ellipse: coprile se fattibili in CSS puro (per esempio diamond con `clip-path`). Se una forma non è resa bene in CSS puro, lascia un commento `/* TODO: <form> */` e segnalalo nel report finale, senza inventare rese approssimative.
- Verifica che la label del nodo non venga tagliata dentro l'ellipse; se serve, un padding contenuto. Niente over-engineering.

### 3. Strip della probe

Rimuovi completamente la probe `[irdiag]` dai 2 file in cui è stata messa (uno è `VertexAuthoringPanel.tsx`, riga ~88; l'altro è il componente `IRNodeContent`). Diff pulita, solo le righe della probe.

### 4. Verifica build

`npm run build` deve passare senza errori.

## HARD STOP

Dopo la build, FERMATI. Nessun commit. Alfonso verifica visivamente su http://localhost:3001/ con hard refresh: cambio Shape rect, rounded, ellipse sulla vertex view deve aggiornare la forma in live preview su tutte le istanze.

Solo dopo l'OK esplicito di Alfonso nella sessione:

- commit dell'intera Fase B con `git add` dei soli file coinvolti (mai `git add .`), messaggio convenzionale in inglese, una riga (per esempio `feat: vertex authoring panel with live IR preview (phase B)`);
- aggiorna `docs/claude-code-log.md` con l'entry standard (data, tipo, prompt, file toccati, esito, nome documento prompt: 2026-07-22 con ora).

## DOVE

- `irStyle.ts` (BASE_CSS): sede attesa del fix CSS. Path esatto via discovery.
- `VertexAuthoringPanel.tsx`: solo lettura opzioni Shape e rimozione probe. Nessun'altra modifica.
- File di `IRNodeContent`: solo rimozione probe.
- `docs/discovery/discovery_2026-07-22_ir_shape_css.md`: nuovo.
- Nessun altro file. Se ritieni necessario toccarne altri, chiedi prima.

## COME

- Diff minimale. Zero refactoring opportunistico. Mai rinominare identificatori esistenti (le classi CSS sono API interne).
- Prima di introdurre qualsiasi nuovo nome di classe CSS: grep globale per verificare che non sia già in uso.
- Edit puntuali (str_replace), non riscritture di file.

## RIFERIMENTI

- Evidenza probe: righe `[irdiag] commit` con sigChanged true e token incrementali; render con form ellipse; DOM sopra.
- La vecchia ipotesi TRANSACTION resta SBAGLIATA e superata: non toccare `set_ir` né il path di dispatch.
- `irResolveCore.ts`: `computeIRSignature` e `refToken` funzionano correttamente per questo caso; il fix latente del guard `parts.length > 1` è un task separato, NON incluso qui.
