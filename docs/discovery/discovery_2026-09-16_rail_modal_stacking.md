# Discovery 2026-09-16 — the Properties rail paints over the Symbol Editor modal

Prompt: chat prompt of 2026-09-16, phase 1 only (diagnosis, no fix).
Branch `validation-skeleton`, HEAD `5eadc9541`. **No source file modified.**
Probe: `docs/discovery/harness/probe_2026-09-16_rail_modal_stacking.mts` — **17 PASS, 0 FAIL**,
run against the live dev server (`localhost:3000`), zero page errors.
Screenshots read by eye: `stacking_A_1600.png`, `stacking_B_1440.png` (scratchpad, not committed).

Origin: not a guess. The first run of `frontend/scripts/smoke/_tmp_rules_editor_verify.ts` (slice 1
of the rules editor) stopped at 1600px on a blocked click, with Playwright naming
`properties-tree-overlay subtree intercepts pointer events`. That probe worked around it by moving to
a 2400px viewport and left a comment saying so. This report measures what it walked around.

---

## 0. The flat answer

**The rail wins, and no number written inside the app can change that.** `#root` is
`position: fixed` (`frontend/src/index.scss:31`), so it **creates a stacking context**, and at `body`
level its z-index is `auto`, i.e. **0**. The modal lives inside `#root`. The rail does not: it is
`createPortal(..., document.body)` (`PropertiesWithTreeView.tsx:1100`), a **sibling** of `#root`, at
**900**. The comparison that decides the pixel is `0` (the whole app) against `900` (the rail). The
modal's own 1050 is compared only with its siblings inside `#root`, never with the rail.

This is **not a new mechanism**: it is exactly **D-UI-14** (`docs/decisions.md:1760`), ratified
2026-08-21, whose rule reads «an overlay that must sit above the rail **must be a child of `body`**,
i.e. go through a portal». `SymbolEditorModal` never got that treatment. `ValidationRulesModal` did,
on 2026-09-09 (`a5ed5406d`), and its SCSS comment says why in one paragraph.

**Not a regression.** The inversion has been there since the modal's first commit, 2026-08-15.
It became visible at 1600px 53 minutes later, when the modal grew from 640px to 1040px.

**Where it bites** (rail at its default 400px, modal 1040px): every viewport **below ~1785px** has at
least one control of the modal unreachable, the modal's own **×** among them. Measured boundary
between 1780 (4 blocked) and 1788 (0 blocked). Box overlap survives a little longer, to 1840, but
covers no control centre from 1788 up.

---

## 1. The mechanism, in one line

A z-index only ranks siblings **inside the same stacking context**. `#root` is one; therefore every
z-index written anywhere in the React tree — 900, 1050, 9999, 999999 — is ranked *inside* `#root`, and
`#root` as a whole enters the root context at level 0, below the rail's 900.

---

## 2. The three chains, measured

Measured with `getComputedStyle` on the live DOM, ancestor by ancestor, with the reason each element
does or does not create a stacking context (probe section A).

### 2.1 The rail

| element | position | z-index | creates SC | why |
|---|---|---|---|---|
| `div.properties-tree-overlay` | fixed | **900** | yes | `position:fixed` |
| `body` | static | auto | no | — |
| `html` | static | auto | yes | root element |

Participant in the **root** stacking context: **itself**, at 900. Child index 2 of `body`.

### 2.2 The modal

| element | position | z-index | creates SC | why |
|---|---|---|---|---|
| `div.symbol-editor-modal-backdrop` | fixed | **1050** | yes | `position:fixed`; flex item + z-index |
| `div.router-wrapper` | static | auto | no | — |
| `div#root` | **fixed** | **auto** | **yes** | **`position:fixed`** |
| `body` | static | auto | no | — |
| `html` | static | auto | yes | root element |

Participant in the **root** stacking context: **`#root`**, at `auto` = **0**. Child index 0 of `body`.

### 2.3 The body-level scale, re-measured (D-UI-14 said three, there are four nodes)

