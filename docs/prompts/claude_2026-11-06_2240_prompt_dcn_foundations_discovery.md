# DCN foundations, discovery: dormant slots on the R-OI instance level, a second simulation nucleus, `self.in`

Prompt-ID: P-2026-11-06-2240
Chat: C-2026-11-06-2159
Front: dcn
Status: eseguito 2026-11-06 · lane full · discovery, no code · report docs/discovery/discovery_2026-11-06_dcn_foundations.md (§0-§5, c35064743..6ebd9d064) · stopped at the soft context ceiling, continued by P-2026-11-06-2250
Lane: full (discovery, read only)
Depends: R-DCN-1..8, R-OI-1..16, R-SIM-21..33, R-SIM-47..55, R-SIM-137..141, R-SIM-144
Worktree: ~/jjodel-dcn, branch dcn, at this prompt's commit on alfonso-frontend-jjtl (no node_modules: if a probe needs them, the P14 symlink to ~/jjodel/frontend/node_modules, removed at the end)
Request: https://claude.ai/code/session_01DQt9R4H8ma8MFTYqMZbPso (Alfonso 2026-11-06 22:13 «sì a tutti i consigli», 22:26 «il fronte è di questa chat»)

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. Read only: no source file changes on any branch; you write the discovery report and throwaway probes in the lane folder ~/.jjodel-lanes/P-2026-11-06-2240/. The R-OI code is not on the trunk: read it with `git show <ref>:<path>` or from the existing worktrees, never check those branches out and never write in their worktrees. No subagents, no background tasks. Every reply opens with [P-2026-11-06-2240 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Every question with a recommendation carries it in one line: `Recommended: <one line>`. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD. Write the report section by section, committing after each (RC-51).

## Contesto (non rifare l'analisi)

The spec `docs/spec/claude_spec_2026-11-06_dcn_metamodel_simulation.md` is ratified (R-DCN-1..8). It defines the DCN metamodel (static classes owning viewpoints of dynamic classes, each with an invariant, attributes, operations, monitors), its object level on the R-OI instance level, the well-formedness checks W1..W5, the step semantics (invocations and ticks, Interleave and Sync), and the export to nuXmv. Do not reopen the decisions; measure what the code needs for slices 2 to 6 of spec §10.

## COSA

(1) **R-OI instance level and dormant slots.** On `oi-s2u` (809d85ce1, the reconciled undo groups of 2026-11-06) and `oi-s3b` (f6bf690b7, S3a and S3b on the older oi-s2u): where the binding is declared (`model/ontological/bindingCodec.ts`, `ontoBindings`) and how the closure of features of a classifier is computed for slot synthesis, «Sync slots», ghost rows and the `instantiation` problems (missing, orphan, O3, O5). What it takes for that closure to include the features of the dynamic classes of the classifier's viewpoints, which are contained by a Viewpoint and are not superclasses; whether the binding can name a second «feature source» role or must be extended; where an orphan is decided, and the smallest change that makes a dormant slot not orphan (the R-OI-13 amendment of R-DCN-3). Name every file that change touches and whether it is in the critical zone (CLAUDE.md §3.1, §3.2).
(2) **The DCN metamodel as a Jjodel metamodel.** Whether the core types `Expression` and `Action` (R-SIM-17) can type attributes of `DynamicClass`, `Operation` and `Monitor` today, how they are validated, and whether `Range[lo..hi]` exists as a data type or must be modelled (two integer bounds on Attribute). Build the spec §3 metamodel on top of the UML fixture (`uml-fixture`, 3cc526e5e, or the fixture on `oi-s3b`) as a throwaway in the lane folder if it helps; report what does not fit.
(3) **A second simulation nucleus.** In `frontend/src/model/simulation/` (netTypes.ts, netStep.ts, netCompile.ts, roleCatalog.ts, simProfiles.ts, profileBinder.ts, profileCodec.ts, watchEvaluator.ts, scenarioCodec.ts, simRandom.ts, guardEvaluator.ts, actionEvaluator.ts, guardContext.ts, objectSlots.ts) and in the run state and panel under `frontend/src/components/editor-v2/sim/`: what is Petri-specific (marking, preset/postset, tokens) and what is nucleus-neutral (run state, five run states, selector and «Choices: Ask | Random», trace, step back, slider, scenarios, watches, I/O board, Clock); where a second nucleus would register and be chosen by the profile; whether the configuration σ as a vector of slot values fits the snapshot, step back and scenario codecs as they are; how actions assign today (`.[x]` state attributes versus model slots) and what assigning a slot value of an instance in the run, never in the model, needs.
(4) **`self.in(V::D)`.** Where a JjEL accessor of this kind would go (lexer, parser, evaluator, `guardContext.ts`, the tri-state of `jjelTriState.ts`), whether `::` already has a meaning in JjEL or only in JjScript (`Enum::Lit`), and what `docs/spec/concern_languages.md` must say first. No implementation.
(5) **Exporter.** Which existing exporter code the §9 mapping can reuse (`bvToSmv.ts`, the .smv preview of the Simulation roles modal, `boundExploration.ts`), and whether W5 by enumeration can reuse `boundExploration.ts`.
(6) **Lane plan** for slices 2 to 6: lanes in order, each at five files or fewer, with files, visual yes/no, critical-zone yes/no, and which lanes depend on the R-OI branches reaching the trunk (they merge only after the 3.2.0 tag). Then decisions Q1..Qn, one recommendation each. Expected at least: whether DCN slice 2 is cut from `oi-s2u` or waits for the trunk; whether `DynamicClass` is a Classifier in the R-OI binding sense; where the DCN fixture (the drone of the LNCS 16470 chapter, Fig. 5 and Fig. 9) lives.

Discovery report, mandatory: docs/discovery/discovery_2026-11-06_dcn_foundations.md (the hypothesis being falsified, objective, files read with full paths, findings with file:line and verbatim quotes, dependencies and risks, open questions), committed on branch dcn, plus the Status flip of this prompt left uncommitted (RC-17). Hard stop after the report. No push, no merge. Public repo: name no partner company. Final message: findings in short, Q1..Qn with recommendations, then the Outcome.

## HARD STOP

After the report is committed. Any change outside the report and the lane folder is a stop with Outcome: blocked.

## NON FARE

No checkout of `oi-*` branches, no edits in their worktrees, no source changes, no new decision rows, no edits to docs/decisions.md or the spec.

## DOVE

Read: the paths of COSA (1) to (5), on the trunk and on `oi-s2u`, `oi-s3b`, `uml-fixture`; `docs/spec/claude_spec_2026-11-06_dcn_metamodel_simulation.md`; `docs/spec/claude_spec_2026-09-13_computational_model.md`; `docs/spec/concern_languages.md`. Write: the report and the lane folder.

## RIFERIMENTI

docs/decisions.md R-DCN-1..8, R-OI-1..16, R-SIM-17, R-SIM-21..33, R-SIM-47..55, R-SIM-122, R-SIM-137..141, R-SIM-144; docs/discovery/discovery_2026-10-21_onto_s3a_slot_problems.md; docs/discovery/discovery_2026-10-21_onto_s3b_ghost_rows.md.
