# Discovery — the default object view paints the abstract node's fill

Prompt: `docs/prompts/claude_2026-09-22_2105_prompt_ir_default_fill.md` (P-2026-09-22-2105), Phase 1
(read-only). Worktree `~/jjodel-release`, branch `alfonso-frontend-jjtl`, HEAD `b7b8cbde3` at the
time of this report. `~/jjodel` (branch `validation-skeleton`) and `~/jjodel-sim`
(`simulation-engine`) untouched.

## Objective

Confirm whether the native M1 instance node's fill (`.mm-node.mm-object`, `instanceNode.scss:29`,
`background: var(--color-inode-surface)`) responds to color schemes and notations, and whether
`defaultObjectViewIR()` — which currently sets no `shape.fill` — can be given
`fill: 'var(--color-inode-surface)'` for parity without repeating the R-IRN-33 regression
(migrated-view identity breaking silently when the live factory shape changes).

## Files read (full paths)

- `frontend/src/components/editor-v2/viewpoint/ir/irDefaults.ts`
- `frontend/src/components/editor-v2/viewpoint/ir/irCreationSeed.ts`
- `frontend/src/components/editor-v2/viewpoint/ir/irKindConvert.ts`
- `frontend/src/components/editor-v2/viewpoint/ir/irCompile.ts`
- `frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx`
- `frontend/src/components/editor-v2/viewpoint/ir/irStyle.ts`
- `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts` (fill / color axis shape, spot-read)
- `frontend/src/components/editor-v2/viewpoint/authoring/EnableIRPanel.tsx` (full vertex path,
  lines 1-115)
- `frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx` (spot-read,
  seed fallback)
- `frontend/src/components/editor-v2/nodes/ObjectNode.tsx` (branch selection: delegated-native /
  IR-interpreter / pill / full-native, lines ~95-140, ~855-935, ~1140-1200)
- `frontend/src/components/editor-v2/nodes/instanceNode.scss`
- `frontend/src/components/editor-v2/_color-schemes.scss` (full file)
- `frontend/src/components/editor-v2/_notations.scss` (full file)
- `frontend/src/components/editor-v2/_themes.scss` (full file — **not** in the prompt's DOVE list;
  read because it turned out to be the actual base definer of `--node-bg`, see Finding 1)
- `frontend/src/styles/classic-object-view.scss` (header + relevant selectors)
- `frontend/src/styles/tokens/_colors-light.scss` (full file)
- `frontend/src/styles/tokens/_colors-dark.scss` (full file)
- `frontend/src/redux/VersionFixer.tsx` (spot-read, line 1039, the migration call site)
- `frontend/src/components/editor-v2/EditorV2.tsx` (spot-read: root className construction,
  `notation`/`colorScheme` state — lines ~912-978, ~4268)
