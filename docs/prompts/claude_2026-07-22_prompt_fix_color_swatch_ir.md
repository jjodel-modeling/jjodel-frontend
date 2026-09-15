# Fix: lo swatch colore (Fill/Border) nel pannello IR lascia spazio bianco intorno al colore

**Tipo**: fix (visivo, CSS). **Branch**: `alfonso-frontend-jjtl`. **Critical zone**: nessuna. **LIR**: not-required.

## Contesto

Nel pannello IR (Properties region, vertex authoring panel: le righe Fill e Border viste nello screenshot allegato da Alfonso in chat) ogni riga colore mostra uno swatch quadrato con angoli arrotondati accanto al campo di testo con il valore hex (es. Fill `#387dc2`, Border `#d31212`). Il colore selezionato non riempie l'intero swatch: c'è un margine bianco/chiaro visibile tra il bordo esterno dello swatch e il riempimento colore effettivo, come se il colore fosse dipinto su un rettangolo più piccolo del contenitore invece che a piena grandezza.

Il risultato atteso: il colore selezionato riempie tutto il background dello swatch, bordo a bordo, senza spazi bianchi intorno. Il bordo esterno sottile e il border-radius dello swatch restano come sono oggi (non è una richiesta di restyling, solo di rimuovere lo spazio vuoto interno).

Non ho lo screenshot esatto pixel-perfect da darti come file, quindi la Fase 1 sotto serve anche a localizzare con certezza il componente e la regola CSS responsabile, prima di toccare codice.

## Fase 1 — Discovery (read-only, obbligatoria)

Obiettivo: individuare il componente che renderizza lo swatch colore nelle righe Fill/Border del pannello IR, e la regola (CSS/SCSS o inline style) che crea lo spazio vuoto tra il bordo dello swatch e il riempimento colore.

Punti di partenza per la ricerca (grep ricorsivo in `frontend/src`):
- Componente color picker riusabile in `components/ui/` (primitiva citata come `ColorPicker` nei prompt precedenti di questo stesso pannello) o eventuale componente locale dentro `components/editor-v2/viewpoint/authoring/` (dove vive `VertexAuthoringPanel.tsx`).
- Cerca pattern tipo `type="color"`, `swatch`, `color-preview`, `colorpicker`, e le stringhe letterali `Fill` / `Border` usate come label nelle righe del pannello, per risalire al file corretto.
- Se esistono più punti d'uso dello stesso componente swatch (es. anche nel color scheme selector o nelle custom palette, che sono feature distinte e già esistenti), verificalo: il fix deve toccare solo l'istanza/lo stile usato nel pannello IR, a meno che il componente sia condiviso e lo stesso bug sia visibile ovunque sia usato (in quel caso segnalalo prima di allargare lo scope).

**Report obbligatorio**: salva `docs/discovery/discovery_2026-07-22_ir_color_swatch_padding.md` con: obiettivo, file letti (path completi), il componente e la riga/regola esatta responsabile dello spazio bianco (padding sul contenitore che ha il background-color, oppure un elemento figlio più piccolo del contenitore, oppure inset box-shadow, oppure altro), altri punti d'uso dello stesso componente trovati, rischi, domande aperte.

**Hard stop dopo la Fase 1**: fermati dopo aver scritto il report. Non procedere alla Fase 2 senza go-ahead.

## Fase 2 — Fix (dopo go-ahead)

Rimuovi lo spazio vuoto tra il bordo esterno dello swatch e il riempimento colore:
- Se la causa è un padding sul contenitore che porta il `background-color`, azzeralo (o spostalo su un livello che non intacchi il colore).
- Se la causa è un elemento figlio dedicato al colore con dimensioni ridotte rispetto al contenitore, allarga quel figlio a riempire il contenitore (`width: 100%; height: 100%` o inset a 0), oppure applica il colore direttamente al contenitore se non ci sono altri motivi per l'elemento separato.
- Mantieni invariati: bordo esterno (spessore/colore), border-radius, dimensione complessiva dello swatch, focus ring/stato hover se presenti, il campo hex accanto, lo stepper `+ / -` e il select "Solid" visibili nella riga Border.
- Nessuna rinomina di classi o variabili esistenti. Nessun refactoring del componente oltre alla riga/regola necessaria per il fix.

### Verifica

- `npm run build` verde.
- Nessuna regressione visiva negli altri punti d'uso dello stesso componente (se emersi in discovery), a meno che il fix sia stato scoped esplicitamente al solo pannello IR.

**Hard stop**: dopo la build, fermati per la verifica visiva di Alfonso su `localhost:3001` (hard refresh): swatch Fill e Border pieni bordo a bordo, nessun altro elemento della riga toccato, nessun layout shift.

Al suo OK esplicito: commit (`git add` dei soli file coinvolti, mai `git add .`), messaggio tipo `fix(editor): fill color swatch background edge-to-edge in IR panel`. Aggiorna `docs/claude-code-log.md` con l'entry standard (data/ora nel nome del documento prompt: 2026-07-22).

## DOVE

Da confermare in Fase 1. Atteso: il file del componente swatch colore (in `components/ui/` o `components/editor-v2/viewpoint/authoring/`) ed eventuale SCSS associato. Nessun altro file, salvo scoperte impreviste in discovery da segnalare prima di procedere.

## RIFERIMENTI

- Screenshot di Alfonso in chat (non allegabile qui): due righe, "Fill" con swatch blu `#387dc2` e "Border" con swatch rosso `#d31212` + stepper spessore (1) + select stile (Solid). In entrambe le righe lo swatch mostra un margine chiaro visibile tra il bordo esterno arrotondato e il colore pieno.
- `claude/2026-07-21_prompt_authoring_faseB_panel.md` e `claude/sessione_2026-07-22_2.md` (knowledge base progetto): contesto del vertex authoring panel e delle primitive `components/ui/*` riusate per Fill/Border.
