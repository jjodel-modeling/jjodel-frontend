# Discovery: sync the trunk into edge-ends (slice E) before its merge

Prompt-ID: P-2026-10-02-1505 · prompt `docs/prompts/claude_2026-10-02_1505_prompt_edge_ends_trunk_sync.md` · session unknown ·
tree `~/jjodel-w-edgeends`, branch `edge-ends`, HEAD `dc013e8ba` · executor Anthropic Claude Opus 5.5.
A set of hypotheses with evidence, not a reference: whoever uses it downstream rereads the real files.

## 0. Answer in brief

The merge resolves text only: three conflicts, each a pure insertion on both sides, kept whole. One semantic interaction
needs a `fix:` commit after the merge (Q3). No resolution touches a §3.2 file, so the lane goes on to Phase 2 in cascade.

- **Sides.** Merge base `30f3d8a81` (2026-09-30 17:54). `edge-ends` is 6 ahead (5 of slice E + the prompt commit). The
  trunk `alfonso-frontend-jjtl` is at `eaead2d71` (15:01:44), **one docs-only commit past the prompt's `c3a9c9ffd`**: it
  adds the prompt of the pending ir-corner-clip merge (P-2026-10-02-1501), one file, no code, no log. 173 behind.
- **Conflicts** (`git merge-tree --write-tree`, same three on `c3a9c9ffd` and `eaead2d71`):
  - `edges/UnifiedEdge.tsx`, two hunks. Trunk (`d2e4e7959`, Activity decision/merge): the `irJunctions` import and
    `irActivityFlow`. Branch (`8f3e7c307`): the `edgeEndGlyphs` import, the two roles, the two glyphs, the glyph width.
    Resolution: both blocks, the trunk's first. Nothing else conflicts in the file; git merges the rest.
  - `viewpoint/ir/irEdgeViews.ts`, one hunk after `irTargetEndText`. Trunk: `irActivityFlow`; branch: `irSourceEndRole`
    / `irTargetEndRole`. Distinct keys of one object literal: both, the trunk's first.
  - `docs/log-inbox/views.md`: the trunk folded the inbox (`d2eb5fb83`); its 45 base entries are verbatim in the trunk's
    log or archive (measured, 45/45). Resolution: the trunk's preamble plus the one new slice E entry (Q2).
- **Auto-merged on both sides:** `docs/decisions.md` only. R-VP-32..36 (trunk) and «Serie R-EE» (branch) land in that
  order, both whole, each heading once. Risk: none read.
- **Semantic interaction (Q3).** The junction trunk of an Activity (UML) flow reuses the edge's `markerEnd`
  (`UnifiedEdge.tsx:1061` on the trunk). For a new end that marker is slice E's per-end marker, whose angle and reference
  come from the cut of the *branch* line (`edgeEndGlyphs.ts:108-110`). On the trunk the glyph would be pushed past the
  tip by the glyph's back and keep the branch's angle. The derived views use only the old ends (`openArrow`, `none`,
  `hollowCircle`), so only a user-authored new end on an Activity flow reaches it. Old ends: `orient="auto"`, correct.
- **Critical zone (§3.2):** no resolution touches one. `canvasToJjom.ts` changes on the trunk only and comes in as the
  trunk has it, no resolution. The critical-zone hook guards none of the files resolved.

**Decisions taken (unattended, RC-21/RC-25, each the Recommended line below):** Q1, Q2, Q3.

**Decisions awaiting Alfonso (RC-26):** none. No §3.2 file, no demo change, no R- row amended, no interface narrowed.

1. The trunk ref moved by one docs-only commit. Recommended: merge `eaead2d71` pinned by sha (the ref DOVE names); if the ref moves again before the merge, merge `eaead2d71` all the same and say so.
2. `views.md` against a folded inbox. Recommended: the trunk's file plus the slice E entry verbatim, nothing else; `check:addonly` proves the 45 folded entries are found in the log or archive.
3. The junction trunk with a new end. Recommended: a separate `fix:` commit. The trunk gets its own cut path and its own marker when the target end is new, the old ends stay byte for byte, and a render test in `irEdgeEndsRender.test.ts` is checked with mutations.

## 1. Hypotheses under test

| # | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| H1 | The trunk tip is `c3a9c9ffd` | falsified (docs only) | `git log c3a9c9ffd..alfonso-frontend-jjtl` = `eaead2d71 docs: add prompt P-2026-10-02-1501, merge ir-corner-clip into alfonso-frontend-jjtl`; `git diff --stat` 1 file, 98 insertions, `docs/prompts/` [measured] |
| H2 | Three files conflict | holds | merge-tree: `docs/log-inbox/views.md`, `UnifiedEdge.tsx`, `irEdgeViews.ts`; the same three against `c3a9c9ffd` [measured] |
| H3 | The code conflicts are insertions on both sides | holds | merge-tree markers: `UnifiedEdge.tsx:51-55` (imports), `:162-175` (declarations), `irEdgeViews.ts:85-93` (spread keys); no line of the base inside either side [measured] |
| H4 | The trunk did not touch slice E's other files | holds | `git diff --name-only 30f3d8a81 eaead2d71` ∩ branch files = `decisions.md`, `views.md`, `UnifiedEdge.tsx`, `irEdgeViews.ts`; not `edgeUtils.ts`, `irTypes.ts`, `irCompile.ts`, `irValidate.ts`, `EdgeAuthoringPanel.tsx`, `EditorV2.scss` [measured] |
| H5 | The textual union is the semantic union | partly | true for the end labels and roles; false for the junction trunk with a new end (§3) [read] |
| H6 | The trunk's folded entries are safe to drop from `views.md` | holds | `_tmp_ee_sync_entries.mjs`: branch entries 46, base 45, all 45 found verbatim on `eaead2d71` in `claude-code-log.md`, the archive or the inbox; one new [measured] |
| H7 | No dependency or config moved | holds | `git diff 30f3d8a81 eaead2d71 -- frontend/package.json frontend/package-lock.json frontend/vite.config.ts frontend/tsconfig.json` empty [measured] |

## 2. The two sides' intents (`git log -p <base>..<side> -- <file>`)

- **Trunk, `d2e4e7959` feat(views): Activity decision/merge, guard patch, token inside (P-2026-09-30-1935)**, the only
  trunk commit on both code files. `irEdgeViews.ts`: flags an Activity flow (`isActivityFlowView(cv.ir)`), runs
  `assignActivityJunctions` after the object-as-edge pass. `UnifiedEdge.tsx`: `junctionIn` / `junctionOut` from
  `irJunctionTarget` / `irJunctionSource` (orthogonal IR edges only), the branch path from the diamond vertex
  (`pathSX..pathTSide` into `computeManhattanPath`), no bundle spread for a branch, and the primary member drawing the
  trunk (`junctionTrunkPath`, `markerEnd={markerEnd}`) and the diamond; the guard label on a patch.
- **Branch, `8f3e7c307` + `462fba92d` (slice E, R-EE-1..4).** `irEdgeViews.ts`: the per-instance Conditional end and the
  two roles. `UnifiedEdge.tsx`: glyphs for the seven new ends, `trimPathEnds` on the visible path, one marker per end
  (`ir-end-source-` / `ir-end-target-${id}`, `markerUnits="userSpaceOnUse"`, `refX = -cut.length`, `orient = cut.angle`),
  the roles mirrored across the line, the end labels pushed by the glyph's back.

## 3. The interaction the text does not show

- Trunk, `UnifiedEdge.tsx:1057-1061` on `eaead2d71`: `d={junctionTrunkPath(j.g, j.kind)}` … `markerEnd={markerEnd}`.
- Branch, `UnifiedEdge.tsx:793`: `const markerEnd = isIREdge ? (irTargetGlyph ? \`url(#${markerIREndTargetId})\` : irMarkerUrl(irTargetTermination))`.
- `edgeEndGlyphs.ts:108`: `refX: cut ? -cut.length : 0,`; `:110`: `orient: cut ? String(cut.angle) : role === 'source' ? 'auto-start-reverse' : 'auto',`.
- `junctionTrunkPath` is `M a L b` (merge: near vertex → anchor; decision: anchor → near vertex), uncut. Merged as text, a
  primary member with a new target end draws the trunk with the branch's marker. Its reference sits `back` px before the
  tip of a cut line, so on the uncut trunk the glyph lands `back` px (8 to 20) past the anchor, into the action (merge)
  or the diamond (decision). Its angle is the branch's last run, which differs from the trunk's whenever the branch
  enters its other node on a side not parallel to the trunk.
- Fix (Q3), `UnifiedEdge.tsx` only: for each primary trunk, when the target end is new, `trimPathEnds(trunk, 0, back)`
  gives the trunk's own cut, a marker `ir-end-trunk-<in|out>-${id}` is built from it in `<defs>`, and the visible trunk
  path draws the cut `d` with that marker. The hit path keeps the whole trunk. Old ends: the markup is unchanged.
