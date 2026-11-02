# Discovery: JjTL abstraction for one generic transformation (Phase 1)

- Prompt-ID: P-2026-11-02-1425 (discovery); report written under P-2026-11-02-1612 (continuation after the context-ceiling hook)
- Prompt file: `docs/prompts/claude_2026-11-02_1425_prompt_jjtl_generic_transformation_discovery.md`
- Session: C-2026-11-02-1541
- Tree: `~/jjodel-w-jjtlgeneric`, branch `jjtl-generic-transformation`; reading done at `445cdc94f`, report written at `e95485d0f` (docs-only difference)
- Executor model (session banner): Sonnet 5.5. The reading session (P-2026-11-02-1425) ran on Opus 5.5 and left a handoff.
- Nature of this document: a set of hypotheses with evidence, not a definitive reference. Whoever uses it downstream rereads the real files.

**Provenance of the claims.** No claim here was measured by a run: no probe was written (the prompt forbids a test file in Phase 1). Every claim is *read*: from source at `445cdc94f`, from docs, or from the prototype files outside the repo. The reading session (P-2026-11-02-1425) reached its context ceiling before writing; its handoff is the source of the line references. In this session I re-opened and confirmed the ones the argument leans on most (marked "reconfirmed" below); the others are reported as the handoff holds them. The prototype is outside the repo and unnamed on purpose; only the file names and sizes needed for the argument are quoted.

## 1. Objective and hypotheses under test

Objective: decide how JjTL can express one domain-free transformation that copies model fragments (library, template, pattern, Brief) into a low-level target, replacing references; give a design for parts A to E, an order, and a Layer Impact Report.

Hypotheses (from the source prompt) and verdicts:

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | SPEC §5.3 implicit trace resolution is not implemented (gap 1) | **Falsified in part.** The SPEC banner is stale: it is implemented for non-containment references. |
| H2 | Reference mapping for containments is absent (gap 5) | **Holds.** `composition` is indexed and read nowhere else; every rule target is a root. |
| H3 | Rules take one source and one target model (gap 7) | **Holds.** |
| H4 | There are no called rules (gap 8) | **Holds.** |
| H5 | There are no lazy rules (gap 9) | **Holds.** |
| H6 | Source matching is exact on class name, no inheritance (gap 10, §3.2) | **Holds**, and worse: the source metamodel never reaches the executor. |
| H7 | A can ship before B without a semantic B must break | **Holds only with a constrained spec** (Q1). |
| H8 | The target (hundreds of lines, same SyncRTL models) is credible | **Holds for the transformation, with a caveat** on where the content moves (Q7). |

## 2. Files read

All under `/Users/alfonso/jjodel-w-jjtlgeneric` unless absolute.

- `frontend/src/jjtl/SPEC.md` (sections 3.2, 3.4, 4.2, 5.3, 9.2, forall multi-variable 252-279, 12.3)
- `frontend/src/jjtl/parser/parser.ts`, `frontend/src/jjtl/lexer/tokens.ts`
- `frontend/src/jjtl/executor/executor.ts`
- `frontend/src/jjtl/executor/__tests__/source-collections-in-expressions.test.ts`
- `frontend/src/jjel/evaluator/context.ts`
- `frontend/src/components/project/ProjectEditor.tsx` (STEP 6, 8b, 6c)
- `frontend/src/components/project/nestedMaterialization.ts`
- `frontend/src/model/ontological/bindingCodec.ts`, `bindingCheck.ts`
- `frontend/src/model/logical/LModelElement.tsx` (dependencies, `_getallSub`, `setValueAtPosition`; path as the handoff cites it by file name)
- `docs/jjtl/JJTL-DEVELOPMENT-PLAN.md` (lines 262-350 read in this session; 132-200 not read)
- `docs/discovery/discovery_2026-10-20_ontological_instantiation.md`, `docs/decisions.md` (R-OI rows, 6568-6648)
- Prototype, outside the repo, read only: the kernel design note and worked example in its `docs/`, `transformation/CoreSpec2SyncRTL.jjtl`, `tools/build_core_jjtl.py`, a probe test serialising the in-memory tree.

## 3. Findings

