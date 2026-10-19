# log-inbox — lane «shell-ui»

Entries written by the shell-ui lanes (P9, parallel lanes). Whoever closes the batch moves them into
`docs/claude-code-log.md` **verbatim and in this order** (RC-12) and empties this file. The active log is
not touched by this lane.

---

## 2026-10-19 — discovery: shell visual consolidation, Phase 1
**Prompt**: P-2026-10-19-1710, read-only discovery that turns the Linear-style CSS pilot (`~/.jjodel-lanes/pilots/linear/`) into a plan: where each overridden shell class is defined, token inventory and a shell-scoped token set, the Basic/Advanced attribute, uppercase titles, unstable selectors, small targets, #94a3b8 text, risks, lane slicing.
**Files touched**: docs/discovery/discovery_2026-10-19_shell_visual_consolidation.md, docs/log-inbox/shell-ui.md, docs/prompts/claude_2026-10-19_1710_prompt_shell_ui_discovery.md (Status line)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: No shell root element exists (rail and editor menu portal to body), so `--shell-*` (name free, 0 hits) goes on the selector list of six surface roots; `data-mode` on html from Navbar via Redux `advanced`. Eight lanes S1..S8, S1 first. Awaiting Alfonso (RC-26): A1 demo script quotes `SEMANTIC TYPE CLASS`, A2 R-RAIL-7 row 26 px, A3 D-UI-11 outer rail border. `tpl-e` (1650) unmerged and edits Navbar.tsx/navbar.scss: S2 and S5 wait for it.
**Prompt document name**: 2026-10-19 17:10

## 2026-10-19 — feat: shell token layer and html data-mode (S1)
**Prompt**: P-2026-10-19-1725, slice S1 of the shell front: new `styles/tokens/_shell.scss` with the `--shell-*` alias set of discovery §3.2 on the six surface roots (density under `html[data-mode="advanced"] :is(...)`), imported last in `tokens/index.scss`; Navbar mirrors Redux `advanced` on `document.documentElement.dataset.mode`. No consumer yet.
**Files touched**: frontend/src/styles/tokens/_shell.scss (new), frontend/src/styles/tokens/index.scss, frontend/src/pages/components/Navbar.tsx (5aea38269); docs/log-inbox/shell-ui.md, docs/prompts/claude_2026-10-19_1725_prompt_shell_ui_s1_tokens_mode.md (Status line)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Gates: typecheck exit 0, vitest 5 files 66 passed (lastSaved plus four that mention Navbar), build exit 0 (13 `--shell-*` names and the advanced rule in the CSS bundle), smoke GREEN 12/0/3; smoke reports a baseline line improved 2 -> 0 (navbar project setup), baseline not edited here. Commit type `feat` not given by the prompt (P6): ratified as recommended, unattended. Dev server 3011, npm PID 91386 in dev.pid, listener node 91399.
**Prompt document name**: 2026-10-19 17:25

## 2026-10-19 — feat: status bar on shell tokens, Inter, 24px targets (S3)
**Prompt**: P-2026-10-19-1740, slice S3 of the shell front: the app status bar in Inter via `--font-sans`, text colours and neutral borders from `--shell-*`, no text under 11px, jjodie and bell 24x24 with negative margins, the dark JjTL variant unchanged.
**Files touched**: frontend/src/components/StatusBar.scss, frontend/src/components/StatusBarRightZone.scss (b9d279e96); docs/log-inbox/shell-ui.md, docs/prompts/claude_2026-10-19_1740_prompt_shell_ui_s3_statusbar.md (Status line)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato (chat, 3013 at 1600x1000: bar 0,968,1600,32; Inter Variable, version 11px; jjodie and bell 24x24; no fixed element over the bar; console init_dash only; 3.4px bell shift accepted per R-SHELL-5)
**Notes**: Before->after, 1600x1000: bar 0,968,1600,32 both; Inter 0/16->16/16 text nodes; min text 10->11px (injected badge 9->11); jjodie 20x20->24x24, bell 15x18->24x24, bell top 975.5 kept, right 1506.77->1503.36 from the 3.41px wider version; dark mirror identical; console init_dash only, both. Gates: typecheck 0, vitest 11/11, build 0, smoke GREEN 12/0/3, A3 PASS. Unattended: colour role map, bell grows left/down, badge 11px, type feat. Dev 3013.
**Prompt document name**: 2026-10-19 17:40

