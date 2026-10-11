# Goal model of the requirements

The decision register `docs/decisions.md` links its rows by evolution (amends, supersedes, refines,
renumbered). This folder adds the softgoal level of a goal model in the i* / GRL sense: which rows
help a stated principle of the project and which hurt it, the macro goals above the softgoals, and the
correlations between softgoals. Recorded as R-GOAL-1; first draft by
P-2026-10-05-1725, method and findings in `docs/discovery/discovery_2026-10-05_goal_model.md`.

## Files

| File | Contract |
|------|----------|
| `softgoals.json` | `[{id: "SG-n", name, description}]` |
| `contributions.json` | `[{req, softgoal, kind, evidence, verified, why}]` |
| `conflicts.json` | `[{a, b, softgoal, why, evidence}]` |
| `goal-tree.json` | `[{id: "MG-n", name, description, softgoals: ["SG-n"]}]` |
| `correlations.json` | `[{from, to, kind, witnesses: ["R-..."], evidence, verified, why}]` |
| `cluster-descriptions.json` | `{"<cluster key>": {description, members, written, by}}` |

The contract is shared with the Requirements tab of the lane board (P-2026-10-05-1720), which reads
these files and writes none of them.

## The softgoals

SG-1 low cognitive load, SG-2 no layout shift, SG-3 demo readiness, SG-4 reversibility, SG-5
determinism of the simulation engine, SG-6 fidelity to the formalism, SG-7 cost of the harness, SG-8
learnability, SG-9 expressive power of the languages and notations, SG-10 performance on large models,
SG-11 maintainability of the code base, SG-12 integrity of saved projects. SG-1 to SG-7 come from the
first draft; SG-8 to SG-12 from P-2026-10-11-1650, each kept because at least 5 R- rows contribute to
it (`docs/discovery/discovery_2026-10-11_goal_tree_hurts.md`). Each description in `softgoals.json`
cites the texts that state the principle and its scope, and the newer ones state their boundary
against the neighbour they are most easily confused with.

## The tree

`goal-tree.json` groups the softgoals under five macro goals approved by Alfonso (C-2026-10-10-0840):
MG-1 Usability (SG-1, SG-2, SG-8), MG-2 Expressiveness (SG-6, SG-9), MG-3 Scalability (SG-10, SG-11),
MG-4 Dependability (SG-4, SG-5, SG-12), MG-5 Delivery (SG-3, SG-7). Every softgoal sits in exactly one
macro goal. A macro goal carries no contribution of its own: it is read through its softgoals, so what
helps or hurts MG-1 is what helps or hurts SG-1, SG-2 or SG-8. Actors are out of scope.

## Correlations

A contribution says what a row does to a softgoal. A correlation, in the i* sense, says what serving
one softgoal does to another as a side effect: `from` is the softgoal the rows pursue, `to` the one
that pays (negative `kind`) or gains (positive `kind`), on the same scale as the contributions.

A link exists when at least 3 rows that help `from` hurt `to` (or help both, for a positive link), or
when one row or one declared conflict names the trade-off (`evidence: read`). `witnesses` lists those
rows, and every witness was read, not only counted: a witness counts only when the same decision of
the row carries both effects, not when the row does two independent things. Direction matters: a
trade-off that runs both ways gets two entries only if both directions have their own witnesses, and
the witnesses of a positive pair are split by the softgoal each row pursues. One ordered pair can hold
a positive and a negative link when each has its own witnesses (SG-1 to SG-8: one name for one thing
helps a newcomer, hiding a control from the screen costs one). The candidates are computed from
`contributions.json`, so a correlation ages with it: a new contribution can add a witness or a link.
`kind`, `evidence` and `verified` read as in Fields.

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

## Cluster descriptions

`cluster-descriptions.json` gives each requirement cluster of `frontend/scripts/req-trace.mjs` a
description of two to four sentences, written by reading its member rows (P-2026-10-11-1510). The
key is the cluster's key, its smallest member id; `members` is the cluster as it was when the
description was written, sorted as req-trace sorts them; `written` is that date and `by` the
Prompt-ID of the lane that wrote it. The unclustered rows have no description.

A description ages with its cluster: a new prompt that cites rows together can move a row into
another cluster. req-trace compares `members` with today's cluster and reports `descriptionDrift`,
the ids added and removed since the writing, which the Requirements tab shows as a muted line inside
the group; a key that no longer names a cluster is listed in `orphanDescriptions` and shown nowhere.
To refresh, a lane rereads the rows of each drifted cluster, rewrites its description, and sets
`members`, `written` and `by` again; an orphan's text is moved to the cluster that took its rows,
or dropped.
