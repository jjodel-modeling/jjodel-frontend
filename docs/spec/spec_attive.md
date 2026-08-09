# Spec attive — indice consolidato

Aggiornato: 2026-08-09. Questo file sostituisce nel Project Knowledge le spec integrali, che vivono in `docs/spec/` nel repo (`alfonso-frontend-jjtl`). Qui: stato, catena di supersessione, invarianti essenziali, puntatore al file integrale. In caso di dubbio fa fede il file integrale nel repo.

## Catena di supersessione IR

```
ir_schema v1.1 (2026-06-08)  →  SUPERATA da v1.2
ir_schema v1.2 (2026-07-18)  →  VIGENTE (contratto dell'interprete EditorV2)
  ├── addendum row dispatch (2026-07-25)      → VIGENTE, additivo
  ├── addendum edge authoring (2026-07-26)    → VIGENTE, additivo su §7
  └── addendum TextStyle ir-1.3 (2026-07-27)  → VIGENTE, additivo
```

## ViewpointIR v1.2 — contratto dell'interprete
**File**: `docs/spec/claude_spec_2026-07-18_ir_schema_v1_2.md` · **Stato**: vigente

Retarget della v1.1: l'IR non è più un formato intermedio di generazione AI ma il contratto normativo tra viewpoint autorati ed EditorV2. Invarianti da tenere a mente in chat:

- Semantica di risoluzione normativa (§2); primitive invariate dalla v1.1 (PathExpr chiuso, Predicate booleano chiuso, Conditional).
- Editabilità (§5) e Interaction a livello viewpoint (§6) sono nuovi rispetto alla v1.1.
- Dependency set e reattività (§9): vincolo dell'interprete, non opzionale.
- Fallback espliciti (§10): l'interprete non inventa default silenziosi.
- Migrazione e marcatura (§11): rilevante per ogni modifica a VersionFixer.

La v1.1 resta in `docs/spec/` solo come riferimento storico per le sezioni di lowering (IR → DViewElement) non riscritte nella v1.2.

## Addendum row dispatch
**File**: `docs/spec/claude_spec_2026-07-25_ir_row_dispatch_addendum.md` · **Stato**: vigente, implementato in tre fette (R1 resolver+guard, R2 suppression, R3 authoring preserve)

Dispatch totale delle row view con soppressione top-level; schema additivo sulla v1.2. Slice future dichiarate fuori scope in §8.

## Addendum edge authoring
**File**: `docs/spec/claude_spec_2026-07-26_ir_edge_authoring_addendum.md` · **Stato**: vigente; esteso dalle ratifiche edge expressiveness v2 (2026-08-02/03) e Eobj object-as-edge

Estende §7 della v1.2. Confine esplicito con la critical zone (§3): ogni fase che tocca sync/edge runtime passa dal two-phase. Decisioni successive (Eref, Eroute routing autorabile, endpoint editing non distruttivo slice A) sono in `decisions.md`, non riportate qui.

## Addendum TextStyle (ir-1.3)
**File**: `docs/spec/claude_spec_2026-07-27_ir_textstyle_addendum.md` · **Stato**: vigente, implementato (field popover + editor redesign 2b)

Primitiva `TextStyle` in `irTypes.ts`, aggancio additivo in quattro punti, semantica condizionale, `TextStyleEditor` riusabile. Persistenza con migration (§7): richiede bump VersionFixer se si tocca il default.

## Concern: languages (JjEL / JjTL / JjScript / JjLet / JjModal)
**File**: `docs/spec/concern_languages.md` · **Stato**: concern vivo, non superato

Documento di concern trasversale: identità di JjEL, stato JjTL (executor two-pass), JjScript, embedding JjLet/JjModal, roadmap data-driven. Contiene bug confermati dai test JjEL v1 e decisioni in tensione da rivedere: da consultare prima di qualsiasi lavoro sui linguaggi. Provenance delle decisioni tracciata al suo interno.

## Design parcheggiati
**Dove**: `docs/spec/parcheggiate/` (templates featured projects, templates explore) e `docs/spec/design_2026-05-03_L2_edge_overlay.md`. Nessuno vigente; si riattivano per decisione esplicita.

## Regola di manutenzione

Quando una spec nasce o viene emendata: file integrale in `docs/spec/`, riga aggiornata qui, e questo file ricaricato nel KB per sostituzione. Questo indice non duplica il contenuto normativo; se una sezione qui contraddice il file integrale, vince il file integrale.
