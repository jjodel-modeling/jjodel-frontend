# Ontological instantiation, S2u with tickets (a) and (c): one transaction per instantiation (Phase 1, Layer Impact Report)

Prompt-ID: P-2026-10-21-0947
Chat: C-2026-10-20-1835
Front: instance-of
Lane: full (core: redux/reducer/reducer.ts and redux/action/action.ts; Phase 1 read-only, hard stop for Alfonso's ratification)
Status: eseguito 2026-10-21 · lane oi-s2u · report 9bfc0cc78 · six questions answered as recommended by the chat (Alfonso yes 09:46) · Phase 2 P-2026-10-21-1016
Request: https://claude.ai/code/session_015eDtjagjBtuPHhhhfUTTo5
Depends: P-2026-10-21-0725
Corregge: —
Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-oi-s2u`, branch `oi-s2u`, cut from `oi-s2` at `7999d5d5a`, `frontend/node_modules` symlinked
(P14). Check `pwd`, the branch, a clean `git status`; otherwise stop with `Outcome: blocked`. Model and tier: heavy,
effort `xhigh`.

## Lane discipline

Every reply opens with `[P-2026-10-21-0947 · session <id>]`; final line `Outcome: done | hard-stop | question |
blocked`. Time limit 90 minutes. **No subagent, no background task.** Foreground gates and probes (P16). **Context
economy:** grep, never read `reducer.ts`, `action.ts` or `EditorV2.tsx` whole; short tool output; never a whole diff.
No push, no merge. Do not touch `Status`. **Phase 1 only: no product code is edited.** It ends with a hard stop on the
report: Alfonso said yes to the core change on 2026-10-21 09:46; the chat reads the Layer Impact Report and gives the GO for Phase 2 (R-OI-12).

## COSA

R-OI-12: one undo step per instantiation is its own core lane. Two tickets of `docs/log-inbox/instance-of.md` share its
cause and are folded in:

- ticket (a): the new instance cannot be placed at the right click, because a vertex write after `createInstance`
  (`createVertexForObject`) added no undo entry and Cmd+Z then reverted unrelated edits;
- ticket (c): «New instance» on a class node in the class diagram leaves the node at 280x60 in the object diagram; the
  fix that sizes it in every viewpoint (`~/.jjodel-lanes/P-2026-10-21-0725/s2-5-wip.diff`) made one instantiation cost
  two Cmd+Z in one run, likely because the extra writes fall outside the 450 ms undo merge window.

Today (measured, P-2026-10-21-0725): one instantiation is 1 undo entry and 1 Cmd+Z only because every write lands inside
that window; it is a timing property, not a guarantee.

The goal: an instantiation (instance, slots, values, its vertex position at the click, its size in every viewpoint where
it is drawn) is one undoable transaction by construction.

Answer, with file and line evidence and a number where one exists:

1. How the undo stack groups actions today: the merge window (where, how long, what resets it), `TRANSACTION`, any
   existing begin/end grouping API, and which of them the L-API setters, `createInstance` (`createAdapter.ts:491`),
   `createVertexForObject` and the vertex size write go through.
2. The narrowest core change that makes a caller-defined group one undo entry regardless of timing: for example an
   explicit `beginUndoGroup`/`endUndoGroup` pair, or a `TRANSACTION` that accepts a callback. State its cost on every
   other caller (none must change behaviour), and whether it touches a §3.2 critical-zone file (`useJjomSync.ts`,
   `canvasToJjom.ts`, `jjomTransformers.ts`, `portDistribution.ts`, `handlePosition.ts`, `DV.tsx`, `VersionFixer.tsx`).
3. Whether the vertex writes for (a) and (c) can go inside that group, or are deferred by the canvas sync (Step 2bis)
   in a way the group cannot hold; if deferred, the alternative (write the vertex record directly with its position and
   per-viewpoint sizes at creation).
4. The regression risk: which existing probes and tests cover undo (`frontend/scripts/probe/undo-inline-edit.ts` and
   others), and the oracle the Phase 2 must pass.

## DOVE

Write only `docs/discovery/discovery_2026-10-21_onto_s2u_undo_group.md`: objective, files read with full paths,
findings per question, the Layer Impact Report for `reducer.ts` and `action.ts` (layers touched, callers, invariants,
risk), a Phase 2 plan with files, acceptance checks (one instantiation is 1 entry and 1 Cmd+Z from both the cascade and
the class-node entry, with the instance placed at the click and sized in the object diagram; the cases of
`undo-inline-edit.ts` unchanged; S2-3m unchanged), and «Decisions awaiting Alfonso». Throwaway probes allowed, not
committed. One `docs:` commit, then hard stop.