- Known, not changed: an end label (R-VP-23, in the base) and a role on a junction member are anchored at the handle point
  while the branch is drawn from the diamond vertex. The trunk lane left the R-VP-23 label so; the role follows it.

## 4. Layer Impact Report (no §3.2 file; written because the files resolved are under §3.1 `viewpoint/ir/`)

- D-layer, L-layer, JjOM, sync, persistence/VersionFixer: not touched by any resolution. The trunk's own
  `canvasToJjom.ts` change comes in unchanged.
- Canvas v2-flow: IR edges only. The union keeps both decorations on `e.data`. Q3 changes only a junction trunk whose
  target end is one of the seven new ones.
- Canvas classic: not touched. Smoke: the four demo scenes in the default viewpoint 0 px from `c3a9c9ffd`; slice E's
  probe on the merged tree; Activity (UML) of DemoFlowB.

## 5. Risks

1. The trunk will move again: P-2026-10-02-1501 (ir-corner-clip into the trunk, another chat) is pending, and its own
   `views.md` entry will conflict with this one at the edge-ends → trunk merge (union, docs only).
2. Both render benches pin markup digests from before their lane (slice E on `77c2f946b`, Activity on `17a70f2ad`). Each
   pins edges without the other's keys, so both should hold on the merge; the full vitest run is the check.
3. Q3's case is not in any demo: the evidence is the render test and its mutations, not the probe.

## 6. Files read (under `/Users/alfonso/jjodel-w-edgeends/`)

`CLAUDE.md`; `frontend/src/components/editor-v2/CLAUDE.md`; `docs/PROTOCOL.md` P1-P16; `docs/decisions.md` RC-13, RC-14,
RC-22, RC-26, RC-34, R-EE-1..4, the R-VP-32..36 headings; `docs/discovery/discovery_2026-09-30_edge_ends.md`;
`frontend/scripts/lane-run.mjs` (:953, :1348-1407); `frontend/scripts/lane-templates/trunk-into-branch.md`;
`frontend/scripts/hooks/critical-zone.mjs` (:1-60); `…/edges/UnifiedEdge.tsx` (both sides' diffs and the merge-tree
hunks); `…/edges/edgeEndGlyphs.ts` (grep); `…/utils/edgeUtils.ts` (:2623-2644); `…/viewpoint/ir/irEdgeViews.ts` (both
diffs); `…/viewpoint/ir/irJunctions.ts` on `eaead2d71` (:1-124); `…/viewpoint/ir/__tests__/irEdgeEndsRender.test.ts`
(:1-80); `…/viewpoint/ir/__tests__/irActivityRender.test.ts` on `eaead2d71` (:1-120);
`…/viewpoint/derive/viewpointDerivation.ts` on `eaead2d71` (grep `sourceEnd|targetEnd`);
`frontend/src/services/CanvasExportService.ts` on `eaead2d71` (:185-200: `inlineSvgPaint` walks every `svg *`, markers
included, so the glyph classes export); `docs/prompts/claude_2026-10-02_1501_prompt_merge_ir-corner-clip.md` on
`eaead2d71` (head).

## 7. Phase 2 (added 2026-10-02, after the Phase 1 commit `b7d0885e9`)

Commits on `edge-ends`: merge `1e1ce1334` (parents `b7d0885e9`, `eaead2d71`), fix `9e1f9fae5`, fix `119046cb2`. Q1 to
Q3 adopted as recommended (unattended, RC-21).

- **Q1.** The trunk ref moved again while the merge started: `3db161e62` (the ir-corner-clip merge, 15:10), then
  `0be127357` and `7de984795` (docs). `eaead2d71` was merged, as pinned. The edge-ends → trunk merge, measured against
  `7de984795`: one conflict, `docs/log-inbox/views.md` (union, both append). Trunk-only code since `eaead2d71`:
  `nodes/instanceNode.scss` and `nodes/__tests__/irSelectionRing.test.ts`, which this branch does not touch.
- **Resolutions.** As §0 says: the two code files with both blocks, the trunk's first. `views.md` is the trunk's preamble
  plus the slice E entry, both checked byte for byte against their sources. Step 5 reading of the resolved
  `UnifiedEdge.tsx` (1-1265) and `irEdgeViews.ts`: no marker, no duplicated declaration or hook.
