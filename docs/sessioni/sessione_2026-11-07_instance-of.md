# Session 2026-11-06/07: front instance-of, undo groups reconciled, S2u..S3b rebuilt on the trunk

Chat C-2026-10-25-2159, resumed 2026-11-06 20:48, `/lane auto` from 20:56 to 02:50 (Rome). Supersedes
`docs/sessioni/sessione_2026-10-25_instance-of.md` for this front.

## State at the end

- Three stacked branches rebuilt on the trunk of 2026-11-06 (merged at `0fa6e4414`), all trees clean, nothing pushed:
  - `oi-s2u` (`~/jjodel-w-oi-s2u`), tip `84350015a`: merge `197ae1fd1` (option (c)), `809d85ce1` and `9baae8d88`
    (one deadline per instantiation, `INSTANTIATE_DEADLINE_MS = 8000`; one queue), `19abb1356` (3.1.1 welcome key in
    `scripts/smoke/states.ts`, also on the trunk as `54f38d163`), closing entry `84350015a`.
  - `oi-s3a` (`~/jjodel-w-oi-s3a`), tip `f7d46e0c9`: merge `6b52b905d` («Sync slots» on the id-less groups, in the
    queue), probe setup `ccb3abd2b`, overlay fix `72ad1753d` (a click inside `NodeProblemOverlay` no longer reaches
    the node and writes no selection), report `docs/discovery/discovery_2026-11-07_onto_s3_4_extra_undo_entry.md`.
  - `oi-s3b` (`~/jjodel-w-oi-s3b`), tip `5101a9ecb`: merge `f04faba02` (ghost-row materialization on the id-less groups,
    in the queue), probe setup `23e741a97` (bring dune into view: the trunk renders only visible nodes,
    `onlyRenderVisible.ts`), docs `5101a9ecb` (R-OI-14 and R-OI-15 reworded, wording only; chain closing entry).
- Discovery `oi-undo-discovery` (`~/jjodel-w-oi-undo`), report `5b1e2fe41`
  (`docs/discovery/discovery_2026-11-06_onto_undo_groups_reconcile.md`).
- Gates on `oi-s3b`: typecheck 0, 79/79 on the five gate test files, build 0. Probes: onto-s2 21/21, onto-s3a 8/8
  (default and uml-s3b), onto-s3b 6/6 (uml-s3b); trunk-client probes on `oi-s2u`: undo-inline-edit 33/33,
  jjodie-s4c-apply-undo 11/11, jjodie-rf2-run-from-tab 15/15, jjodie-udo-after-apply clean; new-model-instantiate fails
  identically on the trunk (probe predates the «New model» dialog). Benches: T2, T3, Q1, D1, overlay stops, queue
  bypasses all red; T1 survived as an equivalent mutant, accepted.
- Dev server for Alfonso on http://localhost:3005 from `~/jjodel-w-oi-s3b` (vite, started 2026-10-25).
- Tag 3.2.0 absent. Merge order after the tag: `oi-s2u`, `oi-s3a`, `oi-s3b`. Visual GO on S3b still owed.

## Decisions

- 2026-11-06 21:45 Alfonso «ok»: option (c), the trunk's nested undo groups plus the exact merge of late writes after
  the outermost end; no cap in the reducer; the instantiation client owns one deadline; instantiations serialized
  (done as a queue in `instantiate.ts`, not a disabled menu item: same guarantee, the second click is kept); core
  go-ahead for `reducer.ts` for this front. Undo while a group is open keeps the trunk's behaviour.
- R-OI-14, R-OI-15: wording amended 2026-11-07, decisions unchanged.
- Recommended answers adopted unattended (RC-21): T1 as equivalent mutant; S3-4 diagnosis lane; overlay click fix.

## Tickets (proposed, low)

1. Enter or Space on an overlay button still reaches the node wrapper (`handleNodeClick`); not measured.
2. The trunk's overlay has the same click-selects-node write (one empty undo step there).
3. `new-model-instantiate.ts` never presses «Create model» (dialog since `6d70d38c1`): the «New model from text» path
   that relies on nesting is covered only by unit tests.
4. `templates-mode-restore.ts` lacks `jjodel_welcome_3_1_1_seen`.

## Next

1. Visual GO on S3b at :3005 (hard-refresh, import `~/jjodel-demo-exports/uml-s3b/uml-class-object.jjodel`).
2. Merges after 3.2.0; push with Alfonso.
3. Notation slice (IR: composed header label, second compartment, end multiplicity template, list join; reference:
   a UML class diagram in Enterprise Architect style, made sober), proposed 2026-11-06, before S4.
4. S4 links (R-OI-8), S5 conformance (R-OI-11), editable real slot rows.
5. R-LAY-19 (several canvases of one model, each with its own viewpoint): Alfonso said yes on 2026-11-06 22:15 to a
   discovery from this chat; another chat opened the `multi-tab` front the same night
   (`discovery_2026-11-06_multi_tab_viewpoints.md`, R-MT-5..17, lane L1 merged as `04b782a5b`). Not duplicated here.

## Lessons

- Prompt-IDs collide across chats within minutes (2300 taken by the DCN front): the check must run in the same shell
  call as the commit and abort it.
- `lane-run` gives docs-only discoveries the light tier by default; pass `--tier heavy --effort xhigh` when the
  discovery reads core code.
- Probes that look up a node before bringing it into view break once the canvas virtualizes rendering.
