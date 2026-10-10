# Code generation S5: experimental setting, lazy mount, code panel with navigable origin

Prompt-ID: P-2026-10-10-1825
Chat: C-2026-10-10-0046
Lane: full (UI slice with a visual check; touches `EditorV2.tsx` with one lazy mount and one pill, adds a build
gate). Model: the default of `.claude/settings.json`, no deviation. No critical-zone go-ahead (none needed,
discovery §I.3: `EditorV2.tsx` is a hot file, not a §3.1 file).
Depends: P-2026-10-10-0945, P-2026-10-10-0950
Status: eseguito 2026-10-10 · lane codegen-panel · code f95d0a44f · docs 7b83066e0 · tsc 14 = base, vitest 8064 (8052 + 12), build exit 0, check:codegen-lazy green (only setting.ts eager; CodePanel chunk 29.0 kB + 8.9 kB CSS, worker 1.8 kB), probe 41/41, mutation bench 6/6 · visual check passata 2026-10-10 (RC-23 by the chat on 8 crops, GO by Alfonso 20:18); follow-ups: long lines clipped without visible scroll, worker start counted in the run timeout, Backspace in editor textareas (ticket)

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt says otherwise).

Worktree: `~/jjodel-w-codegen-panel`, branch `codegen-panel`, cut from the trunk tip; the branch carries the docs commit
adding this prompt (S1, S2, S3 and S4 are merged there), `frontend/node_modules` symlinked (P14). Before anything
else: `pwd`, branch, `git log -1`, a clean `git status`, and `frontend/src/codegen/engine/generate.ts` plus
`frontend/src/codegen/runner/runner.ts` present. Otherwise stop with `Outcome: blocked`.

