# Phase 2 · WP1 completion — shape-live fixes + isID toggle RCA

**Context**: WP1 added 5 new checks to `ConformanceValidator` (implemented, 22/22 fixture tests, **uncommitted**). The visual gate failed (dot never lit). Field diagnosis (`docs/discovery/discovery_2026-07-15_wp1_runtime_sink_diagnosis.md` + a DevTools probe run by Alfonso) established three distinct problems: two shape-live bugs in the new checks (CHECK 9, CHECK 10) and one pre-existing editor bug (the isID toggle does not persist to D-layer), which was the root cause of the failed repro. This prompt completes WP1: RCA + fix the toggle, fix the two checks against raw shapes, add realistic-shape tests, then two separate commits after Alfonso's visual gate.

**Read first**: `CLAUDE.md` (follow it; if this prompt contradicts it, flag the conflict, do not silently proceed), `docs/claude-code-log.md` (recent entries), and both discovery reports:
- `docs/discovery/discovery_2026-07-13_validation_infrastructure.md`
- `docs/discovery/discovery_2026-07-15_wp1_runtime_sink_diagnosis.md`

**Working tree warning**: the tree carries unrelated uncommitted work (`sourceConformance.ts` + Dialog + JjtlDevelopmentEnv, from the transformations task) plus the WP1 changes themselves. NEVER `git add .`; each commit stages only the files listed for it.

**Line-number caveat**: all `file:line` anchors below come from the diagnosis reports and may have drifted; treat them as starting points and re-verify each before editing.

---

## Phase 0 — state check (read-only)

Verify the current state before doing anything:
1. The 5 WP1 checks are present in `src/model/conformance/ConformanceValidator.ts`, uncommitted.
2. Whether the fixes described below (raw-shape CHECK 9/10, isID toggle) are already applied — if they are, STOP and report (anti-duplication gate, same as the prior WP1 launch).
3. The prior session requested a spec-conformance review of the WP1 implementation (option A); its outcome was never reported in chat. If that review left pending notes or changes in the tree, list them at the first hard stop. Standing rule from that review: the `console.warn` calls in the validator are part of the design (fail-visible), not instrumentation — they stay.

## Part 1 — RCA: isID toggle does not persist (pre-existing bug)

**Evidence**: after activating the ID toggle from the Properties panel, no `DAttribute` in the store has `isID === true` (D-layer probe over all metamodels: `windoww.store.getState().idlookup`). CHECK 11 then correctly reports `conformant`, so the dot never lights. The CHECK 2 discriminant (a lowerBound edit from the same panel) also failed to produce a dot, so the suspicion is a generic Properties-panel write-path bug, not something isID-specific.

**Known anchors**: `DAttribute.isID` (`LModelElement.tsx:4169`), toggle UI (`Info.tsx:480`), `set_isID` (`LModelElement.tsx:4311-4319`). The flag is `isID`, not `iD` (the Ecore import mapping is a separate, later micro-task — do NOT touch `EcoreService` here).

**Discovery phase (read-only, MANDATORY report)**: trace the write path from the toggle click to the store and find where the write is lost. Establish the **breadth**: is the loss specific to `isID`, or does the panel's write path drop a whole class of property edits (the failed lowerBound discriminant suggests the latter)? Save the report to `docs/discovery/discovery_2026-07-15_isid_toggle_rca.md` with: objective, files read (full paths), findings with `file:line` evidence, breadth verdict, proposed minimal fix, risks, open questions for Alfonso. The discovery is not complete until the report is written.

**HARD STOP GATE after the RCA** — stop and report (do not implement) if ANY of:
- the fix touches the critical zone (`useJjomSync.ts`, `portDistribution.ts`) — requires go-ahead + Layer Impact Report;
- the fix touches more than 3 files;
- the breadth verdict is "generic panel write-path bug" rather than isID-local — the fix strategy then needs a design decision in chat, not a local patch.

Otherwise: implement the minimal fix in the editor write path. Do not rename identifiers; do not touch `ConformanceValidator` in this part.

**HARD STOP (visual gate, Alfonso)** after the Part 1 fix, before any commit:
- Console probe: after toggling ID on an attribute, `Object.values(windoww.store.getState().idlookup).filter(v => v?.className === 'DAttribute' && v.isID === true)` is non-empty and survives the edit flow.
- Repro X1: two instances with the same value in the ID attribute → red dot `duplicate_id_value` on the model tab (CHECK 11, no code change expected there).
- CHECK 2 discriminant: a lowerBound violation → dot.

