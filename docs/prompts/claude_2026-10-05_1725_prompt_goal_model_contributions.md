# Prompt: the requirements' goal model, softgoals and contributions (first draft)

Prompt-ID: P-2026-10-05-1725
Chat: C-2026-10-05-1648
Lane: full (docs and data only, no code). Tier: heavy (RC-32: judgement over the whole register). Model: the default of `.claude/settings.json`, no deviation. No critical-zone go-ahead: none needed.
Status: da eseguire

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-goals`, branch `harness-goal-model` from the trunk `57ff86f5d`. No `node_modules` needed. Before anything else: `pwd`, branch, `git log -1` (the docs commit adding this prompt, on top of `57ff86f5d`) and a clean `git status`. Otherwise stop with `Outcome: blocked`.

## Lane discipline

Every reply of this session opens with `[P-2026-10-05-1725 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
Time limit: 90 minutes. Unattended (RC-25): decide inside the perimeter, record each decision in the report.

## Why

Alfonso, 2026-10-05: look at which requirements helped and which hurt, in the goal-modeling sense (i*, GRL contribution links). The register `docs/decisions.md` has evolution links (about 48 «amends», 11 «supersedes», 4 «refines») and a dozen rows naming a trade-off, but no softgoal level: «cognitive load» or «layout shift» never appear, though they are stated principles of the project. Alfonso said «vai» to the chat's seven softgoals, so they are the starting set.

## COSA

1. **Softgoals**: write `docs/goals/softgoals.json` and a short `docs/goals/README.md` (English) with these seven, each with a one-paragraph description grounded in the project's own texts (`CLAUDE.md`, the design-system principles, the decisions that already serve them, cited by id):
   SG-1 low cognitive load (progressive disclosure, Basic/Advanced); SG-2 no layout shift; SG-3 demo readiness (the MODELS demo and its four scenes); SG-4 reversibility (of changes and of decisions); SG-5 determinism of the simulation engine; SG-6 fidelity to the formalism (the semantics the user models: Petri nets, state machines, flows); SG-7 cost of the harness (human time and tokens).
   Add one row to `docs/decisions.md`, `R-GOAL-1`, recording the set, with the header fields the recent rows use (date 2026-10-05, «ratified by Alfonso 2026-10-05 («vai», on the chat's proposal of seven)», evidence: read, verified: none, reversible: trunk).
2. **Contributions**: for every R- row of `docs/decisions.md` (not RC), decide its contributions to the softgoals, writing `docs/goals/contributions.json` with the contract `[{req, softgoal, kind, evidence, verified, why}]`, `kind` one of `make|help|some+|some-|hurt|break`, `evidence` one of `measured|read|inferred`, `verified` `none` for every entry of this lane. Rules: a contribution is recorded only when the row's text, its ratification memo or its implementing discovery supports it; `read` when the text states the effect, `measured` only when a cited probe or bench measured it, otherwise `inferred`; `why` is one line quoting or citing the source. A row with no defensible contribution gets none: an empty row is better than an invented link. `make` and `break` only when the row makes or breaks the softgoal by itself.
3. **Conflicts**: `docs/goals/conflicts.json`, `[{a, b, softgoal, why, evidence}]`, for pairs of rows that pull the same softgoal in opposite directions, and for the rows naming a trade-off with another row. Evolution links (amends, supersedes, refines, renumbered) are not conflicts: leave them out.
4. **Agent verification (RC-27)**: after the draft, a second pass by a subagent with a fresh context on a random sample of 40 contributions (fixed seed, recorded): for each, «supported», «weaker kind», «unsupported». Set `verified: "agent"` on the supported ones, downgrade or drop the others, and report the agreement rate.
5. **Report** `docs/discovery/discovery_2026-10-05_goal_model.md`: method; counts per softgoal and kind; rows with no contribution by family; the ten most consequential conflicts; the sample's agreement; what Alfonso should look at first (softgoals hurt by realized rows, and the clusters of P-2026-10-05-1720 when available on its branch, read with `git show harness-req-tab:...` if it has committed; never wait for it).

## DOVE

Write: `docs/goals/**` (new), one new row `R-GOAL-1` in `docs/decisions.md` (append only, never edit another row), the report, `docs/log-inbox/goals.md` (new), this prompt's Status. Read: everything under `docs/`, git. Do not write under `frontend/` (the other lane's perimeter).

## Tests and gates

`check:docs`; the three JSON files parse and match the contract (a 20-line node check in the report's appendix, run and pasted); every `req` exists in `docs/decisions.md`; every `softgoal` exists in `softgoals.json`. Negative control: a contribution to `SG-9` makes the check fail.

## HARD STOP

After the docs commit (`docs(goals): softgoals, contributions and conflicts, first draft (P-2026-10-05-1725)`) and the gates: one closure commit (RC-17) with the Status flip and the log entry. Then `Outcome: done`. Do not merge.

## NON FARE

No edit to any existing row of `docs/decisions.md`, no `verified: "alfonso"`, no code, no `git stash`, no `git add .`, no push.

## RIFERIMENTI

`CLAUDE.md`; `docs/decisions.md`; `docs/ratifiche/`; RC-25, RC-27; P-2026-10-05-1720 (the tab that reads these files, parallel).
