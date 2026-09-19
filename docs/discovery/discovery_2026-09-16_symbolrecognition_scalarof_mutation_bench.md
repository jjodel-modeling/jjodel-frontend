# Discovery — `symbolRecognition.ts`: which mutations the two conditional border-axis tests kill

**Tipo**: relocation of an existing measurement, not new discovery. The account below was
authored inline in root `CLAUDE.md` §5 ("Sub-rule: a test is judged by the mutations it kills,
not by the line it seems to be about") on 2026-09-16 and moved here verbatim on 2026-09-18
(P-2026-09-18-1930 Phase 2) so that §5 can hold a one-sentence pointer instead of the full
account. No rewording of the measurement itself.

**Ipotesi in gioco**: a test that survives a given mutation is a weak or redundant test and can be
deleted; conversely, a test's value is judged by whether it covers the specific line it appears to
be about.

**Obiettivo**: on `frontend/src/components/editor-v2/viewpoint/ir/symbolRecognition.ts` and its
test file `ir/__tests__/symbolRecognition.test.ts`, determine — for the two conditional
border-axis tests (`style`, `width`) — which mutations they actually kill, as opposed to which
mutation they were written to demonstrate.

---

## Misura

**Mutation 1 — drop the `scalarOf` sentinel from `style` and `width`, back to the raw compare.**

File stays green at **14/14**. `recognizeSymbol` compares a preset value against the shape's
axis value; a conditional object is unequal to a scalar preset value either way (object !== number
/ object !== string), so the sentinel changes nothing observable through `recognizeSymbol`'s
output. The two tests — and no other test in the file — cannot be about this mutation, because no
test in the file can distinguish it through the function's output.

**Mutation 2 — read the axis's `default` instead of resolving it conditionally** (both the shared
form of the mutation and the one scoped specifically to the two border axes). This is the mutation
that would let the modal title claim a preset an instance may not actually draw (a conditional
axis resolves per-instance; reading `default` collapses that to one value for every instance).

Both forms of this mutation come back **2 red**, and the two red tests are exactly the two
conditional border-axis tests — no other test in the file catches it.

## Conclusione

The two tests were written under the label "conditional border-axis coverage," which reads as
being about the `scalarOf` sentinel (the code path most visibly specific to border axes). Measured
against mutations, they provide zero coverage of the sentinel (mutation 1 is invisible to the
whole file) and are the *sole* coverage in the file for the `default`-collapse mutation
(mutation 2). The test's name/intent and the mutation it actually guards are not the same claim;
only the mutation bench settles which is true.

## Dipendenze e rischi

- `scalarOf` remains declared intent (a type/shape guard with no distinguishing output through
  `recognizeSymbol`) rather than a behavior a unit test can cover — consistent with root
  `CLAUDE.md` §5's broader point that such properties are not automatically dead-test evidence.
- Any future refactor of `recognizeSymbol` that changes how conditional vs. scalar axis values are
  compared should re-run this bench before deleting or "simplifying" either of the two tests.

## Domande aperte

None outstanding for this specific measurement.