### 3.1 SPEC staleness and the executor today (read)

- `frontend/src/jjtl/SPEC.md:504-506`: "### 5.3 Implicit Trace Resolution / > **STATUS: NOT IMPLEMENTED**". Stale.
- The executor is two-pass. `executor.ts:503-526` (reconfirmed): "Pass 1 — match each mapping against source instances, evaluate guard (`where`), create empty target instances, register them in the trace. No bindings evaluated here. Pass 2 — evaluate bindings with the full trace available, so cross-type resolution (source element → target element) works regardless of rule order." Implemented by `pass1CreateTargets` (1180-1270), `registerTargetsBySourceName` (1363-1380, keys by name and id), `pass2BindAttributes` (1387-1412).
- Every binding goes through `applyCrossTypeResolution` (call sites 1668, 1871, 2207, 2354, 2435) into `resolveValue` (2871-2951) and `resolveRefById` (2961-3003), with `wrapIfTargetReference` (2809-2855) producing `{ __ref_result, targets }`. Test: `executor/__tests__/source-collections-in-expressions.test.ts:125-148`.

### 3.2 Gap verdicts

| Gap | Verdict | Evidence |
|---|---|---|
| 1 implicit resolution (references) | **Implemented, differing from §5.3** | Ambiguity throws instead of declaration order; a reference to a class without a rule fails open: `executor.ts:2974-2975` (reconfirmed) "// Implicit path — fail open: reference points to a type without a rule. / return null;"; a className object with no rule passes through as the **source** object, silently: `executor.ts:2908-2911` (reconfirmed) "const rules = this.context.rulesBySourceType.get(className); if (!rules \|\| rules.length === 0) return value;". |
| 5 containment mapping | **Absent** | `composition` is indexed (`executor.ts:347`, `622`) and read nowhere else (grep, 2 hits: executor and ProjectEditor). Every rule target is pushed to roots: `executor.ts:1465` (reconfirmed) "targetModel.roots.push(targetInstance);". |
| 5 (multiplicity) | **Silent first-entry pick** | `resolveRefById`, several entries from one rule: `executor.ts:2994` (reconfirmed) "if (distinctRules.size === 1) return entries[0].target;". |
| 7 multi-model | **Confirmed absent** | Parser takes one identifier for each side: `parser.ts:81-86` (reconfirmed) "this.consume(TokenType.IDENTIFIER, "Expected source metamodel name")" and the same for the target. Class names are single identifiers (`parser.ts:123`, `134`) although SPEC §3.2's grammar shows `qualifiedType` (stale grammar). `ProjectEditor.tsx:1437`, `1463-1464` read one model's `allSubObjects`. |
| 8 called rules | **Confirmed absent** | `tokens.ts:16`, `111` have `HELPER` only; no `rule`/`lazy`/`unique`. Helpers are JjEL expressions (SPEC §3.4). |
| 9 lazy rules | **Confirmed absent** | same search. Roadmap `docs/jjtl/JJTL-DEVELOPMENT-PLAN.md:268-322` already sketches `rule name(args) -> T`, `lazy`, `unique lazy`. |
| 10 / §3.2 inheritance matching | **Confirmed absent** | Matching exact on className (`executor.ts:1112`, `1207`); `rulesBySourceType` exact (999-1006). The source metamodel is not passed: `execute(sourceModel, targetMetamodel)`, so source supertypes are unknown; target supertypes are known (`classIsOrExtends`, 645-662). Roadmap `JJTL-DEVELOPMENT-PLAN.md:325-347` sketches `abstract` and `extends`. |

### 3.3 The snapshot defect (read; not run)

Resolved targets are deep-copied when bound: `frontend/src/jjel/evaluator/context.ts:575-591` (reconfirmed) `fromJjelValue` rebuilds every object (`const result: Record<string, unknown> = {}; for (const [k, v] of Object.entries(value)) {...}`), called at `executor.ts:1671`. A parent therefore holds a *copy* of the child taken at bind time, and pass-2 rule order decides what the copy holds. The existing test says so (`source-collections-in-expressions.test.ts:136`, reconfirmed): "// Targets are copied when bound, before pass 2 of the other rule names them."

