# Prompt Claude Code: Fase 2 E-obj, authoring object-as-edge

**Documento prompt**: 2026-08-02 16:00
**Tipo**: feat (implementazione scoped, Fase 2 del two-phase aperto il 2026-08-02)
**Repo**: jjodel-frontend, branch `alfonso-frontend-jjtl`
**Prerequisito**: esiste `docs/discovery/discovery_2026-08-02_eobj_object_as_edge_authoring.md`. Se manca, STOP.
**Hard stop**: dopo il commit e l'entry di log. Nessun push.

## Prima di iniziare

1. Leggere `CLAUDE.md`. In caso di conflitto con questo prompt, segnalare il conflitto senza procedere.
2. Leggere `docs/discovery/discovery_2026-08-02_eobj_object_as_edge_authoring.md` per intero: questo prompt ne assume i findings e non li ripete.
3. Leggere per intero ogni file prima di editarlo. Gli anchor citati qui vengono dal report e sono stati verificati a HEAD `b65bfe78f`, ma vanno ri-ancorati ai nomi via grep prima di ogni edit.
4. **WIP estraneo nel working tree** (lane TextStyle: `LabelEntryEditor.tsx`, `TextStyleEditor.tsx`, `irStyle.ts`, `ObjectNode.tsx`, `TextStyleField.tsx` non tracciato). Nessuno dei file di questa fase ha modifiche pendenti (verificato nel report). Staging file per file, mai `git add .`, mai `git commit -a`.
5. Grep preventivo su ogni nuovo identificatore introdotto (funzioni helper, classi CSS). Preferire il riuso delle classi già usate dal pannello.

## CONTESTO (autocontenuto)

`EdgeAuthoringPanel.tsx` autora oggi la sola natura **reference-as-edge** (fase E-ref, commit `9bd8cad9a`). Questa fase aggiunge la natura **object-as-edge** dentro lo stesso pannello, chiudendo l'ultima voce aperta della superficie di authoring IR.

Il fatto strutturale da cui dipende tutto il design: **la natura non è un campo, è una conseguenza**. `irCompile.ts:430` calcola `isObjectAsEdge: !!(sourceExpr && targetExpr)` e `irResolveCore.ts:125-141` smista la view nel bucket object solo se quel flag è vero e `metaclasses !== '*'`. Non esiste alcun campo che dichiari la natura, e non ne va introdotto nessuno.

Da questo discendono tre comportamenti già vivi nel codice, che il pannello deve governare:

- una edge view **senza capi è una reference-as-edge** viva sul canvas, non una view neutra;
- con **un capo solo** resta reference-as-edge e la PathExpr è inerte, senza alcun segnale;
- appena **entrambi i capi risolvono**, ogni istanza della metaclasse viene nascosta come nodo (`irEdgeViews.ts:226`) e i suoi edge reali soppressi (`:228`).

L'idea che rende sicuro tutto questo, e che va implementata alla lettera, è la **scrittura atomica dei capi**: il pannello non deve mai poter produrre un IR con un capo solo.

Le decisioni sono ratificate in `ratifiche_2026-08-02_eobj_object_as_edge.md` (R-1..R-8). Questo prompt le implementa e non le rimette in discussione: se durante l'implementazione una ratifica risultasse tecnicamente impraticabile, STOP e segnalare invece di deviare.

## DOVE (SOLO questi file)

| File | Intervento |
|---|---|
| `frontend/src/components/editor-v2/viewpoint/authoring/EdgeAuthoringPanel.tsx` | principale: selettore di natura, sezione Capi, gate del ramo reference, help per natura |
| `frontend/src/components/editor-v2/viewpoint/authoring/__tests__/edgeAuthoring.test.ts` | estensione: casi del ramo object |
| `frontend/src/components/editor-v2/viewpoint/authoring/EnableIRPanel.tsx` | due sole stringhe (etichetta `:11`, testo di aiuto `:128-133`) |
| `docs/claude-code-log.md` | entry di questa fase più backfill dell'entry mancante di E-ref |

**Non toccare**, per nessun motivo: `irTypes.ts`, `irCompile.ts`, `irResolveCore.ts`, `irEdgeViews.ts`, `irValidate.ts`, `irDefaults.ts`, `MatchingSection.tsx`, `VertexAuthoringPanel.tsx`, `RowAuthoringPanel.tsx`, `PathBuilder.tsx`, `ViewData.tsx`, e la critical zone (`useJjomSync.ts`, `portDistribution.ts`, `canvasToJjom.ts`, `syncState.ts`). Se una di queste sembrasse necessaria, STOP e segnalare: è un cambio di perimetro, non un dettaglio implementativo.

Nessun bump di `irVersion`. Nessun campo nuovo nello schema.

