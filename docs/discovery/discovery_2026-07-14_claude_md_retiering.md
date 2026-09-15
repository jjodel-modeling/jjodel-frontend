# Discovery — CLAUDE.md re-tiering (Phase 1, READ-ONLY)

**Date**: 2026-07-14
**Type**: Phase 1 discovery, read-only. No edits, no commits.
**Goal**: Map the current root `CLAUDE.md` and classify every section into one of three tiers, so the always-on file can be shrunk without losing any load-bearing rule. Verify each classification against the real codebase. Output = this report, then HARD STOP.

**Tier definitions used** (from the prompt):
- **Tier 1** — stays, always-on: non-negotiable rules, gates, triggers, the log/measurement protocol, indexes. Test: *"if Claude Code forgets this, a regression follows."*
- **Tier 2** — moves, on-demand: deep conditional playbooks. If bound to a directory → **subtree `CLAUDE.md`** (loads deterministically when files there are read). If cross-cutting → explicit **skill** (loaded only when invoked; auto-invoke is non-deterministic).
- **Tier 3** — leaves the doc → **discovery**: volatile facts (line numbers, file→role tables, directory trees) re-derived per task.

---

## 1. Files / directories read (full paths)

Read directly:
- `/Users/alfonso/jjodel/CLAUDE.md` — the file being mapped (1093 lines).
- `/Users/alfonso/jjodel/AGENTS.md` — **discovered, not named in the prompt**: a near-twin Codex copy (see §7, Finding A).
- `/Users/alfonso/jjodel/docs/claude-code-log.md` — last ~7 entries (session-start protocol).
- `/Users/alfonso/jjodel/frontend/src/jjel/SPEC.md` (644 lines).
- `/Users/alfonso/jjodel/frontend/src/jjtl/SPEC.md` (894 lines), `frontend/src/jjtl/README.md`.

Verified for path-binding / volatility (grep/find/ls, not full read):
- `frontend/src/components/editor-v2/hooks/useJjomSync.ts` (1548 lines), `.../hooks/useM1ReferenceEdges.ts`, `.../sync/syncState.ts`, `.../sync/canvasToJjom.ts`, `.../utils/portDistribution.ts`, `.../utils/handlePosition.ts`, `.../components/DynamicHandles.tsx`.
- `frontend/src/redux/VersionFixer.tsx`, `frontend/src/utils/defaultViewTemplate.ts`, `frontend/src/common/DV.tsx`, `frontend/src/components/import/buildImportSummary.ts`.
- `frontend/src/model/logicWrapper/LModelElement.tsx` (7852 lines), `frontend/src/joiner/classes.ts`.
- `frontend/src/jjscript/` (dir listing — **no SPEC.md / README.md**), `frontend/src/jjscript/__tests__/`.
- `frontend/src/services/export/__tests__/ecore-io.test.ts`, `frontend/src/__tests__/fixtures/xmi-m1/`.
- `frontend/src/components/editor-v2/EditorV2.scss`, `frontend/src/model/`, `frontend/src/pages/components/Navbar.tsx`, `frontend/src/model/Info.tsx`, `frontend/src/components/abstract/DockManager.tsx`.

---

## 2. Ground truth

- **Real total line count of `CLAUDE.md`: 1093 lines.**
  > NOTE: the prompt's "References" block estimates the current file at *~1850* lines. That is stale — the file is **1093**. The retiering still applies, but the starting point is smaller than assumed (see Open Question OQ-4).
- **Nested `CLAUDE.md` files in the repo: NONE.** The only `CLAUDE.md` is the root one. There is **no** existing subtree-memory usage anywhere in the tree (`find . -name CLAUDE.md -not -path './node_modules/*'` → `./CLAUDE.md` only).
- Ordered heading list with line ranges: see the per-section table in §3.

---

## 3. Per-section tier table

`~lines` computed from heading start-to-next-heading. Tier is assigned on the *test* (regression-if-forgotten), not the topic. Where a top section splits across tiers, the split is noted in the row and expanded below the table.

