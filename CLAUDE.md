# CLAUDE.md — Jjodel Project Reference

> Operational reference for Claude Code. Captures what cannot be inferred from reading the code: conventions, critical patterns, language boundaries, gotchas. Everything else lives in `docs/` or the source.
>
> After modifying this file, run `npm run gen:agents` to regenerate `AGENTS.md`, then verify with `npm run check:agents`.

---

```
═══════════════════════════════════════════════════════════════════
NON-NEGOTIABLE RULES — re-read before every task
═══════════════════════════════════════════════════════════════════
Canonical list — §20.1 points here; rules are not restated there.
Shared engagement rules live in docs/PROTOCOL.md (P1..P9); see §1.

— Scope & preservation —
 1. Touch only files explicitly listed in the prompt. A broader
    change "would be better" → ask first; never do it silently.
 1b. Critical-zone rules (§3.x) override Rule 1. If a §3 rule requires
     touching a file outside the listed scope, follow the §3 rule and
     report the scope expansion in the closing diff.
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

## 0. Runtime — model & effort

This agent runs as **Claude Opus 5** (requires Claude Code v2.1.154+; run `claude update` if older).

Effort is set with `/effort` and persists across sessions:
- **Default: xhigh** — the working level for all real tasks, including the critical zone (§3) and visual-bug diagnosis (§5).
- Step down to **high / medium** only for trivial, out-of-critical-zone work (a CSS tweak, a doc fix, a single `str_replace`).
- **Never max** unless the prompt explicitly asks for it.

Note: switching to Opus 5 resets effort to its model default (high). If a session opens at high, set `/effort xhigh` before working.

---

## 1. Protocollo di esecuzione

Le regole di ingaggio condivise (scope, lettura preventiva, two-phase e discovery
report, commit, build, smoke visivo, prompt log) stanno in `docs/PROTOCOL.md`
come clausole P1..P9. I prompt le citano per numero. Questo file non le duplica.

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

`DVertex.new`, `DVoidEdge.new2`, and `DVoidEdge.new3` each open an internal
TRANSACTION. Wrapping them in an outer TRANSACTION causes coordinate loss and
dropped `SetFieldAction`s (nested writes are merged out).

**WRONG — coordinate loss**
```typescript
TRANSACTION('create vertices', () => {
    for (const node of nodes) {
        DVertex.new(node.id, modelId);   // ← nested TRANSACTION dropped
    }
});
```

**RIGHT — bare loop mirroring useJjomSync**
```typescript
for (const node of nodes) {
    DVertex.new(node.id, modelId);
}
```

**SAFE — pure-action TRANSACTION (no creators)**
TRANSACTIONs that contain only `SetFieldAction`, `SetRootFieldAction`, or
`DeleteElementAction` (no `.new()` / `.new2()` / `.new3()` calls) are safe
even in sync-adjacent code. This pattern is used for:
- Tagging a newly created graph (`SetFieldAction` + `SetRootFieldAction`)
- Deleting stale edges after a D-first `extends` removal (`DeleteElementAction`)
- Reconciling reference endpoints (`SetFieldAction` + `DeleteElementAction`)

The hazard is specifically the nesting of creator calls, not the presence of
a TRANSACTION per se.

### 3.4 DVoidEdge race-window guard

The guard strategy depends on the edge type (M1 instance vs M2 reference).

**M1 reference edges** (populated by `useM1ReferenceEdges.ts`)
- Key: pair-based `${srcVId}→${tgtVId}`
- Guard: `hasCanvasEdgePair(ek)` + `existingKeys.has(ek)`
- Semantics: one edge per vertex pair for a given M1 reference value

**M2 reference edges** (populated by `useJjomSync.ts` Step 3)
- Key: composite `${refId}:${srcVertex}→${tgtVertex}`
- Guard: `existingEdgeKeys.has(ek)` after an `idlookup` scan of the graph's
  subElements and the RF edge cache
- Semantics: multiple sibling references between the same vertex pair are
  preserved (e.g. Family→Member: father, mother, sons, daughters)
- `hasCanvasEdgePair` is NOT used here — it would incorrectly block siblings

**Inheritance edges**
- Key: pair-based `${src}→${tgt}`
- Guard: `existingEdgeKeys.has(ek) || hasCanvasEdgePair(ek)`
- Semantics: a class extends another at most once

Key format uses directional arrow `→` (U+2192). It is **not symmetric** —
`A→B` and `B→A` are distinct.

### 3.5 Step 4 dependency limitation + useM1ReferenceEdges

`useJjomSync.ts` Step 4 has these deps:
```typescript
[modelid, hasGraph, subElementIds.length, modelClassCount,
 modelRefCount, modelRefTypeSig, modelExtendsSig, modelObjectCount]
