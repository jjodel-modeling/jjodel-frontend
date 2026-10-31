# Codegen: SPEC update for origins through `+` and `join`, and the stale-draft note after a metamodel deletion

Prompt-ID: P-2026-10-31-1712
Chat: C-2026-10-31-1328
Front: codegen
Status: da eseguire
Lane: fast (one spec paragraph, one UI condition plus a test)
Depends: P-2026-10-31-1341 and P-2026-10-31-1342 (both merged)
Worktree: ~/jjodel-w-cgspec, branch cg-spec-note (from the trunk tip after P-2026-10-31-1702)
Request: none (Alfonso, «ok alle raccomandazioni», 2026-10-31 15:08; note found by the chat's visual check at 15:15)

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-cgspec` on
`cg-spec-note`, stop with `Outcome: blocked`. Check that `P-2026-10-31-1712` exists only as this file in
`docs/prompts/` and as this lane in `~/.jjodel-lanes/`. Every reply opens with `[P-2026-10-31-1712 · session <id>]`.
No subagents, no background tasks. Commit as soon as the gates are green.

## COSA

1. `jjel/SPEC.md` around line 702 says the text host takes over `+` and `join` only when a Text is involved. Since
   P-2026-10-31-1341 a member read that is an operand of `+`, or an item of `map(...).join(...)`, carries its model
   origin under a text host, values unchanged, literals opaque. Update that paragraph to say so, in the SPEC's style,
   with one example; nothing else in the SPEC.
2. In the Templates tab, after the generator's metamodel is deleted while a draft is open, the pane shows, besides
   «This metamodel is gone: its templates cannot be saved», the note «This template changed outside the editor since
   the draft began: Save writes the draft over it, Revert takes the stored one». The second note is wrong there:
   nothing changed the template, the store simply went away, and Save is disabled anyway. Show the stale-draft note
   only when the metamodel still exists. Add a test for that condition.

## DOVE

`frontend/src/jjel/SPEC.md` (confirm the path), `frontend/src/codegen/ui/TemplateEditorTab.tsx` (or the component
that renders the note), a test in `frontend/src/codegen/ui/__tests__/`.

## COME

Gates: `npx tsc --noEmit`, `npx vitest run src/codegen`, `npm run build`, `npm run check:docs`.

## Lane discipline

`git add <specific files>` only. Conventional commit messages in English, one line, suffix `(P-2026-10-31-1712)`.
Log entry in `docs/log-inbox/codegen.md` and the `Status: da eseguire` flip in one docs-only commit. No push, no merge
into the trunk. Report closes with «Decisions taken (unattended)» and «Decisions awaiting Alfonso», then
`Outcome: done | hard-stop | question | blocked`.
