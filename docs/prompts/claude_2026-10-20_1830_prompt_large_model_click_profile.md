# Large model: one selection click blocks the main thread for up to 58 s (discovery)

Prompt-ID: P-2026-10-20-1830
Chat: C-2026-10-20-0839
Front: performance
Lane: full (root cause unknown, the fix may land in the critical zone; Phase 1 read-only)
Status: da eseguire
Request: https://claude.ai/code/session_01EMpM7yBvFWpBXh3o1TJSRA
Depends: none
Corregge: —

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-perfclick`, branch `perf-click-profile`, cut from `alfonso-frontend-jjtl` at the commit that adds
this prompt. Model and tier: heavy, as pinned (RC-16), effort `xhigh`.

## Lane discipline

Every reply opens with `[P-2026-10-20-1830 · session <id>]`; every final message ends with one line
`Outcome: done | hard-stop | question | blocked`. Time limit 90 minutes. A question carries one `Recommended:` line.
Every gate runs in the foreground (P16). No push, no merge. This is Phase 1 only: it ends with a hard stop on the
discovery report; no product code is edited.

## COSA

Alfonso reports that Jjodel stays slow on the project «Jjodel harness» (1 metamodel, 1 model of 407 instances, 7
viewpoints of 19 to 24 views each). Measured by the chat on 2026-10-20 in the built-in browser, dev server on
localhost:3001, model open on the viewpoint «Harness / Lane process (BPMN)» (48 nodes and 42 edges on the canvas, about
14,800 DOM elements in the page): with the page idle there is no long task; one click that selects a node produces long
tasks of 1.6 s and 17.4 s, and on a second node 2.4 s, 0.4 s, 58.7 s and 3.3 s. The console fills with react-redux
`Selector unknown returned a different result when called with the same parameters` warnings (about 2,000 in a few
interactions), but patching `console.warn` during the 58 s click caught none, so those warnings are a symptom to
explain, not yet a cause.

Find the root cause with a CPU profile, not by reading code. Questions to answer, each with a number: which functions
take the self time of the long task; whether the cost scales with the instances of the model, with the views of the
active viewpoint, with the viewpoints of the project, or with something else (state the experiment); which store
dispatches the click triggers and how many components re-render per dispatch; whether the cost is present in a
production build (`npm run build` and preview) or only in dev (react-redux dev checks, StrictMode).

## DOVE

Read anything. Write only:
1. `frontend/scripts/probe/large-model-click-profile.ts`: a probe run with `lane-run probe` that imports the fixture,
   opens the model on the BPMN viewpoint, starts the CDP profiler (`Profiler.start` through a CDP session of
   Playwright), clicks one node, waits for the main thread to settle, stops the profiler and writes the profile and a
   top-30 self-time table.
2. `docs/discovery/discovery_2026-10-20_large_model_click_profile.md`: the discovery report (mandatory, CLAUDE.md:
   objective, files read with full paths, findings with numbers, dependencies and risks, open questions for Alfonso,
   and a recommended fix with its layers and whether it touches the critical zone).
3. The raw profile under `frontend/.vite-cache/` (gitignored), not committed.

The fixture is `~/jjodel-papers/2026-sosym-harness-models/jjodel/jjodel.harness.project.jjodel` (the project exported
from the built-in browser, 1.24 MB). Read it from there; do not copy it into the repository.

## COME

1. Baseline: `npm run typecheck` through `node scripts/run-quiet.mjs` from `frontend/` (zero errors expected, RC-48).
2. Write the probe, run it at least three times in dev and once on the production preview; state medians.
3. Vary one factor at a time to answer the scaling question (for example the same click on the viewpoint «Harness /
   Authority», on the default viewpoint, and on a project with only the metamodel), each run recorded in the report.
4. Commit the probe and the report in one `docs:` commit (`git add` by path, `Model:` trailer, P6), then hard stop.

## RIFERIMENTI

`frontend/scripts/probe/jjscript-run-slowdown.ts` and `frontend/scripts/benchmarks/bench_baseline.mjs` for existing
measurement patterns; `lane-run probe` for the probe runner; R-GV-18 (`docs/decisions.md`) for the BPMN viewpoint.
