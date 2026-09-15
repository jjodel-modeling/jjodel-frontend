# Ratifiche E-ref (authoring panel reference-as-edge)

**Data**: 2026-07-26
**Fonti**: `docs/discovery/discovery_2026-07-26_edge_authoring_panel.md` (repo) + analisi in chat.
**Rapporto con l'addendum**: integra `spec_2026-07-26_ir_edge_authoring_addendum.md` (D5/D8); l'emendamento R-3 modifica leggermente D8.

- **R-1 (chiude OQ-1 del report)**: il vincolo sul target di una reference-as-edge si esprime come **navigazione dal sorgente** nel predicate (path che attraversa la reference nominata), coerente col fatto che il resolver valuta il predicate con root = oggetto sorgente (`irResolveCore.ts:286`). Nessun meccanismo dedicato "predicate sul target" in v1. Se PathExpr non naviga la reference nominata, il vincolo sul target è un limite dichiarato di v1: non si tocca il resolver.
- **R-2 (chiude OQ-2)**: `validateIR` accetta già `kind:'edge'` (instrada a `compileEdgeView`, `irValidate.ts:18`, confermato dalla discovery substrato). E-ref non tocca `irValidate`; solo check di conferma nei test.
- **R-3 (emenda D8)**: il **toggle di natura (object/reference) è rinviato a E-obj**. In E-ref il kind `edge` di `EnableIRPanel` semina direttamente una view natura reference (nessun campo `edge.source/target`). Niente opzioni stub nella UI.
- **R-4 (chiude OQ-3)**: terminazioni autorate con **due `Select`** a 6 voci (`EdgeTermination`), sourceEnd e targetEnd. Nessun picker grafico in v1.
- **R-5 (chiude OQ-4)**: **`exclusive` omesso** dal panel edge finché il resolver non gli dà semantica sugli edge (nota `MatchingSection.tsx:157`). Nessun controllo senza effetto.
- **R-6 (matching)**: matching **inline** nel panel (come RowAuthoringPanel), non `MatchingSection`: il campo `reference` è estraneo al tipo `VertexViewIR`. Il widening di `MatchingSection` resta valutabile per E-obj.
- **R-7 (fasizzazione)**: E-ref/1+2+3 del report compressi in **un prompt e un commit unico** (taglia R3): lo scaffold da solo non è verificabile visivamente perché non instradato.
- **R-8 (seed)**: nuovo `defaultEdgeViewIR()` in `irDefaults.ts`: `{ irVersion:'ir-1.2', kind:'edge', metaclasses:[], edge:{} }`; i default di compile (`sourceEnd:'none'`, `targetEnd:'openArrow'`, `labelPlacement:'auto'`) restano al compile. Nel seed da `EnableIRPanel`, metaclasse sorgente risolta via `resolveMetaclassNames` (come vertex), fallback `[]`; campo `reference` assente (= matcha qualsiasi reference).
