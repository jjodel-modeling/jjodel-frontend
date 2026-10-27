# Layer Impact Report 2026-10-21: the intrinsic measure cached per element and content key, with inherited-CSS invalidation

- Prompt-ID: P-2026-10-21-1240. Chat: C-2026-10-20-0839.
- Tree: `~/jjodel-w-perfround3`, branch `perf-round3`, HEAD `e078f7ac9`.
- Critical-zone go-ahead: Alfonso, 2026-10-21 10:07 («procedi»), on the round 3 proposal
  (`docs/discovery/discovery_2026-10-21_large_model_round3.md` §5); lane started with
  `--critical-zone-goahead P-2026-10-21-1240` (RC-30).
- **Supersedes the intrinsic half of `lir_2026-10-21_intrinsic_batch_inset.md`** (the batched coordinator, §0, §1.1-1.4,
  §3 first three risks): P-2026-10-21-1115 measured the batch and dropped it (drag measure self time 315 → 228-263 ms
  only, acceptance missed; `~/.jjodel-lanes/P-2026-10-21-1115/measurements.md`). The inset half (§1.5-1.6) stands and
  is committed (`365f9ca9a`).
- Written before any code diff (CLAUDE.md §3.2). Every claim is read in code at that HEAD unless marked measured.

## 0. Verdict

**The `max-content` measure of an IR node's content runs only when something it depends on moved; the values written
do not change.** A new module, `viewpoint/ir/intrinsicMeasureCache.ts`, keeps the last reading of each
`.ir-node-content` element (`w`, `h`, `chromeX`, `chromeY`) together with the key it was taken under and an epoch.
`useContentDrivenSize` asks it for the reading where it calls `measureIntrinsic` today, after the same ownership
checks: on a hit it gets the stored reading and touches no style; on a miss it measures as today and stores. The
unmount cleanup drops the entry. An epoch bump (fonts, theme attribute, stylesheet text) misses every entry and
re-renders every mounted hook, which replaces the per-hook `fonts.ready` re-measure. Layers touched: canvas v2-flow
(React Flow node `width`/`height`, session only, the channel the hook already uses) and IR rendering. No D-layer,
L-layer, JjOM, sync or persistence file is edited.

**One deviation from the prompt's key, on evidence.** The ablation keyed on `textContent` and `childElementCount`.
Discovery found inputs of the reading that change while both stay equal (§1.3), so the content half of the key is
`innerHTML` instead: it holds the text and the child count and also every descendant's class and inline style. The
mutation (m1) is applied to it: the key without the content markup.

## 1. Facts the design rests on

1. **The measure is one forced layout per node per commit** (`useContentSize.ts:54-75`, called at :242 from the
   layout effect with no deps at :187): five inline writes on the element, an `offsetWidth/offsetHeight` read, five
   restores. Round 3 §3.4: 431 ms self time per production drag, 107-111 per click, 496 per open. The ablation that
   skipped it on an unchanged key (`prod-r3b-intrinsic`) took drag long tasks 1427 → 323 ms and ring p50 107 → 78 ms;
   the batch that kept the writes did not (P-2026-10-21-1115).
2. **What the element carries.** The ref is the root `div.ir-node-content` (`IRNodeContent.tsx:290-291, 586-591`):
   its class names the form, padding preset, bar ink and layout; its inline style holds the authored background,
   border, radius and bar geometry (`:468-533`). React Flow handles and the resizer are siblings in `.mm-node`
   (`ObjectNode.tsx:949-967`), not inside it.
3. **Descendants change without the text changing.** Inline text styles on label, compartment, row and literal spans
   (`IRRow.tsx:28`, `IRNodeContent.tsx:686-880`), the label moving from `top` to `center` (`:707-708`, different
   padding at `irStyle.ts:34-35`), `ir-compartment--no-separator` and `ir-row__value--editable` (`irStyle.ts:53-54,
   183`). Each moves the reading with `textContent` and `childElementCount` equal: hence `innerHTML`.
4. **What the element inherits from its node.** One layout rule depends on an ancestor class:
   `.react-flow__node.ir-partition-sep-dashed-v|h .ir-node-content` overrides the border (`irStyle.ts:268-269`, class
   written by `irContainment.ts:584`), which moves `chromeX/Y`. `.selected`, `.drop-target`, hover, highlight and sim
   rules are paint only; `.dragging` sets the cursor. The key therefore carries the class names of the ancestors from
   the parent up to the `.react-flow__node`: a selection or a drag start costs one miss on the nodes it touches, not
   one per commit. A viewpoint's free CSS can be global (`VersionFixer.tsx:516`, `cssIsGlobal`), so a rule on those
   classes is covered whatever it sets.
5. **The node's own box.** The reading is invariant over the box at `max-content` (75 cases, the hook's header), but
   a viewpoint's free CSS could resolve a percentage padding against it. The key carries the node's current
   `width x height` as the hook reads it: a write by the hook costs one more reading on the next commit, the settle
   of today, and nothing after.