The prototype consumes the in-memory tree (its probe serialises the first instance of the root class), so A needs **identity, not copies**. Not run here; the first Phase-2 test should confirm the copy behaviour before the fix is built on it (CLAUDE.md §5: do not trust a description across sessions).

### 3.4 Write-back in the app (read)

- Source serialisation: references **and** containments as `{ __ref: id }` (`ProjectEditor.tsx:1550-1572`), `_containerId` (1576-1587).
- STEP 8b writes `__ref_result` with `feature.setValueAtPosition(ri, targetRealId, { isPtr: true })`, return value unchecked: `ProjectEditor.tsx:2255` (reconfirmed). Target lookup is via `sourceIdToObjectName`, set at `ProjectEditor.tsx:1809` (reconfirmed) and keyed by `__sourceId`: **one target per source id**; it collides as soon as B yields several targets per source.
- D-layer `setValueAtPosition` on a containment feature reparents: sets `father` (`LModelElement.tsx:7961-7978`), detaches silently from an old container (7967-7975); a cycle returns `{success:false}` (7962-7963). Roots are objects whose father is a DModel (5769-5773). Consequence: a containment write makes a root stop being a root; a second claim silently **moves** it; a cycle is silently refused because the return is unchecked.
- `frontend/src/components/project/nestedMaterialization.ts:207-214` (reconfirmed; the handoff cited the bare file name, it lives under `components/project/`): "Nested: ${path} (${className}): '${key}' is neither an attribute nor a nested creation of '${className}'. Value dropped." A `__ref_result` inside a `__nested` child is dropped with a warning today: a nested object cannot hold a pointer to a rule-level target.

### 3.5 What the two recent lanes change

- Nested materialization (P-2026-10-30-1330; `nestedMaterialization.ts`, SPEC §9.2 items 7-10): any depth, by id, 50 ms polls, 3 s cap per level. It is the right **sink** for A-containment and B results (the child is written inside its container as `__nested`). It does not solve identity (it takes a built tree) and it drops pointers (above).
- Multi-variable forall (P-2026-11-02-1331; SPEC 252-279): pairs and products. Not central: iteration over model elements already works, and the prototype's kernel note says the same. It lowers the cost of the template `for each` only marginally.
- `extraBindings` already threads let/forall variables into nested bodies (`executor.ts:2166-2242`, P-2026-10-31-1710): a seed for an environment, but explicit and per body.

## 4. Design proposal

Decisions below are the ones the reading session took; none was changed by the checks of this session.

### Part A: implicit trace resolution for references and containments

**Exists:** reference resolution through the trace (3.1, 3.2). **Missing:** containment placement; identity instead of copies; reported multiplicity and no-rule cases; a per-model trace.

**Needed:**
1. Resolved targets are bound **by identity** (the live target instance, not `fromJjelValue` of a copy). This is the fix of the snapshot defect and is "A0" in the order below, because it changes behaviour that exists.
2. For a containment feature (using the already indexed `composition`), place the resolved target inside the new container and take it out of `roots`. For a collection, element by element, in order.
3. Replace silent fallbacks with reported ones: multiplicity [N] with several entries from one rule (`executor.ts:2994`), a className object with no rule (2910-2911), a `{__ref}` with no rule (2974-2975) each produce a warning or error naming the source element and rule.
4. Ambiguity (two rules on one source): keep the throw, name both rules; or adopt §5.3's declaration order behind an explicit flag. The spec must choose one (open question 2).
5. Trace is per (source model, target model): `SyncRTL.Add -> SyncRTL.Add` from one model to another is not endogenous. Today the trace is keyed by source id and name, which is per run and already model-scoped; the work is to make that explicit in the key and in the SPEC.
6. Containment lowering goes out as `__nested` so the existing nested path writes it (decision 4 below).

### Part B: called rules with an environment, and lazy rules