| Section | Lines | ~lines | Tier | Proposed destination | Path-binding | Volatility |
|---|---|---|---|---|---|---|
| Header + NON-NEGOTIABLE RULES | 1–27 | 27 | **1** | stays | cross-cutting | stable |
| §0 Runtime — model & effort | 28–40 | 13 | **1** | stays | cross-cutting | stable |
| §1 Hard stops — pause and ask | 41–57 | 17 | **1** | stays (trigger index) | cross-cutting | stable |
| §2 Preservation first | 58–76 | 19 | **1** | stays | cross-cutting | stable |
| §3 intro | 77–80 | 4 | **1** | stays (1-line pointer) | editor-v2 | stable |
| §3.1 Files in the critical zone | 81–95 | 15 | **2** (table) / 1 (trigger) | subtree `editor-v2/CLAUDE.md` | editor-v2 (+redux, utils, common, import) | volatile (file table) |
| §3.2 Layer Impact Report | 96–127 | 32 | **2** (template) / 1 (trigger) | subtree `editor-v2/CLAUDE.md` | editor-v2 | stable |
| §3.3 TRANSACTION prohibition | 128–151 | 24 | **2** | subtree `editor-v2/CLAUDE.md` | editor-v2/hooks | soft-ref accurate |
| §3.4 DVoidEdge race-window guard | 152–181 | 30 | **2** | subtree `editor-v2/CLAUDE.md` | editor-v2/sync | stable |
| §3.5 Step 4 deps + useM1ReferenceEdges | 182–197 | 16 | **2** | subtree `editor-v2/CLAUDE.md` | editor-v2/hooks | **drifted** (deps 6→8) |
| §3.6 entity.father vs forward-link | 198–226 | 29 | **2** | subtree — dir ambiguous | import + editor-v2 (data-layer) | stable |
| §3.7 pkg.__raw.uri vs pkg.uri | 227–235 | 9 | **2** | subtree `services/export/` OR skill | model + services (cross-cutting) | stable |
| §3.8 composition vs containment | 236–244 | 9 | **2** | subtree model/ or editor-v2 | D-layer (model) | stable |
| §3.9 VersionFixer & jsxString | 245–262 | 18 | **2** | subtree (VersionFixer-adjacent) OR skill | redux + common + utils (multi-dir) | stable |
| §3.10 Role-aware bucket keys | 263–277 | 15 | **2** | subtree `editor-v2/utils/` | editor-v2/utils | **self-flagged stale** (2026-05-27 note) |
| §3.11 Runtime store access (windoww) | 278–288 | 11 | **2** | gotchas skill (**dup of §15.4**) | cross-cutting | stable |
| §3.12 Identity slot ↔ name | 289–309 | 21 | **2** | subtree `model/logicWrapper/` | model + joiner | approx-accurate (~7484) |
| §3.13 L-layer className typo | 310–331 | 22 | **2** | subtree `model/` or `joiner/` | model + joiner | **drifted** (2129/2155→2133/2143) |
| §4 Scope & anti-refactoring (4.1–4.3) | 332–361 | 30 | **1** | stays (dedup w/ NON-NEG + §20.1) | cross-cutting | stable |
| §5 intro Discovery before action | 362–377 | 16 | **1** | stays | cross-cutting | stable |
| §5.1 Visual bugs: specify before diagnosing | 378–406 | 29 | **2** | **skill** (diagnostic methodology) | cross-cutting | stable |
| §6 Commit discipline (6.1–6.3) | 407–434 | 28 | **1** | stays | cross-cutting | stable |
| §6.4 Incident log | 435–440 | 6 | **3** | archive (historical record) | n/a | stable-historical |
| §7 Design system (7.1–7.2) | 441–476 | 36 | **2** | subtree `styles/` OR skill (**dup of `docs/DESIGN-SYSTEM.md`**) | styles + component scss | **drifted** (§7.2 accent) |
| §8.1–8.3, 8.5, 8.8 short conventions | 479–494, 505–510, 529–534 | ~28 | **1** | stays | cross-cutting | stable |
| §8.4 Action patterns | 495–504 | 10 | **2** | skill / subtree | model API | stable |
| §8.6 Custom events | 511–524 | 14 | **2** (rule) / 1 (trigger) | subtree `events/` | events/registry.ts | stable |
| §8.7 Modal / cross-cutting UI pattern | 525–528 | 4 | **2** | skill | cross-cutting UI | stable |
| §9 Object persistence patterns (9.1–9.2) | 535–587 | 53 | **2** | **skill** OR subtree model/ | model + jjtl + import (cross-cutting) | stable |
| §10 Removed components — Editor V3 | 588–606 | 19 | **1** (bare rule) / 3 (detail) | rule→NON-NEG; detail→archive | cross-cutting | stable-historical |
| §11 JjEL | 607–684 | 78 | **2/3** | **dedup → `jjel/SPEC.md`**; pointer only | jjel/ | **duplicated** (SPEC exists) |
| §12 JjTL | 685–806 | 122 | **2/3** | **dedup → `jjtl/SPEC.md`**; keep §12.7 | jjtl/ | **duplicated** (SPEC exists) |
| §12.7 5-file syntax checklist | 787–798 | 12 | **1/2** | keep (subtree `jjtl/`) — **not in SPEC** | jjtl/ | stable |
| §13 JjScript | 807–832 | 26 | **2** | subtree `jjscript/CLAUDE.md` (**NO SPEC to dedup**) | jjscript/ | **drifted** (test list 5→8) |
| §14 Ecore / XMI I/O | 833–850 | 18 | **2** | subtree `services/export/CLAUDE.md` | services/export | accurate (32 tests ✓) |
| §15 Known Gotchas (15.1–15.4) | 851–879 | 29 | **2** | **skill** (cross-cutting; §15.4 = dup §3.11) | cross-cutting (Monaco, macOS) | stable |
| §16 AI Provider System | 880–903 | 24 | **2/3** | pointer → `docs/ai-providers.md` (**dup**) | AI hooks/components | stable |
| §17 Development commands + gates | 904–923 | 20 | **1** | stays | cross-cutting | stable |
| §18 Project structure (top level) | 924–948 | 25 | **3** | discovery (dir tree) | cross-cutting | volatile |
| §19 Key files reference (19.1–19.6) | 949–1012 | 64 | **3** | discovery (file→role tables) | cross-cutting | volatile (dup §3.1) |
| §20 Workflow & anti-patterns (20.1–20.2) | 1013–1041 | 29 | **1** | stays (dedup w/ §4.2) | cross-cutting | stable |
| §21 Prompt log (21.1–21.3) | 1042–1093 | 52 | **1** | stays (measurement protocol) | cross-cutting | stable |

