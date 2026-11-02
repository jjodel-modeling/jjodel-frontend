# JjTL A1: containment placement through the trace, in the executor

Prompt-ID: P-2026-11-02-1956
Chat: C-2026-11-02-1541
Front: hw-notation
Status: da eseguire
Lane: full (JjTL executor semantics; first of two lanes of slice A, the write-back follows as a separate lane)
Depends: P-2026-11-02-1742
Worktree: ~/jjodel-w-jjtlcontain, branch jjtl-containment (from the trunk commit that adds this prompt)
Request: none (Alfonso's GO of 2026-11-02 19:54 for slice A; words in request.md of this lane)

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-jjtlcontain` on
`jjtl-containment`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-02-1956 · session <id>]`.
No subagents, no background tasks. One probe run per tool call. Commit as soon as the gates are green. Keep context low:
read SPEC section 5.3, R-JTG-1..7 in `docs/decisions.md`, and the discovery report's sections 3.4, 4 (Part A) and 5 (Q1, Q3, Q4). This repeats no discovery: a question the report settled stays settled.

## COSA

Specification: SPEC 5.3 and R-JTG-1..7. Implement in the executor only, with environment empty (B is out):

1. A binding on a containment feature (`composition`, indexed at `executor.ts:347, 622` and read nowhere else) whose value resolves through the trace places the live target inside the new container. A collection resolves element by element, in order. Lookup goes through a key shaped (source, rule, environment), R-JTG-6, with the environment always empty here: shape it now so B adds no second structure, and add no environment logic.
2. A target placed in a container leaves `roots`. That is recorded in the trace, not warned (R-JTG-4).
3. Ownership map, target to container, inside the executor: a second claim is an error naming both containers; a containment cycle is an error naming the elements on it (R-JTG-4). Self-containment included. Decided before anything is written, never left to the D-layer.
4. Non-containment references, nested creations (`-> toys { ... }`) and all other bindings behave as today. A rule that names both a nested creation and a resolved target in one containment collection keeps source order.
5. Trace per model: `SyncRTL.Add -> SyncRTL.Add` from one model to another is not endogenous. Confirm from the code and add a test on two classes sharing a name across source and target; if something treats it as endogenous, fix it inside DOVE.

First, ticket #445 (jjodel-lanes): check by reading `nestedMaterialization.ts:112` and with one executor-level test whether a nested creation loses `name` only because the class declares none. Report the finding only: no fix here.

## Tests

In `frontend/src/jjtl/executor/__tests__/`, on a toy pair of metamodels: a tree of depth 5 copied by one rule per class with containments resolved and only the root left in `roots`; collection order; both rule orders give the same tree by identity; second claim and cycle errors, each with both names; a contained element with a reference to a rule target outside the tree; a source element with no rule in a containment (the warning of A0, and what is placed).

`jjel-path-parity.test.ts` holds a check that a rule target is a root, kept on purpose by P-2026-11-02-1742 to fail here. Update it so a contained target's content is still compared, through its container. Say what you changed; no other existing test changes without `Outcome: question`.

## DOVE

`frontend/src/jjtl/executor/` (code and tests), `frontend/src/jjtl/__tests__/jjel-path-parity.test.ts`, `frontend/src/jjtl/SPEC.md` (mark what is now implemented; section 12.3 gap 5), `docs/log-inbox/hw-notation.md`, the `Status:` line. Read only: `frontend/src/components/project/` and everything else. No CLAUDE.md 3.2 file: if one proves necessary, stop with `Outcome: question`.

The app's write-back is the next lane, not this one: this branch is not merged until it lands, because a target leaving `roots` changes what the app receives. At the end, list for that lane exactly what the write-back must change, reading `ProjectEditor.tsx` (STEP 6, 8b, 6c) and `nestedMaterialization.ts`, including the pointer drop at lines 207-214.

## COME

Atomic commits, named paths only: tests with code; SPEC; closure. Gates: `frontend/src/jjtl/` tests, full suite, `tsc`, `check:docs`. Do not merge. Close with «Decisions taken (unattended)», «Decisions awaiting Alfonso» and the `Outcome:` line. Repo is public: name no partner company.
