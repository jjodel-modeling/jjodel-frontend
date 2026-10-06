# Discovery 2026-10-02 — what a coloured node draws outside its box keeps the notation ink

Prompt-ID: P-2026-10-02-2356 (`docs/prompts/claude_2026-10-02_2356_prompt_ir_ink_outside.md`), chat C-2026-10-01-2220.
Session: `4f3489dd-c40e-4a29-9642-00057dc308be`. Tree `~/jjodel-w-inkout`, branch `ir-ink-outside`, HEAD `850718308`
(docs only on top of `7c9ae4e0d`: the code read is the trunk's at `7c9ae4e0d`). Executor: Opus 5.5 (`claude-opus-5-5`).
This report is a set of hypotheses with evidence, not a reference: whoever uses it re-reads the real files.
Tags: [R] read in a file, [M] measured in a run (none in this phase: the measures quoted are P-2026-10-02-2045's).

## 0. Answer in brief

- **Cause** [R]: `metaclassColoringVars` rebinds `--color-inode-name` to the text colour inline on `.ir-node-content`
  (`metaclassPalette.ts:474`, applied at `IRNodeContent.tsx:499`), and the root also takes `color: colorOverride.text`
  (same line). Every child resolves against those: the outside label in `var(--color-inode-name)` (classic Petri
  place, `viewpointDerivation.ts:934`), an outside label with no colour of its own (it inherits the root's `color`),
  and the entry mark, painted in `markerColor`, which is the text colour itself while coloured (`IRNodeContent.tsx:526`).
- **Canvas-side marks found** (§3): the outside labels (`.ir-label--outside`) and the entry mark (`.ir-entry-svg`). No
  other: the native card and pill draw nothing outside their box in an inode token, the problem indicator paints its
  own colours, the run-state dot and count are siblings of `.mm-node`, the collapse chip a sibling of `.ir-node-content`.
- **Fix** (§4), smallest exact one, no class, prop, token or function renamed:
  1. A token `--color-canvas-ink: var(--color-inode-name);` in `_colors-light.scss` and `_colors-dark.scss`, beside
     the name ink. Declared at `:root`, it is resolved there, so a node that rebinds `--color-inode-name` cannot reach it.
  2. `metaclassOutsideInkVars()` in `metaclassPalette.ts`, beside `metaclassColoringVars`: `{ '--color-inode-name':
     'var(--color-canvas-ink)' }`, the rebinding undone, for the outside marks only.
  3. `IRNodeContent.tsx`, only while coloured: the outside label and the entry layer carry those vars; the entry mark
     paints in its uncoloured colour (`borderColorV || var(--border-default)`); an outside label restates the node-level
     text colour, if the view declares one; the root keeps the tokens but no longer sets `color`, and the badges, the
     only in-box surface that inherited it, state it as labels and compartments already do (`overText`).
  4. `irStyle.ts`: unchanged (a custom property declared there would break rule 28, and no rule needs to move).
- **Inside the box unchanged** (§3.2): labels, compartments, row values, the inside marker, the outline and the badges
  keep the WCAG text colour of R-VP-30. Glyph nodes (R-VP-50) receive no override, so none of this reaches them.
- **Dark** (§5): the token is the dark name ink, `rgba(255, 255, 255, 0.92)`; the probe reads `getComputedStyle` of the
  label's `color` and of the entry `circle`/`path` `fill`/`stroke` with `data-theme="dark"` on `<html>`.
- **Persisted data** (§6): none. The IR stores the string `var(--color-inode-name)`; it is untouched. No scene file,
  no VersionFixer migration, no IR key.
- Decision row **R-VP-51**: free on every local branch (§7).

**Decisions awaiting Alfonso**: none beyond the visual GO (it changes what the demos show).

**Questions** (each with one recommendation; the cascade proceeds on them under RC-21):
1. An outside label with no colour of its own inherits the root's `color`, which the coloring sets to the text colour.
   Recommended: the root stops setting `color`; badges restate it, so the label inherits exactly what it does off.
2. Token form. Recommended: an alias of `--color-inode-name` declared in both theme blocks, not a copy of its values,
   so the outside marks cannot drift from the off state.
3. Outside marks painted in another rebound token (`-quiet`, `-label`, `-footer`, `-surface`, `-border`) still follow
   the coloring. Recommended: not covered; no derivation or default reaches a coloured node with one (§3.3).
4. Entry mark colour while coloured. Recommended: the uncoloured one (border ink), as R-VP-50's Q5 recommended.
5. Token name `--color-canvas-ink`. Recommended: yes, free (§7), beside `--color-canvas-accent`.
6. Decision id. Recommended: R-VP-51.

## 1. Hypotheses under test

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | The outside marks follow the coloring only through the inline rebinding on `.ir-node-content` | **holds** [R]: `metaclassPalette.ts:474`, `IRNodeContent.tsx:499`, `:526` |
| H2 | The only canvas-side marks drawn in a rebound ink are the outside labels and the entry mark | **holds** [R], §3.1 |
| H3 | One token, used by the outside marks, is enough | **partly**: it fixes every mark in the name ink; an outside label with no colour inherits the root's `color`, which the token does not reach (Q1) |
| H4 | The fix needs persisted data, a scene file or a migration | **falsified** [R], §6 |
| H5 | The Q5 attempt of P-2026-10-02-2045 failed because the ink token was rebound above the mark | **holds** [R]: `discovery_2026-10-02_vp_glyph_nocolor.md` §8 |

### 1.1 Files read (paths under `frontend/src/`)

`view/viewPoint/metaclassPalette.ts:410-479`; `components/editor-v2/viewpoint/ir/IRNodeContent.tsx` (`:100-260`,
`:440-834`); `components/editor-v2/viewpoint/ir/irStyle.ts` (whole); `components/editor-v2/nodes/ObjectNode.tsx`
(`:925-975`, `:1175-1300`); `components/editor-v2/viewpoint/derive/viewpointDerivation.ts` (`:125-140`, `:630-670`,
`:880-975`); `styles/tokens/_colors-light.scss:60-80, :435-460`; `styles/tokens/_colors-dark.scss:1-12, :330-350`;
`components/editor-v2/EditorV2.scss:1820-1840, :2850-2862`; `components/editor-v2/_themes.scss` (grep);
`components/editor-v2/sim/simNodeRunState.scss:110-140`; `components/editor-v2/problems/NodeProblemIndicator.scss`
(grep); `components/editor-v2/viewpoint/authoring/TextStyleEditor.tsx:275-310`;
`components/editor-v2/viewpoint/ir/__tests__/irA1Render.test.ts:1-140`;
`components/editor-v2/nodes/__tests__/irGlyphNoColor.test.ts:1-80`; `components/editor-v2/__tests__/lightThemeLegibility.test.ts:1-80`.
Docs: `CLAUDE.md`, `frontend/src/components/editor-v2/CLAUDE.md`, `docs/PROTOCOL.md` P16, `docs/decisions.md`
R-VP-22, R-VP-27..31, R-VP-37..39, R-VP-50, `docs/discovery/discovery_2026-10-02_vp_glyph_nocolor.md`.

## 2. The mechanism

- `metaclassPalette.ts:467-479` (verbatim): `'--color-inode-surface': o.fill, '--color-inode-border': rule, ...
  '--color-inode-name': o.text, '--color-inode-label': o.text, '--color-inode-quiet': o.text, '--color-inode-footer': o.text`.
- `IRNodeContent.tsx:499`: `if (colorOverride) Object.assign(inlineStyle, { color: colorOverride.text }, metaclassColoringVars(colorOverride));`
- `IRNodeContent.tsx:500-501`: `const overText = (st, position?) => colorOverride && position !== 'outside' ? { ...st, color: colorOverride.text } : st;`
  — the outside label is already exempt from the forced colour, but its own `color: var(--color-inode-name)` resolves
  against the rebound token, and without a colour it inherits the root's.
- `IRNodeContent.tsx:526`: `const markerColor = colorOverride ? colorOverride.text : (borderColorV || 'var(--border-default)');`
  used by the inside marker (`:586-587`) and the entry mark (`:597-599`).
- Off, an IR node's text colour comes from `.mm-node { color: var(--text-primary) }` (`EditorV2.scss:1835`), a scheme
  token (`_themes.scss:40` dark `rgba(255, 255, 255, 0.9)`, `:198` light `#1e293b`), not the name ink: so an
  unstyled outside label is not «in the name ink» off, and painting it in the new token would not be «as off» (Q1).
- Measured by P-2026-10-02-2045 on 3097, light, at `1ff8ab314`: the Initial's entry mark of DemoPEST on Statechart (UML)
  and the outside name of a DemoPetri place on Petri net (classic) go from `rgb(15, 23, 42)` to `rgb(0, 0, 0)`.

## 3. Where the ink is painted

### 3.1 Outside the box (canvas side)

| File:line | Selector / element | Draws | Ink while coloured today |
|---|---|---|---|
| `IRNodeContent.tsx:647-651`, `irStyle.ts:228-238` | `.ir-label.ir-label--outside.ir-label--anchor-*` | outside label (Petri classic place `viewpointDerivation.ts:934`, transition `:963`; any authored `position: 'outside'`) | own colour against rebound tokens, or the root's `color` |
| `IRNodeContent.tsx:630-637` | `input.ir-label__input.ir-label--outside` | the same label while edited | same |
| `IRNodeContent.tsx:595-600`, `irStyle.ts:242-243` | `svg.ir-entry-svg` | entry dot, line, arrowhead (Statechart (UML) Initial, `viewpointDerivation.ts:666`) | `colorOverride.text` |

Not affected [R]: `NodeProblemIndicator.scss` (own ground, `color: white`, `:52`); `simNodeRunState.scss:130`
(`.sim-node-run__count`, mounted as a sibling of `.mm-node`, `ObjectNode.tsx:990` `<SimNodeRunState …/>` after the
IR wrapper); `.ir-collapse-chip` (a sibling of `.ir-node-content`, `ObjectNode.tsx:966-975`, `color: #334155`);
`RendererInspector.tsx:169` and `InlineObjectSelect.tsx:133` (portals); edges (not node descendants). The native
card and pill (`ObjectNode.tsx:1186`, `:1244`) carry the vars on `.mm-node` and draw nothing outside their box in an
inode token (`command grep -rn "color-inode-" src --include='*.scss'`, every hit read: header, slots, footer, pill;
control: the same grep finds `instanceNode.scss:103`).

### 3.2 Inside the box, keeps the text colour (R-VP-30)

Inside labels (`overText`, `:637`, `:651`), compartments (`:684`, `:703`), row values (rebound tokens on the root,
`instanceNode.scss:103-398`), the inside marker (`markerColor`, `:586-587`), outline and fill (`:459`, `:506-507`),
the bar's centred label and halo (`irStyle.ts:215`, `--color-inode-surface`), the badges (`:607`, `:613`, inherit the
root's `color`: the one surface the fix must make explicit, Q1).

### 3.3 Producers of an outside mark in another rebound token

`viewpointDerivation.ts:963` (classic Petri transition label, `EDGE_LABEL_STYLE()` = `--color-inode-quiet`): the
node is a bar, a glyph by R-VP-50, never coloured. `irDefaults.ts:40-261`: no outside label, no entry. The authoring
colour field writes a hex or nothing (`TextStyleEditor.tsx:283-301`, `ColorPicker`, «Default» = undefined). `entry`
is set only by the derivation (`viewpointDerivation.ts:666`; `command grep -rn "\.entry\b\|entry?:\|'entry'"` under
`viewpoint/`, the authoring folder has no hit; control: the same grep finds `irCompile.ts:573`). Reachable only by
editing a derived transition's form away from `bar`: then its quiet outside label follows the coloring (Q3).

## 4. The fix, and the alternatives

Recommended, as in §0. Diff estimate: 2 token lines, one 6-line function, about 12 changed lines in `IRNodeContent.tsx`.

- **Rejected: paint the outside marks in `var(--color-canvas-ink)` directly.** Same on the demos; an unstyled outside
  label would go from `#1e293b` to `#0f172a` (light) and `rgba(255,255,255,.9)` to `.92` (dark) against off: not exact.
- **Rejected: the coloring rebinds a narrower token.** The native card and pill paint the name through
  `--color-inode-name` (`instanceNode.scss:103`, `:797`) with the same vars (`ObjectNode.tsx:1186`, `:1244`): narrowing
  would recolour the native nodes or need a second rebinding map.
- **Rejected: the restoring rule in `irStyle.ts`** (`.ir-label--outside { --color-inode-name: … }`): a custom property
  declared in a component file (rule 28), and active with coloring off too, which would change the off markup's paint
  path for nothing.
- Why Q5 failed and this does not: Q5 changed only the colour string (`borderColorV`), which still resolved against
  the rebound token one element up. Here the outside element itself rebinds the token back, to a value computed at
  `:root`, where no node can reach.

## 5. Dark theme

`_colors-dark.scss:344` `--color-inode-name: rgba(255, 255, 255, 0.92);` under `:root[data-theme="dark"]` (`:9`).
The alias declared there resolves to it. The light block is `:root, :root[data-theme="light"]` (`_colors-light.scss:75-76`),
so the light line alone would already reach dark: the dark line keeps the two blocks parallel, as every inode token is,
and a mutation that drops it is expected to be equivalent (reported as such by the bench, not hidden). Probe: the
theme set by `document.documentElement.setAttribute('data-theme', 'dark')`, as `ThemeService.ts:33` does; measured
values are `getComputedStyle(el).color` for labels, and `fill`/`stroke` of the entry's `circle` and `path`.

## 6. Persisted data

The derived IR stores the ink as the string `var(--color-inode-name)` (`viewpointDerivation.ts:131`), persisted in
`DViewElement.ir`; the fix changes no IR value, no key, no `metaclassColoring` field (R-VP-28) and no scene. The new
token lives only in the stylesheet. Exported viewpoints carry the same string. No VersionFixer migration.
Search: `command grep -rIl --exclude-dir=node_modules --exclude-dir=.git "color-inode-name" .`: hits only in `src/`
(code, styles, tests) and docs; none in a scene, fixture JSON or `public/`.

## 7. Dependencies and risks

- Names [M, this phase]: `command grep -rIl --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist` from the
  repo root: `color-canvas-ink` 0 files, `metaclassOutsideInkVars` 0; controls `color-canvas-accent` 24,
  `metaclassColoringVars` 12.
- Decision id [M]: `**R-VP-5x**` in `docs/decisions.md` of every local branch: only R-VP-50 (`alfonso-frontend-jjtl`,
  `elk-layout-disc`, `ir-ink-outside`, `vp-glyph-nocolor`); `elk-layout-disc` holds R-VP-40..49. R-VP-51 is free.
- `IRNodeContent.tsx` is in `viewpoint/ir/` (§3.1 table) but touches no sync file and dispatches nothing: Layer Impact
  Report below. The root losing `color` while coloured is the one change inside the box; the probe compares inside
  text against `7c9ae4e0d`.
- The vitest bench runs in node without a cascade: the tests render the markup and resolve it through a small model of
  custom-property inheritance seeded with the two token files, so a rebound token is measured, not grepped. The pixels
  and the real cascade are the probe's.

```
LAYER IMPACT REPORT
Layers touched:
  [ ] D-layer  [ ] L-layer  [ ] JjOM  [x] Canvas v2-flow (IRNodeContent paint)
  [ ] Canvas classic  [ ] Sync layer  [ ] Persistence
Canvas v2-flow — What changes: while coloured, the outside labels and the entry layer of an IR node
  rebind --color-inode-name to --color-canvas-ink; the entry mark paints in its border ink; the root
  stops setting `color`, the badges state the text colour. What does NOT change: node sizes, handles,
  the resolver, the palette, any IR key, the off markup. Cross-layer: none (no selector, no action).
Smoke scenarios: DemoPetri on Petri net (classic), DemoPEST on Statechart (UML), coloring on and off,
  light and dark; the four demo scenes in the default viewpoint, coloring off, 0 px.
```

## 8. Open questions

See §0, questions 1-6, each with its `Recommended:` line.

## 9. Addendum, Phase 2 (2026-10-03)

Measured on the lane's code `cce1ecfef`; the base run on the code of `7c9ae4e0d` (the four code files put back in the
working tree for the run, then restored byte for byte; `git diff 7c9ae4e0d` of `src/` empty during the run).

**What changed against §0.** Nothing in the design. One measurement correction: the dark rule
`:root[data-theme="dark"]` exists in two stylesheets of the dev page (the token file is imported twice); the
mutation check removes the token from both.

**Measures.**
- Tests: `nodes/__tests__/irInkOutside.test.ts` (16). On `7c9ae4e0d` 8 of 16 fail (the two outside-label and the two
  entry-mark cases in light and dark, the unstyled and the node-level-colour outside labels in both themes), 8 pass
  (inside text, badge, off pins, glyph control). After the change 16 of 16 pass. The markup is resolved through a
  model of custom-property inheritance seeded with the two token files compiled by sass, not grepped.
- Mutation bench (gitignored `frontend/scripts/smoke/_tmp_inkout_bench/bench.mjs`): **13/14 killed**. Killed: the
  token rebound by the coloring; the token missing in light; inside labels sent down the outside branch; inside text
  painted in the canvas ink; the entry mark back in the text colour; the entry layer without the restored ink (the Q5
  attempt); the outside label without the restored ink; without the node-level colour restated; the root keeping the
  text colour; badges without it; the restore applied with coloring off; the restore pointing the ink at itself; the
  entry mark painted in the canvas ink regardless of its border. **Survived**: the token missing in dark, an
  equivalent mutant as §5 predicted (the light block is `:root`); measured equivalent in the browser too (below).
- Gates: typecheck exit 2, 14 errors, the §17 set by file and code; vitest 269 files, 6711 of 6711 tests, the 9 known
  files red at import (`window is not defined`); build exit 0.
- Lane probe on 3098 (`_tmp_inkout_probe.ts`, 1600×1000, DPR 2). Base run 20/20 shows the defect: with coloring on,
  the four outside labels of DemoPetri on Petri net (classic) and the Initial's entry mark of DemoPEST on Statechart
  (UML) paint `rgb(0, 0, 0)`, in light and in dark (black on the `#1e293b` canvas). After run **50/50**:
  - Light: outside labels `p1 p2 p3 lock` and the entry dot, line and head `rgb(15, 23, 42)` with coloring on and off.
  - Dark: the same marks `rgba(255, 255, 255, 0.92)` on and off.
  - Places coloured (`rgb(243, 223, 203)`, the resolver's `#f3dfcb`); the six PEST nodes in their swatch, inside
    labels `rgb(0, 0, 0)`, the resolver's text colour, in both themes.
  - Coloring on: fill, border, inside labels, rows, badges and marker of every node equal to the base run; coloring
    off: every colour read equal to the base run.
  - Glyphs (R-VP-50): the classic transition bars `t1..t3` paint on as off (`rgb(51, 65, 85)`, label light
    `rgb(100, 116, 139)`, dark `rgba(255, 255, 255, 0.3)`).
  - The token dropped from both dark rules in the browser, coloring on: the outside labels still
    `rgba(255, 255, 255, 0.92)`.
  - The four demo scenes in the default viewpoint, coloring off, light and dark: 0 px from the base run (8 of 8
    byte-identical shots). Control: two different scenes differ by 348100 px.
  - Crops `sips -Z 600` in `frontend/scripts/smoke/_tmp_inkout_crops/` (gitignored), `ink_{base,after}_*_600.png`.
- Decision row R-VP-51 (§7).
