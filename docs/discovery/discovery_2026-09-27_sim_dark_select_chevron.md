# Discovery 2026-09-27 — the doubled chevron of the simulation panel's selects in dark

- Prompt-ID: P-2026-09-27-1501 (`docs/prompts/claude_2026-09-27_1501_prompt_sim_dark_select_chevron.md`), fast lane
- Session: 1d1e6d30-6a12-445f-8166-095b48dff11a (read from `~/.jjodel-lanes/P-2026-09-27-1501/session.txt`)
- Tree: `~/jjodel-open`, branch `sim-dark-select-chevron`, HEAD at discovery `2f42f2704`; fix `50c198da5`
- Executor: Opus 5.5 (`claude-opus-5-5`)
- This report is a set of hypotheses with evidence, not a reference. Whoever uses it re-reads the files.

## 1. Hypotheses under test

1. **H1** — two rules each set `appearance: none` plus a `background-image` arrow. **Falsified** (measured): no
   rule that matches the table's selects sets `appearance: none`; the computed `appearance` is `auto` in both
   themes, so the native chevron always paints (§3, R1).
2. **H2** — a dark-theme rule adds a second background layer on `select`. **Holds** (measured): in dark
   `[data-theme="dark"] select` adds an SVG arrow as `background-image`, and it outranks the panel's rule (§3, R3 R4).
3. **H3** — the defect is limited to the declarations table. **Falsified** (measured): the rule matches every
   `select.sim-panel__select` of the panel; the dark panel crop before the fix shows the arrows on all the role
   selects too (`before_dark_panel.png`).

## 2. Method

- Probe `frontend/scripts/smoke/_tmp_chevron_probe.ts` (gitignored), with `_tmp_chevron_common.ts` and
  `_tmp_chevron_scenario.js` copied read-only from `~/jjodel-sim/frontend/scripts/smoke/_tmp_demo2_common.ts` and
  `_tmp_demo2_scenario.js`; the common differs only in BASE (3014) and `deviceScaleFactor: 2`. Vite config
  `_tmp_chevron_vite.config.ts`, port 3014, started and stopped by `lane-run probe --port 3014`.
- Steps: the ESM preset (`DemoESM`), profile «Extended state machine», Apply, Configure…, Data, one declaration
  (`coins`, domain `range`). Then per theme, light first: `ThemeService.set(theme)` through the page's own module
  (the attribute lives on `document.documentElement`, `frontend/src/services/ThemeService.ts:33`
  `document.documentElement.setAttribute('data-theme', theme);`), blur, mouse to the corner, then computed styles
  of the four table selects and of their `::before` / `::after` and their parent's, the list of stylesheet rules
  that match the «Stored or derived» select and declare a background or an appearance, and 2x crops.
- Logs: `~/.jjodel-lanes/P-2026-09-27-1501/probe-before.log` (on `2f42f2704`), `probe-after.log` (on the edit,
  then committed as `50c198da5`), both `EXIT=0`. Crops: `~/.jjodel-lanes/shots_chevron/{before,after}_{light,dark}_{select_form,select_kind,decl_row,panel}.png`.

## 3. Findings

Rules that match `select[aria-label="Stored or derived, state attribute 1"]` and declare a background or an
appearance, from the stylesheet walk (measured on `2f42f2704`; `_form-system.scss` is compiled into the
`style.scss` sheet by `frontend/src/styles/style.scss:2` `@import "./components/form-system";`):

| # | Rule | Specificity | Declares | Applies |
|---|---|---|---|---|
| R1 | `frontend/src/styles/style.scss:30` `button, input, select, textarea {` … `:34` `appearance: auto;` | 0,0,1 | appearance | both themes |
| R2 | `frontend/src/components/editor-v2/sim/simulation-panel.scss:286` `&__select {` … `:293` `background: var(--color-bg-primary);` | 0,1,0 | background shorthand (image `none`) | both themes |
| R3 | `frontend/src/styles/components/_form-system.scss:698` `[data-theme="dark"] {` … `:733` `select,` … `:735` `background: var(--form-input-bg);` | 0,1,1 | background shorthand | dark |
| R4 | `frontend/src/styles/components/_form-system.scss:759` `// Select arrow dark mode` `:760` `select {` `:761` `background-image: url("data:image/svg+xml,…fill='%2394a3b8' d='M3 4.5L6 7.5L9 4.5'…");` | 0,1,1 | background-image | dark |

