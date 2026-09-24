# Prompt: simulation panel, one face per active editor

Prompt-ID: P-2026-09-24-1005
Chat: C-2026-09-24-1005
Status: da eseguire
Follows: P-2026-09-23-1850 (executed, `e6cb005a4`, `f486bc777`). This is a new lane, not a reopening of 1850.

Worktree: `~/jjodel-sim`, branch `simulation-engine`, at `f486bc777` plus the commit that adds this file. Do NOT merge the trunk: `simulation-engine` and `alfonso-frontend-jjtl` have diverged since `293e7fec6` (the trunk carries docs only), and the merge is a separate decision. Do not work in `~/jjodel-release` or `~/jjodel`. Dev server for this worktree: port 3002.

Two-phase. Phase 1 is read-only and ends with a saved report and a hard stop. Phase 2 starts only on a GO that opens with this ID.

## COSA

Alfonso's rule for the Simulation panel, two faces:

1. Opened in a **metamodel** editor, the panel shows the configuration (the role selects).
2. Opened in a **model** editor, the panel shows the run controls (Reset, Step, Stop, the Events section). If the configuration on the metamodel is incomplete, it shows a message instead, and the message names what is missing.

`SimulationPanel.tsx` already branches on `isModelMode`, so the rule is written in the component. What breaks it, per the chat's reading of the code (a hypothesis, to be measured in Phase 1): every `EditorV2Inner` portals its own `SimulationPanel` to `document.body` (`EditorV2.tsx:4399`), and rc-dock keeps inactive tabs mounted and hides them with CSS on the tab pane. A portal escapes that hidden pane. With a metamodel tab and a model tab open, two `.sim-panel` elements sit in `<body>` at the same fixed position (`left: 216px; bottom: 48px; z-index: 850`), and the one later in DOM order paints on top whatever tab is active. The user then sees the metamodel's configuration in a model, or the model's controls in the metamodel.

Second, smaller defect: the incomplete-configuration hint today is a fixed string ("Configure simulation roles on the metamodel") and does not say which roles are missing. Completeness is `ENGINE_ROLE_KEYS` (`simInitial`, `simTerminal`, `simOwnedTransitions`, `simNextState`); the ticket in the 1850 log entry notes that `simTerminal` being required forces a dummy terminal metaclass on a statechart without a final state.

Out of scope, do not start: engine semantics (`model/simulation/`), guards, actions, interleaving, anything R-SIM-17..20. `PolymetricView` and the context menu are portaled the same way but are gated by `isOpen`/`contextMenu`; leave them alone and only record in the report whether they share the defect.

## DOVE

Phase 1 reads, under `frontend/src/`: `components/editor-v2/sim/SimulationPanel.tsx`, `simulation-panel.scss`, `simRunState.ts`; `components/editor-v2/EditorV2.tsx` around the portals (lines 4370-4405) and the root element `EditorV2Inner` returns; `components/abstract/tabs/EditorSwitch.tsx` (`ActiveEditorProvider`), `MetamodelTab.tsx`, `ModelTab.tsx`, `TabDataMaker.tsx`, `components/abstract/Dock.tsx`; `styles/tokens/_z-index.scss`; `model/simulation/stcFromRoles.ts` (only to read what "complete" means).

Phase 2 is expected to touch `SimulationPanel.tsx`, `simulation-panel.scss` and `EditorV2.tsx` (the portal site only). `EditorV2.tsx` is not in the critical zone, but touch only the `SimulationPanel` mount. Any other file is declared in the report before the GO.

## COME

### Phase 1 (read-only)

