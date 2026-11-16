# Ontological instantiation, multilevel L4 continuation: probe fix, crops, mutants, docs

Prompt-ID: P-2026-11-16-0500
Chat: C-2026-10-25-2159
Front: instance-of
Lane: full (continuation of P-2026-11-16-0430 after its context ceiling; probe, bench and docs only)
Status: da eseguire
Request: https://claude.ai/code/session_01Qd8VK8yfvc2VwsVGG8qQ1S (Alfonso, 2026-11-16 02:00: «vai adesso in /lane auto ma non ti fermare e prosegui dritto dritto fino all'implementazione»)
Depends: P-2026-11-16-0430
Corregge: —
Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-oi-ml`, branch `oi-multilevel`, its tip this prompt's `docs:` commit, whose parent is `4c44bdb15`
(L4's fixture). **Expected state**: one untracked file, `frontend/scripts/probe/onto-mlm.ts`; anything else
uncommitted means stop with `Outcome: blocked`. Model and tier: heavy, effort `xhigh`. Probe ports outside 3000, 3001,
3005, 3015.

## Lane discipline

Every reply opens with `[P-2026-11-16-0500 · session <id>]`; final line `Outcome: done | hard-stop | question |
blocked`. Every question carries `Recommended: <one line>`. Time limit 60 minutes.

- Short tool output; windows of at most 60 lines; never a whole diff or a whole product file.
- One probe run per call; `uptime` in a separate call before each probe, start it only with the 1-minute load under 20;
  never a sleep over 60 s. Each project in its own fresh browser context. Probe assets under `/tmp`.
- Product code (`frontend/src`) is out of scope. A failing check that is a real product defect: record it with its
  measure and stop with `Outcome: question` and a `Recommended:` fix.
- No push, no merge.

## Source

Read first `~/.jjodel-lanes/P-2026-11-16-0430/handoff.md` (exact commands, state of M0..M9, the mutants) and the prompt
`docs/prompts/claude_2026-11-16_0430_prompt_onto_mlm_l4_fixture_probe.md`, COSA 2 to 4.

## COSA

1. Fix the probe, not the product: M1, M5, M6 fail because the right-click misses nodes outside the viewport or under
   the tips card or the conformance bar. Bring the node into view before clicking (scroll it into view through the
   canvas, enlarge the window, dismiss the tips card; read a node's screen box from the DOM, not a fixed point). The
   level-0 expectation follows the product (R-OI-29, L3): the rail at level 0 shows the linguistic Elements (Clabject,
   Field); the check is that no clabject of the model (ProductType, Book, DVD, mobyDick) is offered as a type there,
   and `mobyDick` is offered nowhere. Rerun until M0..M9 are green or a real defect shows. Commit the probe
   (`chore(probe)`).
2. `onto-s2-instantiate.ts` on `UML_FILE=~/jjodel-demo-exports/uml-s3b/uml-class-object.jjodel`, one run, 57/57.
3. Crops (`sips -Z 1200`) to `~/.jjodel-lanes/P-2026-11-16-0430/crops/`: the three level viewpoints on the canvas,
   `Book` with its slot, the instance of `Book` with its two slots.
4. The three mutants of COSA 3 of P-2026-11-16-0430, each red and reverted (`git checkout -- <file>`, `git status` clean
   after), to `~/.jjodel-lanes/P-2026-11-16-0430/bench.txt`.
5. Docs commit: R-OI-31 as COSA 4 of P-2026-11-16-0430; one entry in `docs/log-inbox/instance-of.md` covering both lanes
   (fixture counts, M0..M9, the export path); flip `Status:` of both prompts. `check:docs` green.

## HARD STOP

After the docs commit with `Outcome: done` and a clean tree. Earlier as stated.

## RIFERIMENTI

`~/.jjodel-lanes/P-2026-11-16-0430/handoff.md`, `handoff.diff`; the discovery report
`docs/discovery/discovery_2026-11-16_onto_multilevel_level_potency.md` §3.4; `docs/decisions.md` R-OI-29.