```

`modelRefCount` counts **M2 DReferences only**. Step 4 does **not** re-fire on `SetFieldAction` over `DValue.values` (M1 slot population). This means: when M1 reference values arrive after the initial mount (post-load, post-transformation), Step 4 misses them.

**Do not "fix" Step 4 deps to include M1 value counters**. That breaks other invariants.

**Workaround**: use `useM1ReferenceEdges` — a separate hook downstream that listens to M1 value changes and creates the missing edges with the same guards.

Path: `frontend/src/components/editor-v2/hooks/useM1ReferenceEdges.ts`.

### 3.6 entity.father vs forward-link collections

`entity.father` (backward link) is eagerly set by the parser before reducers finish merging.

Forward-link collections (e.g., `pkg.classes`, `pkg.attributes`) may be **stale immediately after parse** due to Redux reducer batching lag.

**WRONG — race condition on counters and post-parse logic**
```typescript
const classCount = pkg.classes.length;  // may be 0 even after parse completes
```

**RIGHT — backward-link iteration via idlookup**
```typescript
function countDescendantsByFather(
    idlookup: GObject,
    className: string,
    fatherIds: Set<string>
): number {
    let count = 0;
    for (const id in idlookup) {
        const e = idlookup[id];
        if (e?.className === className && fatherIds.has(e.father)) count++;
    }
    return count;
}
```

Canonical implementation: `frontend/src/components/import/buildImportSummary.ts`.

### 3.7 pkg.__raw.uri vs pkg.uri

L-layer `pkg.uri` is computed as `data.uri + "." + data.name` (concatenation).
D-layer `pkg.__raw.uri` is the direct field as parsed.

For byte-identical nsURI, use `pkg.__raw.uri` — the Ecore round-trip discipline lives in §14. For user-facing display or JjScript queries, `pkg.uri` is fine.

Both patterns coexist by design. Do not "unify" them.

### 3.8 composition vs containment

`composition` is the canonical D-layer field. `containment` is supported for
backward compatibility — it is read by Ecore/XMI I/O services, written by
JjScript `copy` commands, and parsed as a first-class option by the JjScript
parser — but do not introduce `containment` in new code. Prefer `composition`
for all new writes.

### 3.9 VersionFixer & jsxString persistence

View templates are persisted as `jsxString` strings in Redux project state. Changes to default-view source files (`DV.tsx`, `defaultViewTemplate.ts`) **do not propagate to existing saved projects automatically**.

Whenever you modify a default-view source file, you must:

1. Add a migration method in `VersionFixer.tsx`. Naming pattern:
   ```typescript
   private ['2.216 -> 2.217'](s: DState): DState { ... }
   ```
   `highestVersion` is computed automatically from method names — no separate constant to bump.

2. Inside the migration, iterate over `DViewElement` entries and rewrite `e.jsxString` for views matching the detection marker. Existing migrations (`2.211 -> 2.212`, `2.213 -> 2.214`) are reference templates.

3. If a new detection marker is needed, add it to `defaultViewTemplate.ts` (e.g., `V2_X_TO_V2_Y_DETECT_MARKER`).

**Skipping the migration leaves every existing project on the old `jsxString`. The "fix" appears to work in dev (new projects look right) but breaks on every saved file.**

### 3.10 Role-aware bucket keys in portDistribution

> **Note (2026-05-27)**: the role-keyed bucketing described in this section governs `portDistribution.ts`'s `edgeHandles` output, which assigns handleIds. The actual positioning of anchors on the screen is currently driven by `handlePosition.ts:computeSidePositions` and `DynamicHandles.tsx`, **not** by `portDistribution.ts`'s `nodeHandles` field (discarded by `EditorV2.tsx`). The overflow-protection trade-off described below is still relevant for handleId assignment, but its visual implications depend on `computeSidePositions`. Re-evaluate this section after the anchor ordering fix (tracked in `docs/discovery/2026-05-27_anchor_ordering_inversion.md`) is merged.

When a pair of nodes can have fan-in and fan-out simultaneously (e.g., bidirectional references between two classes), bucket keys for port distribution must include the role:

```typescript
const sourceKey = `${edge.source}:${sourceSide}:source`;
const targetKey = `${edge.target}:${targetSide}:target`;
```

Without the role suffix, source and target collide on the same slot, leading to handle index overflow beyond `MAX_HANDLES_PER_SIDE` and missing edges.

STEP 4 of `portDistribution.ts` unions source/target buckets per `(nodeId, side)` and dedups by handleId. STEP 5 recomputes uniform positions on the merged total. Do not bypass these steps.

### 3.11 Runtime store access

See §15.4 for the `windoww.store` (double-`w`) global — exposed for console/DevTools debugging; application code imports the store directly. Console: `windoww.store.getState().idlookup`.

### 3.12 Identity slot ↔ instance name — slot→name is always a direct SetFieldAction

The M1 identity binding links an instance's display name (`DObject.name`) to its
`name : EString` slot. The two directions are wired asymmetrically, and that asymmetry
is load-bearing:

- **name → slot**: `set_name` (`joiner/classes.ts` `LPointerTargetable.set_name`, override
  `LModelElement.tsx` `LObject.set_name`) writes both sides — `data.name` via
  `SetFieldAction`, and the slot via the proxy assignment `nameattribute.value = val`
  (which routes through `LValue.set_value` → `setValueAtPosition`).
- **slot → name**: `LValue.setValueAtPosition` (in `LModelElement.tsx`,
  look for the method handling slot propagation) propagates
  the slot value onto `data.name` with a **direct `SetFieldAction` on `'name'`** — it does
  **not** call `set_name`.

**Invariant — never violate**: slot → name propagation must always be a direct
`SetFieldAction` on `'name'`. It must **never** be routed through `set_name`. This is
exactly why no sync loop exists: the name-side write is terminal, so the cycle
`set_name → slot write → name write → set_name → …` cannot form. Any change that makes
slot → name go through `set_name` (instead of the direct field write) reintroduces the
loop. See `docs/discovery/2026-06-17_name_slot_sync.md` §10 for the full trace.

### 3.13 L-layer proxies report the D-layer className

An L-proxy's `.className` returns the **D-layer** class name (`'DValue'`, `'DObject'`,
`'DClass'`, …) — **never** the L-name (`'LValue'`, `'LObject'`). A guard like
`lproxy.className === 'LValue'` is therefore **always false** and silently disables whatever
it protects, with no compile error and no type warning.

```typescript
if (slot.className === 'DValue') { ... }   // correct
// NOT: slot.className === 'LValue'         // always false — silently dead
```

The convention is consistent across the codebase (e.g. `setValueAtPosition`'s
`oldTarget?.className === "DObject"` on an `LObject.fromPointer(...)` result;
`proxy.ts` returns the D-name). This typo cost the entire Direction-A identity-sync effort:
the name → slot write was gated on `=== 'LValue'` and never ran. Residual dead occurrences of
the same typo remain in the base `LPointerTargetable.set_name`/`get_name`
(`joiner/classes.ts`) — dead for instances (`LObject` overrides them), pending a
consistency cleanup.

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

A positive control is only a control if it has signal, and it must run through the same tool as the search it validates. In Claude Code's shell `grep` is a function wrapping `ugrep --ignore-files` (confirm with `type grep`), so a recursive search from the repo root silently skips every gitignored path — `node_modules` included — while an explicitly named path inside one is still searched. Measured 2026-08-11: `grep -rn "(a)" --include="*.md" .` returns 513 lines, none of them from `node_modules`, and adding `--exclude-dir=node_modules` changes nothing. A search that cannot reach its subject returns the same silence as a subject that is not there. The same applies to partial reads: a count taken over lines 1-62 of a 157-line file is a count over that window, and must be reported as such or not reported at all.

The same discipline applies to visual verification, twice over. First, a screenshot is evidence only of the state it contains: before writing "X does not render", build the state where X would render if the claim were false. A colour rule that only distinguishes two kinds proves nothing on a screen showing one of them.

Second, a computed style is a measure of the rendering only when the element you measured is the one that paints. Measured 2026-08-12: the tree glyph is `<span class="tree-node__icon tree-DClass"><i class="bi bi-…"></i></span>`; the entity rules set `color` on the span, `i.bi` in `styles/style.scss:790` sets it on the `<i>`, and a direct declaration always beats inheritance. Removing every entity rule moves the span's computed colour from `#7A4056` to `#0ea5e9` and changes zero pixels. When a style and a pixel disagree, the pixel is the measurement.