**Exists:** nothing (3.2). **Needed:**
- Syntax aligned with the roadmap (`JJTL-DEVELOPMENT-PLAN.md:268-322`): `rule LowerExpr(e, env) -> Expr { ... }`, callable from a binding or a `forall` body, returning the created element; `lazy` and `unique lazy` as the roadmap sketches. Arguments visible in body and guard.
- Executor: a callable-rule registry; parameter scope; creation on demand during pass 2 (called rules do not take part in pass-1 matching); memo for `unique lazy`.
- Implicit resolution (A) inherits the caller's environment (Q1, Q2).
- Write-back must stop assuming one target per source id (`ProjectEditor.tsx:1809`, 3.4) before B ships: this is a prerequisite slice inside B, not a separate part.

### Part C: multi-model sources

**Exists:** model dependencies in the platform (`LModel.get_dependencies` / `get_allDependencies`, `LModelElement.tsx:5234-5239`; `_getallSub(..., includeCross)` includes dependency models, 5862-5886; `crossObjects`, 5727). **Missing:** parser (one identifier each side), qualified types, ProjectEditor reading one model, trace keys that span models.

**Proposal:** C0 first, no new syntax: the source array becomes the source model **plus** its declared dependencies; the trace is keyed by id (ids are global). `from A, B to T` with qualified types is C1, later and only if C0 is not enough. Unverified: whether an M1 model can declare another M1 as dependency in the UI (open question 4).

### Part D: inheritance matching and rule inheritance

**Exists:** exact matching only; target-side `classIsOrExtends`. **Needed:** pass the source metamodel (or its supertype table) to the executor; build `rulesBySourceType` by walking supertypes; most-specific wins, a tie is reported; then `abstract` and `extends` for rules (merge of bindings, child overrides, guard AND), per the roadmap `JJTL-DEVELOPMENT-PLAN.md:325-347`. It is the part with the most syntax and the least urgency for the case: with one rule per class (A), the `Add -> Add` family needs no inheritance; D saves lines, it does not unlock anything.

### Part E: slots holding contained fragments

Question only. See Q6.

## 5. Answers to the questions

**Q1. Trace identity under an environment.**
Key: **(source element id, rule, environment)**. When several targets exist for a source, implicit resolution picks the one whose rule matches the binding's target type under the **caller's** environment; an implicit `-> left : left` inherits the caller's environment. Part A can ship before B if its spec is written with that in mind: A ships with env = empty; the spec says "implicit resolution inherits the caller's environment" (vacuous until B) and "one target per (source, rule, env)", **never** "one target per source". Then B adds environments without breaking A. If A were specified as one target per source, B (one `op.result` lowered in several template positions) would have to break it. This is what fixes the order.

**Q2. Environment reaching the leaves.**
Recommendation: a **dynamically scoped context of the rule application**, not an explicit parameter threaded by hand through every binding, but **reified** as a named parameter of called rules. Values are closures (expression plus the environment of the binding site) so a substitution is lowered in the environment where it was written, which avoids capture. Effects: the memo key of `unique lazy` is (rule, arguments, env hash); error messages carry the application stack (rule, source element, environment frames); the trace key gains env (Q1). Explicit threading would force every implicit A binding to name the environment, defeating the point of A.

**Q3. Containment moves.**
Reported, never silent. An executor-level ownership map target -> container: a **second claim is an error naming both containers**; a root claimed once leaves `roots` (recorded, not warned: this is the normal case); a **containment cycle is an error** (the D-layer currently refuses silently, `LModelElement.tsx:7962-7963`, and the caller ignores the return, `ProjectEditor.tsx:2255`). Under B, containment lowering is an implicit lazy call of the child's rule under the current environment, creating a **fresh subtree** (never a trace lookup), so the same source element placed in two template positions yields two subtrees, not a double claim.

**Q4. Rule scheduling.**
Today: two passes in mapping order (`executor.ts:503-526`); pass 1 creates and traces, pass 2 binds; order of rules does not matter for existence, only for the snapshot copies (3.3). A needs **no third pass** once binding is by identity, because the write-back reads the finished in-memory tree. B needs **lazy creation** inside pass 2 (called and lazy rules create on demand); matched rules keep pass 1. A second pass over containments is not needed.

