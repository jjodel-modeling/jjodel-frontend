<!-- GENERATED FROM CLAUDE.md — DO NOT EDIT. Run `npm run gen:agents` to regenerate. -->

# AGENTS.md — Jjodel Project Reference

> Operational reference for Codex. Captures what cannot be inferred from reading the code: conventions, critical patterns, language boundaries, gotchas. Everything else lives in `docs/` or the source.
>
> After modifying this file, run `npm run gen:agents` to regenerate `AGENTS.md`, then verify with `npm run check:agents`.

---

```
═══════════════════════════════════════════════════════════════════
NON-NEGOTIABLE RULES — re-read before every task
═══════════════════════════════════════════════════════════════════
Canonical list — §20.1 points here; rules are not restated there.
Shared engagement rules live in docs/PROTOCOL.md (P1..P15); see §1.

— Scope & preservation —
 1. Touch only files explicitly listed in the prompt. A broader
    change "would be better" → ask first; never do it silently.
 1b. Critical-zone rules (§3.x) override Rule 1. If a §3 rule requires
     touching a file outside the listed scope, follow the §3 rule and
     report the scope expansion in the closing diff.
 1c. When the scope includes a file whose change triggers a
     regeneration rule (AGENTS.md → AGENTS.md, §17), the prompt names
     the regenerated artifact in the scope too, so no lane has to
     choose between the scope and the rule. If a prompt omits it,
     regenerate anyway, never hand-edit, and report the expansion the
     way 1b does.
 2. Never rename existing identifiers (CSS classes, vars, functions,
    props, components, exported names) unless the prompt asks.
 3. Committed behavior is verified. Never degrade it. In doubt: STOP.
 4. No new dependencies / external libraries (no new package.json
    entries) without approval.
 5. No core changes without approval.
 6. Don't over-engineer simple features.
 7. Don't reorder imports of files not being modified.
 8. Don't "clean up" adjacent code, comments, or whitespace.
 9. Don't remove "apparently unused" code (use `// TODO: cleanup`).
10. Don't reformat blocks not directly involved in the change.
11. Don't modify exported TypeScript interfaces except to add
    optional properties.

— Critical zone (§3) —
12. Never wrap DVertex.new / DVoidEdge.new2 / DVoidEdge.new3 in an
    outer TRANSACTION near the sync layer (coordinate loss).
    TRANSACTIONs containing only SetFieldAction / SetRootFieldAction /
    DeleteElementAction (no creators) are safe even in sync-adjacent
    code.
13. M1 reference edges: guard with hasCanvasEdgePair using pair-key
    src→tgt (see useM1ReferenceEdges.ts). M2 reference edges: use
    composite key refId:src→tgt and protect via idlookup scan +
    existingEdgeKeys (see useJjomSync.ts Step 3). Do not apply M1
    pair-based guards to M2 edges — they would block sibling refs.
14. Touching default-view source (DV.tsx, defaultViewTemplate.ts) →
    add a VersionFixer migration that rewrites jsxString.

— Workflow & hard-stops —
15. Discovery before action: grep paths from the prompt; never
    assume a path is correct. A cited path that doesn't exist → STOP.
16. Read docs/claude-code-log.md (last 5–10 entries) at session
    start. Update it at task end. A discovery report is committed
    in the task that produced it, never left untracked (P4).
    Read docs/decisions.md too: the active operational constraints,
    one line per decision; prompts cite the ids.
17. Never `git add .` / `git add -A`. Always `git add <specific-file>`.
18. Show the diff of touched files in the closing report. The
    diff does not hold the commit (docs/PROTOCOL.md P6).
19. A task touching more than 5 files → pause, list them with what
    changes in each, and get confirmation before proceeding.
20. A change that propagates to a layer not named in the prompt
    (D-layer, L-layer, sync, view, JjOM) → pause and report.

— Technical anti-patterns —
21. Don't use createM1() to create target models (auto names).
22. Don't use require() in the frontend (returns {}; use ES module
    imports).
23. Don't use model.addChild() in canvasToJjom (nested TRANSACTION;
    use .new() directly).
24. Don't reintroduce removed Editor V3 components or events (§10).
25. No hardcoded 'jjodel:...' event strings — use events/registry.ts.
    If you find one in existing code, leave it (migration tracked
    elsewhere).

— Style & design-system —
26. No emojis in code (OK in chat responses).
27. Don't reintroduce legacy CSS tokens (--accent, --bg-1..5,
    --secondary, --terziary, --radius, --color).
