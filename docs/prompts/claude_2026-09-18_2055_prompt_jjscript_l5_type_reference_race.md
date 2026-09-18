# JjScript L5: the `type-reference` role runs the same race the superclass ran

Prompt-ID: P-2026-09-18-2055
Chat: C-2026-09-18-2055
Status: da eseguire
Date: 2026-09-18 20:55 (Europe/Rome)
Type: fix (one lane, one commit for the fix, one for the list unification)
Branch: `validation-skeleton` in `/Users/alfonso/jjodel`
Protocollo: docs/PROTOCOL.md — clausole P1..P12 applicabili (tutte salvo deroga esplicita nel prompt).
Corsia veloce (RC-3): verifica preventiva inline, nessun report separato, effort high.
Lane: jjscript. Touch only `frontend/src/jjscript/executor/` and its tests.

## Contesto

Lane L4 (`9345a4046`) made the `superclass` role `required: true` because `waitForDependencies`
polls only the required ones and returns at once when there are none: a superclass created by the
PREVIOUS line of the same script was resolved before Redux had propagated it. The comment left at
`dependencies.ts:181-194` states the race belongs to the waiter, not to that one role.

`type-reference` is still `required: false` in four places (`dependencies.ts:205-235`: `options.type`
class and enum, `options.returnType` class and enum, plus `options.exceptions`), so
`create enum Color` followed by `create attribute tint in Pixel type Color` is the same race with a
different role. R-JS-1 in `docs/decisions.md` records it as open.

Two things already measured while writing this prompt, to be treated as given and not re-derived.
First, the forward case is already covered: `scriptValidator.ts` pushes `typeClauseName(options.type)`
and `typeClauseName(options.returnType)` for `TYPED_ELEMENT_TYPES` (`:127-130`, `:295-297`), so a type
created by a LATER line is refused before command 1. What is missing is only the waiter for the
PREVIOUS line. Second, `dependencies.test.ts:66` asserts today that the type-reference role is left
untouched; that test states the old contract and has to be inverted, not deleted.

## COSA / DOVE

Two commits.

**1. The waiter waits for a type created by an earlier line.** In
`frontend/src/jjscript/executor/dependencies.ts`, `options.type` and `options.returnType` push their
dependency with `required: true` when the element type is one whose type clause is resolved strictly,
which is the set `scriptValidator.ts` calls `TYPED_ELEMENT_TYPES` (`attribute`, `reference`,
`containment`, `composition`, `parameter`, `operation`). Outside that set, and for `options.exceptions`,
the role stays `required: false`: do not widen the fix beyond what a strict resolution justifies, and
say so in the comment.

Shape of `9345a4046`: the condition is computed once from `elementType`, the comment states the race
and cites the measurement, no call site changes.

**2. The two `EXTENDING_ELEMENT_TYPES` lists become one.** The same set is declared at
`dependencies.ts:168` and `scriptValidator.ts:138` with the same three members and the same role.
Export one from a module both already import, or from a small module beside them, and import it in
both. Same treatment for `TYPED_ELEMENT_TYPES` if commit 1 gave `dependencies.ts` a second copy of it:
one declaration, two importers. Nothing else moves, no other list is unified opportunistically.

## COME

The verification is a test on the waiter, not a check at screen: a run that works on screen proves
nothing about a race, and the previous lane found the defect only because a refusal made it visible.

In `frontend/src/jjscript/__tests__/dependencies.test.ts`, invert the assertion at `:66` and add,
in the shape of the superclass cases at `:32-90`: the type of `create attribute tint in Pixel type Color`
is required for a class kind and for an enum kind; the return type of an operation is required; an
element type outside the strict set is left alone; `options.exceptions` stays `required: false`.

Add one test on `elementWaiter` / `waitForDependencies` proving that a required type-reference is
actually polled, not resolved at once: the point of the change is the waiting, and a test on
`extractDependencies` alone would pass with a waiter that ignores the flag.

Declare in the log entry the cost this accepts, the same L4 accepted: a type that is genuinely absent
now takes up to 500 ms to be refused instead of failing at once.

## Gate

`npx tsc --noEmit` with no new errors in the touched files (baseline 33); `vitest` on the jjscript
test files; `npm run build` exit 0. Report the numbers, not the adjectives.

## Log

One entry per commit in `docs/log-inbox/jjscript.md`, never in the active log (RC-13, P9).
`Corregge: —`, `Causa: —` for both: this is a defect of the same class as L4 but not a correction of
the L4 prompt. Record in the entry that R-JS-1 in `docs/decisions.md` cited this role as the open one,
so the line can be closed when the batch is folded.
