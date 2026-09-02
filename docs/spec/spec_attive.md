# Spec attive — indice consolidato

Aggiornato: 2026-08-28. Questo file sostituisce nel Project Knowledge le spec integrali, che vivono in `docs/spec/` nel repo (`alfonso-frontend-jjtl`). Qui: stato, catena di supersessione, invarianti essenziali, puntatore al file integrale. In caso di dubbio fa fede il file integrale nel repo.

## Catena di supersessione IR

```
ir_schema v1.1 (2026-06-08)  →  SUPERATA da v1.2
ir_schema v1.2 (2026-07-18)  →  VIGENTE (contratto dell'interprete EditorV2)
  ├── addendum row dispatch (2026-07-25)      → VIGENTE, additivo
  ├── addendum edge authoring (2026-07-26)    → VIGENTE, additivo su §7
  ├── addendum TextStyle ir-1.3 (2026-07-27)  → VIGENTE, additivo
  └── addendum FormSpec ir-1.3 (2026-08-28)   → VIGENTE, additivo
```

## ViewpointIR v1.2 — contratto dell'interprete
**File**: `docs/spec/claude_spec_2026-07-18_ir_schema_v1_2.md` · **Stato**: vigente

Retarget della v1.1: l'IR non è più un formato intermedio di generazione AI ma il contratto normativo tra viewpoint autorati ed EditorV2. Invarianti da tenere a mente in chat:

- Semantica di risoluzione normativa (§2); primitive invariate dalla v1.1 (PathExpr chiuso, Predicate booleano chiuso, Conditional).
- Editabilità (§5) e Interaction a livello viewpoint (§6) sono nuovi rispetto alla v1.1.
- Dependency set e reattività (§9): vincolo dell'interprete, non opzionale.
- Fallback espliciti (§10): l'interprete non inventa default silenziosi.
- Migrazione e marcatura (§11): rilevante per ogni modifica a VersionFixer. Emendata il 2026-08-13 da R-IRN-3: il degrado si segnala in authoring, non a canvas.

La v1.1 resta in `docs/spec/` solo come riferimento storico per le sezioni di lowering (IR → DViewElement) non riscritte nella v1.2.

`docs/specs/` (con la s) è stata ritirata il 2026-08-10 (fusione delle due copie, ratifiche R-FS1..R-FS7): i riferimenti storici a quel path si risolvono in `docs/spec/`.

## Addendum row dispatch
**File**: `docs/spec/claude_spec_2026-07-25_ir_row_dispatch_addendum.md` · **Stato**: vigente, implementato in tre fette (R1 resolver+guard, R2 suppression, R3 authoring preserve)

Dispatch totale delle row view con soppressione top-level; schema additivo sulla v1.2. Slice future dichiarate fuori scope in §8.

## Addendum edge authoring
**File**: `docs/spec/claude_spec_2026-07-26_ir_edge_authoring_addendum.md` · **Stato**: vigente; esteso dalle ratifiche edge expressiveness v2 (2026-08-02/03) e Eobj object-as-edge

Estende §7 della v1.2. Confine esplicito con la critical zone (§3): ogni fase che tocca sync/edge runtime passa dal two-phase. Decisioni successive (Eref, Eroute routing autorabile, endpoint editing non distruttivo slice A) sono in `decisions.md`, non riportate qui.

## Addendum TextStyle (ir-1.3)
**File**: `docs/spec/claude_spec_2026-07-27_ir_textstyle_addendum.md` · **Stato**: vigente, implementato (field popover + editor redesign 2b)

Primitiva `TextStyle` in `irTypes.ts`, aggancio additivo in quattro punti, semantica condizionale, `TextStyleEditor` riusabile. Persistenza con migration (§7): richiede bump VersionFixer se si tocca il default.

## Addendum FormSpec (ir-1.3)
**File**: `docs/spec/claude_spec_2026-08-28_ir_formspec_addendum.md` · **Stato**: vigente; descrittivo sulle Slice 1a/1b implementate. R-FRM-1 implementata (`4b7383dbf`, 2026-08-28), R-FRM-2 vigente per costruzione, R-FRM-3 ancora aperta

