# Discovery — well-founded recursion in derived attributes (S3, R-SIM-74, R-SIM-43)

- Prompt-ID: `P-2026-09-27-1727` (chat `C-2026-09-27-1437`)
- Prompt file: `docs/prompts/claude_2026-09-27_1727_prompt_discovery_sim_derived_recursion.md`
- Session: `8677d1da-8e73-4eb3-8f9e-7e5cee32b018`
- Tree: `~/jjodel-w-recursion`, branch `sim-derived-recursion`, HEAD `21394e437` (the prompt commit; parent
  `93e964141` on `alfonso-frontend-jjtl`). `git status` empty at the start and after every probe run.
  `sim-e1-engine` is an ancestor of HEAD [M: `git merge-base --is-ancestor`], and the engine files
  `derivedEvaluator.ts`, `guardContext.ts`, `actionEvaluator.ts`, `netStep.ts`, `netTypes.ts` do not differ from
  its tip [M: `git diff --stat HEAD sim-e1-engine`, empty]: the backlog's risk 5 (stale reads) does not apply.
- Executor: Opus 5.5 (session banner)
- Read-only under `frontend/src`. One probe, gitignored (`frontend/scripts/smoke/_tmp_recur_probe/recur.test.ts`
  and `_tmp_recur_probe.vitest.config.ts`), pure vitest, no dev server: port 3021 was not needed and not opened.

This report is a set of hypotheses with evidence, not a definitive reference. Anyone who uses it downstream should
re-read the real files. Tags: **[M]** measured in this phase on HEAD `21394e437`; **[R]** read in a file of that HEAD
(or of the branch named). **[P]** a result of the probe's own G3 prototype: the prototype only orders the plan;
the values are computed by the real `makeDerivedOracle` and the real JjEL evaluator.

---

## 0. Answer in brief

- **The refusal is one place: the name graph of `compileDerived`.** Every well-founded recursion tried (a tree's
  size, a node's depth, a list's length) passes the parser and the subset checker with no diagnostic, and is
  rejected only as `equation cycle: size → size` by `derivedEvaluator.ts:137-154` [M].
- **The evaluator already computes the recursion when the plan is ordered per element.** Fed a leaves-first plan,
  the real `makeDerivedOracle` gives `size = 7` on a 7-node tree with no failure; fed root-first, 3 failures
  `'size' is not a state attribute of n2` [M]. What is missing is the order, not the evaluation.
- **The collection form needs no R-SIM-43 amendment.** `self.children.sum(c => c.[size])` and
  `(forall c in self.children : c.[size]).sum()` read `.[x]` on an element (`c`), are accepted by the subset
  checker and evaluate today [M]. Only the literal `self.children.[size]` is refused, by the evaluator
  (`'.[own]' needs a model element on its left, got a collection`) [M]. A collection-valued `.[x]` is sugar; it would
  amend R-SIM-18 as well as R-SIM-43, and touch JjEL's evaluator.
- **G3 (per element and attribute, folded over frozen M) is small and cheap.** A prototype of about 120 lines
  orders all the recursions [P], detects the circular list and the lasso [P], and keeps today's plan and values on
  the fixtures G1 accepts, the ESM demo equation included [P]. Cost at Reset: 5.8 ms for a 1023-node tree, 3.9 ms
  for a 1000-cell list; per σ the evaluation is today's (1.4 ms and 0.6 ms) [M, P].
- **The four demo presets are not affected.** Three declare no equation, so the bridge builds no oracle
  (`simBridge.ts:350`) [R]. The ESM preset's `paid := model.[coins] >= 2` has one node and no edge under G3, same
  plan, same value [P].
- **Recommended Phase 2 (after MODELS, per ratification C):** one full lane `sim-derived-recursion` Phase 2, on
  `derivedEvaluator.ts`, `derivedEvaluator.test.ts`, one line of `simBridge.ts` and one test in
  `simBridge.test.ts`, after `sim-derived-diagnostics` merges. It amends R-SIM-74 (awaits Alfonso, RC-26). R-SIM-43
  stays.

---

## 1. Hypotheses under test

| # | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| H1 | A well-founded recursion is refused by the dependency graph alone | **holds** for the lambda and `forall` forms; **falsified** for the literal collection form | §4.1: the subset checker gives `[]` on all four [M]; `compileDerived` gives `cycle` [M]. §4.2: `self.children.[own]` fails in the evaluator [M] |
| H2 (backlog fact (b)) | «The collection form is refused before the graph» by R-SIM-43 and the evaluator | **partly** | true of `children.[total]` [M]; false of `children.sum(c => c.[total])`, which never builds a collection-valued `.[x]` [M] |
| H3 (backlog fact (a), report C2 H6) | The (metaclass, name) refinement R-SIM-74 defers does not lift the recursion | **holds** | every recursive read goes through `c`, `self.next` or `self.parent`, never through `self` alone (§5); G2 folds only `self` (C2 report §6) [R] |
| H4 | The evaluator computes the recursion correctly once the plan is ordered per element | **holds** | §4.3: post-order plan `size [1,1,3,1,1,3,7]`, 0 failures [M] |
| H5 | `makeDerivedOracle`'s plan shape (per equation, then per owner) can express the G3 order | **falsified** | `derivedEvaluator.ts:255-256` groups by equation; mutual recursion interleaves equations (`N3.a N4.a N6.a N7.a N3.b N4.b N2.a …`) [P] |
| H6 | Folding each `StateAccess` object over frozen M finds every edge soundly, with a by-name fallback | **holds** on the models tried | §5, §6: exact edges on tree, list, parent chain; the fallback keeps a σ-dependent receiver refused [P] |
| H7 | G3 keeps today's plan on every model G1 accepts | **partly** | same plan and values on three fixtures [P]; with a tie-break by name the plan changes where G1 had a false edge (`T1x.b P1x.a` today, `P1x.a T1x.b`) [P]: the tie-break must be the name graph's rank (§7.1) |
| H8 | The graph's cost matters on the demo presets | **falsified** | no graph on three presets (no equation); 0.018 ms on ESM [M, P] |
| H9 | Containment recursion can be cyclic on a Jjodel model | **falsified** by construction | `parent` is the eContainer (`eval.ts:700-706`) and a DObject has one father [R]; only a non-containment reference (`next`) can close a cycle (§5.4) |

---

## 2. Objective

Show where and why the recursion R-SIM-74 refuses is refused; build the per-(element, attr) graph on paper on
realistic models with cycle detection; measure its cost, the demo presets included; state the amendment text of
R-SIM-74, and of R-SIM-43 if the collection form needs it; recommend the Phase 2 lanes with their files, tests,
R- rows and risk to the four demo presets. Ratification C: Phase 1 now, no amendment before MODELS.

---

## 3. Files read

Code [R], all on HEAD `21394e437`:
- `frontend/src/model/simulation/derivedEvaluator.ts` (whole, 259 lines)
- `frontend/src/model/simulation/guardContext.ts` (whole, 198 lines)
- `frontend/src/model/simulation/actionEvaluator.ts` (lines 1-223)
- `frontend/src/model/simulation/subsetChecker.ts` (lines 1-396)
- `frontend/src/model/simulation/netCompile.ts` (lines 380-541)
- `frontend/src/model/simulation/netStep.ts` (lines 40-58, 215-296)
- `frontend/src/model/simulation/__tests__/derivedEvaluator.test.ts` (whole, 221 lines); `guardContext.test.ts`
  and `actionEvaluator.test.ts` headers and the collection cases found by grep (`actionEvaluator.test.ts:42,209,239`)
- `frontend/src/components/editor-v2/sim/simBridge.ts` (lines 296-380)
- `frontend/src/jjel/evaluator/evaluator.ts` (lines 677-760, 831-880, 985-1020)
- `frontend/src/jjel/evaluator/context.ts` (lines 235-290, 345-365)
- `frontend/src/jjel/evaluator/builtins/collections.ts` (lines 1-60, 380-425, 555-590, and every `.call(` by grep)
- `frontend/src/jjscript/executor/commands/eval.ts` (lines 200-330, 540-640, 695-712, 815-832)
- `frontend/src/model/CLAUDE.md` (§3.6-§3.8), `frontend/src/jjel/CLAUDE.md` (whole, 12 lines)

Docs:
- `docs/decisions.md` R-SIM-17 (1530), R-SIM-18 (1547), R-SIM-19 (1568), R-SIM-39..44 (1772-1810), R-SIM-69..76
  (1990-2069), RC-22 (165), RC-25 (192), RC-26 (199)
- `docs/discovery/discovery_2026-09-27_sim_derived_attributes.md` (C2 report: §4, §5, §6)
- `simulation-engine:docs/discovery/discovery_2026-09-27_sim_backlog_lanes.md` (§0, §1, §4.1 S1-S3, §5, §6, §7, §8)
- `sim-canvas-state:docs/ratifiche/claude_ratifiche_2026-09-27_sim_backlog_answers.md` (whole)
- `docs/demo/models_2026_simulator_demo.md` (lines 1-60, 180-300)
- `docs/log-inbox/simulation.md` (the C2 entry and its tickets, `:27-45`; the tail)
- `CLAUDE.md`, `docs/PROTOCOL.md` (P1-P16)

---

## 4. Where the recursion is refused, and why

### 4.1 The name graph (R-SIM-74, G1)

`derivedEvaluator.ts:137-144` [R]:

