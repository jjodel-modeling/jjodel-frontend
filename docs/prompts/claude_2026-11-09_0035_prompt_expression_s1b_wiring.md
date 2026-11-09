# Expression catalog S1b: fold on the canvas, formulas in the owners (closes S1)

Prompt-ID: P-2026-11-09-0035
Chat: C-2026-11-01-1434
Front: plugins
Lane: full (critical zone CLAUDE.md §3.1, `viewpoint/ir/`; go-ahead of Alfonso 2026-11-08 23:39)
Status: eseguito 2026-11-09 · lane full · b42ddc837 · verifica visiva dovuta · log entry in docs/log-inbox/plugins.md
Request: https://claude.ai/code/session_01DQt9R32KVprpjZZCfe6Sbp
Depends: P-2026-11-09-0010

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 non si applica (motivo: design in the two handoffs and the committed LIR `docs/discovery/lir_2026-11-08_expression_fold.md`).

Worktree: `~/jjodel-w-exprcat`, branch `expression-catalog`, HEAD at the commit that adds this prompt, on top of the S1a
code `985c27b54` (golden test 57/57). Clean tree. Model and tier as pinned (RC-16), effort `xhigh`.

## Lane discipline

Every reply opens with `[P-2026-11-09-0035 · session <id>]` (every reply, including interim ones); final message ends
with `Outcome: done | hard-stop | question | blocked`; one `Recommended:` line per question. Time limit 90 minutes. Gates
through `node scripts/run-quiet.mjs`. Load gate before each probe run: `uptime`, 1-minute load ≤ 16 (wait up to 15
minutes, then run and record it). No push, no merge.

**Context is the binding constraint: three sessions in a row stopped at AM-8.** Read ONLY:
`~/.jjodel-lanes/P-2026-11-09-0010/handoff.md` (API of the S1a modules and «Facts S1b needs»), the «Wiring» paragraph of
`~/.jjodel-lanes/P-2026-11-08-2345/handoff.md` (`grep -n -A12 '^\*\*Wiring' <file>`), the file list of the LIR, and the
exact lines of each wiring site it names (read ±30 lines around them, never a whole file). Do not read the S1a sources:
use the API in the handoff. Never print the fixtures or the XMI. Write the handoff before the soft ceiling.

## COSA

1. Tests first where a seam exists (the `TextSource` handler, `objectSnapshotParts` byte-identical when no text, the
   fold set feeding the hidden union).
2. Wiring as the S1 handoff's «Wiring» says: `irReadCtx` gets `getExpressionText` as an injected optional parameter
   (zero imports kept); `objectSnapshotParts`; `useIRContainment` `foldHidden` joined to the hidden union; the
   `TextSource` member `{from:'expression', slot}` and its handlers, with the text monospace, wrapped, clamped and a
   «show all»; the viewpoint field `exprFold` that activates the fold (R-EXP-4); importing a binding JSON into the
   metamodel `_state.exprBinding` through the same write path `ontoBindings` uses; explicit degradation when the binding
   is missing or invalid (R-EXP-12: objects stay nodes, authoring says why). Expose the Brief binding
   (`frontend/src/model/expression/bindings/brief.json`) for import. If a new sync write path or a CLAUDE.md §3.2 file is
   needed, stop and ask.
3. Gates: typecheck, vitest (baseline: the known import failures, 3 measured by S1a), build, smoke, `check:scripts`,
   `check:docs`, `bpmn-lanes` probe 12/12.
4. Probe on this worktree: import `~/Downloads/micron-proto/out/dram/jjodel/Brief.ecore` (or the metamodel the
   prototype uses) and `ddr4_closed_v.xmi`, import the Brief binding, activate the fold, run Auto layout. Record: nodes
   and edges (expected 249 and 248), the formula present in a sample of owners, editing a constant in the tree updates
   its owner's text, open time against the discovery's 16-19 s. Verify the three assumptions of the S1a handoff
   (`idlookup` identity per update, `composition` on imported references, boolean attribute form). Screenshots for the
   chat in the lane folder.
5. Code commit with explicit pathspec. Log entry in the `plugins` inbox closing S1 (P-2026-11-08-2345, P-2026-11-09-0010
   and this prompt; note the 20 classes without a role that print `<Class>`, outside the DDR4 fixture) and Status flips
   of the three prompts, uncommitted (RC-17). Stop every server you started. Exit `Outcome: hard-stop (visual check due)`.

## HARD STOP

A red gate, the golden test broken, fewer or more than 249 nodes without an explanation, a change outside the LIR's file
list, or a §3.2 trigger: stop before the code commit with the evidence and one `Recommended:` line.

## NON FARE

No removal of folded vertices (S4), no rows for parameters and properties (S5), no auto-binding (S6), no editing (S7).
No change to the S1a modules beyond a bug the wiring exposes (say so). No change under `~/Downloads/micron-proto`.
No new dependencies. Commit type for code: `feat(expression)`.
