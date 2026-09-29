# Prompt: the demo script declares data on the model tab (R-SIM-94), with the metamodel path as fallback

Prompt-ID: P-2026-09-29-0219
Chat: C-2026-09-28-1936
Lane: fast (docs only: one file). Tier: light.
Status: eseguito 2026-09-29 · lane demo-script-data-level · docs-only, the sha is that of this closure commit (the script, the inbox entry and this line ride in it) · non fuso: hard-stop

Worktree: `~/jjodel-w-demoscript`, branch `demo-script-data-level` (cut by the chat from `alfonso-frontend-jjtl` at `04c81327d`), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-demoscript`, branch `demo-script-data-level`, `git log -1` is the docs commit that added this prompt; if any differs, stop with `Outcome: blocked` and say which.

## COSA

R-SIM-94 is on the trunk: a model declares its globals in its own `Data…` dialog on the model tab of the simulation panel; a global declared in the metamodel stays the default. The Phase 2 lane measured the new route in §8 of `docs/discovery/discovery_2026-09-29_sim_data_level.md` (on the trunk): ESM through the `Data…` entry, 9 interactions and 34 keystrokes, 0 scrolls; Flow B from the Reset line, 5 interactions and 4 keystrokes; both runs read as the script. Update `docs/demo/models_2026_simulator_demo.md` so the declaration steps of §2.3 (ESM) and §2.4 (Flow B) use the model-tab route as the primary path, with the metamodel path kept verbatim as the fallback.

## DOVE

- `docs/demo/models_2026_simulator_demo.md` only: §1 (one line on the `Data…` entry of the model tab), §2.3 and §2.4 (the declaration steps, the counts, the «Say» lines), §4 (the fallback: «if the Data… route misbehaves, declare in the metamodel as before»).
- Closure: `docs/log-inbox/simulation.md` and this prompt's Status.

## COME

1. Read `CLAUDE.md` (writing rules, §21.2), `docs/PROTOCOL.md` P16, RC-20, RC-33, the demo script end to end, and §8 of the discovery.
2. Write the new steps with the exact texts and counts of §8, tagged [M, P-2026-09-29-0110] as the script tags its measures. Keep the existing metamodel steps under a «Fallback» subheading with their original tags. Do not change the Run tables, the other scenes, or any reading.
3. No em dashes, no filler; the script's own style. `check:docs` 4/4.
4. One docs commit with the script, the log entry and this prompt's Status. Do not merge. Stop with `Outcome: hard-stop`, the sha and the diff of the script.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, any file other than the three named.

## RIFERIMENTI

- `docs/decisions.md` R-SIM-94; the discovery §8; the demo script.
