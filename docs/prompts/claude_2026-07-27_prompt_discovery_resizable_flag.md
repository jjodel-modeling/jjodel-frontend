# Discovery (read-only): flag `resizable` sulle vertex view IR + gate rect/rounded

> Fase 1 di un two-phase. **Read-only: nessun edit al codice di feature.** L'unico file
> che puoi scrivere e' il discovery report (vedi sezione dedicata). Al termine, HARD STOP.

Leggi `CLAUDE.md` prima di iniziare. Leggi `docs/claude-code-log.md` per il contesto recente
(in particolare il filone resize/shape del 23-24/07: `nodeSizing.ts`, `isNodeResizable`,
`SHAPE_MIN_SIZE`, shape circle/diamond, e il lavoro R3 preserve-verbatim del 25/07).

Branch di lavoro: `alfonso-frontend-jjtl`.

## Contesto (RCA gia' fatta in chat, NON reimplementare)

Due osservazioni di Alfonso: (1) i nodi shape `rect` e `rounded` non hanno le maniglie di
resize, mentre `ellipse`/`circle`/`diamond` si'; (2) serve un flag `resizable` per bloccare o
abilitare il resize per view.

Root cause del punto 1 gia' individuata (conferma i `file:riga` reali, possono essere shiftati):
in `frontend/src/components/editor-v2/nodes/ObjectNode.tsx`, ramo IR:

```ts
// ~:355
const shapeForm = irResolution.compiled.form(irResolution.readCtx, irResolution.objectId);
// ~:356
const hasGeometricShape = shapeForm === 'ellipse' || shapeForm === 'circle' || shapeForm === 'diamond';
// ~:358
{isNodeResizable('objectNode', hasGeometricShape) && ( <NodeResizer ... /> )}
```

`hasGeometricShape` enumera solo ellipse/circle/diamond; rect e rounded cadono a `false`, e
`isNodeResizable('objectNode', false)` restituisce `false` perche' `NODE_SIZING_DEFAULTS.objectNode`
e' `{adaptWidth:true, adaptHeight:true}`: il `NodeResizer` non viene montato. Non e' CSS.

`shape` e' un campo **obbligatorio** di `VertexViewIR` (`irTypes.ts`), con `form: Conditional<ShapeForm>`
che default a `'rect'`: quindi ogni vertex view (inclusi i box a compartimenti) ha `form='rect'`
quando non si sceglie una shape. Per questo non si puo' semplicemente aggiungere rect/rounded a
`hasGeometricShape`: si rimonterebbe il resizer su tutti i box content-hug. Serve un segnale esplicito.

## Decisioni ratificate da Alfonso (design della Fase 2, NON implementare ora)

Non rimetterle in discussione; servono solo a orientare cosa mappare.

- **Sede del flag**: nuovo campo **opzionale** `resizable?: boolean` su `VertexViewIR` (aggiungere
  una proprieta' opzionale e' consentito da CLAUDE.md). Per la v1 un `boolean` semplice, NON un
  `Conditional<boolean>` (estensione futura, fuori scope ora).
- **Gate finale previsto** (Fase 2): `const canResize = <resizableRisolto> ?? hasGeometricShape;`
  poi `isNodeResizable('objectNode', canResize)`. Flag esplicito vince; se assente, comportamento
  di oggi identico (backward-compatible, zero regressioni).
- **Default invariato**: quando `resizable` NON e' impostato, resta l'euristica attuale (solo
  ellipse/circle/diamond resizable). rect/rounded diventano resizable solo con `resizable:true`.
- **Blocco**: `resizable:false` su qualsiasi shape (anche ellipse/circle/diamond) rimuove le maniglie.
- **Quando il resizer e' montato su rect/rounded**: `minWidth/minHeight = SHAPE_MIN_SIZE`, aspect
  libero. `keepAspectRatio` resta attivo **solo** per `circle` (non estenderlo a rect/rounded).
- **UI**: checkbox "Resizable" nel `VertexAuthoringPanel`, lontano dal memo feature-picker.
- **Scope**: solo vertex view IR. Fuori scope: object/class/enum nativi (restano content-hug),
  gli edge, l'editor classico.

Questa e' **solo la discovery**: mappare i punti d'innesto reali e, soprattutto, verificare che
un campo opzionale nuovo sopravviva all'intero ciclo compile / validate / save / reload senza
essere droppato. **Non scrivere codice di feature.**

## COSA mappare (rispondi a OGNI punto con `file:riga` e citazioni verbatim)

