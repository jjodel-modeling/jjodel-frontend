# Discovery (read-only): size di default sulla view + blocco al lock + traduzione UI

> Fase 1 di un two-phase. **Read-only: nessun edit al codice di feature.** L'unico file
> che puoi scrivere e' il discovery report. Al termine, HARD STOP.

Leggi `CLAUDE.md` prima di iniziare. Leggi `docs/claude-code-log.md` per il contesto recente
(flag `resizable` e propagazione size, entrambi appena landati).

Branch di lavoro: `alfonso-frontend-jjtl`.

## Contesto e modello ratificato (Fase 2, NON implementare ora)

Bug osservato: deselezionando "Resizable" il box rimbalza alla dimensione content-hug (il neutralizer
`ir-resizable` si emette solo quando `canResize`, quindi con `resizable:false` sparisce). Alfonso
vuole invece che **bloccare fissi la dimensione corrente come nuovo default**.

Modello ratificato dei tre stati di `resizable`:
- **undefined** → segue la forma (content-hug), come oggi.
- **true** → resizable (maniglie), size per-istanza; la propagazione per-istanza gia' landata resta.
- **false (bloccato)** → niente maniglie, box **fisso** a una size di **default della view**: nuovo
  campo opzionale `size?: { w: number; h: number }` su `VertexViewIR`, **catturato al momento del
  blocco** dalla size del nodo sorgente, condiviso da tutte le istanze, **durevole** perche' vive in
  `view.ir` (nessun read-back sul transformer, nessuna scrittura `DVertex.w/h`).

Inoltre: **tradurre in inglese tutte le stringhe italiane dei pannelli di authoring** (piegato nel
fix). Vedi Q6.

Nota di layer (da confermare, orienta lo scope): si scrive **solo `view.ir`** (come il flag
`resizable`, via `set_ir`/`SetFieldAction`), **non** `DVertex.w/h`, **non** `canvasToJjom`. Quindi
**niente critical zone, niente LIR** atteso. Conferma questa assunzione nel report.

Questa e' **solo la discovery**. Non scrivere codice di feature.

## COSA mappare (rispondi a OGNI punto con `file:riga` e citazioni verbatim)

### Q1 - Schema `size` su `VertexViewIR`
Punto esatto dove aggiungere `size?: { w: number; h: number }` (dopo `resizable?`, `irTypes.ts`).
Grep che `size`/`w`/`h` non collidano gia' su quel tipo. Read path: si legge via
`(irResolution.compiled.ir as VertexViewIR).size` (Opzione A, come `resizable`), o conviene un campo
su `CompiledView`? Verifica se il compile va toccato (probabile di no, `compiled.ir` conserva l'oggetto).

### Q2 - Render del box alla size fissa della view (incognita principale 1)
Come ObjectNode puo' forzare il box a `compiled.ir.size` quando bloccato, in modo che:
(a) valga **a render** senza scrivere `DVertex.w/h`;
(b) **sopravviva al reload** (la size vive in `view.ir`, letta dalla risoluzione a ogni render).
Mappa come oggi la size arriva al box: `objectVertexToRFNode` NON emette width/height (finding della
discovery propagazione), il box e' content-hug o preso da `node.width/height` (in sessione). Opzioni
da valutare con `file:riga`:
- **inline style** `width/height` sul wrapper `.mm-node` che ObjectNode controlla (`ObjectNode.tsx`
  ramo IR, dove compone className/style del root);
- oppure settare `node.width/height` nell'array RF (setNodes/effect) — meno desiderabile, e' quello
  che si perde al reload.
Verifica: RF rispetta un inline style width/height del contenuto del nodo per il layout e per
l'ancoraggio degli edge (`computeOptimalHandles` legge `raw.w/raw.h`)? C'e' un rischio che l'edge si
sganci se la size visiva non e' riflessa in `raw.w/raw.h`? Riporta la catena DOM del nodo IR
(`.mm-node` → `.ir-node-content`) e chi porta la dimensione.

### Q3 - Gate del neutralizer + marker
Oggi `ir-resizable` e' emesso quando `canResize` (`ObjectNode.tsx`, marker su `.mm-node`;
`irStyle.ts` regola `.mm-node.ir-resizable`). Per non far rimbalzare il box bloccato, il render a
size esplicita deve valere quando `resizable` e' **definito** (true O false). Proponi: mantenere
`ir-resizable` cambiando la condizione di emissione, oppure un marker distinto (es. `ir-sized`) per
lo stato "size esplicita". Verifica come si compongono in CSS il neutralizer (`width/height:100%`,
azzera il floor 140×40) e un **width/height fisso** in px: il fisso deve vincere sul content-hug
senza che il floor `.mm-node` a 140 lo blocchi. Riporta `file:riga` di marker e regola.

### Q4 - Cattura al lock, senza corsa col commit del pannello (incognita principale 2)
Quando la checkbox passa **true→false**, la size corrente del nodo sorgente va scritta in
`view.ir.size`. Il pannello **non** ha accesso al canvas (riceve solo `{ view }`). Mappa:
- Chi conosce la size del nodo sorgente: EditorV2 (come per la propagazione, `getNodes()` +
  `measured?.width ?? width`). Riporta `file:riga`.
