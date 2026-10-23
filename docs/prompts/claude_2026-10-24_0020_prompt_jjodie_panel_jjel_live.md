# Jjodie panel redesign: docked panel, canvas preview, editable scripts, live JjEL

Prompt-ID: P-2026-10-24-0020
Chat: C-2026-10-24-0020
Front: jjodie-ui
Lane: full (new UI surface, executor semantics to discover)
Depends: none
Status: da eseguire
Target release: 3.3 (not before the 3.2 freeze closes; no slice enters 3.2)
Request: Alfonso, 2026-10-24 00:40, in the project chat: run with /lane auto and, after the discovery, go on with the implementation (design discussed in a Cowork chat, not on the repo)
Model: claude-opus-5-5 (Phase 1 and Phase 2)

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-jjodiepanel`, branch `jjodie-panel`. Before anything else: `pwd`, branch, `git log -1`,
`git status --short` (only the `frontend/node_modules` symlink may show). Otherwise stop.

## Lane discipline (harness)

Every reply opens with `[P-2026-10-24-0020 · session <id>]`; every final message ends with
`Outcome: done | hard-stop | question | blocked`; every question carries `Recommended: <one line>`. Unattended
(RC-21, RC-25) except the RC-26 list: Alfonso is away, so a question inside this lane's perimeter is answered by its
`Recommended:` line, and an RC-26 item (critical zone, exported interface outside the lane, deletions, new persisted
artifact type, push) stops the lane. Time limit: 90 minutes per phase. Context discipline: never `cat` a whole large
file or a whole log; read ranges and grep.

Two-phase prompt. **Phase 1 is read-only discovery and ends at a hard stop.** Phase 2 starts only after the project chat answers the discovery report with a GO that carries this Prompt-ID.

Design reference (canvas with all mockups, the chosen direction is the bottom row "Chosen direction"):
https://claude.ai/artifact/TMWZRPpqBHrVhidqjnSTLJ

---

## COSA

The Jjodie panel today is a floating window that covers the canvas. Generated JjScript arrives as a long code block in a narrow column, long lines wrap badly, the Run button sits at the top of the block, and nothing shows what a script will do before it runs. The JjEL mode evaluates an expression once, on a fixed target.

Target behaviour, in six slices:

**S1. Docked, resizable panel.** Jjodie docks to the right of the editor instead of floating over the canvas. A vertical drag handle resizes it (min 420 px, max 760 px, default 460 px, width persisted per user). The maximize button and the floating mode go away. The header keeps avatar, name, status dot, context chip, new conversation, overflow menu, close. The Jjodie / JjScript / JjEL switch leaves the header and becomes a compact mode selector inside the input field (left side). The model selector and the disclaimer move to one 11.5 px line under the input. Code blocks lose the nested card padding and use soft wrap with a hanging indent (4ch).

**S2. Collapsed script card.** A generated JjScript is not shown as an open code block. The message shows a card with: status line, script name and line count, effect chips (`+1 StateMachine`, `+4 State`, `+4 Transition`), warnings in one amber line, and actions `Fix warnings`, `Edit script`, `Open as file`. The effect counts come from a dry run (see S4), never from parsing the text.

**S3. JjEL live on selection.** In JjEL mode the expression stays in the input after evaluation and is re-evaluated whenever the canvas selection changes:
- above the input, a result block shows `self <badge> <kind> <path>`, the mode text (`follows selection` or `pinned`) and a pin toggle (icon button, `aria-pressed`); below it the value in mono 15 px, slate-900, with the type in 12 px slate-400. No tinted card, no large colored value.
- pin freezes the current target set; selection changes no longer re-evaluate until unpinned.
- multi-selection (shift-click) turns the value into a compact two-column list, one row per element.
- an expression that does not apply to the target (e.g. a feature that the element's metaclass does not have) shows `not applicable to <Kind>` in slate-400 text, not an error style.
- re-evaluation is debounced 150 ms after the selection settles and aborted after 500 ms (show `timed out` in the same muted style).
- above the result block, a muted history of previous evaluations (`<expr> on <path>   <value>`), last six, newest at the bottom.
- the mockup's sober version is the reference: hairlines only, no nested boxes, no uppercase section labels in this view.

**S4. Ghost preview on the canvas.** When Jjodie produces a script, the script is executed as a dry run and its effects are drawn on the canvas as a preview: new elements with a dashed cyan border (`#06b6d4`) and translucent fill, new edges dashed. A floating bar at the top of the canvas reads `Preview · +N objects · K warnings` with `Discard` and `Apply`. Apply is the only place where the script is committed; it runs as one undoable step. Discard leaves the model untouched. Elements with warnings carry a small amber marker.

**S5. Edit the generated script.** `Edit script` switches the panel from the conversation to an editor of the script (back button `Chat`). Edited lines get a green margin bar; actions: Undo, `Compare with generated`, `Revert`, `Ask Jjodie to review`, `Save as file`. The ghost preview follows the edits (debounced re-run of the dry run); status line `Valid · preview follows your edits` or the first error with its line. Apply stays on the canvas bar.