6. **Theme.** There is no runtime theme switch (D-UI-15). The only theme state is `data-theme="light"` on `<html>`,
   written once by the boot script (`index.html:16-21`); its token blocks are colours, shadows and gradients only
   (`styles/tokens/_colors-light.scss:76`, `_shadows.scss:14`, `_gradients.scss:43`). The epoch still observes
   `data-theme` and `class` on `<html>`, so a future switch is covered. The editor's own switches (`notation-*`,
   `scheme-*` on `.editor-v2`, `EditorV2.tsx:4882`) restyle the `.mm-node` wrapper only and are disabled while a
   viewpoint is shown (`Toolbar.tsx:325,941`).
7. **Viewpoint CSS.** Two `<style>` elements: `#ir-views-css` in `<head>` (`irStyle.ts:15,272-281`, static base CSS),
   and `#views-css-injector-d` rendered by `Dashboard.tsx:642`, the concatenated `compiled_css` of every view and
   viewpoint. The epoch observes `<head>` (style and link elements added, removed or edited) and the injector element
   (its text), and re-finds the injector by id at every epoch read, so a remount is seen.
8. **Fonts.** Inter Variable and bootstrap-icons (`index.tsx:7-8`); the inspect button's glyph is in flow
   (`irStyle.ts:199`), so the icon font moves the reading too. The epoch bumps on `document.fonts.ready` while the
   fonts are loading (today's trigger) and on every `loadingdone` (a face loaded later, a new unicode range).
9. **Zoom and viewport.** The zoom is a `scale()` transform on `.react-flow__viewport`, and `offsetWidth` is unscaled
   (measured in the hook's header: 153 at zoom 0.5, 1 and 2): no epoch. No `vw`, `vh`, `vmin`, `cqw` or width media
   query reaches `.ir-node-content` or its descendants; `.ir-label{max-width:100%}` is circular under `max-content`:
   no resize epoch.
10. **Synchronous invalidation.** MutationObserver records are delivered in a microtask, after the layout effects of
   the commit that made them. The epoch read drains them with `takeRecords()` first, so a commit that changes the
   viewpoint CSS and the nodes together measures under the new epoch in the same commit. A bump also re-renders every
   subscribed hook; inside a layout effect that is a synchronous re-render before the paint.

## 2. Layers

| Layer | Touched | What changes | What does not |
|---|---|---|---|
| D-layer (Redux raw data) | no | — | no action is dispatched; `isResized` is still read through `readVertexLayout` |
| L-layer (computed proxies) | no | — | — |
| JjOM | no | — | — |
| Canvas v2-flow | yes | the intrinsic reading of an IR node's content is taken only when its key or the epoch moved; otherwise the stored reading is used with no DOM write | the values written, the write channel (`width/height` with `measured` reset), the ownership rules (manual size, resize drag, missing node), both budgets, the unmount drop |
| Canvas classic | no | — | — |
| Sync layer | no | — | `syncSizeToJjom` is still never reached by a derived size |
| Persistence | no | — | nothing is written to the project |

Cross-layer interaction: none new. The derived size stays session-only (the persistence filter in EditorV2 keys on
`resizing !== undefined`, which a programmatic write never sets).

## 3. Risks and how each is held

- **A stale box.** An input of the reading outside the key and the epoch. Held by §1.2-1.9; the residual is a
  stylesheet change made through the CSSOM (`insertRule`) with no DOM mutation, for which no writer reaching
  `.ir-node-content` was found. Checked in the probe (staleness step, every node against a fresh mount).
- **A detached element.** It reads 0 and its key would not move when it is attached: it is measured and not stored.
- **Epoch storms.** A bump re-measures every node. Observed: `data-theme`/`class` on `<html>` only, `<style>`/`<link>`
  changes only (a `<title>` change is ignored), the injector's text, font loads. None of these is written per drag
  move or per click in the code read; the probe's numbers would show it.
- **Termination.** The budgets are untouched and the cache cannot make a reading alternate: an equal key gives an
  equal reading. The existing loop, drop and unmount benches run against the cached hook (their stand-in element is
  not attached, so it takes the uncached path the benches were written for).
- **Memory.** Entries live in a `WeakMap` keyed by element and are dropped at unmount.

## 4. Smoke scenarios potentially affected

- BPMN viewpoint of the harness project: 48 nodes, 42 edges; every node's `offsetWidth/offsetHeight` string-equal to
  the base build (probe acceptance).
- A content change in a derived-size node (rename a vertex): the box follows in the same commit (key moves).
- A theme switch through the product's own control, and the fonts landing on a cold load: every node's size equal to
  a fresh measure afterwards (probe staleness step).
- Open, click, drag, viewpoint switch on the large model: no white canvas, no «size written too often» warning.
