# Layer Impact Report: guard and action checks in the problems list (P2a)

- Prompt-ID: `P-2026-09-27-1805` (chat `C-2026-09-27-1437`), Phase 2 of `P-2026-09-27-1726`
- Tree: `~/jjodel-w-checker`, branch `sim-checker-gap`, HEAD `4cc0c4c20` at the start
- Go-ahead: `lane-run --critical-zone-goahead P-2026-09-27-1805` (RC-30); `JJODEL_CRITICAL_ZONE_GOAHEAD` read in the
  session as `P-2026-09-27-1805`
- Source: `docs/discovery/discovery_2026-09-27_sim_checker_gap.md` §7 option A, §9, §13, §14 (the draft this report
  finalizes), and the chat's answers at its end

Committed before the first edit of a critical-zone file (`problems/`, CLAUDE.md §3.1), as RC-30 and the prompt ask.

## 1. Files (Rule 19: five code paths, stated before the first edit)

| File | Change |
|---|---|
| `frontend/src/components/editor-v2/problems/registry.ts` | `'simulation'` added to `NodeProblemKind`, with a comment in the form of the `'validation'` one |
| `frontend/src/components/editor-v2/problems/simCheckToProblems.ts` (new) | pure: runs the bridge's `startRun`, maps its guard and action `compileDefects` and the `else-*` net defects to entries, registers them under the DObject and the resolved DVertex, revokes by owner |
| `frontend/src/components/editor-v2/problems/SimCheckProblemSync.tsx` (new) | the mounted producer: a `useSelector` signature, a 500 ms debounce, the store's lookup and `buildEvalContext` handed to the pure module, cleanup on unmount and on a model switch |
| `frontend/src/components/editor-v2/problems/__tests__/simCheckToProblems.test.ts` (new) | node tests driven through `startRun` on raw lookups (P11) |
| `frontend/src/components/editor-v2/EditorV2.tsx` | one import, one mount line beside `ConformanceProblemSync` |

Docs: this file, `docs/log-inbox/simulation.md`, the Status line of the prompt. `docs/decisions.md` is not in this
lane's ownership map (read-only), so the R-SIM row for the producer is owed, not written (§4).

Not touched: `simBridge.ts` and its test (lane `sim-derived-recursion`), `UniquenessProblemSync.tsx` (lane
`enum-step-b`), every consumer of the registry.

## 2. The report

```
LAYER IMPACT REPORT (P2a, final)

Layers touched:
  [ ] D-layer (Redux raw data)          read only: idlookup through useSelector and store.getState
  [ ] L-layer (computed proxies)        read only, inside buildEvalContext (the call the panel's Reset makes)
  [ ] JjOM (model entities)
  [x] Canvas v2-flow (ReactFlow nodes/edges)   indirectly: NodeProblemIndicator on ObjectNode shows new entries
  [ ] Canvas classic
  [ ] Sync layer (useJjomSync hooks)
  [ ] Persistence (VersionFixer / jsxString)

Problems registry (critical-zone directory, §3.1):
  - What changes: one literal in NodeProblemKind; a fourth producer writing kind 'simulation',
    ownerModelId = the open M1, revoke by getProblemIdsOwnedBy('simulation', modelid), then
    markResolved; clearProblem of the model's entries on unmount and on a model switch.
  - What does NOT change: the store, the three producers, their ids and kinds, the consumers
    (indicator, overlay, tree, formDiagnostics), NodeProblem's shape (no new property).
  - Cross-layer interaction: reads the metamodel's bag and the M1 through startRun (pure over the
    lookup); writes nothing to Redux; no TRANSACTION, no creator (Rule 12 not engaged).
  - Side-effect safety: startRun builds a run object that is discarded; the panel's run singleton
    (simRunState) is never touched (startRun does not call simReset); buildEvalContext is the call
    the panel's Reset makes, with the same projectId source.

Canvas v2-flow:
  - What changes: a dot on the vertex of an element with a guard or action defect.
  - What does NOT change: nodes, edges, handles, layout; no ReactFlow state is written.

Smoke-test scenarios potentially affected:
  - ESM demo (script §2.3) between Apply and the declarations: 2 new entries (tc, tp), 0 after.
  - Flow B demo (§2.4) before declaring count: 1 new entry (f2).
  - Petri and State machine demos: none (measured 0 Reset defects in Phase 1).
  - A model with no sim guard or action role bound: none (the producer's signature is '', it is inert).
  - A metamodel open (M2 face): none (no instanceof, signature '').
  - Two models of one metamodel open: each revokes only its own entries (ownerModelId).
  - Close the editor: the model's 'simulation' entries are cleared.
```

## 3. Design points fixed here (within the report's option A)