`#root` (fixed, auto) · `script` · `.properties-tree-overlay` (fixed, **900**) ·
`.sim-panel.sim-panel--closed` (fixed, 850).

DOM order differs from the D-UI-14 census (rail now before `.sim-panel`); irrelevant, the z-indexes
separate them. Nothing else is a child of `body` in this state.

---

## 3. Which element wins, at the pixel

`document.elementsFromPoint` at the Fill section's right edge (1296, 453), viewport 1600:

```
1. div.props-header                            inRail=true   z=1
2. section.properties-tab.properties-panel     inRail=true   z=auto
3. div.properties-panel-body                   inRail=true   z=auto
4. div.properties-panel-container              inRail=true   z=auto
```

The winner is an element with **z-index 1**. It beats a backdrop at 1050 because the two numbers are
never compared: `1` ranks inside the rail, `1050` inside `#root`, and the contest upstream is 900 vs 0.

**Controls (P12).** A modal pixel far from the rail returns the modal
(`button.symbol-catalog__section-head`); a rail pixel outside the modal returns the rail
(`div.properties-panel-body`). Without those two, «the rail wins» would not be distinguishable from a
hit test that reads nothing.

**The real gesture, not only the hit test.** Playwright's own actionability check on a covered
control fails with:

> `<input ... aria-label="Filter tree" class="tree-search__input"/> from <div class="properties-tree-overlay">…</div> subtree intercepts pointer events`

i.e. the modal's **×** is blocked by the rail's **tree filter box**. Same message as the slice 1 run.

---

## 4. Why it is not a z-index contest — three runtime experiments

All three are inline-style mutations, undone immediately, no file touched (probe section C).

| # | mutation | result | what it rules out |
|---|---|---|---|
| E1 | rail forced to `z-index: 0` | **rail still wins** | it is not a contest between peers; even 0 beats the whole app, by DOM order at body level |
| E2 | `#root` given `z-index: 10000` | **modal wins** | the cap is `#root`: lift the container and everything inside it lifts with it |
| E3 | a `position:fixed; z-index:999999` div injected **inside `#root`** | **still covered by the rail** | no value written inside the app can win — so the fix is not «raise the modal's z-index» |

E3 is the decisive one for the fix's shape: `--z-debug` (999999), the top of the design system's own
scale, loses to 900.

---

## 5. What is actually unreachable, at 1600

Census of every interactive control of the modal that is on screen: 50 visible, **44 reachable, 6
blocked**. «Blocked» is not a rect intersection — it is the browser's own hit test on the control's
centre pixel, the same question a click asks.

| control | x … right | blocked by (rail subtree) |
|---|---|---|
| `Close` (modal ×) | 1281 … 1304 | `input.tree-search__input` |
| rule colour `INPUT` | 1159 … 1278 | `span.props-section__title` |
| `Remove rule` | 1282 … 1304 | `button.props-section__header` |
| default colour `INPUT` | 1159 … 1278 | `div.jj-field` |
| `Clear default` | 1282 … 1304 | `div.jj-field` |
| `Close` (second, lower) | 1245 … 1304 | `button.properties-node-section__header` |

State measured: Fill switched to **Conditional** with one rule — the rules-table state of the slice 1
mockup, which is where the row actions exist at all.

### 5.1 Correction to the premise: it is Fill, not «Fill and Marker»

The appearance tab is a **two-column flow**: left column `x 560…918`, right column `x 946…1304`. The
covered strip at 1600 is `x ∈ [1200, 1304]`, i.e. the **right 104px of the right column**. Section
census with the tab scrolled so that every section below `Symbol` is inside the modal's box (the
unscrolled census is in the probe output too, but there `Marker` and `Badges` sit below the fold,
where a hit test returns `null` and a `0` would mean «off screen», not «reachable»):

