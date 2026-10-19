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