1. **Measure the hypothesis before anything else.** On 3002, open one project with a metamodel tab and a model tab, both opened once. In the console: `document.querySelectorAll('.sim-panel').length` and, for each, which editor it belongs to (its `modelid` via React props or a `data-` attribute read from the DOM, whatever is available read-only). Switch tabs, open the chip, report what each tab shows. If the count is 1 with two tabs open, the hypothesis is wrong: stop, report what you saw and what else explains the symptom (for example `isModelMode` resolving late in `useEditorMode`, or `open` state surviving a tab switch), and wait.
2. Describe how rc-dock hides an inactive tab here (cached panes, `display:none` or `visibility`, unmount), with file and line.
3. **Fix options, recommend one, do not decide.**
   (a) Mount the panel inside the editor's own root instead of `document.body` (no portal, or a portal into a node owned by `EditorV2Inner`), with `position: absolute` against the editor stage. The hidden tab hides its panel for free. Check what the portal to `<body>` was protecting against: `overflow: hidden` or a `transform` on an ancestor that would clip or re-anchor a fixed element, stacking against React Flow's layers and the palette rail. Measure, do not assume.
   (b) Keep the portal and render the panel only when this editor is the active one, from an active-editor signal that already exists (`ActiveEditorProvider`, rc-dock's active tab, or similar). Say which signal, where it lives, and whether it is correct with two dock panels side by side (two visible editors).
   Recommend with the diff each implies. The chat leans to (a) because it has no state to keep in sync; overturn it if the measurement says so.
4. Incomplete configuration message. Propose the text and the rule: list the missing engine roles by their panel labels (`Initial`, `Terminal`, `Owned transitions`, `Next state`), and name the metamodel. Also the case where the event role is half set (`simEvent` without `simTrigger` or the reverse): the run works without events per R-SIM-16, so say whether it deserves a warning line under the controls. Draft wording in English, 11px secondary text, no layout shift.
5. **Open question for Alfonso**: should `simTerminal` stop being required for completeness (a run with no terminal role never reaches Terminated, and Deadlock/waiting still apply)? Say what in `stcFromRoles`, `runStatus` and the panel would change, and whether it touches `model/simulation/`. Recommend; do not decide.
6. Test plan: what is unit-testable (the missing-roles list as a pure function) and what stays visual. One mutation per rule.
7. Baseline gates now: typecheck error set (14 expected), vitest count, build.

Save the report as `docs/discovery/discovery_2026-09-24_sim_panel_faces.md`: objective, files read with full paths, the measurement of item 1 verbatim, findings, risks, open questions for Alfonso (item 5 first, then the choice of item 3), the proposed Phase 2 diff in prose. Commit it alone, with pathspec, on `simulation-engine`. Hard stop: the phase is not complete until the report is on disk and committed.

### Phase 2 (after GO)

1. Implement what the GO ratifies.
2. Tests per Phase 1 item 6, mutations reported.
3. Gates: typecheck with the same error set as the baseline, vitest, build, `npm run check:docs`, `npm run check:agents`.
4. Hard stop for Alfonso's visual check on 3002, same project with a metamodel tab and a model tab both open: (i) in the metamodel the chip opens the role selects, in the model it opens the run controls, switching tabs back and forth several times; (ii) exactly one `.sim-panel` visible at any time; (iii) with one engine role cleared on the metamodel, the model shows the message naming it, and the controls come back when it is set again; (iv) the turnstile of 1850 still runs as before.
5. After the OK: one code commit with pathspec, then one docs commit with the entry appended to `docs/log-inbox/simulation.md` and the Status line of this file flipped per P13. P6 trailer `Model: ...` in both bodies. Subjects end with `(P-2026-09-24-1005)` and stay within 72 characters without the suffix.

Never: `git add .`, `git stash`, merges, commits on `alfonso-frontend-jjtl` or in `~/jjodel-release`, push.

## RIFERIMENTI

- `docs/decisions.md`: R-SIM-1, R-SIM-2, R-SIM-5, R-SIM-13, R-SIM-16.
- `docs/prompts/claude_2026-09-23_1850_prompt_sim_step1_events.md` and its log entry in `docs/log-inbox/simulation.md` (the Terminal-role ticket).
- `docs/discovery/discovery_2026-09-23_sim_step1_events.md`.
