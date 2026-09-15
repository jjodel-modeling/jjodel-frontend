# Slice 1: rules editor and formatPredicate

Generated 2026-09-15. Source documents: `handoff/decisions-symbol-editor-1b.md` (version 3) and
`handoff/02-coder-spec.md`, slice 1. Mockups: `Symbol Editor 1b - All Sections.dc.html`, artboards
2b (two rules) and 2i (conditional with no rules yet).

**Parallelism.** Can run at the same time as slice 3. It shares only `VertexAuthoringPanel.tsx`
with it, and in different FormSections (Fill and Marker here, Shape there). Do not run it at the
same time as slice 2, 4 or 5.

## COSA

`ConditionalEditor` today edits only the single `{when, then, else}` form and shows the chip
"conditional (multiple rules, not yet editable)" for the `rules` form. Make it edit `rules[]` as a
table, and add the pretty printer that every other slice of this round depends on.

Three deliverables:

1. `formatPredicate(p: Predicate): string`, the single source of the predicate text in the rule
   rows, in the preview captions (slice 5) and in the suggestion chips.
2. `toRules` / `fromRules`, normalizing any `Conditional<T>` to `{rules, default}` and back.
3. The rules table in `ConditionalEditor`, plus the three-way mode switch of the mockup.

## DOVE

- `frontend/src/components/ui/ConditionalEditor/conditional.ts`. **Extend this file, do not create
  a new one**: it already exports `isConditionalValue` and already imports `Predicate` from
  `../../editor-v2/viewpoint/ir/irTypes`. It is a pure module: no React, no Redux.
- `frontend/src/components/ui/ConditionalEditor/ConditionalEditor.tsx`.
- `frontend/src/components/ui/ConditionalEditor/ConditionalEditor.module.css`.
- `frontend/src/components/ui/ConditionalEditor/__tests__/` (new test file).
- `frontend/src/components/ui/index.ts`, only if a new symbol has to be re-exported. Note that the
  tests import `conditional.ts` directly, not through this index.
- `frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx`, **only** the
  Fill FormSection (around line 530) and the Marker FormSection (around line 584), to pass the new
  prop described below.

## COME

**`formatPredicate`.** Total over the whole `Predicate` union, `marked` and `literal` included.
Suggested rendering: `eq/neq/lt/lte/gt/gte` as `left == right` with the path written as the author
wrote it and string literals quoted; `and`/`or` joined with ` and ` / ` or ` and parenthesized only
where nesting requires it; `not` as `not (...)`; `exists p` and `empty p`; `isKind C` and
`isKind C on p` when `path` is set; `marked` and `marked on p`; `literal` as `always true` or
`always false`. An `op` the function does not recognize must return a neutral placeholder such as
`⟨expr⟩` and **must never throw**: saved IR can carry an operator this build does not know, and
`irValidate` is the layer that reports that, not the panel.

**`toRules` / `fromRules`.** `toRules` accepts the three shapes (`T` scalar,
`{when, then, else?}`, `{rules, default?}`) and returns `{rules, default}`. `fromRules` writes back
always in the `rules` form. The write rule, which matters:

- one or more rules: write `{rules: [...], default?}`, with `default` present only if the user set
  it. Never persist a default the user did not choose.
- no rules but a default set: write `{rules: [], default: X}`. This is the legitimate encoding of
  artboard 2i ("No rules yet, every State uses the default below"), and it is what makes the
  switch come back on Conditional when the modal is reopened.
- neither rules nor default: write the scalar back, or remove the axis. `{rules: []}` alone
  compiles to the fallback and is indistinguishable from absence, so it must not be persisted.

