# Prompt: merge sim-multi-roles into alfonso-frontend-jjtl

Prompt-ID: P-2026-09-30-1518
Chat: —
Lane: full (merge; 1 conflict: `docs/log-inbox/simulation.md` measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-30-1518 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `9e2441595`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `sim-multi-roles` into the trunk with one merge commit, `--no-ff`, of the explicit sha `e052ea399`, in the shape of `e7dec63bb` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `fb044365b`. The branch carries, on top of the base, 2 commits:

- `e052ea399` docs: discovery R-SIM-90, multi-valued Data roles (P-2026-09-28-2306)
- `d73f17383` docs(prompts): P-2026-09-28-2306 discovery sim-multi-roles (R-SIM-90)

The trunk carries, since the base, 270 commits:

- `9e2441595` docs: Status flip and log entry for the ir-edge-ports merge (P-2026-09-30-1509)
- `e7dec63bb` merge: ir-edge-ports into alfonso-frontend-jjtl (P-2026-09-30-1509)
- `2047b4de5` docs: add prompt P-2026-09-30-1509, merge ir-edge-ports into alfonso-frontend-jjtl
- `cab8a535d` docs: Status flips for three executed prompts of 2026-09-18
- `9838c48c0` docs: close the ir-freeze-disc merge by hand, Status and entry (P-2026-09-30-1104)
- `d8f7be824` merge: ir-freeze-disc into alfonso-frontend-jjtl (P-2026-09-30-1104)
- `3ceceb387` docs: add prompt P-2026-09-30-1104, merge ir-freeze-disc into alfonso-frontend-jjtl
- `fb8944688` docs: close C3 without code, ticket freeHandleIndex (P-2026-09-29-2351)
- `f83d6bc81` docs: C3 reproduction, IR edge ports hypothesis falsified (P-2026-09-29-2351)
- `bc1a3f171` docs: add prompt P-2026-09-29-2351, slice C3 ports of IR edges
- `62f4ac3fc` docs: Status flip and log entry for the railsystem-leftovers merge (P-2026-09-29-2302)
- `e42e5d7f5` merge: railsystem-leftovers into alfonso-frontend-jjtl (P-2026-09-29-2302)
- `6342f87e3` docs: add prompt P-2026-09-29-2302, merge railsystem-leftovers into alfonso-frontend-jjtl
- `5555a3619` docs: closure of the railSystem SymbolCard leftovers, entry and Status (P-2026-09-29-2253)
- `26b29ae57` style(editors): drop SymbolCard leftovers in railSystem.scss (P-2026-09-29-2253)
- `c82b6c476` docs: add prompt P-2026-09-29-2253, railSystem SymbolCard leftovers
- `313a84663` docs: ratify flat collapsed fields, R-IRN-37 and IR spec v1.2 §8
- `8911a7ae8` docs: Status flip and log entry for the ir-collapsed-render merge (P-2026-09-29-2243)
- `889906e43` merge: ir-collapsed-render into alfonso-frontend-jjtl (P-2026-09-29-2243)
- `a4ad1dac8` docs: add prompt P-2026-09-29-2243, merge ir-collapsed-render into alfonso-frontend-jjtl
- `cf8c031f6` docs: Status flip and log entry for the no-proxy-ir merge (P-2026-09-29-2158)
- `f601f70ff` docs: closure of the collapsed render lane, entry and Status (P-2026-09-29-2122)
- `3573b0029` merge: no-proxy-ir into alfonso-frontend-jjtl (P-2026-09-29-2158)
- `e06e7aa1f` docs: add prompt P-2026-09-29-2158, merge no-proxy-ir into alfonso-frontend-jjtl
- `61a45540e` fix(ir): corner badges on SVG forms, derived size dropped on expand (P-2026-09-29-2122)
- `18ec08e9b` docs: log entry, ticket and Status for F1 no-proxy IR (P-2026-09-29-2121)
- `4784837e3` docs: LIR addendum, badge inline and derived size drop (P-2026-09-29-2122)
- `719703ef6` fix(ir): never store an L-proxy inside a view IR (P-2026-09-29-2121)
- `591504f57` docs: Status flip and log entry for the live-save merge (P-2026-09-29-2140)
- `e2e2195c6` docs: Layer Impact Report for F1, no L-proxy inside a view IR (P-2026-09-29-2121)
- `9ef223452` merge: live-save into alfonso-frontend-jjtl (P-2026-09-29-2140)
- `d6e9b8486` docs: probe results for the collapsed render, two defects (P-2026-09-29-2122)
- `62badb2b2` docs: add prompt P-2026-09-29-2140, merge live-save into alfonso-frontend-jjtl
- `d15c657c7` docs: log entry, counters ticket and Status for live save (P-2026-09-29-2120)
- `041373870` fix(persistence): save the live project on Cmd+S (P-2026-09-29-2120)
- `04acac227` feat(ir): render the declared collapsed form, fill and badge (P-2026-09-29-2122)
- `d6dff9e78` docs: Layer Impact Report, collapsed graphVertex render (P-2026-09-29-2122)
- `8dbb031d1` docs: add prompt P-2026-09-29-2122, F3, render the collapsed graphVertex
- `361eadedd` docs: add prompt P-2026-09-29-2121, F1, no L-proxy inside a view IR
- `1625e8c28` docs: add prompt P-2026-09-29-2120, F2, save the live project on Cmd+S
- and 230 more: `git log --oneline fb044365b..9e2441595`

Measured by `lane-run merge` at 2026-09-30 15:18, trunk at `9e2441595`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl e052ea399`: 1 conflict: `docs/log-inbox/simulation.md`.
- Files changed since the base: 3 on the branch side, 198 on the trunk side; on both sides: `docs/log-inbox/simulation.md`.
- `git diff --name-only fb044365b e052ea399 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-09-28_2306_prompt_discovery_sim_multi_roles.md` (eseguito 2026-09-28 · lane sim-multi-roles · discovery measured on d73f17383; the report is in the commit that carries this line (a commit cannot name its own sha)).
- `git worktree list`: `sim-multi-roles` in `/Users/alfonso/jjodel-w-multi`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-09-30-1518/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `e052ea399` is the tip of `sim-multi-roles`; the prompt files of the branch read `Status: eseguito` at `e052ea399`; `git worktree list` shows `sim-multi-roles` only in `/Users/alfonso/jjodel-w-multi`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl e052ea399` (measured above: 1 conflict: `docs/log-inbox/simulation.md`). `git diff --name-only fb044365b e052ea399 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only fb044365b alfonso-frontend-jjtl` with `git diff --name-only fb044365b e052ea399` (measured above: `docs/log-inbox/simulation.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `RC-29` (trunk), `RC-30` (trunk), `R-EDGE-1` (trunk), `R-EDGE-2` (trunk), `R-EDGE-3` (trunk), `R-IRN-37` (trunk), `R-SIM-68` (trunk), `R-SIM-69` (trunk), `R-SIM-70` (trunk), `R-SIM-71` (trunk), `R-SIM-72` (trunk), `R-SIM-73` (trunk), `R-SIM-74` (trunk), `R-SIM-75` (trunk), `R-SIM-76` (trunk), `R-SIM-77` (trunk), `R-SIM-78` (trunk), `R-SIM-79` (trunk), `R-SIM-83` (trunk), `R-SIM-84` (trunk), `R-SIM-86` (trunk), `R-SIM-91` (trunk), `R-SIM-92` (trunk), `R-SIM-93` (trunk), `R-SIM-94` (trunk), `R-SIM-95` (trunk), `R-SIM-96` (trunk), `R-SIM-97` (trunk), `R-SIM-98` (trunk), `R-SIM-99` (trunk), `R-SIM-100` (trunk), `R-SIM-101` (trunk), `R-VP-15` (trunk), `R-VP-16` (trunk), `R-VP-17` (trunk), `R-VP-18` (trunk); control: `- **R-VP-19**` none.
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-28 — discovery: Entry, Exit, Action and Guard multi-valued, R-SIM-90 (P-2026-09-28-2306)` once (branch).
   - `docs/decisions.md`: the heading `### Decisioni 2026-09-27: corsia S4, Accepting e output nel motore (R-SIM-91..93)` once (trunk).
   - `docs/decisions.md`: the heading `### Decisions 2026-09-29 (night): the globals of a system live in its model (R-SIM-94)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-09-28 — fix: the six known vitest reds and the known-repairs list of check:addonly (P-2026-09-28-2332)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-09-29 — fix: light tier runs claude-sonnet-5-5, RC-32 (P-2026-09-28-2332)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-09-29 — merge: harness-reds-repairs into alfonso-frontend-jjtl (P-2026-09-29-0029)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-09-29 — discovery: trace monitor stage 2, REQ files and the T6 rules (P-2026-09-29-0404)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-09-29 — merge: trace-stage2-disc into alfonso-frontend-jjtl (P-2026-09-29-0438)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-09-29 — fix: raise the vitest testTimeout to 15000ms (P-2026-09-29-1306)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-09-29 — merge: vitest-timeout into alfonso-frontend-jjtl (P-2026-09-29-1322)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-28 — discovery: four demo scenes read identical after the staging merge (P-2026-09-28-1025)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-28 — merge: scenes-base into alfonso-frontend-jjtl (P-2026-09-28-2333)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-27 — discovery: Moore/Mealy outputs and Accepting, S4 (P-2026-09-27-1725)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-27 — feat: the engine reads Accepting and the role-bound outputs, S4 engine slice (P-2026-09-27-1725)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-27 — docs: provisional R-SIM-86..88 for the outputs engine slice (P-2026-09-27-1725)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-28 — merge: alfonso-frontend-jjtl into sim-outputs-accepting (P-2026-09-28-2305)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-28 — merge: sim-outputs-accepting into alfonso-frontend-jjtl (P-2026-09-28-2343)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-29 — feat: Entry, Exit, Action and Guard multi-valued, R-SIM-90 Phase 2 (P-2026-09-29-0010)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-29 — ticket: the problems dedup reads only the first Guard or Action attribute` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-29 — merge: sim-multi-roles-p2 into alfonso-frontend-jjtl (P-2026-09-29-0105)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-29 — feat: the globals of a system declared in its model, R-SIM-94 Phase 2 (P-2026-09-29-0110)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-29 — merge: sim-data-level-p2 into alfonso-frontend-jjtl (P-2026-09-29-0214)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-29 — docs: the demo script declares data on the model tab, metamodel path as fallback (P-2026-09-29-0219)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-29 — merge: demo-script-data-level into alfonso-frontend-jjtl (P-2026-09-29-0238)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-29 — discovery: the faces of Accepting and outputs, their M2 rows, the four hidden presets (P-2026-09-29-0239)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-29 — feat: DFA, NFA, Moore, Mealy in the selects; the faces of Accepting and outputs (P-2026-09-29-0300)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-29 — merge: sim-outputs-faces into alfonso-frontend-jjtl (P-2026-09-29-0348)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-29 — fix: the low UI tickets of the simulator, four fixed, one question (P-2026-09-29-0356)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-29 — merge: sim-ui-tickets into alfonso-frontend-jjtl (P-2026-09-29-0425)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-29 — discovery: a reported false deadlock on a DemoPetri-like net is the guard (P-2026-09-29-0955)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-29 — merge: petri-deadlock-disc into alfonso-frontend-jjtl (P-2026-09-29-1030)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-29 — fix: the deadlock reason names the guard, R-SIM-96 (P-2026-09-29-1022)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-29 — merge: sim-guard-word into alfonso-frontend-jjtl (P-2026-09-29-1045)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-29 — feat: the pill behind Advanced and a Semantic type, Jjodie aligned, R-SIM-97 (P-2026-09-29-1106)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-29 — ticket: the Problems producer does not follow the pill's gate` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-29 — ticket: an undo does not restore a key removed from a state bag` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-29 — merge: sim-gate into alfonso-frontend-jjtl (P-2026-09-29-1200)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-29 — discovery: the Simulation pill behind Advanced and a Semantic type, Jjodie placement (P-2026-09-29-1040)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-29 — merge: sim-gate-disc into alfonso-frontend-jjtl (P-2026-09-29-1209)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-29 — feat: the choice list is a nondeterministic choice, R-SIM-98 (P-2026-09-29-1221)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-29 — merge: sim-nondet-label into alfonso-frontend-jjtl (P-2026-09-29-1239)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-29 — feat: the Simulation toggle of Semantic Type Class gates the pill, R-SIM-99 (P-2026-09-29-1225)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-29 — merge: sim-toggle into alfonso-frontend-jjtl (P-2026-09-29-1319)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-29 — discovery: random resolution of nondeterminism, Random button and Ask | Random policy (P-2026-09-29-1700)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-29 — merge: sim-random-disc into alfonso-frontend-jjtl (P-2026-09-29-1832)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-29 — feat: Random on an ε choice, a seeded draw, the minimal trace, R-SIM-100 (P-2026-09-29-1840)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-29 — merge: sim-random-l1 into alfonso-frontend-jjtl (P-2026-09-29-1933)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-29 — feat: the Ask | Random run policy and Play, R-SIM-101 (P-2026-09-29-1943)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-29 — merge: sim-random-l2 into alfonso-frontend-jjtl (P-2026-09-29-2034)` once (trunk).
   - `docs/log-inbox/symbol-editor.md`: the heading `## 2026-09-29 — feat(editor-v2): default width and height of a vertex view (P-2026-09-29-1230)` once (trunk).
   - `docs/log-inbox/symbol-editor.md`: the heading `## 2026-09-29 — feat(editor-v2): vertex labels outside the symbol box (P-2026-09-29-1245)` once (trunk).
   - `docs/log-inbox/symbol-editor.md`: the heading `## 2026-09-29 — ticket: outside label anchors are cardinal only, no diagonals` once (trunk).
   - `docs/log-inbox/symbol-editor.md`: the heading `## 2026-09-29 — ticket: IR selection ring reads clipped by the node wrapper` once (trunk).
   - `docs/log-inbox/symbol-editor.md`: the heading `## 2026-09-29 — ticket: Symbol Editor previews ignore the inside label positions` once (trunk).
   - `docs/log-inbox/symbol-editor.md`: the heading `## 2026-09-29 — merge: label-outside-pos into alfonso-frontend-jjtl (P-2026-09-29-1827)` once (trunk).
   - `docs/log-inbox/symbol-editor.md`: the heading `## 2026-09-29 — ticket: Symbol Editor Border swatch paints black for a CSS-variable colour` once (trunk).
   - `docs/log-inbox/symbol-editor.md`: the heading `## 2026-09-29 — feat(authoring): the Symbol tab opens the Symbol Editor, Form becomes Layout (P-2026-09-29-1826)` once (trunk).
   - `docs/log-inbox/symbol-editor.md`: the heading `## 2026-09-29 — merge: symbol-tab-modal into alfonso-frontend-jjtl (P-2026-09-29-1925)` once (trunk).
   - `docs/log-inbox/symbol-editor.md`: the heading `## 2026-09-29 — refactor(authoring): remove the dead SymbolCard and its styles (P-2026-09-29-1929)` once (trunk).
   - `docs/log-inbox/symbol-editor.md`: the heading `## 2026-09-29 — merge: symbolcard-cleanup into alfonso-frontend-jjtl (P-2026-09-29-1947)` once (trunk).
   - `docs/log-inbox/symbol-editor.md`: the heading `## 2026-09-29 — style(editors): drop SymbolCard leftovers in railSystem.scss (P-2026-09-29-2253)` once (trunk).
   - `docs/log-inbox/symbol-editor.md`: the heading `## 2026-09-29 — merge: railsystem-leftovers into alfonso-frontend-jjtl (P-2026-09-29-2302)` once (trunk).
   - `docs/log-inbox/versionfixer.md`: the heading `## 2026-09-29 — fix(persistence): save the live project on Cmd+S (P-2026-09-29-2120)` once (trunk).
   - `docs/log-inbox/versionfixer.md`: the heading `## 2026-09-29 — ticket: save counters still read the caller's stale LProject` once (trunk).
   - `docs/log-inbox/versionfixer.md`: the heading `## 2026-09-29 — merge: live-save into alfonso-frontend-jjtl (P-2026-09-29-2140)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-29 — feat(views): viewpoint derivation Phase 2, a deterministic viewpoint from a metamodel (P-2026-09-29-0135)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-29 — merge: viewpoint-derivation-p2 into alfonso-frontend-jjtl (P-2026-09-29-0233)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-29 — docs(views): discovery, deriving a viewpoint from a metamodel into the view IR (P-2026-09-29-0111)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-29 — merge: viewpoint-derivation into alfonso-frontend-jjtl (P-2026-09-29-0259)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-29 — fix(tree): «Derive viewpoint» only on metamodel rows (P-2026-09-29-0305)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-29 — merge: derive-viewpoint-m2-only into alfonso-frontend-jjtl (P-2026-09-29-0315)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-29 — docs(views): discovery, the classic Petri net notation in the derived viewpoint (P-2026-09-29-0925)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-29 — feat(views): the Petri notation in the derived viewpoint, lane 1 (P-2026-09-29-0939)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-29 — merge: petri-notation-l1 into alfonso-frontend-jjtl (P-2026-09-29-1006)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-29 — feat(views): the Petri notation revised, no token marks, centred names, bar, Manhattan (P-2026-09-29-1021)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-29 — ticket: a `bar` view in the Symbol Editor reads «Custom» and has no Shape option` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-29 — merge: petri-notation-l2b into alfonso-frontend-jjtl (P-2026-09-29-1103)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-29 — docs(views): discovery, how far the concrete syntax can improve visually (P-2026-09-29-1227)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-29 — merge: visual-syntax-disc into alfonso-frontend-jjtl (P-2026-09-29-1359)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-29 — feat(views): control-flow notation in the derived viewpoint, lane V1 (P-2026-09-29-1331)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-29 — merge: visual-v1 into alfonso-frontend-jjtl (P-2026-09-29-1417)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-29 — fix(editor-v2): the default notation legible, lane V2 (P-2026-09-29-1332)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-29 — merge: visual-v2 into alfonso-frontend-jjtl (P-2026-09-29-1450)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-29 — fix(ir): never store an L-proxy inside a view IR (P-2026-09-29-2121)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-29 — ticket: a critical-zone lane sees four red hook tests in its own vitest run` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-29 — merge: no-proxy-ir into alfonso-frontend-jjtl (P-2026-09-29-2158)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-29 — feat(ir): render the declared collapsed form, fill and badge (P-2026-09-29-2122)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-29 — ticket: a critical-zone lane's go-ahead variable reaches the criticalZone hook tests` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-29 — merge: ir-collapsed-render into alfonso-frontend-jjtl (P-2026-09-29-2243)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-29 — docs(views): discovery, IR authoring freezes, collapsed graphVertex, StructureSpec (P-2026-09-29-1935)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — merge: ir-freeze-disc into alfonso-frontend-jjtl (P-2026-09-30-1104)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — docs(views): slice C3, IR edge ports, closed without code (P-2026-09-29-2351)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — ticket: freeHandleIndex returns a count, not the first free index, and has no per-side cap` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — merge: ir-edge-ports into alfonso-frontend-jjtl (P-2026-09-30-1509)` once (trunk).
4. `git merge --no-ff --no-commit e052ea399`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: sim-multi-roles into alfonso-frontend-jjtl (P-2026-09-30-1518)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `e052ea399` in `/Users/alfonso/jjodel-w-multi`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 9e2441595` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/simulation.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the sim-multi-roles merge (P-2026-09-30-1518)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-multi`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
