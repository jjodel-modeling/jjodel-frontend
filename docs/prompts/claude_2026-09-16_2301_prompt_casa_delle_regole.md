# Where the rules live: one home for CLAUDE.md, and the transport queue

Date: 2026-09-16 23:01 (Europe/Rome)
Type: docs (CLAUDE.md + regenerated AGENTS.md + log)
Branch: `validation-skeleton` in `/Users/alfonso/jjodel`
Effort: high
Two-phase: NO.

## Il buco, misurato

Measured today, from the mounted clone with `GIT_OPTIONAL_LOCKS=0`:

- `master` has NO `CLAUDE.md` at all.
- `alfonso-frontend-jjtl` and `simulation-engine` have one, and it diverges from this branch's.
- None of the three normative commits of the last two days is on the trunk: `686a13712` (F, the
  worktree rule §6.5), `74d0f81db` (H, the two process rules of yesterday), `43e598404` (the
  mutation rule of today). `origin/alfonso-frontend-jjtl` is at `6e9a31fe7`, the 3.0 release commit.

So the normative file is de facto per branch, and whoever works on the trunk or on the simulator
today is following a different set of rules from ours, yesterday's and today's included. That is the
gap RC-10 correctly declared instead of inventing a rite for.

## La decisione

`CLAUDE.md` has ONE home, `alfonso-frontend-jjtl`. Write it as a fourth process rule, next to the
three already there, in the same register as its neighbours:

1. A rule may be authored on the branch where it is learned, but it is in force only where it is
   written. Until it is on the trunk it binds that branch alone.
2. The log entry of a commit that changes `CLAUDE.md` names that commit as owed to the trunk, and it
   stays named until the carry is recorded. The carry is done from the trunk worktree, by the lane
   that holds it or by Alfonso, never from a lane that does not have it.
3. Before citing a rule number in a prompt or in a commit for work on another branch, check that the
   rule exists there. A rule number that does not exist on the target branch is a false citation.
4. `master` has no `CLAUDE.md`, which is measured and not decided: record it as an open question for
   Alfonso, do not create one there and do not treat master as inside the development flow on your
   own authority.

## Il trasporto, in coda e non adesso

Record in the log entry the queue, in this order and with the reason: `686a13712` (F), then
`74d0f81db` (H), then `43e598404` (today), because today's rule cites yesterday's sub-rule and
yesterday's cites F's section. Carrying only the last one would put a citation on the trunk pointing
at something that is not there.

The carry does NOT happen in this slice and not today: PR #144 is open from the trunk toward
`staging` and the 3.0 tag is waiting for Alfonso's GO. Adding docs commits to the trunk while the
release is in flight is noise on a branch under verification. Write in the log that the queue is
released after the tag.

## DOVE

`CLAUDE.md`, `AGENTS.md` regenerated with `gen:agents` (§17, in perimeter by yesterday's rule 1c),
and the log entry in `docs/log-inbox/symbol-editor.md`. Docs and the log in separate commits, as you
did for the third rule. Nothing else, and no branch but this one.

## Criteri di accettazione

`npm run check:agents` and `npm run check:docs` pass, measured before the edit as well as after, as
you did last time. The four points above are in the file in the register of their neighbours, not as
a new top-level section unless the file's own convention makes that natural. The log entry carries
the queue with the three shas and the reason for the order, and the open question about `master`.
