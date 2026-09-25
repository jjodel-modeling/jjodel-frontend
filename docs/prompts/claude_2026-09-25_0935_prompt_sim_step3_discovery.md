# Prompt: simulation step 3, the Petri core and the unified cycle (discovery)

Prompt-ID: P-2026-09-25-0935
Chat: C-2026-09-25-0016
Status: da eseguire

Worktree: `~/jjodel-sim`, branch `simulation-engine`, at `dee18d69b` (a fast-forward of the trunk: it holds the harness gate, step 2, R-SIM-21..26 and the log rotation). Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-sim` on `simulation-engine`, stop and say so; never work by absolute path on another worktree. Do not touch `~/jjodel-release`, `~/jjodel-open` (a discovery lane may be running there), `~/jjodel-gate`, `~/jjodel`, `~/jjodel-harness`. The untracked `frontend/scripts/smoke/_tmp_sim1_verify.ts` is Alfonso's: leave it.

Two-phase. **This prompt covers Phase 1 only**: read-only, it ends with a saved and committed report and a hard stop. Phase 2 is written in chat from the report and reaches this session as a GO that opens with this ID. If the proposal touches a file of `CLAUDE.md` §3.2 or a D-layer write path (the IR `'mark'` channel, `ReadCtx.isMarked`, `ObjectNode.tsx`), the report carries a Layer Impact Report draft.

## COSA

Step 3 of the six-step plan (spec §9.3): condition and assignment roles, one unified cycle, now on the Petri core ratified on 2026-09-25. Binding constraints, read them in `docs/decisions.md` before anything else: R-SIM-7..20 and **R-SIM-21..26** (section «Ratifiche 2026-09-25: nucleo di Petri», memo `docs/ratifiche/claude_ratifiche_2026-09-25_rsim21_nucleo_petri.md`). In short: the transition with preset and postset is the core; flowchart and statechart are special cases; fork and join are compilation instructions (optional roles `simFork`, `simJoin`), AND-join without tokens on arcs; marking in bounded naturals 0..k, k from the STC, default 1, error «unsafe» beyond k; arc weights, default 1; inhibitors as guards over a read-only marking accessor; flowchart constructs reduced to guard with explicit `else`, external choice as a selector policy, fork/join; termination is a property of the marking; interleaving unchanged, one firing per step.

The phase answers four questions, in this order:

1. **Where the engine stands.** How `step.ts`, `stcFromRoles.ts`, `types.ts`, `objectSlots.ts`, `isKindOf.ts`, `simRunState.ts`, `simRoleStatus.ts` and `SimulationPanel.tsx` implement today's cycle: the boolean `Set` marking, `simApplyStep` and its "activation wins" rule, candidates of step 1 (events), the guard path of step 2, the four `runStatus` values, and where `simTerminal` is read (`stcFromRoles.ts:25`, `:55`). File:line for each.
2. **The target, as types.** A proposal for: σ as `place → 0..k` plus the declared state attributes of R-SIM-19; the compiled net (transitions with weighted preset and postset, guard, actions, trigger) produced from the STC roles for the three kinds (flowchart, statechart, Petri), with `simFork`/`simJoin` as compilation rules; candidates (§4.2 of the spec, now with weights and inhibitor guards); admissibility and progress (§4.3); effect (§4.4: consume, produce, parallel assignments on σ, the «unsafe» check); label (§4.5). Pure core in `frontend/src/model/simulation/`, no React (R-SIM-14). Say what of today's code survives, what is replaced, and what the derived boolean view `isMarked` becomes (R-SIM-11) so that `ObjectNode.tsx` and the IR keep working unchanged.
3. **The four open points of R-SIM-26 and R-SIM-24**, each with a recommended answer, the alternatives and their cost: (a) the form of the termination predicate; (b) the fate of the `simTerminal` role (source of the default predicate, or optional); (c) whether the engine distinguishes termination from deadlock, and how `runStatus` changes; (d) the form of the read-only marking accessor for inhibitor guards, starting from `marked` (R-SIM-11), with no new root beyond `self`, `event`, `model`, `node`, and whether the step 2 subset checker accepts it as exportable.
4. **The slicing.** Step 3 is too large for one lane. Propose waves, each closable with its own gates, for example: 3a the pure core (types, compiler from roles to net, step function, tests), no UI; 3b the panel and the run-state on the new core; 3c candidate highlighting on the canvas as a second channel beside `'mark'` (critical zone). Say what each wave touches and in which order; the Phase 2 proposal of this report covers **3a only**.

Two carried items from `P-2026-09-24-1520`, to settle in the report: every caller of `buildEvalContext` in the simulator must pass the model's metamodel as `targetMetamodelId`, otherwise it falls back to the active one (the same defect exists in validation: report it, do not fix it); and a runtime check of the guard context on real L proxies, not only on fixtures. Tests live in `src/**/__tests__/` (`frontend/vitest.config.ts:16`).

Out of scope: any code edit; the `Expression` data type in the core (a separate proposal, not ratified); step 4 snapshots, step 5 traces and scenarios, the `.smv` exporter; the evaluator in `jjel/evaluator/*`; validation code beyond reporting the `targetMetamodelId` defect.

## DOVE

Read in full: the eleven files under `frontend/src/model/simulation/` and `frontend/src/components/editor-v2/sim/` (plus their tests), `docs/spec/claude_spec_2026-09-13_computational_model.md` (§3, §4, §5, §9.3, §11), `docs/decisions.md` R-SIM-1..26, the step 1 and step 2 discovery reports (`docs/discovery/discovery_2026-09-2*_sim_*`), the consumers of the boolean marking (`ObjectNode.tsx` `sim-active`, the IR `{ op: 'marked' }`, `ReadCtx.isMarked`, channel `'mark'`), and every caller of `buildEvalContext`.

## COME

1. The map of question 1, as a table: function, file:line, what it does today, what the Petri core changes.
2. The proposal of question 2: TypeScript type declarations in the report (not in the tree), the compilation rules per STC kind as a table (role → preset, postset, weights), and three worked examples compiled by hand: a flowchart with a decision block and an `else`; a statechart with an event trigger; a small net with a parallel fork, an AND-join and an inhibitor. For each, the candidate set and one step computed on paper.
3. Question 3: one subsection per open point, recommendation first.
4. Question 4: the waves, with the files each touches, and the Phase 2 proposal for 3a in prose: files, count, test plan with one mutation per rule (enabling with weights, progress, «unsafe», parallel assignment reading σ, `else` as the complement of the guards, AND-join, inhibitor, the derived `isMarked` equal to today's on the existing examples). Measure, do not assume: run the current simulation tests and record which ones encode behaviour R-SIM-21..26 changes.
5. Baseline gates now, from `frontend/` with the P14 temporary `node_modules` symlink: `npm run typecheck` (14, the §17 set), `npx vitest run` (expected 4530, the 9 files red at import), `npm run build`, `npm run check:docs`, `npm run check:scripts` (1 hit expected, the untracked `_tmp_sim1_verify.ts:186`, not a stop).

**Discovery report (mandatory).** Save it as `docs/discovery/discovery_2026-09-25_sim_step3_petri_core.md` (path `docs/discovery/`, naming `discovery_<YYYY-MM-DD>_<description>.md`). Content: hypotheses tested and verdicts, objective, files read with full paths, findings with file:line and verbatim quotes, **open questions for Alfonso first** (the four of question 3 at the top, each with the recommendation), dependencies and risks, the wave plan, the 3a proposal with its test plan, the LIR draft if needed. Commit it alone on `simulation-engine`, pathspec after `--`, subject `docs: discovery on simulation step 3, Petri core (P-2026-09-25-0935)`, `Model:` trailer. **Hard stop**: the phase is not complete until the report is on disk and committed. Then report in chat, opening with `[P-2026-09-25-0935 · session <id>]`, and wait. No log entry in Phase 1. `git status` empty at the end (symlink removed).

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, commits outside `simulation-engine`, push, any edit to a source file.

## RIFERIMENTI

- `docs/decisions.md` R-SIM-1..26; memo `docs/ratifiche/claude_ratifiche_2026-09-25_rsim21_nucleo_petri.md`.
- `docs/spec/claude_spec_2026-09-13_computational_model.md`.
- `docs/prompts/claude_2026-09-24_1520_prompt_sim_step2_eval_context.md` and its log entry (now in `docs/claude-code-log.md`).
- `CLAUDE.md` §3.2 (critical zone, LIR), `docs/PROTOCOL.md` P4, P13, P14.
