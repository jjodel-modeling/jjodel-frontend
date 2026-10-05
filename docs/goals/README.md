# Goal model of the requirements

The decision register `docs/decisions.md` links its rows by evolution (amends, supersedes, refines,
renumbered). This folder adds the softgoal level of a goal model in the i* / GRL sense: which rows
help a stated principle of the project and which hurt it. Recorded as R-GOAL-1; first draft by
P-2026-10-05-1725, method and findings in `docs/discovery/discovery_2026-10-05_goal_model.md`.

## Files

| File | Contract |
|------|----------|
| `softgoals.json` | `[{id: "SG-n", name, description}]` |
| `contributions.json` | `[{req, softgoal, kind, evidence, verified, why}]` |
| `conflicts.json` | `[{a, b, softgoal, why, evidence}]` |

The contract is shared with the Requirements tab of the lane board (P-2026-10-05-1720), which reads
these files and writes none of them.

## The softgoals

SG-1 low cognitive load, SG-2 no layout shift, SG-3 demo readiness, SG-4 reversibility, SG-5
determinism of the simulation engine, SG-6 fidelity to the formalism, SG-7 cost of the harness.
Each description in `softgoals.json` cites the texts that state the principle and its scope.

## Fields

- `req`: an R- row id of `docs/decisions.md`. RC rows are harness rules and are not judged here.
- `kind`, the GRL contribution scale: `make` and `break` when the row by itself satisfies or
  denies the softgoal; `help` and `hurt` for a clear partial effect; `some+` and `some-` when the
  direction is clear and the extent small, indirect or conditional.
- `evidence`: `measured` when a probe, bench or test cited by the row measured that effect; `read`
  when the row, its ratification memo or its discovery states it; `inferred` when it follows from
  what the row decides without being stated.
- `verified`: `none` (draft), `agent` (confirmed by a second agent with a fresh context, RC-27),
  `alfonso` (confirmed by Alfonso). Only Alfonso writes `alfonso`.
- `why`: one line that quotes or cites the source in the row.
- A conflict is a pair of rows pulling the same softgoal in opposite directions, or a row naming a
  trade-off with another: `a` pulls toward the softgoal, `b` away. Evolution links are not conflicts.

A row with no contribution has no entry: an empty row is better than an invented link.