1. **Inert unless bound.** The selector returns `''` before any walk when the open model has no metamodel bag, or
   the bag binds none of `simGuard`, `simAction`, `simEntry`, `simExit`. Only then is `runSignature` computed, so
   the per-dispatch cost lands on simulation-bound M1 models only (risk 2 of the report). Its cost is measured on a
   large synthetic lookup in the test commit.
2. **Dedup by the same parser.** A guard `parse-error` is skipped when the guard feature is typed
   `Pointer_EXPRESSION`; an action (`action`, `entry`, `exit`) `parse-error` when its feature is typed
   `Pointer_ACTION`. Those are the cases where conformance runs the same parser (`parseExpressionStrict`,
   `parseAction`) on the same text (`ConformanceValidator.ts:238-258`). Any other typing (EString, R-SIM-44) keeps
   the entry.
3. **`node#edge` goes to the node.** The report's §9 test list says «split to the edge»; the defects line names
   `element.split('#')[0]` (`simBridge.ts`, `defectSubject`), the node, and the registry says what Reset says
   (report §7). The node is also the element with a vertex; an edge drawn as an edge has no dot (risk 6).
4. **Title and description.** Title `Guard`, `Action`, `Entry` or `Exit`, then `: ` and the short form the defects
   line shows (`d.short`, else the form of the bridge's private `defectShort` for the three reasons a guard or an
   action compile defect can carry); description: the detail, then the source in brackets, as `defectsTitle`. The
   rail's residue shows the title (`formDiagnostics.ts:95-98`), so the title carries the short form, not the bare
   role.
5. **Net defects.** `else-twice` and `else-position` only, title `Guard: <message>`; the other net defects are
   structural and stay on the defects line.
6. **Refused run.** Nothing is published and the model's entries are revoked (R-SIM-17: no STC, no contextual
   check). The panel's overlap refusal (R-SIM-16) is the panel's; the producer does not repeat it.

## 4. Owed

- An R-SIM row for the producer in `docs/decisions.md` (report §14), written by the merge or a docs lane that owns
  the file: `problems/` gains kind `'simulation'`, producer `SimCheckProblemSync` over `startRun`, the decisions of
  §3 above.

## 5. Closure (P2a done, P2b not started)

- Code: `0412501ef`, the five files of §1. Tests 19 new, red first (18 at collection); mutation bench 22/22 killed
  (list in the commit body).
- Selector cost (`simCheckSignature`, node, synthetic lookups, median of 30): unbound 0.00 ms at every size; bound
  0.05 ms at 17 objects, 1.2 ms at 500, 9.7 ms at 2000, 30 ms at 5000 (27k lookup entries). Threshold named: under one
  16 ms frame per dispatch up to about 2000 objects of a simulation-bound M1. Above it, the report's fallback (key the
  effect on `useConformance`'s result plus the bag's `sim*` string) applies.
- Probe on 3020, ESM preset alone in its page (`_tmp_checker_p2a.ts`, gitignored), exit 0:
  1. after Apply, before the declarations: 4 entries (`tc`, `tp`, each on the DObject and the vertex), title
     `Action: undeclared 'coins' on demoESM`, 2 dots `--error`; the Reset line says the same 2 defects;
  2. after the two declarations: 0 entries, 0 dots;
  3. `tp.guard = node.[x] > 0`: 2 entries `Guard: E-NODE`, 1 dot on `tp`, overlay title `Guard: E-NODE` with the
     detail and `[node.[x] > 0]`; Reset: `1 defect: tp guard (E-NODE).`;
  4. guard restored: the dot turns `--resolved`, then leaves after the TTL, 0 entries;
  5. console: 1 error, the known `failed to get project {project: null}`.
  The rail item of report §9 is not closable on this preset: with `tp` selected (`_lastSelected.modelElement`), the
  page holds no `.ir-form`, so the rail that shows the residue is not the one rendered here (`_tmp_checker_p2a_rail.ts`).
  Crops, light and dark: `~/.jjodel-lanes/shots_sim-checker-gap/` (`1_`, `3_`, `4_`, `5_`). In `3_…_overlay_dark` the
  overlay stays light on a dark canvas: `NodeProblemOverlay` styling, not changed here, not investigated.
- P2b (`stcChecks.ts`, rules R1-R5) was not started. Its wiring is `guardDefectsOf` and `actionDefectsOf` in
  `simBridge.ts` with `simBridge.test.ts`, and R3 splits `foldActionTarget` (`actionEvaluator.ts`); all three belong
  to lane `sim-derived-recursion` in the ownership map, whose unmerged `d2a19ccab` already changes `simBridge.ts`. The
  report's decision 7 queues P2b behind the `simBridge.ts` lanes. Question to the chat, with its recommendation, in
  the session's final message.