## 2026-10-19 — feat: editor toolbar and left palette on shell tokens (S4)
**Prompt**: P-2026-10-19-1741, slice S4 of the shell front: `.editor-v2-toolbar` and `aside.editor-v2-palette` in EditorV2.scss (lines 219-1579) onto `--shell-*`: radii 4/8, neutral borders 1px `--shell-border`, text >= 11px, weights <= 600, dim text to `--shell-text-3`, palette on #f8fafc with white items, muted toolbar icons in Advanced only. Shared classes overridden under `.editor-v2-toolbar`, outer palette border untouched.
**Files touched**: frontend/src/components/editor-v2/EditorV2.scss (cefede853); docs/log-inbox/shell-ui.md, docs/prompts/claude_2026-10-19_1741_prompt_shell_ui_s4_editor_chrome.md (Status line)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato
**Notes**: 1600x1000, Basic and Advanced, before->after: toolbar 201,51,1398,40, palette 1,51,200,916, canvas 201,91,1398,876 unchanged; text <11px 1->0 and 3->0; borders 1px only; radii 4/8 toolbar, 4 palette; max weight 700->600; palette bg #f8fafc, outer border rgba(0,0,0,.06) kept; Advanced icons #64748b, Basic dark, disabled/active excluded; `.toolbar-btn` outside identical. Chat GO on 3014, class selected. Gates: typecheck 0, vitest 52, build 0, smoke GREEN 12/0/3.
**Prompt document name**: 2026-10-19 17:41

**Ticket** (follow-up, not this lane): R-SHELL-3 (decision 7a9d1610e) moves the outer borders of both rails to `--shell-border` together; done in S8, not here. The palette outer border stays `--border-subtle` (D-UI-11).

## 2026-10-19 — feat: shell rail surfaces (S6)
**Prompt**: P-2026-10-19-1742, slice S6 of the shell front: rail surface `--shell-surface-rail` with white fields, inner neutral borders 1px `--shell-border`, radii 4/8, text floor 11px, weights at most 600 (500 under 12px), #94a3b8 text to `--shell-text-3`; additive `classNamePrefix="jj-select"` on JjSelect, `.jj-select__control` styled under the rail.
**Files touched**: frontend/src/components/editors/properties-with-tree-view.scss, frontend/src/components/ui/JjSelect/JjSelect.tsx (89f524305); docs/log-inbox/shell-ui.md, docs/prompts/claude_2026-10-19_1742_prompt_shell_ui_s6_rail_surfaces.md (Status line)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato
**Notes**: 1600x1000 DemoPetri, model/attribute/class, Basic+Advanced: rail 1200,91,400,877, canvas 201,91,1398,876 unchanged; bg #fff->#f8fafc; text<11px 8 kinds->0; weight 700 3->0; off-scale radii 19 kinds->0; border widths !=1 0->0; css-*-control rules 7->7; IR authoring 0 rect diffs (518/859). Section titles left to S7. Gates: typecheck 0, vitest 29/29, build 0, smoke GREEN 12/0/3. Chat check on 3016 passed.
**Prompt document name**: 2026-10-19 17:42

**Ticket** (P-2026-10-19-1742): in the rail the B4 rule `.jj-field input:not([type=color]):not([type=checkbox])` (properties-with-tree-view.scss, Arco 3 passo A) also reaches react-select's inner `input.jj-select__input`, giving it 30px height and a 1px border: a small box visible left of the value in the Type field. Not fixed here (it moves geometry); the chat accepted the invisible 4x32 input at 6px.

## 2026-10-19 — feat: rail section titles in sentence case (S7)
**Prompt**: P-2026-10-19-1830, slice S7 of the shell front (R-SHELL-4): right-rail section titles in sentence case in the source, shown at 12px/500, no tracking, `--shell-text-2`; type badge and left palette label stay uppercase; `b.me-2` in Info.tsx replaced by the semantic class `info-field-label`; the MODELS demo script and the R-SIM-99 row quote `Semantic type class`.
**Files touched**: frontend/src/components/editors/Info.tsx, NodeEditor.tsx, PropertiesWithTreeView.tsx, properties-with-tree-view.scss, info-improvements.scss (fbb1531f9); docs/demo/models_2026_simulator_demo.md, docs/decisions.md (R-SIM-99 label only), docs/log-inbox/shell-ui.md, docs/prompts/claude_2026-10-19_1830_prompt_shell_ui_s7_rail_titles.md (Status line)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato
**Notes**: 9 files, all in DOVE or closure. Chat check on 3017 passed. 1600x1000 DemoPetri, model/attribute/class/class+node, Basic+Advanced: rail and canvas rects unchanged; 16 title kinds 12/500/none/#475569, sentence case; badge and palette uppercase; info-field-label computed style identical; clipped 0->0; text<11px only the pre-existing 9px anchor-viz labels. No acronym in titles. docs/redesign/rail/README.md left as historical spec. Gates: typecheck 0, vitest 33/33, build 0, smoke GREEN 12/0/3.
**Prompt document name**: 2026-10-19 18:30

**Ticket** (P-2026-10-19-1830): in Advanced with a node selected and NODE open, NodeEditor's `span.anchor-viz__point-label` renders at 9px (17 elements), under the R-SHELL-5 11px floor; present before S7, outside this lane's files.

