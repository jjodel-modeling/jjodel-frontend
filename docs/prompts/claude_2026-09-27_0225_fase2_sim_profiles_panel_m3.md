# Prompt: Phase 2, the simulation profiles reach the panel (M3: preset row, binder, summary, Configure…)

Prompt-ID: P-2026-09-27-0225
Chat: C-2026-09-26-1702
Lane: full (eight files, two code commits, visual check; no critical zone)
Status: eseguito 2026-09-27 · lane sim-profiles · 48ab676df, d1d1bba2b

Worktree: `~/jjodel-gate`, branch `sim-profiles`, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-gate`, branch `sim-profiles`, `git log -1` is the commit that adds this file (subject `docs: add Phase 2 of the profiles panel lane, M3 (P-2026-09-27-0225)`), below it the R-SIM-77..79 rows commit, the merge of the trunk `3b7770708` and the discovery `1dddb15ae`; `.claude/settings.json` has no `Bash(git commit*)` in `permissions.ask`; `git status` empty apart from gitignored `frontend/scripts/smoke/_tmp_*`. Otherwise stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-27-0225 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

## COSA

Implement option M3 of `docs/discovery/discovery_2026-09-27_sim_profiles_panel.md` (§4 M3, §7 D1..D10) as decided in R-SIM-77..79 (read them whole in `docs/decisions.md`; the two RC-27 constraints are in R-SIM-77: Apply confirms a listed proposal, a role with candidates is «Not checkable: choose …», never a silent no-op). After this lane, on a metamodel the Simulation panel has a «Profile» row with the four demo presets (Petri net, Flowchart / Activity, State machine, Extended state machine), a summary line (`Checkable` or `Not checkable` plus the missing items; the proposed bindings before Apply; `Set but off: …` for set keys the profile turns off), Apply that writes one `state` assignment (bound values of unset `edit` keys plus `simProfile`, after the overlap check, one undo step), and «Configure…» that folds and unfolds the inline groups; the panel body gets a `max-height` with scroll. The engine keeps reading the bag as today (D4). Four points stay with Alfonso (report §8): the lane implements the recommendation for A1, A2 and A4 and does not amend R-SIM-54 (A3), so under the Petri preset the demo net shows `Set but off: Guard` in the information line.

## DOVE

Code commit 1, pure layer:

- `frontend/src/model/simulation/profileBinder.ts` (new; name check first): `bindProfile(profile, sketch) → per role bound | candidates | none` with reasons, the structural tests of report §3, ties never resolved.
- `frontend/src/components/editor-v2/sim/metamodelSketch.ts` (new): the pure collector of `MetamodelSketch` from the raw lookup (classes, attributes with type ids, references with owner and target, abstract, extends).
- `frontend/src/components/editor-v2/sim/simRoleStatus.ts`: `profileSummary` (checkability, missing items, proposals, set-but-off keys) and the Apply patch builder (unset-only, overlap check first, never `undefined`).
- Tests: `frontend/src/model/simulation/__tests__/profileBinder.test.ts` (new; the seven fixtures of report §6.5 plus b2net, the PEST SM reconstruction named as such), `frontend/src/components/editor-v2/sim/__tests__/metamodelSketch.test.ts` (new), `simRoleStatus.test.ts`.

Code commit 2, panel:

- `frontend/src/components/editor-v2/sim/SimulationPanel.tsx`: the Profile row (select of the four system presets, «Custom» shown as the current state, not an option), the summary line, Apply (one `lmm.state = {...}` write; a refusal of the overlap check writes nothing and says why), «Configure…» folding the groups, the warning line for an unreadable `simProfile` (D6).
- `frontend/src/components/editor-v2/sim/simulation-panel.scss`: the row, the summary, the folded state, the `max-height` with scroll on the body (D10); existing class names unchanged, new ones after a name check.

Eight files: Rule 19 applies, list them with their change before touching the first. Out of scope: the modal, user profiles, «Save as…», the compatibility check and `BindingVerdict`, the resolver that skips `off` keys in the bridge, `simProfiles.ts` and `profileCodec.ts` (read only), `roleCatalog.ts`, R-SIM-54's table, every engine file, every critical-zone file.

## COME

### Rulings for this lane

- **Binder (R-SIM-77).** A role is `bound` only with exactly one structural candidate; with two or more it is `candidates`, with none it is `none`; the summary shows the proposals before Apply and the candidates to choose; Trigger is bound only within the transition class lineage (report §3).
- **Apply (R-SIM-78).** One assignment, unset keys only, `simProfile` always, the overlap check of `writeRole` first; one undo step reverts everything; a live M1 run of the metamodel is interrupted by `runSignature` as today (say so in the summary title, not in a new line).
- **Summary (R-SIM-79).** `checkability(profile, bag)` from the pure modules; never «with warnings»; the missing items named; the information line for set-but-off keys.
- **Height.** The M2 face folds below the editor top at 1600×1000 with the groups folded; unfolded, the header stays visible at a viewport height of 900 thanks to the scroll; the M1 face is unchanged and Step's top does not move (R-SIM-65, R-SIM-66).

### Steps

1. Baseline on this commit: `npm run typecheck` (exit 2, the §17 set), `npx vitest run` (state the expected count from the trunk merge `24d8537fd`: 4931, plus what this branch carries; measure; 0 failed), `npm run build` (exit 0), `check:docs` 4/4, `check:scripts` as the baseline.
2. Tests first, red: the binder on the fixtures (turnstile × State machine fully bound; textbook FSM with `isInitial` → Initial `none`; a metamodel with two Initial subclasses → `candidates`; b2net × Petri net bound, Guard reported as set-but-off); the sketch collector on a fake lookup; `profileSummary` and the patch builder (unset-only, `simProfile`, overlap refusal, no `undefined`).
3. Implement commit 1. Minimal diffs, no refactor, no rename.
4. Mutation bench on commit 1, table in the commit body, a survivor is a stop: (1) a tie resolved by name order; (2) a set key overwritten by Apply; (3) `undefined` written for a `none` role; (4) Trigger bound outside the transition lineage; (5) the overlap check skipped; (6) a `candidates` role reported as checkable.
5. Gates on commit 1 as step 1 plus the new tests; `git diff --stat` outside DOVE empty. Commit, pathspec after `--`, subject `feat(sim): profile binder and summary for the panel presets (P-2026-09-27-0225)`, body with baseline, gates, mutant table, `Model:` trailer.
6. Implement commit 2, gates as step 5, subject `feat(sim): Profile row, Apply and Configure in the panel (P-2026-09-27-0225)`.
7. **Browser probe, then hard stop (RC-23).** Dev server from this tree on a free port (never 3001, 3002, 3003, 3004 or any port another tree holds; check with `lsof`). Run the visual checklist of report §4 «Visual checklist for M3», items 1 to 8, with DOM readings (bag keys before and after Apply, undo count, summary text, folded state, panel top and header visibility at 1600×1000 and at 900 high, Step top on the M1 face). Screenshots light and dark. Stop the server. `Outcome: hard-stop`: the chat runs its checklist and Alfonso's confirmation goes in the morning digest.
8. After the GO (a resume), one closure commit: the entry in `docs/log-inbox/simulation.md` (`Smoke visivo:` as recorded), Status of this file and of the Phase 1 file `claude_2026-09-27_0150_prompt_sim_profiles_panel_discovery.md` flipped (`eseguito 2026-09-27 · lane sim-profiles · <sha1>, <sha2>`, the Phase 1 one with `1dddb15ae`), tickets: the modal lane after MODELS (what it adds, report §4 «What the modal lane adds»), the `validateProfile` ticket owed to it, «Clear bindings» deferred, the four RC-26 points for Alfonso named by letter. `Outcome: done`. The merge toward `simulation-engine` and the trunk gets its own prompt (after the C2 merge: both lanes touch `SimulationPanel.tsx`, conflicts are resolved on this branch first, RC-14).

Stop with `Outcome: question` and a `Recommended:` line if: the sketch cannot be collected without an engine file; the Apply write cannot be one undo step; the folded panel cannot stay below the editor top; a needed name collides.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, a critical-zone edit, push, any tree or server you did not start, a background gate.

## RIFERIMENTI

- Report `docs/discovery/discovery_2026-09-27_sim_profiles_panel.md` (`1dddb15ae`): §2, §3, §4 M2/M3 and the checklist, §5, §6, §7, §8.
- R-SIM-47..56, R-SIM-67..72, R-SIM-77..79 in `docs/decisions.md`; `P-2026-09-25-1805` for the pure modules.
- `docs/PROTOCOL.md` P13, P16; RC-14, RC-17, RC-23, RC-25..30.
