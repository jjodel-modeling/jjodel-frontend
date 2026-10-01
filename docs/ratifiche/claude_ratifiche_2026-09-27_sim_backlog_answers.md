# Ratifications 2026-09-27 17:07: the simulator backlog and the canvas run state

Chat: C-2026-09-27-1437. Alfonso answered «ok alle raccomandazioni» in chat on 2026-09-27 at about 17:07, on the twelve decisions awaiting him in two reports. Each decision below is ratified as the report recommends it.

## From `discovery_2026-09-27_sim_backlog_lanes.md` §8 (P-2026-09-27-1625)

- **A. The `∅` glyph (S13).** Decided on the 3001 walk; if unreadable, `sim-empty-glyph` runs in wave 2a before `sim-readiness-3`.
- **B. The demo script after E2 (S22, decision H).** E2 lands before the freeze: drop the Petri step 3 and its «Say», and say «Apply proposes 4».
- **C. R-SIM-74 and R-SIM-43 (S3).** Phase 1 now (`sim-derived-recursion`), no amendment before MODELS.
- **D. G3's canvas side (S15).** Phase 1 now, Phase 2 after MODELS (see the canvas answers below).
- **E. The checker gap (S16).** Phase 1 now (`sim-checker-gap`), Phase 2 after MODELS.
- **F. «Marking:» on a state machine (S14, R-SIM-82).** Keep «Marking:» for MODELS; revisit after.
- **G. The saved-states detector (S24, R-EDGE-3).** A producer, not a migration; built after `enum-step-b`'s Phase 1 and after MODELS.
- **H. The four hidden presets (S4, A2).** Hidden until the outputs and Accepting engine is merged; shown in S4's Phase 2, after MODELS.

## From `discovery_2026-09-27_sim_canvas_state.md` §12 (P-2026-09-27-1647)

1. R-SIM-33 3c's «critical zone» is read as a forecast: option A delivers 3c outside the critical zone without amending the row.
2. What the canvas shows during a run: a count on every place, 0 included; the initial-marking row muted during a run; one ring for enabled transitions and a distinct one for an open choice list; σ shown per element on the node.
3. Phase 2 runs after MODELS.
4. Option B (amending R-SIM-4) is not taken now; it reopens once JjEL runs inside the IR (J2).

The chat's own questions in both reports (§9 and §13) are answered as recommended, unattended (RC-25): wave 1 may use temporary worktrees; `sim-readiness-3` runs as soon as E2 merges; `sim-modal` Phase 1 waits; canvas slice A1 alone and A2 in the panel chain; the other presets are measured in Phase 2's checklist; Phase 2's DOVE includes `styles/tokens/`.
