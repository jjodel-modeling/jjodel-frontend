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