**The table.** Columns `⋮⋮ | WHEN | → | THEN | ✕`, closing row `Otherwise → <default>`, button
"+ Add rule", drag to reorder (reuse the list library already used by `LabelListEditor`, do not
add a dependency). Order is semantics: first match wins, so reordering must rewrite `rules` and
the canvas must follow live. The WHEN cell shows the read-only `formatPredicate` text and opens
the existing `PredicateBuilder` in a popover on click. The THEN cell reuses the `renderValue` prop
already passed to the editor, so fill keeps its ColorPicker and marker its Select.

**The mode switch.** It becomes `None | Solid | Conditional` where the axis has a "none" value.
Add an optional prop rather than hardcoding it, for example `noneValue?: T` (absent means the
switch keeps today's two modes, so every existing call site is unaffected). For fill and marker
the none value is `''`, which is the compiled convention for "no fill" and "no marker". `Solid`
writes the scalar, `Conditional` moves the current scalar into `default`. `allowConditional` stays
the Advanced-mode gate exactly as it is.

**Empty state (2i).** No rules: the copy of the mockup, the "+ Add first rule" call to action, and
the suggestion chips built with `formatPredicate`.

## Acceptance

- With two rules and a default, the saved IR is `{rules: [{when, then}, {when, then}], default}`.
- A single rule plus a default compiles to exactly the same result as the old
  `{when, then, else}`, verified on `irCompile`.
- Reordering changes the order in `rules` and the canvas updates live.
- Removing every rule while a default is set leaves `{rules: [], default}` and shows state 2i.
- Removing every rule with no default writes the scalar back, not `{rules: []}`.
- Tests: `toRules`/`fromRules` round trip on all three input shapes; `formatPredicate` on every
  `op` of the union, `marked` included, plus one object with an invented `op`, which must return
  the placeholder and not throw.

## Out of scope

The Border section and anything under `viewpoint/ir/` (`irTypes`, `irCompile`, `irValidate`,
`shapeRegistry`, `notationCatalog`, `symbolRecognition`). No text-to-Predicate parser. No changes
to the preview.

## Commit

`feat: edit conditional axes as a rules table, add formatPredicate`

### Phase 1: discovery, read only

Read the files under DOVE in full (or the relevant sections of the long ones) before changing
anything, and record what you find.

**The discovery report is mandatory and is what closes phase 1.** Save it as
`docs/discovery/discovery_<YYYY-MM-DD>_<short_snake_case>.md`, creating the folder if it does not
exist. Minimum content: the goal of the discovery, every file read with its full path, the
relevant findings, the dependencies and risks you identified, and the open questions for Alfonso.
Terminal output and chat text do not count: phase 1 is not complete until the report is on disk.

Then **hard stop**. Do not start phase 2 until the analysis has been discussed and you have an
explicit go-ahead.

## Guardrails (same in every slice of this round)

- Read `CLAUDE.md` at the repo root and `docs/CLAUDE_DEVELOPMENT_GUIDE.md` before touching
  `editor-v2/viewpoint`. If this prompt contradicts `CLAUDE.md`, report the conflict and stop:
  do not silently follow either one.
- No critical-zone file is in scope for this slice (`useJjomSync.ts`, `canvasToJjom.ts`,
  `jjomTransformers.ts`, `portDistribution.ts`, `handlePosition.ts`, `DV.tsx`,
  `VersionFixer.tsx`). If discovery concludes one of them must change, stop and ask: that needs
  a Layer Impact Report and an explicit go-ahead.
- IR is additive only. No `irVersion` bump, no VersionFixer migration, no rewrite of saved views.
- Touch only the files listed under DOVE. Zero opportunistic refactoring, no renaming of existing
  identifiers (CSS/SCSS classes, variables, functions, components, props), no reordering of imports.
- Before introducing any new identifier (CSS class, exported symbol, custom event, context key),
  grep the whole codebase to check it is not already taken.
- Verify the project builds (`npm run build`) before committing.
- Add one entry to `docs/claude-code-log.md` at the end of the task, with the document name of
  this prompt prefixed by date and time.
- Stage surgically: `git add <specific files>`, never `git add .` or `git add -A`. Do not push.
