# Textual syntax T2c: «New model from text» (third slice of T2)

Prompt-ID: P-2026-11-02-0045
Chat: C-2026-11-01-1713
Front: codegen
Status: da eseguire
Lane: full, Phase 2 (the discovery is in `~/.jjodel-lanes/P-2026-11-01-2355/handoff.md`); UI change authorised by Alfonso 2026-11-01 23:44 (R-TXT-23)
Depends: T2a (P-2026-11-02-0024, parser) and T2b (P-2026-11-02-0040, entry and tab), both committed on this branch
Worktree: ~/jjodel-w-textt2, branch textual-t2 (the same tree, at the commit that adds this prompt)
Request: https://claude.ai/code/session_01DQt9R64MscerxeR4VTUREe · RC-52 slice 3 of 3 of P-2026-11-01-2355

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-textt2` on
`textual-t2`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-02-0045 · session <id>]`.
No subagents, no background tasks. Read only the handoff of 2355 (items 5 «new» mode, 9, 10, and the evidence on undo,
JjScript lines and enum/many-valued values), the files those items name, and what T2a and T2b added. Keep context low.

## COSA

1. On the metamodel rows of the left bar, a hover action «New model from text» (the pattern of the instance-manager
   action on model rows), shown only when `useCodegenEnabled()` is true. It opens the Text tab of T2b in «new» mode:
   empty, editable, a model-name input.
2. In «new» mode the text is parsed (T2a) after a pause in typing; errors are Monaco markers; recovered objects are
   never applied (R-TXT-21 (8)). A many-valued attribute with two or more values gets a blocking marker
   («not writable by JjScript yet»), as the handoff decided.
3. «Create model», enabled only when there are no errors and no blocking markers, creates the model in one undo step:
   `beginUndoGroup()`, `createM1(project, mm, false, name)` returning the new `LModel` (additive change), clear the
   script's handles, `U.userHasInteracted = true`, `applyAsOneStep` with the JjScript lines (parents first with
   `create instance of C "h" [in parent.feat]`, then attributes, then references; generated handles for homonyms,
   non-identifier names and nameless objects, followed by `set h.name = "…"`; enum values as the literal's name),
   `endUndoGroup()`, then open the new model's canvas with the default layout.
4. The app bar lists the Text tab: in `syncTabs` (`Navbar.tsx`) one branch for the `txt_` tab-id prefix, as the Data
   manager already has (found by P-2026-11-02-0040).

## DOVE

Handoff items 5 («new» mode in `TextualTab.tsx`), 9 (`frontend/src/pages/components/LeftBar.tsx`), 10
(`frontend/src/pages/components/Navbar.tsx`: `createM1` return value and the `txt_` branch of `syncTabs`, nothing else), plus a new module in
`frontend/src/codegen/textual/` that turns parsed objects into JjScript lines, with tests. List the files in your first
message. No change to `useJjomSync.ts` or `portDistribution.ts`; if one is needed, stop with `Outcome: question`.
Every `codegen/` import from LeftBar goes through the dynamic opener (`check:codegen-lazy`).

## COME

Tests first for the line generator: on T1's corpus, printing a model, parsing it and generating the lines, then running
them through the JjScript planner on an empty model of the metamodel (as `PreviewBar` does), gives a model equal to the
original up to ids. Undo after «Create model» removes the whole model in one step (test it if the store allows, else in
the probe).

## Lane discipline

`git add <specific files>` only. Commit `feat(ui): New model from text (P-2026-11-02-0045)`. Gates: `npx tsc --noEmit`
(baseline), `npx vitest run src/codegen src/components/editor-v2` plus the tests of every touched folder,
`npm run build`, `npm run check:docs`, `npm run check:codegen-lazy`. Visual check on a probe port (30xx, not
3000/3001/3003) with `VITE_CODEGEN=true` and the setting on: two crops under the lane folder, a broken text with its
markers, and the diagram of a model created from text; also undo once and say what the canvas shows. Log entry in
`docs/log-inbox/codegen.md` and the `Status:` flips of this prompt and of 2355 (`eseguito 2026-11-02 · in three slices:
0024, 0040, 0045`) in one docs-only commit. No push, no merge. End with «Decisions taken (unattended)», «Decisions
awaiting Alfonso», `Outcome: done | hard-stop | question | blocked`.
