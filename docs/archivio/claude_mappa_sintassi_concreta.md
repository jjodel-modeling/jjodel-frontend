# Mappa di copertura — Sintassi concreta Jjodel (IR)

**Documento vivo** (aggiornare in place quando le slice avanzano).
**Ultimo aggiornamento**: 2026-08-06, sera (**coda arco A chiusa con GO su 17 prove**: barra a cinque tab per le view IR con ricollocazione R-H di Name/father, verifica visiva saldata, remoto allineato a `5fcef39ef`. **E-route landata `423f19f01`**, amend di `5b2cb2f60` che è orfano, checklist visiva PASS: routing autorabile degli edge IR. **R-B12 chiuso**: gli edge non ortogonali non registrano nulla nel registry, il crossing detection li ignora. **Guardia sui capi estratta in modulo puro** con la voce 1, `59dfb096d`. Precedente: 2026-08-02, E-obj).

## Cosa mappa

La sintassi concreta in Jjodel e' la **notazione grafica** con cui una metaclasse
diventa qualcosa di visibile ed editabile sul canvas, definita e autorata tramite l'IR
(vertici, righe, edge, forme, label, compartimenti). Questa mappa dice, per ogni
capacita', se e' fatta, in v1 con limiti noti, o da fare.

Fuori scope di questa mappa: i linguaggi JjEL / JjTL / JjScript, che riguardano
espressioni, trasformazioni e manipolazione del modello (sintassi astratta e semantica),
non la notazione. Fuori scope anche la persistenza, tranne dove impatta direttamente
l'uso della sintassi concreta (sezione Adiacenze).

**Legenda**: ✅ fatto (v1) · 🟡 v1 con limiti noti · ⬜ da fare · ⚠️ da ratificare / rischio noto

## Vertici (elementi nodo)

| Capacita' | Stato | Note |
|-----------|-------|------|
| Forme: rect, rounded, ellipse, circle, diamond | ✅ | circle/diamond + free-resize in `4273317f8` |
| Famiglia poligonale (altre forme) | ⬜ | slice futura |
| Sizing: free-resize shape node + content-hug text card | ✅ | `nodeSizing.ts`, `SHAPE_MIN_SIZE` |
| Label (posizione top, source intrinsic/path, ellipsis nella shape) | ✅ | |
| Text style delle label (TextStyleEditor) | 🟡 | landato; raffinamento popover (TextStyleField) ancora WIP nel working tree; switch conditional per-asse non gatati in Basic (residuo B3) |
| Fill / border | ✅ | border non-Conditional: ⚠️ divergenza spec v1.1 vs irTypes, da ratificare |
| Compartimenti slot-iteration (`attributes` / `references`) | ✅ | |
| Badge | ✅ | |
| Conditional (es. `visible`) | ✅ | |
| Matching (metaclasses / predicate / priority / exclusive) | ✅ | dal 2026-08-06 raggiungibile anche in Basic, nel tab Applies to (R-3 della partizione) |
| Authoring UI vertice (EnableIRPanel, VertexAuthoringPanel) | ✅ | dal 2026-08-06 dentro la **barra a cinque** della partizione (Applies to · Structure · Appearance · Text · Source, strada B: tutti i corpi montati, inattivi in `display: none`); Applies to ospita anche Name/Viewpoint/Parent ricollocati (R-H) |

## Righe (row view / dispatch)

| Capacita' | Stato | Note |
|-----------|-------|------|
| Compartimento `source: {from:'children', filter}` | ✅ | R2 `d12a54aa0` |
| Dispatch polimorfico per metaclasse concreta (cascata esatta > ereditata > wildcard > default) | ✅ | R2 |
| Row view `kind:'row'`: template TextSource (path/literal/intrinsic) | ✅ | R1 `8a650833b` |
| Soppressione top-level dei figli resi come riga + edge assorbiti | ✅ | R2, `hidden:true` |
| Fallback built-in (`defaultRowViewIR`) | ✅ | la riga non fallisce mai |
| Authoring row (RowAuthoringPanel) + preserve-verbatim | ✅ | R3 `d1e6f9992`; dal 2026-08-06 nella barra a cinque: per una row solo Applies to e Text (Structure/Appearance nascosti strutturalmente) |
| Filtro isKind in Basic | ✅ | R3 |
| Filtro per-reference (`{childId, refName}`) | ⬜ | funzione additiva nuova |
| Multi-compartment `children` (render per-compartment) | 🟡 | v1: unione resa una volta sola al primo; fix nella slice Operation |
| Editing inline / selezione righe | ⬜ | v1 read-only (decisione P2) |
| Operation / row view con parametri (join annidato o dispatch ricorsivo) | ⬜ | metodi di classe, operazioni SM |
| Reference non-containment (guardia di profondita') | ⬜ | |

## Edge / relazioni

> Ridimensionata dopo la discovery 2026-07-26: lo stack IR edge era gia' vivo (resolve/
> compile/decorate/interact/persist/react); i buchi reali erano solo il renderer (stile
> dead-write) e l'authoring. Entrambi chiusi: E0, E-ref, E-obj.

