# JjScript: close two silent defects (duplicate names, lost inheritance) and the skipped-line display

Date: 2026-09-17 10:24 (Europe/Rome)
Type: fix
Branch: `validation-skeleton` in `/Users/alfonso/jjodel`
Effort: xhigh
Two-phase: YES. Phase 1 read-only discovery with report, HARD STOP for review in chat, then three
lanes (L1, L2, L3), one code commit each, in this order.

## Background

Recorded as open defects in `docs/discovery/discovery_2026-09-16_jjscript_forward_refs_structured_errors.md`
§6 and in the log entries of 2b357af17 and fad85bae5:

1. `create class|enum|package X` creates a second element named `X` without complaint:
   `createClass` (`create.ts:439`), `createPackage` (`:1023`), `createEnumerator` (`:1059`) call
   `D*.new` directly. From then on every script that names `X` stops on the A1 ambiguity message.
2. `create class A extends B` with no `B` creates `A` without the generalization and reports success
   (`create.ts:452-467`; same for the extra superclasses right below).
3. The run summary shows the skipped line in command-index space while the error line is in editor
   space (fad85bae5 residual): `skippedLinesSet` must stay in index space (`:832`, `:844`, `:951`,
   tested at `:1016`).

## Decisions already taken (do not reopen)

- **Name uniqueness is already ratified: R-M2U-1..6 in `docs/decisions.md` (2026-08-30).**
  Case-sensitive with a near-homonym warning (R-M2U-1); classifier pool is the whole metamodel,
  classes and enums share it, another metamodel is free (R-M2U-2); datatypes are a separate namespace
  (R-M2U-3); features include inherited ones (R-M2U-4). The verdict is
  `checkM2NameUniqueness` (`model/logicWrapper/nameUniqueness.ts:501`); the L-layer creators consult
  it through `m2CreateRefused` (`LModelElement.tsx`), the rename through `rename.ts:119-140`.
  R-M2U-4 records that `D*.new` is the loading door, deliberately ungated, and that the gate lives
  where user gestures arrive. A JjScript `create` is a user gesture that enters by the loading door:
  defect 1 is that bypass, not a missing policy. JjScript must consult the same verdict; it must not
  grow a rule of its own, and `D*.new` must stay ungated.
- **L2, a command either does what it says or nothing.** If any named superclass does not resolve,
  `create class A extends B` creates nothing and fails with a skippable error. Resolve every
  superclass BEFORE `DClass.new`. Rationale: Skip Line must leave a clean state, not a class missing
  its generalization.
- **L3 is display only.** No change to `skippedLinesSet`, `runCommandsFromIndex` or the
  `EXECUTION_PAUSED` event.
- Out of scope: widening the lane A forward-reference validator now that duplicates would fail. Note
  in the report whether L1 makes the second branch of the old soundness rule true, and for which
  kinds; do not act on it.

## Phase 1: discovery (read-only)

Read `CLAUDE.md`, the recent `docs/claude-code-log.md`, R-M2U-1..6 in `docs/decisions.md`,
`nameUniqueness.ts` (`checkM2NameUniqueness`, `m2KindOf`, `pendingChildrenOf`), `m2CreateRefused` and
its callers in `LModelElement.tsx`, `joiner/classes.ts:2200-2250`, `rename.ts:100-190`, every creator in
`create.ts`, `ScriptBlock.tsx` around `:820-1020` and the summary render.

Answer in the report:

- D1. Every `create` path in `create.ts` that writes an M2 named element with `D*.new` (class,
  abstract class, interface, enum, package, attribute, reference, containment, operation, parameter,
  literal), and for each the `M2NamespaceKind` and the prospective `father` the verdict needs. Which of
  them the L layer already gates and which JjScript bypasses.
- D2. Consecutive creates in one script (`create class X` twice in a row, or a feature right after its
  class): is the first element visible to the verdict when the second runs? What `pendingChildrenOf`
  covers, what `elementWaiter` guarantees, and whether a probe is needed. Measure, do not argue.
- D3. Whether routing JjScript through the L primitives (`addClass` etc.) is feasible, or whether the
  verdict must be consulted in `create.ts` before `D*.new`. Recommend one, with the side effects each
  brings (toasts, `ClassNameChanged` events, transactions, CLAUDE.md §3.3). Toasts must not appear in
  a script run: the error goes in the `ExecutionResult`.
- D4. The error code for L1 and L2 among `KNOWN_ERROR_CODES` (`errors.ts:417`): `DUPLICATE_NAME` for
  L1 if it fits; for L2 the closest existing code. Where the near-homonym warning goes
  (`ExecutionResult.warnings`) and whether the chat renders it.
- D5. The standalone `A extends B` command with a missing `B`: confirm it already fails hard, and
  whether its message and code should match L2.
- D6. For L3, the exact render site(s) of the skipped line in the summary and the inverse mapping
  available (the command index to editor line that `getScriptLine` performs).
- D7. Jjodie scripts re-run on a metamodel that already holds their classes: after L1 they stop on
  line 1 with a skippable error. Confirm, and list any existing test or flow that relies on duplicate
  creation succeeding (`grep -rn` in tests and in the Jjodie RAG documents).

Save the report as `docs/discovery/discovery_2026-09-17_jjscript_duplicates_extends_skipped.md`
(objective, files read with full paths, D1-D7, risks, open questions). Phase 1 is not complete until
the file exists. HARD STOP.

## Phase 2 (after GO)

L1. JjScript M2 creates consult `checkM2NameUniqueness` with the kind and prospective father from
D1, before writing; on refusal return a skippable error whose message names the existing element and
the metamodel; on a near-homonym, succeed and put the verdict's warning in `warnings`. Scope of kinds
as fixed at the GO. No change to `nameUniqueness.ts` or to `D*.new`.

L2. As decided above. Keep the scoped-then-project resolution order and the bound-scope guard; only
the moment of resolution and the failure behaviour change.

L3. The summary shows skipped lines in editor numbering via the mapping of D6, at render time only.

DOVE: `create.ts`, `ScriptBlock.tsx` (summary render only, for L3), their tests, and anything else only
if the GO allows it after D3. Minimal diffs, no renames, no opportunistic refactoring, no em dashes.

TESTS AND GATES, per lane: a pure-function test where the handler cannot be imported under node
(as in lane A/B of 2026-09-16); L1 covers same metamodel refused, other metamodel accepted,
different package same metamodel refused (R-M2U-2), near-homonym accepted with warning, and the
two-in-a-row case of D2; L2 covers missing single superclass (nothing created), one of several
missing (nothing created), all present (unchanged); L3 a script with comments and blank lines before a
skipped command. Mutation bench on each lane, with the apply control. `npm run typecheck` at baseline,
`npx vitest run`, `npm run build`, `check:docs`. HARD STOP before each commit for Alfonso's visual
check on http://localhost:3001/, stated as what to check, not as its result. Commit with explicit
paths, code and docs in separate commits, one log entry per lane. Do not touch
`docs/mde-intelligence-2026/` or files of other lanes.

## RIFERIMENTI

- R-M2U-1..6, `docs/decisions.md:2716` onward
- 6ae3e15eb (report §6), 2b357af17, 4a3f3c87d, fad85bae5, e36eec58b
- `docs/prompts/claude_2026-09-16_2327_prompt_jjscript_forward_refs_and_structured_errors.md`