## Lane discipline
Every reply of this session opens with `[P-2026-10-10-1825 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
The lane does not touch the `Status` line of this prompt; the chat flips it.

## Context (measured, do not redo the analysis)

Contract: `docs/spec/claude_spec_2026-10-10_code_generation_pilot.md` §2, §3, §5; R-GEN-2, R-GEN-3, R-GEN-12,
R-GEN-14 in `docs/decisions.md`. Evidence: `docs/discovery/discovery_2026-10-10_code_generation_pilot.md`, read §E
(all), §H.3, §I.4 (row S5), §I.5 and U4, U5, U7 in the table of unattended decisions. Read the log entries of the
merged slices: `docs/log-inbox/codegen-jjel.md`, `codegen-stc.md`, `codegen-engine.md`, `codegen-runner.md`.

In short:
- No experimental setting exists. The precedent is `frontend/src/hooks/useInterfaceMode.ts` (localStorage key,
  getter, hook with cross-tab sync, registry event). Key `jjodel.experimental.codegen`, default off, one checkbox
  under a new «Experimental» label in `frontend/src/pages/settings/AdvancedSettings.tsx`.
- No feature is lazy today and `vite.config.ts` has no `build` block. EditorV2 renders
  `React.lazy(() => import('../../codegen/ui/CodePanel'))` only when the setting is on; every generator module is
  reachable only from that dynamic import. Eager residue: `codegen/setting.ts`, the lazy mount line, the JjEL
  option and fields of S1.
- `generate` receives the output of `buildEvalContext` from its caller (decided during S2, recorded in
  `docs/log-inbox/codegen-engine.md`): the panel builds it as the simulator does through `simBridge.ts:252`
  (`ContextBuilder`) and hands it in. The real wiring is first tested here.
- Templates persist in the metamodel's `_state` as `genTemplates`, written through the existing `state` setter
  (pure `SetFieldAction`), encoded by `templateCodec.ts`.
- Navigation: `SELECT_NODE` (`events/registry.ts:24`, handled at `EditorV2.tsx:1051-1056`) selects a node and
  deselects every edge; `CANVAS_ELEMENT_SELECTED` (`useJjomSelection.ts:72-73`) reports the canvas selection.
  For a transition drawn as an edge, select its source node and outline the edge in the panel's own overlay
  (R-GEN-14).
- Panel widget: a `<pre>` with a line gutter and one span per fragment, not Monaco (U5; `irTabs.tsx:246-250`).

## WHAT

1. **Setting.** `frontend/src/codegen/setting.ts`: `getCodegenEnabled()`, `useCodegenEnabled()`, a registry event
   for changes (one entry in `frontend/src/events/registry.ts`). Checkbox in `AdvancedSettings.tsx`.
2. **Lazy mount and pill.** In `EditorV2.tsx`, one `React.lazy` mount and one «Code» pill beside the simulation
   pill, both rendered only when the setting is on, and the pill only on a model whose metamodel has
   `genTemplates`, or in Advanced mode on any metamodel. Nothing else in `EditorV2.tsx` changes.
3. **Panel** `frontend/src/codegen/ui/CodePanel.tsx` (+ `CodePanel.scss`, `TemplateEditor.tsx`): a floating panel
   with two tabs.
   - «Templates»: list, add, rename, delete; name, params, body; saved through the `state` setter.
   - «Output»: generated text with a line gutter; error fragments listed above the text; «Run» (refused while
     error fragments exist), a timeout field (default 2000 ms), and the run's results or its error. A runtime
     error points at the generated line and at the element whose fragment produced it.
   - Hover on a span outlines its fragment and shows «element · feature · transformation».
   - Click on a model-origin span dispatches `SELECT_NODE`; a canvas selection gives `code-span--linked` to
     exactly the spans whose origin id is the selected element.
   - A short help line says that templates are lost in the `.ecore` export (U3).
   Styling with existing tokens (slate and cyan, 11px secondary text, 8px grid, Bootstrap Icons only); a new
   tokens file only if a variable is truly missing (rule 28). New class names checked with a global search first.
4. **Lazy gate** `frontend/scripts/gates/check-codegen-lazy.ts` per discovery §E.4 (vite build `--manifest` into a
   temp dir, closure of `imports` from the entry, fail on any `src/codegen/` source except `setting.ts`, fail
   unless `src/codegen/ui/CodePanel.tsx` is a `dynamicImports` target), plus one script entry in
   `frontend/package.json`, no dependency.
5. **Tests and probe.**
   - vitest: setting getter, hook and event; the pill's visibility rule.
   - Probe `frontend/scripts/probe/codegen-panel.ts` with `lane-run probe` on a free port between 3080 and 3099
     (never 3001), on one of the demo state machines (DemoESM or the one S2's tests use):
     setting off: 0 requests matching `/src/codegen/(?!setting)`, and node boxes of the four demo scenes with a 0 px
     delta against the base; setting on: write two templates, generate, then for every output span with a model
     origin, a click makes that element the only selected node within 400 ms, and a canvas selection marks
     exactly the spans with that id; «Run» on a module with a deliberate `throw` reports the right line and
     element; a `while (true) {}` is stopped at the timeout.
   - Crops for the visual check: Settings → Advanced with the checkbox; the editor with the pill; the panel on
     each tab; the hover state; the linked state. Light theme only. Save them where the lane's checklist puts
     crops, with their sizes, for the chat's RC-23 check.
6. **Gates.** `npx tsc --noEmit` (same error set as base), vitest (base counts plus new), `npm run build`, the
   lazy gate, the probe. Gates in the foreground; above a load average of 20, wait and rerun before calling a red
   real.
7. **Mutation bench** (P11), listed in the commit body: a static import of the engine in `EditorV2.tsx` (lazy gate
   red); the dynamic import deleted (control clause red); the pill shown with the setting off; `code-span--linked`
   applied by element class instead of id. Survivors are reported, not repaired silently.
8. **Commits.** One `feat(codegen): …` commit with code, tests, gate and probe; then the log entry, written with
   the `log-entry` skill into `docs/log-inbox/codegen-panel.md`, in a docs commit. Stop with `Outcome: hard-stop`
   after the crops: the visual GO comes from the chat or Alfonso. No merge.

## DOVE

`frontend/src/codegen/setting.ts`, `frontend/src/codegen/ui/{CodePanel.tsx,CodePanel.scss,TemplateEditor.tsx}`,
`frontend/src/codegen/__tests__/setting.test.ts`, `frontend/src/pages/settings/AdvancedSettings.tsx`,
`frontend/src/components/editor-v2/EditorV2.tsx` (one lazy mount, one pill), `frontend/src/events/registry.ts`
(one event), `frontend/src/styles/tokens/` (one file, only if needed), `frontend/scripts/gates/check-codegen-lazy.ts`,
`frontend/package.json` (one script entry), `frontend/scripts/probe/codegen-panel.ts`,
`docs/log-inbox/codegen-panel.md`. More than five files: this list is the confirmation (rule 19).

## NON FARE

- No edit to `frontend/src/codegen/engine/`, `runner/`, `target/`, `stcAccess.ts` or `frontend/src/jjel/`. A gap
  there stops the lane with `Outcome: question` and a `Recommended:` line.
- No change to the `SELECT_NODE` handler (the edge path is a follow-up, R-GEN-14).
- No `DUser` field, no `DState.languages`, no `DV.tsx`, no `VersionFixer.tsx`, no `vite.config.ts` edit.
- No dark theme work (D-UI-15). No new icon library.
- No dependency, no `git add .`, no `git stash`, no push.

## RIFERIMENTI

- Spec §2, §3, §5; R-GEN-2, R-GEN-3, R-GEN-12, R-GEN-14; discovery §E, §H.3, §I.5.
- Project Knowledge `template-task-visivi` (the three points of a visual task); `CLAUDE.md` §5, §21, rule 19,
  rule 28; `docs/PROTOCOL.md` P8, P9, P11, P13, P14, P16.
