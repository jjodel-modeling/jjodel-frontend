# Discovery 2026-10-24 — jjodie-panel integration check

- Prompt-ID: P-2026-10-24-0431 (`docs/prompts/` entry added in `909d54eb3`)
- Chat / session: C-2026-10-24-0020
- Front: jjodie-ui, lane full, verification only
- Tree: `~/jjodel-w-jjp-fin`, branch `jjp-fin`, HEAD `909d54eb3` (= `jjodie-panel` at `3e7dfcfa8` + the prompt commit)
- Executor model: claude-opus-5-5
- This report is a set of hypotheses with evidence, not a definitive reference. Every number below was measured in
  this session on the tree above, unless tagged *read*.

## Hypotheses under test

1. **H1 — the merged tip passes the repository gates** (typecheck, vitest, build, smoke, check:scripts, check:docs).
   *Partly.* All pass except the smoke, which is RED on a cold dev server and GREEN on a warm one (finding F1).
2. **H2 — every probe of the front passes on the merged tip as it passed on its own lane.** *Partly.* 9 of 10 pass in
   full; `jjodie-s2-script-card.ts` fails 1 of 26, an assertion that S5 made stale by design (finding F2).

## Method

- Gates through `node scripts/run-quiet.mjs` from `frontend/` (logs in `.agent-logs/`), check:scripts and check:docs
  directly.
- Smoke against a dev server started on 3010 with lane-run's scratch config
  (`frontend/scripts/smoke/_tmp_lane_vite_3010.config.ts`, gitignored, cacheDir `/tmp/lane-vite-cache-3010`),
  `SMOKE_URL=http://localhost:3010`, server stopped after each run.
- Every probe through `~/.local/bin/node frontend/scripts/lane-run.mjs probe ~/jjodel-w-jjp-fin <probe> --port 3010
  --id P-2026-10-24-0431`, one per tool call, in the prompt's order. lane-run starts its own vite on 3010, sets
  `PROBE_URL`/`PROBE_PORT`, runs `npx tsx <probe>` and stops vite. The four probes whose header documents a direct
  `PROBE_URL=... node <probe>` invocation (canvas-multi-selection, jjodie-dock, jjodie-s4b, jjodie-s4c) received the
  same `PROBE_URL` this way; the runner differs (tsx vs `node --experimental-strip-types`), the target does not.
- Probe logs: `~/.jjodel-lanes/P-2026-10-24-0431/probe-<name>.log`. PASS/FAIL counts are `grep -c` of lines starting
  with `PASS` / `FAIL` over the complete log, cross-checked with the probe's `EXIT=` line.

## Results

| Command or probe | Result | Failing assertions (message) |
|---|---|---|
| `npm run typecheck` | exit 0, no `error TS` | — |
| `npx vitest run` | 422 files pass, 9 fail; 11904 tests pass | the 9 failed files are exactly the CLAUDE.md §17 known list (`window is not defined` at import); no other red |
| `npm run build` | ok, built in 1m 34s | only the pre-existing chunk-size warning |
| `npm run smoke` (cold server, 3 runs) | RED, 10 passed / 1 failed | `empty-project`: `FAIL setup did not complete — state not reached`, `pageerror: SETUP FAILED: page.goto: Timeout 30000ms exceeded.` |
| `npm run smoke` (2nd run, same server) | GREEN, 12 passed / 0 failed / 3 skipped, exit 0 | — (3 skips are the declared coverage gaps of `empty-project`) |
| `npm run check:scripts` | PASS, 127 files | — |
| `npm run check:docs` | 5/5 PASS, 42 warnings | — |
| `canvas-multi-selection.ts` | 8/8 PASS, EXIT=0, page errors [] | — |
| `jjodie-dock.ts` | 35/35 PASS, EXIT=0 | — |
| `jjodie-s1b-header-composer.ts` | 33/33 PASS, EXIT=0 | — |
| `jjodie-s3c-jjel-live.ts` | 23/23 PASS, EXIT=0, no page errors | — |
| `jjodie-s4b-ghost-preview.ts` | 19/19 PASS, EXIT=0 | — (see F3 on the count) |
| `jjodie-s4c-apply-undo.ts` | 10/10 PASS, `PROBE: ALL PASS`, EXIT=0 | — |
| `jjodie-s2-script-card.ts` | 25/26, EXIT=1, `1 FAILURE(S)` | `Edit script and Open as file disabled, tooltip Coming in this release` — measured `[{"text":"Edit script","disabled":false,"title":"Edit the script, with a live preview"},{"text":"Open as file","disabled":false,"title":"Store the script as a project file and open it"}]` |
| `jjodie-s5-script-editor.ts` | 21/21 PASS, EXIT=0 | — |
| `jjodie-s6a-script-file.ts` | 13/13 PASS, `DONE failures=0`, EXIT=0 | — |
| `jjodie-s6b-scripts-listing.ts` | 17/17 PASS, `DONE failures=0`, EXIT=0 | — |

