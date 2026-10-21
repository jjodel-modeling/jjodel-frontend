# Ontological instantiation, S2 ticket (b): size a new instance's node from its rows

Prompt-ID: P-2026-10-21-0655
Chat: C-2026-10-20-1835
Front: instance-of
Lane: full (node sizing, may reach viewpoint/ which is in the critical-zone table §3.1; visual check owed)
Status: da eseguire
Request: https://claude.ai/code/session_015eDtjagjBtuPHhhhfUTTo5
Depends: P-2026-10-21-0635
Corregge: —
Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-oi-s2`, branch `oi-s2` at `b65bb3e41` (the tree of S2, reused: its branch is not merged), clean.
Check `pwd`, the branch, a clean `git status`; otherwise stop with `Outcome: blocked`. Model and tier: heavy.

## Lane discipline

Every reply opens with `[P-2026-10-21-0655 · session <id>]`; every final message ends with one line
`Outcome: done | hard-stop | question | blocked`. Time limit 90 minutes. One `Recommended:` answer inside this perimeter
is adopted and recorded (RC-21). **No subagent and no background task.** Gates and probes in the foreground (P16).
**Context economy:** grep, never read `EditorV2.tsx` or large IR files whole; short tool output; never print a whole
diff; commit each step as soon as its gate is green. No push, no merge. Do not touch `Status`.

## COSA

The ticket of `docs/log-inbox/instance-of.md` (2026-10-21, «a new instance's node is clipped, name and type unreadable»):
a node created by the S2 creation menu (`frontend/src/components/editor-v2/hooks/instantiate.ts`) keeps the default
280x60, so the header `name : Class` is unreadable and only two of four slot rows show
(`docs/discovery/assets/onto-s2/onto-s2-new-instance-light.png`). It blocks the merge of `oi-s2`.

1. **Cause, measured first (short, no separate report file; findings go in the commit body).** Why does a new M1 node
   not take the size of its IR content? Note that the UML fixture sizes every drawn box explicitly from its labels and
   rows (§7 of `docs/archivio/claude_2026-10-14_uml_class_object_notation.md`, «explicit box sizes»), which suggests the
   app has no auto-size from IR rows today. Find where the default 280x60 is set (Step 2bis) and whether any existing
   path measures IR content (auto layout, R-GV-16 «hand size as a floor», graphVertex frames).
2. **Fix, the narrowest that works.** Recommended order, take the first that holds:
   (a) `instantiate.ts` writes the new vertex's size computed from the IR view of the instance (header plus one row per
   slot, the same rule the fixture uses), through an existing safe write path, as part of the same instantiation;
   (b) a general rule in the IR layer that a vertex with no hand size grows to its content.
   Option (b) touches `viewpoint/`: write the Layer Impact Report first (`docs/discovery/`, critical-zone table §3.1)
   and stop with `Outcome: question` if it also needs a §3.2 file (`useJjomSync.ts`, `canvasToJjom.ts`,
   `jjomTransformers.ts`, `portDistribution.ts`, `handlePosition.ts`, `DV.tsx`, `VersionFixer.tsx`).
3. **Undo must not get worse.** Ticket (a) of the same inbox shows that a vertex write after `createInstance` added no
   undo entry and made Cmd+Z revert unrelated edits. Measure the undo entries and Cmd+Z presses of one instantiation
   before and after the fix; the fix must not change them, or must stop with `Outcome: question` and the numbers.

## DOVE

`instantiate.ts` and its tests; for option (b) only, the IR or layout files the Layer Impact Report names; the probe
`frontend/scripts/probe/onto-s2-instantiate.ts` and `docs/discovery/assets/onto-s2/`; at closure after the GO, the log
entry in `docs/log-inbox/instance-of.md`.

## COME

1. Baseline typecheck through `node scripts/run-quiet.mjs` from `frontend/` (zero errors).
2. Cause, then fix, unit tests (one test that the computed size grows with the slot count), typecheck zero; commit
   `fix(onto): size a new instance's node from its rows (P-2026-10-21-0655)` with the cause and the undo numbers in the
   body.
3. Probe on port 3087: add checks that the header text of book1 is fully inside its node and that its four slot rows
   are visible (DOM boxes, not pixels); refresh the screenshots; page errors `[]`; commit
   `chore(probe): S2 node size checks (P-2026-10-21-0655)`.
4. `npm run build` exit 0. Report and stop for the GO.
