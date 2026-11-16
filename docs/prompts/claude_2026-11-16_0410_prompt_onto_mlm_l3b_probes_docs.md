# Ontological instantiation, multilevel L3 continuation: probes, crops, mutants, docs

Prompt-ID: P-2026-11-16-0410
Chat: C-2026-10-25-2159
Front: instance-of
Lane: full (continuation of P-2026-11-16-0340 after its context ceiling; probe, bench and docs only)
Status: da eseguire
Request: https://claude.ai/code/session_01Qd8VK8yfvc2VwsVGG8qQ1S (Alfonso, 2026-11-16 02:00: «vai adesso in /lane auto ma non ti fermare e prosegui dritto dritto fino all'implementazione»)
Depends: P-2026-11-16-0340
Corregge: —
Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-oi-ml`, branch `oi-multilevel`, its tip this prompt's `docs:` commit, whose parent is `fa2909f19`
(L3's code). Check `pwd`, the branch, `git log -2` and a clean `git status`; otherwise stop with `Outcome: blocked`.
Model and tier: heavy, effort `xhigh`. Probe ports outside 3000, 3001, 3005, 3015.

## Lane discipline

Every reply opens with `[P-2026-11-16-0410 · session <id>]`; final line `Outcome: done | hard-stop | question |
blocked`. Every question carries `Recommended: <one line>`. Time limit 60 minutes.

- Short tool output; windows of at most 60 lines; never a whole diff or a whole product file.
- One test or probe run per call; `uptime` in a separate call before each probe, start it only with the 1-minute load
  under 20; never a sleep over 60 s. Probe assets under `/tmp`.
- Product code (`frontend/src`) changes only to fix a real defect a probe finds. A fix under 15 lines in the five files
  of `fa2909f19` goes in its own `fix(onto):` commit with a vitest that was red before it; anything larger or elsewhere,
  stop with `Outcome: question`.
- No push, no merge. No edit to `reducer.ts`, a CLAUDE.md §3.1 or §3.2 file, `editor-v2/problems/`, or an exported
  interface.

## Source

Read first `~/.jjodel-lanes/P-2026-11-16-0340/handoff.md` (state, the empty-rail suspicion and its probe change, the
commands, the mutants) and the prompt `docs/prompts/claude_2026-11-16_0340_prompt_onto_mlm_l3_level_rails.md`, COSA 6
to 8. The chat accepts L3's three own decisions in the handoff (the Attributes group's wiring in `EditorV2.tsx` and
`PalettePanel.tsx`, required by the adopted answer and by COSA 4; the select reading every metamodel; the link section
filtered by the same rule): record them in R-OI-29.

## COSA

1. Rerun the MLM crop probe in a fresh browser context. If the rail at level 1 or 2 is still empty, find the cause
   (what `EditorV2.tsx` feeds the rail) and fix it under the rule above. Crops (`sips -Z 1200`) to
   `~/.jjodel-lanes/P-2026-11-16-0340/crops/`: the select with the extra levels, its absence on UML, the rail at levels
   0, 1 and 2. If the probe file lives in the repo, `chore(probe)` commit.
2. Any of the UML probes of COSA 6 not yet run in L3 (binding editor 10/10, split-pane 28/28, the UML level probe,
   S2 57/57): one run each, counts unchanged.
3. The three mutants of COSA 7 not yet in `bench.txt`, each red and reverted, appended to
   `~/.jjodel-lanes/P-2026-11-16-0340/bench.txt`.
4. Docs commit: R-OI-29 as COSA 8 of P-2026-11-16-0340, with L3's three decisions as clauses; one entry in
   `docs/log-inbox/instance-of.md` covering both lanes; flip `Status:` of both prompts. `check:docs` green.

## HARD STOP

After the docs commit with `Outcome: done` and a clean tree. Earlier as stated, or if a UML probe count changes.

## RIFERIMENTI

`~/.jjodel-lanes/P-2026-11-16-0340/handoff.md`, `handoff.diff`, `bench.txt`; the discovery report
`docs/discovery/discovery_2026-11-16_onto_multilevel_level_potency.md` §3.3.
