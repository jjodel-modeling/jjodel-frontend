# Canvas: fix the empty viewport at model open (ticket #419), continuation of P-2026-11-02-0646

Prompt-ID: P-2026-11-02-1856
Chat: C-2026-11-01-1434
Front: maintenance
Lane: full (Phase 2 of P-2026-11-02-0646, design fixed; no critical zone file)
Status: da eseguire
Request: https://claude.ai/code/session_01DQt9R32KVprpjZZCfe6Sbp
Depends: P-2026-11-02-0646

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 non si applica (motivo: discovery done, `docs/discovery/discovery_2026-11-02_open_viewport_empty.md` at `f6c512960`).

Worktree: `~/jjodel-w-openvp`, branch `open-viewport-empty`, HEAD at the commit that adds this prompt. Clean tree.
Model and tier as pinned (RC-16), effort `xhigh`.

## Lane discipline

Every reply opens with `[P-2026-11-02-1856 · session <id>]`; final message ends with `Outcome: done | hard-stop |
question | blocked`; one `Recommended:` line per question. Time limit 75 minutes. Gates through
`node scripts/run-quiet.mjs`. Context is the binding constraint (the previous session hit AM-8 before writing code):
read ONLY `~/.jjodel-lanes/P-2026-11-02-0646/handoff.md` and the four `EditorV2.tsx` sites it names (read the lines
around them, not the file); do not read the discovery report unless a number is missing; never cat a probe log or a
whole test file; grep summary lines. Load gate before each probe run: `uptime`, 1-minute load ≤ 16 (wait up to 15
minutes, then run and record it). No push, no merge.

## COSA

Implement exactly the design in the handoff, section "Decisions taken", on Alfonso's answers of 2026-11-02 18:26
(Q1 both auto-layout fits through the check; Q2 a restored viewport that shows no node goes through the open fit and
fallback; Q3 anchor on the node nearest the bounding-box centre; Q5 commit the probe):

1. Tests first: `frontend/src/components/editor-v2/__tests__/openViewport.test.ts` for `resolvePadding` and
   `openViewportFallback`, with the mutation check the handoff lists (drop the inset, drop the tie-break, fit the padded
   area instead of the visible one: each must fail a test).
2. `frontend/src/components/editor-v2/openViewport.ts` (new, pure), and the four call sites in `EditorV2.tsx`.
3. `frontend/scripts/probe/open-viewport.ts` (from the gitignored draft) with the PASS/FAIL checks of the handoff,
   including the stored-empty scenario, the toolbar layout and the per-frame empty-paint count.
4. Gates: typecheck, vitest (baseline: the 9 known import failures), build, smoke, `check:scripts`, `bpmn-lanes` probe
   12/12, the new probe all PASS. The BPMN open transform must stay `(-1197.5, -1107, 0.5)`.
5. Code commit with explicit pathspec (module, test, `EditorV2.tsx`, probe). Log entry in
   `docs/log-inbox/maintenance.md` closing ticket #419 (cite #440 as the separate restore ticket), Status flips of
   P-2026-11-02-0646 and this prompt, uncommitted (RC-17). Stop every server you started. Exit
   `Outcome: hard-stop (visual check due)`.

## HARD STOP

A red gate, a failing probe check, a changed BPMN transform, or a fix that needs a file outside the scope: stop before
the code commit with the evidence and one `Recommended:` line. Near the ceiling: write the handoff and stop, commit
nothing half-done.

## NON FARE

No new fit site (R-LAY-18): the move is a `setViewport` after the existing fits. No `minZoom` change. Do not fix the
abstract-syntax restore (ticket #440). No new dependencies.
