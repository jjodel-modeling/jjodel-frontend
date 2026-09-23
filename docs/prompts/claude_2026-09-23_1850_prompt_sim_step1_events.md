# Prompt: simulation step 1, events as M1 instances

Prompt-ID: P-2026-09-23-1850
Status: da eseguire
Worktree: `~/jjodel-sim`, branch `simulation-engine`. Before anything else, fast-forward it to the trunk: `git merge --ff-only alfonso-frontend-jjtl`. If the fast-forward is refused, stop and report. Do not work in `~/jjodel-release`: another lane (`P-2026-09-22-2105`) is open there with uncommitted changes. Do not work in `~/jjodel`.
Two-phase. Phase 1 is read-only and ends with a saved report and a hard stop. Phase 2 starts only on a GO that opens with this ID.

## COSA

Step 1 of the six-step plan of the computational model: events. The decisions are R-SIM-16 (this step) and R-SIM-12 in `docs/decisions.md`; read them first, they are normative. In short:

- Event instances live in the same M1 model as the machine. The STC gains an event role: the event metaclass, the trigger reference on the transition metaclass, the identifier feature on the event metaclass.
- A transition's trigger matches the current event by identity (`trigger === eventId`), not by `isKindOf`.
- The panel shows one `>` button per event instance, labelled with its identifier feature, plus one ε button for transitions without a trigger. An event button is enabled iff the event is the trigger of at least one transition leaving a marked node. Guards are not evaluated (there are none yet). A transition without a trigger is enabled only in the ε step.
- The engine is total: a step is defined for every event in every configuration. An event that enables no transition yields a discard, a step with the configuration unchanged, recorded in the step label.
- Without the event role the alphabet is {ε} and the engine behaves exactly as today. Trace parity on existing models is the regression oracle.
- STC roles are disjoint under `isKindOf`: an event instance cannot also match the node or transition role. Checked when the STC is saved.

Out of scope, do not start: guards, actions, `Expression` and `Action` types, the `.[x]` state accessor (R-SIM-17..19, step 3); the selector and interleaving (R-SIM-7, step 3); scenarios and trace export (step 5); `.smv` export; candidates on the canvas.

## DOVE

Phase 1 reads, under `frontend/src/`: `model/simulation/types.ts`, `step.ts`, `stcFromRoles.ts`, `isKindOf.ts`, `model/simulation/__tests__/`; `components/editor-v2/sim/SimulationPanel.tsx`, `simRunState.ts`, `simulation-panel.scss`; the place where the M2-side panel writes the `sim*` role keys (R-SIM-2) and the adapter that implements `SimModelView`. Also `docs/spec/claude_spec_2026-09-13_computational_model.md` §3.1, §4, §7 and the slice 0 prompt `docs/prompts/claude_2026-09-14_0140_prompt_sim_slice0_foundations.md`.

Phase 2 is expected to touch the files above in `model/simulation/` and `components/editor-v2/sim/`, plus their tests. Any other file is declared in the report before the GO.

## COME

### Phase 1 (read-only)

1. Describe the step as it runs today on the trunk: what `stepFlowchartBoolean` fires, how the panel calls it, where `event: null` is threaded. File and line for each.
2. **Open question for Alfonso, the most important one.** Slice 0 kept the fire-all step (every transition of every marked instance in one step); interleaving with a selector arrives only in step 3 (R-SIM-7). With events, two options exist: (a) the event restricts today's fire-all step to the transitions whose trigger matches (ε: those without a trigger), and interleaving waits for step 3; (b) step 1 already brings interleaving with a minimal selector. Show, on a concrete model, where (a) and (b) differ (two transitions from the same marked node on the same event; two marked nodes). Recommend one with the diff each implies. Do not decide.
3. Propose the three new flat keys of the M2 bag for the event role, in the style of R-SIM-2 (pointer values, no nested object). Before proposing any name, grep the whole codebase for it and report the result (`grep -rn` on `frontend/src`). Say how `stcFromRoles` and `StcDescriptor` grow, keeping the event role optional.
4. Say how the core enumerates the event instances of the model through `SimModelView` without touching `idlookup` or L proxies, and which methods the adapter needs (for example `transitionTrigger(id)`, `label(id)`). Signatures only.
5. Say where the disjointness check on role metaclasses fits (STC save path) and whether `isKindOf.ts` already offers what it needs.
6. Propose how `SimConfiguration.event` and `StepLabel` grow (the current event or ε; a `discarded` flag), keeping slice 0 consumers compiling.
7. Test plan: the parity oracle (every existing simulation test and model gives the same trace with no event role), the identity match, the structural enabling of buttons, the discard, the disjointness check. Name one mutation per rule that a test must catch.
8. Measure the baseline gates now: typecheck error set, vitest count, build.

Save the report as `docs/discovery/discovery_2026-09-23_sim_step1_events.md`: objective, files read with full paths, findings, risks, open questions for Alfonso (item 2 first), the proposed Phase 2 diff in prose. Commit it alone, with pathspec, on `simulation-engine`. Hard stop: the phase is not complete until the report is on disk and committed.

### Phase 2 (after GO)

1. Implement what the GO ratifies, core first (`model/simulation/`, pure, no React), then adapter and panel.
2. Panel: an Events section with one `>` button per event instance and the ε button, enabled per R-SIM-16; disabled buttons stay visible. Bootstrap Icons only, 8px grid, 11px secondary text, no layout shift when enablement changes.
3. Tests as in Phase 1 item 7, each rule proven by its mutation; report the mutations.
4. Gates: typecheck with the same error set as the baseline, vitest, build, `npm run check:docs`, `npm run check:agents`.
5. Hard stop for Alfonso's visual check on 3001: a turnstile (states `Locked`, `Unlocked`; events `coin`, `push`; `Locked -coin-> Unlocked`, `Unlocked -push-> Locked`, `Locked -push-> Locked`): buttons enable and disable with the marking, `coin` on `Unlocked` is disabled; an existing flowchart runs as before with only the ε button.
6. After the OK: one code commit with pathspec, then one docs commit with the entry appended to `docs/log-inbox/simulation.md`. P6 trailer `Model: ...` in both bodies. Subjects end with `(P-2026-09-23-1850)` and stay within 72 characters.

Never: `git add .`, `git stash`, commits on `alfonso-frontend-jjtl` or in `~/jjodel-release`, push. The merge of `simulation-engine` into the trunk is a separate decision.

## RIFERIMENTI

- `docs/decisions.md`: R-SIM-1, R-SIM-2, R-SIM-7..16 (R-SIM-17..19 for context only).
- `docs/spec/claude_spec_2026-09-13_computational_model.md`, especially §3.1 (roles), §4 (step), §7 (languages without events).
- `docs/discovery/discovery_2026-09-13_simulation_engine_state.md`.
- Slice 0 code commits on the trunk: `135ab7a24`, `25cd6149a`, `857cb9335`.