**S6. Script as a project file.** `Open as file` / `Save as file` stores the script as a project artifact (`<name>.jjs`) listed in the megamodel tree under SCRIPTS and opened as an editor tab with `Run on <model>` and `Save`. Later Jjodie changes to that script arrive as a diff on the file.

Language note, decided: JjScript grammar stays one command per line; no nested-block syntax. Two changes only: an `add` command for multi-valued features (if `set` on a multi-valued feature overwrites today) and a formatter that breaks after `in` (`create instance of X "n"` newline, four spaces, `in a.b`).

## DOVE

To be established by Phase 1. Expected areas (verify, do not assume): the Jjodie panel component and its styles, the chat message renderer for code blocks, the JjScript parser/executor, the JjEL evaluator, the canvas selection state, the canvas overlay layer, the project artifact model (for S6).

Critical zone: no file of the critical-zone list is expected to change. If the ghost preview (S4) can only be drawn by touching `useJjomSync.ts`, `canvasToJjom.ts` or another critical-zone file, stop: that is a Phase 2 design question, write a Layer Impact Report and do not edit.

## COME

### Phase 1 (read-only discovery)

Answer each question with file paths, line numbers and short quotes. Every assertion of absence needs a positive control in the same invocation.

1. Jjodie panel: component tree, how floating and maximized states are implemented, where the mode switch, model selector and context chip live, how code blocks with `Run` are rendered.
2. JjScript executor: entry point, whether it already runs inside a TRANSACTION and how undo works for a script run; whether a script can run against a copy of the model (dry run) or what it would take (clone of the M1 model, a recording proxy, or an effects collector); the exact semantics of `set` on a multi-valued feature (append or overwrite); whether `add` exists; how opposite references are handled (`State.outgoing` vs `Transition.source` in the state machine example).
3. Canvas overlay: is there an existing layer where non-model elements can be drawn above the diagram (React Flow overlay, custom layer)? Can preview nodes be rendered without creating DValue/DVoidEdge objects? Note anything that touches sync paths.
4. Selection: where the current canvas selection lives (Redux slice, hook), whether multi-selection exists, how to subscribe to changes, which object identifies an element (id, L-proxy).
5. JjEL evaluator: public API (signature, sync/async), how `self` is bound, error types (parse, runtime, missing feature), whether evaluation can be aborted or bounded in time, whether it runs in a worker.
6. Project artifacts: is there an artifact type that could hold a script file, or does S6 need a new one? What persistence and VersionFixer implications follow?
7. Estimate for each slice S1..S6: files touched, risk, and which slices can run as parallel lanes (disjoint file sets).

Write the report to `docs/discovery/discovery_2026-10-24_jjodie_panel_jjel_live.md` (naming `discovery_<date>_<description>.md`) and commit it in this phase (P4, docs-only commit). Close it with «Decisions taken (unattended)» and «Decisions awaiting Alfonso».

**HARD STOP after the report.** Do not edit source files in Phase 1.

### Phase 2 (after GO)

Implement the slices in the order and grouping ratified in the GO. Default order: S1, S3, S2+S4, S5, S6. One atomic commit per slice. Visual checks in the built-in browser on `localhost:3000`, light theme only, with DOM measures for: panel width and handle, input mode selector, result block (font sizes, colors, no tinted background), pin toggle state, ghost element border style.

## Scope out

- No change to JjTL, JjModal, JjLet.
- No nested-block grammar for JjScript.
- No dark theme work.
- No change to the AI provider layer or to prompts sent to the model, except what S2 needs to receive the script as a structured payload instead of a markdown block (ask first if this touches the provider layer).
- No removal of existing Jjodie features beyond the floating/maximize modes.

## Stop and ask

- A critical-zone file is needed.
- The dry run cannot be done without mutating the live model.
- `set` semantics change would alter the behaviour of existing saved scripts.
- S6 requires a new persisted artifact type (VersionFixer migration).

## Lane discipline

- Phase 2 runs on its own branch and worktree (`jjodie-panel`); nothing merges into the trunk until 3.2 is released.
- No subagents, no background tasks. One probe run per tool call. Commit as soon as gates are green.
- Surgical staging, `git add <files>`, never `git add .`.
- Mandatory entry in `docs/claude-code-log.md`.
- At lane end, flip `Status` in this file to the execution date, lane and sha in the same docs-only commit as the log entry, then to the outcome of the visual check.
- Commit messages: conventional subject of at most 72 characters with no `(P-...)` suffix (CLAUDE.md §6.2, enforced by the bash-guard hook), e.g. `feat(jjodie): dock panel with resize handle`; the Prompt-ID goes in the body, with the `Model:` trailer (P6).

## RIFERIMENTI

- Design canvas: https://claude.ai/artifact/TMWZRPpqBHrVhidqjnSTLJ (boards "Chosen · Docked panel + ghost preview + script as file", "Chosen · Editing the generated script", "Chosen · JjEL live on selection").
- Jjodel design system tokens: slate neutrals, accent `#334155`, canvas accent cyan `#06b6d4` / selection `#0891b2`, Inter and IBM Plex Mono, ligatures off.
- `docs/decisions.md`, `docs/PROTOCOL.md`, `CLAUDE.md`.

