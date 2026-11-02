# Textual syntax T6b: edit an existing model in the Text tab

Prompt-ID: P-2026-11-03-0021
Chat: C-2026-11-02-1814
Front: codegen
Status: da eseguire
Lane: full (UI on top of the T6a engine; writes to models)
Depends: none
Worktree: ~/jjodel-w-textt6b, branch textual-t6b (from the trunk commit that adds this prompt)
Request: none (Alfonso 2026-11-02 22:54: the notation is closed only when an existing model can be edited from text)

Before anything else run pwd, git branch --show-current and git status --short; if the tree is not ~/jjodel-w-textt6b on textual-t6b and clean, stop with Outcome: blocked. Every reply opens with [P-2026-11-03-0021 · session <id>]. No subagents, no background tasks. One probe run per tool call. Never cat a probe or gate log. Commit each green step: this front often hits the context ceiling. Near the ceiling, commit what is green and write the handoff.

## COSA

The engine is on the trunk (`textMatch.ts`, `textDiff.ts`, `textApply.ts`, `applyTextEdit`). Wire it into `ui/TextualTab.tsx`, per R-TXT-22 and R-TXT-26:

1. The Text view of a model becomes editable. The Read-only badge goes. The EBNF view stays read-only. A tab with no model behaves as today.
2. On a pause in typing (one constant, about 800 ms), parse. If there are errors: markers in the text, model untouched. If the plan is refused: markers or the issue list with the reason, model untouched. Otherwise apply through `applyTextEdit`.
3. Identity: pass the spans of the previous parse to the match (R-TXT-22). After an applied edit the text stays as the user typed it: no reprint, no caret jump, no scroll jump. Measure the caret after an application.
4. A change to the model from elsewhere (a diagram edit, undo, another tab) while the text has no pending edit: reprint. With a pending or broken edit: keep the user's text, show one line saying the model changed. Never overwrite what the user typed. (Span-wise reprint with comments kept is T9/T10.)
5. Undo: one undo step per application restores model and text together (R-TXT-26). Monaco's own undo inside an unapplied edit stays Monaco's. After an undo of an application the text is reprinted (discovery §A.5).
6. Uncertain matches: a small panel listing them (old, new, reason) with one confirm action; nothing is applied until confirmed. Cross-model deletion: the same panel, flagged. No dialog when nothing is uncertain.
7. Unprinted objects (R-TXT-30) and the refusal of a text with a reference outside it: the reason is visible, and the model is untouched.

No Apply button (R-TXT-26). No moves or reorder (T7): they show as a refusal with its reason. No form (T4b).

## Generality

No hardware concept. Do not read ~/Downloads/micron-proto. Use the fixtures of the T6a tests and one saved example from another domain.

## DOVE

`frontend/src/codegen/textual/ui/TextualTab.tsx`, `ui/TextualTab.scss`, `ui/openTextualTab.tsx`, a new `ui/` panel component, the `textual/` engine files only for what wiring exposes, their tests. Any other file: a question with Recommended:. Critical zone out of scope: stop. Read `TextualTab.tsx` before writing; check the design tokens in use (slate and cyan, 11px labels, 8px grid, Bootstrap Icons only, no layout shift when the panel or the markers appear).

## COME

Tests first where pure: pause logic, the keep-or-reprint rule of point 4, the panel's data. In-app probe, copying and adapting `~/.jjodel-lanes/P-2026-11-02-1930/probe.mjs` into this lane's folder (a probe is not a repo file), light theme, typing with real key events: edit an attribute and see the diagram change; add an object, delete one; break the text, model unchanged, markers shown; fix it; one undo restores both; edit the diagram with no pending edit, text reprints; edit the diagram with a broken text, text kept; a rename with the same body keeps the object's id; homonyms open the panel. Crops in the lane folder, with the DOM measures. Mutation bench in the commit body: apply despite a refusal; reprint over a pending edit; two undo steps; spans not passed.

## HARD STOP

Outcome: question on an exported interface that breaks outside this lane or an amendment to an R- row. Outcome: hard-stop at the context ceiling, after the handoff.

## Gates and closure

From frontend/, one tool call each, through node scripts/run-quiet.mjs LABEL -- CMD: npx tsc --noEmit; npx vitest run src/codegen src/components/editor-v2/__tests__/textualPicker.test.ts; npm run build; npm run check:docs; npm run check:codegen-lazy (both modes). Commit feat(codegen): edit an existing model from its text (P-2026-11-03-0021), trailer Model:. Log entry in docs/log-inbox/codegen.md and the Status: flip in one docs-only commit, left uncommitted until the visual check per RC-17. No push, no merge. Final message: Decisions taken (unattended), Decisions awaiting Alfonso, then Outcome:.