- **Q3 fix.** `9e1f9fae5`: `trunkEnds` (per primary trunk, `trimPathEnds(junctionTrunkPath(...), 0, back)`), two marker
  ids `ir-end-trunk-in|out-<id>` among slice E's marker tuples, the trunk path drawing the cut with its own marker. Old
  ends: the edge's marker, markup unchanged. Tests first: two of three new tests red on `1e1ce1334` (`marker-end`
  `url(#ir-end-target-*)`). Bench (`_tmp_ee_sync_bench.mjs F`, gitignored, restored by `git checkout HEAD --`):
  **8/9**. The survivor was the primary guard (a non-primary member mounted an unused trunk marker). `119046cb2` adds
  the test that kills it: **9/9**.
- **Slice E's bench on the merged tree** (its 23 mutations, the test list plus `irActivityRender.test.ts`): **22/23**,
  the survivor T13 equivalent, as in its own lane.
- **Gates.**
  - `npx tsc --noEmit`: exit 2 with 14 errors on `1e1ce1334` and again on `9e1f9fae5`, the §17 set by file and code.
  - `npx vitest run`: 263 files, 6503 tests. 6502 passed. 11 files red: the 9 known at import, plus
    `irSelectionRing.test.ts` (afterAll hook timeout, Chromium) and `scripts/gates/__tests__/traceMonitor.test.ts` (one
    port test, `status` null). Each re-run alone passes, 5/5 and 9/9: load. Neither file is touched by this lane.
  - `npm run build`: exit 0, only the chunk-size warning. `check:scripts`: PASS.
- **`check:addonly` (RC-34): red on the merge, inherited.** On `1e1ce1334`: 172 inbox entries "rewritten". With
  `--range c3a9c9ffd..HEAD`: 10 commits, 9 clean, the merge the only one flagged. The cause is the trunk's
  `d2eb5fb83` (P-2026-10-01-2344), which folded the inboxes and rotated the log in one commit: an inbox entry went to the
  archive, and the gate only accepts inbox → active log. `npm run check:addonly -- d2eb5fb83` fails the same way on the
  trunk. Measured (`_tmp_ee_sync_addonly.ts`): all 185 entries that leave this branch's inboxes are verbatim in the
  merged log or archive, and in the trunk's. Positive control: against `30f3d8a81` the same script reports the slice E
  entry missing. The merge rewrote no entry. The edge-ends → trunk merge compares against the trunk as first parent,
  where these entries already sit in the archive.
- **Probe** (`lane-run probe … --port 3095 --config _tmp_lane_vite_3095.config.ts --id P-2026-10-02-1505`, light, DPR
  2, 1600×1000; the vite cache and `TMPDIR` inside this tree's gitignored smoke folder, not `/tmp`; log
  `~/.jjodel-lanes/P-2026-10-02-1505/probe-_tmp_ee_sync_probe.log`).
  - Base: slice E's 9 modified source files set to `c3a9c9ffd` in this tree (`git diff c3a9c9ffd -- frontend/` then
    showed only the 4 added files, which nothing imports), restored with `git checkout HEAD --`. **5/5.**
  - After, on `119046cb2`: **20/20**. The four demo scenes in the default viewpoint are byte-identical to base
    (`same: true`); the control between two scenes sees 348100 px. DemoFlowB as Activity (UML): preselected and
    derived through the dialog; fk and jn are 7×120 painted 5×118 in the ink. The 10 visible paths (1 junction
    trunk, 1 diamond) all end on `ir-arrow-open-*`, with no start marker and no slice E marker. That canvas is
    byte-identical to base. Slice E's fixture, light, widths 1 and 2: 42 links. Every new end is cut at its back at
    both ends with glyph stroke = width; the old ends are uncut; the hollow parts are `rgb(241, 245, 249)`, the
    canvas background; the erZeroOrMany row carries 6 multiplicities and 6 roles. Console: the same list in both runs
    (`failed to get project`, `Cannot serialize in ecore, found loop`), no page error.
  - Crops (`sips -Z 600`) in `frontend/scripts/smoke/_tmp_ee_sync_crops/`: `ees_after_{sm,petri,esm,flowB}_default_600.png`,
    `ees_after_flowB_activity_600.png`, `ee_fixture_w{1,2}_light{,_new}_600.png`.
- **Not covered by the probe:** the Q3 case (a new end on an Activity junction trunk) is in no demo. Its evidence is
  the render tests and the bench.