- `docs/decisions.md` R-IRN-29..36 (full block)
- `docs/discovery/harness/probe_2026-09-19_ir_vs_native_object_style_parity.mts` (reused as the
  base for this report's runtime probes)
- `docs/claude-code-log.md` (last ~15 entries, for context/conventions)

Discovery-only additions **not** in the prompt's declared DOVE, both read-only in effect:
- `frontend/src/components/editor-v2/_themes.scss` — needed to explain a runtime number that
  contradicted a first grep pass (Finding 1).
- Two throwaway Playwright probes, kept in the session scratchpad, **not committed**:
  `probe_ir_default_fill.mts` and `probe_classlist.mts` (methodology in Finding 2).

## Finding 1 — the rule painting `.ir-node-content` with no fill (Phase 1 step 1)

`frontend/src/components/editor-v2/viewpoint/ir/irStyle.ts:72`:

```
.ir-node-content { box-sizing: border-box; background: var(--node-bg); border: 1px solid var(--border-default); border-radius: 4px; ... }
```

`--node-bg` is a **different** custom property from `--color-inode-surface` (the one
`.mm-node.mm-object` reads). Three places touch it:

- `frontend/src/components/editor-v2/_themes.scss:57,215` — the BASE value, one per theme, emitted
  on `.editor-v2.theme-dark` / `.editor-v2.theme-light` (and mirrored onto `:root` /
  `:root[data-theme="dark"]` for portals) via a `@each` loop over a Sass map. `'node-bg': #ffffff`
  (light), `'node-bg': #334155` (dark). **This is why a first repo-wide grep for the literal
  `--node-bg:` looked incomplete** (`§ Methodology note` below) — the base value is generated from
  a Sass map key (`'node-bg':`), not written as a literal custom-property declaration.
- `frontend/src/components/editor-v2/_color-schemes.scss:358,384` — `scheme-print` overrides it:
  `transparent` (dark), `#ffffff` (light).
- `frontend/src/components/editor-v2/_notations.scss:47` — `notation-wireframe` overrides it:
  `transparent` (both themes — the rule doesn't key off theme).

`--color-inode-surface` is defined **only** in `styles/tokens/_colors-light.scss:446` (`#ffffff`)
and `styles/tokens/_colors-dark.scss:341` (`#334155`, comment: *"the canvas node ground, =
--node-bg dark"*). Full-repo grep (`command grep -rn -- "color-inode-surface"`, no `--include`
filter, so the ugrep-wrapper's gitignore-skip and glob-as-literal traps from CLAUDE.md §5 don't
apply) finds five hits total: the two token definitions and three consumers, all in
`instanceNode.scss` and `rendererInspector.scss` — never a scheme or notation file. The dark-theme
comment records that the two properties were **deliberately set to the same value** for the
default theme, which is exactly why R-IRN-29's zero-delta background measurement (2026-09-19) is
consistent with this report's finding that they diverge elsewhere (Finding 3): that measurement
only ran under the default scheme, where the coincidence holds.

## Finding 2 — runtime measurement table (Phase 1 step 2)

Methodology: two throwaway Playwright probes against the dev server on `:3001` (confirmed via
`lsof -p <pid>` that `:3001`'s process cwd is `/Users/alfonso/jjodel-release/frontend`, `:3000`
belongs to `~/jjodel`). `frontend/node_modules` does not exist in this worktree; per
`docs/PROTOCOL.md` P14 a temporary symlink to `~/jjodel/frontend/node_modules` was created, `git
status` verified empty before and after, and the symlink was removed once the probes were done.

First probe attempt used `localStorage.setItem('editor-v2-notation', ...)` + `page.goto` to the
*same* project URL to force a remount (notation/colorScheme are `useState` seeded from
`localStorage` only at mount). Measured that this is a no-op in Chromium — `window` globals and
in-memory state survive a `page.goto` to an unchanged URL (a same-document navigation), so the
component never remounts and the localStorage write never takes effect. Switched to
`page.reload()`, which forced a real reload but needed a full project-data settle wait
(`NAV_MS + SETTLE_MS`, the same the project's first navigation uses) before `DockManager.open2`
would resolve the model pointer.

A second, simpler probe drives the same comparison by toggling classes directly on `.editor-v2`
(`classList.add/remove`) — no remount needed, since scheme/notation only matter as CSS class
selectors once applied; this is what produced the numbers below for print/wireframe.

| Condition | `--node-bg` (resolved) | `--color-inode-surface` (resolved) | Native `.mm-node.mm-object` `background-color` | IR-default `.ir-node-content` `background-color` (current factory, no fill) |
|---|---|---|---|---|
| default scheme / uml notation, **light** | `#ffffff` | `#ffffff` | `rgb(255, 255, 255)` (measured) | `rgb(255, 255, 255)` (measured) |
| default scheme / uml notation, **dark** | `#334155` | `#334155` | `rgb(51, 65, 85)` (measured) | `rgb(51, 65, 85)` (measured) |
| `scheme-print`, **light** | `#ffffff` | `#ffffff` | `rgb(255, 255, 255)` (derived, see note) | `rgb(255, 255, 255)` (measured) |
| `scheme-print`, **dark** | `transparent` | `#334155` | `rgb(51, 65, 85)` (derived, see note) | `rgba(0, 0, 0, 0)` (measured) |
| `notation-wireframe`, **light** | `transparent` | `#ffffff` | `rgb(255, 255, 255)` (derived, see note) | `rgba(0, 0, 0, 0)` (measured) |
| `notation-wireframe`, **dark** | `transparent` | `#334155` | `rgb(51, 65, 85)` (derived, see note) | `rgba(0, 0, 0, 0)` (measured) |

Note on the "derived" native cells: not independently re-measured under print/wireframe in this
run (the classlist probe measured the IR side and the two custom properties on `.editor-v2`, not
`.mm-node.mm-object` again). They are stated with high confidence, not assumed, on two independent
grounds: (1) `instanceNode.scss` has exactly one rule touching `.mm-node.mm-object`'s background
(`instanceNode.scss:29`), it reads only `--color-inode-surface`, never `--node-bg`; (2) a
full-repo, no-filter grep for `--node-bg` (nine hits, listed in Finding 1 and its consumer list)
and for `--color-inode-surface` (five hits) shows no scheme or notation file, and no other
selector matching `.mm-object`, touches either property in a way that would change this. The
default-scheme row (measured) already matches the derived light/dark values exactly, which is the
positive control for this derivation.

`hasIrNodeContentChild` on the native measurement was `false` throughout Phase A (before the
wildcard IR view was installed): the native branch genuinely has no `.ir-node-content` descendant,
ruling out cross-contamination between the two measurement modes on the shared class Widget.

## Finding 3 — does the native node follow schemes/notations, or always paint `--color-inode-surface`? (step 3)

**Always `--color-inode-surface`.** The native instance node's fill is scheme- and
notation-invariant: it changes only with the light/dark theme, never with `scheme-print` or
`notation-wireframe`, because `instanceNode.scss:29` never references `--node-bg` and nothing else
sets `--color-inode-surface`. The IR-default box, by contrast, currently tracks `--node-bg`
faithfully (Finding 2's IR-default column), including going fully **transparent** under
`scheme-print`+dark and under `notation-wireframe` (both themes) — a canvas-bleed-through, not
just a "different white", and a currently reproducible, measured divergence from native (unlike a
"tinted" report under the plain default scheme, which this report could not reproduce on today's
code — see the Methodology note below).

The prompt's own framing ("parity means the IR default does the same thing the native does,
**including when a notation wants transparent nodes**") anticipated exactly this asymmetry. Since
native never goes transparent, true parity means the IR default must stop doing so too:
`fill: 'var(--color-inode-surface)'` is the correct target value, not a scheme/notation-aware
expression. Phase 1 step 3's conditional ("unless the native node follows the notation, in which
case the GO will say what to write") does not trigger — no GO branch is needed for this.

**Methodology note — could not reproduce a "tint" under the plain default scheme.** The closed
lane's report ("visibly tinted... in light") is dated 2026-09-22 but its patch
(`~/seed-fill-2026-09-22.patch`, read for reference only, not applied per the prompt) was written
against the pre-merge factory (before `400095370`), so its exact circumstances are not assumed
reproducible on today's code (CLAUDE.md §5, "do not trust fixtures from memory across sessions").
Under the plain default scheme+notation this report finds `--node-bg` and `--color-inode-surface`
numerically identical, in both themes — no tint possible there today. The genuinely reproducible,
current divergence this report measured is the print/wireframe transparency above, which is a
strictly stronger defect (full bleed-through, not a color mismatch) and is closed by the same fix.

## Finding 4 — how `ShapeSpec.fill` compiles, and whether a `var()` string survives (step 4)

- `irCompile.ts:340`: `const fill = ir.shape.fill !== undefined ? compileConditional(ir.shape.fill, '', deps) : null;` — compiled the same way as `border.color`/label `color` (`irCompile.ts` comment at :300: "the same helper as fill/line.color").
- `IRNodeContent.tsx:207`: `const fill = compiled.fill ? compiled.fill(readCtx, objectId) : '';` — resolved per-instance.
- `IRNodeContent.tsx:380`: `if (fill && !svgPainter) inlineStyle.background = fill;` — **inline style**, not a class. For an SVG-painted shape (diamond/hexagon/parallelogram/cloud/cylinder) the fallback is different: `IRNodeContent.tsx:432`, `const svgFill = fill || 'var(--node-bg)';` — irrelevant here since `defaultObjectViewIR()` hardcodes `form: 'rect'`, which takes the inline-style path, not the SVG path.
- A `var(--token)` string is accepted as-is: this is not a new mechanism to prove — `defaultObjectViewIR()` **already** does exactly this for `border.color` (`'var(--color-inode-border)'`) and label `style.color` (`'var(--color-inode-name)'`), both landed by R-IRN-29..30 and confirmed working (R-IRN-29's zero-delta measurement). `fill` is compiled by the identical `compileConditional` path and consumed by the identical "assign to a React inline-style property" mechanism; a CSS custom property reference in an inline style resolves through the normal cascade at used-value time exactly as it does in a stylesheet rule — this is standard CSS behavior, not framework-specific, and Finding 2's IR-default measurements (background correctly tracking `--node-bg` today via the *stylesheet* rule) confirm the resolution mechanism is live and working in this exact rendering path.

## Finding 5 — consumers of `defaultObjectViewIR()` (step 5)

Non-test call sites (`command grep -rn "defaultObjectViewIR"`, full repo):

| Call site | How it's used | Reaches a fill added to the factory? |
|---|---|---|
| `irCreationSeed.ts:113` | `computeCreationSeed()` spreads `...defaultObjectViewIR()` for a new vertex view, written directly into `DViewElement.new2`'s creation callback | yes (spread copies every field) |
| `irKindConvert.ts:66` | `case 'vertex': return defaultObjectViewIR();` — kind-conversion authoring gesture | yes |
| `authoring/EnableIRPanel.tsx:90` | `vertexSeed = { ...defaultObjectViewIR(), metaclasses: ..., ...(label) }`, no `migratedFrom` — an author-initiated "enable IR" gesture; per the component's own comment (line 54) the seeded view "renders through the IR interpreter (not the native branch)" | yes |
| `authoring/VertexAuthoringPanel.tsx:146` | `clone((view as any).ir ?? defaultObjectViewIR())` — defensive fallback seed if the authoring panel opens on a view with no `ir` yet | yes |
| `redux/VersionFixer.tsx:1039` | `e.ir = { ...defaultObjectViewIR(), migratedFrom: 'classic-default' }` — the migration path (classic jsxString default views → IR), tagged so `isMigratedDefaultView` can recognize it | yes |
| `irDefaults.ts` itself | `isMigratedDefaultView`'s `factoryHashes` set includes `irHash(canonicalize(defaultObjectViewIR()))` — the live-factory comparison hash | yes (this is Finding 6) |

Test-only call sites (`ir.test.ts`, `irValidate.test.ts`, `irCreationSeed.test.ts`,
`formAuthoring.test.ts`) call it for fixtures/assertions; Phase 2 gates must confirm none of them
assert exact structural equality that a `fill` addition would break (none inspected so far assert
on the whole object verbatim except the frozen-snapshot tests discussed in Finding 6, which
intentionally do NOT call the live factory for their "legacy" branch).

**A fill in the factory reaches every creation path**: yes, all five non-test, non-`irDefaults.ts`
call sites spread or call the live function directly; there is no second, independently-maintained
literal of the default object-view shape anywhere in the app code (only the intentionally-frozen
`LEGACY_OBJECT_VIEW_SNAPSHOT`, which must **not** change — see Finding 6).

## Finding 6 — a fill changes the `isMigratedDefaultView` hash; no current test would catch a repeat of R-IRN-33 (step 6)

`irDefaults.ts:193-197`:

```ts
factoryHashes = new Set([
    irHash(canonicalize(defaultObjectViewIR())),
    irHash(canonicalize({ ...LEGACY_OBJECT_VIEW_SNAPSHOT, metaclasses: '*', label: 'Object (IR default)' })),
]);
```

Adding `fill` to `defaultObjectViewIR()` changes its canonical JSON, hence its hash. Any project
whose `ir` was migrated (VersionFixer-stamped `migratedFrom: 'classic-default'`) **after**
`516afd310` (2026-09-19, the R-IRN-33 fix) and **before** this task's fill lands carries the "09-18
shape" (current factory, cornerRadius+border+label-style, no fill) verbatim in its persisted `ir`.
Once the fill is added to the live factory without a corresponding frozen snapshot, that persisted
shape matches **neither** `LEGACY_OBJECT_VIEW_SNAPSHOT` (07-18 shape) **nor** the new post-fill
live hash — `isMigratedDefaultView` silently flips to `false` for exactly those projects, the same
regression class as R-IRN-33, on the same mechanism (structural-equality-with-a-moving-target,
flagged as open debt in R-IRN-33's own text). This directly confirms the prompt's Phase 2 step 2
is necessary, not precautionary.

**No current test would catch this.** `ir.test.ts`'s `describe('isMigratedDefaultView — legacy
factory snapshot (R-IRN-33 regression)')` (lines 1389-1439) has three tests:

1. `'a project migrated before the parity batch still delegates to native rendering'` (1420) — uses
   a **hardcoded** `LEGACY_SNAPSHOT` literal (deliberately duplicated, not imported, per the test's
   own comment at 1393-1396, so an edit to the real constant can't silently defeat the test). Tests
   the 07-18 shape only.
2. `'a freshly migrated view (current factory shape) still delegates to native rendering'` (1425) —
   `{ ...defaultObjectViewIR(), migratedFrom: 'classic-default' }`. **This test is self-referential
   and provides no protection**: it builds its input from the *same live call* that
   `isMigratedDefaultView`'s comparison hash is computed from, so it is tautologically true
   regardless of what the live factory currently looks like — adding fill changes both sides of the
   comparison identically. It never exercises the actual regression (a **stale, already-persisted**
   `ir` diverging from a **changed** live factory).
3. `'a legacy-shaped view the user then edited is NOT mistaken for untouched'` (1430) — edits the
   07-18 `LEGACY_SNAPSHOT`, unrelated to the 09-18 shape.

None of the three pins the "09-18 shape" (today's factory output, pre-fill) as an independent,
hardcoded literal the way test 1 pins the 07-18 shape. This is exactly the gap Phase 2 step 2/3
closes: freeze that shape as a second literal (both in `irDefaults.ts`'s own
`LEGACY_OBJECT_VIEW_SNAPSHOT`-style constant and, independently, as a **hardcoded** literal inside
the test file mirroring test 1's pattern — not by calling `defaultObjectViewIR()` — or the new test
would be exactly as tautological as test 2 above), then add a test parallel to test 1 asserting it
still delegates, and mutation-prove it (drop the new snapshot recognition, confirm the new test —
and only the new test — goes red).

## Risks

- **The only test that currently looks like R-IRN-33 protection is not** (Finding 6). Phase 2 must
  not treat test 2 above as sufficient once the new snapshot lands; it stays green either way and
  proves nothing about stale persisted projects.
- Scope discipline: the prompt is explicit that only `fill` changes, nothing else in
  `shape` (border/radius/label style/`underline: true` stay as R-IRN-29..31 set them). The seed
  duplication risk is real and already flagged by the prompt: the closed lane's patch duplicated
  R-IRN-29..31 in a separate seed and dropped `underline` — evidence that this exact mistake has
  already happened once on this feature.
- No CSS default is to be added on `.ir-node-content` (would repaint every user-authored view with
  no fill — the rejected 2026-09-19 global constant). The fix is scoped to the factory function
  only, consistent with the five call-sites all deriving from it (Finding 5) and none of them
  duplicating the shape.
- `authoring/EnableIRPanel.tsx`'s seed renders through the **IR interpreter** (not the native
  delegated branch — see Finding 5's row), so it will start honoring the fill via the inline-style
  path (`IRNodeContent.tsx:380`) the first time a project author uses "Enable IR" on a vertex view
  after this fix — a visible (intended) change for that one authoring gesture, not just for
  migrated/wildcard defaults. Worth naming to Alfonso explicitly since it is a second-order
  consequence of "reaches every creation path" (Finding 5) beyond the migrated-default case the
  prompt's COSA section is framed around.

## Open questions for Alfonso

1. Finding 3 confirms the native node never respects "transparent nodes" mode (`scheme-print`
   dark, `notation-wireframe`) — it's an existing, apparently deliberate divergence from how
   class/enum/package nodes behave in those modes (which do go transparent, per
   `_notations.scss`'s own "Transparent node backgrounds" comment for every OTHER node type).
   Phase 2's fix locks the IR default into the same "opaque always" behavior as native, i.e. it
   **stops** the IR default from being the one node type that currently honors wireframe/print
   transparency. Confirm this is the wanted parity (matching native, per the prompt's own framing)
   and not an argument for fixing native instead — out of scope either way for this task, but worth
   confirming before Phase 2 locks it in structurally via a frozen snapshot.
2. Finding 6's proposed second frozen-literal test (hardcoded, not calling the live factory) adds a
   THIRD near-duplicate of the default-view shape literal in the codebase (`irDefaults.ts`'s own
   snapshot constant, plus this test's independent copy, alongside the existing 07-18 test-file
   copy). Confirm this duplication is accepted as the cost of a real regression test, consistent
   with test 1's own precedent and comment (1393-1396) explaining why it is NOT imported from the
   source constant.

## Proposed Phase 2 diff (prose)

1. `irDefaults.ts`: add `fill: 'var(--color-inode-surface)'` inside `defaultObjectViewIR()`'s
   `shape` object, alongside the existing `form`, `cornerRadius`, `border`, `labels` — no other key
   touched.
2. `irDefaults.ts`: add a second frozen constant (name TBD at the GO, e.g.
   `LEGACY_OBJECT_VIEW_SNAPSHOT_09_18`) capturing today's `defaultObjectViewIR()` output verbatim
   (cornerRadius 8, border, label style, no fill) — i.e., a snapshot of the function's return value
   as it stands on this branch immediately before this diff lands. `isMigratedDefaultView`'s
   `factoryHashes` set gains this constant's hash as a third member (07-18, 09-18, live/current).
   `LEGACY_OBJECT_VIEW_SNAPSHOT` (07-18) is untouched; nothing is renamed (prompt instruction and
   Rule 2).
3. `ir.test.ts`: a fourth test in the `describe('isMigratedDefaultView — legacy factory snapshot
   (R-IRN-33 regression)')` block, hardcoding the 09-18 shape independently (mirroring test 1's
   `LEGACY_SNAPSHOT` pattern, not calling `defaultObjectViewIR()`), asserting
   `isMigratedDefaultView` still returns `true` for a view tagged `migratedFrom: 'classic-default'`
   in that shape. Mutation-proven by temporarily dropping the new snapshot from `factoryHashes`
   and confirming only this new test goes red (the report/commit message records the bench, per
   CLAUDE.md §5's mutation-bench sub-rule and §21.2's citation requirement).
4. No change to `irCreationSeed.ts`, `irKindConvert.ts`, `EnableIRPanel.tsx`,
   `VertexAuthoringPanel.tsx`, `VersionFixer.tsx`, `irCompile.ts`, `IRNodeContent.tsx`, or any
   `.scss` file — all reach the fix by already deriving from the factory (Finding 5) or by already
   supporting `var()` fill values end-to-end (Finding 4).
5. Gates: `npm run typecheck` (baseline 33, or the branch's currently-declared baseline — re-verify
   before diffing, per CLAUDE.md §17), `npx vitest run` (new test count + the same pre-existing
   red-at-import files as the last measured baseline), `npm run build`, `npm run check:docs`,
   `npm run check:agents` (only if a `CLAUDE.md` is touched — it is not, by this plan).
6. Visual hard stop per the prompt: a new Mario:Person view against the abstract node (light +
   dark), and a project saved before this commit still rendering through native (exercising the
   new 09-18 snapshot recognition on a project that predates this very fix, not just the 07-18
   case R-IRN-34 already closed).

## Uncertain / left to the GO

- Exact naming of the new frozen constant and its test description (Rule 2: no existing identifier
  renamed, but a *new* one needs a name — deferred to the GO rather than guessed here per Open
  question 2's duplication tradeoff).
- Whether Alfonso wants the `EnableIRPanel` second-order visual change (Risk, third bullet) called
  out again explicitly at the Phase 2 visual-check stop, beyond the prompt's own two named checks.