```
// The graph by name (G1): an edge from a derived name to every derived name its equations read.
const names = [...new Set(compiled.map(c => c.decl.name))].sort();
const edges = new Map<string, string[]>(names.map(n => [n, []]));
for (const c of compiled) {
    const out = edges.get(c.decl.name) as string[];
    for (const r of c.reads) if (edges.has(r) && !out.includes(r)) out.push(r);
}
```

`reads` is every `StateAccess.attribute` of the equation, nested ones and lambda bodies included
(`derivedEvaluator.ts:121-124`: `if (e.type === 'StateAccess' && typeof e.attribute === 'string' && !reads.includes(e.attribute)) reads.push(e.attribute);`).
So an equation of `size` that reads `.[size]` anywhere is a self-edge, and `derivedEvaluator.ts:146-153` makes it a
defect: `defects.push({ index: c.index, name: n, code: 'cycle', message: \`equation cycle: ${cycle.join(' → ')}\` })`.
The cyclic name is then dropped from the order (`:159`: `if (!cyclic.has(n)) pending.set(…)`), so the equation
never runs.

Measured [M], `compileDerived([OWN, d])`, `OWN` a stored `own` on `C_Node`:

| Equation | `compileDerived` | `checkGuardSubset` |
|---|---|---|
| `size := self.[own] + self.children.sum(c => c.[size])` | `cycle`, `equation cycle: size → size`, order `[]` | `[]` |
| `depth := if self.parent == null then 0 else self.parent.[depth] + 1` | `cycle`, `depth → depth` | `[]` |
| `len := if self.next == null then 1 else self.next.[len] + 1` | `cycle`, `len → len` | `[]` |
| `fa := self.[own] + (forall c in self.children : c.[fa]).sum()` | `cycle`, `fa → fa` | `[]` |

Why the subset checker lets them through [R]: a lambda is legal as a method argument
(`subsetChecker.ts:309`, `e.args.forEach(asArg)`; `:337`, E-VALUE only `if (!lambdaAllowed)`); `sum` is not in
`NOT_VERIFIABLE_METHODS` (`:64-79`); `E-FORALL` fires only when the whole expression is a `forall`
(`:389`, `if (expr.type === 'ForAll')`).

### 4.2 The literal collection form (R-SIM-43)

`evaluator.ts:1010-1014` [R]:

```
const target = this.evaluate(expr.object, ctx);
const id = isJjelObject(target) ? (target as any).id : undefined;
if (typeof id !== 'string' || id === '') {
    const got = target === null ? 'null' : Array.isArray(target) ? 'a collection' : typeof target;
    throw new JjelEvaluationError(`'.[${expr.attribute}]' needs a model element on its left, got ${got}`, expr);
```

Measured [M]: `lit := self.[own] + self.children.[own].sum()` parses (0 errors), subset `[]`, `compileDerived`
no defect (it reads only the stored `own`), and the real oracle fails on each of the three nodes with
`JjelEvaluationError: '.[own]' needs a model element on its left, got a collection`. Control, same tree:
`lam := self.[own] + self.children.sum(c => c.[own])` gives `N1.lam 3`, `N2.lam 1`, 0 failures [M].

This is R-SIM-43 as written (`decisions.md:1799-1800`: «Un percorso che dà una collezione o `null` è un difetto a
tempo di run in B2») and R-SIM-18 (`decisions.md:1551-1552`: «un percorso che dà un primitivo o una collezione è un
errore in authoring»). The lambda form does not meet either: its path, `c`, gives an element.

### 4.3 The lambda form evaluates today

Three facts make it work [R]:
- a lambda captures its context and binds its parameters in a child of it (`evaluator.ts:866-880`,
  `const lambdaCtx = capturedCtx.child();`);
- `child()` propagates the state hook (`context.ts:356`, `child.stateAccess = this.stateAccess;`), so `c.[size]`
  inside the lambda reads σ like `self.[own]` outside;
- every collection method that takes a function calls it with the element alone (`collections.ts`, the 19 `.call(`
  sites, each `.call([item], ctx)` or `.call([a], ctx)`; `sum` at `:404`,
  `const value = selector ? selector.call([item], ctx!) : item;`).

`if … then … else` is lazy (`evaluator.ts:832-842`), so the base case of `len` and `depth` never evaluates the
recursive branch.

Measured [M], the real `makeDerivedOracle` with the name graph bypassed (`SIZE` alone in the order), 7-node tree:

```
C.forced post-order ids N3,N4,N2,N6,N7,N5,N1 size [1,1,3,1,1,3,7] failures 0
C.forced pre-order ids N1,N2,N3,N4,N5,N6,N7 size [null,null,1,1,null,1,1] failures 3 N1: JjelEvaluationError: 'size' is not a state attribute of n2
```

The order of the plan is the whole difference. The plan is built by `makeDerivedOracle`, `derivedEvaluator.ts:254-257`:

```
const plan: Evaluation[] = [];
for (const eq of compiled.order) {
    for (const [owner, byName] of net.declared) if (byName.get(eq.decl.name) === eq.decl) plan.push({ eq, owner });
}
```

