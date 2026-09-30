# Prompt: Phase 1 and 2 in cascade, Activity (UML) notation with explicit decision/merge, bracketed guards, token inside the node

Prompt-ID: P-2026-09-30-1935
Chat: C-2026-09-30-1932
Lane: Phase 1 then Phase 2 in cascade (critical zone possible; Layer Impact Report before any edit there; go-ahead RC-30 given at launch). Tier: heavy.
Status: da eseguire

Worktree: `~/jjodel-w-actdec`, branch `activity-decision-merge`, created from `viewpoint-notations` at `30f3d8a81` (the Activity sizes lane, P-2026-09-30-1720), a fresh session started by `lane-run`. `viewpoint-notations` itself is not touched: it waits for Alfonso's GO and merges on its own; this branch merges after it. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-actdec`, branch `activity-decision-merge`, `git log -1` is the docs commit that added this prompt; if any differs, stop with `Outcome: blocked`.

## COSA

Alfonso reviewed the Activity (UML) derived viewpoint on DemoFlowB (2026-09-30, 19:30) and approved a target notation («va benissimo ... questa è la notazione giusta», then «ok su tutto, procedi»). It is the reference notation for every derived viewpoint that produces an activity diagram. Target drawing: `docs/design/activity_uml_target_2026-09-30.svg` (added by the same docs commit as this prompt). What he saw on DemoFlowB and what changes:

1. **Explicit decision and merge.** Today an action with two guarded outgoing edges (`[count < 2]` back to `work`, `[count >= 2]` to the fork) draws them straight from the action, and `work` receives two incoming edges. Read with UML 2 semantics, several outgoing edges from an action are an implicit fork and several incoming edges an implicit join, so the drawing says "deadlock" while the engine runs a choice. Jjodel's engine fires one enabled transition per step with a selector (R-SIM-7, interleaving), so for plain action nodes several outgoing edges are a choice and several incoming edges a merge. The notation must say so: a **view-only decision diamond** where an action node has two or more outgoing control-flow edges, a **view-only merge diamond** where it has two or more incoming ones. View-only means: nothing is added to M1 or M2, nothing is persisted in the model, undo/redo and save/load unchanged. Nodes bound to fork/join (bars), initial, final, or to an explicit decision/merge role are never given a synthetic diamond. Diamond: 28 px square rotated 45°, white fill, slate `#334155` stroke equal to the edge stroke.
   Preferred mechanism (the report confirms or refutes it): a pure rendering solution, the outgoing (incoming) edges of that node share one trunk segment from (to) the node, and the diamond glyph is drawn at the split (join) point, so no React Flow node is created. A synthetic canvas node is the fallback and needs the Layer Impact Report.
   Precondition to verify first in Phase 1: that the engine really treats several outgoing edges of a plain node as a choice (one firing) and several incoming edges as a merge (no synchronisation). If it synchronises or fires all of them anywhere, stop with `Outcome: question`: the diamond would then misstate the behaviour.
2. **Guards in UML brackets.** The label wraps the whole expression: `[model.[count] < 2]`. The expression text is unchanged: `model.[count]` is the JjEL state-read operator (R-SIM-16..19), not a UML bracket. Monospace, 11.5 px, slate, on a white background patch so the edge does not cross the text. On a synthetic decision, the guards sit on the diamond's outgoing edges; `else` renders `[else]`.
3. **Token inside the node.** The marking token (orange dot) today sits on the top-right corner of the node, ambiguous between node and outgoing edge. It moves inside the node box: 12 px dot, left-inside at 12 px from the left edge, vertically centred, white 1.5 px ring, no halo. The node holding a token gets a 2 px cyan `#0ea5e9` border. Both are driven by the simulator's marking, never by editor selection (selection keeps its own style, see the `selection-outline` lane of C-2026-09-30-1806: do not touch selection styling). If the overlay is shared by all derived notations, the change applies to all of them; report which scenes move.
4. **Action border and bars.** Action boxes draw their border in slate `#334155` at the edge stroke width (today a light grey that makes actions lighter than bars and arrows). Fork and join bars draw identically (today the join shows a light border the fork does not have).
5. **The label «2».** On DemoFlowB one action shows «2», next to a guard on `count` reaching 2. Phase 1 establishes what the label binds to. If it is the element's name, nothing changes; if it is a value (an id, the count, a feature other than the name), fix the binding in the derivation.
6. **Axis alignment.** On DemoFlowB the initial node, the fork and the join sit a few px off the actions' axis, producing a jog in the first edge. If positions come from the derivation's layout, centre them on the axis; if they come from DemoFlowB's stored positions, change nothing and report (layout ticket already open).