### Q1 - Accesso alla view risolta in ObjectNode (incognita principale)
Nel ramo IR di `ObjectNode.tsx`, l'oggetto `irResolution` da cui viene letto `compiled.form(...)`:
espone la **view IR grezza risolta** (l'oggetto `VertexViewIR`, con eventuale `.resizable`), oppure
solo `compiled`, `readCtx`, `objectId`? Riporta la forma esatta di `irResolution` (tipo/interfaccia,
`file:riga`) e da dove viene costruito. Questo decide il read path del flag in Fase 2: se esiste la
view grezza si legge `view.resizable`; altrimenti il flag deve passare da `compiled` (e allora la
Q3 diventa obbligatoria per la scrittura). Riporta il nome esatto della variabile/campo da usare.

### Q2 - Schema `VertexViewIR`
In `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts`: cita verbatim l'interfaccia
`VertexViewIR` completa con `file:riga`, e la union `ShapeForm` (conferma se include davvero
`circle` e `diamond`, oltre a rect/rounded/ellipse). Conferma che NON esiste gia' alcun campo
`resizable`/`resize`/`sizing`/`size`/`width`/`height`. Indica il punto esatto dove andrebbe
aggiunto `resizable?: boolean` e se il tipo e' condiviso/riusato altrove (grep del tipo).

### Q3 - Compile (`irCompile`)
Trova dove `VertexViewIR` viene compilato nell'oggetto `compiled` che `ObjectNode` consuma
(quello con `.form(ctx,id)`). Il compile costruisce `compiled` da una **whitelist** di campi
(quindi un campo nuovo verrebbe ignorato) o fa passthrough? Se whitelist: qual e' il punto esatto
in cui aggiungere `resizable` (e come viene gestito il default di `form`, per replicarne il pattern)?
Riporta `file:riga` della funzione di compile della vertex view e come default-a-`'rect'` il `form`.

### Q4 - Validazione (`irValidate` / `validateIR`)
Un campo opzionale nuovo (`resizable?: boolean`) passa `validateIR` senza errori, o c'e' una
whitelist/schema che rifiuta campi non previsti? Riporta `file:riga` del punto che valida le
vertex view e dice se serve un ramo esplicito per `resizable`.

### Q5 - Round-trip / persistenza / preserve-verbatim (rischio silenzioso)
Il punto piu' importante. Segui il flusso di save/reload della `view.ir` di una vertex view e
rispondi: un campo opzionale che il pannello Basic non conosce (`resizable`) **sopravvive** a
un giro save -> reload, o viene riscritto/droppato? Aggancia questo al lavoro R3 preserve-verbatim
del 25/07: chi serializza la view IR, dove, e se c'e' un punto in cui la view viene ricostruita
da un sottoinsieme di campi noti (che perderebbe `resizable`). Riporta `file:riga` del write path
della vertex authoring (`VertexAuthoringPanel` -> draft `view.ir` -> commit) e del punto di
serializzazione/persistenza. Se il campo rischia di essere perso, e' la cosa da segnalare come
prerequisito della Fase 2.

### Q6 - `VertexAuthoringPanel`: write pattern e hard-stop feature-picker
In `frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx`: come viene
scritto oggi un campo della view nel draft (prendi come modello la scrittura di `form`/`FORM_OPTIONS`):
riporta il pattern esatto (`file:riga`, handler, come muta il draft e come committa). Conferma
`file:riga` del memo feature-picker che ha l'hard-stop attivo, cosi' in Fase 2 il checkbox
"Resizable" gli sta lontano (come e' gia' stato per `FORM_OPTIONS`). Il campo `resizable` e'
booleano: mappa dove andrebbe il checkbox nel JSX del pannello senza toccare il memo.

### Q7 - Conferma parametri resizer e valore floor
Conferma il valore di `SHAPE_MIN_SIZE` (`nodeSizing.ts`) e cita verbatim le props attuali del
`<NodeResizer>` nel ramo IR (`ObjectNode.tsx`), inclusa `keepAspectRatio={shapeForm === 'circle'}`.
Verifica che montare il resizer su un `rect`/`rounded` (aspect libero, no keepAspectRatio) non
richieda altro oltre al gate: c'e' qualche CSS che impedirebbe lo shrink del rect/rounded fino
al floor (min-width/min-height/padding sulle regole `ir-shape--rect`/`ir-shape--rounded` in
`irStyle.ts`), oppure quelle regole gia' permettono lo shrink come per ellipse? Riporta `file:riga`.

## Discovery report (OBBLIGATORIO)

Al termine, salva il report in `docs/discovery/discovery_2026-07-27_resizable_flag.md`
(crea la cartella `docs/discovery/` se manca). Naming: `discovery_<data>_<descrizione>.md` con
data `YYYY-MM-DD`. Contenuto minimo: obiettivo della discovery; file letti/analizzati con path
completi; findings per Q1..Q7 con `file:riga` e citazioni verbatim; il verdetto sul rischio Q5
(il campo sopravvive al round-trip? si'/no/condizionato); dipendenze e rischi; domande aperte per
Alfonso. L'hard stop non e' completo finche' il report non e' scritto: l'analisi in chat parte
dal report salvato.

## HARD STOP

Dopo aver scritto il report, **FERMATI**. Nessun edit al codice di feature, nessun commit, nessun
`git add`. Restituisci in chat un riassunto per Q1..Q7 con i `file:riga` chiave e il verdetto Q5,
piu' la lista dei file che la Fase 2 dovra' toccare (proposta) cosi' posso scrivere il prompt di
implementazione.

## RIFERIMENTI

- Gate del resize: `frontend/src/components/editor-v2/nodes/ObjectNode.tsx` (ramo IR ~:355-364),
  `frontend/src/components/editor-v2/nodes/nodeSizing.ts` (`isNodeResizable`, `NODE_SIZING_DEFAULTS`,
  `SHAPE_MIN_SIZE`).
- Schema IR: `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts` (`VertexViewIR`, `ShapeForm`,
  `ShapeSpec`).
- Compile/validate: `irCompile.ts`, `irValidate.ts` (path sotto `.../viewpoint/ir/`, conferma).
- Authoring: `frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx`
  (`FORM_OPTIONS` e memo feature-picker con hard-stop).
- Stile shape: `.../viewpoint/ir/irStyle.ts` (regole `ir-shape--rect/rounded/ellipse/circle`).
- Precedenti prompt shape/resize: `2026-07-24_prompt_fase2_shape_free_resize_content_hug.md`,
  `2026-07-24_prompt_fase2_shape_circle.md` (KB progetto).
- Lavoro preserve-verbatim: R3 (`2026-07-25_prompt_faseR3_row_authoring_preserve.md`, KB progetto).