On approval: **commit 1** `fix(editors): persist isID toggle from Properties panel`, staging ONLY the files touched in Part 1 (+ log entry via §6.1 sparse staging).

## Part 2 — CHECK 9/10 on raw shapes (and CHECK 11 re-verification)

- **CHECK 9 (attribute upper bound)** is currently a permanent no-op: `get_values` truncates to `upperBound` (`LModelElement.tsx:7168-7169`) before the check counts. Fix: count on `feat.__raw.values` (precedent for reading raw: `ConformanceGuard.ts:52-68`). Severities unchanged: `attr_upper`/error; `attr_lower`/warning and ONLY for `0 < count < lowerBound` (the `count === 0` case stays with CHECK 2).
- **CHECK 10 (enum literals)** produces false positives on every enum: values arrive as `LEnumLiteral` objects (`LModelElement.tsx:7220`) while the check compares against `Set<string>`. Fix: compare on `.name`.
- **CHECK 11 (duplicate id)**: logic already correct; it was starved by the Part 1 bug. Re-verify live after Part 1; no code change expected.
- **Fail-visible rule** (locked decision): a check that throws or cannot evaluate must never silently pass as conformant. Where testable in this pass, emit the synthetic `check_failed` violation; where not, document the gap explicitly in the log entry as a WP3 item.
- Severity table (locked, do not renegotiate): `abstract_instantiation`/error, `reference_target_type_mismatch`/error, `attr_upper`/error, `attr_lower`/warning, `invalid_enum_literal`/warning, `duplicate_id_value`/error.

## Part 3 — realistic-shape tests

The flat fixtures caught neither bug: they do not reproduce the L-proxy shapes. Add tests that do:
- `values` truncated at `upperBound` while `__raw.values` is longer (CHECK 9 regression);
- enum values as literal objects, not strings (CHECK 10 regression);
- `values` always an array even for scalar features (the validator's scalar branch is dead at runtime — assert the array path);
- the isID gate on CHECK 11 (no attribute flagged → check skips, correctly conformant).

Keep the existing 22 fixture tests green. If any existing test encodes the wrong shape (e.g. scalar values), fix the fixture, not the assertion semantics.

## Verification (before commit 2)

- `npm run build` / typecheck: baseline is ~33 pre-existing errors, must be unchanged.
- Full test suite green (22 existing + new realistic-shape tests).
- No changes outside: `ConformanceValidator.ts`, its test files, and the Part 1 editor files already committed.

**HARD STOP (diff review)**: show the full diff. On approval: **commit 2** `feat(conformance): complete WP1 checks on raw shapes + realistic tests`, staging ONLY `ConformanceValidator.ts` + test files (+ log entry via §6.1).

## Out of scope

- `EcoreService` `iD`→`isID` import mapping (separate micro-prompt, right after this).
- The transformations fix files (`sourceConformance.ts`, Dialog, JjtlDevelopmentEnv): leave uncommitted, do not stage, do not touch.
- WP2 (producer → `problems/registry.ts`), WP3 (invariants on `DClass`), WP4 (panel).
- Any change to `useConformance` debounce or `ConformanceIndicator` mounting (`TabDataMaker.tsx:29`): the sink hypothesis was disproved; the sink works.

## References

- Diagnosis: `docs/discovery/discovery_2026-07-15_wp1_runtime_sink_diagnosis.md`; infrastructure: `docs/discovery/discovery_2026-07-13_validation_infrastructure.md`.
- ID-first resolution precedent: `LPointerTargetable.fromPointer(id)` as used at `ConformanceValidator.ts:63`.
- Raw-values read precedent: `ConformanceGuard.ts:52-68`.
- DevTools probe (reusable): `windoww.store.getState().idlookup`, `windoww.LPointerTargetable.fromPointer(...)`; validator importable in dev via `await import('/src/model/conformance/ConformanceValidator.ts')`.
- Sink chain (verified working): `useConformance` (500ms debounce on `state.idlookup[modelId]`) → `ConformanceIndicator` (`TabDataMaker.tsx:29`; renders null when conformant — the dot only appears for warnings/errors/unknown).
