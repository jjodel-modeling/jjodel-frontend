# Prompt: the M2 summary fixes S6, S7, S8 (and the S8 twin in the roles dialog)

Prompt-ID: P-2026-09-28-2000
Chat: C-2026-09-28-1936
Lane: fast (three small fixes in the sim panel and the profile binder, tests first; no discovery). Tier: light.
Status: eseguito 2026-09-28 · lane sim-summary-fixes, this worktree · 434ba5a52 (S6 83f5f9cca, S7 ff9aef558, S8 434ba5a52) · verifica visiva non eseguita da questa sessione (il prompt vieta dev server/probe qui: le quattro scene demo restano da verificare alla chat prima del merge)

Worktree: `~/jjodel-w-summary`, branch `sim-summary-fixes` (cut by the chat from `alfonso-frontend-jjtl` at `247a93549`, pushed to origin the same evening; `frontend/node_modules` symlinked as P14 allows), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-summary`, branch `sim-summary-fixes`, `git log -1` is the docs commit that added this prompt; if any of the three differs, stop with `Outcome: blocked` and say which.

## COSA

Three defects of the M2 summary, open since the backlog report of 2026-09-27 (§4.2) and confirmed still open by `docs/discovery/discovery_2026-09-28_sim_badge_pill.md` §5.2. Alfonso authorised them before the MODELS freeze on the condition that the four demo scenes do not change: every fix below acts only on a bag the scenes never have (they apply presets from empty bags). The chat probes the four scenes before the merge.

- **S6, «Kept: Node».** `bindProfile(profile, sketch)` (`src/model/simulation/profileBinder.ts`, about `:376`) sees no bag: it picks its own Node (`controlFlowCore` / `petriRoles`) and derives the dependent roles from it. When the bag already holds a different Node, the summary keeps it (`simRoleStatus.ts`, the `kept.push(...)` at about `:420`), but Transition, Next state, Initial, Source and the rest are still proposed from the binder's Node, so the proposals disagree with the kept value and nothing says so. Wanted: the dependent rules start from the kept Node (and from a kept Transition, where a rule derives from it).
- **S7, a stale `simEvent` changes the event class silently.** Since R-SIM-38 the event class is derived (the Trigger's type) and a stored `simEvent` is ignored (`SimulationPanel.tsx` about `:850`, `simBridge.ts`). Nothing tells the user. Wanted (`docs/claude-code-log.md`, entry cited by the backlog at `:251-255`): a warning on the M2 face when a stored `simEvent` differs from the derived class, naming both.
- **S8, the declarations hint when `simStateAttributes` is set but unreadable.** The hint «Declare the state attributes the actions write» tests `.rows.length === 0` without `readable` (`simRoleStatus.ts` about `:433`), while `stateAttributeRows` returns `{ rows: [], readable: false }` for an unreadable value (`stateAttributesCodec.ts` about `:158-161`). Twin in the dialog: `SimRolesModal.tsx` about `:408`, `declareHint = [...].some(...) && rows.length === 0` with `rows` from `storedRows.rows`. Wanted: the hint shows only for a readable empty value (or no value), in both places.

Line numbers drifted since the reports: find each site by reading, not by line.

## DOVE

- `frontend/src/model/simulation/profileBinder.ts` and `__tests__/profileBinder.test.ts` (S6).
- `frontend/src/components/editor-v2/sim/simRoleStatus.ts` (S6 call site at about `:230`, S7, S8) and its tests.
- `frontend/src/components/editor-v2/sim/SimRolesModal.tsx` (S6 if the dialog binds through its own call, S8 twin).
- `frontend/src/components/editor-v2/sim/SimulationPanel.tsx` only if the S7 warning must be rendered there; prefer a line in the summary model that the panel already renders.
- Closure: `docs/log-inbox/simulation.md` and this prompt's Status.

No other file. Not the simulation engine (`netCompile.ts`, `netStep.ts`, `netTypes.ts`, `simBridge.ts` read-only), not the critical zone.

## COME

1. Read `CLAUDE.md` (§6, Rule 11, §21.2), `docs/PROTOCOL.md` P16 and RC-20/RC-21, the discovery §5.2 above, and the files in DOVE end to end at the sites named.
2. Tests first (red before, green after), one group per defect:
   - S6: with a bag whose Node differs from the binder's choice, the dependent proposals are those derived from the kept Node; with an empty bag the output of `bindProfile` is identical to today's (deep-equal on the four demo presets: State machine, Petri net (P/T), Extended state machine, Flowchart / Activity; use the fixtures the existing tests use).
   - S7: stored `simEvent` equal to the derived class, absent, or no Trigger bound gives no warning; a differing stored value gives one warning naming both classes.
   - S8: unset, readable-empty, readable-non-empty, unreadable, in the panel summary and in the dialog; the hint shows only in the first two.
3. The changes:
   - S6: `bindProfile` gains an optional third parameter carrying the values already set in the bag (Rule 11: optional, additive; existing callers compile unchanged). Only the rules that derive from Node or Transition read it. Pass it at the summary call site and at the dialog's, if the dialog has its own. Grep every new name before introducing it.
   - S7: the warning text is exactly `Stored event class <stored> is ignored: the run uses <derived>, the Trigger's type.` with the class names as the panel already prints them. It is a warning, not a verdict change: the badge and the pill keep their value.
   - S8: add the `readable` condition in both places; if an unreadable value then shows nothing at all on the M2 face, stop with `Outcome: question` and a `Recommended:` line instead of inventing a message.
4. Gates: `npm run typecheck` (baseline 14, the known set: state before and after, no new entry); the vitest of `src/model/simulation` and `src/components/editor-v2/sim` green, counts before and after; `check:docs`.
5. Commits, one per defect: `fix(sim): ... (P-2026-09-28-2000)` with S6, S7, S8 named in the subject; then one docs commit with the log entry in `docs/log-inbox/simulation.md` and this prompt's Status.
6. Do not merge and do not start a dev server or a probe: the chat runs the four scene probes on the branch. Stop with `Outcome: hard-stop`, the shas, the diff stat, the test counts and, for each defect, one sentence on why the four demo scenes are unaffected.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes in any other tree, a critical-zone file, dark-theme work (dropped for now).

## RIFERIMENTI

- `docs/discovery/discovery_2026-09-28_sim_badge_pill.md` §5.2 (current state of S6-S8).
- Backlog report §4.2, on the trunk history: `git show simulation-engine:docs/discovery/discovery_2026-09-27_sim_backlog_lanes.md` (`:268-307`).
- `docs/decisions.md` R-SIM-38 (derived event class).