Per equation, then per owner in `net.declared` order (the model's id order, `netCompile.ts:466-468`). A recursion
needs owners in dependency order, and a mutual recursion needs equations interleaved (§6.2), which this shape
cannot express (H5).

### 4.4 What the snapshot offers the recursion

- **References** are pool handles: «multi -> array (never null)», single «handle | null», the same handle object
  for the same target (`eval.ts:610-611`, the comment of `fillInstanceSlots`) [R]. So `self.children` is an
  array of handles and `self.next` a handle or `null`.
- **`parent`** is built in: `eval.ts:700-706`, «Stage 3: `parent` = the containing object (eContainer) … if the
  loop above already populated the key, skip the built-in», `handle.parent = resolveParentHandle(…)`; the root
  gets `null` (`:823-824`) [R]. So `depth` needs no declared `parent` reference. (The probe's handles set `parent`
  by hand, in the same shape.)
- **Owners** of a derived attribute on a metaclass are every model element of that metaclass, not only places
  (`netCompile.ts:466-468`, `ids.filter(id => view.exists(id) && view.isInstanceOf(id, decl.metaclass as string))`)
  [R]. A tree of `Node` objects beside the net can carry `size`.

---

## 5. The per-(element, attr) graph on paper

**Construction (G3).** One node per (owner, attribute) where the declaration that holds on the owner has an
`equation`. For each node, walk the equation's AST and, for every `StateAccess`:

1. `node.[a]` → the owner (presentation, local by R-SIM-18).
2. The object is σ-free (no `StateAccess`, no `event`, `actionEvaluator.ts:138-146` `dependsOnStep`) and its free
   names are `self`, `model`, instance names or variables whose values are known → evaluate it on frozen M with
   `self` the owner (for a global, the model root, as `derivedEvaluator.ts:218`), once per binding; an element →
   an edge to (element, a); `null` or a throw → no edge (the run-time read fails the same way).
3. A variable bound by a lambda that is an argument of a collection method takes the elements of the method's
   receiver, folded by rule 2; a `forall`/`exists` variable takes the elements of its collection. A receiver or
   collection that reads σ gives the variable no known value.
4. Otherwise (σ-dependent object, unknown variable) → the fallback: an edge to every owner of `a` where `a` is
   derived (today's G1, restricted to this node).

An edge (e, a) → (e′, a′) exists only if a′ is derived on e′; a stored target needs no order. Cycles: Tarjan's
strongly connected components; a node is cyclic if its component has two nodes or more, or a self-edge. Order:
Kahn over the acyclic nodes.

### 5.1 A tree's size (7 nodes, depth 2, ids in pre-order)

```
n1 ─┬─ n2 ─┬─ n3        size := self.[own] + self.children.sum(c => c.[size])
    │      └─ n4        own stored, 1 on every node
    └─ n5 ─┬─ n6
           └─ n7
```

Rule 3: in n1's equation, `c` ranges over `self.children` folded on n1 = {n2, n5}. Edges (6 = N−1):
`n1→n2, n1→n5, n2→n3, n2→n4, n5→n6, n5→n7`. No cycle. Order: `n3 n4 n2 n6 n7 n5 n1`.
Measured [P]: 7 nodes, 6 edges, 0 fallback reads, 0 cyclic, `N1.size = 7`, 0 failures; today `size → size`.

### 5.2 A node's depth (the same tree)

`depth := if self.parent == null then 0 else self.parent.[depth] + 1`. Rule 2: `self.parent` folded on each node:
n1 → `null` (no edge), n2 → n1, … Edges (6): `n2→n1, n3→n2, n4→n2, n5→n1, n6→n5, n7→n5`. Order `n1 … n7`.
Measured [P]: 6 edges, `N7.depth = 2`, 0 failures.

### 5.3 A list's length (5 cells)

`c1 → c2 → c3 → c4 → c5 → null`, `len := if self.next == null then 1 else self.next.[len] + 1`. Edges (4):
`c1→c2, c2→c3, c3→c4, c4→c5`; c5's `self.next` folds to `null`. Order `c5 c4 c3 c2 c1`.
Measured [P]: `C1.len = 5`, 0 failures.

### 5.4 Cycles

- **Circular list** `c1 → c2 → c3 → c1` beside a proper list `d1 → d2 → d3 → d4`: one component {c1, c2, c3},
  cyclic; the d-list is ordered and evaluated. Measured [P]: cyclic `C1.len, C2.len, C3.len`, order
  `D4.len D3.len D2.len D1.len`, `D1.len 4`, `C1.len` absent, 0 failures.
- **Lasso** `c1 → c2 → c3 → c2`: cyclic {c2, c3}; c1 is not on the cycle but reads c2. As today for a reader of a
  cyclic name (`derivedEvaluator.ts:159` keeps it), it runs and fails. Measured [P]: failure
  `C1: JjelEvaluationError: 'len' is not a state attribute of c2`.
- **Containment cannot close a cycle.** `children` of a composition and `parent` follow the single `father` of a
  DObject (H9); a recursion along them is well-founded on every model. Only a plain reference (`next`, `target`)
  can form a cycle, and then only on the elements of the cycle.
- **The fallback keeps the unsafe case refused.** `size2 := self.[own] + self.children.filter(c => c.[own] > 0).sum(c => c.[size2])`:
  the receiver of `sum` reads σ, so `c` is unknown, each node reads every node's `size2`, itself included.
  Measured [P]: 7 fallback reads, 7 of 7 cyclic. The rewrite with the test inside the lambda,
  `self.children.sum(c => if c.[own] > 0 then c.[size3] else 0)`, folds: 0 fallback, 0 cyclic, `N1.size3 = 7`.
- **Crossing names** (C2 report §4.2): `Place.a := self.[b]`, `PTr.b := self.[a]`. Today `a → b → a`; G3: no edge
  (no place has `b`, no transition has `a`) [P].

---

## 6. Measurements

Probe `frontend/scripts/smoke/_tmp_recur_probe/recur.test.ts`, run from `frontend/` with
`npx vitest run --config scripts/smoke/_tmp_recur_probe.vitest.config.ts --reporter=verbose --silent=false`,
exit 0, 9 tests passed, 37 `[RECUR]` lines (last run). Fixture: the b2net roles of `derivedEvaluator.test.ts`
(`compileNet` over a raw lookup, `freezeSnapshot` over a synthetic `buildEvalContext` record with instance names
bound), plus `C_Node` trees and `C_Cell` lists whose handles carry `children`, `parent`, `next` as pool handles.
Subject executed (P11): `compileDerived`, `makeDerivedOracle`, `withDerivedInitial`, `checkGuardSubset`,
`parseExpressionStrict`, the JjEL evaluator. The G3 prototype only builds the order; to run it through the real
`makeDerivedOracle`, the probe gives each owner its own copy of the declaration, so the oracle's per-equation loop
yields exactly one plan entry per G3 node.

Two defects of the first run were fixed before any number here is quoted: the §4.2 control read a declaration
absent from its net (it printed `undefined`, a vacuous control, P12), and the fold time was the last repetition's,
not the median.

### 6.1 Cost (median of 5 after one discarded, Node, this Mac)

| Model | Nodes | Edges | Fold evaluations | G3 at Reset | of which fold | Evaluation per σ | Today `compileDerived` |
|---|---|---|---|---|---|---|---|
| tree d=3 | 15 | 14 | 44 | 0.28 ms | 0.20 | 0.05 ms | 0.029 ms |
| tree d=6 | 127 | 126 | 380 | 1.22 ms | 1.00 | 0.28 ms | 0.035 ms |
| tree d=9 | 1023 | 1022 | 3068 | 5.78 ms | 5.07 | 1.38 ms | 0.025 ms |
| list 10 | 10 | 9 | 10 | 0.08 ms | | 0.01 ms | |
| list 100 | 100 | 99 | 100 | 0.43 ms | | 0.06 ms | |
| list 1000 | 1000 | 999 | 1000 | 3.87 ms | | 0.62 ms | |
| ESM demo `paid` | 1 | 0 | 1 | 0.018 ms | | | 0.009 ms |

Across the three runs the per-σ figure moved (tree d=9: 2.55, 1.36, 1.38 ms): machine noise, one order of
magnitude below a frame. The graph is built once per run at Reset (M is frozen, R-SIM-14); a step pays only the
evaluation, which is today's code. The fold dominates the Reset cost and is linear in edges.

### 6.2 Order and values against today's

| Fixture | Today's plan | G3 plan | Same values |
|---|---|---|---|
| b2net `total`, `busy`, `count` | `P1x.busy M.count M.total` | same | yes [P] |
| order test `z`, `a` (`derivedEvaluator.test.ts:123-130`) | `M.z M.a` | same | yes [P] |
| ESM demo `coins` stored, `paid` derived | `M.paid` | same | yes [P] |
| `derivedEvaluator.test.ts:147-159` cycle fixture `a`, `b`, `c`, `d` | `M.d`, cyclic a, b, c | `M.d`, cyclic `M.a M.b M.c` | [P] |
| false G1 edge: `Place.a := self.[b] + 1`, `PTr.b := 1` | `T1x.b P1x.a` | `P1x.a T1x.b` with a by-name tie-break | [P] |
| mutual `Node.a := self.children.sum(c => c.[b])`, `Node.b := self.[own] + self.[a]` | both cyclic | `N3.a N4.a N6.a N7.a N3.b N4.b N2.a N2.b N6.b N7.b N5.a N5.b N1.a N1.b`, `N1.b = 7` | [P] |

The last two rows decide two design points: the tie-break (§7.1) and the plan's shape (H5).

---

## 7. Design options

### 7.1 G3, static fold with a by-name fallback — recommended

What §5 describes. It is the shape nuXmv's flattening has (R-SIM-74 already says nuXmv «controlla dopo
l'appiattimento»): over frozen M, `n1.size := n1.own + n2.size + n5.size` is the flattened `DEFINE`, and a cycle is a
static defect at Reset, as R-SIM-19 asks («controllo di circolarità sulle dipendenze»).

Properties, argued and measured:
- **Sound.** Rules 1-2 are exact over frozen M; rule 3 over-approximates (all elements of the receiver); rule 4 is
  G1. Every G3 edge projects onto a G1 edge (same `StateAccess`, same attribute), so **every model G1 accepts, G3
  accepts** (a G3 cycle projects to a G1 cycle).
- **Tie-break.** Kahn picks the ready node with the smallest key (rank of the name in the condensation of today's
  name graph, ties by name; then the owner's index in `net.declared`). On a G1-acyclic model this reproduces
  today's plan exactly: a node of rank r depends only on ranks below r, so nodes come out rank by rank, owners in
  order. A key by name alone does not (§6.2, false edge), and a different plan can change which failure a halt
  names (`netStep.ts:277` takes the first semantic failure).
- **Cycle defect.** One per declaration, as today. A cycle that stays on one element keeps today's exact text
  (`equation cycle: a → b → a`, `c → c`), so `derivedEvaluator.test.ts:150-152` and `simBridge.test.ts:1024-1026`
  hold unchanged. A cycle across elements names them, `equation cycle: c1.len → c2.len → c3.len → c1.len`, with
  `element` the first element on it (the bridge already appends `on <name>`, `simBridge.ts:315`). Only the cyclic
  nodes lose their value; the rest of the declaration runs («a defective declaration still applies where it can»,
  `netCompile.ts` comment of `compileNet`).
- **Limits, declared.** A σ-dependent receiver (`filter(…).sum(…)`) falls back to the name; the rewrite with the
  test inside the lambda folds (§5.4). A presentation read of another element is still refused by name
  (`derivedEvaluator.ts:129-133`), unchanged.

**Code shape.** `compileDerived(decls, frozen?: { snapshot, net })`: without `frozen`, exactly today (G1); with
it, the name cycles become candidates, the element graph gives the cycle defects and an optional
`CompiledDerived.plan` (Rule 11: an optional property on an exported interface). `makeDerivedOracle` uses
`compiled.plan` when present, else today's loop. The bridge passes `frozen` (one line, `simBridge.ts:349`; the
snapshot is already built at `:343`). The fold reuses `dependsOnStep`'s logic (`actionEvaluator.ts:139`, private
today: copied, not exported, to leave `actionEvaluator.ts` out of the diff) and the context of
`derivedEvaluator.ts:218-223`. Estimated 120-160 lines in `derivedEvaluator.ts`.

### 7.2 Demand-driven evaluation per σ — not recommended

Evaluate each read on demand with a memo and an in-progress set; a cycle is found when it is walked. No static fold,
and it accepts σ-dependent receivers. But a cycle becomes a run-time halt, possibly after k steps, not a Reset
defect; the simulator accepts models whose flattening nuXmv refuses; and it reverses C2's choice of E1 (R-SIM-73:
«valuta ogni attributo derivato su σ′ in ordine di dipendenza»).

