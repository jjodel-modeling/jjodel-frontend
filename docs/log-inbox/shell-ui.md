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