## COSA / COME

### 1. Stato della natura (R-1, R-2)

Aggiungere accanto al `draft` uno stato locale della natura, derivato dai dati e mai persistito:

- derivazione: la view è di natura object quando `ir.edge?.source` **e** `ir.edge?.target` sono entrambe valorizzate; altrimenti reference;
- inizializzazione dal seed (`:66`), e **reset nello stesso `useEffect([view.id])`** che oggi ri-seeda il draft (`:73-78`), così la natura segue il cambio di view;
- il selettore di natura è il primo controllo del form, sopra il blocco delle metaclassi.

### 2. Scrittura atomica dei capi (R-1, il requisito numero uno di questa fase)

Le due espressioni dei capi vivono in stato locale (una per `source`, una per `target`), inizializzate dal draft e resettate insieme alla natura.

Regola di commit, senza eccezioni: a ogni cambiamento di uno dei due, se **entrambe** sono non vuote e **entrambe** superano la guardia del punto 4, il draft viene patchato con `edge.source` e `edge.target`; **in ogni altro caso entrambe le chiavi vengono droppate** dal draft (drop della key, non stringa vuota, come già si fa per `reference` a `:190-205` e per `labels.center` a `:233-251`).

Conseguenza voluta: finché i capi non sono completi la view resta una reference-as-edge viva, e questo è corretto perché è ciò che i dati dicono. Un IR con un capo solo non è più producibile dalla UI.

### 3. Sezione Capi (ramo object)

Due `PathBuilder`, sorgente e destinazione, che riusano il `featureInfo` esistente (`:104-155`) senza modificarlo, passando le sole reference: `features={{ attributes: [], references: features.references }}` (R-5). Se `featureInfo` restituisce `null`, `PathBuilder` è già progettato per il caso disabilitato con hint: usare quel percorso, non inventarne uno.

Sopra i due picker, un `HelpText` sempre visibile che dice in modo piatto che le istanze della metaclasse verranno disegnate come linee e non appariranno più come nodi (R-7). Nessun modale di conferma.

### 4. Guardia sulla forma dell'espressione (R-5)

Un capo che termina in `.values` (array intero) va rifiutato con `ErrorText`: `toId` (`irEdgeViews.ts:194-198`) rifiuta gli array e l'effetto a canvas sarebbe un fallback silenzioso. La forma indicizzata `$ref.values[0]` è ammessa.

Estrarre il predicato come funzione pura piccola nel file del pannello, così da renderlo testabile senza importare il componente (il file di test non può importare i componenti, vedi punto 6). Grep del nome prima di introdurlo.

Un'espressione che non supera la guardia equivale a capo assente ai fini del punto 2: le chiavi restano fuori dall'IR.

### 5. Gate del ramo reference e del wildcard (R-2, R-3, R-4)

- Il picker `reference` (`:305-314`) è visibile **solo** sul ramo reference.
- Il toggle "Tutte le metaclassi" (`:270-275`) è **disabilitato** sul ramo object, non nascosto, con un hint che spiega che una object-as-edge deve nominare almeno una metaclasse (R-4).
- Se sul ramo object il draft ha `metaclasses === '*'`, mostrare un `ErrorText` che chiede di nominare almeno una metaclasse. Nessuna conversione automatica del wildcard in lista vuota.
- Transizioni di natura, esplicite e simmetriche: reference verso object droppa `reference`; object verso reference droppa `edge.source` e `edge.target`. Entrambe marcano dirty e passano dal commit debounced esistente.
- Restano condivisi e invariati fra le due nature: lista delle metaclassi, predicate, priorità, stile linea, terminazioni, label center. **Non riscrivere gli handler e il JSX del matching** (`:174-218`, `:266-349`): il ramo reference è già verificato e ogni riga riscritta è rischio di regressione.
- `exclusive` resta fuori dal pannello (R-3). `persistWaypoints` e `routing` restano fuori e round-trippano verbatim (R-6).

### 6. Testi di aiuto per natura

