# oi-rail after taking the trunk: the rail in a split pane, and the full probe pass before the merge

Prompt-ID: P-2026-11-09-1115
Chat: C-2026-10-25-2159
Front: instance-of
Lane: full (outside the critical zone; two gaps found by P-2026-11-09-0943 in the merged tree)
Status: da eseguire
Request: https://claude.ai/code/session_01Qd8VK8yfvc2VwsVGG8qQ1S (Alfonso, 2026-11-09 09:42 «go» to merge oi-rail into the trunk; the chat fixes the two split-pane gaps the take-trunk merge exposed before merging)
Depends: P-2026-11-09-0943
Corregge: —
Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-oi-rail`, branch `oi-rail`, its tip this prompt's `docs:` commit (after the merge `a1cb914c0` and
0943's docs commit). Check `pwd`, the branch, `git log -3` and a clean `git status`; otherwise stop with `Outcome:
blocked`. Model and tier: heavy, effort `xhigh`. Alfonso's dev server runs from this worktree on port 3005: do not stop
it; probe ports outside 3000, 3001, 3005, 3015; probe assets never under `docs/`.

## Lane discipline

Every reply opens with `[P-2026-11-09-1115 · session <id>]`; final line `Outcome: done | hard-stop | question |
blocked`. Every question carries `Recommended: <one line>`. Time limit 80 minutes.

- Context economy: windows of at most 40 lines; never a whole file, diff or probe log. Commit the code as soon as its
  gates are green. At the ceiling, `handoff.md` and `Outcome: hard-stop`.
- `uptime` in a separate call before each probe; start only with the 1-minute load under 20; one probe run per call.
- No push, no merge. No edit to `reducer.ts`, a CLAUDE.md §3.1 or §3.2 file, or an exported interface; else
  `Outcome: question`.

## The two gaps (P-2026-11-09-0943, `~/.jjodel-lanes/P-2026-11-09-0943/log.jsonl`, last result)

1. **Click centre in a split pane.** `onOntoActivate` and `onClassActivate` (`EditorV2.tsx` about `:3439`, `:3446`) use
   `getCanvasRightInset()`; in a pane not under the rail a rail click lands off-centre by the rail's width. Use the
   centre of the pane that the palette serves (the trunk's split plumbing: find how the linguistic palette's click
   computes its centre in a split, and do the same).
2. **Drop on the inactive pane.** The rail's drop path (`EditorV2.tsx` about `:2838`) returns before the
   `paneAcceptsDropRef` guard, and the `onDragOver` guard (about `:2865`) matches only `application/reactflow`. A rail
   item dropped on the inactive pane of a split instantiates there. Apply the same guard to `ONTO_DRAG_MIME` and the
   class-rail drag key, so the rail behaves as the linguistic palette does.

## COSA

1. Fix both, with the smallest change; unit tests where the logic can be isolated, else probe checks. Gates:
   typecheck 0; `instantiate.test.ts`, `classElement.test.ts`, `undoGroup.test.ts`, `bindingDetect.test.ts` green;
   `npm run build` 0 (read the exit status). Code commit.
2. Probes on this merged tree, one run each: the S2 suite with the level block (57/57 before), `onto-s4-links.ts`
   (14/14), `onto-binding-editor.ts` (10/10), `onto-s3a-slot-problems.ts`, `onto-s3b-ghost-rows.ts` (`uml-s3b`); plus a
   new split-pane case: open the class diagram and the object diagram side by side (the trunk's split), click and drag
   from the rail into each pane, measure where the node lands and that a drop on the inactive pane writes nothing (or
   follows the trunk's rule for the linguistic palette, whichever it is: report it). Crops to the lane folder: the rail
   with the split, a rail click in each pane. `chore(probe)` commit.
3. Docs commit: one entry in `docs/log-inbox/instance-of.md`; flip `Status:`. `check:docs` green.

## HARD STOP

After the docs commit with `Outcome: done` and a clean tree. Earlier as stated, or on any red regression probe.

## RIFERIMENTI

`~/.jjodel-lanes/P-2026-11-09-0943/` (result); `docs/decisions.md` R-OI-18..24, R-MT-*; the multi-tab entries on split panes
in `docs/log-inbox/multi-tab.md`.