**Sub-rule: the interactive `grep` is not the system `grep`**

In an interactive shell here, `grep` resolves to a wrapper around `ugrep --ignore-files`. Two consequences, both measured:

- Gitignored paths are skipped by default. `--exclude-dir=node_modules` is a no-op, and a search for something that lives under an ignored path returns a silence that is not evidence.
- `--include=<glob>` does not filter. ugrep reads it as a file name and warns. Searches written that way are wider than declared, not narrower.

`command grep` bypasses the wrapper and resolves to BSD grep 2.6.0-FreeBSD, which honours both flags. Use it when those flags carry the meaning of the search. Do not go looking for GNU grep: it is not installed here.

A search scope written into a prompt is a claim about what the command does. If the command does something else, the scope was never enforced.

---

## 6. Commit discipline

### 6.1 Staging

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

---

## 7. Design system

**Full spec**: `docs/DESIGN-SYSTEM.md`.

### 7.1 Essentials

- **Icons**: Bootstrap Icons only (`bi bi-*`). No other icon libraries.
- **Code font**: `'IBM Plex Mono', Monaco, Consolas, monospace`.
- **Grid**: 8px base. Standard padding: 8 / 12 / 16 / 24.
- **Cyan (#0ea5e9)**: never as button background. Only focus states, active indicators, links.
- **Primary buttons**: slate gradient `linear-gradient(135deg, #334155, #1e293b)`. White icons.
- **Horizontal toggle switches**: 36×20 px. Active `#334155` (slate, not cyan). Inactive `#cbd5e1`. Label on the left, never inside. Impl: `styles/components/_switch.scss`.
- **Vertical toggles**: only for debug/advanced mode in the navbar.
- **Multi-select chips**: slate-100 (`#f1f5f9`), border slate-200, label slate-700. Selected option subtle cyan `rgba(14,165,233,0.08)`. Impl: `inputselect.scss`, `viewapplyto.scss`.

### 7.2 Token system

**Single source of truth**: `styles/tokens/_colors-light.scss` + `_colors-dark.scss` (both, always). Entry point: `styles/tokens/index.scss`. Active variables in `styles/variables.scss`.

**Legacy tokens — do NOT reintroduce**:
- `--accent` (use `--color-accent`)
- `--bg-1` through `--bg-5`
- `--secondary`
- `--terziary` (typo intentional in the legacy name — also eliminated)
- `--radius`
- `--color` (ambiguous — use `--color-text-primary` or `--color-accent`)

**Current state**: 1 residual `var(--accent)` in `frontend/src/components/editor-v2/EditorV2.scss` awaiting cleanup. Do not add new occurrences; the open ticket is for removal, not propagation.

**Rules for new tokens**:
- `grep -r` before adding, to avoid collisions
- Always add to both files (light + dark)
- Never define CSS variables inside component files — everything in `tokens/`

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

These behaviors are counter-intuitive and have already cost days of debugging. Do not infer them from reading the code.

### 9.1 DObject.new() returns temporary IDs

The returned ID does not correspond to the real ID in the framework. Objects are **not** accessible via `store.getState()[dObject.id]`.

**WRONG — temporary ID, lookup fails**
```typescript
const dObject = DObject.new(classId, modelId, DModel, name, true);
store.getState()[dObject.id]; // undefined

// Also wrong: SetFieldAction does not write proxy-readable values
SetFieldAction.new(featurePointer, 'values', [value], '', true);
```

**RIGHT — find by name via LModel proxy**
```typescript
const lModel = LPointerTargetable.fromD(modelId) as LModel;
const lObject = lModel.objects.find(o => o.name === objectName);

(lObject as any)['$' + attrName].value = attrValue;
```

### 9.2 Deferred attribute setting

After a TRANSACTION that creates objects, the proxies are not immediately available. Use `setTimeout` to let Redux propagation finish:

```typescript
const pending: Array<{ objectName: string; attributes: Record<string, any> }> = [];

TRANSACTION('Create Objects', () => {
    const dObject = DObject.new(classId, modelId, DModel, name, true);
    pending.push({ objectName: name, attributes: { label: 'value' } });
});

setTimeout(() => {
    const lModel = LPointerTargetable.fromD(modelId) as LModel;
    for (const { objectName, attributes } of pending) {
        const lObj = lModel.objects.find(o => o.name === objectName);
        if (!lObj) continue;
        for (const [attr, val] of Object.entries(attributes)) {
            (lObj as any)['$' + attr].value = val;
        }
    }
}, 1000);
```

Accumulate by **name**, not by ID, inside the TRANSACTION.

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

Expression evaluation engine, used by both JjTL and JjScript. Standalone language with its own lexer/parser/evaluator/type system.

**Full reference**: `frontend/src/jjel/SPEC.md` — core constructs, grammar and operator precedence, design decisions (incl. `forall`'s set-theoretic semantics), the 100+ built-in methods, evaluation rules, and contexts of use. Single source; not duplicated here.

---

## 12. JjTL — Transformation Language

**Full reference**: `frontend/src/jjtl/SPEC.md` — syntax and grammar, AST-bridge mappings, the execution model (incl. the 4-strategy property resolution), trace model, JjEL integration, and known bugs/gaps. Single source; not duplicated here. Only the subsections **not** in the SPEC are kept below.

**Roadmap**: `docs/jjtl/JJTL-DEVELOPMENT-PLAN.md`

### 12.6 Language boundaries — JjEL / JjTL / JjScript

| Aspect | JjEL | JjTL | JjScript |
|--------|------|------|----------|
| Purpose | Expression evaluation | Model-to-model transformation | Metamodel scripting |
| Nature | Pure (no side effects) | Declarative + side effects | Imperative |
| Own evaluator? | Yes (`JjelEvaluator`) | No — delegates to JjEL via AST bridge | Yes (command executor) |
| `forall` semantics | Boolean quantifier: `coll.forAll(x: pred)` | Mapping constructor: `forall x in coll -> Type {...}` | N/A |

**Symbol ownership**:
- `do` — only in JjEL `with...do`. Nowhere else.
- `->` — only in JjTL (mapping arrow). Not in JjEL.
- `:` — JjEL forall projection + JjTL conversion/value mapping (distinguished by context).
- `=>` — lambda in both JjEL and JjTL.
- `--` — comments in both JjEL and JjTL.

### 12.7 Editing the language

The 5-file checklist for a syntax change and the current parser limitations live in
`frontend/src/jjtl/CLAUDE.md`, which loads when working under that directory.

---

## 13. JjScript — Scripting Language

Imperative scripting for metamodel manipulation.

### 13.1 Directory structure

```
frontend/src/jjscript/
├── autocomplete/
├── components/
├── executor/         (with commands/)
├── normalizer/
├── parser/
├── recovery/
├── services/
├── __tests__/
├── index.ts
└── types.ts
```

### 13.2 Tests

Test files in `jjscript/__tests__/`: `lexer.test.ts`, `parser.test.ts`, `commands.test.ts`, `grammar.test.ts`, `context-binding.test.ts`.

---

## 14. Ecore / XMI I/O

Importers and exporters for Ecore (.ecore) and XMI (.xmi) formats.

**Service files**:
- `frontend/src/services/export/EcoreService.ts`
- `frontend/src/services/export/XMIService.ts`

**Tests**: `frontend/src/services/export/__tests__/ecore-io.test.ts` (36 tests).

**Fixtures**: `frontend/src/__tests__/fixtures/xmi-m1/`.

**Naming convention**: `Pointer_<UPPER>` for primitive type IDs (e.g., `Pointer_ESTRING`) distinguishes canonical from user-defined types.

**Round-trip discipline**: Ecore export uses `pkg.__raw.uri` (D-layer) for byte-identical nsURI. See §3.7.

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
- `npm run check:agents` must pass when you touch any `CLAUDE.md`. It regenerates every `AGENTS.md` into a temp directory and compares it byte for byte with the committed one. When red, run `npm run gen:agents` and include the regenerated files in the same commit — never hand-edit them.
- `npm run check:docs` must pass when you touch `CLAUDE.md`, `docs/PROTOCOL.md` or `docs/claude-code-log.md`. It verifies that the §21.2 entry-format block is byte-identical to `docs/PROTOCOL.md` P9, and that recent log entries carry `Corregge` and `Causa`. If a recent entry uses prose instead of the strict format, note it in `**Notes**` rather than failing the gate.

---

## 18. Project structure (top level) — mappa parziale

> This map lists the normated modules, not the complete tree. The repo
> contains additional directories; when in doubt, explore.

```
frontend/src/
├── components/
│   ├── abstract/           # Tabs, DockManager
│   ├── editor-v2/          # React Flow editor (hooks, sync, panels, problems)
│   ├── import/             # Importers + ImportSummaryModal
│   ├── project/            # ProjectEditor, Dashboard
│   ├── Jodie/              # Jodie assistant UI
│   └── shared/             # JsonViewer (vestigial)
├── common/                 # DV.tsx (default view runtime)
├── events/                 # registry.ts
├── jjel/                   # Expression Language
├── jjscript/               # Scripting Language
├── jjtl/                   # Transformation Language
├── joiner/                 # Core utilities, Redux, data layer
├── model/                  # LModelElement, logic wrappers
├── redux/                  # VersionFixer, store, actions
├── services/export/        # Ecore + XMI I/O
├── styles/                 # tokens/, variables.scss
├── utils/                  # defaultViewTemplate, lastViewpoint
└── pages/
```

---

## 19. Key files reference

### 19.1 Sync / D-L layer (critical)

| File | Role |
|------|------|
| `components/editor-v2/hooks/useJjomSync.ts` | Main sync hook. TRANSACTION rules in §3.3. |
| `components/editor-v2/hooks/useM1ReferenceEdges.ts` | Supplements Step 4 for M1 refs post-mount (§3.5). |
| `components/editor-v2/sync/syncState.ts` | `hasCanvasEdgePair`, `markCanvasEdgePair` (§3.4). |
| `components/editor-v2/sync/canvasToJjom.ts` | Canvas → JjOM write-back. |
| `components/editor-v2/utils/portDistribution.ts` | Role-aware bucket keys (§3.10). |
| `redux/VersionFixer.tsx` | jsxString migrations (§3.9). |
| `utils/defaultViewTemplate.ts` | `DEFAULT_VIEW_JSX_STRING` + markers. |
| `common/DV.tsx` | Default view runtime. |
| `components/import/buildImportSummary.ts` | Backward-link counters (§3.6). |
| `components/import/ImportSummaryModal.tsx` | Reference CustomEvent+useState pattern (§8.7). |

### 19.2 Editors

| File | Role |
|------|------|
| `components/editor-v2/EditorV2.tsx` | Main v2-flow editor (3000+ lines). |
| `components/project/ProjectEditor.tsx` | Project dashboard. |
| `components/abstract/DockManager.tsx` | Tabs and panels. |

### 19.3 Language engines

| File | Role |
|------|------|
| `jjtl/executor/executor.ts` | `JjtlExecutor` — transformation execution. |
| `jjtl/executor/astBridge.ts` | `toJjelAst()` — JjTL → JjEL expressions. |
| `jjel/evaluator/evaluator.ts` | `JjelEvaluator` — expression evaluation. |
| `jjel/evaluator/context.ts` | `EvaluationContext` — scope and bindings. |

### 19.4 Services

| File | Role |
|------|------|
| `services/export/EcoreService.ts` | Ecore I/O. |
| `services/export/XMIService.ts` | XMI I/O. |
| `events/registry.ts` | Custom events typed constants (§8.6). |

### 19.5 UI shell

| File | Role |
|------|------|
| `Navbar.tsx` + `navbar.scss` | App bar (header row 1). |
| `Toolbar.tsx` | Toolbar (header row 2). |
| `Info.tsx` + `info.scss` | Properties panel. |

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

Claude Code maintains `docs/claude-code-log.md` as an append-only operational log.

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
**Notes**: (optional)
**Prompt document name**: YYYY-MM-DD HH:mm
```

This block is the canonical format, mirrored verbatim in `docs/PROTOCOL.md` P9.

### 21.3 Self-assessment — fill the metrics honestly

These fields exist to measure whether CLAUDE.md and the workflow are reducing regressions and scope creep over time. They are useful only if filled honestly. A compliant-looking log that hides issues defeats the purpose.

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