Rendere dipendenti dalla natura, senza toccarne la meccanica: l'introduzione (`:256`), l'etichetta del blocco metaclassi (`:269`, per il ramo object è la metaclasse dell'oggetto reso come linea, non la sorgente), i due help del blocco metaclassi (`:290`, `:302`), l'help del predicate (`:337`, sul ramo object radica sull'oggetto-edge), l'help della label (`:435`, il riferimento al nome della reference non vale sul ramo object).

### 7. Test (`edgeAuthoring.test.ts`)

Stesso stile del file esistente: **nessun import dei componenti**, letterali speculari fatti passare attraverso `validateIR` e `compileEdgeView` reali. Aggiungere:

1. seed object valido: `validateIR` ok e `compileEdgeView(...).isObjectAsEdge === true`;
2. **discriminante a un capo solo**: source senza target e viceversa danno `isObjectAsEdge === false` (blinda il comportamento su cui poggia la scrittura atomica, oggi non coperto);
3. **wildcard inerte**: `metaclasses: '*'` con entrambi i capi non popola `objectAsEdgeByMetaclass` (via `getIRIndex`, sul modello di `ir.test.ts:340-420`; oggi non coperto);
4. drop atomico: l'IR risultante dal drop non contiene né `edge.source` né `edge.target`;
5. round-trip object completo, con `routing` e `persistWaypoints` presenti nell'IR e intatti dopo clone, validate e compile;
6. la funzione pura del punto 4: `$ref.value` e `$ref.values[0]` passano, `$ref.values` no.

Nessun test esistente deve cambiare o diventare rosso.

### 8. Entry di log e backfill

Oltre all'entry di questa fase, aggiungere l'entry mancante per il landing di E-ref: commit `9bd8cad9a` del 2026-07-28, tipo `feat`, cinque file (`EdgeAuthoringPanel.tsx` nuovo, `EnableIRPanel.tsx`, `edgeAuthoring.test.ts` nuovo, `irDefaults.ts`, `ViewData.tsx`), esito completato, nota sul gap di processo. Rispettare il formato del log e la regola di archiviazione oltre le 20 entry.

## Verifica

1. `npm run build` verde, typecheck a baseline, vitest verde con i nuovi test inclusi.
2. **Verifica visiva, la esegue Alfonso** su un metamodello costruito a mano (R-8): `StateMachine { State{name}, Transition{src: State, tgt: State} }`, due o tre State, due Transition. Passi attesi:
   a. sulla view di `Transition` senza ir, tab IR, kind Edge, seed: il pannello appare in natura reference, il canvas non cambia;
   b. commutare la natura su object: il picker `reference` sparisce, compare la sezione Capi con l'avviso, il toggle wildcard è disabilitato, il canvas **non cambia ancora**;
   c. valorizzare il **solo** capo sorgente: il canvas resta invariato (prova diretta dell'atomicità);
   d. valorizzare anche il capo destinazione: entro il debounce le Transition spariscono come nodi e compaiono come linee fra gli State;
   e. svuotare uno dei due capi: le Transition tornano nodi (reversibilità);
   f. chiudere e riaprire il tab su una view object completa: la natura è ancora object, nessun re-seed, draft coerente;
   g. le view vertex, row ed edge-reference esistenti sono invariate.
3. Se durante l'implementazione emergono vincoli operativi (per esempio dove creare la view), consegnare ad Alfonso due righe di istruzioni con i nomi reali.

## Output e chiusura

1. Gate verdi.
2. Entry in `docs/claude-code-log.md` (tipo `feat`) più il backfill del punto 8, citando questo documento prompt con data e ora (2026-08-02 16:00).
3. `git add` dei soli file elencati in DOVE. Commit: `feat(editor-v2): object-as-edge authoring in the edge view panel`. **Nessun push** senza go-ahead.
4. **HARD STOP**. Report di chiusura con: file toccati, esito dei gate, scostamenti motivati, e una riga esplicita sulla superficie di interazione (indicizzare una object-as-edge view cambia palette e connect rules, `irInteraction.ts:64-78`: comportamento già vivo da E0, da dichiarare, non da modificare).

## RIFERIMENTI

- Ratifiche vincolanti: `ratifiche_2026-08-02_eobj_object_as_edge.md` (KB), R-1..R-8.
- Discovery di questa fase: `docs/discovery/discovery_2026-08-02_eobj_object_as_edge_authoring.md` (repo), tutti i `file:riga`.
- Addendum: `spec_2026-07-26_ir_edge_authoring_addendum.md` (KB), D1..D9. Nota: **D8 è emendato da R-3** (`MatchingSection` non viene allargata).
- Fase precedente: `2026-07-27_prompt_faseEref_edge_authoring_panel.md` (KB), commit `9bd8cad9a`.
- Template di pannello: `RowAuthoringPanel.tsx` (fase R3, `d1e6f9992`).
- Anchor chiave ri-verificati a HEAD `b65bfe78f`: `EdgeAuthoringPanel.tsx:66,73-78,81-91,93-96,104-155,190-205,233-251,256,266-349,305-314,415-437`; `EnableIRPanel.tsx:11,128-133`; `irCompile.ts:404-450,430`; `irResolveCore.ts:125-141,293-320`; `irEdgeViews.ts:164-255,194-198,226,228`; `PathBuilder.tsx:17-25`; `ir.test.ts:340-420,526-548`.