Seconda resa della stessa view: `FormSpec` opzionale su vertex, graphVertex e row, additivo su ir-1.3 (nessun bump, nessuna migrazione). Passthrough in compilazione, non compile: niente PathExpr, niente Predicate, nessun dependency set. Chiavi per NOME di feature. Vincolo duro: nessuna chiave `op` stringa dentro la struttura, o `irValidate` respinge l'intera view.

Le tre ratifiche (§12 del file integrale): **R-FRM-1** i `fieldCompartments` ordinano e intitolano ma non filtrano, i gruppi non reclamati vanno in coda con i titoli standard (fatto: `formSections.ts`, chiavi di sezione invariate, coda su `residual-<gruppo>`); **R-FRM-2** la rimozione da una lista lascia un buco e l'indice grezzo non è contrattuale, la lista logica è la sequenza dei valori pieni; **R-FRM-3** il canone di un attributo enum è il pointer al literal, il nome resta accettato solo in lettura come forma legacy dell'importer (apre due allineamenti: importer XMI e CHECK 10 della conformance).

Slice 2 (authoring del FormSpec), Slice 3 (form document) e il rifiuto al commit di uno spec incoerente sono fuori dall'addendum.

## Concern: languages (JjEL / JjTL / JjScript / JjLet / JjModal)
**File**: `docs/spec/concern_languages.md` · **Stato**: concern vivo, non superato

Documento di concern trasversale: identità di JjEL, stato JjTL (executor two-pass), JjScript, embedding JjLet/JjModal, roadmap data-driven. Contiene bug confermati dai test JjEL v1 e decisioni in tensione da rivedere: da consultare prima di qualsiasi lavoro sui linguaggi. Provenance delle decisioni tracciata al suo interno.

Fronte aperto dal 2026-08-14: JjEL come linguaggio delle espressioni dell'IR (R-J1..R-J6, ancora in stato di proposta). Discovery in `docs/discovery/discovery_2026-08-14_jjel_come_linguaggio_espressioni_ir.md`.

## Contratto della taglia delle forme (promozione dovuta)
**Dove**: `docs/ratifiche/claude_2026-08-14_memo_ratifica_taglia_forme_geometriche.md`, `docs/ratifiche/claude_2026-08-15_memo_contratto_contentrect_nel_registry.md` e `docs/discovery/discovery_2026-08-15_cablaggio_taglia_da_contenuto.md` · **Stato**: cablato e verificato a schermo (`115e8484d`, 2026-08-15)

`contentRect` / `boxForContent` / `boxForContentNumeric` / `boxFromIntrinsic` / `hasSizeSupplement` in `shapeRegistry.ts`, consumatore unico `viewpoint/ir/useContentSize.ts`. Decisioni D8..D13.

**La condizione per la promozione ad addendum della v1.2 è soddisfatta**: il contratto non è più inerte. Quattro invarianti da riportare nel file di spec quando si scrive:

- Il perimetro è la policy, non una lista di id: una forma è dimensionata dal contenuto quando `heightFactor > 1 || minAspect > 0`.
- La misura si prende alla taglia intrinseca (`max-content` sul content box), mai in posa: margini auto e righe flex ridistribuiscono con il box e l'iterazione diverge.
- Il contratto risponde in coordinate del contenuto; il chrome del box si somma dopo la formula, mai prima.
- La taglia derivata resta in sessione. `isResized` è il solo indicatore di taglia scelta da un umano e ha la precedenza.

Manca ancora il file in `docs/spec/`.

## Design parcheggiati
**Dove**: `docs/spec/parcheggiate/` (templates featured projects, templates explore) e `docs/spec/design_2026-05-03_L2_edge_overlay.md`. Nessuno vigente; si riattivano per decisione esplicita.

## Regola di manutenzione

Quando una spec nasce o viene emendata: file integrale in `docs/spec/`, riga aggiornata qui, e questo file ricaricato nel KB per sostituzione. Questo indice non duplica il contenuto normativo; se una sezione qui contraddice il file integrale, vince il file integrale.
