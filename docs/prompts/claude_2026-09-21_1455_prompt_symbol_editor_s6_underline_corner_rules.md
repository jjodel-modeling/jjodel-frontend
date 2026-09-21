# Prompt: Symbol Editor slice S6, authoring of `underline` and of a rule-driven `cornerRadius`

Prompt-ID: P-2026-09-21-1455
Status: eseguito 2026-09-21 · lane symbol-editor · 94eb92a21
Repo: `~/jjodel-release` (worktree of `alfonso-frontend-jjtl`, the trunk, HEAD `1387967a0` or later).
Not `~/jjodel`, not `~/jjodel-sim`: a session whose last commit is dated 2026-09-20 and that sees an
untracked copy of the 2219 prompt is in the wrong tree; stop and say so.
Lane: full lane (two-phase, more than three files). Out of the critical zone. Effort: xhigh.
Read `CLAUDE.md` (§3, §5, §6, §17, §21), `docs/PROTOCOL.md` (P4, P6, P9, P13, P14) and the last ten
entries of `docs/claude-code-log.md` first. Gates run with `~/.local/bin/node` (v26) on the PATH: the
nvm default is v18 and refuses `--experimental-strip-types`.
Every message opens with `[P-2026-09-21-1455 · session <id>]`. A message with a different or missing
ID is not executed.

Context. Two additive IR axes landed before the merge and have no authoring control yet.
`TextStyle.underline?: Conditional<boolean>` (`irTypes.ts:95`, ir-1.3 addendum §7, R-IRN-30) is
compiled (`irCompile.ts:313`), rendered with the native 3px offset (`IRNodeContent.tsx:137`) and
seeded `true` on the object default view (`irDefaults.ts:46`), but `TextStyleEditor.tsx` has rows
for family, size, weight, style and color only: an author cannot switch the underline on or off, nor
make it conditional. `ShapeSpec.cornerRadius?: Conditional<number>` (`irTypes.ts:198`, R-IRN-35)
is compiled and painted per instance (`shapeRegistry.ts:513`, `resolveCompiledCornerRadius`), but
the Symbol Editor authors it only as a scalar: when the persisted value is conditional the stepper
is disabled with the label `rule-driven` (`VertexAuthoringPanel.tsx:414-418`, `:670`, option B of
P-2026-09-19-1730) and nothing lets the author see or edit the rules. The preview ignores rules too:
`SymbolEditorModal.tsx:341` reads `authoredCornerRadius(ir.shape.cornerRadius)`, which returns
`undefined` for a non-number, so the three-instance strip and the two `SymbolPreview` thumbnails
draw the base radius whatever the rules say (ticket of 2026-09-19). Decisions ratified in chat on
2026-09-21 (Alfonso, "decidi tu"), to be confirmed by Phase 1 against the code:

- D-S6-1. `underline` becomes one more `AxisRow<boolean>` of `TextStyleEditor`, after `Style` and
  before `Color`, same ƒx toggle as the other axes, `Select` with `Default` (unset), `On`, `Off` in
  the simple state and `On`/`Off` in a branch, `axisDefault` `true`. No checkbox: a checkbox has no
  unset state and the D2 discipline (nothing persisted until touched) needs one.
- D-S6-2. `cornerRadius` enters the rules table as a fourth axis beside color, width and style.
  This is not a new decision: R-IRN-35 says it verbatim ("S6 deve mettere il raggio nella tabella
  delle regole come ogni altro asse, quindi uno scalare sarebbe l'unico asse fuori dal
  meccanismo"). The scalar stepper stays for the scalar case (D2: `default`, `Reset`, nothing
  persisted until touched); the disabled stepper with the `rule-driven` label goes away because the
  table now shows the rules. `borderOverrideRows` (`borderOverrides.ts:47`) groups rows by predicate
  over `BORDER_AXES` and takes `shape.border`, while the radius lives on `shape`: Phase 1 measures
  the smallest change that lets the table carry the radius (a fourth entry in the axis list with a
  reader that knows where the axis lives, or a second parameter) without renaming `BORDER_AXES`,
  `BorderOverrideRow` or any class, and says how `divergent` behaves when only the radius carries a
  predicate.
- D-S6-3. Preview: the three-instance strip resolves `cornerRadius` per instance through
  `resolvePreviewInstances` (`previewInstances.ts:174`), like `fill` and the three border axes; the
  two `SymbolPreview` thumbnails (`SymbolEditorModal.tsx:451`, `:538`) draw the `otherwise` value of
  the rules when the value is conditional, the scalar when it is a number, the base radius when
  absent. `authoredCornerRadius` is not changed: it is the guard the canvas uses.
