# Triage — Commit split: resizable + propagazione size (FASE 0, read-only)

**Data**: 2026-07-27
**Branch**: `alfonso-frontend-jjtl` · **HEAD**: `e2368cad7` (feat: TextStyle TS1)
**Obiettivo**: due commit tematici puliti — (1) `resizable`, (2) propagazione size — lasciando
non committati il refactor edge/anchor + debug-cleanup in `EditorV2.tsx` (C) e la WIP sessione TS1 (D).
**Stato**: read-only. Nessuno stage/commit fatto in FASE 0. HARD STOP a valle.

## Scoperta chiave: l'index è GIÀ pre-staged con il gruppo A

`git diff --cached` contiene **esattamente** e **solo** il gruppo A (resizable):
`ObjectNode.tsx` (gate `canResize`/`ir-resizable`), `nodeSizing.ts` (`defaultResizableForForm`),
`irStyle.ts` (`.mm-node.ir-resizable`), `irTypes.ts` (`resizable?`), e `VertexAuthoringPanel.tsx`
**solo l'hunk checkbox** (import `Checkbox`/`defaultResizableForForm` + JSX checkbox + hint).
Il bottone "Propaga dimensione" NON è staged. → Commit 1 è di fatto già pronto nell'index.

## `git status --short`

```
 M .claude/scheduled_tasks.lock                    (noise/lock — leave)
 M docs/claude-code-log.md                         (MISTO A/B/C/D — hunk/line staging)
 M frontend/.../EditorV2.tsx                        (MISTO B/C — hunk staging)
 M frontend/.../hooks/useEditorMode.ts              (C — leave)
M  frontend/.../nodes/ObjectNode.tsx                (A — STAGED)
M  frontend/.../nodes/nodeSizing.ts                 (A — STAGED)
 M frontend/.../sync/canvasToJjom.ts                (B intero)
 D frontend/.../utils/laneSeparation.ts             (C — leave, deleted)
 A frontend/.../authoring/EdgeAuthoringPanel.tsx    (C — leave, new)
 M frontend/.../authoring/EnableIRPanel.tsx         (C — leave)
 M frontend/.../authoring/LabelEntryEditor.tsx      (D TS1 — leave)
 M frontend/.../authoring/TextStyleEditor.tsx       (D TS1 — leave)
MM frontend/.../authoring/VertexAuthoringPanel.tsx  (MISTO: A staged / B unstaged)
 A frontend/.../authoring/__tests__/edgeAuthoring.test.ts (C — leave, new)
 M frontend/.../viewpoint/ir/irDefaults.ts          (C — leave)
M  frontend/.../viewpoint/ir/irStyle.ts             (A — STAGED)
M  frontend/.../viewpoint/ir/irTypes.ts             (A — STAGED)
 M frontend/.../editors/views/ViewData.tsx          (C — leave)
 M frontend/src/events/registry.ts                  (B intero)
 M frontend/src/styles/components/_form-system.scss (D TS1 — leave)
?? docs/discovery/... (vedi tabella docs)
?? frontend/.../authoring/TextStyleField.tsx        (D TS1 — leave, new)
```

## File misto 1 — `VertexAuthoringPanel.tsx` (A staged / B unstaged)

| Hunk | Gruppo | Descrizione |
|---|---|---|
| STAGED: import `Checkbox` + `defaultResizableForForm`; JSX `<Checkbox "Resizable">` + hint | **A** | Checkbox resizable — già nell'index per commit 1. |
| UNSTAGED: import `JjodelEvents`; `const canResize = draft.resizable ?? defaultResizableForForm(...)`; `<Button "Propaga dimensione">` che dispatcha `PROPAGATE_VIEW_SIZE` | **B** | Bottone propagazione — per commit 2. |

La separazione è già pulita index/working-tree. Il bottone (B) usa `defaultResizableForForm`, importato
dall'hunk checkbox (A): **ordine A→B rispettato**. Commit 1 (solo checkbox) compila da solo
(non referenzia `JjodelEvents`/`canResize`/Button).

## File misto 2 — `EditorV2.tsx` (B listener / C refactor+debug) — CONFINE

| Hunk (ancora) | Gruppo | Descrizione |
|---|---|---|
| import `resolveIRView` (@@ ~37, `irResolveCore`) | **B** | usato dal listener |
| **rimozione** import `laneSeparation` (`LANE_DEBUG`, `reconstructEdgePoints`, `LaneRect`, `ReconstructEdge`) (@@ ~49) | **C** | refactor edge/anchor (laneSeparation.ts eliminato) |
| import `syncSizeBatchToJjom` (@@ ~68) | **B** | usato dal listener |
| import `toast` da `../Toast/toastDispatch` (@@ ~103) | **B** | usato dal listener |
| `useEffect` **`PROPAGATE_VIEW_SIZE`** (+~64 righe, @@ ~942-1006) | **B** | il listener della propagazione |
| **rimozione** blocco `if (LANE_DEBUG) { … reconstructEdgePoints … }` (−31, @@ ~1026) | **C** | refactor edge/anchor |
| **rimozioni** `[BUG-DIAG-DROP]` console.log in `onConnect`/`onConnectEnd` (@@ ~1389+, varie) | **C** | debug-cleanup edge-connect |