**Ticket** (P-2026-10-19-1830): `.jj-section-title` (Contents sub-lists CLASSES/ENUMERATORS/PACKAGES) is still 11px/600 uppercase #94a3b8, under R-SHELL-5; to S8.

## 2026-10-19 — merge: shell-ui-s7 into alfonso-frontend-jjtl (P-2026-10-19-1926)
**Prompt**: `claude_2026-10-19_1926_prompt_merge_shell-ui-s7.md`, a direct merge by `lane-run merge --direct`, no session: `shell-ui-s7` at `6422e7af1` into `alfonso-frontend-jjtl`, merge base `515ca7689`, 2 commits on the branch side.
**Files touched**: merge `de63372dd`: 9 files from the branch side (`docs/decisions.md`, `docs/demo/models_2026_simulator_demo.md`, `docs/log-inbox/shell-ui.md`, `docs/prompts/claude_2026-10-19_1830_prompt_shell_ui_s7_rail_titles.md`, `frontend/src/components/editors/Info.tsx`, `frontend/src/components/editors/NodeEditor.tsx`, `frontend/src/components/editors/PropertiesWithTreeView.tsx`, `frontend/src/components/editors/info-improvements.scss`, and 1 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `de63372dd` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 9415 tests in 384 files, 9 red at import, hooks 936; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: Chat: 3001 loads and opens a project, no regression seen; frontend tree at de63372dd identical to the shell-ui-s7 tip 6422e7af1 checked on 3017 (titles sentence case 12px/500, rail and canvas rects unchanged, console init_dash only).
**Notes**: Rollback tag `pre-shell-ui-s7` on `515ca7689` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-19-1926/result.json`.
**Prompt document name**: 2026-10-19 19:26

## 2026-10-19 — feat: rail density, 24px targets, muted icons, outer borders (S8)
**Prompt**: P-2026-10-19-1930, slice S8 of the shell front (R-SHELL-2, R-SHELL-3, R-SHELL-5): rail tree rows on `--shell-row-height` (26 Basic, 24 Advanced); rail targets at least 24x24 by `elementFromPoint` without moving the layout; row-action and focus-bar icons muted in Advanced only; rail and palette outer borders to 1px `--shell-border` together; `.jj-section-title` in the rail to `--shell-text-3`, 500.
**Files touched**: frontend/src/components/editors/properties-with-tree-view.scss, frontend/src/components/editor-v2/EditorV2.scss (05bfba8f3); docs/log-inbox/shell-ui.md, docs/prompts/claude_2026-10-19_1930_prompt_shell_ui_s8_rail_density.md (Status line)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato
**Notes**: DemoPetri 1600x1000, 4 states x2 modes: rects unchanged; rows 26/26->26/24; corner-test misses B 8/10/3/9->1/1/0/1, A 9/10/3/9->2/2/0/2 (23px headers); borders rgba(0,0,0,.06)->rgb(226,232,240) both; Advanced icons #64748b; title 600/#94a3b8->500/#64748b; text<11px 0, clipped and console unchanged. Chat GO on 3018 (ShellCheck), misses on neighbours accepted. Unattended 1-6 in handoff.md. Gates: typecheck 0, vitest 85/85, build 0, smoke GREEN 12/0/3.
**Prompt document name**: 2026-10-19 19:30

**Ticket** (P-2026-10-19-1930): two hit-target overlaps left for a later lane. `.tree-section__header` is 23px, so neighbouring toggle boxes overlap by 1px; set its min-height to `--shell-row-height`, which moves the tree by 1-3px per header. The `.jj-contents-add` box also loses its top 2px to `.jj-contents-group-header`.

## 2026-10-19 — merge: shell-ui-s8 into alfonso-frontend-jjtl (P-2026-10-19-2019)
**Prompt**: `claude_2026-10-19_2019_prompt_merge_shell-ui-s8.md`, a direct merge by `lane-run merge --direct`, no session: `shell-ui-s8` at `41b25c723` into `alfonso-frontend-jjtl`, merge base `4f560e9a8`, 2 commits on the branch side.
**Files touched**: merge `792969efa`: 4 files from the branch side (`docs/log-inbox/shell-ui.md`, `docs/prompts/claude_2026-10-19_1930_prompt_shell_ui_s8_rail_density.md`, `frontend/src/components/editor-v2/EditorV2.scss`, `frontend/src/components/editors/properties-with-tree-view.scss`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `792969efa` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 9415 tests in 384 files, 9 red at import, hooks 936; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: Chat: frontend tree at 792969efa identical to the shell-ui-s8 tip 41b25c723 checked on 3018 (rows 26/24, outer borders both 1px #e2e8f0, jj-section-title 11px/500/#64748b, rects unchanged, console init_dash only).
**Notes**: Rollback tag `pre-shell-ui-s8` on `4f560e9a8` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-19-2019/result.json`.
**Prompt document name**: 2026-10-19 20:19
