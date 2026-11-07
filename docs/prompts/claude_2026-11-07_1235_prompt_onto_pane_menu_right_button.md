# Ontological instantiation: the right button opens the pane menu, it no longer pans

Prompt-ID: P-2026-11-07-1235
Chat: C-2026-10-25-2159
Front: instance-of
Lane: full (one prop in `EditorV2.tsx`, behaviour shared by every notation; a decision row)
Status: da eseguire
Request: none (Alfonso, 2026-11-07 12:32: «decidi tu», on the chat's option 1)
Depends: P-2026-11-07-0155
Corregge: —
Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-oi-s3b`, branch `oi-s3b`, its tip this prompt's `docs:` commit, whose parent is `5101a9ecb`.
Check `pwd`, the branch, `git log -2` and a clean `git status`; otherwise stop with `Outcome: blocked`. Model and tier:
heavy, effort `xhigh`. Alfonso's dev server runs from this worktree on port 3005 and will reload: do not stop it;
probe ports outside 3000, 3001, 3005, 3015.

## Lane discipline

Every reply opens with `[P-2026-11-07-1235 · session <id>]`; final line `Outcome: done | hard-stop | question |
blocked`. Every question carries `Recommended: <one line>`. Time limit 60 minutes.

- One probe run per call, `uptime` beside it; before a probe wait for the 1-minute load under 20 (one `uptime` per
  call, never a sleep over 60 s). Assets under `/tmp`.
- Code, probe and docs in separate commits (RC-13). Subjects at most 72 characters, `Model:` trailer.
- No push, no merge. In `EditorV2.tsx` only the `panOnDrag` line; no other product file.

## Finding (chat, 2026-11-07 12:30)

On Alfonso's trackpad a right click on the empty canvas pans and opens no menu. `EditorV2.tsx:5110` sets
`panOnDrag={[0, 1, 2]}`; with the right button in `panOnDrag`, `@xyflow/system` 12.10 calls `onPaneContextMenu` only when
no pan event fired between press and release (`node_modules/@xyflow/system/dist/esm/index.mjs:2675`, `:2782`,
`:2797-2801`, flag `usedRightMouseButton`), and the Pane's own `onContextMenu` returns early when `panOnDrag` includes 2
(`@xyflow/react/dist/esm/index.mjs:1434`). Any movement of a two-finger click turns it into a pan. The probes pass
because Playwright's right click does not move. The pane menu «New instance of ▸» (R-OI-10) is the first pane menu, so
the trunk never showed the problem.

## Decision (taken by the chat on Alfonso's «decidi tu»)

The right button opens menus and does not pan: `panOnDrag={[0, 1]}`. Pan stays on the left and middle buttons and on
trackpad gestures (`panOnScroll` is false; check that two-finger scroll and pinch still behave as before and say so).
Rejected: a movement threshold around xyflow's handler (more code, fragile against xyflow updates).

## COSA

1. `EditorV2.tsx:5110`: `panOnDrag={[0, 1]}`. Nothing else. Gates: typecheck 0, `npm run build` 0. Commit
   `fix(editor-v2): the right button opens the pane menu, no pan`.
2. Probe: in `onto-s2-instantiate.ts` add one check S2-1m: a right click with movement (mouse down with the right
   button, move 3 px, up) on the empty pane opens the «New instance of ▸» cascade. Run it once on this branch (all
   checks pass) and once with `panOnDrag` reverted to `[0, 1, 2]` in the working tree (S2-1m red), then restore.
   `chore(probe)` commit.
3. Regression, one run each: `onto-s3a-slot-problems.ts` (default export, 8/8); `undo-inline-edit.ts` (33/33). Also,
   with a short throwaway Playwright step (not committed), measure that a left drag on the empty pane still pans
   (viewport x changes) and that a right drag on the empty pane no longer pans.
4. `docs/decisions.md`: a new row R-OI-17 (2026-11-07, decided by the chat on Alfonso's delegation, reversible:
   branch) with the decision and the rejected option; check `parseRows` reads it. An entry in
   `docs/log-inbox/instance-of.md` for this lane. One `docs:` commit.

## DOVE

`frontend/src/components/editor-v2/EditorV2.tsx` (the one line), `frontend/scripts/probe/onto-s2-instantiate.ts`,
`docs/decisions.md` (new row only), `docs/log-inbox/instance-of.md`.

## HARD STOP

After the docs commit with `Outcome: done` and a clean tree. Earlier with `Outcome: question` if a trunk probe or test
relies on right-drag panning, with its name.

## RIFERIMENTI

`EditorV2.tsx:3210` (`onPaneContextMenu`), `:5110`; R-OI-10; `~/.jjodel-lanes/P-2026-11-07-0155/closing.md`.