| section | x … right | controls | blocked |
|---|---|---|---|
| Symbol | 560 … 1304 | 0 | 0 (scrolled above the pane) |
| Shape | 560 … 918 | 6 | 0 |
| **Fill** | **946 … 1304** | 13 | **4** |
| Border | 560 … 918 | 6 | 0 |
| Padding | 946 … 1304 | 1 | 0 |
| **Marker** | **560 … 918** | 3 | **0** |
| Sizing | 946 … 1304 | 2 | **1** |
| Badges | 560 … 918 | 1 | 0 |

**Marker sits in the left column and was reachable in every state where it was on screen.** The blocked set is
`{Fill, Sizing, the modal header}` — plus the modal's ×, which belongs to no section. The invariant is
the **strip**, not the section name: sections are placed by a column flow, so which one lands under
the rail moves with the modal's own content height. `Fill` in Conditional mode grows and keeps the
right column; a different content state can put another section there.

### 5.2 The pixel agrees with the numbers

`stacking_A_1600.png`, read by eye: the modal is visibly truncated at `x≈1200`, the rail's tree and
inspector paint on top of it, and — the visual tell — **the rail is not dimmed by the backdrop**,
while everything else behind the modal is. `aria-modal="true"` is declared on the dialog
(`SymbolEditorModal.tsx:231`) and the backdrop closes on click (`:227`), but a click anywhere over the
rail reaches the rail: it neither closes the modal nor is dimmed by it. The modality is nominal.

---

## 6. At which widths it bites

Rail pinned at its first-open width (400 for a session first opened between 1600 and 2199;
`firstOpenOverlayWidth`, `PropertiesWithTreeView.tsx:88-94`), modal 1040 fixed, viewport swept.

| viewport | rail x | modal right | box overlap | blocked controls |
|---|---|---|---|---|
| 1280 | 880 | 1160 | 280 | **11** |
| 1366 | 966 | 1203 | 237 | **10** |
| 1440 | 1040 | 1240 | 200 | **10** |
| **1600** | **1200** | **1320** | **120** | **7** |
| 1680 | 1280 | 1360 | 80 | **5** |
| 1760 | 1360 | 1400 | 40 | **4** |
| 1780 | 1380 | 1410 | 30 | **4** |
| **1788** | 1388 | 1414 | 26 | **0** |
| 1840 | 1440 | 1440 | 0 | 0 |
| 1920 … 2400 | — | — | 0 | 0 |

(The 1600 row counts 7 rather than 6 because the sweep runs after the Marker scroll, which brings one
`Sizing` control into the strip.)

**Two boundaries, and they are different numbers.**
- Last blocked **control**: between **1780 and 1788**. Derived from the measured rects: the modal's ×
  centre sits 27.5px left of the modal's right edge, so blocking ends at `W = 2·(railW + 492.5)` →
  **1785** for railW 400. Consistent with the bisection.
- Last **box** overlap: `W = 2·(railW + 520)` → **1840** for railW 400, measured exactly (1836: 2px;
  1838: 1px; 1840: 0).

Per rail width, control blocking ends at: **1705** (railW 360), **1785** (400), **2105** (560),
**2265** (640, the max of the drag handle).

Cross the two with `firstOpenOverlayWidth`:

| session first opened at | rail width | blocked below |
|---|---|---|
| < 1600 | 360 | 1705 — i.e. **always**, the whole bucket is below it |
| 1600 … 2199 | 400 | 1785 — **1600 to 1784 bite, 1785+ do not** |
| ≥ 2200 | 560 | 2105 — **never**, the whole bucket is above it |

Confirmed on a second, independent fixture (run B): a session **first opened at 1440** gets a 360px
rail and the rail still wins over the Fill section; its census lists the two `Close` buttons blocked
(that run does not open the rules table, so the row actions do not exist in it — declared).

Note the width is **persisted** (`localStorage: jjodel_property_overlay_width`) and computed once at
first open: resizing the window afterwards does not re-width the rail, and a user who once dragged the
handle carries that width into every later session.

---

## 7. Regression, or always there

Always there. Timeline, from `git log -S`:

| date | commit | fact |
|---|---|---|
| 2024-11-24 | `061ab9b23` | `#root { position: fixed }` lands in `index.scss`. The stacking context predates everything. |
| 2026-07-29 | `5a3a4bbfe` | the rail becomes a `createPortal` onto `body` at z-index 900. From here, nothing inside `#root` can beat it. |
| **2026-08-15 16:58** | `36a789a53` | `SymbolEditorModal` is born, **640px wide**, `z-index: var(--z-modal, 9999)`, no portal. Already inverted; at 1600 the two boxes did not yet overlap (threshold `2·400+640` = 1440). |
| **2026-08-15 17:51** | `70c33827d` | «larger symbol editor modal»: 640 → **1040px**. The threshold moves to 1840 and the defect becomes visible at 1600. |
| 2026-08-21 | D-UI-14 | the mechanism is measured and ratified as a rule (`discovery_2026-08-21_z_index_popup_rail.md`, §7 question 5 predicts exactly this recurrence). The modal already existed and was not brought into line. |
| 2026-09-09 | `a5ed5406d` | `ValidationRulesModal` applies the rule: portal to `body` + `z-index: var(--z-alert, 10000)`. Its SCSS comment records the same measurement («il fondale calcolava 1050 e il pixel mostrava l'albero sopra»). |
| 2026-09-16 | — | found again from the slice 1 probe. |

So: no commit broke it; a commit the same afternoon made it visible at the width people work at.

---

## 8. Blast radius: three modals, not one

Same shape — `position: fixed`, `z-index: var(--z-modal, 9999)`, rendered inside `#root` with no
portal:

| modal | portal | verdict |
|---|---|---|
| `SymbolEditorModal` | no | **defective** (measured here) |
| `ValidationResultsModal` (`problems/ValidationResultsModal.scss:12`) | no | same shape, not measured |
| `ImportSummaryModal` (`import/ImportSummaryModal.scss:5`) | no | same shape, not measured |
| `ValidationRulesModal` | **yes**, + `--z-alert` | fixed, the precedent |

Not measured means not measured: the other two were not opened. What is measured is the class (E3):
**any** fixed overlay inside `#root`, at any z-index, is covered by the rail wherever they overlap.

## 8.1 A side fact that changes nothing here but is worth knowing

`var(--z-modal, 9999)` **does not resolve to 9999**. Two token files declare the same name:
`styles/tokens/_z-index.scss:31` says 9999, `styles/tokens.css:204` says 1050, and `tokens.css` wins
(imported from `App.tsx:8`). Measured on `:root`: `--z-modal` = **1050**, `--z-alert` = 10000,
`--z-dropdown-menu` = 1000. The duplicate-token family is already documented
(`discovery_2026-08-20_token_css_portalati.md`, `_shadows.scss:60`, `_colors-light.scss:391`).

It is **not** the cause of this defect — E3 shows 999999 loses too — but it does mean the declared
intent of that line has never been what the browser computed, and a fix that raises a number without
moving the node would be reasoning about a value that is not live.

### 8.2 Ruled out explicitly

The `.panning-handle` / `.GraphContainer` z-index 100 lore named in the prompt is **not** the
mechanism here: that is the classic editor (`Measurable.tsx:523`, `Measurable.scss:11`), and the
subject of this report is the v2-flow editor with the modal in the React root. The `z-index: 200`
convention lives at `EditorV2.scss:4392` (the split-mode cyan stripe). Neither appears in either
measured chain. Named because the prompt named it, and because the prompt was right that an
SCSS-only reading had already missed a stacking defect once — which is why every claim above is a
runtime measurement.

---

## 9. Where the fix could belong — options only, nothing applied

Per the prompt: **no fix**, because slice 4 rewrites this modal shell and two answers to one question
is exactly what we are avoiding. The options, with their cost:

**A — local, the ValidationRulesModal precedent.** Wrap the backdrop in
`createPortal(..., document.body)` and set `z-index: var(--z-alert, 10000)`. Two files
(`SymbolEditorModal.tsx`, `.scss`), ~6 lines, D-UI-14 already ratifies the shape and `a5ed5406d` is a
worked example in this repo. Cost: slice 4 rewrites the shell and will redo or absorb it. Risk: near
zero, but the portal moves the subtree out of the React tree — anything relying on DOM-ancestor CSS
from the modal's current parents would change. (`useCanvasNodeBox` reads the canvas by
`document.querySelector`, not by ancestry, so it is unaffected; verified by reading, not measured.)