- D-S6-4. No IR version bump, no `VersionFixer`, no migration: both axes are optional and already
  compiled. `validateIR` is not touched unless Phase 1 shows it rejects a conditional `underline`.

## COSA

1. **Phase 1, discovery, read-only, hard stop.** Report at
   `docs/discovery/discovery_2026-09-21_symbol_editor_s6_underline_corner_rules.md` (P4: hypothesis
   under test, objective, files read with full paths, findings with `file:line` and verbatim quotes,
   dependencies and risks, open questions). It must answer, with evidence:
   a. How `TextStyleEditor` collapses an axis to `undefined` (`setAxis`) and whether adding a boolean
      row needs anything beyond a new `AxisRow` and an options constant (name to be grep-checked).
   b. Where `TextStyleEditor` is mounted (`TextStyleField.tsx:181` and any other site), which IR
      labels reach it (object name, class name, row labels, badges), and whether any caller filters
      the axes it shows (a label that must never be underlined would need a prop, not a rule).
   c. The rules table: `borderOverrides.ts` whole (`BORDER_AXES`, `BorderOverrideRow`,
      `borderOverrideRows`, `divergent`), the component that renders the rows and its write path
      (`patchBorderAxis` at `VertexAuthoringPanel.tsx` ~`:425`), and the smallest change that adds
      the radius as a fourth axis per D-S6-2: which files, which signatures, what the row shows for
      an axis that has no value under a predicate, and what happens to the `when` field ticket on
      `BorderOverrideRow` (open, media) if the row type gains a fourth value. If the change needs
      more than `borderOverrides.ts`, the row component and the panel, stop there: Alfonso decides.
   d. How `resolvePreviewInstances` consumers receive their values (`SymbolBoxPreview` props at
      `SymbolBoxPreview.tsx:85-89`, the call at `SymbolEditorModal.tsx:528`) and what the two
      `SymbolPreview` thumbnails would need to draw an `otherwise` value (`toRules` from
      `ui/ConditionalEditor/conditional` gives `default`).
   e. Which of the touched modules load under vitest. `VertexAuthoringPanel.tsx` and
      `IRNodeContent.tsx` import `joiner` and do not (known, 21/9); check `TextStyleEditor.tsx`,
      `previewInstances.ts`, `SymbolBoxPreview.tsx`, `SymbolEditorModal.tsx`. The tests of Phase 2
      are planned on what loads.
   f. The current tests that cover the area: `authoring/__tests__/symbolBoxPreview.test.ts`,
      `formAuthoring.test.ts`, `ir/__tests__/shapeRegistry.test.ts`, `irValidate.test.ts`; which
      assertions would change and which stay.
   Commit the report alone with pathspec and stop. Alfonso decides in chat.

2. **Phase 2, after GO, scoped by the report.** Three commits, code only, in this order:
   - `feat(ir-authoring): underline axis in TextStyleEditor (S6, D-S6-1)`: the row, the options
     constant, nothing else in the file. If (b) found a caller that must hide the axis, one optional
     prop on `TextStyleEditor`, default shows the row.
   - `feat(ir-authoring): corner radius as a fourth axis of the rules table (S6, D-S6-2)`:
     `borderOverrides.ts`, the row component and `VertexAuthoringPanel.tsx`, as the report scopes them. The disabled
     stepper plus `rule-driven` label goes away only if the rules control replaces it; the `default`
     and `Reset` states of the scalar case are unchanged (D2). `patchShape({ cornerRadius })` keeps
     writing `undefined` on Reset.
   - `feat(ir-authoring): preview resolves a rule-driven corner radius (S6, D-S6-3)`:
     `previewInstances.ts` (one new resolved field, `cornerRadius?: number`), `SymbolBoxPreview` props
     if the strip needs a per-instance value it does not get today, `SymbolEditorModal.tsx:341`
     replaced by a resolution that handles the three cases of D-S6-3.
   Tests in the same commit as the code they fix (CLAUDE.md §5: judged by the mutants they kill):
   `previewInstances` resolves a conditional radius per instance and keeps `undefined` for absent;
   the thumbnail resolution returns `otherwise`/scalar/undefined for the three cases; `setAxis`
   collapses `underline: undefined` and keeps a conditional one. For each new test, name in the
   entry the mutation it was shown to catch (flip the branch, run, see red, restore).

## DOVE