**Confine listener↔refactor**: il listener (B) è il blocco `useEffect` che finisce a
`}, [getNodes, setNodes, scheduleLayoutSave, takeSnapshot]);` (~riga 1006). **Subito sotto** (~1026)
inizia la rimozione del blocco `LANE_DEBUG` (C). Gli import in testa sono 4 hunk distinti (B: resolveIRView,
syncSizeBatchToJjom, toast; C: rimozione laneSeparation) → separabili per hunk. Le rimozioni
console.log (C, ~1389+) sono nettamente sotto il listener.

## File misto 3 — `docs/claude-code-log.md` (entry A/B/C/D, blocco +92 in testa)

Entry (ordine nel file, newest-first) → gruppo:

| Entry | Gruppo |
|---|---|
| `feat: propaga la dimensione a tutte le istanze di una view (IR)` | **B** (commit 2) |
| `docs: discovery TS1 authoring trigger+popover` | D (leave) |
| `feat: TextStyle authoring sulla label del vertice (TS1)` | D (leave) |
| `feat: flag resizable su vertex view IR + resize rect/rounded` | **A** (commit 1) |
| `docs: discovery stato tipografia elementi testuali IR` | D (leave) |
| `chore: discovery guard single-container` | C/D (leave) |
| `chore: discovery co-evoluzione M2→M1` | C (leave) |
| `chore: discovery authoring panel per edge` | C (leave) |
| `chore: discovery substrato edge` | C (leave) |

Sono tutte righe aggiunte (un blocco contiguo in testa). Per committare **solo** l'entry A in commit 1
e **solo** l'entry B in commit 2 lasciando fuori le D/C, uso il pattern §6.1 CLAUDE.md (backup →
`git checkout HEAD -- log` → riscrivo solo l'entry voluta → add → commit → restore backup).

## Docs discovery (untracked) → gruppo

| File | Gruppo |
|---|---|
| `discovery_2026-07-27_resizable_flag.md` | **A** (commit 1) |
| `discovery_2026-07-27_size_propagation.md` | **B** (commit 2) |
| `lir_2026-07-27_size_propagation.md` | **B** (commit 2) |
| `discovery_2026-07-27_size_readback_object_node.md` | **B?** — supporta la propagazione (il commento del listener la cita). *Da confermare: includere in commit 2?* |
| `discovery_2026-07-27_ir_text_typography_state.md` | D (leave) |
| `discovery_2026-07-27_ts1_textstyle_label.md` | D (leave) |
| `triage_2026-07-27_commit_split.md` (questo) | doc di processo (leave / o includere dove preferisci) |
| `discovery_2026-07-27_containment_single_container_guard.md` | C/D (leave) |
| `discovery_2026-07-26_coevolution_edge_rename.md` | C (leave) |
| `discovery_2026-07-26_debug_console_logs.md` | C (leave) |
| `discovery_2026-07-26_edge_authoring_panel.md` | C (leave) |
| `discovery_2026-07-26_edge_authoring_substrate.md` | C (leave) |

## File "leave" — sanity check

`git diff` di `useEditorMode.ts`, `irDefaults.ts`, `ViewData.tsx`, `EnableIRPanel.tsx` grep-ati per
`resizable|propagat|PROPAGATE_VIEW_SIZE|syncSizeBatch|TextStyle`: **nessun match** → nessun hunk
A/B/D nascosto; sono C (edge/IR) → non committare. `EdgeAuthoringPanel.tsx` (+439, new),
`edgeAuthoring.test.ts` (new), `laneSeparation.ts` (deleted): C (sessione edge) → leave. WIP TS1
(`TextStyleField.tsx`, `TextStyleEditor.tsx`, `LabelEntryEditor.tsx`, `_form-system.scss`): D → leave.

## Piano FASE 1 (dopo go-ahead)

**Commit 1 — resizable** (`feat: add resizable flag to IR vertex views and enable rect/rounded resize`):
- Index già = A. Aggiungere: `discovery_2026-07-27_resizable_flag.md` (intero) + entry log resizable (via §6.1).
- Verifica `git diff --cached`: solo resizable, nessun bottone/listener/refactor.

**Commit 2 — propagazione** (`feat: propagate resized dimensions to all instances of an IR view`):
- `git add` interi: `events/registry.ts`, `sync/canvasToJjom.ts`.
- Hunk B: bottone in `VertexAuthoringPanel.tsx` (unstaged); listener + 3 import in `EditorV2.tsx` (patch → `git apply --cached`, no `-p` interattivo).
- Docs B: `discovery_2026-07-27_size_propagation.md`, `lir_2026-07-27_size_propagation.md` (+ size_readback? da confermare) + entry log propagazione (§6.1).
- Verifica `git diff --cached` di `EditorV2.tsx`: SOLO listener+import, nessun laneSeparation/BUG-DIAG.

**Chiusura**: C/D restano non committati; `git status` finale + `npm run build` verde; nessun push.

## Dubbi da chiarire con Alfonso (prima di FASE 1)

1. `discovery_2026-07-27_size_readback_object_node.md`: includerlo in commit 2 (B)? Sembra il razionale del "no read-back w/h" citato dal listener.
2. Questo `triage_...md`: lasciarlo untracked, o includerlo in uno dei due commit?
3. Le entry log C (edge 26/07) e la entry guard restano non committate insieme al resto: confermi che vanno lasciate (verranno committate quando quelle feature landano)?
