# graphVertex: right margin inside a framing container

Prompt-ID: P-2026-10-11-0040
Chat: C-2026-10-10-1756
Request: Alfonso in chat, 2026-10-11 00:38, «lascia un po' di padding a destra di Processing prima del bordo», unattended (lane auto)
Front: graphvertex
Lane: fast (one visual defect, at most three files under `viewpoint/ir/` plus a test, no §3.2 file)
Depends: P-2026-10-11-0011 (ir-graphvertex took the trunk)
Status: eseguito 2026-10-11 · lane gv-right-margin · aea222c46, dfa6f07ce, 1ceda9802 · verifica visiva passata 2026-10-11 (Alfonso) · flip 2026-10-11 dalla chat

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt says otherwise).

Worktree: `~/jjodel-w-gvmargin`, branch `gv-right-margin`, cut from `ir-graphvertex` (`7523373cb`) plus the docs commit
adding this prompt, `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch, `git log -1` and a
clean `git status`. Otherwise stop with `Outcome: blocked`.

## Lane discipline
Every reply of this session opens with `[P-2026-10-11-0040 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
The lane does not touch the `Status` line of this prompt; the chat flips it.
Unattended: a question with one recommendation inside this lane's perimeter is answered as recommended (RC-21).

## What is seen now
The S2b statechart fixture (`docs/discovery/assets/graphvertex-s2b/`, oracle of P-2026-10-10-0105), after auto layout
(S6, R-GV-16): composite state `Active` with two orthogonal regions. In the first region (initial pseudostate, then
`Waiting`, then `Processing` on `job`) the right edge of `Processing` sits about 4 px from the right border of
`Active`, while the initial pseudostate sits about 27 px from the left border. Both numbers are estimates from
Alfonso's screenshot (8 and 54 device px at DPR 2): measure the real ones from the DOM (`getBoundingClientRect` of each
child and of the container) before changing anything, never from a screenshot.

## What it must become
A container that frames its children (a partition of a `partitions` container, a `frame: 'self'` container) keeps at
least `PARTITION_CONTENT_MARGIN` (16 px, `irContainment.ts:578`) between its children's boxes and its right border,
as on the left. The children do not move: the frame grows. A size set by hand (`isResized`) is not touched.

## Acceptance (mechanical)
On the S2b statechart and on the BPMN fixture of this front, after auto layout and again after a reload, measured from
the DOM: for every partition and self-framing container with visible children, the right gap (container right edge
minus the largest child right edge, border excluded) is at least 16 px, and no left, top or bottom gap is smaller than
before the fix.

## COSA
1. Cause, in at most ten lines for the log entry, with `file:line` quotes: which function sizes the frame and why the
   right side loses the margin. Candidates, not conclusions: partition sizing by span in `irContainment.ts` (`needOf`)
   or `irPartitions.ts`, `irFrame.frameBox`, the S6 pass in `utils/elkLayout.ts`.
2. Fix it in the smallest place. A unit test first, red on the current code, on the pure function that sizes the frame.
3. Gates: typecheck at the 14-error baseline, vitest (only the 9 known import failures), build, `check:docs`.
4. Acceptance probe on a free port (never 3000, 3001, 3003). Save the numbers before and after, and two light-theme
   crops of `Active` (before, after), in `~/.jjodel-lanes/P-2026-10-11-0040/`.
5. Commits: code with its test, probe, docs (log entry in `docs/log-inbox/`, P9) in separate commits.

## HARD STOP
After the commits, with green gates and the crops saved: `Outcome: hard-stop` for the chat's visual check (RC-23).
If the cause sits in a §3.2 file, the fix needs more than three source files, or it changes an exported interface:
stop before editing, `Outcome: question` with the recommendation.

## NON FARE
No §3.2 file, no migration, no VersionFixer. If the cause is in the ELK pass, change only the margin it leaves, not the
S6 options ratified in R-GV-16. No `git stash`, no `git add .`, no push, no edit to the `Status` line.