Phase 1 reads only. Phase 2 writes, and only these: `frontend/src/components/editor-v2/viewpoint/
authoring/TextStyleEditor.tsx`, `VertexAuthoringPanel.tsx`, `previewInstances.ts`,
`SymbolBoxPreview.tsx`, `SymbolEditorModal.tsx`, `borderOverrides.ts`, the row component the report names, their
tests under `authoring/__tests__/`, and `docs/log-inbox/symbol-editor.md` for the entry. Not touched:
`irTypes.ts`, `irCompile.ts`, `irValidate.ts` (unless D-S6-4 fires, then say so before editing),
`shapeRegistry.ts`, `irDefaults.ts`, `IRNodeContent.tsx`, `ObjectNode.tsx`, `VersionFixer.tsx`, any
SCSS class name, any existing identifier. No new dependency. The three-instance strip stays three.

## COME

Before anything: `git worktree list`, HEAD on `alfonso-frontend-jjtl`, no `MERGE_HEAD` in
`~/jjodel/.git/worktrees/jjodel-release/`, `git status --short` empty, `git log -3 --format=%B |
grep Claude-Session` (a session id other than this chat's in the last hours is a concurrent chat:
stop and say so). Create the P14 symlink `frontend/node_modules -> ~/jjodel/frontend/node_modules`
for gates and dev server; remove it at the end of each phase; never commit it.

**Phase 1.** Read the files listed in COSA whole (§6). Every claim of absence names the search that
supports it (R-RAIL-28). Grep-check every identifier you plan to introduce (`UNDERLINE_OPTIONS` or
whatever name, a resolved `cornerRadius` field, any prop). The report goes in a commit of its own,
pathspec, subject `docs: Phase 1 report, Symbol Editor S6 underline and corner radius rules
(P-2026-09-21-1455)`, body with the P6 `Model:` trailer in the same paragraph as `Co-Authored-By`.
Hard stop.

**Phase 2.** Edits as small as the report allows, `str_replace` over rewrites. After each commit:
`npm run typecheck` at baseline (14 on Linux, 33 on macOS, same errors), `npx vitest run` green with
the count reported (3962 before this lane), `npm run build` green. Dev server for the visual check:
`npm start` from `frontend/` on a free port (3000 and 3001 are taken on the Mac; 3002 was free on
21/9), then hard stop for Alfonso: a syntax viewpoint, a new object view, the Symbol Editor open,
(1) the `Underline` row shows `Default` on a fresh label and `On` on the seeded object name, flipping
to `Off` removes the underline on the canvas, ƒx makes it conditional; (2) a rule on the radius
(for example `otherwise 8`, one rule `16` on a predicate one of the three instances satisfies)
shows its rows in the panel and two different radii in the strip; (3) the two thumbnails draw the
`otherwise` value. Measures from console and DOM, never from screenshots. Only after the visual GO:
the entry in `docs/log-inbox/symbol-editor.md` (P9 format, `Corregge: —`, `Causa: —` unless
something was corrected, `Notes` under 500 characters, `Prompt document name: 2026-09-21 14:55`) in
a docs-only commit with pathspec, together with this prompt file if it is untracked. No rotation
(P13, the log is at 40 and any fold is the exclusive lane's). No push: report the shas and stop.

Stop-and-ask conditions: the border affordance is coupled by name and a generic version costs more
than one file; a caller of `TextStyleEditor` must hide the axis and there is no prop for it;
`validateIR` rejects a conditional `underline`; any test of the area goes red for a reason the
report did not predict.

## RIFERIMENTI

- `docs/decisions.md`: R-IRN-30 (underline), R-IRN-31 and R-IRN-35 (cornerRadius, one axis, trunk
  type and branch semantics), R-IRN-3 (authoring signals an ignored axis), R-IRN-36 (separator
  reads `borderColor` per axis); D1, D2, D5 of the Symbol Editor 1b in
  `docs/handoff/decisions-symbol-editor-1b.md`.
- `docs/prompts/claude_2026-09-19_1730_prompt_corner_radius_alignment.md` (option B, the disabled
  stepper this lane replaces) and its discovery report; `docs/prompts/claude_2026-09-18_2219_prompt_
  default_view_parity.md` (S6 declared owed, decision 4).
- `docs/spec/claude_spec_2026-07-27_ir_textstyle_addendum.md` §7 (seed of new views versus default of saved views).
- `frontend/src/components/ui/ConditionalEditor/` (`ConditionalEditor`, `isConditionalValue`,
  `toRules`), reused verbatim by `TextStyleEditor` and by the fill section of
  `VertexAuthoringPanel`.
- `CLAUDE.md` §5 (a test is judged by the mutations it kills), §6 (read whole files, grep before
  naming), §21.3 (honest self-assessment; `Layer Impact Report: not-required`, out of the critical
  zone).