## Findings

### F1 — smoke RED only on the first state of a cold dev server (environmental)

*Measured.* Three runs, each on a freshly started vite, failed the same way on the first state only:
`empty-project NOT REACHED`, `page.goto: Timeout 30000ms exceeded.` The second and third states passed every
assertion in all three. A fourth run against the same server instance as the third, immediately after it, was
GREEN with exit 0. The goto that times out is the first navigation of the run:

- `frontend/scripts/smoke/states.ts:196` — `await page.goto(\`${BASE_URL}/#/allProjects\`, { waitUntil: 'domcontentloaded' });`

Hypothesis (not measured further): `domcontentloaded` waits for the module graph, and a just-started vite transforms
it on first request in more than 30 s on this machine; the dependency cache in `/tmp` survives restarts, the
in-memory transform cache does not. Causa (g). The app is not implicated: the same state passes once the server is
warm. The run also reported `IMPROVED: ... wrong project setup in navbar ... 3 -> 0, remove from the baseline` for the
console baseline; recorded, not acted on.

### F2 — S2 probe assertion made stale by S5

*Measured.* The only failing probe assertion is S2's check that the card's two actions are disabled:

- `frontend/scripts/probe/jjodie-s2-script-card.ts:235` — `check('Edit script and Open as file disabled, tooltip Coming in this release', ['Edit script', 'Open as file'].every((k) => act[k]?.disabled && act[k]?.title === 'Coming in this release'), ...`

The tip enables both, by design of S5:

- `frontend/src/components/Jodie/ScriptCard.tsx:175` — `<button type="button" className="jj-script-card__action" onClick={onEdit} title="Edit the script, with a live preview">`
- `frontend/src/components/Jodie/ScriptCard.tsx:178` — `<button type="button" className="jj-script-card__action" onClick={onOpenAsFile} title="Store the script as a project file and open it">`

`git log -S` on both titles over `frontend/src` returns one commit, `065a03a8a feat(jjodie): edit the generated
script with a live preview` (S5). The S5 log entry (*read*, `docs/log-inbox/jjodie-ui-s5.md:11`) states "Edit script
and Open as file enabled on the card". The S2 probe was last touched in `4f32c8433` (S2) and was not updated by S5.
This is a stale probe expectation, not a product regression: the other 25 S2 assertions pass on the tip.

### F3 — S4b probe count differs from its lane's report

*Measured / read.* The S4b probe prints 19 PASS lines; the S4p lane entry (*read*, `docs/log-inbox/jjodie-ui-s4p.md:19`)
reports "Final run 22/22 on 3012". The probe file has a single commit (`790efc32c`) and 19 `check(` call sites, none
inside a loop (search: `grep -n -E "^\s{8,}check\(|^\s*for \(|forEach"` over the file, which returned the loop lines
54, 169, 172, 178, 236, 240, 270, 317 and the two nested checks 289, 299, both outside loops). So 19/19 is every
assertion the committed probe makes; the 22 was counted on another version or included non-PASS lines. Not a failure.

The probe also writes its JSON and crops to `~/.jjodel-lanes/P-2026-10-24-0255` by default
(`frontend/scripts/probe/jjodie-s4b-ghost-preview.ts:20`, `S4P_OUT lane folder (default ~/.jjodel-lanes/P-2026-10-24-0255)`),
so this run overwrote that lane's crops; `S4P_OUT` was not set because the header's invocation does not set it.

## Tickets

- **T1 (low, S5, P-2026-10-24-0350)** — `jjodie-s2-script-card.ts:235` still expects Edit script and Open as file
  disabled with `Coming in this release`; S5 (`065a03a8a`) enabled both. Update the S2 probe assertion to the S5
  behaviour (enabled, the two new titles) or drop it in favour of the S5 probe's coverage.
- **T2 (low, harness)** — `npm run smoke` goes RED on the first state against a freshly started dev server
  (`states.ts:196` goto, 30 s timeout); green once warm. A warm-up navigation or a longer first-goto timeout in the
  smoke harness would stop it reading as an app failure.

## Dependencies and risks

- The probes and the smoke each drove a fresh browser profile and imported their own fixtures; nothing was written
  under `frontend/src` or to the probes. The gitignored scratch config `_tmp_lane_vite_3010.config.ts` is left in
  place, as lane-run leaves its own.
- Not exercised by any probe: Ask Jjodie to review (calls the LLM), as in S5.

## Open questions

1. Should T1 be fixed by updating S2's assertion, or by retiring it since S5's probe covers the enabled buttons?
2. Should the smoke harness warm the server (T2), or is a second run the accepted procedure after a cold start?