- **Light** (measured): only R1 and R2 match. Computed `background-image: none`, `appearance: auto`, background
  `rgb(248, 250, 252)`. One arrow, the native one. The global light SVG select rules are inside comments
  (read: `_form-system.scss:134` `/*` to `:184` `*/`; `style.scss:437` `/*` opens the block after `:428` `select {`,
  which sets only padding and radius).
- **Dark** (measured): R1 to R4 match. R3 and R4 at 0,1,1 beat R2 at 0,1,0. R3's shorthand resets
  `background-repeat` to `repeat` and `background-position` to `0% 0%` (computed `0% 0%`), R4 sets the 12×12 SVG:
  the arrow tiles across the whole box, beside the native chevron that R1 keeps. Computed `background-image: url("data:image/svg+xml,…")`
  on the four table selects; background `rgb(30, 41, 59)`. The crop `before_dark_select_form.png` shows two rows
  of small arrows over «stored» and the native chevron at the right edge; the ticket's «doubled chevron» is this.
- **Pseudo-elements** (measured): `::before` / `::after` of each select and of its parent `.sim-panel__decl-line`
  compute `content: none` in both themes, before and after. Positive control, same reader, run in the after
  probe: the remove button's `.bi::before` returns a content, so the reader has signal.
- **The prompt's grep** (measured): `command grep -rn "chevron" frontend/src --include='*.scss'` (BSD grep, exit
  0; the unquoted `--include=*.scss` of the prompt fails in zsh with `no matches found`) returns icon classes
  (`.jj-section-chevron`, `__chevron`, `.bi-chevron-down`, …); none is a rule on a `select` inside `.sim-panel`.
  The stylesheet walk above is the stronger evidence: it lists every matching rule with a background or an
  appearance, and it has signal (2 rules in light, 4 in dark).

## 4. The fix and what it changes

`frontend/src/components/editor-v2/sim/simulation-panel.scss:314` `& &__select {` `:315` `background-image: none;`,
compiled `.sim-panel .sim-panel__select`, 0,2,0, above R4's 0,1,1. Theme-independent: light already computes
`none`, so the rule is inert there. No global file touched, no rename.

Measured after (`probe-after.log`):
- Dark: `background-image: none` on the four table selects and on all 21 `select.sim-panel__select` of the open
  panel; the crops show one chevron per select (`after_dark_select_form.png`, `after_dark_panel.png`).
- Light: `none` on all 21, as before. The four light crops are byte-identical to the baseline (`cmp`, and
  SHA-1 equal: `select_form` `b956c383…`, `select_kind` `c96320a1…`, `decl_row` `cf834100…`, `panel` `d0f282e3…`).

## 5. Dependencies and risks

- R3 also sets the dark background colour of the panel's selects (and, through `input`, of its text cells) to
  `--form-input-bg` `rgb(30, 41, 59)` instead of R2's `var(--color-bg-primary)`. Unchanged by the fix, before and
  after (measured); the selects and inputs of the table stay consistent with each other. Noted, not a ticket.
- R4 hits every unscoped `select` in dark that does not restate `background-image` above 0,1,1; other panels of
  the app may show the same tiled arrow. Not measured outside `.sim-panel`; out of this lane's scope.
- The cited `docs/discovery/discovery_2026-09-27_sim_demo_readiness_2.md` is not in this tree (its commit
  `a41e63496` is on `alfonso-frontend-jjtl` but not an ancestor of HEAD); §12 was read with `git show` (RC-10).
  Lane C1's dark screenshots were not consulted: the defect reproduced on this tree.

## 6. Decisions taken (unattended)

1. The rule covers every `.sim-panel__select`, not only the four of the declarations table: the same cascade
   paints the same arrows on the role selects (H3), and a narrower selector would leave them.
2. Theme-independent rule rather than a `[data-theme="dark"]` one: light is inert (measured), and the component
   file stays free of theme selectors.

## 7. Decisions awaiting Alfonso

None (no item of the RC-26 list).
