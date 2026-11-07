# Ontological instantiation, undo groups L5: probe setup for virtualized canvases, R-OI-14/15 wording, closing entry

Prompt-ID: P-2026-11-07-0155
Chat: C-2026-10-25-2159
Front: instance-of
Lane: fast (probe setup and docs only; no product code)
Status: eseguito 2026-11-07 · lane full · probe 23e741a97, docs 5101a9ecb · Alfonso visual GO 2026-11-07 15:10 on :3005 (binding declared from the console, pages added from the console)
Request: none (Alfonso: «ok», 2026-11-06 21:45, to option (c) and its lane plan; closing lane of the plan)
Depends: P-2026-11-07-0110
Corregge: —
Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-oi-s3b`, branch `oi-s3b`, its tip this prompt's `docs:` commit, whose parent is `f04faba02`.
Check `pwd`, the branch, `git log -2` and a clean `git status`; otherwise stop with `Outcome: blocked`. Model and tier:
heavy, effort `xhigh`. A dev server for Alfonso runs from this worktree on port 3005: do not stop or reuse it.

## Lane discipline

Every reply opens with `[P-2026-11-07-0155 · session <id>]`; final line `Outcome: done | hard-stop | question |
blocked`. Every question carries `Recommended: <one line>`. Time limit 60 minutes.

- **No product code.** Probe setup edits and docs only. One probe run per call, `uptime` beside it; before a probe wait
  for the 1-minute load under 20 (one `uptime` per call, never a sleep over 60 s). Assets under `/tmp`.
- Probe code and docs in separate commits (RC-13). Subjects at most 72 characters, `Model:` trailer.
- No push, no merge.

## Background

L4 (`f04faba02`, `~/.jjodel-lanes/P-2026-11-07-0110/closing.md`): the committed `onto-s3b-ghost-rows.ts` aborts in setup
on the `uml-s3b` export (`fixture ids missing … "vid":null`) because the trunk now renders only the nodes in view
(`EditorV2.tsx:1722-1732`, `onlyRenderVisible.ts:44-48`) and dune sits at x = 1460, off-screen; the probe looks the node
up (`:183`) before bringing it into view. A variant with a step that centres dune first passed 6/6:
`/tmp/P-2026-11-07-0110/onto-s3b-setup-variant.ts`. The S3a probe on `uml-s3b` aborts the same way
(P-2026-11-07-0005).

## COSA

1. Probe setup: port the centring step of the variant into `onto-s3b-ghost-rows.ts`, and the same step into
   `onto-s3a-slot-problems.ts` (and `onto-s2-instantiate.ts` only if it looks a node up before it is in view). Bring the
   node into view through the app (fit or set the viewport on the node), never by changing what the app renders. No
   other probe change. Run `onto-s3b-ghost-rows.ts` and `onto-s3a-slot-problems.ts` on
   `UML_FILE=~/jjodel-demo-exports/uml-s3b/uml-class-object.jjodel` (6/6, 8/8) and `onto-s3a-slot-problems.ts` on the
   default export (8/8). One `chore(probe)` commit.
2. `docs/decisions.md`: reword R-OI-14 and R-OI-15 where they cite the S2u group mechanism («10 s», «S2u group»,
   group ids): the history groups are the trunk's nested `beginUndoGroup()` / `endUndoGroup()` (R-PLG-5, R-JTG-14),
   with the exact merge of late writes after the outermost end (option (c),
   `docs/discovery/discovery_2026-11-06_onto_undo_groups_reconcile.md` on `oi-undo-discovery`), one deadline per
   instantiation and one queue for instantiation, «Sync slots» and ghost-row materialization in `instantiate.ts`. Keep
   each row's id, date, ratification state and every other clause; add the amendment date 2026-11-07. Check that
   `scripts/gates/docs-digest.ts` `parseRows` still reads both rows (run its test or a one-line check).
3. One closing entry in `docs/log-inbox/instance-of.md` (skill `log-entry`, P9) for P-2026-11-06-2340 (L3),
   P-2026-11-07-0005, P-2026-11-07-0040, P-2026-11-07-0110 (L4) and this lane: shas (`6b52b905d`, `ccb3abd2b`,
   `72ad1753d`, `f7d46e0c9`, `f04faba02` and this lane's), gates, benches (`~/.jjodel-lanes/<id>/bench.txt` of 0040 and
   0110), the probe table with loads, the overlay click fix and its effect on S3-4, and proposed tickets: Enter or Space
   on an overlay button still reaches the node wrapper (`handleNodeClick`), not measured; the trunk overlay has the same
   click-selects-node write (no «Sync slots» there, so one empty undo step); `new-model-instantiate.ts` predates the «New
   model» dialog; `templates-mode-restore.ts` lacks `jjodel_welcome_3_1_1_seen`. Notes within 500 characters, detail in
   `~/.jjodel-lanes/P-2026-11-07-0155/closing.md`.
4. In the same docs commit flip `Status:` to `eseguito` in the prompts of P-2026-11-06-2340, P-2026-11-07-0005,
   P-2026-11-07-0040, P-2026-11-07-0110 (all present in `docs/prompts/` on this branch; if one is missing, say which).
   `npm run check:docs` green. One `docs:` commit.

## DOVE

`frontend/scripts/probe/onto-s3b-ghost-rows.ts`, `frontend/scripts/probe/onto-s3a-slot-problems.ts`
(`onto-s2-instantiate.ts` only as stated), `docs/decisions.md` (R-OI-14, R-OI-15 only), `docs/log-inbox/instance-of.md`,
the four `Status:` lines. Nothing else.

## HARD STOP

After the docs commit with `Outcome: done` and a clean tree. Earlier with `Outcome: question` if a probe check fails that
is not a measure, or if the rewording would change what R-OI-14 or R-OI-15 decide rather than how they are implemented.

## RIFERIMENTI

`~/.jjodel-lanes/P-2026-11-07-0110/closing.md`; `/tmp/P-2026-11-07-0110/onto-s3b-setup-variant.ts`;
`~/.jjodel-lanes/P-2026-11-07-0040/bench.txt`; `docs/discovery/discovery_2026-11-07_onto_s3_4_extra_undo_entry.md`;
CLAUDE.md §21.2, §21.3; PROTOCOL.md P9, P13.