- **Il problema dei due writer su `view.ir`**: il pannello committa `view.ir = draft` (debounced,
  `VertexAuthoringPanel.tsx` ~:65-77). Se anche EditorV2 scrive `view.ir.size`, i due possono
  correre e sovrascriversi. Proponi il wiring pulito: p.es. su uncheck il pannello **non** patcha
  `resizable` da solo, ma dispatcha un evento (`LOCK_VIEW_SIZE` o simile) e **EditorV2** scrive in un
  colpo `view.ir = { ...ir, resizable:false, size:{w,h} }` leggendo la size dal nodo sorgente;
  all'inverso, riabilitare (false→true) resta un patch normale del pannello. Verifica che questo non
  confligga col seed/commit del pannello (il draft si ri-seeda da `view.ir`?). Riporta il flusso
  esatto di seed/commit (`:48`, `:65-77`, `set_ir`).
- Regola sorgente: riusa quella della propagazione (un solo object node selezionato che risolve alla
  view; 0 o >1 → no-op con avviso).

### Q5 - Quando `size` si applica e interazioni
Conferma: `size` si applica **solo** in stato `resizable:false`. Con `resizable:true` resta il
per-istanza (propagazione shippata) e `size` e' ignorato (o usato come default iniziale? proponi ma
default = ignorato per minimalita'). Con `undefined` resta content-hug, `size` ignorato. Edge case:
bloccare senza aver mai ridimensionato (la size catturata = content-hug corrente del sorgente);
riabilitare da bloccato (torna resizable, `size` resta in view.ir ma inerte finche' non ri-bloccato,
oppure va pulito? proponi: lasciarlo, e' il default memorizzato).

### Q6 - Traduzione: enumerazione stringhe italiane (per la Fase 2)
**Grep** ed elenca con `file:riga` e testo verbatim TUTTE le stringhe italiane hardcoded nei pannelli
di authoring editor-v2: `VertexAuthoringPanel.tsx`, `RowAuthoringPanel.tsx`, `EnableIRPanel.tsx`, e
`EdgeAuthoringPanel.tsx`/`MatchingSection.tsx` se esistono, piu' eventuali componenti condivisi di
authoring (`viewpoint/authoring/`). Esempi visibili da tradurre: hint Resizable "Forza le maniglie di
resize. Deseleziona per bloccarlo. Non impostato: segue la forma.", "Propaga dimensione", "Fisso",
"Condizionale", "Stile". Proponi per ciascuna la resa inglese. **Non** enumerare stringhe fuori dai
pannelli di authoring (niente sweep dell'intera app). Verifica se esiste un meccanismo i18n o se sono
literal inline (probabile inline).

## Discovery report (OBBLIGATORIO)

Salva in `docs/discovery/discovery_2026-07-27_size_default_lock.md` (crea la cartella se manca).
Naming `discovery_<data>_<descrizione>.md`. Contenuto minimo: obiettivo; file letti con path
completi; findings Q1..Q6 con `file:riga` e citazioni; **verdetto di layer** (si scrive solo
`view.ir`? confermato niente D-layer/critical-zone?); meccanismo di render proposto (Q2) e wiring di
cattura proposto (Q4, con la soluzione anti-corsa); tabella delle stringhe da tradurre (Q6); rischi;
domande aperte. L'hard stop non e' completo finche' il report non e' scritto.

## HARD STOP

Dopo il report, **FERMATI**. Nessun edit al codice, nessun commit, nessun `git add`. Restituisci in
chat la sintesi Q1..Q6, il verdetto di layer, e la lista file che la Fase 2 dovra' toccare (proposta),
cosi' scrivo il prompt di implementazione (fix lock + traduzione in un commit tematico).

## RIFERIMENTI

- Gate/render resize: `nodes/ObjectNode.tsx` (ramo IR, `canResize`, marker `ir-resizable`,
  `<NodeResizer>`), `nodes/nodeSizing.ts` (`defaultResizableForForm`, `SHAPE_MIN_SIZE`),
  `viewpoint/ir/irStyle.ts` (`.mm-node.ir-resizable`, floor).
- Schema/read: `viewpoint/ir/irTypes.ts` (`VertexViewIR`, `resizable?`, `CompiledView.ir`),
  `viewpoint/ir/irResolve.ts` (`IRViewResolution`).
- Pannello: `viewpoint/authoring/VertexAuthoringPanel.tsx` (checkbox Resizable, bottone Propaga,
  seed `:48`, commit debounced `:65-77`, `patch`), `view/viewElement/view.tsx` (`set_ir`).
- Sorgente/enumerazione (riuso propagazione): `EditorV2.tsx` (listener `PROPAGATE_VIEW_SIZE` appena
  aggiunto, `getNodes`, resolver `resolveIRView`), `events/registry.ts`.
- Geometria edge: `utils/jjomTransformers.ts` (`computeOptimalHandles` legge `raw.w/raw.h`,
  `objectVertexToRFNode` non emette width/height).
- Feature landate: `2026-07-27_prompt_fase2_resizable_flag.md`, `2026-07-27_prompt_fase2_size_propagation.md`
  e i rispettivi report in `docs/discovery/` (KB / repo).
