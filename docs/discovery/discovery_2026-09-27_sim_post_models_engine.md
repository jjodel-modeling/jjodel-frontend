# Discovery — the post-MODELS engine batch: G6, G7, G12

- Prompt-ID: `P-2026-09-27-1545` (chat `C-2026-09-27-1437`)
- Prompt file: `docs/prompts/claude_2026-09-27_1545_prompt_discovery_sim_post_models_engine.md`
- Session: `39853efb-b9cb-4ddb-a2b4-63f7b153fe6e`
- Tree: `~/jjodel-icons`, branch `sim-post-models-engine`, HEAD `f18d976d5` (the prompt commit; parent `d7fe8871f`,
  the trunk after the `simulation-engine` merge `c905b099e`). `git status` empty at the start and after every probe.
- Executor: Opus 5.5 (session banner)
- Read-only. No file under `frontend/` was written. Every probe lives in `/tmp/p1545/` and runs the engine files of
  this tree by absolute path, bundled by the tree's own `esbuild` (`frontend/node_modules`, a symlink that existed
  before this lane). No dev server.

This report is a set of hypotheses with evidence, not a definitive reference. Anyone who uses it downstream should
re-read the real files. Tags: **[M]** measured in this phase on `f18d976d5` by the probes of §9; **[S]** measured on
the sketch of §3 applied to copies of three engine files in `/tmp/p1545/patched/`, never in the tree; **[R]** read in
a file or doc of the same HEAD.

Prompt note (RC-17, P13): the header reads `Lane: full (Phase 1 discovery, read-only; …)`. A read-only discovery is
none of RC-3's four triggers (critical zone, migration, more than 3 files, a changed exported interface). The lane
ran as written; each Phase 2 lane below names its own trigger.

---

## 0. Answer in brief

- **G6** is an engine gap and nothing else. `simActivityFinal` reaches no field of the STC, and `terminated` reads F
  only. The fix is about 10 lines in `netTypes.ts`, `netCompile.ts`, `netStep.ts`. On the sketch, Flow C ends
  `Terminated` instead of `Deadlock` [S]. The source-text test that pins the key as unread must move with it. A
  panel row for the key is recommended in the next lane.
- **G7** is wider than measured. `else` is recognised on plain edges only, so on an edge into a fork it is parsed
  as a guard (the known defect). The mirror case is new and silent: `else` on the plain branch never sees a sibling
  that enters a fork, is always true, and the decision offers both branches [M]. The sketch resolves `else` over
  plain and fused transitions alike, with R-SIM-31(1)'s siblings as written: this covers the edge into a fork, the
  edge out of a join and the mirror [S]. An `else` into a join or out of a fork cannot be expressed with those
  siblings, so it becomes a named defect, `else-position`, in place of today's parse error [S].
- **Both sketches keep every committed behaviour.** The four engine suites give 155/155 on the tree and on the
  sketch. The bridge suites are the same on both (§3.4) [S]. Nine proposed tests are red on the tree (9/9) and
  green on the sketch (9/9), and they kill 10 of 10 mutants; the existing 155 kill 0 of them [S].
- **G12:** option (a), the largest initial marking times the largest weight into a place, gives 4 on the demo net
  by the net's shape only. It proposes 2 on a merge that reaches 4, 3 on a chain that reaches 9, and 10 on a heavy
  input that needs 5 [M]. Option (b), a bounded exploration that ignores guards, keeps inhibitors and termination,
  and detects unboundedness, gives the true 4 on the demo net. It explores 9 markings in 0.3 ms, and gives an upper
  bound on every net where it closes [M]. **Recommended: (b).** It amends R-SIM-81(1), which Alfonso ratified, so it
  waits for his yes (§7).
- **Demo presets:** G6 and G7 change nothing on the four presets as the script draws them. Flow B's trace is
  identical line by line [S]. G12(b) changes one thing: the Petri proposal reads `Bound → 4`, which makes step 3 of
  the script redundant after MODELS.
- **Phase 2 order:** E1, G6 and G7 in the engine, can start on 2026-10-05 unattended. E2, the G6 panel row plus
  G12(b), follows Alfonso's answer to A (§5).

---

## 1. Hypotheses under test

| # | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| H1 | G6 is a pure engine gap: the key reaches no STC field, and `terminated` reads F only | **holds** | STC keys of the Flow C bag: `bound,fork,guard,initial,join,nextState,node,shape,source,transition`, no `activityFinal`. The run ends `status Deadlock terminated false final null`; control Flow B `status Terminated … final [ 'fin' ]` [M] |
| H2 | The G6 fix fits in the three engine files, and the four presets' pinned behaviour is unchanged | **holds**, plus one source-text test | 155/155 existing engine tests on the sketch, Flow B trace identical [S]; `roleCatalog.test.ts:74-79` asserts no source quotes `simActivityFinal` (§2.4) [R] |
| H3 | G7 is `else` recognised on plain edges only: a fused transition keeps the `else` text as a guard site | **holds, and wider** | `fk pre=d1 guardSites=[f4,f5,f6] elseOf=null`, deadlock at `d1` with count 2 [M]. Mirror: `f3 … elseOf=[]`, at count 2 `candidates=[f3,fk]` [M] |
| H4 | R-SIM-31(1) as written (siblings: same preset, same triggers) covers `else` at every position in a fusion | **partly** | the fork in-edge and the join out-edge share the preset of their siblings [S]. An edge into a join fuses into a preset of all the join's inputs (`jn pre=d1,r`), which no sibling of `d1` has [M] |
| H5 | G12 option (a) gives a sound proposal | **falsified** | demo 4 = true 4; merge 2 against 4; chain 3 against 9; heavy input 10 against 5 [M] |
| H6 | G12 option (b) gives a sound proposal at a small cost | **holds when the exploration closes** | demo `{"max":4,"exhaustive":true,"states":9}` in 0.29 ms; merge 4, chain 9, heavy 5, all exhaustive; the self-feeding loop `unbounded: true` [M]. The cost is in the wiring (§4.4) [R] |
| H7 | None of the three touches a critical-zone file (CLAUDE.md §3.1) | **holds** | every file named below is under `model/simulation/` or `components/editor-v2/sim/`, neither in §3.1 [R] |