### 7.3 G2, (metaclass, name) — refuted

It folds `self` only (C2 report §6). None of the recursions here reads through `self` alone: the reads go through
`c`, `self.parent`, `self.next` (§5). It would not lift R-SIM-74's limit (H3).

### 7.4 A collection-valued `.[x]` (the sugar) — not needed, possible later

`self.children.[size]` giving the list of values (OCL's implicit collect). Orthogonal to the graph: G3 still orders
it (the prototype has the switch, rule 2 on an array). Cost: `jjel/evaluator/evaluator.ts:1010-1014` (JjEL, outside
the simulator, R-SIM-15's lane), a JjEL test, and the amendment of **two** rows, R-SIM-43 and R-SIM-18, which the
backlog did not name; and an action target must stay an element (R-SIM-40). The lambda form says the same thing
today with no change.

---

## 8. Phase 2

### 8.1 Files

| File | Change |
|---|---|
| `frontend/src/model/simulation/derivedEvaluator.ts` | the fold, Tarjan, Kahn with the rank tie-break; `compileDerived`'s optional `frozen`; `CompiledDerived.plan?`; `makeDerivedOracle` reads it |
| `frontend/src/model/simulation/__tests__/derivedEvaluator.test.ts` | new tests (§8.2); the existing ones unchanged |
| `frontend/src/components/editor-v2/sim/simBridge.ts` | `:349`, `compileDerived(plain.attributes, { snapshot, net: plain })` |
| `frontend/src/components/editor-v2/sim/__tests__/simBridge.test.ts` | one test through `startRun`: a tree `size` evaluated at Reset (kills «the bridge does not pass `frozen`», which `:1024` cannot see: its cycle is on one element) |
| `docs/decisions.md` | the R-SIM-74 amendment, after Alfonso's yes |

Four code files: full lane (more than 3). No critical-zone file (§3.1: `components/editor-v2/sim/` and
`model/simulation/` are not in it).

### 8.2 Tests, each with the mutation it kills

1. Tree size, leaves-last ids: `N1.size = 7`, no defect (kills: no fold of the lambda binder → self-loop).
2. Depth via the built-in `parent`: root 0, leaves 2 (kills: `null` fold makes an edge).
3. List length: head = 5 (kills: order by id instead of Kahn).
4. Circular list plus a proper list: one `cycle` defect naming `c1.len → c2.len → c3.len → c1.len`, the proper
   list evaluated, the circular values absent (kills: whole-declaration exclusion; kills: no Tarjan).
5. Lasso: c1 runs and fails, c2 and c3 cyclic (kills: transitive exclusion, a behaviour change).
6. `filter(…).sum(…)`: all cyclic; the rewrite: none (kills: treating a σ-dependent receiver as foldable).
7. Mutual recursion `a`/`b`: `N1.b = 7` (kills: the per-equation plan).
8. False G1 edge: plan `T1x.b P1x.a` as today (kills: a tie-break by name).
9. `forall` projection form: `N1.fa = 7` (kills: no fold of `forall`'s variable).
10. `simBridge.test.ts`: a tree through `startRun`, `size` of the root in `run.config.state.derived` (kills: the
    bridge line).

The existing suite is the no-regression oracle: `derivedEvaluator.test.ts` 16 tests and the bridge's cycle test
`:1024-1026` must stay green without edits.

### 8.3 R- rows

- **R-SIM-74**, amended (text in §9). Ratified by the morning digest (backlog risk 9), so RC-26: awaits Alfonso.
- **R-SIM-43, R-SIM-18**: untouched under the recommendation. Amended only if Alfonso wants the sugar (§9.2).
- **R-SIM-19**: satisfied as written («controllo di circolarità sulle dipendenze»); no amendment.

### 8.4 Risk to the four demo presets

None by construction: PEST, Petri and Flowchart B declare no equation (Flowchart B's `count` is stored, demo script
§2.4), so `simBridge.ts:350` builds no oracle and the new code never runs. The ESM preset's one global equation has
the same plan and value under G3 [P, §6.2]. Ratification C puts the merge after MODELS anyway.

### 8.5 Lanes

One lane, `sim-derived-recursion` Phase 2, full (four files). It shares `derivedEvaluator.ts`, `simBridge.ts` and
`simBridge.test.ts` with `sim-derived-diagnostics` (S1, S2, wave 2a), so it queues behind that merge (RC-22 check 1
fails; backlog §5 wave 3 already says so). Merge after 2026-10-04.

One coordination point for S2: its planned message for a derived attribute with no value, «derived 'total' has no
value (its equation failed)» (backlog §4.1 S2), is wrong for a node that is absent because it sits on a cycle. S2
should say «has no value» and let the defect line say why, or Phase 2 adjusts it.

---

## 9. Amendment texts

### 9.1 R-SIM-74 (needed)

Appended to the row, in the style of R-SIM-73's amendment:

> **Emendata il <data>** (ratifica di Alfonso, S3, `P-2026-09-27-1727`): il grafo delle dipendenze è per
> (elemento, attributo) su M congelato (G3). Per ogni proprietario di un'equazione, l'oggetto di ogni nodo
> `StateAccess` che non legge σ né `event` si valuta una volta su M congelato con `self` il proprietario; una
> variabile legata da una lambda argomento di un metodo di collezione, o da `forall`/`exists`, prende gli elementi
> della collezione su cui itera quando questa non legge σ; `node` è il proprietario. Dove l'oggetto non si riduce
> così, l'arco va a ogni proprietario dell'attributo derivato per nome (il G1 di prima, ristretto a quel nodo).
> Un ciclo è un difetto di dichiarazione, uno per dichiarazione: con il testo di prima se il ciclo resta su un
> elemento, con gli elementi nominati (`c1.len → c2.len → c1.len`) se li attraversa; restano senza valore solo gli
> elementi sul ciclo. L'ordine è il topologico per (elemento, attributo), a parità il rango del nome nell'ordine
> per nome e poi l'ordine degli elementi, così ogni modello accettato da G1 conserva il piano di oggi. Una
> ricorsione ben fondata sul contenimento o su un riferimento (`size := self.[own] + self.children.sum(c => c.[size])`,
> `len := if self.next == null then 1 else self.next.[len] + 1`) è accettata; su un M ciclico lungo quel percorso
> resta un difetto, come in nuXmv dopo l'appiattimento. Il raffinamento «per (metaclasse, nome)» cade: non avrebbe
> tolto il limite.

### 9.2 R-SIM-43 and R-SIM-18 (only with the sugar of §7.4)

> R-SIM-43, **emendata il <data>**: un percorso che dà una collezione di elementi del modello, a sinistra di `.[x]`
> in lettura, dà la lista dei valori di `x` nell'ordine della collezione (collect implicito) e lancia sul primo
> elemento che non ha `x`; resta un difetto un percorso che dà `null`, un primitivo, o una collezione con un valore
> che non è un elemento. Il bersaglio di un'azione resta un elemento (R-SIM-40).
>
> R-SIM-18, **emendata il <data>**: «un percorso che dà un primitivo o una collezione è un errore in authoring»
> vale per il bersaglio di un'azione; in lettura una collezione di elementi è ammessa (R-SIM-43).

---

## 10. Risks

1. **The fold evaluates JjEL at Reset outside a guard.** A σ-free object is evaluated on frozen M; the snapshot is
   deep-frozen and refuses bound functions (`guardContext.ts:88-108`), so the fold cannot write. A throw is caught
   and gives no edge.
2. **Combinatorics of nested binders.** Rule 3 enumerates the bindings of the free variables of an object; nested
   lambdas multiply. On a tree the walk is per edge (3068 folds for 1023 nodes). A pathological equation
   (`coll.sum(x => coll.sum(y => …))` over a large extent) is quadratic; Phase 2 should cap the combinations and
   fall back to the name above the cap.
3. **The by-name fallback is coarse.** A σ-dependent receiver refuses a recursion that is well-founded. The rewrite
   exists (§5.4); the message of the cycle defect should say so, or the panel title.
4. **`sum` skips non-numbers silently** (`collections.ts:405`, `if (typeof value === 'number')`). A string-valued
   `c.[x]` adds nothing instead of failing. Not a recursion issue; noted for the typed checker of C.
5. **No `.smv` exporter exists yet** [M: `find frontend/src \( -iname '*smv*' -o -iname '*nuxmv*' \)`, empty, exit 0;
   control `-iname '*derivedEvaluator*'`, 2 files through the same command]. The claim «nuXmv accepts it after
   flattening» is about the exporter to come: it has to unroll collection methods over frozen M. `sum` is not in
   the subset checker's not-verifiable list, so the checker already assumes it.
6. **S2 message** (§8.5): a cross-lane dependency, not a defect of this design.

---

## 11. Decisions taken (unattended)

1. **G3 as the recommended design**, with the by-name fallback, over demand-driven evaluation and G2 (§7).
2. **The collection form is written with a lambda or `forall`; no R-SIM-43 amendment recommended** (§4.3, §7.4).
3. **Only the nodes on a cycle lose their value**; readers of a cyclic node run and fail, as today for readers of a
   cyclic name (`derivedEvaluator.ts:159`).
4. **Cycle text**: today's when the cycle stays on one element, element-qualified otherwise, one defect per
   declaration at the first element on the cycle.
5. **Tie-break**: the rank of the name in today's name graph, then the owner's order, so G1-accepted models keep
   today's plan.
6. **`compileDerived` keeps its G1 path without `frozen`**, so the existing tests stay the regression oracle; the
   bridge always passes `frozen`.
7. **`dependsOnStep` is copied, not exported**, to keep `actionEvaluator.ts` out of Phase 2.
8. **The probe ran as a pure vitest, no dev server**: port 3021 was not used.
9. **One docs commit** carries the report, the inbox entry and the Status flip, as the prompt's step 4 says (the
   `discovery-report` skill's «a commit of its own» yields to the prompt).

## 12. Decisions awaiting Alfonso (RC-26)

- **A. Amend R-SIM-74 as §9.1** (a row ratified in the morning digest). Recommended: yes, merged after MODELS as
  ratification C says.
- **B. The collection-valued `.[x]` sugar** (amends R-SIM-43 and R-SIM-18, touches JjEL). Recommended: no; the
  lambda form covers it. Revisit if users trip on `children.[x]`.

## 13. Questions

1. Should the cap of risk 2 be a fixed number of combinations per equation (e.g. 10 000), or the extent size?
2. Should the cycle defect's title (R-SIM-62) suggest the lambda rewrite when the cycle comes from the fallback?
3. Does S2 (`sim-derived-diagnostics`) take the «no value» wording of §8.5, or does Phase 2 adjust it after?

**Answered by Alfonso, 2026-09-27 17:47 (in chat, C-2026-09-27-1437): ok to the recommendations.** A yes: amend R-SIM-74 as in 9.1, merged after MODELS. B no: no collection on the left of .[x].