28. No CSS variables in component files — always in styles/tokens/.
═══════════════════════════════════════════════════════════════════
```

## 1. Protocollo di esecuzione

Le regole di ingaggio condivise (scope, lettura preventiva, two-phase e discovery
report, commit, build, smoke visivo, prompt log) stanno in `docs/PROTOCOL.md`
come clausole P1..P15. I prompt le citano per numero. Questo file non le duplica.

Restano qui, perché specifiche di questo codebase e non del protocollo: le
regole NON-NEGOTIABLE, la critical zone e il Layer Impact Report (§3), la
diagnosi dei bug visivi (§5), i comandi di sviluppo (§17), e la semantica di
autovalutazione del prompt log (§21.3).

---

## 2. Preservation first — committed code is verified

Committed behavior represents verified state. A modification never degrades it.

**Rules**
- Do not introduce new dependencies without explicit approval.
- Do not commit instrumentation (`console.log`, `[diagN]` blocks). These are removed in a dedicated cleanup commit after the fix is confirmed.

**Test before considering a task done**
- `npm run typecheck` must pass without introducing new errors. A known baseline of pre-existing errors exists; verify your change does not increase the count.
- `npm run build` must pass.
- If tests exist for the touched area, `npm run test` must pass for those files.

---

## 2.5 Aree attive (2026-08-05)

These areas absorb the majority of current activity but are not yet fully
stabilized. Discovery on tasks touching them must explicitly explore local
constraints.

| Area | File hot | Stato |
|------|----------|-------|
| IR / Authoring | `VertexAuthoringPanel.tsx`, `EdgeAuthoringPanel.tsx`, `irStyle.ts` | In sviluppo |
| IR / Execution | `executor.ts`, `irCompile.ts`, `irTypes.ts` | In sviluppo |
| Validazione | `editor-v2/problems/` (registry, conformance, uniqueness) | Attivo |
| Jodie UI | `JodieWindow.tsx` | Convergenza visiva |
| Tree View | `TreeViewContent.tsx`, `tree-view-sidebar.scss` | Rifiniture |

---

## 3. Sync layer & D-L proxy — the critical zone

> This section is the densest in the file. It captures patterns that have already cost days of debugging. Treat every rule here as load-bearing.

### 3.1 Files in the critical zone

| File | Role |
|------|------|
| `frontend/src/components/editor-v2/hooks/useJjomSync.ts` | Main sync hook — D-layer → canvas (1200+ lines). |
| `frontend/src/components/editor-v2/hooks/useM1ReferenceEdges.ts` | Supplements `useJjomSync` Step 4 for M1 reference values populated post-mount. |
| `frontend/src/components/editor-v2/sync/syncState.ts` | Singleton state. Defines `hasCanvasEdgePair`, `markCanvasEdgePair`, `clearCanvasEdgePairs`. |
| `frontend/src/components/editor-v2/sync/canvasToJjom.ts` | Write-back canvas → JjOM. |
| `frontend/src/components/editor-v2/utils/portDistribution.ts` | Handle/port placement. Role-aware bucket keys. |
| `frontend/src/redux/VersionFixer.tsx` | Schema migrations for persisted project state. |
| `frontend/src/utils/defaultViewTemplate.ts` | `DEFAULT_VIEW_JSX_STRING` + detect markers. |
| `frontend/src/common/DV.tsx` | Default view runtime. |
| `frontend/src/components/editor-v2/viewpoint/authoring/` | Vertex/edge authoring UI (IR). |
| `frontend/src/components/editor-v2/viewpoint/ir/` | IR execution rendering. |
| `frontend/src/components/editor-v2/problems/` | Validation overlay with own registry — touches canvas. |

**Cross-reference**: when modifying `portDistribution.ts`, also read `handlePosition.ts` and `DynamicHandles.tsx` — they together form the rendering pipeline for handle positions. A change in `portDistribution.ts` alone may be insufficient (or inert) for visual bugs; see the §3.10 note and §5 `Visual bugs: specify before diagnosing` for the methodology.

### 3.2 Layer Impact Report — mandatory for sync/D-L tasks

If the task explicitly touches `useJjomSync.ts`, `syncState.ts`, `canvasToJjom.ts`, `portDistribution.ts`, `useM1ReferenceEdges.ts`, `VersionFixer.tsx`, or D-layer write paths (`DVoidEdge.new2`, `DVertex.new`, `SetFieldAction` near sync), produce this report **before writing any diff**:

```
LAYER IMPACT REPORT

Layers touched:
  [ ] D-layer (Redux raw data)
  [ ] L-layer (computed proxies)
  [ ] JjOM (model entities)
  [ ] Canvas v2-flow (ReactFlow nodes/edges)
  [ ] Canvas classic
  [ ] Sync layer (useJjomSync hooks)
  [ ] Persistence (VersionFixer / jsxString)