---

## 2. G6 — `simActivityFinal` is written by Apply, never read by the engine

### 2.1 Where it lives [R]

- The binder recognises the class by name, `profileBinder.ts:195` `{ role: 'activityFinal', name: ACTIVITY_FINAL_NAME },`,
  and the Flowchart profile keeps the role active, `simProfiles.ts:142-143`
  `active: ['guard', 'terminal', 'activityFinal', …]`. So Apply writes `simActivityFinal` into the bag (readiness 2 §4.2).
- The engine reads the bag through `ROLE_KEYS`. The row has no pair for the key:
  `netCompile.ts:48` `['initialMarking', 'simInitialMarking'], ['terminal', 'simTerminal'],`. `NetStc` has no field for
  it (`netTypes.ts:122` `readonly terminal?: string;` is the only final role).
- Termination reads F only: `netStep.ts:67-69` `export function terminated(net: CompiledNet, state: SimState): boolean {`
  / `const final = net.final;` / `if (final === null) return false;`. `candidates`, `netRunStatus` and
  `structuralInputs` all go through it.
- Absence check: `command grep -rn -E 'simActivityFinal|activityFinal' frontend/src` exits 0. Its hits are
  `profileBinder.ts:195`, `simProfiles.ts:143`, `roleCatalog.ts:9,19,79-80` and three test files, and none is in
  `netCompile.ts`, `netStep.ts` or `simBridge.ts`. The positive control is the same command for `simTerminal` (tests
  excluded): seven hits, among them `netCompile.ts:48`, `netTypes.ts:214` and `stcFromRoles.ts:24`.
- The panel does not show the key either. `RoleKey` and `ROLE_SPECS` (`simRoleStatus.ts:26-96`) have no
  `simActivityFinal`, and `ROLE_GROUPS` (`SimulationPanel.tsx:189`) lists
  `'simNode', 'simInitial', 'simInitialMarking', 'simTerminal', 'simBound', 'simTransition'`. After a Flowchart Apply
  the key is in the bag, and Configure… has no row to see or clear it.
- The run signature already covers it: `simBridge.ts:398` takes every bag key that `startsWith('sim')`, so an edit of
  the key interrupts a run with no change.

### 2.2 Measured [M] and on the sketch [S]

The Flow C shape of the readiness probes is used: `ActivityFinal` bound as `simActivityFinal`, no `simTerminal`, and
the explicit complement.

```
[M] f1, f2, f3, f2, fk, jn fired → marking {"fin":1} → status Deadlock  terminated false  final null
[S] the same six steps          → marking {"fin":1} → status Terminated terminated true   final null
control Flow B (FinalNode as simTerminal): status Terminated, identical on the tree and on the sketch
```

### 2.3 The minimal change (sketch, run in `/tmp/p1545/patched/`)

```diff
--- netTypes.ts  (NetStc, after `terminal`; CompiledNet, after `final`)
+    /** R-SIM-53: the metaclass whose marked instance terminates the run, other tokens aside. */
+    readonly activityFinal?: string;
+    /** The places that are a kind of `simActivityFinal` (R-SIM-53); absent or `null` when the role is unset. */
+    readonly activityFinal?: ReadonlySet<string> | null;
--- netCompile.ts
-    ['initialMarking', 'simInitialMarking'], ['terminal', 'simTerminal'],
+    ['initialMarking', 'simInitialMarking'], ['terminal', 'simTerminal'], ['activityFinal', 'simActivityFinal'],
 …
     const final = stc.terminal ? new Set(places.filter(p => kind(p, stc.terminal))) : null;
+    const activityFinal = stc.activityFinal ? new Set(places.filter(p => kind(p, stc.activityFinal))) : null;
 …
         final,
+        activityFinal,
--- netStep.ts
 export function terminated(net: CompiledNet, state: SimState): boolean {
+    // R-SIM-53: a marked activity final ends the run, whatever else is marked.
+    const activityFinal = net.activityFinal;
+    if (activityFinal) for (const [place, n] of state.marking) if (n !== 0 && activityFinal.has(place)) return true;
     const final = net.final;
```

- The comment above `terminated` («Never true without the terminal role») names the activity final too.
- The header comment of `roleCatalog.ts:9-10` drops `simActivityFinal` from «nothing reads or writes them yet».
- Rule 11: the two new fields are optional properties of exported interfaces, which the rule allows. `netStep.test.ts`'s
  `mkNet` builds a `CompiledNet` literal and still compiles, since the field is optional.
- The activity final set is not merged into F. «Every marked place in F» stays as it was, and the activity final is
  a disjunct on its own (R-SIM-53). The proposed test «terminated» pins this: `{f:1, n:1}` is not terminated with
  `f` in F.

**Panel part, recommended, lane E2:**
- `simRoleStatus.ts`: `'simActivityFinal'` in `RoleKey`, and a `ROLE_SPECS` row
  `{ key: 'simActivityFinal', label: 'Activity final', kind: 'class', placeholder: 'Select a metaclass' }`.
- `SimulationPanel.tsx:189`: the key after `simTerminal` in the General group.
- `stcFromRoles.ts:24`: the key in the node sort, as `simTerminal` is, so the overlap check sees it.

It is not part of the minimal engine change. Without it the key is live but can only be seen in the proposals before
Apply (risk 1, §4).