**B — inside slice 4, once, for the shell.** A single shared modal surface that portals and carries
the body-level level; `ValidationResultsModal` and `ImportSummaryModal` come along for free. Cost: the
defect stays until slice 4 ships, and every Symbol Editor session below 1785px keeps a dead × and a
dead right column.

**C — structural: stop `#root` being a stacking context, or move the rail inside it.** This is the
only option that removes the *class* of defect rather than one instance. It also invalidates the whole
body-level scale D-UI-14 describes (`#root` 0, sim-panel 850, rail 900, portaled dropdowns 1000) and
every portal built against it — navbar user menu, notifications popover, ValidationRulesModal. Out of
proportion to this bug; a decision of its own if it is ever wanted.

A cheap mitigation and **not** a fix: closing the rail from the canvas topbar should free the modal,
since the portal unmounts 250ms after the slide (`RAIL_MOTION_MS`, `PropertiesWithTreeView.tsx:81`,
`:787`) and there is then nothing above `#root`. **Not measured in this run** — stated from reading
the component, not from a hit test. Worth trying for whoever works at 1440 before a fix lands.

---

## 10. Open questions for Alfonso

1. **A now, or B with slice 4?** If the Symbol Editor is being used at 1440–1600 in the meantime, the
   × being unclickable is the argument for A; Escape still closes, so it is not a trap.
2. **Do `ValidationResultsModal` and `ImportSummaryModal` come along?** They have the same shape and
   the same one-paragraph fix. If yes, it is one lane, not three.
3. **Is the nominal modality acceptable?** With the rail live above an `aria-modal="true"` dialog, a
   click can edit the model behind the modal. Fixing the stacking fixes this for the overlap region
   only if the modal goes above the rail everywhere — which option A does.
4. **`--z-modal` = 1050 vs 9999**: leave it (it is inert for this defect) or open the token cleanup
   the earlier reports already point at?

---

## 11. Files read

- `frontend/src/index.scss` (1-45)
- `frontend/src/App.tsx` (150-200, import block)
- `frontend/src/components/editors/PropertiesWithTreeView.tsx` (55-95, 295-410, 645-800, 1085-1115)
- `frontend/src/components/editors/properties-with-tree-view.scss` (1425-1520, grep for z-index/transform)
- `frontend/src/components/editor-v2/viewpoint/authoring/SymbolEditorModal.tsx` (100-240)
- `frontend/src/components/editor-v2/viewpoint/authoring/SymbolEditorModal.scss` (1-80, grep)
- `frontend/src/components/editors/views/ViewData.tsx` (110-115) — the modal's launch button lives in the rail
- `frontend/src/components/validation/ValidationRulesModal.scss` (1-40) — the precedent
- `frontend/src/components/editor-v2/problems/ValidationResultsModal.scss`, `components/import/ImportSummaryModal.scss` (z-index lines)
- `frontend/src/styles/tokens/_z-index.scss` (full), `frontend/src/styles/tokens.css:204`
- `frontend/scripts/smoke/_tmp_rules_editor_verify.ts` (1-240) — origin of the report, fixture reused
- `docs/decisions.md` D-UI-14 (1760-1790), `docs/discovery/discovery_2026-08-21_z_index_popup_rail.md`

## 12. How to reproduce

```bash
cd frontend && npx tsx ../docs/discovery/harness/probe_2026-09-16_rail_modal_stacking.mts
```