For each touched layer:
  - What changes:
  - What does NOT change:
  - Cross-layer interaction:
  - Side-effect safety vs other layers:

Smoke-test scenarios potentially affected:
  - [e.g. import Families.ecore → expect 8 edges Family↔Member]
  - [e.g. open existing project → views render]
  - [e.g. save → reopen → identical state]

Uncertain about propagation? → STOP and ask.
```

The report goes in chat before the diff. Not in a commit.

### 3.3 TRANSACTION rules near the sync layer

Moved to `frontend/src/components/editor-v2/AGENTS.md` (§3.3) on 2026-09-18
(P-2026-09-18-1930 Phase 1) — loads when work is already under that directory. Rule 12 in the
non-negotiable block is the one-line version that must be known before then.

### 3.4 DVoidEdge race-window guard

Moved to `frontend/src/components/editor-v2/AGENTS.md` (§3.4) on 2026-09-18
(P-2026-09-18-1930 Phase 1). Rule 13 in the non-negotiable block is the one-line version.

### 3.5 Step 4 dependency limitation + useM1ReferenceEdges

Moved to `frontend/src/components/editor-v2/AGENTS.md` (§3.5) on 2026-09-18
(P-2026-09-18-1930 Phase 1).

### 3.6 entity.father vs forward-link collections

Moved to `frontend/src/model/AGENTS.md` (§3.6) on 2026-09-18 (P-2026-09-18-1930 Phase 1).

### 3.7 pkg.__raw.uri vs pkg.uri

Moved to `frontend/src/model/AGENTS.md` (§3.7) on 2026-09-18 (P-2026-09-18-1930 Phase 1).

### 3.8 composition vs containment

Moved to `frontend/src/model/AGENTS.md` (§3.8) on 2026-09-18 (P-2026-09-18-1930 Phase 1).

### 3.9 VersionFixer & jsxString persistence

Moved to `frontend/src/redux/AGENTS.md` (§3.9) on 2026-09-18 (P-2026-09-18-1930 Phase 1) — loads
when work is already under that directory. Rule 14 in the non-negotiable block is the one-line
version that must be known before then; it also covers `frontend/src/common/DV.tsx`, which sits
under neither this module nor either of the other two (known gap, not solved here).

### 3.10 Role-aware bucket keys in portDistribution

Moved to `frontend/src/components/editor-v2/AGENTS.md` (§3.10) on 2026-09-18
(P-2026-09-18-1930 Phase 1).

### 3.11 Runtime store access

Moved to `frontend/src/components/editor-v2/AGENTS.md` (§3.11) on 2026-09-18
(P-2026-09-18-1930 Phase 1).

### 3.12 Identity slot ↔ instance name

Moved to `frontend/src/model/AGENTS.md` (§3.12) on 2026-09-18 (P-2026-09-18-1930 Phase 1).

### 3.13 L-layer proxies report the D-layer className

Moved to `frontend/src/model/AGENTS.md` (§3.13) on 2026-09-18 (P-2026-09-18-1930 Phase 1).

---

## 5. Visual bugs: specify before diagnosing

Check `git log -1 --format='%ai %h %s' -- <file>` if recency matters.

When a bug is reported via screenshot or visual description (e.g. "the edges cross", "the labels overlap", "the node is misaligned"), the first step is **always** to extract a formal specification from the reporter before choosing a diagnostic path. A word like "cross", "overlap", "wrong position" covers multiple distinct failure modes; each maps to a different module and a different fix.

**Required before diagnostic work starts**
1. **What is observed**: describe what is currently rendered. Use concrete numbers (coordinates, sizes, indices) wherever the DOM/Redux state can supply them — never rely solely on the screenshot.
2. **What is expected**: describe the target rendering with the same level of precision. Distinguish *aesthetic* preferences ("could be cleaner") from *correctness* failures ("element A is below element B but should be above").
3. **Acceptance criterion**: a single sentence that can be mechanically checked. Examples: "two anchors on the left side with distinct Y coordinates, the source above the target", "edge labels do not overlap edge paths within ±5px".

If the reporter cannot provide (1) and (2) at this level of precision, **ask before searching the codebase**. Discovery without a formal acceptance criterion produces hypotheses that match the analyst's preconceptions, not the bug.

**Sub-rule: verify consumers before assuming an output is load-bearing**

When the diagnostic hypothesis points at "module X produces value Y, and Y looks wrong", **verify that Y is actually consumed downstream** before fixing it. A non-trivial fraction of analytics-shaped code in this codebase has outputs that are computed and then discarded by the consumer (dead writes). Modifying a dead output produces no observable effect and burns hours of debugging.

Minimum verification: a global `grep` for the name of the output field, traced to every consumer site, with a confirmation that the consumer actually reads the field (not just receives the containing object). Where uncertain, add a temporary `console.log` to confirm the consumer path before writing the fix.

**Sub-rule: do not validate sorts by reading the comparator**

A comparator that "looks correct" by inspection can still produce inverted output when chained with downstream code that reinterprets the order (e.g. a positioner that maps index 0 to the bottom instead of the top). The only valid validation of a sort is **executing it on real input** and comparing the output to the acceptance criterion, ideally as a unit test.

Discovery sessions on sorting bugs must include at least one end-to-end trace from input to rendered output, with concrete numbers at each step. Reading the comparator code in isolation is necessary but not sufficient.

**Sub-rule: do not trust fixtures from memory across sessions**

When a previous session's discovery describes a specific bad state ("the two anchors collide at coordinate (X, Y)"), that description is a hypothesis about a past version of the code, not a fact about the current version. Before building a fix on top of it, **reproduce the bad state on the current code**: run the scenario, capture the DOM/Redux state, confirm the numbers match. If the bad state cannot be reproduced, the underlying bug may have changed or never existed in the form described.

**Sub-rule: an assertion of absence requires proof that the search ran**

"Nothing found" and "the command never ran" produce identical output. A glob that failed to expand, a path that does not exist, a filter that excluded the answer, a read that stopped short of the relevant line: each returns a silence that reads exactly like a negative result.

Before writing "X does not exist", "X is not used anywhere", or "X is not loaded", do one of:
- check the exit status of the command that produced the silence, or
- run a **positive control** on the same command: search for something you know is present. If the control comes back empty, the search is broken, not the subject.

A positive control is only a control if it has signal, and it must run through the same tool as the search it validates. In Codex's shell `grep` is a function wrapping `ugrep --ignore-files` (confirm with `type grep`), so a recursive search from the repo root silently skips every gitignored path — `node_modules` included — while an explicitly named path inside one is still searched. Measured 2026-08-11 that a repo-root markdown search returns hundreds of lines with none from `node_modules`, and that `--exclude-dir=node_modules` changes nothing — full account in `docs/discovery/discovery_2026-08-11_ugrep_wrapper_ignore_files.md`. A search that cannot reach its subject returns the same silence as a subject that is not there. The same applies to partial reads: a count taken over lines 1-62 of a 157-line file is a count over that window, and must be reported as such or not reported at all. Measured 2026-08-13 that a truncated typecheck read understated the error count against the declared baseline — full account in `docs/discovery/discovery_2026-08-13_arco3_fase1_griglia_84.md`. The window set the number, not the subject. The rule above was already written when this happened, which is the point: a rule that fires only when someone remembers it is not operational. Take counts on complete output, with the exit status recorded.

The same discipline applies to visual verification, twice over. First, a screenshot is evidence only of the state it contains: before writing "X does not render", build the state where X would render if the claim were false. A colour rule that only distinguishes two kinds proves nothing on a screen showing one of them.

Second, a computed style is a measure of the rendering only when the element you measured is the one that paints. Measured 2026-08-12 that the tree glyph's colour rule paints a `<span>` while a global rule paints the `<i>` inside it, so removing every entity rule changes the computed colour and zero pixels — full account in `docs/discovery/discovery_2026-08-12_harness_visivo_e_scala_entity_nel_tree.md`. When a style and a pixel disagree, the pixel is the measurement.

**Sub-rule: the interactive `grep` is not the system `grep`**

In an interactive shell here, `grep` resolves to a wrapper around `ugrep --ignore-files`. Two consequences, both measured:

- Gitignored paths are skipped by default. `--exclude-dir=node_modules` is a no-op, and a search for something that lives under an ignored path returns a silence that is not evidence.
- `--include=<glob>` does not filter. ugrep reads it as a file name and warns. Searches written that way are wider than declared, not narrower.

`command grep` bypasses the wrapper and resolves to BSD grep 2.6.0-FreeBSD, which honours both flags. Use it when those flags carry the meaning of the search. Do not go looking for GNU grep: it is not installed here.

A search scope written into a prompt is a claim about what the command does. If the command does something else, the scope was never enforced.

**Sub-rule: a test that asserts on source text must prove itself on a mutation bench**

A test that greps the source of a file instead of executing it pins the shape of the code, not what the code does. Write one only when a mutation bench has been run on the commented-out variant and shows that the test dies with it. Measured across lanes A2 to A4 (2026-09-12 and 2026-09-13): source-text tests survived an inverted tie-break, a dropped guard, and a lookup that mutated its input, all of them invisible to a regex over the body.

When the behaviour cannot be executed because the file does not import in the bench (`window is not defined`, through the `joiner` barrel and monaco), state the gap in the log entry. Do not fill it with a source-text test. The fix is to move the pure logic into a module the bench can import; `frontend/src/model/nameLookup.ts` is the worked example.

**Sub-rule: a test is judged by the mutations it kills, not by the line it seems to be about**

A test that survives a mutation has answered one question, not two. Before deleting it, measure which OTHER mutations die by its hand. A property that no mutation can distinguish through the output — a type sentinel, for example — is declared intent: it will never be covered, and no test can be written that covers it, so surviving its removal is not a verdict on the test. The same test can still be the only guard on a different mutation, and deleting it for failing the first question throws away the answer to the second.

Measured 2026-09-16 on `symbolRecognition.ts` that dropping the `scalarOf` sentinel leaves the file green while dropping the axis's `default` read is caught only by the two conditional border-axis tests — full account in `docs/discovery/discovery_2026-09-16_symbolrecognition_scalarof_mutation_bench.md`.

The name of the test declares the mutation that kills it; the bench that establishes it goes in the commit message (§21.2).

---

## 6. Commit discipline

### 6.1 Staging

- `git add <paths>` is not enough: `git commit` commits the whole index, including work another session staged. Either pass the pathspec to the commit itself (`git commit -- <paths>`) or diff `git diff --cached --name-only` against the declared file list before committing.
- For sparse changes in dense log files (e.g., `docs/claude-code-log.md`), `git add -p` tends to present one giant hunk. Use this pattern instead:
  ```bash
  cp docs/claude-code-log.md /tmp/log-backup.md
  git checkout HEAD -- docs/claude-code-log.md
  # paste only the entries you want to commit into the file
  git add docs/claude-code-log.md
  git commit
  # restore the working state
  cp /tmp/log-backup.md docs/claude-code-log.md
  ```

### 6.2 Commit messages

- Subject line ≤ 72 chars. Scope where useful: `fix(editor-v2): role-aware bucket keys`.
- Split commits thematically. Do not bundle unrelated changes.

### 6.3 Around the commit

- Never use `--no-verify` or skip pre-commit hooks.
- After commit: update `docs/claude-code-log.md`.

### 6.4 Concorrenza tra lane

Moved to `docs/PROTOCOL.md` (P13) on 2026-09-18 (P-2026-09-18-1930 Phase 2) — lane-concurrency
rules: one lane per turn, docs/code never in the same commit, staged/WIP of others untouchable,
no `git stash` on a shared tree, log rotation as an exclusive lane, prompt-ID discipline on
messages (RC-13, `docs/decisions.md`).

### 6.5 Worktrees and cherry-picks

Moved to `docs/PROTOCOL.md` (P14) on 2026-09-18 (P-2026-09-18-1930 Phase 2) — cherry-pick and
worktree mechanics: `git worktree list` first, clean-vs-dirty target tree handling, temporary
worktrees, never moving a checked-out ref, the `node_modules` symlink for a release tree.

### 6.6 Where the rules live

Moved to `docs/PROTOCOL.md` (P15) on 2026-09-18 (P-2026-09-18-1930 Phase 2) — `AGENTS.md`'s one
home is `alfonso-frontend-jjtl`; a rule binds where it is written, not where it was learned; a
`AGENTS.md`-changing commit is owed to the trunk until carried.

---

## 7. Design system

Moved to `frontend/src/styles/AGENTS.md` on 2026-09-19 (P-2026-09-18-1930 Phase 3) — loads
when work is already under that directory. Rules 26-28 in the non-negotiable block are the
one-line versions that must be known before then.

---

## 8. Conventions

### 8.1 Naming

- Components: PascalCase
- Functions: camelCase
- Constants: UPPER_SNAKE_CASE
- SCSS files: kebab-case for generic files; SCSS paired with a React component
  follows the component name (PascalCase)

### 8.2 TypeScript

- Strict mode. Props interfaces exported from the component file.
- Functional components with hooks.

### 8.3 Import order

React → external libraries → internal components → types → styles.

### 8.4 Action patterns

```typescript
SetFieldAction.new(objectId, 'fieldName', value, '+=', true);
SetRootFieldAction.new('graphs', graphId, '+=', true);
TRANSACTION('Description', () => { /* multiple actions */ });
```

**Reminder**: see §3.3 for TRANSACTION rules near the sync layer.

### 8.5 State management

- Redux for global state
- `useState` for local UI state
- `useRef` for values that must not trigger re-render

### 8.6 Custom events

The custom events registry exists at `frontend/src/events/registry.ts`. Use the typed constants:

```typescript
import { JjodelEvents } from '../events/registry';