### Split-section notes
- **§3.1 / §3.2**: the *trigger* ("these paths = critical zone → produce the Layer Impact Report") is Tier-1 load-bearing and is already echoed in NON-NEGOTIABLE #4/#5 and §1. The *file→role table* (§3.1) and the *32-line report template* (§3.2) are bulky and path-bound → move to a `editor-v2/CLAUDE.md` subtree; leave a one-line pointer in Tier-1.
- **§3.3–§3.5, §3.10**: the bare rules already live in the NON-NEGOTIABLE block. The WRONG/RIGHT code playbooks are the movable Tier-2 mass, cleanly bound to `editor-v2/`.
- **§10**: "do not reintroduce Editor V3 / `jjodel:viewCreated`" is a Tier-1 blocklist line; the 23-files/5-external count is Tier-3 historical detail.
- **§12.7**: the "update all 5 files together when changing JjTL syntax" checklist is a genuine maintenance procedure and is **not** in `jjtl/SPEC.md` — keep it (Tier-1 rule, physically in the `jjtl/` subtree), unlike the rest of §12.

---

## 4. Path-binding verification

All critical-zone files named in §3.1/§19.1 exist at their cited paths (11/11 `OK`, zero `MISS`):
```
OK editor-v2/hooks/useJjomSync.ts        OK redux/VersionFixer.tsx
OK editor-v2/hooks/useM1ReferenceEdges.ts OK utils/defaultViewTemplate.ts
OK editor-v2/sync/syncState.ts           OK common/DV.tsx
OK editor-v2/sync/canvasToJjom.ts        OK components/import/buildImportSummary.ts
OK editor-v2/utils/portDistribution.ts   OK editor-v2/utils/handlePosition.ts
                                         OK editor-v2/components/DynamicHandles.tsx
```

