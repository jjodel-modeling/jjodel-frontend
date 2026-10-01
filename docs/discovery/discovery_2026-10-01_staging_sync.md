# Discovery 2026-10-01 — reintegrate origin/staging on `staging-sync` (Phase 1)

Prompt-ID: P-2026-10-01-2240 · prompt `docs/prompts/claude_2026-10-01_2240_prompt_staging_sync.md` · session
`58b1ccc3-62d1-4fcf-a595-4265fe7a2d7b` · tree `~/jjodel-w-staging`, branch `staging-sync`, HEAD `ddd70a1be` (code
identical to `ac3890b7e`: `git diff --name-only ac3890b7e HEAD` lists only the prompt file) · `origin/staging` at
`98ebb132e` · executor Anthropic Claude Opus 5.5 (`claude-opus-5-5`). A set of hypotheses with evidence, not a
reference: whoever uses it downstream re-reads the real files.

## 0. Answer in brief

- **Merge base** `447e4239b` (the previous staging merge, 2026-09-28 10:13). Since then: 39 commits on staging, 490
  on the trunk side; files changed: 40 on staging, 387 on the trunk side, **4 on both** (measured, `comm -12`):
  `docs/claude-code-log.md`, `frontend/src/events/registry.ts`, `frontend/src/pages/components/LeftBar.tsx`,
  `frontend/src/pages/components/Navbar.tsx`.
- **Textual conflicts: 2**, as the chat measured: the log and `LeftBar.tsx` (`git merge-tree --write-tree`, exit 1).
  `registry.ts` and `Navbar.tsx` auto-merge on disjoint hunks.
- **The semantic risk named by the prompt is smaller than feared.** The trunk has not touched
  `InstanceManagerTab.tsx`, `instanceTable.ts`, `jjform/nav.ts`, `Dashboard.tsx`, `ConfiguratorTab.tsx` or
  `environmentConfig.ts` since the base. Of the modules those files import, one changed on the trunk:
  `editor-v2/viewpoint/ir/irTypes.ts`, by additions only (new union members and optional fields). Staging changes
  exports by addition only (`backOf`, `referenceSummary`, `SummaryItem`, `SUMMARY_LIMIT`, `DeleteDialog`,
  `metamodelOfClass`, `modelsForType`, `topLevelReason`). The typecheck and full vitest of Phase 2 are the check.
- **No stop condition.** Staging changes no governance file, no persisted format, no IR property, no
  `VersionFixer` step, no critical-zone file (§3 below, grep with positive control).
- **LeftBar resolution (one hunk):** staging's R5 consumer block (lines 290-313 at `98ebb132e`) first, then the
  trunk's filtered `pMetamodels`/`pModels` (P-2026-09-30-1540). Both intents kept; nothing else differs.
- **Log:** staging's log carries the same splice `447e4239b` made (repaired on the trunk by `e2448cf61`) plus a
  duplicated #157 block: 74 entries, of which **2 are new** to the trunk. Union = the trunk's 40 entries verbatim +
  those 2 by date = **42**. Check D of `check:docs` goes red (above 40), declared under RC-14; the rotation is the
  exclusive lane of P13, not this one.