window.dispatchEvent(new CustomEvent(JjodelEvents.IMPORT_SUMMARY_SHOW, { detail: ... }));
```

**Do not** add hardcoded `'jjodel:...'` strings in new code. If you find one in existing code, leave it — migration to the registry is a separate effort tracked elsewhere.

Event groups in the registry: `JjodelEvents`, `JjScriptEvents`, `AIEvents`, `JjodieEvents`, `EnvGenEvents`, `AvatarEvents`, `SystemEvents`.

### 8.7 Modal / cross-cutting UI pattern

For cross-cutting modals and toasts, the canonical pattern is **CustomEvent dispatcher + local `useState` listener**, not Redux. References: `ImportSummaryModal.tsx`, the toast system.

### 8.8 Progressive Disclosure

Basic mode is the default. Hide complexity until needed.

---

## 9. Object persistence patterns

Moved verbatim to `frontend/src/model/AGENTS.md` (§9, subsections 9.1-9.3) on 2026-09-18
(P-2026-09-18-1930 Phase 1) — L-proxy write semantics that only matter once work is already under
`frontend/src/model/`.

---

## 10. Removed components — do not reintroduce

### 10.1 Editor V3 (removed 2026-04-06)

23 files removed from `panels/viewpoint-editor/`, 5 external files updated.

Current flow:
```
DockManager.openViewpoint() → TabDataMaker → viewpoint rendering
```

**Events eliminated** (do not reintroduce without discussion):
- `jjodel:viewCreated`
- 3 internal V3 events (see git log around 2026-04-06)

Three `// TODO: sidebar` bookmarks remain in code for future sidebar approach.