**Q5. Fallback for C (one model holding copies).**
Not the cheaper first step. Copies duplicate every library and template element per Brief (identity to the originals is lost, ids need remapping), and something must build the copy, which is itself a transformation outside JjTL. The cheapest first step is **C0**: the source array is the model plus its declared dependencies, with the trace keyed by id. Cost: verifying that the UI lets an M1 model depend on another M1 (open question 4); if it does not, the copy fallback becomes the only option and its duplication cost applies.

**Q6. E: slots holding contained fragments.**
Yes, compatible; the design already allows it. Only S1 is on this tip (checked with `merge-base --is-ancestor`: oi-s2, oi-s2u, oi-s3a, oi-s3b are not ancestors of HEAD). S1: `model/ontological/bindingCodec.ts:39-57`, `bindingCheck.ts:38-91`; `bindingCheck.ts:66` accepts `'reference' | 'attribute'` as a value holder, and the UML client's `Slot.values` is a containment of `ValueSpecification` (`discovery_2026-10-20_ontological_instantiation.md` §3.1, lines 163-177, line 87). A contained fragment needs: (1) a `valueKinds` entry that creates no literal (the user or a transformation builds the tree); (2) S3a's O5 value-kind check to accept a value whose metaclass conforms, by M2 generalization, to the class the feature type stands for; (3) S3b ghost rows cannot type a tree: either a parser of a textual expression syntax, or the row shows the tree read-only; (4) a feature type pointing at a **linguistic** metaclass (the SyncRTL `Expr`) from an M1 property: an M1 classifier standing for it, or a `featureType` that may target an M2 class, compatible with R-OI-1 (does not preclude deeper levels; `docs/decisions.md:6568-6648`); (5) a reader helper so JjTL can navigate to a slot value (`op.slots.filter(...).values.first()`). No change proposed to those lanes; S2, S3a, S3b are unmerged here, so (2) and (3) are read from their designs, not from code.

**Q7. Size estimate.**
Read (prototype, outside the repo): the RISC-V transformation is 19,454 lines of JjTL = three rules `Core -> Module where microarch == ...` at lines 17, 6250, 12852 (~6,230 lines each). The multicycle rule has 2,523 object creations and 304 `such that i.mnemonic == ...` foralls (per-mnemonic unrolling). Whole file: 2,932 `Ref`, 667 `Const`, 574 `Eq`, 568 `Conj`, 928 `forall i in instructions`, 1,694 `forall one in [1]`. One signed-less-than use is ~45 lines (file lines 191-236). The generating script is 554 lines: ~105 constructors/printer (1-166), ~200 domain semantics and decoder (170-364), ~150 structure of the three realizations (366-518). Shared fragments are inlined 3x, semantics once per mnemonic per use site.

Estimate for the generic transformation: one rule per SyncRTL class (~35 classes x ~4 lines) + kernel constructs (for-each, parameter/operand/observable reference, name building, ~6-8 rules) + Brief/decoder/patterns (~50) = **250-400 lines: credible**. Caveats to state: (a) the content moves into template/library/pattern **models** (one realization is ~2,500 nodes today, far fewer once `for each op` replaces the 304 unrolled foralls); authoring them node by node in the editor is not credible, so a textual notation for those models (the prototype has one) is a precondition **outside JjTL**; (b) B alone (called rules with target-fragment arguments, a fresh copy per call) already lets a hand-written JjTL mirror the builder at roughly its size, before any kernel model exists. Not measured by a run; a read-based estimate.

## 6. Recommended order and reason

**A0 -> A -> B -> C0 -> D -> C1 (if needed). E is an answer only.**

1. **A0** fixes what exists: bind by identity, report the silent fallbacks (3.1-3.3). It changes behaviour that is committed (CLAUDE.md rule 3), so it comes first and alone, with the snapshot behaviour confirmed by a test before it is changed.
2. **A** adds containment on top of A0. It is the base of everything: without it the unknown-shape expression tree cannot be lowered at all.
3. **B** needs A's trace and identity, and the write-back change (one target per source id). It is the decisive slice for size (Q7b).
4. **C0** is cheap once the trace is keyed by id; **D** saves lines but unlocks nothing; **C1** only if C0 falls short.
5. The reason A precedes B and the reason it is safe is Q1: A's spec is written for (source, rule, env), vacuous until B.

Each slice is its own lane and prompt; Phase 2 starts only on Alfonso's GO.

