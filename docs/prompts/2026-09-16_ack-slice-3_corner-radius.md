# ACK slice 3: answers to the nine decisions

2026-09-16. Answers to the phase 1 report of slice 3 (`docs/discovery/discovery_2026-09-16_corner_radius_axis.md`,
commit `b87ace74c`). Go-ahead for phase 2 with the decisions below, and with one change to the order
of work at the end.

## First, two things the prompt got wrong

**The critical-zone wording.** The prompt says no critical-zone file is in scope. It was written
from a list of individual files (`useJjomSync.ts`, `canvasToJjom.ts`, and so on) while CLAUDE.md
§3.1 declares whole directories, `viewpoint/ir/` and `viewpoint/authoring/` included. CLAUDE.md
wins, as your own guardrail says, and you were right to flag it and to write the short Layer Impact
Report anyway. Keep doing that for every slice of this round.

**The painter and the node size.** Correct finding, and it is the one real design hole in the
prompt. `IRNodeContentProps` (line 92) carries `compiled`, `objectId`, `vertexId`, `readCtx` and
callbacks, and no geometry. A radius in a `0 0 100 100` viewBox drawn with
`preserveAspectRatio="none"` is scaled anisotropically, so a circular corner needs real pixels.
There is no way around measuring.

## 1. The three extra files

**Yes.** `SymbolEditorModal.tsx` is genuinely the only caller that can pass the radius to the
previews, and the two test files are where those tests belong. Twelve files, confirmed. List them
in the log entry.

## 2. Read the radius from `compiled.ir`

**Yes.** `CompiledView.ir` exists (`irTypes.ts:686`) and the compile cache is keyed on a hash of the
whole IR, so it cannot go stale. This also keeps `irCompile.ts` out of this slice, which keeps you
off slice 2's files entirely. Do not add a field to the compiled view: the radius is a scalar, there
is nothing to compile.

## 3. The measurement

**Yes, a `ResizeObserver`, with three constraints.**

- **Measure the `<svg>`'s own layout box**, not the node and not `.ir-node-content`. The viewBox
  maps one to one onto that element, so the 2px border question you raised disappears instead of
  being corrected for.
- **Install it only when it is needed**: a radius greater than zero on a shape whose painter is
  `svg`. On every other node, and that is almost all of them, no observer is created. State writes
  must be equality guarded, the way `useCanvasNodeBox.ts` already does it, so an idle render costs
  one read and converges.
- **Before the first measurement, paint today's sharp polygon.** Never paint a guessed size.

For the record on why nothing cheaper works: `useContentDrivenSize`, which `IRNodeContent` already
calls at line 174 with a ref to the content box, returns void and is gated on
`hasSizeSupplement(desc) && !isResized`, so it is inert exactly on `rect` and on every hand-resized
node. It cannot be the source of the box.

## 4. Clamp on CSS shapes too

**Yes.** `min(w, h) / 4` everywhere, so one authored number looks the same on every shape that
honors it. On the CSS shapes the browser clamps anyway, but doing it ourselves keeps the two
painters saying the same thing.

## 5. The empty state of the number field

**Yes to your proposal**: show the form's base radius greyed as the default, with a Reset that
removes the key appearing only once a value is written. `NumberInput` stays untouched, which is the
right call: adding a placeholder to a shared primitive for one call site is how shared components
rot.

## 6. The field on the shapes that ignore it

**Visible but disabled**, with the help text saying the shape ignores it. Your recommendation was
"visible"; a control that accepts input and does nothing is a bug report waiting to happen, and
disabled-with-a-reason is the honest version. A value written earlier on another form stays stored
and shows greyed, which is also what should happen when the user switches back.

## 7. The three glyphs

**Redrawn with the current radius.** Static glyphs are decoration; redrawn ones are feedback and
they exercise the painter, so a regression shows up in the panel before it shows up on the canvas.

## 8. The tile ratio

**Yes, 0.7.** It is not a new constant: `SymbolPreview` draws `rounded` with `rx={7}` against the
10px of `irStyle.ts`, so 0.7 is the ratio the tile already uses. Say so in a comment, so the number
is traceable.

## 9. The path test

**Invariants first, one literal second.** Assert that the path is closed, that it has the expected
number of segments for the shape, and that the endpoints sit where the geometry says, then pin one
literal `d` for the diamond at 100x60 with r = 6. A test that is only a literal string fails on
every harmless refactor of the number formatting and teaches nothing when it does.

## Change to the order of work

Slice 1 and this slice both edit `VertexAuthoringPanel.tsx`, and the other session has been told to
implement its part first. **Slice 1 owns that file.** So: implement everything here except the
Corner radius control in the Shape section, commit that, and add the panel control as a second
commit once slice 1's commit has landed. Everything else in this slice, the axis, the validator,
the painter, the previews, the tests, is untouched by that and can proceed now.

Do not inspect the other session's diff to decide what to stage. Stage your own files by name.
