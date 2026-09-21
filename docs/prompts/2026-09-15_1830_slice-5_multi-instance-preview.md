# Slice 5: multi-instance preview

Generated 2026-09-15. Source documents: `handoff/decisions-symbol-editor-1b.md` (version 3),
decision D8, and `handoff/02-coder-spec.md`, slice 5. Mockups: the preview strip of every artboard,
with captions such as "Idle · isInitial" in 2b and "Running · base" in 2c.

**Parallelism.** Last. It needs `formatPredicate` from slice 1, and the border captions only make
sense after slice 2.

## COSA

The preview strip shows up to three real instances of the target metaclass, each with the caption
of the rule that won for it.

## DOVE

- `viewpoint/authoring/useCanvasNodeBox.ts`.
- `viewpoint/ir/irCompile.ts`: one new exported helper.
- `viewpoint/authoring/SymbolEditorModal.tsx`: the preview area.
- `viewpoint/authoring/SymbolBoxPreview.tsx`: new props, no new responsibility.

## COME

**Instances.** `useCanvasNodeBox` already queries every `.mm-node[data-viewid]` mark and keeps the
first one inside the active dock pane (lines 50 to 58). Generalize it to
`useCanvasNodeBoxes(viewId, max)` returning the array in DOM order, and keep the existing
single-box hook as element 0 so no existing caller moves. Cap at 3.

**Zero instances.** Keep today's symbolic replica, which already labels itself honestly
("symbolic preview · no node on canvas"). No synthetic "Sample" mode in this round: the
On canvas / Sample segmented control of the mockup stays out of the DOM rather than shipping
disabled.

**Which rule won.** Nothing exposes it today: `CompiledConditional<T>` returns only `T`
(`irCompile.ts:244-263`) and `compilePredicate` is not exported. Add one exported helper, for
example `matchIndexOf<T>(c: Conditional<T>, ctx: ReadCtx, id: string): number | null`, where null
means the default or base branch. Additive: do not change the shape of `CompiledConditional` and do
not touch any render path. The per-instance `ReadCtx` is already available through
`makeReadCtx(idlookup)` in `irReadCtxLproxy.ts:62`, and the compiled accessors already take
`(ctx, id)`.

**Keep the replica dumb.** `SymbolBoxPreview` declares in its own header comment that per-instance
content is out of scope, and that stays true: the modal evaluates the axes per instance and passes
the resolved `{ form, fill, border, marker }` plus the caption. Do not turn the replica into a real
IR render in this round.

**Caption.** `formatPredicate(rules[i].when)` for the winning index. When the index is null, the
word is `otherwise` in Fill and Marker and `base` in Border: the mockup uses both, they denote the
same state in two sections, and each reads correctly where it sits.

## Acceptance

- Three instances of the same metaclass with different attribute values show three different
  renderings and three different captions.
- One instance behaves exactly as the current strip.
- Zero instances falls back to the symbolic replica, with no crash and no invented numbers.
- Editing a rule updates captions and renderings live, without reopening the modal.
- Test on `matchIndexOf`: first match wins, null when nothing matches, null on an empty rule list.

## Out of scope

The synthetic "Sample" mode. Any change to the rules editor or to the IR schema.

## Commit

`feat: preview up to three canvas instances with the winning rule caption`

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