**Cleanly single-dir → good subtree candidates:**
- §3.1–§3.5, §3.10 → `frontend/src/components/editor-v2/` (all under editor-v2; the handful of non-editor-v2 files they *reference* — VersionFixer, DV, defaultViewTemplate — are the ones §3.9 governs).
- §11 → `frontend/src/jjel/`; §12/§12.7 → `frontend/src/jjtl/`; §13 → `frontend/src/jjscript/`.
- §14 → `frontend/src/services/export/`.
- §7 → `frontend/src/styles/` (+ scattered component `.scss`).
- §8.6 → `frontend/src/events/`.

**Spans multiple unrelated directories → skill candidates (or a judgment call on which dir):**
- §3.6 — parser/reducer race: canonical impl in `components/import/buildImportSummary.ts`, but the race bites in `editor-v2/` sync. Two dirs.
- §3.7 — L-layer (`model/`) **and** Ecore export (`services/export/`). Overlaps §14.
- §3.9 — `redux/VersionFixer.tsx` **+** `common/DV.tsx` **+** `utils/defaultViewTemplate.ts`. Three dirs; no single natural subtree.
- §3.12 / §3.13 — `model/logicWrapper/LModelElement.tsx` **+** `joiner/classes.ts`. Two dirs.
- §5.1 (visual-bug methodology), §9 (persistence patterns), §15 (Monaco/macOS gotchas) — genuinely cross-cutting, not bound to any one dir → **skill**, not subtree.

