# Textual syntax T2b: the textual entry in the viewpoint picker and the read-only Text tab (second slice of T2)

Prompt-ID: P-2026-11-02-0040
Chat: C-2026-11-01-1713
Front: codegen
Status: da eseguire
Lane: full, Phase 2 (the discovery is in `~/.jjodel-lanes/P-2026-11-01-2355/handoff.md`); UI change authorised by Alfonso 2026-11-01 23:44 (R-TXT-23)
Depends: T2a (P-2026-11-02-0024, parser, committed on this branch); T1 and T3 on the trunk
Worktree: ~/jjodel-w-textt2, branch textual-t2 (the same tree, at the commit that adds this prompt)
Request: https://claude.ai/code/session_01DQt9R64MscerxeR4VTUREe · RC-52 slice 2 of 3 of P-2026-11-01-2355

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-textt2` on
`textual-t2`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-02-0040 · session <id>]`.
No subagents, no background tasks. Read only the handoff of 2355 (items 5 to 8 and its evidence section), the files it
names for those items, and `frontend/src/codegen/textual/`. Keep context low: print only what a decision needs.

## COSA

1. In the toolbar's viewpoint picker, a synthetic entry labelled with the language's name (the metamodel's name by
   default), after the viewpoints and next to «Data manager», on the sentinel pattern of
   `frontend/src/components/editor-v2/dataManagerOption.ts` (`@textual`, intercepted before any viewpoint write). It is
   shown only when `useCodegenEnabled()` is true (R-GEN-2; adopted unattended from 2355, to confirm with Alfonso).
2. Picking it opens, in the dock, a tab with the model's text printed by T1 in Monaco, **read-only**, with a toggle to
   the concrete EBNF, also read-only. The opener is reached by dynamic import only (`check:codegen-lazy`).
3. Nothing else: no «New model from text», no editing, no LeftBar change (slice T2c).

## DOVE

Handoff items 5 (read-only mode only), 6, 7 and 8: `frontend/src/codegen/textual/ui/TextualTab.tsx` (+ `.scss`,
design tokens only), `frontend/src/codegen/textual/ui/openTextualTab.tsx`, `dataManagerOption.ts`, `Toolbar.tsx`.
List them in your first message. Global search for every new identifier and CSS class. No change to DockManager,
TabDataMaker, `useJjomSync.ts` or `portDistribution.ts`; if one is needed, stop with `Outcome: question`.

## COME

Tests first where the code is testable without the store: the sentinel and its label (as
`components/editor-v2/__tests__/dataManagerPicker.test.ts` does), the label falling back to the metamodel's name.
Monaco as in `components/abstract/tabs/ScriptTab.tsx`. Bootstrap Icons only, 11 px labels, no layout shift between the
text and the EBNF view.

## Lane discipline

`git add <specific files>` only. Commit `feat(ui): textual entry and read-only Text tab (P-2026-11-02-0040)`. Gates:
`npx tsc --noEmit` (baseline), `npx vitest run src/codegen src/components/editor-v2`, `npm run build`,
`npm run check:docs`, `npm run check:codegen-lazy`. Visual check on a probe port (30xx, not 3000/3001/3003) with
`VITE_CODEGEN=true` and the setting on: two crops under the lane folder, the picker with the textual entry, and the tab
with a model's text (and one of the EBNF view). Log entry in `docs/log-inbox/codegen.md` and the `Status:` flip of this
prompt (edit the line directly) in one docs-only commit. No push, no merge. End with «Decisions taken (unattended)»,
«Decisions awaiting Alfonso», `Outcome: done | hard-stop | question | blocked`.
