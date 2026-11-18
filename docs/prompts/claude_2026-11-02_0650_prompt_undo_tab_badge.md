# UI: undo of «Create model» closes the canvas tab; Text tabs get an app-bar badge (R-TXT-25 (1), (4))

Prompt-ID: P-2026-11-02-0650
Chat: C-2026-11-01-1713
Front: codegen
Status: eseguito 2026-11-02
Lane: fast (inline discovery reported in the log entry, then a small fix)
Depends: T2 merged (aa68ad049); R-TXT-25
Worktree: ~/jjodel-w-undotab, branch undo-tab-badge (from the trunk commit that adds this prompt)
Request: https://claude.ai/code/session_01DQt9R64MscerxeR4VTUREe · Alfonso, 2026-11-02 06:43, «Ok alle raccomandazioni»

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-undotab` on
`undo-tab-badge`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-02-0650 · session <id>]`.
No subagents, no background tasks. Keep context low.

## COSA

1. After «Create model» (New model from text) and one undo, the model's canvas tab shows a bare «closed tab» text
   (crop `~/.jjodel-lanes/P-2026-11-02-0235/5-after-undo.png`). First find out, with a probe, whether the same happens
   when undoing any model creation (Navbar «new model»): say which. Then fix it so that a tab whose model no longer
   exists closes, wherever the cause is (dock or tab rendering), with the smallest change.
2. Text tabs (`data-type="textual"`, ids `txt_`) get an app-bar badge like the other tab types (`tab-title.scss`
   `data-type` icons; the Navbar `syncTabs` branch added by T2c).

## DOVE

Inline discovery first (at most 10 lines in the log entry): where «closed tab» is rendered and why the tab survives.
No change to `useJjomSync.ts` or `portDistribution.ts`; if one is needed, or more than 4 files, stop with
`Outcome: question`.

## Lane discipline

`git add <specific files>` only. Commit `fix(ui): close the tab of an undone model; badge for Text tabs
(P-2026-11-02-0650)`. Gates: `npx tsc --noEmit` (baseline), vitest on the touched folders, `npm run build`,
`npm run check:docs`. Visual check on a probe port (30xx, not 3000/3001/3003) with `VITE_CODEGEN=true`, codegen setting
on, «What's new» suppressed: crops after undo (no tab left) and of the app bar with a Text tab badge, under
`~/.jjodel-lanes/P-2026-11-02-0650/`. Log entry in `docs/log-inbox/codegen.md` and the `Status:` flip (edit the line) in
one docs-only commit. No push, no merge. End with «Decisions taken (unattended)», «Decisions awaiting Alfonso»,
`Outcome: done | hard-stop | question | blocked`.