| Capacita' | Stato | Note |
|-----------|-------|------|
| Stack IR edge (resolve / compile / decorate / interact / persist / react) | ✅ | scoperto vivo dalla discovery 2026-07-26 |
| Sintesi object-as-edge (nodo nascosto + edge sintetico + persistenza `DVertex.irEdgeLayout`) | ✅ | gia' vivo pre-E0 |
| Rendering IR-driven dello stile edge (stroke/width/dash, marker/terminazioni, label center sempre visibile) | ✅ | **E0 2026-07-26**: consumo gated in `UnifiedEdge` su `data.irEdgeViewId`; entrambe le nature |
| Matching reference-as-edge (metaclasse sorgente + refName, score +0.5) | ✅ | matching pre-lift in E0 (D2) |
| Routing autorabile (`orthogonal`/`straight`/`curved`) | ✅ | **E-route `423f19f01` 2026-08-06** (amend di `5b2cb2f60`), **checklist visiva PASS**: consumo di `edge.routing` nel ramo IR gated, entrambe le nature; etichette UI Manhattan/Direct/Bezier; assente ≡ orthogonal; waypoint nascosti e preservati su routing non ortogonale (R-B10); gate `registerEdgePath` (R-B12, **chiuso**: gli edge non ortogonali non registrano nulla, il crossing detection li ignora; `UnifiedEdge.tsx:263`, in `docs/decisions.md`). Supera il congelamento D3. Dal 2026-08-06 il Select vive nel tab Appearance. Coda nota: `routing` persistito come `""` su view mai toccate (coda nuova, voce 3) |
| Authoring reference-as-edge (**E-ref**) | ✅ | `9bd8cad9a` 2026-07-28 (entry di log backfillata il 2026-08-02) |
| Authoring object-as-edge (**E-obj**: natura nel pannello, capi PathExpr, scrittura atomica) | ✅ | **`d1dc55649` 2026-08-02, verifica visiva PASS**; ratifiche R-1..R-8; messaggistica C-1..C-4 più B-5 verificata a video il 2026-08-06 (voce 5) |
| Marker: registro con anteprime, famiglia estesa, custom (**E-mark**) | ⬜ | congelata; ~750 righe gia' scritte da collegare (`markerPresets.ts`, `EdgeMarkerEditorModal`), R-B1..R-B4 |
| Label agli estremi + editabilita' (**E-lab**) | ⬜ | congelata; R-B5..R-B8 |
| Persistenza layout reference-as-edge | ⬜ | fuori scope v1: nessun carrier, routing sempre derivato (D4 → LIR) |
| Target-metaclass nella chiave di matching | ⬜ | fuori scope v1: via `predicate` (D5) |
| Edge M2 (reference/inheritance) nel path IR | ⬜ | fuori scope v1: il path IR filtra solo M1 (instanceRef/composition); gli edge M2 restano Manhattan anche dopo E-route |

## Trasversali

| Capacita' | Stato | Note |
|-----------|-------|------|
| Reattivita' live: subscription per-child, edit riflesso sul canvas | ✅ | v1 |
| Reattivita' cross-object | ⬜ | v1.2 |
| Decorative views | ⬜ | |
| Rules editor | ⬜ | rules multi-branch preservate, chip read-only |
| Metaclasses vs path: invalidazione al cambio metaclasse | ⚠️ | path non invalidati, fallimento silenzioso (vale per template row e per i capi edge) |
| Multi-target picker | 🟡 | usa solo `metaclasses[0]` (scelta deliberata v1) |
| `validateIR` accetta IR ibridi | ⚠️ | `reference` + capi, oppure un capo solo: il pannello non li produce piu' (R-1/R-2), ma restano accettati se scritti da console. Check incrociato = slice separata, tocca `irCompile`/`irValidate` e puo' invalidare view persistite |
| Reconnect su reference multi-valore | ⚠️ | `EditorV2.tsx:1886` scrive `slot.value` con semantica single-value su slot `upperBound=-1`. Non verificato. Emerge coi capi `$ref.values[0]` |
| Guardia sui capi in modulo puro importabile | ✅ | chiusa con la voce 1 della coda arco A (`59dfb096d`): `isUsableEndpointExpr` estratta in `viewpoint/ir/edgeEndpoints.ts`, il test importa la funzione vera invece del mirror. Debito residuo parcheggiato: stringa B-5 triplicata nei pannelli (grappolo igiene della coda nuova) |

## Adiacenze (persistenza / tooling che impatta l'uso)