## 7. Layer Impact Report

```
LAYER IMPACT REPORT

Layers touched:
  [ ] D-layer (Redux raw data)
  [x] L-layer (computed proxies)    -- via setValueAtPosition on write-back (STEP 8b)
  [x] JjOM (model entities)         -- reparenting / roots on containment write
  [ ] Canvas v2-flow
  [ ] Canvas classic
  [ ] Sync layer (useJjomSync hooks) -- no sync-layer file is touched
  [ ] Persistence (VersionFixer / jsxString)

JjTL executor (frontend/src/jjtl/executor/):
  - What changes: A0/A/B/C/D in the executor, parser and lexer (this is the language layer, outside the CLAUDE.md §3.1 critical-zone list).
  - What does NOT change: the JjEL evaluator, except that A0 stops calling fromJjelValue on resolved targets at executor.ts:1671 (a use of it, not a change to it).
  - Cross-layer interaction: the executor output feeds ProjectEditor.

Write-back (frontend/src/components/project/ProjectEditor.tsx, STEP 6 / 8b / 6c, and nestedMaterialization.ts):
  - What changes: A-containment and B slices change how `__ref_result` and `__nested` are written: the one-target-per-source-id map (line 1809), the unchecked setValueAtPosition return (2255), the pointer drop inside `__nested` (nestedMaterialization.ts:207-214).
  - What does NOT change: DVertex.new / DVoidEdge.new2 / DVoidEdge.new3 are not involved; no TRANSACTION around creators is proposed (NON-NEGOTIABLE 12). setValueAtPosition is a field-level write, not a creator.
  - Cross-layer interaction: containment writes reparent (LModelElement.tsx:7961-7978) and change roots (5769-5773), i.e. D-layer write paths near, but not in, the sync layer. LIR owed per slice in Phase 2 for A-containment and B.
  - Side-effect safety: a containment move may detach from a previous container silently; hence the ownership map and error rule (Q3) live in the executor, before the write.

Smoke-test scenarios potentially affected (Phase 2):
  - a JjTL transformation with a reference between two rules (existing behaviour, unchanged result after A0)
  - a nested materialization (P-2026-10-30-1330) round-trip
  - open an existing project with a saved transformation: parses and runs unchanged
  - save -> reopen of a transformed target model: identical state

Uncertain about propagation: the effect of removing the copy (A0) on projects that rely on
the current snapshot semantics. Not measured. STOP-and-ask applies at the A0 lane.
```

## 8. Risks and dependencies

- **A0 changes committed behaviour** (copy -> identity); existing tests encode the copy (`source-collections-in-expressions.test.ts:136`). It needs an explicit decision, not a silent edit.
- **Write-back assumes one target per source id** (`ProjectEditor.tsx:1809`): B cannot ship without lifting that.
- **Silent D-layer reparent and cycle refusal** are only reportable if the executor checks first (Q3).
- **C0 depends on a UI capability not verified** (M1 depending on M1).
- **Content authoring** (Q7a) is outside JjTL and gates the real-world payoff.
- **Nested path limits**: 3 s cap per level and 50 ms polls bound the size of a lowered subtree per level.
- **Gaps in this discovery:** `JJTL-DEVELOPMENT-PLAN.md:132-200` (multi-model roadmap syntax) not read; S2/S3 lanes of the ontological work read from design, not code; no run executed.

## 9. Open questions for Alfonso

1. Does A0 (binding by identity, ending the copy semantics) go first as its own lane, with a confirming test before the change?
2. Ambiguity (two rules on one source): keep the throw naming both rules, or adopt §5.3's declaration order?
3. May a containment with a second claimant be an **error** by default, or should it be a configurable warning (move)?
4. Can an M1 model declare another M1 as a dependency in the UI today? If not, is C0 acceptable as a platform change, or does C go straight to the copy fallback?
5. Syntax for called and lazy rules: adopt the roadmap sketch (`JJTL-DEVELOPMENT-PLAN.md:268-322`) as is, or revisit it now that the environment is dynamically scoped?
6. Is a textual notation for template/library models (outside JjTL) in scope of this front, or a precondition owned elsewhere?