---

## 11. JjEL — Expression Language

Moved to `frontend/src/jjel/AGENTS.md` on 2026-09-19 (P-2026-09-18-1930 Phase 3) — loads when
work is already under that directory.

---

## 12. JjTL — Transformation Language

### 12.6 Language boundaries — JjEL / JjTL / JjScript

| Aspect | JjEL | JjTL | JjScript |
|--------|------|------|----------|
| Purpose | Expression evaluation | Model-to-model transformation | Metamodel scripting |
| Nature | Pure (no side effects) | Declarative + side effects | Imperative |
| Own evaluator? | Yes (`JjelEvaluator`) | No — delegates to JjEL via AST bridge | Yes (command executor) |
| `forall` semantics | Set comprehension: `forall x in coll [such that P] [: expr]` | Mapping constructor: `forall x in coll -> Type {...}` | N/A |

**JjEL has no `forAll`.** Its `forall` is a set comprehension, not a boolean quantifier — an
explicit design decision (`docs/spec/concern_languages.md:53`). The boolean quantifier is
`coll.all(x => pred)`, with `coll.any` / `coll.none` alongside it; the existential also reads
`exists x in coll such that P`, and the negated universal `(forall x in coll such that P).isEmpty`.

Two things measured on 2026-09-08 and reported in
`docs/discovery/discovery_2026-09-08_validazione_definita_utente.md` §5.3:

- `coll.forAll(...)` **never parses**, in either lambda form. Both lexers lowercase before the
  keyword lookup (`jjel/lexer/lexer.ts:397-400`, `jjtl/lexer/lexer.ts:330`), so `forAll` becomes
  the `FORALL` token and cannot follow a `.`. There is no `forAll` collection builtin either.
- The lambda form `x: pred` is **not** accepted as a method argument: `coll.all(x: pred)` fails
  at the colon, `coll.all(x => pred)` parses and evaluates. The `:` belongs to the `forall`
  projection only, as the symbol table below already says.

The lexer fix is a lane of its own, not yet opened. This note records what is true today.

**Symbol ownership**:
- `do` — only in JjEL `with...do`. Nowhere else.
- `->` — only in JjTL (mapping arrow). Not in JjEL.
- `:` — JjEL forall projection + JjTL conversion/value mapping (distinguished by context).
- `=>` — lambda in both JjEL and JjTL.
- `--` — comments in both JjEL and JjTL.

Full reference, roadmap and the syntax-change checklist moved to
`frontend/src/jjtl/AGENTS.md` on 2026-09-19 (P-2026-09-18-1930 Phase 3) — loads when work is
already under that directory.

---

## 13. JjScript — Scripting Language

Moved to `frontend/src/jjscript/AGENTS.md` on 2026-09-19 (P-2026-09-18-1930 Phase 3) — loads
when work is already under that directory.