Out of scope, report only: action widths (390 px for one-word labels), the guard label overlap ticket, any notation other than Activity (UML) except the shared token overlay of point 3.

## DOVE

Phase 1 (read-only): report `docs/discovery/discovery_2026-09-30_activity_decision_merge.md`: Layer Impact Report first; the engine precondition of point 1 with the code that proves it; where edges of the derived Activity view are routed and labelled; where the token overlay is drawn; what the «2» binds to; which files Phase 2 touches; questions with `Recommended:`. Commit it (`docs:`) and go on to Phase 2 in cascade unless the precondition fails, a question has no single recommendation, or the default viewpoint would change.

Phase 2: the files the report names, within `frontend/src/components/editor-v2/viewpoint/derive/`, the edge and node renderers of the IR views, the simulator's token overlay, their tests; the decisions as R-VP rows in `docs/decisions.md` (`provisional, unattended`; numbering starts at R-VP-32, since R-VP-27..31 are reserved for `viewpoint-metaclass-colors`); a log entry in `docs/log-inbox/views.md`; this prompt's Status. Anything else: stop and ask.

## COME

1. Read `CLAUDE.md` (§3.1, §3.2, §5, §6), `frontend/src/components/editor-v2/CLAUDE.md`, `docs/PROTOCOL.md` P16, RC-20..RC-34, R-VP-15..26, R-SIM-7, R-SIM-16..19, the Activity (UML) report and the Activity sizes report.
2. Phase 1 report, committed.
3. Tests first: synthetic diamonds present on DemoFlowB where an action has 2+ outgoing or 2+ incoming edges, absent on bars, initial, final; model unchanged (M1 and M2 object counts and serialised JSON identical before and after rendering); guard labels bracketed with the expression verbatim; token inside the node box and cyan border driven by the marking only; action border slate; fork and join rendered identically. Mutation bench; report the score.
4. Implement. Gates: typecheck (the known 14), full vitest (the known 9 red at import), build exit 0, `check:docs`, `check:addonly`.
5. Visual: `lane-run probe` on a free port (not 3000, 3001, 3003), light theme: DemoFlowB as Activity (UML) at rest and with the token on the action before the decision; crops `sips -Z 600` under `frontend/scripts/smoke/_tmp_actdec_crops/`, one side by side with the target SVG; the four demo scenes in the default viewpoint 0 px from `30f3d8a81`; undo/redo and save/load round trip on DemoFlowB.
6. Commits: `feat:` code and tests, `docs:` report, R-VP rows, log entry, Status; stage by explicit path. Stop with `Outcome: hard-stop`, the shas, the measures, the mutation score, the decisions taken unattended, the questions for Alfonso.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree (no `/tmp` either), a call to an AI model, renaming or removing an existing IR property, changing the default viewpoint, adding objects to the user's model to draw a diamond.

## RIFERIMENTI

Target drawing `docs/design/activity_uml_target_2026-09-30.svg`; Activity (UML) lane P-2026-09-30-1552 (`21345bbba`), sizes lane P-2026-09-30-1720 (`30f3d8a81`); R-VP-26; R-SIM-7; R-SIM-16..19; design canvas row «DemoFlowB · UML activity».