**Note on determinism**: subtree `CLAUDE.md` auto-loads when Claude reads files *in that directory*; a skill loads only its name+description at startup and its body only when invoked (auto-invoke is model-decided). For a load-bearing rule that must never be missed, a subtree in the exact governed dir is safer than a skill. For the cross-cutting cases above there is no single dir, so the trade-off (skill's non-determinism) is unavoidable — mitigate by keeping the *bare trigger* in Tier-1 and the *playbook* in the skill.

---

## 5. Volatility spot-check (line references baked into CLAUDE.md)

| Ref in CLAUDE.md | Claim | Actual | Verdict |
|---|---|---|---|
| §3.3 TRANSACTION warning | "around the 'Create missing elements' comment block" in `useJjomSync.ts` | block at **line 707–709**, explicit nested-TRANSACTION warning present | **still accurate** (soft ref, no hard line number) |
| §3.5 Step 4 deps | `[modelid, hasGraph, subElementIds.length, modelClassCount, modelRefCount, modelObjectCount]` (6 items) | line **1075**: 8 items — adds `modelRefTypeSig`, `modelExtendsSig` | **DRIFTED** (deps grew 6→8; named deps still present, list incomplete) |
| §3.12 `setValueAtPosition` | "around `LModelElement.tsx:7484`" | real impl `get_setValueAtPosition` at **7433**, body spans 7433–7576; line 7484 lands inside it. Also: file is at `model/logicWrapper/`, not `joiner/classes/` | **approx-accurate** (±50 lines, construct present; dir implied) |
| §3.13 `classes.ts:2129 / :2155` | base `set_name` @2129, `get_name` @2155 | actual `get_name` @**2133**, `set_name` @**2143** | **DRIFTED** (~4–14 lines; the two numbers also don't map cleanly to their symbols) |
| §13.2 jjscript test list | 5 files (lexer, parser, commands, grammar, context-binding) | **8** files (adds `elementWaiter`, `handleRegistry`, `scriptValidator`) | **DRIFTED** (undercount) |
| §14 ecore-io "32 tests" | 32 | **32** | **accurate** ✓ |
| §7.2 "1 residual `var(--accent)` in EditorV2.scss:857" | one occurrence, line 857 | occurrence at line **860**; **5** total `var(--accent)` across `frontend/src/` | **DRIFTED** (line 857→860; and "1 residual" understates — 5 tree-wide) |

**Reading**: of 7 baked references sampled, **1 accurate, 1 soft-but-accurate, 1 approx, 4 drifted** in ≤ ~2 months. This is exactly the Tier-3 signature the prompt predicts: any hard line number in §3/§7/§13/§19 is a decaying asset. The rules those numbers annotate are *not* wrong — only the coordinates are — which is why the rules belong in Tier-1/Tier-2 prose and the coordinates belong in per-task discovery.

---

## 6. Duplication check (§11/§12/§13 + others)

| CLAUDE.md section | External source | Coverage | Action |
|---|---|---|---|
| §11 JjEL (78 ln) | `frontend/src/jjel/SPEC.md` (644 ln) | **Full** — constructs, precedence, design decisions, built-ins, EvaluationContext all in SPEC | Dedup → delete body, keep 1-line pointer |
| §12 JjTL (122 ln) | `frontend/src/jjtl/SPEC.md` (894 ln) + `README.md` | **Full**, EXCEPT §12.7 (5-file syntax-change checklist) which is a maintenance procedure not in SPEC | Dedup body → SPEC; **keep §12.7** |
| §13 JjScript (26 ln) | **none** — `frontend/src/jjscript/` has NO `SPEC.md`/`README.md` | **Not covered** | **Cannot dedup** → needs a home (subtree `jjscript/CLAUDE.md`, or create `jjscript/SPEC.md`) |
| §7 Design system (36 ln) | `docs/DESIGN-SYSTEM.md` (cited as "full spec") | Essentials duplicated | Dedup → subtree/skill pointer |
| §16 AI Providers (24 ln) | `docs/ai-providers.md` (cited "full details") | Usage snippet duplicated | Dedup → pointer |

**Internal duplication (within CLAUDE.md itself):**
- §3.11 ⇄ §15.4 — both describe `windoww.store` (double-w). Redundant.
- §3.7 ⇄ §14 — both state the Ecore round-trip uses `pkg.__raw.uri`.
- §3.1 ⇄ §19.1 — the sync-critical file→role table appears twice.
- NON-NEGOTIABLE block ⇄ §1 ⇄ §4.2 ⇄ §20.1 — four overlapping blocklists of the same "don't rename / don't scope-creep / don't git add ." rules. Consolidating these into one canonical list alone would reclaim ~40–60 always-on lines.

So moving §11/§12/§16/§7 out is **deduplication (safe)**; moving §13 out is **relocation (needs a new home — no spec exists)**.

---

## 7. Notable findings beyond the brief

**Finding A — `AGENTS.md` is a drifted, stale twin of `CLAUDE.md` (not named in the prompt).**
`/Users/alfonso/jjodel/AGENTS.md` (39 KB) is a full parallel copy of the doc for **Codex**, produced by `s/CLAUDE/AGENTS/`, `s/Claude Code/Codex/`, `s/claude-code-log/Codex-log/`. It is a **regular file, not a symlink**, and it is **stale** relative to `CLAUDE.md`. `diff` shows AGENTS.md is missing, among others:
- §0 Runtime — model & effort (absent),
- the §3.1 `portDistribution`↔`handlePosition` cross-reference note (absent),
- the §3.10 2026-05-27 anchor note (absent),
- §3.12 Identity-slot invariant (absent),
- §3.13 L-layer className typo (absent),
- most of §5.1's sub-rules (absent),
- §6.4 Incident log (absent),
- and it carries a **wrong §17**: AGENTS.md lists `npm run dev` (as the Vite server) and **`npm run lint`** — which the current CLAUDE.md §17 explicitly says *does not exist* ("No `lint` script: ESLint is not installed"). Following AGENTS.md would run a non-existent command and use the wrong dev command.

Implication: any retiering of `CLAUDE.md` silently doubles the maintenance surface unless AGENTS.md is addressed. This is the single biggest structural issue found and belongs in the Phase-2 decision (see OQ-1).

**Finding B — the "current file ~1850 lines" premise is stale.** Actual `CLAUDE.md` = **1093** lines. The file has already been trimmed since that estimate was written.

---

## 8. Always-on core estimate

Rough line accounting (overlaps make totals fuzzy; treat as ±10%):

- **Tier 1 (stays, always-on)** — Header+NON-NEG (27) + §0 (13) + §1 (17) + §2 (19) + §3 pointer (~8) + §4 (30) + §5 core (16) + §6.1–6.3 (28) + §8 short conventions (~28) + §10 bare rule (~5) + §12.7 pointer (~3) + §17 (20) + §20 (29) + §21 (52) ≈ **~295 lines**.
  - With the four overlapping blocklists (NON-NEG / §1 / §4.2 / §20.1) consolidated into one, realistically **~220–250 lines** — near the official ~200 target.
- **Tier 2 (moves to subtree/skill)** — §3.1–§3.13 bodies (~230) + §5.1 (29) + §7 (36) + §8.4/8.6/8.7 (~28) + §9 (53) + §11 (78) + §12 minus 12.7 (~110) + §13 (26) + §14 (18) + §15 (29) + §16 (24) ≈ **~690 lines**. (Of these, §11+§12 ≈ 190 are pure dedup against existing SPECs — deletable, not relocatable.)
- **Tier 3 (leaves the doc → discovery/archive)** — §18 (25) + §19 (64) + §6.4 (6) + §10 historical detail (~10) + the dir-tree/line-number fragments inside §3.1/§11.1/§12.1/§13.1 (~40) ≈ **~145 lines**.

**Projected slimmed always-on `CLAUDE.md`: ~250–300 lines** (from 1093 — a ~73% cut), landing near the ~200-line guidance after blocklist consolidation, with **zero load-bearing rule lost** because every Tier-1 rule already has (or gets) a one-line trigger and the depth moves to a deterministically-loading subtree (for the dir-bound rules) or a SPEC (for the language chapters).

---

## 9. Open questions for Alfonso (decisions needed before Phase 2)

- **OQ-1 — `AGENTS.md` (Finding A).** It is a stale, hand-diverged Codex copy of the same doc. Before/while retiering, decide: (a) make AGENTS.md a **symlink** to CLAUDE.md (both tools read one file); (b) **generate** AGENTS.md from CLAUDE.md by a scripted string-substitution so they can't drift; or (c) accept two independently-maintained files and re-tier both in parallel. Doing nothing means Phase-2 fixes CLAUDE.md while Codex keeps reading the stale twin (with its wrong `npm run lint`).

- **OQ-2 — §13 JjScript has no SPEC.** Unlike §11/§12, §13 cannot be deduplicated away. Home options: (a) a `frontend/src/jjscript/CLAUDE.md` subtree, or (b) author a `frontend/src/jjscript/SPEC.md` to match jjel/jjtl and point to it. Which?

- **OQ-3 — subtree vs skill for the multi-dir cross-cutting rules** (§3.6, §3.7, §3.9, §3.12, §3.13, §5.1, §9, §15). None maps to a single directory, so a subtree `CLAUDE.md` can't deterministically cover them from one location. Options per rule: pick the *primary* dir and accept partial coverage (subtree), or move to a **skill** and accept non-deterministic auto-invoke (mitigated by keeping the bare trigger in Tier-1). Need a per-rule call, or a default policy.

- **OQ-4 — target size.** The prompt's ~200-line target assumed a ~1850-line start; the real start is 1093 and the projected core is ~250–300 (or ~220 with blocklist consolidation). Confirm: hard ~200 target (requires consolidating the four overlapping blocklists and trimming §21), or pragmatic ~300?

- **OQ-5 — subtree mechanism is unproven in this repo.** No nested `CLAUDE.md` exists today and there's no evidence the team's Claude Code version/workflow has exercised subtree-memory loading. Before relying on it for load-bearing sync rules, confirm the installed Claude Code deterministically loads `editor-v2/CLAUDE.md` when those files are read (a 1-file smoke test), so a Tier-2 sync rule isn't silently dropped.

- **OQ-6 — consolidate the four blocklists?** NON-NEGOTIABLE / §1 / §4.2 / §20.1 restate the same don't-rename / don't-scope-creep / don't-`git add .` rules. Consolidating into one canonical Tier-1 list reclaims ~40–60 lines but changes the "re-read before every task" ergonomics. Approve?

---

## HARD STOP

Report written. No edits to `CLAUDE.md`, no subtree `CLAUDE.md` created, no skills created, no commits. Phase-2 split will be planned in chat starting from this report.