| Voce | Stato | Note |
|------|-------|------|
| Viewpoint selector: rehydration dei viewpoint IR persistiti | ✅ | chiusa il 2026-08-04: non riproducibile, poi confermata su viewpoint veri (assorbe il punto 9.1 del backlog) |
| Import metamodello idempotente | ⬜ (won't-fix) | reimportare duplica; evolvere in place |

## Stato d'insieme

**La superficie di authoring della sintassi concreta e' chiusa, e da oggi anche ordinata.**
Vertici, righe ed edge hanno tutti un pannello end-to-end dentro la barra a cinque tab della
partizione (verificata a video il 2026-08-06): forme, sizing, label con text style,
compartimenti, badge, conditional e matching per i vertici; dispatch polimorfico e template
per le righe; rendering IR-driven, natura reference e natura object, e routing autorabile per
gli edge. Non resta alcuna capacita' dichiarata come "da autorare".

Il fatto architetturale che regge il capitolo edge, e che va ricordato prima di toccarlo:
**la natura di una edge view non e' un campo, e' una conseguenza** (`isObjectAsEdge` deriva
da `!!(sourceExpr && targetExpr)`, `irCompile.ts:430`). E-obj lo rende sicuro rendendo
atomica la scrittura dei capi: un IR con un capo solo non e' producibile dalla UI, quindi il
discriminante strutturale e' sempre corretto e la natura sempre ri-derivabile.

Quello che manca ora non e' authoring ma **espressivita' delle righe** (editing inline,
Operation, filtro per-reference) e il **moltiplicatore vero, il dogfooding**: costruire
viewpoint reali da UI e lasciare che le frizioni prioritizzino le slice. La rehydration del
viewpoint selector, che lo bloccava, e' chiusa dal 2026-08-04.

## Prossime slice consigliate (ordine)

1. **Operation / row view con parametri** + fix multi-compartment `children` per-compartment.
2. **Editing inline delle righe** (da read-only a editabile).
3. **Filtro per-reference** e reference non-containment.
4. Ratifiche e micro-debiti in sospeso: border non-Conditional; invalidazione path al cambio
   metaclasse.
5. Arco edge v2, slice restanti (congelate): **E-mark** (registro marker, anteprime, custom),
   **E-lab** (label agli estremi, editabilita').
6. Estensioni edge fuori scope v1, con LIR: persistenza layout reference-as-edge,
   target-in-key, edge M2 nel path IR.
7. Estensioni: decorative views, rules editor, famiglia poligonale di shape, reattivita'
   cross-object v1.2.

Nota: quest'ordine e' interno alla sintassi concreta; la pianificazione operativa corrente
(coda nuova post arco A) vive in `contesto_progetto.md`, che prevale.

## Riferimenti
- Snapshot corrente e bug: `contesto_progetto.md`.
- Ultimo checkpoint: `claude/sessione_2026-08-06_2.md`; verbale di chiusura coda arco A:
  `claude/verifica_2026-08-06_voce5_chiusura_coda.md`.
- Decisioni vincolanti nel repo: `docs/decisions.md` (R-A..R-H, RC-3, serie R-B del routing).
- Ratifiche E-obj: `claude/ratifiche_2026-08-02_eobj_object_as_edge.md` (R-1..R-8; **R-3 emenda D8**: `MatchingSection` non allargata).
- Arco edge v2: `claude/ratifiche_2026-08-02_edge_expressiveness_v2.md` (R-A1..R-A8),
  `claude/ratifiche_2026-08-03_edge_expressiveness_decisioni.md` (R-B1..R-B12),
  prompt E-route `claude/2026-08-06_prompt_eroute_routing_autorabile.md`.
- Partizione dei tab: `claude/ratifiche_2026-08-04_tab_partizione.md` (R-5),
  `claude/ratifiche_2026-08-05_2_emendamento_strada_B.md`, prompt 1.5 più emendamento nel KB,
  review UI in `claude/review_2026-08-06_barra_15_cinque_tab.md`.
- Spec IR edge: `claude/spec_2026-07-26_ir_edge_authoring_addendum.md` (E0/E-ref/E-obj, D1..D9; D3 superata da E-route).
- Discovery edge: `docs/discovery/discovery_2026-07-26_edge_authoring_substrate.md`, `docs/discovery/discovery_2026-08-02_eobj_object_as_edge_authoring.md`, `docs/discovery/discovery_2026-08-03_edge_expressiveness_v2.md`, `docs/discovery/discovery_2026-08-06_eroute_reanchor.md`, `docs/discovery/discovery_2026-08-06_barra_15_reanchor.md`.
- Spec IR: `claude/spec_2026-07-25_ir_row_dispatch_addendum.md`, `claude/spec_2026-07-18_ir_schema_v1_2.md`, `spec_2026-06-08_ir_schema_v1_1.md`.
- Commit chiave: R1 `8a650833b`, R2 `d12a54aa0`, R3 `d1e6f9992`, shape A+B `4273317f8`, E0 2026-07-26, E-ref `9bd8cad9a`, E-obj `d1dc55649`, recupero capi 2.1 `59dfb096d` + `d8159c2f0`, E-route `423f19f01`, barra 1.5 `fd92b3d1c` + `e15eb5081`, chiusura coda `5fcef39ef`.