---

## 14. Ecore / XMI I/O

Moved to `frontend/src/services/export/AGENTS.md` on 2026-09-19 (P-2026-09-18-1930 Phase 3) —
loads when work is already under that directory.

---

## 15. Known Gotchas

### 15.1 Monaco intercepts F1 and other shortcuts

Monaco registers `keydown` listeners in **bubble phase** on its DOM and calls `stopPropagation()`. Events do not reach `window`.

**Fix**: use capture phase for global shortcuts.
```typescript
window.addEventListener('keydown', handler, true); // true = capture
```

Known intercepted shortcuts: F1 (command palette), F12 (go to definition).

### 15.2 ContextMenu clipped by `overflow:hidden`

`MetamodelTab` and `ModelTab` render `<ContextMenu>` inside a `<div style={{overflow:'hidden'}}>`. Bottom items may go off-screen.

**Fix**: place important items in the first 5–6 slots.

### 15.3 F1 on macOS needs Fn+F1

Without Fn, F1 controls screen brightness and never reaches the browser. The HelpDrawer listener uses capture phase correctly — effective shortcut: Fn+F1.

### 15.4 windoww (double w) for global store

The runtime store is exposed as `windoww.store` to avoid collision with React DevTools. Application code imports the store directly; the global is for console debugging only.

---

## 16. AI Provider System

Unified system for AI providers: OpenAI, Anthropic, DeepSeek, Mistral, Gemini, Groq, Kimi, Ollama, Local.

**Full details**: `docs/discovery/2026-06-13_ai-provider-subsystem.md`.

**Usage pattern**:
```typescript
// Per-feature preference hook
const provider = useAIProviderPreference('documentation');

// Reusable dropdown (supports non-AI local options)
<ProviderSelector feature="chat" compact />

// Open Settings on Providers section
settingsModal?.openSettings('providers');
```

**Feature IDs**: `'documentation'`, `'chat'`, `'scriptblock'`, `'mappings'`.

**Provider resolution order**: feature override → global default → first configured.

---

## 17. Development commands

```bash
npm start            # Vite dev server
npm run build        # vite build (production bundle)
npm run typecheck    # tsc --noEmit (real type gate; vite/esbuild does not type-check)
npm run test         # vitest run
npm run test:watch   # vitest (watch mode)
npm run smoke        # smoke tests (frontend/scripts/smoke/)
npm run dev          # docker-compose dev stack, not the dev server (use npm start)
```

No `lint` script: ESLint is not installed, so do not run it. No coverage script.

Verification gates before commit:
- `npm run build` must pass (exit 0, only the pre-existing chunk-size warning).
- `npm run typecheck` must pass without introducing new errors. Baseline: **33** pre-existing errors — 19 of casing (`Settings/` vs `settings/`, TS1261 ×12 + TS1149 ×7) and 14 scattered (`api/data.ts` ×3, `Measurable.tsx` ×6, `Dummy.ts`, `EditorV2.tsx:2886`, `ChatMessages.tsx:246`, `ProjectEditor.tsx:220`, `Dashboard.tsx:570`). Verify your change does not increase the count.
- `npm run test` where the touched area has tests. The suite has known failures; do not treat a red suite as caused by your change without checking.
- `npm run check:agents` must pass when you touch any `AGENTS.md`. It regenerates every `AGENTS.md` into a temp directory and compares it byte for byte with the committed one. When red, run `npm run gen:agents` and include the regenerated files in the same commit — never hand-edit them.
- `npm run check:docs` must pass when you touch `AGENTS.md`, `docs/PROTOCOL.md` or `docs/claude-code-log.md`. It verifies that the §21.2 entry-format block is byte-identical to `docs/PROTOCOL.md` P9, and that recent log entries carry `Corregge` and `Causa`. If a recent entry uses prose instead of the strict format, note it in `**Notes**` rather than failing the gate.

---

## 18. Project structure (top level) — mappa parziale

Moved verbatim to `docs/CODEBASE-MAP.md` (§18) on 2026-09-19 (P-2026-09-18-2110): a map of the tree, not a rule.

---

## 19. Key files reference

Moved verbatim to `docs/CODEBASE-MAP.md` (§19, subsections 19.1 to 19.5) on 2026-09-19 (P-2026-09-18-2110): an index of key files, not a rule.

---

## 20. Workflow & anti-patterns

> At the end of any task that introduces new patterns or conventions, propose an update to this file.

### 20.1 Do NOT