- **Visible change the merge brings outside consumer mode:** a «Save» button in the app bar for every user
  (#157 R1, `Navbar.tsx:1994-2009` at `98ebb132e`), and the Data Manager UX of #158. The four scenes are compared
  on the canvas; the app bar is measured apart (§6).

**Decisions taken (unattended, inside this lane):**
1. LeftBar resolved as above.
2. Log resolved by union as above; the 3 spliced variants and 15 duplicates of staging are not re-added (§5).

**Decisions awaiting Alfonso (RC-26):**
1. The app-bar «Save» changes what the demo screen shows (a button beside the save state). It reaches only
   `staging-sync` here; the trunk merge waits for the chat's visual check anyway.
   Recommended: keep it, it is Juri's #157 R1 decision of 2026-10-01; revert in a fix lane on a veto.

**Questions:**
1. Rotate the log to 40 right after the trunk merge?
   Recommended: yes, the exclusive rotation lane of P13 right after the trunk merge, as RC-14 prescribes.

## 1. Hypotheses under test

| # | Hypothesis | Verdict | Evidence |
|---|-----------|---------|----------|
| H1 | The only textual conflicts are the log and `LeftBar.tsx` | holds | §2, merge-tree measured on `ddd70a1be` × `98ebb132e` |
| H2 | The real risk is semantic in `InstanceManagerTab.tsx`, `instanceTable.ts`, `nav.ts`, `registry.ts`, `Navbar.tsx`, `Dashboard.tsx` against the trunk's Data Manager, form and simulation work | partly | §4: the trunk did not touch the first four nor `Dashboard.tsx`; only `irTypes.ts` among their imports, additively. Runtime and source-text tests stay open for Phase 2 |
| H3 | Staging changes no governance file, persisted format, IR property, `VersionFixer` step or critical-zone file | holds | §3 |
| H4 | Staging's log is a clean addition the union rule can take | falsified | §5: it inherits the splice of `447e4239b` and duplicates the #157 block |

## 2. Merge base and the two lists

Measured on `ddd70a1be`:

```
git merge-base HEAD origin/staging                → 447e4239bbc4b044bf42421bd4a0a718f84ed3b8
git rev-list --count 447e4239b..HEAD              → 490
git rev-list --count 447e4239b..origin/staging    → 39
git diff --name-only 447e4239b origin/staging     → 40 files
git diff --name-only 447e4239b HEAD               → 387 files
comm -12 (sorted)                                 → 4 files (listed in §0)
git merge-tree --write-tree --name-only HEAD origin/staging
  → CONFLICT (content) docs/claude-code-log.md; CONFLICT (content) frontend/src/pages/components/LeftBar.tsx;
    Auto-merging frontend/src/events/registry.ts; Auto-merging frontend/src/pages/components/Navbar.tsx (exit 1)
```

Staging side by PR (from `git log 447e4239b..origin/staging`):

- **#157 Configurator and role environments** (PR #161, #162, follow-ups R1..R6 of @tmaog's tests):
  `81b6d37a8`, `d5d523cf1`, `e20c5abad`, `5fe6be907`, `6b4b6e72e`, `0932455b0`, `db1aea725`, `178ef4936`,
  `bf0beea33`, `d3a650a11`, `1c077a559`, `53fbd30d4`, `1447e5860`, `2b212dd99`, `c73d007f6`, `8ec6bf30a`,
  `6b7891bae`, `dd5fc3663`, `bd74454e3`, `6d35280cd`, `b4620f3ed`, `f404550ec`, `984eb7e1b`, `5dc9246b7`,
  `ef8defa3b`, `3ae38ec33`, `98ebb132e`, and `b82d661e8` («minor»: a merge, parents `07f65237b` and
  `c73d007f6`, that brings the shared `InstanceDetail` work onto staging).
- **#158 Data Manager UX** (PR #163): `69cdf6586`, `c25eb749d`, `f8c682f81`, `5c3384fef`, `9d3d559f4`,
  `a510b26d5`, `c634cc529`, `b7b1fddb9`, `ae2347d4c`, `a48ac55c0`.
- **#147 custom provider model** (PR #164): the merge `07f65237b` (parents `d3a650a11`, `b7b1fddb9`). Its code,
  `9be7da9a9` «fix(ai): free-text model input for Custom provider (#147)» of 2026-09-18, is already an ancestor of
  the base and of the trunk (`git merge-base --is-ancestor`, exit 0 both): on this merge #147 brings no file.

## 3. Governance, persistence, IR, critical zone (H3)

- `grep -E 'CLAUDE.md|AGENTS.md|PROTOCOL.md|^\.claude/|VersionFixer|useJjomSync|portDistribution|syncState|canvasToJjom|useM1ReferenceEdges|defaultViewTemplate|DV.tsx|\.gitignore|package'`
  over the 40-file staging list: exit 1, no match. Positive control, same file and tool: `grep -c 'docs/'` → 13.
- Added lines of `git diff 447e4239b origin/staging -- frontend/src` (2383 `+` lines) grepped for
  `SetFieldAction|SetRootFieldAction|TRANSACTION|VersionFixer|localStorage|DVertex\.new|DVoidEdge|__raw|jsxString|persist`:
  exit 1. Positive control on the same file: `saveProjectWithFeedback` → 6.
- The new `environmentConfig.ts` functions are pure readers: `metamodelOfClass` (`environmentConfig.ts:111`),
  `modelsForType` (`:132`), `topLevelReason` (`:149`), at `98ebb132e`, verbatim from `:149`:
  «`export function topLevelReason(cls: any): string | null {`». Environment changes set
  `U.isProjectModified = true` (`dd5fc3663`), a runtime flag, not a stored field.
- IR: staging does not touch `editor-v2/viewpoint/ir/` (no path under it in the 40-file list).

## 4. Files changed on both sides, and the risk of the staging-only ones (H2)

| File | Trunk since base | Staging since base | Risk |
|------|------------------|--------------------|------|
| `docs/claude-code-log.md` | `e2448cf61` restores two spliced entries; rotation leaves 40 entries | +249 lines, two hunks (§5) | conflict, union (§5) |
| `frontend/src/events/registry.ts` | `64ea9f216`: `DERIVE_VIEWPOINT_OPEN` (`registry.ts:58`) in `JjodelEvents` | `984eb7e1b`: `CONFIGURATOR_SELECT_TYPE`, `CONFIGURATOR_TYPE_CHANGED` (`:125`, `:127`) in `EnvGenEvents` | low: disjoint objects, auto-merge |
| `frontend/src/pages/components/LeftBar.tsx` | `28a98534e`: `.filter(m => !!m)` on metamodels and models (`LeftBar.tsx:292-293`) | `984eb7e1b`: R5 consumer «Types» column, «All projects» and «Open Configurator» hidden in consumer | conflict, one hunk (§4.1) |
| `frontend/src/pages/components/Navbar.tsx` | `287461f8c`: `Log.eDev((projectid ?? undefined) !== project?.id, …)` (`Navbar.tsx:567`) | `dd5fc3663`, `6d35280cd`, `984eb7e1b`: `createM1(…, open = true)` (`:102`, `:111`), topbar «Save» (`:2002`), consumer trims | low textually; the «Save» is visible to every user (§6) |

Staging-only files whose imports moved on the trunk: of the editor-v2 modules imported by `ConfiguratorTab.tsx`,
`InstanceDetail.tsx`, `InstanceManagerTab.tsx` and `instanceTable.ts` (19 paths), only
`editor-v2/viewpoint/ir/irTypes.ts` is in the trunk list (positive control: 90 editor-v2 paths in that list). Its
trunk diff adds `'bar'`, `'outside'`, `LabelAnchor`, `EntryMark`, `EdgeCurve`, `TextTransformToken` and optional
fields; `instanceTable.ts:27` imports only `FormSpec, TableSpec` from it. No other import of the staging files
(`jjform`, `joiner`, `saveProject`, `consumerMode`, `instanceManagerModel`, `DockManager`, `projectModified`, …) is
in the trunk list (grep exit 1).

Reverse direction: the trunk files that import `instanceTable`, `nav` or `InstanceManagerTab` are
`TabDataMaker.tsx`, `neighborhoodDraw.ts` and tests; staging only adds exports, so their imports stay valid.

Source-text tests that read files this merge changes: `saveProject.test.ts:168` at `98ebb132e` expects
`saveProjectWithFeedback(project)` **4** times in `Navbar.tsx` (the trunk has 3, at `:521`, `:1112`, `:1387`;
the merge adds the topbar one); `dataManagerPicker.test.ts:199-202` expects `DockManager.openManager(` in
`LeftBar.tsx`, a line neither side touches; `lastSaved.test.ts:184-214` reads `Navbar.tsx` and
`instanceManagerTab` sources. All three run in the Phase 2 vitest.

### 4.1 LeftBar.tsx, hunk by hunk

Trunk side (`git log -p 447e4239b..HEAD -- LeftBar.tsx`): one commit, `28a98534e` (2026-09-30), one hunk:

```
-    const pMetamodels = project?.metamodels || [];
-    const pModels = project?.models || [];
+    // An absent target is left out: a pointer no state holds is `undefined` here, and `.id` on it
+    // white-paged the project (P-2026-09-30-1540).
+    const pMetamodels = (project?.metamodels || []).filter(m => !!m);
+    const pModels = (project?.models || []).filter(m => !!m);
```

Staging side (`git log -p 447e4239b..origin/staging -- LeftBar.tsx`): one commit, `984eb7e1b` (2026-10-01), six
hunks: the `joiner` import gains `findEnvironmentConfig, findProfile, visibleTopLevelTypes`; the `consumerMode`
import gains `activeProfileId`; a 24-line R5 block inserted right after `const consumer = isConsumerMode();`
(`LeftBar.tsx:289`) and right before `const pMetamodels = …` (`:314` at `98ebb132e`); «All projects» wrapped in
`!consumer`; a «Types» section for consumer and `!consumer &&` on the Models section; «Open Configurator» and
`<ConfiguratorTab …/>` wrapped in `!consumer`.

Only the insertion collides, because it ends on the line the trunk rewrote. Resolution: the staging block whole,
then the trunk's four lines whole; the other five staging hunks come in by auto-merge. No line of either side is
edited.

## 5. The log (H4)

Parsed with a copy of `splitLog` and `entryKey` of `frontend/scripts/gates/log-tools.ts` / `check-addonly.ts`
(heading `^## YYYY-MM-DD — ` to the next, trailing blank lines collapsed), on `HEAD`, `origin/staging`, `447e4239b`
and the trunk archive:

- Entries: trunk 40, staging 74, base 55. The trunk's header (preamble) equals the base's; staging's does not,
  because its first inserted entry cuts the preamble at line 16.
- Staging entries whose bytes are not in the trunk's active log: 21 keys.
  - **New, 2:** `2026-09-28 — docs(#157): triage del feedback di test di @tmaog + piano di rimedio` (twice in
    staging, at 17 and 270, byte-identical) and `2026-09-23 — docs: piano #157 (Configurator + ambienti jjodel per
    ruolo)` (at 30).
  - **Spliced variants, 3, superseded by the trunk's `e2448cf61`:** the `2026-09-18 — docs: trasporto normativo`
    entry at 245 (its last 12 lines replaced by the preamble's two «Incidente» paragraphs) and at 465 (the base's
    16-line variant), and the 3-line `2026-09-26 — chore: fold the inboxes…` at 267 (the base's variant).
  - **Rotated by the trunk, 15:** the 2026-09-24/25 entries at 720..908, all byte-identical in the trunk's
    `docs/claude-code-log-archive.md`.
- Duplicate keys inside staging: 15 (the #157 block 2026-09-23..24, twice; the triage, twice).

Union applied in Phase 2: the trunk's file unchanged, plus the triage entry above the trunk's first entry
(2026-09-28 > 2026-09-26) and the piano entry after the last 2026-09-23 entry (`Fase 0a`), before the
2026-09-18 one: it is the earliest of that day (prompt 2026-09-23 12:00, commit `d5d523cf1` at 12:06, before
the Fase 0a work). Count check: 40 + 2 = 42. `check:addonly` compares with the first parent (the trunk), so it
passes when the 40 survive byte-identical. Check D (above 40) is red until the rotation lane.

Staging's inboxes `docs/log-inbox/data-manager-ux.md` (2 entries) and `standalone-environment.md` (6 entries)
are new files on staging only: no conflict.

## 6. What the merge shows outside consumer mode

- App bar, every user: «Save» button, `className="appbar-save"` (`Navbar.tsx:2002` at `98ebb132e`), between
  `LastSavedIndicator` and the separator before the Basic/Advanced switch. The demo doc
  (`docs/demo/models_2026_simulator_demo.md:33`) has the presenter click `Advanced` in the app bar. Phase 2 measures
  the switch's box before and after.
- Data Manager (#158): Back from a drill-in, collapsible and resizable side panes, reference sections, key fields
  of referenced elements, closable neighbourhood, `InstanceDetail` shared with the stand-alone page.
- Configurator (#157): per-type model choice, «Create model» keeps it open, New only on root-creatable types.
- The default-viewpoint canvas: no file under `view/`, `editor-v2/nodes`, `editor-v2/edges` or `common/DV.tsx`
  is in the staging list. Expected 0 px; measured in Phase 2.

## 7. Files read

`CLAUDE.md`; `docs/PROTOCOL.md` P1-P16; `docs/decisions.md` RC-13..RC-34; `frontend/scripts/gates/log-tools.ts:55-125`;
`frontend/scripts/gates/check-addonly.ts:1-200`; `frontend/scripts/lane-templates/merge-into-trunk.md`;
`frontend/scripts/smoke/README-probes.md:1-80`; diffs `447e4239b..HEAD` and `447e4239b..origin/staging` of
`LeftBar.tsx`, `Navbar.tsx`, `registry.ts`, `Dashboard.tsx`, `environmentConfig.ts`, `irTypes.ts`,
`docs/claude-code-log.md`; `frontend/src/components/editor-v2/__tests__/dataManagerPicker.test.ts:195-215`;
`frontend/src/common/libraries/__tests__/lastSaved.test.ts` (assert lines); the probe kit of
`~/jjodel-w-updatedepth/frontend/scripts/smoke/_tmp_updatedepth_scenes.ts` and `_tmp_c1_common.ts`, read-only.

## 8. Environment

`frontend/node_modules` is a symlink to `~/jjodel/frontend/node_modules`, created 22:34, before this session: it
stays. Ports in use at 22:4x: 3000, 3001, 3003, 3004, 3215, 3216; the probe takes a free one.