### 2.4 Tests (names and assertions; run as `/tmp/p1545/g6g7.test.ts`, red 4/4 on the tree, green 4/4 on the sketch)

1. *netStcFromRoles reads simActivityFinal.* The Flow bag plus `simActivityFinal: 'AF'` gives `activityFinal === 'AF'`.
   The control, without the key, gives `undefined`. Killed mutant: the `ROLE_KEYS` pair dropped.
2. *compileNet: the kind-of places of simActivityFinal, null without the role.* `['a', 's']` comes back, with `s` an
   instance of a subclass. The control, without the role, gives `null`. Killed mutant: `activityFinal = null`.
3. *A marked activity final terminates with other tokens alive.* With `activityFinal` and `terminal` both set:
   `{a:1, n:1}` → true, `{n:1}` → false, `{f:1, n:1}` → false, `{f:1}` → true, `{}` → false. Killed mutant: the check
   in `terminated` removed.
4. *Flow C end to end.* Six steps give `Terminated`. The control, the same net without the role, gives `Deadlock`.
   It kills the mutants of 2 and 3 as well.

In the repo they belong in `netCompile.test.ts`, next to «F is null without simTerminal» (tests 1 and 2), and in
`netStep.test.ts` «termination (R-SIM-27)», with an `activityFinal` option in `mkNet` (tests 3 and 4).

`roleCatalog.test.ts` also changes, as lane C1 did for its keys:
- `simActivityFinal` leaves `NEW_KEYS` (`:19`);
- `expect(existing).toHaveLength(23)` (`:68`) becomes 24.

The sketch quotes `'simActivityFinal'` in `netCompile.ts`, so the test «finds none of the new keys in the code»
(`:74-79`) would fail on it. That is read, not run: the test uses `__dirname` and does not run in the `/tmp` bench.

### 2.5 R- rows

- **R-SIM-53** (ratified by Alfonso on 2026-09-25): implemented as written, not amended.
- Point (2) of «Punti aperti chiusi» (`decisions.md:1888`) scheduled the implementation «con la corsia di Accepting e
  degli output». That point was closed by the chat and «restano reversibili», so running G6 on its own is a chat
  decision (§6, item 3), not an RC-26 item.
- **R-SIM-52**: `simActivityFinal` becomes definitive with the code commit that wires it («provvisorie fino al commit
  di codice che le cabla»).

### 2.6 The four demo presets

| Preset | Effect | Why |
|---|---|---|
| State machine | unchanged | the role is `off` in the profile, the binder proposes nothing, the bag has no key, and `activityFinal` is `null`, so `terminated` is today's |
| Extended state machine | unchanged | same |
| Petri net (P/T) | unchanged | the role is `off` (`simProfiles.ts:140`: `active: ['arcWeight', 'inhibitorArc', 'bound', 'terminal', 'guard']`) |
| Flowchart / Activity (script B) | unchanged | `DemoFlowB` has `FinalNode`, bound to Terminal, and no class named like an activity final. The Flow B trace is identical on the sketch [S]. Only the Flow A and C shapes change, `Deadlock` → `Terminated`, which is the fix |

**Estimate:** engine part **full lane**, trigger «more than 3 files»: `netTypes.ts`, `netCompile.ts`, `netStep.ts`,
`netCompile.test.ts`, `netStep.test.ts`, `roleCatalog.test.ts`, plus the comment in `roleCatalog.ts`. About 12 lines
of code and 50 of tests. Panel part: `simRoleStatus.ts`, `SimulationPanel.tsx`, `stcFromRoles.ts`, fast on its own,
with a visual check (a new row in Configure…).

---

## 3. G7 — `else` in fused transitions

### 3.1 Where it lives [R]

- `else` is looked for on plain edges only:
  - `netCompile.ts:259` `const plain = edges.filter(e => e.pseudoSource === null && e.pseudoTarget === null);`;
  - `:262-263` the `else` text read and `isElse.add(e.id)`;
  - `:266` `const kept = resolveElse(transitions, isElse, defects, 'edges share a source');`, called before the
    fusion.
- The fused transitions are pushed after it (`:285-298`). A fork fuses each incoming edge with the outgoing ones:
  - `id` `p` or `p#e`;
  - preset: the incoming edge's sources;
  - `guardSites: [e.id, ...outs]`.

  A join fuses all incoming edges with each outgoing one:
  - preset: the union of the inputs' sources;
  - `guardSites: [...ins, e.id]`.

  So an `else` on a fused edge stays a guard site, and `compileGuards` (`simBridge.ts:144-148`) compiles the text
  `else`. That is the Reset defect `f4 guard (parse error 1:1 Expected expression)` of readiness 2 §4.2.
- The siblings: `siblingKey` (`:132-136`) is the preset places with their weights plus the triggers. That is
  R-SIM-31(1)'s «stesso preset, stessi trigger», and for Petri R-SIM-64's. `resolveElse` takes away every guard site
  of the `else`: `:163` `out.push({ ...t, guardSites: [], elseOf: … })`.
- The step: `netStep.ts:162-164` evaluates an `else` as `elseOutcome` alone and never looks at `t.guardSites`.

### 3.2 Measured [M]

```
Flow A ([else] on f4 d1 → fk):  fk pre=d1 guardSites=[f4,f5,f6] elseOf=null
  run: f1, f2, f3, f2 fired, then no candidate at d1 (count 2) → Deadlock          (readiness 2: the same, at step 4)
Mirror (f3 [else] d1 → work, f4 [count >= 2] d1 → fk):  f3 guardSites=[] elseOf=[]
  at d1, count 2: candidates=[f3,fk], f3 evaluated {"kind":"else","outcome":{"kind":"true"}}
Join in-edge (e2 [else] d1 → jn, e1 [count < 2] d1 → work, r → jn):  jn pre=d1,r guardSites=[e2,e3,e4] elseOf=null
Join out-edge (o1 [count >= 2] jn → x, o2 [else] jn → y):  jn#o2 guardSites=[e1,e2,o2] → defect parse-error
```