Dev server on `localhost:3000` (P8). Two browser contexts, ~4 minutes, 17 checks. The probe builds its
own fixture (M2 `State` + 3 M1 objects + the IR demo viewpoint), opens the modal through
`JjodelEvents.SYMBOL_EDITOR_OPEN`, and leaves no state in the repo.

---

## 13. Phase 2 — option A applied and verified (2026-09-16)

Option A of §9, authorized in chat, landed in `bc42b259c`: `createPortal(…, document.body)` in
`SymbolEditorModal.tsx` and `z-index: var(--z-alert, 10000)` on `.symbol-editor-modal-backdrop`. Two
files, nothing else touched. `ValidationResultsModal` and `ImportSummaryModal` were **not** touched —
they are unmeasured, and there is now a ticket for them in `docs/TECH-DEBT.md`, next to one for the
`--z-modal` = 1050 duplication of §8.1.

Same probe, assertions inverted to the corrected state: **25 PASS, 0 FAIL**, zero page errors.

### 13.1 What changed, measured

| | before | after |
|---|---|---|
| modal's participant in the root context | `div#root`, `auto` = **0** | `div.symbol-editor-modal-backdrop`, **10000** |
| modal's ancestor chain | backdrop → `.router-wrapper` → `#root` → body → html | backdrop → **body** → html |
| body-level scale | `#root` auto · rail 900 · sim-panel 850 | `#root` auto · rail 900 · sim-panel 850 · **backdrop 10000** |
| controls on screen at 1600 | 50 visible, 44 reachable, **6 blocked** | 50 visible, **50 reachable, 0 blocked** |
| the modal's × | covered by `input.tree-search__input` | takes the click and closes |
| widths blocking a control | 1280 … 1780 | **none**, 1280 → 2400 |

`#root` still creates a stacking context, the rail is still at 900, `--z-modal` still resolves to
1050. Nothing was «unified»; the modal simply moved to where the comparison happens.

### 13.2 The controls that make the result mean something

- **The geometry did not move.** At 1600 the rail and the modal still overlap by **120px**, the Fill
  section still reaches 104px into the rail's column. «Zero blocked» is therefore about who wins the
  pixel, not about two boxes that stopped touching. Asserted at every width below 1840.
- **The rail is still there.** Mounted, not collapsed, 400px, while the modal is up.
- **E4, the falsifier.** The backdrop moved back inside `#root` at runtime: **the rail wins again**.
  Restored onto body: the modal wins again. Without this, the verification could not tell the fix from
  a coincidence.
- **E3 survives and still matters.** A `position:fixed; z-index:999999` div injected inside `#root`
  still never reaches the top. The class of defect is unchanged — which is exactly why the fix could
  not be a bigger number.

### 13.3 Two things that also changed, both wanted

1. **The modality is now real.** The backdrop is `inset: 0`, so once it wins it covers the rail too: a
   click over the rail no longer edits the model behind an `aria-modal="true"` dialog. This closes the
   observation in §5.2, which was measured as a defect and is not one any more.
2. **The stylesheet's header comment was false and is now true.** It claimed «same overlay pattern and
   stacking as ImportSummaryModal … no portal»; it now names the ValidationRulesModal pattern and the
   body scale, with the measurement cited.

### 13.4 Gates

`npm run typecheck`: exit 2, **33** errors on full output — the declared baseline — **0** in the two
touched files; positive control `Measurable` → 6. `npm run build`: exit 0, only the pre-existing
chunk-size warning. No vitest suite covers this modal. `npm run check:docs` was red on **another
lane's** entry (cornerRadius slice 3, Notes 874 chars) and was trimmed to the cap in its own commit,
no fact removed.

Screenshot read by eye, 1600px with the rail open: the modal is whole, the × is where it belongs, and
the rail behind it is dimmed by the backdrop.

**Still open: the visual check on a real window.** The probe drives Chromium at a fixed viewport; the
acceptance criterion was met there, not on your screen.
