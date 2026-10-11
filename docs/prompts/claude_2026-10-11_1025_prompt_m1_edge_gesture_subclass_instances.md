# M1 canvas: edge gesture inert on instances of a subclass added after the model

Prompt-ID: P-2026-10-11-1025
Chat: C-2026-10-11-1022
Lane: full (canvas edge creation, possible critical zone: `useJjomSync.ts`, `portDistribution.ts`)
Status: da eseguire

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-subclassedge`, branch `fix-subclass-edge-gesture`, created from trunk `alfonso-frontend-jjtl`
at `cbbc1a204`. Before anything else: `pwd`, branch, `git log -1` and `git status` are as stated here. Otherwise stop.

## Lane discipline
Every reply of this session opens with `[P-2026-10-11-1025 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.

## Context (reported by Alfonso, 2026-10-11)
1. Metamodel with classes `State` and `Transition`, with references between them.
2. A model is created and populated.
3. Two subclasses `Initial` and `Terminal` of `State` are added to the metamodel afterwards.
4. Back on the model canvas (EditorV2), drawing an existing reference with the gesture from or to an
   instance of `Initial` or `Terminal` has no effect: no edge, no value, no visible error.
5. Setting the same reference from the Properties panel works.

Decisive detail (Alfonso, 11:50): with the metamodel canvas and the model canvas both open as tabs, adding
the subclass in the metamodel tab and going back to the model tab reproduces the bug; closing the model
tab and reopening it makes the gesture work. So inheritance is handled correctly at mount time: the model
canvas holds some state derived from the metamodel (reference candidates, ancestry, conformance or
handle data) that is computed on mount and not recomputed when the metamodel changes while the tab stays
mounted. The Properties panel works because it derives the same answer on each render.

## Phase 1: discovery (read-only), then HARD STOP
Main hypothesis to falsify (H3): a memo, ref, cache or effect in the model canvas gesture path
(connection validation, `isValidConnection`, reference candidate lookup, handle/port computation in
`portDistribution.ts`, `handlePosition.ts`, `useM1ReferenceEdges.ts`) depends on the metamodel only
through identities or a dependency list that does not change when a class or a superclass link is
added, so it keeps the pre-change ancestry. Find the exact derived value, its dependency list, and the
change in the store that should invalidate it.

Reproduce exactly Alfonso's sequence: both tabs open, add the subclass in the metamodel tab, return to
the model tab, try the gesture; then close and reopen the model tab and try again. Variants to cover:
an existing `State` instance retyped is not needed; a new instance of the subclass created after the
change, and the superclass link added to an already existing class (both must work after the fix).

Secondary checks, only if H3 does not hold: H1 exact class identity instead of ancestry in the gesture
(compare with `pinAccepts` and R-SIM-8); H4 the value is written but the pair guard
(`hasCanvasEdgePair`, `syncState.ts`) drops the edge.

Reproduce in the dev server on a free port (not 3000, 3001, 3003), reading the outcome from DOM and
console, never from screenshots. Instances of `State` itself are the control case.

Write the report to `docs/discovery/discovery_2026-10-11_m1_edge_gesture_subclass_instances.md` (P4:
hypothesis, files read with full paths, findings with `file:line` and verbatim quote, risks, open
questions, and a proposed fix with the files it touches). Commit it. HARD STOP with the report path.
If the fix touches a critical zone file, the report includes the Layer Impact Report and the stop is
`Outcome: question` with `Recommended:`.

## Phase 2 (only after GO)
Fix the cause found, minimal diff, files declared in the report only. Test first: a unit test that
fails today with a reference whose type is `State` and an endpoint that is an instance of a subclass,
where the subclass is added after the derived value was first computed (the mounted-tab case). Baseline gates (typecheck 14,
vitest, build). Log entry in `docs/log-inbox/<lane>.md` and the Status flip per RC-17.

## Acceptance (mechanical)
With the model tab kept mounted while `Initial` and `Terminal` are added in the metamodel tab, and
without reopening the model tab, dragging a `State`-typed reference from an
`Initial` instance to a `Terminal` instance, and the reverse, creates exactly one edge on the canvas and
the same reference value the Properties panel would set; instances of `State` behave as before.

## HARD STOP
- After the report (Phase 1).
- Any change to a critical zone file without the GO that names it.
- Any change to exported interfaces outside the files the report declares.

## NON FARE
- No refactoring of the gesture code beyond the fix.
- No migration or VersionFixer change.
- No `git add .`, no stash.

## RIFERIMENTI
`CLAUDE.md` §3 (critical zone, Layer Impact Report), §5 (visual bugs); `docs/decisions.md` R-SIM-8,
R-MCID; template-ir-authoring (M1 vs M2 edges, §3.4 guards).
