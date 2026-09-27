# Prompt: a boolean decision on a DecisionNode, and three panel readings

Prompt-ID: P-2026-09-27-2255
Chat: C-2026-09-27-1437
Lane: discovery (read-only on the code; the report is the only file written)
Status: eseguito 2026-09-27 · lane discovery sim-decision-probe · measured on a3eacdbdd; the report is in the commit that carries this line (a commit cannot name its own sha) · Outcome: hard-stop

Worktree: `~/jjodel-w-decision`, branch `sim-decision-probe` (cut by the chat from `alfonso-frontend-jjtl` at `ff4bc0988`, the halt-line merge; `frontend/node_modules` symlinked as P14 allows), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-decision`, branch `sim-decision-probe`, `git log -1` is the docs commit that added this prompt; if any of the three differs, stop with `Outcome: blocked` and say which.

## COSA

Alfonso built a Flowchart model on 3001 (screenshot described here, rebuild it in the probe): `StartNode_0 → Flow_0 → DecisionNode_0` (label «Yes or No»), then `Flow_1` (branch `YES`) to `ActionNode_0` and `Flow_2` (branch `NO`) to `ActionNode_1`, then `Flow_3` to `EndNode_0`. Flows are objects with `condition`, `branch`, `source`, `target`; `condition` is empty on all four. The run stops at DecisionNode_0 with «Choose a transition (ε)» listing «Flow_1 (DecisionNode_0 → ActionNode_0)» and «Flow_2 (DecisionNode_0 → ActionNode_1)». The panel reads «Marking: DecisionNode_0 · DecisionNode_0.deci...» (cut) and «Last step: ε: Flow_0 (StartNode_0 → DecisionNo...» (cut). On the canvas `Flow_1` and `Flow_2` show a header «Flow_1» with no «: Flow» and no underline, while `Flow_0` and `Flow_3` show «Flow_0 : Flow».

Alfonso asks whether he can give `DecisionNode` a boolean attribute `decision` and have the flows follow it. Answer with measurements, not by reading code:

1. **The guard that works today.** With `decision : boolean` declared on DecisionNode (Data section of the Simulation roles dialog, and/or on the metamodel class; say which the engine needs), find the exact `condition` text on `Flow_1` that reads `decision` of the flow's source node and makes the run take `Flow_1` with no ε choice when `decision = true`, and the text on `Flow_2` (negation, and separately `else`) that takes `Flow_2` when `decision = false`. Run both values end to end to `Terminated`. Say where the value is set (model attribute, Data initial value, or both), and what happens if it is unset. Quote the exact strings; if several forms work, list them and say which the demo script style should use. If none works, say which R- row or engine limit stops it.
2. **The cut Marking line.** What is the full text after «DecisionNode_0.deci...»; where it comes from (a declared state attribute? a derived one?); whether it is expected on this model.
3. **The two header styles.** Why `Flow_1`/`Flow_2` render «Flow_1» with no type while `Flow_0`/`Flow_3` render «Flow_0 : Flow» (a different view, the IR object-as-edge path, a `branch` value, something else); whether it shows on the MODELS demo presets.
4. **Branch label in the choice list (cost only).** Where the choice list builds «Flow_1 (DecisionNode_0 → ActionNode_0)», and what it would take to prefix a branch label when the flow has one (which role or attribute supplies it: today `branch` is bound to no role, confirm), files and lines touched, and whether the no-layout-shift rule holds. Do not implement.

Out of scope: runtime input variables (a prompt asking for `decision` during the run): mention only if the probe shows something that already does it.

## DOVE

- Read anything. Write only `docs/discovery/discovery_2026-09-27_sim_decision_boolean.md` and probe files (`frontend/scripts/smoke/_tmp_decision_*`, gitignored, and a scratch vitest outside `src` if an engine-level check is faster). Crops in `~/.jjodel-lanes/shots_decision/`: the ε list, the Marking line full text (hover title or widened), the two header styles, and each end-to-end run end state, 1600x1000 light.
- Port 3027 only.

## COME

1. Read `CLAUDE.md`, the demo script's Flowchart scene (the syntax it uses for `count` guards is the reference style), R-SIM-31, R-SIM-52, R-SIM-53, and the files that build the choice list and the marking line.
2. Rebuild the model in the probe on the Flowchart preset; reproduce Alfonso's screen first (ε list, cut lines, headers), then answer 1 to 4.
3. The report: objective, files read with paths, findings 1-4 each with measured evidence and crops, the recommended guard strings for Alfonso, risks, open questions for Alfonso.
4. One commit: `docs: decision boolean discovery (P-2026-09-27-2255)`, the report and this prompt's Status flip.
5. `Outcome: hard-stop` with the sha and, first in the message, the guard strings for Flow_1 and Flow_2 that work.

Never: a change to any tracked file other than the report and the Status line, `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes in any other tree, ports other than 3027.

## RIFERIMENTI

- `docs/demo/models_2026_simulator_demo.md` (Flowchart scene); `docs/decisions.md` R-SIM-31, R-SIM-52, R-SIM-53, R-SIM-63, R-SIM-85; `docs/discovery/discovery_2026-09-27_sim_modal.md`.
- `docs/PROTOCOL.md` P13, P14, P16; RC-17, RC-25; the discovery report rule of CLAUDE.md.