The mirror is a new finding. No defect is reported and nothing on screen says the `else` is wrong. The user sees a
choice list at the decision where the guards should leave one branch. It follows from the same line
(`netCompile.ts:266`, siblings drawn from the plain edges only).

### 3.3 The minimal change (sketch, run in `/tmp/p1545/patched/`)

Resolve `else` once, after the fusion, over plain and fused transitions. Recognise it on the fused transition's choice
edge: the edge into a fork, or an edge out of a join. There the fused preset is that edge's own choice, so
`siblingKey` stays as it is. Take away only the `else` edge's site: a fused transition keeps its other edges' guards,
and the step conjoins them after the complement. At the two positions the siblings cannot express (an edge into a
join, an edge out of a fork), name the defect.

```diff
--- netTypes.ts
-    | 'bad-arc' | 'bad-weight' | 'else-twice' | 'initial-over-bound';
+    | 'bad-arc' | 'bad-weight' | 'else-twice' | 'else-position' | 'initial-over-bound';
--- netCompile.ts
-function resolveElse(transitions: readonly NetTransition[], isElse: ReadonlySet<string>, …
+function resolveElse(transitions: readonly NetTransition[], isElse: ReadonlyMap<string, string>, …
 …
-        out.push({ ...t, guardSites: [], elseOf: group.filter(s => s !== t).map(s => s.id) });
+        // Only the `else` edge loses its site: a fused transition keeps its other edges' guards (G7).
+        out.push({ ...t, guardSites: t.guardSites.filter(s => s !== isElse.get(t.id)), elseOf: group.filter(s => s !== t).map(s => s.id) });
 …   (compileControlFlow)
-    // Plain edges, and the `else` among them.
-    const plain = edges.filter(e => e.pseudoSource === null && e.pseudoTarget === null);
-    const isElse = new Set<string>();
+    const saysElse = (edge: string) => {
+        const text = stc.guard ? view.values(edge, stc.guard)[0] : undefined;
+        return typeof text === 'string' && text.trim() === 'else';
+    };
+    // Transition id → its `else` edge: a plain edge itself, a fused transition its choice edge (G7).
+    const isElse = new Map<string, string>();
+
+    // Plain edges.
+    const plain = edges.filter(e => e.pseudoSource === null && e.pseudoTarget === null);
     for (const e of plain) {
-        const text = stc.guard ? view.values(e.id, stc.guard)[0] : undefined;
-        if (typeof text === 'string' && text.trim() === 'else') isElse.add(e.id);
+        if (saysElse(e.id)) isElse.set(e.id, e.id);
         transitions.push(make(e.id, [e.id], e.sources, e.targets, triggersOf(e.id), [e.id]));
     }
-    const kept = resolveElse(transitions, isElse, defects, 'edges share a source');
 …   (in the loop over the pseudo nodes, before the three fusion branches)
+        // An `else` chooses on the edge into a fork or on an edge out of a join; elsewhere its siblings are undefined (G7).
+        const stray = (fork && !join ? outs : join && !fork ? ins : [...ins, ...outs]).find(e => saysElse(e.id));
+        if (stray) {
+            defects.push({ element: stray.id, code: 'else-position', message: `else on an edge ${stray.pseudoTarget === p ? 'into' : 'out of'} a ${fork && !join ? 'fork' : join && !fork ? 'join' : 'fork/join'}: it has no siblings` });
+            continue;
+        }
         if (fork && !join) {
             for (const e of ins) {
-                kept.push(make(ins.length === 1 ? p : `${p}#${e.id}`, …
+                const id = ins.length === 1 ? p : `${p}#${e.id}`;
+                if (saysElse(e.id)) isElse.set(id, e.id);
+                transitions.push(make(id, …
         } else if (join && !fork) {
             for (const e of outs) {
-                kept.push(make(outs.length === 1 ? p : `${p}#${e.id}`, …
+                const id = outs.length === 1 ? p : `${p}#${e.id}`;
+                if (saysElse(e.id)) isElse.set(id, e.id);
+                transitions.push(make(id, …
         } else {
-            kept.push(make(p, …
+            transitions.push(make(p, …
         }
     }
-    return { places, transitions: kept };
+    // The `else` among plain and fused transitions alike (R-SIM-31, G7).
+    return { places, transitions: resolveElse(transitions, isElse, defects, 'edges share a source') };
 …   (compilePetri: a Map instead of a Set, one entry t → t; behaviour unchanged)
-    const isElse = new Set<string>();
+    const isElse = new Map<string, string>();
-        if (typeof text === 'string' && text.trim() === 'else') isElse.add(t);
+        if (typeof text === 'string' && text.trim() === 'else') isElse.set(t, t);
--- netStep.ts (candidates)
         if (t.elseOf !== null) {
-            g = elseOutcome(net, t, event, access, guards);
-            evaluated.push({ transition: t.id, outcome: { kind: 'else', outcome: g } });
+            const e = elseOutcome(net, t, event, access, guards);
+            // A fused `else` keeps its other edges' guards (G7): the complement first, then their conjunction.
+            g = e.kind === 'true' ? guardOf(t, event, access, guards) : e;
+            evaluated.push({ transition: t.id, outcome: e.kind === 'true' && g.kind !== 'true' ? g : { kind: 'else', outcome: e } });
         } else {
```

- **Plain edges and Petri transitions are unchanged.** Their `else` has `guardSites` `[t.id]`, and the filter leaves
  `[]` as before, so `guardOf` over no site is `true` and the step is today's.
- **The order of transitions is unchanged**: plain edges first, then fused ones. The only difference is the order of
  defects, when an `else-twice` and a fusion defect occur in the same model.
- **The bridge needs no change.** When the complement holds and another edge's guard fails, the evaluation entry is
  that plain guard outcome. `blocked` (`simBridge.ts:698-716`) then takes its site-by-site path over `t.guardSites`,
  which no longer holds the `else` edge, and names the failing edge (read). `compileGuards` never sees the `else`
  text.
- **Rule 11:** `else-position` is one more literal of the exported union `NetDefectCode`, additive, as R-SIM-70
  authorised for `CompileDefect`.

**What it gives [S]:**

```
Flow A:        fk pre=d1 guardSites=[f5,f6] elseOf=["f3"], no defect; f1, f2, f3, f2, fk, jn → Terminated (6 steps, as Flow B)
Mirror:        f3 guardSites=[] elseOf=["fk"]; at d1, count 2: candidates=[fk], f3 {"kind":"else","outcome":{"kind":"false"}}
Join out-edge: jn#o2 guardSites=[e1,e2] elseOf=["jn#o1"]; count 0: candidates=[jn#o2]
Join in-edge:  defect ['e2','else-position']; e0, e1 compile, the join does not
```

### 3.4 Tests (run as `/tmp/p1545/g6g7.test.ts`, red 5/5 on the tree, green 5/5 on the sketch)

1. *else on the edge into a fork.* `fk.elseOf` `['f3']`, `fk.guardSites` `['f5', 'f6']`, no defect. At count 1 the
   candidates are `['f3']`, at count 2 `['fk']`. Killed mutants: the fork's in-edge not marked; `guardSites: []`
   restored; else resolved among plain edges only.
2. *The fused else keeps its other edges' guards.* `f5` guard false, count 2: no candidate, and the evaluation of `fk`
   is `{ kind: 'false' }`. Killed mutants: no conjunction (`g = e`); the evaluation entry always `else`; the fork's
   in-edge not marked.
3. *Mirror.* `f3.elseOf` `['fk']`. At count 2 the candidates are `['fk']`, at count 1 `['f3']`. Killed mutant: else
   resolved among plain edges only, today's placement.
4. *else on a join's outgoing edge.* `jn#o2.elseOf` `['jn#o1']`, `guardSites` `['e1', 'e2']`. The candidates are
   `['jn#o2']` at count 0 and `['jn#o1']` at count 2. Killed mutants: the join's out-edge not marked;
   `guardSites: []`.
5. *else into a join or out of a fork is else-position.* The defects are `[['e2', 'else-position']]` and only `e0`,
   `e1` compile. The control is the same net with an explicit guard: no defect, and `jn` compiles. Out of a fork:
   `[['f5', 'else-position']]`. Killed mutant: the position check removed.

Recommended in Phase 2, with no run here: a bridge test in `simBridge.test.ts` for Flow A with a false guard on
`f5`. `stopReason` names `f5`, not «else, a sibling is true». In the repo, tests 1, 3, 4 and 5 go in
`netCompile.test.ts` beside «R-SIM-31 else» and the fusion tests. Test 2 goes in `netStep.test.ts` «else (R-SIM-25,
R-SIM-31)», or both go in `netStep.test.ts` through `compileSpec`.

### 3.5 R- rows

- **R-SIM-31(1)** (ratified): implemented for fused transitions with its siblings as written, not amended. The
  complement is still «la negazione della disgiunzione delle guardie dei fratelli (stesso preset, stessi trigger)».
  The other edges' guards conjoin by R-SIM-17 (a fused transition's guard is the conjunction of its sites).
- **R-SIM-64** (Petri): unchanged, and `compilePetri` behaves the same.
- **An `else` into a join** could only be supported by amending R-SIM-31(1): the siblings would be read on the edge
  (the `else` edge's own sources and triggers), not on the fused preset. That is an RC-26 item (decision B, §7), and
  the sketch names it with a defect instead.

### 3.6 The four demo presets

| Preset | Effect | Why |
|---|---|---|
| State machine | unchanged | no fork or join, and no `else` in the script; `resolveElse` gets the same plain transitions |
| Extended state machine | unchanged | same; `tp`'s guard is `model.[paid]` |
| Petri net (P/T) | unchanged | `compilePetri`: a Set becomes a Map with the same content, and `guardSites` filtered to `[]` as before. The R-SIM-64 tests are green on the sketch [S] |
| Flowchart / Activity (script B) | unchanged | no `else`: the same transitions in the same order, and the trace is identical [S]. Flow A (`[else]` into the fork) now reaches `Terminated` in 6 steps [S], so decision E's second constraint can go |

**Estimate:** **full lane**, trigger «more than 3 files»: `netTypes.ts`, `netCompile.ts`, `netStep.ts`,
`netCompile.test.ts`, `netStep.test.ts`, and optionally `simBridge.test.ts`. About 35 lines of code and 80 of tests. No
visual check is owed by the engine itself. The chat's checklist can re-run the readiness Flow A, B and C probes: A and
C reach `Terminated` in 6 steps, and B is unchanged.

---

## 4. G12 — the Bound proposal is a lower bound

### 4.1 Where it lives [R]

- The value is `largestInitialMarking` (`modelMarkings.ts:27-42`), the largest `simInitialMarking` slot over the
  places of the metamodel's M1 models.
- The panel computes it inside a selector: `SimulationPanel.tsx:515-516`
  `const largestMarking = useSelector((state: DState) => (open && configModelId && markingInputs`
  / `? largestInitialMarking((state as any)?.idlookup ?? {}, configModelId, markingInputs.node, markingInputs.initialMarking)`.
  So it runs on every store change while the panel is open, a proposal is pending, and Bound is `edit` and unset
  (`boundProposalInputs`, `simRoleStatus.ts:289-301`).
- The proposal is made only when the value is above 1, `simRoleStatus.ts:272`
  `if (typeof largestMarking === 'number' && largestMarking > 1) {`, with the reason at `:259`
  `const BOUND_WHY = 'The largest initial marking on the models of this metamodel';`.
- The engine halts `unsafe` rather than saturating (R-SIM-23, `netStep.ts:237-238`). So a proposal below the
  reachable maximum turns into a halt, as readiness 2 run A measured.

### 4.2 The two options, measured on five nets [M] (`/tmp/p1545/probe.ts`, exit 0)

| Net | today | (a) | (b) | true maximum |
|---|---|---|---|---|
| demo net (script §2.2: `p1` 2, `lock` 1, `t1` → `p2` ×2, `t2` ×2 → `p3`, inhibitor `lock` → `t2`) | 2 | 4 | 4, exhaustive, 9 markings, 0.29 ms | 4 (`p2` after `t1` twice) |
| merge: `p1` 2 and `p2` 2 each feed `p3` | 2 | **2** | 4, exhaustive, 9 markings | 4 |
| chain: `p1` 1 → `p2` ×3 → `p3` ×3 | 1 | **3** | 9, exhaustive, 5 markings | 9 |
| heavy input: `p1` 5, in-weight 5, `p2` ×2 | 5 | **10** | 5, exhaustive, 2 markings | 5 |
| self-feeding loop: `p1` 1 → `t1` → `p1` ×2 | 1 | 2 | `unbounded: true` after 1 marking | none (R-SIM-26 excludes unbounded nets) |

**(a) One-step multiplication:** the largest initial marking times the largest weight of an arc into a place.
- **Cost.** O(arcs), in `modelMarkings.ts`. `boundProposalInputs` would also return Arc, Arc target, Arc weight and
  Transition. About 20 lines plus tests, in 4 files (`modelMarkings.ts`, its test, `simRoleStatus.ts`,
  `SimulationPanel.tsx`), full lane by count.
- **What it gives.** No guarantee in either direction. It is right on the demo net only because the net has one
  ×2 arc and one input place. It undershoots on the two most common shapes, a merge and a chain, where the run
  would still halt `unsafe`. It overshoots when an input weight is large.

**(b) Bounded exploration of the reachable markings.** A breadth-first search from the initial marking of each model:
- the net is compiled by the engine's own `compileNet`, with the bound lifted;
- guards and triggers are ignored, and inhibitors and termination kept;
- a cap on the markings (about 2000);
- the Karp-Miller check on the path (a marking that strictly covers an ancestor means unbounded).

When it closes, its maximum is an upper bound for every run. Ignoring guards and triggers only adds behaviour, so the
proposed k can never be the cause of an `unsafe` halt. When it does not close (the cap, or unboundedness), the
proposal falls back to today's value with a reason that says so. That is never worse than today.
- **Cost.** One pure function in `model/simulation/`, next to `netStep.ts`: about 60 lines, reusing the enabling and
  firing rules (`fireMarking` is private today, so it is exported or its 6 lines are repeated). A helper in
  `modelMarkings.ts` compiles each model of the metamodel from the bag as Apply would leave it. The Bound reason
  becomes two texts in `simRoleStatus.ts`. The panel wiring moves out of the `useSelector` into a memo keyed by a
  signature of the models, the content `runSignature` already builds (0.05 ms on a 278-entry lookup, readiness 2
  §6).
- **Files.** 6 or 7: the new module and its test, `modelMarkings.ts` and its test, `simRoleStatus.ts` (and its
  test), `SimulationPanel.tsx`. Full lane, with a visual check on the proposal's title.

**Recommended: (b).** The proposal exists so that Apply alone gives a run that does not halt on a bound the user did
not choose (R-SIM-81). Only (b) holds for the next net, not just this one: on the two shapes where (a) fails, the run
halts exactly as run A did. The performance cost is bounded by the cap, and the preview window is short (the
proposal stops once `simBound` is written). The wiring cost is the one real cost, and (a) pays most of it too (new
inputs through `boundProposalInputs`). Where guards restrict reachability, (b) may propose a larger k than needed. That
widens only the future `.smv` domain (R-SIM-23), never the run's behaviour.

### 4.3 Tests for (b) (names and assertions; none run as tests here)

1. *The demo net gives 4, exhaustive* (the net of the script §2.2).
2. *A merge of two places of 2 gives 4.* Kills the largest initial marking.
3. *A chain ×3 then ×3 gives 9.* Kills a one-step multiplication, which is (a).
4. *Inhibitors and termination are kept, guards ignored.* A producer blocked by an inhibitor adds nothing, and a
   guard does not lower the bound.
5. *An unbounded net is not exhaustive.* The proposal is the largest initial marking, with the lower-bound reason.
   Kills a missing domination check (it would hit the cap with the other reason).
6. *The cap stops the exploration and says so.*
7. The existing «Bound from the models» tests of `simRoleStatus.test.ts:372-421` keep their assertions: no proposal
   at ≤ 1, never over a set Bound, none on control-flow presets.

### 4.4 R- rows and the demo

- **R-SIM-81(1)** (ratified by Alfonso on 2026-09-27 11:00: «le righe qui sotto non sono provvisorie») reads «Apply
  propone `simBound` = massimo marking iniziale». Both options amend it, so this is decision A (§7).
- **Decision H** stays for the demo: Bound = 4 by hand. Nothing here reaches the trunk before 2026-10-04.
- The four presets:
  - **Petri net (P/T)** changes. The proposals read `Bound → 4`, with a new reason in the title. Step 3 of the
    script (Configure…, Bound 2 → 4) becomes redundant, and its «Say» line («Apply proposes 2») false. That is after
    MODELS.
  - **Flowchart, State machine, Extended state machine** are unchanged: Bound is derived, k = 1, and no proposal is
    made (`simRoleStatus.test.ts:413`).

**Estimate:** (b) full lane, trigger «more than 3 files», with a visual check. (a) full lane by count as well, smaller.

---

## 5. Cross-cutting risks and the recommended Phase 2 order

### 5.1 Risks

1. **Stale keys become live.** The engine reads the bag whatever the profile's modes (R-SIM-78, D4: «il motore
   legge il bag come oggi»). After G6, a `simActivityFinal` left by an earlier Flowchart Apply ends runs under
   another profile. `simTerminal` behaves the same today. The G6 panel row makes the key visible and clearable; the
   resolver that skips `off` keys is still deferred.
2. **G6 and G7 edit the same three engine files.** They go in one lane, as two code commits, never in two parallel
   lanes.
3. **A source-text test pins G6's key as unread** (`roleCatalog.test.ts:74-79`). Updating it is part of G6's
   declared scope, as it was for lane C1's keys.
4. **The explanation of a fused `else` has no test today.** It was read, not run (§3.3), and the proposed bridge test
   covers it. `simBridge.test.ts` is 65/65 on the sketch because no test reaches that path.
5. **G12(b) must leave the `useSelector`.** An exploration on every store change is the risk; a memo keyed by a
   signature, with the cap, removes it.
6. **The demo script and the readiness probes become history.** E1 lifts decision E's two constraints, and E2 makes
   decision H's step redundant. The script is the rehearsal of 2026-10-04, not a spec, so it is not updated by these
   lanes.
7. **Rule 11.** Only optional properties (`NetStc.activityFinal`, `CompiledNet.activityFinal`) and one union literal
   (`else-position`) are added. No consumer outside the lane breaks: `CompiledNet` is built only by `compileNet` and by
   test helpers.
8. **No critical-zone file, no Layer Impact Report.** The canvas reads only `isSimActive`
   (`nodes/ObjectNode.tsx:40`), the marking, not transitions or termination: `command grep -rln` for `getSimRun`,
   `CompiledNet`, `netRunStatus`, `.elseOf` exits 0 with hits under `sim/` and `model/simulation/` only, and the
   run-state importers outside `sim/` read `isSimActive` or describe it in comments.

### 5.2 Recommended Phase 2 order

1. **E1, from 2026-10-05, unattended** (no RC-26 item).
   - Scope: G6 engine, then G7, two code commits on one branch.
   - Files: `netTypes.ts`, `netCompile.ts`, `netStep.ts`, `netCompile.test.ts`, `netStep.test.ts`,
     `roleCatalog.test.ts`, the comment in `roleCatalog.ts`, and optionally `simBridge.test.ts`.
   - Lane: full, trigger «more than 3 files».
   - Gates: typecheck on the 14 baseline errors, vitest with the new tests red first, build, and a mutation bench on
     the ten mutants of §9.
   - Checklist: the readiness Flow A, B and C probes.
2. **E2, after Alfonso's answer to A.**
   - Scope: the G6 panel row (`simRoleStatus.ts`, `SimulationPanel.tsx`, `stcFromRoles.ts`) and G12(b)
     (the new module, `modelMarkings.ts`, `simRoleStatus.ts`, `SimulationPanel.tsx`, tests).
   - Lane: full, with a visual checklist: the row in Configure… General, and `Bound → 4` with its title on the demo
     net.
   - If A is refused, E2 is the panel row alone, a fast lane.
3. **B** (an `else` into a join) only if Alfonso asks for it. The defect of E1 names the case in the meantime.

E1 first: it carries no pending decision, it closes the two engine gaps decision E put after MODELS, and E2's
exploration compiles nets with E1's engine.

---

## 6. Decisions taken (unattended)

1. **Measured, not only read.** The three gaps were run on this tree's engine from `/tmp`. The sketches of §2.3 and
   §3.3 were applied to copies of three files and run against the existing suites through a small stand-in for vitest.
   A first setup, a `/tmp` mirror with symlinks into the tree, was refused by the permission layer and not retried.
   The stand-in's controls: 0 tests collected on its first two runs (a bench fault, fixed); then identical counts on
   the tree and on the sketch. Its three remaining reds are missing matchers (`toBeTypeOf`, `toBeLessThan`,
   `expect.arrayContaining`), identical on both sides. The suite `roleCatalog.test.ts` does not run there
   (`__dirname`).
2. **G7 is scoped to R-SIM-31(1)'s siblings as written.** It covers the edge into a fork, the edge out of a join and
   the mirror. The other two positions are the defect `else-position`, not a new sibling rule.
3. **G6 goes without the Accepting and outputs lane.** The closure point that paired them was the chat's and is
   reversible (§2.5).
4. **G6's panel row goes to E2**, with G12, since both edit `simRoleStatus.ts` and `SimulationPanel.tsx`. It stays out
   of E1, which touches engine files only.
5. **G12: (b) recommended over (a)** (§4.2).
6. **`else-position` is a new union literal**, additive under Rule 11, with R-SIM-70's precedent.
7. RC-27 is not triggered: neither choice picks between data models or changes more than one exported interface in a
   breaking way.

---

## 7. Decisions awaiting Alfonso (RC-26)

- **A. Amend R-SIM-81(1):** Apply proposes Bound from a bounded exploration of the reachable markings, guards aside
  (option (b)), instead of the largest initial marking. It is proposed only when the value is above 1. When the
  exploration does not close, the proposal is today's value with a reason that says so. After MODELS; decision H
  unchanged for the demo. Recommended: yes, option (b).
- **B. Amend R-SIM-31(1) for an `else` into a join:** siblings read on the `else` edge (its own sources and
  triggers), not on the fused preset. Recommended: no for now. The defect `else-position` of E1 names the case, and
  the explicit complement works.

---

**Answered by Alfonso, 2026-09-27 16:05 (in chat, C-2026-09-27-1437):** A yes (R-SIM-81(1) is amended to option (b), applied in lane E2 after MODELS; decision H stands for the demo); B no (R-SIM-31(1) unchanged, `else-position` names the case in E1).

## 8. Files read

Full paths under `/Users/alfonso/jjodel-icons/`.

**Docs:**
- `CLAUDE.md`: whole.
- `docs/PROTOCOL.md`: whole.
- `docs/decisions.md`:
  - `:1-30` (RC-3), `:105-135` (RC-15..19), `:185-235` (RC-25..30);
  - `:1590-1690` (R-SIM-21..33), `:1828-2140` (R-SIM-47..82).
- `docs/discovery/discovery_2026-09-27_sim_demo_readiness_2.md`: whole.
- `docs/demo/models_2026_simulator_demo.md`: whole.
- `docs/log-inbox/simulation.md`: whole headings, and `:1-40`, `:131-144`.
- `docs/claude-code-log.md`: `:1-80`.
- `docs/prompts/claude_2026-09-27_1545_prompt_discovery_sim_post_models_engine.md`: whole.

**Engine** (`frontend/src/model/simulation/`):
- whole: `netTypes.ts`, `netCompile.ts`, `netStep.ts`, `roleCatalog.ts`, `stcFromRoles.ts`, `simProfiles.ts`
  (`:1-310`);
- by window: `profileBinder.ts` `:150-260`, `guardEvaluator.ts` exports, `jjel/stateReserved.ts`.

**Bridge and panel** (`frontend/src/components/editor-v2/sim/`):
- `simRoleStatus.ts`: whole.
- `modelMarkings.ts`: whole.
- `simBridge.ts`: `:60-170`, `:320-440`, `:660-740`, and grep of its exports.
- `SimulationPanel.tsx`: `:180-200`, `:490-560`, `:1115-1130`, and grep of `ROLE_SPECS` and `largestInitialMarking`.
- `simRunState.ts`: grep of its exports.
- `nodes/ObjectNode.tsx:40`.

**Tests:**
- `model/simulation/__tests__/netCompile.test.ts`: `:1-66`, `:200-335`, `:456-481`.
- `netStep.test.ts`: `:1-121`, `:269-290`, `:364-400`, `:420-460`.
- `roleCatalog.test.ts`: `:1-80`.
- `sim/__tests__/simRoleStatus.test.ts`: grep of `Bound` and `ROLE_SPECS`.
- `modelMarkings.test.ts`: grep of the test names.

**Rules:**
- `frontend/src/components/editor-v2/CLAUDE.md` and `frontend/src/model/CLAUDE.md`: grep of `sim` (one unrelated
  hit, none about the simulator).

---

## 9. Probes

All are in `/tmp/p1545/`, outside every tree, and not committed. They are bundled with
`frontend/node_modules/.bin/esbuild` and run with `node` v22.23.3. `git status` was empty after each.

| Probe | What | Exit | Log |
|---|---|---|---|
| `probe.ts` → `probe.mjs` | G6 Flow C and Flow B, G7 Flow A, mirror, join in and out, G12 five nets with (a) and (b), on the tree | 0 | `probe.log` |
| `probebuild.mjs`, `ENGINE=patched` → `probe_patched.mjs` | the same scenarios on the sketch | 0 | `probe_patched.log` (Flow B section identical to `probe.log`) |
| `patch.mjs` | applies §2.3 and §3.3 to `patched/netCompile.ts`, `netStep.ts`, `netTypes.ts` (copies) | 0 | `netCompile.diff`, `netStep.diff`, `netTypes.diff` |
| `bench.mjs` + `vshim.ts` | the existing suites on the tree and on `ENGINE=<dir>` | see below | `b_*_0.log` (tree), `b_*_1.log` (sketch) |
| `g6g7.test.ts` | the nine proposed tests | 9 on the tree (9 failed), 0 on the sketch | stdout |
| `mutants.mjs` | ten single-point mutants of the sketch in `mut/<name>/` | 0 | `mutants.log` |

**Existing suites** (tree / sketch):
- `netCompile` 48/48 and 48/48;
- `netStep` 43/43 and 43/43;
- `netParity` 35/35 and 35/35;
- `events` 29/29 and 29/29;
- `simBridge` 65/65 and 65/65;
- `simRunState` 8/8, `metamodelSketch` 6/6 and `modelMarkings` 6/6 on both;
- `simRoleStatus` 38/39 and 38/39: the red is the stand-in's missing `expect.arrayContaining`.

The sentinel `else-position` / `activityFinal.has` appears 0 times in the tree bundles and 2 times in the sketch
bundles, so the sketch was the code under test.

**Mutation bench:**

| Mutant | killed by the proposed tests | killed by the existing 155 |
|---|---|---|
| M1 the `ROLE_KEYS` pair dropped | G6-1 | 0 |
| M2 the `terminated` check off | G6-3, G6-4 | 0 |
| M3 `activityFinal = null` | G6-2, G6-3, G6-4 | 0 |
| M4 `guardSites: []` restored | G7-1, G7-2, G7-4 | 0 |
| M5 no conjunction after the complement | G7-2 | 0 |
| M6 the fork's in-edge not marked | G7-1, G7-2 | 0 |
| M7 else resolved among plain edges only | G7-1, G7-2, G7-3, G7-4 | 0 |
| M8 the position check off | G7-5 | 0 |
| M9 the join's out-edge not marked | G7-4 | 0 |
| M10 the evaluation entry always `else` | G7-2 | 0 |

10 of 10 killed; the existing suites stay green on every mutant, which is why the new tests are owed.
