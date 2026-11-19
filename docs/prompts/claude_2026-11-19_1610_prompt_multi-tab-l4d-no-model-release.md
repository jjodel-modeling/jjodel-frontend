# Multi-tab L4d: no global clear from a model-less editor, composition edges keyed by model

Prompt-ID: P-2026-11-19-1610
Chat: C-2026-11-18-2337
Front: multi-tab
Status: superseded by P-2026-11-19-1625 (blocked: the critical-zone hook refused its edits without the go-ahead flag; its tests and plan were carried by the relaunch)
Lane: full (small, critical zone, standing go-ahead R-MT-26 (4))
Depends: P-2026-11-19-1530 (L4c, registries keyed by model, commits 2837e117d, dfef10a39, fc5a1f552 on this branch, not yet merged)
Worktree: ~/jjodel-w-mtl4c, branch multi-tab-l4c, at this prompt's commit
Request: https://claude.ai/code/session_01DQt9R5BmL7gprPWEQuuqbP (Alfonso 2026-11-19 15:59: «quando un editor viene chiuso e il modello che contiene non è ultimo non devo svuotare i registri»; words in `~/.jjodel-lanes/P-2026-11-19-1610/request.md`)
Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No subagents, no background tasks. A dev server on a free port (lsof first; never 3000, 3001, 3003, 3061, 3062, 3790, 4700), stopped before exit. Every reply opens with [P-2026-11-19-1610 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs; never cat a log. Read only §11 of `docs/discovery/discovery_2026-11-19_multi_tab_editor_groups.md` and the regions you change.

## COSA

Two residues that P-2026-11-19-1530 left, both named in its hard stop:

1. An editor that never had a model, on unmount, still clears the entries of every model. Alfonso's rule: closing an editor clears registries only when it releases the last canvas of its model, and then only that model's entries. An editor with no model releases nothing: its unmount must clear nothing (no global clear, no shared-bucket clear). Find the branch in `useJjomSync.ts` / `syncState.ts` and make it a no-op; say in the reply whether anything relied on that global clear (read the callers, do not guess).
2. `createCompositionEdgeForObjects` (`canvasToJjom.ts:1557`) still files under the shared bucket. Give it the optional trailing `modelId` as the other writers have, and pass the model id from its two callers: `components/contextMenu/ContextMenu.tsx:372` and `components/editor-v2/hooks/createAdapter.ts:468`. `transformJjomGraph` stays as it is: its only caller is `useJjomData-toDelete.ts`.

Files (approved): `syncState.ts`, `useJjomSync.ts`, `canvasToJjom.ts`, `ContextMenu.tsx`, `createAdapter.ts`, the `syncStateByModel` test. Anything else needs a question.

## COME

Tests first: a model-less release leaves every model's entries and the shared bucket untouched; a composition edge written with a model id survives the release of another model. Then the code. Gates: typecheck at baseline, vitest green (the three known import failures excepted), build ok, `npm run check:docs`. Re-run the probe of P-2026-11-19-1530 (S1 to S5, from its lane folder) and add S6: create a composition between two objects from the context menu on model B while model A's last tab closes, the edge stays registered. Commit code, then docs: append to report §11, amend nothing in R-MT-29 except one added sentence for the two residues.

HARD STOP with the probe numbers.