These anti-patterns are consolidated in the canonical **NON-NEGOTIABLE RULES** block at the top of this file (*Technical anti-patterns* and *Style & design-system* groups; the core-change, over-engineering and dependency items live under *Scope & preservation*).

### 20.2 Best practices

- ✅ Accessibility (WCAG)
- ✅ Dark mode support
- ✅ Lazy loading where appropriate
- ✅ Memoization for performance
- ✅ `console.log` with prefixes `[Component]` for debug — **remove before commit**
- ✅ JSDoc for public components
- ✅ Comments for non-obvious logic

---

## 21. Prompt log

Codex maintains `docs/claude-code-log.md` as an add-only operational log: entries are never amended, and a new entry goes at the TOP of the file, newest-first per day (R-RAIL-45).

### 21.2 Entry format

```
## YYYY-MM-DD — type: short description
**Prompt**: summary of received prompt
**Files touched**: list of modified files
**Outcome**: ✅ completed | ⚠️ partial | ❌ problems
**Corregge**: <name of the prompt document this task corrects> | —
**Causa**: <letter from the §21.3 taxonomy> | —
**Regressions**: yes | no | unknown
**Out-of-scope changes**: yes | no
**Layer Impact Report**: produced | not-required | skipped
**Smoke visivo**: passato | fallito (dettaglio) | non applicabile
**Notes**: (optional, max 500 characters; longer reasoning goes in the cited document)
**Prompt document name**: YYYY-MM-DD HH:mm
```

This block is the canonical format, mirrored verbatim in `docs/PROTOCOL.md` P9.

The cap on `Notes` is a budget, not a style rule. Measured 2026-08-18: 26 active entries, 136518
bytes or roughly 33k tokens, median entry 4050 bytes, three `Notes` above 6000 characters. Beyond
500 characters the reasoning goes in the discovery report, the ratification memo or the session
file, and `Notes` cites that document by name. The rotation threshold is set in `docs/PROTOCOL.md`
P9, not here.

### 21.3 Self-assessment — fill the metrics honestly

These fields exist to measure whether AGENTS.md and the workflow are reducing regressions and scope creep over time. They are useful only if filled honestly. A compliant-looking log that hides issues defeats the purpose.

**Corregge / Causa**

The first-try success rate of past months had to be reconstructed by archaeology — inferring rework chains from prompt names and checkpoint prose. These two fields turn the same measurement into a grep, and make it possible to check in a month's time whether a rule actually worked.

- `Corregge` — the name of the prompt document this task exists to remedy. Fill it whenever the task was born to fix the result of a previous one, **even if that task's outcome was ✅**. Otherwise `—`.
- `Causa` — one letter from the taxonomy below. Fill it when the outcome is ⚠️ or ❌, **or** when `Corregge` is filled. Otherwise `—`.

Taxonomy:

```
(a) ambiguous or incomplete specification in the prompt
(b) scope exceeded: files touched that were not declared
(c) insufficient discovery, or a wrong assumption about existing code
(d) visual regression found only at manual verification
(e) conflict with uncommitted git state
(f) architectural decision changed midway
(g) environmental or operational (port, dev server, build, quota, cache)
```

One letter per entry: the prevailing one. If there genuinely are two, the second goes in `**Notes**`.

No back-filling: existing entries stay as they are. These fields apply from the tasks that follow the commit introducing them.

**Regressions**
- `yes` — the change broke something that worked before the task. Detected during the task, by tests, in CI, or reported by the user in the next turn.
- `no` — nothing broke, as far as you can tell.
- `unknown` — the task was not directly verifiable (no tests for that area, no manual smoke test possible).

If you are uncertain whether something broke, prefer `unknown` over `no`. `no` means "I verified nothing broke," not "I hope nothing broke."

**Out-of-scope changes**
- `yes` — at least one file or function was modified that the prompt did not list, even if the change felt necessary or minor.
- `no` — the diff is strictly limited to what the prompt requested.

Adding a missing import in a file the prompt did list does **not** count as out-of-scope (it is normal completion). Modifying a separate file to "improve" something adjacent **does** count, regardless of intent.

**Layer Impact Report**
Applies only to tasks that explicitly touch the sync layer or D-L proxy (see §3.1 and §3.2).
- `produced` — the report was written in chat before the diff.
- `not-required` — the task did not touch sync/D-L files.
- `skipped` — the task touched sync/D-L but no report was produced. This is a process violation; mark it honestly.

**Honesty principle.** If you have a doubt, mark the worse option (`yes`, `unknown`, `skipped`). An honest negative signal is more useful than a compliant positive one. Nobody is grading the entries — they exist to surface patterns over time.

---

**Last calibration**: 2026-08-05 (full diagnostic audit + structural sync)
