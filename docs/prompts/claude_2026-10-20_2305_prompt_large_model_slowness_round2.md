# Large model: why every interaction stays slow after the References fix (discovery, round 2)

Prompt-ID: P-2026-10-20-2305
Chat: C-2026-10-20-0839
Front: maintenance
Lane: full (root cause in the core is likely: LModel `fullname`; Phase 1 read-only)
Status: da eseguire
Request: https://claude.ai/code/session_01EMpM7yBvFWpBXh3o1TJSRA
Depends: P-2026-10-20-1955
Corregge: —

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-perfslow`, branch `perf-slow-round2`, cut from `alfonso-frontend-jjtl` at the commit that adds
this prompt. Model and tier: heavy, as pinned (RC-16), effort `xhigh`.

## Lane discipline

Every reply opens with `[P-2026-10-20-2305 · session <id>]`; every final message ends with one line
`Outcome: done | hard-stop | question | blocked`. Time limit 90 minutes. A question carries one `Recommended:` line.
Every gate runs in the foreground (P16). No push, no merge. Phase 1 only: it ends with a hard stop on the discovery
report; no product code is edited. Watch the AM-8 ceiling (RC-51): write the report before the soft ceiling, not after.

## COSA

After the merge `bfab138ba` (lazy References, P-2026-10-20-1955) a selection click on an Activity of «Jjodel harness»
fell from 6.8 s to about 1.2 s of long tasks in the probe and 2.2 to 3.0 s in the built-in browser. Alfonso reports on
2026-10-20 23:01 that the slowness is felt «always», on every interaction, not only on selection. The report of
P-2026-10-20-1830 (`docs/discovery/discovery_2026-10-20_large_model_click_profile.md`) left two causes open: about
1,100 components re-render per selection (tree and side panel, not the 48 canvas nodes), and `fullname`, which costs
14.4 ms a read and performs 409 `LObject.name` reads, one per object, for a 4-part name (a walk up the containers that
scans the whole model).

Answer with numbers, from CPU profiles:
1. The production build (`npm run build` and a preview server on a free port): the same selection click, Activity and
   gateway, three runs each. How much of the dev cost is dev-only.
2. The interactions Alfonso uses besides selection, in dev and in production, three runs each: dragging a node (one
   drag of 100 px), typing one character in the name field of the Properties panel, opening the model from the project
   page, switching viewpoint. Long tasks and top-10 self time for each.
3. `fullname`: the exact lines and why it is O(n) per read (which lookup scans all objects), how many `fullname` reads
   one selection and one keystroke perform and from which callers, and the minimal fix (for example a direct parent
   pointer instead of a scan) with its risk for the LModel proxy, DObject temporary ids and the JjOM.
4. The re-render: which components re-render per selection and per keystroke, grouped by component, and which store
   subscription or prop identity triggers each group (unmemoized selector, new object per render, context value).
5. A ranked list of fixes, each with the expected saving measured by an ablation in the probe (not estimated), its
   layers, and whether it touches the core (`src/model/`, `LModelElement.tsx`, `proxy.ts`) or the critical zone.

## DOVE

Read anything. Write only: the probe `frontend/scripts/probe/large-model-click-profile.ts` (new opt-in steps for the
interactions of item 2 and a production-preview mode), and the report
`docs/discovery/discovery_2026-10-20_large_model_slowness_round2.md` (mandatory, CLAUDE.md: objective, files read with
full paths, findings with numbers, dependencies and risks, open questions for Alfonso, the ranked fixes). Ablations
are temporary local edits measured and reverted, never committed. Raw profiles under `frontend/.vite-cache/`.

Fixture: `~/jjodel-papers/2026-sosym-harness-models/jjodel/jjodel.harness.project.jjodel`; do not copy it into the
repository.

## COME

1. Baseline `npm run typecheck` through `node scripts/run-quiet.mjs` from `frontend/` (zero errors, RC-48).
2. Production numbers first (item 1): they decide how much the rest matters.
3. Items 2 to 5 in order. Keep each probe run short; record every run in the report.
4. Commit the probe in a `chore(probe):` commit and the report in a `docs:` commit (the P13 hook refuses them
   together), `git add` by path, `Model:` trailer. Hard stop.

## RIFERIMENTI

`docs/discovery/discovery_2026-10-20_large_model_click_profile.md`; `~/.jjodel-lanes/P-2026-10-20-1830/handoff.md`;
the memory invariants on the LModel proxy (finds by name, writes with `$attr.value`) and DObject temporary ids;
CLAUDE.md §3.1 (critical zone).
